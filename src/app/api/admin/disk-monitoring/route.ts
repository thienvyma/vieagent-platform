// src/app/api/admin/disk-monitoring/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Simplified disk monitoring class for API use
class SimpleDiskMonitor {
  private logsDir: string;

  constructor() {
    this.logsDir = join(process.cwd(), 'logs');
    this.ensureLogsDirectory();
  }

  private ensureLogsDirectory(): void {
    try {
      if (!existsSync(this.logsDir)) {
        const fs = require('fs');
        fs.mkdirSync(this.logsDir, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create logs directory:', error);
    }
  }

  public getCurrentDiskUsage() {
    try {
      if (process.platform === 'win32') {
        const command = `Get-WmiObject -Class Win32_LogicalDisk | Where-Object {$_.DriveType -eq 3} | Select-Object Size, FreeSpace | ConvertTo-Json`;
        const output = execSync(command, { encoding: 'utf8', shell: 'powershell' });
        const drives = JSON.parse(output);

        const drive = Array.isArray(drives) ? drives[0] : drives;
        const totalBytes = parseInt(drive.Size);
        const freeBytes = parseInt(drive.FreeSpace);
        const usedBytes = totalBytes - freeBytes;

        return {
          currentUsage: usedBytes / (1024 * 1024 * 1024),
          totalCapacity: totalBytes / (1024 * 1024 * 1024),
          freeSpace: freeBytes / (1024 * 1024 * 1024),
          usagePercentage: (usedBytes / totalBytes) * 100,
          platform: 'Windows',
        };
      } else {
        const output = execSync("df -h / | tail -1 | awk '{print $2, $3, $4, $5}'", {
          encoding: 'utf8',
        });
        const [total, used, available, percent] = output.trim().split(' ');

        return {
          currentUsage: this.parseSize(used),
          totalCapacity: this.parseSize(total),
          freeSpace: this.parseSize(available),
          usagePercentage: parseFloat(percent.replace('%', '')),
          platform: 'Unix/Linux',
        };
      }
    } catch (error) {
      return {
        error: error.message,
        currentUsage: 0,
        totalCapacity: 0,
        freeSpace: 0,
        usagePercentage: 0,
        platform: 'Unknown',
      };
    }
  }

  public checkAlertLevels(usagePercentage: number) {
    const alertThresholds = {
      warningLevel: 80,
      criticalLevel: 90,
      emergencyLevel: 95,
      diskFullLevel: 98,
    };

    if (usagePercentage >= alertThresholds.diskFullLevel) {
      return {
        level: 'DISK_FULL',
        color: 'red',
        message: 'Disk nearly full! Immediate action required.',
      };
    } else if (usagePercentage >= alertThresholds.emergencyLevel) {
      return { level: 'EMERGENCY', color: 'red', message: 'Emergency cleanup needed!' };
    } else if (usagePercentage >= alertThresholds.criticalLevel) {
      return {
        level: 'CRITICAL',
        color: 'orange',
        message: 'Critical disk usage. Cleanup recommended.',
      };
    } else if (usagePercentage >= alertThresholds.warningLevel) {
      return { level: 'WARNING', color: 'yellow', message: 'Disk usage high. Monitor closely.' };
    } else {
      return { level: 'OK', color: 'green', message: 'Disk usage normal.' };
    }
  }

  public saveDiskAlert(alert: any) {
    try {
      const alertFile = join(this.logsDir, 'disk-alerts.json');
      let alerts = [];

      if (existsSync(alertFile)) {
        alerts = JSON.parse(readFileSync(alertFile, 'utf8'));
      }

      alerts.unshift({
        id: Date.now(),
        ...alert,
        timestamp: new Date().toISOString(),
      });

      // Keep only last 50 alerts
      alerts = alerts.slice(0, 50);

      writeFileSync(alertFile, JSON.stringify(alerts, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving disk alert:', error);
      return false;
    }
  }

  private parseSize(sizeStr: string): number {
    const units = { K: 0.001, M: 1, G: 1024, T: 1024 * 1024 };
    const match = sizeStr.match(/^([\d.]+)([KMGT]?)$/i);

    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase() || 'M';

    return (value * (units[unit] || 1)) / 1024;
  }
}

const diskMonitor = new SimpleDiskMonitor();

// GET: Get current disk status
export async function GET(request: NextRequest) {
  try {
    const diskInfo = diskMonitor.getCurrentDiskUsage();
    const alertInfo = diskMonitor.checkAlertLevels(diskInfo.usagePercentage);

    return NextResponse.json({
      success: true,
      diskInfo: {
        ...diskInfo,
        currentUsage: Number(diskInfo.currentUsage.toFixed(2)),
        totalCapacity: Number(diskInfo.totalCapacity.toFixed(2)),
        freeSpace: Number(diskInfo.freeSpace.toFixed(2)),
        usagePercentage: Number(diskInfo.usagePercentage.toFixed(1)),
      },
      alert: alertInfo,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// POST: Test alert system and save alert
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'test-alert') {
      const diskInfo = diskMonitor.getCurrentDiskUsage();
      const alertInfo = diskMonitor.checkAlertLevels(diskInfo.usagePercentage);

      // Save the alert
      const alertSaved = diskMonitor.saveDiskAlert({
        level: alertInfo.level,
        message: alertInfo.message,
        diskInfo: diskInfo,
        testAlert: true,
      });

      return NextResponse.json({
        success: true,
        message: 'Alert system tested successfully',
        alertInfo,
        diskInfo,
        alertSaved,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Unknown action',
      },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
