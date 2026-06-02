import { Request, Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { activateSubscriptionFromPayment } from './subscriptionController'
import { Case } from '../models/Case'
import { CaseAttempt } from '../models/CaseAttempt'
import { Category } from '../models/Category'
import { PaymentRequest } from '../models/PaymentRequest'
import { PromoCode } from '../models/PromoCode'
import { User } from '../models/User'

// ─── Payment requests (manual confirmation flow) ───────────────

// GET /api/admin/payments?status=pending
export const getPaymentRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, page = '1', limit = '20' } = req.query
    const filter: Record<string, unknown> = {}
    if (status && typeof status === 'string') filter.status = status

    const pageNum = Math.max(1, parseInt(page as string))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)))

    const [requests, total] = await Promise.all([
      PaymentRequest.find(filter)
        .populate('user', 'name email username')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      PaymentRequest.countDocuments(filter),
    ])

    res.json({ status: 'success', total, totalPages: Math.ceil(total / limitNum), requests })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

// POST /api/admin/payments/:id/confirm  body: { note?, providerTransactionId? }
export const confirmPaymentRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pr = await PaymentRequest.findById(req.params.id)
    if (!pr) {
      res.status(404).json({ message: 'To\'lov so\'rovi topilmadi' })
      return
    }
    if (pr.status !== 'pending') {
      res.status(400).json({ message: `Bu so'rov allaqachon "${pr.status}" holatida` })
      return
    }

    pr.status = 'paid'
    pr.paidAt = new Date()
    pr.paidAmount = pr.amount
    pr.confirmedBy = req.user!._id
    if (typeof req.body.note === 'string') pr.note = req.body.note
    if (typeof req.body.providerTransactionId === 'string') {
      pr.providerTransactionId = req.body.providerTransactionId
    }
    await pr.save()

    await activateSubscriptionFromPayment(pr._id.toString())

    res.json({ status: 'success', message: 'To\'lov tasdiqlandi va obuna faollashtirildi', request: pr })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

// POST /api/admin/payments/:id/reject  body: { note? }
export const rejectPaymentRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pr = await PaymentRequest.findById(req.params.id)
    if (!pr) {
      res.status(404).json({ message: 'To\'lov so\'rovi topilmadi' })
      return
    }
    if (pr.status !== 'pending') {
      res.status(400).json({ message: `Bu so'rov allaqachon "${pr.status}" holatida` })
      return
    }
    pr.status = 'cancelled'
    pr.confirmedBy = req.user!._id
    if (typeof req.body.note === 'string') pr.note = req.body.note
    await pr.save()
    res.json({ status: 'success', message: 'To\'lov so\'rovi rad etildi', request: pr })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

// ─── System stats ──────────────────────────────────────────────
export const getSystemStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [totalUsers, totalCases, totalAttempts, activeUsers, premiumUsers] = await Promise.all([
      User.countDocuments(),
      Case.countDocuments({ status: 'published' }),
      CaseAttempt.countDocuments(),
      User.countDocuments({ updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
      User.countDocuments({ isPremium: true }),
    ])

    const newUsersThisWeek = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    })

    const newUsersLastWeek = await User.countDocuments({
      createdAt: {
        $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    })

    const avgScore = await CaseAttempt.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, avg: { $avg: '$score' } } },
    ])

    const casesByCategory = await Case.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ])

    const casesByType = await Case.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ])

    res.json({
      status: 'success',
      stats: {
        totalUsers,
        totalCases,
        totalAttempts,
        activeUsers,
        premiumUsers,
        newUsersThisWeek,
        userGrowth: newUsersLastWeek > 0 ? Math.round(((newUsersThisWeek - newUsersLastWeek) / newUsersLastWeek) * 100) : 0,
        avgScore: Math.round(avgScore[0]?.avg || 0),
        casesByCategory,
        casesByType,
      },
    })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

// ─── List users ────────────────────────────────────────────────
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, role, page = '1', limit = '20' } = req.query

    const filter: Record<string, unknown> = {}
    if (role && role !== 'all') filter.role = role as string
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
      ]
    }

    const pageNum = Math.max(1, parseInt(page as string))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)))

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      User.countDocuments(filter),
    ])

    res.json({
      status: 'success',
      users,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

// ─── Get single user ───────────────────────────────────────────
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).select('-password')
    if (!user) {
      res.status(404).json({ message: 'Foydalanuvchi topilmadi' })
      return
    }
    const attempts = await CaseAttempt.countDocuments({ user: user._id, status: 'completed' })
    res.json({ status: 'success', user, attempts })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

// ─── Create user (admin creates content-manager) ───────────────
export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, username, password, role, specialty, university } = req.body

    if (!firstName || !lastName || !email || !username || !password || !role) {
      res.status(400).json({ message: "Barcha majburiy maydonlar to'ldirilishi shart" })
      return
    }

    const allowedRoles = ['student', 'instructor', 'admin']
    if (!allowedRoles.includes(role)) {
      res.status(400).json({ message: "Noto'g'ri rol" })
      return
    }

    const emailExists = await User.findOne({ email: email.toLowerCase().trim() })
    if (emailExists) {
      res.status(400).json({ message: "Bu email allaqachon ro'yxatdan o'tgan" })
      return
    }

    const usernameExists = await User.findOne({ username: username.toLowerCase().trim() })
    if (usernameExists) {
      res.status(400).json({ message: 'Bu login allaqachon band' })
      return
    }

    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      name: `${firstName.trim()} ${lastName.trim()}`,
      email: email.toLowerCase().trim(),
      username: username.toLowerCase().trim(),
      password,
      role,
      specialty: specialty?.trim(),
      university: university?.trim(),
      isEmailVerified: true,
    })

    res.status(201).json({
      status: 'success',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

// ─── Update user ───────────────────────────────────────────────
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, isPremium, isActive } = req.body

    const update: Record<string, unknown> = {}
    if (role !== undefined) update.role = role
    if (isPremium !== undefined) {
      update.isPremium = isPremium
      if (isPremium) {
        update['subscription.plan'] = 'pro'
        update['subscription.status'] = 'active'
      } else {
        update['subscription.plan'] = 'free'
      }
    }
    if (isActive !== undefined) update.isActive = isActive

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password')
    if (!user) {
      res.status(404).json({ message: 'Foydalanuvchi topilmadi' })
      return
    }

    res.json({ status: 'success', user })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

// ─── Delete user ───────────────────────────────────────────────
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findByIdAndDelete(req.params.id)
    if (!user) {
      res.status(404).json({ message: 'Foydalanuvchi topilmadi' })
      return
    }
    res.json({ status: 'success', message: "Foydalanuvchi o'chirildi" })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

// ─── Generate promo codes ──────────────────────────────────────
function generateRandomCode(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export const generatePromoCodes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, duration, count, maxUses, organizationName, expiresInDays } = req.body

    if (!type || !duration || !count) {
      res.status(400).json({ message: "Tur, muddat va soni kiritilishi shart" })
      return
    }

    const codesCount = Math.min(500, Math.max(1, parseInt(count)))
    const durationMonths = Math.max(1, parseInt(duration))
    const maxUsesPerCode = Math.max(1, parseInt(maxUses || '1'))
    const expiryDays = Math.max(1, parseInt(expiresInDays || '365'))

    const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)

    const codes: string[] = []
    const inserted: { code: string; type: string; duration: number; maxUses: number; organizationName: string; expiresAt: Date }[] = []

    let attempts = 0
    while (codes.length < codesCount && attempts < codesCount * 3) {
      attempts++
      const code = generateRandomCode()
      if (codes.includes(code)) continue
      const exists = await PromoCode.findOne({ code })
      if (exists) continue
      codes.push(code)
      inserted.push({
        code,
        type,
        duration: durationMonths,
        maxUses: maxUsesPerCode,
        organizationName: organizationName || '',
        expiresAt,
      })
    }

    const promoCodes = await PromoCode.insertMany(
      inserted.map(c => ({ ...c, createdBy: req.user!._id }))
    )

    res.status(201).json({
      status: 'success',
      count: promoCodes.length,
      codes: promoCodes,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

// ─── List promo codes ──────────────────────────────────────────
export const getPromoCodes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, isActive, page = '1', limit = '50' } = req.query
    const filter: Record<string, unknown> = {}
    if (type) filter.type = type
    if (isActive !== undefined) filter.isActive = isActive === 'true'

    const pageNum = Math.max(1, parseInt(page as string))
    const limitNum = Math.min(500, Math.max(1, parseInt(limit as string)))

    const [codes, total] = await Promise.all([
      PromoCode.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .populate('createdBy', 'name username'),
      PromoCode.countDocuments(filter),
    ])

    res.json({
      status: 'success',
      codes,
      total,
      totalPages: Math.ceil(total / limitNum),
    })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

// ─── Export promo codes as CSV ─────────────────────────────────
export const exportPromoCodes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, isActive } = req.query
    const filter: Record<string, unknown> = {}
    if (type) filter.type = type
    if (isActive !== undefined) filter.isActive = isActive === 'true'

    const codes = await PromoCode.find(filter).sort({ createdAt: -1 })

    const typeLabels: Record<string, string> = { pro: 'Pro', clinic: 'Klinika', university: 'Universitet' }
    const header = 'Promokod,Tur,Muddat (oy),Max foydalanish,Ishlatilgan,Tashkilot,Yaroqlilik muddati,Holat\n'
    const rows = codes.map(c =>
      [
        c.code,
        typeLabels[c.type] || c.type,
        c.duration,
        c.maxUses,
        c.usedCount,
        c.organizationName || '',
        c.expiresAt.toISOString().split('T')[0],
        c.isActive && c.expiresAt > new Date() ? 'Faol' : 'Yaroqsiz',
      ].join(',')
    )

    const csv = header + rows.join('\n')

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="promokodlar.csv"')
    res.send('\uFEFF' + csv) // BOM for Excel UTF-8
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

// ─── Get recent activity ───────────────────────────────────────
export const getRecentActivity = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [recentUsers, recentAttempts] = await Promise.all([
      User.find()
        .select('name email role createdAt isPremium')
        .sort({ createdAt: -1 })
        .limit(10),
      CaseAttempt.find({ status: 'completed' })
        .populate('user', 'name email')
        .populate('case', 'title category')
        .sort({ completedAt: -1 })
        .limit(10),
    ])

    res.json({
      status: 'success',
      recentUsers,
      recentAttempts,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

// ─── Categories ────────────────────────────────────────────────
export const getCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await Category.find().sort({ name: 1 })
    res.json({ status: 'success', categories })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body
    if (!name || !name.trim()) {
      res.status(400).json({ message: 'Turkum nomi kiritilishi shart' })
      return
    }
    const existing = await Category.findOne({ name: name.trim() })
    if (existing) {
      res.status(400).json({ message: 'Bu turkum allaqachon mavjud' })
      return
    }
    const category = await Category.create({ name: name.trim() })
    res.status(201).json({ status: 'success', category })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id)
    if (!category) {
      res.status(404).json({ message: 'Turkum topilmadi' })
      return
    }
    res.json({ status: 'success', message: "Turkum o'chirildi" })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body
    if (!name || !name.trim()) {
      res.status(400).json({ message: 'Turkum nomi kiritilishi shart' })
      return
    }
    const existing = await Category.findOne({ name: name.trim(), _id: { $ne: req.params.id } })
    if (existing) {
      res.status(400).json({ message: 'Bu nom allaqachon mavjud' })
      return
    }
    const category = await Category.findByIdAndUpdate(req.params.id, { name: name.trim() }, { new: true })
    if (!category) {
      res.status(404).json({ message: 'Turkum topilmadi' })
      return
    }
    res.json({ status: 'success', category })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

// ─── Admin analytics (problem areas) ──────────────────────────
export const getAdminAnalytics = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [categoryMatrix, categoryAvgScores, reviewQueue, statusCounts] = await Promise.all([
      // Cases count per category per type
      Case.aggregate([
        {
          $group: {
            _id: { category: '$category', type: '$type' },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: '$_id.category',
            types: { $push: { type: '$_id.type', count: '$count' } },
            total: { $sum: '$count' },
          },
        },
        { $sort: { total: -1 } },
      ]),
      // Average score per category from attempts
      CaseAttempt.aggregate([
        { $match: { status: 'completed' } },
        { $lookup: { from: 'cases', localField: 'case', foreignField: '_id', as: 'caseData' } },
        { $unwind: '$caseData' },
        {
          $group: {
            _id: '$caseData.category',
            avgScore: { $avg: '$score' },
            count: { $sum: 1 },
          },
        },
        { $sort: { avgScore: 1 } },
      ]),
      // Cases pending review (oldest first)
      Case.find({ status: 'review' })
        .select('caseId title category type difficulty status createdAt')
        .sort({ createdAt: 1 })
        .limit(30),
      // Cases by status counts
      Case.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ])

    // Build category matrix with type breakdown
    const matrix = categoryMatrix.map((cat: { _id: string; types: { type: string; count: number }[]; total: number }) => {
      const typeMap: Record<string, number> = {}
      cat.types.forEach((t: { type: string; count: number }) => { typeMap[t.type] = t.count })
      const score = categoryAvgScores.find((s: { _id: string }) => s._id === cat._id)
      return {
        category: cat._id,
        total: cat.total,
        diagnostika: typeMap['diagnostika'] ?? 0,
        jarrohlik: typeMap['jarrohlik'] ?? 0,
        shoshilinch: typeMap['shoshilinch'] ?? 0,
        avgScore: score ? Math.round(score.avgScore) : null,
        attemptCount: score?.count ?? 0,
      }
    })

    const statusMap: Record<string, number> = {}
    statusCounts.forEach((s: { _id: string; count: number }) => { statusMap[s._id] = s.count })

    res.json({
      status: 'success',
      analytics: {
        categoryMatrix: matrix,
        reviewQueue,
        statusCounts: {
          draft: statusMap['draft'] ?? 0,
          review: statusMap['review'] ?? 0,
          published: statusMap['published'] ?? 0,
          rejected: statusMap['rejected'] ?? 0,
        },
      },
    })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}
