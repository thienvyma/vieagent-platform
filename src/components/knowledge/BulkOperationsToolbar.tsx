'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';

interface BulkOperationsToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: () => Promise<void>;
  onBulkReprocess: () => Promise<void>;
  onBulkStatusUpdate: (status: string) => Promise<void>;
  isProcessing?: boolean;
}

export default function BulkOperationsToolbar({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  onBulkReprocess,
  onBulkStatusUpdate,
  isProcessing = false,
}: BulkOperationsToolbarProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReprocessConfirm, setShowReprocessConfirm] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [operationLoading, setOperationLoading] = useState(false);

  if (selectedCount === 0) return null;

  const handleBulkDelete = async () => {
    setOperationLoading(true);
    try {
      await onBulkDelete();
      setShowDeleteConfirm(false);
      toast.success('Bulk delete operation completed');
    } catch (error) {
      console.error('Bulk delete failed:', error);
      toast.error('Bulk delete operation failed - please try again');
    } finally {
      setOperationLoading(false);
    }
  };

  const handleBulkReprocess = async () => {
    setOperationLoading(true);
    try {
      await onBulkReprocess();
      setShowReprocessConfirm(false);
      toast.success('Bulk reprocess operation started');
    } catch (error) {
      console.error('Bulk reprocess failed:', error);
      toast.error('Bulk reprocess operation failed - please try again');
    } finally {
      setOperationLoading(false);
    }
  };

  const handleBulkStatusUpdate = async () => {
    setOperationLoading(true);
    try {
      await onBulkStatusUpdate(selectedStatus);
      setShowStatusConfirm(false);
      setShowStatusMenu(false);
      toast.success('Bulk status update completed');
    } catch (error) {
      console.error('Bulk status update failed:', error);
      toast.error('Bulk status update failed - please try again');
    } finally {
      setOperationLoading(false);
    }
  };

  const handleStatusSelect = (status: string) => {
    setSelectedStatus(status);
    setShowStatusMenu(false);
    setShowStatusConfirm(true);
  };

  const statusOptions = [
    { value: 'PENDING', label: 'Pending', icon: '⏸️' },
    { value: 'PROCESSING', label: 'Processing', icon: '⏳' },
    { value: 'COMPLETED', label: 'Completed', icon: '✅' },
    { value: 'FAILED', label: 'Failed', icon: '❌' },
  ];

  const getStatusLabel = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? `${option.icon} ${option.label}` : status;
  };

  return (
    <>
      <div className='bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 mb-6'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <span className='text-orange-300 font-medium'>{selectedCount} item(s) selected</span>
            <button
              onClick={onClearSelection}
              className='text-orange-400 hover:text-orange-300 text-sm underline transition-colors'
            >
              Clear Selection
            </button>
          </div>

          <div className='flex items-center space-x-2'>
            {/* Bulk Status Update */}
            <div className='relative'>
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                disabled={isProcessing}
                className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2'
              >
                <span>📊</span>
                <span>Update Status</span>
                <span className='text-xs'>▼</span>
              </button>

              {showStatusMenu && (
                <div className='absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10'>
                  <div className='p-2'>
                    <div className='text-xs text-gray-400 mb-2 px-2'>Select new status:</div>
                    {statusOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => handleStatusSelect(option.value)}
                        className='w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-700 rounded flex items-center space-x-2'
                      >
                        <span>{option.icon}</span>
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bulk Reprocess */}
            <button
              onClick={() => setShowReprocessConfirm(true)}
              disabled={isProcessing}
              className='bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2'
            >
              <span>🔄</span>
              <span>Reprocess</span>
              {isProcessing && (
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2'></div>
              )}
            </button>

            {/* Bulk Delete */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isProcessing}
              className='bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2'
            >
              <span>🗑️</span>
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Progress indicator */}
        {isProcessing && (
          <div className='mt-3 pt-3 border-t border-orange-500/20'>
            <div className='flex items-center space-x-2 text-orange-300'>
              <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-orange-300'></div>
              <span className='text-sm'>Processing bulk operation...</span>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title='Delete Selected Items'
        message={`Are you sure you want to permanently delete ${selectedCount} item(s)? This action cannot be undone.`}
        confirmText='Delete'
        cancelText='Cancel'
        type='danger'
        loading={operationLoading}
      />

      {/* Reprocess Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showReprocessConfirm}
        onClose={() => setShowReprocessConfirm(false)}
        onConfirm={handleBulkReprocess}
        title='Reprocess Selected Items'
        message={`Are you sure you want to reprocess ${selectedCount} item(s)? This will regenerate vectors and may take some time.`}
        confirmText='Reprocess'
        cancelText='Cancel'
        type='warning'
        loading={operationLoading}
      />

      {/* Status Update Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showStatusConfirm}
        onClose={() => setShowStatusConfirm(false)}
        onConfirm={handleBulkStatusUpdate}
        title='Update Status'
        message={`Are you sure you want to update the status of ${selectedCount} item(s) to "${getStatusLabel(selectedStatus)}"?`}
        confirmText='Update Status'
        cancelText='Cancel'
        type='info'
        loading={operationLoading}
      />

      {/* Click outside to close status menu */}
      {showStatusMenu && (
        <div className='fixed inset-0 z-5' onClick={() => setShowStatusMenu(false)} />
      )}
    </>
  );
}
