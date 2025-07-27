import { NextRequest, NextResponse } from 'next/server';
// ✅ FIXED Phase 4D True Fix - Fix getServerSession import for next-auth v4
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params;

    const agent = await prisma.agent.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        conversations: {
          orderBy: { createdAt: 'desc' },
          include: {
            messages: {
              orderBy: { createdAt: 'asc' },
              take: 1,
            },
            _count: {
              select: {
                messages: true,
              },
            },
          },
        },
        _count: {
          select: {
            conversations: true,
          },
        },
      },
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Parse knowledge files
    const agentWithKnowledge = {
      ...agent,
      knowledgeFiles: agent.knowledgeFiles ? JSON.parse(agent.knowledgeFiles as string) : [],
    };

    return NextResponse.json(agentWithKnowledge);
  } catch (error) {
    console.error('Error fetching agent:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params;
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
      status,
      // Message delay settings
      messageDelayMs,
      enableSmartDelay,
      maxDelayMs,
      minDelayMs,
      enableVietnameseMode,
    } = body;

    // Verify agent belongs to user
    const existingAgent = await prisma.agent.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingAgent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Validate delay settings if provided
    if (messageDelayMs !== undefined || maxDelayMs !== undefined || minDelayMs !== undefined) {
      const finalMessageDelay = messageDelayMs || existingAgent.messageDelayMs || 2000;
      const finalMaxDelay = maxDelayMs || existingAgent.maxDelayMs || 8000;
      const finalMinDelay = minDelayMs || existingAgent.minDelayMs || 500;

      if (finalMinDelay > finalMessageDelay || finalMessageDelay > finalMaxDelay) {
        return NextResponse.json(
          {
            error: 'Invalid delay settings: minDelay <= messageDelay <= maxDelay',
          },
          { status: 400 }
        );
      }
    }

    // Validate model if provided
    if (model) {
      const userApiKeys = await prisma.userApiKey.findMany({
        where: {
          userId: user.id,
          isActive: true,
        },
      });

      let modelValid = false;
      for (const apiKey of userApiKeys) {
        if (apiKey.models) {
          const availableModels = JSON.parse(apiKey.models as string);
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
    }

    // Validate knowledge files if provided
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

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (prompt !== undefined) updateData.prompt = prompt;
    if (model !== undefined) updateData.model = model;
    if (temperature !== undefined) updateData.temperature = temperature;
    if (maxTokens !== undefined) updateData.maxTokens = maxTokens;
    if (knowledgeFiles !== undefined) updateData.knowledgeFiles = JSON.stringify(knowledgeFiles);
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (status !== undefined) updateData.status = status;

    // Add delay settings to update data
    if (messageDelayMs !== undefined) updateData.messageDelayMs = messageDelayMs;
    if (enableSmartDelay !== undefined) updateData.enableSmartDelay = enableSmartDelay;
    if (maxDelayMs !== undefined) updateData.maxDelayMs = maxDelayMs;
    if (minDelayMs !== undefined) updateData.minDelayMs = minDelayMs;
    if (enableVietnameseMode !== undefined) updateData.enableVietnameseMode = enableVietnameseMode;

    const agent = await prisma.agent.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            conversations: true,
          },
        },
      },
    });

    // Parse knowledge files for response
    const agentWithKnowledge = {
      ...agent,
      knowledgeFiles: agent.knowledgeFiles ? JSON.parse(agent.knowledgeFiles as string) : [],
    };

    return NextResponse.json(agentWithKnowledge);
  } catch (error) {
    console.error('Error updating agent:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params;

    // Verify agent belongs to user
    const existingAgent = await prisma.agent.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingAgent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    await prisma.agent.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Agent deleted successfully' });
  } catch (error) {
    console.error('Error deleting agent:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
