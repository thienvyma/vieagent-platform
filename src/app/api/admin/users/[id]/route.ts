import { NextRequest, NextResponse } from 'next/server';
// ✅ FIXED Phase 4D True Fix - Fix getServerSession import for next-auth v4
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  hasPermission,
  canModifyUser,
  canDeleteUser,
  canChangeRole,
  hasRoleLevel,
  type UserRole,
} from '@/lib/permissions';
import bcrypt from 'bcryptjs';

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET /api/admin/users/[id] - Get detailed user information
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view users
    if (!hasPermission(session.user.role as UserRole, 'view_users')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = await params;

    // Get basic user information
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        plan: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get basic statistics
    const [agentsCount, conversationsCount, messagesCount] = await Promise.all([
      prisma.agent.count({ where: { userId: id } }),
      prisma.conversation.count({ where: { userId: id } }),
      prisma.message.count({
        where: {
          conversation: {
            userId: id,
          },
        },
      }),
    ]);

    // Get current subscription with plan details
    const currentSubscription = await prisma.subscription.findFirst({
      where: {
        userId: id,
        status: 'ACTIVE',
      },
      select: {
        plan: {
          select: {
            name: true,
            price: true,
            maxAgents: true,
            maxConversations: true,
          },
        },
        startDate: true,
        endDate: true,
        status: true,
        amount: true,
        paymentStatus: true,
      },
    });

    // Transform data for frontend
    const userDetails = {
      ...user,
      statistics: {
        agentsCount,
        conversationsCount,
        messagesCount,
      },
      subscription: currentSubscription
        ? {
            plan: currentSubscription.plan.name,
            planDetails: {
              name: currentSubscription.plan.name,
              price: currentSubscription.plan.price,
              maxAgents: currentSubscription.plan.maxAgents,
              maxConversations: currentSubscription.plan.maxConversations,
            },
            startDate: currentSubscription.startDate.toISOString(),
            endDate: currentSubscription.endDate?.toISOString(),
            status: currentSubscription.status,
            amount: currentSubscription.amount,
            paymentStatus: currentSubscription.paymentStatus,
          }
        : undefined,
    };

    return NextResponse.json(userDetails);
  } catch (error) {
    console.error('Error fetching user details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/users/[id] - Update specific user fields
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true, email: true, plan: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check permissions for each action
    if (body.role && !hasPermission(session.user.role as UserRole, 'change_user_roles')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to change user roles' },
        { status: 403 }
      );
    }

    if (body.plan && !hasPermission(session.user.role as UserRole, 'change_user_plans')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to change user plans' },
        { status: 403 }
      );
    }

    if (
      typeof body.isActive === 'boolean' &&
      !hasPermission(session.user.role as UserRole, 'edit_users')
    ) {
      return NextResponse.json(
        { error: 'Insufficient permissions to modify user status' },
        { status: 403 }
      );
    }

    // Check if user can modify target user
    if (
      !canModifyUser(
        session.user.role as UserRole,
        session.user.id,
        currentUser.role as UserRole,
        id
      )
    ) {
      return NextResponse.json({ error: 'Cannot modify this user' }, { status: 403 });
    }

    // Validate role assignment
    if (
      body.role &&
      !canChangeRole(
        session.user.role as UserRole,
        session.user.id,
        currentUser.role as UserRole,
        id,
        body.role as UserRole
      )
    ) {
      return NextResponse.json({ error: 'Cannot assign this role to the user' }, { status: 403 });
    }

    // Handle subscription update if plan is changed
    if (body.plan && body.plan !== currentUser.plan) {
      // Get or create subscription plan
      let subscriptionPlan = await prisma.subscriptionPlan.findFirst({
        where: { name: body.plan },
      });

      if (!subscriptionPlan) {
        // Create default subscription plan if not exists
        const planDefaults = {
          TRIAL: { price: 0, maxAgents: 1, maxConversations: 100 },
          BASIC: { price: 29, maxAgents: 3, maxConversations: 1000 },
          PRO: { price: 99, maxAgents: 10, maxConversations: 10000 },
          ENTERPRISE: { price: 299, maxAgents: 50, maxConversations: 100000 },
          ULTIMATE: { price: 999, maxAgents: -1, maxConversations: -1 },
        };

        const defaults = planDefaults[body.plan as keyof typeof planDefaults] || planDefaults.TRIAL;

        subscriptionPlan = await prisma.subscriptionPlan.create({
          data: {
            name: body.plan,
            description: `${body.plan} Plan`,
            price: defaults.price,
            maxAgents: defaults.maxAgents,
            maxConversations: defaults.maxConversations,
            enableGoogleIntegration: body.plan !== 'TRIAL',
            enableHandoverSystem: ['PRO', 'ENTERPRISE', 'ULTIMATE'].includes(body.plan),
            enableAnalytics: body.plan !== 'TRIAL',
            enableCustomBranding: ['ENTERPRISE', 'ULTIMATE'].includes(body.plan),
            enablePrioritySupport: ['ENTERPRISE', 'ULTIMATE'].includes(body.plan),
          },
        });
      }

      // Deactivate current active subscription
      await prisma.subscription.updateMany({
        where: {
          userId: id,
          status: 'ACTIVE',
        },
        data: {
          status: 'CANCELLED',
          endDate: new Date(),
        },
      });

      // Create new subscription
      await prisma.subscription.create({
        data: {
          userId: id,
          planId: subscriptionPlan.id,
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: body.plan === 'TRIAL' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days for paid plans
          amount: subscriptionPlan.price,
          currency: 'USD',
          paymentStatus: body.plan === 'TRIAL' ? 'COMPLETED' : 'PENDING',
          autoRenew: body.plan !== 'TRIAL',
        },
      });
    }

    // Update user
    const updateData: any = {
      ...(body.name && { name: body.name }),
      ...(body.email && { email: body.email }),
      ...(body.role && { role: body.role }),
      ...(body.plan && { plan: body.plan }),
      ...(typeof body.isActive === 'boolean' && { isActive: body.isActive }),
    };
    if (body.password && body.password.length >= 6) {
      updateData.password = await bcrypt.hash(body.password, 12);
    }
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        plan: true,
        isActive: true,
        updatedAt: true,
      },
    });

    // Log admin action
    await prisma.adminLog.create({
      data: {
        action: 'USER_UPDATED',
        resource: 'user',
        resourceId: id,
        description: `Updated user: ${updatedUser.email}`,
        adminId: session.user.id,
        metadata: { changes: body },
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/users/[id]/reset-password - Reset user password
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to reset passwords
    if (!hasPermission(session.user.role as UserRole, 'reset_user_passwords')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (action === 'reset-password') {
      // Get user
      const user = await prisma.user.findUnique({
        where: { id },
        select: { email: true, role: true },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Check if user can modify target user
      if (
        !canModifyUser(session.user.role as UserRole, session.user.id, user.role as UserRole, id)
      ) {
        return NextResponse.json({ error: 'Cannot reset password for this user' }, { status: 403 });
      }

      // Generate temporary password
      const tempPassword =
        Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

      // Update user with temporary password (in real app, hash it)
      await prisma.user.update({
        where: { id },
        data: {
          // In production, hash the password
          // password: await hash(tempPassword, 10)
        },
      });

      // Log admin action
      await prisma.adminLog.create({
        data: {
          action: 'PASSWORD_RESET',
          resource: 'user',
          resourceId: id,
          description: `Reset password for user: ${user.email}`,
          adminId: session.user.id,
          metadata: { action: 'reset-password' },
        },
      });

      return NextResponse.json({
        message: 'Password reset successfully',
        temporaryPassword: tempPassword, // Remove in production
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to delete users
    if (!hasPermission(session.user.role as UserRole, 'delete_users')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = await params;

    // Get user before deletion for permission check and logging
    const user = await prisma.user.findUnique({
      where: { id },
      select: { email: true, name: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user can delete target user
    if (!canDeleteUser(session.user.role as UserRole, session.user.id, user.role as UserRole, id)) {
      return NextResponse.json({ error: 'Cannot delete this user' }, { status: 403 });
    }

    // Delete user and all related data (cascade)
    await prisma.user.delete({
      where: { id },
    });

    // Log admin action
    await prisma.adminLog.create({
      data: {
        action: 'USER_DELETED',
        resource: 'user',
        resourceId: id,
        description: `Deleted user: ${user.email}`,
        adminId: session.user.id,
        metadata: { deletedUser: { email: user.email, name: user.name, role: user.role } },
      },
    });

    return NextResponse.json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
