import { PrismaClient } from '@prisma/client';

// Learning Mode Types
export enum LearningMode {
  PASSIVE = 'PASSIVE', // Observation only, no automatic updates
  ACTIVE = 'ACTIVE', // Automatic knowledge updates
  HYBRID = 'HYBRID', // Confidence-based decision making
}

export enum LearningTrigger {
  MANUAL = 'MANUAL',
  SCHEDULED = 'SCHEDULED',
  THRESHOLD = 'THRESHOLD',
  PATTERN = 'PATTERN',
}

export interface LearningConfiguration {
  mode: LearningMode;
  confidenceThreshold: number;
  autoUpdateEnabled: boolean;
  reviewRequired: boolean;
  triggerTypes: LearningTrigger[];
  batchSize: number;
  updateFrequency: number; // hours
  qualityThreshold: number;
  userApprovalRequired: boolean;
}

export interface LearningDecision {
  shouldLearn: boolean;
  confidence: number;
  reason: string;
  suggestedAction: string;
  requiresReview: boolean;
  learningType: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface LearningContext {
  conversationId: string;
  agentId: string;
  userId: string;
  userIntent: string;
  responseQuality: number;
  userSatisfaction: number;
  knowledgeGaps: string[];
  patterns: string[];
  timestamp: Date;
}

export interface LearningRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  priority: number;
  enabled: boolean;
  successRate: number;
  lastUsed: Date;
}

export class LearningModeManager {
  private static instance: LearningModeManager;
  private prisma: PrismaClient;
  private defaultConfig: LearningConfiguration;
  private learningRules: Map<string, LearningRule>;

  private constructor() {
    this.prisma = new PrismaClient();
    this.defaultConfig = {
      mode: LearningMode.HYBRID,
      confidenceThreshold: 0.75,
      autoUpdateEnabled: true,
      reviewRequired: true,
      triggerTypes: [LearningTrigger.THRESHOLD, LearningTrigger.PATTERN],
      batchSize: 10,
      updateFrequency: 24,
      qualityThreshold: 0.8,
      userApprovalRequired: false,
    };
    this.learningRules = new Map();
    this.initializeLearningRules();
  }

  public static getInstance(): LearningModeManager {
    if (!LearningModeManager.instance) {
      LearningModeManager.instance = new LearningModeManager();
    }
    return LearningModeManager.instance;
  }

  // Initialize default learning rules
  private initializeLearningRules(): void {
    const defaultRules: LearningRule[] = [
      {
        id: 'high_quality_response',
        name: 'High Quality Response Learning',
        condition: 'responseQuality > 0.9 && userSatisfaction > 0.8',
        action: 'EXTRACT_KNOWLEDGE',
        priority: 1,
        enabled: true,
        successRate: 0.85,
        lastUsed: new Date(),
      },
      {
        id: 'knowledge_gap_detection',
        name: 'Knowledge Gap Detection',
        condition: 'knowledgeGaps.length > 0 && responseQuality < 0.6',
        action: 'IDENTIFY_LEARNING_NEED',
        priority: 2,
        enabled: true,
        successRate: 0.78,
        lastUsed: new Date(),
      },
      {
        id: 'pattern_recognition',
        name: 'Pattern Recognition Learning',
        condition: 'patterns.length > 2 && confidence > 0.8',
        action: 'UPDATE_PATTERNS',
        priority: 3,
        enabled: true,
        successRate: 0.82,
        lastUsed: new Date(),
      },
      {
        id: 'user_correction',
        name: 'User Correction Learning',
        condition: 'userFeedback.type === "CORRECTION"',
        action: 'IMMEDIATE_LEARN',
        priority: 1,
        enabled: true,
        successRate: 0.95,
        lastUsed: new Date(),
      },
    ];

    defaultRules.forEach(rule => {
      this.learningRules.set(rule.id, rule);
    });
  }

  // Get learning configuration for agent
  public async getLearningConfiguration(agentId: string): Promise<LearningConfiguration> {
    try {
      const agent = await this.prisma.agent.findUnique({
        where: { id: agentId },
        select: {
          learningMode: true, // Use learningMode instead of autoLearningMode
          enableAutoLearning: true, // Use enableAutoLearning instead of autoUpdateKnowledge
          learningThreshold: true,
          learningBatchSize: true,
          learningFrequency: true,
        },
      });

      if (!agent) {
        throw new Error(`Agent ${agentId} not found`);
      }

      return {
        mode: (agent.learningMode as LearningMode) || this.defaultConfig.mode,
        confidenceThreshold: agent.learningThreshold || this.defaultConfig.confidenceThreshold,
        autoUpdateEnabled: agent.enableAutoLearning || this.defaultConfig.autoUpdateEnabled,
        reviewRequired: this.defaultConfig.reviewRequired,
        triggerTypes: this.defaultConfig.triggerTypes,
        batchSize: agent.learningBatchSize || this.defaultConfig.batchSize,
        updateFrequency: (agent.learningFrequency as number) || this.defaultConfig.updateFrequency, // Assuming frequency is a number
        qualityThreshold: this.defaultConfig.qualityThreshold,
        userApprovalRequired: this.defaultConfig.userApprovalRequired,
      };
    } catch (error) {
      console.error('Error getting agent learning config:', error);
      return this.defaultConfig;
    }
  }

  // Make learning decision based on context and mode
  public async makeLearningDecision(
    context: LearningContext,
    config?: LearningConfiguration
  ): Promise<LearningDecision> {
    try {
      const learningConfig = config || (await this.getLearningConfiguration(context.agentId));

      // Apply learning rules
      const applicableRules = this.findApplicableRules(context);
      const ruleBasedDecision = this.evaluateRules(applicableRules, context);

      // Mode-specific decision making
      switch (learningConfig.mode) {
        case LearningMode.PASSIVE:
          return this.makePassiveDecision(context, ruleBasedDecision);

        case LearningMode.ACTIVE:
          return this.makeActiveDecision(context, learningConfig, ruleBasedDecision);

        case LearningMode.HYBRID:
          return this.makeHybridDecision(context, learningConfig, ruleBasedDecision);

        default:
          return this.makePassiveDecision(context, ruleBasedDecision);
      }
    } catch (error) {
      console.error('Error making learning decision:', error);
      return {
        shouldLearn: false,
        confidence: 0,
        reason: 'Error in decision making',
        suggestedAction: 'MANUAL_REVIEW',
        requiresReview: true,
        learningType: 'ERROR',
        riskLevel: 'HIGH',
      };
    }
  }

  // Find applicable learning rules
  private findApplicableRules(context: LearningContext): LearningRule[] {
    const applicable: LearningRule[] = [];

    for (const rule of this.learningRules.values()) {
      if (rule.enabled && this.evaluateRuleCondition(rule.condition, context)) {
        applicable.push(rule);
      }
    }

    return applicable.sort((a, b) => a.priority - b.priority);
  }

  // Evaluate rule condition
  private evaluateRuleCondition(condition: string, context: LearningContext): boolean {
    try {
      // Simple condition evaluation (in production, use a proper expression evaluator)
      const responseQuality = context.responseQuality;
      const userSatisfaction = context.userSatisfaction;
      const knowledgeGaps = context.knowledgeGaps;
      const patterns = context.patterns;
      const confidence = Math.min(responseQuality, userSatisfaction);

      // Replace variables in condition
      const evalCondition = condition
        .replace(/responseQuality/g, responseQuality.toString())
        .replace(/userSatisfaction/g, userSatisfaction.toString())
        .replace(/knowledgeGaps\.length/g, knowledgeGaps.length.toString())
        .replace(/patterns\.length/g, patterns.length.toString())
        .replace(/confidence/g, confidence.toString());

      // Simple evaluation (in production, use safer evaluation)
      return eval(evalCondition);
    } catch (error) {
      console.error('Error evaluating rule condition:', error);
      return false;
    }
  }

  // Evaluate applicable rules
  private evaluateRules(
    rules: LearningRule[],
    context: LearningContext
  ): Partial<LearningDecision> {
    if (rules.length === 0) {
      return {
        shouldLearn: false,
        confidence: 0,
        reason: 'No applicable rules',
        suggestedAction: 'OBSERVE',
      };
    }

    const topRule = rules[0];
    const confidence = Math.min(
      context.responseQuality,
      context.userSatisfaction,
      topRule.successRate
    );

    return {
      shouldLearn: confidence > 0.7,
      confidence,
      reason: `Rule: ${topRule.name}`,
      suggestedAction: topRule.action,
    };
  }

  // Passive learning decision
  private makePassiveDecision(
    context: LearningContext,
    ruleDecision: Partial<LearningDecision>
  ): LearningDecision {
    return {
      shouldLearn: false,
      confidence: ruleDecision.confidence || 0,
      reason: 'Passive mode - observation only',
      suggestedAction: 'OBSERVE',
      requiresReview: true,
      learningType: 'PASSIVE_OBSERVATION',
      riskLevel: 'LOW',
    };
  }

  // Active learning decision
  private makeActiveDecision(
    context: LearningContext,
    config: LearningConfiguration,
    ruleDecision: Partial<LearningDecision>
  ): LearningDecision {
    const confidence = ruleDecision.confidence || 0;
    const shouldLearn = confidence > config.confidenceThreshold;

    return {
      shouldLearn,
      confidence,
      reason: shouldLearn ? 'High confidence active learning' : 'Below confidence threshold',
      suggestedAction: shouldLearn ? ruleDecision.suggestedAction || 'AUTO_UPDATE' : 'OBSERVE',
      requiresReview: !shouldLearn || config.reviewRequired,
      learningType: 'ACTIVE_LEARNING',
      riskLevel: confidence > 0.9 ? 'LOW' : confidence > 0.7 ? 'MEDIUM' : 'HIGH',
    };
  }

  // Hybrid learning decision
  private makeHybridDecision(
    context: LearningContext,
    config: LearningConfiguration,
    ruleDecision: Partial<LearningDecision>
  ): LearningDecision {
    const confidence = ruleDecision.confidence || 0;
    const qualityScore = (context.responseQuality + context.userSatisfaction) / 2;

    // Hybrid logic: high confidence + high quality = active, otherwise passive
    const shouldLearn =
      confidence > config.confidenceThreshold && qualityScore > config.qualityThreshold;
    const requiresReview = !shouldLearn || confidence < 0.9;

    return {
      shouldLearn,
      confidence,
      reason: shouldLearn
        ? 'Hybrid mode - high confidence learning'
        : 'Hybrid mode - insufficient confidence',
      suggestedAction: shouldLearn
        ? ruleDecision.suggestedAction || 'CONDITIONAL_UPDATE'
        : 'OBSERVE',
      requiresReview,
      learningType: 'HYBRID_LEARNING',
      riskLevel: confidence > 0.9 ? 'LOW' : confidence > 0.7 ? 'MEDIUM' : 'HIGH',
    };
  }

  // Update learning configuration
  public async updateLearningConfiguration(
    agentId: string,
    config: Partial<LearningConfiguration>
  ): Promise<boolean> {
    try {
      await this.prisma.agent.update({
        where: { id: agentId },
        data: {
          learningMode: config.mode,
          learningThreshold: config.confidenceThreshold,
          enableAutoLearning: config.autoUpdateEnabled,
        },
      });

      return true;
    } catch (error) {
      console.error('Error updating learning configuration:', error);
      return false;
    }
  }

  // Get learning statistics
  public async getLearningStatistics(agentId: string): Promise<any> {
    try {
      // This would typically query learning logs and metrics
      return {
        totalDecisions: 0,
        learningEvents: 0,
        successRate: 0,
        averageConfidence: 0,
        riskDistribution: {
          low: 0,
          medium: 0,
          high: 0,
        },
      };
    } catch (error) {
      console.error('Error getting learning statistics:', error);
      return null;
    }
  }

  // Add custom learning rule
  public addLearningRule(rule: LearningRule): void {
    this.learningRules.set(rule.id, rule);
  }

  // Remove learning rule
  public removeLearningRule(ruleId: string): boolean {
    return this.learningRules.delete(ruleId);
  }

  // Get all learning rules
  public getLearningRules(): LearningRule[] {
    return Array.from(this.learningRules.values());
  }
}
