import { Response } from 'express'
import mongoose from 'mongoose'
import OpenAI from 'openai'
import { AuthRequest } from '../middleware/auth'
import { Case } from '../models/Case'
import { CaseAttempt } from '../models/CaseAttempt'
import { User } from '../models/User'
import { difficultyToLevel, unlockedLevel, type LevelStat } from './adaptiveEngine'

/**
 * Compute the user's unlocked learning level within a single category from
 * their completed attempts (cheap, single-category aggregation).
 */
async function unlockedLevelForCategory(
  userId: mongoose.Types.ObjectId,
  category: string
): Promise<number> {
  const rows = await CaseAttempt.aggregate([
    { $match: { user: userId, status: 'completed' } },
    { $lookup: { from: 'cases', localField: 'case', foreignField: '_id', as: 'c' } },
    { $unwind: '$c' },
    { $match: { 'c.category': category } },
    {
      $group: {
        _id: '$c.difficulty',
        attempts: { $sum: 1 },
        avgScore: { $avg: '$score' },
      },
    },
  ])

  const byLevel = new Map<number, { attempts: number; scoreSum: number }>()
  for (const r of rows) {
    const level = difficultyToLevel(r._id as number)
    const cur = byLevel.get(level) || { attempts: 0, scoreSum: 0 }
    cur.attempts += r.attempts
    cur.scoreSum += r.avgScore * r.attempts
    byLevel.set(level, cur)
  }
  const stats: LevelStat[] = Array.from(byLevel.entries()).map(([level, v]) => ({
    level: level as LevelStat['level'],
    attempts: v.attempts,
    avgScore: Math.round(v.scoreSum / v.attempts),
  }))
  return unlockedLevel(stats)
}

let _openai: OpenAI | null = null
const getOpenAI = () => {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return _openai
}

export const startAttempt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.caseId as string
    const caseData = /^[0-9a-fA-F]{24}$/.test(id)
      ? await Case.findById(id)
      : await Case.findOne({ caseId: id })
    if (!caseData) {
      res.status(404).json({ message: 'Keys topilmadi' })
      return
    }

    // Premium gating: only premium users (or staff) may start premium cases.
    const isStaff = req.user!.role === 'admin' || req.user!.role === 'instructor'
    if (caseData.isPremium && !req.user!.isPremium && !isStaff) {
      res.status(403).json({
        message: 'Bu premium klinik holat. Davom etish uchun Pro obunani faollashtiring.',
        premiumRequired: true,
      })
      return
    }

    // Adaptive level gating: a learner may only start cases at or below their
    // unlocked level in this category. Staff bypass. Resuming an existing
    // in-progress attempt below also bypasses (it was already allowed).
    if (!isStaff) {
      const caseLevel = difficultyToLevel(caseData.difficulty)
      const unlocked = await unlockedLevelForCategory(req.user!._id, caseData.category)
      if (caseLevel > unlocked) {
        res.status(403).json({
          message: `Bu daraja hali ochilmagan. Avval "${caseData.category}" bo'yicha ${unlocked}-darajani o'zlashtiring.`,
          levelLocked: true,
          requiredLevel: caseLevel,
          unlockedLevel: unlocked,
        })
        return
      }
    }

    // Check if user already has an in-progress attempt
    const existing = await CaseAttempt.findOne({
      user: req.user!._id,
      case: caseData._id,
      status: 'in-progress',
    })

    if (existing) {
      res.json({ status: 'success', attempt: existing, message: 'Davom ettirilmoqda' })
      return
    }

    const attempt = await CaseAttempt.create({
      user: req.user!._id,
      case: caseData._id,
    })

    res.status(201).json({ status: 'success', attempt })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

export const submitAttempt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const attempt = await CaseAttempt.findById(req.params.attemptId)
    if (!attempt || attempt.user.toString() !== req.user!._id.toString()) {
      res.status(404).json({ message: 'Urinish topilmadi' })
      return
    }

    if (attempt.status === 'completed') {
      res.status(400).json({ message: 'Bu urinish allaqachon yakunlangan' })
      return
    }

    const caseData = await Case.findById(attempt.case)
    if (!caseData) {
      res.status(404).json({ message: 'Keys topilmadi' })
      return
    }

    const { diagnosis, treatment, selectedTests, timeSpent } = req.body

    // Use AI-powered scoring
    const aiResult = await analyzeWithAI(
      diagnosis,
      treatment,
      selectedTests,
      caseData.correctDiagnosis,
      caseData.correctTreatment,
      caseData.tests,
      caseData.title,
      caseData.patient?.complaints || '',
      caseData.type
    )

    attempt.diagnosis = diagnosis
    attempt.treatment = treatment
    attempt.selectedTests = selectedTests
    attempt.timeSpent = timeSpent
    attempt.score = aiResult.score
    attempt.aiFeedback = aiResult.feedback
    attempt.status = 'completed'
    attempt.completedAt = new Date()
    await attempt.save()

    // Update user stats
    await updateUserStats(req.user!._id.toString())

    res.json({
      status: 'success',
      attempt,
      result: {
        score: aiResult.score,
        feedback: aiResult.feedback,
        correctDiagnosis: caseData.correctDiagnosis,
        correctTreatment: caseData.correctTreatment,
        strengths: aiResult.strengths,
        weaknesses: aiResult.weaknesses,
        detailedAnalysis: aiResult.detailedAnalysis,
      },
    })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

export const getMyAttempts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, page = '1', limit = '10' } = req.query

    const filter: Record<string, string | mongoose.Types.ObjectId> = { user: req.user!._id }
    if (status) filter.status = status as string

    const pageNum = Math.max(1, parseInt(page as string))
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)))

    const [attempts, total] = await Promise.all([
      CaseAttempt.find(filter)
        .populate('case', 'caseId title category difficulty type')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      CaseAttempt.countDocuments(filter),
    ])

    res.json({
      status: 'success',
      results: attempts.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      attempts,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id

    const [, completedAttempts, avgScoreResult, recentAttempts] =
      await Promise.all([
        CaseAttempt.countDocuments({ user: userId }),
        CaseAttempt.countDocuments({ user: userId, status: 'completed' }),
        CaseAttempt.aggregate([
          { $match: { user: userId, status: 'completed' } },
          { $group: { _id: null, avgScore: { $avg: '$score' } } },
        ]),
        CaseAttempt.find({ user: userId, status: 'completed' })
          .populate('case', 'caseId title category difficulty type')
          .sort({ completedAt: -1 })
          .limit(5),
      ])

    // Category scores
    const categoryScores = await CaseAttempt.aggregate([
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
        },
      },
    ])

    // Weekly activity (last 7 days)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weeklyActivity = await CaseAttempt.aggregate([
      {
        $match: {
          user: userId,
          status: 'completed',
          completedAt: { $gte: weekAgo },
        },
      },
      {
        $group: {
          _id: { $dayOfWeek: '$completedAt' },
          count: { $sum: 1 },
        },
      },
    ])

    // In-progress case (continue learning)
    const continueCase = await CaseAttempt.findOne({
      user: userId,
      status: 'in-progress',
    })
      .populate('case', 'caseId title category difficulty type patient')
      .sort({ updatedAt: -1 })

    res.json({
      status: 'success',
      stats: {
        totalCases: completedAttempts,
        avgScore: avgScoreResult[0]?.avgScore || 0,
        weeklyCount: weeklyActivity.reduce((sum, d) => sum + d.count, 0),
        streak: req.user!.stats.streak,
        categoryScores,
        weeklyActivity,
        recentAttempts,
        continueCase,
      },
    })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

// --- AI-powered analysis ---

interface AIAnalysisResult {
  score: number
  feedback: string
  strengths: string[]
  weaknesses: string[]
  detailedAnalysis: string
}

async function analyzeWithAI(
  userDiagnosis: string,
  userTreatment: string,
  selectedTests: string[],
  correctDiagnosis: string,
  correctTreatment: string,
  correctTests: string[],
  caseTitle: string,
  complaints: string,
  caseType: string
): Promise<AIAnalysisResult> {
  // If user wrote almost nothing, give minimum score immediately
  const diagWords = (userDiagnosis || '').trim().split(/\s+/).filter(Boolean).length
  const treatWords = (userTreatment || '').trim().split(/\s+/).filter(Boolean).length

  if (diagWords <= 1 && treatWords <= 1) {
    return {
      score: Math.max(1, Math.min(5, diagWords + treatWords)),
      feedback: "Javobingiz juda qisqa. Tashxis va davolash rejasini batafsil yozing.",
      strengths: [],
      weaknesses: ["Javob juda qisqa", "Tashxis asoslanmagan", "Davolash rejasi yo'q"],
      detailedAnalysis: "Foydalanuvchi deyarli javob yozmagan. To'liq tashxis va davolash rejasini yozish tavsiya etiladi.",
    }
  }

  try {
    const prompt = `Sen tibbiy ta'lim simulyatorida AI baholovchi sifatida ishlaysan. 
Talabaning javobini to'g'ri javob bilan solishtir va FAQAT JSON formatida javob ber.

KLINIK HOLAT: ${caseTitle}
Holat turi: ${caseType === 'shoshilinch' ? 'SHOSHILINCH (tezkor qaror muhim)' : caseType}
Bemor shikoyatlari: ${complaints}

TO'G'RI TASHXIS: ${correctDiagnosis}
TO'G'RI DAVOLASH: ${correctTreatment}
TO'G'RI TEKSHIRUVLAR: ${correctTests.join(', ')}

TALABA JAVOBI:
Tashxis: ${userDiagnosis || '(yozilmagan)'}
Davolash rejasi: ${userTreatment || '(yozilmagan)'}
Tanlangan tekshiruvlar: ${selectedTests.length > 0 ? selectedTests.join(', ') : '(tanlanmagan)'}

BAHOLASH MEZONLARI (1-100):
- Tashxis aniqligi (40 ball): To'g'ri tashxis qo'yilganmi? Asosiy kasallik to'g'ri aniqlanganmi?
- Davolash rejasi (35 ball): Davolash usullari to'g'ri va to'liqmi? Dori preparatlari to'g'ri ko'rsatilganmi?
- Tekshiruvlar (25 ball): Kerakli tekshiruvlar to'g'ri tanlanganmi?

MUHIM: Agar talaba faqat 1-2 so'z yozgan bo'lsa, ball past bo'lishi kerak (1-10).
Agar asosiy g'oya to'g'ri lekin batafsil bo'lmasa - o'rtacha ball (40-65).
Agar to'g'ri va batafsil bo'lsa - yuqori ball (70-100).

Javobni FAQAT quyidagi JSON formatida ber, boshqa hech narsa yozma:
{
  "score": <1-100 soni>,
  "feedback": "<umumiy xulosa, 1-2 gap>",
  "strengths": ["<kuchli tomon 1>", "<kuchli tomon 2>"],
  "weaknesses": ["<kamchilik 1>", "<kamchilik 2>"],
  "detailedAnalysis": "<batafsil solishtirma tahlil, 3-5 gap>"
}`

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('Empty AI response')

    const result = JSON.parse(content) as AIAnalysisResult
    // Clamp score
    result.score = Math.min(100, Math.max(1, Math.round(result.score)))
    if (!result.strengths) result.strengths = []
    if (!result.weaknesses) result.weaknesses = []
    if (!result.detailedAnalysis) result.detailedAnalysis = result.feedback

    return result
  } catch (error) {
    console.error('AI analysis error, falling back:', error)
    // Fallback to simple scoring
    return fallbackScore(userDiagnosis, userTreatment, selectedTests, correctDiagnosis, correctTreatment, correctTests)
  }
}

function fallbackScore(
  diagnosis: string,
  treatment: string,
  selectedTests: string[],
  correctDiagnosis: string,
  correctTreatment: string,
  correctTests: string[]
): AIAnalysisResult {
  let score = 0
  const strengths: string[] = []
  const weaknesses: string[] = []

  // Diagnosis (40 pts)
  if (diagnosis && correctDiagnosis) {
    const dl = diagnosis.toLowerCase()
    const cl = correctDiagnosis.toLowerCase()
    if (dl === cl) { score += 40; strengths.push("Tashxis to'liq to'g'ri") }
    else if (dl.includes(cl) || cl.includes(dl)) { score += 25; strengths.push("Tashxis yo'nalishi to'g'ri") }
    else { score += 5; weaknesses.push("Tashxis noto'g'ri") }
  } else {
    weaknesses.push("Tashxis yozilmagan")
  }

  // Treatment (35 pts)
  if (treatment && correctTreatment) {
    const tl = treatment.toLowerCase()
    const ctl = correctTreatment.toLowerCase()
    if (tl === ctl) { score += 35; strengths.push("Davolash rejasi mukammal") }
    else if (tl.includes(ctl) || ctl.includes(tl)) { score += 20; strengths.push("Davolash rejasi qisman to'g'ri") }
    else { score += 5; weaknesses.push("Davolash rejasini yaxshilash kerak") }
  } else {
    weaknesses.push("Davolash rejasi yozilmagan")
  }

  // Tests (25 pts)
  if (selectedTests.length > 0 && correctTests.length > 0) {
    const correct = selectedTests.filter(t => correctTests.includes(t)).length
    const testScore = (correct / correctTests.length) * 25
    score += Math.round(testScore)
    if (correct > 0) strengths.push(`${correct}/${correctTests.length} tekshiruv to'g'ri`)
    if (correct < correctTests.length) weaknesses.push("Ba'zi tekshiruvlar tanlanmagan")
  }

  score = Math.min(100, Math.max(1, score))
  let feedback = ''
  if (score >= 85) feedback = "A'lo natija! Tashxisingiz to'g'ri va davolash rejangiz mukammal."
  else if (score >= 70) feedback = "Yaxshi natija. Biroz yaxshilash kerak."
  else if (score >= 50) feedback = `O'rtacha natija. To'g'ri tashxis: "${correctDiagnosis}".`
  else feedback = `Natija past. To'g'ri tashxis: "${correctDiagnosis}". Qo'shimcha o'rganish tavsiya etiladi.`

  return {
    score,
    feedback,
    strengths,
    weaknesses,
    detailedAnalysis: feedback,
  }
}

async function updateUserStats(userId: string): Promise<void> {
  const completed = await CaseAttempt.countDocuments({
    user: userId,
    status: 'completed',
  })
  const avgResult = await CaseAttempt.aggregate([
    { $match: { user: userId, status: 'completed' } },
    { $group: { _id: null, avgScore: { $avg: '$score' } } },
  ])

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weeklyCount = await CaseAttempt.countDocuments({
    user: userId,
    status: 'completed',
    completedAt: { $gte: weekAgo },
  })

  await User.findByIdAndUpdate(userId, {
    'stats.totalCases': completed,
    'stats.avgScore': Math.round((avgResult[0]?.avgScore || 0) * 10) / 10,
    'stats.weeklyCount': weeklyCount,
  })
}
