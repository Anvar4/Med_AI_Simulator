import { Response } from 'express'
import OpenAI from 'openai'
import { AuthRequest } from '../middleware/auth'
import { CaseAttempt } from '../models/CaseAttempt'
import { User } from '../models/User'

let _openai: OpenAI | null = null
const getOpenAI = () => {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return _openai
}

const SYSTEM_PROMPT = `Siz Med AI Simulator platformasining tibbiy maslahat assistantsisiz.

QOIDALAR:
- Faqat tibbiyot, sog'liqni saqlash, klinik amaliyot va tibbiy ta'lim mavzularida javob bering.
- Tibbiyotga aloqasi bo'lmagan savollarga: "Kechirasiz, men faqat tibbiyot va sog'liqni saqlash masalalari bo'yicha yordam bera olaman." deb javob bering.
- O'z texnik tafsilotlaringizni (qaysi model, qaysi platforma ichki ma'lumotlari) oshkor qilmang.
- Javoblar o'zbek tilida bo'lsin.
- Tibbiy maslahat bering, lekin "shifokorga murojaat qiling" eslatmasini ham qo'shing.
- Qisqa va aniq javob bering.`

const FREE_CHAT_LIMIT = 5

/**
 * Enforce a per-day chat limit for free (non-premium) users. Returns true if the
 * request may proceed, false if the limit is reached (response already sent).
 * Increments the counter on success.
 */
async function checkChatLimit(req: AuthRequest, res: Response): Promise<boolean> {
  const user = req.user!
  if (user.isPremium || user.role === 'admin' || user.role === 'instructor') return true
  const today = new Date().toISOString().slice(0, 10)
  const usage = user.chatUsage && user.chatUsage.date === today ? user.chatUsage : { date: today, count: 0 }
  if (usage.count >= FREE_CHAT_LIMIT) {
    res.status(403).json({
      message: `Bepul rejada kuniga ${FREE_CHAT_LIMIT} ta savol berish mumkin. Cheksiz uchun Pro obunani faollashtiring.`,
      chatLimitReached: true,
      premiumRequired: true,
    })
    return false
  }
  await User.findByIdAndUpdate(user._id, { chatUsage: { date: today, count: usage.count + 1 } })
  return true
}

// ─── General floating chatbot ──────────────────────────────────
export const chatMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { messages } = req.body as {
      messages: { role: 'user' | 'assistant'; content: string }[]
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ message: 'Xabarlar kerak' })
      return
    }

    if (!(await checkChatLimit(req, res))) return

    const completion = await getOpenAI().chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.slice(-10), // last 10 messages for context
      ],
      temperature: 0.5,
      max_tokens: 500,
    })

    const reply = completion.choices[0]?.message?.content?.trim() || 'Javob olinmadi'
    res.json({ status: 'success', reply })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

// ─── Analysis page AI chat (uses user stats context) ──────────
export const analysisChatMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { messages } = req.body as {
      messages: { role: 'user' | 'assistant'; content: string }[]
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ message: 'Xabarlar kerak' })
      return
    }

    if (!(await checkChatLimit(req, res))) return

    // Gather user stats for context
    const userId = req.user!._id
    const attempts = await CaseAttempt.find({ user: userId, status: 'completed' })
      .populate('case', 'title category difficulty')
      .sort({ completedAt: -1 })
      .limit(20)

    const totalAttempts = attempts.length
    const avgScore = totalAttempts
      ? Math.round(attempts.reduce((s, a) => s + (a.score || 0), 0) / totalAttempts)
      : 0

    const categoryMap: Record<string, { scores: number[]; count: number }> = {}
    for (const a of attempts) {
      const cat = (a.case as { category?: string } | null)?.category || 'Noma\'lum'
      if (!categoryMap[cat]) categoryMap[cat] = { scores: [], count: 0 }
      categoryMap[cat].scores.push(a.score || 0)
      categoryMap[cat].count++
    }

    const categoryStats = Object.entries(categoryMap)
      .map(([cat, d]) => ({
        category: cat,
        avgScore: Math.round(d.scores.reduce((s, v) => s + v, 0) / d.scores.length),
        count: d.count,
      }))
      .sort((a, b) => b.avgScore - a.avgScore)

    const statsContext = totalAttempts === 0
      ? 'Foydalanuvchi hali hech qanday klinik holat yechmagan.'
      : `Foydalanuvchi statistikasi:
- Jami yechilgan klinik holatlar: ${totalAttempts}
- O'rtacha ball: ${avgScore}%
- Kategoriyalar bo'yicha:
${categoryStats.map(c => `  * ${c.category}: ${c.avgScore}% o'rtacha ball (${c.count} ta urinish)`).join('\n')}`

    const analysisSystemPrompt = `${SYSTEM_PROMPT}

Qo'shimcha: Siz shu foydalanuvchining haftalik tahlilini bilasiz va uni yaxshilashga yordam berasiz:
${statsContext}

Foydalanuvchi o'z natijalarini yaxshilash, zaif tomonlarini mustahkamlash va tibbiy bilimlarini kengaytirish haqida savol berishi mumkin.`

    const completion = await getOpenAI().chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: analysisSystemPrompt },
        ...messages.slice(-10),
      ],
      temperature: 0.5,
      max_tokens: 600,
    })

    const reply = completion.choices[0]?.message?.content?.trim() || 'Javob olinmadi'
    res.json({ status: 'success', reply })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}
