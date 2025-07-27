/**
 * 🧠 Context Optimization Service - Phase 4 Day 17 Step 17.1
 * Advanced context optimization với intelligent chunking, compression, multi-turn context, và persistence
 */

import { SearchResult } from './semantic-search-service-optimized';

export interface ConversationContext {
  id: string;
  userId: string;
  agentId: string;
  messages: ContextMessage[];
  summary: string;
  keyTopics: string[];
  entities: string[];
  lastUpdated: string;
  contextWindow: number;
  compressionLevel: number;
}

export interface ContextMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  relevantKnowledge: string[];
  importance: number;
  compressedContent?: string;
  metadata?: {
    tokenCount: number;
    keyEntities: string[];
    topicTags: string[];
    sentiment: string;
  };
}

export interface ChunkingStrategy {
  type: 'semantic' | 'paragraph' | 'sentence' | 'adaptive' | 'topic_based';
  maxChunkSize: number;
  minChunkSize: number;
  overlapSize: number;
  preserveStructure: boolean;
  semanticThreshold: number;
  adaptiveFactors: {
    contentDensity: number;
    topicCoherence: number;
    readability: number;
  };
}

export interface CompressionConfig {
  enabled: boolean;
  algorithm: 'extractive' | 'abstractive' | 'hybrid';
  compressionRatio: number; // 0.1 to 1.0
  preserveKeyEntities: boolean;
  maintainCoherence: boolean;
  maxCompressionTokens: number;
  qualityThreshold: number;
}

export interface OptimizationConfig {
  // Context window management
  maxContextTokens: number;
  contextWindowStrategy: 'sliding' | 'fixed' | 'adaptive';

  // Chunking settings
  chunkingStrategy: ChunkingStrategy;
  enableAdaptiveChunking: boolean;

  // Compression settings
  compressionConfig: CompressionConfig;
  enableSmartCompression: boolean;

  // Multi-turn settings
  conversationMemorySize: number;
  enableTopicTracking: boolean;
  enableEntityTracking: boolean;
  enableSummaryGeneration: boolean;

  // Persistence settings
  enableContextPersistence: boolean;
  persistenceTimeout: number;
  maxStoredContexts: number;

  // Quality settings
  relevanceDecayRate: number;
  importanceWeighting: boolean;
  contextCoherenceThreshold: number;
}

export interface OptimizedContext {
  content: string;
  tokenCount: number;
  relevanceScore: number;
  compressionRatio: number;
  sources: SearchResult[];
  metadata: {
    originalTokenCount: number;
    compressionTime: number;
    chunkingStrategy: string;
    qualityScore: number;
    coherenceScore: number;
    topicConsistency: number;
  };
  conversationSummary?: string;
  keyInsights: string[];
  entityMentions: { [entity: string]: number };
}

export const DEFAULT_OPTIMIZATION_CONFIG: OptimizationConfig = {
  maxContextTokens: 4000,
  contextWindowStrategy: 'adaptive',

  chunkingStrategy: {
    type: 'adaptive',
    maxChunkSize: 1000,
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
  enableAdaptiveChunking: true,

  compressionConfig: {
    enabled: true,
    algorithm: 'hybrid',
    compressionRatio: 0.7,
    preserveKeyEntities: true,
    maintainCoherence: true,
    maxCompressionTokens: 2000,
    qualityThreshold: 0.8,
  },
  enableSmartCompression: true,

  conversationMemorySize: 10,
  enableTopicTracking: true,
  enableEntityTracking: true,
  enableSummaryGeneration: true,

  enableContextPersistence: true,
  persistenceTimeout: 3600000, // 1 hour
  maxStoredContexts: 100,

  relevanceDecayRate: 0.1,
  importanceWeighting: true,
  contextCoherenceThreshold: 0.7,
};

export class ContextOptimizationService {
  private static instance: ContextOptimizationService;
  private config: OptimizationConfig;
  private conversationContexts: Map<string, ConversationContext> = new Map();
  private compressionCache: Map<string, string> = new Map();
  private chunkingCache: Map<string, any[]> = new Map();

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = { ...DEFAULT_OPTIMIZATION_CONFIG, ...config };
    this.startContextCleanup();
  }

  static getInstance(config?: Partial<OptimizationConfig>): ContextOptimizationService {
    if (!ContextOptimizationService.instance) {
      ContextOptimizationService.instance = new ContextOptimizationService(config);
    }
    return ContextOptimizationService.instance;
  }

  /**
   * 🎯 Main context optimization method
   */
  async optimizeContext(
    searchResults: SearchResult[],
    conversationId: string,
    currentMessage: string,
    config: Partial<OptimizationConfig> = {}
  ): Promise<OptimizedContext> {
    const startTime = Date.now();
    const optimizationConfig = { ...this.config, ...config };

    console.log(`🧠 Starting context optimization for conversation ${conversationId}`);

    try {
      // Get or create conversation context
      const conversationContext = await this.getOrCreateConversationContext(
        conversationId,
        currentMessage
      );

      // Apply intelligent chunking
      const optimizedChunks = await this.applyIntelligentChunking(
        searchResults,
        optimizationConfig.chunkingStrategy
      );

      // Apply context compression
      const compressedContext = await this.compressContext(
        optimizedChunks,
        conversationContext,
        optimizationConfig.compressionConfig
      );

      // Build optimized context with multi-turn awareness
      const optimizedContext = await this.buildOptimizedContext(
        compressedContext,
        conversationContext,
        currentMessage,
        optimizationConfig
      );

      // Update conversation context
      await this.updateConversationContext(conversationId, currentMessage, optimizedContext);

      // Persist context if enabled
      if (optimizationConfig.enableContextPersistence) {
        await this.persistContext(conversationId, optimizedContext);
      }

      const processingTime = Date.now() - startTime;
      console.log(`✅ Context optimization completed in ${processingTime}ms`);
      console.log(
        `📊 Context: ${optimizedContext.tokenCount} tokens (${optimizedContext.compressionRatio.toFixed(2)} compression)`
      );

      return optimizedContext;
    } catch (error) {
      console.error('❌ Context optimization failed:', error);
      throw error;
    }
  }

  /**
   * 🧩 Intelligent chunking strategies
   */
  private async applyIntelligentChunking(
    searchResults: SearchResult[],
    strategy: ChunkingStrategy
  ): Promise<SearchResult[]> {
    const cacheKey = `${JSON.stringify(searchResults.map(r => r.id))}_${strategy.type}`;

    if (this.chunkingCache.has(cacheKey)) {
      return this.chunkingCache.get(cacheKey)!;
    }

    let optimizedResults: SearchResult[] = [];

    switch (strategy.type) {
      case 'semantic':
        optimizedResults = await this.applySemanticChunking(searchResults, strategy);
        break;
      case 'adaptive':
        optimizedResults = await this.applyAdaptiveChunking(searchResults, strategy);
        break;
      case 'topic_based':
        optimizedResults = await this.applyTopicBasedChunking(searchResults, strategy);
        break;
      default:
        optimizedResults = await this.applyStandardChunking(searchResults, strategy);
    }

    this.chunkingCache.set(cacheKey, optimizedResults);
    return optimizedResults;
  }

  private async applySemanticChunking(
    searchResults: SearchResult[],
    strategy: ChunkingStrategy
  ): Promise<SearchResult[]> {
    const chunkedResults: SearchResult[] = [];

    for (const result of searchResults) {
      const content = result.content;
      const sentences = this.splitIntoSentences(content);

      let currentChunk = '';
      let currentTokenCount = 0;
      let chunkIndex = 0;

      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];
        const sentenceTokens = this.estimateTokenCount(sentence);

        // Check if adding this sentence would exceed chunk size
        if (currentTokenCount + sentenceTokens > strategy.maxChunkSize && currentChunk) {
          // Check semantic boundary
          const nextSentence = sentences[i + 1];
          const semanticSimilarity = nextSentence
            ? await this.calculateSemanticSimilarity(sentence, nextSentence)
            : 0;

          if (semanticSimilarity < strategy.semanticThreshold) {
            // Create chunk at semantic boundary
            chunkedResults.push(
              this.createChunkedResult(
                result,
                currentChunk.trim(),
                chunkIndex++,
                'semantic_boundary'
              )
            );

            // Start new chunk with overlap
            const overlapSentences = this.getOverlapSentences(sentences, i, strategy.overlapSize);
            currentChunk = overlapSentences.join(' ') + ' ' + sentence;
            currentTokenCount = this.estimateTokenCount(currentChunk);
          } else {
            currentChunk += ' ' + sentence;
            currentTokenCount += sentenceTokens;
          }
        } else {
          currentChunk += (currentChunk ? ' ' : '') + sentence;
          currentTokenCount += sentenceTokens;
        }
      }

      // Add final chunk
      if (currentChunk.trim()) {
        chunkedResults.push(
          this.createChunkedResult(result, currentChunk.trim(), chunkIndex, 'final_chunk')
        );
      }
    }

    return chunkedResults;
  }

  private async applyAdaptiveChunking(
    searchResults: SearchResult[],
    strategy: ChunkingStrategy
  ): Promise<SearchResult[]> {
    const chunkedResults: SearchResult[] = [];

    for (const result of searchResults) {
      const content = result.content;

      // Analyze content characteristics
      const contentDensity = this.analyzeContentDensity(content);
      const topicCoherence = this.analyzeTopicCoherence(content);
      const readability = this.analyzeReadability(content);

      // Calculate adaptive chunk size
      const adaptiveChunkSize = this.calculateAdaptiveChunkSize(strategy, {
        contentDensity,
        topicCoherence,
        readability,
      });

      // Apply chunking with adaptive size
      const adaptedStrategy = {
        ...strategy,
        maxChunkSize: adaptiveChunkSize,
        minChunkSize: Math.min(strategy.minChunkSize, adaptiveChunkSize * 0.5),
      };

      const chunks = await this.applySemanticChunking([result], adaptedStrategy);
      chunkedResults.push(...chunks);
    }

    return chunkedResults;
  }

  private async applyTopicBasedChunking(
    searchResults: SearchResult[],
    strategy: ChunkingStrategy
  ): Promise<SearchResult[]> {
    const chunkedResults: SearchResult[] = [];

    for (const result of searchResults) {
      const content = result.content;
      const topics = this.extractTopics(content);

      // Group sentences by topic
      const sentences = this.splitIntoSentences(content);
      const topicGroups = await this.groupSentencesByTopic(sentences, topics);

      let chunkIndex = 0;
      for (const topicGroup of topicGroups) {
        let currentChunk = '';
        let currentTokenCount = 0;

        for (const sentence of topicGroup.sentences) {
          const sentenceTokens = this.estimateTokenCount(sentence);

          if (currentTokenCount + sentenceTokens > strategy.maxChunkSize && currentChunk) {
            chunkedResults.push(
              this.createChunkedResult(
                result,
                currentChunk.trim(),
                chunkIndex++,
                `topic_${topicGroup.topic}`
              )
            );
            currentChunk = sentence;
            currentTokenCount = sentenceTokens;
          } else {
            currentChunk += (currentChunk ? ' ' : '') + sentence;
            currentTokenCount += sentenceTokens;
          }
        }

        if (currentChunk.trim()) {
          chunkedResults.push(
            this.createChunkedResult(
              result,
              currentChunk.trim(),
              chunkIndex++,
              `topic_${topicGroup.topic}`
            )
          );
        }
      }
    }

    return chunkedResults;
  }

  private async applyStandardChunking(
    searchResults: SearchResult[],
    strategy: ChunkingStrategy
  ): Promise<SearchResult[]> {
    const chunkedResults: SearchResult[] = [];

    for (const result of searchResults) {
      const content = result.content;
      const words = content.split(/\s+/);

      let currentChunk = '';
      let chunkIndex = 0;

      for (let i = 0; i < words.length; i += strategy.maxChunkSize) {
        const chunkWords = words.slice(i, i + strategy.maxChunkSize);
        currentChunk = chunkWords.join(' ');

        // Add overlap from previous chunk
        if (i > 0 && strategy.overlapSize > 0) {
          const overlapWords = words.slice(Math.max(0, i - strategy.overlapSize), i);
          currentChunk = overlapWords.join(' ') + ' ' + currentChunk;
        }

        chunkedResults.push(
          this.createChunkedResult(result, currentChunk, chunkIndex++, 'standard')
        );
      }
    }

    return chunkedResults;
  }

  /**
   * 🗜️ Context compression techniques
   */
  private async compressContext(
    chunks: SearchResult[],
    conversationContext: ConversationContext,
    compressionConfig: CompressionConfig
  ): Promise<SearchResult[]> {
    if (!compressionConfig.enabled) {
      return chunks;
    }

    const compressedChunks: SearchResult[] = [];

    for (const chunk of chunks) {
      const cacheKey = `${chunk.id}_${compressionConfig.algorithm}_${compressionConfig.compressionRatio}`;

      let compressedContent: string;
      if (this.compressionCache.has(cacheKey)) {
        compressedContent = this.compressionCache.get(cacheKey)!;
      } else {
        compressedContent = await this.applyCompression(
          chunk.content,
          compressionConfig,
          conversationContext
        );
        this.compressionCache.set(cacheKey, compressedContent);
      }

      // Verify compression quality
      const qualityScore = await this.assessCompressionQuality(
        chunk.content,
        compressedContent,
        compressionConfig
      );

      if (qualityScore >= compressionConfig.qualityThreshold) {
        compressedChunks.push({
          ...chunk,
          content: compressedContent,
          metadata: {
            ...chunk.metadata,
            compressed: true,
            compressionRatio: compressedContent.length / chunk.content.length,
            qualityScore,
          },
        });
      } else {
        compressedChunks.push(chunk);
      }
    }

    return compressedChunks;
  }

  private async applyCompression(
    content: string,
    config: CompressionConfig,
    conversationContext: ConversationContext
  ): Promise<string> {
    switch (config.algorithm) {
      case 'extractive':
        return this.applyExtractiveSummary(content, config);
      case 'abstractive':
        return this.applyAbstractiveSummary(content, config, conversationContext);
      case 'hybrid':
        return this.applyHybridCompression(content, config, conversationContext);
      default:
        return content;
    }
  }

  private applyExtractiveSummary(content: string, config: CompressionConfig): string {
    const sentences = this.splitIntoSentences(content);
    const sentenceScores = sentences.map(sentence => ({
      sentence,
      score: this.calculateSentenceImportance(sentence, content),
    }));

    // Sort by importance and select top sentences
    sentenceScores.sort((a, b) => b.score - a.score);
    const targetSentenceCount = Math.ceil(sentences.length * config.compressionRatio);
    const selectedSentences = sentenceScores.slice(0, targetSentenceCount).map(s => s.sentence);

    return selectedSentences.join(' ');
  }

  private async applyAbstractiveSummary(
    content: string,
    config: CompressionConfig,
    conversationContext: ConversationContext
  ): Promise<string> {
    // Simple abstractive summary using key phrases and entities
    const keyPhrases = this.extractKeyPhrases(content);
    const entities = conversationContext.entities;

    // Create summary focusing on key information
    const summary = this.generateAbstractiveSummary(content, keyPhrases, entities);

    const targetLength = Math.ceil(content.length * config.compressionRatio);
    return summary.length > targetLength ? summary.substring(0, targetLength) + '...' : summary;
  }

  private async applyHybridCompression(
    content: string,
    config: CompressionConfig,
    conversationContext: ConversationContext
  ): Promise<string> {
    // First apply extractive to get important sentences
    const extractiveResult = this.applyExtractiveSummary(content, {
      ...config,
      compressionRatio: Math.sqrt(config.compressionRatio), // Intermediate compression
    });

    // Then apply abstractive to the extracted content
    const hybridResult = await this.applyAbstractiveSummary(
      extractiveResult,
      config,
      conversationContext
    );

    return hybridResult;
  }

  /**
   * 💭 Multi-turn conversation context handling
   */
  private async getOrCreateConversationContext(
    conversationId: string,
    currentMessage: string
  ): Promise<ConversationContext> {
    if (this.conversationContexts.has(conversationId)) {
      const context = this.conversationContexts.get(conversationId)!;

      // Add current message
      const messageEntry: ContextMessage = {
        id: `msg_${Date.now()}`,
        role: 'user',
        content: currentMessage,
        timestamp: new Date().toISOString(),
        relevantKnowledge: [],
        importance: this.calculateMessageImportance(currentMessage, context),
        metadata: {
          tokenCount: this.estimateTokenCount(currentMessage),
          keyEntities: this.extractEntities(currentMessage),
          topicTags: this.extractTopics(currentMessage),
          sentiment: this.analyzeSentiment(currentMessage),
        },
      };

      context.messages.push(messageEntry);
      context.lastUpdated = new Date().toISOString();

      // Update conversation summary and topics
      await this.updateConversationSummary(context);

      return context;
    } else {
      // Create new conversation context
      const newContext: ConversationContext = {
        id: conversationId,
        userId: '', // Will be set by caller
        agentId: '', // Will be set by caller
        messages: [],
        summary: '',
        keyTopics: [],
        entities: [],
        lastUpdated: new Date().toISOString(),
        contextWindow: this.config.maxContextTokens,
        compressionLevel: this.config.compressionConfig.compressionRatio,
      };

      this.conversationContexts.set(conversationId, newContext);
      return await this.getOrCreateConversationContext(conversationId, currentMessage);
    }
  }

  private async updateConversationContext(
    conversationId: string,
    currentMessage: string,
    optimizedContext: OptimizedContext
  ): Promise<void> {
    const context = this.conversationContexts.get(conversationId);
    if (!context) return;

    // Update key topics with new insights
    const newTopics = optimizedContext.keyInsights;
    context.keyTopics = [...new Set([...context.keyTopics, ...newTopics])].slice(0, 10);

    // Update entities
    const newEntities = Object.keys(optimizedContext.entityMentions);
    context.entities = [...new Set([...context.entities, ...newEntities])].slice(0, 20);

    // Maintain conversation memory size
    if (context.messages.length > this.config.conversationMemorySize) {
      context.messages = context.messages.slice(-this.config.conversationMemorySize);
    }

    context.lastUpdated = new Date().toISOString();
  }

  /**
   * 🏗️ Build optimized context
   */
  private async buildOptimizedContext(
    compressedChunks: SearchResult[],
    conversationContext: ConversationContext,
    currentMessage: string,
    config: OptimizationConfig
  ): Promise<OptimizedContext> {
    const startTime = Date.now();

    // Calculate total token count
    let totalTokens = 0;
    let contextContent = '';

    // Add conversation summary if available
    if (conversationContext.summary && config.enableSummaryGeneration) {
      const summaryTokens = this.estimateTokenCount(conversationContext.summary);
      if (totalTokens + summaryTokens <= config.maxContextTokens * 0.2) {
        // 20% for summary
        contextContent += `[Conversation Summary]: ${conversationContext.summary}\n\n`;
        totalTokens += summaryTokens;
      }
    }

    // Add compressed chunks in relevance order
    const sortedChunks = compressedChunks.sort((a, b) => b.relevanceScore - a.relevanceScore);
    const selectedChunks: SearchResult[] = [];

    for (const chunk of sortedChunks) {
      const chunkTokens = this.estimateTokenCount(chunk.content);

      if (totalTokens + chunkTokens <= config.maxContextTokens) {
        contextContent += `[Source: ${chunk.source.title}]: ${chunk.content}\n\n`;
        totalTokens += chunkTokens;
        selectedChunks.push(chunk);
      } else {
        break;
      }
    }

    // Extract key insights and entities
    const keyInsights = this.extractKeyInsights(contextContent);
    const entityMentions = this.extractEntityMentions(contextContent);

    // Calculate quality metrics
    const qualityScore = this.calculateContextQuality(contextContent, currentMessage);
    const coherenceScore = this.calculateContextCoherence(selectedChunks);
    const topicConsistency = this.calculateTopicConsistency(
      selectedChunks,
      conversationContext.keyTopics
    );

    const processingTime = Date.now() - startTime;

    return {
      content: contextContent.trim(),
      tokenCount: totalTokens,
      relevanceScore: this.calculateAverageRelevance(selectedChunks),
      compressionRatio: this.calculateCompressionRatio(selectedChunks),
      sources: selectedChunks,
      metadata: {
        originalTokenCount: this.estimateOriginalTokenCount(selectedChunks),
        compressionTime: processingTime,
        chunkingStrategy: config.chunkingStrategy.type,
        qualityScore,
        coherenceScore,
        topicConsistency,
      },
      conversationSummary: conversationContext.summary,
      keyInsights,
      entityMentions,
    };
  }

  /**
   * 💾 Context persistence
   */
  private async persistContext(
    conversationId: string,
    optimizedContext: OptimizedContext
  ): Promise<void> {
    // In a real implementation, this would save to database
    console.log(`💾 Persisting context for conversation ${conversationId}`);

    // For now, we'll keep it in memory with cleanup
    setTimeout(() => {
      if (this.conversationContexts.has(conversationId)) {
        const context = this.conversationContexts.get(conversationId)!;
        const timeSinceUpdate = Date.now() - new Date(context.lastUpdated).getTime();

        if (timeSinceUpdate > this.config.persistenceTimeout) {
          this.conversationContexts.delete(conversationId);
          console.log(`🗑️ Cleaned up expired context for conversation ${conversationId}`);
        }
      }
    }, this.config.persistenceTimeout);
  }

  /**
   * 🧹 Context cleanup and maintenance
   */
  private startContextCleanup(): void {
    setInterval(() => {
      this.cleanupExpiredContexts();
      this.cleanupCaches();
    }, 300000); // Every 5 minutes
  }

  private cleanupExpiredContexts(): void {
    const now = Date.now();
    const expiredContexts: string[] = [];

    for (const [conversationId, context] of this.conversationContexts.entries()) {
      const timeSinceUpdate = now - new Date(context.lastUpdated).getTime();

      if (timeSinceUpdate > this.config.persistenceTimeout) {
        expiredContexts.push(conversationId);
      }
    }

    expiredContexts.forEach(id => {
      this.conversationContexts.delete(id);
    });

    if (expiredContexts.length > 0) {
      console.log(`🧹 Cleaned up ${expiredContexts.length} expired conversation contexts`);
    }
  }

  private cleanupCaches(): void {
    // Clean compression cache if it gets too large
    if (this.compressionCache.size > 1000) {
      const keys = Array.from(this.compressionCache.keys());
      const toDelete = keys.slice(0, keys.length - 800); // Keep 800 most recent
      toDelete.forEach(key => this.compressionCache.delete(key));
    }

    // Clean chunking cache if it gets too large
    if (this.chunkingCache.size > 500) {
      const keys = Array.from(this.chunkingCache.keys());
      const toDelete = keys.slice(0, keys.length - 400); // Keep 400 most recent
      toDelete.forEach(key => this.chunkingCache.delete(key));
    }
  }

  // Helper methods for context optimization
  private splitIntoSentences(text: string): string[] {
    return text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  }

  private estimateTokenCount(text: string): number {
    return Math.ceil(text.length / 4); // Rough estimate: ~4 chars per token
  }

  private async calculateSemanticSimilarity(text1: string, text2: string): Promise<number> {
    // Simple similarity calculation - in real implementation, use embeddings
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
  }

  private getOverlapSentences(
    sentences: string[],
    currentIndex: number,
    overlapSize: number
  ): string[] {
    const start = Math.max(
      0,
      currentIndex - Math.floor(overlapSize / this.estimateTokenCount(sentences[currentIndex]))
    );
    return sentences.slice(start, currentIndex);
  }

  private createChunkedResult(
    originalResult: SearchResult,
    chunkContent: string,
    chunkIndex: number,
    chunkType: string
  ): SearchResult {
    return {
      ...originalResult,
      id: `${originalResult.id}_chunk_${chunkIndex}`,
      chunkId: `chunk_${chunkIndex}`,
      content: chunkContent,
      metadata: {
        ...originalResult.metadata,
        chunkIndex,
        chunkType,
        originalId: originalResult.id,
      },
    };
  }

  private analyzeContentDensity(content: string): number {
    const words = content.split(/\s+/);
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    return uniqueWords.size / words.length;
  }

  private analyzeTopicCoherence(content: string): number {
    // Simple topic coherence analysis
    const sentences = this.splitIntoSentences(content);
    if (sentences.length < 2) return 1.0;

    let totalSimilarity = 0;
    let comparisons = 0;

    for (let i = 0; i < sentences.length - 1; i++) {
      for (let j = i + 1; j < sentences.length; j++) {
        // This would use semantic similarity in real implementation
        const similarity = this.calculateSimpleWordOverlap(sentences[i], sentences[j]);
        totalSimilarity += similarity;
        comparisons++;
      }
    }

    return comparisons > 0 ? totalSimilarity / comparisons : 0;
  }

  private analyzeReadability(content: string): number {
    const words = content.split(/\s+/);
    const sentences = this.splitIntoSentences(content);

    if (sentences.length === 0) return 0;

    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord =
      words.reduce((sum, word) => sum + this.countSyllables(word), 0) / words.length;

    // Simple readability score (inverse of complexity)
    const complexity = avgWordsPerSentence * 0.39 + avgSyllablesPerWord * 11.8 - 15.59;
    return Math.max(0, Math.min(1, (100 - complexity) / 100));
  }

  private calculateAdaptiveChunkSize(
    strategy: ChunkingStrategy,
    factors: { contentDensity: number; topicCoherence: number; readability: number }
  ): number {
    const { contentDensity, topicCoherence, readability } = factors;
    const { adaptiveFactors } = strategy;

    // Calculate adaptive multiplier
    const adaptiveScore =
      contentDensity * adaptiveFactors.contentDensity +
      topicCoherence * adaptiveFactors.topicCoherence +
      readability * adaptiveFactors.readability;

    // Adjust chunk size based on content characteristics
    const multiplier = 0.5 + adaptiveScore * 1.0; // Range: 0.5 to 1.5
    return Math.floor(strategy.maxChunkSize * multiplier);
  }

  private extractTopics(content: string): string[] {
    // Simple topic extraction based on key phrases and entities
    const words = content.toLowerCase().split(/\s+/);
    const stopWords = new Set([
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
      'from',
      'as',
      'is',
      'was',
      'are',
      'were',
      'be',
      'been',
      'being',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'should',
      'could',
      'may',
      'might',
      'must',
      'can',
      'this',
      'that',
      'these',
      'those',
      'i',
      'you',
      'he',
      'she',
      'it',
      'we',
      'they',
      'my',
      'your',
      'his',
      'her',
      'its',
      'our',
      'their',
    ]);

    // Extract meaningful words (length > 3, not stop words)
    const meaningfulWords = words.filter(
      word => word.length > 3 && !stopWords.has(word) && /^[a-zA-Z]+$/.test(word)
    );

    // Count word frequency
    const wordFreq = meaningfulWords.reduce(
      (acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Get top topics based on frequency
    const sortedWords = Object.entries(wordFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);

    return sortedWords;
  }

  private async groupSentencesByTopic(
    sentences: string[],
    topics: string[]
  ): Promise<Array<{ topic: string; sentences: string[] }>> {
    const groups: Array<{ topic: string; sentences: string[] }> = topics.map(topic => ({
      topic,
      sentences: [],
    }));

    // Add a general group for sentences that don't match specific topics
    groups.push({ topic: 'general', sentences: [] });

    for (const sentence of sentences) {
      let bestTopic = 'general';
      let bestScore = 0;

      for (const topic of topics) {
        const score = this.calculateTopicSentenceScore(sentence, topic);
        if (score > bestScore) {
          bestScore = score;
          bestTopic = topic;
        }
      }

      const group = groups.find(g => g.topic === bestTopic);
      if (group) {
        group.sentences.push(sentence);
      }
    }

    return groups.filter(group => group.sentences.length > 0);
  }

  private calculateTopicSentenceScore(sentence: string, topic: string): number {
    const sentenceWords = sentence.toLowerCase().split(/\s+/);
    const topicWords = topic.split(/\s+/);

    let matches = 0;
    for (const word of sentenceWords) {
      if (topicWords.some(topicWord => word.includes(topicWord) || topicWord.includes(word))) {
        matches++;
      }
    }

    return sentenceWords.length > 0 ? matches / sentenceWords.length : 0;
  }

  private calculateSentenceImportance(sentence: string, fullContent: string): number {
    const sentenceWords = sentence.toLowerCase().split(/\s+/);
    const contentWords = fullContent.toLowerCase().split(/\s+/);

    // Calculate term frequency
    let importance = 0;
    const wordFreq: { [word: string]: number } = {};
    contentWords.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    for (const word of sentenceWords) {
      if (word.length > 3) {
        // Skip short words
        const freq = wordFreq[word] || 0;
        importance += freq / contentWords.length;
      }
    }

    // Normalize by sentence length
    return sentenceWords.length > 0 ? importance / sentenceWords.length : 0;
  }

  private extractKeyPhrases(content: string): string[] {
    // Simple key phrase extraction
    const words = content.split(/\s+/);
    const phrases: string[] = [];

    // Extract 2-3 word phrases
    for (let i = 0; i < words.length - 1; i++) {
      const twoWordPhrase = `${words[i]} ${words[i + 1]}`;
      if (twoWordPhrase.length > 6) {
        phrases.push(twoWordPhrase);
      }

      if (i < words.length - 2) {
        const threeWordPhrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
        if (threeWordPhrase.length > 10) {
          phrases.push(threeWordPhrase);
        }
      }
    }

    return phrases.slice(0, 10); // Return top 10 phrases
  }

  private generateAbstractiveSummary(
    content: string,
    keyPhrases: string[],
    entities: string[]
  ): string {
    // Simple abstractive summary generation
    const sentences = this.splitIntoSentences(content);
    const importantSentences = sentences.filter(sentence => {
      const lowerSentence = sentence.toLowerCase();
      return (
        keyPhrases.some(phrase => lowerSentence.includes(phrase.toLowerCase())) ||
        entities.some(entity => lowerSentence.includes(entity.toLowerCase()))
      );
    });

    return importantSentences.slice(0, 3).join('. ') + '.';
  }

  private async assessCompressionQuality(
    original: string,
    compressed: string,
    config: CompressionConfig
  ): Promise<number> {
    // Simple quality assessment
    const originalLength = original.length;
    const compressedLength = compressed.length;
    const compressionRatio = compressedLength / originalLength;

    // Check if compression ratio is within expected range
    const ratioScore = Math.abs(compressionRatio - config.compressionRatio) < 0.2 ? 1.0 : 0.5;

    // Check if key entities are preserved (if enabled)
    let entityScore = 1.0;
    if (config.preserveKeyEntities) {
      const originalEntities = this.extractEntities(original);
      const compressedEntities = this.extractEntities(compressed);
      const preservedEntities = originalEntities.filter(entity =>
        compressedEntities.includes(entity)
      );
      entityScore =
        originalEntities.length > 0 ? preservedEntities.length / originalEntities.length : 1.0;
    }

    // Simple coherence check
    const coherenceScore = this.checkCompressionCoherence(compressed);

    return ratioScore * 0.3 + entityScore * 0.4 + coherenceScore * 0.3;
  }

  private calculateMessageImportance(message: string, context: ConversationContext): number {
    // Calculate importance based on question words, topics, and entities
    const questionWords = ['what', 'how', 'why', 'when', 'where', 'who'];
    const lowerMessage = message.toLowerCase();

    let importance = 0.5; // Base importance

    // Check for question words
    if (questionWords.some(word => lowerMessage.includes(word))) {
      importance += 0.3;
    }

    // Check for known topics
    const messageTopics = this.extractTopics(message);
    const sharedTopics = messageTopics.filter(topic =>
      context.keyTopics.some(
        contextTopic =>
          contextTopic.toLowerCase().includes(topic) || topic.includes(contextTopic.toLowerCase())
      )
    );
    if (sharedTopics.length > 0) {
      importance += 0.2;
    }

    return Math.min(1.0, importance);
  }

  private extractEntities(text: string): string[] {
    // Simple entity extraction - in real implementation, use NER
    const words = text.split(/\s+/);
    const entities: string[] = [];

    for (const word of words) {
      // Detect capitalized words (potential entities)
      if (/^[A-Z][a-z]+/.test(word) && word.length > 2) {
        entities.push(word);
      }
    }

    return [...new Set(entities)];
  }

  private analyzeSentiment(text: string): string {
    // Simple sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'perfect'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'wrong', 'error'];

    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private async updateConversationSummary(context: ConversationContext): Promise<void> {
    if (context.messages.length < 3) return;

    // Generate summary from recent messages
    const recentMessages = context.messages.slice(-5);
    const messageContents = recentMessages.map(m => m.content).join(' ');

    // Simple summary generation
    const keyPoints = this.extractKeyPhrases(messageContents);
    context.summary = `Recent discussion about: ${keyPoints.slice(0, 3).join(', ')}`;
  }

  private extractKeyInsights(content: string): string[] {
    // Extract key insights from content
    const insights: string[] = [];
    const sentences = this.splitIntoSentences(content);

    // Look for sentences with insight indicators
    const insightIndicators = [
      'because',
      'therefore',
      'however',
      'important',
      'key',
      'significant',
    ];

    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      if (insightIndicators.some(indicator => lowerSentence.includes(indicator))) {
        insights.push(sentence.trim());
      }
    }

    return insights.slice(0, 5);
  }

  private extractEntityMentions(content: string): { [entity: string]: number } {
    const entities = this.extractEntities(content);
    const mentions: { [entity: string]: number } = {};

    const lowerContent = content.toLowerCase();
    for (const entity of entities) {
      const regex = new RegExp(entity.toLowerCase(), 'g');
      const matches = lowerContent.match(regex);
      mentions[entity] = matches ? matches.length : 0;
    }

    return mentions;
  }

  private calculateContextQuality(contextContent: string, query: string): number {
    // Simple quality calculation based on relevance to query
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentWords = contextContent.toLowerCase().split(/\s+/);

    const relevantWords = queryWords.filter(word =>
      contentWords.some(contentWord => contentWord.includes(word) || word.includes(contentWord))
    );

    return queryWords.length > 0 ? relevantWords.length / queryWords.length : 0;
  }

  private calculateContextCoherence(chunks: SearchResult[]): number {
    if (chunks.length < 2) return 1.0;

    let totalCoherence = 0;
    let comparisons = 0;

    for (let i = 0; i < chunks.length - 1; i++) {
      for (let j = i + 1; j < chunks.length; j++) {
        const coherence = this.calculateSimpleWordOverlap(chunks[i].content, chunks[j].content);
        totalCoherence += coherence;
        comparisons++;
      }
    }

    return comparisons > 0 ? totalCoherence / comparisons : 0;
  }

  private calculateTopicConsistency(chunks: SearchResult[], conversationTopics: string[]): number {
    if (conversationTopics.length === 0) return 1.0;

    let consistentChunks = 0;
    for (const chunk of chunks) {
      const chunkTopics = this.extractTopics(chunk.content);
      const hasConsistentTopic = chunkTopics.some(topic =>
        conversationTopics.some(convTopic => topic.includes(convTopic) || convTopic.includes(topic))
      );
      if (hasConsistentTopic) {
        consistentChunks++;
      }
    }

    return chunks.length > 0 ? consistentChunks / chunks.length : 0;
  }

  private calculateAverageRelevance(chunks: SearchResult[]): number {
    if (chunks.length === 0) return 0;
    const totalRelevance = chunks.reduce((sum, chunk) => sum + chunk.relevanceScore, 0);
    return totalRelevance / chunks.length;
  }

  private calculateCompressionRatio(chunks: SearchResult[]): number {
    let originalLength = 0;
    let compressedLength = 0;

    for (const chunk of chunks) {
      compressedLength += chunk.content.length;

      if (chunk.metadata?.compressed) {
        // Estimate original length
        const ratio = chunk.metadata.compressionRatio || 0.7;
        originalLength += chunk.content.length / ratio;
      } else {
        originalLength += chunk.content.length;
      }
    }

    return originalLength > 0 ? compressedLength / originalLength : 1.0;
  }

  private estimateOriginalTokenCount(chunks: SearchResult[]): number {
    let originalTokens = 0;

    for (const chunk of chunks) {
      const currentTokens = this.estimateTokenCount(chunk.content);

      if (chunk.metadata?.compressed) {
        const ratio = chunk.metadata.compressionRatio || 0.7;
        originalTokens += currentTokens / ratio;
      } else {
        originalTokens += currentTokens;
      }
    }

    return Math.ceil(originalTokens);
  }

  private calculateSimpleWordOverlap(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private countSyllables(word: string): number {
    // Simple syllable counting
    const vowels = 'aeiouyAEIOUY';
    let count = 0;
    let previousWasVowel = false;

    for (const char of word) {
      const isVowel = vowels.includes(char);
      if (isVowel && !previousWasVowel) {
        count++;
      }
      previousWasVowel = isVowel;
    }

    return Math.max(1, count);
  }

  private checkCompressionCoherence(text: string): number {
    // Simple coherence check for compressed text
    const sentences = this.splitIntoSentences(text);
    if (sentences.length < 2) return 1.0;

    let coherentTransitions = 0;
    for (let i = 0; i < sentences.length - 1; i++) {
      const currentSentence = sentences[i];
      const nextSentence = sentences[i + 1];

      // Check for coherent transitions (shared words, pronouns, etc.)
      const coherence = this.calculateSimpleWordOverlap(currentSentence, nextSentence);
      if (coherence > 0.1) {
        // Threshold for coherent transition
        coherentTransitions++;
      }
    }

    return sentences.length > 1 ? coherentTransitions / (sentences.length - 1) : 1.0;
  }

  // Public API methods
  getConversationContext(conversationId: string): ConversationContext | undefined {
    return this.conversationContexts.get(conversationId);
  }

  getAllConversationContexts(): ConversationContext[] {
    return Array.from(this.conversationContexts.values());
  }

  clearConversationContext(conversationId: string): void {
    this.conversationContexts.delete(conversationId);
  }

  updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getStats(): any {
    return {
      activeConversations: this.conversationContexts.size,
      compressionCacheSize: this.compressionCache.size,
      chunkingCacheSize: this.chunkingCache.size,
      config: this.config,
    };
  }
}

export const contextOptimizationService = ContextOptimizationService.getInstance();
