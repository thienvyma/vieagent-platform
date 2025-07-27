/**
 * 🤖 Anthropic Provider Implementation
 *
 * Implements IModelProvider interface for Anthropic Claude models
 * Supports Claude 3.5 Sonnet, Opus, Sonnet, and Haiku models
 *
 * DAY 19 - Provider Abstraction Implementation
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  IModelProvider,
  ProviderType,
  ProviderCapabilities,
  ChatRequest,
  ChatResponse,
  EmbedRequest,
  EmbedResponse,
  ValidationResult,
  HealthStatus,
  ProviderMetrics,
  ProviderError,
  RetryStrategy,
  AnthropicConfig,
  ProviderConfig,
} from './IModelProvider';

import {
  PROVIDER_DEFAULTS,
  ERROR_CODES,
  createProviderError,
  calculateTokens,
  generateCacheKey,
} from './IModelProvider';

export class AnthropicProvider implements IModelProvider {
  // Provider identification
  readonly name = 'Anthropic';
  readonly version = '1.0.0';
  readonly type: ProviderType = 'anthropic';
  readonly capabilities: ProviderCapabilities = {
    supportedModels: [
      'claude-3-5-sonnet-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
    ],
    maxTokens: 200000,
    supportsStreaming: true,
    supportsEmbedding: false, // Anthropic doesn't provide embeddings
    supportsFunctionCalling: true,
    supportsImageInput: true,
    supportsJsonMode: false,
    rateLimits: {
      requestsPerMinute: 1000,
      tokensPerMinute: 80000,
    },
  };

  private client: Anthropic;
  private config: AnthropicConfig;
  private metrics: ProviderMetrics;
  private cache: Map<string, { response: any; expires: number }> = new Map();

  constructor(config: AnthropicConfig) {
    this.config = {
      ...PROVIDER_DEFAULTS,
      ...config,
    } as AnthropicConfig;

    this.client = new Anthropic({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseURL,
      defaultHeaders: this.config.defaultHeaders,
      timeout: this.config.timeout,
    });

    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      totalTokensUsed: 0,
      totalCost: 0,
      rateLimitHits: 0,
      lastRequestTime: new Date(),
      errorRate: 0,
    };
  }

  // =============================================================================
  // CORE METHODS
  // =============================================================================

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      // Check rate limiting
      await this.checkRateLimit();

      // Check cache if enabled
      if (this.config.enableCaching) {
        const cacheKey = generateCacheKey(request);
        const cached = await this.getCachedResponse(cacheKey);
        if (cached) {
          return cached as ChatResponse;
        }
      }

      // Format messages for Anthropic
      const { messages, system } = this.formatMessages(request.messages);

      // Prepare Anthropic request
      const anthropicRequest: Anthropic.Messages.MessageCreateParams = {
        model: request.model,
        messages: messages,
        max_tokens: request.maxTokens || this.config.maxTokensToSample || 1000,
        temperature: request.temperature,
        top_p: request.topP,
        stop_sequences: request.stop,
        stream: request.stream,
        system: system,
        ...request.providerOptions,
      };

      // Make request to Anthropic
      const response = await this.client.messages.create(anthropicRequest);

      // Parse response
      const chatResponse = this.parseResponse(response) as ChatResponse;

      // Update metrics
      const responseTime = Date.now() - startTime;
      this.updateMetrics(true, responseTime, chatResponse.usage.totalTokens);

      // Cache response if enabled
      if (this.config.enableCaching) {
        const cacheKey = generateCacheKey(request);
        await this.setCachedResponse(cacheKey, chatResponse, this.config.cacheTTL);
      }

      return chatResponse;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(false, responseTime, 0);

      const providerError = this.handleError(error as Error);

      // Retry if appropriate
      if (this.shouldRetry(providerError)) {
        const retryStrategy = this.getRetryStrategy();
        await this.delay(retryStrategy.baseDelay);
        return this.chat(request);
      }

      throw providerError;
    }
  }

  async embed(request: EmbedRequest): Promise<EmbedResponse> {
    // Anthropic doesn't provide embeddings - throw error
    throw createProviderError(
      this.type,
      'Anthropic does not support embeddings. Use OpenAI or Google for embedding functionality.',
      ERROR_CODES.MODEL_NOT_AVAILABLE
    );
  }

  async validate(config: ProviderConfig): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const supportedFeatures: string[] = [];

    // Check required fields
    if (!config.apiKey) {
      errors.push('API key is required');
    }

    if (!config.model) {
      errors.push('Model is required');
    }

    // Check model support
    if (config.model && !this.capabilities.supportedModels.includes(config.model)) {
      warnings.push(`Model ${config.model} may not be supported`);
    }

    // Check configuration values
    if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 1)) {
      warnings.push('Temperature should be between 0 and 1 for Anthropic models');
    }

    if (config.maxTokens !== undefined && config.maxTokens > this.capabilities.maxTokens) {
      warnings.push(`Max tokens exceeds model limit of ${this.capabilities.maxTokens}`);
    }

    // Test API key if provided
    if (config.apiKey) {
      try {
        const testClient = new Anthropic({
          apiKey: config.apiKey,
          timeout: 5000,
        });

        // Test with a simple message
        await testClient.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hello' }],
        });

        supportedFeatures.push('API key valid');
      } catch (error) {
        errors.push('Invalid API key or authentication failed');
      }
    }

    // Add supported features
    if (this.capabilities.supportsStreaming) supportedFeatures.push('streaming');
    if (this.capabilities.supportsFunctionCalling) supportedFeatures.push('function_calling');
    if (this.capabilities.supportsImageInput) supportedFeatures.push('image_input');

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      supportedFeatures,
    };
  }

  // =============================================================================
  // CONFIGURATION MANAGEMENT
  // =============================================================================

  configure(config: ProviderConfig): void {
    this.config = {
      ...PROVIDER_DEFAULTS,
      ...config,
    } as AnthropicConfig;

    this.client = new Anthropic({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseURL,
      defaultHeaders: this.config.defaultHeaders,
      timeout: this.config.timeout,
    });
  }

  getConfig(): ProviderConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<ProviderConfig>): void {
    this.config = { ...this.config, ...updates } as AnthropicConfig;
    this.configure(this.config);
  }

  // =============================================================================
  // HEALTH AND MONITORING
  // =============================================================================

  async healthCheck(): Promise<HealthStatus> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      // Test API connectivity with minimal request
      await this.client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'ping' }],
      });

      const responseTime = Date.now() - startTime;

      return {
        status: responseTime < 3000 ? 'healthy' : 'degraded',
        responseTime,
        lastChecked: new Date(),
        errors,
        metadata: {
          provider: this.name,
          version: this.version,
          apiEndpoint: this.config.baseURL || 'https://api.anthropic.com',
        },
      };
    } catch (error) {
      errors.push((error as Error).message);

      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        errors,
        metadata: {
          provider: this.name,
          version: this.version,
          error: (error as Error).message,
        },
      };
    }
  }

  getMetrics(): ProviderMetrics {
    return { ...this.metrics };
  }

  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      totalTokensUsed: 0,
      totalCost: 0,
      rateLimitHits: 0,
      lastRequestTime: new Date(),
      errorRate: 0,
    };
  }

  // =============================================================================
  // ERROR HANDLING
  // =============================================================================

  handleError(error: Error): ProviderError {
    let errorCode: keyof typeof ERROR_CODES = 'UNKNOWN_ERROR';
    let statusCode = 500;

    if (error.message.includes('rate limit')) {
      errorCode = 'RATE_LIMITED';
      statusCode = 429;
    } else if (error.message.includes('authentication') || error.message.includes('API key')) {
      errorCode = 'AUTHENTICATION_FAILED';
      statusCode = 401;
    } else if (error.message.includes('quota') || error.message.includes('billing')) {
      errorCode = 'QUOTA_EXCEEDED';
      statusCode = 403;
    } else if (error.message.includes('model') && error.message.includes('not found')) {
      errorCode = 'MODEL_NOT_AVAILABLE';
      statusCode = 404;
    } else if (error.message.includes('timeout')) {
      errorCode = 'TIMEOUT';
      statusCode = 408;
    } else if (error.message.includes('network') || error.message.includes('connection')) {
      errorCode = 'NETWORK_ERROR';
      statusCode = 500;
    }

    return createProviderError(error.message, this.type, errorCode, {
      retryable: isRetryableError(errorCode),
      statusCode,
      originalError: error,
    });
  }

  getRetryStrategy(): RetryStrategy {
    return {
      maxRetries: this.config.retries || 3,
      baseDelay: 1000,
      maxDelay: 15000,
      backoffMultiplier: 2,
      retryableErrors: [ERROR_CODES.RATE_LIMITED, ERROR_CODES.NETWORK_ERROR, ERROR_CODES.TIMEOUT],
    };
  }

  shouldRetry(error: ProviderError): boolean {
    const strategy = this.getRetryStrategy();
    return strategy.retryableErrors.includes(error.errorCode);
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  getSupportedModels(): string[] {
    return this.capabilities.supportedModels;
  }

  estimateCost(request: ChatRequest | EmbedRequest): number {
    // Anthropic pricing (approximate, should be updated regularly)
    const pricing = {
      'claude-3-5-sonnet-20241022': { input: 0.000003, output: 0.000015 },
      'claude-3-opus-20240229': { input: 0.000015, output: 0.000075 },
      'claude-3-sonnet-20240229': { input: 0.000003, output: 0.000015 },
      'claude-3-haiku-20240307': { input: 0.00000025, output: 0.00000125 },
    };

    const modelPricing = pricing[request.model as keyof typeof pricing];
    if (!modelPricing) return 0;

    if ('messages' in request) {
      // Chat request
      const inputTokens = request.messages.reduce(
        (total, msg) => total + calculateTokens(msg.content),
        0
      );
      const outputTokens = request.maxTokens || 1000;

      return inputTokens * modelPricing.input + outputTokens * modelPricing.output;
    } else {
      // Embedding not supported
      return 0;
    }
  }

  formatMessages(messages: any[]): { messages: any[]; system?: string } {
    let system: string | undefined;
    const formattedMessages: any[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        // Anthropic uses system parameter instead of system messages
        system = msg.content;
      } else {
        formattedMessages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        });
      }
    }

    return { messages: formattedMessages, system };
  }

  parseResponse(response: any): ChatResponse | EmbedResponse {
    // Parse Anthropic response to standard format
    return {
      id: response.id,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: response.model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: response.content[0]?.text || '',
          },
          finishReason:
            response.stop_reason === 'end_turn'
              ? 'stop'
              : response.stop_reason === 'max_tokens'
                ? 'length'
                : 'stop',
        },
      ],
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
    };
  }

  // =============================================================================
  // LIFECYCLE METHODS
  // =============================================================================

  async initialize(): Promise<void> {
    // Test connection
    await this.healthCheck();

    // Initialize cache if enabled
    if (this.config.enableCaching) {
      this.cache = new Map();
    }

    // Start metrics collection
    this.resetMetrics();
  }

  async cleanup(): Promise<void> {
    // Clear cache
    this.cache.clear();

    // Reset metrics
    this.resetMetrics();
  }

  // =============================================================================
  // RATE LIMITING
  // =============================================================================

  async checkRateLimit(): Promise<boolean> {
    // Simple rate limiting implementation
    // In production, should use more sophisticated rate limiting
    return true;
  }

  async waitForRateLimit(): Promise<void> {
    // Wait for rate limit to reset
    await this.delay(1000);
  }

  // =============================================================================
  // CACHING
  // =============================================================================

  async getCachedResponse(key: string): Promise<ChatResponse | EmbedResponse | null> {
    if (!this.config.enableCaching) return null;

    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expires) {
      this.cache.delete(key);
      return null;
    }

    return cached.response;
  }

  async setCachedResponse(
    key: string,
    response: ChatResponse | EmbedResponse,
    ttl: number = 3600000
  ): Promise<void> {
    if (!this.config.enableCaching) return;

    this.cache.set(key, {
      response,
      expires: Date.now() + ttl,
    });
  }

  // =============================================================================
  // STREAMING (OPTIONAL)
  // =============================================================================

  async *chatStream(request: ChatRequest): AsyncIterable<Partial<ChatResponse>> {
    await this.waitForRateLimit();

    const startTime = Date.now();

    try {
      const stream = await this.client.messages.create({
        model: request.model,
        max_tokens: request.maxTokens || 1000,
        temperature: request.temperature || 0.7,
        messages: this.formatMessages(request.messages),
        stream: true,
      });

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          yield {
            id: `anthropic-${Date.now()}`,
            object: 'chat.completion.chunk',
            created: Math.floor(Date.now() / 1000),
            model: request.model,
            choices: [
              {
                index: 0,
                message: {
                  role: 'assistant',
                  content: chunk.delta.text || '',
                },
                finishReason: 'stop' as const,
              },
            ],
          };
        }
      }

      this.updateMetrics(true, Date.now() - startTime, 0);
    } catch (error) {
      this.updateMetrics(false, Date.now() - startTime, 0);
      throw this.handleError(error as Error);
    }
  }

  // =============================================================================
  // PRIVATE HELPERS
  // =============================================================================

  private updateMetrics(success: boolean, responseTime: number, tokens: number): void {
    if (success) {
      this.metrics.successfulRequests++;
      this.metrics.totalTokensUsed += tokens;
    } else {
      this.metrics.failedRequests++;
    }

    this.metrics.lastRequestTime = new Date();

    // Update average response time
    const totalRequests = this.metrics.successfulRequests + this.metrics.failedRequests;
    this.metrics.averageResponseTime =
      (this.metrics.averageResponseTime * (totalRequests - 1) + responseTime) / totalRequests;

    // Update error rate
    this.metrics.errorRate = this.metrics.failedRequests / this.metrics.totalRequests;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default AnthropicProvider;
