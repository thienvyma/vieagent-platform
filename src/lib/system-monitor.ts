// System Resource Monitoring
export class SystemMonitor {
  static startMonitoring(intervalMs = 60000) {
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      const metrics = {
        memory: {
          rss: Math.round(memUsage.rss / 1024 / 1024), // MB
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
          external: Math.round(memUsage.external / 1024 / 1024), // MB
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system,
        },
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      };

      // Log system metrics
      console.log('SYSTEM_METRICS:', JSON.stringify(metrics));

      // Alert on high memory usage
      if (metrics.memory.heapUsed > 512) {
        console.warn('HIGH_MEMORY_USAGE:', {
          heapUsed: metrics.memory.heapUsed,
          threshold: 512,
          timestamp: metrics.timestamp,
        });
      }
    }, intervalMs);
  }

  static getHealthStatus() {
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);

    return {
      status: heapUsedMB < 512 ? 'healthy' : 'warning',
      memory: {
        heapUsed: heapUsedMB,
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}

// Start monitoring in production
if (process.env.NODE_ENV === 'production') {
  SystemMonitor.startMonitoring();
}
