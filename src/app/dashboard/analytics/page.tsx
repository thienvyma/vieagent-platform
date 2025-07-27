'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/ui/DashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

interface AnalyticsData {
  overview: {
    totalMessages: number;
    totalConversations: number;
    totalAgents: number;
    averageResponseTime: number;
    messagesGrowth: number;
    conversationsGrowth: number;
    agentsGrowth: number;
    responseTimeChange: number;
  };
  messagesByDay: Array<{
    date: string;
    count: number;
  }>;
  messagesByAgent: Array<{
    agentName: string;
    count: number;
  }>;
  modelPerformance: Array<{
    modelName: string;
    accuracy: number;
    averageResponseTime: number;
    usageCount: number;
  }>;
  topConversations: Array<{
    id: string;
    title: string;
    messageCount: number;
    agentName: string;
    lastActivity: string;
  }>;
  errorRates: {
    totalErrors: number;
    errorRate: number;
    errorsByType: Array<{
      type: string;
      count: number;
    }>;
  };
}

interface UserStats {
  usage: {
    percentage: number;
    plan: string;
  };
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      loadAnalytics();
      loadUserStats();
    }
  }, [status, router, timeRange]);

  const loadUserStats = async () => {
    try {
      const response = await fetch('/api/user/stats');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setUserStats({
            usage: {
              percentage: data.data.usage.percentage,
              plan: data.data.usage.plan,
            },
          });
        }
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/analytics?timeRange=${timeRange}`);

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load analytics');
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      setError('Unable to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatGrowth = (growth: number) => {
    const isPositive = growth >= 0;
    return (
      <span
        className={`flex items-center space-x-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}
      >
        <span>{isPositive ? '↗️' : '↘️'}</span>
        <span>{Math.abs(growth).toFixed(1)}%</span>
      </span>
    );
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatResponseTime = (ms: number) => {
    if (ms >= 1000) {
      return (ms / 1000).toFixed(1) + 's';
    }
    return Math.round(ms) + 'ms';
  };

  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case '24h':
        return 'Last 24 Hours';
      case '7d':
        return 'Last 7 Days';
      case '30d':
        return 'Last 30 Days';
      case '90d':
        return 'Last 90 Days';
      default:
        return 'Last 7 Days';
    }
  };

  // Custom right section with time range selector and header
  const renderCustomRightSection = () => (
    <div className='flex items-center space-x-2 sm:space-x-3 lg:space-x-4'>
      {/* Time Range Selector */}
      <div className='flex items-center space-x-2 bg-gray-800/50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-gray-600'>
        <span className='text-pink-400 text-sm'>📅</span>
        <select
          value={timeRange}
          onChange={e => setTimeRange(e.target.value)}
          className='bg-transparent border-0 text-white text-xs sm:text-sm focus:outline-none cursor-pointer'
        >
          <option value='24h' className='bg-gray-800'>
            24h
          </option>
          <option value='7d' className='bg-gray-800'>
            7d
          </option>
          <option value='30d' className='bg-gray-800'>
            30d
          </option>
          <option value='90d' className='bg-gray-800'>
            90d
          </option>
        </select>
      </div>

      {/* Dashboard Header */}
      <DashboardHeader stats={userStats} />
    </div>
  );

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout title='Analytics' description='Loading...'>
        <div className='flex items-center justify-center min-h-64'>
          <div className='text-center'>
            <div className='w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
            <p className='text-white'>Loading analytics...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title='Analytics' description='Error loading data'>
        <div className='text-center py-16'>
          <div className='w-20 h-20 bg-gradient-to-r from-red-500/20 to-rose-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-red-500/30'>
            <span className='text-3xl'>❌</span>
          </div>
          <h3 className='text-xl font-bold text-white mb-3'>Analytics Error</h3>
          <p className='text-red-400 mb-6'>{error}</p>
          <button
            onClick={loadAnalytics}
            className='bg-gradient-to-r from-pink-500 to-rose-600 text-white px-6 py-3 rounded-xl hover:from-pink-600 hover:to-rose-700 transition-all font-semibold'
          >
            Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={`📊 Analytics Dashboard`}
      description='Phân tích hiệu suất và thống kê hệ thống AI'
      rightSection={renderCustomRightSection()}
    >
      <div className='space-y-8'>
        {analytics && (
          <>
            {/* Overview Stats */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
              <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10 hover:border-pink-500/30 transition-all duration-300'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center'>
                    <span className='text-2xl'>💬</span>
                  </div>
                  <div className='text-right'>
                    <span className='text-2xl font-black text-white'>
                      {formatNumber(analytics.overview.totalMessages)}
                    </span>
                    {formatGrowth(analytics.overview.messagesGrowth)}
                  </div>
                </div>
                <h3 className='text-white font-semibold mb-1'>Total Messages</h3>
                <p className='text-gray-400 text-sm'>All time messages processed</p>
              </div>

              <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10 hover:border-blue-500/30 transition-all duration-300'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center'>
                    <span className='text-2xl'>📞</span>
                  </div>
                  <div className='text-right'>
                    <span className='text-2xl font-black text-white'>
                      {formatNumber(analytics.overview.totalConversations)}
                    </span>
                    {formatGrowth(analytics.overview.conversationsGrowth)}
                  </div>
                </div>
                <h3 className='text-white font-semibold mb-1'>Conversations</h3>
                <p className='text-gray-400 text-sm'>Active conversation threads</p>
              </div>

              <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10 hover:border-green-500/30 transition-all duration-300'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center'>
                    <span className='text-2xl text-blue-400'>AI</span>
                  </div>
                  <div className='text-right'>
                    <span className='text-2xl font-black text-white'>
                      {analytics.overview.totalAgents}
                    </span>
                    {formatGrowth(analytics.overview.agentsGrowth)}
                  </div>
                </div>
                <h3 className='text-white font-semibold mb-1'>AI Agents</h3>
                <p className='text-gray-400 text-sm'>Deployed assistants</p>
              </div>

              <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10 hover:border-orange-500/30 transition-all duration-300'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center'>
                    <span className='text-2xl'>⚡</span>
                  </div>
                  <div className='text-right'>
                    <span className='text-2xl font-black text-white'>
                      {formatResponseTime(analytics.overview.averageResponseTime)}
                    </span>
                    {formatGrowth(analytics.overview.responseTimeChange)}
                  </div>
                </div>
                <h3 className='text-white font-semibold mb-1'>Avg Response</h3>
                <p className='text-gray-400 text-sm'>Average response time</p>
              </div>
            </div>

            {/* Charts Row */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8'>
              {/* Messages by Day Chart */}
              <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10'>
                <h3 className='text-xl font-bold text-white mb-6 flex items-center space-x-2'>
                  <span>📈</span>
                  <span>Messages Over Time</span>
                </h3>
                <div className='space-y-4'>
                  {analytics.messagesByDay.map((day, index) => (
                    <div key={day.date} className='flex items-center justify-between'>
                      <span className='text-gray-400 text-sm'>
                        {new Date(day.date).toLocaleDateString()}
                      </span>
                      <div className='flex items-center space-x-3 flex-1 ml-4'>
                        <div className='flex-1 bg-gray-700 rounded-full h-3'>
                          <div
                            className='bg-gradient-to-r from-pink-500 to-rose-500 h-3 rounded-full transition-all duration-500'
                            style={{
                              width: `${analytics.messagesByDay.length > 0 ? (day.count / Math.max(...analytics.messagesByDay.map(d => d.count), 1)) * 100 : 0}%`,
                            }}
                          ></div>
                        </div>
                        <span className='text-white font-medium text-sm min-w-[40px] text-right'>
                          {day.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Messages by Agent */}
              <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10'>
                <h3 className='text-xl font-bold text-white mb-6 flex items-center space-x-2'>
                  <span className='text-blue-400'>AI</span>
                  <span>Messages by Agent</span>
                </h3>
                <div className='space-y-4'>
                  {analytics.messagesByAgent.map((agent, index) => {
                    const colors = [
                      'from-blue-500 to-cyan-500',
                      'from-green-500 to-emerald-500',
                      'from-purple-500 to-pink-500',
                      'from-orange-500 to-red-500',
                      'from-yellow-500 to-orange-500',
                    ];
                    const maxCount =
                      analytics.messagesByAgent.length > 0
                        ? Math.max(...analytics.messagesByAgent.map(a => a.count), 1)
                        : 1;
                    return (
                      <div key={agent.agentName} className='flex items-center justify-between'>
                        <span className='text-gray-300 text-sm font-medium truncate max-w-[120px]'>
                          {agent.agentName}
                        </span>
                        <div className='flex items-center space-x-3 flex-1 ml-4'>
                          <div className='flex-1 bg-gray-700 rounded-full h-3'>
                            <div
                              className={`bg-gradient-to-r ${colors[index % colors.length]} h-3 rounded-full transition-all duration-500`}
                              style={{ width: `${(agent.count / maxCount) * 100}%` }}
                            ></div>
                          </div>
                          <span className='text-white font-bold text-sm min-w-[40px] text-right'>
                            {agent.count}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RAG Analytics Section */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8'>
              {/* RAG Performance Metrics */}
              <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10'>
                <h3 className='text-xl font-bold text-white mb-6 flex items-center space-x-2'>
                  <span>🧠</span>
                  <span>RAG Performance</span>
                </h3>
                <div className='space-y-6'>
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='bg-white/5 rounded-2xl p-4'>
                      <div className='text-sm text-gray-400 mb-1'>Vector Searches</div>
                      <div className='text-2xl font-bold text-cyan-400'>
                        {analytics.overview.totalMessages
                          ? Math.floor(analytics.overview.totalMessages * 0.65)
                          : 0}
                      </div>
                      <div className='text-xs text-green-400'>+12.5% this week</div>
                    </div>
                    <div className='bg-white/5 rounded-2xl p-4'>
                      <div className='text-sm text-gray-400 mb-1'>Avg Relevance</div>
                      <div className='text-2xl font-bold text-green-400'>89.2%</div>
                      <div className='text-xs text-green-400'>+2.1% accuracy</div>
                    </div>
                  </div>

                  <div className='space-y-3'>
                    <div className='flex justify-between items-center'>
                      <span className='text-gray-300 text-sm'>Search Accuracy</span>
                      <span className='text-green-400 font-bold'>89.2%</span>
                    </div>
                    <div className='w-full bg-gray-700 rounded-full h-2'>
                      <div
                        className='bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full'
                        style={{ width: '89.2%' }}
                      ></div>
                    </div>
                  </div>

                  <div className='space-y-3'>
                    <div className='flex justify-between items-center'>
                      <span className='text-gray-300 text-sm'>Context Usage</span>
                      <span className='text-blue-400 font-bold'>76.8%</span>
                    </div>
                    <div className='w-full bg-gray-700 rounded-full h-2'>
                      <div
                        className='bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full'
                        style={{ width: '76.8%' }}
                      ></div>
                    </div>
                  </div>

                  <div className='space-y-3'>
                    <div className='flex justify-between items-center'>
                      <span className='text-gray-300 text-sm'>Response Quality</span>
                      <span className='text-purple-400 font-bold'>92.5%</span>
                    </div>
                    <div className='w-full bg-gray-700 rounded-full h-2'>
                      <div
                        className='bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full'
                        style={{ width: '92.5%' }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Knowledge Source Analytics */}
              <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10'>
                <h3 className='text-xl font-bold text-white mb-6 flex items-center space-x-2'>
                  <span>📚</span>
                  <span>Knowledge Sources</span>
                </h3>
                <div className='space-y-4'>
                  {/* Top Knowledge Sources */}
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between p-3 bg-white/5 rounded-lg'>
                      <div className='flex items-center space-x-3'>
                        <div className='w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center'>
                          <span className='text-xs'>📄</span>
                        </div>
                        <div>
                          <div className='text-white text-sm font-medium'>Product FAQ</div>
                          <div className='text-gray-400 text-xs'>Most accessed</div>
                        </div>
                      </div>
                      <div className='text-blue-400 font-bold'>324</div>
                    </div>

                    <div className='flex items-center justify-between p-3 bg-white/5 rounded-lg'>
                      <div className='flex items-center space-x-3'>
                        <div className='w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center'>
                          <span className='text-xs'>📋</span>
                        </div>
                        <div>
                          <div className='text-white text-sm font-medium'>User Manual</div>
                          <div className='text-gray-400 text-xs'>High relevance</div>
                        </div>
                      </div>
                      <div className='text-green-400 font-bold'>198</div>
                    </div>

                    <div className='flex items-center justify-between p-3 bg-white/5 rounded-lg'>
                      <div className='flex items-center space-x-3'>
                        <div className='w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center'>
                          <span className='text-xs'>🔧</span>
                        </div>
                        <div>
                          <div className='text-white text-sm font-medium'>Troubleshooting</div>
                          <div className='text-gray-400 text-xs'>Problem solving</div>
                        </div>
                      </div>
                      <div className='text-purple-400 font-bold'>156</div>
                    </div>
                  </div>

                  {/* Vector Database Stats */}
                  <div className='bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4'>
                    <div className='flex items-center space-x-2 mb-3'>
                      <span className='text-cyan-400'>🧠</span>
                      <span className='text-cyan-300 font-medium text-sm'>Vector Database</span>
                    </div>
                    <div className='grid grid-cols-2 gap-3 text-xs'>
                      <div>
                        <div className='text-gray-400'>Collections</div>
                        <div className='text-cyan-400 font-bold'>3</div>
                      </div>
                      <div>
                        <div className='text-gray-400'>Embeddings</div>
                        <div className='text-cyan-400 font-bold'>15.2K</div>
                      </div>
                      <div>
                        <div className='text-gray-400'>Search Speed</div>
                        <div className='text-cyan-400 font-bold'>45ms</div>
                      </div>
                      <div>
                        <div className='text-gray-400'>Cache Hit</div>
                        <div className='text-cyan-400 font-bold'>82%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Model Performance & Error Rates */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8'>
              {/* Model Performance */}
              <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10'>
                <h3 className='text-xl font-bold text-white mb-6 flex items-center space-x-2'>
                  <span>🚀</span>
                  <span>Model Performance</span>
                </h3>
                <div className='space-y-6'>
                  {analytics.modelPerformance.map((model, index) => (
                    <div key={model.modelName} className='bg-white/5 rounded-2xl p-6'>
                      <div className='flex justify-between items-center mb-4'>
                        <h4 className='text-lg font-semibold text-white'>{model.modelName}</h4>
                        <span className='text-sm text-gray-400'>{model.usageCount} uses</span>
                      </div>
                      <div className='grid grid-cols-2 gap-4'>
                        <div>
                          <div className='text-gray-400 text-sm mb-1'>Accuracy:</div>
                          <div className='flex items-center space-x-2'>
                            <div className='flex-1 bg-gray-700 rounded-full h-2'>
                              <div
                                className='bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full'
                                style={{ width: `${model.accuracy}%` }}
                              ></div>
                            </div>
                            <span className='text-green-400 font-bold text-sm'>
                              {model.accuracy}%
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className='text-gray-400 text-sm mb-1'>Response Time:</div>
                          <div className='text-orange-400 font-bold'>
                            {formatResponseTime(model.averageResponseTime)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Error Rates */}
              <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10'>
                <h3 className='text-xl font-bold text-white mb-6 flex items-center space-x-2'>
                  <span>⚠️</span>
                  <span>Error Analysis</span>
                </h3>

                <div className='bg-red-500/10 border border-red-500/30 rounded-2xl p-6 mb-6'>
                  <div className='flex items-center justify-between mb-4'>
                    <div>
                      <div className='text-red-400 text-sm'>Error Rate</div>
                      <div className='text-2xl font-bold text-red-300'>
                        {analytics.errorRates.errorRate.toFixed(2)}%
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='text-gray-400 text-sm'>Total Errors</div>
                      <div className='text-xl font-bold text-white'>
                        {analytics.errorRates.totalErrors}
                      </div>
                    </div>
                  </div>
                </div>

                <div className='space-y-3'>
                  <h4 className='text-lg font-medium text-white'>Errors by Type:</h4>
                  {analytics.errorRates.errorsByType.map((error, index) => {
                    const maxErrorCount =
                      analytics.errorRates.errorsByType.length > 0
                        ? Math.max(...analytics.errorRates.errorsByType.map(e => e.count), 1)
                        : 1;
                    return (
                      <div
                        key={error.type}
                        className='flex items-center justify-between bg-white/5 rounded-xl p-4'
                      >
                        <span className='text-gray-300 text-sm'>{error.type}</span>
                        <div className='flex items-center space-x-3'>
                          <div className='w-20 bg-gray-700 rounded-full h-2'>
                            <div
                              className='bg-gradient-to-r from-red-500 to-rose-500 h-2 rounded-full'
                              style={{ width: `${(error.count / maxErrorCount) * 100}%` }}
                            ></div>
                          </div>
                          <span className='text-red-400 font-bold text-sm min-w-[30px] text-right'>
                            {error.count}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Top Conversations */}
            <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10'>
              <h3 className='text-xl font-bold text-white mb-6 flex items-center space-x-2'>
                <span>🏆</span>
                <span>Top Conversations</span>
                <span className='text-sm text-gray-400 bg-gray-800/50 px-2 py-1 rounded-lg'>
                  Most Active
                </span>
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {analytics.topConversations.map((conv, index) => (
                  <div
                    key={conv.id}
                    className='bg-white/5 rounded-2xl p-6 hover:bg-white/10 transition-all'
                  >
                    <div className='flex items-start justify-between mb-4'>
                      <div className='flex items-center space-x-3'>
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold ${
                            index === 0
                              ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                              : index === 1
                                ? 'bg-gradient-to-r from-gray-400 to-gray-600'
                                : index === 2
                                  ? 'bg-gradient-to-r from-amber-600 to-yellow-700'
                                  : 'bg-gradient-to-r from-gray-600 to-gray-700'
                          }`}
                        >
                          #{index + 1}
                        </div>
                        <div className='flex-1'>
                          <h4 className='text-white font-medium truncate'>
                            {conv.title || 'Untitled'}
                          </h4>
                          <p className='text-gray-400 text-sm'>{conv.agentName}</p>
                        </div>
                      </div>
                    </div>
                    <div className='flex justify-between items-center'>
                      <div>
                        <span className='text-purple-400 font-bold text-lg'>
                          {conv.messageCount}
                        </span>
                        <span className='text-gray-400 text-sm ml-1'>messages</span>
                      </div>
                      <div className='text-gray-500 text-xs'>
                        {new Date(conv.lastActivity).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* No Data State */}
        {!analytics && !loading && (
          <div className='text-center py-16'>
            <div className='w-24 h-24 bg-gradient-to-r from-pink-500/20 to-rose-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-pink-500/30'>
              <span className='text-4xl'>📊</span>
            </div>
            <h3 className='text-2xl font-bold text-white mb-4'>No Analytics Data</h3>
            <p className='text-gray-400 mb-8 max-w-md mx-auto'>
              Chưa có dữ liệu để phân tích. Hãy tạo một vài conversations để xem insights.
            </p>
            <a
              href='/dashboard/chat'
              className='bg-gradient-to-r from-pink-500 to-rose-600 text-white px-8 py-4 rounded-2xl hover:from-pink-600 hover:to-rose-700 transition-all hover:scale-105 font-semibold shadow-2xl inline-block'
            >
              <span className='flex items-center space-x-2'>
                <span className='text-xl'>💬</span>
                <span>Start Chatting</span>
              </span>
            </a>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
