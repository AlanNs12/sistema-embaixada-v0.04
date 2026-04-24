// =============================================================
// PM2 Ecosystem — configuração lida do .env via dotenv
// Uso: pm2 start ecosystem.config.js --env production
// =============================================================

require('dotenv').config({ path: './backend/.env' })

module.exports = {
  apps: [
    {
      name: 'embassy-api',
      script: './backend/src/index.js',

      // PM2 passa essas env_production como process.env
      // mas os valores reais vêm do backend/.env via dotenv no index.js
      env_production: {
        NODE_ENV: 'production',
      },
      env_development: {
        NODE_ENV: 'development',
      },

      autorestart:          true,
      watch:                false,
      max_memory_restart:   '300M',
      kill_timeout:         3000,
      listen_timeout:       5000,

      // Logs em pasta controlada (sem caminhos absolutos hardcoded)
      out_file:        './scripts/logs/backend-out.log',
      error_file:      './scripts/logs/backend-error.log',
      log_date_format: 'DD/MM/YYYY HH:mm:ss',
      merge_logs:      true,
    },
  ],
}
