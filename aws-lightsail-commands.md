# AWS Lightsail Deployment Commands

## Prerequisites
1. Install AWS CLI: `pip install awscli`
2. Configure AWS credentials: `aws configure`
3. Install Lightsail CLI plugin (optional)

## Create Lightsail Instance

```bash
# Create a new Lightsail instance
aws lightsail create-instances \
  --instance-names elika-vendor-portal \
  --availability-zone us-east-1a \
  --blueprint-id ubuntu_20_04 \
  --bundle-id nano_2_0 \
  --key-pair-name elika-portal-key \
  --tags key=Project,value=ElikaVendorPortal key=Environment,value=Production

# Wait for instance to be running
aws lightsail get-instance --instance-name elika-vendor-portal

# Get instance public IP
aws lightsail get-instance --instance-name elika-vendor-portal --query 'instance.publicIpAddress'
```

## Connect to Instance

```bash
# Download the SSH key (first time only)
aws lightsail download-default-key-pair --output text --query 'privateKeyBase64' | base64 --decode > elika-portal-key.pem
chmod 600 elika-portal-key.pem

# Connect via SSH
ssh -i elika-portal-key.pem ubuntu@YOUR_INSTANCE_IP
```

## Deploy Application

```bash
# On your local machine, copy files to the instance
scp -i elika-portal-key.pem -r . ubuntu@YOUR_INSTANCE_IP:/home/ubuntu/elika-portal/

# Connect to instance and run setup
ssh -i elika-portal-key.pem ubuntu@YOUR_INSTANCE_IP

# Move files to web directory
sudo mv /home/ubuntu/elika-portal /var/www/
sudo chown -R ubuntu:ubuntu /var/www/elika-portal

# Run the setup script
cd /var/www/elika-portal
chmod +x lightsail-setup.sh
./lightsail-setup.sh
```

## Configure Domain (Optional)

```bash
# Create a static IP
aws lightsail allocate-static-ip --static-ip-name elika-portal-static-ip

# Attach static IP to instance
aws lightsail attach-static-ip \
  --static-ip-name elika-portal-static-ip \
  --instance-name elika-vendor-portal

# Create DNS zone (if using Lightsail DNS)
aws lightsail create-domain --domain-name your-domain.com

# Create DNS records
aws lightsail create-domain-entry \
  --domain-name your-domain.com \
  --domain-entry name=@,type=A,target=YOUR_STATIC_IP

aws lightsail create-domain-entry \
  --domain-name your-domain.com \
  --domain-entry name=www,type=A,target=YOUR_STATIC_IP
```

## SSL Certificate Setup

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal (already set up by certbot)
sudo systemctl status certbot.timer
```

## Monitoring and Maintenance

```bash
# Check application status
pm2 status
pm2 logs elika-portal-backend

# Check Nginx status
sudo systemctl status nginx

# Check system resources
htop
df -h
free -h

# View application logs
tail -f /var/log/pm2/elika-portal.log

# Restart services
pm2 restart elika-portal-backend
sudo systemctl restart nginx
```

## Backup Commands

```bash
# Create manual backup
cd /var/www/elika-portal && ./backup.sh

# Setup automated backups (cron)
crontab -e
# Add this line for daily backups at 2 AM:
# 0 2 * * * /var/www/elika-portal/backup.sh

# List backups
ls -la /var/backups/elika-portal/
```

## Scaling Options

```bash
# Upgrade instance size
aws lightsail create-instance-snapshot \
  --instance-name elika-vendor-portal \
  --instance-snapshot-name elika-portal-snapshot-$(date +%Y%m%d)

# Create larger instance from snapshot
aws lightsail create-instances-from-snapshot \
  --instance-names elika-vendor-portal-large \
  --availability-zone us-east-1a \
  --instance-snapshot-name elika-portal-snapshot-YYYYMMDD \
  --bundle-id small_2_0
```

## Troubleshooting

```bash
# Check if services are running
sudo systemctl status nginx
pm2 status

# Check logs for errors
sudo tail -f /var/log/nginx/error.log
pm2 logs elika-portal-backend --lines 50

# Check disk space
df -h

# Check memory usage
free -h

# Restart all services
pm2 restart all
sudo systemctl restart nginx

# Check firewall status
sudo ufw status

# Test API endpoints
curl http://localhost:3001/health
curl http://localhost/api/health
```