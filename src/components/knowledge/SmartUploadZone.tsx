'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
// Note: framer-motion animations would enhance UX but not required for core functionality

// ✅ Enhanced interfaces for large folder processing
interface UploadResult {
  message?: string;
  id?: string;
  filename?: string;
  type?: string;
  status?: string;
  progressPercent?: number;
  batchId?: string;
  analysisId?: string;
}

interface SmartUploadZoneProps {
  onUploadSuccess: (result: UploadResult) => void;
  onUploadError: (error: string) => void;
  onCancel: () => void;
  onFileUpload?: (files: File[]) => Promise<void>;
  uploadProgress?: InternalUploadProgress[];
}

interface UploadFile {
  file: File;
  type: 'document' | 'conversation' | 'unknown';
  subtype: string;
  preview?: string;
  id: string;
  relativePath?: string; // For folder uploads
}

interface InternalUploadProgress {
  [key: string]: {
    progress: number;
    status: 'uploading' | 'completed' | 'failed';
    error?: string;
  };
}

// 📁 Large folder processing interfaces
interface FolderAnalysis {
  totalFiles: number;
  totalSize: number;
  supportedFiles: number;
  unsupportedFiles: number;
  estimatedUploadTime: number;
  estimatedProcessingTime: number;
  memoryRequirement: number;
  riskAssessment: {
    overallRisk: 'low' | 'medium' | 'high';
    risks: string[];
    mitigations: string[];
  };
  batchStrategy: {
    recommendedBatchSize: number;
    totalBatches: number;
    batchingStrategy: string;
    priority: string;
    estimatedDuration: number;
  };
  recommendations: Array<{
    type: 'warning' | 'suggestion' | 'optimization';
    title: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
  }>;
  analysisId: string;
  tempFolderId: string;
}

interface BatchProgress {
  batchId: string;
  totalJobs: number;
  pendingJobs: number;
  processingJobs: number;
  completedJobs: number;
  failedJobs: number;
  overallProgress: number;
  estimatedTimeRemaining: number;
  throughput: number;
  memoryUsage: number;
  activeWorkers: number;
  formattedProgress?: string;
  formattedTimeRemaining?: string;
  formattedThroughput?: string;
  formattedMemoryUsage?: string;
}

const SUPPORTED_TYPES = {
  // Document types
  'application/pdf': { type: 'document', subtype: 'pdf', icon: '📄' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    type: 'document',
    subtype: 'docx',
    icon: '📝',
  },
  'application/msword': { type: 'document', subtype: 'doc', icon: '📝' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
    type: 'document',
    subtype: 'xlsx',
    icon: '📊',
  },
  'application/vnd.ms-excel': { type: 'document', subtype: 'xls', icon: '📊' },
  'text/html': { type: 'document', subtype: 'html', icon: '🌐' },
  'application/rtf': { type: 'document', subtype: 'rtf', icon: '📄' },
  'text/plain': { type: 'document', subtype: 'txt', icon: '📄' },
  'text/csv': { type: 'document', subtype: 'csv', icon: '📊' },

  // Conversation types
  'application/json': { type: 'conversation', subtype: 'json', icon: '💬' },
  'application/zip': { type: 'conversation', subtype: 'zip', icon: '📦' },
};

export default function SmartUploadZone({
  onUploadSuccess,
  onUploadError,
  onCancel,
  onFileUpload,
  uploadProgress: externalUploadProgress,
}: SmartUploadZoneProps) {
  const [uploadMode, setUploadMode] = useState<'single' | 'batch' | 'folder' | 'large-folder'>(
    'single'
  );
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<InternalUploadProgress>({});
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // 📁 Large folder processing state
  const [folderAnalysis, setFolderAnalysis] = useState<FolderAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
  const [showAnalysisResults, setShowAnalysisResults] = useState(false);
  const [processingOptions, setProcessingOptions] = useState({
    concurrentJobs: 3,
    memoryLimit: 256 * 1024 * 1024,
    strategy: 'adaptive',
    retryFailedJobs: true,
    maxRetries: 3,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Use external upload progress if provided
  const currentUploadProgress = externalUploadProgress || Object.values(uploadProgress);

  // 🔄 Poll batch progress
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;

    if (currentBatchId && uploadMode === 'large-folder') {
      pollInterval = setInterval(async () => {
        try {
          const formData = new FormData();
          formData.append('action', 'get_progress');
          formData.append('batchId', currentBatchId);

          const response = await fetch('/api/knowledge/large-folder', {
            method: 'POST',
            body: formData,
          });

          const result = await response.json();
          if (result.success) {
            setBatchProgress(result.progress);

            // Check if processing is complete
            if (result.progress.overallProgress >= 100) {
              setIsUploading(false);
              onUploadSuccess({
                message: 'Large folder processing completed successfully',
                batchId: currentBatchId,
              });
              clearInterval(pollInterval!);
              setCurrentBatchId(null);
            }
          }
        } catch (error) {
          console.error('Failed to get batch progress:', error);
        }
      }, 2000);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [currentBatchId, uploadMode, onUploadSuccess]);

  // File type detection
  const detectFileType = useCallback((file: File, relativePath?: string): UploadFile => {
    const mimeType = file.type || 'unknown';
    const extension = file.name.toLowerCase().split('.').pop() || '';

    let detectedType = SUPPORTED_TYPES[mimeType as keyof typeof SUPPORTED_TYPES];

    // Fallback to extension-based detection
    if (!detectedType) {
      const extensionMap: { [key: string]: any } = {
        pdf: { type: 'document', subtype: 'pdf', icon: '📄' },
        docx: { type: 'document', subtype: 'docx', icon: '📝' },
        doc: { type: 'document', subtype: 'doc', icon: '📝' },
        xlsx: { type: 'document', subtype: 'xlsx', icon: '📊' },
        xls: { type: 'document', subtype: 'xls', icon: '📊' },
        html: { type: 'document', subtype: 'html', icon: '🌐' },
        htm: { type: 'document', subtype: 'html', icon: '🌐' },
        rtf: { type: 'document', subtype: 'rtf', icon: '📄' },
        txt: { type: 'document', subtype: 'txt', icon: '📄' },
        csv: { type: 'document', subtype: 'csv', icon: '📊' },
        json: { type: 'conversation', subtype: 'json', icon: '💬' },
        zip: { type: 'conversation', subtype: 'zip', icon: '📦' },
        md: { type: 'document', subtype: 'markdown', icon: '📝' },
      };
      detectedType = extensionMap[extension] || { type: 'unknown', subtype: 'unknown', icon: '❓' };
    }

    return {
      file,
      type: detectedType.type as 'document' | 'conversation' | 'unknown',
      subtype: detectedType.subtype,
      preview: detectedType.icon,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      relativePath,
    };
  }, []);

  // 📁 Analyze large folder
  const analyzeLargeFolder = async (files: File[]) => {
    setIsAnalyzing(true);
    setFolderAnalysis(null);

    try {
      console.log(`🔍 Analyzing large folder with ${files.length} files`);

      const formData = new FormData();
      formData.append('action', 'analyze');

      // Add files with preserved paths
      files.forEach((file, index) => {
        formData.append('folder_files', file);
        // Preserve relative path structure
        const relativePath = (file as any).webkitRelativePath || file.name;
        formData.append(`folder_paths_${index}`, relativePath);
      });

      const response = await fetch('/api/knowledge/large-folder', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setFolderAnalysis(result.analysis);
        setShowAnalysisResults(true);
        console.log('✅ Folder analysis completed:', result.analysis);

        toast.success(
          `Folder analyzed: ${result.analysis.supportedFiles}/${result.analysis.totalFiles} files supported`
        );
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('❌ Folder analysis failed:', error);
      onUploadError(
        `Folder analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 🚀 Start large folder processing
  const startLargeFolderProcessing = async () => {
    if (!folderAnalysis) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('action', 'start_processing');
      formData.append('analysisId', folderAnalysis.analysisId);
      formData.append('tempFolderId', folderAnalysis.tempFolderId);
      formData.append('options', JSON.stringify(processingOptions));

      const response = await fetch('/api/knowledge/large-folder', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setCurrentBatchId(result.batchId);
        setShowAnalysisResults(false);
        console.log('✅ Large folder processing started:', result.batchId);

        toast.success('Large folder processing started successfully');
      } else {
        throw new Error(result.error || 'Failed to start processing');
      }
    } catch (error) {
      console.error('❌ Failed to start processing:', error);
      setIsUploading(false);
      onUploadError(
        `Failed to start processing: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  // ⏸️ Pause/Resume/Cancel batch processing
  const pauseBatchProcessing = async () => {
    if (!currentBatchId) return;

    try {
      const formData = new FormData();
      formData.append('action', 'pause');
      formData.append('batchId', currentBatchId);

      const response = await fetch('/api/knowledge/large-folder', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Processing paused');
      }
    } catch (error) {
      console.error('Failed to pause processing:', error);
    }
  };

  const resumeBatchProcessing = async () => {
    if (!currentBatchId) return;

    try {
      const formData = new FormData();
      formData.append('action', 'resume');
      formData.append('batchId', currentBatchId);

      const response = await fetch('/api/knowledge/large-folder', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Processing resumed');
      }
    } catch (error) {
      console.error('Failed to resume processing:', error);
    }
  };

  const cancelBatchProcessing = async () => {
    if (!currentBatchId) return;

    try {
      const formData = new FormData();
      formData.append('action', 'cancel');
      formData.append('batchId', currentBatchId);

      const response = await fetch('/api/knowledge/large-folder', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        setCurrentBatchId(null);
        setBatchProgress(null);
        setIsUploading(false);
        toast.success('Processing cancelled');
      }
    } catch (error) {
      console.error('Failed to cancel processing:', error);
    }
  };

  // Handle file drops and selections
  const handleFileDrop = useCallback(
    (acceptedFiles: File[]) => {
      console.log(`📁 Files dropped: ${acceptedFiles.length}`);

      // Check if this is a large folder (>50 files or >100MB total)
      const totalSize = acceptedFiles.reduce((sum, file) => sum + file.size, 0);
      const isLargeFolder = acceptedFiles.length > 50 || totalSize > 100 * 1024 * 1024;

      if (isLargeFolder) {
        console.log('🚀 Large folder detected, switching to large folder mode');
        setUploadMode('large-folder');
        analyzeLargeFolder(acceptedFiles);
      } else {
        // Handle as regular upload
        const processedFiles = acceptedFiles.map(file => detectFileType(file, undefined));
        setUploadFiles(processedFiles);

        if (acceptedFiles.length > 1) {
          setUploadMode('batch');
        } else {
          setUploadMode('single');
        }
      }
    },
    [detectFileType, analyzeLargeFolder]
  );

  // Dropzone configuration
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const detectedFiles = acceptedFiles.map(file => detectFileType(file));

      if (uploadMode === 'single' && detectedFiles.length > 1) {
        toast.error('Single file mode: Please select only one file');
        return;
      }

      setUploadFiles(prev => [...prev, ...detectedFiles]);
      setDragActive(false);
    },
    [uploadMode, detectFileType]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/html': ['.html', '.htm'],
      'application/rtf': ['.rtf'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'application/json': ['.json'],
      'application/zip': ['.zip'],
    },
    maxSize: 100 * 1024 * 1024, // 100MB
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
    onDropRejected: rejectedFiles => {
      rejectedFiles.forEach(rejection => {
        toast.error(
          `File ${rejection.file.name} rejected: ${rejection.errors.map(e => e.message).join(', ')}`
        );
      });
    },
  });

  // Handle file selection
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const detectedFiles = Array.from(files).map(file => detectFileType(file, undefined)); // ✅ fixed from TS Phase 2
      setUploadFiles(prev => [...prev, ...detectedFiles]);
    }
  }, [detectFileType]); // ✅ Optimization: useCallback applied to handleFileSelect

  // Handle folder selection
  const handleFolderSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const detectedFiles = Array.from(files).map(file => detectFileType(file, (file as any).webkitRelativePath)); // ✅ fixed from TS Phase 2
      setUploadFiles(detectedFiles);
      setUploadMode('folder');
    }
  }, [detectFileType]); // ✅ Optimization: useCallback applied to handleFolderSelect

  // Remove file from upload list
  const removeFile = useCallback((fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId));
  }, []); // ✅ Optimization: useCallback applied to removeFile

  // Upload and process file through unified pipeline
  const uploadSingleFile = async (uploadFile: UploadFile): Promise<any> => {
    // Step 1: Upload file and save to database using correct endpoint
    const formData = new FormData();
    formData.append('file', uploadFile.file);

    // Update progress to uploading
    setUploadProgress(prev => ({
      ...prev,
      [uploadFile.id]: { progress: 10, status: 'uploading' },
    }));

    try {
      // Upload file using knowledge upload API (corrected endpoint)
      const uploadResponse = await fetch('/api/knowledge/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const uploadResult = await uploadResponse.json();
      if (!uploadResult.success) {
        throw new Error(uploadResult.message || 'Upload failed');
      }

      // Update progress to processing
      setUploadProgress(prev => ({
        ...prev,
        [uploadFile.id]: { progress: 50, status: 'uploading' },
      }));

      // Step 2: Start processing through the fixed knowledge processing pipeline
      const processResponse = await fetch('/api/knowledge/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemIds: [uploadResult.data.id],
          action: 'process',
          options: {
            chunkSize: 500,
            overlap: 50,
            generateEmbeddings: true,
          },
        }),
      });

      if (!processResponse.ok) {
        throw new Error('Processing failed');
      }

      const processResult = await processResponse.json();

      // Update progress to completed
      setUploadProgress(prev => ({
        ...prev,
        [uploadFile.id]: { progress: 100, status: 'completed' },
      }));

      return {
        id: uploadResult.data.id,
        fileName: uploadFile.file.name,
        status: 'completed',
        processResult,
      };
    } catch (error) {
      setUploadProgress(prev => ({
        ...prev,
        [uploadFile.id]: {
          progress: 0,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }));
      throw error;
    }
  };

  // Start upload process
  const startUpload = useCallback(async () => {
    if (uploadFiles.length === 0) return;

    setIsUploading(true);

    try {
      if (onFileUpload) {
        // Use parent component's upload handler
        const files = uploadFiles.map(uf => uf.file);
        await onFileUpload(files);
        onUploadSuccess({ message: 'Files uploaded successfully' });
      } else {
        // Use internal upload logic
        const results = [];

        for (const uploadFile of uploadFiles) {
          try {
            const result = await uploadSingleFile(uploadFile);
            results.push(result);
            onUploadSuccess(result);
          } catch (error) {
            onUploadError(error instanceof Error ? error.message : 'Upload failed');
          }
        }
      }

      // Clear upload queue
      setUploadFiles([]);
      setUploadProgress({});
    } catch (error) {
      console.error('Upload error:', error);
      onUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [uploadFiles, onFileUpload, onUploadSuccess, onUploadError]); // ✅ Optimization: useCallback applied to startUpload

  // Format file size
  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []); // ✅ Optimization: useCallback applied to formatFileSize

  // Get file type icon
  const getFileTypeInfo = useCallback((uploadFile: UploadFile) => {
    const mimeType = uploadFile.file.type;
    const typeInfo = SUPPORTED_TYPES[mimeType as keyof typeof SUPPORTED_TYPES];
    return typeInfo || { icon: '❓', type: 'unknown', subtype: 'unknown' };
  }, []); // ✅ Optimization: useCallback applied to getFileTypeInfo

  return (
    <div className='space-y-4 sm:space-y-6 max-h-[80vh] overflow-hidden flex flex-col'>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(249, 115, 22, 0.6);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(249, 115, 22, 0.8);
        }
      `}</style>

      {/* Upload Mode Selection */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        <button
          onClick={() => setUploadMode('single')}
          className={`p-4 rounded-xl border-2 transition-all duration-300 ${
            uploadMode === 'single'
              ? 'border-orange-500 bg-orange-500/10 text-orange-300'
              : 'border-gray-600 hover:border-gray-500 text-gray-300'
          }`}
        >
          <div className='flex items-center space-x-3'>
            <span className='text-2xl'>📄</span>
            <div className='text-left'>
              <div className='font-semibold'>Single File</div>
              <div className='text-sm opacity-75'>Upload one file</div>
            </div>
          </div>
        </button>

        <button
          onClick={() => setUploadMode('batch')}
          className={`p-4 rounded-xl border-2 transition-all duration-300 ${
            uploadMode === 'batch'
              ? 'border-orange-500 bg-orange-500/10 text-orange-300'
              : 'border-gray-600 hover:border-gray-500 text-gray-300'
          }`}
        >
          <div className='flex items-center space-x-3'>
            <span className='text-2xl'>📚</span>
            <div className='text-left'>
              <div className='font-semibold'>Batch Upload</div>
              <div className='text-sm opacity-75'>Multiple files</div>
            </div>
          </div>
        </button>

        <button
          onClick={() => setUploadMode('folder')}
          className={`p-4 rounded-xl border-2 transition-all duration-300 ${
            uploadMode === 'folder'
              ? 'border-orange-500 bg-orange-500/10 text-orange-300'
              : 'border-gray-600 hover:border-gray-500 text-gray-300'
          }`}
        >
          <div className='flex items-center space-x-3'>
            <span className='text-2xl'>📁</span>
            <div className='text-left'>
              <div className='font-semibold'>Folder Upload</div>
              <div className='text-sm opacity-75'>Upload folder</div>
            </div>
          </div>
        </button>
      </div>

      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl sm:rounded-2xl p-4 sm:p-8 text-center transition-all duration-300 cursor-pointer ${
          isDragActive || dragActive
            ? 'border-orange-500 bg-orange-500/10'
            : 'border-gray-600 hover:border-gray-500 bg-white/5'
        }`}
      >
        <input {...getInputProps()} />
        <div className='flex flex-col items-center space-y-3 sm:space-y-4'>
          <div className='w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl sm:rounded-2xl flex items-center justify-center'>
            <span className='text-2xl sm:text-3xl'>
              {uploadMode === 'single' ? '📄' : uploadMode === 'batch' ? '📚' : '📁'}
            </span>
          </div>
          <div>
            <h3 className='text-lg sm:text-xl font-semibold text-white mb-2'>
              {uploadMode === 'single'
                ? 'Drop a file here'
                : uploadMode === 'batch'
                  ? 'Drop multiple files here'
                  : 'Drop a folder here'}
            </h3>
            <p className='text-gray-400 text-sm sm:text-base'>
              Drag-and-drop support enabled - Or click to browse and select files
            </p>
          </div>
        </div>
      </div>

      {/* Manual Selection Buttons */}
      <div className='flex flex-col sm:flex-row justify-center gap-3 sm:space-x-4 sm:gap-0'>
        <button
          onClick={() => fileInputRef.current?.click()}
          className='bg-white/10 hover:bg-white/20 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base touch-manipulation'
        >
          <span>📄</span>
          <span>Select Files</span>
        </button>

        {uploadMode === 'folder' && (
          <button
            onClick={() => folderInputRef.current?.click()}
            className='bg-white/10 hover:bg-white/20 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base touch-manipulation'
          >
            <span>📁</span>
            <span>Select Folder</span>
          </button>
        )}
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type='file'
        multiple={uploadMode !== 'single'}
        onChange={handleFileSelect}
        className='hidden'
        accept='.pdf,.docx,.doc,.xlsx,.xls,.html,.htm,.rtf,.txt,.csv,.json,.zip'
      />

      <input
        ref={folderInputRef}
        type='file'
        // ✅ FIXED Phase 4D True Fix - Replace @ts-ignore with proper interface extension
        {...({ webkitdirectory: 'true' } as React.InputHTMLAttributes<HTMLInputElement> & {
          webkitdirectory?: string;
        })}
        onChange={handleFolderSelect}
        className='hidden'
      />

      {/* Upload File List */}
      {uploadFiles.length > 0 && (
        <div className='bg-white/5 rounded-2xl p-4 sm:p-6 border border-white/10'>
          <h3 className='text-lg font-semibold text-white mb-4'>
            Files Ready for Upload ({uploadFiles.length})
          </h3>

          <div className='space-y-2 sm:space-y-3 max-h-32 sm:max-h-48 lg:max-h-64 overflow-y-auto custom-scrollbar'>
            {uploadFiles.map(uploadFile => {
              const typeInfo = getFileTypeInfo(uploadFile);
              const progress = uploadProgress[uploadFile.id];

              return (
                <div
                  key={uploadFile.id}
                  className='flex items-center justify-between p-2 sm:p-3 bg-white/5 rounded-xl border border-white/10'
                >
                  <div className='flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0'>
                    <span className='text-lg sm:text-2xl flex-shrink-0'>{typeInfo.icon}</span>
                    <div className='min-w-0 flex-1'>
                      <div className='text-white font-medium truncate text-sm sm:text-base'>
                        {uploadFile.file.name}
                      </div>
                      <div className='text-gray-400 text-xs sm:text-sm flex items-center space-x-1 sm:space-x-2'>
                        <span>{formatFileSize(uploadFile.file.size)}</span>
                        <span>•</span>
                        <span className='capitalize'>{uploadFile.type}</span>
                        <span className='hidden sm:inline'>•</span>
                        <span className='uppercase hidden sm:inline'>{uploadFile.subtype}</span>
                      </div>
                    </div>
                  </div>

                  {progress && (
                    <div className='flex items-center space-x-2 ml-2 sm:ml-4'>
                      {progress.status === 'uploading' && (
                        <div className='w-12 sm:w-20 bg-gray-700 rounded-full h-2'>
                          <div
                            className='bg-orange-500 h-2 rounded-full transition-all duration-300'
                            style={{ width: `${progress.progress}%` }}
                          />
                        </div>
                      )}

                      {progress.status === 'completed' && (
                        <span className='text-green-400'>✅</span>
                      )}

                      {progress.status === 'failed' && <span className='text-red-400'>❌</span>}
                    </div>
                  )}

                  {!progress && (
                    <button
                      onClick={() => removeFile(uploadFile.id)}
                      className='text-gray-400 hover:text-red-400 transition-colors ml-2 sm:ml-4 p-1'
                    >
                      <span className='text-base sm:text-lg'>🗑️</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upload Actions - Sticky Bottom */}
      <div className='sticky bottom-0 bg-gray-900/95 backdrop-blur-sm border-t border-white/10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 rounded-b-2xl'>
        <div className='flex flex-col sm:flex-row justify-end gap-3 sm:space-x-4 sm:gap-0'>
          <button
            onClick={onCancel}
            className='px-4 sm:px-6 py-2 sm:py-3 rounded-xl border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 transition-all duration-200 text-sm sm:text-base touch-manipulation'
          >
            Cancel
          </button>

          <button
            onClick={startUpload}
            disabled={uploadFiles.length === 0 || isUploading}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base touch-manipulation ${
              uploadFiles.length === 0 || isUploading
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700'
            }`}
          >
            {isUploading ? (
              <>
                <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <span>📤</span>
                <span className='hidden sm:inline'>
                  Upload {uploadFiles.length > 1 ? `${uploadFiles.length} files` : 'file'}
                </span>
                <span className='sm:hidden'>Upload</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
