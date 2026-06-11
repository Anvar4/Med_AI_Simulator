'use client'

import Flag, { FlagCode } from '@/components/ui/Flag'
import { Locale } from '@/lib/i18n'
import { useT } from '@/lib/language-context'
import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const LANGS: { code: Locale; label: string; short: string }[] = [
  { code: 'uz', label: "O'zbekcha", short: 'UZ' },
  { code: 'ru', label: 'Русский', short: 'RU' },
  { code: 'en', label: 'English', short: 'EN' },
]

/** Bayroqli til almashtirgich — har joyda ishlaydi (login bo'lmaganda ham). */
export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useT()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const current = LANGS.find(l => l.code === locale) ?? LANGS[0]

  return (
    <div ref={ref} className='relative'>
      <button
        type='button'
        onClick={() => setOpen(o => !o)}
        className='flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm text-text-secondary hover:text-primary hover:bg-surface-light transition-colors'
        aria-label='Til tanlash'
      >
        <Flag code={current.code as FlagCode} className='w-5 h-3.5 rounded-xs shadow-sm ring-1 ring-black/5' />
        {!compact && <span className='font-medium'>{current.short}</span>}
        <ChevronDown className='w-3.5 h-3.5 opacity-60' />
      </button>
      {open && (
        <div className='absolute right-0 mt-1 w-40 rounded-xl border border-border bg-surface shadow-lg py-1 z-50'>
          {LANGS.map(l => (
            <button
              key={l.code}
              onClick={() => { setLocale(l.code); setOpen(false) }}
              className={`flex items-center gap-2.5 w-full text-left px-3 py-2 text-sm transition-colors ${
                l.code === locale ? 'text-primary font-semibold bg-primary/5' : 'text-text-secondary hover:bg-surface-light'
              }`}
            >
              <Flag code={l.code as FlagCode} className='w-5 h-3.5 rounded-xs shadow-sm ring-1 ring-black/5 shrink-0' />
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
