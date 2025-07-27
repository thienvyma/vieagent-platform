'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import DocumentPreview from './DocumentPreview';
import BulkOperationsToolbar from './BulkOperationsToolbar';

interface KnowledgeItem {
  id: string;
  title: string;
  description?: string;
  filename: string;
  type: string;
  subtype?: string;
  status: string;
  size?: number;
  mimeType?: string;
  viewCount: number;
  downloadCount: number;
  shareCount: number;
  isPublic: boolean;
  isArchived: boolean;
  tags: string[];
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

interface KnowledgeGridProps {
  items: KnowledgeItem[];
  loading?: boolean;
  selectedItems?: string[];
  onSelectedItemsChange?: (items: string[]) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
  sortBy?: 'name' | 'date' | 'size' | 'status';
  onSortByChange?: (sortBy: 'name' | 'date' | 'size' | 'status') => void;
  sortOrder?: 'asc' | 'desc';
  onSortOrderChange?: (order: 'asc' | 'desc') => void;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  onPreview?: (id: string) => void;
  onAssign?: (id: string) => void;
  onBulkDelete?: () => void;
  onBulkReprocess?: () => void;
  onBulkStatusUpdate?: (status: string) => void;
  onProcessItem?: (itemId: string) => void;
  onRefresh?: () => void;
}

export default function KnowledgeGrid({
  items,
  loading = false,
  selectedItems = [],
  onSelectedItemsChange,
  searchQuery = '',
  onSearchChange,
  statusFilter = 'all',
  onStatusFilterChange,
  sortBy = 'date',
  onSortByChange,
  sortOrder = 'desc',
  onSortOrderChange,
  viewMode = 'grid',
  onViewModeChange,
  onPreview,
  onAssign,
  onBulkDelete,
  onBulkReprocess,
  onBulkStatusUpdate,
  onProcessItem,
  onRefresh,
}: KnowledgeGridProps) {

  const [localSelectedItems, setLocalSelectedItems] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [showDocumentPreview, setShowDocumentPreview] = useState<boolean>(false);
  const [bulkOperationLoading, setBulkOperationLoading] = useState(false);

  // Use local state if no external state provided
  const currentSelectedItems = selectedItems.length > 0 ? selectedItems : localSelectedItems;
  const setCurrentSelectedItems = onSelectedItemsChange || setLocalSelectedItems;

  // Get status color and icon
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

  // Check if item is vectorized
  const isVectorized = (item: KnowledgeItem) => {
    try {
      if (typeof item.metadata === 'string') {
        const metadata = JSON.parse(item.metadata);
        return metadata.vectorized === true;
      }
      return item.metadata?.vectorized === true;
    } catch {
      return false;
    }
  };

  // Check if item can be processed
  const canProcess = (item: KnowledgeItem) => {
    const status = item.status.toUpperCase();
    return status === 'UPLOADED' || status === 'PENDING' || status === 'FAILED';
  };

  // Handle item selection
  const toggleSelection = (itemId: string) => {
    const newSelection = currentSelectedItems.includes(itemId)
      ? currentSelectedItems.filter(id => id !== itemId)
      : [...currentSelectedItems, itemId];
    setCurrentSelectedItems(newSelection);
  };

  const handleSelectAll = () => {
    setCurrentSelectedItems(items.map(item => item.id));
  };

  const handleDeselectAll = () => {
    setCurrentSelectedItems([]);
  };

  const areAllSelected = items.length > 0 && currentSelectedItems.length === items.length;

  // Enhanced bulk operation handlers with proper error handling and recovery
  const handleBulkDeleteWithConfirmation = async () => {
    if (!onBulkDelete) return;
    setBulkOperationLoading(true);
    try {
      await onBulkDelete();
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Failed to delete items - please retry or refresh the page');
    } finally {
      setBulkOperationLoading(false);
    }
  };

  const handleBulkReprocessWithConfirmation = async () => {
    if (!onBulkReprocess) return;
    setBulkOperationLoading(true);
    try {
      await onBulkReprocess();
    } catch (error) {
      console.error('Bulk reprocess error:', error);
      toast.error('Failed to reprocess items - please retry or refresh the page');
    } finally {
      setBulkOperationLoading(false);
    }
  };

  const handleBulkStatusUpdateWithConfirmation = async (status: string) => {
    if (!onBulkStatusUpdate) return;
    setBulkOperationLoading(true);
    try {
      await onBulkStatusUpdate(status);
    } catch (error) {
      console.error('Bulk status update error:', error);
      toast.error('Failed to update status - please retry or refresh the page');
    } finally {
      setBulkOperationLoading(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className='text-center py-16'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4'></div>
        <p className='text-gray-400'>Loading knowledge items...</p>
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className='text-center py-16'>
        <div className='text-6xl mb-4'>📚</div>
        <h3 className='text-xl font-semibold text-white mb-2'>Không có Knowledge Items</h3>
        <p className='text-gray-400 mb-6'>
          {searchQuery
            ? 'Không tìm thấy items phù hợp với tìm kiếm của bạn'
            : 'Hãy upload document đầu tiên để bắt đầu'}
        </p>
        {searchQuery && (
          <button
            onClick={() => onSearchChange?.('')}
            className='bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors'
          >
            Xóa tìm kiếm
          </button>
        )}
        {!searchQuery && process.env.NODE_ENV === 'development' && (
          <div className='mt-4 space-x-2'>
            <button
              onClick={() => onRefresh?.()}
              className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors'
            >
              Refresh Data
            </button>
          </div>
        )}

        {/* Document Preview Modal */}
        {showDocumentPreview && (
          <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
            <div className='bg-gray-800 p-6 rounded-xl max-w-4xl max-h-[80vh] overflow-auto'>
              <div className='flex justify-between items-center mb-4'>
                <h3 className='text-xl font-semibold text-white'>Document Preview</h3>
                <button
                  onClick={() => setShowDocumentPreview(false)}
                  className='text-gray-400 hover:text-white'
                >
                  ✕
                </button>
              </div>
              <div className='text-gray-300'>
                <p>DocumentPreview component placeholder - Full preview functionality</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className='bg-gray-900 text-white'>
      {/* Header with Search and Filters */}
      <div className='bg-gray-800 p-6 rounded-xl mb-6'>
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
          {/* Search Bar */}
          <div className='flex-1 max-w-md'>
            <div className='relative'>
              <svg
                className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                />
              </svg>
              <input
                type='text'
                placeholder='Search knowledge items...'
                value={searchQuery}
                onChange={e => onSearchChange?.(e.target.value)}
                className='w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500'
              />
            </div>
          </div>

          {/* Filters */}
          <div className='flex items-center space-x-4'>
            <select
              value={statusFilter}
              onChange={e => onStatusFilterChange?.(e.target.value)}
              className='bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500'
            >
              <option value='all'>All Status</option>
              <option value='COMPLETED'>Completed</option>
              <option value='PROCESSING'>Processing</option>
              <option value='PENDING'>Pending</option>
              <option value='FAILED'>Failed</option>
            </select>

            <button
              onClick={onRefresh}
              className='bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg px-3 py-2 text-white transition-colors'
              title='Refresh'
            >
              🔄
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Operations Toolbar - includes bulk toolbar, confirmation dialogs, and progress indicators */}
      <BulkOperationsToolbar
        selectedCount={currentSelectedItems.length}
        onClearSelection={handleDeselectAll}
        onBulkDelete={handleBulkDeleteWithConfirmation}
        onBulkReprocess={handleBulkReprocessWithConfirmation}
        onBulkStatusUpdate={handleBulkStatusUpdateWithConfirmation}
        isProcessing={bulkOperationLoading}
      />

      {/* Master Selection */}
      {items.length > 0 && (
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center space-x-4'>
            <label className='flex items-center space-x-2 cursor-pointer'>
              <input
                type='checkbox'
                checked={areAllSelected}
                onChange={areAllSelected ? handleDeselectAll : handleSelectAll}
                className='w-4 h-4 text-orange-600 bg-gray-700 border-gray-600 rounded focus:ring-orange-500'
              />
              <span className='text-white'>{areAllSelected ? 'Deselect All' : 'Select All'}</span>
            </label>
            <span className='text-gray-400'>{items.length} item(s) total</span>
          </div>
        </div>
      )}

      {/* Items Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
        {items.map(item => (
          <div
            key={item.id}
            className={`bg-gray-800 rounded-xl p-6 border-2 transition-all duration-200 hover:bg-gray-750 ${
              currentSelectedItems.includes(item.id)
                ? 'ring-2 ring-orange-500 border-orange-500'
                : 'border-gray-700'
            }`}
          >
            {/* Header */}
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center space-x-3'>
                <input
                  type='checkbox'
                  checked={currentSelectedItems.includes(item.id)}
                  onChange={() => toggleSelection(item.id)}
                  className='w-4 h-4 text-orange-600 bg-gray-700 border-gray-600 rounded focus:ring-orange-500'
                />
                <span className='text-2xl'>📄</span>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}
              >
                {getStatusIcon(item.status)} {item.status}
              </span>
            </div>

            {/* Content */}
            <div className='mb-4'>
              <h3 className='text-white font-semibold text-lg mb-2 line-clamp-2'>{item.title}</h3>
              {item.description && (
                <p className='text-gray-400 text-sm line-clamp-3'>{item.description}</p>
              )}
            </div>

            {/* Metadata */}
            <div className='space-y-2 mb-4'>
              <div className='flex items-center justify-between text-sm'>
                <span className='text-gray-400'>Size</span>
                <span className='text-gray-300'>{formatFileSize(item.size)}</span>
              </div>
              <div className='flex items-center justify-between text-sm'>
                <span className='text-gray-400'>Modified</span>
                <span className='text-gray-300'>{formatDate(item.updatedAt)}</span>
              </div>
            </div>

            {/* Vectorization Status */}
            <div className='mb-3'>
              <div className='flex items-center justify-between'>
                <span className='text-xs text-gray-400'>Vector Status</span>
                <div
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isVectorized(item)
                      ? 'text-green-400 bg-green-400/20'
                      : 'text-yellow-400 bg-yellow-400/20'
                  }`}
                >
                  {isVectorized(item) ? '🧠 Vectorized' : '⏸️ Not Processed'}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <button
                  onClick={() => (onPreview ? onPreview(item.id) : setShowPreview(item.id))}
                  className='text-blue-400 hover:text-blue-300 transition-colors text-sm'
                  title='Preview'
                >
                  👁️
                </button>
                {!isVectorized(item) && canProcess(item) && onProcessItem && (
                  <button
                    onClick={() => onProcessItem(item.id)}
                    className='text-purple-400 hover:text-purple-300 transition-colors text-sm'
                    title='Process & Vectorize'
                  >
                    🧠
                  </button>
                )}
                <button
                  onClick={() => onAssign?.(item.id)}
                  className='text-green-400 hover:text-green-300 transition-colors text-sm'
                  title='Assign to Agent'
                >
                  AI
                </button>
              </div>
              <div className='text-xs text-gray-500'>{item.viewCount || 0} views</div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {showPreview && <DocumentPreview itemId={showPreview} onClose={() => setShowPreview(null)} />}
    </div>
  );
}
