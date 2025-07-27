/**
 * 🧠 RAG Context Builder Service - Phase 4 Day 15 Step 15.2
 * Intelligent context assembly từ search results với context window management
 */

import { SearchResult } from './semantic-search-service';

export interface ContextConfig {
  // Token limits
  maxTokens: number;
  maxContextLength: number;
  maxSourcesPerContext: number;

  // Context assembly
  includeSourceInfo: boolean;
  includeSimilarityScores: boolean;
  includeHighlights: boolean;
  mergeOverlappingContent: boolean;

  // Formatting
  contextSeparator: string;
  sourceSeparator: string;
  highlightMarkers: {
    start: string;
    end: string;
  };

  // Quality settings
  minRelevanceForInclusion: number;
  prioritizeRecency: boolean;
  balanceContentTypes: boolean;
}

export interface ContextChunk {
  id: string;
  content: string;
  source: {
    title: string;
    type: string;
    filename?: string;
  };
  metadata: {
    relevanceScore: number;
    similarityScore: number;
    rank: number;
    tokens: number;
    includedAt: string;
  };
  highlights?: string[];
}

export interface ContextAssembly {
  // Final context
  context: string;
  formattedContext: string;
  systemPromptContext: string;

  // Metadata
  chunks: ContextChunk[];
  totalTokens: number;
  totalSources: number;

  // Statistics
  stats: {
    averageRelevance: number;
    contentTypeDistribution: { [type: string]: number };
    sourcesUsed: number;
    sourcesSkipped: number;
    truncatedDueToLength: boolean;
  };

  // Assembly info
  assembly: {
    strategy: string;
    processingTime: number;
    optimizations: string[];
    warnings: string[];
  };
}

export const DEFAULT_CONTEXT_CONFIG: ContextConfig = {
  maxTokens: 8000,
  maxContextLength: 32000, // Characters
  maxSourcesPerContext: 10,

  includeSourceInfo: true,
  includeSimilarityScores: false,
  includeHighlights: true,
  mergeOverlappingContent: true,

  contextSeparator: '\n\n---\n\n',
  sourceSeparator: '\n\n',
  highlightMarkers: {
    start: '**',
    end: '**',
  },

  minRelevanceForInclusion: 0.3,
  prioritizeRecency: false,
  balanceContentTypes: true,
};

export class RAGContextBuilder {
  private static instance: RAGContextBuilder;
  private config: ContextConfig;
  private tokenEstimator: TokenEstimator;

  constructor(config: Partial<ContextConfig> = {}) {
    this.config = { ...DEFAULT_CONTEXT_CONFIG, ...config };
    this.tokenEstimator = new TokenEstimator();
  }

  static getInstance(config?: Partial<ContextConfig>): RAGContextBuilder {
    if (!RAGContextBuilder.instance) {
      RAGContextBuilder.instance = new RAGContextBuilder(config);
    }
    return RAGContextBuilder.instance;
  }

  /**
   * Main context building method
   */
  async buildContext(
    searchResults: SearchResult[],
    query: string,
    config: Partial<ContextConfig> = {}
  ): Promise<ContextAssembly> {
    const startTime = Date.now();
    const buildConfig = { ...this.config, ...config };

    console.log(`🧠 Building RAG context from ${searchResults.length} search results`);

    try {
      // Filter and prepare results
      const filteredResults = this.filterResults(searchResults, buildConfig);

      // Create context chunks
      const chunks = await this.createContextChunks(filteredResults, query, buildConfig);

      // Optimize chunk selection
      const optimizedChunks = this.optimizeChunkSelection(chunks, buildConfig);

      // Assemble final context
      const assembly = this.assembleContext(optimizedChunks, query, buildConfig);

      const processingTime = Date.now() - startTime;

      const result: ContextAssembly = {
        context: assembly.context,
        formattedContext: assembly.formattedContext,
        systemPromptContext: assembly.systemPromptContext,
        chunks: assembly.chunks,
        totalTokens: assembly.totalTokens,
        totalSources: assembly.totalSources,
        stats: assembly.stats,
        assembly: {
          strategy: 'optimized_selection',
          processingTime,
          optimizations: assembly.optimizations,
          warnings: assembly.warnings,
        },
      };

      console.log(
        `✅ Context built: ${result.totalTokens} tokens from ${result.totalSources} sources in ${processingTime}ms`
      );
      return result;
    } catch (error) {
      console.error('❌ Context building failed:', error);
      throw new Error(
        `Context building failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Filter search results based on relevance and quality
   */
  private filterResults(results: SearchResult[], config: ContextConfig): SearchResult[] {
    return results
      .filter(result => result.relevanceScore >= config.minRelevanceForInclusion)
      .slice(0, config.maxSourcesPerContext * 2) // Get extra for optimization
      .sort((a, b) => {
        // Primary sort: relevance
        if (b.relevanceScore !== a.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }

        // Secondary sort: recency if enabled
        if (config.prioritizeRecency) {
          const aDate = new Date(a.source.createdAt).getTime();
          const bDate = new Date(b.source.createdAt).getTime();
          return bDate - aDate;
        }

        // Tertiary sort: quality score
        return b.qualityScore - a.qualityScore;
      });
  }

  /**
   * Create context chunks from search results
   */
  private async createContextChunks(
    results: SearchResult[],
    query: string,
    config: ContextConfig
  ): Promise<ContextChunk[]> {
    const chunks: ContextChunk[] = [];

    for (const result of results) {
      try {
        // Prepare content với highlights
        let content = result.content.trim();

        if (config.includeHighlights && result.context.highlights.length > 0) {
          content = this.applyHighlights(content, result.context.highlights, config);
        }

        // Estimate tokens
        const tokens = this.tokenEstimator.estimate(content);

        // Skip if too large
        if (tokens > config.maxTokens / 2) {
          content = this.truncateContent(content, config.maxTokens / 2);
        }

        const chunk: ContextChunk = {
          id: result.chunkId,
          content,
          source: {
            title: result.source.title,
            type: result.source.type,
            filename: result.source.filename,
          },
          metadata: {
            relevanceScore: result.relevanceScore,
            similarityScore: result.semanticScore,
            rank: result.rank,
            tokens: this.tokenEstimator.estimate(content),
            includedAt: new Date().toISOString(),
          },
          highlights: config.includeHighlights ? result.context.highlights : undefined,
        };

        chunks.push(chunk);
      } catch (error) {
        console.warn(`⚠️ Failed to create chunk for result ${result.id}:`, error);
        continue;
      }
    }

    return chunks;
  }

  /**
   * Optimize chunk selection để fit trong context window
   */
  private optimizeChunkSelection(chunks: ContextChunk[], config: ContextConfig): ContextChunk[] {
    const selectedChunks: ContextChunk[] = [];
    let totalTokens = 0;
    let totalSources = 0;

    // Content type tracking for balance
    const contentTypes = new Map<string, number>();

    for (const chunk of chunks) {
      // Check token limit
      if (totalTokens + chunk.metadata.tokens > config.maxTokens) {
        break;
      }

      // Check source limit
      if (totalSources >= config.maxSourcesPerContext) {
        break;
      }

      // Check content type balance
      if (config.balanceContentTypes) {
        const currentTypeCount = contentTypes.get(chunk.source.type) || 0;
        const maxPerType = Math.ceil(config.maxSourcesPerContext / 3); // Allow max 1/3 per type

        if (currentTypeCount >= maxPerType) {
          continue; // Skip this chunk to maintain balance
        }
      }

      // Check for overlapping content
      if (config.mergeOverlappingContent) {
        const overlap = this.findOverlappingChunk(chunk, selectedChunks);
        if (overlap) {
          // Merge chunks instead of adding separately
          this.mergeChunks(overlap, chunk);
          continue;
        }
      }

      // Add chunk
      selectedChunks.push(chunk);
      totalTokens += chunk.metadata.tokens;
      totalSources++;

      // Update content type count
      contentTypes.set(chunk.source.type, (contentTypes.get(chunk.source.type) || 0) + 1);
    }

    return selectedChunks;
  }

  /**
   * Assemble final context from selected chunks
   */
  private assembleContext(
    chunks: ContextChunk[],
    query: string,
    config: ContextConfig
  ): {
    context: string;
    formattedContext: string;
    systemPromptContext: string;
    chunks: ContextChunk[];
    totalTokens: number;
    totalSources: number;
    stats: ContextAssembly['stats'];
    optimizations: string[];
    warnings: string[];
  } {
    const warnings: string[] = [];
    const optimizations: string[] = [];

    // Build context sections
    const contextSections: string[] = [];

    chunks.forEach((chunk, index) => {
      let section = '';

      // Add source info if enabled
      if (config.includeSourceInfo) {
        const sourceInfo = `Source: ${chunk.source.title}`;
        const typeInfo = chunk.source.type ? ` (${chunk.source.type})` : '';
        const relevanceInfo = config.includeSimilarityScores
          ? ` [Relevance: ${(chunk.metadata.relevanceScore * 100).toFixed(1)}%]`
          : '';

        section += `${sourceInfo}${typeInfo}${relevanceInfo}\n`;
      }

      // Add content
      section += chunk.content;

      contextSections.push(section);
    });

    // Join sections
    const context = contextSections.join(config.contextSeparator);

    // Create formatted context
    const formattedContext = this.formatContext(context, query, config);

    // Create system prompt context
    const systemPromptContext = this.createSystemPromptContext(chunks, query, config);

    // Check if truncation occurred
    const truncated = context.length > config.maxContextLength;
    if (truncated) {
      warnings.push('Context was truncated due to length limits');
    }

    // Calculate statistics
    const stats = this.calculateStats(chunks, config, truncated);

    return {
      context: truncated ? context.substring(0, config.maxContextLength) : context,
      formattedContext,
      systemPromptContext,
      chunks,
      totalTokens: chunks.reduce((sum, chunk) => sum + chunk.metadata.tokens, 0),
      totalSources: chunks.length,
      stats,
      optimizations,
      warnings,
    };
  }

  /**
   * Apply highlights to content
   */
  private applyHighlights(content: string, highlights: string[], config: ContextConfig): string {
    let highlighted = content;

    highlights.forEach(highlight => {
      const regex = new RegExp(`\\b${this.escapeRegExp(highlight)}\\b`, 'gi');
      highlighted = highlighted.replace(
        regex,
        `${config.highlightMarkers.start}$&${config.highlightMarkers.end}`
      );
    });

    return highlighted;
  }

  /**
   * Find overlapping chunk
   */
  private findOverlappingChunk(
    newChunk: ContextChunk,
    existingChunks: ContextChunk[]
  ): ContextChunk | null {
    for (const existing of existingChunks) {
      if (existing.source.title === newChunk.source.title) {
        // Check content similarity
        const similarity = this.calculateContentSimilarity(existing.content, newChunk.content);

        if (similarity > 0.7) {
          // 70% similar
          return existing;
        }
      }
    }
    return null;
  }

  /**
   * Merge overlapping chunks
   */
  private mergeChunks(existing: ContextChunk, newChunk: ContextChunk): void {
    // Use the chunk with higher relevance
    if (newChunk.metadata.relevanceScore > existing.metadata.relevanceScore) {
      existing.content = newChunk.content;
      existing.metadata.relevanceScore = newChunk.metadata.relevanceScore;
    }

    // Merge highlights
    if (existing.highlights && newChunk.highlights) {
      existing.highlights = [...new Set([...existing.highlights, ...newChunk.highlights])];
    }
  }

  /**
   * Format context for presentation
   */
  private formatContext(context: string, query: string, config: ContextConfig): string {
    let formatted = context;

    // Add query context
    const queryContext = `User Query: "${query}"\n\nRelevant Information:\n\n`;
    formatted = queryContext + formatted;

    return formatted;
  }

  /**
   * Create system prompt context
   */
  private createSystemPromptContext(
    chunks: ContextChunk[],
    query: string,
    config: ContextConfig
  ): string {
    const context = `Based on the following relevant information from the knowledge base, please provide a comprehensive and accurate response to the user's query.

Query: "${query}"

Relevant Knowledge:
${chunks
  .map((chunk, index) => `${index + 1}. ${chunk.source.title}: ${chunk.content}`)
  .join('\n\n')}

Please ensure your response is:
- Accurate and based on the provided information
- Comprehensive and addresses all aspects of the query  
- Clear and well-structured
- Cites relevant sources when appropriate`;

    return context;
  }

  /**
   * Calculate assembly statistics
   */
  private calculateStats(
    chunks: ContextChunk[],
    config: ContextConfig,
    truncated: boolean
  ): ContextAssembly['stats'] {
    const relevanceScores = chunks.map(c => c.metadata.relevanceScore);
    const averageRelevance = relevanceScores.reduce((a, b) => a + b, 0) / relevanceScores.length;

    const contentTypeDistribution: { [type: string]: number } = {};
    chunks.forEach(chunk => {
      contentTypeDistribution[chunk.source.type] =
        (contentTypeDistribution[chunk.source.type] || 0) + 1;
    });

    return {
      averageRelevance,
      contentTypeDistribution,
      sourcesUsed: chunks.length,
      sourcesSkipped: 0, // Would need to track this during selection
      truncatedDueToLength: truncated,
    };
  }

  /**
   * Truncate content to fit token limit
   */
  private truncateContent(content: string, maxTokens: number): string {
    const estimatedLength = maxTokens * 4; // Rough estimate: 1 token ≈ 4 characters

    if (content.length <= estimatedLength) {
      return content;
    }

    // Try to truncate at sentence boundary
    const truncated = content.substring(0, estimatedLength);
    const lastSentence = truncated.lastIndexOf('.');

    if (lastSentence > estimatedLength * 0.8) {
      return truncated.substring(0, lastSentence + 1);
    }

    return truncated + '...';
  }

  /**
   * Calculate content similarity
   */
  private calculateContentSimilarity(content1: string, content2: string): number {
    // Simple similarity calculation based on word overlap
    const words1 = new Set(content1.toLowerCase().split(/\s+/));
    const words2 = new Set(content2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Escape regex special characters
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

/**
 * Simple token estimator
 */
class TokenEstimator {
  /**
   * Estimate token count for text
   */
  estimate(text: string): number {
    // Rough estimation: average 4 characters per token
    // This should be replaced with actual tokenizer in production
    return Math.ceil(text.length / 4);
  }

  /**
   * Check if text exceeds token limit
   */
  exceedsLimit(text: string, limit: number): boolean {
    return this.estimate(text) > limit;
  }
}

// Export singleton instance
export const ragContextBuilder = RAGContextBuilder.getInstance();
