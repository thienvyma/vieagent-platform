import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { DocumentParser } from '@/lib/parsers/document-parser';
import { vectorKnowledgeService } from '@/lib/vector-knowledge-service';

const prisma = new PrismaClient();
const documentParser = new DocumentParser({
  preserveFormatting: true,
  extractMetadata: true,
  performCleaning: true,
  detectLanguage: true,
  validateContent: true,
});

// File type validation
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
  'application/json',
  'text/markdown',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB (Vercel optimized)
const UPLOAD_DIR = 'uploads';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, message: 'Invalid file type' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, message: 'File too large' }, { status: 400 });
    }

    // Create upload directory if it doesn't exist
    try {
      await mkdir(UPLOAD_DIR, { recursive: true });
    } catch (err) {
      // Directory might already exist
    }

    // Generate unique filename
    const fileId = uuidv4();
    const fileExtension = path.extname(file.name);
    const fileName = `${fileId}${fileExtension}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create knowledge item record
    const knowledgeItem = {
      id: fileId,
      title: file.name,
      description: `Uploaded file: ${file.name}`,
      filename: file.name,
      type: getFileType(file.type),
      status: 'PENDING',
      size: file.size,
      filePath: filePath,
      mimeType: file.type,
      userId: session.user.id,
      metadata: JSON.stringify({
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        fileSize: file.size,
        mimeType: file.type,
      }),
    };

    // Save to database
    await prisma.knowledge.create({ data: knowledgeItem });

    // Start background processing
    processFileAsync(knowledgeItem);

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        id: fileId,
        fileName: file.name,
        size: file.size,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, message: 'Upload failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Return upload configuration
    return NextResponse.json({
      success: true,
      config: {
        maxFileSize: MAX_FILE_SIZE,
        allowedTypes: ALLOWED_TYPES,
        uploadDir: UPLOAD_DIR,
      },
    });
  } catch (error) {
    console.error('Get upload config error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get upload config' },
      { status: 500 }
    );
  }
}

// Helper functions
function getFileType(mimeType: string): string {
  const typeMap: Record<string, string> = {
    'application/pdf': 'document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
    'text/plain': 'document',
    'text/csv': 'document',
    'application/json': 'document',
    'text/markdown': 'document',
  };
  return typeMap[mimeType] || 'document';
}

async function processFileAsync(knowledgeItem: any) {
  try {
    // Update status to processing
    await prisma.knowledge.update({
      where: { id: knowledgeItem.id },
      data: { status: 'PROCESSING' },
    });

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Extract content based on file type
    const content = await extractContent(knowledgeItem);

    // Generate chunks
    const chunks = await generateChunks(content);

    // Generate embeddings
    const embeddings = await generateEmbeddings(chunks);

    // Store in vector database
    await storeVectors(knowledgeItem.id, chunks, embeddings);

    // Update status to completed
    await prisma.knowledge.update({
      where: { id: knowledgeItem.id },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
      },
    });

    console.log(`Processing completed for file: ${knowledgeItem.filename}`);
  } catch (error) {
    console.error('Processing error:', error);

    // Update status to failed
    await prisma.knowledge.update({
      where: { id: knowledgeItem.id },
      data: {
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

async function extractContent(knowledgeItem: any): Promise<string> {
  try {
    // Use DocumentParser for proper content extraction (Day 6 Implementation)
    console.log(`📄 Extracting content from: ${knowledgeItem.filename}`);

    const parsingResult = await documentParser.parseDocument(
      knowledgeItem.filePath,
      knowledgeItem.filename
    );

    if (parsingResult.success && parsingResult.content) {
      console.log(
        `✅ Successfully extracted ${parsingResult.content.statistics.totalWords} words from ${knowledgeItem.filename}`
      );

      // Update knowledge item with parsed content and metadata
      await prisma.knowledge.update({
        where: { id: knowledgeItem.id },
        data: {
          content: parsingResult.content.content,
          metadata: JSON.stringify({
            ...JSON.parse(knowledgeItem.metadata || '{}'),
            parsing: {
              success: true,
              warnings: parsingResult.warnings,
              processingTime: parsingResult.processingTime,
            },
            document: parsingResult.content.metadata,
            statistics: parsingResult.content.statistics,
            extractedAt: new Date().toISOString(),
          }),
        },
      });

      return parsingResult.content.content;
    } else {
      console.warn(
        `⚠️ Document parsing failed for ${knowledgeItem.filename}: ${parsingResult.error}`
      );

      // Fallback to basic content extraction
      return `Content extraction failed for ${knowledgeItem.filename}. Error: ${parsingResult.error}`;
    }
  } catch (error) {
    console.error('Content extraction error:', error);
    return `Failed to extract content from ${knowledgeItem.filename}`;
  }
}

async function generateChunks(content: string): Promise<string[]> {
  // Mock chunking
  const chunkSize = 500;
  const chunks = [];
  for (let i = 0; i < content.length; i += chunkSize) {
    chunks.push(content.slice(i, i + chunkSize));
  }
  return chunks;
}

async function generateEmbeddings(chunks: string[]): Promise<number[][]> {
  // Mock embedding generation
  return chunks.map(() => new Array(1536).fill(0).map(() => Math.random()));
}

async function storeVectors(
  itemId: string,
  chunks: string[],
  embeddings: number[][]
): Promise<void> {
  try {
    console.log(`🗜️ Storing ${chunks.length} optimized vectors for item ${itemId}...`);

    // Get the knowledge item to determine user
    const knowledgeItem = await prisma.knowledge.findUnique({
      where: { id: itemId },
      select: { userId: true, title: true, metadata: true },
    });

    if (!knowledgeItem) {
      throw new Error(`Knowledge item ${itemId} not found`);
    }

    // Parse metadata safely
    let existingMetadata: any = {};
    try {
      if (knowledgeItem.metadata) {
        existingMetadata =
          typeof knowledgeItem.metadata === 'string'
            ? JSON.parse(knowledgeItem.metadata)
            : knowledgeItem.metadata;
      }
    } catch (error) {
      console.warn(`Failed to parse metadata for ${itemId}:`, error);
      existingMetadata = {};
    }

    // Prepare documents for vector processing (using correct method)
    const documentsToProcess = chunks.map((chunk, index) => ({
      id: `${itemId}_chunk_${index}`,
      content: chunk,
      metadata: {
        chunkIndex: index,
        chunkSize: chunk.length,
        documentTitle: knowledgeItem.title,
        documentId: itemId,
        userId: knowledgeItem.userId,
        storedAt: new Date().toISOString(),
        ...existingMetadata,
      },
    }));

    // Use VectorKnowledgeService processDocuments method
    const collectionName = `user_${knowledgeItem.userId}_knowledge`;
    const result = await vectorKnowledgeService.processDocuments(
      documentsToProcess,
      collectionName
    );

    // Log optimization results
    if (result.vectorStorageResult?.metadata?.optimizationMetrics) {
      const metrics = result.vectorStorageResult.metadata.optimizationMetrics;
      console.log(`✅ Storage optimization results:`);
      console.log(`   📊 Vectors stored: ${result.processed}`);
      console.log(`   🗜️ Compressed: ${metrics.compressedVectors}`);
      console.log(`   🔍 Duplicates detected: ${metrics.duplicatesDetected}`);
      console.log(
        `   💾 Space savings: ${result.vectorStorageResult.metadata.spaceSavingsPercent?.toFixed(1)}%`
      );
    }

    // Update knowledge item with vectorization metadata
    const updatedMetadata = {
      ...existingMetadata,
      vectorized: true,
      collectionName,
      vectorCount: result.processed,
      optimizationMetrics: result.vectorStorageResult?.metadata?.optimizationMetrics,
      spaceSavings: result.vectorStorageResult?.metadata?.spaceSavingsPercent,
      vectorizedAt: new Date().toISOString(),
    };

    await prisma.knowledge.update({
      where: { id: itemId },
      data: {
        metadata: JSON.stringify(updatedMetadata),
      },
    });

    console.log(
      `✅ Optimized vector storage complete for ${itemId}: ${result.processed} vectors stored`
    );
  } catch (error) {
    console.error(`❌ Failed to store optimized vectors for ${itemId}:`, error);
    throw error;
  }
}
