import { Request, Response } from 'express'

/**
 * Speech-to-Text via Muxlisa AI (service.muxlisa.uz), Uzbek.
 *
 * Request: POST /api/stt (multipart, field `audio`)
 * Muxlisa: POST https://service.muxlisa.uz/api/v2/stt
 *          headers x-api-key, multipart body { audio }
 * Returns: { status: 'success', text }
 */
const MUXLISA_STT_URL = 'https://service.muxlisa.uz/api/v2/stt'

export const speechToText = async (req: Request, res: Response): Promise<void> => {
  try {
    const file = (req as Request & { file?: Express.Multer.File }).file
    if (!file || !file.buffer?.length) {
      res.status(400).json({ message: 'Audio fayl kiritilishi shart' })
      return
    }

    const apiKey = process.env.MUXLISA_API_KEY || ''
    if (!apiKey) {
      res.status(500).json({ message: 'STT API kaliti sozlanmagan' })
      return
    }

    const formData = new FormData()
    const blob = new Blob([file.buffer], { type: file.mimetype || 'audio/webm' })
    formData.append('audio', blob, file.originalname || 'recording.webm')

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    let response: globalThis.Response
    try {
      response = await fetch(MUXLISA_STT_URL, {
        method: 'POST',
        headers: { 'x-api-key': apiKey },
        body: formData,
        signal: controller.signal,
      })
    } catch (fetchErr: unknown) {
      clearTimeout(timeout)
      const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr)
      console.error('Muxlisa STT fetch failed:', msg)
      res.status(503).json({ message: 'STT serveriga ulanib bo\'lmadi. Tarmoqni tekshiring.' })
      return
    }
    clearTimeout(timeout)

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error('Muxlisa STT error:', response.status, errorText)
      res.status(response.status === 401 ? 401 : response.status === 402 ? 402 : 500).json({
        message: response.status === 401 ? 'STT API kaliti yaroqsiz'
          : response.status === 402 ? 'STT balans yetarli emas'
            : 'Nutqni matnga aylantirish xatosi',
      })
      return
    }

    const data = (await response.json().catch(() => null)) as Record<string, unknown> | null
    const transcript = (data?.text || data?.transcript || data?.result) as string | undefined
    if (typeof transcript === 'string') {
      res.json({ status: 'success', text: transcript })
      return
    }

    res.status(500).json({ message: 'Kutilmagan STT javobi' })
  } catch (error) {
    console.error('STT error:', error)
    res.status(500).json({ message: 'Nutqni matnga aylantirish xatosi' })
  }
}
