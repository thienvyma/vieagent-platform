/**
 * 📚 UNIFIED KNOWLEDGE API ENDPOINTS
 * Phase 3, Day 10 - API Endpoint Updates + Processing Pipeline
 * Unified API for DataImport and Document models with Vector Processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { vectorKnowledgeService } from '@/lib/vector-knowledge-service';

// Data transform helper function for unified items
function transform(item: any) {
  return {
    ...item,
    transformedAt: new Date().toISOString(),
    validated: true,
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build where conditions
    const searchConditions = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { filename: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const statusConditions = status !== 'all' ? { status } : {};

    const whereConditions = {
      userId: session.user.id,
      ...searchConditions,
      ...statusConditions,
    };

    // Build order by
    let orderBy: any = {};
    switch (sortBy) {
      case 'name':
        orderBy = { title: sortOrder };
        break;
      case 'date':
        orderBy = { createdAt: sortOrder };
        break;
      case 'size':
        orderBy = { size: sortOrder };
        break;
      case 'status':
        orderBy = { status: sortOrder };
        break;
      default:
        orderBy = { createdAt: sortOrder };
    }

    // Fetch documents from both tables
    const [documents, dataImports, totalDocuments, totalDataImports] = await Promise.all([
      prisma.document.findMany({
        where: whereConditions,
        orderBy,
        skip: (page - 1) * limit,
        take: Math.ceil(limit / 2), // Split between documents and imports
        select: {
          id: true,
          title: true,
          filename: true,
          type: true,
          status: true,
          size: true,
          mimeType: true,
          metadata: true,
          content: true,
          extractedText: true,
          createdAt: true,
          updatedAt: true,
          processedAt: true,
        },
      }),
      prisma.dataImport.findMany({
        where: whereConditions,
        orderBy,
        skip: (page - 1) * limit,
        take: Math.floor(limit / 2), // Split between documents and imports
        select: {
          id: true,
          name: true,
          description: true,
          source: true,
          fileName: true,
          status: true,
          fileSize: true,
          metadata: true,
          createdAt: true,
          updatedAt: true,
          startedAt: true,
          completedAt: true,
          totalRecords: true,
          processedRecords: true,
          successRecords: true,
          errorRecords: true,
        },
      }),
      prisma.document.count({ where: whereConditions }),
      prisma.dataImport.count({ where: whereConditions }),
    ]);

    // Transform data to unified format
    const unifiedItems = [
      ...documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        description: doc.content?.substring(0, 200) || '',
        filename: doc.filename,
        type: doc.type,
        subtype: doc.type,
        source: 'document',
        contentType: doc.mimeType || 'unknown',
        status: doc.status,
        size: doc.size || 0,
        mimeType: doc.mimeType,
        viewCount: 0, // Could be added to schema later
        downloadCount: 0,
        shareCount: 0,
        isPublic: false,
        isArchived: false,
        tags: [],
        metadata: doc.metadata || {},
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
        processedAt: doc.processedAt?.toISOString(),
        completedAt: null, // Document doesn't have completedAt
        // Analytics and usage stats
        usageStats: {
          viewCount: 0,
          downloadCount: 0,
          lastAccessed: doc.updatedAt.toISOString(),
          popularityScore: 0,
        },
        metrics: {
          processingTime:
            doc.processedAt && doc.createdAt
              ? new Date(doc.processedAt).getTime() - new Date(doc.createdAt).getTime()
              : null,
          fileSize: doc.size || 0,
          wordCount: doc.content ? doc.content.split(' ').length : 0,
        },
        performance: {
          avgResponseTime: 150, // milliseconds
          successRate: doc.status === 'completed' ? 1.0 : 0.0,
          errorRate: doc.status === 'failed' ? 1.0 : 0.0,
        },
      })),
      ...dataImports.map(imp => ({
        id: imp.id,
        title: imp.name,
        description: imp.description || '',
        filename: imp.fileName || '',
        type: 'import', // DataImport doesn't have type field
        subtype: 'import',
        source: 'data-import',
        contentType: 'application/json',
        status: imp.status,
        size: imp.fileSize || 0,
        mimeType: 'application/json',
        progressPercent: imp.totalRecords
          ? Math.round(((imp.processedRecords || 0) / imp.totalRecords) * 100)
          : 0,
        totalRecords: imp.totalRecords,
        processedRecords: imp.processedRecords,
        successRecords: imp.successRecords,
        errorRecords: imp.errorRecords,
        viewCount: 0,
        downloadCount: 0,
        shareCount: 0,
        isPublic: false,
        isArchived: false,
        tags: [],
        metadata: imp.metadata || {},
        createdAt: imp.createdAt.toISOString(),
        updatedAt: imp.updatedAt.toISOString(),
        processedAt: imp.startedAt?.toISOString(),
        completedAt: imp.completedAt?.toISOString(),
      })),
    ];

    // Re-sort unified items if needed
    unifiedItems.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'size':
          comparison = (a.size || 0) - (b.size || 0);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        default:
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    const total = totalDocuments + totalDataImports;

    console.log('✅ Knowledge API: Returning data', {
      itemsCount: unifiedItems.length,
      totalDocuments,
      totalDataImports,
      total,
      userId: session.user.id
    });

    return NextResponse.json({
      success: true,
      data: {
        items: unifiedItems,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
        summary: {
          documents: totalDocuments,
          dataImports: totalDataImports,
          total,
        },
      },
    });
  } catch (error) {
    console.error('Knowledge API Error:', error);

    // Enhanced error handling with fallbacks
    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('database')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Database connection error',
            fallback: 'Please try again in a few moments',
            retry: true,
            timestamp: new Date().toISOString(),
          },
          { status: 503 }
        );
      }

      if (error.message.includes('timeout')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Request timeout',
            fallback: 'The request took too long to process',
            retry: true,
            timestamp: new Date().toISOString(),
          },
          { status: 408 }
        );
      }
    }

    // Generic error with recovery suggestions
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch knowledge items',
        fallback: 'Something went wrong while fetching knowledge items',
        recovery: {
          suggestions: [
            'Check your internet connection',
            'Try refreshing the page',
            'Contact support if the problem persists',
          ],
          retryAfter: 5000, // 5 seconds
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, itemIds, data } = body;

    switch (action) {
      case 'process':
        // 🧠 UNIFIED PROCESSING PIPELINE: Upload → Parse → Chunk → Vectorize → Store
        console.log(`🚀 Starting unified processing pipeline for ${itemIds.length} items...`);

        // Fetch documents to process
        const [documentsToProcess, dataImportsToProcess] = await Promise.all([
          prisma.document.findMany({
            where: {
              id: { in: itemIds },
              userId: session.user.id,
              status: { in: ['uploaded', 'pending', 'failed'] }, // Only process unprocessed items
            },
            select: {
              id: true,
              title: true,
              filename: true,
              content: true,
              extractedText: true,
              metadata: true,
            },
          }),
          prisma.dataImport.findMany({
            where: {
              id: { in: itemIds },
              userId: session.user.id,
              status: { in: ['uploaded', 'pending', 'failed'] },
            },
            select: {
              id: true,
              name: true,
              description: true,
              metadata: true,
            },
          }),
        ]);

        // Transform to unified format for processing
        const documentsForVector = [
          ...documentsToProcess.map(doc => ({
            id: doc.id,
            content: doc.extractedText || doc.content || doc.title,
            metadata: {
              source: 'document',
              title: doc.title,
              filename: doc.filename,
              originalMetadata: doc.metadata,
              userId: session.user.id,
            },
          })),
          ...dataImportsToProcess.map(imp => ({
            id: imp.id,
            content: imp.description || imp.name,
            metadata: {
              source: 'data-import',
              title: imp.name,
              description: imp.description,
              originalMetadata: imp.metadata,
              userId: session.user.id,
            },
          })),
        ];

        if (documentsForVector.length === 0) {
          return NextResponse.json(
            {
              success: false,
              error: 'No documents available for processing',
            },
            { status: 400 }
          );
        }

        // Update status to processing
        await Promise.all([
          prisma.document.updateMany({
            where: { id: { in: documentsToProcess.map(d => d.id) } },
            data: { status: 'processing', processedAt: new Date() },
          }),
          prisma.dataImport.updateMany({
            where: { id: { in: dataImportsToProcess.map(d => d.id) } },
            data: { status: 'processing', startedAt: new Date() },
          }),
        ]);

        try {
          // 🧠 BATCH PROCESS THROUGH VECTOR KNOWLEDGE SERVICE
          const collectionName = `user_${session.user.id}_knowledge`;
          const processingResult = await vectorKnowledgeService.processDocuments(
            documentsForVector,
            collectionName
          );

          console.log(
            `✅ Processing complete: ${processingResult.processed} processed, ${processingResult.failed} failed`
          );

          // Update status based on results
          const successIds = processingResult.vectors.map(v => v.documentId);
          const failedIds = documentsForVector
            .filter(d => !successIds.includes(d.id))
            .map(d => d.id);

          // Update successful documents
          if (successIds.length > 0) {
            await Promise.all([
              prisma.document.updateMany({
                where: {
                  id: { in: successIds.filter(id => documentsToProcess.some(d => d.id === id)) },
                },
                data: {
                  status: 'completed',
                  processedAt: new Date(),
                  metadata: JSON.stringify({
                    vectorized: true,
                    collectionName,
                    processedAt: new Date().toISOString(),
                  }),
                },
              }),
              prisma.dataImport.updateMany({
                where: {
                  id: { in: successIds.filter(id => dataImportsToProcess.some(d => d.id === id)) },
                },
                data: {
                  status: 'completed',
                  completedAt: new Date(),
                  metadata: JSON.stringify({
                    vectorized: true,
                    collectionName,
                    processedAt: new Date().toISOString(),
                  }),
                },
              }),
            ]);
          }

          // Update failed documents
          if (failedIds.length > 0) {
            await Promise.all([
              prisma.document.updateMany({
                where: {
                  id: { in: failedIds.filter(id => documentsToProcess.some(d => d.id === id)) },
                },
                data: {
                  status: 'failed',
                  metadata: JSON.stringify({
                    vectorized: false,
                    errors: processingResult.errors,
                    failedAt: new Date().toISOString(),
                  }),
                },
              }),
              prisma.dataImport.updateMany({
                where: {
                  id: { in: failedIds.filter(id => dataImportsToProcess.some(d => d.id === id)) },
                },
                data: {
                  status: 'failed',
                  metadata: JSON.stringify({
                    vectorized: false,
                    errors: processingResult.errors,
                    failedAt: new Date().toISOString(),
                  }),
                },
              }),
            ]);
          }

          return NextResponse.json({
            success: true,
            processed: processingResult.processed,
            failed: processingResult.failed,
            vectors: processingResult.vectors.length,
            errors: processingResult.errors,
            collectionName,
            storageResult: processingResult.vectorStorageResult,
          });
        } catch (error) {
          console.error('❌ Processing pipeline failed:', error);

          // Mark all as failed
          await Promise.all([
            prisma.document.updateMany({
              where: { id: { in: documentsToProcess.map(d => d.id) } },
              data: {
                status: 'failed',
                metadata: JSON.stringify({
                  vectorized: false,
                  error: error instanceof Error ? error.message : 'Unknown error',
                  failedAt: new Date().toISOString(),
                }),
              },
            }),
            prisma.dataImport.updateMany({
              where: { id: { in: dataImportsToProcess.map(d => d.id) } },
              data: {
                status: 'failed',
                metadata: JSON.stringify({
                  vectorized: false,
                  error: error instanceof Error ? error.message : 'Unknown error',
                  failedAt: new Date().toISOString(),
                }),
              },
            }),
          ]);

          return NextResponse.json(
            {
              success: false,
              error: error instanceof Error ? error.message : 'Processing failed',
              processed: 0,
              failed: documentsForVector.length,
            },
            { status: 500 }
          );
        }

      case 'bulk-delete':
        // Delete from both tables
        const [deletedDocs, deletedImports] = await Promise.all([
          prisma.document.deleteMany({
            where: {
              id: { in: itemIds },
              userId: session.user.id,
            },
          }),
          prisma.dataImport.deleteMany({
            where: {
              id: { in: itemIds },
              userId: session.user.id,
            },
          }),
        ]);

        return NextResponse.json({
          success: true,
          deletedCount: deletedDocs.count + deletedImports.count,
        });

      case 'bulk-status-update':
        // Update status in both tables
        const [updatedDocs, updatedImports] = await Promise.all([
          prisma.document.updateMany({
            where: {
              id: { in: itemIds },
              userId: session.user.id,
            },
            data: { status: data.status },
          }),
          prisma.dataImport.updateMany({
            where: {
              id: { in: itemIds },
              userId: session.user.id,
            },
            data: { status: data.status },
          }),
        ]);

        return NextResponse.json({
          success: true,
          updatedCount: updatedDocs.count + updatedImports.count,
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Knowledge API POST Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process request',
      },
      { status: 500 }
    );
  }
}
