import { NextRequest, NextResponse } from 'next/server';
// ✅ FIXED Phase 4D True Fix - Fix getServerSession import for next-auth v4
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/subscriptions/[id] - Get subscription details
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasPermission(session.user.role, 'manage_subscriptions')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            currency: true,
            interval: true,
            maxAgents: true,
            maxConversations: true,
            maxStorage: true,
            maxApiCalls: true,
            enableGoogleIntegration: true,
            enableHandoverSystem: true,
            enableAnalytics: true,
            enableCustomBranding: true,
            enablePrioritySupport: true,
          },
        },
      },
    });

    if (!subscription) {
      return NextResponse.json(
        {
          success: false,
          error: 'Subscription not found',
        },
        { status: 404 }
      );
    }

    // Get usage statistics for this subscription
    const user = subscription.user;
    const [agentCount, conversationCount] = await Promise.all([
      prisma.agent.count({ where: { userId: user.id } }),
      prisma.conversation.count({ where: { userId: user.id } }),
    ]);

    const usageStats = {
      agents: {
        current: agentCount,
        limit: subscription.plan.maxAgents,
        percentage: (agentCount / subscription.plan.maxAgents) * 100,
      },
      conversations: {
        current: conversationCount,
        limit: subscription.plan.maxConversations,
        percentage: (conversationCount / subscription.plan.maxConversations) * 100,
      },
      storage: {
        current: 0, // TODO: Calculate actual storage usage
        limit: subscription.plan.maxStorage,
        percentage: 0,
      },
      apiCalls: {
        current: 0, // TODO: Calculate API calls this month
        limit: subscription.plan.maxApiCalls,
        percentage: 0,
      },
    };

    return NextResponse.json({
      success: true,
      subscription: {
        ...subscription,
        usageStats,
      },
    });
  } catch (error) {
    console.error('Subscription detail error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/subscriptions/[id] - Handle subscription actions (manual_verify, cancel, renew)
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { action, withRefund, verificationNote } = body;

    // Check if subscription exists
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: { user: true, plan: true },
    });

    if (!subscription) {
      return NextResponse.json(
        {
          success: false,
          error: 'Subscription not found',
        },
        { status: 404 }
      );
    }

    switch (action) {
      case 'manual_verify':
        // Check permission for manual verification
        if (!hasPermission(session.user.role, 'verify_payments')) {
          return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        // Only allow verification of PENDING payments
        if (subscription.paymentStatus !== 'PENDING') {
          return NextResponse.json(
            {
              success: false,
              error: 'Chỉ có thể xác nhận thanh toán ở trạng thái PENDING',
            },
            { status: 400 }
          );
        }

        // Update subscription to completed and active
        const verifiedSubscription = await prisma.subscription.update({
          where: { id },
          data: {
            status: 'ACTIVE',
            paymentStatus: 'COMPLETED',
            paymentMethod: subscription.paymentMethod || 'manual_verification',
            transactionId: subscription.transactionId || `manual_${Date.now()}`,
            startDate: new Date(),
            endDate:
              subscription.plan.interval === 'year'
                ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });

        // Update user plan
        const userPlanValue =
          subscription.plan.name === 'Trial'
            ? 'TRIAL'
            : subscription.plan.name === 'Basic'
              ? 'BASIC'
              : subscription.plan.name === 'Pro'
                ? 'PRO'
                : subscription.plan.name === 'Enterprise'
                  ? 'ENTERPRISE'
                  : 'ULTIMATE';

        await prisma.user.update({
          where: { id: subscription.userId },
          data: { plan: userPlanValue },
        });

        // Log admin action
        await prisma.adminLog.create({
          data: {
            adminId: session.user.id,
            action: 'manual_verify',
            resource: 'subscription',
            resourceId: id,
            description: `Manually verified payment for subscription ${id}`,
            metadata: {
              subscriptionId: id,
              userId: subscription.userId,
              planId: subscription.planId,
              amount: subscription.amount,
              verificationNote: verificationNote || null,
            },
          },
        });

        return NextResponse.json({
          success: true,
          data: verifiedSubscription,
          message: 'Thanh toán đã được xác nhận thủ công thành công',
        });

      case 'cancel':
        // Check permission for cancellation
        if (!hasPermission(session.user.role, 'cancel_subscriptions')) {
          return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        // Update subscription status
        const cancelledSubscription = await prisma.subscription.update({
          where: { id },
          data: {
            status: 'CANCELLED',
            autoRenew: false,
            paymentStatus: withRefund ? 'REFUNDED' : subscription.paymentStatus,
            endDate: new Date(), // Set end date to now for immediate cancellation
          },
        });

        // Downgrade user to TRIAL plan
        await prisma.user.update({
          where: { id: subscription.userId },
          data: { plan: 'TRIAL' },
        });

        // Log admin action
        await prisma.adminLog.create({
          data: {
            adminId: session.user.id,
            action: withRefund ? 'refund' : 'cancel',
            resource: 'subscription',
            resourceId: id,
            description: `${withRefund ? 'Refunded and cancelled' : 'Cancelled'} subscription ${id}`,
            metadata: {
              subscriptionId: id,
              userId: subscription.userId,
              withRefund,
              amount: subscription.amount,
            },
          },
        });

        return NextResponse.json({
          success: true,
          data: cancelledSubscription,
          message: withRefund
            ? 'Subscription đã được hoàn tiền và hủy'
            : 'Subscription đã được hủy',
        });

      case 'renew':
        // Check permission for renewal
        if (!hasPermission(session.user.role, 'manage_subscriptions')) {
          return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        // Only allow renewal of EXPIRED subscriptions
        if (subscription.status !== 'EXPIRED') {
          return NextResponse.json(
            {
              success: false,
              error: 'Chỉ có thể gia hạn subscription ở trạng thái EXPIRED',
            },
            { status: 400 }
          );
        }

        // Renew subscription
        const renewedSubscription = await prisma.subscription.update({
          where: { id },
          data: {
            status: 'ACTIVE',
            paymentStatus: 'PENDING', // Will need payment confirmation
            startDate: new Date(),
            endDate:
              subscription.plan.interval === 'year'
                ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            autoRenew: true,
          },
        });

        // Log admin action
        await prisma.adminLog.create({
          data: {
            adminId: session.user.id,
            action: 'renew',
            resource: 'subscription',
            resourceId: id,
            description: `Renewed subscription ${id}`,
            metadata: {
              subscriptionId: id,
              userId: subscription.userId,
              planId: subscription.planId,
            },
          },
        });

        return NextResponse.json({
          success: true,
          data: renewedSubscription,
          message: 'Subscription đã được gia hạn thành công',
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Subscription action error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/subscriptions/[id] - Update subscription
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasPermission(session.user.role, 'manage_subscriptions')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { status, endDate, autoRenew, paymentStatus, paymentMethod, transactionId, planId } =
      body;

    // Check if subscription exists
    const existingSubscription = await prisma.subscription.findUnique({
      where: { id },
      include: { user: true, plan: true },
    });

    if (!existingSubscription) {
      return NextResponse.json(
        {
          success: false,
          error: 'Subscription not found',
        },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (status) updateData.status = status;
    if (endDate) updateData.endDate = new Date(endDate);
    if (autoRenew !== undefined) updateData.autoRenew = autoRenew;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (paymentMethod) updateData.paymentMethod = paymentMethod;
    if (transactionId) updateData.transactionId = transactionId;

    // If changing plan
    if (planId && planId !== existingSubscription.planId) {
      const newPlan = await prisma.subscriptionPlan.findUnique({
        where: { id: planId },
      });

      if (!newPlan) {
        return NextResponse.json(
          {
            success: false,
            error: 'New plan not found',
          },
          { status: 404 }
        );
      }

      updateData.planId = planId;
      updateData.amount = newPlan.price;
      updateData.limits = {
        maxAgents: newPlan.maxAgents,
        maxConversations: newPlan.maxConversations,
        maxStorage: newPlan.maxStorage,
        maxApiCalls: newPlan.maxApiCalls,
      };

      // Update user plan enum
      const userPlanValue =
        newPlan.name === 'Trial'
          ? 'TRIAL'
          : newPlan.name === 'Basic'
            ? 'BASIC'
            : newPlan.name === 'Pro'
              ? 'PRO'
              : newPlan.name === 'Enterprise'
                ? 'ENTERPRISE'
                : 'ULTIMATE';

      await prisma.user.update({
        where: { id: existingSubscription.userId },
        data: { plan: userPlanValue },
      });
    }

    // Update subscription
    const subscription = await prisma.subscription.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    console.error('Subscription update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/subscriptions/[id] - Cancel subscription
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasPermission(session.user.role, 'manage_subscriptions')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const refund = searchParams.get('refund') === 'true';

    // Check if subscription exists
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: { user: true, plan: true },
    });

    if (!subscription) {
      return NextResponse.json(
        {
          success: false,
          error: 'Subscription not found',
        },
        { status: 404 }
      );
    }

    // Update subscription status
    const updatedSubscription = await prisma.subscription.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        autoRenew: false,
        paymentStatus: refund ? 'REFUNDED' : subscription.paymentStatus,
        endDate: new Date(), // Set end date to now for immediate cancellation
      },
    });

    // Downgrade user to TRIAL plan
    await prisma.user.update({
      where: { id: subscription.userId },
      data: { plan: 'TRIAL' },
    });

    return NextResponse.json({
      success: true,
      data: updatedSubscription,
      message: refund ? 'Subscription cancelled with refund' : 'Subscription cancelled',
    });
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
