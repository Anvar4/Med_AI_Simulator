import './loadEnv'; // MUST be first — loads .env before route modules read process.env
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

import { auditMiddleware } from './middleware/auditLog';
import { errorHandler } from './middleware/errorHandler';
import { ipBlockMiddleware } from './middleware/bruteForce';
import {
  frameGuard,
  hppGuard,
  jsonSizeGuard,
  mongoSanitize,
  noSniff,
  removeFingerprint,
  xssScrub,
} from './middleware/security';
import adminRoutes from './routes/admin';
import attemptRoutes from './routes/attempts';
import authRoutes from './routes/auth';
import balanceRoutes from './routes/balance';
import bookRoutes from './routes/books';
import caseRoutes from './routes/cases';
import chatRoutes from './routes/chat';
import courseRoutes from './routes/courses';
import learningRoutes from './routes/learning';
import paymentRoutes from './routes/payments';
import referralRoutes from './routes/referrals';
import sttRoutes from './routes/stt';
import statsRoutes from './routes/stats';
import subscriptionRoutes from './routes/subscriptions';
import ttsRoutes from './routes/tts';
import uploadRoutes from './routes/upload';

// ── Allowed CORS origins ───────────────────────────────────────────────────────

const FALLBACK_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://med-ai-simulator.vercel.app',
  'https://medaisimulator.uz',
  'https://www.medaisimulator.uz',
  'https://admin.medaisimulator.uz',
  'https://manager.medaisimulator.uz',
]

const allowedOrigins = [
  ...FALLBACK_ORIGINS,
  ...(process.env.CLIENT_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean),
]

function resolveUploadsDir(): string {
  if (process.env.VERCEL) {
    const tmpUploadsDir = path.join('/tmp', 'uploads')
    if (!existsSync(tmpUploadsDir)) {
      mkdirSync(tmpUploadsDir, { recursive: true })
    }
    return tmpUploadsDir
  }

  const candidates = [
    path.join(process.cwd(), 'public', 'uploads'),
    path.join(process.cwd(), '..', 'public', 'uploads'),
    path.join(__dirname, '..', '..', 'public', 'uploads'),
    path.join(__dirname, '..', 'public', 'uploads'),
  ]

  for (const dir of candidates) {
    if (existsSync(dir)) return dir
  }

  return candidates[0]
}

const app = express()
app.set('trust proxy', 1)

// ── Layer 1: IP blocklist (earliest possible rejection) ───────────────────────
app.use(ipBlockMiddleware)

// ── Layer 2: Remove server fingerprint ────────────────────────────────────────
app.use(removeFingerprint)

// ── Layer 3: Security headers (Helmet) ────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        mediaSrc: ["'self'", 'blob:', 'https:'],
        connectSrc: ["'self'", 'https://api.openai.com', 'https://googleapis.com'],
        fontSrc: ["'self'", 'https:', 'data:'],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
    hsts: process.env.NODE_ENV === 'production'
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  })
)

// ── Layer 4: Clickjacking guard ────────────────────────────────────────────────
app.use(frameGuard)
app.use(noSniff)

// ── Layer 5: CORS ─────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      if (
        allowedOrigins.includes(origin) ||
        /\.vercel\.app$/.test(origin) ||
        /^https?:\/\/([a-z0-9-]+\.)?medaisimulator\.uz$/.test(origin)
      ) {
        return callback(null, true)
      }
      return callback(new Error('CORS: origin ruxsat etilmagan'))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  })
)

// ── Layer 6: Cookie parser (needed for refresh token + CSRF) ──────────────────
app.use(cookieParser(process.env.COOKIE_SECRET || process.env.JWT_SECRET))

// ── Layer 7: Global API rate limit (200 req / 15 min) ────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Juda ko\'p so\'rov. Keyinroq urinib ko\'ring.' },
  skip: (req) => {
    // Payment webhooks must never be rate-limited
    return req.path.includes('/api/payments/click') || req.path.includes('/api/payments/payme')
  },
})
app.use('/api', globalLimiter)

// ── Layer 8: Body parsing ─────────────────────────────────────────────────────
// 50mb needed for video upload base64 fallback, but we apply a tighter guard
// on JSON-only endpoints further down.
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// ── Layer 9: Input sanitisation ───────────────────────────────────────────────
app.use(hppGuard)         // collapse duplicate query params
app.use(mongoSanitize)    // strip MongoDB operator keys
app.use(xssScrub)         // strip inline <script> / event handlers
app.use(jsonSizeGuard(100 * 1024))  // 100KB JSON limit (upload route bypasses via multipart)

// ── Layer 10: Audit logging ───────────────────────────────────────────────────
app.use(auditMiddleware)

// ── Static uploads ────────────────────────────────────────────────────────────
app.use('/uploads', express.static(resolveUploadsDir(), {
  dotfiles: 'deny',
  index: false,
}))

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/balance', balanceRoutes)
app.use('/api/cases', caseRoutes)
app.use('/api/attempts', attemptRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/subscriptions', subscriptionRoutes)
app.use('/api/tts', ttsRoutes)
app.use('/api/stt', sttRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/books', bookRoutes)
app.use('/api/learning', learningRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/referrals', referralRoutes)

// ── Health check (unauthenticated) ────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: 'Endpoint topilmadi' })
})

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler)

export default app
