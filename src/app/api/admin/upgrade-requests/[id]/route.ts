import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission, type UserRole } from '@/lib/permissions';

// PATCH - Approve or reject upgrade request
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
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
    if (!hasPermission(currentUserRole, 'verify_payments')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient permissions',
        },
        { status: 403 }
      );
    }

    const { action, rejectionReason, reviewNotes } = await req.json();
    const params = await context.params;
    const upgradeRequestId = params.id;

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid action',
        },
        { status: 400 }
      );
    }

    if (action === 'reject' && !rejectionReason) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rejection reason is required',
        },
        { status: 400 }
      );
    }

    // Get the upgrade request
    const upgradeRequest = await prisma.planUpgradeRequest.findUnique({
      where: { id: upgradeRequestId },
      include: { user: true },
    });

    if (!upgradeRequest) {
      return NextResponse.json(
        {
          success: false,
          error: 'Upgrade request not found',
        },
        { status: 404 }
      );
    }

    if (upgradeRequest.status !== 'PENDING') {
      return NextResponse.json(
        {
          success: false,
          error: 'Upgrade request is not pending',
        },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      // Update upgrade request status
      await prisma.planUpgradeRequest.update({
        where: { id: upgradeRequestId },
        data: {
          status: 'APPROVED',
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
          approvedBy: session.user.id,
          approvedAt: new Date(),
          reviewNotes,
        },
      });

      // Update user's plan
      await prisma.user.update({
        where: { id: upgradeRequest.userId },
        data: {
          plan: upgradeRequest.targetPlan as any,
        },
      });

      // Log admin action
      await prisma.adminLog.create({
        data: {
          adminId: session.user.id,
          action: 'PLAN_UPGRADE_APPROVED',
          resource: 'plan_upgrade_request',
          resourceId: upgradeRequestId,
          description: `Approved plan upgrade from ${upgradeRequest.currentPlan} to ${upgradeRequest.targetPlan} for user ${upgradeRequest.user.email}`,
          metadata: {
            userId: upgradeRequest.userId,
            fromPlan: upgradeRequest.currentPlan,
            toPlan: upgradeRequest.targetPlan,
            reviewNotes,
          },
        },
      });
    } else if (action === 'reject') {
      // Update upgrade request status
      await prisma.planUpgradeRequest.update({
        where: { id: upgradeRequestId },
        data: {
          status: 'REJECTED',
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
          rejectionReason,
          reviewNotes,
        },
      });

      // Log admin action
      await prisma.adminLog.create({
        data: {
          adminId: session.user.id,
          action: 'PLAN_UPGRADE_REJECTED',
          resource: 'plan_upgrade_request',
          resourceId: upgradeRequestId,
          description: `Rejected plan upgrade request for user ${upgradeRequest.user.email}`,
          metadata: {
            userId: upgradeRequest.userId,
            fromPlan: upgradeRequest.currentPlan,
            toPlan: upgradeRequest.targetPlan,
            rejectionReason,
            reviewNotes,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Upgrade request ${action}d successfully`,
    });
  } catch (error) {
    console.error('Error processing upgrade request:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
