'use client'

import { motion } from 'framer-motion'
import { Box, ChevronRight, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useT } from '@/lib/language-context'
import type { Locale } from '@/lib/i18n'
import { AnatomyModel, ANATOMY_CATEGORIES, ANATOMY_MODELS } from '@/lib/anatomy-models'

interface ControlsPanelProps {
  selectedId: string
  onSelect: (id: string) => void
}

export default function ControlsPanel({ selectedId, onSelect }: ControlsPanelProps) {
  const { locale } = useT()
  const lc = locale as Locale
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('Barchasi')

  const title = (m: AnatomyModel) => (lc === 'en' ? m.titleEn : m.titleUz)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return ANATOMY_MODELS.filter(m => {
      const matchSearch = !q
        || m.titleUz.toLowerCase().includes(q)
        || m.titleEn.toLowerCase().includes(q)
        || (m.note?.toLowerCase().includes(q) ?? false)
      const matchCat = category === 'Barchasi' || m.category === category
      return matchSearch && matchCat
    })
  }, [search, category])

  const current = ANATOMY_MODELS.find(m => m.id === selectedId)

  return (
    <div className='flex flex-col gap-4'>
      {/* Search */}
      <div className='relative'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none' />
        <input
          type='text'
          placeholder='Yozing: skelet, yurak, jigar...'
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

      {/* Active model */}
      <div className='px-3 py-2.5 rounded-xl bg-surface-light border border-border'>
        <p className='text-[10px] text-text-secondary uppercase tracking-wider mb-0.5'>Hozirgi model</p>
        <p className='text-sm font-semibold text-text-primary truncate'>{current ? title(current) : '—'}</p>
      </div>

      {/* Category filter */}
      <div className='flex gap-1 flex-wrap'>
        {ANATOMY_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
              category === cat ? 'bg-primary text-white' : 'bg-surface-light text-text-secondary hover:text-text-primary'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className='border-t border-border' />

      {/* Model list */}
      <div className='flex flex-col gap-1.5 pb-4'>
        <p className='text-[10px] font-semibold text-text-secondary uppercase tracking-wider'>
          {search ? `Natijalar (${filtered.length})` : `Modellar (${ANATOMY_MODELS.length})`}
        </p>

        {filtered.length === 0 ? (
          <div className='text-center py-6 text-text-secondary'>
            <Search className='w-7 h-7 mx-auto mb-2 opacity-30' />
            <p className='text-sm'>&quot;{search}&quot; topilmadi</p>
          </div>
        ) : (
          filtered.map(model => {
            const isActive = selectedId === model.id
            return (
              <motion.button
                key={model.id}
                layout
                onClick={() => onSelect(model.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left border transition-all duration-200 ${
                  isActive ? 'bg-primary/10 border-primary/30' : 'bg-surface-light border-transparent hover:border-border'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  isActive ? 'bg-primary/20 text-primary' : 'bg-surface text-text-secondary'
                }`}>
                  <Box className='w-4 h-4' />
                </div>
                <div className='min-w-0 flex-1'>
                  <p className={`text-sm font-medium truncate ${isActive ? 'text-primary' : 'text-text-primary'}`}>
                    {title(model)}
                  </p>
                  <p className='text-[10px] text-text-secondary truncate'>{model.category}</p>
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
