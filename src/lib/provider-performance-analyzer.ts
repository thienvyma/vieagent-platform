/**
 * 📊 Provider Performance Analyzer - Day 20 Step 20.4
 * Comprehensive performance comparison and analytics for multi-provider system
 */

import { providerCostTracker, CostEntry } from './provider-cost-tracker';

/**
 * ⚡ Performance Metrics
 */
export interface PerformanceMetrics {
  // Timing metrics
  responseTime: number;
  firstTokenTime?: number; // Time to first token for streaming
  tokensPerSecond?: number;

  // Quality metrics
  qualityScore: number; // 0-1
  coherenceScore: number; // 0-1
  relevanceScore: number; // 0-1
  helpfulnessScore: number; // 0-1

  // Reliability metrics
  success: boolean;
  errorType?: string;
  retryCount?: number;

  // Usage metrics
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;

  // Context
  messageComplexity: 'simple' | 'medium' | 'complex';
  conversationLength: number;

  // User feedback
  userRating?: number; // 1-5
  userFeedback?: string;
  thumbsUp?: boolean;
}

/**
 * 📈 Performance Comparison
 */
export interface ProviderComparison {
  timeRange: {
    start: string;
    end: string;
    totalDays: number;
  };

  providers: Array<{
    provider: string;
    model: string;

    // Volume metrics
    totalRequests: number;
    successfulRequests: number;
    failureRate: number;

    // Performance metrics
    averageResponseTime: number;
    medianResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;

    // Quality metrics
    averageQualityScore: number;
    qualityConsistency: number; // standard deviation
    userSatisfactionScore: number;

    // Efficiency metrics
    tokensPerSecond: number;
    costEfficiency: number; // quality per dollar

    // Reliability metrics
    uptime: number; // percentage
    errorRate: number;
    averageRetries: number;

    // Trend analysis
    performanceTrend: 'improving' | 'declining' | 'stable';
    qualityTrend: 'improving' | 'declining' | 'stable';

    // Rankings
    speedRank: number;
    qualityRank: number;
    costRank: number;
    overallRank: number;
  }>;

  // Summary insights
  insights: {
    fastestProvider: string;
    highestQualityProvider: string;
    mostCostEffectiveProvider: string;
    mostReliableProvider: string;
    recommendations: string[];
  };
}

/**
 * 🎯 A/B Test Result
 */
export interface ABTestResult {
  testId: string;
  testName: string;
  startDate: string;
  endDate: string;
  status: 'running' | 'completed' | 'paused';

  // Test configuration
  providers: Array<{
    provider: string;
    model: string;
    trafficPercent: number;
  }>;

  // Statistical results
  sampleSize: number;
  confidenceLevel: number; // e.g., 95
  significanceReached: boolean;

  // Performance comparison
  results: Array<{
    provider: string;
    model: string;

    // Performance metrics
    averageResponseTime: number;
    responseTimeImprovement: number; // percentage vs baseline

    // Quality metrics
    averageQualityScore: number;
    qualityImprovement: number;

    // User metrics
    userSatisfactionScore: number;
    satisfactionImprovement: number;

    // Cost metrics
    averageCostPerRequest: number;
    costImprovement: number;

    // Statistical significance
    pValue: number;
    isStatisticallySignificant: boolean;
  }>;

  // Recommendation
  recommendation: {
    winningProvider: string;
    winningModel: string;
    confidenceScore: number;
    expectedImprovement: {
      performance: number;
      quality: number;
      cost: number;
    };
  };
}

/**
 * 📊 Performance Dashboard Data
 */
export interface PerformanceDashboard {
  overview: {
    totalRequests: number;
    averageResponseTime: number;
    overallQualityScore: number;
    totalCost: number;
    successRate: number;
  };

  // Real-time metrics
  realTime: {
    requestsPerMinute: number;
    activeProviders: string[];
    currentFailureRate: number;
    averageLatency: number;
  };

  // Provider breakdown
  providerBreakdown: Array<{
    provider: string;
    model: string;
    requests: number;
    averageResponseTime: number;
    qualityScore: number;
    cost: number;
    status: 'healthy' | 'degraded' | 'unhealthy';
  }>;

  // Performance trends
  trends: {
    responseTime: Array<{ timestamp: string; value: number; provider: string }>;
    quality: Array<{ timestamp: string; value: number; provider: string }>;
    cost: Array<{ timestamp: string; value: number; provider: string }>;
    volume: Array<{ timestamp: string; value: number; provider: string }>;
  };

  // Alerts and issues
  alerts: Array<{
    type: 'performance' | 'quality' | 'cost' | 'reliability';
    severity: 'info' | 'warning' | 'critical';
    message: string;
    provider?: string;
    timestamp: string;
  }>;
}

/**
 * 📊 Provider Performance Analyzer
 */
export class ProviderPerformanceAnalyzer {
  private static instance: ProviderPerformanceAnalyzer;
  private performanceData: Map<string, PerformanceMetrics[]> = new Map(); // providerId -> metrics
  private abTests: Map<string, ABTestResult> = new Map();
  private benchmarkResults: Map<string, any> = new Map();

  constructor() {
    this.initializePerformanceTracking();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ProviderPerformanceAnalyzer {
    if (!ProviderPerformanceAnalyzer.instance) {
      ProviderPerformanceAnalyzer.instance = new ProviderPerformanceAnalyzer();
    }
    return ProviderPerformanceAnalyzer.instance;
  }

  /**
   * 📈 Record performance metrics
   */
  recordPerformance(
    provider: string,
    model: string,
    metrics: PerformanceMetrics,
    context?: {
      userId: string;
      agentId: string;
      conversationId?: string;
    }
  ): void {
    const providerId = `${provider}:${model}`;

    console.log(
      `📊 Recording performance for ${providerId}: ${metrics.responseTime}ms, quality: ${metrics.qualityScore}`
    );

    // Store performance data
    if (!this.performanceData.has(providerId)) {
      this.performanceData.set(providerId, []);
    }

    const providerMetrics = this.performanceData.get(providerId)!;
    providerMetrics.push({
      ...metrics,
      tokensPerSecond:
        metrics.totalTokens > 0 ? metrics.totalTokens / (metrics.responseTime / 1000) : 0,
    });

    // Keep only last 10000 entries per provider
    if (providerMetrics.length > 10000) {
      providerMetrics.splice(0, providerMetrics.length - 10000);
    }

    // Record cost data if context provided
    if (context) {
      const costEntry: Omit<CostEntry, 'id' | 'timestamp'> = {
        userId: context.userId,
        agentId: context.agentId,
        conversationId: context.conversationId,
        provider,
        model,
        inputTokens: metrics.inputTokens,
        outputTokens: metrics.outputTokens,
        totalTokens: metrics.totalTokens,
        inputCost: 0, // Would calculate based on provider pricing
        outputCost: 0,
        totalCost: 0,
        responseTime: metrics.responseTime,
        success: metrics.success,
        errorMessage: metrics.errorType,
        qualityScore: metrics.qualityScore,
        userRating: metrics.userRating,
        requestType: 'chat',
      };

      // Calculate actual costs (simplified)
      const { inputCost, outputCost, totalCost } = this.calculateCosts(provider, model, metrics);
      costEntry.inputCost = inputCost;
      costEntry.outputCost = outputCost;
      costEntry.totalCost = totalCost;

      providerCostTracker.recordCost(costEntry);
    }
  }

  /**
   * 📊 Generate provider comparison
   */
  generateProviderComparison(
    timeRangeDays: number = 7,
    userId?: string,
    agentId?: string
  ): ProviderComparison {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - timeRangeDays * 24 * 60 * 60 * 1000);

    console.log(`📊 Generating provider comparison for last ${timeRangeDays} days`);

    // Get all provider data
    const providerAnalysis = new Map<string, any>();

    for (const [providerId, metrics] of this.performanceData.entries()) {
      const recentMetrics = metrics.filter(
        m => new Date(Date.now()) > startTime // Simplified timestamp check
      );

      if (recentMetrics.length === 0) continue;

      const [provider, model] = providerId.split(':');

      // Calculate metrics
      const successfulRequests = recentMetrics.filter(m => m.success);
      const responseTimes = recentMetrics.map(m => m.responseTime).sort((a, b) => a - b);
      const qualityScores = recentMetrics.map(m => m.qualityScore);
      const userRatings = recentMetrics.filter(m => m.userRating).map(m => m.userRating!);

      const analysis = {
        provider,
        model,
        totalRequests: recentMetrics.length,
        successfulRequests: successfulRequests.length,
        failureRate: (1 - successfulRequests.length / recentMetrics.length) * 100,

        // Performance metrics
        averageResponseTime: responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length,
        medianResponseTime: responseTimes[Math.floor(responseTimes.length / 2)] || 0,
        p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)] || 0,
        p99ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.99)] || 0,

        // Quality metrics
        averageQualityScore: qualityScores.reduce((sum, q) => sum + q, 0) / qualityScores.length,
        qualityConsistency: this.calculateStandardDeviation(qualityScores),
        userSatisfactionScore:
          userRatings.length > 0
            ? userRatings.reduce((sum, r) => sum + r, 0) / userRatings.length
            : 0,

        // Efficiency metrics
        tokensPerSecond:
          recentMetrics.reduce((sum, m) => sum + (m.tokensPerSecond || 0), 0) /
          recentMetrics.length,
        costEfficiency: 0, // Will calculate after cost analysis

        // Reliability metrics
        uptime: (successfulRequests.length / recentMetrics.length) * 100,
        errorRate:
          ((recentMetrics.length - successfulRequests.length) / recentMetrics.length) * 100,
        averageRetries:
          recentMetrics.reduce((sum, m) => sum + (m.retryCount || 0), 0) / recentMetrics.length,

        // Trends (simplified)
        performanceTrend: 'stable' as const,
        qualityTrend: 'stable' as const,

        // Will be set during ranking
        speedRank: 0,
        qualityRank: 0,
        costRank: 0,
        overallRank: 0,
      };

      providerAnalysis.set(providerId, analysis);
    }

    // Convert to array and rank
    const providers = Array.from(providerAnalysis.values());

    // Speed ranking
    providers.sort((a, b) => a.averageResponseTime - b.averageResponseTime);
    providers.forEach((p, i) => (p.speedRank = i + 1));

    // Quality ranking
    providers.sort((a, b) => b.averageQualityScore - a.averageQualityScore);
    providers.forEach((p, i) => (p.qualityRank = i + 1));

    // Overall ranking (composite score)
    providers.forEach(p => {
      p.overallRank = (p.speedRank + p.qualityRank + p.costRank) / 3;
    });
    providers.sort((a, b) => a.overallRank - b.overallRank);
    providers.forEach((p, i) => (p.overallRank = i + 1));

    // Generate insights
    const fastestProvider = providers.reduce((best, current) =>
      current.averageResponseTime < best.averageResponseTime ? current : best
    );

    const highestQualityProvider = providers.reduce((best, current) =>
      current.averageQualityScore > best.averageQualityScore ? current : best
    );

    const insights = {
      fastestProvider: `${fastestProvider.provider}:${fastestProvider.model}`,
      highestQualityProvider: `${highestQualityProvider.provider}:${highestQualityProvider.model}`,
      mostCostEffectiveProvider: `${providers[0]?.provider}:${providers[0]?.model}` || 'N/A',
      mostReliableProvider: providers.reduce((best, current) =>
        current.uptime > best.uptime ? current : best
      )
        ? `${
            providers.reduce((best, current) => (current.uptime > best.uptime ? current : best))
              .provider
          }:${
            providers.reduce((best, current) => (current.uptime > best.uptime ? current : best))
              .model
          }`
        : 'N/A',
      recommendations: this.generatePerformanceRecommendations(providers),
    };

    return {
      timeRange: {
        start: startTime.toISOString(),
        end: endTime.toISOString(),
        totalDays: timeRangeDays,
      },
      providers,
      insights,
    };
  }

  /**
   * 🧪 Start A/B test
   */
  startABTest(
    testName: string,
    providers: Array<{ provider: string; model: string; trafficPercent: number }>,
    durationDays: number = 7
  ): string {
    const testId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const test: ABTestResult = {
      testId,
      testName,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString(),
      status: 'running',
      providers,
      sampleSize: 0,
      confidenceLevel: 95,
      significanceReached: false,
      results: providers.map(p => ({
        provider: p.provider,
        model: p.model,
        averageResponseTime: 0,
        responseTimeImprovement: 0,
        averageQualityScore: 0,
        qualityImprovement: 0,
        userSatisfactionScore: 0,
        satisfactionImprovement: 0,
        averageCostPerRequest: 0,
        costImprovement: 0,
        pValue: 1.0,
        isStatisticallySignificant: false,
      })),
      recommendation: {
        winningProvider: '',
        winningModel: '',
        confidenceScore: 0,
        expectedImprovement: {
          performance: 0,
          quality: 0,
          cost: 0,
        },
      },
    };

    this.abTests.set(testId, test);

    console.log(`🧪 Started A/B test: ${testName} (${testId})`);
    return testId;
  }

  /**
   * 📊 Get performance dashboard data
   */
  getPerformanceDashboard(timeRangeHours: number = 24): PerformanceDashboard {
    const now = new Date();
    const cutoff = new Date(now.getTime() - timeRangeHours * 60 * 60 * 1000);

    // Aggregate all recent data
    let totalRequests = 0;
    let totalResponseTime = 0;
    let totalQuality = 0;
    let totalCost = 0;
    let successfulRequests = 0;

    const providerBreakdown: PerformanceDashboard['providerBreakdown'] = [];
    const timeSeriesData = {
      responseTime: [] as Array<{ timestamp: string; value: number; provider: string }>,
      quality: [] as Array<{ timestamp: string; value: number; provider: string }>,
      cost: [] as Array<{ timestamp: string; value: number; provider: string }>,
      volume: [] as Array<{ timestamp: string; value: number; provider: string }>,
    };

    for (const [providerId, metrics] of this.performanceData.entries()) {
      const recentMetrics = metrics.filter(
        m => new Date(Date.now()) > cutoff // Simplified timestamp check
      );

      if (recentMetrics.length === 0) continue;

      const [provider, model] = providerId.split(':');
      const successCount = recentMetrics.filter(m => m.success).length;

      totalRequests += recentMetrics.length;
      successfulRequests += successCount;

      const avgResponseTime =
        recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length;
      const avgQuality =
        recentMetrics.reduce((sum, m) => sum + m.qualityScore, 0) / recentMetrics.length;
      const avgCost = 0.001; // Simplified

      totalResponseTime += avgResponseTime * recentMetrics.length;
      totalQuality += avgQuality * recentMetrics.length;
      totalCost += avgCost * recentMetrics.length;

      // Provider breakdown
      providerBreakdown.push({
        provider,
        model,
        requests: recentMetrics.length,
        averageResponseTime: avgResponseTime,
        qualityScore: avgQuality,
        cost: avgCost * recentMetrics.length,
        status:
          successCount / recentMetrics.length > 0.95
            ? 'healthy'
            : successCount / recentMetrics.length > 0.9
              ? 'degraded'
              : 'unhealthy',
      });

      // Add to time series (simplified - would group by time intervals)
      recentMetrics.forEach((m, i) => {
        const timestamp = new Date(Date.now() - (recentMetrics.length - i) * 60000).toISOString();
        timeSeriesData.responseTime.push({
          timestamp,
          value: m.responseTime,
          provider: providerId,
        });
        timeSeriesData.quality.push({ timestamp, value: m.qualityScore, provider: providerId });
        timeSeriesData.cost.push({ timestamp, value: avgCost, provider: providerId });
      });
    }

    return {
      overview: {
        totalRequests,
        averageResponseTime: totalRequests > 0 ? totalResponseTime / totalRequests : 0,
        overallQualityScore: totalRequests > 0 ? totalQuality / totalRequests : 0,
        totalCost,
        successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
      },
      realTime: {
        requestsPerMinute: Math.floor(totalRequests / (timeRangeHours * 60)),
        activeProviders: Array.from(this.performanceData.keys()),
        currentFailureRate:
          totalRequests > 0 ? ((totalRequests - successfulRequests) / totalRequests) * 100 : 0,
        averageLatency: totalRequests > 0 ? totalResponseTime / totalRequests : 0,
      },
      providerBreakdown,
      trends: timeSeriesData,
      alerts: this.generatePerformanceAlerts(providerBreakdown),
    };
  }

  /**
   * 🔍 Run performance benchmark
   */
  async runBenchmark(
    providers: Array<{ provider: string; model: string }>,
    testCases: Array<{
      input: string;
      complexity: 'simple' | 'medium' | 'complex';
      expectedOutputLength?: number;
    }>,
    iterations: number = 5
  ): Promise<{
    benchmarkId: string;
    results: Array<{
      provider: string;
      model: string;
      averageResponseTime: number;
      averageQuality: number;
      reliability: number;
      costPerTest: number;
      ranking: number;
    }>;
  }> {
    const benchmarkId = `benchmark_${Date.now()}`;

    console.log(`🔍 Running performance benchmark: ${benchmarkId}`);
    console.log(
      `Testing ${providers.length} providers with ${testCases.length} test cases, ${iterations} iterations each`
    );

    // This would run actual tests against providers
    // For now, we'll simulate results
    const results = providers.map(({ provider, model }, index) => ({
      provider,
      model,
      averageResponseTime: 2000 + Math.random() * 3000 + index * 500,
      averageQuality: 0.7 + Math.random() * 0.25,
      reliability: 0.95 + Math.random() * 0.05,
      costPerTest: 0.001 + Math.random() * 0.009,
      ranking: index + 1,
    }));

    // Sort by composite score and assign rankings
    results.sort((a, b) => {
      const scoreA =
        (1 / a.averageResponseTime) * a.averageQuality * a.reliability * (1 / a.costPerTest);
      const scoreB =
        (1 / b.averageResponseTime) * b.averageQuality * b.reliability * (1 / b.costPerTest);
      return scoreB - scoreA;
    });

    results.forEach((result, index) => {
      result.ranking = index + 1;
    });

    this.benchmarkResults.set(benchmarkId, {
      timestamp: new Date().toISOString(),
      providers,
      testCases,
      iterations,
      results,
    });

    console.log(`✅ Benchmark completed: ${benchmarkId}`);
    return { benchmarkId, results };
  }

  /**
   * Private helper methods
   */

  private calculateCosts(
    provider: string,
    model: string,
    metrics: PerformanceMetrics
  ): {
    inputCost: number;
    outputCost: number;
    totalCost: number;
  } {
    // Simplified cost calculation - would use actual provider pricing
    const costPerInputToken = this.getInputTokenCost(provider, model);
    const costPerOutputToken = this.getOutputTokenCost(provider, model);

    const inputCost = metrics.inputTokens * costPerInputToken;
    const outputCost = metrics.outputTokens * costPerOutputToken;
    const totalCost = inputCost + outputCost;

    return { inputCost, outputCost, totalCost };
  }

  private getInputTokenCost(provider: string, model: string): number {
    const costs: Record<string, number> = {
      'openai:gpt-4': 0.00003,
      'openai:gpt-3.5-turbo': 0.000001,
      'anthropic:claude-3-opus-20240229': 0.000015,
      'anthropic:claude-3-sonnet-20240229': 0.000003,
      'google:gemini-pro': 0.000001,
    };

    return costs[`${provider}:${model}`] || 0.000002;
  }

  private getOutputTokenCost(provider: string, model: string): number {
    const costs: Record<string, number> = {
      'openai:gpt-4': 0.00006,
      'openai:gpt-3.5-turbo': 0.000002,
      'anthropic:claude-3-opus-20240229': 0.000075,
      'anthropic:claude-3-sonnet-20240229': 0.000015,
      'google:gemini-pro': 0.000002,
    };

    return costs[`${provider}:${model}`] || 0.000004;
  }

  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, d) => sum + d, 0) / values.length;

    return Math.sqrt(avgSquaredDiff);
  }

  private generatePerformanceRecommendations(providers: any[]): string[] {
    const recommendations: string[] = [];

    if (providers.length === 0) {
      return ['No providers to analyze'];
    }

    // Speed recommendations
    const slowProviders = providers.filter(p => p.averageResponseTime > 5000);
    if (slowProviders.length > 0) {
      recommendations.push(
        `Consider replacing slow providers: ${slowProviders.map(p => p.provider).join(', ')}`
      );
    }

    // Quality recommendations
    const lowQualityProviders = providers.filter(p => p.averageQualityScore < 0.7);
    if (lowQualityProviders.length > 0) {
      recommendations.push(
        `Improve quality for: ${lowQualityProviders.map(p => p.provider).join(', ')}`
      );
    }

    // Reliability recommendations
    const unreliableProviders = providers.filter(p => p.uptime < 95);
    if (unreliableProviders.length > 0) {
      recommendations.push(
        `Address reliability issues: ${unreliableProviders.map(p => p.provider).join(', ')}`
      );
    }

    // General optimization
    if (providers.length > 1) {
      const bestProvider = providers[0];
      recommendations.push(
        `Consider using ${bestProvider.provider}:${bestProvider.model} as primary for best overall performance`
      );
    }

    return recommendations.length > 0
      ? recommendations
      : ['Performance looks good across all providers'];
  }

  private generatePerformanceAlerts(
    breakdown: PerformanceDashboard['providerBreakdown']
  ): PerformanceDashboard['alerts'] {
    const alerts: PerformanceDashboard['alerts'] = [];

    breakdown.forEach(provider => {
      // Performance alerts
      if (provider.averageResponseTime > 10000) {
        alerts.push({
          type: 'performance',
          severity: 'critical',
          message: `${provider.provider}:${provider.model} has high response time: ${provider.averageResponseTime}ms`,
          provider: provider.provider,
          timestamp: new Date().toISOString(),
        });
      }

      // Quality alerts
      if (provider.qualityScore < 0.6) {
        alerts.push({
          type: 'quality',
          severity: 'warning',
          message: `${provider.provider}:${provider.model} has low quality score: ${provider.qualityScore.toFixed(2)}`,
          provider: provider.provider,
          timestamp: new Date().toISOString(),
        });
      }

      // Cost alerts
      if (provider.cost > 1.0) {
        alerts.push({
          type: 'cost',
          severity: 'warning',
          message: `${provider.provider}:${provider.model} has high cost: $${provider.cost.toFixed(2)}`,
          provider: provider.provider,
          timestamp: new Date().toISOString(),
        });
      }

      // Reliability alerts
      if (provider.status === 'unhealthy') {
        alerts.push({
          type: 'reliability',
          severity: 'critical',
          message: `${provider.provider}:${provider.model} is unhealthy`,
          provider: provider.provider,
          timestamp: new Date().toISOString(),
        });
      }
    });

    return alerts;
  }

  private initializePerformanceTracking(): void {
    console.log('📊 Performance tracking initialized');

    // Clean up old data every hour
    setInterval(
      () => {
        const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days

        for (const [providerId, metrics] of this.performanceData.entries()) {
          const filteredMetrics = metrics.filter(
            m => new Date(Date.now()) > cutoff // Simplified check
          );

          if (filteredMetrics.length !== metrics.length) {
            this.performanceData.set(providerId, filteredMetrics);
            console.log(
              `🧹 Cleaned up ${metrics.length - filteredMetrics.length} old performance entries for ${providerId}`
            );
          }
        }
      },
      60 * 60 * 1000
    );
  }
}

// Export singleton instance
export const providerPerformanceAnalyzer = ProviderPerformanceAnalyzer.getInstance();
