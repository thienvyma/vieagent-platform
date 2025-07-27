module.exports = {
  apps: [
    {
      name: 'ai-agent-platform',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/app-error.log',
      out_file: './logs/app-out.log',
      log_file: './logs/app-combined.log',
      time: true,
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'monitoring',
      script: './scripts/monitor-free-tier.js',
      cron_restart: '*/5 * * * *',
      autorestart: false,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/monitoring-error.log',
      out_file: './logs/monitoring-out.log',
      log_file: './logs/monitoring-combined.log',
      time: true
    },
    {
      name: 'backup',
      script: './scripts/backup-free-tier.js',
      cron_restart: '0 2 * * *',
      autorestart: false,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/backup-error.log',
      out_file: './logs/backup-out.log',
      log_file: './logs/backup-combined.log',
      time: true
    }
  ]
}; 