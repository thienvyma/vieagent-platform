# =============================================================================
# VIEAgent Platform - Complete Backup Script (PowerShell)
# =============================================================================
# Usage: .\scripts\backup.ps1
# Tạo backup toàn diện trước khi deploy production (Windows)

param(
    [string]$BackupName = ""
)

# Error handling
$ErrorActionPreference = "Stop"

# Colors for output
function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    switch ($Color) {
        "Red" { Write-Host $Message -ForegroundColor Red }
        "Green" { Write-Host $Message -ForegroundColor Green }
        "Yellow" { Write-Host $Message -ForegroundColor Yellow }
        "Blue" { Write-Host $Message -ForegroundColor Blue }
        "Cyan" { Write-Host $Message -ForegroundColor Cyan }
        default { Write-Host $Message }
    }
}

# Configuration
$BackupDir = "backups"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
if ($BackupName -eq "") {
    $BackupName = "vieagent_backup_$Timestamp"
}
$FullBackupPath = Join-Path $BackupDir $BackupName

# Create backup directory
Write-ColorOutput "🔄 Creating backup directory..." "Blue"
if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}
if (!(Test-Path $FullBackupPath)) {
    New-Item -ItemType Directory -Path $FullBackupPath | Out-Null
}

Write-ColorOutput "📦 Starting VIEAgent Platform Backup" "Green"
Write-ColorOutput "Backup Location: $FullBackupPath" "Blue"
Write-ColorOutput "Timestamp: $Timestamp" "Blue"
Write-Host ""

# =============================================================================
# 1. CODEBASE BACKUP
# =============================================================================
Write-ColorOutput "📁 1. Backing up codebase..." "Yellow"

# Exclude patterns
$ExcludePatterns = @(
    "node_modules",
    ".next",
    "dist",
    "build",
    "coverage",
    ".env*",
    "*.log",
    ".DS_Store",
    "Thumbs.db",
    "chromadb_data",
    "uploads",
    "backups"
)

# Create codebase backup directory
$CodebaseBackupPath = Join-Path $FullBackupPath "codebase"
New-Item -ItemType Directory -Path $CodebaseBackupPath -Force | Out-Null

# Copy files excluding patterns
Get-ChildItem -Path "." -Recurse | Where-Object {
    $item = $_
    $shouldExclude = $false
    foreach ($pattern in $ExcludePatterns) {
        if ($item.FullName -like "*$pattern*" -or $item.Name -like $pattern) {
            $shouldExclude = $true
            break
        }
    }
    -not $shouldExclude
} | ForEach-Object {
    $relativePath = $_.FullName.Substring((Get-Location).Path.Length + 1)
    $destinationPath = Join-Path $CodebaseBackupPath $relativePath
    $destinationDir = Split-Path $destinationPath -Parent
    
    if (!(Test-Path $destinationDir)) {
        New-Item -ItemType Directory -Path $destinationDir -Force | Out-Null
    }
    
    if ($_.PSIsContainer) {
        if (!(Test-Path $destinationPath)) {
            New-Item -ItemType Directory -Path $destinationPath | Out-Null
        }
    } else {
        Copy-Item $_.FullName $destinationPath -Force
    }
}

Write-ColorOutput "✅ Codebase backup completed" "Green"

# =============================================================================
# 2. DATABASE BACKUP
# =============================================================================
Write-ColorOutput "🗄️  2. Backing up database..." "Yellow"

# Check if database exists and backup
$SqliteDbPath = "prisma\dev.db"
if (Test-Path $SqliteDbPath) {
    Write-Host "  📋 SQLite database found - copying..."
    Copy-Item $SqliteDbPath (Join-Path $FullBackupPath "database_sqlite.db")
    Write-ColorOutput "  ✅ SQLite database backed up" "Green"
}

# Backup database schema
$SchemaPath = "prisma\schema.prisma"
if (Test-Path $SchemaPath) {
    Write-Host "  📋 Backing up Prisma schema..."
    Copy-Item $SchemaPath (Join-Path $FullBackupPath "schema.prisma")
}

Write-ColorOutput "✅ Database backup completed" "Green"

# =============================================================================
# 3. CONFIGURATION BACKUP
# =============================================================================
Write-ColorOutput "⚙️  3. Backing up configurations..." "Yellow"

# Backup all config files
$ConfigFiles = @(
    "package.json",
    "package-lock.json", 
    "tsconfig.json",
    "next.config.js",
    ".eslintrc.json",
    "tailwind.config.js",
    "postcss.config.js",
    "jest.config.js",
    "jest.setup.js",
    "vercel.json"
)

foreach ($file in $ConfigFiles) {
    if (Test-Path $file) {
        Write-Host "  📄 Backing up $file..."
        Copy-Item $file (Join-Path $FullBackupPath $file)
    }
}

# Backup environment template
if (Test-Path "env.example") {
    Copy-Item "env.example" (Join-Path $FullBackupPath "env.example")
    Write-Host "  📄 Environment template backed up"
}

Write-ColorOutput "✅ Configuration backup completed" "Green"

# =============================================================================
# 4. GIT BACKUP  
# =============================================================================
Write-ColorOutput "📝 4. Backing up Git information..." "Yellow"

$GitInfoPath = Join-Path $FullBackupPath "git_info.txt"

# Save current Git status
"=== Git Status ===" | Out-File $GitInfoPath
try {
    git status 2>&1 | Out-File $GitInfoPath -Append
} catch {
    "No git repository" | Out-File $GitInfoPath -Append
}

"`n=== Git Log (last 10 commits) ===" | Out-File $GitInfoPath -Append
try {
    git log --oneline -10 2>&1 | Out-File $GitInfoPath -Append
} catch {
    "No git history" | Out-File $GitInfoPath -Append
}

"`n=== Current Branch ===" | Out-File $GitInfoPath -Append
try {
    git branch --show-current 2>&1 | Out-File $GitInfoPath -Append
} catch {
    "No current branch" | Out-File $GitInfoPath -Append
}

"`n=== Remote URLs ===" | Out-File $GitInfoPath -Append
try {
    git remote -v 2>&1 | Out-File $GitInfoPath -Append
} catch {
    "No remotes" | Out-File $GitInfoPath -Append
}

# Create git bundle backup
try {
    $null = git rev-parse --git-dir 2>&1
    Write-Host "  📦 Creating Git bundle..."
    git bundle create (Join-Path $FullBackupPath "repository.bundle") --all 2>&1 | Out-Null
} catch {
    Write-Host "  ⚠️  Could not create git bundle"
}

Write-ColorOutput "✅ Git backup completed" "Green"

# =============================================================================
# 5. DEPENDENCIES BACKUP
# =============================================================================
Write-ColorOutput "📚 5. Backing up dependencies info..." "Yellow"

# Save npm list
try {
    Write-Host "  📋 Saving npm dependencies..."
    npm list --depth=0 2>&1 | Out-File (Join-Path $FullBackupPath "npm_list.txt")
    npm list --depth=0 --dev 2>&1 | Out-File (Join-Path $FullBackupPath "npm_list_dev.txt")
} catch {
    Write-Host "  ⚠️  Could not save npm dependencies"
}

# Save node/npm versions
$SystemInfoPath = Join-Path $FullBackupPath "system_info.txt"
"=== System Info ===" | Out-File $SystemInfoPath

try { "Node Version: $(node --version)" | Out-File $SystemInfoPath -Append } 
catch { "Node: Not installed" | Out-File $SystemInfoPath -Append }

try { "NPM Version: $(npm --version)" | Out-File $SystemInfoPath -Append }
catch { "NPM: Not installed" | Out-File $SystemInfoPath -Append }

"OS: $($env:OS) $($env:PROCESSOR_ARCHITECTURE)" | Out-File $SystemInfoPath -Append
"Date: $(Get-Date)" | Out-File $SystemInfoPath -Append
"PowerShell Version: $($PSVersionTable.PSVersion)" | Out-File $SystemInfoPath -Append

Write-ColorOutput "✅ Dependencies backup completed" "Green"

# =============================================================================
# 6. CREATE RESTORE INSTRUCTIONS
# =============================================================================
Write-ColorOutput "📖 6. Creating restore instructions..." "Yellow"

$RestoreInstructions = @"
# 🔄 VIEAgent Platform - Restore Instructions (Windows)

## 📋 Backup Information
- **Created**: $(Get-Date)
- **Backup Name**: $BackupName
- **Node Version**: $(try { node --version } catch { "Unknown" })
- **NPM Version**: $(try { npm --version } catch { "Unknown" })

## 🚨 How to Restore (if deployment fails)

### 1. Stop Current Application
``````powershell
# If running locally
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

# If deployed, rollback on Vercel dashboard
``````

### 2. Restore Codebase
``````powershell
# Navigate to project directory
Set-Location "C:\path\to\your\project"

# Backup current state (just in case)
if (Test-Path "ai-agent-platform") {
    Rename-Item "ai-agent-platform" "ai-agent-platform-failed-$(Get-Date -Format 'yyyyMMdd_HHmmss')"
}

# Restore from backup
Copy-Item "$FullBackupPath\codebase" "ai-agent-platform" -Recurse
Set-Location "ai-agent-platform"
``````

### 3. Restore Dependencies
``````powershell
# Clean install dependencies
Remove-Item "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "package-lock.json" -Force -ErrorAction SilentlyContinue
npm install

# Restore database
Copy-Item "$FullBackupPath\database_sqlite.db" "prisma\dev.db" -ErrorAction SilentlyContinue
``````

### 4. Restore Git Repository (if needed)
``````powershell
# If git history is lost, restore from bundle
git clone "$FullBackupPath\repository.bundle" . 2`>`$null

# Or manually setup git
git init
git add .
git commit -m "Restored from backup $Timestamp"
``````

### 5. Test Application
``````powershell
# Generate Prisma client
npm run db:generate

# Test build
npm run build

# Start development
npm run dev
``````

### 6. Verify Everything Works
- [ ] Application starts without errors
- [ ] Database connections work  
- [ ] All pages load correctly
- [ ] Authentication works
- [ ] API endpoints respond

## 📞 Emergency Contacts
If restore fails, contact:
- Developer support
- Check troubleshooting in DEPLOYMENT_GUIDE.md

## 🔍 Backup Contents
- ``codebase\`` - Complete source code
- ``schema.prisma`` - Database schema
- ``database_sqlite.db`` - Local database (if exists)
- ``*.json`` - Configuration files
- ``git_info.txt`` - Git repository status
- ``repository.bundle`` - Git repository backup
- ``system_info.txt`` - System environment info
"@

$RestoreInstructions | Out-File (Join-Path $FullBackupPath "RESTORE_INSTRUCTIONS.md")

Write-ColorOutput "✅ Restore instructions created" "Green"

# =============================================================================
# 7. CREATE BACKUP SUMMARY
# =============================================================================
Write-ColorOutput "📊 7. Creating backup summary..." "Yellow"

# Calculate backup size
$BackupSize = "{0:N2} MB" -f ((Get-ChildItem $FullBackupPath -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB)

# Count files
$FileCount = (Get-ChildItem $FullBackupPath -Recurse -File).Count

# Create summary
$BackupSummary = @"
=== VIEAgent Platform Backup Summary ===

Backup Name: $BackupName
Created: $(Get-Date)
Size: $BackupSize
Files: $FileCount

Components Backed Up:
✅ Source Code (excluding node_modules, .next, etc.)
✅ Database Schema (prisma/schema.prisma)
$(if (Test-Path "prisma\dev.db") { "✅ SQLite Database (prisma/dev.db)" } else { "❌ No SQLite Database found" })
✅ Configuration Files (package.json, next.config.js, etc.)
✅ Git Repository Information
$(try { $null = git rev-parse --git-dir 2>&1; "✅ Git Bundle" } catch { "❌ No Git Repository" })
✅ Dependencies Information
✅ System Environment Info
✅ Restore Instructions

Backup Location: $FullBackupPath

Next Steps:
1. Verify backup integrity
2. Test restore process (recommended)
3. Proceed with deployment
4. Keep this backup until deployment is confirmed stable
"@

$BackupSummary | Out-File (Join-Path $FullBackupPath "BACKUP_SUMMARY.txt")

Write-ColorOutput "✅ Backup summary created" "Green"

# =============================================================================
# FINAL REPORT
# =============================================================================
Write-Host ""
Write-ColorOutput "🎉 BACKUP COMPLETED SUCCESSFULLY!" "Green"
Write-Host ""
Write-ColorOutput "📊 Backup Summary:" "Blue"
Write-Host "  📁 Location: $FullBackupPath"
Write-Host "  💾 Size: $BackupSize"
Write-Host "  📄 Files: $FileCount"
Write-Host ""
Write-ColorOutput "📋 What's backed up:" "Yellow"
Write-Host "  ✅ Complete source code"
Write-Host "  ✅ Database schema & data"
Write-Host "  ✅ Configuration files"
Write-Host "  ✅ Git repository"
Write-Host "  ✅ Dependencies info"
Write-Host "  ✅ Restore instructions"
Write-Host ""
Write-ColorOutput "🔄 To restore if needed:" "Blue"
Write-Host "  📖 Read: $FullBackupPath\RESTORE_INSTRUCTIONS.md"
Write-Host ""
Write-ColorOutput "✨ Ready for deployment! Your code is safely backed up." "Green"
Write-Host ""

# Make backup read-only to prevent accidental modifications
Get-ChildItem $FullBackupPath -Recurse | ForEach-Object {
    $_.Attributes = $_.Attributes -bor "ReadOnly"
}

exit 0 