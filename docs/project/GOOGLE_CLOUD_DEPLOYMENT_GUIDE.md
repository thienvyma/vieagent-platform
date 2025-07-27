# 🚀 VIEAgent - Google Cloud Platform Deployment Guide

## 📋 Tổng quan dự án

**VIEAgent** là một nền tảng AI Agent tiên tiến được thiết kế đặc biệt cho người dùng Việt Nam với các tính năng:

- **Multi-Model AI**: OpenAI, Anthropic, Google Gemini
- **RAG System**: ChromaDB Vector Database
- **Google Integration**: Gmail, Calendar, Drive, Sheets
- **Real-time Chat**: WebSocket connections
- **Knowledge Management**: Document processing & vector search
- **Admin Dashboard**: Role-based access control
- **Payment System**: Stripe integration

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────┐
│                    Google Cloud Platform                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Cloud Run     │  │  Cloud SQL      │  │  Cloud Storage  │ │
│  │ (Next.js App)   │  │ (PostgreSQL)    │  │ (File Storage)  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Compute Engine  │  │  Cloud Memstore │  │  Cloud Build    │ │
│  │ (ChromaDB)      │  │ (Redis Cache)   │  │ (CI/CD)         │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Cloud Functions │  │  Cloud Scheduler│  │  Cloud Monitoring│ │
│  │ (Background)    │  │ (Cron Jobs)     │  │ (Logging)       │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 📦 Các thành phần cần thiết

### ✅ Đã có sẵn trong dự án:
- **Next.js 15** với TypeScript
- **Prisma ORM** với schema hoàn chỉnh (50+ models)
- **NextAuth.js** authentication
- **Tailwind CSS** + shadcn/ui components
- **Multi-provider AI** integration
- **Google OAuth** setup
- **File upload** system
- **Admin dashboard** 
- **Payment integration** (Stripe)

### ❌ Cần setup riêng:
- **ChromaDB Vector Database** server
- **PostgreSQL** database
- **Redis** cache server
- **SMTP** email service
- **File storage** system
- **SSL certificates**
- **Domain & DNS**
- **Monitoring & logging**

## 🛠️ Hướng dẫn setup từng bước

### 1. 🔧 Chuẩn bị môi trường Google Cloud

#### 1.1 Tạo Google Cloud Project
```bash
# Cài đặt Google Cloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init

# Tạo project mới
gcloud projects create vieagent-platform --name="VIEAgent Platform"
gcloud config set project vieagent-platform

# Enable các APIs cần thiết
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable redis.googleapis.com
gcloud services enable compute.googleapis.com
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudscheduler.googleapis.com
gcloud services enable monitoring.googleapis.com
gcloud services enable logging.googleapis.com
```

#### 1.2 Setup Service Account
```bash
# Tạo service account
gcloud iam service-accounts create vieagent-service \
    --display-name="VIEAgent Service Account"

# Gán quyền
gcloud projects add-iam-policy-binding vieagent-platform \
    --member="serviceAccount:vieagent-service@vieagent-platform.iam.gserviceaccount.com" \
    --role="roles/editor"

# Tạo key file
gcloud iam service-accounts keys create ~/vieagent-service-key.json \
    --iam-account=vieagent-service@vieagent-platform.iam.gserviceaccount.com
```

### 2. 🗄️ Setup Database (Cloud SQL PostgreSQL)

#### 2.1 Tạo Cloud SQL Instance
```bash
# Tạo PostgreSQL instance
gcloud sql instances create vieagent-db \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=asia-southeast1 \
    --root-password=VieAgent2025!

# Tạo database
gcloud sql databases create vieagent_production \
    --instance=vieagent-db

# Tạo user
gcloud sql users create vieagent_user \
    --instance=vieagent-db \
    --password=VieAgent2025User!
```

#### 2.2 Update Database Schema
```bash
# Cập nhật schema.prisma
# Thay đổi từ SQLite sang PostgreSQL
```

**File: `prisma/schema.prisma`**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Giữ nguyên các models hiện có...
```

#### 2.3 Setup Database Connection
```bash
# Lấy connection string
gcloud sql instances describe vieagent-db

# Connection string format:
# postgresql://vieagent_user:VieAgent2025User!@INSTANCE_IP:5432/vieagent_production
```

### 3. 💾 Setup ChromaDB Vector Database

#### 3.1 Tạo Compute Engine Instance
```bash
# Tạo VM instance cho ChromaDB
gcloud compute instances create chromadb-server \
    --zone=asia-southeast1-a \
    --machine-type=e2-medium \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --boot-disk-size=50GB \
    --tags=chromadb-server

# Tạo firewall rule
gcloud compute firewall-rules create allow-chromadb \
    --allow tcp:8000 \
    --source-ranges 0.0.0.0/0 \
    --target-tags chromadb-server
```

#### 3.2 Setup ChromaDB trên VM
```bash
# SSH vào VM
gcloud compute ssh chromadb-server --zone=asia-southeast1-a

# Cài đặt dependencies
sudo apt update
sudo apt install -y python3-pip docker.io
sudo systemctl start docker
sudo systemctl enable docker

# Chạy ChromaDB với Docker
sudo docker run -d \
  --name chromadb \
  -p 8000:8000 \
  -v chromadb_data:/chroma/chroma \
  --restart unless-stopped \
  chromadb/chroma:latest

# Kiểm tra
curl http://localhost:8000/api/v1/heartbeat
```

#### 3.3 Tạo ChromaDB Service Script
**File: `/home/user/chromadb-service.py`**
```python
import chromadb
from chromadb.config import Settings
import os

# ChromaDB server configuration
client = chromadb.HttpClient(
    host="0.0.0.0",
    port=8000,
    settings=Settings(
        chroma_server_host="0.0.0.0",
        chroma_server_http_port=8000,
        chroma_server_ssl_enabled=False,
        chroma_server_cors_allow_origins=["*"],
        persist_directory="/chroma/chroma"
    )
)

print("ChromaDB server started successfully!")
```

### 4. 🔄 Setup Redis Cache (Cloud Memorystore)

```bash
# Tạo Redis instance
gcloud redis instances create vieagent-cache \
    --size=1 \
    --region=asia-southeast1 \
    --redis-version=redis_7_0

# Lấy connection info
gcloud redis instances describe vieagent-cache --region=asia-southeast1
```

### 5. 📧 Setup Email Service (SMTP)

#### 5.1 Sử dụng Gmail SMTP
```bash
# Tạo App Password cho Gmail
# 1. Vào Google Account Settings
# 2. Security > 2-Step Verification
# 3. App passwords > Generate password
```

#### 5.2 Alternative: SendGrid
```bash
# Đăng ký SendGrid account
# Lấy API key từ SendGrid dashboard
```

### 6. ☁️ Setup Cloud Storage

```bash
# Tạo Cloud Storage bucket
gcloud storage buckets create gs://vieagent-uploads \
    --location=asia-southeast1 \
    --uniform-bucket-level-access

# Set permissions
gcloud storage buckets add-iam-policy-binding gs://vieagent-uploads \
    --member="serviceAccount:vieagent-service@vieagent-platform.iam.gserviceaccount.com" \
    --role="roles/storage.objectAdmin"
```

### 7. 🔐 Setup Environment Variables

#### 7.1 Tạo file `.env.production`
```env
# =============================================================================
# VIEAgent - Production Environment Configuration
# =============================================================================

# Database
DATABASE_URL="postgresql://vieagent_user:VieAgent2025User!@CLOUD_SQL_IP:5432/vieagent_production"

# Authentication
NEXTAUTH_SECRET="your-super-secure-production-secret-key-2025"
NEXTAUTH_URL="https://your-domain.com"

# AI Providers
OPENAI_API_KEY="sk-your-openai-production-key"
ANTHROPIC_API_KEY="sk-ant-your-anthropic-production-key"
GOOGLE_GEMINI_API_KEY="your-google-gemini-production-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_API_KEY="your-google-api-key"

# ChromaDB
CHROMA_SERVER_HOST="CHROMADB_VM_EXTERNAL_IP"
CHROMA_SERVER_PORT="8000"
CHROMA_SERVER_SSL="false"

# Redis
REDIS_URL="redis://REDIS_IP:6379"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="VIEAgent <noreply@your-domain.com>"

# Cloud Storage
GOOGLE_CLOUD_PROJECT="vieagent-platform"
GOOGLE_CLOUD_BUCKET="vieagent-uploads"
GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-key.json"

# Stripe
STRIPE_PUBLIC_KEY="pk_live_your_stripe_public_key"
STRIPE_SECRET_KEY="sk_live_your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# Security
CORS_ORIGIN="https://your-domain.com"
RATE_LIMIT_WINDOW_MS="900000"
RATE_LIMIT_MAX_REQUESTS="100"

# Performance
NODE_ENV="production"
LOG_LEVEL="info"
ENABLE_QUERY_LOGGING="false"
```

### 8. 🚀 Deploy ứng dụng lên Cloud Run

#### 8.1 Tạo Dockerfile
**File: `Dockerfile`**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start application
CMD ["npm", "start"]
```

#### 8.2 Tạo Cloud Build configuration
**File: `cloudbuild.yaml`**
```yaml
steps:
  # Build Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/vieagent:$BUILD_ID', '.']
  
  # Push to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/vieagent:$BUILD_ID']
  
  # Deploy to Cloud Run
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'vieagent-platform'
      - '--image'
      - 'gcr.io/$PROJECT_ID/vieagent:$BUILD_ID'
      - '--region'
      - 'asia-southeast1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'
      - '--port'
      - '3000'
      - '--memory'
      - '2Gi'
      - '--cpu'
      - '1'
      - '--max-instances'
      - '10'
      - '--min-instances'
      - '1'
      - '--env-vars-file'
      - '.env.production'

images:
  - 'gcr.io/$PROJECT_ID/vieagent:$BUILD_ID'
```

#### 8.3 Deploy
```bash
# Submit build
gcloud builds submit --config cloudbuild.yaml

# Hoặc deploy trực tiếp
gcloud run deploy vieagent-platform \
  --source . \
  --region asia-southeast1 \
  --platform managed \
  --allow-unauthenticated \
  --port 3000 \
  --memory 2Gi \
  --cpu 1 \
  --max-instances 10 \
  --min-instances 1
```

### 9. 🌐 Setup Domain & SSL

#### 9.1 Mua domain và setup DNS
```bash
# Lấy Cloud Run URL
gcloud run services describe vieagent-platform --region=asia-southeast1

# Setup custom domain
gcloud run domain-mappings create \
  --service vieagent-platform \
  --domain your-domain.com \
  --region asia-southeast1
```

#### 9.2 Update DNS records
```
# Thêm DNS records tại nhà cung cấp domain:
Type: CNAME
Name: @
Value: ghs.googlehosted.com

Type: CNAME  
Name: www
Value: ghs.googlehosted.com
```

### 10. 📊 Setup Monitoring & Logging

#### 10.1 Cloud Monitoring
```bash
# Enable monitoring
gcloud services enable monitoring.googleapis.com

# Tạo alerting policies
gcloud alpha monitoring policies create \
  --policy-from-file=monitoring-policy.yaml
```

**File: `monitoring-policy.yaml`**
```yaml
displayName: "VIEAgent High Error Rate"
conditions:
  - displayName: "Error rate too high"
    conditionThreshold:
      filter: 'resource.type="cloud_run_revision"'
      comparison: COMPARISON_GREATER_THAN
      thresholdValue: 0.1
      duration: 300s
notificationChannels:
  - "your-notification-channel-id"
```

#### 10.2 Setup Logging
```bash
# Tạo log sink
gcloud logging sinks create vieagent-errors \
  bigquery.googleapis.com/projects/vieagent-platform/datasets/logs \
  --log-filter='severity>=ERROR'
```

### 11. 🔄 Setup CI/CD Pipeline

#### 11.1 GitHub Actions
**File: `.github/workflows/deploy.yml`**
```yaml
name: Deploy to Google Cloud Run

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Cloud SDK
      uses: google-github-actions/setup-gcloud@v1
      with:
        project_id: vieagent-platform
        service_account_key: ${{ secrets.GCP_SA_KEY }}
        export_default_credentials: true
    
    - name: Configure Docker
      run: gcloud auth configure-docker
    
    - name: Build and Deploy
      run: |
        gcloud builds submit --config cloudbuild.yaml
```

### 12. 🛡️ Security Setup

#### 12.1 WAF & DDoS Protection
```bash
# Enable Cloud Armor
gcloud compute security-policies create vieagent-security-policy \
  --description "VIEAgent security policy"

# Add rate limiting rule
gcloud compute security-policies rules create 1000 \
  --security-policy vieagent-security-policy \
  --expression "true" \
  --action "rate-based-ban" \
  --rate-limit-threshold-count 100 \
  --rate-limit-threshold-interval-sec 60 \
  --ban-duration-sec 300
```

#### 12.2 SSL/TLS Configuration
```bash
# Managed SSL certificate
gcloud compute ssl-certificates create vieagent-ssl \
  --domains your-domain.com,www.your-domain.com \
  --global
```

### 13. 📈 Performance Optimization

#### 13.1 CDN Setup
```bash
# Enable Cloud CDN
gcloud compute backend-services update vieagent-backend \
  --enable-cdn \
  --global
```

#### 13.2 Caching Strategy
```javascript
// Next.js config for caching
// File: next.config.js
module.exports = {
  headers: async () => [
    {
      source: '/api/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=3600, stale-while-revalidate=86400'
        }
      ]
    }
  ]
}
```

### 14. 🧪 Testing & Validation

#### 14.1 Health Checks
```bash
# Test health endpoint
curl -f https://your-domain.com/api/health

# Test database connection
curl -f https://your-domain.com/api/test/db

# Test ChromaDB connection
curl -f https://your-domain.com/api/test/chromadb
```

#### 14.2 Load Testing
```bash
# Sử dụng Apache Bench
ab -n 1000 -c 10 https://your-domain.com/

# Hoặc sử dụng k6
k6 run load-test.js
```

### 15. 🔄 Backup & Recovery

#### 15.1 Database Backup
```bash
# Automated backup
gcloud sql backups create \
  --instance=vieagent-db \
  --description="Daily backup"

# Setup backup schedule
gcloud sql instances patch vieagent-db \
  --backup-start-time=02:00 \
  --backup-location=asia-southeast1
```

#### 15.2 File Backup
```bash
# Backup Cloud Storage
gsutil -m rsync -r -d gs://vieagent-uploads gs://vieagent-backups
```

## 💰 Chi phí ước tính hàng tháng

| Service | Configuration | Cost (USD/month) |
|---------|---------------|------------------|
| Cloud Run | 2GB RAM, 1 CPU | $15-30 |
| Cloud SQL | db-f1-micro | $7-15 |
| Compute Engine | e2-medium | $25-35 |
| Cloud Storage | 100GB | $2-5 |
| Cloud Memorystore | 1GB Redis | $35-45 |
| Cloud Build | 120 builds/month | $0-5 |
| Monitoring | Basic | $0-10 |
| **Total** | | **$84-145** |

## 🚨 Troubleshooting

### Common Issues

1. **ChromaDB Connection Failed**
   ```bash
   # Check firewall
   gcloud compute firewall-rules list
   
   # Check VM status
   gcloud compute instances list
   ```

2. **Database Migration Failed**
   ```bash
   # Reset database
   npx prisma migrate reset --force
   npx prisma db push
   ```

3. **Cloud Run Memory Issues**
   ```bash
   # Increase memory
   gcloud run services update vieagent-platform \
     --memory 4Gi --region asia-southeast1
   ```

4. **SSL Certificate Issues**
   ```bash
   # Check certificate status
   gcloud compute ssl-certificates describe vieagent-ssl
   ```

## 📚 Tài liệu tham khảo

- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [ChromaDB Documentation](https://docs.trychroma.com/)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Prisma Production Guide](https://www.prisma.io/docs/guides/deployment)

## 🎯 Checklist hoàn thành

- [ ] Google Cloud Project setup
- [ ] Cloud SQL PostgreSQL configured
- [ ] ChromaDB server running
- [ ] Redis cache setup
- [ ] Email service configured
- [ ] Cloud Storage bucket created
- [ ] Environment variables configured
- [ ] Application deployed to Cloud Run
- [ ] Custom domain & SSL setup
- [ ] Monitoring & logging configured
- [ ] CI/CD pipeline setup
- [ ] Security policies applied
- [ ] Performance optimization
- [ ] Backup strategy implemented
- [ ] Load testing completed

---

**🚀 Deployment completed successfully!** 

Your VIEAgent platform is now running on Google Cloud Platform with full production capabilities.

**Support**: Nếu gặp vấn đề, vui lòng check logs tại Cloud Console hoặc liên hệ support team. 