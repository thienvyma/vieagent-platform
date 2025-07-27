# 💾 VIEAgent Platform - Hướng Dẫn Backup Toàn Diện

## 🎯 Tại Sao Cần Backup?

Trước khi deploy production, **LUÔN LUÔN** backup để:
- ✅ Tránh mất code khi deploy fail  
- ✅ Có thể rollback nhanh nếu có vấn đề
- ✅ Backup database & configuration
- ✅ Lưu git history để restore
- ✅ Peace of mind khi deploy

---

## ⚡ Quick Backup (2 phút)

### Option 1: Copy-Paste Manual
```bash
# Tạo folder backup
mkdir -p backups/quick_backup_$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/quick_backup_$(date +%Y%m%d_%H%M%S)"

# Copy essential files
cp -r src $BACKUP_DIR/
cp package.json $BACKUP_DIR/
cp next.config.js $BACKUP_DIR/
cp prisma/schema.prisma $BACKUP_DIR/
cp prisma/dev.db $BACKUP_DIR/ 2>/dev/null || true

# Save git info
git status > $BACKUP_DIR/git_status.txt
git log --oneline -5 > $BACKUP_DIR/git_log.txt

echo "✅ Quick backup complete: $BACKUP_DIR"
```

### Option 2: One-liner Zip
```bash
# Linux/Mac
tar -czf "backup_$(date +%Y%m%d_%H%M%S).tar.gz" --exclude="node_modules" --exclude=".next" --exclude=".env*" .

# Windows (PowerShell)
Compress-Archive -Path . -DestinationPath "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').zip" -Force
```

---

## 🛡️ Complete Backup (5 phút) - Khuyến Nghị

### 🖥️ Linux/Mac Users:
```bash
# Make script executable
chmod +x scripts/backup.sh

# Run backup
./scripts/backup.sh
```

### 🪟 Windows Users:
```powershell
# Allow script execution (run once)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Run backup
.\scripts\backup.ps1
```

### 📋 Backup sẽ tạo:
```
backups/vieagent_backup_YYYYMMDD_HHMMSS/
├── codebase/                    # Complete source code
├── schema.prisma                # Database schema
├── database_sqlite.db           # Local database (if exists)
├── package.json                 # Dependencies
├── next.config.js               # Configuration
├── git_info.txt                 # Git status & history
├── repository.bundle            # Complete git repository
├── system_info.txt              # Node/NPM versions
├── RESTORE_INSTRUCTIONS.md      # How to restore
└── BACKUP_SUMMARY.txt           # Backup report
```

---

## 🔄 Restore Instructions

### Nếu Deploy Thành Công:
✅ **Không cần làm gì** - giữ backup để đề phòng

### Nếu Deploy Fail:

#### Option 1: Rollback on Vercel
1. Vercel Dashboard → Project → Deployments  
2. Find previous working deployment
3. Click "..." → "Redeploy"

#### Option 2: Restore Local Code
```bash
# Linux/Mac
cd /path/to/your/project
mv ai-agent-platform ai-agent-platform-failed-$(date +%Y%m%d_%H%M%S)
cp -r backups/vieagent_backup_*/codebase ai-agent-platform
cd ai-agent-platform
npm install
npm run dev
```

```powershell
# Windows
Set-Location "C:\path\to\your\project"
Rename-Item "ai-agent-platform" "ai-agent-platform-failed-$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Copy-Item "backups\vieagent_backup_*\codebase" "ai-agent-platform" -Recurse
Set-Location "ai-agent-platform"
npm install
npm run dev
```

---

## 📦 Backup Options Comparison

| Method | Time | Size | Completeness | Use Case |
|--------|------|------|--------------|----------|
| **Copy-Paste** | 2 min | ~50MB | Basic | Quick protection |
| **Zip Archive** | 3 min | ~20MB | Good | Easy sharing |
| **Complete Script** | 5 min | ~60MB | Excellent | Production deploy |

---

## 🚀 Pre-Deployment Checklist

### 1. Run Complete Backup
```bash
# Choose your OS
./scripts/backup.sh          # Linux/Mac
.\scripts\backup.ps1          # Windows
```

### 2. Verify Backup
```bash
# Check backup exists
ls -la backups/

# Check backup size (should be >10MB)
du -sh backups/vieagent_backup_*

# Read backup summary
cat backups/vieagent_backup_*/BACKUP_SUMMARY.txt
```

### 3. Test Application Still Works
```bash
cd ai-agent-platform
npm run build  # Should complete successfully
npm run dev     # Should start without errors
```

### 4. Now Ready to Deploy! 🚀

---

## 💡 Pro Tips

### 🟢 Best Practices:
1. **Backup trước mọi major changes**
2. **Keep multiple backups** (don't overwrite)
3. **Test restore process** ít nhất 1 lần
4. **Document what changed** trong commit messages
5. **Backup database** trước khi migration

### 🟡 Storage Management:
```bash
# Clean old backups (keep last 5)
ls -t backups/ | tail -n +6 | xargs -I {} rm -rf backups/{}

# Check backup sizes
du -sh backups/*

# Archive old backups
tar -czf "archive_$(date +%Y%m).tar.gz" backups/old_*
```

### 🔴 Red Flags - Stop & Backup:
- Đang modify database schema
- Thay đổi authentication system  
- Update major dependencies
- Refactor core business logic
- Deploy lần đầu to production

---

## 🆘 Emergency Recovery

### Nếu Mất Code Hoàn Toàn:
1. **Don't panic!** 🧘‍♂️
2. Check backup folder: `ls backups/`
3. Find latest backup
4. Follow restore instructions in backup folder
5. Test everything works
6. Re-commit to git if needed

### Nếu Database Corrupted:
```bash
# Restore from backup
cp backups/vieagent_backup_*/database_sqlite.db prisma/dev.db

# Or reset and re-migrate
npm run db:reset
npx prisma db push
```

### Nếu Git History Mất:
```bash
# Restore from git bundle
git clone backups/vieagent_backup_*/repository.bundle recovered-repo
cd recovered-repo
git remote set-url origin https://github.com/thienvyma/vieagent-platform.git
git push -f origin main
```

---

## 📞 Support

### Nếu Backup Script Fail:
1. Try manual copy-paste method
2. Check error messages in terminal
3. Verify permissions: `chmod +x scripts/backup.sh`
4. Check disk space: `df -h`

### Nếu Restore Fail:
1. Read `RESTORE_INSTRUCTIONS.md` trong backup folder
2. Try step-by-step manual restore
3. Check file permissions
4. Verify Node/NPM versions match

---

## ✅ Backup Success Indicators

Sau khi chạy backup, check:
- [ ] **Backup folder created** với timestamp
- [ ] **Size >10MB** (should contain all source code)  
- [ ] **BACKUP_SUMMARY.txt** shows all components ✅
- [ ] **RESTORE_INSTRUCTIONS.md** exists
- [ ] **Original code** still works (`npm run dev`)

---

**🎯 Ready to Deploy? Follow `QUICK_START.md` or `DEPLOYMENT_GUIDE.md`**

*Remember: Better safe than sorry. A 5-minute backup can save hours of rebuild!* 