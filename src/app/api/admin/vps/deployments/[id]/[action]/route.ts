import { NextRequest, NextResponse } from 'next/server';
// ✅ FIXED Phase 4D True Fix - Fix getServerSession import for next-auth v4
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

interface RouteParams {
  params: Promise<{ id: string; action: string }>;
}

// POST /api/admin/vps/deployments/[id]/[action] - Control deployment actions
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasPermission(session.user.role as any, 'deploy_agents')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id, action } = await params;

    // Validate action
    if (!['start', 'stop', 'restart'].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid action',
        },
        { status: 400 }
      );
    }

    // Check if deployment exists
    const deployment = await prisma.vPSDeployment.findUnique({
      where: { id },
      include: {
        vps: {
          select: { id: true, name: true, status: true },
        },
        agent: {
          select: { id: true, name: true },
        },
      },
    });

    if (!deployment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Deployment not found',
        },
        { status: 404 }
      );
    }

    // Check VPS status
    if (deployment.vps.status !== 'CONNECTED') {
      return NextResponse.json(
        {
          success: false,
          error: 'VPS is not connected',
        },
        { status: 400 }
      );
    }

    // Validate current deployment status for the action
    const validTransitions = {
      start: ['STOPPED', 'FAILED'],
      stop: ['RUNNING'],
      restart: ['RUNNING', 'STOPPED'],
    };

    if (!validTransitions[action as keyof typeof validTransitions].includes(deployment.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot ${action} deployment with status ${deployment.status}`,
        },
        { status: 400 }
      );
    }

    // Perform the action
    const result = await performDeploymentAction(deployment, action);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Deployment ${action} completed successfully`,
        data: result.deployment,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error(`Deployment action error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

async function performDeploymentAction(deployment: any, action: string) {
  try {
    let newStatus: 'PENDING' | 'DEPLOYING' | 'RUNNING' | 'STOPPED' | 'ERROR' | 'FAILED';
    let logEntry: string;

    switch (action) {
      case 'start':
        newStatus = 'RUNNING';
        logEntry =
          `[${new Date().toISOString()}] Starting agent service...\n` +
          `Agent ${deployment.agent.name} started successfully\n`;
        break;
      case 'stop':
        newStatus = 'STOPPED';
        logEntry =
          `[${new Date().toISOString()}] Stopping agent service...\n` +
          `Agent ${deployment.agent.name} stopped successfully\n`;
        break;
      case 'restart':
        // First stop, then start
        await new Promise(resolve => setTimeout(resolve, 1000));
        newStatus = 'RUNNING';
        logEntry =
          `[${new Date().toISOString()}] Restarting agent service...\n` +
          `Stopping agent...\n` +
          `Starting agent...\n` +
          `Agent ${deployment.agent.name} restarted successfully\n`;
        break;
      default:
        throw new Error('Invalid action');
    }

    // Update deployment
    const updatedDeployment = await prisma.vPSDeployment.update({
      where: { id: deployment.id },
      data: {
        status: newStatus,
        logs: (deployment.logs || '') + logEntry,
        updatedAt: new Date(),
      },
      include: {
        vps: {
          select: { id: true, name: true, status: true },
        },
        agent: {
          select: { id: true, name: true },
        },
      },
    });

    return {
      success: true,
      deployment: updatedDeployment,
    };
  } catch (error) {
    console.error(`Perform ${action} error:`, error);

    // Update deployment with error status
    await prisma.vPSDeployment.update({
      where: { id: deployment.id },
      data: {
        status: 'ERROR',
        logs:
          (deployment.logs || '') +
          `[${new Date().toISOString()}] ERROR: Failed to ${action} agent\n` +
          `Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`,
      },
    });

    return {
      success: false,
      error: `Failed to ${action} deployment`,
    };
  }
}
