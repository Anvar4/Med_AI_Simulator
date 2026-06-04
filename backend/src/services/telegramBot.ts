/**
 * Telegram bot service (stub — wired up fully in step 3).
 * Exposes the functions other modules call so they can be imported now without
 * the bot being initialized yet. When TELEGRAM_BOT_TOKEN is set and the bot is
 * started, these become real Telegram operations.
 */

// Replaced by the real implementation in initTelegramBot().
let _notifyAdminsOfTopUp: (topUpId: string) => Promise<void> = async () => {}
let _notifyUserDecision: (telegramId: string, text: string) => Promise<void> = async () => {}

export function notifyAdminsOfTopUp(topUpId: string): Promise<void> {
  return _notifyAdminsOfTopUp(topUpId)
}
export function notifyUserViaTelegram(telegramId: string, text: string): Promise<void> {
  return _notifyUserDecision(telegramId, text)
}

export function _registerTelegramSenders(
  notifyAdmins: (topUpId: string) => Promise<void>,
  notifyUser: (telegramId: string, text: string) => Promise<void>
) {
  _notifyAdminsOfTopUp = notifyAdmins
  _notifyUserDecision = notifyUser
}
