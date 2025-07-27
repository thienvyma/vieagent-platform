/**
 * 🔍 KNOWLEDGE SEARCH API
 * Vector-based semantic search using VectorKnowledgeService
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { vectorKnowledgeService } from '@/lib/vector-knowledge-service';

export async function POST(request: NextRequest) {
  let requestQuery = 'unknown';

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { query, limit = 10, threshold = 0.7, filters = {} } = body;
    requestQuery = query || 'unknown';

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Query is required and must be a string',
        },
        { status: 400 }
      );
    }

    console.log(`🔍 Searching knowledge for user ${session.user.id}: "${query}"`);

    // Search user's knowledge collection
    const collectionName = `user_${session.user.id}_knowledge`;
    const searchResults = await vectorKnowledgeService.searchKnowledge(query, collectionName, {
      limit: Math.min(limit, 50), // Cap at 50 results
      threshold: Math.max(threshold, 0.3), // Minimum threshold
      filters: {
        ...filters,
        userId: session.user.id, // Ensure user can only search their own data
      },
    });

    // Transform results for frontend
    const formattedResults = searchResults.map((result, index) => ({
      id: result.id,
      chunkId: result.chunkId,
      documentId: result.documentId,
      content: result.content,
      similarity: result.similarity,
      distance: result.distance,
      rank: index + 1,
      metadata: {
        ...result.metadata,
        source: result.metadata.source || 'unknown',
        title: result.metadata.title || 'Untitled',
        filename: result.metadata.filename || null,
      },
      preview: result.content.substring(0, 300) + (result.content.length > 300 ? '...' : ''),
    }));

    // Calculate search statistics
    const stats = {
      totalResults: formattedResults.length,
      avgSimilarity:
        formattedResults.length > 0
          ? formattedResults.reduce((sum, r) => sum + r.similarity, 0) / formattedResults.length
          : 0,
      maxSimilarity:
        formattedResults.length > 0 ? Math.max(...formattedResults.map(r => r.similarity)) : 0,
      minSimilarity:
        formattedResults.length > 0 ? Math.min(...formattedResults.map(r => r.similarity)) : 0,
      documentSources: [...new Set(formattedResults.map(r => r.metadata.source))],
      uniqueDocuments: new Set(formattedResults.map(r => r.documentId)).size,
    };

    console.log(`✅ Search completed: ${formattedResults.length} results found`);

    return NextResponse.json({
      success: true,
      query,
      results: formattedResults,
      statistics: stats,
      collectionName,
      searchParams: {
        limit,
        threshold,
        filters,
      },
    });
  } catch (error) {
    console.error('❌ Knowledge search failed:', error);

    // Enhanced error handling with fallbacks and recovery
    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('vector')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Vector database error',
            fallback: 'The search service is temporarily unavailable',
            recovery: {
              suggestions: [
                'Try again in a few moments',
                'Use simpler search terms',
                'Contact support if the issue persists',
              ],
              retryAfter: 10000,
            },
            query: requestQuery,
            timestamp: new Date().toISOString(),
          },
          { status: 503 }
        );
      }

      if (error.message.includes('timeout')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Search timeout',
            fallback: 'The search took too long to complete',
            recovery: {
              suggestions: [
                'Try a more specific search query',
                'Reduce the search limit',
                'Try again in a moment',
              ],
              retryAfter: 5000,
            },
            query: requestQuery,
            timestamp: new Date().toISOString(),
          },
          { status: 408 }
        );
      }

      if (error.message.includes('embedding')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Embedding service error',
            fallback: 'Unable to process your search query',
            recovery: {
              suggestions: [
                'Try rephrasing your search',
                'Use different keywords',
                'Check if the service is available',
              ],
              retryAfter: 3000,
            },
            query: requestQuery,
            timestamp: new Date().toISOString(),
          },
          { status: 502 }
        );
      }
    }

    // Generic error with recovery suggestions
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
        fallback: 'Something went wrong during the search',
        recovery: {
          suggestions: [
            'Check your internet connection',
            'Try different search terms',
            'Refresh the page and try again',
          ],
          retryAfter: 5000,
        },
        query: requestQuery,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// GET method for collection info
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const collectionName = `user_${session.user.id}_knowledge`;
    const collectionInfo = await vectorKnowledgeService.getCollectionStats(collectionName);

    return NextResponse.json({
      success: true,
      collection: collectionInfo,
      collectionName,
    });
  } catch (error) {
    console.error('❌ Failed to get collection info:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get collection info',
      },
      { status: 500 }
    );
  }
}
