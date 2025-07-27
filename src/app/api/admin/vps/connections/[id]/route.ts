import { NextRequest, NextResponse } from 'next/server';
// ✅ FIXED Phase 4D True Fix - Fix getServerSession import for next-auth v4
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/vps/connections/[id] - Get specific VPS connection
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasPermission(session.user.role as any, 'view_vps')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const connection = await prisma.vPSConnection.findUnique({
      where: { id },
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
          take: 10,
        },
      },
    });

    if (!connection) {
      return NextResponse.json(
        {
          success: false,
          error: 'VPS connection not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: connection,
    });
  } catch (error) {
    console.error('Get VPS connection error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/vps/connections/[id] - Update VPS connection
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasPermission(session.user.role as any, 'edit_vps')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, host, port, username, password, privateKey, type } = body;

    // Check if VPS connection exists
    const existingConnection = await prisma.vPSConnection.findUnique({
      where: { id },
    });

    if (!existingConnection) {
      return NextResponse.json(
        {
          success: false,
          error: 'VPS connection not found',
        },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      name,
      description,
      host,
      port: port || 22,
      username,
      type: type || 'VPS',
    };

    // Only update password/privateKey if provided
    if (password) {
      updateData.password = Buffer.from(password).toString('base64');
    }
    if (privateKey) {
      updateData.privateKey = Buffer.from(privateKey).toString('base64');
    }

    const connection = await prisma.vPSConnection.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: connection,
      message: 'VPS connection updated successfully',
    });
  } catch (error) {
    console.error('Update VPS connection error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update VPS connection',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/vps/connections/[id] - Delete VPS connection
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasPermission(session.user.role as any, 'delete_vps')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if VPS connection exists and has active deployments
    const connection = await prisma.vPSConnection.findUnique({
      where: { id },
      include: {
        deployments: {
          where: {
            status: {
              in: ['RUNNING', 'DEPLOYING'],
            },
          },
        },
      },
    });

    if (!connection) {
      return NextResponse.json(
        {
          success: false,
          error: 'VPS connection not found',
        },
        { status: 404 }
      );
    }

    if (connection.deployments.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete VPS with active deployments',
        },
        { status: 400 }
      );
    }

    // Delete VPS connection (cascades to deployments and monitoring)
    await prisma.vPSConnection.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'VPS connection deleted successfully',
    });
  } catch (error) {
    console.error('Delete VPS connection error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete VPS connection',
      },
      { status: 500 }
    );
  }
}
