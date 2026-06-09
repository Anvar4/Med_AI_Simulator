import os from 'os'
import { Request, Response } from 'express'
import mongoose from 'mongoose'
import { Case } from '../models/Case'
import { CaseAttempt } from '../models/CaseAttempt'
import { Category } from '../models/Category'
import { Certificate } from '../models/Certificate'
import { Course } from '../models/Course'
import { PaymentRequest } from '../models/PaymentRequest'
import { Playlist } from '../models/Playlist'
import { ReferralEarning } from '../models/ReferralEarning'
import { User } from '../models/User'
import { Video } from '../models/Video'

/**
 * Clinical-case breakdown for the admin dashboard: totals, split by type
 * (diagnostika/jarrohlik/shoshilinch), by category (specialty), by difficulty
 * (1-5 stars), by status and premium count. All real, from the DB.
 * GET /api/admin/case-stats
 */
export const getCaseStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [total, premium, byType, byCategory, byDifficulty, byStatus] = await Promise.all([
      Case.countDocuments({}),
      Case.countDocuments({ isPremium: true }),
      Case.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Case.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 }, avgDifficulty: { $avg: '$difficulty' } } },
        { $sort: { count: -1 } },
      ]),
      Case.aggregate([
        { $group: { _id: '$difficulty', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Case.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ])

    const typeMap = Object.fromEntries(byType.map(t => [t._id, t.count]))
    const difficulty = [1, 2, 3, 4, 5].map(level => ({
      level,
      count: byDifficulty.find(d => d._id === level)?.count || 0,
    }))

    res.json({
      status: 'success',
      caseStats: {
        total,
        premium,
        emergency: typeMap['shoshilinch'] || 0,
        diagnostika: typeMap['diagnostika'] || 0,
        jarrohlik: typeMap['jarrohlik'] || 0,
        byType: byType.map(t => ({ type: t._id, count: t.count })),
        byCategory: byCategory.map(c => ({ category: c._id, count: c.count, avgDifficulty: Math.round((c.avgDifficulty || 0) * 10) / 10 })),
        byDifficulty: difficulty,
        byStatus: byStatus.map(s => ({ status: s._id, count: s.count })),
      },
    })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

/**
 * Content Manager dashboard — platform-wide content counts and breakdowns,
 * all read live from MongoDB. Readable by admin + instructor (content managers).
 * Modules that don't have models yet (library books, exams, questions) return 0
 * so the frontend can mark them "coming soon" without inventing mock numbers.
 * GET /api/admin/cm-dashboard
 */
export const getCMDashboard = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalCases,
      casesByStatus,
      casesByType,
      casesByCategory,
      casesByDifficulty,
      totalCourses,
      totalPlaylists,
      totalVideos,
      totalCertificates,
      totalCategories,
      totalUsers,
      premiumUsers,
      attemptsAgg,
    ] = await Promise.all([
      Case.countDocuments({}),
      Case.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Case.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]),
      Case.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 12 },
      ]),
      Case.aggregate([{ $group: { _id: '$difficulty', count: { $sum: 1 } } }]),
      Course.countDocuments({}),
      Playlist.countDocuments({}),
      Video.countDocuments({}),
      Certificate.countDocuments({}),
      Category.countDocuments({}),
      User.countDocuments({}),
      User.countDocuments({ isPremium: true }),
      CaseAttempt.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            avgScore: { $avg: '$score' },
          },
        },
      ]),
    ])

    const statusMap = Object.fromEntries(casesByStatus.map(s => [s._id, s.count]))
    const typeMap = Object.fromEntries(casesByType.map(t => [t._id, t.count]))
    const attempts = attemptsAgg[0] ?? { total: 0, completed: 0, avgScore: 0 }
    const completionRate = attempts.total > 0
      ? Math.round((attempts.completed / attempts.total) * 100)
      : 0

    res.json({
      status: 'success',
      dashboard: {
        // Content counts
        totalCases,
        totalEmergencyCases: typeMap['shoshilinch'] || 0,
        totalCourses,
        totalPlaylists,
        totalVideos,
        totalCertificates,
        totalCategories,
        // Publishing state
        publishedCases: statusMap['published'] || 0,
        draftCases: statusMap['draft'] || 0,
        reviewCases: statusMap['review'] || 0,
        // Users & usage
        totalUsers,
        premiumUsers,
        totalAttempts: attempts.total,
        completedAttempts: attempts.completed,
        completionRate,
        avgScore: Math.round((attempts.avgScore || 0) * 10) / 10,
        // Modules without models yet (filled in later stages)
        totalBooks: 0,
        totalExams: 0,
        totalQuestions: 0,
        // Breakdowns for charts
        casesByCategory: casesByCategory.map(c => ({ category: c._id || '—', count: c.count })),
        casesByDifficulty: [1, 2, 3, 4, 5].map(level => ({
          level,
          count: casesByDifficulty.find(d => d._id === level)?.count || 0,
        })),
        casesByType: casesByType.map(t => ({ type: t._id, count: t.count })),
        casesByStatus: casesByStatus.map(s => ({ status: s._id, count: s.count })),
      },
    })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

/**
 * Revenue analytics derived from confirmed payments (PaymentRequest.status='paid').
 * "Real" revenue = sum of paidAmount (fallback amount) over time windows.
 * GET /api/admin/revenue
 */
export const getRevenueAnalytics = async (_req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date()
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const amountExpr = { $ifNull: ['$paidAmount', '$amount'] }

    const sumPaidSince = async (since?: Date) => {
      const match: Record<string, unknown> = { status: 'paid' }
      if (since) match.paidAt = { $gte: since }
      const r = await PaymentRequest.aggregate([
        { $match: match },
        { $group: { _id: null, total: { $sum: amountExpr }, count: { $sum: 1 } } },
      ])
      return { total: r[0]?.total || 0, count: r[0]?.count || 0 }
    }

    const [today, week, month, allTime, byPlan, daily, pending] = await Promise.all([
      sumPaidSince(dayAgo),
      sumPaidSince(weekAgo),
      sumPaidSince(monthAgo),
      sumPaidSince(undefined),
      // Revenue split by plan (all-time)
      PaymentRequest.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: '$plan', total: { $sum: amountExpr }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
      // Daily revenue for the last 30 days (for the chart)
      PaymentRequest.aggregate([
        { $match: { status: 'paid', paidAt: { $gte: monthAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } },
            total: { $sum: amountExpr },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      // Pending requests awaiting confirmation
      PaymentRequest.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
    ])

    res.json({
      status: 'success',
      revenue: {
        currency: 'UZS',
        today: today.total,
        todayCount: today.count,
        week: week.total,
        weekCount: week.count,
        month: month.total,
        monthCount: month.count,
        allTime: allTime.total,
        allTimeCount: allTime.count,
        pending: pending[0]?.total || 0,
        pendingCount: pending[0]?.count || 0,
        byPlan: byPlan.map(p => ({ plan: p._id, total: p.total, count: p.count })),
        daily: daily.map(d => ({ date: d._id, total: d.total, count: d.count })),
      },
    })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

/**
 * Live server health & load: process uptime, memory, CPU load, DB state and
 * basic platform stats. GET /api/admin/server-health
 */
export const getServerHealth = async (_req: Request, res: Response): Promise<void> => {
  try {
    const mem = process.memoryUsage()
    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    const usedMem = totalMem - freeMem
    const cpus = os.cpus()
    // 1-minute load average; on Windows os.loadavg() returns [0,0,0], so we
    // approximate instantaneous load from used memory if load avg is unavailable.
    const load = os.loadavg()
    const loadAvg1 = load[0]
    const cpuCount = cpus.length || 1

    // Recent activity throughput (proxy for live load)
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)
    const [recentAttempts, recentUsers, dbReady] = await Promise.all([
      CaseAttempt.countDocuments({ updatedAt: { $gte: fiveMinAgo } }),
      User.countDocuments({ updatedAt: { $gte: fiveMinAgo } }),
      Promise.resolve(mongoose.connection.readyState), // 1 = connected
    ])

    const memPercent = Math.round((usedMem / totalMem) * 100)
    // CPU load percent: prefer real load average, else fall back to mem pressure.
    const cpuPercent = loadAvg1 > 0
      ? Math.min(100, Math.round((loadAvg1 / cpuCount) * 100))
      : memPercent

    let healthLevel: 'healthy' | 'busy' | 'critical' = 'healthy'
    if (memPercent > 90 || cpuPercent > 90) healthLevel = 'critical'
    else if (memPercent > 70 || cpuPercent > 70) healthLevel = 'busy'

    res.json({
      status: 'success',
      server: {
        healthLevel,
        uptimeSeconds: Math.round(process.uptime()),
        memory: {
          usedMB: Math.round(usedMem / 1024 / 1024),
          totalMB: Math.round(totalMem / 1024 / 1024),
          percent: memPercent,
          processHeapMB: Math.round(mem.heapUsed / 1024 / 1024),
          processRssMB: Math.round(mem.rss / 1024 / 1024),
        },
        cpu: {
          cores: cpuCount,
          model: cpus[0]?.model?.trim() || 'unknown',
          loadAvg1,
          percent: cpuPercent,
        },
        database: {
          connected: dbReady === 1,
          state: ['disconnected', 'connected', 'connecting', 'disconnecting'][dbReady] || 'unknown',
        },
        liveActivity: {
          activeLast5min: recentUsers,
          attemptsLast5min: recentAttempts,
        },
        platform: {
          node: process.version,
          os: `${os.type()} ${os.release()}`,
          arch: os.arch(),
        },
      },
    })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

/**
 * Referral program accounting for the admin dashboard: program-wide totals
 * (referred sign-ups, cash paid out, points granted) and a leaderboard of the
 * top referrers with how much money/points each earned. All real, from the DB.
 * GET /api/admin/referrals
 */
export const getReferralAnalytics = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [totals, topAgg] = await Promise.all([
      ReferralEarning.aggregate([
        {
          $group: {
            _id: null,
            invitedCount: { $sum: 1 },
            totalPaid: { $sum: '$amount' },
            totalPoints: { $sum: '$points' },
            referrers: { $addToSet: '$referrer' },
          },
        },
      ]),
      ReferralEarning.aggregate([
        {
          $group: {
            _id: '$referrer',
            invitedCount: { $sum: 1 },
            earned: { $sum: '$amount' },
            points: { $sum: '$points' },
            lastInviteAt: { $max: '$createdAt' },
          },
        },
        { $sort: { invitedCount: -1, earned: -1 } },
        { $limit: 50 },
        {
          $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'u' },
        },
        { $unwind: '$u' },
        {
          $project: {
            _id: 0,
            userId: '$_id',
            name: '$u.name',
            username: '$u.username',
            avatar: '$u.avatar',
            invitedCount: 1,
            earned: 1,
            points: 1,
            lastInviteAt: 1,
          },
        },
      ]),
    ])

    const t = totals[0] || { invitedCount: 0, totalPaid: 0, totalPoints: 0, referrers: [] }

    res.json({
      status: 'success',
      referrals: {
        totals: {
          invitedCount: t.invitedCount,
          totalPaid: t.totalPaid,
          totalPoints: t.totalPoints,
          referrerCount: Array.isArray(t.referrers) ? t.referrers.length : 0,
        },
        top: topAgg,
      },
    })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}
