# 📋 TEXNIK TOPSHIRIQ (TZ)

## Loyiha: **Med AI Simulator** — Sun'iy intellektga asoslangan tibbiy simulyator

> **Hujjat versiyasi:** v2.0 · **Oxirgi yangilanish:** 2026-05-25
> Ushbu hujjat loyihaning haqiqiy kod bazasiga (frontend `app/`, `components/`, `lib/` + backend `backend/src/`) muvofiqlashtirib yangilangan.

---

## MUNDARIJA

1. [Loyiha maqsadi](#1-loyiha-maqsadi)
2. [Biznes modeli](#2-biznes-modeli)
3. [Texnik arxitektura](#3-texnik-arxitektura)
4. [Funksional talablar](#4-funksional-talablar)
5. [API endpointlari](#5-api-endpointlari)
6. [Ma'lumotlar modeli](#6-malumotlar-modeli)
7. [Xavfsizlik](#7-xavfsizlik)
8. [Deploy va infratuzilma](#8-deploy-va-infratuzilma)
9. [Loyiha yutuqlari](#9-loyiha-yutuqlari)
10. [Ochiq vazifalar va yo'l xaritasi](#10-ochiq-vazifalar-va-yol-xaritasi)
11. [Tizim talablari](#11-tizim-talablari)
12. [Foydalanishni boshlash](#12-foydalanishni-boshlash)
13. [Xulosa](#13-xulosa)

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
| Shoshilinch rejim | Vaqt cheklovi bilan tezkor qaror talab qiladigan alohida rejim |
| 3D anatomiya simulyatori | BioDigital Human asosida interaktiv 3D model ko'rgichi |
| AI baholash | OpenAI GPT-4o-mini orqali javoblarni tahlil qilish, ball berish (0-100) |
| AI chatbot | Umumiy savol-javob va statistika asosida shaxsiy tahlil chati |
| Tibbiy kutubxona | O'zbek/rus/ingliz tilidagi tibbiy kitoblar va manbalar |
| Video kurslar | YouTube asosidagi tematik darslar |
| Reyting jadvali | Foydalanuvchilar o'rtasida ball bo'yicha musobaqa |
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

Narxlar yagona manbadan boshqariladi: `backend/src/controllers/subscriptionController.ts` (`PLAN_PRICES`).

| Reja | Oylik narx | Yillik narx | Imkoniyatlar |
|------|-----------|-------------|--------------|
| **Bepul** (`free`) | 0 UZS | 0 UZS | Asosiy keyslar, cheklangan miqdor |
| **Pro** (`pro`) | 30,000 UZS | 300,000 UZS | Barcha keyslar, AI tahlil, shoshilinch rejim, statistika |
| **Klinika** (`clinic`) | 3,000,000 UZS | 30,000,000 UZS | Ko'p foydalanuvchi, tashkilot boshqaruvi, batafsil hisobot |
| **Universitet** (`university`) | Kelishiladi | Kelishiladi | Maxsus integratsiya, professor paneli, talabalar monitoringi |

> Yillik obunada chegirma qo'llaniladi (`subscribe` endpointida `discountPercent` orqali hisoblanadi).

### 2.3 Monetizatsiya kanallari

1. **Obuna to'lovlari** — asosiy daromad manbai (hozircha to'lov **manual** kelishiladi, avtomatik to'lov shlyuzi yo'q — [10-bo'lim](#10-ochiq-vazifalar-va-yol-xaritasi))
2. **Klinika/Universitet litsenziyalari** — B2B segment
3. **Promo-kodlar** — marketing kampaniyalari uchun (admin tomonidan batch generatsiya qilinadi)
4. **Referal tizimi** — `getReferralInfo` endpointi orqali taklif qilish

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
│  │  Pages   │ │Components│ │  Context/Hooks        │ │
│  │ (App     │ │ (React   │ │ (Auth, Theme, i18n)   │ │
│  │  Router) │ │  19)     │ │                       │ │
│  └──────────┘ └──────────┘ └──────────────────────┘ │
│  Library PDF proxy: app/api/library/proxy            │
│            Vercel orqali deploy (standalone)         │
└──────────────────────┬──────────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────────┐
│              BACKEND (Express.js 4.21)               │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │
│  │ Routes   │ │Controllers│ │   Middleware         │ │
│  │          │ │           │ │ (Auth, RateLimit,    │ │
│  │          │ │           │ │  Helmet, CORS)       │ │
│  └──────────┘ └──────────┘ └──────────────────────┘ │
└──┬───────┬───────────┬────────────┬─────────────────┘
   │       │           │            │
┌──▼──┐ ┌──▼───┐ ┌─────▼─────┐ ┌────▼─────────┐
│Mongo│ │OpenAI│ │ Aisha TTS │ │ Gmail SMTP   │
│Atlas│ │GPT-  │ │ (uz nutq) │ │ (OTP email)  │
│     │ │4o-mn │ │           │ │              │
└─────┘ └──────┘ └───────────┘ └──────────────┘

Tashqi (frontenddan): BioDigital Human (3D), YouTube (kurslar),
                      unilibrary.uz / ziyonet.uz (kutubxona PDF)
```

### 3.2 Texnologiyalar steki

#### Frontend (`package.json`)

| Texnologiya | Versiya | Vazifasi |
|-------------|---------|----------|
| Next.js | ^16.2.3 | App Router, SSR framework (`output: 'standalone'`) |
| React | 19.2.4 | UI kutubxonasi |
| TypeScript | ^5 | Tip xavfsizligi |
| Tailwind CSS | ^4 | Utility-first stillash |
| Framer Motion | ^12.38 | Animatsiyalar |
| Lucide React | ^1.7 | Ikonkalar |
| @react-oauth/google | ^0.13.4 | Google OAuth |
| react-markdown + remark-gfm | ^10.1 / ^4.0 | AI javoblar va matnlarni markdown render qilish |

#### Backend (`backend/package.json`)

| Texnologiya | Versiya | Vazifasi |
|-------------|---------|----------|
| Express.js | ^4.21.2 | HTTP server |
| Mongoose | ^8.9.5 | MongoDB ODM |
| jsonwebtoken | ^9.0.2 | JWT autentifikatsiya (7 kun amal muddati) |
| bcryptjs | ^2.4.3 | Parol xeshlash (salt: 12) |
| OpenAI SDK | ^6.33 | AI baholash + chatbot (gpt-4o-mini) |
| google-auth-library | ^10.6.2 | Google OAuth tekshiruvi |
| Nodemailer | ^8.0.4 | Email OTP yuborish (Gmail) |
| Multer | ^2.1.1 | Fayl yuklash (max 50MB) |
| Helmet | ^8.0 | Xavfsizlik sarlavhalari |
| express-rate-limit | ^7.5 | 200 so'rov / 15 daqiqa |
| express-validator | ^7.2 | Kiruvchi ma'lumotlar validatsiyasi |
| tsx | ^4.19 (dev) | TypeScript runtime (dev/seed) |

#### Ma'lumotlar bazasi

| Texnologiya | Xizmat |
|-------------|--------|
| MongoDB Atlas | Bulutli NoSQL baza (`mongodb+srv://`) |

#### Tashqi API xizmatlari

| Xizmat | Vazifasi |
|--------|----------|
| OpenAI GPT-4o-mini | Javoblarni baholash, batafsil tahlil, chatbot |
| Aisha Group TTS | O'zbek tilidagi nutq sintezi (gulnoza/jaxongir modellari) |
| Gmail SMTP | OTP kodlarini email orqali yuborish |
| Google OAuth | Ijtimoiy tarmoq orqali kirish |
| BioDigital Human | 3D anatomiya modellari (frontend `NEXT_PUBLIC_BIODIGITAL_DK`) |
| YouTube | Video kurslar (kurslar sahifasi) |
| unilibrary.uz / ziyonet.uz | Kutubxona PDF manbalari (whitelisted proxy orqali) |

---

## 4. FUNKSIONAL TALABLAR

### 4.1 Autentifikatsiya va avtorizatsiya

#### Ro'yxatdan o'tish (4 bosqich)
1. **Usul tanlash** — Email yoki Google OAuth
2. **Shaxsiy ma'lumotlar** — Ism, familiya, mutaxassislik, universitet
3. **Hisob yaratish** — Username (kichik harf + raqam, 6+ belgi), parol (6+ belgi)
4. **Email tasdiqlash** — 6 raqamli OTP kod (TTL: 10 daqiqa)

#### Kirish usullari
- **Username + Parol** — an'anaviy kirish
- **Google OAuth** — bir bosqichda kirish/ro'yxatdan o'tish

#### Foydalanuvchi rollari

| Rol (Backend) | Rol (Frontend) | Ruxsatlar |
|---------------|----------------|-----------|
| `student` | user | Keyslarni yechish, statistikani ko'rish |
| `instructor` | content-manager | Keyslarni yaratish/tahrirlash, media yuklash + student ruxsatlari |
| `admin` | admin | To'liq boshqaruv: foydalanuvchilar, promo-kodlar, keyslar |

#### Xavfsiz o'zgarishlar (OTP talab qilinadi)
- Parol o'zgartirish
- Email o'zgartirish
- Parolni tiklash (forgot-password)

---

### 4.2 Klinik keyslar tizimi

#### Klinik keys tuzilmasi

```
Case
├── Asosiy: caseId, sarlavha, kategoriya, murakkablik (1-5), tur
├── Bemor: ism, yosh, jins, yosh guruhi, shikoyatlar, anamnez
├── Vital belgilar: AD, puls, harorat, SpO2
├── Tibbiy media: rentgen, EKG (base64 yoki URL)
├── Laboratoriya: tahlil natijalari (normal/yuqori/past/kritik)
├── To'g'ri javob: tashxis + davolash rejasi
└── Meta: status, premium, yaratuvchi, vaqt chegarasi
```

#### Keys turlari

| Tur | Tavsif | Vaqt chegarasi |
|-----|--------|----------------|
| **diagnostika** | Tashxis qo'yish va davolash rejasi | `timeLimit` (default 600 s) |
| **jarrohlik** | Jarrohlik amaliyoti kerak bo'lgan holatlar | `timeLimit` (default 600 s) |
| **shoshilinch** | Tezkor qaror talab qiladigan favqulodda holatlar | `timeLimit` (default 300 s) |

#### Keys kategoriyalari
Kardiologiya, Pulmonologiya, Gastroenterologiya, Nevrologiya, Endokrinologiya, Travmatologiya va boshqalar. Kategoriyalar **dinamik** — `Category` modeli orqali backendda boshqariladi (`GET /api/cases/categories`).

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
   ├─ Taymer ishga tushadi (timeLimit asosida)
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
- **Ovoz modellari:** `gulnoza` (ayol bemor), `jaxongir` (erkak bemor)
- **Bemor avatari** — `patientgif.mp4` video (cheksiz takrorlanuvchi)
- **Og'riq animatsiyasi** — bemor holati vizual ko'rsatiladi

---

### 4.5 3D anatomiya simulyatori (`/simulator`) — YANGI

- **BioDigital Human Viewer** — `iframe` orqali interaktiv 3D model
- **Komponentlar:** `components/simulator/BioDigitalViewer.tsx`, `components/simulator/ControlsPanel.tsx`
- **Model toifalari:** anatomiya, organ, tizim, kasallik (`BIODIGITAL_MODELS`)
- **Imkoniyatlar:** model qidirish, kategoriya bo'yicha tanlash, fullscreen rejim, panelni yopish/ochish
- **Konfiguratsiya:** `NEXT_PUBLIC_BIODIGITAL_DK` developer key (frontend `.env.local`). Key bo'sh bo'lsa viewer xato holatini ko'rsatadi.

---

### 4.6 AI chatbot va tahlil (`/analysis` + ChatWidget) — YANGI

- **Suzuvchi chatbot** (`components/ChatWidget.tsx`) — har sahifada umumiy AI yordamchi
- **Tahlil sahifasi** (`/analysis`) — foydalanuvchi statistikasi konteksti bilan AI suhbat
- **Backend:** `POST /api/chat` (umumiy), `POST /api/chat/analysis` (statistika konteksti)
- **Modeli:** OpenAI gpt-4o-mini (`backend/src/controllers/chatController.ts`)

---

### 4.7 Tibbiy kutubxona (`/library`, `/library/read`) — YANGI

- **Kitoblar katalogi** — `lib/library-data.ts` (`BOOKS`, `CATEGORIES`)
- **Tillar:** O'zbek (`uz`), Rus (`ru`), Ingliz (`en`)
- **O'qish rejimi** — `/library/read` ichida PDF ko'rgich
- **Xavfsiz PDF proxy** — `app/api/library/proxy/route.ts`:
  - Faqat whitelisted hostlar: `api.unilibrary.uz`, `api.ziyonet.uz`
  - Faqat `https://` va `.pdf` kengaytmali manbalar
  - `runtime = 'nodejs'`, `dynamic = 'force-dynamic'`

---

### 4.8 Video kurslar (`/kurslar`) — YANGI

- YouTube asosidagi tematik darslar ro'yxati (`LESSONS`)
- Har bir dars: sarlavha, tavsif, YouTube havola
- Muallif ko'rsatkichi

---

### 4.9 Reyting jadvali (`/leaderboard`) — YANGI

- Foydalanuvchilarni umumiy ball bo'yicha tartiblash
- Top-3 uchun medal belgilari (oltin/kumush/bronza)
- Joriy foydalanuvchining o'z reytingi ajratib ko'rsatiladi
- Avatar (Google rasmi yoki bosh harflar), sarflangan vaqt
- **Backend:** `GET /api/stats/leaderboard` (`getLeaderboard`)

---

### 4.10 Shoshilinch rejim (`/emergency`) — YANGI

- `type: 'shoshilinch'` keyslarning alohida sahifasi
- Vaqt cheklovi (default 300 s, keys `timeLimit` asosida)
- Qidiruv, kategoriya va murakkablik bo'yicha filtr
- Premium keyslar qulflangan ko'rinishda

---

### 4.11 Obuna sahifasi (`/subscription`) — YANGI

- Oylik/yillik to'lov davri almashtirgich
- Reja solishtirish (Bepul / Pro / Klinika / Universitet)
- Promo-kod qo'llash va chegirma ko'rsatish
- **To'lov:** hozircha **manual** — obuna so'rovi yuborilgach, admin bilan to'lov kelishiladi (click/payme yoki bank o'tkazmasi)

---

### 4.12 Asosiy sahifalar

#### Bosh sahifa (`/`)
Hero, imkoniyatlar, "qanday ishlaydi", narxlar, fikrlar, CTA bo'limlari.

#### Dashboard (`/dashboard`)

| Element | Ma'lumot manbai |
|---------|-----------------|
| Statistika kartalari | Jami keyslar, o'rtacha ball, haftalik soni, streak |
| Haftalik faollik grafigi | Oxirgi 7 kun (`ActivityChart`) |
| Kategoriya bo'yicha o'sish | Har bir kategoriya uchun o'rtacha ball |
| Davom ettirish | Oxirgi tugallanmagan keys |
| Tavsiya qilingan keyslar | Eng so'nggi nashr qilingan keyslar |

#### Keyslar ro'yxati (`/cases`, `/cases/[id]`)
- Real-time qidiruv (debounce), kategoriya/tur filtrlari
- Dinamik kategoriyalar (backenddan), premium qulf belgisi
- `[id]` — keys tafsiloti va simulyatsiya boshlash

#### Statistika (`/statistics`)
Umumiy ko'rsatkichlar, oylik faollik, kategoriya natijalari, murakkablik tahlili, ball taqsimoti.

#### Karyera (`/career`)
Yo'nalishlar, ko'nikmalar radar grafigi, yutuqlar, yo'l xaritasi.

#### Sozlamalar (`/settings`)
Profil tahrirlash, parol/email o'zgartirish (OTP), bildirishnomalar, mavzu, til, promo-kod.

#### Kontent menejeri (`/content-manager`)
Keyslar ro'yxati, keys yaratish/tahrirlash (`NewCaseModal`), media yuklash (rasm/video).

#### Admin panel (`/admin`)

| Tab | Funksiya |
|-----|----------|
| Dashboard | Tizim statistikasi: foydalanuvchilar, keyslar, urinishlar, o'rtacha ball |
| Foydalanuvchilar | CRUD: qidirish, rol o'zgartirish, o'chirish |
| Promo-kodlar | Batch generatsiya (500 tagacha), CSV eksport |

---

### 4.13 Fayl yuklash tizimi

| Parametr | Qiymat |
|----------|--------|
| Yo'l | `POST /api/upload` |
| Saqlash | `public/uploads/` (lokal); Vercelda `/tmp/uploads` |
| Formatlar | JPEG, PNG, GIF, WebP, MP4, WebM |
| Max hajm | 50 MB |
| Ruxsat | Faqat instructor va admin |
| Nomlash | `{safeName}-{timestamp}-{random}{ext}` |

---

### 4.14 Xalqarolashtirish (i18n)

| Til | Kod | Holat |
|-----|-----|-------|
| O'zbek | `uz` | ✅ Asosiy til |
| Ingliz | `en` | ✅ Tarjima mavjud |
| Rus | `ru` | ✅ Tarjima mavjud |

- Amalga oshirish: `lib/i18n.ts` — `t(key, locale)` va `getLocale()` funksiyalari
- **Holat:** lug'at to'liq tayyor, ammo barcha sahifalarda **to'liq qo'llanmagan** (ko'p matn hali statik). [10-bo'limga](#10-ochiq-vazifalar-va-yol-xaritasi) qarang.

---

### 4.15 Mavzu (tema) tizimi

| Rejim | Tavsif |
|-------|--------|
| **Qorong'u** (standart) | To'q ranglar palitrasi |
| **Yorug'** | Och ranglar palitrasi |

- CSS o'zgaruvchilari orqali (`app/globals.css`), `lib/theme-context.tsx` orqali boshqariladi
- `localStorage` da saqlanadi, FOUC oldini olish uchun inline skript
- Sozlamalar sahifasidagi toggle bilan boshqariladi

---

## 5. API ENDPOINTLARI

Backend mount nuqtalari: `backend/src/app.ts`.

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
| GET | `/leaderboard` | ✅ | Reyting jadvali |

### 5.5 AI Chat (`/api/chat`)

| Usul | Endpoint | Auth | Tavsif |
|------|----------|------|--------|
| POST | `/` | ✅ | Umumiy AI chatbot |
| POST | `/analysis` | ✅ | Statistika konteksti bilan AI tahlil |

### 5.6 Obuna (`/api/subscriptions`)

| Usul | Endpoint | Auth | Tavsif |
|------|----------|------|--------|
| GET | `/plans` | — | Reja narxlari |
| GET | `/my` | ✅ | Joriy obuna holati |
| GET | `/referral` | ✅ | Referal ma'lumotlari |
| POST | `/apply-promo` | ✅ | Promo-kod qo'llash |
| POST | `/subscribe` | ✅ | Obuna so'rovi |

### 5.7 Admin (`/api/admin`)

| Usul | Endpoint | Auth | Tavsif |
|------|----------|------|--------|
| GET | `/stats` | admin | Tizim statistikasi |
| GET | `/activity` | admin | So'nggi faollik |
| GET/POST/PATCH/DELETE | `/users` | admin | Foydalanuvchilar CRUD |
| POST | `/promo-codes` | admin | Promo-kod generatsiya (500 tagacha) |
| GET | `/promo-codes` | admin | Promo-kodlar ro'yxati |
| GET | `/promo-codes/export` | admin | CSV eksport |

### 5.8 Boshqa (backend)

| Usul | Endpoint | Auth | Tavsif |
|------|----------|------|--------|
| POST | `/api/tts` | ✅ | O'zbek nutq sintezi (Aisha API) |
| POST | `/api/upload` | instructor/admin | Fayl yuklash |
| GET | `/api/health` | — | Server holati |

### 5.9 Frontend API route

| Usul | Endpoint | Tavsif |
|------|----------|--------|
| GET | `/api/library/proxy?url=...` | Whitelisted tibbiy PDF proxy (Next.js route) |

---

## 6. MA'LUMOTLAR MODELI

Manba: `backend/src/models/`.

### 6.1 User

```
User {
  username:    String (unique, kichik harf + raqam, 6+ belgi)
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
  stats: { totalCases, avgScore, weeklyCount, streak }
  isPremium:   Boolean
  subscription: {
    plan:      "free" | "pro" | "clinic" | "university"
    status:    "active" | "expired" | "cancelled"
    expiresAt: Date
    organizationName: String
  }
  preferences:  { darkMode, sound, animations, language, autoSave }
  notifications:{ email, push, marketing }
}
```

### 6.2 Case

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
    name, age, gender, ageGroup, complaints, history,
    vitals: { bloodPressure, heartRate, temperature, oxygenLevel }
  }
  mediaItems:  [{ type: "xray"|"ekg", fileData, comment }]
  labResults:  [{ name, value, unit, range, status: normal|yuqori|past|kritik }]
  correctDiagnosis: String
  correctTreatment: String
  timeLimit:   Number (default 600 s; shoshilinch uchun odatda 300 s)
  createdBy:   ObjectId → User
}
```

### 6.3 CaseAttempt

```
CaseAttempt {
  user, case:    ObjectId
  status:        "in-progress" | "completed" | "abandoned"
  selectedTests: [String]
  diagnosis, treatment: String
  score:         Number (0-100)
  aiFeedback:    String
  timeSpent:     Number (sekund)
  completedSteps:[String]
}
```

### 6.4 Category — YANGI

```
Category {
  name: String (unique, trim)
  timestamps: createdAt, updatedAt
}
```
Dinamik kategoriyalarni boshqaradi; keyslar `category` maydoni shu nomlarga ishora qiladi.

### 6.5 OTP

```
OTP {
  email:    String
  code:     String (6 raqam)
  type:     "register" | "password-reset" | "password-change" | "email-change"
  tempData: Mixed
  expiresAt:Date (TTL 10 daqiqa, avtomatik o'chish)
}
```

### 6.6 PromoCode

```
PromoCode {
  code:       String (unique, 8 belgi, KATTA HARF)
  type:       "pro" | "clinic" | "university"
  duration:   Number (oylar)
  maxUses, usedCount: Number
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
| **Helmet** | HTTP xavfsizlik sarlavhalari (`crossOriginResourcePolicy: cross-origin`) |
| **CORS** | Origin whitelist (`CLIENT_ORIGINS`) + `*.vercel.app` regex |
| **Rate Limiting** | 200 so'rov / 15 daqiqa `/api` uchun |
| **OTP** | 6 raqamli, 10 daqiqa, TTL index orqali avto-o'chirish |
| **Rol asosidagi kirish** | `protect` va `restrictTo` middleware |
| **Fayl filtrlash** | Faqat ruxsat berilgan MIME turlar (rasm/video) |
| **Input validatsiya** | express-validator, username/parol regex, email format |
| **PDF proxy whitelist** | Faqat ishonchli host + `https` + `.pdf` (`library/proxy`) |
| **Frontend 401 auto-reset** | Muddati tugagan sessiya avtomatik tozalanadi (`lib/api.ts`) |
| **trust proxy** | `app.set('trust proxy', 1)` — proksi orqasida to'g'ri IP |

### 7.2 Autentifikatsiya oqimi

```
Email → OTP (6 raqam, 10 min) → tempToken → JWT (7 kun)
```

### 7.3 Xavfsizlik bo'yicha eslatma (kod bazasida)

> ⚠️ `backend/.env` faylida real maxfiy kalitlar (MongoDB parol, OPENAI_API_KEY, Gmail app password, AISHA_API_KEY) saqlanmoqda. Bu fayl **hech qachon git'ga kommit qilinmasligi** kerak (`.gitignore` da bo'lishi shart). Kalitlar oshkor bo'lgan bo'lsa — **rotatsiya** qilish tavsiya etiladi.

---

## 8. DEPLOY VA INFRATUZILMA

| Komponent | Platforma | Tavsif |
|-----------|-----------|--------|
| Frontend | Vercel | Next.js 16 SSR, `output: 'standalone'` |
| Backend | Alohida server / PM2 | Express.js, Node.js runtime |
| Ma'lumotlar bazasi | MongoDB Atlas | Bulutli klaster |
| Fayl saqlash | Lokal disk / `/tmp` (Vercel) | `public/uploads/` |
| DNS / SSL | Vercel | Avtomatik |

### 8.1 PM2 bilan deploy

```bash
npm run build:all
pm2 start ecosystem.config.cjs
pm2 save
```

### 8.2 Muhit o'zgaruvchilari

**Backend (`backend/.env`)** — namuna: `backend/.env.example`
```
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
JWT_EXPIRES_IN=7d
CLIENT_ORIGINS=https://domeningiz.uz,http://localhost:3000
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini
AISHA_API_KEY=...
GOOGLE_CLIENT_ID=...
GMAIL_USER=...@gmail.com
GMAIL_APP_PASSWORD=...
FRONTEND_URL=https://domeningiz.uz
```

**Frontend (`.env.local`)** — namuna: `.env.example`
```
NEXT_PUBLIC_API_URL=https://api.domeningiz.uz/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
NEXT_PUBLIC_BIODIGITAL_DK=...   # BioDigital developer key (3D simulator uchun)
```

---

## 9. LOYIHA YUTUQLARI

### 9.1 Texnik yutuqlar

| # | Yutuq | Tavsif |
|---|-------|--------|
| 1 | **AI baholash** | OpenAI GPT-4o-mini orqali real-time baholash va batafsil tahlil |
| 2 | **AI chatbot** | Suzuvchi yordamchi + statistika asosida shaxsiy tahlil |
| 3 | **O'zbek TTS** | Aisha API orqali tabiiy ovozli bemor simulyatsiyasi |
| 4 | **3D anatomiya** | BioDigital Human asosidagi interaktiv 3D simulator |
| 5 | **Tibbiy kutubxona** | Whitelisted PDF proxy bilan xavfsiz kitob ko'rgich |
| 6 | **Reyting jadvali** | Foydalanuvchilar o'rtasida geymifikatsiya |
| 7 | **To'liq autentifikatsiya** | OTP, JWT, Google OAuth, xavfsiz o'zgarishlar |
| 8 | **Responsive dizayn** | Mobil, planshet va desktop uchun moslashtirilgan |
| 9 | **Qorong'u/Yorug' rejim** | CSS o'zgaruvchilari bilan tezkor almashtirish |
| 10 | **Zamonaviy stek** | Next.js 16, React 19, Tailwind v4 |
| 11 | **Admin boshqaruvi** | Foydalanuvchilar, keyslar, promo-kodlar to'liq CRUD |
| 12 | **Env-asoslangan konfiguratsiya** | Barcha URL/kalitlar muhit o'zgaruvchilarida |

### 9.2 Biznes yutuqlari

| # | Yutuq | Tavsif |
|---|-------|--------|
| 1 | **Bozorda birinchi** | O'zbekistonda tibbiy AI simulyator yo'q |
| 2 | **Skalanuvchi model** | Bepul → Pro → Klinika → Universitet pog'onalari |
| 3 | **B2B imkoniyat** | Klinika va universitetlar uchun korporativ litsenziya |
| 4 | **Promo + referal** | Marketing kampaniyalari uchun batch promo va referal |
| 5 | **Lokal til** | O'zbek tilidagi interfeys va AI javoblar |

---

## 10. OCHIQ VAZIFALAR VA YO'L XARITASI

> Quyidagi ro'yxat kodning **hozirgi haqiqiy holatiga** muvofiq. Avvalgi TZ'da "kamchilik" sifatida ko'rsatilgan ba'zi bandlar (hardcoded URL, mock-data, narx nomuvofiqligi) allaqachon **bartaraf etilgan**.

### 10.1 Ochiq vazifalar

| # | Vazifa | Ustuvorlik | Holat / Yechim |
|---|--------|-----------|----------------|
| 1 | **Avtomatik to'lov shlyuzi** | 🔴 Yuqori | Hozir to'lov manual. Payme/Click/Stripe integratsiyasi kerak |
| 2 | **Avtomatik test qoplami** | 🔴 Yuqori | Unit + integration testlar yo'q (Jest/Vitest + RTL tavsiya) |
| 3 | **Maxfiy kalitlar xavfsizligi** | 🔴 Yuqori | `backend/.env` git'da bo'lmasligini ta'minlash, kalitlarni rotatsiya |
| 4 | **i18n to'liq qo'llash** | 🟡 O'rta | Lug'at tayyor, lekin sahifalarda matn hali ko'p statik |
| 5 | **Bulutli fayl saqlash** | 🟡 O'rta | Lokal disk/`/tmp` o'rniga S3/Cloudinary (Vercelda `/tmp` vaqtinchalik) |
| 6 | **SSR/SEO optimizatsiya** | 🟢 Past | Aksariyat sahifalar `'use client'` — muhim sahifalarga SSR |
| 7 | **Karyera sahifasi dinamikasi** | 🟢 Past | Yo'nalish va yutuqlarni backenddan personallashtirish |
| 8 | **Monitoring/Analytics** | 🟢 Past | Xato monitoringi (Sentry) va analitika (Mixpanel/GA) |
| 9 | **CI/CD** | 🟢 Past | Avtomatik lint/test/build pipeline |

### 10.2 Bartaraf etilgan (avvalgi TZ kamchiliklari) ✅

| Avvalgi kamchilik | Hozirgi holat |
|-------------------|---------------|
| Hardcoded `localhost:5000` | ✅ `NEXT_PUBLIC_API_URL` env orqali (`lib/api.ts`) |
| `lib/mock-data.ts` ortiqcha | ✅ Olib tashlangan |
| Narx nomuvofiqligi | ✅ Yagona manba: `PLAN_PRICES` (backend) |
| Bo'sh `next.config.ts` | ✅ `output: 'standalone'` sozlangan |
| i18n umuman yo'q | ⚠️ Qisman: lug'at to'liq, qo'llash davom etmoqda |

### 10.3 Yo'l xaritasi

**1-navbat (1-2 hafta)**
1. Avtomatik to'lov (Payme/Click) integratsiyasi
2. Maxfiy kalitlar audit + rotatsiya, `.gitignore` tekshiruvi
3. Asosiy oqimlar uchun smoke testlar

**2-navbat (2-4 hafta)**
4. i18n'ni barcha sahifalarda to'liq qo'llash
5. Bulutli fayl saqlash migratsiyasi (S3/Cloudinary)
6. To'liq test qoplami (Vitest/Jest + RTL)

**3-navbat (1-2 oy)**
7. Muhim sahifalarga SSR/SEO
8. Karyera tizimini backendga bog'lash
9. Monitoring + analytics + CI/CD

---

## 11. TIZIM TALABLARI

### 11.1 Foydalanuvchi uchun

| Talab | Minimum |
|-------|---------|
| Brauzer | Chrome 90+, Firefox 88+, Safari 15+, Edge 90+ |
| Internet | 1 Mbps (video/3D uchun 5 Mbps) |
| Ekran | 320px minimum kenglik (responsive) |

### 11.2 Server uchun

| Talab | Tavsiya |
|-------|---------|
| Node.js | 20+ (loyiha 25.x da sinovdan o'tgan) |
| RAM | 1 GB minimum |
| Disk | 10 GB (media fayllar uchun) |
| MongoDB | Atlas (ishlab chiqarish uchun M10+) |

---

## 12. FOYDALANISHNI BOSHLASH

### 12.1 Muhit fayllari

```bash
# frontend
cp .env.example .env.local

# backend
cp backend/.env.example backend/.env
```

### 12.2 O'rnatish

```bash
npm install
npm --prefix backend install
```

### 12.3 Ishlab chiqish (dev)

```bash
npm run dev          # Frontend → http://localhost:3000
npm run dev:backend  # Backend  → http://localhost:5000
```

### 12.4 Build va ishlab chiqarish

```bash
npm run build:all    # Frontend + backend build
npm run start        # Frontend (yoki npm run start:standalone)
npm run start:backend
```

### 12.5 Boshlang'ich ma'lumotlar (Seed)

```bash
npm run seed         # Demo foydalanuvchilar + namunali keyslar
npm run wipe:cases   # Keys + urinishlarni tozalash
```

Yaratiladi:
- **Admin:** `admin` / `admin123`
- **Content Manager:** `manager` / `manager123`
- **Demo User:** `demouser` / `demo123`
- Namunali nashr qilingan klinik keyslar (turli kategoriya)

### 12.6 Health check

```
GET http://localhost:5000/api/health
```

---

## 13. XULOSA

**Med AI Simulator** — O'zbekiston tibbiyot ta'limida zamonaviy texnologiyalarni qo'llashga qaratilgan innovatsion loyiha. Sun'iy intellekt (baholash + chatbot), o'zbek nutq sintezi, 3D anatomiya simulyatori, tibbiy kutubxona va interaktiv klinik simulyatsiya orqali talabalar xavfsiz muhitda amaliy ko'nikmalar orttiradi.

Loyiha MVP'dan keng funksional platformaga o'sgan: asosiy o'quv oqimlari, geymifikatsiya (reyting), o'quv resurslari (kutubxona, kurslar) va obuna tizimi ishlamoqda. Keyingi bosqichdagi asosiy ustuvorliklar — **avtomatik to'lov integratsiyasi**, **test qoplami** va **maxfiy kalitlar xavfsizligi**.

---

*Hujjat oxiri | Med AI Simulator | TZ v2.0 | 2026-05-25*
