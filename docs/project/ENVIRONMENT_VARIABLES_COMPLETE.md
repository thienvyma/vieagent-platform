# 📋 Tài Liệu Hoàn Chỉnh - Biến Môi Trường VIEAgent

## 🎯 **Tổng Quan**

Dự án VIEAgent sử dụng **hơn 80 biến môi trường** khác nhau để cấu hình các dịch vụ và tính năng. Tài liệu này liệt kê **TẤT CẢ** các biến được sử dụng trong dự án, dựa trên việc phân tích toàn bộ codebase và các file .env template.

## 📁 **Các File .env Template Có Sẵn**

### **1. Development**
- `env.example` - Template cơ bản cho development

### **2. Production**
- `env.production.example` - Template production chuẩn
- `env.production.template` - Template production chi tiết
- `env.production.free` - Template cho free tier deployment

### **3. Specialized**
- `production.config.env` - Cấu hình production hiện tại
- `vector-db-config.example` - Cấu hình vector database

## 🔑 **Biến Bắt Buộc (Core)**

### **Authentication & Security**
```bash
NEXTAUTH_SECRET="your-secret-key-here"     # Khóa bí mật JWT (32+ ký tự)
NEXTAUTH_URL="http://localhost:3000"       # URL ứng dụng
```

### **Database**
```bash
DATABASE_URL="file:./prisma/dev.db"        # URL kết nối database
DIRECT_URL="postgresql://..."              # Direct connection (Supabase)
```

### **AI Models**
```bash
OPENAI_API_KEY="sk-your-openai-key"        # Khóa API OpenAI
```

## 🤖 **AI Model Providers**

### **OpenAI (Bắt Buộc)**
```bash
OPENAI_API_KEY="sk-your-openai-api-key"
OPENAI_ORG_ID="org-your-organization-id"   # Tùy chọn
```

### **Anthropic Claude (Tùy Chọn)**
```bash
ANTHROPIC_API_KEY="sk-ant-your-anthropic-key"
```

### **Google Gemini (Tùy Chọn)**
```bash
GOOGLE_GEMINI_API_KEY="your-gemini-key"
GOOGLE_API_KEY="your-google-api-key"
```

## 🔗 **Google Integration**

### **OAuth & Services**
```bash
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_API_KEY="your-google-api-key"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"
```

## 💾 **Vector Database**

### **ChromaDB (Self-hosted)**
```bash
CHROMADB_HOST="localhost"
CHROMADB_PORT="8000"
CHROMADB_URL="http://localhost:8000"
CHROMA_PERSIST_DIRECTORY="./chromadb_data"
CHROMADB_PERSIST_PATH="./chromadb_data"
CHROMADB_USERNAME="your-username"
CHROMADB_PASSWORD="your-password"
CHROMA_SERVER_SSL="false"
CHROMA_AUTH_TOKEN="your-auth-token"
```

### **Pinecone (Cloud)**
```bash
PINECONE_API_KEY="your-pinecone-api-key"
PINECONE_ENVIRONMENT="gcp-starter"
PINECONE_INDEX_NAME="ai-agent-knowledge"
```

### **Vector Configuration**
```bash
VECTOR_DIMENSIONS="1536"
VECTOR_DISTANCE_METRIC="cosine"
EMBEDDING_PROVIDER="openai"
EMBEDDING_MODEL="text-embedding-3-small"
ENABLE_EMBEDDING_CACHE="true"
EMBEDDING_CACHE_TTL="86400"
EMBEDDING_CACHE_MAX_SIZE="10000"
```

## 📧 **Email Configuration**

### **SMTP Settings**
```bash
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="VIEAgent <noreply@your-domain.com>"
```

### **Resend (Free Tier)**
```bash
RESEND_API_KEY="re_your-resend-api-key"
FROM_EMAIL="noreply@your-domain.com"
```

## 💳 **Payment Processing**

### **Stripe**
```bash
STRIPE_PUBLIC_KEY="pk_test_your_stripe_public_key"
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_public_key"
```

### **PayPal (Alternative)**
```bash
PAYPAL_CLIENT_ID="your-paypal-client-id"
PAYPAL_CLIENT_SECRET="your-paypal-client-secret"
PAYPAL_MODE="sandbox"  # hoặc "live"
```

## 📱 **Social Media Integration**

### **Facebook**
```bash
FACEBOOK_APP_ID="your-facebook-app-id"
NEXT_PUBLIC_FACEBOOK_APP_ID="your-facebook-app-id"
```

### **Zalo**
```bash
ZALO_APP_ID="your-zalo-app-id"
NEXT_PUBLIC_ZALO_APP_ID="your-zalo-app-id"
```

### **Other Social Platforms**
```bash
TWITTER_API_KEY="your-twitter-api-key"
LINKEDIN_CLIENT_ID="your-linkedin-client-id"
```

## ☁️ **Cloud Storage**

### **AWS S3**
```bash
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-aws-access-key-id"
AWS_SECRET_ACCESS_KEY="your-aws-secret-access-key"
AWS_S3_BUCKET="your-s3-bucket-name"
```

### **Cloudinary**
```bash
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

## 📊 **Analytics & Monitoring**

### **Google Analytics**
```bash
GOOGLE_ANALYTICS_ID="G-XXXXXXXXXX"
```

### **Sentry (Error Tracking)**
```bash
SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"
SENTRY_ORG="your-org"
SENTRY_PROJECT="your-project"
```

### **PostHog Analytics**
```bash
POSTHOG_KEY="phc_your-posthog-key"
POSTHOG_HOST="https://app.posthog.com"
```

### **Admin & Notifications**
```bash
ADMIN_EMAIL="admin@your-domain.com"
ADMIN_PASSWORD="admin123456"
SLACK_WEBHOOK="https://hooks.slack.com/services/..."
```

## 🔄 **Caching & Performance**

### **Redis**
```bash
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD="your-redis-password"
UPSTASH_REDIS_REST_URL="https://region.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-rest-token"
```

### **Cache Configuration**
```bash
ENABLE_CACHE="true"
CACHE_TTL="3600"
CACHE_MAX_SIZE="1000"
```

## 🚨 **Rate Limiting & Security**

### **Rate Limiting**
```bash
RATE_LIMIT_WINDOW_MS="900000"      # 15 phút
RATE_LIMIT_MAX_REQUESTS="100"      # Số request tối đa
```

### **Security**
```bash
CORS_ORIGIN="http://localhost:3000"
SESSION_TIMEOUT="86400000"         # 24 giờ
WEBHOOK_SECRET="your-webhook-secret"
```

## 🌐 **Deployment & Environment**

### **Environment**
```bash
NODE_ENV="development"             # "production" cho live
```

### **Application**
```bash
APP_NAME="VIEAgent"
APP_URL="http://localhost:3000"
APP_VERSION="1.0.0"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### **Feature Flags**
```bash
FEATURE_GOOGLE_INTEGRATION="true"
FEATURE_ADVANCED_ANALYTICS="true"
FEATURE_MULTI_MODEL_SUPPORT="true"
FEATURE_MARKETPLACE="false"
ENABLE_VECTOR_SEARCH="true"
ENABLE_REAL_TIME="false"
ENABLE_PREMIUM_FEATURES="false"
```

## 🔧 **Development & Debugging**

### **Debug Configuration**
```bash
DEBUG="false"
LOG_LEVEL="info"                   # error, warn, info, debug
ENABLE_QUERY_LOGGING="false"
```

### **Development Tools**
```bash
ENABLE_PRISMA_STUDIO="true"
ENABLE_API_DOCS="true"
```

## 📱 **Mobile & PWA**

### **Push Notifications**
```bash
VAPID_PUBLIC_KEY="your-vapid-public-key"
VAPID_PRIVATE_KEY="your-vapid-private-key"
VAPID_EMAIL="mailto:your-email@domain.com"
```

## 💼 **Business Configuration**

### **Subscription Plans**
```bash
DEFAULT_TRIAL_DAYS="14"
MAX_AGENTS_FREE="3"
MAX_AGENTS_PREMIUM="10"
MAX_AGENTS_ENTERPRISE="unlimited"
```

### **File Upload Limits**
```bash
MAX_FILE_SIZE="10485760"           # 10MB
MAX_FILES_PER_UPLOAD="5"
ALLOWED_FILE_TYPES="pdf,txt,doc,docx,json,csv"
```

## 🆓 **Free Tier Specific (Supabase)**

### **Supabase Configuration**
```bash
SUPABASE_URL="https://[project-ref].supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### **Free Tier Monitoring**
```bash
MONITORING_ENABLED="true"
MONITORING_INTERVAL="300000"
DATABASE_SIZE_THRESHOLD="419430400"
BANDWIDTH_THRESHOLD="85899345920"
STORAGE_THRESHOLD="21474836480"
VECTOR_COUNT_THRESHOLD="800000"
EMAIL_COUNT_THRESHOLD="80"
MEMORY_THRESHOLD="90"
RESPONSE_TIME_THRESHOLD="5000"
ALERT_EMAIL="your-email@example.com"
```

### **Free Tier Backup**
```bash
BACKUP_ENABLED="true"
BACKUP_RETENTION_DAYS="7"
BACKUP_SCHEDULE="0 2 * * *"
```

## 🚀 **Scripts Đã Tạo**

### **1. Script Đơn Giản**
```powershell
.\scripts\simple-setup.ps1
```
**Bao gồm:** 4 biến cơ bản (NEXTAUTH_SECRET, NEXTAUTH_URL, OPENAI_API_KEY, DATABASE_URL)

### **2. Script Đầy Đủ**
```powershell
.\scripts\setup-environment.ps1
```
**Bao gồm:** Tất cả biến từ env.example

### **3. Script Hoàn Chỉnh**
```powershell
.\scripts\comprehensive-setup.ps1
```
**Bao gồm:** Tất cả biến từ codebase analysis

### **4. Script Ultimate (MỚI)**
```powershell
.\scripts\ultimate-setup.ps1
```
**Bao gồm:** TẤT CẢ biến từ tất cả file .env template + codebase

## 📋 **Phân Loại Theo Mức Độ Quan Trọng**

### **🔴 Bắt Buộc (Required)**
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `OPENAI_API_KEY`
- `DATABASE_URL`

### **🟡 Quan Trọng (Important)**
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `CHROMADB_HOST` / `PINECONE_API_KEY`
- `SMTP_*` / `RESEND_API_KEY`

### **🟢 Tùy Chọn (Optional)**
- `ANTHROPIC_API_KEY`
- `GOOGLE_GEMINI_API_KEY`
- `STRIPE_*`
- `FACEBOOK_APP_ID`
- `ZALO_APP_ID`
- `CLOUDINARY_*`
- `SENTRY_DSN`
- `ADMIN_EMAIL`

### **🔵 Free Tier Specific**
- `SUPABASE_*`
- `UPSTASH_REDIS_*`
- `PINECONE_*`
- `RESEND_API_KEY`

## 🎯 **Khuyến Nghị**

### **Development:**
- Sử dụng script `simple-setup.ps1` cho bắt đầu nhanh
- Chỉ cần 4 biến cơ bản

### **Production:**
- Sử dụng script `ultimate-setup.ps1`
- Cấu hình đầy đủ tất cả dịch vụ cần thiết

### **Free Tier Deployment:**
- Sử dụng script `ultimate-setup.ps1` với option Free Tier
- Tự động cấu hình Supabase + Upstash + Resend

### **Custom Setup:**
- Copy template phù hợp từ các file .env
- Cập nhật từng biến theo nhu cầu

## 🚨 **Lưu Ý Bảo Mật**

1. **Không commit file .env vào git**
2. **Sử dụng HTTPS cho production**
3. **Bảo mật API keys và secrets**
4. **Kiểm tra logs nếu gặp lỗi**
5. **Sử dụng strong passwords cho production**
6. **Rotate API keys regularly**
7. **Monitor for suspicious activity**

## 📞 **Hỗ Trợ**

Nếu gặp vấn đề:
1. Kiểm tra file logs trong thư mục `logs/`
2. Console output khi chạy ứng dụng
3. Network tab trong browser developer tools
4. Vercel deployment logs (nếu deploy trên Vercel)
5. Sử dụng script `ultimate-setup.ps1` để đảm bảo đầy đủ 