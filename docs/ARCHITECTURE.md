┌─────────────────────────────────────────────┐││││└──────────────────┬──────────────────────────┘│┌──────────────────▼──────────────────────────┐│││││••│└──────────────────┬──────────────────────────┘│┌──────────────────▼──────────────────────────┐│││││••│└──────────────────┬──────────────────────────┘│┌───────────┴───────────┐││┌──────▼──────┐┌──────▼──────┐││││││││└─────────────┘└─────────────┘├──│├──│├──│├──│└──├──│├──│└──├──│├──│├──│└──└──├──├──├──├──├──├──└──# Architecture Overview

Med AI Simulator follows a monorepo structure with two independent services: **frontend** and **backend**.

## High-Level Architecture

The system consists of three layers:

1. **Client Layer** - Browser accessing the Next.js frontend
2. **Application Layer** - Next.js (port 3000) + Express.js (port 5000)
3. **Data Layer** - MongoDB (primary) + Redis (cache)

## Frontend Architecture

```
frontend/
+-- app/                    # Next.js App Router
|   +-- layout.tsx          # Root layout
|   +-- page.tsx            # Home page
|   +-- (auth)/             # Auth route group
|   +-- dashboard/          # Dashboard routes
+-- components/             # Reusable React components
|   +-- ui/                 # Base UI components
|   +-- features/           # Feature-specific components
+-- lib/                    # Utilities & helpers
|   +-- api.ts              # API client
|   +-- auth.ts             # Auth utilities
|   +-- theme.ts            # Theme configuration
+-- public/                 # Static assets
```

## Backend Architecture

```
backend/src/
+-- controllers/            # Request handlers (thin layer)
+-- services/               # Business logic
+-- models/                 # MongoDB/Mongoose models
+-- routes/                 # Express route definitions
+-- middleware/             # Auth, validation, error handling
+-- utils/                  # Helper functions
+-- server.ts               # Entry point
```

## Data Flow

1. User makes request via browser
2. Next.js frontend handles routing and SSR
3. API calls go to Express backend with JWT token
4. Controller validates request, delegates to service
5. Service applies business logic, queries MongoDB
6. Response returned as JSON to frontend

## Key Design Decisions

- **Monorepo**: Both services in one repo for easier development
- **Independent deployment**: Frontend and backend deploy separately
- **JWT stateless auth**: No server-side sessions needed
- **TypeScript everywhere**: Full type safety across the stack
- **Seed script**: Reproducible test data for development
- **PM2**: Process manager for production reliability
