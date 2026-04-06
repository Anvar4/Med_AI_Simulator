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
      cwd: '.',
      script: '.next/standalone/server.js',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
}
