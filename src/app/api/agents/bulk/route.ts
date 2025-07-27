import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const BulkOperationSchema = z.object({
  operation: z.enum([
    'activate',
    'deactivate',
    'delete',
    'duplicate',
    'archive',
    'deploy',
    'export',
    'update',
  ]),
  agentIds: z.array(z.string()).min(1),
  config: z
    .object({
      // Update operation config
      model: z.string().optional(),
      temperature: z.number().min(0).max(2).optional(),
      maxTokens: z.number().min(1).max(4000).optional(),
      status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
      category: z.string().optional(),
      isPublic: z.boolean().optional(),
      // Deployment config
      environment: z.enum(['production', 'staging', 'development']).optional(),
      region: z.string().optional(),
      scaling: z.enum(['auto', 'manual']).optional(),
      replicas: z.number().min(1).max(10).optional(),
      resources: z
        .object({
          cpu: z.string().optional(),
          memory: z.string().optional(),
        })
        .optional(),
      healthCheck: z.boolean().optional(),
      monitoring: z.boolean().optional(),
      // Export config
      format: z.enum(['json', 'csv', 'yaml']).optional(),
      includeKnowledge: z.boolean().optional(),
      includeConversations: z.boolean().optional(),
      includeMetrics: z.boolean().optional(),
      compression: z.boolean().optional(),
    })
    .optional(),
});

interface BulkOperationResult {
  success: boolean;
  agentId: string;
  agentName: string;
  error?: string;
  details?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { operation, agentIds, config } = BulkOperationSchema.parse(body);

    // Verify all agents belong to the user
    const agents = await prisma.agent.findMany({
      where: {
        id: { in: agentIds },
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        status: true,
        model: true,
        temperature: true,
        maxTokens: true,
        isPublic: true,
        knowledgeFiles: true,
        prompt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (agents.length !== agentIds.length) {
      return NextResponse.json(
        {
          error: 'Some agents not found or not accessible',
        },
        { status: 404 }
      );
    }

    const results: BulkOperationResult[] = [];

    // Process each agent
    for (const agent of agents) {
      try {
        let result: BulkOperationResult;

        switch (operation) {
          case 'activate':
            result = await activateAgent(agent.id, agent.name);
            break;
          case 'deactivate':
            result = await deactivateAgent(agent.id, agent.name);
            break;
          case 'delete':
            result = await deleteAgent(agent.id, agent.name);
            break;
          case 'duplicate':
            result = await duplicateAgent(agent, session.user.id);
            break;
          case 'archive':
            result = await archiveAgent(agent.id, agent.name);
            break;
          case 'deploy':
            result = await deployAgent(agent.id, agent.name, config);
            break;
          case 'export':
            result = await exportAgent(agent, config);
            break;
          case 'update':
            result = await updateAgent(agent.id, agent.name, config);
            break;
          default:
            result = {
              success: false,
              agentId: agent.id,
              agentName: agent.name,
              error: 'Unknown operation',
            };
        }

        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          agentId: agent.id,
          agentName: agent.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Calculate summary
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount,
        operation,
      },
      results,
    });
  } catch (error) {
    console.error('Bulk operation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// Individual operation functions
async function activateAgent(agentId: string, agentName: string): Promise<BulkOperationResult> {
  try {
    await prisma.agent.update({
      where: { id: agentId },
      data: { status: 'ACTIVE' },
    });

    return {
      success: true,
      agentId,
      agentName,
      details: 'Agent activated successfully',
    };
  } catch (error) {
    return {
      success: false,
      agentId,
      agentName,
      error: error instanceof Error ? error.message : 'Failed to activate agent',
    };
  }
}

async function deactivateAgent(agentId: string, agentName: string): Promise<BulkOperationResult> {
  try {
    await prisma.agent.update({
      where: { id: agentId },
      data: { status: 'INACTIVE' },
    });

    return {
      success: true,
      agentId,
      agentName,
      details: 'Agent deactivated successfully',
    };
  } catch (error) {
    return {
      success: false,
      agentId,
      agentName,
      error: error instanceof Error ? error.message : 'Failed to deactivate agent',
    };
  }
}

async function deleteAgent(agentId: string, agentName: string): Promise<BulkOperationResult> {
  try {
    // Delete related data first
    await prisma.conversation.deleteMany({
      where: { agentId },
    });

    await prisma.agent.delete({
      where: { id: agentId },
    });

    return {
      success: true,
      agentId,
      agentName,
      details: 'Agent deleted successfully',
    };
  } catch (error) {
    return {
      success: false,
      agentId,
      agentName,
      error: error instanceof Error ? error.message : 'Failed to delete agent',
    };
  }
}

async function duplicateAgent(agent: any, userId: string): Promise<BulkOperationResult> {
  try {
    const duplicatedAgent = await prisma.agent.create({
      data: {
        name: `${agent.name} (Copy)`,
        prompt: agent.prompt,
        model: agent.model,
        temperature: agent.temperature,
        maxTokens: agent.maxTokens,
        status: 'INACTIVE',
        isPublic: false,
        knowledgeFiles: agent.knowledgeFiles,
        userId,
      },
    });

    return {
      success: true,
      agentId: agent.id,
      agentName: agent.name,
      details: `Agent duplicated as "${duplicatedAgent.name}"`,
    };
  } catch (error) {
    return {
      success: false,
      agentId: agent.id,
      agentName: agent.name,
      error: error instanceof Error ? error.message : 'Failed to duplicate agent',
    };
  }
}

async function archiveAgent(agentId: string, agentName: string): Promise<BulkOperationResult> {
  try {
    await prisma.agent.update({
      where: { id: agentId },
      data: {
        status: 'ARCHIVED',
        isPublic: false,
      },
    });

    return {
      success: true,
      agentId,
      agentName,
      details: 'Agent archived successfully',
    };
  } catch (error) {
    return {
      success: false,
      agentId,
      agentName,
      error: error instanceof Error ? error.message : 'Failed to archive agent',
    };
  }
}

async function deployAgent(
  agentId: string,
  agentName: string,
  config: any
): Promise<BulkOperationResult> {
  try {
    // Mock deployment logic - in real implementation, this would:
    // 1. Package the agent
    // 2. Deploy to specified environment
    // 3. Configure scaling and resources
    // 4. Set up health checks and monitoring

    const deploymentConfig = {
      environment: config?.environment || 'staging',
      region: config?.region || 'us-east-1',
      scaling: config?.scaling || 'auto',
      replicas: config?.replicas || 1,
      resources: config?.resources || { cpu: '0.5', memory: '1Gi' },
      healthCheck: config?.healthCheck !== false,
      monitoring: config?.monitoring !== false,
      deployedAt: new Date().toISOString(),
    };

    // Update agent with deployment status
    await prisma.agent.update({
      where: { id: agentId },
      data: {
        status: 'ACTIVE',
        // In real implementation, store deployment config in a separate table
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      agentId,
      agentName,
      details: `Agent deployed to ${deploymentConfig.environment} environment`,
    };
  } catch (error) {
    return {
      success: false,
      agentId,
      agentName,
      error: error instanceof Error ? error.message : 'Failed to deploy agent',
    };
  }
}

async function exportAgent(agent: any, config: any): Promise<BulkOperationResult> {
  try {
    const exportData: any = {
      id: agent.id,
      name: agent.name,
      prompt: agent.prompt,
      model: agent.model,
      temperature: agent.temperature,
      maxTokens: agent.maxTokens,
      status: agent.status,
      isPublic: agent.isPublic,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
    };

    if (config?.includeKnowledge) {
      exportData.knowledgeFiles = agent.knowledgeFiles;
    }

    if (config?.includeConversations) {
      // In real implementation, fetch conversations
      exportData.conversations = [];
    }

    if (config?.includeMetrics) {
      // In real implementation, fetch metrics
      exportData.metrics = {
        totalConversations: 0,
        avgResponseTime: 0,
        satisfactionScore: 0,
      };
    }

    // In real implementation, this would generate the actual export file
    // For now, we just return success
    return {
      success: true,
      agentId: agent.id,
      agentName: agent.name,
      details: `Agent exported in ${config?.format || 'json'} format`,
    };
  } catch (error) {
    return {
      success: false,
      agentId: agent.id,
      agentName: agent.name,
      error: error instanceof Error ? error.message : 'Failed to export agent',
    };
  }
}

async function updateAgent(
  agentId: string,
  agentName: string,
  config: any
): Promise<BulkOperationResult> {
  try {
    const updateData: any = {};

    if (config?.model) updateData.model = config.model;
    if (config?.temperature !== undefined) updateData.temperature = config.temperature;
    if (config?.maxTokens !== undefined) updateData.maxTokens = config.maxTokens;
    if (config?.status) updateData.status = config.status;
    if (config?.isPublic !== undefined) updateData.isPublic = config.isPublic;

    if (Object.keys(updateData).length === 0) {
      return {
        success: false,
        agentId,
        agentName,
        error: 'No update fields provided',
      };
    }

    await prisma.agent.update({
      where: { id: agentId },
      data: updateData,
    });

    return {
      success: true,
      agentId,
      agentName,
      details: `Agent updated: ${Object.keys(updateData).join(', ')}`,
    };
  } catch (error) {
    return {
      success: false,
      agentId,
      agentName,
      error: error instanceof Error ? error.message : 'Failed to update agent',
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get bulk operation history
    const operations = await prisma.bulkOperation.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      operations,
    });
  } catch (error) {
    console.error('Error fetching bulk operations:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch bulk operations',
      },
      { status: 500 }
    );
  }
}
