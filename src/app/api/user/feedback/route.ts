import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// GET /api/user/feedback - Lấy feedback của user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const feedbacks = await prisma.userFeedback.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      data: feedbacks,
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}

// POST /api/user/feedback - Gửi feedback mới
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();

    const { type, subject, message, rating, userAgent, url, screenshot } = body;

    // Validate required fields
    if (!type || !subject || !message) {
      return NextResponse.json(
        { success: false, error: 'Type, subject, and message are required' },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ['bug', 'feature', 'improvement', 'complaint', 'praise'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ success: false, error: 'Invalid feedback type' }, { status: 400 });
    }

    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Determine priority based on type
    let priority = 'medium';
    if (type === 'bug') priority = 'high';
    else if (type === 'complaint') priority = 'high';
    else if (type === 'feature') priority = 'low';
    else if (type === 'improvement') priority = 'low';
    else if (type === 'praise') priority = 'low';

    const feedback = await prisma.userFeedback.create({
      data: {
        userId,
        type,
        subject,
        message,
        rating,
        priority,
        userAgent,
        url,
        screenshot,
      },
    });

    return NextResponse.json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    console.error('Error creating feedback:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create feedback' },
      { status: 500 }
    );
  }
}
