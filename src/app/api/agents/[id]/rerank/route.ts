/**
 * 🔍 Agent Rerank API - DAY 22 Validation Requirement
 * Endpoint for re-ranking search results using advanced quality control
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ContextQualityService, QualityConfig } from '@/lib/context-quality-service';

interface RerankRequest {
  query: string;
  results: Array<{
    id: string;
    content: string;
    relevanceScore: number;
    source: {
      id: string;
      title: string;
      type: string;
      createdAt: string;
    };
    metadata?: any;
  }>;
  config?: Partial<QualityConfig>;
}

interface RerankResponse {
  success: boolean;
  rerankedResults: any[];
  qualityMetrics: any[];
  improvements: {
    relevanceImprovement: number;
    diversityImprovement: number;
    qualityImprovement: number;
  };
  processingTime: number;
  algorithm: string;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    console.log('🔍 Rerank API called for agent:', id);

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    const agentId = id;

    // Parse request body
    const body: RerankRequest = await request.json();
    const { query, results, config } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    if (!results || !Array.isArray(results) || results.length === 0) {
      return NextResponse.json(
        { error: 'Results array is required and must not be empty' },
        { status: 400 }
      );
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

    console.log(`📋 Processing rerank request for agent: ${agent.name}`);
    console.log(`📊 Input: ${results.length} results to rerank`);

    // Initialize Context Quality Service
    const qualityService = new ContextQualityService();

    // Convert input results to SearchResult format
    const searchResults = results.map(result => ({
      id: result.id,
      documentId: result.source.id,
      content: result.content,
      context: {
        before: '',
        after: '',
        highlights: [],
      },
      relevanceScore: result.relevanceScore,
      semanticScore: result.relevanceScore,
      keywordScore: 0,
      combinedScore: result.relevanceScore,
      qualityScore: result.relevanceScore,
      confidence: result.relevanceScore,
      rank: 0,
      source: {
        title: result.source.title,
        filename: result.source.title,
        type: result.source.type,
        createdAt: result.source.createdAt,
      },
      chunkId: result.id,
      metadata: result.metadata || {},
    }));

    // Apply quality control and reranking
    const startTime = Date.now();
    const rerankingResult = await qualityService.improveResultQuality(searchResults, query, {
      enableReranking: true,
      rerankingAlgorithm: 'hybrid',
      enableSemanticDuplicateDetection: true,
      enableQualityFiltering: true,
      minQualityScore: 0.3,
      maxResults: Math.min(50, results.length),
      qualityWeight: 0.4,
      diversityWeight: 0.3,
      ...config,
    });
    const processingTime = Date.now() - startTime;

    // Build response
    const response: RerankResponse = {
      success: true,
      rerankedResults: rerankingResult.rerankedResults.map(result => ({
        id: result.id,
        content: result.content,
        relevanceScore: result.relevanceScore,
        qualityScore: result.qualityScore,
        confidence: result.confidence,
        source: {
          title: result.source.title,
          type: result.source.type,
          createdAt: result.source.createdAt,
        },
        metadata: result.metadata,
        ranking: {
          originalPosition: results.findIndex(r => r.id === result.id),
          newPosition: rerankingResult.rerankedResults.findIndex(r => r.id === result.id),
          improvement:
            result.relevanceScore - (results.find(r => r.id === result.id)?.relevanceScore || 0),
        },
      })),
      qualityMetrics: rerankingResult.qualityMetrics,
      improvements: rerankingResult.improvements,
      processingTime: rerankingResult.processingTime,
      algorithm: rerankingResult.algorithm,
    };

    console.log(`✅ Reranking completed in ${processingTime}ms`);
    console.log(
      `📊 Quality improvements: Relevance +${rerankingResult.improvements.relevanceImprovement.toFixed(2)}, Diversity +${rerankingResult.improvements.diversityImprovement.toFixed(2)}`
    );
    console.log(`🔄 Results reordered: ${rerankingResult.rerankedResults.length} final results`);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Rerank API error:', error);

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
  try {
    const { id } = await params;

    // Check authentication
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

    // Get reranking service health and configuration
    const qualityService = new ContextQualityService();

    return NextResponse.json({
      agentId,
      agentName: agent.name,
      rerankingService: {
        status: 'operational',
        algorithms: ['score_based', 'diversity_based', 'hybrid'],
        features: [
          'Quality-based reranking',
          'Diversity optimization',
          'Duplicate detection',
          'Semantic similarity analysis',
          'Improvement scoring',
        ],
        maxResults: 50,
        defaultAlgorithm: 'hybrid',
      },
      usage: {
        endpoint: `/api/agents/${agentId}/rerank`,
        method: 'POST',
        requiredFields: ['query', 'results'],
        optionalFields: ['config'],
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Rerank health check error:', error);
    return NextResponse.json(
      {
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
