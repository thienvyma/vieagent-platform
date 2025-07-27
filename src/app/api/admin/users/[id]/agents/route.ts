import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Lấy danh sách agents của user
    const agents = await prisma.agent.findMany({
      where: {
        userId: id,
      },
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            conversations: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format data
    const formattedAgents = agents.map(agent => ({
      id: agent.id,
      name: agent.name,
      status: agent.status,
      createdAt: agent.createdAt.toISOString(),
      conversationsCount: agent._count.conversations,
    }));

    return NextResponse.json({
      success: true,
      agents: formattedAgents,
    });
  } catch (error) {
    console.error('Error fetching user agents:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
