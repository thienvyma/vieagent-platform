// API Error Middleware
export function withErrorHandling(handler: any) {
  return async (req: any, res: any) => {
    try {
      return await handler(req, res);
    } catch (error: any) {
      // Log error
      console.error('API_ERROR:', {
        path: req.url,
        method: req.method,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });

      // Return appropriate error response
      const statusCode = error.statusCode || 500;
      const message =
        process.env.NODE_ENV === 'production' ? 'Internal Server Error' : error.message;

      res.status(statusCode).json({
        error: message,
        timestamp: new Date().toISOString(),
        path: req.url,
      });
    }
  };
}

// Database Error Handler
export function handleDatabaseError(error: any) {
  if (error.code === 'P2002') {
    return { statusCode: 400, message: 'Unique constraint violation' };
  }
  if (error.code === 'P2025') {
    return { statusCode: 404, message: 'Record not found' };
  }

  return { statusCode: 500, message: 'Database error occurred' };
}
