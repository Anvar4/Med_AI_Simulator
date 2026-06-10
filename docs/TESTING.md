# Testing Guide

This document outlines testing strategies for Med AI Simulator.

## Testing Stack

- **Backend**: Jest + Supertest for API testing
- **Frontend**: Jest + React Testing Library
- **E2E**: Playwright (planned)

## Running Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## Backend Testing

### Unit Tests

Test individual services and utilities:

```typescript
// services/case.service.test.ts
describe('CaseService', () => {
  it('should return all cases', async () => {
      const cases = await CaseService.getAll();
          expect(cases).toBeInstanceOf(Array);
            });
            });
            ```

            ### Integration Tests

            Test API endpoints with Supertest:

            ```typescript
            // routes/auth.test.ts
            describe('POST /api/auth/login', () => {
              it('should return JWT token on valid credentials', async () => {
                  const res = await request(app)
                        .post('/api/auth/login')
                              .send({ email: 'admin@test.com', password: 'password' });
                                  expect(res.status).toBe(200);
                                      expect(res.body.token).toBeDefined();
                                        });
                                        });
                                        ```

                                        ## Frontend Testing

                                        ### Component Tests

                                        ```typescript
                                        // components/LoginForm.test.tsx
                                        import { render, screen } from '@testing-library/react';

                                        test('renders login form', () => {
                                          render(<LoginForm />);
                                            expect(screen.getByLabelText('Email')).toBeInTheDocument();
                                              expect(screen.getByLabelText('Password')).toBeInTheDocument();
                                              });
                                              ```

                                              ## Test Coverage Goals

                                              - Services: > 80%
                                              - Controllers: > 70%
                                              - Utilities: > 90%

                                              ## CI/CD Integration

                                              Tests run automatically on every pull request via GitHub Actions.
