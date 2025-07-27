# Start monitoring dashboard
Write-Host "🔍 Starting AI Agent Platform Monitoring..." -ForegroundColor Blue

# Load environment variables
if (Test-Path ".env.local") {
    Write-Host "📄 Loading environment variables..." -ForegroundColor Green
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2])
        }
    }
}

# Check if PM2 is installed
if (-not (Get-Command pm2 -ErrorAction SilentlyContinue)) {
    Write-Host "❌ PM2 is not installed. Installing now..." -ForegroundColor Red
    npm install -g pm2
    npm install -g pm2-windows-startup
}

# Start the application with PM2
Write-Host "🚀 Starting services with PM2..." -ForegroundColor Blue
pm2 start ecosystem.config.js

# Show status
Write-Host "📊 Service Status:" -ForegroundColor Blue
pm2 status

Write-Host ""
Write-Host "✅ Monitoring started successfully!" -ForegroundColor Green
Write-Host "📊 Dashboard: http://localhost:3001/dashboard/monitoring" -ForegroundColor Blue
Write-Host "🏥 Health Check: http://localhost:3001/api/health" -ForegroundColor Blue
Write-Host "📋 PM2 Logs: pm2 logs" -ForegroundColor Blue
Write-Host "🔄 Restart: pm2 restart all" -ForegroundColor Blue
Write-Host "⏹️  Stop: pm2 stop all" -ForegroundColor Blue
Write-Host ""
Write-Host "🔍 Monitoring Commands:" -ForegroundColor Yellow
Write-Host "  pm2 monit          - Interactive monitoring"
Write-Host "  pm2 logs           - View all logs"
Write-Host "  pm2 logs monitoring - View monitoring logs"
Write-Host "  pm2 restart all    - Restart all services"
Write-Host "  pm2 stop all       - Stop all services" 