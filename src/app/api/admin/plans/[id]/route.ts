import { NextRequest, NextResponse } from 'next/server';
// ✅ FIXED Phase 4D True Fix - Fix getServerSession import for next-auth v4
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/plans/[id] - Get plan details
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasPermission(session.user.role, 'manage_plans')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            subscriptions: true,
          },
        },
        subscriptions: {
          where: {
            status: 'ACTIVE',
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!plan) {
      return NextResponse.json(
        {
          success: false,
          error: 'Plan not found',
        },
        { status: 404 }
      );
    }

    // Calculate plan statistics
    const stats = await prisma.subscription.aggregate({
      where: {
        planId: id,
        paymentStatus: 'COMPLETED',
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    const monthlyRevenue = await prisma.subscription.aggregate({
      where: {
        planId: id,
        paymentStatus: 'COMPLETED',
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: {
        amount: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...plan,
        stats: {
          totalSubscriptions: stats._count.id,
          totalRevenue: stats._sum.amount || 0,
          monthlyRevenue: monthlyRevenue._sum.amount || 0,
          activeSubscriptions: plan._count.subscriptions,
        },
      },
    });
  } catch (error) {
    console.error('Plan detail error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/plans/[id] - Update plan
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasPermission(session.user.role, 'manage_plans')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const {
      name,
      description,
      price,
      currency,
      interval,
      maxAgents,
      maxConversations,
      maxStorage,
      maxApiCalls,
      enableGoogleIntegration,
      enableHandoverSystem,
      enableAnalytics,
      enableCustomBranding,
      enablePrioritySupport,
      isActive,
      isPopular,
      sortOrder,
    } = body;

    // Check if plan exists
    const existingPlan = await prisma.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!existingPlan) {
      return NextResponse.json(
        {
          success: false,
          error: 'Plan not found',
        },
        { status: 404 }
      );
    }

    // Check if name already exists (excluding current plan)
    if (name && name !== existingPlan.name) {
      const duplicatePlan = await prisma.subscriptionPlan.findUnique({
        where: { name },
      });

      if (duplicatePlan) {
        return NextResponse.json(
          {
            success: false,
            error: 'Plan name already exists',
          },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (currency) updateData.currency = currency;
    if (interval) updateData.interval = interval;
    if (maxAgents !== undefined) updateData.maxAgents = parseInt(maxAgents);
    if (maxConversations !== undefined) updateData.maxConversations = parseInt(maxConversations);
    if (maxStorage !== undefined) updateData.maxStorage = parseInt(maxStorage);
    if (maxApiCalls !== undefined) updateData.maxApiCalls = parseInt(maxApiCalls);
    if (enableGoogleIntegration !== undefined)
      updateData.enableGoogleIntegration = enableGoogleIntegration;
    if (enableHandoverSystem !== undefined) updateData.enableHandoverSystem = enableHandoverSystem;
    if (enableAnalytics !== undefined) updateData.enableAnalytics = enableAnalytics;
    if (enableCustomBranding !== undefined) updateData.enableCustomBranding = enableCustomBranding;
    if (enablePrioritySupport !== undefined)
      updateData.enablePrioritySupport = enablePrioritySupport;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isPopular !== undefined) updateData.isPopular = isPopular;
    if (sortOrder !== undefined) updateData.sortOrder = parseInt(sortOrder);

    // Update plan
    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error('Plan update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/plans/[id] - Delete plan
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasPermission(session.user.role, 'manage_plans')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    // Check if plan exists
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    });

    if (!plan) {
      return NextResponse.json(
        {
          success: false,
          error: 'Plan not found',
        },
        { status: 404 }
      );
    }

    // Check if plan has active subscriptions
    const activeSubscriptions = await prisma.subscription.count({
      where: {
        planId: id,
        status: {
          in: ['ACTIVE', 'PENDING'],
        },
      },
    });

    if (activeSubscriptions > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete plan with ${activeSubscriptions} active subscription(s)`,
        },
        { status: 400 }
      );
    }

    // Delete plan
    await prisma.subscriptionPlan.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Plan deleted successfully',
    });
  } catch (error) {
    console.error('Plan deletion error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
