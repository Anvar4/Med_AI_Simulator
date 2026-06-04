import mongoose, { Document, Schema } from 'mongoose'

/**
 * Audit record of a referral reward. Created once per successfully referred
 * sign-up: the referrer earns a fixed cash bonus (so'm, credited to balance)
 * and ranking points. Kept as its own collection so the admin can report on
 * total referral payouts/points and per-user leaderboards, and so the reward
 * is granted at most once per invited user (unique index on invitedUser).
 */
export interface IReferralEarning extends Document {
  referrer: mongoose.Types.ObjectId   // the inviter who gets rewarded
  invitedUser: mongoose.Types.ObjectId // the newly registered user
  amount: number                       // cash bonus in so'm
  points: number                       // ranking points awarded
  createdAt: Date
  updatedAt: Date
}

const referralEarningSchema = new Schema<IReferralEarning>(
  {
    referrer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    invitedUser: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    amount: { type: Number, required: true, min: 0 },
    points: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
)

export const ReferralEarning = mongoose.model<IReferralEarning>('ReferralEarning', referralEarningSchema)
