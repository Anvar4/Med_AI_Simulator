import crypto from 'crypto'
import mongoose, { Document, Schema } from 'mongoose'

/**
 * A course-completion certificate issued to a user once they complete every
 * published video in a course. `serial` is a public, verifiable id that can be
 * looked up without authentication (GET /api/courses/certificates/verify/:serial).
 */
export interface ICertificate extends Document {
  user: mongoose.Types.ObjectId
  course: mongoose.Types.ObjectId
  serial: string
  recipientName: string
  courseTitle: string
  issuedAt: Date
  createdAt: Date
  updatedAt: Date
}

const certificateSchema = new Schema<ICertificate>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    serial: { type: String, required: true, unique: true },
    recipientName: { type: String, required: true },
    courseTitle: { type: String, required: true },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

// A user gets at most one certificate per course.
certificateSchema.index({ user: 1, course: 1 }, { unique: true })

/** Generate a human-friendly, collision-resistant serial, e.g. MED-9F3A-7C12. */
export function generateSerial(): string {
  const part = () => crypto.randomBytes(2).toString('hex').toUpperCase()
  return `MED-${part()}-${part()}`
}

export const Certificate = mongoose.model<ICertificate>('Certificate', certificateSchema)
