import mongoose, { Document, Schema } from 'mongoose'

/**
 * A single lesson video belonging to a Playlist. The source is either a
 * YouTube video (`source: 'youtube'`, `youtubeId` normalized) or an uploaded
 * file stored on DigitalOcean Spaces (`source: 'upload'`, `videoUrl` public).
 * `order` controls position within the playlist.
 */
export type VideoSource = 'youtube' | 'upload'

export interface IVideo extends Document {
  playlist: mongoose.Types.ObjectId
  course: mongoose.Types.ObjectId
  title: string
  description: string
  source: VideoSource
  youtubeId?: string
  videoUrl?: string
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
    source: { type: String, enum: ['youtube', 'upload'], default: 'youtube' },
    // youtubeId for source='youtube', videoUrl for source='upload' (see pre-validate)
    youtubeId: { type: String, trim: true },
    videoUrl: { type: String, trim: true },
    durationSeconds: { type: Number, default: 0 },
    order: { type: Number, default: 0, index: true },
    isPublished: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

// Require the field matching the chosen source.
videoSchema.pre('validate', function (next) {
  if (this.source === 'upload') {
    if (!this.videoUrl) return next(new Error('Yuklangan video uchun videoUrl majburiy'))
  } else if (!this.youtubeId) {
    return next(new Error('YouTube video uchun youtubeId majburiy'))
  }
  next()
})

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
