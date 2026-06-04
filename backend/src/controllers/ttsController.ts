import { Request, Response } from 'express'

/**
 * Uzbek Text-to-Speech via Muxlisa AI (service.muxlisa.uz).
 * Russian/English TTS is handled on the client with the browser Web Speech API,
 * so this endpoint only serves Uzbek.
 *
 * Request:  POST /api/tts   body { text: string, gender?: 'male'|'female' }
 * Muxlisa:  POST https://service.muxlisa.uz/api/v2/tts
 *           headers x-api-key, body JSON { text, speaker }
 *           speaker is a numeric voice id (configurable via env).
 */
const MUXLISA_TTS_URL = 'https://service.muxlisa.uz/api/v2/tts'

// Speaker ids per gender. Defaults can be overridden by env once the real
// male/female ids are confirmed by testing.
function speakerFor(gender: string | undefined): number {
  // Muxlisa accepts speaker 0 or 1 only.
  const male = Number(process.env.MUXLISA_SPEAKER_MALE ?? '0')
  const female = Number(process.env.MUXLISA_SPEAKER_FEMALE ?? '1')
  return gender === 'female' ? female : male
}

export const textToSpeech = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, gender } = req.body as { text?: string; gender?: string }

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      res.status(400).json({ message: 'Matn kiritilishi shart' })
      return
    }
    if (text.length > 5000) {
      res.status(400).json({ message: 'Matn juda uzun (maksimum 5000 belgi)' })
      return
    }

    const apiKey = process.env.MUXLISA_API_KEY || ''
    if (!apiKey) {
      res.status(500).json({ message: 'TTS API kaliti sozlanmagan' })
      return
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 20000)

    let response: globalThis.Response
    try {
      response = await fetch(MUXLISA_TTS_URL, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text.trim(), speaker: speakerFor(gender) }),
        signal: controller.signal,
      })
    } catch (fetchErr: unknown) {
      clearTimeout(timeout)
      const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr)
      console.error('Muxlisa TTS fetch failed:', msg)
      res.status(503).json({ message: 'TTS serveriga ulanib bo\'lmadi. Tarmoqni tekshiring.' })
      return
    }
    clearTimeout(timeout)

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error('Muxlisa TTS error:', response.status, errorText)
      res.status(response.status === 402 || response.status === 401 ? response.status : 500).json({
        message: response.status === 401
          ? 'TTS API kaliti yaroqsiz'
          : response.status === 402
            ? 'TTS balans yetarli emas'
            : 'Ovozli sintez xatosi',
      })
      return
    }

    const contentType = response.headers.get('content-type') || ''

    // Case 1: the API returns the audio bytes directly -> stream them through.
    if (contentType.includes('audio') || contentType.includes('octet-stream')) {
      const buf = Buffer.from(await response.arrayBuffer())
      res.setHeader('Content-Type', contentType.includes('audio') ? contentType : 'audio/mpeg')
      res.setHeader('Cache-Control', 'no-store')
      res.send(buf)
      return
    }

    // Case 2: the API returns JSON with a URL / base64 audio.
    const data = await response.json().catch(() => null) as Record<string, unknown> | null
    if (data) {
      const url = (data.audio_path || data.audioUrl || data.url || data.audio) as string | undefined
      if (typeof url === 'string' && url.startsWith('http')) {
        res.json({ audioUrl: url })
        return
      }
      const b64 = (data.audio_base64 || data.base64) as string | undefined
      if (typeof b64 === 'string') {
        res.json({ audioBase64: b64 })
        return
      }
    }

    res.status(500).json({ message: 'Kutilmagan TTS javobi' })
  } catch (error) {
    console.error('TTS error:', error)
    res.status(500).json({ message: 'Ovozli sintez xatosi' })
  }
}
