import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { Case } from './models/Case';
import { CaseAttempt } from './models/CaseAttempt';
import { Category } from './models/Category';
import { User } from './models/User';

dotenv.config()

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

const LABORATORY_TESTS = ['qon_analiz', 'siydik_analiz', 'bioximik'] as const
const TEST_MENU_LABELS = ['EKG', 'UZI', 'RENTGEN', 'KT', 'MRT', 'ENDOSKOPIYA', 'QON ANALIZ', 'SIYDIK ANALIZ', 'BIOXIMIK']

type InstrumentalTest = 'ekg' | 'uzi' | 'rentgen' | 'kt' | 'mrt' | 'endoskopiya'

const IMG_K_SOURCE_DIR = path.resolve(__dirname, '..', '..', 'app', 'img-k')
const IMG_K_TARGET_DIR = path.resolve(__dirname, '..', '..', 'public', 'uploads', 'img-k')

const IMG_K_FILES = {
  ekg: 'EKG.png',
  uzi: 'uzi-female.png',
  rentgen: 'rentgen.png',
  kt: 'KT.png',
  mrt: 'mrt.png',
  endoskopiya: 'endoskopiya.png',
} as const

type SeedCaseTemplate = {
  caseId: string
  title: string
  authorName: string
  category: string
  difficulty: number
  type: 'diagnostika' | 'jarrohlik' | 'shoshilinch'
  isPremium: boolean
  description: string
  timeLimit?: number
  pregnancyCase?: boolean
  patient: {
    name: string
    age: number
    gender: 'Erkak' | 'Ayol'
    ageGroup: string
    vitals: { bp: string; hr: string; temp: string; spo2: string }
    complaints: string
    history: string
  }
  correctDiagnosis: string
  correctTreatment: string
}

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
    isPremium: true,
    isEmailVerified: true,
    stats: { totalCases: 0, avgScore: 0, weeklyCount: 0, streak: 0 },
    subscription: { plan: 'pro' as const, status: 'active' as const },
  },
]

const generatedStudentUsers = [
  { firstName: 'Akmal', lastName: 'Raximov', specialty: 'Kardiologiya' },
  { firstName: 'Dildora', lastName: 'Islomova', specialty: 'Nevrologiya' },
  { firstName: 'Sardor', lastName: 'Karimov', specialty: 'Jarrohlik' },
  { firstName: 'Nargiza', lastName: 'Tohirova', specialty: 'Pediatriya' },
  { firstName: 'Behruz', lastName: 'Mamatov', specialty: 'Pulmonologiya' },
  { firstName: 'Sevara', lastName: 'Qodirova', specialty: 'Ginekologiya' },
  { firstName: 'Javohir', lastName: 'Ergashev', specialty: 'Infeksion kasalliklar' },
  { firstName: 'Nilufar', lastName: 'Sobirova', specialty: 'Endokrinologiya' },
  { firstName: 'Temur', lastName: 'Abduganiyev', specialty: 'Travmatologiya' },
  { firstName: 'Madina', lastName: 'Yuldasheva', specialty: 'Terapiya' },
].map((person, index) => {
  const username = `student${String(index + 1).padStart(2, '0')}`
  return {
    name: `${person.firstName} ${person.lastName}`,
    firstName: person.firstName,
    lastName: person.lastName,
    username,
    email: `${username}@medai.uz`,
    password: 'student123!',
    role: 'student' as const,
    specialty: person.specialty,
    university: 'Toshkent Tibbiyot Akademiyasi',
    isPremium: true,
    isEmailVerified: true,
    stats: { totalCases: 0, avgScore: 0, weeklyCount: 0, streak: 0 },
    subscription: { plan: 'pro' as const, status: 'active' as const },
  }
})

const allSeedUsers = [...seedUsers, ...generatedStudentUsers]

const caseTemplates: SeedCaseTemplate[] = [
  {
    caseId: 'case-001',
    title: 'Ko\'krak qafasi og\'rig\'i - O\'tkir koronar sindrom',
    authorName: 'Dr. Aziza Karimova',
    category: 'Kardiologiya',
    difficulty: 3,
    type: 'diagnostika' as const,
    isPremium: false,
    description: 'Ko\'krak og\'rig\'i bilan kelgan bemorda differensial tashxis va tezkor qaror.',
    patient: {
      name: 'Abdullayev Karim',
      age: 55,
      gender: 'Erkak',
      ageGroup: 'Katta yoshli',
      vitals: { bp: '160/95', hr: '94', temp: '36.8', spo2: '95' },
      complaints: 'Ko\'krakda siquvchi og\'riq, chap qo\'lga tarqalish, sovuq ter bosishi.',
      history: 'Arterial gipertenziya 10 yil, chekish anamnezi mavjud.',
    },
    correctDiagnosis: 'O\'tkir koronar sindrom (NSTEMI ehtimoli yuqori)',
    correctTreatment: 'Aspirin, antitrombotsitar terapiya, antikoagulyant, kislorod va shoshilinch kardiologik kuzatuv.',
  },
  {
    caseId: 'case-002',
    title: 'Keskin bosh og\'rig\'i va fotofobiya',
    authorName: 'Dr. Jahongir Rasulov',
    category: 'Nevrologiya',
    difficulty: 2,
    type: 'diagnostika' as const,
    isPremium: false,
    description: 'Nevrologik belgilar fonida migren va boshqa xavfli holatlarni ajratish.',
    patient: {
      name: 'Karimova Nilufar',
      age: 34,
      gender: 'Ayol',
      ageGroup: 'Katta yoshli',
      vitals: { bp: '122/78', hr: '78', temp: '36.7', spo2: '98' },
      complaints: 'Pulsatsion bosh og\'rig\'i, yorug\'likka sezuvchanlik, ko\'ngil aynishi.',
      history: 'Oldin ham migren xurujlari bo\'lgan, stress omili yuqori.',
    },
    correctDiagnosis: 'Aura bilan kechuvchi migren xuruji',
    correctTreatment: 'Analgetiklar, triptanlar, suyuqlik va triggerlarni cheklash bo\'yicha tavsiya.',
  },
  {
    caseId: 'case-003',
    title: 'Bolada qorin og\'rig\'i va subfebril isitma',
    authorName: 'Dr. Nilufar Toirova',
    category: 'Pediatriya',
    difficulty: 4,
    type: 'diagnostika' as const,
    isPremium: true,
    description: 'Pediatrik bemorda appenditsitni erta aniqlashga qaratilgan holat.',
    patient: {
      name: 'Rahimov Jasur',
      age: 8,
      gender: 'Erkak',
      ageGroup: 'Bola',
      vitals: { bp: '100/65', hr: '109', temp: '38.1', spo2: '97' },
      complaints: 'Qorin pastki o\'ng sohasida og\'riq, ishtaha pasayishi, qayt qilish.',
      history: 'So\'nggi 24 soatda holat yomonlashgan, oldin jiddiy kasallik bo\'lmagan.',
    },
    correctDiagnosis: 'O\'tkir appenditsit',
    correctTreatment: 'Jarrohlik konsultatsiyasi, antibiotik profilaktika va appendektomiya.',
  },
  {
    caseId: 'case-004',
    title: 'Qorin travmasi va gemodinamik beqarorlik',
    authorName: 'Dr. Bekzod Qobilov',
    category: 'Jarrohlik',
    difficulty: 5,
    type: 'jarrohlik' as const,
    isPremium: true,
    description: 'Travmadan keyingi ichki qon ketishni aniqlash va operativ taktika tanlash.',
    patient: {
      name: 'Toshmatov Bobur',
      age: 42,
      gender: 'Erkak',
      ageGroup: 'Katta yoshli',
      vitals: { bp: '88/58', hr: '126', temp: '37.0', spo2: '93' },
      complaints: 'Qorin sohasida kuchli og\'riq, holsizlik, bosh aylanishi.',
      history: 'Yo\'l-transport hodisasidan keyin tez yordam bilan olib kelingan.',
    },
    correctDiagnosis: 'Qorin bo\'shlig\'ida ichki qon ketish (taloq shikastlanishi ehtimoli)',
    correctTreatment: 'ATLS protokoli, massiv infuzion terapiya, FAST va shoshilinch laparotomiya.',
  },
  {
    caseId: 'case-005',
    title: 'Nafas qisilishi va o\'pka shishi',
    authorName: 'Dr. Mohira Ergasheva',
    category: 'Kardiologiya',
    difficulty: 4,
    type: 'shoshilinch' as const,
    isPremium: false,
    description: 'Yurak yetishmovchiligi dekompensatsiyasida shoshilinch boshqaruv.',
    patient: {
      name: 'Ergasheva Mohira',
      age: 67,
      gender: 'Ayol',
      ageGroup: 'Keksa',
      vitals: { bp: '155/92', hr: '108', temp: '36.9', spo2: '89' },
      complaints: 'Keskin nafas qisilishi, yotganda kuchayuvchi hansirash, oyoq shishlari.',
      history: 'Surunkali yurak yetishmovchiligi bilan dispanser nazoratida.',
    },
    correctDiagnosis: 'Yurak yetishmovchiligi dekompensatsiyasi, o\'pka shishi',
    correctTreatment: 'Kislorod, IV diuretik, nitratlar, monitor nazorati va ICU kuzatuv.',
  },
  {
    caseId: 'case-006',
    title: 'Tug\'ruqdan keyingi qon ketish',
    authorName: 'Dr. Dilorom Xasanova',
    category: 'Ginekologiya',
    difficulty: 4,
    type: 'shoshilinch' as const,
    isPremium: true,
    description: 'Postpartum qon ketishda protokol asosida tezkor yordam.',
    patient: {
      name: 'Hasanova Dilorom',
      age: 28,
      gender: 'Ayol',
      ageGroup: 'Katta yoshli',
      vitals: { bp: '98/62', hr: '118', temp: '37.9', spo2: '95' },
      complaints: 'Kuchli vaginal qon ketish, holsizlik, ko\'z oldi qorong\'ilashishi.',
      history: 'Tug\'ruqdan 5 soat o\'tgan, oldin anemiya bo\'yicha davolangan.',
    },
    correctDiagnosis: 'Postpartum gemorragiya',
    correctTreatment: 'Uterotoniklar, infuzion terapiya, gemostaz nazorati va invaziv tozalash.',
  },
  {
    caseId: 'case-007',
    title: 'Bronxial astma xuruji',
    authorName: 'Dr. Sardor Tursunov',
    category: 'Pulmonologiya',
    difficulty: 3,
    type: 'shoshilinch' as const,
    isPremium: false,
    description: 'Astma xurujida differensial tashxis va tezkor bronxodilatator yondashuvi.',
    patient: {
      name: 'Qodirov Umid',
      age: 23,
      gender: 'Erkak',
      ageGroup: 'Yosh',
      vitals: { bp: '130/80', hr: '112', temp: '36.8', spo2: '90' },
      complaints: 'Hansirash, xirillash, quruq yo\'tal, gapirganda nafas yetmasligi.',
      history: 'Bolalikdan bronxial astma, inhalyatorni notog\'ri ishlatgan.',
    },
    correctDiagnosis: 'O\'rta-og\'ir bronxial astma xuruji',
    correctTreatment: 'Nebulizatsion bronxodilatator, sistemik steroid, kislorod va monitoring.',
  },
  {
    caseId: 'case-008',
    title: 'Ko\'p suyakli travma va shok',
    authorName: 'Dr. Kamola Yuldasheva',
    category: 'Travmatologiya',
    difficulty: 5,
    type: 'shoshilinch' as const,
    isPremium: true,
    description: 'Politravmada reanimatsion taktika va jarrohlikgacha stabilizatsiya.',
    patient: {
      name: 'Yusupov Farrux',
      age: 31,
      gender: 'Erkak',
      ageGroup: 'Katta yoshli',
      vitals: { bp: '85/55', hr: '132', temp: '36.2', spo2: '91' },
      complaints: 'Son va ko\'krak sohasida og\'riq, hushyorlik pasayishi.',
      history: 'Balandlikdan yiqilgan, hodisadan 40 daqiqa o\'tgan.',
    },
    correctDiagnosis: 'Gemorragik shok bilan kechuvchi politravma',
    correctTreatment: 'ATLS algoritmi, qon komponentlari, immobilizatsiya va shoshilinch operatsiya tayyorgarligi.',
  },
  {
    caseId: 'case-009',
    title: 'Qandli diabetda ketoatsidozga shubha',
    authorName: 'Dr. Shohruh Muminov',
    category: 'Endokrinologiya',
    difficulty: 3,
    type: 'diagnostika' as const,
    isPremium: false,
    description: 'Metabolik buzilishli bemorda DKA protokolini qo\'llash.',
    patient: {
      name: 'Nematova Gulbahor',
      age: 26,
      gender: 'Ayol',
      ageGroup: 'Katta yoshli',
      vitals: { bp: '105/68', hr: '108', temp: '37.4', spo2: '97' },
      complaints: 'Ko\'p chanqash, tez nafas, ko\'ngil aynishi, qorin og\'rig\'i.',
      history: '1-tip diabet, insulin dozasini o\'tkazib yuborgan.',
    },
    correctDiagnosis: 'Diabetik ketoatsidoz',
    correctTreatment: 'Rehidratasion terapiya, insulin infuziyasi, kaliy balansini tiklash, ABG nazorati.',
  },
  {
    caseId: 'case-010',
    title: 'Yuqori isitma va sepsis xavfi',
    authorName: 'Dr. Zarina Abdullayeva',
    category: 'Infeksion kasalliklar',
    difficulty: 4,
    type: 'diagnostika' as const,
    isPremium: true,
    description: 'Sepsisning erta belgilarini aniqlash va antibiotikoterapiyani boshlash.',
    patient: {
      name: 'Raximova Nasiba',
      age: 49,
      gender: 'Ayol',
      ageGroup: 'Katta yoshli',
      vitals: { bp: '95/60', hr: '118', temp: '39.3', spo2: '93' },
      complaints: 'Yuqori isitma, titroq, umumiy holsizlik, taxikardiya.',
      history: '2 kundan beri simptomlar kuchaygan, avval antibiotik olmagan.',
    },
    correctDiagnosis: 'Sepsis (o\'choq: pastki nafas yo\'llari ehtimoli)',
    correctTreatment: 'Sepsis bundle: qon madaniyati, keng ta\'sirli antibiotik, suyuqlik resusitatsiyasi, laktat monitoring.',
  },
  {
    caseId: 'case-011',
    title: 'Anafilaktik shok - 1 daqiqalik qaror',
    authorName: 'Dr. Kamron Ismoilov',
    category: 'Infeksion kasalliklar',
    difficulty: 5,
    type: 'shoshilinch' as const,
    isPremium: false,
    timeLimit: 60,
    description: 'Dori yuborilganidan so\'ng keskin anafilaksiya: 1 daqiqada birlamchi qaror talab etiladi.',
    patient: {
      name: 'Sattorov Otabek',
      age: 36,
      gender: 'Erkak',
      ageGroup: 'Katta yoshli',
      vitals: { bp: '80/50', hr: '138', temp: '36.5', spo2: '82' },
      complaints: 'Nafas qisilishi, toshma, lab va til shishi, keskin holsizlik.',
      history: 'Antibiotik in\'eksiyasidan 5 daqiqa o\'tib simptomlar boshlangan.',
    },
    correctDiagnosis: 'Anafilaktik shok',
    correctTreatment: 'IM adrenalin, yuqori oqimdagi kislorod, tezkor vena yo\'li va infuzion terapiya, reanimatsion kuzatuv.',
  },
  {
    caseId: 'case-012',
    title: 'Ishemik insult alomatlari - 2 daqiqalik qaror',
    authorName: 'Dr. Shoira Raximova',
    category: 'Nevrologiya',
    difficulty: 4,
    type: 'shoshilinch' as const,
    isPremium: true,
    timeLimit: 120,
    description: 'FAST ijobiy bemorda tromboliz oynasini boy bermaslik uchun 2 daqiqalik tezkor qaror holati.',
    patient: {
      name: 'Madaminova Fotima',
      age: 64,
      gender: 'Ayol',
      ageGroup: 'Keksa',
      vitals: { bp: '170/100', hr: '96', temp: '36.7', spo2: '94' },
      complaints: 'To\'satdan nutq buzilishi, o\'ng qo\'l-oyoqqa kuchsizlik, yuz assimetriyasi.',
      history: 'Belgilarning boshlanishi taxminan 35 daqiqa oldin kuzatilgan.',
    },
    correctDiagnosis: 'O\'tkir ishemik insult',
    correctTreatment: 'Stroke kodni ishga tushirish, tezkor KT, trombolizga moslikni baholash va nevrologik monitoring.',
  },
  {
    caseId: 'case-013',
    title: 'Homiladorlikda preeklampsiya shubhasi',
    authorName: 'Dr. Malika Xudoyberdiyeva',
    category: 'Ginekologiya',
    difficulty: 4,
    type: 'shoshilinch' as const,
    isPremium: true,
    pregnancyCase: true,
    description: 'Homilador bemorda yuqori qon bosimi va shish bilan kechuvchi holatda tezkor qaror.',
    patient: {
      name: 'Saidova Muqaddas',
      age: 29,
      gender: 'Ayol',
      ageGroup: 'Katta yoshli',
      vitals: { bp: '165/105', hr: '102', temp: '36.8', spo2: '96' },
      complaints: 'Bosh og\'rig\'i, ko\'z oldi xiralashuvi, oyoqlarda shish.',
      history: '32 haftalik homiladorlik, so\'nggi 2 kunda arterial bosim ko\'tarilgan.',
    },
    correctDiagnosis: 'Og\'ir preeklampsiya',
    correctTreatment: 'Magniy sulfat, qon bosimini nazorat qilish, ona-homila monitoringi va shoshilinch akusherlik konsultatsiyasi.',
  },
]

type AttemptPlan = {
  userKey: 'admin' | 'manager' | 'demo'
  caseId: string
  score: number
  daysAgo: number
  timeSpent: number
}

const demoAttempts: AttemptPlan[] = [
  { userKey: 'demo', caseId: 'case-001', score: 92, daysAgo: 2, timeSpent: 360 },
  { userKey: 'demo', caseId: 'case-005', score: 89, daysAgo: 5, timeSpent: 290 },
  { userKey: 'demo', caseId: 'case-001', score: 84, daysAgo: 14, timeSpent: 410 },
  { userKey: 'demo', caseId: 'case-005', score: 90, daysAgo: 35, timeSpent: 305 },
  { userKey: 'demo', caseId: 'case-001', score: 86, daysAgo: 70, timeSpent: 355 },
  { userKey: 'demo', caseId: 'case-002', score: 58, daysAgo: 120, timeSpent: 430 },
  { userKey: 'demo', caseId: 'case-002', score: 62, daysAgo: 50, timeSpent: 415 },
  { userKey: 'demo', caseId: 'case-002', score: 78, daysAgo: 6, timeSpent: 350 },
  { userKey: 'demo', caseId: 'case-003', score: 49, daysAgo: 8, timeSpent: 455 },
  { userKey: 'demo', caseId: 'case-003', score: 55, daysAgo: 40, timeSpent: 448 },
  { userKey: 'demo', caseId: 'case-003', score: 52, daysAgo: 90, timeSpent: 460 },
  { userKey: 'demo', caseId: 'case-004', score: 44, daysAgo: 3, timeSpent: 275 },
  { userKey: 'demo', caseId: 'case-004', score: 57, daysAgo: 30, timeSpent: 290 },
  { userKey: 'demo', caseId: 'case-006', score: 68, daysAgo: 11, timeSpent: 280 },
  { userKey: 'demo', caseId: 'case-006', score: 72, daysAgo: 60, timeSpent: 300 },
  { userKey: 'demo', caseId: 'case-007', score: 75, daysAgo: 4, timeSpent: 260 },
  { userKey: 'demo', caseId: 'case-007', score: 80, daysAgo: 27, timeSpent: 255 },
  { userKey: 'demo', caseId: 'case-008', score: 61, daysAgo: 16, timeSpent: 250 },
  { userKey: 'demo', caseId: 'case-009', score: 59, daysAgo: 22, timeSpent: 390 },
  { userKey: 'demo', caseId: 'case-009', score: 65, daysAgo: 100, timeSpent: 405 },
  { userKey: 'demo', caseId: 'case-010', score: 71, daysAgo: 12, timeSpent: 345 },
  { userKey: 'demo', caseId: 'case-010', score: 76, daysAgo: 130, timeSpent: 340 },
]

const managerAttempts: AttemptPlan[] = [
  { userKey: 'manager', caseId: 'case-001', score: 95, daysAgo: 9, timeSpent: 300 },
  { userKey: 'manager', caseId: 'case-004', score: 88, daysAgo: 20, timeSpent: 280 },
  { userKey: 'manager', caseId: 'case-006', score: 91, daysAgo: 44, timeSpent: 270 },
  { userKey: 'manager', caseId: 'case-008', score: 86, daysAgo: 78, timeSpent: 260 },
  { userKey: 'manager', caseId: 'case-010', score: 90, daysAgo: 101, timeSpent: 330 },
]

const adminAttempts: AttemptPlan[] = [
  { userKey: 'admin', caseId: 'case-005', score: 93, daysAgo: 7, timeSpent: 280 },
  { userKey: 'admin', caseId: 'case-002', score: 87, daysAgo: 32, timeSpent: 370 },
  { userKey: 'admin', caseId: 'case-007', score: 90, daysAgo: 63, timeSpent: 245 },
  { userKey: 'admin', caseId: 'case-009', score: 88, daysAgo: 118, timeSpent: 360 },
]

const generatedStudentCasePool = [
  'case-001', 'case-002', 'case-003', 'case-004', 'case-005',
  'case-006', 'case-007', 'case-008', 'case-009', 'case-010',
  'case-011', 'case-012', 'case-013',
]

function ensureSeedImagesAvailable() {
  if (!existsSync(IMG_K_SOURCE_DIR)) {
    throw new Error(`img-k papkasi topilmadi: ${IMG_K_SOURCE_DIR}`)
  }

  if (!existsSync(IMG_K_TARGET_DIR)) {
    mkdirSync(IMG_K_TARGET_DIR, { recursive: true })
  }

  for (const fileName of Object.values(IMG_K_FILES)) {
    const sourceFile = path.join(IMG_K_SOURCE_DIR, fileName)
    const targetFile = path.join(IMG_K_TARGET_DIR, fileName)

    if (!existsSync(sourceFile)) {
      throw new Error(`img-k ichida fayl topilmadi: ${sourceFile}`)
    }

    copyFileSync(sourceFile, targetFile)
  }
}

function uploadsPath(fileName: string): string {
  return `/uploads/img-k/${fileName}`
}

type SeedMediaItem = {
  type: 'xray' | 'ekg' | 'echo' | 'image' | 'video'
  fileData: string
  comment: string
  fileName: string
}

function buildMediaItems(index: number, opts: { pregnancyCase: boolean }): SeedMediaItem[] {
  const items: SeedMediaItem[] = [
    {
      type: 'xray' as const,
      fileData: uploadsPath(IMG_K_FILES.rentgen),
      comment: `R${index}: Rentgen tasvirida klinik o\'zgarishlar qayd etiladi.`,
      fileName: IMG_K_FILES.rentgen,
    },
    {
      type: 'xray' as const,
      fileData: uploadsPath(IMG_K_FILES.kt),
      comment: `R${index}: KT kesimida patologik o\'choqlar differensial baholash uchun taqdim etilgan.`,
      fileName: IMG_K_FILES.kt,
    },
    {
      type: 'xray' as const,
      fileData: uploadsPath(IMG_K_FILES.mrt),
      comment: `R${index}: MRT tasvirida yumshoq to\'qima o\'zgarishlari ko\'rinadi.`,
      fileName: IMG_K_FILES.mrt,
    },
    {
      type: 'ekg' as const,
      fileData: uploadsPath(IMG_K_FILES.ekg),
      comment: `R${index}: sinus ritm, ST/T segmentda klinik baholash talab etiladi.`,
      fileName: IMG_K_FILES.ekg,
    },
    {
      type: 'image' as const,
      fileData: uploadsPath(IMG_K_FILES.endoskopiya),
      comment: `R${index}: endoskopiyada shilliq qavatdagi o\'zgarishlar tasvirlangan.`,
      fileName: IMG_K_FILES.endoskopiya,
    },
  ]

  if (opts.pregnancyCase) {
    items.splice(4, 0, {
      type: 'echo',
      fileData: uploadsPath(IMG_K_FILES.uzi),
      comment: `R${index}: Homiladorlik bo\'yicha UZI natijasi (uzi-female) klinik baholash uchun biriktirilgan.`,
      fileName: IMG_K_FILES.uzi,
    })
  }

  return items
}

function buildInstrumentalTests(template: SeedCaseTemplate): InstrumentalTest[] {
  const tests: InstrumentalTest[] = ['ekg', 'rentgen', 'kt', 'mrt', 'endoskopiya']

  if (template.pregnancyCase) {
    tests.push('uzi')
  }

  return tests
}

function buildLabRows(index: number) {
  const bloodTest = [
    { name: 'Gemoglobin', value: String(137 - index), unit: 'g/L', range: '120-160', status: index % 3 === 0 ? 'low' : 'normal' as const },
    { name: 'Leykotsit', value: String(8 + index * 0.6), unit: 'x10^9/L', range: '4-10', status: index % 2 === 0 ? 'high' : 'normal' as const },
    { name: 'Trombotsit', value: String(250 - index * 3), unit: 'x10^9/L', range: '150-400', status: 'normal' as const },
  ]

  const urineTest = [
    { name: 'Protein', value: index % 4 === 0 ? '+' : 'Iz', unit: '', range: 'Manfiy', status: index % 4 === 0 ? 'high' : 'normal' as const },
    { name: 'Ketone', value: index % 5 === 0 ? '++' : '-', unit: '', range: 'Manfiy', status: index % 5 === 0 ? 'critical' : 'normal' as const },
    { name: 'Leukotsit', value: String(2 + (index % 3)), unit: 'n/ko\'rish', range: '0-3', status: 'normal' as const },
  ]

  const biochemTest = [
    { name: 'Glyukoza', value: String(5.4 + index * 0.35), unit: 'mmol/L', range: '3.9-6.1', status: index >= 7 ? 'high' : 'normal' as const },
    { name: 'Kreatinin', value: String(78 + index * 4), unit: 'mkmol/L', range: '62-106', status: index >= 8 ? 'high' : 'normal' as const },
    { name: 'CRP', value: String(3 + index * 2), unit: 'mg/L', range: '0-5', status: index >= 4 ? 'high' : 'normal' as const },
  ]

  return { bloodTest, urineTest, biochemTest }
}

function dateDaysAgo(daysAgo: number, hour = 11): Date {
  const d = new Date()
  d.setHours(hour, 0, 0, 0)
  d.setDate(d.getDate() - daysAgo)
  return d
}

async function refreshUserStats(userId: mongoose.Types.ObjectId, streak: number) {
  const completed = await CaseAttempt.countDocuments({ user: userId, status: 'completed' })
  const avgResult = await CaseAttempt.aggregate([
    { $match: { user: userId, status: 'completed' } },
    { $group: { _id: null, avgScore: { $avg: '$score' } } },
  ])

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weeklyCount = await CaseAttempt.countDocuments({
    user: userId,
    status: 'completed',
    completedAt: { $gte: weekAgo },
  })

  await User.findByIdAndUpdate(userId, {
    'stats.totalCases': completed,
    'stats.avgScore': Math.round((avgResult[0]?.avgScore || 0) * 10) / 10,
    'stats.weeklyCount': weeklyCount,
    'stats.streak': streak,
  })
}

async function seed() {
  try {
    const mongoUri = process.env.MONGODB_URI
    if (!mongoUri) {
      throw new Error('MONGODB_URI topilmadi. backend/.env faylini tekshiring.')
    }

    await mongoose.connect(mongoUri)
    console.log('MongoDB ga ulandi')

    await CaseAttempt.deleteMany({})
    await Case.deleteMany({})
    await Category.deleteMany({})
    console.log('Eski attempt/case/category ma\'lumotlari tozalandi')

    const categories = await Category.create(seedCategories.map(name => ({ name })))
    console.log(`${categories.length} ta turkum yaratildi`)

    for (const seedUser of allSeedUsers) {
      const existing = await User.findOne({ username: seedUser.username }).select('+password')

      if (!existing) {
        await User.create(seedUser)
        continue
      }

      existing.firstName = seedUser.firstName
      existing.lastName = seedUser.lastName
      existing.name = seedUser.name
      existing.email = seedUser.email
      existing.role = seedUser.role
      existing.specialty = seedUser.specialty
      existing.university = seedUser.university
      existing.isPremium = seedUser.isPremium
      existing.isEmailVerified = seedUser.isEmailVerified
      existing.subscription = seedUser.subscription
      existing.stats = seedUser.stats
      existing.password = seedUser.password
      await existing.save()
    }

    const users = await User.find({ username: { $in: allSeedUsers.map(u => u.username) } })
    console.log(`${users.length} ta foydalanuvchi yaratildi/yangilandi`)

    const usersByKey = {
      admin: users.find(u => u.username === 'admin')!,
      manager: users.find(u => u.username === 'manager')!,
      demo: users.find(u => u.username === 'demouser')!,
    }

    const generatedStudents = users.filter(u => generatedStudentUsers.some(s => s.username === u.username))
    console.log(`${generatedStudents.length} ta demo student foydalanuvchi tayyorlandi`)

    ensureSeedImagesAvailable()
    console.log('img-k rasmlari /public/uploads/img-k ga tayyorlandi')

    const managerId = usersByKey.manager._id as mongoose.Types.ObjectId

    const seedCases = caseTemplates.map((template, i) => {
      const idx = i + 1
      const labs = buildLabRows(idx)
      const instrumentalTests = buildInstrumentalTests(template)
      return {
        ...template,
        createdBy: managerId,
        status: 'published' as const,
        timeLimit: template.timeLimit ?? (template.type === 'shoshilinch' ? 300 : 600),
        tests: template.pregnancyCase ? [...TEST_MENU_LABELS] : TEST_MENU_LABELS.filter(label => label !== 'UZI'),
        instrumentalTests,
        laboratoryTests: [...LABORATORY_TESTS],
        mediaItems: buildMediaItems(idx, { pregnancyCase: template.pregnancyCase === true }),
        bloodTest: labs.bloodTest,
        urineTest: labs.urineTest,
        biochemTest: labs.biochemTest,
      }
    })

    const cases = await Case.create(seedCases)
    console.log(`${cases.length} ta klinik holat yaratildi (media + test menyular bilan)`)

    const caseById = new Map(cases.map(c => [c.caseId, c]))

    const coreCompletedPlans: AttemptPlan[] = [...demoAttempts, ...managerAttempts, ...adminAttempts]
    const coreAttemptDocs = coreCompletedPlans.map(plan => {
      const caseDoc = caseById.get(plan.caseId)
      if (!caseDoc) {
        throw new Error(`Case topilmadi: ${plan.caseId}`)
      }

      const completedAt = dateDaysAgo(plan.daysAgo)
      const startedAt = new Date(completedAt.getTime() - plan.timeSpent * 1000)

      const selectedTests =
        plan.score >= 80
          ? ['EKG', 'UZI', 'KT', 'QON ANALIZ', 'BIOXIMIK']
          : plan.score >= 60
            ? ['EKG', 'UZI', 'QON ANALIZ']
            : ['QON ANALIZ', 'SIYDIK ANALIZ']

      return {
        user: usersByKey[plan.userKey]._id,
        case: caseDoc._id,
        status: 'completed' as const,
        diagnosis: plan.score >= 75 ? caseDoc.correctDiagnosis : `Ehtimoliy tashxis: ${caseDoc.category} bo\'yicha qo\'shimcha tekshiruv zarur`,
        treatment: plan.score >= 75 ? caseDoc.correctTreatment : 'Standart protokol bo\'yicha simptomatik davolash va monitoring tavsiya etiladi.',
        selectedTests,
        score: plan.score,
        aiFeedback:
          plan.score >= 85
            ? 'A\'lo! Diagnostika va davolash ketma-ketligi to\'g\'ri.'
            : plan.score >= 70
              ? 'Yaxshi. Ayrim nuqtalarda aniqlikni oshirish mumkin.'
              : 'Qo\'shimcha mashq va differensial tashxis bo\'yicha takrorlash kerak.',
        timeSpent: plan.timeSpent,
        completedSteps: [1, 2, 3],
        startedAt,
        completedAt,
        createdAt: startedAt,
        updatedAt: completedAt,
      }
    })

    const generatedStudentAttemptDocs = generatedStudents.flatMap((student, studentIndex) => {
      const totalAttempts = 7 + (studentIndex % 6) // 7..12 attempts per student

      return Array.from({ length: totalAttempts }).map((_, attemptIndex) => {
        const caseId = generatedStudentCasePool[(studentIndex * 3 + attemptIndex) % generatedStudentCasePool.length]
        const caseDoc = caseById.get(caseId)
        if (!caseDoc) {
          throw new Error(`Generated student uchun case topilmadi: ${caseId}`)
        }

        const rawScore = 52 + ((studentIndex * 13 + attemptIndex * 9) % 44)
        const score = Math.max(45, Math.min(96, rawScore))
        const daysAgo = 4 + ((studentIndex + 1) * (attemptIndex + 2) * 2) % 180
        const baseLimit = typeof caseDoc.timeLimit === 'number' && caseDoc.timeLimit > 0 ? caseDoc.timeLimit : 600
        const timeSpent = Math.max(55, baseLimit - 20 + ((studentIndex * 17 + attemptIndex * 11) % 140))

        const completedAt = dateDaysAgo(daysAgo, 10 + (attemptIndex % 8))
        const startedAt = new Date(completedAt.getTime() - timeSpent * 1000)

        const testPool = Array.isArray(caseDoc.tests) ? caseDoc.tests : []
        const selectedTests =
          score >= 85
            ? testPool.slice(0, 6)
            : score >= 70
              ? testPool.slice(0, 4)
              : testPool.slice(0, 2)

        return {
          user: student._id,
          case: caseDoc._id,
          status: 'completed' as const,
          diagnosis: score >= 72
            ? caseDoc.correctDiagnosis
            : `Ehtimoliy tashxis (${caseDoc.category}): qo'shimcha klinik baholash zarur.`,
          treatment: score >= 72
            ? caseDoc.correctTreatment
            : 'Bosqichma-bosqich simptomatik davolash va qayta baholash tavsiya etiladi.',
          selectedTests,
          score,
          aiFeedback:
            score >= 85
              ? 'A\'lo. Tashxis va davolash rejasi mantiqiy hamda izchil.'
              : score >= 70
                ? 'Yaxshi. Asosiy yo\'nalish to\'g\'ri, ayrim nuqtalar yanada aniqlashtirilishi mumkin.'
                : 'Qoniqarli. Differensial tashxis va davolash algoritmini mustahkamlash kerak.',
          timeSpent,
          completedSteps: [1, 2, 3],
          startedAt,
          completedAt,
          createdAt: startedAt,
          updatedAt: completedAt,
        }
      })
    })

    const attemptDocs = [...coreAttemptDocs, ...generatedStudentAttemptDocs]

    await CaseAttempt.insertMany(attemptDocs)

    const inProgressCase = caseById.get('case-010')!
    const inProgressStartedAt = dateDaysAgo(1, 9)
    await CaseAttempt.create({
      user: usersByKey.demo._id,
      case: inProgressCase._id,
      status: 'in-progress',
      diagnosis: '',
      treatment: '',
      selectedTests: ['QON ANALIZ'],
      score: 0,
      aiFeedback: '',
      timeSpent: 0,
      completedSteps: [1],
      startedAt: inProgressStartedAt,
    })

    await refreshUserStats(usersByKey.demo._id as mongoose.Types.ObjectId, 7)
    await refreshUserStats(usersByKey.manager._id as mongoose.Types.ObjectId, 4)
    await refreshUserStats(usersByKey.admin._id as mongoose.Types.ObjectId, 3)

    for (let i = 0; i < generatedStudents.length; i++) {
      await refreshUserStats(generatedStudents[i]._id as mongoose.Types.ObjectId, 2 + (i % 6))
    }

    const emergencyCount = await Case.countDocuments({ type: 'shoshilinch', status: 'published', 'mediaItems.0': { $exists: true } })
    const demoCompleted = await CaseAttempt.countDocuments({ user: usersByKey.demo._id, status: 'completed' })

    console.log(`Shoshilinch holatlar: ${emergencyCount}`)
    console.log(`Demo foydalanuvchi yakunlangan urinishlari: ${demoCompleted}`)
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
