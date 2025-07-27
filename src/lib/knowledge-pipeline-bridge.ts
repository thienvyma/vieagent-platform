/**
 * 🌉 Knowledge Pipeline Bridge - Phase 4 Day 14
 * Bridge service kết nối existing upload system với production vector services
 */

import {
  VectorKnowledgeServiceProduction,
  KnowledgeDocument,
  ProcessingResult,
} from './vector-knowledge-service-production';
import { ProductionChromaDBService, productionChromaService } from './chromadb-production';
import { CollectionManager, collectionManager } from './collection-manager';
import { OpenAIEmbeddingService } from './openai-embedding-service';
import { PrismaClient } from '@prisma/client';

export interface DocumentProcessingStatus {
  documentId: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
  progress: number; // 0-100
  startedAt: string;
  completedAt?: string;
  error?: string;
  processingResult?: ProcessingResult;
  retryCount: number;
  maxRetries: number;
}

export interface PipelineStats {
  totalProcessed: number;
  totalSuccess: number;
  totalFailed: number;
  totalRetrying: number;
  averageProcessingTime: number;
  successRate: number;
  lastProcessedAt: string;
}

export interface BridgeConfig {
  maxConcurrentProcessing: number;
  retryDelayMs: number;
  maxRetries: number;
  batchSize: number;
  enableAutoRetry: boolean;
  statusUpdateInterval: number;
}

export class KnowledgePipelineBridge {
  private vectorService: VectorKnowledgeServiceProduction;
  private chromaService: ProductionChromaDBService;
  private collectionManager: CollectionManager;
  private embeddingService: OpenAIEmbeddingService;
  private prisma: PrismaClient;
  private config: BridgeConfig;

  private processingQueue: Map<string, DocumentProcessingStatus> = new Map();
  private processingStats: PipelineStats;
  private isProcessing: boolean = false;
  private statusUpdateTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<BridgeConfig> = {}, prisma?: PrismaClient) {
    this.config = {
      maxConcurrentProcessing: config.maxConcurrentProcessing || 3,
      retryDelayMs: config.retryDelayMs || 5000,
      maxRetries: config.maxRetries || 3,
      batchSize: config.batchSize || 10,
      enableAutoRetry: config.enableAutoRetry || true,
      statusUpdateInterval: config.statusUpdateInterval || 5000,
    };

    this.prisma = prisma || new PrismaClient();

    // Initialize services
    this.embeddingService = new OpenAIEmbeddingService({
      apiKey: process.env.OPENAI_API_KEY || '',
      model: 'text-embedding-3-small',
    });

    this.chromaService = productionChromaService;
    this.collectionManager = collectionManager;

    this.vectorService = new VectorKnowledgeServiceProduction(
      this.chromaService,
      this.collectionManager,
      this.embeddingService
    );

    this.processingStats = {
      totalProcessed: 0,
      totalSuccess: 0,
      totalFailed: 0,
      totalRetrying: 0,
      averageProcessingTime: 0,
      successRate: 0,
      lastProcessedAt: new Date().toISOString(),
    };

    this.startStatusUpdates();
  }

  /**
   * Process existing knowledge documents từ database
   */
  async processExistingKnowledge(userId?: string): Promise<{
    processed: number;
    queued: number;
    errors: string[];
  }> {
    try {
      console.log('🔄 Processing existing knowledge documents...');

      // Get existing documents từ database
      const existingDocs = await this.prisma.document.findMany({
        where: userId ? { userId } : {},
        include: {
          user: true,
        },
      });

      const result = {
        processed: 0,
        queued: 0,
        errors: [] as string[],
      };

      // Convert và queue documents
      for (const doc of existingDocs) {
        try {
          const knowledgeDoc = await this.convertToKnowledgeDocument(doc);
          await this.queueDocumentProcessing(knowledgeDoc);
          result.queued++;
        } catch (error) {
          result.errors.push(`Failed to queue document ${doc.id}: ${error}`);
        }
      }

      console.log(`✅ Queued ${result.queued} documents for processing`);
      return result;
    } catch (error) {
      console.error('❌ Failed to process existing knowledge:', error);
      throw error;
    }
  }

  /**
   * Convert database document to KnowledgeDocument
   */
  private async convertToKnowledgeDocument(doc: any): Promise<KnowledgeDocument> {
    // Extract content từ document
    let content = '';

    if (doc.content) {
      content = doc.content;
    } else if (doc.extractedText) {
      content = doc.extractedText;
    } else if (doc.chunks && Array.isArray(doc.chunks)) {
      content = doc.chunks.map((chunk: any) => chunk.content || chunk.text).join('\n\n');
    }

    if (!content.trim()) {
      throw new Error('Document has no extractable content');
    }

    return {
      id: doc.id,
      title: doc.title || doc.fileName || `Document ${doc.id}`,
      content: content.trim(),
      metadata: {
        fileName: doc.fileName,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        uploadedAt: doc.createdAt,
        originalPath: doc.filePath,
        processingStatus: doc.status, // Fixed: use existing status field
        ...doc.metadata,
      },
      userId: doc.userId,
      type: this.determineDocumentType(doc),
      source: doc.source || 'upload',
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  /**
   * Determine document type based on metadata
   */
  private determineDocumentType(doc: any): KnowledgeDocument['type'] {
    if (doc.type) return doc.type;
    if (doc.fileType?.includes('pdf')) return 'document';
    if (doc.fileName?.toLowerCase().includes('faq')) return 'faq';
    if (doc.fileName?.toLowerCase().includes('manual')) return 'manual';
    return 'document';
  }

  /**
   * Queue document for processing
   */
  async queueDocumentProcessing(
    document: KnowledgeDocument,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<void> {
    const processingStatus: DocumentProcessingStatus = {
      documentId: document.id,
      userId: document.userId,
      status: 'pending',
      progress: 0,
      startedAt: new Date().toISOString(),
      retryCount: 0,
      maxRetries: this.config.maxRetries,
    };

    this.processingQueue.set(document.id, processingStatus);

    // Start processing if not already running
    if (!this.isProcessing) {
      this.startProcessing();
    }

    console.log(`📋 Queued document for processing: ${document.id}`);
  }

  /**
   * Start processing queue
   */
  private async startProcessing(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;
    console.log('🚀 Starting knowledge processing pipeline...');

    try {
      while (this.processingQueue.size > 0) {
        const pendingDocs = Array.from(this.processingQueue.entries())
          .filter(([_, status]) => status.status === 'pending')
          .slice(0, this.config.maxConcurrentProcessing);

        if (pendingDocs.length === 0) {
          // Check for retries
          const retryDocs = Array.from(this.processingQueue.entries())
            .filter(([_, status]) => status.status === 'retrying')
            .slice(0, this.config.maxConcurrentProcessing);

          if (retryDocs.length === 0) break;

          // Process retries
          await Promise.all(retryDocs.map(([docId, status]) => this.processDocument(docId)));
        } else {
          // Process pending documents
          await Promise.all(pendingDocs.map(([docId, status]) => this.processDocument(docId)));
        }

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error('❌ Processing pipeline error:', error);
    } finally {
      this.isProcessing = false;
      console.log('✅ Knowledge processing pipeline completed');
    }
  }

  /**
   * Process individual document
   */
  private async processDocument(documentId: string): Promise<void> {
    const status = this.processingQueue.get(documentId);
    if (!status) return;

    try {
      // Update status to processing
      status.status = 'processing';
      status.progress = 10;
      this.processingQueue.set(documentId, status);

      // Get document from database
      const doc = await this.prisma.document.findUnique({
        where: { id: documentId },
        include: { user: true },
      });

      if (!doc) {
        throw new Error('Document not found in database');
      }

      // Convert to knowledge document
      const knowledgeDoc = await this.convertToKnowledgeDocument(doc);
      status.progress = 30;

      // Process with vector service
      const result = await this.vectorService.processKnowledgeDocument(knowledgeDoc);
      status.progress = 80;

      // Update status based on result
      if (result.status === 'success') {
        status.status = 'completed';
        status.progress = 100;
        status.completedAt = new Date().toISOString();
        status.processingResult = result;

        // Update database document status
        await this.prisma.document.update({
          where: { id: documentId },
          data: {
            status: 'PROCESSED', // Fixed: use existing status field instead of processingStatus
            metadata: {
              ...doc.metadata,
              vectorProcessing: {
                status: 'completed',
                chunksCreated: result.chunksCreated,
                embeddingsGenerated: result.embeddingsGenerated,
                processingTime: result.processingTime,
                quality: result.quality,
                completedAt: new Date().toISOString(),
              },
            },
          },
        });

        this.processingStats.totalSuccess++;
      } else if (result.status === 'partial') {
        status.status = 'completed';
        status.progress = 100;
        status.completedAt = new Date().toISOString();
        status.processingResult = result;
        status.error = `Partial success: ${result.errors.join(', ')}`;

        this.processingStats.totalSuccess++;
      } else {
        throw new Error(`Processing failed: ${result.errors.join(', ')}`);
      }

      status.progress = 100;
      this.processingStats.totalProcessed++;
      this.processingStats.lastProcessedAt = new Date().toISOString();
    } catch (error) {
      console.error(`❌ Document processing failed: ${documentId}`, error);

      status.error = error.message;
      status.retryCount++;

      if (status.retryCount < status.maxRetries && this.config.enableAutoRetry) {
        status.status = 'retrying';
        status.progress = 0;
        this.processingStats.totalRetrying++;

        // Schedule retry
        setTimeout(() => {
          this.processDocument(documentId);
        }, this.config.retryDelayMs * status.retryCount);
      } else {
        status.status = 'failed';
        status.completedAt = new Date().toISOString();
        this.processingStats.totalFailed++;

        // Update database
        await this.prisma.document
          .update({
            where: { id: documentId },
            data: {
              status: 'FAILED', // Fixed: use existing status field instead of processingStatus
              metadata: {
                ...doc.metadata,
                vectorProcessing: {
                  status: 'failed',
                  error: error.message,
                  retryCount: status.retryCount,
                  failedAt: new Date().toISOString(),
                },
              },
            },
          })
          .catch(console.error);
      }
    }

    // Update processing queue
    this.processingQueue.set(documentId, status);
  }

  /**
   * Get processing status for document
   */
  getDocumentStatus(documentId: string): DocumentProcessingStatus | null {
    return this.processingQueue.get(documentId) || null;
  }

  /**
   * Get processing statistics
   */
  getProcessingStats(): PipelineStats {
    // Calculate success rate
    const total = this.processingStats.totalProcessed;
    this.processingStats.successRate = total > 0 ? this.processingStats.totalSuccess / total : 0;

    return { ...this.processingStats };
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    totalQueued: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    retrying: number;
  } {
    const statuses = Array.from(this.processingQueue.values());

    return {
      totalQueued: statuses.length,
      pending: statuses.filter(s => s.status === 'pending').length,
      processing: statuses.filter(s => s.status === 'processing').length,
      completed: statuses.filter(s => s.status === 'completed').length,
      failed: statuses.filter(s => s.status === 'failed').length,
      retrying: statuses.filter(s => s.status === 'retrying').length,
    };
  }

  /**
   * Start status updates
   */
  private startStatusUpdates(): void {
    this.statusUpdateTimer = setInterval(() => {
      this.updateProcessingStats();
    }, this.config.statusUpdateInterval);
  }

  /**
   * Update processing statistics
   */
  private updateProcessingStats(): void {
    const queueStatus = this.getQueueStatus();

    // Update retry count
    this.processingStats.totalRetrying = queueStatus.retrying;

    // Log status if processing
    if (this.isProcessing && queueStatus.totalQueued > 0) {
      console.log(
        `📊 Processing status: ${queueStatus.completed}/${queueStatus.totalQueued} completed`
      );
    }
  }

  /**
   * Clear completed documents from queue
   */
  clearCompletedDocuments(): void {
    const completedDocs = Array.from(this.processingQueue.entries()).filter(
      ([_, status]) => status.status === 'completed' || status.status === 'failed'
    );

    completedDocs.forEach(([docId, _]) => {
      this.processingQueue.delete(docId);
    });

    console.log(`🧹 Cleared ${completedDocs.length} completed documents from queue`);
  }

  /**
   * Get service health status
   */
  async getHealthStatus(): Promise<{
    isHealthy: boolean;
    queueStatus: any;
    processingStats: PipelineStats;
    vectorServiceStatus: any;
  }> {
    try {
      const vectorServiceStatus = await this.vectorService.getHealthStatus();
      const queueStatus = this.getQueueStatus();

      return {
        isHealthy: vectorServiceStatus.isHealthy && !this.isProcessing,
        queueStatus,
        processingStats: this.getProcessingStats(),
        vectorServiceStatus,
      };
    } catch (error) {
      return {
        isHealthy: false,
        queueStatus: this.getQueueStatus(),
        processingStats: this.getProcessingStats(),
        vectorServiceStatus: { error: error.message },
      };
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.statusUpdateTimer) {
      clearInterval(this.statusUpdateTimer);
      this.statusUpdateTimer = null;
    }

    this.processingQueue.clear();
    this.isProcessing = false;

    await this.prisma.$disconnect();
    console.log('🧹 Knowledge Pipeline Bridge cleaned up');
  }
}

// Export singleton instance
export const knowledgePipelineBridge = new KnowledgePipelineBridge();

export default KnowledgePipelineBridge;
