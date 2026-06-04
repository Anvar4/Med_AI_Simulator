import mongoose, { Document, Schema } from 'mongoose'

/**
 * A user's request to top up their site balance by transferring money to one of
 * the admin's cards and uploading a receipt. Reviewed manually by an admin (via
 * the admin panel or the Telegram bot). Approval is idempotent — the balance is
 * credited at most once.
 */
export type TopUpStatus = 'pending' | 'approved' | 'rejected'

export interface IBalanceTopUp extends Document {
  user: mongoose.Types.ObjectId
  amount: number
  card: mongoose.Types.ObjectId
  receiptUrl: string
  status: TopUpStatus
  rejectionReason?: string
  reviewedByAdmin?: mongoose.Types.ObjectId
  reviewedByTelegramId?: string
  telegramMessageId?: number
  createdAt: Date
  reviewedAt?: Date
  updatedAt: Date
}

const balanceTopUpSchema = new Schema<IBalanceTopUp>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    card: { type: Schema.Types.ObjectId, ref: 'PaymentCard', required: true },
    receiptUrl: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    rejectionReason: { type: String },
    reviewedByAdmin: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedByTelegramId: { type: String },
    telegramMessageId: { type: Number },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
)

export const BalanceTopUp = mongoose.model<IBalanceTopUp>('BalanceTopUp', balanceTopUpSchema)
