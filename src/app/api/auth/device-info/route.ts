import { NextRequest, NextResponse } from 'next/server';
import { authSecurityService } from '@/lib/auth-security';

export async function POST(request: NextRequest) {
  try {
    // Generate device fingerprint
    const deviceFingerprint = authSecurityService.generateDeviceFingerprint(request);

    // Get device info from headers
    const deviceInfo = {
      userAgent: request.headers.get('user-agent') || 'unknown',
      acceptLanguage: request.headers.get('accept-language') || 'unknown',
      acceptEncoding: request.headers.get('accept-encoding') || 'unknown',
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      fingerprint: deviceFingerprint,
    };

    return NextResponse.json({
      success: true,
      message: 'Device fingerprinting test endpoint',
      deviceInfo,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Device fingerprinting test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Device fingerprinting test failed',
      },
      { status: 500 }
    );
  }
}
