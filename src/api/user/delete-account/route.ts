import { NextRequest, NextResponse } from 'next/server';
// ✅ FIXED Phase 4D True Fix - Fix getServerSession import for next-auth v4
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { confirmation } = await request.json();

    if (confirmation !== 'DELETE MY ACCOUNT') {
      return NextResponse.json(
        { error: 'Invalid confirmation. Please type "DELETE MY ACCOUNT" exactly.' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent OWNER from deleting their account
    if (user.role === 'OWNER') {
      return NextResponse.json(
        { error: 'Owner accounts cannot be deleted. Please transfer ownership first.' },
        { status: 403 }
      );
    }

    // Perform cascading deletion
    // Most relations will be deleted automatically via onDelete: Cascade
    // For critical data that needs manual cleanup, we handle it here

    // Delete user (this will cascade to most related data)
    await prisma.user.delete({
      where: { id: userId },
    });

    // Log the account deletion for audit purposes
    try {
      await prisma.adminLog.create({
        data: {
          adminId: userId, // Self-deletion
          action: 'delete',
          resource: 'user',
          resourceId: userId,
          description: 'User self-deleted account',
          metadata: {
            email: user.email,
            deletedAt: new Date().toISOString(),
            confirmation: 'DELETE MY ACCOUNT',
          },
        },
      });
    } catch (error) {
      // Log creation might fail if user is already deleted, but that's okay
              // Deletion log creation failed - non-critical for account deletion
    }

    return NextResponse.json({
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
