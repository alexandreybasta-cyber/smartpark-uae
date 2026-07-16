#!/bin/bash
# ============================================================================
# SpotSense Server Setup Script
# ============================================================================
# Purpose: Set up nginx reverse proxy with Let's Encrypt SSL for SpotSense
# Server: 47.82.153.110
# Backend: FastAPI/uvicorn running on port 8001 via PM2
# Domain: api.spotsense.app (API backend only)
# Note:   spotsense.app is the Vercel website — NOT served from this server
# ============================================================================

set -e  # Exit on error

# ============================================================================
# CONFIGURATION - Edit these values if needed
# ============================================================================
SERVER_NAME="api.spotsense.app"
BACKEND_PORT="8002"
SERVER_IP="47.82.153.110"
EMAIL="admin@spotsense.app"  # Let's Encrypt notification email

# ============================================================================
# COLOR OUTPUT
# ============================================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ============================================================================
# PREFLIGHT CHECKS
# ============================================================================
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

check_dns() {
    log_warn "IMPORTANT: Before running this script, ensure DNS A-records are configured:"
    echo ""
    echo "  Type  | Name                 | Value"
    echo "  ------|----------------------|----------------"
    echo "  A     | api.spotsense.app   | $SERVER_IP"
    echo ""
    echo "  Note: spotsense.app points to Vercel (website) — do NOT point it here."
    echo ""
    echo "  DNS propagation can take 5-30 minutes. Verify with:"
    echo "    dig +short api.spotsense.app"
    echo ""
    read -p "Have you already pointed the DNS A-record to $SERVER_IP? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "Please configure DNS records first, then re-run this script."
        exit 1
    fi
}

# ============================================================================
# STEP 1: INSTALL NGINX AND CERTBOT
# ============================================================================
install_dependencies() {
    log_info "Checking and installing nginx and certbot..."
    
    # Update package list
    apt-get update -qq
    
    # Install nginx if not present
    if ! command -v nginx &> /dev/null; then
        log_info "Installing nginx..."
        apt-get install -y nginx
    else
        log_info "nginx already installed"
    fi
    
    # Install certbot and nginx plugin if not present
    if ! command -v certbot &> /dev/null; then
        log_info "Installing certbot and nginx plugin..."
        apt-get install -y certbot python3-certbot-nginx
    else
        log_info "certbot already installed"
    fi
    
    # Ensure nginx is running
    systemctl enable nginx
    systemctl start nginx
    
    log_info "Dependencies installed successfully"
}

# ============================================================================
# STEP 2: CREATE NGINX CONFIGURATION
# ============================================================================
create_nginx_config() {
    local CONFIG_PATH="/etc/nginx/sites-available/spotsense"
    
    log_info "Creating nginx configuration at $CONFIG_PATH..."
    
    # Check if config already exists
    if [[ -f "$CONFIG_PATH" ]]; then
        log_warn "Config already exists. Creating backup at ${CONFIG_PATH}.bak"
        cp "$CONFIG_PATH" "${CONFIG_PATH}.bak"
    fi
    
    cat > "$CONFIG_PATH" << NGINX_CONFIG
# ============================================================================
# SpotSense Nginx Configuration
# ============================================================================
# Domain: ${SERVER_NAME} (API backend)
# Note:   spotsense.app is the Vercel website — NOT served from this server
# Handles:
#   - HTTP to HTTPS redirect for ${SERVER_NAME}
#   - Reverse proxy to backend on port ${BACKEND_PORT}
#   - WebSocket upgrade support for /ws/ paths
# ============================================================================

# Rate limiting zone (optional, adjust as needed)
limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;

# ============================================================================
# HTTP -> HTTPS Redirect (${SERVER_NAME})
# ============================================================================
server {
    listen 80;
    listen [::]:80;
    server_name ${SERVER_NAME};

    # Let's Encrypt challenge path
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        allow all;
    }

    # Redirect all other HTTP traffic to HTTPS
    location / {
        return 301 https://\$host\$request_uri;
    }
}

# ============================================================================
# HTTPS Server Block - ${SERVER_NAME}
# ============================================================================
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${SERVER_NAME};

    # SSL Configuration (managed by certbot)
    # Note: These lines will be populated by certbot after certificate issuance
    # ssl_certificate /etc/letsencrypt/live/${SERVER_NAME}/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/${SERVER_NAME}/privkey.pem;
    # include /etc/letsencrypt/options-ssl-nginx.conf;
    # ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Temporary: Use self-signed cert until certbot runs (will be replaced)
    ssl_certificate /etc/nginx/ssl/selfsigned.crt;
    ssl_certificate_key /etc/nginx/ssl/selfsigned.key;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Logging
    access_log /var/log/nginx/spotsense_access.log;
    error_log /var/log/nginx/spotsense_error.log;

    # ========================================================================
    # WebSocket Support - /ws/ paths
    # ========================================================================
    location /ws/ {
        proxy_pass http://127.0.0.1:${BACKEND_PORT};
        
        # WebSocket upgrade headers
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Standard proxy headers
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # WebSocket-specific timeouts (24 hours)
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
        
        # Disable buffering for real-time WebSocket communication
        proxy_buffering off;
    }

    # ========================================================================
    # Reverse Proxy - All other requests to backend
    # ========================================================================
    location / {
        proxy_pass http://127.0.0.1:${BACKEND_PORT};
        
        # Standard proxy headers
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeouts for long-running API requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffering settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
}
NGINX_CONFIG

    log_info "nginx configuration created successfully"
}

# ============================================================================
# STEP 3: CREATE SELF-SIGNED CERTIFICATE (temporary)
# ============================================================================
create_self_signed_cert() {
    local SSL_DIR="/etc/nginx/ssl"
    
    if [[ -f "$SSL_DIR/selfsigned.crt" && -f "$SSL_DIR/selfsigned.key" ]]; then
        log_info "Self-signed certificate already exists, skipping..."
        return
    fi
    
    log_info "Creating temporary self-signed certificate..."
    mkdir -p "$SSL_DIR"
    
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$SSL_DIR/selfsigned.key" \
        -out "$SSL_DIR/selfsigned.crt" \
        -subj "/C=AE/ST=Dubai/L=Dubai/O=SpotSense/CN=${SERVER_NAME}" \
        2>/dev/null
    
    log_info "Self-signed certificate created at $SSL_DIR/"
}

# ============================================================================
# STEP 4: CREATE CERTBOT WEBROOT DIRECTORY
# ============================================================================
create_certbot_webroot() {
    local WEBROOT="/var/www/certbot"
    
    if [[ -d "$WEBROOT" ]]; then
        log_info "Certbot webroot already exists"
        return
    fi
    
    log_info "Creating certbot webroot directory..."
    mkdir -p "$WEBROOT"
    chown -R www-data:www-data "$WEBROOT"
}

# ============================================================================
# STEP 5: ENABLE SITE AND DISABLE DEFAULT
# ============================================================================
enable_site() {
    log_info "Enabling spotsense site and disabling default..."
    
    # Create symlink to enable site
    ln -sf /etc/nginx/sites-available/spotsense /etc/nginx/sites-enabled/spotsense
    
    # Disable default site
    rm -f /etc/nginx/sites-enabled/default
    
    # Test nginx configuration
    log_info "Testing nginx configuration..."
    nginx -t
    
    if [[ $? -ne 0 ]]; then
        log_error "nginx configuration test failed. Please check the config."
        exit 1
    fi
    
    # Reload nginx
    systemctl reload nginx
    
    log_info "Site enabled and nginx reloaded"
}

# ============================================================================
# STEP 6: OBTAIN LET'S ENCRYPT CERTIFICATES
# ============================================================================
obtain_certificates() {
    log_info "Obtaining Let's Encrypt certificates..."
    
    # Check if certificate already exists
    if [[ -d "/etc/letsencrypt/live/$SERVER_NAME" ]]; then
        log_info "Certificate for $SERVER_NAME already exists"
    else
        log_info "Requesting certificate for $SERVER_NAME..."
        certbot certonly \
            --webroot \
            --webroot-path=/var/www/certbot \
            --domain "$SERVER_NAME" \
            --email "$EMAIL" \
            --agree-tos \
            --non-interactive \
            --no-eff-email
    fi
    
    log_info "Certificate obtained successfully"
}

# ============================================================================
# STEP 7: UPDATE NGINX CONFIG WITH REAL CERTIFICATES
# ============================================================================
update_nginx_with_certs() {
    local CONFIG_PATH="/etc/nginx/sites-available/spotsense"
    
    log_info "Updating nginx configuration with Let's Encrypt certificates..."
    
    # Replace self-signed cert references with real certs
    sed -i "s|ssl_certificate /etc/nginx/ssl/selfsigned.crt;|ssl_certificate /etc/letsencrypt/live/$SERVER_NAME/fullchain.pem;|g" "$CONFIG_PATH"
    sed -i "s|ssl_certificate_key /etc/nginx/ssl/selfsigned.key;|ssl_certificate_key /etc/letsencrypt/live/$SERVER_NAME/privkey.pem;|g" "$CONFIG_PATH"
    
    # Add certbot-managed SSL options
    sed -i "/ssl_certificate_key \/etc\/letsencrypt\/live\/$SERVER_NAME\/privkey.pem;/a\\
    include /etc/letsencrypt/options-ssl-nginx.conf;\\
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;" "$CONFIG_PATH"
    
    # Test and reload nginx
    nginx -t
    systemctl reload nginx
    
    log_info "nginx updated with Let's Encrypt certificates"
}

# ============================================================================
# STEP 8: SETUP AUTO-RENEWAL CRON JOB
# ============================================================================
setup_auto_renewal() {
    log_info "Setting up certbot auto-renewal cron job..."
    
    # Check if cron job already exists
    if crontab -l 2>/dev/null | grep -q "certbot renew"; then
        log_info "Certbot renewal cron job already exists"
        return
    fi
    
    # Add cron job to run twice daily (certbot recommends this frequency)
    (crontab -l 2>/dev/null; echo "0 0,12 * * * /usr/bin/certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -
    
    log_info "Auto-renewal cron job configured (runs at midnight and noon daily)"
}

# ============================================================================
# STEP 9: VERIFY SETUP
# ============================================================================
verify_setup() {
    log_info "Verifying setup..."
    
    echo ""
    echo "=========================================="
    echo "  SpotSense Server Setup Complete!"
    echo "=========================================="
    echo ""
    echo "Domain configured:"
    echo "  - https://$SERVER_NAME"
    echo ""
    echo "Backend: http://127.0.0.1:$BACKEND_PORT"
    echo "WebSocket: wss://$SERVER_NAME/ws/spots"
    echo ""
    echo "Note: spotsense.app is the Vercel website (NOT this server)"
    echo ""
    echo "Certificate renewal: Automated via cron (twice daily)"
    echo ""
    echo "Useful commands:"
    echo "  - Test nginx config:    nginx -t"
    echo "  - Reload nginx:         systemctl reload nginx"
    echo "  - View nginx logs:      tail -f /var/log/nginx/spotsense_access.log"
    echo "  - Renew certs manually: certbot renew --dry-run"
    echo "  - Check cert expiry:    certbot certificates"
    echo ""
    echo "Next steps:"
    echo "  1. Verify the backend is running: curl http://localhost:$BACKEND_PORT/health"
    echo "  2. Test HTTPS access: curl https://$SERVER_NAME"
    echo "  3. Test WebSocket: Use browser DevTools or wscat"
    echo ""
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================
main() {
    echo ""
    echo "=========================================="
    echo "  SpotSense Server Setup Script"
    echo "  Server: $SERVER_IP"
    echo "  Domain: $SERVER_NAME"
    echo "=========================================="
    echo ""
    
    check_root
    check_dns
    
    install_dependencies
    create_certbot_webroot
    create_self_signed_cert
    create_nginx_config
    enable_site
    
    log_warn "About to obtain Let's Encrypt certificates."
    log_warn "This will fail if DNS is not properly configured."
    read -p "Continue with certificate issuance? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        obtain_certificates
        update_nginx_with_certs
        setup_auto_renewal
    else
        log_warn "Skipping certificate issuance. You can run certbot manually later."
    fi
    
    verify_setup
}

# Run main function
main
