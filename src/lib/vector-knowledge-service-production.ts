/**
 * 🔍 Vector Knowledge Service - Production Version
 * Enhanced service với production ChromaDB integration
 */

import { ProductionChromaDBService, VectorDocument, QueryResult } from './chromadb-production';
import { CollectionManager } from './collection-manager';
import { OpenAIEmbeddingService } from './openai-embedding-service';

export interface ChunkingConfig {
  maxChunkSize: number;
  overlapSize: number;
  chunkBoundary: 'sentence' | 'paragraph' | 'word';
  minChunkSize: number;
}

export interface ProcessingStats {
  totalDocuments: number;
  totalChunks: number;
  totalEmbeddings: number;
  processingTime: number;
  errors: number;
  successRate: number;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  metadata: Record<string, any>;
  userId: string;
  type: 'document' | 'conversation' | 'faq' | 'manual';
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChunkQuality {
  score: number; // 0-1
  reasons: string[];
  isValid: boolean;
}

export interface ProcessingResult {
  documentId: string;
  chunksCreated: number;
  embeddingsGenerated: number;
  processingTime: number;
  status: 'success' | 'partial' | 'failed';
  errors: string[];
  quality: ChunkQuality;
}

export class VectorKnowledgeServiceProduction {
  private chromaService: ProductionChromaDBService;
  private collectionManager: CollectionManager;
  private embeddingService: OpenAIEmbeddingService;
  private chunkingConfig: ChunkingConfig;
  private processingStats: ProcessingStats;

  constructor(
    chromaService: ProductionChromaDBService,
    collectionManager: CollectionManager,
    embeddingService: OpenAIEmbeddingService,
    chunkingConfig: Partial<ChunkingConfig> = {}
  ) {
    this.chromaService = chromaService;
    this.collectionManager = collectionManager;
    this.embeddingService = embeddingService;

    this.chunkingConfig = {
      maxChunkSize: chunkingConfig.maxChunkSize || 1000,
      overlapSize: chunkingConfig.overlapSize || 100,
      chunkBoundary: chunkingConfig.chunkBoundary || 'sentence',
      minChunkSize: chunkingConfig.minChunkSize || 100,
    };

    this.processingStats = {
      totalDocuments: 0,
      totalChunks: 0,
      totalEmbeddings: 0,
      processingTime: 0,
      errors: 0,
      successRate: 0,
    };
  }

  /**
   * Process knowledge document với smart chunking
   */
  async processKnowledgeDocument(
    document: KnowledgeDocument,
    collectionName: string = 'knowledge'
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    const result: ProcessingResult = {
      documentId: document.id,
      chunksCreated: 0,
      embeddingsGenerated: 0,
      processingTime: 0,
      status: 'success',
      errors: [],
      quality: { score: 0, reasons: [], isValid: false },
    };

    try {
      console.log(`🔄 Processing document: ${document.id}`);

      // 1. Create chunks với quality scoring
      const chunks = await this.createSmartChunks(document.content, document.id);
      result.chunksCreated = chunks.length;

      if (chunks.length === 0) {
        result.status = 'failed';
        result.errors.push('No valid chunks created');
        return result;
      }

      // 2. Generate embeddings với retry logic
      const vectorDocuments: VectorDocument[] = [];
      let embeddingErrors = 0;

      for (const chunk of chunks) {
        try {
          const embedding = await this.generateEmbeddingWithRetry(chunk.content);

          vectorDocuments.push({
            id: chunk.id,
            content: chunk.content,
            metadata: {
              ...chunk.metadata,
              documentId: document.id,
              documentTitle: document.title,
              documentType: document.type,
              documentSource: document.source,
              userId: document.userId,
              chunkIndex: chunk.index,
              chunkQuality: chunk.quality,
              processedAt: new Date().toISOString(),
            },
            embedding,
          });

          result.embeddingsGenerated++;
        } catch (error) {
          embeddingErrors++;
          result.errors.push(`Embedding failed for chunk ${chunk.id}: ${error}`);
        }
      }

      // 3. Store vectors trong ChromaDB
      if (vectorDocuments.length > 0) {
        await this.chromaService.storeUserVectors(document.userId, collectionName, vectorDocuments);

        // Update collection metadata
        await this.collectionManager.updateDocumentCount(
          document.userId,
          collectionName,
          'knowledge',
          vectorDocuments.length,
          this.calculateContentSize(vectorDocuments)
        );
      }

      // 4. Calculate quality score
      result.quality = this.calculateDocumentQuality(chunks, embeddingErrors);

      // 5. Determine final status
      if (embeddingErrors === 0) {
        result.status = 'success';
      } else if (vectorDocuments.length > 0) {
        result.status = 'partial';
      } else {
        result.status = 'failed';
      }

      result.processingTime = Date.now() - startTime;
      this.updateProcessingStats(result);

      console.log(`✅ Document processed: ${document.id} (${result.status})`);
      return result;
    } catch (error) {
      result.status = 'failed';
      result.errors.push(`Processing failed: ${error}`);
      result.processingTime = Date.now() - startTime;

      this.processingStats.errors++;
      console.error(`❌ Document processing failed: ${document.id}`, error);

      return result;
    }
  }

  /**
   * Create smart chunks với sentence boundary detection
   */
  private async createSmartChunks(
    content: string,
    documentId: string
  ): Promise<
    Array<{
      id: string;
      content: string;
      metadata: Record<string, any>;
      index: number;
      quality: ChunkQuality;
    }>
  > {
    const chunks: Array<{
      id: string;
      content: string;
      metadata: Record<string, any>;
      index: number;
      quality: ChunkQuality;
    }> = [];

    try {
      // Clean content
      const cleanContent = this.cleanContent(content);

      // Split by boundary
      const segments = this.splitByBoundary(cleanContent, this.chunkingConfig.chunkBoundary);

      let currentChunk = '';
      let chunkIndex = 0;

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const potentialChunk = currentChunk + (currentChunk ? ' ' : '') + segment;

        if (potentialChunk.length <= this.chunkingConfig.maxChunkSize) {
          currentChunk = potentialChunk;
        } else {
          // Save current chunk if it meets minimum size
          if (currentChunk.length >= this.chunkingConfig.minChunkSize) {
            const chunkQuality = this.assessChunkQuality(currentChunk);

            if (chunkQuality.isValid) {
              chunks.push({
                id: `${documentId}_chunk_${chunkIndex}`,
                content: currentChunk,
                metadata: {
                  chunkIndex,
                  chunkSize: currentChunk.length,
                  quality: chunkQuality.score,
                },
                index: chunkIndex,
                quality: chunkQuality,
              });
              chunkIndex++;
            }
          }

          // Start new chunk với overlap
          if (this.chunkingConfig.overlapSize > 0 && chunks.length > 0) {
            const overlapWords = currentChunk.split(' ').slice(-this.chunkingConfig.overlapSize);
            currentChunk = overlapWords.join(' ') + ' ' + segment;
          } else {
            currentChunk = segment;
          }
        }
      }

      // Add final chunk
      if (currentChunk.length >= this.chunkingConfig.minChunkSize) {
        const chunkQuality = this.assessChunkQuality(currentChunk);

        if (chunkQuality.isValid) {
          chunks.push({
            id: `${documentId}_chunk_${chunkIndex}`,
            content: currentChunk,
            metadata: {
              chunkIndex,
              chunkSize: currentChunk.length,
              quality: chunkQuality.score,
            },
            index: chunkIndex,
            quality: chunkQuality,
          });
        }
      }

      return chunks;
    } catch (error) {
      console.error('❌ Chunking failed:', error);
      return [];
    }
  }

  /**
   * Clean content before processing
   */
  private cleanContent(content: string): string {
    return content
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s\.\,\!\?\;\:\-\(\)]/g, '') // Remove special chars
      .trim();
  }

  /**
   * Split content by boundary type
   */
  private splitByBoundary(content: string, boundary: ChunkingConfig['chunkBoundary']): string[] {
    switch (boundary) {
      case 'sentence':
        return content.split(/[.!?]+/).filter(s => s.trim().length > 0);
      case 'paragraph':
        return content.split(/\n\s*\n/).filter(s => s.trim().length > 0);
      case 'word':
        return content.split(/\s+/).filter(s => s.trim().length > 0);
      default:
        return [content];
    }
  }

  /**
   * Assess chunk quality
   */
  private assessChunkQuality(chunk: string): ChunkQuality {
    const reasons: string[] = [];
    let score = 1.0;

    // Check minimum length
    if (chunk.length < this.chunkingConfig.minChunkSize) {
      reasons.push('Chunk too short');
      score -= 0.3;
    }

    // Check maximum length
    if (chunk.length > this.chunkingConfig.maxChunkSize) {
      reasons.push('Chunk too long');
      score -= 0.2;
    }

    // Check for meaningful content
    const wordCount = chunk.split(/\s+/).length;
    if (wordCount < 10) {
      reasons.push('Too few words');
      score -= 0.2;
    }

    // Check for sentence completeness
    if (!chunk.match(/[.!?]$/)) {
      reasons.push('Incomplete sentence');
      score -= 0.1;
    }

    // Check for repetitive content
    const uniqueWords = new Set(chunk.toLowerCase().split(/\s+/)).size;
    if (uniqueWords / wordCount < 0.5) {
      reasons.push('Repetitive content');
      score -= 0.2;
    }

    return {
      score: Math.max(0, Math.min(1, score)),
      reasons,
      isValid: score >= 0.5,
    };
  }

  /**
   * Generate embedding với retry logic
   */
  private async generateEmbeddingWithRetry(
    text: string,
    maxRetries: number = 3
  ): Promise<number[]> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const embedding = await this.embeddingService.generateEmbedding(text);
        return embedding;
      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ Embedding attempt ${attempt} failed:`, error);

        if (attempt < maxRetries) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError || new Error('Embedding generation failed after retries');
  }

  /**
   * Calculate document quality
   */
  private calculateDocumentQuality(
    chunks: Array<{ quality: ChunkQuality }>,
    embeddingErrors: number
  ): ChunkQuality {
    if (chunks.length === 0) {
      return { score: 0, reasons: ['No valid chunks'], isValid: false };
    }

    const avgQuality = chunks.reduce((sum, chunk) => sum + chunk.quality.score, 0) / chunks.length;
    const errorRate = embeddingErrors / chunks.length;
    const finalScore = avgQuality * (1 - errorRate);

    const reasons: string[] = [];
    if (errorRate > 0.1) reasons.push('High embedding error rate');
    if (avgQuality < 0.7) reasons.push('Low chunk quality');
    if (chunks.length < 3) reasons.push('Too few chunks');

    return {
      score: finalScore,
      reasons,
      isValid: finalScore >= 0.6,
    };
  }

  /**
   * Calculate content size
   */
  private calculateContentSize(documents: VectorDocument[]): number {
    return documents.reduce((total, doc) => {
      return total + doc.content.length + JSON.stringify(doc.metadata).length;
    }, 0);
  }

  /**
   * Update processing statistics
   */
  private updateProcessingStats(result: ProcessingResult): void {
    this.processingStats.totalDocuments++;
    this.processingStats.totalChunks += result.chunksCreated;
    this.processingStats.totalEmbeddings += result.embeddingsGenerated;
    this.processingStats.processingTime += result.processingTime;

    if (result.status === 'failed') {
      this.processingStats.errors++;
    }

    this.processingStats.successRate =
      (this.processingStats.totalDocuments - this.processingStats.errors) /
      this.processingStats.totalDocuments;
  }

  /**
   * Query knowledge với semantic search
   */
  async queryKnowledge(
    userId: string,
    query: string,
    collectionName: string = 'knowledge',
    options: {
      nResults?: number;
      threshold?: number;
      includeMetadata?: boolean;
      filters?: Record<string, any>;
    } = {}
  ): Promise<{
    results: Array<{
      content: string;
      metadata: Record<string, any>;
      score: number;
    }>;
    totalResults: number;
    processingTime: number;
  }> {
    const startTime = Date.now();

    try {
      const queryResults = await this.chromaService.queryUserVectors(
        userId,
        collectionName,
        [query],
        options.nResults || 5,
        options.filters
      );

      const results = queryResults.documents[0].map((content, index) => ({
        content,
        metadata: queryResults.metadatas[0][index],
        score: 1 - (queryResults.distances[0][index] || 0), // Convert distance to similarity
      }));

      // Filter by threshold if specified
      const filteredResults = options.threshold
        ? results.filter(r => r.score >= options.threshold!)
        : results;

      return {
        results: filteredResults,
        totalResults: filteredResults.length,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('❌ Knowledge query failed:', error);
      throw error;
    }
  }

  /**
   * Get processing statistics
   */
  getProcessingStats(): ProcessingStats {
    return { ...this.processingStats };
  }

  /**
   * Reset processing statistics
   */
  resetProcessingStats(): void {
    this.processingStats = {
      totalDocuments: 0,
      totalChunks: 0,
      totalEmbeddings: 0,
      processingTime: 0,
      errors: 0,
      successRate: 0,
    };
  }

  /**
   * Get service health status
   */
  async getHealthStatus(): Promise<{
    isHealthy: boolean;
    processingStats: ProcessingStats;
    chromaStatus: any;
    collectionStats: any;
  }> {
    try {
      const chromaStatus = await this.chromaService.getHealthStatus();
      const collectionStats = await this.collectionManager.getHealthStatus();

      return {
        isHealthy: chromaStatus.isConnected,
        processingStats: this.processingStats,
        chromaStatus,
        collectionStats,
      };
    } catch (error) {
      return {
        isHealthy: false,
        processingStats: this.processingStats,
        chromaStatus: { error: error.message },
        collectionStats: { error: error.message },
      };
    }
  }
}

// Create singleton instance (will be properly initialized later)
export const vectorKnowledgeServiceProduction = new VectorKnowledgeServiceProduction(
  {} as ProductionChromaDBService,
  {} as CollectionManager,
  {} as OpenAIEmbeddingService
);

export default VectorKnowledgeServiceProduction;
