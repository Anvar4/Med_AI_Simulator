import { Request, Response } from 'express'

const AISHA_STT_URL = 'https://back.aisha.group/api/v1/stt/post/'

/**
 * Speech-to-Text via Aisha Group (Uzbek/Russian/English).
 *
 * The client uploads a short recorded audio blob (multipart field `audio`).
 * We forward it to Aisha's STT endpoint and return the transcript. Mirrors the
 * polling pattern of the TTS controller for async (202) responses.
 *
 * Supported languages: uz (default), ru, en — passed through to Aisha.
 */
const SUPPORTED_LANGS = new Set(['uz', 'ru', 'en'])

export const speechToText = async (req: Request, res: Response): Promise<void> => {
  try {
    const file = (req as Request & { file?: Express.Multer.File }).file
    if (!file || !file.buffer?.length) {
      res.status(400).json({ message: 'Audio fayl kiritilishi shart' })
      return
    }

    const langRaw = typeof req.body.language === 'string' ? req.body.language : 'uz'
    const language = SUPPORTED_LANGS.has(langRaw) ? langRaw : 'uz'

    const apiKey = process.env.AISHA_API_KEY || ''
    if (!apiKey) {
      res.status(500).json({ message: 'STT API kaliti sozlanmagan' })
      return
    }

    const formData = new FormData()
    const blob = new Blob([file.buffer], { type: file.mimetype || 'audio/webm' })
    formData.append('audio', blob, file.originalname || 'recording.webm')
    formData.append('language', language)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    let response: globalThis.Response
    try {
      response = await fetch(AISHA_STT_URL, {
        method: 'POST',
        headers: { 'x-api-key': apiKey },
        body: formData,
        signal: controller.signal,
      })
    } catch (fetchErr: unknown) {
      clearTimeout(timeout)
      const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr)
      console.error('Aisha STT fetch failed:', msg)
      res.status(503).json({ message: 'STT serveriga ulanib bo\'lmadi. Tarmoqni tekshiring.' })
      return
    }
    clearTimeout(timeout)

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error('Aisha STT error:', response.status, errorText)
      res.status(response.status === 402 ? 402 : 500).json({
        message: response.status === 402 ? 'STT balans yetarli emas' : 'Nutqni matnga aylantirish xatosi',
      })
      return
    }

    const data = (await response.json()) as Record<string, unknown>

    // Synchronous transcript field (name may vary across Aisha versions).
    const transcript = (data.text || data.transcript || data.result) as string | undefined
    if (typeof transcript === 'string' && transcript.length > 0) {
      res.json({ status: 'success', text: transcript })
      return
    }

    // Async (202): poll status by id.
    if (data.id) {
      const statusUrl = `https://back.aisha.group/api/v1/stt/status/${data.id}/`
      let attempts = 0
      while (attempts < 30) {
        await new Promise(r => setTimeout(r, 1000))
        const statusRes = await fetch(statusUrl, { headers: { 'x-api-key': apiKey } })
        if (statusRes.ok) {
          const sd = (await statusRes.json()) as Record<string, unknown>
          const t = (sd.text || sd.transcript || sd.result) as string | undefined
          if (typeof t === 'string' && t.length > 0) {
            res.json({ status: 'success', text: t })
            return
          }
          if (sd.status === 'FAILURE') {
            res.status(500).json({ message: 'Nutqni aniqlashda xatolik' })
            return
          }
        }
        attempts++
      }
      res.status(504).json({ message: 'STT javob kutish vaqti tugadi' })
      return
    }

    res.status(500).json({ message: 'Kutilmagan STT javobi' })
  } catch (error) {
    console.error('STT error:', error)
    res.status(500).json({ message: 'Nutqni matnga aylantirish xatosi' })
  }
}
