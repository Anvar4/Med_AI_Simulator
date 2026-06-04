import { Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { BalanceTopUp } from '../models/BalanceTopUp'
import { PaymentCard } from '../models/PaymentCard'
import { approveTopUp, rejectTopUp } from '../services/balanceService'

// ─── Payment cards CRUD (admin) ────────────────────────────────
export const listCards = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cards = await PaymentCard.find().sort({ sortOrder: 1, createdAt: 1 })
    res.json({ status: 'success', cards })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

export const createCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { cardNumber, cardHolderName, bankName, description, sortOrder, isActive } = req.body
    if (!cardNumber || !cardHolderName || !bankName) {
      res.status(400).json({ message: 'Karta raqami, egasi va bank nomi majburiy' })
      return
    }
    const card = await PaymentCard.create({
      cardNumber: String(cardNumber).trim(),
      cardHolderName: String(cardHolderName).trim(),
      bankName: String(bankName).trim(),
      description: typeof description === 'string' ? description : undefined,
      sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
      isActive: isActive !== false,
    })
    res.status(201).json({ status: 'success', card })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

export const updateCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const allowed = ['cardNumber', 'cardHolderName', 'bankName', 'description', 'sortOrder', 'isActive']
    const updates: Record<string, unknown> = {}
    for (const f of allowed) if (req.body[f] !== undefined) updates[f] = req.body[f]
    const card = await PaymentCard.findByIdAndUpdate(req.params.id, updates, { new: true })
    if (!card) { res.status(404).json({ message: 'Karta topilmadi' }); return }
    res.json({ status: 'success', card })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

export const deleteCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const card = await PaymentCard.findByIdAndDelete(req.params.id)
    if (!card) { res.status(404).json({ message: 'Karta topilmadi' }); return }
    res.json({ status: 'success', message: 'Karta o\'chirildi' })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

// ─── Top-up requests (admin) ───────────────────────────────────
// GET /api/admin/topups?status=pending
export const listTopUps = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, page = '1', limit = '20' } = req.query
    const filter: Record<string, unknown> = {}
    if (status && typeof status === 'string') filter.status = status
    const pageNum = Math.max(1, parseInt(page as string))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)))

    const [topups, total] = await Promise.all([
      BalanceTopUp.find(filter)
        .populate('user', 'name email phone username')
        .populate('card', 'cardNumber cardHolderName bankName')
        .populate('reviewedByAdmin', 'name')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      BalanceTopUp.countDocuments(filter),
    ])
    res.json({ status: 'success', total, totalPages: Math.ceil(total / limitNum), topups })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

// POST /api/admin/topups/:id/approve
export const approveTopUpAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await approveTopUp(String(req.params.id), { adminId: req.user!._id.toString() })
    if (!result.ok) {
      res.status(400).json({ message: mapTopUpReason(result.reason) })
      return
    }
    res.json({ status: 'success', message: 'Tasdiqlandi va balans to\'ldirildi', newBalance: result.newBalance })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

// POST /api/admin/topups/:id/reject  body: { reason }
export const rejectTopUpAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reason = typeof req.body.reason === 'string' ? req.body.reason : ''
    const result = await rejectTopUp(String(req.params.id), reason, { adminId: req.user!._id.toString() })
    if (!result.ok) {
      res.status(400).json({ message: mapTopUpReason(result.reason) })
      return
    }
    res.json({ status: 'success', message: 'Ariza rad etildi' })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

function mapTopUpReason(reason?: string): string {
  switch (reason) {
    case 'not_found': return 'Ariza topilmadi'
    case 'already_approved': return 'Bu ariza allaqachon tasdiqlangan'
    case 'already_rejected': return 'Bu ariza allaqachon rad etilgan'
    case 'user_not_found': return 'Foydalanuvchi topilmadi'
    default: return 'Amalni bajarib bo\'lmadi'
  }
}
