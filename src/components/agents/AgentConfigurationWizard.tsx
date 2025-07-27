/**
 * 🧙‍♂️ Advanced Agent Configuration Wizard - DAY 28 Step 28.1
 * Multi-step wizard for creating sophisticated AI agents with templates, validation, and preview
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { CustomSwitch } from '@/components/ui/custom-switch';
import { EnableSwitchContainer } from '@/components/ui/enable-switch-container';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Sparkles,
  Settings,
  Brain,
  Database,
  Zap,
  Shield,
  Eye,
  Save,
  Copy,
  FileText,
  MessageSquare,
  Cpu,
  Cloud,
  BarChart3,
  Users,
  Globe,
  Rocket,
  Target,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Activity,
  TrendingUp,
} from 'lucide-react';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category:
    | 'business'
    | 'education'
    | 'healthcare'
    | 'technology'
    | 'customer_service'
    | 'creative'
    | 'research'
    | 'personal';
  icon: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimatedSetupTime: number; // minutes
  popularity: number; // 1-100
  tags: string[];

  // Pre-configured settings
  defaultConfig: {
    // Basic settings
    name: string;
    description: string;
    prompt: string;

    // AI Model settings
    model: string;
    modelProvider: 'openai' | 'anthropic' | 'google';
    temperature: number;
    maxTokens: number;

    // RAG settings
    enableRAG: boolean;
    ragThreshold: number;
    ragMaxDocuments: number;
    ragSearchType: 'SEMANTIC' | 'KEYWORD' | 'HYBRID';

    // Auto-learning settings
    enableAutoLearning: boolean;
    learningMode: 'PASSIVE' | 'ACTIVE' | 'HYBRID';
    learningThreshold: number;

    // Google integration
    enableGoogleIntegration: boolean;
    googleServices: {
      calendar: boolean;
      gmail: boolean;
      sheets: boolean;
      drive: boolean;
      docs: boolean;
      forms: boolean;
    };

    // Advanced features
    enableMultiModel: boolean;
    enableAutoHandover: boolean;
    enableAnalytics: boolean;
  };

  // Recommended knowledge sources
  recommendedKnowledge: {
    type: 'document' | 'website' | 'database' | 'api';
    name: string;
    description: string;
    required: boolean;
  }[];

  // Success metrics
  successMetrics: {
    name: string;
    target: number;
    unit: string;
  }[];

  // Use cases and examples
  useCases: string[];
  examples: {
    question: string;
    expectedResponse: string;
  }[];
}

export interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ComponentType<any>;
  validation: (data: any) => { isValid: boolean; errors: string[] };
  estimatedTime: number; // minutes
  optional: boolean;
}

export interface AgentConfigurationData {
  // Step 1: Template Selection
  selectedTemplate: AgentTemplate | null;
  useTemplate: boolean;

  // Step 2: Basic Information
  basicInfo: {
    name: string;
    description: string;
    category: string;
    tags: string[];
    isPublic: boolean;
    avatar?: string;
  };

  // Step 3: AI Model Configuration
  aiConfig: {
    model: string;
    modelProvider: 'openai' | 'anthropic' | 'google';
    temperature: number;
    maxTokens: number;
    fallbackModel?: string;
    enableMultiModel: boolean;
    systemPrompt: string;
    conversationStarters: string[];
  };

  // Step 4: RAG Configuration
  ragConfig: {
    enableRAG: boolean;
    ragThreshold: number;
    ragMaxDocuments: number;
    ragSearchType: 'SEMANTIC' | 'KEYWORD' | 'HYBRID';
    ragChunkSize: number;
    ragOverlapSize: number;
    knowledgeFiles: string[];
    knowledgeStrategy: 'AUTO' | 'SELECTIVE' | 'PRIORITY';
  };

  // Step 5: Auto-Learning Configuration
  learningConfig: {
    enableAutoLearning: boolean;
    learningMode: 'PASSIVE' | 'ACTIVE' | 'HYBRID';
    learningThreshold: number;
    learningFeedbackWeight: number;
    learningRetentionDays: number;
    enableFeedbackCollection: boolean;
    qualityThreshold: number;
  };

  // Step 6: Integration Configuration
  integrationConfig: {
    enableGoogleIntegration: boolean;
    googleServices: {
      calendar: boolean;
      gmail: boolean;
      sheets: boolean;
      drive: boolean;
      docs: boolean;
      forms: boolean;
    };
    enableWebhooks: boolean;
    webhookUrl?: string;
    enableApiAccess: boolean;
    apiRateLimit: number;
  };

  // Step 7: Advanced Features
  advancedConfig: {
    enableAutoHandover: boolean;
    handoverTriggers: {
      negativeSentiment: boolean;
      highPriority: boolean;
      longConversation: boolean;
      technicalIssue: boolean;
      customerRequestsHuman: boolean;
    };
    handoverThresholds: {
      sentimentThreshold: number;
      messageCountThreshold: number;
      conversationDurationThreshold: number;
    };
    enableAnalytics: boolean;
    enableCustomBranding: boolean;
    enablePrioritySupport: boolean;
  };

  // Step 8: Performance & Cost Settings
  performanceConfig: {
    responseTimeoutMs: number;
    concurrentRequests: number;
    enableCaching: boolean;
    cacheTTL: number;
    enableCostOptimization: boolean;
    maxDailyCost: number;
    maxMonthlyCost: number;
    enablePerformanceMonitoring: boolean;
  };

  // Step 9: Security & Privacy
  securityConfig: {
    enableDataEncryption: boolean;
    dataRetentionDays: number;
    enableAuditLogging: boolean;
    allowedDomains: string[];
    enableRateLimiting: boolean;
    maxRequestsPerHour: number;
    enableContentFiltering: boolean;
    contentFilterLevel: 'low' | 'medium' | 'high';
  };

  // Step 10: Review & Deploy
  deploymentConfig: {
    deploymentName: string;
    environment: 'development' | 'staging' | 'production';
    enableMonitoring: boolean;
    enableAlerts: boolean;
    alertEmail: string;
    enableBackup: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
  };
}

export interface AgentConfigurationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: AgentConfigurationData) => Promise<void>;
  initialData?: Partial<AgentConfigurationData>;
  availableDocuments?: any[];
  availableModels?: string[];
  userPlan?: 'TRIAL' | 'BASIC' | 'PRO' | 'ENTERPRISE';
}

// =============================================================================
// AGENT TEMPLATES
// =============================================================================

const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: 'customer_service_pro',
    name: 'Customer Service Pro',
    description:
      'Advanced customer service agent with sentiment analysis, auto-handover, and multi-language support',
    category: 'customer_service',
    icon: '🎧',
    difficulty: 'intermediate',
    estimatedSetupTime: 15,
    popularity: 95,
    tags: ['customer-service', 'sentiment-analysis', 'multilingual', 'auto-handover'],
    defaultConfig: {
      name: 'Customer Service Pro',
      description:
        'Advanced customer service agent with intelligent routing and sentiment analysis',
      prompt:
        'You are a professional customer service representative. Provide helpful, empathetic, and solution-focused responses. Escalate complex issues to human agents when needed.',
      model: 'gpt-4o-mini',
      modelProvider: 'openai',
      temperature: 0.7,
      maxTokens: 1000,
      enableRAG: true,
      ragThreshold: 0.8,
      ragMaxDocuments: 5,
      ragSearchType: 'HYBRID',
      enableAutoLearning: true,
      learningMode: 'ACTIVE',
      learningThreshold: 0.8,
      enableGoogleIntegration: false,
      googleServices: {
        calendar: false,
        gmail: true,
        sheets: true,
        drive: false,
        docs: false,
        forms: false,
      },
      enableMultiModel: true,
      enableAutoHandover: true,
      enableAnalytics: true,
    },
    recommendedKnowledge: [
      {
        type: 'document',
        name: 'Customer Service Guidelines',
        description: 'Company policies and procedures for customer service',
        required: true,
      },
      {
        type: 'document',
        name: 'FAQ Database',
        description: 'Frequently asked questions and answers',
        required: true,
      },
      {
        type: 'document',
        name: 'Product Catalog',
        description: 'Complete product information and specifications',
        required: false,
      },
    ],
    successMetrics: [
      { name: 'Customer Satisfaction', target: 85, unit: '%' },
      { name: 'First Response Time', target: 30, unit: 'seconds' },
      { name: 'Resolution Rate', target: 80, unit: '%' },
    ],
    useCases: [
      'Handle customer inquiries and complaints',
      'Provide product information and support',
      'Process returns and exchanges',
      'Escalate complex issues to human agents',
    ],
    examples: [
      {
        question: 'I need to return a product I bought last week',
        expectedResponse:
          "I'd be happy to help you with your return. Let me check our return policy and guide you through the process...",
      },
    ],
  },
  {
    id: 'sales_assistant',
    name: 'Sales Assistant',
    description:
      'Intelligent sales agent with lead qualification, product recommendations, and CRM integration',
    category: 'business',
    icon: '💼',
    difficulty: 'intermediate',
    estimatedSetupTime: 20,
    popularity: 88,
    tags: ['sales', 'lead-qualification', 'crm', 'recommendations'],
    defaultConfig: {
      name: 'Sales Assistant',
      description: 'AI-powered sales agent for lead qualification and product recommendations',
      prompt:
        'You are a professional sales assistant. Help customers find the right products, qualify leads, and guide them through the sales process. Be consultative and focus on customer needs.',
      model: 'gpt-4o-mini',
      modelProvider: 'openai',
      temperature: 0.6,
      maxTokens: 1200,
      enableRAG: true,
      ragThreshold: 0.75,
      ragMaxDocuments: 8,
      ragSearchType: 'SEMANTIC',
      enableAutoLearning: true,
      learningMode: 'ACTIVE',
      learningThreshold: 0.85,
      enableGoogleIntegration: true,
      googleServices: {
        calendar: true,
        gmail: true,
        sheets: true,
        drive: true,
        docs: false,
        forms: true,
      },
      enableMultiModel: true,
      enableAutoHandover: false,
      enableAnalytics: true,
    },
    recommendedKnowledge: [
      {
        type: 'document',
        name: 'Product Catalog',
        description: 'Complete product information, pricing, and specifications',
        required: true,
      },
      {
        type: 'document',
        name: 'Sales Playbook',
        description: 'Sales strategies, objection handling, and closing techniques',
        required: true,
      },
      {
        type: 'document',
        name: 'Competitor Analysis',
        description: 'Information about competitors and positioning',
        required: false,
      },
    ],
    successMetrics: [
      { name: 'Lead Conversion Rate', target: 25, unit: '%' },
      { name: 'Average Deal Size', target: 5000, unit: '$' },
      { name: 'Sales Cycle Length', target: 14, unit: 'days' },
    ],
    useCases: [
      'Qualify incoming leads',
      'Provide product recommendations',
      'Schedule sales meetings',
      'Follow up with prospects',
    ],
    examples: [
      {
        question: "What's the best solution for a small business with 10 employees?",
        expectedResponse:
          "For a small business with 10 employees, I'd recommend our Business Starter package. Let me understand your specific needs better...",
      },
    ],
  },
  {
    id: 'education_tutor',
    name: 'Education Tutor',
    description:
      'Personalized learning assistant with adaptive teaching methods and progress tracking',
    category: 'education',
    icon: '🎓',
    difficulty: 'advanced',
    estimatedSetupTime: 25,
    popularity: 78,
    tags: ['education', 'tutoring', 'adaptive-learning', 'progress-tracking'],
    defaultConfig: {
      name: 'Education Tutor',
      description: 'AI tutor that adapts to individual learning styles and tracks progress',
      prompt:
        "You are an experienced and patient tutor. Adapt your teaching style to each student's needs, provide clear explanations, and encourage learning through questions and examples.",
      model: 'gpt-4o-mini',
      modelProvider: 'openai',
      temperature: 0.8,
      maxTokens: 1500,
      enableRAG: true,
      ragThreshold: 0.7,
      ragMaxDocuments: 10,
      ragSearchType: 'HYBRID',
      enableAutoLearning: true,
      learningMode: 'ACTIVE',
      learningThreshold: 0.75,
      enableGoogleIntegration: true,
      googleServices: {
        calendar: true,
        gmail: false,
        sheets: true,
        drive: true,
        docs: true,
        forms: true,
      },
      enableMultiModel: false,
      enableAutoHandover: false,
      enableAnalytics: true,
    },
    recommendedKnowledge: [
      {
        type: 'document',
        name: 'Curriculum Materials',
        description: 'Course content, lessons, and learning objectives',
        required: true,
      },
      {
        type: 'document',
        name: 'Practice Questions',
        description: 'Exercises and assessment questions',
        required: true,
      },
      {
        type: 'document',
        name: 'Learning Resources',
        description: 'Additional reading materials and references',
        required: false,
      },
    ],
    successMetrics: [
      { name: 'Student Engagement', target: 90, unit: '%' },
      { name: 'Learning Progress', target: 75, unit: '%' },
      { name: 'Session Completion Rate', target: 85, unit: '%' },
    ],
    useCases: [
      'Provide personalized tutoring',
      'Explain complex concepts',
      'Create practice exercises',
      'Track learning progress',
    ],
    examples: [
      {
        question: 'Can you explain photosynthesis in simple terms?',
        expectedResponse:
          'Photosynthesis is like cooking for plants! Just like you need ingredients to make food, plants need sunlight, water, and carbon dioxide to make their own food...',
      },
    ],
  },
  {
    id: 'healthcare_assistant',
    name: 'Healthcare Assistant',
    description: 'Medical information assistant with symptom checking and appointment scheduling',
    category: 'healthcare',
    icon: '🏥',
    difficulty: 'expert',
    estimatedSetupTime: 30,
    popularity: 82,
    tags: ['healthcare', 'medical', 'symptoms', 'appointments'],
    defaultConfig: {
      name: 'Healthcare Assistant',
      description: 'AI assistant for medical information and healthcare support',
      prompt:
        'You are a healthcare information assistant. Provide accurate medical information while always emphasizing that you cannot replace professional medical advice. Encourage users to consult healthcare professionals for serious concerns.',
      model: 'gpt-4o-mini',
      modelProvider: 'openai',
      temperature: 0.3,
      maxTokens: 1000,
      enableRAG: true,
      ragThreshold: 0.9,
      ragMaxDocuments: 5,
      ragSearchType: 'SEMANTIC',
      enableAutoLearning: false,
      learningMode: 'PASSIVE',
      learningThreshold: 0.9,
      enableGoogleIntegration: true,
      googleServices: {
        calendar: true,
        gmail: true,
        sheets: false,
        drive: false,
        docs: false,
        forms: true,
      },
      enableMultiModel: false,
      enableAutoHandover: true,
      enableAnalytics: true,
    },
    recommendedKnowledge: [
      {
        type: 'document',
        name: 'Medical Guidelines',
        description: 'Approved medical information and guidelines',
        required: true,
      },
      {
        type: 'document',
        name: 'Symptom Database',
        description: 'Common symptoms and related conditions',
        required: true,
      },
      {
        type: 'document',
        name: 'Emergency Protocols',
        description: 'When to seek immediate medical attention',
        required: true,
      },
    ],
    successMetrics: [
      { name: 'Information Accuracy', target: 95, unit: '%' },
      { name: 'User Satisfaction', target: 88, unit: '%' },
      { name: 'Appropriate Referrals', target: 90, unit: '%' },
    ],
    useCases: [
      'Provide medical information',
      'Help with symptom assessment',
      'Schedule appointments',
      'Medication reminders',
    ],
    examples: [
      {
        question: 'I have a persistent cough. What should I do?',
        expectedResponse:
          "A persistent cough can have various causes. While I can provide general information, it's important to consult with a healthcare professional for proper evaluation...",
      },
    ],
  },
  {
    id: 'tech_support',
    name: 'Tech Support Specialist',
    description: 'Technical support agent with troubleshooting guides and escalation workflows',
    category: 'technology',
    icon: '🔧',
    difficulty: 'intermediate',
    estimatedSetupTime: 18,
    popularity: 85,
    tags: ['tech-support', 'troubleshooting', 'escalation', 'knowledge-base'],
    defaultConfig: {
      name: 'Tech Support Specialist',
      description: 'AI-powered technical support for software and hardware issues',
      prompt:
        'You are a technical support specialist. Provide clear, step-by-step troubleshooting guidance. Ask clarifying questions to understand the issue better and escalate complex problems when needed.',
      model: 'gpt-4o-mini',
      modelProvider: 'openai',
      temperature: 0.5,
      maxTokens: 1200,
      enableRAG: true,
      ragThreshold: 0.8,
      ragMaxDocuments: 8,
      ragSearchType: 'HYBRID',
      enableAutoLearning: true,
      learningMode: 'ACTIVE',
      learningThreshold: 0.8,
      enableGoogleIntegration: false,
      googleServices: {
        calendar: false,
        gmail: true,
        sheets: true,
        drive: false,
        docs: true,
        forms: false,
      },
      enableMultiModel: true,
      enableAutoHandover: true,
      enableAnalytics: true,
    },
    recommendedKnowledge: [
      {
        type: 'document',
        name: 'Troubleshooting Guide',
        description: 'Step-by-step solutions for common issues',
        required: true,
      },
      {
        type: 'document',
        name: 'Product Documentation',
        description: 'Technical specifications and user manuals',
        required: true,
      },
      {
        type: 'document',
        name: 'Known Issues Database',
        description: 'Current bugs and workarounds',
        required: false,
      },
    ],
    successMetrics: [
      { name: 'Issue Resolution Rate', target: 75, unit: '%' },
      { name: 'Average Resolution Time', target: 15, unit: 'minutes' },
      { name: 'Customer Satisfaction', target: 80, unit: '%' },
    ],
    useCases: [
      'Troubleshoot software issues',
      'Provide installation guidance',
      'Explain technical concepts',
      'Escalate complex problems',
    ],
    examples: [
      {
        question: 'My software keeps crashing when I try to save files',
        expectedResponse:
          "Let me help you troubleshoot this saving issue. First, let's check a few things to identify the cause...",
      },
    ],
  },
  {
    id: 'creative_assistant',
    name: 'Creative Assistant',
    description: 'AI assistant for creative projects, brainstorming, and content generation',
    category: 'creative',
    icon: '🎨',
    difficulty: 'beginner',
    estimatedSetupTime: 12,
    popularity: 72,
    tags: ['creative', 'brainstorming', 'content', 'writing'],
    defaultConfig: {
      name: 'Creative Assistant',
      description: 'AI assistant for creative projects and content generation',
      prompt:
        'You are a creative assistant. Help users brainstorm ideas, generate content, and overcome creative blocks. Be imaginative, inspiring, and supportive of creative exploration.',
      model: 'gpt-4o-mini',
      modelProvider: 'openai',
      temperature: 0.9,
      maxTokens: 1500,
      enableRAG: false,
      ragThreshold: 0.7,
      ragMaxDocuments: 5,
      ragSearchType: 'SEMANTIC',
      enableAutoLearning: true,
      learningMode: 'PASSIVE',
      learningThreshold: 0.7,
      enableGoogleIntegration: true,
      googleServices: {
        calendar: false,
        gmail: false,
        sheets: false,
        drive: true,
        docs: true,
        forms: false,
      },
      enableMultiModel: false,
      enableAutoHandover: false,
      enableAnalytics: false,
    },
    recommendedKnowledge: [
      {
        type: 'document',
        name: 'Creative Templates',
        description: 'Templates for various creative projects',
        required: false,
      },
      {
        type: 'document',
        name: 'Style Guides',
        description: 'Writing and design style guidelines',
        required: false,
      },
    ],
    successMetrics: [
      { name: 'User Engagement', target: 85, unit: '%' },
      { name: 'Creative Output', target: 10, unit: 'ideas per session' },
      { name: 'User Satisfaction', target: 80, unit: '%' },
    ],
    useCases: [
      'Generate creative ideas',
      'Write content and copy',
      'Brainstorm solutions',
      'Overcome creative blocks',
    ],
    examples: [
      {
        question: 'I need ideas for a marketing campaign for a new coffee shop',
        expectedResponse:
          "Let's brew up some exciting ideas for your coffee shop! Here are some creative campaign concepts to get you started...",
      },
    ],
  },
];

// =============================================================================
// WIZARD STEPS COMPONENTS
// =============================================================================

const TemplateSelectionStep: React.FC<{
  data: AgentConfigurationData;
  onChange: (data: Partial<AgentConfigurationData>) => void;
}> = ({ data, onChange }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { id: 'all', name: 'All Templates', icon: '📋' },
    { id: 'business', name: 'Business', icon: '💼' },
    { id: 'customer_service', name: 'Customer Service', icon: '🎧' },
    { id: 'education', name: 'Education', icon: '🎓' },
    { id: 'healthcare', name: 'Healthcare', icon: '🏥' },
    { id: 'technology', name: 'Technology', icon: '🔧' },
    { id: 'creative', name: 'Creative', icon: '🎨' },
  ];

  const filteredTemplates = AGENT_TEMPLATES.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // 🔧 Fixed: Use useCallback for template selection to prevent re-renders
  const handleTemplateSelect = useCallback(
    (template: AgentTemplate) => {
      console.log('🎯 Template selected:', template.name);
      console.log('🔄 Calling onChange with template data...');
      onChange({
        selectedTemplate: template,
        useTemplate: true,
        // Pre-populate other steps with template data
        basicInfo: {
          name: template.defaultConfig.name,
          description: template.defaultConfig.description,
          category: template.category,
          tags: template.tags,
          isPublic: false,
        },
        aiConfig: {
          model: template.defaultConfig.model,
          modelProvider: template.defaultConfig.modelProvider,
          temperature: template.defaultConfig.temperature,
          maxTokens: template.defaultConfig.maxTokens,
          enableMultiModel: template.defaultConfig.enableMultiModel,
          systemPrompt: template.defaultConfig.prompt,
          conversationStarters: [],
        },
        ragConfig: {
          enableRAG: template.defaultConfig.enableRAG,
          ragThreshold: template.defaultConfig.ragThreshold,
          ragMaxDocuments: template.defaultConfig.ragMaxDocuments,
          ragSearchType: template.defaultConfig.ragSearchType,
          ragChunkSize: 500,
          ragOverlapSize: 50,
          knowledgeFiles: [],
          knowledgeStrategy: 'AUTO',
        },
        learningConfig: {
          enableAutoLearning: template.defaultConfig.enableAutoLearning,
          learningMode: template.defaultConfig.learningMode,
          learningThreshold: template.defaultConfig.learningThreshold,
          learningFeedbackWeight: 0.3,
          learningRetentionDays: 30,
          enableFeedbackCollection: true,
          qualityThreshold: 0.8,
        },
        integrationConfig: {
          enableGoogleIntegration: template.defaultConfig.enableGoogleIntegration,
          googleServices: template.defaultConfig.googleServices,
          enableWebhooks: false,
          enableApiAccess: false,
          apiRateLimit: 100,
        },
        advancedConfig: {
          enableAutoHandover: template.defaultConfig.enableAutoHandover,
          handoverTriggers: {
            negativeSentiment: false,
            highPriority: false,
            longConversation: false,
            technicalIssue: false,
            customerRequestsHuman: false,
          },
          handoverThresholds: {
            sentimentThreshold: 0.5,
            messageCountThreshold: 10,
            conversationDurationThreshold: 300,
          },
          enableAnalytics: template.defaultConfig.enableAnalytics,
          enableCustomBranding: false,
          enablePrioritySupport: false,
        },
      });
    },
    [onChange]
  );

  // 🔧 Fixed: Use useCallback for start from scratch
  const handleStartFromScratch = useCallback(() => {
    console.log('🆕 Starting from scratch');
    onChange({ useTemplate: false, selectedTemplate: null });
  }, [onChange]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-500/20 text-green-400';
      case 'intermediate':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'advanced':
        return 'bg-orange-500/20 text-orange-400';
      case 'expert':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className='space-y-6'>
      <div className='text-center'>
        <h2 className='text-2xl font-bold text-white mb-2'>Choose Your Agent Template</h2>
        <p className='text-gray-400'>Select a pre-configured template or start from scratch</p>
      </div>

      {/* Search and Filter */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <div className='flex-1'>
          <Input
            placeholder='Search templates...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className='bg-gray-800/80 border-gray-500 text-white placeholder-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20'
          />
        </div>
        <div className='flex flex-wrap gap-2'>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedCategory === category.id
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-gray-700/60 text-gray-200 hover:bg-gray-600/80 hover:text-white'
              }`}
            >
              {category.icon} {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Start from Scratch Option */}
      <div className='mb-6'>
        <div className='cursor-pointer transition-all' onClick={handleStartFromScratch}>
          <Card
            className={`bg-gray-800/80 border-gray-500 hover:border-purple-400 transition-all duration-200 ${
              !data.useTemplate
                ? 'border-purple-400 bg-purple-500/20 shadow-lg shadow-purple-500/20'
                : ''
            }`}
          >
            <CardContent className='p-6'>
              <div className='flex items-center space-x-4'>
                <div className='w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center'>
                  <Sparkles className='w-6 h-6 text-white' />
                </div>
                <div className='flex-1'>
                  <h3 className='text-lg font-semibold text-white'>Start from Scratch</h3>
                  <p className='text-gray-400'>
                    Create a completely custom agent with your own configuration
                  </p>
                </div>
                <div className='text-right'>
                  <Badge className='bg-purple-500/20 text-purple-400'>Custom</Badge>
                  <p className='text-sm text-gray-400 mt-1'>~30 min</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Template Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {filteredTemplates.map(template => (
          <div
            key={template.id}
            className='cursor-pointer transition-all'
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🖱️ Template div clicked:', template.name);
              handleTemplateSelect(template);
            }}
          >
            <Card
              className={`bg-gray-800/80 border-2 hover:border-blue-400 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
                data.selectedTemplate?.id === template.id
                  ? 'border-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/20'
                  : 'border-gray-500'
              }`}
            >
              <CardHeader className='pb-3'>
                <div className='flex items-start justify-between'>
                  <div className='flex items-center space-x-3'>
                    <div className='text-2xl'>{template.icon}</div>
                    <div>
                      <CardTitle className='text-white text-lg'>{template.name}</CardTitle>
                      <p className='text-gray-400 text-sm'>{template.description}</p>
                    </div>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <Badge className={getDifficultyColor(template.difficulty)}>
                      {template.difficulty}
                    </Badge>
                    <div className='flex items-center space-x-1 text-yellow-400'>
                      <TrendingUp className='w-4 h-4' />
                      <span className='text-sm'>{template.popularity}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='pt-0'>
                <div className='space-y-3'>
                  {/* Tags */}
                  <div className='flex flex-wrap gap-1'>
                    {template.tags.slice(0, 3).map(tag => (
                      <Badge
                        key={tag}
                        variant='outline'
                        className='text-xs border-gray-600 text-gray-400'
                      >
                        {tag}
                      </Badge>
                    ))}
                    {template.tags.length > 3 && (
                      <Badge variant='outline' className='text-xs border-gray-600 text-gray-400'>
                        +{template.tags.length - 3} more
                      </Badge>
                    )}
                  </div>

                  {/* Setup Info */}
                  <div className='flex items-center justify-between text-sm text-gray-400'>
                    <div className='flex items-center space-x-1'>
                      <Clock className='w-4 h-4' />
                      <span>~{template.estimatedSetupTime} min</span>
                    </div>
                    <div className='flex items-center space-x-1'>
                      <FileText className='w-4 h-4' />
                      <span>{template.recommendedKnowledge.length} knowledge sources</span>
                    </div>
                  </div>

                  {/* Key Features */}
                  <div className='grid grid-cols-2 gap-2 text-xs'>
                    {template.defaultConfig.enableRAG && (
                      <div className='flex items-center space-x-1 text-green-400'>
                        <Database className='w-3 h-3' />
                        <span>RAG Enabled</span>
                      </div>
                    )}
                    {template.defaultConfig.enableAutoLearning && (
                      <div className='flex items-center space-x-1 text-blue-400'>
                        <Brain className='w-3 h-3' />
                        <span>Auto Learning</span>
                      </div>
                    )}
                    {template.defaultConfig.enableGoogleIntegration && (
                      <div className='flex items-center space-x-1 text-purple-400'>
                        <Globe className='w-3 h-3' />
                        <span>Google Integration</span>
                      </div>
                    )}
                    {template.defaultConfig.enableMultiModel && (
                      <div className='flex items-center space-x-1 text-orange-400'>
                        <Cpu className='w-3 h-3' />
                        <span>Multi-Model</span>
                      </div>
                    )}
                  </div>

                  {/* Use Cases Preview */}
                  <div className='text-xs text-gray-400'>
                    <span className='font-medium'>Use cases:</span>{' '}
                    {template.useCases.slice(0, 2).join(', ')}
                    {template.useCases.length > 2 && '...'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className='text-center py-12'>
          <div className='text-gray-400 text-lg'>No templates found matching your criteria</div>
          <p className='text-gray-500 mt-2'>Try adjusting your search or category filter</p>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// MAIN WIZARD COMPONENT
// =============================================================================

// TODO @final-check: Consider splitting this 2185-line component into smaller modules for better maintainability
// - Split into separate step components (TemplateStep, BasicInfoStep, etc.)
// - Extract validation logic into hooks
// - Consider lazy loading non-critical steps
export default function AgentConfigurationWizard({
  isOpen,
  onClose,
  onSave,
  initialData = {},
  availableDocuments = [],
  availableModels = [],
  userPlan = 'TRIAL',
}: AgentConfigurationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const [configData, setConfigData] = useState<AgentConfigurationData>({
    selectedTemplate: null,
    useTemplate: false,
    basicInfo: {
      name: '',
      description: '',
      category: '',
      tags: [],
      isPublic: false,
    },
    aiConfig: {
      model: 'gpt-4o-mini',
      modelProvider: 'openai',
      temperature: 0.7,
      maxTokens: 1000,
      enableMultiModel: false,
      systemPrompt: '',
      conversationStarters: [],
    },
    ragConfig: {
      enableRAG: false,
      ragThreshold: 0.7,
      ragMaxDocuments: 5,
      ragSearchType: 'SEMANTIC',
      ragChunkSize: 500,
      ragOverlapSize: 50,
      knowledgeFiles: [],
      knowledgeStrategy: 'AUTO',
    },
    learningConfig: {
      enableAutoLearning: false,
      learningMode: 'PASSIVE',
      learningThreshold: 0.8,
      learningFeedbackWeight: 0.3,
      learningRetentionDays: 30,
      enableFeedbackCollection: true,
      qualityThreshold: 0.8,
    },
    integrationConfig: {
      enableGoogleIntegration: false,
      googleServices: {
        calendar: false,
        gmail: false,
        sheets: false,
        drive: false,
        docs: false,
        forms: false,
      },
      enableWebhooks: false,
      enableApiAccess: false,
      apiRateLimit: 100,
    },
    advancedConfig: {
      enableAutoHandover: false,
      handoverTriggers: {
        negativeSentiment: false,
        highPriority: false,
        longConversation: false,
        technicalIssue: false,
        customerRequestsHuman: false,
      },
      handoverThresholds: {
        sentimentThreshold: 0.5,
        messageCountThreshold: 10,
        conversationDurationThreshold: 300,
      },
      enableAnalytics: false,
      enableCustomBranding: false,
      enablePrioritySupport: false,
    },
    performanceConfig: {
      responseTimeoutMs: 30000,
      concurrentRequests: 3,
      enableCaching: true,
      cacheTTL: 3600,
      enableCostOptimization: false,
      maxDailyCost: 10,
      maxMonthlyCost: 300,
      enablePerformanceMonitoring: true,
    },
    securityConfig: {
      enableDataEncryption: true,
      dataRetentionDays: 90,
      enableAuditLogging: true,
      allowedDomains: [],
      enableRateLimiting: true,
      maxRequestsPerHour: 1000,
      enableContentFiltering: true,
      contentFilterLevel: 'medium',
    },
    deploymentConfig: {
      deploymentName: '',
      environment: 'development',
      enableMonitoring: true,
      enableAlerts: true,
      alertEmail: '',
      enableBackup: true,
      backupFrequency: 'daily',
    },
    ...initialData,
  });

  const steps: WizardStep[] = [
    {
      id: 'template',
      title: 'Template Selection',
      description: 'Choose a pre-configured template or start from scratch',
      icon: <Sparkles className='w-5 h-5' />,
      component: TemplateSelectionStep,
      validation: data => ({ isValid: true, errors: [] }),
      estimatedTime: 3,
      optional: false,
    },
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Name, description, and basic settings',
      icon: <FileText className='w-5 h-5' />,
      component: ({ data, onChange }) => {
        // 🔧 Fixed: Use useCallback for input handlers to prevent focus loss
        const handleNameChange = React.useCallback(
          (e: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = e.target.value;
            onChange((prevData: AgentConfigurationData) => ({
              ...prevData,
              basicInfo: { ...prevData.basicInfo, name: newValue },
            }));
          },
          [onChange]
        );

        const handleCategoryChange = React.useCallback(
          (value: string) => {
            onChange((prevData: AgentConfigurationData) => ({
              ...prevData,
              basicInfo: { ...prevData.basicInfo, category: value },
            }));
          },
          [onChange]
        );

        const handleDescriptionChange = React.useCallback(
          (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            const newValue = e.target.value;
            onChange((prevData: AgentConfigurationData) => ({
              ...prevData,
              basicInfo: { ...prevData.basicInfo, description: newValue },
            }));
          },
          [onChange]
        );

        return (
          <div className='space-y-6'>
            <div className='text-center'>
              <h2 className='text-2xl font-bold text-white mb-2'>Basic Information</h2>
              <p className='text-gray-400'>Tell us about your agent's purpose and identity</p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <Label htmlFor='agent-name' className='text-white font-medium'>
                  Agent Name *
                </Label>
                <Input
                  id='agent-name'
                  placeholder='e.g., Customer Support Assistant'
                  value={data.basicInfo.name}
                  onChange={handleNameChange}
                  className='bg-gray-800/80 border-gray-500 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='agent-category' className='text-white font-medium'>
                  Category *
                </Label>
                <Select value={data.basicInfo.category} onValueChange={handleCategoryChange}>
                  <SelectTrigger className='bg-gray-800/80 border-gray-500 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200'>
                    <SelectValue placeholder='Select category' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='business'>Business</SelectItem>
                    <SelectItem value='customer_service'>Customer Service</SelectItem>
                    <SelectItem value='education'>Education</SelectItem>
                    <SelectItem value='healthcare'>Healthcare</SelectItem>
                    <SelectItem value='technology'>Technology</SelectItem>
                    <SelectItem value='creative'>Creative</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='md:col-span-2 space-y-2'>
                <Label htmlFor='agent-description' className='text-white font-medium'>
                  Description *
                </Label>
                <Textarea
                  id='agent-description'
                  placeholder='Describe what your agent does and how it helps users...'
                  value={data.basicInfo.description}
                  onChange={handleDescriptionChange}
                  className='bg-gray-800/80 border-gray-500 text-white min-h-[100px] focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200'
                />
              </div>

              <div className='md:col-span-2 flex items-center space-x-3 p-4 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-lg border border-gray-600/50 hover:border-blue-400/50 transition-all duration-200'>
                <CustomSwitch
                  checked={data.basicInfo.isPublic}
                  onCheckedChange={(checked) => onChange({
                    basicInfo: { ...data.basicInfo, isPublic: checked },
                  })}
                  size="md"
                />
                <Label className='text-white font-medium'>Make this agent public</Label>
                <div className='ml-auto'>
                  {data.basicInfo.isPublic ? (
                    <span className='text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full flex items-center gap-1'>
                      <div className='w-2 h-2 bg-green-400 rounded-full'></div>
                      Public
                    </span>
                  ) : (
                    <span className='text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full flex items-center gap-1'>
                      <div className='w-2 h-2 bg-red-400 rounded-full'></div>
                      Private
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      },
      validation: data => {
        const errors = [];
        if (!data.basicInfo?.name) errors.push('Agent name is required');
        if (!data.basicInfo?.description) errors.push('Agent description is required');
        if (!data.basicInfo?.category) errors.push('Category is required');
        return { isValid: errors.length === 0, errors };
      },
      estimatedTime: 5,
      optional: false,
    },
    {
      id: 'ai',
      title: 'AI Configuration',
      description: 'Model selection and AI behavior settings',
      icon: <Brain className='w-5 h-5' />,
      component: ({ data, onChange }) => {
        // 🔧 Fixed: Use useCallback for AI config handlers to prevent focus loss
        const handleModelProviderChange = React.useCallback(
          (value: string) => {
            onChange((prevData: AgentConfigurationData) => ({
              ...prevData,
              aiConfig: { ...prevData.aiConfig, modelProvider: value as any },
            }));
          },
          [onChange]
        );

        const handleModelChange = React.useCallback(
          (value: string) => {
            onChange((prevData: AgentConfigurationData) => ({
              ...prevData,
              aiConfig: { ...prevData.aiConfig, model: value },
            }));
          },
          [onChange]
        );

        const handleTemperatureChange = React.useCallback(
          (value: number[]) => {
            onChange((prevData: AgentConfigurationData) => ({
              ...prevData,
              aiConfig: { ...prevData.aiConfig, temperature: value[0] },
            }));
          },
          [onChange]
        );

        const handleMaxTokensChange = React.useCallback(
          (e: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = parseInt(e.target.value);
            onChange((prevData: AgentConfigurationData) => ({
              ...prevData,
              aiConfig: { ...prevData.aiConfig, maxTokens: newValue },
            }));
          },
          [onChange]
        );

        const handleSystemPromptChange = React.useCallback(
          (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            const newValue = e.target.value;
            onChange((prevData: AgentConfigurationData) => ({
              ...prevData,
              aiConfig: { ...prevData.aiConfig, systemPrompt: newValue },
            }));
          },
          [onChange]
        );

        return (
          <div className='space-y-6'>
            <div className='text-center'>
              <h2 className='text-2xl font-bold text-white mb-2'>AI Configuration</h2>
              <p className='text-gray-400'>Configure your agent's AI model and behavior</p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <Label className='text-white font-medium'>Model Provider *</Label>
                <Select
                  value={data.aiConfig.modelProvider}
                  onValueChange={handleModelProviderChange}
                >
                  <SelectTrigger className='bg-gray-800/90 border-gray-500 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200 hover:bg-gray-700/90'>
                    <SelectValue placeholder='Select provider' />
                  </SelectTrigger>
                  <SelectContent className='bg-gray-800/95 border-gray-600 backdrop-blur-md'>
                    <SelectItem value='openai' className='text-white hover:bg-blue-600/20 focus:bg-blue-600/20'>
                      <div className='flex items-center gap-2'>
                        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                        OpenAI
                      </div>
                    </SelectItem>
                    <SelectItem value='anthropic' className='text-white hover:bg-blue-600/20 focus:bg-blue-600/20'>
                      <div className='flex items-center gap-2'>
                        <div className='w-2 h-2 bg-orange-500 rounded-full'></div>
                        Anthropic
                      </div>
                    </SelectItem>
                    <SelectItem value='google' className='text-white hover:bg-blue-600/20 focus:bg-blue-600/20'>
                      <div className='flex items-center gap-2'>
                        <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                        Google
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label className='text-white font-medium'>Model *</Label>
                <Select value={data.aiConfig.model} onValueChange={handleModelChange}>
                  <SelectTrigger className='bg-gray-800/90 border-gray-500 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200 hover:bg-gray-700/90'>
                    <SelectValue placeholder='Select model' />
                  </SelectTrigger>
                  <SelectContent className='bg-gray-800/95 border-gray-600 backdrop-blur-md'>
                    <SelectItem value='gpt-4o-mini' className='text-white hover:bg-blue-600/20 focus:bg-blue-600/20'>
                      <div className='flex items-center gap-2'>
                        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                        GPT-4o Mini
                        <span className='text-xs text-green-400 ml-auto'>Fast</span>
                      </div>
                    </SelectItem>
                    <SelectItem value='gpt-4o' className='text-white hover:bg-blue-600/20 focus:bg-blue-600/20'>
                      <div className='flex items-center gap-2'>
                        <div className='w-2 h-2 bg-purple-500 rounded-full'></div>
                        GPT-4o
                        <span className='text-xs text-purple-400 ml-auto'>Premium</span>
                      </div>
                    </SelectItem>
                    <SelectItem value='claude-3-5-sonnet-20241022' className='text-white hover:bg-blue-600/20 focus:bg-blue-600/20'>
                      <div className='flex items-center gap-2'>
                        <div className='w-2 h-2 bg-orange-500 rounded-full'></div>
                        Claude 3.5 Sonnet
                        <span className='text-xs text-orange-400 ml-auto'>Smart</span>
                      </div>
                    </SelectItem>
                    <SelectItem value='gemini-1.5-flash' className='text-white hover:bg-blue-600/20 focus:bg-blue-600/20'>
                      <div className='flex items-center gap-2'>
                        <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                        Gemini 1.5 Flash
                        <span className='text-xs text-blue-400 ml-auto'>Efficient</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-3'>
                <Label className='text-white font-medium flex items-center gap-2'>
                  <span className='text-orange-400'>🌡️</span>
                  Temperature: 
                  <span className='bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent font-bold'>
                    {data.aiConfig.temperature}
                  </span>
                </Label>
                <div className='relative p-4 bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-xl border border-gray-600/50 backdrop-blur-sm hover:border-orange-400/50 transition-all duration-300'>
                  <div className='relative'>
                    {/* Custom slider track */}
                    <div className='h-2 bg-gray-700 rounded-full relative overflow-hidden'>
                      <div 
                        className='h-full bg-gradient-to-r from-blue-500 via-orange-400 to-red-500 rounded-full transition-all duration-200'
                        style={{ width: `${(data.aiConfig.temperature / 1) * 100}%` }}
                      />
                    </div>
                    <Slider
                      value={[data.aiConfig.temperature]}
                      onValueChange={handleTemperatureChange}
                      max={1}
                      min={0}
                      step={0.1}
                      className='w-full absolute top-0 left-0 [&_[role=slider]]:bg-white [&_[role=slider]]:border-2 [&_[role=slider]]:border-orange-400 [&_[role=slider]]:shadow-lg [&_[role=slider]]:shadow-orange-400/50 [&_[role=slider]]:w-5 [&_[role=slider]]:h-5 [&_[role=slider]]:hover:scale-110 [&_[role=slider]]:transition-transform [&_.relative]:bg-transparent'
                    />
                  </div>
                  <div className='flex justify-between text-xs text-gray-400 mt-3'>
                    <span className='flex items-center gap-1'>
                      <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                      Precise (0.0)
                    </span>
                    <span className='flex items-center gap-1'>
                      <div className='w-2 h-2 bg-orange-400 rounded-full'></div>
                      Balanced (0.5)
                    </span>
                    <span className='flex items-center gap-1'>
                      <div className='w-2 h-2 bg-red-500 rounded-full'></div>
                      Creative (1.0)
                    </span>
                  </div>
                </div>
                <p className='text-xs text-gray-400 flex items-center gap-1'>
                  <span className='text-blue-400'>💡</span>
                  Higher values make output more creative and unpredictable
                </p>
              </div>

              <div className='space-y-2'>
                <Label className='text-white font-medium'>Max Tokens</Label>
                <Input
                  type='number'
                  value={data.aiConfig.maxTokens}
                  onChange={handleMaxTokensChange}
                  className='bg-gray-800/80 border-gray-500 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200'
                />
              </div>

              <div className='md:col-span-2 space-y-2'>
                <Label className='text-white font-medium'>System Prompt *</Label>
                <Textarea
                  placeholder='You are a helpful AI assistant. Your role is to...'
                  value={data.aiConfig.systemPrompt}
                  onChange={handleSystemPromptChange}
                  className='bg-gray-800/80 border-gray-500 text-white min-h-[120px] focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200'
                />
              </div>
            </div>
          </div>
        );
      },
      validation: data => {
        const errors = [];
        if (!data.aiConfig?.model) errors.push('AI model is required');
        if (!data.aiConfig?.systemPrompt) errors.push('System prompt is required');
        return { isValid: errors.length === 0, errors };
      },
      estimatedTime: 8,
      optional: false,
    },
    {
      id: 'rag',
      title: 'Knowledge & RAG',
      description: 'Configure knowledge sources and RAG settings',
      icon: <Database className='w-5 h-5' />,
      component: ({ data, onChange }) => {
        const handleRAGEnableChange = React.useCallback((checked: boolean) => {
          onChange((prevData: AgentConfigurationData) => ({
            ...prevData,
            ragConfig: { ...prevData.ragConfig, enableRAG: checked },
          }));
        }, [onChange]);

        const handleRAGSearchTypeChange = React.useCallback((value: string) => {
          onChange((prevData: AgentConfigurationData) => ({
            ...prevData,
            ragConfig: { ...prevData.ragConfig, ragSearchType: value as any },
          }));
        }, [onChange]);

        const handleRAGMaxDocumentsChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
          const newValue = parseInt(e.target.value);
          onChange((prevData: AgentConfigurationData) => ({
            ...prevData,
            ragConfig: { ...prevData.ragConfig, ragMaxDocuments: newValue },
          }));
        }, [onChange]);

        const handleRAGThresholdChange = React.useCallback((value: number[]) => {
          onChange((prevData: AgentConfigurationData) => ({
            ...prevData,
            ragConfig: { ...prevData.ragConfig, ragThreshold: value[0] },
          }));
        }, [onChange]);

        return (
        <div className='space-y-6'>
          <div className='text-center'>
            <h2 className='text-2xl font-bold text-white mb-2'>Knowledge & RAG Configuration</h2>
            <p className='text-gray-400'>Configure how your agent accesses and uses knowledge</p>
          </div>

          <div className='space-y-4'>
            <EnableSwitchContainer
              checked={data.ragConfig.enableRAG}
              onCheckedChange={handleRAGEnableChange}
              title="Enable RAG"
              description="Allow your agent to use knowledge sources for better responses"
              icon={<Database className='w-5 h-5' />}
              iconBgColor="green"
              iconColor="green"
              borderColor="green"
              shadowColor="green"
              size="md"
            />

            {data.ragConfig.enableRAG && (
              <div className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label className='text-white font-medium'>Search Type</Label>
                    <Select
                      value={data.ragConfig.ragSearchType}
                      onValueChange={handleRAGSearchTypeChange}
                    >
                      <SelectTrigger className='bg-gray-800/90 border-gray-600 text-white hover:bg-gray-700/90 focus:border-green-400 focus:ring-2 focus:ring-green-400/20 transition-all duration-200'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className='bg-gray-800/95 border-gray-600 backdrop-blur-md'>
                        <SelectItem value='SEMANTIC' className='text-white hover:bg-green-600/20 focus:bg-green-600/20'>
                          <div className='flex items-center gap-2'>
                            <div className='w-2 h-2 bg-purple-500 rounded-full'></div>
                            Semantic Search
                            <span className='text-xs text-purple-400 ml-auto'>AI-powered</span>
                          </div>
                        </SelectItem>
                        <SelectItem value='KEYWORD' className='text-white hover:bg-green-600/20 focus:bg-green-600/20'>
                          <div className='flex items-center gap-2'>
                            <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                            Keyword Search
                            <span className='text-xs text-blue-400 ml-auto'>Exact match</span>
                          </div>
                        </SelectItem>
                        <SelectItem value='HYBRID' className='text-white hover:bg-green-600/20 focus:bg-green-600/20'>
                          <div className='flex items-center gap-2'>
                            <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                            Hybrid Search
                            <span className='text-xs text-green-400 ml-auto'>Best of both</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label className='text-white font-medium'>Max Documents</Label>
                    <Input
                      type='number'
                      value={data.ragConfig.ragMaxDocuments}
                      onChange={handleRAGMaxDocumentsChange}
                      className='bg-gray-800/90 border-gray-600 text-white hover:bg-gray-700/90 focus:border-green-400 focus:ring-2 focus:ring-green-400/20 transition-all duration-200'
                    />
                  </div>
                </div>

                <div className='space-y-3'>
                  <Label className='text-white font-medium flex items-center gap-2'>
                    <span className='text-green-400'>🎯</span>
                    Similarity Threshold: 
                    <span className='bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent font-bold'>
                      {data.ragConfig.ragThreshold}
                    </span>
                  </Label>
                  <div className='relative p-4 bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-xl border border-gray-600/50 backdrop-blur-sm hover:border-green-400/50 transition-all duration-300'>
                    <div className='relative'>
                      <div className='h-2 bg-gray-700 rounded-full relative overflow-hidden'>
                        <div 
                          className='h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-200'
                          style={{ width: `${(data.ragConfig.ragThreshold / 1) * 100}%` }}
                        />
                      </div>
                      <Slider
                        value={[data.ragConfig.ragThreshold]}
                        onValueChange={handleRAGThresholdChange}
                        max={1}
                        min={0}
                        step={0.1}
                        className='w-full absolute top-0 left-0 [&_[role=slider]]:bg-white [&_[role=slider]]:border-2 [&_[role=slider]]:border-green-400 [&_[role=slider]]:shadow-lg [&_[role=slider]]:shadow-green-400/50 [&_[role=slider]]:w-5 [&_[role=slider]]:h-5 [&_[role=slider]]:hover:scale-110 [&_[role=slider]]:transition-transform [&_.relative]:bg-transparent'
                      />
                    </div>
                    <div className='flex justify-between text-xs text-gray-400 mt-3'>
                      <span className='flex items-center gap-1'>
                        <div className='w-2 h-2 bg-red-500 rounded-full'></div>
                        Loose (0.0)
                      </span>
                      <span className='flex items-center gap-1'>
                        <div className='w-2 h-2 bg-yellow-400 rounded-full'></div>
                        Balanced (0.5)
                      </span>
                      <span className='flex items-center gap-1'>
                        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                        Strict (1.0)
                      </span>
                    </div>
                  </div>
                  <p className='text-xs text-gray-400 flex items-center gap-1'>
                    <span className='text-green-400'>💡</span>
                    Higher values require more similarity to retrieve documents
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        );
      },
      validation: data => ({ isValid: true, errors: [] }),
      estimatedTime: 10,
      optional: true,
    },
    {
      id: 'learning',
      title: 'Auto-Learning',
      description: 'Set up automatic learning and improvement',
      icon: <TrendingUp className='w-5 h-5' />,
      component: ({ data, onChange }) => {
        const handleLearningEnableChange = React.useCallback((checked: boolean) => {
          onChange((prevData: AgentConfigurationData) => ({
            ...prevData,
            learningConfig: { ...prevData.learningConfig, enableAutoLearning: checked },
          }));
        }, [onChange]);

        const handleLearningModeChange = React.useCallback((value: string) => {
          onChange((prevData: AgentConfigurationData) => ({
            ...prevData,
            learningConfig: { ...prevData.learningConfig, learningMode: value as any },
          }));
        }, [onChange]);

        const handleLearningThresholdChange = React.useCallback((value: number[]) => {
          onChange((prevData: AgentConfigurationData) => ({
            ...prevData,
            learningConfig: { ...prevData.learningConfig, learningThreshold: value[0] },
          }));
        }, [onChange]);

        return (
        <div className='space-y-6'>
          <div className='text-center'>
            <h2 className='text-2xl font-bold text-white mb-2'>Auto-Learning Configuration</h2>
            <p className='text-gray-400'>Configure how your agent learns and improves</p>
          </div>

          <div className='space-y-4'>
            <EnableSwitchContainer
              checked={data.learningConfig.enableAutoLearning}
              onCheckedChange={handleLearningEnableChange}
              title="Enable Auto-Learning"
              description="Allow your agent to learn from interactions and improve over time"
              icon={<TrendingUp className='w-5 h-5' />}
              iconBgColor="purple"
              iconColor="purple"
              borderColor="purple"
              shadowColor="purple"
              size="md"
            />

            {data.learningConfig.enableAutoLearning && (
              <div className='space-y-4'>
                <div className='space-y-2'>
                  <Label className='text-white font-medium'>Learning Mode</Label>
                  <Select
                    value={data.learningConfig.learningMode}
                    onValueChange={handleLearningModeChange}
                  >
                    <SelectTrigger className='bg-gray-800/90 border-gray-600 text-white hover:bg-gray-700/90 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-200'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className='bg-gray-800/95 border-gray-600 backdrop-blur-md'>
                      <SelectItem value='PASSIVE' className='text-white hover:bg-purple-600/20 focus:bg-purple-600/20'>
                        <div className='flex items-center gap-2'>
                          <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                          Passive Learning
                          <span className='text-xs text-blue-400 ml-auto'>Observes</span>
                        </div>
                      </SelectItem>
                      <SelectItem value='ACTIVE' className='text-white hover:bg-purple-600/20 focus:bg-purple-600/20'>
                        <div className='flex items-center gap-2'>
                          <div className='w-2 h-2 bg-purple-500 rounded-full'></div>
                          Active Learning
                          <span className='text-xs text-purple-400 ml-auto'>Adapts</span>
                        </div>
                      </SelectItem>
                      <SelectItem value='HYBRID' className='text-white hover:bg-purple-600/20 focus:bg-purple-600/20'>
                        <div className='flex items-center gap-2'>
                          <div className='w-2 h-2 bg-pink-500 rounded-full'></div>
                          Hybrid Learning
                          <span className='text-xs text-pink-400 ml-auto'>Best of both</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-3'>
                  <Label className='text-white font-medium flex items-center gap-2'>
                    <span className='text-purple-400'>🎯</span>
                    Learning Threshold: 
                    <span className='bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-bold'>
                      {data.learningConfig.learningThreshold}
                    </span>
                  </Label>
                  <div className='relative p-4 bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-xl border border-gray-600/50 backdrop-blur-sm hover:border-purple-400/50 transition-all duration-300'>
                    <div className='relative'>
                      <div className='h-2 bg-gray-700 rounded-full relative overflow-hidden'>
                        <div 
                          className='h-full bg-gradient-to-r from-purple-400 to-pink-500 rounded-full transition-all duration-200'
                          style={{ width: `${(data.learningConfig.learningThreshold / 1) * 100}%` }}
                        />
                      </div>
                      <Slider
                        value={[data.learningConfig.learningThreshold]}
                        onValueChange={handleLearningThresholdChange}
                        max={1}
                        min={0}
                        step={0.1}
                        className='w-full absolute top-0 left-0 [&_[role=slider]]:bg-white [&_[role=slider]]:border-2 [&_[role=slider]]:border-purple-400 [&_[role=slider]]:shadow-lg [&_[role=slider]]:shadow-purple-400/50 [&_[role=slider]]:w-5 [&_[role=slider]]:h-5 [&_[role=slider]]:hover:scale-110 [&_[role=slider]]:transition-transform [&_.relative]:bg-transparent'
                      />
                    </div>
                    <div className='flex justify-between text-xs text-gray-400 mt-3'>
                      <span className='flex items-center gap-1'>
                        <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                        Low (0.0)
                      </span>
                      <span className='flex items-center gap-1'>
                        <div className='w-2 h-2 bg-purple-400 rounded-full'></div>
                        Medium (0.5)
                      </span>
                      <span className='flex items-center gap-1'>
                        <div className='w-2 h-2 bg-pink-500 rounded-full'></div>
                        High (1.0)
                      </span>
                    </div>
                  </div>
                  <p className='text-xs text-gray-400 flex items-center gap-1'>
                    <span className='text-purple-400'>💡</span>
                    Higher values require more confidence to trigger learning
                  </p>
                </div>

                <div className='space-y-2'>
                  <Label className='text-white font-medium'>Retention Days</Label>
                  <Input
                    type='number'
                    value={data.learningConfig.learningRetentionDays}
                    onChange={e =>
                      onChange({
                        learningConfig: {
                          ...data.learningConfig,
                          learningRetentionDays: parseInt(e.target.value),
                        },
                      })
                    }
                    className='bg-gray-800/90 border-gray-600 text-white hover:bg-gray-700/90 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-200'
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        );
      },
      validation: data => ({ isValid: true, errors: [] }),
      estimatedTime: 6,
      optional: true,
    },
    {
      id: 'integration',
      title: 'Integrations',
      description: 'Connect with Google services and external APIs',
      icon: <Globe className='w-5 h-5' />,
      component: ({ data, onChange }) => {
        const handleGoogleIntegrationChange = React.useCallback((checked: boolean) => {
          onChange((prevData: AgentConfigurationData) => ({
            ...prevData,
            integrationConfig: { ...prevData.integrationConfig, enableGoogleIntegration: checked },
          }));
        }, [onChange]);

        return (
        <div className='space-y-6'>
          <div className='text-center'>
            <h2 className='text-2xl font-bold text-white mb-2'>Integration Configuration</h2>
            <p className='text-gray-400'>Connect your agent with external services</p>
          </div>

          <div className='space-y-4'>
            <EnableSwitchContainer
              checked={data.integrationConfig.enableGoogleIntegration}
              onCheckedChange={handleGoogleIntegrationChange}
              title="Enable Google Integration"
              description="Connect with Google services for enhanced functionality"
              icon={<Globe className='w-5 h-5' />}
              iconBgColor="blue"
              iconColor="blue"
              borderColor="blue"
              shadowColor="blue"
              size="md"
            />

            {data.integrationConfig.enableGoogleIntegration && (
              <div className='space-y-4'>
                <Label className='text-white font-medium'>Google Services</Label>
                <div className='grid grid-cols-2 gap-4'>
                  {Object.entries(data.integrationConfig.googleServices).map(
                    ([service, enabled]) => (
                      <div key={service} className='flex items-center space-x-3 p-3 bg-gray-800/40 rounded-lg border border-gray-600/30 hover:border-blue-400/50 transition-all duration-200'>
                        <CustomSwitch
                          checked={Boolean(enabled)}
                          onCheckedChange={checked =>
                            onChange({
                              integrationConfig: {
                                ...data.integrationConfig,
                                googleServices: {
                                  ...data.integrationConfig.googleServices,
                                  [service]: checked,
                                },
                              },
                            })
                          }
                          size="sm"
                        />
                        <Label className='text-white capitalize font-medium'>{service}</Label>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            <EnableSwitchContainer
              checked={data.integrationConfig.enableApiAccess}
              onCheckedChange={checked =>
                onChange({
                  integrationConfig: { ...data.integrationConfig, enableApiAccess: checked },
                })
              }
              title="Enable API Access"
              description="Allow external API calls and integrations"
              icon={<Zap className='w-5 h-5' />}
              iconBgColor="yellow"
              iconColor="yellow"
              borderColor="yellow"
              shadowColor="yellow"
              size="md"
            />
          </div>
        </div>
        );
      },
      validation: data => ({ isValid: true, errors: [] }),
      estimatedTime: 7,
      optional: true,
    },
    {
      id: 'advanced',
      title: 'Advanced Features',
      description: 'Auto-handover, analytics, and premium features',
      icon: <Settings className='w-5 h-5' />,
      component: ({ data, onChange }) => (
        <div className='space-y-6'>
          <div className='text-center'>
            <h2 className='text-2xl font-bold text-white mb-2'>Advanced Features</h2>
            <p className='text-gray-400'>Configure advanced agent capabilities</p>
          </div>

          <div className='space-y-4'>
            <EnableSwitchContainer
              checked={data.advancedConfig.enableAutoHandover}
              onCheckedChange={checked =>
                onChange({
                  advancedConfig: { ...data.advancedConfig, enableAutoHandover: checked },
                })
              }
              title="Enable Auto-Handover"
              description="Automatically transfer to human agents when needed"
              icon={<Users className='w-5 h-5' />}
              iconBgColor="orange"
              iconColor="orange"
              borderColor="orange"
              shadowColor="orange"
              size="md"
            />

            <EnableSwitchContainer
              checked={data.advancedConfig.enableAnalytics}
              onCheckedChange={checked =>
                onChange({
                  advancedConfig: { ...data.advancedConfig, enableAnalytics: checked },
                })
              }
              title="Enable Analytics"
              description="Track agent performance and usage metrics"
              icon={<BarChart3 className='w-5 h-5' />}
              iconBgColor="green"
              iconColor="green"
              borderColor="green"
              shadowColor="green"
              size="md"
            />

            <EnableSwitchContainer
              checked={data.advancedConfig.enableCustomBranding}
              onCheckedChange={checked =>
                onChange({
                  advancedConfig: { ...data.advancedConfig, enableCustomBranding: checked },
                })
              }
              title="Enable Custom Branding"
              description="Customize agent appearance and branding"
              icon={<Shield className='w-5 h-5' />}
              iconBgColor="blue"
              iconColor="blue"
              borderColor="blue"
              shadowColor="blue"
              size="md"
            />
          </div>
        </div>
      ),
      validation: data => ({ isValid: true, errors: [] }),
      estimatedTime: 5,
      optional: true,
    },
    {
      id: 'performance',
      title: 'Performance & Cost',
      description: 'Optimize performance and manage costs',
      icon: <Activity className='w-5 h-5' />,
      component: ({ data, onChange }) => (
        <div className='space-y-6'>
          <div className='text-center'>
            <h2 className='text-2xl font-bold text-white mb-2'>Performance & Cost Configuration</h2>
            <p className='text-gray-400'>Optimize your agent's performance and costs</p>
          </div>

          <div className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label className='text-white font-medium'>Response Timeout (ms)</Label>
                <Input
                  type='number'
                  value={data.performanceConfig.responseTimeoutMs}
                  onChange={e =>
                    onChange({
                      performanceConfig: {
                        ...data.performanceConfig,
                        responseTimeoutMs: parseInt(e.target.value),
                      },
                    })
                  }
                  className='bg-gray-800/90 border-gray-600 text-white hover:bg-gray-700/90 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200'
                />
              </div>

              <div className='space-y-2'>
                <Label className='text-white font-medium'>Concurrent Requests</Label>
                <Input
                  type='number'
                  value={data.performanceConfig.concurrentRequests}
                  onChange={e =>
                    onChange({
                      performanceConfig: {
                        ...data.performanceConfig,
                        concurrentRequests: parseInt(e.target.value),
                      },
                    })
                  }
                  className='bg-gray-800/90 border-gray-600 text-white hover:bg-gray-700/90 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200'
                />
              </div>

              <div className='space-y-2'>
                <Label className='text-white font-medium'>Max Daily Cost ($)</Label>
                <Input
                  type='number'
                  value={data.performanceConfig.maxDailyCost}
                  onChange={e =>
                    onChange({
                      performanceConfig: {
                        ...data.performanceConfig,
                        maxDailyCost: parseFloat(e.target.value),
                      },
                    })
                  }
                  className='bg-gray-800/90 border-gray-600 text-white hover:bg-gray-700/90 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all duration-200'
                />
              </div>

              <div className='space-y-2'>
                <Label className='text-white font-medium'>Max Monthly Cost ($)</Label>
                <Input
                  type='number'
                  value={data.performanceConfig.maxMonthlyCost}
                  onChange={e =>
                    onChange({
                      performanceConfig: {
                        ...data.performanceConfig,
                        maxMonthlyCost: parseFloat(e.target.value),
                      },
                    })
                  }
                  className='bg-gray-800/90 border-gray-600 text-white hover:bg-gray-700/90 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all duration-200'
                />
              </div>
            </div>

            <EnableSwitchContainer
              checked={data.performanceConfig.enableCaching}
              onCheckedChange={checked =>
                onChange({
                  performanceConfig: { ...data.performanceConfig, enableCaching: checked },
                })
              }
              title="Enable Caching"
              description="Cache responses for better performance and speed"
              icon={<Activity className='w-5 h-5' />}
              iconBgColor="green"
              iconColor="green"
              borderColor="green"
              shadowColor="green"
              size="md"
            />

            <EnableSwitchContainer
              checked={data.performanceConfig.enableCostOptimization}
              onCheckedChange={checked =>
                onChange({
                  performanceConfig: {
                    ...data.performanceConfig,
                    enableCostOptimization: checked,
                  },
                })
              }
              title="Enable Cost Optimization"
              description="Automatically optimize costs and resource usage"
              icon={<DollarSign className='w-5 h-5' />}
              iconBgColor="yellow"
              iconColor="yellow"
              borderColor="yellow"
              shadowColor="yellow"
              size="md"
            />
          </div>
        </div>
      ),
      validation: data => ({ isValid: true, errors: [] }),
      estimatedTime: 4,
      optional: true,
    },
    {
      id: 'security',
      title: 'Security & Privacy',
      description: 'Configure security and privacy settings',
      icon: <Shield className='w-5 h-5' />,
      component: ({ data, onChange }) => (
        <div className='space-y-6'>
          <div className='text-center'>
            <h2 className='text-2xl font-bold text-white mb-2'>Security & Privacy Configuration</h2>
            <p className='text-gray-400'>Configure security and privacy settings</p>
          </div>

          <div className='space-y-4'>
            <EnableSwitchContainer
              checked={data.securityConfig.enableDataEncryption}
              onCheckedChange={checked =>
                onChange({
                  securityConfig: { ...data.securityConfig, enableDataEncryption: checked },
                })
              }
              title="Enable Data Encryption"
              description="Encrypt all data at rest and in transit"
              icon={<Shield className='w-5 h-5' />}
              iconBgColor="blue"
              iconColor="blue"
              borderColor="blue"
              shadowColor="blue"
              size="md"
            />

            <EnableSwitchContainer
              checked={data.securityConfig.enableAuditLogging}
              onCheckedChange={checked =>
                onChange({
                  securityConfig: { ...data.securityConfig, enableAuditLogging: checked },
                })
              }
              title="Enable Audit Logging"
              description="Log all agent activities for security"
              icon={<Clock className='w-5 h-5' />}
              iconBgColor="purple"
              iconColor="purple"
              borderColor="purple"
              shadowColor="purple"
              size="md"
            />

            <div className='space-y-2'>
              <Label className='text-white font-medium'>Data Retention Days</Label>
              <Input
                type='number'
                value={data.securityConfig.dataRetentionDays}
                onChange={e =>
                  onChange({
                    securityConfig: {
                      ...data.securityConfig,
                      dataRetentionDays: parseInt(e.target.value),
                    },
                  })
                }
                className='bg-gray-800/50 border-gray-600 text-white'
              />
            </div>

            <div className='space-y-2'>
              <Label className='text-white font-medium'>Max Requests Per Hour</Label>
              <Input
                type='number'
                value={data.securityConfig.maxRequestsPerHour}
                onChange={e =>
                  onChange({
                    securityConfig: {
                      ...data.securityConfig,
                      maxRequestsPerHour: parseInt(e.target.value),
                    },
                  })
                }
                className='bg-gray-800/50 border-gray-600 text-white'
              />
            </div>

            <div className='space-y-2'>
              <Label className='text-white font-medium'>Content Filter Level</Label>
              <Select
                value={data.securityConfig.contentFilterLevel}
                onValueChange={value =>
                  onChange({
                    securityConfig: { ...data.securityConfig, contentFilterLevel: value as any },
                  })
                }
              >
                <SelectTrigger className='bg-gray-800/50 border-gray-600 text-white'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='low'>Low</SelectItem>
                  <SelectItem value='medium'>Medium</SelectItem>
                  <SelectItem value='high'>High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      ),
      validation: data => ({ isValid: true, errors: [] }),
      estimatedTime: 6,
      optional: true,
    },
    {
      id: 'review',
      title: 'Review & Deploy',
      description: 'Review configuration and deploy your agent',
      icon: <Eye className='w-5 h-5' />,
      component: ({ data, onChange }) => (
        <div className='space-y-6'>
          <div className='text-center'>
            <h2 className='text-2xl font-bold text-white mb-2'>Review & Deploy</h2>
            <p className='text-gray-400'>Review your configuration and deploy your agent</p>
          </div>

          <div className='space-y-4'>
            <Card className='bg-gray-800/50 border-gray-600'>
              <CardHeader>
                <CardTitle className='text-white'>Agent Summary</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='grid grid-cols-2 gap-4 text-sm'>
                  <div>
                    <span className='text-gray-400'>Name:</span>
                    <span className='text-white ml-2'>{data.basicInfo.name}</span>
                  </div>
                  <div>
                    <span className='text-gray-400'>Category:</span>
                    <span className='text-white ml-2'>{data.basicInfo.category}</span>
                  </div>
                  <div>
                    <span className='text-gray-400'>Model:</span>
                    <span className='text-white ml-2'>{data.aiConfig.model}</span>
                  </div>
                  <div>
                    <span className='text-gray-400'>Provider:</span>
                    <span className='text-white ml-2'>{data.aiConfig.modelProvider}</span>
                  </div>
                </div>

                <div className='pt-3 border-t border-gray-700'>
                  <h4 className='text-white font-medium mb-2'>Features Enabled:</h4>
                  <div className='flex flex-wrap gap-2'>
                    {data.ragConfig.enableRAG && (
                      <Badge className='bg-green-500/20 text-green-400'>RAG</Badge>
                    )}
                    {data.learningConfig.enableAutoLearning && (
                      <Badge className='bg-purple-500/20 text-purple-400'>Auto-Learning</Badge>
                    )}
                    {data.integrationConfig.enableGoogleIntegration && (
                      <Badge className='bg-blue-500/20 text-blue-400'>Google Integration</Badge>
                    )}
                    {data.advancedConfig.enableAnalytics && (
                      <Badge className='bg-yellow-500/20 text-yellow-400'>Analytics</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className='space-y-2'>
              <Label className='text-white font-medium'>Deployment Name</Label>
              <Input
                placeholder='Enter deployment name'
                value={data.deploymentConfig.deploymentName}
                onChange={e =>
                  onChange({
                    deploymentConfig: { ...data.deploymentConfig, deploymentName: e.target.value },
                  })
                }
                className='bg-gray-800/90 border-gray-600 text-white hover:bg-gray-700/90 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200'
              />
            </div>

            <div className='space-y-2'>
              <Label className='text-white font-medium'>Environment</Label>
              <Select
                value={data.deploymentConfig.environment}
                onValueChange={value =>
                  onChange({
                    deploymentConfig: { ...data.deploymentConfig, environment: value as any },
                  })
                }
              >
                <SelectTrigger className='bg-gray-800/90 border-gray-600 text-white hover:bg-gray-700/90 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='bg-gray-800/95 border-gray-600 backdrop-blur-md'>
                  <SelectItem value='development' className='text-white hover:bg-blue-600/20 focus:bg-blue-600/20'>
                    <div className='flex items-center gap-2'>
                      <div className='w-2 h-2 bg-yellow-500 rounded-full'></div>
                      Development
                      <span className='text-xs text-yellow-400 ml-auto'>Testing</span>
                    </div>
                  </SelectItem>
                  <SelectItem value='staging' className='text-white hover:bg-blue-600/20 focus:bg-blue-600/20'>
                    <div className='flex items-center gap-2'>
                      <div className='w-2 h-2 bg-orange-500 rounded-full'></div>
                      Staging
                      <span className='text-xs text-orange-400 ml-auto'>Pre-prod</span>
                    </div>
                  </SelectItem>
                  <SelectItem value='production' className='text-white hover:bg-blue-600/20 focus:bg-blue-600/20'>
                    <div className='flex items-center gap-2'>
                      <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                      Production
                      <span className='text-xs text-green-400 ml-auto'>Live</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='p-4 bg-green-500/10 border border-green-500/20 rounded-lg'>
              <div className='flex items-center space-x-2'>
                <CheckCircle className='w-5 h-5 text-green-400' />
                <span className='text-green-400 font-medium'>Configuration Valid</span>
              </div>
              <p className='text-green-400/80 text-sm mt-1'>
                Your agent is ready to be deployed. Click "Create Agent" to finish.
              </p>
            </div>
          </div>
        </div>
      ),
      validation: data => ({ isValid: true, errors: [] }),
      estimatedTime: 3,
      optional: false,
    },
  ];

  const handleDataChange = useCallback((newData: Partial<AgentConfigurationData>) => {
    setConfigData(prev => ({ ...prev, ...newData }));
  }, []);

  // ✅ Stable onChange handler that doesn't cause re-renders
  const stableOnChange = useCallback((newDataOrUpdater: Partial<AgentConfigurationData> | ((prevData: AgentConfigurationData) => Partial<AgentConfigurationData>)) => {
    if (typeof newDataOrUpdater === 'function') {
      setConfigData(prev => ({ ...prev, ...newDataOrUpdater(prev) }));
    } else {
      handleDataChange(newDataOrUpdater);
    }
  }, [handleDataChange]);

  // 🔧 Fixed: Create stable callback handlers to prevent focus loss
  const handleRAGSearchTypeChange = useCallback((value: string) => {
    setConfigData(prev => ({
      ...prev,
      ragConfig: { ...prev.ragConfig, ragSearchType: value as any },
    }));
  }, []);

  const handleRAGMaxDocumentsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setConfigData(prev => ({
      ...prev,
      ragConfig: {
        ...prev.ragConfig,
        ragMaxDocuments: parseInt(e.target.value) || 5,
      },
    }));
  }, []);

  const handleRAGThresholdChange = useCallback((value: number[]) => {
    setConfigData(prev => ({
      ...prev,
      ragConfig: { ...prev.ragConfig, ragThreshold: value[0] },
    }));
  }, []);

  const handleRAGEnableChange = useCallback((checked: boolean) => {
    setConfigData(prev => ({
      ...prev,
      ragConfig: { ...prev.ragConfig, enableRAG: checked },
    }));
  }, []);

  const handleLearningEnableChange = useCallback((checked: boolean) => {
    setConfigData(prev => ({
      ...prev,
      learningConfig: { ...prev.learningConfig, enableAutoLearning: checked },
    }));
  }, []);

  const handleLearningModeChange = useCallback((value: string) => {
    setConfigData(prev => ({
      ...prev,
      learningConfig: { ...prev.learningConfig, learningMode: value as any },
    }));
  }, []);

  const handleLearningThresholdChange = useCallback((value: number[]) => {
    setConfigData(prev => ({
      ...prev,
      learningConfig: { ...prev.learningConfig, learningThreshold: value[0] },
    }));
  }, []);

  // 🔧 Fixed: Additional handlers for integration and advanced config
  const handleGoogleIntegrationChange = useCallback((checked: boolean) => {
    setConfigData(prev => ({
      ...prev,
      integrationConfig: { ...prev.integrationConfig, enableGoogleIntegration: checked },
    }));
  }, []);

  const handleGoogleServiceChange = useCallback((service: string, checked: boolean) => {
    setConfigData(prev => ({
      ...prev,
      integrationConfig: {
        ...prev.integrationConfig,
        googleServices: {
          ...prev.integrationConfig.googleServices,
          [service]: checked,
        },
      },
    }));
  }, []);

  const handleWebhooksChange = useCallback((checked: boolean) => {
    setConfigData(prev => ({
      ...prev,
      integrationConfig: { ...prev.integrationConfig, enableWebhooks: checked },
    }));
  }, []);

  const handleWebhookUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setConfigData(prev => ({
      ...prev,
      integrationConfig: { ...prev.integrationConfig, webhookUrl: e.target.value },
    }));
  }, []);

  const handleApiAccessChange = useCallback((checked: boolean) => {
    setConfigData(prev => ({
      ...prev,
      integrationConfig: { ...prev.integrationConfig, enableApiAccess: checked },
    }));
  }, []);

  const handleApiRateLimitChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setConfigData(prev => ({
      ...prev,
      integrationConfig: { ...prev.integrationConfig, apiRateLimit: parseInt(e.target.value) || 100 },
    }));
  }, []);

  // ✅ Optimization: useCallback applied to validateStep
  const validateStep = useCallback((stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0: // Template Selection
        // Valid if either template is selected OR user chose "start from scratch"
        return configData.selectedTemplate !== null || configData.useTemplate === false;
      case 1: // Basic Information
        return (
          configData.basicInfo.name.trim() !== '' && configData.basicInfo.description.trim() !== ''
        );
      case 2: // AI Configuration
        return (
          !!configData.aiConfig.modelProvider &&
          !!configData.aiConfig.model &&
          configData.aiConfig.systemPrompt.trim() !== ''
        );
      case 3: // RAG Configuration
        return true; // RAG is optional
      case 4: // Learning Configuration
        return true; // Learning is optional
      case 5: // Integration Configuration
        return true; // Integrations are optional
      case 6: // Advanced Configuration
        return true; // Advanced settings are optional
      case 7: // Performance Configuration
        return configData.performanceConfig.responseTimeoutMs > 0;
      case 8: // Security Configuration
        return true; // Security settings are optional
      case 9: // Review & Deploy
        return true; // Review step is always valid
      default:
        return false;
    }
  }, [configData]);

  // ✅ Optimization: useCallback applied to handleNext
  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      alert('Please complete all required fields before proceeding.');
    }
  }, [currentStep, validateStep, steps.length]);

  // ✅ Optimization: useCallback applied to handlePrevious
  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  // ✅ Optimization: useCallback applied to handleSave
  const handleSave = useCallback(async () => {
    setIsLoading(true);
    try {
      await onSave(configData);
      onClose();
    } catch (error) {
      console.error('Failed to save agent configuration:', error);
    } finally {
      setIsLoading(false);
    }
  }, [configData, onSave, onClose]);

  // ✅ Optimization: Memoized step component wrapper
  const StepComponentWrapper = useMemo(() => {
    const Component = steps[currentStep].component;
    return React.memo(Component);
  }, [currentStep]);

  // ✅ Optimization: useMemo applied to getProgressPercentage
  const getProgressPercentage = useMemo(() => {
    return ((currentStep + 1) / steps.length) * 100;
  }, [currentStep, steps.length]);

  // ✅ Optimization: useMemo applied to getTotalEstimatedTime
  const getTotalEstimatedTime = useMemo(() => {
    return steps.reduce((total, step) => total + step.estimatedTime, 0);
  }, [steps]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-6xl max-h-[90vh] overflow-hidden bg-black border-gray-700'>
        <DialogHeader className='border-b border-gray-800/50 pb-6'>
          <DialogTitle className='text-2xl font-bold text-white flex items-center space-x-3'>
            <div className='w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center'>
              <Sparkles className='w-5 h-5 text-white' />
            </div>
            <span>Advanced Agent Configuration Wizard</span>
          </DialogTitle>
        </DialogHeader>

        {/* Background Effects */}
        <div className='absolute inset-0 z-0'>
          <div className='absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse'></div>
          <div className='absolute bottom-1/4 right-1/4 w-56 h-56 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000'></div>
        </div>
        
        <div className='relative z-10 space-y-6 p-6 overflow-y-auto max-h-[calc(90vh-200px)]'>
            {/* Enhanced Progress Section */}
            <div className='bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6'>
            <div className='flex justify-between items-center mb-4'>
              <div className='flex items-center space-x-3'>
                <div className='w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm'>
                  {currentStep + 1}
                </div>
                <div>
                  <span className='text-white font-medium'>
                    Step {currentStep + 1} of {steps.length}
                  </span>
                  <p className='text-gray-400 text-sm'>
                    {steps[currentStep].title}
                  </p>
                </div>
              </div>
              <div className='flex items-center space-x-2 text-sm text-gray-400'>
                <Clock className='w-4 h-4' />
                <span>~{getTotalEstimatedTime} min total</span>
              </div>
            </div>
            
            {/* Enhanced Progress Bar */}
            <div className='relative w-full bg-gray-800/50 rounded-full h-3 overflow-hidden'>
              <div
                className='bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500 ease-out relative'
                style={{ width: `${getProgressPercentage}%` }}
              >
                <div className='absolute inset-0 bg-white/20 animate-pulse'></div>
              </div>
            </div>
            
            {/* Step Indicators */}
            <div className='flex justify-between mt-4'>
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex flex-col items-center space-y-1 ${
                    index <= currentStep ? 'text-blue-400' : 'text-gray-600'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                      index < currentStep
                        ? 'bg-green-500 text-white'
                        : index === currentStep
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {index < currentStep ? <Check className='w-3 h-3' /> : index + 1}
                  </div>
                  <span className='text-xs font-medium hidden sm:block'>{step.title.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Enhanced Step Header */}
          <div className='bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-4'>
                <div className='w-12 h-12 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-2xl flex items-center justify-center border border-blue-500/30'>
                  {steps[currentStep].icon}
                </div>
                <div>
                  <h3 className='text-xl font-bold text-white'>{steps[currentStep].title}</h3>
                  <p className='text-gray-400'>{steps[currentStep].description}</p>
                </div>
              </div>
              <div className='flex items-center space-x-3'>
                <div className='flex items-center space-x-2 text-sm text-gray-400 bg-gray-800/50 px-3 py-1 rounded-xl'>
                  <Clock className='w-4 h-4' />
                  <span>~{steps[currentStep].estimatedTime} min</span>
                </div>
                {steps[currentStep].optional && (
                  <Badge variant='outline' className='text-xs border-gray-600 text-gray-400 bg-gray-800/50'>
                    Optional
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Validation Errors */}
          {validationErrors.length > 0 && (
            <div className='bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-2xl p-6'>
              <div className='flex items-center space-x-3 mb-4'>
                <div className='w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center'>
                  <AlertCircle className='w-5 h-5 text-red-400' />
                </div>
                <div>
                  <h4 className='text-red-400 font-semibold'>Please fix the following errors:</h4>
                  <p className='text-red-400/80 text-sm'>Complete these fields to continue</p>
                </div>
              </div>
              <ul className='space-y-2'>
                {validationErrors.map((error, index) => (
                  <li key={index} className='flex items-center space-x-2 text-red-400 text-sm'>
                    <div className='w-1 h-1 bg-red-400 rounded-full'></div>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Enhanced Step Content */}
          <div className='bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 min-h-[400px]'>
            <StepComponentWrapper key={currentStep} data={configData} onChange={stableOnChange} />
          </div>
        </div>

        {/* Enhanced Navigation Footer */}
        <div className='border-t border-gray-800/50 p-6 bg-gray-900/50 backdrop-blur-sm'>
          <div className='flex justify-between items-center'>
            <Button
              variant='outline'
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className='border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-500 transition-all duration-300'
            >
              <ChevronLeft className='w-4 h-4 mr-2' />
              Previous
            </Button>

            <div className='flex items-center space-x-4'>
              {/* Step Counter */}
              <div className='hidden sm:flex items-center space-x-2 text-sm text-gray-400'>
                <span>Step {currentStep + 1} of {steps.length}</span>
                <div className='w-px h-4 bg-gray-600'></div>
                <span>{Math.round(getProgressPercentage)}% Complete</span>
              </div>

              {/* Action Buttons */}
              <div className='flex space-x-3'>
                {currentStep === steps.length - 1 ? (
                  <Button
                    onClick={handleSave}
                    disabled={isLoading}
                    className='bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-green-500/25 transition-all duration-300 hover:scale-105'
                  >
                    {isLoading ? (
                      <>
                        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2' />
                        Creating Agent...
                      </>
                    ) : (
                      <>
                        <Rocket className='w-4 h-4 mr-2' />
                        Create Agent
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    className='bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105'
                  >
                    Next
                    <ChevronRight className='w-4 h-4 ml-2' />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
