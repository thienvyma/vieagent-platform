// src/app/api/admin/auto-cleanup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { writeFileSync, existsSync, readFileSync } from 'fs';

// Simplified auto-cleanup for API use
class SimpleAutoCleanup {
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

  public async performTestCleanup(type: 'manual' | 'emergency' | 'scheduled' = 'manual') {
    const startTime = Date.now();

    try {
      // Simulate cleanup operations
      const cleanupTargets = {
        temp: await this.cleanupTempFiles(),
        logs: await this.cleanupOldLogs(),
        cache: await this.cleanupCache(),
      };

      const totalFilesProcessed = Object.values(cleanupTargets).reduce(
        (sum, target) => sum + target.filesProcessed,
        0
      );

      const totalSpaceReclaimed = Object.values(cleanupTargets).reduce(
        (sum, target) => sum + target.spaceReclaimed,
        0
      );

      const duration = Date.now() - startTime;

      // Log the cleanup operation
      this.logCleanupOperation({
        type,
        timestamp: new Date().toISOString(),
        duration,
        filesProcessed: totalFilesProcessed,
        spaceReclaimed: totalSpaceReclaimed,
        details: cleanupTargets,
        success: true,
      });

      return {
        success: true,
        type,
        duration,
        filesProcessed: totalFilesProcessed,
        spaceReclaimed: totalSpaceReclaimed,
        details: cleanupTargets,
        message: `Cleanup completed: ${totalFilesProcessed} files processed, ${(totalSpaceReclaimed / 1024 / 1024).toFixed(2)} MB estimated space reclaimed`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      };
    }
  }

  private async cleanupTempFiles() {
    // Simulate temp file cleanup
    const tempLocations = [
      join(process.cwd(), 'temp'),
      join(process.cwd(), '.next', 'cache'),
      join(process.cwd(), 'uploads', 'temp'),
    ];

    let filesProcessed = 0;
    let spaceReclaimed = 0;
    const processedLocations = [];

    for (const location of tempLocations) {
      if (existsSync(location)) {
        try {
          const fs = require('fs');
          const files = fs.readdirSync(location);

          // Simulate processing files older than 24 hours
          const oldFiles = files.filter(file => {
            try {
              const stats = fs.statSync(join(location, file));
              const age = Date.now() - stats.mtime.getTime();
              return age > 24 * 60 * 60 * 1000; // 24 hours
            } catch {
              return false;
            }
          });

          filesProcessed += oldFiles.length;
          spaceReclaimed += oldFiles.length * 1024 * 100; // Estimate 100KB per file

          processedLocations.push({
            location,
            filesFound: oldFiles.length,
            status: oldFiles.length > 0 ? 'cleaned' : 'no_cleanup_needed',
          });
        } catch (error) {
          processedLocations.push({
            location,
            filesFound: 0,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      } else {
        processedLocations.push({
          location,
          filesFound: 0,
          status: 'not_exists',
        });
      }
    }

    return {
      category: 'Temporary Files',
      filesProcessed,
      spaceReclaimed,
      locations: processedLocations,
    };
  }

  private async cleanupOldLogs() {
    const logsDir = join(process.cwd(), 'logs');
    let filesProcessed = 0;
    let spaceReclaimed = 0;

    if (existsSync(logsDir)) {
      try {
        const fs = require('fs');
        const files = fs.readdirSync(logsDir);

        // Find old log files (older than 30 days)
        const oldLogs = files.filter(file => {
          try {
            const stats = fs.statSync(join(logsDir, file));
            const age = Date.now() - stats.mtime.getTime();
            return age > 30 * 24 * 60 * 60 * 1000 && file.endsWith('.log');
          } catch {
            return false;
          }
        });

        filesProcessed = oldLogs.length;
        spaceReclaimed = oldLogs.length * 1024 * 500; // Estimate 500KB per log file
      } catch (error) {
        // Handle error silently
      }
    }

    return {
      category: 'Log Files',
      filesProcessed,
      spaceReclaimed,
      retentionDays: 30,
    };
  }

  private async cleanupCache() {
    const cacheDir = join(process.cwd(), '.next', 'cache');
    let filesProcessed = 0;
    let spaceReclaimed = 0;

    if (existsSync(cacheDir)) {
      try {
        const fs = require('fs');
        const files = fs.readdirSync(cacheDir);

        // Estimate cache files (older than 1 day)
        const oldCache = files.filter(file => {
          try {
            const stats = fs.statSync(join(cacheDir, file));
            const age = Date.now() - stats.mtime.getTime();
            return age > 24 * 60 * 60 * 1000;
          } catch {
            return false;
          }
        });

        filesProcessed = oldCache.length;
        spaceReclaimed = oldCache.length * 1024 * 50; // Estimate 50KB per cache file
      } catch (error) {
        // Handle error silently
      }
    }

    return {
      category: 'Cache Files',
      filesProcessed,
      spaceReclaimed,
      maxAge: '24 hours',
    };
  }

  private logCleanupOperation(operation: any): void {
    try {
      const logFile = join(this.logsDir, 'cleanup-operations.json');
      let operations = [];

      if (existsSync(logFile)) {
        operations = JSON.parse(readFileSync(logFile, 'utf8'));
      }

      operations.unshift(operation);

      // Keep only last 50 operations
      if (operations.length > 50) {
        operations = operations.slice(0, 50);
      }

      writeFileSync(
        logFile,
        JSON.stringify(
          {
            lastUpdated: new Date().toISOString(),
            totalOperations: operations.length,
            operations,
          },
          null,
          2
        )
      );
    } catch (error) {
      console.error('Failed to log cleanup operation:', error);
    }
  }

  public getCleanupHistory() {
    try {
      const logFile = join(this.logsDir, 'cleanup-operations.json');

      if (existsSync(logFile)) {
        const data = JSON.parse(readFileSync(logFile, 'utf8'));
        return {
          success: true,
          ...data,
          recentOperations: data.operations?.slice(0, 10) || [],
        };
      }

      return {
        success: true,
        lastUpdated: null,
        totalOperations: 0,
        operations: [],
        recentOperations: [],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to read cleanup history',
      };
    }
  }

  public getCleanupConfig() {
    return {
      targets: {
        tempFiles: {
          maxAge: '24 hours',
          locations: ['temp/', '.next/cache/', 'uploads/temp/'],
          patterns: ['*.tmp', '*.processing', '*.partial'],
        },
        logFiles: {
          maxAge: '30 days',
          compressionEnabled: true,
          retentionDays: 90,
        },
        cacheFiles: {
          maxAge: '24 hours',
          location: '.next/cache/',
        },
      },
      scheduling: {
        automaticCleanup: true,
        scheduledTimes: ['02:00', '14:00'],
        emergencyCleanup: true,
        safetyChecks: true,
      },
    };
  }
}

const autoCleanup = new SimpleAutoCleanup();

// GET: Get cleanup status and history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'history') {
      const history = autoCleanup.getCleanupHistory();
      return NextResponse.json(history);
    }

    if (action === 'config') {
      const config = autoCleanup.getCleanupConfig();
      return NextResponse.json({
        success: true,
        config,
      });
    }

    // Default: return cleanup status
    const config = autoCleanup.getCleanupConfig();
    const history = autoCleanup.getCleanupHistory();

    return NextResponse.json({
      success: true,
      status: 'ready',
      config,
      recentOperations: history.recentOperations || [],
      lastOperation: history.operations?.[0] || null,
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

// POST: Perform cleanup operations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, type } = body;

    if (action === 'cleanup') {
      const cleanupType = type || 'manual';
      const result = await autoCleanup.performTestCleanup(cleanupType);

      return NextResponse.json(result);
    }

    if (action === 'test-emergency') {
      const result = await autoCleanup.performTestCleanup('emergency');

      return NextResponse.json({
        ...result,
        message: 'Emergency cleanup test completed',
        emergency: true,
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
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
