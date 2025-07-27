import { NextRequest, NextResponse } from 'next/server';
// ✅ FIXED Phase 4D True Fix - Fix getServerSession import for next-auth v4
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/plans - List all subscription plans
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasPermission(session.user.role, 'view_plans')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // Build where clause
    const where: any = {};
    if (!includeInactive) {
      where.isActive = true;
    }

    const plans = await prisma.subscriptionPlan.findMany({
      where,
      orderBy: [{ isPopular: 'desc' }, { sortOrder: 'asc' }, { price: 'asc' }],
    });

    // Get subscription stats for each plan
    const plansWithStats = await Promise.all(
      plans.map(async plan => {
        const [activeSubscriptions, totalRevenue] = await Promise.all([
          prisma.subscription.count({
            where: {
              planId: plan.id,
              status: 'ACTIVE',
            },
          }),
          prisma.subscription.aggregate({
            where: {
              planId: plan.id,
              paymentStatus: 'COMPLETED',
            },
            _sum: {
              amount: true,
            },
          }),
        ]);

        return {
          ...plan,
          stats: {
            activeSubscriptions,
            totalRevenue: totalRevenue._sum.amount || 0,
          },
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: plansWithStats,
    });
  } catch (error) {
    console.error('Plans fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/plans - Create new subscription plan
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasPermission(session.user.role, 'create_plans')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      price,
      currency = 'USD',
      interval = 'month',
      maxAgents,
      maxConversations,
      maxStorage,
      maxApiCalls,
      enableGoogleIntegration = false,
      enableHandoverSystem = false,
      enableAnalytics = false,
      enableCustomBranding = false,
      enablePrioritySupport = false,
      isActive = true,
      isPopular = false,
      sortOrder = 0,
    } = body;

    // Validate required fields
    if (
      !name ||
      typeof price !== 'number' ||
      !maxAgents ||
      !maxConversations ||
      !maxStorage ||
      !maxApiCalls
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    // Check if plan name already exists
    const existingPlan = await prisma.subscriptionPlan.findUnique({
      where: { name },
    });

    if (existingPlan) {
      return NextResponse.json(
        {
          success: false,
          error: 'Plan name already exists',
        },
        { status: 400 }
      );
    }

    // Create plan
    const plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        description,
        price: parseFloat(price.toString()),
        currency,
        interval,
        maxAgents: parseInt(maxAgents.toString()),
        maxConversations: parseInt(maxConversations.toString()),
        maxStorage: parseInt(maxStorage.toString()),
        maxApiCalls: parseInt(maxApiCalls.toString()),
        enableGoogleIntegration,
        enableHandoverSystem,
        enableAnalytics,
        enableCustomBranding,
        enablePrioritySupport,
        isActive,
        isPopular,
        sortOrder: parseInt(sortOrder.toString()),
      },
    });

    return NextResponse.json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error('Plan creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/plans - Bulk update plans order
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasPermission(session.user.role, 'edit_plans')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { plans } = body;

    if (!Array.isArray(plans)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid plans data',
        },
        { status: 400 }
      );
    }

    // Update each plan's sort order
    await Promise.all(
      plans.map((plan: any) =>
        prisma.subscriptionPlan.update({
          where: { id: plan.id },
          data: { sortOrder: plan.sortOrder },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: 'Plans order updated successfully',
    });
  } catch (error) {
    console.error('Plans bulk update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
