import mongoose, { Document, Schema } from 'mongoose'

export interface ICaseAttempt extends Document {
  user: mongoose.Types.ObjectId
  case: mongoose.Types.ObjectId
  status: 'in-progress' | 'completed' | 'abandoned'
  selectedTests: string[]
  diagnosis: string
  treatment: string
  score: number
  aiFeedback: string
  timeSpent: number // seconds
  completedSteps: number[]
  startedAt: Date
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const caseAttemptSchema = new Schema<ICaseAttempt>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    case: { type: Schema.Types.ObjectId, ref: 'Case', required: true },
    status: {
      type: String,
      enum: ['in-progress', 'completed', 'abandoned'],
      default: 'in-progress',
    },
    selectedTests: [String],
    diagnosis: { type: String, default: '' },
    treatment: { type: String, default: '' },
    score: { type: Number, default: 0, min: 0, max: 100 },
    aiFeedback: { type: String, default: '' },
    timeSpent: { type: Number, default: 0 },
    completedSteps: [Number],
    startedAt: { type: Date, default: Date.now },
    completedAt: Date,
  },
  { timestamps: true }
)

caseAttemptSchema.index({ user: 1, case: 1 })
caseAttemptSchema.index({ user: 1, status: 1 })

export const CaseAttempt = mongoose.model<ICaseAttempt>('CaseAttempt', caseAttemptSchema)
