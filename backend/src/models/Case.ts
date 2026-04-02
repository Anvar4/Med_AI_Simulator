import mongoose, { Document, Schema } from 'mongoose'

export interface IMediaItem {
  type: 'xray' | 'ekg' | 'echo' | 'image' | 'video'
  fileData: string // base64 encoded image/gif or URL
  comment: string  // required description/findings
  fileName?: string
}

export interface ILabResult {
  name: string
  value: string
  unit: string
  range: string
  status: 'normal' | 'high' | 'low' | 'critical'
}

export interface ICase extends Document {
  caseId: string
  title: string
  category: string
  difficulty: number
  type: 'diagnostika' | 'jarrohlik' | 'shoshilinch'
  isPremium: boolean
  description?: string
  patient: {
    name: string
    age: number
    gender: string
    ageGroup: string
    vitals: {
      bp: string
      hr: string
      temp: string
      spo2: string
    }
    complaints: string
    history: string
  }
  mediaItems?: IMediaItem[]
  labResults?: ILabResult[]        // legacy flat array
  bloodTest?: ILabResult[]         // Qon tahlili
  biochemTest?: ILabResult[]       // Bioximik tahlil
  urineTest?: ILabResult[]         // Siydik tahlili
  correctDiagnosis: string
  correctTreatment: string
  tests: string[]
  timeLimit: number // seconds
  createdBy?: mongoose.Types.ObjectId
  status: 'draft' | 'review' | 'published' | 'rejected'
  createdAt: Date
  updatedAt: Date
}

const mediaItemSchema = new Schema<IMediaItem>({
  type: { type: String, enum: ['xray', 'ekg', 'echo', 'image', 'video'], required: true },
  fileData: { type: String, required: true },
  comment: { type: String, required: true },
  fileName: { type: String },
}, { _id: false })

const labResultSchema = new Schema<ILabResult>({
  name: { type: String, required: true },
  value: { type: String, required: true },
  unit: { type: String, default: '' },
  range: { type: String, required: true },
  status: { type: String, enum: ['normal', 'high', 'low', 'critical'], required: true },
}, { _id: false })

const caseSchema = new Schema<ICase>(
  {
    caseId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    category: { type: String, required: true, index: true },
    difficulty: { type: Number, required: true, min: 1, max: 5 },
    type: {
      type: String,
      enum: ['diagnostika', 'jarrohlik', 'shoshilinch'],
      required: true,
      index: true,
    },
    isPremium: { type: Boolean, default: false },
    description: String,
    patient: {
      name: { type: String, required: true },
      age: { type: Number, required: true },
      gender: { type: String, required: true },
      ageGroup: { type: String, required: true },
      vitals: {
        bp: { type: String, required: true },
        hr: { type: String, required: true },
        temp: { type: String, required: true },
        spo2: { type: String, required: true },
      },
      complaints: { type: String, required: true },
      history: { type: String, required: true },
    },
    mediaItems: [mediaItemSchema],
    labResults: [labResultSchema],
    bloodTest: [labResultSchema],
    biochemTest: [labResultSchema],
    urineTest: [labResultSchema],
    correctDiagnosis: { type: String, required: true },
    correctTreatment: { type: String, required: true },
    tests: [String],
    timeLimit: { type: Number, default: 600 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['draft', 'review', 'published', 'rejected'], default: 'published' },
  },
  { timestamps: true }
)

caseSchema.index({ category: 1, type: 1, difficulty: 1 })
caseSchema.index({ status: 1 })

export const Case = mongoose.model<ICase>('Case', caseSchema)
