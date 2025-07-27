import { NextRequest, NextResponse } from 'next/server';
// ✅ FIXED Phase 4D True Fix - Fix getServerSession import for next-auth v4
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

// GET /api/admin/vps/deployments - Get all deployments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasPermission(session.user.role as any, 'view_deployments')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const deployments = await prisma.vPSDeployment.findMany({
      include: {
        agent: {
          select: { id: true, name: true, description: true },
        },
        vps: {
          select: { id: true, name: true, host: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: deployments,
    });
  } catch (error) {
    console.error('Get deployments error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/vps/deployments - Create new deployment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasPermission(session.user.role as any, 'deploy_agents')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, agentId, vpsId, config } = body;

    // Validate required fields
    if (!name || !agentId || !vpsId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    // Check if VPS exists and is connected
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

    if (vps.status !== 'CONNECTED') {
      return NextResponse.json(
        {
          success: false,
          error: 'VPS is not connected',
        },
        { status: 400 }
      );
    }

    // Check if agent exists
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      return NextResponse.json(
        {
          success: false,
          error: 'Agent not found',
        },
        { status: 404 }
      );
    }

    // Create deployment
    const deployment = await prisma.vPSDeployment.create({
      data: {
        name,
        description,
        agentId,
        vpsId,
        config,
        status: 'PENDING',
        logs: 'Deployment created and queued for processing...\n',
      },
      include: {
        agent: {
          select: { id: true, name: true, description: true },
        },
        vps: {
          select: { id: true, name: true, host: true },
        },
      },
    });

    // Simulate deployment process
    setTimeout(async () => {
      await simulateDeploymentProcess(deployment.id);
    }, 1000);

    return NextResponse.json({
      success: true,
      data: deployment,
      message: 'Deployment created successfully',
    });
  } catch (error) {
    console.error('Create deployment error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create deployment',
      },
      { status: 500 }
    );
  }
}

// Simulate deployment process
async function simulateDeploymentProcess(deploymentId: string) {
  try {
    // Update to DEPLOYING
    await prisma.vPSDeployment.update({
      where: { id: deploymentId },
      data: {
        status: 'DEPLOYING',
        logs:
          'Deployment created and queued for processing...\n' +
          'Connecting to VPS...\n' +
          'Installing dependencies...\n' +
          'Configuring environment...\n',
      },
    });

    // Simulate deployment time
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Simulate 90% success rate
    const isSuccess = Math.random() > 0.1;

    if (isSuccess) {
      await prisma.vPSDeployment.update({
        where: { id: deploymentId },
        data: {
          status: 'RUNNING',
          logs:
            'Deployment created and queued for processing...\n' +
            'Connecting to VPS...\n' +
            'Installing dependencies...\n' +
            'Configuring environment...\n' +
            'Starting agent service...\n' +
            'Agent deployed successfully and running on port 3000\n' +
            'Health check: PASSED\n',
        },
      });
    } else {
      await prisma.vPSDeployment.update({
        where: { id: deploymentId },
        data: {
          status: 'FAILED',
          logs:
            'Deployment created and queued for processing...\n' +
            'Connecting to VPS...\n' +
            'Installing dependencies...\n' +
            'ERROR: Failed to install dependencies\n' +
            'Deployment failed\n',
        },
      });
    }
  } catch (error) {
    console.error('Simulate deployment error:', error);
    await prisma.vPSDeployment.update({
      where: { id: deploymentId },
      data: {
        status: 'ERROR',
        logs: 'Deployment process encountered an error\n',
      },
    });
  }
}
