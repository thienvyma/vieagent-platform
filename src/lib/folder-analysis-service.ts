import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface FileAnalysis {
  name: string;
  path: string;
  size: number;
  type: string;
  mimeType: string;
  lastModified: Date;
  hash: string;
  isSupported: boolean;
  errorReason?: string;
  estimatedProcessingTime: number;
  memoryRequirement: number;
}

export interface FolderAnalysis {
  totalFiles: number;
  totalSize: number;
  supportedFiles: number;
  unsupportedFiles: number;
  folderStructure: FolderNode[];
  fileTypes: Map<string, number>;
  recommendations: FolderRecommendation[];
  estimatedUploadTime: number;
  estimatedProcessingTime: number;
  memoryRequirement: number;
  riskAssessment: RiskAssessment;
  batchStrategy: BatchStrategy;
}

export interface FolderNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  size: number;
  children?: FolderNode[];
  analysis?: FileAnalysis;
}

export interface FolderRecommendation {
  type: 'warning' | 'suggestion' | 'optimization';
  category: 'performance' | 'compatibility' | 'storage' | 'processing';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  action?: string;
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high';
  memoryRisk: 'low' | 'medium' | 'high';
  performanceRisk: 'low' | 'medium' | 'high';
  storageRisk: 'low' | 'medium' | 'high';
  risks: string[];
  mitigations: string[];
}

export interface BatchStrategy {
  recommendedBatchSize: number;
  totalBatches: number;
  batchingStrategy: 'size' | 'count' | 'type' | 'hybrid';
  priority: 'sequential' | 'parallel' | 'adaptive';
  estimatedDuration: number;
}

export class FolderAnalysisService {
  private static readonly SUPPORTED_TYPES = new Set([
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/json',
    'text/markdown',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]);

  private static readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  private static readonly MEMORY_LIMIT = 512 * 1024 * 1024; // 512MB
  private static readonly PROCESSING_SPEED = 50 * 1024; // 50KB/s processing speed

  /**
   * 📁 Analyze folder structure and files
   */
  static async analyzeFolder(folderPath: string): Promise<FolderAnalysis> {
    console.log(`🔍 Starting folder analysis: ${folderPath}`);
    const startTime = Date.now();

    try {
      const folderStructure = await this.buildFolderStructure(folderPath);
      const filesList = this.extractFilesList(folderStructure);

      console.log(`📊 Found ${filesList.length} files in folder structure`);

      // Analyze each file
      const fileAnalyses: FileAnalysis[] = [];
      let totalSize = 0;
      let supportedFiles = 0;
      let unsupportedFiles = 0;
      const fileTypes = new Map<string, number>();

      for (const file of filesList) {
        const analysis = await this.analyzeFile(file);
        fileAnalyses.push(analysis);

        totalSize += analysis.size;

        if (analysis.isSupported) {
          supportedFiles++;
        } else {
          unsupportedFiles++;
        }

        const typeCount = fileTypes.get(analysis.type) || 0;
        fileTypes.set(analysis.type, typeCount + 1);
      }

      // Generate recommendations
      const recommendations = this.generateRecommendations(fileAnalyses, totalSize);

      // Assess risks
      const riskAssessment = this.assessRisks(fileAnalyses, totalSize);

      // Create batch strategy
      const batchStrategy = this.createBatchStrategy(fileAnalyses, totalSize);

      const analysis: FolderAnalysis = {
        totalFiles: filesList.length,
        totalSize,
        supportedFiles,
        unsupportedFiles,
        folderStructure: [folderStructure],
        fileTypes,
        recommendations,
        estimatedUploadTime: this.estimateUploadTime(totalSize),
        estimatedProcessingTime: this.estimateProcessingTime(fileAnalyses),
        memoryRequirement: this.calculateMemoryRequirement(fileAnalyses),
        riskAssessment,
        batchStrategy,
      };

      const duration = Date.now() - startTime;
      console.log(`✅ Folder analysis completed in ${duration}ms`);

      return analysis;
    } catch (error) {
      console.error('❌ Folder analysis failed:', error);
      throw new Error(
        `Folder analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 🏗️ Build recursive folder structure
   */
  private static async buildFolderStructure(folderPath: string): Promise<FolderNode> {
    const stats = await fs.stat(folderPath);
    const node: FolderNode = {
      name: path.basename(folderPath),
      path: folderPath,
      type: stats.isDirectory() ? 'folder' : 'file',
      size: stats.size,
    };

    if (stats.isDirectory()) {
      try {
        const entries = await fs.readdir(folderPath);
        node.children = [];

        for (const entry of entries) {
          const entryPath = path.join(folderPath, entry);
          try {
            const childNode = await this.buildFolderStructure(entryPath);
            node.children.push(childNode);
            node.size += childNode.size;
          } catch (error) {
            console.warn(`⚠️ Skipping inaccessible entry: ${entryPath}`);
          }
        }
      } catch (error) {
        console.warn(`⚠️ Cannot read directory: ${folderPath}`);
      }
    }

    return node;
  }

  /**
   * 📋 Extract flat list of files from folder structure
   */
  private static extractFilesList(node: FolderNode): FolderNode[] {
    const files: FolderNode[] = [];

    if (node.type === 'file') {
      files.push(node);
    } else if (node.children) {
      for (const child of node.children) {
        files.push(...this.extractFilesList(child));
      }
    }

    return files;
  }

  /**
   * 🔍 Analyze individual file
   */
  private static async analyzeFile(file: FolderNode): Promise<FileAnalysis> {
    try {
      const stats = await fs.stat(file.path);
      const fileBuffer = await fs.readFile(file.path);
      const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');

      const extension = path.extname(file.name).toLowerCase();
      const mimeType = this.getMimeType(extension);
      const isSupported = this.SUPPORTED_TYPES.has(mimeType);

      let errorReason: string | undefined;
      if (!isSupported) {
        errorReason = `Unsupported file type: ${extension}`;
      } else if (file.size > this.MAX_FILE_SIZE) {
        errorReason = `File too large: ${this.formatBytes(file.size)} (max: ${this.formatBytes(this.MAX_FILE_SIZE)})`;
      }

      return {
        name: file.name,
        path: file.path,
        size: file.size,
        type: extension,
        mimeType,
        lastModified: stats.mtime,
        hash,
        isSupported: isSupported && file.size <= this.MAX_FILE_SIZE,
        errorReason,
        estimatedProcessingTime: Math.ceil(file.size / this.PROCESSING_SPEED),
        memoryRequirement: Math.min(file.size * 2, this.MEMORY_LIMIT / 10), // Estimate 2x file size, max 10% of limit
      };
    } catch (error) {
      return {
        name: file.name,
        path: file.path,
        size: 0,
        type: 'unknown',
        mimeType: 'application/octet-stream',
        lastModified: new Date(),
        hash: '',
        isSupported: false,
        errorReason: `Cannot access file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        estimatedProcessingTime: 0,
        memoryRequirement: 0,
      };
    }
  }

  /**
   * 💡 Generate recommendations based on analysis
   */
  private static generateRecommendations(
    files: FileAnalysis[],
    totalSize: number
  ): FolderRecommendation[] {
    const recommendations: FolderRecommendation[] = [];

    // Large folder warning
    if (files.length > 100) {
      recommendations.push({
        type: 'warning',
        category: 'performance',
        title: 'Large Folder Detected',
        description: `Folder contains ${files.length} files. Consider processing in smaller batches.`,
        impact: 'medium',
        action: 'Enable batch processing',
      });
    }

    // Total size warning
    if (totalSize > 500 * 1024 * 1024) {
      // 500MB
      recommendations.push({
        type: 'warning',
        category: 'storage',
        title: 'Large Total Size',
        description: `Total size is ${this.formatBytes(totalSize)}. Processing may take significant time.`,
        impact: 'high',
        action: 'Consider selective upload',
      });
    }

    // Unsupported files
    const unsupportedFiles = files.filter(f => !f.isSupported);
    if (unsupportedFiles.length > 0) {
      recommendations.push({
        type: 'suggestion',
        category: 'compatibility',
        title: 'Unsupported Files Found',
        description: `${unsupportedFiles.length} files will be skipped due to unsupported format or size.`,
        impact: 'low',
        action: 'Review file types',
      });
    }

    // Memory optimization
    const highMemoryFiles = files.filter(f => f.memoryRequirement > 50 * 1024 * 1024); // 50MB
    if (highMemoryFiles.length > 0) {
      recommendations.push({
        type: 'optimization',
        category: 'performance',
        title: 'Memory Optimization Available',
        description: `${highMemoryFiles.length} large files detected. Enable streaming processing.`,
        impact: 'medium',
        action: 'Enable streaming mode',
      });
    }

    return recommendations;
  }

  /**
   * ⚠️ Assess processing risks
   */
  private static assessRisks(files: FileAnalysis[], totalSize: number): RiskAssessment {
    const risks: string[] = [];
    const mitigations: string[] = [];

    let memoryRisk: 'low' | 'medium' | 'high' = 'low';
    let performanceRisk: 'low' | 'medium' | 'high' = 'low';
    let storageRisk: 'low' | 'medium' | 'high' = 'low';

    // Memory assessment
    const totalMemoryNeeded = files.reduce((sum, f) => sum + f.memoryRequirement, 0);
    if (totalMemoryNeeded > this.MEMORY_LIMIT) {
      memoryRisk = 'high';
      risks.push('Total memory requirement exceeds system limits');
      mitigations.push('Enable streaming processing and batch mode');
    } else if (totalMemoryNeeded > this.MEMORY_LIMIT * 0.7) {
      memoryRisk = 'medium';
      risks.push('High memory usage expected');
      mitigations.push('Monitor memory usage during processing');
    }

    // Performance assessment
    const totalProcessingTime = files.reduce((sum, f) => sum + f.estimatedProcessingTime, 0);
    if (totalProcessingTime > 3600) {
      // 1 hour
      performanceRisk = 'high';
      risks.push('Processing may take over 1 hour');
      mitigations.push('Enable parallel processing');
    } else if (totalProcessingTime > 600) {
      // 10 minutes
      performanceRisk = 'medium';
      risks.push('Processing may take 10+ minutes');
      mitigations.push('Show progress indicators');
    }

    // Storage assessment
    if (totalSize > 1024 * 1024 * 1024) {
      // 1GB
      storageRisk = 'high';
      risks.push('Large storage requirement');
      mitigations.push('Enable compression and deduplication');
    }

    const overallRisk = [memoryRisk, performanceRisk, storageRisk].includes('high')
      ? 'high'
      : [memoryRisk, performanceRisk, storageRisk].includes('medium')
        ? 'medium'
        : 'low';

    return {
      overallRisk,
      memoryRisk,
      performanceRisk,
      storageRisk,
      risks,
      mitigations,
    };
  }

  /**
   * 📦 Create optimal batch processing strategy
   */
  private static createBatchStrategy(files: FileAnalysis[], totalSize: number): BatchStrategy {
    const supportedFiles = files.filter(f => f.isSupported);

    // Determine batch size based on memory and file count
    let recommendedBatchSize: number;
    let batchingStrategy: 'size' | 'count' | 'type' | 'hybrid';

    if (supportedFiles.length <= 10) {
      recommendedBatchSize = supportedFiles.length;
      batchingStrategy = 'count';
    } else if (totalSize > 500 * 1024 * 1024) {
      // 500MB
      recommendedBatchSize = 5; // Small batches for large total size
      batchingStrategy = 'size';
    } else {
      recommendedBatchSize = Math.min(20, Math.ceil(supportedFiles.length / 5));
      batchingStrategy = 'hybrid';
    }

    const totalBatches = Math.ceil(supportedFiles.length / recommendedBatchSize);

    // Determine processing priority
    let priority: 'sequential' | 'parallel' | 'adaptive';
    if (totalSize > 1024 * 1024 * 1024) {
      // 1GB
      priority = 'sequential'; // Conservative for very large folders
    } else if (supportedFiles.length > 50) {
      priority = 'adaptive'; // Adaptive based on system load
    } else {
      priority = 'parallel'; // Parallel for smaller folders
    }

    const estimatedDuration = Math.ceil(
      supportedFiles.reduce((sum, f) => sum + f.estimatedProcessingTime, 0) /
        (priority === 'parallel' ? Math.min(recommendedBatchSize, 3) : 1)
    );

    return {
      recommendedBatchSize,
      totalBatches,
      batchingStrategy,
      priority,
      estimatedDuration,
    };
  }

  /**
   * 🕐 Estimate upload time based on size
   */
  private static estimateUploadTime(totalSize: number): number {
    const averageUploadSpeed = 1024 * 1024; // 1MB/s
    return Math.ceil(totalSize / averageUploadSpeed);
  }

  /**
   * ⏱️ Estimate processing time for all files
   */
  private static estimateProcessingTime(files: FileAnalysis[]): number {
    return files.reduce((sum, file) => sum + file.estimatedProcessingTime, 0);
  }

  /**
   * 💾 Calculate total memory requirement
   */
  private static calculateMemoryRequirement(files: FileAnalysis[]): number {
    return files.reduce((sum, file) => sum + file.memoryRequirement, 0);
  }

  /**
   * 🎯 Get MIME type from file extension
   */
  private static getMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.csv': 'text/csv',
      '.json': 'application/json',
      '.md': 'text/markdown',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };

    return mimeTypes[extension] || 'application/octet-stream';
  }

  /**
   * 📏 Format bytes to human readable format
   */
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
