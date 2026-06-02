import mongoose, { Document, Schema } from 'mongoose'

/**
 * PaymentRequest tracks a user's intent to subscribe to a paid plan.
 *
 * Until an automated payment gateway (Click/Payme) is wired in, a request is
 * created in `pending` state and an admin confirms it manually, which then
 * activates the subscription. The same model will back gateway callbacks:
 * `provider`, `providerTransactionId` and `paidAmount` are filled by the
 * webhook, and `status` moves pending -> paid -> (subscription activated).
 */
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded'
export type PaymentProvider = 'manual' | 'click' | 'payme'

export interface IPaymentRequest extends Document {
  user: mongoose.Types.ObjectId
  plan: 'pro' | 'clinic' | 'university'
  period: 'monthly' | 'yearly'
  amount: number // expected amount in UZS (after discount)
  originalAmount: number
  discountPercent: number
  currency: string
  status: PaymentStatus
  provider: PaymentProvider
  providerTransactionId?: string
  paidAmount?: number
  paidAt?: Date
  confirmedBy?: mongoose.Types.ObjectId // admin who manually confirmed
  note?: string
  // Payme JSON-RPC transaction bookkeeping (state machine per Payme spec):
  //   1 = created (awaiting perform), 2 = performed, -1 = cancelled while created,
  //   -2 = cancelled after performed.
  gateway?: {
    transactionState?: number
    createTime?: number
    performTime?: number
    cancelTime?: number
    cancelReason?: number
  }
  createdAt: Date
  updatedAt: Date
}

const paymentRequestSchema = new Schema<IPaymentRequest>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    plan: { type: String, enum: ['pro', 'clinic', 'university'], required: true },
    period: { type: String, enum: ['monthly', 'yearly'], required: true },
    amount: { type: Number, required: true },
    originalAmount: { type: Number, required: true },
    discountPercent: { type: Number, default: 0 },
    currency: { type: String, default: 'UZS' },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'cancelled', 'refunded'],
      default: 'pending',
      index: true,
    },
    provider: {
      type: String,
      enum: ['manual', 'click', 'payme'],
      default: 'manual',
    },
    providerTransactionId: { type: String, index: true, sparse: true },
    paidAmount: { type: Number },
    paidAt: { type: Date },
    confirmedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    note: { type: String },
    gateway: {
      transactionState: { type: Number },
      createTime: { type: Number },
      performTime: { type: Number },
      cancelTime: { type: Number },
      cancelReason: { type: Number },
    },
  },
  { timestamps: true }
)

export const PaymentRequest = mongoose.model<IPaymentRequest>('PaymentRequest', paymentRequestSchema)
