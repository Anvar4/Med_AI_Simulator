import { Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { ReferralEarning } from '../models/ReferralEarning'
import { User } from '../models/User'
import { REFERRAL_BONUS, REFERRAL_POINTS } from '../services/balanceService'

/**
 * The signed-in user's referral dashboard: their share link/code, totals
 * (people invited, cash earned, points earned) and the list of invited users.
 * GET /api/referrals/me
 */
export const getMyReferralStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id

    const me = await User.findById(userId).select('referralCode points balance')
    if (!me) { res.status(404).json({ message: 'Foydalanuvchi topilmadi' }); return }

    const earnings = await ReferralEarning.find({ referrer: userId })
      .populate('invitedUser', 'name username avatar createdAt isPremium')
      .sort({ createdAt: -1 })
      .limit(100)

    const totalEarned = earnings.reduce((s, e) => s + e.amount, 0)
    const totalPoints = earnings.reduce((s, e) => s + e.points, 0)

    const invited = earnings.map(e => {
      const u = e.invitedUser as unknown as { _id: string; name?: string; username?: string; avatar?: string; createdAt?: Date; isPremium?: boolean } | null
      return {
        id: u?._id ?? null,
        name: u?.name ?? 'Foydalanuvchi',
        username: u?.username ?? null,
        avatar: u?.avatar ?? null,
        isPremium: u?.isPremium ?? false,
        amount: e.amount,
        points: e.points,
        joinedAt: e.createdAt,
      }
    })

    res.json({
      status: 'success',
      referralCode: me.referralCode,
      bonusPerInvite: REFERRAL_BONUS,
      pointsPerInvite: REFERRAL_POINTS,
      points: me.points ?? 0,
      balance: me.balance ?? 0,
      totals: {
        invitedCount: earnings.length,
        totalEarned,
        totalPoints,
      },
      invited,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}
