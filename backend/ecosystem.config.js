module.exports = {
  apps: [{
    name: 'elika-portal-backend',
    script: './server.js',
    cwd: '/var/www/elika-portal/Vendors-portal/backend',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/var/log/pm2/elika-portal-error.log',
    out_file: '/var/log/pm2/elika-portal-out.log',
    log_file: '/var/log/pm2/elika-portal.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};