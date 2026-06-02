import { Request, Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { PaymentRequest } from '../models/PaymentRequest'
import { activateSubscriptionFromPayment } from './subscriptionController'
import {
  CLICK_ERR,
  PAYME_ERR,
  clickSignString,
  paymeAuthOk,
  signaturesMatch,
} from './paymentSignatures'

/**
 * Click + Payme payment gateway integration.
 *
 * Both providers call back into our server to confirm a payment. We verify the
 * request authenticity (Click: MD5 sign_string; Payme: Basic auth), then drive
 * the existing PaymentRequest through to `paid` and activate the subscription
 * via the shared activateSubscriptionFromPayment().
 *
 * Sandbox-ready: with no env keys configured the callbacks reject as
 * unauthorized, so this is safe to deploy before merchant onboarding. Set
 * CLICK_SERVICE_ID / CLICK_SECRET_KEY and PAYME_MERCHANT_KEY to go live.
 */

// ─── Checkout: where the user is sent to pay ───────────────────
// GET /api/payments/checkout/:paymentRequestId?provider=click|payme
export const getCheckoutUrl = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pr = await PaymentRequest.findOne({
      _id: req.params.paymentRequestId,
      user: req.user!._id,
    })
    if (!pr) {
      res.status(404).json({ message: 'To\'lov so\'rovi topilmadi' })
      return
    }
    if (pr.status !== 'pending') {
      res.status(400).json({ message: `Bu so'rov "${pr.status}" holatida` })
      return
    }

    const provider = req.query.provider === 'payme' ? 'payme' : 'click'
    const amountTiyin = pr.amount * 100 // both gateways use tiyin

    let url = ''
    if (provider === 'click') {
      const serviceId = process.env.CLICK_SERVICE_ID
      const merchantId = process.env.CLICK_MERCHANT_ID
      if (!serviceId || !merchantId) {
        res.status(503).json({ message: 'Click hozircha sozlanmagan' })
        return
      }
      const ret = encodeURIComponent(process.env.FRONTEND_URL || '')
      url = `https://my.click.uz/services/pay?service_id=${serviceId}&merchant_id=${merchantId}&amount=${pr.amount}&transaction_param=${pr._id}&return_url=${ret}`
    } else {
      const merchantId = process.env.PAYME_MERCHANT_ID
      if (!merchantId) {
        res.status(503).json({ message: 'Payme hozircha sozlanmagan' })
        return
      }
      // Payme accepts a base64-encoded `m;ac.order_id;a;c` parameter string.
      const params = `m=${merchantId};ac.order_id=${pr._id};a=${amountTiyin};c=${process.env.FRONTEND_URL || ''}`
      url = `https://checkout.paycom.uz/${Buffer.from(params).toString('base64')}`
    }

    pr.provider = provider
    await pr.save()
    res.json({ status: 'success', url, provider })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

// ─── Click callback (Prepare + Complete) ───────────────────────
// POST /api/payments/click  (application/x-www-form-urlencoded)
export const clickCallback = async (req: Request, res: Response): Promise<void> => {
  const serviceId = process.env.CLICK_SERVICE_ID || ''
  const secretKey = process.env.CLICK_SECRET_KEY || ''
  const b = req.body as Record<string, string>

  const reply = (extra: Record<string, unknown>, error: number = CLICK_ERR.SUCCESS, note = 'Success') =>
    res.json({ error, error_note: note, ...extra })

  if (!serviceId || !secretKey) {
    reply({}, CLICK_ERR.ACTION_NOT_FOUND, 'Click sozlanmagan')
    return
  }

  // Verify signature.
  const action = Number(b.action)
  const expectedSign = clickSignString({
    clickTransId: b.click_trans_id,
    serviceId,
    secretKey,
    merchantTransId: b.merchant_trans_id,
    merchantPrepareId: action === 1 ? b.merchant_prepare_id : undefined,
    amount: b.amount,
    action: b.action,
    signTime: b.sign_time,
  })
  if (!signaturesMatch(expectedSign, b.sign_string || '')) {
    reply({}, CLICK_ERR.SIGN_CHECK_FAILED, 'Imzo noto\'g\'ri')
    return
  }

  const pr = await PaymentRequest.findById(b.merchant_trans_id).catch(() => null)
  if (!pr) {
    reply({}, CLICK_ERR.TRANSACTION_NOT_FOUND, 'Buyurtma topilmadi')
    return
  }

  // Amount must match (Click sends a decimal string in so'm).
  if (Math.round(Number(b.amount)) !== Math.round(pr.amount)) {
    reply({}, CLICK_ERR.INVALID_AMOUNT, 'Summa mos emas')
    return
  }

  if (pr.status === 'cancelled' || pr.status === 'refunded') {
    reply({}, CLICK_ERR.TRANSACTION_CANCELLED, 'Bekor qilingan')
    return
  }

  if (action === 0) {
    // Prepare
    if (pr.status === 'paid') {
      reply({}, CLICK_ERR.ALREADY_PAID, 'Allaqachon to\'langan')
      return
    }
    pr.provider = 'click'
    pr.providerTransactionId = b.click_trans_id
    await pr.save()
    reply({ merchant_trans_id: String(pr._id), merchant_prepare_id: String(pr._id) })
    return
  }

  if (action === 1) {
    // Complete
    if (pr.status === 'paid') {
      reply({ merchant_trans_id: String(pr._id), merchant_confirm_id: String(pr._id) }, CLICK_ERR.ALREADY_PAID, 'Allaqachon to\'langan')
      return
    }
    pr.status = 'paid'
    pr.paidAt = new Date()
    pr.paidAmount = pr.amount
    await pr.save()
    try {
      await activateSubscriptionFromPayment(pr._id.toString())
    } catch {
      // subscription activation failure shouldn't 500 the gateway; logged elsewhere
    }
    reply({ merchant_trans_id: String(pr._id), merchant_confirm_id: String(pr._id) })
    return
  }

  reply({}, CLICK_ERR.ACTION_NOT_FOUND, 'Noma\'lum action')
}

// ─── Payme callback (JSON-RPC) ─────────────────────────────────
// POST /api/payments/payme
export const paymeCallback = async (req: Request, res: Response): Promise<Response> => {
  const merchantKey = process.env.PAYME_MERCHANT_KEY || ''
  const { id, method, params } = (req.body || {}) as {
    id?: number
    method?: string
    params?: Record<string, unknown>
  }

  const rpcError = (code: number, message: string, data?: unknown): Response =>
    res.json({ id, error: { code, message: { uz: message, ru: message, en: message }, data } })
  const rpcResult = (result: unknown): Response => res.json({ id, result })

  if (!paymeAuthOk(req.headers.authorization, merchantKey)) {
    return rpcError(PAYME_ERR.INSUFFICIENT_PRIVILEGE, 'Avtorizatsiya xatosi')
  }

  const orderId = (params?.account as Record<string, string> | undefined)?.order_id
  const amountTiyin = Number(params?.amount)

  async function findOrder() {
    if (!orderId) return null
    return PaymentRequest.findById(orderId).catch(() => null)
  }

  switch (method) {
    case 'CheckPerformTransaction': {
      const pr = await findOrder()
      if (!pr) return rpcError(PAYME_ERR.ORDER_NOT_FOUND, 'Buyurtma topilmadi')
      if (Math.round(pr.amount * 100) !== amountTiyin) {
        return rpcError(PAYME_ERR.INVALID_AMOUNT, 'Summa noto\'g\'ri')
      }
      if (pr.status === 'paid') return rpcError(PAYME_ERR.CANNOT_PERFORM, 'Allaqachon to\'langan')
      return rpcResult({ allow: true })
    }

    case 'CreateTransaction': {
      const pr = await findOrder()
      if (!pr) return rpcError(PAYME_ERR.ORDER_NOT_FOUND, 'Buyurtma topilmadi')
      if (Math.round(pr.amount * 100) !== amountTiyin) {
        return rpcError(PAYME_ERR.INVALID_AMOUNT, 'Summa noto\'g\'ri')
      }
      const txId = String(params?.id)
      // Idempotent: same Payme transaction id -> echo state.
      if (pr.providerTransactionId && pr.providerTransactionId !== txId) {
        return rpcError(PAYME_ERR.CANNOT_PERFORM, 'Boshqa tranzaksiya mavjud')
      }
      if (!pr.gateway?.createTime) {
        pr.provider = 'payme'
        pr.providerTransactionId = txId
        pr.gateway = { ...(pr.gateway || {}), transactionState: 1, createTime: Date.now() }
        await pr.save()
      }
      return rpcResult({
        create_time: pr.gateway!.createTime,
        transaction: String(pr._id),
        state: pr.gateway!.transactionState,
      })
    }

    case 'PerformTransaction': {
      const pr = await PaymentRequest.findOne({ providerTransactionId: String(params?.id) })
      if (!pr) return rpcError(PAYME_ERR.TX_NOT_FOUND, 'Tranzaksiya topilmadi')
      if (pr.gateway?.transactionState === 2) {
        return rpcResult({
          transaction: String(pr._id),
          perform_time: pr.gateway.performTime,
          state: 2,
        })
      }
      if (pr.gateway?.transactionState !== 1) {
        return rpcError(PAYME_ERR.CANNOT_PERFORM, 'Bajarib bo\'lmaydi')
      }
      const performTime = Date.now()
      pr.status = 'paid'
      pr.paidAt = new Date()
      pr.paidAmount = pr.amount
      pr.gateway = { ...pr.gateway, transactionState: 2, performTime }
      await pr.save()
      try {
        await activateSubscriptionFromPayment(pr._id.toString())
      } catch { /* gateway must still get a success reply */ }
      return rpcResult({ transaction: String(pr._id), perform_time: performTime, state: 2 })
    }

    case 'CancelTransaction': {
      const pr = await PaymentRequest.findOne({ providerTransactionId: String(params?.id) })
      if (!pr) return rpcError(PAYME_ERR.TX_NOT_FOUND, 'Tranzaksiya topilmadi')
      const cancelTime = pr.gateway?.cancelTime || Date.now()
      const newState = pr.gateway?.transactionState === 2 ? -2 : -1
      pr.status = pr.status === 'paid' ? 'refunded' : 'cancelled'
      pr.gateway = {
        ...(pr.gateway || {}),
        transactionState: newState,
        cancelTime,
        cancelReason: Number(params?.reason) || undefined,
      }
      await pr.save()
      return rpcResult({ transaction: String(pr._id), cancel_time: cancelTime, state: newState })
    }

    case 'CheckTransaction': {
      const pr = await PaymentRequest.findOne({ providerTransactionId: String(params?.id) })
      if (!pr) return rpcError(PAYME_ERR.TX_NOT_FOUND, 'Tranzaksiya topilmadi')
      return rpcResult({
        create_time: pr.gateway?.createTime || 0,
        perform_time: pr.gateway?.performTime || 0,
        cancel_time: pr.gateway?.cancelTime || 0,
        transaction: String(pr._id),
        state: pr.gateway?.transactionState || 0,
        reason: pr.gateway?.cancelReason ?? null,
      })
    }

    default:
      return rpcError(PAYME_ERR.RPC_METHOD_NOT_FOUND, 'Metod topilmadi')
  }
}
