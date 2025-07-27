import { NextRequest, NextResponse } from 'next/server';
// ✅ FIXED Phase 4D True Fix - Fix getServerSession import for next-auth v4
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/subscriptions - List subscriptions with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasPermission(session.user.role, 'manage_subscriptions')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const planId = searchParams.get('planId');
    const planFilter = searchParams.get('planFilter'); // Support both planId and planFilter
    const userId = searchParams.get('userId');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (status) where.status = status;
    if (planId) where.planId = planId;
    if (planFilter && planFilter !== 'all') {
      // Filter by plan name instead of planId
      where.plan = { name: planFilter };
    }
    if (userId) where.userId = userId;
    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { plan: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              isActive: true,
            },
          },
          plan: {
            select: {
              id: true,
              name: true,
              price: true,
              currency: true,
              interval: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.subscription.count({ where }),
    ]);

    // Calculate usage statistics
    const stats = await prisma.subscription.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        subscriptions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        stats: stats.reduce(
          (acc, stat) => {
            acc[stat.status] = stat._count.status;
            return acc;
          },
          {} as Record<string, number>
        ),
      },
    });
  } catch (error) {
    console.error('Subscriptions fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/subscriptions - Create new subscription
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasPermission(session.user.role, 'manage_subscriptions')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, planId, startDate, endDate, autoRenew, paymentMethod, transactionId } = body;

    // Validate required fields
    if (!userId || !planId) {
      return NextResponse.json(
        {
          success: false,
          error: 'User ID and Plan ID are required',
        },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    // Check if plan exists
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });
    if (!plan) {
      return NextResponse.json(
        {
          success: false,
          error: 'Subscription plan not found',
        },
        { status: 404 }
      );
    }

    // Check for existing active subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
    });

    if (existingSubscription) {
      return NextResponse.json(
        {
          success: false,
          error: 'User already has an active subscription',
        },
        { status: 400 }
      );
    }

    // Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planId,
        amount: plan.price,
        currency: plan.currency,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : undefined,
        autoRenew: autoRenew ?? true,
        paymentMethod,
        transactionId,
        status: 'ACTIVE',
        paymentStatus: 'COMPLETED',
        limits: {
          maxAgents: plan.maxAgents,
          maxConversations: plan.maxConversations,
          maxStorage: plan.maxStorage,
          maxApiCalls: plan.maxApiCalls,
        },
        currentUsage: {
          agents: 0,
          conversations: 0,
          storage: 0,
          apiCalls: 0,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            price: true,
            currency: true,
            interval: true,
          },
        },
      },
    });

    // Update user plan
    await prisma.user.update({
      where: { id: userId },
      data: {
        plan:
          plan.name === 'Trial'
            ? 'TRIAL'
            : plan.name === 'Basic'
              ? 'BASIC'
              : plan.name === 'Pro'
                ? 'PRO'
                : plan.name === 'Enterprise'
                  ? 'ENTERPRISE'
                  : 'ULTIMATE',
      },
    });

    return NextResponse.json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    console.error('Subscription creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
