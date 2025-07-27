/**
 * 🎯 Runtime Provider Selector - Day 20 Step 20.2
 * Intelligent provider selection with cost tracking and performance optimization
 */

import { ProviderFactory } from './providers/ProviderFactory';
import {
  IModelProvider,
  ChatRequest,
  ChatResponse,
  ProviderType,
} from './providers/IModelProvider';
import { AgentProviderConfigService } from './agent-provider-config';

export interface SelectionContext {
  agentId: string;
  userId: string;
  conversationId?: string;
  messageCount: number;
  messageComplexity: 'simple' | 'medium' | 'complex';
  messageLength: number;
  requiresSpecialCapabilities?: string[];
  maxResponseTime?: number;
  maxCostPerMessage?: number;
  enableCostOptimization?: boolean;
  enablePerformanceOptimization?: boolean;
  conversationHistory: ConversationMetrics[];
}

export interface ConversationMetrics {
  provider: string;
  model: string;
  responseTime: number;
  cost: number;
  success: boolean;
}

export interface ProviderSelection {
  provider: ProviderType;
  model: string;
  reason: string;
  confidence: number;
  estimatedCost: number;
  estimatedResponseTime: number;
  capabilities: string[];
  fallbacks: ProviderSelection[];
}

export interface SelectionAnalytics {
  totalSelections: number;
  providerDistribution: Record<string, number>;
  averageResponseTime: number;
  averageCost: number;
  successRate: number;
  fallbackUsage: number;
  costSavings: number;
  performanceGains: number;
}

export class RuntimeProviderSelector {
  private static instance: RuntimeProviderSelector;
  private providerFactory: ProviderFactory;
  private configService: AgentProviderConfigService;
  private selectionHistory: Map<string, ProviderSelection[]> = new Map();
  private performanceCache: Map<string, PerformanceMetrics> = new Map();
  private costCache: Map<string, CostMetrics> = new Map();

  private constructor() {
    this.providerFactory = ProviderFactory.getInstance();
    this.configService = AgentProviderConfigService.getInstance();
  }

  public static getInstance(): RuntimeProviderSelector {
    if (!RuntimeProviderSelector.instance) {
      RuntimeProviderSelector.instance = new RuntimeProviderSelector();
    }
    return RuntimeProviderSelector.instance;
  }

  /**
   * Select optimal provider for chat request
   */
  public async selectProviderForChat(
    context: SelectionContext,
    forceProvider?: string
  ): Promise<ProviderSelection> {
    const startTime = Date.now();

    try {
      // Get agent configuration
      const agentConfig = await this.configService.getAgentProviderConfig(context.agentId);

      // Force specific provider if requested
      if (forceProvider) {
        return await this.createForcedSelection(forceProvider, context, agentConfig);
      }

      // Get available providers
      const availableProviders = await this.getAvailableProviders(context.agentId);

      if (availableProviders.length === 0) {
        throw new Error('No providers available');
      }

      // Score and rank providers
      const scoredProviders = await this.scoreProviders(availableProviders, context, agentConfig);

      // Select best provider
      const bestProvider = scoredProviders[0];
      const fallbacks = scoredProviders.slice(1, 4); // Top 3 fallbacks

      const selection: ProviderSelection = {
        provider: bestProvider.provider,
        model: bestProvider.model,
        reason: bestProvider.reason,
        confidence: bestProvider.score,
        estimatedCost: bestProvider.estimatedCost,
        estimatedResponseTime: bestProvider.estimatedResponseTime,
        capabilities: bestProvider.capabilities,
        fallbacks: fallbacks.map(f => ({
          provider: f.provider,
          model: f.model,
          reason: f.reason,
          confidence: f.score,
          estimatedCost: f.estimatedCost,
          estimatedResponseTime: f.estimatedResponseTime,
          capabilities: f.capabilities,
          fallbacks: [],
        })),
      };

      // Cache selection
      this.cacheSelection(context.agentId, selection);

      // Update analytics
      await this.updateSelectionAnalytics(context.agentId, selection, Date.now() - startTime);

      return selection;
    } catch (error) {
      console.error('Provider selection failed:', error);

      // Fallback to default provider
      return await this.getDefaultSelection(context);
    }
  }

  /**
   * Execute chat with selected provider
   */
  public async executeChatWithSelection(
    selection: ProviderSelection,
    chatRequest: ChatRequest,
    context: SelectionContext
  ): Promise<ChatResponse & { metrics?: any }> {
    const startTime = Date.now();
    let lastError: Error | null = null;

    // Try primary selection
    try {
      // Get default config for the provider
      const defaultConfig = this.providerFactory.getDefaultConfig(selection.provider);

      // Create provider config
      const providerConfig = {
        ...defaultConfig,
        provider: selection.provider,
        model: selection.model,
        apiKey: process.env[`${selection.provider.toUpperCase()}_API_KEY`] || '',
      };

      // Get or create provider instance
      const provider = await this.providerFactory.getOrCreateProvider(
        `${selection.provider}-${selection.model}-runtime`,
        providerConfig
      );

      const response = await provider.chat(chatRequest);

      // Update performance metrics
      await this.updatePerformanceMetrics(
        selection.provider,
        selection.model,
        Date.now() - startTime,
        response.usage.totalTokens,
        response.cost || 0,
        true
      );

      return {
        ...response,
        metrics: {
          selectionTime: 0,
          executionTime: Date.now() - startTime,
          fallbackUsed: false,
          qualityScore: this.calculateQualityScore(response),
        },
      };
    } catch (error) {
      lastError = error as Error;
      console.warn(`Primary provider ${selection.provider} failed:`, error);

      // Update failure metrics
      await this.updatePerformanceMetrics(
        selection.provider,
        selection.model,
        Date.now() - startTime,
        0,
        0,
        false
      );
    }

    // Try fallback providers
    for (const fallback of selection.fallbacks) {
      try {
        // Get default config for the fallback provider
        const defaultConfig = this.providerFactory.getDefaultConfig(fallback.provider);

        // Create provider config
        const providerConfig = {
          ...defaultConfig,
          provider: fallback.provider,
          model: fallback.model,
          apiKey: process.env[`${fallback.provider.toUpperCase()}_API_KEY`] || '',
        };

        // Get or create provider instance
        const provider = await this.providerFactory.getOrCreateProvider(
          `${fallback.provider}-${fallback.model}-runtime`,
          providerConfig
        );

        const response = await provider.chat(chatRequest);

        // Update performance metrics
        await this.updatePerformanceMetrics(
          fallback.provider,
          fallback.model,
          Date.now() - startTime,
          response.usage.totalTokens,
          response.cost || 0,
          true
        );

        return {
          ...response,
          metrics: {
            selectionTime: 0,
            executionTime: Date.now() - startTime,
            fallbackUsed: true,
            fallbackProvider: fallback.provider,
            qualityScore: this.calculateQualityScore(response),
          },
        };
      } catch (error) {
        lastError = error as Error;
        console.warn(`Fallback provider ${fallback.provider} failed:`, error);

        // Update failure metrics
        await this.updatePerformanceMetrics(
          fallback.provider,
          fallback.model,
          Date.now() - startTime,
          0,
          0,
          false
        );
      }
    }

    // All providers failed
    throw new Error(`All providers failed. Last error: ${lastError?.message}`);
  }

  /**
   * Get selection analytics for agent
   */
  public getSelectionAnalytics(agentId: string): SelectionAnalytics {
    const history = this.selectionHistory.get(agentId) || [];

    if (history.length === 0) {
      return {
        totalSelections: 0,
        providerDistribution: {},
        averageResponseTime: 0,
        averageCost: 0,
        successRate: 0,
        fallbackUsage: 0,
        costSavings: 0,
        performanceGains: 0,
      };
    }

    const providerDistribution: Record<string, number> = {};
    let totalCost = 0;
    let totalResponseTime = 0;

    for (const selection of history) {
      providerDistribution[selection.provider] =
        (providerDistribution[selection.provider] || 0) + 1;
      totalCost += selection.estimatedCost;
      totalResponseTime += selection.estimatedResponseTime;
    }

    return {
      totalSelections: history.length,
      providerDistribution,
      averageResponseTime: totalResponseTime / history.length,
      averageCost: totalCost / history.length,
      successRate: 0.95, // TODO: Calculate from actual success metrics
      fallbackUsage: 0.05, // TODO: Calculate from actual fallback usage
      costSavings: this.calculateCostSavings(agentId),
      performanceGains: this.calculatePerformanceGains(agentId),
    };
  }

  /**
   * Score providers based on context
   */
  private async scoreProviders(
    providers: ProviderInfo[],
    context: SelectionContext,
    agentConfig: any
  ): Promise<ScoredProvider[]> {
    const scored: ScoredProvider[] = [];

    for (const provider of providers) {
      const score = await this.calculateProviderScore(provider, context, agentConfig);
      scored.push({
        ...provider,
        score,
        reason: this.generateSelectionReason(provider, score, context),
      });
    }

    // Sort by score (highest first)
    return scored.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate provider score based on multiple factors
   */
  private async calculateProviderScore(
    provider: ProviderInfo,
    context: SelectionContext,
    agentConfig: any
  ): Promise<number> {
    let score = 0;

    // Base capability score (0-30 points)
    score += this.scoreCapabilities(provider, context) * 30;

    // Performance score (0-25 points)
    score += (await this.scorePerformance(provider, context)) * 25;

    // Cost score (0-20 points)
    score += this.scoreCost(provider, context) * 20;

    // Reliability score (0-15 points)
    score += (await this.scoreReliability(provider, context)) * 15;

    // Agent preference score (0-10 points)
    score += this.scoreAgentPreference(provider, agentConfig) * 10;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Score provider capabilities
   */
  private scoreCapabilities(provider: ProviderInfo, context: SelectionContext): number {
    let score = 0.5; // Base score

    // Check required capabilities
    if (context.requiresSpecialCapabilities) {
      const hasAllCapabilities = context.requiresSpecialCapabilities.every(cap =>
        provider.capabilities.includes(cap)
      );
      if (hasAllCapabilities) {
        score += 0.3;
      } else {
        score -= 0.2;
      }
    }

    // Message complexity matching
    if (
      context.messageComplexity === 'complex' &&
      provider.capabilities.includes('complex_reasoning')
    ) {
      score += 0.2;
    } else if (
      context.messageComplexity === 'simple' &&
      provider.capabilities.includes('fast_response')
    ) {
      score += 0.1;
    }

    return Math.min(1, Math.max(0, score));
  }

  /**
   * Score provider performance
   */
  private async scorePerformance(
    provider: ProviderInfo,
    context: SelectionContext
  ): Promise<number> {
    const metrics = this.performanceCache.get(`${provider.provider}:${provider.model}`);

    if (!metrics) {
      return 0.5; // Default score for unknown performance
    }

    let score = 0;

    // Response time score
    if (context.maxResponseTime) {
      const timeRatio = metrics.averageResponseTime / context.maxResponseTime;
      score += Math.max(0, 1 - timeRatio) * 0.6;
    } else {
      // Prefer faster responses
      score += Math.max(0, 1 - metrics.averageResponseTime / 10000) * 0.6;
    }

    // Success rate score
    score += metrics.successRate * 0.4;

    return Math.min(1, Math.max(0, score));
  }

  /**
   * Score provider cost
   */
  private scoreCost(provider: ProviderInfo, context: SelectionContext): number {
    if (context.maxCostPerMessage) {
      const costRatio = provider.estimatedCost / context.maxCostPerMessage;
      return Math.max(0, 1 - costRatio);
    }

    // Default cost preference (lower is better)
    const maxReasonableCost = 0.01; // $0.01 per message
    return Math.max(0, 1 - provider.estimatedCost / maxReasonableCost);
  }

  /**
   * Score provider reliability
   */
  private async scoreReliability(
    provider: ProviderInfo,
    context: SelectionContext
  ): Promise<number> {
    const metrics = this.performanceCache.get(`${provider.provider}:${provider.model}`);

    if (!metrics) {
      return 0.5; // Default score
    }

    // Success rate is the main reliability indicator
    return metrics.successRate;
  }

  /**
   * Score agent preference
   */
  private scoreAgentPreference(provider: ProviderInfo, agentConfig: any): number {
    if (!agentConfig) return 0.5;

    // Primary provider preference
    if (provider.provider === agentConfig.primaryProvider) {
      return 1.0;
    }

    // Fallback provider preference
    if (agentConfig.fallbackProviders?.includes(provider.provider)) {
      return 0.7;
    }

    return 0.3;
  }

  /**
   * Generate selection reason
   */
  private generateSelectionReason(
    provider: ProviderInfo,
    score: number,
    context: SelectionContext
  ): string {
    const reasons = [];

    if (score >= 90) {
      reasons.push('Excellent match for requirements');
    } else if (score >= 70) {
      reasons.push('Good match for requirements');
    } else if (score >= 50) {
      reasons.push('Acceptable match');
    } else {
      reasons.push('Fallback option');
    }

    if (
      context.messageComplexity === 'complex' &&
      provider.capabilities.includes('complex_reasoning')
    ) {
      reasons.push('optimized for complex tasks');
    }

    if (provider.estimatedCost < 0.005) {
      reasons.push('cost-effective');
    }

    return reasons.join(', ');
  }

  /**
   * Get available providers for agent
   */
  private async getAvailableProviders(agentId: string): Promise<ProviderInfo[]> {
    const providers: ProviderInfo[] = [];

    // Get available provider types from factory
    const availableProviders = this.providerFactory.getAvailableProviders();

    for (const providerType of availableProviders) {
      try {
        // Get provider info from factory
        const providerInfo = this.providerFactory.getProviderInfo(providerType);
        if (!providerInfo) continue;

        // Get provider capabilities
        const capabilities = this.providerFactory.getProviderCapabilities(providerType);

        // Add different models for each provider
        if (providerType === 'openai') {
          providers.push({
            provider: 'openai',
            model: 'gpt-4',
            capabilities: capabilities?.supportedFeatures || ['chat', 'text_generation'],
            estimatedCost: 0.03,
            estimatedResponseTime: 3000,
          });
          providers.push({
            provider: 'openai',
            model: 'gpt-3.5-turbo',
            capabilities: capabilities?.supportedFeatures || ['chat', 'text_generation'],
            estimatedCost: 0.002,
            estimatedResponseTime: 2000,
          });
        } else if (providerType === 'anthropic') {
          providers.push({
            provider: 'anthropic',
            model: 'claude-3-5-sonnet-20241022',
            capabilities: capabilities?.supportedFeatures || ['chat', 'text_generation'],
            estimatedCost: 0.015,
            estimatedResponseTime: 4000,
          });
          providers.push({
            provider: 'anthropic',
            model: 'claude-3-haiku-20240307',
            capabilities: capabilities?.supportedFeatures || ['chat', 'text_generation'],
            estimatedCost: 0.0025,
            estimatedResponseTime: 1500,
          });
        } else if (providerType === 'google') {
          providers.push({
            provider: 'google',
            model: 'gemini-pro',
            capabilities: capabilities?.supportedFeatures || ['chat', 'text_generation'],
            estimatedCost: 0.001,
            estimatedResponseTime: 2500,
          });
        }
      } catch (error) {
        console.warn(`${providerType} provider not available:`, error);
      }
    }

    return providers;
  }

  /**
   * Create forced selection
   */
  private async createForcedSelection(
    forceProvider: string,
    context: SelectionContext,
    agentConfig: any
  ): Promise<ProviderSelection> {
    const providers = await this.getAvailableProviders(context.agentId);
    const forcedProvider = providers.find(p => p.provider === forceProvider);

    if (!forcedProvider) {
      throw new Error(`Forced provider ${forceProvider} not available`);
    }

    return {
      provider: forcedProvider.provider,
      model: forcedProvider.model,
      reason: `Forced selection: ${forceProvider}`,
      confidence: 1.0,
      estimatedCost: forcedProvider.estimatedCost,
      estimatedResponseTime: forcedProvider.estimatedResponseTime,
      capabilities: forcedProvider.capabilities,
      fallbacks: [],
    };
  }

  /**
   * Get default selection
   */
  private async getDefaultSelection(context: SelectionContext): Promise<ProviderSelection> {
    return {
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      reason: 'Default fallback selection',
      confidence: 0.5,
      estimatedCost: 0.002,
      estimatedResponseTime: 2000,
      capabilities: ['chat', 'text_generation'],
      fallbacks: [],
    };
  }

  /**
   * Cache selection for analytics
   */
  private cacheSelection(agentId: string, selection: ProviderSelection): void {
    if (!this.selectionHistory.has(agentId)) {
      this.selectionHistory.set(agentId, []);
    }

    const history = this.selectionHistory.get(agentId)!;
    history.push(selection);

    // Keep only last 100 selections
    if (history.length > 100) {
      history.shift();
    }
  }

  /**
   * Update selection analytics
   */
  private async updateSelectionAnalytics(
    agentId: string,
    selection: ProviderSelection,
    selectionTime: number
  ): Promise<void> {
    // TODO: Implement analytics storage
    console.log(`Selection analytics for ${agentId}:`, {
      provider: selection.provider,
      model: selection.model,
      selectionTime,
      estimatedCost: selection.estimatedCost,
    });
  }

  /**
   * Update performance metrics
   */
  private async updatePerformanceMetrics(
    provider: ProviderType,
    model: string,
    responseTime: number,
    tokens: number,
    cost: number,
    success: boolean
  ): Promise<void> {
    const key = `${provider}:${model}`;
    const existing = this.performanceCache.get(key) || {
      totalRequests: 0,
      successfulRequests: 0,
      totalResponseTime: 0,
      totalTokens: 0,
      totalCost: 0,
      averageResponseTime: 0,
      successRate: 0,
      lastUsed: new Date(),
    };

    existing.totalRequests++;
    if (success) {
      existing.successfulRequests++;
      existing.totalResponseTime += responseTime;
      existing.totalTokens += tokens;
      existing.totalCost += cost;
    }

    existing.averageResponseTime = existing.totalResponseTime / existing.successfulRequests;
    existing.successRate = existing.successfulRequests / existing.totalRequests;
    existing.lastUsed = new Date();

    this.performanceCache.set(key, existing);
  }

  /**
   * Calculate quality score
   */
  private calculateQualityScore(response: ChatResponse): number {
    let score = 0.8; // Base score

    // Response length (reasonable responses are better)
    if (response.content.length > 50 && response.content.length < 2000) {
      score += 0.1;
    }

    // Finish reason
    if (response.finishReason === 'stop') {
      score += 0.1;
    }

    return Math.min(1, Math.max(0, score));
  }

  /**
   * Calculate cost savings
   */
  private calculateCostSavings(agentId: string): number {
    // TODO: Implement cost savings calculation
    return 0;
  }

  /**
   * Calculate performance gains
   */
  private calculatePerformanceGains(agentId: string): number {
    // TODO: Implement performance gains calculation
    return 0;
  }
}

// Supporting interfaces
interface ProviderInfo {
  provider: ProviderType;
  model: string;
  capabilities: string[];
  estimatedCost: number;
  estimatedResponseTime: number;
}

interface ScoredProvider extends ProviderInfo {
  score: number;
  reason: string;
}

interface PerformanceMetrics {
  totalRequests: number;
  successfulRequests: number;
  totalResponseTime: number;
  totalTokens: number;
  totalCost: number;
  averageResponseTime: number;
  successRate: number;
  lastUsed: Date;
}

interface CostMetrics {
  totalCost: number;
  requestCount: number;
  averageCost: number;
  lastUpdated: Date;
}

/**
 * Analyze message complexity
 */
export function analyzeMessageComplexity(message: string): 'simple' | 'medium' | 'complex' {
  const length = message.length;
  const wordCount = message.split(/\s+/).length;

  // Simple heuristics
  if (length < 50 || wordCount < 10) {
    return 'simple';
  } else if (length > 200 || wordCount > 40) {
    return 'complex';
  } else {
    return 'medium';
  }
}
