# 🐳 Docker Setup Complete - ShieldNest v1

**Status**: ✅ Ready for VPS Deployment  
**Date**: October 20, 2025  
**Container Port**: 3001 (external) → 3000 (internal)  
**Isolation**: Complete - Won't interfere with CoreDEX API or AI services

---

## 📦 Files Created

### Core Docker Files
```
shieldv1/
├── docker-compose.yml           ✅ Docker Compose configuration
├── .gitignore                   ✅ Git ignore (including .env)
├── env.docker.example           ✅ Environment variables template
├── update.sh                    ✅ Auto-update script
├── deploy-to-vps.sh            ✅ Automated deployment script
├── nginx-v1.conf               ✅ Nginx reverse proxy config
├── DOCKER-DEPLOYMENT.md        ✅ Complete deployment guide
└── shuieldnestorg/
    ├── Dockerfile              ✅ Multi-stage Docker build
    ├── .dockerignore          ✅ Docker ignore rules
    └── next.config.ts         ✅ Updated with standalone output
```

---

## 🚀 Quick Deploy to VPS

### Option 1: Automated Script (Recommended)

**On your VPS, run:**

```bash
# 1. Copy deploy-to-vps.sh to your VPS
scp deploy-to-vps.sh user@your-vps:/tmp/

# 2. SSH into VPS
ssh user@your-vps

# 3. Run the script
cd /tmp
chmod +x deploy-to-vps.sh
./deploy-to-vps.sh
```

The script will:
- ✅ Install Docker & Docker Compose
- ✅ Install Nginx
- ✅ Clone repository
- ✅ Set up environment file
- ✅ Configure Nginx
- ✅ Build and start container
- ✅ Optional: Set up SSL with Let's Encrypt
- ✅ Optional: Configure firewall

---

### Option 2: Manual Deployment

**Step-by-step:**

```bash
# 1. SSH into your VPS
ssh user@your-vps

# 2. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 3. Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. Clone repository
cd /var/www
sudo git clone https://github.com/ExegesisVentures/shieldv1.git
cd shieldv1
sudo chown -R $USER:$USER /var/www/shieldv1

# 5. Create .env file
cp env.docker.example .env
nano .env  # Add your credentials

# 6. Build and start
docker-compose up -d --build

# 7. Check status
docker-compose ps
docker-compose logs -f shieldnest-v1
```

---

## 🔐 Environment Variables Required

Edit `.env` on your VPS with these values:

```env
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Update.dev (REQUIRED)
NEXT_PUBLIC_UPDATE_PUBLISHABLE_KEY=pk_update_YOUR_KEY

# Admin
ADMIN_WALLET_ADDRESSES=core1mgvlgvh2hfw5pgdqc79up3du69v2z3t8qz4kwg,core1jcas459gnu857ylephjdjlea3rkr38m0asj6gw,core1ltltw0jya4hq39myd9798qqvu6jzy6zxalxhqu
ADMIN_EMAILS=nestd@pm.me
```

---

## 🌐 Nginx Setup

**Copy the config:**

```bash
sudo cp nginx-v1.conf /etc/nginx/sites-available/shieldnest-v1
sudo ln -s /etc/nginx/sites-available/shieldnest-v1 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**Get SSL Certificate:**

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d v1.shieldnest.org --email nestd@pm.me --agree-tos --non-interactive
```

---

## 🔧 DNS Configuration

**In your domain registrar (shieldnest.org):**

```
Type: A
Name: v1
Value: YOUR_VPS_IP_ADDRESS
TTL: 3600
```

---

## 📊 Docker Commands

### Basic Operations

```bash
# View running containers
docker ps

# View logs
docker-compose logs -f shieldnest-v1

# Restart container
docker-compose restart shieldnest-v1

# Stop container
docker-compose stop

# Start container
docker-compose start

# Rebuild and restart
docker-compose up -d --build
```

### Updates

```bash
# Use the update script (easiest)
cd /var/www/shieldv1
./update.sh

# Or manually
git pull origin main
docker-compose up -d --build
```

### Troubleshooting

```bash
# Check container status
docker-compose ps

# View last 100 log lines
docker-compose logs --tail=100 shieldnest-v1

# Enter container shell
docker exec -it shieldnest-v1 sh

# View resource usage
docker stats shieldnest-v1

# Restart from scratch
docker-compose down
docker-compose up -d --build

# Clean up old images
docker system prune -a
```

---

## 🔥 Port Layout on Your VPS

```
Port 8080  → CoreDEX API (existing)
Port 3001  → ShieldNest v1 (Docker - new)
Port 80    → Nginx (HTTP)
Port 443   → Nginx (HTTPS)
Port XXXX  → Your AI services
```

**All services are isolated and won't conflict!**

---

## ✅ Post-Deployment Checklist

After deployment, verify:

- [ ] Container is running: `docker-compose ps`
- [ ] Logs show no errors: `docker-compose logs shieldnest-v1`
- [ ] App responds locally: `curl http://localhost:3001`
- [ ] Nginx is configured: `sudo nginx -t`
- [ ] DNS resolves: `dig v1.shieldnest.org`
- [ ] SSL is active: `curl -I https://v1.shieldnest.org`
- [ ] App loads in browser: `https://v1.shieldnest.org`
- [ ] Supabase redirect URLs updated
- [ ] Update.dev allowed domains updated

---

## 🔒 External Services Configuration

### Supabase
Dashboard → Authentication → URL Configuration:
- Add: `https://v1.shieldnest.org` to Site URL
- Add: `https://v1.shieldnest.org/*` to Redirect URLs

### Update.dev
Dashboard → Settings → Allowed Domains:
- Add: `v1.shieldnest.org`

---

## 🎯 Architecture Benefits

### Complete Isolation
- ✅ Docker container = isolated environment
- ✅ Won't affect CoreDEX API
- ✅ Won't affect AI services
- ✅ Uses separate port (3001)

### Easy Management
- ✅ One command updates: `./update.sh`
- ✅ One command restart: `docker-compose restart shieldnest-v1`
- ✅ Logs in one place: `docker-compose logs -f`
- ✅ Auto-restart on crash

### Production Ready
- ✅ Multi-stage build (optimized)
- ✅ Non-root user (security)
- ✅ Health checks (monitoring)
- ✅ Log rotation (prevents disk fill)
- ✅ Resource limits (optional)

---

## 📱 Monitoring

### Check Health

```bash
# Container health
docker-compose ps

# Application logs
docker-compose logs -f shieldnest-v1

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Resource usage
docker stats shieldnest-v1
```

### Set Up Alerts (Optional)

You can add monitoring with:
- **Uptime Robot**: https://uptimerobot.com (free)
- **Better Uptime**: https://betteruptime.com (free tier)
- **Healthchecks.io**: https://healthchecks.io (free tier)

---

## 🆘 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs shieldnest-v1

# Check if port is in use
sudo lsof -i :3001

# Rebuild from scratch
docker-compose down
docker-compose up -d --build
```

### App Not Accessible

```bash
# Check if container is running
docker ps

# Check if Nginx is running
sudo systemctl status nginx

# Check if DNS resolves
dig v1.shieldnest.org

# Test locally on VPS
curl http://localhost:3001
```

### Environment Variables Not Working

```bash
# Verify .env file exists
ls -la /var/www/shieldv1/.env

# Check loaded variables
docker-compose config

# Restart after .env changes
docker-compose down
docker-compose up -d
```

---

## 📈 Performance Tips

### Resource Limits (Optional)

Add to `docker-compose.yml` under `shieldnest-v1` service:

```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 2G
    reservations:
      cpus: '1'
      memory: 1G
```

### Enable Nginx Caching (Optional)

Add to nginx config for static assets:

```nginx
location /_next/static/ {
    proxy_pass http://localhost:3001;
    proxy_cache_valid 200 60m;
    add_header Cache-Control "public, immutable";
}
```

---

## 🎉 Success!

Your ShieldNest v1 app is now:
- ✅ Running in Docker container
- ✅ Isolated from other services
- ✅ Accessible at https://v1.shieldnest.org
- ✅ Auto-restarting on failures
- ✅ Easy to update with `./update.sh`
- ✅ Production-ready with SSL

**Need help?** Check the logs or refer to `DOCKER-DEPLOYMENT.md` for detailed instructions.

---

**Deployment Date**: October 20, 2025  
**Version**: 1.0  
**Status**: Production Ready 🚀

