# Elika Vendor Portal - AWS Lightsail Deployment Guide

## Overview
This guide will help you deploy the Elika Vendor Portal to AWS Lightsail with a complete backend API and production-ready configuration.

## Architecture
- **Frontend**: React application served by Nginx
- **Backend**: Node.js/Express API server
- **Database**: Supabase (PostgreSQL)
- **File Storage**: Supabase Storage
- **Hosting**: AWS Lightsail
- **Process Management**: PM2
- **Reverse Proxy**: Nginx

## Prerequisites

1. **AWS Account** with Lightsail access
2. **Supabase Project** with the following:
   - Database tables set up
   - Storage buckets created
   - Service role key
3. **Domain name** (optional but recommended)

## Step 1: Create Lightsail Instance

### Option A: Using AWS Console
1. Go to [AWS Lightsail Console](https://lightsail.aws.amazon.com/)
2. Click "Create instance"
3. Choose "Linux/Unix" platform
4. Select "Ubuntu 20.04 LTS" blueprint
5. Choose instance plan (recommended: $10/month or higher)
6. Name your instance: `elika-vendor-portal`
7. Click "Create instance"

### Option B: Using AWS CLI
```bash
aws lightsail create-instances \
  --instance-names elika-vendor-portal \
  --availability-zone us-east-1a \
  --blueprint-id ubuntu_20_04 \
  --bundle-id small_2_0 \
  --key-pair-name elika-portal-key
```

## Step 2: Connect to Your Instance

1. Download the SSH key from Lightsail console
2. Connect via SSH:
```bash
ssh -i /path/to/your-key.pem ubuntu@YOUR_INSTANCE_IP
```

## Step 3: Upload Application Files

### Option A: Using SCP
```bash
# From your local machine
scp -i your-key.pem -r . ubuntu@YOUR_INSTANCE_IP:/home/ubuntu/elika-portal/
```

### Option B: Using Git
```bash
# On the instance
git clone https://github.com/your-repo/elika-vendor-portal.git /home/ubuntu/elika-portal
```

## Step 4: Run Setup Script

```bash
# Move to web directory
sudo mv /home/ubuntu/elika-portal /var/www/
sudo chown -R ubuntu:ubuntu /var/www/elika-portal

# Run setup script
cd /var/www/elika-portal
chmod +x lightsail-setup.sh
./lightsail-setup.sh
```

## Step 5: Configure Environment Variables

```bash
# Edit the environment file
sudo nano /var/www/elika-portal/server/.env

# Update with your actual values:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
FRONTEND_URL=https://your-domain.com
```

## Step 6: Restart Services

```bash
cd /var/www/elika-portal
pm2 restart elika-portal-backend
sudo systemctl restart nginx
```

## Step 7: Configure Domain (Optional)

### Create Static IP
```bash
aws lightsail allocate-static-ip --static-ip-name elika-portal-ip
aws lightsail attach-static-ip \
  --static-ip-name elika-portal-ip \
  --instance-name elika-vendor-portal
```

### Update DNS Records
Point your domain's A record to the static IP address.

### Setup SSL Certificate
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## Step 8: Verify Deployment

1. **Check application status**:
```bash
pm2 status
sudo systemctl status nginx
```

2. **Test endpoints**:
```bash
curl http://your-domain.com/health
curl http://your-domain.com/api/health
```

3. **Check logs**:
```bash
pm2 logs elika-portal-backend
sudo tail -f /var/log/nginx/access.log
```

## Maintenance Commands

### Deploy Updates
```bash
cd /var/www/elika-portal
./deploy.sh
```

### Create Backup
```bash
cd /var/www/elika-portal
./backup.sh
```

### Monitor Resources
```bash
# Check system resources
htop
df -h
free -h

# Check application logs
pm2 logs elika-portal-backend --lines 100
```

### Restart Services
```bash
# Restart backend only
pm2 restart elika-portal-backend

# Restart all services
pm2 restart all
sudo systemctl restart nginx
```

## Security Considerations

1. **Firewall**: Only ports 22, 80, and 443 are open
2. **Rate Limiting**: API endpoints are rate-limited
3. **Security Headers**: Nginx adds security headers
4. **File Upload Limits**: 10MB max file size
5. **HTTPS**: SSL certificate for secure connections

## Scaling Options

### Vertical Scaling
- Upgrade to a larger Lightsail instance
- Create snapshot before upgrading
- Restore from snapshot to new instance

### Horizontal Scaling
- Use Application Load Balancer
- Deploy multiple instances
- Consider moving to EC2 for advanced scaling

## Monitoring and Alerts

### CloudWatch Integration
```bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb
```

### Log Monitoring
- PM2 logs are automatically rotated
- Nginx logs are stored in `/var/log/nginx/`
- Application logs are in `/var/log/pm2/`

## Troubleshooting

### Common Issues

1. **502 Bad Gateway**: Backend not running
   - Check: `pm2 status`
   - Fix: `pm2 restart elika-portal-backend`

2. **File Upload Errors**: Check file size limits
   - Nginx: `client_max_body_size`
   - Backend: Multer configuration

3. **Database Connection Issues**: Check Supabase credentials
   - Verify `.env` file
   - Test connection: `curl http://localhost:3001/health`

4. **Memory Issues**: Monitor with `htop`
   - Consider upgrading instance size
   - Optimize PM2 configuration

### Support
For additional support, check the application logs and refer to the API documentation in `/src/api/endpoints.md`.