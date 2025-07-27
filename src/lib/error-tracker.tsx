import React from 'react';

// Global Error Handler for Production
export class ErrorTracker {
  static async captureException(error, context = {}) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context,
      environment: process.env.NODE_ENV,
      url: context.url || 'unknown',
      userAgent: context.userAgent || 'unknown',
      userId: context.userId || 'anonymous',
    };

    // Log to file
    console.error('CAPTURED_ERROR:', JSON.stringify(errorData, null, 2));

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Integration with Sentry, LogRocket, or similar service
      // await sendToErrorTrackingService(errorData);
    }

    return errorData;
  }

  static async captureMessage(message, level = 'info', context = {}) {
    const logData = {
      message,
      level,
      timestamp: new Date().toISOString(),
      context,
      environment: process.env.NODE_ENV,
    };

    console.log('CAPTURED_MESSAGE:', JSON.stringify(logData, null, 2));
    return logData;
  }
}

// React Error Boundary
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    ErrorTracker.captureException(error, {
      errorInfo,
      component: this.constructor.name,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='error-boundary'>
          <h2>Something went wrong</h2>
          <p>We've been notified about this error.</p>
          <button onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      );
    }

    return this.props.children;
  }
}
