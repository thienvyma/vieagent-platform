import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// GET /api/user/settings - Lấy user settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const settings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    // Return default settings if none exist
    if (!settings) {
      return NextResponse.json({
        success: true,
        data: {
          theme: 'dark',
          language: 'vi',
          timezone: 'Asia/Ho_Chi_Minh',
          emailNotifications: true,
          browserNotifications: false,
          weeklyReport: true,
          defaultModel: 'gpt-3.5-turbo',
          defaultTemperature: 0.7,
          defaultMaxTokens: 1000,
          profileVisible: false,
          dataSharing: false,
          analyticsOptIn: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT /api/user/settings - Cập nhật user settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();

    const {
      theme,
      language,
      timezone,
      emailNotifications,
      browserNotifications,
      weeklyReport,
      defaultModel,
      defaultTemperature,
      defaultMaxTokens,
      profileVisible,
      dataSharing,
      analyticsOptIn,
    } = body;

    const settings = await prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        theme,
        language,
        timezone,
        emailNotifications,
        browserNotifications,
        weeklyReport,
        defaultModel,
        defaultTemperature,
        defaultMaxTokens,
        profileVisible,
        dataSharing,
        analyticsOptIn,
      },
      update: {
        theme,
        language,
        timezone,
        emailNotifications,
        browserNotifications,
        weeklyReport,
        defaultModel,
        defaultTemperature,
        defaultMaxTokens,
        profileVisible,
        dataSharing,
        analyticsOptIn,
      },
    });

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
