/**
 * 🚀 OpenAI Provider Implementation
 *
 * Implements IModelProvider interface for OpenAI models
 * Supports GPT-4, GPT-3.5, embeddings, and function calling
 *
 * DAY 19 - Provider Abstraction Implementation
 */

import OpenAI from 'openai';
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
  OpenAIConfig,
  ProviderConfig,
} from './IModelProvider';

import {
  PROVIDER_DEFAULTS,
  ERROR_CODES,
  createProviderError,
  calculateTokens,
  generateCacheKey,
} from './IModelProvider';

export class OpenAIProvider implements IModelProvider {
  // Provider identification
  readonly name = 'OpenAI';
  readonly version = '1.0.0';
  readonly type: ProviderType = 'openai';
  readonly capabilities: ProviderCapabilities = {
    supportedModels: [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-4',
      'gpt-3.5-turbo',
      'text-embedding-3-large',
      'text-embedding-3-small',
      'text-embedding-ada-002',
    ],
    maxTokens: 128000,
    supportsStreaming: true,
    supportsEmbedding: true,
    supportsFunctionCalling: true,
    supportsImageInput: true,
    supportsJsonMode: true,
    rateLimits: {
      requestsPerMinute: 500,
      tokensPerMinute: 160000,
    },
  };

  private client: OpenAI;
  private config: OpenAIConfig;
  private metrics: ProviderMetrics;
  private cache: Map<string, { response: any; expires: number }> = new Map();
  private rateLimitQueue: Array<{ resolve: () => void; timestamp: number }> = [];

  constructor(config: OpenAIConfig) {
    this.config = {
      ...PROVIDER_DEFAULTS,
      ...config,
    } as OpenAIConfig;

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      organization: this.config.organization,
      project: this.config.project,
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

      // Format messages for OpenAI
      const messages = this.formatMessages(request.messages);

      // Prepare OpenAI request
      const openaiRequest: OpenAI.Chat.Completions.ChatCompletionCreateParams = {
        model: request.model,
        messages: messages,
        temperature: request.temperature,
        max_tokens: request.maxTokens,
        top_p: request.topP,
        frequency_penalty: request.frequencyPenalty,
        presence_penalty: request.presencePenalty,
        stop: request.stop,
        stream: request.stream,
        functions: request.functions,
        function_call: request.functionCall,
        user: request.user,
        ...request.providerOptions,
      };

      // Make request to OpenAI
      const response = await this.client.chat.completions.create(openaiRequest);

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
          return cached as EmbedResponse;
        }
      }

      // Prepare OpenAI request
      const openaiRequest: OpenAI.Embeddings.EmbeddingCreateParams = {
        model: request.model,
        input: request.input,
        user: request.user,
        ...request.providerOptions,
      };

      // Make request to OpenAI
      const response = await this.client.embeddings.create(openaiRequest);

      // Parse response
      const embedResponse = this.parseResponse(response) as EmbedResponse;

      // Update metrics
      const responseTime = Date.now() - startTime;
      this.updateMetrics(true, responseTime, embedResponse.usage.totalTokens);

      // Cache response if enabled
      if (this.config.enableCaching) {
        const cacheKey = generateCacheKey(request);
        await this.setCachedResponse(cacheKey, embedResponse, this.config.cacheTTL);
      }

      return embedResponse;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(false, responseTime, 0);

      const providerError = this.handleError(error as Error);

      // Retry if appropriate
      if (this.shouldRetry(providerError)) {
        const retryStrategy = this.getRetryStrategy();
        await this.delay(retryStrategy.baseDelay);
        return this.embed(request);
      }

      throw providerError;
    }
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
    if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 2)) {
      warnings.push('Temperature should be between 0 and 2');
    }

    if (config.maxTokens !== undefined && config.maxTokens > this.capabilities.maxTokens) {
      warnings.push(`Max tokens exceeds model limit of ${this.capabilities.maxTokens}`);
    }

    // Test API key if provided
    if (config.apiKey) {
      try {
        const testClient = new OpenAI({
          apiKey: config.apiKey,
          organization: (config as OpenAIConfig).organization,
          timeout: 5000,
        });

        await testClient.models.list();
        supportedFeatures.push('API key valid');
      } catch (error) {
        errors.push('Invalid API key or authentication failed');
      }
    }

    // Add supported features
    if (this.capabilities.supportsStreaming) supportedFeatures.push('streaming');
    if (this.capabilities.supportsEmbedding) supportedFeatures.push('embeddings');
    if (this.capabilities.supportsFunctionCalling) supportedFeatures.push('function_calling');
    if (this.capabilities.supportsImageInput) supportedFeatures.push('image_input');
    if (this.capabilities.supportsJsonMode) supportedFeatures.push('json_mode');

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
    } as OpenAIConfig;

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      organization: this.config.organization,
      project: this.config.project,
      baseURL: this.config.baseURL,
      defaultHeaders: this.config.defaultHeaders,
      timeout: this.config.timeout,
    });
  }

  getConfig(): ProviderConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<ProviderConfig>): void {
    this.config = { ...this.config, ...updates } as OpenAIConfig;
    this.configure(this.config);
  }

  // =============================================================================
  // HEALTH AND MONITORING
  // =============================================================================

  async healthCheck(): Promise<HealthStatus> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      // Test API connectivity
      await this.client.models.list();

      const responseTime = Date.now() - startTime;

      return {
        status: responseTime < 2000 ? 'healthy' : 'degraded',
        responseTime,
        lastChecked: new Date(),
        errors,
        metadata: {
          provider: this.name,
          version: this.version,
          apiEndpoint: this.config.baseURL || 'https://api.openai.com',
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
      maxDelay: 10000,
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
    // OpenAI pricing (approximate, should be updated regularly)
    const pricing = {
      'gpt-4o': { input: 0.000005, output: 0.000015 },
      'gpt-4o-mini': { input: 0.00000015, output: 0.0000006 },
      'gpt-4-turbo': { input: 0.00001, output: 0.00003 },
      'gpt-4': { input: 0.00003, output: 0.00006 },
      'gpt-3.5-turbo': { input: 0.0000005, output: 0.0000015 },
      'text-embedding-3-large': { input: 0.00000013, output: 0 },
      'text-embedding-3-small': { input: 0.00000002, output: 0 },
      'text-embedding-ada-002': { input: 0.0000001, output: 0 },
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
      // Embedding request
      const inputTokens = Array.isArray(request.input)
        ? request.input.reduce((total, text) => total + calculateTokens(text), 0)
        : calculateTokens(request.input);

      return inputTokens * modelPricing.input;
    }
  }

  formatMessages(messages: any[]): any[] {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      name: msg.name,
      function_call: msg.function_call,
    }));
  }

  parseResponse(response: any): ChatResponse | EmbedResponse {
    if (response.choices) {
      // Chat response
      return {
        id: response.id,
        object: response.object,
        created: response.created,
        model: response.model,
        choices: response.choices.map((choice: any) => ({
          index: choice.index,
          message: choice.message,
          finishReason: choice.finish_reason,
        })),
        usage: {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        },
      };
    } else {
      // Embedding response
      return {
        object: response.object,
        data: response.data,
        model: response.model,
        usage: {
          promptTokens: response.usage.prompt_tokens,
          totalTokens: response.usage.total_tokens,
        },
      };
    }
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

    // Clear rate limit queue
    this.rateLimitQueue = [];

    // Reset metrics
    this.resetMetrics();
  }

  // =============================================================================
  // RATE LIMITING
  // =============================================================================

  async checkRateLimit(): Promise<boolean> {
    if (!this.config.rateLimiting) return true;

    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = this.config.rateLimiting.requestsPerMinute;

    // Clean old entries
    this.rateLimitQueue = this.rateLimitQueue.filter(entry => now - entry.timestamp < windowMs);

    if (this.rateLimitQueue.length >= maxRequests) {
      this.metrics.rateLimitHits++;
      return false;
    }

    return true;
  }

  async waitForRateLimit(): Promise<void> {
    while (!(await this.checkRateLimit())) {
      await this.delay(1000);
    }
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
      const stream = await this.client.chat.completions.create({
        ...request,
        stream: true,
        messages: this.formatMessages(request.messages),
      });

      for await (const chunk of stream) {
        if (chunk.choices && chunk.choices.length > 0) {
          const choice = chunk.choices[0];
          yield {
            id: chunk.id,
            object: chunk.object,
            created: chunk.created,
            model: chunk.model,
            choices: chunk.choices.map(choice => ({
              index: choice.index,
              message: {
                role: 'assistant',
                content: choice.delta?.content || '',
              },
              finishReason:
                (choice.finish_reason as 'stop' | 'length' | 'function_call' | 'content_filter') ||
                'stop',
            })),
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

export default OpenAIProvider;
