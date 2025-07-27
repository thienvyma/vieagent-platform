import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const ExportConfigSchema = z.object({
  format: z.enum(['json', 'csv', 'yaml']).default('json'),
  includeKnowledge: z.boolean().default(true),
  includeConversations: z.boolean().default(false),
  includeMetrics: z.boolean().default(true),
  compression: z.boolean().default(false),
  filterStatus: z.enum(['all', 'active', 'inactive']).default('all'),
  filterCategory: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const config = ExportConfigSchema.parse(body);

    // Build query filters
    const whereClause: any = {
      userId: session.user.id,
    };

    if (config.filterStatus !== 'all') {
      whereClause.status = config.filterStatus.toUpperCase();
    }

    if (config.filterCategory) {
      whereClause.category = config.filterCategory;
    }

    // Fetch agents
    const agents = await prisma.agent.findMany({
      where: whereClause,
      include: {
        conversations: config.includeConversations
          ? {
              include: {
                messages: true,
              },
            }
          : false,
        _count: {
          select: {
            conversations: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (agents.length === 0) {
      return NextResponse.json(
        {
          error: 'No agents found matching the criteria',
        },
        { status: 404 }
      );
    }

    // Transform agents data
    const exportData = await Promise.all(
      agents.map(async agent => {
        const agentData: any = {
          id: agent.id,
          name: agent.name,
          description: agent.description,
          prompt: agent.prompt,
          model: agent.model,
          temperature: agent.temperature,
          maxTokens: agent.maxTokens,
          status: agent.status,
          isPublic: agent.isPublic,
          category: agent.category,
          tags: agent.tags || [],
          createdAt: agent.createdAt,
          updatedAt: agent.updatedAt,
          // Advanced settings
          messageDelayMs: agent.messageDelayMs,
          enableSmartDelay: agent.enableSmartDelay,
          maxDelayMs: agent.maxDelayMs,
          minDelayMs: agent.minDelayMs,
          enableVietnameseMode: agent.enableVietnameseMode,
          enableAutoHandover: agent.enableAutoHandover,
          handoverTriggers: agent.handoverTriggers || {},
          handoverThresholds: agent.handoverThresholds || {},
          handoverTimeoutMinutes: agent.handoverTimeoutMinutes,
          enableGoogleIntegration: agent.enableGoogleIntegration,
          googleServices: agent.googleServices || {},
          smartSchedulingDuration: agent.smartSchedulingDuration,
        };

        if (config.includeKnowledge) {
          agentData.knowledgeFiles = agent.knowledgeFiles || [];
        }

        if (config.includeConversations && agent.conversations) {
          agentData.conversations = agent.conversations.map(conv => ({
            id: conv.id,
            title: conv.title,
            createdAt: conv.createdAt,
            messages:
              conv.messages?.map(msg => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
                createdAt: msg.createdAt,
              })) || [],
          }));
        }

        if (config.includeMetrics) {
          // Calculate basic metrics
          const conversationCount = agent._count.conversations;
          const totalMessages =
            agent.conversations?.reduce((sum, conv) => sum + (conv.messages?.length || 0), 0) || 0;

          agentData.metrics = {
            totalConversations: conversationCount,
            totalMessages,
            avgMessagesPerConversation:
              conversationCount > 0 ? Math.round(totalMessages / conversationCount) : 0,
            lastActiveAt: agent.updatedAt,
            // Mock additional metrics
            avgResponseTime: Math.random() * 3 + 1,
            satisfactionScore: Math.random() * 2 + 3,
            successRate: Math.random() * 30 + 70,
            cost: Math.random() * 100 + 50,
            performance: Math.random() * 40 + 60,
          };
        }

        return agentData;
      })
    );

    // Generate export content based on format
    let content: string;
    let mimeType: string;
    let filename: string;

    switch (config.format) {
      case 'json':
        content = JSON.stringify(
          {
            exportInfo: {
              exportedAt: new Date().toISOString(),
              exportedBy: session.user.email,
              totalAgents: exportData.length,
              config,
            },
            agents: exportData,
          },
          null,
          2
        );
        mimeType = 'application/json';
        filename = `agents-export-${new Date().toISOString().split('T')[0]}.json`;
        break;

      case 'csv':
        content = generateCsvContent(exportData);
        mimeType = 'text/csv';
        filename = `agents-export-${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'yaml':
        content = generateYamlContent(exportData);
        mimeType = 'application/x-yaml';
        filename = `agents-export-${new Date().toISOString().split('T')[0]}.yaml`;
        break;

      default:
        throw new Error('Unsupported format');
    }

    // Log the export operation
    await prisma.bulkOperation.create({
      data: {
        userId: session.user.id,
        operation: 'export',
        agentIds: agents.map(a => a.id),
        summary: {
          total: agents.length,
          successful: agents.length,
          failed: 0,
          format: config.format,
        },
        results: agents.map(a => ({
          agentId: a.id,
          agentName: a.name,
          status: 'success',
        })),
      },
    });

    // Return file as download
    const buffer = Buffer.from(content, 'utf-8');

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Export error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid export configuration',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to export agents',
      },
      { status: 500 }
    );
  }
}

function generateCsvContent(agents: any[]): string {
  if (agents.length === 0) return '';

  // Define CSV headers
  const headers = [
    'id',
    'name',
    'description',
    'prompt',
    'model',
    'temperature',
    'maxTokens',
    'status',
    'isPublic',
    'category',
    'tags',
    'createdAt',
    'updatedAt',
    'messageDelayMs',
    'enableSmartDelay',
    'maxDelayMs',
    'minDelayMs',
    'enableVietnameseMode',
    'enableAutoHandover',
    'handoverTimeoutMinutes',
    'enableGoogleIntegration',
    'smartSchedulingDuration',
  ];

  // Add metrics headers if available
  if (agents[0].metrics) {
    headers.push(
      'totalConversations',
      'totalMessages',
      'avgMessagesPerConversation',
      'avgResponseTime',
      'satisfactionScore',
      'successRate',
      'cost',
      'performance'
    );
  }

  // Add knowledge files header if available
  if (agents[0].knowledgeFiles) {
    headers.push('knowledgeFiles');
  }

  const csvLines = [headers.join(',')];

  agents.forEach(agent => {
    const row = headers.map(header => {
      const value = agent[header];

      if (value === null || value === undefined) {
        return '';
      }

      if (Array.isArray(value)) {
        return `"${value.join(';')}"`;
      }

      if (typeof value === 'object') {
        return `"${JSON.stringify(value)}"`;
      }

      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }

      return value.toString();
    });

    csvLines.push(row.join(','));
  });

  return csvLines.join('\n');
}

function generateYamlContent(agents: any[]): string {
  let yaml = '# AI Agents Export\n';
  yaml += `# Exported at: ${new Date().toISOString()}\n`;
  yaml += `# Total agents: ${agents.length}\n\n`;
  yaml += 'agents:\n';

  agents.forEach(agent => {
    yaml += `  - name: "${agent.name}"\n`;
    yaml += `    id: "${agent.id}"\n`;

    if (agent.description) {
      yaml += `    description: "${agent.description}"\n`;
    }

    yaml += `    prompt: "${agent.prompt.replace(/"/g, '\\"')}"\n`;
    yaml += `    model: "${agent.model}"\n`;
    yaml += `    temperature: ${agent.temperature}\n`;
    yaml += `    maxTokens: ${agent.maxTokens}\n`;
    yaml += `    status: "${agent.status}"\n`;
    yaml += `    isPublic: ${agent.isPublic}\n`;

    if (agent.category) {
      yaml += `    category: "${agent.category}"\n`;
    }

    if (agent.tags && agent.tags.length > 0) {
      yaml += `    tags:\n`;
      agent.tags.forEach((tag: string) => {
        yaml += `      - "${tag}"\n`;
      });
    }

    yaml += `    createdAt: "${agent.createdAt}"\n`;
    yaml += `    updatedAt: "${agent.updatedAt}"\n`;

    // Advanced settings
    if (agent.messageDelayMs) {
      yaml += `    messageDelayMs: ${agent.messageDelayMs}\n`;
    }
    if (agent.enableSmartDelay !== undefined) {
      yaml += `    enableSmartDelay: ${agent.enableSmartDelay}\n`;
    }
    if (agent.maxDelayMs) {
      yaml += `    maxDelayMs: ${agent.maxDelayMs}\n`;
    }
    if (agent.minDelayMs) {
      yaml += `    minDelayMs: ${agent.minDelayMs}\n`;
    }
    if (agent.enableVietnameseMode !== undefined) {
      yaml += `    enableVietnameseMode: ${agent.enableVietnameseMode}\n`;
    }
    if (agent.enableAutoHandover !== undefined) {
      yaml += `    enableAutoHandover: ${agent.enableAutoHandover}\n`;
    }
    if (agent.handoverTimeoutMinutes) {
      yaml += `    handoverTimeoutMinutes: ${agent.handoverTimeoutMinutes}\n`;
    }
    if (agent.enableGoogleIntegration !== undefined) {
      yaml += `    enableGoogleIntegration: ${agent.enableGoogleIntegration}\n`;
    }
    if (agent.smartSchedulingDuration) {
      yaml += `    smartSchedulingDuration: ${agent.smartSchedulingDuration}\n`;
    }

    // Knowledge files
    if (agent.knowledgeFiles && agent.knowledgeFiles.length > 0) {
      yaml += `    knowledgeFiles:\n`;
      agent.knowledgeFiles.forEach((file: string) => {
        yaml += `      - "${file}"\n`;
      });
    }

    // Metrics
    if (agent.metrics) {
      yaml += `    metrics:\n`;
      yaml += `      totalConversations: ${agent.metrics.totalConversations}\n`;
      yaml += `      totalMessages: ${agent.metrics.totalMessages}\n`;
      yaml += `      avgMessagesPerConversation: ${agent.metrics.avgMessagesPerConversation}\n`;
      yaml += `      avgResponseTime: ${agent.metrics.avgResponseTime.toFixed(2)}\n`;
      yaml += `      satisfactionScore: ${agent.metrics.satisfactionScore.toFixed(2)}\n`;
      yaml += `      successRate: ${agent.metrics.successRate.toFixed(2)}\n`;
      yaml += `      cost: ${agent.metrics.cost.toFixed(2)}\n`;
      yaml += `      performance: ${agent.metrics.performance.toFixed(2)}\n`;
    }

    yaml += '\n';
  });

  return yaml;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get export history
    const exportHistory = await prisma.bulkOperation.findMany({
      where: {
        userId: session.user.id,
        operation: 'export',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      history: exportHistory,
      supportedFormats: ['json', 'csv', 'yaml'],
      options: {
        formats: [
          {
            value: 'json',
            label: 'JSON',
            description: 'Structured data format, best for re-importing',
          },
          { value: 'csv', label: 'CSV', description: 'Spreadsheet format, good for data analysis' },
          {
            value: 'yaml',
            label: 'YAML',
            description: 'Human-readable format, good for configuration',
          },
        ],
        includeOptions: [
          { key: 'includeKnowledge', label: 'Include Knowledge Base', default: true },
          { key: 'includeConversations', label: 'Include Conversations', default: false },
          { key: 'includeMetrics', label: 'Include Metrics', default: true },
          { key: 'compression', label: 'Enable Compression', default: false },
        ],
        filters: [
          {
            key: 'filterStatus',
            label: 'Filter by Status',
            options: ['all', 'active', 'inactive'],
          },
          { key: 'filterCategory', label: 'Filter by Category', optional: true },
        ],
      },
    });
  } catch (error) {
    console.error('Error getting export options:', error);
    return NextResponse.json(
      {
        error: 'Failed to get export options',
      },
      { status: 500 }
    );
  }
}
