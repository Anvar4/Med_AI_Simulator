import { Router } from 'express'
import { textToSpeech } from '../controllers/ttsController'
import { protect } from '../middleware/auth'

const router = Router()

// POST /api/tts — convert text to speech via Aisha API
router.post('/', protect, textToSpeech)

export default router
