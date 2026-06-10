# Architecture Overview

Med AI Simulator is a monorepo with two independent services.

## Layers

1. Client - Browser
2. Frontend - Next.js on port 3000
3. Backend - Express.js on port 5000
4. Database - MongoDB + Redis

## Frontend Structure

frontend/
- app/ - Next.js App Router routes
- components/ - Reusable React components
- lib/ - API client, auth, theme helpers
- public/ - Static assets

## Backend Structure

backend/src/
- controllers/ - Request handlers
- services/ - Business logic
- models/ - Mongoose schemas
- routes/ - API route definitions
- middleware/ - Auth, validation, errors
- server.ts - Entry point

## Request Flow

1. User opens browser
2. Next.js renders page
3. Frontend calls /api/* on Express backend
4. JWT token validates identity
5. Controller -> Service -> MongoDB
6. JSON response back to browser

## Design Principles

- Separation of concerns
- Independent deployability
- TypeScript for type safety
- Environment-based configuration
- Seed scripts for reproducible dev data
