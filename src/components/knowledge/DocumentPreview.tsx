'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface DocumentPreviewProps {
  itemId: string;
  onClose: () => void;
}

interface DocumentData {
  id: string;
  title: string;
  filename: string;
  type: string;
  subtype?: string;
  contentType?: string;
  size?: number;
  status: string;
  content?: string;
  metadata?: any;
  processingStats?: {
    startTime?: string;
    endTime?: string;
    processingDuration?: number;
    totalChunks?: number;
    successfulChunks?: number;
    failedChunks?: number;
    vectorizationTime?: number;
    indexingTime?: number;
  };
  chunks?: Array<{
    id: string;
    content: string;
    metadata: any;
    vector_status: string;
    similarity_score?: number;
    token_count?: number;
    created_at: string;
  }>;
  vectorStatus?: {
    indexed: boolean;
    vectorCount: number;
    lastIndexed?: string;
    embeddingModel?: string;
    dimensions?: number;
    collection?: string;
  };
}

export default function DocumentPreview({ itemId, onClose }: DocumentPreviewProps) {
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'stats' | 'chunks' | 'vectors'>('content');
  const [expandedChunk, setExpandedChunk] = useState<string | null>(null);

  useEffect(() => {
    fetchDocumentData();
  }, [itemId]);

  const fetchDocumentData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 DocumentPreview: Fetching preview for item', itemId);
      const response = await fetch(`/api/knowledge/${itemId}/preview`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ DocumentPreview: API Error', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        
        if (response.status === 404) {
          throw new Error('Document not found or you don\'t have permission to view it');
        } else if (response.status === 401) {
          throw new Error('Please login to view this document');
        } else {
          throw new Error(`Failed to fetch document data (${response.status})`);
        }
      }

      const data = await response.json();
      console.log('✅ DocumentPreview: Data loaded successfully', { 
        id: data.id, 
        title: data.title,
        type: data.type,
        status: data.status 
      });
      setDocumentData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ DocumentPreview: Error', errorMessage);
      setError(errorMessage);
      toast.error('Failed to load document preview');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return 'text-green-400 bg-green-400/20';
      case 'PROCESSING':
        return 'text-blue-400 bg-blue-400/20';
      case 'PENDING':
        return 'text-yellow-400 bg-yellow-400/20';
      case 'FAILED':
      case 'ERROR':
        return 'text-red-400 bg-red-400/20';
      default:
        return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return '✅';
      case 'PROCESSING':
        return '⏳';
      case 'PENDING':
        return '⏸️';
      case 'FAILED':
      case 'ERROR':
        return '❌';
      default:
        return '❓';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
  };

  const renderContentTab = () => (
    <div className='space-y-6'>
      {/* Document Info */}
      <div className='bg-white/5 rounded-xl p-6 border border-white/10'>
        <h3 className='text-lg font-semibold text-white mb-4'>Document Information</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='text-sm text-gray-400'>Title</label>
            <p className='text-white'>{documentData?.title || 'N/A'}</p>
          </div>
          <div>
            <label className='text-sm text-gray-400'>Filename</label>
            <p className='text-white'>{documentData?.filename || 'N/A'}</p>
          </div>
          <div>
            <label className='text-sm text-gray-400'>Type</label>
            <p className='text-white capitalize'>{documentData?.type || 'N/A'}</p>
          </div>
          <div>
            <label className='text-sm text-gray-400'>Content Type</label>
            <p className='text-white'>{documentData?.contentType || 'N/A'}</p>
          </div>
          <div>
            <label className='text-sm text-gray-400'>Size</label>
            <p className='text-white'>{formatFileSize(documentData?.size)}</p>
          </div>
          <div>
            <label className='text-sm text-gray-400'>Status</label>
            <span
              className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(documentData?.status || '')}`}
            >
              {getStatusIcon(documentData?.status || '')} {documentData?.status || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Content Preview */}
      <div className='bg-white/5 rounded-xl p-6 border border-white/10'>
        <h3 className='text-lg font-semibold text-white mb-4'>Content Preview</h3>
        <div className='bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto'>
          {documentData?.content ? (
            <pre className='text-gray-300 text-sm whitespace-pre-wrap leading-relaxed'>
              {documentData.content.substring(0, 5000)}
              {documentData.content.length > 5000 && (
                <span className='text-gray-500'>... [content truncated]</span>
              )}
            </pre>
          ) : (
            <p className='text-gray-500 italic'>No content preview available</p>
          )}
        </div>
      </div>

      {/* Metadata */}
      {documentData?.metadata && (
        <div className='bg-white/5 rounded-xl p-6 border border-white/10'>
          <h3 className='text-lg font-semibold text-white mb-4'>Metadata</h3>
          <div className='bg-gray-900 rounded-lg p-4 max-h-64 overflow-y-auto'>
            <pre className='text-gray-300 text-sm'>
              {JSON.stringify(documentData.metadata, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );

  const renderStatsTab = () => (
    <div className='space-y-6'>
      {/* Processing Statistics */}
      <div className='bg-white/5 rounded-xl p-6 border border-white/10'>
        <h3 className='text-lg font-semibold text-white mb-4'>Processing Statistics</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-orange-400 mb-2'>
              {formatDuration(documentData?.processingStats?.processingDuration)}
            </div>
            <div className='text-sm text-gray-400'>Processing Time</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-blue-400 mb-2'>
              {documentData?.processingStats?.totalChunks || 0}
            </div>
            <div className='text-sm text-gray-400'>Total Chunks</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-green-400 mb-2'>
              {documentData?.processingStats?.successfulChunks || 0}
            </div>
            <div className='text-sm text-gray-400'>Successful Chunks</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-red-400 mb-2'>
              {documentData?.processingStats?.failedChunks || 0}
            </div>
            <div className='text-sm text-gray-400'>Failed Chunks</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-purple-400 mb-2'>
              {formatDuration(documentData?.processingStats?.vectorizationTime)}
            </div>
            <div className='text-sm text-gray-400'>Vectorization Time</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-teal-400 mb-2'>
              {formatDuration(documentData?.processingStats?.indexingTime)}
            </div>
            <div className='text-sm text-gray-400'>Indexing Time</div>
          </div>
        </div>
      </div>

      {/* Processing Timeline */}
      <div className='bg-white/5 rounded-xl p-6 border border-white/10'>
        <h3 className='text-lg font-semibold text-white mb-4'>Processing Timeline</h3>
        <div className='space-y-4'>
          <div className='flex items-center space-x-4'>
            <div className='w-3 h-3 bg-blue-500 rounded-full'></div>
            <div>
              <div className='text-white font-medium'>Processing Started</div>
              <div className='text-sm text-gray-400'>
                {formatDate(documentData?.processingStats?.startTime)}
              </div>
            </div>
          </div>
          <div className='flex items-center space-x-4'>
            <div className='w-3 h-3 bg-green-500 rounded-full'></div>
            <div>
              <div className='text-white font-medium'>Processing Completed</div>
              <div className='text-sm text-gray-400'>
                {formatDate(documentData?.processingStats?.endTime)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderChunksTab = () => (
    <div className='space-y-6'>
      {/* Chunks Overview */}
      <div className='bg-white/5 rounded-xl p-6 border border-white/10'>
        <h3 className='text-lg font-semibold text-white mb-4'>Chunks Overview</h3>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-blue-400 mb-2'>
              {documentData?.chunks?.length || 0}
            </div>
            <div className='text-sm text-gray-400'>Total Chunks</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-green-400 mb-2'>
              {documentData?.chunks?.filter(chunk => chunk.vector_status === 'indexed')?.length ||
                0}
            </div>
            <div className='text-sm text-gray-400'>Indexed Chunks</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-orange-400 mb-2'>
              {documentData?.chunks?.reduce((sum, chunk) => sum + (chunk.token_count || 0), 0) || 0}
            </div>
            <div className='text-sm text-gray-400'>Total Tokens</div>
          </div>
        </div>
      </div>

      {/* Chunks List */}
      <div className='bg-white/5 rounded-xl p-6 border border-white/10'>
        <h3 className='text-lg font-semibold text-white mb-4'>Chunk Details</h3>
        <div className='space-y-3 max-h-96 overflow-y-auto'>
          {documentData?.chunks?.map((chunk, index) => (
            <div key={chunk.id} className='bg-white/5 rounded-lg p-4 border border-white/10'>
              <div className='flex items-center justify-between mb-2'>
                <div className='flex items-center space-x-3'>
                  <span className='text-sm text-gray-400'>Chunk {index + 1}</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      chunk.vector_status === 'indexed'
                        ? 'text-green-400 bg-green-400/20'
                        : 'text-yellow-400 bg-yellow-400/20'
                    }`}
                  >
                    {chunk.vector_status}
                  </span>
                  {chunk.token_count && (
                    <span className='text-xs text-gray-400'>{chunk.token_count} tokens</span>
                  )}
                </div>
                <button
                  onClick={() => setExpandedChunk(expandedChunk === chunk.id ? null : chunk.id)}
                  className='text-blue-400 hover:text-blue-300 transition-colors'
                >
                  {expandedChunk === chunk.id ? '▼' : '▶'}
                </button>
              </div>

              {expandedChunk === chunk.id && (
                <div className='mt-3 pt-3 border-t border-white/10'>
                  <div className='bg-gray-900 rounded p-3 mb-3'>
                    <pre className='text-gray-300 text-sm whitespace-pre-wrap'>
                      {chunk.content.substring(0, 500)}
                      {chunk.content.length > 500 && (
                        <span className='text-gray-500'>... [truncated]</span>
                      )}
                    </pre>
                  </div>
                  <div className='text-xs text-gray-400'>
                    Created: {formatDate(chunk.created_at)}
                  </div>
                </div>
              )}
            </div>
          )) || <p className='text-gray-500 italic'>No chunks available</p>}
        </div>
      </div>
    </div>
  );

  const renderVectorsTab = () => (
    <div className='space-y-6'>
      {/* Vector Status */}
      <div className='bg-white/5 rounded-xl p-6 border border-white/10'>
        <h3 className='text-lg font-semibold text-white mb-4'>Vector Status</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-green-400 mb-2'>
              {documentData?.vectorStatus?.indexed ? 'YES' : 'NO'}
            </div>
            <div className='text-sm text-gray-400'>Indexed</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-blue-400 mb-2'>
              {documentData?.vectorStatus?.vectorCount || 0}
            </div>
            <div className='text-sm text-gray-400'>Vector Count</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-purple-400 mb-2'>
              {documentData?.vectorStatus?.dimensions || 0}
            </div>
            <div className='text-sm text-gray-400'>Dimensions</div>
          </div>
        </div>
      </div>

      {/* Vector Details */}
      <div className='bg-white/5 rounded-xl p-6 border border-white/10'>
        <h3 className='text-lg font-semibold text-white mb-4'>Vector Details</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='text-sm text-gray-400'>Embedding Model</label>
            <p className='text-white'>{documentData?.vectorStatus?.embeddingModel || 'N/A'}</p>
          </div>
          <div>
            <label className='text-sm text-gray-400'>Collection</label>
            <p className='text-white'>{documentData?.vectorStatus?.collection || 'N/A'}</p>
          </div>
          <div>
            <label className='text-sm text-gray-400'>Last Indexed</label>
            <p className='text-white'>{formatDate(documentData?.vectorStatus?.lastIndexed)}</p>
          </div>
          <div>
            <label className='text-sm text-gray-400'>Vector Status</label>
            <span
              className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${
                documentData?.vectorStatus?.indexed
                  ? 'text-green-400 bg-green-400/20'
                  : 'text-yellow-400 bg-yellow-400/20'
              }`}
            >
              {documentData?.vectorStatus?.indexed ? '✅ Indexed' : '⏳ Pending'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50'>
        <div className='bg-gray-900 rounded-2xl p-8 max-w-md w-full mx-4'>
          <div className='flex items-center space-x-3'>
            <div className='animate-spin rounded-full h-6 w-6 border-2 border-orange-500 border-t-transparent'></div>
            <span className='text-white'>Loading document preview...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50'>
        <div className='bg-gray-900 rounded-2xl p-8 max-w-md w-full mx-4'>
          <div className='text-center'>
            <div className='text-red-400 text-4xl mb-4'>❌</div>
            <h3 className='text-xl font-semibold text-white mb-2'>Error Loading Preview</h3>
            <p className='text-gray-400 mb-6'>{error}</p>
            <div className='flex space-x-4'>
              <button
                onClick={fetchDocumentData}
                className='flex-1 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors'
              >
                Retry
              </button>
              <button
                onClick={onClose}
                className='flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
      <div className='bg-gray-900 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-white/10'>
          <div>
            <h2 className='text-2xl font-bold text-white'>
              {documentData?.title || 'Document Preview'}
            </h2>
            <p className='text-gray-400'>{documentData?.filename}</p>
          </div>
          <button onClick={onClose} className='text-gray-400 hover:text-white transition-colors'>
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className='flex border-b border-white/10'>
          {[
            { id: 'content', label: 'Content', icon: '📄' },
            { id: 'stats', label: 'Statistics', icon: '📊' },
            { id: 'chunks', label: 'Chunks', icon: '🧩' },
            { id: 'vectors', label: 'Vectors', icon: '🔍' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-orange-400 border-b-2 border-orange-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className='p-6 overflow-y-auto max-h-[calc(90vh-140px)]'>
          {activeTab === 'content' && renderContentTab()}
          {activeTab === 'stats' && renderStatsTab()}
          {activeTab === 'chunks' && renderChunksTab()}
          {activeTab === 'vectors' && renderVectorsTab()}
        </div>
      </div>
    </div>
  );
}
