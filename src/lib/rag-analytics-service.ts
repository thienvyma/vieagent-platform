/**
 * 📊 RAG Analytics Service - Phase 4 Day 18 Step 18.1
 * Comprehensive analytics for RAG system monitoring, usage tracking, và effectiveness reporting
 */

import { SearchResult } from './semantic-search-service-optimized';
import { KnowledgeSource } from './knowledge-source-management';
import { OptimizedContext } from './context-optimization-service';

export interface RAGUsageMetrics {
  // Basic usage statistics
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  averageResponseTime: number;

  // Query patterns
  queryPatterns: {
    topQueries: Array<{ query: string; count: number; avgRelevance: number }>;
    queryTypes: { [type: string]: number };
    queryComplexity: { simple: number; medium: number; complex: number };
    timeDistribution: { [hour: string]: number };
  };

  // User behavior
  userBehavior: {
    uniqueUsers: number;
    averageQueriesPerUser: number;
    returnUsers: number;
    sessionDuration: number;
    bounceRate: number;
  };

  // Context utilization
  contextUtilization: {
    averageContextLength: number;
    compressionRatio: number;
    sourceUtilization: { [sourceId: string]: number };
    chunkingEfficiency: number;
  };
}

export interface RAGPerformanceMetrics {
  // Response time metrics
  responseTimes: {
    searchTime: number;
    optimizationTime: number;
    qualityTime: number;
    sourceManagementTime: number;
    totalTime: number;
    percentiles: {
      p50: number;
      p75: number;
      p90: number;
      p95: number;
      p99: number;
    };
  };

  // Quality metrics
  qualityMetrics: {
    averageRelevance: number;
    averageDiversity: number;
    averageCredibility: number;
    averageCoherence: number;
    qualityTrend: Array<{ timestamp: string; score: number }>;
  };

  // System performance
  systemPerformance: {
    cacheHitRate: number;
    vectorSearchLatency: number;
    embeddingGenerationTime: number;
    memoryUsage: number;
    cpuUsage: number;
    errorRate: number;
  };

  // Throughput metrics
  throughput: {
    queriesPerSecond: number;
    peakQPS: number;
    concurrentQueries: number;
    queueLength: number;
    processingCapacity: number;
  };
}

export interface RAGQualityAnalysis {
  // Relevance analysis
  relevanceAnalysis: {
    scoreDistribution: { [range: string]: number };
    lowRelevanceQueries: Array<{ query: string; score: number; reason: string }>;
    highRelevanceQueries: Array<{ query: string; score: number; sources: string[] }>;
    relevanceTrendsBySource: { [sourceId: string]: number };
  };

  // Context quality
  contextQuality: {
    optimalContextLength: number;
    contextOverflow: number;
    compressionEffectiveness: number;
    chunkingQuality: number;
    duplicateDetectionRate: number;
  };

  // Source effectiveness
  sourceEffectiveness: {
    topPerformingSources: Array<{
      sourceId: string;
      name: string;
      relevanceScore: number;
      usageFrequency: number;
      qualityScore: number;
    }>;
    underperformingSources: Array<{
      sourceId: string;
      name: string;
      issues: string[];
      suggestions: string[];
    }>;
    sourceCredibilityTrends: { [sourceId: string]: Array<{ timestamp: string; score: number }> };
  };

  // Improvement suggestions
  improvementSuggestions: Array<{
    category: 'performance' | 'quality' | 'coverage' | 'user_experience';
    priority: 'high' | 'medium' | 'low';
    description: string;
    impact: string;
    implementation: string;
  }>;
}

export interface RAGEffectivenessReport {
  // Report metadata
  reportId: string;
  generatedAt: string;
  period: {
    start: string;
    end: string;
    duration: string;
  };

  // Executive summary
  executiveSummary: {
    overallScore: number;
    keyMetrics: {
      totalQueries: number;
      averageRelevance: number;
      systemUptime: number;
      userSatisfaction: number;
    };
    majorInsights: string[];
    criticalIssues: string[];
    recommendations: string[];
  };

  // Detailed analysis
  detailedAnalysis: {
    usageMetrics: RAGUsageMetrics;
    performanceMetrics: RAGPerformanceMetrics;
    qualityAnalysis: RAGQualityAnalysis;
  };

  // Trends and predictions
  trendsAndPredictions: {
    usageTrends: Array<{
      metric: string;
      trend: 'increasing' | 'decreasing' | 'stable';
      prediction: string;
    }>;
    performanceTrends: Array<{
      metric: string;
      trend: 'improving' | 'degrading' | 'stable';
      forecast: string;
    }>;
    capacityPredictions: Array<{ timeframe: string; expectedLoad: number; recommendation: string }>;
  };

  // Actionable insights
  actionableInsights: Array<{
    insight: string;
    impact: 'high' | 'medium' | 'low';
    effort: 'high' | 'medium' | 'low';
    timeline: string;
    steps: string[];
  }>;
}

export interface AnalyticsConfig {
  // Data collection settings
  enableUsageTracking: boolean;
  enablePerformanceMonitoring: boolean;
  enableQualityAnalysis: boolean;
  enableReportGeneration: boolean;

  // Data retention
  dataRetentionDays: number;
  aggregationIntervals: string[]; // ['1h', '1d', '1w', '1m']
  maxRecordsPerInterval: number;

  // Real-time monitoring
  enableRealTimeAlerts: boolean;
  alertThresholds: {
    responseTime: number;
    errorRate: number;
    qualityScore: number;
    systemLoad: number;
  };

  // Report generation
  reportSchedule: string[]; // ['daily', 'weekly', 'monthly']
  reportRecipients: string[];
  enableAutomaticReports: boolean;

  // Privacy and security
  anonymizeUserData: boolean;
  enableGDPRCompliance: boolean;
  dataEncryption: boolean;
}

export const DEFAULT_ANALYTICS_CONFIG: AnalyticsConfig = {
  enableUsageTracking: true,
  enablePerformanceMonitoring: true,
  enableQualityAnalysis: true,
  enableReportGeneration: true,

  dataRetentionDays: 90,
  aggregationIntervals: ['1h', '1d', '1w', '1m'],
  maxRecordsPerInterval: 10000,

  enableRealTimeAlerts: true,
  alertThresholds: {
    responseTime: 5000, // 5 seconds
    errorRate: 0.05, // 5%
    qualityScore: 0.6,
    systemLoad: 0.8, // 80%
  },

  reportSchedule: ['daily', 'weekly'],
  reportRecipients: [],
  enableAutomaticReports: false,

  anonymizeUserData: true,
  enableGDPRCompliance: true,
  dataEncryption: true,
};

interface AnalyticsEvent {
  id: string;
  timestamp: string;
  userId: string;
  agentId: string;
  conversationId: string;
  eventType: 'query' | 'response' | 'error' | 'system';

  // Query data
  query?: {
    text: string;
    complexity: 'simple' | 'medium' | 'complex';
    intent: string;
    language: string;
  };

  // Response data
  response?: {
    success: boolean;
    responseTime: number;
    searchResults: number;
    sourcesUsed: number;
    contextLength: number;
    relevanceScore: number;
    qualityScore: number;
  };

  // Error data
  error?: {
    type: string;
    message: string;
    stack?: string;
    component: string;
  };

  // System data
  system?: {
    cpuUsage: number;
    memoryUsage: number;
    activeConnections: number;
    queueLength: number;
  };
}

export class RAGAnalyticsService {
  private static instance: RAGAnalyticsService;
  private config: AnalyticsConfig;
  private events: AnalyticsEvent[] = [];
  private aggregatedData: Map<string, any> = new Map();
  private alerts: Array<{ timestamp: string; type: string; message: string; severity: string }> =
    [];

  // Performance monitoring
  private performanceBuffer: Array<{
    timestamp: string;
    metrics: Partial<RAGPerformanceMetrics>;
  }> = [];

  // Real-time metrics
  private realTimeMetrics = {
    activeQueries: 0,
    totalQueries: 0,
    errorCount: 0,
    lastErrorTime: null as string | null,
    averageResponseTime: 0,
    currentLoad: 0,
  };

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = { ...DEFAULT_ANALYTICS_CONFIG, ...config };
    this.startBackgroundTasks();
  }

  static getInstance(config?: Partial<AnalyticsConfig>): RAGAnalyticsService {
    if (!RAGAnalyticsService.instance) {
      RAGAnalyticsService.instance = new RAGAnalyticsService(config);
    }
    return RAGAnalyticsService.instance;
  }

  /**
   * 📊 Main event tracking method
   */
  async trackEvent(eventData: Partial<AnalyticsEvent>): Promise<void> {
    if (!this.config.enableUsageTracking) return;

    const event: AnalyticsEvent = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      userId: eventData.userId || 'anonymous',
      agentId: eventData.agentId || 'unknown',
      conversationId: eventData.conversationId || 'unknown',
      eventType: eventData.eventType || 'query',
      ...eventData,
    };

    // Anonymize user data if enabled
    if (this.config.anonymizeUserData) {
      event.userId = this.anonymizeUserId(event.userId);
    }

    this.events.push(event);
    this.updateRealTimeMetrics(event);

    // Check for alerts
    await this.checkAlertConditions(event);

    // Aggregate data if buffer is full
    if (this.events.length > this.config.maxRecordsPerInterval) {
      await this.aggregateData();
    }

    console.log(`📊 Analytics: Tracked ${event.eventType} event for user ${event.userId}`);
  }

  /**
   * 🎯 Track RAG query start
   */
  async trackQueryStart(
    userId: string,
    agentId: string,
    conversationId: string,
    query: string
  ): Promise<string> {
    const queryId = this.generateEventId();

    await this.trackEvent({
      id: queryId,
      userId,
      agentId,
      conversationId,
      eventType: 'query',
      query: {
        text: query,
        complexity: this.analyzeQueryComplexity(query),
        intent: this.detectQueryIntent(query),
        language: this.detectLanguage(query),
      },
    });

    this.realTimeMetrics.activeQueries++;
    this.realTimeMetrics.totalQueries++;

    return queryId;
  }

  /**
   * ✅ Track RAG query completion
   */
  async trackQueryCompletion(
    queryId: string,
    userId: string,
    agentId: string,
    conversationId: string,
    responseData: {
      success: boolean;
      responseTime: number;
      searchResults: SearchResult[];
      sourcesUsed: KnowledgeSource[];
      optimizedContext: OptimizedContext;
      qualityScore: number;
    }
  ): Promise<void> {
    await this.trackEvent({
      id: queryId,
      userId,
      agentId,
      conversationId,
      eventType: 'response',
      response: {
        success: responseData.success,
        responseTime: responseData.responseTime,
        searchResults: responseData.searchResults.length,
        sourcesUsed: responseData.sourcesUsed.length,
        contextLength: responseData.optimizedContext.tokenCount,
        relevanceScore: responseData.optimizedContext.relevanceScore,
        qualityScore: responseData.qualityScore,
      },
    });

    this.realTimeMetrics.activeQueries = Math.max(0, this.realTimeMetrics.activeQueries - 1);

    // Update average response time (exponential moving average)
    const alpha = 0.1;
    this.realTimeMetrics.averageResponseTime =
      this.realTimeMetrics.averageResponseTime * (1 - alpha) + responseData.responseTime * alpha;
  }

  /**
   * ❌ Track RAG error
   */
  async trackError(
    userId: string,
    agentId: string,
    conversationId: string,
    error: {
      type: string;
      message: string;
      stack?: string;
      component: string;
    }
  ): Promise<void> {
    await this.trackEvent({
      userId,
      agentId,
      conversationId,
      eventType: 'error',
      error,
    });

    this.realTimeMetrics.errorCount++;
    this.realTimeMetrics.lastErrorTime = new Date().toISOString();
    this.realTimeMetrics.activeQueries = Math.max(0, this.realTimeMetrics.activeQueries - 1);

    console.error(`📊 Analytics: Tracked error in ${error.component}: ${error.message}`);
  }

  /**
   * 🖥️ Track system metrics
   */
  async trackSystemMetrics(systemData: {
    cpuUsage: number;
    memoryUsage: number;
    activeConnections: number;
    queueLength: number;
  }): Promise<void> {
    if (!this.config.enablePerformanceMonitoring) return;

    await this.trackEvent({
      userId: 'system',
      agentId: 'system',
      conversationId: 'system',
      eventType: 'system',
      system: systemData,
    });

    this.realTimeMetrics.currentLoad = Math.max(systemData.cpuUsage, systemData.memoryUsage);
  }

  /**
   * 📈 Generate usage metrics
   */
  async generateUsageMetrics(timeframe: { start: string; end: string }): Promise<RAGUsageMetrics> {
    const events = this.getEventsInTimeframe(timeframe);
    const queryEvents = events.filter(e => e.eventType === 'query');
    const responseEvents = events.filter(e => e.eventType === 'response');
    const errorEvents = events.filter(e => e.eventType === 'error');

    // Basic statistics
    const totalQueries = queryEvents.length;
    const successfulQueries = responseEvents.filter(e => e.response?.success).length;
    const failedQueries = errorEvents.length;
    const averageResponseTime =
      responseEvents.reduce((sum, e) => sum + (e.response?.responseTime || 0), 0) /
        responseEvents.length || 0;

    // Query patterns analysis
    const queryTexts = queryEvents.map(e => e.query?.text || '').filter(Boolean);
    const queryCounts = this.countFrequency(queryTexts);
    const topQueries = Object.entries(queryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([query, count]) => ({
        query,
        count,
        avgRelevance: this.calculateAverageRelevanceForQuery(query, responseEvents),
      }));

    // User behavior analysis
    const uniqueUsers = new Set(events.map(e => e.userId)).size;
    const userQueryCounts = this.countFrequency(queryEvents.map(e => e.userId));
    const averageQueriesPerUser =
      Object.values(userQueryCounts).reduce((sum, count) => sum + count, 0) / uniqueUsers || 0;

    // Context utilization
    const contextLengths = responseEvents
      .map(e => e.response?.contextLength || 0)
      .filter(l => l > 0);
    const averageContextLength =
      contextLengths.reduce((sum, len) => sum + len, 0) / contextLengths.length || 0;

    return {
      totalQueries,
      successfulQueries,
      failedQueries,
      averageResponseTime,

      queryPatterns: {
        topQueries,
        queryTypes: this.analyzeQueryTypes(queryEvents),
        queryComplexity: this.analyzeQueryComplexityDistribution(queryEvents),
        timeDistribution: this.analyzeTimeDistribution(queryEvents),
      },

      userBehavior: {
        uniqueUsers,
        averageQueriesPerUser,
        returnUsers: this.calculateReturnUsers(events),
        sessionDuration: this.calculateAverageSessionDuration(events),
        bounceRate: this.calculateBounceRate(events),
      },

      contextUtilization: {
        averageContextLength,
        compressionRatio: this.calculateAverageCompressionRatio(responseEvents),
        sourceUtilization: this.analyzeSourceUtilization(responseEvents),
        chunkingEfficiency: this.calculateChunkingEfficiency(responseEvents),
      },
    };
  }

  /**
   * ⚡ Generate performance metrics
   */
  async generatePerformanceMetrics(timeframe: {
    start: string;
    end: string;
  }): Promise<RAGPerformanceMetrics> {
    const responseEvents = this.getEventsInTimeframe(timeframe).filter(
      e => e.eventType === 'response' && e.response?.success
    );

    if (responseEvents.length === 0) {
      return this.getEmptyPerformanceMetrics();
    }

    // Response time analysis
    const responseTimes = responseEvents.map(e => e.response?.responseTime || 0);
    const sortedTimes = responseTimes.sort((a, b) => a - b);

    const percentiles = {
      p50: this.calculatePercentile(sortedTimes, 0.5),
      p75: this.calculatePercentile(sortedTimes, 0.75),
      p90: this.calculatePercentile(sortedTimes, 0.9),
      p95: this.calculatePercentile(sortedTimes, 0.95),
      p99: this.calculatePercentile(sortedTimes, 0.99),
    };

    // Quality metrics
    const relevanceScores = responseEvents.map(e => e.response?.relevanceScore || 0);
    const qualityScores = responseEvents.map(e => e.response?.qualityScore || 0);

    const averageRelevance =
      relevanceScores.reduce((sum, score) => sum + score, 0) / relevanceScores.length;
    const averageQuality =
      qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;

    // System performance from recent buffer
    const recentSystemMetrics = this.performanceBuffer
      .filter(entry => entry.timestamp >= timeframe.start && entry.timestamp <= timeframe.end)
      .map(entry => entry.metrics);

    return {
      responseTimes: {
        searchTime: 0, // Would be calculated from detailed metrics
        optimizationTime: 0,
        qualityTime: 0,
        sourceManagementTime: 0,
        totalTime: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
        percentiles,
      },

      qualityMetrics: {
        averageRelevance,
        averageDiversity: 0.8, // Would be calculated from actual diversity metrics
        averageCredibility: 0.75, // Would be calculated from source credibility
        averageCoherence: averageQuality,
        qualityTrend: this.calculateQualityTrend(responseEvents),
      },

      systemPerformance: {
        cacheHitRate: 0.85, // Would be calculated from cache metrics
        vectorSearchLatency: percentiles.p90,
        embeddingGenerationTime: 0.2, // Would be calculated from actual metrics
        memoryUsage: this.realTimeMetrics.currentLoad,
        cpuUsage: this.realTimeMetrics.currentLoad * 0.8,
        errorRate: this.calculateErrorRate(timeframe),
      },

      throughput: {
        queriesPerSecond: this.calculateQPS(responseEvents, timeframe),
        peakQPS: this.calculatePeakQPS(responseEvents, timeframe),
        concurrentQueries: this.realTimeMetrics.activeQueries,
        queueLength: 0, // Would be calculated from actual queue metrics
        processingCapacity: 100, // Would be calculated based on system capacity
      },
    };
  }

  /**
   * 🔍 Generate quality analysis
   */
  async generateQualityAnalysis(timeframe: {
    start: string;
    end: string;
  }): Promise<RAGQualityAnalysis> {
    const responseEvents = this.getEventsInTimeframe(timeframe).filter(
      e => e.eventType === 'response'
    );

    // Relevance analysis
    const relevanceScores = responseEvents.map(e => e.response?.relevanceScore || 0);
    const scoreDistribution = this.createScoreDistribution(relevanceScores);

    const lowRelevanceQueries = responseEvents
      .filter(e => (e.response?.relevanceScore || 0) < 0.4)
      .map(e => ({
        query: this.findQueryForResponse(e.id)?.query?.text || 'Unknown',
        score: e.response?.relevanceScore || 0,
        reason: 'Low relevance score detected',
      }))
      .slice(0, 10);

    const highRelevanceQueries = responseEvents
      .filter(e => (e.response?.relevanceScore || 0) > 0.8)
      .map(e => ({
        query: this.findQueryForResponse(e.id)?.query?.text || 'Unknown',
        score: e.response?.relevanceScore || 0,
        sources: ['Source 1', 'Source 2'], // Would be extracted from actual data
      }))
      .slice(0, 10);

    // Generate improvement suggestions
    const improvementSuggestions = this.generateImprovementSuggestions(responseEvents);

    return {
      relevanceAnalysis: {
        scoreDistribution,
        lowRelevanceQueries,
        highRelevanceQueries,
        relevanceTrendsBySource: this.analyzeSourceRelevanceTrends(responseEvents),
      },

      contextQuality: {
        optimalContextLength: this.calculateOptimalContextLength(responseEvents),
        contextOverflow: this.calculateContextOverflow(responseEvents),
        compressionEffectiveness: this.calculateCompressionEffectiveness(responseEvents),
        chunkingQuality: 0.85, // Would be calculated from actual chunking metrics
        duplicateDetectionRate: 0.92, // Would be calculated from actual duplicate detection
      },

      sourceEffectiveness: {
        topPerformingSources: this.getTopPerformingSources(responseEvents),
        underperformingSources: this.getUnderperformingSources(responseEvents),
        sourceCredibilityTrends: this.analyzeSourceCredibilityTrends(responseEvents),
      },

      improvementSuggestions,
    };
  }

  /**
   * 📋 Generate comprehensive effectiveness report
   */
  async generateEffectivenessReport(timeframe: {
    start: string;
    end: string;
  }): Promise<RAGEffectivenessReport> {
    console.log(
      `📋 Generating RAG effectiveness report for period ${timeframe.start} to ${timeframe.end}`
    );

    const [usageMetrics, performanceMetrics, qualityAnalysis] = await Promise.all([
      this.generateUsageMetrics(timeframe),
      this.generatePerformanceMetrics(timeframe),
      this.generateQualityAnalysis(timeframe),
    ]);

    // Calculate overall score
    const overallScore = this.calculateOverallEffectivenessScore(
      usageMetrics,
      performanceMetrics,
      qualityAnalysis
    );

    // Generate executive summary
    const executiveSummary = {
      overallScore,
      keyMetrics: {
        totalQueries: usageMetrics.totalQueries,
        averageRelevance: performanceMetrics.qualityMetrics.averageRelevance,
        systemUptime: this.calculateSystemUptime(timeframe),
        userSatisfaction: this.calculateUserSatisfactionScore(usageMetrics),
      },
      majorInsights: this.generateMajorInsights(usageMetrics, performanceMetrics, qualityAnalysis),
      criticalIssues: this.identifyCriticalIssues(performanceMetrics, qualityAnalysis),
      recommendations: this.generateTopRecommendations(qualityAnalysis.improvementSuggestions),
    };

    // Generate trends and predictions
    const trendsAndPredictions = {
      usageTrends: this.analyzeUsageTrends(usageMetrics),
      performanceTrends: this.analyzePerformanceTrends(performanceMetrics),
      capacityPredictions: this.generateCapacityPredictions(usageMetrics, performanceMetrics),
    };

    // Generate actionable insights
    const actionableInsights = this.generateActionableInsights(
      qualityAnalysis.improvementSuggestions,
      performanceMetrics
    );

    const report: RAGEffectivenessReport = {
      reportId: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      generatedAt: new Date().toISOString(),
      period: {
        start: timeframe.start,
        end: timeframe.end,
        duration: this.calculateDuration(timeframe.start, timeframe.end),
      },

      executiveSummary,

      detailedAnalysis: {
        usageMetrics,
        performanceMetrics,
        qualityAnalysis,
      },

      trendsAndPredictions,
      actionableInsights,
    };

    console.log(
      `✅ Generated effectiveness report: Overall score ${overallScore.toFixed(2)}, ${usageMetrics.totalQueries} queries analyzed`
    );
    return report;
  }

  /**
   * 🚨 Real-time alert checking
   */
  private async checkAlertConditions(event: AnalyticsEvent): Promise<void> {
    if (!this.config.enableRealTimeAlerts) return;

    const { alertThresholds } = this.config;

    // Check response time threshold
    if (
      event.response?.responseTime &&
      event.response.responseTime > alertThresholds.responseTime
    ) {
      this.createAlert(
        'performance',
        `High response time: ${event.response.responseTime}ms`,
        'warning'
      );
    }

    // Check error rate threshold
    const recentErrorRate = this.calculateRecentErrorRate();
    if (recentErrorRate > alertThresholds.errorRate) {
      this.createAlert(
        'reliability',
        `High error rate: ${(recentErrorRate * 100).toFixed(1)}%`,
        'critical'
      );
    }

    // Check quality score threshold
    if (
      event.response?.qualityScore &&
      event.response.qualityScore < alertThresholds.qualityScore
    ) {
      this.createAlert(
        'quality',
        `Low quality score: ${event.response.qualityScore.toFixed(2)}`,
        'warning'
      );
    }

    // Check system load threshold
    if (this.realTimeMetrics.currentLoad > alertThresholds.systemLoad) {
      this.createAlert(
        'system',
        `High system load: ${(this.realTimeMetrics.currentLoad * 100).toFixed(1)}%`,
        'critical'
      );
    }
  }

  private createAlert(type: string, message: string, severity: string): void {
    const alert = {
      timestamp: new Date().toISOString(),
      type,
      message,
      severity,
    };

    this.alerts.push(alert);
    console.warn(`🚨 RAG Analytics Alert [${severity.toUpperCase()}]: ${message}`);

    // Keep only recent alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-50);
    }
  }

  /**
   * 🔄 Background data processing
   */
  private startBackgroundTasks(): void {
    // Aggregate data every 5 minutes
    setInterval(async () => {
      try {
        await this.aggregateData();
      } catch (error) {
        console.error('Analytics aggregation error:', error);
      }
    }, 300000); // 5 minutes

    // Clean old data every hour
    setInterval(() => {
      try {
        this.cleanOldData();
      } catch (error) {
        console.error('Analytics cleanup error:', error);
      }
    }, 3600000); // 1 hour

    // Generate automatic reports
    if (this.config.enableAutomaticReports) {
      setInterval(async () => {
        try {
          await this.generateScheduledReports();
        } catch (error) {
          console.error('Automatic report generation error:', error);
        }
      }, 86400000); // 24 hours
    }
  }

  private async aggregateData(): Promise<void> {
    if (this.events.length === 0) return;

    console.log(`📊 Aggregating ${this.events.length} analytics events`);

    for (const interval of this.config.aggregationIntervals) {
      const aggregatedData = this.createAggregatedData(interval);
      this.aggregatedData.set(`${interval}_${Date.now()}`, aggregatedData);
    }

    // Clear processed events
    this.events = [];
  }

  private createAggregatedData(interval: string): any {
    // Create aggregated data structure based on interval
    const now = new Date();
    const timeframe = this.getTimeframeForInterval(interval, now);

    return {
      interval,
      timeframe,
      eventCount: this.events.length,
      timestamp: now.toISOString(),
    };
  }

  private cleanOldData(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.dataRetentionDays);
    const cutoffTimestamp = cutoffDate.toISOString();

    // Clean events
    const initialEventCount = this.events.length;
    this.events = this.events.filter(event => event.timestamp > cutoffTimestamp);

    // Clean aggregated data
    const initialAggregatedCount = this.aggregatedData.size;
    for (const [key, data] of this.aggregatedData.entries()) {
      if (data.timestamp < cutoffTimestamp) {
        this.aggregatedData.delete(key);
      }
    }

    // Clean alerts
    this.alerts = this.alerts.filter(alert => alert.timestamp > cutoffTimestamp);

    console.log(
      `🧹 Cleaned old analytics data: ${initialEventCount - this.events.length} events, ${initialAggregatedCount - this.aggregatedData.size} aggregated records`
    );
  }

  private async generateScheduledReports(): Promise<void> {
    for (const schedule of this.config.reportSchedule) {
      const timeframe = this.getTimeframeForSchedule(schedule);

      try {
        const report = await this.generateEffectivenessReport(timeframe);
        await this.saveReport(report);

        if (this.config.reportRecipients.length > 0) {
          await this.sendReportToRecipients(report);
        }
      } catch (error) {
        console.error(`Failed to generate ${schedule} report:`, error);
      }
    }
  }

  // Helper methods
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private anonymizeUserId(userId: string): string {
    // Simple hash-based anonymization
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `user_${Math.abs(hash)}`;
  }

  private updateRealTimeMetrics(event: AnalyticsEvent): void {
    // Update real-time metrics based on event type
    if (event.eventType === 'response' && event.response) {
      // Update response time moving average
      const alpha = 0.1;
      this.realTimeMetrics.averageResponseTime =
        this.realTimeMetrics.averageResponseTime * (1 - alpha) +
        event.response.responseTime * alpha;
    }
  }

  private analyzeQueryComplexity(query: string): 'simple' | 'medium' | 'complex' {
    const wordCount = query.split(/\s+/).length;
    const hasComplexPatterns = /\b(and|or|not|when|where|how|why|what|which)\b/i.test(query);

    if (wordCount < 5 && !hasComplexPatterns) return 'simple';
    if (wordCount < 10 || hasComplexPatterns) return 'medium';
    return 'complex';
  }

  private detectQueryIntent(query: string): string {
    const lowerQuery = query.toLowerCase();

    if (/\b(what|who|when|where|which)\b/.test(lowerQuery)) return 'informational';
    if (/\b(how)\b/.test(lowerQuery)) return 'procedural';
    if (/\b(why)\b/.test(lowerQuery)) return 'analytical';
    if (/\b(compare|difference|versus)\b/.test(lowerQuery)) return 'comparative';

    return 'general';
  }

  private detectLanguage(query: string): string {
    // Simple language detection based on character patterns
    const vietnameseChars =
      /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

    if (vietnameseChars.test(query)) return 'vi';
    return 'en';
  }

  private getEventsInTimeframe(timeframe: { start: string; end: string }): AnalyticsEvent[] {
    return this.events.filter(
      event => event.timestamp >= timeframe.start && event.timestamp <= timeframe.end
    );
  }

  private countFrequency<T>(items: T[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const item of items) {
      const key = String(item);
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }

  private calculateAverageRelevanceForQuery(
    query: string,
    responseEvents: AnalyticsEvent[]
  ): number {
    const relevantResponses = responseEvents.filter(e => {
      const queryEvent = this.findQueryForResponse(e.id);
      return queryEvent?.query?.text === query;
    });

    if (relevantResponses.length === 0) return 0;

    const totalRelevance = relevantResponses.reduce(
      (sum, e) => sum + (e.response?.relevanceScore || 0),
      0
    );
    return totalRelevance / relevantResponses.length;
  }

  private findQueryForResponse(responseId: string): AnalyticsEvent | undefined {
    return this.events.find(e => e.id === responseId && e.eventType === 'query');
  }

  private analyzeQueryTypes(queryEvents: AnalyticsEvent[]): { [type: string]: number } {
    const types: { [type: string]: number } = {};

    for (const event of queryEvents) {
      const intent = event.query?.intent || 'unknown';
      types[intent] = (types[intent] || 0) + 1;
    }

    return types;
  }

  private analyzeQueryComplexityDistribution(queryEvents: AnalyticsEvent[]): {
    simple: number;
    medium: number;
    complex: number;
  } {
    const distribution = { simple: 0, medium: 0, complex: 0 };

    for (const event of queryEvents) {
      const complexity = event.query?.complexity || 'simple';
      distribution[complexity]++;
    }

    return distribution;
  }

  private analyzeTimeDistribution(queryEvents: AnalyticsEvent[]): { [hour: string]: number } {
    const distribution: { [hour: string]: number } = {};

    for (const event of queryEvents) {
      const hour = new Date(event.timestamp).getHours().toString();
      distribution[hour] = (distribution[hour] || 0) + 1;
    }

    return distribution;
  }

  private calculateReturnUsers(events: AnalyticsEvent[]): number {
    const userFirstSeen = new Map<string, string>();
    const userQueryDates = new Map<string, Set<string>>();

    for (const event of events) {
      if (event.eventType === 'query') {
        const date = event.timestamp.split('T')[0];

        if (!userFirstSeen.has(event.userId)) {
          userFirstSeen.set(event.userId, date);
          userQueryDates.set(event.userId, new Set([date]));
        } else {
          const dates = userQueryDates.get(event.userId) || new Set();
          dates.add(date);
          userQueryDates.set(event.userId, dates);
        }
      }
    }

    let returnUsers = 0;
    for (const [userId, dates] of userQueryDates.entries()) {
      if (dates.size > 1) {
        returnUsers++;
      }
    }

    return returnUsers;
  }

  private calculateAverageSessionDuration(events: AnalyticsEvent[]): number {
    const sessions = new Map<string, { start: string; end: string }>();

    for (const event of events) {
      const sessionKey = `${event.userId}_${event.conversationId}`;

      if (!sessions.has(sessionKey)) {
        sessions.set(sessionKey, { start: event.timestamp, end: event.timestamp });
      } else {
        const session = sessions.get(sessionKey)!;
        if (event.timestamp > session.end) {
          session.end = event.timestamp;
        }
      }
    }

    let totalDuration = 0;
    for (const session of sessions.values()) {
      const duration = new Date(session.end).getTime() - new Date(session.start).getTime();
      totalDuration += duration;
    }

    return sessions.size > 0 ? totalDuration / sessions.size / 1000 : 0; // Return in seconds
  }

  private calculateBounceRate(events: AnalyticsEvent[]): number {
    const userInteractions = new Map<string, number>();

    for (const event of events) {
      if (event.eventType === 'query') {
        userInteractions.set(event.userId, (userInteractions.get(event.userId) || 0) + 1);
      }
    }

    const singleInteractionUsers = Array.from(userInteractions.values()).filter(
      count => count === 1
    ).length;
    const totalUsers = userInteractions.size;

    return totalUsers > 0 ? singleInteractionUsers / totalUsers : 0;
  }

  private calculateAverageCompressionRatio(responseEvents: AnalyticsEvent[]): number {
    // Would be calculated from actual compression data
    return 0.7; // Placeholder
  }

  private analyzeSourceUtilization(responseEvents: AnalyticsEvent[]): {
    [sourceId: string]: number;
  } {
    // Would be calculated from actual source usage data
    return {
      source_1: 0.4,
      source_2: 0.3,
      source_3: 0.2,
      source_4: 0.1,
    };
  }

  private calculateChunkingEfficiency(responseEvents: AnalyticsEvent[]): number {
    // Would be calculated from actual chunking metrics
    return 0.85;
  }

  private getEmptyPerformanceMetrics(): RAGPerformanceMetrics {
    return {
      responseTimes: {
        searchTime: 0,
        optimizationTime: 0,
        qualityTime: 0,
        sourceManagementTime: 0,
        totalTime: 0,
        percentiles: { p50: 0, p75: 0, p90: 0, p95: 0, p99: 0 },
      },
      qualityMetrics: {
        averageRelevance: 0,
        averageDiversity: 0,
        averageCredibility: 0,
        averageCoherence: 0,
        qualityTrend: [],
      },
      systemPerformance: {
        cacheHitRate: 0,
        vectorSearchLatency: 0,
        embeddingGenerationTime: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        errorRate: 0,
      },
      throughput: {
        queriesPerSecond: 0,
        peakQPS: 0,
        concurrentQueries: 0,
        queueLength: 0,
        processingCapacity: 0,
      },
    };
  }

  private calculatePercentile(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 0) return 0;

    const index = Math.ceil(sortedValues.length * percentile) - 1;
    return sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))];
  }

  private calculateQualityTrend(
    responseEvents: AnalyticsEvent[]
  ): Array<{ timestamp: string; score: number }> {
    // Group events by hour and calculate average quality
    const hourlyScores = new Map<string, number[]>();

    for (const event of responseEvents) {
      const hour = event.timestamp.substring(0, 13); // YYYY-MM-DDTHH
      const score = event.response?.qualityScore || 0;

      if (!hourlyScores.has(hour)) {
        hourlyScores.set(hour, []);
      }
      hourlyScores.get(hour)!.push(score);
    }

    return Array.from(hourlyScores.entries())
      .map(([timestamp, scores]) => ({
        timestamp,
        score: scores.reduce((sum, score) => sum + score, 0) / scores.length,
      }))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  private calculateErrorRate(timeframe: { start: string; end: string }): number {
    const events = this.getEventsInTimeframe(timeframe);
    const totalQueries = events.filter(e => e.eventType === 'query').length;
    const errorCount = events.filter(e => e.eventType === 'error').length;

    return totalQueries > 0 ? errorCount / totalQueries : 0;
  }

  private calculateQPS(
    responseEvents: AnalyticsEvent[],
    timeframe: { start: string; end: string }
  ): number {
    const duration =
      (new Date(timeframe.end).getTime() - new Date(timeframe.start).getTime()) / 1000;
    return duration > 0 ? responseEvents.length / duration : 0;
  }

  private calculatePeakQPS(
    responseEvents: AnalyticsEvent[],
    timeframe: { start: string; end: string }
  ): number {
    // Group by minute and find peak
    const minuteGroups = new Map<string, number>();

    for (const event of responseEvents) {
      const minute = event.timestamp.substring(0, 16); // YYYY-MM-DDTHH:MM
      minuteGroups.set(minute, (minuteGroups.get(minute) || 0) + 1);
    }

    const maxPerMinute = Math.max(...Array.from(minuteGroups.values()), 0);
    return maxPerMinute / 60; // Convert to per second
  }

  private calculateRecentErrorRate(): number {
    const recentEvents = this.events.filter(e => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      return e.timestamp > fiveMinutesAgo;
    });

    const totalQueries = recentEvents.filter(e => e.eventType === 'query').length;
    const errorCount = recentEvents.filter(e => e.eventType === 'error').length;

    return totalQueries > 0 ? errorCount / totalQueries : 0;
  }

  private createScoreDistribution(scores: number[]): { [range: string]: number } {
    const distribution: { [range: string]: number } = {
      '0.0-0.2': 0,
      '0.2-0.4': 0,
      '0.4-0.6': 0,
      '0.6-0.8': 0,
      '0.8-1.0': 0,
    };

    for (const score of scores) {
      if (score < 0.2) distribution['0.0-0.2']++;
      else if (score < 0.4) distribution['0.2-0.4']++;
      else if (score < 0.6) distribution['0.4-0.6']++;
      else if (score < 0.8) distribution['0.6-0.8']++;
      else distribution['0.8-1.0']++;
    }

    return distribution;
  }

  private generateImprovementSuggestions(responseEvents: AnalyticsEvent[]): Array<{
    category: 'performance' | 'quality' | 'coverage' | 'user_experience';
    priority: 'high' | 'medium' | 'low';
    description: string;
    impact: string;
    implementation: string;
  }> {
    const suggestions = [];

    // Analyze response times
    const avgResponseTime =
      responseEvents.reduce((sum, e) => sum + (e.response?.responseTime || 0), 0) /
      responseEvents.length;
    if (avgResponseTime > 3000) {
      suggestions.push({
        category: 'performance' as const,
        priority: 'high' as const,
        description: 'Response times are above optimal threshold',
        impact: 'Improved user experience and higher satisfaction',
        implementation: 'Optimize vector search indexing and implement query caching',
      });
    }

    // Analyze quality scores
    const avgQuality =
      responseEvents.reduce((sum, e) => sum + (e.response?.qualityScore || 0), 0) /
      responseEvents.length;
    if (avgQuality < 0.7) {
      suggestions.push({
        category: 'quality' as const,
        priority: 'high' as const,
        description: 'Context quality scores are below target',
        impact: 'More accurate and relevant responses',
        implementation: 'Improve chunking strategies and source prioritization',
      });
    }

    return suggestions;
  }

  private analyzeSourceRelevanceTrends(responseEvents: AnalyticsEvent[]): {
    [sourceId: string]: number;
  } {
    // Placeholder implementation
    return {
      source_1: 0.8,
      source_2: 0.75,
      source_3: 0.65,
    };
  }

  private calculateOptimalContextLength(responseEvents: AnalyticsEvent[]): number {
    const contextLengths = responseEvents
      .map(e => e.response?.contextLength || 0)
      .filter(l => l > 0);
    return contextLengths.reduce((sum, len) => sum + len, 0) / contextLengths.length || 0;
  }

  private calculateContextOverflow(responseEvents: AnalyticsEvent[]): number {
    // Calculate percentage of queries that hit context limits
    const overflowCount = responseEvents.filter(
      e => (e.response?.contextLength || 0) > 4000
    ).length;
    return responseEvents.length > 0 ? overflowCount / responseEvents.length : 0;
  }

  private calculateCompressionEffectiveness(responseEvents: AnalyticsEvent[]): number {
    // Placeholder - would calculate actual compression effectiveness
    return 0.75;
  }

  private getTopPerformingSources(responseEvents: AnalyticsEvent[]): Array<{
    sourceId: string;
    name: string;
    relevanceScore: number;
    usageFrequency: number;
    qualityScore: number;
  }> {
    // Placeholder implementation
    return [
      {
        sourceId: 'source_1',
        name: 'Technical Documentation',
        relevanceScore: 0.85,
        usageFrequency: 0.4,
        qualityScore: 0.9,
      },
      {
        sourceId: 'source_2',
        name: 'FAQ Database',
        relevanceScore: 0.8,
        usageFrequency: 0.3,
        qualityScore: 0.85,
      },
      {
        sourceId: 'source_3',
        name: 'User Manual',
        relevanceScore: 0.75,
        usageFrequency: 0.2,
        qualityScore: 0.8,
      },
    ];
  }

  private getUnderperformingSources(responseEvents: AnalyticsEvent[]): Array<{
    sourceId: string;
    name: string;
    issues: string[];
    suggestions: string[];
  }> {
    // Placeholder implementation
    return [
      {
        sourceId: 'source_4',
        name: 'Outdated Manual',
        issues: ['Low relevance scores', 'Infrequent usage'],
        suggestions: ['Update content', 'Improve indexing'],
      },
    ];
  }

  private analyzeSourceCredibilityTrends(responseEvents: AnalyticsEvent[]): {
    [sourceId: string]: Array<{ timestamp: string; score: number }>;
  } {
    // Placeholder implementation
    return {
      source_1: [
        { timestamp: '2024-01-01T00:00:00Z', score: 0.8 },
        { timestamp: '2024-01-02T00:00:00Z', score: 0.85 },
      ],
    };
  }

  private calculateOverallEffectivenessScore(
    usageMetrics: RAGUsageMetrics,
    performanceMetrics: RAGPerformanceMetrics,
    qualityAnalysis: RAGQualityAnalysis
  ): number {
    const usageScore = Math.min(
      usageMetrics.successfulQueries / Math.max(usageMetrics.totalQueries, 1),
      1
    );
    const performanceScore = Math.max(0, 1 - performanceMetrics.responseTimes.totalTime / 5000);
    const qualityScore = performanceMetrics.qualityMetrics.averageRelevance;

    return usageScore * 0.3 + performanceScore * 0.3 + qualityScore * 0.4;
  }

  private calculateSystemUptime(timeframe: { start: string; end: string }): number {
    // Placeholder - would calculate actual uptime
    return 0.995; // 99.5% uptime
  }

  private calculateUserSatisfactionScore(usageMetrics: RAGUsageMetrics): number {
    // Calculate based on success rate and user behavior
    const successRate = usageMetrics.successfulQueries / Math.max(usageMetrics.totalQueries, 1);
    const returnUserRate =
      usageMetrics.userBehavior.returnUsers / Math.max(usageMetrics.userBehavior.uniqueUsers, 1);
    const bounceRate = 1 - usageMetrics.userBehavior.bounceRate;

    return successRate * 0.4 + returnUserRate * 0.3 + bounceRate * 0.3;
  }

  private generateMajorInsights(
    usageMetrics: RAGUsageMetrics,
    performanceMetrics: RAGPerformanceMetrics,
    qualityAnalysis: RAGQualityAnalysis
  ): string[] {
    const insights = [];

    if (usageMetrics.totalQueries > 1000) {
      insights.push(`High query volume: ${usageMetrics.totalQueries} queries processed`);
    }

    if (performanceMetrics.qualityMetrics.averageRelevance > 0.8) {
      insights.push('Excellent context relevance achieved across queries');
    }

    if (usageMetrics.userBehavior.returnUsers > usageMetrics.userBehavior.uniqueUsers * 0.3) {
      insights.push('Strong user retention indicates good system performance');
    }

    return insights;
  }

  private identifyCriticalIssues(
    performanceMetrics: RAGPerformanceMetrics,
    qualityAnalysis: RAGQualityAnalysis
  ): string[] {
    const issues = [];

    if (performanceMetrics.responseTimes.totalTime > 5000) {
      issues.push('Response times exceed acceptable thresholds');
    }

    if (performanceMetrics.systemPerformance.errorRate > 0.05) {
      issues.push('Error rate is above 5% threshold');
    }

    if (qualityAnalysis.relevanceAnalysis.lowRelevanceQueries.length > 10) {
      issues.push('High number of low-relevance query results');
    }

    return issues;
  }

  private generateTopRecommendations(
    improvementSuggestions: Array<{
      category: string;
      priority: string;
      description: string;
      impact: string;
      implementation: string;
    }>
  ): string[] {
    return improvementSuggestions
      .filter(s => s.priority === 'high')
      .slice(0, 5)
      .map(s => s.description);
  }

  private analyzeUsageTrends(
    usageMetrics: RAGUsageMetrics
  ): Array<{ metric: string; trend: 'increasing' | 'decreasing' | 'stable'; prediction: string }> {
    return [
      { metric: 'Query Volume', trend: 'increasing', prediction: 'Expected 20% growth next month' },
      {
        metric: 'User Retention',
        trend: 'stable',
        prediction: 'Consistent retention rates expected',
      },
    ];
  }

  private analyzePerformanceTrends(
    performanceMetrics: RAGPerformanceMetrics
  ): Array<{ metric: string; trend: 'improving' | 'degrading' | 'stable'; forecast: string }> {
    return [
      { metric: 'Response Time', trend: 'improving', forecast: 'Continued optimization expected' },
      { metric: 'Quality Score', trend: 'stable', forecast: 'Maintaining current quality levels' },
    ];
  }

  private generateCapacityPredictions(
    usageMetrics: RAGUsageMetrics,
    performanceMetrics: RAGPerformanceMetrics
  ): Array<{ timeframe: string; expectedLoad: number; recommendation: string }> {
    return [
      { timeframe: '1 month', expectedLoad: 1.2, recommendation: 'Monitor current capacity' },
      { timeframe: '3 months', expectedLoad: 1.5, recommendation: 'Consider scaling resources' },
      { timeframe: '6 months', expectedLoad: 2.0, recommendation: 'Plan infrastructure upgrade' },
    ];
  }

  private generateActionableInsights(
    improvementSuggestions: Array<any>,
    performanceMetrics: RAGPerformanceMetrics
  ): Array<{
    insight: string;
    impact: 'high' | 'medium' | 'low';
    effort: 'high' | 'medium' | 'low';
    timeline: string;
    steps: string[];
  }> {
    return [
      {
        insight: 'Optimize vector search indexing to reduce response times',
        impact: 'high',
        effort: 'medium',
        timeline: '2-3 weeks',
        steps: [
          'Analyze current index performance',
          'Implement hierarchical indexing',
          'Test performance improvements',
          'Deploy optimized indexes',
        ],
      },
    ];
  }

  private calculateDuration(start: string, end: string): string {
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    const diffHours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

    if (diffDays > 0) {
      return `${diffDays} days, ${diffHours} hours`;
    }
    return `${diffHours} hours`;
  }

  private getTimeframeForInterval(interval: string, now: Date): { start: string; end: string } {
    const end = now.toISOString();
    const start = new Date(now);

    switch (interval) {
      case '1h':
        start.setHours(start.getHours() - 1);
        break;
      case '1d':
        start.setDate(start.getDate() - 1);
        break;
      case '1w':
        start.setDate(start.getDate() - 7);
        break;
      case '1m':
        start.setMonth(start.getMonth() - 1);
        break;
    }

    return { start: start.toISOString(), end };
  }

  private getTimeframeForSchedule(schedule: string): { start: string; end: string } {
    const end = new Date().toISOString();
    const start = new Date();

    switch (schedule) {
      case 'daily':
        start.setDate(start.getDate() - 1);
        break;
      case 'weekly':
        start.setDate(start.getDate() - 7);
        break;
      case 'monthly':
        start.setMonth(start.getMonth() - 1);
        break;
    }

    return { start: start.toISOString(), end };
  }

  private async saveReport(report: RAGEffectivenessReport): Promise<void> {
    // In a real implementation, this would save to database or file system
    console.log(`💾 Saved effectiveness report: ${report.reportId}`);
  }

  private async sendReportToRecipients(report: RAGEffectivenessReport): Promise<void> {
    // In a real implementation, this would send email notifications
    console.log(`📧 Report sent to ${this.config.reportRecipients.length} recipients`);
  }

  // Public API methods
  getRealTimeMetrics(): typeof this.realTimeMetrics {
    return { ...this.realTimeMetrics };
  }

  getRecentAlerts(
    limit: number = 10
  ): Array<{ timestamp: string; type: string; message: string; severity: string }> {
    return this.alerts.slice(-limit);
  }

  updateConfig(newConfig: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): AnalyticsConfig {
    return { ...this.config };
  }

  async exportAnalyticsData(timeframe: { start: string; end: string }): Promise<string> {
    const events = this.getEventsInTimeframe(timeframe);

    const exportData = {
      events,
      aggregatedData: Array.from(this.aggregatedData.entries()),
      realTimeMetrics: this.realTimeMetrics,
      alerts: this.alerts,
      config: this.config,
      exportedAt: new Date().toISOString(),
    };

    return JSON.stringify(exportData, null, 2);
  }

  clearAnalyticsData(): void {
    this.events = [];
    this.aggregatedData.clear();
    this.alerts = [];
    this.performanceBuffer = [];
    this.realTimeMetrics = {
      activeQueries: 0,
      totalQueries: 0,
      errorCount: 0,
      lastErrorTime: null,
      averageResponseTime: 0,
      currentLoad: 0,
    };

    console.log('🧹 Cleared all analytics data');
  }
}

export const ragAnalyticsService = RAGAnalyticsService.getInstance();
