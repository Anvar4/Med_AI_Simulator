import express from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';

import { protect, restrictTo } from '../middleware/auth';

const router = express.Router()

function resolveUploadDir(): string {
  // Vercel serverless runtime allows writes only under /tmp.
  if (process.env.VERCEL) {
    return path.join('/tmp', 'uploads')
  }

  const candidates = [
    path.join(process.cwd(), 'public', 'uploads'),
    path.join(process.cwd(), '..', 'public', 'uploads'),
    path.join(__dirname, '..', '..', 'public', 'uploads'),
    path.join(__dirname, '..', '..', '..', 'public', 'uploads'),
  ]

  for (const dir of candidates) {
    if (fs.existsSync(path.dirname(dir))) {
      return dir
    }
  }

  return candidates[0]
}

// Ensure uploads directory exists
let uploadDir = resolveUploadDir()
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }
} catch {
  uploadDir = path.join('/tmp', 'uploads')
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }
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
    'application/pdf', // payment receipts may be PDF
  ]
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Faqat rasm (JPEG, PNG, GIF, WebP), video (MP4, WebM) yoki PDF formatlariga ruxsat beriladi'))
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
