import { NextRequest, NextResponse } from 'next/server';

export interface RateLimitRule {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests in window
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  keyGenerator?: (req: NextRequest) => string; // Custom key generator
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp when window resets
  total: number; // Total requests made
}

export class RateLimiter {
  private static store = new Map<
    string,
    { count: number; resetTime: number; requests: number[] }
  >();

  // Default rate limit rules for different endpoints
  private static defaultRules: Record<string, RateLimitRule> = {
    // API endpoints
    '/api/': {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100, // 100 requests per 15 minutes
      message: 'Too many API requests. Please try again later.',
    },

    // Authentication endpoints
    '/api/auth/': {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: 10, // 10 auth attempts per 5 minutes
      message: 'Too many authentication attempts. Please try again in 5 minutes.',
    },

    // Admin endpoints
    '/api/admin/': {
      windowMs: 10 * 60 * 1000, // 10 minutes
      maxRequests: 200, // 200 admin requests per 10 minutes
      message: 'Admin rate limit exceeded. Please try again later.',
    },

    // Upload endpoints
    '/api/upload/': {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 50, // 50 uploads per hour
      message: 'Upload rate limit exceeded. Please try again in an hour.',
    },

    // Chat/AI endpoints
    '/api/chat/': {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30, // 30 chat messages per minute
      message: 'Chat rate limit exceeded. Please slow down.',
    },

    // Knowledge endpoints
    '/api/knowledge/': {
      windowMs: 10 * 60 * 1000, // 10 minutes
      maxRequests: 150, // 150 knowledge requests per 10 minutes
      message: 'Knowledge API rate limit exceeded.',
    },

    // Agent endpoints
    '/api/agents/': {
      windowMs: 10 * 60 * 1000, // 10 minutes
      maxRequests: 100, // 100 agent requests per 10 minutes
      message: 'Agent API rate limit exceeded.',
    },
  };

  /**
   * Check if request should be rate limited
   */
  static async checkRateLimit(
    req: NextRequest,
    rule?: RateLimitRule
  ): Promise<{
    allowed: boolean;
    info: RateLimitInfo;
    response?: NextResponse;
  }> {
    const pathname = new URL(req.url).pathname;

    // Find matching rule
    const effectiveRule = rule || this.findMatchingRule(pathname);
    if (!effectiveRule) {
      // No rate limiting rule found
      return {
        allowed: true,
        info: { limit: 0, remaining: 0, reset: 0, total: 0 },
      };
    }

    // Generate key for this request
    const key = effectiveRule.keyGenerator
      ? effectiveRule.keyGenerator(req)
      : this.defaultKeyGenerator(req);

    // Check current status
    const now = Date.now();
    const store = this.store.get(key);
    const windowStart = now - effectiveRule.windowMs;

    if (!store || store.resetTime < now) {
      // Initialize or reset window
      this.store.set(key, {
        count: 1,
        resetTime: now + effectiveRule.windowMs,
        requests: [now],
      });

      return {
        allowed: true,
        info: {
          limit: effectiveRule.maxRequests,
          remaining: effectiveRule.maxRequests - 1,
          reset: now + effectiveRule.windowMs,
          total: 1,
        },
      };
    }

    // Clean old requests
    store.requests = store.requests.filter(time => time > windowStart);
    store.count = store.requests.length;

    // Check if limit exceeded
    if (store.count >= effectiveRule.maxRequests) {
      const info: RateLimitInfo = {
        limit: effectiveRule.maxRequests,
        remaining: 0,
        reset: store.resetTime,
        total: store.count,
      };

      const response = NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: effectiveRule.message || 'Too many requests',
          retryAfter: Math.ceil((store.resetTime - now) / 1000),
          ...info,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': effectiveRule.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': store.resetTime.toString(),
            'Retry-After': Math.ceil((store.resetTime - now) / 1000).toString(),
          },
        }
      );

      return {
        allowed: false,
        info,
        response,
      };
    }

    // Allow request and update counter
    store.requests.push(now);
    store.count = store.requests.length;
    this.store.set(key, store);

    return {
      allowed: true,
      info: {
        limit: effectiveRule.maxRequests,
        remaining: effectiveRule.maxRequests - store.count,
        reset: store.resetTime,
        total: store.count,
      },
    };
  }

  /**
   * Add rate limit headers to response
   */
  static addRateLimitHeaders(response: NextResponse, info: RateLimitInfo): NextResponse {
    response.headers.set('X-RateLimit-Limit', info.limit.toString());
    response.headers.set('X-RateLimit-Remaining', info.remaining.toString());
    response.headers.set('X-RateLimit-Reset', info.reset.toString());

    return response;
  }

  /**
   * Create rate limit middleware for API routes
   */
  static middleware(rule?: RateLimitRule) {
    return async (req: NextRequest): Promise<NextResponse | null> => {
      const result = await this.checkRateLimit(req, rule);

      if (!result.allowed && result.response) {
        return result.response;
      }

      return null; // Continue to next middleware
    };
  }

  /**
   * Get current rate limit status for a key
   */
  static getStatus(req: NextRequest, rule?: RateLimitRule): RateLimitInfo | null {
    const pathname = new URL(req.url).pathname;
    const effectiveRule = rule || this.findMatchingRule(pathname);

    if (!effectiveRule) return null;

    const key = effectiveRule.keyGenerator
      ? effectiveRule.keyGenerator(req)
      : this.defaultKeyGenerator(req);

    const store = this.store.get(key);
    if (!store) {
      return {
        limit: effectiveRule.maxRequests,
        remaining: effectiveRule.maxRequests,
        reset: Date.now() + effectiveRule.windowMs,
        total: 0,
      };
    }

    const now = Date.now();
    const validRequests = store.requests.filter(time => time > now - effectiveRule.windowMs);

    return {
      limit: effectiveRule.maxRequests,
      remaining: Math.max(0, effectiveRule.maxRequests - validRequests.length),
      reset: store.resetTime,
      total: validRequests.length,
    };
  }

  /**
   * Clear rate limit data for testing or reset
   */
  static clear(key?: string) {
    if (key) {
      this.store.delete(key);
    } else {
      this.store.clear();
    }
  }

  /**
   * Get rate limiting statistics
   */
  static getStats() {
    const now = Date.now();
    let activeKeys = 0;
    let totalRequests = 0;

    for (const [key, store] of this.store.entries()) {
      if (store.resetTime > now) {
        activeKeys++;
        totalRequests += store.count;
      }
    }

    return {
      activeKeys,
      totalRequests,
      storeSize: this.store.size,
      timestamp: now,
    };
  }

  // Private helper methods
  private static findMatchingRule(pathname: string): RateLimitRule | null {
    // Find the most specific matching rule
    const sortedPaths = Object.keys(this.defaultRules).sort((a, b) => b.length - a.length);

    for (const path of sortedPaths) {
      if (pathname.startsWith(path)) {
        return this.defaultRules[path];
      }
    }

    return null;
  }

  private static defaultKeyGenerator(req: NextRequest): string {
    // Use IP address and user agent for identification
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      req.headers.get('x-client-ip') ||
      'unknown';

    const userAgent = req.headers.get('user-agent') || 'unknown';
    const pathname = new URL(req.url).pathname;

    // Create a simple hash
    const identifier = `${ip}:${userAgent}:${pathname}`;
    return Buffer.from(identifier).toString('base64').slice(0, 32);
  }

  /**
   * Clean up expired entries (should be called periodically)
   */
  static cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, store] of this.store.entries()) {
      if (store.resetTime < now) {
        this.store.delete(key);
        cleaned++;
      }
    }

    return { cleaned, remaining: this.store.size };
  }
}

// Export middleware creator for easy use
export const createRateLimitMiddleware = (rule?: RateLimitRule) => {
  return RateLimiter.middleware(rule);
};

// Export predefined rate limiters
export const rateLimiters = {
  api: () => createRateLimitMiddleware(RateLimiter['defaultRules']['/api/']),
  auth: () => createRateLimitMiddleware(RateLimiter['defaultRules']['/api/auth/']),
  admin: () => createRateLimitMiddleware(RateLimiter['defaultRules']['/api/admin/']),
  upload: () => createRateLimitMiddleware(RateLimiter['defaultRules']['/api/upload/']),
  chat: () => createRateLimitMiddleware(RateLimiter['defaultRules']['/api/chat/']),
  strict: () =>
    createRateLimitMiddleware({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10, // Very strict: 10 requests per minute
      message: 'Strict rate limit exceeded. Please slow down significantly.',
    }),
  generous: () =>
    createRateLimitMiddleware({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 1000, // Very generous: 1000 requests per minute
      message: 'Rate limit exceeded (generous tier).',
    }),
};

export default RateLimiter;
