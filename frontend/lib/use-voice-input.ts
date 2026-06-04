'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from './api'

type VoiceState = 'idle' | 'recording' | 'transcribing' | 'error'

/**
 * Microphone -> Aisha STT hook. Records a short clip via MediaRecorder, then
 * uploads it to /api/stt and returns the transcript. Handles permission and
 * unsupported-browser cases gracefully.
 */
export function useVoiceInput(language: 'uz' | 'ru' | 'en' = 'uz') {
  const [state, setState] = useState<VoiceState>('idle')
  const [error, setError] = useState<string | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  const supported =
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof window.MediaRecorder !== 'undefined'

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  useEffect(() => () => stopStream(), [stopStream])

  const start = useCallback(async () => {
    if (!supported) {
      setError('Brauzeringiz ovozli kiritishni qo\'llab-quvvatlamaydi')
      setState('error')
      return
    }
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      const recorder = new MediaRecorder(stream)
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.start()
      recorderRef.current = recorder
      setState('recording')
    } catch {
      setError('Mikrofonga ruxsat berilmadi')
      setState('error')
    }
  }, [supported])

  /** Stop recording and return the transcript (or null on failure). */
  const stopAndTranscribe = useCallback((): Promise<string | null> => {
    return new Promise(resolve => {
      const recorder = recorderRef.current
      if (!recorder || state !== 'recording') {
        resolve(null)
        return
      }
      recorder.onstop = async () => {
        stopStream()
        setState('transcribing')
        try {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
          const { text } = await api.stt.transcribe(blob, language)
          setState('idle')
          resolve(text)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Xatolik')
          setState('error')
          resolve(null)
        }
      }
      recorder.stop()
    })
  }, [state, stopStream, language])

  const cancel = useCallback(() => {
    if (recorderRef.current && state === 'recording') {
      recorderRef.current.onstop = null
      recorderRef.current.stop()
    }
    stopStream()
    setState('idle')
  }, [state, stopStream])

  return { state, error, supported, start, stopAndTranscribe, cancel }
}
