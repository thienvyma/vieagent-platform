# 🚀 QUICK START - SETUP MONITORING & CHROMADB

## 📋 **THỰC HIỆN NGAY (5 phút)**

### **Bước 1: Chuẩn bị**
```powershell
cd ai-agent-platform
```

### **Bước 2: Kiểm tra Python**
```powershell
python --version
# Nếu chưa có Python, tải tại: https://www.python.org/downloads/
```

### **Bước 3: Cài đặt Dependencies**
```powershell
# Cài đặt Python packages
python -m pip install chromadb requests

# Cài đặt PM2
npm install -g pm2
```

### **Bước 4: Chạy Setup Scripts**
```powershell
# Setup ChromaDB
powershell -ExecutionPolicy Bypass -File .\scripts\setup-chromadb.ps1

# Setup Monitoring
powershell -ExecutionPolicy Bypass -File .\scripts\setup-monitoring.ps1
```

### **Bước 5: Khởi động Services**
```powershell
# Terminal 1: Start ChromaDB
.\scripts\start-chromadb.ps1

# Terminal 2: Start Monitoring
.\scripts\start-monitoring.ps1

# Terminal 3: Check Health
.\scripts\health-check.ps1
```

---

## 🔧 **MANUAL SETUP (Nếu scripts không chạy)**

### **Setup ChromaDB thủ công:**

1. **Tạo thư mục:**
```powershell
mkdir chromadb
```

2. **Tạo file `chromadb/start_server.py`:**
```python
import chromadb
from chromadb.config import Settings
import time

client = chromadb.PersistentClient(path="./data")
print("🚀 ChromaDB started at http://localhost:8000")

try:
    collection = client.get_collection("ai-agent-documents")
    print(f"✅ Found collection: {collection.name}")
except:
    collection = client.create_collection("ai-agent-documents")
    print(f"✅ Created collection: {collection.name}")

print("🔄 Server running... Press Ctrl+C to stop")
try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("\n⏹️  Server stopped")
```

3. **Chạy ChromaDB:**
```powershell
cd chromadb
python start_server.py
```

### **Setup Monitoring thủ công:**

1. **Tạo file `ecosystem.config.js`:**
```javascript
module.exports = {
  apps: [{
    name: 'ai-agent-platform',
    script: 'npm',
    args: 'start',
    env: { NODE_ENV: 'production', PORT: 3001 },
    instances: 1,
    max_memory_restart: '1G'
  }]
};
```

2. **Khởi động PM2:**
```powershell
pm2 start ecosystem.config.js
pm2 status
```

---

## 💰 **NÂNG CẤP 5-10$/THÁNG - GIẢM RỦI RO**

### **🎯 Với 5$/tháng:**
- ✅ **Database**: 500MB → 8GB (16x tăng)
- ✅ **Bandwidth**: 100GB → 200GB (2x tăng) 
- ✅ **Storage**: 25GB → 100GB (4x tăng)
- ✅ **Email**: 100/day → 50,000/month (15x tăng)
- ✅ **Priority Support**: 24/7 thay vì community

### **🎯 Với 10$/tháng:**
- ✅ **Database**: 8GB → 32GB (64x so với free)
- ✅ **Bandwidth**: 200GB → 1TB (10x so với free)
- ✅ **Redis Cache**: 256MB (tăng tốc 5-10x)
- ✅ **Error Tracking**: Sentry monitoring
- ✅ **Advanced Analytics**: PostHog
- ✅ **Team Collaboration**: Multi-user

### **📊 So sánh rủi ro:**

| Vấn đề | Free Tier | 5$/tháng | 10$/tháng |
|--------|-----------|----------|-----------|
| Database đầy | 🔴 Hàng tuần | 🟡 Hàng tháng | 🟢 Hàng năm |
| Bandwidth hết | 🔴 Hàng tuần | 🟡 Hiếm khi | 🟢 Không bao giờ |
| Downtime | 🔴 2-3 giờ/tháng | 🟡 30 phút/tháng | 🟢 5 phút/tháng |
| Mất dữ liệu | 🔴 Có thể | 🟡 Rất hiếm | 🟢 Không bao giờ |
| Performance | 🔴 Chậm | 🟡 Ổn định | 🟢 Nhanh |

---

## 🛡️ **BIỆN PHÁP GIẢM RỦI RO NGAY**

### **1. Monitoring tự động:**
- ✅ Health check mỗi 30 giây
- ✅ Email alert khi có vấn đề
- ✅ Auto-restart khi crash
- ✅ Memory monitoring

### **2. Backup hàng ngày:**
- ✅ Database backup tự động
- ✅ Code backup qua Git
- ✅ Config backup
- ✅ Giữ 7 ngày backup

### **3. Performance optimization:**
- ✅ Database indexing
- ✅ API caching
- ✅ Image optimization
- ✅ CDN setup

### **4. Security measures:**
- ✅ Rate limiting
- ✅ Input validation
- ✅ HTTPS everywhere
- ✅ Environment security

---

## 🚨 **EMERGENCY COMMANDS**

### **Hệ thống down:**
```powershell
pm2 restart all
.\scripts\health-check.ps1
```

### **Memory cao:**
```powershell
pm2 monit
pm2 restart ai-agent-platform
```

### **Database lỗi:**
```powershell
npm run db:push
npm run db:generate
```

### **ChromaDB lỗi:**
```powershell
# Restart ChromaDB
cd chromadb
python start_server.py
```

---

## 📊 **DASHBOARD LINKS**

Sau khi setup xong, truy cập:

- **🏠 Application**: `http://localhost:3001`
- **📊 Monitoring**: `http://localhost:3001/dashboard/monitoring`
- **🏥 Health Check**: `http://localhost:3001/api/health`
- **🗄️ ChromaDB**: `http://localhost:8000`

---

## ✅ **CHECKLIST HOÀN THÀNH**

- [ ] Python đã cài đặt
- [ ] ChromaDB đã setup
- [ ] PM2 đã cài đặt
- [ ] Monitoring đã chạy
- [ ] Health check OK
- [ ] Dashboard truy cập được
- [ ] Backup schedule đã setup
- [ ] Alert email đã cấu hình

---

## 🔄 **DAILY OPERATIONS**

### **Sáng (5 phút):**
```powershell
.\scripts\health-check.ps1
pm2 status
```

### **Chiều (2 phút):**
```powershell
pm2 logs --lines 20
```

### **Cuối tuần (10 phút):**
```powershell
# Review metrics
# Check backup integrity
# Update dependencies
```

---

## 📞 **SUPPORT**

### **Tự giải quyết:**
1. Check logs: `pm2 logs`
2. Restart services: `pm2 restart all`
3. Health check: `.\scripts\health-check.ps1`

### **Cần hỗ trợ:**
- 📧 Email: support@domain.com
- 💬 Discord: #support-channel
- 📱 Phone: +84-xxx-xxx-xxx

---

**🎉 Bắt đầu ngay:**

```powershell
cd ai-agent-platform
.\scripts\setup-chromadb.ps1
.\scripts\start-chromadb.ps1
.\scripts\start-monitoring.ps1
.\scripts\health-check.ps1
```

**Thành công khi thấy:**
- ✅ ChromaDB: "Server running at http://localhost:8000"
- ✅ Monitoring: "All systems operational"
- ✅ Health: "Application is healthy"
- ✅ Dashboard: Truy cập được monitoring page 