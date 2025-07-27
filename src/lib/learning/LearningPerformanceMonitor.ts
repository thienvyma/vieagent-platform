import { PrismaClient } from '@prisma/client';

// Performance Metrics
export interface PerformanceMetrics {
  timestamp: Date;
  componentName: string;
  operationType: string;
  duration: number; // milliseconds
  success: boolean;
  errorMessage?: string;
  metadata?: any;
}

export interface SystemPerformance {
  averageResponseTime: number;
  throughput: number; // operations per minute
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
  queueBacklog: number;
}

export interface ComponentHealth {
  componentName: string;
  status: 'healthy' | 'warning' | 'critical';
  lastCheck: Date;
  metrics: {
    averageLatency: number;
    errorRate: number;
    throughput: number;
  };
  issues: string[];
}

export interface PerformanceAlert {
  id: string;
  type: 'LATENCY' | 'ERROR_RATE' | 'THROUGHPUT' | 'MEMORY' | 'QUEUE_BACKLOG';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  componentName: string;
  threshold: number;
  currentValue: number;
  recommendation: string;
}

export interface OptimizationRecommendation {
  id: string;
  type: 'CONFIGURATION' | 'SCALING' | 'RESOURCE' | 'ALGORITHM';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  expectedImpact: string;
  implementationEffort: 'low' | 'medium' | 'high';
  recommendation: string;
}

export class LearningPerformanceMonitor {
  private static instance: LearningPerformanceMonitor;
  private prisma: PrismaClient;
  private metrics: Map<string, PerformanceMetrics[]>;
  private alerts: PerformanceAlert[];
  private thresholds: Map<string, any>;
  private isMonitoring: boolean;

  private constructor() {
    this.prisma = new PrismaClient();
    this.metrics = new Map();
    this.alerts = [];
    this.thresholds = new Map();
    this.isMonitoring = false;
    this.initializeThresholds();
    this.startMonitoring();
  }

  public static getInstance(): LearningPerformanceMonitor {
    if (!LearningPerformanceMonitor.instance) {
      LearningPerformanceMonitor.instance = new LearningPerformanceMonitor();
    }
    return LearningPerformanceMonitor.instance;
  }

  // Initialize performance thresholds
  private initializeThresholds(): void {
    this.thresholds.set('response_time', {
      warning: 2000, // 2 seconds
      critical: 5000, // 5 seconds
    });

    this.thresholds.set('error_rate', {
      warning: 0.05, // 5%
      critical: 0.15, // 15%
    });

    this.thresholds.set('throughput', {
      warning: 10, // operations per minute
      critical: 5,
    });

    this.thresholds.set('memory_usage', {
      warning: 0.8, // 80%
      critical: 0.9, // 90%
    });

    this.thresholds.set('queue_backlog', {
      warning: 100,
      critical: 500,
    });
  }

  // Start monitoring
  private startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;

    // Check performance every minute
    setInterval(() => {
      this.performHealthCheck();
    }, 60 * 1000);

    // Generate alerts every 5 minutes
    setInterval(
      () => {
        this.generateAlerts();
      },
      5 * 60 * 1000
    );

    // Clean old metrics every hour
    setInterval(
      () => {
        this.cleanOldMetrics();
      },
      60 * 60 * 1000
    );
  }

  // Record performance metric
  public recordMetric(
    componentName: string,
    operationType: string,
    duration: number,
    success: boolean,
    errorMessage?: string,
    metadata?: any
  ): void {
    const metric: PerformanceMetrics = {
      timestamp: new Date(),
      componentName,
      operationType,
      duration,
      success,
      errorMessage,
      metadata,
    };

    const componentMetrics = this.metrics.get(componentName) || [];
    componentMetrics.push(metric);

    // Keep only last 1000 metrics per component
    if (componentMetrics.length > 1000) {
      componentMetrics.splice(0, componentMetrics.length - 1000);
    }

    this.metrics.set(componentName, componentMetrics);
  }

  // Performance decorator for async functions
  public async measurePerformance<T>(
    componentName: string,
    operationType: string,
    operation: () => Promise<T>,
    metadata?: any
  ): Promise<T> {
    const startTime = Date.now();
    let success = true;
    let errorMessage: string | undefined;
    let result: T;

    try {
      result = await operation();
      return result;
    } catch (error) {
      success = false;
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      this.recordMetric(componentName, operationType, duration, success, errorMessage, metadata);
    }
  }

  // Get component performance
  public getComponentPerformance(
    componentName: string,
    timeRange: number = 60 * 60 * 1000 // 1 hour
  ): SystemPerformance {
    const metrics = this.metrics.get(componentName) || [];
    const cutoffTime = new Date(Date.now() - timeRange);
    const recentMetrics = metrics.filter(m => m.timestamp > cutoffTime);

    if (recentMetrics.length === 0) {
      return {
        averageResponseTime: 0,
        throughput: 0,
        errorRate: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        queueBacklog: 0,
      };
    }

    const totalDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0);
    const averageResponseTime = totalDuration / recentMetrics.length;

    const errorCount = recentMetrics.filter(m => !m.success).length;
    const errorRate = errorCount / recentMetrics.length;

    const throughput = (recentMetrics.length / (timeRange / 1000)) * 60; // per minute

    return {
      averageResponseTime,
      throughput,
      errorRate,
      memoryUsage: this.getMemoryUsage(),
      cpuUsage: this.getCpuUsage(),
      queueBacklog: this.getQueueBacklog(),
    };
  }

  // Get system-wide performance
  public getSystemPerformance(timeRange: number = 60 * 60 * 1000): SystemPerformance {
    const allMetrics: PerformanceMetrics[] = [];

    for (const componentMetrics of this.metrics.values()) {
      const cutoffTime = new Date(Date.now() - timeRange);
      const recentMetrics = componentMetrics.filter(m => m.timestamp > cutoffTime);
      allMetrics.push(...recentMetrics);
    }

    if (allMetrics.length === 0) {
      return {
        averageResponseTime: 0,
        throughput: 0,
        errorRate: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        queueBacklog: 0,
      };
    }

    const totalDuration = allMetrics.reduce((sum, m) => sum + m.duration, 0);
    const averageResponseTime = totalDuration / allMetrics.length;

    const errorCount = allMetrics.filter(m => !m.success).length;
    const errorRate = errorCount / allMetrics.length;

    const throughput = (allMetrics.length / (timeRange / 1000)) * 60; // per minute

    return {
      averageResponseTime,
      throughput,
      errorRate,
      memoryUsage: this.getMemoryUsage(),
      cpuUsage: this.getCpuUsage(),
      queueBacklog: this.getQueueBacklog(),
    };
  }

  // Get component health
  public getComponentHealth(componentName: string): ComponentHealth {
    const performance = this.getComponentPerformance(componentName);
    const issues: string[] = [];

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Check thresholds
    const responseTimeThreshold = this.thresholds.get('response_time');
    if (performance.averageResponseTime > responseTimeThreshold.critical) {
      status = 'critical';
      issues.push(`High response time: ${performance.averageResponseTime}ms`);
    } else if (performance.averageResponseTime > responseTimeThreshold.warning) {
      status = 'warning';
      issues.push(`Elevated response time: ${performance.averageResponseTime}ms`);
    }

    const errorRateThreshold = this.thresholds.get('error_rate');
    if (performance.errorRate > errorRateThreshold.critical) {
      status = 'critical';
      issues.push(`High error rate: ${(performance.errorRate * 100).toFixed(1)}%`);
    } else if (performance.errorRate > errorRateThreshold.warning) {
      if (status !== 'critical') status = 'warning';
      issues.push(`Elevated error rate: ${(performance.errorRate * 100).toFixed(1)}%`);
    }

    const throughputThreshold = this.thresholds.get('throughput');
    if (performance.throughput < throughputThreshold.critical) {
      status = 'critical';
      issues.push(`Low throughput: ${performance.throughput.toFixed(1)} ops/min`);
    } else if (performance.throughput < throughputThreshold.warning) {
      if (status !== 'critical') status = 'warning';
      issues.push(`Reduced throughput: ${performance.throughput.toFixed(1)} ops/min`);
    }

    return {
      componentName,
      status,
      lastCheck: new Date(),
      metrics: {
        averageLatency: performance.averageResponseTime,
        errorRate: performance.errorRate,
        throughput: performance.throughput,
      },
      issues,
    };
  }

  // Perform health check
  private performHealthCheck(): void {
    const components = Array.from(this.metrics.keys());

    for (const component of components) {
      const health = this.getComponentHealth(component);

      if (health.status === 'critical' || health.status === 'warning') {
        console.warn(`Component ${component} health: ${health.status}`, health.issues);
      }
    }
  }

  // Generate performance alerts
  private generateAlerts(): void {
    const components = Array.from(this.metrics.keys());

    for (const component of components) {
      const performance = this.getComponentPerformance(component);

      // Check response time
      const responseTimeThreshold = this.thresholds.get('response_time');
      if (performance.averageResponseTime > responseTimeThreshold.critical) {
        this.createAlert(
          'LATENCY',
          'critical',
          component,
          `Critical response time: ${performance.averageResponseTime}ms`,
          responseTimeThreshold.critical,
          performance.averageResponseTime,
          'Consider scaling resources or optimizing algorithms'
        );
      } else if (performance.averageResponseTime > responseTimeThreshold.warning) {
        this.createAlert(
          'LATENCY',
          'medium',
          component,
          `High response time: ${performance.averageResponseTime}ms`,
          responseTimeThreshold.warning,
          performance.averageResponseTime,
          'Monitor closely and consider optimization'
        );
      }

      // Check error rate
      const errorRateThreshold = this.thresholds.get('error_rate');
      if (performance.errorRate > errorRateThreshold.critical) {
        this.createAlert(
          'ERROR_RATE',
          'critical',
          component,
          `Critical error rate: ${(performance.errorRate * 100).toFixed(1)}%`,
          errorRateThreshold.critical,
          performance.errorRate,
          'Investigate errors immediately and implement fixes'
        );
      } else if (performance.errorRate > errorRateThreshold.warning) {
        this.createAlert(
          'ERROR_RATE',
          'medium',
          component,
          `High error rate: ${(performance.errorRate * 100).toFixed(1)}%`,
          errorRateThreshold.warning,
          performance.errorRate,
          'Review error logs and identify patterns'
        );
      }

      // Check throughput
      const throughputThreshold = this.thresholds.get('throughput');
      if (performance.throughput < throughputThreshold.critical) {
        this.createAlert(
          'THROUGHPUT',
          'critical',
          component,
          `Critical low throughput: ${performance.throughput.toFixed(1)} ops/min`,
          throughputThreshold.critical,
          performance.throughput,
          'Scale resources or optimize processing pipeline'
        );
      }
    }
  }

  // Create performance alert
  private createAlert(
    type: PerformanceAlert['type'],
    severity: PerformanceAlert['severity'],
    componentName: string,
    message: string,
    threshold: number,
    currentValue: number,
    recommendation: string
  ): void {
    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      message,
      timestamp: new Date(),
      componentName,
      threshold,
      currentValue,
      recommendation,
    };

    this.alerts.push(alert);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts.splice(0, this.alerts.length - 100);
    }
  }

  // Get active alerts
  public getActiveAlerts(severity?: PerformanceAlert['severity']): PerformanceAlert[] {
    let alerts = this.alerts.filter(alert => {
      const age = Date.now() - alert.timestamp.getTime();
      return age < 24 * 60 * 60 * 1000; // Last 24 hours
    });

    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }

    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Generate optimization recommendations
  public generateOptimizationRecommendations(): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    const systemPerformance = this.getSystemPerformance();

    // High response time recommendations
    if (systemPerformance.averageResponseTime > 2000) {
      recommendations.push({
        id: 'opt_response_time',
        type: 'CONFIGURATION',
        priority: 'high',
        title: 'Optimize Response Time',
        description: 'System response time is higher than optimal',
        expectedImpact: 'Reduce response time by 30-50%',
        implementationEffort: 'medium',
        recommendation: 'Increase batch size, optimize database queries, or implement caching',
      });
    }

    // High error rate recommendations
    if (systemPerformance.errorRate > 0.05) {
      recommendations.push({
        id: 'opt_error_rate',
        type: 'ALGORITHM',
        priority: 'high',
        title: 'Reduce Error Rate',
        description: 'Error rate is above acceptable threshold',
        expectedImpact: 'Improve system reliability by 20-40%',
        implementationEffort: 'medium',
        recommendation:
          'Review error logs, implement better error handling, and add input validation',
      });
    }

    // Low throughput recommendations
    if (systemPerformance.throughput < 10) {
      recommendations.push({
        id: 'opt_throughput',
        type: 'SCALING',
        priority: 'medium',
        title: 'Improve Throughput',
        description: 'System throughput is below optimal levels',
        expectedImpact: 'Increase processing capacity by 50-100%',
        implementationEffort: 'high',
        recommendation: 'Scale horizontally, optimize algorithms, or increase processing frequency',
      });
    }

    // Memory usage recommendations
    if (systemPerformance.memoryUsage > 0.8) {
      recommendations.push({
        id: 'opt_memory',
        type: 'RESOURCE',
        priority: 'medium',
        title: 'Optimize Memory Usage',
        description: 'Memory usage is approaching limits',
        expectedImpact: 'Reduce memory pressure and improve stability',
        implementationEffort: 'medium',
        recommendation:
          'Implement memory cleanup, optimize data structures, or increase memory allocation',
      });
    }

    return recommendations;
  }

  // Clean old metrics
  private cleanOldMetrics(): void {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours

    for (const [component, metrics] of this.metrics.entries()) {
      const recentMetrics = metrics.filter(m => m.timestamp > cutoffTime);
      this.metrics.set(component, recentMetrics);
    }
  }

  // Get memory usage (mock implementation)
  private getMemoryUsage(): number {
    // In production, this would use actual memory monitoring
    return Math.random() * 0.8; // 0-80%
  }

  // Get CPU usage (mock implementation)
  private getCpuUsage(): number {
    // In production, this would use actual CPU monitoring
    return Math.random() * 0.6; // 0-60%
  }

  // Get queue backlog (mock implementation)
  private getQueueBacklog(): number {
    // In production, this would get actual queue length
    return Math.floor(Math.random() * 50); // 0-50
  }

  // Export performance data
  public exportPerformanceData(
    componentName?: string,
    timeRange: number = 24 * 60 * 60 * 1000
  ): any {
    const cutoffTime = new Date(Date.now() - timeRange);
    const exportData: any = {
      timestamp: new Date().toISOString(),
      timeRange,
      components: {},
    };

    const components = componentName ? [componentName] : Array.from(this.metrics.keys());

    for (const component of components) {
      const metrics = this.metrics.get(component) || [];
      const recentMetrics = metrics.filter(m => m.timestamp > cutoffTime);

      exportData.components[component] = {
        totalOperations: recentMetrics.length,
        performance: this.getComponentPerformance(component, timeRange),
        health: this.getComponentHealth(component),
        metrics: recentMetrics,
      };
    }

    return exportData;
  }
}
