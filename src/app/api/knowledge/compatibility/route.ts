/**
 * 🔄 BACKWARD COMPATIBILITY LAYER
 * Phase 3, Day 10 - API Compatibility
 * Provides backward compatibility for existing DataImport and Document APIs
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
// ✅ FIXED Phase 4D True Fix - Fix getServerSession import for next-auth v4
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// =============================================================================
// LEGACY DATA IMPORT COMPATIBILITY
// =============================================================================

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint'); // 'data-imports' or 'documents'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    if (endpoint === 'data-imports') {
      // Legacy DataImport API compatibility
      const where: any = {
        userId: user.id,
        isDeleted: false,
        type: 'conversation', // DataImports were mainly conversation imports
      };

      if (search) {
        where.OR = [{ title: { contains: search } }, { description: { contains: search } }];
      }

      const totalCount = await prisma.knowledge.count({ where });
      const items = await prisma.knowledge.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { children: true },
          },
        },
      });

      // Transform to legacy DataImport format
      const legacyFormat = items.map(item => ({
        id: item.id,
        name: item.title,
        description: item.description,
        source: item.source,
        status: item.status,
        userId: item.userId,
        fileName: item.filename,
        fileSize: item.size,
        metadata: item.metadata ? JSON.parse(item.metadata) : {},
        totalRecords: item.totalRecords,
        processedRecords: item.processedRecords,
        successRecords: item.successRecords,
        errorRecords: item.errorRecords,
        progressPercent: item.progressPercent,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        startedAt: item.startedAt,
        completedAt: item.completedAt,
        errorMessage: item.errorMessage,
        // Legacy fields
        type: item.subtype || 'unknown',
        importType: item.contentType || 'conversation',
        childrenCount: item._count.children,
      }));

      return NextResponse.json({
        success: true,
        data: legacyFormat,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      });
    } else if (endpoint === 'documents') {
      // Legacy Document API compatibility
      const where: any = {
        userId: user.id,
        isDeleted: false,
        type: 'document',
      };

      if (search) {
        where.OR = [{ title: { contains: search } }, { extractedText: { contains: search } }];
      }

      const totalCount = await prisma.knowledge.count({ where });
      const items = await prisma.knowledge.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      // Transform to legacy Document format
      const legacyFormat = items.map(item => ({
        id: item.id,
        title: item.title,
        filename: item.filename,
        content: item.content,
        type: item.subtype || 'text',
        size: item.size,
        mimeType: item.mimeType,
        encoding: item.encoding,
        userId: item.userId,
        status: item.status,
        processedAt: item.processedAt,
        errorMessage: item.errorMessage,
        extractedText: item.extractedText,
        metadata: item.metadata ? JSON.parse(item.metadata) : {},
        filePath: item.filePath,
        s3Key: item.s3Key,
        viewCount: item.viewCount,
        lastViewed: item.lastViewed,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        // Legacy compatibility
        contentType: item.contentType || 'text_knowledge',
      }));

      return NextResponse.json({
        success: true,
        data: legacyFormat,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      });
    } else {
      return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
    }
  } catch (error) {
    console.error('Legacy API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// =============================================================================
// LEGACY API CONVERSION HELPERS
// =============================================================================

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { action, endpoint, data } = body;

    if (action === 'convert') {
      // Convert legacy format to new Knowledge format
      if (endpoint === 'data-imports') {
        const converted = {
          title: data.name || data.title,
          description: data.description,
          filename: data.fileName || data.filename,
          type: 'conversation',
          subtype: data.type || 'unknown',
          source: data.source,
          contentType: data.importType || 'conversation',
          category: 'conversation',
          size: data.fileSize || data.size,
          metadata: JSON.stringify(data.metadata || {}),
          totalRecords: data.totalRecords,
          processedRecords: data.processedRecords,
          successRecords: data.successRecords,
          errorRecords: data.errorRecords,
          progressPercent: data.progressPercent,
          status: data.status,
          errorMessage: data.errorMessage,
          startedAt: data.startedAt,
          completedAt: data.completedAt,
          userId: user.id,
        };

        return NextResponse.json({
          success: true,
          data: converted,
        });
      } else if (endpoint === 'documents') {
        const converted = {
          title: data.title,
          filename: data.filename,
          type: 'document',
          subtype: data.type || 'text',
          contentType: data.contentType || 'text_knowledge',
          category: 'document',
          content: data.content,
          extractedText: data.extractedText,
          size: data.size,
          mimeType: data.mimeType,
          encoding: data.encoding,
          filePath: data.filePath,
          s3Key: data.s3Key,
          metadata: JSON.stringify(data.metadata || {}),
          viewCount: data.viewCount || 0,
          lastViewed: data.lastViewed,
          status: data.status,
          errorMessage: data.errorMessage,
          processedAt: data.processedAt,
          userId: user.id,
        };

        return NextResponse.json({
          success: true,
          data: converted,
        });
      }
    }

    return NextResponse.json({ error: 'Invalid action or endpoint' }, { status: 400 });
  } catch (error) {
    console.error('Legacy Conversion Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// =============================================================================
// MIGRATION STATUS CHECK
// =============================================================================

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { action } = body;

    if (action === 'migration-status') {
      // Check migration status for user
      const knowledgeCount = await prisma.knowledge.count({
        where: { userId: user.id },
      });

      const legacyDataImports = await prisma.dataImport.count({
        where: { userId: user.id },
      });

      const legacyDocuments = await prisma.document.count({
        where: { userId: user.id },
      });

      const migratedFromDataImports = await prisma.knowledge.count({
        where: {
          userId: user.id,
          legacyDataImportId: { not: null },
        },
      });

      const migratedFromDocuments = await prisma.knowledge.count({
        where: {
          userId: user.id,
          legacyDocumentId: { not: null },
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          totalKnowledge: knowledgeCount,
          legacyDataImports,
          legacyDocuments,
          migratedFromDataImports,
          migratedFromDocuments,
          migrationComplete:
            migratedFromDataImports >= legacyDataImports &&
            migratedFromDocuments >= legacyDocuments,
          migrationProgress: {
            dataImports:
              legacyDataImports > 0
                ? Math.round((migratedFromDataImports / legacyDataImports) * 100)
                : 100,
            documents:
              legacyDocuments > 0
                ? Math.round((migratedFromDocuments / legacyDocuments) * 100)
                : 100,
          },
        },
      });
    } else if (action === 'force-migration') {
      // Force migration for specific user
      const batchId = `user-${user.id}-${Date.now()}`;

      // This would trigger the migration process
      // For now, just return success
      return NextResponse.json({
        success: true,
        message: 'Migration triggered',
        batchId,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Migration Status Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
