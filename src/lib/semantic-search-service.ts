/**
 * 🔍 Semantic Search Service - Day 15 Step 15.1
 * Context retrieval system với similarity search
 */

import { vectorKnowledgeServiceProduction } from './vector-knowledge-service-production';
import { productionChromaService } from './chromadb-production';

export interface SearchConfig {
  // Semantic search settings
  semanticThreshold: number;
  semanticWeight: number;

  // Keyword search settings
  keywordWeight: number;
  enableKeywordSearch: boolean;

  // Result settings
  maxResults: number;
  minRelevanceScore: number;

  // Performance settings
  searchTimeout: number;
  enableCache: boolean;
}

export interface SearchFilter {
  userId?: string;
  agentId?: string;
  documentTypes?: string[];
  dateRange?: {
    start?: string;
    end?: string;
  };
  tags?: string[];
  contentLength?: {
    min?: number;
    max?: number;
  };
  qualityScore?: {
    min?: number;
    max?: number;
  };
}

export interface SearchResult {
  id: string;
  chunkId: string;
  documentId: string;
  content: string;
  metadata: any;

  // Scoring
  semanticScore: number;
  keywordScore: number;
  combinedScore: number;
  relevanceScore: number;
  qualityScore: number;

  // Context
  context: {
    before?: string;
    after?: string;
    highlights: string[];
  };

  // Source info
  source: {
    title: string;
    filename?: string;
    type: string;
    createdAt: string;
  };

  // Ranking
  rank: number;
  confidence: number;
}

export interface SearchResponse {
  results: SearchResult[];
  metadata: {
    query: string;
    totalResults: number;
    searchTime: number;
    filters: SearchFilter;
    config: SearchConfig;
    performance: {
      semanticSearchTime: number;
      keywordSearchTime: number;
      rankingTime: number;
      totalTime: number;
    };
  };
  suggestions?: {
    alternativeQueries: string[];
    expandedTerms: string[];
    relatedConcepts: string[];
  };
}

export const DEFAULT_SEARCH_CONFIG: SearchConfig = {
  semanticThreshold: 0.7,
  semanticWeight: 0.8,
  keywordWeight: 0.2,
  enableKeywordSearch: true,
  maxResults: 20,
  minRelevanceScore: 0.5,
  searchTimeout: 5000,
  enableCache: true,
};

export class SemanticSearchService {
  private static instance: SemanticSearchService;
  private searchCache: Map<string, SearchResponse> = new Map();
  private config: SearchConfig;

  constructor(config: Partial<SearchConfig> = {}) {
    this.config = { ...DEFAULT_SEARCH_CONFIG, ...config };
  }

  static getInstance(config?: Partial<SearchConfig>): SemanticSearchService {
    if (!SemanticSearchService.instance) {
      SemanticSearchService.instance = new SemanticSearchService(config);
    }
    return SemanticSearchService.instance;
  }

  /**
   * Main search method với hybrid capabilities
   */
  async search(
    query: string,
    userId: string,
    filters: SearchFilter = {},
    config: Partial<SearchConfig> = {}
  ): Promise<SearchResponse> {
    const startTime = Date.now();
    const searchConfig = { ...this.config, ...config };

    console.log(`🔍 Starting semantic search for: "${query}"`);

    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(query, userId, filters, searchConfig);
      if (searchConfig.enableCache && this.searchCache.has(cacheKey)) {
        console.log('✅ Cache hit for search query');
        return this.searchCache.get(cacheKey)!;
      }

      // Run parallel searches
      const [semanticResults, keywordResults] = await Promise.all([
        this.performSemanticSearch(query, userId, filters, searchConfig),
        searchConfig.enableKeywordSearch
          ? this.performKeywordSearch(query, userId, filters, searchConfig)
          : Promise.resolve([]),
      ]);

      const semanticTime = Date.now() - startTime;
      const keywordTime = Date.now() - startTime - semanticTime;

      // Merge and rank results
      const rankingStartTime = Date.now();
      const mergedResults = this.mergeAndRankResults(
        semanticResults,
        keywordResults,
        query,
        searchConfig
      );
      const rankingTime = Date.now() - rankingStartTime;

      // Apply final filtering
      const filteredResults = this.applyResultFilters(mergedResults, filters, searchConfig);

      // Generate response
      const totalTime = Date.now() - startTime;
      const response: SearchResponse = {
        results: filteredResults,
        metadata: {
          query,
          totalResults: filteredResults.length,
          searchTime: totalTime,
          filters,
          config: searchConfig,
          performance: {
            semanticSearchTime: semanticTime,
            keywordSearchTime: keywordTime,
            rankingTime,
            totalTime,
          },
        },
        suggestions: await this.generateSuggestions(query, filteredResults),
      };

      // Cache result
      if (searchConfig.enableCache) {
        this.searchCache.set(cacheKey, response);

        // Clean cache if too large
        if (this.searchCache.size > 100) {
          this.cleanCache();
        }
      }

      console.log(`✅ Search completed: ${filteredResults.length} results in ${totalTime}ms`);
      return response;
    } catch (error) {
      console.error('❌ Search failed:', error);
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Perform semantic vector search
   */
  private async performSemanticSearch(
    query: string,
    userId: string,
    filters: SearchFilter,
    config: SearchConfig
  ): Promise<SearchResult[]> {
    try {
      // Use production vector service for semantic search
      const vectorResults = await vectorKnowledgeServiceProduction.searchUserKnowledge(
        userId,
        query,
        {
          limit: config.maxResults * 2, // Get more for better ranking
          threshold: config.semanticThreshold,
        }
      );

      // Transform to SearchResult format
      return vectorResults.map((result, index) => ({
        id: result.id || `semantic_${index}`,
        chunkId: result.chunkId || result.id,
        documentId: result.documentId || 'unknown',
        content: result.content || '',
        metadata: result.metadata || {},

        semanticScore: result.similarity || 0,
        keywordScore: 0,
        combinedScore: result.similarity || 0,
        relevanceScore: result.similarity || 0,
        qualityScore: result.metadata?.qualityScore || 0.5,

        context: {
          highlights: this.extractHighlights(result.content, query),
          before: '',
          after: '',
        },

        source: {
          title: result.metadata?.title || 'Untitled',
          filename: result.metadata?.filename || '',
          type: result.metadata?.type || 'document',
          createdAt: result.metadata?.createdAt || new Date().toISOString(),
        },

        rank: index + 1,
        confidence: this.calculateConfidence(result.similarity || 0, result.metadata),
      }));
    } catch (error) {
      console.error('❌ Semantic search failed:', error);
      return [];
    }
  }

  /**
   * Perform keyword-based search
   */
  private async performKeywordSearch(
    query: string,
    userId: string,
    filters: SearchFilter,
    config: SearchConfig
  ): Promise<SearchResult[]> {
    try {
      // Simple keyword matching implementation
      // In production, this could use Elasticsearch or similar
      const keywords = this.extractKeywords(query);
      const keywordResults: SearchResult[] = [];

      // For now, return empty array - will be enhanced with actual keyword search
      console.log(`🔤 Keyword search for: ${keywords.join(', ')}`);

      return keywordResults;
    } catch (error) {
      console.error('❌ Keyword search failed:', error);
      return [];
    }
  }

  /**
   * Merge semantic and keyword results với intelligent ranking
   */
  private mergeAndRankResults(
    semanticResults: SearchResult[],
    keywordResults: SearchResult[],
    query: string,
    config: SearchConfig
  ): SearchResult[] {
    // Create unified result map
    const resultMap = new Map<string, SearchResult>();

    // Add semantic results
    semanticResults.forEach(result => {
      const key = result.chunkId || result.id;
      resultMap.set(key, {
        ...result,
        combinedScore: result.semanticScore * config.semanticWeight,
      });
    });

    // Merge keyword results
    keywordResults.forEach(result => {
      const key = result.chunkId || result.id;
      const existing = resultMap.get(key);

      if (existing) {
        // Combine scores
        existing.keywordScore = result.keywordScore;
        existing.combinedScore =
          existing.semanticScore * config.semanticWeight +
          result.keywordScore * config.keywordWeight;
      } else {
        // Add new keyword result
        resultMap.set(key, {
          ...result,
          combinedScore: result.keywordScore * config.keywordWeight,
        });
      }
    });

    // Convert to array and calculate final scores
    const mergedResults = Array.from(resultMap.values()).map(result => ({
      ...result,
      relevanceScore: this.calculateRelevanceScore(result, query, config),
      confidence: this.calculateConfidence(result.combinedScore, result.metadata),
    }));

    // Sort by combined relevance score
    return mergedResults
      .sort((a, b) => {
        // Primary sort: relevance score
        if (b.relevanceScore !== a.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }

        // Secondary sort: quality score
        if (b.qualityScore !== a.qualityScore) {
          return b.qualityScore - a.qualityScore;
        }

        // Tertiary sort: recency
        return new Date(b.source.createdAt).getTime() - new Date(a.source.createdAt).getTime();
      })
      .map((result, index) => ({
        ...result,
        rank: index + 1,
      }));
  }

  /**
   * Apply additional result filters
   */
  private applyResultFilters(
    results: SearchResult[],
    filters: SearchFilter,
    config: SearchConfig
  ): SearchResult[] {
    let filtered = results;

    // Filter by relevance score
    filtered = filtered.filter(result => result.relevanceScore >= config.minRelevanceScore);

    // Filter by document types
    if (filters.documentTypes && filters.documentTypes.length > 0) {
      filtered = filtered.filter(result => filters.documentTypes!.includes(result.source.type));
    }

    // Filter by date range
    if (filters.dateRange) {
      filtered = filtered.filter(result => {
        const resultDate = new Date(result.source.createdAt);
        const start = filters.dateRange!.start ? new Date(filters.dateRange!.start) : null;
        const end = filters.dateRange!.end ? new Date(filters.dateRange!.end) : null;

        return (!start || resultDate >= start) && (!end || resultDate <= end);
      });
    }

    // Filter by content length
    if (filters.contentLength) {
      filtered = filtered.filter(result => {
        const length = result.content.length;
        const min = filters.contentLength!.min || 0;
        const max = filters.contentLength!.max || Infinity;

        return length >= min && length <= max;
      });
    }

    // Limit results
    return filtered.slice(0, config.maxResults);
  }

  /**
   * Calculate relevance score
   */
  private calculateRelevanceScore(
    result: SearchResult,
    query: string,
    config: SearchConfig
  ): number {
    let score = result.combinedScore;

    // Boost for exact matches
    const queryLower = query.toLowerCase();
    const contentLower = result.content.toLowerCase();

    if (contentLower.includes(queryLower)) {
      score += 0.2;
    }

    // Boost for title matches
    if (result.source.title.toLowerCase().includes(queryLower)) {
      score += 0.1;
    }

    // Apply quality score
    score = score * (0.7 + result.qualityScore * 0.3);

    // Recency boost (newer content gets slight boost)
    const daysOld =
      (Date.now() - new Date(result.source.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    const recencyBoost = Math.max(0, 1 - daysOld / 365) * 0.1; // Up to 10% boost for recent content
    score += recencyBoost;

    return Math.min(1.0, Math.max(0, score));
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(score: number, metadata: any): number {
    let confidence = score;

    // Higher confidence for better quality metadata
    if (metadata?.qualityScore > 0.8) confidence += 0.1;
    if (metadata?.title && metadata.title.length > 0) confidence += 0.05;
    if (metadata?.filename && metadata.filename.length > 0) confidence += 0.05;

    return Math.min(1.0, confidence);
  }

  /**
   * Extract keywords từ query
   */
  private extractKeywords(query: string): string[] {
    return query
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !['and', 'or', 'the', 'for', 'with', 'from'].includes(word));
  }

  /**
   * Extract highlights từ content
   */
  private extractHighlights(content: string, query: string): string[] {
    const highlights: string[] = [];
    const queryWords = this.extractKeywords(query);
    const contentLower = content.toLowerCase();

    queryWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        highlights.push(...matches);
      }
    });

    return [...new Set(highlights)]; // Remove duplicates
  }

  /**
   * Generate search suggestions
   */
  private async generateSuggestions(
    query: string,
    results: SearchResult[]
  ): Promise<{ alternativeQueries: string[]; expandedTerms: string[]; relatedConcepts: string[] }> {
    // Simple suggestion generation
    const keywords = this.extractKeywords(query);

    return {
      alternativeQueries: [
        `"${query}"`, // Exact phrase
        keywords.join(' OR '), // OR query
        keywords.join(' AND '), // AND query
      ],
      expandedTerms: keywords.map(word => `${word}*`), // Wildcard expansion
      relatedConcepts: results
        .slice(0, 3)
        .map(result => result.source.title)
        .filter(title => title.toLowerCase() !== query.toLowerCase()),
    };
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(
    query: string,
    userId: string,
    filters: SearchFilter,
    config: SearchConfig
  ): string {
    return `${userId}:${query}:${JSON.stringify(filters)}:${JSON.stringify(config)}`;
  }

  /**
   * Clean cache when it gets too large
   */
  private cleanCache(): void {
    // Keep only the 50 most recent entries
    const entries = Array.from(this.searchCache.entries());
    this.searchCache.clear();

    entries.slice(-50).forEach(([key, value]) => {
      this.searchCache.set(key, value);
    });

    console.log('🧹 Search cache cleaned');
  }

  /**
   * Get search statistics
   */
  getSearchStats(): any {
    return {
      cacheSize: this.searchCache.size,
      config: this.config,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Clear search cache
   */
  clearCache(): void {
    this.searchCache.clear();
    console.log('🧹 Search cache cleared');
  }
}

// Export singleton instance
export const semanticSearchService = SemanticSearchService.getInstance();
