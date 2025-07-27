/**
 * 🎯 Smart Switch Chat API - DAY 20 Implementation
 *
 * Advanced chat endpoint with intelligent model switching
 * Features:
 * - Dynamic provider selection based on context
 * - Cost optimization and tracking
 * - Performance monitoring and A/B testing
 * - Real-time optimization recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { modelSwitchingOrchestrator } from '@/lib/model-switching-orchestrator';
import type {
  ModelSwitchingRequest,
  ModelSwitchingResponse,
} from '@/lib/model-switching-orchestrator';
import type { ProviderType } from '@/lib/providers/IModelProvider';

interface SmartSwitchChatRequest {
  message: string;
  conversationId?: string;

  // Context preferences
  messageComplexity?: 'simple' | 'medium' | 'complex' | 'expert';
  qualityPriority?: 'cost' | 'speed' | 'quality' | 'balanced';

  // Requirements
  maxResponseTime?: number; // milliseconds
  maxCostPerMessage?: number; // dollars

  // Optional preferences
  preferredProvider?: ProviderType;
  preferredModel?: string;

  // Feature requirements
  requiresStreaming?: boolean;
  requiresFunctionCalling?: boolean;
  requiresVision?: boolean;
  requiresLongContext?: boolean;

  // System options
  enableOptimization?: boolean;
  enableABTesting?: boolean;

  // Metadata
  metadata?: Record<string, any>;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    console.log('🎯 Smart Switch Chat API called for agent:', id);

    // Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    const agentId = id;

    // Parse request body
    const body: SmartSwitchChatRequest = await request.json();
    const {
      message,
      conversationId,
      messageComplexity,
      qualityPriority = 'balanced',
      maxResponseTime,
      maxCostPerMessage,
      preferredProvider,
      preferredModel,
      requiresStreaming = false,
      requiresFunctionCalling = false,
      requiresVision = false,
      requiresLongContext = false,
      enableOptimization = true,
      enableABTesting = true,
      metadata = {},
    } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Verify agent exists and user has access
    const agent = await prisma.agent.findFirst({
      where: {
        id: agentId,
        userId: userId,
      },
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found or access denied' }, { status: 404 });
    }

    console.log(`🚀 Processing smart switch chat for agent: ${agent.name}`);

    // Get conversation history
    let conversationHistory: Array<{
      role: 'user' | 'assistant';
      content: string;
      provider?: string;
      model?: string;
    }> = [];

    if (conversationId) {
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          userId: userId,
          agentId: agentId,
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 10, // Last 10 messages for context
          },
        },
      });

      if (conversation) {
        conversationHistory = conversation.messages.map(msg => ({
          role: msg.role.toLowerCase() as 'user' | 'assistant',
          content: msg.content,
          provider: msg.metadata ? (msg.metadata as any).provider : undefined,
          model: msg.metadata ? (msg.metadata as any).model : undefined,
        }));
      }
    }

    // Build system prompt
    let systemPrompt = agent.prompt || 'You are a helpful AI assistant.';

    // Add agent description if available
    if (agent.description) {
      systemPrompt += `\n\nAgent Description: ${agent.description}`;
    }

    // TODO: Add knowledge base context if enabled
    // This would integrate with RAG system

    // Prepare model switching request
    const switchingRequest: ModelSwitchingRequest = {
      message,
      userId,
      agentId,
      conversationId: conversationId || `conv_${Date.now()}`,
      messageComplexity: messageComplexity || analyzeMessageComplexity(message),
      conversationHistory,
      maxResponseTime: maxResponseTime || agent.responseTimeoutMs || 30000,
      maxCostPerMessage: maxCostPerMessage || 0.01, // Default $0.01 max
      qualityPriority,
      preferredProvider,
      preferredModel: preferredModel || agent.model,
      requiresStreaming,
      requiresFunctionCalling,
      requiresVision,
      requiresLongContext,
      systemPrompt,
      metadata: {
        ...metadata,
        enableOptimization,
        enableABTesting,
        agentName: agent.name,
        userAgent: request.headers.get('user-agent'),
      },
    };

    // Process with model switching orchestrator
    const switchingResponse: ModelSwitchingResponse =
      await modelSwitchingOrchestrator.processRequest(switchingRequest);

    if (!switchingResponse.success) {
      return NextResponse.json(
        {
          error: 'Chat processing failed',
          details: switchingResponse.error,
          selectedProvider: switchingResponse.selectedProvider,
          selectedModel: switchingResponse.selectedModel,
        },
        { status: 500 }
      );
    }

    // Create or update conversation
    let conversation = null;
    if (conversationId) {
      conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, userId, agentId },
      });
    }

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          id: switchingResponse.conversationId,
          userId,
          agentId,
          title: message.substring(0, 50) + '...',
        },
      });
    }

    // Save user message
    const userMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message,
        tokens: 0,
        cost: 0,
        metadata: {
          requestMetadata: metadata,
        },
      },
    });

    // Save assistant message
    const assistantMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: switchingResponse.message!,
        tokens: switchingResponse.tokensUsed,
        cost: switchingResponse.cost,
        metadata: {
          provider: switchingResponse.selectedProvider,
          model: switchingResponse.selectedModel,
          responseTime: switchingResponse.responseTime,
          qualityScore: switchingResponse.qualityScore,
          selectionReason: switchingResponse.selectionReason,
          selectionConfidence: switchingResponse.selectionConfidence,
          alternatives: switchingResponse.alternatives,
          abTestInfo: switchingResponse.abTestInfo,
          processingMetadata: switchingResponse.metadata,
        },
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    // Prepare enhanced response
    const response = {
      success: true,

      // Message data
      message: {
        id: assistantMessage.id,
        role: 'assistant',
        content: switchingResponse.message!,
        createdAt: assistantMessage.createdAt,
      },

      // Conversation data
      conversation: {
        id: conversation.id,
        title: conversation.title,
      },

      // Provider & model info
      provider: {
        selected: switchingResponse.selectedProvider,
        model: switchingResponse.selectedModel,
        reason: switchingResponse.selectionReason,
        confidence: switchingResponse.selectionConfidence,
        alternatives: switchingResponse.alternatives,
      },

      // Performance metrics
      performance: {
        responseTime: switchingResponse.responseTime,
        tokensUsed: switchingResponse.tokensUsed,
        qualityScore: switchingResponse.qualityScore,
        selectionTime: switchingResponse.metadata.selectionTime,
        processingTime: switchingResponse.metadata.processingTime,
        totalTime: switchingResponse.metadata.totalTime,
      },

      // Cost information
      cost: {
        current: switchingResponse.cost,
        optimization: switchingResponse.costOptimization,
      },

      // A/B testing info
      abTest: switchingResponse.abTestInfo,

      // Usage information (for compatibility)
      usage: {
        tokens: switchingResponse.tokensUsed,
        cost: switchingResponse.cost,
      },

      // System metadata
      system: {
        cacheHit: switchingResponse.metadata.cacheHit,
        fallbackUsed: switchingResponse.metadata.fallbackUsed,
        optimizationEnabled: enableOptimization,
        abTestingEnabled: enableABTesting,
      },
    };

    console.log(
      `✅ Smart switch chat completed: ${switchingResponse.selectedProvider}:${switchingResponse.selectedModel}, ${switchingResponse.responseTime}ms, $${switchingResponse.cost.toFixed(6)}`
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error('Smart Switch Chat API error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Optimization Insights & Analytics
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const agentId = id;
    const userId = session.user.id;

    // Parse query parameters
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '30');
    const includeInsights = url.searchParams.get('insights') === 'true';

    // Verify agent access
    const agent = await prisma.agent.findFirst({
      where: {
        id: agentId,
        userId: userId,
      },
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Get basic analytics
    const basicAnalytics = {
      agentId,
      agentName: agent.name,

      // Request history
      requestHistory: modelSwitchingOrchestrator.getRequestHistory(userId, agentId).slice(-50), // Last 50 requests

      // System status
      status: {
        optimizationEnabled: true,
        abTestingEnabled: true,
        multiProviderEnabled: true,
        fallbackEnabled: true,
      },
    };

    // Get detailed insights if requested
    let insights = null;
    if (includeInsights) {
      try {
        insights = await modelSwitchingOrchestrator.getOptimizationInsights(userId, agentId, days);
      } catch (error) {
        console.warn('Failed to get optimization insights:', error);
      }
    }

    return NextResponse.json({
      ...basicAnalytics,
      insights,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Smart switch analytics error:', error);
    return NextResponse.json(
      {
        error: 'Analytics failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function to analyze message complexity
 */
function analyzeMessageComplexity(message: string): 'simple' | 'medium' | 'complex' | 'expert' {
  const length = message.length;

  // Keywords that indicate complexity
  const complexKeywords = [
    'analyze',
    'explain',
    'compare',
    'evaluate',
    'synthesize',
    'research',
    'algorithm',
    'implementation',
    'architecture',
    'strategy',
    'methodology',
  ];

  const expertKeywords = [
    'optimize',
    'refactor',
    'debug',
    'performance',
    'scalability',
    'security',
    'design pattern',
    'best practice',
    'trade-off',
    'technical debt',
  ];

  const messageLower = message.toLowerCase();

  // Check for expert-level keywords
  if (expertKeywords.some(keyword => messageLower.includes(keyword))) {
    return 'expert';
  }

  // Check for complex keywords
  if (complexKeywords.some(keyword => messageLower.includes(keyword))) {
    return 'complex';
  }

  // Length-based classification
  if (length > 500) {
    return 'complex';
  } else if (length > 200) {
    return 'medium';
  } else {
    return 'simple';
  }
}
