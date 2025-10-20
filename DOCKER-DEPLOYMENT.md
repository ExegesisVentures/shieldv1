# ShieldNest v1 - Docker Deployment Guide

**Status**: Ready for VPS Deployment  
**Date**: October 20, 2025  
**Container Port**: 3001 (external) → 3000 (internal)

---

## 🚀 Quick Start on VPS

### 1. Install Docker (if not already installed)

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER

# Verify
docker --version
docker-compose --version
```

### 2. Clone Repository

```bash
cd /var/www
sudo git clone https://github.com/ExegesisVentures/shieldv1.git
cd shieldv1
sudo chown -R $USER:$USER /var/www/shieldv1
```

### 3. Create Environment File

```bash
# Copy example file
cp .env.example .env

# Edit with your actual values
nano .env
```

**Required environment variables:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_UPDATE_PUBLISHABLE_KEY`
- `ADMIN_WALLET_ADDRESSES`
- `ADMIN_EMAILS`

### 4. Build and Start

```bash
# Build and start container
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f shieldnest-v1
```

---

## 🔧 Nginx Configuration

Create/update `/etc/nginx/sites-available/shieldnest-v1`:

```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name v1.shieldnest.org;

    # SSL certificates (after running certbot)
    ssl_certificate /etc/letsencrypt/live/v1.shieldnest.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/v1.shieldnest.org/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    client_max_body_size 10M;
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/shieldnest-v1 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Get SSL Certificate

```bash
sudo certbot --nginx -d v1.shieldnest.org --email nestd@pm.me --agree-tos --non-interactive
```

---

## 📊 Docker Commands

### Container Management

```bash
# View running containers
docker ps

# View logs (live)
docker-compose logs -f shieldnest-v1

# View last 100 lines
docker-compose logs --tail=100 shieldnest-v1

# Restart container
docker-compose restart shieldnest-v1

# Stop container
docker-compose stop

# Start container
docker-compose start

# Stop and remove
docker-compose down
```

### Updates

```bash
# Use the update script
chmod +x update.sh
./update.sh

# Or manually:
git pull origin main
docker-compose up -d --build
```

### Troubleshooting

```bash
# Check container status
docker-compose ps

# Enter container shell
docker exec -it shieldnest-v1 sh

# View container resource usage
docker stats shieldnest-v1

# Check logs for errors
docker-compose logs shieldnest-v1 | grep -i error

# Restart from scratch
docker-compose down
docker-compose up -d --build
```

---

## 🔥 Port Configuration

Your VPS port layout:
- **Port 8080**: CoreDEX API (existing)
- **Port 3001**: ShieldNest v1 (Docker - new)
- **Port 80**: Nginx (HTTP)
- **Port 443**: Nginx (HTTPS)
- **Other ports**: Your AI services

All services are isolated and won't conflict!

---

## 🔒 Security Notes

1. **Environment Variables**: Never commit `.env` file to Git
2. **Firewall**: Only ports 80, 443, and 22 should be publicly accessible
3. **SSL**: Always use HTTPS in production
4. **Container Updates**: Regularly rebuild with latest base image

---

## ✅ Verification Checklist

After deployment:

- [ ] Container is running: `docker-compose ps`
- [ ] Logs show no errors: `docker-compose logs shieldnest-v1`
- [ ] App responds locally: `curl http://localhost:3001`
- [ ] Nginx is configured: `sudo nginx -t`
- [ ] SSL is active: `curl -I https://v1.shieldnest.org`
- [ ] DNS points to VPS: `dig v1.shieldnest.org`
- [ ] App loads in browser: Visit `https://v1.shieldnest.org`

---

## 📝 Files Created

```
shieldv1/
├── docker-compose.yml           # Docker Compose configuration
├── .env.example                 # Environment variables template
├── update.sh                    # Update script
├── DOCKER-DEPLOYMENT.md         # This file
└── shuieldnestorg/
    ├── Dockerfile               # Docker build instructions
    ├── .dockerignore           # Files to exclude from Docker
    └── next.config.ts          # Updated with standalone output
```

---

## 🎯 Benefits of This Setup

- ✅ **Isolated**: Doesn't interfere with CoreDEX API or AI services
- ✅ **Reproducible**: Same environment everywhere
- ✅ **Easy updates**: Just run `./update.sh`
- ✅ **Auto-restart**: Container restarts on crashes
- ✅ **Resource control**: Can limit CPU/RAM if needed
- ✅ **Portable**: Works on any Linux VPS with Docker

---

## 🆘 Support

If you encounter issues:

1. Check container logs: `docker-compose logs -f shieldnest-v1`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify environment variables: `docker-compose config`
4. Test locally: `curl http://localhost:3001`

---

**Ready to deploy!** 🚀

