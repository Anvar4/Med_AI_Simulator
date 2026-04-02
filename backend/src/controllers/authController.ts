import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middleware/auth';
import { OTP } from '../models/OTP';
import { User } from '../models/User';
import { sendOTPEmail } from '../services/emailService';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

// ─── Helpers ──────────────────────────────────────────────────

function signToken(id: string): string {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions)
}

function signTempToken(payload: object): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '15m' } as jwt.SignOptions)
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function buildUserResponse(user: InstanceType<typeof User>) {
  return {
    id: user._id,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    specialty: user.specialty,
    university: user.university,
    isPremium: user.isPremium,
    stats: user.stats,
    hasPassword: !!user.password,
    subscription: user.subscription,
    notifications: user.notifications,
    preferences: user.preferences,
    referralCode: user.referralCode,
    discount: user.discount && user.discount.expiresAt > new Date() ? user.discount : null,
  }
}

// ─── Send OTP ─────────────────────────────────────────────────
// POST /api/auth/send-otp  body: { email, type }

export const sendOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, type } = req.body
    const normalizedEmail = email?.toLowerCase()?.trim()

    if (!normalizedEmail || !type) {
      res.status(400).json({ message: 'Email va tur kiritilishi shart' })
      return
    }

    if (type === 'register') {
      const emailExists = await User.findOne({ email: normalizedEmail })
      if (emailExists) {
        res.status(400).json({ message: "Bu email allaqachon ro'yxatdan o'tgan" })
        return
      }
      if (req.body.username) {
        const usernameExists = await User.findOne({ username: req.body.username.toLowerCase().trim() })
        if (usernameExists) {
          res.status(400).json({ message: "Bu login allaqachon band" })
          return
        }
      }
    }

    if (type === 'password-reset') {
      const user = await User.findOne({ email: normalizedEmail })
      if (!user) {
        res.status(404).json({ message: 'Bu email bilan foydalanuvchi topilmadi' })
        return
      }
      if (!user.password) {
        res.status(400).json({ message: "Siz Google orqali ro'yxatdan o'tgansiz." })
        return
      }
    }

    const code = generateOTP()
    await OTP.deleteMany({ email: normalizedEmail, type })
    await OTP.create({
      email: normalizedEmail,
      code,
      type,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    })

    await sendOTPEmail(normalizedEmail, code, type)
    res.json({ message: 'Kod emailingizga yuborildi' })
  } catch (error) {
    console.error('sendOTP error:', error)
    res.status(500).json({ message: 'Email yuborishda xatolik yuz berdi' })
  }
}

// ─── Verify OTP ───────────────────────────────────────────────
// POST /api/auth/verify-otp  body: { email, code, type }

export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code, type } = req.body
    const normalizedEmail = email?.toLowerCase()?.trim()

    const otp = await OTP.findOne({
      email: normalizedEmail,
      code,
      type,
      expiresAt: { $gt: new Date() },
    })

    if (!otp) {
      res.status(400).json({ message: "Kod noto'g'ri yoki muddati o'tgan" })
      return
    }

    await otp.deleteOne()
    const tempToken = signTempToken({ email: normalizedEmail, type, isTemp: true })
    res.json({ verified: true, tempToken })
  } catch (error) {
    console.error('verifyOTP error:', error)
    res.status(500).json({ message: 'Server xatosi' })
  }
}

// ─── Complete Registration ─────────────────────────────────────
// POST /api/auth/complete-register  body: { tempToken, firstName, lastName, username, password, avatar? }

export const completeRegister = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tempToken, firstName, lastName, username, password, avatar } = req.body

    if (!tempToken || !firstName || !lastName || !username || !password) {
      res.status(400).json({ message: "Barcha majburiy maydonlar to'ldirilishi shart" })
      return
    }

    const usernameClean = username.toLowerCase().trim()
    if (!/^[a-z0-9]{6,}$/.test(usernameClean)) {
      res.status(400).json({ message: 'Login kamida 6 ta belgi, faqat harf va raqamlardan iborat bo\'lishi kerak' })
      return
    }

    if (!/^[a-zA-Z0-9]{6,}$/.test(password)) {
      res.status(400).json({ message: 'Parol kamida 6 ta belgi, faqat harf va raqamlardan iborat bo\'lishi kerak' })
      return
    }

    let decoded: { email: string; type: string; isTemp: boolean }
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET!) as typeof decoded
    } catch {
      res.status(400).json({ message: "Tasdiqlash muddati o'tgan. Qaytadan boshlang." })
      return
    }

    if (!decoded.isTemp || decoded.type !== 'register') {
      res.status(400).json({ message: "Noto'g'ri token" })
      return
    }

    const emailExists = await User.findOne({ email: decoded.email })
    if (emailExists) {
      res.status(400).json({ message: "Bu email allaqachon ro'yxatdan o'tgan" })
      return
    }

    const usernameExists = await User.findOne({ username: usernameClean })
    if (usernameExists) {
      res.status(400).json({ message: "Bu login allaqachon band" })
      return
    }

    const firstNameClean = firstName.trim()
    const lastNameClean = lastName.trim()
    const user = await User.create({
      username: usernameClean,
      firstName: firstNameClean,
      lastName: lastNameClean,
      name: `${firstNameClean} ${lastNameClean}`,
      email: decoded.email,
      password,
      isEmailVerified: true,
      avatar: avatar || undefined,
    })

    // Process referral code if provided
    const { referralCode } = req.body as { referralCode?: string }
    if (referralCode) {
      const referrer = await User.findOne({ referralCode: referralCode.toUpperCase().trim() })
      if (referrer && !referrer._id.equals(user._id)) {
        await User.findByIdAndUpdate(user._id, { referredBy: referrer._id })
        const now = new Date()
        const discountExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        // Give referrer 2% discount if no active discount or existing is lower
        const existingDiscount = referrer.discount
        const hasActiveDiscount = existingDiscount && existingDiscount.expiresAt > now
        if (!hasActiveDiscount || existingDiscount.percent < 2) {
          await User.findByIdAndUpdate(referrer._id, {
            discount: { percent: 2, expiresAt: discountExpiresAt },
          })
        }
      }
    }

    const token = signToken(String(user._id))
    res.status(201).json({ status: 'success', token, user: buildUserResponse(user) })
  } catch (error) {
    console.error('completeRegister error:', error)
    res.status(500).json({ message: 'Server xatosi' })
  }
}

// ─── Google OAuth ─────────────────────────────────────────────
// POST /api/auth/google  body: { credential }

export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { credential } = req.body
    if (!credential) {
      res.status(400).json({ message: 'Google credential kiritilishi shart' })
      return
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    })
    const payload = ticket.getPayload()

    if (!payload || !payload.email) {
      res.status(400).json({ message: "Google token noto'g'ri" })
      return
    }

    const { email, name, picture, sub: googleId } = payload
    let user = await User.findOne({ $or: [{ googleId }, { email }] })

    if (!user) {
      user = await User.create({
        name: name || email!.split('@')[0],
        email,
        googleId,
        avatar: picture,
        isEmailVerified: true,
      })
    } else {
      const updateFields: Record<string, unknown> = { isEmailVerified: true }
      if (!user.googleId) updateFields.googleId = googleId
      if (picture && !user.avatar) updateFields.avatar = picture
      if (!user.name) updateFields.name = email!.split('@')[0]
      if ((user.role as string) === 'basic' || (user.role as string) === 'user') updateFields.role = 'student'
      await User.updateOne({ _id: user._id }, { $set: updateFields })
      user = (await User.findById(user._id))!
    }

    const token = signToken(String(user._id))
    res.json({ status: 'success', token, user: buildUserResponse(user) })
  } catch (error) {
    console.error('googleAuth error:', error)
    res.status(500).json({ message: 'Google autentifikatsiya xatosi' })
  }
}

// ─── Google Auth via Access Token ─────────────────────────────
// POST /api/auth/google-access-token  body: { accessToken }

export const googleAuthAccessToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { accessToken } = req.body
    if (!accessToken) {
      res.status(400).json({ message: 'Google access token kiritilishi shart' })
      return
    }

    const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!response.ok) {
      res.status(400).json({ message: "Google token noto'g'ri" })
      return
    }

    const info = await response.json() as { email?: string; name?: string; picture?: string; sub?: string }
    const { email, name, picture, sub: googleId } = info

    if (!email) {
      res.status(400).json({ message: "Google tokendan email olinmadi" })
      return
    }

    let user = await User.findOne({ $or: [{ googleId }, { email }] })
    if (!user) {
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        googleId,
        avatar: picture,
        isEmailVerified: true,
      })
    } else {
      const updateFields: Record<string, unknown> = { isEmailVerified: true }
      if (!user.googleId) updateFields.googleId = googleId
      if (picture && !user.avatar) updateFields.avatar = picture
      if (!user.name) updateFields.name = email.split('@')[0]
      if ((user.role as string) === 'basic' || (user.role as string) === 'user') updateFields.role = 'student'
      await User.updateOne({ _id: user._id }, { $set: updateFields })
      user = (await User.findById(user._id))!
    }

    const token = signToken(String(user._id))
    res.json({ status: 'success', token, user: buildUserResponse(user) })
  } catch (error) {
    console.error('googleAuthAccessToken error:', error)
    res.status(500).json({ message: 'Google autentifikatsiya xatosi' })
  }
}

// ─── Login ────────────────────────────────────────────────────
// POST /api/auth/login

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      res.status(400).json({ message: 'Login va parol kiritilishi shart' })
      return
    }

    const user = await User.findOne({ username: username.toLowerCase().trim() }).select('+password')
    if (!user) {
      res.status(401).json({ message: "Login yoki parol noto'g'ri" })
      return
    }

    if (!user.password) {
      res.status(400).json({ message: "Siz Google orqali ro'yxatdan o'tgansiz. Google tugmasini bosing." })
      return
    }

    if (!(await user.comparePassword(password))) {
      res.status(401).json({ message: "Login yoki parol noto'g'ri" })
      return
    }

    const token = signToken(String(user._id))
    res.json({ status: 'success', token, user: buildUserResponse(user) })
  } catch (error) {
    console.error('login error:', error)
    res.status(500).json({ message: 'Server xatosi' })
  }
}

// ─── Get Me ───────────────────────────────────────────────────
// GET /api/auth/me (protected)

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!._id)
    if (!user) {
      res.status(404).json({ message: 'Foydalanuvchi topilmadi' })
      return
    }
    res.json({ status: 'success', user: buildUserResponse(user) })
  } catch {
    res.status(500).json({ message: 'Server xatosi' })
  }
}

// ─── Update Profile ───────────────────────────────────────────
// PATCH /api/auth/me (protected)

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const updates: Record<string, unknown> = {}
    const allowedScalar = ['firstName', 'lastName', 'specialty', 'university', 'avatar']
    for (const field of allowedScalar) {
      if (req.body[field] !== undefined) updates[field] = req.body[field]
    }
    // Recompute name when firstName or lastName changes
    if (updates.firstName !== undefined || updates.lastName !== undefined) {
      const current = await User.findById(req.user!._id)
      const fn = (updates.firstName as string) || current?.firstName || ''
      const ln = (updates.lastName as string) || current?.lastName || ''
      if (fn || ln) updates.name = `${fn} ${ln}`.trim()
    }
    // Notifications updates
    if (req.body.notifications && typeof req.body.notifications === 'object') {
      const notifFields = ['email', 'push', 'weekly', 'achievements']
      for (const field of notifFields) {
        if (req.body.notifications[field] !== undefined) {
          updates[`notifications.${field}`] = req.body.notifications[field]
        }
      }
    }
    // Preferences updates
    if (req.body.preferences && typeof req.body.preferences === 'object') {
      const prefFields = ['darkMode', 'sound', 'animations', 'language', 'autoSave']
      for (const field of prefFields) {
        if (req.body.preferences[field] !== undefined) {
          updates[`preferences.${field}`] = req.body.preferences[field]
        }
      }
    }
    if (req.body.username !== undefined) {
      const newUsername = req.body.username.toLowerCase().trim()
      if (!/^[a-z0-9]{6,}$/.test(newUsername)) {
        res.status(400).json({ message: 'Login kamida 6 ta belgi, faqat harf va raqamlardan iborat bo\'lishi kerak' })
        return
      }
      const exists = await User.findOne({ username: newUsername, _id: { $ne: req.user!._id } })
      if (exists) {
        res.status(400).json({ message: 'Bu login allaqachon band' })
        return
      }
      updates.username = newUsername
    }
    const user = await User.findByIdAndUpdate(req.user!._id, updates, { new: true })
    res.json({ status: 'success', user: buildUserResponse(user!) })
  } catch {
    res.status(500).json({ message: 'Server xatosi' })
  }
}

// ─── Forgot Password ─────────────────────────────────────────
// POST /api/auth/forgot-password  body: { email }

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  req.body.type = 'password-reset'
  return sendOTP(req, res)
}

// ─── Reset Password ───────────────────────────────────────────
// POST /api/auth/reset-password  body: { tempToken, newPassword }

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tempToken, newPassword } = req.body
    if (!tempToken || !newPassword) {
      res.status(400).json({ message: "Token va yangi parol kiritilishi shart" })
      return
    }

    let decoded: { email: string; type: string; isTemp: boolean }
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET!) as typeof decoded
    } catch {
      res.status(400).json({ message: "Token muddati o'tgan. Qaytadan boshlang." })
      return
    }

    if (!decoded.isTemp || decoded.type !== 'password-reset') {
      res.status(400).json({ message: "Noto'g'ri token" })
      return
    }

    const user = await User.findOne({ email: decoded.email })
    if (!user) {
      res.status(404).json({ message: 'Foydalanuvchi topilmadi' })
      return
    }

    const { newUsername } = req.body
    const updateData: Record<string, unknown> = {}

    const hashedNew = await bcrypt.hash(newPassword, await bcrypt.genSalt(12))
    updateData.password = hashedNew

    if (newUsername) {
      const usernameClean = newUsername.toLowerCase().trim()
      if (!/^[a-z0-9]{6,}$/.test(usernameClean)) {
        res.status(400).json({ message: 'Login kamida 6 ta belgi, faqat harf va raqamlardan iborat bo\'lishi kerak' })
        return
      }
      const exists = await User.findOne({ username: usernameClean, _id: { $ne: user._id } })
      if (exists) {
        res.status(400).json({ message: 'Bu login allaqachon band' })
        return
      }
      updateData.username = usernameClean
    }

    await User.updateOne({ _id: user._id }, { $set: updateData })
    const updatedUser = await User.findById(user._id)

    const token = signToken(String(user._id))
    res.json({ status: 'success', message: "Login va parol muvaffaqiyatli o'zgartirildi", token, user: buildUserResponse(updatedUser!) })
  } catch (error) {
    console.error('resetPassword error:', error)
    res.status(500).json({ message: 'Server xatosi' })
  }
}

// ─── Request Password Change ──────────────────────────────────
// POST /api/auth/request-password-change (protected)  body: { newPassword }

export const requestPasswordChange = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { newPassword } = req.body
    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ message: "Yangi parol kamida 6 belgidan iborat bo'lishi kerak" })
      return
    }
    const user = await User.findById(req.user!._id)
    if (!user) {
      res.status(404).json({ message: 'Foydalanuvchi topilmadi' })
      return
    }

    const salt = await bcrypt.genSalt(12)
    const hashedNew = await bcrypt.hash(newPassword, salt)
    const code = generateOTP()

    await OTP.deleteMany({ email: user.email, type: 'password-change' })
    await OTP.create({
      email: user.email,
      code,
      type: 'password-change',
      tempData: hashedNew,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    })

    await sendOTPEmail(user.email, code, 'password-change')
    res.json({ message: 'Tasdiqlash kodi emailingizga yuborildi' })
  } catch (error) {
    console.error('requestPasswordChange error:', error)
    res.status(500).json({ message: 'Server xatosi' })
  }
}

// ─── Confirm Password Change ──────────────────────────────────
// POST /api/auth/confirm-password-change (protected)  body: { code }

export const confirmPasswordChange = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code } = req.body
    const user = await User.findById(req.user!._id)
    if (!user) {
      res.status(404).json({ message: 'Foydalanuvchi topilmadi' })
      return
    }

    const otp = await OTP.findOne({ email: user.email, code, type: 'password-change', expiresAt: { $gt: new Date() } })
    if (!otp) {
      res.status(400).json({ message: "Kod noto'g'ri yoki muddati o'tgan" })
      return
    }

    await User.findByIdAndUpdate(user._id, { password: otp.tempData })
    await otp.deleteOne()
    res.json({ message: "Parol muvaffaqiyatli o'zgartirildi" })
  } catch (error) {
    console.error('confirmPasswordChange error:', error)
    res.status(500).json({ message: 'Server xatosi' })
  }
}

// ─── Request Email Change ─────────────────────────────────────
// POST /api/auth/request-email-change (protected)  body: { newEmail }

export const requestEmailChange = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { newEmail } = req.body
    if (!newEmail) {
      res.status(400).json({ message: 'Yangi email kiritilishi shart' })
      return
    }

    const user = await User.findById(req.user!._id)
    if (!user) {
      res.status(404).json({ message: 'Foydalanuvchi topilmadi' })
      return
    }

    const newNormalized = newEmail.toLowerCase().trim()
    const exists = await User.findOne({ email: newNormalized })
    if (exists) {
      res.status(400).json({ message: 'Bu email allaqachon ishlatilmoqda' })
      return
    }

    const code = generateOTP()
    await OTP.deleteMany({ email: user.email, type: 'email-change' })
    await OTP.create({
      email: user.email,
      code,
      type: 'email-change',
      tempData: newNormalized,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    })

    await sendOTPEmail(user.email, code, 'email-change')
    res.json({ message: 'Tasdiqlash kodi joriy emailingizga yuborildi' })
  } catch (error) {
    console.error('requestEmailChange error:', error)
    res.status(500).json({ message: 'Server xatosi' })
  }
}

// ─── Confirm Email Change ─────────────────────────────────────
// POST /api/auth/confirm-email-change (protected)  body: { code }

export const confirmEmailChange = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code } = req.body
    const user = await User.findById(req.user!._id)
    if (!user) {
      res.status(404).json({ message: 'Foydalanuvchi topilmadi' })
      return
    }

    const otp = await OTP.findOne({ email: user.email, code, type: 'email-change', expiresAt: { $gt: new Date() } })
    if (!otp) {
      res.status(400).json({ message: "Kod noto'g'ri yoki muddati o'tgan" })
      return
    }

    const newEmail = otp.tempData!
    await user.updateOne({ email: newEmail })
    await otp.deleteOne()
    res.json({ message: "Email muvaffaqiyatli o'zgartirildi", newEmail })
  } catch (error) {
    console.error('confirmEmailChange error:', error)
    res.status(500).json({ message: 'Server xatosi' })
  }
}

// ─── Legacy register ──────────────────────────────────────────
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body
    const exists = await User.findOne({ email: email?.toLowerCase() })
    if (exists) {
      res.status(400).json({ message: "Bu email allaqachon ro'yxatdan o'tgan" })
      return
    }
    const user = await User.create({ name, email, password, isEmailVerified: true })
    const token = signToken(String(user._id))
    res.status(201).json({ status: 'success', token, user: buildUserResponse(user) })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

// ─── Request Username Change ──────────────────────────────────
// POST /api/auth/request-username-change (protected)  body: { newUsername }

export const requestUsernameChange = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { newUsername } = req.body
    if (!newUsername) {
      res.status(400).json({ message: 'Yangi login kiritilishi shart' })
      return
    }
    const usernameClean = newUsername.toLowerCase().trim()
    if (!/^[a-z0-9]{6,}$/.test(usernameClean)) {
      res.status(400).json({ message: "Login kamida 6 ta belgi, faqat harf va raqamlardan iborat bo'lishi kerak" })
      return
    }
    const user = await User.findById(req.user!._id)
    if (!user) {
      res.status(404).json({ message: 'Foydalanuvchi topilmadi' })
      return
    }
    const exists = await User.findOne({ username: usernameClean, _id: { $ne: user._id } })
    if (exists) {
      res.status(400).json({ message: 'Bu login allaqachon band' })
      return
    }

    const code = generateOTP()
    await OTP.deleteMany({ email: user.email, type: 'username-change' })
    await OTP.create({
      email: user.email,
      code,
      type: 'username-change',
      tempData: usernameClean,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    })
    await sendOTPEmail(user.email, code, 'username-change')
    res.json({ message: 'Tasdiqlash kodi emailingizga yuborildi' })
  } catch (error) {
    console.error('requestUsernameChange error:', error)
    res.status(500).json({ message: 'Server xatosi' })
  }
}

// ─── Confirm Username Change ──────────────────────────────────
// POST /api/auth/confirm-username-change (protected)  body: { code }

export const confirmUsernameChange = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code } = req.body
    const user = await User.findById(req.user!._id)
    if (!user) {
      res.status(404).json({ message: 'Foydalanuvchi topilmadi' })
      return
    }
    const otp = await OTP.findOne({ email: user.email, code, type: 'username-change', expiresAt: { $gt: new Date() } })
    if (!otp) {
      res.status(400).json({ message: "Kod noto'g'ri yoki muddati o'tgan" })
      return
    }
    await User.findByIdAndUpdate(user._id, { username: otp.tempData })
    await otp.deleteOne()
    const updated = await User.findById(user._id)
    res.json({ message: "Login muvaffaqiyatli o'zgartirildi", user: buildUserResponse(updated!) })
  } catch (error) {
    console.error('confirmUsernameChange error:', error)
    res.status(500).json({ message: 'Server xatosi' })
  }
}

