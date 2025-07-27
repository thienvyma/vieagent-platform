import { Readable } from 'stream';
import { createWriteStream, createReadStream, promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { performance } from 'perf_hooks';

export interface StreamingUploadOptions {
  chunkSize: number;
  maxMemoryUsage: number;
  enableCompression: boolean;
  enableResume: boolean;
  timeout: number;
  retryAttempts: number;
  progressCallback?: (progress: UploadProgress) => void;
  onError?: (error: UploadError) => void;
  onComplete?: (result: UploadResult) => void;
}

export interface UploadProgress {
  uploadId: string;
  fileName: string;
  totalSize: number;
  uploadedSize: number;
  percentage: number;
  speed: number; // bytes per second
  remainingTime: number; // seconds
  status: 'preparing' | 'uploading' | 'paused' | 'completed' | 'failed';
  currentChunk: number;
  totalChunks: number;
  memoryUsage: number;
  error?: string;
}

export interface UploadError {
  uploadId: string;
  fileName: string;
  error: string;
  recoverable: boolean;
  retryCount: number;
  chunk?: number;
}

export interface UploadResult {
  uploadId: string;
  fileName: string;
  finalPath: string;
  fileSize: number;
  hash: string;
  chunks: ChunkInfo[];
  totalTime: number;
  averageSpeed: number;
  metadata: UploadMetadata;
}

export interface ChunkInfo {
  index: number;
  size: number;
  hash: string;
  uploadTime: number;
  retries: number;
}

export interface UploadMetadata {
  mimeType: string;
  encoding: string;
  originalName: string;
  uploadedAt: Date;
  compressionUsed: boolean;
  streamingMode: boolean;
  resumeSupported: boolean;
}

export interface UploadSession {
  uploadId: string;
  fileName: string;
  totalSize: number;
  uploadedChunks: Set<number>;
  sessionPath: string;
  startTime: number;
  lastActivity: number;
  options: StreamingUploadOptions;
}

export class StreamingUploadService {
  private static readonly DEFAULT_OPTIONS: StreamingUploadOptions = {
    chunkSize: 1024 * 1024, // 1MB chunks
    maxMemoryUsage: 100 * 1024 * 1024, // 100MB max memory
    enableCompression: false, // Disable by default for streaming
    enableResume: true,
    timeout: 60000, // 60 seconds
    retryAttempts: 3,
  };

  private activeSessions: Map<string, UploadSession> = new Map();
  private progressTrackers: Map<string, UploadProgress> = new Map();
  private tempDirectory: string;

  constructor(tempDirectory: string = './temp/streaming-uploads') {
    this.tempDirectory = tempDirectory;
    this.ensureTempDirectory();
    this.startCleanupTask();
  }

  /**
   * 🚀 Start streaming upload for large file
   */
  async startStreamingUpload(
    fileStream: Readable,
    fileName: string,
    totalSize: number,
    options: Partial<StreamingUploadOptions> = {}
  ): Promise<string> {
    const uploadOptions = { ...StreamingUploadService.DEFAULT_OPTIONS, ...options };
    const uploadId = this.generateUploadId();

    console.log(`🚀 Starting streaming upload: ${fileName} (${this.formatBytes(totalSize)})`);

    // Create upload session
    const sessionPath = path.join(this.tempDirectory, uploadId);
    await fs.mkdir(sessionPath, { recursive: true });

    const session: UploadSession = {
      uploadId,
      fileName,
      totalSize,
      uploadedChunks: new Set(),
      sessionPath,
      startTime: Date.now(),
      lastActivity: Date.now(),
      options: uploadOptions,
    };

    this.activeSessions.set(uploadId, session);

    // Initialize progress tracking
    const progress: UploadProgress = {
      uploadId,
      fileName,
      totalSize,
      uploadedSize: 0,
      percentage: 0,
      speed: 0,
      remainingTime: 0,
      status: 'preparing',
      currentChunk: 0,
      totalChunks: Math.ceil(totalSize / uploadOptions.chunkSize),
      memoryUsage: 0,
    };

    this.progressTrackers.set(uploadId, progress);

    // Start streaming process
    this.processStreamingUpload(fileStream, session).catch(error => {
      console.error(`❌ Streaming upload failed for ${fileName}:`, error);
      this.handleUploadError(uploadId, error);
    });

    return uploadId;
  }

  /**
   * 📊 Get upload progress
   */
  getUploadProgress(uploadId: string): UploadProgress | null {
    return this.progressTrackers.get(uploadId) || null;
  }

  /**
   * ⏸️ Pause upload
   */
  async pauseUpload(uploadId: string): Promise<boolean> {
    const progress = this.progressTrackers.get(uploadId);
    if (progress && progress.status === 'uploading') {
      progress.status = 'paused';
      console.log(`⏸️ Upload paused: ${uploadId}`);
      return true;
    }
    return false;
  }

  /**
   * ▶️ Resume upload
   */
  async resumeUpload(uploadId: string): Promise<boolean> {
    const progress = this.progressTrackers.get(uploadId);
    const session = this.activeSessions.get(uploadId);

    if (progress && session && progress.status === 'paused') {
      progress.status = 'uploading';
      console.log(`▶️ Upload resumed: ${uploadId}`);
      // Resume logic would be implemented here
      return true;
    }
    return false;
  }

  /**
   * ❌ Cancel upload
   */
  async cancelUpload(uploadId: string): Promise<boolean> {
    const session = this.activeSessions.get(uploadId);
    if (session) {
      // Clean up session files
      try {
        await fs.rmdir(session.sessionPath, { recursive: true });
      } catch (error) {
        console.warn(`⚠️ Failed to clean up session ${uploadId}:`, error);
      }

      this.activeSessions.delete(uploadId);
      this.progressTrackers.delete(uploadId);

      console.log(`❌ Upload cancelled: ${uploadId}`);
      return true;
    }
    return false;
  }

  /**
   * 🔄 Process streaming upload with chunks
   */
  private async processStreamingUpload(
    fileStream: Readable,
    session: UploadSession
  ): Promise<UploadResult> {
    const { uploadId, fileName, totalSize, sessionPath, options } = session;
    const progress = this.progressTrackers.get(uploadId)!;

    const chunks: ChunkInfo[] = [];
    const hash = crypto.createHash('md5');
    let currentChunk = 0;
    let uploadedSize = 0;
    const startTime = performance.now();

    progress.status = 'uploading';

    try {
      // Process file in chunks
      await new Promise<void>((resolve, reject) => {
        let buffer = Buffer.alloc(0);

        fileStream.on('data', async (data: Buffer) => {
          try {
            // Check memory usage
            const memoryUsage = process.memoryUsage().heapUsed;
            progress.memoryUsage = memoryUsage;

            if (memoryUsage > options.maxMemoryUsage) {
              console.warn(`⚠️ Memory usage high: ${this.formatBytes(memoryUsage)}`);
              // Pause processing to allow garbage collection
              await this.waitForMemoryCleanup();
            }

            buffer = Buffer.concat([buffer, data]);

            // Process complete chunks
            while (buffer.length >= options.chunkSize) {
              const chunkData = buffer.slice(0, options.chunkSize);
              buffer = buffer.slice(options.chunkSize);

              await this.processChunk(chunkData, currentChunk, session, hash);

              currentChunk++;
              uploadedSize += chunkData.length;

              // Update progress
              this.updateProgress(uploadId, uploadedSize, currentChunk, startTime);

              // Check if upload is paused
              if (progress.status === 'paused') {
                fileStream.pause();
                return;
              }
            }
          } catch (error) {
            reject(error);
          }
        });

        fileStream.on('end', async () => {
          try {
            // Process remaining data
            if (buffer.length > 0) {
              await this.processChunk(buffer, currentChunk, session, hash);
              currentChunk++;
              uploadedSize += buffer.length;
              this.updateProgress(uploadId, uploadedSize, currentChunk, startTime);
            }

            resolve();
          } catch (error) {
            reject(error);
          }
        });

        fileStream.on('error', reject);
      });

      // Combine chunks into final file
      const finalPath = await this.combineChunks(session, chunks);
      const finalHash = hash.digest('hex');
      const totalTime = performance.now() - startTime;
      const averageSpeed = totalSize / (totalTime / 1000);

      progress.status = 'completed';
      progress.percentage = 100;

      const result: UploadResult = {
        uploadId,
        fileName,
        finalPath,
        fileSize: totalSize,
        hash: finalHash,
        chunks,
        totalTime,
        averageSpeed,
        metadata: {
          mimeType: this.getMimeType(fileName),
          encoding: 'binary',
          originalName: fileName,
          uploadedAt: new Date(),
          compressionUsed: options.enableCompression,
          streamingMode: true,
          resumeSupported: options.enableResume,
        },
      };

      // Cleanup session
      this.cleanupSession(uploadId);

      console.log(
        `✅ Streaming upload completed: ${fileName} in ${(totalTime / 1000).toFixed(2)}s`
      );

      if (options.onComplete) {
        options.onComplete(result);
      }

      return result;
    } catch (error) {
      console.error(`❌ Streaming upload failed: ${fileName}`, error);
      progress.status = 'failed';
      progress.error = error instanceof Error ? error.message : 'Unknown error';

      if (options.onError) {
        options.onError({
          uploadId,
          fileName,
          error: progress.error,
          recoverable: this.isRecoverableError(error),
          retryCount: 0,
        });
      }

      throw error;
    }
  }

  /**
   * 📦 Process individual chunk
   */
  private async processChunk(
    chunkData: Buffer,
    chunkIndex: number,
    session: UploadSession,
    hash: crypto.Hash
  ): Promise<ChunkInfo> {
    const chunkStartTime = performance.now();
    const chunkHash = crypto.createHash('md5').update(chunkData).digest('hex');

    // Write chunk to temporary file
    const chunkPath = path.join(
      session.sessionPath,
      `chunk_${chunkIndex.toString().padStart(6, '0')}`
    );
    await fs.writeFile(chunkPath, chunkData);

    // Update running hash
    hash.update(chunkData);

    // Mark chunk as uploaded
    session.uploadedChunks.add(chunkIndex);
    session.lastActivity = Date.now();

    const chunkTime = performance.now() - chunkStartTime;

    const chunkInfo: ChunkInfo = {
      index: chunkIndex,
      size: chunkData.length,
      hash: chunkHash,
      uploadTime: chunkTime,
      retries: 0,
    };

    console.log(
      `📦 Chunk ${chunkIndex} processed: ${this.formatBytes(chunkData.length)} in ${chunkTime.toFixed(2)}ms`
    );

    return chunkInfo;
  }

  /**
   * 🔄 Update upload progress
   */
  private updateProgress(
    uploadId: string,
    uploadedSize: number,
    currentChunk: number,
    startTime: number
  ): void {
    const progress = this.progressTrackers.get(uploadId);
    if (!progress) return;

    const elapsedTime = (performance.now() - startTime) / 1000; // seconds
    const speed = uploadedSize / elapsedTime;
    const remainingSize = progress.totalSize - uploadedSize;
    const remainingTime = speed > 0 ? remainingSize / speed : 0;

    progress.uploadedSize = uploadedSize;
    progress.percentage = (uploadedSize / progress.totalSize) * 100;
    progress.speed = speed;
    progress.remainingTime = remainingTime;
    progress.currentChunk = currentChunk;

    // Call progress callback if provided
    const session = this.activeSessions.get(uploadId);
    if (session?.options.progressCallback) {
      session.options.progressCallback(progress);
    }
  }

  /**
   * 🔗 Combine chunks into final file
   */
  private async combineChunks(session: UploadSession, chunks: ChunkInfo[]): Promise<string> {
    const finalPath = path.join(session.sessionPath, 'final_file');
    const writeStream = createWriteStream(finalPath);

    try {
      // Read and combine chunks in order
      for (let i = 0; i < session.uploadedChunks.size; i++) {
        const chunkPath = path.join(session.sessionPath, `chunk_${i.toString().padStart(6, '0')}`);

        if (await this.fileExists(chunkPath)) {
          const chunkStream = createReadStream(chunkPath);
          await this.pipeStreamToStream(chunkStream, writeStream);
        }
      }

      writeStream.end();

      console.log(`🔗 Combined ${session.uploadedChunks.size} chunks into final file`);
      return finalPath;
    } catch (error) {
      writeStream.destroy();
      throw error;
    }
  }

  /**
   * 🧹 Cleanup session files
   */
  private async cleanupSession(uploadId: string): Promise<void> {
    const session = this.activeSessions.get(uploadId);
    if (session) {
      try {
        // Remove chunk files but keep final file
        const files = await fs.readdir(session.sessionPath);
        for (const file of files) {
          if (file.startsWith('chunk_')) {
            await fs.unlink(path.join(session.sessionPath, file));
          }
        }
        console.log(`🧹 Cleaned up chunks for session ${uploadId}`);
      } catch (error) {
        console.warn(`⚠️ Failed to cleanup session ${uploadId}:`, error);
      }
    }
  }

  /**
   * 💾 Wait for memory cleanup
   */
  private async waitForMemoryCleanup(maxWait: number = 5000): Promise<void> {
    const startMemory = process.memoryUsage().heapUsed;
    const startTime = Date.now();

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    // Wait for memory to decrease or timeout
    while (Date.now() - startTime < maxWait) {
      const currentMemory = process.memoryUsage().heapUsed;
      if (currentMemory < startMemory * 0.8) {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * 🛠️ Helper methods
   */
  private generateUploadId(): string {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async ensureTempDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.tempDirectory, { recursive: true });
    } catch (error) {
      console.warn(`⚠️ Failed to create temp directory: ${this.tempDirectory}`);
    }
  }

  private startCleanupTask(): void {
    // Clean up old sessions every hour
    setInterval(
      () => {
        this.cleanupOldSessions();
      },
      60 * 60 * 1000
    );
  }

  private async cleanupOldSessions(): Promise<void> {
    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000; // 24 hours

    for (const [uploadId, session] of this.activeSessions.entries()) {
      if (session.lastActivity < cutoffTime) {
        console.log(`🧹 Cleaning up old session: ${uploadId}`);
        await this.cancelUpload(uploadId);
      }
    }
  }

  private handleUploadError(uploadId: string, error: any): void {
    const progress = this.progressTrackers.get(uploadId);
    if (progress) {
      progress.status = 'failed';
      progress.error = error instanceof Error ? error.message : 'Unknown error';
    }
  }

  private isRecoverableError(error: any): boolean {
    // Define which errors are recoverable for retry
    if (error instanceof Error) {
      return (
        error.message.includes('ENOENT') ||
        error.message.includes('ETIMEDOUT') ||
        error.message.includes('ECONNRESET')
      );
    }
    return false;
  }

  private getMimeType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.csv': 'text/csv',
      '.json': 'application/json',
      '.md': 'text/markdown',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async pipeStreamToStream(
    readStream: NodeJS.ReadableStream,
    writeStream: NodeJS.WritableStream
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      readStream.pipe(writeStream, { end: false });
      readStream.on('end', resolve);
      readStream.on('error', reject);
    });
  }
}
