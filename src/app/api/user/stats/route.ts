import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// GET /api/user/stats - User dashboard stats
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user's current plan info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, createdAt: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get current month dates
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const lastMonthStart = new Date();
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    lastMonthStart.setDate(1);
    lastMonthStart.setHours(0, 0, 0, 0);

    // Get all user stats in parallel
    const [
      totalAgents,
      activeAgents,
      totalConversations,
      totalMessages,
      thisMonthMessages,
      lastMonthMessages,
      totalDocuments,
      totalApiKeys,
      recentAgents,
      recentConversations,
      lastMonthAgents,
      lastMonthConversations,
      userSubscription,
      planInfo,
    ] = await Promise.all([
      // Basic counts
      prisma.agent.count({ where: { userId } }),
      prisma.agent.count({ where: { userId, status: 'ACTIVE' } }),
      prisma.conversation.count({ where: { agent: { userId } } }),
      prisma.message.count({ where: { conversation: { agent: { userId } } } }),

      // This month messages
      prisma.message.count({
        where: {
          conversation: { agent: { userId } },
          createdAt: { gte: thisMonthStart },
        },
      }),

      // Last month messages for growth calculation
      prisma.message.count({
        where: {
          conversation: { agent: { userId } },
          createdAt: { gte: lastMonthStart, lt: thisMonthStart },
        },
      }),

      // Other counts
      prisma.document.count({ where: { userId } }),
      prisma.userApiKey.count({ where: { userId } }),

      // Recent data
      prisma.agent.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
          _count: { select: { conversations: true } },
        },
      }),

      prisma.conversation.findMany({
        where: { agent: { userId } },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          createdAt: true,
          agent: { select: { name: true } },
          _count: { select: { messages: true } },
        },
      }),

      // Growth calculation data
      prisma.agent.count({
        where: {
          userId,
          createdAt: { gte: lastMonthStart, lt: thisMonthStart },
        },
      }),

      prisma.conversation.count({
        where: {
          agent: { userId },
          createdAt: { gte: lastMonthStart, lt: thisMonthStart },
        },
      }),

      // Current subscription
      prisma.subscription.findFirst({
        where: { userId, status: 'ACTIVE' },
        include: { plan: true },
      }),

      // Plan limits from subscription plans
      prisma.subscriptionPlan.findFirst({
        where: {
          name: {
            equals:
              user.plan === 'TRIAL'
                ? 'Trial'
                : user.plan === 'BASIC'
                  ? 'Basic'
                  : user.plan === 'PRO'
                    ? 'Pro'
                    : user.plan === 'ENTERPRISE'
                      ? 'Enterprise'
                      : user.plan === 'ULTIMATE'
                        ? 'Ultimate'
                        : 'Basic',
          },
        },
      }),
    ]);

    // Calculate growth trends
    const messagesGrowth =
      lastMonthMessages === 0
        ? 100
        : ((thisMonthMessages - lastMonthMessages) / lastMonthMessages) * 100;

    const agentsGrowth =
      lastMonthAgents === 0
        ? 100
        : ((totalAgents - totalAgents + lastMonthAgents) / lastMonthAgents) * 100;

    const conversationsGrowth =
      lastMonthConversations === 0
        ? 100
        : ((totalConversations - totalConversations + lastMonthConversations) /
            lastMonthConversations) *
          100;

    // Get plan limits
    const limits = planInfo
      ? {
          agents: planInfo.maxAgents,
          conversations: planInfo.maxConversations,
          messages: planInfo.maxApiCalls, // Using API calls as message limit
        }
      : {
          agents: 1,
          conversations: 100,
          messages: 1000,
        };

    // Calculate usage percentage
    const usagePercentage =
      limits.messages === -1 ? 0 : (thisMonthMessages / limits.messages) * 100;

    // Estimate cost (simple calculation)
    const estimatedCost = planInfo ? planInfo.price : 0;

    const stats = {
      counts: {
        agents: totalAgents,
        conversations: totalConversations,
        messages: totalMessages,
        documents: totalDocuments,
        apiKeys: totalApiKeys,
        thisMonthMessages,
      },
      usage: {
        percentage: Math.min(usagePercentage, 100),
        plan: user.plan,
        limits,
        estimatedCost,
      },
      recent: {
        agents: recentAgents,
        conversations: recentConversations,
      },
      trends: {
        messagesGrowth,
        conversationsGrowth,
        agentsGrowth,
      },
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('User stats error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
