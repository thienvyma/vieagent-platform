/**
 * 🧠 UNIFIED VECTOR KNOWLEDGE SERVICE
 * Kết nối EmbeddingGenerator với ChromaDBManager để tạo complete flow
 * Upload → Parse → Chunk → Vectorize → Store → Search
 */

import {
  ChromaDBManager,
  type SearchQuery,
  type SearchResult,
  type VectorStorageResult,
} from './chromadb-integration';

// Interface for chunk data
interface ChunkData {
  id: string;
  chunkId: string;
  documentId: string;
  content: string;
  metadata?: any;
  qualityScore?: number;
}

// Interface for embedding result
interface EmbeddingResult {
  success: boolean;
  vector?: number[];
  error?: string;
  metadata?: any;
}

// Interface for knowledge processing result
interface KnowledgeProcessingResult {
  success: boolean;
  processed: number;
  failed: number;
  vectors: any[];
  errors: string[];
  vectorStorageResult?: VectorStorageResult;
}

export class VectorKnowledgeService {
  private chromaManager: ChromaDBManager;
  private embeddingGenerator: any; // Will integrate with actual EmbeddingGenerator

  constructor(
    options: {
      chromaOptions?: any;
      embeddingOptions?: any;
    } = {}
  ) {
    // Initialize ChromaDB Manager
    this.chromaManager = new ChromaDBManager(options.chromaOptions);

    // Initialize Embedding Generator (will be replaced with real implementation)
    this.initializeEmbeddingGenerator(options.embeddingOptions);
  }

  private initializeEmbeddingGenerator(options: any = {}) {
    // For now, we'll create a simple interface
    // This will be replaced with actual EmbeddingGenerator integration
    this.embeddingGenerator = {
      generateSingleEmbedding: async (text: string): Promise<EmbeddingResult> => {
        try {
          // TODO: Replace with actual EmbeddingGenerator call
          const OpenAI = require('openai');
          const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
          });

          const response = await openai.embeddings.create({
            model: options.model || 'text-embedding-3-small',
            input: text.trim(),
            dimensions: options.dimensions || 1536,
          });

          return {
            success: true,
            vector: response.data[0].embedding,
            metadata: {
              model: options.model || 'text-embedding-3-small',
              tokens: response.usage.total_tokens,
              textLength: text.length,
            },
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            metadata: { textLength: text.length },
          };
        }
      },
    };
  }

  /**
   * Process documents into knowledge base
   * Complete flow: Chunk → Vectorize → Store
   */
  async processDocuments(
    documents: Array<{
      id: string;
      content: string;
      metadata?: any;
    }>,
    collectionName: string = 'knowledge'
  ): Promise<KnowledgeProcessingResult> {
    console.log(`🧠 Processing ${documents.length} documents into knowledge base...`);

    let processed = 0;
    let failed = 0;
    const vectors: any[] = [];
    const errors: string[] = [];

    try {
      // Ensure collection exists
      await this.chromaManager.createCollection(collectionName, {
        description: 'Knowledge base collection',
        embeddingModel: 'openai',
        embeddingDimension: 1536,
      });

      // Process each document
      for (const doc of documents) {
        try {
          // For now, we'll treat each document as a single chunk
          // TODO: Implement proper chunking strategy
          const chunks = this.createChunks(doc);

          // Generate embeddings for chunks
          for (const chunk of chunks) {
            const embeddingResult = await this.embeddingGenerator.generateSingleEmbedding(
              chunk.content
            );

            if (embeddingResult.success && embeddingResult.vector) {
              vectors.push({
                id: chunk.id,
                chunkId: chunk.chunkId,
                documentId: chunk.documentId,
                embedding: embeddingResult.vector,
                content: chunk.content,
                metadata: {
                  ...chunk.metadata,
                  ...embeddingResult.metadata,
                  processedAt: new Date().toISOString(),
                },
              });
              processed++;
            } else {
              failed++;
              errors.push(
                `Failed to generate embedding for chunk ${chunk.id}: ${embeddingResult.error}`
              );
            }
          }
        } catch (error) {
          failed++;
          errors.push(
            `Failed to process document ${doc.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      // Store vectors in ChromaDB
      let vectorStorageResult: VectorStorageResult | undefined;
      if (vectors.length > 0) {
        vectorStorageResult = await this.chromaManager.storeVectors(
          collectionName,
          vectors,
          'batch'
        );
      }

      console.log(`✅ Processing complete: ${processed} processed, ${failed} failed`);

      return {
        success: vectors.length > 0,
        processed,
        failed,
        vectors,
        errors,
        vectorStorageResult,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Knowledge processing failed: ${errorMessage}`);

      return {
        success: false,
        processed,
        failed: documents.length,
        vectors: [],
        errors: [errorMessage],
      };
    }
  }

  /**
   * Search knowledge base
   */
  async searchKnowledge(
    query: string,
    collectionName: string = 'knowledge',
    options: {
      limit?: number;
      threshold?: number;
      filters?: any;
    } = {}
  ): Promise<SearchResult[]> {
    console.log(`🔍 Searching knowledge base for: "${query}"`);

    try {
      // Generate query embedding
      const embeddingResult = await this.embeddingGenerator.generateSingleEmbedding(query);

      if (!embeddingResult.success || !embeddingResult.vector) {
        throw new Error(`Failed to generate query embedding: ${embeddingResult.error}`);
      }

      // Search ChromaDB
      const searchQuery: SearchQuery = {
        query,
        embedding: embeddingResult.vector,
        limit: options.limit || 10,
        threshold: options.threshold || 0.7,
        includeMetadata: true,
        includeContent: true,
        filters: options.filters,
      };

      const results = await this.chromaManager.searchVectors(collectionName, searchQuery);

      console.log(`✅ Found ${results.length} relevant knowledge items`);
      return results;
    } catch (error) {
      console.error(
        `❌ Knowledge search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return [];
    }
  }

  /**
   * Create chunks from document (simple implementation)
   * TODO: Implement proper semantic chunking strategy
   */
  private createChunks(document: { id: string; content: string; metadata?: any }): ChunkData[] {
    const chunkSize = 1000; // Characters per chunk
    const overlap = 200; // Overlap between chunks
    const chunks: ChunkData[] = [];

    const content = document.content;
    let startIndex = 0;
    let chunkIndex = 0;

    while (startIndex < content.length) {
      const endIndex = Math.min(startIndex + chunkSize, content.length);
      const chunkContent = content.slice(startIndex, endIndex);

      // Only create chunk if it has meaningful content
      if (chunkContent.trim().length > 50) {
        chunks.push({
          id: `${document.id}_chunk_${chunkIndex}`,
          chunkId: `chunk_${chunkIndex}`,
          documentId: document.id,
          content: chunkContent.trim(),
          metadata: {
            ...document.metadata,
            chunkIndex,
            startIndex,
            endIndex,
            chunkSize: chunkContent.length,
          },
          qualityScore: this.calculateChunkQuality(chunkContent),
        });
      }

      startIndex = endIndex - overlap;
      chunkIndex++;
    }

    return chunks;
  }

  /**
   * Calculate chunk quality score (simple implementation)
   */
  private calculateChunkQuality(content: string): number {
    // Simple quality scoring based on content characteristics
    let score = 0.5; // Base score

    // Length factor
    if (content.length > 100 && content.length < 2000) {
      score += 0.2;
    }

    // Sentence completeness
    if (content.endsWith('.') || content.endsWith('!') || content.endsWith('?')) {
      score += 0.1;
    }

    // Word density
    const words = content.split(/\s+/).filter(word => word.length > 2);
    if (words.length > 10) {
      score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Get collection statistics
   */
  async getCollectionStats(collectionName: string = 'knowledge') {
    return await this.chromaManager.getCollectionInfo(collectionName);
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.chromaManager.clearCache();
  }
}

// Export singleton instance
export const vectorKnowledgeService = new VectorKnowledgeService({
  chromaOptions: {
    host: process.env.CHROMADB_HOST || 'localhost',
    port: parseInt(process.env.CHROMADB_PORT || '8000'),
    defaultCollection: 'knowledge',
  },
  embeddingOptions: {
    model: 'text-embedding-3-small',
    dimensions: 1536,
  },
});
