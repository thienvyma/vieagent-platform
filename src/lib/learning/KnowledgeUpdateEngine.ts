import { PrismaClient } from '@prisma/client';
import { LearningFeedbackSystem } from './LearningFeedbackSystem';
import { KnowledgeExtractionEngine } from './KnowledgeExtractionEngine';

// Knowledge Update Types
export enum UpdateType {
  ADDITION = 'ADDITION',
  MODIFICATION = 'MODIFICATION',
  DELETION = 'DELETION',
  MERGE = 'MERGE',
  SPLIT = 'SPLIT',
}

export enum UpdateStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  APPLIED = 'APPLIED',
  ROLLED_BACK = 'ROLLED_BACK',
}

export interface KnowledgeUpdate {
  id: string;
  agentId: string;
  type: UpdateType;
  status: UpdateStatus;
  source: string; // conversation, feedback, manual
  confidence: number;
  priority: number;
  content: {
    original?: any;
    updated: any;
    metadata: any;
  };
  reasoning: string;
  evidence: string[];
  reviewNotes?: string;
  createdAt: Date;
  appliedAt?: Date;
  rollbackData?: any;
}

export interface KnowledgeVersion {
  id: string;
  agentId: string;
  version: number;
  description: string;
  changes: KnowledgeUpdate[];
  createdAt: Date;
  isActive: boolean;
  performanceMetrics?: {
    accuracy: number;
    relevance: number;
    completeness: number;
  };
}

export interface UpdateRule {
  id: string;
  name: string;
  condition: string;
  action: UpdateType;
  autoApprove: boolean;
  confidenceThreshold: number;
  priority: number;
  enabled: boolean;
}

export interface KnowledgeConflict {
  id: string;
  type: 'DUPLICATE' | 'CONTRADICTION' | 'OVERLAP';
  updates: KnowledgeUpdate[];
  resolution: 'MERGE' | 'REPLACE' | 'KEEP_BOTH' | 'MANUAL';
  confidence: number;
}

export class KnowledgeUpdateEngine {
  private static instance: KnowledgeUpdateEngine;
  private prisma: PrismaClient;
  private feedbackSystem: LearningFeedbackSystem;
  private extractionEngine: KnowledgeExtractionEngine;
  private updateRules: Map<string, UpdateRule>;
  private pendingUpdates: Map<string, KnowledgeUpdate[]>;

  private constructor() {
    this.prisma = new PrismaClient();
    this.feedbackSystem = LearningFeedbackSystem.getInstance();
    this.extractionEngine = KnowledgeExtractionEngine.getInstance();
    this.updateRules = new Map();
    this.pendingUpdates = new Map();
    this.initializeUpdateRules();
  }

  public static getInstance(): KnowledgeUpdateEngine {
    if (!KnowledgeUpdateEngine.instance) {
      KnowledgeUpdateEngine.instance = new KnowledgeUpdateEngine();
    }
    return KnowledgeUpdateEngine.instance;
  }

  // Initialize default update rules
  private initializeUpdateRules(): void {
    const defaultRules: UpdateRule[] = [
      {
        id: 'high_confidence_addition',
        name: 'High Confidence Knowledge Addition',
        condition: 'confidence > 0.9 && type === "FACTUAL"',
        action: UpdateType.ADDITION,
        autoApprove: true,
        confidenceThreshold: 0.9,
        priority: 1,
        enabled: true,
      },
      {
        id: 'user_correction',
        name: 'User Correction Update',
        condition: 'source === "USER_CORRECTION"',
        action: UpdateType.MODIFICATION,
        autoApprove: true,
        confidenceThreshold: 0.8,
        priority: 1,
        enabled: true,
      },
      {
        id: 'pattern_update',
        name: 'Pattern-Based Update',
        condition: 'confidence > 0.8 && evidence.length > 2',
        action: UpdateType.MODIFICATION,
        autoApprove: false,
        confidenceThreshold: 0.8,
        priority: 2,
        enabled: true,
      },
      {
        id: 'low_confidence_review',
        name: 'Low Confidence Review',
        condition: 'confidence < 0.7',
        action: UpdateType.ADDITION,
        autoApprove: false,
        confidenceThreshold: 0.7,
        priority: 3,
        enabled: true,
      },
    ];

    defaultRules.forEach(rule => {
      this.updateRules.set(rule.id, rule);
    });
  }

  // Process conversation for knowledge updates
  public async processConversationForUpdates(
    conversationId: string,
    agentId: string,
    userId: string
  ): Promise<KnowledgeUpdate[]> {
    try {
      // Extract knowledge from conversation
      const extractedKnowledge = await this.extractionEngine.extractKnowledgeFromConversation(
        conversationId,
        agentId,
        userId
      );

      const updates: KnowledgeUpdate[] = [];

      // Process each type of extracted knowledge
      for (const [type, items] of Object.entries(extractedKnowledge)) {
        if (Array.isArray(items)) {
          for (const item of items) {
            const update = await this.createKnowledgeUpdate(
              agentId,
              type,
              item,
              'CONVERSATION',
              conversationId
            );
            if (update) {
              updates.push(update);
            }
          }
        }
      }

      // Store pending updates
      if (updates.length > 0) {
        this.pendingUpdates.set(agentId, [...(this.pendingUpdates.get(agentId) || []), ...updates]);
      }

      return updates;
    } catch (error) {
      console.error('Error processing conversation for updates:', error);
      return [];
    }
  }

  // Create knowledge update
  private async createKnowledgeUpdate(
    agentId: string,
    knowledgeType: string,
    content: any,
    source: string,
    sourceId: string
  ): Promise<KnowledgeUpdate | null> {
    try {
      // Determine update type based on content
      const updateType = this.determineUpdateType(content);

      // Calculate confidence score
      const confidence = this.calculateUpdateConfidence(content, knowledgeType);

      // Generate reasoning
      const reasoning = this.generateUpdateReasoning(content, knowledgeType, confidence);

      // Create update object
      const update: KnowledgeUpdate = {
        id: `update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentId,
        type: updateType,
        status: UpdateStatus.PENDING,
        source,
        confidence,
        priority: this.calculateUpdatePriority(confidence, knowledgeType),
        content: {
          updated: content,
          metadata: {
            type: knowledgeType,
            sourceId,
            extractedAt: new Date(),
          },
        },
        reasoning,
        evidence: this.extractEvidence(content),
        createdAt: new Date(),
      };

      // Check if auto-approval is possible
      if (this.shouldAutoApprove(update)) {
        update.status = UpdateStatus.APPROVED;
      }

      return update;
    } catch (error) {
      console.error('Error creating knowledge update:', error);
      return null;
    }
  }

  // Determine update type
  private determineUpdateType(content: any): UpdateType {
    // Simple heuristic - in production, use more sophisticated logic
    if (content.isNew) {
      return UpdateType.ADDITION;
    } else if (content.isModification) {
      return UpdateType.MODIFICATION;
    } else if (content.shouldMerge) {
      return UpdateType.MERGE;
    } else {
      return UpdateType.ADDITION;
    }
  }

  // Calculate update confidence
  private calculateUpdateConfidence(content: any, knowledgeType: string): number {
    let confidence = 0.5; // Base confidence

    // Factor in content quality
    if (content.confidence) {
      confidence = Math.max(confidence, content.confidence);
    }

    // Factor in knowledge type
    const typeConfidenceMap: { [key: string]: number } = {
      FACTUAL: 0.8,
      PROCEDURAL: 0.7,
      CONCEPTUAL: 0.6,
      EXAMPLE: 0.9,
      SOLUTION: 0.8,
      PATTERN: 0.6,
      FAQ: 0.9,
    };

    const typeConfidence = typeConfidenceMap[knowledgeType] || 0.5;
    confidence = (confidence + typeConfidence) / 2;

    // Factor in evidence strength
    if (content.evidence && content.evidence.length > 0) {
      confidence += Math.min(0.2, content.evidence.length * 0.05);
    }

    return Math.min(1.0, confidence);
  }

  // Calculate update priority
  private calculateUpdatePriority(confidence: number, knowledgeType: string): number {
    let priority = 5; // Default priority

    // High confidence gets higher priority
    if (confidence > 0.9) priority = 1;
    else if (confidence > 0.8) priority = 2;
    else if (confidence > 0.7) priority = 3;
    else if (confidence > 0.6) priority = 4;

    // Certain types get priority boost
    if (knowledgeType === 'SOLUTION' || knowledgeType === 'FAQ') {
      priority = Math.max(1, priority - 1);
    }

    return priority;
  }

  // Generate update reasoning
  private generateUpdateReasoning(content: any, knowledgeType: string, confidence: number): string {
    const reasons = [];

    if (confidence > 0.8) {
      reasons.push('High confidence extraction');
    }

    if (content.evidence && content.evidence.length > 0) {
      reasons.push(`Strong evidence (${content.evidence.length} sources)`);
    }

    if (knowledgeType === 'SOLUTION') {
      reasons.push('Solution knowledge is highly valuable');
    }

    if (content.userValidated) {
      reasons.push('User-validated content');
    }

    return reasons.join('; ') || 'Standard knowledge extraction';
  }

  // Extract evidence
  private extractEvidence(content: any): string[] {
    const evidence = [];

    if (content.sources) {
      evidence.push(...content.sources);
    }

    if (content.references) {
      evidence.push(...content.references);
    }

    if (content.context) {
      evidence.push(content.context);
    }

    return evidence;
  }

  // Check if update should be auto-approved
  private shouldAutoApprove(update: KnowledgeUpdate): boolean {
    // Find applicable rules
    const applicableRules = this.findApplicableUpdateRules(update);

    // Check if any rule allows auto-approval
    const ruleApproval = applicableRules.some(
      rule => rule.autoApprove && update.confidence >= rule.confidenceThreshold
    );

    // Also check global auto-approve threshold
    const autoApproveThreshold = 0.9; // This would come from config in production
    const thresholdApproval = update.confidence >= autoApproveThreshold;

    return ruleApproval || thresholdApproval;
  }

  // Find applicable update rules
  private findApplicableUpdateRules(update: KnowledgeUpdate): UpdateRule[] {
    const applicable: UpdateRule[] = [];

    for (const rule of this.updateRules.values()) {
      if (rule.enabled && this.evaluateUpdateRuleCondition(rule.condition, update)) {
        applicable.push(rule);
      }
    }

    return applicable.sort((a, b) => a.priority - b.priority);
  }

  // Evaluate update rule condition
  private evaluateUpdateRuleCondition(condition: string, update: KnowledgeUpdate): boolean {
    try {
      const confidence = update.confidence;
      const type = update.content.metadata.type;
      const source = update.source;
      const evidence = update.evidence;

      // Replace variables in condition
      const evalCondition = condition
        .replace(/confidence/g, confidence.toString())
        .replace(/type/g, `"${type}"`)
        .replace(/source/g, `"${source}"`)
        .replace(/evidence\.length/g, evidence.length.toString());

      // Simple evaluation (in production, use safer evaluation)
      return eval(evalCondition);
    } catch (error) {
      console.error('Error evaluating update rule condition:', error);
      return false;
    }
  }

  // Apply knowledge updates
  public async applyKnowledgeUpdates(
    agentId: string,
    updateIds?: string[]
  ): Promise<{ applied: number; failed: number; conflicts: KnowledgeConflict[] }> {
    try {
      const pendingUpdates = this.pendingUpdates.get(agentId) || [];
      const updatesToApply = updateIds
        ? pendingUpdates.filter(u => updateIds.includes(u.id))
        : pendingUpdates.filter(u => u.status === UpdateStatus.APPROVED);

      let applied = 0;
      let failed = 0;
      const conflicts: KnowledgeConflict[] = [];

      // Detect conflicts
      const detectedConflicts = this.detectConflicts(updatesToApply);
      conflicts.push(...detectedConflicts);

      // Apply non-conflicting updates
      for (const update of updatesToApply) {
        const hasConflict = conflicts.some(c => c.updates.some(u => u.id === update.id));

        if (!hasConflict) {
          try {
            await this.applyUpdate(update);
            update.status = UpdateStatus.APPLIED;
            update.appliedAt = new Date();
            applied++;
          } catch (error) {
            console.error('Error applying update:', error);
            failed++;
          }
        }
      }

      // Update pending updates
      this.pendingUpdates.set(
        agentId,
        pendingUpdates.filter(u => u.status !== UpdateStatus.APPLIED)
      );

      return { applied, failed, conflicts };
    } catch (error) {
      console.error('Error applying knowledge updates:', error);
      return { applied: 0, failed: 0, conflicts: [] };
    }
  }

  // Detect conflicts between updates
  private detectConflicts(updates: KnowledgeUpdate[]): KnowledgeConflict[] {
    const conflicts: KnowledgeConflict[] = [];

    // Simple conflict detection - in production, use more sophisticated logic
    for (let i = 0; i < updates.length; i++) {
      for (let j = i + 1; j < updates.length; j++) {
        const update1 = updates[i];
        const update2 = updates[j];

        // Check for potential conflicts
        if (this.updatesConflict(update1, update2)) {
          conflicts.push({
            id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'CONTRADICTION',
            updates: [update1, update2],
            resolution: 'MANUAL',
            confidence: Math.min(update1.confidence, update2.confidence),
          });
        }
      }
    }

    return conflicts;
  }

  // Check if two updates conflict
  private updatesConflict(update1: KnowledgeUpdate, update2: KnowledgeUpdate): boolean {
    // Simple conflict detection - same content type and overlapping content
    return (
      update1.content.metadata.type === update2.content.metadata.type &&
      JSON.stringify(update1.content.updated) === JSON.stringify(update2.content.updated)
    );
  }

  // Apply single update
  private async applyUpdate(update: KnowledgeUpdate): Promise<void> {
    try {
      // Store rollback data
      update.rollbackData = await this.createRollbackData(update);

      // Apply the update based on type
      switch (update.type) {
        case UpdateType.ADDITION:
          await this.applyAddition(update);
          break;
        case UpdateType.MODIFICATION:
          await this.applyModification(update);
          break;
        case UpdateType.DELETION:
          await this.applyDeletion(update);
          break;
        case UpdateType.MERGE:
          await this.applyMerge(update);
          break;
        case UpdateType.SPLIT:
          await this.applySplit(update);
          break;
      }

      // Log the update
      await this.logUpdate(update);
    } catch (error) {
      console.error('Error applying update:', error);
      throw error;
    }
  }

  // Create rollback data
  private async createRollbackData(update: KnowledgeUpdate): Promise<any> {
    // In production, this would capture the current state for rollback
    return {
      timestamp: new Date(),
      previousState: update.content.original,
      updateId: update.id,
    };
  }

  // Apply addition update
  private async applyAddition(update: KnowledgeUpdate): Promise<void> {
    // In production, this would add new knowledge to the vector database
    console.log(`Applying addition update: ${update.id}`);
  }

  // Apply modification update
  private async applyModification(update: KnowledgeUpdate): Promise<void> {
    // In production, this would modify existing knowledge
    console.log(`Applying modification update: ${update.id}`);
  }

  // Apply deletion update
  private async applyDeletion(update: KnowledgeUpdate): Promise<void> {
    // In production, this would delete knowledge
    console.log(`Applying deletion update: ${update.id}`);
  }

  // Apply merge update
  private async applyMerge(update: KnowledgeUpdate): Promise<void> {
    // In production, this would merge knowledge items
    console.log(`Applying merge update: ${update.id}`);
  }

  // Apply split update
  private async applySplit(update: KnowledgeUpdate): Promise<void> {
    // In production, this would split knowledge items
    console.log(`Applying split update: ${update.id}`);
  }

  // Log update
  private async logUpdate(update: KnowledgeUpdate): Promise<void> {
    try {
      // In production, this would log to database
      console.log(`Update applied: ${update.id} - ${update.type}`);
    } catch (error) {
      console.error('Error logging update:', error);
    }
  }

  // Rollback update
  public async rollbackUpdate(updateId: string): Promise<boolean> {
    try {
      // In production, this would rollback the update using rollback data
      console.log(`Rolling back update: ${updateId}`);
      return true;
    } catch (error) {
      console.error('Error rolling back update:', error);
      return false;
    }
  }

  // Get pending updates
  public getPendingUpdates(agentId: string): KnowledgeUpdate[] {
    return this.pendingUpdates.get(agentId) || [];
  }

  // Get update statistics
  public getUpdateStatistics(agentId: string): any {
    const pendingUpdates = this.pendingUpdates.get(agentId) || [];

    return {
      total: pendingUpdates.length,
      byStatus: {
        pending: pendingUpdates.filter(u => u.status === UpdateStatus.PENDING).length,
        approved: pendingUpdates.filter(u => u.status === UpdateStatus.APPROVED).length,
        rejected: pendingUpdates.filter(u => u.status === UpdateStatus.REJECTED).length,
        applied: pendingUpdates.filter(u => u.status === UpdateStatus.APPLIED).length,
      },
      byType: {
        addition: pendingUpdates.filter(u => u.type === UpdateType.ADDITION).length,
        modification: pendingUpdates.filter(u => u.type === UpdateType.MODIFICATION).length,
        deletion: pendingUpdates.filter(u => u.type === UpdateType.DELETION).length,
        merge: pendingUpdates.filter(u => u.type === UpdateType.MERGE).length,
        split: pendingUpdates.filter(u => u.type === UpdateType.SPLIT).length,
      },
      averageConfidence:
        pendingUpdates.reduce((sum, u) => sum + u.confidence, 0) / pendingUpdates.length || 0,
    };
  }

  // Create knowledge version
  public async createKnowledgeVersion(
    agentId: string,
    description: string,
    appliedUpdates: KnowledgeUpdate[]
  ): Promise<KnowledgeVersion> {
    const version: KnowledgeVersion = {
      id: `version_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agentId,
      version: await this.getNextVersionNumber(agentId),
      description,
      changes: appliedUpdates,
      createdAt: new Date(),
      isActive: true,
    };

    return version;
  }

  // Get next version number
  private async getNextVersionNumber(agentId: string): Promise<number> {
    // In production, this would query the database for the latest version
    return 1;
  }
}
