import mongoose, { Document, Schema } from 'mongoose'

/**
 * A Playlist groups ordered Videos inside a Course (e.g. a module/chapter).
 * A course can hold unlimited playlists; a playlist unlimited videos.
 */
export interface IPlaylist extends Document {
  course: mongoose.Types.ObjectId
  title: string
  description: string
  order: number
  isPublished: boolean
  createdBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const playlistSchema = new Schema<IPlaylist>(
  {
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    order: { type: Number, default: 0, index: true },
    isPublished: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

playlistSchema.index({ course: 1, order: 1 })

export const Playlist = mongoose.model<IPlaylist>('Playlist', playlistSchema)
