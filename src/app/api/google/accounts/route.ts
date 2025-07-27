import { NextRequest, NextResponse } from 'next/server';
// ✅ FIXED Phase 4D True Fix - Fix getServerSession import for next-auth v4
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { googleAuth } from '@/lib/google/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/google/accounts
 * Get user's connected Google accounts
 */
export async function GET(request: NextRequest) {
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

    const accounts = await googleAuth.getUserGoogleAccounts(user.id);
    console.log('📡 Raw accounts from database:', accounts.length, 'accounts');

    // Parse scopes for each account with error handling
    const accountsWithScopes = accounts.map(account => {
      try {
        return {
          ...account,
          scopes: account.scopes ? JSON.parse(account.scopes) : [],
        };
      } catch (error) {
        console.error('Error parsing scopes for account:', account.id, error);
        return {
          ...account,
          scopes: [],
        };
      }
    });

    console.log('📡 Processed accounts:', accountsWithScopes.length, 'accounts');
    return NextResponse.json(accountsWithScopes);
  } catch (error) {
    console.error('Error getting Google accounts:', error);
    return NextResponse.json(
      {
        error: 'Failed to get Google accounts',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/google/accounts
 * Revoke access to a Google account
 */
export async function DELETE(request: NextRequest) {
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

    const { accountId } = await request.json();

    if (!accountId) {
      return NextResponse.json(
        {
          error: 'Account ID is required',
        },
        { status: 400 }
      );
    }

    const success = await googleAuth.revokeAccess(user.id, accountId);

    if (!success) {
      return NextResponse.json(
        {
          error: 'Failed to revoke access or account not found',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Google account access revoked successfully',
    });
  } catch (error) {
    console.error('Error revoking Google account access:', error);
    return NextResponse.json(
      {
        error: 'Failed to revoke Google account access',
      },
      { status: 500 }
    );
  }
}
