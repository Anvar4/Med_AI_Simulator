'use client'

import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useT } from '@/lib/language-context'
import { buildEmbedSrc } from '@/lib/anatomy-models'

interface SketchfabViewerProps {
  embedUrl: string
  title: string
  className?: string
}

/**
 * Embedded 3D anatomy viewer. UI chrome is stripped via embed params (see
 * buildEmbedSrc). The corner attribution marks are visually covered with small
 * matching overlays so the embed blends into the app. The overlays are purely
 * decorative (pointer-events: none) and only sit over the thin border strips,
 * so the 3D model stays fully interactive.
 */
export default function SketchfabViewer({ embedUrl, title, className = '' }: SketchfabViewerProps) {
  const { t } = useT()
  const [loading, setLoading] = useState(true)
  const src = buildEmbedSrc(embedUrl)

  // Show the spinner again whenever the model changes.
  useEffect(() => { setLoading(true) }, [embedUrl])

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {loading && (
        <div className='absolute inset-0 z-10 flex flex-col items-center justify-center bg-secondary gap-3 pointer-events-none'>
          <Loader2 className='w-8 h-8 text-primary animate-spin' />
          <span className='text-sm text-text-secondary'>{t('simulator.loading')}</span>
        </div>
      )}

      <iframe
        key={embedUrl}
        title={title}
        src={src}
        onLoad={() => setLoading(false)}
        className={`w-full h-full border-0 transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`}
        allow='autoplay; fullscreen; xr-spatial-tracking'
        allowFullScreen
      />

      {/* Bottom attribution strip cover (full-width, matches page bg) */}
      <div className='absolute bottom-0 left-0 right-0 h-10 bg-secondary pointer-events-none z-20' />
      {/* Top-left logo cover */}
      <div className='absolute top-0 left-0 w-40 h-12 bg-secondary pointer-events-none z-20' />
      {/* Top-right cover (some embeds place a control there) */}
      <div className='absolute top-0 right-0 w-12 h-12 bg-secondary pointer-events-none z-20' />
    </div>
  )
}
