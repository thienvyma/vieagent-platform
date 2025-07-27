#!/bin/bash

# 🔧 MONITORING SETUP SCRIPT
# Script thiết lập monitoring system cho AI Agent Platform

set -e

echo "🚀 Setting up AI Agent Platform Monitoring..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

# Get the current directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

print_step "1. Checking project structure..."
cd "$PROJECT_DIR"

if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

print_status "Project structure validated"

print_step "2. Installing monitoring dependencies..."
npm install axios nodemailer cron pg-dump-restore

print_step "3. Creating monitoring directories..."
mkdir -p logs
mkdir -p backups
mkdir -p monitoring

print_step "4. Setting up environment variables..."
if [ ! -f ".env.local" ]; then
    print_warning ".env.local not found. Creating template..."
    cat > .env.local << 'EOF'
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
EOF
    print_status "Template .env.local created. Please update with your values."
fi

print_step "5. Setting up PM2 for process management..."
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    npm install -g pm2
fi

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
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
      time: true
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
EOF

print_step "6. Creating monitoring dashboard service..."
cat > scripts/start-monitoring.sh << 'EOF'
#!/bin/bash
# Start monitoring dashboard

echo "🔍 Starting AI Agent Platform Monitoring..."

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# Start the application with PM2
pm2 start ecosystem.config.js

# Show status
pm2 status

echo "✅ Monitoring started successfully!"
echo "📊 Dashboard: http://localhost:3001/dashboard/monitoring"
echo "📋 PM2 Logs: pm2 logs"
echo "🔄 Restart: pm2 restart all"
echo "⏹️  Stop: pm2 stop all"
EOF

chmod +x scripts/start-monitoring.sh

print_step "7. Creating stop monitoring script..."
cat > scripts/stop-monitoring.sh << 'EOF'
#!/bin/bash
# Stop monitoring services

echo "⏹️  Stopping AI Agent Platform Monitoring..."

pm2 stop all
pm2 delete all

echo "✅ Monitoring stopped successfully!"
EOF

chmod +x scripts/stop-monitoring.sh

print_step "8. Creating health check script..."
cat > scripts/health-check.sh << 'EOF'
#!/bin/bash
# Health check script

APP_URL="http://localhost:3001"
HEALTH_ENDPOINT="$APP_URL/api/health"

echo "🏥 Performing health check..."

# Check if application is running
if curl -f -s "$HEALTH_ENDPOINT" > /dev/null; then
    echo "✅ Application is healthy"
    
    # Get detailed health info
    HEALTH_DATA=$(curl -s "$HEALTH_ENDPOINT")
    echo "📊 Health Details:"
    echo "$HEALTH_DATA" | jq '.' 2>/dev/null || echo "$HEALTH_DATA"
    
    exit 0
else
    echo "❌ Application is not healthy"
    exit 1
fi
EOF

chmod +x scripts/health-check.sh

print_step "9. Creating log rotation script..."
cat > scripts/rotate-logs.sh << 'EOF'
#!/bin/bash
# Log rotation script

LOG_DIR="./logs"
BACKUP_DIR="./logs/archive"
DAYS_TO_KEEP=7

echo "🔄 Rotating logs..."

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Find and compress old logs
find "$LOG_DIR" -name "*.log" -type f -mtime +1 -exec gzip {} \;

# Move compressed logs to archive
find "$LOG_DIR" -name "*.log.gz" -type f -exec mv {} "$BACKUP_DIR/" \;

# Remove old archived logs
find "$BACKUP_DIR" -name "*.log.gz" -type f -mtime +$DAYS_TO_KEEP -delete

echo "✅ Log rotation completed"
EOF

chmod +x scripts/rotate-logs.sh

print_step "10. Setting up cron jobs..."
# Create cron job for log rotation
(crontab -l 2>/dev/null; echo "0 0 * * * cd $PROJECT_DIR && ./scripts/rotate-logs.sh") | crontab -

print_step "11. Creating monitoring documentation..."
cat > MONITORING_GUIDE.md << 'EOF'
# 🔍 AI Agent Platform Monitoring Guide

## Quick Start

### 1. Start Monitoring
```bash
./scripts/start-monitoring.sh
```

### 2. Check Status
```bash
pm2 status
```

### 3. View Logs
```bash
pm2 logs
```

### 4. Stop Monitoring
```bash
./scripts/stop-monitoring.sh
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
   ```bash
   pm2 logs ai-agent-platform
   ```

2. **Monitoring Not Running**
   ```bash
   pm2 restart monitoring
   ```

3. **High Memory Usage**
   ```bash
   pm2 restart ai-agent-platform
   ```

4. **Database Connection Issues**
   ```bash
   ./scripts/health-check.sh
   ```

### Log Locations

- Application: `./logs/app-combined.log`
- Monitoring: `./logs/monitoring-combined.log`
- Backup: `./logs/backup-combined.log`
- Archive: `./logs/archive/`

## Configuration

### Environment Variables

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
```bash
pm2 restart ai-agent-platform
./scripts/health-check.sh
```

### 2. Database Issues
```bash
# Check database connection
npm run db:generate
npm run db:push
```

### 3. High Resource Usage
```bash
# Restart with memory cleanup
pm2 restart all --update-env
```

### 4. Backup Failure
```bash
# Manual backup
npm run backup
```

## Support

For issues or questions:
1. Check logs: `pm2 logs`
2. Run health check: `./scripts/health-check.sh`
3. Review monitoring dashboard
4. Check environment variables
EOF

print_step "12. Final setup..."
# Make scripts executable
chmod +x scripts/*.js
chmod +x scripts/*.sh

print_status "✅ Monitoring setup completed successfully!"
echo
echo "🎉 Next Steps:"
echo "1. Update .env.local with your configuration"
echo "2. Run: ./scripts/start-monitoring.sh"
echo "3. Visit: http://localhost:3001/dashboard/monitoring"
echo "4. Check: pm2 status"
echo
echo "📚 Documentation: MONITORING_GUIDE.md"
echo "🔧 Configuration: ecosystem.config.js"
echo "📊 Dashboard: http://localhost:3001/dashboard/monitoring"
echo
echo "🚨 Important: Configure ALERT_EMAIL in .env.local for notifications" 