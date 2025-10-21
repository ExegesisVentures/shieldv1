#!/bin/bash
# ShieldNest v1 - Run this script ON THE VPS
# Copy and paste this entire script into your VPS terminal

set -e

echo "🚀 Starting ShieldNest v1 Deployment"
echo "====================================="
echo ""

# Step 1: Install Docker
echo "📦 Step 1: Installing Docker..."
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    echo "✅ Docker installed"
else
    echo "✅ Docker already installed"
fi

# Step 2: Install Docker Compose
echo ""
echo "📦 Step 2: Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed"
else
    echo "✅ Docker Compose already installed"
fi

# Step 3: Install Nginx
echo ""
echo "📦 Step 3: Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    apt update -qq
    apt install -y nginx
    echo "✅ Nginx installed"
else
    echo "✅ Nginx already installed"
fi

# Step 4: Clone repository
echo ""
echo "📥 Step 4: Cloning repository..."
if [ -d "/var/www/shieldv1" ]; then
    echo "Repository exists, updating..."
    cd /var/www/shieldv1
    git fetch origin
    git reset --hard origin/main
    git pull origin main
else
    echo "Cloning repository..."
    mkdir -p /var/www
    cd /var/www
    git clone https://github.com/ExegesisVentures/shieldv1.git
fi

cd /var/www/shieldv1
echo "✅ Repository ready"

# Step 5: Create .env file
echo ""
echo "🔐 Step 5: Creating .env file..."
cat > .env << 'ENVFILE'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://yzzyyfrpumopzjydrhfj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6enl5ZnJwdW1vcHpqeWRyaGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMTk2ODAsImV4cCI6MjA3NTY5NTY4MH0.AcpC3BfiAeCnVnpWYGpccwoRRHijwK7HdimBfudE9vk
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6enl5ZnJwdW1vcHpqeWRyaGZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDExOTY4MCwiZXhwIjoyMDc1Njk1NjgwfQ.SeU0O3NRZGGsKZoKFXfVgbr0N8rrGktCxO_4L-6p56U

# Update.dev (optional - add later if needed)
NEXT_PUBLIC_UPDATE_PUBLISHABLE_KEY=pk_update_placeholder

# Admin Configuration
ADMIN_WALLET_ADDRESSES=core1mgvlgvh2hfw5pgdqc79up3du69v2z3t8qz4kwg,core1jcas459gnu857ylephjdjlea3rkr38m0asj6gw,core1ltltw0jya4hq39myd9798qqvu6jzy6zxalxhqu
ADMIN_EMAILS=nestd@pm.me
ENVFILE

echo "✅ .env file created"

# Step 6: Build and start Docker container
echo ""
echo "🐳 Step 6: Building and starting Docker container..."
echo "⏳ This may take 5-10 minutes..."

# Stop existing container if running
docker-compose down 2>/dev/null || true

# Build and start
docker-compose up -d --build

echo "⏳ Waiting for container to start..."
sleep 20

# Step 7: Check container status
echo ""
echo "📊 Container Status:"
docker-compose ps

# Step 8: Configure Nginx
echo ""
echo "🌐 Step 8: Configuring Nginx..."
cat > /etc/nginx/sites-available/shieldnest-v1 << 'NGINXCONFIG'
server {
    listen 80;
    server_name v1.shieldnest.org 168.231.127.180;

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
NGINXCONFIG

# Enable site
ln -sf /etc/nginx/sites-available/shieldnest-v1 /etc/nginx/sites-enabled/

# Test and reload Nginx
nginx -t && systemctl reload nginx

echo "✅ Nginx configured"

# Step 9: Configure firewall
echo ""
echo "🔥 Step 9: Configuring firewall..."
if command -v ufw &> /dev/null; then
    ufw allow 22/tcp 2>/dev/null || true
    ufw allow 80/tcp 2>/dev/null || true
    ufw allow 443/tcp 2>/dev/null || true
    ufw allow 3001/tcp 2>/dev/null || true
    echo "✅ Firewall configured"
else
    echo "⚠️  UFW not installed, skipping firewall configuration"
fi

# Step 10: Test the deployment
echo ""
echo "🧪 Step 10: Testing deployment..."
sleep 5
curl -I http://localhost:3001 2>/dev/null | head -n 1 || echo "⚠️ App may still be starting..."

echo ""
echo "============================================"
echo "✅ DEPLOYMENT COMPLETE!"
echo "============================================"
echo ""
echo "📊 Container logs (last 50 lines):"
docker-compose logs --tail=50 shieldnest-v1
echo ""
echo "🌐 Your app is accessible at:"
echo "   http://168.231.127.180:3001 (direct)"
echo "   http://168.231.127.180 (via Nginx)"
echo "   http://v1.shieldnest.org (once DNS is configured)"
echo ""
echo "📝 Useful commands:"
echo "   View logs:    docker-compose logs -f shieldnest-v1"
echo "   Restart:      docker-compose restart shieldnest-v1"
echo "   Stop:         docker-compose stop"
echo "   Rebuild:      docker-compose up -d --build"
echo ""
echo "⚠️  Next steps:"
echo "   1. Test: curl http://localhost:3001"
echo "   2. Configure DNS: Add A record for v1.shieldnest.org → 168.231.127.180"
echo "   3. Set up SSL: apt install certbot python3-certbot-nginx"
echo "                  certbot --nginx -d v1.shieldnest.org"
echo "   4. Update Supabase redirect URLs to include v1.shieldnest.org"
echo ""
echo "🎉 Deployment successful!"

