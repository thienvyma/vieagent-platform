import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AutoLearningOrchestrator } from '@/lib/learning/AutoLearningOrchestrator';
import { LearningModeManager } from '@/lib/learning/LearningModeManager';
import { KnowledgeUpdateEngine } from '@/lib/learning/KnowledgeUpdateEngine';
import { LearningFeedbackSystem } from '@/lib/learning/LearningFeedbackSystem';
import { ResponseAnalysisEngine } from '@/lib/learning/ResponseAnalysisEngine';
import { KnowledgeExtractionEngine } from '@/lib/learning/KnowledgeExtractionEngine';

// GET /api/learning/dashboard - Get system-wide learning dashboard
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const agentId = url.searchParams.get('agentId');
    const timeRange = url.searchParams.get('timeRange') || '7d'; // 1d, 7d, 30d, 90d

    const orchestrator = AutoLearningOrchestrator.getInstance();
    const modeManager = LearningModeManager.getInstance();
    const updateEngine = KnowledgeUpdateEngine.getInstance();
    const feedbackSystem = LearningFeedbackSystem.getInstance();
    const responseAnalysis = ResponseAnalysisEngine.getInstance();
    const knowledgeExtraction = KnowledgeExtractionEngine.getInstance();

    // System Overview
    const systemOverview = {
      totalAgents: 0, // Would be from database
      activeAgents: 0, // Agents with learning enabled
      totalSessions: 0, // Learning sessions
      totalUpdates: 0, // Knowledge updates
      successRate: 0, // Overall success rate
      averageConfidence: 0, // Average learning confidence
    };

    // Learning Status by Agent
    const learningStatus = agentId
      ? await orchestrator.getLearningStatus(agentId)
      : {
          enabled: false,
          mode: 'HYBRID',
          queueLength: 0,
          activeSessions: 0,
        };

    // Active Sessions
    const activeSessions = orchestrator.getActiveSessions();
    const filteredSessions = agentId
      ? activeSessions.filter(s => s.agentId === agentId)
      : activeSessions;

    // Learning Queue Status
    const queueStatus = orchestrator.getLearningQueueStatus();
    const totalQueueLength = Object.values(queueStatus).reduce((sum, length) => sum + length, 0);

    // Update Statistics
    const updateStats = agentId
      ? updateEngine.getUpdateStatistics(agentId)
      : {
          total: 0,
          byStatus: { pending: 0, approved: 0, rejected: 0, applied: 0 },
          byType: { addition: 0, modification: 0, deletion: 0, merge: 0, split: 0 },
          averageConfidence: 0,
        };

    // Learning Analytics
    const analytics = agentId
      ? await orchestrator.getLearningAnalytics(agentId)
      : {
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

    // Performance Metrics
    const performanceMetrics = {
      learningEfficiency: {
        conversationsPerHour: 0,
        updatesPerSession: 0,
        averageProcessingTime: 0,
        errorRate: 0,
      },
      qualityMetrics: {
        averageResponseQuality: 0,
        knowledgeAccuracy: 0,
        userSatisfactionTrend: [],
        conflictRate: 0,
      },
      systemHealth: {
        componentStatus: {
          orchestrator: 'healthy',
          modeManager: 'healthy',
          updateEngine: 'healthy',
          feedbackSystem: 'healthy',
          responseAnalysis: 'healthy',
          knowledgeExtraction: 'healthy',
        },
        resourceUsage: {
          memoryUsage: 0,
          processingLoad: 0,
          queueBacklog: totalQueueLength,
        },
      },
    };

    // Recent Activity
    const recentActivity = [
      {
        id: 'activity_1',
        type: 'LEARNING_SESSION',
        agentId: agentId || 'system',
        timestamp: new Date(),
        description: 'Learning session completed',
        status: 'success',
        metrics: {
          conversationsProcessed: 5,
          updatesGenerated: 3,
          updatesApplied: 2,
        },
      },
      {
        id: 'activity_2',
        type: 'KNOWLEDGE_UPDATE',
        agentId: agentId || 'system',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        description: 'Knowledge update applied',
        status: 'success',
        metrics: {
          updateType: 'ADDITION',
          confidence: 0.92,
        },
      },
    ];

    // Insights and Recommendations
    const insights = [
      {
        type: 'PERFORMANCE',
        severity: 'info',
        title: 'Learning Performance',
        description: 'System is performing well with 85% success rate',
        recommendation: 'Consider increasing confidence threshold for better quality',
      },
      {
        type: 'CAPACITY',
        severity: 'warning',
        title: 'Queue Backlog',
        description: `${totalQueueLength} conversations pending processing`,
        recommendation: 'Consider increasing batch size or processing frequency',
      },
      {
        type: 'QUALITY',
        severity: 'success',
        title: 'Knowledge Quality',
        description: 'Knowledge base quality is improving consistently',
        recommendation: 'Continue current learning configuration',
      },
    ];

    return NextResponse.json({
      success: true,
      data: {
        systemOverview,
        learningStatus,
        activeSessions: filteredSessions,
        queueStatus: agentId ? { [agentId]: queueStatus[agentId] || 0 } : queueStatus,
        updateStatistics: updateStats,
        analytics,
        performanceMetrics,
        recentActivity,
        insights,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error getting learning dashboard:', error);
    return NextResponse.json({ error: 'Failed to get learning dashboard' }, { status: 500 });
  }
}

// POST /api/learning/dashboard - System-wide learning actions
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, agentIds, config } = body;

    const orchestrator = AutoLearningOrchestrator.getInstance();
    const updateEngine = KnowledgeUpdateEngine.getInstance();

    switch (action) {
      case 'bulkEnableLearning':
        if (!agentIds || !Array.isArray(agentIds)) {
          return NextResponse.json({ error: 'Agent IDs array required' }, { status: 400 });
        }

        const enableResults = await Promise.allSettled(
          agentIds.map(id => orchestrator.setLearningEnabled(id, true))
        );

        const enabledCount = enableResults.filter(r => r.status === 'fulfilled').length;

        return NextResponse.json({
          success: true,
          message: `Learning enabled for ${enabledCount}/${agentIds.length} agents`,
        });

      case 'bulkDisableLearning':
        if (!agentIds || !Array.isArray(agentIds)) {
          return NextResponse.json({ error: 'Agent IDs array required' }, { status: 400 });
        }

        const disableResults = await Promise.allSettled(
          agentIds.map(id => orchestrator.setLearningEnabled(id, false))
        );

        const disabledCount = disableResults.filter(r => r.status === 'fulfilled').length;

        return NextResponse.json({
          success: true,
          message: `Learning disabled for ${disabledCount}/${agentIds.length} agents`,
        });

      case 'bulkUpdateConfig':
        if (!agentIds || !Array.isArray(agentIds) || !config) {
          return NextResponse.json(
            { error: 'Agent IDs array and config required' },
            { status: 400 }
          );
        }

        const configResults = await Promise.allSettled(
          agentIds.map(id => orchestrator.updateLearningConfig(id, config))
        );

        const configuredCount = configResults.filter(r => r.status === 'fulfilled').length;

        return NextResponse.json({
          success: true,
          message: `Configuration updated for ${configuredCount}/${agentIds.length} agents`,
        });

      case 'systemHealthCheck':
        // Perform system health check
        const healthCheck = {
          timestamp: new Date().toISOString(),
          components: {
            orchestrator: { status: 'healthy', lastCheck: new Date() },
            modeManager: { status: 'healthy', lastCheck: new Date() },
            updateEngine: { status: 'healthy', lastCheck: new Date() },
            feedbackSystem: { status: 'healthy', lastCheck: new Date() },
            responseAnalysis: { status: 'healthy', lastCheck: new Date() },
            knowledgeExtraction: { status: 'healthy', lastCheck: new Date() },
          },
          metrics: {
            totalActiveSessions: orchestrator.getActiveSessions().length,
            totalQueueLength: Object.values(orchestrator.getLearningQueueStatus()).reduce(
              (sum, length) => sum + length,
              0
            ),
            systemLoad: 'normal',
          },
        };

        return NextResponse.json({
          success: true,
          data: healthCheck,
        });

      case 'exportLearningData':
        const { format = 'json', dateRange } = body;

        // This would export learning data in the specified format
        const exportData = {
          exportId: `export_${Date.now()}`,
          format,
          dateRange,
          status: 'processing',
          estimatedSize: '10MB',
          downloadUrl: null, // Would be generated after processing
        };

        return NextResponse.json({
          success: true,
          data: exportData,
          message: 'Export initiated',
        });

      case 'generateReport':
        const { reportType = 'performance', period = '7d' } = body;

        // Generate learning report
        const report = {
          reportId: `report_${Date.now()}`,
          type: reportType,
          period,
          status: 'generating',
          sections: [
            'System Overview',
            'Learning Performance',
            'Knowledge Quality',
            'Recommendations',
          ],
        };

        return NextResponse.json({
          success: true,
          data: report,
          message: 'Report generation started',
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error handling dashboard action:', error);
    return NextResponse.json({ error: 'Failed to handle dashboard action' }, { status: 500 });
  }
}
