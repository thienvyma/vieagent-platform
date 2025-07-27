import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import { FolderAnalysis, FileAnalysis } from './folder-analysis-service';
import { StreamingUploadService, UploadProgress, UploadResult } from './streaming-upload-service';

export interface BatchProcessingOptions {
  maxConcurrentJobs: number;
  maxMemoryUsage: number;
  priorityStrategy: 'size' | 'type' | 'fifo' | 'adaptive';
  enableDynamicAdjustment: boolean;
  retryFailedJobs: boolean;
  maxRetries: number;
  progressUpdateInterval: number;
  enablePerformanceMonitoring: boolean;
}

export interface BatchJob {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  priority: number;
  status: BatchJobStatus;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  retryCount: number;
  memoryRequirement: number;
  estimatedProcessingTime: number;
  progress: number;
  error?: string;
  result?: any;
  dependencies: string[];
}

export type BatchJobStatus =
  | 'pending'
  | 'queued'
  | 'processing'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'retrying';

export interface BatchProgress {
  batchId: string;
  totalJobs: number;
  pendingJobs: number;
  processingJobs: number;
  completedJobs: number;
  failedJobs: number;
  overallProgress: number;
  estimatedTimeRemaining: number;
  throughput: number; // jobs per minute
  memoryUsage: number;
  activeWorkers: number;
  queueLength: number;
  errors: BatchError[];
}

export interface BatchError {
  jobId: string;
  fileName: string;
  error: string;
  recoverable: boolean;
  timestamp: Date;
  retryCount: number;
}

export interface BatchResult {
  batchId: string;
  totalJobs: number;
  successfulJobs: number;
  failedJobs: number;
  totalProcessingTime: number;
  averageJobTime: number;
  throughput: number;
  results: BatchJobResult[];
  errors: BatchError[];
  performanceMetrics: BatchPerformanceMetrics;
}

export interface BatchJobResult {
  jobId: string;
  fileName: string;
  status: BatchJobStatus;
  processingTime: number;
  memoryUsed: number;
  result?: any;
  error?: string;
}

export interface BatchPerformanceMetrics {
  averageMemoryUsage: number;
  peakMemoryUsage: number;
  averageJobTime: number;
  totalThroughput: number;
  systemLoadImpact: number;
  resourceUtilization: number;
  bottlenecks: string[];
  recommendations: string[];
}

export interface WorkerStats {
  id: string;
  status: 'idle' | 'processing' | 'paused' | 'error';
  currentJob?: string;
  jobsProcessed: number;
  totalProcessingTime: number;
  averageJobTime: number;
  memoryUsage: number;
  lastActivity: Date;
}

export class BatchProcessingEngine extends EventEmitter {
  private static readonly DEFAULT_OPTIONS: BatchProcessingOptions = {
    maxConcurrentJobs: 3,
    maxMemoryUsage: 256 * 1024 * 1024, // 256MB
    priorityStrategy: 'adaptive',
    enableDynamicAdjustment: true,
    retryFailedJobs: true,
    maxRetries: 3,
    progressUpdateInterval: 1000,
    enablePerformanceMonitoring: true,
  };

  private options: BatchProcessingOptions;
  private jobQueue: BatchJob[] = [];
  private activeJobs: Map<string, BatchJob> = new Map();
  private completedJobs: Map<string, BatchJobResult> = new Map();
  private workers: Map<string, WorkerStats> = new Map();
  private batchProgress: Map<string, BatchProgress> = new Map();
  private streamingService: StreamingUploadService;
  private isProcessing: boolean = false;
  private performanceMonitor: PerformanceMonitor;

  constructor(options: Partial<BatchProcessingOptions> = {}) {
    super();
    this.options = { ...BatchProcessingEngine.DEFAULT_OPTIONS, ...options };
    this.streamingService = new StreamingUploadService();
    this.performanceMonitor = new PerformanceMonitor();
    this.initializeWorkers();
    this.startMonitoring();
  }

  /**
   * 🚀 Start batch processing from folder analysis
   */
  async startBatchProcessing(folderAnalysis: FolderAnalysis, batchId?: string): Promise<string> {
    const id = batchId || this.generateBatchId();

    console.log(`🚀 Starting batch processing: ${id}`);
    console.log(
      `📊 Total files: ${folderAnalysis.totalFiles}, Supported: ${folderAnalysis.supportedFiles}`
    );

    // Create jobs from folder analysis
    const jobs = await this.createJobsFromAnalysis(folderAnalysis, id);

    // Initialize batch progress
    const progress: BatchProgress = {
      batchId: id,
      totalJobs: jobs.length,
      pendingJobs: jobs.length,
      processingJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      overallProgress: 0,
      estimatedTimeRemaining: folderAnalysis.estimatedProcessingTime,
      throughput: 0,
      memoryUsage: 0,
      activeWorkers: 0,
      queueLength: jobs.length,
      errors: [],
    };

    this.batchProgress.set(id, progress);

    // Add jobs to queue with priority sorting
    this.addJobsToQueue(jobs);

    // Start processing if not already running
    if (!this.isProcessing) {
      this.startProcessing();
    }

    this.emit('batchStarted', { batchId: id, totalJobs: jobs.length });

    return id;
  }

  /**
   * 📋 Create jobs from folder analysis
   */
  private async createJobsFromAnalysis(
    folderAnalysis: FolderAnalysis,
    batchId: string
  ): Promise<BatchJob[]> {
    const jobs: BatchJob[] = [];
    let jobIndex = 0;

    // Extract supported files from folder structure
    const supportedFiles = this.extractSupportedFiles(folderAnalysis.folderStructure);

    for (const fileNode of supportedFiles) {
      const job: BatchJob = {
        id: `${batchId}_job_${jobIndex}`,
        fileName: fileNode.name,
        filePath: fileNode.path,
        fileSize: fileNode.size,
        fileType: this.getFileType(fileNode.name),
        priority: this.calculateJobPriority(
          fileNode,
          folderAnalysis.batchStrategy.batchingStrategy
        ),
        status: 'pending',
        createdAt: new Date(),
        retryCount: 0,
        memoryRequirement: Math.min(fileNode.size * 2, this.options.maxMemoryUsage / 10),
        estimatedProcessingTime: Math.ceil(fileNode.size / 50000), // 50KB/s estimate
        progress: 0,
        dependencies: [],
      };

      jobs.push(job);
      jobIndex++;
    }

    // Sort jobs by priority and dependencies
    return this.sortJobsByPriority(jobs);
  }

  /**
   * 📊 Get batch progress
   */
  getBatchProgress(batchId: string): BatchProgress | null {
    return this.batchProgress.get(batchId) || null;
  }

  /**
   * ⏸️ Pause batch processing
   */
  async pauseBatch(batchId: string): Promise<boolean> {
    const progress = this.batchProgress.get(batchId);
    if (progress) {
      // Pause all active jobs for this batch
      for (const [jobId, job] of this.activeJobs.entries()) {
        if (jobId.startsWith(batchId)) {
          job.status = 'paused';
        }
      }

      console.log(`⏸️ Batch paused: ${batchId}`);
      this.emit('batchPaused', { batchId });
      return true;
    }
    return false;
  }

  /**
   * ▶️ Resume batch processing
   */
  async resumeBatch(batchId: string): Promise<boolean> {
    const progress = this.batchProgress.get(batchId);
    if (progress) {
      // Resume paused jobs for this batch
      for (const [jobId, job] of this.activeJobs.entries()) {
        if (jobId.startsWith(batchId) && job.status === 'paused') {
          job.status = 'queued';
        }
      }

      console.log(`▶️ Batch resumed: ${batchId}`);
      this.emit('batchResumed', { batchId });
      return true;
    }
    return false;
  }

  /**
   * ❌ Cancel batch processing
   */
  async cancelBatch(batchId: string): Promise<boolean> {
    const progress = this.batchProgress.get(batchId);
    if (progress) {
      // Cancel all jobs for this batch
      this.jobQueue = this.jobQueue.filter(job => !job.id.startsWith(batchId));

      for (const [jobId, job] of this.activeJobs.entries()) {
        if (jobId.startsWith(batchId)) {
          job.status = 'cancelled';
          this.activeJobs.delete(jobId);
        }
      }

      this.batchProgress.delete(batchId);

      console.log(`❌ Batch cancelled: ${batchId}`);
      this.emit('batchCancelled', { batchId });
      return true;
    }
    return false;
  }

  /**
   * 🔄 Start processing queue
   */
  private async startProcessing(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;
    console.log(
      `🔄 Starting batch processing engine with ${this.options.maxConcurrentJobs} workers`
    );

    while (this.jobQueue.length > 0 || this.activeJobs.size > 0) {
      // Check if we can start new jobs
      if (this.activeJobs.size < this.options.maxConcurrentJobs && this.jobQueue.length > 0) {
        const job = this.getNextJob();
        if (job && this.canStartJob(job)) {
          await this.startJob(job);
        }
      }

      // Check completed jobs
      await this.checkCompletedJobs();

      // Update progress for all batches
      this.updateAllBatchProgress();

      // Dynamic adjustment based on system performance
      if (this.options.enableDynamicAdjustment) {
        this.adjustConcurrencyDynamically();
      }

      // Wait before next iteration
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.isProcessing = false;
    console.log(`✅ Batch processing completed`);
    this.emit('processingCompleted');
  }

  /**
   * 📝 Get next job from queue
   */
  private getNextJob(): BatchJob | null {
    if (this.jobQueue.length === 0) return null;

    // Find highest priority job that meets dependencies
    for (let i = 0; i < this.jobQueue.length; i++) {
      const job = this.jobQueue[i];
      if (this.areDependenciesMet(job)) {
        this.jobQueue.splice(i, 1);
        return job;
      }
    }

    return null;
  }

  /**
   * ✅ Check if job can be started
   */
  private canStartJob(job: BatchJob): boolean {
    // Check memory constraints
    const currentMemoryUsage = this.getCurrentMemoryUsage();
    if (currentMemoryUsage + job.memoryRequirement > this.options.maxMemoryUsage) {
      return false;
    }

    // Check worker availability
    const availableWorkers = this.getAvailableWorkers();
    return availableWorkers.length > 0;
  }

  /**
   * 🏁 Start processing a job
   */
  private async startJob(job: BatchJob): Promise<void> {
    const workerId = this.assignWorker(job);
    if (!workerId) return;

    job.status = 'processing';
    job.startedAt = new Date();
    this.activeJobs.set(job.id, job);

    console.log(`🏁 Starting job: ${job.fileName} (Worker: ${workerId})`);

    try {
      // Process the job (this would be the actual file processing)
      const result = await this.processJob(job, workerId);

      job.status = 'completed';
      job.completedAt = new Date();
      job.progress = 100;
      job.result = result;

      this.completedJobs.set(job.id, {
        jobId: job.id,
        fileName: job.fileName,
        status: job.status,
        processingTime: job.completedAt.getTime() - job.startedAt!.getTime(),
        memoryUsed: job.memoryRequirement,
        result,
      });

      console.log(`✅ Job completed: ${job.fileName}`);
      this.emit('jobCompleted', { job, result });
    } catch (error) {
      console.error(`❌ Job failed: ${job.fileName}`, error);
      await this.handleJobError(job, error);
    } finally {
      this.activeJobs.delete(job.id);
      this.releaseWorker(workerId);
    }
  }

  /**
   * 🔧 Process individual job
   */
  private async processJob(job: BatchJob, workerId: string): Promise<any> {
    const worker = this.workers.get(workerId)!;
    worker.status = 'processing';
    worker.currentJob = job.id;
    worker.lastActivity = new Date();

    // Simulate file processing (in real implementation, this would call actual processors)
    const processingTime = Math.min(job.estimatedProcessingTime * 1000, 10000); // Max 10s

    for (let i = 0; i <= 100; i += 10) {
      job.progress = i;
      await new Promise(resolve => setTimeout(resolve, processingTime / 10));

      // Check if job was cancelled or paused
      if (job.status === 'cancelled' || job.status === 'paused') {
        throw new Error(`Job ${job.status}`);
      }
    }

    worker.jobsProcessed++;
    worker.totalProcessingTime += processingTime;
    worker.averageJobTime = worker.totalProcessingTime / worker.jobsProcessed;
    worker.status = 'idle';
    worker.currentJob = undefined;

    return {
      success: true,
      processingTime,
      outputSize: job.fileSize,
      compressionRatio: 0.8,
      chunks: Math.ceil(job.fileSize / 1024),
      metadata: {
        processedAt: new Date(),
        worker: workerId,
      },
    };
  }

  /**
   * 🛠️ Helper methods
   */
  private initializeWorkers(): void {
    for (let i = 0; i < this.options.maxConcurrentJobs; i++) {
      const workerId = `worker_${i}`;
      this.workers.set(workerId, {
        id: workerId,
        status: 'idle',
        jobsProcessed: 0,
        totalProcessingTime: 0,
        averageJobTime: 0,
        memoryUsage: 0,
        lastActivity: new Date(),
      });
    }
  }

  private startMonitoring(): void {
    if (this.options.enablePerformanceMonitoring) {
      setInterval(() => {
        this.performanceMonitor.collectMetrics(this);
      }, this.options.progressUpdateInterval);
    }
  }

  private extractSupportedFiles(folderStructure: any[]): any[] {
    // This would extract files from the folder structure that are supported
    // For now, returning a simplified structure
    return folderStructure.filter(node => node.type === 'file');
  }

  private getFileType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || 'unknown';
    return ext;
  }

  private calculateJobPriority(fileNode: any, strategy: string): number {
    switch (strategy) {
      case 'size':
        return 100 - Math.min(99, Math.floor(fileNode.size / 10000)); // Smaller files higher priority
      case 'type':
        const typesPriority = { pdf: 90, txt: 80, csv: 70, json: 60 };
        return typesPriority[this.getFileType(fileNode.name)] || 50;
      case 'hybrid':
        return (
          this.calculateJobPriority(fileNode, 'size') * 0.6 +
          this.calculateJobPriority(fileNode, 'type') * 0.4
        );
      default:
        return 50; // Default priority
    }
  }

  private sortJobsByPriority(jobs: BatchJob[]): BatchJob[] {
    return jobs.sort((a, b) => b.priority - a.priority);
  }

  private addJobsToQueue(jobs: BatchJob[]): void {
    this.jobQueue.push(...jobs);
    console.log(`📋 Added ${jobs.length} jobs to processing queue`);
  }

  private areDependenciesMet(job: BatchJob): boolean {
    return job.dependencies.every(depId => this.completedJobs.has(depId));
  }

  private getCurrentMemoryUsage(): number {
    return Array.from(this.activeJobs.values()).reduce(
      (sum, job) => sum + job.memoryRequirement,
      0
    );
  }

  private getAvailableWorkers(): WorkerStats[] {
    return Array.from(this.workers.values()).filter(worker => worker.status === 'idle');
  }

  private assignWorker(job: BatchJob): string | null {
    const availableWorkers = this.getAvailableWorkers();
    if (availableWorkers.length === 0) return null;

    // Assign least loaded worker
    const worker = availableWorkers.reduce((min, curr) =>
      curr.totalProcessingTime < min.totalProcessingTime ? curr : min
    );

    return worker.id;
  }

  private releaseWorker(workerId: string): void {
    const worker = this.workers.get(workerId);
    if (worker) {
      worker.status = 'idle';
      worker.currentJob = undefined;
      worker.lastActivity = new Date();
    }
  }

  private async handleJobError(job: BatchJob, error: any): Promise<void> {
    job.retryCount++;

    if (this.options.retryFailedJobs && job.retryCount <= this.options.maxRetries) {
      job.status = 'retrying';
      console.log(`🔄 Retrying job: ${job.fileName} (Attempt ${job.retryCount})`);

      // Add back to queue with delay
      setTimeout(() => {
        job.status = 'pending';
        this.jobQueue.unshift(job); // Add to front for immediate retry
      }, 1000 * job.retryCount); // Exponential backoff
    } else {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';

      console.error(`❌ Job permanently failed: ${job.fileName}`);
      this.emit('jobFailed', { job, error });
    }
  }

  private async checkCompletedJobs(): Promise<void> {
    // This method would check for completed async jobs
    // For now, jobs are processed synchronously
  }

  private updateAllBatchProgress(): void {
    for (const [batchId, progress] of this.batchProgress.entries()) {
      this.updateBatchProgress(batchId);
    }
  }

  private updateBatchProgress(batchId: string): void {
    const progress = this.batchProgress.get(batchId);
    if (!progress) return;

    const batchJobs = this.getAllJobsForBatch(batchId);

    progress.pendingJobs = batchJobs.filter(
      j => j.status === 'pending' || j.status === 'queued'
    ).length;
    progress.processingJobs = batchJobs.filter(j => j.status === 'processing').length;
    progress.completedJobs = batchJobs.filter(j => j.status === 'completed').length;
    progress.failedJobs = batchJobs.filter(j => j.status === 'failed').length;
    progress.overallProgress = (progress.completedJobs / progress.totalJobs) * 100;
    progress.memoryUsage = this.getCurrentMemoryUsage();
    progress.activeWorkers = Array.from(this.workers.values()).filter(
      w => w.status === 'processing'
    ).length;
    progress.queueLength = this.jobQueue.length;

    this.emit('progressUpdated', progress);
  }

  private getAllJobsForBatch(batchId: string): BatchJob[] {
    const allJobs = [
      ...this.jobQueue.filter(j => j.id.startsWith(batchId)),
      ...Array.from(this.activeJobs.values()).filter(j => j.id.startsWith(batchId)),
      ...Array.from(this.completedJobs.keys())
        .filter(id => id.startsWith(batchId))
        .map(id => ({ id, status: 'completed' }) as BatchJob),
    ];
    return allJobs;
  }

  private adjustConcurrencyDynamically(): void {
    const memoryUsage = process.memoryUsage().heapUsed;
    const memoryPercentage = memoryUsage / this.options.maxMemoryUsage;

    if (memoryPercentage > 0.8 && this.options.maxConcurrentJobs > 1) {
      this.options.maxConcurrentJobs = Math.max(1, this.options.maxConcurrentJobs - 1);
      console.log(
        `📉 Reduced concurrency to ${this.options.maxConcurrentJobs} due to memory pressure`
      );
    } else if (memoryPercentage < 0.5 && this.options.maxConcurrentJobs < 5) {
      this.options.maxConcurrentJobs++;
      console.log(`📈 Increased concurrency to ${this.options.maxConcurrentJobs}`);
    }
  }

  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 📊 Performance Monitor for batch processing
 */
class PerformanceMonitor {
  private metrics: any[] = [];

  collectMetrics(engine: BatchProcessingEngine): void {
    const memoryUsage = process.memoryUsage();
    const metric = {
      timestamp: new Date(),
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      external: memoryUsage.external,
      cpuUsage: process.cpuUsage(),
    };

    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500);
    }
  }

  getPerformanceReport(): any {
    if (this.metrics.length === 0) return null;

    const latest = this.metrics[this.metrics.length - 1];
    const average = this.metrics.reduce(
      (acc, m) => ({
        heapUsed: acc.heapUsed + m.heapUsed,
        heapTotal: acc.heapTotal + m.heapTotal,
      }),
      { heapUsed: 0, heapTotal: 0 }
    );

    return {
      current: latest,
      average: {
        heapUsed: average.heapUsed / this.metrics.length,
        heapTotal: average.heapTotal / this.metrics.length,
      },
      trend: this.calculateTrend(),
    };
  }

  private calculateTrend(): string {
    if (this.metrics.length < 10) return 'insufficient_data';

    const recent = this.metrics.slice(-10);
    const older = this.metrics.slice(-20, -10);

    const recentAvg = recent.reduce((sum, m) => sum + m.heapUsed, 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + m.heapUsed, 0) / older.length;

    const change = (recentAvg - olderAvg) / olderAvg;

    if (change > 0.1) return 'increasing';
    if (change < -0.1) return 'decreasing';
    return 'stable';
  }
}
