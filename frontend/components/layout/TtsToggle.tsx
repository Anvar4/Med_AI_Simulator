'use client'

import { useTtsEnabled } from '@/lib/use-tts'
import { Volume2, VolumeX } from 'lucide-react'

/**
 * Global voice (TTS) on/off toggle. Reads the reactive `med-ai-tts-enabled`
 * preference so a single tap anywhere mutes/unmutes auto-reading across the
 * whole app. Meant to live in a persistent spot (sidebar / top bar).
 */
export default function TtsToggle({ compact = false }: { compact?: boolean }) {
  const [enabled, setEnabled] = useTtsEnabled()
  return (
    <button
      type='button'
      onClick={() => setEnabled(!enabled)}
      title={enabled ? 'Ovozli o‘qish yoqilgan' : 'Ovozli o‘qish o‘chirilgan'}
      aria-pressed={enabled}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
        enabled ? 'text-primary hover:bg-primary/10' : 'text-text-secondary hover:bg-surface-light'
      }`}
    >
      {enabled ? <Volume2 className='w-4 h-4' /> : <VolumeX className='w-4 h-4' />}
      {!compact && <span className='font-medium'>{enabled ? 'Ovoz' : 'Ovozsiz'}</span>}
    </button>
  )
}
