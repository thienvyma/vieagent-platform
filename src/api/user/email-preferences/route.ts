import { NextRequest, NextResponse } from 'next/server';
// ✅ FIXED Phase 4D True Fix - Fix getServerSession import for next-auth v4
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's email preferences
    const preferences = await prisma.emailPreferences.findUnique({
      where: { userId: session.user.id },
    });

    // Return default preferences if not found
    if (!preferences) {
      return NextResponse.json({
        marketing: true,
        notifications: true,
        security: true,
        updates: true,
      });
    }

    return NextResponse.json({
      marketing: preferences.marketing,
      notifications: preferences.notifications,
      security: preferences.security,
      updates: preferences.updates,
    });
  } catch (error) {
    console.error('Get email preferences error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { marketing, notifications, security, updates } = await request.json();

    // Validate input
    if (
      typeof marketing !== 'boolean' ||
      typeof notifications !== 'boolean' ||
      typeof security !== 'boolean' ||
      typeof updates !== 'boolean'
    ) {
      return NextResponse.json({ error: 'Invalid preferences format' }, { status: 400 });
    }

    // Upsert email preferences
    const preferences = await prisma.emailPreferences.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        marketing,
        notifications,
        security,
        updates,
      },
      update: {
        marketing,
        notifications,
        security,
        updates,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Email preferences updated successfully',
      preferences: {
        marketing: preferences.marketing,
        notifications: preferences.notifications,
        security: preferences.security,
        updates: preferences.updates,
      },
    });
  } catch (error) {
    console.error('Update email preferences error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
