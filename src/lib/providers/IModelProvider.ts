/**
 * 🎯 IModelProvider - Core Provider Interface
 *
 * Unified interface for all AI model providers (OpenAI, Anthropic, Google)
 * Ensures consistent API across different providers while maintaining flexibility
 *
 * DAY 19 - Provider Abstraction Implementation
 */

// =============================================================================
// CORE TYPES & INTERFACES
// =============================================================================

export type ProviderType = 'openai' | 'anthropic' | 'google';
export type ModelType = 'chat' | 'embedding' | 'completion';

export interface ProviderCapabilities {
  supportedModels: string[];
  maxTokens: number;
  supportsStreaming: boolean;
  supportsEmbedding: boolean;
  supportsFunctionCalling: boolean;
  supportsImageInput: boolean;
  supportsJsonMode: boolean;
  rateLimits: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
  // Add missing properties that are referenced in ProviderManager
  chat?: boolean;
  embedding?: boolean;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
}

export interface ChatRequest {
  messages: ChatMessage[];
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  stream?: boolean;
  functions?: any[];
  functionCall?: 'auto' | 'none' | { name: string };
  user?: string;

  // Provider-specific options
  providerOptions?: Record<string, any>;
}

export interface ChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finishReason: 'stop' | 'length' | 'function_call' | 'content_filter';
  }>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };

  // Provider-specific metadata
  providerMetadata?: Record<string, any>;

  // Add missing properties referenced in runtime-provider-selector
  cost?: number;
  content?: string;
  finishReason?: 'stop' | 'length' | 'function_call' | 'content_filter';
}

export interface EmbedRequest {
  input: string | string[];
  model: string;
  user?: string;

  // Provider-specific options
  providerOptions?: Record<string, any>;
}

// Add missing exports that are referenced in ProviderManager
export interface EmbeddingRequest extends EmbedRequest {}
export interface EmbeddingResponse extends EmbedResponse {}

export interface EmbedResponse {
  object: string;
  data: Array<{
    object: string;
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    promptTokens: number;
    totalTokens: number;
  };

  // Provider-specific metadata
  providerMetadata?: Record<string, any>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  supportedFeatures: string[];
}

// Add missing export that is referenced in ProviderManager
export interface ProviderValidationResult extends ValidationResult {}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastChecked: Date;
  errors: string[];
  metadata: Record<string, any>;
}

// Add missing export that is referenced in ProviderManager
export interface ProviderHealthCheck extends HealthStatus {}

export interface ProviderMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  totalTokensUsed: number;
  totalCost: number;
  rateLimitHits: number;
  lastRequestTime: Date;
  errorRate: number;
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

export class ProviderError extends Error {
  public readonly provider: string;
  public readonly code: string;
  public readonly retryable: boolean;
  public readonly statusCode?: number;
  public readonly originalError?: Error;

  // Add missing property referenced in provider implementations
  public readonly errorCode: string;

  constructor(
    message: string,
    provider: string,
    code: string,
    options: {
      retryable?: boolean;
      statusCode?: number;
      originalError?: Error;
    } = {}
  ) {
    super(message);
    this.name = 'ProviderError';
    this.provider = provider;
    this.code = code;
    this.errorCode = code; // Add this for backward compatibility
    this.retryable = options.retryable ?? false;
    this.statusCode = options.statusCode;
    this.originalError = options.originalError;
  }
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const ERROR_CODES = {
  INVALID_CONFIG: 'INVALID_CONFIG',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  RATE_LIMITED: 'RATE_LIMITED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  MODEL_NOT_AVAILABLE: 'MODEL_NOT_AVAILABLE',
  INVALID_REQUEST: 'INVALID_REQUEST',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export function createProviderError(
  message: string,
  provider: string,
  code: keyof typeof ERROR_CODES,
  options?: {
    retryable?: boolean;
    statusCode?: number;
    originalError?: Error;
  }
): ProviderError {
  return new ProviderError(message, provider, code, options);
}

export function isRetryableError(errorCode: string): boolean {
  const retryableErrors = [
    ERROR_CODES.RATE_LIMITED,
    ERROR_CODES.NETWORK_ERROR,
    ERROR_CODES.TIMEOUT,
  ];
  return retryableErrors.includes(errorCode as any);
}

export function calculateTokens(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}

export function generateCacheKey(request: ChatRequest | EmbedRequest): string {
  const serialized = JSON.stringify(request, Object.keys(request).sort());
  return Buffer.from(serialized).toString('base64');
}

// =============================================================================
// RETRY STRATEGY
// =============================================================================

export interface RetryStrategy {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  tokensPerMinute: number;
  burstLimit: number;
  enableQueueing: boolean;
}

// =============================================================================
// PROVIDER CONFIGURATION
// =============================================================================

export interface BaseProviderConfig {
  provider: ProviderType;
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  retries?: number;
  rateLimiting?: RateLimitConfig;

  // Common settings
  baseURL?: string;
  organization?: string;
  defaultHeaders?: Record<string, string>;

  // Advanced settings
  enableLogging?: boolean;
  enableMetrics?: boolean;
  enableCaching?: boolean;
  cacheTTL?: number;
}

export interface OpenAIConfig extends BaseProviderConfig {
  provider: 'openai';
  organization?: string;
  project?: string;
  apiVersion?: string;
}

export interface AnthropicConfig extends BaseProviderConfig {
  provider: 'anthropic';
  version?: string;
  maxTokensToSample?: number;
}

export interface GoogleConfig extends BaseProviderConfig {
  provider: 'google';
  projectId?: string;
  location?: string;
  safetySettings?: Array<{
    category: string;
    threshold: string;
  }>;
}

export type ProviderConfig = OpenAIConfig | AnthropicConfig | GoogleConfig;

// =============================================================================
// CORE PROVIDER INTERFACE
// =============================================================================

export interface IModelProvider {
  // Provider identification
  readonly name: string;
  readonly version: string;
  readonly type: ProviderType;
  readonly capabilities: ProviderCapabilities;

  // Core methods
  chat(request: ChatRequest): Promise<ChatResponse>;
  embed(request: EmbedRequest): Promise<EmbedResponse>;
  validate(config: ProviderConfig): Promise<ValidationResult>;

  // Configuration management
  configure(config: ProviderConfig): void;
  getConfig(): ProviderConfig;
  updateConfig(updates: Partial<ProviderConfig>): void;

  // Health and monitoring
  healthCheck(): Promise<HealthStatus>;
  getMetrics(): ProviderMetrics;
  resetMetrics(): void;

  // Error handling
  handleError(error: Error): ProviderError;
  getRetryStrategy(): RetryStrategy;
  shouldRetry(error: ProviderError): boolean;

  // Utility methods
  estimateCost(request: ChatRequest | EmbedRequest): number;
  formatMessages(messages: ChatMessage[]): any;
  parseResponse(response: any, model?: string): ChatResponse | EmbedResponse;
  getSupportedModels(): string[];

  // Lifecycle methods
  initialize(): Promise<void>;
  cleanup(): Promise<void>;

  // Rate limiting
  checkRateLimit(): Promise<boolean>;
  waitForRateLimit(): Promise<void>;

  // Caching (optional)
  getCachedResponse?(key: string): Promise<ChatResponse | EmbedResponse | null>;
  setCachedResponse?(
    key: string,
    response: ChatResponse | EmbedResponse,
    ttl?: number
  ): Promise<void>;

  // Streaming (optional)
  chatStream?(request: ChatRequest): AsyncIterable<Partial<ChatResponse>>;
}

// =============================================================================
// PROVIDER FACTORY INTERFACE
// =============================================================================

export interface IProviderFactory {
  createProvider(config: ProviderConfig): IModelProvider;
  getAvailableProviders(): ProviderType[];
  validateConfig(config: ProviderConfig): ValidationResult;
  getDefaultConfig(provider: ProviderType): Partial<ProviderConfig>;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export interface ProviderRegistration {
  type: ProviderType;
  name: string;
  description: string;
  constructor: new (config: ProviderConfig) => IModelProvider;
  defaultConfig: Partial<ProviderConfig>;
  requiredConfig: (keyof ProviderConfig)[];
}

export interface ProviderComparison {
  provider: ProviderType;
  model: string;
  responseTime: number;
  cost: number;
  quality: number;
  availability: number;
  features: string[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const PROVIDER_DEFAULTS = {
  timeout: 30000,
  retries: 3,
  temperature: 0.7,
  maxTokens: 1000,
  rateLimiting: {
    requestsPerMinute: 60,
    tokensPerMinute: 60000,
    burstLimit: 10,
    enableQueueing: true,
  },
} as const;

export const RETRY_STRATEGIES = {
  EXPONENTIAL_BACKOFF: 'exponential_backoff',
  FIXED_DELAY: 'fixed_delay',
  LINEAR_BACKOFF: 'linear_backoff',
  NO_RETRY: 'no_retry',
} as const;

// =============================================================================
// EXPORT ALL TYPES
// =============================================================================

export default IModelProvider;
