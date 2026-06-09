import { Router } from 'express'
import {
  createCourse,
  createPlaylist,
  createVideo,
  deleteCourse,
  deletePlaylist,
  deleteVideo,
  getCourse,
  getCourseCategories,
  listCourses,
  reorderPlaylists,
  reorderVideos,
  updateCourse,
  updatePlaylist,
  updateVideo,
} from '../controllers/courseController'
import {
  getMyCertificates,
  saveVideoProgress,
  verifyCertificate,
} from '../controllers/progressController'
import { optionalAuth, protect, restrictTo } from '../middleware/auth'

const router = Router()

const staff = restrictTo('admin', 'instructor')

// ─── Public (viewer-aware via optionalAuth) ────────────────────
router.get('/', optionalAuth, listCourses)
router.get('/categories', getCourseCategories)
router.get('/certificates/verify/:serial', verifyCertificate)

// ─── Authenticated user actions (before /:idOrSlug) ────────────
router.get('/certificates/my', protect, getMyCertificates)
router.post('/videos/:videoId/progress', protect, saveVideoProgress)

// ─── Course detail (slug or id) ────────────────────────────────
router.get('/:idOrSlug', optionalAuth, getCourse)

// ─── CM/Admin: Course CRUD ─────────────────────────────────────
router.post('/', protect, staff, createCourse)
router.patch('/:id', protect, staff, updateCourse)
router.delete('/:id', protect, staff, deleteCourse)

// ─── CM/Admin: Playlist CRUD ───────────────────────────────────
router.post('/:courseId/playlists', protect, staff, createPlaylist)
router.patch('/:courseId/playlists/reorder', protect, staff, reorderPlaylists)
router.patch('/playlists/:id', protect, staff, updatePlaylist)
router.delete('/playlists/:id', protect, staff, deletePlaylist)

// ─── CM/Admin: Video CRUD ──────────────────────────────────────
router.post('/playlists/:playlistId/videos', protect, staff, createVideo)
router.patch('/playlists/:playlistId/reorder', protect, staff, reorderVideos)
router.patch('/videos/:id', protect, staff, updateVideo)
router.delete('/videos/:id', protect, staff, deleteVideo)

export default router
