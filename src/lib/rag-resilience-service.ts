/**
 * 🛡️ RAG Resilience Service - Phase 4 Day 18 Integration
 * Comprehensive resilience system combining analytics, error handling, và monitoring
 */

import { SmartRAGService, SmartRAGRequest, SmartRAGResponse } from './smart-rag-service';
import { RAGAnalyticsService } from './rag-analytics-service';
import { RAGErrorHandler, ErrorRecoveryResult, FallbackConfig } from './rag-error-handler';

export interface ResilienceConfig {
  // Analytics configuration
  enableAnalytics: boolean;
  enableRealTimeMonitoring: boolean;
  enablePerformanceTracking: boolean;
  enableEffectivenessReporting: boolean;

  // Error handling configuration
  enableErrorRecovery: boolean;
  enableFallbackModes: boolean;
  enableCircuitBreaker: boolean;
  enableHealthMonitoring: boolean;

  // Integration settings
  enableAutoHealing: boolean;
  enablePredictiveFailover: boolean;
  enableQualityAssurance: boolean;

  // Thresholds
  performanceThresholds: {
    maxResponseTime: number;
    maxErrorRate: number;
    minQualityScore: number;
    maxDegradationTime: number;
  };

  // Recovery settings
  recoverySettings: {
    autoRecoveryEnabled: boolean;
    recoveryCheckInterval: number;
    maxRecoveryAttempts: number;
    recoveryTimeoutMs: number;
  };
}

export interface ResilienceStatus {
  systemHealth: 'excellent' | 'good' | 'degraded' | 'critical' | 'failed';
  components: {
    smartRAG: { status: string; metrics: any };
    analytics: { status: string; metrics: any };
    errorHandler: { status: string; metrics: any };
  };
  currentMode: 'normal' | 'degraded' | 'fallback' | 'recovery';
  activeIssues: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    component: string;
    description: string;
    startTime: string;
    autoHealing: boolean;
  }>;
  performanceMetrics: {
    overallScore: number;
    availability: number;
    reliability: number;
    responsiveness: number;
    lastUpdated: string;
  };
}

export interface ResilientRAGResponse extends SmartRAGResponse {
  resilience: {
    recoveryApplied: boolean;
    fallbackUsed: boolean;
    healthScore: number;
    issuesDetected: string[];
    qualityAssurance: {
      passed: boolean;
      score: number;
      issues: string[];
    };
  };
}

export const DEFAULT_RESILIENCE_CONFIG: ResilienceConfig = {
  enableAnalytics: true,
  enableRealTimeMonitoring: true,
  enablePerformanceTracking: true,
  enableEffectivenessReporting: true,

  enableErrorRecovery: true,
  enableFallbackModes: true,
  enableCircuitBreaker: true,
  enableHealthMonitoring: true,

  enableAutoHealing: true,
  enablePredictiveFailover: true,
  enableQualityAssurance: true,

  performanceThresholds: {
    maxResponseTime: 5000,
    maxErrorRate: 0.05,
    minQualityScore: 0.6,
    maxDegradationTime: 300000, // 5 minutes
  },

  recoverySettings: {
    autoRecoveryEnabled: true,
    recoveryCheckInterval: 30000, // 30 seconds
    maxRecoveryAttempts: 3,
    recoveryTimeoutMs: 120000, // 2 minutes
  },
};

export class RAGResilienceService {
  private static instance: RAGResilienceService;
  private config: ResilienceConfig;

  // Service instances
  private smartRAGService: SmartRAGService;
  private analyticsService: RAGAnalyticsService;
  private errorHandler: RAGErrorHandler;

  // Resilience state
  private resilienceStatus: ResilienceStatus;
  private activeRecoveryOperations: Map<string, { startTime: number; attempts: number }> =
    new Map();
  private performanceHistory: Array<{ timestamp: string; metrics: any }> = [];
  private qualityAssuranceCache: Map<string, { score: number; timestamp: string }> = new Map();

  constructor(config: Partial<ResilienceConfig> = {}) {
    this.config = { ...DEFAULT_RESILIENCE_CONFIG, ...config };

    // Initialize services
    this.smartRAGService = SmartRAGService.getInstance();
    this.analyticsService = RAGAnalyticsService.getInstance();
    this.errorHandler = RAGErrorHandler.getInstance();

    // Initialize resilience status
    this.resilienceStatus = this.initializeResilienceStatus();

    // Start monitoring
    this.startResilienceMonitoring();
  }

  static getInstance(config?: Partial<ResilienceConfig>): RAGResilienceService {
    if (!RAGResilienceService.instance) {
      RAGResilienceService.instance = new RAGResilienceService(config);
    }
    return RAGResilienceService.instance;
  }

  /**
   * 🛡️ Main resilient RAG processing method
   */
  async processResilientRAG(request: SmartRAGRequest): Promise<ResilientRAGResponse> {
    const queryId = await this.trackQueryStart(request);
    const startTime = Date.now();

    console.log(`🛡️ Processing resilient RAG for query: "${request.query}"`);

    try {
      // Pre-processing health check
      const preHealthCheck = await this.performPreProcessingHealthCheck();
      if (!preHealthCheck.canProceed) {
        console.warn(`⚠️ Pre-processing health check failed: ${preHealthCheck.reason}`);
        // ✅ FIXED IN Phase 4A - Handle potential undefined reason
        return await this.handlePreProcessingFailure(
          request,
          preHealthCheck.reason || 'Unknown reason'
        );
      }

      // Attempt normal RAG processing with monitoring
      let ragResponse: SmartRAGResponse;
      let recoveryApplied = false;
      let fallbackUsed = false;

      try {
        ragResponse = await this.executeMonitoredRAGProcessing(request);

        // Track successful completion
        await this.trackQueryCompletion(queryId, request, ragResponse, false);
      } catch (error) {
        // ✅ FIXED IN Phase 4A - Handle unknown error type
        console.error(
          `❌ RAG processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );

        // Apply error recovery
        const recoveryResult = await this.applyErrorRecovery(error as Error, request);

        if (recoveryResult.success) {
          // Convert recovery result to RAG response
          ragResponse = this.convertRecoveryToRAGResponse(recoveryResult, request);
          recoveryApplied = true;
          fallbackUsed = recoveryResult.responseSource !== 'rag';

          // Track recovery completion
          await this.trackQueryCompletion(queryId, request, ragResponse, true);
        } else {
          throw error; // Re-throw if recovery failed
        }
      }

      // Post-processing quality assurance
      const qualityAssurance = await this.performQualityAssurance(ragResponse, request);

      // Calculate health score
      const healthScore = this.calculateCurrentHealthScore();

      // Detect issues
      const issuesDetected = await this.detectSystemIssues();

      // Build resilient response
      const resilientResponse: ResilientRAGResponse = {
        ...ragResponse,
        resilience: {
          recoveryApplied,
          fallbackUsed,
          healthScore,
          issuesDetected,
          qualityAssurance,
        },
      };

      const processingTime = Date.now() - startTime;
      console.log(
        `✅ Resilient RAG completed in ${processingTime}ms (Health: ${healthScore.toFixed(2)})`
      );

      return resilientResponse;
    } catch (error) {
      // ✅ FIXED IN Phase 4A - Handle unknown error type
      console.error(
        `🚨 Resilient RAG failed completely: ${error instanceof Error ? error.message : 'Unknown error'}`
      );

      // Track error
      await this.analyticsService.trackError(
        request.userId,
        request.agentId,
        request.conversationId,
        {
          type: 'resilience_failure',
          // ✅ FIXED IN Phase 4A - Handle unknown error type
          message: error instanceof Error ? error.message : 'Unknown error',
          component: 'RAGResilienceService',
        }
      );

      // Return emergency fallback response
      return this.createEmergencyFallbackResponse(request, error as Error);
    }
  }

  /**
   * 🏥 Pre-processing health check
   */
  private async performPreProcessingHealthCheck(): Promise<{
    canProceed: boolean;
    reason?: string;
  }> {
    if (!this.config.enableHealthMonitoring) {
      return { canProceed: true };
    }

    try {
      // Check system health
      const systemHealth = await this.errorHandler.checkSystemHealth();

      if (systemHealth.overall === 'down') {
        return { canProceed: false, reason: 'System is down' };
      }

      if (
        systemHealth.overall === 'critical' &&
        systemHealth.components.vectorDatabase.status === 'down'
      ) {
        return { canProceed: false, reason: 'Vector database is unavailable' };
      }

      // Check performance thresholds
      const recentMetrics = this.analyticsService.getRealTimeMetrics();

      if (recentMetrics.averageResponseTime > this.config.performanceThresholds.maxResponseTime) {
        console.warn(`⚠️ High response time detected: ${recentMetrics.averageResponseTime}ms`);
        // Still proceed but with degraded mode
      }

      return { canProceed: true };
    } catch (error) {
      console.error('Health check failed:', error);
      return { canProceed: false, reason: 'Health check failed' };
    }
  }

  /**
   * 📊 Execute monitored RAG processing
   */
  private async executeMonitoredRAGProcessing(request: SmartRAGRequest): Promise<SmartRAGResponse> {
    const startTime = Date.now();

    // Start real-time monitoring
    const monitoringInterval = this.startRealTimeMonitoring(request);

    try {
      const response = await this.smartRAGService.processSmartRAG(request);

      // Stop monitoring
      clearInterval(monitoringInterval);

      // Update performance metrics
      const processingTime = Date.now() - startTime;
      this.updatePerformanceHistory(processingTime, response);

      return response;
    } catch (error) {
      clearInterval(monitoringInterval);
      throw error;
    }
  }

  /**
   * 🔄 Apply error recovery strategies
   */
  private async applyErrorRecovery(
    error: Error,
    request: SmartRAGRequest
  ): Promise<ErrorRecoveryResult> {
    if (!this.config.enableErrorRecovery) {
      throw error;
    }

    const errorContext = {
      userId: request.userId,
      agentId: request.agentId,
      conversationId: request.conversationId,
      query: request.query,
      timestamp: new Date().toISOString(),
      component: 'SmartRAGService',
      operation: 'processSmartRAG',
      attemptCount: 0,
    };

    console.log(`🔄 Applying error recovery for: ${error.message}`);

    // Use error handler to recover
    const recoveryResult = await this.errorHandler.handleRAGError(error, errorContext, () =>
      this.smartRAGService.processSmartRAG(request)
    );

    // Track recovery attempt
    this.trackRecoveryAttempt(request.conversationId, recoveryResult.success);

    return recoveryResult;
  }

  /**
   * 🛡️ Handle pre-processing failure
   */
  private async handlePreProcessingFailure(
    request: SmartRAGRequest,
    reason: string
  ): Promise<ResilientRAGResponse> {
    console.warn(`🛡️ Handling pre-processing failure: ${reason}`);

    // Try cached response first
    const cached = await this.tryGetCachedResponse(request);
    if (cached) {
      return this.wrapWithResilienceInfo(cached, true, true, 0.3, [reason]);
    }

    // Fall back to basic response
    const basicResponse = this.createBasicFallbackResponse(request);
    return this.wrapWithResilienceInfo(basicResponse, true, true, 0.2, [
      reason,
      'Using basic fallback',
    ]);
  }

  /**
   * 🔍 Quality assurance checking
   */
  private async performQualityAssurance(
    response: SmartRAGResponse,
    request: SmartRAGRequest
  ): Promise<{ passed: boolean; score: number; issues: string[] }> {
    if (!this.config.enableQualityAssurance) {
      return { passed: true, score: 1.0, issues: [] };
    }

    const issues: string[] = [];
    let score = 1.0;

    // Check response time
    if (response.processing.totalTime > this.config.performanceThresholds.maxResponseTime) {
      issues.push('Response time exceeds threshold');
      score -= 0.2;
    }

    // Check quality score
    // ✅ FIXED IN Phase 4A - Use correct property name
    if (response.quality.overallScore < this.config.performanceThresholds.minQualityScore) {
      issues.push('Quality score below threshold');
      score -= 0.3;
    }

    // Check if sources are available
    if (response.sourcesUsed.length === 0) {
      issues.push('No sources used in response');
      score -= 0.2;
    }

    // Check context relevance
    // ✅ FIXED IN Phase 4A - Use correct property name
    if (response.quality.relevanceScore < 0.5) {
      issues.push('Low context relevance');
      score -= 0.2;
    }

    // Check for error indicators
    if (response.debug?.errors && response.debug.errors.length > 0) {
      issues.push('Errors detected during processing');
      score -= 0.1;
    }

    const passed = score >= 0.6 && issues.length < 3;

    return {
      passed,
      score: Math.max(0, score),
      issues,
    };
  }

  /**
   * 📊 Real-time monitoring
   */
  private startRealTimeMonitoring(request: SmartRAGRequest): NodeJS.Timeout {
    if (!this.config.enableRealTimeMonitoring) {
      return setTimeout(() => {}, 0);
    }

    return setInterval(async () => {
      try {
        // Check system health
        const health = await this.errorHandler.checkSystemHealth();

        // Update resilience status
        this.resilienceStatus.systemHealth = this.mapHealthToResilience(health.overall);
        this.resilienceStatus.performanceMetrics.lastUpdated = new Date().toISOString();

        // Check for degradation
        if (health.overall === 'degraded' || health.overall === 'critical') {
          await this.handleSystemDegradation(health);
        }
      } catch (error) {
        console.error('Real-time monitoring error:', error);
      }
    }, 5000); // Every 5 seconds
  }

  /**
   * 📈 Performance tracking
   */
  private updatePerformanceHistory(processingTime: number, response: SmartRAGResponse): void {
    if (!this.config.enablePerformanceTracking) return;

    const metrics = {
      processingTime,
      // ✅ FIXED IN Phase 4A - Use correct property name
      // ✅ FIXED IN Phase 4A - Use correct property name
      // ✅ FIXED IN Phase 4A - Use correct property name
      qualityScore: response.quality.overallScore,
      sourcesUsed: response.sourcesUsed.length,
      // ✅ FIXED IN Phase 4A - Use correct property name
      contextTokens: response.contextInfo.optimizedTokenCount,
      timestamp: new Date().toISOString(),
    };

    this.performanceHistory.push({ timestamp: metrics.timestamp, metrics });

    // Keep only recent history
    if (this.performanceHistory.length > 1000) {
      this.performanceHistory = this.performanceHistory.slice(-500);
    }

    // Update resilience status
    this.updateResiliencePerformanceMetrics(metrics);
  }

  /**
   * 🔍 System issue detection
   */
  private async detectSystemIssues(): Promise<string[]> {
    const issues: string[] = [];

    try {
      // Check analytics for issues
      const analytics = this.analyticsService.getRealTimeMetrics();

      if (analytics.errorCount > 10) {
        issues.push('High error count detected');
      }

      if (analytics.averageResponseTime > this.config.performanceThresholds.maxResponseTime) {
        issues.push('High response time detected');
      }

      // Check error handler for circuit breaker issues
      const circuitBreakers = this.errorHandler.getCircuitBreakerStatus();
      let openBreakers = 0;

      for (const [component, breaker] of circuitBreakers.entries()) {
        if (breaker.state === 'OPEN') {
          issues.push(`Circuit breaker open for ${component}`);
          openBreakers++;
        }
      }

      if (openBreakers > 2) {
        issues.push('Multiple circuit breakers open');
      }

      // Check system health
      const systemHealth = await this.errorHandler.checkSystemHealth();
      if (systemHealth.overall === 'degraded') {
        issues.push('System performance degraded');
      }
    } catch (error) {
      issues.push('Issue detection failed');
    }

    return issues;
  }

  /**
   * 🏥 Auto-healing capabilities
   */
  private async handleSystemDegradation(health: any): Promise<void> {
    if (!this.config.enableAutoHealing) return;

    console.warn(`🏥 System degradation detected, attempting auto-healing...`);

    // Identify specific issues
    const issues = [];

    for (const [component, componentHealth] of Object.entries(health.components)) {
      if (
        (componentHealth as any).status === 'down' ||
        (componentHealth as any).status === 'critical'
      ) {
        issues.push(component);
      }
    }

    // Apply healing strategies
    for (const component of issues) {
      await this.applyHealingStrategy(component);
    }
  }

  private async applyHealingStrategy(component: string): Promise<void> {
    console.log(`🔧 Applying healing strategy for ${component}`);

    switch (component) {
      case 'vectorDatabase':
        // Try to reconnect or restart connection
        await this.healVectorDatabase();
        break;

      case 'searchService':
        // Clear caches and restart search service
        await this.healSearchService();
        break;

      case 'sourceManager':
        // Reset source priorities and clear cache
        await this.healSourceManager();
        break;

      default:
        console.log(`🤷 No specific healing strategy for ${component}`);
    }
  }

  private async healVectorDatabase(): Promise<void> {
    console.log('🔧 Healing vector database connection...');
    // Implementation would reconnect to ChromaDB
  }

  private async healSearchService(): Promise<void> {
    console.log('🔧 Healing search service...');
    // Implementation would clear caches and reset search service
  }

  private async healSourceManager(): Promise<void> {
    console.log('🔧 Healing source manager...');
    // Implementation would reset source manager state
  }

  // Helper methods
  private async trackQueryStart(request: SmartRAGRequest): Promise<string> {
    if (!this.config.enableAnalytics) return 'disabled';

    return await this.analyticsService.trackQueryStart(
      request.userId,
      request.agentId,
      request.conversationId,
      request.query
    );
  }

  private async trackQueryCompletion(
    queryId: string,
    request: SmartRAGRequest,
    response: SmartRAGResponse,
    recoveryUsed: boolean
  ): Promise<void> {
    if (!this.config.enableAnalytics) return;

    await this.analyticsService.trackQueryCompletion(
      queryId,
      request.userId,
      request.agentId,
      request.conversationId,
      {
        success: true,
        responseTime: response.processing.totalTime,
        searchResults: response.searchResults,
        sourcesUsed: response.sourcesUsed,
        optimizedContext: response.optimizedContext,
        // ✅ FIXED IN Phase 4A - Use correct property name
        qualityScore: response.quality.overallScore,
      }
    );
  }

  private trackRecoveryAttempt(conversationId: string, success: boolean): void {
    const recoveryOp = this.activeRecoveryOperations.get(conversationId);

    if (recoveryOp) {
      recoveryOp.attempts++;

      if (success || recoveryOp.attempts >= this.config.recoverySettings.maxRecoveryAttempts) {
        this.activeRecoveryOperations.delete(conversationId);
      }
    } else {
      this.activeRecoveryOperations.set(conversationId, {
        startTime: Date.now(),
        attempts: 1,
      });
    }
  }

  private convertRecoveryToRAGResponse(
    recovery: ErrorRecoveryResult,
    request: SmartRAGRequest
  ): SmartRAGResponse {
    // Convert error recovery result to a valid SmartRAGResponse
    return {
      optimizedContext: {
        content: recovery.response,
        tokenCount: recovery.response.length / 4,
        relevanceScore: recovery.metadata.qualityScore,
        compressionRatio: 1.0,
        sources: [],
        metadata: {
          originalTokenCount: recovery.response.length / 4,
          compressionTime: recovery.metadata.fallbackLatency,
          chunkingStrategy: 'fallback',
          qualityScore: recovery.metadata.qualityScore,
          coherenceScore: 0.5,
          topicConsistency: 0.5,
        },
        keyInsights: [],
        entityMentions: {},
      },
      searchResults: [],
      sourcesUsed: [],
      processing: {
        totalTime: recovery.metadata.fallbackLatency,
        searchTime: 0,
        optimizationTime: 0,
        qualityTime: 0,
        sourceManagementTime: 0,
      },
      quality: {
        overallScore: recovery.metadata.qualityScore,
        relevanceScore: recovery.metadata.qualityScore,
        diversityScore: 0.5,
        credibilityScore: 0.5,
        coherenceScore: 0.5,
      },
      sourceInfo: {
        totalSourcesAvailable: 0,
        sourcesUsed: 0,
        topSources: [],
        prioritization: [],
      },
      contextInfo: {
        originalTokenCount: recovery.response.length / 4,
        optimizedTokenCount: recovery.response.length / 4,
        compressionRatio: 1.0,
        chunkingStrategy: 'fallback',
      },
      recommendations: {
        alternativeQueries: [],
        relatedTopics: [],
        suggestedSources: [],
        followUpQuestions: [],
      },
    };
  }

  private async tryGetCachedResponse(request: SmartRAGRequest): Promise<SmartRAGResponse | null> {
    // Try to get cached response from error handler
    // This would be implemented to check the cache
    return null;
  }

  private createBasicFallbackResponse(request: SmartRAGRequest): SmartRAGResponse {
    const basicResponse = `I understand your question about "${request.query}". While our advanced systems are temporarily limited, I'm here to help with general guidance and assistance.`;

    return this.convertRecoveryToRAGResponse(
      {
        success: true,
        fallbackMode: 'basic_chat',
        responseSource: 'basic',
        response: basicResponse,
        metadata: {
          originalError: 'System unavailable',
          recoveryAttempts: 0,
          fallbackLatency: 100,
          qualityScore: 0.4,
          limitations: ['No context available', 'Basic response only'],
        },
      },
      request
    );
  }

  private createEmergencyFallbackResponse(
    request: SmartRAGRequest,
    error: Error
  ): ResilientRAGResponse {
    const emergencyResponse =
      "I apologize, but I'm experiencing technical difficulties and cannot process your request at the moment. Please try again later.";

    const basicRAGResponse = this.convertRecoveryToRAGResponse(
      {
        success: false,
        fallbackMode: 'emergency',
        responseSource: 'basic',
        response: emergencyResponse,
        metadata: {
          originalError: error.message,
          recoveryAttempts: 0,
          fallbackLatency: 50,
          qualityScore: 0.1,
          limitations: ['System failure', 'No recovery possible'],
        },
      },
      request
    );

    return this.wrapWithResilienceInfo(basicRAGResponse, false, true, 0.1, [
      'System failure',
      'Emergency fallback used',
    ]);
  }

  private wrapWithResilienceInfo(
    response: SmartRAGResponse,
    recoveryApplied: boolean,
    fallbackUsed: boolean,
    healthScore: number,
    issues: string[]
  ): ResilientRAGResponse {
    return {
      ...response,
      resilience: {
        recoveryApplied,
        fallbackUsed,
        healthScore,
        issuesDetected: issues,
        qualityAssurance: {
          passed: healthScore > 0.6,
          score: healthScore,
          issues: issues,
        },
      },
    };
  }

  private calculateCurrentHealthScore(): number {
    // Calculate health score based on recent performance
    const recentMetrics = this.performanceHistory.slice(-10);

    if (recentMetrics.length === 0) return 1.0;

    const avgQuality =
      recentMetrics.reduce((sum, entry) => sum + entry.metrics.qualityScore, 0) /
      recentMetrics.length;
    const avgResponseTime =
      recentMetrics.reduce((sum, entry) => sum + entry.metrics.processingTime, 0) /
      recentMetrics.length;

    let healthScore = avgQuality;

    // Penalize for high response times
    if (avgResponseTime > this.config.performanceThresholds.maxResponseTime) {
      healthScore *= 0.8;
    }

    // Check system health
    const systemHealth = this.resilienceStatus.systemHealth;
    switch (systemHealth) {
      case 'excellent':
        healthScore *= 1.0;
        break;
      case 'good':
        healthScore *= 0.9;
        break;
      case 'degraded':
        healthScore *= 0.7;
        break;
      case 'critical':
        healthScore *= 0.5;
        break;
      case 'failed':
        healthScore *= 0.2;
        break;
    }

    return Math.max(0, Math.min(1, healthScore));
  }

  private mapHealthToResilience(systemHealth: string): ResilienceStatus['systemHealth'] {
    switch (systemHealth) {
      case 'healthy':
        return 'excellent';
      case 'degraded':
        return 'degraded';
      case 'critical':
        return 'critical';
      case 'down':
        return 'failed';
      default:
        return 'good';
    }
  }

  private initializeResilienceStatus(): ResilienceStatus {
    return {
      systemHealth: 'excellent',
      components: {
        smartRAG: { status: 'healthy', metrics: {} },
        analytics: { status: 'healthy', metrics: {} },
        errorHandler: { status: 'healthy', metrics: {} },
      },
      currentMode: 'normal',
      activeIssues: [],
      performanceMetrics: {
        overallScore: 1.0,
        availability: 1.0,
        reliability: 1.0,
        responsiveness: 1.0,
        lastUpdated: new Date().toISOString(),
      },
    };
  }

  private updateResiliencePerformanceMetrics(metrics: any): void {
    const current = this.resilienceStatus.performanceMetrics;

    // Update metrics with exponential moving average
    const alpha = 0.1;
    current.overallScore = current.overallScore * (1 - alpha) + metrics.qualityScore * alpha;
    current.responsiveness =
      metrics.processingTime < this.config.performanceThresholds.maxResponseTime ? 1.0 : 0.8;
    current.lastUpdated = new Date().toISOString();
  }

  private startResilienceMonitoring(): void {
    // Monitor resilience every 30 seconds
    setInterval(async () => {
      try {
        await this.updateResilienceStatus();
      } catch (error) {
        console.error('Resilience monitoring error:', error);
      }
    }, this.config.recoverySettings.recoveryCheckInterval);
  }

  private async updateResilienceStatus(): Promise<void> {
    // Update component health
    try {
      const smartRAGHealth = await this.smartRAGService.healthCheck();
      this.resilienceStatus.components.smartRAG = {
        status: smartRAGHealth.status,
        metrics: smartRAGHealth.metrics,
      };
    } catch (error) {
      this.resilienceStatus.components.smartRAG = {
        status: 'unhealthy',
        // ✅ FIXED IN Phase 4A - Handle unknown error type
        metrics: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }

    // Update analytics health
    this.resilienceStatus.components.analytics = {
      status: 'healthy',
      metrics: this.analyticsService.getRealTimeMetrics(),
    };

    // Update error handler health
    this.resilienceStatus.components.errorHandler = {
      status: 'healthy',
      metrics: {
        circuitBreakers: this.errorHandler.getCircuitBreakerStatus().size,
        recentErrors: this.errorHandler.getErrorHistory(10).length,
      },
    };
  }

  // Public API methods
  getResilienceStatus(): ResilienceStatus {
    return { ...this.resilienceStatus };
  }

  async generateResilienceReport(timeframe: { start: string; end: string }): Promise<any> {
    const effectivenessReport = await this.analyticsService.generateEffectivenessReport(timeframe);
    const systemHealth = await this.errorHandler.checkSystemHealth();

    return {
      effectivenessReport,
      systemHealth,
      resilienceStatus: this.resilienceStatus,
      recoveryOperations: Array.from(this.activeRecoveryOperations.entries()),
      performanceHistory: this.performanceHistory.slice(-100),
    };
  }

  updateConfig(newConfig: Partial<ResilienceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): ResilienceConfig {
    return { ...this.config };
  }

  clearPerformanceHistory(): void {
    this.performanceHistory = [];
    this.qualityAssuranceCache.clear();
    console.log('🧹 Cleared resilience performance history');
  }
}

export const ragResilienceService = RAGResilienceService.getInstance();
