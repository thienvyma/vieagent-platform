/**
 * 🧹 Orphan Cleanup Service - Day 2.4
 * =====================================
 * Simplified orphan cleanup service theo Day 2.4 requirements:
 * - Stale vector cleanup
 * - Agent deletion cleanup
 * - Knowledge update cleanup
 * - Storage optimization
 */

import { PrismaClient } from '@prisma/client';

interface OrphanAnalysisResult {
  orphanedAssignments: number;
  staleProcessingHistory: number;
  oldAnalytics: number;
  recommendedActions: string[];
  estimatedStorageSavingsMB: number;
}

interface CleanupOptions {
  maxAgeProcessingDays: number;
  maxAgeAnalyticsDays: number;
  dryRun: boolean;
  batchSize: number;
}

interface CleanupResult {
  assignmentsDeleted: number;
  historyRecordsDeleted: number;
  analyticsDeleted: number;
  storageReclaimedMB: number;
  executionTimeMs: number;
  success: boolean;
  message: string;
}

export class OrphanCleanupService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * 🔍 Analyze system for orphaned data - Core Day 2.4 Task
   */
  async analyzeOrphans(): Promise<OrphanAnalysisResult> {
    console.log('🔍 Starting Day 2.4 Orphan Analysis...');

    try {
      // 1. Find orphaned knowledge-agent assignments
      const orphanedAssignments = await this.prisma.knowledgeAgentAssignment.count({
        where: {
          OR: [
            {
              knowledge: {
                isDeleted: true,
              },
            },
            {
              agent: {
                status: 'DELETED',
              },
            },
          ],
        },
      });

      // 2. Find stale processing history (older than 90 days)
      const cutoffDate90 = new Date();
      cutoffDate90.setDate(cutoffDate90.getDate() - 90);

      const staleProcessingHistory = await this.prisma.knowledgeProcessingHistory.count({
        where: {
          timestamp: {
            lt: cutoffDate90,
          },
        },
      });

      // 3. Find old analytics (older than 180 days)
      const cutoffDate180 = new Date();
      cutoffDate180.setDate(cutoffDate180.getDate() - 180);

      const oldAnalytics = await this.prisma.knowledgeAnalytics.count({
        where: {
          timestamp: {
            lt: cutoffDate180,
          },
        },
      });

      // 4. Generate recommendations
      const recommendedActions = [];
      let estimatedSavingsMB = 0;

      if (orphanedAssignments > 0) {
        recommendedActions.push(`Remove ${orphanedAssignments} orphaned knowledge assignments`);
        estimatedSavingsMB += 1;
      }

      if (staleProcessingHistory > 0) {
        recommendedActions.push(`Archive ${staleProcessingHistory} old processing history records`);
        estimatedSavingsMB += Math.round(staleProcessingHistory * 0.01); // ~10KB per record
      }

      if (oldAnalytics > 0) {
        recommendedActions.push(`Clean ${oldAnalytics} old analytics records`);
        estimatedSavingsMB += Math.round(oldAnalytics * 0.005); // ~5KB per record
      }

      console.log('✅ Orphan analysis completed:');
      console.log(`   🔗 Orphaned assignments: ${orphanedAssignments}`);
      console.log(`   📜 Stale processing history: ${staleProcessingHistory}`);
      console.log(`   📊 Old analytics: ${oldAnalytics}`);
      console.log(`   💾 Estimated savings: ${estimatedSavingsMB}MB`);

      return {
        orphanedAssignments,
        staleProcessingHistory,
        oldAnalytics,
        recommendedActions,
        estimatedStorageSavingsMB: estimatedSavingsMB,
      };
    } catch (error) {
      console.error('❌ Orphan analysis failed:', error);
      throw error;
    }
  }

  /**
   * 🗑️ Execute orphan cleanup - Core Day 2.4 Task
   */
  async cleanupOrphans(options: Partial<CleanupOptions> = {}): Promise<CleanupResult> {
    const config: CleanupOptions = {
      maxAgeProcessingDays: 90,
      maxAgeAnalyticsDays: 180,
      dryRun: false,
      batchSize: 100,
      ...options,
    };

    console.log('🧹 Starting Day 2.4 Orphan Cleanup...');
    console.log('📋 Configuration:', config);

    const startTime = Date.now();
    let assignmentsDeleted = 0;
    let historyRecordsDeleted = 0;
    let analyticsDeleted = 0;

    try {
      // 1. Cleanup orphaned assignments
      const orphanedAssignmentsResult = await this.prisma.knowledgeAgentAssignment.deleteMany({
        where: {
          OR: [
            {
              knowledge: {
                isDeleted: true,
              },
            },
            {
              agent: {
                status: 'DELETED',
              },
            },
          ],
        },
      });
      assignmentsDeleted = orphanedAssignmentsResult.count;

      if (!config.dryRun) {
        // 2. Cleanup old processing history
        const cutoffDateProcessing = new Date();
        cutoffDateProcessing.setDate(cutoffDateProcessing.getDate() - config.maxAgeProcessingDays);

        const deletedHistory = await this.prisma.knowledgeProcessingHistory.deleteMany({
          where: {
            timestamp: {
              lt: cutoffDateProcessing,
            },
          },
        });
        historyRecordsDeleted = deletedHistory.count;

        // 3. Cleanup old analytics
        const cutoffDateAnalytics = new Date();
        cutoffDateAnalytics.setDate(cutoffDateAnalytics.getDate() - config.maxAgeAnalyticsDays);

        const deletedAnalytics = await this.prisma.knowledgeAnalytics.deleteMany({
          where: {
            timestamp: {
              lt: cutoffDateAnalytics,
            },
          },
        });
        analyticsDeleted = deletedAnalytics.count;
      }

      const executionTimeMs = Date.now() - startTime;
      const storageReclaimedMB = Math.round(
        assignmentsDeleted * 0.001 + historyRecordsDeleted * 0.01 + analyticsDeleted * 0.005
      );

      const result: CleanupResult = {
        assignmentsDeleted,
        historyRecordsDeleted,
        analyticsDeleted,
        storageReclaimedMB,
        executionTimeMs,
        success: true,
        message: `Cleanup completed successfully in ${executionTimeMs}ms`,
      };

      console.log('✅ Day 2.4 Cleanup completed:');
      console.log(`   🔗 Assignments deleted: ${assignmentsDeleted}`);
      console.log(`   📜 History records deleted: ${historyRecordsDeleted}`);
      console.log(`   📊 Analytics deleted: ${analyticsDeleted}`);
      console.log(`   💾 Storage reclaimed: ${storageReclaimedMB}MB`);
      console.log(`   ⏱️ Execution time: ${executionTimeMs}ms`);

      return result;
    } catch (error) {
      console.error('❌ Day 2.4 Cleanup failed:', error);

      return {
        assignmentsDeleted,
        historyRecordsDeleted,
        analyticsDeleted,
        storageReclaimedMB: 0,
        executionTimeMs: Date.now() - startTime,
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 🔒 Agent deletion cleanup hook - Day 2.4 Task
   */
  async onAgentDeleted(agentId: string): Promise<void> {
    console.log(`🔒 Day 2.4: Cleaning up after agent deletion: ${agentId}`);

    try {
      // 1. Delete knowledge assignments for this agent
      const deletedAssignments = await this.prisma.knowledgeAgentAssignment.deleteMany({
        where: { agentId },
      });

      // 2. Mark conversations as archived instead of deleting (audit trail)
      const archivedConversations = await this.prisma.conversation.updateMany({
        where: { agentId },
        data: {
          title: `[ARCHIVED-${new Date().toISOString().split('T')[0]}] Agent Deleted`,
        },
      });

      console.log(`✅ Agent cleanup completed:`);
      console.log(`   🔗 Assignments deleted: ${deletedAssignments.count}`);
      console.log(`   💬 Conversations archived: ${archivedConversations.count}`);
    } catch (error) {
      console.error(`❌ Agent cleanup failed for ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * 🔒 Knowledge update cleanup hook - Day 2.4 Task
   */
  async onKnowledgeUpdated(knowledgeId: string): Promise<void> {
    console.log(`🔒 Day 2.4: Cleaning up after knowledge update: ${knowledgeId}`);

    try {
      // Clean up old processing history for this knowledge item (keep last 10 entries)
      const allHistory = await this.prisma.knowledgeProcessingHistory.findMany({
        where: { knowledgeId },
        orderBy: { timestamp: 'desc' },
        skip: 10, // Keep latest 10 entries
      });

      if (allHistory.length > 0) {
        const idsToDelete = allHistory.map(h => h.id);
        const deletedHistory = await this.prisma.knowledgeProcessingHistory.deleteMany({
          where: {
            id: {
              in: idsToDelete,
            },
          },
        });

        console.log(`✅ Knowledge cleanup completed:`);
        console.log(`   📜 Old history records deleted: ${deletedHistory.count}`);
      }
    } catch (error) {
      console.error(`❌ Knowledge cleanup failed for ${knowledgeId}:`, error);
      throw error;
    }
  }

  /**
   * 📊 Storage optimization - Day 2.4 Task
   */
  async optimizeStorage(): Promise<{ success: boolean; message: string; savingsMB: number }> {
    console.log('📊 Day 2.4: Starting storage optimization...');

    try {
      // 1. Find duplicate knowledge entries by fileHash
      const duplicateKnowledge = await this.prisma.knowledge.groupBy({
        by: ['fileHash'],
        having: {
          fileHash: {
            not: null,
          },
        },
        _count: {
          id: true,
        },
      });

      const duplicatesFound = duplicateKnowledge.filter(group => group._count.id > 1);

      let totalSavings = 0;
      let itemsCleaned = 0;

      for (const duplicate of duplicatesFound) {
        if (duplicate.fileHash) {
          // Keep the newest, mark others as duplicates
          const items = await this.prisma.knowledge.findMany({
            where: { fileHash: duplicate.fileHash },
            orderBy: { createdAt: 'desc' },
          });

          if (items.length > 1) {
            const duplicateIds = items.slice(1).map(item => item.id);

            await this.prisma.knowledge.updateMany({
              where: {
                id: {
                  in: duplicateIds,
                },
              },
              data: {
                isDeleted: true,
                status: 'DUPLICATE',
              },
            });

            itemsCleaned += duplicateIds.length;
            totalSavings += items.slice(1).reduce((sum, item) => sum + (item.size || 0), 0);
          }
        }
      }

      const savingsMB = Math.round(totalSavings / (1024 * 1024));

      console.log(`✅ Storage optimization completed:`);
      console.log(`   📁 Duplicate items marked: ${itemsCleaned}`);
      console.log(`   💾 Storage optimized: ${savingsMB}MB`);

      return {
        success: true,
        message: `Storage optimization completed. ${itemsCleaned} duplicates marked, ${savingsMB}MB optimized`,
        savingsMB,
      };
    } catch (error) {
      console.error('❌ Storage optimization failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        savingsMB: 0,
      };
    }
  }

  /**
   * 🔚 Cleanup resources
   */
  async dispose() {
    await this.prisma.$disconnect();
  }
}

export default OrphanCleanupService;
