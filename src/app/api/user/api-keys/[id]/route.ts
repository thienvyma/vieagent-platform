import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// DELETE /api/user/api-keys/[id] - Xóa API key
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const { id } = params;

    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Check if API key belongs to user
    const existingKey = await prisma.userApiKey.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingKey) {
      return NextResponse.json({ success: false, error: 'API key not found' }, { status: 404 });
    }

    await prisma.userApiKey.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'API key deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete API key' },
      { status: 500 }
    );
  }
}

// PUT /api/user/api-keys/[id] - Cập nhật API key
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const { id } = params;

    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();

    const { name, isActive, models, rateLimit } = body;

    // Check if API key belongs to user
    const existingKey = await prisma.userApiKey.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingKey) {
      return NextResponse.json({ success: false, error: 'API key not found' }, { status: 404 });
    }

    const updatedKey = await prisma.userApiKey.update({
      where: { id },
      data: {
        name,
        isActive,
        models: models ? JSON.stringify(models) : existingKey.models,
        rateLimit: rateLimit !== undefined ? rateLimit : existingKey.rateLimit,
      },
      select: {
        id: true,
        name: true,
        provider: true,
        isActive: true,
        lastUsed: true,
        usageCount: true,
        models: true,
        rateLimit: true,
        monthlyUsage: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedKey,
    });
  } catch (error) {
    console.error('Error updating API key:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update API key' },
      { status: 500 }
    );
  }
}
