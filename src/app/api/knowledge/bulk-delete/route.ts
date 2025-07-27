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
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'IDs array is required' },
        { status: 400 }
      );
    }

    let deletedCount = 0;
    let errorCount = 0;
    const errors: Array<{ id: string; error: string }> = [];

    for (const id of ids) {
      try {
        // Delete knowledge item (ensure user can only delete their own items)
        await prisma.knowledge.delete({
          where: {
            id,
            userId: session.user.id,
          },
        });

        // TODO: Also delete associated files and vectors
        deletedCount++;
      } catch (error) {
        console.error(`Error deleting item ${id}:`, error);
        errorCount++;
        errors.push({ id, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Bulk delete completed. ${deletedCount} deleted, ${errorCount} errors`,
      data: {
        deletedCount,
        errorCount,
        errors,
      },
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    return NextResponse.json({ success: false, message: 'Bulk delete failed' }, { status: 500 });
  }
}
