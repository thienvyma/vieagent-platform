'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

interface KnowledgeItem {
  id: string;
  title: string;
  filename: string;
  type: string;
  subtype?: string;
  status: string;
  progressPercent?: number;
  totalRecords?: number;
  processedRecords?: number;
  successRecords?: number;
  errorRecords?: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
  completedAt?: string;
}

interface KnowledgeStatusTrackerProps {
  items: KnowledgeItem[];
  onStatusUpdate: () => void;
}

interface ProcessingStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  totalProgress: number;
}

export default function KnowledgeStatusTracker({
  items,
  onStatusUpdate,
}: KnowledgeStatusTrackerProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [retryingItems, setRetryingItems] = useState<Set<string>>(new Set());

  // Calculate processing stats
  const calculateStats = useCallback((): ProcessingStats => {
    const stats = items.reduce(
      (acc, item) => {
        acc.total++;
        switch (item.status.toUpperCase()) {
          case 'PENDING':
            acc.pending++;
            break;
          case 'PROCESSING':
            acc.processing++;
            break;
          case 'COMPLETED':
            acc.completed++;
            break;
          case 'FAILED':
          case 'ERROR':
            acc.failed++;
            break;
        }

        // Add to total progress
        if (item.progressPercent !== undefined) {
          acc.totalProgress += item.progressPercent;
        } else if (item.status.toUpperCase() === 'COMPLETED') {
          acc.totalProgress += 100;
        }

        return acc;
      },
      { total: 0, pending: 0, processing: 0, completed: 0, failed: 0, totalProgress: 0 }
    );

    return stats;
  }, [items]);

  const stats = calculateStats();

  // Get active processing items
  const activeItems = items.filter(
    item => item.status.toUpperCase() === 'PROCESSING' || item.status.toUpperCase() === 'PENDING'
  );

  // Get failed items
  const failedItems = items.filter(
    item => item.status.toUpperCase() === 'FAILED' || item.status.toUpperCase() === 'ERROR'
  );

  // ✅ FIXED Phase 4D True Fix - Fix useEffect return value
  // Auto-refresh when there are active items
  useEffect(() => {
    if (activeItems.length > 0) {
      setIsTracking(true);
      // Temporarily disable auto-refresh to debug reload issue
      // const interval = setInterval(() => {
      //   onStatusUpdate();
      //   setLastUpdate(new Date());
      // }, 10000); // Update every 10 seconds instead of 3

      // return () => clearInterval(interval);
    } else {
      setIsTracking(false);
    }

    // Return undefined for other cases
    return undefined;
  }, [activeItems.length, onStatusUpdate]);

  // Handle retry
  const handleRetry = async (itemId: string) => {
    setRetryingItems(prev => new Set(prev).add(itemId));

    try {
      const response = await fetch(`/api/knowledge/${itemId}/reprocess`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Retry started successfully');
        onStatusUpdate();
      } else {
        toast.error('Failed to retry processing');
      }
    } catch (error) {
      toast.error('Error retrying processing');
    } finally {
      setRetryingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);

    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return 'text-green-400';
      case 'PROCESSING':
        return 'text-blue-400';
      case 'PENDING':
        return 'text-yellow-400';
      case 'FAILED':
      case 'ERROR':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  // Get status icon
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

  if (stats.total === 0) {
    return null;
  }

  return (
    <div className='space-y-6'>
      {/* Overall Progress */}
      <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10'>
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4 sm:gap-0'>
          <h3 className='text-lg font-semibold text-white'>Processing Status</h3>
          <div className='flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4'>
            {isTracking && (
              <div className='flex items-center space-x-2 text-green-400'>
                <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse'></div>
                <span className='text-sm'>Live tracking</span>
              </div>
            )}
            {lastUpdate && (
              <span className='text-gray-400 text-sm'>Updated {formatTimeAgo(lastUpdate)}</span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className='mb-4'>
          <div className='flex justify-between text-sm text-gray-400 mb-2'>
            <span>Overall Progress</span>
            <span>{Math.round(stats.totalProgress / Math.max(stats.total, 1))}%</span>
          </div>
          <div className='w-full bg-gray-700 rounded-full h-3'>
            <div
              className='bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all duration-500'
              style={{ width: `${stats.totalProgress / Math.max(stats.total, 1)}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-white'>{stats.total}</div>
            <div className='text-gray-400 text-sm'>Total</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-green-400'>{stats.completed}</div>
            <div className='text-gray-400 text-sm'>Completed</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-blue-400'>{stats.processing}</div>
            <div className='text-gray-400 text-sm'>Processing</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-yellow-400'>{stats.pending}</div>
            <div className='text-gray-400 text-sm'>Pending</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-red-400'>{stats.failed}</div>
            <div className='text-gray-400 text-sm'>Failed</div>
          </div>
        </div>
      </div>

      {/* Active Processing Items */}
      {activeItems.length > 0 && (
        <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10'>
          <h3 className='text-lg font-semibold text-white mb-4 flex items-center space-x-2'>
            <span>⏳</span>
            <span>Currently Processing ({activeItems.length})</span>
          </h3>

          <div className='space-y-3'>
            {activeItems.map(item => (
              <div key={item.id} className='bg-white/5 rounded-xl p-4 border border-white/10'>
                <div className='flex items-center justify-between mb-2'>
                  <div className='flex items-center space-x-3'>
                    <span className={`text-lg ${getStatusColor(item.status)}`}>
                      {getStatusIcon(item.status)}
                    </span>
                    <div>
                      <div className='text-white font-medium'>{item.title}</div>
                      <div className='text-gray-400 text-sm'>{item.filename}</div>
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className={`text-sm font-medium ${getStatusColor(item.status)}`}>
                      {item.status}
                    </div>
                    <div className='text-gray-400 text-xs'>
                      {item.type} • {item.subtype}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                {item.progressPercent !== undefined && (
                  <div className='mb-2'>
                    <div className='flex justify-between text-xs text-gray-400 mb-1'>
                      <span>Progress</span>
                      <span>{item.progressPercent}%</span>
                    </div>
                    <div className='w-full bg-gray-700 rounded-full h-2'>
                      <div
                        className='bg-blue-500 h-2 rounded-full transition-all duration-300'
                        style={{ width: `${item.progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Processing Stats */}
                {item.totalRecords !== undefined && (
                  <div className='flex justify-between text-xs text-gray-400'>
                    <span>
                      Processed: {item.processedRecords || 0} / {item.totalRecords}
                    </span>
                    <span>
                      Success: {item.successRecords || 0} | Errors: {item.errorRecords || 0}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Failed Items */}
      {failedItems.length > 0 && (
        <div className='bg-red-500/10 backdrop-blur-sm rounded-2xl p-6 border border-red-500/20'>
          <h3 className='text-lg font-semibold text-red-400 mb-4 flex items-center space-x-2'>
            <span>❌</span>
            <span>Failed Items ({failedItems.length})</span>
          </h3>

          <div className='space-y-3'>
            {failedItems.map(item => (
              <div key={item.id} className='bg-red-500/10 rounded-xl p-4 border border-red-500/20'>
                <div className='flex items-center justify-between mb-2'>
                  <div className='flex items-center space-x-3'>
                    <span className='text-lg text-red-400'>❌</span>
                    <div>
                      <div className='text-white font-medium'>{item.title}</div>
                      <div className='text-gray-400 text-sm'>{item.filename}</div>
                    </div>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <button
                      onClick={() => handleRetry(item.id)}
                      disabled={retryingItems.has(item.id)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                        retryingItems.has(item.id)
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                      }`}
                    >
                      {retryingItems.has(item.id) ? (
                        <div className='flex items-center space-x-1'>
                          <div className='w-3 h-3 border border-gray-400 border-t-yellow-400 rounded-full animate-spin'></div>
                          <span>Retrying...</span>
                        </div>
                      ) : (
                        <div className='flex items-center space-x-1'>
                          <span>🔄</span>
                          <span>Retry</span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {item.errorMessage && (
                  <div className='bg-red-500/10 rounded-lg p-3 border border-red-500/20'>
                    <div className='text-red-400 text-sm font-medium mb-1'>Error Details:</div>
                    <div className='text-red-300 text-sm'>{item.errorMessage}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success Summary */}
      {stats.completed > 0 && stats.processing === 0 && stats.pending === 0 && (
        <div className='bg-green-500/10 backdrop-blur-sm rounded-2xl p-6 border border-green-500/20'>
          <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0'>
            <div className='flex items-center space-x-3'>
              <div className='w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center'>
                <span className='text-2xl'>🎉</span>
              </div>
              <div>
                <h3 className='text-lg font-semibold text-green-400'>Processing Complete!</h3>
                <p className='text-green-300 text-sm'>
                  {stats.completed} item(s) processed successfully
                  {stats.failed > 0 && ` • ${stats.failed} failed`}
                </p>
              </div>
            </div>
            <button
              onClick={onStatusUpdate}
              className='bg-green-500/20 text-green-400 px-4 py-2 rounded-xl hover:bg-green-500/30 transition-all duration-200 w-full sm:w-auto'
            >
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
