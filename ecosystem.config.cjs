// PM2 process file: `pm2 start ecosystem.config.cjs`
// Build first: cms → `npm run build`; web → `npm run build` (see docs/DEPLOYMENT.md).
module.exports = {
  apps: [
    {
      name: 'audit-cms',
      cwd: './cms',
      script: 'npm',
      args: 'run start',
      env: { NODE_ENV: 'production' },
    },
    {
      name: 'audit-web',
      cwd: './web',
      // Copies static assets into the standalone build, loads .env.local and starts server.js.
      script: 'scripts/start-standalone.mjs',
      env: { NODE_ENV: 'production', PORT: 3000, HOSTNAME: '0.0.0.0' },
    },
  ],
};
