# 🌐 Domain & SSL Configuration Guide

## 📋 **Overview**

This guide covers setting up a custom domain with SSL certificates for VIEAgent production deployment using Cloudflare DNS and Vercel hosting.

**Setup Strategy:**
- Domain management with Cloudflare
- Vercel Pro for hosting and SSL
- Automatic HTTPS redirection
- CDN optimization via Cloudflare
- Subdomain configuration for staging

---

## 🔧 **Step 1: Domain Registration & Cloudflare Setup**

### **1.1 Domain Registration**
1. **Register Domain** (if not already owned):
   - Recommended: Namecheap, GoDaddy, or Google Domains
   - Suggested domains: `vieagent.com`, `yourbrand.ai`, etc.

2. **Add Domain to Cloudflare**:
   - Go to [cloudflare.com](https://cloudflare.com)
   - Sign up/login to your account
   - **Add a Site** → Enter your domain
   - Choose **Free Plan** (sufficient for most needs)

### **1.2 Update Nameservers**
1. Cloudflare will provide nameservers:
   ```
   alice.ns.cloudflare.com
   bob.ns.cloudflare.com
   ```

2. Update nameservers at your domain registrar:
   - Login to your domain registrar
   - Find **Nameservers** or **DNS Management**
   - Replace existing nameservers with Cloudflare's
   - Save changes (propagation takes 24-48 hours)

### **1.3 Verify DNS Propagation**
```bash
# Check nameserver propagation
dig NS yourdomain.com

# Check DNS propagation globally
# Visit: https://www.whatsmydns.net/
```

---

## 🚀 **Step 2: Cloudflare DNS Configuration**

### **2.1 DNS Records Setup**
In Cloudflare Dashboard > **DNS** > **Records**:

```dns
# Root domain (A record pointing to Vercel)
Type: A
Name: @
Content: 76.76.19.61
Proxy: ✅ Proxied

# WWW subdomain
Type: CNAME
Name: www
Content: yourdomain.com
Proxy: ✅ Proxied

# API subdomain (optional)
Type: CNAME
Name: api
Content: yourdomain.com
Proxy: ✅ Proxied

# Staging/preview subdomain
Type: CNAME
Name: staging
Content: yourdomain.com
Proxy: ✅ Proxied

# Email verification (if using custom email)
Type: MX
Name: @
Content: 10 yourdomain.com
Proxy: ❌ DNS only
```

### **2.2 Cloudflare SSL/TLS Settings**
1. Go to **SSL/TLS** > **Overview**
2. Set encryption mode: **Full (strict)**
3. **SSL/TLS** > **Edge Certificates**:
   - ✅ Always Use HTTPS: **On**
   - ✅ HTTP Strict Transport Security (HSTS): **Enabled**
   - ✅ Minimum TLS Version: **1.2**
   - ✅ Opportunistic Encryption: **On**
   - ✅ TLS 1.3: **Enabled**

### **2.3 Page Rules for Optimization**
**SSL/TLS** > **Page Rules**:
```
Rule 1: *yourdomain.com/*
Settings: Always Use HTTPS

Rule 2: yourdomain.com/api/*
Settings: 
- Cache Level: Bypass
- Browser Cache TTL: Respect Existing Headers

Rule 3: yourdomain.com/static/*
Settings:
- Cache Level: Cache Everything
- Browser Cache TTL: 1 year
- Edge Cache TTL: 1 month
```

---

## 🏗️ **Step 3: Vercel Domain Configuration**

### **3.1 Add Domain to Vercel**
1. In Vercel Dashboard, go to your project
2. **Settings** > **Domains**
3. **Add Domain**: `yourdomain.com`
4. **Add Domain**: `www.yourdomain.com`
5. Vercel will provide DNS instructions

### **3.2 Verify Domain Ownership**
Vercel may require verification via:
- **DNS TXT Record**: Add provided TXT record to Cloudflare
- **File Upload**: Upload verification file to domain root

```dns
# Example verification TXT record
Type: TXT
Name: _vercel
Content: vc-domain-verify=yourdomain.com,1234567890abcdef
```

### **3.3 Configure Domain Aliases**
```bash
# Via Vercel CLI
vercel domains add yourdomain.com
vercel domains add www.yourdomain.com

# Set primary domain
vercel alias set yourdomain.com your-vercel-app.vercel.app
```

---

## 🔐 **Step 4: SSL Certificate Configuration**

### **4.1 Automatic SSL via Vercel**
Vercel automatically provisions SSL certificates for custom domains:
- Uses Let's Encrypt for certificate generation
- Automatic renewal every 60 days
- Supports wildcard certificates for subdomains

### **4.2 Verify SSL Configuration**
```bash
# Test SSL certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Check SSL rating
# Visit: https://www.ssllabs.com/ssltest/
```

### **4.3 HTTPS Redirection Setup**
Update `next.config.js` for HTTPS enforcement:

```javascript
// next.config.js
const nextConfig = {
  // Force HTTPS in production
  async redirects() {
    return [
      // HTTP to HTTPS redirect
      {
        source: '/:path*',
        has: [
          {
            type: 'header',
            key: 'x-forwarded-proto',
            value: 'http',
          },
        ],
        destination: 'https://yourdomain.com/:path*',
        permanent: true,
      },
      // WWW to non-WWW redirect
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.yourdomain.com',
          },
        ],
        destination: 'https://yourdomain.com/:path*',
        permanent: true,
      },
    ];
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
```

---

## 📊 **Step 5: Performance Optimization**

### **5.1 Cloudflare Performance Settings**
**Speed** > **Optimization**:
- ✅ Auto Minify: CSS, JavaScript, HTML
- ✅ Brotli Compression: On
- ✅ Early Hints: On
- ✅ Rocket Loader: Off (can interfere with React)

### **5.2 Caching Configuration**
**Caching** > **Configuration**:
```
Caching Level: Standard
Browser Cache TTL: 4 hours
Always Online: On
Development Mode: Off (in production)
```

### **5.3 Custom Cache Rules**
```
# Static assets
URL Pattern: /static/*
Cache Level: Cache Everything
Edge Cache TTL: 30 days
Browser Cache TTL: 7 days

# API routes
URL Pattern: /api/*
Cache Level: Bypass
Browser Cache TTL: No-Cache

# Images
URL Pattern: /*.{jpg,jpeg,png,gif,webp,svg}
Cache Level: Cache Everything
Edge Cache TTL: 7 days
Browser Cache TTL: 1 day
```

---

## 🔧 **Step 6: Subdomain Configuration**

### **6.1 Staging Environment**
```dns
# Staging subdomain
Type: CNAME
Name: staging
Content: staging-vieagent.vercel.app
Proxy: ✅ Proxied
```

### **6.2 API Subdomain (Optional)**
```dns
# Dedicated API subdomain
Type: CNAME
Name: api
Content: yourdomain.com
Proxy: ✅ Proxied
```

Update Vercel configuration:
```json
// vercel.json
{
  "alias": [
    "yourdomain.com",
    "www.yourdomain.com",
    "api.yourdomain.com",
    "staging.yourdomain.com"
  ]
}
```

---

## 📧 **Step 7: Email Configuration (Optional)**

### **7.1 Email Forwarding**
If you want `contact@yourdomain.com`:

1. **Cloudflare Email Routing** (Free):
   - **Email** > **Email Routing**
   - Add MX records automatically
   - Create forwarding rules

2. **Custom Email Service**:
   - Use Google Workspace, Microsoft 365, or Zoho
   - Update MX records accordingly

### **7.2 SPF/DKIM Records**
For email deliverability:
```dns
# SPF Record
Type: TXT
Name: @
Content: v=spf1 include:_spf.google.com ~all

# DMARC Record
Type: TXT
Name: _dmarc
Content: v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com
```

---

## ✅ **Step 8: Testing & Validation**

### **8.1 Domain Accessibility Test**
```bash
# Test all domain variations
curl -I https://yourdomain.com
curl -I https://www.yourdomain.com
curl -I https://staging.yourdomain.com

# Test redirects
curl -I http://yourdomain.com  # Should redirect to HTTPS
curl -I https://www.yourdomain.com  # Should redirect to non-WWW
```

### **8.2 SSL Certificate Validation**
```bash
# Check certificate details
echo | openssl s_client -servername yourdomain.com -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates

# Verify certificate chain
echo | openssl s_client -servername yourdomain.com -connect yourdomain.com:443 -showcerts
```

### **8.3 Performance Testing**
```bash
# Test page load speed
curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com

# Create curl-format.txt:
echo "     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n" > curl-format.txt
```

---

## 📋 **Domain Setup Checklist**

### **Cloudflare Configuration**
- [ ] ✅ Domain added to Cloudflare
- [ ] ✅ Nameservers updated at registrar
- [ ] ✅ DNS records configured (A, CNAME, MX)
- [ ] ✅ SSL/TLS set to Full (strict)
- [ ] ✅ Always Use HTTPS enabled
- [ ] ✅ Page rules configured
- [ ] ✅ Performance optimizations enabled

### **Vercel Configuration**
- [ ] ✅ Domain added to Vercel project
- [ ] ✅ Domain ownership verified
- [ ] ✅ SSL certificate provisioned
- [ ] ✅ HTTPS redirects configured
- [ ] ✅ Subdomain aliases setup

### **Testing & Validation**
- [ ] ✅ Domain resolves correctly
- [ ] ✅ SSL certificate valid and trusted
- [ ] ✅ HTTPS redirects working
- [ ] ✅ Performance optimization active
- [ ] ✅ Security headers configured
- [ ] ✅ Email routing functional (if configured)

---

## 🚨 **Troubleshooting**

### **Common Issues:**

**Domain Not Resolving:**
```bash
# Check DNS propagation
dig yourdomain.com
nslookup yourdomain.com

# Clear local DNS cache
sudo dscacheutil -flushcache  # macOS
ipconfig /flushdns  # Windows
```

**SSL Certificate Issues:**
```bash
# Force SSL renewal in Vercel
vercel certs renew yourdomain.com

# Check Cloudflare SSL status
# Dashboard > SSL/TLS > Edge Certificates
```

**Redirect Loops:**
- Check Cloudflare SSL mode is "Full (strict)"
- Verify HTTPS redirects in next.config.js
- Ensure consistent protocol handling

---

## 💡 **Best Practices**

### **Security**
1. Always use "Full (strict)" SSL mode
2. Enable HSTS with preload
3. Set minimum TLS version to 1.2
4. Configure security headers
5. Enable bot protection

### **Performance**
1. Use Cloudflare's CDN for global delivery
2. Enable Brotli compression
3. Configure appropriate cache TTLs
4. Optimize images and static assets
5. Monitor Core Web Vitals

### **Monitoring**
1. Set up uptime monitoring
2. Monitor SSL certificate expiry
3. Track DNS resolution times
4. Monitor Cloudflare analytics
5. Set up alert notifications

---

## 🔗 **Related Configuration Files**

Update these files with your domain:

### **Environment Variables**
```bash
# .env.production
NEXTAUTH_URL="https://yourdomain.com"
APP_URL="https://yourdomain.com"
CORS_ORIGIN="https://yourdomain.com"
```

### **Site Configuration**
```typescript
// lib/config.ts
export const siteConfig = {
  name: "VIEAgent",
  url: "https://yourdomain.com",
  description: "AI Agent Platform",
  links: {
    github: "https://github.com/yourorg/vieagent",
    docs: "https://yourdomain.com/docs",
  }
};
```

---

**Domain & SSL Configuration Complete!** 🌐
**Your VIEAgent platform is now accessible via your custom domain with enterprise-grade SSL security.** 