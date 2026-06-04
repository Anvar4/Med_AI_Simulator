import { Router } from 'express'
import { getLearningPath, getRecommendations } from '../controllers/learningController'
import { protect } from '../middleware/auth'

const router = Router()

router.use(protect)
router.get('/path', getLearningPath)
router.get('/recommendations', getRecommendations)

export default router
