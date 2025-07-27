import {
  IContextBuilder,
  ConversationContext,
  ContextualMessage,
  ContextBuildOptions,
  PredictiveInsight,
  ContextBuilderConfig,
  UserBehaviorPattern,
  ConversationFlowState,
  PersonalizedContext,
} from './types';
import { ConversationAnalyzer } from './ConversationAnalyzer';
import { PrismaClient } from '@prisma/client';

export class EnhancedContextBuilder implements IContextBuilder {
  private analyzer: ConversationAnalyzer;
  private config: ContextBuilderConfig;
  private prisma: PrismaClient;
  private contextCache: Map<string, ConversationContext> = new Map();

  constructor(config: ContextBuilderConfig) {
    this.config = config;
    this.analyzer = new ConversationAnalyzer(config);
    this.prisma = new PrismaClient();
  }

  /**
   * Build comprehensive conversation context
   */
  async buildContext(
    conversationId: string,
    currentMessage: string,
    options: ContextBuildOptions = {}
  ): Promise<ConversationContext> {
    try {
      console.log(`🧠 Building enhanced context for conversation: ${conversationId}`);

      // Check cache first
      const cacheKey = `${conversationId}-${Date.now()}`;
      if (this.config.cacheEnabled && this.contextCache.has(conversationId)) {
        const cachedContext = this.contextCache.get(conversationId)!;
        // Update with current message
        return await this.updateContextWithMessage(cachedContext, currentMessage, options);
      }

      // Get conversation data from database
      const conversation = await this.getConversationData(conversationId);
      if (!conversation) {
        throw new Error(`Conversation ${conversationId} not found`);
      }

      // Layer 1: Analyze current message
      const analyzedMessage = await this.analyzer.analyzeMessage(currentMessage);

      // Layer 2: Build conversation history context
      const conversationHistory = await this.buildConversationHistory(
        conversationId,
        options.maxHistoryLength || 10
      );

      // Layer 3: Extract user behavior patterns
      const userBehaviorPatterns = await this.extractUserBehaviorPatterns(conversation.userId);

      // Layer 4: Determine conversation flow state
      const conversationFlow = await this.analyzeConversationFlow(
        conversationHistory,
        analyzedMessage
      );

      // Layer 5: Build personalized context
      const personalizedContext = await this.buildPersonalizedContext(
        conversation.userId,
        conversationHistory
      );

      // Layer 6: Extract topics and entities
      const extractedTopics = await this.extractTopicsFromHistory(conversationHistory);
      const keyEntities = await this.extractEntitiesFromHistory(conversationHistory);

      // Layer 7: Generate predictive insights
      const baseContext: ConversationContext = {
        id: `ctx-${Date.now()}`,
        userId: conversation.userId,
        agentId: conversation.agentId,
        conversationId: conversationId,

        currentTopic: analyzedMessage.topics?.[0],
        userIntent: analyzedMessage.intent?.primary,
        sentimentScore: analyzedMessage.sentiment?.score,
        contextRelevanceScore: this.calculateContextRelevance(analyzedMessage, conversationHistory),

        conversationHistory: [...conversationHistory, analyzedMessage],
        userBehaviorPatterns,

        extractedTopics,
        keyEntities,
        conversationFlow,

        personalizedContext,
        predictiveInsights: [], // Will be filled below

        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Generate predictive insights with full context
      baseContext.predictiveInsights = await this.analyzer.generatePredictiveInsights(baseContext);

      // Cache the context
      if (this.config.cacheEnabled) {
        this.contextCache.set(conversationId, baseContext);
        // Clean cache after TTL
        setTimeout(() => this.contextCache.delete(conversationId), this.config.cacheTTL);
      }

      console.log(
        `✅ Enhanced context built with ${baseContext.conversationHistory.length} messages, ${baseContext.extractedTopics.length} topics, ${baseContext.predictiveInsights.length} insights`
      );

      return baseContext;
    } catch (error) {
      console.error('Error building enhanced context:', error);

      // Return minimal context on error
      return this.buildFallbackContext(conversationId, currentMessage);
    }
  }

  /**
   * Update existing context with new message
   */
  async updateContext(
    contextId: string,
    updates: Partial<ConversationContext>
  ): Promise<ConversationContext> {
    try {
      // Find existing context
      let existingContext: ConversationContext | undefined;

      for (const [key, context] of this.contextCache.entries()) {
        if (context.id === contextId) {
          existingContext = context;
          break;
        }
      }

      if (!existingContext) {
        throw new Error(`Context ${contextId} not found`);
      }

      // Apply updates
      const updatedContext: ConversationContext = {
        ...existingContext,
        ...updates,
        updatedAt: new Date(),
      };

      // Update cache
      if (this.config.cacheEnabled) {
        this.contextCache.set(updatedContext.conversationId, updatedContext);
      }

      return updatedContext;
    } catch (error) {
      console.error('Error updating context:', error);
      throw error;
    }
  }

  /**
   * Analyze message with existing context
   */
  async analyzeMessage(message: string, context?: ConversationContext): Promise<ContextualMessage> {
    return await this.analyzer.analyzeMessage(message, context);
  }

  /**
   * Generate insights for context
   */
  async generateInsights(context: ConversationContext): Promise<PredictiveInsight[]> {
    return await this.analyzer.generatePredictiveInsights(context);
  }

  /**
   * Get context history for conversation
   */
  async getContextHistory(
    conversationId: string,
    limit: number = 10
  ): Promise<ConversationContext[]> {
    try {
      // This would typically come from database
      // For now, return empty array as we're focusing on current context
      return [];
    } catch (error) {
      console.error('Error getting context history:', error);
      return [];
    }
  }

  // Private helper methods

  private async updateContextWithMessage(
    context: ConversationContext,
    message: string,
    options: ContextBuildOptions
  ): Promise<ConversationContext> {
    const analyzedMessage = await this.analyzer.analyzeMessage(message, context);

    // Update conversation history
    const updatedHistory = [...context.conversationHistory, analyzedMessage];

    // Recalculate insights
    const updatedContext: ConversationContext = {
      ...context,
      conversationHistory: updatedHistory,
      currentTopic: analyzedMessage.topics?.[0] || context.currentTopic,
      userIntent: analyzedMessage.intent?.primary || context.userIntent,
      sentimentScore: analyzedMessage.sentiment?.score || context.sentimentScore,
      updatedAt: new Date(),
    };

    // Regenerate insights
    updatedContext.predictiveInsights =
      await this.analyzer.generatePredictiveInsights(updatedContext);

    return updatedContext;
  }

  private async getConversationData(conversationId: string) {
    try {
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          agent: true,
          user: true,
        },
      });

      return conversation;
    } catch (error) {
      console.error('Error getting conversation data:', error);
      return null;
    }
  }

  private async buildConversationHistory(
    conversationId: string,
    limit: number
  ): Promise<ContextualMessage[]> {
    try {
      const messages = await this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      // Convert to ContextualMessage format
      const contextualMessages: ContextualMessage[] = [];

      for (const msg of messages.reverse()) {
        if (msg.content) {
          // Analyze historical messages if not already analyzed
          const analyzedMsg = await this.analyzer.analyzeMessage(msg.content);
          contextualMessages.push({
            ...analyzedMsg,
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            timestamp: msg.createdAt,
          });
        }
      }

      return contextualMessages;
    } catch (error) {
      console.error('Error building conversation history:', error);
      return [];
    }
  }

  private async extractUserBehaviorPatterns(userId: string): Promise<UserBehaviorPattern[]> {
    try {
      // Analyze user's conversation patterns across all conversations
      const userConversations = await this.prisma.conversation.findMany({
        where: { userId },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 100, // Last 100 messages
          },
        },
        take: 10, // Last 10 conversations
      });

      const patterns: UserBehaviorPattern[] = [];
      const patternMap: Map<string, { frequency: number; lastSeen: Date; contexts: string[] }> =
        new Map();

      // Analyze patterns
      for (const conv of userConversations) {
        for (const msg of conv.messages) {
          if (msg.role === 'user' && msg.content) {
            const analyzed = await this.analyzer.analyzeMessage(msg.content);

            // Track intent patterns
            if (analyzed.intent?.primary) {
              const key = analyzed.intent.primary;
              const existing = patternMap.get(key) || {
                frequency: 0,
                lastSeen: new Date(0),
                contexts: [],
              };
              patternMap.set(key, {
                frequency: existing.frequency + 1,
                lastSeen: msg.createdAt > existing.lastSeen ? msg.createdAt : existing.lastSeen,
                contexts: [...existing.contexts, conv.id],
              });
            }

            // Track topic patterns
            if (analyzed.topics) {
              for (const topic of analyzed.topics) {
                const key = `topic_${topic}`;
                const existing = patternMap.get(key) || {
                  frequency: 0,
                  lastSeen: new Date(0),
                  contexts: [],
                };
                patternMap.set(key, {
                  frequency: existing.frequency + 1,
                  lastSeen: msg.createdAt > existing.lastSeen ? msg.createdAt : existing.lastSeen,
                  contexts: [...existing.contexts, conv.id],
                });
              }
            }
          }
        }
      }

      // Convert to UserBehaviorPattern format
      for (const [pattern, data] of patternMap.entries()) {
        if (data.frequency >= 2) {
          // Only include patterns that occur more than once
          patterns.push({
            pattern,
            frequency: data.frequency,
            lastSeen: data.lastSeen,
            contexts: [...new Set(data.contexts)], // Remove duplicates
            outcomes: [], // Would be filled with actual outcome analysis
          });
        }
      }

      return patterns.sort((a, b) => b.frequency - a.frequency).slice(0, 10); // Top 10 patterns
    } catch (error) {
      console.error('Error extracting user behavior patterns:', error);
      return [];
    }
  }

  private async analyzeConversationFlow(
    history: ContextualMessage[],
    currentMessage: ContextualMessage
  ): Promise<ConversationFlowState> {
    if (history.length === 0) {
      return {
        currentStage: 'greeting',
        nextExpectedActions: ['Provide information about your needs', 'Ask questions'],
        flowScore: 0.8,
        isOnTrack: true,
      };
    }

    // Analyze flow based on conversation progression
    const totalMessages = history.length + 1;
    const userMessages = history.filter(m => m.role === 'user').length + 1;
    const hasQuestions = history.some(m => m.content.includes('?'));
    const hasIssues = history.some(m => m.topics?.includes('technical_support'));

    let currentStage: ConversationFlowState['currentStage'] = 'inquiry';
    let nextExpectedActions: string[] = [];
    let flowScore = 0.7;
    let isOnTrack = true;

    // Determine stage based on conversation content and length
    if (totalMessages <= 2) {
      currentStage = 'greeting';
      nextExpectedActions = ['Explain your needs clearly', 'Provide context'];
    } else if (hasIssues || hasQuestions) {
      currentStage = 'problem_solving';
      nextExpectedActions = [
        'Provide more details',
        'Try suggested solutions',
        'Confirm resolution',
      ];
    } else if (totalMessages > 8) {
      currentStage = 'resolution';
      nextExpectedActions = ['Confirm satisfaction', 'Ask follow-up questions if needed'];
    } else {
      currentStage = 'inquiry';
      nextExpectedActions = ['Continue with questions', 'Provide additional information'];
    }

    // Calculate flow score based on conversation quality
    const avgSentiment =
      history.reduce((sum, m) => sum + (m.sentiment?.score || 0), 0) / history.length;
    const avgQuality =
      history.reduce((sum, m) => sum + (m.qualityScore || 0.5), 0) / history.length;

    flowScore = ((avgSentiment + 1) / 2) * 0.4 + avgQuality * 0.6; // Normalize sentiment and combine with quality
    isOnTrack = flowScore > 0.6 && avgSentiment > -0.3;

    return {
      currentStage,
      nextExpectedActions,
      flowScore,
      isOnTrack,
    };
  }

  private async buildPersonalizedContext(
    userId: string,
    history: ContextualMessage[]
  ): Promise<PersonalizedContext> {
    try {
      // Analyze user's communication style and preferences
      let communicationStyle: PersonalizedContext['communicationStyle'] = 'casual';
      let expertiseLevel: PersonalizedContext['expertiseLevel'] = 'intermediate';

      if (history.length > 0) {
        // Determine communication style based on language patterns
        const formalWords = ['please', 'thank you', 'appreciate', 'kindly'];
        const casualWords = ['hey', 'thanks', 'cool', 'awesome'];
        const technicalWords = ['implementation', 'configuration', 'optimization', 'integration'];

        let formalCount = 0;
        let casualCount = 0;
        let technicalCount = 0;

        for (const msg of history) {
          if (msg.role === 'user') {
            const content = msg.content.toLowerCase();
            formalCount += formalWords.filter(word => content.includes(word)).length;
            casualCount += casualWords.filter(word => content.includes(word)).length;
            technicalCount += technicalWords.filter(word => content.includes(word)).length;
          }
        }

        if (formalCount > casualCount) {
          communicationStyle = 'formal';
        } else if (technicalCount > 2) {
          communicationStyle = 'technical';
        } else {
          communicationStyle = 'friendly';
        }

        if (technicalCount > 3) {
          expertiseLevel = 'advanced';
        } else if (technicalCount > 0 || history.length > 5) {
          expertiseLevel = 'intermediate';
        } else {
          expertiseLevel = 'beginner';
        }
      }

      return {
        userPreferences: {
          communicationStyle,
          responseLength: 'medium',
          includeExamples: expertiseLevel === 'beginner',
          technicalDetail: expertiseLevel === 'advanced',
        },
        communicationStyle,
        expertiseLevel,
        previousSuccessPatterns: [
          // Would be filled with actual success pattern analysis
        ],
      };
    } catch (error) {
      console.error('Error building personalized context:', error);
      return {
        userPreferences: {},
        communicationStyle: 'casual',
        expertiseLevel: 'intermediate',
        previousSuccessPatterns: [],
      };
    }
  }

  private async extractTopicsFromHistory(history: ContextualMessage[]): Promise<string[]> {
    const topicMap: Map<string, number> = new Map();

    for (const msg of history) {
      if (msg.topics) {
        for (const topic of msg.topics) {
          topicMap.set(topic, (topicMap.get(topic) || 0) + 1);
        }
      }
    }

    return Array.from(topicMap.entries())
      .sort(([, a], [, b]) => b - a) // Sort by frequency
      .slice(0, 5) // Top 5 topics
      .map(([topic]) => topic);
  }

  private async extractEntitiesFromHistory(history: ContextualMessage[]) {
    const entityMap: Map<string, { entity: any; count: number }> = new Map();

    for (const msg of history) {
      if (msg.entities) {
        for (const entity of msg.entities) {
          const key = `${entity.type}:${entity.value}`;
          const existing = entityMap.get(key);
          if (existing) {
            existing.count++;
          } else {
            entityMap.set(key, { entity, count: 1 });
          }
        }
      }
    }

    return Array.from(entityMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // Top 10 entities
      .map(item => item.entity);
  }

  private calculateContextRelevance(
    currentMessage: ContextualMessage,
    history: ContextualMessage[]
  ): number {
    if (history.length === 0) return 0.8;

    let relevanceScore = 0.5;

    // Check topic continuity
    const currentTopics = currentMessage.topics || [];
    const historyTopics = history.flatMap(m => m.topics || []);

    if (currentTopics.length > 0 && historyTopics.length > 0) {
      const topicOverlap = currentTopics.filter(t => historyTopics.includes(t)).length;
      relevanceScore += (topicOverlap / currentTopics.length) * 0.3;
    }

    // Check intent consistency
    const recentIntent = history[history.length - 1]?.intent?.primary;
    if (recentIntent && currentMessage.intent?.primary === recentIntent) {
      relevanceScore += 0.2;
    }

    return Math.min(1, relevanceScore);
  }

  private buildFallbackContext(conversationId: string, message: string): ConversationContext {
    return {
      id: `ctx-fallback-${Date.now()}`,
      userId: 'unknown',
      agentId: 'unknown',
      conversationId,

      sentimentScore: 0,
      contextRelevanceScore: 0.5,

      conversationHistory: [
        {
          id: `msg-${Date.now()}`,
          role: 'user',
          content: message,
          timestamp: new Date(),
          qualityScore: 0.5,
        },
      ],
      userBehaviorPatterns: [],

      extractedTopics: [],
      keyEntities: [],
      conversationFlow: {
        currentStage: 'inquiry',
        nextExpectedActions: ['Continue conversation'],
        flowScore: 0.5,
        isOnTrack: true,
      },

      personalizedContext: {
        userPreferences: {},
        communicationStyle: 'casual',
        expertiseLevel: 'intermediate',
        previousSuccessPatterns: [],
      },
      predictiveInsights: [],

      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
