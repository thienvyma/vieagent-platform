import { NextRequest, NextResponse } from 'next/server';
// ✅ FIXED Phase 4D True Fix - Fix getServerSession import for next-auth v4
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

// GET /api/admin/newsletter/stats - Get newsletter statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !hasPermission(session.user.role, 'view_newsletter')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      total,
      active,
      unsubscribed,
      thisMonth,
      totalOpens,
      totalClicks,
      totalActiveSubscribers,
    ] = await Promise.all([
      // Total subscribers
      prisma.newsletter.count(),

      // Active subscribers
      prisma.newsletter.count({
        where: { isActive: true },
      }),

      // Unsubscribed
      prisma.newsletter.count({
        where: { isActive: false },
      }),

      // This month's new subscribers
      prisma.newsletter.count({
        where: {
          createdAt: {
            gte: startOfMonth,
          },
        },
      }),

      // Total opens
      prisma.newsletter.aggregate({
        _sum: { openCount: true },
      }),

      // Total clicks
      prisma.newsletter.aggregate({
        _sum: { clickCount: true },
      }),

      // Active subscribers for rates calculation
      prisma.newsletter.count({
        where: {
          isActive: true,
          openCount: { gt: 0 },
        },
      }),
    ]);

    // Calculate rates
    const openRate =
      totalActiveSubscribers > 0
        ? ((totalOpens._sum.openCount || 0) / totalActiveSubscribers) * 100
        : 0;

    const clickRate =
      (totalOpens._sum.openCount || 0) > 0
        ? ((totalClicks._sum.clickCount || 0) / (totalOpens._sum.openCount || 1)) * 100
        : 0;

    return NextResponse.json({
      total,
      active,
      unsubscribed,
      thisMonth,
      openRate: Math.round(openRate * 10) / 10,
      clickRate: Math.round(clickRate * 10) / 10,
    });
  } catch (error) {
    console.error('Error fetching newsletter stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
