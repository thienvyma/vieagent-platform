// lib/storage-management/disk-monitor.ts
import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface DiskSpaceMonitor {
  // 📊 Real-time Monitoring
  diskMonitoring: {
    currentUsage: number;           // Current disk usage in GB
    totalCapacity: number;          // Total disk capacity in GB
    usagePercentage: number;        // Usage percentage (0-100)
    freeSpace: number;              // Available free space in GB
    growthRate: number;             // GB per day growth rate
    estimatedDaysUntilFull: number; // Estimated days until disk full
  };
  
  // 🚨 Alert Thresholds
  alertThresholds: {
    warningLevel: number;           // 80% - Start cleanup preparations
    criticalLevel: number;          // 90% - Trigger immediate cleanup
    emergencyLevel: number;         // 95% - Emergency cleanup + service pause
    diskFullLevel: number;          // 98% - Stop all uploads, cleanup only
  };
  
  // 📱 Notification System
  notificationChannels: {
    email: boolean;                 // Email alerts to admins
    slack: boolean;                 // Slack notifications  
    systemLog: boolean;             // System log entries
    dashboardAlert: boolean;        // Admin dashboard alerts
    userNotification: boolean;      // Notify users of space limitations
  };
}

export class DiskSpaceMonitoringService {
  private config: DiskSpaceMonitor;
  private historyFile: string;
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.config = this.getDefaultConfig();
    this.historyFile = join(process.cwd(), 'logs', 'disk-usage-history.json');
    this.ensureLogsDirectory();
  }

  private getDefaultConfig(): DiskSpaceMonitor {
    return {
      diskMonitoring: {
        currentUsage: 0,
        totalCapacity: 0,
        usagePercentage: 0,
        freeSpace: 0,
        growthRate: 0,
        estimatedDaysUntilFull: 999
      },
      alertThresholds: {
        warningLevel: 80,     // 80% - Start cleanup preparations
        criticalLevel: 90,    // 90% - Trigger immediate cleanup
        emergencyLevel: 95,   // 95% - Emergency cleanup + service pause
        diskFullLevel: 98     // 98% - Stop all uploads, cleanup only
      },
      notificationChannels: {
        email: false,         // TODO: Configure email service
        slack: false,         // TODO: Configure Slack webhook
        systemLog: true,      // Always log to system
        dashboardAlert: true, // Always show in dashboard
        userNotification: true // Always notify users
      }
    };
  }

  private ensureLogsDirectory(): void {
    const logsDir = join(process.cwd(), 'logs');
    try {
      if (!existsSync(logsDir)) {
        const fs = require('fs');
        fs.mkdirSync(logsDir, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create logs directory:', error);
    }
  }

  // 📊 Get current disk usage
  public getCurrentDiskUsage(): DiskSpaceMonitor['diskMonitoring'] {
    try {
      let diskInfo;
      
      // Windows PowerShell command
      if (process.platform === 'win32') {
        const command = `Get-WmiObject -Class Win32_LogicalDisk | Where-Object {$_.DriveType -eq 3} | Select-Object Size, FreeSpace | ConvertTo-Json`;
        const output = execSync(command, { encoding: 'utf8', shell: 'powershell' });
        const drives = JSON.parse(output);
        
        // Use C: drive or first available drive
        const drive = Array.isArray(drives) ? drives[0] : drives;
        const totalBytes = parseInt(drive.Size);
        const freeBytes = parseInt(drive.FreeSpace);
        const usedBytes = totalBytes - freeBytes;

        diskInfo = {
          currentUsage: usedBytes / (1024 * 1024 * 1024), // Convert to GB
          totalCapacity: totalBytes / (1024 * 1024 * 1024),
          freeSpace: freeBytes / (1024 * 1024 * 1024),
          usagePercentage: (usedBytes / totalBytes) * 100,
          growthRate: this.calculateGrowthRate(),
          estimatedDaysUntilFull: 0 // Will be calculated
        };
      } else {
        // Linux/Mac df command
        const output = execSync("df -h / | tail -1 | awk '{print $2, $3, $4, $5}'", { encoding: 'utf8' });
        const [total, used, available, percent] = output.trim().split(' ');
        
        diskInfo = {
          currentUsage: this.parseSize(used),
          totalCapacity: this.parseSize(total),
          freeSpace: this.parseSize(available),
          usagePercentage: parseFloat(percent.replace('%', '')),
          growthRate: this.calculateGrowthRate(),
          estimatedDaysUntilFull: 0
        };
      }

      // Calculate estimated days until full
      if (diskInfo.growthRate > 0) {
        diskInfo.estimatedDaysUntilFull = Math.ceil(diskInfo.freeSpace / diskInfo.growthRate);
      } else {
        diskInfo.estimatedDaysUntilFull = 999; // Essentially infinite
      }

      this.config.diskMonitoring = diskInfo;
      this.saveDiskUsageHistory(diskInfo);
      
      return diskInfo;
    } catch (error) {
      console.error('Error getting disk usage:', error);
      return this.config.diskMonitoring;
    }
  }

  // 📈 Calculate growth rate based on history
  private calculateGrowthRate(): number {
    try {
      if (!existsSync(this.historyFile)) {
        return 0;
      }

      const historyData = JSON.parse(readFileSync(this.historyFile, 'utf8'));
      if (!historyData || !historyData.entries || historyData.entries.length < 2) {
        return 0;
      }

      const entries = historyData.entries;
      const recent = entries.slice(-7); // Last 7 entries

      if (recent.length < 2) return 0;

      const firstEntry = recent[0];
      const lastEntry = recent[recent.length - 1];
      
      const timeDiffMs = new Date(lastEntry.timestamp).getTime() - new Date(firstEntry.timestamp).getTime();
      const timeDiffDays = timeDiffMs / (1000 * 60 * 60 * 24);
      
      if (timeDiffDays <= 0) return 0;

      const usageDiff = lastEntry.currentUsage - firstEntry.currentUsage;
      return usageDiff / timeDiffDays; // GB per day
    } catch (error) {
      console.error('Error calculating growth rate:', error);
      return 0;
    }
  }

  // 💾 Save disk usage history
  private saveDiskUsageHistory(diskInfo: DiskSpaceMonitor['diskMonitoring']): void {
    try {
      let historyData = { entries: [] };
      
      if (existsSync(this.historyFile)) {
        historyData = JSON.parse(readFileSync(this.historyFile, 'utf8'));
      }

      if (!historyData.entries) {
        historyData.entries = [];
      }

      // Add new entry
      historyData.entries.push({
        timestamp: new Date().toISOString(),
        ...diskInfo
      });

      // Keep only last 30 days of data
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      historyData.entries = historyData.entries.filter(entry => 
        new Date(entry.timestamp) > thirtyDaysAgo
      );

      writeFileSync(this.historyFile, JSON.stringify(historyData, null, 2));
    } catch (error) {
      console.error('Error saving disk usage history:', error);
    }
  }

  // 🔔 Check alerts and trigger notifications
  public checkAlertsAndNotify(): void {
    const diskInfo = this.getCurrentDiskUsage();
    const { usagePercentage } = diskInfo;
    const { warningLevel, criticalLevel, emergencyLevel, diskFullLevel } = this.config.alertThresholds;

    if (usagePercentage >= diskFullLevel) {
      this.triggerAlert('DISK_FULL', diskInfo);
    } else if (usagePercentage >= emergencyLevel) {
      this.triggerAlert('EMERGENCY', diskInfo);
    } else if (usagePercentage >= criticalLevel) {
      this.triggerAlert('CRITICAL', diskInfo);
    } else if (usagePercentage >= warningLevel) {
      this.triggerAlert('WARNING', diskInfo);
    }
  }

  // 📢 Trigger alert notifications
  private triggerAlert(level: 'WARNING' | 'CRITICAL' | 'EMERGENCY' | 'DISK_FULL', diskInfo: DiskSpaceMonitor['diskMonitoring']): void {
    const alertMessage = this.formatAlertMessage(level, diskInfo);
    
    // System log (always enabled)
    if (this.config.notificationChannels.systemLog) {
      console.log(`[DISK_ALERT_${level}] ${alertMessage}`);
      this.writeToLogFile(level, alertMessage, diskInfo);
    }

    // Dashboard alert (save to file for UI to read)
    if (this.config.notificationChannels.dashboardAlert) {
      this.saveDashboardAlert(level, alertMessage, diskInfo);
    }

    // User notification (save to notifications file)
    if (this.config.notificationChannels.userNotification) {
      this.saveUserNotification(level, alertMessage, diskInfo);
    }

    // TODO: Email alerts (when email service configured)
    // TODO: Slack alerts (when Slack webhook configured)
  }

  // 📝 Format alert message
  private formatAlertMessage(level: string, diskInfo: DiskSpaceMonitor['diskMonitoring']): string {
    const { usagePercentage, freeSpace, estimatedDaysUntilFull } = diskInfo;
    
    let message = `Disk space ${level.toLowerCase()}: ${usagePercentage.toFixed(1)}% used, ${freeSpace.toFixed(1)}GB free`;
    
    if (estimatedDaysUntilFull < 999) {
      message += `, estimated ${estimatedDaysUntilFull} days until full`;
    }

    switch (level) {
      case 'WARNING':
        message += '. Cleanup recommended.';
        break;
      case 'CRITICAL':
        message += '. Immediate cleanup required.';
        break;
      case 'EMERGENCY':
        message += '. Emergency cleanup initiated.';
        break;
      case 'DISK_FULL':
        message += '. Service restricted to cleanup only.';
        break;
    }

    return message;
  }

  // 📄 Write to log file
  private writeToLogFile(level: string, message: string, diskInfo: DiskSpaceMonitor['diskMonitoring']): void {
    try {
      const logFile = join(process.cwd(), 'logs', 'disk-alerts.log');
      const timestamp = new Date().toISOString();
      const logEntry = `${timestamp} [${level}] ${message}\n`;
      
      const fs = require('fs');
      fs.appendFileSync(logFile, logEntry);
    } catch (error) {
      console.error('Error writing to log file:', error);
    }
  }

  // 📊 Save dashboard alert
  private saveDashboardAlert(level: string, message: string, diskInfo: DiskSpaceMonitor['diskMonitoring']): void {
    try {
      const alertFile = join(process.cwd(), 'logs', 'dashboard-alerts.json');
      let alerts = [];
      
      if (existsSync(alertFile)) {
        alerts = JSON.parse(readFileSync(alertFile, 'utf8'));
      }

      alerts.unshift({
        id: Date.now(),
        level,
        message,
        diskInfo,
        timestamp: new Date().toISOString(),
        read: false
      });

      // Keep only last 50 alerts
      alerts = alerts.slice(0, 50);
      
      writeFileSync(alertFile, JSON.stringify(alerts, null, 2));
    } catch (error) {
      console.error('Error saving dashboard alert:', error);
    }
  }

  // 🔔 Save user notification
  private saveUserNotification(level: string, message: string, diskInfo: DiskSpaceMonitor['diskMonitoring']): void {
    try {
      const notificationFile = join(process.cwd(), 'logs', 'user-notifications.json');
      let notifications = [];
      
      if (existsSync(notificationFile)) {
        notifications = JSON.parse(readFileSync(notificationFile, 'utf8'));
      }

      notifications.unshift({
        id: Date.now(),
        type: 'disk_space',
        level,
        title: `Disk Space ${level}`,
        message,
        diskInfo,
        timestamp: new Date().toISOString(),
        read: false
      });

      // Keep only last 20 notifications
      notifications = notifications.slice(0, 20);
      
      writeFileSync(notificationFile, JSON.stringify(notifications, null, 2));
    } catch (error) {
      console.error('Error saving user notification:', error);
    }
  }

  // 🚀 Start monitoring
  public startMonitoring(intervalMinutes: number = 1): void {
    if (this.isMonitoring) {
      console.log('Disk monitoring already running');
      return;
    }

    console.log(`🚀 Starting disk space monitoring (every ${intervalMinutes} minute(s))`);
    
    // Initial check
    this.checkAlertsAndNotify();
    
    // Set up interval
    this.monitoringInterval = setInterval(() => {
      this.checkAlertsAndNotify();
    }, intervalMinutes * 60 * 1000);

    this.isMonitoring = true;
  }

  // ⏹️ Stop monitoring
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('🛑 Disk space monitoring stopped');
  }

  // 📈 Get monitoring status
  public getMonitoringStatus() {
    return {
      isMonitoring: this.isMonitoring,
      config: this.config,
      currentDiskInfo: this.getCurrentDiskUsage()
    };
  }

  // 🛠️ Utility function to parse size strings (e.g., "1.5G", "500M")
  private parseSize(sizeStr: string): number {
    const units = { 'K': 0.001, 'M': 1, 'G': 1024, 'T': 1024 * 1024 };
    const match = sizeStr.match(/^([\d.]+)([KMGT]?)$/i);
    
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase() || 'M';
    
    return value * (units[unit] || 1) / 1024; // Convert to GB
  }
}

// 🌟 Export singleton instance
export const diskMonitor = new DiskSpaceMonitoringService(); 