/**
 * 🧪 TEST DATA API - Create test knowledge data
 * Temporary endpoint to create test data for debugging knowledge issues
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Test data creation only allowed in development' }, { status: 403 });
    }

    const userId = session.user.id;

    // Create test documents
    const testDocuments = [
      {
        title: 'Test Document 1',
        filename: 'test-doc-1.pdf',
        type: 'document',
        status: 'completed',
        size: 1024 * 50, // 50KB
        mimeType: 'application/pdf',
        content: 'This is a test document for debugging knowledge preview functionality.',
        extractedText: 'This is a test document for debugging knowledge preview functionality.',
        metadata: {
          vectorized: true,
          language: 'en',
          pageCount: 1,
          createdBy: 'test-system'
        },
        userId,
      },
      {
        title: 'Test Document 2',
        filename: 'test-doc-2.docx',
        type: 'document',
        status: 'processing',
        size: 1024 * 75, // 75KB
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        content: 'This is another test document to verify knowledge system functionality.',
        extractedText: 'This is another test document to verify knowledge system functionality.',
        metadata: {
          vectorized: false,
          language: 'en',
          wordCount: 100,
          createdBy: 'test-system'
        },
        userId,
      }
    ];

    // Create test data imports
    const testDataImports = [
      {
        name: 'Test Data Import 1',
        description: 'Test data import for debugging',
        fileName: 'test-import-1.json',
        status: 'completed',
        fileSize: 1024 * 100, // 100KB
        source: 'test',
        totalRecords: 50,
        processedRecords: 50,
        successRecords: 48,
        errorRecords: 2,
        metadata: {
          importType: 'test',
          language: 'en',
          createdBy: 'test-system'
        },
        userId,
      }
    ];

    // Insert test documents
    const createdDocuments = await prisma.document.createMany({
      data: testDocuments,
      skipDuplicates: true,
    });

    // Insert test data imports
    const createdDataImports = await prisma.dataImport.createMany({
      data: testDataImports,
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      message: 'Test data created successfully',
      data: {
        documentsCreated: createdDocuments.count,
        dataImportsCreated: createdDataImports.count,
        totalItems: createdDocuments.count + createdDataImports.count,
      },
    });
  } catch (error) {
    console.error('❌ Test Data API Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      debug: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 