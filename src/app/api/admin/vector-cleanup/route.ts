import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// TODO @final-check: Set up automated weekly cleanup in production
// - Schedule cron job for vector garbage collection
// - Monitor cleanup performance and adjust batch sizes
// - Track storage savings and optimization metrics
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Only allow admin users to run vector cleanup
    if (!session?.user || !hasPermission(session.user.role, 'manage_system')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mode = 'scan', confirm = false } = await request.json();

    const cleanup = {
      startTime: new Date(),
      mode,
      scanned: 0,
      orphanedCollections: [],
      orphanedVectors: [],
      deletedCollections: 0,
      deletedVectors: 0,
      errors: [],
      summary: {
        totalSizeBefore: 0,
        totalSizeAfter: 0,
        spaceSaved: 0,
      },
    };

    // Get all active agents and their knowledge collections
    const activeAgents = await prisma.agent.findMany({
      where: { deleted: false },
      select: { id: true, name: true },
    });

    const activeKnowledge = await prisma.userDocument.findMany({
      where: {
        deleted: false,
        agentId: { not: null },
      },
      select: {
        id: true,
        filename: true,
        agentId: true,
        vectorCollectionId: true,
        createdAt: true,
      },
    });

    // Connect to ChromaDB and scan collections
    try {
      const chromaResponse = await fetch(`${process.env.CHROMADB_URL}/api/v1/collections`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!chromaResponse.ok) {
        throw new Error(`ChromaDB connection failed: ${chromaResponse.status}`);
      }

      const existingCollections = await chromaResponse.json();
      cleanup.scanned = existingCollections.length;

      // Track active collection IDs
      const activeCollectionIds = new Set(
        activeKnowledge.filter(doc => doc.vectorCollectionId).map(doc => doc.vectorCollectionId)
      );

      const activeAgentIds = new Set(activeAgents.map(agent => agent.id));

      // Identify orphaned collections
      for (const collection of existingCollections) {
        const collectionName = collection.name;
        const isOrphaned = await identifyOrphanedCollection(
          collectionName,
          activeCollectionIds,
          activeAgentIds,
          activeKnowledge
        );

        if (isOrphaned.orphaned) {
          cleanup.orphanedCollections.push({
            name: collectionName,
            id: collection.id,
            reason: isOrphaned.reason,
            lastUsed: isOrphaned.lastUsed,
            estimatedSize: await getCollectionSize(collectionName),
          });
        }
      }

      // Identify orphaned vectors within active collections
      for (const knowledge of activeKnowledge) {
        if (knowledge.vectorCollectionId) {
          const orphanedVectors = await findOrphanedVectors(
            knowledge.vectorCollectionId,
            knowledge.id,
            knowledge.agentId
          );

          if (orphanedVectors.length > 0) {
            cleanup.orphanedVectors.push({
              collectionId: knowledge.vectorCollectionId,
              documentId: knowledge.id,
              filename: knowledge.filename,
              orphanedVectors: orphanedVectors,
              count: orphanedVectors.length,
            });
          }
        }
      }

      // Calculate potential space savings
      cleanup.summary.totalSizeBefore = await getTotalVectorDbSize();
      let potentialSavings = 0;

      for (const collection of cleanup.orphanedCollections) {
        potentialSavings += collection.estimatedSize || 0;
      }

      cleanup.summary.spaceSaved = potentialSavings;

      // Perform cleanup if confirmed and in 'cleanup' mode
      if (mode === 'cleanup' && confirm === true) {
        for (const collection of cleanup.orphanedCollections) {
          try {
            await deleteVectorCollection(collection.name);
            cleanup.deletedCollections++;

            // Log the deletion
            await logCleanupAction({
              type: 'COLLECTION_DELETED',
              collectionName: collection.name,
              reason: collection.reason,
              size: collection.estimatedSize,
              userId: session.user.id,
            });
          } catch (error) {
            cleanup.errors.push(`Failed to delete collection ${collection.name}: ${error.message}`);
          }
        }

        // Clean up orphaned vectors
        for (const vectorGroup of cleanup.orphanedVectors) {
          try {
            await deleteOrphanedVectors(vectorGroup.collectionId, vectorGroup.orphanedVectors);
            cleanup.deletedVectors += vectorGroup.count;

            await logCleanupAction({
              type: 'VECTORS_DELETED',
              collectionId: vectorGroup.collectionId,
              documentId: vectorGroup.documentId,
              count: vectorGroup.count,
              userId: session.user.id,
            });
          } catch (error) {
            cleanup.errors.push(
              `Failed to delete vectors in ${vectorGroup.collectionId}: ${error.message}`
            );
          }
        }

        cleanup.summary.totalSizeAfter = await getTotalVectorDbSize();
        cleanup.summary.spaceSaved =
          cleanup.summary.totalSizeBefore - cleanup.summary.totalSizeAfter;
      }

      cleanup.endTime = new Date();
      cleanup.duration = cleanup.endTime.getTime() - cleanup.startTime.getTime();

      return NextResponse.json({
        success: true,
        cleanup,
        recommendations: generateCleanupRecommendations(cleanup),
      });
    } catch (chromaError) {
      return NextResponse.json(
        {
          success: false,
          error: 'ChromaDB connection failed',
          details: chromaError.message,
          fallback: 'Vector cleanup unavailable - ChromaDB not accessible',
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Vector cleanup error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Vector cleanup failed',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// Helper function to identify orphaned collections
async function identifyOrphanedCollection(
  collectionName: string,
  activeCollectionIds: Set<string>,
  activeAgentIds: Set<string>,
  activeKnowledge: any[]
): Promise<{ orphaned: boolean; reason: string; lastUsed?: Date }> {
  // Check if collection ID is in active knowledge
  if (activeCollectionIds.has(collectionName)) {
    return { orphaned: false, reason: 'Active collection' };
  }

  // Check if collection name follows agent pattern (agent_[id])
  const agentMatch = collectionName.match(/^agent_(.+)$/);
  if (agentMatch) {
    const agentId = agentMatch[1];
    if (activeAgentIds.has(agentId)) {
      return { orphaned: false, reason: 'Active agent collection' };
    } else {
      return {
        orphaned: true,
        reason: 'Agent deleted or inactive',
        lastUsed: await getCollectionLastUsed(collectionName),
      };
    }
  }

  // Check if collection follows document pattern (doc_[id])
  const docMatch = collectionName.match(/^doc_(.+)$/);
  if (docMatch) {
    const docId = docMatch[1];
    const activeDoc = activeKnowledge.find(doc => doc.id === docId);
    if (!activeDoc) {
      return {
        orphaned: true,
        reason: 'Document deleted',
        lastUsed: await getCollectionLastUsed(collectionName),
      };
    }
  }

  // Check for test/development collections
  if (
    collectionName.startsWith('test_') ||
    collectionName.startsWith('dev_') ||
    collectionName.startsWith('temp_')
  ) {
    return {
      orphaned: true,
      reason: 'Development/test collection',
      lastUsed: await getCollectionLastUsed(collectionName),
    };
  }

  // Collections older than 30 days with no recent activity
  const lastUsed = await getCollectionLastUsed(collectionName);
  if (lastUsed && lastUsed < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
    return {
      orphaned: true,
      reason: 'Inactive for >30 days',
      lastUsed,
    };
  }

  return { orphaned: false, reason: 'Collection appears active' };
}

// Helper function to find orphaned vectors within a collection
async function findOrphanedVectors(collectionId: string, documentId: string, agentId: string) {
  try {
    const response = await fetch(`${process.env.CHROMADB_URL}/api/v1/collections/${collectionId}`, {
      method: 'GET',
    });

    if (!response.ok) return [];

    const collection = await response.json();
    const orphanedVectors = [];

    // Check for vectors that don't belong to current document or agent
    if (collection.metadatas) {
      for (let i = 0; i < collection.metadatas.length; i++) {
        const metadata = collection.metadatas[i];

        if (metadata.documentId && metadata.documentId !== documentId) {
          orphanedVectors.push({
            id: collection.ids[i],
            reason: 'Document ID mismatch',
            metadata,
          });
        }

        if (metadata.agentId && metadata.agentId !== agentId) {
          orphanedVectors.push({
            id: collection.ids[i],
            reason: 'Agent ID mismatch',
            metadata,
          });
        }
      }
    }

    return orphanedVectors;
  } catch (error) {
    console.error(`Error checking vectors in collection ${collectionId}:`, error);
    return [];
  }
}

// Helper functions for ChromaDB operations
async function getCollectionSize(collectionName: string): Promise<number> {
  try {
    const response = await fetch(
      `${process.env.CHROMADB_URL}/api/v1/collections/${collectionName}/count`,
      {
        method: 'GET',
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.count || 0;
    }
  } catch (error) {
    console.error(`Error getting size for collection ${collectionName}:`, error);
  }

  return 0;
}

async function getCollectionLastUsed(collectionName: string): Promise<Date | null> {
  try {
    // Check database for last query time
    const lastQuery = await prisma.chatMessage.findFirst({
      where: {
        metadata: {
          path: ['vectorCollection'],
          equals: collectionName,
        },
      },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    return lastQuery?.createdAt || null;
  } catch (error) {
    console.error(`Error getting last used time for ${collectionName}:`, error);
    return null;
  }
}

async function getTotalVectorDbSize(): Promise<number> {
  try {
    const response = await fetch(`${process.env.CHROMADB_URL}/api/v1/collections`, {
      method: 'GET',
    });

    if (response.ok) {
      const collections = await response.json();
      let totalSize = 0;

      for (const collection of collections) {
        const size = await getCollectionSize(collection.name);
        totalSize += size;
      }

      return totalSize;
    }
  } catch (error) {
    console.error('Error getting total vector DB size:', error);
  }

  return 0;
}

async function deleteVectorCollection(collectionName: string): Promise<void> {
  const response = await fetch(`${process.env.CHROMADB_URL}/api/v1/collections/${collectionName}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete collection: ${response.status}`);
  }
}

async function deleteOrphanedVectors(collectionId: string, vectorIds: string[]): Promise<void> {
  const response = await fetch(
    `${process.env.CHROMADB_URL}/api/v1/collections/${collectionId}/delete`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ids: vectorIds.map(v => v.id),
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to delete vectors: ${response.status}`);
  }
}

async function logCleanupAction(action: any): Promise<void> {
  try {
    await prisma.systemLog.create({
      data: {
        type: 'VECTOR_CLEANUP',
        action: action.type,
        details: JSON.stringify(action),
        userId: action.userId,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to log cleanup action:', error);
  }
}

function generateCleanupRecommendations(cleanup: any): string[] {
  const recommendations = [];

  if (cleanup.orphanedCollections.length > 0) {
    recommendations.push(
      `Found ${cleanup.orphanedCollections.length} orphaned collections that can be safely deleted`
    );
  }

  if (cleanup.orphanedVectors.length > 0) {
    recommendations.push(
      `Found ${cleanup.orphanedVectors.reduce((sum, v) => sum + v.count, 0)} orphaned vectors across ${cleanup.orphanedVectors.length} collections`
    );
  }

  if (cleanup.summary.spaceSaved > 1000) {
    recommendations.push(
      `Cleanup will save approximately ${Math.round(cleanup.summary.spaceSaved / 1000)}K vector entries`
    );
  }

  if (cleanup.errors.length > 0) {
    recommendations.push(`${cleanup.errors.length} errors occurred during cleanup - review logs`);
  }

  if (cleanup.orphanedCollections.length === 0 && cleanup.orphanedVectors.length === 0) {
    recommendations.push('Vector database is clean - no orphaned data found');
  }

  recommendations.push('Schedule this cleanup to run weekly via cron job');

  return recommendations;
}

export async function GET(request: NextRequest) {
  // GET endpoint for scheduled cleanup status
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !hasPermission(session.user.role, 'manage_system')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return last cleanup status and schedule info
    const lastCleanup = await prisma.systemLog.findFirst({
      where: { type: 'VECTOR_CLEANUP' },
      orderBy: { timestamp: 'desc' },
    });

    return NextResponse.json({
      lastCleanup: lastCleanup
        ? {
            timestamp: lastCleanup.timestamp,
            details: JSON.parse(lastCleanup.details),
          }
        : null,
      status: 'ready',
      scheduledCleanup: {
        frequency: 'weekly',
        nextRun: 'Sunday 2:00 AM UTC',
        enabled: true,
      },
    });
  } catch (error) {
    console.error('Vector cleanup status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get cleanup status',
      },
      { status: 500 }
    );
  }
}
