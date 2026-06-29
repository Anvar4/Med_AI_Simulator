import crypto from 'crypto'
import { NextFunction, Request, Response } from 'express'
import { AuthRequest } from './auth'

// ── Subdomain enforcement ──────────────────────────────────────────────────────
// admin.medaisimulator.uz  → only admin role
// manager.medaisimulator.uz → only instructor/admin role
// Requests that reach the wrong subdomain get 403.

const ADMIN_SUBDOMAIN = 'admin.medaisimulator.uz'
const MANAGER_SUBDOMAIN = 'manager.medaisimulator.uz'

export function subdomainGuard(req: AuthRequest, res: Response, next: NextFunction): void {
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString().toLowerCase().split(':')[0]

  // Admin subdomain: only admin role allowed
  if (host === ADMIN_SUBDOMAIN) {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ message: 'Bu panel faqat adminlar uchun' })
      return
    }
    return next()
  }

  // Manager subdomain: admin + instructor allowed
  if (host === MANAGER_SUBDOMAIN) {
    if (!req.user || !['admin', 'instructor'].includes(req.user.role)) {
      res.status(403).json({ message: 'Bu panel faqat content managerlar uchun' })
      return
    }
    return next()
  }

  next()
}

// ── CSRF double-submit cookie ──────────────────────────────────────────────────
// Stateless double-submit: client reads __csrf cookie and echoes it in X-CSRF-Token header.
// Applied on state-mutating methods.

const CSRF_COOKIE = '__csrf'
const CSRF_HEADER = 'x-csrf-token'
const CSRF_SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export function csrfSetCookie(req: Request, res: Response, next: NextFunction): void {
  if (!req.cookies?.[CSRF_COOKIE]) {
    const token = crypto.randomBytes(32).toString('hex')
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false, // JS must read it to send in header
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    })
  }
  next()
}

export function csrfProtect(req: Request, res: Response, next: NextFunction): void {
  if (CSRF_SAFE_METHODS.has(req.method)) return next()
  // Skip for payment webhooks (they use their own HMAC)
  if (req.path.startsWith('/api/payments/webhook') || req.path.startsWith('/api/payments/click') || req.path.startsWith('/api/payments/payme')) {
    return next()
  }
  const cookieToken = req.cookies?.[CSRF_COOKIE]
  const headerToken = req.headers[CSRF_HEADER]
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    res.status(403).json({ message: 'CSRF token noto\'g\'ri' })
    return
  }
  next()
}

// ── Clickjacking / frame guard ────────────────────────────────────────────────

export function frameGuard(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Content-Security-Policy', "frame-ancestors 'none'")
  next()
}

// ── NoSniff / content-type ────────────────────────────────────────────────────

export function noSniff(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  next()
}

// ── Remove server fingerprint ─────────────────────────────────────────────────

export function removeFingerprint(_req: Request, res: Response, next: NextFunction): void {
  res.removeHeader('X-Powered-By')
  res.removeHeader('Server')
  next()
}

// ── HTTP Parameter Pollution guard ────────────────────────────────────────────
// Collapses duplicate query params to the last value, preventing HPP bypasses.

export function hppGuard(req: Request, _res: Response, next: NextFunction): void {
  for (const key in req.query) {
    if (Array.isArray(req.query[key])) {
      const arr = req.query[key] as string[]
      req.query[key] = arr[arr.length - 1]
    }
  }
  next()
}

// ── XSS scrubber ─────────────────────────────────────────────────────────────
// Strips common XSS payloads from string values in body/query/params.
// Helmet's CSP is the primary defence; this is an extra belt.

const XSS_RE = /<\s*script[\s\S]*?>[\s\S]*?<\s*\/\s*script\s*>/gi
const EVENT_RE = /\bon\w+\s*=\s*["']?[^"'>]*/gi

function scrub(val: unknown): unknown {
  if (typeof val === 'string') {
    return val.replace(XSS_RE, '').replace(EVENT_RE, '')
  }
  if (val && typeof val === 'object') {
    for (const k of Object.keys(val as Record<string, unknown>)) {
      (val as Record<string, unknown>)[k] = scrub((val as Record<string, unknown>)[k])
    }
  }
  return val
}

export function xssScrub(req: Request, _res: Response, next: NextFunction): void {
  if (req.body) scrub(req.body)
  if (req.query) scrub(req.query)
  next()
}

// ── SSRF guard for outbound URLs ──────────────────────────────────────────────
// Call validateExternalUrl() before fetch()ing user-supplied URLs.

const PRIVATE_RANGES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
  /^localhost$/i,
  /^0\.0\.0\.0$/,
]

export function validateExternalUrl(raw: string): void {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error('URL noto\'g\'ri format')
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Faqat HTTP/HTTPS protokollariga ruxsat beriladi')
  }
  const host = url.hostname
  for (const re of PRIVATE_RANGES) {
    if (re.test(host)) {
      throw new Error('Ichki tarmoq manzillariga so\'rov yuborish taqiqlangan')
    }
  }
}

// ── MongoDB injection guard ───────────────────────────────────────────────────
// Strips $ and . prefixed keys that could be MongoDB operators.

function sanitizeMongo(val: unknown): unknown {
  if (val && typeof val === 'object' && !Array.isArray(val)) {
    const obj = val as Record<string, unknown>
    for (const key of Object.keys(obj)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key]
      } else {
        obj[key] = sanitizeMongo(obj[key])
      }
    }
  }
  return val
}

export function mongoSanitize(req: Request, _res: Response, next: NextFunction): void {
  if (req.body) sanitizeMongo(req.body)
  if (req.params) sanitizeMongo(req.params)
  // query params are strings, no object injection risk
  next()
}

// ── Request size guard ────────────────────────────────────────────────────────
// Separately enforced limit for non-upload endpoints (50 KB for JSON).

export function jsonSizeGuard(limit = 50 * 1024) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.headers['content-type']?.startsWith('application/json')) return next()
    const len = parseInt(req.headers['content-length'] || '0', 10)
    if (len > limit) {
      res.status(413).json({ message: 'So\'rov hajmi juda katta' })
      return
    }
    next()
  }
}
