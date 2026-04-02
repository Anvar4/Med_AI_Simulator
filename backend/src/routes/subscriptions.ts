import { Router } from 'express'
import { applyPromoCode, getMySubscription, getPlans, getReferralInfo, subscribe } from '../controllers/subscriptionController'
import { protect } from '../middleware/auth'

const router = Router()

// Public
router.get('/plans', getPlans)

// Protected
router.use(protect)
router.get('/my', getMySubscription)
router.get('/referral', getReferralInfo)
router.post('/apply-promo', applyPromoCode)
router.post('/subscribe', subscribe)

export default router
