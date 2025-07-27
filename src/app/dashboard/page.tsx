'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/ui/DashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { CreditCard, CheckCircle, Clock, XCircle, AlertCircle, User, Crown } from 'lucide-react';

interface UserStats {
  counts: {
    agents: number;
    conversations: number;
    messages: number;
    documents: number;
    apiKeys: number;
    thisMonthMessages: number;
  };
  usage: {
    percentage: number;
    plan: string;
    limits: {
      agents: number;
      conversations: number;
      messages: number;
    };
    estimatedCost: number;
  };
  recent: {
    agents: Array<{
      id: string;
      name: string;
      status: string;
      createdAt: string;
      _count: { conversations: number };
    }>;
    conversations: Array<{
      id: string;
      title: string;
      createdAt: string;
      agent: { name: string };
      _count: { messages: number };
    }>;
  };
  trends: {
    messagesGrowth: number;
    conversationsGrowth: number;
    agentsGrowth: number;
  };
}

export default function UserDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chromaStatus, setChromaStatus] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchStats();
      fetchChromaStatus();
    }
  }, [status, router]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/user/stats');
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.error || 'Failed to fetch statistics');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Unable to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchChromaStatus = async () => {
    try {
      const response = await fetch('/api/admin/chromadb-status');
      const data = await response.json();
      if (data.success) {
        setChromaStatus(data);
      }
    } catch (error) {
      console.error('Error fetching ChromaDB status:', error);
    }
  };

  const getPlanBadge = (plan: string) => {
    const badges = {
      TRIAL: {
        bg: 'bg-gray-500/20',
        border: 'border-gray-500/30',
        text: 'text-gray-300',
        emoji: '🎯',
      },
      BASIC: {
        bg: 'bg-blue-500/20',
        border: 'border-blue-500/30',
        text: 'text-blue-300',
        emoji: '💡',
      },
      PRO: {
        bg: 'bg-purple-500/20',
        border: 'border-purple-500/30',
        text: 'text-purple-300',
        emoji: '🚀',
      },
      ENTERPRISE: {
        bg: 'bg-orange-500/20',
        border: 'border-orange-500/30',
        text: 'text-orange-300',
        emoji: '🏢',
      },
      ULTIMATE: {
        bg: 'bg-yellow-500/20',
        border: 'border-yellow-500/30',
        text: 'text-yellow-300',
        emoji: '👑',
      },
    };
    const badge = badges[plan as keyof typeof badges] || badges.TRIAL;
    return badge;
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

  // Custom right section with Update Plans button and header
  const renderCustomRightSection = () => (
    <div className='flex items-center space-x-2 sm:space-x-3 lg:space-x-4'>
      {/* Update Plans Button */}
      <button
        onClick={() => router.push('/dashboard/upgrade')}
        className='flex items-center space-x-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 hover:border-purple-400/50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl transition-all duration-300 hover:from-purple-500/30 hover:to-pink-500/30'
        title='Nâng cấp gói dịch vụ'
      >
        <span className='text-purple-400 text-sm sm:text-base'>💎</span>
        <span className='text-xs sm:text-sm text-purple-300 font-medium hidden sm:inline'>
          Update Plans
        </span>
      </button>

      {/* Dashboard Header */}
      <DashboardHeader stats={stats} />
    </div>
  );

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout title='Dashboard' description='Đang tải dữ liệu...'>
        <div className='flex items-center justify-center min-h-[400px]'>
          <div className='text-center'>
            <div className='w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
            <p className='text-white'>Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  if (error) {
    return (
      <DashboardLayout title='Dashboard' description='Có lỗi xảy ra khi tải dữ liệu'>
        <div className='flex items-center justify-center min-h-[400px]'>
          <div className='text-center'>
            <div className='text-red-400 mb-4'>❌ {error}</div>
            <button
              onClick={fetchStats}
              className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors'
            >
              Thử lại
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={`Xin chào, ${session?.user?.name || session?.user?.email?.split('@')[0] || 'User'}! 👋`}
      description={
        stats
          ? `Bạn đang sử dụng gói ${stats.usage.plan} với ${stats.usage.percentage}% usage`
          : 'Tổng quan về hoạt động AI agents của bạn'
      }
      rightSection={renderCustomRightSection()}
    >
      {/* Usage Overview */}
      {stats && (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8'>
          {/* Current Plan */}
          <div className='bg-white/5 backdrop-blur-sm border border-gray-700 rounded-xl sm:rounded-2xl p-4 sm:p-6'>
            <div className='flex items-center justify-between mb-3 sm:mb-4'>
              <h3 className='text-base sm:text-lg font-semibold text-white'>📦 Gói hiện tại</h3>
            </div>
            <div className='flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4'>
              <div
                className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border ${getPlanBadge(stats.usage.plan).bg} ${getPlanBadge(stats.usage.plan).border} ${getPlanBadge(stats.usage.plan).text}`}
              >
                <span className='flex items-center space-x-1 sm:space-x-2'>
                  <span className='text-sm sm:text-base'>
                    {getPlanBadge(stats.usage.plan).emoji}
                  </span>
                  <span className='font-semibold text-sm sm:text-base'>{stats.usage.plan}</span>
                </span>
              </div>
            </div>
            <div className='space-y-2 text-xs sm:text-sm'>
              <div className='flex justify-between text-gray-300'>
                <span>Agents</span>
                <span className='font-medium'>
                  {stats.counts.agents}/{stats.usage.limits.agents}
                </span>
              </div>
              <div className='flex justify-between text-gray-300'>
                <span>Conversations</span>
                <span className='font-medium'>
                  {stats.counts.conversations}/{stats.usage.limits.conversations}
                </span>
              </div>
              <div className='flex justify-between text-gray-300'>
                <span>Messages</span>
                <span className='font-medium'>
                  {stats.counts.messages}/{stats.usage.limits.messages}
                </span>
              </div>
            </div>
          </div>

          {/* Usage Statistics */}
          <div className='bg-white/5 backdrop-blur-sm border border-gray-700 rounded-xl sm:rounded-2xl p-4 sm:p-6'>
            <h3 className='text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4'>
              📊 Thống kê sử dụng
            </h3>
            <div className='space-y-3 sm:space-y-4'>
              <div>
                <div className='flex justify-between text-xs sm:text-sm mb-2'>
                  <span className='text-gray-300'>Usage</span>
                  <span className='text-white font-medium'>{stats.usage.percentage}%</span>
                </div>
                <div className='w-full bg-gray-800 rounded-full h-2'>
                  <div
                    className='bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300'
                    style={{ width: `${Math.min(stats.usage.percentage, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className='grid grid-cols-2 gap-2 sm:gap-4 text-center'>
                <div className='bg-blue-500/10 rounded-lg sm:rounded-xl p-2 sm:p-3'>
                  <div className='text-lg sm:text-2xl font-bold text-blue-400 mb-1 sm:mb-2'>
                    {stats.counts.thisMonthMessages}
                  </div>
                  <div className='text-xs text-gray-400'>Tin nhắn tháng này</div>
                </div>
                <div className='bg-purple-500/10 rounded-lg sm:rounded-xl p-2 sm:p-3'>
                  <div className='text-lg sm:text-2xl font-bold text-purple-400'>
                    ${stats.usage.estimatedCost}
                  </div>
                  <div className='text-xs text-gray-400'>Chi phí ước tính</div>
                </div>
              </div>
            </div>
          </div>

          {/* Growth Trends */}
          <div className='bg-white/5 backdrop-blur-sm border border-gray-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:col-span-2 lg:col-span-1'>
            <h3 className='text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4'>
              📈 Xu hướng tăng trưởng
            </h3>
            <div className='space-y-3 sm:space-y-4'>
              <div className='flex justify-between items-center'>
                <span className='text-gray-300 text-xs sm:text-sm'>Messages</span>
                {formatGrowth(stats.trends.messagesGrowth)}
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-gray-300 text-xs sm:text-sm'>Conversations</span>
                {formatGrowth(stats.trends.conversationsGrowth)}
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-gray-300 text-xs sm:text-sm'>Agents</span>
                {formatGrowth(stats.trends.agentsGrowth)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats - Enhanced with Vector Database */}
      {stats && (
        <div className='grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8'>
          <div className='bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center'>
            <div className='text-2xl sm:text-3xl font-bold text-blue-400 mb-1 sm:mb-2'>
              {stats.counts.agents}
            </div>
            <div className='text-gray-300 text-xs sm:text-sm'>🤖 VIEAgents</div>
          </div>

          <div className='bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center'>
            <div className='text-2xl sm:text-3xl font-bold text-purple-400 mb-1 sm:mb-2'>
              {stats.counts.conversations}
            </div>
            <div className='text-gray-300 text-xs sm:text-sm'>💬 Conversations</div>
          </div>

          <div className='bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center'>
            <div className='text-2xl sm:text-3xl font-bold text-green-400 mb-1 sm:mb-2'>
              {stats.counts.messages}
            </div>
            <div className='text-gray-300 text-xs sm:text-sm'>📝 Messages</div>
          </div>

          <div className='bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center'>
            <div className='text-2xl sm:text-3xl font-bold text-orange-400 mb-1 sm:mb-2'>
              {stats.counts.documents}
            </div>
            <div className='text-gray-300 text-xs sm:text-sm'>📚 Documents</div>
          </div>

          {/* Vector Database Status */}
          <div
            className={`bg-gradient-to-br border rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center ${
              chromaStatus?.storage?.exists
                ? 'from-cyan-500/20 to-teal-500/20 border-cyan-500/30'
                : 'from-gray-500/20 to-slate-500/20 border-gray-500/30'
            }`}
          >
            <div
              className={`text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 ${
                chromaStatus?.storage?.exists ? 'text-cyan-400' : 'text-gray-400'
              }`}
            >
              {chromaStatus?.storage?.exists ? '✅' : '❌'}
            </div>
            <div className='text-gray-300 text-xs sm:text-sm'>🧠 Vector DB</div>
          </div>
        </div>
      )}

      {/* System Health Section */}
      {chromaStatus && (
        <div className='mb-6 sm:mb-8'>
          <div className='bg-white/5 backdrop-blur-sm border border-gray-700 rounded-xl sm:rounded-2xl p-4 sm:p-6'>
            <h3 className='text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center space-x-2'>
              <span>🏥</span>
              <span>System Health</span>
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              {/* Vector Database */}
              <div className='bg-white/5 rounded-lg p-3'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-gray-300 text-sm'>Vector Database</span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      chromaStatus.storage?.exists
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {chromaStatus.storage?.exists ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <div className='text-white text-xs'>
                  Collections: {chromaStatus.storage?.vectors?.collections || 0}
                </div>
                <div className='text-gray-400 text-xs'>
                  Size: {chromaStatus.storage?.vectors?.sizeFormatted || '0 Bytes'}
                </div>
              </div>

              {/* RAG Service */}
              <div className='bg-white/5 rounded-lg p-3'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-gray-300 text-sm'>RAG Service</span>
                  <span className='text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400'>
                    Operational
                  </span>
                </div>
                <div className='text-white text-xs'>Mode: {chromaStatus.mode || 'Production'}</div>
                <div className='text-gray-400 text-xs'>
                  Status: {chromaStatus.status || 'Active'}
                </div>
              </div>

              {/* Knowledge Pipeline */}
              <div className='bg-white/5 rounded-lg p-3'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-gray-300 text-sm'>Knowledge Pipeline</span>
                  <span className='text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400'>
                    Ready
                  </span>
                </div>
                <div className='text-white text-xs'>Documents: {stats?.counts.documents || 0}</div>
                <div className='text-gray-400 text-xs'>Processing: Active</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {stats && (
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8'>
          {/* Recent Agents */}
          <div className='bg-white/5 backdrop-blur-sm border border-gray-700 rounded-xl sm:rounded-2xl p-4 sm:p-6'>
            <h3 className='text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4'>
              AI Recent Agents
            </h3>
            <div className='space-y-2 sm:space-y-3'>
              {stats.recent.agents.slice(0, 4).map(agent => (
                <div
                  key={agent.id}
                  className='flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0'
                >
                  <div className='min-w-0 flex-1'>
                    <div className='text-white font-medium text-sm sm:text-base truncate'>
                      {agent.name}
                    </div>
                    <div className='text-gray-400 text-xs sm:text-sm'>
                      {agent._count?.conversations ?? 0} conversations
                    </div>
                  </div>
                  <div
                    className={`px-2 py-1 rounded-lg text-xs flex-shrink-0 ml-2 ${
                      agent.status === 'ACTIVE'
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-gray-500/20 text-gray-300'
                    }`}
                  >
                    {agent.status}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Conversations */}
          <div className='bg-white/5 backdrop-blur-sm border border-gray-700 rounded-xl sm:rounded-2xl p-4 sm:p-6'>
            <h3 className='text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4'>
              💬 Recent Conversations
            </h3>
            <div className='space-y-2 sm:space-y-3'>
              {stats.recent.conversations.slice(0, 4).map(conversation => (
                <div
                  key={conversation.id}
                  className='py-2 border-b border-gray-700 last:border-b-0'
                >
                  <div className='text-white font-medium text-sm sm:text-base truncate'>
                    {conversation.title}
                  </div>
                  <div className='text-gray-400 text-xs sm:text-sm truncate'>
                    {conversation.agent.name} • {conversation._count.messages} messages
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
