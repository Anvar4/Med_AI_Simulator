'use client'

import { useT } from '@/lib/language-context'
import { Info, X } from 'lucide-react'
import Link from 'next/link'
import { useSyncExternalStore } from 'react'

const DISMISS_KEY = 'med-ai-beta-dismissed'
const EVENT = 'med-ai-beta-dismissed-changed'

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb)
  window.addEventListener('storage', cb)
  return () => {
    window.removeEventListener(EVENT, cb)
    window.removeEventListener('storage', cb)
  }
}
const getSnapshot = () => localStorage.getItem(DISMISS_KEY) === '1'
const getServerSnapshot = () => true // hidden on the server to avoid hydration flash

/**
 * Site-wide beta notice at the very top. Localized via useT() so it switches
 * with the language, and dismissible (persisted in localStorage).
 */
export default function BetaBanner() {
  const { t } = useT()
  const dismissed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  if (dismissed) return null

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    window.dispatchEvent(new Event(EVENT))
  }

  return (
    <div className='relative z-60 bg-primary text-white text-center text-xs sm:text-sm px-10 py-2 flex items-center justify-center gap-2'>
      <Info className='w-4 h-4 shrink-0' />
      <span>
        {t('beta.message')}{' '}
        <Link href='/contact' className='underline font-semibold hover:opacity-90'>
          {t('beta.contact')}
        </Link>
      </span>
      <button
        onClick={dismiss}
        aria-label='Yopish'
        className='absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/20 transition-colors'
      >
        <X className='w-4 h-4' />
      </button>
    </div>
  )
}
