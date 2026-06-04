import mongoose, { Document, Schema } from 'mongoose'

/**
 * Admin-managed payment cards. Users transfer money to one of the active cards
 * and upload a receipt. We never store CVV / expiry / passwords — only the
 * public card number, holder name and bank shown by the admin.
 */
export interface IPaymentCard extends Document {
  cardNumber: string
  cardHolderName: string
  bankName: string
  description?: string
  isActive: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

const paymentCardSchema = new Schema<IPaymentCard>(
  {
    cardNumber: { type: String, required: true, trim: true },
    cardHolderName: { type: String, required: true, trim: true },
    bankName: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
)

paymentCardSchema.index({ isActive: 1, sortOrder: 1 })

export const PaymentCard = mongoose.model<IPaymentCard>('PaymentCard', paymentCardSchema)
