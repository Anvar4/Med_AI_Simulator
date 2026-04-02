import { Router } from 'express'
import {
    createCase,
    deleteCase,
    getAllCases,
    getCaseById,
    getCategories,
    getCMCases,
    getCMStats,
    updateCase,
} from '../controllers/caseController'
import { protect, restrictTo } from '../middleware/auth'

const router = Router()

// Public routes
router.get('/', getAllCases)
router.get('/categories', getCategories)

// Content-manager own-cases routes (must be before /:id)
router.get('/my', protect, restrictTo('admin', 'instructor'), getCMCases)
router.get('/cm-stats', protect, restrictTo('admin', 'instructor'), getCMStats)

router.get('/:id', getCaseById)

// Protected routes (admin/instructor only)
router.post('/', protect, restrictTo('admin', 'instructor'), createCase)
router.patch('/:id', protect, restrictTo('admin', 'instructor'), updateCase)
router.delete('/:id', protect, restrictTo('admin', 'instructor'), deleteCase)

export default router
