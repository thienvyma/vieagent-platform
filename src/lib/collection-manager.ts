/**
 * 🗂️ Collection Manager - Phase 4 Day 14
 * User-specific collection management với metadata và lifecycle
 */

import { ProductionChromaDBService, UserCollectionConfig } from './chromadb-production';
import { Collection } from 'chromadb';

export interface CollectionMetadata {
  userId: string;
  collectionName: string;
  type: 'knowledge' | 'conversation' | 'learning' | 'custom';
  version: string;
  createdAt: string;
  lastUpdated: string;
  documentCount: number;
  totalSize: number;
  tags: string[];
  description?: string;
  isActive: boolean;
  retentionPolicy?: {
    maxAge: number; // days
    maxDocuments: number;
    autoArchive: boolean;
  };
}

export interface CollectionStats {
  totalCollections: number;
  activeCollections: number;
  totalDocuments: number;
  totalSize: number;
  collectionsPerUser: Record<string, number>;
  collectionsPerType: Record<string, number>;
}

export interface CollectionFilter {
  userId?: string;
  type?: CollectionMetadata['type'];
  isActive?: boolean;
  tags?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
}

export class CollectionManager {
  private static instance: CollectionManager | null = null;
  private chromaService: ProductionChromaDBService;
  private collectionsMetadata: Map<string, CollectionMetadata> = new Map();
  private retentionCheckInterval: NodeJS.Timeout | null = null;

  constructor(chromaService: ProductionChromaDBService) {
    this.chromaService = chromaService;
    this.startRetentionCheck();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(chromaService?: ProductionChromaDBService): CollectionManager {
    if (!CollectionManager.instance) {
      if (!chromaService) {
        // Import here to avoid circular dependency
        const { productionChromaService } = require('./chromadb-production');
        chromaService = productionChromaService;
      }
      CollectionManager.instance = new CollectionManager(chromaService);
    }
    return CollectionManager.instance;
  }

  /**
   * Generate standardized collection name
   */
  private generateCollectionName(userId: string, collectionName: string, type: string): string {
    // Format: user_{userId}_{type}_{collectionName}
    const sanitizedName = collectionName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    return `user_${userId}_${type}_${sanitizedName}`;
  }

  /**
   * Create user collection with metadata
   */
  async createUserCollection(
    userId: string,
    collectionName: string,
    type: CollectionMetadata['type'] = 'knowledge',
    options: {
      description?: string;
      tags?: string[];
      retentionPolicy?: CollectionMetadata['retentionPolicy'];
      embeddingFunction?: string;
    } = {}
  ): Promise<Collection> {
    try {
      const standardName = this.generateCollectionName(userId, collectionName, type);

      // Create collection metadata
      const metadata: CollectionMetadata = {
        userId,
        collectionName,
        type,
        version: '1.0',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        documentCount: 0,
        totalSize: 0,
        tags: options.tags || [],
        description: options.description,
        isActive: true,
        retentionPolicy: options.retentionPolicy,
      };

      // Create collection via ChromaDB service
      const collection = await this.chromaService.getUserCollection({
        userId,
        collectionName: standardName,
        metadata: {
          ...metadata,
          managedBy: 'CollectionManager',
        },
        embeddingFunction: options.embeddingFunction,
      });

      // Store metadata
      this.collectionsMetadata.set(standardName, metadata);

      console.log(`✅ Created user collection: ${standardName}`);
      return collection;
    } catch (error) {
      console.error(`❌ Failed to create user collection: ${userId}/${collectionName}`, error);
      throw error;
    }
  }

  /**
   * Get user collection with metadata
   */
  async getUserCollection(
    userId: string,
    collectionName: string,
    type: CollectionMetadata['type'] = 'knowledge'
  ): Promise<{ collection: Collection; metadata: CollectionMetadata }> {
    try {
      const standardName = this.generateCollectionName(userId, collectionName, type);

      // Get collection from ChromaDB
      const collection = await this.chromaService.getUserCollection({
        userId,
        collectionName: standardName,
        metadata: { type },
      });

      // Get or create metadata
      let metadata = this.collectionsMetadata.get(standardName);
      if (!metadata) {
        // Create default metadata if not exists
        metadata = {
          userId,
          collectionName,
          type,
          version: '1.0',
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          documentCount: await collection.count(),
          totalSize: 0,
          tags: [],
          isActive: true,
        };
        this.collectionsMetadata.set(standardName, metadata);
      }

      return { collection, metadata };
    } catch (error) {
      console.error(`❌ Failed to get user collection: ${userId}/${collectionName}`, error);
      throw error;
    }
  }

  /**
   * Update collection metadata
   */
  async updateCollectionMetadata(
    userId: string,
    collectionName: string,
    type: CollectionMetadata['type'],
    updates: Partial<CollectionMetadata>
  ): Promise<void> {
    try {
      const standardName = this.generateCollectionName(userId, collectionName, type);
      const existingMetadata = this.collectionsMetadata.get(standardName);

      if (!existingMetadata) {
        throw new Error(`Collection metadata not found: ${standardName}`);
      }

      // Update metadata
      const updatedMetadata: CollectionMetadata = {
        ...existingMetadata,
        ...updates,
        lastUpdated: new Date().toISOString(),
      };

      this.collectionsMetadata.set(standardName, updatedMetadata);
      console.log(`✅ Updated collection metadata: ${standardName}`);
    } catch (error) {
      console.error(`❌ Failed to update collection metadata: ${userId}/${collectionName}`, error);
      throw error;
    }
  }

  /**
   * List user collections with filtering
   */
  async listUserCollections(
    userId: string,
    filter: CollectionFilter = {}
  ): Promise<CollectionMetadata[]> {
    try {
      const userCollections = Array.from(this.collectionsMetadata.values())
        .filter(metadata => {
          // Filter by userId
          if (metadata.userId !== userId) return false;

          // Apply filters
          if (filter.type && metadata.type !== filter.type) return false;
          if (filter.isActive !== undefined && metadata.isActive !== filter.isActive) return false;
          if (filter.tags && !filter.tags.some(tag => metadata.tags.includes(tag))) return false;
          if (filter.createdAfter && new Date(metadata.createdAt) < filter.createdAfter)
            return false;
          if (filter.createdBefore && new Date(metadata.createdAt) > filter.createdBefore)
            return false;

          return true;
        })
        .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

      return userCollections;
    } catch (error) {
      console.error(`❌ Failed to list user collections: ${userId}`, error);
      throw error;
    }
  }

  /**
   * Archive collection (soft delete)
   */
  async archiveCollection(
    userId: string,
    collectionName: string,
    type: CollectionMetadata['type']
  ): Promise<void> {
    try {
      await this.updateCollectionMetadata(userId, collectionName, type, {
        isActive: false,
        lastUpdated: new Date().toISOString(),
      });

      console.log(`✅ Archived collection: ${userId}/${collectionName}`);
    } catch (error) {
      console.error(`❌ Failed to archive collection: ${userId}/${collectionName}`, error);
      throw error;
    }
  }

  /**
   * Permanently delete collection
   */
  async deleteCollection(
    userId: string,
    collectionName: string,
    type: CollectionMetadata['type']
  ): Promise<void> {
    try {
      const standardName = this.generateCollectionName(userId, collectionName, type);

      // Delete from ChromaDB
      await this.chromaService.deleteUserCollection(userId, standardName);

      // Remove metadata
      this.collectionsMetadata.delete(standardName);

      console.log(`✅ Deleted collection: ${userId}/${collectionName}`);
    } catch (error) {
      console.error(`❌ Failed to delete collection: ${userId}/${collectionName}`, error);
      throw error;
    }
  }

  /**
   * Get collection statistics
   */
  async getCollectionStats(filter: CollectionFilter = {}): Promise<CollectionStats> {
    try {
      const allCollections = Array.from(this.collectionsMetadata.values());

      // Apply filters
      const filteredCollections = allCollections.filter(metadata => {
        if (filter.userId && metadata.userId !== filter.userId) return false;
        if (filter.type && metadata.type !== filter.type) return false;
        if (filter.isActive !== undefined && metadata.isActive !== filter.isActive) return false;
        if (filter.tags && !filter.tags.some(tag => metadata.tags.includes(tag))) return false;
        if (filter.createdAfter && new Date(metadata.createdAt) < filter.createdAfter) return false;
        if (filter.createdBefore && new Date(metadata.createdAt) > filter.createdBefore)
          return false;
        return true;
      });

      // Calculate statistics
      const stats: CollectionStats = {
        totalCollections: filteredCollections.length,
        activeCollections: filteredCollections.filter(c => c.isActive).length,
        totalDocuments: filteredCollections.reduce((sum, c) => sum + c.documentCount, 0),
        totalSize: filteredCollections.reduce((sum, c) => sum + c.totalSize, 0),
        collectionsPerUser: {},
        collectionsPerType: {},
      };

      // Group by user
      filteredCollections.forEach(metadata => {
        stats.collectionsPerUser[metadata.userId] =
          (stats.collectionsPerUser[metadata.userId] || 0) + 1;
        stats.collectionsPerType[metadata.type] =
          (stats.collectionsPerType[metadata.type] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('❌ Failed to get collection stats:', error);
      throw error;
    }
  }

  /**
   * Update document count for collection
   */
  async updateDocumentCount(
    userId: string,
    collectionName: string,
    type: CollectionMetadata['type'],
    count: number,
    sizeBytes: number = 0
  ): Promise<void> {
    try {
      await this.updateCollectionMetadata(userId, collectionName, type, {
        documentCount: count,
        totalSize: sizeBytes,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`❌ Failed to update document count: ${userId}/${collectionName}`, error);
      throw error;
    }
  }

  /**
   * Start retention policy check
   */
  private startRetentionCheck(): void {
    // Check retention policies every hour
    this.retentionCheckInterval = setInterval(
      async () => {
        await this.checkRetentionPolicies();
      },
      60 * 60 * 1000
    );
  }

  /**
   * Check and apply retention policies
   */
  private async checkRetentionPolicies(): Promise<void> {
    try {
      const now = new Date();

      for (const [collectionName, metadata] of this.collectionsMetadata) {
        if (!metadata.retentionPolicy || !metadata.isActive) continue;

        const { maxAge, maxDocuments, autoArchive } = metadata.retentionPolicy;
        const createdAt = new Date(metadata.createdAt);
        const ageInDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

        // Check age-based retention
        if (maxAge && ageInDays > maxAge) {
          if (autoArchive) {
            await this.archiveCollection(metadata.userId, metadata.collectionName, metadata.type);
            console.log(`🗂️ Auto-archived collection due to age: ${collectionName}`);
          }
        }

        // Check document count-based retention
        if (maxDocuments && metadata.documentCount > maxDocuments) {
          if (autoArchive) {
            await this.archiveCollection(metadata.userId, metadata.collectionName, metadata.type);
            console.log(`🗂️ Auto-archived collection due to document count: ${collectionName}`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error checking retention policies:', error);
    }
  }

  /**
   * Get collection health status
   */
  async getHealthStatus(): Promise<{
    totalCollections: number;
    activeCollections: number;
    retentionCheckActive: boolean;
    lastRetentionCheck: string;
  }> {
    const stats = await this.getCollectionStats();

    return {
      totalCollections: stats.totalCollections,
      activeCollections: stats.activeCollections,
      retentionCheckActive: this.retentionCheckInterval !== null,
      lastRetentionCheck: new Date().toISOString(),
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.retentionCheckInterval) {
      clearInterval(this.retentionCheckInterval);
      this.retentionCheckInterval = null;
    }

    this.collectionsMetadata.clear();
    console.log('🧹 Collection Manager cleaned up');
  }
}

// Export class for manual instantiation
export default CollectionManager;
export const collectionManager = CollectionManager.getInstance();
