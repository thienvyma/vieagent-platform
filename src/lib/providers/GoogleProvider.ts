/**
 * 🌟 Google Provider Implementation
 *
 * Implements IModelProvider interface for Google Gemini models
 * Supports Gemini Pro, Gemini Pro Vision, and embeddings
 *
 * DAY 19 - Provider Abstraction Implementation
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
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
  GoogleConfig,
  ProviderConfig,
} from './IModelProvider';

import {
  PROVIDER_DEFAULTS,
  ERROR_CODES,
  createProviderError,
  calculateTokens,
  generateCacheKey,
} from './IModelProvider';

export class GoogleProvider implements IModelProvider {
  // Provider identification
  readonly name = 'Google';
  readonly version = '1.0.0';
  readonly type: ProviderType = 'google';
  readonly capabilities: ProviderCapabilities = {
    supportedModels: [
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-pro',
      'gemini-pro-vision',
      'text-embedding-004',
    ],
    maxTokens: 1000000,
    supportsStreaming: true,
    supportsEmbedding: true,
    supportsFunctionCalling: true,
    supportsImageInput: true,
    supportsJsonMode: true,
    rateLimits: {
      requestsPerMinute: 60,
      tokensPerMinute: 32000,
    },
  };

  private client: GoogleGenerativeAI;
  private config: GoogleConfig;
  private metrics: ProviderMetrics;
  private cache: Map<string, { response: any; expires: number }> = new Map();

  constructor(config: GoogleConfig) {
    this.config = {
      ...PROVIDER_DEFAULTS,
      ...config,
    } as GoogleConfig;

    this.client = new GoogleGenerativeAI(this.config.apiKey);

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

      // Get model
      const model = this.client.getGenerativeModel({
        model: request.model,
        generationConfig: {
          temperature: request.temperature,
          maxOutputTokens: request.maxTokens,
          topP: request.topP,
          stopSequences: request.stop,
        },
        safetySettings: this.config.safetySettings,
      });

      // Format messages for Google
      const formattedMessages = this.formatMessages(request.messages);

      // Make request to Google
      let response;
      if (request.stream) {
        // Handle streaming
        const result = await model.generateContentStream(formattedMessages);
        response = await result.response;
      } else {
        // Handle non-streaming
        const response = await this.client.generateContent({
          contents: this.formatMessages(request.messages),
          generationConfig: {
            temperature: request.temperature || this.config.temperature,
            maxOutputTokens: request.maxTokens || this.config.maxTokens,
            topP: request.topP,
            stopSequences: request.stop,
          },
          safetySettings: this.config.safetySettings as any, // Type assertion to fix the type issue
        });
        response = result.response;
      }

      // Parse response
      const chatResponse = this.parseResponse(response, request.model) as ChatResponse;

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

      // Get embedding model
      const model = this.client.getGenerativeModel({
        model: request.model,
      });

      // Handle single or batch input
      const inputs = Array.isArray(request.input) ? request.input : [request.input];
      const embeddings: number[][] = [];

      for (const input of inputs) {
        const result = await model.embedContent(input);
        embeddings.push(result.embedding.values);
      }

      // Create response
      const embedResponse: EmbedResponse = {
        object: 'list',
        data: embeddings.map((embedding, index) => ({
          object: 'embedding',
          embedding,
          index,
        })),
        model: request.model,
        usage: {
          promptTokens: inputs.reduce((total, input) => total + calculateTokens(input), 0),
          totalTokens: inputs.reduce((total, input) => total + calculateTokens(input), 0),
        },
      };

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
    if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 1)) {
      warnings.push('Temperature should be between 0 and 1 for Google models');
    }

    if (config.maxTokens !== undefined && config.maxTokens > this.capabilities.maxTokens) {
      warnings.push(`Max tokens exceeds model limit of ${this.capabilities.maxTokens}`);
    }

    // Test API key if provided
    if (config.apiKey) {
      try {
        const testClient = new GoogleGenerativeAI(config.apiKey);
        const model = testClient.getGenerativeModel({ model: 'gemini-pro' });

        // Test with a simple prompt
        await model.generateContent('Hello');

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
    } as GoogleConfig;

    this.client = new GoogleGenerativeAI(this.config.apiKey);
  }

  getConfig(): ProviderConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<ProviderConfig>): void {
    this.config = { ...this.config, ...updates } as GoogleConfig;
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
      const model = this.client.getGenerativeModel({ model: 'gemini-pro' });
      await model.generateContent('ping');

      const responseTime = Date.now() - startTime;

      return {
        status: responseTime < 5000 ? 'healthy' : 'degraded',
        responseTime,
        lastChecked: new Date(),
        errors,
        metadata: {
          provider: this.name,
          version: this.version,
          apiEndpoint: 'https://generativelanguage.googleapis.com',
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
      baseDelay: 2000,
      maxDelay: 20000,
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
    // Google AI pricing (approximate, should be updated regularly)
    const pricing = {
      'gemini-1.5-pro': { input: 0.0000035, output: 0.0000105 },
      'gemini-1.5-flash': { input: 0.00000035, output: 0.00000105 },
      'gemini-pro': { input: 0.0000005, output: 0.0000015 },
      'gemini-pro-vision': { input: 0.00000025, output: 0.0000005 },
      'text-embedding-004': { input: 0.00000001, output: 0 },
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

  formatMessages(messages: any[]): string {
    // Google Gemini expects a simple text prompt
    // Convert conversation to a single prompt
    return messages
      .map(msg => {
        if (msg.role === 'system') {
          return `System: ${msg.content}`;
        } else if (msg.role === 'user') {
          return `User: ${msg.content}`;
        } else if (msg.role === 'assistant') {
          return `Assistant: ${msg.content}`;
        }
        return msg.content;
      })
      .join('\n\n');
  }

  parseResponse(response: any, model?: string): ChatResponse | EmbedResponse {
    // Parse Google response to standard format
    const text = response.text() || '';

    return {
      id: `google-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: model || 'gemini-pro',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: text,
          },
          finishReason: 'stop',
        },
      ],
      usage: {
        promptTokens: response.usageMetadata?.promptTokenCount || 0,
        completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: response.usageMetadata?.totalTokenCount || calculateTokens(text),
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
    // Google has lower rate limits, so be more conservative
    return true;
  }

  async waitForRateLimit(): Promise<void> {
    // Wait for rate limit to reset
    await this.delay(2000);
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
      const stream = await this.client.generateContentStream({
        contents: this.formatMessages(request.messages),
        generationConfig: {
          temperature: request.temperature || this.config.temperature,
          maxOutputTokens: request.maxTokens || this.config.maxTokens,
          topP: request.topP,
          stopSequences: request.stop,
        },
        safetySettings: this.config.safetySettings as any,
      });

      for await (const chunk of stream.stream) {
        if (chunk.candidates && chunk.candidates.length > 0) {
          const candidate = chunk.candidates[0];
          if (candidate.content && candidate.content.parts) {
            yield {
              id: `google-${Date.now()}`,
              object: 'chat.completion.chunk',
              created: Math.floor(Date.now() / 1000),
              model: request.model,
              choices: [
                {
                  index: 0,
                  message: {
                    role: 'assistant',
                    content: candidate.content.parts.map(part => part.text).join(''),
                  },
                  finishReason: 'stop' as const,
                },
              ],
            };
          }
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

export default GoogleProvider;
