/**
 * 🧠 Learning Feedback System - Day 22 Step 22.1
 * Advanced feedback collection system for auto-learning
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Feedback Types
export interface ConversationFeedback {
  id: string;
  conversationId: string;
  messageId: string;
  userId: string;
  agentId: string;

  // Explicit Feedback
  explicitRating?: number; // 1-5 stars
  explicitFeedback?: 'helpful' | 'unhelpful' | 'incorrect' | 'perfect';
  explicitComment?: string;

  // Implicit Feedback
  implicitMetrics: {
    responseTime: number; // How long user took to respond
    engagementScore: number; // 0-1 based on interaction
    followUpQuestions: number; // Number of follow-up questions
    conversationContinued: boolean; // Did user continue conversation
    taskCompleted: boolean; // Did user complete their task
    sessionDuration: number; // Total session time
    messageLength: number; // User's response length
    reactionTime: number; // Time to first reaction
  };

  // Context Data
  contextData: {
    messageContent: string;
    aiResponse: string;
    conversationStage: string;
    userIntent: string;
    topicCategories: string[];
    sentimentScore: number;
    complexityScore: number;
    ragUsed: boolean;
    ragRelevance?: number;
    providerUsed: string;
    modelUsed: string;
    responseLatency: number;
    tokensUsed: number;
    cost: number;
  };

  // Quality Indicators
  qualityIndicators: {
    responseAccuracy: number; // 0-1 estimated accuracy
    responseRelevance: number; // 0-1 relevance to question
    responseCompleteness: number; // 0-1 how complete the answer is
    userSatisfactionScore: number; // 0-1 estimated satisfaction
    needsImprovement: boolean;
    improvementAreas: string[];
  };

  // Learning Signals
  learningSignals: {
    shouldLearnFrom: boolean;
    learningConfidence: number; // 0-1 confidence in learning signal
    learningType: 'positive' | 'negative' | 'neutral';
    keyLearnings: string[];
    suggestedImprovements: string[];
  };

  createdAt: Date;
  updatedAt: Date;
}

export interface LearningPattern {
  id: string;
  patternType: 'question_pattern' | 'response_pattern' | 'conversation_flow' | 'user_behavior';
  pattern: string;
  frequency: number;
  successRate: number;
  contexts: string[];
  examples: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeGap {
  id: string;
  topic: string;
  questions: string[];
  failureRate: number;
  userFrustrationScore: number;
  suggestedSolutions: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'identified' | 'being_addressed' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
}

export class LearningFeedbackSystem {
  private static instance: LearningFeedbackSystem;

  static getInstance(): LearningFeedbackSystem {
    if (!this.instance) {
      this.instance = new LearningFeedbackSystem();
    }
    return this.instance;
  }

  /**
   * Collect comprehensive feedback from a conversation
   */
  async collectConversationFeedback(
    conversationId: string,
    messageId: string,
    userId: string,
    agentId: string,
    explicitFeedback?: {
      rating?: number;
      feedback?: string;
      comment?: string;
    },
    implicitMetrics?: Partial<ConversationFeedback['implicitMetrics']>,
    contextData?: Partial<ConversationFeedback['contextData']>
  ): Promise<ConversationFeedback> {
    // Get conversation and message details
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const message = conversation.messages.find(m => m.id === messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    // Analyze conversation context
    const conversationAnalysis = await this.analyzeConversationContext(conversation);

    // Calculate implicit metrics
    const calculatedImplicitMetrics = await this.calculateImplicitMetrics(
      conversation,
      message,
      implicitMetrics
    );

    // Assess quality indicators
    const qualityIndicators = await this.assessQualityIndicators(
      message,
      conversationAnalysis,
      explicitFeedback
    );

    // Generate learning signals
    const learningSignals = await this.generateLearningSignals(
      message,
      conversationAnalysis,
      qualityIndicators,
      explicitFeedback
    );

    // Create feedback record
    const feedback: ConversationFeedback = {
      id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      conversationId,
      messageId,
      userId,
      agentId,
      explicitRating: explicitFeedback?.rating,
      explicitFeedback: explicitFeedback?.feedback as any,
      explicitComment: explicitFeedback?.comment,
      implicitMetrics: calculatedImplicitMetrics,
      contextData: {
        messageContent: message.content,
        aiResponse: this.getAIResponse(conversation.messages, message),
        conversationStage: conversationAnalysis.stage,
        userIntent: conversationAnalysis.userIntent,
        topicCategories: conversationAnalysis.topics,
        sentimentScore: conversationAnalysis.sentimentScore,
        complexityScore: conversationAnalysis.complexityScore,
        ragUsed: conversationAnalysis.ragUsed,
        ragRelevance: conversationAnalysis.ragRelevance,
        providerUsed: conversationAnalysis.providerUsed,
        modelUsed: conversationAnalysis.modelUsed,
        responseLatency: conversationAnalysis.responseLatency,
        tokensUsed: conversationAnalysis.tokensUsed,
        cost: conversationAnalysis.cost,
        ...contextData,
      },
      qualityIndicators,
      learningSignals,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store feedback in database
    await this.storeFeedback(feedback);

    // Process learning signals
    await this.processLearningSignals(feedback);

    return feedback;
  }

  /**
   * Analyze conversation context for learning
   */
  private async analyzeConversationContext(conversation: any): Promise<{
    stage: string;
    userIntent: string;
    topics: string[];
    sentimentScore: number;
    complexityScore: number;
    ragUsed: boolean;
    ragRelevance?: number;
    providerUsed: string;
    modelUsed: string;
    responseLatency: number;
    tokensUsed: number;
    cost: number;
  }> {
    const messages = conversation.messages;
    const lastMessage = messages[messages.length - 1];

    // Analyze conversation stage
    const stage = this.determineConversationStage(messages);

    // Extract user intent
    const userIntent = await this.extractUserIntent(messages);

    // Identify topics
    const topics = await this.identifyTopics(messages);

    // Calculate sentiment
    const sentimentScore = await this.calculateSentimentScore(messages);

    // Calculate complexity
    const complexityScore = this.calculateComplexityScore(messages);

    return {
      stage,
      userIntent,
      topics,
      sentimentScore,
      complexityScore,
      ragUsed: lastMessage.ragUsed || false,
      ragRelevance: lastMessage.ragRelevance,
      providerUsed: lastMessage.provider || 'openai',
      modelUsed: lastMessage.model || 'gpt-3.5-turbo',
      responseLatency: lastMessage.responseTime || 3000,
      tokensUsed: lastMessage.tokens || 0,
      cost: lastMessage.cost || 0,
    };
  }

  /**
   * Calculate implicit feedback metrics
   */
  private async calculateImplicitMetrics(
    conversation: any,
    message: any,
    providedMetrics?: Partial<ConversationFeedback['implicitMetrics']>
  ): Promise<ConversationFeedback['implicitMetrics']> {
    const messages = conversation.messages;
    const messageIndex = messages.findIndex((m: any) => m.id === message.id);
    const nextMessage = messages[messageIndex + 1];

    // Calculate response time (time between AI response and user's next message)
    const responseTime = nextMessage
      ? new Date(nextMessage.createdAt).getTime() - new Date(message.createdAt).getTime()
      : 0;

    // Calculate engagement score based on various factors
    const engagementScore = this.calculateEngagementScore(conversation, message);

    // Count follow-up questions
    const followUpQuestions = this.countFollowUpQuestions(messages, messageIndex);

    // Check if conversation continued
    const conversationContinued = messageIndex < messages.length - 1;

    // Estimate if task was completed
    const taskCompleted = this.estimateTaskCompletion(messages);

    // Calculate session duration
    const sessionDuration =
      new Date(messages[messages.length - 1].createdAt).getTime() -
      new Date(messages[0].createdAt).getTime();

    return {
      responseTime,
      engagementScore,
      followUpQuestions,
      conversationContinued,
      taskCompleted,
      sessionDuration,
      messageLength: nextMessage?.content?.length || 0,
      reactionTime: responseTime,
      ...providedMetrics,
    };
  }

  /**
   * Assess quality indicators
   */
  private async assessQualityIndicators(
    message: any,
    conversationAnalysis: any,
    explicitFeedback?: any
  ): Promise<ConversationFeedback['qualityIndicators']> {
    // Base quality assessment on various factors
    let responseAccuracy = 0.8; // Default assumption
    let responseRelevance = 0.8;
    let responseCompleteness = 0.7;
    let userSatisfactionScore = 0.7;

    // Adjust based on explicit feedback
    if (explicitFeedback?.rating) {
      const ratingScore = explicitFeedback.rating / 5;
      responseAccuracy = ratingScore;
      responseRelevance = ratingScore;
      responseCompleteness = ratingScore;
      userSatisfactionScore = ratingScore;
    }

    // Adjust based on conversation context
    if (conversationAnalysis.sentimentScore < -0.3) {
      userSatisfactionScore *= 0.7;
    }

    if (conversationAnalysis.ragUsed && conversationAnalysis.ragRelevance) {
      responseRelevance = Math.max(responseRelevance, conversationAnalysis.ragRelevance);
    }

    // Identify improvement areas
    const improvementAreas: string[] = [];
    if (responseAccuracy < 0.7) improvementAreas.push('accuracy');
    if (responseRelevance < 0.7) improvementAreas.push('relevance');
    if (responseCompleteness < 0.7) improvementAreas.push('completeness');
    if (userSatisfactionScore < 0.7) improvementAreas.push('user_satisfaction');

    return {
      responseAccuracy,
      responseRelevance,
      responseCompleteness,
      userSatisfactionScore,
      needsImprovement: improvementAreas.length > 0,
      improvementAreas,
    };
  }

  /**
   * Generate learning signals
   */
  private async generateLearningSignals(
    message: any,
    conversationAnalysis: any,
    qualityIndicators: ConversationFeedback['qualityIndicators'],
    explicitFeedback?: any
  ): Promise<ConversationFeedback['learningSignals']> {
    const avgQuality =
      (qualityIndicators.responseAccuracy +
        qualityIndicators.responseRelevance +
        qualityIndicators.responseCompleteness +
        qualityIndicators.userSatisfactionScore) /
      4;

    // Determine learning type
    let learningType: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (avgQuality > 0.8) learningType = 'positive';
    else if (avgQuality < 0.6) learningType = 'negative';

    // Calculate learning confidence
    const learningConfidence = explicitFeedback?.rating
      ? 0.9 // High confidence with explicit feedback
      : Math.min(0.7, avgQuality); // Lower confidence with implicit only

    // Determine if we should learn from this interaction
    const shouldLearnFrom =
      learningConfidence > 0.5 && (learningType === 'positive' || learningType === 'negative');

    // Extract key learnings
    const keyLearnings: string[] = [];
    if (learningType === 'positive') {
      keyLearnings.push(`Successful response to ${conversationAnalysis.userIntent}`);
      keyLearnings.push(`Effective handling of ${conversationAnalysis.topics.join(', ')}`);
    } else if (learningType === 'negative') {
      keyLearnings.push(`Needs improvement in ${conversationAnalysis.userIntent}`);
      keyLearnings.push(`Difficulty with ${conversationAnalysis.topics.join(', ')}`);
    }

    // Suggest improvements
    const suggestedImprovements: string[] = [];
    qualityIndicators.improvementAreas.forEach(area => {
      switch (area) {
        case 'accuracy':
          suggestedImprovements.push('Improve factual accuracy through better knowledge base');
          break;
        case 'relevance':
          suggestedImprovements.push('Enhance context understanding and relevance scoring');
          break;
        case 'completeness':
          suggestedImprovements.push('Provide more comprehensive responses');
          break;
        case 'user_satisfaction':
          suggestedImprovements.push('Improve response tone and helpfulness');
          break;
      }
    });

    return {
      shouldLearnFrom,
      learningConfidence,
      learningType,
      keyLearnings,
      suggestedImprovements,
    };
  }

  // Helper methods
  private getAIResponse(messages: any[], userMessage: any): string {
    const messageIndex = messages.findIndex((m: any) => m.id === userMessage.id);
    const nextMessage = messages[messageIndex + 1];
    return nextMessage?.role === 'assistant' ? nextMessage.content : '';
  }

  private determineConversationStage(messages: any[]): string {
    if (messages.length <= 2) return 'greeting';
    if (messages.length <= 6) return 'inquiry';
    if (messages.length <= 10) return 'problem_solving';
    return 'resolution';
  }

  private async extractUserIntent(messages: any[]): Promise<string> {
    // Simple intent extraction - can be enhanced with NLP
    const userMessages = messages.filter((m: any) => m.role === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1];

    if (!lastUserMessage) return 'unknown';

    const content = lastUserMessage.content.toLowerCase();

    if (content.includes('help') || content.includes('support')) return 'help_request';
    if (content.includes('how') || content.includes('what')) return 'information_request';
    if (content.includes('problem') || content.includes('issue')) return 'problem_report';
    if (content.includes('thank') || content.includes('thanks')) return 'gratitude';

    return 'general_inquiry';
  }

  private async identifyTopics(messages: any[]): Promise<string[]> {
    // Simple topic identification - can be enhanced with NLP
    const allContent = messages
      .map((m: any) => m.content)
      .join(' ')
      .toLowerCase();

    const topics: string[] = [];

    // Common topics
    if (allContent.includes('technical') || allContent.includes('code')) topics.push('technical');
    if (allContent.includes('payment') || allContent.includes('billing')) topics.push('billing');
    if (allContent.includes('account') || allContent.includes('profile')) topics.push('account');
    if (allContent.includes('feature') || allContent.includes('function')) topics.push('features');
    if (allContent.includes('bug') || allContent.includes('error')) topics.push('bugs');

    return topics.length > 0 ? topics : ['general'];
  }

  private async calculateSentimentScore(messages: any[]): Promise<number> {
    // Simple sentiment analysis - can be enhanced with NLP
    const userMessages = messages.filter((m: any) => m.role === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1];

    if (!lastUserMessage) return 0;

    const content = lastUserMessage.content.toLowerCase();

    // Positive indicators
    let score = 0;
    if (content.includes('thank') || content.includes('great') || content.includes('good'))
      score += 0.5;
    if (content.includes('excellent') || content.includes('perfect') || content.includes('amazing'))
      score += 0.8;

    // Negative indicators
    if (content.includes('bad') || content.includes('terrible') || content.includes('awful'))
      score -= 0.5;
    if (
      content.includes('frustrated') ||
      content.includes('angry') ||
      content.includes('disappointed')
    )
      score -= 0.8;

    return Math.max(-1, Math.min(1, score));
  }

  private calculateComplexityScore(messages: any[]): number {
    // Calculate based on message length, technical terms, etc.
    const avgLength =
      messages.reduce((sum: number, m: any) => sum + m.content.length, 0) / messages.length;
    const complexityScore = Math.min(1, avgLength / 500); // Normalize to 0-1
    return complexityScore;
  }

  private calculateEngagementScore(conversation: any, message: any): number {
    // Calculate based on conversation length, response times, etc.
    const messageCount = conversation.messages.length;
    const baseScore = Math.min(1, messageCount / 10); // More messages = higher engagement

    // Adjust based on message quality
    const messageLength = message.content.length;
    const lengthScore = Math.min(1, messageLength / 200);

    return (baseScore + lengthScore) / 2;
  }

  private countFollowUpQuestions(messages: any[], messageIndex: number): number {
    let count = 0;
    for (let i = messageIndex + 1; i < messages.length; i++) {
      if (messages[i].role === 'user' && messages[i].content.includes('?')) {
        count++;
      }
    }
    return count;
  }

  private estimateTaskCompletion(messages: any[]): boolean {
    // Simple heuristic - look for completion indicators
    const lastMessages = messages.slice(-3);
    const content = lastMessages
      .map((m: any) => m.content)
      .join(' ')
      .toLowerCase();

    return (
      content.includes('thank') ||
      content.includes('solved') ||
      content.includes('resolved') ||
      content.includes('perfect') ||
      content.includes('that works')
    );
  }

  private async storeFeedback(feedback: ConversationFeedback): Promise<void> {
    // Store in database - implement based on your schema
    try {
      // This would be implemented with your actual database schema
      console.log('Storing feedback:', feedback.id);
    } catch (error) {
      console.error('Error storing feedback:', error);
    }
  }

  private async processLearningSignals(feedback: ConversationFeedback): Promise<void> {
    if (!feedback.learningSignals.shouldLearnFrom) return;

    // Process learning signals for pattern recognition
    await this.updateLearningPatterns(feedback);

    // Identify knowledge gaps
    await this.identifyKnowledgeGaps(feedback);

    // Update quality metrics
    await this.updateQualityMetrics(feedback);
  }

  private async updateLearningPatterns(feedback: ConversationFeedback): Promise<void> {
    // Update learning patterns based on feedback
    console.log('Updating learning patterns for:', feedback.id);
  }

  private async identifyKnowledgeGaps(feedback: ConversationFeedback): Promise<void> {
    // Identify areas where knowledge is lacking
    if (feedback.learningSignals.learningType === 'negative') {
      console.log('Identifying knowledge gaps for:', feedback.contextData.topicCategories);
    }
  }

  private async updateQualityMetrics(feedback: ConversationFeedback): Promise<void> {
    // Update overall quality metrics
    console.log('Updating quality metrics for agent:', feedback.agentId);
  }
}
