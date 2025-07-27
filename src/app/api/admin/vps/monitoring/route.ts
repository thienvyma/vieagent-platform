import { NextRequest, NextResponse } from 'next/server';
// ✅ FIXED Phase 4D True Fix - Fix getServerSession import for next-auth v4
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

// GET /api/admin/vps/monitoring - Get monitoring data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasPermission(session.user.role as any, 'view_monitoring')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const vpsId = searchParams.get('vpsId');
    const hours = parseInt(searchParams.get('hours') || '24');

    // Calculate time range
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);

    let monitoring;

    if (vpsId) {
      // Get monitoring data for specific VPS
      monitoring = await prisma.vPSMonitoring.findMany({
        where: {
          vpsId,
          timestamp: {
            gte: startTime,
            lte: endTime,
          },
        },
        orderBy: { timestamp: 'desc' },
        take: 100,
      });
    } else {
      // Get latest monitoring data for all VPS
      const vpsConnections = await prisma.vPSConnection.findMany({
        where: { status: 'CONNECTED' },
        select: { id: true },
      });

      const latestMonitoring = await Promise.all(
        vpsConnections.map(async vps => {
          const latest = await prisma.vPSMonitoring.findFirst({
            where: { vpsId: vps.id },
            orderBy: { timestamp: 'desc' },
          });
          return latest;
        })
      );

      monitoring = latestMonitoring.filter(Boolean);
    }

    return NextResponse.json({
      success: true,
      data: monitoring,
    });
  } catch (error) {
    console.error('Get monitoring data error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/vps/monitoring - Create monitoring data (for external monitoring agents)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasPermission(session.user.role as any, 'manage_vps')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { vpsId, cpuUsage, ramUsage, diskUsage, networkIn, networkOut, uptime } = body;

    // Validate required fields
    if (!vpsId) {
      return NextResponse.json(
        {
          success: false,
          error: 'VPS ID is required',
        },
        { status: 400 }
      );
    }

    // Check if VPS exists
    const vps = await prisma.vPSConnection.findUnique({
      where: { id: vpsId },
    });

    if (!vps) {
      return NextResponse.json(
        {
          success: false,
          error: 'VPS connection not found',
        },
        { status: 404 }
      );
    }

    // Create monitoring record
    const monitoring = await prisma.vPSMonitoring.create({
      data: {
        vpsId,
        cpuUsage: cpuUsage || null,
        ramUsage: ramUsage || null,
        diskUsage: diskUsage || null,
        networkIn: networkIn || null,
        networkOut: networkOut || null,
        uptime: uptime || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: monitoring,
      message: 'Monitoring data recorded successfully',
    });
  } catch (error) {
    console.error('Create monitoring data error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to record monitoring data',
      },
      { status: 500 }
    );
  }
}
