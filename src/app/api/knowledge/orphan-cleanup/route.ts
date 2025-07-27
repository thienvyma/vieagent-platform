/**
 * 🧹 Knowledge Orphan Cleanup API - Day 2.4
 * ==========================================
 * API endpoints for orphan data analysis and cleanup
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import OrphanCleanupService from '@/lib/orphan-cleanup-service';
import {
  successResponse,
  commonErrors,
  createPerformanceResponse,
} from '@/lib/api-response-standard';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'analyze';

    const cleanupService = new OrphanCleanupService();

    try {
      switch (action) {
        case 'analyze': {
          // 🔍 Analyze orphaned data
          const startTime = Date.now();
          const analysis = await cleanupService.analyzeOrphans();

          return successResponse(
            {
              action: 'analyze',
              analysis,
              recommendations: analysis.recommendedActions,
            },
            'Orphan analysis completed successfully',
            {
              performance: {
                responseTime: Date.now() - startTime,
                cached: false,
              },
            }
          );
        }

        case 'stats': {
          // 📊 Get cleanup statistics
          const stats = {
            lastAnalysis: new Date().toISOString(),
            systemStatus: 'healthy',
            maintenanceMode: false,
            nextScheduledCleanup: null,
          };

          return successResponse(
            {
              action: 'stats',
              ...stats,
            },
            'System statistics retrieved successfully'
          );
        }

        default:
          return NextResponse.json(
            {
              success: false,
              error: `Unknown action: ${action}`,
              availableActions: ['analyze', 'stats'],
            },
            { status: 400 }
          );
      }
    } finally {
      await cleanupService.dispose();
    }
  } catch (error) {
    console.error('❌ Orphan cleanup API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        action: 'error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const { action, options = {} } = body;
    const cleanupService = new OrphanCleanupService();

    try {
      switch (action) {
        case 'cleanup': {
          // 🗑️ Execute orphan cleanup
          console.log('🧹 Starting orphan cleanup via API...');

          const cleanupOptions = {
            maxAgeProcessingDays: options.maxAgeProcessingDays || 90,
            maxAgeAnalyticsDays: options.maxAgeAnalyticsDays || 180,
            dryRun: options.dryRun || false,
            batchSize: options.batchSize || 100,
          };

          const result = await cleanupService.cleanupOrphans(cleanupOptions);

          return NextResponse.json({
            success: result.success,
            action: 'cleanup',
            data: {
              result,
              options: cleanupOptions,
              timestamp: new Date().toISOString(),
            },
            message: result.message,
          });
        }

        case 'optimize-storage': {
          // 📊 Optimize storage
          console.log('📊 Starting storage optimization via API...');

          const result = await cleanupService.optimizeStorage();

          return NextResponse.json({
            success: result.success,
            action: 'optimize-storage',
            data: {
              result,
              timestamp: new Date().toISOString(),
            },
            message: result.message,
          });
        }

        case 'agent-cleanup': {
          // 🔒 Clean up after agent deletion
          const { agentId } = options;

          if (!agentId) {
            return NextResponse.json(
              { success: false, error: 'agentId required for agent cleanup' },
              { status: 400 }
            );
          }

          console.log(`🔒 Starting agent cleanup via API: ${agentId}`);

          await cleanupService.onAgentDeleted(agentId);

          return NextResponse.json({
            success: true,
            action: 'agent-cleanup',
            data: {
              agentId,
              timestamp: new Date().toISOString(),
            },
            message: `Agent cleanup completed for: ${agentId}`,
          });
        }

        case 'knowledge-cleanup': {
          // 🔒 Clean up after knowledge update
          const { knowledgeId } = options;

          if (!knowledgeId) {
            return NextResponse.json(
              { success: false, error: 'knowledgeId required for knowledge cleanup' },
              { status: 400 }
            );
          }

          console.log(`🔒 Starting knowledge cleanup via API: ${knowledgeId}`);

          await cleanupService.onKnowledgeUpdated(knowledgeId);

          return NextResponse.json({
            success: true,
            action: 'knowledge-cleanup',
            data: {
              knowledgeId,
              timestamp: new Date().toISOString(),
            },
            message: `Knowledge cleanup completed for: ${knowledgeId}`,
          });
        }

        default:
          return NextResponse.json(
            {
              success: false,
              error: `Unknown action: ${action}`,
              availableActions: [
                'cleanup',
                'optimize-storage',
                'agent-cleanup',
                'knowledge-cleanup',
              ],
            },
            { status: 400 }
          );
      }
    } finally {
      await cleanupService.dispose();
    }
  } catch (error) {
    console.error('❌ Orphan cleanup POST API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        action: 'error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // For emergency cleanup scenarios
    const { searchParams } = new URL(request.url);
    const emergency = searchParams.get('emergency') === 'true';

    if (!emergency) {
      return NextResponse.json(
        { success: false, error: 'Emergency cleanup requires emergency=true parameter' },
        { status: 400 }
      );
    }

    const cleanupService = new OrphanCleanupService();

    try {
      console.log('🚨 Emergency orphan cleanup initiated...');

      // Emergency cleanup with aggressive settings
      const result = await cleanupService.cleanupOrphans({
        maxAgeProcessingDays: 30, // More aggressive
        maxAgeAnalyticsDays: 90, // More aggressive
        dryRun: false,
        batchSize: 200, // Larger batches
      });

      // Also run storage optimization
      const storageResult = await cleanupService.optimizeStorage();

      return NextResponse.json({
        success: true,
        action: 'emergency-cleanup',
        data: {
          cleanup: result,
          storage: storageResult,
          timestamp: new Date().toISOString(),
        },
        message: 'Emergency cleanup completed',
      });
    } finally {
      await cleanupService.dispose();
    }
  } catch (error) {
    console.error('❌ Emergency cleanup API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        action: 'emergency-error',
      },
      { status: 500 }
    );
  }
}
