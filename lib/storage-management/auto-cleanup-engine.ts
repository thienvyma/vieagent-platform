// lib/storage-management/auto-cleanup-engine.ts
import { execSync } from 'child_process';
import { readdir, stat, unlink, rmdir, readFile, writeFile } from 'fs/promises';
import { join, extname } from 'path';
import { writeFileSync, readFileSync, existsSync } from 'fs';

export interface AutoCleanupEngine {
  // 🎯 Cleanup Targets
  cleanupTargets: {
    tempFiles: {
      location: string[];           // ['/tmp', '/uploads/temp', '/processing']
      maxAge: number;               // Hours before cleanup (default: 24h)
      filePatterns: string[];       // ['*.tmp', '*.processing', '*.partial']
      sizeThreshold: number;        // MB, cleanup if folder > threshold
    };
    
    logFiles: {
      maxAge: number;               // Days before archive (default: 30)
      maxSize: number;              // MB per log file (default: 100MB)
      compressionEnabled: boolean;  // Compress old logs
      archiveLocation: string;      // Archive folder path
      retentionDays: number;        // Days before permanent deletion (default: 90)
    };
    
    uploadsFolder: {
      processedFiles: number;       // Days before cleanup processed files (7)
      failedUploads: number;        // Hours before cleanup failed uploads (48h)
      orphanedFiles: number;        // Hours before cleanup orphaned files (24h)
      quarantineFiles: number;      // Days before cleanup quarantine (30)
    };
  };
  
  // 🔄 Cleanup Scheduling
  cleanupScheduling: {
    automaticCleanup: boolean;      // Enable automatic cleanup
    scheduledTimes: string[];       // ['02:00', '14:00'] - Daily cleanup times
    emergencyCleanup: boolean;      // Immediate cleanup when disk critical
    cleanupPriority: string[];      // ['temp', 'logs', 'uploads', 'backups']
    safetyChecks: boolean;          // Verify files not in use before deletion
  };
  
  // 📊 Cleanup Analytics
  cleanupAnalytics: {
    totalSpaceReclaimed: number;    // GB reclaimed from cleanup
    filesDeleted: number;           // Total files deleted
    avgCleanupTime: number;         // Average cleanup duration in minutes
    cleanupFrequency: number;       // Cleanups per day
    errorRate: number;              // % of cleanup operations that failed
  };
}

export class AutoCleanupService {
  private config: AutoCleanupEngine;
  private isRunning: boolean = false;
  private cleanupHistory: any[] = [];
  private logFile: string;

  constructor() {
    this.config = this.getDefaultConfig();
    this.logFile = join(process.cwd(), 'logs', 'cleanup-operations.json');
    this.ensureLogsDirectory();
  }

  private getDefaultConfig(): AutoCleanupEngine {
    return {
      cleanupTargets: {
        tempFiles: {
          location: [
            join(process.cwd(), 'temp'),
            join(process.cwd(), 'uploads', 'temp'),
            join(process.cwd(), 'processing'),
            join(process.cwd(), '.next', 'cache')
          ],
          maxAge: 24, // 24 hours
          filePatterns: ['*.tmp', '*.processing', '*.partial', '*.cache'],
          sizeThreshold: 100 // 100MB
        },
        logFiles: {
          maxAge: 30, // 30 days
          maxSize: 100, // 100MB
          compressionEnabled: true,
          archiveLocation: join(process.cwd(), 'logs', 'archive'),
          retentionDays: 90
        },
        uploadsFolder: {
          processedFiles: 7, // 7 days
          failedUploads: 48, // 48 hours
          orphanedFiles: 24, // 24 hours
          quarantineFiles: 30 // 30 days
        }
      },
      cleanupScheduling: {
        automaticCleanup: true,
        scheduledTimes: ['02:00', '14:00'], // 2 AM and 2 PM
        emergencyCleanup: true,
        cleanupPriority: ['temp', 'logs', 'uploads', 'cache'],
        safetyChecks: true
      },
      cleanupAnalytics: {
        totalSpaceReclaimed: 0,
        filesDeleted: 0,
        avgCleanupTime: 0,
        cleanupFrequency: 2, // Default 2x daily
        errorRate: 0
      }
    };
  }

  private ensureLogsDirectory(): void {
    try {
      const logsDir = join(process.cwd(), 'logs');
      if (!existsSync(logsDir)) {
        const fs = require('fs');
        fs.mkdirSync(logsDir, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create logs directory:', error);
    }
  }

  // 🧹 Main cleanup function
  public async performCleanup(type: 'scheduled' | 'emergency' | 'manual' = 'scheduled'): Promise<{
    success: boolean;
    spaceReclaimed: number;
    filesDeleted: number;
    duration: number;
    errors: string[];
  }> {
    if (this.isRunning) {
      return {
        success: false,
        spaceReclaimed: 0,
        filesDeleted: 0,
        duration: 0,
        errors: ['Cleanup already in progress']
      };
    }

    const startTime = Date.now();
    this.isRunning = true;
    let totalSpaceReclaimed = 0;
    let totalFilesDeleted = 0;
    const errors: string[] = [];

    console.log(`🧹 Starting ${type} cleanup...`);

    try {
      // Execute cleanup in priority order
      for (const priority of this.config.cleanupScheduling.cleanupPriority) {
        try {
          const result = await this.cleanupByType(priority);
          totalSpaceReclaimed += result.spaceReclaimed;
          totalFilesDeleted += result.filesDeleted;
          
          if (result.errors.length > 0) {
            errors.push(...result.errors);
          }
        } catch (error) {
          const errorMsg = `Failed to cleanup ${priority}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      const duration = Date.now() - startTime;
      
      // Update analytics
      this.updateAnalytics({
        spaceReclaimed: totalSpaceReclaimed,
        filesDeleted: totalFilesDeleted,
        duration,
        success: errors.length === 0
      });

      // Log cleanup operation
      this.logCleanupOperation({
        type,
        timestamp: new Date().toISOString(),
        spaceReclaimed: totalSpaceReclaimed,
        filesDeleted: totalFilesDeleted,
        duration,
        errors,
        success: errors.length === 0
      });

      console.log(`✅ Cleanup completed: ${totalFilesDeleted} files, ${(totalSpaceReclaimed / 1024 / 1024).toFixed(2)} MB reclaimed`);

      return {
        success: errors.length === 0,
        spaceReclaimed: totalSpaceReclaimed,
        filesDeleted: totalFilesDeleted,
        duration,
        errors
      };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown cleanup error';
      errors.push(errorMsg);
      
      return {
        success: false,
        spaceReclaimed: totalSpaceReclaimed,
        filesDeleted: totalFilesDeleted,
        duration: Date.now() - startTime,
        errors
      };
    } finally {
      this.isRunning = false;
    }
  }

  // 🎯 Cleanup by specific type
  private async cleanupByType(type: string): Promise<{
    spaceReclaimed: number;
    filesDeleted: number;
    errors: string[];
  }> {
    switch (type) {
      case 'temp':
        return await this.cleanupTempFiles();
      case 'logs':
        return await this.cleanupLogFiles();
      case 'uploads':
        return await this.cleanupUploadsFolder();
      case 'cache':
        return await this.cleanupCacheFiles();
      default:
        return { spaceReclaimed: 0, filesDeleted: 0, errors: [`Unknown cleanup type: ${type}`] };
    }
  }

  // 📂 Cleanup temporary files
  private async cleanupTempFiles(): Promise<{
    spaceReclaimed: number;
    filesDeleted: number;
    errors: string[];
  }> {
    let spaceReclaimed = 0;
    let filesDeleted = 0;
    const errors: string[] = [];

    for (const location of this.config.cleanupTargets.tempFiles.location) {
      try {
        if (!existsSync(location)) continue;

        const files = await this.getFilesOlderThan(
          location, 
          this.config.cleanupTargets.tempFiles.maxAge * 60 * 60 * 1000 // Convert hours to ms
        );

        for (const file of files) {
          try {
            // Safety check: ensure file is not in use
            if (this.config.cleanupScheduling.safetyChecks && await this.isFileInUse(file.path)) {
              continue;
            }

            spaceReclaimed += file.size;
            await unlink(file.path);
            filesDeleted++;
          } catch (error) {
            errors.push(`Failed to delete temp file ${file.path}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      } catch (error) {
        errors.push(`Failed to process temp location ${location}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { spaceReclaimed, filesDeleted, errors };
  }

  // 📝 Cleanup log files
  private async cleanupLogFiles(): Promise<{
    spaceReclaimed: number;
    filesDeleted: number;
    errors: string[];
  }> {
    let spaceReclaimed = 0;
    let filesDeleted = 0;
    const errors: string[] = [];

    const logsDir = join(process.cwd(), 'logs');
    
    try {
      if (!existsSync(logsDir)) return { spaceReclaimed, filesDeleted, errors };

      const files = await this.getFilesOlderThan(
        logsDir,
        this.config.cleanupTargets.logFiles.maxAge * 24 * 60 * 60 * 1000 // Convert days to ms
      );

      for (const file of files) {
        try {
          // Skip active log files
          if (file.path.includes('current') || file.path.includes('latest')) {
            continue;
          }

          // Compress before deletion if enabled
          if (this.config.cleanupTargets.logFiles.compressionEnabled) {
            await this.compressFile(file.path);
          }

          spaceReclaimed += file.size;
          await unlink(file.path);
          filesDeleted++;
        } catch (error) {
          errors.push(`Failed to cleanup log file ${file.path}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      errors.push(`Failed to process logs directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { spaceReclaimed, filesDeleted, errors };
  }

  // 📤 Cleanup uploads folder
  private async cleanupUploadsFolder(): Promise<{
    spaceReclaimed: number;
    filesDeleted: number;
    errors: string[];
  }> {
    let spaceReclaimed = 0;
    let filesDeleted = 0;
    const errors: string[] = [];

    const uploadsDir = join(process.cwd(), 'uploads');
    
    try {
      if (!existsSync(uploadsDir)) return { spaceReclaimed, filesDeleted, errors };

      // Cleanup processed files (older than X days)
      const processedFiles = await this.getFilesOlderThan(
        uploadsDir,
        this.config.cleanupTargets.uploadsFolder.processedFiles * 24 * 60 * 60 * 1000
      );

      for (const file of processedFiles) {
        try {
          // Safety check: ensure file is processed
          if (await this.isFileProcessed(file.path)) {
            spaceReclaimed += file.size;
            await unlink(file.path);
            filesDeleted++;
          }
        } catch (error) {
          errors.push(`Failed to cleanup upload file ${file.path}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      errors.push(`Failed to process uploads directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { spaceReclaimed, filesDeleted, errors };
  }

  // 💾 Cleanup cache files
  private async cleanupCacheFiles(): Promise<{
    spaceReclaimed: number;
    filesDeleted: number;
    errors: string[];
  }> {
    let spaceReclaimed = 0;
    let filesDeleted = 0;
    const errors: string[] = [];

    const cacheDir = join(process.cwd(), '.next', 'cache');
    
    try {
      if (!existsSync(cacheDir)) return { spaceReclaimed, filesDeleted, errors };

      const files = await this.getFilesOlderThan(
        cacheDir,
        24 * 60 * 60 * 1000 // 24 hours
      );

      for (const file of files) {
        try {
          spaceReclaimed += file.size;
          await unlink(file.path);
          filesDeleted++;
        } catch (error) {
          errors.push(`Failed to delete cache file ${file.path}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      errors.push(`Failed to process cache directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { spaceReclaimed, filesDeleted, errors };
  }

  // 🔍 Get files older than specified time
  private async getFilesOlderThan(directory: string, maxAge: number): Promise<Array<{
    path: string;
    size: number;
    age: number;
  }>> {
    const files: Array<{ path: string; size: number; age: number }> = [];
    const now = Date.now();

    try {
      const items = await readdir(directory);
      
      for (const item of items) {
        const fullPath = join(directory, item);
        try {
          const stats = await stat(fullPath);
          
          if (stats.isFile()) {
            const age = now - stats.mtime.getTime();
            if (age > maxAge) {
              files.push({
                path: fullPath,
                size: stats.size,
                age
              });
            }
          }
        } catch (error) {
          // Skip files that can't be accessed
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
    }

    return files;
  }

  // 🔒 Safety check: is file in use
  private async isFileInUse(filePath: string): Promise<boolean> {
    try {
      // Try to rename the file to itself (Windows check)
      if (process.platform === 'win32') {
        // On Windows, try to open the file exclusively
        const fs = require('fs');
        const fd = fs.openSync(filePath, 'r+');
        fs.closeSync(fd);
        return false;
      } else {
        // On Unix systems, use lsof if available
        try {
          execSync(`lsof "${filePath}"`, { stdio: 'ignore' });
          return true; // File is open
        } catch {
          return false; // File is not open or lsof not available
        }
      }
    } catch {
      return true; // Assume file is in use if we can't check
    }
  }

  // ✅ Check if file has been processed
  private async isFileProcessed(filePath: string): Promise<boolean> {
    // Simple heuristic: check if file hasn't been modified recently
    try {
      const stats = await stat(filePath);
      const daysSinceModified = (Date.now() - stats.mtime.getTime()) / (24 * 60 * 60 * 1000);
      return daysSinceModified >= 1; // Consider processed if not modified for 1+ days
    } catch {
      return false;
    }
  }

  // 🗜️ Compress file
  private async compressFile(filePath: string): Promise<void> {
    try {
      // Simple gzip compression (requires gzip to be available)
      if (process.platform === 'win32') {
        // On Windows, skip compression for now
        return;
      } else {
        execSync(`gzip "${filePath}"`, { stdio: 'ignore' });
      }
    } catch {
      // Compression failed, continue without compression
    }
  }

  // 📊 Update analytics
  private updateAnalytics(result: {
    spaceReclaimed: number;
    filesDeleted: number;
    duration: number;
    success: boolean;
  }): void {
    this.config.cleanupAnalytics.totalSpaceReclaimed += result.spaceReclaimed;
    this.config.cleanupAnalytics.filesDeleted += result.filesDeleted;
    
    // Update average cleanup time
    const prevAvg = this.config.cleanupAnalytics.avgCleanupTime;
    const count = this.cleanupHistory.length + 1;
    this.config.cleanupAnalytics.avgCleanupTime = 
      (prevAvg * (count - 1) + result.duration) / count;
  }

  // 📝 Log cleanup operation
  private logCleanupOperation(operation: any): void {
    try {
      this.cleanupHistory.unshift(operation);
      
      // Keep only last 100 operations
      if (this.cleanupHistory.length > 100) {
        this.cleanupHistory = this.cleanupHistory.slice(0, 100);
      }

      writeFileSync(this.logFile, JSON.stringify({
        lastUpdated: new Date().toISOString(),
        analytics: this.config.cleanupAnalytics,
        recentOperations: this.cleanupHistory
      }, null, 2));
    } catch (error) {
      console.error('Failed to log cleanup operation:', error);
    }
  }

  // 📈 Get cleanup status
  public getCleanupStatus() {
    return {
      isRunning: this.isRunning,
      config: this.config,
      analytics: this.config.cleanupAnalytics,
      recentOperations: this.cleanupHistory.slice(0, 10)
    };
  }

  // 🧪 Test emergency cleanup
  public async testEmergencyCleanup(): Promise<any> {
    console.log('🚨 Testing emergency cleanup procedures...');
    return await this.performCleanup('emergency');
  }
}

// 🌟 Export singleton instance
export const autoCleanup = new AutoCleanupService(); 