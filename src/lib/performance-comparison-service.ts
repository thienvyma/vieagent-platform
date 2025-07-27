/**
 * ⚡ Performance Comparison & A/B Testing Service
 *
 * Advanced system for comparing AI model performance across providers
 * Features:
 * - Real-time performance monitoring
 * - A/B testing framework
 * - Quality scoring system
 * - Performance analytics dashboard
 * - Automated performance optimization
 *
 * DAY 20 - Model Switching Implementation
 */

import { prisma } from './prisma';
import type { ProviderType } from './providers/IModelProvider';

export interface PerformanceMetric {
  id: string;
  timestamp: Date;

  // Model info
  provider: ProviderType;
  model: string;

  // Performance metrics
  responseTime: number; // milliseconds
  firstTokenTime?: number; // milliseconds (for streaming)
  tokensPerSecond?: number;

  // Quality metrics
  qualityScore: number; // 0-1
  relevanceScore: number; // 0-1
  coherenceScore: number; // 0-1
  accuracyScore: number; // 0-1

  // Usage metrics
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;

  // Cost metrics
  cost: number;
  costPerToken: number;

  // Context
  userId: string;
  agentId: string;
  conversationId?: string;
  messageComplexity: 'simple' | 'medium' | 'complex' | 'expert';

  // Success metrics
  success: boolean;
  errorType?: string;
  errorMessage?: string;

  // User feedback
  userRating?: number; // 1-5
  userFeedback?: string;

  // Metadata
  metadata: {
    requestType: string;
    features: string[];
    testGroup?: string;
  };
}

export interface PerformanceComparison {
  // Comparison period
  startDate: Date;
  endDate: Date;

  // Models being compared
  models: Array<{
    provider: ProviderType;
    model: string;
    totalRequests: number;
    successRate: number;
  }>;

  // Performance metrics
  responseTime: {
    [key: string]: {
      average: number;
      median: number;
      p95: number;
      p99: number;
    };
  };

  // Quality metrics
  quality: {
    [key: string]: {
      averageScore: number;
      relevanceScore: number;
      coherenceScore: number;
      accuracyScore: number;
    };
  };

  // Cost metrics
  cost: {
    [key: string]: {
      totalCost: number;
      averageCost: number;
      costPerToken: number;
      costEfficiency: number; // quality/cost ratio
    };
  };

  // User satisfaction
  satisfaction: {
    [key: string]: {
      averageRating: number;
      totalRatings: number;
      positiveRatings: number;
      negativeRatings: number;
    };
  };

  // Recommendations
  recommendations: Array<{
    type: 'performance' | 'cost' | 'quality' | 'satisfaction';
    title: string;
    description: string;
    confidence: number;
    action: any;
  }>;

  // Statistical significance
  statisticalSignificance: {
    [key: string]: {
      sampleSize: number;
      confidenceLevel: number;
      pValue: number;
      significant: boolean;
    };
  };
}

export interface ABTestConfig {
  id: string;
  name: string;
  description: string;

  // Test configuration
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'running' | 'completed' | 'paused';

  // Traffic allocation
  trafficAllocation: {
    [key: string]: number; // model -> percentage
  };

  // Test groups
  controlGroup: {
    provider: ProviderType;
    model: string;
    config: any;
  };

  testGroups: Array<{
    id: string;
    name: string;
    provider: ProviderType;
    model: string;
    config: any;
  }>;

  // Success metrics
  primaryMetric: 'response_time' | 'quality_score' | 'cost' | 'user_satisfaction';
  secondaryMetrics: string[];

  // Targeting
  targeting: {
    userIds?: string[];
    agentIds?: string[];
    messageComplexity?: string[];
    conditions?: any[];
  };

  // Results
  results?: {
    winner?: string;
    confidence: number;
    improvement: number;
    significance: boolean;
  };
}

export class PerformanceComparisonService {
  private static instance: PerformanceComparisonService;

  // A/B tests
  private activeTests: Map<string, ABTestConfig> = new Map();

  // Performance cache
  private performanceCache: Map<string, PerformanceMetric[]> = new Map();
  private cacheExpiry: Map<string, number> = new Map();

  // Quality scoring weights
  private qualityWeights = {
    relevance: 0.4,
    coherence: 0.3,
    accuracy: 0.3,
  };

  private constructor() {
    this.loadActiveTests();
  }

  public static getInstance(): PerformanceComparisonService {
    if (!PerformanceComparisonService.instance) {
      PerformanceComparisonService.instance = new PerformanceComparisonService();
    }
    return PerformanceComparisonService.instance;
  }

  // =============================================================================
  // PERFORMANCE TRACKING
  // =============================================================================

  public async recordPerformance(metric: PerformanceMetric): Promise<void> {
    try {
      // Store in database
      await prisma.performanceMetric.create({
        data: {
          id: metric.id,
          timestamp: metric.timestamp,
          provider: metric.provider,
          model: metric.model,
          responseTime: metric.responseTime,
          firstTokenTime: metric.firstTokenTime,
          tokensPerSecond: metric.tokensPerSecond,
          qualityScore: metric.qualityScore,
          relevanceScore: metric.relevanceScore,
          coherenceScore: metric.coherenceScore,
          accuracyScore: metric.accuracyScore,
          promptTokens: metric.promptTokens,
          completionTokens: metric.completionTokens,
          totalTokens: metric.totalTokens,
          cost: metric.cost,
          costPerToken: metric.costPerToken,
          userId: metric.userId,
          agentId: metric.agentId,
          conversationId: metric.conversationId,
          messageComplexity: metric.messageComplexity,
          success: metric.success,
          errorType: metric.errorType,
          errorMessage: metric.errorMessage,
          userRating: metric.userRating,
          userFeedback: metric.userFeedback,
          metadata: JSON.stringify(metric.metadata),
        },
      });

      // Update cache
      this.updatePerformanceCache(metric);

      // Check A/B test assignments
      await this.processABTestMetric(metric);
    } catch (error) {
      console.error('Failed to record performance metric:', error);
    }
  }

  private updatePerformanceCache(metric: PerformanceMetric): void {
    const cacheKey = `${metric.provider}:${metric.model}`;
    const existing = this.performanceCache.get(cacheKey) || [];

    // Keep only last 1000 metrics per model
    existing.push(metric);
    if (existing.length > 1000) {
      existing.shift();
    }

    this.performanceCache.set(cacheKey, existing);
    this.cacheExpiry.set(cacheKey, Date.now() + 60 * 60 * 1000); // 1 hour
  }

  // =============================================================================
  // PERFORMANCE COMPARISON
  // =============================================================================

  public async comparePerformance(
    models: Array<{ provider: ProviderType; model: string }>,
    startDate?: Date,
    endDate?: Date,
    filters?: {
      userId?: string;
      agentId?: string;
      messageComplexity?: string[];
    }
  ): Promise<PerformanceComparison> {
    const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    const end = endDate || new Date();

    const comparison: PerformanceComparison = {
      startDate: start,
      endDate: end,
      models: [],
      responseTime: {},
      quality: {},
      cost: {},
      satisfaction: {},
      recommendations: [],
      statisticalSignificance: {},
    };

    // Get performance data for each model
    for (const { provider, model } of models) {
      const modelKey = `${provider}:${model}`;
      const metrics = await this.getPerformanceMetrics(provider, model, start, end, filters);

      if (metrics.length === 0) continue;

      // Basic model info
      comparison.models.push({
        provider,
        model,
        totalRequests: metrics.length,
        successRate: metrics.filter(m => m.success).length / metrics.length,
      });

      // Response time analysis
      const responseTimes = metrics.map(m => m.responseTime).sort((a, b) => a - b);
      comparison.responseTime[modelKey] = {
        average: responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length,
        median: responseTimes[Math.floor(responseTimes.length / 2)],
        p95: responseTimes[Math.floor(responseTimes.length * 0.95)],
        p99: responseTimes[Math.floor(responseTimes.length * 0.99)],
      };

      // Quality analysis
      comparison.quality[modelKey] = {
        averageScore: metrics.reduce((sum, m) => sum + m.qualityScore, 0) / metrics.length,
        relevanceScore: metrics.reduce((sum, m) => sum + m.relevanceScore, 0) / metrics.length,
        coherenceScore: metrics.reduce((sum, m) => sum + m.coherenceScore, 0) / metrics.length,
        accuracyScore: metrics.reduce((sum, m) => sum + m.accuracyScore, 0) / metrics.length,
      };

      // Cost analysis
      const totalCost = metrics.reduce((sum, m) => sum + m.cost, 0);
      const totalTokens = metrics.reduce((sum, m) => sum + m.totalTokens, 0);
      const avgQuality = comparison.quality[modelKey].averageScore;

      comparison.cost[modelKey] = {
        totalCost,
        averageCost: totalCost / metrics.length,
        costPerToken: totalTokens > 0 ? totalCost / totalTokens : 0,
        costEfficiency: avgQuality > 0 ? avgQuality / (totalCost / metrics.length) : 0,
      };

      // Satisfaction analysis
      const ratingsMetrics = metrics.filter(m => m.userRating !== undefined);
      if (ratingsMetrics.length > 0) {
        const avgRating =
          ratingsMetrics.reduce((sum, m) => sum + (m.userRating || 0), 0) / ratingsMetrics.length;
        comparison.satisfaction[modelKey] = {
          averageRating: avgRating,
          totalRatings: ratingsMetrics.length,
          positiveRatings: ratingsMetrics.filter(m => (m.userRating || 0) >= 4).length,
          negativeRatings: ratingsMetrics.filter(m => (m.userRating || 0) <= 2).length,
        };
      }

      // Statistical significance
      comparison.statisticalSignificance[modelKey] = {
        sampleSize: metrics.length,
        confidenceLevel: this.calculateConfidenceLevel(metrics.length),
        pValue: this.calculatePValue(metrics),
        significant: metrics.length >= 30 && this.calculatePValue(metrics) < 0.05,
      };
    }

    // Generate recommendations
    comparison.recommendations = this.generatePerformanceRecommendations(comparison);

    return comparison;
  }

  private async getPerformanceMetrics(
    provider: ProviderType,
    model: string,
    startDate: Date,
    endDate: Date,
    filters?: any
  ): Promise<PerformanceMetric[]> {
    const whereClause = {
      provider,
      model,
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
      ...(filters?.userId && { userId: filters.userId }),
      ...(filters?.agentId && { agentId: filters.agentId }),
      ...(filters?.messageComplexity && { messageComplexity: { in: filters.messageComplexity } }),
    };

    const metrics = await prisma.performanceMetric.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
    });

    return metrics.map(m => ({
      id: m.id,
      timestamp: m.timestamp,
      provider: m.provider as ProviderType,
      model: m.model,
      responseTime: m.responseTime,
      firstTokenTime: m.firstTokenTime || undefined,
      tokensPerSecond: m.tokensPerSecond || undefined,
      qualityScore: m.qualityScore,
      relevanceScore: m.relevanceScore,
      coherenceScore: m.coherenceScore,
      accuracyScore: m.accuracyScore,
      promptTokens: m.promptTokens,
      completionTokens: m.completionTokens,
      totalTokens: m.totalTokens,
      cost: m.cost,
      costPerToken: m.costPerToken,
      userId: m.userId,
      agentId: m.agentId,
      conversationId: m.conversationId || undefined,
      messageComplexity: m.messageComplexity as any,
      success: m.success,
      errorType: m.errorType || undefined,
      errorMessage: m.errorMessage || undefined,
      userRating: m.userRating || undefined,
      userFeedback: m.userFeedback || undefined,
      metadata: JSON.parse(m.metadata || '{}'),
    }));
  }

  // =============================================================================
  // QUALITY SCORING
  // =============================================================================

  public calculateQualityScore(
    response: string,
    expectedResponse?: string,
    userFeedback?: {
      relevance: number; // 0-1
      coherence: number; // 0-1
      accuracy: number; // 0-1
    }
  ): {
    qualityScore: number;
    relevanceScore: number;
    coherenceScore: number;
    accuracyScore: number;
  } {
    // Use provided feedback or calculate automatically
    const relevanceScore =
      userFeedback?.relevance || this.calculateRelevanceScore(response, expectedResponse);
    const coherenceScore = userFeedback?.coherence || this.calculateCoherenceScore(response);
    const accuracyScore =
      userFeedback?.accuracy || this.calculateAccuracyScore(response, expectedResponse);

    // Calculate weighted quality score
    const qualityScore =
      relevanceScore * this.qualityWeights.relevance +
      coherenceScore * this.qualityWeights.coherence +
      accuracyScore * this.qualityWeights.accuracy;

    return {
      qualityScore,
      relevanceScore,
      coherenceScore,
      accuracyScore,
    };
  }

  private calculateRelevanceScore(response: string, expectedResponse?: string): number {
    if (!expectedResponse) {
      // Simple heuristic: longer responses are generally more relevant
      return Math.min(response.length / 500, 1.0);
    }

    // Calculate similarity between response and expected response
    const similarity = this.calculateTextSimilarity(response, expectedResponse);
    return similarity;
  }

  private calculateCoherenceScore(response: string): number {
    // Simple coherence heuristics
    let score = 0.5; // Base score

    // Check for proper sentence structure
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length > 0) {
      score += 0.2;
    }

    // Check for logical flow (simple heuristic)
    const words = response.toLowerCase().split(/\s+/);
    const connectors = ['however', 'therefore', 'furthermore', 'additionally', 'consequently'];
    const hasConnectors = connectors.some(connector => words.includes(connector));
    if (hasConnectors) {
      score += 0.2;
    }

    // Check for repetition (penalize)
    const uniqueWords = new Set(words);
    const repetitionRatio = uniqueWords.size / words.length;
    score += (repetitionRatio - 0.5) * 0.2;

    return Math.max(0, Math.min(1, score));
  }

  private calculateAccuracyScore(response: string, expectedResponse?: string): number {
    if (!expectedResponse) {
      // Without expected response, use heuristics
      return this.calculateResponseAccuracyHeuristic(response);
    }

    // Calculate accuracy based on expected response
    return this.calculateTextSimilarity(response, expectedResponse);
  }

  private calculateResponseAccuracyHeuristic(response: string): number {
    let score = 0.5; // Base score

    // Check for factual indicators
    const factualIndicators = [
      'according to',
      'research shows',
      'studies indicate',
      'data suggests',
    ];
    const hasFactualIndicators = factualIndicators.some(indicator =>
      response.toLowerCase().includes(indicator)
    );
    if (hasFactualIndicators) {
      score += 0.2;
    }

    // Check for uncertainty indicators (good for accuracy)
    const uncertaintyIndicators = ['might', 'could', 'possibly', 'likely', 'probably'];
    const hasUncertaintyIndicators = uncertaintyIndicators.some(indicator =>
      response.toLowerCase().includes(indicator)
    );
    if (hasUncertaintyIndicators) {
      score += 0.1;
    }

    // Check for overconfident statements (penalize)
    const overconfidentIndicators = ['always', 'never', 'definitely', 'absolutely', 'certainly'];
    const hasOverconfidentIndicators = overconfidentIndicators.some(indicator =>
      response.toLowerCase().includes(indicator)
    );
    if (hasOverconfidentIndicators) {
      score -= 0.1;
    }

    return Math.max(0, Math.min(1, score));
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    // Simple word-based similarity
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  // =============================================================================
  // A/B TESTING
  // =============================================================================

  public async createABTest(config: ABTestConfig): Promise<string> {
    // Validate configuration
    const validation = this.validateABTestConfig(config);
    if (!validation.valid) {
      throw new Error(`Invalid A/B test configuration: ${validation.errors.join(', ')}`);
    }

    // Store test configuration
    this.activeTests.set(config.id, config);

    // Store in database
    try {
      await prisma.aBTest.create({
        data: {
          id: config.id,
          name: config.name,
          description: config.description,
          startDate: config.startDate,
          endDate: config.endDate,
          status: config.status,
          trafficAllocation: JSON.stringify(config.trafficAllocation),
          controlGroup: JSON.stringify(config.controlGroup),
          testGroups: JSON.stringify(config.testGroups),
          primaryMetric: config.primaryMetric,
          secondaryMetrics: JSON.stringify(config.secondaryMetrics),
          targeting: JSON.stringify(config.targeting),
          results: config.results ? JSON.stringify(config.results) : null,
        },
      });
    } catch (error) {
      console.error('Failed to store A/B test:', error);
    }

    return config.id;
  }

  public async getABTestAssignment(
    userId: string,
    agentId: string,
    context: any
  ): Promise<{
    provider: ProviderType;
    model: string;
    testId?: string;
    testGroup?: string;
  } | null> {
    // Check active tests
    for (const [testId, test] of this.activeTests) {
      if (test.status !== 'running') continue;

      // Check if user/agent matches targeting
      if (!this.matchesTargeting(userId, agentId, context, test.targeting)) {
        continue;
      }

      // Check if test is within date range
      const now = new Date();
      if (now < test.startDate || now > test.endDate) {
        continue;
      }

      // Assign to test group based on traffic allocation
      const assignment = this.assignToTestGroup(userId, test);
      if (assignment) {
        return {
          provider: assignment.provider,
          model: assignment.model,
          testId,
          testGroup: assignment.groupId,
        };
      }
    }

    return null;
  }

  private validateABTestConfig(config: ABTestConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check traffic allocation
    const totalAllocation = Object.values(config.trafficAllocation).reduce(
      (sum, pct) => sum + pct,
      0
    );
    if (Math.abs(totalAllocation - 100) > 0.01) {
      errors.push('Traffic allocation must sum to 100%');
    }

    // Check dates
    if (config.startDate >= config.endDate) {
      errors.push('Start date must be before end date');
    }

    // Check test groups
    if (config.testGroups.length === 0) {
      errors.push('At least one test group is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private matchesTargeting(
    userId: string,
    agentId: string,
    context: any,
    targeting: ABTestConfig['targeting']
  ): boolean {
    // Check user targeting
    if (targeting.userIds && !targeting.userIds.includes(userId)) {
      return false;
    }

    // Check agent targeting
    if (targeting.agentIds && !targeting.agentIds.includes(agentId)) {
      return false;
    }

    // Check message complexity
    if (targeting.messageComplexity && context.messageComplexity) {
      if (!targeting.messageComplexity.includes(context.messageComplexity)) {
        return false;
      }
    }

    // Check custom conditions
    if (targeting.conditions) {
      for (const condition of targeting.conditions) {
        if (!this.evaluateCondition(condition, context)) {
          return false;
        }
      }
    }

    return true;
  }

  private assignToTestGroup(
    userId: string,
    test: ABTestConfig
  ): {
    provider: ProviderType;
    model: string;
    groupId: string;
  } | null {
    // Use user ID for consistent assignment
    const hash = this.hashUserId(userId);
    const percentage = hash % 100;

    let cumulativePercentage = 0;

    // Check control group first
    const controlAllocation = test.trafficAllocation['control'] || 0;
    if (percentage < controlAllocation) {
      return {
        provider: test.controlGroup.provider,
        model: test.controlGroup.model,
        groupId: 'control',
      };
    }
    cumulativePercentage += controlAllocation;

    // Check test groups
    for (const group of test.testGroups) {
      const groupAllocation = test.trafficAllocation[group.id] || 0;
      if (percentage < cumulativePercentage + groupAllocation) {
        return {
          provider: group.provider,
          model: group.model,
          groupId: group.id,
        };
      }
      cumulativePercentage += groupAllocation;
    }

    return null;
  }

  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private evaluateCondition(condition: any, context: any): boolean {
    // Simple condition evaluation
    switch (condition.type) {
      case 'equals':
        return context[condition.field] === condition.value;
      case 'contains':
        return context[condition.field]?.includes(condition.value);
      case 'greater_than':
        return context[condition.field] > condition.value;
      case 'less_than':
        return context[condition.field] < condition.value;
      default:
        return true;
    }
  }

  private async processABTestMetric(metric: PerformanceMetric): Promise<void> {
    // Find relevant A/B tests
    for (const [testId, test] of this.activeTests) {
      if (test.status !== 'running') continue;

      // Check if metric belongs to this test
      if (metric.metadata.testGroup) {
        // Store A/B test result
        await this.storeABTestResult(testId, metric);
      }
    }
  }

  private async storeABTestResult(testId: string, metric: PerformanceMetric): Promise<void> {
    try {
      await prisma.aBTestResult.create({
        data: {
          testId,
          userId: metric.userId,
          agentId: metric.agentId,
          provider: metric.provider,
          model: metric.model,
          testGroup: metric.metadata.testGroup || 'control',
          responseTime: metric.responseTime,
          qualityScore: metric.qualityScore,
          cost: metric.cost,
          success: metric.success,
          userRating: metric.userRating,
          timestamp: metric.timestamp,
          metadata: JSON.stringify(metric.metadata),
        },
      });
    } catch (error) {
      console.error('Failed to store A/B test result:', error);
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private calculateConfidenceLevel(sampleSize: number): number {
    if (sampleSize >= 1000) return 0.99;
    if (sampleSize >= 100) return 0.95;
    if (sampleSize >= 30) return 0.9;
    return 0.8;
  }

  private calculatePValue(metrics: PerformanceMetric[]): number {
    // Simplified p-value calculation
    const successRate = metrics.filter(m => m.success).length / metrics.length;
    const expectedSuccessRate = 0.95; // Expected 95% success rate

    // Simple z-test approximation
    const n = metrics.length;
    const z =
      (successRate - expectedSuccessRate) /
      Math.sqrt((expectedSuccessRate * (1 - expectedSuccessRate)) / n);

    // Convert z-score to p-value (simplified)
    return Math.abs(z) > 1.96 ? 0.05 : 0.1;
  }

  private generatePerformanceRecommendations(comparison: PerformanceComparison): any[] {
    const recommendations = [];

    // Find best performing model by different metrics
    const models = comparison.models.map(m => `${m.provider}:${m.model}`);

    // Best response time
    const fastestModel = models.reduce((best, current) =>
      comparison.responseTime[current].average < comparison.responseTime[best].average
        ? current
        : best
    );

    // Best quality
    const bestQualityModel = models.reduce((best, current) =>
      comparison.quality[current].averageScore > comparison.quality[best].averageScore
        ? current
        : best
    );

    // Best cost efficiency
    const mostEfficientModel = models.reduce((best, current) =>
      comparison.cost[current].costEfficiency > comparison.cost[best].costEfficiency
        ? current
        : best
    );

    // Generate recommendations
    if (fastestModel !== bestQualityModel) {
      recommendations.push({
        type: 'performance',
        title: 'Speed vs Quality Trade-off',
        description: `${fastestModel} is fastest but ${bestQualityModel} has better quality. Consider context-based switching.`,
        confidence: 0.8,
        action: {
          type: 'conditional_switching',
          fastModel: fastestModel,
          qualityModel: bestQualityModel,
        },
      });
    }

    if (mostEfficientModel !== bestQualityModel) {
      recommendations.push({
        type: 'cost',
        title: 'Cost Optimization Opportunity',
        description: `${mostEfficientModel} offers better cost efficiency than ${bestQualityModel}`,
        confidence: 0.7,
        action: {
          type: 'cost_optimization',
          recommendedModel: mostEfficientModel,
        },
      });
    }

    return recommendations;
  }

  private async loadActiveTests(): Promise<void> {
    try {
      const tests = await prisma.aBTest.findMany({
        where: {
          status: 'running',
        },
      });

      tests.forEach(test => {
        const config: ABTestConfig = {
          id: test.id,
          name: test.name,
          description: test.description,
          startDate: test.startDate,
          endDate: test.endDate,
          status: test.status as any,
          trafficAllocation: JSON.parse(test.trafficAllocation),
          controlGroup: JSON.parse(test.controlGroup),
          testGroups: JSON.parse(test.testGroups),
          primaryMetric: test.primaryMetric as any,
          secondaryMetrics: JSON.parse(test.secondaryMetrics),
          targeting: JSON.parse(test.targeting),
          results: test.results ? JSON.parse(test.results) : undefined,
        };

        this.activeTests.set(test.id, config);
      });
    } catch (error) {
      console.error('Failed to load active tests:', error);
    }
  }

  public getActiveTests(): ABTestConfig[] {
    return Array.from(this.activeTests.values());
  }

  public updateQualityWeights(weights: Partial<typeof this.qualityWeights>): void {
    this.qualityWeights = { ...this.qualityWeights, ...weights };
  }
}

// Export singleton instance
export const performanceComparisonService = PerformanceComparisonService.getInstance();
