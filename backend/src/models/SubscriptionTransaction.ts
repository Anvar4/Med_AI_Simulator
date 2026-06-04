import mongoose, { Document, Schema } from 'mongoose'

/**
 * Record of a subscription purchased from the user's balance. Captures the
 * balance before/after and the validity window for auditing.
 */
export interface ISubscriptionTransaction extends Document {
  user: mongoose.Types.ObjectId
  plan: 'monthly' | 'yearly'
  amount: number
  status: 'success' | 'failed'
  balanceBefore: number
  balanceAfter: number
  startedAt: Date
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

const subscriptionTransactionSchema = new Schema<ISubscriptionTransaction>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    plan: { type: String, enum: ['monthly', 'yearly'], required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['success', 'failed'], default: 'success' },
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    startedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
)

export const SubscriptionTransaction = mongoose.model<ISubscriptionTransaction>(
  'SubscriptionTransaction',
  subscriptionTransactionSchema
)
