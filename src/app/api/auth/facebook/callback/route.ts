import { NextRequest, NextResponse } from 'next/server';
// ✅ FIXED Phase 4D True Fix - Fix getServerSession import for next-auth v4
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/auth/facebook/callback
 * Handle Facebook OAuth callback for Page access
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // This is the agentId
    const error = searchParams.get('error');

    if (error) {
      console.error('Facebook OAuth error:', error);
      return NextResponse.redirect(
        new URL('/dashboard/deployment?error=facebook_auth_failed', request.url)
      );
    }

    if (!code) {
      return NextResponse.json({ error: 'Authorization code missing' }, { status: 400 });
    }

    // Exchange code for access token
    const tokenUrl = 'https://graph.facebook.com/v18.0/oauth/access_token';
    const tokenParams = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID!,
      client_secret: process.env.FACEBOOK_APP_SECRET!,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/facebook/callback`,
      code: code,
    });

    const tokenResponse = await fetch(`${tokenUrl}?${tokenParams}`, {
      method: 'GET',
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error('Failed to get Facebook access token:', tokenData);
      return NextResponse.redirect(
        new URL('/dashboard/deployment?error=facebook_token_failed', request.url)
      );
    }

    // Get user's Facebook pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${tokenData.access_token}`
    );
    const pagesData = await pagesResponse.json();

    if (!pagesData.data || pagesData.data.length === 0) {
      return NextResponse.redirect(
        new URL('/dashboard/deployment?error=no_facebook_pages', request.url)
      );
    }

    // Save Facebook connection to database
    const facebookConnection = await prisma.platformConnection.upsert({
      where: {
        userId_platform_agentId: {
          userId: session.user.id,
          platform: 'FACEBOOK',
          agentId: state || 'default',
        },
      },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || null,
        tokenExpiry: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000)
          : null,
        platformData: JSON.stringify(pagesData.data),
        metadata: JSON.stringify({
          connectedAt: new Date().toISOString(),
          totalPages: pagesData.data.length,
        }),
        scopes: JSON.stringify(['pages_manage_metadata', 'pages_messaging']),
        isActive: true,
        lastSync: new Date(),
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        platform: 'FACEBOOK',
        agentId: state || 'default',
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || null,
        tokenExpiry: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000)
          : null,
        platformData: JSON.stringify(pagesData.data),
        metadata: JSON.stringify({
          connectedAt: new Date().toISOString(),
          totalPages: pagesData.data.length,
        }),
        scopes: JSON.stringify(['pages_manage_metadata', 'pages_messaging']),
        isActive: true,
        lastSync: new Date(),
      },
    });

    console.log('✅ Facebook connection saved:', facebookConnection.id);

    // Redirect back to deployment page with success
    return NextResponse.redirect(
      new URL(
        '/dashboard/deployment?connected=facebook&pages=' + pagesData.data.length,
        request.url
      )
    );
  } catch (error) {
    console.error('Facebook OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/dashboard/deployment?error=facebook_callback_failed', request.url)
    );
  }
}
