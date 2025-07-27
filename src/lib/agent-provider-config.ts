/**
 * 🔧 Agent Provider Configuration Service - Day 20 Step 20.1
 * Manages agent-specific provider configurations and health monitoring
 */

import { prisma } from './prisma';
import { ProviderFactory } from './providers/ProviderFactory';
import { ProviderType } from './providers/IModelProvider';

export interface AgentProviderConfig {
  agentId: string;
  primaryProvider: ProviderType;
  primaryModel: string;
  fallbackProviders: ProviderType[];
  fallbackModels: Record<ProviderType, string>;

  // Performance settings
  performanceSettings: {
    enableLoadBalancing: boolean;
    maxResponseTime: number;
    maxCostPerMessage: number;
    enableAutoFallback: boolean;
    fallbackThreshold: number;
  };

  // Cost settings
  costSettings: {
    enableCostOptimization: boolean;
    maxDailyCost: number;
    maxMonthlyCost: number;
    costTrackingEnabled: boolean;
  };

  // Quality settings
  qualitySettings: {
    minQualityScore: number;
    enableQualityMonitoring: boolean;
    qualityFallbackEnabled: boolean;
  };

  // Switch settings
  switchSettings: {
    enableAutoSwitch: boolean;
    switchCooldown: number;
    maxSwitchesPerHour: number;
    switchReasons: string[];
  };
}

export interface ProviderHealthStatus {
  provider: ProviderType;
  model: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  successRate: number;
  lastChecked: Date;
  errorCount: number;
  lastError?: string;
}

export interface ProviderMetrics {
  provider: ProviderType;
  model: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  totalCost: number;
  averageCost: number;
  lastUsed: Date;
  currentStatus: 'active' | 'inactive' | 'error';
}

export interface SwitchHistoryEntry {
  timestamp: Date;
  fromProvider: ProviderType;
  fromModel: string;
  toProvider: ProviderType;
  toModel: string;
  reason: string;
  success: boolean;
  responseTime?: number;
  cost?: number;
}

export class AgentProviderConfigService {
  private static instance: AgentProviderConfigService;
  private providerFactory: ProviderFactory;
  private configCache: Map<string, AgentProviderConfig> = new Map();
  private healthCache: Map<string, ProviderHealthStatus> = new Map();
  private metricsCache: Map<string, ProviderMetrics> = new Map();
  private switchHistory: Map<string, SwitchHistoryEntry[]> = new Map();

  private constructor() {
    this.providerFactory = ProviderFactory.getInstance();
  }

  public static getInstance(): AgentProviderConfigService {
    if (!AgentProviderConfigService.instance) {
      AgentProviderConfigService.instance = new AgentProviderConfigService();
    }
    return AgentProviderConfigService.instance;
  }

  /**
   * Get agent provider configuration
   */
  public async getAgentProviderConfig(agentId: string): Promise<AgentProviderConfig | null> {
    // Check cache first
    if (this.configCache.has(agentId)) {
      return this.configCache.get(agentId)!;
    }

    try {
      // Get agent from database
      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
      });

      if (!agent) {
        return null;
      }

      // Build configuration from agent data
      const config: AgentProviderConfig = {
        agentId,
        primaryProvider: (agent.modelProvider as ProviderType) || 'openai',
        primaryModel: agent.model || 'gpt-3.5-turbo',
        fallbackProviders: this.parseFallbackProviders(agent.fallbackModel),
        fallbackModels: this.parseFallbackModels(agent.fallbackModel),

        performanceSettings: {
          enableLoadBalancing: agent.multiModelSupport || false,
          maxResponseTime: agent.responseTimeoutMs || 30000,
          maxCostPerMessage: 0.01, // Default $0.01 per message
          enableAutoFallback: true,
          fallbackThreshold: 0.8,
        },

        costSettings: {
          enableCostOptimization: false,
          maxDailyCost: 1.0, // Default $1 per day
          maxMonthlyCost: 30.0, // Default $30 per month
          costTrackingEnabled: true,
        },

        qualitySettings: {
          minQualityScore: 0.7,
          enableQualityMonitoring: true,
          qualityFallbackEnabled: true,
        },

        switchSettings: {
          enableAutoSwitch: agent.multiModelSupport || false,
          switchCooldown: 60000, // 1 minute
          maxSwitchesPerHour: 10,
          switchReasons: ['performance', 'cost', 'error', 'quality'],
        },
      };

      // Cache configuration
      this.configCache.set(agentId, config);
      return config;
    } catch (error) {
      console.error('Error getting agent provider config:', error);
      return null;
    }
  }

  /**
   * Update agent provider configuration
   */
  public async updateAgentProviderConfig(
    agentId: string,
    updates: Partial<AgentProviderConfig>
  ): Promise<boolean> {
    try {
      // Get current config
      const currentConfig = await this.getAgentProviderConfig(agentId);
      if (!currentConfig) {
        return false;
      }

      // Merge updates
      const newConfig = { ...currentConfig, ...updates };

      // Update database
      await prisma.agent.update({
        where: { id: agentId },
        data: {
          modelProvider: newConfig.primaryProvider,
          model: newConfig.primaryModel,
          fallbackModel: this.serializeFallbackModels(newConfig.fallbackModels),
          multiModelSupport: newConfig.performanceSettings.enableLoadBalancing,
          responseTimeoutMs: newConfig.performanceSettings.maxResponseTime,
        },
      });

      // Update cache
      this.configCache.set(agentId, newConfig);
      return true;
    } catch (error) {
      console.error('Error updating agent provider config:', error);
      return false;
    }
  }

  /**
   * Health check for agent providers
   */
  public async healthCheckAgentProviders(
    agentId: string
  ): Promise<Record<string, ProviderHealthStatus>> {
    const config = await this.getAgentProviderConfig(agentId);
    if (!config) {
      return {};
    }

    const healthStatuses: Record<string, ProviderHealthStatus> = {};
    const providers = [config.primaryProvider, ...config.fallbackProviders];

    for (const provider of providers) {
      const cacheKey = `${provider}:${config.primaryModel}`;

      // Check cache first
      if (this.healthCache.has(cacheKey)) {
        const cached = this.healthCache.get(cacheKey)!;
        if (Date.now() - cached.lastChecked.getTime() < 60000) {
          // 1 minute cache
          healthStatuses[provider] = cached;
          continue;
        }
      }

      // Perform health check
      const healthStatus = await this.performHealthCheck(provider, config.primaryModel);
      healthStatuses[provider] = healthStatus;

      // Cache result
      this.healthCache.set(cacheKey, healthStatus);
    }

    return healthStatuses;
  }

  /**
   * Perform health check for specific provider
   */
  private async performHealthCheck(
    provider: ProviderType,
    model: string
  ): Promise<ProviderHealthStatus> {
    const startTime = Date.now();

    try {
      // Get default config for the provider
      const defaultConfig = this.providerFactory.getDefaultConfig(provider);

      // Create provider config for health check
      const providerConfig = {
        ...defaultConfig,
        provider,
        model,
        apiKey: process.env[`${provider.toUpperCase()}_API_KEY`] || 'dummy-key-for-health-check',
      };

      // Get or create provider instance
      const providerInstance = await this.providerFactory.getOrCreateProvider(
        `${provider}-${model}-health-check`,
        providerConfig
      );

      // Simple health check with test message
      const testResponse = await providerInstance.chat({
        messages: [
          { role: 'user', content: 'Hello, this is a health check. Please respond with "OK".' },
        ],
        model,
        maxTokens: 10,
        temperature: 0,
      });

      const responseTime = Date.now() - startTime;

      return {
        provider,
        model,
        status: responseTime < 10000 ? 'healthy' : 'degraded',
        responseTime,
        successRate: 1.0,
        lastChecked: new Date(),
        errorCount: 0,
      };
    } catch (error) {
      return {
        provider,
        model,
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        successRate: 0,
        lastChecked: new Date(),
        errorCount: 1,
        lastError: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get provider metrics for agent
   */
  public getAgentProviderMetrics(agentId: string): ProviderMetrics[] {
    const metrics: ProviderMetrics[] = [];

    // Get all metrics for this agent
    for (const [key, metric] of this.metricsCache.entries()) {
      if (key.startsWith(`${agentId}:`)) {
        metrics.push(metric);
      }
    }

    return metrics;
  }

  /**
   * Update provider metrics
   */
  public updateProviderMetrics(
    agentId: string,
    provider: ProviderType,
    model: string,
    responseTime: number,
    cost: number,
    success: boolean
  ): void {
    const key = `${agentId}:${provider}:${model}`;
    const existing = this.metricsCache.get(key) || {
      provider,
      model,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      totalCost: 0,
      averageCost: 0,
      lastUsed: new Date(),
      currentStatus: 'inactive' as const,
    };

    existing.totalRequests++;
    if (success) {
      existing.successfulRequests++;
      existing.averageResponseTime =
        (existing.averageResponseTime * (existing.successfulRequests - 1) + responseTime) /
        existing.successfulRequests;
    } else {
      existing.failedRequests++;
    }

    existing.totalCost += cost;
    existing.averageCost = existing.totalCost / existing.totalRequests;
    existing.lastUsed = new Date();
    existing.currentStatus = success ? 'active' : 'error';

    this.metricsCache.set(key, existing);
  }

  /**
   * Record provider switch
   */
  public recordProviderSwitch(
    agentId: string,
    fromProvider: ProviderType,
    fromModel: string,
    toProvider: ProviderType,
    toModel: string,
    reason: string,
    success: boolean,
    responseTime?: number,
    cost?: number
  ): void {
    if (!this.switchHistory.has(agentId)) {
      this.switchHistory.set(agentId, []);
    }

    const history = this.switchHistory.get(agentId)!;
    history.push({
      timestamp: new Date(),
      fromProvider,
      fromModel,
      toProvider,
      toModel,
      reason,
      success,
      responseTime,
      cost,
    });

    // Keep only last 50 switches
    if (history.length > 50) {
      history.shift();
    }
  }

  /**
   * Get switch history for agent
   */
  public getAgentSwitchHistory(agentId: string, limit: number = 10): SwitchHistoryEntry[] {
    const history = this.switchHistory.get(agentId) || [];
    return history.slice(-limit).reverse();
  }

  /**
   * Check if provider switch is allowed
   */
  public canSwitchProvider(agentId: string): boolean {
    const history = this.switchHistory.get(agentId) || [];
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Count switches in the last hour
    const recentSwitches = history.filter(entry => entry.timestamp > oneHourAgo);

    return recentSwitches.length < 10; // Max 10 switches per hour
  }

  /**
   * Get cost summary for agent
   */
  public getAgentCostSummary(agentId: string): {
    totalCost: number;
    dailyCost: number;
    monthlyCost: number;
    averageCostPerRequest: number;
    costByProvider: Record<string, number>;
  } {
    const metrics = this.getAgentProviderMetrics(agentId);

    const totalCost = metrics.reduce((sum, metric) => sum + metric.totalCost, 0);
    const totalRequests = metrics.reduce((sum, metric) => sum + metric.totalRequests, 0);

    const costByProvider: Record<string, number> = {};
    for (const metric of metrics) {
      costByProvider[metric.provider] = (costByProvider[metric.provider] || 0) + metric.totalCost;
    }

    return {
      totalCost,
      dailyCost: totalCost, // TODO: Calculate actual daily cost
      monthlyCost: totalCost, // TODO: Calculate actual monthly cost
      averageCostPerRequest: totalRequests > 0 ? totalCost / totalRequests : 0,
      costByProvider,
    };
  }

  /**
   * Parse fallback providers from string
   */
  private parseFallbackProviders(fallbackModel?: string | null): ProviderType[] {
    if (!fallbackModel) return [];

    try {
      const parsed = JSON.parse(fallbackModel);
      if (Array.isArray(parsed)) {
        return parsed.filter(p => ['openai', 'anthropic', 'google'].includes(p));
      }
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Parse fallback models from string
   */
  private parseFallbackModels(fallbackModel?: string | null): Record<ProviderType, string> {
    const defaults: Record<ProviderType, string> = {
      openai: 'gpt-3.5-turbo',
      anthropic: 'claude-3-haiku-20240307',
      google: 'gemini-pro',
    };

    if (!fallbackModel) return defaults;

    try {
      const parsed = JSON.parse(fallbackModel);
      return { ...defaults, ...parsed };
    } catch {
      return defaults;
    }
  }

  /**
   * Serialize fallback models to string
   */
  private serializeFallbackModels(fallbackModels: Record<ProviderType, string>): string {
    return JSON.stringify(fallbackModels);
  }

  /**
   * Clear cache for agent
   */
  public clearAgentCache(agentId: string): void {
    this.configCache.delete(agentId);

    // Clear health cache
    for (const [key] of this.healthCache.entries()) {
      if (key.includes(agentId)) {
        this.healthCache.delete(key);
      }
    }

    // Clear metrics cache
    for (const [key] of this.metricsCache.entries()) {
      if (key.startsWith(`${agentId}:`)) {
        this.metricsCache.delete(key);
      }
    }
  }

  /**
   * Get performance comparison between providers
   */
  public getProviderComparison(agentId: string): {
    provider: ProviderType;
    model: string;
    averageResponseTime: number;
    successRate: number;
    averageCost: number;
    totalRequests: number;
    score: number;
  }[] {
    const metrics = this.getAgentProviderMetrics(agentId);

    return metrics
      .map(metric => {
        // Calculate composite score
        const responseTimeScore = Math.max(0, 1 - metric.averageResponseTime / 10000);
        const successRateScore = metric.successfulRequests / metric.totalRequests;
        const costScore = Math.max(0, 1 - metric.averageCost / 0.01);

        const score = (responseTimeScore * 0.4 + successRateScore * 0.4 + costScore * 0.2) * 100;

        return {
          provider: metric.provider,
          model: metric.model,
          averageResponseTime: metric.averageResponseTime,
          successRate: metric.successfulRequests / metric.totalRequests,
          averageCost: metric.averageCost,
          totalRequests: metric.totalRequests,
          score: Math.round(score),
        };
      })
      .sort((a, b) => b.score - a.score);
  }
}
