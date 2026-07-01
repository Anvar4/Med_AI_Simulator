'use client'

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { api, BackendUser, onSessionExpired, refreshAccessToken, tokenStore } from './api'

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = 'user' | 'content-manager' | 'admin'

export interface AuthUser {
  id: string
  username?: string
  firstName?: string
  lastName?: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  specialty?: string
  university?: string
  hasPassword?: boolean
  isPremium?: boolean
  subscription?: {
    plan: 'free' | 'pro' | 'clinic' | 'university'
    status: 'active' | 'expired' | 'trial'
    expiresAt?: string
    organizationName?: string
  }
  notifications?: {
    email: boolean
    push: boolean
    weekly: boolean
    achievements: boolean
  }
  preferences?: {
    darkMode: boolean
    sound: boolean
    animations: boolean
    language: string
    autoSave: boolean
  }
  referralCode?: string
  discount?: {
    percent: number
    expiresAt: string
  } | null
}

interface AuthContextType {
  user: AuthUser | null
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  loginWithData: (user: AuthUser, accessToken: string) => void
  logout: () => Promise<void>
  updateUser: (data: Partial<AuthUser>) => void
  isLoading: boolean
}

// ─── Role mapping ─────────────────────────────────────────────────────────────

function mapRole(backendRole: string): UserRole {
  if (backendRole === 'instructor') return 'content-manager'
  if (backendRole === 'admin') return 'admin'
  return 'user'
}

export function backendUserToAuth(bUser: BackendUser, _token: string): AuthUser {
  return {
    id: bUser.id,
    username: bUser.username,
    firstName: bUser.firstName,
    lastName: bUser.lastName,
    name: bUser.name,
    email: bUser.email,
    role: mapRole(bUser.role),
    avatar: bUser.avatar,
    specialty: bUser.specialty,
    university: bUser.university,
    hasPassword: bUser.hasPassword,
    isPremium: bUser.isPremium,
    subscription: bUser.subscription,
    notifications: bUser.notifications,
    preferences: bUser.preferences,
    referralCode: bUser.referralCode,
    discount: bUser.discount,
  }
}

// ─── Edge-readable cookies ────────────────────────────────────────────────────
// Non-HttpOnly hint cookies for Next.js Edge middleware subdomain guard.
// These carry no secret — the real auth is the JWT sent as Bearer on every API call.

function setAuthCookies(role: UserRole): void {
  if (typeof document === 'undefined') return
  const secure = location.protocol === 'https:'
  const flags = `path=/; SameSite=Strict${secure ? '; Secure' : ''}`
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString()
  document.cookie = `auth-token=1; expires=${expires}; ${flags}`
  document.cookie = `user-role=${encodeURIComponent(role)}; expires=${expires}; ${flags}`
}

function clearAuthCookies(): void {
  if (typeof document === 'undefined') return
  const past = 'Thu, 01 Jan 1970 00:00:00 GMT'
  document.cookie = `auth-token=; expires=${past}; path=/`
  document.cookie = `user-role=; expires=${past}; path=/`
}

// ─── LocalStorage helpers ─────────────────────────────────────────────────────
// Only the public user profile is persisted. The access token is in-memory only;
// the refresh token lives in the HttpOnly cookie managed by the backend.

const STORAGE_KEY = 'med-ai-user'

function readUserFromStorage(): AuthUser | null {
  if (typeof window === 'undefined') return null
  try {
    // Support the legacy key used before this refactor
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem('med-ai-auth')
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthUser & { token?: string }
    // Strip legacy embedded token field
    const { token: _tok, ...rest } = parsed
    void _tok
    return rest as AuthUser
  } catch {
    safeRemoveStorage()
    return null
  }
}

function writeUserToStorage(user: AuthUser): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  } catch { /* quota exceeded — ignore */ }
}

function safeRemoveStorage(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem('med-ai-auth')
  } catch { /* ignore */ }
}

// ─── Refresh interval ─────────────────────────────────────────────────────────
// Token lifetime = 15 min. Refresh every 10 min so there is always a valid token.

const REFRESH_INTERVAL_MS = 10 * 60 * 1000

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialize synchronously from localStorage so there is no blank flash.
  const [user, setUser] = useState<AuthUser | null>(() => readUserFromStorage())
  // isLoading = true until the server refresh check completes on mount.
  const [isLoading, setIsLoading] = useState(true)

  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Track whether we have an active, server-confirmed session.
  // This prevents the proactive interval from running when logged out.
  const sessionActiveRef = useRef(false)

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const stopRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current)
      refreshTimerRef.current = null
    }
  }, [])

  const applySession = useCallback((authUser: AuthUser, accessToken: string) => {
    tokenStore.set(accessToken)
    writeUserToStorage(authUser)
    setAuthCookies(authUser.role)
    sessionActiveRef.current = true
    setUser(authUser)
  }, [])

  const clearSession = useCallback(() => {
    stopRefreshTimer()
    tokenStore.clear()
    safeRemoveStorage()
    clearAuthCookies()
    sessionActiveRef.current = false
    setUser(null)
  }, [stopRefreshTimer])

  // ── Proactive refresh ─────────────────────────────────────────────────────

  const startRefreshTimer = useCallback(() => {
    stopRefreshTimer()
    refreshTimerRef.current = setInterval(async () => {
      // Guard: only refresh when we have an active session
      if (!sessionActiveRef.current) {
        stopRefreshTimer()
        return
      }
      const newToken = await refreshAccessToken()
      if (!newToken) {
        clearSession()
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = '/login?reason=session-expired'
        }
      }
    }, REFRESH_INTERVAL_MS)
  }, [stopRefreshTimer, clearSession])

  // ── Mount: verify session via refresh-token cookie ────────────────────────
  // We have the user profile from localStorage, but we must confirm with the
  // server that the refresh-token cookie is still valid before treating the
  // session as live. This prevents stale state after logout from another tab.

  useEffect(() => {
    let cancelled = false

    async function verifySession() {
      const storedUser = readUserFromStorage()

      if (!storedUser) {
        // No stored profile — definitely not logged in; skip the network call.
        if (!cancelled) {
          sessionActiveRef.current = false
          setIsLoading(false)
        }
        return
      }

      // We have a stored profile. Confirm the refresh-token cookie is valid.
      const newToken = await refreshAccessToken()

      if (cancelled) return

      if (newToken) {
        // Session confirmed: update in-memory token and cookies.
        tokenStore.set(newToken)
        setAuthCookies(storedUser.role)
        sessionActiveRef.current = true
        // User state is already set from the useState initializer — no flicker.
        startRefreshTimer()
      } else {
        // Refresh cookie gone or expired — clear stale localStorage profile.
        clearSession()
      }

      setIsLoading(false)
    }

    verifySession()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Listen for session-expired events from api.ts ─────────────────────────

  useEffect(() => {
    const unsub = onSessionExpired(() => {
      clearSession()
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login?reason=session-expired'
      }
    })
    return unsub
  }, [clearSession])

  // ── Cleanup on unmount ────────────────────────────────────────────────────

  useEffect(() => {
    return () => stopRefreshTimer()
  }, [stopRefreshTimer])

  // ── Cross-tab sync ────────────────────────────────────────────────────────
  // If the user logs out (or in) from another tab, sync state here.

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY && e.key !== 'med-ai-auth') return
      if (e.newValue === null) {
        // Logged out in another tab
        stopRefreshTimer()
        tokenStore.clear()
        clearAuthCookies()
        sessionActiveRef.current = false
        setUser(null)
      } else {
        // Logged in from another tab — read the new profile
        const freshUser = readUserFromStorage()
        if (freshUser) setUser(freshUser)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [stopRefreshTimer])

  // ── login ─────────────────────────────────────────────────────────────────

  const login = useCallback(async (username: string, password: string) => {
    try {
      const res = await api.auth.login(username, password)
      const authUser = backendUserToAuth(res.user, res.token)
      applySession(authUser, res.token)
      startRefreshTimer()
      return { success: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Xatolik yuz berdi'
      return { success: false, error: msg }
    }
  }, [applySession, startRefreshTimer])

  // ── loginWithData ─────────────────────────────────────────────────────────

  const loginWithData = useCallback((authUser: AuthUser, accessToken: string) => {
    applySession(authUser, accessToken)
    startRefreshTimer()
  }, [applySession, startRefreshTimer])

  // ── logout ────────────────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    // Mark session inactive first to stop any in-flight refresh from re-setting state.
    sessionActiveRef.current = false
    stopRefreshTimer()
    // Best-effort server call to revoke the refresh cookie and JTI.
    await api.auth.logout()
    clearSession()
  }, [stopRefreshTimer, clearSession])

  // ── updateUser ────────────────────────────────────────────────────────────

  const updateUser = useCallback((data: Partial<AuthUser>) => {
    setUser(prev => {
      if (!prev) return null
      const updated = { ...prev, ...data }
      writeUserToStorage(updated)
      setAuthCookies(updated.role)
      return updated
    })
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, loginWithData, logout, updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

// ─── Role permission helpers ──────────────────────────────────────────────────

export function canAccessAdmin(role: UserRole): boolean {
  return role === 'admin'
}

export function canAccessContentManager(role: UserRole): boolean {
  return role === 'admin' || role === 'content-manager'
}
