// lib/logging/log-management-service.ts
import { writeFileSync, readFileSync, existsSync, statSync, readdirSync } from 'fs';
import { mkdir, unlink, rename } from 'fs/promises';
import { join, extname } from 'path';
import { execSync } from 'child_process';

export interface LogManagementConfig {
  // 📁 Log Storage Settings
  logDirectory: string;
  maxFileSize: number;           // MB before rotation
  maxFiles: number;              // Number of rotated files to keep
  compressionEnabled: boolean;   // Compress old log files
  retentionDays: number;         // Days to keep logs before deletion
  
  // 🔄 Rotation Settings
  rotationSchedule: 'daily' | 'weekly' | 'size-based' | 'manual';
  rotationTime: string;          // '02:00' for daily rotation
  enableAutoRotation: boolean;
  
  // 📊 Log Levels
  logLevel: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  categorizeByLevel: boolean;    // Separate files by log level
  
  // 🎯 Log Aggregation
  aggregationEnabled: boolean;
  aggregationInterval: number;   // Minutes between aggregation
  enableLogAnalysis: boolean;    // Enable pattern analysis
  alertOnErrors: boolean;        // Alert on error patterns
}

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  category: string;
  message: string;
  metadata?: any;
  requestId?: string;
  userId?: string;
  sessionId?: string;
}

export interface LogAnalytics {
  totalLogs: number;
  logsByLevel: { [key: string]: number };
  logsByCategory: { [key: string]: number };
  errorPatterns: string[];
  timeRange: { start: string; end: string };
  topErrors: Array<{ message: string; count: number }>;
  performanceMetrics: {
    avgLogsPerMinute: number;
    peakLogTime: string;
    errorRate: number;
  };
}

export class LogManagementService {
  private config: LogManagementConfig;
  private logsDir: string;
  private rotationTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<LogManagementConfig>) {
    this.config = {
      logDirectory: join(process.cwd(), 'logs'),
      maxFileSize: 100, // 100MB
      maxFiles: 10,
      compressionEnabled: true,
      retentionDays: 30,
      rotationSchedule: 'daily',
      rotationTime: '02:00',
      enableAutoRotation: true,
      logLevel: 'info',
      categorizeByLevel: false,
      aggregationEnabled: true,
      aggregationInterval: 60, // 60 minutes
      enableLogAnalysis: true,
      alertOnErrors: true,
      ...config
    };
    
    this.logsDir = this.config.logDirectory;
    this.initializeLogDirectory();
    this.startAutoRotation();
  }

  private async initializeLogDirectory(): Promise<void> {
    try {
      if (!existsSync(this.logsDir)) {
        await mkdir(this.logsDir, { recursive: true });
      }
      
      // Create subdirectories if needed
      if (this.config.categorizeByLevel) {
        const levels = ['debug', 'info', 'warn', 'error', 'critical'];
        for (const level of levels) {
          const levelDir = join(this.logsDir, level);
          if (!existsSync(levelDir)) {
            await mkdir(levelDir, { recursive: true });
          }
        }
      }
      
      console.log(`📋 Log Management initialized: ${this.logsDir}`);
    } catch (error) {
      console.error('Failed to initialize log directory:', error);
    }
  }

  // 📝 Main logging function
  public log(entry: LogEntry): void {
    try {
      const formattedEntry = this.formatLogEntry(entry);
      const logFile = this.getLogFilePath(entry.level, entry.category);
      
      // Check file size before writing
      if (this.shouldRotateLog(logFile)) {
        this.rotateLogFile(logFile);
      }
      
      // Write log entry
      const logLine = JSON.stringify(formattedEntry) + '\n';
      writeFileSync(logFile, logLine, { flag: 'a' });
      
      // Trigger error alerts if enabled
      if (this.config.alertOnErrors && ['error', 'critical'].includes(entry.level)) {
        this.handleErrorAlert(entry);
      }
      
    } catch (error) {
      console.error('Failed to write log entry:', error);
    }
  }

  // 🎨 Format log entry
  private formatLogEntry(entry: LogEntry): LogEntry {
    return {
      timestamp: entry.timestamp || new Date().toISOString(),
      level: entry.level,
      category: entry.category || 'general',
      message: entry.message,
      metadata: entry.metadata || {},
      requestId: entry.requestId,
      userId: entry.userId,
      sessionId: entry.sessionId
    };
  }

  // 📁 Get log file path
  private getLogFilePath(level: string, category: string): string {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (this.config.categorizeByLevel) {
      return join(this.logsDir, level, `${category}-${date}.log`);
    }
    
    return join(this.logsDir, `${category}-${date}.log`);
  }

  // 🔄 Check if log file should be rotated
  private shouldRotateLog(filePath: string): boolean {
    if (!existsSync(filePath)) return false;
    
    const stats = statSync(filePath);
    const fileSizeMB = stats.size / (1024 * 1024);
    
    return fileSizeMB > this.config.maxFileSize;
  }

  // 🔄 Rotate log file
  private rotateLogFile(filePath: string): void {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const rotatedPath = `${filePath}.${timestamp}`;
      
      // Rename current file
      writeFileSync(rotatedPath, readFileSync(filePath));
      writeFileSync(filePath, ''); // Clear current file
      
      // Compress if enabled
      if (this.config.compressionEnabled) {
        this.compressLogFile(rotatedPath);
      }
      
      // Clean up old files
      this.cleanupOldLogs(filePath);
      
      console.log(`📋 Log rotated: ${filePath} -> ${rotatedPath}`);
    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }

  // 🗜️ Compress log file
  private compressLogFile(filePath: string): void {
    try {
      if (process.platform === 'win32') {
        // On Windows, skip compression for now
        return;
      }
      
      const compressedPath = `${filePath}.gz`;
      execSync(`gzip "${filePath}"`, { stdio: 'ignore' });
      console.log(`🗜️ Log compressed: ${compressedPath}`);
    } catch (error) {
      console.error('Failed to compress log file:', error);
    }
  }

  // 🧹 Clean up old log files
  private cleanupOldLogs(basePath: string): void {
    try {
      const dir = join(basePath, '..');
      const baseName = join(basePath).split('/').pop() || '';
      const files = readdirSync(dir);
      
      // Find rotated files for this log
      const rotatedFiles = files
        .filter(file => file.startsWith(baseName) && file !== baseName)
        .map(file => ({
          name: file,
          path: join(dir, file),
          stats: statSync(join(dir, file))
        }))
        .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());
      
      // Remove files beyond maxFiles limit
      if (rotatedFiles.length > this.config.maxFiles) {
        const filesToDelete = rotatedFiles.slice(this.config.maxFiles);
        filesToDelete.forEach(file => {
          try {
            unlink(file.path);
            console.log(`🗑️ Deleted old log: ${file.name}`);
          } catch (error) {
            console.error(`Failed to delete ${file.name}:`, error);
          }
        });
      }
      
      // Remove files older than retention period
      const retentionMs = this.config.retentionDays * 24 * 60 * 60 * 1000;
      const now = Date.now();
      
      rotatedFiles.forEach(file => {
        if (now - file.stats.mtime.getTime() > retentionMs) {
          try {
            unlink(file.path);
            console.log(`⏰ Deleted expired log: ${file.name}`);
          } catch (error) {
            console.error(`Failed to delete expired ${file.name}:`, error);
          }
        }
      });
      
    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
    }
  }

  // ⏰ Start automatic rotation
  private startAutoRotation(): void {
    if (!this.config.enableAutoRotation) return;
    
    if (this.config.rotationSchedule === 'daily') {
      const [hour, minute] = this.config.rotationTime.split(':').map(Number);
      const now = new Date();
      const scheduledTime = new Date();
      scheduledTime.setHours(hour, minute, 0, 0);
      
      // If scheduled time has passed today, schedule for tomorrow
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }
      
      const msUntilRotation = scheduledTime.getTime() - now.getTime();
      
      this.rotationTimer = setTimeout(() => {
        this.performScheduledRotation();
        // Schedule next rotation
        this.rotationTimer = setInterval(() => {
          this.performScheduledRotation();
        }, 24 * 60 * 60 * 1000); // 24 hours
      }, msUntilRotation);
      
      console.log(`⏰ Auto-rotation scheduled for ${scheduledTime.toLocaleString()}`);
    }
  }

  // 🔄 Perform scheduled rotation
  private performScheduledRotation(): void {
    console.log('🔄 Performing scheduled log rotation...');
    
    try {
      const files = readdirSync(this.logsDir);
      const logFiles = files.filter(file => file.endsWith('.log'));
      
      logFiles.forEach(file => {
        const filePath = join(this.logsDir, file);
        if (existsSync(filePath)) {
          this.rotateLogFile(filePath);
        }
      });
      
      console.log(`✅ Scheduled rotation completed: ${logFiles.length} files processed`);
    } catch (error) {
      console.error('Failed to perform scheduled rotation:', error);
    }
  }

  // 🚨 Handle error alerts
  private handleErrorAlert(entry: LogEntry): void {
    // Save error to alerts file
    const alertFile = join(this.logsDir, 'error-alerts.json');
    
    try {
      let alerts = [];
      if (existsSync(alertFile)) {
        alerts = JSON.parse(readFileSync(alertFile, 'utf8'));
      }
      
      alerts.unshift({
        id: Date.now(),
        timestamp: entry.timestamp,
        level: entry.level,
        category: entry.category,
        message: entry.message,
        metadata: entry.metadata,
        resolved: false
      });
      
      // Keep only last 100 alerts
      alerts = alerts.slice(0, 100);
      
      writeFileSync(alertFile, JSON.stringify(alerts, null, 2));
    } catch (error) {
      console.error('Failed to save error alert:', error);
    }
  }

  // 📊 Get log analytics
  public getLogAnalytics(hours: number = 24): LogAnalytics {
    try {
      const files = readdirSync(this.logsDir);
      const logFiles = files.filter(file => file.endsWith('.log'));
      
      let totalLogs = 0;
      const logsByLevel: { [key: string]: number } = {};
      const logsByCategory: { [key: string]: number } = {};
      const errorMessages: { [key: string]: number } = {};
      
      const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000);
      let earliestLog = new Date();
      let latestLog = new Date(0);
      
      logFiles.forEach(file => {
        const filePath = join(this.logsDir, file);
        
        try {
          const content = readFileSync(filePath, 'utf8');
          const lines = content.split('\n').filter(line => line.trim());
          
          lines.forEach(line => {
            try {
              const entry: LogEntry = JSON.parse(line);
              const entryTime = new Date(entry.timestamp);
              
              if (entryTime >= hoursAgo) {
                totalLogs++;
                
                logsByLevel[entry.level] = (logsByLevel[entry.level] || 0) + 1;
                logsByCategory[entry.category] = (logsByCategory[entry.category] || 0) + 1;
                
                if (['error', 'critical'].includes(entry.level)) {
                  errorMessages[entry.message] = (errorMessages[entry.message] || 0) + 1;
                }
                
                if (entryTime < earliestLog) earliestLog = entryTime;
                if (entryTime > latestLog) latestLog = entryTime;
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
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([message, count]) => ({ message, count }));
      
      const timeRangeMinutes = (latestLog.getTime() - earliestLog.getTime()) / (1000 * 60);
      const avgLogsPerMinute = timeRangeMinutes > 0 ? totalLogs / timeRangeMinutes : 0;
      const errorCount = (logsByLevel.error || 0) + (logsByLevel.critical || 0);
      const errorRate = totalLogs > 0 ? (errorCount / totalLogs) * 100 : 0;
      
      return {
        totalLogs,
        logsByLevel,
        logsByCategory,
        errorPatterns: topErrors.map(e => e.message),
        timeRange: {
          start: earliestLog.toISOString(),
          end: latestLog.toISOString()
        },
        topErrors,
        performanceMetrics: {
          avgLogsPerMinute: Math.round(avgLogsPerMinute * 100) / 100,
          peakLogTime: latestLog.toISOString(),
          errorRate: Math.round(errorRate * 100) / 100
        }
      };
    } catch (error) {
      console.error('Failed to generate log analytics:', error);
      return {
        totalLogs: 0,
        logsByLevel: {},
        logsByCategory: {},
        errorPatterns: [],
        timeRange: { start: '', end: '' },
        topErrors: [],
        performanceMetrics: {
          avgLogsPerMinute: 0,
          peakLogTime: '',
          errorRate: 0
        }
      };
    }
  }

  // 📋 Get log management status
  public getStatus() {
    const files = readdirSync(this.logsDir);
    const logFiles = files.filter(file => file.endsWith('.log'));
    let totalSize = 0;
    
    logFiles.forEach(file => {
      const filePath = join(this.logsDir, file);
      if (existsSync(filePath)) {
        totalSize += statSync(filePath).size;
      }
    });
    
    return {
      isRunning: this.rotationTimer !== null,
      config: this.config,
      statistics: {
        totalLogFiles: logFiles.length,
        totalSizeBytes: totalSize,
        totalSizeFormatted: this.formatBytes(totalSize),
        logDirectory: this.logsDir
      },
      nextRotation: this.getNextRotationTime()
    };
  }

  // 🕐 Get next rotation time
  private getNextRotationTime(): string {
    if (!this.config.enableAutoRotation || this.config.rotationSchedule !== 'daily') {
      return 'Not scheduled';
    }
    
    const [hour, minute] = this.config.rotationTime.split(':').map(Number);
    const now = new Date();
    const nextRotation = new Date();
    nextRotation.setHours(hour, minute, 0, 0);
    
    if (nextRotation <= now) {
      nextRotation.setDate(nextRotation.getDate() + 1);
    }
    
    return nextRotation.toLocaleString();
  }

  // 📏 Format bytes
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // 🛑 Stop log management
  public stop(): void {
    if (this.rotationTimer) {
      clearTimeout(this.rotationTimer);
      clearInterval(this.rotationTimer);
      this.rotationTimer = null;
    }
    console.log('📋 Log Management service stopped');
  }
}

// 🌟 Export singleton instance
export const logManager = new LogManagementService(); 