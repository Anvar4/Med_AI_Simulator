import mongoose, { Document, Schema } from 'mongoose'

/**
 * Top-level educational Course. Holds playlists (modules), which hold videos.
 * Database-driven so the catalog scales to thousands of courses/playlists
 * without any hardcoded arrays in the frontend.
 */
export interface ICourse extends Document {
  title: string
  slug: string
  description: string
  category: string
  author: string
  /** Displayed instructor name (falls back to author when empty). */
  instructor?: string
  /** Content language of the course. */
  language: 'uz' | 'ru' | 'en'
  /** Free-form duration label shown on cards, e.g. "4 soat". */
  durationLabel?: string
  coverImage?: string
  level: 'beginner' | 'intermediate' | 'advanced'
  isPremium: boolean
  isPublished: boolean
  createdBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const courseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, default: 'Umumiy', index: true },
    author: { type: String, required: true, trim: true },
    instructor: { type: String, trim: true },
    language: { type: String, enum: ['uz', 'ru', 'en'], default: 'uz' },
    durationLabel: { type: String, trim: true },
    coverImage: { type: String },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    isPremium: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

// `language_override` points the text index at a non-existent field so our own
// `language` field ('uz'/'ru'/'en') is NOT interpreted as a MongoDB text-search
// language (which would reject 'uz' with "language override unsupported").
courseSchema.index(
  { title: 'text', description: 'text' },
  { language_override: 'textLang', default_language: 'none' }
)

/** Build a URL-safe slug from a title (latin + digits, dash-separated). */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['`’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export const Course = mongoose.model<ICourse>('Course', courseSchema)
