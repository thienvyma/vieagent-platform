// Database Performance Monitoring
export class DatabaseMonitor {
  static async trackQuery(queryName, queryFn) {
    const startTime = process.hrtime.bigint();

    try {
      const result = await queryFn();
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

      // Log slow queries
      if (duration > 100) {
        console.warn('SLOW_QUERY:', {
          name: queryName,
          duration: `${duration.toFixed(2)}ms`,
          timestamp: new Date().toISOString(),
        });
      }

      // Track metrics
      this.recordMetric('database_query_duration', duration, { query: queryName });

      return result;
    } catch (error) {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000;

      console.error('QUERY_ERROR:', {
        name: queryName,
        duration: `${duration.toFixed(2)}ms`,
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }

  static recordMetric(name, value, tags = {}) {
    const metric = {
      name,
      value,
      tags,
      timestamp: new Date().toISOString(),
    };

    // In production, send to metrics service
            // Metric logged to database
  }
}

// Usage example:
// const users = await DatabaseMonitor.trackQuery('get_users', () =>
//   prisma.user.findMany()
// );
