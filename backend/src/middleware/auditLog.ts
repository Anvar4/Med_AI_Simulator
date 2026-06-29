import fs from 'fs'
import path from 'path'
import { NextFunction, Request, Response } from 'express'
import { AuthRequest } from './auth'

// ── Audit log destination ──────────────────────────────────────────────────────
// Writes NDJSON lines to logs/audit.log (created automatically).
// In production wire this to a centralised logging service instead.

function resolveLogDir(): string {
  const candidates = [
    path.join(process.cwd(), 'logs'),
    path.join(process.cwd(), '..', 'logs'),
    path.join('/tmp', 'logs'),
  ]
  for (const d of candidates) {
    try {
      fs.mkdirSync(d, { recursive: true })
      return d
    } catch {
      continue
    }
  }
  return '/tmp/logs'
}

let _logDir: string | null = null
function getLogDir(): string {
  if (!_logDir) _logDir = resolveLogDir()
  return _logDir
}

function writeAuditLine(entry: Record<string, unknown>): void {
  try {
    const line = JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n'
    fs.appendFileSync(path.join(getLogDir(), 'audit.log'), line, 'utf8')
    if (process.env.NODE_ENV !== 'production') {
      process.stdout.write(`[AUDIT] ${line}`)
    }
  } catch {
    // Never let logging crash the request
  }
}

// ── Public helpers ─────────────────────────────────────────────────────────────

export function auditLog(
  event: string,
  details: Record<string, unknown>,
  req?: Request,
  userId?: string,
): void {
  writeAuditLine({
    event,
    userId: userId ?? (req as AuthRequest)?.user?._id?.toString() ?? 'anonymous',
    ip: req ? getClientIp(req) : undefined,
    ua: req?.headers['user-agent'],
    method: req?.method,
    path: req?.path,
    ...details,
  })
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim()
  return req.socket?.remoteAddress ?? 'unknown'
}

// ── Middleware: log every authenticated state-mutating request ─────────────────

const AUDIT_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export function auditMiddleware(req: AuthRequest, _res: Response, next: NextFunction): void {
  if (!AUDIT_METHODS.has(req.method)) return next()
  // Only log authenticated or sensitive paths
  const isSensitive =
    req.path.includes('/admin') ||
    req.path.includes('/auth') ||
    req.path.includes('/payments') ||
    req.path.includes('/subscriptions') ||
    req.path.includes('/upload')

  if (!isSensitive && !req.user) return next()

  auditLog('api_request', {
    body: sanitizeBody(req.body),
  }, req)

  next()
}

// Strip secrets before logging
function sanitizeBody(body: unknown): unknown {
  if (!body || typeof body !== 'object') return body
  const REDACTED = ['password', 'newPassword', 'token', 'secret', 'credential', 'tempToken', 'accessToken', 'code']
  const copy: Record<string, unknown> = { ...(body as Record<string, unknown>) }
  for (const k of REDACTED) {
    if (k in copy) copy[k] = '[REDACTED]'
  }
  return copy
}

// ── Brute-force / suspicious login log ────────────────────────────────────────

export function logFailedLogin(req: Request, identifier: string): void {
  auditLog('login_failed', { identifier }, req)
}

export function logSuccessLogin(req: Request, userId: string): void {
  auditLog('login_success', { userId }, req)
}

export function logAdminAction(req: AuthRequest, action: string, target?: unknown): void {
  auditLog('admin_action', { action, target }, req, req.user?._id?.toString())
}

export function logSecurityEvent(req: Request, event: string, detail?: unknown): void {
  auditLog('security_event', { event, detail }, req)
}
