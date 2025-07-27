/**
 * 🎯 Response Analysis Engine - Day 22 Step 22.2
 * Advanced response quality analysis and outcome detection
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ResponseAnalysis {
  id: string;
  messageId: string;
  conversationId: string;
  agentId: string;

  // Response Quality Metrics
  qualityMetrics: {
    accuracy: number; // 0-1 factual accuracy
    relevance: number; // 0-1 relevance to question
    completeness: number; // 0-1 how complete the answer is
    clarity: number; // 0-1 how clear and understandable
    helpfulness: number; // 0-1 how helpful to user
    coherence: number; // 0-1 logical flow and consistency
    appropriateness: number; // 0-1 tone and style appropriateness
    overallScore: number; // 0-1 weighted overall score
  };

  // Response Characteristics
  characteristics: {
    responseLength: number;
    sentenceCount: number;
    averageSentenceLength: number;
    vocabularyComplexity: number;
    technicalTermsCount: number;
    questionAnswerRatio: number;
    actionItemsCount: number;
    examplesCount: number;
    linksCount: number;
    codeBlocksCount: number;
  };

  // Content Analysis
  contentAnalysis: {
    mainTopics: string[];
    keyPoints: string[];
    sentimentScore: number;
    confidenceLevel: number;
    uncertaintyIndicators: string[];
    factualClaims: string[];
    recommendations: string[];
    limitations: string[];
  };

  // Conversation Outcome Detection
  outcomeDetection: {
    conversationStatus: 'ongoing' | 'resolved' | 'escalated' | 'abandoned';
    userSatisfaction: 'satisfied' | 'neutral' | 'dissatisfied' | 'unknown';
    taskCompletion: 'completed' | 'partially_completed' | 'not_completed' | 'unknown';
    resolutionType:
      | 'direct_answer'
      | 'guided_solution'
      | 'resource_provided'
      | 'escalation'
      | 'none';
    followUpNeeded: boolean;
    escalationRisk: number; // 0-1 risk of needing human intervention
  };

  // Context Factors
  contextFactors: {
    conversationLength: number;
    userExpertiseLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    queryComplexity: 'simple' | 'moderate' | 'complex' | 'very_complex';
    domainSpecific: boolean;
    timeOfDay: string;
    responseTime: number;
    ragUsed: boolean;
    ragRelevance?: number;
    providerUsed: string;
    modelUsed: string;
  };

  // Learning Indicators
  learningIndicators: {
    positiveSignals: string[];
    negativeSignals: string[];
    improvementOpportunities: string[];
    successPatterns: string[];
    failurePatterns: string[];
    knowledgeGaps: string[];
  };

  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationOutcome {
  id: string;
  conversationId: string;
  agentId: string;
  userId: string;

  // Final Outcome
  finalStatus: 'success' | 'partial_success' | 'failure' | 'escalated';
  resolutionTime: number; // minutes
  messageCount: number;
  userSatisfactionScore: number; // 0-1

  // Success Metrics
  successMetrics: {
    taskAchieved: boolean;
    userNeedsMetr: boolean;
    efficientResolution: boolean;
    positiveUserFeedback: boolean;
    noEscalationNeeded: boolean;
  };

  // Failure Analysis
  failureAnalysis?: {
    failureReason: string;
    failureCategory:
      | 'knowledge_gap'
      | 'technical_issue'
      | 'user_dissatisfaction'
      | 'complexity'
      | 'other';
    improvementSuggestions: string[];
  };

  // Learning Value
  learningValue: {
    highValueInteraction: boolean;
    learningPotential: number; // 0-1
    reusabilityScore: number; // 0-1 how reusable this knowledge is
    patternStrength: number; // 0-1 how strong the pattern is
  };

  createdAt: Date;
  updatedAt: Date;
}

export class ResponseAnalysisEngine {
  private static instance: ResponseAnalysisEngine;

  static getInstance(): ResponseAnalysisEngine {
    if (!this.instance) {
      this.instance = new ResponseAnalysisEngine();
    }
    return this.instance;
  }

  /**
   * Analyze response quality comprehensively
   */
  async analyzeResponse(
    messageId: string,
    conversationId: string,
    agentId: string,
    responseContent: string,
    userMessage: string,
    conversationContext: any
  ): Promise<ResponseAnalysis> {
    // Get conversation data
    const conversation = await this.getConversationData(conversationId);

    // Analyze quality metrics
    const qualityMetrics = await this.analyzeQualityMetrics(
      responseContent,
      userMessage,
      conversationContext
    );

    // Analyze response characteristics
    const characteristics = this.analyzeResponseCharacteristics(responseContent);

    // Perform content analysis
    const contentAnalysis = await this.performContentAnalysis(
      responseContent,
      userMessage,
      conversationContext
    );

    // Detect conversation outcome
    const outcomeDetection = await this.detectConversationOutcome(
      conversation,
      responseContent,
      userMessage
    );

    // Extract context factors
    const contextFactors = this.extractContextFactors(conversation, conversationContext);

    // Generate learning indicators
    const learningIndicators = await this.generateLearningIndicators(
      qualityMetrics,
      contentAnalysis,
      outcomeDetection,
      contextFactors
    );

    const analysis: ResponseAnalysis = {
      id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      messageId,
      conversationId,
      agentId,
      qualityMetrics,
      characteristics,
      contentAnalysis,
      outcomeDetection,
      contextFactors,
      learningIndicators,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store analysis
    await this.storeAnalysis(analysis);

    return analysis;
  }

  /**
   * Analyze quality metrics
   */
  private async analyzeQualityMetrics(
    responseContent: string,
    userMessage: string,
    conversationContext: any
  ): Promise<ResponseAnalysis['qualityMetrics']> {
    // Analyze accuracy (basic heuristics - can be enhanced with NLP)
    const accuracy = this.analyzeAccuracy(responseContent, userMessage);

    // Analyze relevance
    const relevance = this.analyzeRelevance(responseContent, userMessage);

    // Analyze completeness
    const completeness = this.analyzeCompleteness(responseContent, userMessage);

    // Analyze clarity
    const clarity = this.analyzeClarity(responseContent);

    // Analyze helpfulness
    const helpfulness = this.analyzeHelpfulness(responseContent, userMessage);

    // Analyze coherence
    const coherence = this.analyzeCoherence(responseContent);

    // Analyze appropriateness
    const appropriateness = this.analyzeAppropriateness(responseContent, conversationContext);

    // Calculate overall score (weighted average)
    const overallScore =
      accuracy * 0.25 +
      relevance * 0.2 +
      completeness * 0.15 +
      clarity * 0.15 +
      helpfulness * 0.15 +
      coherence * 0.05 +
      appropriateness * 0.05;

    return {
      accuracy,
      relevance,
      completeness,
      clarity,
      helpfulness,
      coherence,
      appropriateness,
      overallScore,
    };
  }

  /**
   * Analyze response characteristics
   */
  private analyzeResponseCharacteristics(
    responseContent: string
  ): ResponseAnalysis['characteristics'] {
    const sentences = responseContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = responseContent.split(/\s+/).filter(w => w.length > 0);

    // Count various elements
    const questionAnswerRatio =
      (responseContent.match(/\?/g) || []).length / Math.max(1, sentences.length);
    const actionItemsCount = (
      responseContent.match(/\b(should|need to|must|try|follow|step|action)\b/gi) || []
    ).length;
    const examplesCount = (
      responseContent.match(/\b(example|for instance|such as|like|e\.g\.)\b/gi) || []
    ).length;
    const linksCount = (responseContent.match(/https?:\/\/[^\s]+/g) || []).length;
    const codeBlocksCount = (responseContent.match(/```[\s\S]*?```/g) || []).length;

    // Calculate vocabulary complexity
    const vocabularyComplexity = this.calculateVocabularyComplexity(words);

    // Count technical terms
    const technicalTermsCount = this.countTechnicalTerms(responseContent);

    return {
      responseLength: responseContent.length,
      sentenceCount: sentences.length,
      averageSentenceLength: sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length,
      vocabularyComplexity,
      technicalTermsCount,
      questionAnswerRatio,
      actionItemsCount,
      examplesCount,
      linksCount,
      codeBlocksCount,
    };
  }

  /**
   * Perform content analysis
   */
  private async performContentAnalysis(
    responseContent: string,
    userMessage: string,
    conversationContext: any
  ): Promise<ResponseAnalysis['contentAnalysis']> {
    // Extract main topics
    const mainTopics = this.extractMainTopics(responseContent);

    // Extract key points
    const keyPoints = this.extractKeyPoints(responseContent);

    // Calculate sentiment
    const sentimentScore = this.calculateSentiment(responseContent);

    // Assess confidence level
    const confidenceLevel = this.assessConfidenceLevel(responseContent);

    // Identify uncertainty indicators
    const uncertaintyIndicators = this.identifyUncertaintyIndicators(responseContent);

    // Extract factual claims
    const factualClaims = this.extractFactualClaims(responseContent);

    // Extract recommendations
    const recommendations = this.extractRecommendations(responseContent);

    // Identify limitations
    const limitations = this.identifyLimitations(responseContent);

    return {
      mainTopics,
      keyPoints,
      sentimentScore,
      confidenceLevel,
      uncertaintyIndicators,
      factualClaims,
      recommendations,
      limitations,
    };
  }

  /**
   * Detect conversation outcome
   */
  private async detectConversationOutcome(
    conversation: any,
    responseContent: string,
    userMessage: string
  ): Promise<ResponseAnalysis['outcomeDetection']> {
    const messages = conversation.messages || [];
    const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop();

    // Detect conversation status
    const conversationStatus = this.detectConversationStatus(messages, responseContent);

    // Assess user satisfaction
    const userSatisfaction = this.assessUserSatisfaction(messages, lastUserMessage);

    // Determine task completion
    const taskCompletion = this.determineTaskCompletion(messages, responseContent);

    // Identify resolution type
    const resolutionType = this.identifyResolutionType(responseContent);

    // Assess if follow-up is needed
    const followUpNeeded = this.assessFollowUpNeeded(responseContent, userMessage);

    // Calculate escalation risk
    const escalationRisk = this.calculateEscalationRisk(messages, responseContent);

    return {
      conversationStatus,
      userSatisfaction,
      taskCompletion,
      resolutionType,
      followUpNeeded,
      escalationRisk,
    };
  }

  /**
   * Extract context factors
   */
  private extractContextFactors(
    conversation: any,
    conversationContext: any
  ): ResponseAnalysis['contextFactors'] {
    const messages = conversation.messages || [];
    const userMessages = messages.filter((m: any) => m.role === 'user');

    // Determine user expertise level
    const userExpertiseLevel = this.determineUserExpertiseLevel(userMessages);

    // Assess query complexity
    const queryComplexity = this.assessQueryComplexity(userMessages);

    // Check if domain specific
    const domainSpecific = this.checkDomainSpecific(messages);

    return {
      conversationLength: messages.length,
      userExpertiseLevel,
      queryComplexity,
      domainSpecific,
      timeOfDay: new Date().toLocaleTimeString(),
      responseTime: conversationContext.responseTime || 3000,
      ragUsed: conversationContext.ragUsed || false,
      ragRelevance: conversationContext.ragRelevance,
      providerUsed: conversationContext.providerUsed || 'openai',
      modelUsed: conversationContext.modelUsed || 'gpt-3.5-turbo',
    };
  }

  /**
   * Generate learning indicators
   */
  private async generateLearningIndicators(
    qualityMetrics: ResponseAnalysis['qualityMetrics'],
    contentAnalysis: ResponseAnalysis['contentAnalysis'],
    outcomeDetection: ResponseAnalysis['outcomeDetection'],
    contextFactors: ResponseAnalysis['contextFactors']
  ): Promise<ResponseAnalysis['learningIndicators']> {
    const positiveSignals: string[] = [];
    const negativeSignals: string[] = [];
    const improvementOpportunities: string[] = [];
    const successPatterns: string[] = [];
    const failurePatterns: string[] = [];
    const knowledgeGaps: string[] = [];

    // Analyze quality metrics for signals
    if (qualityMetrics.overallScore > 0.8) {
      positiveSignals.push('High overall quality score');
      successPatterns.push('Effective response pattern');
    } else if (qualityMetrics.overallScore < 0.6) {
      negativeSignals.push('Low overall quality score');
      failurePatterns.push('Poor response pattern');
    }

    // Analyze specific quality aspects
    if (qualityMetrics.accuracy < 0.7) {
      negativeSignals.push('Low accuracy detected');
      improvementOpportunities.push('Improve factual accuracy');
      knowledgeGaps.push('Accuracy in domain knowledge');
    }

    if (qualityMetrics.relevance < 0.7) {
      negativeSignals.push('Low relevance detected');
      improvementOpportunities.push('Improve context understanding');
    }

    if (qualityMetrics.completeness < 0.7) {
      negativeSignals.push('Incomplete response');
      improvementOpportunities.push('Provide more comprehensive answers');
    }

    // Analyze outcome detection
    if (outcomeDetection.conversationStatus === 'resolved') {
      positiveSignals.push('Conversation successfully resolved');
      successPatterns.push('Effective problem resolution');
    } else if (outcomeDetection.conversationStatus === 'escalated') {
      negativeSignals.push('Conversation required escalation');
      failurePatterns.push('Failed to resolve user issue');
    }

    if (outcomeDetection.escalationRisk > 0.7) {
      negativeSignals.push('High escalation risk detected');
      improvementOpportunities.push('Improve response to prevent escalation');
    }

    // Analyze context factors
    if (contextFactors.queryComplexity === 'very_complex' && qualityMetrics.overallScore > 0.7) {
      positiveSignals.push('Successfully handled complex query');
      successPatterns.push('Complex query handling');
    }

    if (
      contextFactors.ragUsed &&
      contextFactors.ragRelevance &&
      contextFactors.ragRelevance < 0.6
    ) {
      negativeSignals.push('Poor RAG relevance');
      knowledgeGaps.push('Knowledge base quality');
      improvementOpportunities.push('Improve knowledge base content');
    }

    return {
      positiveSignals,
      negativeSignals,
      improvementOpportunities,
      successPatterns,
      failurePatterns,
      knowledgeGaps,
    };
  }

  // Helper methods for analysis
  private analyzeAccuracy(responseContent: string, userMessage: string): number {
    // Basic accuracy heuristics
    let score = 0.8; // Default assumption

    // Check for uncertainty indicators which might indicate lower accuracy
    const uncertaintyWords = [
      'might',
      'could',
      'possibly',
      'perhaps',
      'maybe',
      'unsure',
      'not sure',
    ];
    const uncertaintyCount = uncertaintyWords.filter(word =>
      responseContent.toLowerCase().includes(word)
    ).length;

    // Reduce score based on uncertainty
    score -= uncertaintyCount * 0.1;

    // Check for factual statements
    const factualIndicators = ['according to', 'research shows', 'studies indicate', 'data shows'];
    const factualCount = factualIndicators.filter(indicator =>
      responseContent.toLowerCase().includes(indicator)
    ).length;

    // Increase score for factual backing
    score += factualCount * 0.1;

    return Math.max(0, Math.min(1, score));
  }

  private analyzeRelevance(responseContent: string, userMessage: string): number {
    // Simple relevance analysis based on keyword overlap
    const userWords = userMessage.toLowerCase().split(/\s+/);
    const responseWords = responseContent.toLowerCase().split(/\s+/);

    const commonWords = userWords.filter(word => responseWords.includes(word) && word.length > 3);

    const relevanceScore = commonWords.length / Math.max(1, userWords.length);
    return Math.min(1, relevanceScore * 2); // Scale up to make it more sensitive
  }

  private analyzeCompleteness(responseContent: string, userMessage: string): number {
    // Analyze if response addresses all parts of the question
    const questionParts = userMessage.split(/[,;]/).length;
    const responseLength = responseContent.length;

    // Basic heuristic: longer responses are more likely to be complete
    const lengthScore = Math.min(1, responseLength / 300);

    // Check for comprehensive elements
    const comprehensiveElements = [
      'because',
      'therefore',
      'for example',
      'additionally',
      'furthermore',
    ];
    const elementCount = comprehensiveElements.filter(element =>
      responseContent.toLowerCase().includes(element)
    ).length;

    const elementScore = Math.min(1, elementCount * 0.2);

    return (lengthScore + elementScore) / 2;
  }

  private analyzeClarity(responseContent: string): number {
    // Analyze clarity based on sentence structure and vocabulary
    const sentences = responseContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength =
      sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length;

    // Optimal sentence length is around 15-20 words
    const lengthScore = avgSentenceLength > 30 ? 0.6 : 0.9;

    // Check for clear structure indicators
    const structureIndicators = ['first', 'second', 'next', 'finally', 'in summary'];
    const structureScore =
      structureIndicators.filter(indicator => responseContent.toLowerCase().includes(indicator))
        .length > 0
        ? 0.9
        : 0.7;

    return (lengthScore + structureScore) / 2;
  }

  private analyzeHelpfulness(responseContent: string, userMessage: string): number {
    // Analyze helpfulness based on actionable content
    const actionableWords = ['should', 'can', 'try', 'follow', 'step', 'guide', 'help', 'solution'];
    const actionableCount = actionableWords.filter(word =>
      responseContent.toLowerCase().includes(word)
    ).length;

    const actionableScore = Math.min(1, actionableCount * 0.15);

    // Check for helpful elements
    const helpfulElements = ['example', 'tip', 'suggestion', 'recommendation', 'advice'];
    const helpfulCount = helpfulElements.filter(element =>
      responseContent.toLowerCase().includes(element)
    ).length;

    const helpfulScore = Math.min(1, helpfulCount * 0.2);

    return Math.max(0.6, (actionableScore + helpfulScore) / 2);
  }

  private analyzeCoherence(responseContent: string): number {
    // Basic coherence analysis
    const sentences = responseContent.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // Check for logical connectors
    const connectors = ['however', 'therefore', 'moreover', 'furthermore', 'consequently', 'thus'];
    const connectorCount = connectors.filter(connector =>
      responseContent.toLowerCase().includes(connector)
    ).length;

    const connectorScore = Math.min(1, connectorCount * 0.3);

    // Basic coherence is assumed to be good for most AI responses
    return Math.max(0.7, connectorScore);
  }

  private analyzeAppropriateness(responseContent: string, conversationContext: any): number {
    // Analyze tone and style appropriateness
    const formalIndicators = ['please', 'thank you', 'i understand', 'i apologize'];
    const formalCount = formalIndicators.filter(indicator =>
      responseContent.toLowerCase().includes(indicator)
    ).length;

    const formalScore = Math.min(1, formalCount * 0.25);

    // Check for inappropriate content (basic)
    const inappropriateWords = ['stupid', 'dumb', 'idiot', 'hate'];
    const inappropriateCount = inappropriateWords.filter(word =>
      responseContent.toLowerCase().includes(word)
    ).length;

    const appropriatenessScore = inappropriateCount > 0 ? 0.3 : Math.max(0.8, formalScore);

    return appropriatenessScore;
  }

  // Additional helper methods
  private calculateVocabularyComplexity(words: string[]): number {
    const longWords = words.filter(word => word.length > 6);
    return longWords.length / Math.max(1, words.length);
  }

  private countTechnicalTerms(content: string): number {
    const technicalPatterns = [
      /\b[A-Z]{2,}\b/g, // Acronyms
      /\b\w+\(\)/g, // Function calls
      /\b\w+\.\w+/g, // Dot notation
      /\b(API|SDK|HTTP|JSON|XML|SQL|CSS|HTML|JavaScript|Python|Java|C\+\+)\b/gi,
    ];

    return technicalPatterns.reduce((count, pattern) => {
      const matches = content.match(pattern);
      return count + (matches ? matches.length : 0);
    }, 0);
  }

  private extractMainTopics(content: string): string[] {
    // Simple topic extraction - can be enhanced with NLP
    const topics: string[] = [];
    const topicKeywords = {
      technical: ['code', 'programming', 'software', 'development', 'technical'],
      support: ['help', 'support', 'assistance', 'problem', 'issue'],
      information: ['information', 'data', 'details', 'facts', 'knowledge'],
      tutorial: ['how to', 'step by step', 'guide', 'tutorial', 'instructions'],
      troubleshooting: ['error', 'bug', 'problem', 'fix', 'troubleshoot'],
    };

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => content.toLowerCase().includes(keyword))) {
        topics.push(topic);
      }
    }

    return topics.length > 0 ? topics : ['general'];
  }

  private extractKeyPoints(content: string): string[] {
    // Extract key points from response
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // Key points are typically longer sentences with important keywords
    const keyPoints = sentences.filter(sentence => {
      const importantWords = ['important', 'key', 'main', 'essential', 'crucial', 'remember'];
      return (
        sentence.length > 50 && importantWords.some(word => sentence.toLowerCase().includes(word))
      );
    });

    return keyPoints.slice(0, 5); // Limit to top 5 key points
  }

  private calculateSentiment(content: string): number {
    // Simple sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'helpful', 'useful', 'perfect', 'amazing'];
    const negativeWords = ['bad', 'terrible', 'awful', 'useless', 'horrible', 'disappointing'];

    const positiveCount = positiveWords.filter(word => content.toLowerCase().includes(word)).length;

    const negativeCount = negativeWords.filter(word => content.toLowerCase().includes(word)).length;

    const sentimentScore =
      (positiveCount - negativeCount) / Math.max(1, positiveCount + negativeCount);
    return Math.max(-1, Math.min(1, sentimentScore));
  }

  private assessConfidenceLevel(content: string): number {
    // Assess confidence based on language used
    const confidenceWords = ['definitely', 'certainly', 'absolutely', 'clearly', 'obviously'];
    const uncertaintyWords = ['might', 'could', 'possibly', 'perhaps', 'maybe', 'unsure'];

    const confidenceCount = confidenceWords.filter(word =>
      content.toLowerCase().includes(word)
    ).length;

    const uncertaintyCount = uncertaintyWords.filter(word =>
      content.toLowerCase().includes(word)
    ).length;

    const baseConfidence = 0.7;
    const confidenceBoost = confidenceCount * 0.1;
    const confidenceReduction = uncertaintyCount * 0.15;

    return Math.max(0, Math.min(1, baseConfidence + confidenceBoost - confidenceReduction));
  }

  private identifyUncertaintyIndicators(content: string): string[] {
    const uncertaintyPatterns = [
      /\b(might|could|possibly|perhaps|maybe|unsure|not sure|unclear)\b/gi,
      /\b(i think|i believe|i assume|it seems|appears to be)\b/gi,
      /\b(probably|likely|unlikely|doubtful)\b/gi,
    ];

    const indicators: string[] = [];
    uncertaintyPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        indicators.push(...matches);
      }
    });

    return [...new Set(indicators)]; // Remove duplicates
  }

  private extractFactualClaims(content: string): string[] {
    // Extract statements that appear to be factual claims
    const factualPatterns = [
      /according to [^.!?]+[.!?]/gi,
      /research shows [^.!?]+[.!?]/gi,
      /studies indicate [^.!?]+[.!?]/gi,
      /data shows [^.!?]+[.!?]/gi,
      /\b\d+%[^.!?]*[.!?]/gi, // Percentage claims
    ];

    const claims: string[] = [];
    factualPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        claims.push(...matches);
      }
    });

    return claims;
  }

  private extractRecommendations(content: string): string[] {
    // Extract recommendations from response
    const recommendationPatterns = [
      /\b(should|recommend|suggest|advise|propose)\b[^.!?]+[.!?]/gi,
      /\b(try|consider|attempt|follow|use)\b[^.!?]+[.!?]/gi,
      /\b(best practice|tip|advice|guidance)\b[^.!?]+[.!?]/gi,
    ];

    const recommendations: string[] = [];
    recommendationPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        recommendations.push(...matches);
      }
    });

    return recommendations.slice(0, 5); // Limit to top 5
  }

  private identifyLimitations(content: string): string[] {
    // Identify stated limitations
    const limitationPatterns = [
      /\b(however|but|although|limitation|constraint|cannot|unable)\b[^.!?]+[.!?]/gi,
      /\b(limited|restricted|only|just|merely)\b[^.!?]+[.!?]/gi,
      /\b(please note|keep in mind|important to note)\b[^.!?]+[.!?]/gi,
    ];

    const limitations: string[] = [];
    limitationPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        limitations.push(...matches);
      }
    });

    return limitations.slice(0, 3); // Limit to top 3
  }

  // Conversation outcome detection methods
  private detectConversationStatus(
    messages: any[],
    responseContent: string
  ): 'ongoing' | 'resolved' | 'escalated' | 'abandoned' {
    // Analyze conversation flow to determine status
    const resolutionIndicators = ['solved', 'resolved', 'fixed', 'working', 'thank you', 'perfect'];
    const escalationIndicators = ['human', 'agent', 'escalate', 'supervisor', 'manager'];

    const hasResolution = resolutionIndicators.some(indicator =>
      responseContent.toLowerCase().includes(indicator)
    );

    const hasEscalation = escalationIndicators.some(indicator =>
      responseContent.toLowerCase().includes(indicator)
    );

    if (hasEscalation) return 'escalated';
    if (hasResolution) return 'resolved';
    if (messages.length > 20) return 'abandoned'; // Long conversations might be abandoned

    return 'ongoing';
  }

  private assessUserSatisfaction(
    messages: any[],
    lastUserMessage: any
  ): 'satisfied' | 'neutral' | 'dissatisfied' | 'unknown' {
    if (!lastUserMessage) return 'unknown';

    const content = lastUserMessage.content.toLowerCase();

    // Positive indicators
    const positiveIndicators = ['thank', 'great', 'perfect', 'excellent', 'helpful', 'solved'];
    const hasPositive = positiveIndicators.some(indicator => content.includes(indicator));

    // Negative indicators
    const negativeIndicators = [
      'frustrated',
      'disappointed',
      'not working',
      'still problem',
      'unhelpful',
    ];
    const hasNegative = negativeIndicators.some(indicator => content.includes(indicator));

    if (hasPositive) return 'satisfied';
    if (hasNegative) return 'dissatisfied';

    return 'neutral';
  }

  private determineTaskCompletion(
    messages: any[],
    responseContent: string
  ): 'completed' | 'partially_completed' | 'not_completed' | 'unknown' {
    // Analyze if the user's task was completed
    const completionIndicators = ['solved', 'working', 'fixed', 'done', 'completed', 'success'];
    const partialIndicators = ['partially', 'some progress', 'getting closer', 'almost'];

    const hasCompletion = completionIndicators.some(indicator =>
      responseContent.toLowerCase().includes(indicator)
    );

    const hasPartial = partialIndicators.some(indicator =>
      responseContent.toLowerCase().includes(indicator)
    );

    if (hasCompletion) return 'completed';
    if (hasPartial) return 'partially_completed';
    if (messages.length > 10) return 'not_completed'; // Long conversations suggest incomplete tasks

    return 'unknown';
  }

  private identifyResolutionType(
    responseContent: string
  ): 'direct_answer' | 'guided_solution' | 'resource_provided' | 'escalation' | 'none' {
    // Identify how the issue was resolved
    const directAnswerIndicators = ['the answer is', 'simply', 'directly', 'straightforward'];
    const guidedSolutionIndicators = ['step', 'follow', 'guide', 'process', 'instructions'];
    const resourceIndicators = ['link', 'documentation', 'reference', 'resource', 'see'];
    const escalationIndicators = ['human', 'agent', 'escalate', 'transfer'];

    if (escalationIndicators.some(indicator => responseContent.toLowerCase().includes(indicator))) {
      return 'escalation';
    }

    if (
      guidedSolutionIndicators.some(indicator => responseContent.toLowerCase().includes(indicator))
    ) {
      return 'guided_solution';
    }

    if (resourceIndicators.some(indicator => responseContent.toLowerCase().includes(indicator))) {
      return 'resource_provided';
    }

    if (
      directAnswerIndicators.some(indicator => responseContent.toLowerCase().includes(indicator))
    ) {
      return 'direct_answer';
    }

    return 'none';
  }

  private assessFollowUpNeeded(responseContent: string, userMessage: string): boolean {
    // Assess if follow-up is needed
    const followUpIndicators = ['follow up', 'check back', 'let me know', 'update me', 'contact'];
    const needsFollowUp = followUpIndicators.some(indicator =>
      responseContent.toLowerCase().includes(indicator)
    );

    // Complex questions might need follow-up
    const isComplexQuery =
      userMessage.length > 200 || (userMessage.includes('?') && userMessage.split('?').length > 2);

    return needsFollowUp || isComplexQuery;
  }

  private calculateEscalationRisk(messages: any[], responseContent: string): number {
    // Calculate risk of needing escalation
    let riskScore = 0;

    // Long conversations increase risk
    if (messages.length > 10) riskScore += 0.3;
    if (messages.length > 15) riskScore += 0.2;

    // Negative sentiment increases risk
    const negativeWords = ['frustrated', 'angry', 'disappointed', 'not working', 'terrible'];
    const negativeCount = negativeWords.filter(word =>
      responseContent.toLowerCase().includes(word)
    ).length;
    riskScore += negativeCount * 0.2;

    // Technical complexity increases risk
    const technicalComplexity = this.countTechnicalTerms(responseContent);
    if (technicalComplexity > 5) riskScore += 0.2;

    // Uncertainty increases risk
    const uncertaintyWords = ['unsure', 'not sure', 'unclear', 'confused'];
    const uncertaintyCount = uncertaintyWords.filter(word =>
      responseContent.toLowerCase().includes(word)
    ).length;
    riskScore += uncertaintyCount * 0.15;

    return Math.min(1, riskScore);
  }

  private determineUserExpertiseLevel(
    userMessages: any[]
  ): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
    // Analyze user messages to determine expertise level
    const allContent = userMessages
      .map((m: any) => m.content)
      .join(' ')
      .toLowerCase();

    const expertTerms = [
      'implementation',
      'architecture',
      'optimization',
      'performance',
      'scalability',
    ];
    const advancedTerms = ['configuration', 'integration', 'customization', 'api', 'framework'];
    const intermediateTerms = ['setup', 'install', 'configure', 'connect', 'troubleshoot'];
    const beginnerTerms = ['how to', 'what is', 'help me', 'i dont know', 'explain'];

    const expertCount = expertTerms.filter(term => allContent.includes(term)).length;
    const advancedCount = advancedTerms.filter(term => allContent.includes(term)).length;
    const intermediateCount = intermediateTerms.filter(term => allContent.includes(term)).length;
    const beginnerCount = beginnerTerms.filter(term => allContent.includes(term)).length;

    if (expertCount > 2) return 'expert';
    if (advancedCount > 2) return 'advanced';
    if (intermediateCount > 2) return 'intermediate';
    if (beginnerCount > 2) return 'beginner';

    return 'intermediate'; // Default
  }

  private assessQueryComplexity(
    userMessages: any[]
  ): 'simple' | 'moderate' | 'complex' | 'very_complex' {
    // Assess complexity of user queries
    const allContent = userMessages.map((m: any) => m.content).join(' ');
    const avgLength = allContent.length / userMessages.length;
    const technicalTerms = this.countTechnicalTerms(allContent);
    const questionCount = (allContent.match(/\?/g) || []).length;

    let complexityScore = 0;

    if (avgLength > 200) complexityScore += 2;
    else if (avgLength > 100) complexityScore += 1;

    if (technicalTerms > 10) complexityScore += 2;
    else if (technicalTerms > 5) complexityScore += 1;

    if (questionCount > 3) complexityScore += 1;

    if (complexityScore >= 4) return 'very_complex';
    if (complexityScore >= 3) return 'complex';
    if (complexityScore >= 2) return 'moderate';
    return 'simple';
  }

  private checkDomainSpecific(messages: any[]): boolean {
    // Check if conversation is domain-specific
    const allContent = messages
      .map((m: any) => m.content)
      .join(' ')
      .toLowerCase();

    const domainKeywords = [
      'technical',
      'programming',
      'software',
      'development',
      'code',
      'medical',
      'legal',
      'financial',
      'scientific',
      'academic',
      'business',
      'marketing',
      'sales',
      'customer service',
    ];

    return domainKeywords.some(keyword => allContent.includes(keyword));
  }

  // Storage methods
  private async getConversationData(conversationId: string): Promise<any> {
    try {
      return await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    } catch (error) {
      console.error('Error getting conversation data:', error);
      return { messages: [] };
    }
  }

  private async storeAnalysis(analysis: ResponseAnalysis): Promise<void> {
    try {
      // Store analysis in database - implement based on your schema
      console.log('Storing response analysis:', analysis.id);
      // await prisma.responseAnalysis.create({ data: analysis });
    } catch (error) {
      console.error('Error storing analysis:', error);
    }
  }

  /**
   * Get analysis for a specific message
   */
  async getAnalysis(messageId: string): Promise<ResponseAnalysis | null> {
    try {
      // Retrieve analysis from database
      // return await prisma.responseAnalysis.findUnique({ where: { messageId } });
      return null;
    } catch (error) {
      console.error('Error getting analysis:', error);
      return null;
    }
  }

  /**
   * Get analysis summary for an agent
   */
  async getAgentAnalysisSummary(
    agentId: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<{
    totalAnalyses: number;
    averageQualityScore: number;
    successRate: number;
    commonIssues: string[];
    improvementAreas: string[];
  }> {
    try {
      // Aggregate analysis data for agent
      return {
        totalAnalyses: 0,
        averageQualityScore: 0,
        successRate: 0,
        commonIssues: [],
        improvementAreas: [],
      };
    } catch (error) {
      console.error('Error getting agent analysis summary:', error);
      return {
        totalAnalyses: 0,
        averageQualityScore: 0,
        successRate: 0,
        commonIssues: [],
        improvementAreas: [],
      };
    }
  }
}
