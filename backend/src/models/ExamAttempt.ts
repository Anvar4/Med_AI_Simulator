import mongoose, { Document, Schema } from 'mongoose'

/**
 * A user's submission of a course exam. Graded entirely on the server. The
 * reward points are granted at most once per (user, exam) — tracked here by
 * `rewardGranted` so unlimited retakes don't pay out repeatedly.
 */
export interface IExamAnswer {
  question: mongoose.Types.ObjectId
  selected: string[] // selected option ids (single/multiple/truefalse)
  textAnswer?: string // for 'short'
  correct: boolean
}

export interface IExamAttempt extends Document {
  user: mongoose.Types.ObjectId
  exam: mongoose.Types.ObjectId
  course: mongoose.Types.ObjectId
  answers: IExamAnswer[]
  scorePercent: number
  passed: boolean
  rewardGranted: boolean
  createdAt: Date
  updatedAt: Date
}

const answerSchema = new Schema<IExamAnswer>(
  {
    question: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
    selected: { type: [String], default: [] },
    textAnswer: { type: String },
    correct: { type: Boolean, default: false },
  },
  { _id: false }
)

const examAttemptSchema = new Schema<IExamAttempt>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    exam: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    answers: { type: [answerSchema], default: [] },
    scorePercent: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    rewardGranted: { type: Boolean, default: false },
  },
  { timestamps: true }
)

examAttemptSchema.index({ user: 1, exam: 1 })

export const ExamAttempt = mongoose.model<IExamAttempt>('ExamAttempt', examAttemptSchema)
