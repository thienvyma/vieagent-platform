import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Google auth config endpoint
    return NextResponse.json({
      success: true,
      message: 'Google OAuth configuration endpoint',
      google: {
        status: 'configured',
        services: ['calendar', 'gmail', 'sheets', 'drive', 'docs', 'forms'],
        scopes: [
          'userinfo.profile',
          'userinfo.email',
          'calendar',
          'gmail.readonly',
          'gmail.send',
          'spreadsheets',
        ],
        config: {
          clientConfigured: !!process.env.GOOGLE_CLIENT_ID,
          redirectUri:
            process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`,
          environment: process.env.NODE_ENV || 'development',
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Google auth config error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Google auth config check failed',
      },
      { status: 500 }
    );
  }
}
