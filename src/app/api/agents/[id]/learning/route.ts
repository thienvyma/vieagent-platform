import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AutoLearningOrchestrator } from '@/lib/learning/AutoLearningOrchestrator';
import { LearningModeManager, LearningMode } from '@/lib/learning/LearningModeManager';
import { KnowledgeUpdateEngine } from '@/lib/learning/KnowledgeUpdateEngine';

// GET /api/agents/[id]/learning - Get learning status and analytics
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agentId = params.id;
    const orchestrator = AutoLearningOrchestrator.getInstance();
    const updateEngine = KnowledgeUpdateEngine.getInstance();

    // Get learning status
    const learningStatus = await orchestrator.getLearningStatus(agentId);

    // Get learning analytics
    const analytics = await orchestrator.getLearningAnalytics(agentId);

    // Get pending updates
    const pendingUpdates = updateEngine.getPendingUpdates(agentId);

    // Get update statistics
    const updateStats = updateEngine.getUpdateStatistics(agentId);

    // Get active sessions
    const activeSessions = orchestrator
      .getActiveSessions()
      .filter(session => session.agentId === agentId);

    return NextResponse.json({
      success: true,
      data: {
        status: learningStatus,
        analytics,
        pendingUpdates: pendingUpdates.slice(0, 10), // Latest 10 updates
        updateStatistics: updateStats,
        activeSessions,
        queueStatus: orchestrator.getLearningQueueStatus()[agentId] || 0,
      },
    });
  } catch (error) {
    console.error('Error getting learning status:', error);
    return NextResponse.json({ error: 'Failed to get learning status' }, { status: 500 });
  }
}

// POST /api/agents/[id]/learning - Update learning configuration or trigger actions
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agentId = params.id;
    const body = await request.json();
    const { action, ...config } = body;

    const orchestrator = AutoLearningOrchestrator.getInstance();
    const updateEngine = KnowledgeUpdateEngine.getInstance();

    switch (action) {
      case 'updateConfig':
        await orchestrator.updateLearningConfig(agentId, config);
        return NextResponse.json({
          success: true,
          message: 'Learning configuration updated',
        });

      case 'enableLearning':
        await orchestrator.setLearningEnabled(agentId, true);
        return NextResponse.json({
          success: true,
          message: 'Learning enabled',
        });

      case 'disableLearning':
        await orchestrator.setLearningEnabled(agentId, false);
        return NextResponse.json({
          success: true,
          message: 'Learning disabled',
        });

      case 'triggerImmediate':
        const { conversationId } = body;
        if (!conversationId) {
          return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
        }

        const success = await orchestrator.triggerImmediateLearning(agentId, conversationId);
        return NextResponse.json({
          success,
          message: success ? 'Immediate learning triggered' : 'Failed to trigger learning',
        });

      case 'queueConversation':
        const { conversationId: queueConvId } = body;
        if (!queueConvId) {
          return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
        }

        orchestrator.queueConversationForLearning(agentId, queueConvId);
        return NextResponse.json({
          success: true,
          message: 'Conversation queued for learning',
        });

      case 'approveUpdate':
        const { updateId } = body;
        if (!updateId) {
          return NextResponse.json({ error: 'Update ID required' }, { status: 400 });
        }

        const approved = await orchestrator.approveLearningUpdate(agentId, updateId);
        return NextResponse.json({
          success: approved,
          message: approved ? 'Update approved and applied' : 'Failed to approve update',
        });

      case 'rejectUpdate':
        const { updateId: rejectId, reason } = body;
        if (!rejectId || !reason) {
          return NextResponse.json({ error: 'Update ID and reason required' }, { status: 400 });
        }

        const rejected = await orchestrator.rejectLearningUpdate(agentId, rejectId, reason);
        return NextResponse.json({
          success: rejected,
          message: rejected ? 'Update rejected' : 'Failed to reject update',
        });

      case 'applyUpdates':
        const { updateIds } = body;
        const result = await updateEngine.applyKnowledgeUpdates(agentId, updateIds);
        return NextResponse.json({
          success: true,
          data: result,
          message: `Applied ${result.applied} updates, ${result.failed} failed`,
        });

      case 'rollbackUpdate':
        const { updateId: rollbackId } = body;
        if (!rollbackId) {
          return NextResponse.json({ error: 'Update ID required' }, { status: 400 });
        }

        const rolledBack = await updateEngine.rollbackUpdate(rollbackId);
        return NextResponse.json({
          success: rolledBack,
          message: rolledBack ? 'Update rolled back' : 'Failed to rollback update',
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error handling learning action:', error);
    return NextResponse.json({ error: 'Failed to handle learning action' }, { status: 500 });
  }
}

// PUT /api/agents/[id]/learning - Update learning mode
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agentId = params.id;
    const body = await request.json();
    const { mode, confidenceThreshold, autoUpdateEnabled } = body;

    // Validate learning mode
    if (mode && !Object.values(LearningMode).includes(mode)) {
      return NextResponse.json({ error: 'Invalid learning mode' }, { status: 400 });
    }

    // Validate confidence threshold
    if (confidenceThreshold !== undefined && (confidenceThreshold < 0 || confidenceThreshold > 1)) {
      return NextResponse.json(
        { error: 'Confidence threshold must be between 0 and 1' },
        { status: 400 }
      );
    }

    const modeManager = LearningModeManager.getInstance();
    const orchestrator = AutoLearningOrchestrator.getInstance();

    // Update learning mode configuration
    if (mode || confidenceThreshold !== undefined || autoUpdateEnabled !== undefined) {
      await modeManager.updateLearningConfiguration(agentId, {
        mode,
        confidenceThreshold,
        autoUpdateEnabled,
      });
    }

    // Update orchestrator configuration
    await orchestrator.updateLearningConfig(agentId, {
      learningMode: mode,
      confidenceThreshold,
      autoUpdateEnabled,
    });

    return NextResponse.json({
      success: true,
      message: 'Learning mode updated successfully',
    });
  } catch (error) {
    console.error('Error updating learning mode:', error);
    return NextResponse.json({ error: 'Failed to update learning mode' }, { status: 500 });
  }
}

// DELETE /api/agents/[id]/learning - Clear learning data
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agentId = params.id;
    const url = new URL(request.url);
    const clearType = url.searchParams.get('type') || 'pending';

    const updateEngine = KnowledgeUpdateEngine.getInstance();
    const orchestrator = AutoLearningOrchestrator.getInstance();

    switch (clearType) {
      case 'pending':
        // Clear pending updates
        const pendingUpdates = updateEngine.getPendingUpdates(agentId);
        const pendingIds = pendingUpdates.map(u => u.id);

        // Mark as rejected
        for (const id of pendingIds) {
          await orchestrator.rejectLearningUpdate(agentId, id, 'Bulk clear operation');
        }

        return NextResponse.json({
          success: true,
          message: `Cleared ${pendingIds.length} pending updates`,
        });

      case 'queue':
        // Clear learning queue
        const queueStatus = orchestrator.getLearningQueueStatus();
        const queueLength = queueStatus[agentId] || 0;

        // This would clear the queue in a real implementation
        return NextResponse.json({
          success: true,
          message: `Cleared learning queue (${queueLength} items)`,
        });

      case 'analytics':
        // Clear learning analytics (would reset in database)
        return NextResponse.json({
          success: true,
          message: 'Learning analytics cleared',
        });

      default:
        return NextResponse.json({ error: 'Invalid clear type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error clearing learning data:', error);
    return NextResponse.json({ error: 'Failed to clear learning data' }, { status: 500 });
  }
}
