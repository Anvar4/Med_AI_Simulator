import nodemailer from 'nodemailer'

function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
}

function getSubject(type: string): string {
  switch (type) {
    case 'register': return 'Med AI Simulator — Email tasdiqlash kodi'
    case 'password-reset': return 'Med AI Simulator — Parolni tiklash kodi'
    case 'password-change': return 'Med AI Simulator — Parol o\'zgartirish tasdiqlash'
    case 'email-change': return 'Med AI Simulator — Email o\'zgartirish tasdiqlash'
    case 'username-change': return 'Med AI Simulator — Login o\'zgartirish tasdiqlash'
    default: return 'Med AI Simulator — Tasdiqlash kodi'
  }
}

function getTitle(type: string): string {
  switch (type) {
    case 'register': return "Emailingizni tasdiqlang"
    case 'password-reset': return "Parolni tiklash"
    case 'password-change': return "Parol o'zgartirish"
    case 'email-change': return "Email o'zgartirish"
    case 'username-change': return "Login o'zgartirish"
    default: return "Tasdiqlash kodi"
  }
}

function getMessage(type: string): string {
  switch (type) {
    case 'register':
      return "Quyidagi 6 raqamli kodni kiriting va ro'yxatdan o'tishni yakunlang."
    case 'password-reset':
      return "Parolni tiklash uchun quyidagi kodni kiriting. Agar siz bu so'rovni yubormagan bo'lsangiz, ushbu xatni e'tiborsiz qoldiring."
    case 'password-change':
      return "Parolingizni o'zgartirish so'rovi qabul qilindi. Quyidagi kodni tasdiqlash uchun kiriting."
    case 'email-change':
      return "Email manzilingizni o'zgartirish so'rovi qabul qilindi. Quyidagi kodni tasdiqlash uchun kiriting."
    case 'username-change':
      return "Loginizni o'zgartirish so'rovi qabul qilindi. Quyidagi kodni tasdiqlash uchun kiriting."
    default:
      return "Tasdiqlash kodi:"
  }
}

function buildHtml(code: string, type: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0d1117;font-family:'Segoe UI',sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#161b22; overflow:hidden;border:1px solid #21262d;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#00C9A7,#10b981);padding:32px;text-align:center;">
      <div style="display:inline-flex;align-items:center;gap:10px;margin-bottom:8px;">
        <div style="width:40px;height:40px;background:rgba(255,255,255,0.2);border-radius:10px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;">🏥</div>
        <span style="color:white;font-size:20px;font-weight:700;letter-spacing:-0.3px;">Med AI Simulator</span>
      </div>
      <h1 style="color:white;margin:8px 0 0;font-size:22px;font-weight:600;">${getTitle(type)}</h1>
    </div>
    <!-- Body -->
    <div style="padding:32px;">
      <p style="color:#8b949e;font-size:15px;line-height:1.6;margin:0 0 28px;">${getMessage(type)}</p>
      <!-- OTP Code -->
      <div style="background:#0d1117;border:1px solid #30363d;border-radius:12px;padding:24px;text-align:center;margin:0 0 28px;">
        <p style="color:#8b949e;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;">Tasdiqlash kodi</p>
        <div style="font-size:30px;font-weight:800;letter-spacing:10px;color:#00C9A7;font-family:monospace;">${code}</div>
        <p style="color:#8b949e;font-size:12px;margin:12px 0 0;">Ushbu kod <strong style="color:#f0f6fc;">10 daqiqa</strong> davomida amal qiladi</p>
      </div>
      <p style="color:#8b949e;font-size:13px;margin:0;padding-top:20px;border-top:1px solid #21262d;">
        Agar siz ushbu so'rovni yubormagan bo'lsangiz, ushbu xatni e'tiborsiz qoldiring.
      </p>
    </div>
    <!-- Footer -->
    <div style="padding:16px 32px;background:#0d1117;text-align:center;">
      <p style="color:#484f58;font-size:12px;margin:0;">
        © 2026 Med AI Simulator · <a href="https://med-ai-simulator.vercel.app" style="color:#00C9A7;text-decoration:none;">med-ai-simulator.vercel.app</a>
      </p>
    </div>
  </div>
</body>
</html>`
}

export async function sendOTPEmail(to: string, code: string, type: string): Promise<void> {
  const transporter = createTransporter()
  await transporter.sendMail({
    from: `"Med AI Simulator" <${process.env.GMAIL_USER}>`,
    to,
    subject: getSubject(type),
    html: buildHtml(code, type),
  })
}
