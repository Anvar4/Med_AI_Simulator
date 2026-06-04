import { Router } from 'express'
import {
  createTopUp,
  getActiveCards,
  getMyBalance,
  getMySubscriptions,
  getMyTopUps,
  getNotifications,
  markNotificationsRead,
  subscribeFromBalance,
} from '../controllers/balanceController'
import { protect } from '../middleware/auth'

const router = Router()

router.use(protect)

router.get('/me', getMyBalance)
router.get('/cards', getActiveCards)
router.post('/topup', createTopUp)
router.get('/topups', getMyTopUps)
router.get('/subscriptions', getMySubscriptions)
router.post('/subscribe', subscribeFromBalance)

router.get('/notifications', getNotifications)
router.post('/notifications/read', markNotificationsRead)

export default router
