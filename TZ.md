# 📋 TEXNIK TOPSHIRIQ (TZ)

## Loyiha: **Med AI Simulator** — Sun'iy intellektga asoslangan tibbiy simulyator

---

## 1. LOYIHA MAQSADI

**Med AI Simulator** — tibbiyot talabalari va yosh shifokorlar uchun sun'iy intellekt yordamida klinik keyslarni simulyatsiya qiladigan zamonaviy web-platforma.

### 1.1 Asosiy maqsad

Tibbiyot ta'limida amaliy ko'nikmalarni rivojlantirish uchun interaktiv muhit yaratish. Talabalar virtual bemorlar bilan ishlash, tashxis qo'yish va davolash rejasini tuzish orqali tajriba orttiradi. Sun'iy intellekt har bir javobni baholab, batafsil tahlil beradi.

### 1.2 Muammo

- Tibbiyot talabalariga amaliy tajriba olish imkoniyatlari cheklangan
- Haqiqiy bemorlar ustida mashq qilish xavfli va etikal jihatdan murakkab
- An'anaviy darsliklar interaktiv emas, qayta aloqa bermaydi
- O'zbekiston tibbiyot ta'limida zamonaviy simulyatsiya vositalari yo'q

### 1.3 Yechim

Platforma quyidagi imkoniyatlarni taqdim etadi:

| Imkoniyat | Tavsif |
|-----------|--------|
| Virtual bemor simulyatsiyasi | AI yordamida bemor bilan suhbat, TTS orqali ovozli javob |
| Klinik keyslar | Diagnostika, jarrohlik, shoshilinch yordam bo'yicha turli murakkablikdagi keyslar |
| AI baholash | OpenAI GPT-4o-mini orqali javoblarni tahlil qilish, ball berish (0-100) |
| Batafsil qayta aloqa | Kuchli tomonlar, kamchiliklar, to'g'ri javob bilan solishtirish |
| Statistika va tahlil | O'sish dinamikasi, kategoriya bo'yicha natijalar, karyera yo'nalishi |

---

## 2. BIZNES MODELI

### 2.1 Maqsadli auditoriya

| Segment | Tavsif | Ehtiyoj |
|---------|--------|---------|
| Tibbiyot talabalari | Universitetlarda o'qiyotgan talabalar | Amaliy mashq, imtihonga tayyorgarlik |
| Rezidentlar | Ixtisoslik bo'yicha ta'lim olayotgan shifokorlar | Murakkab keyslar, shoshilinch holat mashqlari |
| Tibbiyot universitetlari | Ta'lim muassasalari | Talabalar uchun platforma, monitoring |
| Klinikalar | Tibbiyot xodimlari malakasini oshirish | Xodimlar tayyorgarligi, sertifikatsiya |

### 2.2 Obuna rejalari

| Reja | Narx (oylik) | Imkoniyatlar |
|------|-------------|--------------|
| **Bepul** | 0 UZS | Asosiy keyslar, cheklangan miqdor |
| **Pro** | 30,000 UZS | Barcha keyslar, AI tahlil, shoshilinch rejim, statistika |
| **Klinika** | 3,000,000 UZS | Ko'p foydalanuvchi, tashkilot boshqaruvi, batafsil hisobot |
| **Universitet** | Kelishiladi | Maxsus integratsiya, professor paneli, talabalar monitoringi |

### 2.3 Monetizatsiya kanallari

1. **Obuna to'lovlari** — asosiy daromad manbai
2. **Klinika/Universitet litsenziyalari** — B2B segment
3. **Promo-kodlar** — marketing kampaniyalari uchun (admin tomonidan generatsiya qilinadi)

---

## 3. TEXNIK ARXITEKTURA

### 3.1 Umumiy tuzilma

```
┌─────────────────────────────────────────────────────┐
│                   FOYDALANUVCHI                      │
│              (Brauzer / Mobil)                       │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────┐
│              FRONTEND (Next.js 16)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │
│  │  Pages   │ │Components│ │   Context/Hooks       │ │
│  │ (App     │ │ (React   │ │ (Auth, Theme, i18n)   │ │
│  │  Router) │ │  19)     │ │                       │ │
│  └──────────┘ └──────────┘ └──────────────────────┘ │
│           Vercel orqali deploy                       │
└──────────────────────┬──────────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────────┐
│              BACKEND (Express.js 4.21)               │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │
│  │ Routes   │ │Controllers│ │   Middleware         │ │
│  │          │ │           │ │ (Auth, RateLimit,    │ │
│  │          │ │           │ │  Helmet, CORS)       │ │
│  └──────────┘ └──────────┘ └──────────────────────┘ │
└─────┬──────────────┬───────────────┬────────────────┘
      │              │               │
┌─────▼─────┐ ┌──────▼──────┐ ┌─────▼──────────┐
│ MongoDB   │ │ OpenAI API  │ │ Aisha TTS API  │
│ Atlas     │ │ (GPT-4o-    │ │ (O'zbek nutq   │
│           │ │  mini)      │ │  sintezi)      │
└───────────┘ └─────────────┘ └────────────────┘
```

### 3.2 Texnologiyalar steki

#### Frontend

| Texnologiya | Versiya | Vazifasi |
|-------------|---------|----------|
| Next.js | 16.2.2 | App Router, SSR framework |
| React | 19.2.4 | UI kutubxonasi |
| TypeScript | 5 | Tip xavfsizligi |
| Tailwind CSS | 4 | Utility-first stillash |
| Framer Motion | 12.38 | Animatsiyalar |
| Lucide React | 1.7 | Ikonkalar |
| @react-oauth/google | 0.13.4 | Google OAuth |

#### Backend

| Texnologiya | Versiya | Vazifasi |
|-------------|---------|----------|
| Express.js | 4.21.2 | HTTP server |
| Mongoose | 8.9.5 | MongoDB ODM |
| jsonwebtoken | 9.0.2 | JWT autentifikatsiya (7 kun amal muddati) |
| bcryptjs | 2.4.3 | Parol xeshlash (salt: 12) |
| OpenAI SDK | 6.33 | AI baholash (gpt-4o-mini) |
| google-auth-library | 10.6.2 | Google OAuth tekshiruvi |
| Nodemailer | 6.10.1 | Email OTP yuborish (Gmail) |
| Multer | 1.4.5 | Fayl yuklash (max 50MB) |
| Helmet | — | Xavfsizlik sarlavhalari |
| express-rate-limit | — | 200 so'rov/15 daqiqa |

#### Ma'lumotlar bazasi

| Texnologiya | Xizmat |
|-------------|--------|
| MongoDB Atlas | Bulutli NoSQL baza |

#### Tashqi API xizmatlari

| Xizmat | Vazifasi |
|--------|----------|
| OpenAI GPT-4o-mini | Javoblarni baholash, batafsil tahlil |
| Aisha Group TTS | O'zbek tilidagi nutq sintezi (gulnoza/jaxongir modellari) |
| Gmail SMTP | OTP kodlarini email orqali yuborish |
| Google OAuth | Ijtimoiy tarmoq orqali kirish |

---

## 4. FUNKSIONAL TALABLAR

### 4.1 Autentifikatsiya va avtorizatsiya

#### Ro'yxatdan o'tish (4 bosqich)
1. **Usul tanlash** — Email yoki Google OAuth
2. **Shaxsiy ma'lumotlar** — Ism, familiya, mutaxassislik, universitet
3. **Hisob yaratish** — Username (kichik harf, 6+ belgi), parol (6+ belgi)
4. **Email tasdiqlash** — 6 raqamli OTP kod (10 daqiqa amal muddati)

#### Kirish usullari
- **Username + Parol** — an'anaviy kirish
- **Google OAuth** — bir bosqichda kirish/ro'yxatdan o'tish

#### Foydalanuvchi rollari

| Rol (Backend) | Rol (Frontend) | Ruxsatlar |
|---------------|----------------|-----------|
| `student` | user | Keyslarni yechish, statistikani ko'rish |
| `instructor` | content-manager | Keyslarni yaratish/tahrirlash, + student ruxsatlari |
| `admin` | admin | To'liq boshqaruv: foydalanuvchilar, promo-kodlar, keyslar |

#### Xavfsiz o'zgarishlar (OTP talab qilinadi)
- Parol o'zgartirish
- Email o'zgartirish
- Username o'zgartirish

---

### 4.2 Klinik keyslar tizimi

#### Klinig keys tuzilmasi

```
Case
├── Asosiy: sarlavha, kategoriya, murakkablik (1-5), tur
├── Bemor: ism, yosh, jins, shikoyatlar, anamnez
├── Vital belgilar: AD, puls, harorat, SpO2
├── Tibbiy media: rentgen, EKG rasmlari
├── Laboratoriya: tahlil natijalari (norma/yuqori/past/kritik)
├── To'g'ri javob: tashxis + davolash rejasi
└── Meta: status, premium, yaratuvchi, vaqt chegarasi
```

#### Keys turlari

| Tur | Tavsif | Vaqt chegarasi |
|-----|--------|----------------|
| **Diagnostika** | Tashxis qo'yish va davolash rejasi | 10 daqiqa (standart) |
| **Jarrohlik** | Jarrohlik amaliyoti kerak bo'lgan holatlar | 10 daqiqa |
| **Shoshilinch** | Tezkor qaror talab qiladigan favqulodda holatlar | 5 daqiqa |

#### Keys kategoriyalari
Kardiologiya, Pulmonologiya, Gastroenterologiya, Nevrologiya, Endokrinologiya, Travmatologiya va boshqalar (dinamik, backend tomonidan boshqariladi).

#### Keys holatlari (status)

```
draft → review → published
                → rejected
```

| Holat | Tavsif |
|-------|--------|
| `draft` | Qoralama, faqat yaratuvchi ko'radi |
| `review` | Ko'rib chiqishda, admin tasdiqlashi kutilmoqda |
| `published` | Nashr qilingan, barcha foydalanuvchilar ko'radi |
| `rejected` | Rad etilgan, qayta ishlash kerak |

---

### 4.3 Simulyatsiya jarayoni

#### Bosqichma-bosqich oqim

```
1. KEYSNI TANLASH
   └─ Kategoriya, tur, murakkablik bo'yicha filtrlash
   
2. SIMULYATSIYANI BOSHLASH
   ├─ Taymer ishga tushadi
   ├─ Bemor ma'lumotlari ko'rinadi
   └─ PatientSimulator suhbat boshlanadi (TTS bilan)

3. KO'RIK VA TAHLIL
   ├─ Vital belgilarni ko'rish
   ├─ Tibbiy rasmlarni ko'rish (rentgen, EKG)
   ├─ Laboratoriya tahlillarini buyurtma qilish
   └─ Qo'shimcha tekshiruvlarni tanlash

4. TASHXIS VA DAVOLASH
   ├─ Tashxis yozish (erkin matn)
   └─ Davolash rejasini yozish (erkin matn)

5. AI BAHOLASH
   ├─ OpenAI GPT-4o-mini javoblarni tahlil qiladi
   ├─ Ball beradi (0-100)
   ├─ Kuchli tomonlarni aniqlaydi
   ├─ Kamchiliklar ro'yxatini beradi
   ├─ To'g'ri javob bilan solishtiradi
   └─ Batafsil tahlil yozadi
```

#### AI baholash mezonlari

| Mezon | Ball | Tavsif |
|-------|------|--------|
| Tashxis aniqligi | 40 ball | To'g'ri tashxisga yaqinlik |
| Davolash rejasi | 35 ball | Davolash to'g'riligi va to'liqligi |
| Tanlangan tekshiruvlar | 25 ball | Tegishli tahlillarni tanlash |
| **Jami** | **100 ball** | |

#### Natija darajalari

| Ball oralig'i | Daraja | Rang |
|---------------|--------|------|
| 80-100 | A'lo natija ✓ | Yashil |
| 50-79 | Qisman to'g'ri ✓ | Sariq |
| 0-49 | Yaxshilash kerak | Qizil |

---

### 4.4 Bemor simulyatori (PatientSimulator)

- **Yozuv animatsiyasi** — bemor javoblari harf-harf yoziladi
- **Ovozli javob** — Aisha TTS API orqali o'zbek tilida nutq sintezi
- **Ovoz modellari:**
  - `gulnoza` — ayol bemor uchun
  - `jaxongir` — erkak bemor uchun
- **Bemor avatari** — `patientgif.mp4` video (cheksiz takrorlanuvchi)
- **Og'riq animatsiyasi** — bemor holati vizual ko'rsatiladi

---

### 4.5 Sahifalar va funksiyalar

#### 4.5.1 Bosh sahifa (`/`)

| Bo'lim | Tavsif |
|--------|--------|
| Hero | Asosiy sarlavha, tushuntirish, CTA tugmalari |
| Imkoniyatlar | 6 ta asosiy xususiyat kartasi |
| Qanday ishlaydi | 4 bosqichli tushuntirish |
| Narxlar | 3 ta obuna rejasi solishtirish |
| Fikrlar | 3 ta foydalanuvchi sharhi |
| CTA | Hoziroq boshlash chaqiruvi |

#### 4.5.2 Dashboard (`/dashboard`)

| Element | Ma'lumot manbai |
|---------|-----------------|
| Statistika kartalari | Jami keyslar, o'rtacha ball, haftalik soni, streak |
| Haftalik faollik grafigi | Oxirgi 7 kun davomida yechilgan keyslar |
| Kategoriya bo'yicha o'sish | Har bir kategoriya uchun o'rtacha ball |
| Davom ettirish | Oxirgi tugallanmagan keys |
| Tavsiya qilingan keyslar | Eng so'nggi 3 ta nashr qilingan keys |

#### 4.5.3 Keyslar ro'yxati (`/cases`)

- **Qidiruv** — 400ms debounce bilan real-time qidiruv
- **Filtrlar** — kategoriya, tur (diagnostika/jarrohlik/shoshilinch)
- **Dinamik kategoriyalar** — backenddan kategoriya va soni yuklanadi
- **Premium belgisi** — PRO keyslar qulflangan holda ko'rsatiladi

#### 4.5.4 Statistika (`/statistics`)

| Bo'lim | Tavsif |
|--------|--------|
| Umumiy ko'rsatkichlar | Jami urinishlar, o'rtacha ball, sarflangan vaqt |
| Oylik faollik | Oxirgi 6 oy grafigi |
| Kategoriya natijalari | Har bir kategoriya bo'yicha progress bar |
| Murakkablik tahlili | 1-5 daraja bo'yicha natijalar |
| Ball taqsimoti | 0-100 oralig'ida band tahlili |

#### 4.5.5 Karyera (`/career`)

| Bo'lim | Tavsif |
|--------|--------|
| Yo'nalishlar | Kardiolog, Pediatr, Nevrolog, Jarroh tavsiyalari |
| Ko'nikmalar | Kategoriya bo'yicha radar grafik |
| Yutuqlar | Bosqichma-bosqich muvaffaqiyatlar |
| Yo'l xaritasi | Keyingi bosqichga erishish ko'rsatkichi |

#### 4.5.6 Sozlamalar (`/settings`)

| Funksiya | Tavsif |
|----------|--------|
| Profil tahrirlash | Ism, mutaxassislik, universitet |
| Parol o'zgartirish | OTP orqali tasdiqlash |
| Email o'zgartirish | OTP orqali tasdiqlash |
| Username o'zgartirish | OTP orqali tasdiqlash |
| Bildirishnomalar | Email, push, marketing sozlamalari |
| Mavzu | Qorong'u/Yorug' rejim almashtirish |
| Til | O'zbek/Ingliz/Rus |
| Promo-kod | Obuna uchun promo-kodni kiritish |

#### 4.5.7 Kontent menejeri (`/content-manager`)

| Funksiya | Tavsif |
|----------|--------|
| Keyslar ro'yxati | Yaratilgan keyslar jadvali |
| Keys yaratish | To'liq forma: bemor, vital, media, labratoriya, javob |
| Keys tahrirlash | Mavjud keysni o'zgartirish |
| Media yuklash | Rasm (JPEG/PNG/GIF/WebP) va video (MP4/WebM) yuklash |
| Keys turlari | Diagnostika, jarrohlik, shoshilinch holat |

#### 4.5.8 Admin panel (`/admin`)

| Tab | Funksiya |
|-----|----------|
| Dashboard | Tizim statistikasi: foydalanuvchilar, keyslar, urinishlar, o'rtacha ball |
| Foydalanuvchilar | CRUD: qidirish, rol o'zgartirish, o'chirish |
| Promo-kodlar | Batch generatsiya (500 tagacha), CSV eksport |

---

### 4.6 Fayl yuklash tizimi

| Parametr | Qiymat |
|----------|--------|
| Yo'l | `POST /api/upload` |
| Saqlash | `public/uploads/` papkasi (lokal disk) |
| Formatlar | JPEG, PNG, GIF, WebP, MP4, WebM |
| Max hajm | 50 MB |
| Ruxsat | Faqat instructor va admin |
| Nomlash | `{safeName}-{timestamp}-{random}{ext}` |

---

### 4.7 Xalqarolashtirish (i18n)

| Til | Kod | Holat |
|-----|-----|-------|
| O'zbek | `uz` | ✅ Asosiy til, 150+ kalit |
| Ingliz | `en` | ✅ To'liq tarjima |
| Rus | `ru` | ✅ To'liq tarjima |

Amalga oshirish: `lib/i18n.ts` — `t(key, locale)` funksiyasi orqali kalit-qiymat tarjima.

---

### 4.8 Mavzu (tema) tizimi

| Rejim | Tavsif |
|-------|--------|
| **Qorong'u** (standart) | Asosiy ranglar: #242938, #2e3447, matn #f0f4ff |
| **Yorug'** | Asosiy ranglar: #ffffff, #eef1f6, matn #1a1f2e |

- CSS o'zgaruvchilari orqali amalga oshirilgan
- `localStorage` da saqlanadi
- FOUC (Flash of Unstyled Content) oldini olish uchun inline skript
- Sozlamalar sahifasidagi toggle bilan boshqariladi

---

## 5. API ENDPOINTLARI

### 5.1 Autentifikatsiya (`/api/auth`)

| Usul | Endpoint | Auth | Tavsif |
|------|----------|------|--------|
| POST | `/send-otp` | — | OTP kod yuborish |
| POST | `/verify-otp` | — | OTP tekshirish, tempToken olish |
| POST | `/complete-register` | — | Ro'yxatdan o'tishni yakunlash |
| POST | `/login` | — | Kirish (username + parol) |
| POST | `/google` | — | Google OAuth kirish |
| GET | `/me` | ✅ | Joriy foydalanuvchi |
| PATCH | `/me` | ✅ | Profilni yangilash |
| POST | `/request-password-change` | ✅ | Parol o'zgartirish uchun OTP |
| POST | `/confirm-password-change` | ✅ | Parol o'zgartirishni tasdiqlash |
| POST | `/request-email-change` | ✅ | Email o'zgartirish uchun OTP |
| POST | `/confirm-email-change` | ✅ | Email o'zgartirishni tasdiqlash |
| POST | `/forgot-password` | — | Parol tiklash uchun OTP |
| POST | `/reset-password` | — | Parolni tiklash |

### 5.2 Keyslar (`/api/cases`)

| Usul | Endpoint | Auth | Tavsif |
|------|----------|------|--------|
| GET | `/` | — | Keyslar ro'yxati (sahifalangan, filtrlangan) |
| GET | `/categories` | — | Kategoriyalar va soni |
| GET | `/:id` | — | Keys tafsiloti |
| POST | `/` | instructor/admin | Keys yaratish |
| PATCH | `/:id` | instructor/admin | Keys tahrirlash |
| DELETE | `/:id` | admin | Keys o'chirish |

### 5.3 Urinishlar (`/api/attempts`)

| Usul | Endpoint | Auth | Tavsif |
|------|----------|------|--------|
| POST | `/start/:caseId` | ✅ | Urinishni boshlash |
| POST | `/submit/:attemptId` | ✅ | Javob yuborish (AI baholash) |
| GET | `/my` | ✅ | Mening urinishlarim |
| GET | `/dashboard` | ✅ | Dashboard statistikasi |

### 5.4 Statistika (`/api/stats`)

| Usul | Endpoint | Auth | Tavsif |
|------|----------|------|--------|
| GET | `/me` | ✅ | Batafsil statistika |
| GET | `/analysis` | ✅ | Kuchli/zaif tomonlar tahlili |

### 5.5 Admin (`/api/admin`)

| Usul | Endpoint | Auth | Tavsif |
|------|----------|------|--------|
| GET | `/stats` | admin | Tizim statistikasi |
| GET | `/activity` | admin | So'nggi faollik |
| GET/POST/PATCH/DELETE | `/users` | admin | Foydalanuvchilar CRUD |
| POST | `/promo-codes` | admin | Promo-kod generatsiya (500 tagacha) |
| GET | `/promo-codes` | admin | Promo-kodlar ro'yxati |
| GET | `/promo-codes/export` | admin | CSV eksport |

### 5.6 Boshqa

| Usul | Endpoint | Auth | Tavsif |
|------|----------|------|--------|
| POST | `/api/tts` | ✅ | O'zbek nutq sintezi (Aisha API) |
| POST | `/api/upload` | instructor/admin | Fayl yuklash |
| POST | `/api/subscriptions/apply-promo` | ✅ | Promo-kod qo'llash |
| POST | `/api/subscriptions/subscribe` | ✅ | Obuna bo'lish |
| GET | `/api/health` | — | Server holati |

---

## 6. MA'LUMOTLAR MODELI

### 6.1 User (Foydalanuvchi)

```
User {
  username:    String (unique, /^[a-z0-9]{6,}$/)
  firstName:   String
  lastName:    String
  email:       String (unique)
  password:    String (bcrypt, salt: 12)
  googleId:    String (optional)
  isEmailVerified: Boolean
  role:        "student" | "instructor" | "admin"
  avatar:      String
  specialty:   String
  university:  String
  stats: {
    totalCases:  Number
    avgScore:    Number
    weeklyCount: Number
    streak:      Number
  }
  isPremium:   Boolean
  subscription: {
    plan:      "free" | "pro" | "clinic" | "university"
    status:    "active" | "expired" | "cancelled"
    expiresAt: Date
    organizationName: String
  }
  preferences: {
    darkMode:   Boolean
    sound:      Boolean
    animations: Boolean
    language:   "uz" | "en" | "ru"
    autoSave:   Boolean
  }
  notifications: {
    email:     Boolean
    push:      Boolean
    marketing: Boolean
  }
}
```

### 6.2 Case (Klinik keys)

```
Case {
  caseId:      String (unique)
  title:       String
  category:    String (indexed)
  difficulty:  Number (1-5)
  type:        "diagnostika" | "jarrohlik" | "shoshilinch"
  isPremium:   Boolean
  status:      "draft" | "review" | "published" | "rejected"
  patient: {
    name:       String
    age:        Number
    gender:     String
    ageGroup:   String
    complaints: String
    history:    String
    vitals: {
      bloodPressure: String
      heartRate:     Number
      temperature:   Number
      oxygenLevel:   Number
    }
  }
  mediaItems: [{
    type:     "xray" | "ekg"
    fileData: String (base64 yoki URL)
    comment:  String
  }]
  labResults: [{
    name:   String
    value:  String
    unit:   String
    range:  String
    status: "normal" | "yuqori" | "past" | "kritik"
  }]
  correctDiagnosis: String
  correctTreatment: String
  timeLimit:  Number (default: 600 sekund)
  createdBy:  ObjectId → User
}
```

### 6.3 CaseAttempt (Urinish)

```
CaseAttempt {
  user:       ObjectId → User
  case:       ObjectId → Case
  status:     "in-progress" | "completed" | "abandoned"
  selectedTests: [String]
  diagnosis:  String
  treatment:  String
  score:      Number (0-100)
  aiFeedback: String
  timeSpent:  Number (sekund)
  completedSteps: [String]
}
```

### 6.4 OTP

```
OTP {
  email:    String
  code:     String (6 raqamli)
  type:     "register" | "password-reset" | "password-change" | "email-change"
  tempData: Mixed (vaqtinchalik ma'lumotlar)
  expiresAt: Date (TTL: 10 daqiqa, avtomatik o'chish)
}
```

### 6.5 PromoCode

```
PromoCode {
  code:       String (unique, 8 belgi, KATTA HARF)
  type:       "pro" | "clinic" | "university"
  duration:   Number (oylar)
  maxUses:    Number
  usedCount:  Number
  usedBy:     [ObjectId → User]
  organizationName: String
  expiresAt:  Date
  isActive:   Boolean
}
```

---

## 7. XAVFSIZLIK

### 7.1 Amalga oshirilgan choralar

| Chora | Tavsif |
|-------|--------|
| **JWT** | 7 kunlik amal muddati, Bearer token sxemasi |
| **Bcrypt** | Parol xeshlash (salt factor: 12) |
| **Helmet** | HTTP xavfsizlik sarlavhalari |
| **CORS** | Origin tekshiruvi (origin whitelist) |
| **Rate Limiting** | 200 so'rov / 15 daqiqa `/api` uchun |
| **OTP** | 6 raqamli, 10 daqiqa amal muddati, TTL index |
| **Rol asosidagi kirish** | `protect` va `restrictTo` middleware |
| **Fayl filtrlash** | Faqat ruxsat berilgan MIME turlar (rasm/video) |
| **Input validatsiya** | Username/parol regex, email format tekshiruvi |

### 7.2 Autentifikatsiya oqimi

```
Email → OTP (6 raqam, 10 min) → tempToken (15 min) → JWT (7 kun)
```

---

## 8. DEPLOY VA INFRATUZILMA

| Komponent | Platforma | Tavsif |
|-----------|-----------|--------|
| Frontend | Vercel | Next.js 16 SSR, avtomatik deploy |
| Backend | Alohida server | Express.js, Node.js runtime |
| Ma'lumotlar bazasi | MongoDB Atlas | Bulutli klaster |
| Fayl saqlash | Lokal disk | `public/uploads/` papkasi |
| DNS | Vercel | Avtomatik SSL |

### 8.1 Muhit o'zgaruvchilari (Backend)

```
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
OPENAI_API_KEY=sk-proj-...
AISHA_API_KEY=...
EMAIL_USER=...@gmail.com
EMAIL_PASS=...
GOOGLE_CLIENT_ID=...
FRONTEND_URL=http://localhost:3000
```

---

## 9. LOYIHA YUTUQLARI

### 9.1 Texnik yutuqlar

| # | Yutuq | Tavsif |
|---|-------|--------|
| 1 | **AI integratsiya** | OpenAI GPT-4o-mini orqali real-time baholash va batafsil tahlil |
| 2 | **O'zbek TTS** | Aisha API orqali tabiy ovozli bemor simulyatsiyasi |
| 3 | **To'liq autentifikatsiya** | OTP, JWT, Google OAuth, xavfsiz o'zgarishlar |
| 4 | **Real-time simulyatsiya** | Taymer, bosqichma-bosqich oqim, interaktiv UI |
| 5 | **Responsive dizayn** | Mobil, planshet va desktop uchun moslashtirilgan |
| 6 | **Qorong'u/Yorug' rejim** | CSS o'zgaruvchilari bilan tezkor almashtirish |
| 7 | **Ko'p tilli** | O'zbek, Ingliz, Rus tillari qo'llab-quvvatlanadi |
| 8 | **Zamonaviy stek** | Next.js 16, React 19, Tailwind v4 — eng so'nggi texnologiyalar |
| 9 | **Admin boshqaruvi** | Foydalanuvchilar, keyslar, promo-kodlar to'liq CRUD |
| 10 | **Batafsil statistika** | Oylik, kategoriya, murakkablik bo'yicha tahlil |

### 9.2 Biznes yutuqlari

| # | Yutuq | Tavsif |
|---|-------|--------|
| 1 | **Bozorda birinchi** | O'zbekistonda tibbiy AI simulyator yo'q |
| 2 | **Skalanuvchi model** | Bepul → Pro → Klinika → Universitet pog'onalari |
| 3 | **B2B imkoniyat** | Klinika va universitetlar uchun korporativ litsenziya |
| 4 | **Promo tizim** | Marketing kampaniyalari uchun batch promo-kod generatsiya |
| 5 | **Lokal til** | O'zbek tilidagi interfeys va AI javoblar |

---

## 10. MA'LUM KAMCHILIKLAR VA YECHIMLAR

### 10.1 Texnik kamchiliklar

| # | Kamchilik | Xavf darajasi | Taklif qilingan yechim |
|---|-----------|---------------|------------------------|
| 1 | **Hardcoded localhost:5000** | 🔴 Yuqori | `NEXT_PUBLIC_API_URL` env o'zgaruvchisiga o'tish |
| 2 | **Narx nomuvofiqlik** | 🟡 O'rta | Landing sahifa va backend narxlarini sinxronlashtirish |
| 3 | **i18n integratsiya qilinmagan** | 🟡 O'rta | `t()` funksiyasini barcha sahifalarga qo'shish |
| 4 | **Lokal fayl saqlash** | 🟡 O'rta | Ishlab chiqarishda S3/Cloudinary ga o'tish |
| 5 | **SSR ishlatilmayapti** | 🟢 Past | Barcha sahifalar `'use client'` — SEO uchun SSR qo'shish |
| 6 | **Mock data fayli** | 🟢 Past | `lib/mock-data.ts` ni o'chirish (boshqa ishlatilmayapti) |
| 7 | **Karyera sahifasi statik** | 🟢 Past | Karyera yo'nalishlari va yutuqlarni backenddan olish |
| 8 | **next.config.ts bo'sh** | 🟢 Past | Kerakli konfiguratsiyalarni qo'shish |
| 9 | **To'lov integratsiyasi yo'q** | 🔴 Yuqori | Payme/Click/Stripe integratsiya qilish |
| 10 | **Test yo'q** | 🔴 Yuqori | Unit va integration testlar yozish |

### 10.2 Kamchiliklarni bartaraf etish rejasi

#### Birinchi navbat (1-2 hafta)

1. **To'lov integratsiyasi** — Payme yoki Click orqali obuna to'lovlarini avtomatlashtirish
2. **Environment o'zgaruvchilari** — Barcha hardcoded URL larni env ga o'tkazish
3. **Narxlarni sinxronlashtirish** — Yagona narx manbasi yaratish

#### Ikkinchi navbat (2-4 hafta)

4. **i18n to'liq integratsiya** — Barcha sahifalarda `t()` funksiyasini qo'llash
5. **Fayl saqlash** — S3 yoki Cloudinary ga migratsiya
6. **Testlar** — Jest + React Testing Library bilan test qoplami

#### Uchinchi navbat (1-2 oy)

7. **SSR optimizatsiya** — SEO muhim sahifalarni server-side rendering ga o'tkazish
8. **PWA** — Offline rejim va mobil ilovaga o'xshash tajriba
9. **Karyera tizimi** — Backend asosida personallashtirilgan tavsiyalar
10. **Analytics** — Google Analytics yoki Mixpanel integratsiya

---

## 11. TIZIM TALABLARI

### 11.1 Foydalanuvchi uchun

| Talab | Minimum |
|-------|---------|
| Brauzer | Chrome 90+, Firefox 88+, Safari 15+, Edge 90+ |
| Internet | 1 Mbps (video uchun 5 Mbps) |
| Ekran | 320px minimum kenglik (responsive) |

### 11.2 Server uchun

| Talab | Tavsiya |
|-------|---------|
| Node.js | 18+ |
| RAM | 1 GB minimum |
| Disk | 10 GB (media fayllar uchun) |
| MongoDB | 6.0+ (Atlas M10+ ishlab chiqarish uchun) |

---

## 12. FOYDALANISHNI BOSHLASH

### 12.1 Backend

```bash
cd backend
npm install
# .env faylini sozlash
npm run dev    # Ishlab chiqish
npm run build  # Kompilyatsiya
npm start      # Ishlab chiqarish
```

### 12.2 Frontend

```bash
npm install
npm run dev    # http://localhost:3000
npm run build  # Ishlab chiqarish build
```

### 12.3 Boshlang'ich ma'lumotlar (Seed)

```bash
cd backend
npx ts-node src/seed.ts
```

Yaratiladi:
- **Admin:** username `admin`, parol `admin123`
- **Content Manager:** username `manager`, parol `manager123`
- **Demo User:** username `demouser`, parol `demo123`
- **6 ta namunali klinik keys** (kardiologiya, pulmonologiya, gastroenterologiya va boshqalar)

---

## 13. XULOSA

**Med AI Simulator** — O'zbekiston tibbiyot ta'limida zamonaviy texnologiyalarni qo'llashga qaratilgan innovatsion loyiha. Sun'iy intellekt, nutq sintezi va interaktiv simulyatsiya orqali talabalar xavfsiz muhitda amaliy ko'nikmalar orttiradi.

Loyiha hozirgi holatda MVP (Minimum Viable Product) bosqichida bo'lib, asosiy funksiyalar to'liq ishlamoqda. To'lov integratsiyasi, test qoplami va ishlab chiqarish optimizatsiyalari keyingi bosqichlarda amalga oshiriladi.

---

*Hujjat oxiri | Med AI Simulator v1.0 | 2026*
