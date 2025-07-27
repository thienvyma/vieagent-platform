/**
 * 💰 Provider Cost Tracker - Day 20 Step 20.3
 * Comprehensive cost tracking and usage analytics for multi-provider system
 */

import { prisma } from './prisma';

/**
 * 💳 Cost Entry Interface
 */
export interface CostEntry {
  id: string;
  timestamp: string;

  // Context
  userId: string;
  agentId: string;
  conversationId?: string;

  // Provider details
  provider: string;
  model: string;

  // Usage metrics
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;

  // Cost breakdown
  inputCost: number;
  outputCost: number;
  totalCost: number;

  // Performance metrics
  responseTime: number;
  success: boolean;
  errorMessage?: string;

  // Quality metrics
  qualityScore?: number;
  userRating?: number;

  // Metadata
  requestType: 'chat' | 'embedding' | 'other';
  metadata?: Record<string, any>;
}

/**
 * 📊 Usage Statistics
 */
export interface UsageStatistics {
  // Time period
  period: 'hour' | 'day' | 'week' | 'month';
  startTime: string;
  endTime: string;

  // Overall metrics
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: number;

  // Token usage
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;

  // Cost metrics
  totalCost: number;
  averageCostPerRequest: number;
  averageCostPerToken: number;

  // Performance metrics
  averageResponseTime: number;
  medianResponseTime: number;
  p95ResponseTime: number;

  // Provider breakdown
  providerStats: Array<{
    provider: string;
    requests: number;
    cost: number;
    tokens: number;
    averageResponseTime: number;
    successRate: number;
  }>;

  // Model breakdown
  modelStats: Array<{
    model: string;
    provider: string;
    requests: number;
    cost: number;
    tokens: number;
    averageResponseTime: number;
  }>;

  // Quality metrics
  averageQualityScore: number;
  userSatisfactionScore: number;
}

/**
 * 💰 Cost Alert
 */
export interface CostAlert {
  id: string;
  userId: string;
  agentId?: string;

  alertType: 'daily_limit' | 'monthly_limit' | 'per_request_limit' | 'unusual_spike';
  threshold: number;
  currentValue: number;

  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
  acknowledged: boolean;
}

/**
 * 📈 Cost Forecast
 */
export interface CostForecast {
  period: 'daily' | 'weekly' | 'monthly';

  // Historical data
  historicalAverage: number;
  recentTrend: 'increasing' | 'decreasing' | 'stable';

  // Predictions
  predictedCost: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };

  // Recommendations
  recommendations: Array<{
    type: 'provider_switch' | 'model_optimization' | 'usage_reduction';
    description: string;
    potentialSavings: number;
  }>;
}

/**
 * 💰 Provider Cost Tracker Service
 */
export class ProviderCostTracker {
  private static instance: ProviderCostTracker;
  private costEntries: Map<string, CostEntry[]> = new Map(); // userId -> entries
  private alerts: Map<string, CostAlert[]> = new Map(); // userId -> alerts
  private userLimits: Map<string, { daily: number; monthly: number }> = new Map();

  constructor() {
    this.startCostMonitoring();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ProviderCostTracker {
    if (!ProviderCostTracker.instance) {
      ProviderCostTracker.instance = new ProviderCostTracker();
    }
    return ProviderCostTracker.instance;
  }

  /**
   * 📊 Record cost entry
   */
  async recordCost(entry: Omit<CostEntry, 'id' | 'timestamp'>): Promise<CostEntry> {
    const costEntry: CostEntry = {
      id: `cost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };

    console.log(
      `💰 Recording cost: ${costEntry.provider}:${costEntry.model} - $${costEntry.totalCost.toFixed(6)}, ${costEntry.totalTokens} tokens`
    );

    // Store in memory
    if (!this.costEntries.has(entry.userId)) {
      this.costEntries.set(entry.userId, []);
    }
    this.costEntries.get(entry.userId)!.push(costEntry);

    // Store in database (simplified - would use dedicated cost tracking table)
    try {
      await this.persistCostEntry(costEntry);
    } catch (error) {
      console.error('Error persisting cost entry:', error);
    }

    // Check for alerts
    await this.checkCostAlerts(entry.userId, costEntry);

    // Cleanup old entries (keep last 30 days)
    this.cleanupOldEntries(entry.userId);

    return costEntry;
  }

  /**
   * 📈 Get usage statistics
   */
  getUsageStatistics(
    userId: string,
    period: 'hour' | 'day' | 'week' | 'month' = 'day',
    agentId?: string,
    provider?: string
  ): UsageStatistics {
    const entries = this.getUserEntries(userId, period, agentId, provider);

    if (entries.length === 0) {
      return this.createEmptyStatistics(period);
    }

    // Calculate time period
    const now = new Date();
    const startTime = this.getPeriodStart(now, period);

    // Basic metrics
    const totalRequests = entries.length;
    const successfulRequests = entries.filter(e => e.success).length;
    const failedRequests = totalRequests - successfulRequests;
    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;

    // Token metrics
    const totalTokens = entries.reduce((sum, e) => sum + e.totalTokens, 0);
    const inputTokens = entries.reduce((sum, e) => sum + e.inputTokens, 0);
    const outputTokens = entries.reduce((sum, e) => sum + e.outputTokens, 0);

    // Cost metrics
    const totalCost = entries.reduce((sum, e) => sum + e.totalCost, 0);
    const averageCostPerRequest = totalRequests > 0 ? totalCost / totalRequests : 0;
    const averageCostPerToken = totalTokens > 0 ? totalCost / totalTokens : 0;

    // Performance metrics
    const responseTimes = entries.map(e => e.responseTime).sort((a, b) => a - b);
    const averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
        : 0;
    const medianResponseTime =
      responseTimes.length > 0 ? responseTimes[Math.floor(responseTimes.length / 2)] : 0;
    const p95ResponseTime =
      responseTimes.length > 0 ? responseTimes[Math.floor(responseTimes.length * 0.95)] : 0;

    // Provider breakdown
    const providerBreakdown = new Map<
      string,
      {
        requests: number;
        cost: number;
        tokens: number;
        responseTime: number;
        successes: number;
      }
    >();

    entries.forEach(entry => {
      if (!providerBreakdown.has(entry.provider)) {
        providerBreakdown.set(entry.provider, {
          requests: 0,
          cost: 0,
          tokens: 0,
          responseTime: 0,
          successes: 0,
        });
      }

      const stats = providerBreakdown.get(entry.provider)!;
      stats.requests++;
      stats.cost += entry.totalCost;
      stats.tokens += entry.totalTokens;
      stats.responseTime += entry.responseTime;
      if (entry.success) stats.successes++;
    });

    const providerStats = Array.from(providerBreakdown.entries()).map(([provider, stats]) => ({
      provider,
      requests: stats.requests,
      cost: stats.cost,
      tokens: stats.tokens,
      averageResponseTime: stats.requests > 0 ? stats.responseTime / stats.requests : 0,
      successRate: stats.requests > 0 ? (stats.successes / stats.requests) * 100 : 0,
    }));

    // Model breakdown
    const modelBreakdown = new Map<
      string,
      {
        provider: string;
        requests: number;
        cost: number;
        tokens: number;
        responseTime: number;
      }
    >();

    entries.forEach(entry => {
      const key = `${entry.provider}:${entry.model}`;
      if (!modelBreakdown.has(key)) {
        modelBreakdown.set(key, {
          provider: entry.provider,
          requests: 0,
          cost: 0,
          tokens: 0,
          responseTime: 0,
        });
      }

      const stats = modelBreakdown.get(key)!;
      stats.requests++;
      stats.cost += entry.totalCost;
      stats.tokens += entry.totalTokens;
      stats.responseTime += entry.responseTime;
    });

    const modelStats = Array.from(modelBreakdown.entries()).map(([modelKey, stats]) => ({
      model: modelKey.split(':')[1],
      provider: stats.provider,
      requests: stats.requests,
      cost: stats.cost,
      tokens: stats.tokens,
      averageResponseTime: stats.requests > 0 ? stats.responseTime / stats.requests : 0,
    }));

    // Quality metrics
    const qualityScores = entries.filter(e => e.qualityScore).map(e => e.qualityScore!);
    const averageQualityScore =
      qualityScores.length > 0
        ? qualityScores.reduce((sum, q) => sum + q, 0) / qualityScores.length
        : 0;

    const userRatings = entries.filter(e => e.userRating).map(e => e.userRating!);
    const userSatisfactionScore =
      userRatings.length > 0 ? userRatings.reduce((sum, r) => sum + r, 0) / userRatings.length : 0;

    return {
      period,
      startTime: startTime.toISOString(),
      endTime: now.toISOString(),
      totalRequests,
      successfulRequests,
      failedRequests,
      successRate,
      totalTokens,
      inputTokens,
      outputTokens,
      totalCost,
      averageCostPerRequest,
      averageCostPerToken,
      averageResponseTime,
      medianResponseTime,
      p95ResponseTime,
      providerStats,
      modelStats,
      averageQualityScore,
      userSatisfactionScore,
    };
  }

  /**
   * 🚨 Set cost limits
   */
  setCostLimits(userId: string, limits: { daily?: number; monthly?: number }): void {
    const currentLimits = this.userLimits.get(userId) || { daily: 10, monthly: 100 };

    this.userLimits.set(userId, {
      daily: limits.daily ?? currentLimits.daily,
      monthly: limits.monthly ?? currentLimits.monthly,
    });

    console.log(`💰 Cost limits set for user ${userId}:`, this.userLimits.get(userId));
  }

  /**
   * 🚨 Get active alerts
   */
  getActiveAlerts(userId: string): CostAlert[] {
    return this.alerts.get(userId)?.filter(alert => !alert.acknowledged) || [];
  }

  /**
   * ✅ Acknowledge alert
   */
  acknowledgeAlert(userId: string, alertId: string): boolean {
    const userAlerts = this.alerts.get(userId);
    if (!userAlerts) return false;

    const alert = userAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      console.log(`✅ Alert ${alertId} acknowledged for user ${userId}`);
      return true;
    }

    return false;
  }

  /**
   * 📊 Generate cost forecast
   */
  generateCostForecast(
    userId: string,
    period: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): CostForecast {
    const entries = this.getUserEntries(userId, period === 'daily' ? 'month' : 'month'); // Get more history for forecasting

    if (entries.length < 7) {
      return this.createDefaultForecast(period);
    }

    // Group by day/week/month
    const periodData = this.groupEntriesByPeriod(entries, period);
    const costs = Array.from(periodData.values()).map(entries =>
      entries.reduce((sum, e) => sum + e.totalCost, 0)
    );

    // Calculate trend and forecast
    const recentCosts = costs.slice(-7); // Last 7 periods
    const historicalAverage = costs.reduce((sum, c) => sum + c, 0) / costs.length;

    // Simple trend analysis
    const recentAverage = recentCosts.reduce((sum, c) => sum + c, 0) / recentCosts.length;
    const recentTrend =
      recentAverage > historicalAverage * 1.1
        ? 'increasing'
        : recentAverage < historicalAverage * 0.9
          ? 'decreasing'
          : 'stable';

    // Simple linear forecast
    const predictedCost =
      recentTrend === 'increasing'
        ? recentAverage * 1.1
        : recentTrend === 'decreasing'
          ? recentAverage * 0.9
          : recentAverage;

    // Generate recommendations
    const recommendations = this.generateCostRecommendations(userId, entries);

    return {
      period,
      historicalAverage,
      recentTrend,
      predictedCost,
      confidenceInterval: {
        lower: predictedCost * 0.8,
        upper: predictedCost * 1.2,
      },
      recommendations,
    };
  }

  /**
   * 📊 Get cost comparison by provider
   */
  getProviderCostComparison(
    userId: string,
    days: number = 7
  ): Array<{
    provider: string;
    cost: number;
    requests: number;
    averageCostPerRequest: number;
    efficiency: number; // cost per successful request
  }> {
    const entries = this.getUserEntries(userId, 'week').filter(
      e => new Date(e.timestamp) > new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    );

    const providerData = new Map<
      string,
      {
        cost: number;
        requests: number;
        successes: number;
      }
    >();

    entries.forEach(entry => {
      if (!providerData.has(entry.provider)) {
        providerData.set(entry.provider, { cost: 0, requests: 0, successes: 0 });
      }

      const data = providerData.get(entry.provider)!;
      data.cost += entry.totalCost;
      data.requests++;
      if (entry.success) data.successes++;
    });

    return Array.from(providerData.entries())
      .map(([provider, data]) => ({
        provider,
        cost: data.cost,
        requests: data.requests,
        averageCostPerRequest: data.requests > 0 ? data.cost / data.requests : 0,
        efficiency: data.successes > 0 ? data.cost / data.successes : Infinity,
      }))
      .sort((a, b) => a.efficiency - b.efficiency);
  }

  /**
   * Private helper methods
   */

  private async persistCostEntry(entry: CostEntry): Promise<void> {
    // In a real implementation, this would save to a dedicated cost tracking table
    // For now, we'll store in message metadata
    try {
      if (entry.conversationId) {
        // Try to update the related message with cost information
        await prisma.message.updateMany({
          where: {
            conversationId: entry.conversationId,
            role: 'assistant',
            createdAt: {
              gte: new Date(Date.now() - 60000), // Last minute
            },
          },
          data: {
            tokens: entry.totalTokens,
            cost: entry.totalCost,
          },
        });
      }
    } catch (error) {
      console.warn('Could not persist cost entry to message:', error);
    }
  }

  private async checkCostAlerts(userId: string, entry: CostEntry): Promise<void> {
    const limits = this.userLimits.get(userId);
    if (!limits) return;

    const now = new Date();

    // Check daily limit
    const dailyEntries = this.getUserEntries(userId, 'day');
    const dailyCost = dailyEntries.reduce((sum, e) => sum + e.totalCost, 0);

    if (dailyCost > limits.daily) {
      await this.createAlert(userId, {
        alertType: 'daily_limit',
        threshold: limits.daily,
        currentValue: dailyCost,
        message: `Daily cost limit exceeded: $${dailyCost.toFixed(2)} > $${limits.daily}`,
        severity: 'critical',
      });
    }

    // Check monthly limit
    const monthlyEntries = this.getUserEntries(userId, 'month');
    const monthlyCost = monthlyEntries.reduce((sum, e) => sum + e.totalCost, 0);

    if (monthlyCost > limits.monthly) {
      await this.createAlert(userId, {
        alertType: 'monthly_limit',
        threshold: limits.monthly,
        currentValue: monthlyCost,
        message: `Monthly cost limit exceeded: $${monthlyCost.toFixed(2)} > $${limits.monthly}`,
        severity: 'critical',
      });
    }

    // Check for unusual spikes
    if (entry.totalCost > 0.1) {
      // $0.10 threshold
      await this.createAlert(userId, {
        alertType: 'unusual_spike',
        threshold: 0.1,
        currentValue: entry.totalCost,
        message: `Unusually high cost for single request: $${entry.totalCost.toFixed(4)}`,
        severity: 'warning',
      });
    }
  }

  private async createAlert(
    userId: string,
    alertData: Omit<CostAlert, 'id' | 'userId' | 'timestamp' | 'acknowledged'>
  ): Promise<void> {
    const alert: CostAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      ...alertData,
    };

    if (!this.alerts.has(userId)) {
      this.alerts.set(userId, []);
    }
    this.alerts.get(userId)!.push(alert);

    console.log(`🚨 Cost alert created for user ${userId}: ${alert.message}`);
  }

  private getUserEntries(
    userId: string,
    period: 'hour' | 'day' | 'week' | 'month',
    agentId?: string,
    provider?: string
  ): CostEntry[] {
    const userEntries = this.costEntries.get(userId) || [];
    const cutoff = this.getPeriodStart(new Date(), period);

    return userEntries.filter(entry => {
      const entryTime = new Date(entry.timestamp);
      const withinPeriod = entryTime >= cutoff;
      const matchesAgent = !agentId || entry.agentId === agentId;
      const matchesProvider = !provider || entry.provider === provider;

      return withinPeriod && matchesAgent && matchesProvider;
    });
  }

  private getPeriodStart(now: Date, period: 'hour' | 'day' | 'week' | 'month'): Date {
    const start = new Date(now);

    switch (period) {
      case 'hour':
        start.setMinutes(0, 0, 0);
        break;
      case 'day':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        const dayOfWeek = start.getDay();
        start.setDate(start.getDate() - dayOfWeek);
        start.setHours(0, 0, 0, 0);
        break;
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
    }

    return start;
  }

  private createEmptyStatistics(period: 'hour' | 'day' | 'week' | 'month'): UsageStatistics {
    const now = new Date();
    return {
      period,
      startTime: this.getPeriodStart(now, period).toISOString(),
      endTime: now.toISOString(),
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      successRate: 0,
      totalTokens: 0,
      inputTokens: 0,
      outputTokens: 0,
      totalCost: 0,
      averageCostPerRequest: 0,
      averageCostPerToken: 0,
      averageResponseTime: 0,
      medianResponseTime: 0,
      p95ResponseTime: 0,
      providerStats: [],
      modelStats: [],
      averageQualityScore: 0,
      userSatisfactionScore: 0,
    };
  }

  private createDefaultForecast(period: 'daily' | 'weekly' | 'monthly'): CostForecast {
    return {
      period,
      historicalAverage: 0,
      recentTrend: 'stable',
      predictedCost: 0,
      confidenceInterval: { lower: 0, upper: 0 },
      recommendations: [],
    };
  }

  private groupEntriesByPeriod(
    entries: CostEntry[],
    period: 'daily' | 'weekly' | 'monthly'
  ): Map<string, CostEntry[]> {
    const groups = new Map<string, CostEntry[]>();

    entries.forEach(entry => {
      const date = new Date(entry.timestamp);
      let key: string;

      switch (period) {
        case 'daily':
          key = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
      }

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(entry);
    });

    return groups;
  }

  private generateCostRecommendations(
    userId: string,
    entries: CostEntry[]
  ): CostForecast['recommendations'] {
    const recommendations: CostForecast['recommendations'] = [];

    // Analyze provider costs
    const providerCosts = new Map<string, number>();
    entries.forEach(entry => {
      providerCosts.set(entry.provider, (providerCosts.get(entry.provider) || 0) + entry.totalCost);
    });

    // Find most expensive provider
    const [mostExpensive] = Array.from(providerCosts.entries()).sort((a, b) => b[1] - a[1]);
    if (mostExpensive && mostExpensive[1] > 1.0) {
      recommendations.push({
        type: 'provider_switch',
        description: `Consider reducing usage of ${mostExpensive[0]} provider (highest cost: $${mostExpensive[1].toFixed(2)})`,
        potentialSavings: mostExpensive[1] * 0.3,
      });
    }

    // Analyze model usage
    const modelCosts = new Map<string, number>();
    entries.forEach(entry => {
      const key = `${entry.provider}:${entry.model}`;
      modelCosts.set(key, (modelCosts.get(key) || 0) + entry.totalCost);
    });

    const expensiveModels = Array.from(modelCosts.entries())
      .filter(([, cost]) => cost > 0.5)
      .sort((a, b) => b[1] - a[1]);

    if (expensiveModels.length > 0) {
      recommendations.push({
        type: 'model_optimization',
        description: `Consider using smaller models for simple tasks. Current expensive models: ${expensiveModels.map(([model]) => model).join(', ')}`,
        potentialSavings: expensiveModels.reduce((sum, [, cost]) => sum + cost, 0) * 0.4,
      });
    }

    return recommendations;
  }

  private cleanupOldEntries(userId: string): void {
    const userEntries = this.costEntries.get(userId);
    if (!userEntries) return;

    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const filteredEntries = userEntries.filter(entry => new Date(entry.timestamp) > cutoff);

    if (filteredEntries.length !== userEntries.length) {
      this.costEntries.set(userId, filteredEntries);
      console.log(
        `🧹 Cleaned up ${userEntries.length - filteredEntries.length} old cost entries for user ${userId}`
      );
    }
  }

  private startCostMonitoring(): void {
    // Run cleanup every hour
    setInterval(
      () => {
        for (const userId of this.costEntries.keys()) {
          this.cleanupOldEntries(userId);
        }
      },
      60 * 60 * 1000
    );

    console.log('💰 Cost monitoring started');
  }
}

// Export singleton instance
export const providerCostTracker = ProviderCostTracker.getInstance();
