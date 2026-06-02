import mongoose, { Document, Schema } from 'mongoose'

/**
 * Tracks a user's progress on a single video. One document per (user, video).
 * `completed` is set when the user watches past the completion threshold; the
 * course-level completion % is derived by counting completed videos.
 */
export interface IVideoProgress extends Document {
  user: mongoose.Types.ObjectId
  video: mongoose.Types.ObjectId
  course: mongoose.Types.ObjectId
  positionSeconds: number
  completed: boolean
  completedAt?: Date
  lastWatchedAt: Date
  createdAt: Date
  updatedAt: Date
}

const videoProgressSchema = new Schema<IVideoProgress>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    video: { type: Schema.Types.ObjectId, ref: 'Video', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    positionSeconds: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
    lastWatchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

// One progress record per user per video.
videoProgressSchema.index({ user: 1, video: 1 }, { unique: true })
videoProgressSchema.index({ user: 1, course: 1 })

export const VideoProgress = mongoose.model<IVideoProgress>('VideoProgress', videoProgressSchema)
