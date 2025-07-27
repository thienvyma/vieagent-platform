import { NextRequest, NextResponse } from 'next/server';
// ✅ FIXED Phase 4D True Fix - Fix getServerSession import for next-auth v4
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const onlyUnread = searchParams.get('unread') === 'true';

    // Get active announcements for this user
    const now = new Date();
    const whereClause: any = {
      isActive: true,
      OR: [{ startDate: null }, { startDate: { lte: now } }],
      AND: [
        {
          OR: [{ endDate: null }, { endDate: { gte: now } }],
        },
      ],
    };

    // Add global or targeted filter
    whereClause.OR = [
      { isGlobal: true },
      { targetUsers: { contains: session.user.id } },
      { targetUsers: 'all' },
    ];

    const announcements = await prisma.announcement.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });

    // Get user's notification read status (you might want to create a separate table for this)
    const unreadCount = announcements.length; // Simplified - you can implement read tracking

    return NextResponse.json({
      success: true,
      data: {
        notifications: announcements,
        unreadCount,
        totalCount: announcements.length,
      },
    });
  } catch (error) {
    console.error('Notifications fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { announcementId, action } = body;

    if (action === 'mark_read') {
      // Here you would implement marking notification as read
      // For now, we'll just acknowledge the action

      // Increment view count
      await prisma.announcement.update({
        where: { id: announcementId },
        data: {
          viewCount: {
            increment: 1,
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Notification marked as read',
      });
    }

    if (action === 'dismiss') {
      // Increment dismiss count
      await prisma.announcement.update({
        where: { id: announcementId },
        data: {
          dismissCount: {
            increment: 1,
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Notification dismissed',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Notification action error:', error);
    return NextResponse.json({ error: 'Failed to process notification action' }, { status: 500 });
  }
}
