import { Router } from 'express'
import {
  createBook,
  deleteBook,
  getBook,
  getBookCategories,
  listBooks,
  listBooksAdmin,
  updateBook,
} from '../controllers/bookController'
import { optionalAuth, protect, restrictTo } from '../middleware/auth'

const router = Router()
const staff = restrictTo('admin', 'instructor')

// ─── Public (viewer-aware) ─────────────────────────────────────
router.get('/', optionalAuth, listBooks)
router.get('/categories', getBookCategories)

// ─── CM/Admin (before /:id) ────────────────────────────────────
router.get('/admin/mine', protect, staff, listBooksAdmin)
router.post('/', protect, staff, createBook)
router.patch('/:id', protect, staff, updateBook)
router.delete('/:id', protect, staff, deleteBook)

// ─── Book detail (views++) ─────────────────────────────────────
router.get('/:id', optionalAuth, getBook)

export default router
