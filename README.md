# Med AI Simulator

Full-stack medical case simulation platform.

- Frontend: Next.js (App Router) in workspace root
- Backend: Express + MongoDB in `backend/`

## Project Architecture

```text
med-ai-simulator/
|- app/                 # Next.js routes
|- components/          # Shared React UI
|- lib/                 # Frontend API/auth/theme helpers
|- public/              # Static files + uploads mirror
|- backend/             # Express API (controllers/routes/models)
|  |- src/
|  |- .env.example
|- .env.example         # Frontend env template
|- package.json         # Frontend + monorepo helper scripts
```

## Prerequisites

- Node.js 20+
- npm 10+
- MongoDB 7+ (local or remote)

## Environment Setup

Create environment files from examples:

```bash
# frontend
cp .env.example .env.local

# backend
cp backend/.env.example backend/.env
```

Required values to set:

- `backend/.env`:
	- `MONGODB_URI`
	- `JWT_SECRET`
	- `CLIENT_ORIGINS` (comma-separated)
- `.env.local`:
	- `NEXT_PUBLIC_API_URL`
	- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (optional)

## Install

```bash
npm install
npm --prefix backend install
```

## Development

Run frontend:

```bash
npm run dev
```

Run backend (second terminal):

```bash
npm run dev:backend
```

## Build and Run (Production)

Build both apps:

```bash
npm run build:all
```

Start frontend:

```bash
npm run start
```

Start backend:

```bash
npm run start:backend
```

## Useful Scripts

- `npm run dev` - Next.js frontend dev server
- `npm run dev:backend` - backend dev server
- `npm run build` - frontend build only
- `npm run build:all` - frontend + backend build
- `npm run seed` - seed backend demo data
- `npm run wipe:cases` - clear case + attempt data

## Server Deployment Notes

- Frontend now uses `output: 'standalone'` in `next.config.ts`, suitable for self-hosted Node deployment.
- Backend CORS is environment-driven via `CLIENT_ORIGINS`.
- Keep frontend and backend as separate services/processes in production (systemd, PM2, Docker, or platform services).

### PM2 Quick Deploy

```bash
# 1) Build artifacts
npm run build:all

# 2) Start both services with PM2
pm2 start ecosystem.config.cjs

# 3) Persist PM2 process list
pm2 save
```

The PM2 config file is located at `ecosystem.config.cjs`.

## Health Check

Backend health endpoint:

```text
GET /api/health
```
