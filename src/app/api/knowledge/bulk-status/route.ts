import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ids, status } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'IDs array is required' },
        { status: 400 }
      );
    }

    if (!status || !['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Valid status is required' },
        { status: 400 }
      );
    }

    let updatedCount = 0;
    let errorCount = 0;
    const errors: Array<{ id: string; error: string }> = [];

    for (const id of ids) {
      try {
        // Update status (ensure user can only update their own items)
        await prisma.knowledge.update({
          where: {
            id,
            userId: session.user.id,
          },
          data: {
            status,
            ...(status === 'PROCESSING' && { startedAt: new Date() }),
            ...(status === 'COMPLETED' && { processedAt: new Date(), completedAt: new Date() }),
            ...(status === 'FAILED' && { errorMessage: 'Status updated to failed' }),
          },
        });

        updatedCount++;
      } catch (error) {
        console.error(`Error updating status for item ${id}:`, error);
        errorCount++;
        errors.push({ id, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Bulk status update completed. ${updatedCount} updated, ${errorCount} errors`,
      data: {
        updatedCount,
        errorCount,
        errors,
      },
    });
  } catch (error) {
    console.error('Bulk status update error:', error);
    return NextResponse.json(
      { success: false, message: 'Bulk status update failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids')?.split(',') || [];

    if (ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'IDs parameter is required' },
        { status: 400 }
      );
    }

    // Get status for multiple items
    const items = await prisma.knowledge.findMany({
      where: {
        id: { in: ids },
        userId: session.user.id,
      },
      select: {
        id: true,
        status: true,
        startedAt: true,
        processedAt: true,
        completedAt: true,
        errorMessage: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error('Bulk status get error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get bulk status' },
      { status: 500 }
    );
  }
}
