/**
 * 🗂️ Knowledge Source Management Service - Phase 4 Day 17 Step 17.2
 * Advanced knowledge source management với prioritization, credibility scoring, granular controls
 */

import { SearchResult } from './semantic-search-service-optimized';

export interface KnowledgeSource {
  id: string;
  name: string;
  type: 'document' | 'conversation' | 'web' | 'database' | 'api' | 'manual';
  description: string;

  // Source metadata
  metadata: {
    filename?: string;
    uploadDate: string;
    lastModified: string;
    fileSize?: number;
    format?: string;
    language?: string;
    author?: string;
    version?: string;
    tags: string[];
  };

  // Source status and controls
  enabled: boolean;
  priority: number; // 1-10, higher = more important
  credibilityScore: number; // 0-1, calculated automatically
  userRating?: number; // 1-5, user-provided rating

  // Usage statistics
  usage: {
    totalQueries: number;
    successfulRetrievals: number;
    averageRelevance: number;
    lastUsed: string;
    totalTokensGenerated: number;
    feedbackScore: number; // Based on user feedback
  };

  // Source configuration
  config: {
    maxChunksPerQuery: number;
    relevanceThreshold: number;
    enablePreprocessing: boolean;
    customPrompts?: string[];
    excludePatterns?: string[];
    includePatterns?: string[];
  };

  // Quality metrics
  quality: {
    accuracy: number;
    completeness: number;
    timeliness: number;
    consistency: number;
    reliability: number;
  };
}

export interface SourcePriorityRule {
  id: string;
  name: string;
  condition: string; // Query pattern or context condition
  sourceIds: string[];
  priorityMultiplier: number;
  enabled: boolean;
}

export interface SourceRetrievalConfig {
  enableSourceFiltering: boolean;
  enablePriorityOrdering: boolean;
  enableCredibilityWeighting: boolean;
  enableDynamicPrioritization: boolean;

  // Source selection
  maxSourcesPerQuery: number;
  minCredibilityThreshold: number;
  priorityWeightFactor: number;
  diversityWeight: number;

  // Quality control
  enableQualityFiltering: boolean;
  minQualityScore: number;
  enableSourceVerification: boolean;
  enableContentValidation: boolean;

  // Performance settings
  enableSourceCaching: boolean;
  cacheTimeout: number;
  enableParallelRetrieval: boolean;
  maxConcurrentSources: number;
}

export interface SourceAnalytics {
  totalSources: number;
  enabledSources: number;
  averageCredibility: number;
  topPerformingSources: Array<{
    sourceId: string;
    name: string;
    score: number;
    usageCount: number;
  }>;
  sourceDistribution: {
    byType: { [type: string]: number };
    byCredibility: { low: number; medium: number; high: number };
    byUsage: { active: number; moderate: number; unused: number };
  };
  qualityTrends: Array<{
    date: string;
    averageQuality: number;
    sourceCount: number;
  }>;
}

export const DEFAULT_SOURCE_CONFIG: SourceRetrievalConfig = {
  enableSourceFiltering: true,
  enablePriorityOrdering: true,
  enableCredibilityWeighting: true,
  enableDynamicPrioritization: true,

  maxSourcesPerQuery: 10,
  minCredibilityThreshold: 0.3,
  priorityWeightFactor: 2.0,
  diversityWeight: 0.2,

  enableQualityFiltering: true,
  minQualityScore: 0.5,
  enableSourceVerification: true,
  enableContentValidation: true,

  enableSourceCaching: true,
  cacheTimeout: 300000, // 5 minutes
  enableParallelRetrieval: true,
  maxConcurrentSources: 5,
};

export class KnowledgeSourceManager {
  private static instance: KnowledgeSourceManager;
  private sources: Map<string, KnowledgeSource> = new Map();
  private priorityRules: Map<string, SourcePriorityRule> = new Map();
  private config: SourceRetrievalConfig;
  private sourceCache: Map<string, { results: SearchResult[]; timestamp: number }> = new Map();
  private analytics: SourceAnalytics;

  constructor(config: Partial<SourceRetrievalConfig> = {}) {
    this.config = { ...DEFAULT_SOURCE_CONFIG, ...config };
    this.analytics = this.initializeAnalytics();
    this.startAnalyticsUpdates();
  }

  static getInstance(config?: Partial<SourceRetrievalConfig>): KnowledgeSourceManager {
    if (!KnowledgeSourceManager.instance) {
      KnowledgeSourceManager.instance = new KnowledgeSourceManager(config);
    }
    return KnowledgeSourceManager.instance;
  }

  /**
   * 🗂️ Main source-aware retrieval method
   */
  async retrieveFromSources(
    query: string,
    userId: string,
    allResults: SearchResult[],
    context?: any,
    config: Partial<SourceRetrievalConfig> = {}
  ): Promise<{
    filteredResults: SearchResult[];
    sourcesUsed: KnowledgeSource[];
    prioritization: Array<{ sourceId: string; priority: number; reason: string }>;
    qualityMetrics: {
      averageCredibility: number;
      sourceDistribution: string[];
      qualityScore: number;
    };
  }> {
    const startTime = Date.now();
    const retrievalConfig = { ...this.config, ...config };

    console.log(`🗂️ Starting source-aware retrieval for query: "${query}"`);

    try {
      // Apply dynamic prioritization based on query and context
      const dynamicPriorities = retrievalConfig.enableDynamicPrioritization
        ? await this.calculateDynamicPriorities(query, context)
        : new Map();

      // Filter and prioritize sources
      const availableSources = await this.getAvailableSources(retrievalConfig);
      const prioritizedSources = this.prioritizeSources(
        availableSources,
        dynamicPriorities,
        retrievalConfig
      );

      // Filter results by source availability and quality
      const sourceFilteredResults = await this.filterResultsBySources(
        allResults,
        prioritizedSources,
        retrievalConfig
      );

      // Apply source-specific processing
      const processedResults = await this.applySourceSpecificProcessing(
        sourceFilteredResults,
        prioritizedSources,
        retrievalConfig
      );

      // Apply final quality and diversity filtering
      const finalResults = this.applyFinalFiltering(processedResults, retrievalConfig);

      // Update source usage statistics
      await this.updateSourceUsageStats(finalResults, query);

      // Prepare response metadata
      const sourcesUsed = this.getSourcesFromResults(finalResults);
      const prioritization = this.generatePrioritizationReport(
        prioritizedSources,
        dynamicPriorities
      );
      const qualityMetrics = this.calculateQualityMetrics(finalResults, sourcesUsed);

      const processingTime = Date.now() - startTime;
      console.log(`✅ Source-aware retrieval completed in ${processingTime}ms`);
      console.log(`📊 Used ${sourcesUsed.length} sources, ${finalResults.length} results`);

      return {
        filteredResults: finalResults,
        sourcesUsed,
        prioritization,
        qualityMetrics,
      };
    } catch (error) {
      console.error('❌ Source-aware retrieval failed:', error);
      throw error;
    }
  }

  /**
   * 📝 Source management methods
   */
  async registerSource(sourceData: Partial<KnowledgeSource>): Promise<KnowledgeSource> {
    const sourceId =
      sourceData.id || `source_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const source: KnowledgeSource = {
      id: sourceId,
      name: sourceData.name || 'Unnamed Source',
      type: sourceData.type || 'document',
      description: sourceData.description || '',

      metadata: {
        uploadDate: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        tags: [],
        ...sourceData.metadata,
      },

      enabled: sourceData.enabled !== undefined ? sourceData.enabled : true,
      priority: sourceData.priority || 5,
      credibilityScore: sourceData.credibilityScore || 0.5,
      userRating: sourceData.userRating,

      usage: {
        totalQueries: 0,
        successfulRetrievals: 0,
        averageRelevance: 0,
        lastUsed: new Date().toISOString(),
        totalTokensGenerated: 0,
        feedbackScore: 0,
        ...sourceData.usage,
      },

      config: {
        maxChunksPerQuery: 5,
        relevanceThreshold: 0.5,
        enablePreprocessing: true,
        ...sourceData.config,
      },

      quality: {
        accuracy: 0.5,
        completeness: 0.5,
        timeliness: 0.5,
        consistency: 0.5,
        reliability: 0.5,
        ...sourceData.quality,
      },
    };

    // Calculate initial credibility score
    source.credibilityScore = await this.calculateCredibilityScore(source);

    this.sources.set(sourceId, source);
    this.updateAnalytics();

    console.log(`📝 Registered source: ${source.name} (ID: ${sourceId})`);
    return source;
  }

  async updateSource(
    sourceId: string,
    updates: Partial<KnowledgeSource>
  ): Promise<KnowledgeSource> {
    const source = this.sources.get(sourceId);
    if (!source) {
      throw new Error(`Source not found: ${sourceId}`);
    }

    const updatedSource = {
      ...source,
      ...updates,
      metadata: {
        ...source.metadata,
        ...updates.metadata,
        lastModified: new Date().toISOString(),
      },
    };

    // Recalculate credibility score if relevant fields changed
    if (updates.quality || updates.usage || updates.userRating) {
      updatedSource.credibilityScore = await this.calculateCredibilityScore(updatedSource);
    }

    this.sources.set(sourceId, updatedSource);
    this.updateAnalytics();

    console.log(`📝 Updated source: ${updatedSource.name}`);
    return updatedSource;
  }

  enableSource(sourceId: string): void {
    const source = this.sources.get(sourceId);
    if (source) {
      source.enabled = true;
      source.metadata.lastModified = new Date().toISOString();
      this.updateAnalytics();
      console.log(`✅ Enabled source: ${source.name}`);
    }
  }

  disableSource(sourceId: string): void {
    const source = this.sources.get(sourceId);
    if (source) {
      source.enabled = false;
      source.metadata.lastModified = new Date().toISOString();
      this.updateAnalytics();
      console.log(`❌ Disabled source: ${source.name}`);
    }
  }

  deleteSource(sourceId: string): boolean {
    const source = this.sources.get(sourceId);
    if (source) {
      this.sources.delete(sourceId);
      this.updateAnalytics();
      console.log(`🗑️ Deleted source: ${source.name}`);
      return true;
    }
    return false;
  }

  /**
   * 🎯 Priority rule management
   */
  addPriorityRule(rule: Omit<SourcePriorityRule, 'id'>): SourcePriorityRule {
    const ruleId = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const priorityRule: SourcePriorityRule = {
      id: ruleId,
      ...rule,
    };

    this.priorityRules.set(ruleId, priorityRule);
    console.log(`📋 Added priority rule: ${priorityRule.name}`);
    return priorityRule;
  }

  updatePriorityRule(
    ruleId: string,
    updates: Partial<SourcePriorityRule>
  ): SourcePriorityRule | null {
    const rule = this.priorityRules.get(ruleId);
    if (rule) {
      const updatedRule = { ...rule, ...updates };
      this.priorityRules.set(ruleId, updatedRule);
      console.log(`📋 Updated priority rule: ${updatedRule.name}`);
      return updatedRule;
    }
    return null;
  }

  deletePriorityRule(ruleId: string): boolean {
    const rule = this.priorityRules.get(ruleId);
    if (rule) {
      this.priorityRules.delete(ruleId);
      console.log(`🗑️ Deleted priority rule: ${rule.name}`);
      return true;
    }
    return false;
  }

  /**
   * 🔍 Source filtering and prioritization
   */
  private async getAvailableSources(config: SourceRetrievalConfig): Promise<KnowledgeSource[]> {
    const availableSources = Array.from(this.sources.values()).filter(source => {
      // Basic availability checks
      if (!source.enabled) return false;
      if (source.credibilityScore < config.minCredibilityThreshold) return false;
      if (config.enableQualityFiltering) {
        const overallQuality = this.calculateOverallQuality(source.quality);
        if (overallQuality < config.minQualityScore) return false;
      }

      return true;
    });

    // Sort by priority and credibility
    availableSources.sort((a, b) => {
      const priorityDiff = b.priority - a.priority;
      if (priorityDiff !== 0) return priorityDiff;
      return b.credibilityScore - a.credibilityScore;
    });

    return availableSources.slice(0, config.maxSourcesPerQuery);
  }

  private prioritizeSources(
    sources: KnowledgeSource[],
    dynamicPriorities: Map<string, number>,
    config: SourceRetrievalConfig
  ): Array<{ source: KnowledgeSource; finalPriority: number; factors: any }> {
    return sources
      .map(source => {
        let finalPriority = source.priority;
        const factors: any = {
          basePriority: source.priority,
          credibilityScore: source.credibilityScore,
          dynamicBoost: 0,
          usageHistory: 0,
          qualityScore: 0,
        };

        // Apply dynamic prioritization
        if (dynamicPriorities.has(source.id)) {
          const dynamicBoost = dynamicPriorities.get(source.id)! * config.priorityWeightFactor;
          finalPriority += dynamicBoost;
          factors.dynamicBoost = dynamicBoost;
        }

        // Apply usage history boost
        if (source.usage.averageRelevance > 0.8) {
          const usageBoost = 1.0;
          finalPriority += usageBoost;
          factors.usageHistory = usageBoost;
        }

        // Apply quality boost
        const qualityScore = this.calculateOverallQuality(source.quality);
        const qualityBoost = qualityScore * 2.0;
        finalPriority += qualityBoost;
        factors.qualityScore = qualityBoost;

        // Apply credibility weighting
        if (config.enableCredibilityWeighting) {
          finalPriority *= 1 + source.credibilityScore;
        }

        return {
          source,
          finalPriority,
          factors,
        };
      })
      .sort((a, b) => b.finalPriority - a.finalPriority);
  }

  private async calculateDynamicPriorities(
    query: string,
    context?: any
  ): Promise<Map<string, number>> {
    const dynamicPriorities = new Map<string, number>();

    // Apply priority rules
    for (const rule of this.priorityRules.values()) {
      if (!rule.enabled) continue;

      const matches = await this.evaluatePriorityRule(rule, query, context);
      if (matches) {
        for (const sourceId of rule.sourceIds) {
          const currentPriority = dynamicPriorities.get(sourceId) || 0;
          dynamicPriorities.set(sourceId, Math.max(currentPriority, rule.priorityMultiplier));
        }
      }
    }

    // Apply query-based prioritization
    const queryKeywords = query.toLowerCase().split(/\s+/);
    for (const source of this.sources.values()) {
      if (!source.enabled) continue;

      let relevanceBoost = 0;

      // Check tags for query relevance
      for (const tag of source.metadata.tags) {
        if (queryKeywords.some(keyword => tag.toLowerCase().includes(keyword))) {
          relevanceBoost += 0.5;
        }
      }

      // Check description for relevance
      if (source.description) {
        const descriptionWords = source.description.toLowerCase().split(/\s+/);
        const matchingWords = queryKeywords.filter(keyword =>
          descriptionWords.some(word => word.includes(keyword))
        );
        relevanceBoost += matchingWords.length * 0.2;
      }

      if (relevanceBoost > 0) {
        const existingPriority = dynamicPriorities.get(source.id) || 0;
        dynamicPriorities.set(source.id, existingPriority + relevanceBoost);
      }
    }

    return dynamicPriorities;
  }

  private async evaluatePriorityRule(
    rule: SourcePriorityRule,
    query: string,
    context?: any
  ): Promise<boolean> {
    // Simple rule evaluation - in a real implementation, this would be more sophisticated
    const condition = rule.condition.toLowerCase();
    const queryLower = query.toLowerCase();

    // Support basic pattern matching
    if (condition.startsWith('contains:')) {
      const term = condition.replace('contains:', '').trim();
      return queryLower.includes(term);
    }

    if (condition.startsWith('type:')) {
      const type = condition.replace('type:', '').trim();
      return context?.type === type;
    }

    if (condition.startsWith('tag:')) {
      const tag = condition.replace('tag:', '').trim();
      return context?.tags?.includes(tag);
    }

    // Default: check if condition appears in query
    return queryLower.includes(condition);
  }

  private async filterResultsBySources(
    results: SearchResult[],
    prioritizedSources: Array<{ source: KnowledgeSource; finalPriority: number; factors: any }>,
    config: SourceRetrievalConfig
  ): Promise<SearchResult[]> {
    const sourceIds = new Set(prioritizedSources.map(ps => ps.source.id));

    return results.filter(result => {
      // Check if result belongs to an available source
      const sourceId = this.extractSourceIdFromResult(result);
      if (!sourceId || !sourceIds.has(sourceId)) {
        return false;
      }

      // Apply source-specific filters
      const source = this.sources.get(sourceId);
      if (!source) return false;

      // Check source-specific relevance threshold
      if (result.relevanceScore < source.config.relevanceThreshold) {
        return false;
      }

      // Check source-specific patterns
      if (source.config.excludePatterns) {
        for (const pattern of source.config.excludePatterns) {
          if (result.content.toLowerCase().includes(pattern.toLowerCase())) {
            return false;
          }
        }
      }

      if (source.config.includePatterns && source.config.includePatterns.length > 0) {
        const hasIncludePattern = source.config.includePatterns.some(pattern =>
          result.content.toLowerCase().includes(pattern.toLowerCase())
        );
        if (!hasIncludePattern) {
          return false;
        }
      }

      return true;
    });
  }

  private async applySourceSpecificProcessing(
    results: SearchResult[],
    prioritizedSources: Array<{ source: KnowledgeSource; finalPriority: number; factors: any }>,
    config: SourceRetrievalConfig
  ): Promise<SearchResult[]> {
    const sourceMap = new Map(prioritizedSources.map(ps => [ps.source.id, ps]));

    return results.map(result => {
      const sourceId = this.extractSourceIdFromResult(result);

      // Skip if sourceId is null
      if (!sourceId) return result;

      const prioritizedSource = sourceMap.get(sourceId);

      if (!prioritizedSource) return result;

      const { source, finalPriority } = prioritizedSource;

      // Apply source priority to result scoring
      const enhancedResult = {
        ...result,
        combinedScore: result.combinedScore * (1 + finalPriority / 10),
        metadata: {
          ...result.metadata,
          sourcePriority: finalPriority,
          sourceCredibility: source.credibilityScore,
          sourceType: source.type,
          sourceEnabled: source.enabled,
        },
      };

      // Apply source-specific custom prompts or processing
      if (source.config.customPrompts && source.config.customPrompts.length > 0) {
        enhancedResult.metadata.customPrompts = source.config.customPrompts;
      }

      return enhancedResult;
    });
  }

  private applyFinalFiltering(
    results: SearchResult[],
    config: SourceRetrievalConfig
  ): SearchResult[] {
    // Sort by enhanced combined score
    const sortedResults = results.sort((a, b) => b.combinedScore - a.combinedScore);

    // Apply diversity filtering if enabled
    if (config.diversityWeight > 0) {
      return this.applyDiversityFiltering(sortedResults, config);
    }

    return sortedResults;
  }

  private applyDiversityFiltering(
    results: SearchResult[],
    config: SourceRetrievalConfig
  ): SearchResult[] {
    const diverseResults: SearchResult[] = [];
    const usedSources = new Set<string>();

    for (const result of results) {
      const sourceId = this.extractSourceIdFromResult(result);

      // If diversity is important and we already have results from this source
      if (sourceId && usedSources.has(sourceId) && diverseResults.length >= 3) {
        // Apply diversity penalty
        const diversityPenalty = config.diversityWeight;
        result.combinedScore *= 1 - diversityPenalty;
      }

      diverseResults.push(result);
      if (sourceId) {
        usedSources.add(sourceId);
      }
    }

    // Re-sort after diversity adjustments
    return diverseResults.sort((a, b) => b.combinedScore - a.combinedScore);
  }

  /**
   * 📊 Analytics and scoring
   */
  private async calculateCredibilityScore(source: KnowledgeSource): Promise<number> {
    let credibilityScore = 0;

    // Base credibility from source type
    const typeCredibility = {
      database: 0.9,
      document: 0.7,
      api: 0.8,
      web: 0.5,
      conversation: 0.6,
      manual: 0.8,
    };
    credibilityScore += (typeCredibility[source.type] || 0.5) * 0.3;

    // Quality-based credibility
    const qualityScore = this.calculateOverallQuality(source.quality);
    credibilityScore += qualityScore * 0.3;

    // Usage-based credibility
    if (source.usage.totalQueries > 0) {
      const successRate = source.usage.successfulRetrievals / source.usage.totalQueries;
      credibilityScore += successRate * 0.2;
      credibilityScore += Math.min(source.usage.averageRelevance, 1.0) * 0.1;
    } else {
      credibilityScore += 0.15; // Default for new sources
    }

    // User rating influence
    if (source.userRating) {
      const normalizedRating = source.userRating / 5.0;
      credibilityScore += normalizedRating * 0.1;
    } else {
      credibilityScore += 0.05; // Default when no rating
    }

    return Math.max(0, Math.min(1, credibilityScore));
  }

  private calculateOverallQuality(quality: KnowledgeSource['quality']): number {
    const weights = {
      accuracy: 0.25,
      completeness: 0.2,
      timeliness: 0.15,
      consistency: 0.2,
      reliability: 0.2,
    };

    return (
      quality.accuracy * weights.accuracy +
      quality.completeness * weights.completeness +
      quality.timeliness * weights.timeliness +
      quality.consistency * weights.consistency +
      quality.reliability * weights.reliability
    );
  }

  private async updateSourceUsageStats(results: SearchResult[], query: string): Promise<void> {
    const sourceUsage = new Map<string, { count: number; relevanceSum: number }>();

    // Collect usage data
    for (const result of results) {
      const sourceId = this.extractSourceIdFromResult(result);
      if (sourceId) {
        const current = sourceUsage.get(sourceId) || { count: 0, relevanceSum: 0 };
        current.count += 1;
        current.relevanceSum += result.relevanceScore;
        sourceUsage.set(sourceId, current);
      }
    }

    // Update source statistics
    for (const [sourceId, usage] of sourceUsage.entries()) {
      const source = this.sources.get(sourceId);
      if (source) {
        source.usage.totalQueries += 1;
        source.usage.successfulRetrievals += usage.count;
        source.usage.lastUsed = new Date().toISOString();

        // Update average relevance (exponential moving average)
        const alpha = 0.1; // Learning rate
        const newAvgRelevance = usage.relevanceSum / usage.count;
        source.usage.averageRelevance =
          source.usage.averageRelevance * (1 - alpha) + newAvgRelevance * alpha;

        // Recalculate credibility score periodically
        if (source.usage.totalQueries % 10 === 0) {
          source.credibilityScore = await this.calculateCredibilityScore(source);
        }
      }
    }
  }

  private extractSourceIdFromResult(result: SearchResult): string | null {
    // Extract source ID from result metadata or document ID
    if (result.metadata?.sourceId) {
      return result.metadata.sourceId;
    }

    if (result.documentId) {
      // Try to map document ID to source ID
      for (const source of this.sources.values()) {
        if (
          result.documentId.includes(source.id) ||
          source.metadata.filename === result.source?.filename
        ) {
          return source.id;
        }
      }
    }

    return null;
  }

  private getSourcesFromResults(results: SearchResult[]): KnowledgeSource[] {
    const sourceIds = new Set<string>();
    const sources: KnowledgeSource[] = [];

    for (const result of results) {
      const sourceId = this.extractSourceIdFromResult(result);
      if (sourceId && !sourceIds.has(sourceId)) {
        const source = this.sources.get(sourceId);
        if (source) {
          sources.push(source);
          sourceIds.add(sourceId);
        }
      }
    }

    return sources;
  }

  private generatePrioritizationReport(
    prioritizedSources: Array<{ source: KnowledgeSource; finalPriority: number; factors: any }>,
    dynamicPriorities: Map<string, number>
  ): Array<{ sourceId: string; priority: number; reason: string }> {
    return prioritizedSources.map(ps => {
      const { source, finalPriority, factors } = ps;
      const reasons: string[] = [];

      if (factors.basePriority > 5) reasons.push('High base priority');
      if (factors.credibilityScore > 0.7) reasons.push('High credibility');
      if (factors.dynamicBoost > 0) reasons.push('Query relevance boost');
      if (factors.usageHistory > 0) reasons.push('Strong usage history');
      if (factors.qualityScore > 1) reasons.push('High quality score');

      return {
        sourceId: source.id,
        priority: finalPriority,
        reason: reasons.length > 0 ? reasons.join(', ') : 'Default prioritization',
      };
    });
  }

  private calculateQualityMetrics(
    results: SearchResult[],
    sources: KnowledgeSource[]
  ): {
    averageCredibility: number;
    sourceDistribution: string[];
    qualityScore: number;
  } {
    const averageCredibility =
      sources.length > 0
        ? sources.reduce((sum, s) => sum + s.credibilityScore, 0) / sources.length
        : 0;

    const sourceDistribution = sources.map(s => `${s.name} (${s.type})`);

    const qualityScore =
      results.length > 0
        ? results.reduce((sum, r) => sum + r.relevanceScore, 0) / results.length
        : 0;

    return {
      averageCredibility,
      sourceDistribution,
      qualityScore,
    };
  }

  private initializeAnalytics(): SourceAnalytics {
    return {
      totalSources: 0,
      enabledSources: 0,
      averageCredibility: 0,
      topPerformingSources: [],
      sourceDistribution: {
        byType: {},
        byCredibility: { low: 0, medium: 0, high: 0 },
        byUsage: { active: 0, moderate: 0, unused: 0 },
      },
      qualityTrends: [],
    };
  }

  private updateAnalytics(): void {
    const sources = Array.from(this.sources.values());

    this.analytics.totalSources = sources.length;
    this.analytics.enabledSources = sources.filter(s => s.enabled).length;
    this.analytics.averageCredibility =
      sources.length > 0
        ? sources.reduce((sum, s) => sum + s.credibilityScore, 0) / sources.length
        : 0;

    // Update source distribution
    this.analytics.sourceDistribution.byType = {};
    this.analytics.sourceDistribution.byCredibility = { low: 0, medium: 0, high: 0 };
    this.analytics.sourceDistribution.byUsage = { active: 0, moderate: 0, unused: 0 };

    for (const source of sources) {
      // By type
      this.analytics.sourceDistribution.byType[source.type] =
        (this.analytics.sourceDistribution.byType[source.type] || 0) + 1;

      // By credibility
      if (source.credibilityScore < 0.4) {
        this.analytics.sourceDistribution.byCredibility.low++;
      } else if (source.credibilityScore < 0.7) {
        this.analytics.sourceDistribution.byCredibility.medium++;
      } else {
        this.analytics.sourceDistribution.byCredibility.high++;
      }

      // By usage
      if (source.usage.totalQueries > 20) {
        this.analytics.sourceDistribution.byUsage.active++;
      } else if (source.usage.totalQueries > 5) {
        this.analytics.sourceDistribution.byUsage.moderate++;
      } else {
        this.analytics.sourceDistribution.byUsage.unused++;
      }
    }

    // Update top performing sources
    this.analytics.topPerformingSources = sources
      .filter(s => s.usage.totalQueries > 0)
      .sort((a, b) => {
        const scoreA =
          a.credibilityScore * 0.5 +
          a.usage.averageRelevance * 0.3 +
          (a.usage.totalQueries / 100) * 0.2;
        const scoreB =
          b.credibilityScore * 0.5 +
          b.usage.averageRelevance * 0.3 +
          (b.usage.totalQueries / 100) * 0.2;
        return scoreB - scoreA;
      })
      .slice(0, 10)
      .map(s => ({
        sourceId: s.id,
        name: s.name,
        score:
          s.credibilityScore * 0.5 +
          s.usage.averageRelevance * 0.3 +
          (s.usage.totalQueries / 100) * 0.2,
        usageCount: s.usage.totalQueries,
      }));
  }

  private startAnalyticsUpdates(): void {
    setInterval(() => {
      this.updateAnalytics();

      // Add quality trend point
      const now = new Date().toISOString().split('T')[0]; // Date only
      const sources = Array.from(this.sources.values());
      const averageQuality =
        sources.length > 0
          ? sources.reduce((sum, s) => sum + this.calculateOverallQuality(s.quality), 0) /
            sources.length
          : 0;

      this.analytics.qualityTrends.push({
        date: now,
        averageQuality,
        sourceCount: sources.length,
      });

      // Keep only last 30 days
      if (this.analytics.qualityTrends.length > 30) {
        this.analytics.qualityTrends = this.analytics.qualityTrends.slice(-30);
      }
    }, 3600000); // Every hour
  }

  // Public API methods
  getAllSources(): KnowledgeSource[] {
    return Array.from(this.sources.values());
  }

  getSource(sourceId: string): KnowledgeSource | undefined {
    return this.sources.get(sourceId);
  }

  getEnabledSources(): KnowledgeSource[] {
    return Array.from(this.sources.values()).filter(s => s.enabled);
  }

  getSourcesByType(type: KnowledgeSource['type']): KnowledgeSource[] {
    return Array.from(this.sources.values()).filter(s => s.type === type);
  }

  searchSources(query: string): KnowledgeSource[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.sources.values()).filter(
      s =>
        s.name.toLowerCase().includes(lowerQuery) ||
        s.description.toLowerCase().includes(lowerQuery) ||
        s.metadata.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  getAllPriorityRules(): SourcePriorityRule[] {
    return Array.from(this.priorityRules.values());
  }

  getAnalytics(): SourceAnalytics {
    return { ...this.analytics };
  }

  updateConfig(newConfig: Partial<SourceRetrievalConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): SourceRetrievalConfig {
    return { ...this.config };
  }

  clearCache(): void {
    this.sourceCache.clear();
  }

  exportSources(): string {
    const exportData = {
      sources: Array.from(this.sources.values()),
      priorityRules: Array.from(this.priorityRules.values()),
      config: this.config,
      analytics: this.analytics,
      exportDate: new Date().toISOString(),
    };

    return JSON.stringify(exportData, null, 2);
  }

  async importSources(
    jsonData: string
  ): Promise<{ success: boolean; imported: number; errors: string[] }> {
    try {
      const data = JSON.parse(jsonData);
      const errors: string[] = [];
      let imported = 0;

      if (data.sources && Array.isArray(data.sources)) {
        for (const sourceData of data.sources) {
          try {
            await this.registerSource(sourceData);
            imported++;
          } catch (error) {
            errors.push(
              `Failed to import source ${sourceData.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        }
      }

      if (data.priorityRules && Array.isArray(data.priorityRules)) {
        for (const ruleData of data.priorityRules) {
          try {
            this.addPriorityRule(ruleData);
          } catch (error) {
            errors.push(
              `Failed to import priority rule ${ruleData.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        }
      }

      return { success: errors.length === 0, imported, errors };
    } catch (error) {
      return {
        success: false,
        imported: 0,
        errors: [
          `Failed to parse import data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
      };
    }
  }
}

export const knowledgeSourceManager = KnowledgeSourceManager.getInstance();
