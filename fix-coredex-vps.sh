#!/bin/bash
# CoreDEX VPS Diagnostic and Fix Script
# Run this on your VPS: ssh root@168.231.127.180

echo "==================================="
echo "CoreDEX VPS Diagnostic & Fix"
echo "==================================="
echo ""

# Step 1: Check Docker containers
echo "1. Checking Docker containers..."
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
echo ""

# Step 2: Test local API
echo "2. Testing API locally (port 8080)..."
if curl -s http://localhost:8080/api/healthz > /dev/null 2>&1; then
    echo "✅ API is responding on localhost:8080"
else
    echo "❌ API is NOT responding on localhost:8080"
    echo "   Checking if containers are running..."
    docker ps | grep -E "api-server|store|mysql"
fi
echo ""

# Step 3: Check if any containers are stopped
echo "3. Checking for stopped containers..."
STOPPED=$(docker ps -a --filter "status=exited" --format '{{.Names}}')
if [ -z "$STOPPED" ]; then
    echo "✅ No stopped containers"
else
    echo "⚠️  Found stopped containers:"
    echo "$STOPPED"
    echo ""
    echo "Restarting stopped containers..."
    docker start $STOPPED
fi
echo ""

# Step 4: Check nginx configuration
echo "4. Checking nginx configuration..."
if [ -f /etc/nginx/sites-enabled/coredexapi ]; then
    echo "✅ Nginx config exists"
    cat /etc/nginx/sites-enabled/coredexapi
else
    echo "❌ Nginx config NOT found - Creating it..."
    
    # Create nginx config
    cat > /etc/nginx/sites-available/coredexapi <<'EOF'
server {
    listen 80;
    server_name coredexapi.shieldnest.org;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name coredexapi.shieldnest.org;

    # SSL configuration (replace with your actual cert paths)
    ssl_certificate /etc/letsencrypt/live/coredexapi.shieldnest.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/coredexapi.shieldnest.org/privkey.pem;

    # API endpoint
    location /api {
        proxy_pass http://localhost:8080/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS' always;
        add_header Access-Control-Allow-Headers 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Network' always;
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }

    # WebSocket endpoint
    location /api/ws {
        proxy_pass http://localhost:8080/api/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

    # Enable the site
    ln -sf /etc/nginx/sites-available/coredexapi /etc/nginx/sites-enabled/coredexapi
    
    # Test nginx config
    nginx -t
    
    # Reload nginx
    systemctl reload nginx
    
    echo "✅ Nginx config created and reloaded"
fi
echo ""

# Step 5: Check SSL certificates
echo "5. Checking SSL certificates..."
if [ -f /etc/letsencrypt/live/coredexapi.shieldnest.org/fullchain.pem ]; then
    echo "✅ SSL certificate exists"
    openssl x509 -in /etc/letsencrypt/live/coredexapi.shieldnest.org/fullchain.pem -noout -dates
else
    echo "⚠️  SSL certificate NOT found"
    echo "   Run: certbot --nginx -d coredexapi.shieldnest.org"
fi
echo ""

# Step 6: Test API externally
echo "6. Testing API from external..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" https://coredexapi.shieldnest.org/api/healthz
echo ""

# Step 7: Check docker-compose
echo "7. Checking docker-compose setup..."
if [ -f docker-compose.yml ]; then
    echo "✅ docker-compose.yml found"
    docker-compose ps
else
    echo "⚠️  docker-compose.yml not found in current directory"
    echo "   Current directory: $(pwd)"
    echo "   Looking for it..."
    find / -name "docker-compose.yml" -type f 2>/dev/null | head -5
fi
echo ""

# Step 8: Check API CORS settings
echo "8. Checking API CORS configuration..."
docker logs api-server 2>&1 | tail -20
echo ""

echo "==================================="
echo "Diagnostic complete!"
echo "==================================="
echo ""
echo "Quick fixes:"
echo "1. Restart all containers: docker-compose restart"
echo "2. View API logs: docker logs api-server -f"
echo "3. Test local API: curl http://localhost:8080/api/healthz"
echo "4. Test remote API: curl https://coredexapi.shieldnest.org/api/healthz"

