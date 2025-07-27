import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// TODO @final-check: Monitor vector consistency in production
// - Set up alerts for collection ID mismatches
// - Track rollback success rates
// - Monitor orphaned vector cleanup efficiency
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { documentId, action = 'update', newFile } = await request.json();

    const updateFlow = {
      startTime: new Date(),
      action,
      documentId,
      userId: session.user.id,
      steps: [],
      success: false,
      rollback: null,
      vectorConsistency: {
        beforeUpdate: null,
        afterUpdate: null,
        collectionIdChanged: false,
        orphanedVectors: [],
      },
    };

    // Step 1: Get existing document information
    updateFlow.steps.push({ step: 1, action: 'Retrieving existing document', status: 'started' });

    const existingDoc = await prisma.userDocument.findFirst({
      where: {
        id: documentId,
        userId: session.user.id,
        deleted: false,
      },
      select: {
        id: true,
        filename: true,
        agentId: true,
        vectorCollectionId: true,
        contentHash: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!existingDoc) {
      updateFlow.steps.push({
        step: 1,
        action: 'Retrieving existing document',
        status: 'failed',
        error: 'Document not found',
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Document not found or access denied',
          updateFlow,
        },
        { status: 404 }
      );
    }

    updateFlow.steps.push({ step: 1, action: 'Retrieving existing document', status: 'completed' });

    // Step 2: Capture vector state before update
    updateFlow.steps.push({
      step: 2,
      action: 'Capturing vector state before update',
      status: 'started',
    });

    if (existingDoc.vectorCollectionId) {
      updateFlow.vectorConsistency.beforeUpdate = await captureVectorState(
        existingDoc.vectorCollectionId,
        existingDoc.id
      );
    }

    updateFlow.steps.push({
      step: 2,
      action: 'Capturing vector state before update',
      status: 'completed',
    });

    // Step 3: Create backup for rollback
    updateFlow.steps.push({ step: 3, action: 'Creating backup for rollback', status: 'started' });

    const backup = await createDocumentBackup(existingDoc);
    updateFlow.rollback = {
      backupId: backup.id,
      originalVectorCollectionId: existingDoc.vectorCollectionId,
      canRollback: true,
    };

    updateFlow.steps.push({ step: 3, action: 'Creating backup for rollback', status: 'completed' });

    // Step 4: Process knowledge update
    updateFlow.steps.push({ step: 4, action: 'Processing knowledge update', status: 'started' });

    let updateResult;
    if (action === 'update' && newFile) {
      updateResult = await updateKnowledgeFile(existingDoc, newFile, session.user.id);
    } else if (action === 'reprocess') {
      updateResult = await reprocessKnowledgeFile(existingDoc, session.user.id);
    } else {
      throw new Error('Invalid action or missing file data');
    }

    if (!updateResult.success) {
      updateFlow.steps.push({
        step: 4,
        action: 'Processing knowledge update',
        status: 'failed',
        error: updateResult.error,
      });

      // Attempt rollback
      await rollbackUpdate(backup);

      return NextResponse.json(
        {
          success: false,
          error: 'Knowledge update failed',
          updateFlow,
          rollbackPerformed: true,
        },
        { status: 500 }
      );
    }

    updateFlow.steps.push({ step: 4, action: 'Processing knowledge update', status: 'completed' });

    // Step 5: Verify vector consistency after update
    updateFlow.steps.push({ step: 5, action: 'Verifying vector consistency', status: 'started' });

    const updatedDoc = await prisma.userDocument.findUnique({
      where: { id: documentId },
      select: { vectorCollectionId: true },
    });

    if (updatedDoc?.vectorCollectionId) {
      updateFlow.vectorConsistency.afterUpdate = await captureVectorState(
        updatedDoc.vectorCollectionId,
        documentId
      );

      // Check if collection ID changed
      updateFlow.vectorConsistency.collectionIdChanged =
        existingDoc.vectorCollectionId !== updatedDoc.vectorCollectionId;

      // Look for orphaned vectors from old collection
      if (updateFlow.vectorConsistency.collectionIdChanged && existingDoc.vectorCollectionId) {
        updateFlow.vectorConsistency.orphanedVectors = await findOrphanedVectors(
          existingDoc.vectorCollectionId,
          documentId
        );
      }
    }

    updateFlow.steps.push({ step: 5, action: 'Verifying vector consistency', status: 'completed' });

    // Step 6: Cleanup orphaned vectors if any
    if (updateFlow.vectorConsistency.orphanedVectors.length > 0) {
      updateFlow.steps.push({ step: 6, action: 'Cleaning up orphaned vectors', status: 'started' });

      try {
        await cleanupOrphanedVectors(
          existingDoc.vectorCollectionId,
          updateFlow.vectorConsistency.orphanedVectors
        );

        updateFlow.steps.push({
          step: 6,
          action: 'Cleaning up orphaned vectors',
          status: 'completed',
        });
      } catch (cleanupError) {
        updateFlow.steps.push({
          step: 6,
          action: 'Cleaning up orphaned vectors',
          status: 'warning',
          error: cleanupError.message,
        });
      }
    }

    // Step 7: Log update action for audit trail
    updateFlow.steps.push({ step: 7, action: 'Logging update action', status: 'started' });

    await logUpdateAction({
      documentId,
      userId: session.user.id,
      action,
      oldCollectionId: existingDoc.vectorCollectionId,
      newCollectionId: updatedDoc?.vectorCollectionId,
      collectionIdChanged: updateFlow.vectorConsistency.collectionIdChanged,
      orphanedVectorsFound: updateFlow.vectorConsistency.orphanedVectors.length,
      updateFlow: updateFlow,
    });

    updateFlow.steps.push({ step: 7, action: 'Logging update action', status: 'completed' });

    updateFlow.success = true;
    updateFlow.endTime = new Date();
    updateFlow.duration = updateFlow.endTime.getTime() - updateFlow.startTime.getTime();

    return NextResponse.json({
      success: true,
      updateFlow,
      recommendations: generateUpdateRecommendations(updateFlow),
    });
  } catch (error) {
    console.error('Knowledge update flow error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Knowledge update flow failed',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// Helper function to capture vector state
async function captureVectorState(collectionId: string, documentId: string) {
  try {
    const response = await fetch(`${process.env.CHROMADB_URL}/api/v1/collections/${collectionId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      return { error: 'Failed to access collection', count: 0 };
    }

    const collection = await response.json();

    // Count vectors for this document
    let documentVectorCount = 0;
    if (collection.metadatas) {
      documentVectorCount = collection.metadatas.filter(
        metadata => metadata.documentId === documentId
      ).length;
    }

    return {
      collectionId,
      totalVectors: collection.ids?.length || 0,
      documentVectors: documentVectorCount,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Error capturing vector state:', error);
    return { error: error.message, count: 0 };
  }
}

// Helper function to create document backup
async function createDocumentBackup(document: any) {
  const backup = await prisma.documentBackup.create({
    data: {
      originalDocumentId: document.id,
      filename: document.filename,
      agentId: document.agentId,
      vectorCollectionId: document.vectorCollectionId,
      contentHash: document.contentHash,
      metadata: document.metadata,
      originalCreatedAt: document.createdAt,
      originalUpdatedAt: document.updatedAt,
      backupReason: 'PRE_UPDATE',
      createdAt: new Date(),
    },
  });

  return backup;
}

// Helper function to update knowledge file
async function updateKnowledgeFile(existingDoc: any, newFileData: any, userId: string) {
  try {
    // Calculate new content hash
    const newContentHash = calculateHash(newFileData.content);

    // Check if content actually changed
    if (newContentHash === existingDoc.contentHash) {
      return {
        success: true,
        message: 'No changes detected - content hash identical',
        collectionIdChanged: false,
      };
    }

    // Update document record
    const updatedDoc = await prisma.userDocument.update({
      where: { id: existingDoc.id },
      data: {
        filename: newFileData.filename || existingDoc.filename,
        contentHash: newContentHash,
        metadata: {
          ...existingDoc.metadata,
          lastUpdated: new Date(),
          updateReason: 'FILE_REPLACEMENT',
          previousHash: existingDoc.contentHash,
        },
        updatedAt: new Date(),
      },
    });

    // Trigger vector reprocessing
    const vectorResult = await reprocessVectors(updatedDoc, newFileData.content);

    return {
      success: true,
      document: updatedDoc,
      vectorResult,
      collectionIdChanged: vectorResult.collectionIdChanged,
    };
  } catch (error) {
    console.error('Error updating knowledge file:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Helper function to reprocess knowledge file
async function reprocessKnowledgeFile(existingDoc: any, userId: string) {
  try {
    // Get current file content
    const fileContent = await getFileContent(existingDoc.id);

    if (!fileContent) {
      throw new Error('Could not retrieve file content for reprocessing');
    }

    // Trigger vector reprocessing with existing content
    const vectorResult = await reprocessVectors(existingDoc, fileContent);

    // Update metadata to indicate reprocessing
    await prisma.userDocument.update({
      where: { id: existingDoc.id },
      data: {
        metadata: {
          ...existingDoc.metadata,
          lastReprocessed: new Date(),
          reprocessReason: 'MANUAL_REPROCESS',
        },
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      document: existingDoc,
      vectorResult,
      collectionIdChanged: vectorResult.collectionIdChanged,
    };
  } catch (error) {
    console.error('Error reprocessing knowledge file:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Helper function to reprocess vectors
async function reprocessVectors(document: any, content: string) {
  try {
    // First, delete existing vectors for this document
    if (document.vectorCollectionId) {
      await deleteDocumentVectors(document.vectorCollectionId, document.id);
    }

    // Process new vectors
    const processResponse = await fetch('/api/knowledge/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documentId: document.id,
        content: content,
        forceRegenerate: true,
      }),
    });

    if (!processResponse.ok) {
      throw new Error(`Vector processing failed: ${processResponse.status}`);
    }

    const processResult = await processResponse.json();

    return {
      success: true,
      collectionIdChanged: processResult.collectionIdChanged || false,
      vectorCount: processResult.vectorCount || 0,
    };
  } catch (error) {
    console.error('Error reprocessing vectors:', error);
    return {
      success: false,
      error: error.message,
      collectionIdChanged: false,
    };
  }
}

// Helper function to find orphaned vectors
async function findOrphanedVectors(collectionId: string, documentId: string) {
  try {
    const response = await fetch(`${process.env.CHROMADB_URL}/api/v1/collections/${collectionId}`, {
      method: 'GET',
    });

    if (!response.ok) return [];

    const collection = await response.json();
    const orphanedVectors = [];

    if (collection.metadatas) {
      for (let i = 0; i < collection.metadatas.length; i++) {
        const metadata = collection.metadatas[i];

        if (metadata.documentId === documentId) {
          orphanedVectors.push({
            id: collection.ids[i],
            metadata: metadata,
          });
        }
      }
    }

    return orphanedVectors;
  } catch (error) {
    console.error('Error finding orphaned vectors:', error);
    return [];
  }
}

// Helper function to cleanup orphaned vectors
async function cleanupOrphanedVectors(collectionId: string, orphanedVectors: any[]) {
  if (orphanedVectors.length === 0) return;

  const response = await fetch(
    `${process.env.CHROMADB_URL}/api/v1/collections/${collectionId}/delete`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ids: orphanedVectors.map(v => v.id),
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to cleanup orphaned vectors: ${response.status}`);
  }
}

// Helper function to delete document vectors
async function deleteDocumentVectors(collectionId: string, documentId: string) {
  try {
    const response = await fetch(
      `${process.env.CHROMADB_URL}/api/v1/collections/${collectionId}/delete`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          where: { documentId: documentId },
        }),
      }
    );

    if (!response.ok) {
      console.warn(`Failed to delete vectors for document ${documentId}: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting document vectors:', error);
  }
}

// Helper function to rollback update
async function rollbackUpdate(backup: any) {
  try {
    if (!backup.canRollback) return;

    await prisma.userDocument.update({
      where: { id: backup.originalDocumentId },
      data: {
        vectorCollectionId: backup.originalVectorCollectionId,
        metadata: {
          ...backup.metadata,
          rollbackPerformed: true,
          rollbackTimestamp: new Date(),
          rollbackReason: 'UPDATE_FAILED',
        },
      },
    });

    console.log(`Rollback completed for document ${backup.originalDocumentId}`);
  } catch (error) {
    console.error('Rollback failed:', error);
  }
}

// Helper function to log update action
async function logUpdateAction(action: any) {
  try {
    await prisma.systemLog.create({
      data: {
        type: 'KNOWLEDGE_UPDATE',
        action: action.action,
        details: JSON.stringify(action),
        userId: action.userId,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to log update action:', error);
  }
}

// Helper function to calculate content hash
function calculateHash(content: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(content).digest('hex');
}

// Helper function to get file content
async function getFileContent(documentId: string): Promise<string | null> {
  try {
    // This would need to be implemented based on your file storage system
    // For now, return null to indicate content retrieval is needed
    return null;
  } catch (error) {
    console.error('Error getting file content:', error);
    return null;
  }
}

// Helper function to generate update recommendations
function generateUpdateRecommendations(updateFlow: any): string[] {
  const recommendations = [];

  if (updateFlow.vectorConsistency.collectionIdChanged) {
    recommendations.push('Vector collection ID changed - verify agent search functionality');
  }

  if (updateFlow.vectorConsistency.orphanedVectors.length > 0) {
    recommendations.push(
      `${updateFlow.vectorConsistency.orphanedVectors.length} orphaned vectors were cleaned up`
    );
  }

  if (updateFlow.steps.some(step => step.status === 'warning')) {
    recommendations.push('Some non-critical warnings occurred - review update log');
  }

  if (!updateFlow.vectorConsistency.collectionIdChanged && updateFlow.success) {
    recommendations.push(
      'Knowledge update completed successfully with vector collection ID preserved'
    );
  }

  recommendations.push('Test agent responses to verify knowledge update effectiveness');

  return recommendations;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const documentId = url.searchParams.get('documentId');

    if (!documentId) {
      // Return general update flow statistics
      const recentUpdates = await prisma.systemLog.findMany({
        where: {
          type: 'KNOWLEDGE_UPDATE',
          userId: session.user.id,
        },
        orderBy: { timestamp: 'desc' },
        take: 10,
      });

      return NextResponse.json({
        recentUpdates: recentUpdates.map(log => ({
          timestamp: log.timestamp,
          action: log.action,
          details: JSON.parse(log.details),
        })),
      });
    }

    // Return specific document update history
    const documentUpdates = await prisma.systemLog.findMany({
      where: {
        type: 'KNOWLEDGE_UPDATE',
        details: {
          path: ['documentId'],
          equals: documentId,
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    return NextResponse.json({
      documentId,
      updateHistory: documentUpdates.map(log => ({
        timestamp: log.timestamp,
        action: log.action,
        details: JSON.parse(log.details),
      })),
    });
  } catch (error) {
    console.error('Knowledge update flow status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get update flow status',
      },
      { status: 500 }
    );
  }
}
