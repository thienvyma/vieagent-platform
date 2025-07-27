/**
 * ⚙️ Provider Configuration Schema - Day 19 Step 19.1
 * Comprehensive configuration management for multi-provider support
 */

import { z } from 'zod';

/**
 * 🔧 Base Provider Configuration Schema
 */
export const BaseProviderConfigSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  baseURL: z.string().url().optional(),
  timeout: z.number().int().min(1000).max(300000).default(30000), // 1s to 5min
  retryAttempts: z.number().int().min(0).max(5).default(3),
  rateLimitConfig: z
    .object({
      requestsPerMinute: z.number().int().min(1).default(60),
      tokensPerMinute: z.number().int().min(1000).default(100000),
    })
    .optional(),
  defaultModel: z.string().optional(),
  customHeaders: z.record(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * 🤖 OpenAI Provider Configuration
 */
export const OpenAIConfigSchema = BaseProviderConfigSchema.extend({
  organization: z.string().optional(),
  models: z
    .object({
      chat: z
        .array(
          z.enum([
            'gpt-4-turbo-preview',
            'gpt-4',
            'gpt-4-32k',
            'gpt-3.5-turbo',
            'gpt-3.5-turbo-16k',
          ])
        )
        .default(['gpt-3.5-turbo', 'gpt-4']),
      embedding: z
        .array(
          z.enum(['text-embedding-3-large', 'text-embedding-3-small', 'text-embedding-ada-002'])
        )
        .default(['text-embedding-3-small']),
    })
    .optional(),
  features: z
    .object({
      streaming: z.boolean().default(true),
      functionCalling: z.boolean().default(true),
      vision: z.boolean().default(false),
    })
    .optional(),
});

/**
 * 🧠 Anthropic Provider Configuration
 */
export const AnthropicConfigSchema = BaseProviderConfigSchema.extend({
  models: z
    .object({
      chat: z
        .array(
          z.enum([
            'claude-3-opus-20240229',
            'claude-3-sonnet-20240229',
            'claude-3-haiku-20240307',
            'claude-2.1',
            'claude-2.0',
            'claude-instant-1.2',
          ])
        )
        .default(['claude-3-sonnet-20240229']),
      embedding: z.array(z.string()).default([]), // Anthropic doesn't have embeddings yet
    })
    .optional(),
  features: z
    .object({
      streaming: z.boolean().default(true),
      functionCalling: z.boolean().default(false),
      vision: z.boolean().default(true),
    })
    .optional(),
  maxTokens: z.number().int().min(1).max(200000).default(4096),
});

/**
 * 🌐 Google Provider Configuration
 */
export const GoogleConfigSchema = BaseProviderConfigSchema.extend({
  projectId: z.string().optional(),
  models: z
    .object({
      chat: z
        .array(z.enum(['gemini-pro', 'gemini-pro-vision', 'gemini-1.5-pro', 'gemini-1.5-flash']))
        .default(['gemini-pro']),
      embedding: z
        .array(z.enum(['embedding-001', 'text-embedding-004']))
        .default(['embedding-001']),
    })
    .optional(),
  features: z
    .object({
      streaming: z.boolean().default(true),
      functionCalling: z.boolean().default(true),
      vision: z.boolean().default(true),
    })
    .optional(),
  safetySettings: z
    .array(
      z.object({
        category: z.string(),
        threshold: z.string(),
      })
    )
    .optional(),
});

/**
 * 🎯 Multi-Provider Configuration Schema
 */
export const MultiProviderConfigSchema = z.object({
  providers: z.object({
    openai: OpenAIConfigSchema.optional(),
    anthropic: AnthropicConfigSchema.optional(),
    google: GoogleConfigSchema.optional(),
  }),
  defaultProvider: z.enum(['openai', 'anthropic', 'google']).default('openai'),
  fallbackOrder: z
    .array(z.enum(['openai', 'anthropic', 'google']))
    .default(['openai', 'anthropic']),
  costOptimization: z
    .object({
      enabled: z.boolean().default(false),
      maxCostPerRequest: z.number().positive().optional(),
      preferCheaper: z.boolean().default(false),
    })
    .optional(),
  loadBalancing: z
    .object({
      enabled: z.boolean().default(false),
      strategy: z.enum(['round_robin', 'least_loaded', 'random']).default('round_robin'),
    })
    .optional(),
});

/**
 * 📊 Model Information Schema
 */
export const ModelInfoSchema = z.object({
  name: z.string(),
  provider: z.string(),
  maxTokens: z.number().int().positive(),
  costPerToken: z.object({
    input: z.number().nonnegative(),
    output: z.number().nonnegative(),
  }),
  capabilities: z.array(z.enum(['chat', 'embedding', 'streaming', 'function_calling', 'vision'])),
  description: z.string().optional(),
  deprecated: z.boolean().default(false),
});

/**
 * 🎛️ Agent Provider Settings Schema
 */
export const AgentProviderSettingsSchema = z.object({
  modelProvider: z.enum(['openai', 'anthropic', 'google']).default('openai'),
  model: z.string().default('gpt-3.5-turbo'),
  fallbackModel: z.string().optional(),
  multiModelSupport: z.boolean().default(false),
  providerPriority: z.array(z.string()).optional(),
  costLimit: z
    .object({
      maxCostPerMessage: z.number().positive().optional(),
      dailyCostLimit: z.number().positive().optional(),
    })
    .optional(),
  performanceSettings: z
    .object({
      timeoutMs: z.number().int().min(1000).max(120000).default(30000),
      retryAttempts: z.number().int().min(0).max(5).default(2),
      enableCaching: z.boolean().default(true),
    })
    .optional(),
});

/**
 * 🔍 Provider Health Check Schema
 */
export const ProviderHealthSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  latency: z.number().nonnegative(),
  errors: z.array(z.string()),
  lastChecked: z.date(),
  metrics: z
    .object({
      requestsPerMinute: z.number().nonnegative().optional(),
      errorRate: z.number().min(0).max(1).optional(),
      averageLatency: z.number().nonnegative().optional(),
    })
    .optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * 💰 Cost Tracking Schema
 */
export const CostTrackingSchema = z.object({
  provider: z.string(),
  model: z.string(),
  tokensUsed: z.object({
    input: z.number().int().nonnegative(),
    output: z.number().int().nonnegative(),
    total: z.number().int().nonnegative(),
  }),
  cost: z.number().nonnegative(),
  timestamp: z.date(),
  requestId: z.string().optional(),
  agentId: z.string().optional(),
  userId: z.string().optional(),
});

/**
 * 🎯 Provider Capabilities Mapping
 */
export const PROVIDER_CAPABILITIES = {
  openai: {
    chat: true,
    embedding: true,
    streaming: true,
    functionCalling: true,
    vision: true,
    maxTokens: {
      'gpt-4-turbo-preview': 128000,
      'gpt-4': 8192,
      'gpt-4-32k': 32768,
      'gpt-3.5-turbo': 4096,
      'gpt-3.5-turbo-16k': 16384,
    },
    costPerToken: {
      'gpt-4-turbo-preview': { input: 0.01, output: 0.03 },
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-4-32k': { input: 0.06, output: 0.12 },
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
      'gpt-3.5-turbo-16k': { input: 0.003, output: 0.004 },
    },
  },
  anthropic: {
    chat: true,
    embedding: false,
    streaming: true,
    functionCalling: false,
    vision: true,
    maxTokens: {
      'claude-3-opus-20240229': 200000,
      'claude-3-sonnet-20240229': 200000,
      'claude-3-haiku-20240307': 200000,
      'claude-2.1': 200000,
      'claude-2.0': 100000,
      'claude-instant-1.2': 100000,
    },
    costPerToken: {
      'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
      'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
      'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
      'claude-2.1': { input: 0.008, output: 0.024 },
      'claude-2.0': { input: 0.008, output: 0.024 },
      'claude-instant-1.2': { input: 0.0008, output: 0.0024 },
    },
  },
  google: {
    chat: true,
    embedding: true,
    streaming: true,
    functionCalling: true,
    vision: true,
    maxTokens: {
      'gemini-pro': 32768,
      'gemini-pro-vision': 16384,
      'gemini-1.5-pro': 1000000,
      'gemini-1.5-flash': 1000000,
    },
    costPerToken: {
      'gemini-pro': { input: 0.0005, output: 0.0015 },
      'gemini-pro-vision': { input: 0.0025, output: 0.01 },
      'gemini-1.5-pro': { input: 0.0035, output: 0.0105 },
      'gemini-1.5-flash': { input: 0.00035, output: 0.00105 },
    },
  },
} as const;

/**
 * 🛠️ Configuration Utilities
 */
export class ProviderConfigUtils {
  /**
   * Validate provider configuration
   */
  static validateProviderConfig(
    provider: string,
    config: any
  ): { valid: boolean; errors: string[] } {
    try {
      switch (provider.toLowerCase()) {
        case 'openai':
          OpenAIConfigSchema.parse(config);
          break;
        case 'anthropic':
          AnthropicConfigSchema.parse(config);
          break;
        case 'google':
          GoogleConfigSchema.parse(config);
          break;
        default:
          return { valid: false, errors: [`Unknown provider: ${provider}`] };
      }
      return { valid: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        };
      }
      return { valid: false, errors: [error instanceof Error ? error.message : 'Unknown error'] };
    }
  }

  /**
   * Get default configuration for provider
   */
  static getDefaultConfig(provider: string): any {
    switch (provider.toLowerCase()) {
      case 'openai':
        return {
          apiKey: '',
          timeout: 30000,
          retryAttempts: 3,
          models: {
            chat: ['gpt-3.5-turbo', 'gpt-4'],
            embedding: ['text-embedding-3-small'],
          },
        };
      case 'anthropic':
        return {
          apiKey: '',
          timeout: 30000,
          retryAttempts: 3,
          models: {
            chat: ['claude-3-sonnet-20240229'],
            embedding: [],
          },
          maxTokens: 4096,
        };
      case 'google':
        return {
          apiKey: '',
          timeout: 30000,
          retryAttempts: 3,
          models: {
            chat: ['gemini-pro'],
            embedding: ['embedding-001'],
          },
        };
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Get model capabilities
   */
  static getModelCapabilities(provider: string, model: string): any {
    const capabilities = PROVIDER_CAPABILITIES[provider as keyof typeof PROVIDER_CAPABILITIES];
    if (!capabilities) return null;

    return {
      maxTokens: capabilities.maxTokens[model as keyof typeof capabilities.maxTokens] || 4096,
      costPerToken: capabilities.costPerToken[model as keyof typeof capabilities.costPerToken] || {
        input: 0,
        output: 0,
      },
      features: {
        chat: capabilities.chat,
        embedding: capabilities.embedding,
        streaming: capabilities.streaming,
        functionCalling: capabilities.functionCalling,
        vision: capabilities.vision,
      },
    };
  }

  /**
   * Estimate cost for request
   */
  static estimateRequestCost(
    provider: string,
    model: string,
    inputTokens: number,
    outputTokens: number = 0
  ): number {
    const capabilities = this.getModelCapabilities(provider, model);
    if (!capabilities) return 0;

    const { input: inputCost, output: outputCost } = capabilities.costPerToken;
    return (inputTokens * inputCost) / 1000 + (outputTokens * outputCost) / 1000;
  }
}

// Type exports for use in other files
export type OpenAIConfig = z.infer<typeof OpenAIConfigSchema>;
export type AnthropicConfig = z.infer<typeof AnthropicConfigSchema>;
export type GoogleConfig = z.infer<typeof GoogleConfigSchema>;
export type MultiProviderConfig = z.infer<typeof MultiProviderConfigSchema>;
export type AgentProviderSettings = z.infer<typeof AgentProviderSettingsSchema>;
export type ProviderHealth = z.infer<typeof ProviderHealthSchema>;
export type CostTracking = z.infer<typeof CostTrackingSchema>;
export type ModelInfo = z.infer<typeof ModelInfoSchema>;
