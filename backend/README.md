# Med AI Simulator Backend

Express + TypeScript API for Med AI Simulator.

## Stack

- Node.js + TypeScript
- Express + Mongoose (MongoDB)
- JWT auth
- Helmet + CORS + Rate Limit

## Folder Structure

```text
backend/
|- src/
|  |- server.ts
|  |- seed.ts
|  |- controllers/
|  |- routes/
|  |- models/
|  |- middleware/
|  |- services/
|- .env.example
|- package.json
|- tsconfig.json
```

## Environment

Copy template:

```bash
cp .env.example .env
```

Minimum required:

- `MONGODB_URI`
- `JWT_SECRET`

Recommended for deployment:

- `CLIENT_ORIGINS` (comma-separated trusted frontend origins)
- `NODE_ENV=production`
- `PORT`

Optional integrations:

- `OPENAI_API_KEY`, `OPENAI_MODEL`
- `GOOGLE_CLIENT_ID`
- `GMAIL_USER`, `GMAIL_APP_PASSWORD`
- `AISHA_API_KEY`

## Run

```bash
# install
npm install

# dev
npm run dev

# build + run
npm run build
npm run start
```

## Seed and Cleanup

```bash
# seed demo data
npm run seed

# remove all cases + attempts
npm run wipe:cases -- --yes
```

## Deployment Notes

- API serves uploads from `/uploads`.
- CORS allow-list is read from `CLIENT_ORIGINS`.
- `trust proxy` is enabled for reverse-proxy deployments.
- Health check endpoint:

```text
GET /api/health
```
