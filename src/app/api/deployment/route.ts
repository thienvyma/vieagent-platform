import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agents = await prisma.agent.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        model: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      agents,
      platforms: ['facebook', 'zalo', 'web'],
      deployments: [],
    });
  } catch (error) {
    console.error('Deployment API error:', error);
    return NextResponse.json({ error: 'Failed to fetch deployment data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      message: 'Deployment feature coming soon',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process deployment' }, { status: 500 });
  }
}
