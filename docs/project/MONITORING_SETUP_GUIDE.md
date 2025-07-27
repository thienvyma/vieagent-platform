# 🔍 HƯỚNG DẪN SETUP MONITORING SYSTEM CHI TIẾT

## 📋 **MỤC LỤC**
1. [Tổng quan](#tổng-quan)
2. [Chuẩn bị môi trường](#chuẩn-bị-môi-trường)
3. [Setup ChromaDB](#setup-chromadb)
4. [Setup Monitoring System](#setup-monitoring-system)
5. [Kế hoạch nâng cấp 5-10$/tháng](#kế-hoạch-nâng-cấp-5-10tháng)
6. [Biện pháp giảm rủi ro](#biện-pháp-giảm-rủi-ro)
7. [Quy trình khẩn cấp](#quy-trình-khẩn-cấp)

---

## 🎯 **TỔNG QUAN**

### **Mục tiêu**
- Thiết lập hệ thống monitoring toàn diện
- Giảm thiểu rủi ro khi triển khai
- Tự động hóa backup và recovery
- Cảnh báo sớm các vấn đề

### **Thành phần chính**
- **Health Check API**: Kiểm tra tình trạng hệ thống
- **Monitoring Dashboard**: Giao diện giám sát real-time
- **Automated Alerts**: Cảnh báo qua email/SMS
- **Backup System**: Sao lưu tự động hàng ngày
- **ChromaDB**: Vector database cho RAG

---

## 🔧 **CHUẨN BỊ MÔI TRƯỜNG**

### **Bước 1: Kiểm tra Requirements**

```powershell
# Kiểm tra Node.js
node --version
# Yêu cầu: Node.js 18+

# Kiểm tra npm
npm --version
# Yêu cầu: npm 8+

# Kiểm tra Python (cho ChromaDB)
python --version
# Yêu cầu: Python 3.8+
```

### **Bước 2: Cài đặt Dependencies**

```powershell
cd ai-agent-platform

# Cài đặt PM2 (Process Manager)
npm install -g pm2 pm2-windows-startup

# Cài đặt monitoring dependencies
npm install axios nodemailer cron chromadb

# Cài đặt ChromaDB (Python)
python -m pip install chromadb
```

### **Bước 3: Cấu hình Environment Variables**

Tạo file `.env.local`:

```env
# =============================================================================
# MONITORING CONFIGURATION
# =============================================================================
MONITORING_ENABLED=true
MONITORING_INTERVAL=300000
ALERT_EMAIL=your-email@gmail.com

# =============================================================================
# BACKUP CONFIGURATION
# =============================================================================
BACKUP_ENABLED=true
BACKUP_RETENTION_DAYS=7

# =============================================================================
# CHROMADB CONFIGURATION
# =============================================================================
CHROMADB_HOST=localhost
CHROMADB_PORT=8000
CHROMADB_PROTOCOL=http
CHROMADB_COLLECTION_NAME=ai-agent-documents
CHROMADB_PERSIST_DIRECTORY=./chromadb/data

# =============================================================================
# ALERT THRESHOLDS
# =============================================================================
DATABASE_SIZE_THRESHOLD=419430400    # 400MB
BANDWIDTH_THRESHOLD=85899345920      # 80GB
STORAGE_THRESHOLD=21474836480        # 20GB
VECTOR_COUNT_THRESHOLD=800000        # 800K vectors
EMAIL_COUNT_THRESHOLD=80             # 80 emails/day
MEMORY_THRESHOLD=90                  # 90% memory
RESPONSE_TIME_THRESHOLD=5000         # 5 seconds
```

---

## 🗄️ **SETUP CHROMADB**

### **Bước 1: Chạy Setup Script**

```powershell
# Chạy setup ChromaDB
.\scripts\setup-chromadb.ps1
```

### **Bước 2: Khởi động ChromaDB Server**

```powershell
# Terminal 1: Start ChromaDB
.\scripts\start-chromadb.ps1
```

### **Bước 3: Test ChromaDB**

```powershell
# Terminal 2: Test ChromaDB
.\scripts\test-chromadb.ps1
```

### **Bước 4: Verify ChromaDB**

- Truy cập: `http://localhost:8000`
- Kiểm tra collections
- Test add/query documents

---

## 📊 **SETUP MONITORING SYSTEM**

### **Bước 1: Khởi động Monitoring**

```powershell
# Start monitoring system
.\scripts\start-monitoring.ps1
```

### **Bước 2: Kiểm tra Health**

```powershell
# Check system health
.\scripts\health-check.ps1
```

### **Bước 3: Truy cập Dashboard**

- **Monitoring Dashboard**: `http://localhost:3001/dashboard/monitoring`
- **Health Check API**: `http://localhost:3001/api/health`
- **Application**: `http://localhost:3001`

### **Bước 4: Verify Monitoring**

```powershell
# Check PM2 status
pm2 status

# View logs
pm2 logs

# Interactive monitoring
pm2 monit
```

---

## 💰 **KẾ HOẠCH NÂNG CẤP 5-10$/THÁNG**

### **📊 Phân bổ ngân sách**

#### **Gói 5$/tháng (Cơ bản)**
- **Supabase Pro**: $25/tháng → Chia sẻ với dự án khác
- **Vercel Pro**: $20/tháng → Chia sẻ
- **Pinecone Starter**: $70/tháng → Sử dụng free tier + optimize
- **Resend**: $20/tháng → Sử dụng free tier
- **Cloudinary**: $0-10/tháng → Optimize usage

**Tổng thực tế: ~$5/tháng**

#### **Gói 10$/tháng (Tối ưu)**
- **Supabase Pro**: $25/tháng (1/5 share)
- **Vercel Pro**: $20/tháng (1/2 share)
- **Upstash Redis**: $0.2/tháng
- **Sentry**: $26/tháng (1/3 share)
- **PostHog**: $0/tháng (free tier)

**Tổng thực tế: ~$10/tháng**

### **🎯 Lợi ích nâng cấp**

#### **Với 5$/tháng:**
- ✅ Database size: 500MB → 8GB
- ✅ Bandwidth: 100GB → 200GB
- ✅ Storage: 25GB → 100GB
- ✅ Email: 100/day → 50,000/month
- ✅ Advanced monitoring
- ✅ Priority support

#### **Với 10$/tháng:**
- ✅ Database size: 8GB → 32GB
- ✅ Bandwidth: 200GB → 1TB
- ✅ Redis cache: 256MB
- ✅ Error tracking (Sentry)
- ✅ Advanced analytics
- ✅ Team collaboration

### **📈 Giảm rủi ro với nâng cấp**

| Rủi ro | Free Tier | 5$/tháng | 10$/tháng |
|---------|-----------|----------|-----------|
| Database Full | 🔴 Cao | 🟡 Thấp | 🟢 Rất thấp |
| Bandwidth Limit | 🔴 Cao | 🟡 Thấp | 🟢 Rất thấp |
| Downtime | 🔴 Cao | 🟡 Trung bình | 🟢 Thấp |
| Data Loss | 🔴 Cao | 🟡 Thấp | 🟢 Rất thấp |
| Performance | 🔴 Chậm | 🟡 Ổn | 🟢 Nhanh |

---

## 🛡️ **BIỆN PHÁP GIẢM RỦI RO**

### **A. Monitoring & Alerting**

#### **1. Real-time Monitoring**
```javascript
// Các metrics được theo dõi
const MONITORING_METRICS = {
  database_size: 'MB',
  memory_usage: '%',
  cpu_usage: '%',
  response_time: 'ms',
  error_rate: '%',
  active_users: 'count',
  api_calls: 'count/min'
};
```

#### **2. Alert System**
```javascript
// Cấu hình cảnh báo
const ALERT_CONFIG = {
  email: {
    enabled: true,
    recipients: ['admin@domain.com'],
    smtp: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false
    }
  },
  thresholds: {
    critical: {
      database_size: 480, // MB
      memory_usage: 90,   // %
      response_time: 5000 // ms
    },
    warning: {
      database_size: 400, // MB
      memory_usage: 70,   // %
      response_time: 2000 // ms
    }
  }
};
```

#### **3. Automated Responses**
```javascript
// Phản ứng tự động
const AUTO_RESPONSES = {
  high_memory: 'restart_application',
  database_full: 'cleanup_old_data',
  slow_response: 'scale_up_resources',
  service_down: 'restart_service'
};
```

### **B. Backup & Recovery**

#### **1. Database Backup**
```bash
# Backup strategy
- Full backup: Daily at 2 AM
- Incremental: Every 6 hours
- Retention: 7 days local, 30 days cloud
- Compression: gzip
- Encryption: AES-256
```

#### **2. Application Backup**
```bash
# Code backup
- Git repository: GitHub/GitLab
- Environment configs: Encrypted storage
- Secrets: Separate secure storage
- Build artifacts: CI/CD pipeline
```

#### **3. Recovery Procedures**
```bash
# Recovery time objectives
- Database restore: < 5 minutes
- Application restart: < 2 minutes
- Full system recovery: < 15 minutes
- Data loss tolerance: < 1 hour
```

### **C. Performance Optimization**

#### **1. Database Optimization**
```sql
-- Performance tuning
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_documents_created_at ON documents(created_at);
CREATE INDEX CONCURRENTLY idx_agents_user_id ON agents(user_id);

-- Query optimization
EXPLAIN ANALYZE SELECT * FROM documents WHERE user_id = $1;
```

#### **2. Caching Strategy**
```javascript
// Multi-level caching
const CACHE_STRATEGY = {
  level1: 'memory', // 1-5 minutes
  level2: 'redis',  // 5-60 minutes
  level3: 'cdn',    // 1-24 hours
  level4: 'database' // Persistent
};
```

#### **3. API Optimization**
```javascript
// API performance
const API_OPTIMIZATIONS = {
  rate_limiting: '100 requests/minute',
  response_compression: 'gzip',
  caching_headers: 'Cache-Control: max-age=3600',
  pagination: 'limit=20&offset=0'
};
```

---

## 🚨 **QUY TRÌNH KHẨN CẤP**

### **1. SYSTEM DOWN (Hệ thống ngừng hoạt động)**

#### **Immediate Actions (0-5 phút)**
```powershell
# Bước 1: Kiểm tra status
pm2 status

# Bước 2: Check health
.\scripts\health-check.ps1

# Bước 3: Restart services
pm2 restart all

# Bước 4: Check logs
pm2 logs --lines 50
```

#### **Short-term Actions (5-30 phút)**
```powershell
# Bước 1: Database check
npm run db:push
npm run db:generate

# Bước 2: ChromaDB check
.\scripts\test-chromadb.ps1

# Bước 3: Full restart
pm2 delete all
pm2 start ecosystem.config.js
```

#### **Long-term Actions (30+ phút)**
```powershell
# Bước 1: Root cause analysis
# - Review error logs
# - Check system metrics
# - Analyze database queries

# Bước 2: Implement fixes
# - Apply hotfixes
# - Update configurations
# - Optimize performance

# Bước 3: Prevent recurrence
# - Update monitoring
# - Improve alerting
# - Document lessons learned
```

### **2. HIGH MEMORY USAGE (Sử dụng memory cao)**

```powershell
# Immediate response
pm2 monit

# Check memory usage
Get-Process -Name "node" | Select-Object ProcessName, WorkingSet

# Restart with cleanup
pm2 restart ai-agent-platform

# Monitor trend
pm2 logs ai-agent-platform --lines 100
```

### **3. DATABASE ISSUES (Vấn đề database)**

```sql
-- Check database status
SELECT pg_database_size('your_database');
SELECT count(*) FROM information_schema.tables;

-- Check connections
SELECT count(*) FROM pg_stat_activity;

-- Check slow queries
SELECT query, mean_exec_time 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

### **4. CHROMADB ISSUES (Vấn đề ChromaDB)**

```powershell
# Check ChromaDB status
.\scripts\test-chromadb.ps1

# Restart ChromaDB
# Stop current instance (Ctrl+C)
.\scripts\start-chromadb.ps1

# Verify collections
# Check data integrity
```

---

## 📊 **MONITORING COMMANDS**

### **Daily Operations**
```powershell
# Morning check
.\scripts\health-check.ps1
pm2 status

# Monitor throughout day
pm2 monit

# Evening review
pm2 logs --lines 100
```

### **Weekly Maintenance**
```powershell
# Log cleanup
.\scripts\rotate-logs.ps1

# Backup verification
# Check backup integrity
# Test restore procedures

# Performance review
# Analyze metrics
# Optimize slow queries
```

### **Monthly Tasks**
```powershell
# Full system audit
# Security review
# Performance benchmarking
# Capacity planning
```

---

## 🎯 **SUCCESS METRICS**

### **Technical KPIs**
- ✅ Uptime: > 99.5%
- ✅ Response time: < 2 seconds
- ✅ Error rate: < 0.1%
- ✅ Database size: < 80% of limit
- ✅ Memory usage: < 70% average

### **Business KPIs**
- ✅ User satisfaction: > 90%
- ✅ Feature availability: 100%
- ✅ Security incidents: 0
- ✅ Data loss incidents: 0
- ✅ Recovery time: < 15 minutes

---

## 📞 **SUPPORT & CONTACTS**

### **Emergency Contacts**
- **Technical Lead**: your-email@domain.com
- **System Admin**: admin@domain.com
- **On-call Engineer**: oncall@domain.com

### **Service Providers**
- **Supabase**: support@supabase.com
- **Vercel**: support@vercel.com
- **Pinecone**: support@pinecone.io
- **Cloudinary**: support@cloudinary.com

### **Escalation Matrix**
1. **Level 1**: Self-service (0-15 min)
2. **Level 2**: Team support (15-60 min)
3. **Level 3**: External support (1-4 hours)
4. **Level 4**: Emergency escalation (4+ hours)

---

## 📚 **ADDITIONAL RESOURCES**

### **Documentation**
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [ChromaDB Documentation](https://docs.trychroma.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

### **Monitoring Tools**
- [PM2 Monitoring](https://app.pm2.io/)
- [Sentry Error Tracking](https://sentry.io/)
- [PostHog Analytics](https://posthog.com/)
- [Uptime Robot](https://uptimerobot.com/)

### **Best Practices**
- [12 Factor App](https://12factor.net/)
- [Site Reliability Engineering](https://sre.google/)
- [DevOps Practices](https://aws.amazon.com/devops/)
- [Security Guidelines](https://owasp.org/)

---

**🚀 Bắt đầu setup ngay:**

```powershell
# 1. Setup ChromaDB
.\scripts\setup-chromadb.ps1

# 2. Start ChromaDB
.\scripts\start-chromadb.ps1

# 3. Start Monitoring
.\scripts\start-monitoring.ps1

# 4. Check Health
.\scripts\health-check.ps1
```

**📊 Truy cập Dashboard:**
- Monitoring: `http://localhost:3001/dashboard/monitoring`
- Health Check: `http://localhost:3001/api/health`
- ChromaDB: `http://localhost:8000`

---

*Tài liệu này được cập nhật thường xuyên. Phiên bản mới nhất luôn có trên repository.* 