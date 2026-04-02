import { Router } from 'express'
import { analysisChatMessage, chatMessage } from '../controllers/chatController'
import { protect } from '../middleware/auth'

const router = Router()

router.use(protect)

// POST /api/chat — general floating chatbot
router.post('/', chatMessage)

// POST /api/chat/analysis — analysis page AI with user stats context
router.post('/analysis', analysisChatMessage)

export default router
