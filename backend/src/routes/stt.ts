import { Router } from 'express'
import multer from 'multer'
import { speechToText } from '../controllers/sttController'
import { protect } from '../middleware/auth'

const router = Router()

// Keep the audio in memory — it's short and forwarded straight to Aisha.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB cap for a voice clip
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) cb(null, true)
    else cb(new Error('Faqat audio fayllarga ruxsat beriladi'))
  },
})

// POST /api/stt — transcribe a recorded audio blob (field: audio)
router.post('/', protect, (req, res) => {
  upload.single('audio')(req, res, err => {
    if (err) {
      res.status(400).json({ message: err.message || 'Audio yuklashda xatolik' })
      return
    }
    speechToText(req, res)
  })
})

export default router
