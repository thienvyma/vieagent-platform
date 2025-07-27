/**
 * 🚀 ChromaDB Production Service - Phase 4 Day 14
 * Production-ready ChromaDB service với persistent storage
 */

import { ChromaClient, Collection } from 'chromadb';
import path from 'path';

export interface ProductionChromaConfig {
  host: string;
  port: number;
  persistPath: string;
  enableAuth: boolean;
  maxRetries: number;
  timeout: number;
  batchSize: number;
  enableCompression: boolean;
  healthCheckInterval: number;
}

export interface UserCollectionConfig {
  userId: string;
  collectionName: string;
  metadata: Record<string, any>;
  embeddingFunction?: string;
}

export interface VectorDocument {
  id: string;
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
}

export interface QueryResult {
  documents: string[][];
  metadatas: Record<string, any>[][];
  distances: number[][];
  ids: string[][];
}

export class ProductionChromaDBService {
  private client: ChromaClient | null = null;
  private config: ProductionChromaConfig;
  private collections: Map<string, Collection> = new Map();
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private isConnected: boolean = false;
  private connectionRetries: number = 0;

  constructor(config: Partial<ProductionChromaConfig> = {}) {
    this.config = {
      host: config.host || process.env.CHROMADB_HOST || 'localhost',
      port: config.port || parseInt(process.env.CHROMADB_PORT || '8000'),
      persistPath: config.persistPath || process.env.CHROMADB_PERSIST_PATH || './chromadb_data',
      enableAuth: config.enableAuth || false,
      maxRetries: config.maxRetries || 3,
      timeout: config.timeout || 30000,
      batchSize: config.batchSize || 100,
      enableCompression: config.enableCompression || true,
      healthCheckInterval: config.healthCheckInterval || 30000,
    };

    this.initializeClient();
  }

  /**
   * Initialize ChromaDB client with production settings
   */
  private async initializeClient(): Promise<void> {
    try {
      // Initializing ChromaDB Production Client

      // Try server mode first
      try {
        const serverUrl = `http://${this.config.host}:${this.config.port}`;
        this.client = new ChromaClient({
          path: serverUrl,
          // Add auth if enabled
          ...(this.config.enableAuth && {
            auth: {
              provider: 'basic',
              credentials: {
                username: process.env.CHROMADB_USERNAME,
                password: process.env.CHROMADB_PASSWORD,
              },
            },
          }),
        });

        // Test connection
        await this.testConnection();
        // ChromaDB Server connected
        this.isConnected = true;
        this.connectionRetries = 0;
      } catch (serverError) {
        console.warn('⚠️ ChromaDB Server not available, using embedded persistent mode');

        // Fallback to embedded persistent client for production
        const persistPath = process.env.CHROMA_PERSIST_DIRECTORY || './chromadb_data';

        // Use dynamic require for PersistentClient
        const chromadbModule = require('chromadb');
        this.client = new chromadbModule.PersistentClient({
          path: persistPath,
        });

        console.log(`✅ ChromaDB Embedded mode (persistent): ${persistPath}`);
        this.isConnected = true;
      }

      // Start health check
      this.startHealthCheck();
    } catch (error) {
      console.error('❌ ChromaDB initialization failed:', error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Test connection to ChromaDB
   */
  private async testConnection(): Promise<void> {
    if (!this.client) {
      throw new Error('ChromaDB client not initialized');
    }

    try {
      await this.client.heartbeat();
    } catch (error) {
      throw new Error(`ChromaDB connection test failed: ${error}`);
    }
  }

  /**
   * Start health check monitoring
   */
  private startHealthCheck(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.healthCheckTimer = setInterval(async () => {
      try {
        await this.testConnection();
        if (!this.isConnected) {
          console.log('✅ ChromaDB connection restored');
          this.isConnected = true;
          this.connectionRetries = 0;
        }
      } catch (error) {
        if (this.isConnected) {
          console.warn('⚠️ ChromaDB connection lost, attempting reconnection...');
          this.isConnected = false;
        }

        this.connectionRetries++;
        if (this.connectionRetries <= this.config.maxRetries) {
          await this.attemptReconnection();
        }
      }
    }, this.config.healthCheckInterval);
  }

  /**
   * Attempt to reconnect to ChromaDB
   */
  private async attemptReconnection(): Promise<void> {
    try {
      await this.initializeClient();
    } catch (error) {
      console.error(`❌ Reconnection attempt ${this.connectionRetries} failed:`, error);
    }
  }

  /**
   * Get or create user-specific collection
   */
  async getUserCollection(config: UserCollectionConfig): Promise<Collection> {
    if (!this.client) {
      throw new Error('ChromaDB client not initialized');
    }

    const collectionKey = `user_${config.userId}_${config.collectionName}`;

    // Check if collection already cached
    if (this.collections.has(collectionKey)) {
      return this.collections.get(collectionKey)!;
    }

    try {
      // Create or get collection
      const collection = await this.client.getOrCreateCollection({
        name: collectionKey,
        metadata: {
          userId: config.userId,
          collectionName: config.collectionName,
          createdAt: new Date().toISOString(),
          ...config.metadata,
        },
        embeddingFunction: config.embeddingFunction,
      });

      // Cache collection
      this.collections.set(collectionKey, collection);

      console.log(`✅ User collection ready: ${collectionKey}`);
      return collection;
    } catch (error) {
      console.error(`❌ Failed to get user collection: ${collectionKey}`, error);
      throw error;
    }
  }

  /**
   * Store vectors for user
   */
  async storeUserVectors(
    userId: string,
    collectionName: string,
    documents: VectorDocument[]
  ): Promise<void> {
    try {
      const collection = await this.getUserCollection({
        userId,
        collectionName,
        metadata: { type: 'knowledge', version: '1.0' },
      });

      // Process documents in batches
      for (let i = 0; i < documents.length; i += this.config.batchSize) {
        const batch = documents.slice(i, i + this.config.batchSize);

        await collection.add({
          ids: batch.map(doc => doc.id),
          documents: batch.map(doc => doc.content),
          metadatas: batch.map(doc => ({
            ...doc.metadata,
            userId,
            collectionName,
            storedAt: new Date().toISOString(),
          })),
          embeddings: batch.map(doc => doc.embedding).filter(Boolean) as number[][],
        });
      }

      console.log(`✅ Stored ${documents.length} vectors for user ${userId}`);
    } catch (error) {
      console.error(`❌ Failed to store vectors for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Query vectors for user
   */
  async queryUserVectors(
    userId: string,
    collectionName: string,
    queryTexts: string[],
    nResults: number = 5,
    whereClause?: Record<string, any>
  ): Promise<QueryResult> {
    try {
      const collection = await this.getUserCollection({
        userId,
        collectionName,
        metadata: { type: 'knowledge' },
      });

      const results = await collection.query({
        queryTexts,
        nResults,
        where: {
          userId,
          ...whereClause,
        },
      });

      return results as QueryResult;
    } catch (error) {
      console.error(`❌ Failed to query vectors for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get collection statistics
   */
  async getCollectionStats(
    userId: string,
    collectionName: string
  ): Promise<{
    count: number;
    metadata: Record<string, any>;
    lastUpdated: string;
  }> {
    try {
      const collection = await this.getUserCollection({
        userId,
        collectionName,
        metadata: { type: 'knowledge' },
      });

      const count = await collection.count();
      const metadata = collection.metadata || {};

      return {
        count,
        metadata,
        lastUpdated: metadata.lastUpdated || metadata.createdAt || new Date().toISOString(),
      };
    } catch (error) {
      console.error(`❌ Failed to get collection stats for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Delete user collection
   */
  async deleteUserCollection(userId: string, collectionName: string): Promise<void> {
    try {
      const collectionKey = `user_${userId}_${collectionName}`;

      if (this.client) {
        await this.client.deleteCollection(collectionKey);
      }

      // Remove from cache
      this.collections.delete(collectionKey);

      console.log(`✅ Deleted user collection: ${collectionKey}`);
    } catch (error) {
      console.error(`❌ Failed to delete user collection: ${userId}/${collectionName}`, error);
      throw error;
    }
  }

  /**
   * Get service health status
   */
  async getHealthStatus(): Promise<{
    isConnected: boolean;
    connectionRetries: number;
    collectionsCount: number;
    config: ProductionChromaConfig;
    lastHealthCheck: string;
  }> {
    return {
      isConnected: this.isConnected,
      connectionRetries: this.connectionRetries,
      collectionsCount: this.collections.size,
      config: this.config,
      lastHealthCheck: new Date().toISOString(),
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }

    this.collections.clear();
    this.client = null;
    this.isConnected = false;

    console.log('🧹 ChromaDB Production Service cleaned up');
  }
}

// Export singleton instance
export const productionChromaService = new ProductionChromaDBService();

// Export for testing
export default ProductionChromaDBService;
