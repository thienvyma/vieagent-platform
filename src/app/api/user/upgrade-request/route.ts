import { NextRequest, NextResponse } from 'next/server';
// ✅ FIXED Phase 4D True Fix - Fix getServerSession import for next-auth v4
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// GET /api/user/upgrade-request - Lấy upgrade request của user hiện tại
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const upgradeRequest = await prisma.planUpgradeRequest.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        targetPlan: true,
        currentPlan: true,
        reason: true,
        rejectionReason: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: upgradeRequest,
    });
  } catch (error) {
    console.error('Error fetching upgrade request:', error);
    return NextResponse.json(
      { success: false, error: 'Không thể tải yêu cầu nâng cấp' },
      { status: 500 }
    );
  }
}

// POST /api/user/upgrade-request - Tạo yêu cầu nâng cấp mới
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { targetPlan, reason, currentPlan } = body;

    if (!targetPlan || !reason || !currentPlan) {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      );
    }

    // Check if user already has a pending request
    const existingRequest = await prisma.planUpgradeRequest.findFirst({
      where: {
        userId: session.user.id,
        status: 'PENDING',
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { success: false, error: 'Bạn đã có yêu cầu nâng cấp đang chờ duyệt' },
        { status: 400 }
      );
    }

    // Create new upgrade request
    const upgradeRequest = await prisma.planUpgradeRequest.create({
      data: {
        userId: session.user.id,
        targetPlan,
        currentPlan,
        reason,
        status: 'PENDING',
      },
      select: {
        id: true,
        status: true,
        targetPlan: true,
        currentPlan: true,
        reason: true,
        rejectionReason: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: upgradeRequest,
    });
  } catch (error) {
    console.error('Error creating upgrade request:', error);
    return NextResponse.json(
      { success: false, error: 'Không thể tạo yêu cầu nâng cấp' },
      { status: 500 }
    );
  }
}
