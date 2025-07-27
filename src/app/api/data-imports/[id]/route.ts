import { NextRequest, NextResponse } from 'next/server';
// ✅ FIXED Phase 4D True Fix - Fix getServerSession import for next-auth v4
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = await params;

    const dataImport = await prisma.dataImport.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        conversations: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            messages: {
              take: 5,
              orderBy: { timestamp: 'asc' },
            },
          },
        },
        analytics: {
          orderBy: { date: 'desc' },
        },
        _count: {
          select: {
            conversations: true,
            analytics: true,
          },
        },
      },
    });

    if (!dataImport) {
      return NextResponse.json({ error: 'Import not found' }, { status: 404 });
    }

    return NextResponse.json(dataImport);
  } catch (error) {
    console.error('Error fetching import details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = await params;

    // Verify import belongs to user
    const dataImport = await prisma.dataImport.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!dataImport) {
      return NextResponse.json({ error: 'Import not found' }, { status: 404 });
    }

    // Delete import (cascade will handle related records)
    await prisma.dataImport.delete({
      where: { id },
    });

    // TODO: Delete associated files from disk

    return NextResponse.json({ message: 'Import deleted successfully' });
  } catch (error) {
    console.error('Error deleting import:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
