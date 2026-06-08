import { Router } from 'express'
import {
    confirmPaymentRequest,
    createCategory,
    createUser,
    deleteCategory,
    deleteUser,
    exportPromoCodes,
    generatePromoCodes,
    getAdminAnalytics,
    getCategories,
    getPaymentRequests,
    getPromoCodes,
    getRecentActivity,
    getSystemStats,
    getUserById,
    getUsers,
    rejectPaymentRequest,
    updateCategory,
    updateUser,
} from '../controllers/adminController'
import { getCaseStats, getReferralAnalytics, getRevenueAnalytics, getServerHealth } from '../controllers/analyticsController'
import {
    deleteTicket,
    getSupportStats,
    getSupportTickets,
    getTicketAttachment,
    replyToTicket,
    updateTicketStatus,
} from '../controllers/supportController'
import {
    approveTopUpAdmin,
    createCard,
    deleteCard,
    listCards,
    listTopUps,
    rejectTopUpAdmin,
    updateCard,
} from '../controllers/paymentAdminController'
import { protect, restrictTo } from '../middleware/auth'

const router = Router()

// All admin routes require authentication and admin role
router.use(protect)

// Categories readable by admin + instructor (content managers need them)
router.get('/categories', restrictTo('admin', 'instructor'), getCategories)

// Everything else: admin only
router.use(restrictTo('admin'))

router.get('/stats', getSystemStats)
router.get('/activity', getRecentActivity)
router.get('/analytics', getAdminAnalytics)
router.get('/revenue', getRevenueAnalytics)
router.get('/server-health', getServerHealth)
router.get('/case-stats', getCaseStats)
router.get('/referrals', getReferralAnalytics)

// Support tickets (from the Telegram support bot)
router.get('/support/stats', getSupportStats)
router.get('/support/tickets', getSupportTickets)
router.get('/support/tickets/:id/attachment/:index', getTicketAttachment)
router.patch('/support/tickets/:id', updateTicketStatus)
router.post('/support/tickets/:id/reply', replyToTicket)
router.delete('/support/tickets/:id', deleteTicket)

router.get('/users', getUsers)
router.get('/users/:id', getUserById)
router.post('/users', createUser)
router.patch('/users/:id', updateUser)
router.delete('/users/:id', deleteUser)

router.post('/categories', createCategory)
router.patch('/categories/:id', updateCategory)
router.delete('/categories/:id', deleteCategory)

router.post('/promo-codes', generatePromoCodes)
router.get('/promo-codes', getPromoCodes)
router.get('/promo-codes/export', exportPromoCodes)

// Payment requests (manual confirmation until gateway is wired in)
router.get('/payments', getPaymentRequests)
router.post('/payments/:id/confirm', confirmPaymentRequest)
router.post('/payments/:id/reject', rejectPaymentRequest)

// Payment cards CRUD
router.get('/cards', listCards)
router.post('/cards', createCard)
router.patch('/cards/:id', updateCard)
router.delete('/cards/:id', deleteCard)

// Balance top-up requests
router.get('/topups', listTopUps)
router.post('/topups/:id/approve', approveTopUpAdmin)
router.post('/topups/:id/reject', rejectTopUpAdmin)

export default router
