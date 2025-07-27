import { NextRequest, NextResponse } from 'next/server';
// ✅ FIXED Phase 4D True Fix - Fix getServerSession import for next-auth v4
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission, type UserRole } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role as UserRole, 'view_announcements')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Filters
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (status) {
      const now = new Date();
      switch (status) {
        case 'active':
          where.isActive = true;
          where.OR = [{ startDate: null }, { startDate: { lte: now } }];
          where.AND = [
            {
              OR: [{ endDate: null }, { endDate: { gte: now } }],
            },
          ];
          break;
        case 'inactive':
          where.isActive = false;
          break;
        case 'scheduled':
          where.isActive = true;
          where.startDate = { gt: now };
          break;
        case 'expired':
          where.endDate = { lt: now };
          break;
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get announcements with pagination
    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
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
        skip,
        take: limit,
      }),
      prisma.announcement.count({ where }),
    ]);

    // Get statistics
    const now = new Date();
    const [totalCount, activeCount, scheduledCount, highPriorityCount] = await Promise.all([
      prisma.announcement.count(),
      prisma.announcement.count({
        where: {
          isActive: true,
          OR: [{ startDate: null }, { startDate: { lte: now } }],
          AND: [
            {
              OR: [{ endDate: null }, { endDate: { gte: now } }],
            },
          ],
        },
      }),
      prisma.announcement.count({
        where: {
          isActive: true,
          startDate: { gt: now },
        },
      }),
      prisma.announcement.count({
        where: {
          priority: { gte: 3 },
        },
      }),
    ]);

    const stats = {
      total: totalCount,
      active: activeCount,
      scheduled: scheduledCount,
      highPriority: highPriorityCount,
    };

    return NextResponse.json({
      announcements,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats,
    });
  } catch (error) {
    console.error('Announcements fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role as UserRole, 'create_announcements')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      content,
      type = 'INFO',
      isActive = true,
      isGlobal = true,
      targetUsers,
      startDate,
      endDate,
      priority = 1,
    } = body;

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    // Create announcement
    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        type,
        isActive,
        isGlobal,
        targetUsers: isGlobal ? 'all' : targetUsers,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        priority,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    console.error('Announcement creation error:', error);
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
  }
}
