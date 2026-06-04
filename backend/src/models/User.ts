import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import mongoose, { Document, Schema } from 'mongoose'

export interface IUser extends Document {
  username?: string
  firstName?: string
  lastName?: string
  name: string
  email: string
  password?: string
  googleId?: string
  isEmailVerified: boolean
  role: 'student' | 'instructor' | 'admin'
  avatar?: string
  specialty?: string
  university?: string
  phone?: string
  telegramId?: string
  balance: number              // site balance in so'm
  points: number               // referral points (used for ranking)
  chatUsage?: { date: string; count: number } // daily AI-chat question counter
  stats: {
    totalCases: number
    avgScore: number
    weeklyCount: number
    streak: number
  }
  isPremium: boolean
  subscription: {
    plan: 'free' | 'pro' | 'clinic' | 'university'
    status: 'active' | 'expired' | 'trial'
    expiresAt?: Date
    organizationName?: string
  }
  notifications: {
    email: boolean
    push: boolean
    weekly: boolean
    achievements: boolean
  }
  preferences: {
    darkMode: boolean
    sound: boolean
    animations: boolean
    language: string
    autoSave: boolean
  }
  referralCode: string
  referredBy?: mongoose.Types.ObjectId
  discount?: {
    percent: number
    expiresAt: Date
  }
  createdAt: Date
  updatedAt: Date
  comparePassword(candidatePassword: string): Promise<boolean>
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, unique: true, sparse: true, lowercase: true, trim: true, minlength: 3 },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, minlength: 6, select: false },
    googleId: { type: String, sparse: true },
    isEmailVerified: { type: Boolean, default: false },
    role: {
      type: String,
      enum: ['student', 'instructor', 'admin'],
      default: 'student',
    },
    avatar: String,
    specialty: String,
    university: String,
    phone: { type: String, trim: true },
    telegramId: { type: String, trim: true, index: true, sparse: true },
    balance: { type: Number, default: 0, min: 0 },
    points: { type: Number, default: 0, min: 0 },
    chatUsage: {
      date: { type: String },
      count: { type: Number, default: 0 },
    },
    stats: {
      totalCases: { type: Number, default: 0 },
      avgScore: { type: Number, default: 0 },
      weeklyCount: { type: Number, default: 0 },
      streak: { type: Number, default: 0 },
    },
    isPremium: { type: Boolean, default: false },
    subscription: {
      plan: { type: String, enum: ['free', 'pro', 'clinic', 'university'], default: 'free' },
      status: { type: String, enum: ['active', 'expired', 'trial'], default: 'active' },
      expiresAt: { type: Date },
      organizationName: { type: String },
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      weekly: { type: Boolean, default: false },
      achievements: { type: Boolean, default: true },
    },
    preferences: {
      darkMode: { type: Boolean, default: true },
      sound: { type: Boolean, default: true },
      animations: { type: Boolean, default: true },
      language: { type: String, default: 'uz' },
      autoSave: { type: Boolean, default: true },
    },
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: Schema.Types.ObjectId, ref: 'User' },
    discount: {
      percent: { type: Number },
      expiresAt: { type: Date },
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

userSchema.pre('save', async function (next) {
  if (!this.referralCode) {
    this.referralCode = crypto.randomBytes(4).toString('hex').toUpperCase()
  }
  if (!this.isModified('password') || !this.password) return next()
  const salt = await bcrypt.genSalt(12)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false
  return bcrypt.compare(candidatePassword, this.password)
}

export const User = mongoose.model<IUser>('User', userSchema)
