import mongoose, { Document, Schema } from 'mongoose'

/**
 * Admins authorized to approve/reject top-ups via the Telegram bot. A telegram
 * id is authorized if it is in this collection (isActive) OR in the
 * TELEGRAM_ADMIN_IDS env list. Populated when an admin runs /start.
 */
export interface ITelegramAdmin extends Document {
  telegramId: string
  username?: string
  fullName?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const telegramAdminSchema = new Schema<ITelegramAdmin>(
  {
    telegramId: { type: String, required: true, unique: true },
    username: { type: String },
    fullName: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export const TelegramAdmin = mongoose.model<ITelegramAdmin>('TelegramAdmin', telegramAdminSchema)
