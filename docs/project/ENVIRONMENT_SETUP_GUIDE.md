# 🌍 Hướng Dẫn Cấu Hình Biến Môi Trường - VIEAgent Platform

## 📋 Tổng Quan

Dự án VIEAgent sử dụng các biến môi trường để cấu hình các dịch vụ khác nhau. Dưới đây là hướng dẫn chi tiết về cách lấy và cấu hình các biến môi trường cần thiết.

## 🚀 Cách Lấy Các Biến Môi Trường

### 1. **NEXTAUTH_SECRET** - Khóa Bí Mật JWT
```bash
# Tạo khóa bí mật mạnh (32 ký tự trở lên)
openssl rand -base64 32
# Hoặc sử dụng Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Cách lấy:**
- Tạo một chuỗi ngẫu nhiên mạnh ít nhất 32 ký tự
- Không sử dụng giá trị mặc định trong production
- Lưu trữ an toàn và không chia sẻ

### 2. **NEXTAUTH_URL** - URL Của Ứng Dụng
```bash
# Development
NEXTAUTH_URL="http://localhost:3000"

# Production (thay thế bằng domain thực tế)
NEXTAUTH_URL="https://your-domain.com"
```

**Cách lấy:**
- **Development**: Sử dụng `http://localhost:3000`
- **Production**: Sử dụng URL thực tế của ứng dụng (phải có HTTPS)
- **Vercel**: Tự động lấy từ `VERCEL_URL` hoặc cấu hình thủ công

### 3. **OPENAI_API_KEY** - Khóa API OpenAI
```bash
# Truy cập OpenAI Dashboard
# https://platform.openai.com/api-keys
```

**Cách lấy:**
1. Đăng ký tài khoản tại [OpenAI Platform](https://platform.openai.com)
2. Truy cập [API Keys](https://platform.openai.com/api-keys)
3. Tạo API key mới
4. Copy và lưu trữ an toàn

### 4. **DATABASE_URL** - URL Kết Nối Database
```bash
# SQLite (Development)
DATABASE_URL="file:./prisma/dev.db"

# PostgreSQL (Production)
DATABASE_URL="postgresql://username:password@host:port/database?schema=public"
```

**Cách lấy:**
- **SQLite**: Sử dụng đường dẫn file local
- **PostgreSQL**: Từ nhà cung cấp database (Vercel Postgres, Supabase, etc.)

## 📁 Cấu Trúc File Môi Trường

### 1. **File Template Có Sẵn**
```bash
# Copy file template
cp env.example .env.local
```

### 2. **File Cấu Hình Theo Môi Trường**
```bash
# Development
.env.local          # Cấu hình local development
.env.development    # Cấu hình development

# Production
.env.production     # Cấu hình production
production.config.env  # Template production
```

## 🔧 Cách Cấu Hình

### Bước 1: Tạo File .env.local
```bash
# Trong thư mục gốc của dự án
cp env.example .env.local
```

### Bước 2: Cập Nhật Các Biến Cần Thiết
```bash
# Mở file .env.local và cập nhật:
NEXTAUTH_SECRET="your-generated-secret-key"
NEXTAUTH_URL="http://localhost:3000"
OPENAI_API_KEY="sk-your-openai-api-key"
DATABASE_URL="file:./prisma/dev.db"
```

### Bước 3: Cấu Hình Bổ Sung (Tùy Chọn)
```bash
# Google OAuth (nếu sử dụng Google services)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# ChromaDB (vector database)
CHROMA_SERVER_HOST="localhost"
CHROMA_SERVER_PORT="8000"

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

## 🌐 Cấu Hình Cho Production

### 1. **Vercel Deployment**
```bash
# Trong Vercel Dashboard:
# Settings > Environment Variables
NEXTAUTH_SECRET=your-production-secret
NEXTAUTH_URL=https://your-app.vercel.app
OPENAI_API_KEY=sk-your-openai-key
DATABASE_URL=your-production-database-url
```

### 2. **Local Production Testing**
```bash
# Copy production template
cp production.config.env .env.production

# Cập nhật với giá trị thực tế
nano .env.production
```

## 🔒 Bảo Mật

### 1. **Không Commit File .env**
```bash
# Đảm bảo .env.local trong .gitignore
echo ".env.local" >> .gitignore
echo ".env.production" >> .gitignore
```

### 2. **Kiểm Tra Bảo Mật**
```bash
# Chạy script kiểm tra
node scripts/validation/day31-production-preparation.js
```

## 🧪 Kiểm Tra Cấu Hình

### 1. **Script Validation**
```bash
# Kiểm tra cấu hình môi trường
node scripts/validation/day32-deployment-monitoring.js
```

### 2. **Test Kết Nối**
```bash
# Test database connection
npx prisma db push

# Test OpenAI API
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models
```

## 📊 Monitoring

### 1. **Health Check**
```bash
# Kiểm tra trạng thái hệ thống
curl http://localhost:3000/api/health
```

### 2. **Environment Variables Check**
```bash
# Script kiểm tra biến môi trường
node scripts/validation/day32-deployment-monitoring.js
```

## 🚨 Troubleshooting

### 1. **Lỗi NEXTAUTH_SECRET**
```bash
# Lỗi: "Please define NEXTAUTH_SECRET"
# Giải pháp: Tạo secret key mạnh
openssl rand -base64 32
```

### 2. **Lỗi OPENAI_API_KEY**
```bash
# Lỗi: "Invalid API key"
# Giải pháp: Kiểm tra và cập nhật API key
echo $OPENAI_API_KEY
```

### 3. **Lỗi DATABASE_URL**
```bash
# Lỗi: "Database connection failed"
# Giải pháp: Kiểm tra kết nối database
npx prisma db push
```

## 📝 Checklist

### Development Setup
- [ ] Copy `env.example` to `.env.local`
- [ ] Tạo `NEXTAUTH_SECRET` mạnh
- [ ] Cấu hình `NEXTAUTH_URL` cho local
- [ ] Thêm `OPENAI_API_KEY` hợp lệ
- [ ] Kiểm tra `DATABASE_URL`
- [ ] Test kết nối database
- [ ] Test OpenAI API

### Production Setup
- [ ] Cấu hình biến môi trường trên hosting platform
- [ ] Sử dụng HTTPS cho `NEXTAUTH_URL`
- [ ] Sử dụng database production
- [ ] Kiểm tra bảo mật
- [ ] Test toàn bộ hệ thống
- [ ] Monitoring và logging

## 🔗 Tài Liệu Tham Khảo

- [NextAuth.js Documentation](https://next-auth.js.org/configuration/options)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

## 📞 Hỗ Trợ

Nếu gặp vấn đề, hãy kiểm tra:
1. File logs trong thư mục `logs/`
2. Console output khi chạy ứng dụng
3. Network tab trong browser developer tools
4. Vercel deployment logs (nếu deploy trên Vercel) 