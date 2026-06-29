import express from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';

import { protect, restrictTo } from '../middleware/auth';
import { rejectJsInPdf, sanitizeFilename, validateUploadedFile } from '../middleware/uploadSecurity';
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

// Allowlist: only safe MIME types
const ALLOWED_MIMES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/webm',
  'application/pdf',
])

const fileFilter = (_req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_MIMES.has(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Faqat rasm (JPEG, PNG, GIF, WebP), video (MP4, WebM) yoki PDF formatlariga ruxsat beriladi'))
  }
}

// Buffer in memory — validated before writing to disk/S3
// 200MB max for video uploads
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 200 * 1024 * 1024, files: 1 },
})

function saveToDisk(file: Express.Multer.File): string {
  let dir = resolveUploadDir()
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  } catch {
    dir = path.join('/tmp', 'uploads')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  }
  const ext = path.extname(file.originalname)
  // sanitizeFilename already called by validateUploadedFile
  const safeName = sanitizeFilename(path.basename(file.originalname, ext)).replace(/[^a-zA-Z0-9_-]/g, '_')
  const filename = `${safeName}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
  fs.writeFileSync(path.join(dir, filename), file.buffer)
  return filename
}

// POST /api/upload — upload a file (instructor/admin only)
router.post(
  '/',
  protect,
  restrictTo('instructor', 'admin'),
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        res.status(400).json({ message: err.message || 'Fayl yuklashda xatolik' })
        return
      }
      if (!req.file) {
        res.status(400).json({ message: 'Fayl yuklanmadi' })
        return
      }
      // Security: magic bytes + extension + PDF JS check
      validateUploadedFile(req, res, () => {
        rejectJsInPdf(req, res, next)
      })
    })
  },
  async (req: express.Request, res: express.Response) => {
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
  },
)

export default router
