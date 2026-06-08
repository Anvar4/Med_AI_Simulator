import TelegramBot from 'node-telegram-bot-api'

/**
 * Single shared Telegram bot instance.
 *
 * Both the payment-approval logic and the user support logic attach their
 * handlers to THIS one bot, so the whole app uses a single token and a single
 * polling connection. Using one connection avoids Telegram's 409 Conflict
 * (which happens when the same token polls from two places).
 *
 * Token resolution (first non-empty wins):
 *   SUPPORT_BOT_TOKEN  → preferred (the @Med_AI_Simulator_Supportbot)
 *   TELEGRAM_BOT_TOKEN → fallback for older setups
 */

let bot: TelegramBot | null = null

export function getBotToken(): string | undefined {
  return process.env.SUPPORT_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || undefined
}

/** Create (once) and return the shared bot, or null if no token is configured. */
export function getBot(): TelegramBot | null {
  if (bot) return bot
  const token = getBotToken()
  if (!token) return null
  bot = new TelegramBot(token, { polling: true })
  bot.on('polling_error', (e) => console.error('Telegram polling error:', e.message))
  return bot
}
