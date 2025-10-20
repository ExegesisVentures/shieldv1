#!/bin/bash
# ShieldNest v1 - VPS Deployment Script
# Run this script on your VPS to set up everything automatically

set -e

echo "🚀 ShieldNest v1 - VPS Deployment"
echo "=================================="
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo "❌ Please don't run this script as root. Run as your regular user."
   exit 1
fi

# Variables
INSTALL_DIR="/var/www/shieldv1"
DOMAIN="v1.shieldnest.org"
ADMIN_EMAIL="nestd@pm.me"

echo "📋 Configuration:"
echo "   Install directory: $INSTALL_DIR"
echo "   Domain: $DOMAIN"
echo "   Admin email: $ADMIN_EMAIL"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

# 1. Check for Docker
echo ""
echo "🐳 Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "✅ Docker installed"
else
    echo "✅ Docker already installed"
fi

# 2. Check for Docker Compose
echo ""
echo "🐳 Checking Docker Compose installation..."
if ! command -v docker-compose &> /dev/null; then
    echo "📦 Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed"
else
    echo "✅ Docker Compose already installed"
fi

# 3. Check for Nginx
echo ""
echo "🌐 Checking Nginx installation..."
if ! command -v nginx &> /dev/null; then
    echo "📦 Installing Nginx..."
    sudo apt update
    sudo apt install -y nginx
    echo "✅ Nginx installed"
else
    echo "✅ Nginx already installed"
fi

# 4. Clone repository if not exists
echo ""
echo "📥 Setting up repository..."
if [ ! -d "$INSTALL_DIR" ]; then
    echo "Cloning repository..."
    sudo mkdir -p /var/www
    cd /var/www
    sudo git clone https://github.com/ExegesisVentures/shieldv1.git
    sudo chown -R $USER:$USER $INSTALL_DIR
    echo "✅ Repository cloned"
else
    echo "Repository already exists, pulling latest..."
    cd $INSTALL_DIR
    git pull origin main
    echo "✅ Repository updated"
fi

# 5. Set up environment file
echo ""
echo "🔐 Setting up environment file..."
cd $INSTALL_DIR
if [ ! -f ".env" ]; then
    if [ -f "env.docker.example" ]; then
        cp env.docker.example .env
        echo "⚠️  .env file created from template"
        echo "⚠️  IMPORTANT: Edit .env and add your actual credentials!"
        echo ""
        read -p "Press Enter after you've edited .env with your credentials..."
    else
        echo "❌ env.docker.example not found. Please create .env manually."
        exit 1
    fi
else
    echo "✅ .env file already exists"
fi

# 6. Configure Nginx
echo ""
echo "🌐 Configuring Nginx..."
if [ -f "nginx-v1.conf" ]; then
    sudo cp nginx-v1.conf /etc/nginx/sites-available/shieldnest-v1
    sudo ln -sf /etc/nginx/sites-available/shieldnest-v1 /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl reload nginx
    echo "✅ Nginx configured"
else
    echo "❌ nginx-v1.conf not found"
fi

# 7. Build and start Docker container
echo ""
echo "🐳 Building and starting Docker container..."
cd $INSTALL_DIR
docker-compose up -d --build

# Wait for container to start
echo "⏳ Waiting for container to start..."
sleep 10

# 8. Check container status
echo ""
echo "📊 Container Status:"
docker-compose ps

# 9. Set up SSL with Certbot (optional)
echo ""
read -p "Do you want to set up SSL with Let's Encrypt? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if ! command -v certbot &> /dev/null; then
        echo "📦 Installing Certbot..."
        sudo apt install -y certbot python3-certbot-nginx
    fi
    echo "🔒 Setting up SSL certificate..."
    sudo certbot --nginx -d $DOMAIN --email $ADMIN_EMAIL --agree-tos --non-interactive --redirect || true
    echo "✅ SSL setup complete (or skipped if already exists)"
fi

# 10. Configure firewall
echo ""
read -p "Do you want to configure UFW firewall? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔥 Configuring firewall..."
    sudo ufw allow 22/tcp
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw --force enable
    echo "✅ Firewall configured"
fi

# 11. Make update script executable
echo ""
echo "📝 Setting up update script..."
if [ -f "update.sh" ]; then
    chmod +x update.sh
    echo "✅ update.sh is now executable"
fi

# Done!
echo ""
echo "============================================"
echo "✅ Deployment Complete!"
echo "============================================"
echo ""
echo "📊 Your ShieldNest v1 app is running!"
echo ""
echo "🌐 Access your app at:"
echo "   http://$DOMAIN (or https:// if SSL was configured)"
echo ""
echo "📋 Useful commands:"
echo "   View logs:        docker-compose logs -f shieldnest-v1"
echo "   Check status:     docker-compose ps"
echo "   Restart:          docker-compose restart shieldnest-v1"
echo "   Update app:       ./update.sh"
echo ""
echo "⚠️  Remember to:"
echo "   1. Verify .env has correct credentials"
echo "   2. Update DNS: Add A record for $DOMAIN → Your VPS IP"
echo "   3. Update Supabase redirect URLs"
echo "   4. Update Update.dev allowed domains"
echo ""
echo "🎉 Happy deploying!"

