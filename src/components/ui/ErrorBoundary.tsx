'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showErrorDetails?: boolean;
  context?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generate a unique error ID for tracking
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send error to monitoring service (you can integrate with Sentry, LogRocket, etc.)
    this.logErrorToService(error, errorInfo);
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    try {
      // In a real application, you would send this to your error tracking service
      const errorReport = {
        errorId: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        context: this.props.context || 'Unknown',
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
      };

      // For now, just log to console
      console.error('Error Report:', errorReport);

      // You can send to your error tracking service here
      // fetch('/api/errors', { method: 'POST', body: JSON.stringify(errorReport) });
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    }
  };

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: '',
      });
    }
  };

  private handleRefresh = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard';
    }
  };

  private handleGoBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  render() {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className='min-h-screen bg-gray-900 flex items-center justify-center p-4'>
          <div className='max-w-2xl w-full bg-gray-800 rounded-lg shadow-xl border border-gray-700'>
            <div className='p-8'>
              {/* Header */}
              <div className='flex items-center mb-6'>
                <div className='flex-shrink-0'>
                  <AlertTriangle className='w-12 h-12 text-red-400' />
                </div>
                <div className='ml-4'>
                  <h1 className='text-2xl font-bold text-white'>Something went wrong</h1>
                  <p className='text-gray-400 mt-1'>
                    We encountered an unexpected error. Don't worry, we're on it!
                  </p>
                </div>
              </div>

              {/* Error ID */}
              <div className='bg-gray-700 rounded-lg p-4 mb-6'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-gray-300'>Error ID:</span>
                  <code className='text-sm font-mono text-blue-400 bg-gray-600 px-2 py-1 rounded'>
                    {this.state.errorId}
                  </code>
                </div>
              </div>

              {/* Action buttons */}
              <div className='flex flex-wrap gap-3 mb-6'>
                {this.retryCount < this.maxRetries && (
                  <Button
                    onClick={this.handleRetry}
                    className='flex items-center bg-blue-600 hover:bg-blue-700'
                  >
                    <RefreshCw className='w-4 h-4 mr-2' />
                    Try Again ({this.maxRetries - this.retryCount} left)
                  </Button>
                )}

                <Button
                  onClick={this.handleRefresh}
                  variant='outline'
                  className='flex items-center border-gray-600 text-gray-300 hover:bg-gray-700'
                >
                  <RefreshCw className='w-4 h-4 mr-2' />
                  Refresh Page
                </Button>

                <Button
                  onClick={this.handleGoHome}
                  variant='outline'
                  className='flex items-center border-gray-600 text-gray-300 hover:bg-gray-700'
                >
                  <Home className='w-4 h-4 mr-2' />
                  Go to Dashboard
                </Button>

                <Button
                  onClick={this.handleGoBack}
                  variant='outline'
                  className='flex items-center border-gray-600 text-gray-300 hover:bg-gray-700'
                >
                  <ArrowLeft className='w-4 h-4 mr-2' />
                  Go Back
                </Button>
              </div>

              {/* Error details (only in development or if explicitly enabled) */}
              {(process.env.NODE_ENV === 'development' || this.props.showErrorDetails) &&
                this.state.error && (
                  <details className='bg-gray-700 rounded-lg p-4'>
                    <summary className='text-sm font-medium text-gray-300 cursor-pointer mb-3'>
                      Technical Details (Click to expand)
                    </summary>
                    <div className='space-y-4'>
                      <div>
                        <h4 className='text-sm font-medium text-red-400 mb-2'>Error Message:</h4>
                        <pre className='text-xs text-gray-300 bg-gray-800 p-3 rounded overflow-x-auto'>
                          {this.state.error.message}
                        </pre>
                      </div>

                      {this.state.error.stack && (
                        <div>
                          <h4 className='text-sm font-medium text-red-400 mb-2'>Stack Trace:</h4>
                          <pre className='text-xs text-gray-300 bg-gray-800 p-3 rounded overflow-x-auto max-h-40 overflow-y-auto'>
                            {this.state.error.stack}
                          </pre>
                        </div>
                      )}

                      {this.state.errorInfo?.componentStack && (
                        <div>
                          <h4 className='text-sm font-medium text-red-400 mb-2'>
                            Component Stack:
                          </h4>
                          <pre className='text-xs text-gray-300 bg-gray-800 p-3 rounded overflow-x-auto max-h-40 overflow-y-auto'>
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                )}

              {/* Contact info */}
              <div className='mt-6 p-4 bg-blue-900/20 rounded-lg border border-blue-800'>
                <p className='text-sm text-blue-200'>
                  If this error persists, please contact support with the Error ID above.
                  {this.props.context && (
                    <span className='block mt-1 text-xs text-blue-300'>
                      Context: {this.props.context}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// Hook for handling async errors in functional components
export function useErrorHandler() {
  const handleError = React.useCallback((error: Error, context?: string) => {
    // Throw the error to be caught by the nearest error boundary
    throw error;
  }, []);

  return handleError;
}
