# Contributing to Med AI Simulator

Thank you for your interest in contributing to **Med AI Simulator**! This document provides guidelines and steps for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)

## Code of Conduct

Please be respectful and considerate in all interactions. We aim to maintain a welcoming and inclusive community for everyone.

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally
3. **Install dependencies** for both frontend and backend
4. **Set up environment variables** (see README.md for details)
5. **Create a new branch** for your feature or fix

## Development Workflow

- Keep branches focused on a single feature or bug fix
- Write clear, descriptive commit messages
- Test your changes thoroughly before submitting a PR
- Keep your fork in sync with the upstream repository

### Branch Naming Convention

- `feature/` — new features
- `fix/` — bug fixes
- `docs/` — documentation updates
- `refactor/` — code refactoring
- `test/` — adding or updating tests

## Pull Request Process

1. Ensure your branch is up to date with `main`
2. Write a clear PR title and description explaining **what** and **why**
3. Link any related issues in the PR description
4. Request a review from the maintainer
5. Address any review feedback promptly

## Coding Standards

### General

- Use **TypeScript** strictly — avoid `any` types where possible
- Follow existing code style and formatting
- Keep functions small and focused
- Add comments for complex logic

### Frontend (Next.js)

- Use the App Router conventions
- Keep components in `frontend/components/`
- Use utility functions in `frontend/lib/`
- Follow responsive design principles

### Backend (Express)

- Keep controllers thin — business logic goes in services
- Validate all incoming request data
- Use proper HTTP status codes
- Handle errors gracefully

## Reporting Bugs

When reporting a bug, please include:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected vs actual behavior
- Your environment (OS, Node.js version, browser)
- Screenshots if applicable

## Feature Requests

We welcome feature ideas! Please open an issue with:

- A clear description of the feature
- The problem it solves
- Any implementation ideas you have

---

Thank you for helping make Med AI Simulator better!
