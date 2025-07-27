/**
 * 🧠 Smart Knowledge Strategy Service - DAY 23
 * Handles the 3 document strategy modes: Auto, Selective, Priority
 */

import { prisma } from '@/lib/prisma';

export type KnowledgeStrategy = 'AUTO' | 'SELECTIVE' | 'PRIORITY';

export interface StrategyConfig {
  strategy: KnowledgeStrategy;
  config: {
    // Auto strategy settings
    autoFallbackEnabled?: boolean;
    autoRelevanceThreshold?: number;
    autoMaxDocuments?: number;

    // Selective strategy settings
    selectedDocumentIds?: string[];
    enableDynamicSelection?: boolean;

    // Priority strategy settings
    priorityWeights?: Record<string, number>;
    priorityThreshold?: number;
    enableWeightDecay?: boolean;
  };
}

export interface DocumentCandidate {
  id: string;
  title: string;
  filename: string;
  type: string;
  content?: string;
  extractedText?: string;
  metadata?: any;
  relevanceScore?: number;
  priorityWeight?: number;
  finalScore?: number;
  reason?: string;
}

export interface StrategyResult {
  strategy: KnowledgeStrategy;
  selectedDocuments: DocumentCandidate[];
  totalCandidates: number;
  executionTime: number;
  metadata: {
    appliedFilters: string[];
    fallbackUsed?: boolean;
    averageRelevance?: number;
    totalWeight?: number;
  };
}

export class SmartKnowledgeStrategy {
  private static instance: SmartKnowledgeStrategy;

  public static getInstance(): SmartKnowledgeStrategy {
    if (!SmartKnowledgeStrategy.instance) {
      SmartKnowledgeStrategy.instance = new SmartKnowledgeStrategy();
    }
    return SmartKnowledgeStrategy.instance;
  }

  /**
   * Execute knowledge strategy for agent
   */
  async executeStrategy(
    agentId: string,
    userId: string,
    query: string,
    strategyConfig: StrategyConfig
  ): Promise<StrategyResult> {
    const startTime = Date.now();

    console.log(`🧠 Executing ${strategyConfig.strategy} strategy for agent ${agentId}`);

    try {
      // Get agent and available documents
      const agent = await prisma.agent.findFirst({
        where: { id: agentId, userId },
      });

      if (!agent) {
        throw new Error('Agent not found');
      }

      // Get available knowledge documents
      const availableDocuments = await this.getAvailableDocuments(userId, agent.knowledgeFiles);

      let result: StrategyResult;

      switch (strategyConfig.strategy) {
        case 'AUTO':
          result = await this.executeAutoStrategy(availableDocuments, query, strategyConfig.config);
          break;
        case 'SELECTIVE':
          result = await this.executeSelectiveStrategy(
            availableDocuments,
            query,
            strategyConfig.config
          );
          break;
        case 'PRIORITY':
          result = await this.executePriorityStrategy(
            availableDocuments,
            query,
            strategyConfig.config
          );
          break;
        default:
          throw new Error(`Unknown strategy: ${strategyConfig.strategy}`);
      }

      result.executionTime = Date.now() - startTime;

      console.log(
        `✅ Strategy executed: ${result.selectedDocuments.length}/${result.totalCandidates} documents selected`
      );

      return result;
    } catch (error) {
      console.error('❌ Strategy execution failed:', error);
      throw error;
    }
  }

  /**
   * Get available documents for strategy
   */
  private async getAvailableDocuments(
    userId: string,
    knowledgeFiles: string | null
  ): Promise<DocumentCandidate[]> {
    let documentIds: string[] = [];

    if (knowledgeFiles) {
      try {
        documentIds = JSON.parse(knowledgeFiles);
      } catch (error) {
        console.error('Error parsing knowledge files:', error);
        documentIds = [];
      }
    }

    // Get documents from both legacy Document table and new Knowledge table
    const [legacyDocuments, knowledgeDocuments] = await Promise.all([
      // Legacy documents
      documentIds.length > 0
        ? prisma.document.findMany({
            where: {
              id: { in: documentIds },
              userId,
              status: 'PROCESSED',
            },
          })
        : [],

      // New knowledge documents
      prisma.knowledge.findMany({
        where: {
          userId,
          status: 'COMPLETED',
          isDeleted: false,
        },
      }),
    ]);

    // Transform to DocumentCandidate format
    const candidates: DocumentCandidate[] = [];

    // Add legacy documents
    legacyDocuments.forEach(doc => {
      candidates.push({
        id: doc.id,
        title: doc.title,
        filename: doc.filename,
        type: doc.type,
        content: doc.content || undefined,
        extractedText: doc.extractedText || undefined,
        metadata: doc.metadata ? JSON.parse(doc.metadata) : undefined,
      });
    });

    // Add knowledge documents
    knowledgeDocuments.forEach(doc => {
      candidates.push({
        id: doc.id,
        title: doc.title,
        filename: doc.filename,
        type: doc.type,
        content: doc.content || undefined,
        extractedText: doc.extractedText || undefined,
        metadata: doc.metadata ? JSON.parse(doc.metadata) : undefined,
      });
    });

    return candidates;
  }

  /**
   * Execute AUTO strategy - intelligent document selection
   */
  private async executeAutoStrategy(
    documents: DocumentCandidate[],
    query: string,
    config: any
  ): Promise<StrategyResult> {
    const relevanceThreshold = config.autoRelevanceThreshold || 0.7;
    const maxDocuments = config.autoMaxDocuments || 5;
    const fallbackEnabled = config.autoFallbackEnabled !== false;

    // Calculate relevance scores
    const scoredDocuments = documents.map(doc => {
      const relevanceScore = this.calculateRelevanceScore(doc, query);
      return {
        ...doc,
        relevanceScore,
        finalScore: relevanceScore,
        reason: `Relevance: ${relevanceScore.toFixed(2)}`,
      };
    });

    // Sort by relevance
    scoredDocuments.sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));

    // Filter by threshold
    let selectedDocuments = scoredDocuments.filter(
      doc => (doc.relevanceScore || 0) >= relevanceThreshold
    );

    // Apply fallback if needed
    let fallbackUsed = false;
    if (selectedDocuments.length === 0 && fallbackEnabled) {
      // Use top documents even if below threshold
      selectedDocuments = scoredDocuments.slice(0, Math.min(maxDocuments, scoredDocuments.length));
      fallbackUsed = true;
    }

    // Limit to max documents
    selectedDocuments = selectedDocuments.slice(0, maxDocuments);

    const averageRelevance =
      selectedDocuments.length > 0
        ? selectedDocuments.reduce((sum, doc) => sum + (doc.relevanceScore || 0), 0) /
          selectedDocuments.length
        : 0;

    return {
      strategy: 'AUTO',
      selectedDocuments,
      totalCandidates: documents.length,
      executionTime: 0, // Will be set by caller
      metadata: {
        appliedFilters: ['relevance_threshold', 'max_documents'],
        fallbackUsed,
        averageRelevance,
      },
    };
  }

  /**
   * Execute SELECTIVE strategy - manual document selection
   */
  private async executeSelectiveStrategy(
    documents: DocumentCandidate[],
    query: string,
    config: any
  ): Promise<StrategyResult> {
    const selectedIds = config.selectedDocumentIds || [];
    const enableDynamicSelection = config.enableDynamicSelection || false;

    // Get manually selected documents
    let selectedDocuments = documents.filter(doc => selectedIds.includes(doc.id));

    // Calculate relevance scores for selected documents
    selectedDocuments = selectedDocuments.map(doc => {
      const relevanceScore = this.calculateRelevanceScore(doc, query);
      return {
        ...doc,
        relevanceScore,
        finalScore: relevanceScore,
        reason: `Manually selected, Relevance: ${relevanceScore.toFixed(2)}`,
      };
    });

    // Apply dynamic selection if enabled
    if (enableDynamicSelection && selectedDocuments.length < 3) {
      const remainingDocuments = documents.filter(doc => !selectedIds.includes(doc.id));
      const dynamicCandidates = remainingDocuments.map(doc => {
        const relevanceScore = this.calculateRelevanceScore(doc, query);
        return {
          ...doc,
          relevanceScore,
          finalScore: relevanceScore,
          reason: `Dynamic selection, Relevance: ${relevanceScore.toFixed(2)}`,
        };
      });

      // Add top dynamic candidates
      dynamicCandidates.sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));
      const additionalCount = Math.min(3 - selectedDocuments.length, dynamicCandidates.length);
      selectedDocuments.push(...dynamicCandidates.slice(0, additionalCount));
    }

    // Sort by relevance
    selectedDocuments.sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));

    const averageRelevance =
      selectedDocuments.length > 0
        ? selectedDocuments.reduce((sum, doc) => sum + (doc.relevanceScore || 0), 0) /
          selectedDocuments.length
        : 0;

    return {
      strategy: 'SELECTIVE',
      selectedDocuments,
      totalCandidates: documents.length,
      executionTime: 0, // Will be set by caller
      metadata: {
        appliedFilters: [
          'manual_selection',
          enableDynamicSelection ? 'dynamic_selection' : '',
        ].filter(Boolean),
        averageRelevance,
      },
    };
  }

  /**
   * Execute PRIORITY strategy - weighted document selection
   */
  private async executePriorityStrategy(
    documents: DocumentCandidate[],
    query: string,
    config: any
  ): Promise<StrategyResult> {
    const priorityWeights = config.priorityWeights || {};
    const priorityThreshold = config.priorityThreshold || 0.5;
    const enableWeightDecay = config.enableWeightDecay || false;

    // Calculate weighted scores
    const scoredDocuments = documents.map(doc => {
      const relevanceScore = this.calculateRelevanceScore(doc, query);
      let priorityWeight = priorityWeights[doc.id] || 1.0;

      // Apply weight decay if enabled
      if (enableWeightDecay) {
        // Simple time-based decay (this could be more sophisticated)
        const ageInDays = Math.floor((Date.now() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        const decayFactor = Math.max(0.5, 1 - ageInDays * 0.01); // 1% decay per day, minimum 0.5
        priorityWeight *= decayFactor;
      }

      const finalScore = relevanceScore * priorityWeight;

      return {
        ...doc,
        relevanceScore,
        priorityWeight,
        finalScore,
        reason: `Relevance: ${relevanceScore.toFixed(2)}, Weight: ${priorityWeight.toFixed(2)}, Final: ${finalScore.toFixed(2)}`,
      };
    });

    // Sort by weighted score
    scoredDocuments.sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));

    // Filter by threshold
    const selectedDocuments = scoredDocuments.filter(
      doc => (doc.finalScore || 0) >= priorityThreshold
    );

    const averageRelevance =
      selectedDocuments.length > 0
        ? selectedDocuments.reduce((sum, doc) => sum + (doc.relevanceScore || 0), 0) /
          selectedDocuments.length
        : 0;

    const totalWeight = selectedDocuments.reduce((sum, doc) => sum + (doc.priorityWeight || 0), 0);

    return {
      strategy: 'PRIORITY',
      selectedDocuments,
      totalCandidates: documents.length,
      executionTime: 0, // Will be set by caller
      metadata: {
        appliedFilters: [
          'priority_weights',
          'priority_threshold',
          enableWeightDecay ? 'weight_decay' : '',
        ].filter(Boolean),
        averageRelevance,
        totalWeight,
      },
    };
  }

  /**
   * Calculate relevance score between document and query
   */
  private calculateRelevanceScore(document: DocumentCandidate, query: string): number {
    const queryWords = query
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2);
    const documentText = [
      document.title,
      document.filename,
      document.content || '',
      document.extractedText || '',
    ]
      .join(' ')
      .toLowerCase();

    if (queryWords.length === 0) return 0.5; // Default score for empty query

    // Simple TF-IDF-like scoring
    let score = 0;
    const totalWords = queryWords.length;

    queryWords.forEach(word => {
      const wordCount = (documentText.match(new RegExp(word, 'g')) || []).length;
      if (wordCount > 0) {
        // Boost score for title matches
        const titleBoost = document.title.toLowerCase().includes(word) ? 0.3 : 0;
        // Boost score for filename matches
        const filenameBoost = document.filename.toLowerCase().includes(word) ? 0.2 : 0;
        // Base content score
        const contentScore = Math.min(wordCount * 0.1, 0.5); // Cap at 0.5 per word

        score += contentScore + titleBoost + filenameBoost;
      }
    });

    // Normalize score
    const normalizedScore = Math.min(score / totalWords, 1.0);

    // Add small boost for document type relevance
    const typeBoost = this.getTypeRelevanceBoost(document.type, query);

    return Math.min(normalizedScore + typeBoost, 1.0);
  }

  /**
   * Get relevance boost based on document type
   */
  private getTypeRelevanceBoost(docType: string, query: string): number {
    const typeBoosts: Record<string, number> = {
      faq: query.includes('?') ? 0.1 : 0.05,
      product: query.toLowerCase().includes('product') ? 0.1 : 0.05,
      business:
        query.toLowerCase().includes('company') || query.toLowerCase().includes('business')
          ? 0.1
          : 0.05,
      csv: 0.05,
      json: 0.05,
      text: 0.05,
      pdf: 0.05,
    };

    return typeBoosts[docType.toLowerCase()] || 0;
  }

  /**
   * Build context from selected documents
   */
  buildContextFromDocuments(documents: DocumentCandidate[]): string {
    if (documents.length === 0) return '';

    let context = '';

    documents.forEach((doc, index) => {
      context += `\n\n=== Document ${index + 1}: ${doc.title} ===\n`;
      context += `Source: ${doc.filename} (${doc.type})\n`;
      context += `Relevance: ${doc.relevanceScore?.toFixed(2) || 'N/A'}\n`;
      if (doc.priorityWeight) {
        context += `Priority Weight: ${doc.priorityWeight.toFixed(2)}\n`;
      }
      context += `\n`;

      // Add document content
      const content = doc.extractedText || doc.content || '';
      if (content) {
        // Limit content length to avoid overwhelming the context
        const maxLength = 1000;
        const truncatedContent =
          content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
        context += truncatedContent;
      }
    });

    return context.trim();
  }

  /**
   * Get strategy configuration from agent
   */
  static parseStrategyConfig(agent: any): StrategyConfig {
    const strategy = agent.knowledgeStrategy || 'AUTO';

    let config = {};
    try {
      config = JSON.parse(agent.knowledgeStrategyConfig || '{}');
    } catch (error) {
      console.error('Error parsing strategy config:', error);
    }

    // Merge with priority weights if available
    if (strategy === 'PRIORITY' && agent.knowledgeFilePriorities) {
      try {
        const priorityWeights = JSON.parse(agent.knowledgeFilePriorities);
        config = { ...config, priorityWeights };
      } catch (error) {
        console.error('Error parsing priority weights:', error);
      }
    }

    return { strategy: strategy as KnowledgeStrategy, config };
  }
}
