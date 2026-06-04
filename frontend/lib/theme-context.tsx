'use client'

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  setTheme: () => {},
})

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  try {
    const raw = localStorage.getItem('med-ai-auth')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.preferences?.darkMode === true) return 'dark'
    }
  } catch { /* ignore */ }
  return 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('dark', 'light')
    root.classList.add(theme)
  }, [theme])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    // Also update the auth store's preference
    try {
      const raw = localStorage.getItem('med-ai-auth')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (!parsed.preferences) parsed.preferences = {}
        parsed.preferences.darkMode = t === 'dark'
        localStorage.setItem('med-ai-auth', JSON.stringify(parsed))
      }
    } catch { /* ignore */ }
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
