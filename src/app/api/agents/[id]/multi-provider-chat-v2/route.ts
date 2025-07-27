/**
 * 🤖 Multi-Provider Chat API v2 - DAY 19 Implementation
 *
 * Enhanced chat endpoint using the new Multi-Provider Chat Service
 * Provides seamless provider switching and improved error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { multiProviderChatService } from '@/lib/multi-provider-chat-service';
import type { MultiProviderChatRequest } from '@/lib/multi-provider-chat-service';

interface ChatAPIRequest {
  message: string;
  conversationId?: string;

  // Provider preferences
  preferredProvider?: 'openai' | 'anthropic' | 'google';
  model?: string;

  // Chat parameters
  temperature?: number;
  maxTokens?: number;

  // Context options
  includeKnowledgeBase?: boolean;
  useAdvancedRAG?: boolean;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    console.log('🤖 Multi-Provider Chat API v2 called for agent:', id);

    // Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    const agentId = id;

    // Parse request body
    const body: ChatAPIRequest = await request.json();
    const {
      message,
      conversationId,
      preferredProvider,
      model,
      temperature,
      maxTokens,
      includeKnowledgeBase = true,
      useAdvancedRAG = true,
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

    console.log(`🚀 Processing chat for agent: ${agent.name}`);

    // Get or create conversation
    let conversation = null;
    if (conversationId) {
      conversation = await prisma.conversation.findFirst({
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
    }

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          id: conversationId || `conv_${Date.now()}`,
          userId: userId,
          agentId: agentId,
          title: message.substring(0, 50) + '...',
        },
        include: {
          messages: true,
        },
      });
    }

    // Build system prompt
    let systemPrompt = agent.prompt || 'You are a helpful AI assistant.';

    // Add agent description if available
    if (agent.description) {
      systemPrompt += `\n\nAgent Description: ${agent.description}`;
    }

    // Add knowledge base context if enabled
    if (includeKnowledgeBase) {
      try {
        // ✅ RAG Service Integration - Day 2.1
        const { agentRAGService } = await import('@/lib/agent-rag-service');

        console.log(`🧠 Performing RAG operation for agent ${agent.id}`);

        const ragResult = await agentRAGService.performRAGOperation(agent.id, userId, message);

        if (ragResult.success && ragResult.hasContext && ragResult.contextAssembly) {
          // Use the enhanced RAG context
          const knowledgeContext = ragResult.contextAssembly.systemPromptContext;
          systemPrompt += `\n\nRELEVANT KNOWLEDGE:\n${knowledgeContext}`;

          console.log(
            `✅ RAG context integrated: ${ragResult.contextAssembly.totalSources} sources, ${ragResult.contextAssembly.totalTokens} tokens`
          );
        } else {
          // Fallback to placeholder
          systemPrompt +=
            '\n\nYou have access to a knowledge base. Use it to provide accurate and contextual responses.';
          console.log(`⚠️ No RAG context available, using fallback`);
        }
      } catch (ragError) {
        console.warn('RAG integration failed:', ragError);
        // Fallback to placeholder
        systemPrompt +=
          '\n\nYou have access to a knowledge base. Use it to provide accurate and contextual responses.';
      }
    }

    // Prepare multi-provider chat request
    const chatRequest: MultiProviderChatRequest = {
      message,
      messages: conversation.messages.map(msg => ({
        role: msg.role.toLowerCase() as 'user' | 'assistant',
        content: msg.content,
      })),
      preferredProvider,
      model: model || agent.model,
      temperature: temperature || agent.temperature || 0.7,
      maxTokens: maxTokens || agent.maxTokens || 1000,
      agentId,
      userId,
      systemPrompt,
    };

    // Process chat using multi-provider service
    const chatResponse = await multiProviderChatService.processChat(chatRequest);

    if (!chatResponse.success) {
      return NextResponse.json(
        {
          error: 'Chat processing failed',
          details: chatResponse.error,
          usedProvider: chatResponse.usedProvider,
          fallbackUsed: chatResponse.fallbackUsed,
        },
        { status: 500 }
      );
    }

    // Save user message
    const userMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message,
        tokens: 0,
        cost: 0,
      },
    });

    // Save assistant message
    const assistantMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: chatResponse.message!,
        tokens: chatResponse.tokensUsed,
        cost: chatResponse.estimatedCost,
        // Store provider info in metadata
        metadata: JSON.stringify({
          provider: chatResponse.usedProvider,
          model: chatResponse.usedModel,
          responseTime: chatResponse.responseTime,
          fallbackUsed: chatResponse.fallbackUsed,
        }),
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    // Prepare response
    const response = {
      success: true,
      message: {
        id: assistantMessage.id,
        role: 'assistant',
        content: chatResponse.message!,
        createdAt: assistantMessage.createdAt,
      },
      conversation: {
        id: conversation.id,
        title: conversation.title,
      },

      // Provider information
      provider: {
        used: chatResponse.usedProvider,
        model: chatResponse.usedModel,
        fallbackUsed: chatResponse.fallbackUsed,
      },

      // Performance metrics
      performance: {
        responseTime: chatResponse.responseTime,
        tokensUsed: chatResponse.tokensUsed,
        estimatedCost: chatResponse.estimatedCost,
      },

      // Usage information
      usage: {
        tokens: chatResponse.tokensUsed,
        cost: chatResponse.estimatedCost,
      },
    };

    console.log(
      `✅ Chat completed: ${chatResponse.usedProvider}:${chatResponse.usedModel}, ${chatResponse.responseTime}ms, $${chatResponse.estimatedCost.toFixed(6)}`
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error('Multi-Provider Chat API v2 error:', error);

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
 * GET - Provider Status & Health Check
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

    // Get provider health status
    const providersHealth = await multiProviderChatService.checkProvidersHealth();

    // Get available providers
    const availableProviders = multiProviderChatService.getAvailableProviders();

    // Get provider metrics
    const providerMetrics = multiProviderChatService.getProviderMetrics();

    return NextResponse.json({
      agentId,
      agentName: agent.name,

      // Provider availability
      providers: {
        available: availableProviders,
        total: ['openai', 'anthropic', 'google'].length,
        health: Object.fromEntries(providersHealth),
      },

      // Current configuration
      configuration: {
        defaultProvider: agent.modelProvider || 'openai',
        defaultModel: agent.model || 'gpt-4o-mini',
        temperature: agent.temperature || 0.7,
        maxTokens: agent.maxTokens || 1000,
      },

      // Performance metrics
      metrics: Object.fromEntries(providerMetrics),

      // System status
      status: {
        healthy: availableProviders.length > 0,
        multiProviderEnabled: true,
        fallbackEnabled: true,
      },

      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Provider status check error:', error);
    return NextResponse.json(
      {
        error: 'Status check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
