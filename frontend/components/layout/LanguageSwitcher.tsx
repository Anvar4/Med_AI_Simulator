'use client'

import { Locale } from '@/lib/i18n'
import { useT } from '@/lib/language-context'
import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

/* ─── Kichik SVG bayroqlar (tashqi rasm yo'q, har platformada bir xil) ─── */

function FlagUZ({ className = '' }: { className?: string }) {
  return (
    <svg viewBox='0 0 24 16' className={className} aria-hidden>
      <rect width='24' height='16' rx='2' fill='#fff' />
      <rect width='24' height='5' rx='2' fill='#0099B5' />
      <rect y='11' width='24' height='5' rx='2' fill='#1EB53A' />
      <rect y='5.4' width='24' height='5.2' fill='#CE1126' />
      <rect y='5.9' width='24' height='4.2' fill='#fff' />
      <circle cx='4.6' cy='2.5' r='1.6' fill='#fff' />
      <circle cx='5.3' cy='2.5' r='1.6' fill='#0099B5' />
      <g fill='#fff'>
        <circle cx='6.6' cy='1.3' r='0.3' />
        <circle cx='7.8' cy='1.3' r='0.3' />
        <circle cx='9' cy='1.3' r='0.3' />
        <circle cx='7.2' cy='2.5' r='0.3' />
        <circle cx='8.4' cy='2.5' r='0.3' />
        <circle cx='7.8' cy='3.7' r='0.3' />
        <circle cx='9' cy='3.7' r='0.3' />
      </g>
    </svg>
  )
}

function FlagRU({ className = '' }: { className?: string }) {
  return (
    <svg viewBox='0 0 24 16' className={className} aria-hidden>
      <rect width='24' height='16' rx='2' fill='#fff' />
      <rect y='5.33' width='24' height='5.34' fill='#0039A6' />
      <rect y='10.67' width='24' height='5.33' rx='2' fill='#D52B1E' />
    </svg>
  )
}

function FlagEN({ className = '' }: { className?: string }) {
  // Buyuk Britaniya (Union Jack) — soddalashtirilgan
  return (
    <svg viewBox='0 0 24 16' className={className} aria-hidden>
      <clipPath id='gb-r'><rect width='24' height='16' rx='2' /></clipPath>
      <g clipPath='url(#gb-r)'>
        <rect width='24' height='16' fill='#012169' />
        <path d='M0 0l24 16M24 0L0 16' stroke='#fff' strokeWidth='3.2' />
        <path d='M0 0l24 16M24 0L0 16' stroke='#C8102E' strokeWidth='1.8' />
        <path d='M12 0v16M0 8h24' stroke='#fff' strokeWidth='5.3' />
        <path d='M12 0v16M0 8h24' stroke='#C8102E' strokeWidth='3.2' />
      </g>
    </svg>
  )
}

const LANGS: { code: Locale; label: string; short: string; Flag: typeof FlagUZ }[] = [
  { code: 'uz', label: "O'zbekcha", short: 'UZ', Flag: FlagUZ },
  { code: 'ru', label: 'Русский', short: 'RU', Flag: FlagRU },
  { code: 'en', label: 'English', short: 'EN', Flag: FlagEN },
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
  const CurrentFlag = current.Flag

  return (
    <div ref={ref} className='relative'>
      <button
        type='button'
        onClick={() => setOpen(o => !o)}
        className='flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm text-text-secondary hover:text-primary hover:bg-surface-light transition-colors'
        aria-label='Til tanlash'
      >
        <CurrentFlag className='w-5 h-3.5 rounded-xs shadow-sm ring-1 ring-black/5' />
        {!compact && <span className='font-medium'>{current.short}</span>}
        <ChevronDown className='w-3.5 h-3.5 opacity-60' />
      </button>
      {open && (
        <div className='absolute right-0 mt-1 w-40 rounded-xl border border-border bg-surface shadow-lg py-1 z-50'>
          {LANGS.map(l => {
            const Flag = l.Flag
            return (
              <button
                key={l.code}
                onClick={() => { setLocale(l.code); setOpen(false) }}
                className={`flex items-center gap-2.5 w-full text-left px-3 py-2 text-sm transition-colors ${
                  l.code === locale ? 'text-primary font-semibold bg-primary/5' : 'text-text-secondary hover:bg-surface-light'
                }`}
              >
                <Flag className='w-5 h-3.5 rounded-xs shadow-sm ring-1 ring-black/5 shrink-0' />
                {l.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
