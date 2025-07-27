'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface UsageMetrics {
  totalViews: number;
  totalDownloads: number;
  totalSearches: number;
  totalReferences: number;
  uniqueUsers: number;
  avgSessionTime: number;
  popularSearchTerms: Array<{ term: string; count: number }>;
  accessPatterns: Array<{ hour: number; count: number }>;
  userEngagement: {
    daily: Array<{ date: string; views: number; searches: number }>;
    weekly: Array<{ week: string; views: number; searches: number }>;
    monthly: Array<{ month: string; views: number; searches: number }>;
  };
  agentUsage: Array<{ agentId: string; agentName: string; usageCount: number; lastAccess: string }>;
  performanceMetrics: {
    avgResponseTime: number;
    searchAccuracy: number;
    userSatisfaction: number;
    errorRate: number;
  };
}

interface UsageAnalyticsProps {
  knowledgeItemId: string;
  onClose: () => void;
}

export default function UsageAnalytics({ knowledgeItemId, onClose }: UsageAnalyticsProps) {
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'trends' | 'agents' | 'performance'>(
    'overview'
  );
  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    fetchUsageMetrics();
  }, [knowledgeItemId, dateRange]);

  const fetchUsageMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/knowledge/${knowledgeItemId}/analytics?range=${dateRange}`
      );
      if (!response.ok) throw new Error('Failed to fetch usage metrics');

      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching usage metrics:', error);
      toast.error('Failed to load usage analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const renderOverviewTab = () => (
    <div className='space-y-6'>
      {/* Key Metrics */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <div className='bg-white/5 rounded-xl p-6 border border-white/10'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-400'>Total Views</p>
              <p className='text-2xl font-bold text-white'>
                {formatNumber(metrics?.totalViews || 0)}
              </p>
            </div>
            <div className='text-3xl'>👁️</div>
          </div>
        </div>

        <div className='bg-white/5 rounded-xl p-6 border border-white/10'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-400'>Total Downloads</p>
              <p className='text-2xl font-bold text-blue-400'>
                {formatNumber(metrics?.totalDownloads || 0)}
              </p>
            </div>
            <div className='text-3xl'>📥</div>
          </div>
        </div>

        <div className='bg-white/5 rounded-xl p-6 border border-white/10'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-400'>Total Searches</p>
              <p className='text-2xl font-bold text-green-400'>
                {formatNumber(metrics?.totalSearches || 0)}
              </p>
            </div>
            <div className='text-3xl'>🔍</div>
          </div>
        </div>

        <div className='bg-white/5 rounded-xl p-6 border border-white/10'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-400'>Unique Users</p>
              <p className='text-2xl font-bold text-purple-400'>
                {formatNumber(metrics?.uniqueUsers || 0)}
              </p>
            </div>
            <div className='text-3xl'>👥</div>
          </div>
        </div>
      </div>

      {/* Popular Search Terms */}
      <div className='bg-white/5 rounded-xl p-6 border border-white/10'>
        <h3 className='text-lg font-semibold text-white mb-4'>Popular Search Terms</h3>
        <div className='space-y-3'>
          {metrics?.popularSearchTerms?.slice(0, 10).map((term, index) => (
            <div key={index} className='flex items-center justify-between'>
              <span className='text-gray-300'>{term.term}</span>
              <div className='flex items-center space-x-2'>
                <div className='w-24 bg-gray-700 rounded-full h-2'>
                  <div
                    className='bg-orange-500 h-2 rounded-full transition-all duration-300'
                    style={{
                      width: `${(term.count / (metrics?.popularSearchTerms?.[0]?.count || 1)) * 100}%`,
                    }}
                  />
                </div>
                <span className='text-sm text-gray-400 w-8'>{term.count}</span>
              </div>
            </div>
          )) || <p className='text-gray-400 text-center py-4'>No search data available</p>}
        </div>
      </div>

      {/* Access Patterns */}
      <div className='bg-white/5 rounded-xl p-6 border border-white/10'>
        <h3 className='text-lg font-semibold text-white mb-4'>Access Patterns (24h)</h3>
        <div className='flex items-end justify-between h-32 space-x-1'>
          {Array.from({ length: 24 }, (_, i) => {
            const hourData = metrics?.accessPatterns?.find(p => p.hour === i);
            const count = hourData?.count || 0;
            const maxCount = Math.max(...(metrics?.accessPatterns?.map(p => p.count) || [1]));
            const height = (count / maxCount) * 100;

            return (
              <div key={i} className='flex-1 flex flex-col items-center'>
                <div
                  className='w-full bg-orange-500 rounded-t transition-all duration-300'
                  style={{ height: `${height}%` }}
                  title={`${i}:00 - ${count} accesses`}
                />
                <span className='text-xs text-gray-400 mt-1'>{i}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderTrendsTab = () => (
    <div className='space-y-6'>
      {/* Engagement Trends */}
      <div className='bg-white/5 rounded-xl p-6 border border-white/10'>
        <h3 className='text-lg font-semibold text-white mb-4'>Engagement Trends</h3>
        <div className='space-y-4'>
          {metrics?.userEngagement?.daily?.slice(-7).map((day, index) => (
            <div key={index} className='flex items-center justify-between'>
              <span className='text-gray-300 w-20'>{new Date(day.date).toLocaleDateString()}</span>
              <div className='flex items-center space-x-4 flex-1'>
                <div className='flex items-center space-x-2'>
                  <span className='text-sm text-gray-400'>Views:</span>
                  <span className='text-white'>{day.views}</span>
                  <div className='w-16 bg-gray-700 rounded-full h-2'>
                    <div
                      className='bg-blue-500 h-2 rounded-full'
                      style={{
                        width: `${(day.views / Math.max(...metrics.userEngagement.daily.map(d => d.views))) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className='flex items-center space-x-2'>
                  <span className='text-sm text-gray-400'>Searches:</span>
                  <span className='text-white'>{day.searches}</span>
                  <div className='w-16 bg-gray-700 rounded-full h-2'>
                    <div
                      className='bg-green-500 h-2 rounded-full'
                      style={{
                        width: `${(day.searches / Math.max(...metrics.userEngagement.daily.map(d => d.searches))) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Summary */}
      <div className='bg-white/5 rounded-xl p-6 border border-white/10'>
        <h3 className='text-lg font-semibold text-white mb-4'>Weekly Summary</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-blue-400 mb-2'>
              {metrics?.userEngagement?.weekly?.slice(-1)[0]?.views || 0}
            </div>
            <div className='text-sm text-gray-400'>Views This Week</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-green-400 mb-2'>
              {metrics?.userEngagement?.weekly?.slice(-1)[0]?.searches || 0}
            </div>
            <div className='text-sm text-gray-400'>Searches This Week</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAgentsTab = () => (
    <div className='space-y-6'>
      {/* Agent Usage */}
      <div className='bg-white/5 rounded-xl p-6 border border-white/10'>
        <h3 className='text-lg font-semibold text-white mb-4'>Agent Usage</h3>
        <div className='space-y-4'>
          {metrics?.agentUsage?.map((agent, index) => (
            <div
              key={index}
              className='flex items-center justify-between p-4 bg-white/5 rounded-lg'
            >
              <div className='flex items-center space-x-3'>
                <div className='w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center'>
                  <span className='text-white font-bold text-sm'>{agent.agentName.charAt(0)}</span>
                </div>
                <div>
                  <div className='font-medium text-white'>{agent.agentName}</div>
                  <div className='text-sm text-gray-400'>
                    Last access: {new Date(agent.lastAccess).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className='text-right'>
                <div className='text-lg font-bold text-white'>{agent.usageCount}</div>
                <div className='text-sm text-gray-400'>uses</div>
              </div>
            </div>
          )) || <p className='text-gray-400 text-center py-4'>No agent usage data available</p>}
        </div>
      </div>
    </div>
  );

  const renderPerformanceTab = () => (
    <div className='space-y-6'>
      {/* Performance Metrics */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <div className='bg-white/5 rounded-xl p-6 border border-white/10'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-blue-400 mb-2'>
              {metrics?.performanceMetrics?.avgResponseTime || 0}ms
            </div>
            <div className='text-sm text-gray-400'>Avg Response Time</div>
          </div>
        </div>

        <div className='bg-white/5 rounded-xl p-6 border border-white/10'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-green-400 mb-2'>
              {((metrics?.performanceMetrics?.searchAccuracy || 0) * 100).toFixed(1)}%
            </div>
            <div className='text-sm text-gray-400'>Search Accuracy</div>
          </div>
        </div>

        <div className='bg-white/5 rounded-xl p-6 border border-white/10'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-purple-400 mb-2'>
              {((metrics?.performanceMetrics?.userSatisfaction || 0) * 100).toFixed(1)}%
            </div>
            <div className='text-sm text-gray-400'>User Satisfaction</div>
          </div>
        </div>

        <div className='bg-white/5 rounded-xl p-6 border border-white/10'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-red-400 mb-2'>
              {((metrics?.performanceMetrics?.errorRate || 0) * 100).toFixed(2)}%
            </div>
            <div className='text-sm text-gray-400'>Error Rate</div>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className='bg-white/5 rounded-xl p-6 border border-white/10'>
        <h3 className='text-lg font-semibold text-white mb-4'>Performance Insights</h3>
        <div className='space-y-4'>
          <div className='flex items-center space-x-3'>
            <div className='w-2 h-2 bg-green-400 rounded-full'></div>
            <span className='text-gray-300'>Search performance is above average</span>
          </div>
          <div className='flex items-center space-x-3'>
            <div className='w-2 h-2 bg-yellow-400 rounded-full'></div>
            <span className='text-gray-300'>Response time could be improved</span>
          </div>
          <div className='flex items-center space-x-3'>
            <div className='w-2 h-2 bg-blue-400 rounded-full'></div>
            <span className='text-gray-300'>User engagement is trending upward</span>
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
            <span className='text-white'>Loading usage analytics...</span>
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
            <h2 className='text-2xl font-bold text-white'>Usage Analytics</h2>
            <p className='text-gray-400'>Track knowledge item usage and performance</p>
          </div>
          <div className='flex items-center space-x-4'>
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className='bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500'
            >
              <option value='1d'>Last 24 hours</option>
              <option value='7d'>Last 7 days</option>
              <option value='30d'>Last 30 days</option>
              <option value='90d'>Last 90 days</option>
            </select>
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
        </div>

        {/* Tabs */}
        <div className='flex border-b border-white/10'>
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'trends', label: 'Trends', icon: '📈' },
            { id: 'agents', label: 'Agents', icon: '🤖' },
            { id: 'performance', label: 'Performance', icon: '⚡' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors ${
                selectedTab === tab.id
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
          {selectedTab === 'overview' && renderOverviewTab()}
          {selectedTab === 'trends' && renderTrendsTab()}
          {selectedTab === 'agents' && renderAgentsTab()}
          {selectedTab === 'performance' && renderPerformanceTab()}
        </div>
      </div>
    </div>
  );
}
