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

// Source assets live in the frontend folder; copied into the backend's own
// public/uploads so the backend can serve them independently.
const IMG_K_SOURCE_DIR = path.resolve(__dirname, '..', '..', 'frontend', 'app', 'img-k')
const IMG_K_TARGET_DIR = path.resolve(__dirname, '..', 'public', 'uploads', 'img-k')

// Patient avatar photos (frontend/image/ folder)
const PATIENT_PHOTOS_SOURCE_DIR = path.resolve(__dirname, '..', '..', 'frontend', 'image')
const PATIENT_PHOTOS_TARGET_DIR = path.resolve(__dirname, '..', 'public', 'uploads', 'patients')

const PATIENT_PHOTOS = {
  man2025: 'man20-25.png',
  man4045: 'man40-45.png',
  man7075: 'man70-75.png',
  girl2025: 'girl20-25.png',
  girl4045: 'girl40-45.png',
  girl7075: 'girl70-75.png',
} as const

function patientPhotoPath(gender: 'Erkak' | 'Ayol', age: number): string {
  const g = gender === 'Erkak' ? 'man' : 'girl'
  if (age <= 32) return `/uploads/patients/${g === 'man' ? PATIENT_PHOTOS.man2025 : PATIENT_PHOTOS.girl2025}`
  if (age <= 57) return `/uploads/patients/${g === 'man' ? PATIENT_PHOTOS.man4045 : PATIENT_PHOTOS.girl4045}`
  return `/uploads/patients/${g === 'man' ? PATIENT_PHOTOS.man7075 : PATIENT_PHOTOS.girl7075}`
}

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

// Helper: pick ageGroup label from age
function ageGroup(age: number): string {
  if (age < 18) return 'Bola'
  if (age < 40) return 'Yosh'
  if (age < 60) return 'Katta yoshli'
  return 'Keksa'
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
]

// NOTE: demo/sample students and their fake attempts were removed for
// production. Seeding now only creates the staff accounts (admin + content
// manager) and the real clinical cases. Leaderboard/stats stay empty until
// real users start solving cases.
const allSeedUsers = [...seedUsers]

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

// ─── Generated case bank ────────────────────────────────────────
// Each category gets 5 clinical cases; emergency type gets 20 short-timed cases.
// Photos/media are attached automatically based on patient age + gender.

type DiseaseSpec = {
  title: string
  difficulty: number
  type: 'diagnostika' | 'jarrohlik' | 'shoshilinch'
  isPremium?: boolean
  age: number
  gender: 'Erkak' | 'Ayol'
  vitals: { bp: string; hr: string; temp: string; spo2: string }
  complaints: string
  history: string
  dx: string  // correctDiagnosis
  tx: string  // correctTreatment
  timeLimit?: number
}

const DISEASE_BANK: Record<string, DiseaseSpec[]> = {
  Kardiologiya: [
    { title: 'Arterial gipertenziya krizi', difficulty: 3, type: 'diagnostika', age: 58, gender: 'Erkak', vitals: { bp: '195/115', hr: '92', temp: '36.7', spo2: '96' }, complaints: 'Kuchli bosh og\'rig\'i, ko\'z oldi qorong\'ilashishi, yurak hapqirishi.', history: 'Gipertoniya 12 yil, dorilarni muntazam ichmaydi.', dx: 'Gipertonik kriz', tx: 'Qon bosimini bosqichma-bosqich tushirish, kaptopril/labetalol, monitoring.' },
    { title: 'Yurak ritmi buzilishi — atrial fibrilatsiya', difficulty: 4, type: 'diagnostika', isPremium: true, age: 66, gender: 'Ayol', vitals: { bp: '138/86', hr: '141', temp: '36.6', spo2: '95' }, complaints: 'Notekis yurak urishi, hansirash, holsizlik.', history: 'Qalqonsimon bez giperfunksiyasi anamnezi.', dx: 'Paroksizmal atrial fibrilatsiya', tx: 'Ritmni nazorat (beta-blokator), antikoagulyatsiya bahosi (CHA2DS2-VASc), EKG monitoring.' },
    { title: 'Surunkali yurak yetishmovchiligi', difficulty: 3, type: 'diagnostika', age: 71, gender: 'Erkak', vitals: { bp: '120/78', hr: '98', temp: '36.5', spo2: '92' }, complaints: 'Oyoq shishi, kechalari hansirash, charchoq.', history: 'O\'tkazilgan miokard infarkti 3 yil oldin.', dx: 'Surunkali yurak yetishmovchiligi (FK III)', tx: 'Diuretik, ACE-ingibitor, beta-blokator, tuz cheklash va vazn nazorati.' },
    { title: 'Miokardit shubhasi', difficulty: 4, type: 'diagnostika', isPremium: true, age: 28, gender: 'Erkak', vitals: { bp: '110/70', hr: '112', temp: '37.8', spo2: '95' }, complaints: 'Ko\'krak og\'rig\'i, hansirash, yaqinda o\'tkazilgan virusli infeksiya.', history: 'Bir hafta oldin ORVI, hozir holat yomonlashgan.', dx: 'O\'tkir miokardit', tx: 'Yotoq rejimi, yurak yetishmovchiligini davolash, kardiolog kuzatuvi, ehtiyot jismoniy yuk.' },
    { title: 'Stabil stenokardiya', difficulty: 2, type: 'diagnostika', age: 54, gender: 'Ayol', vitals: { bp: '145/90', hr: '84', temp: '36.6', spo2: '97' }, complaints: 'Jismoniy zo\'riqishda ko\'krak og\'rig\'i, dam olishda o\'tadi.', history: 'Giperlipidemiya, oilaviy IHD anamnezi.', dx: 'Zo\'riqish stenokardiyasi (II FK)', tx: 'Nitratlar, statin, antiagregant, xavf omillarini boshqarish.' },
  ],
  Nevrologiya: [
    { title: 'Migren xuruji', difficulty: 2, type: 'diagnostika', age: 31, gender: 'Ayol', vitals: { bp: '120/78', hr: '76', temp: '36.7', spo2: '99' }, complaints: 'Pulsatsion bir tomonlama bosh og\'rig\'i, fotofobiya, ko\'ngil aynishi.', history: 'Avval ham shunga o\'xshash xurujlar bo\'lgan.', dx: 'Aura bilan migren', tx: 'Triptan, analgetik, triggerlardan saqlanish, profilaktika.' },
    { title: 'Bel-dumg\'aza radikulopatiyasi', difficulty: 2, type: 'diagnostika', age: 45, gender: 'Erkak', vitals: { bp: '130/82', hr: '78', temp: '36.6', spo2: '98' }, complaints: 'Belda og\'riq, oyoqqa irradiatsiya, harakatda kuchayadi.', history: 'Og\'ir yuk ko\'targandan keyin boshlangan.', dx: 'L5-S1 disk gerniyasi, radikulopatiya', tx: 'NPVP, fizioterapiya, harakat rejimi, MRT bilan baholash.' },
    { title: 'Epileptik xuruj', difficulty: 3, type: 'diagnostika', isPremium: true, age: 24, gender: 'Erkak', vitals: { bp: '125/80', hr: '96', temp: '36.9', spo2: '96' }, complaints: 'Hushni yo\'qotish bilan tutqanoq, til tishlash.', history: 'Birinchi marta kuzatilgan xuruj.', dx: 'Birlamchi generalizatsiyalangan epileptik xuruj', tx: 'EEG, MRT, antikonvulsant boshlash bo\'yicha qaror, xavfsizlik chora-tadbirlari.' },
    { title: 'Periferik yuz nervi falaji', difficulty: 3, type: 'diagnostika', age: 38, gender: 'Ayol', vitals: { bp: '122/79', hr: '74', temp: '36.7', spo2: '98' }, complaints: 'Yuz bir tomonining osilishi, ko\'z yumolmaslik.', history: 'Sovuq qotgandan keyin to\'satdan boshlangan.', dx: 'Bell falaji (idiopatik)', tx: 'Kortikosteroid, ko\'z himoyasi, fizioterapiya, kuzatuv.' },
    { title: 'Parkinson kasalligi', difficulty: 4, type: 'diagnostika', isPremium: true, age: 68, gender: 'Erkak', vitals: { bp: '128/80', hr: '72', temp: '36.6', spo2: '97' }, complaints: 'Qo\'l titrashi, harakat sekinlashishi, mushak rigidligi.', history: 'Belgilar asta-sekin 2 yil davomida rivojlangan.', dx: 'Parkinson kasalligi', tx: 'Levodopa/karbidopa, nevrolog kuzatuvi, reabilitatsiya.' },
  ],
  Pediatriya: [
    { title: 'O\'tkir bronxiolit', difficulty: 3, type: 'diagnostika', age: 1, gender: 'Erkak', vitals: { bp: '90/55', hr: '140', temp: '38.0', spo2: '92' }, complaints: 'Yo\'tal, hansirash, ovqatlanishdan bosh tortish.', history: 'So\'nggi 2 kunda yuqori nafas yo\'llari infeksiyasi.', dx: 'RSV bronxioliti', tx: 'Kislorod, suyuqlik, monitoring, ehtiyojga ko\'ra nebulizatsiya.' },
    { title: 'Bolada o\'tkir otit', difficulty: 2, type: 'diagnostika', age: 4, gender: 'Ayol', vitals: { bp: '95/60', hr: '118', temp: '38.6', spo2: '98' }, complaints: 'Quloq og\'rig\'i, yig\'loqilik, isitma.', history: 'Yaqinda shamollagan.', dx: 'O\'tkir o\'rta otit', tx: 'Analgetik, kerak bo\'lsa amoksitsillin, kuzatuv.' },
    { title: 'Bola ich ketishi va degidratatsiya', difficulty: 3, type: 'diagnostika', isPremium: true, age: 2, gender: 'Erkak', vitals: { bp: '88/52', hr: '132', temp: '37.6', spo2: '97' }, complaints: 'Tez-tez suyuq ich ketish, qusish, sustlik.', history: 'Bir kundan beri belgilar.', dx: 'O\'tkir gastroenterit, o\'rtacha degidratatsiya', tx: 'Og\'iz orqali regidratatsiya (ORS), kerak bo\'lsa IV suyuqlik, sink.' },
    { title: 'Febril tutqanoq', difficulty: 3, type: 'diagnostika', age: 2, gender: 'Ayol', vitals: { bp: '90/55', hr: '128', temp: '39.4', spo2: '97' }, complaints: 'Yuqori isitma fonida qisqa tutqanoq.', history: 'Oilada febril tutqanoq anamnezi.', dx: 'Oddiy febril tutqanoq', tx: 'Isitmani tushirish, sababni aniqlash, ota-onaga maslahat, kuzatuv.' },
    { title: 'Bolalar pnevmoniyasi', difficulty: 3, type: 'diagnostika', age: 6, gender: 'Erkak', vitals: { bp: '100/62', hr: '122', temp: '38.9', spo2: '93' }, complaints: 'Yo\'tal, isitma, tez nafas olish.', history: '3 kun oldin boshlangan, holat yomonlashgan.', dx: 'Jamoatdan orttirilgan pnevmoniya', tx: 'Antibiotik (amoksitsillin), suyuqlik, kislorod ehtiyojga ko\'ra.' },
  ],
  Jarrohlik: [
    { title: 'O\'tkir xoletsistit', difficulty: 3, type: 'jarrohlik', age: 49, gender: 'Ayol', vitals: { bp: '130/82', hr: '96', temp: '38.2', spo2: '97' }, complaints: 'O\'ng qovurg\'a ostida og\'riq, ko\'ngil aynishi, isitma.', history: 'O\'t-tosh kasalligi anamnezi.', dx: 'O\'tkir kalkulyoz xoletsistit', tx: 'Infuzion terapiya, antibiotik, og\'riq nazorati, xolesistektomiya.' },
    { title: 'Ingvinal churra', difficulty: 2, type: 'jarrohlik', age: 52, gender: 'Erkak', vitals: { bp: '128/80', hr: '78', temp: '36.6', spo2: '98' }, complaints: 'Chov sohasida bo\'rtma, zo\'riqishda kuchayadi.', history: 'Bir necha oydan beri sekin kattalashmoqda.', dx: 'Reduksiyalanuvchi ingvinal churra', tx: 'Rejali gerniyaplastika, asoratlar bo\'yicha maslahat.' },
    { title: 'O\'tkir ichak tutilishi', difficulty: 4, type: 'jarrohlik', isPremium: true, age: 63, gender: 'Erkak', vitals: { bp: '118/76', hr: '104', temp: '37.4', spo2: '96' }, complaints: 'Qorin shishishi, qusish, najas va gaz to\'xtashi.', history: 'O\'tmishda qorin operatsiyasi bo\'lgan.', dx: 'Mexanik ichak tutilishi (chandiqli)', tx: 'Nazogastral dekompressiya, infuziya, jarrohlik baholash.' },
    { title: 'Anorektal abssess', difficulty: 2, type: 'jarrohlik', age: 35, gender: 'Erkak', vitals: { bp: '126/80', hr: '88', temp: '37.9', spo2: '98' }, complaints: 'Orqa chiqaruv sohasida og\'riq, shish, isitma.', history: 'Bir necha kun oldin boshlangan.', dx: 'Perianal abssess', tx: 'Jarrohlik drenaj, antibiotik, og\'riq nazorati.' },
    { title: 'Tireoid tugun (operativ baholash)', difficulty: 3, type: 'jarrohlik', isPremium: true, age: 47, gender: 'Ayol', vitals: { bp: '124/78', hr: '82', temp: '36.6', spo2: '98' }, complaints: 'Bo\'yinda kattalashgan tugun, yutishda noqulaylik.', history: 'Tugun sekin kattalashmoqda.', dx: 'Qalqonsimon bez tuguni (TIRADS baholash zarur)', tx: 'UZI + nozik ignali biopsiya, kerak bo\'lsa tireoidektomiya.' },
  ],
  Ginekologiya: [
    { title: 'Tuxumdon kistasi buralishi', difficulty: 4, type: 'jarrohlik', isPremium: true, age: 27, gender: 'Ayol', vitals: { bp: '110/70', hr: '108', temp: '37.2', spo2: '98' }, complaints: 'To\'satdan kuchli bir tomonlama qorin og\'rig\'i, qusish.', history: 'Avval tuxumdon kistasi aniqlangan.', dx: 'Tuxumdon buralishi (torsion)', tx: 'Shoshilinch UZI, jarrohlik (laparoskopiya), og\'riq nazorati.' },
    { title: 'Tos a\'zolari yallig\'lanishi (PID)', difficulty: 3, type: 'diagnostika', age: 24, gender: 'Ayol', vitals: { bp: '116/74', hr: '94', temp: '38.1', spo2: '98' }, complaints: 'Pastki qorin og\'rig\'i, ajralma, isitma.', history: 'Yangi jinsiy sherik.', dx: 'Tos a\'zolari yallig\'lanish kasalligi', tx: 'Keng spektrli antibiotik, sherikni davolash, kuzatuv.' },
    { title: 'Disfunksional bachadon qon ketishi', difficulty: 2, type: 'diagnostika', age: 43, gender: 'Ayol', vitals: { bp: '118/76', hr: '88', temp: '36.6', spo2: '98' }, complaints: 'Kuchli va uzoq hayz qon ketishi.', history: 'Klimaks oldi davri.', dx: 'Anovulyator disfunksional qon ketish', tx: 'Gormonal korreksiya, anemiya bahosi, endometriy baholash.' },
    { title: 'Bachadon miomasi', difficulty: 3, type: 'diagnostika', isPremium: true, age: 41, gender: 'Ayol', vitals: { bp: '120/78', hr: '80', temp: '36.6', spo2: '98' }, complaints: 'Kuchli hayz, bosim hissi, tez-tez siyish.', history: 'UZI da mioma aniqlangan.', dx: 'Bachadon leyomiomasi', tx: 'Kuzatuv yoki gormonal/jarrohlik davolash, anemiyani tuzatish.' },
    { title: 'Vulvovaginal kandidoz', difficulty: 1, type: 'diagnostika', age: 29, gender: 'Ayol', vitals: { bp: '116/74', hr: '76', temp: '36.6', spo2: '99' }, complaints: 'Qichishish, oq pishloqsimon ajralma.', history: 'Yaqinda antibiotik qabul qilgan.', dx: 'Vulvovaginal kandidoz', tx: 'Antifungal (flukonazol/klotrimazol), gigiena maslahati.' },
  ],
  Pulmonologiya: [
    { title: 'Jamoatdan orttirilgan pnevmoniya', difficulty: 3, type: 'diagnostika', age: 55, gender: 'Erkak', vitals: { bp: '124/78', hr: '98', temp: '38.7', spo2: '92' }, complaints: 'Yo\'tal, balg\'am, isitma, ko\'krak og\'rig\'i.', history: 'Chekuvchi.', dx: 'Jamoatdan orttirilgan pnevmoniya', tx: 'Antibiotik (CURB-65), kislorod, suyuqlik, kuzatuv.' },
    { title: 'O\'pkaning surunkali obstruktiv kasalligi (XOBL)', difficulty: 3, type: 'diagnostika', isPremium: true, age: 64, gender: 'Erkak', vitals: { bp: '132/82', hr: '96', temp: '36.8', spo2: '90' }, complaints: 'Surunkali yo\'tal, hansirash, balg\'am.', history: '40 yil chekish anamnezi.', dx: 'XOBL kuchayishi', tx: 'Bronxodilatator, kortikosteroid, kislorod, chekishni tashlash.' },
    { title: 'Bronxial astma (nazoratsiz)', difficulty: 2, type: 'diagnostika', age: 22, gender: 'Ayol', vitals: { bp: '118/74', hr: '92', temp: '36.6', spo2: '94' }, complaints: 'Tunги yo\'tal, xirillash, hansirash.', history: 'Bolalikdan astma.', dx: 'Nazoratsiz bronxial astma', tx: 'Ingalyatsion kortikosteroid + LABA, harakat rejasi, triggerlarni kamaytirish.' },
    { title: 'Plevra bo\'shlig\'ida suyuqlik (plevrit)', difficulty: 3, type: 'diagnostika', isPremium: true, age: 58, gender: 'Erkak', vitals: { bp: '126/80', hr: '90', temp: '37.6', spo2: '93' }, complaints: 'Ko\'krak og\'rig\'i, hansirash, quruq yo\'tal.', history: 'So\'nggi haftalarda holsizlik.', dx: 'Eksudativ plevrit', tx: 'Torakotsentez, sababni aniqlash, etiotrop davolash.' },
    { title: 'Sil kasalligi shubhasi', difficulty: 4, type: 'diagnostika', isPremium: true, age: 36, gender: 'Erkak', vitals: { bp: '118/74', hr: '88', temp: '37.8', spo2: '95' }, complaints: 'Uzoq yo\'tal, tунги terlash, vazn yo\'qotish.', history: 'Sil bilan kasallangan bilan kontakt.', dx: 'O\'pka sili (shubha)', tx: 'Balg\'am tahlili (KUB/GeneXpert), izolyatsiya, fтiziatr konsultatsiyasi.' },
  ],
  Endokrinologiya: [
    { title: 'Qandli diabet 2-tip debyuti', difficulty: 2, type: 'diagnostika', age: 50, gender: 'Erkak', vitals: { bp: '138/86', hr: '80', temp: '36.6', spo2: '98' }, complaints: 'Ko\'p chanqash, tez-tez siyish, charchoq.', history: 'Semizlik, oilaviy diabet anamnezi.', dx: '2-tip qandli diabet', tx: 'Turmush tarzi, metformin, glikemiya nazorati, ta\'lim.' },
    { title: 'Qalqonsimon bez giperfunksiyasi', difficulty: 3, type: 'diagnostika', isPremium: true, age: 34, gender: 'Ayol', vitals: { bp: '134/72', hr: '112', temp: '37.1', spo2: '98' }, complaints: 'Vazn yo\'qotish, yurak tezlashishi, asabiylik.', history: 'Bo\'yin sohasi kattalashgan.', dx: 'Tireotoksikoz (Graves shubhasi)', tx: 'Tireostatik, beta-blokator, TTG/T3/T4, endokrinolog kuzatuvi.' },
    { title: 'Gipotireoz', difficulty: 2, type: 'diagnostika', age: 47, gender: 'Ayol', vitals: { bp: '118/76', hr: '58', temp: '36.2', spo2: '98' }, complaints: 'Charchoq, vazn ortishi, sovuqqotish, quruq teri.', history: 'Sekin rivojlangan.', dx: 'Birlamchi gipotireoz', tx: 'Levotiroksin, TTG nazorati, davolash titratsiyasi.' },
    { title: 'Buyrak usti bezi yetishmovchiligi', difficulty: 4, type: 'diagnostika', isPremium: true, age: 39, gender: 'Erkak', vitals: { bp: '92/60', hr: '98', temp: '36.8', spo2: '97' }, complaints: 'Holsizlik, ishtaha yo\'qligi, teri qoraygani.', history: 'Vazn yo\'qotgan, past bosim.', dx: 'Surunkali buyrak usti yetishmovchiligi (Addison)', tx: 'Glyukokortikoid o\'rnini bosish, elektrolit nazorati, endokrinolog.' },
    { title: 'Metabolik sindrom', difficulty: 2, type: 'diagnostika', age: 45, gender: 'Erkak', vitals: { bp: '142/90', hr: '82', temp: '36.6', spo2: '98' }, complaints: 'Qorin semizligi, charchoq, profilaktik tekshiruv.', history: 'Harakatsiz turmush, giperlipidemiya.', dx: 'Metabolik sindrom', tx: 'Turmush tarzi, vazn kamaytirish, lipid va bosim nazorati.' },
  ],
  Gastroenterologiya: [
    { title: 'Oshqozon yara kasalligi', difficulty: 3, type: 'diagnostika', age: 44, gender: 'Erkak', vitals: { bp: '124/78', hr: '82', temp: '36.6', spo2: '98' }, complaints: 'Epigastral og\'riq, ovqatdan keyin kuchayadi, ko\'ngil aynishi.', history: 'NPVP muntazam qabul qilgan.', dx: 'Oshqozon yarasi (H.pylori baholash)', tx: 'PPI, H.pylori eradikatsiyasi, NPVP to\'xtatish, endoskopiya.' },
    { title: 'O\'tkir pankreatit', difficulty: 4, type: 'diagnostika', isPremium: true, age: 48, gender: 'Erkak', vitals: { bp: '118/74', hr: '104', temp: '37.8', spo2: '95' }, complaints: 'Belga tarqaluvchi kuchli qorin og\'rig\'i, qusish.', history: 'Alkogol iste\'moli.', dx: 'O\'tkir pankreatit', tx: 'Ochlik, infuzion terapiya, og\'riq nazorati, lipaza/amilaza, monitoring.' },
    { title: 'Gastroezofageal reflyuks', difficulty: 1, type: 'diagnostika', age: 37, gender: 'Ayol', vitals: { bp: '116/74', hr: '74', temp: '36.6', spo2: '99' }, complaints: 'Ko\'krak ortida yonish, kekirish, tunda kuchayadi.', history: 'Ortiqcha vazn.', dx: 'GERB', tx: 'Turmush tarzi, PPI, ovqatlanish rejimini o\'zgartirish.' },
    { title: 'Surunkali gepatit', difficulty: 3, type: 'diagnostika', isPremium: true, age: 51, gender: 'Erkak', vitals: { bp: '122/78', hr: '78', temp: '36.7', spo2: '98' }, complaints: 'Charchoq, o\'ng qovurg\'a ostida og\'irlik, sariqlik.', history: 'Virusli gepatit anamnezi.', dx: 'Surunkali virusli gepatit', tx: 'Virusologik baholash, antiviral terapiya, jigar funksiya nazorati.' },
    { title: 'Yo\'g\'on ichak yallig\'lanishi (kolit)', difficulty: 3, type: 'diagnostika', age: 33, gender: 'Ayol', vitals: { bp: '118/76', hr: '88', temp: '37.6', spo2: '98' }, complaints: 'Qonli ich ketish, qorin og\'rig\'i, isitma.', history: 'Surunkali kechuvchi belgilar.', dx: 'Yallig\'lanishli ichak kasalligi (kolit)', tx: 'Kolonoskopiya, aminosalitsilat/kortikosteroid, gastroenterolog kuzatuvi.' },
  ],
  Nefrologiya: [
    { title: 'O\'tkir piyelonefrit', difficulty: 3, type: 'diagnostika', age: 32, gender: 'Ayol', vitals: { bp: '116/74', hr: '98', temp: '38.8', spo2: '98' }, complaints: 'Bel og\'rig\'i, isitma, og\'riqli siyish.', history: 'Yaqinda siydik yo\'li infeksiyasi.', dx: 'O\'tkir piyelonefrit', tx: 'Antibiotik, suyuqlik, og\'riq nazorati, siydik ekmasi.' },
    { title: 'Surunkali buyrak kasalligi', difficulty: 4, type: 'diagnostika', isPremium: true, age: 60, gender: 'Erkak', vitals: { bp: '152/92', hr: '80', temp: '36.6', spo2: '97' }, complaints: 'Shish, charchoq, siydik kamayishi.', history: 'Diabet va gipertoniya anamnezi.', dx: 'Surunkali buyrak kasalligi (3-bosqich)', tx: 'Bosim/glikemiya nazorati, dieta, nefrolog kuzatuvi, ACE-ingibitor.' },
    { title: 'Nefrolitiaz (buyrak toshi)', difficulty: 3, type: 'diagnostika', age: 40, gender: 'Erkak', vitals: { bp: '128/82', hr: '96', temp: '36.8', spo2: '98' }, complaints: 'Belda sanchiqli og\'riq, qonli siydik.', history: 'Avval ham tosh tushgan.', dx: 'Buyrak sanchig\'i (urolitiaz)', tx: 'Og\'riq nazorati (NPVP), suyuqlik, KT/UZI, urolog kuzatuvi.' },
    { title: 'Nefrotik sindrom', difficulty: 4, type: 'diagnostika', isPremium: true, age: 26, gender: 'Erkak', vitals: { bp: '130/84', hr: '82', temp: '36.6', spo2: '98' }, complaints: 'Kuchli shish, ko\'pikli siydik.', history: 'Sekin rivojlangan.', dx: 'Nefrotik sindrom', tx: 'Proteinuriya baholash, diuretik, kortikosteroid, nefrolog.' },
    { title: 'Siydik yo\'li infeksiyasi (sistit)', difficulty: 1, type: 'diagnostika', age: 28, gender: 'Ayol', vitals: { bp: '116/74', hr: '80', temp: '37.2', spo2: '99' }, complaints: 'Tez-tez va og\'riqli siyish, qistovli his.', history: 'Birinchi epizod.', dx: 'O\'tkir sistit', tx: 'Qisqa kurs antibiotik, suyuqlik, gigiena maslahati.' },
  ],
  Urologiya: [
    { title: 'Prostata gipertrofiyasi', difficulty: 2, type: 'diagnostika', age: 67, gender: 'Erkak', vitals: { bp: '134/84', hr: '76', temp: '36.6', spo2: '98' }, complaints: 'Siyish qiyinligi, tunги siyish, oqim zaifligi.', history: 'Sekin rivojlangan belgilar.', dx: 'Prostataning xavfsiz giperplaziyasi (BPH)', tx: 'Alfa-blokator, 5-alfa reduktaza ingibitori, PSA nazorati.' },
    { title: 'O\'tkir bakterial prostatit', difficulty: 3, type: 'diagnostika', isPremium: true, age: 42, gender: 'Erkak', vitals: { bp: '126/80', hr: '94', temp: '38.4', spo2: '98' }, complaints: 'Chot oraligi og\'rig\'i, isitma, og\'riqli siyish.', history: 'To\'satdan boshlangan.', dx: 'O\'tkir bakterial prostatit', tx: 'Antibiotik, og\'riq nazorati, suyuqlik, urolog kuzatuvi.' },
    { title: 'Moyak buralishi', difficulty: 4, type: 'jarrohlik', isPremium: true, age: 19, gender: 'Erkak', vitals: { bp: '124/78', hr: '102', temp: '36.9', spo2: '99' }, complaints: 'To\'satdan kuchli moyak og\'rig\'i, shish.', history: 'Bir necha soat oldin boshlangan.', dx: 'Moyak torsiyasi', tx: 'Shoshilinch jarrohlik (orxidopeksiya), Dopler UZI, og\'riq nazorati.' },
    { title: 'Siydik pufagi saratoni (gematuriya)', difficulty: 4, type: 'diagnostika', isPremium: true, age: 64, gender: 'Erkak', vitals: { bp: '132/82', hr: '80', temp: '36.6', spo2: '98' }, complaints: 'Og\'riqsiz qonli siydik.', history: 'Chekuvchi.', dx: 'Siydik pufagi shishi (shubha)', tx: 'Sistoskopiya, sitologiya, KT urografiya, urolog kuzatuvi.' },
    { title: 'Erkaklar bepushtligi baholash', difficulty: 2, type: 'diagnostika', age: 33, gender: 'Erkak', vitals: { bp: '122/78', hr: '74', temp: '36.6', spo2: '99' }, complaints: '2 yildan beri bola ko\'rmaslik.', history: 'Anamnez og\'irlashmagan.', dx: 'Erkak omilli bepushtlik (baholash)', tx: 'Spermogramma, gormonal tekshiruv, urolog-androlog kuzatuvi.' },
  ],
  Dermatologiya: [
    { title: 'Atopik dermatit', difficulty: 1, type: 'diagnostika', age: 8, gender: 'Ayol', vitals: { bp: '95/60', hr: '88', temp: '36.6', spo2: '99' }, complaints: 'Teri quruqligi, qichishish, toshma.', history: 'Atopiya oilaviy anamnezi.', dx: 'Atopik dermatit', tx: 'Emollientlar, topik kortikosteroid, triggerlardan saqlanish.' },
    { title: 'Psoriaz', difficulty: 2, type: 'diagnostika', age: 38, gender: 'Erkak', vitals: { bp: '124/80', hr: '76', temp: '36.6', spo2: '99' }, complaints: 'Tirsak va tizzada kumushsimon tangachali toshma.', history: 'Surunkali kechuvchi.', dx: 'Vulgar psoriaz', tx: 'Topik kortikosteroid + D vitamin analogi, kuzatuv, dermatolog.' },
    { title: 'Allergik kontakt dermatit', difficulty: 1, type: 'diagnostika', age: 30, gender: 'Ayol', vitals: { bp: '116/74', hr: '78', temp: '36.6', spo2: '99' }, complaints: 'Yangi krem ishlatgandan keyin qizarish, qichishish.', history: 'Allergiya anamnezi.', dx: 'Allergik kontakt dermatit', tx: 'Allergen olib tashlash, topik steroid, antigistamin.' },
    { title: 'Opoясывающий herpes (zoster)', difficulty: 3, type: 'diagnostika', isPremium: true, age: 62, gender: 'Erkak', vitals: { bp: '128/80', hr: '80', temp: '37.4', spo2: '98' }, complaints: 'Bir tomonlama og\'riqli pufakchali toshma.', history: 'Yaqinda stress va charchoq.', dx: 'Belbog\' temiratkisi (herpes zoster)', tx: 'Antiviral (asiklovir), og\'riq nazorati, asoratlar profilaktikasi.' },
    { title: 'Bakterial selulit', difficulty: 3, type: 'diagnostika', age: 55, gender: 'Erkak', vitals: { bp: '126/80', hr: '92', temp: '38.2', spo2: '98' }, complaints: 'Oyoqda qizarish, isish, og\'riq, shish.', history: 'Teri shikastlanishi.', dx: 'Selulit', tx: 'Antibiotik, oyoqni ko\'tarish, chegarani belgilash, kuzatuv.' },
  ],
  Oftalmologiya: [
    { title: 'O\'tkir konyunktivit', difficulty: 1, type: 'diagnostika', age: 25, gender: 'Ayol', vitals: { bp: '116/74', hr: '74', temp: '36.6', spo2: '99' }, complaints: 'Ko\'z qizarishi, yiringli ajralma, qichishish.', history: 'Kontakt orqali yuqqan.', dx: 'Bakterial konyunktivit', tx: 'Topik antibiotik tomchilar, gigiena, kuzatuv.' },
    { title: 'O\'tkir glaukoma xuruji', difficulty: 4, type: 'shoshilinch', isPremium: true, age: 63, gender: 'Ayol', vitals: { bp: '142/88', hr: '88', temp: '36.6', spo2: '98' }, complaints: 'To\'satdan kuchli ko\'z og\'rig\'i, ko\'rish xiralashishi, qusish.', history: 'Avval ko\'z bosimi yuqori bo\'lgan.', dx: 'O\'tkir yopiq burchakli glaukoma', tx: 'Shoshilinch ko\'z bosimini tushirish, oftalmolog konsultatsiyasi.', timeLimit: 180 },
    { title: 'Diabetik retinopatiya', difficulty: 3, type: 'diagnostika', isPremium: true, age: 58, gender: 'Erkak', vitals: { bp: '138/86', hr: '78', temp: '36.6', spo2: '98' }, complaints: 'Ko\'rish sekin pasayishi, dog\'lar.', history: 'Uzoq yillik diabet.', dx: 'Diabetik retinopatiya', tx: 'Glikemiya nazorati, oftalmologik kuzatuv, kerak bo\'lsa lazer.' },
    { title: 'Katarakta', difficulty: 2, type: 'diagnostika', age: 70, gender: 'Erkak', vitals: { bp: '134/82', hr: '74', temp: '36.6', spo2: '98' }, complaints: 'Ko\'rish asta-sekin xiralashishi, yorug\'likdan diskomfort.', history: 'Yoshga bog\'liq.', dx: 'Yoshga bog\'liq katarakta', tx: 'Oftalmolog baholash, ko\'rish ta\'sirlanganda jarrohlik (fakoemulsifikatsiya).' },
    { title: 'Quruq ko\'z sindromi', difficulty: 1, type: 'diagnostika', age: 42, gender: 'Ayol', vitals: { bp: '118/76', hr: '74', temp: '36.6', spo2: '99' }, complaints: 'Ko\'zda qum hissi, qizarish, charchoq.', history: 'Uzoq ekran oldida ishlash.', dx: 'Quruq ko\'z sindromi', tx: 'Sun\'iy yosh, ekran rejimi, gigiena.' },
  ],
  Otorinolaringologiya: [
    { title: 'O\'tkir tonzillit', difficulty: 1, type: 'diagnostika', age: 16, gender: 'Erkak', vitals: { bp: '110/70', hr: '92', temp: '38.6', spo2: '98' }, complaints: 'Tomoq og\'rig\'i, yutishda og\'riq, isitma.', history: 'Yaqinda shamollagan.', dx: 'O\'tkir bakterial tonzillit', tx: 'Antibiotik (streptokokk tasdiqlansa), analgetik, suyuqlik.' },
    { title: 'O\'tkir sinusit', difficulty: 2, type: 'diagnostika', age: 34, gender: 'Ayol', vitals: { bp: '118/76', hr: '78', temp: '37.6', spo2: '98' }, complaints: 'Yuz og\'rig\'i, burun bitishi, yiringli ajralma.', history: '10 kundan beri davom etmoqda.', dx: 'O\'tkir bakterial sinusit', tx: 'Burun yuvish, dekongestant, kerak bo\'lsa antibiotik.' },
    { title: 'Burun qon ketishi', difficulty: 2, type: 'shoshilinch', age: 50, gender: 'Erkak', vitals: { bp: '158/96', hr: '88', temp: '36.6', spo2: '98' }, complaints: 'To\'xtamaydigan burun qon ketishi.', history: 'Gipertoniya anamnezi.', dx: 'Old burun qon ketishi (epistaksis)', tx: 'Bosim, tamponada, bosim nazorati, manba aniqlash.', timeLimit: 240 },
    { title: 'Otit media (kattalar)', difficulty: 2, type: 'diagnostika', age: 29, gender: 'Ayol', vitals: { bp: '116/74', hr: '80', temp: '37.8', spo2: '98' }, complaints: 'Quloq og\'rig\'i, eshitish pasayishi.', history: 'Yuqori nafas yo\'llari infeksiyasi.', dx: 'O\'tkir o\'rta otit', tx: 'Analgetik, kuzatuv, kerak bo\'lsa antibiotik.' },
    { title: 'Eshitishning to\'satdan pasayishi', difficulty: 3, type: 'diagnostika', isPremium: true, age: 47, gender: 'Erkak', vitals: { bp: '124/78', hr: '76', temp: '36.6', spo2: '98' }, complaints: 'Bir tomonda to\'satdan eshitish yo\'qolishi, shovqin.', history: 'Bir kun oldin boshlangan.', dx: 'To\'satdan sensonevral eshitish yo\'qolishi', tx: 'Shoshilinch LOR, audiometriya, kortikosteroid.' },
  ],
  Travmatologiya: [
    { title: 'Bilak suyagi sinishi', difficulty: 2, type: 'jarrohlik', age: 27, gender: 'Erkak', vitals: { bp: '124/78', hr: '88', temp: '36.6', spo2: '99' }, complaints: 'Yiqilgandan keyin bilakda og\'riq, shish, deformatsiya.', history: 'Sport jarohati.', dx: 'Bilak distal qismi sinishi', tx: 'Rentgen, repozitsiya va immobilizatsiya (gips), og\'riq nazorati.' },
    { title: 'Yelka bo\'g\'imi chiqishi', difficulty: 3, type: 'jarrohlik', age: 31, gender: 'Erkak', vitals: { bp: '126/80', hr: '92', temp: '36.6', spo2: '98' }, complaints: 'Yiqilgandan keyin yelkada kuchli og\'riq, harakatsizlik.', history: 'Avval ham chiqqan.', dx: 'Yelka old chiqishi (dislokatsiya)', tx: 'Rentgen, repozitsiya, immobilizatsiya, reabilitatsiya.' },
    { title: 'Tovon-boldir bog\'lami cho\'zilishi', difficulty: 1, type: 'diagnostika', age: 23, gender: 'Ayol', vitals: { bp: '118/74', hr: '80', temp: '36.6', spo2: '99' }, complaints: 'Oyoq panjasi bukilgandan keyin og\'riq, shish.', history: 'Sport paytida.', dx: 'Toʻpiq bog\'lami cho\'zilishi (II daraja)', tx: 'RICE protokoli, og\'riq nazorati, bosqichma-bosqich yuk.' },
    { title: 'Son suyagi bo\'yni sinishi', difficulty: 4, type: 'jarrohlik', isPremium: true, age: 74, gender: 'Ayol', vitals: { bp: '132/82', hr: '94', temp: '36.6', spo2: '96' }, complaints: 'Yiqilgandan keyin chov og\'rig\'i, oyoqqa turolmaslik.', history: 'Osteoporoz anamnezi.', dx: 'Son suyagi bo\'yni sinishi', tx: 'Rentgen, og\'riq nazorati, jarrohlik (osteosintez/endoprotezlash).' },
    { title: 'Tizza menisk shikasti', difficulty: 3, type: 'diagnostika', isPremium: true, age: 29, gender: 'Erkak', vitals: { bp: '122/78', hr: '78', temp: '36.6', spo2: '99' }, complaints: 'Tizzada og\'riq, bloklanish hissi, shish.', history: 'Sport jarohati (burilish).', dx: 'Menisk yirtilishi', tx: 'MRT, fizioterapiya, kerak bo\'lsa artroskopiya.' },
  ],
  Anesteziologiya: [
    { title: 'Operatsiya oldi anesteziologik baholash', difficulty: 2, type: 'diagnostika', age: 56, gender: 'Erkak', vitals: { bp: '138/86', hr: '78', temp: '36.6', spo2: '97' }, complaints: 'Rejali operatsiya oldidan tekshiruv.', history: 'Gipertoniya, diabet.', dx: 'ASA II — operatsiyaga tayyorlik', tx: 'Yo\'ldosh kasalliklarni optimallashtirish, anesteziya rejasi, monitoring.' },
    { title: 'Post-operativ ko\'ngil aynishi', difficulty: 1, type: 'diagnostika', age: 34, gender: 'Ayol', vitals: { bp: '118/76', hr: '84', temp: '36.7', spo2: '98' }, complaints: 'Operatsiyadan keyin qusish, ko\'ngil aynishi.', history: 'Umumiy anesteziya o\'tkazgan.', dx: 'Post-operativ ko\'ngil aynishi/qusish (PONV)', tx: 'Antiemetik (ondansetron), suyuqlik, kuzatuv.' },
    { title: 'Mahalliy anestetik toksikligi', difficulty: 4, type: 'shoshilinch', isPremium: true, age: 45, gender: 'Erkak', vitals: { bp: '100/64', hr: '110', temp: '36.6', spo2: '95' }, complaints: 'Mahalliy anesteziyadan keyin og\'iz atrofi uvishishi, bosh aylanishi.', history: 'Stomatologik muolaja.', dx: 'Lokal anestetik sistemik toksikligi (LAST)', tx: 'Lipid emulsiya terapiyasi, nafas yo\'lini boshqarish, monitoring.', timeLimit: 120 },
    { title: 'Operatsiyadan keyingi og\'riqni boshqarish', difficulty: 2, type: 'diagnostika', age: 52, gender: 'Ayol', vitals: { bp: '128/80', hr: '88', temp: '36.8', spo2: '98' }, complaints: 'Operatsiyadan keyin kuchli og\'riq.', history: 'Qorin operatsiyasi.', dx: 'O\'tkir post-operativ og\'riq', tx: 'Multimodal analgeziya, opioidlarni ehtiyotkorlik bilan, baholash.' },
    { title: 'Sepsisda gemodinamik qo\'llab-quvvatlash', difficulty: 5, type: 'shoshilinch', isPremium: true, age: 60, gender: 'Erkak', vitals: { bp: '82/50', hr: '124', temp: '38.9', spo2: '90' }, complaints: 'Past bosim, hushyorlik pasayishi, isitma.', history: 'Infeksiya o\'chog\'i mavjud.', dx: 'Septik shok', tx: 'Tezkor suyuqlik, vazopressor, antibiotik, ICU monitoring.', timeLimit: 120 },
  ],
  'Infeksion kasalliklar': [
    { title: 'Gripp', difficulty: 1, type: 'diagnostika', age: 30, gender: 'Erkak', vitals: { bp: '120/78', hr: '92', temp: '38.8', spo2: '97' }, complaints: 'Isitma, mushak og\'rig\'i, yo\'tal, holsizlik.', history: 'Epidemiya davri.', dx: 'Gripp (mavsumiy)', tx: 'Simptomatik davolash, suyuqlik, kerak bo\'lsa antiviral, izolyatsiya.' },
    { title: 'O\'tkir ichak infeksiyasi', difficulty: 2, type: 'diagnostika', age: 26, gender: 'Ayol', vitals: { bp: '110/70', hr: '96', temp: '37.9', spo2: '98' }, complaints: 'Suyuq ich ketish, qorin og\'rig\'i, qusish.', history: 'Shubhali ovqat iste\'moli.', dx: 'O\'tkir gastroenterit (infeksion)', tx: 'Regidratatsiya, dieta, kerak bo\'lsa antibiotik, kuzatuv.' },
    { title: 'Virusli gepatit A', difficulty: 3, type: 'diagnostika', isPremium: true, age: 22, gender: 'Erkak', vitals: { bp: '116/74', hr: '78', temp: '37.6', spo2: '98' }, complaints: 'Sariqlik, charchoq, ishtahasizlik, to\'q siydik.', history: 'Antisanitar sharoit.', dx: 'O\'tkir virusli gepatit A', tx: 'Qo\'llab-quvvatlovchi davolash, jigar funksiya nazorati, gigiena.' },
    { title: 'Bezgak (malyariya) shubhasi', difficulty: 4, type: 'diagnostika', isPremium: true, age: 35, gender: 'Erkak', vitals: { bp: '108/68', hr: '102', temp: '39.4', spo2: '96' }, complaints: 'Davriy isitma, titroq, terlash.', history: 'Endemik hududga safar.', dx: 'Malyariya (shubha)', tx: 'Qon surtmasi/tez test, antimalyariya terapiyasi, monitoring.' },
    { title: 'Meningit shubhasi', difficulty: 5, type: 'shoshilinch', isPremium: true, age: 19, gender: 'Erkak', vitals: { bp: '118/76', hr: '108', temp: '39.2', spo2: '96' }, complaints: 'Kuchli bosh og\'rig\'i, ensa qotishi, isitma, fotofobiya.', history: 'Tez rivojlangan.', dx: 'O\'tkir bakterial meningit (shubha)', tx: 'Shoshilinch empirik antibiotik, lyumbal punksiya, izolyatsiya, ICU.', timeLimit: 120 },
  ],
  Onkologiya: [
    { title: 'Sut bezi shishi (paypaslanadigan)', difficulty: 3, type: 'diagnostika', isPremium: true, age: 49, gender: 'Ayol', vitals: { bp: '124/78', hr: '78', temp: '36.6', spo2: '98' }, complaints: 'Sut bezida paypaslanadigan tugun.', history: 'Oilaviy onkologik anamnez.', dx: 'Sut bezi shishi (shubha)', tx: 'Mammografiya/UZI, trepan-biopsiya, onkolog konsultatsiyasi.' },
    { title: 'O\'pka sarataniga shubha', difficulty: 4, type: 'diagnostika', isPremium: true, age: 65, gender: 'Erkak', vitals: { bp: '128/80', hr: '84', temp: '36.8', spo2: '94' }, complaints: 'Uzoq yo\'tal, qon tupurish, vazn yo\'qotish.', history: 'Uzoq yillik chekish.', dx: 'O\'pka shishi (shubha)', tx: 'KT, bronxoskopiya/biopsiya, onkologik konsilium.' },
    { title: 'Yo\'g\'on ichak sarataniga skrining', difficulty: 3, type: 'diagnostika', isPremium: true, age: 58, gender: 'Erkak', vitals: { bp: '126/80', hr: '78', temp: '36.6', spo2: '98' }, complaints: 'Najasda qon, ich kelishi o\'zgargan.', history: 'Yosh va xavf omillari.', dx: 'Kolorektal shish (shubha)', tx: 'Kolonoskopiya + biopsiya, bosqichlash, onkolog kuzatuvi.' },
    { title: 'Limfoma shubhasi', difficulty: 4, type: 'diagnostika', isPremium: true, age: 33, gender: 'Erkak', vitals: { bp: '120/78', hr: '82', temp: '37.6', spo2: '98' }, complaints: 'Og\'riqsiz kattalashgan limfa tugunlari, tунги terlash.', history: 'Bir necha hafta davom etmoqda.', dx: 'Limfoma (shubha)', tx: 'Limfa tugun biopsiyasi, bosqichlash (KT/PET), gematolog-onkolog.' },
    { title: 'Oshqozon sarataniga shubha', difficulty: 4, type: 'diagnostika', isPremium: true, age: 61, gender: 'Erkak', vitals: { bp: '122/78', hr: '80', temp: '36.6', spo2: '97' }, complaints: 'Vazn yo\'qotish, epigastral og\'riq, ishtahasizlik.', history: 'Surunkali gastrit anamnezi.', dx: 'Oshqozon shishi (shubha)', tx: 'Gastroskopiya + biopsiya, bosqichlash, onkologik konsilium.' },
  ],
  Gematologiya: [
    { title: 'Temir tanqisligi anemiyasi', difficulty: 2, type: 'diagnostika', age: 28, gender: 'Ayol', vitals: { bp: '110/70', hr: '94', temp: '36.6', spo2: '98' }, complaints: 'Charchoq, rangsizlik, bosh aylanishi.', history: 'Kuchli hayz qon ketishlari.', dx: 'Temir tanqisligi anemiyasi', tx: 'Temir preparatlari, sababni aniqlash, ovqatlanish maslahati.' },
    { title: 'B12 tanqisligi anemiyasi', difficulty: 3, type: 'diagnostika', isPremium: true, age: 60, gender: 'Ayol', vitals: { bp: '118/74', hr: '82', temp: '36.6', spo2: '98' }, complaints: 'Charchoq, til achishishi, uvishish.', history: 'Vegetarian dieta.', dx: 'B12 tanqisligi anemiyasi', tx: 'B12 o\'rnini bosish, nevrologik baholash, kuzatuv.' },
    { title: 'Trombotsitopeniya', difficulty: 3, type: 'diagnostika', isPremium: true, age: 35, gender: 'Ayol', vitals: { bp: '116/74', hr: '78', temp: '36.6', spo2: '99' }, complaints: 'Teri ostida ko\'kimtir dog\'lar, milk qon ketishi.', history: 'Yaqinda virusli infeksiya.', dx: 'Immun trombotsitopeniya (ITP)', tx: 'Trombotsit nazorati, kortikosteroid, gematolog kuzatuvi.' },
    { title: 'Surunkali limfoleykoz shubhasi', difficulty: 4, type: 'diagnostika', isPremium: true, age: 66, gender: 'Erkak', vitals: { bp: '124/78', hr: '76', temp: '36.6', spo2: '98' }, complaints: 'Charchoq, limfa tugunlari kattalashgan, tasodifiy leykotsitoz.', history: 'Profilaktik tekshiruvda aniqlangan.', dx: 'Surunkali limfoleykoz (shubha)', tx: 'Qon surtmasi, immunofenotiplash, gematolog kuzatuvi.' },
    { title: 'Koagulopatiya (qon ketish buzilishi)', difficulty: 3, type: 'diagnostika', age: 24, gender: 'Erkak', vitals: { bp: '120/78', hr: '80', temp: '36.6', spo2: '99' }, complaints: 'Uzoq davom etuvchi qon ketishlar, bo\'g\'imga qon quyilishi.', history: 'Bolalikdan qon ketishga moyillik.', dx: 'Qon ivish buzilishi (gemofiliya shubhasi)', tx: 'Koagulogramma, omil tahlili, gematolog kuzatuvi.' },
  ],
  Revmatologiya: [
    { title: 'Revmatoid artrit', difficulty: 3, type: 'diagnostika', isPremium: true, age: 44, gender: 'Ayol', vitals: { bp: '122/78', hr: '78', temp: '37.2', spo2: '98' }, complaints: 'Simmetrik bo\'g\'im og\'rig\'i, ertalabki qotishlik.', history: 'Bir necha oydan beri.', dx: 'Revmatoid artrit', tx: 'NPVP, DMARD (metotreksat), revmatolog kuzatuvi.' },
    { title: 'Podagra xuruji', difficulty: 2, type: 'diagnostika', age: 52, gender: 'Erkak', vitals: { bp: '136/86', hr: '84', temp: '37.4', spo2: '98' }, complaints: 'Oyoq bosh barmog\'i bo\'g\'imida to\'satdan kuchli og\'riq, qizarish.', history: 'Yog\'li ovqat va alkogol.', dx: 'O\'tkir podagra artriti', tx: 'NPVP/kolxitsin, suyuqlik, dieta, uratni kamaytirish (keyinroq).' },
    { title: 'Sistem qizil yuguruk (SLE) shubhasi', difficulty: 4, type: 'diagnostika', isPremium: true, age: 27, gender: 'Ayol', vitals: { bp: '118/76', hr: '82', temp: '37.6', spo2: '98' }, complaints: 'Yuzda kapalaksimon toshma, bo\'g\'im og\'rig\'i, charchoq.', history: 'Quyoshga sezuvchanlik.', dx: 'Sistem qizil yuguruk (shubha)', tx: 'ANA/anti-dsDNA, revmatolog konsultatsiyasi, immunosupressiya.' },
    { title: 'Osteoartrit', difficulty: 1, type: 'diagnostika', age: 64, gender: 'Ayol', vitals: { bp: '132/82', hr: '74', temp: '36.6', spo2: '98' }, complaints: 'Tizza og\'rig\'i, harakatda kuchayadi, qotishlik.', history: 'Yosh va ortiqcha vazn.', dx: 'Tizza osteoartriti', tx: 'Vazn kamaytirish, mashqlar, analgetik, fizioterapiya.' },
    { title: 'Ankilozlovchi spondilit', difficulty: 3, type: 'diagnostika', isPremium: true, age: 30, gender: 'Erkak', vitals: { bp: '124/78', hr: '76', temp: '36.8', spo2: '98' }, complaints: 'Surunkali bel og\'rig\'i, ertalab qotishlik, harakatda yengillashish.', history: 'Yosh erkak, oilaviy anamnez.', dx: 'Ankilozlovchi spondilit (shubha)', tx: 'NPVP, mashqlar, revmatolog kuzatuvi, kerak bo\'lsa biologik terapiya.' },
  ],
  Psixiatriya: [
    { title: 'Depressiv epizod', difficulty: 2, type: 'diagnostika', age: 33, gender: 'Ayol', vitals: { bp: '118/76', hr: '74', temp: '36.6', spo2: '99' }, complaints: 'Kayfiyat pastligi, uyqu buzilishi, qiziqish yo\'qolishi.', history: 'Stress omillari.', dx: 'O\'rta og\'irlikdagi depressiv epizod', tx: 'Psixoterapiya, antidepressant, kuzatuv, xavf bahosi.' },
    { title: 'Umumlashgan xavotir buzilishi', difficulty: 2, type: 'diagnostika', age: 28, gender: 'Ayol', vitals: { bp: '124/80', hr: '92', temp: '36.6', spo2: '99' }, complaints: 'Doimiy tashvish, asabiylashish, uyqu buzilishi.', history: 'Bir necha oydan beri.', dx: 'Umumlashgan xavotir buzilishi', tx: 'Psixoterapiya (KBT), kerak bo\'lsa SSRI, hayot tarzi.' },
    { title: 'Panik buzilish', difficulty: 2, type: 'diagnostika', age: 31, gender: 'Erkak', vitals: { bp: '132/84', hr: '108', temp: '36.6', spo2: '98' }, complaints: 'To\'satdan qo\'rquv xurujlari, yurak tezlashishi, bo\'g\'ilish hissi.', history: 'Somatik kasallik istisno qilingan.', dx: 'Panik buzilish', tx: 'KBT, nafas texnikasi, kerak bo\'lsa SSRI, ta\'lim.' },
    { title: 'Bipolyar buzilish (maniakal epizod)', difficulty: 4, type: 'diagnostika', isPremium: true, age: 26, gender: 'Erkak', vitals: { bp: '128/82', hr: '96', temp: '36.7', spo2: '98' }, complaints: 'Kam uyqu, ortiqcha energiya, tez nutq, impulsivlik.', history: 'Avval depressiv epizodlar bo\'lgan.', dx: 'Bipolyar affektiv buzilish (maniakal epizod)', tx: 'Kayfiyat stabilizatori, psixiatr kuzatuvi, xavfsizlik.' },
    { title: 'Uyqusizlik (insomniya)', difficulty: 1, type: 'diagnostika', age: 45, gender: 'Ayol', vitals: { bp: '122/78', hr: '74', temp: '36.6', spo2: '99' }, complaints: 'Uxlay olmaslik, tez-tez uyg\'onish, kunduzgi charchoq.', history: 'Stress va ekran vaqti.', dx: 'Surunkali insomniya', tx: 'Uyqu gigienasi, KBT-I, qisqa muddatli dori kerak bo\'lsa.' },
  ],
}

// Short, varied emergency cases (type=shoshilinch). 20 cases with diverse timers.
const EMERGENCY_BANK: DiseaseSpec[] = [
  { title: 'Yurak to\'xtashi (klinik o\'lim)', difficulty: 5, type: 'shoshilinch', isPremium: true, age: 60, gender: 'Erkak', vitals: { bp: '0/0', hr: '0', temp: '36.0', spo2: '—' }, complaints: 'Hushsiz, nafas yo\'q, puls yo\'q.', history: 'To\'satdan yiqilgan.', dx: 'Yurak-nafas to\'xtashi', tx: 'Darhol CPR, defibrillyatsiya, adrenalin, ACLS protokoli.', timeLimit: 60 },
  { title: 'Anafilaktik shok', difficulty: 5, type: 'shoshilinch', age: 30, gender: 'Ayol', vitals: { bp: '78/48', hr: '136', temp: '36.5', spo2: '84' }, complaints: 'Nafas qisilishi, til shishi, toshma, holsizlik.', history: 'Dori in\'eksiyasidan keyin.', dx: 'Anafilaktik shok', tx: 'IM adrenalin, kislorod, IV suyuqlik, monitoring.', timeLimit: 60 },
  { title: 'O\'tkir koronar sindrom (STEMI)', difficulty: 5, type: 'shoshilinch', isPremium: true, age: 58, gender: 'Erkak', vitals: { bp: '140/90', hr: '96', temp: '36.7', spo2: '94' }, complaints: 'Kuchli ko\'krak og\'rig\'i, sovuq ter, chap qo\'lga tarqalish.', history: 'Gipertoniya, chekish.', dx: 'O\'tkir miokard infarkti (STEMI)', tx: 'Aspirin, antikoagulyant, kislorod, shoshilinch reperfuziya (PCI).', timeLimit: 120 },
  { title: 'O\'tkir ishemik insult', difficulty: 4, type: 'shoshilinch', isPremium: true, age: 64, gender: 'Ayol', vitals: { bp: '172/98', hr: '90', temp: '36.7', spo2: '95' }, complaints: 'To\'satdan nutq buzilishi, bir tomonlama kuchsizlik.', history: 'Belgilar 40 daqiqa oldin.', dx: 'O\'tkir ishemik insult', tx: 'Stroke kod, shoshilinch KT, tromboliz baholash.', timeLimit: 120 },
  { title: 'Gemorragik shok (travma)', difficulty: 5, type: 'shoshilinch', isPremium: true, age: 35, gender: 'Erkak', vitals: { bp: '80/50', hr: '132', temp: '36.2', spo2: '90' }, complaints: 'YTH dan keyin qorin og\'rig\'i, holsizlik.', history: 'Avtohalokat.', dx: 'Gemorragik shok', tx: 'ATLS, massiv transfuziya, FAST, shoshilinch jarrohlik.', timeLimit: 90 },
  { title: 'Tensiya pnevmotoraks', difficulty: 5, type: 'shoshilinch', isPremium: true, age: 28, gender: 'Erkak', vitals: { bp: '90/58', hr: '128', temp: '36.6', spo2: '85' }, complaints: 'To\'satdan ko\'krak og\'rig\'i, kuchli hansirash.', history: 'Ko\'krak travmasi.', dx: 'Klapanli (tensiya) pnevmotoraks', tx: 'Shoshilinch igna dekompressiyasi, ko\'krak drenaji, kislorod.', timeLimit: 90 },
  { title: 'O\'tkir nafas yetishmovchiligi', difficulty: 4, type: 'shoshilinch', age: 70, gender: 'Erkak', vitals: { bp: '128/82', hr: '110', temp: '37.2', spo2: '82' }, complaints: 'Kuchli hansirash, ko\'karish, bezovtalik.', history: 'XOBL anamnezi.', dx: 'O\'tkir nafas yetishmovchiligi', tx: 'Kislorod, bronxodilatator, NIV, monitoring.', timeLimit: 150 },
  { title: 'Diabetik ketoatsidoz', difficulty: 4, type: 'shoshilinch', age: 24, gender: 'Ayol', vitals: { bp: '104/66', hr: '112', temp: '37.0', spo2: '97' }, complaints: 'Chuqur tez nafas, qorin og\'rig\'i, qusish.', history: '1-tip diabet, insulin tashlab yuborilgan.', dx: 'Diabetik ketoatsidoz', tx: 'IV suyuqlik, insulin infuziya, kaliy nazorati.', timeLimit: 150 },
  { title: 'O\'tkir hushdan ketish (sinkope)', difficulty: 3, type: 'shoshilinch', age: 55, gender: 'Erkak', vitals: { bp: '96/60', hr: '50', temp: '36.6', spo2: '96' }, complaints: 'To\'satdan hushdan ketish, hozir o\'ziga kelgan.', history: 'Yurak kasalligi anamnezi.', dx: 'Kardiogen sinkope (shubha)', tx: 'EKG monitoring, sababni aniqlash, gemodinamika nazorati.', timeLimit: 180 },
  { title: 'O\'tkir qorin (perforatsiya)', difficulty: 5, type: 'shoshilinch', isPremium: true, age: 50, gender: 'Erkak', vitals: { bp: '100/64', hr: '118', temp: '38.4', spo2: '95' }, complaints: 'To\'satdan kuchli qorin og\'rig\'i, taxta qorin.', history: 'Yara kasalligi anamnezi.', dx: 'Ichak/oshqozon perforatsiyasi, peritonit', tx: 'Infuziya, antibiotik, shoshilinch laparotomiya.', timeLimit: 120 },
  { title: 'Status epileptikus', difficulty: 5, type: 'shoshilinch', isPremium: true, age: 33, gender: 'Erkak', vitals: { bp: '140/88', hr: '120', temp: '38.0', spo2: '92' }, complaints: 'To\'xtamaydigan tutqanoq (>5 daqiqa).', history: 'Epilepsiya anamnezi.', dx: 'Status epileptikus', tx: 'Benzodiazepin, nafas yo\'lini himoya, antikonvulsant, ICU.', timeLimit: 90 },
  { title: 'Yuqori siydik yo\'li sepsisi', difficulty: 4, type: 'shoshilinch', age: 68, gender: 'Ayol', vitals: { bp: '88/54', hr: '116', temp: '39.0', spo2: '93' }, complaints: 'Isitma, titroq, bel og\'rig\'i, past bosim.', history: 'Buyrak toshi anamnezi.', dx: 'Urosepsis', tx: 'Sepsis bundle: kultura, antibiotik, suyuqlik, monitoring.', timeLimit: 120 },
  { title: 'O\'tkir allergik angioedema', difficulty: 4, type: 'shoshilinch', age: 40, gender: 'Ayol', vitals: { bp: '110/70', hr: '98', temp: '36.6', spo2: '93' }, complaints: 'Lab va til shishi, ovoz bo\'g\'ilishi.', history: 'Yangi dori qabul qilgan.', dx: 'Angioedema (nafas yo\'li xavfi)', tx: 'Nafas yo\'lini baholash, adrenalin/antigistamin/steroid, monitoring.', timeLimit: 90 },
  { title: 'Issiqlik urishi (gipertermiya)', difficulty: 4, type: 'shoshilinch', age: 45, gender: 'Erkak', vitals: { bp: '100/62', hr: '124', temp: '40.6', spo2: '96' }, complaints: 'Yuqori isitma, hushyorlik pasayishi, quruq teri.', history: 'Issiqda uzoq ishlash.', dx: 'Issiqlik urishi (heat stroke)', tx: 'Tezkor sovutish, IV suyuqlik, monitoring.', timeLimit: 150 },
  { title: 'O\'tkir intoksikatsiya (zaharlanish)', difficulty: 4, type: 'shoshilinch', isPremium: true, age: 22, gender: 'Erkak', vitals: { bp: '108/68', hr: '58', temp: '36.4', spo2: '94' }, complaints: 'Hushyorlik pasaygan, qorachiq torligi, sekin nafas.', history: 'Noma\'lum modda qabul qilgan.', dx: 'Opioid zaharlanishi (shubha)', tx: 'Nafas yo\'li, nalokson, monitoring, toksikologiya.', timeLimit: 90 },
  { title: 'O\'tkir gipoglikemiya', difficulty: 3, type: 'shoshilinch', age: 62, gender: 'Erkak', vitals: { bp: '120/78', hr: '96', temp: '36.5', spo2: '98' }, complaints: 'Terlash, chalkashlik, qaltirash.', history: 'Diabet, insulin qabul qiladi.', dx: 'O\'tkir gipoglikemiya', tx: 'Glyukoza (og\'iz/IV), qayta o\'lchash, sababni aniqlash.', timeLimit: 120 },
  { title: 'Shoshilinch tug\'ruq (yo\'lda)', difficulty: 4, type: 'shoshilinch', isPremium: true, age: 29, gender: 'Ayol', vitals: { bp: '124/80', hr: '100', temp: '36.8', spo2: '98' }, complaints: 'Kuchli tug\'ruq sancihlari, bola boshi ko\'rinmoqda.', history: '39 haftalik homiladorlik.', dx: 'Faol tug\'ruq ikkinchi davri', tx: 'Tug\'ruqqa yordam, yangi tug\'ilganni baholash, ona monitoringi.', timeLimit: 120 },
  { title: 'Cho\'kish (asfiksiya)', difficulty: 5, type: 'shoshilinch', isPremium: true, age: 12, gender: 'Erkak', vitals: { bp: '90/56', hr: '50', temp: '35.8', spo2: '78' }, complaints: 'Suvdan chiqarilgan, hushsiz, nafas zaif.', history: 'Suvda cho\'kkan.', dx: 'Cho\'kish (submersion)', tx: 'Nafas yo\'li, ventilyatsiya/CPR, kislorod, isitish, monitoring.', timeLimit: 60 },
  { title: 'O\'tkir ich qon ketishi (GIT)', difficulty: 4, type: 'shoshilinch', age: 57, gender: 'Erkak', vitals: { bp: '94/58', hr: '118', temp: '36.6', spo2: '96' }, complaints: 'Qon qusish, qora najas, holsizlik.', history: 'Jigar sirrozi anamnezi.', dx: 'Yuqori GIT qon ketishi (varikoz shubhasi)', tx: 'Infuziya/transfuziya, PPI, shoshilinch endoskopiya.', timeLimit: 120 },
  { title: 'Elektr toki urishi', difficulty: 4, type: 'shoshilinch', isPremium: true, age: 34, gender: 'Erkak', vitals: { bp: '110/70', hr: '120', temp: '36.6', spo2: '95' }, complaints: 'Toq urgandan keyin hushyorlik buzilishi, kuyish.', history: 'Yuqori kuchlanishli toq.', dx: 'Elektr shikasti', tx: 'EKG monitoring (aritmiya), kuyishni baholash, infuziya, kuzatuv.', timeLimit: 150 },
]

// Build the generated case templates (skip categories already in caseTemplates? No —
// generated banks use disease titles distinct from the hand-written 13). Sequential ids.
function buildGeneratedTemplates(): SeedCaseTemplate[] {
  const out: SeedCaseTemplate[] = []
  let seq = 100 // generated ids start at case-100 to avoid clashing with 001..013
  const author = 'Dr. Kontent Menejer'

  for (const [category, diseases] of Object.entries(DISEASE_BANK)) {
    for (const d of diseases) {
      seq++
      out.push({
        caseId: `case-${String(seq).padStart(3, '0')}`,
        title: d.title,
        authorName: author,
        category,
        difficulty: d.difficulty,
        type: d.type,
        isPremium: d.isPremium === true,
        description: `${category} bo'yicha klinik holat: ${d.title}.`,
        timeLimit: d.timeLimit,
        patient: {
          name: d.gender === 'Erkak' ? 'Bemor (erkak)' : 'Bemor (ayol)',
          age: d.age,
          gender: d.gender,
          ageGroup: ageGroup(d.age),
          vitals: d.vitals,
          complaints: d.complaints,
          history: d.history,
        },
        correctDiagnosis: d.dx,
        correctTreatment: d.tx,
      })
    }
  }

  for (const d of EMERGENCY_BANK) {
    seq++
    out.push({
      caseId: `case-${String(seq).padStart(3, '0')}`,
      title: d.title,
      authorName: author,
      category: 'Infeksion kasalliklar', // emergencies span specialties; tag generically
      difficulty: d.difficulty,
      type: 'shoshilinch',
      isPremium: d.isPremium === true,
      description: `Shoshilinch holat: ${d.title}. Tezkor qaror talab etiladi.`,
      timeLimit: d.timeLimit ?? 120,
      patient: {
        name: d.gender === 'Erkak' ? 'Bemor (erkak)' : 'Bemor (ayol)',
        age: d.age,
        gender: d.gender,
        ageGroup: ageGroup(d.age),
        vitals: d.vitals,
        complaints: d.complaints,
        history: d.history,
      },
      correctDiagnosis: d.dx,
      correctTreatment: d.tx,
    })
  }

  return out
}

const allCaseTemplates: SeedCaseTemplate[] = [...caseTemplates, ...buildGeneratedTemplates()]

function ensureSeedImagesAvailable() {
  if (!existsSync(IMG_K_SOURCE_DIR)) {
    throw new Error(`img-k papkasi topilmadi: ${IMG_K_SOURCE_DIR}`)
  }
  if (!existsSync(IMG_K_TARGET_DIR)) mkdirSync(IMG_K_TARGET_DIR, { recursive: true })
  for (const fileName of Object.values(IMG_K_FILES)) {
    const src = path.join(IMG_K_SOURCE_DIR, fileName)
    if (!existsSync(src)) throw new Error(`img-k ichida fayl topilmadi: ${src}`)
    copyFileSync(src, path.join(IMG_K_TARGET_DIR, fileName))
  }

  // Patient avatar photos
  if (existsSync(PATIENT_PHOTOS_SOURCE_DIR)) {
    if (!existsSync(PATIENT_PHOTOS_TARGET_DIR)) mkdirSync(PATIENT_PHOTOS_TARGET_DIR, { recursive: true })
    for (const fileName of Object.values(PATIENT_PHOTOS)) {
      const src = path.join(PATIENT_PHOTOS_SOURCE_DIR, fileName)
      if (existsSync(src)) copyFileSync(src, path.join(PATIENT_PHOTOS_TARGET_DIR, fileName))
    }
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

function buildMediaItems(index: number, opts: { pregnancyCase: boolean; gender?: 'Erkak' | 'Ayol'; age?: number }): SeedMediaItem[] {
  const items: SeedMediaItem[] = []
  // Patient photo as first media item when available
  if (opts.gender && opts.age !== undefined) {
    const photoPath = patientPhotoPath(opts.gender, opts.age)
    items.push({
      type: 'image' as const,
      fileData: photoPath,
      comment: `Bemor (${opts.age} yosh, ${opts.gender}) rasmi`,
      fileName: photoPath.split('/').pop() ?? 'patient.png',
    })
  }
  items.push(
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
  )

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
  // Keep values in realistic ranges regardless of case count (wrap with modulo).
  const m = index % 12
  const bloodTest = [
    { name: 'Gemoglobin', value: String(137 - m), unit: 'g/L', range: '120-160', status: m % 3 === 0 ? 'low' : 'normal' as const },
    { name: 'Leykotsit', value: String((8 + m * 0.6).toFixed(1)), unit: 'x10^9/L', range: '4-10', status: m % 2 === 0 ? 'high' : 'normal' as const },
    { name: 'Trombotsit', value: String(250 - m * 3), unit: 'x10^9/L', range: '150-400', status: 'normal' as const },
  ]

  const urineTest = [
    { name: 'Protein', value: m % 4 === 0 ? '+' : 'Iz', unit: '', range: 'Manfiy', status: m % 4 === 0 ? 'high' : 'normal' as const },
    { name: 'Ketone', value: m % 5 === 0 ? '++' : '-', unit: '', range: 'Manfiy', status: m % 5 === 0 ? 'critical' : 'normal' as const },
    { name: 'Leukotsit', value: String(2 + (m % 3)), unit: 'n/ko\'rish', range: '0-3', status: 'normal' as const },
  ]

  const biochemTest = [
    { name: 'Glyukoza', value: String((5.4 + m * 0.35).toFixed(1)), unit: 'mmol/L', range: '3.9-6.1', status: m >= 7 ? 'high' : 'normal' as const },
    { name: 'Kreatinin', value: String(78 + m * 4), unit: 'mkmol/L', range: '62-106', status: m >= 8 ? 'high' : 'normal' as const },
    { name: 'CRP', value: String(3 + m * 2), unit: 'mg/L', range: '0-5', status: m >= 4 ? 'high' : 'normal' as const },
  ]

  return { bloodTest, urineTest, biochemTest }
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

    // Remove legacy demo/sample accounts (the old seed created these).
    const legacyDemoUsernames = ['demouser', ...Array.from({ length: 20 }, (_, i) => `student${String(i + 1).padStart(2, '0')}`)]
    const removed = await User.deleteMany({ username: { $in: legacyDemoUsernames } })
    if (removed.deletedCount) console.log(`${removed.deletedCount} ta eski demo foydalanuvchi o'chirildi`)

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
      if ('specialty' in seedUser && seedUser.specialty) existing.specialty = seedUser.specialty
      existing.isPremium = seedUser.isPremium
      existing.isEmailVerified = seedUser.isEmailVerified
      existing.subscription = seedUser.subscription
      existing.stats = seedUser.stats
      existing.password = seedUser.password
      await existing.save()
    }

    const users = await User.find({ username: { $in: allSeedUsers.map(u => u.username) } })
    console.log(`${users.length} ta xodim foydalanuvchi yaratildi/yangilandi (admin + kontent menejer)`)

    const manager = users.find(u => u.username === 'manager')!

    ensureSeedImagesAvailable()
    console.log('img-k + bemor rasmlari /public/uploads ga tayyorlandi')

    const managerId = manager._id as mongoose.Types.ObjectId

    const seedCases = allCaseTemplates.map((template, i) => {
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
        mediaItems: buildMediaItems(idx, { pregnancyCase: template.pregnancyCase === true, gender: template.patient.gender, age: template.patient.age }),
        bloodTest: labs.bloodTest,
        urineTest: labs.urineTest,
        biochemTest: labs.biochemTest,
      }
    })

    const cases = await Case.create(seedCases)
    console.log(`${cases.length} ta klinik holat yaratildi (media + test menyular bilan)`)

    // No fake attempts are seeded: stats/leaderboard start empty and fill up
    // as real users solve cases.

    const emergencyCount = await Case.countDocuments({ type: 'shoshilinch', status: 'published', 'mediaItems.0': { $exists: true } })
    const totalCases = await Case.countDocuments({ status: 'published' })

    console.log(`Jami klinik holatlar: ${totalCases}`)
    console.log(`Shoshilinch holatlar: ${emergencyCount}`)
    console.log('\n--- Xodim hisoblari ---')
    console.log('Admin:   username=admin     / parol=admin123!')
    console.log('Manager: username=manager   / parol=manager123!')
    console.log('\nSeed muvaffaqiyatli yakunlandi!')

    process.exit(0)
  } catch (error) {
    console.error('Seed xatosi:', error)
    process.exit(1)
  }
}

seed()
