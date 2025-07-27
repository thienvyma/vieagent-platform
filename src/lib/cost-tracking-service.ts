/**
 * 💰 Cost Tracking & Optimization Service
 *
 * Comprehensive system for tracking, analyzing, and optimizing AI model costs
 * Features:
 * - Real-time cost calculation
 * - Usage analytics and reporting
 * - Cost optimization recommendations
 * - Budget controls and alerts
 *
 * DAY 20 - Model Switching Implementation
 */

import { prisma } from './prisma';
import type { ProviderType } from './providers/IModelProvider';

export interface CostTrackingData {
  id: string;
  userId: string;
  agentId: string;
  conversationId?: string;

  // Provider info
  provider: ProviderType;
  model: string;

  // Usage metrics
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;

  // Cost breakdown
  promptCost: number;
  completionCost: number;
  totalCost: number;

  // Performance metrics
  responseTime: number;
  qualityScore?: number;

  // Metadata
  timestamp: Date;
  requestType: 'chat' | 'embedding' | 'completion';
  success: boolean;
  errorMessage?: string;
}

export interface CostAnalytics {
  // Time period
  startDate: Date;
  endDate: Date;

  // Usage summary
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;

  // Cost summary
  totalCost: number;
  averageCostPerRequest: number;
  costByProvider: Map<ProviderType, number>;
  costByModel: Map<string, number>;

  // Token usage
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;

  // Performance metrics
  averageResponseTime: number;
  averageQualityScore: number;

  // Trends
  dailyCosts: Array<{ date: Date; cost: number; requests: number }>;
  providerDistribution: Array<{ provider: ProviderType; percentage: number; cost: number }>;

  // Optimization opportunities
  potentialSavings: number;
  recommendations: CostOptimizationRecommendation[];
}

export interface CostOptimizationRecommendation {
  type: 'provider_switch' | 'model_downgrade' | 'usage_pattern' | 'budget_alert';
  title: string;
  description: string;
  potentialSavings: number;
  confidence: number; // 0-1
  action: {
    type: string;
    data: any;
  };
  metadata: {
    currentCost: number;
    optimizedCost: number;
    impactLevel: 'low' | 'medium' | 'high';
  };
}

export interface BudgetAlert {
  id: string;
  userId: string;
  agentId?: string;

  // Alert configuration
  alertType: 'daily' | 'weekly' | 'monthly' | 'threshold';
  budgetLimit: number;
  currentSpend: number;
  percentage: number;

  // Alert details
  triggered: boolean;
  triggerTime?: Date;
  message: string;
  severity: 'info' | 'warning' | 'critical';

  // Actions
  actions: Array<{
    type: 'email' | 'webhook' | 'pause_agent' | 'switch_model';
    config: any;
  }>;
}

export class CostTrackingService {
  private static instance: CostTrackingService;

  // Cost per token for different models (in USD)
  private modelCosts: Map<
    string,
    {
      promptCost: number;
      completionCost: number;
      currency: string;
    }
  > = new Map();

  // Budget limits and alerts
  private budgetAlerts: Map<string, BudgetAlert> = new Map();

  // Real-time cost tracking
  private realtimeCosts: Map<string, number> = new Map(); // userId -> current cost

  private constructor() {
    this.initializeModelCosts();
  }

  public static getInstance(): CostTrackingService {
    if (!CostTrackingService.instance) {
      CostTrackingService.instance = new CostTrackingService();
    }
    return CostTrackingService.instance;
  }

  // =============================================================================
  // INITIALIZATION
  // =============================================================================

  private initializeModelCosts(): void {
    // OpenAI Models
    this.modelCosts.set('openai:gpt-4o', {
      promptCost: 0.0000025, // $2.50 per 1M tokens
      completionCost: 0.00001, // $10.00 per 1M tokens
      currency: 'USD',
    });

    this.modelCosts.set('openai:gpt-4o-mini', {
      promptCost: 0.00000015, // $0.15 per 1M tokens
      completionCost: 0.0000006, // $0.60 per 1M tokens
      currency: 'USD',
    });

    this.modelCosts.set('openai:gpt-4-turbo', {
      promptCost: 0.00001, // $10.00 per 1M tokens
      completionCost: 0.00003, // $30.00 per 1M tokens
      currency: 'USD',
    });

    this.modelCosts.set('openai:gpt-3.5-turbo', {
      promptCost: 0.0000005, // $0.50 per 1M tokens
      completionCost: 0.0000015, // $1.50 per 1M tokens
      currency: 'USD',
    });

    // Anthropic Models
    this.modelCosts.set('anthropic:claude-3-5-sonnet-20241022', {
      promptCost: 0.000003, // $3.00 per 1M tokens
      completionCost: 0.000015, // $15.00 per 1M tokens
      currency: 'USD',
    });

    this.modelCosts.set('anthropic:claude-3-opus-20240229', {
      promptCost: 0.000015, // $15.00 per 1M tokens
      completionCost: 0.000075, // $75.00 per 1M tokens
      currency: 'USD',
    });

    this.modelCosts.set('anthropic:claude-3-haiku-20240307', {
      promptCost: 0.00000025, // $0.25 per 1M tokens
      completionCost: 0.00000125, // $1.25 per 1M tokens
      currency: 'USD',
    });

    // Google Models
    this.modelCosts.set('google:gemini-1.5-flash', {
      promptCost: 0.000000075, // $0.075 per 1M tokens
      completionCost: 0.0000003, // $0.30 per 1M tokens
      currency: 'USD',
    });

    this.modelCosts.set('google:gemini-1.5-pro', {
      promptCost: 0.00000125, // $1.25 per 1M tokens
      completionCost: 0.000005, // $5.00 per 1M tokens
      currency: 'USD',
    });

    // Embedding models
    this.modelCosts.set('openai:text-embedding-3-large', {
      promptCost: 0.00000013, // $0.13 per 1M tokens
      completionCost: 0,
      currency: 'USD',
    });

    this.modelCosts.set('openai:text-embedding-3-small', {
      promptCost: 0.00000002, // $0.02 per 1M tokens
      completionCost: 0,
      currency: 'USD',
    });
  }

  // =============================================================================
  // COST CALCULATION
  // =============================================================================

  public calculateCost(
    provider: ProviderType,
    model: string,
    promptTokens: number,
    completionTokens: number = 0
  ): {
    promptCost: number;
    completionCost: number;
    totalCost: number;
  } {
    const modelKey = `${provider}:${model}`;
    const costs = this.modelCosts.get(modelKey);

    if (!costs) {
      console.warn(`No cost data found for model: ${modelKey}`);
      return {
        promptCost: 0,
        completionCost: 0,
        totalCost: 0,
      };
    }

    const promptCost = promptTokens * costs.promptCost;
    const completionCost = completionTokens * costs.completionCost;
    const totalCost = promptCost + completionCost;

    return {
      promptCost,
      completionCost,
      totalCost,
    };
  }

  public estimateCost(
    provider: ProviderType,
    model: string,
    inputText: string,
    expectedOutputTokens: number = 100
  ): {
    estimatedPromptTokens: number;
    estimatedCompletionTokens: number;
    estimatedCost: number;
  } {
    // Rough token estimation (1 token ≈ 4 characters)
    const estimatedPromptTokens = Math.ceil(inputText.length / 4);
    const estimatedCompletionTokens = expectedOutputTokens;

    const cost = this.calculateCost(
      provider,
      model,
      estimatedPromptTokens,
      estimatedCompletionTokens
    );

    return {
      estimatedPromptTokens,
      estimatedCompletionTokens,
      estimatedCost: cost.totalCost,
    };
  }

  // =============================================================================
  // COST TRACKING
  // =============================================================================

  public async trackCost(data: CostTrackingData): Promise<void> {
    try {
      // Store in database using PerformanceMetric model // ✅ fixed from TS Phase 2
      await prisma.performanceMetric.create({
        data: {
          provider: data.provider,
          model: data.model,
          responseTime: data.responseTime,
          qualityScore: data.qualityScore || 0,
          relevanceScore: 1.0, // default value
          coherenceScore: 1.0, // default value
          accuracyScore: 1.0, // default value
          promptTokens: data.promptTokens,
          completionTokens: data.completionTokens,
          totalTokens: data.totalTokens,
          cost: data.totalCost,
          costPerToken: data.totalTokens > 0 ? data.totalCost / data.totalTokens : 0,
          userId: data.userId,
          agentId: data.agentId,
          conversationId: data.conversationId,
          messageComplexity: 'medium', // default value
          success: data.success,
          errorMessage: data.errorMessage,
          metadata: JSON.stringify({
            requestType: data.requestType,
            promptCost: data.promptCost,
            completionCost: data.completionCost,
            timestamp: data.timestamp.toISOString(),
          }),
        },
      });

      // Update real-time tracking
      const currentCost = this.realtimeCosts.get(data.userId) || 0;
      this.realtimeCosts.set(data.userId, currentCost + data.totalCost);

      // Check budget alerts
      await this.checkBudgetAlerts(data.userId, data.agentId);
    } catch (error: any) { // ✅ fixed from TS Phase 2
      console.error('Failed to track cost:', error);
    }
  }

  public async getCostAnalytics(
    userId: string,
    agentId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<CostAnalytics> {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const end = endDate || new Date();

    const whereClause = {
      userId,
      ...(agentId && { agentId }),
      timestamp: {
        gte: start,
        lte: end,
      },
    };

    // Get cost tracking data using PerformanceMetric model // ✅ fixed from TS Phase 2
    const costData = await prisma.performanceMetric.findMany({
      where: {
        userId,
        ...(agentId && { agentId }),
        timestamp: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    // Calculate analytics
    const analytics: CostAnalytics = {
      startDate: start,
      endDate: end,
      totalRequests: costData.length,
      successfulRequests: costData.filter((d: any) => d.success).length, // ✅ fixed from TS Phase 2
      failedRequests: costData.filter((d: any) => !d.success).length, // ✅ fixed from TS Phase 2
      totalCost: costData.reduce((sum: number, d: any) => sum + d.cost, 0), // ✅ fixed from TS Phase 2
      averageCostPerRequest: 0,
      costByProvider: new Map(),
      costByModel: new Map(),
      totalTokens: costData.reduce((sum: number, d: any) => sum + d.totalTokens, 0), // ✅ fixed from TS Phase 2
      promptTokens: costData.reduce((sum: number, d: any) => sum + d.promptTokens, 0), // ✅ fixed from TS Phase 2
      completionTokens: costData.reduce((sum: number, d: any) => sum + d.completionTokens, 0), // ✅ fixed from TS Phase 2
      averageResponseTime: 0,
      averageQualityScore: 0,
      dailyCosts: [],
      providerDistribution: [],
      potentialSavings: 0,
      recommendations: [],
    };

    // Calculate averages
    if (analytics.totalRequests > 0) {
      analytics.averageCostPerRequest = analytics.totalCost / analytics.totalRequests;
      analytics.averageResponseTime =
        costData.reduce((sum: number, d: any) => sum + d.responseTime, 0) / analytics.totalRequests;

      const qualityScores = costData.filter(d => d.qualityScore !== null);
      if (qualityScores.length > 0) {
        analytics.averageQualityScore =
          qualityScores.reduce((sum: number, d: any) => sum + (d.qualityScore || 0), 0) / qualityScores.length;
      }
    }

    // Calculate cost by provider
    costData.forEach(d => {
      const providerCost = analytics.costByProvider.get(d.provider as ProviderType) || 0;
      analytics.costByProvider.set(d.provider as ProviderType, providerCost + d.totalCost);

      const modelKey = `${d.provider}:${d.model}`;
      const modelCost = analytics.costByModel.get(modelKey) || 0;
      analytics.costByModel.set(modelKey, modelCost + d.totalCost);
    });

    // Calculate daily costs
    const dailyCostMap = new Map<string, { cost: number; requests: number }>();
    costData.forEach(d => {
      const dateKey = d.timestamp.toISOString().split('T')[0];
      const existing = dailyCostMap.get(dateKey) || { cost: 0, requests: 0 };
      dailyCostMap.set(dateKey, {
        cost: existing.cost + d.totalCost,
        requests: existing.requests + 1,
      });
    });

    analytics.dailyCosts = Array.from(dailyCostMap.entries()).map(([date, data]) => ({
      date: new Date(date),
      cost: data.cost,
      requests: data.requests,
    }));

    // Calculate provider distribution
    analytics.providerDistribution = Array.from(analytics.costByProvider.entries()).map(
      ([provider, cost]) => ({
        provider,
        percentage: (cost / analytics.totalCost) * 100,
        cost,
      })
    );

    // Generate optimization recommendations
    analytics.recommendations = await this.generateOptimizationRecommendations(
      userId,
      agentId,
      costData
    );
    analytics.potentialSavings = analytics.recommendations.reduce(
      (sum, r) => sum + r.potentialSavings,
      0
    );

    return analytics;
  }

  // =============================================================================
  // OPTIMIZATION RECOMMENDATIONS
  // =============================================================================

  private async generateOptimizationRecommendations(
    userId: string,
    agentId?: string,
    costData: any[]
  ): Promise<CostOptimizationRecommendation[]> {
    const recommendations: CostOptimizationRecommendation[] = [];

    // 1. Provider switching recommendations
    const providerSwitchRecs = this.analyzeProviderSwitchOpportunities(costData);
    recommendations.push(...providerSwitchRecs);

    // 2. Model downgrade recommendations
    const modelDowngradeRecs = this.analyzeModelDowngradeOpportunities(costData);
    recommendations.push(...modelDowngradeRecs);

    // 3. Usage pattern recommendations
    const usagePatternRecs = this.analyzeUsagePatterns(costData);
    recommendations.push(...usagePatternRecs);

    // 4. Budget alert recommendations
    const budgetAlertRecs = await this.analyzeBudgetAlerts(userId, agentId);
    recommendations.push(...budgetAlertRecs);

    // Sort by potential savings
    return recommendations.sort((a, b) => b.potentialSavings - a.potentialSavings);
  }

  private analyzeProviderSwitchOpportunities(costData: any[]): CostOptimizationRecommendation[] {
    const recommendations: CostOptimizationRecommendation[] = [];

    // Group by model usage patterns
    const modelUsage = new Map<string, { count: number; totalCost: number; avgTokens: number }>();

    costData.forEach(d => {
      const modelKey = `${d.provider}:${d.model}`;
      const existing = modelUsage.get(modelKey) || { count: 0, totalCost: 0, avgTokens: 0 };
      modelUsage.set(modelKey, {
        count: existing.count + 1,
        totalCost: existing.totalCost + d.totalCost,
        avgTokens: (existing.avgTokens * existing.count + d.totalTokens) / (existing.count + 1),
      });
    });

    // Analyze each model for cheaper alternatives
    for (const [modelKey, usage] of modelUsage) {
      const [provider, model] = modelKey.split(':');

      // Find cheaper alternatives
      const alternatives = this.findCheaperAlternatives(
        provider as ProviderType,
        model,
        usage.avgTokens
      );

      if (alternatives.length > 0) {
        const bestAlternative = alternatives[0];
        const potentialSavings = (usage.totalCost - bestAlternative.estimatedCost) * usage.count;

        if (potentialSavings > 0.01) {
          // Only recommend if savings > $0.01
          recommendations.push({
            type: 'provider_switch',
            title: `Switch from ${modelKey} to ${bestAlternative.provider}:${bestAlternative.model}`,
            description: `Save ${(potentialSavings * 100).toFixed(2)}¢ by switching to a more cost-effective model with similar capabilities`,
            potentialSavings,
            confidence: bestAlternative.confidence,
            action: {
              type: 'switch_model',
              data: {
                fromProvider: provider,
                fromModel: model,
                toProvider: bestAlternative.provider,
                toModel: bestAlternative.model,
              },
            },
            metadata: {
              currentCost: usage.totalCost,
              optimizedCost: bestAlternative.estimatedCost * usage.count,
              impactLevel:
                potentialSavings > 0.1 ? 'high' : potentialSavings > 0.05 ? 'medium' : 'low',
            },
          });
        }
      }
    }

    return recommendations;
  }

  private analyzeModelDowngradeOpportunities(costData: any[]): CostOptimizationRecommendation[] {
    const recommendations: CostOptimizationRecommendation[] = [];

    // Find high-cost models used for simple tasks
    const expensiveModels = costData.filter(d => d.totalCost > 0.01); // > 1 cent

    expensiveModels.forEach(d => {
      // Simple heuristic: if prompt is short and response is short, might be over-engineering
      if (d.promptTokens < 100 && d.completionTokens < 200) {
        const modelKey = `${d.provider}:${d.model}`;
        const cheaperAlternatives = this.findCheaperAlternatives(
          d.provider,
          d.model,
          d.totalTokens
        );

        if (cheaperAlternatives.length > 0) {
          const alternative = cheaperAlternatives[0];
          const savings = d.totalCost - alternative.estimatedCost;

          if (savings > 0.005) {
            // > 0.5 cents
            recommendations.push({
              type: 'model_downgrade',
              title: `Consider simpler model for basic tasks`,
              description: `For simple requests, ${alternative.provider}:${alternative.model} could save ${(savings * 100).toFixed(1)}¢ per request`,
              potentialSavings: savings,
              confidence: 0.7,
              action: {
                type: 'suggest_model_switch',
                data: {
                  fromModel: modelKey,
                  toModel: `${alternative.provider}:${alternative.model}`,
                  condition: 'simple_tasks',
                },
              },
              metadata: {
                currentCost: d.totalCost,
                optimizedCost: alternative.estimatedCost,
                impactLevel: 'medium',
              },
            });
          }
        }
      }
    });

    return recommendations;
  }

  private analyzeUsagePatterns(costData: any[]): CostOptimizationRecommendation[] {
    const recommendations: CostOptimizationRecommendation[] = [];

    // Analyze peak usage times
    const hourlyUsage = new Map<number, { count: number; cost: number }>();
    costData.forEach(d => {
      const hour = d.timestamp.getHours();
      const existing = hourlyUsage.get(hour) || { count: 0, cost: 0 };
      hourlyUsage.set(hour, {
        count: existing.count + 1,
        cost: existing.cost + d.totalCost,
      });
    });

    // Find peak hours
    const peakHours = Array.from(hourlyUsage.entries())
      .sort((a, b) => b[1].cost - a[1].cost)
      .slice(0, 3);

    if (peakHours.length > 0 && peakHours[0][1].cost > 0.1) {
      recommendations.push({
        type: 'usage_pattern',
        title: 'Optimize peak usage hours',
        description: `Consider using faster, cheaper models during peak hours (${peakHours.map(h => h[0]).join(', ')}:00)`,
        potentialSavings: peakHours[0][1].cost * 0.3, // Assume 30% savings
        confidence: 0.6,
        action: {
          type: 'schedule_optimization',
          data: {
            peakHours: peakHours.map(h => h[0]),
            suggestion: 'use_faster_models_during_peak',
          },
        },
        metadata: {
          currentCost: peakHours[0][1].cost,
          optimizedCost: peakHours[0][1].cost * 0.7,
          impactLevel: 'medium',
        },
      });
    }

    return recommendations;
  }

  private async analyzeBudgetAlerts(
    userId: string,
    agentId?: string
  ): Promise<CostOptimizationRecommendation[]> {
    const recommendations: CostOptimizationRecommendation[] = [];

    // Check if user is approaching budget limits
    const currentSpend = this.realtimeCosts.get(userId) || 0;

    if (currentSpend > 1.0) {
      // > $1 spent
      recommendations.push({
        type: 'budget_alert',
        title: 'Set up budget alerts',
        description: `You've spent $${currentSpend.toFixed(2)} recently. Consider setting up budget alerts to monitor spending.`,
        potentialSavings: 0,
        confidence: 0.8,
        action: {
          type: 'setup_budget_alert',
          data: {
            suggestedLimit: currentSpend * 1.5,
            alertThreshold: 0.8,
          },
        },
        metadata: {
          currentCost: currentSpend,
          optimizedCost: currentSpend,
          impactLevel: 'low',
        },
      });
    }

    return recommendations;
  }

  private findCheaperAlternatives(
    currentProvider: ProviderType,
    currentModel: string,
    avgTokens: number
  ): Array<{
    provider: ProviderType;
    model: string;
    estimatedCost: number;
    confidence: number;
  }> {
    const alternatives = [];
    const currentModelKey = `${currentProvider}:${currentModel}`;
    const currentCosts = this.modelCosts.get(currentModelKey);

    if (!currentCosts) return [];

    const currentCost =
      avgTokens * 0.7 * currentCosts.promptCost + avgTokens * 0.3 * currentCosts.completionCost;

    // Check all other models
    for (const [modelKey, costs] of this.modelCosts) {
      if (modelKey === currentModelKey) continue;

      const [provider, model] = modelKey.split(':');
      const estimatedCost =
        avgTokens * 0.7 * costs.promptCost + avgTokens * 0.3 * costs.completionCost;

      if (estimatedCost < currentCost) {
        alternatives.push({
          provider: provider as ProviderType,
          model,
          estimatedCost,
          confidence: this.calculateAlternativeConfidence(
            currentProvider,
            currentModel,
            provider as ProviderType,
            model
          ),
        });
      }
    }

    return alternatives.sort((a, b) => a.estimatedCost - b.estimatedCost);
  }

  private calculateAlternativeConfidence(
    currentProvider: ProviderType,
    currentModel: string,
    altProvider: ProviderType,
    altModel: string
  ): number {
    // Simple confidence calculation based on model capabilities
    let confidence = 0.5; // Base confidence

    // Same provider = higher confidence
    if (currentProvider === altProvider) {
      confidence += 0.3;
    }

    // Model tier comparison
    if (currentModel.includes('gpt-4') && altModel.includes('gpt-3.5')) {
      confidence = 0.6; // Downgrade confidence
    } else if (currentModel.includes('opus') && altModel.includes('haiku')) {
      confidence = 0.7; // Anthropic downgrade
    } else if (currentModel.includes('pro') && altModel.includes('flash')) {
      confidence = 0.8; // Google downgrade
    }

    return Math.min(confidence, 1.0);
  }

  // =============================================================================
  // BUDGET MANAGEMENT
  // =============================================================================

  public async setBudgetAlert(
    userId: string,
    agentId: string | null,
    alertType: 'daily' | 'weekly' | 'monthly' | 'threshold',
    budgetLimit: number,
    actions: Array<{ type: string; config: any }> = []
  ): Promise<string> {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const alert: BudgetAlert = {
      id: alertId,
      userId,
      agentId,
      alertType,
      budgetLimit,
      currentSpend: 0,
      percentage: 0,
      triggered: false,
      message: '',
      severity: 'info',
      actions,
    };

    this.budgetAlerts.set(alertId, alert);

    // Store in database
    try {
      await prisma.budgetAlert.create({
        data: {
          id: alertId,
          userId,
          agentId,
          alertType,
          budgetLimit,
          currentSpend: 0,
          percentage: 0,
          triggered: false,
          message: '',
          severity: 'info',
          actions: JSON.stringify(actions),
        },
      });
    } catch (error) {
      console.error('Failed to store budget alert:', error);
    }

    return alertId;
  }

  private async checkBudgetAlerts(userId: string, agentId?: string): Promise<void> {
    const userAlerts = Array.from(this.budgetAlerts.values()).filter(
      alert => alert.userId === userId && (!agentId || alert.agentId === agentId)
    );

    for (const alert of userAlerts) {
      const currentSpend = await this.getCurrentSpend(userId, alert.agentId, alert.alertType);
      const percentage = (currentSpend / alert.budgetLimit) * 100;

      alert.currentSpend = currentSpend;
      alert.percentage = percentage;

      // Check if alert should be triggered
      if (!alert.triggered && percentage >= 80) {
        // 80% threshold
        alert.triggered = true;
        alert.triggerTime = new Date();
        alert.severity = percentage >= 100 ? 'critical' : percentage >= 90 ? 'warning' : 'info';
        alert.message = `Budget alert: ${percentage.toFixed(1)}% of ${alert.alertType} budget used ($${currentSpend.toFixed(2)} / $${alert.budgetLimit.toFixed(2)})`;

        // Execute alert actions
        await this.executeAlertActions(alert);
      }
    }
  }

  private async getCurrentSpend(
    userId: string,
    agentId: string | null,
    period: 'daily' | 'weekly' | 'monthly' | 'threshold'
  ): Promise<number> {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'threshold':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
        break;
    }

    const result = await prisma.performanceMetric.aggregate({ // ✅ fixed from TS Phase 2
      where: {
        userId,
        ...(agentId && { agentId }),
        timestamp: {
          gte: startDate,
          lte: now,
        },
      },
      _sum: {
        cost: true, // ✅ fixed from TS Phase 2 - use cost field instead of totalCost
      },
    });

    return result._sum.cost || 0; // ✅ fixed from TS Phase 2
  }

  private async executeAlertActions(alert: BudgetAlert): Promise<void> {
    for (const action of alert.actions) {
      try {
        switch (action.type) {
          case 'email':
            // Send email notification
            console.log(`Would send email alert: ${alert.message}`);
            break;
          case 'webhook':
            // Send webhook notification
            console.log(`Would send webhook alert: ${alert.message}`);
            break;
          case 'pause_agent':
            // Pause agent temporarily
            console.log(`Would pause agent: ${alert.agentId}`);
            break;
          case 'switch_model':
            // Switch to cheaper model
            console.log(`Would switch to cheaper model for agent: ${alert.agentId}`);
            break;
        }
      } catch (error) {
        console.error(`Failed to execute alert action ${action.type}:`, error);
      }
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  public getModelCosts(): Map<string, any> {
    return new Map(this.modelCosts);
  }

  public updateModelCosts(
    modelKey: string,
    costs: { promptCost: number; completionCost: number }
  ): void {
    this.modelCosts.set(modelKey, { ...costs, currency: 'USD' });
  }

  public getRealTimeCosts(): Map<string, number> {
    return new Map(this.realtimeCosts);
  }

  public resetRealTimeCosts(userId: string): void {
    this.realtimeCosts.delete(userId);
  }

  public getBudgetAlerts(userId: string): BudgetAlert[] {
    return Array.from(this.budgetAlerts.values()).filter(alert => alert.userId === userId);
  }
}

// Export singleton instance
export const costTrackingService = CostTrackingService.getInstance();
