import { NextRequest, NextResponse } from 'next/server';
// ✅ FIXED Phase 4D True Fix - Fix getServerSession import for next-auth v4
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import {
  successResponse,
  errorResponse,
  commonErrors,
  createPerformanceResponse,
} from '@/lib/api-response-standard';

// GET /api/admin/metrics - Get comprehensive admin dashboard metrics
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !hasPermission(session.user.role, 'view_metrics')) {
      return commonErrors.unauthorized();
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Basic counts
    const [
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      totalAgents,
      activeAgents,
      totalConversations,
      totalSubscriptions,
      activeSubscriptions,
      totalBlogs,
      publishedBlogs,
      totalContacts,
      pendingContacts,
      totalNewsletters,
      activeNewsletters,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Users created in last 30 days as "active"
          },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: startOfMonth },
        },
      }),
      prisma.agent.count(),
      prisma.agent.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.conversation.count(),
      prisma.subscription.count(),
      prisma.subscription.count({
        where: { status: 'active' },
      }),
      prisma.blog.count(),
      prisma.blog.count({
        where: { status: 'published' },
      }),
      prisma.contactSubmission.count(),
      prisma.contactSubmission.count({
        where: { status: 'pending' },
      }),
      // Note: Newsletter count will be 0 until Newsletter model is implemented
      Promise.resolve(0), // totalNewsletters placeholder
      Promise.resolve(0), // activeNewsletters placeholder
    ]);

    // User growth calculation
    const usersLastMonth = await prisma.user.count({
      where: {
        createdAt: {
          gte: startOfLastMonth,
          lt: startOfMonth,
        },
      },
    });

    const userGrowthRate =
      usersLastMonth > 0
        ? ((newUsersThisMonth - usersLastMonth) / usersLastMonth) * 100
        : newUsersThisMonth > 0
          ? 100
          : 0;

    // Revenue calculation
    const monthlyRevenue = await prisma.bankTransfer.aggregate({
      where: {
        status: 'verified',
        createdAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    });

    // User plan distribution
    const planDistribution = await prisma.user.groupBy({
      by: ['plan'],
      _count: { plan: true },
    });

    const planDistributionMap = planDistribution.reduce((acc: any, item) => {
      acc[item.plan] = item._count.plan;
      return acc;
    }, {});

    // Content metrics
    const contentMetrics = {
      blogs: {
        total: totalBlogs,
        published: publishedBlogs,
        draft: totalBlogs - publishedBlogs,
      },
      contacts: {
        total: totalContacts,
        pending: pendingContacts,
        resolved: totalContacts - pendingContacts,
      },
      newsletters: {
        total: totalNewsletters,
        active: activeNewsletters,
        unsubscribed: totalNewsletters - activeNewsletters,
      },
    };

    // System metrics
    const systemMetrics = {
      totalKnowledge: await prisma.knowledge.count(),
      totalConversations,
      avgConversationsPerAgent:
        totalAgents > 0 ? Math.round((totalConversations / totalAgents) * 10) / 10 : 0,
      systemHealth: 'operational', // Could be dynamic based on health checks
    };

    // Agent usage stats
    const agentUsageStats = await prisma.agent.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            conversations: true,
          },
        },
      },
      orderBy: {
        conversations: {
          _count: 'desc',
        },
      },
      take: 10,
    });

    // Daily user growth (last 7 days)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await prisma.user.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      last7Days.push({
        date: date.toISOString().split('T')[0],
        users: count,
      });
    }

    // Daily user stats
    const dailyUsers = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      select: {
        createdAt: true,
      },
    });

    const trends = {
      daily: dailyUsers,
      last7Days,
    };

    const metricsData = {
      overview: {
        totalUsers,
        activeUsers,
        newUsersThisMonth,
        userGrowthRate: Math.round(userGrowthRate * 10) / 10,
        totalAgents,
        activeAgents,
        totalSubscriptions,
        activeSubscriptions,
        monthlyRevenue: monthlyRevenue._sum.amount || 0,
      },
      userMetrics: {
        total: totalUsers,
        active: activeUsers,
        newThisMonth: newUsersThisMonth,
        growthRate: Math.round(userGrowthRate * 10) / 10,
        planDistribution: planDistributionMap,
      },
      contentMetrics,
      agentMetrics: {
        total: totalAgents,
        active: activeAgents,
        usage: agentUsageStats.slice(0, 5).map(stat => ({
          agentId: stat.id,
          agentName: stat.name,
          conversations: stat._count.conversations,
        })),
      },
      systemMetrics,
      trends,
    };

    // Use performance response helper with standardized format
    return NextResponse.json(
      createPerformanceResponse(metricsData, { startTime }, 'Admin metrics retrieved successfully'),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching admin metrics:', error);
    return errorResponse('Internal server error while fetching metrics', 500, {
      performance: {
        responseTime: Date.now() - startTime,
        cached: false,
      },
    });
  }
}
