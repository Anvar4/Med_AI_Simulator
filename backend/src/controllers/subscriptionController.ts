import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PromoCode } from '../models/PromoCode';
import { User } from '../models/User';

export const getPlans = (_req: AuthRequest, res: Response): void => {
  res.json({
    status: 'success',
    plans: [
      {
        id: 'pro',
        name: 'Pro',
        nameUz: 'Pro',
        description: 'Individual professional uchun',
        monthlyPrice: 30000,
        yearlyPrice: 300000,
        currency: 'UZS',
        features: [
          'Barcha premium klinik holatlar',
          'Shoshilinch rejim (vaqtli diagnostika)',
          'Batafsil tahlillar va hisobotlar',
          'AI yordamchi',
          'Cheksiz urinishlar',
        ],
        maxUsers: 1,
      },
      {
        id: 'clinic',
        name: 'Klinika',
        nameUz: 'Klinika / Kollej / Tashkilot',
        description: "Kollej, o'quv markazi va tashkilotlar uchun",
        monthlyPrice: 3000000,
        yearlyPrice: 30000000,
        currency: 'UZS',
        features: [
          'Pro versiyaning barcha imkoniyatlari',
          '80 nafargacha foydalanuvchi',
          'Admin boshqaruv paneli',
          'Guruh statistikasi',
          'Promokod boshqaruv',
          'Ustuvor texnik qo\'llab-quvvatlash',
        ],
        maxUsers: 80,
      },
      {
        id: 'university',
        name: 'Universitet',
        nameUz: 'Universitet / Tibbiyot maktabi',
        description: 'Universitet va tibbiyot oliy ta\'lim muassasalari uchun',
        monthlyPrice: null,
        yearlyPrice: null,
        currency: 'UZS',
        features: [
          'Klinika versiyasining barcha imkoniyatlari',
          'Cheksiz foydalanuvchilar',
          'LMS integratsiyasi',
          'Maxsus kontent yaratish',
          'Ustuvor texnik qo\'llab-quvvatlash',
        ],
        maxUsers: null,
        contactAdmin: true,
      },
    ],
  })
}

export const applyPromoCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code } = req.body
    if (!code) {
      res.status(400).json({ message: 'Promokod kiritilishi shart' })
      return
    }

    const promoCode = await PromoCode.findOne({
      code: code.toUpperCase().trim(),
      isActive: true,
      expiresAt: { $gt: new Date() },
    })

    if (!promoCode) {
      res.status(404).json({ message: "Promokod topilmadi yoki muddati o'tgan" })
      return
    }

    if (promoCode.usedCount >= promoCode.maxUses) {
      res.status(400).json({ message: "Bu promokod foydalanish limiti to'lgan" })
      return
    }

    // Check if user already used this code
    const userId = req.user!._id
    if (promoCode.usedBy.some(id => id.toString() === userId.toString())) {
      res.status(400).json({ message: 'Siz bu promokodni allaqachon ishlatgansiz' })
      return
    }

    // Apply subscription
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + promoCode.duration)

    await User.findByIdAndUpdate(userId, {
      isPremium: true,
      'subscription.plan': promoCode.type === 'university' ? 'university' : promoCode.type === 'clinic' ? 'clinic' : 'pro',
      'subscription.status': 'active',
      'subscription.expiresAt': expiresAt,
      'subscription.organizationName': promoCode.organizationName || '',
    })

    // Update promo code usage
    promoCode.usedBy.push(userId)
    promoCode.usedCount += 1
    if (promoCode.usedCount >= promoCode.maxUses) {
      promoCode.isActive = false
    }
    await promoCode.save()

    const updatedUser = await User.findById(userId).select('-password')

    res.json({
      status: 'success',
      message: `Promokod muvaffaqiyatli qo'llanildi. ${promoCode.duration} oyga ${promoCode.type === 'pro' ? 'Pro' : 'Premium'} obuna faollashtirildi.`,
      subscription: updatedUser?.subscription,
      expiresAt,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

const PLAN_PRICES: Record<string, { monthly: number; yearly: number }> = {
  pro: { monthly: 30000, yearly: 300000 },
  clinic: { monthly: 3000000, yearly: 30000000 },
}

export const subscribe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { planId, period } = req.body as { planId?: string; period?: string }

    if (!planId || !['pro', 'clinic'].includes(planId)) {
      res.status(400).json({ message: 'Noto\'g\'ri tarif rejasi' })
      return
    }
    if (!period || !['monthly', 'yearly'].includes(period)) {
      res.status(400).json({ message: 'Noto\'g\'ri to\'lov davri' })
      return
    }

    const userId = req.user!._id
    const user = await User.findById(userId)
    if (!user) {
      res.status(404).json({ message: 'Foydalanuvchi topilmadi' })
      return
    }

    // Check if user already has this plan active
    if (
      user.subscription?.plan === planId &&
      user.subscription?.status === 'active' &&
      user.subscription.expiresAt &&
      user.subscription.expiresAt > new Date()
    ) {
      res.status(400).json({ message: 'Siz allaqachon bu tarif rejasida obuna bo\'lgansiz' })
      return
    }

    const price = PLAN_PRICES[planId][period as 'monthly' | 'yearly']

    // Apply active discount if any
    const now = new Date()
    const activeDiscount = user.discount && user.discount.expiresAt > now ? user.discount : null
    const discountPercent = activeDiscount?.percent ?? 0
    const finalPrice = discountPercent > 0 ? Math.round(price * (1 - discountPercent / 100)) : price

    // Calculate expiration date
    const expiresAt = new Date()
    if (period === 'yearly') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1)
    }

    await User.findByIdAndUpdate(userId, {
      isPremium: true,
      'subscription.plan': planId,
      'subscription.status': 'active',
      'subscription.expiresAt': expiresAt,
    })

    // Reward referrer with 10% discount when referred user buys premium
    if (user.referredBy) {
      const discountExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      await User.findByIdAndUpdate(user.referredBy, {
        discount: { percent: 10, expiresAt: discountExpiresAt },
      })
    }

    const updatedUser = await User.findById(userId).select('-password')

    res.json({
      status: 'success',
      message: `${planId === 'pro' ? 'Pro' : 'Klinika'} obuna ${period === 'yearly' ? '1 yilga' : '1 oyga'} muvaffaqiyatli faollashtirildi!${
        discountPercent > 0 ? ` (${discountPercent}% chegirma qo'llanildi)` : ''
      }`,
      subscription: updatedUser?.subscription,
      expiresAt,
      price: finalPrice,
      originalPrice: price,
      discountPercent,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

export const getMySubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!._id).select('isPremium subscription')
    if (!user) {
      res.status(404).json({ message: 'Foydalanuvchi topilmadi' })
      return
    }

    // Auto-expire if needed
    if (user.subscription?.status === 'active' && user.subscription.expiresAt && user.subscription.expiresAt < new Date()) {
      await User.findByIdAndUpdate(user._id, {
        isPremium: false,
        'subscription.status': 'expired',
      })
      user.isPremium = false
      user.subscription.status = 'expired'
    }

    res.json({
      status: 'success',
      isPremium: user.isPremium,
      subscription: user.subscription,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

export const getReferralInfo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!._id).select('referralCode discount')
    if (!user) {
      res.status(404).json({ message: 'Foydalanuvchi topilmadi' })
      return
    }
    const now = new Date()
    const referredTotal = await User.countDocuments({ referredBy: user._id })
    const referredPremium = await User.countDocuments({ referredBy: user._id, isPremium: true })
    const activeDiscount = user.discount && user.discount.expiresAt > now ? user.discount : null
    res.json({
      status: 'success',
      referralCode: user.referralCode,
      referredTotal,
      referredPremium,
      discount: activeDiscount,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}
