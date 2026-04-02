import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import mongoose from 'mongoose'
import path from 'path'

import { errorHandler } from './middleware/errorHandler'
import adminRoutes from './routes/admin'
import attemptRoutes from './routes/attempts'
import authRoutes from './routes/auth'
import caseRoutes from './routes/cases'
import chatRoutes from './routes/chat'
import statsRoutes from './routes/stats'
import subscriptionRoutes from './routes/subscriptions'
import ttsRoutes from './routes/tts'
import uploadRoutes from './routes/upload'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Security middleware
app.use(helmet())
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://med-ai-simulator.vercel.app',
      /\.vercel\.app$/,
    ],
    credentials: true,
  })
)

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { message: 'Juda ko\'p so\'rov. Keyinroq urinib ko\'ring.' },
})
app.use('/api', limiter)

// Body parser — increased for base64 image uploads
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '..', '..', 'public', 'uploads')))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/cases', caseRoutes)
app.use('/api/attempts', attemptRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/subscriptions', subscriptionRoutes)
app.use('/api/tts', ttsRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/chat', chatRoutes)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// 404
app.use((_req, res) => {
  res.status(404).json({ message: 'Endpoint topilmadi' })
})

// Error handler
app.use(errorHandler)

// Database connection & server start
async function start() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!)
    console.log('MongoDB ga muvaffaqiyatli ulandi')

    app.listen(PORT, () => {
      console.log(`Server ${PORT}-portda ishlamoqda`)
      console.log(`Health check: http://localhost:${PORT}/api/health`)
    })
  } catch (error) {
    console.error('Serverni ishga tushirishda xatolik:', error)
    process.exit(1)
  }
}

start()
