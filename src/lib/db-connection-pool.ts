/**
 * 🏊 DATABASE CONNECTION POOLING - Step 3.2
 * ==========================================
 * Optimized connection management and query performance
 */

import { PrismaClient } from '@prisma/client';

// Connection Pool Configuration
const CONNECTION_POOL_CONFIG = {
  connectionLimit: 10,
  idleTimeout: 60000, // 60 seconds
  maxWait: 10000, // 10 seconds
  retryCount: 3,
  queryTimeout: 30000, // 30 seconds
};

// Query Performance Monitoring
interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  error?: string;
}

class DatabaseConnectionPool {
  private prisma: PrismaClient | null = null;
  private queryMetrics: QueryMetrics[] = [];
  private connectionCount = 0;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (this.isInitialized) return;

    try {
      this.prisma = new PrismaClient({
        log: [
          { level: 'query', emit: 'event' },
          { level: 'error', emit: 'event' },
          { level: 'info', emit: 'event' },
          { level: 'warn', emit: 'event' },
        ],
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
      });

      // Query performance monitoring
      this.prisma.$on('query', e => {
        this.queryMetrics.push({
          query: e.query.substring(0, 200) + (e.query.length > 200 ? '...' : ''),
          duration: e.duration,
          timestamp: new Date(),
          success: true,
        });

        // Keep only last 100 metrics to prevent memory leak
        if (this.queryMetrics.length > 100) {
          this.queryMetrics = this.queryMetrics.slice(-100);
        }

        // Log slow queries (> 1000ms)
        if (e.duration > 1000) {
          console.warn(`🐌 slow query detected: ${e.duration}ms`, {
            query: e.query.substring(0, 200),
            params: e.params,
            duration: e.duration,
          });
        }
      });

      this.prisma.$on('error', e => {
        console.error('❌ Database error:', e);
        this.queryMetrics.push({
          query: 'ERROR',
          duration: 0,
          timestamp: new Date(),
          success: false,
          error: e.message,
        });
      });

      this.isInitialized = true;
              // Database connection pool initialized
    } catch (error) {
      console.error('❌ Failed to initialize database connection pool:', error);
      throw error;
    }
  }

  /**
   * Get optimized Prisma client with connection pooling
   */
  getClient(): PrismaClient {
    if (!this.prisma || !this.isInitialized) {
      this.initialize();
    }

    if (!this.prisma) {
      throw new Error('Database connection pool not available');
    }

    this.connectionCount++;
    return this.prisma;
  }

  /**
   * Execute query with performance monitoring
   */
  async executeWithMetrics<T>(
    operation: (prisma: PrismaClient) => Promise<T>,
    operationName: string = 'unknown'
  ): Promise<T> {
    const startTime = Date.now();
    const client = this.getClient();

    try {
      const result = await operation(client);
      const duration = Date.now() - startTime;

      // Log performance metrics
      if (duration > 500) {
        // Operation timing: ${operationName}
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ ${operationName} failed after ${duration}ms:`, error);
      throw error;
    }
  }

  /**
   * Get connection and query statistics
   */
  getStatistics() {
    const recentMetrics = this.queryMetrics.slice(-50);
    const avgDuration =
      recentMetrics.length > 0
        ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length
        : 0;

    const slowQueries = recentMetrics.filter(m => m.duration > 1000).length;
    const errorCount = recentMetrics.filter(m => !m.success).length;

    return {
      connectionCount: this.connectionCount,
      totalQueries: this.queryMetrics.length,
      avgQueryDuration: Math.round(avgDuration),
      slowQueries,
      errorCount,
      successRate:
        recentMetrics.length > 0
          ? ((recentMetrics.length - errorCount) / recentMetrics.length) * 100
          : 100,
      lastQueries: recentMetrics.slice(-10).map(m => ({
        query: m.query,
        duration: m.duration,
        success: m.success,
        timestamp: m.timestamp,
      })),
    };
  }

  /**
   * Cleanup and disconnect
   */
  async disconnect() {
    if (this.prisma) {
      await this.prisma.$disconnect();
      this.prisma = null;
      this.isInitialized = false;
              // Database connection pool disconnected
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const client = this.getClient();
      await client.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('❌ Database health check failed:', error);
      return false;
    }
  }
}

// Singleton instance
const dbPool = new DatabaseConnectionPool();

/**
 * Get optimized database client
 */
export function getDbClient() {
  return dbPool.getClient();
}

/**
 * Execute with performance monitoring
 */
export function executeWithMetrics<T>(
  operation: (prisma: PrismaClient) => Promise<T>,
  operationName?: string
) {
  return dbPool.executeWithMetrics(operation, operationName);
}

/**
 * Get database performance statistics
 */
export function getDbStatistics() {
  return dbPool.getStatistics();
}

/**
 * Database health check
 */
export function checkDbHealth() {
  return dbPool.healthCheck();
}

/**
 * Cleanup database connections
 */
export function disconnectDb() {
  return dbPool.disconnect();
}

// Query optimization helpers
export const QueryOptimizer = {
  /**
   * Optimized user queries with proper includes
   */
  async findUserWithStats(userId: string) {
    return executeWithMetrics(async prisma => {
      return prisma.user.findUnique({
        where: { id: userId },
        include: {
          _count: {
            select: {
              agents: true,
              conversations: true,
              documents: true,
              knowledge: true,
            },
          },
          settings: true,
          profile: true,
        },
      });
    }, 'findUserWithStats');
  },

  /**
   * Optimized agent queries with conversations
   */
  async findAgentsWithConversations(userId: string, limit: number = 10) {
    return executeWithMetrics(async prisma => {
      return prisma.agent.findMany({
        where: { userId },
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { conversations: true },
          },
          conversations: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              title: true,
              createdAt: true,
              _count: {
                select: { messages: true },
              },
            },
          },
        },
      });
    }, 'findAgentsWithConversations');
  },

  /**
   * Optimized knowledge search
   */
  async searchKnowledge(userId: string, query: string, limit: number = 20) {
    return executeWithMetrics(async prisma => {
      return prisma.knowledge.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: limit,
        orderBy: [{ viewCount: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          status: true,
          viewCount: true,
          createdAt: true,
        },
      });
    }, 'searchKnowledge');
  },

  /**
   * Optimized analytics queries
   */
  async getAnalyticsData(userId: string, startDate: Date, endDate: Date) {
    return executeWithMetrics(async prisma => {
      const [agentStats, messageStats, knowledgeStats] = await Promise.all([
        prisma.agent.aggregate({
          where: {
            userId,
            createdAt: { gte: startDate, lte: endDate },
          },
          _count: { id: true },
        }),
        prisma.message.aggregate({
          where: {
            conversation: { userId },
            createdAt: { gte: startDate, lte: endDate },
          },
          _count: { id: true },
          _sum: { tokens: true, cost: true },
        }),
        prisma.knowledge.aggregate({
          where: {
            userId,
            createdAt: { gte: startDate, lte: endDate },
          },
          _count: { id: true },
          _sum: { viewCount: true, size: true },
        }),
      ]);

      return {
        agents: agentStats,
        messages: messageStats,
        knowledge: knowledgeStats,
      };
    }, 'getAnalyticsData');
  },
};

export default dbPool;
