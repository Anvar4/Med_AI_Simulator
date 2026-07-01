import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { IUser, User } from '../models/User'

export interface AuthRequest extends Request {
  user?: IUser
}

// ── Token blacklist (revoked access tokens) ────────────────────────────────────
// In-memory for single-instance; replace with Redis in multi-instance setup.

const revokedTokens = new Set<string>()

export function revokeToken(jti: string): void {
  revokedTokens.add(jti)
}

export function isTokenRevoked(jti: string): boolean {
  return revokedTokens.has(jti)
}

// Purge expired tokens from the set periodically (rough cleanup)
setInterval(() => {
  // We cannot know expiry without decoding; keep set small by capping size
  if (revokedTokens.size > 10_000) revokedTokens.clear()
}, 60 * 60 * 1000).unref()

// ── Token factory ──────────────────────────────────────────────────────────────

function jtiFor(userId: string): string {
  return `${userId}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function signAccessToken(userId: string): string {
  const jti = jtiFor(userId)
  return jwt.sign(
    { id: userId, jti, type: 'access' },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' } as jwt.SignOptions,
  )
}

export function signRefreshToken(userId: string): string {
  const jti = jtiFor(userId)
  return jwt.sign(
    { id: userId, jti, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' } as jwt.SignOptions,
  )
}

export function signTempToken(payload: object): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '15m' } as jwt.SignOptions)
}

// ── Refresh token cookie helpers ───────────────────────────────────────────────

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/auth/refresh',
  })
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth/refresh',
  })
}

// ── protect — required authentication ─────────────────────────────────────────

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    let token: string | undefined

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      res.status(401).json({ message: 'Avtorizatsiyadan o\'tilmagan' })
      return
    }

    let decoded: { id: string; jti?: string; type?: string }
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as typeof decoded
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        res.status(401).json({ message: 'Token muddati o\'tgan', code: 'TOKEN_EXPIRED' })
      } else {
        res.status(401).json({ message: 'Token yaroqsiz' })
      }
      return
    }

    // Reject refresh tokens used as access tokens
    if (decoded.type === 'refresh') {
      res.status(401).json({ message: 'Token turi noto\'g\'ri' })
      return
    }

    // Check revocation list
    if (decoded.jti && isTokenRevoked(decoded.jti)) {
      res.status(401).json({ message: 'Token bekor qilingan' })
      return
    }

    const user = await User.findById(decoded.id).select('+passwordChangedAt')
    if (!user) {
      res.status(401).json({ message: 'Foydalanuvchi topilmadi' })
      return
    }

    // Invalidate tokens issued before a password change
    if (user.passwordChangedAt) {
      const changedAt = Math.floor(user.passwordChangedAt.getTime() / 1000)
      const issuedAt = (decoded as jwt.JwtPayload).iat ?? 0
      if (issuedAt < changedAt) {
        res.status(401).json({ message: 'Parol o\'zgartirilgan. Qayta kiring.' })
        return
      }
    }

    req.user = user
    next()
  } catch {
    res.status(401).json({ message: 'Token yaroqsiz' })
  }
}

// ── optionalAuth — no rejection when token missing ────────────────────────────

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (req.headers.authorization?.startsWith('Bearer ')) {
      const token = req.headers.authorization.split(' ')[1]
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; jti?: string; type?: string }
        if (decoded.type !== 'refresh' && !(decoded.jti && isTokenRevoked(decoded.jti))) {
          const user = await User.findById(decoded.id)
          if (user) req.user = user
        }
      }
    }
  } catch {
    // ignore — treat as anonymous
  }
  next()
}

// ── restrictTo — role-based access ────────────────────────────────────────────

export const restrictTo = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Ruxsat berilmagan' })
      return
    }
    next()
  }
}
