# Deployment Guide

This guide covers production deployment of Med AI Simulator.

## Prerequisites

- Node.js 20+
- MongoDB Atlas or self-hosted MongoDB 7+
- PM2 (for process management)
- Nginx (reverse proxy)
- SSL certificate

## Environment Setup

### Backend `.env`

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/medai
JWT_SECRET=your-very-strong-secret-key-here
CLIENT_ORIGINS=https://yourdomain.com
PORT=5000
NODE_ENV=production
```

### Frontend `.env.local`

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

## Build

```bash
# Backend
cd backend && npm install && npm run build

# Frontend
cd frontend && npm install && npm run build
```

## PM2 Process Management

```bash
# Start both services
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup

# Monitor
pm2 status
pm2 logs
pm2 monit
```

## Nginx Configuration

```nginx
# Frontend
server {
    listen 80;
        server_name yourdomain.com;
            return 301 https://$host$request_uri;
            }

            server {
                listen 443 ssl;
                    server_name yourdomain.com;

                        ssl_certificate /path/to/cert.pem;
                            ssl_certificate_key /path/to/key.pem;

                                location / {
                                        proxy_pass http://localhost:3000;
                                                proxy_set_header Host $host;
                                                        proxy_set_header X-Real-IP $remote_addr;
                                                            }
                                                            }

                                                            # Backend API
                                                            server {
                                                                listen 443 ssl;
                                                                    server_name api.yourdomain.com;

                                                                        location / {
                                                                                proxy_pass http://localhost:5000;
                                                                                        proxy_set_header Host $host;
                                                                                                proxy_set_header X-Real-IP $remote_addr;
                                                                                                    }
                                                                                                    }
                                                                                                    ```
                                                                                                    
                                                                                                    ## Vercel (Frontend Only)
                                                                                                    
                                                                                                    1. Import repo to Vercel
                                                                                                    2. Set **Root Directory** to `frontend`
                                                                                                    3. Add environment variables
                                                                                                    4. Deploy
                                                                                                    
                                                                                                    ## Health Check
                                                                                                    
                                                                                                    Verify deployment:
                                                                                                    
                                                                                                    ```bash
                                                                                                    curl https://api.yourdomain.com/api/health
                                                                                                    # Expected: {"status": "ok"}
                                                                                                    ```
                                                                                                    
                                                                                                    ## Troubleshooting
                                                                                                    
                                                                                                    - **CORS errors**: Check `CLIENT_ORIGINS` in backend `.env`
                                                                                                    - **DB connection**: Verify MongoDB URI and network access
                                                                                                    - **502 Bad Gateway**: Check PM2 process is running with `pm2 status`
                                                                                                    - **Static files missing**: Re-run seed script after deployment
