import path from 'path'
import { NextFunction, Request, Response } from 'express'
import { logSecurityEvent } from './auditLog'

// ── Magic bytes signatures ────────────────────────────────────────────────────
// Verify actual file content, not just the MIME header (which clients can spoof).

interface Signature {
  mime: string
  bytes: (number | null)[]  // null = wildcard byte
  offset?: number
}

const SIGNATURES: Signature[] = [
  // Images
  { mime: 'image/jpeg', bytes: [0xFF, 0xD8, 0xFF] },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
  { mime: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38] },
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x57, 0x45, 0x42, 0x50] },
  // Video
  { mime: 'video/mp4', bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 },   // ftyp box
  { mime: 'video/mp4', bytes: [0x00, 0x00, 0x00, null, 0x66, 0x74, 0x79, 0x70] }, // alt ftyp
  { mime: 'video/webm', bytes: [0x1A, 0x45, 0xDF, 0xA3] },
  // PDF
  { mime: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
]

function matchesMagic(buffer: Buffer, sig: Signature): boolean {
  const off = sig.offset ?? 0
  if (buffer.length < off + sig.bytes.length) return false
  for (let i = 0; i < sig.bytes.length; i++) {
    const expected = sig.bytes[i]
    if (expected !== null && buffer[off + i] !== expected) return false
  }
  return true
}

function detectMime(buffer: Buffer): string | null {
  for (const sig of SIGNATURES) {
    if (matchesMagic(buffer, sig)) return sig.mime
  }
  return null
}

// ── Dangerous extension / polyglot check ─────────────────────────────────────

const DANGEROUS_EXTENSIONS = new Set([
  '.php', '.php3', '.php4', '.php5', '.phtml',
  '.asp', '.aspx', '.jsp', '.jspx',
  '.cgi', '.pl', '.py', '.rb', '.sh', '.bash',
  '.exe', '.dll', '.so', '.bat', '.cmd', '.ps1',
  '.htaccess', '.htpasswd',
  '.svg',  // SVG can contain JS
  '.xml',  // XXE risk
  '.html', '.htm', '.js', '.ts',
])

function hasDangerousExtension(filename: string): boolean {
  // Check all extensions (e.g. "evil.php.jpg")
  const parts = filename.toLowerCase().split('.')
  for (let i = 1; i < parts.length; i++) {
    if (DANGEROUS_EXTENSIONS.has('.' + parts[i])) return true
  }
  return false
}

// ── Filename sanitizer ────────────────────────────────────────────────────────

export function sanitizeFilename(original: string): string {
  const ext = path.extname(original).toLowerCase()
  const base = path.basename(original, ext)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 64)
  return `${base}${ext}`
}

// ── Main middleware ────────────────────────────────────────────────────────────
// Use AFTER multer has populated req.file / req.files.

export function validateUploadedFile(req: Request, res: Response, next: NextFunction): void {
  const file = req.file
  if (!file) return next()

  // 1. Dangerous extension check
  if (hasDangerousExtension(file.originalname)) {
    logSecurityEvent(req, 'upload_dangerous_ext', { filename: file.originalname })
    res.status(400).json({ message: 'Bu fayl turi taqiqlangan' })
    return
  }

  // 2. Magic bytes verification (only if file is buffered)
  if (file.buffer && file.buffer.length > 0) {
    const detectedMime = detectMime(file.buffer)
    if (!detectedMime) {
      logSecurityEvent(req, 'upload_unknown_magic', { filename: file.originalname, mime: file.mimetype })
      res.status(400).json({ message: 'Fayl turi aniqlanmadi yoki ruxsat etilmagan' })
      return
    }
    // Normalise mp4 detection: both signatures map to video/mp4
    const normDetected = detectedMime === 'video/mp4' ? 'video/mp4' : detectedMime
    const normClaimed = file.mimetype === 'video/mp4' ? 'video/mp4' : file.mimetype
    if (normDetected !== normClaimed) {
      logSecurityEvent(req, 'upload_mime_mismatch', {
        filename: file.originalname,
        claimed: file.mimetype,
        detected: detectedMime,
      })
      res.status(400).json({ message: 'Fayl turi mos kelmaydi' })
      return
    }
  }

  // 3. Sanitize filename for storage
  file.originalname = sanitizeFilename(file.originalname)

  next()
}

// ── PDF-specific content check ────────────────────────────────────────────────
// Reject PDFs that embed JavaScript.

export function rejectJsInPdf(req: Request, res: Response, next: NextFunction): void {
  const file = req.file
  if (!file || file.mimetype !== 'application/pdf') return next()
  if (file.buffer) {
    const content = file.buffer.toString('latin1')
    if (/\/JavaScript\s|\/JS\s/i.test(content)) {
      logSecurityEvent(req, 'upload_pdf_js', { filename: file.originalname })
      res.status(400).json({ message: 'JavaScript o\'z ichiga olgan PDF fayllar taqiqlangan' })
      return
    }
  }
  next()
}
