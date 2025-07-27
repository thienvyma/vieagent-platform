// API Performance Monitoring
export function withPerformanceTracking(handler) {
  return async (req, res) => {
    const startTime = process.hrtime.bigint();

    // Override res.json to capture response time
    const originalJson = res.json;
    res.json = function (data) {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000;

      // Log API performance
      console.log('API_PERFORMANCE:', {
        method: req.method,
        path: req.url,
        duration: `${duration.toFixed(2)}ms`,
        status: res.statusCode,
        timestamp: new Date().toISOString(),
      });

      // Add performance header
      res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);

      return originalJson.call(this, data);
    };

    try {
      return await handler(req, res);
    } catch (error) {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000;

      console.error('API_ERROR_PERFORMANCE:', {
        method: req.method,
        path: req.url,
        duration: `${duration.toFixed(2)}ms`,
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  };
}
