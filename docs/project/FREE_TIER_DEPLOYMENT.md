# 🆓 FREE TIER DEPLOYMENT GUIDE
# Hướng Dẫn Triển Khai Miễn Phí - AI Agent Platform

## 📋 **TÓM TẮT PHƯƠNG ÁN**

**Chi phí**: **$0/tháng** (hoàn toàn miễn phí)
**Thời gian setup**: **2-3 giờ**
**Khả năng mở rộng**: **Tốt** (có thể upgrade sau)

### **🏗️ KIẾN TRÚC DEPLOYMENT**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel        │    │   Supabase      │    │   Pinecone      │
│   (Frontend)    │───▶│   (Database)    │───▶│   (Vectors)     │
│   Next.js       │    │   PostgreSQL    │    │   1M vectors    │
│   100GB/month   │    │   500MB         │    │   Free          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Cloudinary    │    │   Resend        │    │   Upstash       │
│   (Storage)     │    │   (Email)       │    │   (Cache)       │
│   25GB          │    │   3K emails     │    │   10K requests  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🚀 **BƯỚC 1: SETUP CÁC DỊCH VỤ**

### **1.1 Vercel (Frontend Hosting)**

```bash
# Cài đặt Vercel CLI
npm install -g vercel

# Login vào Vercel
vercel login

# Liên kết project
vercel link
```

### **1.2 Supabase (Database)**

1. **Tạo project**: https://supabase.com/dashboard
2. **Lấy credentials**:
   ```
   Project URL: https://[project-ref].supabase.co
   API Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   Database URL: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
   ```

### **1.3 Pinecone (Vector Database)**

1. **Đăng ký**: https://www.pinecone.io/
2. **Tạo index**:
   ```
   Index Name: ai-agent-knowledge
   Dimensions: 1536 (OpenAI embeddings)
   Metric: cosine
   Environment: gcp-starter
   ```

### **1.4 Cloudinary (File Storage)**

1. **Đăng ký**: https://cloudinary.com/
2. **Lấy credentials**:
   ```
   Cloud Name: your-cloud-name
   API Key: your-api-key
   API Secret: your-api-secret
   ```

### **1.5 Resend (Email Service)**

1. **Đăng ký**: https://resend.com/
2. **Tạo API key**: https://resend.com/api-keys
3. **Verify domain** (optional)

### **1.6 Upstash (Redis Cache)**

1. **Đăng ký**: https://upstash.com/
2. **Tạo database**:
   ```
   Type: Redis
   Region: us-east-1
   Plan: Free
   ```

---

## 🔧 **BƯỚC 2: CẤU HÌNH ENVIRONMENT**

### **2.1 Copy Environment Template**

```bash
# Copy template
cp env.production.free .env.production

# Edit với credentials thực
nano .env.production
```

### **2.2 Cấu hình Vercel Environment**

```bash
# Set environment variables trên Vercel
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add OPENAI_API_KEY production
# ... (tất cả các env vars)
```

### **2.3 Cấu hình Database Schema**

```bash
# Generate Prisma client
npx prisma generate

# Push schema to Supabase
npx prisma db push

# Seed initial data
npm run db:seed
```

---

## 🚀 **BƯỚC 3: DEPLOYMENT**

### **3.1 Automated Deployment**

```bash
# Chạy script deploy tự động
chmod +x scripts/deploy-free.sh
./scripts/deploy-free.sh
```

### **3.2 Manual Deployment**

```bash
# Build application
npm run build

# Deploy to Vercel
vercel --prod

# Verify deployment
curl https://your-app.vercel.app/api/health
```

---

## 📊 **GIỚI HẠN FREE TIER**

### **Vercel (Free Plan)**
- ✅ **Bandwidth**: 100GB/tháng
- ✅ **Builds**: 6,000 phút/tháng
- ✅ **Serverless Functions**: 100GB-hours/tháng
- ✅ **Domains**: 1 custom domain
- ⚠️ **Function Timeout**: 10 giây

### **Supabase (Free Plan)**
- ✅ **Database**: 500MB PostgreSQL
- ✅ **API Requests**: 50,000/tháng
- ✅ **Auth Users**: 50,000
- ✅ **Storage**: 1GB
- ⚠️ **Pause after 1 week inactivity**

### **Pinecone (Free Plan)**
- ✅ **Vectors**: 1M vectors
- ✅ **Queries**: Unlimited
- ✅ **Namespaces**: 1 index
- ⚠️ **Performance**: Standard

### **Cloudinary (Free Plan)**
- ✅ **Storage**: 25GB
- ✅ **Bandwidth**: 25GB/tháng
- ✅ **Transformations**: 25,000/tháng
- ⚠️ **Video**: 1GB storage

### **Resend (Free Plan)**
- ✅ **Emails**: 3,000/tháng
- ✅ **Domains**: 1 verified domain
- ✅ **Templates**: Unlimited
- ⚠️ **Daily limit**: 100 emails

### **Upstash (Free Plan)**
- ✅ **Requests**: 10,000/ngày
- ✅ **Storage**: 256MB
- ✅ **Bandwidth**: 1GB/tháng
- ⚠️ **Connections**: 100 concurrent

---

## 🔍 **MONITORING & MAINTENANCE**

### **4.1 Monitoring Setup**

```bash
# Sentry cho error tracking
npm install @sentry/nextjs

# PostHog cho analytics
npm install posthog-js
```

### **4.2 Usage Monitoring**

- **Vercel**: https://vercel.com/dashboard/usage
- **Supabase**: https://supabase.com/dashboard/project/[ref]/settings/billing
- **Pinecone**: https://app.pinecone.io/organizations/[org]/projects/[project]/indexes
- **Cloudinary**: https://cloudinary.com/console/usage
- **Resend**: https://resend.com/emails
- **Upstash**: https://console.upstash.com/

### **4.3 Backup Strategy**

```bash
# Database backup (weekly)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Pinecone backup (export vectors)
# Code implementation needed

# Cloudinary backup (sync to local)
# Use Cloudinary Admin API
```

---

## ⚡ **PERFORMANCE OPTIMIZATION**

### **5.1 Caching Strategy**

```typescript
// Redis cache cho API responses
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Cache knowledge queries
const cacheKey = `knowledge:${userId}:${query}`
const cached = await redis.get(cacheKey)
if (cached) return cached

// Cache for 5 minutes
await redis.setex(cacheKey, 300, result)
```

### **5.2 Image Optimization**

```typescript
// Cloudinary auto-optimization
const optimizedUrl = cloudinary.url(publicId, {
  quality: 'auto',
  fetch_format: 'auto',
  width: 800,
  height: 600,
  crop: 'fill'
})
```

### **5.3 Database Optimization**

```sql
-- Supabase indexes
CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_conversations_agent_id ON conversations(agent_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
```

---

## 🚨 **TROUBLESHOOTING**

### **Common Issues**

#### **1. Vercel Build Timeout**
```bash
# Increase build timeout
# vercel.json
{
  "functions": {
    "app/api/chat/route.ts": {
      "maxDuration": 30
    }
  }
}
```

#### **2. Supabase Connection Issues**
```bash
# Check connection
psql $DATABASE_URL -c "SELECT version();"

# Reset connection pool
# Restart Supabase project
```

#### **3. Pinecone Rate Limits**
```typescript
// Add retry logic
const retryQuery = async (query: any, retries = 3) => {
  try {
    return await index.query(query)
  } catch (error) {
    if (retries > 0 && error.status === 429) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return retryQuery(query, retries - 1)
    }
    throw error
  }
}
```

#### **4. Email Delivery Issues**
```typescript
// Verify Resend configuration
const resend = new Resend(process.env.RESEND_API_KEY)

const result = await resend.emails.send({
  from: 'noreply@yourdomain.com',
  to: 'user@example.com',
  subject: 'Test Email',
  html: '<p>Test content</p>'
})
```

---

## 📈 **SCALING STRATEGY**

### **When to Upgrade**

| Metric | Free Limit | Upgrade Trigger |
|--------|------------|-----------------|
| **Users** | 50K | 40K users |
| **API Calls** | 50K/month | 40K/month |
| **Storage** | 500MB | 400MB |
| **Bandwidth** | 100GB/month | 80GB/month |
| **Vectors** | 1M | 800K vectors |

### **Upgrade Path**

1. **Vercel Pro** ($20/month)
   - 1TB bandwidth
   - 1,000 GB-hours functions
   - Advanced analytics

2. **Supabase Pro** ($25/month)
   - 8GB database
   - 500K API requests
   - Daily backups

3. **Pinecone Standard** ($70/month)
   - 5M vectors
   - Better performance
   - Multiple indexes

---

## ✅ **DEPLOYMENT CHECKLIST**

### **Pre-Deployment**
- [ ] Tất cả services đã setup
- [ ] Environment variables đã cấu hình
- [ ] Database schema đã push
- [ ] Build test thành công
- [ ] Health check endpoint hoạt động

### **Deployment**
- [ ] Vercel deployment thành công
- [ ] Domain đã cấu hình (optional)
- [ ] SSL certificate active
- [ ] All API endpoints responding
- [ ] Authentication working

### **Post-Deployment**
- [ ] User registration test
- [ ] Agent creation test
- [ ] Chat functionality test
- [ ] Knowledge upload test
- [ ] Email notifications test
- [ ] Payment flow test (if enabled)

---

## 🎯 **EXPECTED PERFORMANCE**

### **Free Tier Capabilities**
- **Concurrent Users**: 50-100
- **API Response Time**: <500ms
- **Database Queries**: <100ms
- **Vector Search**: <200ms
- **File Upload**: <2MB files
- **Email Delivery**: <10 seconds

### **Limitations**
- **Function Timeout**: 10 seconds (Vercel)
- **Database Size**: 500MB (Supabase)
- **Vector Limit**: 1M vectors (Pinecone)
- **Daily Emails**: 100 (Resend)
- **File Storage**: 25GB (Cloudinary)

---

## 📞 **SUPPORT & RESOURCES**

### **Documentation**
- [Vercel Docs](https://vercel.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Pinecone Docs](https://docs.pinecone.io/)
- [Resend Docs](https://resend.com/docs)
- [Upstash Docs](https://docs.upstash.com/)

### **Community**
- [Vercel Discord](https://vercel.com/discord)
- [Supabase Discord](https://supabase.com/discord)
- [Next.js Discord](https://nextjs.org/discord)

### **Monitoring**
- **Uptime**: https://status.vercel.com/
- **Performance**: Vercel Analytics
- **Errors**: Sentry Dashboard
- **Usage**: Service dashboards

---

**🎉 Chúc mừng! Bạn đã có một AI Agent Platform hoàn toàn miễn phí!**

*Cập nhật lần cuối: January 2025*
*Phiên bản: 1.0.0*
*Trạng thái: Sẵn sàng triển khai* 