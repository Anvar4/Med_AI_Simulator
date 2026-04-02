import mongoose, { Document, Schema } from 'mongoose'

export interface IPromoCode extends Document {
  code: string
  type: 'pro' | 'clinic' | 'university'
  duration: number // months
  maxUses: number
  usedCount: number
  usedBy: mongoose.Types.ObjectId[]
  createdBy: mongoose.Types.ObjectId
  organizationName?: string
  expiresAt: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const promoCodeSchema = new Schema<IPromoCode>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ['pro', 'clinic', 'university'], required: true },
    duration: { type: Number, required: true, default: 1, min: 1 },
    maxUses: { type: Number, required: true, default: 1, min: 1 },
    usedCount: { type: Number, default: 0 },
    usedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    organizationName: { type: String, trim: true },
    expiresAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

promoCodeSchema.index({ code: 1 }, { unique: true })
promoCodeSchema.index({ isActive: 1, expiresAt: 1 })

export const PromoCode = mongoose.model<IPromoCode>('PromoCode', promoCodeSchema)
