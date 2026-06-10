'use client'

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react'

// Foydalanuvchi tanlovi: aniq dark/light yoki tizimga (OS) ergashish
export type ThemeMode = 'dark' | 'light' | 'system'
// Haqiqatda qo'llanilgan tema (DOM klassi uchun)
type ResolvedTheme = 'dark' | 'light'

interface ThemeContextType {
  /** Foydalanuvchi tanlovi (dark/light/system) */
  mode: ThemeMode
  /** Haqiqatda qo'llanilgan tema (system holatida OS ga qarab hisoblanadi) */
  theme: ResolvedTheme
  setMode: (m: ThemeMode) => void
  toggleTheme: () => void
  /** Eski API (faqat dark/light) — moslik uchun saqlangan */
  setTheme: (t: ResolvedTheme) => void
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'system',
  theme: 'light',
  setMode: () => {},
  toggleTheme: () => {},
  setTheme: () => {},
})

const THEME_KEY = 'med-ai-theme'

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function getInitialMode(): ThemeMode {
  if (typeof window === 'undefined') return 'system'
  // 1) Aniq theme tanlovi (med-ai-theme) ustun turadi
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'dark' || saved === 'light' || saved === 'system') return saved
  } catch { /* ignore */ }
  // 2) Eski auth.preferences.darkMode dan meros
  try {
    const raw = localStorage.getItem('med-ai-auth')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.preferences?.darkMode === true) return 'dark'
      if (parsed?.preferences?.darkMode === false) return 'light'
    }
  } catch { /* ignore */ }
  // 3) Standart — tizimga ergashish
  return 'system'
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === 'system') return systemPrefersDark() ? 'dark' : 'light'
  return mode
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(getInitialMode)
  const [theme, setResolved] = useState<ResolvedTheme>(() => resolveTheme(getInitialMode()))

  // DOM klassini qo'llangan temaga moslash
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('dark', 'light')
    root.classList.add(theme)
  }, [theme])

  // system rejimida OS o'zgarishini real vaqtda kuzatish
  useEffect(() => {
    if (mode !== 'system') {
      setResolved(mode)
      return
    }
    setResolved(systemPrefersDark() ? 'dark' : 'light')
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setResolved(mq.matches ? 'dark' : 'light')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [mode])

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m)
    try {
      localStorage.setItem(THEME_KEY, m)
    } catch { /* ignore */ }
    // Auth store'dagi darkMode'ni ham yangilab turamiz (login bo'lganlar uchun)
    try {
      const raw = localStorage.getItem('med-ai-auth')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (!parsed.preferences) parsed.preferences = {}
        parsed.preferences.darkMode = resolveTheme(m) === 'dark'
        localStorage.setItem('med-ai-auth', JSON.stringify(parsed))
      }
    } catch { /* ignore */ }
  }, [])

  // Eski API: aniq dark/light o'rnatish
  const setTheme = useCallback((t: ResolvedTheme) => {
    setMode(t)
  }, [setMode])

  // dark <-> light o'rtasida almashtirish (joriy ko'rinishga qarab)
  const toggleTheme = useCallback(() => {
    setMode(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setMode])

  return (
    <ThemeContext.Provider value={{ mode, theme, setMode, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
