/**
 * 🧠 Smart Chat API - Day 17 Integration
 * Enhanced chat endpoint với Smart RAG Service
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SmartRAGService, SmartRAGRequest } from '@/lib/smart-rag-service';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    console.log('🧠 Smart Chat API called for agent:', id);

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    const agentId = id;

    // Parse request body
    const body = await request.json();
    const { message, conversationId, contextOptions, sourceOptions, qualityOptions, config } = body;

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

    console.log(`📋 Processing smart chat for agent: ${agent.name}`);

    // Prepare Smart RAG request
    const smartRAGRequest: SmartRAGRequest = {
      query: message,
      userId,
      agentId,
      conversationId: conversationId || `conv_${Date.now()}`,
      contextOptions: {
        includeConversationHistory: true,
        maxHistoryTurns: 5,
        enableSummary: true,
        ...contextOptions,
      },
      sourceOptions: {
        sourceTypes: ['document', 'conversation'],
        ...sourceOptions,
      },
      qualityOptions: {
        minRelevanceScore: 0.6,
        enableDiversityFiltering: true,
        maxResultsPerSource: 3,
        ...qualityOptions,
      },
    };

    // Get Smart RAG Service instance
    const smartRAGService = SmartRAGService.getInstance(config);

    // Process Smart RAG
    const ragResponse = await smartRAGService.processSmartRAG(smartRAGRequest);

    console.log(
      `✅ Smart RAG completed: ${ragResponse.searchResults.length} results, ${ragResponse.contextInfo.optimizedTokenCount} tokens`
    );

    // Prepare context for AI
    const systemPrompt = `You are ${agent.name}, an AI assistant with the following description: ${agent.description}

Your instruction: ${agent.prompt}

CONTEXT INFORMATION:
${ragResponse.optimizedContext.content}

CONVERSATION SUMMARY: ${ragResponse.contextInfo.conversationSummary || 'No previous conversation'}

SOURCES USED: ${ragResponse.sourcesUsed.map(s => s.name).join(', ')}

Please provide a helpful response based on the provided context. If you reference specific information, mention which source it came from.`;

    // Get AI response using OpenAI
    let aiResponse = '';
    try {
      const OpenAI = require('openai');
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const completion = await openai.chat.completions.create({
        model: agent.model || 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        max_tokens: agent.maxTokens || 2000,
        temperature: agent.temperature || 0.7,
      });

      aiResponse =
        completion.choices[0]?.message?.content ||
        'I apologize, but I could not generate a response.';
    } catch (aiError) {
      console.error('AI generation error:', aiError);
      aiResponse = 'I apologize, but there was an error generating my response. Please try again.';
    }

    // Save conversation if conversationId provided
    if (conversationId && conversationId !== `conv_${Date.now()}`) {
      try {
        // Create or update conversation
        const conversation = await prisma.conversation.upsert({
          where: { id: conversationId },
          create: {
            id: conversationId,
            userId,
            agentId,
            title: message.substring(0, 50) + '...',
          },
          update: {
            updatedAt: new Date(),
          },
        });

        // Create user message
        await prisma.message.create({
          data: {
            role: 'user',
            content: message,
            conversationId: conversation.id,
          },
        });

        // Create assistant message
        await prisma.message.create({
          data: {
            role: 'assistant',
            content: aiResponse,
            conversationId: conversation.id,
          },
        });
      } catch (dbError) {
        console.error('Database save error:', dbError);
        // Continue even if save fails
      }
    }

    // Prepare enhanced response
    const enhancedResponse = {
      success: true,
      message: aiResponse,
      conversationId: smartRAGRequest.conversationId,

      // RAG information
      ragInfo: {
        contextUsed: ragResponse.optimizedContext.content.length > 0,
        sourcesCount: ragResponse.sourcesUsed.length,
        qualityScore: ragResponse.quality.overallScore,
        processingTime: ragResponse.processing.totalTime,
        tokenCount: ragResponse.contextInfo.optimizedTokenCount,
        compressionRatio: ragResponse.contextInfo.compressionRatio,
      },

      // Sources information
      sources: ragResponse.sourcesUsed.map(source => ({
        id: source.id,
        name: source.name,
        type: source.type,
        credibilityScore: source.credibilityScore,
        priority: source.priority,
      })),

      // Quality metrics
      quality: {
        relevance: ragResponse.quality.relevanceScore,
        diversity: ragResponse.quality.diversityScore,
        credibility: ragResponse.quality.credibilityScore,
        coherence: ragResponse.quality.coherenceScore,
        overall: ragResponse.quality.overallScore,
      },

      // Context information
      context: {
        originalTokens: ragResponse.contextInfo.originalTokenCount,
        optimizedTokens: ragResponse.contextInfo.optimizedTokenCount,
        compressionRatio: ragResponse.contextInfo.compressionRatio,
        chunkingStrategy: ragResponse.contextInfo.chunkingStrategy,
        conversationSummary: ragResponse.contextInfo.conversationSummary,
      },

      // Recommendations
      recommendations: ragResponse.recommendations,

      // Performance metrics
      performance: {
        searchTime: ragResponse.processing.searchTime,
        optimizationTime: ragResponse.processing.optimizationTime,
        qualityTime: ragResponse.processing.qualityTime,
        sourceManagementTime: ragResponse.processing.sourceManagementTime,
        totalTime: ragResponse.processing.totalTime,
      },

      // Debug information (only in development)
      debug: process.env.NODE_ENV === 'development' ? ragResponse.debug : undefined,
    };

    console.log(
      `📊 Smart Chat Response: Quality ${ragResponse.quality.overallScore.toFixed(2)}, ${ragResponse.processing.totalTime}ms`
    );

    return NextResponse.json(enhancedResponse);
  } catch (error) {
    console.error('Smart Chat API error:', error);

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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    // Health check endpoint
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const agentId = id;
    const userId = session.user.id;

    // Verify agent exists
    const agent = await prisma.agent.findFirst({
      where: {
        id: agentId,
        userId: userId,
      },
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Get Smart RAG Service health
    const smartRAGService = SmartRAGService.getInstance();
    const healthCheck = await smartRAGService.healthCheck();
    const performanceStats = smartRAGService.getPerformanceStats();

    return NextResponse.json({
      agentId,
      agentName: agent.name,
      smartRAGStatus: healthCheck.status,
      services: healthCheck.services,
      metrics: healthCheck.metrics,
      performance: performanceStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Smart Chat health check error:', error);
    return NextResponse.json(
      {
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
