#!/bin/bash

# AWS Lightsail Setup Script for Elika Vendor Portal
# This script sets up a Lightsail instance with Node.js and deploys the application

set -e

echo "🚀 Setting up Elika Vendor Portal on AWS Lightsail..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install Nginx for reverse proxy
echo "📦 Installing Nginx..."
sudo apt install -y nginx

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /var/www/elika-portal
sudo chown -R $USER:$USER /var/www/elika-portal

# Clone or copy application files (you'll need to modify this based on your deployment method)
echo "📥 Setting up application files..."
cd /var/www/elika-portal

# Install dependencies
echo "📦 Installing application dependencies..."
npm install

# Build frontend
echo "🏗️ Building frontend..."
npm run build

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd server
npm install
cd ..

# Create environment file
echo "⚙️ Creating environment configuration..."
sudo tee /var/www/elika-portal/server/.env > /dev/null <<EOF
# Production Environment Configuration
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://$(curl -s http://169.254.169.254/latest/meta-data/public-hostname)

# Supabase Configuration (replace with your actual values)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Add other environment variables as needed
EOF

echo "⚠️  IMPORTANT: Please update the .env file with your actual Supabase credentials!"

# Configure Nginx
echo "🌐 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/elika-portal > /dev/null <<EOF
server {
    listen 80;
    server_name _;

    # Frontend (React app)
    location / {
        root /var/www/elika-portal/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Increase timeout for file uploads
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3001;
        access_log off;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /var/www/elika-portal/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/elika-portal /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Create PM2 ecosystem file
echo "⚙️ Creating PM2 configuration..."
tee /var/www/elika-portal/ecosystem.config.js > /dev/null <<EOF
module.exports = {
  apps: [{
    name: 'elika-portal-backend',
    script: './server/index.js',
    cwd: '/var/www/elika-portal',
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
EOF

# Create log directory
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2

# Start the application with PM2
echo "🚀 Starting application with PM2..."
cd /var/www/elika-portal
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Start and enable services
echo "🔧 Starting services..."
sudo systemctl restart nginx
sudo systemctl enable nginx

# Configure firewall
echo "🔒 Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Create deployment script
echo "📝 Creating deployment script..."
tee /var/www/elika-portal/deploy.sh > /dev/null <<'EOF'
#!/bin/bash

# Deployment script for Elika Vendor Portal
set -e

echo "🚀 Starting deployment..."

# Pull latest changes (if using git)
# git pull origin main

# Install/update dependencies
echo "📦 Installing dependencies..."
npm install --production

# Build frontend
echo "🏗️ Building frontend..."
npm run build

# Install backend dependencies
cd server
npm install --production
cd ..

# Restart backend with PM2
echo "🔄 Restarting backend..."
pm2 restart elika-portal-backend

# Reload Nginx
echo "🔄 Reloading Nginx..."
sudo systemctl reload nginx

echo "✅ Deployment completed successfully!"
echo "🌐 Application is available at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-hostname)"
EOF

chmod +x /var/www/elika-portal/deploy.sh

# Create backup script
echo "💾 Creating backup script..."
tee /var/www/elika-portal/backup.sh > /dev/null <<'EOF'
#!/bin/bash

# Backup script for Elika Vendor Portal
BACKUP_DIR="/var/backups/elika-portal"
DATE=$(date +%Y%m%d_%H%M%S)

echo "💾 Creating backup..."

# Create backup directory
sudo mkdir -p $BACKUP_DIR

# Backup application files
sudo tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz /var/www/elika-portal

# Backup PM2 configuration
pm2 save

echo "✅ Backup completed: $BACKUP_DIR/app_backup_$DATE.tar.gz"
EOF

chmod +x /var/www/elika-portal/backup.sh

# Setup log rotation
echo "📋 Setting up log rotation..."
sudo tee /etc/logrotate.d/elika-portal > /dev/null <<EOF
/var/log/pm2/*.log {
    daily
    missingok
    rotate 14
    compress
    notifempty
    create 0644 $USER $USER
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

echo "✅ Setup completed successfully!"
echo ""
echo "🎉 Your Elika Vendor Portal is now running on AWS Lightsail!"
echo ""
echo "📋 Next steps:"
echo "1. Update the .env file with your Supabase credentials:"
echo "   sudo nano /var/www/elika-portal/server/.env"
echo ""
echo "2. Restart the application:"
echo "   cd /var/www/elika-portal && pm2 restart elika-portal-backend"
echo ""
echo "3. Check application status:"
echo "   pm2 status"
echo "   pm2 logs elika-portal-backend"
echo ""
echo "4. Your application is available at:"
echo "   http://$(curl -s http://169.254.169.254/latest/meta-data/public-hostname)"
echo ""
echo "5. To deploy updates, run:"
echo "   cd /var/www/elika-portal && ./deploy.sh"
echo ""
echo "6. To create backups, run:"
echo "   cd /var/www/elika-portal && ./backup.sh"