import { NextRequest, NextResponse } from 'next/server';
// ✅ FIXED Phase 4D True Fix - Fix getServerSession import for next-auth v4
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

// GET /api/admin/vps/connections - Get all VPS connections
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasPermission(session.user.role as any, 'view_vps')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const connections = await prisma.vPSConnection.findMany({
      include: {
        deployments: {
          include: {
            agent: {
              select: { id: true, name: true },
            },
          },
        },
        monitoring: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: connections,
    });
  } catch (error) {
    console.error('Get VPS connections error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/vps/connections - Create new VPS connection
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasPermission(session.user.role as any, 'create_vps')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, host, port, username, password, privateKey, type } = body;

    // Validate required fields
    if (!name || !host || !username) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    // Create VPS connection
    const connection = await prisma.vPSConnection.create({
      data: {
        name,
        description,
        host,
        port: port || 22,
        username,
        password: password ? Buffer.from(password).toString('base64') : null, // Basic encryption
        privateKey: privateKey ? Buffer.from(privateKey).toString('base64') : null,
        type: type || 'VPS',
        status: 'DISCONNECTED',
      },
    });

    return NextResponse.json({
      success: true,
      data: connection,
      message: 'VPS connection created successfully',
    });
  } catch (error) {
    console.error('Create VPS connection error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create VPS connection',
      },
      { status: 500 }
    );
  }
}
