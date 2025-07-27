/**
 * 📚 INDIVIDUAL KNOWLEDGE ITEM API
 * Phase 3, Day 10 - Individual Knowledge Item Management
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
// ✅ FIXED Phase 4D True Fix - Fix getServerSession import for next-auth v4
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// =============================================================================
// GET - GET KNOWLEDGE ITEM BY ID
// =============================================================================

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = await params;

    // Find knowledge item with full details
    const knowledge = await prisma.knowledge.findFirst({
      where: {
        id,
        userId: user.id,
        isDeleted: false,
      },
      include: {
        parent: {
          select: { id: true, title: true, type: true, path: true },
        },
        children: {
          where: { isDeleted: false },
          select: {
            id: true,
            title: true,
            type: true,
            subtype: true,
            status: true,
            size: true,
            progressPercent: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        analytics: {
          select: {
            eventType: true,
            eventData: true,
            timestamp: true,
          },
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
        insights: {
          select: {
            insightType: true,
            insightData: true,
            confidence: true,
            generatedAt: true,
          },
          orderBy: { generatedAt: 'desc' },
        },
        processingHistory: {
          select: {
            operation: true,
            status: true,
            details: true,
            duration: true,
            timestamp: true,
          },
          orderBy: { timestamp: 'desc' },
          take: 5,
        },
        shares: {
          select: {
            shareType: true,
            shareWith: true,
            permissions: true,
            createdAt: true,
            expiresAt: true,
          },
          where: {
            expiresAt: {
              gt: new Date(),
            },
          },
        },
        agentAssignments: {
          select: {
            agentId: true,
            priority: true,
            isActive: true,
            assignedAt: true,
            agent: {
              select: {
                id: true,
                name: true,
                description: true,
                status: true,
              },
            },
          },
          where: { isActive: true },
        },
        _count: {
          select: {
            children: true,
            analytics: true,
            insights: true,
            shares: true,
            agentAssignments: true,
          },
        },
      },
    });

    if (!knowledge) {
      return NextResponse.json({ error: 'Knowledge not found' }, { status: 404 });
    }

    // Update view count and last viewed
    await prisma.knowledge.update({
      where: { id },
      data: {
        viewCount: { increment: 1 },
        lastViewed: new Date(),
      },
    });

    // Log view event
    await prisma.knowledgeAnalytics.create({
      data: {
        knowledgeId: id,
        eventType: 'view',
        eventData: JSON.stringify({
          userAgent: request.headers.get('user-agent'),
          referer: request.headers.get('referer'),
        }),
      },
    });

    // Parse JSON fields
    const tags = knowledge.tags ? JSON.parse(knowledge.tags) : [];
    const metadata = knowledge.metadata ? JSON.parse(knowledge.metadata) : {};
    const processingConfig = knowledge.processingConfig
      ? JSON.parse(knowledge.processingConfig)
      : {};

    // Transform response
    const response = {
      id: knowledge.id,
      title: knowledge.title,
      description: knowledge.description,
      filename: knowledge.filename,
      type: knowledge.type,
      subtype: knowledge.subtype,
      source: knowledge.source,
      contentType: knowledge.contentType,
      category: knowledge.category,
      status: knowledge.status,

      // File information
      size: knowledge.size,
      mimeType: knowledge.mimeType,
      encoding: knowledge.encoding,
      fileHash: knowledge.fileHash,
      filePath: knowledge.filePath,
      s3Key: knowledge.s3Key,

      // Content
      content: knowledge.content,
      extractedText: knowledge.extractedText,
      rawContent: knowledge.rawContent,

      // Progress
      totalRecords: knowledge.totalRecords,
      processedRecords: knowledge.processedRecords,
      successRecords: knowledge.successRecords,
      errorRecords: knowledge.errorRecords,
      progressPercent: knowledge.progressPercent,

      // Analytics
      viewCount: knowledge.viewCount + 1, // Include the current view
      lastViewed: new Date(),
      downloadCount: knowledge.downloadCount,
      shareCount: knowledge.shareCount,

      // Hierarchy
      depth: knowledge.depth,
      path: knowledge.path,
      parent: knowledge.parent,
      children: knowledge.children,
      childrenCount: knowledge._count.children,

      // Access control
      isPublic: knowledge.isPublic,
      isArchived: knowledge.isArchived,

      // Metadata
      tags,
      metadata,
      processingConfig,

      // Relations
      analytics: knowledge.analytics.map(a => ({
        eventType: a.eventType,
        eventData: a.eventData ? JSON.parse(a.eventData) : null,
        timestamp: a.timestamp,
      })),
      insights: knowledge.insights.map(i => ({
        insightType: i.insightType,
        insightData: JSON.parse(i.insightData),
        confidence: i.confidence,
        generatedAt: i.generatedAt,
      })),
      processingHistory: knowledge.processingHistory.map(h => ({
        operation: h.operation,
        status: h.status,
        details: h.details ? JSON.parse(h.details) : null,
        duration: h.duration,
        timestamp: h.timestamp,
      })),
      shares: knowledge.shares,
      agentAssignments: knowledge.agentAssignments,

      // Counts
      analyticsCount: knowledge._count.analytics,
      insightsCount: knowledge._count.insights,
      sharesCount: knowledge._count.shares,
      agentAssignmentsCount: knowledge._count.agentAssignments,

      // Timestamps
      createdAt: knowledge.createdAt,
      updatedAt: knowledge.updatedAt,
      processedAt: knowledge.processedAt,
      startedAt: knowledge.startedAt,
      completedAt: knowledge.completedAt,
      errorMessage: knowledge.errorMessage,

      // Legacy compatibility
      name: knowledge.title,
      fileName: knowledge.filename,
      fileSize: knowledge.size,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Knowledge Item Get Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// =============================================================================
// PUT - UPDATE KNOWLEDGE ITEM
// =============================================================================

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = await params;
    const body = await request.json();

    // Find existing knowledge item
    const existingKnowledge = await prisma.knowledge.findFirst({
      where: { id, userId: user.id },
    });

    if (!existingKnowledge) {
      return NextResponse.json({ error: 'Knowledge not found' }, { status: 404 });
    }

    // Prepare update data
    const updateFields: any = {};

    // Basic fields
    if (body.title !== undefined) updateFields.title = body.title;
    if (body.description !== undefined) updateFields.description = body.description;
    if (body.status !== undefined) updateFields.status = body.status;
    if (body.content !== undefined) updateFields.content = body.content;
    if (body.extractedText !== undefined) updateFields.extractedText = body.extractedText;
    if (body.rawContent !== undefined) updateFields.rawContent = body.rawContent;
    if (body.errorMessage !== undefined) updateFields.errorMessage = body.errorMessage;
    if (body.isPublic !== undefined) updateFields.isPublic = body.isPublic;
    if (body.isArchived !== undefined) updateFields.isArchived = body.isArchived;
    if (body.category !== undefined) updateFields.category = body.category;
    if (body.contentType !== undefined) updateFields.contentType = body.contentType;

    // Progress fields
    if (body.totalRecords !== undefined) updateFields.totalRecords = body.totalRecords;
    if (body.processedRecords !== undefined) updateFields.processedRecords = body.processedRecords;
    if (body.successRecords !== undefined) updateFields.successRecords = body.successRecords;
    if (body.errorRecords !== undefined) updateFields.errorRecords = body.errorRecords;
    if (body.progressPercent !== undefined) updateFields.progressPercent = body.progressPercent;

    // Timestamps based on status
    if (body.status === 'PROCESSING' && !existingKnowledge.startedAt) {
      updateFields.startedAt = new Date();
    }
    if (body.status === 'COMPLETED' && !existingKnowledge.completedAt) {
      updateFields.completedAt = new Date();
      updateFields.processedAt = new Date();
    }
    if (body.status === 'FAILED' && !existingKnowledge.processedAt) {
      updateFields.processedAt = new Date();
    }

    // JSON fields
    if (body.tags !== undefined) updateFields.tags = JSON.stringify(body.tags);
    if (body.metadata !== undefined) updateFields.metadata = JSON.stringify(body.metadata);
    if (body.processingConfig !== undefined)
      updateFields.processingConfig = JSON.stringify(body.processingConfig);

    // Update the knowledge item
    const updatedKnowledge = await prisma.knowledge.update({
      where: { id },
      data: updateFields,
      include: {
        parent: {
          select: { id: true, title: true, type: true },
        },
        _count: {
          select: { children: true },
        },
      },
    });

    // Log update event
    await prisma.knowledgeAnalytics.create({
      data: {
        knowledgeId: id,
        eventType: 'update',
        eventData: JSON.stringify({
          updatedFields: Object.keys(updateFields),
          previousStatus: existingKnowledge.status,
          newStatus: updatedKnowledge.status,
        }),
      },
    });

    // Add to processing history
    await prisma.knowledgeProcessingHistory.create({
      data: {
        knowledgeId: id,
        operation: 'update',
        status: 'completed',
        details: JSON.stringify({
          updatedFields: Object.keys(updateFields),
          timestamp: new Date(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedKnowledge.id,
        title: updatedKnowledge.title,
        description: updatedKnowledge.description,
        status: updatedKnowledge.status,
        progressPercent: updatedKnowledge.progressPercent,
        processedRecords: updatedKnowledge.processedRecords,
        successRecords: updatedKnowledge.successRecords,
        errorRecords: updatedKnowledge.errorRecords,
        errorMessage: updatedKnowledge.errorMessage,
        isPublic: updatedKnowledge.isPublic,
        isArchived: updatedKnowledge.isArchived,
        parent: updatedKnowledge.parent,
        childrenCount: updatedKnowledge._count.children,
        updatedAt: updatedKnowledge.updatedAt,
        completedAt: updatedKnowledge.completedAt,
        processedAt: updatedKnowledge.processedAt,
      },
    });
  } catch (error) {
    console.error('Knowledge Item Update Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// =============================================================================
// DELETE - DELETE KNOWLEDGE ITEM
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';

    // Find existing knowledge item
    const existingKnowledge = await prisma.knowledge.findFirst({
      where: { id, userId: user.id },
      include: {
        children: {
          select: { id: true, title: true },
        },
      },
    });

    if (!existingKnowledge) {
      return NextResponse.json({ error: 'Knowledge not found' }, { status: 404 });
    }

    // Check if it has children
    if (existingKnowledge.children.length > 0 && permanent) {
      return NextResponse.json(
        {
          error: 'Cannot permanently delete item with children. Delete children first.',
        },
        { status: 400 }
      );
    }

    if (permanent) {
      // Permanent deletion - remove from database
      await prisma.knowledge.delete({
        where: { id },
      });
    } else {
      // Soft deletion - mark as deleted
      await prisma.knowledge.update({
        where: { id },
        data: { isDeleted: true },
      });

      // Also mark children as deleted
      await prisma.knowledge.updateMany({
        where: { parentId: id },
        data: { isDeleted: true },
      });
    }

    // Log deletion event
    await prisma.knowledgeAnalytics.create({
      data: {
        knowledgeId: id,
        eventType: 'delete',
        eventData: JSON.stringify({
          permanent,
          title: existingKnowledge.title,
          type: existingKnowledge.type,
          childrenCount: existingKnowledge.children.length,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: permanent ? 'Knowledge permanently deleted' : 'Knowledge moved to trash',
    });
  } catch (error) {
    console.error('Knowledge Item Deletion Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
