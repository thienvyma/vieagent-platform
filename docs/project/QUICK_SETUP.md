# 🚀 Hướng Dẫn Nhanh - Thiết Lập Biến Môi Trường

## ⚡ Cách Nhanh Nhất

### 1. Sử dụng Script Tự Động

**Windows (PowerShell):**
```powershell
# Mở PowerShell từ Start Menu hoặc sử dụng:
pwsh
# Hoặc
powershell.exe

# Sau đó chạy script đơn giản:
.\scripts\simple-setup.ps1

# Hoặc script đầy đủ:
.\scripts\setup-environment.ps1
```

**Linux/Mac (Node.js):**
```bash
# Chạy script Node.js
node scripts/setup-environment.js
```

### 2. Cấu Hình Thủ Công

**Bước 1: Copy template**
```bash
cp env.example .env.local
```

**Bước 2: Cập nhật các biến cần thiết**
```bash
# Mở file .env.local và cập nhật:
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
OPENAI_API_KEY="your-openai-key"
DATABASE_URL="file:./prisma/dev.db"
```

## 🔑 Cách Lấy Các Biến Môi Trường

### NEXTAUTH_SECRET
```bash
# Tạo tự động
openssl rand -base64 32
# Hoặc
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### NEXTAUTH_URL
- **Development**: `http://localhost:3000`
- **Production**: `https://your-domain.com`

### OPENAI_API_KEY
1. Đăng ký tại [OpenAI Platform](https://platform.openai.com)
2. Truy cập [API Keys](https://platform.openai.com/api-keys)
3. Tạo API key mới

### DATABASE_URL
- **Development**: `file:./prisma/dev.db`
- **Production**: `postgresql://username:password@host:port/database`

## 🚨 Khắc Phục Lỗi

### Lỗi PowerShell không nhận diện:
```powershell
# Thay vì "powershell", sử dụng:
pwsh
# Hoặc
powershell.exe
```

### Lỗi Execution Policy:
```powershell
# Chạy với quyền admin và thực thi:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Lỗi Encoding:
```powershell
# Sử dụng script đơn giản:
.\scripts\simple-setup.ps1
```

## 📋 Checklist Nhanh

- [ ] Copy `env.example` to `.env.local`
- [ ] Tạo `NEXTAUTH_SECRET` mạnh
- [ ] Cấu hình `NEXTAUTH_URL`
- [ ] Thêm `OPENAI_API_KEY`
- [ ] Kiểm tra `DATABASE_URL`
- [ ] Chạy `npm install`
- [ ] Chạy `npx prisma db push`
- [ ] Chạy `npm run dev`

## 🚨 Lưu Ý Quan Trọng

1. **Không commit file .env vào git**
2. **Bảo mật API keys và secrets**
3. **Sử dụng HTTPS cho production**
4. **Kiểm tra logs nếu gặp lỗi**

## 📖 Tài Liệu Chi Tiết

Xem file `ENVIRONMENT_SETUP_GUIDE.md` để biết thêm chi tiết. 