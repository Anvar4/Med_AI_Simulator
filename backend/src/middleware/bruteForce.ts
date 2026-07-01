import { NextFunction, Request, Response } from 'express'
import { getClientIp, logSecurityEvent } from './auditLog'

// ── In-memory brute-force tracker ─────────────────────────────────────────────
// For production use Redis (ioredis) for distributed tracking across instances.
// The in-memory map is sufficient for single-instance PM2 deployments.

interface Attempt {
  count: number
  firstAt: number
  lockedUntil: number | null
}

const store = new Map<string, Attempt>()

const MAX_ATTEMPTS = 5           // max failures before lock
const WINDOW_MS = 15 * 60 * 1000 // 15-minute sliding window
const LOCK_MS = 30 * 60 * 1000   // 30-minute lockout

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now - entry.firstAt > LOCK_MS + WINDOW_MS) store.delete(key)
  }
}, 10 * 60 * 1000).unref()

function key(ip: string, identifier: string): string {
  return `${ip}::${identifier}`
}

export function recordFailedAttempt(req: Request, identifier: string): void {
  const ip = getClientIp(req)
  const k = key(ip, identifier)
  const now = Date.now()
  const entry = store.get(k) ?? { count: 0, firstAt: now, lockedUntil: null }

  // Reset window if expired
  if (now - entry.firstAt > WINDOW_MS) {
    entry.count = 0
    entry.firstAt = now
    entry.lockedUntil = null
  }

  entry.count += 1
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCK_MS
    logSecurityEvent(req, 'brute_force_lock', { identifier, ip, attempts: entry.count })
  }

  store.set(k, entry)
}

export function resetAttempts(req: Request, identifier: string): void {
  const ip = getClientIp(req)
  store.delete(key(ip, identifier))
}

export function isLocked(req: Request, identifier: string): boolean {
  const ip = getClientIp(req)
  const entry = store.get(key(ip, identifier))
  if (!entry || !entry.lockedUntil) return false
  if (Date.now() > entry.lockedUntil) {
    store.delete(key(ip, identifier))
    return false
  }
  return true
}

export function remainingLockSecs(req: Request, identifier: string): number {
  const ip = getClientIp(req)
  const entry = store.get(key(ip, identifier))
  if (!entry?.lockedUntil) return 0
  return Math.max(0, Math.ceil((entry.lockedUntil - Date.now()) / 1000))
}

// ── IP blocklist ───────────────────────────────────────────────────────────────
// Static block: add IPs via BLOCKED_IPS env var (comma-separated).
// Runtime block: call blockIp() from anywhere.

const runtimeBlocked = new Set<string>()

export function blockIp(ip: string): void {
  runtimeBlocked.add(ip)
}

export function unblockIp(ip: string): void {
  runtimeBlocked.delete(ip)
}

function isBlockedIp(ip: string): boolean {
  const staticList = (process.env.BLOCKED_IPS || '').split(',').map(s => s.trim()).filter(Boolean)
  return runtimeBlocked.has(ip) || staticList.includes(ip)
}

export function ipBlockMiddleware(req: Request, res: Response, next: NextFunction): void {
  const ip = getClientIp(req)
  if (isBlockedIp(ip)) {
    logSecurityEvent(req, 'blocked_ip_access', { ip })
    res.status(403).json({ message: 'Kirish taqiqlangan' })
    return
  }
  next()
}

// ── Generic rate-limiter factory (lightweight, in-memory) ─────────────────────

interface WindowEntry {
  count: number
  reset: number
}

export function createWindowRateLimiter(opts: {
  windowMs: number
  max: number
  keyFn?: (req: Request) => string
  message?: string
}) {
  const windows = new Map<string, WindowEntry>()
  const { windowMs, max, message = 'Juda ko\'p so\'rov. Keyinroq urinib ko\'ring.', keyFn } = opts

  setInterval(() => {
    const now = Date.now()
    for (const [k, e] of windows) {
      if (now > e.reset) windows.delete(k)
    }
  }, windowMs).unref()

  return (req: Request, res: Response, next: NextFunction): void => {
    const k = keyFn ? keyFn(req) : getClientIp(req)
    const now = Date.now()
    const entry = windows.get(k) ?? { count: 0, reset: now + windowMs }

    if (now > entry.reset) {
      entry.count = 0
      entry.reset = now + windowMs
    }

    entry.count += 1
    windows.set(k, entry)

    res.setHeader('X-RateLimit-Limit', max)
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - entry.count))
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.reset / 1000))

    if (entry.count > max) {
      logSecurityEvent(req, 'rate_limit_exceeded', { key: k, count: entry.count })
      res.status(429).json({ message })
      return
    }
    next()
  }
}
