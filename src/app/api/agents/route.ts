import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { successResponse, commonErrors } from '@/lib/api-response-standard';

const prisma = new PrismaClient();

// GET /api/agents - L?y danh s�ch agents
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const agents = await prisma.agent.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        conversations: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            conversations: true,
          },
        },
      },
    });

    // Parse knowledge files and Google services for each agent
    const agentsWithKnowledge = agents.map(agent => ({
      ...agent,
      knowledgeFiles: agent.knowledgeFiles ? JSON.parse(agent.knowledgeFiles) : [],
      googleServices: agent.googleServices
        ? JSON.parse(agent.googleServices)
        : {
            calendar: false,
            gmail: false,
            sheets: false,
            drive: false,
            docs: false,
            forms: false,
          },
    }));

    return NextResponse.json(agentsWithKnowledge);
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/agents - T?o agent m?i
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      name,
      description,
      prompt,
      model,
      temperature,
      maxTokens,
      knowledgeFiles,
      isPublic,
      // 🧠 DAY 23: Smart Knowledge Strategy
      knowledgeStrategy,
      knowledgeStrategyConfig,
      // Delay settings
      messageDelayMs,
      enableSmartDelay,
      maxDelayMs,
      minDelayMs,
      enableVietnameseMode,
      // Auto handover settings
      enableAutoHandover,
      handoverTriggers,
      handoverThresholds,
      // Google Integration settings
      enableGoogleIntegration,
      googleServices,
    } = body;

    // Validate required fields
    if (!name || !prompt || !model) {
      return NextResponse.json(
        {
          error: 'Name, prompt, and model are required',
        },
        { status: 400 }
      );
    }

    // Validate delay settings
    const finalMessageDelay = messageDelayMs || 2000; // Default 2 seconds
    const finalMaxDelay = maxDelayMs || 8000; // Default 8 seconds
    const finalMinDelay = minDelayMs || 500; // Default 0.5 seconds

    if (finalMinDelay > finalMessageDelay || finalMessageDelay > finalMaxDelay) {
      return NextResponse.json(
        {
          error: 'Invalid delay settings: minDelay <= messageDelay <= maxDelay',
        },
        { status: 400 }
      );
    }

    // Validate model exists in user's API keys
    const userApiKeys = await prisma.userApiKey.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
    });

    let modelValid = false;
    for (const apiKey of userApiKeys) {
      if (apiKey.models) {
        const availableModels = JSON.parse(apiKey.models);
        if (availableModels.includes(model)) {
          modelValid = true;
          break;
        }
      }
    }

    if (!modelValid) {
      return NextResponse.json(
        {
          error: 'Selected model is not available in your API keys',
        },
        { status: 400 }
      );
    }

    // Validate knowledge files exist and belong to user
    if (knowledgeFiles && knowledgeFiles.length > 0) {
      const documents = await prisma.document.findMany({
        where: {
          id: { in: knowledgeFiles },
          userId: user.id,
          status: 'PROCESSED',
        },
      });

      if (documents.length !== knowledgeFiles.length) {
        return NextResponse.json(
          {
            error: 'Some knowledge files are invalid or not processed',
          },
          { status: 400 }
        );
      }
    }

    const agent = await prisma.agent.create({
      data: {
        name,
        description,
        prompt,
        model,
        temperature: temperature || 0.7,
        maxTokens: maxTokens || 1000,
        knowledgeFiles: JSON.stringify(knowledgeFiles || []),
        isPublic: isPublic || false,
        // 🧠 DAY 23: Smart Knowledge Strategy
        knowledgeStrategy: knowledgeStrategy || 'AUTO',
        knowledgeStrategyConfig: JSON.stringify(knowledgeStrategyConfig || {}),
        knowledgeFilePriorities: knowledgeStrategyConfig?.priorityWeights
          ? JSON.stringify(knowledgeStrategyConfig.priorityWeights)
          : '{}',
        autoStrategySettings: JSON.stringify({
          autoFallbackEnabled: knowledgeStrategyConfig?.autoFallbackEnabled || true,
          autoRelevanceThreshold: knowledgeStrategyConfig?.autoRelevanceThreshold || 0.7,
          autoMaxDocuments: knowledgeStrategyConfig?.autoMaxDocuments || 5,
        }),
        // Message delay settings
        messageDelayMs: finalMessageDelay,
        enableSmartDelay: enableSmartDelay !== undefined ? enableSmartDelay : true,
        maxDelayMs: finalMaxDelay,
        minDelayMs: finalMinDelay,
        enableVietnameseMode: enableVietnameseMode !== undefined ? enableVietnameseMode : true,
        // Google Integration settings
        enableGoogleIntegration: enableGoogleIntegration || false,
        googleServices: googleServices ? JSON.stringify(googleServices) : null,
        userId: user.id,
      },
      include: {
        _count: {
          select: {
            conversations: true,
          },
        },
      },
    });

    // Parse knowledge files and Google services for response
    const agentWithKnowledge = {
      ...agent,
      knowledgeFiles: agent.knowledgeFiles ? JSON.parse(agent.knowledgeFiles) : [],
      googleServices: agent.googleServices
        ? JSON.parse(agent.googleServices)
        : {
            calendar: false,
            gmail: false,
            sheets: false,
            drive: false,
            docs: false,
            forms: false,
          },
    };

    return NextResponse.json(agentWithKnowledge, { status: 201 });
  } catch (error) {
    console.error('Error creating agent:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
