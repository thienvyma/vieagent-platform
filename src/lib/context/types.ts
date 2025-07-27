// Enhanced Context Builder Types
export interface ConversationContext {
  id: string;
  userId: string;
  agentId: string;
  conversationId: string;

  // Current conversation state
  currentTopic?: string;
  userIntent?: string;
  sentimentScore?: number;
  contextRelevanceScore?: number;

  // Historical context
  conversationHistory: ContextualMessage[];
  userBehaviorPatterns: UserBehaviorPattern[];

  // Dynamic context
  extractedTopics: string[];
  keyEntities: ExtractedEntity[];
  conversationFlow: ConversationFlowState;

  // Enhanced features
  personalizedContext: PersonalizedContext;
  predictiveInsights: PredictiveInsight[];

  createdAt: Date;
  updatedAt: Date;
}

export interface ContextualMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;

  // Enhanced analysis
  sentiment?: SentimentAnalysis;
  intent?: IntentDetection;
  topics?: string[];
  entities?: ExtractedEntity[];
  qualityScore?: number;

  // Context metadata
  contextUsed?: string[];
  responseTime?: number;
  userSatisfaction?: number;
}

export interface UserBehaviorPattern {
  pattern: string;
  frequency: number;
  lastSeen: Date;
  contexts: string[];
  outcomes: ConversationOutcome[];
}

export interface ExtractedEntity {
  type: 'person' | 'organization' | 'location' | 'product' | 'concept' | 'other';
  value: string;
  confidence: number;
  context: string;
}

export interface ConversationFlowState {
  currentStage: 'greeting' | 'inquiry' | 'problem_solving' | 'resolution' | 'closing';
  nextExpectedActions: string[];
  flowScore: number;
  isOnTrack: boolean;
}

export interface PersonalizedContext {
  userPreferences: Record<string, any>;
  communicationStyle: 'formal' | 'casual' | 'technical' | 'friendly';
  expertiseLevel: 'beginner' | 'intermediate' | 'advanced';
  previousSuccessPatterns: string[];
}

export interface PredictiveInsight {
  type: 'next_question' | 'user_need' | 'resolution_path' | 'escalation_risk';
  prediction: string;
  confidence: number;
  suggestedActions: string[];
}

export interface SentimentAnalysis {
  overall: 'positive' | 'negative' | 'neutral';
  score: number; // -1 to 1
  emotions: {
    joy?: number;
    anger?: number;
    sadness?: number;
    fear?: number;
    surprise?: number;
  };
}

export interface IntentDetection {
  primary: string;
  secondary?: string[];
  confidence: number;
  category: 'question' | 'request' | 'complaint' | 'compliment' | 'other';
}

export interface ConversationOutcome {
  type: 'resolved' | 'escalated' | 'abandoned' | 'ongoing';
  satisfaction: number;
  resolutionTime?: number;
  followUpNeeded: boolean;
}

// Context Builder Configuration
export interface ContextBuilderConfig {
  enableAIAnalysis: boolean;
  enableSentimentAnalysis: boolean;
  enableIntentDetection: boolean;
  enableTopicExtraction: boolean;
  enableEntityExtraction: boolean;
  enablePredictiveInsights: boolean;
  enablePersonalization: boolean;

  // AI model settings
  aiProvider: 'openai' | 'anthropic' | 'local';
  analysisModel?: string;
  maxContextLength: number;
  cacheEnabled: boolean;
  cacheTTL: number;

  // Quality thresholds
  minimumConfidenceScore: number;
  contextRelevanceThreshold: number;
  sentimentAnalysisThreshold: number;
}

// Context Builder Interface
export interface IContextBuilder {
  buildContext(
    conversationId: string,
    currentMessage: string,
    options?: ContextBuildOptions
  ): Promise<ConversationContext>;

  updateContext(
    contextId: string,
    updates: Partial<ConversationContext>
  ): Promise<ConversationContext>;

  analyzeMessage(message: string, context?: ConversationContext): Promise<ContextualMessage>;

  generateInsights(context: ConversationContext): Promise<PredictiveInsight[]>;

  getContextHistory(conversationId: string, limit?: number): Promise<ConversationContext[]>;
}

export interface ContextBuildOptions {
  includeHistory?: boolean;
  analyzeSentiment?: boolean;
  detectIntent?: boolean;
  extractTopics?: boolean;
  extractEntities?: boolean;
  generatePredictions?: boolean;
  personalize?: boolean;
  maxHistoryLength?: number;
}

// Enhanced Agent Types
export interface EnhancedAgentConfig {
  contextBuilder: IContextBuilder;
  enableMemory: boolean;
  enablePersonalization: boolean;
  enableQualityEvaluation: boolean;
  responseOptimization: boolean;
  learningEnabled: boolean;
}

export interface EnhancedChatRequest {
  message: string;
  conversationId?: string;
  contextOptions?: ContextBuildOptions;
  agentId: string;
  userId: string;
}

export interface EnhancedChatResponse {
  message: {
    id: string;
    content: string;
    role: 'assistant';
    createdAt: string;
  };
  context: ConversationContext;
  insights: PredictiveInsight[];
  qualityMetrics: {
    responseRelevance: number;
    contextUtilization: number;
    userSatisfactionPrediction: number;
  };
  conversation: {
    id: string;
    title: string;
  };
  usage: {
    tokens: number;
    cost: number;
  };
}

// Analysis Types
export interface ConversationAnalysis {
  conversationId: string;
  overallSentiment: SentimentAnalysis;
  topicProgression: TopicProgression[];
  userSatisfactionTrend: number[];
  resolutionLikelihood: number;
  qualityScore: number;
  insights: AnalysisInsight[];
  recommendations: string[];
}

export interface TopicProgression {
  topic: string;
  startTime: Date;
  endTime?: Date;
  sentiment: SentimentAnalysis;
  resolution: boolean;
}

export interface AnalysisInsight {
  type: 'pattern' | 'anomaly' | 'opportunity' | 'risk';
  description: string;
  confidence: number;
  actionable: boolean;
  suggestedActions: string[];
}
