import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Validation schemas
const AgentConfigurationSchema = z.object({
  selectedTemplate: z.any().optional(),
  useTemplate: z.boolean().default(false),

  basicInfo: z.object({
    name: z.string().min(1, 'Agent name is required'),
    description: z.string().min(1, 'Agent description is required'),
    category: z.string().min(1, 'Category is required'),
    tags: z.array(z.string()).default([]),
    isPublic: z.boolean().default(false),
    avatar: z.string().optional(),
  }),

  aiConfig: z.object({
    model: z.string().min(1, 'AI model is required'),
    modelProvider: z.enum(['openai', 'anthropic', 'google']),
    temperature: z.number().min(0).max(1),
    maxTokens: z.number().min(1).max(10000),
    fallbackModel: z.string().optional(),
    enableMultiModel: z.boolean().default(false),
    systemPrompt: z.string().min(1, 'System prompt is required'),
    conversationStarters: z.array(z.string()).default([]),
  }),

  ragConfig: z.object({
    enableRAG: z.boolean().default(false),
    ragThreshold: z.number().min(0).max(1).default(0.7),
    ragMaxDocuments: z.number().min(1).max(20).default(5),
    ragSearchType: z.enum(['SEMANTIC', 'KEYWORD', 'HYBRID']).default('SEMANTIC'),
    ragChunkSize: z.number().min(100).max(2000).default(500),
    ragOverlapSize: z.number().min(0).max(500).default(50),
    knowledgeFiles: z.array(z.string()).default([]),
    knowledgeStrategy: z.enum(['AUTO', 'SELECTIVE', 'PRIORITY']).default('AUTO'),
  }),

  learningConfig: z.object({
    enableAutoLearning: z.boolean().default(false),
    learningMode: z.enum(['PASSIVE', 'ACTIVE', 'HYBRID']).default('PASSIVE'),
    learningThreshold: z.number().min(0).max(1).default(0.8),
    learningFeedbackWeight: z.number().min(0).max(1).default(0.3),
    learningRetentionDays: z.number().min(1).max(365).default(30),
    enableFeedbackCollection: z.boolean().default(true),
    qualityThreshold: z.number().min(0).max(1).default(0.8),
  }),

  integrationConfig: z.object({
    enableGoogleIntegration: z.boolean().default(false),
    googleServices: z.object({
      calendar: z.boolean().default(false),
      gmail: z.boolean().default(false),
      sheets: z.boolean().default(false),
      drive: z.boolean().default(false),
      docs: z.boolean().default(false),
      forms: z.boolean().default(false),
    }),
    enableWebhooks: z.boolean().default(false),
    webhookUrl: z.string().url().optional(),
    enableApiAccess: z.boolean().default(false),
    apiRateLimit: z.number().min(1).max(10000).default(100),
  }),

  advancedConfig: z.object({
    enableAutoHandover: z.boolean().default(false),
    handoverTriggers: z.object({
      negativeSentiment: z.boolean().default(false),
      highPriority: z.boolean().default(false),
      longConversation: z.boolean().default(false),
      technicalIssue: z.boolean().default(false),
      customerRequestsHuman: z.boolean().default(false),
    }),
    handoverThresholds: z.object({
      sentimentThreshold: z.number().min(0).max(1).default(0.5),
      messageCountThreshold: z.number().min(1).max(100).default(10),
      conversationDurationThreshold: z.number().min(60).max(3600).default(300),
    }),
    enableAnalytics: z.boolean().default(false),
    enableCustomBranding: z.boolean().default(false),
    enablePrioritySupport: z.boolean().default(false),
  }),

  performanceConfig: z.object({
    responseTimeoutMs: z.number().min(1000).max(60000).default(30000),
    concurrentRequests: z.number().min(1).max(10).default(3),
    enableCaching: z.boolean().default(true),
    cacheTTL: z.number().min(60).max(86400).default(3600),
    enableCostOptimization: z.boolean().default(false),
    maxDailyCost: z.number().min(0).max(1000).default(10),
    maxMonthlyCost: z.number().min(0).max(10000).default(300),
    enablePerformanceMonitoring: z.boolean().default(true),
  }),

  securityConfig: z.object({
    enableDataEncryption: z.boolean().default(true),
    dataRetentionDays: z.number().min(1).max(365).default(90),
    enableAuditLogging: z.boolean().default(true),
    allowedDomains: z.array(z.string()).default([]),
    enableRateLimiting: z.boolean().default(true),
    maxRequestsPerHour: z.number().min(1).max(10000).default(1000),
    enableContentFiltering: z.boolean().default(true),
    contentFilterLevel: z.enum(['low', 'medium', 'high']).default('medium'),
  }),

  deploymentConfig: z.object({
    deploymentName: z.string().min(1, 'Deployment name is required'),
    environment: z.enum(['development', 'staging', 'production']).default('development'),
    enableMonitoring: z.boolean().default(true),
    enableAlerts: z.boolean().default(true),
    alertEmail: z.string().email().optional(),
    enableBackup: z.boolean().default(true),
    backupFrequency: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
  }),
});

// POST /api/agents/wizard/validate
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate the configuration
    const validationResult = AgentConfigurationSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));

      return NextResponse.json({
        isValid: false,
        errors,
        warnings: [],
        suggestions: [],
      });
    }

    const config = validationResult.data;
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Additional validation and suggestions

    // Check model compatibility
    if (config.aiConfig.modelProvider === 'openai' && !config.aiConfig.model.startsWith('gpt-')) {
      warnings.push('Selected model may not be compatible with OpenAI provider');
    }

    // Check RAG configuration
    if (config.ragConfig.enableRAG && config.ragConfig.knowledgeFiles.length === 0) {
      warnings.push('RAG is enabled but no knowledge files are selected');
      suggestions.push('Add knowledge files to improve RAG performance');
    }

    // Check cost optimization
    if (config.performanceConfig.maxDailyCost > 50) {
      warnings.push('Daily cost limit is high, consider enabling cost optimization');
    }

    // Check security settings
    if (!config.securityConfig.enableDataEncryption) {
      warnings.push('Data encryption is disabled - this may pose security risks');
    }

    // Check integration requirements
    if (config.integrationConfig.enableGoogleIntegration) {
      const enabledServices = Object.values(config.integrationConfig.googleServices).filter(
        Boolean
      );
      if (enabledServices.length === 0) {
        warnings.push('Google integration is enabled but no services are selected');
      }
    }

    // Performance suggestions
    if (config.aiConfig.temperature > 0.8) {
      suggestions.push('High temperature may produce inconsistent responses');
    }

    if (config.aiConfig.maxTokens > 2000) {
      suggestions.push('High token limit may increase response time and costs');
    }

    // Learning suggestions
    if (
      config.learningConfig.enableAutoLearning &&
      config.learningConfig.learningMode === 'ACTIVE'
    ) {
      suggestions.push('Active learning mode requires careful monitoring');
    }

    // Deployment suggestions
    if (
      config.deploymentConfig.environment === 'production' &&
      !config.deploymentConfig.enableBackup
    ) {
      warnings.push('Production deployment without backup is not recommended');
    }

    return NextResponse.json({
      isValid: true,
      errors: [],
      warnings,
      suggestions,
      estimatedCost: calculateEstimatedCost(config),
      estimatedPerformance: calculateEstimatedPerformance(config),
    });
  } catch (error) {
    console.error('Error validating agent configuration:', error);
    return NextResponse.json({ error: 'Failed to validate configuration' }, { status: 500 });
  }
}

// Helper functions
function calculateEstimatedCost(config: any): { daily: number; monthly: number } {
  let baseCost = 0;

  // Model costs (simplified)
  switch (config.aiConfig.model) {
    case 'gpt-4o':
      baseCost = 5;
      break;
    case 'gpt-4o-mini':
      baseCost = 1;
      break;
    case 'claude-3-5-sonnet-20241022':
      baseCost = 3;
      break;
    case 'gemini-1.5-flash':
      baseCost = 0.5;
      break;
    default:
      baseCost = 2;
  }

  // RAG costs
  if (config.ragConfig.enableRAG) {
    baseCost += 0.5;
  }

  // Learning costs
  if (config.learningConfig.enableAutoLearning) {
    baseCost += 0.3;
  }

  // Integration costs
  if (config.integrationConfig.enableGoogleIntegration) {
    baseCost += 0.2;
  }

  return {
    daily: baseCost,
    monthly: baseCost * 30,
  };
}

function calculateEstimatedPerformance(config: any): {
  responseTime: number;
  accuracy: number;
  scalability: number;
} {
  let responseTime = 2000; // Base response time in ms
  let accuracy = 0.8; // Base accuracy
  let scalability = 0.7; // Base scalability

  // Model performance
  switch (config.aiConfig.model) {
    case 'gpt-4o':
      responseTime += 1000;
      accuracy += 0.1;
      break;
    case 'gpt-4o-mini':
      responseTime -= 500;
      accuracy -= 0.05;
      break;
    case 'claude-3-5-sonnet-20241022':
      responseTime += 500;
      accuracy += 0.05;
      break;
    case 'gemini-1.5-flash':
      responseTime -= 800;
      accuracy -= 0.02;
      break;
  }

  // RAG impact
  if (config.ragConfig.enableRAG) {
    responseTime += 800;
    accuracy += 0.15;
  }

  // Learning impact
  if (config.learningConfig.enableAutoLearning) {
    accuracy += 0.05;
  }

  // Caching impact
  if (config.performanceConfig.enableCaching) {
    responseTime -= 300;
    scalability += 0.2;
  }

  return {
    responseTime: Math.max(500, responseTime),
    accuracy: Math.min(1, accuracy),
    scalability: Math.min(1, scalability),
  };
}
