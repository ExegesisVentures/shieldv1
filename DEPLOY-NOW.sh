#!/bin/bash

# Emergency Deployment Script for ShieldNest v1
# This script deploys the React Error #310 fixes to production

set -e  # Exit on any error

echo "🚀 ShieldNest Emergency Deployment Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration - UPDATE THESE FOR YOUR SERVER
SERVER_USER="${DEPLOY_USER:-root}"
SERVER_HOST="${DEPLOY_HOST:-your-server-ip}"
SERVER_PATH="${DEPLOY_PATH:-/root/shieldv2}"
PM2_APP_NAME="${PM2_NAME:-shieldnest}"

echo -e "${YELLOW}📝 Configuration:${NC}"
echo "   Server: $SERVER_USER@$SERVER_HOST"
echo "   Path: $SERVER_PATH"
echo "   PM2 App: $PM2_APP_NAME"
echo ""

# Check if we have uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo -e "${RED}❌ You have uncommitted changes!${NC}"
    echo "   Please commit or stash your changes first."
    exit 1
fi

echo -e "${GREEN}✅ Git is clean${NC}"
echo ""

# Confirm deployment
echo -e "${YELLOW}⚠️  This will deploy to PRODUCTION!${NC}"
read -p "Are you sure you want to continue? (yes/no): " confirm

if [[ $confirm != "yes" ]]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo -e "${GREEN}🚀 Starting deployment...${NC}"
echo ""

# Step 1: Push to Git
echo "1️⃣  Pushing latest code to Git..."
git push origin main
echo -e "${GREEN}   ✅ Code pushed to Git${NC}"
echo ""

# Step 2: SSH and deploy
echo "2️⃣  Deploying to production server..."
ssh $SERVER_USER@$SERVER_HOST << 'ENDSSH'
set -e

echo "   📂 Navigating to project directory..."
cd /root/shieldv2 || { echo "❌ Project directory not found!"; exit 1; }

echo "   📥 Pulling latest code from Git..."
git pull origin main

echo "   📦 Installing dependencies (if needed)..."
npm install --production

echo "   🏗️  Building production bundle..."
npm run build

echo "   🔄 Restarting PM2 application..."
pm2 restart shieldnest || pm2 start npm --name "shieldnest" -- start

echo "   💾 Saving PM2 configuration..."
pm2 save

echo ""
echo "   ✅ Deployment completed successfully!"
ENDSSH

echo ""
echo -e "${GREEN}✅ DEPLOYMENT COMPLETE!${NC}"
echo ""
echo "🌐 Your site should now be updated at: https://v1.shieldnest.org"
echo ""
echo "🔍 Verification steps:"
echo "   1. Open https://v1.shieldnest.org/dashboard in browser"
echo "   2. Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)"
echo "   3. Check console - no React Error #310 should appear"
echo "   4. Test token hide/unhide functionality"
echo ""
echo "💡 If you still see errors:"
echo "   - Clear browser cache completely"
echo "   - Try in incognito/private mode"
echo "   - Check server logs: ssh $SERVER_USER@$SERVER_HOST 'pm2 logs $PM2_APP_NAME'"
echo ""

