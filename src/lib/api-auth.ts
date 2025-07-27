/**
 * 🔐 Consolidated API Authentication Utilities
 * Reduces duplication across API routes
 */

import { NextRequest, NextResponse } from 'next/server';
// ✅ FIXED Phase 4D True Fix - Fix getServerSession import for next-auth v4
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  plan?: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthenticatedUser;
  error?: string;
  status?: number;
}

/**
 * Standard authentication check for API routes
 */
export async function authenticateUser(): Promise<AuthResult> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return {
        success: false,
        error: 'Unauthorized',
        status: 401,
      };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        plan: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
        status: 404,
      };
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        role: user.role || undefined,
        plan: user.plan || undefined,
      },
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: 'Authentication failed',
      status: 500,
    };
  }
}

/**
 * Authentication with role-based access control
 */
export async function authenticateWithRole(requiredRole: string): Promise<AuthResult> {
  const authResult = await authenticateUser();

  if (!authResult.success) {
    return authResult;
  }

  const userRole = authResult.user?.role || 'USER';

  // Role hierarchy: OWNER > ADMIN > MANAGER > USER
  const roleHierarchy = {
    OWNER: 4,
    ADMIN: 3,
    MANAGER: 2,
    USER: 1,
  };

  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 1;
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 1;

  if (userLevel < requiredLevel) {
    return {
      success: false,
      error: 'Insufficient permissions',
      status: 403,
    };
  }

  return authResult;
}

/**
 * Authentication middleware wrapper for API routes
 */
// ✅ FIXED IN Phase 4A.2 - Replace any[] with more specific type
export function withAuth<T extends unknown[]>(
  handler: (user: AuthenticatedUser, ...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    const authResult = await authenticateUser();

    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    return handler(authResult.user!, ...args);
  };
}

/**
 * Authentication middleware with role check
 */
// ✅ FIXED IN Phase 4A.2 - Replace any[] with more specific type
export function withRoleAuth<T extends unknown[]>(
  requiredRole: string,
  handler: (user: AuthenticatedUser, ...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    const authResult = await authenticateWithRole(requiredRole);

    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    return handler(authResult.user!, ...args);
  };
}

/**
 * Agent ownership verification
 */
export async function verifyAgentOwnership(agentId: string, userId: string): Promise<boolean> {
  try {
    const agent = await prisma.agent.findFirst({
      where: {
        id: agentId,
        userId: userId,
      },
    });

    return !!agent;
  } catch (error) {
    console.error('Agent ownership verification error:', error);
    return false;
  }
}

/**
 * Standard error responses
 */
export const AuthErrors = {
  UNAUTHORIZED: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
  FORBIDDEN: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
  USER_NOT_FOUND: NextResponse.json({ error: 'User not found' }, { status: 404 }),
  AGENT_NOT_FOUND: NextResponse.json(
    { error: 'Agent not found or access denied' },
    { status: 404 }
  ),
  INVALID_INPUT: NextResponse.json({ error: 'Invalid input' }, { status: 400 }),
  INTERNAL_ERROR: NextResponse.json({ error: 'Internal server error' }, { status: 500 }),
};
