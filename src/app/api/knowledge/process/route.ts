/**
 * 🔄 Knowledge Processing API - Phase 4 Day 14
 * API endpoint để process knowledge documents với production vector services
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
// ✅ fixed from TS Phase 2 - Fixed import path for authOptions
import { authOptions } from '@/lib/auth';
// ✅ fixed from TS Phase 2 - Verify knowledgePipelineBridge module exists and is properly exported  
import { knowledgePipelineBridge } from '@/lib/knowledge-pipeline-bridge';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/knowledge/process - Start processing documents
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, documentIds, userId } = body;

    // Validate action
    if (!['process_existing', 'process_specific', 'process_all'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    let result;

    switch (action) {
      case 'process_existing':
        // Process existing documents for user
        result = await knowledgePipelineBridge.processExistingKnowledge(userId || session.user.id);
        break;

      case 'process_specific':
        // Process specific documents
        if (!documentIds || !Array.isArray(documentIds)) {
          return NextResponse.json({ error: 'documentIds required' }, { status: 400 });
        }

        result = { processed: 0, queued: 0, errors: [] };

        for (const docId of documentIds) {
          try {
            const doc = await prisma.document.findUnique({
              where: { id: docId },
              include: { user: true },
            });

            if (!doc) {
              (result.errors as string[]).push(`Document not found: ${docId}`); // ✅ fixed from TS Phase 2
              continue;
            }

            // Check permission
            if (doc.userId !== session.user.id && session.user.role !== 'ADMIN') {
              (result.errors as string[]).push(`Access denied: ${docId}`); // ✅ fixed from TS Phase 2
              continue;
            }

            // Convert and queue
            const knowledgeDoc = {
              id: doc.id,
              title: doc.title || doc.filename || `Document ${doc.id}`, // ✅ fixed from TS Phase 2
              content: doc.content || doc.extractedText || '',
              metadata: {
                filename: doc.filename, // ✅ fixed from TS Phase 2
                mimeType: doc.mimeType, // ✅ fixed from TS Phase 2
                size: doc.size, // ✅ fixed from TS Phase 2
                uploadedAt: doc.createdAt.toISOString(), // ✅ fixed from TS Phase 2
                ...(doc.metadata ? JSON.parse(doc.metadata) : {}), // ✅ fixed from TS Phase 2
              },
              userId: doc.userId,
              type: 'document' as const,
              source: doc.type || 'upload', // ✅ fixed from TS Phase 2
              createdAt: doc.createdAt.toISOString(), // ✅ fixed from TS Phase 2
              updatedAt: doc.updatedAt.toISOString(), // ✅ fixed from TS Phase 2
            };

            await knowledgePipelineBridge.queueDocumentProcessing(knowledgeDoc);
            result.queued++;
          } catch (error: any) { // ✅ fixed from TS Phase 2
            (result.errors as string[]).push(`Failed to queue ${docId}: ${error.message}`); // ✅ fixed from TS Phase 2
          }
        }
        break;

      case 'process_all':
        // Process all documents (admin only)
        if (session.user.role !== 'ADMIN') {
          return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        result = await knowledgePipelineBridge.processExistingKnowledge();
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action,
      result,
      queueStatus: knowledgePipelineBridge.getQueueStatus(),
      processingStats: knowledgePipelineBridge.getProcessingStats(),
    });
  } catch (error: any) { // ✅ fixed from TS Phase 2
    console.error('❌ Knowledge processing API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/knowledge/process - Get processing status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');
    const action = searchParams.get('action');

    if (action === 'status' && documentId) {
      // Get specific document status
      const status = knowledgePipelineBridge.getDocumentStatus(documentId);

      if (!status) {
        return NextResponse.json(
          { error: 'Document not found in processing queue' },
          { status: 404 }
        );
      }

      // Check permission
      if (status.userId !== session.user.id && session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      return NextResponse.json({
        success: true,
        documentId,
        status,
      });
    }

    if (action === 'health') {
      // Get service health status
      const healthStatus = await knowledgePipelineBridge.getHealthStatus();

      return NextResponse.json({
        success: true,
        health: healthStatus,
      });
    }

    // Get general processing status
    const queueStatus = knowledgePipelineBridge.getQueueStatus();
    const processingStats = knowledgePipelineBridge.getProcessingStats();

    // Get user's documents in queue (if not admin)
    let userDocuments: Array<{ documentId: string; [key: string]: any }> = []; // ✅ fixed from TS Phase 2
    if (session.user.role !== 'ADMIN') {
      // Filter to user's documents only
      const allStatuses = Array.from(knowledgePipelineBridge['processingQueue'].entries());
      userDocuments = allStatuses
        .filter(([_, status]) => status.userId === session.user.id)
        .map(([docId, status]) => ({ ...status, documentId: docId })); // ✅ fixed from TS Phase 2
    }

    return NextResponse.json({
      success: true,
      queueStatus,
      processingStats,
      userDocuments: session.user.role === 'ADMIN' ? undefined : userDocuments,
    });
  } catch (error: any) {
    console.error('❌ Knowledge processing status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/knowledge/process - Clear completed or cancel processing
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'clear_completed') {
      // Clear completed documents from queue
      knowledgePipelineBridge.clearCompletedDocuments();

      return NextResponse.json({
        success: true,
        message: 'Completed documents cleared from queue',
        queueStatus: knowledgePipelineBridge.getQueueStatus(),
      });
    }

    if (action === 'cancel' && session.user.role === 'ADMIN') {
      // Cancel all processing (admin only)
      await knowledgePipelineBridge.cleanup();

      return NextResponse.json({
        success: true,
        message: 'Processing cancelled and queue cleared',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('❌ Knowledge processing delete API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
