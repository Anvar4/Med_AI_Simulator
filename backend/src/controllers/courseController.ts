import { Request, Response } from 'express'
import mongoose from 'mongoose'
import { AuthRequest } from '../middleware/auth'
import { Course, slugify } from '../models/Course'
import { Playlist } from '../models/Playlist'
import { Video, parseYoutubeId } from '../models/Video'
import { VideoProgress } from '../models/VideoProgress'
import { escapeRegex } from './caseSecurity'

function isStaff(req: AuthRequest): boolean {
  return req.user?.role === 'admin' || req.user?.role === 'instructor'
}

/** Copy whitelisted fields from a request body onto a Mongoose document. */
function applyFields(doc: object, body: Record<string, unknown>, fields: string[]): void {
  const target = doc as unknown as Record<string, unknown>
  for (const f of fields) {
    if (body[f] !== undefined) target[f] = body[f]
  }
}

async function uniqueSlug(title: string): Promise<string> {
  const base = slugify(title) || 'kurs'
  let slug = base
  let n = 1
  // Avoid collisions deterministically.
  while (await Course.exists({ slug })) {
    slug = `${base}-${n++}`
  }
  return slug
}

// ─── Public: course catalog ────────────────────────────────────
// GET /api/courses?category=&search=&level=&page=&limit=
export const listCourses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, search, level, page = '1', limit = '12', mine } = req.query

    const filter: Record<string, unknown> = {}
    // CM panel (mine=true, staff only) sees its own courses regardless of publish
    // state; admins see all. Everyone else (public catalog) sees published only.
    if (mine === 'true' && isStaff(req)) {
      if (req.user!.role !== 'admin') filter.createdBy = req.user!._id
    } else {
      filter.isPublished = true
    }
    if (category && category !== 'Barchasi') filter.category = category as string
    if (level && ['beginner', 'intermediate', 'advanced'].includes(level as string)) {
      filter.level = level as string
    }
    if (search) {
      const safe = escapeRegex(search as string)
      filter.$or = [
        { title: { $regex: safe, $options: 'i' } },
        { description: { $regex: safe, $options: 'i' } },
        { author: { $regex: safe, $options: 'i' } },
      ]
    }

    const pageNum = Math.max(1, parseInt(page as string))
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)))

    const [courses, total] = await Promise.all([
      Course.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
      Course.countDocuments(filter),
    ])

    // Attach video counts so cards can show "N ta dars" without a second request.
    const courseIds = courses.map(c => c._id)
    const counts = await Video.aggregate([
      { $match: { course: { $in: courseIds }, isPublished: true } },
      { $group: { _id: '$course', videoCount: { $sum: 1 } } },
    ])
    const countMap = new Map(counts.map(c => [String(c._id), c.videoCount]))

    res.json({
      status: 'success',
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      courses: courses.map(c => ({ ...c, videoCount: countMap.get(String(c._id)) || 0 })),
    })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

// GET /api/courses/categories
export const getCourseCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const cats = await Course.aggregate([
      { $match: { isPublished: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ])
    res.json({ status: 'success', categories: cats.map(c => ({ name: c._id, count: c.count })) })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

// ─── Public: full course (playlists + videos), with viewer progress ────
// GET /api/courses/:idOrSlug
export const getCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const key = req.params.idOrSlug as string
    const course = mongoose.isValidObjectId(key)
      ? await Course.findById(key).lean()
      : await Course.findOne({ slug: key }).lean()

    if (!course || (!course.isPublished && !isStaff(req))) {
      res.status(404).json({ message: 'Kurs topilmadi' })
      return
    }

    // Premium gating: non-premium, non-staff users get a locked course (no videos).
    const locked = course.isPremium && !req.user?.isPremium && !isStaff(req)

    // Staff manage drafts too; public viewers see published content only.
    const pubFilter = isStaff(req) ? {} : { isPublished: true }

    const playlists = await Playlist.find({ course: course._id, ...pubFilter })
      .sort({ order: 1, createdAt: 1 })
      .lean()

    const videos = locked
      ? []
      : await Video.find({ course: course._id, ...pubFilter })
          .sort({ order: 1, createdAt: 1 })
          .lean()

    // Viewer progress map (completed video ids)
    let completedIds = new Set<string>()
    if (req.user && !locked) {
      const prog = await VideoProgress.find({ user: req.user._id, course: course._id }).lean()
      completedIds = new Set(prog.filter(p => p.completed).map(p => String(p.video)))
    }

    const playlistsWithVideos = playlists.map(p => ({
      ...p,
      videos: videos
        .filter(v => String(v.playlist) === String(p._id))
        .map(v => ({ ...v, completed: completedIds.has(String(v._id)) })),
    }))

    const totalVideos = videos.length
    const completedCount = videos.filter(v => completedIds.has(String(v._id))).length

    res.json({
      status: 'success',
      course: {
        ...course,
        locked,
        playlists: playlistsWithVideos,
        progress: {
          totalVideos,
          completedVideos: completedCount,
          percent: totalVideos ? Math.round((completedCount / totalVideos) * 100) : 0,
        },
      },
    })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

// ─── CM/Admin: Course CRUD ─────────────────────────────────────
export const createCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, category, level, isPremium, coverImage, instructor, language, durationLabel } = req.body
    if (!title || typeof title !== 'string') {
      res.status(400).json({ message: 'Kurs sarlavhasi majburiy' })
      return
    }
    const author = (typeof req.body.author === 'string' && req.body.author.trim())
      || req.user?.name || 'Noma\'lum'

    const course = await Course.create({
      title: title.trim(),
      slug: await uniqueSlug(title),
      description: typeof description === 'string' ? description : '',
      category: typeof category === 'string' && category.trim() ? category.trim() : 'Umumiy',
      author,
      instructor: typeof instructor === 'string' && instructor.trim() ? instructor.trim() : undefined,
      language: ['uz', 'ru', 'en'].includes(language) ? language : 'uz',
      durationLabel: typeof durationLabel === 'string' ? durationLabel.trim() : undefined,
      level: ['beginner', 'intermediate', 'advanced'].includes(level) ? level : 'beginner',
      isPremium: !!isPremium,
      coverImage: typeof coverImage === 'string' ? coverImage : undefined,
      // Admins publish directly; instructors start unpublished (review-style).
      isPublished: req.user?.role === 'admin',
      createdBy: req.user!._id,
    })
    res.status(201).json({ status: 'success', course })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

async function loadOwnedCourse(req: AuthRequest, res: Response) {
  const course = await Course.findById(req.params.id)
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

export const updateCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const course = await loadOwnedCourse(req, res)
    if (!course) return

    applyFields(course, req.body, ['title', 'description', 'category', 'author', 'instructor', 'language', 'durationLabel', 'level', 'isPremium', 'coverImage'])
    // Only admins may toggle publish state.
    if (req.user!.role === 'admin' && typeof req.body.isPublished === 'boolean') {
      course.isPublished = req.body.isPublished
    }
    await course.save()
    res.json({ status: 'success', course })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

export const deleteCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const course = await loadOwnedCourse(req, res)
    if (!course) return
    // Cascade: remove playlists, videos and progress for this course.
    await Promise.all([
      Playlist.deleteMany({ course: course._id }),
      Video.deleteMany({ course: course._id }),
      VideoProgress.deleteMany({ course: course._id }),
    ])
    await course.deleteOne()
    res.json({ status: 'success', message: 'Kurs va unga tegishli barcha kontent o\'chirildi' })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

// ─── CM/Admin: Playlist CRUD ───────────────────────────────────
export const createPlaylist = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const course = await Course.findById(req.params.courseId)
    if (!course) {
      res.status(404).json({ message: 'Kurs topilmadi' })
      return
    }
    if (req.user!.role !== 'admin' && course.createdBy?.toString() !== req.user!._id.toString()) {
      res.status(403).json({ message: 'Ruxsat berilmagan' })
      return
    }
    const { title, description, order } = req.body
    if (!title) {
      res.status(400).json({ message: 'Pleylist sarlavhasi majburiy' })
      return
    }
    const playlist = await Playlist.create({
      course: course._id,
      title: String(title).trim(),
      description: typeof description === 'string' ? description : '',
      order: typeof order === 'number' ? order : 0,
      createdBy: req.user!._id,
    })
    res.status(201).json({ status: 'success', playlist })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

async function loadOwnedPlaylist(req: AuthRequest, res: Response) {
  const playlist = await Playlist.findById(req.params.id)
  if (!playlist) {
    res.status(404).json({ message: 'Pleylist topilmadi' })
    return null
  }
  if (req.user!.role !== 'admin' && playlist.createdBy?.toString() !== req.user!._id.toString()) {
    res.status(403).json({ message: 'Ruxsat berilmagan' })
    return null
  }
  return playlist
}

export const updatePlaylist = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const playlist = await loadOwnedPlaylist(req, res)
    if (!playlist) return
    applyFields(playlist, req.body, ['title', 'description', 'order', 'isPublished'])
    await playlist.save()
    res.json({ status: 'success', playlist })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

export const deletePlaylist = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const playlist = await loadOwnedPlaylist(req, res)
    if (!playlist) return
    await Video.deleteMany({ playlist: playlist._id })
    await playlist.deleteOne()
    res.json({ status: 'success', message: 'Pleylist va videolari o\'chirildi' })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

// ─── CM/Admin: Video CRUD ──────────────────────────────────────
export const createVideo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const playlist = await Playlist.findById(req.params.playlistId)
    if (!playlist) {
      res.status(404).json({ message: 'Pleylist topilmadi' })
      return
    }
    if (req.user!.role !== 'admin' && playlist.createdBy?.toString() !== req.user!._id.toString()) {
      res.status(403).json({ message: 'Ruxsat berilmagan' })
      return
    }
    const { title, description, url, videoUrl, durationSeconds, order } = req.body
    if (!title) {
      res.status(400).json({ message: 'Video sarlavhasi majburiy' })
      return
    }
    // Source = 'upload' when a videoUrl is provided; otherwise YouTube link.
    const source: 'youtube' | 'upload' = (req.body.source === 'upload' || (typeof videoUrl === 'string' && videoUrl.trim()))
      ? 'upload'
      : 'youtube'

    const payload: Record<string, unknown> = {
      playlist: playlist._id,
      course: playlist.course,
      title: String(title).trim(),
      description: typeof description === 'string' ? description : '',
      source,
      durationSeconds: typeof durationSeconds === 'number' ? durationSeconds : 0,
      order: typeof order === 'number' ? order : 0,
      createdBy: req.user!._id,
    }

    if (source === 'upload') {
      const u = typeof videoUrl === 'string' ? videoUrl.trim() : ''
      if (!/^https?:\/\//.test(u)) {
        res.status(400).json({ message: 'Yuklangan video uchun yaroqli URL majburiy' })
        return
      }
      payload.videoUrl = u
    } else {
      const youtubeId = parseYoutubeId(typeof url === 'string' ? url : '')
      if (!youtubeId) {
        res.status(400).json({ message: 'Yaroqli YouTube havola majburiy' })
        return
      }
      payload.youtubeId = youtubeId
    }

    const video = await Video.create(payload)
    res.status(201).json({ status: 'success', video })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

export const updateVideo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const video = await Video.findById(req.params.id)
    if (!video) {
      res.status(404).json({ message: 'Video topilmadi' })
      return
    }
    if (req.user!.role !== 'admin' && video.createdBy?.toString() !== req.user!._id.toString()) {
      res.status(403).json({ message: 'Ruxsat berilmagan' })
      return
    }
    // Switch to uploaded source if a videoUrl is supplied.
    if (typeof req.body.videoUrl === 'string' && req.body.videoUrl.trim()) {
      const u = req.body.videoUrl.trim()
      if (!/^https?:\/\//.test(u)) {
        res.status(400).json({ message: 'Yaroqsiz video URL' })
        return
      }
      video.source = 'upload'
      video.videoUrl = u
      video.youtubeId = undefined
    } else if (req.body.url !== undefined) {
      const yt = parseYoutubeId(String(req.body.url))
      if (!yt) {
        res.status(400).json({ message: 'Yaroqsiz YouTube havola' })
        return
      }
      video.source = 'youtube'
      video.youtubeId = yt
      video.videoUrl = undefined
    }
    applyFields(video, req.body, ['title', 'description', 'durationSeconds', 'order', 'isPublished'])
    await video.save()
    res.json({ status: 'success', video })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

export const deleteVideo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const video = await Video.findById(req.params.id)
    if (!video) {
      res.status(404).json({ message: 'Video topilmadi' })
      return
    }
    if (req.user!.role !== 'admin' && video.createdBy?.toString() !== req.user!._id.toString()) {
      res.status(403).json({ message: 'Ruxsat berilmagan' })
      return
    }
    await VideoProgress.deleteMany({ video: video._id })
    await video.deleteOne()
    res.json({ status: 'success', message: 'Video o\'chirildi' })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

// ─── CM/Admin: reorder (drag & drop) ───────────────────────────
// PATCH /api/courses/playlists/:playlistId/reorder  body: { videoIds: string[] }
export const reorderVideos = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Route param is :playlistId (loadOwnedPlaylist reads :id, so load directly).
    const playlist = await Playlist.findById(req.params.playlistId)
    if (!playlist) {
      res.status(404).json({ message: 'Pleylist topilmadi' })
      return
    }
    if (req.user!.role !== 'admin' && playlist.createdBy?.toString() !== req.user!._id.toString()) {
      res.status(403).json({ message: 'Ruxsat berilmagan' })
      return
    }
    const { videoIds } = req.body
    if (!Array.isArray(videoIds)) {
      res.status(400).json({ message: 'videoIds massiv bo\'lishi kerak' })
      return
    }
    // Only reorder videos that actually belong to this playlist.
    const owned = await Video.find({ playlist: playlist._id }).select('_id').lean()
    const ownedSet = new Set(owned.map(v => String(v._id)))
    const ops = videoIds
      .filter((id: unknown): id is string => typeof id === 'string' && ownedSet.has(id))
      .map((id: string, index: number) => ({
        updateOne: { filter: { _id: id }, update: { $set: { order: index } } },
      }))
    if (ops.length) await Video.bulkWrite(ops)
    res.json({ status: 'success', count: ops.length })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

// PATCH /api/courses/:courseId/playlists/reorder  body: { playlistIds: string[] }
export const reorderPlaylists = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const course = await Course.findById(req.params.courseId)
    if (!course) {
      res.status(404).json({ message: 'Kurs topilmadi' })
      return
    }
    if (req.user!.role !== 'admin' && course.createdBy?.toString() !== req.user!._id.toString()) {
      res.status(403).json({ message: 'Ruxsat berilmagan' })
      return
    }
    const { playlistIds } = req.body
    if (!Array.isArray(playlistIds)) {
      res.status(400).json({ message: 'playlistIds massiv bo\'lishi kerak' })
      return
    }
    const owned = await Playlist.find({ course: course._id }).select('_id').lean()
    const ownedSet = new Set(owned.map(p => String(p._id)))
    const ops = playlistIds
      .filter((id: unknown): id is string => typeof id === 'string' && ownedSet.has(id))
      .map((id: string, index: number) => ({
        updateOne: { filter: { _id: id }, update: { $set: { order: index } } },
      }))
    if (ops.length) await Playlist.bulkWrite(ops)
    res.json({ status: 'success', count: ops.length })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

export { isStaff }
