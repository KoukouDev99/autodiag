/**
 * PM2 Production Ecosystem Configuration - AutoDiag
 * https://pm2.keymetrics.io/docs/usage/application-declaration/
 */

module.exports = {
  apps: [
    {
      name: 'autodiag-backend',
      script: 'backend/src/index.js',
      instances: 'max', // Multi-core cluster mode
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '400M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/pm2-backend-error.log',
      out_file: './logs/pm2-backend-out.log',
      merge_logs: true,
      time: true,
      kill_timeout: 5000,
      listen_timeout: 8000
    }
  ]
};

