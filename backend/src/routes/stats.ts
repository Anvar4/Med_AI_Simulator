import { Router } from 'express'
import { getLeaderboard, getUserAnalysis, getUserStats } from '../controllers/statsController'
import { protect } from '../middleware/auth'

const router = Router()

router.use(protect)

router.get('/me', getUserStats)
router.get('/analysis', getUserAnalysis)
router.get('/leaderboard', getLeaderboard)

export default router
