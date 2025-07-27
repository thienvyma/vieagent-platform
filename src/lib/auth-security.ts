// ✅ Phase 5 - Enhanced Auth Security Service
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth';
import { NextRequest, NextResponse } from 'next/server';

export interface RefreshTokenData {
  userId: string;
  refreshToken: string;
  expiresAt: Date;
  createdAt: Date;
  lastUsed: Date;
  deviceInfo?: {
    userAgent: string;
    ip: string;
    fingerprint: string;
  };
}

export interface SecurityEvent {
  type:
    | 'login'
    | 'logout'
    | 'refresh'
    | 'failed_attempt'
    | 'suspicious_activity'
    | 'session_validation';
  userId: string;
  ip: string;
  userAgent: string;
  timestamp: Date;
  details?: Record<string, any>;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

class AuthSecurityService {
  private rateLimitMap = new Map<string, { count: number; resetTime: number }>();
  private refreshTokens = new Map<string, RefreshTokenData>();
  private securityEvents: SecurityEvent[] = [];
  private suspiciousIPs = new Set<string>();

  // ✅ Phase 5 - Rate limiting implementation
  async checkRateLimit(
    identifier: string,
    config: RateLimitConfig = { windowMs: 15 * 60 * 1000, maxRequests: 100 }
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const key = `ratelimit:${identifier}`;

    let rateLimitData = this.rateLimitMap.get(key);

    if (!rateLimitData || now > rateLimitData.resetTime) {
      rateLimitData = {
        count: 0,
        resetTime: now + config.windowMs,
      };
    }

    rateLimitData.count++;
    this.rateLimitMap.set(key, rateLimitData);

    const allowed = rateLimitData.count <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - rateLimitData.count);

    return {
      allowed,
      remaining,
      resetTime: rateLimitData.resetTime,
    };
  }

  // ✅ Phase 5 - Enhanced session validation with security checks
  async validateSession(request: NextRequest): Promise<{
    valid: boolean;
    session?: any;
    securityWarnings?: string[];
    shouldRefresh?: boolean;
  }> {
    try {
      const session = await getServerSession(authOptions);

      if (!session?.user) {
        return { valid: false };
      }

      const warnings: string[] = [];
      const clientIP = this.getClientIP(request);
      const userAgent = request.headers.get('user-agent') || '';

      // Check for suspicious activity
      if (this.suspiciousIPs.has(clientIP)) {
        warnings.push('Request from suspicious IP address');
      }

      // Check session age
      const sessionAge = Date.now() - (session.user as any).iat * 1000;
      const shouldRefresh = sessionAge > 24 * 60 * 60 * 1000; // 24 hours

      if (shouldRefresh) {
        warnings.push('Session is approaching expiration');
      }

      // Log security event
      this.logSecurityEvent('session_validation', session.user.id, clientIP, userAgent, {
        sessionAge,
        warnings: warnings.length,
      });

      return {
        valid: true,
        session,
        securityWarnings: warnings,
        shouldRefresh,
      };
    } catch (error) {
      console.error('Session validation error:', error);
      return { valid: false };
    }
  }

  // ✅ Phase 5 - Refresh token implementation
  async generateRefreshToken(
    userId: string,
    deviceInfo: RefreshTokenData['deviceInfo']
  ): Promise<string> {
    const refreshToken = this.generateSecureToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const tokenData: RefreshTokenData = {
      userId,
      refreshToken,
      expiresAt,
      createdAt: new Date(),
      lastUsed: new Date(),
      deviceInfo,
    };

    this.refreshTokens.set(refreshToken, tokenData);

    // Clean up expired tokens
    this.cleanupExpiredTokens();

    return refreshToken;
  }

  async validateRefreshToken(refreshToken: string): Promise<{
    valid: boolean;
    userId?: string;
    shouldRotate?: boolean;
  }> {
    const tokenData = this.refreshTokens.get(refreshToken);

    if (!tokenData) {
      return { valid: false };
    }

    if (tokenData.expiresAt < new Date()) {
      this.refreshTokens.delete(refreshToken);
      return { valid: false };
    }

    // Update last used
    tokenData.lastUsed = new Date();
    this.refreshTokens.set(refreshToken, tokenData);

    // Check if token should be rotated (used for more than 7 days)
    const tokenAge = Date.now() - tokenData.createdAt.getTime();
    const shouldRotate = tokenAge > 7 * 24 * 60 * 60 * 1000;

    return {
      valid: true,
      userId: tokenData.userId,
      shouldRotate,
    };
  }

  async rotateRefreshToken(
    oldToken: string,
    deviceInfo: RefreshTokenData['deviceInfo']
  ): Promise<string | null> {
    const validation = await this.validateRefreshToken(oldToken);

    if (!validation.valid || !validation.userId) {
      return null;
    }

    // Remove old token
    this.refreshTokens.delete(oldToken);

    // Generate new token
    return await this.generateRefreshToken(validation.userId, deviceInfo);
  }

  // ✅ Phase 5 - Security event logging
  logSecurityEvent(
    type: SecurityEvent['type'],
    userId: string,
    ip: string,
    userAgent: string,
    details?: Record<string, any>
  ): void {
    const event: SecurityEvent = {
      type,
      userId,
      ip,
      userAgent,
      timestamp: new Date(),
      details,
    };

    this.securityEvents.push(event);

    // Keep only last 1000 events
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-1000);
    }

    // Check for suspicious patterns
    this.analyzeSuspiciousActivity(event);
  }

  // ✅ Phase 5 - Suspicious activity detection
  private analyzeSuspiciousActivity(event: SecurityEvent): void {
    const recentEvents = this.securityEvents.filter(
      e => e.ip === event.ip && Date.now() - e.timestamp.getTime() < 5 * 60 * 1000 // Last 5 minutes
    );

    // Multiple failed attempts from same IP
    const failedAttempts = recentEvents.filter(e => e.type === 'failed_attempt').length;
    if (failedAttempts >= 5) {
      this.suspiciousIPs.add(event.ip);
      console.warn(`Suspicious activity detected from IP: ${event.ip}`);
    }

    // Multiple different user agents from same IP
    const userAgents = new Set(recentEvents.map(e => e.userAgent));
    if (userAgents.size >= 3) {
      this.suspiciousIPs.add(event.ip);
      console.warn(`Multiple user agents detected from IP: ${event.ip}`);
    }
  }

  // ✅ Phase 5 - Session timeout handling
  async handleSessionTimeout(userId: string): Promise<void> {
    // Revoke all refresh tokens for user
    const userTokens = Array.from(this.refreshTokens.entries()).filter(
      ([_, data]) => data.userId === userId
    );

    for (const [token, _] of userTokens) {
      this.refreshTokens.delete(token);
    }

    this.logSecurityEvent('logout', userId, '', '', {
      reason: 'session_timeout',
      tokensRevoked: userTokens.length,
    });
  }

  // ✅ Phase 5 - Device fingerprinting
  generateDeviceFingerprint(request: NextRequest): string {
    const userAgent = request.headers.get('user-agent') || '';
    const acceptLanguage = request.headers.get('accept-language') || '';
    const acceptEncoding = request.headers.get('accept-encoding') || '';
    const ip = this.getClientIP(request);

    const fingerprint = `${userAgent}:${acceptLanguage}:${acceptEncoding}:${ip}`;
    return Buffer.from(fingerprint).toString('base64');
  }

  // ✅ Phase 5 - Rate limiting middleware
  createRateLimitMiddleware(config: RateLimitConfig) {
    return async (request: NextRequest): Promise<NextResponse | null> => {
      const identifier = this.getClientIP(request);
      const rateLimit = await this.checkRateLimit(identifier, config);

      if (!rateLimit.allowed) {
        const response = NextResponse.json({ error: 'Too many requests' }, { status: 429 });

        response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
        response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
        response.headers.set('X-RateLimit-Reset', new Date(rateLimit.resetTime).toISOString());

        return response;
      }

      return null; // Allow request to proceed
    };
  }

  // ✅ Phase 5 - Security headers middleware
  addSecurityHeaders(response: NextResponse): NextResponse {
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    // HSTS header for HTTPS
    if (process.env.NODE_ENV === 'production') {
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    return response;
  }

  // Utility methods
  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');

    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    if (realIP) {
      return realIP;
    }

    return 'unknown';
  }

  private generateSecureToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private cleanupExpiredTokens(): void {
    const now = new Date();
    for (const [token, data] of this.refreshTokens.entries()) {
      if (data.expiresAt < now) {
        this.refreshTokens.delete(token);
      }
    }
  }

  // Public API for getting security stats
  getSecurityStats(): {
    activeRefreshTokens: number;
    recentSecurityEvents: SecurityEvent[];
    suspiciousIPs: string[];
    rateLimitEntries: number;
  } {
    return {
      activeRefreshTokens: this.refreshTokens.size,
      recentSecurityEvents: this.securityEvents.slice(-50),
      suspiciousIPs: Array.from(this.suspiciousIPs),
      rateLimitEntries: this.rateLimitMap.size,
    };
  }
}

// Export singleton instance
export const authSecurityService = new AuthSecurityService();

// Export utility functions
export async function withRateLimit(
  request: NextRequest,
  config?: RateLimitConfig
): Promise<NextResponse | null> {
  return authSecurityService.createRateLimitMiddleware(
    config || {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
    }
  )(request);
}

export async function withSecurityValidation(request: NextRequest): Promise<{
  valid: boolean;
  session?: any;
  response?: NextResponse;
  warnings?: string[];
}> {
  const validation = await authSecurityService.validateSession(request);

  if (!validation.valid) {
    return {
      valid: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return {
    valid: true,
    session: validation.session,
    warnings: validation.securityWarnings,
  };
}
