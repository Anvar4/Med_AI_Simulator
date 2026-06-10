import { Request, Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { Certificate, generateSerial } from '../models/Certificate'
import { Course } from '../models/Course'
import { Exam } from '../models/Exam'
import { ExamAttempt } from '../models/ExamAttempt'
import { notify } from '../models/Notification'
import { Video } from '../models/Video'
import { VideoProgress } from '../models/VideoProgress'

// Motivational milestones (course completion %). When a user crosses one of
// these by completing a video, they get an in-app notification.
const MILESTONES = [25, 50, 75, 100] as const

function milestoneMessage(percent: number, courseTitle: string): { title: string; message: string } | null {
  switch (percent) {
    case 25:
      return { title: 'Ajoyib boshlanish! 🎯', message: `"${courseTitle}" kursining 25% qismini tugatdingiz. Davom eting!` }
    case 50:
      return { title: 'Yarmidasiz! 🔥', message: `"${courseTitle}" kursining yarmini tugatdingiz. Zo'r ketyapsiz!` }
    case 75:
      return { title: 'Deyarli tayyor! 💪', message: `"${courseTitle}" kursining 75% qismini tugatdingiz. Oz qoldi!` }
    case 100:
      return { title: 'Tabriklaymiz! 🏆', message: `"${courseTitle}" kursini to'liq tugatdingiz. Sertifikatingizni oling!` }
    default:
      return null
  }
}

const COMPLETION_THRESHOLD = 0.9
// When a video's duration is unknown (YouTube length not stored), require this
// much real playback before an explicit "mark complete" is honored. This stops
// a client from forging completion by posting {completed:true, positionSeconds:0}.
const MIN_WATCH_SECONDS = 30

/**
 * Decide whether a video should be marked complete. Completion is derived from
 * the SERVER-validated playback position, never from a bare client flag:
 *  - duration known  -> position must reach COMPLETION_THRESHOLD of it.
 *  - duration unknown -> the client may request completion, but only once at
 *    least MIN_WATCH_SECONDS of genuine playback has been recorded.
 * Pure & dependency-free so it can be unit-tested.
 */
export function shouldComplete(
  positionSeconds: number,
  durationSeconds: number,
  explicit?: boolean
): boolean {
  if (durationSeconds > 0) {
    return positionSeconds >= durationSeconds * COMPLETION_THRESHOLD
  }
  // Unknown duration: honor an explicit request only with real watch time.
  return explicit === true && positionSeconds >= MIN_WATCH_SECONDS
}

// ─── Save / update video progress ──────────────────────────────
// POST /api/courses/videos/:videoId/progress  body: { positionSeconds, completed? }
export const saveVideoProgress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const video = await Video.findById(req.params.videoId)
    if (!video) {
      res.status(404).json({ message: 'Video topilmadi' })
      return
    }

    // Entitlement check: progress (and any certificate it would unlock) may only
    // be accrued on content the user can actually access. Staff bypass; everyone
    // else needs a published course and, for premium courses, an active premium.
    const isStaff = req.user!.role === 'admin' || req.user!.role === 'instructor'
    if (!isStaff) {
      const course = await Course.findById(video.course).select('isPublished isPremium')
      if (!course || !course.isPublished || !video.isPublished) {
        res.status(403).json({ message: 'Bu kursga kirish huquqingiz yo\'q' })
        return
      }
      if (course.isPremium && !req.user!.isPremium) {
        res.status(403).json({ message: 'Bu premium kurs. Pro obunani faollashtiring.', premiumRequired: true })
        return
      }
    }

    const positionSeconds = Math.max(0, Number(req.body.positionSeconds) || 0)
    const completed = shouldComplete(positionSeconds, video.durationSeconds, req.body.completed === true)

    const existing = await VideoProgress.findOne({ user: req.user!._id, video: video._id })
    const wasCompleted = existing?.completed ?? false

    const progress = await VideoProgress.findOneAndUpdate(
      { user: req.user!._id, video: video._id },
      {
        user: req.user!._id,
        video: video._id,
        course: video.course,
        positionSeconds,
        completed: completed || wasCompleted, // never un-complete
        lastWatchedAt: new Date(),
        ...((completed && !wasCompleted) ? { completedAt: new Date() } : {}),
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )

    // If this completion finishes the course, issue a certificate; and when a
    // milestone (25/50/75/100%) is newly crossed, send a motivational notice.
    let certificate = null
    if (progress.completed && !wasCompleted) {
      certificate = await maybeIssueCertificate(req.user!._id.toString(), video.course.toString(), req.user!.name)

      try {
        const [totalVideos, completedVideos, course] = await Promise.all([
          Video.countDocuments({ course: video.course, isPublished: true }),
          VideoProgress.countDocuments({ user: req.user!._id, course: video.course, completed: true }),
          Course.findById(video.course).select('title'),
        ])
        if (totalVideos > 0 && course) {
          const newPercent = Math.round((completedVideos / totalVideos) * 100)
          // Percent before this video completed (one fewer completed video).
          const prevPercent = Math.round(((completedVideos - 1) / totalVideos) * 100)
          for (const m of MILESTONES) {
            if (prevPercent < m && newPercent >= m) {
              const msg = milestoneMessage(m, course.title)
              if (msg) await notify(req.user!._id, msg.title, msg.message, m === 100 ? 'success' : 'info')
            }
          }
        }
      } catch { /* bildirishnoma muvaffaqiyatsizligi progressni buzmasin */ }
    }

    // Tell the client whether a (not-yet-passed) exam now gates the certificate.
    let examRequired = false
    if (!certificate) {
      const [totalVideos, completedVideos] = await Promise.all([
        Video.countDocuments({ course: video.course, isPublished: true }),
        VideoProgress.countDocuments({ user: req.user!._id, course: video.course, completed: true }),
      ])
      if (totalVideos > 0 && completedVideos >= totalVideos) {
        const exam = await Exam.findOne({ course: video.course, isPublished: true }).select('_id')
        if (exam) {
          const passed = await ExamAttempt.exists({ user: req.user!._id, exam: exam._id, passed: true })
          examRequired = !passed
        }
      }
    }

    res.json({ status: 'success', progress, certificate, examRequired })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

/**
 * Issue a certificate if every published video in the course is completed by
 * the user. Idempotent: returns the existing certificate if already issued,
 * and null if the course isn't finished yet.
 */
export async function maybeIssueCertificate(
  userId: string,
  courseId: string,
  recipientName: string
) {
  const totalVideos = await Video.countDocuments({ course: courseId, isPublished: true })
  if (totalVideos === 0) return null

  const completedVideos = await VideoProgress.countDocuments({
    user: userId,
    course: courseId,
    completed: true,
  })
  if (completedVideos < totalVideos) return null

  // If the course has a published exam, the user must also have passed it.
  const exam = await Exam.findOne({ course: courseId, isPublished: true }).select('_id')
  if (exam) {
    const passed = await ExamAttempt.exists({ user: userId, exam: exam._id, passed: true })
    if (!passed) return null
  }

  const existing = await Certificate.findOne({ user: userId, course: courseId })
  if (existing) return existing

  const course = await Course.findById(courseId)
  if (!course) return null

  try {
    return await Certificate.create({
      user: userId,
      course: courseId,
      serial: generateSerial(),
      recipientName,
      courseTitle: course.title,
    })
  } catch {
    // Unique index race — fetch whatever got persisted.
    return Certificate.findOne({ user: userId, course: courseId })
  }
}

// ─── My certificates ───────────────────────────────────────────
// GET /api/courses/certificates/my
export const getMyCertificates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const certs = await Certificate.find({ user: req.user!._id })
      .populate('course', 'title slug category')
      .sort({ issuedAt: -1 })
    res.json({ status: 'success', certificates: certs })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

// ─── Public certificate verification ───────────────────────────
// GET /api/courses/certificates/verify/:serial
export const verifyCertificate = async (req: Request, res: Response): Promise<void> => {
  try {
    const cert = await Certificate.findOne({ serial: req.params.serial })
      .populate('course', 'title slug')
    if (!cert) {
      res.status(404).json({ status: 'fail', valid: false, message: 'Sertifikat topilmadi' })
      return
    }
    res.json({
      status: 'success',
      valid: true,
      certificate: {
        serial: cert.serial,
        recipientName: cert.recipientName,
        courseTitle: cert.courseTitle,
        issuedAt: cert.issuedAt,
      },
    })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

export { COMPLETION_THRESHOLD }
