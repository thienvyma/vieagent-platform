/**
 * VIEAgent System Monitoring Service
 * Comprehensive real-time performance and resource monitoring
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import os from 'os';

interface SystemMetrics {
  timestamp: string;
  cpu: {
    usage: number;
    loadAverage: number[];
    cores: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  network: {
    bytesReceived: number;
    bytesSent: number;
  };
  processes: {
    nodeProcesses: number;
    totalProcesses: number;
  };
}

interface PerformanceMetrics {
  timestamp: string;
  responseTime: {
    average: number;
    p50: number;
    p95: number;
    p99: number;
  };
  requests: {
    total: number;
    successful: number;
    failed: number;
    rate: number;
  };
  errors: {
    count: number;
    rate: number;
    lastError?: string;
  };
  database: {
    connections: number;
    queryTime: number;
    slowQueries: number;
  };
}

interface AlertThreshold {
  metric: string;
  threshold: number;
  condition: 'greater' | 'less' | 'equal';
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
}

export class SystemMonitor {
  private metricsHistory: SystemMetrics[] = [];
  private performanceHistory: PerformanceMetrics[] = [];
  private alerts: AlertThreshold[] = [];
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;
  private logsPath: string;

  constructor() {
    this.logsPath = join(process.cwd(), 'logs');
    this.initializeDefaultAlerts();
    this.loadHistoricalData();
  }

  /**
   * Initialize default alert thresholds
   */
  private initializeDefaultAlerts(): void {
    this.alerts = [
      { metric: 'cpu.usage', threshold: 80, condition: 'greater', severity: 'high', enabled: true },
      {
        metric: 'memory.percentage',
        threshold: 85,
        condition: 'greater',
        severity: 'high',
        enabled: true,
      },
      {
        metric: 'disk.percentage',
        threshold: 90,
        condition: 'greater',
        severity: 'critical',
        enabled: true,
      },
      {
        metric: 'responseTime.average',
        threshold: 2000,
        condition: 'greater',
        severity: 'medium',
        enabled: true,
      },
      {
        metric: 'errors.rate',
        threshold: 5,
        condition: 'greater',
        severity: 'high',
        enabled: true,
      },
      {
        metric: 'database.slowQueries',
        threshold: 10,
        condition: 'greater',
        severity: 'medium',
        enabled: true,
      },
    ];
  }

  /**
   * Get current system metrics
   */
  public async getSystemMetrics(): Promise<SystemMetrics> {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    // Get disk usage (simplified for cross-platform compatibility)
    const diskStats = await this.getDiskUsage();

    const metrics: SystemMetrics = {
      timestamp: new Date().toISOString(),
      cpu: {
        usage: await this.getCpuUsage(),
        loadAverage: os.loadavg(),
        cores: os.cpus().length,
      },
      memory: {
        total: totalMem,
        used: usedMem,
        free: freeMem,
        percentage: Math.round((usedMem / totalMem) * 100),
      },
      disk: diskStats,
      network: {
        bytesReceived: 0, // Would need platform-specific implementation
        bytesSent: 0,
      },
      processes: {
        nodeProcesses: await this.getNodeProcessCount(),
        totalProcesses: 0, // Would need platform-specific implementation
      },
    };

    return metrics;
  }

  /**
   * Get current performance metrics
   */
  public getPerformanceMetrics(): PerformanceMetrics {
    // This would be populated by API middleware
    const recent = this.performanceHistory.slice(-100);

    const metrics: PerformanceMetrics = {
      timestamp: new Date().toISOString(),
      responseTime: {
        average: this.calculateAverage(recent.map(m => m.responseTime.average)),
        p50: this.calculatePercentile(
          recent.map(m => m.responseTime.p50),
          50
        ),
        p95: this.calculatePercentile(
          recent.map(m => m.responseTime.p95),
          95
        ),
        p99: this.calculatePercentile(
          recent.map(m => m.responseTime.p99),
          99
        ),
      },
      requests: {
        total: recent.reduce((sum, m) => sum + m.requests.total, 0),
        successful: recent.reduce((sum, m) => sum + m.requests.successful, 0),
        failed: recent.reduce((sum, m) => sum + m.requests.failed, 0),
        rate: recent.length > 0 ? recent[recent.length - 1].requests.rate : 0,
      },
      errors: {
        count: recent.reduce((sum, m) => sum + m.errors.count, 0),
        rate: recent.length > 0 ? recent[recent.length - 1].errors.rate : 0,
      },
      database: {
        connections: recent.length > 0 ? recent[recent.length - 1].database.connections : 0,
        queryTime: this.calculateAverage(recent.map(m => m.database.queryTime)),
        slowQueries: recent.reduce((sum, m) => sum + m.database.slowQueries, 0),
      },
    };

    return metrics;
  }

  /**
   * Start monitoring system
   */
  public startMonitoring(intervalMs: number = 60000): void {
    if (this.isMonitoring) {
      console.warn('Monitoring is already running');
      return;
    }

    this.isMonitoring = true;

    this.monitoringInterval = setInterval(async () => {
      try {
        const systemMetrics = await this.getSystemMetrics();
        const performanceMetrics = this.getPerformanceMetrics();

        // Store metrics
        this.metricsHistory.push(systemMetrics);
        this.performanceHistory.push(performanceMetrics);

        // Limit history size
        if (this.metricsHistory.length > 1440) {
          // 24 hours at 1-minute intervals
          this.metricsHistory.shift();
        }
        if (this.performanceHistory.length > 1440) {
          this.performanceHistory.shift();
        }

        // Check alerts
        this.checkAlerts(systemMetrics, performanceMetrics);

        // Save to disk
        this.saveMetrics();

        console.log(
          `📊 Monitoring: CPU ${systemMetrics.cpu.usage}%, Memory ${systemMetrics.memory.percentage}%, Disk ${systemMetrics.disk.percentage}%`
        );
      } catch (error) {
        console.error('Monitoring error:', error);
      }
    }, intervalMs);

    console.log('✅ System monitoring started');
  }

  /**
   * Stop monitoring system
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
    console.log('⏹️ System monitoring stopped');
  }

  /**
   * Get monitoring status
   */
  public getStatus(): {
    isMonitoring: boolean;
    metricsCount: number;
    lastUpdate: string | null;
    alerts: AlertThreshold[];
  } {
    return {
      isMonitoring: this.isMonitoring,
      metricsCount: this.metricsHistory.length,
      lastUpdate:
        this.metricsHistory.length > 0
          ? this.metricsHistory[this.metricsHistory.length - 1].timestamp
          : null,
      alerts: this.alerts,
    };
  }

  /**
   * Get recent metrics for dashboard
   */
  public getRecentMetrics(minutes: number = 60): {
    system: SystemMetrics[];
    performance: PerformanceMetrics[];
  } {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000).toISOString();

    return {
      system: this.metricsHistory.filter(m => m.timestamp >= cutoff),
      performance: this.performanceHistory.filter(m => m.timestamp >= cutoff),
    };
  }

  /**
   * Record API request for performance tracking
   */
  public recordApiRequest(responseTime: number, success: boolean, error?: string): void {
    // Implementation would update current performance metrics
    console.log(`📊 API Request: ${responseTime}ms, Success: ${success}`);
  }

  // Private helper methods
  private async getCpuUsage(): Promise<number> {
    return new Promise(resolve => {
      const startMeasure = this.cpuMeasure();
      setTimeout(() => {
        const endMeasure = this.cpuMeasure();
        const totalDiff = endMeasure.total - startMeasure.total;
        const idleDiff = endMeasure.idle - startMeasure.idle;
        const cpuPercentage = 100 - Math.round((100 * idleDiff) / totalDiff);
        resolve(cpuPercentage);
      }, 1000);
    });
  }

  private cpuMeasure(): { idle: number; total: number } {
    const cpus = os.cpus();
    let idle = 0;
    let total = 0;

    for (const cpu of cpus) {
      for (const type in cpu.times) {
        total += cpu.times[type as keyof typeof cpu.times];
      }
      idle += cpu.times.idle;
    }

    return { idle, total };
  }

  private async getDiskUsage(): Promise<SystemMetrics['disk']> {
    // Simplified disk usage - would need platform-specific implementation
    const total = 1000000000000; // 1TB default
    const used = 500000000000; // 500GB default
    const free = total - used;

    return {
      total,
      used,
      free,
      percentage: Math.round((used / total) * 100),
    };
  }

  private async getNodeProcessCount(): Promise<number> {
    // Simplified - would need platform-specific implementation
    return 1;
  }

  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }

  private calculatePercentile(numbers: number[], percentile: number): number {
    if (numbers.length === 0) return 0;
    const sorted = numbers.sort((a, b) => a - b);
    const index = Math.floor((percentile / 100) * sorted.length);
    return sorted[index] || 0;
  }

  private checkAlerts(systemMetrics: SystemMetrics, performanceMetrics: PerformanceMetrics): void {
    // Implementation for checking alert thresholds
    for (const alert of this.alerts) {
      if (!alert.enabled) continue;

      // Extract metric value based on path
      const value = this.getMetricValue(alert.metric, systemMetrics, performanceMetrics);
      if (value !== null && this.shouldAlert(value, alert)) {
        this.triggerAlert(alert, value);
      }
    }
  }

  private getMetricValue(
    path: string,
    system: SystemMetrics,
    performance: PerformanceMetrics
  ): number | null {
    const [section, field] = path.split('.');

    switch (section) {
      case 'cpu':
        return field === 'usage' ? system.cpu.usage : null;
      case 'memory':
        return field === 'percentage' ? system.memory.percentage : null;
      case 'disk':
        return field === 'percentage' ? system.disk.percentage : null;
      case 'responseTime':
        return field === 'average' ? performance.responseTime.average : null;
      case 'errors':
        return field === 'rate' ? performance.errors.rate : null;
      case 'database':
        return field === 'slowQueries' ? performance.database.slowQueries : null;
      default:
        return null;
    }
  }

  private shouldAlert(value: number, alert: AlertThreshold): boolean {
    switch (alert.condition) {
      case 'greater':
        return value > alert.threshold;
      case 'less':
        return value < alert.threshold;
      case 'equal':
        return value === alert.threshold;
      default:
        return false;
    }
  }

  private triggerAlert(alert: AlertThreshold, value: number): void {
    const message = `🚨 ALERT [${alert.severity.toUpperCase()}]: ${alert.metric} = ${value} (threshold: ${alert.threshold})`;
    console.warn(message);

    // Here you could send email, webhook, etc.
    this.logAlert(alert, value);
  }

  private logAlert(alert: AlertThreshold, value: number): void {
    const alertLog = {
      timestamp: new Date().toISOString(),
      metric: alert.metric,
      value,
      threshold: alert.threshold,
      severity: alert.severity,
    };

    try {
      writeFileSync(join(this.logsPath, 'alerts.json'), JSON.stringify(alertLog) + '\n', {
        flag: 'a',
      });
    } catch (error) {
      console.error('Failed to log alert:', error);
    }
  }

  private saveMetrics(): void {
    try {
      const data = {
        system: this.metricsHistory,
        performance: this.performanceHistory,
        lastUpdated: new Date().toISOString(),
      };

      writeFileSync(join(this.logsPath, 'metrics.json'), JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save metrics:', error);
    }
  }

  private loadHistoricalData(): void {
    try {
      const filePath = join(this.logsPath, 'metrics.json');
      if (existsSync(filePath)) {
        const data = JSON.parse(readFileSync(filePath, 'utf8'));
        this.metricsHistory = data.system || [];
        this.performanceHistory = data.performance || [];
        console.log(`📊 Loaded ${this.metricsHistory.length} historical metrics`);
      }
    } catch (error) {
      console.error('Failed to load historical data:', error);
    }
  }
}

// Singleton instance
export const systemMonitor = new SystemMonitor();

// Auto-start monitoring in production
if (process.env.NODE_ENV === 'production') {
  systemMonitor.startMonitoring();
}
