/**
 * 🔍 Knowledge Extraction Engine - Day 22 Step 22.3
 * Extract knowledge, patterns, and insights from conversations
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ExtractedKnowledge {
  id: string;
  conversationId: string;
  agentId: string;
  userId: string;

  // Knowledge Types
  knowledgeType: 'fact' | 'procedure' | 'concept' | 'example' | 'pattern' | 'faq' | 'solution';

  // Core Knowledge
  coreKnowledge: {
    title: string;
    description: string;
    content: string;
    category: string;
    tags: string[];
    confidence: number; // 0-1 confidence in extracted knowledge
    relevance: number; // 0-1 relevance to domain
    reusability: number; // 0-1 how reusable this knowledge is
  };

  // Context Information
  contextInfo: {
    originalQuestion: string;
    userIntent: string;
    conversationStage: string;
    userExpertiseLevel: string;
    domainContext: string[];
    situationalContext: string[];
  };

  // Extraction Metadata
  extractionMetadata: {
    extractionMethod: 'pattern_matching' | 'nlp_analysis' | 'rule_based' | 'ml_classification';
    extractionConfidence: number;
    validationScore: number;
    qualityIndicators: string[];
    potentialIssues: string[];
  };

  // Learning Value
  learningValue: {
    novelty: number; // 0-1 how novel this knowledge is
    importance: number; // 0-1 importance for future responses
    frequency: number; // How often this type of question appears
    successRate: number; // Success rate when this knowledge is applied
  };

  // Relationships
  relationships: {
    relatedTopics: string[];
    relatedQuestions: string[];
    relatedSolutions: string[];
    prerequisites: string[];
    followUpTopics: string[];
  };

  createdAt: Date;
  updatedAt: Date;
  lastUsed?: Date;
  usageCount: number;
}

export interface FAQEntry {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  confidence: number;
  frequency: number;
  variations: string[];
  relatedQuestions: string[];
  lastUpdated: Date;
  source: 'extracted' | 'manual' | 'generated';
}

export interface ConversationPattern {
  id: string;
  patternType:
    | 'question_pattern'
    | 'response_pattern'
    | 'conversation_flow'
    | 'user_behavior'
    | 'resolution_path';
  pattern: string;
  description: string;
  frequency: number;
  successRate: number;
  contexts: string[];
  examples: {
    conversationId: string;
    snippet: string;
    outcome: string;
  }[];
  confidence: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommonIntent {
  id: string;
  intent: string;
  description: string;
  keywords: string[];
  patterns: string[];
  frequency: number;
  successfulResponses: string[];
  commonFollowUps: string[];
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  averageResolutionTime: number;
  createdAt: Date;
  updatedAt: Date;
}

export class KnowledgeExtractionEngine {
  private static instance: KnowledgeExtractionEngine;

  static getInstance(): KnowledgeExtractionEngine {
    if (!this.instance) {
      this.instance = new KnowledgeExtractionEngine();
    }
    return this.instance;
  }

  /**
   * Extract knowledge from a conversation
   */
  async extractKnowledgeFromConversation(
    conversationId: string,
    agentId: string,
    userId: string
  ): Promise<ExtractedKnowledge[]> {
    // Get conversation data
    const conversation = await this.getConversationData(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const extractedKnowledge: ExtractedKnowledge[] = [];

    // Extract different types of knowledge
    const factualKnowledge = await this.extractFactualKnowledge(conversation);
    const proceduralKnowledge = await this.extractProceduralKnowledge(conversation);
    const conceptualKnowledge = await this.extractConceptualKnowledge(conversation);
    const exampleKnowledge = await this.extractExampleKnowledge(conversation);
    const solutionKnowledge = await this.extractSolutionKnowledge(conversation);

    // Combine all extracted knowledge
    extractedKnowledge.push(...factualKnowledge);
    extractedKnowledge.push(...proceduralKnowledge);
    extractedKnowledge.push(...conceptualKnowledge);
    extractedKnowledge.push(...exampleKnowledge);
    extractedKnowledge.push(...solutionKnowledge);

    // Validate and score knowledge
    const validatedKnowledge = await this.validateExtractedKnowledge(extractedKnowledge);

    // Store knowledge
    await this.storeExtractedKnowledge(validatedKnowledge);

    return validatedKnowledge;
  }

  /**
   * Generate FAQ entries from conversations
   */
  async generateFAQFromConversations(
    agentId: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<FAQEntry[]> {
    // Get conversations for the agent
    const conversations = await this.getAgentConversations(agentId, timeRange);

    // Group similar questions
    const questionGroups = await this.groupSimilarQuestions(conversations);

    // Generate FAQ entries
    const faqEntries: FAQEntry[] = [];

    for (const group of questionGroups) {
      const faqEntry = await this.createFAQEntry(group);
      if (faqEntry) {
        faqEntries.push(faqEntry);
      }
    }

    // Sort by frequency and confidence
    faqEntries.sort((a, b) => b.frequency * b.confidence - a.frequency * a.confidence);

    return faqEntries;
  }

  /**
   * Extract conversation patterns
   */
  async extractConversationPatterns(
    agentId: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<ConversationPattern[]> {
    // Get conversations
    const conversations = await this.getAgentConversations(agentId, timeRange);

    // Extract different types of patterns
    const questionPatterns = await this.extractQuestionPatterns(conversations);
    const responsePatterns = await this.extractResponsePatterns(conversations);
    const flowPatterns = await this.extractFlowPatterns(conversations);
    const behaviorPatterns = await this.extractBehaviorPatterns(conversations);
    const resolutionPatterns = await this.extractResolutionPatterns(conversations);

    // Combine all patterns
    const allPatterns = [
      ...questionPatterns,
      ...responsePatterns,
      ...flowPatterns,
      ...behaviorPatterns,
      ...resolutionPatterns,
    ];

    // Filter patterns by confidence and frequency
    const significantPatterns = allPatterns.filter(
      pattern => pattern.confidence > 0.6 && pattern.frequency > 2
    );

    return significantPatterns;
  }

  /**
   * Extract common user intents
   */
  async extractCommonIntents(
    agentId: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<CommonIntent[]> {
    // Get conversations
    const conversations = await this.getAgentConversations(agentId, timeRange);

    // Extract intents from user messages
    const intentMap = new Map<
      string,
      {
        count: number;
        keywords: Set<string>;
        patterns: Set<string>;
        examples: any[];
        successfulResponses: string[];
        followUps: string[];
        resolutionTimes: number[];
      }
    >();

    for (const conversation of conversations) {
      const userMessages = conversation.messages.filter((m: any) => m.role === 'user');

      for (const message of userMessages) {
        const intent = await this.classifyUserIntent(message.content);

        if (!intentMap.has(intent)) {
          intentMap.set(intent, {
            count: 0,
            keywords: new Set(),
            patterns: new Set(),
            examples: [],
            successfulResponses: [],
            followUps: [],
            resolutionTimes: [],
          });
        }

        const intentData = intentMap.get(intent)!;
        intentData.count++;

        // Extract keywords
        const keywords = this.extractKeywords(message.content);
        keywords.forEach(keyword => intentData.keywords.add(keyword));

        // Extract patterns
        const patterns = this.extractPatterns(message.content);
        patterns.forEach(pattern => intentData.patterns.add(pattern));

        // Store examples
        intentData.examples.push({
          conversationId: conversation.id,
          message: message.content,
          timestamp: message.createdAt,
        });

        // Get successful responses
        const nextMessage = conversation.messages.find(
          (m: any) => m.role === 'assistant' && new Date(m.createdAt) > new Date(message.createdAt)
        );

        if (nextMessage) {
          intentData.successfulResponses.push(nextMessage.content);
        }

        // Calculate resolution time
        const resolutionTime = this.calculateResolutionTime(conversation, message);
        if (resolutionTime > 0) {
          intentData.resolutionTimes.push(resolutionTime);
        }
      }
    }

    // Convert to CommonIntent objects
    const commonIntents: CommonIntent[] = [];

    for (const [intent, data] of intentMap.entries()) {
      if (data.count >= 3) {
        // Only include intents that appear at least 3 times
        const commonIntent: CommonIntent = {
          id: `intent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          intent,
          description: this.generateIntentDescription(intent, data),
          keywords: Array.from(data.keywords).slice(0, 10),
          patterns: Array.from(data.patterns).slice(0, 5),
          frequency: data.count,
          successfulResponses: data.successfulResponses.slice(0, 3),
          commonFollowUps: data.followUps.slice(0, 3),
          difficulty: this.assessIntentDifficulty(intent, data),
          averageResolutionTime:
            data.resolutionTimes.reduce((sum, time) => sum + time, 0) /
              data.resolutionTimes.length || 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        commonIntents.push(commonIntent);
      }
    }

    // Sort by frequency
    commonIntents.sort((a, b) => b.frequency - a.frequency);

    return commonIntents;
  }

  // Knowledge extraction methods
  private async extractFactualKnowledge(conversation: any): Promise<ExtractedKnowledge[]> {
    const knowledge: ExtractedKnowledge[] = [];
    const messages = conversation.messages || [];

    for (const message of messages) {
      if (message.role === 'assistant') {
        // Extract factual statements
        const factualStatements = this.extractFactualStatements(message.content);

        for (const statement of factualStatements) {
          const extractedKnowledge: ExtractedKnowledge = {
            id: `fact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            conversationId: conversation.id,
            agentId: conversation.agentId,
            userId: conversation.userId,
            knowledgeType: 'fact',
            coreKnowledge: {
              title: this.generateFactTitle(statement),
              description: `Factual information extracted from conversation`,
              content: statement,
              category: await this.categorizeContent(statement),
              tags: this.extractTags(statement),
              confidence: this.assessFactualConfidence(statement),
              relevance: this.assessRelevance(statement),
              reusability: this.assessReusability(statement),
            },
            contextInfo: {
              originalQuestion: this.findOriginalQuestion(messages, message),
              userIntent: await this.extractUserIntent(messages, message),
              conversationStage: this.determineConversationStage(messages, message),
              userExpertiseLevel: this.assessUserExpertise(messages),
              domainContext: this.extractDomainContext(messages),
              situationalContext: this.extractSituationalContext(messages),
            },
            extractionMetadata: {
              extractionMethod: 'pattern_matching',
              extractionConfidence: 0.8,
              validationScore: 0.7,
              qualityIndicators: ['factual_statement', 'specific_information'],
              potentialIssues: [],
            },
            learningValue: {
              novelty: 0.7,
              importance: 0.8,
              frequency: 1,
              successRate: 0.8,
            },
            relationships: {
              relatedTopics: this.extractRelatedTopics(statement),
              relatedQuestions: [],
              relatedSolutions: [],
              prerequisites: [],
              followUpTopics: [],
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            usageCount: 0,
          };

          knowledge.push(extractedKnowledge);
        }
      }
    }

    return knowledge;
  }

  private async extractProceduralKnowledge(conversation: any): Promise<ExtractedKnowledge[]> {
    const knowledge: ExtractedKnowledge[] = [];
    const messages = conversation.messages || [];

    for (const message of messages) {
      if (message.role === 'assistant') {
        // Extract step-by-step procedures
        const procedures = this.extractProcedures(message.content);

        for (const procedure of procedures) {
          const extractedKnowledge: ExtractedKnowledge = {
            id: `proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            conversationId: conversation.id,
            agentId: conversation.agentId,
            userId: conversation.userId,
            knowledgeType: 'procedure',
            coreKnowledge: {
              title: this.generateProcedureTitle(procedure),
              description: `Step-by-step procedure extracted from conversation`,
              content: procedure,
              category: await this.categorizeContent(procedure),
              tags: this.extractTags(procedure),
              confidence: this.assessProceduralConfidence(procedure),
              relevance: this.assessRelevance(procedure),
              reusability: this.assessReusability(procedure),
            },
            contextInfo: {
              originalQuestion: this.findOriginalQuestion(messages, message),
              userIntent: await this.extractUserIntent(messages, message),
              conversationStage: this.determineConversationStage(messages, message),
              userExpertiseLevel: this.assessUserExpertise(messages),
              domainContext: this.extractDomainContext(messages),
              situationalContext: this.extractSituationalContext(messages),
            },
            extractionMetadata: {
              extractionMethod: 'pattern_matching',
              extractionConfidence: 0.8,
              validationScore: 0.8,
              qualityIndicators: ['step_by_step', 'actionable_content'],
              potentialIssues: [],
            },
            learningValue: {
              novelty: 0.8,
              importance: 0.9,
              frequency: 1,
              successRate: 0.9,
            },
            relationships: {
              relatedTopics: this.extractRelatedTopics(procedure),
              relatedQuestions: [],
              relatedSolutions: [],
              prerequisites: this.extractPrerequisites(procedure),
              followUpTopics: [],
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            usageCount: 0,
          };

          knowledge.push(extractedKnowledge);
        }
      }
    }

    return knowledge;
  }

  private async extractConceptualKnowledge(conversation: any): Promise<ExtractedKnowledge[]> {
    const knowledge: ExtractedKnowledge[] = [];
    const messages = conversation.messages || [];

    for (const message of messages) {
      if (message.role === 'assistant') {
        // Extract conceptual explanations
        const concepts = this.extractConcepts(message.content);

        for (const concept of concepts) {
          const extractedKnowledge: ExtractedKnowledge = {
            id: `concept_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            conversationId: conversation.id,
            agentId: conversation.agentId,
            userId: conversation.userId,
            knowledgeType: 'concept',
            coreKnowledge: {
              title: this.generateConceptTitle(concept),
              description: `Conceptual explanation extracted from conversation`,
              content: concept,
              category: await this.categorizeContent(concept),
              tags: this.extractTags(concept),
              confidence: this.assessConceptualConfidence(concept),
              relevance: this.assessRelevance(concept),
              reusability: this.assessReusability(concept),
            },
            contextInfo: {
              originalQuestion: this.findOriginalQuestion(messages, message),
              userIntent: await this.extractUserIntent(messages, message),
              conversationStage: this.determineConversationStage(messages, message),
              userExpertiseLevel: this.assessUserExpertise(messages),
              domainContext: this.extractDomainContext(messages),
              situationalContext: this.extractSituationalContext(messages),
            },
            extractionMetadata: {
              extractionMethod: 'nlp_analysis',
              extractionConfidence: 0.7,
              validationScore: 0.7,
              qualityIndicators: ['conceptual_explanation', 'educational_content'],
              potentialIssues: [],
            },
            learningValue: {
              novelty: 0.8,
              importance: 0.8,
              frequency: 1,
              successRate: 0.8,
            },
            relationships: {
              relatedTopics: this.extractRelatedTopics(concept),
              relatedQuestions: [],
              relatedSolutions: [],
              prerequisites: [],
              followUpTopics: this.extractFollowUpTopics(concept),
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            usageCount: 0,
          };

          knowledge.push(extractedKnowledge);
        }
      }
    }

    return knowledge;
  }

  private async extractExampleKnowledge(conversation: any): Promise<ExtractedKnowledge[]> {
    const knowledge: ExtractedKnowledge[] = [];
    const messages = conversation.messages || [];

    for (const message of messages) {
      if (message.role === 'assistant') {
        // Extract examples
        const examples = this.extractExamples(message.content);

        for (const example of examples) {
          const extractedKnowledge: ExtractedKnowledge = {
            id: `example_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            conversationId: conversation.id,
            agentId: conversation.agentId,
            userId: conversation.userId,
            knowledgeType: 'example',
            coreKnowledge: {
              title: this.generateExampleTitle(example),
              description: `Example extracted from conversation`,
              content: example,
              category: await this.categorizeContent(example),
              tags: this.extractTags(example),
              confidence: this.assessExampleConfidence(example),
              relevance: this.assessRelevance(example),
              reusability: this.assessReusability(example),
            },
            contextInfo: {
              originalQuestion: this.findOriginalQuestion(messages, message),
              userIntent: await this.extractUserIntent(messages, message),
              conversationStage: this.determineConversationStage(messages, message),
              userExpertiseLevel: this.assessUserExpertise(messages),
              domainContext: this.extractDomainContext(messages),
              situationalContext: this.extractSituationalContext(messages),
            },
            extractionMetadata: {
              extractionMethod: 'pattern_matching',
              extractionConfidence: 0.8,
              validationScore: 0.8,
              qualityIndicators: ['concrete_example', 'illustrative_content'],
              potentialIssues: [],
            },
            learningValue: {
              novelty: 0.7,
              importance: 0.8,
              frequency: 1,
              successRate: 0.8,
            },
            relationships: {
              relatedTopics: this.extractRelatedTopics(example),
              relatedQuestions: [],
              relatedSolutions: [],
              prerequisites: [],
              followUpTopics: [],
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            usageCount: 0,
          };

          knowledge.push(extractedKnowledge);
        }
      }
    }

    return knowledge;
  }

  private async extractSolutionKnowledge(conversation: any): Promise<ExtractedKnowledge[]> {
    const knowledge: ExtractedKnowledge[] = [];
    const messages = conversation.messages || [];

    // Look for problem-solution pairs
    for (let i = 0; i < messages.length - 1; i++) {
      const userMessage = messages[i];
      const assistantMessage = messages[i + 1];

      if (userMessage.role === 'user' && assistantMessage.role === 'assistant') {
        // Check if user message contains a problem
        const isProblem = this.isProblemStatement(userMessage.content);

        if (isProblem) {
          const extractedKnowledge: ExtractedKnowledge = {
            id: `solution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            conversationId: conversation.id,
            agentId: conversation.agentId,
            userId: conversation.userId,
            knowledgeType: 'solution',
            coreKnowledge: {
              title: this.generateSolutionTitle(userMessage.content),
              description: `Solution to problem extracted from conversation`,
              content: `Problem: ${userMessage.content}\n\nSolution: ${assistantMessage.content}`,
              category: await this.categorizeContent(assistantMessage.content),
              tags: this.extractTags(userMessage.content + ' ' + assistantMessage.content),
              confidence: this.assessSolutionConfidence(
                userMessage.content,
                assistantMessage.content
              ),
              relevance: this.assessRelevance(assistantMessage.content),
              reusability: this.assessReusability(assistantMessage.content),
            },
            contextInfo: {
              originalQuestion: userMessage.content,
              userIntent: await this.extractUserIntent(messages, userMessage),
              conversationStage: this.determineConversationStage(messages, userMessage),
              userExpertiseLevel: this.assessUserExpertise(messages),
              domainContext: this.extractDomainContext(messages),
              situationalContext: this.extractSituationalContext(messages),
            },
            extractionMetadata: {
              extractionMethod: 'rule_based',
              extractionConfidence: 0.8,
              validationScore: 0.8,
              qualityIndicators: ['problem_solution_pair', 'actionable_solution'],
              potentialIssues: [],
            },
            learningValue: {
              novelty: 0.8,
              importance: 0.9,
              frequency: 1,
              successRate: 0.9,
            },
            relationships: {
              relatedTopics: this.extractRelatedTopics(
                userMessage.content + ' ' + assistantMessage.content
              ),
              relatedQuestions: [userMessage.content],
              relatedSolutions: [assistantMessage.content],
              prerequisites: [],
              followUpTopics: [],
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            usageCount: 0,
          };

          knowledge.push(extractedKnowledge);
        }
      }
    }

    return knowledge;
  }

  // Helper methods for knowledge extraction
  private extractFactualStatements(content: string): string[] {
    // Extract statements that appear to be factual
    const factualPatterns = [
      /according to [^.!?]+[.!?]/gi,
      /research shows [^.!?]+[.!?]/gi,
      /studies indicate [^.!?]+[.!?]/gi,
      /data shows [^.!?]+[.!?]/gi,
      /\b\d+%[^.!?]*[.!?]/gi, // Percentage statements
      /\b(is|are|was|were|will be|has been|have been)\b[^.!?]+[.!?]/gi,
    ];

    const statements: string[] = [];
    factualPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        statements.push(...matches);
      }
    });

    return statements.filter(statement => statement.length > 20); // Filter out very short statements
  }

  private extractFactualClaims(content: string): string[] {
    // Extract factual claims from content
    const factualPatterns = [
      /according to [^.!?]+[.!?]/gi,
      /research shows [^.!?]+[.!?]/gi,
      /studies indicate [^.!?]+[.!?]/gi,
      /data shows [^.!?]+[.!?]/gi,
      /\b\d+%[^.!?]*[.!?]/gi, // Percentage claims
    ];

    const factualClaims: string[] = [];
    factualPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        factualClaims.push(...matches);
      }
    });

    return factualClaims;
  }

  private extractProcedures(content: string): string[] {
    // Extract step-by-step procedures
    const procedurePatterns = [
      /(?:step \d+|first|second|third|next|then|finally)[^.!?]+[.!?]/gi,
      /(?:\d+\.|\d+\))[^.!?]+[.!?]/gi,
      /(?:to do this|follow these steps|here's how)[^.!?]+[.!?]/gi,
    ];

    const procedures: string[] = [];

    // Look for sequences of steps
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    let currentProcedure = '';
    let inProcedure = false;

    for (const sentence of sentences) {
      const isStep = procedurePatterns.some(pattern => sentence.match(pattern));

      if (isStep) {
        if (!inProcedure) {
          currentProcedure = sentence.trim();
          inProcedure = true;
        } else {
          currentProcedure += '. ' + sentence.trim();
        }
      } else if (inProcedure) {
        // End of procedure
        if (currentProcedure.length > 50) {
          procedures.push(currentProcedure);
        }
        currentProcedure = '';
        inProcedure = false;
      }
    }

    // Add last procedure if exists
    if (currentProcedure.length > 50) {
      procedures.push(currentProcedure);
    }

    return procedures;
  }

  private extractConcepts(content: string): string[] {
    // Extract conceptual explanations
    const conceptPatterns = [
      /(?:what is|what are|definition of|concept of)[^.!?]+[.!?]/gi,
      /(?:essentially|basically|fundamentally|in essence)[^.!?]+[.!?]/gi,
      /(?:this means|this refers to|this is)[^.!?]+[.!?]/gi,
    ];

    const concepts: string[] = [];
    conceptPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        concepts.push(...matches);
      }
    });

    return concepts.filter(concept => concept.length > 30);
  }

  private extractExamples(content: string): string[] {
    // Extract examples
    const examplePatterns = [
      /(?:for example|for instance|such as|like|e\.g\.)[^.!?]+[.!?]/gi,
      /(?:here's an example|consider this|imagine)[^.!?]+[.!?]/gi,
      /(?:let's say|suppose|assume)[^.!?]+[.!?]/gi,
    ];

    const examples: string[] = [];
    examplePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        examples.push(...matches);
      }
    });

    return examples.filter(example => example.length > 20);
  }

  private isProblemStatement(content: string): boolean {
    // Check if content describes a problem
    const problemIndicators = [
      'problem',
      'issue',
      'error',
      'bug',
      'not working',
      "doesn't work",
      "can't",
      'unable to',
      'difficulty',
      'trouble',
      'help',
      'stuck',
      'wrong',
      'incorrect',
      'failed',
      'broken',
      'missing',
    ];

    const lowerContent = content.toLowerCase();
    return problemIndicators.some(indicator => lowerContent.includes(indicator));
  }

  // Title generation methods
  private generateFactTitle(statement: string): string {
    const words = statement.split(/\s+/).slice(0, 8);
    return words.join(' ') + (words.length < statement.split(/\s+/).length ? '...' : '');
  }

  private generateProcedureTitle(procedure: string): string {
    const firstSentence = procedure.split(/[.!?]/)[0];
    return (
      'How to ' +
      firstSentence
        .toLowerCase()
        .replace(/^(step \d+|first|second|third|next|then|finally)\s*/i, '')
    );
  }

  private generateConceptTitle(concept: string): string {
    const words = concept.split(/\s+/).slice(0, 6);
    return words.join(' ') + (words.length < concept.split(/\s+/).length ? '...' : '');
  }

  private generateExampleTitle(example: string): string {
    return 'Example: ' + example.split(/\s+/).slice(0, 6).join(' ') + '...';
  }

  private generateSolutionTitle(problem: string): string {
    const words = problem.split(/\s+/).slice(0, 8);
    return (
      'Solution: ' + words.join(' ') + (words.length < problem.split(/\s+/).length ? '...' : '')
    );
  }

  // Assessment methods
  private assessFactualConfidence(statement: string): number {
    // Assess confidence in factual statement
    const confidenceIndicators = [
      'according to',
      'research shows',
      'studies indicate',
      'data shows',
    ];
    const uncertaintyIndicators = ['might', 'could', 'possibly', 'perhaps', 'maybe'];

    let confidence = 0.7; // Base confidence

    if (confidenceIndicators.some(indicator => statement.toLowerCase().includes(indicator))) {
      confidence += 0.2;
    }

    if (uncertaintyIndicators.some(indicator => statement.toLowerCase().includes(indicator))) {
      confidence -= 0.3;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  private assessProceduralConfidence(procedure: string): number {
    // Assess confidence in procedural knowledge
    const stepWords = procedure.match(/\b(step|first|second|third|next|then|finally)\b/gi);
    const actionWords = procedure.match(/\b(do|follow|click|select|choose|enter|type)\b/gi);

    let confidence = 0.6; // Base confidence

    if (stepWords && stepWords.length > 1) confidence += 0.2;
    if (actionWords && actionWords.length > 2) confidence += 0.2;

    return Math.min(1, confidence);
  }

  private assessConceptualConfidence(concept: string): number {
    // Assess confidence in conceptual knowledge
    const explanationWords = concept.match(/\b(means|refers to|is|are|definition|concept)\b/gi);

    let confidence = 0.6; // Base confidence

    if (explanationWords && explanationWords.length > 0) confidence += 0.2;
    if (concept.length > 100) confidence += 0.1; // Longer explanations might be more complete

    return Math.min(1, confidence);
  }

  private assessExampleConfidence(example: string): number {
    // Assess confidence in example
    const exampleWords = example.match(/\b(example|instance|such as|like|e\.g\.)\b/gi);

    let confidence = 0.7; // Base confidence

    if (exampleWords && exampleWords.length > 0) confidence += 0.2;

    return Math.min(1, confidence);
  }

  private assessSolutionConfidence(problem: string, solution: string): number {
    // Assess confidence in solution
    const solutionWords = solution.match(/\b(solution|fix|resolve|try|follow|do)\b/gi);
    const actionWords = solution.match(/\b(should|need to|must|can|will)\b/gi);

    let confidence = 0.7; // Base confidence

    if (solutionWords && solutionWords.length > 0) confidence += 0.1;
    if (actionWords && actionWords.length > 1) confidence += 0.1;
    if (solution.length > problem.length) confidence += 0.1; // Detailed solutions

    return Math.min(1, confidence);
  }

  private assessRelevance(content: string): number {
    // Simple relevance assessment - can be enhanced
    return 0.8; // Default relevance
  }

  private assessReusability(content: string): number {
    // Assess how reusable this knowledge is
    const generalWords = content.match(/\b(general|common|typical|usual|standard)\b/gi);
    const specificWords = content.match(/\b(specific|particular|unique|special|custom)\b/gi);

    let reusability = 0.7; // Base reusability

    if (generalWords && generalWords.length > 0) reusability += 0.2;
    if (specificWords && specificWords.length > 0) reusability -= 0.1;

    return Math.max(0, Math.min(1, reusability));
  }

  // Context extraction methods
  private findOriginalQuestion(messages: any[], currentMessage: any): string {
    // Find the user question that led to this response
    const currentIndex = messages.findIndex((m: any) => m.id === currentMessage.id);

    for (let i = currentIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        return messages[i].content;
      }
    }

    return '';
  }

  private async extractUserIntent(messages: any[], currentMessage: any): Promise<string> {
    // Extract user intent from context
    const userMessages = messages.filter((m: any) => m.role === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1];

    if (!lastUserMessage) return 'unknown';

    return await this.classifyUserIntent(lastUserMessage.content);
  }

  private async classifyUserIntent(content: string): Promise<string> {
    // Simple intent classification
    const lowerContent = content.toLowerCase();

    if (lowerContent.includes('how') || lowerContent.includes('what')) return 'information_request';
    if (lowerContent.includes('problem') || lowerContent.includes('issue')) return 'problem_report';
    if (lowerContent.includes('help') || lowerContent.includes('support')) return 'help_request';
    if (lowerContent.includes('thank') || lowerContent.includes('thanks')) return 'gratitude';

    return 'general_inquiry';
  }

  private determineConversationStage(messages: any[], currentMessage: any): string {
    const currentIndex = messages.findIndex((m: any) => m.id === currentMessage.id);

    if (currentIndex <= 2) return 'greeting';
    if (currentIndex <= 6) return 'inquiry';
    if (currentIndex <= 10) return 'problem_solving';
    return 'resolution';
  }

  private assessUserExpertise(messages: any[]): string {
    // Assess user expertise level
    const userMessages = messages.filter((m: any) => m.role === 'user');
    const allContent = userMessages
      .map((m: any) => m.content)
      .join(' ')
      .toLowerCase();

    const expertTerms = ['implementation', 'architecture', 'optimization', 'performance'];
    const beginnerTerms = ['how to', 'what is', 'help me', 'i dont know'];

    const expertCount = expertTerms.filter(term => allContent.includes(term)).length;
    const beginnerCount = beginnerTerms.filter(term => allContent.includes(term)).length;

    if (expertCount > beginnerCount) return 'advanced';
    if (beginnerCount > expertCount) return 'beginner';
    return 'intermediate';
  }

  private extractDomainContext(messages: any[]): string[] {
    // Extract domain context
    const allContent = messages
      .map((m: any) => m.content)
      .join(' ')
      .toLowerCase();

    const domains = ['technical', 'business', 'medical', 'legal', 'financial', 'educational'];
    const detectedDomains: string[] = [];

    for (const domain of domains) {
      if (allContent.includes(domain)) {
        detectedDomains.push(domain);
      }
    }

    return detectedDomains.length > 0 ? detectedDomains : ['general'];
  }

  private extractSituationalContext(messages: any[]): string[] {
    // Extract situational context
    const allContent = messages
      .map((m: any) => m.content)
      .join(' ')
      .toLowerCase();

    const situations = ['urgent', 'learning', 'troubleshooting', 'planning', 'research'];
    const detectedSituations: string[] = [];

    for (const situation of situations) {
      if (allContent.includes(situation)) {
        detectedSituations.push(situation);
      }
    }

    return detectedSituations;
  }

  private extractTags(content: string): string[] {
    // Extract relevant tags
    const words = content.toLowerCase().split(/\s+/);
    const stopWords = [
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
    ];

    const tags = words
      .filter(word => word.length > 3 && !stopWords.includes(word))
      .filter(word => /^[a-z]+$/.test(word))
      .slice(0, 10);

    return [...new Set(tags)]; // Remove duplicates
  }

  private async categorizeContent(content: string): Promise<string> {
    // Categorize content
    const lowerContent = content.toLowerCase();

    if (lowerContent.includes('technical') || lowerContent.includes('code')) return 'technical';
    if (lowerContent.includes('business') || lowerContent.includes('management')) return 'business';
    if (lowerContent.includes('support') || lowerContent.includes('help')) return 'support';
    if (lowerContent.includes('tutorial') || lowerContent.includes('guide')) return 'tutorial';

    return 'general';
  }

  private extractRelatedTopics(content: string): string[] {
    // Extract related topics
    const topicKeywords = {
      programming: ['code', 'programming', 'development', 'software'],
      database: ['database', 'sql', 'query', 'table'],
      web: ['web', 'html', 'css', 'javascript', 'website'],
      mobile: ['mobile', 'app', 'android', 'ios'],
      security: ['security', 'authentication', 'encryption', 'password'],
    };

    const lowerContent = content.toLowerCase();
    const relatedTopics: string[] = [];

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        relatedTopics.push(topic);
      }
    }

    return relatedTopics;
  }

  private extractPrerequisites(content: string): string[] {
    // Extract prerequisites from procedural content
    const prerequisitePatterns = [
      /(?:before|first|initially|prerequisite|requirement)[^.!?]+[.!?]/gi,
      /(?:you need|you must|you should have)[^.!?]+[.!?]/gi,
    ];

    const prerequisites: string[] = [];
    prerequisitePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        prerequisites.push(...matches);
      }
    });

    return prerequisites;
  }

  private extractFollowUpTopics(content: string): string[] {
    // Extract follow-up topics
    const followUpPatterns = [
      /(?:next|after|then|following|subsequently)[^.!?]+[.!?]/gi,
      /(?:you might also|you could also|consider)[^.!?]+[.!?]/gi,
    ];

    const followUpTopics: string[] = [];
    followUpPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        followUpTopics.push(...matches);
      }
    });

    return followUpTopics;
  }

  private extractKeywords(content: string): string[] {
    // Extract keywords from content
    const words = content.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    const stopWords = [
      'that',
      'this',
      'with',
      'from',
      'they',
      'have',
      'been',
      'will',
      'would',
      'could',
      'should',
    ];

    return words.filter(word => !stopWords.includes(word)).slice(0, 10);
  }

  private extractPatterns(content: string): string[] {
    // Extract patterns from content
    const patterns: string[] = [];

    // Question patterns
    if (content.includes('how to')) patterns.push('how_to_question');
    if (content.includes('what is')) patterns.push('definition_question');
    if (content.includes('why')) patterns.push('explanation_question');
    if (content.includes('where')) patterns.push('location_question');
    if (content.includes('when')) patterns.push('time_question');

    // Problem patterns
    if (content.includes('not working')) patterns.push('malfunction_report');
    if (content.includes('error')) patterns.push('error_report');
    if (content.includes('problem')) patterns.push('problem_report');

    return patterns;
  }

  // Validation and storage methods
  private async validateExtractedKnowledge(
    knowledge: ExtractedKnowledge[]
  ): Promise<ExtractedKnowledge[]> {
    // Validate extracted knowledge
    return knowledge.filter(
      k => k.coreKnowledge.confidence > 0.5 && k.coreKnowledge.content.length > 20
    );
  }

  private async storeExtractedKnowledge(knowledge: ExtractedKnowledge[]): Promise<void> {
    // Store extracted knowledge in database
    for (const k of knowledge) {
      try {
        // Store in database - implement based on your schema
        console.log('Storing extracted knowledge:', k.id);
      } catch (error) {
        console.error('Error storing knowledge:', error);
      }
    }
  }

  // Data retrieval methods
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
      return null;
    }
  }

  private async getAgentConversations(
    agentId: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<any[]> {
    try {
      const where: any = { agentId };

      if (timeRange) {
        where.createdAt = {
          gte: timeRange.start,
          lte: timeRange.end,
        };
      }

      return await prisma.conversation.findMany({
        where,
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100, // Limit to recent conversations
      });
    } catch (error) {
      console.error('Error getting agent conversations:', error);
      return [];
    }
  }

  // FAQ generation methods
  private async groupSimilarQuestions(conversations: any[]): Promise<any[]> {
    // Group similar questions together
    const questionGroups: any[] = [];

    // Simple grouping by keywords - can be enhanced with NLP
    const questionMap = new Map<string, any[]>();

    for (const conversation of conversations) {
      const userMessages = conversation.messages.filter((m: any) => m.role === 'user');

      for (const message of userMessages) {
        const keywords = this.extractKeywords(message.content);
        const keywordKey = keywords.slice(0, 3).join('_');

        if (!questionMap.has(keywordKey)) {
          questionMap.set(keywordKey, []);
        }

        questionMap.get(keywordKey)!.push({
          conversationId: conversation.id,
          question: message.content,
          timestamp: message.createdAt,
        });
      }
    }

    // Convert to groups
    for (const [key, questions] of questionMap.entries()) {
      if (questions.length >= 2) {
        // Only include groups with multiple questions
        questionGroups.push({
          key,
          questions,
          frequency: questions.length,
        });
      }
    }

    return questionGroups;
  }

  private async createFAQEntry(group: any): Promise<FAQEntry | null> {
    // Create FAQ entry from question group
    if (group.questions.length < 2) return null;

    // Use the most common question as the main question
    const mainQuestion = group.questions[0].question;

    // Generate variations
    const variations = group.questions.slice(1, 4).map((q: any) => q.question);

    // Generate answer (simplified - in practice, you'd use the most successful answer)
    const answer = `This is a frequently asked question about ${group.key.replace(/_/g, ' ')}.`;

    return {
      id: `faq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      question: mainQuestion,
      answer,
      category: 'general',
      tags: this.extractTags(mainQuestion),
      confidence: 0.8,
      frequency: group.frequency,
      variations,
      relatedQuestions: [],
      lastUpdated: new Date(),
      source: 'extracted',
    };
  }

  // Pattern extraction methods
  private async extractQuestionPatterns(conversations: any[]): Promise<ConversationPattern[]> {
    // Extract question patterns
    const patterns: ConversationPattern[] = [];

    const questionPatterns = new Map<
      string,
      {
        count: number;
        examples: any[];
        successRate: number;
      }
    >();

    for (const conversation of conversations) {
      const userMessages = conversation.messages.filter((m: any) => m.role === 'user');

      for (const message of userMessages) {
        const questionType = this.classifyQuestionType(message.content);

        if (!questionPatterns.has(questionType)) {
          questionPatterns.set(questionType, {
            count: 0,
            examples: [],
            successRate: 0.8,
          });
        }

        const pattern = questionPatterns.get(questionType)!;
        pattern.count++;
        pattern.examples.push({
          conversationId: conversation.id,
          snippet: message.content,
          outcome: 'resolved', // Simplified
        });
      }
    }

    // Convert to ConversationPattern objects
    for (const [patternType, data] of questionPatterns.entries()) {
      if (data.count >= 3) {
        patterns.push({
          id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          patternType: 'question_pattern',
          pattern: patternType,
          description: `Common ${patternType} questions`,
          frequency: data.count,
          successRate: data.successRate,
          contexts: ['general'],
          examples: data.examples.slice(0, 3),
          confidence: 0.8,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    return patterns;
  }

  private async extractResponsePatterns(conversations: any[]): Promise<ConversationPattern[]> {
    // Extract response patterns
    const patterns: ConversationPattern[] = [];

    // Simplified implementation
    return patterns;
  }

  private async extractFlowPatterns(conversations: any[]): Promise<ConversationPattern[]> {
    // Extract conversation flow patterns
    const patterns: ConversationPattern[] = [];

    // Simplified implementation
    return patterns;
  }

  private async extractBehaviorPatterns(conversations: any[]): Promise<ConversationPattern[]> {
    // Extract user behavior patterns
    const patterns: ConversationPattern[] = [];

    // Simplified implementation
    return patterns;
  }

  private async extractResolutionPatterns(conversations: any[]): Promise<ConversationPattern[]> {
    // Extract resolution patterns
    const patterns: ConversationPattern[] = [];

    // Simplified implementation
    return patterns;
  }

  private classifyQuestionType(content: string): string {
    // Classify question type
    const lowerContent = content.toLowerCase();

    if (lowerContent.startsWith('how')) return 'how_to';
    if (lowerContent.startsWith('what')) return 'definition';
    if (lowerContent.startsWith('why')) return 'explanation';
    if (lowerContent.startsWith('where')) return 'location';
    if (lowerContent.startsWith('when')) return 'timing';
    if (lowerContent.includes('problem') || lowerContent.includes('issue')) return 'problem';

    return 'general';
  }

  // Utility methods
  private generateIntentDescription(intent: string, data: any): string {
    return `Common user intent: ${intent}. Appears ${data.count} times in conversations.`;
  }

  private assessIntentDifficulty(intent: string, data: any): 'easy' | 'medium' | 'hard' | 'expert' {
    // Assess intent difficulty based on various factors
    const avgResolutionTime =
      data.resolutionTimes.reduce((sum: number, time: number) => sum + time, 0) /
      data.resolutionTimes.length;

    if (avgResolutionTime < 5) return 'easy';
    if (avgResolutionTime < 15) return 'medium';
    if (avgResolutionTime < 30) return 'hard';
    return 'expert';
  }

  private calculateResolutionTime(conversation: any, userMessage: any): number {
    // Calculate resolution time for a conversation
    const messages = conversation.messages;
    const userMessageIndex = messages.findIndex((m: any) => m.id === userMessage.id);

    if (userMessageIndex === -1) return 0;

    // Find the last message in the conversation
    const lastMessage = messages[messages.length - 1];

    if (!lastMessage) return 0;

    const startTime = new Date(userMessage.createdAt).getTime();
    const endTime = new Date(lastMessage.createdAt).getTime();

    return Math.round((endTime - startTime) / (1000 * 60)); // Return in minutes
  }

  /**
   * Get extracted knowledge for an agent
   */
  async getAgentKnowledge(agentId: string, knowledgeType?: string): Promise<ExtractedKnowledge[]> {
    try {
      // Retrieve knowledge from database
      // return await prisma.extractedKnowledge.findMany({ where: { agentId, knowledgeType } });
      return [];
    } catch (error) {
      console.error('Error getting agent knowledge:', error);
      return [];
    }
  }

  /**
   * Search extracted knowledge
   */
  async searchKnowledge(query: string, agentId?: string): Promise<ExtractedKnowledge[]> {
    try {
      // Search knowledge based on query
      // Implement semantic search or full-text search
      return [];
    } catch (error) {
      console.error('Error searching knowledge:', error);
      return [];
    }
  }
}
