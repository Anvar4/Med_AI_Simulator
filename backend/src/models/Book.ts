import mongoose, { Document, Schema } from 'mongoose'

/**
 * A medical library book. The PDF lives either on DigitalOcean Spaces
 * (`sourceType: 'upload'`, uploaded via /api/upload) or at an external URL
 * (`sourceType: 'external'`). Database-driven so content managers add books
 * without code changes. `views` powers the library usage statistics.
 */
export type BookLanguage = 'uz' | 'ru' | 'en'
export type BookSourceType = 'upload' | 'external'

export interface IBook extends Document {
  title: string
  author: string
  description: string
  category: string
  language: BookLanguage
  year?: number
  pages?: number
  coverImage?: string
  tags: string[]
  fileUrl: string
  sourceType: BookSourceType
  isPublished: boolean
  isFeatured: boolean
  views: number
  createdBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const bookSchema = new Schema<IBook>(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, default: '', trim: true },
    description: { type: String, default: '' },
    category: { type: String, default: 'Umumiy', index: true },
    language: { type: String, enum: ['uz', 'ru', 'en'], default: 'uz', index: true },
    year: { type: Number },
    pages: { type: Number },
    coverImage: { type: String },
    tags: { type: [String], default: [] },
    fileUrl: { type: String, required: true },
    sourceType: { type: String, enum: ['upload', 'external'], default: 'external' },
    isPublished: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

// language_override points the text index at a non-existent field so our own
// `language` field ('uz'/'ru'/'en') isn't treated as a text-search language
// (which would reject 'uz'). Same fix as Course.
bookSchema.index(
  { title: 'text', author: 'text', description: 'text' },
  { language_override: 'textLang', default_language: 'none' }
)

export const Book = mongoose.model<IBook>('Book', bookSchema)
