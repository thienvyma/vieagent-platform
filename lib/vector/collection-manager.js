// ChromaDB Collection Manager
// Manages creation and lifecycle of collections

const { ChromaClient } = require('chromadb');
const { 
    COLLECTION_CONFIGS,
    getAllCollectionNames,
    getCollectionSchema 
} = require('./collection-schemas');

/**
 * Collection Manager for ChromaDB
 * Handles creation, initialization, and management of all collections
 */
class CollectionManager {
    constructor(clientConfig = {}) {
        this.client = null;
        this.collections = new Map();
        this.clientConfig = {
            host: clientConfig.host || process.env.CHROMADB_HOST || 'localhost',
            port: clientConfig.port || parseInt(process.env.CHROMADB_PORT || '8000'),
            ...clientConfig
        };
        this.isConnected = false;
    }

    /**
     * Initialize ChromaDB client and connect
     */
    async connect() {
        try {
            console.log('🔄 Connecting to ChromaDB...');
            
            // For development, we'll use in-memory mode when server not available
            this.client = new ChromaClient(this.clientConfig);
            
            console.log('✅ ChromaDB client initialized');
            this.isConnected = true;
            
            return true;
        } catch (error) {
            console.warn('⚠️ ChromaDB server connection failed, using in-memory mode');
            // Fallback to in-memory client for development
            this.client = new ChromaClient();
            this.isConnected = true;
            return true;
        }
    }

    /**
     * Create all required collections with proper configurations
     */
    async initializeAllCollections() {
        console.log('🏗️ Initializing all collections...');
        
        if (!this.isConnected) {
            await this.connect();
        }

        const collectionTypes = Object.keys(COLLECTION_CONFIGS);
        const results = [];

        for (const type of collectionTypes) {
            try {
                const result = await this.createCollection(type);
                results.push({ type, success: true, collection: result });
                console.log(`✅ Collection '${type}' initialized successfully`);
            } catch (error) {
                console.error(`❌ Failed to initialize collection '${type}':`, error.message);
                results.push({ type, success: false, error: error.message });
            }
        }

        const successCount = results.filter(r => r.success).length;
        console.log(`📊 Collection initialization complete: ${successCount}/${results.length} successful`);
        
        return results;
    }

    /**
     * Create a specific collection by type
     */
    async createCollection(collectionType) {
        const config = COLLECTION_CONFIGS[collectionType];
        if (!config) {
            throw new Error(`Unknown collection type: ${collectionType}`);
        }

        try {
            console.log(`🔄 Creating collection: ${config.name}`);
            
            // Check if collection already exists
            const existingCollection = await this.getCollection(collectionType);
            if (existingCollection) {
                console.log(`📁 Collection '${config.name}' already exists`);
                return existingCollection;
            }

            // Create new collection with metadata
            const collection = await this.client.getOrCreateCollection({
                name: config.name,
                metadata: {
                    description: config.description,
                    embeddingFunction: config.embeddingFunction,
                    distanceMetric: config.distanceMetric,
                    dimensions: config.dimensions,
                    createdAt: new Date().toISOString(),
                    version: '1.0',
                    collectionType: collectionType
                }
            });

            // Cache the collection
            this.collections.set(collectionType, collection);
            
            console.log(`✅ Collection '${config.name}' created successfully`);
            return collection;

        } catch (error) {
            console.error(`❌ Error creating collection '${config.name}':`, error);
            throw error;
        }
    }

    /**
     * Get an existing collection
     */
    async getCollection(collectionType) {
        // Check cache first
        if (this.collections.has(collectionType)) {
            return this.collections.get(collectionType);
        }

        const config = COLLECTION_CONFIGS[collectionType];
        if (!config) {
            throw new Error(`Unknown collection type: ${collectionType}`);
        }

        try {
            const collection = await this.client.getCollection(config.name);
            this.collections.set(collectionType, collection);
            return collection;
        } catch (error) {
            // Collection doesn't exist
            return null;
        }
    }

    /**
     * Delete a collection
     */
    async deleteCollection(collectionType) {
        const config = COLLECTION_CONFIGS[collectionType];
        if (!config) {
            throw new Error(`Unknown collection type: ${collectionType}`);
        }

        try {
            await this.client.deleteCollection(config.name);
            this.collections.delete(collectionType);
            console.log(`🗑️ Collection '${config.name}' deleted successfully`);
            return true;
        } catch (error) {
            console.error(`❌ Error deleting collection '${config.name}':`, error);
            throw error;
        }
    }

    /**
     * Add document to a collection with proper metadata validation
     */
    async addDocument(collectionType, document) {
        const collection = await this.getCollection(collectionType);
        if (!collection) {
            throw new Error(`Collection '${collectionType}' not found`);
        }

        const { id, content, metadata = {} } = document;
        
        // Validate required fields
        if (!id || !content) {
            throw new Error('Document must have id and content');
        }

        // Add timestamp if not provided
        if (!metadata.createdAt) {
            metadata.createdAt = new Date().toISOString();
        }

        try {
            await collection.add({
                ids: [id],
                documents: [content],
                metadatas: [metadata]
            });

            console.log(`📄 Document '${id}' added to '${collectionType}' collection`);
            return true;
        } catch (error) {
            console.error(`❌ Error adding document to '${collectionType}':`, error);
            throw error;
        }
    }

    /**
     * Batch add documents to a collection
     */
    async addDocuments(collectionType, documents) {
        const collection = await this.getCollection(collectionType);
        if (!collection) {
            throw new Error(`Collection '${collectionType}' not found`);
        }

        if (!Array.isArray(documents) || documents.length === 0) {
            throw new Error('Documents must be a non-empty array');
        }

        const ids = [];
        const contents = [];
        const metadatas = [];

        for (const doc of documents) {
            if (!doc.id || !doc.content) {
                throw new Error('Each document must have id and content');
            }

            ids.push(doc.id);
            contents.push(doc.content);
            
            const metadata = doc.metadata || {};
            if (!metadata.createdAt) {
                metadata.createdAt = new Date().toISOString();
            }
            metadatas.push(metadata);
        }

        try {
            await collection.add({
                ids,
                documents: contents,
                metadatas
            });

            console.log(`📄 ${documents.length} documents added to '${collectionType}' collection`);
            return true;
        } catch (error) {
            console.error(`❌ Error adding documents to '${collectionType}':`, error);
            throw error;
        }
    }

    /**
     * Query a collection for similar documents
     */
    async queryCollection(collectionType, queryOptions) {
        const collection = await this.getCollection(collectionType);
        if (!collection) {
            throw new Error(`Collection '${collectionType}' not found`);
        }

        const {
            queryTexts,
            nResults = 5,
            where = {},
            includeMetadata = true,
            includeDocuments = true
        } = queryOptions;

        try {
            const results = await collection.query({
                queryTexts: Array.isArray(queryTexts) ? queryTexts : [queryTexts],
                nResults,
                where: Object.keys(where).length > 0 ? where : undefined,
                include: [
                    ...(includeMetadata ? ['metadatas'] : []),
                    ...(includeDocuments ? ['documents'] : []),
                    'distances'
                ]
            });

            console.log(`🔍 Query executed on '${collectionType}' collection, found ${results.ids[0]?.length || 0} results`);
            return results;
        } catch (error) {
            console.error(`❌ Error querying '${collectionType}' collection:`, error);
            throw error;
        }
    }

    /**
     * Get collection statistics
     */
    async getCollectionStats(collectionType) {
        const collection = await this.getCollection(collectionType);
        if (!collection) {
            throw new Error(`Collection '${collectionType}' not found`);
        }

        try {
            const count = await collection.count();
            const config = COLLECTION_CONFIGS[collectionType];
            
            return {
                name: config.name,
                type: collectionType,
                description: config.description,
                documentCount: count,
                embeddingFunction: config.embeddingFunction,
                distanceMetric: config.distanceMetric,
                dimensions: config.dimensions
            };
        } catch (error) {
            console.error(`❌ Error getting stats for '${collectionType}':`, error);
            throw error;
        }
    }

    /**
     * Get all collection statistics
     */
    async getAllCollectionStats() {
        const stats = [];
        const collectionTypes = Object.keys(COLLECTION_CONFIGS);

        for (const type of collectionTypes) {
            try {
                const stat = await this.getCollectionStats(type);
                stats.push(stat);
            } catch (error) {
                stats.push({
                    name: COLLECTION_CONFIGS[type].name,
                    type,
                    error: error.message
                });
            }
        }

        return stats;
    }

    /**
     * Health check for all collections
     */
    async healthCheck() {
        console.log('🏥 Performing collection health check...');
        
        const health = {
            connected: this.isConnected,
            timestamp: new Date().toISOString(),
            collections: []
        };

        if (!this.isConnected) {
            health.error = 'Not connected to ChromaDB';
            return health;
        }

        const collectionTypes = Object.keys(COLLECTION_CONFIGS);
        
        for (const type of collectionTypes) {
            try {
                const collection = await this.getCollection(type);
                const count = collection ? await collection.count() : 0;
                
                health.collections.push({
                    type,
                    name: COLLECTION_CONFIGS[type].name,
                    exists: !!collection,
                    documentCount: count,
                    status: 'healthy'
                });
            } catch (error) {
                health.collections.push({
                    type,
                    name: COLLECTION_CONFIGS[type].name,
                    exists: false,
                    status: 'error',
                    error: error.message
                });
            }
        }

        const healthyCount = health.collections.filter(c => c.status === 'healthy').length;
        health.overallStatus = healthyCount === collectionTypes.length ? 'healthy' : 'degraded';
        
        console.log(`🏥 Health check complete: ${healthyCount}/${collectionTypes.length} collections healthy`);
        return health;
    }

    /**
     * Cleanup and disconnect
     */
    async disconnect() {
        console.log('🔌 Disconnecting from ChromaDB...');
        this.collections.clear();
        this.isConnected = false;
        this.client = null;
        console.log('✅ Disconnected successfully');
    }
}

// Create singleton instance
const collectionManager = new CollectionManager();

module.exports = {
    CollectionManager,
    collectionManager
};

// Export for convenience
module.exports.initializeCollections = () => collectionManager.initializeAllCollections();
module.exports.getCollection = (type) => collectionManager.getCollection(type);
module.exports.addDocument = (type, doc) => collectionManager.addDocument(type, doc);
module.exports.queryCollection = (type, options) => collectionManager.queryCollection(type, options);
module.exports.healthCheck = () => collectionManager.healthCheck(); 