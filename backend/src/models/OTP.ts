import mongoose, { Document, Schema } from 'mongoose'

export type OTPType = 'register' | 'password-reset' | 'password-change' | 'email-change'

export interface IOTP extends Document {
  email: string
  code: string
  type: OTPType
  tempData?: string
  expiresAt: Date
}

const otpSchema = new Schema<IOTP>({
  email: { type: String, required: true, lowercase: true, trim: true },
  code: { type: String, required: true },
  type: {
    type: String,
    enum: ['register', 'password-reset', 'password-change', 'email-change'],
    required: true,
  },
  tempData: { type: String },
  expiresAt: { type: Date, required: true },
})

// TTL index — MongoDB auto-deletes expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
otpSchema.index({ email: 1, type: 1 })

export const OTP = mongoose.model<IOTP>('OTP', otpSchema)
