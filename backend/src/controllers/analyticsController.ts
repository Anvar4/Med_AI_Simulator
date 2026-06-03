import os from 'os'
import { Request, Response } from 'express'
import mongoose from 'mongoose'
import { CaseAttempt } from '../models/CaseAttempt'
import { PaymentRequest } from '../models/PaymentRequest'
import { User } from '../models/User'

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
