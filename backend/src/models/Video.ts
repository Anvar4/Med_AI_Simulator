import mongoose, { Document, Schema } from 'mongoose'

/**
 * A single lesson video belonging to a Playlist. Source is currently YouTube;
 * `youtubeId` is stored normalized so the frontend can build embed/watch URLs
 * without re-parsing. `order` controls position within the playlist.
 */
export interface IVideo extends Document {
  playlist: mongoose.Types.ObjectId
  course: mongoose.Types.ObjectId
  title: string
  description: string
  youtubeId: string
  durationSeconds: number
  order: number
  isPublished: boolean
  createdBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const videoSchema = new Schema<IVideo>(
  {
    playlist: { type: Schema.Types.ObjectId, ref: 'Playlist', required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    youtubeId: { type: String, required: true, trim: true },
    durationSeconds: { type: Number, default: 0 },
    order: { type: Number, default: 0, index: true },
    isPublished: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

videoSchema.index({ playlist: 1, order: 1 })

export const Video = mongoose.model<IVideo>('Video', videoSchema)

/**
 * Extract a YouTube video id from a watch/share/embed URL or a raw id.
 * Returns null when nothing usable is found.
 */
export function parseYoutubeId(input: string): string | null {
  if (!input) return null
  const raw = input.trim()
  // Already a bare id (11 chars, URL-safe)
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/, // watch?v=ID
    /youtu\.be\/([a-zA-Z0-9_-]{11})/, // youtu.be/ID
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/, // embed/ID
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/, // shorts/ID
  ]
  for (const re of patterns) {
    const m = raw.match(re)
    if (m?.[1]) return m[1]
  }
  return null
}
