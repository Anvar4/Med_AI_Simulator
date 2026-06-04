'use client'

import Sidebar from '@/components/layout/Sidebar'
import ControlsPanel, { isModelLocked } from '@/components/simulator/ControlsPanel'
import SketchfabViewer from '@/components/simulator/SketchfabViewer'
import { useAuth } from '@/lib/auth-context'
import { useT } from '@/lib/language-context'
import type { Locale } from '@/lib/i18n'
import { ANATOMY_MODELS, tl } from '@/lib/anatomy-models'
import { useTTS } from '@/lib/use-tts'
import { AnimatePresence, motion } from 'framer-motion'
import { Activity, ChevronDown, ChevronLeft, ChevronRight, Info, Layers, List, Loader2, Lock, Maximize2, Volume2, VolumeX, X } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useState } from 'react'

export default function SimulatorPage() {
  const { locale, t } = useT()
  const { user } = useAuth()
  const isPremium = !!user?.isPremium || user?.role === 'admin' || user?.role === 'content-manager'
  const lc = locale as Locale
  const [selectedId, setSelectedId] = useState(ANATOMY_MODELS[0].id)
  const [panelOpen, setPanelOpen] = useState(true)        // desktop: model list
  const [mobilePicker, setMobilePicker] = useState(false) // mobile: model list sheet
  const [infoOpen, setInfoOpen] = useState(true)          // detail panel (parts/description)

  const model = ANATOMY_MODELS.find(m => m.id === selectedId) ?? ANATOMY_MODELS[0]
  const modelTitle = tl(model.title, lc)
  const locked = isModelLocked(model.id, isPremium)
  const tts = useTTS(lc as 'uz' | 'ru' | 'en')

  // Read the model title + description + parts aloud in the current language.
  const readAloud = useCallback(() => {
    if (tts.speaking || tts.loading) { tts.stop(); return }
    const parts = model.parts.map(p => tl(p, lc)).join(', ')
    tts.speak(`${modelTitle}. ${tl(model.description, lc)}. ${t('simulator.containedParts')}: ${parts}.`)
  }, [tts, model, lc, modelTitle, t])

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id)
    setMobilePicker(false)
  }, [])

  const handleFullscreen = useCallback(() => {
    const el = document.getElementById('viewer-container')
    if (!el) return
    if (!document.fullscreenElement) el.requestFullscreen().catch(() => {})
    else document.exitFullscreen().catch(() => {})
  }, [])

  return (
    <div className='min-h-screen bg-secondary'>
      <Sidebar />

      <main className='lg:pl-64 pt-16 lg:pt-0 flex flex-col h-dvh'>
        {/* Top bar */}
        <div className='shrink-0 flex items-center justify-between px-3 sm:px-6 h-14 lg:h-16 border-b border-border bg-surface/50 backdrop-blur-sm'>
          <div className='flex items-center gap-2.5 min-w-0'>
            <div className='w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0'>
              <Activity className='w-4 h-4 text-primary' />
            </div>
            <div className='min-w-0'>
              <h1 className='text-sm font-bold text-text-primary leading-tight truncate'>{t('simulator.title')}</h1>
              <p className='text-[11px] text-text-secondary truncate'>{modelTitle}</p>
            </div>
          </div>

          <div className='flex items-center gap-1.5 shrink-0'>
            {/* Mobile: open model list — primary action, labelled so it's obvious */}
            <button onClick={() => setMobilePicker(true)}
              className='lg:hidden inline-flex items-center gap-1.5 pl-2.5 pr-3 py-2 rounded-xl bg-primary text-white text-xs font-semibold transition-all active:scale-95'
              title={t('simulator.modelList')}>
              <List className='w-4 h-4' />
              <span>{t('simulator.models')}</span>
            </button>
            <button onClick={() => setInfoOpen(!infoOpen)}
              className={`p-2 rounded-xl transition-all duration-200 ${infoOpen ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-surface-light hover:text-text-primary'}`}
              title={t('simulator.containedParts')}>
              <Info className='w-4 h-4' />
            </button>
            <button onClick={handleFullscreen}
              className='hidden sm:flex p-2 rounded-xl text-text-secondary hover:bg-surface-light hover:text-text-primary transition-all'
              title="To'liq ekran">
              <Maximize2 className='w-4 h-4' />
            </button>
            <button onClick={() => setPanelOpen(!panelOpen)}
              className='hidden lg:flex p-2 rounded-xl text-text-secondary hover:bg-surface-light hover:text-text-primary transition-all'
              title={panelOpen ? 'Panelni yopish' : 'Panelni ochish'}>
              {panelOpen ? <ChevronLeft className='w-4 h-4' /> : <ChevronRight className='w-4 h-4' />}
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className='flex flex-1 overflow-hidden'>
          {/* Desktop controls panel */}
          <AnimatePresence initial={false}>
            {panelOpen && (
              <motion.div key='panel'
                initial={{ width: 0, opacity: 0 }} animate={{ width: 296, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className='hidden lg:flex shrink-0 flex-col border-r border-border bg-surface overflow-hidden'>
                <div className='p-4 overflow-y-auto h-full'>
                  <ControlsPanel selectedId={selectedId} onSelect={handleSelect} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 3D Viewer */}
          <div id='viewer-container' className='flex-1 relative bg-secondary overflow-hidden'>
            {locked ? (
              <div className='absolute inset-0 flex flex-col items-center justify-center p-6 text-center'>
                <div className='w-16 h-16 rounded-2xl bg-warning/15 text-warning flex items-center justify-center mb-4'>
                  <Lock className='w-8 h-8' />
                </div>
                <h3 className='text-lg font-bold text-text-primary mb-2'>Bu model Pro obuna uchun</h3>
                <p className='text-sm text-text-secondary max-w-sm mb-5'>
                  Bepul rejada dastlabki 3 ta 3D model ochiq. Barcha {ANATOMY_MODELS.length} modelni ko&apos;rish uchun Pro obunani faollashtiring.
                </p>
                <Link href='/subscription' className='px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold'>
                  Pro obunani faollashtirish
                </Link>
              </div>
            ) : (
              <SketchfabViewer embedUrl={model.embedUrl} title={modelTitle} className='w-full h-full' />
            )}

            {/* Model badge */}
            <div className='absolute top-3 left-3 z-30 pointer-events-none'>
              <div className='px-3 py-1.5 rounded-lg bg-surface/80 backdrop-blur-sm border border-border text-xs font-medium text-text-primary max-w-[60vw] truncate'>
                {modelTitle}
              </div>
            </div>

            {/* Detail panel (description + parts) — sits over the 3D without blocking it */}
            <AnimatePresence>
              {infoOpen && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25 }}
                  className='absolute z-30 glass border border-border rounded-2xl overflow-hidden flex flex-col
                             top-3 right-3 w-[min(20rem,calc(100%-1.5rem))] max-h-[calc(100%-5rem)]
                             max-sm:top-auto max-sm:bottom-12 max-sm:left-3 max-sm:right-3 max-sm:w-auto max-sm:max-h-[45%]'
                >
                  <div className='flex items-center gap-2 px-4 py-3 border-b border-border shrink-0'>
                    <Layers className='w-4 h-4 text-primary shrink-0' />
                    <h3 className='text-sm font-bold text-text-primary flex-1 truncate'>{modelTitle}</h3>
                    <button onClick={readAloud} title='Ovozli o&apos;qish'
                      className={`shrink-0 transition-colors ${tts.speaking ? 'text-primary' : 'text-text-secondary hover:text-primary'}`}>
                      {tts.loading ? <Loader2 className='w-4 h-4 animate-spin' /> : tts.speaking ? <VolumeX className='w-4 h-4' /> : <Volume2 className='w-4 h-4' />}
                    </button>
                    <button onClick={() => setInfoOpen(false)} className='text-text-secondary hover:text-text-primary'>
                      <X className='w-4 h-4' />
                    </button>
                  </div>
                  <div className='p-4 overflow-y-auto space-y-4'>
                    <p className='text-sm text-text-secondary leading-relaxed'>{tl(model.description, lc)}</p>
                    <div>
                      <p className='text-[10px] font-semibold text-primary uppercase tracking-wider mb-2'>{t('simulator.containedParts')}</p>
                      <div className='flex flex-wrap gap-1.5'>
                        {model.parts.map((p, i) => (
                          <span key={i} className='text-[11px] px-2 py-1 rounded-lg bg-primary/10 text-primary'>{tl(p, lc)}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Mobile model picker sheet */}
      <AnimatePresence>
        {mobilePicker && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobilePicker(false)}
              className='lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm'
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className='lg:hidden fixed inset-x-0 bottom-0 z-50 max-h-[80vh] rounded-t-3xl bg-surface border-t border-border flex flex-col'
            >
              <div className='flex items-center justify-between px-4 py-3 border-b border-border shrink-0'>
                <h3 className='text-sm font-bold text-text-primary'>{t('simulator.modelList')}</h3>
                <button onClick={() => setMobilePicker(false)} className='text-text-secondary hover:text-text-primary'>
                  <ChevronDown className='w-5 h-5' />
                </button>
              </div>
              <div className='p-4 overflow-y-auto'>
                <ControlsPanel selectedId={selectedId} onSelect={handleSelect} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
