import express, { Router } from 'express'
import { clickCallback, getCheckoutUrl, paymeCallback } from '../controllers/paymentController'
import { protect } from '../middleware/auth'

const router = Router()

// Gateway callbacks are authenticated by signature (Click) / Basic auth (Payme),
// NOT by our JWT — the payment provider's servers call these.
// Click sends application/x-www-form-urlencoded; ensure it's parsed here.
router.post('/click', express.urlencoded({ extended: false }), clickCallback)
router.post('/payme', express.json(), paymeCallback)

// Authenticated: produce a hosted-checkout URL for a pending payment request.
router.get('/checkout/:paymentRequestId', protect, getCheckoutUrl)

export default router
