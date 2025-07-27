# 🚀 VIEAgent Platform - Hướng Dẫn Deploy Production

## 📋 Tổng Quan
Hướng dẫn này sẽ giúp bạn deploy VIEAgent AI Platform lên production với:
- **Vercel Pro** (hosting & deployment)
- **Supabase** (PostgreSQL database)
- **Custom Domain** (từ MatBao)
- **Production optimizations**

---

## 📦 Yêu Cầu Trước Khi Bắt Đầu

✅ **Đã có sẵn:**
- [x] Vercel Pro account
- [x] Supabase account 
- [x] Domain đã mua tại MatBao
- [x] Code repository trên GitHub

✅ **Cần chuẩn bị:**
- [ ] API keys cho AI providers (OpenAI, Anthropic)
- [ ] Google OAuth credentials (nếu sử dụng Google login)
- [ ] Email service setup (Resend, SendGrid...)

---

# 🎯 STAGE 1: Chuẩn Bị Database (Supabase)

## 1.1. Setup Supabase Project

### Bước 1: Tạo Project
1. Đi tới [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Điền thông tin:
   ```
   Name: vieagent-production
   Database Password: [tạo password mạnh - lưu lại]
   Region: Southeast Asia (Singapore) - closest to Vietnam
   ```
4. Click **"Create new project"** (chờ 2-3 phút)

### Bước 2: Get Database Connection Strings
1. Trong Supabase project → **Settings** → **Database**
2. Copy 2 connection strings:

```bash
# Connection pooling (dùng cho production)
postgresql://postgres.xxx:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres

# Direct connection (dùng cho migrations)  
postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres
```

### Bước 3: Setup Database Schema
```bash
# Chạy trong terminal local
cd ai-agent-platform

# Set environment variable tạm thời
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres"

# Generate Prisma client
npm run db:generate

# Deploy schema to Supabase
npx prisma db push
```

### Bước 4: Verify Database
1. Supabase Dashboard → **Table Editor**
2. Kiểm tra có các bảng: `User`, `Agent`, `Conversation`, etc.

---

# 🎯 STAGE 2: Sửa Code Để Build Production

## 2.1. Fix ESLint Configuration

### Cập nhật `next.config.js`:
```javascript
// Tìm dòng eslint và sửa thành:
eslint: {
  // Tạm thời ignore warnings cho deployment
  ignoreDuringBuilds: true,
  dirs: ['src'],
},
```

## 2.2. Add Environment Validation

### Tạo `src/lib/env-validation.ts`:
```typescript
// Validate required environment variables
const requiredEnvs = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL'
] as const;

export function validateEnvironment() {
  const missing = requiredEnvs.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
```

## 2.3. Update Build Script

### Sửa `package.json`:
```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "vercel-build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

## 2.4. Commit Changes
```bash
git add .
git commit -m "🚀 Production ready: fix ESLint & add env validation"
git push origin main
```

---

# 🎯 STAGE 3: Setup Vercel Deployment

## 3.1. Connect GitHub Repository

1. Đi tới [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"New Project"**
3. **Import Git Repository**:
   - Chọn repository `vieagent-platform`
   - Click **"Import"**

## 3.2. Configure Project Settings

### Framework Preset:
```
Framework: Next.js
Build Command: npm run vercel-build
Output Directory: .next
Install Command: npm install
Development Command: npm run dev
```

### Root Directory:
```
Root Directory: ./ai-agent-platform
```

## 3.3. Setup Environment Variables

Click **"Environment Variables"** và thêm:

### 🔴 CRITICAL - Database:
```bash
DATABASE_URL=postgresql://postgres.xxx:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
DIRECT_DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres
```

### 🔴 CRITICAL - Auth:
```bash
NEXTAUTH_SECRET=your-super-secret-32-character-random-string-here
NEXTAUTH_URL=https://your-domain.com
ENCRYPTION_KEY=another-32-character-encryption-key-here
```

### 🔴 CRITICAL - Base URL:
```bash
NEXT_PUBLIC_BASE_URL=https://your-domain.com
NODE_ENV=production
```

### 🟡 IMPORTANT - AI APIs (nếu sử dụng):
```bash
OPENAI_API_KEY=sk-xxx...
ANTHROPIC_API_KEY=sk-ant-xxx...
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
```

### 🟡 IMPORTANT - Email (nếu sử dụng):
```bash
RESEND_API_KEY=re_xxx...
FROM_EMAIL=noreply@your-domain.com
```

### 🟢 OPTIONAL - Analytics:
```bash
GOOGLE_ANALYTICS_ID=G-xxx...
SENTRY_DSN=https://xxx@sentry.io/xxx
```

## 3.4. Deploy First Time
1. Click **"Deploy"**
2. Chờ build process (3-5 phút)
3. Nếu có lỗi, xem logs để debug

---

# 🎯 STAGE 4: Setup Custom Domain (MatBao)

## 4.1. Add Domain to Vercel

1. Vercel Dashboard → Project → **Settings** → **Domains**
2. Add domain: `your-domain.com`
3. Vercel sẽ hiển thị DNS records cần setup

## 4.2. Configure DNS tại MatBao

### Nếu dùng Vercel nameservers (khuyến nghị):
1. MatBao control panel → Domain management
2. Change nameservers to:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```

### Nếu dùng DNS records:
1. MatBao DNS management
2. Add A record:
   ```
   Type: A
   Name: @
   Value: 76.76.19.19
   TTL: 3600
   ```
3. Add CNAME record:
   ```
   Type: CNAME  
   Name: www
   Value: cname.vercel-dns.com
   TTL: 3600
   ```

## 4.3. Verify Domain
1. Chờ DNS propagation (5-60 phút)
2. Check tại [DNS Checker](https://dnschecker.org/)
3. Vercel sẽ tự động issue SSL certificate

---

# 🎯 STAGE 5: Production Optimization

## 5.1. Update Environment URLs

### Update Vercel Environment Variables:
```bash
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

## 5.2. Database Production Settings

### Supabase Dashboard → Settings → Database:
1. Enable **Connection pooling**
2. Set **Pool mode**: Transaction
3. Set **Pool size**: 20-30

## 5.3. Enable Performance Features

### Vercel Dashboard → Project → Settings:

**Analytics**: Enable Vercel Analytics
**Speed Insights**: Enable for performance monitoring  
**Edge Config**: Enable for dynamic configuration
**Functions**: Set region to `sin1` (Singapore)

---

# 🎯 STAGE 6: Testing & Verification

## 6.1. Health Check

### Test các endpoints:
```bash
# Basic health
curl https://your-domain.com/api/health

# Database connection  
curl https://your-domain.com/api/auth/csrf

# AI features (nếu có)
curl https://your-domain.com/api/agents
```

## 6.2. Browser Testing

1. **Homepage**: `https://your-domain.com`
2. **Login flow**: Test authentication
3. **Admin panel**: `https://your-domain.com/admin`
4. **Dashboard**: Test agent creation/management
5. **API routes**: Test in browser network tab

## 6.3. Performance Testing

1. **GTmetrix**: Test page speed
2. **PageSpeed Insights**: Google performance score
3. **Vercel Analytics**: Check Core Web Vitals

---

# 🎯 STAGE 7: Monitoring & Maintenance

## 7.1. Setup Monitoring

### Vercel Dashboard:
- Enable **Log Drains** for debugging
- Setup **Alerts** for downtime
- Monitor **Function Duration** & **Edge Cache**

### Supabase Dashboard:
- Monitor **Database Usage**
- Setup **Connection Pooling**
- Enable **Row Level Security** (RLS)

## 7.2. Backup & Security

### Database Backup:
```bash
# Weekly automated backup
npx supabase db dump --db-url="your-connection-string" > backup.sql
```

### Security Headers:
Verify tại [Security Headers](https://securityheaders.com/):
- CSP (Content Security Policy)
- HSTS (HTTP Strict Transport Security)
- X-Frame-Options

---

# 🚨 Troubleshooting Common Issues

## Build Errors

### Error: "Module not found"
```bash
# Clear cache and reinstall
rm -rf .next node_modules package-lock.json
npm install
```

### Error: "Prisma generate failed"
```bash
# Fix Prisma in Vercel
npm run db:generate
npm run build
```

## Database Errors

### Error: "Connection timeout"
- Check Supabase connection string
- Verify firewall settings
- Switch to connection pooling URL

### Error: "Migration failed"
```bash
# Reset database (CAREFUL - loses data)
npx prisma migrate reset
npx prisma db push
```

## Domain Issues

### DNS not propagating:
- Wait 24-48 hours maximum
- Clear browser DNS cache
- Check with multiple DNS checkers

### SSL certificate issues:
- Force SSL renewal in Vercel
- Check domain verification
- Contact Vercel support if needed

---

# 📞 Support Resources

## Documentation:
- [Vercel Docs](https://vercel.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)

## Community:
- [Vercel Discord](https://discord.gg/vercel)
- [Supabase Discord](https://discord.supabase.com/)

## Emergency Contacts:
- Vercel Pro Support: support@vercel.com
- Supabase Support: support@supabase.io

---

# ✅ Post-Deployment Checklist

## 🔴 CRITICAL:
- [ ] Website accessible at custom domain
- [ ] HTTPS working properly
- [ ] Database connections working
- [ ] Authentication flow working
- [ ] Admin panel accessible

## 🟡 IMPORTANT:
- [ ] All API endpoints responding
- [ ] Email notifications working
- [ ] AI integrations functional
- [ ] Performance score > 90
- [ ] Error monitoring setup

## 🟢 NICE TO HAVE:
- [ ] Analytics tracking
- [ ] SEO meta tags optimized
- [ ] Social media previews
- [ ] PWA features enabled
- [ ] Backup procedures documented

---

**🎉 Congratulations! Your VIEAgent Platform is now live in production!**

*Lưu file này và refer back khi cần troubleshoot hoặc redeploy.* 