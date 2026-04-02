import { Router } from 'express'
import {
    getDashboardStats,
    getMyAttempts,
    startAttempt,
    submitAttempt,
} from '../controllers/attemptController'
import { protect } from '../middleware/auth'

const router = Router()

// All routes are protected
router.use(protect)

router.get('/dashboard', getDashboardStats)
router.get('/my', getMyAttempts)
router.post('/start/:caseId', startAttempt)
router.post('/submit/:attemptId', submitAttempt)

export default router
