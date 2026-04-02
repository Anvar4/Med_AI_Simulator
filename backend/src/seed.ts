import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { Case } from './models/Case'
import { Category } from './models/Category'
import { User } from './models/User'

// ─── Default categories (admin qo'shadi, seed orqali default) ───
const seedCategories = [
  'Kardiologiya',
  'Nevrologiya',
  'Pediatriya',
  'Jarrohlik',
  'Ginekologiya',
  'Pulmonologiya',
  'Endokrinologiya',
  'Gastroenterologiya',
  'Nefrologiya',
  'Urologiya',
  'Dermatologiya',
  'Oftalmologiya',
  'Otorinolaringologiya',
  'Travmatologiya',
  'Anesteziologiya',
  'Infeksion kasalliklar',
  'Onkologiya',
  'Gematologiya',
  'Revmatologiya',
  'Psixiatriya',
]

dotenv.config()

const seedCases = [
  {
    caseId: 'case-001',
    title: 'Ko\'krak qafasi og\'rig\'i - Miokard infarkti shubhasi',
    category: 'Kardiologiya',
    difficulty: 3,
    type: 'diagnostika' as const,
    isPremium: false,
    patient: {
      name: 'Abdullayev Karim',
      age: 55,
      gender: 'Erkak',
      ageGroup: 'Katta yoshli',
      vitals: { bp: '160/95', hr: '92', temp: '36.8', spo2: '96' },
      complaints:
        'Ko\'krak qafasida kuchli siquvchi og\'riq, chap qo\'lga tarqaladi. 2 soatdan beri davom etmoqda.',
      history:
        'Gipertoniya kasalligi 10 yil. Chekadi (20 yil). Oilaviy anamnezda ota miyokard infarkti o\'tkazgan.',
    },
    correctDiagnosis: 'O\'tkir miokard infarkti (STEMI)',
    correctTreatment: 'Aspirinni darhol berish, Nitroglitserin, Antikoagulyant terapiya, Shoshilinch koronar angiografiya',
    tests: ['EKG', 'Troponin T', 'KFK-MB', 'Koagulogramma', 'Qon umumiy tahlili'],
    timeLimit: 600,
  },
  {
    caseId: 'case-002',
    title: 'Bosh og\'rig\'i va bosh aylanishi',
    category: 'Nevrologiya',
    difficulty: 2,
    type: 'diagnostika' as const,
    isPremium: false,
    patient: {
      name: 'Karimova Nilufar',
      age: 34,
      gender: 'Ayol',
      ageGroup: 'Katta yoshli',
      vitals: { bp: '120/80', hr: '76', temp: '36.6', spo2: '98' },
      complaints:
        'Kuchli bosh og\'rig\'i, bosh aylanishi. 3 kundan beri davom etmoqda, ko\'ngil aynishi bilan.',
      history:
        'Migren kasalligi tarixi bor. Stress sharoitida ishlaydi. Uyqu buzilishi kuzatilgan.',
    },
    correctDiagnosis: 'Migren xurujlari',
    correctTreatment: 'Triptan preparatlari, NSAIDlar, Beta-blokerlar profilaktik sifatida, Hayot tarzi o\'zgarishlari',
    tests: ['Nevrologik tekshiruv', 'MRT bosh miya', 'Qon bosimi monitoring'],
    timeLimit: 480,
  },
  {
    caseId: 'case-003',
    title: 'Bolalarda qorin og\'rig\'i va isitma',
    category: 'Pediatriya',
    difficulty: 4,
    type: 'diagnostika' as const,
    isPremium: true,
    patient: {
      name: 'Rahimov Jasur',
      age: 8,
      gender: 'Erkak',
      ageGroup: 'Bola',
      vitals: { bp: '100/65', hr: '110', temp: '38.5', spo2: '97' },
      complaints:
        'Qorin og\'rig\'i, isitma, ishtahaning yo\'qolishi. 1 kundan beri davom etmoqda.',
      history: 'Avval sog\'lom bola. Emlash kalendari to\'liq. Allergiya yo\'q.',
    },
    correctDiagnosis: 'O\'tkir appenditsit',
    correctTreatment: 'Antibiotik terapiya boshlash, Shoshilinch jarrohlik konsultatsiyasi, Appendektomiya',
    tests: ['Qon umumiy tahlili', 'UZI qorin bo\'shlig\'i', 'CRP', 'Siydik tahlili'],
    timeLimit: 480,
  },
  {
    caseId: 'case-004',
    title: 'Qorin travmasi - Shoshilinch jarrohlik',
    category: 'Jarrohlik',
    difficulty: 5,
    type: 'jarrohlik' as const,
    isPremium: true,
    patient: {
      name: 'Toshmatov Bobur',
      age: 42,
      gender: 'Erkak',
      ageGroup: 'Katta yoshli',
      vitals: { bp: '90/60', hr: '120', temp: '37.2', spo2: '94' },
      complaints:
        'Yo\'l transport hodisasidan keyin qorin sohasida kuchli og\'riq, ko\'ngil aynish.',
      history:
        'Avval sog\'lom. Doimiy dori qabul qilmaydi. 1 soat oldin YTH bo\'lgan.',
    },
    correctDiagnosis: 'Taloq yorilishi bilan ichki qon ketish',
    correctTreatment: 'Infuzion terapiya, Qon preparatlari quyish, Shoshilinch laparotomiya, Splenektomiya',
    tests: [
      'Qon umumiy tahlili',
      'Qon guruhi va rezus faktor',
      'KT qorin bo\'shlig\'i',
      'FAST UZI',
      'Koagulogramma',
    ],
    timeLimit: 300,
  },
  {
    caseId: 'case-005',
    title: 'Nafas qisilishi - Yurak yetishmovchiligi',
    category: 'Kardiologiya',
    difficulty: 3,
    type: 'shoshilinch' as const,
    isPremium: false,
    patient: {
      name: 'Ergasheva Mohira',
      age: 67,
      gender: 'Ayol',
      ageGroup: 'Keksa',
      vitals: { bp: '150/90', hr: '105', temp: '36.9', spo2: '90' },
      complaints:
        'Nafas qisilishi, oyoqlar shishi. 1 haftadan beri kuchayib bormoqda.',
      history:
        'Surunkali yurak yetishmovchiligi. 2 yil oldin miokard infarkti o\'tkazgan. Diuretik qabul qiladi.',
    },
    correctDiagnosis: 'Surunkali yurak yetishmovchiligi dekompensatsiyasi',
    correctTreatment: 'Kislorod terapiyasi, IV Furosemid, ACE ingibitorlar, Tuz va suv cheklash',
    tests: [
      'EKG',
      'Exokardiografiya',
      'Rentgen ko\'krak qafasi',
      'BNP/NT-proBNP',
      'Elektrolit tahlili',
    ],
    timeLimit: 420,
  },
  {
    caseId: 'case-006',
    title: 'Tug\'ruqdan keyingi asoratlar',
    category: 'Ginekologiya',
    difficulty: 4,
    type: 'shoshilinch' as const,
    isPremium: true,
    patient: {
      name: 'Hasanova Dilorom',
      age: 28,
      gender: 'Ayol',
      ageGroup: 'Katta yoshli',
      vitals: { bp: '100/65', hr: '115', temp: '38.2', spo2: '95' },
      complaints:
        'Tug\'ruqdan keyin kuchli qon ketish, zaiflik va bosh aylanishi.',
      history:
        'Birinchi tug\'ruq 6 soat oldin bo\'lgan. Tug\'ruq tabiiy yo\'l bilan. Jift to\'liq ajralmagan.',
    },
    correctDiagnosis: 'Postpartum qon ketish (jift qoldiqlari sababli)',
    correctTreatment: 'Oksitotsin infuziyasi, Bachadon bo\'shlig\'ini tozalash, Infuzion terapiya, Qon quyish',
    tests: [
      'Qon umumiy tahlili',
      'Koagulogramma',
      'UZI bachadon',
      'Qon guruhi',
      'Fibrinogen',
    ],
    timeLimit: 300,
  },
]

const seedUsers = [
  {
    name: 'Admin User',
    firstName: 'Admin',
    lastName: 'User',
    username: 'admin',
    email: 'admin@medai.uz',
    password: 'admin123!',
    role: 'admin' as const,
    isPremium: true,
    isEmailVerified: true,
    stats: { totalCases: 0, avgScore: 0, weeklyCount: 0, streak: 0 },
    subscription: { plan: 'pro' as const, status: 'active' as const },
  },
  {
    name: 'Kontent Menejer',
    firstName: 'Kontent',
    lastName: 'Menejer',
    username: 'manager',
    email: 'manager@medai.uz',
    password: 'manager123!',
    role: 'instructor' as const,
    isPremium: true,
    isEmailVerified: true,
    specialty: 'Kardiologiya',
    stats: { totalCases: 0, avgScore: 0, weeklyCount: 0, streak: 0 },
    subscription: { plan: 'pro' as const, status: 'active' as const },
  },
  {
    name: 'Demo Foydalanuvchi',
    firstName: 'Demo',
    lastName: 'Foydalanuvchi',
    username: 'demouser',
    email: 'demo@medai.uz',
    password: 'demo123456',
    role: 'student' as const,
    specialty: 'Umumiy tibbiyot',
    university: 'Toshkent Tibbiyot Akademiyasi',
    isPremium: false,
    isEmailVerified: true,
    stats: { totalCases: 47, avgScore: 78.4, weeklyCount: 12, streak: 5 },
    subscription: { plan: 'free' as const, status: 'active' as const },
  },
]

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!)
    console.log('MongoDB ga ulandi')

    // Clear existing data
    await User.deleteMany({})
    await Case.deleteMany({})
    await Category.deleteMany({})
    console.log('Eski ma\'lumotlar tozalandi')

    // Seed categories
    const cats = await Category.create(seedCategories.map(name => ({ name })))
    console.log(`${cats.length} ta turkum yaratildi`)

    // Seed users
    const users = await User.create(seedUsers)
    console.log(`${users.length} ta foydalanuvchi yaratildi`)

    // Seed cases
    const cases = await Case.create(
      seedCases.map((c) => ({ ...c, createdBy: users[1]._id, status: 'published' }))
    )
    console.log(`${cases.length} ta keys yaratildi`)

    console.log(`\nTurkumlar: ${seedCategories.join(', ')}`)
    console.log('\n--- Demo hisoblar ---')
    console.log('Admin:   username=admin     / parol=admin123!')
    console.log('Manager: username=manager   / parol=manager123!')
    console.log('Demo:    username=demouser  / parol=demo123456')
    console.log('\nSeed muvaffaqiyatli yakunlandi!')

    process.exit(0)
  } catch (error) {
    console.error('Seed xatosi:', error)
    process.exit(1)
  }
}

seed()
