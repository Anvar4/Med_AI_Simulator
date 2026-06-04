'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'

/**
 * Text-to-Speech hook.
 *
 *  - Uzbek (uz)  -> backend /api/tts (Muxlisa AI), returns binary audio.
 *  - Russian/English (ru/en) -> browser Web Speech API (free, no key).
 *
 * Gender selects the voice (patient's gender for case symptoms, or the user's
 * gender elsewhere). TTS can be globally toggled off via the `med-ai-tts`
 * preference, which this hook reads reactively.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
const STORAGE_KEY = 'med-ai-auth'
const TTS_PREF_KEY = 'med-ai-tts-enabled'
const TTS_EVENT = 'med-ai-tts-changed'

export type TtsGender = 'male' | 'female'
export type TtsLang = 'uz' | 'ru' | 'en'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw).token ?? null : null
  } catch { return null }
}

// ─── Global TTS on/off preference (reactive) ───────────────────
export function isTtsEnabled(): boolean {
  if (typeof window === 'undefined') return true
  return localStorage.getItem(TTS_PREF_KEY) !== '0'
}
export function setTtsEnabled(enabled: boolean) {
  if (typeof window === 'undefined') return
  localStorage.setItem(TTS_PREF_KEY, enabled ? '1' : '0')
  window.dispatchEvent(new Event(TTS_EVENT))
}
function subscribeTts(cb: () => void) {
  if (typeof window === 'undefined') return () => {}
  const h = () => cb()
  window.addEventListener(TTS_EVENT, h)
  window.addEventListener('storage', h)
  return () => { window.removeEventListener(TTS_EVENT, h); window.removeEventListener('storage', h) }
}

export function useTtsEnabled(): [boolean, (v: boolean) => void] {
  const enabled = useSyncExternalStore(subscribeTts, isTtsEnabled, () => true)
  return [enabled, setTtsEnabled]
}

// Map app locale to a Web Speech BCP-47 tag.
function speechLang(lang: TtsLang): string {
  return lang === 'ru' ? 'ru-RU' : lang === 'en' ? 'en-US' : 'uz-UZ'
}

export function useTTS(lang: TtsLang) {
  const [speaking, setSpeaking] = useState(false)
  const [loading, setLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setSpeaking(false)
    setLoading(false)
  }, [])

  // Stop any audio when the component using the hook unmounts.
  useEffect(() => () => stop(), [stop])

  const speak = useCallback(async (text: string, gender: TtsGender = 'male') => {
    if (!text?.trim() || !isTtsEnabled()) return
    stop()

    // Russian / English -> browser Web Speech API.
    if (lang !== 'uz') {
      if (typeof window === 'undefined' || !window.speechSynthesis) return
      const u = new SpeechSynthesisUtterance(text)
      u.lang = speechLang(lang)
      // Try to pick a voice matching language + gender hint.
      const voices = window.speechSynthesis.getVoices()
      const langVoices = voices.filter(v => v.lang.startsWith(lang))
      const wantFemale = gender === 'female'
      const match = langVoices.find(v => /female|женск|ayol/i.test(v.name)) && wantFemale
        ? langVoices.find(v => /female|женск/i.test(v.name))
        : langVoices.find(v => (wantFemale ? /female|женск/i : /male|мужск/i).test(v.name))
      if (match) u.voice = match
      else if (langVoices[0]) u.voice = langVoices[0]
      u.rate = 1
      u.onstart = () => setSpeaking(true)
      u.onend = () => setSpeaking(false)
      u.onerror = () => setSpeaking(false)
      window.speechSynthesis.speak(u)
      return
    }

    // Uzbek -> Muxlisa via backend (binary audio).
    setLoading(true)
    const ac = new AbortController()
    abortRef.current = ac
    try {
      const token = getToken()
      const res = await fetch(`${API_URL}/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text: text.trim().slice(0, 5000), gender }),
        signal: ac.signal,
      })
      if (!res.ok) { setLoading(false); return }

      const ct = res.headers.get('content-type') || ''
      let url: string
      if (ct.includes('audio') || ct.includes('octet-stream')) {
        const blob = await res.blob()
        url = URL.createObjectURL(blob)
      } else {
        const data = await res.json().catch(() => null)
        if (data?.audioUrl) url = data.audioUrl
        else if (data?.audioBase64) url = `data:audio/wav;base64,${data.audioBase64}`
        else { setLoading(false); return }
      }

      const audio = new Audio(url)
      audioRef.current = audio
      audio.onplay = () => { setLoading(false); setSpeaking(true) }
      audio.onended = () => { setSpeaking(false); if (url.startsWith('blob:')) URL.revokeObjectURL(url) }
      audio.onerror = () => { setSpeaking(false); setLoading(false) }
      await audio.play().catch(() => { setSpeaking(false); setLoading(false) })
    } catch {
      setLoading(false)
      setSpeaking(false)
    }
  }, [lang, stop])

  return { speak, stop, speaking, loading }
}
