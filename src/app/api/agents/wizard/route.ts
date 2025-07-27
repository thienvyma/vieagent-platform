/**
 * 🧙‍♂️ Agent Configuration Wizard API - DAY 28 Step 28.1
 * API endpoints for the Advanced Agent Configuration Wizard
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AgentValidationSchema } from '@/lib/agent-validation';
import { z } from 'zod';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const WizardConfigurationSchema = z.object({
  // Template Selection
  selectedTemplate: z
    .object({
      id: z.string(),
      name: z.string(),
      category: z.string(),
    })
    .nullable(),
  useTemplate: z.boolean(),

  // Basic Information
  basicInfo: z.object({
    name: z.string().min(1, 'Agent name is required').max(100, 'Agent name too long'),
    description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
    category: z.string(),
    tags: z.array(z.string()),
    isPublic: z.boolean(),
    avatar: z.string().optional(),
  }),

  // AI Configuration
  aiConfig: z.object({
    model: z.string(),
    modelProvider: z.enum(['openai', 'anthropic', 'google']),
    temperature: z.number().min(0).max(2),
    maxTokens: z.number().min(1).max(8000),
    fallbackModel: z.string().optional(),
    enableMultiModel: z.boolean(),
    systemPrompt: z.string().min(1, 'System prompt is required'),
    conversationStarters: z.array(z.string()),
  }),

  // RAG Configuration
  ragConfig: z.object({
    enableRAG: z.boolean(),
    ragThreshold: z.number().min(0).max(1),
    ragMaxDocuments: z.number().min(1).max(20),
    ragSearchType: z.enum(['SEMANTIC', 'KEYWORD', 'HYBRID']),
    ragChunkSize: z.number().min(100).max(2000),
    ragOverlapSize: z.number().min(0).max(500),
    knowledgeFiles: z.array(z.string()),
    knowledgeStrategy: z.enum(['AUTO', 'SELECTIVE', 'PRIORITY']),
  }),

  // Learning Configuration
  learningConfig: z.object({
    enableAutoLearning: z.boolean(),
    learningMode: z.enum(['PASSIVE', 'ACTIVE', 'HYBRID']),
    learningThreshold: z.number().min(0).max(1),
    learningFeedbackWeight: z.number().min(0).max(1),
    learningRetentionDays: z.number().min(1).max(365),
    enableFeedbackCollection: z.boolean(),
    qualityThreshold: z.number().min(0).max(1),
  }),

  // Integration Configuration
  integrationConfig: z.object({
    enableGoogleIntegration: z.boolean(),
    googleServices: z.object({
      calendar: z.boolean(),
      gmail: z.boolean(),
      sheets: z.boolean(),
      drive: z.boolean(),
      docs: z.boolean(),
      forms: z.boolean(),
    }),
    enableWebhooks: z.boolean(),
    webhookUrl: z.string().url().optional(),
    enableApiAccess: z.boolean(),
    apiRateLimit: z.number().min(1).max(10000),
  }),

  // Advanced Configuration
  advancedConfig: z.object({
    enableAutoHandover: z.boolean(),
    handoverTriggers: z.object({
      negativeSentiment: z.boolean(),
      highPriority: z.boolean(),
      longConversation: z.boolean(),
      technicalIssue: z.boolean(),
      customerRequestsHuman: z.boolean(),
    }),
    handoverThresholds: z.object({
      sentimentThreshold: z.number().min(0).max(1),
      messageCountThreshold: z.number().min(1).max(100),
      conversationDurationThreshold: z.number().min(60).max(3600),
    }),
    enableAnalytics: z.boolean(),
    enableCustomBranding: z.boolean(),
    enablePrioritySupport: z.boolean(),
  }),

  // Performance Configuration
  performanceConfig: z.object({
    responseTimeoutMs: z.number().min(1000).max(120000),
    concurrentRequests: z.number().min(1).max(10),
    enableCaching: z.boolean(),
    cacheTTL: z.number().min(60).max(86400),
    enableCostOptimization: z.boolean(),
    maxDailyCost: z.number().min(0).max(1000),
    maxMonthlyCost: z.number().min(0).max(10000),
    enablePerformanceMonitoring: z.boolean(),
  }),

  // Security Configuration
  securityConfig: z.object({
    enableDataEncryption: z.boolean(),
    dataRetentionDays: z.number().min(1).max(365),
    enableAuditLogging: z.boolean(),
    allowedDomains: z.array(z.string()),
    enableRateLimiting: z.boolean(),
    maxRequestsPerHour: z.number().min(1).max(100000),
    enableContentFiltering: z.boolean(),
    contentFilterLevel: z.enum(['low', 'medium', 'high']),
  }),

  // Deployment Configuration
  deploymentConfig: z.object({
    deploymentName: z.string(),
    environment: z.enum(['development', 'staging', 'production']),
    enableMonitoring: z.boolean(),
    enableAlerts: z.boolean(),
    alertEmail: z.string().email().optional(),
    enableBackup: z.boolean(),
    backupFrequency: z.enum(['daily', 'weekly', 'monthly']),
  }),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function validateUserPermissions(userId: string, userPlan: string, config: any) {
  const errors = [];

  // Plan-based feature restrictions
  if (userPlan === 'TRIAL') {
    if (config.ragConfig.enableRAG) {
      errors.push('RAG features require a paid plan');
    }
    if (config.learningConfig.enableAutoLearning) {
      errors.push('Auto-learning features require a paid plan');
    }
    if (config.integrationConfig.enableGoogleIntegration) {
      errors.push('Google integration requires a paid plan');
    }
    if (config.advancedConfig.enableAnalytics) {
      errors.push('Analytics features require a paid plan');
    }
  }

  if (userPlan === 'BASIC') {
    if (config.aiConfig.enableMultiModel) {
      errors.push('Multi-model support requires Pro or Enterprise plan');
    }
    if (config.advancedConfig.enableCustomBranding) {
      errors.push('Custom branding requires Pro or Enterprise plan');
    }
    if (config.performanceConfig.maxMonthlyCost > 100) {
      errors.push('Monthly cost limit exceeds Basic plan allowance');
    }
  }

  if (userPlan === 'PRO') {
    if (config.advancedConfig.enablePrioritySupport) {
      errors.push('Priority support requires Enterprise plan');
    }
    if (config.performanceConfig.maxMonthlyCost > 500) {
      errors.push('Monthly cost limit exceeds Pro plan allowance');
    }
  }

  // Check existing agent count
  const agentCount = await prisma.agent.count({
    where: { userId },
  });

  const planLimits = {
    TRIAL: 2,
    BASIC: 5,
    PRO: 20,
    ENTERPRISE: 100,
  };

  if (agentCount >= planLimits[userPlan as keyof typeof planLimits]) {
    errors.push(`Agent limit reached for ${userPlan} plan`);
  }

  return errors;
}

async function createAgentFromWizardConfig(userId: string, config: any) {
  const {
    basicInfo,
    aiConfig,
    ragConfig,
    learningConfig,
    integrationConfig,
    advancedConfig,
    performanceConfig,
    securityConfig,
    deploymentConfig,
  } = config;

  // Create the agent with all configurations
  const agent = await prisma.agent.create({
    data: {
      // Basic Information
      name: basicInfo.name,
      description: basicInfo.description,
      prompt: aiConfig.systemPrompt,
      isPublic: basicInfo.isPublic,
      userId,

      // AI Model Configuration
      model: aiConfig.model,
      modelProvider: aiConfig.modelProvider,
      temperature: aiConfig.temperature,
      maxTokens: aiConfig.maxTokens,
      fallbackModel: aiConfig.fallbackModel,
      multiModelSupport: aiConfig.enableMultiModel,

      // RAG Configuration
      enableRAG: ragConfig.enableRAG,
      ragThreshold: ragConfig.ragThreshold,
      ragMaxDocuments: ragConfig.ragMaxDocuments,
      ragSearchType: ragConfig.ragSearchType,
      ragChunkSize: ragConfig.ragChunkSize,
      ragOverlapSize: ragConfig.ragOverlapSize,
      knowledgeFiles: JSON.stringify(ragConfig.knowledgeFiles),
      knowledgeStrategy: ragConfig.knowledgeStrategy,

      // Auto-Learning Configuration
      enableAutoLearning: learningConfig.enableAutoLearning,
      learningMode: learningConfig.learningMode,
      learningThreshold: learningConfig.learningThreshold,
      learningFeedbackWeight: learningConfig.learningFeedbackWeight,
      learningRetentionDays: learningConfig.learningRetentionDays,

      // Google Integration
      enableGoogleIntegration: integrationConfig.enableGoogleIntegration,
      googleServices: JSON.stringify(integrationConfig.googleServices),

      // Auto-Handover Configuration
      enableAutoHandover: advancedConfig.enableAutoHandover,
      handoverTriggers: JSON.stringify(advancedConfig.handoverTriggers),
      handoverThresholds: JSON.stringify(advancedConfig.handoverThresholds),

      // Performance Configuration
      responseTimeoutMs: performanceConfig.responseTimeoutMs,
      concurrentRequests: performanceConfig.concurrentRequests,
      cacheTTL: performanceConfig.cacheTTL,
      enableResponseCaching: performanceConfig.enableCaching,

      // Security Configuration (stored as JSON in a new field if needed)
      // Note: Some security settings might need new database fields

      // Vietnamese-specific settings (using existing fields)
      messageDelayMs: 2000,
      enableSmartDelay: true,
      enableVietnameseMode: true,

      // Status and metadata
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    include: {
      _count: {
        select: {
          conversations: true,
        },
      },
    },
  });

  // Create wizard configuration record for tracking
  await prisma.agentWizardConfig
    .create({
      data: {
        agentId: agent.id,
        userId,
        templateId: config.selectedTemplate?.id,
        configurationData: JSON.stringify(config),
        createdAt: new Date(),
      },
    })
    .catch(error => {
      // If the table doesn't exist, that's okay - it's optional tracking
      console.log('Wizard config tracking not available:', error.message);
    });

  return agent;
}

// =============================================================================
// API ENDPOINTS
// =============================================================================

// POST /api/agents/wizard - Create agent through wizard
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();

    // Validate the wizard configuration
    const validationResult = WizardConfigurationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid configuration',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const config = validationResult.data;

    // Validate user permissions based on plan
    const permissionErrors = await validateUserPermissions(user.id, user.plan, config);
    if (permissionErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Permission denied',
          details: permissionErrors,
        },
        { status: 403 }
      );
    }

    // Validate knowledge files if RAG is enabled
    if (config.ragConfig.enableRAG && config.ragConfig.knowledgeFiles.length > 0) {
      const documents = await prisma.document.findMany({
        where: {
          id: { in: config.ragConfig.knowledgeFiles },
          userId: user.id,
          status: 'PROCESSED',
        },
      });

      if (documents.length !== config.ragConfig.knowledgeFiles.length) {
        return NextResponse.json(
          {
            error: 'Some knowledge files are invalid or not processed',
          },
          { status: 400 }
        );
      }
    }

    // Create the agent
    const agent = await createAgentFromWizardConfig(user.id, config);

    // Parse knowledge files for response
    const agentWithKnowledge = {
      ...agent,
      knowledgeFiles: agent.knowledgeFiles ? JSON.parse(agent.knowledgeFiles) : [],
      googleServices: agent.googleServices
        ? JSON.parse(agent.googleServices)
        : {
            calendar: false,
            gmail: false,
            sheets: false,
            drive: false,
            docs: false,
            forms: false,
          },
      handoverTriggers: agent.handoverTriggers ? JSON.parse(agent.handoverTriggers) : {},
      handoverThresholds: agent.handoverThresholds ? JSON.parse(agent.handoverThresholds) : {},
      wizardCreated: true,
    };

    return NextResponse.json(agentWithKnowledge, { status: 201 });
  } catch (error) {
    console.error('Error creating agent through wizard:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET /api/agents/wizard/templates - Get available templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get templates based on user plan
    const templates = [
      {
        id: 'customer_service_pro',
        name: 'Customer Service Pro',
        description: 'Advanced customer service agent with sentiment analysis and auto-handover',
        category: 'customer_service',
        difficulty: 'intermediate',
        estimatedSetupTime: 15,
        popularity: 95,
        tags: ['customer-service', 'sentiment-analysis', 'auto-handover'],
        planRequired: 'BASIC',
        features: ['RAG', 'Auto-Learning', 'Analytics', 'Auto-Handover'],
      },
      {
        id: 'sales_assistant',
        name: 'Sales Assistant',
        description: 'Intelligent sales agent with lead qualification and CRM integration',
        category: 'business',
        difficulty: 'intermediate',
        estimatedSetupTime: 20,
        popularity: 88,
        tags: ['sales', 'lead-qualification', 'crm'],
        planRequired: 'BASIC',
        features: ['RAG', 'Google Integration', 'Analytics'],
      },
      {
        id: 'education_tutor',
        name: 'Education Tutor',
        description: 'Personalized learning assistant with adaptive teaching methods',
        category: 'education',
        difficulty: 'advanced',
        estimatedSetupTime: 25,
        popularity: 78,
        tags: ['education', 'tutoring', 'adaptive-learning'],
        planRequired: 'PRO',
        features: ['RAG', 'Auto-Learning', 'Analytics', 'Progress Tracking'],
      },
      {
        id: 'healthcare_assistant',
        name: 'Healthcare Assistant',
        description: 'Medical information assistant with symptom checking',
        category: 'healthcare',
        difficulty: 'expert',
        estimatedSetupTime: 30,
        popularity: 82,
        tags: ['healthcare', 'medical', 'symptoms'],
        planRequired: 'PRO',
        features: ['RAG', 'Compliance', 'Security', 'Audit Logging'],
      },
      {
        id: 'tech_support',
        name: 'Tech Support Specialist',
        description: 'Technical support agent with troubleshooting guides',
        category: 'technology',
        difficulty: 'intermediate',
        estimatedSetupTime: 18,
        popularity: 85,
        tags: ['tech-support', 'troubleshooting', 'escalation'],
        planRequired: 'BASIC',
        features: ['RAG', 'Auto-Handover', 'Knowledge Base'],
      },
      {
        id: 'creative_assistant',
        name: 'Creative Assistant',
        description: 'AI assistant for creative projects and content generation',
        category: 'creative',
        difficulty: 'beginner',
        estimatedSetupTime: 12,
        popularity: 72,
        tags: ['creative', 'brainstorming', 'content'],
        planRequired: 'TRIAL',
        features: ['Content Generation', 'Brainstorming', 'Writing'],
      },
    ];

    // Filter templates based on user plan
    const planHierarchy = {
      TRIAL: 0,
      BASIC: 1,
      PRO: 2,
      ENTERPRISE: 3,
    };

    const userPlanLevel = planHierarchy[user.plan as keyof typeof planHierarchy] || 0;

    const availableTemplates = templates.filter(template => {
      const requiredPlanLevel =
        planHierarchy[template.planRequired as keyof typeof planHierarchy] || 0;
      return userPlanLevel >= requiredPlanLevel;
    });

    return NextResponse.json({
      templates: availableTemplates,
      userPlan: user.plan,
      totalTemplates: templates.length,
      availableTemplates: availableTemplates.length,
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/agents/wizard/validate - Validate wizard configuration
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();

    // Validate the wizard configuration
    const validationResult = WizardConfigurationSchema.safeParse(body);
    const validationErrors = [];

    if (!validationResult.success) {
      validationErrors.push(
        ...validationResult.error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      );
    }

    if (validationResult.success) {
      // Validate user permissions
      const permissionErrors = await validateUserPermissions(
        user.id,
        user.plan,
        validationResult.data
      );
      validationErrors.push(...permissionErrors);
    }

    return NextResponse.json({
      isValid: validationErrors.length === 0,
      errors: validationErrors,
      warnings: [], // Could add warnings for non-blocking issues
      suggestions: [], // Could add optimization suggestions
    });
  } catch (error) {
    console.error('Error validating wizard configuration:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
