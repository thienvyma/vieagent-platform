// src/app/api/admin/log-management/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { existsSync, readFileSync, statSync, readdirSync } from 'fs';
import { join } from 'path';

// Simple log management for API use
class SimpleLogManager {
  private logsDir: string;

  constructor() {
    this.logsDir = join(process.cwd(), 'logs');
  }

  public getLogStatus() {
    try {
      if (!existsSync(this.logsDir)) {
        return {
          exists: false,
          error: 'Logs directory not found',
        };
      }

      const files = readdirSync(this.logsDir);
      const logFiles = files.filter(file => file.endsWith('.log'));
      let totalSize = 0;
      let totalEntries = 0;

      const fileDetails = logFiles.map(file => {
        const filePath = join(this.logsDir, file);
        const stats = statSync(filePath);

        // Count log entries (rough estimate)
        try {
          const content = readFileSync(filePath, 'utf8');
          const lines = content.split('\n').filter(line => line.trim());
          totalEntries += lines.length;
        } catch (error) {
          // Skip count for unreadable files
        }

        totalSize += stats.size;

        return {
          name: file,
          size: stats.size,
          sizeFormatted: this.formatBytes(stats.size),
          modified: stats.mtime.toISOString(),
          category: this.getLogCategory(file),
        };
      });

      return {
        exists: true,
        directory: this.logsDir,
        summary: {
          totalFiles: logFiles.length,
          totalSize,
          totalSizeFormatted: this.formatBytes(totalSize),
          totalEntries: totalEntries,
          oldestFile:
            fileDetails.length > 0
              ? fileDetails.reduce((oldest, file) =>
                  new Date(file.modified) < new Date(oldest.modified) ? file : oldest
                ).modified
              : null,
          newestFile:
            fileDetails.length > 0
              ? fileDetails.reduce((newest, file) =>
                  new Date(file.modified) > new Date(newest.modified) ? file : newest
                ).modified
              : null,
        },
        files: fileDetails.sort(
          (a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime()
        ),
      };
    } catch (error) {
      return {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public getLogAnalytics(hours: number = 24) {
    try {
      if (!existsSync(this.logsDir)) {
        return { error: 'Logs directory not found' };
      }

      const files = readdirSync(this.logsDir);
      const logFiles = files.filter(file => file.endsWith('.log'));

      let totalLogs = 0;
      const logsByLevel: { [key: string]: number } = {};
      const logsByCategory: { [key: string]: number } = {};
      const errorMessages: { [key: string]: number } = {};
      const hourlyDistribution: { [key: string]: number } = {};

      const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000);

      logFiles.forEach(file => {
        const filePath = join(this.logsDir, file);

        try {
          const content = readFileSync(filePath, 'utf8');
          const lines = content.split('\n').filter(line => line.trim());

          lines.forEach(line => {
            try {
              const entry = JSON.parse(line);
              const entryTime = new Date(entry.timestamp);

              if (entryTime >= hoursAgo) {
                totalLogs++;

                // Count by level
                logsByLevel[entry.level] = (logsByLevel[entry.level] || 0) + 1;

                // Count by category
                const category = entry.category || 'general';
                logsByCategory[category] = (logsByCategory[category] || 0) + 1;

                // Track error messages
                if (['error', 'critical'].includes(entry.level)) {
                  errorMessages[entry.message] = (errorMessages[entry.message] || 0) + 1;
                }

                // Hourly distribution
                const hour = entryTime.getHours().toString().padStart(2, '0') + ':00';
                hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
              }
            } catch (error) {
              // Skip invalid JSON lines
            }
          });
        } catch (error) {
          // Skip unreadable files
        }
      });

      const topErrors = Object.entries(errorMessages)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([message, count]) => ({ message: message.substring(0, 100), count }));

      const errorCount = (logsByLevel.error || 0) + (logsByLevel.critical || 0);
      const errorRate = totalLogs > 0 ? (errorCount / totalLogs) * 100 : 0;

      return {
        success: true,
        timeRange: `Last ${hours} hours`,
        summary: {
          totalLogs,
          errorRate: Math.round(errorRate * 100) / 100,
          avgLogsPerHour: Math.round(totalLogs / hours),
          mostActiveHour:
            Object.entries(hourlyDistribution).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A',
        },
        distribution: {
          byLevel: logsByLevel,
          byCategory: logsByCategory,
          hourly: hourlyDistribution,
        },
        topErrors,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Analytics generation failed',
      };
    }
  }

  public testLogGeneration() {
    try {
      // Simulate log generation
      const testLogs = [
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          category: 'system',
          message: 'Log management test - info level',
          metadata: { test: true, component: 'log-api' },
        },
        {
          timestamp: new Date().toISOString(),
          level: 'warn',
          category: 'system',
          message: 'Log management test - warning level',
          metadata: { test: true, component: 'log-api' },
        },
        {
          timestamp: new Date().toISOString(),
          level: 'error',
          category: 'system',
          message: 'Log management test - error level (simulated)',
          metadata: { test: true, component: 'log-api', simulated: true },
        },
      ];

      // Write test logs to today's file
      const today = new Date().toISOString().split('T')[0];
      const testLogFile = join(this.logsDir, `system-${today}.log`);

      const fs = require('fs');
      if (!existsSync(this.logsDir)) {
        fs.mkdirSync(this.logsDir, { recursive: true });
      }

      testLogs.forEach(log => {
        const logLine = JSON.stringify(log) + '\n';
        fs.appendFileSync(testLogFile, logLine);
      });

      return {
        success: true,
        message: 'Test logs generated successfully',
        logsGenerated: testLogs.length,
        logFile: testLogFile,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Test log generation failed',
      };
    }
  }

  private getLogCategory(filename: string): string {
    if (filename.includes('error')) return 'error';
    if (filename.includes('system')) return 'system';
    if (filename.includes('api')) return 'api';
    if (filename.includes('auth')) return 'auth';
    if (filename.includes('chat')) return 'chat';
    return 'general';
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  public getLogConfig() {
    return {
      directory: this.logsDir,
      rotation: {
        enabled: true,
        schedule: 'daily',
        time: '02:00',
        maxFileSize: '100MB',
        maxFiles: 10,
      },
      retention: {
        days: 30,
        compressionEnabled: true,
      },
      levels: ['debug', 'info', 'warn', 'error', 'critical'],
      features: {
        autoRotation: true,
        errorAlerts: true,
        analytics: true,
        aggregation: true,
      },
    };
  }
}

const logManager = new SimpleLogManager();

// GET: Get log status and analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const hours = parseInt(searchParams.get('hours') || '24');

    if (action === 'analytics') {
      const analytics = logManager.getLogAnalytics(hours);
      return NextResponse.json(analytics);
    }

    if (action === 'config') {
      const config = logManager.getLogConfig();
      return NextResponse.json({
        success: true,
        config,
      });
    }

    // Default: return status
    const status = logManager.getLogStatus();
    const config = logManager.getLogConfig();

    return NextResponse.json({
      success: true,
      status,
      config,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST: Perform log operations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'test-logs') {
      const result = logManager.testLogGeneration();
      return NextResponse.json(result);
    }

    if (action === 'get-analytics') {
      const hours = body.hours || 24;
      const analytics = logManager.getLogAnalytics(hours);
      return NextResponse.json(analytics);
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
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
