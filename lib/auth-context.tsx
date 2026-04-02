'use client'

import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useSyncExternalStore,
} from 'react'
import { api, BackendUser } from './api'

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
  token: string
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
  loginWithData: (user: AuthUser) => void
  logout: () => void
  updateUser: (data: Partial<AuthUser>) => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

const STORAGE_KEY = 'med-ai-auth'

// Map backend roles to frontend roles
function mapRole(backendRole: string): UserRole {
  if (backendRole === 'instructor') return 'content-manager'
  if (backendRole === 'admin') return 'admin'
  return 'user'
}

export function backendUserToAuth(bUser: BackendUser, token: string): AuthUser {
  return {
    id: bUser.id,
    username: bUser.username,
    firstName: bUser.firstName,
    lastName: bUser.lastName,
    name: bUser.name,
    email: bUser.email,
    role: mapRole(bUser.role),
    avatar: bUser.avatar,
    token,
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

/* ─── External store ─── */
let listeners: Array<() => void> = []

function emitChange() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener]
  return () => {
    listeners = listeners.filter(l => l !== listener)
  }
}

function getSnapshot(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}

function getServerSnapshot(): string | null {
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  let user: AuthUser | null = null
  if (raw) {
    try {
      user = JSON.parse(raw)
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  const login = useCallback(async (username: string, password: string) => {
    try {
      const res = await api.auth.login(username, password)
      const authUser = backendUserToAuth(res.user, res.token)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser))
      emitChange()
      return { success: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Xatolik yuz berdi"
      return { success: false, error: msg }
    }
  }, [])

  const loginWithData = useCallback((authUser: AuthUser) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser))
    emitChange()
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    emitChange()
  }, [])

  const updateUser = useCallback((data: Partial<AuthUser>) => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    try {
      const current = JSON.parse(raw)
      const updated = { ...current, ...data }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      emitChange()
    } catch {
      // ignore
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, loginWithData, logout, updateUser, isLoading: false }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}


/* Role permission helpers */
export function canAccessAdmin(role: UserRole) {
	return role === 'admin'
}

export function canAccessContentManager(role: UserRole) {
	return role === 'admin' || role === 'content-manager'
}
