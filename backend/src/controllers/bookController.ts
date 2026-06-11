import { Request, Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { Book } from '../models/Book'
import { escapeRegex } from './caseSecurity'

function isStaff(req: AuthRequest): boolean {
  return req.user?.role === 'admin' || req.user?.role === 'instructor'
}

function applyFields(doc: object, body: Record<string, unknown>, fields: string[]): void {
  const target = doc as unknown as Record<string, unknown>
  for (const f of fields) {
    if (body[f] !== undefined) target[f] = body[f]
  }
}

// ─── Public: book catalog ──────────────────────────────────────
// GET /api/books?category=&language=&search=&featured=&page=&limit=
export const listBooks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, language, search, featured, page = '1', limit = '24' } = req.query

    const filter: Record<string, unknown> = { isPublished: true }
    if (category && category !== 'all') filter.category = category as string
    if (language && ['uz', 'ru', 'en'].includes(language as string)) filter.language = language as string
    if (featured === 'true') filter.isFeatured = true
    if (search) {
      const safe = escapeRegex(search as string)
      filter.$or = [
        { title: { $regex: safe, $options: 'i' } },
        { author: { $regex: safe, $options: 'i' } },
        { description: { $regex: safe, $options: 'i' } },
        { tags: { $regex: safe, $options: 'i' } },
      ]
    }

    const pageNum = Math.max(1, parseInt(page as string))
    const limitNum = Math.min(60, Math.max(1, parseInt(limit as string)))

    const [books, total] = await Promise.all([
      Book.find(filter).sort({ isFeatured: -1, createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
      Book.countDocuments(filter),
    ])

    res.json({
      status: 'success',
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      books,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

// GET /api/books/categories
export const getBookCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const cats = await Book.aggregate([
      { $match: { isPublished: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ])
    res.json({ status: 'success', categories: cats.map(c => ({ name: c._id, count: c.count })) })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

// GET /api/books/:id  (increments views for usage stats)
export const getBook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const book = await Book.findById(req.params.id)
    if (!book || (!book.isPublished && !isStaff(req))) {
      res.status(404).json({ message: 'Kitob topilmadi' })
      return
    }
    // Count a view (best effort, non-blocking on the response).
    Book.updateOne({ _id: book._id }, { $inc: { views: 1 } }).catch(() => null)
    res.json({ status: 'success', book })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

// ─── CM/Admin: Book CRUD ───────────────────────────────────────
export const createBook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, fileUrl } = req.body
    if (!title || typeof title !== 'string') { res.status(400).json({ message: 'Kitob nomi majburiy' }); return }
    if (!fileUrl || typeof fileUrl !== 'string' || !/^https?:\/\/|^\//.test(fileUrl)) {
      res.status(400).json({ message: 'PDF fayl (yuklash yoki URL) majburiy' }); return
    }
    const sourceType = /^https?:\/\//.test(fileUrl) && !fileUrl.includes('digitaloceanspaces') ? 'external' : 'upload'
    const book = await Book.create({
      title: title.trim(),
      author: typeof req.body.author === 'string' ? req.body.author.trim() : '',
      description: typeof req.body.description === 'string' ? req.body.description : '',
      category: typeof req.body.category === 'string' && req.body.category.trim() ? req.body.category.trim() : 'Umumiy',
      language: ['uz', 'ru', 'en'].includes(req.body.language) ? req.body.language : 'uz',
      year: typeof req.body.year === 'number' ? req.body.year : undefined,
      pages: typeof req.body.pages === 'number' ? req.body.pages : undefined,
      coverImage: typeof req.body.coverImage === 'string' ? req.body.coverImage : undefined,
      tags: Array.isArray(req.body.tags) ? req.body.tags.filter((x: unknown) => typeof x === 'string') : [],
      fileUrl: fileUrl.trim(),
      sourceType: req.body.sourceType === 'external' || req.body.sourceType === 'upload' ? req.body.sourceType : sourceType,
      isFeatured: !!req.body.isFeatured,
      // Admins publish directly; instructors start unpublished (review-style).
      isPublished: req.user?.role === 'admin',
      createdBy: req.user!._id,
    })
    res.status(201).json({ status: 'success', book })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

async function loadOwnedBook(req: AuthRequest, res: Response) {
  const book = await Book.findById(req.params.id)
  if (!book) { res.status(404).json({ message: 'Kitob topilmadi' }); return null }
  if (req.user!.role !== 'admin' && book.createdBy?.toString() !== req.user!._id.toString()) {
    res.status(403).json({ message: 'Bu kitobni boshqarish huquqiga ega emassiz' }); return null
  }
  return book
}

export const updateBook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const book = await loadOwnedBook(req, res)
    if (!book) return
    applyFields(book, req.body, ['title', 'author', 'description', 'category', 'language', 'year', 'pages', 'coverImage', 'tags', 'fileUrl', 'sourceType', 'isFeatured'])
    if (req.user!.role === 'admin' && typeof req.body.isPublished === 'boolean') {
      book.isPublished = req.body.isPublished
    }
    await book.save()
    res.json({ status: 'success', book })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

export const deleteBook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const book = await loadOwnedBook(req, res)
    if (!book) return
    await book.deleteOne()
    res.json({ status: 'success', message: 'Kitob o\'chirildi' })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

// CM list — includes unpublished own books (mine=true), like courses.
export const listBooksAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filter: Record<string, unknown> = {}
    if (req.user!.role !== 'admin') filter.createdBy = req.user!._id
    const books = await Book.find(filter).sort({ createdAt: -1 }).lean()
    res.json({ status: 'success', books })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}
