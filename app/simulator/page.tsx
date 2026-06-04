'use client'

import Sidebar from '@/components/layout/Sidebar'
import ControlsPanel from '@/components/simulator/ControlsPanel'
import SketchfabViewer from '@/components/simulator/SketchfabViewer'
import { useT } from '@/lib/language-context'
import type { Locale } from '@/lib/i18n'
import { ANATOMY_MODELS } from '@/lib/anatomy-models'
import { AnimatePresence, motion } from 'framer-motion'
import { Activity, ChevronLeft, ChevronRight, Info, Maximize2 } from 'lucide-react'
import { useCallback, useState } from 'react'

export default function SimulatorPage() {
  const { locale } = useT()
  const lc = locale as Locale
  const [selectedId, setSelectedId] = useState(ANATOMY_MODELS[0].id)
  const [panelOpen, setPanelOpen] = useState(true)
  const [infoOpen, setInfoOpen] = useState(false)

  const model = ANATOMY_MODELS.find(m => m.id === selectedId) ?? ANATOMY_MODELS[0]
  const modelTitle = lc === 'en' ? model.titleEn : model.titleUz

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id)
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
        <div className='shrink-0 flex items-center justify-between px-4 sm:px-6 h-14 lg:h-16 border-b border-border bg-surface/50 backdrop-blur-sm'>
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center'>
              <Activity className='w-4 h-4 text-primary' />
            </div>
            <div>
              <h1 className='text-sm font-bold text-text-primary leading-tight'>3D Anatomiya Simulyatori</h1>
              <p className='text-xs text-text-secondary hidden sm:block'>{modelTitle}</p>
            </div>
          </div>

          <div className='flex items-center gap-1'>
            <button onClick={() => setInfoOpen(!infoOpen)}
              className={`p-2 rounded-xl transition-all duration-200 ${infoOpen ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-surface-light hover:text-text-primary'}`}
              title="Ma'lumot">
              <Info className='w-4 h-4' />
            </button>
            <button onClick={handleFullscreen}
              className='p-2 rounded-xl text-text-secondary hover:bg-surface-light hover:text-text-primary transition-all'
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

        {/* Model info bar */}
        <AnimatePresence>
          {infoOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }} className='overflow-hidden border-b border-border bg-primary/5'>
              <div className='px-4 sm:px-6 py-3'>
                <p className='text-xs font-bold text-primary uppercase tracking-wider mb-1'>{modelTitle}</p>
                <p className='text-xs text-text-secondary leading-relaxed'>{model.note}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main content */}
        <div className='flex flex-1 overflow-hidden'>
          {/* Controls Panel */}
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
            <SketchfabViewer embedUrl={model.embedUrl} title={modelTitle} className='w-full h-full' />

            {/* Model badge */}
            <div className='absolute top-4 left-4 z-30 pointer-events-none'>
              <div className='px-3 py-1.5 rounded-lg bg-surface/80 backdrop-blur-sm border border-border text-xs font-medium text-text-primary'>
                {modelTitle}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile bottom panel */}
        <div className='lg:hidden shrink-0 border-t border-border bg-surface'>
          <div className='p-3 max-h-60 overflow-y-auto'>
            <ControlsPanel selectedId={selectedId} onSelect={handleSelect} />
          </div>
        </div>
      </main>
    </div>
  )
}
