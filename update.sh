#!/bin/bash
set -e

echo "🔄 Updating ShieldNest v1..."

cd /var/www/shieldv1

# Pull latest code
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# Rebuild and restart container
echo "🐳 Rebuilding Docker container..."
docker-compose up -d --build

# Wait a moment for container to start
sleep 5

# Show status
echo ""
echo "📊 Container Status:"
docker-compose ps

echo ""
echo "✅ Update complete!"
echo ""
echo "📋 Useful commands:"
echo "  View logs:    docker-compose logs -f shieldnest-v1"
echo "  Check status: docker-compose ps"
echo "  Restart:      docker-compose restart shieldnest-v1"
echo "  Stop:         docker-compose stop"

