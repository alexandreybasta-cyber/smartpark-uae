# SpotSense Cloudflare Setup Guide

This guide explains how to set up Cloudflare as a reverse proxy and SSL provider for SpotSense, eliminating the need for Let's Encrypt or nginx SSL configuration on the server itself.

## Overview

With Cloudflare:
- **No certbot needed** - Cloudflare handles SSL termination
- **No nginx SSL config needed** - Cloudflare proxies to your server over HTTP or HTTPS
- **Free DDoS protection** and CDN included
- **Automatic SSL certificate management**

## Server Details

> **Replace these values with your actual server configuration:**

- **Public IP:** `47.82.153.110` *(your server's public IP)*
- **Backend Port:** `8002` *(your backend's port)*
- **API Domain:** `api.spotsense.app` *(your API subdomain)*
- **Website Domain:** `spotsense.app` *(your website domain — Vercel, NOT this server)*

---

## Step 1: Sign Up for Cloudflare

1. Go to [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)
2. Create a free account (no credit card required)
3. Verify your email address

---

## Step 2: Add Your Domain to Cloudflare

1. Click **"Add a Site"** in the Cloudflare dashboard
2. Enter your domain: `spotsense.app`
3. Select the **Free plan** and click Continue
4. Cloudflare will scan your existing DNS records

---

## Step 3: Configure DNS Records

In the Cloudflare DNS settings, add these records:

### For API Subdomain (api.spotsense.app) — points to backend server

| Type  | Name | Content       | Proxy Status | TTL  |
|-------|------|---------------|--------------|------|
| A     | `api` | `47.82.153.110` | **Proxied** (orange cloud) | Auto |

### For Website (spotsense.app) — points to Vercel (NOT this server)

| Type  | Name | Content       | Proxy Status | TTL  |
|-------|------|---------------|--------------|------|
| CNAME | `@`  | `cname.vercel-dns.com` | **Proxied** (orange cloud) | Auto |
| CNAME | `www` | `cname.vercel-dns.com` | **Proxied** (orange cloud) | Auto |

### Important DNS Settings

- **Proxy Status:** Must be **Proxied** (orange cloud icon) for SSL and protection
- **If gray cloud (DNS only):** No SSL or protection - traffic goes directly to server

---

## Step 4: Update Domain Registrar Nameservers

1. Cloudflare will provide two nameservers, e.g.:
   - `adam.ns.cloudflare.com`
   - `bella.ns.cloudflare.com`

2. Log in to your domain registrar (where you bought `spotsense.app`)

3. Replace the existing nameservers with Cloudflare's nameservers

4. **Wait for propagation** (usually 5-30 minutes, can take up to 24 hours)

---

## Step 5: Configure SSL/TLS Settings

1. In Cloudflare dashboard, go to **SSL/TLS** → **Overview**

2. Set **SSL/TLS encryption mode** to: **Full (Strict)**
   - This encrypts traffic between Cloudflare and your server
   - Requires a valid SSL certificate on your server (self-signed works)

3. Go to **SSL/TLS** → **Edge Certificates**
   - Enable **Always Use HTTPS**
   - Enable **Automatic HTTPS Rewrites**
   - Enable **Minimum TLS Version: TLS 1.2**

---

## Step 6: Configure Server (Backend)

Since Cloudflare handles SSL, your server setup is simpler:

### Option A: Run Backend Directly (No nginx)

Your FastAPI backend on port 8002 can accept connections directly:

```bash
# Backend is already running via PM2 on port 8002
# Cloudflare will proxy to http://47.82.153.110:8002
```

**Firewall Configuration:**
```bash
# Allow Cloudflare IPs only (more secure)
# Get Cloudflare IP ranges from: https://www.cloudflare.com/ips/

# Or allow all traffic on port 8002 (simpler)
ufw allow 8002/tcp
```

### Option B: Use nginx as Reverse Proxy (Recommended)

Even with Cloudflare, nginx adds a layer of control:

```nginx
# /etc/nginx/sites-available/spotsense

server {
    listen 80;
    server_name api.spotsense.app;

    # Only allow Cloudflare IPs (optional, more secure)
    # include /etc/nginx/cloudflare-allow.conf;
    # deny all;

    location /ws/ {
        proxy_pass http://127.0.0.1:8002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
        proxy_buffering off;
    }

    location / {
        proxy_pass http://127.0.0.1:8002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Note:** With Cloudflare proxy enabled, no SSL certificates needed on the server when using "Flexible" SSL mode. For "Full (Strict)", use a self-signed cert or Cloudflare Origin Certificate.

---

## Step 7: Generate Cloudflare Origin Certificate (Optional, for Full Strict)

If using **Full (Strict)** SSL mode:

1. Go to **SSL/TLS** → **Origin Server**
2. Click **Create Certificate**
3. Use default settings (RSA, 15 years validity)
4. Download the certificate and private key
5. Install on your server:

```bash
# Save certificate
sudo nano /etc/nginx/ssl/cloudflare-origin.crt

# Save private key
sudo nano /etc/nginx/ssl/cloudflare-origin.key

# Set permissions
sudo chmod 600 /etc/nginx/ssl/cloudflare-origin.key
```

6. Update nginx config to use the Origin Certificate

---

## Step 8: Test the Setup

### Verify DNS Propagation
```bash
dig +short api.spotsense.app
# Should show Cloudflare IPs (e.g., 104.21.x.x)
```

### Test HTTPS Access
```bash
curl -I https://api.spotsense.app
# Should return 200 OK with Cloudflare headers
```

### Test WebSocket
```bash
# Use browser DevTools or wscat
wscat -c wss://api.spotsense.app/ws/spots
```

### Check SSL Certificate
```bash
curl -vI https://api.spotsense.app 2>&1 | grep -E "(SSL|issuer|subject)"
# Should show Cloudflare certificate
```

---

## Step 9: Recommended Cloudflare Settings

### Security Settings
- **Security Level:** Medium
- **Challenge Passage:** 30 minutes
- **Browser Integrity Check:** On

### Caching
- **Caching Level:** Standard
- **Browser Cache TTL:** 4 hours
- **Always Online:** On (shows cached version if server is down)

### Page Rules (Optional)
Add rules for specific paths:

1. **API endpoints** - Disable caching
   - URL: `api.spotsense.app/api/*`
   - Setting: Cache Level: Bypass

2. **Static assets** - Aggressive caching
   - URL: `api.spotsense.app/static/*`
   - Setting: Cache Level: Cache Everything, Edge TTL: 1 month

---

## Troubleshooting

### "Too many redirects" error
- **Cause:** SSL mode mismatch
- **Fix:** Set SSL mode to **Full (Strict)** or **Flexible** (not Full)

### WebSocket not connecting
- **Cause:** Cloudflare WebSocket support disabled
- **Fix:** WebSockets are enabled by default on free plan. Check that proxy status is orange cloud.

### Backend not receiving real client IP
- **Cause:** Not reading `X-Forwarded-For` header
- **Fix:** Ensure backend reads `X-Forwarded-For` header, not `remote_addr`

### SSL certificate errors
- **Cause:** Using "Full (Strict)" without valid server certificate
- **Fix:** Either use "Flexible" mode or install Cloudflare Origin Certificate on server

---

## Comparison: Cloudflare vs Let's Encrypt

| Feature | Cloudflare (Free) | Let's Encrypt + nginx |
|---------|------------------|----------------------|
| SSL Certificate | Automatic | Manual renewal (90 days) |
| DDoS Protection | Yes (built-in) | No |
| CDN | Yes | No |
| Setup Complexity | Low | Medium |
| Server SSL Config | Not needed (Flexible) | Required |
| Real Client IP | Via headers | Direct |
| WebSocket Support | Yes | Yes |
| Cost | Free | Free |

---

## Quick Setup Checklist

- [ ] Signed up for Cloudflare free account
- [ ] Added `spotsense.app` to Cloudflare
- [ ] Configured DNS: `api` A record → `47.82.153.110` (proxied)
- [ ] Configured DNS: `@` and `www` CNAME → Vercel (proxied)
- [ ] Updated nameservers at domain registrar
- [ ] Waited for DNS propagation (5-30 minutes)
- [ ] Set SSL mode to **Full (Strict)** or **Flexible**
- [ ] Enabled **Always Use HTTPS**
- [ ] Verified backend is running on port 8002
- [ ] Tested `https://api.spotsense.app` in browser
- [ ] Tested WebSocket connection
- [ ] Configured firewall to allow traffic

---

## Support

- **Cloudflare Docs:** [https://developers.cloudflare.com/](https://developers.cloudflare.com/)
- **Community Forum:** [https://community.cloudflare.com/](https://community.cloudflare.com/)
