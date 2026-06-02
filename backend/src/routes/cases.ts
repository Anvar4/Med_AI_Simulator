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
import { optionalAuth, protect, restrictTo } from '../middleware/auth'

const router = Router()

// Public routes
router.get('/', getAllCases)
router.get('/categories', getCategories)

// Content-manager own-cases routes (must be before /:id)
router.get('/my', protect, restrictTo('admin', 'instructor'), getCMCases)
router.get('/cm-stats', protect, restrictTo('admin', 'instructor'), getCMStats)

router.get('/:id', optionalAuth, getCaseById)

// Protected routes
router.post('/', protect, restrictTo('admin', 'instructor'), createCase)
router.patch('/:id', protect, restrictTo('admin', 'instructor'), updateCase)
// Deletion is admin-only per spec (ownership-based edit stays with instructors).
router.delete('/:id', protect, restrictTo('admin'), deleteCase)

export default router
