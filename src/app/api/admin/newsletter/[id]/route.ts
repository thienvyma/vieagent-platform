import { NextRequest, NextResponse } from 'next/server';
// ✅ FIXED Phase 4D True Fix - Fix getServerSession import for next-auth v4
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission, type UserRole } from '@/lib/permissions';

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || !hasPermission(session.user.role as UserRole, 'edit_newsletter')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const params = await context.params;
    const body = await request.json();
    const { isActive, name, company, interests } = body;

    const newsletter = await prisma.newsletter.update({
      where: { id: params.id },
      data: {
        isActive,
        name,
        company,
        interests: interests ? JSON.stringify(interests) : undefined,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ newsletter });
  } catch (error) {
    console.error('Newsletter update error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user?.role ||
      !hasPermission(session.user.role as UserRole, 'delete_newsletter')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const params = await context.params;
    await prisma.newsletter.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Newsletter delete error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
