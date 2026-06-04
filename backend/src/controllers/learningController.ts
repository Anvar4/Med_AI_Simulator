import { Response } from 'express'
import mongoose from 'mongoose'
import { AuthRequest } from '../middleware/auth'
import { Case } from '../models/Case'
import { CaseAttempt } from '../models/CaseAttempt'
import {
  difficultyToLevel,
  recommendAction,
  unlockedLevel,
  type Level,
  type LevelStat,
} from './adaptiveEngine'

/**
 * Aggregate a user's completed attempts into per-(category, level) stats.
 * Levels are derived from each case's difficulty via difficultyToLevel.
 */
async function buildCategoryLevelStats(
  userId: mongoose.Types.ObjectId
): Promise<Map<string, LevelStat[]>> {
  const rows = await CaseAttempt.aggregate([
    { $match: { user: userId, status: 'completed' } },
    {
      $lookup: { from: 'cases', localField: 'case', foreignField: '_id', as: 'c' },
    },
    { $unwind: '$c' },
    {
      $group: {
        _id: { category: '$c.category', difficulty: '$c.difficulty' },
        attempts: { $sum: 1 },
        avgScore: { $avg: '$score' },
      },
    },
  ])

  // Fold difficulty buckets into 1–3 levels per category.
  const map = new Map<string, Map<Level, { attempts: number; scoreSum: number }>>()
  for (const r of rows) {
    const category = r._id.category as string
    const level = difficultyToLevel(r._id.difficulty as number)
    if (!map.has(category)) map.set(category, new Map())
    const lvlMap = map.get(category)!
    const cur = lvlMap.get(level) || { attempts: 0, scoreSum: 0 }
    cur.attempts += r.attempts
    cur.scoreSum += r.avgScore * r.attempts
    lvlMap.set(level, cur)
  }

  const result = new Map<string, LevelStat[]>()
  for (const [category, lvlMap] of map) {
    const stats: LevelStat[] = []
    for (const [level, v] of lvlMap) {
      stats.push({ level, attempts: v.attempts, avgScore: Math.round(v.scoreSum / v.attempts) })
    }
    result.set(category, stats)
  }
  return result
}

// GET /api/learning/path — per-category unlocked level + recommended action
export const getLearningPath = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const statsByCategory = await buildCategoryLevelStats(req.user!._id)

    const path = Array.from(statsByCategory.entries()).map(([category, stats]) => ({
      category,
      stats,
      unlockedLevel: unlockedLevel(stats),
      recommendation: recommendAction(stats),
    }))

    res.json({ status: 'success', path })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

/**
 * GET /api/learning/recommendations?category=&limit=
 * Suggest published cases at the user's target level, prioritising categories
 * they are struggling in and excluding cases they already completed.
 */
export const getRecommendations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id
    const limit = Math.min(20, Math.max(1, parseInt((req.query.limit as string) || '6')))
    const categoryFilter = req.query.category as string | undefined

    const statsByCategory = await buildCategoryLevelStats(userId)

    // Cases the user already completed are excluded from suggestions.
    const completed = await CaseAttempt.find({ user: userId, status: 'completed' }).distinct('case')

    // Difficulty range allowed per target level.
    const levelDifficulty: Record<Level, number[]> = { 1: [1, 2], 2: [3], 3: [4, 5] }

    // Determine which (category, level) pairs to pull from.
    const targets: { category: string; level: Level; struggling: boolean }[] = []
    for (const [category, stats] of statsByCategory) {
      if (categoryFilter && category !== categoryFilter) continue
      const rec = recommendAction(stats)
      targets.push({ category, level: rec.targetLevel, struggling: rec.action === 'reinforce' })
    }

    // If the user has no history at all, recommend foundational (level 1) cases.
    const baseFilter: Record<string, unknown> = {
      status: 'published',
      _id: { $nin: completed },
    }
    if (categoryFilter) baseFilter.category = categoryFilter

    let cases
    if (targets.length === 0) {
      cases = await Case.find({ ...baseFilter, difficulty: { $in: [1, 2] } })
        .select('-correctDiagnosis -correctTreatment')
        .sort({ difficulty: 1, createdAt: -1 })
        .limit(limit)
        .lean()
    } else {
      // Build an $or across each target category's allowed difficulties.
      const or = targets.map(t => ({
        category: t.category,
        difficulty: { $in: levelDifficulty[t.level] },
      }))
      cases = await Case.find({ ...baseFilter, $or: or })
        .select('-correctDiagnosis -correctTreatment')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean()
    }

    res.json({
      status: 'success',
      recommendations: cases,
      targets: targets.map(t => ({ category: t.category, level: t.level, struggling: t.struggling })),
    })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}
