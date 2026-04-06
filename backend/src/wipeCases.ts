import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Case } from './models/Case';
import { CaseAttempt } from './models/CaseAttempt';

dotenv.config()

async function wipeCases() {
  const mongoUri = process.env.MONGODB_URI
  const force = process.argv.includes('--yes')

  if (!mongoUri) {
    console.error('MONGODB_URI topilmadi. backend/.env faylini tekshiring.')
    process.exit(1)
  }

  if (!force) {
    console.error('Bu amal barcha klinik holatlar va ularga bog\'liq urinishlarni o\'chiradi.')
    console.error('Davom etish uchun quyidagini ishga tushiring: npm run wipe:cases -- --yes')
    process.exit(1)
  }

  try {
    await mongoose.connect(mongoUri)

    const [attemptResult, caseResult] = await Promise.all([
      CaseAttempt.deleteMany({}),
      Case.deleteMany({}),
    ])

    console.log(`CaseAttempt o\'chirildi: ${attemptResult.deletedCount ?? 0}`)
    console.log(`Case o\'chirildi: ${caseResult.deletedCount ?? 0}`)
    console.log('Klinik holatlar bazasi tozalandi.')

    process.exit(0)
  } catch (error) {
    console.error('Bazani tozalashda xatolik:', error)
    process.exit(1)
  }
}

wipeCases()
