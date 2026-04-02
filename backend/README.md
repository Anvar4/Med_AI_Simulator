# Med AI Simulator — Backend (Demo)

Demo backend API for Medical AI Simulator platform.

> ⚠️ Bu backend hozircha demo rejimda. Frontend mock data bilan ishlaydi.

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **Auth:** JWT + bcrypt
- **Security:** Helmet, CORS, Rate Limiting

## Tuzilma

```
backend/
├── src/
│   ├── server.ts              # Entry point
│   ├── seed.ts                # Demo ma'lumotlarni yuklash
│   ├── models/
│   │   ├── User.ts            # Foydalanuvchi modeli
│   │   ├── Case.ts            # Tibbiy keys modeli
│   │   ├── CaseAttempt.ts     # Urinish modeli
│   │   └── index.ts
│   ├── controllers/
│   │   ├── authController.ts  # Register, Login, Profile
│   │   ├── caseController.ts  # CRUD keyslar
│   │   └── attemptController.ts # Urinishlar + Dashboard
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── cases.ts
│   │   └── attempts.ts
│   └── middleware/
│       ├── auth.ts            # JWT himoya
│       └── errorHandler.ts    # Global xato handler
├── package.json
├── tsconfig.json
└── .env
```

## O'rnatish

```bash
cd backend
npm install
```

## MongoDB

MongoDB localhost:27017 da ishlab turishi kerak. [MongoDB Community](https://www.mongodb.com/try/download/community) dan yuklab oling yoki Docker bilan:

```bash
docker run -d -p 27017:27017 --name med-ai-mongo mongo:7
```

## Ishga tushirish

```bash
# Demo ma'lumotlarni yuklash
npm run seed

# Development server
npm run dev

# Production build
npm run build
npm start
```

## API Endpoints

### Auth
| Method | Endpoint | Auth | Tavsif |
|--------|----------|------|--------|
| POST | `/api/auth/register` | ❌ | Ro'yxatdan o'tish |
| POST | `/api/auth/login` | ❌ | Kirish |
| GET | `/api/auth/me` | ✅ | Profil ma'lumotlari |
| PATCH | `/api/auth/me` | ✅ | Profilni tahrirlash |

### Cases (Keyslar)
| Method | Endpoint | Auth | Tavsif |
|--------|----------|------|--------|
| GET | `/api/cases` | ❌ | Barcha keyslar (filter, search, pagination) |
| GET | `/api/cases/categories` | ❌ | Kategoriyalar ro'yxati |
| GET | `/api/cases/:id` | ❌ | Bitta keys |
| POST | `/api/cases` | ✅ Admin/Instructor | Yangi keys yaratish |
| PATCH | `/api/cases/:id` | ✅ Admin/Instructor | Keysni tahrirlash |
| DELETE | `/api/cases/:id` | ✅ Admin | Keysni o'chirish |

### Attempts (Urinishlar)
| Method | Endpoint | Auth | Tavsif |
|--------|----------|------|--------|
| GET | `/api/attempts/dashboard` | ✅ | Dashboard statistikasi |
| GET | `/api/attempts/my` | ✅ | Mening urinishlarim |
| POST | `/api/attempts/start/:caseId` | ✅ | Keysni boshlash |
| POST | `/api/attempts/submit/:attemptId` | ✅ | Javobni topshirish |

### Query parametrlari (Cases)

```
GET /api/cases?category=Kardiologiya&type=diagnostika&difficulty=3&search=yurak&page=1&limit=12
```

## Demo hisoblar

| Role | Email | Parol |
|------|-------|-------|
| Student | demo@medai.uz | demo123456 |
| Admin | admin@medai.uz | admin123456 |
| Instructor | instructor@medai.uz | instructor123 |

## API namunalari

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@mail.com","password":"test123456"}'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@medai.uz","password":"demo123456"}'
```

### Cases ro'yxati
```bash
curl http://localhost:5000/api/cases
```

### Keys boshlash (auth kerak)
```bash
curl -X POST http://localhost:5000/api/attempts/start/case-001 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Javob topshirish
```bash
curl -X POST http://localhost:5000/api/attempts/submit/ATTEMPT_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "diagnosis": "Miokard infarkti",
    "treatment": "Aspirinni darhol berish",
    "selectedTests": ["EKG", "Troponin T"],
    "timeSpent": 320
  }'
```
