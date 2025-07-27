# 🔧 MONITORING SETUP SCRIPT (Windows PowerShell)
# Script thiết lập monitoring system cho AI Agent Platform

param(
    [switch]$SkipPM2,
    [switch]$DevMode
)

# Colors for output
$colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
    White = "White"
}

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $colors.Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $colors.Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $colors.Red
}

function Write-Step {
    param([string]$Message)
    Write-Host "[STEP] $Message" -ForegroundColor $colors.Blue
}

Write-Host "🚀 Setting up AI Agent Platform Monitoring..." -ForegroundColor $colors.Blue

# Check if Node.js is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js is not installed. Please install Node.js first."
    exit 1
}

# Check if npm is installed
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm is not installed. Please install npm first."
    exit 1
}

# Get the current directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Split-Path -Parent $scriptDir

Write-Step "1. Checking project structure..."
Set-Location $projectDir

if (-not (Test-Path "package.json")) {
    Write-Error "package.json not found. Please run this script from the project root."
    exit 1
}

Write-Status "Project structure validated"

Write-Step "2. Installing monitoring dependencies..."
npm install axios nodemailer cron

Write-Step "3. Creating monitoring directories..."
if (-not (Test-Path "logs")) { New-Item -ItemType Directory -Path "logs" -Force }
if (-not (Test-Path "backups")) { New-Item -ItemType Directory -Path "backups" -Force }
if (-not (Test-Path "monitoring")) { New-Item -ItemType Directory -Path "monitoring" -Force }

Write-Step "4. Setting up environment variables..."
if (-not (Test-Path ".env.local")) {
    Write-Warning ".env.local not found. Creating template..."
    @"
# MONITORING CONFIGURATION
MONITORING_ENABLED=true
MONITORING_INTERVAL=300000
ALERT_EMAIL=your-email@example.com

# BACKUP CONFIGURATION
BACKUP_ENABLED=true
BACKUP_RETENTION_DAYS=7

# THRESHOLDS
DATABASE_SIZE_THRESHOLD=419430400
BANDWIDTH_THRESHOLD=85899345920
STORAGE_THRESHOLD=21474836480
VECTOR_COUNT_THRESHOLD=800000
EMAIL_COUNT_THRESHOLD=80
MEMORY_THRESHOLD=90
RESPONSE_TIME_THRESHOLD=5000
"@ | Out-File -FilePath ".env.local" -Encoding utf8
    Write-Status "Template .env.local created. Please update with your values."
}

if (-not $SkipPM2) {
    Write-Step "5. Setting up PM2 for process management..."
    if (-not (Get-Command pm2 -ErrorAction SilentlyContinue)) {
        Write-Status "Installing PM2..."
        npm install -g pm2
        npm install -g pm2-windows-startup
        pm2-startup install
    }

    # Create PM2 ecosystem file
    Write-Step "6. Creating PM2 ecosystem configuration..."
    @"
module.exports = {
  apps: [
    {
      name: 'ai-agent-platform',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/app-error.log',
      out_file: './logs/app-out.log',
      log_file: './logs/app-combined.log',
      time: true,
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'monitoring',
      script: './scripts/monitor-free-tier.js',
      cron_restart: '*/5 * * * *',
      autorestart: false,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/monitoring-error.log',
      out_file: './logs/monitoring-out.log',
      log_file: './logs/monitoring-combined.log',
      time: true
    },
    {
      name: 'backup',
      script: './scripts/backup-free-tier.js',
      cron_restart: '0 2 * * *',
      autorestart: false,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/backup-error.log',
      out_file: './logs/backup-out.log',
      log_file: './logs/backup-combined.log',
      time: true
    }
  ]
};
"@ | Out-File -FilePath "ecosystem.config.js" -Encoding utf8
}

Write-Step "7. Creating monitoring scripts..."

# Create start monitoring script
@"
# Start monitoring dashboard
Write-Host "🔍 Starting AI Agent Platform Monitoring..." -ForegroundColor Blue

# Load environment variables
if (Test-Path ".env.local") {
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2])
        }
    }
}

# Start the application with PM2
pm2 start ecosystem.config.js

# Show status
pm2 status

Write-Host "✅ Monitoring started successfully!" -ForegroundColor Green
Write-Host "📊 Dashboard: http://localhost:3001/dashboard/monitoring" -ForegroundColor Blue
Write-Host "📋 PM2 Logs: pm2 logs" -ForegroundColor Blue
Write-Host "🔄 Restart: pm2 restart all" -ForegroundColor Blue
Write-Host "⏹️  Stop: pm2 stop all" -ForegroundColor Blue
"@ | Out-File -FilePath "scripts/start-monitoring.ps1" -Encoding utf8

# Create stop monitoring script
@"
# Stop monitoring services
Write-Host "⏹️  Stopping AI Agent Platform Monitoring..." -ForegroundColor Yellow

pm2 stop all
pm2 delete all

Write-Host "✅ Monitoring stopped successfully!" -ForegroundColor Green
"@ | Out-File -FilePath "scripts/stop-monitoring.ps1" -Encoding utf8

# Create health check script
@"
# Health check script
`$APP_URL = "http://localhost:3001"
`$HEALTH_ENDPOINT = "`$APP_URL/api/health"

Write-Host "🏥 Performing health check..." -ForegroundColor Blue

try {
    `$response = Invoke-RestMethod -Uri `$HEALTH_ENDPOINT -Method Get -TimeoutSec 10
    Write-Host "✅ Application is healthy" -ForegroundColor Green
    
    Write-Host "📊 Health Details:" -ForegroundColor Blue
    `$response | ConvertTo-Json -Depth 10 | Write-Host
    
    exit 0
} catch {
    Write-Host "❌ Application is not healthy: `$(`$_.Exception.Message)" -ForegroundColor Red
    exit 1
}
"@ | Out-File -FilePath "scripts/health-check.ps1" -Encoding utf8

# Create log rotation script
@"
# Log rotation script
`$LOG_DIR = "./logs"
`$BACKUP_DIR = "./logs/archive"
`$DAYS_TO_KEEP = 7

Write-Host "🔄 Rotating logs..." -ForegroundColor Blue

# Create backup directory
if (-not (Test-Path `$BACKUP_DIR)) {
    New-Item -ItemType Directory -Path `$BACKUP_DIR -Force
}

# Find and compress old logs
Get-ChildItem -Path `$LOG_DIR -Name "*.log" | Where-Object { 
    (Get-Item (Join-Path `$LOG_DIR `$_)).LastWriteTime -lt (Get-Date).AddDays(-1) 
} | ForEach-Object {
    `$logFile = Join-Path `$LOG_DIR `$_
    `$gzFile = Join-Path `$BACKUP_DIR "`$_.gz"
    
    # Compress using 7zip if available, otherwise copy
    if (Get-Command 7z -ErrorAction SilentlyContinue) {
        7z a `$gzFile `$logFile
        Remove-Item `$logFile
    } else {
        Copy-Item `$logFile `$gzFile
        Remove-Item `$logFile
    }
}

# Remove old archived logs
Get-ChildItem -Path `$BACKUP_DIR -Name "*.gz" | Where-Object { 
    (Get-Item (Join-Path `$BACKUP_DIR `$_)).LastWriteTime -lt (Get-Date).AddDays(-`$DAYS_TO_KEEP) 
} | ForEach-Object {
    Remove-Item (Join-Path `$BACKUP_DIR `$_)
}

Write-Host "✅ Log rotation completed" -ForegroundColor Green
"@ | Out-File -FilePath "scripts/rotate-logs.ps1" -Encoding utf8

Write-Step "8. Creating monitoring documentation..."
@"
# 🔍 AI Agent Platform Monitoring Guide (Windows)

## Quick Start

### 1. Start Monitoring
```powershell
.\scripts\start-monitoring.ps1
```

### 2. Check Status
```powershell
pm2 status
```

### 3. View Logs
```powershell
pm2 logs
```

### 4. Stop Monitoring
```powershell
.\scripts\stop-monitoring.ps1
```

## Monitoring Components

### 1. Health Check Endpoint
- URL: `http://localhost:3001/api/health`
- Checks: Database, Memory, Disk, External Services
- Auto-refresh: Every 30 seconds

### 2. Monitoring Dashboard
- URL: `http://localhost:3001/dashboard/monitoring`
- Real-time system metrics
- Service status indicators
- Alert notifications

### 3. Automated Monitoring
- Runs every 5 minutes
- Checks all system components
- Sends alerts on critical issues
- Logs all monitoring data

### 4. Backup System
- Runs daily at 2 AM
- Backs up database, vectors, assets
- Retains 7 days of backups
- Automatic cleanup

## Windows-Specific Commands

### PowerShell Scripts
```powershell
# Start monitoring
.\scripts\start-monitoring.ps1

# Stop monitoring
.\scripts\stop-monitoring.ps1

# Health check
.\scripts\health-check.ps1

# Log rotation
.\scripts\rotate-logs.ps1
```

### PM2 Commands
```powershell
# Install PM2 for Windows
npm install -g pm2
npm install -g pm2-windows-startup
pm2-startup install

# Start services
pm2 start ecosystem.config.js

# Monitor services
pm2 monit

# View logs
pm2 logs

# Restart services
pm2 restart all
```

## Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Database Size | 400MB | 480MB |
| Memory Usage | 70% | 90% |
| Response Time | 2000ms | 5000ms |
| Disk Usage | 80% | 95% |
| Vector Count | 800K | 950K |

## Troubleshooting

### Common Issues

1. **Application Not Starting**
   ```powershell
   pm2 logs ai-agent-platform
   ```

2. **Monitoring Not Running**
   ```powershell
   pm2 restart monitoring
   ```

3. **High Memory Usage**
   ```powershell
   pm2 restart ai-agent-platform
   ```

4. **Database Connection Issues**
   ```powershell
   .\scripts\health-check.ps1
   ```

### Log Locations

- Application: `./logs/app-combined.log`
- Monitoring: `./logs/monitoring-combined.log`
- Backup: `./logs/backup-combined.log`
- Archive: `./logs/archive/`

## Configuration

### Environment Variables (.env.local)

```bash
# Monitoring
MONITORING_ENABLED=true
MONITORING_INTERVAL=300000
ALERT_EMAIL=your-email@example.com

# Backup
BACKUP_ENABLED=true
BACKUP_RETENTION_DAYS=7

# Thresholds
DATABASE_SIZE_THRESHOLD=419430400
MEMORY_THRESHOLD=90
RESPONSE_TIME_THRESHOLD=5000
```

### PM2 Configuration

Edit `ecosystem.config.js` to modify:
- Memory limits
- Restart policies
- Log locations
- Cron schedules

## Best Practices

1. **Regular Health Checks**
   - Check dashboard daily
   - Monitor alert emails
   - Review logs weekly

2. **Backup Verification**
   - Test restore procedures monthly
   - Verify backup integrity
   - Monitor backup sizes

3. **Performance Optimization**
   - Monitor response times
   - Check memory usage trends
   - Optimize slow queries

4. **Security Monitoring**
   - Monitor failed login attempts
   - Check for unusual traffic
   - Review error logs

## Emergency Procedures

### 1. Application Down
```powershell
pm2 restart ai-agent-platform
.\scripts\health-check.ps1
```

### 2. Database Issues
```powershell
# Check database connection
npm run db:generate
npm run db:push
```

### 3. High Resource Usage
```powershell
# Restart with memory cleanup
pm2 restart all --update-env
```

### 4. Backup Failure
```powershell
# Manual backup
npm run backup
```

## Windows Task Scheduler (Alternative to Cron)

For automated tasks without PM2:

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (e.g., Daily at 2 AM)
4. Set action: Start a program
5. Program: `powershell.exe`
6. Arguments: `-File "C:\path\to\project\scripts\backup-free-tier.js"`

## Support

For issues or questions:
1. Check logs: `pm2 logs`
2. Run health check: `.\scripts\health-check.ps1`
3. Review monitoring dashboard
4. Check environment variables
"@ | Out-File -FilePath "MONITORING_GUIDE_WINDOWS.md" -Encoding utf8

Write-Step "9. Final setup..."
Write-Status "✅ Monitoring setup completed successfully!"
Write-Host ""
Write-Host "🎉 Next Steps:" -ForegroundColor $colors.Blue
Write-Host "1. Update .env.local with your configuration"
Write-Host "2. Run: .\scripts\start-monitoring.ps1"
Write-Host "3. Visit: http://localhost:3001/dashboard/monitoring"
Write-Host "4. Check: pm2 status"
Write-Host ""
Write-Host "📚 Documentation: MONITORING_GUIDE_WINDOWS.md" -ForegroundColor $colors.Green
Write-Host "🔧 Configuration: ecosystem.config.js" -ForegroundColor $colors.Green
Write-Host "📊 Dashboard: http://localhost:3001/dashboard/monitoring" -ForegroundColor $colors.Green
Write-Host ""
Write-Host "🚨 Important: Configure ALERT_EMAIL in .env.local for notifications" -ForegroundColor $colors.Yellow

if ($DevMode) {
    Write-Host ""
    Write-Host "🔧 Development Mode: Starting monitoring now..." -ForegroundColor $colors.Blue
    & ".\scripts\start-monitoring.ps1"
} 