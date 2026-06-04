'use client'

import { Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useT } from '@/lib/language-context'
import { buildEmbedSrc, SKETCHFAB_API_SRC } from '@/lib/anatomy-models'

interface SketchfabViewerProps {
  embedUrl: string
  title: string
  className?: string
}

/** Minimal shape of the Sketchfab Viewer API object we use. */
interface SketchfabApi {
  start: () => void
  addEventListener: (event: string, cb: () => void) => void
  setAnnotationsVisible?: (visible: number | boolean) => void
  hideAnnotationTooltips?: () => void
}
interface SketchfabClient {
  init: (uid: string, opts: Record<string, unknown>) => void
}
declare global {
  interface Window {
    Sketchfab?: new (version: string, iframe: HTMLIFrameElement) => SketchfabClient
  }
}

// Load the Sketchfab API script once and resolve when ready.
let apiScriptPromise: Promise<void> | null = null
function loadSketchfabApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.Sketchfab) return Promise.resolve()
  if (apiScriptPromise) return apiScriptPromise
  apiScriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = SKETCHFAB_API_SRC
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Sketchfab API yuklanmadi'))
    document.head.appendChild(s)
  })
  return apiScriptPromise
}

// Extract the model UID from an embed URL (…/models/<uid>/embed).
function extractUid(embedUrl: string): string | null {
  const m = embedUrl.match(/models\/([0-9a-f]{32})/i)
  return m?.[1] ?? null
}

/**
 * Embedded 3D anatomy viewer.
 *
 * Uses the Sketchfab Viewer API so we can programmatically hide annotations
 * (the numbered hotspots + english labels) once the model is ready — these
 * can't be removed via URL params alone for models we don't own. Falls back to
 * a plain iframe embed if the API fails to load.
 */
export default function SketchfabViewer({ embedUrl, title, className = '' }: SketchfabViewerProps) {
  const { t } = useT()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [loading, setLoading] = useState(true)
  const uid = extractUid(embedUrl)

  useEffect(() => {
    setLoading(true)
    let cancelled = false
    const iframe = iframeRef.current
    if (!iframe || !uid) {
      // Fallback: plain embed src.
      if (iframe) iframe.src = buildEmbedSrc(embedUrl)
      return
    }

    loadSketchfabApi()
      .then(() => {
        if (cancelled || !window.Sketchfab || !iframeRef.current) return
        const client = new window.Sketchfab('1.12.1', iframeRef.current)
        client.init(uid, {
          autostart: 0,
          preload: 0,
          transparent: 1,
          ui_loading: 1,
          ui_infos: 0,
          ui_controls: 0,
          ui_stop: 0,
          ui_watermark: 0,
          ui_watermark_link: 0,
          ui_hint: 0,
          ui_ar: 0,
          ui_help: 0,
          ui_settings: 0,
          ui_vr: 0,
          ui_fullscreen: 0,
          ui_inspector: 0,
          ui_annotations: 0,
          annotation_tooltip_visible: 0,
          ui_theme: 'dark',
          scrollwheel: 1,
          success: (api: SketchfabApi) => {
            api.start()
            api.addEventListener('viewerready', () => {
              // Kill annotations both ways for maximum coverage.
              try { api.setAnnotationsVisible?.(0) } catch { /* noop */ }
              try { api.hideAnnotationTooltips?.() } catch { /* noop */ }
              if (!cancelled) setLoading(false)
            })
          },
          error: () => {
            // API init failed -> fall back to a plain embed.
            if (iframeRef.current) iframeRef.current.src = buildEmbedSrc(embedUrl)
          },
        })
      })
      .catch(() => {
        if (iframeRef.current) iframeRef.current.src = buildEmbedSrc(embedUrl)
      })

    return () => { cancelled = true }
  }, [embedUrl, uid])

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
        ref={iframeRef}
        title={title}
        onLoad={() => { /* readiness is driven by the API viewerready event */ }}
        loading='lazy'
        className={`w-full h-full border-0 transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`}
        allow='autoplay; fullscreen; xr-spatial-tracking'
        allowFullScreen
      />

      {/* Attribution / logo covers */}
      <div className='absolute bottom-0 left-0 right-0 h-10 bg-secondary pointer-events-none z-20' />
      <div className='absolute top-0 left-0 w-40 h-12 bg-secondary pointer-events-none z-20' />
      <div className='absolute top-0 right-0 w-12 h-12 bg-secondary pointer-events-none z-20' />
    </div>
  )
}
