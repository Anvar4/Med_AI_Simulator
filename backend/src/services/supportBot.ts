import TelegramBot from 'node-telegram-bot-api'
import { SupportTicket } from '../models/SupportTicket'
import { User } from '../models/User'

/**
 * User-facing support bot (@Med_AI_Simulator_Supportbot).
 *
 * Features:
 *  - /start welcome with a reply keyboard (FAQ, new request, my requests).
 *  - FAQ: most-asked questions answered inline (no human needed).
 *  - New request: the user's next message is stored as a SupportTicket and
 *    forwarded to the admin chat. Linked to the site account by telegramId.
 *  - My requests: the user can see the status of their tickets.
 *
 * No-op when SUPPORT_BOT_TOKEN is not configured, so it is safe in any env.
 */

let bot: TelegramBot | null = null

// Per-chat conversation state (in-memory; fine for a single instance).
const awaitingMessage = new Set<string>()

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
• 📝 Murojaat yuborish — savol/muammo/taklif
• 📋 Mening murojaatlarim — holatini ko'rish
• ❓ Ko'p beriladigan savollar
• 📞 Aloqa

⏰ Ish vaqti: Dushanba–Shanba, 9:00–18:00`

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Pro obunani qanday faollashtiraman?',
    a: 'Saytda "Obuna va balans" sahifasiga kiring → balansingizni to\'ldiring (karta orqali, chek yuklang) → admin tasdiqlagach Pro obunani sotib oling.',
  },
  {
    q: 'Balansim to\'ldirilmadi, nima qilay?',
    a: 'To\'lov arizalari admin tomonidan 2–3 soat ichida tekshiriladi. Agar uzoq kutsangiz, chek rasmini shu yerga yuboring.',
  },
  {
    q: 'Bepul rejada qanday cheklovlar bor?',
    a: 'Bepul rejada: kuniga 1 ta klinik holat, AI chatga 5 ta savol, 3 ta 3D model. Cheksiz foydalanish uchun Pro obuna kerak.',
  },
  {
    q: 'Referal dasturi qanday ishlaydi?',
    a: 'Har bir taklif qilgan do\'stingiz ro\'yxatdan o\'tganda 1000 so\'m va 5 ball olasiz. Havolangizni "Do\'stlarni taklif qilish" sahifasidan oling.',
  },
  {
    q: 'Parolimni unutdim.',
    a: 'Kirish sahifasida "Parolni unutdingizmi?" tugmasini bosing va emailingizga yuborilgan kod orqali tiklang.',
  },
]

function faqKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: FAQ.map((f, i) => [{ text: f.q, callback_data: `faq:${i}` }]),
    },
  }
}

const STATUS_LABEL: Record<string, string> = {
  open: '🟡 Yangi',
  in_progress: '🔵 Ko\'rib chiqilmoqda',
  resolved: '🟢 Hal qilingan',
}

export function initSupportBot(): void {
  const token = process.env.SUPPORT_BOT_TOKEN
  if (!token) {
    console.log('Support bot: SUPPORT_BOT_TOKEN yo\'q — bot o\'chiq')
    return
  }

  bot = new TelegramBot(token, { polling: true })
  console.log('Support bot ishga tushdi (polling)')

  const forwardChatId = process.env.SUPPORT_FORWARD_CHAT_ID

  bot.onText(/^\/start/, (m) => {
    awaitingMessage.delete(String(m.chat.id))
    bot!.sendMessage(m.chat.id, WELCOME, MAIN_KEYBOARD)
  })

  bot.onText(/^\/help/, (m) => {
    bot!.sendMessage(m.chat.id, WELCOME, MAIN_KEYBOARD)
  })

  // FAQ inline answers.
  bot.on('callback_query', (q) => {
    const chatId = q.message?.chat.id
    const data = q.data || ''
    if (!chatId) return
    if (data.startsWith('faq:')) {
      const idx = Number(data.split(':')[1])
      const item = FAQ[idx]
      if (item) {
        bot!.answerCallbackQuery(q.id)
        bot!.sendMessage(chatId, `❓ ${item.q}\n\n${item.a}`)
      }
    }
  })

  bot.on('message', async (m) => {
    const chatId = String(m.chat.id)
    const text = (m.text || '').trim()
    if (!text || text.startsWith('/')) return

    // Button presses
    if (text === BTN.faq) {
      bot!.sendMessage(m.chat.id, '❓ Ko\'p beriladigan savollar — birini tanlang:', faqKeyboard())
      return
    }
    if (text === BTN.contact) {
      bot!.sendMessage(m.chat.id,
        '📞 Telefon: +998 97 640 20 04\n💬 Telegram: @KucharovAnvar\n📧 Email: support@medaisimulator.uz\n⏰ Ish vaqti: Du–Sha, 9:00–18:00')
      return
    }
    if (text === BTN.myRequests) {
      await sendMyTickets(m.chat.id, chatId)
      return
    }
    if (text === BTN.newRequest) {
      awaitingMessage.add(chatId)
      bot!.sendMessage(m.chat.id, '✍️ Murojaatingizni (savol, muammo yoki taklif) bitta xabarda yozib yuboring:')
      return
    }

    // If the user is composing a new request, store it as a ticket.
    if (awaitingMessage.has(chatId)) {
      awaitingMessage.delete(chatId)
      await createTicket(m, text, forwardChatId)
      return
    }

    // Any other free-form message also becomes a ticket (graceful default).
    await createTicket(m, text, forwardChatId)
  })

  bot.on('polling_error', (err) => {
    console.error('Support bot polling error:', err.message)
  })
}

async function createTicket(
  m: TelegramBot.Message,
  text: string,
  forwardChatId?: string
): Promise<void> {
  try {
    const telegramId = String(m.from?.id || m.chat.id)
    const telegramUsername = m.from?.username
    const telegramName = [m.from?.first_name, m.from?.last_name].filter(Boolean).join(' ') || undefined

    // Link to a site account if one has this telegram id.
    const linked = await User.findOne({ telegramId }).select('_id name email')

    const ticket = await SupportTicket.create({
      telegramId,
      telegramUsername,
      telegramName,
      chatId: String(m.chat.id),
      user: linked?._id,
      message: text,
      status: 'open',
    })

    bot!.sendMessage(m.chat.id,
      `✅ Murojaatingiz qabul qilindi!\n🆔 Raqami: #${ticket._id.toString().slice(-6)}\n\nTez orada javob beramiz. Holatini "📋 Mening murojaatlarim" orqali kuzating.`,
      MAIN_KEYBOARD)

    if (forwardChatId) {
      const who = telegramUsername ? `@${telegramUsername}` : (telegramName || `id:${telegramId}`)
      const acc = linked ? `\n🔗 Akkaunt: ${linked.name} (${linked.email})` : '\n🔗 Akkaunt: bog\'lanmagan'
      bot!.sendMessage(forwardChatId,
        `📩 Yangi murojaat #${ticket._id.toString().slice(-6)}\n👤 ${who}${acc}\n\n${text}`).catch(() => {})
    }
  } catch (err) {
    console.error('createTicket error:', err)
    bot!.sendMessage(m.chat.id, 'Kechirasiz, xatolik yuz berdi. Birozdan so\'ng qayta urinib ko\'ring.')
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
    const lastReply = t.replies.length ? `\n   💬 Javob: ${t.replies[t.replies.length - 1].text}` : ''
    return `#${id} · ${status} · ${date}\n   "${t.message.slice(0, 60)}${t.message.length > 60 ? '…' : ''}"${lastReply}`
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
