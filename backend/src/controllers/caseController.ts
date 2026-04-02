import { Request, Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { Case } from '../models/Case'
import { Category } from '../models/Category'

export const getAllCases = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      category,
      type,
      difficulty,
      search,
      status,
      page = '1',
      limit = '12',
    } = req.query

    const filter: Record<string, string | number | { $regex: string; $options: string }> = {}

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
      filter.title = { $regex: search as string, $options: 'i' }
    }
    if (status) {
      filter.status = status as string
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

export const getCaseById = async (req: Request, res: Response): Promise<void> => {
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

    // Premium case check - if user not premium, hide some data
    const responseCase = caseData.toObject()

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
    const caseData = {
      ...req.body,
      createdBy: req.user!._id,
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
    const updated = await Case.findOneAndUpdate(
      { caseId: req.params.id },
      req.body,
      { new: true, runValidators: true }
    )

    if (!updated) {
      res.status(404).json({ message: 'Keys topilmadi' })
      return
    }

    res.json({ status: 'success', case: updated })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

export const deleteCase = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const deleted = await Case.findOneAndDelete({ caseId: req.params.id })

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
      filter.title = { $regex: search as string, $options: 'i' }
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
