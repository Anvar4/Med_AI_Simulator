'use client'

import { Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { buildEmbedSrc } from '@/lib/anatomy-models'

interface SketchfabViewerProps {
  embedUrl: string
  title: string
  className?: string
}

/**
 * Embedded 3D anatomy viewer. UI chrome is stripped via embed params (see
 * buildEmbedSrc). The bottom-corner attribution mark is covered with a small
 * matching overlay so the embed blends into the app while staying functional.
 */
export default function SketchfabViewer({ embedUrl, title, className = '' }: SketchfabViewerProps) {
  const [loading, setLoading] = useState(true)
  const src = buildEmbedSrc(embedUrl)
  const frameKey = useRef(0)

  // Show the spinner again whenever the model changes.
  useEffect(() => { setLoading(true) }, [embedUrl])

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {loading && (
        <div className='absolute inset-0 z-10 flex flex-col items-center justify-center bg-secondary gap-3 pointer-events-none'>
          <Loader2 className='w-8 h-8 text-primary animate-spin' />
          <span className='text-sm text-text-secondary'>3D model yuklanmoqda...</span>
        </div>
      )}

      <iframe
        key={`${embedUrl}-${frameKey.current}`}
        title={title}
        src={src}
        onLoad={() => setLoading(false)}
        className={`w-full h-full border-0 transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`}
        allow='autoplay; fullscreen; xr-spatial-tracking'
        allowFullScreen
      />

      {/* Cover the bottom-corner attribution strip to keep the viewer clean. */}
      <div className='absolute bottom-0 left-0 right-0 h-9 bg-secondary pointer-events-none z-20' />
      {/* Re-expose the area above so the model isn't visually clipped. */}
    </div>
  )
}
