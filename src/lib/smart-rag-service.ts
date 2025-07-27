/**
 * 🧠 Smart RAG Service - Phase 4 Day 17 Integration
 * Comprehensive smart context management combining optimization, source management, và quality control
 */

import {
  OptimizedSemanticSearchService,
  SearchResult,
  SearchResponse,
} from './semantic-search-service-optimized';
import { ContextQualityService, RerankingResult } from './context-quality-service';
import { ContextOptimizationService, OptimizedContext } from './context-optimization-service';
import { KnowledgeSourceManager, KnowledgeSource } from './knowledge-source-management';

export interface SmartRAGConfig {
  // Context optimization settings
  enableContextOptimization: boolean;
  enableSmartChunking: boolean;
  enableContextCompression: boolean;
  enableMultiTurnContext: boolean;

  // Source management settings
  enableSourceManagement: boolean;
  enableSourcePrioritization: boolean;
  enableCredibilityScoring: boolean;
  enableDynamicSources: boolean;

  // Quality control settings
  enableQualityControl: boolean;
  enableResultReranking: boolean;
  enableDuplicateDetection: boolean;

  // Performance settings
  enablePerformanceOptimization: boolean;
  enableCaching: boolean;
  enableParallelProcessing: boolean;

  // Integration settings
  maxContextTokens: number;
  maxSources: number;
  qualityThreshold: number;
  timeoutMs: number;
}

export interface SmartRAGRequest {
  query: string;
  userId: string;
  agentId: string;
  conversationId: string;

  // Context options
  contextOptions?: {
    includeConversationHistory: boolean;
    maxHistoryTurns: number;
    enableSummary: boolean;
  };

  // Source options
  sourceOptions?: {
    preferredSources?: string[];
    excludedSources?: string[];
    sourceTypes?: string[];
    priorityBoost?: { [sourceId: string]: number };
  };

  // Quality options
  qualityOptions?: {
    minRelevanceScore: number;
    enableDiversityFiltering: boolean;
    maxResultsPerSource: number;
  };
}

export interface SmartRAGResponse {
  // Core response data
  optimizedContext: OptimizedContext;
  searchResults: SearchResult[];
  sourcesUsed: KnowledgeSource[];

  // Processing metadata
  processing: {
    totalTime: number;
    searchTime: number;
    optimizationTime: number;
    qualityTime: number;
    sourceManagementTime: number;
  };

  // Quality metrics
  quality: {
    overallScore: number;
    relevanceScore: number;
    diversityScore: number;
    credibilityScore: number;
    coherenceScore: number;
  };

  // Source information
  sourceInfo: {
    totalSourcesAvailable: number;
    sourcesUsed: number;
    topSources: Array<{
      source: KnowledgeSource;
      contribution: number;
      relevance: number;
    }>;
    prioritization: Array<{
      sourceId: string;
      priority: number;
      reason: string;
    }>;
  };

  // Context information
  contextInfo: {
    originalTokenCount: number;
    optimizedTokenCount: number;
    compressionRatio: number;
    chunkingStrategy: string;
    conversationSummary?: string;
  };

  // Recommendations
  recommendations: {
    alternativeQueries: string[];
    relatedTopics: string[];
    suggestedSources: string[];
    followUpQuestions: string[];
  };

  // Debug information
  debug?: {
    searchSteps: string[];
    optimizationSteps: string[];
    qualitySteps: string[];
    sourceSteps: string[];
    errors: string[];
    warnings: string[];
  };
}

export const DEFAULT_SMART_RAG_CONFIG: SmartRAGConfig = {
  enableContextOptimization: true,
  enableSmartChunking: true,
  enableContextCompression: true,
  enableMultiTurnContext: true,

  enableSourceManagement: true,
  enableSourcePrioritization: true,
  enableCredibilityScoring: true,
  enableDynamicSources: true,

  enableQualityControl: true,
  enableResultReranking: true,
  enableDuplicateDetection: true,

  enablePerformanceOptimization: true,
  enableCaching: true,
  enableParallelProcessing: true,

  maxContextTokens: 4000,
  maxSources: 10,
  qualityThreshold: 0.6,
  timeoutMs: 30000,
};

export class SmartRAGService {
  private static instance: SmartRAGService;
  private config: SmartRAGConfig;

  // Service instances
  private searchService: OptimizedSemanticSearchService;
  private qualityService: ContextQualityService;
  private optimizationService: ContextOptimizationService;
  private sourceManager: KnowledgeSourceManager;

  // Performance tracking
  private requestCount: number = 0;
  private totalProcessingTime: number = 0;
  private averageQualityScore: number = 0;

  constructor(config: Partial<SmartRAGConfig> = {}) {
    this.config = { ...DEFAULT_SMART_RAG_CONFIG, ...config };

    // Initialize services
    this.searchService = OptimizedSemanticSearchService.getInstance();
    this.qualityService = ContextQualityService.getInstance();
    this.optimizationService = ContextOptimizationService.getInstance();
    this.sourceManager = KnowledgeSourceManager.getInstance();
  }

  static getInstance(config?: Partial<SmartRAGConfig>): SmartRAGService {
    if (!SmartRAGService.instance) {
      SmartRAGService.instance = new SmartRAGService(config);
    }
    return SmartRAGService.instance;
  }

  /**
   * 🎯 Main Smart RAG processing method
   */
  async processSmartRAG(request: SmartRAGRequest): Promise<SmartRAGResponse> {
    const startTime = Date.now();
    const debug: string[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    console.log(`🧠 Starting Smart RAG processing for query: "${request.query}"`);
    debug.push(`Starting Smart RAG processing for conversation ${request.conversationId}`);

    try {
      // Initialize response structure
      const response: Partial<SmartRAGResponse> = {
        processing: {
          totalTime: 0,
          searchTime: 0,
          optimizationTime: 0,
          qualityTime: 0,
          sourceManagementTime: 0,
        },
        debug: {
          searchSteps: [],
          optimizationSteps: [],
          qualitySteps: [],
          sourceSteps: [],
          errors: [],
          warnings: [],
        },
      };

      // Step 1: Perform initial semantic search
      const searchStepTime = Date.now();
      debug.push('Step 1: Performing initial semantic search');

      const searchResponse = await this.performEnhancedSearch(request);
      response.processing!.searchTime = Date.now() - searchStepTime;
      response.debug!.searchSteps.push(
        `Initial search returned ${searchResponse.results.length} results`
      );

      // Step 2: Apply source management
      const sourceStepTime = Date.now();
      debug.push('Step 2: Applying source management');

      const sourceFilteredResults = await this.applySourceManagement(
        searchResponse.results,
        request
      );
      response.processing!.sourceManagementTime = Date.now() - sourceStepTime;
      response.debug!.sourceSteps.push(
        `Source filtering yielded ${sourceFilteredResults.filteredResults.length} results`
      );

      // Step 3: Apply quality control
      const qualityStepTime = Date.now();
      debug.push('Step 3: Applying quality control');

      const qualityResults = await this.applyQualityControl(
        sourceFilteredResults.filteredResults,
        request.query
      );
      response.processing!.qualityTime = Date.now() - qualityStepTime;
      response.debug!.qualitySteps.push(
        `Quality control produced ${qualityResults.rerankedResults.length} optimized results`
      );

      // Step 4: Optimize context
      const optimizationStepTime = Date.now();
      debug.push('Step 4: Optimizing context');

      const optimizedContext = await this.optimizeContext(qualityResults.rerankedResults, request);
      response.processing!.optimizationTime = Date.now() - optimizationStepTime;
      response.debug!.optimizationSteps.push(
        `Context optimized to ${optimizedContext.tokenCount} tokens`
      );

      // Step 5: Generate recommendations
      debug.push('Step 5: Generating recommendations');

      const recommendations = await this.generateRecommendations(
        request,
        optimizedContext,
        sourceFilteredResults.sourcesUsed,
        qualityResults
      );

      // Step 6: Calculate final metrics
      debug.push('Step 6: Calculating final metrics');

      const qualityMetrics = this.calculateQualityMetrics(
        optimizedContext,
        sourceFilteredResults,
        qualityResults
      );

      const sourceInfo = this.buildSourceInfo(
        sourceFilteredResults,
        qualityResults.rerankedResults
      );

      const contextInfo = this.buildContextInfo(optimizedContext);

      // Finalize response
      const totalTime = Date.now() - startTime;
      response.processing!.totalTime = totalTime;

      const finalResponse: SmartRAGResponse = {
        optimizedContext,
        searchResults: qualityResults.rerankedResults,
        sourcesUsed: sourceFilteredResults.sourcesUsed,

        processing: response.processing!,
        quality: qualityMetrics,
        sourceInfo,
        contextInfo,
        recommendations,

        debug: {
          searchSteps: response.debug!.searchSteps,
          optimizationSteps: response.debug!.optimizationSteps,
          qualitySteps: response.debug!.qualitySteps,
          sourceSteps: response.debug!.sourceSteps,
          errors,
          warnings,
        },
      };

      // Update performance tracking
      this.updatePerformanceMetrics(totalTime, qualityMetrics.overallScore);

      console.log(`✅ Smart RAG processing completed in ${totalTime}ms`);
      console.log(
        `📊 Quality Score: ${qualityMetrics.overallScore.toFixed(2)}, Sources: ${sourceFilteredResults.sourcesUsed.length}, Context: ${optimizedContext.tokenCount} tokens`
      );

      return finalResponse;
    } catch (error) {
      console.error('❌ Smart RAG processing failed:', error);
      // ✅ FIXED IN Phase 4A - Handle unknown error type
      errors.push(`Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * 🔍 Enhanced search with parallel processing
   */
  private async performEnhancedSearch(request: SmartRAGRequest): Promise<SearchResponse> {
    const searchConfig = {
      enableCache: this.config.enableCaching,
      enableQueryOptimization: this.config.enablePerformanceOptimization,
      maxResults: this.config.maxSources * 5, // More results for filtering
      enableBatchProcessing: this.config.enableParallelProcessing,
    };

    return await this.searchService.search(
      request.query,
      request.userId,
      {
        agentId: request.agentId,
        // Add context-based filters
        ...request.qualityOptions,
      },
      searchConfig
    );
  }

  /**
   * 🗂️ Apply source management with prioritization
   */
  private async applySourceManagement(
    results: SearchResult[],
    request: SmartRAGRequest
  ): Promise<{
    filteredResults: SearchResult[];
    sourcesUsed: KnowledgeSource[];
    prioritization: Array<{ sourceId: string; priority: number; reason: string }>;
    qualityMetrics: any;
  }> {
    if (!this.config.enableSourceManagement) {
      return {
        filteredResults: results,
        sourcesUsed: [],
        prioritization: [],
        qualityMetrics: {},
      };
    }

    const sourceConfig = {
      enableSourceFiltering: true,
      enablePriorityOrdering: this.config.enableSourcePrioritization,
      enableCredibilityWeighting: this.config.enableCredibilityScoring,
      enableDynamicPrioritization: this.config.enableDynamicSources,
      maxSourcesPerQuery: this.config.maxSources,
    };

    // Apply source preferences from request
    if (request.sourceOptions?.preferredSources) {
      // Boost preferred sources
      for (const sourceId of request.sourceOptions.preferredSources) {
        const source = this.sourceManager.getSource(sourceId);
        if (source) {
          source.priority = Math.min(10, source.priority + 2);
        }
      }
    }

    if (request.sourceOptions?.excludedSources) {
      // Temporarily disable excluded sources
      for (const sourceId of request.sourceOptions.excludedSources) {
        this.sourceManager.disableSource(sourceId);
      }
    }

    const sourceResults = await this.sourceManager.retrieveFromSources(
      request.query,
      request.userId,
      results,
      {
        agentId: request.agentId,
        conversationId: request.conversationId,
        contextOptions: request.contextOptions,
      },
      sourceConfig
    );

    // Re-enable previously disabled sources
    if (request.sourceOptions?.excludedSources) {
      for (const sourceId of request.sourceOptions.excludedSources) {
        this.sourceManager.enableSource(sourceId);
      }
    }

    return sourceResults;
  }

  /**
   * 🎯 Apply quality control with reranking
   */
  private async applyQualityControl(
    results: SearchResult[],
    query: string
  ): Promise<RerankingResult> {
    if (!this.config.enableQualityControl) {
      return {
        rerankedResults: results,
        qualityMetrics: [],
        duplicateGroups: [],
        processingTime: 0,
        algorithm: 'none',
        improvements: {
          relevanceImprovement: 0,
          diversityImprovement: 0,
          qualityImprovement: 0,
        },
      };
    }

    const qualityConfig = {
      enableReranking: this.config.enableResultReranking,
      enableSemanticDuplicateDetection: this.config.enableDuplicateDetection,
      minQualityScore: this.config.qualityThreshold,
      rerankingAlgorithm: 'hybrid' as const,
    };

    return await this.qualityService.improveResultQuality(results, query, qualityConfig);
  }

  /**
   * 🧠 Optimize context with smart compression
   */
  private async optimizeContext(
    results: SearchResult[],
    request: SmartRAGRequest
  ): Promise<OptimizedContext> {
    if (!this.config.enableContextOptimization) {
      // Return basic context without optimization
      const content = results.map(r => r.content).join('\n\n');
      return {
        content,
        tokenCount: this.estimateTokenCount(content),
        relevanceScore: results.reduce((sum, r) => sum + r.relevanceScore, 0) / results.length,
        compressionRatio: 1.0,
        sources: results,
        metadata: {
          originalTokenCount: this.estimateTokenCount(content),
          compressionTime: 0,
          chunkingStrategy: 'none',
          qualityScore: 0.5,
          coherenceScore: 0.5,
          topicConsistency: 0.5,
        },
        keyInsights: [],
        entityMentions: {},
      };
    }

    const optimizationConfig = {
      maxContextTokens: this.config.maxContextTokens,
      enableSmartCompression: this.config.enableContextCompression,
      enableAdaptiveChunking: this.config.enableSmartChunking,
      enableContextPersistence: this.config.enableMultiTurnContext,

      chunkingStrategy: {
        type: 'adaptive' as const,
        maxChunkSize: 800,
        minChunkSize: 200,
        overlapSize: 100,
        preserveStructure: true,
        semanticThreshold: 0.8,
        adaptiveFactors: {
          contentDensity: 0.3,
          topicCoherence: 0.4,
          readability: 0.3,
        },
      },

      compressionConfig: {
        enabled: this.config.enableContextCompression,
        algorithm: 'hybrid' as const,
        compressionRatio: 0.7,
        preserveKeyEntities: true,
        maintainCoherence: true,
        maxCompressionTokens: Math.floor(this.config.maxContextTokens * 0.8),
        qualityThreshold: 0.8,
      },
    };

    return await this.optimizationService.optimizeContext(
      results,
      request.conversationId,
      request.query,
      optimizationConfig
    );
  }

  /**
   * 💡 Generate smart recommendations
   */
  private async generateRecommendations(
    request: SmartRAGRequest,
    optimizedContext: OptimizedContext,
    sources: KnowledgeSource[],
    qualityResults: RerankingResult
  ): Promise<{
    alternativeQueries: string[];
    relatedTopics: string[];
    suggestedSources: string[];
    followUpQuestions: string[];
  }> {
    const recommendations = {
      alternativeQueries: [] as string[],
      relatedTopics: [] as string[],
      suggestedSources: [] as string[],
      followUpQuestions: [] as string[],
    };

    // Generate alternative queries based on context
    const contextTopics = optimizedContext.keyInsights;
    const queryWords = request.query.toLowerCase().split(/\s+/);

    for (const topic of contextTopics.slice(0, 3)) {
      const alternativeQuery = this.generateAlternativeQuery(request.query, topic);
      if (alternativeQuery && !recommendations.alternativeQueries.includes(alternativeQuery)) {
        recommendations.alternativeQueries.push(alternativeQuery);
      }
    }

    // Extract related topics from entity mentions
    const entities = Object.keys(optimizedContext.entityMentions);
    recommendations.relatedTopics = entities
      .sort((a, b) => optimizedContext.entityMentions[b] - optimizedContext.entityMentions[a])
      .slice(0, 5);

    // Suggest additional sources that might be relevant
    const allSources = this.sourceManager.getAllSources();
    const unusedSources = allSources.filter(
      source =>
        source.enabled &&
        !sources.some(usedSource => usedSource.id === source.id) &&
        this.isSourceRelevantToQuery(source, request.query)
    );

    recommendations.suggestedSources = unusedSources
      .sort((a, b) => b.credibilityScore - a.credibilityScore)
      .slice(0, 3)
      .map(source => source.name);

    // Generate follow-up questions based on content gaps
    recommendations.followUpQuestions = this.generateFollowUpQuestions(
      request.query,
      optimizedContext,
      qualityResults
    );

    return recommendations;
  }

  /**
   * 📊 Calculate comprehensive quality metrics
   */
  private calculateQualityMetrics(
    optimizedContext: OptimizedContext,
    sourceResults: any,
    qualityResults: RerankingResult
  ): {
    overallScore: number;
    relevanceScore: number;
    diversityScore: number;
    credibilityScore: number;
    coherenceScore: number;
  } {
    const relevanceScore = optimizedContext.relevanceScore;
    const diversityScore = this.calculateDiversityScore(sourceResults.sourcesUsed);
    const credibilityScore = sourceResults.qualityMetrics.averageCredibility;
    const coherenceScore = optimizedContext.metadata.coherenceScore;

    const overallScore =
      relevanceScore * 0.3 + diversityScore * 0.2 + credibilityScore * 0.25 + coherenceScore * 0.25;

    return {
      overallScore,
      relevanceScore,
      diversityScore,
      credibilityScore,
      coherenceScore,
    };
  }

  private buildSourceInfo(
    sourceResults: any,
    finalResults: SearchResult[]
  ): SmartRAGResponse['sourceInfo'] {
    const sourcesUsed = sourceResults.sourcesUsed;
    const sourceContributions = new Map<string, { contribution: number; relevance: number }>();

    // Calculate each source's contribution
    for (const result of finalResults) {
      const sourceId = this.extractSourceId(result);
      if (sourceId) {
        const current = sourceContributions.get(sourceId) || { contribution: 0, relevance: 0 };
        current.contribution += 1;
        current.relevance += result.relevanceScore;
        sourceContributions.set(sourceId, current);
      }
    }

    // ✅ FIXED IN Phase 4A - Add type annotation to fix implicit any
    const topSources = sourcesUsed
      .map((source: KnowledgeSource) => {
        const stats = sourceContributions.get(source.id) || { contribution: 0, relevance: 0 };
        return {
          source,
          contribution: stats.contribution,
          relevance: stats.contribution > 0 ? stats.relevance / stats.contribution : 0,
        };
        // ✅ FIXED IN Phase 4A - Add type annotations to fix implicit any
      })
      .sort((a: any, b: any) => b.contribution - a.contribution);

    return {
      totalSourcesAvailable: this.sourceManager.getEnabledSources().length,
      sourcesUsed: sourcesUsed.length,
      topSources,
      prioritization: sourceResults.prioritization,
    };
  }

  private buildContextInfo(optimizedContext: OptimizedContext): SmartRAGResponse['contextInfo'] {
    return {
      originalTokenCount: optimizedContext.metadata.originalTokenCount,
      optimizedTokenCount: optimizedContext.tokenCount,
      compressionRatio: optimizedContext.compressionRatio,
      chunkingStrategy: optimizedContext.metadata.chunkingStrategy,
      conversationSummary: optimizedContext.conversationSummary,
    };
  }

  // Helper methods
  private estimateTokenCount(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private generateAlternativeQuery(originalQuery: string, topic: string): string {
    const queryWords = originalQuery.split(/\s+/);
    const topicWords = topic.split(/\s+/);

    // Simple alternative generation - replace one word with topic
    if (queryWords.length > 1 && topicWords.length > 0) {
      const modifiedWords = [...queryWords];
      modifiedWords[modifiedWords.length - 1] = topicWords[0];
      return modifiedWords.join(' ');
    }

    return `${originalQuery} ${topic}`;
  }

  private isSourceRelevantToQuery(source: KnowledgeSource, query: string): boolean {
    const queryWords = query.toLowerCase().split(/\s+/);
    const sourceName = source.name.toLowerCase();
    const sourceDescription = source.description.toLowerCase();
    const sourceTags = source.metadata.tags.map(tag => tag.toLowerCase());

    return queryWords.some(
      word =>
        sourceName.includes(word) ||
        sourceDescription.includes(word) ||
        sourceTags.some(tag => tag.includes(word))
    );
  }

  private generateFollowUpQuestions(
    originalQuery: string,
    context: OptimizedContext,
    qualityResults: RerankingResult
  ): string[] {
    const questions: string[] = [];
    const entities = Object.keys(context.entityMentions).slice(0, 3);

    // Generate entity-based questions
    for (const entity of entities) {
      questions.push(`How does ${entity} relate to ${originalQuery}?`);
      questions.push(`What are the implications of ${entity}?`);
    }

    // Generate insight-based questions
    for (const insight of context.keyInsights.slice(0, 2)) {
      questions.push(`Can you elaborate on: ${insight}?`);
    }

    return questions.slice(0, 4);
  }

  private calculateDiversityScore(sources: KnowledgeSource[]): number {
    if (sources.length <= 1) return 1.0;

    const types = new Set(sources.map(s => s.type));
    const typesDiversity = types.size / 6; // 6 possible types

    const credibilityVariance = this.calculateVariance(sources.map(s => s.credibilityScore));

    return Math.min(1.0, typesDiversity * 0.6 + credibilityVariance * 0.4);
  }

  private calculateVariance(values: number[]): number {
    if (values.length <= 1) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;

    return Math.sqrt(variance);
  }

  private extractSourceId(result: SearchResult): string | null {
    return result.metadata?.sourceId || null;
  }

  private updatePerformanceMetrics(processingTime: number, qualityScore: number): void {
    this.requestCount++;
    this.totalProcessingTime += processingTime;

    const alpha = 0.1; // Learning rate for exponential moving average
    this.averageQualityScore = this.averageQualityScore * (1 - alpha) + qualityScore * alpha;
  }

  // Public API methods
  getConfig(): SmartRAGConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<SmartRAGConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getPerformanceStats(): {
    requestCount: number;
    averageProcessingTime: number;
    averageQualityScore: number;
  } {
    return {
      requestCount: this.requestCount,
      averageProcessingTime:
        this.requestCount > 0 ? this.totalProcessingTime / this.requestCount : 0,
      averageQualityScore: this.averageQualityScore,
    };
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: {
      search: boolean;
      quality: boolean;
      optimization: boolean;
      sourceManagement: boolean;
    };
    metrics: {
      totalSources: number;
      enabledSources: number;
      averageQuality: number;
    };
  }> {
    try {
      const services = {
        search: !!this.searchService,
        quality: !!this.qualityService,
        optimization: !!this.optimizationService,
        sourceManagement: !!this.sourceManager,
      };

      const allHealthy = Object.values(services).every(Boolean);
      const sourceStats = this.sourceManager.getAnalytics();

      return {
        status: allHealthy ? 'healthy' : 'degraded',
        services,
        metrics: {
          totalSources: sourceStats.totalSources,
          enabledSources: sourceStats.enabledSources,
          averageQuality: this.averageQualityScore,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        services: {
          search: false,
          quality: false,
          optimization: false,
          sourceManagement: false,
        },
        metrics: {
          totalSources: 0,
          enabledSources: 0,
          averageQuality: 0,
        },
      };
    }
  }
}

export const smartRAGService = SmartRAGService.getInstance();
