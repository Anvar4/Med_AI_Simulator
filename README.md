# Med AI Simulator

Full-stack medical case simulation platform. Frontend va backend ikkita **mustaqil
papkada** — har birini alohida serverga/xizmatga yuklash mumkin.

- Frontend: Next.js (App Router) — `frontend/`
- Backend: Express + MongoDB — `backend/`

## Project Architecture

```text
med-ai-simulator/
|- frontend/            # Next.js app (mustaqil deploy)
|  |- app/              # Next.js routes
|  |- components/       # React UI
|  |- lib/             # API/auth/theme helpers
|  |- public/          # Static files
|  |- image/           # Patient/asset rasmlar (seed manbai)
|  |- package.json
|  |- next.config.ts
|  |- .env.example
|- backend/             # Express API (mustaqil deploy)
|  |- src/             # controllers / routes / models / services
|  |- public/uploads/  # Backend xizmat qiladigan statik fayllar (seed ko'chiradi)
|  |- package.json
|  |- .env.example
|- package.json         # Monorepo qulaylik skriptlari (ixtiyoriy)
|- ecosystem.config.cjs # PM2 (ikkala xizmat)
```

## Prerequisites

- Node.js 20+
- npm 10+
- MongoDB 7+ (local yoki Atlas)

## Environment Setup

```bash
# frontend
cp frontend/.env.example frontend/.env.local

# backend
cp backend/.env.example backend/.env
```

Majburiy qiymatlar:

- `backend/.env`: `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGINS` (vergul bilan)
- `frontend/.env.local`: `NEXT_PUBLIC_API_URL` (backend manzili, masalan `http://localhost:5000/api`)

## Install

Har bir papkani alohida:

```bash
cd frontend && npm install
cd ../backend && npm install
```

Yoki root'dan: `npm run install:all`

## Development

Ikki terminalda:

```bash
# Terminal 1 — backend
cd backend && npm run dev      # http://localhost:5000

# Terminal 2 — frontend
cd frontend && npm run dev     # http://localhost:3000
```

Root'dan: `npm run dev:backend` va `npm run dev:frontend`

## Seed (klinik holatlar + xodim hisoblari)

Backend papkasidan:

```bash
cd backend && npm run seed
```

> ⚠️ Seed `cases`, `caseattempts`, `categories` kolleksiyalarini **tozalaydi** va
> 133 ta klinik holat + 20 kategoriya + 2 xodim hisobini (admin, manager) qaytadan
> yozadi. Real foydalanuvchilar saqlanadi, lekin ularning urinishlari o'chadi.
> Bemor/tahlil rasmlari `frontend/`'dan `backend/public/uploads/`'ga ko'chiriladi.

## Build & Production

```bash
# Backend
cd backend && npm run build && npm run start    # node dist/server.js, PORT=5000

# Frontend (standalone)
cd frontend && npm run build && npm run start    # PORT=3000
```

### PM2 (ikkala xizmat birga)

```bash
cd backend && npm install && npm run build
cd ../frontend && npm install && npm run build
pm2 start ecosystem.config.cjs
pm2 save
```

### Vercel (faqat frontend)

Vercel loyihasida **Root Directory = `frontend`** qilib belgilang. Backendni
alohida xizmatda (VPS/Render/Railway) joylashtiring va `NEXT_PUBLIC_API_URL`'ni
o'sha manzilga yo'naltiring.

## Deployment eslatmalari

- Frontend `output: 'standalone'` (`frontend/next.config.ts`) — self-host Node uchun.
- Backend CORS `CLIENT_ORIGINS` orqali boshqariladi (frontend domeni shu yerga qo'shilsin).
- Backend statik fayllarni `backend/public/uploads/`'dan `/uploads`'da xizmat qiladi.

## Health Check

```text
GET /api/health
```
