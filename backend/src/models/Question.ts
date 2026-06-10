import mongoose, { Document, Schema } from 'mongoose'

/**
 * A single exam question. Supports four types:
 *  - 'single'    : multiple choice, exactly one correct option
 *  - 'multiple'  : multiple choice, one or more correct options
 *  - 'truefalse' : two options (To'g'ri / Noto'g'ri), one correct
 *  - 'short'     : free-text answer, graded against normalized `correctText`
 *
 * `options[].isCorrect` and `correctText` are the answer key — they MUST be
 * stripped before sending a question to a test-taker (see examController).
 */
export type QuestionType = 'single' | 'multiple' | 'truefalse' | 'short'

export interface IQuestionOption {
  _id?: mongoose.Types.ObjectId
  text: string
  isCorrect: boolean
}

export interface IQuestion extends Document {
  exam: mongoose.Types.ObjectId
  course: mongoose.Types.ObjectId
  type: QuestionType
  text: string
  options: IQuestionOption[]
  correctText: string[]
  points: number
  order: number
  explanation: string
  createdBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const optionSchema = new Schema<IQuestionOption>(
  {
    text: { type: String, required: true, trim: true },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: true }
)

const questionSchema = new Schema<IQuestion>(
  {
    exam: { type: Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    type: { type: String, enum: ['single', 'multiple', 'truefalse', 'short'], default: 'single' },
    text: { type: String, required: true, trim: true },
    options: { type: [optionSchema], default: [] },
    // Accepted answers for 'short' questions (normalized match, case-insensitive).
    correctText: { type: [String], default: [] },
    points: { type: Number, default: 1, min: 0 },
    order: { type: Number, default: 0, index: true },
    explanation: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

questionSchema.index({ exam: 1, order: 1 })

export const Question = mongoose.model<IQuestion>('Question', questionSchema)

/** Normalize a free-text answer for comparison (lowercase, trim, collapse spaces). */
export function normalizeAnswer(input: string): string {
  return (input || '').toLowerCase().trim().replace(/\s+/g, ' ')
}
