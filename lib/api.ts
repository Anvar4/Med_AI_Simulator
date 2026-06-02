const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
const STORAGE_KEY = 'med-ai-auth'
const AUTH_CHANGE_EVENT = 'med-ai-auth-changed'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem('med-ai-auth')
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    return parsed.token || null
  } catch {
    return null
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })

  let data: unknown = null
  try {
    data = await res.json()
  } catch {
    data = null
  }

  if (!res.ok) {
    const message =
      typeof data === 'object' && data !== null && 'message' in data
        ? String((data as { message?: unknown }).message ?? '')
        : ''

    // Auto-reset stale sessions for protected endpoints.
    if (res.status === 401 && typeof window !== 'undefined' && !path.startsWith('/auth/')) {
      localStorage.removeItem(STORAGE_KEY)
      window.dispatchEvent(new Event(AUTH_CHANGE_EVENT))

      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login?reason=session-expired'
      }

      throw new Error('Sessiya muddati tugagan. Qayta tizimga kiring.')
    }

    throw new Error(message || 'Server xatosi')
  }
  return data as T
}

// ─── Auth API ─────────────────────────────────────────────────

export const api = {
  auth: {
    login: (username: string, password: string) =>
      request<{ token: string; user: BackendUser }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),

    google: (credential: string) =>
      request<{ token: string; user: BackendUser }>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential }),
      }),

    googleAccessToken: (accessToken: string) =>
      request<{ token: string; user: BackendUser }>('/auth/google-access-token', {
        method: 'POST',
        body: JSON.stringify({ accessToken }),
      }),

    sendOTP: (email: string, type: 'register' | 'password-reset') =>
      request<{ message: string }>('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ email, type }),
      }),

    verifyOTP: (email: string, code: string, type: string) =>
      request<{ verified: boolean; tempToken: string }>('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, code, type }),
      }),

    completeRegister: (tempToken: string, firstName: string, lastName: string, username: string, password: string, avatar?: string, referralCode?: string) =>
      request<{ token: string; user: BackendUser }>('/auth/complete-register', {
        method: 'POST',
        body: JSON.stringify({ tempToken, firstName, lastName, username, password, avatar, referralCode }),
      }),

    forgotPassword: (email: string) =>
      request<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),

    resetPassword: (tempToken: string, newUsername: string, newPassword: string) =>
      request<{ token: string; user: BackendUser; message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ tempToken, newUsername, newPassword }),
      }),

    getMe: () =>
      request<{ user: BackendUser }>('/auth/me'),

    updateProfile: (data: Partial<BackendUser>) =>
      request<{ user: BackendUser }>('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    requestPasswordChange: (newPassword: string) =>
      request<{ message: string }>('/auth/request-password-change', {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
      }),

    confirmPasswordChange: (code: string) =>
      request<{ message: string }>('/auth/confirm-password-change', {
        method: 'POST',
        body: JSON.stringify({ code }),
      }),

    requestEmailChange: (newEmail: string) =>
      request<{ message: string }>('/auth/request-email-change', {
        method: 'POST',
        body: JSON.stringify({ newEmail }),
      }),

    confirmEmailChange: (code: string) =>
      request<{ message: string; newEmail: string }>('/auth/confirm-email-change', {
        method: 'POST',
        body: JSON.stringify({ code }),
      }),
    requestUsernameChange: (newUsername: string) =>
      request<{ message: string }>('/auth/request-username-change', {
        method: 'POST',
        body: JSON.stringify({ newUsername }),
      }),

    confirmUsernameChange: (code: string) =>
      request<{ message: string; user: BackendUser }>('/auth/confirm-username-change', {
        method: 'POST',
        body: JSON.stringify({ code }),
      }),

    sendOTPWithUsername: (email: string, username: string) =>
      request<{ message: string }>('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ email, type: 'register', username }),
      }),
  },

  // ─── Stats API ────────────────────────────────────────────────
  stats: {
    getMyStats: () =>
      request<{ status: string; stats: UserStats }>('/stats/me'),

    getMyAnalysis: () =>
      request<{ status: string; analysis: UserAnalysis }>('/stats/analysis'),

    getLeaderboard: () =>
      request<{ status: string; leaderboard: LeaderboardEntry[]; currentUserRank: LeaderboardEntry | null }>('/stats/leaderboard'),
  },

  // ─── Admin API ────────────────────────────────────────────────
  admin: {
    getSystemStats: () =>
      request<{ status: string; stats: AdminStats }>('/admin/stats'),

    getRecentActivity: () =>
      request<{ status: string; recentUsers: BackendUser[]; recentAttempts: unknown[] }>('/admin/activity'),

    getUsers: (params?: { search?: string; role?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams()
      if (params?.search) q.set('search', params.search)
      if (params?.role) q.set('role', params.role)
      if (params?.page) q.set('page', String(params.page))
      if (params?.limit) q.set('limit', String(params.limit))
      return request<{ status: string; users: BackendUser[]; total: number; totalPages: number }>(`/admin/users?${q}`)
    },

    getUserById: (id: string) =>
      request<{ status: string; user: BackendUser; attempts: number }>(`/admin/users/${id}`),

    createUser: (data: {
      firstName: string; lastName: string; email: string; username: string
      password: string; role: string; specialty?: string; university?: string
    }) =>
      request<{ status: string; user: BackendUser }>('/admin/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateUser: (id: string, data: { role?: string; isPremium?: boolean }) =>
      request<{ status: string; user: BackendUser }>(`/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    deleteUser: (id: string) =>
      request<{ status: string; message: string }>(`/admin/users/${id}`, { method: 'DELETE' }),

    generatePromoCodes: (data: {
      type: string; duration: number; count: number
      maxUses?: number; organizationName?: string; expiresInDays?: number
    }) =>
      request<{ status: string; count: number; codes: PromoCode[] }>('/admin/promo-codes', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getPromoCodes: (params?: { type?: string; isActive?: boolean; page?: number }) => {
      const q = new URLSearchParams()
      if (params?.type) q.set('type', params.type)
      if (params?.isActive !== undefined) q.set('isActive', String(params.isActive))
      if (params?.page) q.set('page', String(params.page))
      return request<{ status: string; codes: PromoCode[]; total: number }>(`/admin/promo-codes?${q}`)
    },

    exportPromoCodesUrl: (type?: string) => {
      const token = getToken()
      const q = new URLSearchParams()
      if (type) q.set('type', type)
      return `${API_URL}/admin/promo-codes/export?${q}&token=${token || ''}`
    },

    getCategories: () =>
      request<{ status: string; categories: AdminCategory[] }>('/admin/categories'),

    createCategory: (name: string) =>
      request<{ status: string; category: AdminCategory }>('/admin/categories', {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),

    deleteCategory: (id: string) =>
      request<{ status: string; message: string }>(`/admin/categories/${id}`, { method: 'DELETE' }),

    updateCategory: (id: string, name: string) =>
      request<{ status: string; category: AdminCategory }>(`/admin/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      }),

    getAnalytics: () =>
      request<{ status: string; analytics: AdminAnalytics }>('/admin/analytics'),
  },

  // ─── Subscriptions API ────────────────────────────────────────
  subscriptions: {
    getPlans: () =>
      request<{ status: string; plans: SubscriptionPlan[] }>('/subscriptions/plans'),

    getMy: () =>
      request<{ status: string; isPremium: boolean; subscription: UserSubscription }>('/subscriptions/my'),

    applyPromoCode: (code: string) =>
      request<{ status: string; message: string; subscription: UserSubscription; expiresAt: string }>('/subscriptions/apply-promo', {
        method: 'POST',
        body: JSON.stringify({ code }),
      }),

    subscribe: (planId: string, period: 'monthly' | 'yearly') =>
      request<{ status: string; message: string; paymentRequestId: string; price: number; originalPrice: number; discountPercent: number }>('/subscriptions/subscribe', {
        method: 'POST',
        body: JSON.stringify({ planId, period }),
      }),

    getReferralInfo: () =>
      request<{ status: string; referralCode: string; referredTotal: number; referredPremium: number; discount: { percent: number; expiresAt: string } | null }>('/subscriptions/referral'),
  },

  // ─── Cases API ────────────────────────────────────────────────
  cases: {
    getAll: (params?: { category?: string; type?: string; difficulty?: number; search?: string; page?: number; limit?: number; status?: string; withMedia?: boolean }) => {
      const q = new URLSearchParams()
      if (params?.category) q.set('category', params.category)
      if (params?.type) q.set('type', params.type)
      if (params?.difficulty) q.set('difficulty', String(params.difficulty))
      if (params?.search) q.set('search', params.search)
      if (params?.page) q.set('page', String(params.page))
      if (params?.limit) q.set('limit', String(params.limit))
      if (params?.status) q.set('status', params.status)
      if (params?.withMedia !== undefined) q.set('withMedia', String(params.withMedia))
      return request<{ status: string; cases: BackendCase[]; total: number; totalPages: number; currentPage: number }>(`/cases?${q}`)
    },

    getById: (id: string) =>
      request<{ status: string; case: BackendCase }>(`/cases/${id}`),

    getCategories: () =>
      request<{ status: string; categories: string[]; typeCounts: { _id: string; count: number }[]; categoryCounts: { _id: string; count: number }[] }>('/cases/categories'),

    create: (data: Partial<BackendCase>) =>
      request<{ status: string; case: BackendCase }>('/cases', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<BackendCase>) =>
      request<{ status: string; case: BackendCase }>(`/cases/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      request<{ status: string; message: string }>(`/cases/${id}`, { method: 'DELETE' }),

    getMine: (params?: { category?: string; search?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams()
      if (params?.category) q.set('category', params.category)
      if (params?.search) q.set('search', params.search)
      if (params?.page) q.set('page', String(params.page))
      if (params?.limit) q.set('limit', String(params.limit))
      return request<{ status: string; cases: BackendCase[]; total: number }>(`/cases/my?${q}`)
    },

    getCMStats: () =>
      request<{ status: string; stats: { total: number; categoryStats: { _id: string; count: number; avgDifficulty: number; published: number; draft: number; review: number }[]; statusStats: { _id: string; count: number }[] } }>('/cases/cm-stats'),
  },

  // ─── Attempts API ─────────────────────────────────────────────
  attempts: {
    getDashboard: () =>
      request<{ status: string; stats: DashboardStats }>('/attempts/dashboard'),

    getMy: (params?: { status?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams()
      if (params?.status) q.set('status', params.status)
      if (params?.page) q.set('page', String(params.page))
      if (params?.limit) q.set('limit', String(params.limit))
      return request<{ status: string; attempts: Attempt[]; total: number }>(`/attempts/my?${q}`)
    },

    start: (caseId: string) =>
      request<{ status: string; attempt: Attempt }>(`/attempts/start/${caseId}`, { method: 'POST' }),

    submit: (attemptId: string, data: { diagnosis: string; treatment: string; selectedTests: string[]; timeSpent: number }) =>
      request<{ status: string; attempt: Attempt; result: { score: number; feedback: string; correctDiagnosis: string; correctTreatment: string; strengths?: string[]; weaknesses?: string[]; detailedAnalysis?: string } }>(`/attempts/submit/${attemptId}`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // ─── TTS (Aisha Text-to-Speech) ─────────────────────────────
  tts: {
    speak: (text: string, model?: 'gulnoza' | 'jaxongir') =>
      request<{ audioUrl: string }>('/tts', {
        method: 'POST',
        body: JSON.stringify({ text, model: model || 'gulnoza' }),
      }),
  },

  // ─── Chat ────────────────────────────────────────────────────
  chat: {
    send: (messages: { role: 'user' | 'assistant'; content: string }[]) =>
      request<{ status: string; reply: string }>('/chat', {
        method: 'POST',
        body: JSON.stringify({ messages }),
      }),

    sendAnalysis: (messages: { role: 'user' | 'assistant'; content: string }[]) =>
      request<{ status: string; reply: string }>('/chat/analysis', {
        method: 'POST',
        body: JSON.stringify({ messages }),
      }),
  },

  // ─── Courses (DB-driven video courses) ──────────────────────
  courses: {
    list: (params: { category?: string; search?: string; level?: string; page?: number } = {}) => {
      const qs = new URLSearchParams()
      if (params.category) qs.set('category', params.category)
      if (params.search) qs.set('search', params.search)
      if (params.level) qs.set('level', params.level)
      if (params.page) qs.set('page', String(params.page))
      const suffix = qs.toString() ? `?${qs.toString()}` : ''
      return request<{ status: string; total: number; totalPages: number; currentPage: number; courses: CourseSummary[] }>(
        `/courses${suffix}`
      )
    },

    categories: () =>
      request<{ status: string; categories: { name: string; count: number }[] }>('/courses/categories'),

    get: (idOrSlug: string) =>
      request<{ status: string; course: CourseDetail }>(`/courses/${encodeURIComponent(idOrSlug)}`),

    saveProgress: (videoId: string, positionSeconds: number, completed?: boolean) =>
      request<{ status: string; progress: unknown; certificate: CourseCertificate | null }>(
        `/courses/videos/${videoId}/progress`,
        { method: 'POST', body: JSON.stringify({ positionSeconds, completed }) }
      ),

    myCertificates: () =>
      request<{ status: string; certificates: CourseCertificate[] }>('/courses/certificates/my'),

    verifyCertificate: (serial: string) =>
      request<{ status: string; valid: boolean; certificate?: { serial: string; recipientName: string; courseTitle: string; issuedAt: string } }>(
        `/courses/certificates/verify/${encodeURIComponent(serial)}`
      ),
  },

  // ─── Speech-to-Text (voice input) ──────────────────────────
  stt: {
    transcribe: async (audio: Blob, language: 'uz' | 'ru' | 'en' = 'uz'): Promise<{ status: string; text: string }> => {
      const token = getToken()
      const form = new FormData()
      form.append('audio', audio, 'recording.webm')
      form.append('language', language)
      // Do NOT set Content-Type — the browser adds the multipart boundary.
      const res = await fetch(`${API_URL}/stt`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error((data && data.message) || 'Nutqni aniqlab bo\'lmadi')
      }
      return data as { status: string; text: string }
    },
  },

  // ─── Payments (Click / Payme hosted checkout) ──────────────
  payments: {
    checkout: (paymentRequestId: string, provider: 'click' | 'payme') =>
      request<{ status: string; url: string; provider: string }>(
        `/payments/checkout/${paymentRequestId}?provider=${provider}`
      ),
  },

  // ─── Adaptive learning ──────────────────────────────────────
  learning: {
    path: () =>
      request<{ status: string; path: LearningPathItem[] }>('/learning/path'),

    recommendations: (params: { category?: string; limit?: number } = {}) => {
      const qs = new URLSearchParams()
      if (params.category) qs.set('category', params.category)
      if (params.limit) qs.set('limit', String(params.limit))
      const suffix = qs.toString() ? `?${qs.toString()}` : ''
      return request<{ status: string; recommendations: RecommendedCase[]; targets: { category: string; level: number; struggling: boolean }[] }>(
        `/learning/recommendations${suffix}`
      )
    },
  },
}

// ─── Types ────────────────────────────────────────────────────

export interface LearningPathItem {
  category: string
  stats: { level: 1 | 2 | 3; attempts: number; avgScore: number }[]
  unlockedLevel: 1 | 2 | 3
  recommendation: {
    action: 'start' | 'reinforce' | 'continue' | 'mastered'
    targetLevel: 1 | 2 | 3
  }
}

export type RecommendedCase = Omit<BackendCase, 'correctDiagnosis' | 'correctTreatment'>

export interface CourseSummary {
  _id: string
  title: string
  slug: string
  description: string
  category: string
  author: string
  coverImage?: string
  level: 'beginner' | 'intermediate' | 'advanced'
  isPremium: boolean
  videoCount: number
}

export interface CourseVideo {
  _id: string
  title: string
  description: string
  youtubeId: string
  durationSeconds: number
  order: number
  completed?: boolean
}

export interface CoursePlaylist {
  _id: string
  title: string
  description: string
  order: number
  videos: CourseVideo[]
}

export interface CourseDetail extends CourseSummary {
  locked?: boolean
  playlists: CoursePlaylist[]
  progress: { totalVideos: number; completedVideos: number; percent: number }
}

export interface CourseCertificate {
  _id?: string
  serial: string
  recipientName: string
  courseTitle: string
  issuedAt: string
  course?: { _id: string; title: string; slug: string } | string
}

export interface UserSubscription {
  plan: 'free' | 'pro' | 'clinic' | 'university'
  status: 'active' | 'expired' | 'trial'
  expiresAt?: string
  organizationName?: string
}

export interface BackendUser {
  id: string
  username?: string
  firstName?: string
  lastName?: string
  name: string
  email: string
  role: 'student' | 'instructor' | 'admin'
  avatar?: string
  specialty?: string
  university?: string
  isPremium: boolean
  hasPassword: boolean
  stats: {
    totalCases: number
    avgScore: number
    weeklyCount: number
    streak: number
  }
  subscription?: UserSubscription
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
  createdAt?: string
}

export interface BackendCase {
  _id: string
  caseId: string
  title: string
  authorName: string
  category: string
  difficulty: number
  type: 'diagnostika' | 'jarrohlik' | 'shoshilinch'
  isPremium: boolean
  description?: string
  status: 'draft' | 'review' | 'published' | 'rejected'
  patient: {
    name: string
    age: number
    gender: string
    ageGroup: string
    vitals: { bp: string; hr: string; temp: string; spo2: string }
    complaints: string
    history: string
  }
  mediaItems?: Array<{
    type: 'xray' | 'ekg' | 'echo' | 'image' | 'video'
    fileData: string
    comment: string
    fileName?: string
  }>
  labResults?: Array<{
    name: string
    value: string
    unit: string
    range: string
    status: 'normal' | 'high' | 'low' | 'critical'
  }>
  bloodTest?: Array<{
    name: string; value: string; unit: string; range: string; status: 'normal' | 'high' | 'low' | 'critical'
  }>
  biochemTest?: Array<{
    name: string; value: string; unit: string; range: string; status: 'normal' | 'high' | 'low' | 'critical'
  }>
  urineTest?: Array<{
    name: string; value: string; unit: string; range: string; status: 'normal' | 'high' | 'low' | 'critical'
  }>
  instrumentalTests?: Array<'ekg' | 'uzi' | 'rentgen' | 'kt' | 'mrt' | 'endoskopiya'>
  laboratoryTests?: Array<'qon_analiz' | 'siydik_analiz' | 'bioximik'>
  correctDiagnosis: string
  correctTreatment: string
  tests: string[]
  timeLimit: number
  createdBy?: string
  createdAt: string
  updatedAt: string
}

export interface PromoCode {
  _id: string
  code: string
  type: 'pro' | 'clinic' | 'university'
  duration: number
  maxUses: number
  usedCount: number
  organizationName?: string
  expiresAt: string
  isActive: boolean
  createdAt: string
}

export interface AdminCategory {
  _id: string
  name: string
  createdAt: string
}

export interface LeaderboardEntry {
  rank: number
  userId: string
  name: string
  avatar: string | null
  role: string
  totalCompleted: number
  avgScore: number
  bestScore: number
  totalTimeSpent: number
  isCurrentUser: boolean
}

export interface SubscriptionPlan {
  id: string
  name: string
  nameUz: string
  description: string
  monthlyPrice: number | null
  yearlyPrice: number | null
  currency: string
  features: string[]
  maxUsers: number | null
  contactAdmin?: boolean
}

export interface AdminStats {
  totalUsers: number
  totalCases: number
  totalAttempts: number
  activeUsers: number
  premiumUsers: number
  newUsersThisWeek: number
  userGrowth: number
  avgScore: number
  casesByCategory: { _id: string; count: number }[]
  casesByType: { _id: string; count: number }[]
}

export interface AdminAnalytics {
  categoryMatrix: {
    category: string
    total: number
    diagnostika: number
    jarrohlik: number
    shoshilinch: number
    avgScore: number | null
    attemptCount: number
  }[]
  reviewQueue: {
    _id: string
    caseId: string
    title: string
    category: string
    type: string
    difficulty: number
    status: string
    createdAt: string
  }[]
  statusCounts: {
    draft: number
    review: number
    published: number
    rejected: number
  }
}

export interface UserStats {
  totalAttempts: number
  completedAttempts: number
  avgScore: number
  totalTimeSpent: number
  categoryPerformance: { category: string; avgScore: number; count: number; maxScore: number; minScore: number }[]
  difficultyPerformance: { difficulty: number; avgScore: number; count: number }[]
  typePerformance: { type: string; avgScore: number; count: number }[]
  monthlyActivity: { month: string; count: number; avgScore: number }[]
  recentResults: Attempt[]
  bestResult: Attempt | null
}

export interface UserAnalysis {
  overallAvg: number
  totalCompleted: number
  strengths: { category: string; avgScore: number; count: number }[]
  weaknesses: { category: string; avgScore: number; count: number }[]
  improving: { category: string; avgScore: number; recentScore: number }[]
  recommendations: { category: string; avgScore: number; suggestions: string[] }[]
  positiveAspects: string[]
  negativeAspects: string[]
}

export interface DashboardStats {
  totalCases: number
  avgScore: number
  weeklyCount: number
  streak: number
  categoryScores: { _id: string; avgScore: number; count: number }[]
  weeklyActivity: { _id: number; count: number }[]
  recentAttempts: Attempt[]
  continueCase?: Attempt
}

export interface Attempt {
  _id: string
  user: string
  case: string | BackendCase
  status: 'in-progress' | 'completed' | 'abandoned'
  score: number
  diagnosis: string
  treatment: string
  selectedTests: string[]
  timeSpent: number
  aiFeedback: string
  completedAt?: string
  createdAt: string
}
