/**
 * 🤖 Multi-Provider Chat API - Day 20 Step 20.2
 * Chat endpoint with intelligent runtime provider selection
 */

import { NextRequest, NextResponse } from 'next/server';
// ✅ FIXED Phase 4D True Fix - Fix getServerSession import for next-auth v4
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RuntimeProviderSelector, SelectionContext } from '@/lib/runtime-provider-selector';
import { AgentProviderConfigService } from '@/lib/agent-provider-config';

interface MultiProviderChatRequest {
  message: string;
  conversationId?: string;

  // Provider preferences
  forceProvider?: string;
  forceModel?: string;

  // Request context
  messageComplexity?: 'simple' | 'medium' | 'complex';
  maxCostPerMessage?: number;
  maxResponseTime?: number;
  requiresCapabilities?: string[];

  // Performance settings
  enableFailover?: boolean;
  enableCostOptimization?: boolean;
  enablePerformanceOptimization?: boolean;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    console.log('🤖 Multi-Provider Chat API called for agent:', id);

    // Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    const agentId = id;

    // Parse request
    const body: MultiProviderChatRequest = await request.json();
    const {
      message,
      conversationId,
      forceProvider,
      forceModel,
      messageComplexity = 'medium',
      maxCostPerMessage,
      maxResponseTime,
      requiresCapabilities,
      enableFailover = true,
      enableCostOptimization = false,
      enablePerformanceOptimization = true,
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

    console.log(`🚀 Processing multi-provider chat for agent: ${agent.name}`);

    // Get conversation history for context
    const conversationHistory = conversationId ? await getConversationHistory(conversationId) : [];

    // Analyze message complexity automatically if not provided
    const analyzedComplexity = messageComplexity || analyzeMessageComplexity(message);

    // Build selection context
    const selectionContext: SelectionContext = {
      agentId,
      userId,
      conversationId,
      messageCount: conversationHistory.length,
      messageComplexity: analyzedComplexity,
      messageLength: message.length,
      requiresSpecialCapabilities: requiresCapabilities,
      maxResponseTime: maxResponseTime || agent.responseTimeoutMs || 30000,
      maxCostPerMessage,
      conversationHistory: conversationHistory.map(msg => ({
        provider: msg.provider || 'unknown',
        model: msg.model || 'unknown',
        responseTime: msg.responseTime || 3000,
        cost: msg.cost || 0.001,
        success: true,
      })),
    };

    // Get provider selector
    const providerSelector = RuntimeProviderSelector.getInstance();

    // Select optimal provider
    const selection = await providerSelector.selectProviderForChat(selectionContext, forceProvider);

    console.log(
      `🎯 Selected provider: ${selection.provider}:${selection.model} (${selection.reason})`
    );

    // Prepare chat request
    const chatRequest = {
      messages: [
        {
          role: 'system' as const,
          content: buildSystemPrompt(agent, message),
        },
        {
          role: 'user' as const,
          content: message,
        },
      ],
      model: forceModel || selection.model,
      temperature: agent.temperature || 0.7,
      maxTokens: agent.maxTokens || 2000,
    };

    // Execute chat with selected provider
    const startTime = Date.now();
    const response = await providerSelector.executeChatWithSelection(
      selection,
      chatRequest,
      selectionContext
    );

    const totalTime = Date.now() - startTime;

    // Save conversation if ID provided
    let conversationRecord = null;
    if (conversationId) {
      conversationRecord = await saveConversation(
        conversationId,
        userId,
        agentId,
        message,
        response.content,
        selection.provider,
        selection.model,
        response.metrics
      );
    }

    // Prepare response with detailed metadata
    const enhancedResponse = {
      success: true,
      message: response.content,
      conversationId: conversationId || `conv_${Date.now()}`,

      // Provider information
      provider: {
        selected: selection.provider,
        model: selection.model,
        reason: selection.reason,
        confidence: selection.confidence,
        fallbacks: selection.fallbacks,
      },

      // Performance metrics
      performance: {
        responseTime: totalTime,
        tokensUsed: response.usage.totalTokens,
        promptTokens: response.usage.promptTokens,
        completionTokens: response.usage.completionTokens,
        estimatedCost: response.cost || selection.estimatedCost,
        actualCost: response.cost || 0,
      },

      // Quality metrics
      quality: {
        finishReason: response.finishReason,
        qualityScore: response.metrics?.qualityScore || 0.8,
        confidence: selection.confidence,
      },

      // Selection analytics
      selection: {
        alternatives: selection.fallbacks.length,
        selectionTime: response.metrics?.selectionTime || 10,
        capabilities: selection.capabilities,
        costOptimized: enableCostOptimization,
        performanceOptimized: enablePerformanceOptimization,
      },

      // Conversation context
      conversation: conversationRecord
        ? {
            id: conversationRecord.id,
            messageCount: conversationHistory.length + 1,
            totalCost: calculateTotalConversationCost(conversationHistory, response.cost || 0),
          }
        : undefined,

      // Debug information (development only)
      debug:
        process.env.NODE_ENV === 'development'
          ? {
              selectionContext,
              allCandidates: selection.fallbacks,
              analysisTime: response.metrics?.analysisTime || 0,
            }
          : undefined,
    };

    console.log(
      `✅ Multi-provider chat completed: ${selection.provider}:${selection.model}, ${totalTime}ms, $${(response.cost || 0).toFixed(6)}`
    );

    return NextResponse.json(enhancedResponse);
  } catch (error) {
    console.error('Multi-Provider Chat API error:', error);

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
 * GET - Provider Health Check & Analytics
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

    // Get services
    const configService = AgentProviderConfigService.getInstance();
    const providerSelector = RuntimeProviderSelector.getInstance();

    // Get agent provider configuration
    const config = await configService.getAgentProviderConfig(agentId);

    // Get provider health
    const health = await configService.healthCheckAgentProviders(agentId);

    // Get performance metrics
    const metrics = configService.getAgentProviderMetrics(agentId);

    // Get selection analytics
    const analytics = providerSelector.getSelectionAnalytics(agentId);

    // Get switch history
    const switchHistory = configService.getAgentSwitchHistory(agentId, 10);

    return NextResponse.json({
      agentId,
      agentName: agent.name,

      // Configuration
      configuration: {
        primaryProvider: config?.primaryProvider || agent.modelProvider,
        primaryModel: config?.primaryModel || agent.model,
        multiModelSupport:
          config?.performanceSettings?.enableLoadBalancing || agent.multiModelSupport,
        fallbackProviders: config?.fallbackProviders || [],
        costSettings: config?.costSettings,
      },

      // Health status
      health: {
        overall: Object.values(health).every(h => h.status === 'healthy') ? 'healthy' : 'degraded',
        providers: health,
      },

      // Performance metrics
      performance: {
        totalProviders: metrics.length,
        metrics: metrics.map(m => ({
          provider: m.provider,
          model: m.model,
          averageResponseTime: m.averageResponseTime,
          successRate:
            m.totalRequests > 0 ? ((m.successfulRequests / m.totalRequests) * 100).toFixed(1) : '0',
          totalCost: m.totalCost,
          status: m.currentStatus,
        })),
      },

      // Usage analytics
      analytics: {
        selectionAnalytics: analytics,
        recentSwitches: switchHistory.length,
        lastSwitch: switchHistory[0]?.timestamp,
      },

      // Recent activity
      recent: {
        switches: switchHistory.slice(0, 5),
        lastUsed:
          metrics.length > 0 ? Math.max(...metrics.map(m => new Date(m.lastUsed).getTime())) : null,
      },

      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Multi-Provider health check error:', error);
    return NextResponse.json(
      {
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Helper functions
 */

function analyzeMessageComplexity(message: string): 'simple' | 'medium' | 'complex' {
  const length = message.length;
  const words = message.split(' ').length;
  const complexity = (message.match(/[?!]/g) || []).length;

  if (length < 50 && words < 10 && complexity === 0) {
    return 'simple';
  } else if (length > 500 || words > 100 || complexity > 3) {
    return 'complex';
  } else {
    return 'medium';
  }
}

/**
 * Helper Functions
 */

/**
 * Get conversation history
 */
async function getConversationHistory(conversationId: string): Promise<any[]> {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 20, // Last 20 messages
        },
      },
    });

    return conversation?.messages || [];
  } catch (error) {
    console.error('Error fetching conversation history:', error);
    return [];
  }
}

/**
 * Build system prompt
 */
function buildSystemPrompt(agent: any, message: string): string {
  let systemPrompt = agent.prompt || 'You are a helpful AI assistant.';

  // Add agent description if available
  if (agent.description) {
    systemPrompt += `\n\nAgent Description: ${agent.description}`;
  }

  // Add any specific instructions based on message
  if (message.includes('schedule') || message.includes('calendar')) {
    systemPrompt += '\n\nNote: You can help with scheduling and calendar management.';
  }

  return systemPrompt;
}

/**
 * Save conversation
 */
async function saveConversation(
  conversationId: string,
  userId: string,
  agentId: string,
  userMessage: string,
  aiResponse: string,
  provider: string,
  model: string,
  metrics: any
): Promise<any> {
  try {
    // Create or update conversation
    const conversation = await prisma.conversation.upsert({
      where: { id: conversationId },
      create: {
        id: conversationId,
        userId,
        agentId,
        title: userMessage.substring(0, 50) + '...',
      },
      update: {
        updatedAt: new Date(),
      },
    });

    // Create user message
    await prisma.message.create({
      data: {
        role: 'user',
        content: userMessage,
        conversationId: conversation.id,
      },
    });

    // Create assistant message
    const assistantMessage = await prisma.message.create({
      data: {
        role: 'assistant',
        content: aiResponse,
        conversationId: conversation.id,
        tokens: metrics?.tokensUsed || 0,
        cost: metrics?.cost || 0,
      },
    });

    return {
      id: conversation.id,
      messageId: assistantMessage.id,
    };
  } catch (error) {
    console.error('Error saving conversation:', error);
    return null;
  }
}

/**
 * Calculate total conversation cost
 */
function calculateTotalConversationCost(history: any[], currentCost: number): number {
  const historyCost = history.reduce((total, msg) => total + (msg.cost || 0), 0);
  return historyCost + currentCost;
}
