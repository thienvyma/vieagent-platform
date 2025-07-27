'use client';

import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';

interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  error?: string;
}

interface UploadZoneProps {
  onFileUpload: (files: File[]) => void;
  uploadProgress: UploadProgress[];
  acceptedTypes?: string[];
  maxSize?: number;
  maxFiles?: number;
  disabled?: boolean;
}

export default function UploadZone({
  onFileUpload,
  uploadProgress,
  acceptedTypes = ['.pdf', '.docx', '.txt', '.csv', '.json', '.md'],
  maxSize = 50 * 1024 * 1024, // 50MB
  maxFiles = 10,
  disabled = false,
}: UploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (disabled) return;

      // Handle rejected files
      rejectedFiles.forEach(file => {
        if (file.errors) {
          file.errors.forEach((error: any) => {
            if (error.code === 'file-too-large') {
              toast.error(`${file.file.name} is too large (max ${formatFileSize(maxSize)})`);
            } else if (error.code === 'file-invalid-type') {
              toast.error(`${file.file.name} has invalid file type`);
            } else if (error.code === 'too-many-files') {
              toast.error(`Too many files (max ${maxFiles})`);
            } else {
              toast.error(`${file.file.name}: ${error.message}`);
            }
          });
        }
      });

      // Handle accepted files
      if (acceptedFiles.length > 0) {
        setSelectedFiles(acceptedFiles);
        onFileUpload(acceptedFiles);
      }
    },
    [onFileUpload, disabled, maxSize, maxFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce(
      (acc, type) => {
        acc[getMimeType(type)] = [type];
        return acc;
      },
      {} as Record<string, string[]>
    ),
    maxSize,
    maxFiles,
    disabled,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
    onDropAccepted: () => setDragActive(false),
    onDropRejected: () => setDragActive(false),
  });

  const handleFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getMimeType = (extension: string) => {
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain',
      '.csv': 'text/csv',
      '.json': 'application/json',
      '.md': 'text/markdown',
    };
    return mimeTypes[extension] || 'application/octet-stream';
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.toLowerCase().split('.').pop();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'docx':
        return '📝';
      case 'txt':
        return '📄';
      case 'csv':
        return '📊';
      case 'json':
        return '🔧';
      case 'md':
        return '📝';
      default:
        return '📄';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
        return '⏳';
      case 'processing':
        return '🔄';
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      default:
        return '📄';
    }
  };

  const hasActiveUploads = uploadProgress.some(
    up => up.status === 'uploading' || up.status === 'processing'
  );

  return (
    <div className='w-full'>
      {/* Main Upload Zone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer
          ${
            dragActive || isDragActive
              ? 'border-orange-500 bg-orange-500/10'
              : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />

        {/* Upload Icon */}
        <div className='mb-4'>
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-full transition-colors ${
              dragActive || isDragActive ? 'bg-orange-500/20' : 'bg-gray-700'
            }`}
          >
            <svg
              className='w-8 h-8 text-gray-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
              />
            </svg>
          </div>
        </div>

        {/* Upload Text */}
        <div className='mb-4'>
          <p className='text-lg font-semibold text-white mb-2'>
            {dragActive || isDragActive ? 'Drop files here' : 'Upload Knowledge Documents'}
          </p>
          <p className='text-gray-400 mb-4'>Drag and drop your files here, or click to browse</p>

          {/* File Type Info */}
          <div className='flex flex-wrap justify-center gap-2 mb-4'>
            {acceptedTypes.map((type, index) => (
              <span key={index} className='px-2 py-1 bg-gray-700 text-gray-300 text-sm rounded'>
                {type}
              </span>
            ))}
          </div>

          {/* Upload Limits */}
          <div className='text-sm text-gray-500'>
            Max file size: {formatFileSize(maxSize)} • Max files: {maxFiles}
          </div>
        </div>

        {/* Upload Button */}
        <button
          onClick={handleFileInput}
          disabled={disabled || hasActiveUploads}
          className={`
            px-6 py-3 rounded-lg font-medium transition-colors
            ${
              disabled || hasActiveUploads
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-orange-500 hover:bg-orange-600 text-white'
            }
          `}
        >
          {hasActiveUploads ? 'Uploading...' : 'Choose Files'}
        </button>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type='file'
          multiple
          accept={acceptedTypes.join(',')}
          onChange={e => {
            if (e.target.files) {
              const files = Array.from(e.target.files);
              onFileUpload(files);
            }
          }}
          className='hidden'
        />
      </div>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className='mt-6 space-y-3'>
          <h3 className='text-lg font-semibold text-white'>Upload Progress</h3>
          {uploadProgress.map(progress => (
            <div key={progress.fileId} className='bg-gray-800 rounded-lg p-4'>
              <div className='flex items-center justify-between mb-2'>
                <div className='flex items-center space-x-3'>
                  <span className='text-xl'>{getFileIcon(progress.fileName)}</span>
                  <span className='text-white font-medium'>{progress.fileName}</span>
                  <span className='text-xl'>{getStatusIcon(progress.status)}</span>
                </div>
                <span className='text-sm text-gray-400 capitalize'>{progress.status}</span>
              </div>

              {/* Progress Bar */}
              <div className='w-full bg-gray-700 rounded-full h-2 mb-2'>
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    progress.status === 'completed'
                      ? 'bg-green-500'
                      : progress.status === 'failed'
                        ? 'bg-red-500'
                        : 'bg-orange-500'
                  }`}
                  style={{ width: `${progress.progress}%` }}
                />
              </div>

              {/* Progress Text */}
              <div className='flex justify-between text-sm'>
                <span className='text-gray-400'>
                  {progress.status === 'uploading'
                    ? `${progress.progress}% uploaded`
                    : progress.status === 'processing'
                      ? 'Processing...'
                      : progress.status === 'completed'
                        ? 'Completed'
                        : progress.status === 'failed'
                          ? 'Failed'
                          : 'Unknown'}
                </span>
                {progress.error && <span className='text-red-400'>{progress.error}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Batch Upload Summary */}
      {uploadProgress.length > 1 && (
        <div className='mt-4 bg-gray-800 rounded-lg p-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <span className='text-white font-medium'>Batch Upload Progress</span>
              <span className='text-sm text-gray-400'>
                {uploadProgress.filter(up => up.status === 'completed').length} of{' '}
                {uploadProgress.length} completed
              </span>
            </div>
            <div className='text-sm text-gray-400'>
              {uploadProgress.filter(up => up.status === 'failed').length > 0 && (
                <span className='text-red-400'>
                  {uploadProgress.filter(up => up.status === 'failed').length} failed
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
