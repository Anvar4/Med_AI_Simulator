import { Router } from 'express'
import {
    createCategory,
    createUser,
    deleteCategory,
    deleteUser,
    exportPromoCodes,
    generatePromoCodes,
    getAdminAnalytics,
    getCategories,
    getPromoCodes,
    getRecentActivity,
    getSystemStats,
    getUserById,
    getUsers,
    updateCategory,
    updateUser,
} from '../controllers/adminController'
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

export default router
