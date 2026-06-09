# Changelog

All notable changes to Med AI Simulator will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- CONTRIBUTING.md with full contribution guidelines
- SECURITY.md with vulnerability reporting policy
- CHANGELOG.md for tracking project changes

## [0.3.0] - 2026-06-09

### Added
- Security and courses feature branch
- CORS fix for medaisimulator.uz production domain
- PM2 ecosystem configuration for production deployment
- Standalone Next.js output for self-hosted deployment

### Fixed
- CORS headers for cross-origin API requests
- Production environment variable handling

## [0.2.0] - 2026-05-09

### Added
- Full-stack medical case simulation platform
- Frontend: Next.js App Router with TypeScript
- Backend: Express.js REST API with MongoDB
- JWT-based authentication system
- Admin and manager role support
- 133 clinical cases with 20 categories via seed script
- Patient image management system
- Redis integration for caching
- Firebase integration
- Prisma ORM support

### Changed
- Monorepo structure with independent frontend/backend deployment
- Migrated to TypeScript throughout

## [0.1.0] - 2026-04-01

### Added
- Initial project setup
- Basic Express server
- MongoDB connection
- Next.js frontend scaffold
- Environment variable configuration
- Basic authentication flow

---

## Legend

- **Added** - new features
- **Changed** - changes to existing functionality
- **Deprecated** - soon-to-be removed features
- **Removed** - removed features
- **Fixed** - bug fixes
- **Security** - security-related fixes
