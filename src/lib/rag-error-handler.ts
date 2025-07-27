/**
 * 🛡️ RAG Error Handler - Phase 4 Day 18 Step 18.2
 * Comprehensive error handling và fallback system for RAG operations
 */

export interface ErrorContext {
  userId: string;
  agentId: string;
  conversationId: string;
  query: string;
  timestamp: string;
  component: string;
  operation: string;
  attemptCount: number;
}

export interface FallbackConfig {
  // Fallback modes
  enableBasicChatFallback: boolean;
  enableCachedResponseFallback: boolean;
  enableStaticKnowledgeFallback: boolean;
  enableExternalApiFallback: boolean;

  // Retry configuration
  maxRetryAttempts: number;
  retryDelayMs: number;
  exponentialBackoff: boolean;
  maxRetryDelayMs: number;

  // Circuit breaker settings
  enableCircuitBreaker: boolean;
  failureThreshold: number;
  recoveryTimeoutMs: number;
  halfOpenMaxCalls: number;

  // Degradation settings
  enableGracefulDegradation: boolean;
  degradationThresholds: {
    responseTime: number;
    errorRate: number;
    systemLoad: number;
  };

  // Health check settings
  healthCheckIntervalMs: number;
  dependencyTimeoutMs: number;
  enableAutoRecovery: boolean;
}

export interface ErrorRecoveryResult {
  success: boolean;
  fallbackMode: string;
  responseSource: 'rag' | 'cache' | 'basic' | 'static' | 'external';
  response: string;
  metadata: {
    originalError: string;
    recoveryAttempts: number;
    fallbackLatency: number;
    qualityScore: number;
    limitations: string[];
  };
}

export interface SystemHealthStatus {
  overall: 'healthy' | 'degraded' | 'critical' | 'down';
  components: {
    vectorDatabase: ComponentHealth;
    searchService: ComponentHealth;
    optimizationService: ComponentHealth;
    qualityService: ComponentHealth;
    sourceManager: ComponentHealth;
    analytics: ComponentHealth;
  };
  lastUpdated: string;
}

export interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'critical' | 'down';
  responseTime: number;
  errorRate: number;
  lastError?: string;
  uptime: number;
  isRecovering: boolean;
}

export const DEFAULT_FALLBACK_CONFIG: FallbackConfig = {
  enableBasicChatFallback: true,
  enableCachedResponseFallback: true,
  enableStaticKnowledgeFallback: true,
  enableExternalApiFallback: false,

  maxRetryAttempts: 3,
  retryDelayMs: 1000,
  exponentialBackoff: true,
  maxRetryDelayMs: 10000,

  enableCircuitBreaker: true,
  failureThreshold: 5,
  recoveryTimeoutMs: 60000,
  halfOpenMaxCalls: 3,

  enableGracefulDegradation: true,
  degradationThresholds: {
    responseTime: 5000,
    errorRate: 0.1,
    systemLoad: 0.8,
  },

  healthCheckIntervalMs: 30000,
  dependencyTimeoutMs: 5000,
  enableAutoRecovery: true,
};

enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

interface CircuitBreaker {
  state: CircuitBreakerState;
  failureCount: number;
  lastFailureTime: number;
  halfOpenAttempts: number;
}

export class RAGErrorHandler {
  private static instance: RAGErrorHandler;
  private config: FallbackConfig;
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private healthStatus: SystemHealthStatus;
  private errorHistory: Array<{
    timestamp: string;
    error: string;
    component: string;
    recovered: boolean;
  }> = [];
  private cachedResponses: Map<string, { response: string; timestamp: string; quality: number }> =
    new Map();

  // Error patterns and classification
  private errorPatterns = {
    CONNECTION_ERRORS: [
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT',
      'ECONNRESET',
      'socket hang up',
      'connection refused',
      'network error',
    ],
    DATABASE_ERRORS: [
      'ChromaDB',
      'vector database',
      'collection not found',
      'embedding failed',
      'index error',
      'query failed',
      'database timeout',
    ],
    SEARCH_ERRORS: [
      'search failed',
      'no results',
      'embedding generation failed',
      'similarity search error',
      'context building failed',
    ],
    SYSTEM_ERRORS: [
      'out of memory',
      'cpu limit',
      'rate limit',
      'quota exceeded',
      'service unavailable',
      'internal server error',
    ],
  };

  constructor(config: Partial<FallbackConfig> = {}) {
    this.config = { ...DEFAULT_FALLBACK_CONFIG, ...config };
    this.healthStatus = this.initializeHealthStatus();
    this.startHealthMonitoring();
  }

  static getInstance(config?: Partial<FallbackConfig>): RAGErrorHandler {
    if (!RAGErrorHandler.instance) {
      RAGErrorHandler.instance = new RAGErrorHandler(config);
    }
    return RAGErrorHandler.instance;
  }

  /**
   * 🛡️ Main error handling and recovery method
   */
  async handleRAGError(
    error: Error,
    context: ErrorContext,
    originalPromise: () => Promise<any>
  ): Promise<ErrorRecoveryResult> {
    const startTime = Date.now();
    console.error(`🛡️ RAG Error Handler: ${error.message} in ${context.component}`);

    try {
      // Log error for analytics
      this.logError(error, context);

      // Check circuit breaker
      if (this.isCircuitBreakerOpen(context.component)) {
        console.warn(`⚡ Circuit breaker OPEN for ${context.component}, falling back immediately`);
        return await this.executeFallbackStrategy(error, context, 'circuit_breaker');
      }

      // Attempt retry with backoff
      if (context.attemptCount < this.config.maxRetryAttempts) {
        const shouldRetry = this.shouldRetryError(error, context);

        if (shouldRetry) {
          console.log(
            `🔄 Retrying operation ${context.operation} (attempt ${context.attemptCount + 1}/${this.config.maxRetryAttempts})`
          );

          await this.waitForRetry(context.attemptCount);

          try {
            const result = await originalPromise();
            this.recordSuccess(context.component);

            return {
              success: true,
              fallbackMode: 'retry_success',
              responseSource: 'rag',
              response: result,
              metadata: {
                originalError: error.message,
                recoveryAttempts: context.attemptCount + 1,
                fallbackLatency: Date.now() - startTime,
                qualityScore: 1.0,
                limitations: [],
              },
            };
          } catch (retryError) {
            console.error(
              `🔄 Retry ${context.attemptCount + 1} failed:`,
              retryError instanceof Error ? retryError.message : retryError
            );
            this.recordFailure(context.component, retryError as Error);

            // Continue to fallback if retry failed
            context.attemptCount++;
            return await this.handleRAGError(retryError as Error, context, originalPromise);
          }
        }
      }

      // Execute fallback strategy
      return await this.executeFallbackStrategy(error, context, 'max_retries_exceeded');
    } catch (handlerError) {
      console.error('🚨 Error handler itself failed:', handlerError);

      return {
        success: false,
        fallbackMode: 'handler_failed',
        responseSource: 'basic',
        response:
          "I apologize, but I'm experiencing technical difficulties. Please try again later.",
        metadata: {
          originalError: error.message,
          recoveryAttempts: context.attemptCount,
          fallbackLatency: Date.now() - startTime,
          qualityScore: 0.1,
          limitations: ['System error', 'No context available', 'Basic response only'],
        },
      };
    }
  }

  /**
   * 🔄 Execute appropriate fallback strategy
   */
  private async executeFallbackStrategy(
    error: Error,
    context: ErrorContext,
    reason: string
  ): Promise<ErrorRecoveryResult> {
    const startTime = Date.now();
    console.log(`🔄 Executing fallback strategy for: ${reason}`);

    // Try cached response first
    if (this.config.enableCachedResponseFallback) {
      const cachedResult = await this.tryGetCachedResponse(context);
      if (cachedResult) {
        return cachedResult;
      }
    }

    // Try static knowledge fallback
    if (this.config.enableStaticKnowledgeFallback) {
      const staticResult = await this.tryStaticKnowledgeFallback(context);
      if (staticResult) {
        return staticResult;
      }
    }

    // Try external API fallback
    if (this.config.enableExternalApiFallback) {
      const externalResult = await this.tryExternalApiFallback(context);
      if (externalResult) {
        return externalResult;
      }
    }

    // Final fallback: Basic chat mode
    if (this.config.enableBasicChatFallback) {
      return await this.executeBasicChatFallback(context, startTime);
    }

    // No fallbacks available
    return {
      success: false,
      fallbackMode: 'no_fallback_available',
      responseSource: 'basic',
      response:
        "I apologize, but I'm unable to process your request at the moment. Please try again later.",
      metadata: {
        originalError: error.message,
        recoveryAttempts: context.attemptCount,
        fallbackLatency: Date.now() - startTime,
        qualityScore: 0.1,
        limitations: ['All fallback strategies failed', 'No context available'],
      },
    };
  }

  /**
   * 💾 Try getting cached response
   */
  private async tryGetCachedResponse(context: ErrorContext): Promise<ErrorRecoveryResult | null> {
    const cacheKey = this.generateCacheKey(context.query, context.agentId);
    const cached = this.cachedResponses.get(cacheKey);

    if (cached) {
      const cacheAge = Date.now() - new Date(cached.timestamp).getTime();
      const maxCacheAge = 24 * 60 * 60 * 1000; // 24 hours

      if (cacheAge < maxCacheAge && cached.quality > 0.6) {
        console.log(`💾 Using cached response for query: ${context.query.substring(0, 50)}...`);

        return {
          success: true,
          fallbackMode: 'cached_response',
          responseSource: 'cache',
          response: cached.response,
          metadata: {
            originalError: 'RAG system unavailable',
            recoveryAttempts: 0,
            fallbackLatency: 50, // Fast cache retrieval
            qualityScore: cached.quality * 0.8, // Reduce quality score for cached response
            limitations: ['Response from cache', 'May not reflect latest information'],
          },
        };
      }
    }

    return null;
  }

  /**
   * 📚 Try static knowledge fallback
   */
  private async tryStaticKnowledgeFallback(
    context: ErrorContext
  ): Promise<ErrorRecoveryResult | null> {
    console.log(
      `📚 Attempting static knowledge fallback for query: ${context.query.substring(0, 50)}...`
    );

    // Simple keyword matching against static knowledge base
    const staticKnowledge = this.getStaticKnowledgeBase();
    const queryKeywords = context.query
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3);

    let bestMatch = { content: '', score: 0 };

    for (const knowledge of staticKnowledge) {
      const matchScore = this.calculateKeywordMatchScore(
        queryKeywords,
        knowledge.content.toLowerCase()
      );
      if (matchScore > bestMatch.score && matchScore > 0.3) {
        bestMatch = { content: knowledge.content, score: matchScore };
      }
    }

    if (bestMatch.score > 0.3) {
      return {
        success: true,
        fallbackMode: 'static_knowledge',
        responseSource: 'static',
        response: `Based on available information: ${bestMatch.content}`,
        metadata: {
          originalError: 'RAG system unavailable',
          recoveryAttempts: 0,
          fallbackLatency: 100,
          qualityScore: bestMatch.score * 0.6,
          limitations: ['Static knowledge only', 'May be outdated', 'Limited context'],
        },
      };
    }

    return null;
  }

  /**
   * 🌐 Try external API fallback
   */
  private async tryExternalApiFallback(context: ErrorContext): Promise<ErrorRecoveryResult | null> {
    console.log(
      `🌐 Attempting external API fallback for query: ${context.query.substring(0, 50)}...`
    );

    try {
      // This would integrate with external knowledge APIs
      // For now, we'll simulate a simple external lookup
      const externalResponse = await this.queryExternalKnowledgeAPI(context.query);

      if (externalResponse) {
        return {
          success: true,
          fallbackMode: 'external_api',
          responseSource: 'external',
          response: externalResponse,
          metadata: {
            originalError: 'Internal RAG system unavailable',
            recoveryAttempts: 0,
            fallbackLatency: 2000, // External API usually slower
            qualityScore: 0.7, // External quality
            limitations: ['External source', 'May lack context specificity'],
          },
        };
      }
    } catch (externalError) {
      // ✅ FIXED IN Phase 4A - Handle unknown error type
      console.error(
        '🌐 External API fallback failed:',
        externalError instanceof Error ? externalError.message : 'Unknown error'
      );
    }

    return null;
  }

  /**
   * 💬 Execute basic chat fallback
   */
  private async executeBasicChatFallback(
    context: ErrorContext,
    startTime: number
  ): Promise<ErrorRecoveryResult> {
    console.log(`💬 Executing basic chat fallback for query: ${context.query.substring(0, 50)}...`);

    // Generate a helpful response without RAG context
    const basicResponse = this.generateBasicResponse(context.query);

    return {
      success: true,
      fallbackMode: 'basic_chat',
      responseSource: 'basic',
      response: basicResponse,
      metadata: {
        originalError: 'RAG system unavailable',
        recoveryAttempts: context.attemptCount,
        fallbackLatency: Date.now() - startTime,
        qualityScore: 0.4, // Basic quality
        limitations: [
          'No context from knowledge base',
          'General response only',
          'May lack specific details',
        ],
      },
    };
  }

  /**
   * 🔍 Health monitoring and degradation detection
   */
  async checkSystemHealth(): Promise<SystemHealthStatus> {
    const healthChecks = await Promise.allSettled([
      this.checkVectorDatabaseHealth(),
      this.checkSearchServiceHealth(),
      this.checkOptimizationServiceHealth(),
      this.checkQualityServiceHealth(),
      this.checkSourceManagerHealth(),
      this.checkAnalyticsHealth(),
    ]);

    // Update component health status
    this.healthStatus.components = {
      vectorDatabase:
        healthChecks[0].status === 'fulfilled'
          ? healthChecks[0].value
          : this.createUnhealthyStatus('Connection failed'),
      searchService:
        healthChecks[1].status === 'fulfilled'
          ? healthChecks[1].value
          : this.createUnhealthyStatus('Service unavailable'),
      optimizationService:
        healthChecks[2].status === 'fulfilled'
          ? healthChecks[2].value
          : this.createUnhealthyStatus('Optimization failed'),
      qualityService:
        healthChecks[3].status === 'fulfilled'
          ? healthChecks[3].value
          : this.createUnhealthyStatus('Quality check failed'),
      sourceManager:
        healthChecks[4].status === 'fulfilled'
          ? healthChecks[4].value
          : this.createUnhealthyStatus('Source management failed'),
      analytics:
        healthChecks[5].status === 'fulfilled'
          ? healthChecks[5].value
          : this.createUnhealthyStatus('Analytics unavailable'),
    };

    // Calculate overall health
    this.healthStatus.overall = this.calculateOverallHealth(this.healthStatus.components);
    this.healthStatus.lastUpdated = new Date().toISOString();

    // Check for degradation conditions
    if (this.config.enableGracefulDegradation) {
      await this.handleSystemDegradation();
    }

    return this.healthStatus;
  }

  /**
   * ⚡ Circuit breaker management
   */
  private isCircuitBreakerOpen(component: string): boolean {
    const breaker = this.circuitBreakers.get(component);
    if (!breaker || !this.config.enableCircuitBreaker) return false;

    switch (breaker.state) {
      case CircuitBreakerState.OPEN:
        // Check if recovery timeout has passed
        if (Date.now() - breaker.lastFailureTime > this.config.recoveryTimeoutMs) {
          breaker.state = CircuitBreakerState.HALF_OPEN;
          breaker.halfOpenAttempts = 0;
          console.log(`⚡ Circuit breaker for ${component} moved to HALF_OPEN`);
          return false;
        }
        return true;

      case CircuitBreakerState.HALF_OPEN:
        return breaker.halfOpenAttempts >= this.config.halfOpenMaxCalls;

      default:
        return false;
    }
  }

  private recordFailure(component: string, error: Error): void {
    if (!this.config.enableCircuitBreaker) return;

    let breaker = this.circuitBreakers.get(component);
    if (!breaker) {
      breaker = {
        state: CircuitBreakerState.CLOSED,
        failureCount: 0,
        lastFailureTime: 0,
        halfOpenAttempts: 0,
      };
      this.circuitBreakers.set(component, breaker);
    }

    breaker.failureCount++;
    breaker.lastFailureTime = Date.now();

    if (breaker.state === CircuitBreakerState.HALF_OPEN) {
      breaker.state = CircuitBreakerState.OPEN;
      breaker.halfOpenAttempts = 0;
      console.warn(`⚡ Circuit breaker for ${component} OPENED (half-open failure)`);
    } else if (
      breaker.state === CircuitBreakerState.CLOSED &&
      breaker.failureCount >= this.config.failureThreshold
    ) {
      breaker.state = CircuitBreakerState.OPEN;
      console.warn(
        `⚡ Circuit breaker for ${component} OPENED (threshold reached: ${breaker.failureCount})`
      );
    }

    this.logError(error, {
      userId: 'system',
      agentId: 'system',
      conversationId: 'system',
      query: '',
      timestamp: new Date().toISOString(),
      component,
      operation: 'circuit_breaker',
      attemptCount: 0,
    });
  }

  private recordSuccess(component: string): void {
    if (!this.config.enableCircuitBreaker) return;

    const breaker = this.circuitBreakers.get(component);
    if (!breaker) return;

    if (breaker.state === CircuitBreakerState.HALF_OPEN) {
      breaker.halfOpenAttempts++;

      if (breaker.halfOpenAttempts >= this.config.halfOpenMaxCalls) {
        breaker.state = CircuitBreakerState.CLOSED;
        breaker.failureCount = 0;
        breaker.halfOpenAttempts = 0;
        console.log(`⚡ Circuit breaker for ${component} CLOSED (recovery successful)`);
      }
    } else if (breaker.state === CircuitBreakerState.CLOSED) {
      // Gradually reduce failure count on success
      breaker.failureCount = Math.max(0, breaker.failureCount - 1);
    }
  }

  /**
   * 🔄 Retry logic and backoff
   */
  private shouldRetryError(error: Error, context: ErrorContext): boolean {
    const errorMessage = error.message.toLowerCase();

    // Don't retry certain types of errors
    const nonRetryableErrors = [
      'invalid input',
      'malformed query',
      'unauthorized',
      'forbidden',
      'not found',
      'validation error',
    ];

    if (nonRetryableErrors.some(pattern => errorMessage.includes(pattern))) {
      console.log(`🚫 Not retrying non-retryable error: ${error.message}`);
      return false;
    }

    // Retry connection and temporary errors
    const retryablePatterns = [
      ...this.errorPatterns.CONNECTION_ERRORS,
      ...this.errorPatterns.DATABASE_ERRORS,
      'timeout',
      'temporary',
      'busy',
      'overloaded',
    ];

    return retryablePatterns.some(pattern => errorMessage.includes(pattern.toLowerCase()));
  }

  private async waitForRetry(attemptCount: number): Promise<void> {
    let delay = this.config.retryDelayMs;

    if (this.config.exponentialBackoff) {
      delay = Math.min(
        this.config.retryDelayMs * Math.pow(2, attemptCount),
        this.config.maxRetryDelayMs
      );
    }

    // Add jitter to prevent thundering herd
    delay += Math.random() * 1000;

    console.log(`⏳ Waiting ${delay}ms before retry...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * 🏥 Health checking methods
   */
  private async checkVectorDatabaseHealth(): Promise<ComponentHealth> {
    const startTime = Date.now();

    try {
      // Simulate health check - in real implementation, would ping ChromaDB
      await new Promise(resolve => setTimeout(resolve, 100));

      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        errorRate: 0,
        uptime: 0.995,
        isRecovering: false,
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        errorRate: 1.0,
        // ✅ FIXED IN Phase 4A - Handle unknown error type
        lastError: error instanceof Error ? error.message : 'Unknown error',
        uptime: 0,
        isRecovering: false,
      };
    }
  }

  private async checkSearchServiceHealth(): Promise<ComponentHealth> {
    const startTime = Date.now();

    try {
      // Simulate search service health check
      await new Promise(resolve => setTimeout(resolve, 50));

      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        errorRate: 0.02,
        uptime: 0.98,
        isRecovering: false,
      };
    } catch (error) {
      // ✅ FIXED IN Phase 4A - Handle unknown error type
      return this.createUnhealthyStatus(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async checkOptimizationServiceHealth(): Promise<ComponentHealth> {
    // Similar implementation for optimization service
    return {
      status: 'healthy',
      responseTime: 75,
      errorRate: 0.01,
      uptime: 0.99,
      isRecovering: false,
    };
  }

  private async checkQualityServiceHealth(): Promise<ComponentHealth> {
    // Similar implementation for quality service
    return {
      status: 'healthy',
      responseTime: 120,
      errorRate: 0.01,
      uptime: 0.97,
      isRecovering: false,
    };
  }

  private async checkSourceManagerHealth(): Promise<ComponentHealth> {
    // Similar implementation for source manager
    return {
      status: 'degraded',
      responseTime: 200,
      errorRate: 0.05,
      uptime: 0.95,
      isRecovering: true,
    };
  }

  private async checkAnalyticsHealth(): Promise<ComponentHealth> {
    // Similar implementation for analytics
    return {
      status: 'healthy',
      responseTime: 30,
      errorRate: 0,
      uptime: 0.999,
      isRecovering: false,
    };
  }

  private createUnhealthyStatus(errorMessage: string): ComponentHealth {
    return {
      status: 'down',
      responseTime: 5000,
      errorRate: 1.0,
      lastError: errorMessage,
      uptime: 0,
      isRecovering: false,
    };
  }

  private calculateOverallHealth(
    components: SystemHealthStatus['components']
  ): SystemHealthStatus['overall'] {
    const componentStatuses = Object.values(components);
    const downCount = componentStatuses.filter(c => c.status === 'down').length;
    const criticalCount = componentStatuses.filter(c => c.status === 'critical').length;
    const degradedCount = componentStatuses.filter(c => c.status === 'degraded').length;

    if (downCount >= 2 || componentStatuses[0].status === 'down') {
      // Vector DB is critical
      return 'down';
    } else if (downCount >= 1 || criticalCount >= 2) {
      return 'critical';
    } else if (criticalCount >= 1 || degradedCount >= 2) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  private async handleSystemDegradation(): Promise<void> {
    const { degradationThresholds } = this.config;

    // Check response time degradation
    const avgResponseTime = this.calculateAverageResponseTime();
    if (avgResponseTime > degradationThresholds.responseTime) {
      console.warn(`⚠️ System degradation detected: High response time (${avgResponseTime}ms)`);
      await this.enableDegradedMode('high_response_time');
    }

    // Check error rate degradation
    const errorRate = this.calculateRecentErrorRate();
    if (errorRate > degradationThresholds.errorRate) {
      console.warn(
        `⚠️ System degradation detected: High error rate (${(errorRate * 100).toFixed(1)}%)`
      );
      await this.enableDegradedMode('high_error_rate');
    }

    // Check system load degradation
    const systemLoad = this.getCurrentSystemLoad();
    if (systemLoad > degradationThresholds.systemLoad) {
      console.warn(
        `⚠️ System degradation detected: High system load (${(systemLoad * 100).toFixed(1)}%)`
      );
      await this.enableDegradedMode('high_system_load');
    }
  }

  private async enableDegradedMode(reason: string): Promise<void> {
    console.log(`🔄 Enabling degraded mode due to: ${reason}`);

    // Implement degraded mode strategies
    switch (reason) {
      case 'high_response_time':
        // Reduce context size, disable expensive operations
        break;
      case 'high_error_rate':
        // Increase fallback usage, reduce retry attempts
        break;
      case 'high_system_load':
        // Limit concurrent operations, enable more caching
        break;
    }
  }

  // Helper methods
  private logError(error: Error, context: ErrorContext): void {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      error: error.message,
      component: context.component,
      recovered: false,
    };

    this.errorHistory.push(errorEntry);

    // Keep only recent errors
    if (this.errorHistory.length > 1000) {
      this.errorHistory = this.errorHistory.slice(-500);
    }

    console.error(`📊 Error logged: ${context.component} - ${error.message}`);
  }

  private generateCacheKey(query: string, agentId: string): string {
    // Simple cache key generation - in production, use proper hashing
    const normalizedQuery = query.toLowerCase().trim();
    return `${agentId}_${normalizedQuery.substring(0, 100)}`;
  }

  private getStaticKnowledgeBase(): Array<{ content: string; category: string }> {
    return [
      {
        content:
          "I'm an AI assistant designed to help answer questions and provide information. I can assist with various topics including general knowledge, explanations, and guidance.",
        category: 'general',
      },
      {
        content:
          "If you're experiencing technical difficulties, please try refreshing the page or rephrasing your question. Our system is working to resolve any issues.",
        category: 'technical',
      },
      {
        content:
          'For the most accurate and up-to-date information, I recommend checking official documentation or contacting support if available.',
        category: 'support',
      },
      {
        content:
          'I can help with explaining concepts, providing guidance, answering questions, and offering general assistance on a wide range of topics.',
        category: 'capabilities',
      },
    ];
  }

  private calculateKeywordMatchScore(queryKeywords: string[], content: string): number {
    const contentWords = content.split(/\s+/).map(w => w.toLowerCase());
    let matches = 0;

    for (const keyword of queryKeywords) {
      if (contentWords.some(word => word.includes(keyword) || keyword.includes(word))) {
        matches++;
      }
    }

    return queryKeywords.length > 0 ? matches / queryKeywords.length : 0;
  }

  private async queryExternalKnowledgeAPI(query: string): Promise<string | null> {
    // Simulate external API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay

      // Simple response generation based on query
      if (query.toLowerCase().includes('help') || query.toLowerCase().includes('support')) {
        return "I'm here to help! While our main system is temporarily unavailable, I can still provide general assistance and guidance.";
      }

      if (query.toLowerCase().includes('error') || query.toLowerCase().includes('problem')) {
        return "I understand you're experiencing an issue. Our technical team is aware of current system limitations and is working to resolve them.";
      }

      return 'Based on general knowledge, I can provide some information about your query, though detailed context may be limited while our systems are recovering.';
    } catch (error) {
      console.error('External API failed:', error);
      return null;
    }
  }

  private generateBasicResponse(query: string): string {
    const lowerQuery = query.toLowerCase();

    // Pattern-based response generation
    if (lowerQuery.includes('hello') || lowerQuery.includes('hi')) {
      return "Hello! I'm currently operating in basic mode due to system maintenance, but I'm here to help with your questions.";
    }

    if (lowerQuery.includes('help') || lowerQuery.includes('support')) {
      return "I'm here to help! While some advanced features are temporarily unavailable, I can still provide general assistance and guidance.";
    }

    if (
      lowerQuery.includes('error') ||
      lowerQuery.includes('problem') ||
      lowerQuery.includes('issue')
    ) {
      return "I understand you're experiencing an issue. Our systems are currently in recovery mode, but I'll do my best to assist you with general guidance.";
    }

    if (lowerQuery.includes('what') || lowerQuery.includes('how') || lowerQuery.includes('why')) {
      return "That's a great question! While I'm currently operating with limited access to our knowledge base, I can provide general information and guidance on most topics.";
    }

    // Default response
    return "I understand your query, and while our advanced features are temporarily limited, I'm here to help in any way I can. Could you provide more details about what you're looking for?";
  }

  private calculateAverageResponseTime(): number {
    // In real implementation, would calculate from actual metrics
    return 2500; // Placeholder
  }

  private calculateRecentErrorRate(): number {
    const recentErrors = this.errorHistory.filter(e => {
      const errorTime = new Date(e.timestamp).getTime();
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      return errorTime > fiveMinutesAgo;
    });

    return recentErrors.length / 100; // Placeholder calculation
  }

  private getCurrentSystemLoad(): number {
    // In real implementation, would get actual system metrics
    return 0.65; // Placeholder
  }

  private initializeHealthStatus(): SystemHealthStatus {
    return {
      overall: 'healthy',
      components: {
        vectorDatabase: {
          status: 'healthy',
          responseTime: 0,
          errorRate: 0,
          uptime: 1,
          isRecovering: false,
        },
        searchService: {
          status: 'healthy',
          responseTime: 0,
          errorRate: 0,
          uptime: 1,
          isRecovering: false,
        },
        optimizationService: {
          status: 'healthy',
          responseTime: 0,
          errorRate: 0,
          uptime: 1,
          isRecovering: false,
        },
        qualityService: {
          status: 'healthy',
          responseTime: 0,
          errorRate: 0,
          uptime: 1,
          isRecovering: false,
        },
        sourceManager: {
          status: 'healthy',
          responseTime: 0,
          errorRate: 0,
          uptime: 1,
          isRecovering: false,
        },
        analytics: {
          status: 'healthy',
          responseTime: 0,
          errorRate: 0,
          uptime: 1,
          isRecovering: false,
        },
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  private startHealthMonitoring(): void {
    setInterval(async () => {
      try {
        await this.checkSystemHealth();
      } catch (error) {
        console.error('Health monitoring error:', error);
      }
    }, this.config.healthCheckIntervalMs);
  }

  // Public API methods
  async cacheResponse(
    query: string,
    agentId: string,
    response: string,
    qualityScore: number
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(query, agentId);
    this.cachedResponses.set(cacheKey, {
      response,
      timestamp: new Date().toISOString(),
      quality: qualityScore,
    });

    // Limit cache size
    if (this.cachedResponses.size > 1000) {
      const oldestKey = this.cachedResponses.keys().next().value;
      // ✅ FIXED IN Phase 4A - Handle potential undefined key
      if (oldestKey !== undefined) {
        this.cachedResponses.delete(oldestKey);
      }
    }
  }

  getSystemHealth(): SystemHealthStatus {
    return { ...this.healthStatus };
  }

  getErrorHistory(
    limit: number = 100
  ): Array<{ timestamp: string; error: string; component: string; recovered: boolean }> {
    return this.errorHistory.slice(-limit);
  }

  getCircuitBreakerStatus(): Map<string, CircuitBreaker> {
    return new Map(this.circuitBreakers);
  }

  updateConfig(newConfig: Partial<FallbackConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): FallbackConfig {
    return { ...this.config };
  }

  clearErrorHistory(): void {
    this.errorHistory = [];
    console.log('🧹 Cleared error history');
  }

  resetCircuitBreakers(): void {
    this.circuitBreakers.clear();
    console.log('🔄 Reset all circuit breakers');
  }
}

export const ragErrorHandler = RAGErrorHandler.getInstance();
