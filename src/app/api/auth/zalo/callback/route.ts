import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/auth/zalo/callback
 * Handle Zalo OAuth callback for OA access
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
      console.error('Zalo OAuth error:', error);
      return NextResponse.redirect(
        new URL('/dashboard/deployment?error=zalo_auth_failed', request.url)
      );
    }

    if (!code) {
      return NextResponse.json({ error: 'Authorization code missing' }, { status: 400 });
    }

    // Exchange code for access token
    const tokenUrl = 'https://oauth.zaloapp.com/v4/access_token';
    const tokenParams = new URLSearchParams({
      app_id: process.env.NEXT_PUBLIC_ZALO_APP_ID!,
      app_secret: process.env.ZALO_APP_SECRET!,
      code: code,
    });

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams.toString(),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error('Failed to get Zalo access token:', tokenData);
      return NextResponse.redirect(
        new URL('/dashboard/deployment?error=zalo_token_failed', request.url)
      );
    }

    // Get OA info
    const oaInfoResponse = await fetch(
      `https://openapi.zalo.me/v2.0/oa/getoa?access_token=${tokenData.access_token}`
    );
    const oaInfoData = await oaInfoResponse.json();

    if (oaInfoData.error !== 0) {
      console.error('Failed to get Zalo OA info:', oaInfoData);
      return NextResponse.redirect(
        new URL('/dashboard/deployment?error=zalo_oa_failed', request.url)
      );
    }

    // Save Zalo connection to database
    const zaloConnection = await prisma.platformConnection.upsert({
      where: {
        userId_platform_agentId: {
          userId: session.user.id,
          platform: 'ZALO',
          agentId: state || 'default',
        },
      },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || null,
        tokenExpiry: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000)
          : null,
        platformData: JSON.stringify(oaInfoData.data),
        metadata: JSON.stringify({
          connectedAt: new Date().toISOString(),
          oaId: oaInfoData.data?.oa_id,
          oaName: oaInfoData.data?.name,
          verified: oaInfoData.data?.is_verified,
          category: oaInfoData.data?.cate_name,
        }),
        scopes: JSON.stringify(['oa_message', 'oa_info']),
        isActive: true,
        lastSync: new Date(),
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        platform: 'ZALO',
        agentId: state || 'default',
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || null,
        tokenExpiry: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000)
          : null,
        platformData: JSON.stringify(oaInfoData.data),
        metadata: JSON.stringify({
          connectedAt: new Date().toISOString(),
          oaId: oaInfoData.data?.oa_id,
          oaName: oaInfoData.data?.name,
          verified: oaInfoData.data?.is_verified,
          category: oaInfoData.data?.cate_name,
        }),
        scopes: JSON.stringify(['oa_message', 'oa_info']),
        isActive: true,
        lastSync: new Date(),
      },
    });

    console.log('✅ Zalo connection saved:', zaloConnection.id);

    // Redirect back to deployment page with success
    return NextResponse.redirect(
      new URL(
        `/dashboard/deployment?connected=zalo&oa=${oaInfoData.data?.name}`,
        request.url
      )
    );
  } catch (error) {
    console.error('Zalo OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/dashboard/deployment?error=zalo_callback_failed', request.url)
    );
  }
} 