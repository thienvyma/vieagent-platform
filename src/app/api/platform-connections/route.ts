import { NextRequest, NextResponse } from 'next/server';
// ✅ FIXED Phase 4D True Fix - Fix getServerSession import for next-auth v4
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/platform-connections
 * Get user's platform connections
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connections = await prisma.platformConnection.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      select: {
        id: true,
        platform: true,
        agentId: true,
        isActive: true,
        lastSync: true,
        tokenExpiry: true,
        platformData: true,
        metadata: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Parse JSON fields and add connection status
    const connectionsWithStatus = connections.map(conn => {
      let platformData = null;
      let metadata = null;

      try {
        platformData = conn.platformData ? JSON.parse(conn.platformData) : null;
        metadata = conn.metadata ? JSON.parse(conn.metadata) : null;
      } catch (error) {
        console.error('Error parsing connection data:', error);
      }

      // Check if token is expired
      const isTokenExpired = conn.tokenExpiry ? new Date() > conn.tokenExpiry : false;

      return {
        ...conn,
        platformData,
        metadata,
        status: isTokenExpired ? 'expired' : 'connected',
      };
    });

    return NextResponse.json({
      success: true,
      connections: connectionsWithStatus,
    });
  } catch (error) {
    console.error('Error fetching platform connections:', error);
    return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
  }
}

/**
 * DELETE /api/platform-connections
 * Disconnect a platform connection
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { platform, agentId } = await request.json();

    if (!platform) {
      return NextResponse.json({ error: 'Platform is required' }, { status: 400 });
    }

    const connection = await prisma.platformConnection.findFirst({
      where: {
        userId: session.user.id,
        platform: platform,
        agentId: agentId || null,
      },
    });

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    // Soft delete - mark as inactive
    await prisma.platformConnection.update({
      where: { id: connection.id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Connection disconnected successfully',
    });
  } catch (error) {
    console.error('Error disconnecting platform:', error);
    return NextResponse.json({ error: 'Failed to disconnect platform' }, { status: 500 });
  }
}
