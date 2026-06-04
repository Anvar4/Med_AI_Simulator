import { existsSync, mkdirSync } from 'fs';
import path from 'path';

import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

import { errorHandler } from './middleware/errorHandler';
import adminRoutes from './routes/admin';
import attemptRoutes from './routes/attempts';
import authRoutes from './routes/auth';
import balanceRoutes from './routes/balance';
import caseRoutes from './routes/cases';
import chatRoutes from './routes/chat';
import courseRoutes from './routes/courses';
import learningRoutes from './routes/learning';
import paymentRoutes from './routes/payments';
import sttRoutes from './routes/stt';
import statsRoutes from './routes/stats';
import subscriptionRoutes from './routes/subscriptions';
import ttsRoutes from './routes/tts';
import uploadRoutes from './routes/upload';

dotenv.config()

const FALLBACK_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://med-ai-simulator.vercel.app',
]

const allowedOrigins = (process.env.CLIENT_ORIGINS || FALLBACK_ORIGINS.join(','))
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)

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

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
)

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      if (allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
        return callback(null, true)
      }
      return callback(new Error('CORS: origin ruxsat etilmagan'))
    },
    credentials: true,
  })
)

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: 'Juda ko\'p so\'rov. Keyinroq urinib ko\'ring.' },
})
app.use('/api', limiter)

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

app.use('/uploads', express.static(resolveUploadsDir()))

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
app.use('/api/learning', learningRoutes)
app.use('/api/payments', paymentRoutes)

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

app.use((_req, res) => {
  res.status(404).json({ message: 'Endpoint topilmadi' })
})

app.use(errorHandler)

export default app
