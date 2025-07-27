# 🚀 ADMIN DEPLOYMENT GUIDE

## 📋 **CHECKLIST DEPLOYMENT**

### **✅ Files cần đọc trước khi deploy:**

#### **1. CONFIGURATION FILES**
- [ ] `env.production.example` - Template environment variables
- [ ] `env.production.free` - Free tier configuration
- [ ] `vercel.json` - Vercel deployment settings
- [ ] `ecosystem.config.js` - PM2 process configuration
- [ ] `next.config.js` - Next.js build configuration
- [ ] `package.json` - Dependencies và scripts
- [ ] `prisma/schema.prisma` - Database schema

#### **2. DEPLOYMENT SCRIPTS**
- [ ] `scripts/deploy-free.sh` - Free tier deployment script
- [ ] `scripts/setup-monitoring.ps1` - Monitoring setup (Windows)
- [ ] `scripts/setup-chromadb.ps1` - ChromaDB setup (Windows)
- [ ] `scripts/start-monitoring.ps1` - Start monitoring services
- [ ] `scripts/health-check.ps1` - Health check script
- [ ] `scripts/monitor-free-tier.js` - Free tier monitoring
- [ ] `scripts/backup-free-tier.js` - Backup automation

#### **3. DOCUMENTATION FILES**
- [ ] `docs/FREE_TIER_DEPLOYMENT.md` - Free tier deployment guide
- [ ] `MONITORING_GUIDE_WINDOWS.md` - Windows monitoring guide
- [ ] `README.md` - Main project documentation

#### **4. CRITICAL SOURCE FILES**
- [ ] `src/app/api/health/route.ts` - Health check endpoint
- [ ] `src/app/dashboard/monitoring/page.tsx` - Monitoring dashboard
- [ ] `src/lib/prisma.ts` - Database connection
- [ ] `src/lib/chromadb.js` - ChromaDB configuration
- [ ] `middleware.ts` - Next.js middleware
- [ ] `src/app/layout.tsx` - Root layout

---

## 🔧 **DEPLOYMENT PROCESS**

### **Phase 1: Pre-Deployment (30 phút)**

#### **A. Environment Setup**
```bash
# 1. Đọc và cấu hình environment variables
cp env.production.example .env.production
# Cập nhật các giá trị:
# - DATABASE_URL (Supabase)
# - NEXTAUTH_URL (Domain)
# - NEXTAUTH_SECRET (Random string)
# - OPENAI_API_KEY
# - PINECONE_API_KEY
# - RESEND_API_KEY
# - CLOUDINARY_* credentials
```

#### **B. Database Preparation**
```bash
# 2. Kiểm tra database schema
npx prisma generate
npx prisma db push
# Verify tables created correctly
```

#### **C. Build Verification**
```bash
# 3. Test build locally
npm run build
npm run start
# Verify no build errors
```

### **Phase 2: Service Setup (45 phút)**

#### **A. External Services**
- [ ] **Supabase**: Database configured, tables created
- [ ] **Vercel**: Project linked, environment variables set
- [ ] **Pinecone**: Index created, API key valid
- [ ] **Cloudinary**: Account setup, upload preset configured
- [ ] **Resend**: Domain verified, API key active
- [ ] **Google OAuth**: Client ID/Secret configured

#### **B. Monitoring Setup**
```bash
# 4. Setup monitoring (if self-hosting)
.\scripts\setup-monitoring.ps1
.\scripts\setup-chromadb.ps1
```

### **Phase 3: Deployment (30 phút)**

#### **A. Vercel Deployment**
```bash
# 5. Deploy to Vercel
vercel --prod
# Or use GitHub integration
```

#### **B. Health Check**
```bash
# 6. Verify deployment
curl -f https://your-domain.com/api/health
# Check all endpoints working
```

#### **C. Final Verification**
- [ ] Homepage loads correctly
- [ ] Authentication works
- [ ] Database connections active
- [ ] API endpoints responding
- [ ] Monitoring dashboard accessible

---

## 📊 **MONITORING SETUP**

### **Files to Review:**
1. **`scripts/monitor-free-tier.js`**
   - Supabase usage monitoring
   - Vercel bandwidth tracking
   - Pinecone vector count
   - Email quota monitoring

2. **`scripts/backup-free-tier.js`**
   - Database backup automation
   - Asset backup procedures
   - Configuration backup

3. **`src/app/api/health/route.ts`**
   - Health check endpoint
   - System metrics collection
   - Service status monitoring

### **Key Monitoring URLs:**
- Health Check: `https://your-domain.com/api/health`
- Monitoring Dashboard: `https://your-domain.com/dashboard/monitoring`
- Vercel Analytics: `https://vercel.com/dashboard`
- Supabase Dashboard: `https://app.supabase.com/`

---

## 🚨 **TROUBLESHOOTING GUIDE**

### **Common Issues & Solutions:**

#### **1. Build Errors**
```bash
# Check logs
npm run build 2>&1 | tee build.log
# Common fixes:
# - Update dependencies
# - Check TypeScript errors
# - Verify environment variables
```

#### **2. Database Connection Issues**
```bash
# Test connection
npx prisma db push
# Check DATABASE_URL format
# Verify Supabase project active
```

#### **3. API Errors**
```bash
# Check health endpoint
curl -v https://your-domain.com/api/health
# Verify all environment variables set
# Check service API keys validity
```

#### **4. Performance Issues**
```bash
# Monitor resources
# Check Vercel function logs
# Review database query performance
# Optimize image loading
```

---

## 📝 **DEPLOYMENT CHECKLIST**

### **Pre-Deployment:**
- [ ] All environment variables configured
- [ ] Database schema updated
- [ ] External services configured
- [ ] Local build successful
- [ ] Tests passing

### **During Deployment:**
- [ ] Vercel deployment successful
- [ ] Domain configured correctly
- [ ] SSL certificate active
- [ ] Environment variables set in Vercel
- [ ] Database migrations applied

### **Post-Deployment:**
- [ ] Health check passing
- [ ] All pages loading
- [ ] Authentication working
- [ ] API endpoints responding
- [ ] Monitoring active
- [ ] Backup scheduled

---

## 🔐 **SECURITY CHECKLIST**

### **Environment Variables:**
- [ ] `NEXTAUTH_SECRET` - Strong random string
- [ ] `DATABASE_URL` - Secure connection string
- [ ] API keys - Valid and restricted
- [ ] OAuth credentials - Properly configured
- [ ] CORS settings - Restrictive domains

### **Vercel Settings:**
- [ ] Environment variables encrypted
- [ ] Function timeout configured
- [ ] Bandwidth limits monitored
- [ ] Access logs enabled
- [ ] Custom domain HTTPS

---

## 📊 **PERFORMANCE MONITORING**

### **Key Metrics to Track:**
- **Response Time**: < 2 seconds
- **Uptime**: > 99.5%
- **Error Rate**: < 0.1%
- **Database Size**: < 80% of limit
- **Bandwidth Usage**: < 80% of limit
- **API Calls**: Within rate limits

### **Monitoring Tools:**
- Vercel Analytics
- Supabase Dashboard
- Custom monitoring dashboard
- Health check endpoint
- Error tracking (if configured)

---

## 🎯 **SUCCESS CRITERIA**

### **Technical Success:**
- [ ] All pages load within 2 seconds
- [ ] Zero critical errors in logs
- [ ] Database queries optimized
- [ ] API endpoints stable
- [ ] Monitoring dashboard functional

### **Business Success:**
- [ ] User registration working
- [ ] Agent creation functional
- [ ] Knowledge base operational
- [ ] Payment processing active
- [ ] Email notifications working

---

## 📞 **EMERGENCY CONTACTS**

### **Service Providers:**
- **Vercel Support**: support@vercel.com
- **Supabase Support**: support@supabase.com
- **Pinecone Support**: support@pinecone.io
- **Cloudinary Support**: support@cloudinary.com
- **Resend Support**: support@resend.com

### **Emergency Procedures:**
1. **Site Down**: Check Vercel status, review logs
2. **Database Issues**: Check Supabase dashboard
3. **API Failures**: Review function logs
4. **Performance Issues**: Check monitoring dashboard
5. **Security Breach**: Rotate API keys, check access logs

---

## 📚 **ADDITIONAL RESOURCES**

### **Documentation Links:**
- [Vercel Deployment Guide](https://vercel.com/docs/deployments)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)

### **Best Practices:**
- Regular backup verification
- Performance monitoring
- Security updates
- Dependency updates
- Error log review

---

## 🔄 **MAINTENANCE SCHEDULE**

### **Daily:**
- [ ] Check health endpoint
- [ ] Review error logs
- [ ] Monitor resource usage

### **Weekly:**
- [ ] Backup verification
- [ ] Performance review
- [ ] Security scan
- [ ] Dependency updates

### **Monthly:**
- [ ] Full system audit
- [ ] Capacity planning
- [ ] Security review
- [ ] Documentation update

---

**📝 Notes:**
- Tài liệu này cần được cập nhật sau mỗi deployment
- Lưu trữ credentials an toàn
- Backup tài liệu quan trọng
- Test disaster recovery procedures

**🚀 Ready for deployment!** 