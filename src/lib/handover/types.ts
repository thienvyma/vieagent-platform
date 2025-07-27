// Agent Handover System Types

export interface AgentStatus {
  id: string;
  conversationId: string;
  agentType: 'ai' | 'human';
  status: 'active' | 'paused' | 'ended' | 'handover_pending';
  humanAgentId?: string;
  humanAgentName?: string;
  platform: 'internal' | 'facebook' | 'telegram' | 'whatsapp' | 'webchat';

  // Handover metadata
  handoverTriggered: boolean;
  handoverReason?: HandoverReason;
  handoverTimestamp?: Date;
  lastAIResponse?: Date;
  contextTransferred: boolean;

  // Platform specific data
  platformData?: {
    facebookPageId?: string;
    facebookUserId?: string;
    telegramChatId?: string;
    whatsappNumber?: string;
    externalConversationId?: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

export interface HandoverReason {
  type:
    | 'human_requested'
    | 'ai_escalation'
    | 'complex_query'
    | 'customer_satisfaction'
    | 'manual_takeover';
  description: string;
  confidence: number;
  triggeredBy: 'ai' | 'human' | 'customer' | 'system';
  metadata?: Record<string, any>;
}

export interface HumanAgent {
  id: string;
  name: string;
  email: string;
  role: 'support_agent' | 'senior_agent' | 'manager' | 'specialist';
  status: 'online' | 'offline' | 'busy' | 'away';
  platform: string[];

  // Availability
  isAvailable: boolean;
  currentConversations: number;
  maxConversations: number;

  // Skills & expertise
  skills: string[];
  languages: string[];
  expertise: string[];

  // Performance metrics
  averageResponseTime: number;
  customerSatisfaction: number;
  conversationsHandled: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface HandoverRequest {
  id: string;
  conversationId: string;
  fromAgentId: string;
  fromAgentType: 'ai' | 'human';
  toAgentType: 'human' | 'ai';
  toAgentId?: string;

  reason: HandoverReason;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'timeout';

  // Context data
  conversationSummary: string;
  customerContext: CustomerContext;
  aiContext?: any; // Enhanced context from Phase 5

  // Timing
  requestedAt: Date;
  acceptedAt?: Date;
  completedAt?: Date;
  timeout: Date;

  // Platform specific
  platform: string;
  platformData?: Record<string, any>;
}

export interface CustomerContext {
  userId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;

  // Conversation context
  currentTopic: string;
  urgencyLevel: 'low' | 'medium' | 'high';
  sentimentScore: number;
  conversationStage: string;

  // History
  previousInteractions: number;
  lastInteractionDate?: Date;
  preferredLanguage: string;
  timezone: string;

  // Issues
  currentIssues: string[];
  resolvedIssues: string[];
  escalationHistory: number;
}

export interface HandoverEvent {
  id: string;
  conversationId: string;
  eventType:
    | 'handover_requested'
    | 'handover_accepted'
    | 'handover_completed'
    | 'handover_failed'
    | 'agent_joined'
    | 'agent_left';

  // Agent info
  fromAgent?: {
    id: string;
    type: 'ai' | 'human';
    name: string;
  };
  toAgent?: {
    id: string;
    type: 'ai' | 'human';
    name: string;
  };

  // Event data
  eventData: Record<string, any>;
  platform: string;
  timestamp: Date;

  // Metadata
  customerNotified: boolean;
  contextTransferred: boolean;
  handoverDuration?: number; // milliseconds
}

// Platform Integration Types
export interface PlatformIntegration {
  platform: 'facebook' | 'telegram' | 'whatsapp' | 'webchat';
  config: PlatformConfig;
  status: 'connected' | 'disconnected' | 'error';
  lastSync: Date;
}

export interface PlatformConfig {
  facebook?: {
    pageAccessToken: string;
    pageId: string;
    appSecret: string;
    verifyToken: string;
    webhookUrl: string;
  };
  telegram?: {
    botToken: string;
    webhookUrl: string;
  };
  whatsapp?: {
    accessToken: string;
    phoneNumberId: string;
    webhookUrl: string;
  };
  webchat?: {
    domain: string;
    apiKey: string;
    customizations: Record<string, any>;
  };
}

// Detection System Types
export interface HumanDetectionEvent {
  type:
    | 'human_message_detected'
    | 'human_login_detected'
    | 'takeover_signal'
    | 'manual_intervention';
  conversationId: string;
  platform: string;

  // Detection data
  detectionMethod: 'message_pattern' | 'api_signal' | 'webhook' | 'manual';
  confidence: number;
  metadata: {
    humanAgentId?: string;
    detectionSignals?: string[];
    timestamp: Date;
  };
}

export interface HandoverConfiguration {
  // Auto-handover triggers
  autoHandoverEnabled: boolean;
  autoHandoverTriggers: {
    sentimentThreshold: number; // Below this = handover
    escalationKeywords: string[];
    maxAIResponses: number;
    conversationDuration: number; // minutes
    customerRequestsHuman: boolean;
  };

  // Human detection settings
  humanDetection: {
    enabled: boolean;
    detectionMethods: ('message_pattern' | 'api_signal' | 'webhook')[];
    autoDetectionKeywords: string[];
    responsePatterns: string[];
  };

  // Notifications
  notifications: {
    customerNotification: boolean;
    agentNotification: boolean;
    managerNotification: boolean;
    notificationTemplates: Record<string, string>;
  };

  // Platform specific
  platformSettings: Record<string, any>;
}

// Analytics Types
export interface HandoverAnalytics {
  totalHandovers: number;
  successfulHandovers: number;
  averageHandoverTime: number;
  commonHandoverReasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;

  // Performance metrics
  aiToHumanHandovers: number;
  humanToAIHandovers: number;
  customerSatisfactionAfterHandover: number;

  // Platform breakdown
  platformBreakdown: Record<
    string,
    {
      handovers: number;
      avgTime: number;
      successRate: number;
    }
  >;

  // Time analysis
  peakHandoverTimes: Array<{
    hour: number;
    count: number;
  }>;

  period: {
    startDate: Date;
    endDate: Date;
  };
}
