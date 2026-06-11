'use client'

import { useT } from '@/lib/language-context'
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Loader2,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
  Search,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'

import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// PDF.js worker — local fayl (public/pdf.worker.min.mjs), CDN'ga bog'liq emas.
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

const MIN_SCALE = 0.5
const MAX_SCALE = 3
const SCALE_STEP = 0.2

type FitMode = 'width' | 'page' | 'custom'

// Ushbu hostlar CORS sarlavhalarini yubormaydi — react-pdf ularni brauzerda
// to'g'ridan-to'g'ri yuklay olmaydi, shuning uchun same-origin proxy orqali
// (app/api/library/proxy) uzatamiz. Proxy ham xuddi shu allow-list'ga ega.
const PROXY_HOSTS = new Set(['api.unilibrary.uz', 'api.ziyonet.uz'])

function resolveReaderSrc(src: string): string {
  try {
    const u = new URL(src, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
    if (PROXY_HOSTS.has(u.hostname.toLowerCase())) {
      return `/api/library/proxy?url=${encodeURIComponent(src)}`
    }
  } catch {
    /* nisbiy yoki noto'g'ri URL — o'zgartirmaymiz */
  }
  return src
}

export default function PdfReader({ src, title }: { src: string; title: string }) {
  const { t } = useT()
  const containerRef = useRef<HTMLDivElement>(null)
  const pageWrapRef = useRef<HTMLDivElement>(null)

  const [numPages, setNumPages] = useState(0)
  const [pageNum, setPageNum] = useState(1)
  const [scale, setScale] = useState(1.2)
  const [fitMode, setFitMode] = useState<FitMode>('width')
  const [containerWidth, setContainerWidth] = useState(0)
  const [loadError, setLoadError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [pageInput, setPageInput] = useState('1')

  // Kuzatuv: konteyner kengligi (fit width uchun)
  useEffect(() => {
    const el = pageWrapRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setContainerWidth(e.contentRect.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  useEffect(() => { setPageInput(String(pageNum)) }, [pageNum])

  const onLoadSuccess = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n)
    setLoading(false)
    setLoadError(false)
  }, [])

  const onLoadError = useCallback(() => {
    setLoading(false)
    setLoadError(true)
  }, [])

  const goPrev = useCallback(() => setPageNum(p => Math.max(1, p - 1)), [])
  const goNext = useCallback(() => setPageNum(p => Math.min(numPages, p + 1)), [numPages])

  const zoomIn = useCallback(() => { setFitMode('custom'); setScale(s => Math.min(MAX_SCALE, +(s + SCALE_STEP).toFixed(2))) }, [])
  const zoomOut = useCallback(() => { setFitMode('custom'); setScale(s => Math.max(MIN_SCALE, +(s - SCALE_STEP).toFixed(2))) }, [])

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }, [])

  const submitPageInput = useCallback(() => {
    const n = parseInt(pageInput)
    if (!Number.isNaN(n) && n >= 1 && n <= numPages) setPageNum(n)
    else setPageInput(String(pageNum))
  }, [pageInput, numPages, pageNum])

  // Klaviatura: ‹ › sahifa, +/- zoom
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'ArrowRight') goNext()
      else if (e.key === '+' || e.key === '=') zoomIn()
      else if (e.key === '-') zoomOut()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goPrev, goNext, zoomIn, zoomOut])

  // Render uchun haqiqiy scale (fit width — konteynerga moslab width beradi)
  const renderWidth = fitMode === 'width' && containerWidth > 0 ? containerWidth - 24 : undefined
  const renderScale = fitMode === 'custom' ? scale : undefined

  // CORS yubormaydigan hostlar uchun proxy orqali yuklaymiz.
  const readerSrc = resolveReaderSrc(src)

  // Tashqi (boshqa domen) PDF — CORS xato bo'lishi mumkin; fallback havola.
  if (loadError) {
    return (
      <div className='h-full flex flex-col items-center justify-center bg-surface p-8'>
        <div className='max-w-md w-full text-center'>
          <div className='w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4'>
            <AlertTriangle className='w-7 h-7 text-accent' />
          </div>
          <h3 className='text-base font-semibold text-text-primary mb-2'>{t('library.loadFailed')}</h3>
          <p className='text-sm text-text-secondary mb-5'>{t('library.pdfBlockedHint')}</p>
          <a href={src} target='_blank' rel='noopener noreferrer'
            className='inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors'>
            <ExternalLink className='w-4 h-4' /> {t('library.openExternal')}
          </a>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className='h-full flex flex-col bg-[#525659] dark:bg-[#1a1f2e]'>
      {/* Toolbar */}
      <div className='shrink-0 flex items-center gap-1.5 px-2 sm:px-3 h-12 bg-surface/95 backdrop-blur-sm border-b border-border overflow-x-auto'>
        {/* Sahifa nav */}
        <button onClick={goPrev} disabled={pageNum <= 1}
          className='p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-light disabled:opacity-40 transition-colors shrink-0'
          title={t('library.prevPage')}>
          <ChevronLeft className='w-4 h-4' />
        </button>
        <div className='flex items-center gap-1 text-xs text-text-secondary shrink-0'>
          <input
            value={pageInput}
            onChange={e => setPageInput(e.target.value.replace(/[^0-9]/g, ''))}
            onBlur={submitPageInput}
            onKeyDown={e => { if (e.key === 'Enter') submitPageInput() }}
            className='w-9 text-center px-1 py-0.5 rounded border border-border bg-surface-light text-text-primary text-xs'
            aria-label={t('library.page')}
          />
          <span>/ {numPages || '—'}</span>
        </div>
        <button onClick={goNext} disabled={pageNum >= numPages}
          className='p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-light disabled:opacity-40 transition-colors shrink-0'
          title={t('library.nextPage')}>
          <ChevronRight className='w-4 h-4' />
        </button>

        <div className='w-px h-5 bg-border mx-1 shrink-0' />

        {/* Zoom */}
        <button onClick={zoomOut}
          className='p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-light transition-colors shrink-0'
          title={t('library.zoomOut')}>
          <Minus className='w-4 h-4' />
        </button>
        <span className='text-xs text-text-secondary w-10 text-center shrink-0 tabular-nums'>
          {Math.round((fitMode === 'custom' ? scale : 1) * 100)}%
        </span>
        <button onClick={zoomIn}
          className='p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-light transition-colors shrink-0'
          title={t('library.zoomIn')}>
          <Plus className='w-4 h-4' />
        </button>

        <div className='w-px h-5 bg-border mx-1 shrink-0' />

        {/* Fit mode */}
        <button onClick={() => setFitMode('width')}
          className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 ${
            fitMode === 'width' ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-surface-light'
          }`}
          title={t('library.fitWidth')}>
          {t('library.fitWidthShort')}
        </button>
        <button onClick={() => { setFitMode('custom'); setScale(1) }}
          className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 ${
            fitMode === 'custom' && scale === 1 ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-surface-light'
          }`}
          title={t('library.fitPage')}>
          100%
        </button>

        <div className='flex-1 min-w-2' />

        {/* Download */}
        <a href={src} download target='_blank' rel='noopener noreferrer'
          className='p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-light transition-colors shrink-0'
          title={t('library.download')}>
          <Download className='w-4 h-4' />
        </a>
        {/* Fullscreen */}
        <button onClick={toggleFullscreen}
          className='p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-light transition-colors shrink-0'
          title={t('library.fullscreen')}>
          {isFullscreen ? <Minimize2 className='w-4 h-4' /> : <Maximize2 className='w-4 h-4' />}
        </button>
      </div>

      {/* Document viewport */}
      <div ref={pageWrapRef} className='flex-1 overflow-auto flex justify-center py-4'>
        <Document
          file={readerSrc}
          onLoadSuccess={onLoadSuccess}
          onLoadError={onLoadError}
          loading={
            <div className='flex flex-col items-center justify-center gap-4 h-full text-white/80 pt-20'>
              <Loader2 className='w-8 h-8 animate-spin' />
              <p className='text-sm'>{t('library.loadingBook')}</p>
            </div>
          }
          error={<span />}
          className='flex flex-col items-center'
        >
          {!loading && numPages > 0 && (
            <Page
              pageNumber={pageNum}
              width={renderWidth}
              scale={renderScale}
              renderTextLayer
              renderAnnotationLayer
              className='shadow-2xl rounded-sm overflow-hidden bg-white'
              loading={
                <div className='flex items-center justify-center h-96 w-full'>
                  <Loader2 className='w-6 h-6 animate-spin text-primary' />
                </div>
              }
            />
          )}
        </Document>
      </div>
    </div>
  )
}

/** Kichik PDF qidiruv-paneli (matn ichida — react-pdf textLayer ustida ishlaydi).
 *  Hozircha brauzer ichki Ctrl+F'ni textLayer orqali qo'llab-quvvatlaydi; bu
 *  panel kelajak kengaytma uchun joy. */
export function PdfSearchHint() {
  const { t } = useT()
  const [open, setOpen] = useState(false)
  return (
    <div className='relative'>
      <button onClick={() => setOpen(o => !o)}
        className='p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-light transition-colors'
        title={t('library.search')}>
        <Search className='w-4 h-4' />
      </button>
      {open && (
        <div className='absolute right-0 top-full mt-1 w-56 p-3 rounded-xl border border-border bg-surface shadow-lg z-30 text-xs text-text-secondary'>
          <div className='flex items-center justify-between mb-1'>
            <span className='font-medium text-text-primary'>{t('library.search')}</span>
            <button onClick={() => setOpen(false)}><X className='w-3.5 h-3.5' /></button>
          </div>
          {t('library.searchHint')}
        </div>
      )}
    </div>
  )
}
