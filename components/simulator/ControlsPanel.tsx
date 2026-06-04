'use client'

import { motion } from 'framer-motion'
import { Activity, Brain, ChevronRight, Droplets, Heart, Search, Thermometer, Wind, X } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useT } from '@/lib/language-context'
import type { Locale } from '@/lib/i18n'
import { Organ, ORGAN_CATEGORIES, ORGANS, OrganCategory, tl } from '@/lib/organs-data'

const ORGAN_ICONS: Record<string, React.ReactNode> = {
  heart: <Heart className='w-4 h-4' />,
  lungs: <Wind className='w-4 h-4' />,
  liver: <Activity className='w-4 h-4' />,
  kidney: <Droplets className='w-4 h-4' />,
  brain: <Brain className='w-4 h-4' />,
  stomach: <Activity className='w-4 h-4' />,
  thyroid: <Thermometer className='w-4 h-4' />,
}

interface ControlsPanelProps {
  selectedOrgan: string
  onOrganChange: (key: string) => void
}

export default function ControlsPanel({ selectedOrgan, onOrganChange }: ControlsPanelProps) {
  const { locale } = useT()
  const lc = locale as Locale
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<OrganCategory | 'all'>('all')

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return ORGANS.filter(o => {
      const matchSearch = !q
        || tl(o.name, lc).toLowerCase().includes(q)
        || o.parts.some(p => tl(p.name, lc).toLowerCase().includes(q))
      const matchCat = category === 'all' || o.category === category
      return matchSearch && matchCat
    })
  }, [search, category, lc])

  const select = useCallback((o: Organ) => {
    onOrganChange(o.key)
    setSearch('')
  }, [onOrganChange])

  const current = ORGANS.find(o => o.key === selectedOrgan)

  return (
    <div className='flex flex-col gap-4'>
      {/* Search */}
      <div className='relative'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none' />
        <input
          type='text'
          placeholder='Yozing: yurak, jigar, miya...'
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoComplete='off'
          spellCheck={false}
          className='w-full pl-10 pr-10 py-2.5 text-sm bg-surface-light border border-border rounded-xl text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all'
        />
        {search && (
          <button onClick={() => setSearch('')} className='absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors'>
            <X className='w-4 h-4' />
          </button>
        )}
      </div>

      {/* Active organ */}
      <div className='px-3 py-2.5 rounded-xl bg-surface-light border border-border'>
        <p className='text-[10px] text-text-secondary uppercase tracking-wider mb-0.5'>Hozirgi a&apos;zo</p>
        <p className='text-sm font-semibold text-text-primary truncate'>{current ? tl(current.name, lc) : '—'}</p>
      </div>

      {/* Category filter */}
      <div className='flex gap-1 flex-wrap'>
        {ORGAN_CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
              category === cat.value ? 'bg-primary text-white' : 'bg-surface-light text-text-secondary hover:text-text-primary'
            }`}
          >
            {tl(cat.label, lc)}
          </button>
        ))}
      </div>

      <div className='border-t border-border' />

      {/* Organ list */}
      <div className='flex flex-col gap-1.5 pb-4'>
        <p className='text-[10px] font-semibold text-text-secondary uppercase tracking-wider'>
          {search ? `Natijalar (${filtered.length})` : `A'zolar (${ORGANS.length})`}
        </p>

        {filtered.length === 0 ? (
          <div className='text-center py-6 text-text-secondary'>
            <Search className='w-7 h-7 mx-auto mb-2 opacity-30' />
            <p className='text-sm'>&quot;{search}&quot; topilmadi</p>
          </div>
        ) : (
          filtered.map(organ => {
            const isActive = selectedOrgan === organ.key
            return (
              <motion.button
                key={organ.key}
                layout
                onClick={() => select(organ)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left border transition-all duration-200 ${
                  isActive ? 'bg-primary/10 border-primary/30' : 'bg-surface-light border-transparent hover:border-border'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  isActive ? 'bg-primary/20 text-primary' : 'bg-surface text-text-secondary'
                }`}>
                  {ORGAN_ICONS[organ.key] ?? <Activity className='w-4 h-4' />}
                </div>
                <div className='min-w-0 flex-1'>
                  <p className={`text-sm font-medium truncate ${isActive ? 'text-primary' : 'text-text-primary'}`}>
                    {tl(organ.name, lc)}
                  </p>
                  <p className='text-[10px] text-text-secondary'>{organ.parts.length} qism</p>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-primary' : 'text-text-secondary'}`} />
              </motion.button>
            )
          })
        )}
      </div>
    </div>
  )
}
