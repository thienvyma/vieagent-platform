/**
 * 🔗 API Response Standardization - Day 3.1
 * ==========================================
 * Unified response format and helper functions for all API endpoints
 */

import { NextResponse } from 'next/server';

// 📋 Standard API Response Interface
export interface StandardApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    timestamp: string;
    requestId?: string;
    version?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    performance?: {
      responseTime: number;
      cached: boolean;
    };
  };
}

// 🔧 Response Type Definitions
export interface ApiErrorResponse extends StandardApiResponse<null> {
  success: false;
  error: string;
  data?: null;
}

export interface ApiSuccessResponse<T> extends StandardApiResponse<T> {
  success: true;
  data: T;
  error?: never;
}

// 📊 Pagination Interface
export interface PaginationParams {
  page?: number;
  limit?: number;
  total?: number;
}

// ⚡ Performance Tracking
export interface PerformanceMetrics {
  startTime: number;
  cached?: boolean;
}

/**
 * 🎯 Standard Success Response Helper
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  meta?: Partial<StandardApiResponse['meta']>
): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    ...(message && { message }),
    meta: {
      timestamp: new Date().toISOString(),
      version: '1.0',
      ...meta,
    },
  };
}

/**
 * ❌ Standard Error Response Helper
 */
export function createErrorResponse(
  error: string,
  meta?: Partial<StandardApiResponse['meta']>
): ApiErrorResponse {
  return {
    success: false,
    error,
    meta: {
      timestamp: new Date().toISOString(),
      version: '1.0',
      ...meta,
    },
  };
}

/**
 * 📄 Paginated Response Helper
 */
export function createPaginatedResponse<T>(
  data: T[],
  pagination: Required<PaginationParams>,
  message?: string
): ApiSuccessResponse<T[]> {
  const { page, limit, total } = pagination;
  const totalPages = Math.ceil(total / limit);

  return createSuccessResponse(data, message, {
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  });
}

/**
 * ⚡ Performance Response Helper
 */
export function createPerformanceResponse<T>(
  data: T,
  metrics: PerformanceMetrics,
  message?: string
): ApiSuccessResponse<T> {
  const responseTime = Date.now() - metrics.startTime;

  return createSuccessResponse(data, message, {
    performance: {
      responseTime,
      cached: metrics.cached || false,
    },
  });
}

/**
 * 🌐 NextResponse Helpers
 */
export function successResponse<T>(
  data: T,
  message?: string,
  meta?: Partial<StandardApiResponse['meta']>,
  status: number = 200
): NextResponse {
  return NextResponse.json(createSuccessResponse(data, message, meta), { status });
}

export function errorResponse(
  error: string,
  status: number = 500,
  meta?: Partial<StandardApiResponse['meta']>
): NextResponse {
  return NextResponse.json(createErrorResponse(error, meta), { status });
}

export function paginatedResponse<T>(
  data: T[],
  pagination: Required<PaginationParams>,
  message?: string,
  status: number = 200
): NextResponse {
  return NextResponse.json(createPaginatedResponse(data, pagination, message), { status });
}

/**
 * 🔒 Common Error Response Shortcuts
 */
export const commonErrors = {
  unauthorized: () => errorResponse('Unauthorized', 401),
  forbidden: () => errorResponse('Forbidden', 403),
  notFound: (resource = 'Resource') => errorResponse(`${resource} not found`, 404),
  badRequest: (message = 'Bad request') => errorResponse(message, 400),
  conflict: (message = 'Resource already exists') => errorResponse(message, 409),
  validationError: (message = 'Validation failed') => errorResponse(message, 422),
  tooManyRequests: () => errorResponse('Too many requests', 429),
  internalError: () => errorResponse('Internal server error', 500),
};

/**
 * 🧪 Response Validator (for testing)
 */
export function validateStandardResponse(response: any): boolean {
  if (!response || typeof response !== 'object') return false;

  const hasRequiredFields = 'success' in response && typeof response.success === 'boolean';

  if (response.success) {
    return 'data' in response;
  } else {
    return 'error' in response && typeof response.error === 'string';
  }
}

/**
 * 📊 Response Statistics Tracker
 */
export class ResponseTracker {
  private static stats = {
    totalRequests: 0,
    successCount: 0,
    errorCount: 0,
    averageResponseTime: 0,
    lastReset: new Date(),
  };

  static track(success: boolean, responseTime: number): void {
    this.stats.totalRequests++;

    if (success) {
      this.stats.successCount++;
    } else {
      this.stats.errorCount++;
    }

    // Calculate rolling average
    this.stats.averageResponseTime = (this.stats.averageResponseTime + responseTime) / 2;
  }

  static getStats() {
    return {
      ...this.stats,
      successRate:
        this.stats.totalRequests > 0
          ? (this.stats.successCount / this.stats.totalRequests) * 100
          : 0,
    };
  }

  static reset(): void {
    this.stats = {
      totalRequests: 0,
      successCount: 0,
      errorCount: 0,
      averageResponseTime: 0,
      lastReset: new Date(),
    };
  }
}

export default {
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
  createPerformanceResponse,
  successResponse,
  errorResponse,
  paginatedResponse,
  commonErrors,
  validateStandardResponse,
  ResponseTracker,
};
