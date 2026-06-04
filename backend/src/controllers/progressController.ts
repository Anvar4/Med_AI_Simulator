import { Request, Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { Certificate, generateSerial } from '../models/Certificate'
import { Course } from '../models/Course'
import { Video } from '../models/Video'
import { VideoProgress } from '../models/VideoProgress'

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

    // If this completion finishes the course, issue a certificate.
    let certificate = null
    if (progress.completed && !wasCompleted) {
      certificate = await maybeIssueCertificate(req.user!._id.toString(), video.course.toString(), req.user!.name)
    }

    res.json({ status: 'success', progress, certificate })
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
