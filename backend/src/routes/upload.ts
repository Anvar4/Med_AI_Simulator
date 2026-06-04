import express from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';

import { protect, restrictTo } from '../middleware/auth';
import { buildObjectKey, isSpacesEnabled, uploadToSpaces } from '../services/storageService';

const router = express.Router()

// ── Local disk fallback target (used only when Spaces is not configured) ──
function resolveUploadDir(): string {
  if (process.env.VERCEL) return path.join('/tmp', 'uploads')
  const candidates = [
    path.join(process.cwd(), 'public', 'uploads'),
    path.join(process.cwd(), '..', 'public', 'uploads'),
    path.join(__dirname, '..', '..', 'public', 'uploads'),
    path.join(__dirname, '..', '..', '..', 'public', 'uploads'),
  ]
  for (const dir of candidates) {
    if (fs.existsSync(path.dirname(dir))) return dir
  }
  return candidates[0]
}

// File filter — only allow images, videos, gifs and PDF (payment receipts).
const fileFilter = (_req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm',
    'application/pdf',
  ]
  if (allowedMimes.includes(file.mimetype)) cb(null, true)
  else cb(new Error('Faqat rasm (JPEG, PNG, GIF, WebP), video (MP4, WebM) yoki PDF formatlariga ruxsat beriladi'))
}

// Always buffer in memory; the storage backend (Spaces vs disk) is decided per
// request inside the handler so env vars are read after dotenv has loaded.
const upload = multer({ storage: multer.memoryStorage(), fileFilter, limits: { fileSize: 50 * 1024 * 1024 } })

function saveToDisk(file: Express.Multer.File): string {
  let dir = resolveUploadDir()
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  } catch {
    dir = path.join('/tmp', 'uploads')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  }
  const ext = path.extname(file.originalname)
  const safeName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_')
  const filename = `${safeName}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
  fs.writeFileSync(path.join(dir, filename), file.buffer)
  return filename
}

// POST /api/upload — upload a file (instructor/admin only)
router.post('/', protect, restrictTo('instructor', 'admin'), (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      res.status(400).json({ message: err.message || 'Fayl yuklashda xatolik' })
      return
    }
    if (!req.file) {
      res.status(400).json({ message: 'Fayl yuklanmadi' })
      return
    }

    try {
      let fileUrl: string
      let filename: string
      if (isSpacesEnabled()) {
        const key = buildObjectKey(req.file.originalname, 'uploads')
        fileUrl = await uploadToSpaces(req.file.buffer, key, req.file.mimetype)
        filename = path.basename(key)
      } else {
        filename = saveToDisk(req.file)
        fileUrl = `/uploads/${filename}`
      }

      res.json({
        message: 'Fayl muvaffaqiyatli yuklandi',
        file: {
          url: fileUrl,
          filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
        },
      })
    } catch (uploadErr) {
      console.error('Upload error:', uploadErr)
      res.status(500).json({ message: 'Faylni saqlashda xatolik yuz berdi' })
    }
  })
})

export default router
