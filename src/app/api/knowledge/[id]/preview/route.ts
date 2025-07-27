/**
 * 🔍 KNOWLEDGE ITEM PREVIEW API
 * Detailed view for DocumentPreview component
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.error('❌ Preview API: No session or user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: itemId } = await params;
    console.log('🔍 Preview API: Fetching item', { itemId, userId: session.user.id });

    // Try to find in Documents table first
    const documentData = await prisma.document.findFirst({
      where: {
        id: itemId,
        userId: session.user.id,
      },
      select: {
        id: true,
        title: true,
        filename: true,
        type: true,
        status: true,
        size: true,
        mimeType: true,
        content: true,
        extractedText: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
        processedAt: true,
      },
    });

    if (documentData) {
      console.log('✅ Preview API: Found document', { id: documentData.id, title: documentData.title });
      
      // Format as document
      const formattedData = {
        id: documentData.id,
        title: documentData.title,
        filename: documentData.filename,
        type: documentData.type,
        subtype: documentData.type,
        contentType: documentData.mimeType || 'unknown',
        size: documentData.size || 0,
        status: documentData.status,
        content: documentData.content || documentData.extractedText || '',
        metadata: documentData.metadata || {},
        processingStats: {
          startTime: documentData.createdAt?.toISOString(),
          endTime: documentData.processedAt?.toISOString(),
          processingDuration:
            documentData.processedAt && documentData.createdAt
              ? (new Date(documentData.processedAt).getTime() -
                  new Date(documentData.createdAt).getTime()) /
                1000
              : null,
        },
        chunks: [], // TODO: Implement chunk fetching from vector DB
        vectorStatus: {
          indexed: documentData.status === 'completed',
          vectorCount: 0, // TODO: Get from vector DB
          lastIndexed: documentData.processedAt?.toISOString(),
          embeddingModel: 'text-embedding-3-small',
          dimensions: 1536,
          collection: `user_${session.user.id}_knowledge`,
        },
      };

      return NextResponse.json(formattedData);
    }

    // Try to find in DataImport table
    const dataImportData = await prisma.dataImport.findFirst({
      where: {
        id: itemId,
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        description: true,
        fileName: true,
        status: true,
        fileSize: true,
        metadata: true,
        source: true,
        totalRecords: true,
        processedRecords: true,
        successRecords: true,
        errorRecords: true,
        createdAt: true,
        updatedAt: true,
        startedAt: true,
        completedAt: true,
      },
    });

    if (dataImportData) {
      console.log('✅ Preview API: Found data import', { id: dataImportData.id, name: dataImportData.name });
      
      // Format as data import
      const formattedData = {
        id: dataImportData.id,
        title: dataImportData.name,
        filename: dataImportData.fileName || '',
        type: 'import',
        subtype: 'data-import',
        contentType: 'application/json',
        size: dataImportData.fileSize || 0,
        status: dataImportData.status,
        content: dataImportData.description || 'Data import item - use Stats tab for details',
        metadata: dataImportData.metadata || {},
        processingStats: {
          startTime: dataImportData.startedAt?.toISOString(),
          endTime: dataImportData.completedAt?.toISOString(),
          processingDuration:
            dataImportData.completedAt && dataImportData.startedAt
              ? (new Date(dataImportData.completedAt).getTime() -
                  new Date(dataImportData.startedAt).getTime()) /
                1000
              : null,
          totalRecords: dataImportData.totalRecords,
          processedRecords: dataImportData.processedRecords,
          successfulRecords: dataImportData.successRecords,
          failedRecords: dataImportData.errorRecords,
        },
        chunks: [], // Data imports may not have chunks
        vectorStatus: {
          indexed: dataImportData.status === 'completed',
          vectorCount: dataImportData.successRecords || 0,
          lastIndexed: dataImportData.completedAt?.toISOString(),
          embeddingModel: 'text-embedding-3-small',
          dimensions: 1536,
          collection: `user_${session.user.id}_knowledge`,
        },
      };

      return NextResponse.json(formattedData);
    }

    // Check if item exists in any table (for debugging)
    const documentExists = await prisma.document.findFirst({
      where: { id: itemId },
      select: { id: true, userId: true }
    });
    
    const dataImportExists = await prisma.dataImport.findFirst({
      where: { id: itemId },
      select: { id: true, userId: true }
    });

    console.log('🔍 Preview API: Item search results', {
      itemId,
      requestedUserId: session.user.id,
      documentExists: documentExists ? { id: documentExists.id, userId: documentExists.userId } : null,
      dataImportExists: dataImportExists ? { id: dataImportExists.id, userId: dataImportExists.userId } : null
    });

    // Item not found
    return NextResponse.json({ 
      error: 'Knowledge item not found',
      debug: {
        itemId,
        userId: session.user.id,
        documentExists: !!documentExists,
        dataImportExists: !!dataImportExists,
        message: 'Item may not exist or may belong to another user'
      }
    }, { status: 404 });
  } catch (error) {
    console.error('❌ Preview API Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      debug: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 });
  }
}
