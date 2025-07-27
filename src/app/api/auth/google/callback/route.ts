import { NextRequest, NextResponse } from 'next/server';
// ✅ FIXED Phase 4D True Fix - Fix getServerSession import for next-auth v4
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/auth/google/callback
 * Handle Google OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      return NextResponse.json({ error: 'Authorization code missing' }, { status: 400 });
    }

    // Exchange code for tokens
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/auth/google/callback`
    );

    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.json({ error: 'Failed to get tokens' }, { status: 400 });
    }

    // Get user info from Google
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    // Prepare scopes for database storage
    const scopesArray = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/documents',
      'https://www.googleapis.com/auth/forms',
    ];
    const scopesJson = JSON.stringify(scopesArray);

    console.log('💾 Saving Google account for user:', session.user.id);
    console.log('💾 Google ID:', userInfo.data.id);
    console.log('💾 Email:', userInfo.data.email);
    console.log('💾 Scopes:', scopesJson);

    // Save tokens to database
    const savedAccount = await prisma.googleAccount.upsert({
      where: { googleId: userInfo.data.id || '' },
      update: {
        userId: session.user.id,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        scopes: scopesJson,
        email: userInfo.data.email || '',
        name: userInfo.data.name || '',
        picture: userInfo.data.picture || '',
        isActive: true,
        lastSync: new Date(),
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        googleId: userInfo.data.id || '',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        scopes: scopesJson,
        email: userInfo.data.email || '',
        name: userInfo.data.name || '',
        picture: userInfo.data.picture || '',
        isActive: true,
        lastSync: new Date(),
      },
    });

    console.log('✅ Google account saved successfully:', savedAccount.id);

    // Redirect to success page
    return NextResponse.redirect(new URL('/dashboard/google?connected=true', request.url));
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(new URL('/dashboard/google?error=auth_failed', request.url));
  }
}
