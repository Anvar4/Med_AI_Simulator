import TelegramBot from 'node-telegram-bot-api'
import { ITicketAttachment, SupportTicket } from '../models/SupportTicket'
import { User } from '../models/User'
import { getBot, getBotToken } from './botInstance'
import { isAwaitingRejectReason } from './telegramBot'

/**
 * User-facing support bot (@Med_AI_Simulator_Supportbot).
 *
 * Users:
 *  - /start welcome with a reply keyboard (FAQ, new request, my requests).
 *  - FAQ answered inline; new requests stored as SupportTickets.
 *  - Text AND photos/documents (receipts) are accepted as a request.
 *
 * Admins (SUPPORT_FORWARD_CHAT_ID, comma-separated for multiple):
 *  - Receive each new ticket with a "Reply" inline button.
 *  - Pressing Reply opens an admin-only reply flow: the admin's next message is
 *    delivered straight to the requester via the bot.
 *
 * No-op when SUPPORT_BOT_TOKEN is not configured.
 */

let bot: TelegramBot | null = null

// Per-chat conversation state (in-memory; fine for a single instance).
const awaitingMessage = new Set<string>()           // users composing a new ticket
const adminReplyTo = new Map<string, string>()        // adminChatId -> ticketId being replied to

function adminIds(): string[] {
  return (process.env.SUPPORT_FORWARD_CHAT_ID || '')
    .split(',').map(s => s.trim()).filter(Boolean)
}
function isAdminChat(chatId: string | number): boolean {
  return adminIds().includes(String(chatId))
}
function primaryAdminId(): string | undefined {
  return adminIds()[0]
}

const BTN = {
  newRequest: '📝 Murojaat yuborish',
  myRequests: '📋 Mening murojaatlarim',
  faq: '❓ Ko\'p beriladigan savollar',
  contact: '📞 Aloqa',
}

const MAIN_KEYBOARD = {
  reply_markup: {
    keyboard: [
      [{ text: BTN.newRequest }],
      [{ text: BTN.myRequests }, { text: BTN.faq }],
      [{ text: BTN.contact }],
    ],
    resize_keyboard: true,
  },
}

const WELCOME = `👋 Med AI Simulator qo'llab-quvvatlash xizmatiga xush kelibsiz!

Quyidagi tugmalardan foydalaning:
• 📝 Murojaat yuborish — savol/muammo/taklif (rasm ham yuborishingiz mumkin)
• 📋 Mening murojaatlarim — holatini ko'rish
• ❓ Ko'p beriladigan savollar
• 📞 Aloqa

⏰ Ish vaqti: Dushanba–Shanba, 9:00–18:00`

const FAQ: { q: string; a: string }[] = [
  { q: 'Pro obunani qanday faollashtiraman?', a: 'Saytda "Obuna va balans" sahifasiga kiring → balansingizni to\'ldiring (karta orqali, chek yuklang) → admin tasdiqlagach Pro obunani sotib oling.' },
  { q: 'Balansim to\'ldirilmadi, nima qilay?', a: 'To\'lov arizalari admin tomonidan 2–3 soat ichida tekshiriladi. Agar uzoq kutsangiz, chek rasmini shu yerga yuboring.' },
  { q: 'Bepul rejada qanday cheklovlar bor?', a: 'Bepul rejada: kuniga 1 ta klinik holat, AI chatga 5 ta savol, 3 ta 3D model. Cheksiz foydalanish uchun Pro obuna kerak.' },
  { q: 'Referal dasturi qanday ishlaydi?', a: 'Har bir taklif qilgan do\'stingiz ro\'yxatdan o\'tganda 1000 so\'m va 5 ball olasiz. Havolangizni "Do\'stlarni taklif qilish" sahifasidan oling.' },
  { q: 'Parolimni unutdim.', a: 'Kirish sahifasida "Parolni unutdingizmi?" tugmasini bosing va emailingizga yuborilgan kod orqali tiklang.' },
]

function faqKeyboard() {
  return { reply_markup: { inline_keyboard: FAQ.map((f, i) => [{ text: f.q, callback_data: `faq:${i}` }]) } }
}

const STATUS_LABEL: Record<string, string> = {
  open: '🟡 Yangi',
  in_progress: '🔵 Ko\'rib chiqilmoqda',
  resolved: '🟢 Hal qilingan',
}

export function initSupportBot(): void {
  const shared = getBot()
  if (!shared) {
    console.log('Support bot: token yo\'q — bot o\'chiq')
    return
  }

  bot = shared
  console.log('Support bot ulandi (umumiy instans)')

  bot.onText(/^\/start/, (m) => {
    const chatId = String(m.chat.id)
    awaitingMessage.delete(chatId)
    adminReplyTo.delete(chatId)
    const extra = isAdminChat(chatId)
      ? '\n\n🛡 Siz admin sifatida tan olindingiz. Yangi murojaatlar shu yerga keladi.'
      : ''
    bot!.sendMessage(m.chat.id, WELCOME + extra, MAIN_KEYBOARD)
  })

  bot.onText(/^\/help/, (m) => bot!.sendMessage(m.chat.id, WELCOME, MAIN_KEYBOARD))

  // Inline buttons: FAQ answers + admin "Reply".
  bot.on('callback_query', async (q) => {
    const chatId = q.message?.chat.id
    const data = q.data || ''
    if (!chatId) return

    if (data.startsWith('faq:')) {
      const item = FAQ[Number(data.split(':')[1])]
      if (item) { bot!.answerCallbackQuery(q.id); bot!.sendMessage(chatId, `❓ ${item.q}\n\n${item.a}`) }
      return
    }

    // Admin presses "Reply" under a forwarded ticket.
    if (data.startsWith('reply:')) {
      if (!isAdminChat(chatId)) { bot!.answerCallbackQuery(q.id, { text: 'Faqat admin uchun', show_alert: true }); return }
      const ticketId = data.split(':')[1]
      adminReplyTo.set(String(chatId), ticketId)
      bot!.answerCallbackQuery(q.id)
      bot!.sendMessage(chatId, `✍️ #${ticketId.slice(-6)} murojaatiga javobingizni yozing (matn yoki rasm). Bekor qilish: /cancel`)
      return
    }

    // Admin marks a ticket resolved from the chat.
    if (data.startsWith('resolve:')) {
      if (!isAdminChat(chatId)) { bot!.answerCallbackQuery(q.id, { text: 'Faqat admin uchun', show_alert: true }); return }
      const ticketId = data.split(':')[1]
      await SupportTicket.findByIdAndUpdate(ticketId, { status: 'resolved', resolvedAt: new Date() })
      bot!.answerCallbackQuery(q.id, { text: 'Hal qilindi deb belgilandi' })
      bot!.sendMessage(chatId, `🟢 #${ticketId.slice(-6)} hal qilingan deb belgilandi.`)
      return
    }
  })

  bot.onText(/^\/cancel/, (m) => {
    const chatId = String(m.chat.id)
    awaitingMessage.delete(chatId)
    adminReplyTo.delete(chatId)
    bot!.sendMessage(m.chat.id, 'Bekor qilindi.', MAIN_KEYBOARD)
  })

  // Single message handler covers text, photos and documents.
  bot.on('message', async (m) => {
    const chatId = String(m.chat.id)
    const text = (m.text || '').trim()

    // Ignore commands here (handled by onText above).
    if (text.startsWith('/')) return

    // The payment bot is waiting for this admin to type a rejection reason —
    // let it handle that message; the support bot must not intercept it.
    if (isAwaitingRejectReason(chatId)) return

    // ── Admin reply flow ──
    if (adminReplyTo.has(chatId) && isAdminChat(chatId)) {
      const ticketId = adminReplyTo.get(chatId)!
      adminReplyTo.delete(chatId)
      await deliverAdminReply(ticketId, m, chatId)
      return
    }

    // Don't let an admin's normal chatter create tickets.
    if (isAdminChat(chatId) && !awaitingMessage.has(chatId)) {
      // Admin typed something without pressing Reply — show a hint, no ticket.
      if (text && !Object.values(BTN).includes(text)) {
        bot!.sendMessage(m.chat.id, 'Javob berish uchun murojaat ostidagi "✍️ Javob berish" tugmasini bosing.')
        return
      }
    }

    // ── User button presses ──
    if (text === BTN.faq) { bot!.sendMessage(m.chat.id, '❓ Birini tanlang:', faqKeyboard()); return }
    if (text === BTN.contact) {
      bot!.sendMessage(m.chat.id, '💬 Telegram: @AnvarKucharov\n📧 Email: support@medaisimulator.uz\n⏰ Ish vaqti: Du–Sha, 9:00–18:00')
      return
    }
    if (text === BTN.myRequests) { await sendMyTickets(m.chat.id, chatId); return }
    if (text === BTN.newRequest) {
      awaitingMessage.add(chatId)
      bot!.sendMessage(m.chat.id, '✍️ Murojaatingizni yozing (matn yoki rasm/chek yuborishingiz mumkin):')
      return
    }

    // ── Create a ticket from text and/or attachment ──
    const attachment = extractAttachment(m)
    if (!text && !attachment && !m.caption) return // nothing usable
    awaitingMessage.delete(chatId)
    await createTicket(m, text || m.caption || '', attachment)
  })

  bot.on('polling_error', (err) => console.error('Support bot polling error:', err.message))
}

/** Pull a photo or document out of a Telegram message, if present. */
function extractAttachment(m: TelegramBot.Message): ITicketAttachment | null {
  if (m.photo && m.photo.length > 0) {
    const largest = m.photo[m.photo.length - 1]
    return { type: 'photo', fileId: largest.file_id, caption: m.caption }
  }
  if (m.document) {
    return { type: 'document', fileId: m.document.file_id, fileName: m.document.file_name, caption: m.caption }
  }
  return null
}

async function createTicket(
  m: TelegramBot.Message,
  text: string,
  attachment: ITicketAttachment | null
): Promise<void> {
  try {
    const telegramId = String(m.from?.id || m.chat.id)
    const telegramUsername = m.from?.username
    const telegramName = [m.from?.first_name, m.from?.last_name].filter(Boolean).join(' ') || undefined

    const linked = await User.findOne({ telegramId }).select('_id name email')

    const ticket = await SupportTicket.create({
      telegramId,
      telegramUsername,
      telegramName,
      chatId: String(m.chat.id),
      user: linked?._id,
      message: text,
      attachments: attachment ? [attachment] : [],
      status: 'open',
    })

    const idShort = ticket._id.toString().slice(-6)
    bot!.sendMessage(m.chat.id,
      `✅ Murojaatingiz qabul qilindi!\n🆔 Raqami: #${idShort}\n\nTez orada javob beramiz. Holatini "📋 Mening murojaatlarim" orqali kuzating.`,
      MAIN_KEYBOARD)

    // Forward to every admin, with a Reply button.
    const who = telegramUsername ? `@${telegramUsername}` : (telegramName || `id:${telegramId}`)
    const acc = linked ? `\n🔗 Akkaunt: ${linked.name} (${linked.email})` : '\n🔗 Akkaunt: bog\'lanmagan'
    const header = `📩 Yangi murojaat #${idShort}\n👤 ${who}${acc}\n\n${text || '(matnsiz)'}`
    const markup = {
      reply_markup: {
        inline_keyboard: [[
          { text: '✍️ Javob berish', callback_data: `reply:${ticket._id}` },
          { text: '🟢 Hal qilindi', callback_data: `resolve:${ticket._id}` },
        ]],
      },
    }

    for (const adminId of adminIds()) {
      try {
        if (attachment?.type === 'photo') {
          await bot!.sendPhoto(adminId, attachment.fileId, { caption: header, ...markup })
        } else if (attachment?.type === 'document') {
          await bot!.sendDocument(adminId, attachment.fileId, { caption: header, ...markup })
        } else {
          await bot!.sendMessage(adminId, header, markup)
        }
      } catch { /* one admin failing must not block others */ }
    }
  } catch (err) {
    console.error('createTicket error:', err)
    bot!.sendMessage(m.chat.id, 'Kechirasiz, xatolik yuz berdi. Birozdan so\'ng qayta urinib ko\'ring.')
  }
}

/** Deliver an admin's reply (text or attachment) to the ticket's requester. */
async function deliverAdminReply(ticketId: string, m: TelegramBot.Message, adminChatId: string): Promise<void> {
  const ticket = await SupportTicket.findById(ticketId)
  if (!ticket) { bot!.sendMessage(adminChatId, 'Murojaat topilmadi.'); return }

  const text = (m.text || m.caption || '').trim()
  const attachment = extractAttachment(m)

  try {
    const prefix = '💬 Qo\'llab-quvvatlash javobi:\n\n'
    if (attachment?.type === 'photo') {
      await bot!.sendPhoto(ticket.chatId, attachment.fileId, { caption: prefix + (text || '') })
    } else if (attachment?.type === 'document') {
      await bot!.sendDocument(ticket.chatId, attachment.fileId, { caption: prefix + (text || '') })
    } else {
      await bot!.sendMessage(ticket.chatId, prefix + text)
    }

    ticket.replies.push({ fromAdmin: true, text: text || '(rasm/fayl)', createdAt: new Date() })
    if (ticket.status === 'open') ticket.status = 'in_progress'
    await ticket.save()

    bot!.sendMessage(adminChatId, `✅ Javob #${ticketId.slice(-6)} foydalanuvchiga yetkazildi.`)
  } catch (err) {
    console.error('deliverAdminReply error:', err)
    bot!.sendMessage(adminChatId, '❌ Javobni yetkazib bo\'lmadi (foydalanuvchi botni bloklagan bo\'lishi mumkin).')
  }
}

async function sendMyTickets(chatId: number, telegramChatId: string): Promise<void> {
  const tickets = await SupportTicket.find({ chatId: telegramChatId }).sort({ createdAt: -1 }).limit(10)
  if (tickets.length === 0) {
    bot!.sendMessage(chatId, 'Sizda hali murojaatlar yo\'q. "📝 Murojaat yuborish" orqali yangi murojaat yuboring.')
    return
  }
  const lines = tickets.map(t => {
    const id = t._id.toString().slice(-6)
    const status = STATUS_LABEL[t.status] || t.status
    const date = new Date(t.createdAt).toLocaleDateString('uz')
    const body = t.message || (t.attachments.length ? '(rasm/fayl)' : '')
    const lastReply = t.replies.length ? `\n   💬 Javob: ${t.replies[t.replies.length - 1].text}` : ''
    return `#${id} · ${status} · ${date}\n   "${body.slice(0, 60)}${body.length > 60 ? '…' : ''}"${lastReply}`
  })
  bot!.sendMessage(chatId, '📋 Sizning murojaatlaringiz:\n\n' + lines.join('\n\n'))
}

/**
 * Send an admin reply to the user via the bot (called from the admin panel).
 * Returns true if delivered.
 */
export async function sendSupportReply(chatId: string, text: string): Promise<boolean> {
  if (!bot) return false
  try {
    await bot.sendMessage(chatId, `💬 Qo'llab-quvvatlash javobi:\n\n${text}`)
    return true
  } catch (err) {
    console.error('sendSupportReply error:', err)
    return false
  }
}

/** Build a temporary public URL for a Telegram file (used by the admin panel to show images). */
export async function getTelegramFileUrl(fileId: string): Promise<string | null> {
  const token = getBotToken()
  if (!bot || !token) return null
  try {
    const file = await bot.getFile(fileId)
    return `https://api.telegram.org/file/bot${token}/${file.file_path}`
  } catch {
    return null
  }
}
