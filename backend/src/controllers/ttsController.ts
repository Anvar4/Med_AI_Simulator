import { Request, Response } from 'express';

const AISHA_API_URL = 'https://back.aisha.group/api/v1/tts/post/'

export const textToSpeech = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, model } = req.body

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      res.status(400).json({ message: 'Matn kiritilishi shart' })
      return
    }

    if (text.length > 5000) {
      res.status(400).json({ message: 'Matn juda uzun (maksimum 5000 belgi)' })
      return
    }

    const apiKey = process.env.AISHA_API_KEY || ''
    if (!apiKey) {
      res.status(500).json({ message: 'TTS API kaliti sozlanmagan' })
      return
    }

    const formData = new FormData()
    formData.append('transcript', text.trim())
    formData.append('language', 'uz')
    formData.append('model', model === 'jaxongir' ? 'jaxongir' : 'gulnoza')

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    let response: globalThis.Response
    try {
      response = await fetch(AISHA_API_URL, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
        },
        body: formData,
        signal: controller.signal,
      })
    } catch (fetchErr: unknown) {
      clearTimeout(timeout)
      const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr)
      console.error('Aisha TTS fetch failed:', msg)
      res.status(503).json({ message: 'TTS serveriga ulanib bo\'lmadi. Tarmoqni tekshiring.' })
      return
    }
    clearTimeout(timeout)

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error('Aisha TTS error:', response.status, response.statusText, errorText)
      res.status(response.status === 402 ? 402 : 500).json({
        message: response.status === 402
          ? 'TTS balans yetarli emas'
          : 'Ovozli sintez xatosi',
      })
      return
    }

    const data = await response.json() as Record<string, unknown>

    if (data.audio_path) {
      res.json({ audioUrl: data.audio_path })
      return
    }

    // Async response (202) — poll for status
    if (data.id && data.task_id) {
      const statusUrl = `https://back.aisha.group/api/v1/tts/status/${data.id}/`
      let attempts = 0
      const maxAttempts = 30

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        const statusRes = await fetch(statusUrl, {
          headers: { 'x-api-key': apiKey },
        })
        if (statusRes.ok) {
          const statusData = await statusRes.json() as Record<string, unknown>
          if (statusData.audio_path) {
            res.json({ audioUrl: statusData.audio_path })
            return
          }
          if (statusData.status === 'FAILURE') {
            res.status(500).json({ message: 'Ovoz yaratishda xatolik' })
            return
          }
        }
        attempts++
      }

      res.status(504).json({ message: 'TTS javob kutish vaqti tugadi' })
      return
    }

    res.status(500).json({ message: 'Kutilmagan TTS javobi' })
  } catch (error) {
    console.error('TTS error:', error)
    res.status(500).json({ message: 'Ovozli sintez xatosi' })
  }
}
