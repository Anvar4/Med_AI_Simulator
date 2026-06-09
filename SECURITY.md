# Security Policy

## Supported Versions

We actively maintain and provide security updates for the following versions of Med AI Simulator:

| Version | Supported |
|---------|-------------------|
| main    | Yes               |
| < 1.0   | No                |

## Reporting a Vulnerability

We take the security of Med AI Simulator seriously. If you believe you have found a security vulnerability, please report it to us as described below.

**Please do NOT report security vulnerabilities through public GitHub issues.**

### How to Report

Send an email to: **anvarkucharov4@gmail.com**

Please include the following information:

- Type of vulnerability (e.g., SQL injection, XSS, authentication bypass)
- Full path of the affected source file(s)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if available)
- Impact assessment — how an attacker might exploit this

### What to Expect

- **Acknowledgment**: You will receive a response within 48 hours confirming we received your report
- **Assessment**: We will investigate and assess the severity within 7 days
- **Resolution**: We aim to resolve critical vulnerabilities within 30 days
- **Disclosure**: We will coordinate with you on responsible disclosure timing

## Security Best Practices for Deployment

When deploying Med AI Simulator, please follow these security guidelines:

### Environment Variables

- Never commit `.env` files to version control
- Use strong, randomly generated values for `JWT_SECRET`
- Restrict `CLIENT_ORIGINS` to only trusted domains
- Rotate secrets regularly in production

### Database

- Use MongoDB Atlas with IP allowlisting in production
- Enable authentication on your MongoDB instance
- Use least-privilege database user accounts
- Enable encryption at rest

### Network

- Always use HTTPS in production
- Configure proper CORS settings via `CLIENT_ORIGINS`
- Use a reverse proxy (e.g., Nginx) in front of the Express server
- Enable rate limiting for API endpoints

### Authentication

- JWT tokens expire after a set period — configure appropriately
- Implement token refresh mechanisms for long sessions
- Log and monitor failed authentication attempts

## Known Security Considerations

- Patient data and medical records should be handled according to applicable privacy laws
- File uploads are stored in `backend/public/uploads/` — ensure proper access controls
- Seed data includes default admin credentials — **change these immediately in production**

---

Thank you for helping keep Med AI Simulator and its users safe.
