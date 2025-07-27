/**
 * 🎯 Model Switching Orchestrator
 *
 * Central orchestrator that integrates all Day 20 components:
 * - Intelligent Model Selection
 * - Cost Tracking & Optimization
 * - Performance Comparison & A/B Testing
 * - Dynamic model switching based on context
 *
 * DAY 20 - Model Switching Implementation
 */

import { intelligentModelSelector } from './intelligent-model-selector';
import { costTrackingService } from './cost-tracking-service';
import { performanceComparisonService } from './performance-comparison-service';
import { multiProviderChatService } from './multi-provider-chat-service';
import type { ModelSelectionContext, ModelSelection } from './intelligent-model-selector';
import type { CostTrackingData, CostOptimizationRecommendation } from './cost-tracking-service';
import type { PerformanceMetric, ABTestConfig } from './performance-comparison-service';
import type {
  MultiProviderChatRequest,
  MultiProviderChatResponse,
} from './multi-provider-chat-service';
import type { ProviderType } from './providers/IModelProvider';

export interface ModelSwitchingRequest {
  // Basic request info
  message: string;
  userId: string;
  agentId: string;
  conversationId?: string;

  // Context information
  messageComplexity?: 'simple' | 'medium' | 'complex' | 'expert';
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
    provider?: string;
    model?: string;
  }>;

  // Requirements
  maxResponseTime?: number;
  maxCostPerMessage?: number;
  qualityPriority: 'cost' | 'speed' | 'quality' | 'balanced';

  // Optional preferences
  preferredProvider?: ProviderType;
  preferredModel?: string;

  // Features needed
  requiresStreaming?: boolean;
  requiresFunctionCalling?: boolean;
  requiresVision?: boolean;
  requiresLongContext?: boolean;

  // System context
  systemPrompt?: string;
  metadata?: Record<string, any>;
}

export interface ModelSwitchingResponse {
  // Response content
  success: boolean;
  message?: string;
  error?: string;

  // Provider info
  selectedProvider: ProviderType;
  selectedModel: string;
  selectionReason: string;
  selectionConfidence: number;

  // Performance metrics
  responseTime: number;
  tokensUsed: number;
  cost: number;
  qualityScore: number;

  // Optimization info
  costOptimization?: {
    potentialSavings: number;
    recommendations: CostOptimizationRecommendation[];
  };

  // A/B testing info
  abTestInfo?: {
    testId: string;
    testGroup: string;
    isControlGroup: boolean;
  };

  // Alternative models
  alternatives: Array<{
    provider: ProviderType;
    model: string;
    estimatedCost: number;
    estimatedResponseTime: number;
    confidence: number;
  }>;

  // Conversation context
  conversationId: string;
  messageId: string;

  // Metadata
  metadata: {
    selectionTime: number;
    processingTime: number;
    totalTime: number;
    cacheHit: boolean;
    fallbackUsed: boolean;
  };
}

export interface OptimizationInsights {
  // Current performance
  currentPerformance: {
    averageResponseTime: number;
    averageCost: number;
    averageQuality: number;
    totalRequests: number;
    successRate: number;
  };

  // Cost analysis
  costAnalysis: {
    totalSpend: number;
    costByProvider: Map<ProviderType, number>;
    costTrends: Array<{ date: Date; cost: number }>;
    potentialSavings: number;
  };

  // Performance analysis
  performanceAnalysis: {
    responseTimeByProvider: Map<ProviderType, number>;
    qualityByProvider: Map<ProviderType, number>;
    reliabilityByProvider: Map<ProviderType, number>;
  };

  // Recommendations
  recommendations: Array<{
    type: 'cost' | 'performance' | 'quality' | 'reliability';
    title: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
    effort: 'low' | 'medium' | 'high';
    estimatedBenefit: number;
    action: any;
  }>;

  // A/B test suggestions
  suggestedTests: Array<{
    name: string;
    description: string;
    hypothesis: string;
    primaryMetric: string;
    estimatedDuration: number;
    config: Partial<ABTestConfig>;
  }>;
}

export class ModelSwitchingOrchestrator {
  private static instance: ModelSwitchingOrchestrator;

  // Performance cache
  private performanceCache: Map<string, any> = new Map();

  // Request tracking
  private requestHistory: Array<{
    timestamp: Date;
    userId: string;
    agentId: string;
    selection: ModelSelection;
    performance: PerformanceMetric;
  }> = [];

  private constructor() {
    // Initialize with default settings
  }

  public static getInstance(): ModelSwitchingOrchestrator {
    if (!ModelSwitchingOrchestrator.instance) {
      ModelSwitchingOrchestrator.instance = new ModelSwitchingOrchestrator();
    }
    return ModelSwitchingOrchestrator.instance;
  }

  // =============================================================================
  // MAIN ORCHESTRATION METHOD
  // =============================================================================

  public async processRequest(request: ModelSwitchingRequest): Promise<ModelSwitchingResponse> {
    const startTime = Date.now();
    let selectionTime = 0;
    let processingTime = 0;
    const cacheHit = false;
    let fallbackUsed = false;

    try {
      console.log(
        `🎯 Processing model switching request for user ${request.userId}, agent ${request.agentId}`
      );

      // 1. Check A/B test assignment first
      const abTestAssignment = await this.getABTestAssignment(request);

      // 2. Build selection context
      const selectionContext = await this.buildSelectionContext(request);

      // 3. Select optimal model
      const selectionStart = Date.now();
      let modelSelection: ModelSelection;

      if (abTestAssignment) {
        // Use A/B test assignment
        modelSelection = {
          provider: abTestAssignment.provider,
          model: abTestAssignment.model,
          reason: `A/B test assignment: ${abTestAssignment.testGroup}`,
          confidence: 1.0,
          estimatedCost: 0,
          estimatedResponseTime: 0,
          fallbacks: [],
          metadata: {
            selectionMethod: 'ab_test',
            factors: ['ab_test_assignment'],
            alternatives: 0,
          },
        };
      } else {
        // Use intelligent selection
        modelSelection = await intelligentModelSelector.selectModel(selectionContext);
      }

      selectionTime = Date.now() - selectionStart;

      // 4. Process chat request
      const processingStart = Date.now();
      const chatRequest: MultiProviderChatRequest = {
        message: request.message,
        messages: request.conversationHistory,
        preferredProvider: modelSelection.provider,
        model: modelSelection.model,
        temperature: 0.7,
        maxTokens: 1000,
        agentId: request.agentId,
        userId: request.userId,
        systemPrompt: request.systemPrompt,
      };

      const chatResponse = await multiProviderChatService.processChat(chatRequest);
      processingTime = Date.now() - processingStart;

      if (!chatResponse.success) {
        // Try fallback if main selection failed
        if (modelSelection.fallbacks.length > 0) {
          fallbackUsed = true;
          const fallback = modelSelection.fallbacks[0];
          chatRequest.preferredProvider = fallback.provider;
          chatRequest.model = fallback.model;

          const fallbackResponse = await multiProviderChatService.processChat(chatRequest);
          if (fallbackResponse.success) {
            Object.assign(chatResponse, fallbackResponse);
          }
        }

        if (!chatResponse.success) {
          throw new Error(chatResponse.error || 'Chat processing failed');
        }
      }

      // 5. Calculate quality score
      const qualityScore = this.calculateQualityScore(chatResponse.message!, request.message);

      // 6. Record performance metrics
      const performanceMetric: PerformanceMetric = {
        id: `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        provider: chatResponse.usedProvider,
        model: chatResponse.usedModel,
        responseTime: chatResponse.responseTime,
        qualityScore,
        relevanceScore: qualityScore * 0.9, // Simplified
        coherenceScore: qualityScore * 0.95, // Simplified
        accuracyScore: qualityScore * 0.85, // Simplified
        promptTokens: Math.floor(chatResponse.tokensUsed * 0.7), // Estimate
        completionTokens: Math.floor(chatResponse.tokensUsed * 0.3), // Estimate
        totalTokens: chatResponse.tokensUsed,
        cost: chatResponse.estimatedCost,
        costPerToken:
          chatResponse.tokensUsed > 0 ? chatResponse.estimatedCost / chatResponse.tokensUsed : 0,
        userId: request.userId,
        agentId: request.agentId,
        conversationId: request.conversationId || `conv_${Date.now()}`,
        messageComplexity: request.messageComplexity || 'medium',
        success: true,
        metadata: {
          requestType: 'chat',
          features: this.extractFeatures(request),
          testGroup: abTestAssignment?.testGroup,
        },
      };

      // Record performance
      await performanceComparisonService.recordPerformance(performanceMetric);

      // Record cost tracking
      const costTrackingData: CostTrackingData = {
        id: `cost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: request.userId,
        agentId: request.agentId,
        conversationId: request.conversationId,
        provider: chatResponse.usedProvider,
        model: chatResponse.usedModel,
        promptTokens: performanceMetric.promptTokens,
        completionTokens: performanceMetric.completionTokens,
        totalTokens: performanceMetric.totalTokens,
        promptCost: performanceMetric.cost * 0.7, // Estimate
        completionCost: performanceMetric.cost * 0.3, // Estimate
        totalCost: performanceMetric.cost,
        responseTime: performanceMetric.responseTime,
        qualityScore: performanceMetric.qualityScore,
        timestamp: new Date(),
        requestType: 'chat',
        success: true,
      };

      await costTrackingService.trackCost(costTrackingData);

      // Record performance in selector
      intelligentModelSelector.recordPerformance(
        chatResponse.usedProvider,
        chatResponse.usedModel,
        chatResponse.responseTime,
        chatResponse.estimatedCost,
        qualityScore,
        true
      );

      // 7. Get cost optimization recommendations
      const costOptimization = await this.getCostOptimization(request.userId, request.agentId);

      // 8. Build response
      const totalTime = Date.now() - startTime;

      const response: ModelSwitchingResponse = {
        success: true,
        message: chatResponse.message,
        selectedProvider: chatResponse.usedProvider,
        selectedModel: chatResponse.usedModel,
        selectionReason: modelSelection.reason,
        selectionConfidence: modelSelection.confidence,
        responseTime: chatResponse.responseTime,
        tokensUsed: chatResponse.tokensUsed,
        cost: chatResponse.estimatedCost,
        qualityScore,
        costOptimization,
        abTestInfo: abTestAssignment
          ? {
              testId: abTestAssignment.testId!,
              testGroup: abTestAssignment.testGroup!,
              isControlGroup: abTestAssignment.testGroup === 'control',
            }
          : undefined,
        alternatives: modelSelection.fallbacks.map(f => ({
          provider: f.provider,
          model: f.model,
          estimatedCost: 0, // Would need to calculate
          estimatedResponseTime: 0, // Would need to calculate
          confidence: 0.5, // Simplified
        })),
        conversationId: request.conversationId || `conv_${Date.now()}`,
        messageId: `msg_${Date.now()}`,
        metadata: {
          selectionTime,
          processingTime,
          totalTime,
          cacheHit,
          fallbackUsed,
        },
      };

      // Store in request history
      this.requestHistory.push({
        timestamp: new Date(),
        userId: request.userId,
        agentId: request.agentId,
        selection: modelSelection,
        performance: performanceMetric,
      });

      // Keep only last 1000 requests
      if (this.requestHistory.length > 1000) {
        this.requestHistory.shift();
      }

      console.log(
        `✅ Model switching completed: ${response.selectedProvider}:${response.selectedModel} in ${totalTime}ms`
      );

      return response;
    } catch (error) {
      console.error('Model switching failed:', error);

      const totalTime = Date.now() - startTime;

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        selectedProvider: 'openai',
        selectedModel: 'gpt-4o-mini',
        selectionReason: 'Error fallback',
        selectionConfidence: 0,
        responseTime: 0,
        tokensUsed: 0,
        cost: 0,
        qualityScore: 0,
        alternatives: [],
        conversationId: request.conversationId || `conv_${Date.now()}`,
        messageId: `msg_${Date.now()}`,
        metadata: {
          selectionTime,
          processingTime,
          totalTime,
          cacheHit,
          fallbackUsed,
        },
      };
    }
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  private async getABTestAssignment(request: ModelSwitchingRequest): Promise<{
    provider: ProviderType;
    model: string;
    testId?: string;
    testGroup?: string;
  } | null> {
    try {
      return await performanceComparisonService.getABTestAssignment(
        request.userId,
        request.agentId,
        {
          messageComplexity: request.messageComplexity,
          qualityPriority: request.qualityPriority,
        }
      );
    } catch (error) {
      console.warn('Failed to get A/B test assignment:', error);
      return null;
    }
  }

  private async buildSelectionContext(
    request: ModelSwitchingRequest
  ): Promise<ModelSelectionContext> {
    return {
      messageText: request.message,
      messageLength: request.message.length,
      messageComplexity: request.messageComplexity || 'medium',
      maxResponseTime: request.maxResponseTime,
      maxCostPerMessage: request.maxCostPerMessage,
      qualityPriority: request.qualityPriority,
      agentId: request.agentId,
      userId: request.userId,
      conversationHistory: this.buildConversationHistory(request.conversationHistory),
      availableProviders: ['openai', 'anthropic', 'google'],
      requiresStreaming: request.requiresStreaming,
      requiresFunctionCalling: request.requiresFunctionCalling,
      requiresVision: request.requiresVision,
      requiresLongContext: request.requiresLongContext,
    };
  }

  private buildConversationHistory(
    history?: Array<{
      role: 'user' | 'assistant';
      content: string;
      provider?: string;
      model?: string;
    }>
  ): Array<{
    provider: string;
    model: string;
    responseTime: number;
    cost: number;
    quality: number;
  }> {
    if (!history) return [];

    return history
      .filter(msg => msg.role === 'assistant' && msg.provider && msg.model)
      .map(msg => ({
        provider: msg.provider!,
        model: msg.model!,
        responseTime: 2000, // Default estimate
        cost: 0.001, // Default estimate
        quality: 0.8, // Default estimate
      }));
  }

  private calculateQualityScore(response: string, originalMessage: string): number {
    // Simple quality scoring based on response characteristics
    let score = 0.5; // Base score

    // Length appropriateness
    const responseLength = response.length;
    const messageLength = originalMessage.length;

    if (responseLength > messageLength * 0.5 && responseLength < messageLength * 10) {
      score += 0.2;
    }

    // Coherence indicators
    if (response.includes('.') && response.includes(' ')) {
      score += 0.1;
    }

    // Relevance indicators (simple keyword matching)
    const messageWords = originalMessage.toLowerCase().split(/\s+/);
    const responseWords = response.toLowerCase().split(/\s+/);
    const commonWords = messageWords.filter(word => responseWords.includes(word));

    if (commonWords.length > 0) {
      score += Math.min(commonWords.length / messageWords.length, 0.2);
    }

    return Math.min(score, 1.0);
  }

  private extractFeatures(request: ModelSwitchingRequest): string[] {
    const features: string[] = [];

    if (request.requiresStreaming) features.push('streaming');
    if (request.requiresFunctionCalling) features.push('function_calling');
    if (request.requiresVision) features.push('vision');
    if (request.requiresLongContext) features.push('long_context');

    features.push(request.qualityPriority);

    if (request.messageComplexity) {
      features.push(request.messageComplexity);
    }

    return features;
  }

  private async getCostOptimization(
    userId: string,
    agentId: string
  ): Promise<{
    potentialSavings: number;
    recommendations: CostOptimizationRecommendation[];
  }> {
    try {
      const analytics = await costTrackingService.getCostAnalytics(userId, agentId);
      return {
        potentialSavings: analytics.potentialSavings,
        recommendations: analytics.recommendations,
      };
    } catch (error) {
      console.warn('Failed to get cost optimization:', error);
      return {
        potentialSavings: 0,
        recommendations: [],
      };
    }
  }

  // =============================================================================
  // ANALYTICS & INSIGHTS
  // =============================================================================

  public async getOptimizationInsights(
    userId: string,
    agentId?: string,
    days: number = 30
  ): Promise<OptimizationInsights> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const endDate = new Date();

    // Get cost analytics
    const costAnalytics = await costTrackingService.getCostAnalytics(
      userId,
      agentId,
      startDate,
      endDate
    );

    // Get performance comparison
    const models = [
      { provider: 'openai' as ProviderType, model: 'gpt-4o-mini' },
      { provider: 'openai' as ProviderType, model: 'gpt-4o' },
      { provider: 'anthropic' as ProviderType, model: 'claude-3-5-sonnet-20241022' },
      { provider: 'google' as ProviderType, model: 'gemini-1.5-flash' },
    ];

    const performanceComparison = await performanceComparisonService.comparePerformance(
      models,
      startDate,
      endDate,
      { userId, agentId }
    );

    // Build insights
    const insights: OptimizationInsights = {
      currentPerformance: {
        averageResponseTime: costAnalytics.averageResponseTime,
        averageCost: costAnalytics.averageCostPerRequest,
        averageQuality: costAnalytics.averageQualityScore,
        totalRequests: costAnalytics.totalRequests,
        successRate: costAnalytics.successfulRequests / costAnalytics.totalRequests,
      },
      costAnalysis: {
        totalSpend: costAnalytics.totalCost,
        costByProvider: costAnalytics.costByProvider,
        costTrends: costAnalytics.dailyCosts,
        potentialSavings: costAnalytics.potentialSavings,
      },
      performanceAnalysis: {
        responseTimeByProvider: new Map(),
        qualityByProvider: new Map(),
        reliabilityByProvider: new Map(),
      },
      recommendations: this.generateOptimizationRecommendations(
        costAnalytics,
        performanceComparison
      ),
      suggestedTests: this.generateABTestSuggestions(performanceComparison),
    };

    // Fill performance analysis
    for (const [modelKey, responseTime] of Object.entries(performanceComparison.responseTime)) {
      const [provider] = modelKey.split(':');
      const currentTime =
        insights.performanceAnalysis.responseTimeByProvider.get(provider as ProviderType) || 0;
      insights.performanceAnalysis.responseTimeByProvider.set(
        provider as ProviderType,
        Math.max(currentTime, responseTime.average)
      );
    }

    for (const [modelKey, quality] of Object.entries(performanceComparison.quality)) {
      const [provider] = modelKey.split(':');
      const currentQuality =
        insights.performanceAnalysis.qualityByProvider.get(provider as ProviderType) || 0;
      insights.performanceAnalysis.qualityByProvider.set(
        provider as ProviderType,
        Math.max(currentQuality, quality.averageScore)
      );
    }

    return insights;
  }

  private generateOptimizationRecommendations(
    costAnalytics: any,
    performanceComparison: any
  ): any[] {
    const recommendations = [];

    // Add cost recommendations
    costAnalytics.recommendations.forEach((rec: any) => {
      recommendations.push({
        type: 'cost',
        title: rec.title,
        description: rec.description,
        impact: rec.metadata.impactLevel,
        effort: 'low',
        estimatedBenefit: rec.potentialSavings,
        action: rec.action,
      });
    });

    // Add performance recommendations
    performanceComparison.recommendations.forEach((rec: any) => {
      recommendations.push({
        type: 'performance',
        title: rec.title,
        description: rec.description,
        impact: 'medium',
        effort: 'medium',
        estimatedBenefit: 0,
        action: rec.action,
      });
    });

    return recommendations;
  }

  private generateABTestSuggestions(performanceComparison: any): any[] {
    const suggestions = [];

    // Suggest speed vs quality test
    if (Object.keys(performanceComparison.responseTime).length >= 2) {
      suggestions.push({
        name: 'Speed vs Quality Trade-off Test',
        description: 'Test if users prefer faster responses or higher quality responses',
        hypothesis: 'Users prefer faster responses for simple queries',
        primaryMetric: 'user_satisfaction',
        estimatedDuration: 14, // days
        config: {
          name: 'Speed vs Quality Test',
          description: 'Compare fast vs quality models',
          trafficAllocation: { control: 50, test: 50 },
          primaryMetric: 'user_satisfaction',
        },
      });
    }

    // Suggest cost optimization test
    if (performanceComparison.models.length >= 2) {
      suggestions.push({
        name: 'Cost Optimization Test',
        description: 'Test cheaper models for simple queries',
        hypothesis: 'Cheaper models perform adequately for simple queries',
        primaryMetric: 'cost',
        estimatedDuration: 7, // days
        config: {
          name: 'Cost Optimization Test',
          description: 'Test cost-effective models',
          trafficAllocation: { control: 70, test: 30 },
          primaryMetric: 'cost',
        },
      });
    }

    return suggestions;
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  public getRequestHistory(userId: string, agentId?: string): any[] {
    return this.requestHistory.filter(
      req => req.userId === userId && (!agentId || req.agentId === agentId)
    );
  }

  public clearPerformanceCache(): void {
    this.performanceCache.clear();
  }

  public getPerformanceCache(): Map<string, any> {
    return new Map(this.performanceCache);
  }
}

// Export singleton instance
export const modelSwitchingOrchestrator = ModelSwitchingOrchestrator.getInstance();
