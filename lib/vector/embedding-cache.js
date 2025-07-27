// Embedding Cache System
// Implements multiple cache backends with TTL management and performance optimization

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class EmbeddingCache {
    constructor(config = {}) {
        // Cache configuration
        this.backend = config.backend || 'memory'; // 'memory', 'file', 'hybrid'
        this.ttl = config.ttl || 24 * 60 * 60 * 1000; // 24 hours default TTL
        this.maxSize = config.maxSize || 10000; // Maximum cache entries
        this.compressionEnabled = config.compressionEnabled || true;
        this.persistentPath = config.persistentPath || './cache/embeddings';
        
        // Cache backends
        this.memoryCache = new Map();
        this.cacheStats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            evictions: 0,
            totalSize: 0,
            lastCleanup: Date.now()
        };
        
        // Cache metadata
        this.cacheMetadata = new Map(); // Stores TTL and metadata for each entry
        
        // Cleanup intervals
        this.cleanupInterval = config.cleanupInterval || 60 * 60 * 1000; // 1 hour
        this.cleanupTimer = null;
        
        this.initialize();
    }

    /**
     * Initialize cache system
     */
    async initialize() {
        console.log(`🗄️ Initializing Embedding Cache (${this.backend} backend)`);
        
        // Ensure cache directory exists for file backend
        if (this.backend === 'file' || this.backend === 'hybrid') {
            try {
                await fs.mkdir(this.persistentPath, { recursive: true });
                console.log(`📁 Cache directory created: ${this.persistentPath}`);
            } catch (error) {
                console.warn(`⚠️ Failed to create cache directory: ${error.message}`);
            }
        }
        
        // Load existing cache for file backend
        if (this.backend === 'file' || this.backend === 'hybrid') {
            await this.loadFromDisk();
        }
        
        // Start cleanup timer
        this.startCleanupTimer();
        
        console.log('✅ Embedding Cache initialized successfully');
    }

    /**
     * Get embedding from cache
     */
    async get(text, options = {}) {
        const cacheKey = this.generateCacheKey(text, options);
        
        try {
            // Check memory cache first
            if (this.memoryCache.has(cacheKey)) {
                const entry = this.memoryCache.get(cacheKey);
                const metadata = this.cacheMetadata.get(cacheKey);
                
                // Check TTL
                if (this.isExpired(metadata)) {
                    await this.delete(cacheKey);
                    this.cacheStats.misses++;
                    return null;
                }
                
                this.cacheStats.hits++;
                console.log(`🎯 Cache HIT for text: "${this.truncateText(text)}"`);
                
                return {
                    success: true,
                    vector: entry.vector,
                    dimensions: entry.dimensions,
                    cached: true,
                    cacheKey: cacheKey,
                    cachedAt: metadata.cachedAt,
                    expiresAt: metadata.expiresAt,
                    source: 'memory'
                };
            }
            
            // Check file cache for file/hybrid backends
            if (this.backend === 'file' || this.backend === 'hybrid') {
                const fileResult = await this.getFromFile(cacheKey);
                if (fileResult) {
                    // Load into memory cache for faster access
                    this.memoryCache.set(cacheKey, {
                        vector: fileResult.vector,
                        dimensions: fileResult.dimensions
                    });
                    
                    this.cacheMetadata.set(cacheKey, {
                        cachedAt: fileResult.cachedAt,
                        expiresAt: fileResult.expiresAt,
                        size: fileResult.vector.length * 8 // Approximate size in bytes
                    });
                    
                    this.cacheStats.hits++;
                    console.log(`🎯 Cache HIT (file) for text: "${this.truncateText(text)}"`);
                    
                    return {
                        success: true,
                        vector: fileResult.vector,
                        dimensions: fileResult.dimensions,
                        cached: true,
                        cacheKey: cacheKey,
                        cachedAt: fileResult.cachedAt,
                        expiresAt: fileResult.expiresAt,
                        source: 'file'
                    };
                }
            }
            
            this.cacheStats.misses++;
            console.log(`❌ Cache MISS for text: "${this.truncateText(text)}"`);
            return null;
            
        } catch (error) {
            console.error(`⚠️ Cache get error for key ${cacheKey}:`, error.message);
            this.cacheStats.misses++;
            return null;
        }
    }

    /**
     * Set embedding in cache
     */
    async set(text, embedding, options = {}) {
        const cacheKey = this.generateCacheKey(text, options);
        
        try {
            const now = Date.now();
            const expiresAt = now + this.ttl;
            
            const cacheEntry = {
                vector: embedding.vector || embedding,
                dimensions: embedding.dimensions || embedding.length,
                text: text,
                options: options,
                cachedAt: now,
                expiresAt: expiresAt
            };
            
            const metadata = {
                cachedAt: now,
                expiresAt: expiresAt,
                size: cacheEntry.vector.length * 8, // Approximate size in bytes
                textLength: text.length
            };
            
            // Check cache size limits
            await this.enforceSizeLimit();
            
            // Set in memory cache
            this.memoryCache.set(cacheKey, {
                vector: cacheEntry.vector,
                dimensions: cacheEntry.dimensions
            });
            
            this.cacheMetadata.set(cacheKey, metadata);
            
            // Set in file cache for file/hybrid backends
            if (this.backend === 'file' || this.backend === 'hybrid') {
                await this.setToFile(cacheKey, cacheEntry);
            }
            
            this.cacheStats.sets++;
            this.cacheStats.totalSize += metadata.size;
            
            console.log(`💾 Cache SET for text: "${this.truncateText(text)}" (expires: ${new Date(expiresAt).toLocaleString()})`);
            
            return {
                success: true,
                cacheKey: cacheKey,
                cached: true,
                expiresAt: expiresAt
            };
            
        } catch (error) {
            console.error(`⚠️ Cache set error for key ${cacheKey}:`, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Delete from cache
     */
    async delete(cacheKey) {
        try {
            let deleted = false;
            
            // Delete from memory
            if (this.memoryCache.has(cacheKey)) {
                const metadata = this.cacheMetadata.get(cacheKey);
                this.memoryCache.delete(cacheKey);
                this.cacheMetadata.delete(cacheKey);
                
                if (metadata) {
                    this.cacheStats.totalSize -= metadata.size;
                }
                
                deleted = true;
            }
            
            // Delete from file
            if (this.backend === 'file' || this.backend === 'hybrid') {
                const fileDeleted = await this.deleteFromFile(cacheKey);
                deleted = deleted || fileDeleted;
            }
            
            if (deleted) {
                this.cacheStats.deletes++;
                console.log(`🗑️ Cache entry deleted: ${cacheKey}`);
            }
            
            return deleted;
            
        } catch (error) {
            console.error(`⚠️ Cache delete error for key ${cacheKey}:`, error.message);
            return false;
        }
    }

    /**
     * Clear all cache
     */
    async clear() {
        try {
            // Clear memory cache
            const memorySize = this.memoryCache.size;
            this.memoryCache.clear();
            this.cacheMetadata.clear();
            
            // Clear file cache
            if (this.backend === 'file' || this.backend === 'hybrid') {
                await this.clearFileCache();
            }
            
            // Reset stats
            this.cacheStats.totalSize = 0;
            this.cacheStats.deletes += memorySize;
            
            console.log(`🧹 Cache cleared: ${memorySize} entries removed`);
            return true;
            
        } catch (error) {
            console.error(`⚠️ Cache clear error:`, error.message);
            return false;
        }
    }

    /**
     * Generate cache key from text and options
     */
    generateCacheKey(text, options = {}) {
        const normalizedText = text.trim().toLowerCase();
        const optionsHash = crypto
            .createHash('md5')
            .update(JSON.stringify(options))
            .digest('hex')
            .substring(0, 8);
        
        const textHash = crypto
            .createHash('sha256')
            .update(normalizedText)
            .digest('hex')
            .substring(0, 16);
        
        return `emb_${textHash}_${optionsHash}`;
    }

    /**
     * Check if cache entry is expired
     */
    isExpired(metadata) {
        if (!metadata) return true;
        return Date.now() > metadata.expiresAt;
    }

    /**
     * Enforce cache size limits
     */
    async enforceSizeLimit() {
        if (this.memoryCache.size >= this.maxSize) {
            console.log(`📏 Cache size limit reached (${this.maxSize}), evicting oldest entries`);
            
            // Sort by last accessed time and remove oldest 20%
            const entries = Array.from(this.cacheMetadata.entries())
                .sort((a, b) => a[1].cachedAt - b[1].cachedAt);
            
            const evictCount = Math.floor(this.maxSize * 0.2);
            
            for (let i = 0; i < evictCount && i < entries.length; i++) {
                const [key] = entries[i];
                await this.delete(key);
                this.cacheStats.evictions++;
            }
            
            console.log(`🧹 Evicted ${evictCount} oldest entries`);
        }
    }

    /**
     * Cleanup expired entries
     */
    async cleanupExpired() {
        console.log('🧹 Starting cache cleanup...');
        
        let cleanedCount = 0;
        const now = Date.now();
        
        // Cleanup memory cache
        for (const [key, metadata] of this.cacheMetadata.entries()) {
            if (this.isExpired(metadata)) {
                await this.delete(key);
                cleanedCount++;
            }
        }
        
        // Cleanup file cache
        if (this.backend === 'file' || this.backend === 'hybrid') {
            const fileCleanedCount = await this.cleanupExpiredFiles();
            cleanedCount += fileCleanedCount;
        }
        
        this.cacheStats.lastCleanup = now;
        
        console.log(`✅ Cache cleanup completed: ${cleanedCount} expired entries removed`);
        return cleanedCount;
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const hitRate = this.cacheStats.hits + this.cacheStats.misses > 0 
            ? (this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses)) * 100 
            : 0;
        
        return {
            ...this.cacheStats,
            hitRate: hitRate,
            memoryEntries: this.memoryCache.size,
            avgEntrySize: this.memoryCache.size > 0 ? this.cacheStats.totalSize / this.memoryCache.size : 0,
            backend: this.backend,
            ttl: this.ttl,
            maxSize: this.maxSize
        };
    }

    /**
     * File cache operations
     */
    async getFromFile(cacheKey) {
        try {
            const filePath = path.join(this.persistentPath, `${cacheKey}.json`);
            const data = await fs.readFile(filePath, 'utf8');
            const entry = JSON.parse(data);
            
            // Check TTL
            if (this.isExpired(entry)) {
                await this.deleteFromFile(cacheKey);
                return null;
            }
            
            return entry;
            
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.warn(`⚠️ File cache read error for ${cacheKey}:`, error.message);
            }
            return null;
        }
    }

    async setToFile(cacheKey, entry) {
        try {
            const filePath = path.join(this.persistentPath, `${cacheKey}.json`);
            await fs.writeFile(filePath, JSON.stringify(entry), 'utf8');
            return true;
        } catch (error) {
            console.warn(`⚠️ File cache write error for ${cacheKey}:`, error.message);
            return false;
        }
    }

    async deleteFromFile(cacheKey) {
        try {
            const filePath = path.join(this.persistentPath, `${cacheKey}.json`);
            await fs.unlink(filePath);
            return true;
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.warn(`⚠️ File cache delete error for ${cacheKey}:`, error.message);
            }
            return false;
        }
    }

    async loadFromDisk() {
        try {
            const files = await fs.readdir(this.persistentPath);
            const jsonFiles = files.filter(file => file.endsWith('.json'));
            
            console.log(`📁 Loading ${jsonFiles.length} cache entries from disk...`);
            
            let loadedCount = 0;
            for (const file of jsonFiles) {
                try {
                    const filePath = path.join(this.persistentPath, file);
                    const data = await fs.readFile(filePath, 'utf8');
                    const entry = JSON.parse(data);
                    
                    // Check if expired
                    if (!this.isExpired(entry)) {
                        const cacheKey = file.replace('.json', '');
                        this.memoryCache.set(cacheKey, {
                            vector: entry.vector,
                            dimensions: entry.dimensions
                        });
                        
                        this.cacheMetadata.set(cacheKey, {
                            cachedAt: entry.cachedAt,
                            expiresAt: entry.expiresAt,
                            size: entry.vector.length * 8
                        });
                        
                        loadedCount++;
                    } else {
                        // Delete expired file
                        await fs.unlink(filePath);
                    }
                } catch (error) {
                    console.warn(`⚠️ Failed to load cache file ${file}:`, error.message);
                }
            }
            
            console.log(`✅ Loaded ${loadedCount} valid cache entries from disk`);
            
        } catch (error) {
            console.warn(`⚠️ Failed to load cache from disk:`, error.message);
        }
    }

    async clearFileCache() {
        try {
            const files = await fs.readdir(this.persistentPath);
            const jsonFiles = files.filter(file => file.endsWith('.json'));
            
            for (const file of jsonFiles) {
                const filePath = path.join(this.persistentPath, file);
                await fs.unlink(filePath);
            }
            
            console.log(`🗑️ Cleared ${jsonFiles.length} cache files`);
            
        } catch (error) {
            console.warn(`⚠️ Failed to clear file cache:`, error.message);
        }
    }

    async cleanupExpiredFiles() {
        try {
            const files = await fs.readdir(this.persistentPath);
            const jsonFiles = files.filter(file => file.endsWith('.json'));
            
            let cleanedCount = 0;
            for (const file of jsonFiles) {
                try {
                    const filePath = path.join(this.persistentPath, file);
                    const data = await fs.readFile(filePath, 'utf8');
                    const entry = JSON.parse(data);
                    
                    if (this.isExpired(entry)) {
                        await fs.unlink(filePath);
                        cleanedCount++;
                    }
                } catch (error) {
                    // If we can't read the file, delete it
                    const filePath = path.join(this.persistentPath, file);
                    await fs.unlink(filePath);
                    cleanedCount++;
                }
            }
            
            return cleanedCount;
            
        } catch (error) {
            console.warn(`⚠️ Failed to cleanup expired files:`, error.message);
            return 0;
        }
    }

    /**
     * Utility functions
     */
    truncateText(text, maxLength = 50) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    startCleanupTimer() {
        this.cleanupTimer = setInterval(() => {
            this.cleanupExpired();
        }, this.cleanupInterval);
        
        console.log(`⏰ Cache cleanup timer started (interval: ${this.cleanupInterval}ms)`);
    }

    stopCleanupTimer() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
            console.log('⏰ Cache cleanup timer stopped');
        }
    }

    /**
     * Shutdown cache system
     */
    async shutdown() {
        console.log('🛑 Shutting down Embedding Cache...');
        
        this.stopCleanupTimer();
        
        // Save memory cache to disk for hybrid/file backends
        if (this.backend === 'file' || this.backend === 'hybrid') {
            console.log('💾 Saving memory cache to disk...');
            // Memory cache is already synced to file, so just ensure cleanup
            await this.cleanupExpired();
        }
        
        this.memoryCache.clear();
        this.cacheMetadata.clear();
        
        console.log('✅ Embedding Cache shutdown complete');
    }
}

module.exports = EmbeddingCache; 