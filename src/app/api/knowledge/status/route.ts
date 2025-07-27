/**
 * 📊 KNOWLEDGE PROCESSING STATUS API
 * Real-time status tracking for processing pipeline
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface KnowledgeMetadata {
  vectorized?: boolean;
  collectionName?: string;
  [key: string]: any;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const itemIds = searchParams.get('itemIds')?.split(',') || [];

    if (itemIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No item IDs provided',
        },
        { status: 400 }
      );
    }

    // Get current status of items
    const [documents, dataImports] = await Promise.all([
      prisma.document.findMany({
        where: {
          id: { in: itemIds },
          userId: session.user.id,
        },
        select: {
          id: true,
          title: true,
          status: true,
          metadata: true,
          processedAt: true,
          errorMessage: true,
          updatedAt: true,
        },
      }),
      prisma.dataImport.findMany({
        where: {
          id: { in: itemIds },
          userId: session.user.id,
        },
        select: {
          id: true,
          name: true,
          status: true,
          metadata: true,
          startedAt: true,
          completedAt: true,
          errorMessage: true,
          updatedAt: true,
          progressPercent: true,
        },
      }),
    ]);

    // Transform to unified status format
    const statusItems = [
      ...documents.map(doc => {
        let metadata: KnowledgeMetadata = {};
        try {
          metadata =
            typeof doc.metadata === 'string' ? JSON.parse(doc.metadata) : doc.metadata || {};
        } catch {
          metadata = {};
        }

        return {
          id: doc.id,
          title: doc.title,
          type: 'document',
          status: doc.status,
          vectorized: metadata.vectorized || false,
          collectionName: metadata.collectionName || null,
          processedAt: doc.processedAt?.toISOString() || null,
          errorMessage: doc.errorMessage,
          lastUpdated: doc.updatedAt.toISOString(),
          metadata,
        };
      }),
      ...dataImports.map(imp => {
        let metadata: KnowledgeMetadata = {};
        try {
          metadata =
            typeof imp.metadata === 'string' ? JSON.parse(imp.metadata) : imp.metadata || {};
        } catch {
          metadata = {};
        }

        return {
          id: imp.id,
          title: imp.name,
          type: 'data-import',
          status: imp.status,
          vectorized: metadata.vectorized || false,
          collectionName: metadata.collectionName || null,
          processedAt: imp.completedAt?.toISOString() || null,
          errorMessage: imp.errorMessage,
          lastUpdated: imp.updatedAt.toISOString(),
          progressPercent: imp.progressPercent || 0,
          metadata,
        };
      }),
    ];

    // Calculate overall progress
    const totalItems = statusItems.length;
    const completedItems = statusItems.filter(
      item => item.status === 'completed' && item.vectorized
    ).length;
    const processingItems = statusItems.filter(item => item.status === 'processing').length;
    const failedItems = statusItems.filter(item => item.status === 'failed').length;

    const overallProgress = {
      total: totalItems,
      completed: completedItems,
      processing: processingItems,
      failed: failedItems,
      pending: totalItems - completedItems - processingItems - failedItems,
      completionRate: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
    };

    return NextResponse.json({
      success: true,
      items: statusItems,
      progress: overallProgress,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Status tracking failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Status tracking failed',
      },
      { status: 500 }
    );
  }
}

// POST method to update item status manually
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { itemId, status, metadata = {} } = body;

    if (!itemId || !status) {
      return NextResponse.json(
        {
          success: false,
          error: 'Item ID and status are required',
        },
        { status: 400 }
      );
    }

    // Update status in both possible tables
    const [updatedDoc, updatedImport] = await Promise.all([
      prisma.document.updateMany({
        where: {
          id: itemId,
          userId: session.user.id,
        },
        data: {
          status,
          metadata: JSON.stringify(metadata),
          processedAt: status === 'completed' ? new Date() : undefined,
        },
      }),
      prisma.dataImport.updateMany({
        where: {
          id: itemId,
          userId: session.user.id,
        },
        data: {
          status,
          metadata: JSON.stringify(metadata),
          completedAt: status === 'completed' ? new Date() : undefined,
        },
      }),
    ]);

    if (updatedDoc.count === 0 && updatedImport.count === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Item not found or no permission',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      updated: updatedDoc.count + updatedImport.count,
      status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Status update failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Status update failed',
      },
      { status: 500 }
    );
  }
}
