import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const AgentImportSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  prompt: z.string().min(1),
  model: z.string().min(1),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(4000).default(1000),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('INACTIVE'),
  isPublic: z.boolean().default(false),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  knowledgeFiles: z.array(z.string()).optional(),
  // Advanced settings
  messageDelayMs: z.number().optional(),
  enableSmartDelay: z.boolean().optional(),
  maxDelayMs: z.number().optional(),
  minDelayMs: z.number().optional(),
  enableVietnameseMode: z.boolean().optional(),
  enableAutoHandover: z.boolean().optional(),
  handoverTriggers: z
    .object({
      negativeSentiment: z.boolean().optional(),
      highPriority: z.boolean().optional(),
      longConversation: z.boolean().optional(),
      technicalIssue: z.boolean().optional(),
      customerRequestsHuman: z.boolean().optional(),
    })
    .optional(),
  handoverThresholds: z
    .object({
      sentimentThreshold: z.number().optional(),
      messageCountThreshold: z.number().optional(),
      conversationDurationThreshold: z.number().optional(),
    })
    .optional(),
  handoverTimeoutMinutes: z.number().optional(),
  enableGoogleIntegration: z.boolean().optional(),
  googleServices: z
    .object({
      calendar: z.boolean().optional(),
      gmail: z.boolean().optional(),
      sheets: z.boolean().optional(),
      drive: z.boolean().optional(),
      docs: z.boolean().optional(),
      forms: z.boolean().optional(),
    })
    .optional(),
  smartSchedulingDuration: z.number().optional(),
});

interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: string[];
  agents: Array<{
    name: string;
    status: 'success' | 'error';
    error?: string;
    id?: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileContent = await file.text();
    const fileName = file.name.toLowerCase();

    let agentsData: any[];

    try {
      if (fileName.endsWith('.json')) {
        agentsData = parseJsonFile(fileContent);
      } else if (fileName.endsWith('.csv')) {
        agentsData = parseCsvFile(fileContent);
      } else if (fileName.endsWith('.yaml') || fileName.endsWith('.yml')) {
        agentsData = parseYamlFile(fileContent);
      } else {
        return NextResponse.json(
          {
            error: 'Unsupported file format. Please use JSON, CSV, or YAML.',
          },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        {
          error:
            'Failed to parse file: ' + (error instanceof Error ? error.message : 'Unknown error'),
        },
        { status: 400 }
      );
    }

    const result: ImportResult = {
      success: true,
      imported: 0,
      failed: 0,
      errors: [],
      agents: [],
    };

    // Process each agent
    for (const agentData of agentsData) {
      try {
        // Validate agent data
        const validatedAgent = AgentImportSchema.parse(agentData);

        // Check if agent with same name already exists
        const existingAgent = await prisma.agent.findFirst({
          where: {
            name: validatedAgent.name,
            userId: session.user.id,
          },
        });

        if (existingAgent) {
          result.failed++;
          result.errors.push(`Agent "${validatedAgent.name}" already exists`);
          result.agents.push({
            name: validatedAgent.name,
            status: 'error',
            error: 'Agent with this name already exists',
          });
          continue;
        }

        // Create the agent
        const newAgent = await prisma.agent.create({
          data: {
            name: validatedAgent.name,
            description: validatedAgent.description,
            prompt: validatedAgent.prompt,
            model: validatedAgent.model,
            temperature: validatedAgent.temperature,
            maxTokens: validatedAgent.maxTokens,
            status: validatedAgent.status,
            isPublic: validatedAgent.isPublic,
            knowledgeFiles: validatedAgent.knowledgeFiles || [],
            userId: session.user.id,
            // Advanced settings
            messageDelayMs: validatedAgent.messageDelayMs,
            enableSmartDelay: validatedAgent.enableSmartDelay,
            maxDelayMs: validatedAgent.maxDelayMs,
            minDelayMs: validatedAgent.minDelayMs,
            enableVietnameseMode: validatedAgent.enableVietnameseMode,
            enableAutoHandover: validatedAgent.enableAutoHandover,
            handoverTriggers: validatedAgent.handoverTriggers || {},
            handoverThresholds: validatedAgent.handoverThresholds || {},
            handoverTimeoutMinutes: validatedAgent.handoverTimeoutMinutes,
            enableGoogleIntegration: validatedAgent.enableGoogleIntegration,
            googleServices: validatedAgent.googleServices || {},
            smartSchedulingDuration: validatedAgent.smartSchedulingDuration,
          },
        });

        result.imported++;
        result.agents.push({
          name: validatedAgent.name,
          status: 'success',
          id: newAgent.id,
        });
      } catch (error) {
        result.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Failed to import "${agentData.name || 'Unknown'}": ${errorMessage}`);
        result.agents.push({
          name: agentData.name || 'Unknown',
          status: 'error',
          error: errorMessage,
        });
      }
    }

    // Log the import operation
    await prisma.bulkOperation.create({
      data: {
        userId: session.user.id,
        operation: 'import',
        agentIds: result.agents.filter(a => a.status === 'success').map(a => a.id!),
        summary: {
          total: agentsData.length,
          successful: result.imported,
          failed: result.failed,
        },
        results: result.agents,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      {
        error: 'Failed to import agents',
      },
      { status: 500 }
    );
  }
}

function parseJsonFile(content: string): any[] {
  const data = JSON.parse(content);

  if (Array.isArray(data)) {
    return data;
  } else if (data.agents && Array.isArray(data.agents)) {
    return data.agents;
  } else if (typeof data === 'object') {
    return [data];
  } else {
    throw new Error(
      'Invalid JSON structure. Expected array of agents or object with agents property.'
    );
  }
}

function parseCsvFile(content: string): any[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row.');
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const agents: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const agent: any = {};

    headers.forEach((header, index) => {
      const value = values[index] || '';

      // Type conversion
      if (header === 'temperature' || header === 'sentimentThreshold') {
        agent[header] = parseFloat(value) || 0.7;
      } else if (
        header === 'maxTokens' ||
        header === 'messageDelayMs' ||
        header === 'maxDelayMs' ||
        header === 'minDelayMs' ||
        header === 'handoverTimeoutMinutes' ||
        header === 'messageCountThreshold' ||
        header === 'conversationDurationThreshold' ||
        header === 'smartSchedulingDuration'
      ) {
        agent[header] = parseInt(value) || undefined;
      } else if (
        header === 'isPublic' ||
        header === 'enableSmartDelay' ||
        header === 'enableVietnameseMode' ||
        header === 'enableAutoHandover' ||
        header === 'enableGoogleIntegration'
      ) {
        agent[header] = value.toLowerCase() === 'true';
      } else if (header === 'knowledgeFiles' || header === 'tags') {
        agent[header] = value ? value.split(';').map(item => item.trim()) : [];
      } else if (header.includes('.')) {
        // Handle nested objects (e.g., handoverTriggers.negativeSentiment)
        const parts = header.split('.');
        if (parts.length === 2) {
          if (!agent[parts[0]]) agent[parts[0]] = {};
          agent[parts[0]][parts[1]] = value.toLowerCase() === 'true';
        }
      } else {
        agent[header] = value;
      }
    });

    agents.push(agent);
  }

  return agents;
}

function parseYamlFile(content: string): any[] {
  // Simple YAML parser for basic structures
  // In production, you'd want to use a proper YAML library like js-yaml
  try {
    const lines = content.trim().split('\n');
    const agents: any[] = [];
    let currentAgent: any = {};
    let inAgentBlock = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('- name:') || trimmed.startsWith('name:')) {
        if (inAgentBlock && Object.keys(currentAgent).length > 0) {
          agents.push(currentAgent);
        }
        currentAgent = {};
        inAgentBlock = true;
        const name = trimmed.replace(/^-?\s*name:\s*/, '').replace(/"/g, '');
        currentAgent.name = name;
      } else if (inAgentBlock && trimmed.includes(':')) {
        const [key, ...valueParts] = trimmed.split(':');
        const value = valueParts.join(':').trim().replace(/"/g, '');

        if (key === 'temperature' || key === 'sentimentThreshold') {
          currentAgent[key] = parseFloat(value) || 0.7;
        } else if (key === 'maxTokens' || key === 'messageDelayMs') {
          currentAgent[key] = parseInt(value) || undefined;
        } else if (key === 'isPublic' || key === 'enableSmartDelay') {
          currentAgent[key] = value.toLowerCase() === 'true';
        } else if (key === 'knowledgeFiles' || key === 'tags') {
          currentAgent[key] = value ? value.split(',').map(item => item.trim()) : [];
        } else {
          currentAgent[key] = value;
        }
      }
    }

    if (inAgentBlock && Object.keys(currentAgent).length > 0) {
      agents.push(currentAgent);
    }

    return agents;
  } catch (error) {
    throw new Error('Failed to parse YAML file. Please check the format.');
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return import template/example
    const template = {
      agents: [
        {
          name: 'Example Agent',
          description: 'An example agent for demonstration',
          prompt: 'You are a helpful AI assistant.',
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 1000,
          status: 'INACTIVE',
          isPublic: false,
          category: 'general',
          tags: ['example', 'demo'],
          knowledgeFiles: [],
          messageDelayMs: 2000,
          enableSmartDelay: true,
          maxDelayMs: 8000,
          minDelayMs: 500,
          enableVietnameseMode: false,
          enableAutoHandover: false,
          handoverTriggers: {
            negativeSentiment: false,
            highPriority: false,
            longConversation: false,
            technicalIssue: false,
            customerRequestsHuman: false,
          },
          handoverThresholds: {
            sentimentThreshold: 0.5,
            messageCountThreshold: 10,
            conversationDurationThreshold: 300,
          },
          handoverTimeoutMinutes: 5,
          enableGoogleIntegration: false,
          googleServices: {
            calendar: false,
            gmail: false,
            sheets: false,
            drive: false,
            docs: false,
            forms: false,
          },
          smartSchedulingDuration: 60,
        },
      ],
    };

    return NextResponse.json({
      success: true,
      template,
      supportedFormats: ['json', 'csv', 'yaml'],
      documentation: {
        json: 'Upload a JSON file with an array of agent objects or an object with an "agents" property',
        csv: 'Upload a CSV file with headers matching agent properties. Use semicolons to separate array values.',
        yaml: 'Upload a YAML file with agent configurations. Each agent should start with "- name:" or "name:"',
      },
    });
  } catch (error) {
    console.error('Error getting import template:', error);
    return NextResponse.json(
      {
        error: 'Failed to get import template',
      },
      { status: 500 }
    );
  }
}
