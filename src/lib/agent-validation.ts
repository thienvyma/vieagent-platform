import { z } from 'zod';

// Enums cho validation
export const RAGSearchTypeEnum = z.enum(['SEMANTIC', 'KEYWORD', 'HYBRID']);
export const LearningModeEnum = z.enum(['PASSIVE', 'ACTIVE', 'HYBRID']);
export const ModelProviderEnum = z.enum(['openai', 'anthropic', 'google', 'local']);

// Base Agent validation schema
export const AgentValidationSchema = z.object({
  // Basic fields (existing)
  name: z
    .string()
    .min(1, 'Tên agent không được để trống')
    .max(100, 'Tên agent không được quá 100 ký tự'),
  description: z
    .string()
    .min(1, 'Mô tả không được để trống')
    .max(500, 'Mô tả không được quá 500 ký tự'),
  systemPrompt: z
    .string()
    .min(1, 'System prompt không được để trống')
    .max(2000, 'System prompt không được quá 2000 ký tự'),

  // AI Model Settings
  model: z.string().default('gpt-3.5-turbo'),
  modelProvider: ModelProviderEnum.default('openai'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(8000).default(1000),
  fallbackModel: z.string().optional(),
  multiModelSupport: z.boolean().default(false),

  // RAG Settings
  enableRAG: z.boolean().default(false),
  ragThreshold: z.number().min(0).max(1).default(0.7),
  ragMaxDocuments: z.number().min(1).max(20).default(5),
  ragSearchType: RAGSearchTypeEnum.default('SEMANTIC'),
  ragChunkSize: z.number().min(100).max(2000).default(500),
  ragOverlapSize: z.number().min(0).max(500).default(50),

  // Auto-Learning Settings
  enableAutoLearning: z.boolean().default(false),
  learningMode: LearningModeEnum.default('PASSIVE'),
  learningThreshold: z.number().min(0).max(1).default(0.8),
  learningFeedbackWeight: z.number().min(0).max(1).default(0.3),
  learningRetentionDays: z.number().min(1).max(365).default(30),

  // Vector Database Settings
  embeddingModel: z.string().default('text-embedding-3-small'),
  embeddingDimensions: z.number().min(128).max(3072).default(1536),
  vectorCollectionName: z.string().optional(),

  // Performance Settings
  responseTimeoutMs: z.number().min(1000).max(60000).default(30000),
  concurrentRequests: z.number().min(1).max(10).default(3),
  cacheTTL: z.number().min(60).max(86400).default(3600),
  enableResponseCaching: z.boolean().default(true),

  // Advanced Features
  enableFunctionCalling: z.boolean().default(false),
  availableFunctions: z.array(z.string()).default([]),
  contextWindowSize: z.number().min(1000).max(32000).default(4000),
  enableStreaming: z.boolean().default(true),

  // Google Integration
  googleIntegration: z.boolean().default(false),
});

// Default configuration values
export const DEFAULT_AGENT_CONFIG = {
  // AI Model Settings
  model: 'gpt-3.5-turbo',
  modelProvider: 'openai' as const,
  temperature: 0.7,
  maxTokens: 1000,
  multiModelSupport: false,

  // RAG Settings
  enableRAG: false,
  ragThreshold: 0.7,
  ragMaxDocuments: 5,
  ragSearchType: 'SEMANTIC' as const,
  ragChunkSize: 500,
  ragOverlapSize: 50,

  // Auto-Learning Settings
  enableAutoLearning: false,
  learningMode: 'PASSIVE' as const,
  learningThreshold: 0.8,
  learningFeedbackWeight: 0.3,
  learningRetentionDays: 30,

  // Vector Database Settings
  embeddingModel: 'text-embedding-3-small',
  embeddingDimensions: 1536,

  // Performance Settings
  responseTimeoutMs: 30000,
  concurrentRequests: 3,
  cacheTTL: 3600,
  enableResponseCaching: true,

  // Advanced Features
  enableFunctionCalling: false,
  availableFunctions: [],
  contextWindowSize: 4000,
  enableStreaming: true,

  // Google Integration
  googleIntegration: false,
};

// Validation functions
export function validateAgentConfig(config: any) {
  try {
    const validatedConfig = AgentValidationSchema.parse(config);
    return {
      success: true,
      data: validatedConfig,
      errors: null,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        })),
      };
    }

    return {
      success: false,
      data: null,
      errors: [{ field: 'unknown', message: 'Validation error', code: 'unknown' }],
    };
  }
}

// Apply default values to partial config
export function applyDefaultConfig(partialConfig: any) {
  return {
    ...DEFAULT_AGENT_CONFIG,
    ...partialConfig,
  };
}

// Validate specific configuration sections
export function validateRAGConfig(config: any) {
  const ragSchema = z.object({
    enableRAG: z.boolean(),
    ragThreshold: z.number().min(0).max(1),
    ragMaxDocuments: z.number().min(1).max(20),
    ragSearchType: RAGSearchTypeEnum,
    ragChunkSize: z.number().min(100).max(2000),
    ragOverlapSize: z.number().min(0).max(500),
  });

  return ragSchema.safeParse(config);
}

export function validateLearningConfig(config: any) {
  const learningSchema = z.object({
    enableAutoLearning: z.boolean(),
    learningMode: LearningModeEnum,
    learningThreshold: z.number().min(0).max(1),
    learningFeedbackWeight: z.number().min(0).max(1),
    learningRetentionDays: z.number().min(1).max(365),
  });

  return learningSchema.safeParse(config);
}

export function validatePerformanceConfig(config: any) {
  const performanceSchema = z.object({
    responseTimeoutMs: z.number().min(1000).max(60000),
    concurrentRequests: z.number().min(1).max(10),
    cacheTTL: z.number().min(60).max(86400),
    enableResponseCaching: z.boolean(),
  });

  return performanceSchema.safeParse(config);
}

// Custom validation rules
export function validateModelCompatibility(provider: string, model: string): boolean {
  const compatibilityMap: Record<string, string[]> = {
    openai: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
    anthropic: ['claude-3-haiku', 'claude-3-sonnet', 'claude-3-opus'],
    google: ['gemini-pro', 'gemini-pro-vision'],
    local: ['llama-2', 'mistral-7b', 'codellama'],
  };

  return compatibilityMap[provider]?.includes(model) || false;
}

export function validateEmbeddingDimensions(model: string, dimensions: number): boolean {
  const dimensionMap: Record<string, number[]> = {
    'text-embedding-3-small': [512, 1536],
    'text-embedding-3-large': [256, 1024, 3072],
    'text-embedding-ada-002': [1536],
  };

  return dimensionMap[model]?.includes(dimensions) || false;
}

// Error messages in Vietnamese
export const VALIDATION_MESSAGES = {
  REQUIRED_FIELD: 'Trường này là bắt buộc',
  INVALID_ENUM: 'Giá trị không hợp lệ',
  INVALID_RANGE: 'Giá trị nằm ngoài phạm vi cho phép',
  INVALID_MODEL_COMPATIBILITY: 'Model không tương thích với provider đã chọn',
  INVALID_EMBEDDING_DIMENSIONS: 'Kích thước embedding không tương thích với model',
  CONFIG_CONFLICT: 'Cấu hình xung đột với nhau',
};

export type AgentConfig = z.infer<typeof AgentValidationSchema>;
export type ValidationResult = ReturnType<typeof validateAgentConfig>;
