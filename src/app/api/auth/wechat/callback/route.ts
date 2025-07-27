import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/auth/wechat/callback
 * Handle WeChat OAuth callback for Official Account access
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
      console.error('WeChat OAuth error:', error);
      return NextResponse.redirect(
        new URL('/dashboard/deployment?error=wechat_auth_failed', request.url)
      );
    }

    if (!code) {
      return NextResponse.json({ error: 'Authorization code missing' }, { status: 400 });
    }

    // Exchange code for access token
    const tokenUrl = 'https://api.weixin.qq.com/sns/oauth2/access_token';
    const tokenParams = new URLSearchParams({
      appid: process.env.NEXT_PUBLIC_WECHAT_APP_ID!,
      secret: process.env.WECHAT_APP_SECRET!,
      code: code,
      grant_type: 'authorization_code',
    });

    const tokenResponse = await fetch(`${tokenUrl}?${tokenParams}`, {
      method: 'GET',
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error('Failed to get WeChat access token:', tokenData);
      return NextResponse.redirect(
        new URL('/dashboard/deployment?error=wechat_token_failed', request.url)
      );
    }

    // Get user info
    const userInfoResponse = await fetch(
      `https://api.weixin.qq.com/sns/userinfo?access_token=${tokenData.access_token}&openid=${tokenData.openid}&lang=zh_CN`
    );
    const userInfo = await userInfoResponse.json();

    if (userInfo.errcode) {
      console.error('Failed to get WeChat user info:', userInfo);
      return NextResponse.redirect(
        new URL('/dashboard/deployment?error=wechat_user_failed', request.url)
      );
    }

    // Save WeChat connection to database
    const wechatConnection = await prisma.platformConnection.upsert({
      where: {
        userId_platform_agentId: {
          userId: session.user.id,
          platform: 'WECHAT',
          agentId: state || 'default',
        },
      },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || null,
        tokenExpiry: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000)
          : null,
        platformData: JSON.stringify(userInfo),
        metadata: JSON.stringify({
          connectedAt: new Date().toISOString(),
          openid: tokenData.openid,
          unionid: userInfo.unionid,
          nickname: userInfo.nickname,
          country: userInfo.country,
          province: userInfo.province,
          city: userInfo.city,
        }),
        scopes: JSON.stringify(['snsapi_userinfo']),
        isActive: true,
        lastSync: new Date(),
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        platform: 'WECHAT',
        agentId: state || 'default',
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || null,
        tokenExpiry: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000)
          : null,
        platformData: JSON.stringify(userInfo),
        metadata: JSON.stringify({
          connectedAt: new Date().toISOString(),
          openid: tokenData.openid,
          unionid: userInfo.unionid,
          nickname: userInfo.nickname,
          country: userInfo.country,
          province: userInfo.province,
          city: userInfo.city,
        }),
        scopes: JSON.stringify(['snsapi_userinfo']),
        isActive: true,
        lastSync: new Date(),
      },
    });

    console.log('✅ WeChat connection saved:', wechatConnection.id);

    // Redirect back to deployment page with success
    return NextResponse.redirect(
      new URL(
        `/dashboard/deployment?connected=wechat&user=${userInfo.nickname}`,
        request.url
      )
    );
  } catch (error) {
    console.error('WeChat OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/dashboard/deployment?error=wechat_callback_failed', request.url)
    );
  }
} 