import { NextRequest, NextResponse } from 'next/server';
// ✅ FIXED Phase 4D True Fix - Fix getServerSession import for next-auth v4
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasPermission(session.user.role, 'manage_payments')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    // Get bank transfer
    const transfer = await prisma.bankTransfer.findUnique({
      where: { id },
      include: {
        user: true,
        plan: true,
      },
    });

    if (!transfer) {
      return NextResponse.json({ error: 'Bank transfer not found' }, { status: 404 });
    }

    if (transfer.status !== 'PENDING') {
      return NextResponse.json(
        {
          error: 'Bank transfer is not pending verification',
        },
        { status: 400 }
      );
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    if (transfer.plan.interval === 'month') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (transfer.plan.interval === 'year') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Start transaction
    const result = await prisma.$transaction(async tx => {
      // Update bank transfer status
      const updatedTransfer = await tx.bankTransfer.update({
        where: { id },
        data: {
          status: 'VERIFIED',
          verifiedBy: (session.user as any).id,
          verifiedAt: new Date(),
        },
      });

      // Cancel existing active subscriptions
      await tx.subscription.updateMany({
        where: {
          userId: transfer.userId,
          status: 'ACTIVE',
        },
        data: {
          status: 'CANCELLED',
          endDate: new Date(),
        },
      });

      // Update subscription status from PENDING to ACTIVE
      await tx.subscription.updateMany({
        where: {
          userId: transfer.userId,
          transactionId: transfer.id,
          status: 'PENDING',
        },
        data: {
          status: 'ACTIVE',
          paymentStatus: 'COMPLETED',
          startDate,
          endDate,
        },
      });

      // Update user plan
      const userPlanValue =
        transfer.plan.name === 'Trial'
          ? 'TRIAL'
          : transfer.plan.name === 'Basic'
            ? 'BASIC'
            : transfer.plan.name === 'Pro'
              ? 'PRO'
              : transfer.plan.name === 'Enterprise'
                ? 'ENTERPRISE'
                : 'ULTIMATE';

      await tx.user.update({
        where: { id: transfer.userId },
        data: { plan: userPlanValue },
      });

      return updatedTransfer;
    });

    // TODO: Send confirmation email to user
    // await sendSubscriptionConfirmationEmail(transfer.user.email, transfer.plan.name);

    return NextResponse.json({
      success: true,
      data: result,
      message: `Bank transfer verified and subscription activated for ${transfer.user.name}`,
    });
  } catch (error) {
    console.error('Bank transfer verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
