'use client'

import Sidebar from '@/components/layout/Sidebar'
import ControlsPanel from '@/components/simulator/ControlsPanel'
import { useT } from '@/lib/language-context'
import type { Locale } from '@/lib/i18n'
import { ORGAN_MAP, ORGANS, tl } from '@/lib/organs-data'
import { AnimatePresence, motion } from 'framer-motion'
import { Activity, ChevronLeft, ChevronRight, Info, Maximize2, X } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useCallback, useMemo, useState } from 'react'

// Three.js canvas must be client-only (no SSR).
const Organ3DViewer = dynamic(() => import('@/components/simulator/Organ3DViewer'), {
  ssr: false,
  loading: () => (
    <div className='absolute inset-0 flex items-center justify-center bg-secondary'>
      <div className='flex flex-col items-center gap-3'>
        <div className='w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin' />
        <span className='text-sm text-text-secondary'>3D model yuklanmoqda...</span>
      </div>
    </div>
  ),
})

export default function SimulatorPage() {
  const { t, locale } = useT()
  const lc = locale as Locale
  const [selectedOrgan, setSelectedOrgan] = useState('heart')
  const [selectedPart, setSelectedPart] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(true)
  const [infoOpen, setInfoOpen] = useState(false)

  const organ = ORGAN_MAP[selectedOrgan] ?? ORGANS[0]
  const part = useMemo(() => organ.parts.find(p => p.id === selectedPart) ?? null, [organ, selectedPart])

  const handleOrganChange = useCallback((key: string) => {
    setSelectedOrgan(key)
    setSelectedPart(null)
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
              <p className='text-xs text-text-secondary hidden sm:block'>{tl(organ.name, lc)}</p>
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

        {/* Organ summary bar */}
        <AnimatePresence>
          {infoOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }} className='overflow-hidden border-b border-border bg-primary/5'>
              <div className='px-4 sm:px-6 py-3'>
                <p className='text-xs font-bold text-primary uppercase tracking-wider mb-1'>{tl(organ.name, lc)}</p>
                <p className='text-xs text-text-secondary leading-relaxed'>{tl(organ.summary, lc)}</p>
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
                  <ControlsPanel selectedOrgan={selectedOrgan} onOrganChange={handleOrganChange} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 3D Viewer + part info */}
          <div id='viewer-container' className='flex-1 relative bg-secondary overflow-hidden'>
            <Organ3DViewer
              organKey={selectedOrgan}
              selectedPart={selectedPart}
              onSelectPart={setSelectedPart}
              className='w-full h-full'
            />

            {/* Organ badge */}
            <div className='absolute top-4 left-4 z-20 pointer-events-none'>
              <div className='px-3 py-1.5 rounded-lg bg-surface/80 backdrop-blur-sm border border-border text-xs font-medium text-text-primary'>
                {tl(organ.name, lc)}
              </div>
            </div>

            {/* Clicked-part detail panel */}
            <AnimatePresence>
              {part && (
                <motion.div
                  initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }}
                  transition={{ duration: 0.25 }}
                  className='absolute top-4 right-4 bottom-4 w-72 max-w-[85%] z-20 rounded-2xl glass border border-border overflow-hidden flex flex-col'
                >
                  <div className='flex items-center gap-2 px-4 py-3 border-b border-border shrink-0'>
                    <span className='w-3 h-3 rounded-full shrink-0' style={{ background: part.color }} />
                    <h3 className='text-sm font-bold text-text-primary flex-1'>{tl(part.name, lc)}</h3>
                    <button onClick={() => setSelectedPart(null)} className='text-text-secondary hover:text-text-primary'>
                      <X className='w-4 h-4' />
                    </button>
                  </div>
                  <div className='p-4 overflow-y-auto space-y-4 text-sm'>
                    <Section title='Tavsif' body={tl(part.description, lc)} />
                    <Section title='Fiziologiya' body={tl(part.physiology, lc)} />
                    <Section title='Patologiya' body={tl(part.pathology, lc)} />
                    <div>
                      <p className='text-[10px] font-semibold text-primary uppercase tracking-wider mb-1.5'>Bog&apos;liq kasalliklar</p>
                      <div className='flex flex-wrap gap-1.5'>
                        {tl(part.diseases, lc).split(',').map((d, i) => (
                          <span key={i} className='text-[11px] px-2 py-0.5 rounded-full bg-accent/10 text-accent'>{d.trim()}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Hint when nothing selected */}
            {!part && (
              <div className='absolute top-4 right-4 z-10 pointer-events-none'>
                <div className='px-3 py-1.5 rounded-lg bg-surface/70 backdrop-blur-sm border border-border text-[11px] text-text-secondary'>
                  A&apos;zo qismini bosing →
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile bottom panel */}
        <div className='lg:hidden shrink-0 border-t border-border bg-surface'>
          <div className='p-3 max-h-60 overflow-y-auto'>
            <ControlsPanel selectedOrgan={selectedOrgan} onOrganChange={handleOrganChange} />
          </div>
        </div>
      </main>
    </div>
  )
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <p className='text-[10px] font-semibold text-primary uppercase tracking-wider mb-1'>{title}</p>
      <p className='text-text-secondary leading-relaxed'>{body}</p>
    </div>
  )
}
