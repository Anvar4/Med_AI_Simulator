import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Case } from '../models/Case';
import { Category } from '../models/Category';
import { escapeRegex, resolveCaseStatus, stripProtectedFields } from './caseSecurity';

const INSTRUMENTAL_TESTS = ['ekg', 'uzi', 'rentgen', 'kt', 'mrt', 'endoskopiya'] as const
const LABORATORY_TESTS = ['qon_analiz', 'siydik_analiz', 'bioximik'] as const

function sanitizeEnumList<T extends string>(input: unknown, allowed: readonly T[]): T[] {
  if (!Array.isArray(input)) return []
  const allowedSet = new Set(allowed)
  const unique = new Set<string>()

  for (const value of input) {
    if (typeof value !== 'string') continue
    const normalized = value.trim() as T
    if (allowedSet.has(normalized)) unique.add(normalized)
  }

  return Array.from(unique) as T[]
}

export const getAllCases = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      category,
      type,
      difficulty,
      search,
      status,
      withMedia,
      page = '1',
      limit = '12',
    } = req.query

    const filter: Record<string, unknown> = {}

    if (category && category !== 'Barchasi') {
      filter.category = category as string
    }
    if (type && type !== 'all') {
      filter.type = type as string
    }
    if (difficulty) {
      filter.difficulty = Number(difficulty)
    }
    if (search) {
      filter.title = { $regex: escapeRegex(search as string), $options: 'i' }
    }
    if (status) {
      filter.status = status as string
    }
    if (withMedia === 'true' || withMedia === '1') {
      filter['mediaItems.0'] = { $exists: true }
    }

    const pageNum = Math.max(1, parseInt(page as string))
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)))
    const skip = (pageNum - 1) * limitNum

    const [cases, total] = await Promise.all([
      Case.find(filter)
        .select('-correctDiagnosis -correctTreatment')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Case.countDocuments(filter),
    ])

    res.json({
      status: 'success',
      results: cases.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      cases,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

export const getCaseById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string
    // Support both MongoDB _id and custom caseId
    const caseData = /^[0-9a-fA-F]{24}$/.test(id)
      ? await Case.findById(id)
      : await Case.findOne({ caseId: id })

    if (!caseData) {
      res.status(404).json({ message: 'Keys topilmadi' })
      return
    }

    const responseCase = caseData.toObject() as unknown as Record<string, unknown>

    const user = req.user
    const isStaff = user?.role === 'admin' || user?.role === 'instructor'

    // SECURITY: never expose the correct answers when serving a case for solving.
    // Staff (admin/instructor) may see them for editing/review; everyone else
    // only gets them back through the attempt-submit evaluation result.
    if (!isStaff) {
      delete responseCase.correctDiagnosis
      delete responseCase.correctTreatment
    }

    // Premium gating: non-premium, non-staff users get a locked preview of
    // premium cases (no media / labs / patient detail) so they can't bypass
    // the paywall by hitting the API directly.
    const isPremiumUser = !!user?.isPremium
    if (caseData.isPremium && !isPremiumUser && !isStaff) {
      responseCase.locked = true
      delete responseCase.mediaItems
      delete responseCase.labResults
      delete responseCase.bloodTest
      delete responseCase.biochemTest
      delete responseCase.urineTest
    }

    res.json({
      status: 'success',
      case: responseCase,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

export const getCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [categoryDocs, typeCounts, categoryCounts] = await Promise.all([
      Category.find().sort({ name: 1 }).select('name'),
      Case.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]),
      Case.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
    ])

    res.json({
      status: 'success',
      categories: categoryDocs.map(c => c.name),
      typeCounts,
      categoryCounts,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

export const createCase = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const mediaItems = Array.isArray(req.body.mediaItems) ? req.body.mediaItems : []
    if (mediaItems.length === 0) {
      res.status(400).json({ message: 'Har bir klinik holat uchun kamida bitta rasm yoki grafik media bo\'lishi shart' })
      return
    }

    const authorName = typeof req.body.authorName === 'string' && req.body.authorName.trim().length > 0
      ? req.body.authorName.trim()
      : (req.user?.name || '').trim()

    if (!authorName) {
      res.status(400).json({ message: 'Muallif nomi majburiy' })
      return
    }

    const instrumentalTests = sanitizeEnumList(req.body.instrumentalTests, INSTRUMENTAL_TESTS)
    const laboratoryTests = sanitizeEnumList(req.body.laboratoryTests, LABORATORY_TESTS)

    const payload: Record<string, unknown> = { ...req.body }
    stripProtectedFields(payload)

    // Status is server-controlled. Only admins may publish directly; instructors
    // may only create drafts or submit for review (draft -> review workflow).
    const isAdmin = req.user!.role === 'admin'
    const status = resolveCaseStatus(isAdmin, req.body.status, 'published')

    const caseData = {
      ...payload,
      createdBy: req.user!._id,
      authorName,
      instrumentalTests,
      laboratoryTests,
      status,
    }

    const newCase = await Case.create(caseData)

    res.status(201).json({
      status: 'success',
      case: newCase,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

export const updateCase = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string
    const filter = /^[0-9a-fA-F]{24}$/.test(id) ? { _id: id } : { caseId: id }

    const existing = await Case.findOne(filter)
    if (!existing) {
      res.status(404).json({ message: 'Keys topilmadi' })
      return
    }

    const isAdmin = req.user!.role === 'admin'

    // Ownership check: instructors may only edit cases they created.
    if (!isAdmin && existing.createdBy?.toString() !== req.user!._id.toString()) {
      res.status(403).json({ message: 'Bu klinik holatni tahrirlash huquqiga ega emassiz' })
      return
    }

    const payload: Record<string, unknown> = { ...req.body }
    // Strip fields that must never be set directly by the client.
    stripProtectedFields(payload)

    if (Array.isArray(payload.mediaItems) && payload.mediaItems.length === 0) {
      res.status(400).json({ message: 'Klinik holatda media bo\'limi bo\'sh bo\'lishi mumkin emas' })
      return
    }

    if ('instrumentalTests' in payload) {
      payload.instrumentalTests = sanitizeEnumList(payload.instrumentalTests, INSTRUMENTAL_TESTS)
    }

    if ('laboratoryTests' in payload) {
      payload.laboratoryTests = sanitizeEnumList(payload.laboratoryTests, LABORATORY_TESTS)
    }

    // Status transitions: only admins may move to/keep `published` or `rejected`.
    // Instructors are limited to draft <-> review on their own cases. When no
    // valid/permitted status is requested, the existing status is preserved.
    if (typeof req.body.status === 'string') {
      if (isAdmin) {
        if (['draft', 'review', 'published', 'rejected'].includes(req.body.status)) {
          payload.status = req.body.status
        }
      } else if (req.body.status === 'review' || req.body.status === 'draft') {
        payload.status = req.body.status
      }
    }

    const updated = await Case.findOneAndUpdate(
      filter,
      payload,
      { new: true, runValidators: true }
    )

    res.json({ status: 'success', case: updated })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

export const deleteCase = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string
    const filter = /^[0-9a-fA-F]{24}$/.test(id) ? { _id: id } : { caseId: id }
    const deleted = await Case.findOneAndDelete(filter)

    if (!deleted) {
      res.status(404).json({ message: 'Keys topilmadi' })
      return
    }

    res.json({ status: 'success', message: 'Keys o\'chirildi' })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

export const getCMCases = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      category,
      search,
      page = '1',
      limit = '200',
    } = req.query

    const filter: Record<string, unknown> = { createdBy: req.user!._id }

    if (category && category !== 'Barchasi') {
      filter.category = category as string
    }
    if (search) {
      filter.title = { $regex: escapeRegex(search as string), $options: 'i' }
    }

    const pageNum = Math.max(1, parseInt(page as string))
    const limitNum = Math.min(200, Math.max(1, parseInt(limit as string)))
    const skip = (pageNum - 1) * limitNum

    const [cases, total] = await Promise.all([
      Case.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Case.countDocuments(filter),
    ])

    res.json({
      status: 'success',
      results: cases.length,
      total,
      cases,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

export const getCMStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id

    const [categoryStats, statusStats, totalCount] = await Promise.all([
      Case.aggregate([
        { $match: { createdBy: userId } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            avgDifficulty: { $avg: '$difficulty' },
            published: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } },
            draft: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
            review: { $sum: { $cond: [{ $eq: ['$status', 'review'] }, 1, 0] } },
          },
        },
        { $sort: { count: -1 } },
      ]),
      Case.aggregate([
        { $match: { createdBy: userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Case.countDocuments({ createdBy: userId }),
    ])

    res.json({
      status: 'success',
      stats: {
        total: totalCount,
        categoryStats,
        statusStats,
      },
    })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}
