/**
 * 🧠 Context Quality Service - Phase 4 Day 16 Step 16.2
 * Advanced context quality improvement với relevance scoring, duplicate detection, và reranking algorithms
 */

import { SearchResult } from './semantic-search-service-optimized';

export interface QualityMetrics {
  relevanceScore: number;
  duplicateScore: number;
  diversityScore: number;
  completenessScore: number;
  coherenceScore: number;
  freshnessScore: number;
  authorityScore: number;
  overallQualityScore: number;
}

export interface QualityConfig {
  // Relevance settings
  relevanceThreshold: number;
  semanticSimilarityWeight: number;
  keywordMatchWeight: number;
  contextualRelevanceWeight: number;

  // Duplicate detection settings
  duplicateThreshold: number;
  contentSimilarityThreshold: number;
  enableSemanticDuplicateDetection: boolean;

  // Reranking settings
  enableReranking: boolean;
  rerankingAlgorithm: 'score_based' | 'diversity_based' | 'hybrid';
  diversityWeight: number;
  qualityWeight: number;

  // Quality scoring
  enableQualityFiltering: boolean;
  minQualityScore: number;
  maxResults: number;

  // Advanced features
  enableClusterBasedFiltering: boolean;
  enableTemporalRelevance: boolean;
  enableAuthorityScoring: boolean;
}

export interface DuplicateGroup {
  originalIndex: number;
  duplicateIndices: number[];
  similarity: number;
  representativeContent: string;
}

export interface RerankingResult {
  rerankedResults: SearchResult[];
  qualityMetrics: QualityMetrics[];
  duplicateGroups: DuplicateGroup[];
  processingTime: number;
  algorithm: string;
  improvements: {
    relevanceImprovement: number;
    diversityImprovement: number;
    qualityImprovement: number;
  };
}

export const DEFAULT_QUALITY_CONFIG: QualityConfig = {
  relevanceThreshold: 0.6,
  semanticSimilarityWeight: 0.4,
  keywordMatchWeight: 0.3,
  contextualRelevanceWeight: 0.3,

  duplicateThreshold: 0.85,
  contentSimilarityThreshold: 0.9,
  enableSemanticDuplicateDetection: true,

  enableReranking: true,
  rerankingAlgorithm: 'hybrid',
  diversityWeight: 0.3,
  qualityWeight: 0.7,

  enableQualityFiltering: true,
  minQualityScore: 0.5,
  maxResults: 20,

  enableClusterBasedFiltering: true,
  enableTemporalRelevance: true,
  enableAuthorityScoring: true,
};

export class ContextQualityService {
  private static instance: ContextQualityService;
  private config: QualityConfig;
  private qualityCache: Map<string, QualityMetrics> = new Map();
  private duplicateCache: Map<string, DuplicateGroup[]> = new Map();

  constructor(config: Partial<QualityConfig> = {}) {
    this.config = { ...DEFAULT_QUALITY_CONFIG, ...config };
  }

  static getInstance(config?: Partial<QualityConfig>): ContextQualityService {
    if (!ContextQualityService.instance) {
      ContextQualityService.instance = new ContextQualityService(config);
    }
    return ContextQualityService.instance;
  }

  /**
   * Main quality improvement method
   */
  async improveResultQuality(
    results: SearchResult[],
    query: string,
    config: Partial<QualityConfig> = {}
  ): Promise<RerankingResult> {
    const startTime = Date.now();
    const qualityConfig = { ...this.config, ...config };

    console.log(`🧠 Starting context quality improvement for ${results.length} results`);

    try {
      // Calculate quality metrics for each result
      const qualityMetrics = await this.calculateQualityMetrics(results, query, qualityConfig);

      // Detect and handle duplicates
      const duplicateGroups = await this.detectDuplicates(results, qualityConfig);
      let dedupedResults = this.removeDuplicates(results, duplicateGroups);

      // Apply quality filtering
      if (qualityConfig.enableQualityFiltering) {
        dedupedResults = this.filterByQuality(dedupedResults, qualityMetrics, qualityConfig);
      }

      // Rerank results
      const rerankedResults = await this.rerankResults(
        dedupedResults,
        qualityMetrics,
        query,
        qualityConfig
      );

      // Calculate improvements
      const improvements = this.calculateImprovements(results, rerankedResults, qualityMetrics);

      const processingTime = Date.now() - startTime;

      const result: RerankingResult = {
        rerankedResults: rerankedResults.slice(0, qualityConfig.maxResults),
        qualityMetrics: qualityMetrics.slice(0, qualityConfig.maxResults),
        duplicateGroups,
        processingTime,
        algorithm: qualityConfig.rerankingAlgorithm,
        improvements,
      };

      console.log(`✅ Context quality improvement completed in ${processingTime}ms`);
      console.log(
        `📊 Quality improvements: Relevance +${improvements.relevanceImprovement.toFixed(2)}, Diversity +${improvements.diversityImprovement.toFixed(2)}`
      );

      return result;
    } catch (error) {
      console.error('❌ Context quality improvement failed:', error);
      throw error;
    }
  }

  /**
   * Calculate comprehensive quality metrics
   */
  private async calculateQualityMetrics(
    results: SearchResult[],
    query: string,
    config: QualityConfig
  ): Promise<QualityMetrics[]> {
    const metrics: QualityMetrics[] = [];

    for (const result of results) {
      const cacheKey = `${result.id}_${query}`;

      if (this.qualityCache.has(cacheKey)) {
        metrics.push(this.qualityCache.get(cacheKey)!);
        continue;
      }

      const qualityMetric: QualityMetrics = {
        relevanceScore: this.calculateRelevanceScore(result, query, config),
        duplicateScore: 1.0, // Will be updated in duplicate detection
        diversityScore: this.calculateDiversityScore(result, results),
        completenessScore: this.calculateCompletenessScore(result),
        coherenceScore: this.calculateCoherenceScore(result),
        freshnessScore: this.calculateFreshnessScore(result, config),
        authorityScore: this.calculateAuthorityScore(result, config),
        overallQualityScore: 0, // Will be calculated below
      };

      // Calculate overall quality score
      qualityMetric.overallQualityScore = this.calculateOverallQualityScore(qualityMetric);

      metrics.push(qualityMetric);
      this.qualityCache.set(cacheKey, qualityMetric);
    }

    return metrics;
  }

  /**
   * Calculate relevance score với multiple factors
   */
  private calculateRelevanceScore(
    result: SearchResult,
    query: string,
    config: QualityConfig
  ): number {
    // Semantic similarity (already provided)
    const semanticScore = result.semanticScore || 0;

    // Keyword matching
    const keywordScore = this.calculateKeywordMatchScore(result.content, query);

    // Contextual relevance
    const contextualScore = this.calculateContextualRelevance(result, query);

    // Weighted combination
    const relevanceScore =
      semanticScore * config.semanticSimilarityWeight +
      keywordScore * config.keywordMatchWeight +
      contextualScore * config.contextualRelevanceWeight;

    return Math.min(1.0, Math.max(0.0, relevanceScore));
  }

  /**
   * Calculate keyword match score
   */
  private calculateKeywordMatchScore(content: string, query: string): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentWords = content.toLowerCase().split(/\s+/);

    let matches = 0;
    let totalImportance = 0;

    for (const word of queryWords) {
      const importance = this.getWordImportance(word);
      totalImportance += importance;

      if (contentWords.includes(word)) {
        matches += importance;
      }
    }

    return totalImportance > 0 ? matches / totalImportance : 0;
  }

  /**
   * Calculate contextual relevance
   */
  private calculateContextualRelevance(result: SearchResult, query: string): number {
    let score = 0;

    // Check if query concepts are addressed
    const queryTokens = this.extractKeyTerms(query);
    const contentTokens = this.extractKeyTerms(result.content);

    const intersection = queryTokens.filter(token => contentTokens.includes(token));
    score += intersection.length / Math.max(queryTokens.length, 1);

    // Bonus for title/metadata relevance
    if (result.source.title) {
      const titleRelevance = this.calculateKeywordMatchScore(result.source.title, query);
      score += titleRelevance * 0.3;
    }

    return Math.min(1.0, score);
  }

  /**
   * Calculate diversity score
   */
  private calculateDiversityScore(result: SearchResult, allResults: SearchResult[]): number {
    let diversityScore = 1.0;

    for (const other of allResults) {
      if (other.id === result.id) continue;

      const similarity = this.calculateContentSimilarity(result.content, other.content);
      diversityScore *= 1 - similarity;
    }

    return Math.max(0.0, diversityScore);
  }

  /**
   * Calculate completeness score
   */
  private calculateCompletenessScore(result: SearchResult): number {
    let score = 0;

    // Content length factor
    const contentLength = result.content.length;
    score += Math.min(1.0, contentLength / 500) * 0.3;

    // Metadata completeness
    const metadataScore = this.calculateMetadataCompleteness(result);
    score += metadataScore * 0.3;

    // Context availability
    const contextScore = result.context ? 0.4 : 0;
    score += contextScore;

    return Math.min(1.0, score);
  }

  /**
   * Calculate coherence score
   */
  private calculateCoherenceScore(result: SearchResult): number {
    const content = result.content;

    // Basic coherence checks
    let score = 0.5; // Base score

    // Sentence structure
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    if (sentences.length > 1) {
      score += 0.2;
    }

    // Paragraph structure
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim());
    if (paragraphs.length > 1) {
      score += 0.2;
    }

    // No excessive repetition
    const words = content.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    const repetitionRatio = uniqueWords.size / words.length;
    score += Math.min(0.1, repetitionRatio);

    return Math.min(1.0, score);
  }

  /**
   * Calculate freshness score
   */
  private calculateFreshnessScore(result: SearchResult, config: QualityConfig): number {
    if (!config.enableTemporalRelevance) return 0.5;

    const createdAt = new Date(result.source.createdAt);
    const now = new Date();
    const ageInDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

    // Exponential decay: newer content scores higher
    const freshnessScore = Math.exp(-ageInDays / 365); // Decay over a year

    return Math.min(1.0, Math.max(0.0, freshnessScore));
  }

  /**
   * Calculate authority score
   */
  private calculateAuthorityScore(result: SearchResult, config: QualityConfig): number {
    if (!config.enableAuthorityScoring) return 0.5;

    let score = 0.5; // Base score

    // Document type authority
    const authorityByType: { [key: string]: number } = {
      pdf: 0.8,
      docx: 0.7,
      txt: 0.6,
      csv: 0.5,
      json: 0.4,
    };

    score += (authorityByType[result.source.type] || 0.5) * 0.3;

    // File name indicators
    const filename = result.source.filename || result.source.title;
    if (filename) {
      if (filename.includes('official') || filename.includes('document')) {
        score += 0.2;
      }
    }

    return Math.min(1.0, score);
  }

  /**
   * Calculate overall quality score
   */
  private calculateOverallQualityScore(metrics: QualityMetrics): number {
    const weights = {
      relevance: 0.3,
      diversity: 0.15,
      completeness: 0.15,
      coherence: 0.15,
      freshness: 0.1,
      authority: 0.15,
    };

    return (
      metrics.relevanceScore * weights.relevance +
      metrics.diversityScore * weights.diversity +
      metrics.completenessScore * weights.completeness +
      metrics.coherenceScore * weights.coherence +
      metrics.freshnessScore * weights.freshness +
      metrics.authorityScore * weights.authority
    );
  }

  /**
   * Detect duplicate content
   */
  private async detectDuplicates(
    results: SearchResult[],
    config: QualityConfig
  ): Promise<DuplicateGroup[]> {
    const cacheKey = results.map(r => r.id).join(',');

    if (this.duplicateCache.has(cacheKey)) {
      return this.duplicateCache.get(cacheKey)!;
    }

    const duplicateGroups: DuplicateGroup[] = [];
    const processed: Set<number> = new Set();

    for (let i = 0; i < results.length; i++) {
      if (processed.has(i)) continue;

      const duplicates: number[] = [];
      const result = results[i];

      for (let j = i + 1; j < results.length; j++) {
        if (processed.has(j)) continue;

        const other = results[j];
        let similarity = 0;

        if (config.enableSemanticDuplicateDetection) {
          similarity = this.calculateSemanticSimilarity(result, other);
        } else {
          similarity = this.calculateContentSimilarity(result.content, other.content);
        }

        if (similarity > config.duplicateThreshold) {
          duplicates.push(j);
          processed.add(j);
        }
      }

      if (duplicates.length > 0) {
        duplicateGroups.push({
          originalIndex: i,
          duplicateIndices: duplicates,
          similarity:
            duplicates.length > 0
              ? Math.max(
                  ...duplicates.map(idx =>
                    this.calculateContentSimilarity(result.content, results[idx].content)
                  )
                )
              : 0,
          representativeContent: result.content.substring(0, 100) + '...',
        });
      }
    }

    this.duplicateCache.set(cacheKey, duplicateGroups);
    return duplicateGroups;
  }

  /**
   * Remove duplicates keeping the best representative
   */
  private removeDuplicates(
    results: SearchResult[],
    duplicateGroups: DuplicateGroup[]
  ): SearchResult[] {
    const toRemove: Set<number> = new Set();

    for (const group of duplicateGroups) {
      // Keep the original (usually highest scored), remove duplicates
      group.duplicateIndices.forEach(idx => toRemove.add(idx));
    }

    return results.filter((_, index) => !toRemove.has(index));
  }

  /**
   * Filter results by quality
   */
  private filterByQuality(
    results: SearchResult[],
    qualityMetrics: QualityMetrics[],
    config: QualityConfig
  ): SearchResult[] {
    const filtered: SearchResult[] = [];

    for (let i = 0; i < results.length; i++) {
      const metrics = qualityMetrics[i];
      if (metrics && metrics.overallQualityScore >= config.minQualityScore) {
        filtered.push(results[i]);
      }
    }

    return filtered;
  }

  /**
   * Rerank results using selected algorithm
   */
  private async rerankResults(
    results: SearchResult[],
    qualityMetrics: QualityMetrics[],
    query: string,
    config: QualityConfig
  ): Promise<SearchResult[]> {
    if (!config.enableReranking) return results;

    const indexedResults = results.map((result, index) => ({
      result,
      metrics: qualityMetrics[index],
      originalIndex: index,
    }));

    switch (config.rerankingAlgorithm) {
      case 'score_based':
        return this.scoreBasedReranking(indexedResults, config);

      case 'diversity_based':
        return this.diversityBasedReranking(indexedResults, config);

      case 'hybrid':
        return this.hybridReranking(indexedResults, config);

      default:
        return results;
    }
  }

  /**
   * Score-based reranking
   */
  private scoreBasedReranking(
    indexedResults: Array<{ result: SearchResult; metrics: QualityMetrics; originalIndex: number }>,
    config: QualityConfig
  ): SearchResult[] {
    return indexedResults
      .sort((a, b) => b.metrics.overallQualityScore - a.metrics.overallQualityScore)
      .map(item => item.result);
  }

  /**
   * Diversity-based reranking
   */
  private diversityBasedReranking(
    indexedResults: Array<{ result: SearchResult; metrics: QualityMetrics; originalIndex: number }>,
    config: QualityConfig
  ): SearchResult[] {
    const selected: SearchResult[] = [];
    const remaining = [...indexedResults];

    // Select the highest quality result first
    remaining.sort((a, b) => b.metrics.overallQualityScore - a.metrics.overallQualityScore);
    selected.push(remaining.shift()!.result);

    // Select remaining results to maximize diversity
    while (remaining.length > 0 && selected.length < config.maxResults) {
      let bestIndex = 0;
      let bestScore = -1;

      for (let i = 0; i < remaining.length; i++) {
        const candidate = remaining[i];

        // Calculate diversity with selected results
        let minSimilarity = 1.0;
        for (const selectedResult of selected) {
          const similarity = this.calculateContentSimilarity(
            candidate.result.content,
            selectedResult.content
          );
          minSimilarity = Math.min(minSimilarity, similarity);
        }

        const diversityScore = 1 - minSimilarity;
        const combinedScore =
          candidate.metrics.overallQualityScore * config.qualityWeight +
          diversityScore * config.diversityWeight;

        if (combinedScore > bestScore) {
          bestScore = combinedScore;
          bestIndex = i;
        }
      }

      selected.push(remaining.splice(bestIndex, 1)[0].result);
    }

    return selected;
  }

  /**
   * Hybrid reranking
   */
  private hybridReranking(
    indexedResults: Array<{ result: SearchResult; metrics: QualityMetrics; originalIndex: number }>,
    config: QualityConfig
  ): SearchResult[] {
    // Combine score-based and diversity-based approaches
    const halfSize = Math.floor(indexedResults.length / 2);

    // First half: score-based
    const scoreBased = this.scoreBasedReranking(indexedResults.slice(0, halfSize), config);

    // Second half: diversity-based
    const diversityBased = this.diversityBasedReranking(indexedResults.slice(halfSize), config);

    // Interleave the results
    const combined: SearchResult[] = [];
    const maxLength = Math.max(scoreBased.length, diversityBased.length);

    for (let i = 0; i < maxLength; i++) {
      if (i < scoreBased.length) combined.push(scoreBased[i]);
      if (i < diversityBased.length) combined.push(diversityBased[i]);
    }

    return combined;
  }

  /**
   * Calculate improvements made
   */
  private calculateImprovements(
    originalResults: SearchResult[],
    improvedResults: SearchResult[],
    qualityMetrics: QualityMetrics[]
  ): { relevanceImprovement: number; diversityImprovement: number; qualityImprovement: number } {
    const originalAvgRelevance =
      originalResults.reduce((sum, r) => sum + (r.relevanceScore || 0), 0) / originalResults.length;
    const improvedAvgRelevance =
      improvedResults.reduce((sum, r) => sum + (r.relevanceScore || 0), 0) / improvedResults.length;

    const originalAvgQuality =
      qualityMetrics
        .slice(0, originalResults.length)
        .reduce((sum, m) => sum + m.overallQualityScore, 0) / originalResults.length;
    const improvedAvgQuality =
      qualityMetrics
        .slice(0, improvedResults.length)
        .reduce((sum, m) => sum + m.overallQualityScore, 0) / improvedResults.length;

    return {
      relevanceImprovement: improvedAvgRelevance - originalAvgRelevance,
      diversityImprovement: this.calculateDiversityImprovement(originalResults, improvedResults),
      qualityImprovement: improvedAvgQuality - originalAvgQuality,
    };
  }

  /**
   * Calculate diversity improvement
   */
  private calculateDiversityImprovement(
    original: SearchResult[],
    improved: SearchResult[]
  ): number {
    const originalDiversity = this.calculateSetDiversity(original);
    const improvedDiversity = this.calculateSetDiversity(improved);
    return improvedDiversity - originalDiversity;
  }

  /**
   * Calculate set diversity
   */
  private calculateSetDiversity(results: SearchResult[]): number {
    if (results.length < 2) return 0;

    let totalSimilarity = 0;
    let pairs = 0;

    for (let i = 0; i < results.length; i++) {
      for (let j = i + 1; j < results.length; j++) {
        totalSimilarity += this.calculateContentSimilarity(results[i].content, results[j].content);
        pairs++;
      }
    }

    return pairs > 0 ? 1 - totalSimilarity / pairs : 0;
  }

  /**
   * Helper methods
   */
  private calculateContentSimilarity(content1: string, content2: string): number {
    // Simple Jaccard similarity
    const words1 = new Set(content1.toLowerCase().split(/\s+/));
    const words2 = new Set(content2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  private calculateSemanticSimilarity(result1: SearchResult, result2: SearchResult): number {
    // Use existing semantic scores if available
    const score1 = result1.semanticScore || 0;
    const score2 = result2.semanticScore || 0;

    // Simple similarity based on score difference
    return 1 - Math.abs(score1 - score2);
  }

  private getWordImportance(word: string): number {
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
    return stopWords.includes(word.toLowerCase()) ? 0.1 : 1.0;
  }

  private extractKeyTerms(text: string): string[] {
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(
        word =>
          !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'].includes(
            word
          )
      );
  }

  private calculateMetadataCompleteness(result: SearchResult): number {
    let score = 0;
    const fields = ['title', 'filename', 'type', 'createdAt'];

    for (const field of fields) {
      if (result.source[field as keyof typeof result.source]) {
        score += 0.25;
      }
    }

    return score;
  }

  /**
   * Public utility methods
   */
  updateConfig(newConfig: Partial<QualityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Quality configuration updated');
  }

  clearCache(): void {
    this.qualityCache.clear();
    this.duplicateCache.clear();
    console.log('🧹 Quality caches cleared');
  }

  getQualityStats(): any {
    return {
      qualityCacheSize: this.qualityCache.size,
      duplicateCacheSize: this.duplicateCache.size,
      config: this.config,
    };
  }
}

// Export singleton instance
export const contextQualityService = ContextQualityService.getInstance();
