/**
 * 🤖 Multi-Provider Chat Service
 *
 * Unified service for handling chat requests across multiple AI providers
 * Integrates with existing chat APIs and provides seamless provider switching
 *
 * DAY 19 - Provider Abstraction Integration
 */

import { ProviderFactory } from './providers/ProviderFactory';
import type {
  IModelProvider,
  ProviderType,
  ProviderConfig,
  ChatRequest,
  ChatResponse,
  ProviderError,
} from './providers/IModelProvider';

export interface MultiProviderChatRequest {
  message: string;
  messages?: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;

  // Provider selection
  preferredProvider?: ProviderType;
  model?: string;

  // Chat parameters
  temperature?: number;
  maxTokens?: number;

  // Agent context
  agentId?: string;
  userId?: string;
  systemPrompt?: string;

  // Provider options
  providerOptions?: Record<string, any>;
}

export interface MultiProviderChatResponse {
  success: boolean;
  message?: string;
  response?: ChatResponse;

  // Provider info
  usedProvider: ProviderType;
  usedModel: string;

  // Metrics
  responseTime: number;
  tokensUsed: number;
  estimatedCost: number;

  // Error info
  error?: string;
  fallbackUsed?: boolean;
  originalError?: ProviderError;
}

export interface ProviderSelection {
  provider: ProviderType;
  model: string;
  reason: string;
  confidence: number;
}

export class MultiProviderChatService {
  private static instance: MultiProviderChatService;
  private providerFactory: ProviderFactory;
  private activeProviders: Map<string, IModelProvider> = new Map();

  // Provider configurations
  private providerConfigs: Map<ProviderType, ProviderConfig> = new Map();

  // Fallback chain
  private fallbackChain: ProviderType[] = ['openai', 'anthropic', 'google'];

  private constructor() {
    this.providerFactory = ProviderFactory.getInstance();
    this.initializeDefaultConfigs();
  }

  public static getInstance(): MultiProviderChatService {
    if (!MultiProviderChatService.instance) {
      MultiProviderChatService.instance = new MultiProviderChatService();
    }
    return MultiProviderChatService.instance;
  }

  // =============================================================================
  // INITIALIZATION
  // =============================================================================

  private initializeDefaultConfigs(): void {
    // OpenAI default config
    this.providerConfigs.set('openai', {
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY || '',
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 1000,
      enableCaching: true,
      enableMetrics: true,
    });

    // Anthropic default config
    this.providerConfigs.set('anthropic', {
      provider: 'anthropic',
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      model: 'claude-3-5-sonnet-20241022',
      temperature: 0.7,
      maxTokens: 1000,
      enableCaching: true,
      enableMetrics: true,
    });

    // Google default config
    this.providerConfigs.set('google', {
      provider: 'google',
      apiKey: process.env.GOOGLE_API_KEY || '',
      model: 'gemini-1.5-flash',
      temperature: 0.7,
      maxTokens: 1000,
      enableCaching: true,
      enableMetrics: true,
    });
  }

  // =============================================================================
  // PROVIDER MANAGEMENT
  // =============================================================================

  public async getOrCreateProvider(
    providerType: ProviderType,
    customConfig?: Partial<ProviderConfig>
  ): Promise<IModelProvider> {
    const providerKey = `${providerType}_${JSON.stringify(customConfig || {})}`;

    // Check if provider already exists
    if (this.activeProviders.has(providerKey)) {
      return this.activeProviders.get(providerKey)!;
    }

    // Get base config
    const baseConfig = this.providerConfigs.get(providerType);
    if (!baseConfig) {
      throw new Error(`No configuration found for provider: ${providerType}`);
    }

    // Merge with custom config
    const finalConfig = { ...baseConfig, ...customConfig };

    // Create provider
    const provider = await this.providerFactory.createAndInitializeProvider(finalConfig);

    // Cache provider
    this.activeProviders.set(providerKey, provider);

    return provider;
  }

  public setProviderConfig(providerType: ProviderType, config: ProviderConfig): void {
    this.providerConfigs.set(providerType, config);
  }

  public getProviderConfig(providerType: ProviderType): ProviderConfig | undefined {
    return this.providerConfigs.get(providerType);
  }

  // =============================================================================
  // PROVIDER SELECTION
  // =============================================================================

  public selectProvider(
    request: MultiProviderChatRequest,
    availableProviders?: ProviderType[]
  ): ProviderSelection {
    const providers = availableProviders || this.fallbackChain;

    // If preferred provider is specified and available
    if (request.preferredProvider && providers.includes(request.preferredProvider)) {
      const config = this.providerConfigs.get(request.preferredProvider);
      if (config?.apiKey) {
        return {
          provider: request.preferredProvider,
          model: request.model || config.model,
          reason: 'User preferred provider',
          confidence: 1.0,
        };
      }
    }

    // Auto-select based on message characteristics
    const messageLength = request.message.length;
    const isComplex =
      messageLength > 500 ||
      request.message.includes('analyze') ||
      request.message.includes('explain');

    // Provider selection logic
    for (const provider of providers) {
      const config = this.providerConfigs.get(provider);
      if (!config?.apiKey) continue;

      // OpenAI - good for general purpose
      if (provider === 'openai') {
        return {
          provider: 'openai',
          model: request.model || (isComplex ? 'gpt-4o' : 'gpt-4o-mini'),
          reason: 'OpenAI selected for general purpose chat',
          confidence: 0.8,
        };
      }

      // Anthropic - good for complex reasoning
      if (provider === 'anthropic' && isComplex) {
        return {
          provider: 'anthropic',
          model: request.model || 'claude-3-5-sonnet-20241022',
          reason: 'Anthropic selected for complex reasoning',
          confidence: 0.9,
        };
      }

      // Google - good for fast responses
      if (provider === 'google' && !isComplex) {
        return {
          provider: 'google',
          model: request.model || 'gemini-1.5-flash',
          reason: 'Google selected for fast response',
          confidence: 0.7,
        };
      }
    }

    // Fallback to first available provider
    for (const provider of providers) {
      const config = this.providerConfigs.get(provider);
      if (config?.apiKey) {
        return {
          provider,
          model: request.model || config.model,
          reason: 'Fallback to first available provider',
          confidence: 0.5,
        };
      }
    }

    throw new Error('No providers available with valid API keys');
  }

  // =============================================================================
  // CHAT PROCESSING
  // =============================================================================

  public async processChat(request: MultiProviderChatRequest): Promise<MultiProviderChatResponse> {
    const startTime = Date.now();

    try {
      // Select provider
      const selection = this.selectProvider(request);

      // Get provider instance
      const provider = await this.getOrCreateProvider(selection.provider, {
        model: selection.model,
        temperature: request.temperature,
        maxTokens: request.maxTokens,
      });

      // Build chat request
      const chatRequest: ChatRequest = {
        messages: this.buildMessages(request),
        model: selection.model,
        temperature: request.temperature || 0.7,
        maxTokens: request.maxTokens || 1000,
        providerOptions: request.providerOptions,
      };

      // Execute chat
      const response = await provider.chat(chatRequest);

      // Calculate metrics
      const responseTime = Date.now() - startTime;
      const tokensUsed = response.usage.totalTokens;
      const estimatedCost = provider.estimateCost(chatRequest);

      return {
        success: true,
        message: response.choices[0]?.message?.content || 'No response generated',
        response,
        usedProvider: selection.provider,
        usedModel: selection.model,
        responseTime,
        tokensUsed,
        estimatedCost,
        fallbackUsed: false,
      };
    } catch (error) {
      // Try fallback providers
      return this.tryFallbackProviders(request, error as ProviderError, startTime);
    }
  }

  private async tryFallbackProviders(
    request: MultiProviderChatRequest,
    originalError: ProviderError,
    startTime: number
  ): Promise<MultiProviderChatResponse> {
    const excludeProvider = request.preferredProvider;
    const fallbackProviders = this.fallbackChain.filter(p => p !== excludeProvider);

    for (const provider of fallbackProviders) {
      try {
        const config = this.providerConfigs.get(provider);
        if (!config?.apiKey) continue;

        const fallbackRequest = {
          ...request,
          preferredProvider: provider,
        };

        const result = await this.processChat(fallbackRequest);

        return {
          ...result,
          fallbackUsed: true,
          originalError,
        };
      } catch (fallbackError) {
        console.warn(`Fallback provider ${provider} also failed:`, fallbackError);
        continue;
      }
    }

    // All providers failed
    const responseTime = Date.now() - startTime;
    return {
      success: false,
      error: `All providers failed. Original error: ${originalError.message}`,
      usedProvider: request.preferredProvider || 'openai',
      usedModel: request.model || 'unknown',
      responseTime,
      tokensUsed: 0,
      estimatedCost: 0,
      fallbackUsed: true,
      originalError,
    };
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  private buildMessages(request: MultiProviderChatRequest): Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }> {
    const messages: Array<{
      role: 'system' | 'user' | 'assistant';
      content: string;
    }> = [];

    // Add system prompt if provided
    if (request.systemPrompt) {
      messages.push({
        role: 'system',
        content: request.systemPrompt,
      });
    }

    // Add conversation history if provided
    if (request.messages && request.messages.length > 0) {
      messages.push(...request.messages);
    }

    // Add current message
    messages.push({
      role: 'user',
      content: request.message,
    });

    return messages;
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  public async checkProvidersHealth(): Promise<Map<ProviderType, boolean>> {
    const healthMap = new Map<ProviderType, boolean>();

    for (const [providerType, config] of this.providerConfigs) {
      if (!config.apiKey) {
        healthMap.set(providerType, false);
        continue;
      }

      try {
        const provider = await this.getOrCreateProvider(providerType);
        const health = await provider.healthCheck();
        healthMap.set(providerType, health.status === 'healthy');
      } catch (error) {
        healthMap.set(providerType, false);
      }
    }

    return healthMap;
  }

  public getAvailableProviders(): ProviderType[] {
    return Array.from(this.providerConfigs.keys()).filter(provider => {
      const config = this.providerConfigs.get(provider);
      return config?.apiKey ? true : false;
    });
  }

  public getProviderMetrics(): Map<ProviderType, any> {
    const metricsMap = new Map();

    for (const [key, provider] of this.activeProviders) {
      const providerType = key.split('_')[0] as ProviderType;
      const metrics = provider.getMetrics();

      if (!metricsMap.has(providerType)) {
        metricsMap.set(providerType, metrics);
      }
    }

    return metricsMap;
  }

  public async cleanup(): Promise<void> {
    for (const provider of this.activeProviders.values()) {
      await provider.cleanup();
    }
    this.activeProviders.clear();
  }
}

// Export singleton instance
export const multiProviderChatService = MultiProviderChatService.getInstance();
