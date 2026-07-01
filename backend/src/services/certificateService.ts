import { existsSync, readFileSync } from 'fs'
import path from 'path'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import QRCode from 'qrcode'

/**
 * Server-side certificate PDF generation (pdf-lib — pure JS, no native deps,
 * works under the standalone PM2 server). Produces an A4 landscape certificate
 * with the brand logo, recipient, course, date, serial and a QR code that links
 * to the public verification page.
 */

interface CertificateData {
  serial: string
  recipientName: string
  courseTitle: string
  issuedAt: Date
}

// Brand palette (matches the app's primary teal).
const PRIMARY = rgb(0.043, 0.616, 0.71) // ~#0B9DB5
const DARK = rgb(0.09, 0.12, 0.18)
const MUTED = rgb(0.42, 0.47, 0.54)
const GOLD = rgb(0.85, 0.65, 0.13)

/** Locate the brand logo across dev (src) and built (dist) layouts. */
function findLogo(): Buffer | null {
  const candidates = [
    path.join(__dirname, '..', 'assets', 'logo.png'),
    path.join(process.cwd(), 'src', 'assets', 'logo.png'),
    path.join(process.cwd(), 'dist', 'assets', 'logo.png'),
    path.join(process.cwd(), 'assets', 'logo.png'),
  ]
  for (const p of candidates) {
    if (existsSync(p)) return readFileSync(p)
  }
  return null
}

function formatDate(d: Date): string {
  // O'zbekcha oy nomlari bilan: "11-iyun, 2026"
  const months = [
    'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
    'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr',
  ]
  return `${d.getDate()}-${months[d.getMonth()]}, ${d.getFullYear()}`
}

export async function generateCertificatePdf(
  data: CertificateData,
  verifyUrl: string
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  pdf.setTitle(`Sertifikat — ${data.serial}`)
  pdf.setAuthor('MedAI Simulator')
  pdf.setSubject(data.courseTitle)

  // A4 landscape (842 x 595 pt)
  const page = pdf.addPage([842, 595])
  const { width, height } = page.getSize()

  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const fontItalic = await pdf.embedFont(StandardFonts.HelveticaOblique)

  // ── Background + decorative borders ──
  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(1, 1, 1) })
  // Outer frame
  page.drawRectangle({
    x: 24, y: 24, width: width - 48, height: height - 48,
    borderColor: PRIMARY, borderWidth: 2,
  })
  // Inner thin frame
  page.drawRectangle({
    x: 34, y: 34, width: width - 68, height: height - 68,
    borderColor: rgb(0.8, 0.88, 0.9), borderWidth: 1,
  })
  // Top accent bar
  page.drawRectangle({ x: 34, y: height - 110, width: width - 68, height: 6, color: PRIMARY })

  // ── Logo (top center) ──
  const logoBytes = findLogo()
  if (logoBytes) {
    try {
      const logo = await pdf.embedPng(logoBytes)
      const lw = 130
      const scale = lw / logo.width
      const lh = logo.height * scale
      page.drawImage(logo, { x: (width - lw) / 2, y: height - 70 - lh + 20, width: lw, height: lh })
    } catch {
      /* logo dekorativ — xato bo'lsa o'tkazib yuboramiz */
    }
  }

  const center = (text: string, font: typeof fontBold, size: number, color = DARK, y = 0): void => {
    const tw = font.widthOfTextAtSize(text, size)
    page.drawText(text, { x: (width - tw) / 2, y, size, font, color })
  }

  // ── Title ──
  center('SERTIFIKAT', fontBold, 38, PRIMARY, height - 180)
  center('CERTIFICATE OF COMPLETION', fontRegular, 11, MUTED, height - 200)

  // ── Recipient ──
  center('Ushbu sertifikat', fontRegular, 13, MUTED, height - 250)
  center(data.recipientName, fontBold, 30, DARK, height - 292)
  // underline under the name
  {
    const tw = fontBold.widthOfTextAtSize(data.recipientName, 30)
    const x = (width - tw) / 2
    page.drawLine({ start: { x: x - 20, y: height - 302 }, end: { x: x + tw + 20, y: height - 302 }, thickness: 1, color: rgb(0.8, 0.88, 0.9) })
  }

  center('quyidagi kursni muvaffaqiyatli yakunlaganligi uchun taqdim etiladi', fontRegular, 13, MUTED, height - 326)

  // ── Course title (may be long — wrap to two lines) ──
  const courseSize = 18
  const maxW = width - 200
  const words = data.courseTitle.split(' ')
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (fontBold.widthOfTextAtSize(test, courseSize) > maxW && line) {
      lines.push(line); line = w
    } else { line = test }
  }
  if (line) lines.push(line)
  let cy = height - 362
  for (const l of lines.slice(0, 2)) {
    center(`"${l}"`, fontBold, courseSize, PRIMARY, cy)
    cy -= 24
  }

  // ── QR code (bottom right) ──
  try {
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 240, color: { dark: '#16202E', light: '#FFFFFF' } })
    const qrPng = await pdf.embedPng(qrDataUrl)
    const qrSize = 96
    page.drawImage(qrPng, { x: width - 34 - qrSize - 30, y: 60, width: qrSize, height: qrSize })
    page.drawText('Tekshirish uchun skanerlang', {
      x: width - 34 - qrSize - 42, y: 48, size: 7.5, font: fontRegular, color: MUTED,
    })
  } catch {
    /* QR ixtiyoriy */
  }

  // ── Date (bottom left) ──
  page.drawText('Berilgan sana', { x: 90, y: 110, size: 9, font: fontRegular, color: MUTED })
  page.drawText(formatDate(data.issuedAt), { x: 90, y: 92, size: 13, font: fontBold, color: DARK })
  page.drawLine({ start: { x: 90, y: 130 }, end: { x: 250, y: 130 }, thickness: 0.8, color: rgb(0.8, 0.88, 0.9) })

  // ── Serial + signature line (bottom center) ──
  center('MedAI Simulator', fontBold, 13, DARK, 92)
  center('Tibbiy ta\'lim platformasi', fontItalic, 9, MUTED, 76)
  page.drawText(`Seriya: ${data.serial}`, { x: 90, y: 60, size: 8, font: fontRegular, color: MUTED })

  // ── Gold seal (decorative, bottom center-left) ──
  page.drawCircle({ x: width / 2, y: 150, size: 26, borderColor: GOLD, borderWidth: 2 })
  page.drawCircle({ x: width / 2, y: 150, size: 20, borderColor: GOLD, borderWidth: 1 })
  center('MED', fontBold, 11, GOLD, 146)

  return pdf.save()
}
