import express from 'express'
import fs from 'fs'
import multer from 'multer'
import path from 'path'

import { protect, restrictTo } from '../middleware/auth'

const router = express.Router()

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', '..', '..', 'public', 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir)
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    // Sanitize original name - remove non-alphanumeric characters
    const safeName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_')
    cb(null, `${safeName}-${uniqueSuffix}${ext}`)
  },
})

// File filter - only allow images, videos, and gifs
const fileFilter = (_req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
  ]
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Faqat rasm (JPEG, PNG, GIF, WebP) va video (MP4, WebM) formatlariga ruxsat beriladi'))
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
})

// POST /api/upload - Upload a file (instructor/admin only)
router.post('/', protect, restrictTo('instructor', 'admin'), (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      res.status(400).json({ message: err.message || 'Fayl yuklashda xatolik' })
      return
    }

    if (!req.file) {
      res.status(400).json({ message: 'Fayl yuklanmadi' })
      return
    }

    const fileUrl = `/uploads/${req.file.filename}`

    res.json({
      message: 'Fayl muvaffaqiyatli yuklandi',
      file: {
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
    })
  })
})

export default router
