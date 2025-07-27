import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { FolderAnalysisService } from '@/lib/folder-analysis-service';
import { BatchProcessingEngine } from '@/lib/batch-processing-engine';
import { StreamingUploadService } from '@/lib/streaming-upload-service';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Global instances for session persistence
let batchEngine: BatchProcessingEngine | null = null;
let streamingService: StreamingUploadService | null = null;

function initializeServices() {
  if (!batchEngine) {
    batchEngine = new BatchProcessingEngine({
      maxConcurrentJobs: 3,
      maxMemoryUsage: 64 * 1024 * 1024, // 64MB (Vercel safe limit)
      priorityStrategy: 'adaptive',
      enableDynamicAdjustment: true,
      retryFailedJobs: true,
      maxRetries: 2,
      progressUpdateInterval: 1000,
      enablePerformanceMonitoring: true,
    });
  }

  if (!streamingService) {
    streamingService = new StreamingUploadService('./temp/large-folder-uploads');
  }
}

/**
 * POST /api/knowledge/large-folder - Start large folder processing
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    initializeServices();

    const formData = await request.formData();
    const action = formData.get('action') as string;

    switch (action) {
      case 'analyze':
        return await handleFolderAnalysis(formData, session.user.id);

      case 'start_processing':
        return await handleStartProcessing(formData, session.user.id);

      case 'get_progress':
        return await handleGetProgress(formData);

      case 'pause':
        return await handlePauseProcessing(formData);

      case 'resume':
        return await handleResumeProcessing(formData);

      case 'cancel':
        return await handleCancelProcessing(formData);

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Large folder processing error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * 🔍 Handle folder analysis
 */
async function handleFolderAnalysis(formData: FormData, userId: string) {
  try {
    console.log('🔍 Starting folder analysis for large folder processing');

    // Get folder files from FormData
    const folderFiles = formData.getAll('folder_files') as File[];
    if (!folderFiles || folderFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No folder files provided' },
        { status: 400 }
      );
    }

    // Create temporary folder structure for analysis
    const tempFolderId = uuidv4();
    const tempFolderPath = path.join(process.cwd(), 'temp', 'analysis', tempFolderId);
    await mkdir(tempFolderPath, { recursive: true });

    console.log(`📁 Processing ${folderFiles.length} files for analysis`);

    // Save files to temporary location with structure preservation
    const savedFiles = [];
    for (let i = 0; i < folderFiles.length; i++) {
      const file = folderFiles[i];
      const pathKey = `folder_paths_${i}`;
      const relativePath = (formData.get(pathKey) as string) || file.name;

      // Create subdirectories if needed
      const fullPath = path.join(tempFolderPath, relativePath);
      const dirPath = path.dirname(fullPath);
      await mkdir(dirPath, { recursive: true });

      // Check file size before processing
      if (file.size > 50 * 1024 * 1024) { // 50MB limit for individual files
        console.warn(`⚠️ Skipping large file: ${file.name} (${file.size} bytes)`);
        continue;
      }

      // Save file (for smaller files only)
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(fullPath, buffer);

      savedFiles.push({
        name: file.name,
        path: fullPath,
        size: file.size,
        relativePath,
      });
    }

    // Analyze folder structure
    const folderAnalysis = await FolderAnalysisService.analyzeFolder(tempFolderPath);

    // Add user context to analysis
    const enhancedAnalysis = {
      ...folderAnalysis,
      userId,
      tempFolderId,
      analysisId: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      files: savedFiles.map(f => ({
        name: f.name,
        size: f.size,
        relativePath: f.relativePath,
        supported: folderAnalysis.folderStructure.some(
          node => node.name === f.name && node.analysis?.isSupported
        ),
      })),
    };

    console.log(`✅ Folder analysis completed:`);
    console.log(`   - Total files: ${folderAnalysis.totalFiles}`);
    console.log(`   - Supported files: ${folderAnalysis.supportedFiles}`);
    console.log(`   - Total size: ${formatBytes(folderAnalysis.totalSize)}`);
    console.log(`   - Risk level: ${folderAnalysis.riskAssessment.overallRisk}`);
    console.log(
      `   - Recommended batch size: ${folderAnalysis.batchStrategy.recommendedBatchSize}`
    );

    return NextResponse.json({
      success: true,
      analysis: enhancedAnalysis,
      recommendations: folderAnalysis.recommendations,
      riskAssessment: folderAnalysis.riskAssessment,
      batchStrategy: folderAnalysis.batchStrategy,
    });
  } catch (error) {
    console.error('❌ Folder analysis failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Folder analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}

/**
 * 🚀 Handle start processing
 */
async function handleStartProcessing(formData: FormData, userId: string) {
  try {
    const analysisId = formData.get('analysisId') as string;
    const tempFolderId = formData.get('tempFolderId') as string;
    const processingOptions = JSON.parse((formData.get('options') as string) || '{}');

    if (!analysisId || !tempFolderId) {
      return NextResponse.json(
        { success: false, error: 'Analysis ID and temp folder ID required' },
        { status: 400 }
      );
    }

    console.log(`🚀 Starting large folder processing: ${analysisId}`);

    // Get the folder analysis (in production, this would be stored and retrieved)
    const tempFolderPath = path.join(process.cwd(), 'temp', 'analysis', tempFolderId);
    const folderAnalysis = await FolderAnalysisService.analyzeFolder(tempFolderPath);

    // Configure batch processing options
    const batchOptions = {
      maxConcurrentJobs:
        processingOptions.concurrentJobs || folderAnalysis.batchStrategy.recommendedBatchSize,
      maxMemoryUsage: processingOptions.memoryLimit || 256 * 1024 * 1024,
      priorityStrategy: processingOptions.strategy || folderAnalysis.batchStrategy.batchingStrategy,
      enableDynamicAdjustment: processingOptions.dynamicAdjustment !== false,
      retryFailedJobs: processingOptions.retryFailedJobs !== false,
      maxRetries: processingOptions.maxRetries || 3,
      progressUpdateInterval: 1000,
      enablePerformanceMonitoring: true,
    };

    // Update batch engine configuration
    batchEngine = new BatchProcessingEngine(batchOptions);

    // Start batch processing
    const batchId = await batchEngine!.startBatchProcessing(folderAnalysis, analysisId);

    console.log(`✅ Batch processing started with ID: ${batchId}`);

    return NextResponse.json({
      success: true,
      batchId,
      message: 'Large folder processing started successfully',
      estimatedDuration: folderAnalysis.estimatedProcessingTime,
      totalJobs: folderAnalysis.supportedFiles,
      batchStrategy: folderAnalysis.batchStrategy,
    });
  } catch (error) {
    console.error('❌ Failed to start processing:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to start processing: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}

/**
 * 📊 Handle get progress
 */
async function handleGetProgress(formData: FormData) {
  try {
    const batchId = formData.get('batchId') as string;

    if (!batchId) {
      return NextResponse.json({ success: false, error: 'Batch ID required' }, { status: 400 });
    }

    if (!batchEngine) {
      return NextResponse.json(
        { success: false, error: 'Batch engine not initialized' },
        { status: 404 }
      );
    }

    const progress = batchEngine.getBatchProgress(batchId);

    if (!progress) {
      return NextResponse.json({ success: false, error: 'Batch not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      progress: {
        ...progress,
        formattedProgress: `${progress.overallProgress.toFixed(1)}%`,
        formattedTimeRemaining: formatTime(progress.estimatedTimeRemaining),
        formattedThroughput: `${progress.throughput.toFixed(2)} jobs/min`,
        formattedMemoryUsage: formatBytes(progress.memoryUsage),
      },
    });
  } catch (error) {
    console.error('❌ Failed to get progress:', error);
    return NextResponse.json({ success: false, error: 'Failed to get progress' }, { status: 500 });
  }
}

/**
 * ⏸️ Handle pause processing
 */
async function handlePauseProcessing(formData: FormData) {
  try {
    const batchId = formData.get('batchId') as string;

    if (!batchId || !batchEngine) {
      return NextResponse.json(
        { success: false, error: 'Batch ID required and engine must be initialized' },
        { status: 400 }
      );
    }

    const success = await batchEngine.pauseBatch(batchId);

    return NextResponse.json({
      success,
      message: success ? 'Batch processing paused' : 'Failed to pause batch',
    });
  } catch (error) {
    console.error('❌ Failed to pause processing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to pause processing' },
      { status: 500 }
    );
  }
}

/**
 * ▶️ Handle resume processing
 */
async function handleResumeProcessing(formData: FormData) {
  try {
    const batchId = formData.get('batchId') as string;

    if (!batchId || !batchEngine) {
      return NextResponse.json(
        { success: false, error: 'Batch ID required and engine must be initialized' },
        { status: 400 }
      );
    }

    const success = await batchEngine.resumeBatch(batchId);

    return NextResponse.json({
      success,
      message: success ? 'Batch processing resumed' : 'Failed to resume batch',
    });
  } catch (error) {
    console.error('❌ Failed to resume processing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to resume processing' },
      { status: 500 }
    );
  }
}

/**
 * ❌ Handle cancel processing
 */
async function handleCancelProcessing(formData: FormData) {
  try {
    const batchId = formData.get('batchId') as string;

    if (!batchId || !batchEngine) {
      return NextResponse.json(
        { success: false, error: 'Batch ID required and engine must be initialized' },
        { status: 400 }
      );
    }

    const success = await batchEngine.cancelBatch(batchId);

    return NextResponse.json({
      success,
      message: success ? 'Batch processing cancelled' : 'Failed to cancel batch',
    });
  } catch (error) {
    console.error('❌ Failed to cancel processing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel processing' },
      { status: 500 }
    );
  }
}

/**
 * 🛠️ Helper functions
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
}
