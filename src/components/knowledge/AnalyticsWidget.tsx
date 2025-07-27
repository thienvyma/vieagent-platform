'use client';

import { useState, useEffect } from 'react';

interface AnalyticsData {
  totalItems: number;
  processedItems: number;
  vectorizedItems: number;
  failedItems: number;
  totalViews: number;
  totalDownloads: number;
  avgProcessingTime: number;
  usageStats: {
    daily: Array<{ date: string; views: number; uploads: number }>;
    weekly: Array<{ week: string; views: number; uploads: number }>;
    monthly: Array<{ month: string; views: number; uploads: number }>;
  };
  statusDistribution: {
    completed: number;
    processing: number;
    pending: number;
    failed: number;
  };
  topItems: Array<{
    id: string;
    title: string;
    views: number;
    downloads: number;
    lastAccessed: string;
  }>;
  performanceMetrics: {
    avgUploadTime: number;
    avgProcessingTime: number;
    avgVectorizationTime: number;
    successRate: number;
  };
}

interface AnalyticsWidgetProps {
  knowledgeItemId?: string;
  timeRange?: '7d' | '30d' | '90d' | '1y';
  onRefresh?: () => void;
}

export default function AnalyticsWidget({
  knowledgeItemId,
  timeRange = '30d',
  onRefresh,
}: AnalyticsWidgetProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'usage' | 'performance'>('overview');

  useEffect(() => {
    fetchAnalyticsData();
  }, [knowledgeItemId, timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const url = knowledgeItemId
        ? `/api/knowledge/${knowledgeItemId}/analytics?timeRange=${timeRange}`
        : `/api/knowledge/analytics?timeRange=${timeRange}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const data = await response.json();
      setAnalyticsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchAnalyticsData();
    onRefresh?.();
  };

  if (loading) {
    return (
      <div className='bg-gray-800 rounded-xl p-6 border border-gray-700'>
        <div className='flex items-center justify-center h-64'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500'></div>
          <span className='ml-3 text-gray-400'>Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='bg-gray-800 rounded-xl p-6 border border-gray-700'>
        <div className='text-center'>
          <div className='text-red-400 text-4xl mb-4'>📊</div>
          <h3 className='text-xl font-semibold text-white mb-2'>Analytics Error</h3>
          <p className='text-gray-400 mb-4'>{error}</p>
          <button
            onClick={handleRefresh}
            className='bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors'
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className='bg-gray-800 rounded-xl p-6 border border-gray-700'>
        <div className='text-center'>
          <div className='text-gray-400 text-4xl mb-4'>📊</div>
          <h3 className='text-xl font-semibold text-white mb-2'>No Analytics Data</h3>
          <p className='text-gray-400'>No analytics data available for the selected time range.</p>
        </div>
      </div>
    );
  }

  const usageChartData = {
    labels: analyticsData.usageStats.daily.map(d => d.date),
    datasets: [
      {
        label: 'Views',
        data: analyticsData.usageStats.daily.map(d => d.views),
        borderColor: 'rgb(249, 115, 22)',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        tension: 0.1,
      },
      {
        label: 'Uploads',
        data: analyticsData.usageStats.daily.map(d => d.uploads),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
      },
    ],
  };

  const statusChartData = {
    labels: ['Completed', 'Processing', 'Pending', 'Failed'],
    datasets: [
      {
        data: [
          analyticsData.statusDistribution.completed,
          analyticsData.statusDistribution.processing,
          analyticsData.statusDistribution.pending,
          analyticsData.statusDistribution.failed,
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(251, 191, 36)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const renderOverviewTab = () => (
    <div className='space-y-6'>
      {/* Key Metrics */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <div className='bg-gray-900 rounded-lg p-4'>
          <div className='text-2xl font-bold text-white'>
            {formatNumber(analyticsData.totalItems)}
          </div>
          <div className='text-sm text-gray-400'>Total Items</div>
        </div>
        <div className='bg-gray-900 rounded-lg p-4'>
          <div className='text-2xl font-bold text-green-400'>
            {formatNumber(analyticsData.processedItems)}
          </div>
          <div className='text-sm text-gray-400'>Processed</div>
        </div>
        <div className='bg-gray-900 rounded-lg p-4'>
          <div className='text-2xl font-bold text-blue-400'>
            {formatNumber(analyticsData.vectorizedItems)}
          </div>
          <div className='text-sm text-gray-400'>Vectorized</div>
        </div>
        <div className='bg-gray-900 rounded-lg p-4'>
          <div className='text-2xl font-bold text-orange-400'>
            {formatNumber(analyticsData.totalViews)}
          </div>
          <div className='text-sm text-gray-400'>Total Views</div>
        </div>
      </div>

      {/* Status Distribution */}
      <div className='bg-gray-900 rounded-lg p-6'>
        <h3 className='text-lg font-semibold text-white mb-4'>Status Distribution</h3>
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <div className='w-4 h-4 bg-green-500 rounded-full'></div>
              <span className='text-white'>Completed</span>
            </div>
            <span className='text-green-400 font-medium'>
              {analyticsData.statusDistribution.completed}
            </span>
          </div>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <div className='w-4 h-4 bg-blue-500 rounded-full'></div>
              <span className='text-white'>Processing</span>
            </div>
            <span className='text-blue-400 font-medium'>
              {analyticsData.statusDistribution.processing}
            </span>
          </div>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <div className='w-4 h-4 bg-yellow-500 rounded-full'></div>
              <span className='text-white'>Pending</span>
            </div>
            <span className='text-yellow-400 font-medium'>
              {analyticsData.statusDistribution.pending}
            </span>
          </div>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <div className='w-4 h-4 bg-red-500 rounded-full'></div>
              <span className='text-white'>Failed</span>
            </div>
            <span className='text-red-400 font-medium'>
              {analyticsData.statusDistribution.failed}
            </span>
          </div>
        </div>
      </div>

      {/* Top Items */}
      <div className='bg-gray-900 rounded-lg p-6'>
        <h3 className='text-lg font-semibold text-white mb-4'>Top Performing Items</h3>
        <div className='space-y-3'>
          {analyticsData.topItems.map((item, index) => (
            <div
              key={item.id}
              className='flex items-center justify-between p-3 bg-gray-800 rounded-lg'
            >
              <div className='flex items-center space-x-3'>
                <div className='text-orange-400 font-bold'>#{index + 1}</div>
                <div>
                  <div className='text-white font-medium'>{item.title}</div>
                  <div className='text-sm text-gray-400'>
                    Last accessed: {new Date(item.lastAccessed).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className='text-right'>
                <div className='text-white font-medium'>{formatNumber(item.views)} views</div>
                <div className='text-sm text-gray-400'>
                  {formatNumber(item.downloads)} downloads
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderUsageTab = () => (
    <div className='space-y-6'>
      {/* Usage Trends */}
      <div className='bg-gray-900 rounded-lg p-6'>
        <h3 className='text-lg font-semibold text-white mb-4'>Usage Trends</h3>
        <div className='space-y-4'>
          <div className='grid grid-cols-7 gap-2'>
            {analyticsData.usageStats.daily.slice(-7).map((day, index) => (
              <div key={index} className='text-center'>
                <div className='text-xs text-gray-400 mb-1'>
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className='bg-gray-800 rounded-lg p-2'>
                  <div className='text-orange-400 font-medium'>{day.views}</div>
                  <div className='text-xs text-gray-400'>views</div>
                </div>
                <div className='bg-gray-800 rounded-lg p-2 mt-1'>
                  <div className='text-blue-400 font-medium'>{day.uploads}</div>
                  <div className='text-xs text-gray-400'>uploads</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Usage Stats */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <div className='bg-gray-900 rounded-lg p-4'>
          <div className='text-2xl font-bold text-orange-400'>
            {formatNumber(analyticsData.totalViews)}
          </div>
          <div className='text-sm text-gray-400'>Total Views</div>
        </div>
        <div className='bg-gray-900 rounded-lg p-4'>
          <div className='text-2xl font-bold text-blue-400'>
            {formatNumber(analyticsData.totalDownloads)}
          </div>
          <div className='text-sm text-gray-400'>Total Downloads</div>
        </div>
        <div className='bg-gray-900 rounded-lg p-4'>
          <div className='text-2xl font-bold text-green-400'>
            {analyticsData.totalViews > 0
              ? ((analyticsData.totalDownloads / analyticsData.totalViews) * 100).toFixed(1)
              : 0}
            %
          </div>
          <div className='text-sm text-gray-400'>Download Rate</div>
        </div>
      </div>
    </div>
  );

  const renderPerformanceTab = () => (
    <div className='space-y-6'>
      {/* Performance Metrics */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <div className='bg-gray-900 rounded-lg p-4'>
          <div className='text-2xl font-bold text-white'>
            {formatDuration(analyticsData.performanceMetrics.avgUploadTime)}
          </div>
          <div className='text-sm text-gray-400'>Avg Upload Time</div>
        </div>
        <div className='bg-gray-900 rounded-lg p-4'>
          <div className='text-2xl font-bold text-blue-400'>
            {formatDuration(analyticsData.performanceMetrics.avgProcessingTime)}
          </div>
          <div className='text-sm text-gray-400'>Avg Processing Time</div>
        </div>
        <div className='bg-gray-900 rounded-lg p-4'>
          <div className='text-2xl font-bold text-purple-400'>
            {formatDuration(analyticsData.performanceMetrics.avgVectorizationTime)}
          </div>
          <div className='text-sm text-gray-400'>Avg Vectorization Time</div>
        </div>
        <div className='bg-gray-900 rounded-lg p-4'>
          <div className='text-2xl font-bold text-green-400'>
            {(analyticsData.performanceMetrics.successRate * 100).toFixed(1)}%
          </div>
          <div className='text-sm text-gray-400'>Success Rate</div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className='bg-gray-900 rounded-lg p-6'>
        <h3 className='text-lg font-semibold text-white mb-4'>Performance Insights</h3>
        <div className='space-y-4'>
          <div className='flex items-center justify-between p-3 bg-gray-800 rounded-lg'>
            <div className='text-white'>Processing Efficiency</div>
            <div className='text-green-400'>
              {analyticsData.performanceMetrics.successRate >= 0.95
                ? 'Excellent'
                : analyticsData.performanceMetrics.successRate >= 0.85
                  ? 'Good'
                  : analyticsData.performanceMetrics.successRate >= 0.75
                    ? 'Fair'
                    : 'Poor'}
            </div>
          </div>
          <div className='flex items-center justify-between p-3 bg-gray-800 rounded-lg'>
            <div className='text-white'>Average Response Time</div>
            <div className='text-blue-400'>{formatDuration(analyticsData.avgProcessingTime)}</div>
          </div>
          <div className='flex items-center justify-between p-3 bg-gray-800 rounded-lg'>
            <div className='text-white'>System Load</div>
            <div className='text-orange-400'>
              {analyticsData.statusDistribution.processing > 10
                ? 'High'
                : analyticsData.statusDistribution.processing > 5
                  ? 'Medium'
                  : 'Low'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className='bg-gray-800 rounded-xl border border-gray-700'>
      {/* Header */}
      <div className='flex items-center justify-between p-6 border-b border-gray-700'>
        <div>
          <h2 className='text-2xl font-bold text-white'>
            {knowledgeItemId ? 'Item Analytics' : 'Knowledge Analytics'}
          </h2>
          <p className='text-gray-400'>
            {knowledgeItemId
              ? 'Detailed analytics for this item'
              : 'Overview of your knowledge base'}
          </p>
        </div>
        <div className='flex items-center space-x-4'>
          <select
            value={timeRange}
            onChange={e => {
              // Handle time range change
              fetchAnalyticsData();
            }}
            className='bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500'
          >
            <option value='7d'>Last 7 days</option>
            <option value='30d'>Last 30 days</option>
            <option value='90d'>Last 90 days</option>
            <option value='1y'>Last year</option>
          </select>
          <button
            onClick={handleRefresh}
            className='bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors'
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className='flex border-b border-gray-700'>
        {[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'usage', label: 'Usage', icon: '📈' },
          { id: 'performance', label: 'Performance', icon: '⚡' },
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
      <div className='p-6'>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'usage' && renderUsageTab()}
        {activeTab === 'performance' && renderPerformanceTab()}
      </div>
    </div>
  );
}
