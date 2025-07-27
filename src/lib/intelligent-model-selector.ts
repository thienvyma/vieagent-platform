/**
 * 🧠 Intelligent Model Selector
 *
 * Advanced system for dynamic provider and model selection based on:
 * - Message context and complexity
 * - Performance requirements
 * - Cost optimization
 * - Provider availability
 *
 * DAY 20 - Model Switching Implementation
 */

import { ProviderFactory } from './providers/ProviderFactory';
import type {
  IModelProvider,
  ProviderType,
  ProviderConfig,
  ProviderCapabilities,
} from './providers/IModelProvider';

export interface ModelSelectionContext {
  // Message characteristics
  messageText: string;
  messageLength: number;
  messageComplexity: 'simple' | 'medium' | 'complex' | 'expert';

  // User requirements
  maxResponseTime?: number; // milliseconds
  maxCostPerMessage?: number; // dollars
  qualityPriority: 'cost' | 'speed' | 'quality' | 'balanced';

  // Agent context
  agentId: string;
  userId: string;
  conversationHistory?: Array<{
    provider: string;
    model: string;
    responseTime: number;
    cost: number;
    quality: number;
  }>;

  // System context
  currentLoad?: number; // 0-1
  availableProviders: ProviderType[];

  // Special requirements
  requiresStreaming?: boolean;
  requiresFunctionCalling?: boolean;
  requiresVision?: boolean;
  requiresLongContext?: boolean;
}

export interface ModelSelection {
  provider: ProviderType;
  model: string;
  reason: string;
  confidence: number; // 0-1
  estimatedCost: number;
  estimatedResponseTime: number;
  fallbacks: Array<{
    provider: ProviderType;
    model: string;
    reason: string;
  }>;
  metadata: {
    selectionMethod: string;
    factors: string[];
    alternatives: number;
  };
}

export interface ModelPerformanceData {
  provider: ProviderType;
  model: string;
  averageResponseTime: number;
  averageCost: number;
  qualityScore: number;
  successRate: number;
  lastUsed: Date;
  usageCount: number;
}

export class IntelligentModelSelector {
  private static instance: IntelligentModelSelector;
  private providerFactory: ProviderFactory;
  private performanceHistory: Map<string, ModelPerformanceData> = new Map();

  // Model configurations
  private modelConfigs: Map<
    string,
    {
      provider: ProviderType;
      model: string;
      capabilities: ProviderCapabilities;
      costPerToken: number;
      averageResponseTime: number;
      qualityScore: number;
      useCases: string[];
    }
  > = new Map();

  // Selection weights
  private selectionWeights = {
    cost: 0.3,
    speed: 0.3,
    quality: 0.4,
    availability: 0.2,
    pastPerformance: 0.3,
  };

  private constructor() {
    this.providerFactory = ProviderFactory.getInstance();
    this.initializeModelConfigs();
  }

  public static getInstance(): IntelligentModelSelector {
    if (!IntelligentModelSelector.instance) {
      IntelligentModelSelector.instance = new IntelligentModelSelector();
    }
    return IntelligentModelSelector.instance;
  }

  // =============================================================================
  // INITIALIZATION
  // =============================================================================

  private initializeModelConfigs(): void {
    // OpenAI Models
    this.modelConfigs.set('openai:gpt-4o', {
      provider: 'openai',
      model: 'gpt-4o',
      capabilities: {
        supportedModels: ['gpt-4o'],
        maxTokens: 128000,
        supportsStreaming: true,
        supportsEmbedding: false,
        supportsFunctionCalling: true,
        supportsImageInput: true,
        supportsJsonMode: true,
        rateLimits: { requestsPerMinute: 500, tokensPerMinute: 160000 },
      },
      costPerToken: 0.000005, // $5 per 1M tokens
      averageResponseTime: 2000,
      qualityScore: 0.95,
      useCases: ['complex reasoning', 'code generation', 'analysis', 'creative writing'],
    });

    this.modelConfigs.set('openai:gpt-4o-mini', {
      provider: 'openai',
      model: 'gpt-4o-mini',
      capabilities: {
        supportedModels: ['gpt-4o-mini'],
        maxTokens: 128000,
        supportsStreaming: true,
        supportsEmbedding: false,
        supportsFunctionCalling: true,
        supportsImageInput: true,
        supportsJsonMode: true,
        rateLimits: { requestsPerMinute: 500, tokensPerMinute: 160000 },
      },
      costPerToken: 0.00000015, // $0.15 per 1M tokens
      averageResponseTime: 1500,
      qualityScore: 0.85,
      useCases: ['general chat', 'simple tasks', 'quick responses'],
    });

    this.modelConfigs.set('openai:gpt-3.5-turbo', {
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      capabilities: {
        supportedModels: ['gpt-3.5-turbo'],
        maxTokens: 16384,
        supportsStreaming: true,
        supportsEmbedding: false,
        supportsFunctionCalling: true,
        supportsImageInput: false,
        supportsJsonMode: true,
        rateLimits: { requestsPerMinute: 3500, tokensPerMinute: 160000 },
      },
      costPerToken: 0.000001, // $1 per 1M tokens
      averageResponseTime: 1000,
      qualityScore: 0.8,
      useCases: ['fast responses', 'simple chat', 'basic tasks'],
    });

    // Anthropic Models
    this.modelConfigs.set('anthropic:claude-3-5-sonnet-20241022', {
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022',
      capabilities: {
        supportedModels: ['claude-3-5-sonnet-20241022'],
        maxTokens: 200000,
        supportsStreaming: true,
        supportsEmbedding: false,
        supportsFunctionCalling: true,
        supportsImageInput: true,
        supportsJsonMode: false,
        rateLimits: { requestsPerMinute: 1000, tokensPerMinute: 80000 },
      },
      costPerToken: 0.000003, // $3 per 1M tokens
      averageResponseTime: 2500,
      qualityScore: 0.98,
      useCases: ['complex reasoning', 'analysis', 'research', 'long-form content'],
    });

    this.modelConfigs.set('anthropic:claude-3-haiku-20240307', {
      provider: 'anthropic',
      model: 'claude-3-haiku-20240307',
      capabilities: {
        supportedModels: ['claude-3-haiku-20240307'],
        maxTokens: 200000,
        supportsStreaming: true,
        supportsEmbedding: false,
        supportsFunctionCalling: true,
        supportsImageInput: true,
        supportsJsonMode: false,
        rateLimits: { requestsPerMinute: 1000, tokensPerMinute: 80000 },
      },
      costPerToken: 0.00000025, // $0.25 per 1M tokens
      averageResponseTime: 800,
      qualityScore: 0.82,
      useCases: ['fast responses', 'simple tasks', 'quick analysis'],
    });

    // Google Models
    this.modelConfigs.set('google:gemini-1.5-flash', {
      provider: 'google',
      model: 'gemini-1.5-flash',
      capabilities: {
        supportedModels: ['gemini-1.5-flash'],
        maxTokens: 1048576,
        supportsStreaming: true,
        supportsEmbedding: false,
        supportsFunctionCalling: true,
        supportsImageInput: true,
        supportsJsonMode: true,
        rateLimits: { requestsPerMinute: 1000, tokensPerMinute: 1000000 },
      },
      costPerToken: 0.000000075, // $0.075 per 1M tokens
      averageResponseTime: 600,
      qualityScore: 0.78,
      useCases: ['fast responses', 'high throughput', 'cost optimization'],
    });

    this.modelConfigs.set('google:gemini-1.5-pro', {
      provider: 'google',
      model: 'gemini-1.5-pro',
      capabilities: {
        supportedModels: ['gemini-1.5-pro'],
        maxTokens: 2097152,
        supportsStreaming: true,
        supportsEmbedding: false,
        supportsFunctionCalling: true,
        supportsImageInput: true,
        supportsJsonMode: true,
        rateLimits: { requestsPerMinute: 360, tokensPerMinute: 120000 },
      },
      costPerToken: 0.000001, // $1 per 1M tokens
      averageResponseTime: 1800,
      qualityScore: 0.88,
      useCases: ['complex reasoning', 'long context', 'multimodal tasks'],
    });
  }

  // =============================================================================
  // CORE SELECTION LOGIC
  // =============================================================================

  public async selectModel(context: ModelSelectionContext): Promise<ModelSelection> {
    console.log('🧠 Starting intelligent model selection...');

    // Analyze message complexity
    const complexity = this.analyzeMessageComplexity(context.messageText);
    context.messageComplexity = complexity;

    // Get available models
    const availableModels = this.getAvailableModels(context.availableProviders);

    // Score each model
    const modelScores = await this.scoreModels(availableModels, context);

    // Sort by score (highest first)
    const rankedModels = modelScores.sort((a, b) => b.score - a.score);

    // Select best model
    const selectedModel = rankedModels[0];

    // Prepare fallbacks
    const fallbacks = rankedModels.slice(1, 4).map(model => ({
      provider: model.provider,
      model: model.model,
      reason: `Fallback option (score: ${model.score.toFixed(2)})`,
    }));

    const selection: ModelSelection = {
      provider: selectedModel.provider,
      model: selectedModel.model,
      reason: selectedModel.reason,
      confidence: selectedModel.score,
      estimatedCost: selectedModel.estimatedCost,
      estimatedResponseTime: selectedModel.estimatedResponseTime,
      fallbacks,
      metadata: {
        selectionMethod: 'intelligent_scoring',
        factors: selectedModel.factors,
        alternatives: rankedModels.length,
      },
    };

    console.log(
      `🎯 Selected: ${selection.provider}:${selection.model} (confidence: ${(selection.confidence * 100).toFixed(1)}%)`
    );

    return selection;
  }

  // =============================================================================
  // SCORING SYSTEM
  // =============================================================================

  private async scoreModels(
    availableModels: Array<{ provider: ProviderType; model: string }>,
    context: ModelSelectionContext
  ): Promise<
    Array<{
      provider: ProviderType;
      model: string;
      score: number;
      reason: string;
      estimatedCost: number;
      estimatedResponseTime: number;
      factors: string[];
    }>
  > {
    const scores = [];

    for (const { provider, model } of availableModels) {
      const modelKey = `${provider}:${model}`;
      const config = this.modelConfigs.get(modelKey);

      if (!config) continue;

      const score = await this.calculateModelScore(config, context);
      scores.push(score);
    }

    return scores;
  }

  private async calculateModelScore(
    config: any,
    context: ModelSelectionContext
  ): Promise<{
    provider: ProviderType;
    model: string;
    score: number;
    reason: string;
    estimatedCost: number;
    estimatedResponseTime: number;
    factors: string[];
  }> {
    const factors: string[] = [];
    let totalScore = 0;

    // 1. Quality Score (based on model capabilities)
    const qualityScore = this.calculateQualityScore(config, context);
    totalScore += qualityScore * this.selectionWeights.quality;
    factors.push(`Quality: ${(qualityScore * 100).toFixed(0)}%`);

    // 2. Cost Score (lower cost = higher score)
    const costScore = this.calculateCostScore(config, context);
    totalScore += costScore * this.selectionWeights.cost;
    factors.push(`Cost: ${(costScore * 100).toFixed(0)}%`);

    // 3. Speed Score (faster = higher score)
    const speedScore = this.calculateSpeedScore(config, context);
    totalScore += speedScore * this.selectionWeights.speed;
    factors.push(`Speed: ${(speedScore * 100).toFixed(0)}%`);

    // 4. Availability Score
    const availabilityScore = await this.calculateAvailabilityScore(config);
    totalScore += availabilityScore * this.selectionWeights.availability;
    factors.push(`Availability: ${(availabilityScore * 100).toFixed(0)}%`);

    // 5. Past Performance Score
    const performanceScore = this.calculatePastPerformanceScore(config);
    totalScore += performanceScore * this.selectionWeights.pastPerformance;
    factors.push(`Past Performance: ${(performanceScore * 100).toFixed(0)}%`);

    // 6. Context Matching Score
    const contextScore = this.calculateContextMatchingScore(config, context);
    totalScore += contextScore * 0.2; // Additional weight for context matching
    factors.push(`Context Match: ${(contextScore * 100).toFixed(0)}%`);

    // Normalize score
    const normalizedScore = Math.min(totalScore, 1.0);

    // Estimate cost and response time
    const estimatedTokens = Math.max(context.messageLength / 4, 100); // Rough token estimation
    const estimatedCost = estimatedTokens * config.costPerToken;
    const estimatedResponseTime = config.averageResponseTime;

    // Generate reason
    const reason = this.generateSelectionReason(config, context, normalizedScore, factors);

    return {
      provider: config.provider,
      model: config.model,
      score: normalizedScore,
      reason,
      estimatedCost,
      estimatedResponseTime,
      factors,
    };
  }

  // =============================================================================
  // SCORING METHODS
  // =============================================================================

  private calculateQualityScore(config: any, context: ModelSelectionContext): number {
    let score = config.qualityScore;

    // Adjust based on complexity requirements
    if (context.messageComplexity === 'expert' && config.qualityScore < 0.9) {
      score *= 0.7; // Penalize lower quality models for expert tasks
    } else if (context.messageComplexity === 'simple' && config.qualityScore > 0.9) {
      score *= 0.9; // Slight penalty for overkill
    }

    // Adjust based on quality priority
    if (context.qualityPriority === 'quality') {
      score *= 1.2;
    } else if (context.qualityPriority === 'cost') {
      score *= 0.8;
    }

    return Math.min(score, 1.0);
  }

  private calculateCostScore(config: any, context: ModelSelectionContext): number {
    const estimatedTokens = Math.max(context.messageLength / 4, 100);
    const estimatedCost = estimatedTokens * config.costPerToken;

    // Normalize cost score (lower cost = higher score)
    const maxCost = context.maxCostPerMessage || 0.01; // $0.01 default max
    const costScore = Math.max(0, (maxCost - estimatedCost) / maxCost);

    // Adjust based on cost priority
    if (context.qualityPriority === 'cost') {
      return Math.min(costScore * 1.5, 1.0);
    } else if (context.qualityPriority === 'quality') {
      return costScore * 0.7;
    }

    return costScore;
  }

  private calculateSpeedScore(config: any, context: ModelSelectionContext): number {
    const maxTime = context.maxResponseTime || 5000; // 5 seconds default
    const speedScore = Math.max(0, (maxTime - config.averageResponseTime) / maxTime);

    // Adjust based on speed priority
    if (context.qualityPriority === 'speed') {
      return Math.min(speedScore * 1.5, 1.0);
    } else if (context.qualityPriority === 'quality') {
      return speedScore * 0.8;
    }

    return speedScore;
  }

  private async calculateAvailabilityScore(config: any): Promise<number> {
    try {
      // Check if provider is available
      const provider = await this.providerFactory.getOrCreateProvider(`${config.provider}_temp`, {
        provider: config.provider,
        model: config.model,
        apiKey: 'test',
      });

      const health = await provider.healthCheck();
      return health.status === 'healthy' ? 1.0 : 0.3;
    } catch (error) {
      return 0.1; // Very low score for unavailable providers
    }
  }

  private calculatePastPerformanceScore(config: any): number {
    const modelKey = `${config.provider}:${config.model}`;
    const performance = this.performanceHistory.get(modelKey);

    if (!performance) {
      return 0.5; // Neutral score for unknown performance
    }

    // Combine success rate and quality score
    return performance.successRate * 0.7 + performance.qualityScore * 0.3;
  }

  private calculateContextMatchingScore(config: any, context: ModelSelectionContext): number {
    let score = 0.5; // Base score

    // Check use case matching
    const messageType = this.classifyMessageType(context.messageText);
    const matchingUseCases = config.useCases.filter((useCase: string) =>
      messageType.includes(useCase.toLowerCase())
    );

    if (matchingUseCases.length > 0) {
      score += 0.3;
    }

    // Check capability requirements
    if (context.requiresStreaming && config.capabilities.supportsStreaming) {
      score += 0.1;
    }
    if (context.requiresFunctionCalling && config.capabilities.supportsFunctionCalling) {
      score += 0.1;
    }
    if (context.requiresVision && config.capabilities.supportsImageInput) {
      score += 0.1;
    }
    if (context.requiresLongContext && config.capabilities.maxTokens > 50000) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private analyzeMessageComplexity(message: string): 'simple' | 'medium' | 'complex' | 'expert' {
    const length = message.length;

    // Keywords that indicate complexity
    const complexKeywords = [
      'analyze',
      'explain',
      'compare',
      'evaluate',
      'synthesize',
      'research',
      'algorithm',
      'implementation',
      'architecture',
      'strategy',
      'methodology',
    ];

    const expertKeywords = [
      'optimize',
      'refactor',
      'debug',
      'performance',
      'scalability',
      'security',
      'design pattern',
      'best practice',
      'trade-off',
      'technical debt',
    ];

    const messageLower = message.toLowerCase();

    // Check for expert-level keywords
    if (expertKeywords.some(keyword => messageLower.includes(keyword))) {
      return 'expert';
    }

    // Check for complex keywords
    if (complexKeywords.some(keyword => messageLower.includes(keyword))) {
      return 'complex';
    }

    // Length-based classification
    if (length > 500) {
      return 'complex';
    } else if (length > 200) {
      return 'medium';
    } else {
      return 'simple';
    }
  }

  private classifyMessageType(message: string): string {
    const messageLower = message.toLowerCase();

    if (messageLower.includes('code') || messageLower.includes('program')) {
      return 'code generation';
    } else if (messageLower.includes('analyze') || messageLower.includes('explain')) {
      return 'analysis';
    } else if (messageLower.includes('write') || messageLower.includes('create')) {
      return 'creative writing';
    } else if (messageLower.includes('calculate') || messageLower.includes('math')) {
      return 'calculation';
    } else {
      return 'general chat';
    }
  }

  private getAvailableModels(
    providers: ProviderType[]
  ): Array<{ provider: ProviderType; model: string }> {
    const models = [];

    for (const [modelKey, config] of this.modelConfigs) {
      if (providers.includes(config.provider)) {
        models.push({
          provider: config.provider,
          model: config.model,
        });
      }
    }

    return models;
  }

  private generateSelectionReason(
    config: any,
    context: ModelSelectionContext,
    score: number,
    factors: string[]
  ): string {
    const reasons = [];

    if (score > 0.8) {
      reasons.push('Excellent match for requirements');
    } else if (score > 0.6) {
      reasons.push('Good match for requirements');
    } else {
      reasons.push('Acceptable match for requirements');
    }

    if (context.qualityPriority === 'cost' && config.costPerToken < 0.000001) {
      reasons.push('optimized for cost');
    } else if (context.qualityPriority === 'speed' && config.averageResponseTime < 1500) {
      reasons.push('optimized for speed');
    } else if (context.qualityPriority === 'quality' && config.qualityScore > 0.9) {
      reasons.push('optimized for quality');
    }

    return reasons.join(', ');
  }

  // =============================================================================
  // PERFORMANCE TRACKING
  // =============================================================================

  public recordPerformance(
    provider: ProviderType,
    model: string,
    responseTime: number,
    cost: number,
    quality: number,
    success: boolean
  ): void {
    const modelKey = `${provider}:${model}`;
    const existing = this.performanceHistory.get(modelKey);

    if (existing) {
      // Update existing performance data
      existing.averageResponseTime =
        (existing.averageResponseTime * existing.usageCount + responseTime) /
        (existing.usageCount + 1);
      existing.averageCost =
        (existing.averageCost * existing.usageCount + cost) / (existing.usageCount + 1);
      existing.qualityScore =
        (existing.qualityScore * existing.usageCount + quality) / (existing.usageCount + 1);
      existing.successRate =
        (existing.successRate * existing.usageCount + (success ? 1 : 0)) /
        (existing.usageCount + 1);
      existing.usageCount++;
      existing.lastUsed = new Date();
    } else {
      // Create new performance data
      this.performanceHistory.set(modelKey, {
        provider,
        model,
        averageResponseTime: responseTime,
        averageCost: cost,
        qualityScore: quality,
        successRate: success ? 1 : 0,
        lastUsed: new Date(),
        usageCount: 1,
      });
    }
  }

  public getPerformanceHistory(): Map<string, ModelPerformanceData> {
    return new Map(this.performanceHistory);
  }

  public updateSelectionWeights(weights: Partial<typeof this.selectionWeights>): void {
    this.selectionWeights = { ...this.selectionWeights, ...weights };
  }

  public getModelConfigs(): Map<string, any> {
    return new Map(this.modelConfigs);
  }
}

// Export singleton instance
export const intelligentModelSelector = IntelligentModelSelector.getInstance();
