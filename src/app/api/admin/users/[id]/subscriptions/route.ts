import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Lấy lịch sử subscriptions của user với plan details
    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId: id,
      },
      select: {
        id: true,
        plan: {
          select: {
            name: true,
            price: true,
            maxAgents: true,
            maxConversations: true,
          },
        },
        status: true,
        startDate: true,
        endDate: true,
        amount: true,
        paymentStatus: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format data
    const formattedSubscriptions = subscriptions.map(sub => ({
      id: sub.id,
      plan: sub.plan.name,
      planDetails: {
        name: sub.plan.name,
        price: sub.plan.price,
        maxAgents: sub.plan.maxAgents,
        maxConversations: sub.plan.maxConversations,
      },
      status: sub.status,
      startDate: sub.startDate.toISOString(),
      endDate: sub.endDate?.toISOString(),
      amount: sub.amount,
      paymentStatus: sub.paymentStatus,
    }));

    return NextResponse.json({
      success: true,
      subscriptions: formattedSubscriptions,
    });
  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
