import TelegramBot from 'node-telegram-bot-api'
import { BalanceTopUp } from '../models/BalanceTopUp'
import { TelegramAdmin } from '../models/TelegramAdmin'
import { User } from '../models/User'
import { approveTopUp, rejectTopUp } from './balanceService'

/**
 * Telegram bot for manual balance-top-up approval (polling mode).
 *
 * - Admins run /start; their telegram id is authorized via TELEGRAM_ADMIN_IDS
 *   (env) or the TelegramAdmin collection.
 * - When a user submits a top-up, admins receive the receipt + inline buttons.
 * - Approve credits the balance (idempotent). Reject asks for a reason, then
 *   marks the request rejected and notifies the user in-app.
 * - Every callback re-checks that the sender is an admin.
 */

let bot: TelegramBot | null = null
// Pending "awaiting reject reason" state, keyed by admin telegram chat id.
const awaitingReason = new Map<number, string>() // chatId -> topUpId

function envAdminIds(): string[] {
  return (process.env.TELEGRAM_ADMIN_IDS || '')
    .split(',').map(s => s.trim()).filter(Boolean)
}

async function isAdmin(telegramId: number | string): Promise<boolean> {
  const id = String(telegramId)
  if (envAdminIds().includes(id)) return true
  const rec = await TelegramAdmin.findOne({ telegramId: id, isActive: true })
  return !!rec
}

function adminChatIds(): string[] {
  // env ids are always notified; DB admins are added at runtime by getTargets()
  return envAdminIds()
}

async function getTargetChatIds(): Promise<string[]> {
  const dbAdmins = await TelegramAdmin.find({ isActive: true }).select('telegramId')
  const ids = new Set<string>([...adminChatIds(), ...dbAdmins.map(a => a.telegramId)])
  return [...ids]
}

const FRONT = () => process.env.ADMIN_PANEL_URL || 'http://localhost:3000/admin'

/** Build the admin notification text + inline keyboard for a top-up. */
async function buildTopUpMessage(topUpId: string) {
  const topUp = await BalanceTopUp.findById(topUpId)
    .populate('user', 'name email phone')
    .populate('card', 'cardNumber cardHolderName bankName')
  if (!topUp) return null

  const u = topUp.user as unknown as { _id: string; name?: string; email?: string; phone?: string }
  const c = topUp.card as unknown as { cardNumber?: string; cardHolderName?: string; bankName?: string }

  const text =
    `🆕 Yangi balans to'ldirish arizasi\n\n` +
    `🧾 Ariza ID: ${topUp._id}\n` +
    `👤 Foydalanuvchi: ${u?.name || '—'}\n` +
    `✉️ Email: ${u?.email || '—'}\n` +
    `📞 Tel: ${u?.phone || '—'}\n` +
    `💰 Summa: ${topUp.amount.toLocaleString()} so'm\n` +
    `💳 Karta: ${c?.cardNumber || '—'}\n` +
    `👨‍💼 Karta egasi: ${c?.cardHolderName || '—'}\n` +
    `🏦 Bank: ${c?.bankName || '—'}\n` +
    `🕒 Sana: ${topUp.createdAt.toLocaleString('uz')}\n` +
    `📌 Holat: Kutilmoqda`

  const secondRow: TelegramBot.InlineKeyboardButton[] = [
    { text: '👤 Foydalanuvchi', callback_data: `noop:${u?._id}` },
  ]
  // Telegram rejects non-public URLs (localhost) on inline buttons — only add
  // the "open in admin panel" link when ADMIN_PANEL_URL is a real https/public url.
  const panelUrl = FRONT()
  if (/^https?:\/\/(?!localhost|127\.0\.0\.1)/.test(panelUrl)) {
    secondRow.push({ text: '🧾 Admin panelda ochish', url: panelUrl })
  }

  const keyboard: TelegramBot.InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: '✅ Tasdiqlash', callback_data: `approve:${topUp._id}` },
        { text: '❌ Rad etish', callback_data: `reject:${topUp._id}` },
      ],
      secondRow,
    ],
  }
  return { text, keyboard, receiptUrl: topUp.receiptUrl }
}

/** Send a top-up request (with receipt) to all admins. */
async function sendTopUpToAdmins(topUpId: string): Promise<void> {
  if (!bot) return
  const msg = await buildTopUpMessage(topUpId)
  if (!msg) return
  // Resolve the receipt to something Telegram can actually fetch/upload.
  // Local uploads (/uploads/..) aren't reachable by Telegram's servers, so we
  // upload the file from disk as a Buffer. Remote http(s) urls are passed through.
  const receiptPhoto = await resolveReceiptPhoto(msg.receiptUrl)

  const targets = await getTargetChatIds()
  for (const chatId of targets) {
    let sent: TelegramBot.Message | null = null
    // 1) Try to attach the receipt as a photo with the caption.
    if (receiptPhoto) {
      try {
        sent = await bot.sendPhoto(chatId, receiptPhoto, { caption: msg.text, reply_markup: msg.keyboard })
      } catch { sent = null }
    }
    // 2) Fallback: plain text message (with a receipt link if remote).
    if (!sent) {
      const linkLine = msg.receiptUrl.startsWith('http') ? `\n\n📎 Chek: ${msg.receiptUrl}` : ''
      try {
        sent = await bot.sendMessage(chatId, msg.text + linkLine, { reply_markup: msg.keyboard })
      } catch (e) {
        console.error('Telegram sendMessage failed:', (e as Error).message)
      }
    }
    if (sent) await BalanceTopUp.findByIdAndUpdate(topUpId, { telegramMessageId: sent.message_id })
  }
}

/** Return a value Telegram can send as a photo, or null if not an image. */
async function resolveReceiptPhoto(receiptUrl: string): Promise<string | Buffer | null> {
  const isImage = /\.(png|jpe?g|webp|gif)$/i.test(receiptUrl)
  if (!isImage) return null
  if (receiptUrl.startsWith('http')) return receiptUrl
  // Local upload: read the file from disk and send the buffer.
  try {
    const fs = await import('fs')
    const path = await import('path')
    const rel = receiptUrl.replace(/^\/+/, '') // uploads/xxx.png
    const candidates = [
      path.join(process.cwd(), 'public', rel),
      path.join(process.cwd(), '..', 'public', rel),
      path.join('/tmp', rel),
    ]
    for (const p of candidates) {
      if (fs.existsSync(p)) return fs.readFileSync(p)
    }
  } catch { /* fall through */ }
  return null
}

/** Send a plain message to a single user by telegram id (best-effort). */
async function sendToUser(telegramId: string, text: string): Promise<void> {
  if (!bot || !telegramId) return
  try { await bot.sendMessage(telegramId, text) } catch { /* ignore */ }
}

async function notifyUserDecisionInTelegram(userId: string, text: string) {
  const user = await User.findById(userId).select('telegramId')
  if (user?.telegramId) await sendToUser(user.telegramId, text)
}

/** Initialize the bot in polling mode. No-op when no token is configured. */
export function initTelegramBot(): void {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    console.log('Telegram bot: TELEGRAM_BOT_TOKEN yo\'q — bot o\'chiq')
    return
  }
  bot = new TelegramBot(token, { polling: true })
  console.log('Telegram bot ishga tushdi (polling)')

  bot.onText(/^\/start/, async (m) => {
    const chatId = m.chat.id
    if (await isAdmin(chatId)) {
      // Register/refresh the admin record.
      await TelegramAdmin.findOneAndUpdate(
        { telegramId: String(chatId) },
        { telegramId: String(chatId), username: m.from?.username, fullName: [m.from?.first_name, m.from?.last_name].filter(Boolean).join(' '), isActive: true },
        { upsert: true }
      )
      bot!.sendMessage(chatId, '✅ Admin sifatida tan olindingiz. Yangi to\'lov arizalari shu yerga keladi.')
    } else {
      bot!.sendMessage(chatId, 'Salom! Bu Med AI Simulator to\'lov boti. Bu bot faqat adminlar uchun.')
    }
  })

  // Inline button presses.
  bot.on('callback_query', async (q) => {
    const chatId = q.message?.chat.id
    const data = q.data || ''
    if (!chatId) return

    if (!(await isAdmin(chatId))) {
      bot!.answerCallbackQuery(q.id, { text: 'Faqat adminlar uchun', show_alert: true })
      return
    }

    const [action, id] = data.split(':')
    if (action === 'noop') { bot!.answerCallbackQuery(q.id); return }

    if (action === 'approve') {
      const res = await approveTopUp(id, { telegramId: String(chatId) })
      if (res.ok) {
        bot!.answerCallbackQuery(q.id, { text: '✅ Tasdiqlandi, balans to\'ldirildi' })
        if (q.message) bot!.editMessageReplyMarkup({ inline_keyboard: [[{ text: `✅ Tasdiqlangan (${res.amount?.toLocaleString()} so'm)`, callback_data: 'noop:done' }]] }, { chat_id: chatId, message_id: q.message.message_id }).catch(() => {})
        if (res.userId) notifyUserDecisionInTelegram(res.userId, `✅ Balansingiz ${res.amount?.toLocaleString()} so'mga to'ldirildi.`).catch(() => {})
      } else {
        bot!.answerCallbackQuery(q.id, { text: reasonText(res.reason), show_alert: true })
      }
      return
    }

    if (action === 'reject') {
      awaitingReason.set(chatId, id)
      bot!.answerCallbackQuery(q.id)
      bot!.sendMessage(chatId, '❌ Rad etish sababini yozing (keyingi xabar):')
      return
    }
  })

  // Capture the reject reason as the admin's next message.
  bot.on('message', async (m) => {
    const chatId = m.chat.id
    const topUpId = awaitingReason.get(chatId)
    if (!topUpId || !m.text || m.text.startsWith('/')) return
    awaitingReason.delete(chatId)
    if (!(await isAdmin(chatId))) return

    const res = await rejectTopUp(topUpId, m.text.trim(), { telegramId: String(chatId) })
    if (res.ok) {
      bot!.sendMessage(chatId, '❌ Ariza rad etildi. Foydalanuvchiga xabar berildi.')
      if (res.userId) notifyUserDecisionInTelegram(res.userId, `❌ To'lovingiz rad etildi. Sabab: ${m.text.trim()}`).catch(() => {})
    } else {
      bot!.sendMessage(chatId, reasonText(res.reason))
    }
  })

  bot.on('polling_error', (e) => console.error('Telegram polling error:', e.message))
}

function reasonText(reason?: string): string {
  switch (reason) {
    case 'already_approved': return 'Bu ariza allaqachon tasdiqlangan'
    case 'already_rejected': return 'Bu ariza allaqachon rad etilgan'
    case 'not_found': return 'Ariza topilmadi'
    default: return 'Amalni bajarib bo\'lmadi'
  }
}

// ─── Public API used by other modules ──────────────────────────
export function notifyAdminsOfTopUp(topUpId: string): Promise<void> {
  return sendTopUpToAdmins(topUpId)
}
export function notifyUserViaTelegram(telegramId: string, text: string): Promise<void> {
  return sendToUser(telegramId, text)
}
