import './loadEnv'; // MUST be first — loads .env before other imports read process.env
import mongoose from 'mongoose';
import app from './app';
import { initTelegramBot } from './services/telegramBot';

const PORT = process.env.PORT || 5000

// Database connection & server start
async function start() {
  try {
    const mongoUri = process.env.MONGODB_URI
    if (!mongoUri) {
      throw new Error('MONGODB_URI topilmadi. .env faylga MONGODB_URI kiriting.')
    }

    await mongoose.connect(mongoUri)
    console.log('MongoDB ga muvaffaqiyatli ulandi')

    // Start the Telegram approval bot (no-op if no token configured).
    initTelegramBot()

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
