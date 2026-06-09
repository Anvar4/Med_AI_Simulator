'use client'

import { ThemeMode, useTheme } from '@/lib/theme-context'
import { useT } from '@/lib/language-context'
import { Monitor, Moon, Sun } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const MODES: { mode: ThemeMode; icon: typeof Sun; labelKey: string; fallback: string }[] = [
  { mode: 'light', icon: Sun, labelKey: 'theme.light', fallback: "Yorug'" },
  { mode: 'dark', icon: Moon, labelKey: 'theme.dark', fallback: "Qorong'i" },
  { mode: 'system', icon: Monitor, labelKey: 'theme.system', fallback: 'Tizim' },
]

/** Dark / Light / System (avtomatik) tema almashtirgich — har joyda ishlaydi. */
export default function ThemeSwitcher() {
  const { mode, setMode } = useTheme()
  const { t } = useT()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const current = MODES.find(m => m.mode === mode) ?? MODES[2]
  const CurrentIcon = current.icon

  return (
    <div ref={ref} className='relative'>
      <button
        type='button'
        onClick={() => setOpen(o => !o)}
        className='flex items-center justify-center w-9 h-9 rounded-lg text-text-secondary hover:text-primary hover:bg-surface-light transition-colors'
        aria-label='Tema tanlash'
      >
        <CurrentIcon className='w-[18px] h-[18px]' />
      </button>
      {open && (
        <div className='absolute right-0 mt-1 w-40 rounded-xl border border-border bg-surface shadow-lg py-1 z-50'>
          {MODES.map(m => {
            const Icon = m.icon
            return (
              <button
                key={m.mode}
                onClick={() => { setMode(m.mode); setOpen(false) }}
                className={`flex items-center gap-2.5 w-full text-left px-3 py-2 text-sm transition-colors ${
                  m.mode === mode ? 'text-primary font-semibold bg-primary/5' : 'text-text-secondary hover:bg-surface-light'
                }`}
              >
                <Icon className='w-4 h-4 shrink-0' />
                {t(m.labelKey) === m.labelKey ? m.fallback : t(m.labelKey)}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
