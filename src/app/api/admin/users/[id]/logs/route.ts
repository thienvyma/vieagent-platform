import { NextRequest, NextResponse } from 'next/server';
// ✅ FIXED Phase 4D True Fix - Fix getServerSession import for next-auth v4
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !hasPermission(session.user.role, 'view_users')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const userId = resolvedParams.id;

    // Return mock logs for now since we don't have actual log tracking
    const logs = [
      {
        id: '1',
        action: 'LOGIN',
        description: 'User logged in',
        timestamp: new Date().toISOString(),
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
      },
      {
        id: '2',
        action: 'UPDATE_PROFILE',
        description: 'User updated profile',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
      },
    ];

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error fetching user logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
