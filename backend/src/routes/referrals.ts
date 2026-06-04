import { Router } from 'express'
import { getMyReferralStats } from '../controllers/referralController'
import { protect } from '../middleware/auth'

const router = Router()

router.use(protect)
router.get('/me', getMyReferralStats)

export default router
