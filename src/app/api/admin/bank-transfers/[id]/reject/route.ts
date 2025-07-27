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
    const { reason } = await request.json();

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

    // Start transaction
    const result = await prisma.$transaction(async tx => {
      // Update bank transfer status
      const updatedTransfer = await tx.bankTransfer.update({
        where: { id },
        data: {
          status: 'REJECTED',
          verifiedBy: (session.user as any).id,
          verifiedAt: new Date(),
          rejectionReason: reason,
        },
      });

      // Cancel associated subscription
      await tx.subscription.updateMany({
        where: {
          userId: transfer.userId,
          transactionId: transfer.id,
          status: 'PENDING',
        },
        data: {
          status: 'CANCELLED',
          paymentStatus: 'FAILED',
        },
      });

      return updatedTransfer;
    });

    // TODO: Send rejection email to user
    // await sendPaymentRejectionEmail(transfer.user.email, transfer.plan.name, reason);

    return NextResponse.json({
      success: true,
      data: result,
      message: `Bank transfer rejected for ${transfer.user.name}`,
    });
  } catch (error) {
    console.error('Bank transfer rejection error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
