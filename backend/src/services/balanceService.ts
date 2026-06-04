import mongoose from 'mongoose'
import { BalanceTopUp } from '../models/BalanceTopUp'
import { notify } from '../models/Notification'
import { SubscriptionTransaction } from '../models/SubscriptionTransaction'
import { User } from '../models/User'

/**
 * Core money logic for the manual balance system. All balance mutations happen
 * here so they stay consistent, idempotent and (where it matters) transactional.
 */

export const PLANS = {
  monthly: { days: 30, price: () => Number(process.env.PRICE_MONTHLY || 60000) },
  yearly: { days: 365, price: () => Number(process.env.PRICE_YEARLY || 550000) },
} as const
export type PlanId = keyof typeof PLANS

export const MIN_TOPUP = 10000

/**
 * Approve a pending top-up and credit the user's balance — idempotent.
 * Re-approving an already-approved request does NOT credit again. Runs inside a
 * transaction when the connection supports it (replica set), else best-effort.
 *
 * `reviewer` may be an admin user id (panel) and/or a telegram id (bot).
 */
export async function approveTopUp(
  topUpId: string,
  reviewer: { adminId?: string; telegramId?: string }
): Promise<{ ok: boolean; reason?: string; amount?: number; newBalance?: number; userId?: string }> {
  const session = await startSessionSafe()
  try {
    const result = await runMaybeTxn(session, async (s) => {
      const topUp = await BalanceTopUp.findById(topUpId).session(s ?? null)
      if (!topUp) return { ok: false, reason: 'not_found' }
      if (topUp.status === 'approved') return { ok: false, reason: 'already_approved' }
      if (topUp.status === 'rejected') return { ok: false, reason: 'already_rejected' }

      // Atomically flip pending -> approved so two concurrent approvals can't both win.
      const flipped = await BalanceTopUp.findOneAndUpdate(
        { _id: topUp._id, status: 'pending' },
        {
          status: 'approved',
          reviewedAt: new Date(),
          ...(reviewer.adminId ? { reviewedByAdmin: reviewer.adminId } : {}),
          ...(reviewer.telegramId ? { reviewedByTelegramId: reviewer.telegramId } : {}),
        },
        { new: true, session: s ?? undefined }
      )
      if (!flipped) return { ok: false, reason: 'already_approved' }

      const user = await User.findByIdAndUpdate(
        flipped.user,
        { $inc: { balance: flipped.amount } },
        { new: true, session: s ?? undefined }
      )
      if (!user) return { ok: false, reason: 'user_not_found' }

      return { ok: true, amount: flipped.amount, newBalance: user.balance, userId: String(user._id) }
    })

    if (result.ok && result.userId) {
      await notify(result.userId, 'Balans to\'ldirildi',
        `Balansingiz ${result.amount?.toLocaleString()} so'mga to'ldirildi. Joriy balans: ${result.newBalance?.toLocaleString()} so'm.`, 'success')
    }
    return result
  } finally {
    await session?.endSession()
  }
}

/** Reject a pending top-up with a reason. No balance change. */
export async function rejectTopUp(
  topUpId: string,
  reason: string,
  reviewer: { adminId?: string; telegramId?: string }
): Promise<{ ok: boolean; reason?: string; userId?: string }> {
  const topUp = await BalanceTopUp.findOne({ _id: topUpId, status: 'pending' })
  if (!topUp) {
    const existing = await BalanceTopUp.findById(topUpId)
    return { ok: false, reason: existing ? `already_${existing.status}` : 'not_found' }
  }
  topUp.status = 'rejected'
  topUp.rejectionReason = reason || 'Sabab ko\'rsatilmagan'
  topUp.reviewedAt = new Date()
  if (reviewer.adminId) topUp.reviewedByAdmin = new mongoose.Types.ObjectId(reviewer.adminId)
  if (reviewer.telegramId) topUp.reviewedByTelegramId = reviewer.telegramId
  await topUp.save()

  await notify(topUp.user, 'To\'lovingiz rad etildi',
    `To'lovingiz rad etildi. Sabab: ${topUp.rejectionReason}. Iltimos, chekni tekshiring yoki qo'llab-quvvatlash xizmatiga murojaat qiling.`, 'error')

  return { ok: true, userId: String(topUp.user) }
}

/**
 * Buy a subscription from the user's balance. Extends an active subscription
 * from its current end date; starts from today if expired/none. Idempotent only
 * in the sense that it deducts exactly the plan price once per successful call.
 */
export async function buySubscriptionFromBalance(
  userId: string,
  plan: PlanId
): Promise<{ ok: boolean; reason?: string; balance?: number; expiresAt?: Date }> {
  if (!PLANS[plan]) return { ok: false, reason: 'invalid_plan' }
  const price = PLANS[plan].price()

  const user = await User.findById(userId)
  if (!user) return { ok: false, reason: 'user_not_found' }

  if (user.balance < price) {
    await notify(user._id, 'Mablag\' yetarli emas',
      'Balansingiz Pro obunani faollashtirish uchun yetarli emas. Iltimos, balansingizni to\'ldiring.', 'warning')
    return { ok: false, reason: 'insufficient_balance', balance: user.balance }
  }

  const now = new Date()
  const currentEnd = user.subscription?.expiresAt && user.subscription.expiresAt > now
    ? user.subscription.expiresAt
    : now
  const start = user.subscription?.expiresAt && user.subscription.expiresAt > now ? now : now
  const expiresAt = new Date(currentEnd.getTime() + PLANS[plan].days * 24 * 60 * 60 * 1000)

  const balanceBefore = user.balance
  user.balance = balanceBefore - price
  user.isPremium = true
  user.subscription = {
    plan: 'pro',
    status: 'active',
    expiresAt,
    organizationName: user.subscription?.organizationName,
  }
  await user.save()

  await SubscriptionTransaction.create({
    user: user._id, plan, amount: price, status: 'success',
    balanceBefore, balanceAfter: user.balance, startedAt: start, expiresAt,
  })

  await notify(user._id, 'Pro obuna faollashtirildi',
    `Pro obunangiz muvaffaqiyatli faollashtirildi. Amal qilish muddati: ${expiresAt.toLocaleDateString('uz')}.`, 'success')

  return { ok: true, balance: user.balance, expiresAt }
}

// ─── transaction helpers (graceful on standalone Mongo) ────────
async function startSessionSafe(): Promise<mongoose.ClientSession | null> {
  try { return await mongoose.startSession() } catch { return null }
}
async function runMaybeTxn<T>(
  session: mongoose.ClientSession | null,
  fn: (s: mongoose.ClientSession | null) => Promise<T>
): Promise<T> {
  if (!session) return fn(null)
  try {
    let out!: T
    await session.withTransaction(async () => { out = await fn(session) })
    return out
  } catch {
    // Standalone Mongo (no transactions) — run without a session.
    return fn(null)
  }
}
