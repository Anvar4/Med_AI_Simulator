import mongoose, { Document, Schema } from 'mongoose'

/**
 * A final exam attached to a Course (one per course). The user takes it after
 * finishing every video; passing (scorePercent >= passingScore) unlocks the
 * certificate and grants `rewardPoints` once. Questions live in the Question
 * model, linked by `exam`.
 */
export interface IExam extends Document {
  course: mongoose.Types.ObjectId
  title: string
  description: string
  passingScore: number
  rewardPoints: number
  isPublished: boolean
  createdBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const examSchema = new Schema<IExam>(
  {
    // One exam per course.
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, unique: true, index: true },
    title: { type: String, default: 'Yakuniy imtihon', trim: true },
    description: { type: String, default: '' },
    passingScore: { type: Number, default: 70, min: 0, max: 100 },
    rewardPoints: { type: Number, default: 50, min: 0 },
    isPublished: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

export const Exam = mongoose.model<IExam>('Exam', examSchema)
