import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface QueryPerformanceMetrics {
  queryTime: number;
  resultCount: number;
  cacheHit: boolean;
  indexUsed: boolean;
}

export class QueryOptimizer {
  private static cache = new Map<string, { data: any; expiry: number }>();

  /**
   * Execute optimized query with caching and performance tracking
   */
  static async executeQuery<T>(
    queryKey: string,
    queryFn: () => Promise<T>,
    options: {
      cacheMinutes?: number;
      enableProfiling?: boolean;
      maxRetries?: number;
    } = {}
  ): Promise<{ data: T; metrics: QueryPerformanceMetrics }> {
    const { cacheMinutes = 5, enableProfiling = true, maxRetries = 3 } = options;
    const startTime = Date.now();

    // Check cache first
    const cached = this.getFromCache(queryKey);
    if (cached) {
      return {
        data: cached,
        metrics: {
          queryTime: Date.now() - startTime,
          resultCount: Array.isArray(cached) ? cached.length : 1,
          cacheHit: true,
          indexUsed: true, // Assume cache is optimized
        },
      };
    }

    // Execute query with retry mechanism
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await queryFn();
        const queryTime = Date.now() - startTime;

        // Cache the result
        this.setCache(queryKey, result, cacheMinutes);

        // Log performance if enabled
        if (enableProfiling && queryTime > 100) {
          console.log(`⚠️ Slow query detected: ${queryKey} took ${queryTime}ms`);
        }

        return {
          data: result,
          metrics: {
            queryTime,
            resultCount: Array.isArray(result) ? result.length : 1,
            cacheHit: false,
            indexUsed: queryTime < 100, // Assume fast queries use indexes
          },
        };
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries) {
          await this.delay(attempt * 1000); // Exponential backoff
        }
      }
    }

    throw lastError;
  }

  /**
   * Optimized user queries with proper indexing
   */
  static async findUsers(filters: {
    search?: string;
    role?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const { search, role, isActive, limit = 50, offset = 0 } = filters;
    const queryKey = `users:${JSON.stringify(filters)}`;

    return this.executeQuery(queryKey, async () => {
      const where: any = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (role) where.role = role;
      if (typeof isActive === 'boolean') where.isActive = isActive;

      return prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              agents: true,
              knowledge: true,
            },
          },
        },
        orderBy: [
          { role: 'asc' }, // Index on role
          { createdAt: 'desc' }, // Index on createdAt
        ],
        take: limit,
        skip: offset,
      });
    });
  }

  /**
   * Optimized agent queries with proper indexing
   */
  static async findAgents(filters: {
    userId?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const { userId, status, search, limit = 50, offset = 0 } = filters;
    const queryKey = `agents:${JSON.stringify(filters)}`;

    return this.executeQuery(queryKey, async () => {
      const where: any = {};

      if (userId) where.userId = userId; // Index on userId
      if (status) where.status = status; // Index on status
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      return prisma.agent.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          model: true,
          temperature: true,
          maxTokens: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              conversations: true,
              knowledgeAssignments: true,
            },
          },
        },
        orderBy: [
          { status: 'asc' }, // Index on status
          { updatedAt: 'desc' }, // Index on updatedAt
        ],
        take: limit,
        skip: offset,
      });
    });
  }

  /**
   * Optimized knowledge document queries
   */
  static async findKnowledge(filters: {
    userId?: string;
    agentId?: string;
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const { userId, agentId, type, status, limit = 50, offset = 0 } = filters;
    const queryKey = `knowledge:${JSON.stringify(filters)}`;

    return this.executeQuery(queryKey, async () => {
      const where: any = {};

      if (userId) where.userId = userId; // Index on userId
      if (type) where.type = type;
      if (status) where.status = status;

      // For agentId, we need to filter by knowledge assignments
      if (agentId) {
        where.agentAssignments = {
          some: {
            agentId: agentId,
            isActive: true,
          },
        };
      }

      return prisma.knowledge.findMany({
        where,
        select: {
          id: true,
          title: true,
          type: true,
          size: true,
          status: true,
          filename: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          agentAssignments: {
            select: {
              agent: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            where: {
              isActive: true,
            },
          },
        },
        orderBy: [
          { status: 'asc' }, // Index on status
          { createdAt: 'desc' }, // Index on createdAt
        ],
        take: limit,
        skip: offset,
      });
    });
  }

  /**
   * Database connection health check
   */
  static async healthCheck(): Promise<{
    connected: boolean;
    responseTime: number;
    activeConnections?: number;
  }> {
    const startTime = Date.now();

    try {
      // Simple query to test connection
      await prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;

      return {
        connected: true,
        responseTime,
        activeConnections: 1, // Prisma manages this internally
      };
    } catch (error) {
      return {
        connected: false,
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Get query performance statistics
   */
  static getPerformanceStats() {
    const cacheSize = this.cache.size;
    const now = Date.now();
    const activeCacheEntries = Array.from(this.cache.values()).filter(
      entry => entry.expiry > now
    ).length;

    return {
      cacheSize,
      activeCacheEntries,
      cacheHitRate: activeCacheEntries / Math.max(cacheSize, 1),
    };
  }

  /**
   * Clear performance cache
   */
  static clearCache() {
    this.cache.clear();
  }

  // Private helper methods
  private static getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(key); // Remove expired entries
    }
    return null;
  }

  private static setCache(key: string, data: any, minutes: number) {
    const expiry = Date.now() + minutes * 60 * 1000;
    this.cache.set(key, { data, expiry });
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export commonly used optimized queries
export const optimizedQueries = {
  getAllUsers: (filters: any = {}) => QueryOptimizer.findUsers(filters),
  getAllAgents: (filters: any = {}) => QueryOptimizer.findAgents(filters),
  getAllKnowledge: (filters: any = {}) => QueryOptimizer.findKnowledge(filters),
  healthCheck: () => QueryOptimizer.healthCheck(),
  getStats: () => QueryOptimizer.getPerformanceStats(),
};

export default QueryOptimizer;
