import { Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { Course } from '../models/Course'
import { Exam } from '../models/Exam'
import { ExamAttempt } from '../models/ExamAttempt'
import { notify } from '../models/Notification'
import { Question, QuestionType, normalizeAnswer } from '../models/Question'
import { User } from '../models/User'
import { maybeIssueCertificate } from './progressController'

function isStaff(req: AuthRequest): boolean {
  return req.user?.role === 'admin' || req.user?.role === 'instructor'
}

/** Load a course the requester is allowed to manage (owner or admin). */
async function loadManageableCourse(req: AuthRequest, res: Response, courseId: string) {
  const course = await Course.findById(courseId)
  if (!course) {
    res.status(404).json({ message: 'Kurs topilmadi' })
    return null
  }
  if (req.user!.role !== 'admin' && course.createdBy?.toString() !== req.user!._id.toString()) {
    res.status(403).json({ message: 'Bu kursni boshqarish huquqiga ega emassiz' })
    return null
  }
  return course
}

// ─── CM/Admin: exam settings ───────────────────────────────────
// GET /api/courses/:courseId/exam-admin — exam + questions WITH answer key
export const getExamAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const course = await loadManageableCourse(req, res, String(req.params.courseId))
    if (!course) return
    const exam = await Exam.findOne({ course: course._id }).lean()
    const questions = exam
      ? await Question.find({ exam: exam._id }).sort({ order: 1, createdAt: 1 }).lean()
      : []
    res.json({ status: 'success', exam, questions })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

// PUT /api/courses/:courseId/exam-admin — create or update exam settings
export const upsertExam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const course = await loadManageableCourse(req, res, String(req.params.courseId))
    if (!course) return
    const { title, description, passingScore, rewardPoints, isPublished } = req.body
    const update: Record<string, unknown> = {}
    if (typeof title === 'string') update.title = title.trim()
    if (typeof description === 'string') update.description = description
    if (typeof passingScore === 'number') update.passingScore = Math.min(100, Math.max(0, passingScore))
    if (typeof rewardPoints === 'number') update.rewardPoints = Math.max(0, rewardPoints)
    if (typeof isPublished === 'boolean') update.isPublished = isPublished

    const exam = await Exam.findOneAndUpdate(
      { course: course._id },
      { $set: update, $setOnInsert: { course: course._id, createdBy: req.user!._id } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
    res.json({ status: 'success', exam })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

/** Validate + normalize a question payload by type. Returns an error string or null. */
function validateQuestion(body: Record<string, unknown>): { error?: string; data?: Record<string, unknown> } {
  const type = body.type as QuestionType
  if (!['single', 'multiple', 'truefalse', 'short'].includes(type)) return { error: 'Savol turi yaroqsiz' }
  const text = typeof body.text === 'string' ? body.text.trim() : ''
  if (!text) return { error: 'Savol matni majburiy' }

  const data: Record<string, unknown> = {
    type, text,
    points: typeof body.points === 'number' && body.points > 0 ? body.points : 1,
    explanation: typeof body.explanation === 'string' ? body.explanation : '',
  }

  if (type === 'short') {
    const correctText = Array.isArray(body.correctText)
      ? (body.correctText as unknown[]).filter((s): s is string => typeof s === 'string' && s.trim() !== '').map(s => s.trim())
      : []
    if (correctText.length === 0) return { error: 'Qisqa javob uchun kamida bitta to\'g\'ri javob kiriting' }
    data.correctText = correctText
    data.options = []
  } else {
    const rawOptions = Array.isArray(body.options) ? body.options : []
    const options = rawOptions
      .filter((o): o is { text: string; isCorrect?: boolean } => !!o && typeof (o as { text?: unknown }).text === 'string')
      .map(o => ({ text: o.text.trim(), isCorrect: !!o.isCorrect }))
      .filter(o => o.text !== '')
    if (type === 'truefalse') {
      // Normalize to exactly two options if not provided.
      if (options.length !== 2) return { error: 'To\'g\'ri/Noto\'g\'ri uchun 2 ta variant kerak' }
    } else if (options.length < 2) {
      return { error: 'Kamida 2 ta variant kiriting' }
    }
    const correctCount = options.filter(o => o.isCorrect).length
    if (correctCount === 0) return { error: 'Kamida bitta to\'g\'ri variant belgilang' }
    if ((type === 'single' || type === 'truefalse') && correctCount !== 1) return { error: 'Bu turda faqat bitta to\'g\'ri variant bo\'lishi kerak' }
    data.options = options
    data.correctText = []
  }
  return { data }
}

// POST /api/courses/:courseId/exam-admin/questions
export const createQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const course = await loadManageableCourse(req, res, String(req.params.courseId))
    if (!course) return
    // Ensure an exam exists for this course.
    const exam = await Exam.findOneAndUpdate(
      { course: course._id },
      { $setOnInsert: { course: course._id, createdBy: req.user!._id } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
    const { error, data } = validateQuestion(req.body)
    if (error) { res.status(400).json({ message: error }); return }
    const count = await Question.countDocuments({ exam: exam._id })
    const question = await Question.create({
      ...data,
      exam: exam._id,
      course: course._id,
      order: count,
      createdBy: req.user!._id,
    })
    res.status(201).json({ status: 'success', question })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

async function loadOwnedQuestion(req: AuthRequest, res: Response) {
  const question = await Question.findById(req.params.id)
  if (!question) { res.status(404).json({ message: 'Savol topilmadi' }); return null }
  const course = await Course.findById(question.course)
  if (req.user!.role !== 'admin' && course?.createdBy?.toString() !== req.user!._id.toString()) {
    res.status(403).json({ message: 'Ruxsat berilmagan' }); return null
  }
  return question
}

// PATCH /api/courses/exam-questions/:id
export const updateQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const question = await loadOwnedQuestion(req, res)
    if (!question) return
    const { error, data } = validateQuestion({ ...question.toObject(), ...req.body })
    if (error) { res.status(400).json({ message: error }); return }
    Object.assign(question, data)
    await question.save()
    res.json({ status: 'success', question })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

// DELETE /api/courses/exam-questions/:id
export const deleteQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const question = await loadOwnedQuestion(req, res)
    if (!question) return
    await question.deleteOne()
    res.json({ status: 'success', message: 'Savol o\'chirildi' })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

// ─── User: take exam ───────────────────────────────────────────
// GET /api/courses/:courseId/exam — questions WITHOUT the answer key
export const getExamForUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const course = await Course.findById(req.params.courseId)
    if (!course) { res.status(404).json({ message: 'Kurs topilmadi' }); return }
    const exam = await Exam.findOne({ course: course._id, isPublished: true }).lean()
    if (!exam) { res.json({ status: 'success', exam: null, questions: [] }); return }

    const questions = await Question.find({ exam: exam._id }).sort({ order: 1, createdAt: 1 }).lean()
    // Strip the answer key — never leak isCorrect / correctText to the client.
    const safe = questions.map(q => ({
      _id: q._id,
      type: q.type,
      text: q.text,
      points: q.points,
      options: q.options.map(o => ({ _id: o._id, text: o.text })),
    }))

    // Best attempt so far (for retake UI).
    let best = null
    if (req.user) {
      const attempts = await ExamAttempt.find({ user: req.user._id, exam: exam._id }).sort({ scorePercent: -1 }).limit(1).lean()
      if (attempts[0]) best = { scorePercent: attempts[0].scorePercent, passed: attempts[0].passed }
    }

    res.json({
      status: 'success',
      exam: { _id: exam._id, title: exam.title, description: exam.description, passingScore: exam.passingScore, rewardPoints: exam.rewardPoints, questionCount: safe.length },
      questions: safe,
      best,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

// POST /api/courses/exams/:examId/submit  body: { answers: [{ question, selected?, textAnswer? }] }
export const submitExam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const exam = await Exam.findById(req.params.examId)
    if (!exam || !exam.isPublished) { res.status(404).json({ message: 'Imtihon topilmadi' }); return }

    // Entitlement: published course; premium course needs premium (staff bypass).
    const course = await Course.findById(exam.course).select('isPublished isPremium title')
    if (!course) { res.status(404).json({ message: 'Kurs topilmadi' }); return }
    if (!isStaff(req)) {
      if (!course.isPublished) { res.status(403).json({ message: 'Kurs mavjud emas' }); return }
      if (course.isPremium && !req.user!.isPremium) { res.status(403).json({ message: 'Bu premium kurs', premiumRequired: true }); return }
    }

    const questions = await Question.find({ exam: exam._id })
    if (questions.length === 0) { res.status(400).json({ message: 'Imtihonda savollar yo\'q' }); return }

    const submitted: Array<{ question: string; selected?: string[]; textAnswer?: string }> = Array.isArray(req.body.answers) ? req.body.answers : []
    const byQ = new Map(submitted.map(a => [String(a.question), a]))

    let earned = 0
    let total = 0
    const answers = questions.map(q => {
      total += q.points
      const a = byQ.get(String(q._id))
      let correct = false
      const selected: string[] = Array.isArray(a?.selected) ? a!.selected.map(String) : []
      const textAnswer = typeof a?.textAnswer === 'string' ? a!.textAnswer : undefined

      if (q.type === 'short') {
        const norm = normalizeAnswer(textAnswer || '')
        correct = norm !== '' && q.correctText.some(ct => normalizeAnswer(ct) === norm)
      } else {
        const correctIds = q.options.filter(o => o.isCorrect).map(o => String(o._id)).sort()
        const sel = [...new Set(selected)].sort()
        correct = correctIds.length === sel.length && correctIds.every((id, i) => id === sel[i])
      }
      if (correct) earned += q.points
      return { question: q._id, selected, textAnswer, correct }
    })

    const scorePercent = total > 0 ? Math.round((earned / total) * 100) : 0
    const passed = scorePercent >= exam.passingScore

    // Grant reward points only on the FIRST passing attempt.
    const alreadyRewarded = await ExamAttempt.exists({ user: req.user!._id, exam: exam._id, rewardGranted: true })
    const rewardGranted = passed && !alreadyRewarded

    const attempt = await ExamAttempt.create({
      user: req.user!._id, exam: exam._id, course: exam.course,
      answers, scorePercent, passed, rewardGranted,
    })

    let certificate = null
    if (rewardGranted && exam.rewardPoints > 0) {
      await User.updateOne({ _id: req.user!._id }, { $inc: { points: exam.rewardPoints } })
      try {
        await notify(req.user!._id, 'Imtihondan o\'tdingiz! 🎓',
          `"${course.title}" imtihonidan ${scorePercent}% bilan o'tdingiz. +${exam.rewardPoints} ball oldingiz.`, 'success')
      } catch { /* best effort */ }
    }
    if (passed) {
      certificate = await maybeIssueCertificate(req.user!._id.toString(), String(exam.course), req.user!.name)
    }

    res.json({
      status: 'success',
      result: { scorePercent, passed, passingScore: exam.passingScore, earnedPoints: rewardGranted ? exam.rewardPoints : 0, attemptId: attempt._id },
      certificate,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}
