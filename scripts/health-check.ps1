# Health check script
$APP_URL = "http://localhost:3001"
$HEALTH_ENDPOINT = "$APP_URL/api/health"

Write-Host "🏥 Performing health check..." -ForegroundColor Blue
Write-Host "🔗 Checking: $HEALTH_ENDPOINT" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri $HEALTH_ENDPOINT -Method Get -TimeoutSec 10
    
    Write-Host "✅ Application is healthy" -ForegroundColor Green
    Write-Host "📊 Health Status: $($response.status)" -ForegroundColor Blue
    Write-Host "⏱️  Response Time: $($response.responseTime)ms" -ForegroundColor Blue
    Write-Host "🔄 Uptime: $([math]::Round($response.uptime / 60, 2)) minutes" -ForegroundColor Blue
    Write-Host "🏷️  Version: $($response.version)" -ForegroundColor Blue
    Write-Host "🌍 Environment: $($response.environment)" -ForegroundColor Blue
    
    Write-Host ""
    Write-Host "📊 System Checks:" -ForegroundColor Yellow
    Write-Host "  Database: $($response.checks.database.status) ($($response.checks.database.responseTime)ms)" -ForegroundColor $(if ($response.checks.database.status -eq "healthy") { "Green" } else { "Red" })
    Write-Host "  Memory: $($response.checks.memory.status) ($($response.checks.memory.percentage)%)" -ForegroundColor $(if ($response.checks.memory.status -eq "healthy") { "Green" } else { "Red" })
    Write-Host "  Disk: $($response.checks.disk.status)" -ForegroundColor $(if ($response.checks.disk.status -eq "healthy") { "Green" } else { "Red" })
    
    Write-Host ""
    Write-Host "🔧 External Services:" -ForegroundColor Yellow
    foreach ($service in $response.checks.services.PSObject.Properties) {
        $status = $service.Value.status
        $color = if ($status -eq "healthy") { "Green" } elseif ($status -eq "not_configured") { "Yellow" } else { "Red" }
        Write-Host "  $($service.Name): $status" -ForegroundColor $color
    }
    
    Write-Host ""
    Write-Host "💾 System Information:" -ForegroundColor Yellow
    Write-Host "  Node Version: $($response.system.nodeVersion)" -ForegroundColor Gray
    Write-Host "  Platform: $($response.system.platform)" -ForegroundColor Gray
    Write-Host "  Architecture: $($response.system.arch)" -ForegroundColor Gray
    Write-Host "  Process ID: $($response.system.pid)" -ForegroundColor Gray
    Write-Host "  Memory Used: $($response.system.memory.used)MB / $($response.system.memory.total)MB" -ForegroundColor Gray
    
    if ($response.status -eq "healthy") {
        Write-Host ""
        Write-Host "🎉 All systems are operational!" -ForegroundColor Green
        exit 0
    } else {
        Write-Host ""
        Write-Host "⚠️  System is degraded but operational" -ForegroundColor Yellow
        exit 1
    }
    
} catch {
    Write-Host "❌ Application is not healthy" -ForegroundColor Red
    Write-Host "🔍 Error Details: $($_.Exception.Message)" -ForegroundColor Red
    
    # Check if the application is running
    Write-Host ""
    Write-Host "🔍 Checking PM2 status..." -ForegroundColor Blue
    try {
        pm2 status
    } catch {
        Write-Host "❌ PM2 is not running or not installed" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "💡 Troubleshooting suggestions:" -ForegroundColor Yellow
    Write-Host "  1. Check if the application is running: pm2 status" -ForegroundColor Gray
    Write-Host "  2. Start the application: .\scripts\start-monitoring.ps1" -ForegroundColor Gray
    Write-Host "  3. Check logs: pm2 logs" -ForegroundColor Gray
    Write-Host "  4. Restart services: pm2 restart all" -ForegroundColor Gray
    
    exit 1
} 