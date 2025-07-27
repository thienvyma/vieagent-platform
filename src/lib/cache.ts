export interface CacheEntry<T = any> {
  value: T;
  expiry: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  size: number;
  hitRate: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  tags?: string[]; // Tags for cache invalidation
  namespace?: string; // Namespace for keys
  compress?: boolean; // Compress large values
  serialize?: boolean; // Serialize objects
}

export class MemoryCache {
  private cache = new Map<string, CacheEntry>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    size: 0,
    hitRate: 0,
  };

  private maxSize: number;
  private cleanupInterval: NodeJS.Timeout;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;

    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000
    );
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.updateStats();
      return null;
    }

    if (entry.expiry < Date.now()) {
      this.cache.delete(key);
      this.stats.misses++;
      this.updateStats();
      return null;
    }

    this.stats.hits++;
    this.updateStats();
    return entry.value as T;
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const { ttl = 300000, tags = [], namespace } = options; // Default 5 minutes TTL

    const finalKey = namespace ? `${namespace}:${key}` : key;
    const expiry = Date.now() + ttl;

    // If cache is full, remove oldest entries
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(finalKey, {
      value,
      expiry,
      tags,
      metadata: {
        createdAt: Date.now(),
        namespace,
        size: JSON.stringify(value).length,
      },
    });

    this.stats.sets++;
    this.stats.size = this.cache.size;
    this.updateStats();
  }

  async delete(key: string, namespace?: string): Promise<boolean> {
    const finalKey = namespace ? `${namespace}:${key}` : key;
    const deleted = this.cache.delete(finalKey);

    if (deleted) {
      this.stats.deletes++;
      this.stats.size = this.cache.size;
      this.updateStats();
    }

    return deleted;
  }

  async clear(namespace?: string): Promise<void> {
    if (namespace) {
      const keysToDelete: string[] = [];
      for (const [key] of this.cache) {
        if (key.startsWith(`${namespace}:`)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }

    this.stats.size = this.cache.size;
    this.updateStats();
  }

  async invalidateByTags(tags: string[]): Promise<number> {
    let invalidated = 0;
    const toDelete: string[] = [];

    for (const [key, entry] of this.cache) {
      if (entry.tags && entry.tags.some(tag => tags.includes(tag))) {
        toDelete.push(key);
      }
    }

    toDelete.forEach(key => {
      this.cache.delete(key);
      invalidated++;
    });

    this.stats.size = this.cache.size;
    this.updateStats();

    return invalidated;
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache) {
      if (entry.expiry < now) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.stats.size = this.cache.size;
      this.updateStats();
    }
  }

  private evictOldest(): void {
    // Remove oldest entry based on creation time
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache) {
      if (entry.metadata?.createdAt && entry.metadata.createdAt < oldestTime) {
        oldestTime = entry.metadata.createdAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private updateStats(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

// Advanced cache with Redis-like interface (for future Redis integration)
export class AdvancedCache {
  private memoryCache: MemoryCache;
  private redisEnabled = false; // Future: detect if Redis is available

  constructor(options: { maxSize?: number; redisUrl?: string } = {}) {
    this.memoryCache = new MemoryCache(options.maxSize);

    // Future: Initialize Redis connection if URL provided
    if (options.redisUrl) {
      // this.initRedis(options.redisUrl);
    }
  }

  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const { namespace } = options;
    const finalKey = namespace ? `${namespace}:${key}` : key;

    if (this.redisEnabled) {
      // Future: try Redis first
      // const value = await this.getFromRedis(finalKey);
      // if (value !== null) return value;
    }

    return this.memoryCache.get<T>(finalKey);
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const { namespace } = options;
    const finalKey = namespace ? `${namespace}:${key}` : key;

    if (this.redisEnabled) {
      // Future: set in Redis
      // await this.setInRedis(finalKey, value, options);
    }

    await this.memoryCache.set(finalKey, value, options);
  }

  async delete(key: string, options: CacheOptions = {}): Promise<boolean> {
    const { namespace } = options;
    const finalKey = namespace ? `${namespace}:${key}` : key;

    if (this.redisEnabled) {
      // Future: delete from Redis
      // await this.deleteFromRedis(finalKey);
    }

    return this.memoryCache.delete(finalKey);
  }

  async remember<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key, options);

    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, options);

    return value;
  }

  async invalidateByTags(tags: string[]): Promise<number> {
    if (this.redisEnabled) {
      // Future: invalidate in Redis
    }

    return this.memoryCache.invalidateByTags(tags);
  }

  async clear(namespace?: string): Promise<void> {
    if (this.redisEnabled) {
      // Future: clear Redis namespace
    }

    await this.memoryCache.clear(namespace);
  }

  getStats(): CacheStats {
    return this.memoryCache.getStats();
  }

  destroy(): void {
    this.memoryCache.destroy();

    if (this.redisEnabled) {
      // Future: close Redis connection
    }
  }
}

// Global cache instance
export const globalCache = new AdvancedCache({ maxSize: 2000 });

// Cache decorators and utilities
export class CacheManager {
  private static cache = globalCache;

  /**
   * Cache function results with automatic key generation
   */
  static async cacheFunction<T>(
    fn: (...args: any[]) => Promise<T>,
    args: any[],
    options: CacheOptions & { keyPrefix?: string } = {}
  ): Promise<T> {
    const { keyPrefix = 'fn', ...cacheOptions } = options;
    const key = `${keyPrefix}:${JSON.stringify(args)}`;

    return this.cache.remember(key, () => fn(...args), cacheOptions);
  }

  /**
   * Cache API responses
   */
  static async cacheApiResponse<T>(
    endpoint: string,
    params: Record<string, any> = {},
    fetcher: () => Promise<T>,
    ttl = 300000 // 5 minutes default
  ): Promise<T> {
    const key = `api:${endpoint}:${JSON.stringify(params)}`;

    return this.cache.remember(key, fetcher, {
      ttl,
      namespace: 'api',
      tags: ['api', endpoint.split('/')[0]],
    });
  }

  /**
   * Cache database queries
   */
  static async cacheQuery<T>(
    queryName: string,
    params: Record<string, any> = {},
    query: () => Promise<T>,
    ttl = 600000 // 10 minutes default
  ): Promise<T> {
    const key = `query:${queryName}:${JSON.stringify(params)}`;

    return this.cache.remember(key, query, {
      ttl,
      namespace: 'db',
      tags: ['database', queryName],
    });
  }

  /**
   * Cache user-specific data
   */
  static async cacheUserData<T>(
    userId: string,
    dataType: string,
    fetcher: () => Promise<T>,
    ttl = 900000 // 15 minutes default
  ): Promise<T> {
    const key = `user:${userId}:${dataType}`;

    return this.cache.remember(key, fetcher, {
      ttl,
      namespace: 'users',
      tags: ['user', userId, dataType],
    });
  }

  /**
   * Invalidate all caches for a user
   */
  static async invalidateUser(userId: string): Promise<number> {
    return this.cache.invalidateByTags(['user', userId]);
  }

  /**
   * Invalidate all database caches
   */
  static async invalidateDatabase(): Promise<number> {
    return this.cache.invalidateByTags(['database']);
  }

  /**
   * Invalidate API caches
   */
  static async invalidateApi(endpoint?: string): Promise<number> {
    const tags = endpoint ? ['api', endpoint] : ['api'];
    return this.cache.invalidateByTags(tags);
  }

  /**
   * Get comprehensive cache statistics
   */
  static getStats() {
    return this.cache.getStats();
  }

  /**
   * Warm up cache with common data
   */
  static async warmUp(): Promise<void> {
    // Future: Add common queries to warm up
    // Examples:
    // - Popular blog posts
    // - User statistics
    // - Agent templates
    // - Knowledge base categories
  }
}

// Export convenience functions
export const cache = {
  get: (key: string, options?: CacheOptions) => globalCache.get(key, options),
  set: (key: string, value: any, options?: CacheOptions) => globalCache.set(key, value, options),
  delete: (key: string, options?: CacheOptions) => globalCache.delete(key, options),
  remember: (key: string, factory: () => Promise<any>, options?: CacheOptions) =>
    globalCache.remember(key, factory, options),
  clear: (namespace?: string) => globalCache.clear(namespace),
  invalidateByTags: (tags: string[]) => globalCache.invalidateByTags(tags),
  getStats: () => globalCache.getStats(),
};

export default CacheManager;
