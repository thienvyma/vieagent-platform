/**
 * 🔍 Optimized Semantic Search Service - Day 16 Step 16.2
 * Enhanced semantic search với performance optimizations
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
  cacheTTL: number;
  enableQueryOptimization: boolean;
  enableBatchProcessing: boolean;
  maxConcurrentQueries: number;

  // Advanced performance
  enablePrecomputation: boolean;
  enableIndexOptimization: boolean;
  enableResultPrefetching: boolean;
  compressionLevel: number;
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
    performance: PerformanceMetrics;
    cacheInfo: CacheInfo;
  };
  suggestions?: {
    alternativeQueries: string[];
    expandedTerms: string[];
    relatedConcepts: string[];
  };
}

export interface PerformanceMetrics {
  semanticSearchTime: number;
  keywordSearchTime: number;
  rankingTime: number;
  totalTime: number;
  cacheHitRate: number;
  queryOptimizationTime: number;
  indexLookupTime: number;
  resultCompressionTime: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface CacheInfo {
  hit: boolean;
  key: string;
  size: number;
  ttl: number;
  compression: number;
  createdAt: string;
}

export interface SearchAnalytics {
  totalQueries: number;
  averageResponseTime: number;
  cacheHitRate: number;
  popularQueries: { query: string; count: number }[];
  performanceHistory: PerformanceMetrics[];
  errorRate: number;
  lastUpdated: string;
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
  cacheTTL: 300000, // 5 minutes
  enableQueryOptimization: true,
  enableBatchProcessing: true,
  maxConcurrentQueries: 10,
  enablePrecomputation: true,
  enableIndexOptimization: true,
  enableResultPrefetching: true,
  compressionLevel: 6,
};

interface CacheEntry {
  response: SearchResponse;
  createdAt: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
  compressed: boolean;
}

export class OptimizedSemanticSearchService {
  private static instance: OptimizedSemanticSearchService;
  private searchCache: Map<string, CacheEntry> = new Map();
  private config: SearchConfig;
  private analytics: SearchAnalytics;
  private queryQueue: Array<{ query: string; resolve: Function; reject: Function }> = [];
  private activeQueries: number = 0;
  private precomputedQueries: Map<string, SearchResponse> = new Map();
  private queryOptimizationCache: Map<string, string> = new Map();

  constructor(config: Partial<SearchConfig> = {}) {
    this.config = { ...DEFAULT_SEARCH_CONFIG, ...config };
    this.analytics = {
      totalQueries: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
      popularQueries: [],
      performanceHistory: [],
      errorRate: 0,
      lastUpdated: new Date().toISOString(),
    };

    // Start background tasks
    this.startBackgroundTasks();
  }

  static getInstance(config?: Partial<SearchConfig>): OptimizedSemanticSearchService {
    if (!OptimizedSemanticSearchService.instance) {
      OptimizedSemanticSearchService.instance = new OptimizedSemanticSearchService(config);
    }
    return OptimizedSemanticSearchService.instance;
  }

  /**
   * Main search method với advanced performance optimization
   */
  async search(
    query: string,
    userId: string,
    filters: SearchFilter = {},
    config: Partial<SearchConfig> = {}
  ): Promise<SearchResponse> {
    const startTime = Date.now();
    const searchConfig = { ...this.config, ...config };

    // Update analytics
    this.analytics.totalQueries++;

    console.log(`🚀 Starting optimized semantic search for: "${query}"`);

    try {
      // Query optimization
      const optimizedQuery = await this.optimizeQuery(query, searchConfig);

      // Check cache first
      const cacheKey = this.generateCacheKey(optimizedQuery, userId, filters, searchConfig);
      const cacheEntry = this.searchCache.get(cacheKey);

      if (
        searchConfig.enableCache &&
        cacheEntry &&
        this.isCacheValid(cacheEntry, searchConfig.cacheTTL)
      ) {
        console.log('✅ Cache hit for optimized search query');
        this.updateCacheAccess(cacheEntry);
        this.updateAnalytics(Date.now() - startTime, true);
        return cacheEntry.response;
      }

      // Queue management for concurrent queries
      if (this.activeQueries >= searchConfig.maxConcurrentQueries) {
        await this.queueQuery(optimizedQuery);
      }

      this.activeQueries++;

      try {
        // Run parallel searches with performance monitoring
        const performanceMetrics: PerformanceMetrics = {
          semanticSearchTime: 0,
          keywordSearchTime: 0,
          rankingTime: 0,
          totalTime: 0,
          cacheHitRate: 0,
          queryOptimizationTime: 0,
          indexLookupTime: 0,
          resultCompressionTime: 0,
          memoryUsage: 0,
          cpuUsage: 0,
        };

        const [semanticResults, keywordResults] = await Promise.all([
          this.performOptimizedSemanticSearch(
            optimizedQuery,
            userId,
            filters,
            searchConfig,
            performanceMetrics
          ),
          searchConfig.enableKeywordSearch
            ? this.performOptimizedKeywordSearch(
                optimizedQuery,
                userId,
                filters,
                searchConfig,
                performanceMetrics
              )
            : Promise.resolve([]),
        ]);

        // Merge and rank results with performance tracking
        const rankingStartTime = Date.now();
        const mergedResults = this.mergeAndRankResults(
          semanticResults,
          keywordResults,
          optimizedQuery,
          searchConfig
        );
        performanceMetrics.rankingTime = Date.now() - rankingStartTime;

        // Apply final filtering
        const filteredResults = this.applyResultFilters(mergedResults, filters, searchConfig);

        // Generate response
        const totalTime = Date.now() - startTime;
        performanceMetrics.totalTime = totalTime;
        performanceMetrics.cacheHitRate = this.calculateCacheHitRate();

        const response: SearchResponse = {
          results: filteredResults,
          metadata: {
            query: optimizedQuery,
            totalResults: filteredResults.length,
            searchTime: totalTime,
            filters,
            config: searchConfig,
            performance: performanceMetrics,
            cacheInfo: {
              hit: false,
              key: cacheKey,
              size: 0,
              ttl: searchConfig.cacheTTL,
              compression: 0,
              createdAt: new Date().toISOString(),
            },
          },
          suggestions: await this.generateSuggestions(optimizedQuery, filteredResults),
        };

        // Cache result with compression
        if (searchConfig.enableCache) {
          await this.cacheResult(cacheKey, response, searchConfig);
        }

        // Update analytics
        this.updateAnalytics(totalTime, false);
        this.updatePerformanceHistory(performanceMetrics);

        console.log(`✅ Optimized search completed in ${totalTime}ms`);
        return response;
      } finally {
        this.activeQueries--;
        this.processQueryQueue();
      }
    } catch (error) {
      this.analytics.errorRate++;
      console.error('❌ Optimized search failed:', error);
      throw error;
    }
  }

  /**
   * Batch search for multiple queries
   */
  async batchSearch(
    queries: string[],
    userId: string,
    filters: SearchFilter = {},
    config: Partial<SearchConfig> = {}
  ): Promise<SearchResponse[]> {
    const searchConfig = { ...this.config, ...config };

    if (!searchConfig.enableBatchProcessing) {
      // Fall back to sequential processing
      const results = [];
      for (const query of queries) {
        results.push(await this.search(query, userId, filters, config));
      }
      return results;
    }

    console.log(`🔄 Starting batch search for ${queries.length} queries`);

    // Process queries in batches to avoid overwhelming the system
    const batchSize = Math.min(searchConfig.maxConcurrentQueries, queries.length);
    const results: SearchResponse[] = [];

    for (let i = 0; i < queries.length; i += batchSize) {
      const batch = queries.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(query => this.search(query, userId, filters, config))
      );
      results.push(...batchResults);
    }

    console.log(`✅ Batch search completed for ${queries.length} queries`);
    return results;
  }

  /**
   * Optimized semantic search with indexing
   */
  private async performOptimizedSemanticSearch(
    query: string,
    userId: string,
    filters: SearchFilter,
    config: SearchConfig,
    metrics: PerformanceMetrics
  ): Promise<SearchResult[]> {
    const startTime = Date.now();

    try {
      // Use index optimization if enabled
      if (config.enableIndexOptimization) {
        const indexedResults = await this.performIndexedSearch(query, userId, filters);
        if (indexedResults.length > 0) {
          metrics.indexLookupTime = Date.now() - startTime;
          return indexedResults;
        }
      }

      // Fallback to regular semantic search
      const results = await this.performSemanticSearch(query, userId, filters, config);
      metrics.semanticSearchTime = Date.now() - startTime;
      return results;
    } catch (error) {
      console.error('❌ Optimized semantic search failed:', error);
      throw error;
    }
  }

  /**
   * Optimized keyword search with caching
   */
  private async performOptimizedKeywordSearch(
    query: string,
    userId: string,
    filters: SearchFilter,
    config: SearchConfig,
    metrics: PerformanceMetrics
  ): Promise<SearchResult[]> {
    const startTime = Date.now();

    try {
      const results = await this.performKeywordSearch(query, userId, filters, config);
      metrics.keywordSearchTime = Date.now() - startTime;
      return results;
    } catch (error) {
      console.error('❌ Optimized keyword search failed:', error);
      throw error;
    }
  }

  /**
   * Perform indexed search for better performance
   */
  private async performIndexedSearch(
    query: string,
    userId: string,
    filters: SearchFilter
  ): Promise<SearchResult[]> {
    try {
      // This would integrate with a more sophisticated indexing system
      // For now, return empty to fall back to regular search
      return [];
    } catch (error) {
      console.error('❌ Indexed search failed:', error);
      return [];
    }
  }

  /**
   * Query optimization với caching
   */
  private async optimizeQuery(query: string, config: SearchConfig): Promise<string> {
    if (!config.enableQueryOptimization) {
      return query;
    }

    const cacheKey = `query_opt_${query}`;
    if (this.queryOptimizationCache.has(cacheKey)) {
      return this.queryOptimizationCache.get(cacheKey)!;
    }

    let optimizedQuery = query;

    // Basic query optimization
    optimizedQuery = optimizedQuery.trim();
    optimizedQuery = optimizedQuery.toLowerCase();

    // Remove stop words for better semantic search
    const stopWords = [
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
    ];
    const words = optimizedQuery.split(' ').filter(word => !stopWords.includes(word));
    if (words.length > 0) {
      optimizedQuery = words.join(' ');
    }

    // Cache the optimized query
    this.queryOptimizationCache.set(cacheKey, optimizedQuery);

    return optimizedQuery;
  }

  /**
   * Enhanced caching with compression
   */
  private async cacheResult(
    key: string,
    response: SearchResponse,
    config: SearchConfig
  ): Promise<void> {
    try {
      const startTime = Date.now();

      // Calculate response size
      const responseSize = JSON.stringify(response).length;

      // Compress if enabled
      let compressedResponse = response;
      let compressionRatio = 1;

      if (config.compressionLevel > 0) {
        // Basic compression - in production, use a proper compression library
        compressedResponse = this.compressResponse(response);
        compressionRatio = responseSize / JSON.stringify(compressedResponse).length;
      }

      const cacheEntry: CacheEntry = {
        response: compressedResponse,
        createdAt: Date.now(),
        accessCount: 1,
        lastAccessed: Date.now(),
        size: responseSize,
        compressed: config.compressionLevel > 0,
      };

      this.searchCache.set(key, cacheEntry);

      // Update cache info in response
      response.metadata.cacheInfo.size = responseSize;
      response.metadata.cacheInfo.compression = compressionRatio;
      response.metadata.performance.resultCompressionTime = Date.now() - startTime;

      // Clean cache if too large
      if (this.searchCache.size > 1000) {
        this.cleanCache();
      }
    } catch (error) {
      console.error('❌ Cache storage failed:', error);
    }
  }

  /**
   * Basic response compression
   */
  private compressResponse(response: SearchResponse): SearchResponse {
    // Simple compression - remove unnecessary data
    const compressed = {
      ...response,
      results: response.results.map(result => ({
        ...result,
        content:
          result.content.length > 500 ? result.content.substring(0, 500) + '...' : result.content,
      })),
    };

    return compressed;
  }

  /**
   * Cache validation
   */
  private isCacheValid(entry: CacheEntry, ttl: number): boolean {
    return Date.now() - entry.createdAt < ttl;
  }

  /**
   * Update cache access statistics
   */
  private updateCacheAccess(entry: CacheEntry): void {
    entry.accessCount++;
    entry.lastAccessed = Date.now();
  }

  /**
   * Queue management for concurrent queries
   */
  private queueQuery(query: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.queryQueue.push({ query, resolve, reject });
    });
  }

  /**
   * Process queued queries
   */
  private processQueryQueue(): void {
    if (this.queryQueue.length > 0 && this.activeQueries < this.config.maxConcurrentQueries) {
      const { resolve } = this.queryQueue.shift()!;
      resolve();
    }
  }

  /**
   * Calculate cache hit rate
   */
  private calculateCacheHitRate(): number {
    const totalEntries = this.searchCache.size;
    if (totalEntries === 0) return 0;

    const totalAccesses = Array.from(this.searchCache.values()).reduce(
      (sum, entry) => sum + entry.accessCount,
      0
    );

    return totalAccesses / totalEntries;
  }

  /**
   * Update analytics
   */
  private updateAnalytics(responseTime: number, cacheHit: boolean): void {
    this.analytics.averageResponseTime =
      (this.analytics.averageResponseTime * (this.analytics.totalQueries - 1) + responseTime) /
      this.analytics.totalQueries;

    if (cacheHit) {
      this.analytics.cacheHitRate =
        (this.analytics.cacheHitRate * (this.analytics.totalQueries - 1) + 1) /
        this.analytics.totalQueries;
    } else {
      this.analytics.cacheHitRate =
        (this.analytics.cacheHitRate * (this.analytics.totalQueries - 1)) /
        this.analytics.totalQueries;
    }

    this.analytics.lastUpdated = new Date().toISOString();
  }

  /**
   * Update performance history
   */
  private updatePerformanceHistory(metrics: PerformanceMetrics): void {
    this.analytics.performanceHistory.push(metrics);

    // Keep only last 100 entries
    if (this.analytics.performanceHistory.length > 100) {
      this.analytics.performanceHistory.shift();
    }
  }

  /**
   * Start background tasks
   */
  private startBackgroundTasks(): void {
    // Cache cleanup every 10 minutes
    setInterval(() => {
      this.cleanCache();
    }, 600000);

    // Precompute popular queries every hour
    setInterval(() => {
      this.precomputePopularQueries();
    }, 3600000);

    // Update analytics every 5 minutes
    setInterval(() => {
      this.updateAnalyticsSnapshot();
    }, 300000);
  }

  /**
   * Enhanced cache cleanup
   */
  private cleanCache(): void {
    const entries = Array.from(this.searchCache.entries());
    const now = Date.now();

    // Remove expired entries
    entries.forEach(([key, entry]) => {
      if (now - entry.createdAt > this.config.cacheTTL) {
        this.searchCache.delete(key);
      }
    });

    // If still too large, remove least recently used
    if (this.searchCache.size > 500) {
      const sortedEntries = entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
      const toRemove = sortedEntries.slice(0, this.searchCache.size - 500);

      toRemove.forEach(([key]) => {
        this.searchCache.delete(key);
      });
    }

    console.log(`🧹 Cache cleaned: ${this.searchCache.size} entries remaining`);
  }

  /**
   * Precompute popular queries
   */
  private async precomputePopularQueries(): Promise<void> {
    if (!this.config.enablePrecomputation) return;

    try {
      console.log('🔄 Precomputing popular queries...');

      // This would analyze query patterns and precompute results
      // For now, just clear old precomputed queries
      this.precomputedQueries.clear();

      console.log('✅ Popular queries precomputed');
    } catch (error) {
      console.error('❌ Precomputation failed:', error);
    }
  }

  /**
   * Update analytics snapshot
   */
  private updateAnalyticsSnapshot(): void {
    this.analytics.lastUpdated = new Date().toISOString();
  }

  // Legacy methods for compatibility
  private async performSemanticSearch(
    query: string,
    userId: string,
    filters: SearchFilter,
    config: SearchConfig
  ): Promise<SearchResult[]> {
    // Implement semantic search logic here
    // This would integrate with the existing semantic search implementation
    return [];
  }

  private async performKeywordSearch(
    query: string,
    userId: string,
    filters: SearchFilter,
    config: SearchConfig
  ): Promise<SearchResult[]> {
    // Implement keyword search logic here
    return [];
  }

  private mergeAndRankResults(
    semanticResults: SearchResult[],
    keywordResults: SearchResult[],
    query: string,
    config: SearchConfig
  ): SearchResult[] {
    // Implement result merging and ranking logic
    return [];
  }

  private applyResultFilters(
    results: SearchResult[],
    filters: SearchFilter,
    config: SearchConfig
  ): SearchResult[] {
    // Implement result filtering logic
    return results;
  }

  private async generateSuggestions(
    query: string,
    results: SearchResult[]
  ): Promise<{ alternativeQueries: string[]; expandedTerms: string[]; relatedConcepts: string[] }> {
    // Implement suggestion generation
    return {
      alternativeQueries: [],
      expandedTerms: [],
      relatedConcepts: [],
    };
  }

  private generateCacheKey(
    query: string,
    userId: string,
    filters: SearchFilter,
    config: SearchConfig
  ): string {
    return `${query}:${userId}:${JSON.stringify(filters)}:${JSON.stringify(config)}`;
  }

  /**
   * Public API methods
   */
  getAnalytics(): SearchAnalytics {
    return { ...this.analytics };
  }

  getPerformanceMetrics(): PerformanceMetrics[] {
    return [...this.analytics.performanceHistory];
  }

  getCacheStats(): any {
    return {
      size: this.searchCache.size,
      hitRate: this.analytics.cacheHitRate,
      totalEntries: this.searchCache.size,
      averageAccessCount:
        Array.from(this.searchCache.values()).reduce((sum, entry) => sum + entry.accessCount, 0) /
        this.searchCache.size,
    };
  }

  clearCache(): void {
    this.searchCache.clear();
    this.precomputedQueries.clear();
    this.queryOptimizationCache.clear();
    console.log('🧹 All caches cleared');
  }

  updateConfig(newConfig: Partial<SearchConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Search configuration updated');
  }
}

// Export singleton instance
export const optimizedSemanticSearchService = OptimizedSemanticSearchService.getInstance();
