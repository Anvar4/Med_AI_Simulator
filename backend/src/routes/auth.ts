import { Router } from 'express'
import {
    completeRegister,
    confirmEmailChange,
    confirmPasswordChange,
    confirmUsernameChange,
    forgotPassword,
    getMe,
    googleAuth,
    googleAuthAccessToken,
    login,
    logout,
    refreshToken,
    register,
    requestEmailChange,
    requestPasswordChange,
    requestUsernameChange,
    resetPassword,
    sendOTP,
    updateProfile,
    verifyOTP,
} from '../controllers/authController'
import { protect } from '../middleware/auth'
import { createWindowRateLimiter } from '../middleware/bruteForce'

const router = Router()

// Strict rate limiting for auth endpoints (10 req / 15 min per IP)
const authLimiter = createWindowRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Juda ko\'p urinish. 15 daqiqadan so\'ng qayta urinib ko\'ring.',
})

// OTP / login endpoints get extra tight limits
const otpLimiter = createWindowRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: 'OTP so\'rovlar cheklandi. 10 daqiqadan so\'ng urinib ko\'ring.',
})

// Public routes
router.post('/register', authLimiter, register)
router.post('/login', authLimiter, login)
router.post('/google', authLimiter, googleAuth)
router.post('/google-access-token', authLimiter, googleAuthAccessToken)
router.post('/send-otp', otpLimiter, sendOTP)
router.post('/verify-otp', otpLimiter, verifyOTP)
router.post('/complete-register', authLimiter, completeRegister)
router.post('/forgot-password', otpLimiter, forgotPassword)
router.post('/reset-password', authLimiter, resetPassword)
router.post('/refresh', refreshToken)

// Protected routes
router.post('/logout', protect, logout)
router.get('/me', protect, getMe)
router.patch('/me', protect, updateProfile)
router.post('/request-password-change', protect, requestPasswordChange)
router.post('/confirm-password-change', protect, confirmPasswordChange)
router.post('/request-email-change', protect, requestEmailChange)
router.post('/confirm-email-change', protect, confirmEmailChange)
router.post('/request-username-change', protect, requestUsernameChange)
router.post('/confirm-username-change', protect, confirmUsernameChange)

export default router
