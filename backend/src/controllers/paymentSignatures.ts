import crypto from 'crypto'

/**
 * Pure signature helpers for Click and Payme. Kept dependency-free so the
 * crypto-sensitive logic can be unit-tested without HTTP or a DB.
 */

// ─── Click ─────────────────────────────────────────────────────
// Click signs each callback with MD5 over a fixed field order. Prepare omits
// merchant_prepare_id; Complete includes it.
export interface ClickSignParams {
  clickTransId: string | number
  serviceId: string | number
  secretKey: string
  merchantTransId: string
  merchantPrepareId?: string | number // only present on Complete
  amount: string | number
  action: string | number
  signTime: string
}

export function clickSignString(p: ClickSignParams): string {
  const prepare = p.merchantPrepareId !== undefined && p.merchantPrepareId !== ''
    ? String(p.merchantPrepareId)
    : ''
  const raw =
    String(p.clickTransId) +
    String(p.serviceId) +
    p.secretKey +
    p.merchantTransId +
    prepare +
    String(p.amount) +
    String(p.action) +
    p.signTime
  return crypto.createHash('md5').update(raw).digest('hex')
}

/** Constant-time-ish comparison of two hex signatures. */
export function signaturesMatch(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
  } catch {
    return false
  }
}

// Click error codes (subset used by the callbacks).
export const CLICK_ERR = {
  SUCCESS: 0,
  SIGN_CHECK_FAILED: -1,
  INVALID_AMOUNT: -2,
  ACTION_NOT_FOUND: -3,
  ALREADY_PAID: -4,
  USER_NOT_FOUND: -5,
  TRANSACTION_NOT_FOUND: -6,
  TRANSACTION_CANCELLED: -9,
} as const

// ─── Payme ─────────────────────────────────────────────────────
/**
 * Validate the Payme `Authorization: Basic base64("Paycom:KEY")` header.
 * Returns true only when the decoded key matches the configured merchant key.
 */
export function paymeAuthOk(authHeader: string | undefined, merchantKey: string): boolean {
  if (!authHeader || !merchantKey) return false
  const m = authHeader.match(/^Basic\s+(.+)$/i)
  if (!m) return false
  let decoded: string
  try {
    decoded = Buffer.from(m[1], 'base64').toString('utf8')
  } catch {
    return false
  }
  const idx = decoded.indexOf(':')
  if (idx === -1) return false
  const key = decoded.slice(idx + 1)
  return signaturesMatch(key, merchantKey)
}

// Payme JSON-RPC error codes.
export const PAYME_ERR = {
  TRANSPORT: -32300,
  PARSE: -32700,
  RPC_METHOD_NOT_FOUND: -32601,
  INSUFFICIENT_PRIVILEGE: -32504,
  INVALID_AMOUNT: -31001,
  TX_NOT_FOUND: -31003,
  CANNOT_PERFORM: -31008,
  CANNOT_CANCEL: -31007,
  ORDER_NOT_FOUND: -31050, // account.* lookup failure (custom range -31050..-31099)
} as const
