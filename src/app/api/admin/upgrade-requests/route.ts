import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission, type UserRole } from '@/lib/permissions';

// GET - Fetch all upgrade requests for admin
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    const currentUserRole = session.user.role as UserRole;
    if (!hasPermission(currentUserRole, 'view_subscriptions')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient permissions',
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    // Build where clause
    const where: any = {};
    if (status !== 'all') {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { targetPlan: { contains: search, mode: 'insensitive' } },
        { currentPlan: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get upgrade requests with pagination
    const [upgradeRequests, total] = await Promise.all([
      prisma.planUpgradeRequest.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              plan: true,
              isActive: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.planUpgradeRequest.count({ where }),
    ]);

    // Get stats
    const stats = await prisma.planUpgradeRequest.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const statsFormatted = {
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      CANCELLED: 0,
    };

    stats.forEach(stat => {
      statsFormatted[stat.status as keyof typeof statsFormatted] = stat._count.status;
    });

    return NextResponse.json({
      success: true,
      data: {
        upgradeRequests,
        stats: statsFormatted,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching upgrade requests:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
