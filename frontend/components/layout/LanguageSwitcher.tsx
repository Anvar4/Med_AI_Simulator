'use client'

import { Locale } from '@/lib/i18n'
import { useT } from '@/lib/language-context'
import { Globe } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const LANGS: { code: Locale; label: string; short: string }[] = [
  { code: 'uz', label: "O'zbekcha", short: 'UZ' },
  { code: 'ru', label: 'Русский', short: 'RU' },
  { code: 'en', label: 'English', short: 'EN' },
]

/** Compact globe dropdown to switch the UI language anywhere (incl. logged-out). */
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
        className='flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-text-secondary hover:text-primary hover:bg-surface-light transition-colors'
        aria-label='Til tanlash'
      >
        <Globe className='w-4 h-4' />
        {!compact && <span className='font-medium'>{current.short}</span>}
      </button>
      {open && (
        <div className='absolute right-0 mt-1 w-36 rounded-xl border border-border bg-surface shadow-lg py-1 z-50'>
          {LANGS.map(l => (
            <button
              key={l.code}
              onClick={() => { setLocale(l.code); setOpen(false) }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                l.code === locale ? 'text-primary font-semibold bg-primary/5' : 'text-text-secondary hover:bg-surface-light'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
