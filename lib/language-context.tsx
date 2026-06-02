'use client'

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useSyncExternalStore,
} from 'react'
import { Locale, t as translate } from './i18n'

/**
 * Reactive i18n layer on top of the static dictionary in lib/i18n.ts.
 *
 * The active locale is persisted in localStorage and broadcast via a custom
 * event so every `useT()` consumer re-renders when the language changes — no
 * page reload required. The locale also mirrors into the auth user's
 * `preferences.language` (handled by the settings page) for backend persistence.
 */
const LOCALE_KEY = 'med-ai-language'
const LOCALE_EVENT = 'med-ai-language-changed'
const SUPPORTED: Locale[] = ['uz', 'ru', 'en']

function readLocale(): Locale {
  if (typeof window === 'undefined') return 'uz'
  const v = window.localStorage.getItem(LOCALE_KEY)
  if (v && SUPPORTED.includes(v as Locale)) return v as Locale
  // Fall back to the auth user's stored preference, if any.
  try {
    const raw = window.localStorage.getItem('med-ai-auth')
    if (raw) {
      const parsed = JSON.parse(raw)
      const pref = parsed?.preferences?.language
      if (pref && SUPPORTED.includes(pref)) return pref as Locale
    }
  } catch { /* ignore */ }
  return 'uz'
}

let listeners: Array<() => void> = []
function subscribe(listener: () => void) {
  listeners = [...listeners, listener]
  const onStorage = (e: StorageEvent) => { if (!e.key || e.key === LOCALE_KEY) listener() }
  const onChange = () => listener()
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', onStorage)
    window.addEventListener(LOCALE_EVENT, onChange)
  }
  return () => {
    listeners = listeners.filter(l => l !== listener)
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(LOCALE_EVENT, onChange)
    }
  }
}

function setLocaleGlobal(locale: Locale) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(LOCALE_KEY, locale)
  document.documentElement.lang = locale
  for (const l of listeners) l()
  window.dispatchEvent(new Event(LOCALE_EVENT))
}

interface LanguageContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribe, readLocale, () => 'uz' as Locale)
  const setLocale = useCallback((l: Locale) => setLocaleGlobal(l), [])
  const t = useCallback((key: string) => translate(key, locale), [locale])
  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

/** Access the translate function + current locale reactively. */
export function useT(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    // Safe fallback outside the provider — static uz translation.
    return { locale: 'uz', setLocale: () => {}, t: (key: string) => translate(key, 'uz') }
  }
  return ctx
}
