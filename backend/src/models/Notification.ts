import mongoose, { Document, Schema } from 'mongoose'

export type NotificationType = 'info' | 'success' | 'warning' | 'error'

/** In-app notification shown in the user's notification panel. */
export interface INotification extends Document {
  user: mongoose.Types.ObjectId
  title: string
  message: string
  type: NotificationType
  isRead: boolean
  createdAt: Date
  updatedAt: Date
}

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
)

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 })

export const Notification = mongoose.model<INotification>('Notification', notificationSchema)

/** Helper to create a notification (used across controllers). */
export async function notify(
  userId: mongoose.Types.ObjectId | string,
  title: string,
  message: string,
  type: NotificationType = 'info'
) {
  return Notification.create({ user: userId, title, message, type })
}
