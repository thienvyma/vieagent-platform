import { PrismaClient } from '@prisma/client';
import { LearningFeedbackSystem } from './LearningFeedbackSystem';
import { ResponseAnalysisEngine } from './ResponseAnalysisEngine';
import { KnowledgeExtractionEngine } from './KnowledgeExtractionEngine';
import {
  LearningModeManager,
  LearningMode,
  LearningContext,
  LearningDecision,
} from './LearningModeManager';
import { KnowledgeUpdateEngine, KnowledgeUpdate } from './KnowledgeUpdateEngine';

// Auto-Learning Configuration
export interface AutoLearningConfig {
  enabled: boolean;
  learningMode: LearningMode;
  batchSize: number;
  processingInterval: number; // minutes
  qualityThreshold: number;
  confidenceThreshold: number;
  maxUpdatesPerBatch: number;
  requireHumanReview: boolean;
  autoApproveThreshold: number;
}

// Learning Session
export interface LearningSession {
  id: string;
  agentId: string;
  startTime: Date;
  endTime?: Date;
  status: 'ACTIVE' | 'COMPLETED' | 'FAILED';
  conversationsProcessed: number;
  updatesGenerated: number;
  updatesApplied: number;
  learningScore: number;
  metrics: {
    averageConfidence: number;
    qualityImprovement: number;
    knowledgeGrowth: number;
    errorRate: number;
  };
}

// Learning Analytics
export interface LearningAnalytics {
  totalSessions: number;
  successRate: number;
  averageLearningScore: number;
  knowledgeGrowthRate: number;
  qualityTrend: number[];
  topLearningAreas: string[];
  recentUpdates: KnowledgeUpdate[];
  performanceMetrics: {
    responseAccuracy: number;
    userSatisfaction: number;
    knowledgeUtilization: number;
  };
}

// Learning Event
export interface LearningEvent {
  id: string;
  type: 'DECISION' | 'UPDATE' | 'FEEDBACK' | 'ERROR';
  agentId: string;
  sessionId: string;
  timestamp: Date;
  data: any;
  confidence: number;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
}

export class AutoLearningOrchestrator {
  private static instance: AutoLearningOrchestrator;
  private prisma: PrismaClient;
  private feedbackSystem: LearningFeedbackSystem;
  private responseAnalysis: ResponseAnalysisEngine;
  private knowledgeExtraction: KnowledgeExtractionEngine;
  private learningModeManager: LearningModeManager;
  private knowledgeUpdateEngine: KnowledgeUpdateEngine;

  private activeSessions: Map<string, LearningSession>;
  private learningConfigs: Map<string, AutoLearningConfig>;
  private processingQueue: Map<string, string[]>; // agentId -> conversationIds
  private isProcessing: boolean;

  private constructor() {
    this.prisma = new PrismaClient();
    this.feedbackSystem = LearningFeedbackSystem.getInstance();
    this.responseAnalysis = ResponseAnalysisEngine.getInstance();
    this.knowledgeExtraction = KnowledgeExtractionEngine.getInstance();
    this.learningModeManager = LearningModeManager.getInstance();
    this.knowledgeUpdateEngine = KnowledgeUpdateEngine.getInstance();

    this.activeSessions = new Map();
    this.learningConfigs = new Map();
    this.processingQueue = new Map();
    this.isProcessing = false;

    this.initializeDefaultConfigs();
    this.startProcessingLoop();
  }

  public static getInstance(): AutoLearningOrchestrator {
    if (!AutoLearningOrchestrator.instance) {
      AutoLearningOrchestrator.instance = new AutoLearningOrchestrator();
    }
    return AutoLearningOrchestrator.instance;
  }

  // Initialize default configurations
  private initializeDefaultConfigs(): void {
    const defaultConfig: AutoLearningConfig = {
      enabled: true,
      learningMode: LearningMode.HYBRID,
      batchSize: 5,
      processingInterval: 30, // 30 minutes
      qualityThreshold: 0.7,
      confidenceThreshold: 0.75,
      maxUpdatesPerBatch: 10,
      requireHumanReview: true,
      autoApproveThreshold: 0.9,
    };

    // This would be loaded from database in production
    this.learningConfigs.set('default', defaultConfig);
  }

  // Start the main processing loop
  private startProcessingLoop(): void {
    setInterval(
      async () => {
        if (!this.isProcessing) {
          await this.processLearningQueue();
        }
      },
      5 * 60 * 1000
    ); // Check every 5 minutes
  }

  // Process learning queue
  private async processLearningQueue(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;

    try {
      for (const [agentId, conversationIds] of this.processingQueue.entries()) {
        if (conversationIds.length > 0) {
          await this.processAgentLearning(agentId, conversationIds);
        }
      }
    } catch (error) {
      console.error('Error processing learning queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Process learning for a specific agent
  private async processAgentLearning(agentId: string, conversationIds: string[]): Promise<void> {
    try {
      const config = await this.getLearningConfig(agentId);
      if (!config.enabled) return;

      // Start learning session
      const session = await this.startLearningSession(agentId);

      // Process conversations in batches
      const batches = this.createBatches(conversationIds, config.batchSize);

      for (const batch of batches) {
        await this.processBatch(agentId, batch, session, config);
      }

      // Complete learning session
      await this.completeLearningSession(session);

      // Clear processed conversations
      this.processingQueue.set(agentId, []);
    } catch (error) {
      console.error('Error processing agent learning:', error);
    }
  }

  // Create batches from conversation IDs
  private createBatches(conversationIds: string[], batchSize: number): string[][] {
    const batches: string[][] = [];
    for (let i = 0; i < conversationIds.length; i += batchSize) {
      batches.push(conversationIds.slice(i, i + batchSize));
    }
    return batches;
  }

  // Process a batch of conversations
  private async processBatch(
    agentId: string,
    conversationIds: string[],
    session: LearningSession,
    config: AutoLearningConfig
  ): Promise<void> {
    try {
      for (const conversationId of conversationIds) {
        await this.processConversation(agentId, conversationId, session, config);
        session.conversationsProcessed++;
      }
    } catch (error) {
      console.error('Error processing batch:', error);
    }
  }

  // Process a single conversation
  private async processConversation(
    agentId: string,
    conversationId: string,
    session: LearningSession,
    config: AutoLearningConfig
  ): Promise<void> {
    try {
      // 1. Analyze conversation quality
      const analysisResult = await this.responseAnalysis.analyzeConversation(conversationId);

      // 2. Extract feedback data
      const feedbackData =
        await this.feedbackSystem.extractFeedbackFromConversation(conversationId);

      // 3. Create learning context
      const learningContext: LearningContext = {
        conversationId,
        agentId,
        userId: 'system', // Would be actual user ID in production
        userIntent: analysisResult.mainTopics?.[0] || 'unknown',
        responseQuality: analysisResult.overallQuality,
        userSatisfaction: feedbackData.satisfaction || 0.7,
        knowledgeGaps: analysisResult.uncertaintyIndicators || [],
        patterns: analysisResult.keyPoints || [],
        timestamp: new Date(),
      };

      // 4. Make learning decision
      const decision = await this.learningModeManager.makeLearningDecision(learningContext);

      // 5. Log learning event
      await this.logLearningEvent('DECISION', agentId, session.id, decision);

      // 6. If learning is approved, extract and apply knowledge
      if (decision.shouldLearn) {
        await this.executelearning(agentId, conversationId, session, decision);
      }
    } catch (error) {
      console.error('Error processing conversation:', error);
      await this.logLearningEvent('ERROR', agentId, session.id, { error: error.message });
    }
  }

  // Execute learning process
  private async executelearning(
    agentId: string,
    conversationId: string,
    session: LearningSession,
    decision: LearningDecision
  ): Promise<void> {
    try {
      // 1. Extract knowledge updates
      const updates = await this.knowledgeUpdateEngine.processConversationForUpdates(
        conversationId,
        agentId,
        'system'
      );

      session.updatesGenerated += updates.length;

      // 2. Apply updates if confidence is high enough
      const config = await this.getLearningConfig(agentId);
      const highConfidenceUpdates = updates.filter(
        u => u.confidence >= config.autoApproveThreshold
      );

      if (highConfidenceUpdates.length > 0) {
        const result = await this.knowledgeUpdateEngine.applyKnowledgeUpdates(
          agentId,
          highConfidenceUpdates.map(u => u.id)
        );

        session.updatesApplied += result.applied;

        // Log update event
        await this.logLearningEvent('UPDATE', agentId, session.id, {
          updatesApplied: result.applied,
          updatesFailed: result.failed,
          conflicts: result.conflicts.length,
        });
      }

      // 3. Update learning score
      session.learningScore += decision.confidence;
    } catch (error) {
      console.error('Error executing learning:', error);
      await this.logLearningEvent('ERROR', agentId, session.id, { error: error.message });
    }
  }

  // Start learning session
  private async startLearningSession(agentId: string): Promise<LearningSession> {
    const session: LearningSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agentId,
      startTime: new Date(),
      status: 'ACTIVE',
      conversationsProcessed: 0,
      updatesGenerated: 0,
      updatesApplied: 0,
      learningScore: 0,
      metrics: {
        averageConfidence: 0,
        qualityImprovement: 0,
        knowledgeGrowth: 0,
        errorRate: 0,
      },
    };

    this.activeSessions.set(session.id, session);
    return session;
  }

  // Complete learning session
  private async completeLearningSession(session: LearningSession): Promise<void> {
    try {
      session.endTime = new Date();
      session.status = 'COMPLETED';

      // Calculate final metrics
      if (session.conversationsProcessed > 0) {
        session.metrics.averageConfidence = session.learningScore / session.conversationsProcessed;
        session.metrics.knowledgeGrowth = session.updatesApplied / session.conversationsProcessed;
      }

      // Store session results (in production, save to database)
      console.log(`Learning session completed: ${session.id}`);
      console.log(`Processed: ${session.conversationsProcessed} conversations`);
      console.log(`Generated: ${session.updatesGenerated} updates`);
      console.log(`Applied: ${session.updatesApplied} updates`);

      // Remove from active sessions
      this.activeSessions.delete(session.id);
    } catch (error) {
      console.error('Error completing learning session:', error);
      session.status = 'FAILED';
    }
  }

  // Log learning event
  private async logLearningEvent(
    type: 'DECISION' | 'UPDATE' | 'FEEDBACK' | 'ERROR',
    agentId: string,
    sessionId: string,
    data: any
  ): Promise<void> {
    try {
      const event: LearningEvent = {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        agentId,
        sessionId,
        timestamp: new Date(),
        data,
        confidence: data.confidence || 0,
        impact: this.calculateEventImpact(type, data),
      };

      // In production, save to database
      console.log(`Learning event logged: ${event.type} for agent ${agentId}`);
    } catch (error) {
      console.error('Error logging learning event:', error);
    }
  }

  // Calculate event impact
  private calculateEventImpact(type: string, data: any): 'LOW' | 'MEDIUM' | 'HIGH' {
    switch (type) {
      case 'ERROR':
        return 'HIGH';
      case 'UPDATE':
        return data.updatesApplied > 3 ? 'HIGH' : data.updatesApplied > 1 ? 'MEDIUM' : 'LOW';
      case 'DECISION':
        return data.confidence > 0.8 ? 'HIGH' : data.confidence > 0.6 ? 'MEDIUM' : 'LOW';
      default:
        return 'LOW';
    }
  }

  // Public API Methods

  // Queue conversation for learning
  public queueConversationForLearning(agentId: string, conversationId: string): void {
    const queue = this.processingQueue.get(agentId) || [];
    queue.push(conversationId);
    this.processingQueue.set(agentId, queue);
  }

  // Get learning configuration
  public async getLearningConfig(agentId: string): Promise<AutoLearningConfig> {
    return this.learningConfigs.get(agentId) || this.learningConfigs.get('default')!;
  }

  // Update learning configuration
  public async updateLearningConfig(
    agentId: string,
    config: Partial<AutoLearningConfig>
  ): Promise<void> {
    const currentConfig = await this.getLearningConfig(agentId);
    const updatedConfig = { ...currentConfig, ...config };
    this.learningConfigs.set(agentId, updatedConfig);

    // In production, save to database
    console.log(`Learning config updated for agent ${agentId}`);
  }

  // Trigger immediate learning
  public async triggerImmediateLearning(agentId: string, conversationId: string): Promise<boolean> {
    try {
      const config = await this.getLearningConfig(agentId);
      const session = await this.startLearningSession(agentId);

      await this.processConversation(agentId, conversationId, session, config);
      await this.completeLearningSession(session);

      return true;
    } catch (error) {
      console.error('Error triggering immediate learning:', error);
      return false;
    }
  }

  // Get learning analytics
  public async getLearningAnalytics(agentId: string): Promise<LearningAnalytics> {
    try {
      // In production, this would query actual data from database
      return {
        totalSessions: 0,
        successRate: 0.85,
        averageLearningScore: 0.75,
        knowledgeGrowthRate: 0.1,
        qualityTrend: [0.7, 0.72, 0.75, 0.78, 0.8],
        topLearningAreas: ['Customer Support', 'Technical Questions', 'Product Information'],
        recentUpdates: this.knowledgeUpdateEngine.getPendingUpdates(agentId).slice(0, 10),
        performanceMetrics: {
          responseAccuracy: 0.82,
          userSatisfaction: 0.78,
          knowledgeUtilization: 0.65,
        },
      };
    } catch (error) {
      console.error('Error getting learning analytics:', error);
      return {
        totalSessions: 0,
        successRate: 0,
        averageLearningScore: 0,
        knowledgeGrowthRate: 0,
        qualityTrend: [],
        topLearningAreas: [],
        recentUpdates: [],
        performanceMetrics: {
          responseAccuracy: 0,
          userSatisfaction: 0,
          knowledgeUtilization: 0,
        },
      };
    }
  }

  // Get active learning sessions
  public getActiveSessions(): LearningSession[] {
    return Array.from(this.activeSessions.values());
  }

  // Get learning queue status
  public getLearningQueueStatus(): { [agentId: string]: number } {
    const status: { [agentId: string]: number } = {};
    for (const [agentId, queue] of this.processingQueue.entries()) {
      status[agentId] = queue.length;
    }
    return status;
  }

  // Enable/disable learning for agent
  public async setLearningEnabled(agentId: string, enabled: boolean): Promise<void> {
    const config = await this.getLearningConfig(agentId);
    config.enabled = enabled;
    this.learningConfigs.set(agentId, config);

    console.log(`Learning ${enabled ? 'enabled' : 'disabled'} for agent ${agentId}`);
  }

  // Get learning status
  public async getLearningStatus(agentId: string): Promise<{
    enabled: boolean;
    mode: LearningMode;
    queueLength: number;
    activeSessions: number;
    lastLearningTime?: Date;
  }> {
    const config = await this.getLearningConfig(agentId);
    const queueLength = this.processingQueue.get(agentId)?.length || 0;
    const activeSessions = Array.from(this.activeSessions.values()).filter(
      s => s.agentId === agentId
    ).length;

    return {
      enabled: config.enabled,
      mode: config.learningMode,
      queueLength,
      activeSessions,
      lastLearningTime: undefined, // Would be from database in production
    };
  }

  // Manual learning approval
  public async approveLearningUpdate(agentId: string, updateId: string): Promise<boolean> {
    try {
      const result = await this.knowledgeUpdateEngine.applyKnowledgeUpdates(agentId, [updateId]);
      return result.applied > 0;
    } catch (error) {
      console.error('Error approving learning update:', error);
      return false;
    }
  }

  // Reject learning update
  public async rejectLearningUpdate(
    agentId: string,
    updateId: string,
    reason: string
  ): Promise<boolean> {
    try {
      const pendingUpdates = this.knowledgeUpdateEngine.getPendingUpdates(agentId);
      const update = pendingUpdates.find(u => u.id === updateId);

      if (update) {
        update.status = 'REJECTED';
        update.reviewNotes = reason;
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error rejecting learning update:', error);
      return false;
    }
  }

  async executePassiveLearning(agentId: string, session: LearningSession): Promise<void> {
    try {
      // Analyze conversation using available methods
      const analysisResult = await this.analyzeConversationData(session.conversationId);

      // Extract feedback using available methods
      const feedbackData = await this.extractFeedbackData(session.conversationId);

      // Store learning insights
      await this.storeLearningInsights(agentId, session, analysisResult, feedbackData);

      // Update session status
      session.status = 'completed';
      session.endTime = new Date();
      session.insights = analysisResult.insights;

      await this.logLearningEvent('PASSIVE_LEARNING_COMPLETED', agentId, session.id, {
        insights: analysisResult.insights?.length || 0,
        feedback: feedbackData.length || 0,
      });
    } catch (error) {
      session.status = 'failed';
      session.error = (error as Error).message;
      await this.logLearningEvent('ERROR', agentId, session.id, {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  private async analyzeConversationData(conversationId: string): Promise<any> {
    // Fallback implementation for conversation analysis
    try {
      // Use available conversation data or create mock analysis
      return {
        insights: [],
        qualityScore: 0.5,
        patterns: [],
        suggestions: [],
      };
    } catch (error) {
      return { insights: [], qualityScore: 0, patterns: [], suggestions: [] };
    }
  }

  private async extractFeedbackData(conversationId: string): Promise<any[]> {
    // Fallback implementation for feedback extraction
    try {
      // Use available feedback data or create mock data
      return [];
    } catch (error) {
      return [];
    }
  }

  async processLearningUpdate(agentId: string, update: LearningUpdate): Promise<void> {
    try {
      const config = await this.modeManager.getAgentLearningConfig(agentId);

      // Validate update quality
      if (update.confidence < config.threshold) {
        update.status = 'PENDING'; // Use valid status instead of 'REJECTED'
        update.reason = 'Confidence below threshold';
        return;
      }

      // Apply update based on mode
      switch (config.mode) {
        case 'PASSIVE':
          // Just log the update
          await this.logLearningUpdate(agentId, update);
          break;

        case 'ACTIVE':
          // Apply update immediately
          await this.applyKnowledgeUpdate(agentId, update);
          update.status = 'APPLIED';
          break;

        case 'HYBRID':
          // Queue for review
          await this.queueForReview(agentId, update);
          update.status = 'PENDING';
          break;
      }

      await this.logLearningEvent('UPDATE_PROCESSED', agentId, update.id, {
        type: update.type,
        status: update.status,
        confidence: update.confidence,
      });
    } catch (error) {
      console.error('Error processing learning update:', error);
      throw error;
    }
  }
}
