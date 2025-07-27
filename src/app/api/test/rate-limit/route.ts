import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/auth-security';

export async function GET(request: NextRequest) {
  // Apply rate limiting (5 requests per minute for testing)
  const rateLimitResponse = await withRateLimit(request, {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // If rate limit passes, return success
  return NextResponse.json({
    success: true,
    message: 'Rate limit test endpoint',
    timestamp: new Date().toISOString(),
    ip: request.headers.get('x-forwarded-for') || 'unknown',
  });
}
