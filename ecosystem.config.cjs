// PM2 process config. Backend va frontend alohida papkalarda — har biri
// mustaqil ishga tushadi. Ishga tushirish:
//   1) cd backend && npm install && npm run build
//   2) cd frontend && npm install && npm run build
//   3) pm2 start ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'med-ai-backend',
      cwd: './backend',
      script: 'dist/server.js',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
    },
    {
      name: 'med-ai-frontend',
      cwd: './frontend',
      script: '.next/standalone/server.js',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
}
