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

const router = Router()

// Public routes
router.post('/register', register)
router.post('/login', login)
router.post('/google', googleAuth)
router.post('/google-access-token', googleAuthAccessToken)
router.post('/send-otp', sendOTP)
router.post('/verify-otp', verifyOTP)
router.post('/complete-register', completeRegister)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)

// Protected routes
router.get('/me', protect, getMe)
router.patch('/me', protect, updateProfile)
router.post('/request-password-change', protect, requestPasswordChange)
router.post('/confirm-password-change', protect, confirmPasswordChange)
router.post('/request-email-change', protect, requestEmailChange)
router.post('/confirm-email-change', protect, confirmEmailChange)
router.post('/request-username-change', protect, requestUsernameChange)
router.post('/confirm-username-change', protect, confirmUsernameChange)

export default router
