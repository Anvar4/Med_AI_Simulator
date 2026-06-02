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

courseSchema.index({ title: 'text', description: 'text' })

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
