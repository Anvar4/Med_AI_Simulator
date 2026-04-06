import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { CaseAttempt } from '../models/CaseAttempt';

// ─── Detailed user statistics ──────────────────────────────────
export const getUserStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id

    const [totalAttempts, completedAttempts] = await Promise.all([
      CaseAttempt.countDocuments({ user: userId }),
      CaseAttempt.countDocuments({ user: userId, status: 'completed' }),
    ])

    // Average score
    const avgResult = await CaseAttempt.aggregate([
      { $match: { user: userId, status: 'completed' } },
      { $group: { _id: null, avgScore: { $avg: '$score' }, totalTime: { $sum: '$timeSpent' } } },
    ])

    // Category performance
    const categoryPerf = await CaseAttempt.aggregate([
      { $match: { user: userId, status: 'completed' } },
      {
        $lookup: {
          from: 'cases',
          localField: 'case',
          foreignField: '_id',
          as: 'caseInfo',
        },
      },
      { $unwind: '$caseInfo' },
      {
        $group: {
          _id: '$caseInfo.category',
          avgScore: { $avg: '$score' },
          count: { $sum: 1 },
          maxScore: { $max: '$score' },
          minScore: { $min: '$score' },
        },
      },
      { $sort: { count: -1 } },
    ])

    // Difficulty performance
    const difficultyPerf = await CaseAttempt.aggregate([
      { $match: { user: userId, status: 'completed' } },
      {
        $lookup: {
          from: 'cases',
          localField: 'case',
          foreignField: '_id',
          as: 'caseInfo',
        },
      },
      { $unwind: '$caseInfo' },
      {
        $group: {
          _id: '$caseInfo.difficulty',
          avgScore: { $avg: '$score' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])

    // Type performance
    const typePerf = await CaseAttempt.aggregate([
      { $match: { user: userId, status: 'completed' } },
      {
        $lookup: {
          from: 'cases',
          localField: 'case',
          foreignField: '_id',
          as: 'caseInfo',
        },
      },
      { $unwind: '$caseInfo' },
      {
        $group: {
          _id: '$caseInfo.type',
          avgScore: { $avg: '$score' },
          count: { $sum: 1 },
        },
      },
    ])

    // Monthly activity (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const monthlyActivity = await CaseAttempt.aggregate([
      {
        $match: {
          user: userId,
          status: 'completed',
          completedAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$completedAt' },
            month: { $month: '$completedAt' },
          },
          count: { $sum: 1 },
          avgScore: { $avg: '$score' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ])

    // Score distribution
    const scoreDistribution = await CaseAttempt.aggregate([
      { $match: { user: userId, status: 'completed' } },
      {
        $bucket: {
          groupBy: '$score',
          boundaries: [0, 40, 60, 75, 90, 101],
          default: 'Other',
          output: { count: { $sum: 1 } },
        },
      },
    ])

    // Recent results
    const recentResults = await CaseAttempt.find({ user: userId, status: 'completed' })
      .populate('case', 'caseId title category difficulty type timeLimit')
      .sort({ completedAt: -1 })
      .limit(10)

    // Best score
    const bestResult = await CaseAttempt.find({ user: userId, status: 'completed' })
      .populate('case', 'title category')
      .sort({ score: -1 })
      .limit(1)

    res.json({
      status: 'success',
      stats: {
        totalAttempts,
        completedAttempts,
        avgScore: Math.round(avgResult[0]?.avgScore || 0),
        totalTimeSpent: avgResult[0]?.totalTime || 0,
        categoryPerformance: categoryPerf.map(c => ({
          category: c._id,
          avgScore: Math.round(c.avgScore),
          count: c.count,
          maxScore: Math.round(c.maxScore),
          minScore: Math.round(c.minScore),
        })),
        difficultyPerformance: difficultyPerf.map(d => ({
          difficulty: d._id,
          avgScore: Math.round(d.avgScore),
          count: d.count,
        })),
        typePerformance: typePerf.map(t => ({
          type: t._id,
          avgScore: Math.round(t.avgScore),
          count: t.count,
        })),
        monthlyActivity: monthlyActivity.map(m => ({
          month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
          count: m.count,
          avgScore: Math.round(m.avgScore),
        })),
        scoreDistribution,
        recentResults,
        bestResult: bestResult[0] || null,
      },
    })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

// ─── User analysis (strengths/weaknesses) ─────────────────────
export const getUserAnalysis = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id

    const categoryPerf = await CaseAttempt.aggregate([
      { $match: { user: userId, status: 'completed' } },
      {
        $lookup: {
          from: 'cases',
          localField: 'case',
          foreignField: '_id',
          as: 'caseInfo',
        },
      },
      { $unwind: '$caseInfo' },
      {
        $group: {
          _id: '$caseInfo.category',
          avgScore: { $avg: '$score' },
          count: { $sum: 1 },
          recentScore: { $last: '$score' },
        },
      },
    ])

    const strengths = categoryPerf
      .filter(c => c.avgScore >= 75 && c.count >= 2)
      .map(c => ({ category: c._id, avgScore: Math.round(c.avgScore), count: c.count }))
      .sort((a, b) => b.avgScore - a.avgScore)

    const weaknesses = categoryPerf
      .filter(c => c.avgScore < 65)
      .map(c => ({ category: c._id, avgScore: Math.round(c.avgScore), count: c.count }))
      .sort((a, b) => a.avgScore - b.avgScore)

    const improving = categoryPerf
      .filter(c => c.recentScore > c.avgScore * 1.1 && c.count >= 3)
      .map(c => ({ category: c._id, avgScore: Math.round(c.avgScore), recentScore: Math.round(c.recentScore) }))

    // Total stats
    const totalResult = await CaseAttempt.aggregate([
      { $match: { user: userId, status: 'completed' } },
      { $group: { _id: null, avgScore: { $avg: '$score' }, count: { $sum: 1 } } },
    ])
    const overallAvg = Math.round(totalResult[0]?.avgScore || 0)
    const totalCompleted = totalResult[0]?.count || 0

    // Study recommendations based on weak areas
    const categoryRecommendations: Record<string, string[]> = {
      'Kardiologiya': ['EKG o\'qishni mashq qiling', 'Yurak yetishmovchiligi algoritmini o\'rganing', 'STEMI/NSTEMI farqlarini takrorlang'],
      'Nevrologiya': ['Insult algoritmini o\'rganing', 'Bosh aylanishi differensiyalini takrorlang', 'Nevrologik tekshiruv usullarini mashq qiling'],
      'Pediatriya': ['Bolalarda normal vitals ko\'rsatkichlarini yodlang', 'Pediatrik antibiotik dozalashni o\'rganing', 'Emmash ko\'rsatmalarini takrorlang'],
      'Jarrohlik': ['Shoshilinch jarrohlik algoritmini o\'rganing', 'ATLS protokolini takrorlang', 'Qon to\'xtatish usullarini mashq qiling'],
      'Ginekologiya': ['Obstetrik shoshilinch holatlarni o\'rganing', 'Ekopik homiladorlik belgilarini takrorlang'],
      'Dermatologiya': ['Teri kasalliklari klassifikatsiyasini o\'rganing', 'Dermatologik terminologiyani takrorlang'],
      'Endokrinologiya': ['Qandli diabet boshqaruvini o\'rganing', 'Tiroid kasalliklari algoritmlarini takrorlang'],
      'Pulmonologiya': ["O'pka kasalliklari spirometriyasini o'rganing", 'Pnevmoniya davolash protokolini takrorlang'],
    }

    const recommendations = weaknesses.map(w => ({
      category: w.category,
      avgScore: w.avgScore,
      suggestions: categoryRecommendations[w.category] || ['Bu yo\'nalishda ko\'proq klinik holatlar ishlang', 'Asosiy darsliklarni ko\'rib chiqing'],
    }))

    res.json({
      status: 'success',
      analysis: {
        overallAvg,
        totalCompleted,
        strengths,
        weaknesses,
        improving,
        recommendations,
        positiveAspects: [
          ...(overallAvg >= 70 ? [`O'rtacha ball ${overallAvg}% — yaxshi natija`] : []),
          ...(strengths.length > 0 ? [`${strengths.map(s => s.category).join(', ')} yo'nalishlarida kuchli ko'rsatkich`] : []),
          ...(totalCompleted >= 10 ? [`${totalCompleted} ta klinik holat ishlangan — yaxshi tajriba`] : []),
          ...(improving.length > 0 ? [`${improving.map(i => i.category).join(', ')} yo'nalishida rivojlanish sezilyapti`] : []),
        ],
        negativeAspects: [
          ...(weaknesses.length > 0 ? [`${weaknesses.map(w => w.category).join(', ')} yo'nalishlarida qo'shimcha ish talab etiladi`] : []),
          ...(overallAvg < 60 ? [`O'rtacha ball ${overallAvg}% — asosiy mavzularni takrorlash tavsiya etiladi`] : []),
          ...(totalCompleted < 5 ? ['Yetarlicha tajriba yo\'q — ko\'proq klinik holatlar ishlang'] : []),
        ],
      },
    })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

// ─── Leaderboard ──────────────────────────────────────────────
export const getLeaderboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user!._id

    const rows = await CaseAttempt.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$user',
          totalCompleted: { $sum: 1 },
          avgScore: { $avg: '$score' },
          totalTimeSpent: { $sum: '$timeSpent' },
          bestScore: { $max: '$score' },
        },
      },
      { $match: { totalCompleted: { $gte: 1 } } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      { $unwind: '$userInfo' },
      { $match: { 'userInfo.role': 'student' } },
      {
        $project: {
          userId: '$_id',
          name: {
            $concat: [
              { $ifNull: ['$userInfo.firstName', ''] },
              ' ',
              { $ifNull: ['$userInfo.lastName', ''] },
            ],
          },
          avatar: '$userInfo.avatar',
          role: '$userInfo.role',
          totalCompleted: 1,
          avgScore: { $round: ['$avgScore', 1] },
          totalTimeSpent: 1,
          bestScore: { $round: ['$bestScore', 1] },
        },
      },
      { $sort: { avgScore: -1, totalCompleted: -1 } },
      { $limit: 100 },
    ])

    const leaderboard = rows.map((row, idx) => ({
      rank: idx + 1,
      userId: String(row.userId),
      name: row.name.trim() || 'Foydalanuvchi',
      avatar: row.avatar || null,
      role: row.role,
      totalCompleted: row.totalCompleted,
      avgScore: row.avgScore,
      bestScore: row.bestScore,
      totalTimeSpent: row.totalTimeSpent,
      isCurrentUser: String(row.userId) === String(currentUserId),
    }))

    // Find current user's rank if outside top 100
    let currentUserRank = leaderboard.find(r => r.isCurrentUser) ?? null

    const currentUserRole = req.user?.role

    if (!currentUserRank && currentUserRole === 'student') {
      const myStats = await CaseAttempt.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(String(currentUserId)), status: 'completed' } },
        {
          $group: {
            _id: '$user',
            totalCompleted: { $sum: 1 },
            avgScore: { $avg: '$score' },
            bestScore: { $max: '$score' },
            totalTimeSpent: { $sum: '$timeSpent' },
          },
        },
      ])
      if (myStats.length > 0) {
        const rankCount = await CaseAttempt.aggregate([
          { $match: { status: 'completed' } },
          { $group: { _id: '$user', avgScore: { $avg: '$score' } } },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'userInfo',
            },
          },
          { $unwind: '$userInfo' },
          { $match: { 'userInfo.role': 'student', avgScore: { $gt: myStats[0].avgScore } } },
          { $count: 'count' },
        ])
        const me = req.user! as { firstName?: string; lastName?: string; avatar?: string; role: string }
        currentUserRank = {
          rank: (rankCount[0]?.count ?? 0) + 1,
          userId: String(currentUserId),
          name: `${me.firstName || ''} ${me.lastName || ''}`.trim() || 'Siz',
          avatar: me.avatar || null,
          role: me.role,
          totalCompleted: myStats[0].totalCompleted,
          avgScore: Math.round(myStats[0].avgScore * 10) / 10,
          bestScore: Math.round(myStats[0].bestScore * 10) / 10,
          totalTimeSpent: myStats[0].totalTimeSpent,
          isCurrentUser: true,
        }
      }
    }

    res.json({ status: 'success', leaderboard, currentUserRank })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}
