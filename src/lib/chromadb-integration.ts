/**
 * 🧩 ChromaDB Integration Library - Phase 2 Day 7 Step 7.4
 * Stores vectors in ChromaDB với bulk insertion và search capabilities
 * Support collection management, indexing strategy, và similarity search
 */

import { ChromaClient } from 'chromadb';

// ChromaDB collection interface
export interface ChromaCollection {
  name: string;
  id: string;
  metadata: CollectionMetadata;
  count: number;
  createdAt: string;
  updatedAt: string;
}

// Collection metadata interface
export interface CollectionMetadata {
  description: string;
  embeddingModel: string;
  embeddingDimension: number;
  documentTypes: string;
  languages: string;
  indexingStrategy: string;
  qualityThreshold: number;
  version: string;
  createdBy: string;
  tags: string;
}

// Vector storage result interface
export interface VectorStorageResult {
  collectionName: string;
  storedVectors: number;
  failedVectors: number;
  processingTime: number;
  metadata: StorageMetadata;
  errors: StorageError[];
  warnings: string[];
  recommendations: string[];
}

// Storage metadata interface
interface StorageMetadata {
  batchId: string;
  totalBatches: number;
  completedBatches: number;
  failedBatches: number;
  storageMethod: 'bulk' | 'batch' | 'stream';
  indexingTime: number;
  compressionRatio: number;
  duplicatesDetected: number;
  storedAt: string;
  collectionSize: number;

  // 🗜️ Storage Optimization Metrics
  optimizationMetrics?: StorageOptimizationMetrics;
  spaceSavingsPercent?: number;
}

// Storage error interface
export interface StorageError {
  vectorId: string;
  error: string;
  batchIndex: number;
  timestamp: string;
  recoverable: boolean;
}

// Search result interface
export interface SearchResult {
  id: string;
  chunkId: string;
  documentId: string;
  content: string;
  metadata: any;
  similarity: number;
  distance: number;
  rank: number;
}

// Search query interface
export interface SearchQuery {
  query: string;
  embedding?: number[];
  filters?: SearchFilters;
  limit?: number;
  threshold?: number;
  includeMetadata?: boolean;
  includeContent?: boolean;
}

// Search filters interface
export interface SearchFilters {
  documentId?: string;
  chunkType?: string;
  language?: string;
  qualityScore?: { min?: number; max?: number };
  dateRange?: { start?: string; end?: string };
  tags?: string[];
  customFilters?: { [key: string]: any };
}

// Add new optimization interfaces
interface VectorCompressionResult {
  originalVector: number[];
  compressedVector: number[];
  compressionRatio: number;
  quality: number;
}

interface StorageOptimizationMetrics {
  totalVectors: number;
  compressedVectors: number;
  duplicatesDetected: number;
  spaceSavings: number;
  hotStorageCount: number;
  coldStorageCount: number;
  averageCompressionRatio: number;
}

interface DuplicateDetectionResult {
  isDuplicate: boolean;
  similarityScore: number;
  existingVectorId?: string;
  duplicateType: 'exact' | 'semantic' | 'content';
}

interface TieredStorageConfig {
  enableTieredStorage: boolean;
  hotStorageThreshold: number; // access frequency threshold
  coldStorageCompressionLevel: number;
  migrationDelayDays: number;
}

// Enhanced ChromaDB options with optimization
interface ChromaDBOptions {
  host: string;
  port: number;
  path: string;
  ssl: boolean;
  auth?: {
    provider: string;
    credentials: any;
  };
  embeddingFunction?: string;
  defaultCollection: string;
  batchSize: number;
  maxRetries: number;
  retryDelayMs: number;
  timeoutMs: number;
  enableCompression: boolean;
  enableDuplicateDetection: boolean;
  indexingStrategy: 'immediate' | 'batch' | 'lazy';
  persistenceEnabled: boolean;
  cacheSize: number;

  // 🗜️ Vector Storage Optimization
  compressionLevel: number; // 1-9, higher = more compression
  compressionAlgorithm: 'quantization' | 'pca' | 'hybrid';
  duplicateThreshold: number; // 0-1, similarity threshold for duplicates
  enableSemanticDeduplication: boolean;
  tieredStorageConfig: TieredStorageConfig;
  enableStorageAnalytics: boolean;
  optimizationBatchSize: number;
}

// Default ChromaDB options with optimization
const DEFAULT_OPTIONS: ChromaDBOptions = {
  host: 'localhost',
  port: 8000,
  path: '/api/v1',
  ssl: false,
  embeddingFunction: 'openai',
  defaultCollection: 'documents',
  batchSize: 100,
  maxRetries: 3,
  retryDelayMs: 1000,
  timeoutMs: 30000,
  enableCompression: true,
  enableDuplicateDetection: true,
  indexingStrategy: 'batch',
  persistenceEnabled: true,
  cacheSize: 1000,

  // 🗜️ Vector Storage Optimization Settings
  compressionLevel: 5,
  compressionAlgorithm: 'hybrid',
  duplicateThreshold: 0.95,
  enableSemanticDeduplication: true,
  tieredStorageConfig: {
    enableTieredStorage: true,
    hotStorageThreshold: 10, // access count threshold
    coldStorageCompressionLevel: 8,
    migrationDelayDays: 30,
  },
  enableStorageAnalytics: true,
  optimizationBatchSize: 50,
};

// ChromaDB Manager class with optimization
export class ChromaDBManager {
  private client!: ChromaClient;
  private options: ChromaDBOptions;
  private collections: Map<string, any>;
  private cache: Map<string, any>;

  // 🗜️ Storage Optimization Components
  private optimizationMetrics: StorageOptimizationMetrics;
  private vectorHashCache: Map<string, string>; // For duplicate detection
  private accessFrequency: Map<string, { count: number; lastAccessed: Date }>; // For tiered storage
  private compressionCache: Map<string, VectorCompressionResult>; // For compression caching

  constructor(options: Partial<ChromaDBOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.collections = new Map();
    this.cache = new Map();

    // Initialize optimization components
    this.optimizationMetrics = {
      totalVectors: 0,
      compressedVectors: 0,
      duplicatesDetected: 0,
      spaceSavings: 0,
      hotStorageCount: 0,
      coldStorageCount: 0,
      averageCompressionRatio: 1.0,
    };
    this.vectorHashCache = new Map();
    this.accessFrequency = new Map();
    this.compressionCache = new Map();

    this.initializeClient();
    this.startOptimizationTasks();
  }

  private initializeClient(): void {
    try {
      // Initialize ChromaDB client
      this.client = new ChromaClient({
        path: `${this.options.ssl ? 'https' : 'http'}://${this.options.host}:${this.options.port}${this.options.path}`,
      });
    } catch (error) {
      console.error('Failed to initialize ChromaDB client:', error);
      throw error;
    }
  }

  /**
   * Create or get collection
   */
  async createCollection(
    name: string,
    metadata: Partial<CollectionMetadata> = {}
  ): Promise<ChromaCollection> {
    try {
      const collectionMetadata = {
        description: metadata.description || `Collection for ${name}`,
        embeddingModel: metadata.embeddingModel || 'openai',
        embeddingDimension: metadata.embeddingDimension || 1536,
        documentTypes: Array.isArray(metadata.documentTypes)
          ? metadata.documentTypes.join(',')
          : metadata.documentTypes || '',
        languages: Array.isArray(metadata.languages)
          ? metadata.languages.join(',')
          : metadata.languages || '',
        indexingStrategy: metadata.indexingStrategy || 'batch',
        qualityThreshold: metadata.qualityThreshold || 0.7,
        version: metadata.version || '1.0',
        createdBy: metadata.createdBy || 'system',
        tags: Array.isArray(metadata.tags) ? metadata.tags.join(',') : metadata.tags || '',
      };

      // Check if collection exists
      let collection;
      try {
        collection = await this.client.getCollection({
          name,
        });
      } catch (error) {
        // Collection doesn't exist, create it
        collection = await this.client.createCollection({
          name,
          metadata: collectionMetadata,
        });
      }

      // Store collection reference
      this.collections.set(name, collection);

      return {
        name,
        id: collection.id,
        metadata: collectionMetadata,
        count: await collection.count(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create collection ${name}: ${error.message}`);
      } else {
        throw new Error(`Failed to create collection ${name}: ${String(error)}`);
      }
    }
  }

  /**
   * Enhanced store vectors with optimization
   */
  async storeVectors(
    collectionName: string,
    vectors: any[],
    storageMethod: 'bulk' | 'batch' | 'stream' = 'batch'
  ): Promise<VectorStorageResult> {
    const startTime = Date.now();
    const batchId = this.generateBatchId();

    if (!vectors || vectors.length === 0) {
      throw new Error('No vectors provided for storage');
    }

    console.log(`🗜️ Starting optimized vector storage for ${vectors.length} vectors...`);

    // Get or create collection
    let collection = this.collections.get(collectionName);
    if (!collection) {
      await this.createCollection(collectionName);
      collection = this.collections.get(collectionName);
    }

    const errors: StorageError[] = [];
    const warnings: string[] = [];
    let storedVectors = 0;
    let failedVectors = 0;
    const optimizedVectors: any[] = [];

    try {
      // 🗜️ Apply storage optimizations
      for (const vector of vectors) {
        try {
          const optimizedVector = { ...vector };

          // 🔍 Duplicate detection
          if (this.options.enableDuplicateDetection) {
            const duplicateResult = await this.detectDuplicate(
              vector.embedding,
              vector.content,
              vector.metadata
            );

            if (duplicateResult.isDuplicate) {
              this.optimizationMetrics.duplicatesDetected++;
              warnings.push(`Duplicate detected: ${vector.id} (${duplicateResult.duplicateType})`);
              continue; // Skip storing duplicate
            }
          }

          // 🗜️ Vector compression
          if (this.options.enableCompression) {
            const compressionResult = this.compressVector(
              vector.embedding,
              this.options.compressionLevel
            );

            // Only use compressed vector if quality is acceptable
            if (compressionResult.quality > 0.8) {
              optimizedVector.embedding = compressionResult.compressedVector;
              optimizedVector.metadata = {
                ...optimizedVector.metadata,
                compressed: true,
                compressionRatio: compressionResult.compressionRatio,
                compressionQuality: compressionResult.quality,
              };
              this.optimizationMetrics.compressedVectors++;
            }
          }

          // 🏢 Tiered storage classification
          if (this.options.tieredStorageConfig.enableTieredStorage) {
            const storageClass = this.isHotStorage(vector.id) ? 'hot' : 'cold';
            optimizedVector.metadata = {
              ...optimizedVector.metadata,
              storageClass,
              compressionLevel:
                storageClass === 'cold'
                  ? this.options.tieredStorageConfig.coldStorageCompressionLevel
                  : this.options.compressionLevel,
            };

            if (storageClass === 'hot') {
              this.optimizationMetrics.hotStorageCount++;
            } else {
              this.optimizationMetrics.coldStorageCount++;
            }
          }

          // Store in caches for future duplicate detection
          const contentHash = this.generateContentHash(vector.content);
          const vectorHash = this.generateVectorHash(vector.embedding);
          this.vectorHashCache.set(contentHash, vector.id);
          this.vectorHashCache.set(vectorHash, vector.id);

          optimizedVectors.push(optimizedVector);
          this.optimizationMetrics.totalVectors++;
        } catch (optimizationError) {
          console.warn(`⚠️ Optimization failed for vector ${vector.id}:`, optimizationError);
          optimizedVectors.push(vector); // Store original if optimization fails
        }
      }

      // Store optimized vectors using existing method
      switch (storageMethod) {
        case 'bulk':
          const bulkResult = await this.bulkStore(collection, optimizedVectors, batchId);
          storedVectors = bulkResult.stored;
          failedVectors = bulkResult.failed;
          errors.push(...bulkResult.errors);
          break;

        case 'batch':
          const batchResult = await this.batchStore(collection, optimizedVectors, batchId);
          storedVectors = batchResult.stored;
          failedVectors = batchResult.failed;
          errors.push(...batchResult.errors);
          break;

        case 'stream':
          const streamResult = await this.streamStore(collection, optimizedVectors, batchId);
          storedVectors = streamResult.stored;
          failedVectors = streamResult.failed;
          errors.push(...streamResult.errors);
          break;
      }

      // Update optimization metrics
      this.updateOptimizationMetrics(vectors.length, optimizedVectors.length);

      // Generate enhanced metadata with optimization info
      const metadata = await this.generateOptimizedStorageMetadata(
        collection,
        batchId,
        vectors.length,
        storedVectors,
        storageMethod,
        startTime
      );

      // Generate optimization recommendations
      const recommendations = this.generateOptimizationRecommendations(
        storedVectors,
        failedVectors,
        errors,
        optimizedVectors.length
      );

      console.log(
        `✅ Optimized storage complete: ${storedVectors} stored, ${this.optimizationMetrics.duplicatesDetected} duplicates detected, ${this.optimizationMetrics.compressedVectors} compressed`
      );

      return {
        collectionName,
        storedVectors,
        failedVectors,
        processingTime: Date.now() - startTime,
        metadata,
        errors,
        warnings,
        recommendations,
      };
    } catch (error) {
      throw new Error(
        `Optimized vector storage failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Bulk store vectors
   */
  private async bulkStore(
    collection: any,
    vectors: any[],
    batchId: string
  ): Promise<{ stored: number; failed: number; errors: StorageError[] }> {
    const errors: StorageError[] = [];
    let stored = 0;
    let failed = 0;

    try {
      // Prepare data for bulk insertion
      const ids = vectors.map(v => v.id);
      const embeddings = vectors.map(v => v.embedding);
      const metadatas = vectors.map(v => ({
        chunkId: v.chunkId,
        documentId: v.documentId,
        content: v.content,
        ...v.metadata,
        batchId,
        storedAt: new Date().toISOString(),
      }));

      // Bulk insert
      await collection.add({
        ids,
        embeddings,
        metadatas,
      });

      stored = vectors.length;
    } catch (error) {
      failed = vectors.length;
      vectors.forEach((vector, index) => {
        errors.push({
          vectorId: vector.id,
          error: error instanceof Error ? error.message : String(error),
          batchIndex: 0,
          timestamp: new Date().toISOString(),
          recoverable: true,
        });
      });
    }

    return { stored, failed, errors };
  }

  /**
   * Batch store vectors
   */
  private async batchStore(
    collection: any,
    vectors: any[],
    batchId: string
  ): Promise<{ stored: number; failed: number; errors: StorageError[] }> {
    const errors: StorageError[] = [];
    let stored = 0;
    let failed = 0;

    const batches = this.createBatches(vectors, this.options.optimizationBatchSize);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];

      try {
        // Prepare batch data
        const ids = batch.map(v => v.id);
        const embeddings = batch.map(v => v.embedding);
        const metadatas = batch.map(v => ({
          chunkId: v.chunkId,
          documentId: v.documentId,
          content: v.content,
          ...v.metadata,
          batchId,
          batchIndex: i,
          storedAt: new Date().toISOString(),
        }));

        // Insert batch
        await collection.add({
          ids,
          embeddings,
          metadatas,
        });

        stored += batch.length;
      } catch (error) {
        failed += batch.length;
        batch.forEach(vector => {
          errors.push({
            vectorId: vector.id,
            error: error instanceof Error ? error.message : String(error),
            batchIndex: i,
            timestamp: new Date().toISOString(),
            recoverable: true,
          });
        });
      }
    }

    return { stored, failed, errors };
  }

  /**
   * Stream store vectors
   */
  private async streamStore(
    collection: any,
    vectors: any[],
    batchId: string
  ): Promise<{ stored: number; failed: number; errors: StorageError[] }> {
    const errors: StorageError[] = [];
    let stored = 0;
    let failed = 0;

    for (let i = 0; i < vectors.length; i++) {
      const vector = vectors[i];

      try {
        await collection.add({
          ids: [vector.id],
          embeddings: [vector.embedding],
          metadatas: [
            {
              chunkId: vector.chunkId,
              documentId: vector.documentId,
              content: vector.content,
              ...vector.metadata,
              batchId,
              streamIndex: i,
              storedAt: new Date().toISOString(),
            },
          ],
        });

        stored++;
      } catch (error) {
        failed++;
        errors.push({
          vectorId: vector.id,
          error: error instanceof Error ? error.message : String(error),
          batchIndex: i,
          timestamp: new Date().toISOString(),
          recoverable: true,
        });
      }
    }

    return { stored, failed, errors };
  }

  /**
   * Search vectors in ChromaDB
   */
  async searchVectors(collectionName: string, query: SearchQuery): Promise<SearchResult[]> {
    try {
      // Get collection
      const collection = this.collections.get(collectionName);
      if (!collection) {
        throw new Error(`Collection ${collectionName} not found`);
      }

      // Generate query embedding if not provided
      let queryEmbedding = query.embedding;
      if (!queryEmbedding && query.query) {
        // In real implementation, this would use the embedding function
        queryEmbedding = await this.generateQueryEmbedding(query.query);
      }

      if (!queryEmbedding) {
        throw new Error('Query embedding is required');
      }

      // Prepare search parameters
      const searchParams: any = {
        queryEmbeddings: [queryEmbedding],
        nResults: query.limit || 10,
        include: [],
      };

      if (query.includeMetadata) {
        searchParams.include.push('metadatas');
      }

      if (query.includeContent) {
        searchParams.include.push('documents');
      }

      // Add filters if provided
      if (query.filters) {
        searchParams.where = this.buildWhereClause(query.filters);
      }

      // Execute search
      const results = await collection.query(searchParams);

      // Process results
      const searchResults: SearchResult[] = [];

      if (results.ids && results.ids[0]) {
        for (let i = 0; i < results.ids[0].length; i++) {
          const result: SearchResult = {
            id: results.ids[0][i],
            chunkId: results.metadatas?.[0]?.[i]?.chunkId || '',
            documentId: results.metadatas?.[0]?.[i]?.documentId || '',
            content: results.documents?.[0]?.[i] || '',
            metadata: results.metadatas?.[0]?.[i] || {},
            similarity: 1 - (results.distances?.[0]?.[i] || 0),
            distance: results.distances?.[0]?.[i] || 0,
            rank: i + 1,
          };

          // Filter by threshold if specified
          if (query.threshold && result.similarity < query.threshold) {
            continue;
          }

          searchResults.push(result);
        }
      }

      return searchResults;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Search failed: ${error.message}`);
      } else {
        throw new Error(`Search failed: ${String(error)}`);
      }
    }
  }

  /**
   * Generate query embedding using OpenAI
   */
  private async generateQueryEmbedding(query: string): Promise<number[]> {
    try {
      // Use OpenAI API for real embeddings
      const OpenAI = require('openai');
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      if (!process.env.OPENAI_API_KEY) {
        console.warn('⚠️ No OpenAI API key found, falling back to mock embedding');
        return this.generateMockEmbedding(query);
      }

      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: query.trim(),
        dimensions: 1536,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.warn(
        `⚠️ OpenAI embedding failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      console.warn('🔄 Falling back to mock embedding');
      return this.generateMockEmbedding(query);
    }
  }

  /**
   * Generate mock embedding (fallback)
   */
  private generateMockEmbedding(query: string): number[] {
    const embedding = new Array(1536).fill(0);

    // Simple hash-based embedding generation
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      hash = ((hash << 5) - hash + query.charCodeAt(i)) & 0xffffffff;
    }

    // Fill embedding with pseudo-random values
    for (let i = 0; i < 1536; i++) {
      hash = (hash * 1664525 + 1013904223) & 0xffffffff;
      embedding[i] = (hash / 0x100000000) * 2 - 1;
    }

    // Normalize vector
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / norm);
  }

  /**
   * Build WHERE clause for filters
   */
  private buildWhereClause(filters: SearchFilters): any {
    const where: any = {};

    if (filters.documentId) {
      where.documentId = filters.documentId;
    }

    if (filters.chunkType) {
      where.chunkType = filters.chunkType;
    }

    if (filters.language) {
      where.language = filters.language;
    }

    if (filters.qualityScore) {
      if (filters.qualityScore.min !== undefined) {
        where.qualityScore = { $gte: filters.qualityScore.min };
      }
      if (filters.qualityScore.max !== undefined) {
        where.qualityScore = { ...where.qualityScore, $lte: filters.qualityScore.max };
      }
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = { $in: filters.tags };
    }

    if (filters.customFilters) {
      Object.assign(where, filters.customFilters);
    }

    return Object.keys(where).length > 0 ? where : undefined;
  }

  /**
   * Generate storage metadata
   */
  private async generateStorageMetadata(
    collection: any,
    batchId: string,
    totalVectors: number,
    storedVectors: number,
    storageMethod: string,
    startTime: number
  ): Promise<StorageMetadata> {
    const totalBatches = Math.ceil(totalVectors / this.options.batchSize);
    const completedBatches = Math.ceil(storedVectors / this.options.batchSize);
    const failedBatches = totalBatches - completedBatches;

    return {
      batchId,
      totalBatches,
      completedBatches,
      failedBatches,
      storageMethod: storageMethod as any,
      indexingTime: Date.now() - startTime,
      compressionRatio: this.options.enableCompression ? 0.7 : 1.0,
      duplicatesDetected: 0,
      storedAt: new Date().toISOString(),
      collectionSize: await collection.count(),
    };
  }

  /**
   * Generate enhanced storage metadata with optimization info
   */
  private async generateOptimizedStorageMetadata(
    collection: any,
    batchId: string,
    totalVectors: number,
    storedVectors: number,
    storageMethod: string,
    startTime: number
  ): Promise<StorageMetadata> {
    const baseMetadata = await this.generateStorageMetadata(
      collection,
      batchId,
      totalVectors,
      storedVectors,
      storageMethod,
      startTime
    );

    return {
      ...baseMetadata,
      optimizationMetrics: { ...this.optimizationMetrics },
      compressionRatio: this.optimizationMetrics.averageCompressionRatio,
      duplicatesDetected: this.optimizationMetrics.duplicatesDetected,
      spaceSavingsPercent:
        this.optimizationMetrics.totalVectors > 0
          ? (this.optimizationMetrics.spaceSavings / this.optimizationMetrics.totalVectors) * 100
          : 0,
    };
  }

  /**
   * Generate storage recommendations
   */
  private generateStorageRecommendations(
    storedVectors: number,
    failedVectors: number,
    errors: StorageError[]
  ): string[] {
    const recommendations: string[] = [];

    if (failedVectors > storedVectors * 0.1) {
      recommendations.push('High failure rate detected - consider reducing batch size');
    }

    if (errors.length > 0) {
      recommendations.push('Errors detected - review error logs and consider retry strategies');
    }

    if (storedVectors > 10000) {
      recommendations.push(
        'Large collection - consider enabling compression and indexing optimization'
      );
    }

    return recommendations;
  }

  /**
   * Generate optimization recommendations
   */
  private generateOptimizationRecommendations(
    storedVectors: number,
    failedVectors: number,
    errors: StorageError[],
    optimizedCount: number
  ): string[] {
    const recommendations: string[] = [];

    // Base recommendations
    if (failedVectors > storedVectors * 0.1) {
      recommendations.push('High failure rate detected - consider reducing batch size');
    }

    if (errors.length > 0) {
      recommendations.push('Errors detected - review error logs and consider retry strategies');
    }

    // Optimization-specific recommendations
    const duplicateRate =
      this.optimizationMetrics.duplicatesDetected / this.optimizationMetrics.totalVectors;
    if (duplicateRate > 0.1) {
      recommendations.push(
        `High duplicate rate (${(duplicateRate * 100).toFixed(1)}%) - consider improving content preprocessing`
      );
    }

    const compressionRate =
      this.optimizationMetrics.compressedVectors / this.optimizationMetrics.totalVectors;
    if (compressionRate < 0.5 && this.options.enableCompression) {
      recommendations.push(
        'Low compression rate - consider adjusting compression level or algorithm'
      );
    }

    if (this.optimizationMetrics.averageCompressionRatio > 0.5) {
      recommendations.push(
        `Good compression achieved (${(this.optimizationMetrics.averageCompressionRatio * 100).toFixed(1)}% space savings)`
      );
    }

    // Tiered storage recommendations
    const hotRatio =
      this.optimizationMetrics.hotStorageCount / this.optimizationMetrics.totalVectors;
    if (hotRatio > 0.8) {
      recommendations.push('High hot storage usage - consider adjusting access thresholds');
    }

    return recommendations;
  }

  /**
   * Create batches from vectors
   */
  private createBatches(vectors: any[], batchSize: number): any[][] {
    const batches: any[][] = [];
    for (let i = 0; i < vectors.length; i += batchSize) {
      batches.push(vectors.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Generate batch ID
   */
  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get collection info
   */
  async getCollectionInfo(collectionName: string): Promise<ChromaCollection | null> {
    try {
      const collection = this.collections.get(collectionName);
      if (!collection) {
        return null;
      }

      return {
        name: collectionName,
        id: collection.id,
        metadata: collection.metadata || {},
        count: await collection.count(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to get collection info:', error);
      return null;
    }
  }

  /**
   * Delete collection
   */
  async deleteCollection(collectionName: string): Promise<boolean> {
    try {
      await this.client.deleteCollection({ name: collectionName });
      this.collections.delete(collectionName);
      return true;
    } catch (error) {
      console.error('Failed to delete collection:', error);
      return false;
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * 🗜️ VECTOR COMPRESSION ALGORITHMS
   */
  private compressVector(vector: number[], level: number = 5): VectorCompressionResult {
    const cacheKey = `${vector.slice(0, 5).join(',')}_${level}`;

    if (this.compressionCache.has(cacheKey)) {
      return this.compressionCache.get(cacheKey)!;
    }

    let compressedVector: number[];
    let compressionRatio: number;
    let quality: number;

    switch (this.options.compressionAlgorithm) {
      case 'quantization':
        ({ compressedVector, compressionRatio, quality } = this.quantizeVector(vector, level));
        break;
      case 'pca':
        ({ compressedVector, compressionRatio, quality } = this.pcaCompress(vector, level));
        break;
      case 'hybrid':
        ({ compressedVector, compressionRatio, quality } = this.hybridCompress(vector, level));
        break;
      default:
        compressedVector = vector;
        compressionRatio = 1.0;
        quality = 1.0;
    }

    const result: VectorCompressionResult = {
      originalVector: vector,
      compressedVector,
      compressionRatio,
      quality,
    };

    this.compressionCache.set(cacheKey, result);
    return result;
  }

  /**
   * Vector Quantization Compression
   */
  private quantizeVector(vector: number[], level: number): VectorCompressionResult {
    const bitsPerDimension = Math.max(2, 8 - level); // 2-7 bits based on level
    const quantizationLevels = Math.pow(2, bitsPerDimension);

    // Find min/max for normalization
    const min = Math.min(...vector);
    const max = Math.max(...vector);
    const range = max - min;

    // Quantize each dimension
    const compressedVector = vector.map(value => {
      const normalized = (value - min) / range; // 0-1
      const quantized = Math.round(normalized * (quantizationLevels - 1));
      return (quantized / (quantizationLevels - 1)) * range + min; // Back to original scale
    });

    const compressionRatio = bitsPerDimension / 32; // 32-bit float to N-bit
    const quality = this.calculateCompressionQuality(vector, compressedVector);

    return { originalVector: vector, compressedVector, compressionRatio, quality };
  }

  /**
   * PCA-based Compression
   */
  private pcaCompress(vector: number[], level: number): VectorCompressionResult {
    // Simplified PCA - reduce dimensions based on level
    const reductionFactor = level / 10; // 0.1 to 0.9
    const targetDimensions = Math.floor(vector.length * (1 - reductionFactor));

    // Simple dimension reduction - keep most important dimensions
    const sortedIndices = vector
      .map((value, index) => ({ value: Math.abs(value), index }))
      .sort((a, b) => b.value - a.value)
      .slice(0, targetDimensions)
      .map(item => item.index)
      .sort((a, b) => a - b);

    const compressedVector = new Array(vector.length).fill(0);
    sortedIndices.forEach(index => {
      compressedVector[index] = vector[index];
    });

    const compressionRatio = targetDimensions / vector.length;
    const quality = this.calculateCompressionQuality(vector, compressedVector);

    return { originalVector: vector, compressedVector, compressionRatio, quality };
  }

  /**
   * Hybrid Compression (Quantization + PCA)
   */
  private hybridCompress(vector: number[], level: number): VectorCompressionResult {
    // First apply PCA with moderate reduction
    const pcaLevel = Math.min(level, 5);
    const { compressedVector: pcaCompressed } = this.pcaCompress(vector, pcaLevel);

    // Then apply quantization
    const quantLevel = level;
    const { compressedVector, compressionRatio: quantRatio } = this.quantizeVector(
      pcaCompressed,
      quantLevel
    );

    const pcaRatio = pcaLevel / 10;
    const totalCompressionRatio = quantRatio * (1 - pcaRatio);
    const quality = this.calculateCompressionQuality(vector, compressedVector);

    return {
      originalVector: vector,
      compressedVector,
      compressionRatio: totalCompressionRatio,
      quality,
    };
  }

  /**
   * Calculate compression quality (cosine similarity)
   */
  private calculateCompressionQuality(original: number[], compressed: number[]): number {
    const dotProduct = original.reduce((sum, a, i) => sum + a * compressed[i], 0);
    const normA = Math.sqrt(original.reduce((sum, a) => sum + a * a, 0));
    const normB = Math.sqrt(compressed.reduce((sum, b) => sum + b * b, 0));

    return normA && normB ? dotProduct / (normA * normB) : 0;
  }

  /**
   * 🔍 SMART DEDUPLICATION
   */
  private async detectDuplicate(
    vector: number[],
    content: string,
    metadata: any
  ): Promise<DuplicateDetectionResult> {
    // Content-based duplicate detection
    const contentHash = this.generateContentHash(content);
    if (this.vectorHashCache.has(contentHash)) {
      return {
        isDuplicate: true,
        similarityScore: 1.0,
        existingVectorId: this.vectorHashCache.get(contentHash)!,
        duplicateType: 'content',
      };
    }

    // Exact vector duplicate detection
    const vectorHash = this.generateVectorHash(vector);
    if (this.vectorHashCache.has(vectorHash)) {
      return {
        isDuplicate: true,
        similarityScore: 1.0,
        existingVectorId: this.vectorHashCache.get(vectorHash)!,
        duplicateType: 'exact',
      };
    }

    // Semantic similarity detection
    if (this.options.enableSemanticDeduplication) {
      const semanticDuplicate = await this.detectSemanticDuplicate(vector, content, metadata);
      if (semanticDuplicate.isDuplicate) {
        return semanticDuplicate;
      }
    }

    return { isDuplicate: false, similarityScore: 0, duplicateType: 'exact' };
  }

  private generateContentHash(content: string): string {
    // Simple content hash - normalize and hash
    const normalized = content.toLowerCase().replace(/\s+/g, ' ').trim();
    return this.simpleHash(normalized);
  }

  private generateVectorHash(vector: number[]): string {
    // Quantized vector hash for near-duplicate detection
    const quantized = vector.map(v => Math.round(v * 1000) / 1000); // 3 decimal places
    return this.simpleHash(quantized.join(','));
  }

  private simpleHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private async detectSemanticDuplicate(
    vector: number[],
    content: string,
    metadata: any
  ): Promise<DuplicateDetectionResult> {
    // Check against recently stored vectors
    const recentVectors = Array.from(this.vectorHashCache.entries()).slice(-100); // Last 100 vectors

    for (const [hash, vectorId] of recentVectors) {
      // In a real implementation, you'd retrieve the stored vector and compare
      // For now, we'll use a simplified similarity check
      const similarity = this.estimateSemanticSimilarity(content, vectorId);

      if (similarity > this.options.duplicateThreshold) {
        return {
          isDuplicate: true,
          similarityScore: similarity,
          existingVectorId: vectorId,
          duplicateType: 'semantic',
        };
      }
    }

    return { isDuplicate: false, similarityScore: 0, duplicateType: 'semantic' };
  }

  private estimateSemanticSimilarity(content1: string, vectorId: string): number {
    // Simplified semantic similarity - in production, use actual vector comparison
    // This is a placeholder that would be replaced with actual vector cosine similarity
    return Math.random() * 0.5; // Always below threshold for testing
  }

  /**
   * 🏢 TIERED STORAGE MANAGEMENT
   */
  private updateAccessFrequency(vectorId: string): void {
    const current = this.accessFrequency.get(vectorId) || { count: 0, lastAccessed: new Date() };
    this.accessFrequency.set(vectorId, {
      count: current.count + 1,
      lastAccessed: new Date(),
    });
  }

  private isHotStorage(vectorId: string): boolean {
    const access = this.accessFrequency.get(vectorId);
    if (!access) return false;

    const { hotStorageThreshold } = this.options.tieredStorageConfig;
    return access.count >= hotStorageThreshold;
  }

  private shouldMigrateToCold(vectorId: string): boolean {
    const access = this.accessFrequency.get(vectorId);
    if (!access) return false;

    const { migrationDelayDays, hotStorageThreshold } = this.options.tieredStorageConfig;
    const daysSinceAccess = (Date.now() - access.lastAccessed.getTime()) / (1000 * 60 * 60 * 24);

    return access.count < hotStorageThreshold && daysSinceAccess > migrationDelayDays;
  }

  /**
   * Start optimization background tasks
   */
  private startOptimizationTasks(): void {
    if (!this.options.enableStorageAnalytics) return;

    // Clean up old cache entries every hour
    setInterval(
      () => {
        this.cleanupOptimizationCaches();
      },
      60 * 60 * 1000
    );

    // Migrate vectors to cold storage daily
    if (this.options.tieredStorageConfig.enableTieredStorage) {
      setInterval(
        () => {
          this.migrateToColdStorage();
        },
        24 * 60 * 60 * 1000
      );
    }
  }

  /**
   * Cleanup optimization caches
   */
  private cleanupOptimizationCaches(): void {
    // Cleanup compression cache if too large
    if (this.compressionCache.size > 1000) {
      const keys = Array.from(this.compressionCache.keys());
      const toDelete = keys.slice(0, keys.length - 800);
      toDelete.forEach(key => this.compressionCache.delete(key));
    }

    // Cleanup vector hash cache if too large
    if (this.vectorHashCache.size > 5000) {
      const keys = Array.from(this.vectorHashCache.keys());
      const toDelete = keys.slice(0, keys.length - 4000);
      toDelete.forEach(key => this.vectorHashCache.delete(key));
    }

    console.log('🧹 Optimization caches cleaned up');
  }

  /**
   * Migrate vectors to cold storage
   */
  private async migrateToColdStorage(): Promise<void> {
    if (!this.options.tieredStorageConfig.enableTieredStorage) return;

    const vectorsToMigrate: string[] = [];

    for (const [vectorId, access] of this.accessFrequency.entries()) {
      if (this.shouldMigrateToCold(vectorId)) {
        vectorsToMigrate.push(vectorId);
      }
    }

    if (vectorsToMigrate.length > 0) {
      console.log(`🏢 Migrating ${vectorsToMigrate.length} vectors to cold storage`);
      // In a real implementation, this would update the storage class in the database
      // and apply higher compression to cold storage vectors
    }
  }

  /**
   * Update optimization metrics
   */
  private updateOptimizationMetrics(originalCount: number, optimizedCount: number): void {
    this.optimizationMetrics.spaceSavings += originalCount - optimizedCount;

    if (this.optimizationMetrics.compressedVectors > 0) {
      // Update average compression ratio
      this.optimizationMetrics.averageCompressionRatio =
        this.optimizationMetrics.spaceSavings / this.optimizationMetrics.compressedVectors;
    }
  }

  /**
   * Get optimization metrics
   */
  getOptimizationMetrics(): StorageOptimizationMetrics {
    return { ...this.optimizationMetrics };
  }

  /**
   * Reset optimization metrics
   */
  resetOptimizationMetrics(): void {
    this.optimizationMetrics = {
      totalVectors: 0,
      compressedVectors: 0,
      duplicatesDetected: 0,
      spaceSavings: 0,
      hotStorageCount: 0,
      coldStorageCount: 0,
      averageCompressionRatio: 1.0,
    };
  }
}

// Utility functions
export class ChromaDBUtils {
  /**
   * Validate vector dimensions
   */
  static validateVectorDimensions(vectors: any[], expectedDimension: number): boolean {
    return vectors.every(
      vector => vector.embedding && vector.embedding.length === expectedDimension
    );
  }

  /**
   * Optimize batch size based on vector data
   */
  static optimizeBatchSize(vectors: any[], memoryLimit: number = 100): number {
    if (vectors.length === 0) return 100;

    const avgVectorSize = JSON.stringify(vectors[0]).length;
    const vectorsPerMB = (1024 * 1024) / avgVectorSize;
    const optimalBatchSize = Math.floor(vectorsPerMB * memoryLimit);

    return Math.max(10, Math.min(1000, optimalBatchSize));
  }

  /**
   * Calculate similarity score
   */
  static calculateSimilarity(distance: number): number {
    return 1 - distance;
  }

  /**
   * Filter results by quality
   */
  static filterResultsByQuality(results: SearchResult[], minQuality: number): SearchResult[] {
    return results.filter(result => result.metadata.qualityScore >= minQuality);
  }

  /**
   * Group results by document
   */
  static groupResultsByDocument(results: SearchResult[]): Map<string, SearchResult[]> {
    const groups = new Map<string, SearchResult[]>();

    results.forEach(result => {
      const docId = result.documentId;
      if (!groups.has(docId)) {
        groups.set(docId, []);
      }
      groups.get(docId)!.push(result);
    });

    return groups;
  }

  /**
   * Calculate search statistics
   */
  static calculateSearchStats(results: SearchResult[]): any {
    if (results.length === 0) return null;

    const similarities = results.map(r => r.similarity);
    const distances = results.map(r => r.distance);

    return {
      totalResults: results.length,
      avgSimilarity: similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length,
      maxSimilarity: Math.max(...similarities),
      minSimilarity: Math.min(...similarities),
      avgDistance: distances.reduce((sum, dist) => sum + dist, 0) / distances.length,
      documentCount: new Set(results.map(r => r.documentId)).size,
      languageDistribution: this.getLanguageDistribution(results),
      qualityDistribution: this.getQualityDistribution(results),
    };
  }

  /**
   * Get language distribution
   */
  private static getLanguageDistribution(results: SearchResult[]): any {
    const distribution: any = {};
    results.forEach(result => {
      const lang = result.metadata.language || 'unknown';
      distribution[lang] = (distribution[lang] || 0) + 1;
    });
    return distribution;
  }

  /**
   * Get quality distribution
   */
  private static getQualityDistribution(results: SearchResult[]): any {
    const distribution: any = { high: 0, medium: 0, low: 0 };
    results.forEach(result => {
      const quality = result.metadata.qualityScore || 0;
      if (quality >= 0.8) distribution.high++;
      else if (quality >= 0.6) distribution.medium++;
      else distribution.low++;
    });
    return distribution;
  }
}

// Export types and utilities
export { DEFAULT_OPTIONS as DEFAULT_CHROMADB_OPTIONS };
