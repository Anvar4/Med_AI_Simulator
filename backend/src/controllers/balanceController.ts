import { Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { BalanceTopUp } from '../models/BalanceTopUp'
import { Notification, notify } from '../models/Notification'
import { PaymentCard } from '../models/PaymentCard'
import { User } from '../models/User'
import { buySubscriptionFromBalance, MIN_TOPUP, PLANS, PlanId } from '../services/balanceService'
import { notifyAdminsOfTopUp } from '../services/telegramBot'

// ─── Public-ish: active payment cards a user can transfer to ───
// GET /api/balance/cards
export const getActiveCards = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cards = await PaymentCard.find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: 1 })
      .select('cardNumber cardHolderName bankName description sortOrder')
    res.json({ status: 'success', cards })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

// GET /api/balance/me — current balance + subscription snapshot
export const getMyBalance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!._id).select('balance subscription isPremium')
    if (!user) { res.status(404).json({ message: 'Foydalanuvchi topilmadi' }); return }
    res.json({
      status: 'success',
      balance: user.balance ?? 0,
      isPremium: user.isPremium,
      subscription: user.subscription,
      prices: { monthly: PLANS.monthly.price(), yearly: PLANS.yearly.price(), yearlyOld: Number(process.env.PRICE_YEARLY_OLD || 720000) },
    })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

// POST /api/balance/topup — create a pending top-up request
// body: { amount, cardId, receiptUrl }
export const createTopUp = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const amount = Math.round(Number(req.body.amount))
    const { cardId, receiptUrl } = req.body as { cardId?: string; receiptUrl?: string }

    if (!Number.isFinite(amount) || amount < MIN_TOPUP) {
      res.status(400).json({ message: `Minimal summa ${MIN_TOPUP.toLocaleString()} so'm` })
      return
    }
    if (!receiptUrl || typeof receiptUrl !== 'string') {
      res.status(400).json({ message: 'Chek (kvitansiya) yuklanishi shart' })
      return
    }
    const card = await PaymentCard.findOne({ _id: cardId, isActive: true })
    if (!card) { res.status(400).json({ message: 'Karta tanlanmagan yoki faol emas' }); return }

    const topUp = await BalanceTopUp.create({
      user: req.user!._id,
      amount,
      card: card._id,
      receiptUrl,
      status: 'pending',
    })

    await notify(req.user!._id, 'To\'lov arizangiz qabul qilindi',
      'To\'lov arizangiz qabul qilindi. Admin tomonidan 2–3 soat ichida tekshiriladi.', 'info')

    // Fire-and-forget Telegram notification (never blocks the response).
    notifyAdminsOfTopUp(topUp._id.toString()).catch(() => {})

    res.status(201).json({ status: 'success', message: 'Arizangiz tekshiruvga yuborildi', topUpId: topUp._id })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

// GET /api/balance/topups — the user's own top-up history
export const getMyTopUps = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const topups = await BalanceTopUp.find({ user: req.user!._id })
      .populate('card', 'cardNumber bankName')
      .sort({ createdAt: -1 })
      .limit(50)
    res.json({ status: 'success', topups })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

// POST /api/balance/subscribe — buy a subscription from balance
// body: { plan: 'monthly' | 'yearly' }
export const subscribeFromBalance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const plan = req.body.plan as PlanId
    if (plan !== 'monthly' && plan !== 'yearly') {
      res.status(400).json({ message: 'Noto\'g\'ri tarif' })
      return
    }
    const result = await buySubscriptionFromBalance(req.user!._id.toString(), plan)
    if (!result.ok) {
      if (result.reason === 'insufficient_balance') {
        res.status(400).json({
          message: 'Hisobingizda mablag\' yetarli emas. Iltimos, balansingizni to\'ldiring. Aks holda Pro obuna faollashmaydi.',
          balance: result.balance,
          insufficient: true,
        })
        return
      }
      res.status(400).json({ message: 'Obunani faollashtirib bo\'lmadi' })
      return
    }
    res.json({ status: 'success', message: 'Pro obunangiz muvaffaqiyatli faollashtirildi.', balance: result.balance, expiresAt: result.expiresAt })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

// ─── Notifications ─────────────────────────────────────────────
// GET /api/balance/notifications
export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [items, unread] = await Promise.all([
      Notification.find({ user: req.user!._id }).sort({ createdAt: -1 }).limit(50),
      Notification.countDocuments({ user: req.user!._id, isRead: false }),
    ])
    res.json({ status: 'success', notifications: items, unread })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

// POST /api/balance/notifications/read — mark all (or one) as read
export const markNotificationsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.body as { id?: string }
    const filter: Record<string, unknown> = { user: req.user!._id, isRead: false }
    if (id) filter._id = id
    await Notification.updateMany(filter, { isRead: true })
    res.json({ status: 'success' })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}
