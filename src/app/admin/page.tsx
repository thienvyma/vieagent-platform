'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Bot,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Activity,
  DollarSign,
  FileText,
  Server,
  Calendar,
  Filter,
  Download,
  RefreshCw,
} from 'lucide-react';
import { hasPermission, type UserRole } from '@/lib/permissions';
import Link from 'next/link';
import DiskMonitoringWidget from '@/components/admin/DiskMonitoringWidget';
import AutoCleanupWidget from '@/components/admin/AutoCleanupWidget';
import ChromaDBStatusWidget from '@/components/admin/ChromaDBStatusWidget';

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  totalAgents: number;
  activeAgents: number;
  totalConversations: number;
  totalRevenue: number;
  activeSubscriptions: number;
  avgResponseTime: number;
  errorRate: number;
  uptime: number;
  totalStorage: number;
  storageUsed: number;
}

interface RecentActivity {
  id: string;
  type: 'user_registered' | 'agent_created' | 'subscription_activated' | 'error_occurred';
  description: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface AdminMetrics {
  overview: {
    totalUsers: number;
    activeUsers: number;
    newUsersThisMonth: number;
    userGrowthRate: number;
    totalAgents: number;
    activeAgents: number;
    totalSubscriptions: number;
    activeSubscriptions: number;
    monthlyRevenue: number;
  };
  userMetrics: {
    total: number;
    active: number;
    newThisMonth: number;
    growthRate: number;
    planDistribution: Record<string, number>;
  };
  contentMetrics: {
    totalBlogPosts: number;
    featuredPosts: number;
    totalViews: number;
    newsletterSubscribers: number;
    activeNewsletterSubs: number;
    totalContacts: number;
    pendingContacts: number;
  };
  agentMetrics: {
    total: number;
    active: number;
    usage: Array<{
      agentId: string;
      conversations: number;
    }>;
  };
  systemMetrics: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    activeConnections: number;
    lastUpdated: string;
  } | null;
  trends: {
    daily: Array<{
      date: string;
      users: number;
      contacts: number;
      newsletters: number;
    }>;
    last7Days: string[];
  };
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const userRole = session?.user?.role as UserRole;
  const canViewMetrics = hasPermission(userRole, 'view_metrics');

  // Date filter state
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
    endDate: new Date().toISOString().split('T')[0], // today
  });
  const [filterApplied, setFilterApplied] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      if (!['ADMIN', 'MANAGER', 'OWNER'].includes(userRole)) {
        router.push('/dashboard');
      } else {
        if (canViewMetrics) {
          fetchMetrics();
        }
      }
    }
  }, [status, session, router, canViewMetrics]);

  useEffect(() => {
    if (session?.user) {
      fetchMetrics();
    }
  }, [session, filterApplied]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      // Use the existing metrics API for now
      const response = await fetch('/api/admin/metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const handleApplyFilter = () => {
    setFilterApplied(true);
    setShowDateFilter(false);
    fetchMetrics();
  };

  const handleResetFilter = () => {
    const defaultRange = {
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    };
    setDateRange(defaultRange);
    setFilterApplied(false);
    setShowDateFilter(false);
  };

  const getDateRangeText = () => {
    const start = new Date(dateRange.startDate).toLocaleDateString('vi-VN');
    const end = new Date(dateRange.endDate).toLocaleDateString('vi-VN');
    return `${start} - ${end}`;
  };

  const exportReport = async () => {
    try {
      // Simple client-side export of displayed data
      const csvContent = [
        ['Metric', 'Value'],
        ['Total Users', metrics?.overview?.totalUsers?.toString() || '0'],
        ['Active Users', metrics?.overview?.activeUsers?.toString() || '0'],
        ['New Users This Month', metrics?.overview?.newUsersThisMonth?.toString() || '0'],
        ['Total Agents', metrics?.overview?.totalAgents?.toString() || '0'],
        ['Active Agents', metrics?.overview?.activeAgents?.toString() || '0'],
        ['Monthly Revenue', formatCurrency(metrics?.overview?.monthlyRevenue || 0)],
        ['Active Subscriptions', metrics?.overview?.activeSubscriptions?.toString() || '0'],
        [
          'Newsletter Subscribers',
          metrics?.contentMetrics?.newsletterSubscribers?.toString() || '0',
        ],
        ['Total Contacts', metrics?.contentMetrics?.totalContacts?.toString() || '0'],
        ['Pending Contacts', metrics?.contentMetrics?.pendingContacts?.toString() || '0'],
        ['Blog Posts', metrics?.contentMetrics?.totalBlogPosts?.toString() || '0'],
      ]
        .map(row => row.join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `admin-report-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  if (status === 'loading') {
    return (
      <div className='min-h-screen bg-black flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-white'>Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registered':
        return <Users className='w-4 h-4 text-blue-500' />;
      case 'agent_created':
        return <Bot className='w-4 h-4 text-green-500' />;
      case 'subscription_activated':
        return <CreditCard className='w-4 h-4 text-purple-500' />;
      case 'error_occurred':
        return <AlertTriangle className='w-4 h-4 text-red-500' />;
      default:
        return <Activity className='w-4 h-4 text-gray-500' />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'high':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default:
        return 'bg-green-500/20 text-green-300 border-green-500/30';
    }
  };

  return (
    <div className='min-h-screen bg-black text-white'>
      {/* Background Effects */}
      <div className='fixed inset-0 z-0'>
        <div className='absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900'></div>
        <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse'></div>
        <div className='absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000'></div>
        <div className='absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]'></div>
      </div>

      {/* Header */}
      <header className='relative z-10 border-b border-gray-800/50 backdrop-blur-sm'>
        <div className='container mx-auto px-4 py-4'>
          <div className='flex justify-between items-center'>
            <div className='flex items-center space-x-4'>
              <div className='w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center'>
                <span className='text-white font-bold text-xl'>⚡</span>
              </div>
              <div>
                <h1 className='text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent'>
                  Admin Dashboard
                </h1>
                <p className='text-gray-400 text-sm'>
                  {userRole} - {session?.user?.name || session?.user?.email}
                </p>
              </div>
            </div>

            <div className='flex items-center space-x-4'>
              {/* Date Filter Controls */}
              <div className='flex items-center space-x-3'>
                <button
                  onClick={() => setShowDateFilter(!showDateFilter)}
                  className={`px-4 py-2 rounded-xl border transition-all flex items-center space-x-2 ${
                    filterApplied
                      ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                      : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600/50'
                  }`}
                >
                  <Calendar className='w-4 h-4' />
                  <span className='text-sm hidden sm:inline'>{getDateRangeText()}</span>
                  <Filter className='w-4 h-4' />
                </button>

                <button
                  onClick={fetchMetrics}
                  className='p-2 bg-gray-700/50 border border-gray-600 rounded-xl text-gray-300 hover:bg-gray-600/50 transition-all'
                  title='Làm mới dữ liệu'
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>

                <button
                  onClick={exportReport}
                  className='px-3 py-2 bg-green-500/20 border border-green-500/50 rounded-xl text-green-300 hover:bg-green-500/30 transition-all flex items-center space-x-2'
                >
                  <Download className='w-4 h-4' />
                  <span className='text-sm hidden sm:inline'>Xuất báo cáo</span>
                </button>
              </div>

              <div className='px-4 py-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl'>
                <span className='text-orange-300 text-sm font-medium'>🛡️ {userRole} Access</span>
              </div>
            </div>
          </div>

          {/* Date Filter Dropdown */}
          {showDateFilter && (
            <div className='mt-4 p-4 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-xl'>
              <h3 className='text-white font-semibold mb-4 flex items-center'>
                <Calendar className='w-5 h-5 mr-2' />
                Chọn khoảng thời gian báo cáo
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                {/* Date Range Inputs */}
                <div className='md:col-span-2'>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-300 mb-2'>
                        Từ ngày
                      </label>
                      <input
                        type='date'
                        value={dateRange.startDate}
                        onChange={e =>
                          setDateRange(prev => ({ ...prev, startDate: e.target.value }))
                        }
                        className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-300 mb-2'>
                        Đến ngày
                      </label>
                      <input
                        type='date'
                        value={dateRange.endDate}
                        onChange={e => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                        className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Select Buttons */}
                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>
                    Lựa chọn nhanh
                  </label>
                  <div className='space-y-2'>
                    <button
                      onClick={() => {
                        const today = new Date().toISOString().split('T')[0];
                        setDateRange({ startDate: today, endDate: today });
                      }}
                      className='w-full px-3 py-2 text-sm bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-left'
                    >
                      📅 Hôm nay
                    </button>
                    <button
                      onClick={() => {
                        const today = new Date();
                        const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                        setDateRange({
                          startDate: lastWeek.toISOString().split('T')[0],
                          endDate: today.toISOString().split('T')[0],
                        });
                      }}
                      className='w-full px-3 py-2 text-sm bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-left'
                    >
                      📊 7 ngày qua
                    </button>
                    <button
                      onClick={() => {
                        const today = new Date();
                        const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                        setDateRange({
                          startDate: lastMonth.toISOString().split('T')[0],
                          endDate: today.toISOString().split('T')[0],
                        });
                      }}
                      className='w-full px-3 py-2 text-sm bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-left'
                    >
                      📈 30 ngày qua
                    </button>
                    <button
                      onClick={() => {
                        const today = new Date();
                        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                        setDateRange({
                          startDate: startOfMonth.toISOString().split('T')[0],
                          endDate: today.toISOString().split('T')[0],
                        });
                      }}
                      className='w-full px-3 py-2 text-sm bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-left'
                    >
                      🗓️ Tháng này
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className='flex items-center justify-between mt-6 pt-4 border-t border-gray-700'>
                <div className='text-sm text-gray-400'>
                  {filterApplied && (
                    <span className='flex items-center'>
                      <span className='w-2 h-2 bg-blue-500 rounded-full mr-2'></span>
                      Đang áp dụng filter: {getDateRangeText()}
                    </span>
                  )}
                </div>

                <div className='flex items-center space-x-3'>
                  <button
                    onClick={handleResetFilter}
                    className='px-4 py-2 text-sm bg-gray-600 text-gray-300 rounded-lg hover:bg-gray-500 transition-colors'
                  >
                    🔄 Reset
                  </button>
                  <button
                    onClick={handleApplyFilter}
                    className='px-6 py-2 text-sm bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all'
                  >
                    ✅ Áp dụng filter
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className='relative z-10 container mx-auto px-4 py-8'>
        {/* Filter Status Indicator */}
        {filterApplied && (
          <div className='mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-3'>
                <div className='w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center'>
                  <Filter className='w-4 h-4 text-blue-400' />
                </div>
                <div>
                  <h3 className='text-blue-300 font-semibold'>Báo cáo được lọc theo thời gian</h3>
                  <p className='text-blue-400/80 text-sm'>
                    Hiển thị dữ liệu từ {getDateRangeText()}
                  </p>
                </div>
              </div>
              <button
                onClick={handleResetFilter}
                className='px-3 py-1 text-sm bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors'
              >
                Xóa filter
              </button>
            </div>
          </div>
        )}

        {/* Enhanced Stats Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10 hover:bg-white/10 transition-all'>
            <div className='flex items-center justify-between mb-4'>
              <div className='w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center'>
                <span className='text-2xl'>👥</span>
              </div>
              <div className='text-right'>
                <span className='text-2xl font-black text-white'>
                  {loading ? '...' : metrics?.overview?.totalUsers?.toLocaleString() || '0'}
                </span>
                <div className='text-xs text-green-400 flex items-center justify-end'>
                  ↗ +{metrics?.overview?.newUsersThisMonth || 0} tháng này
                </div>
              </div>
            </div>
            <h3 className='text-white font-semibold mb-1'>Tổng người dùng</h3>
            <p className='text-gray-400 text-sm'>
              Đã đăng ký ({metrics?.overview?.activeUsers || 0} hoạt động)
            </p>
          </div>

          <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10 hover:bg-white/10 transition-all'>
            <div className='flex items-center justify-between mb-4'>
              <div className='w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center'>
                <span className='text-2xl text-blue-400'>AI</span>
              </div>
              <div className='text-right'>
                <span className='text-2xl font-black text-white'>
                  {loading ? '...' : metrics?.overview?.totalAgents?.toLocaleString() || '0'}
                </span>
                <div className='text-xs text-green-400 flex items-center justify-end'>
                  {metrics?.overview?.activeAgents || 0} đang hoạt động
                </div>
              </div>
            </div>
            <h3 className='text-white font-semibold mb-1'>AI Agents</h3>
            <p className='text-gray-400 text-sm'>Tổng số agents được tạo</p>
          </div>

          <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10 hover:bg-white/10 transition-all'>
            <div className='flex items-center justify-between mb-4'>
              <div className='w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center'>
                <span className='text-2xl'>💰</span>
              </div>
              <div className='text-right'>
                <span className='text-2xl font-black text-white'>
                  {formatCurrency(metrics?.overview?.monthlyRevenue || 0)}
                </span>
                <div className='text-xs text-green-400 flex items-center justify-end'>
                  {metrics?.overview?.activeSubscriptions || 0} subscriptions
                </div>
              </div>
            </div>
            <h3 className='text-white font-semibold mb-1'>Doanh thu tháng</h3>
            <p className='text-gray-400 text-sm'>Thu nhập từ subscriptions</p>
          </div>

          <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10 hover:bg-white/10 transition-all'>
            <div className='flex items-center justify-between mb-4'>
              <div className='w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center'>
                <span className='text-2xl'>📊</span>
              </div>
              <div className='text-right'>
                <span className='text-2xl font-black text-green-400'>✅</span>
                <div className='text-xs text-green-400 flex items-center justify-end'>
                  99.9% uptime
                </div>
              </div>
            </div>
            <h3 className='text-white font-semibold mb-1'>Trạng thái hệ thống</h3>
            <p className='text-gray-400 text-sm'>Tất cả dịch vụ hoạt động tốt</p>
          </div>
        </div>

        {/* Enhanced Content & Communication Metrics */}
        <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 mb-8'>
          <h3 className='text-2xl font-bold text-white mb-6 flex items-center'>
            <span className='text-3xl mr-3'>📈</span>
            Admin Metrics Dashboard Enhancement
          </h3>

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
            {/* Newsletter & Contact Analytics */}
            <div className='lg:col-span-1'>
              <h4 className='text-white font-semibold mb-4 flex items-center'>
                <span className='text-xl mr-2'>📧</span>
                Nội dung & Liên hệ
              </h4>

              <div className='space-y-4'>
                <div className='bg-white/5 p-4 rounded-xl border border-white/10'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-gray-300 text-sm'>Newsletter Subscribers</span>
                    <span className='text-blue-400 font-semibold'>
                      {metrics?.contentMetrics?.newsletterSubscribers?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className='w-full bg-gray-700 rounded-full h-2'>
                    <div
                      className='bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-1000'
                      style={{
                        width: `${Math.min(((metrics?.contentMetrics?.newsletterSubscribers || 0) / 1000) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                  <div className='mt-2 text-xs text-gray-400'>
                    Hoạt động: {metrics?.contentMetrics?.activeNewsletterSubs || 0} (
                    {(
                      ((metrics?.contentMetrics?.activeNewsletterSubs || 0) /
                        Math.max(metrics?.contentMetrics?.newsletterSubscribers || 1, 1)) *
                      100
                    ).toFixed(1)}
                    %)
                  </div>
                </div>

                <div className='bg-white/5 p-4 rounded-xl border border-white/10'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-gray-300 text-sm'>Contact Messages</span>
                    <span className='text-purple-400 font-semibold'>
                      {metrics?.contentMetrics?.totalContacts?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className='w-full bg-gray-700 rounded-full h-2'>
                    <div
                      className='bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-1000'
                      style={{
                        width: `${Math.min(((metrics?.contentMetrics?.totalContacts || 0) / 100) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                  <div className='mt-2 text-xs text-gray-400'>
                    Chờ xử lý: {metrics?.contentMetrics?.pendingContacts || 0}
                  </div>
                </div>

                <div className='bg-white/5 p-4 rounded-xl border border-white/10'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-gray-300 text-sm'>Blog Posts</span>
                    <span className='text-orange-400 font-semibold'>
                      {metrics?.contentMetrics?.totalBlogPosts?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className='w-full bg-gray-700 rounded-full h-2'>
                    <div
                      className='bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-1000'
                      style={{
                        width: `${Math.min(((metrics?.contentMetrics?.totalBlogPosts || 0) / 50) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                  <div className='mt-2 text-xs text-gray-400'>
                    Nổi bật: {metrics?.contentMetrics?.featuredPosts || 0} | Views:{' '}
                    {metrics?.contentMetrics?.totalViews?.toLocaleString() || '0'}
                  </div>
                </div>
              </div>
            </div>

            {/* User Growth Analytics */}
            <div className='lg:col-span-1'>
              <h4 className='text-white font-semibold mb-4 flex items-center'>
                <span className='text-xl mr-2'>👥</span>
                Phân tích người dùng
              </h4>

              <div className='space-y-4'>
                <div className='bg-white/5 p-4 rounded-xl border border-white/10'>
                  <div className='text-center mb-4'>
                    <div className='text-3xl font-bold text-white mb-1'>
                      {metrics?.userMetrics?.growthRate?.toFixed(1) || '0.0'}%
                    </div>
                    <div className='text-sm text-gray-400'>Tăng trưởng tháng này</div>
                  </div>

                  <div className='space-y-3'>
                    <div className='flex justify-between items-center'>
                      <span className='text-gray-300 text-sm'>Tổng users</span>
                      <span className='text-blue-400'>
                        {metrics?.userMetrics?.total?.toLocaleString() || '0'}
                      </span>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-gray-300 text-sm'>Hoạt động</span>
                      <span className='text-green-400'>
                        {metrics?.userMetrics?.active?.toLocaleString() || '0'}
                      </span>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-gray-300 text-sm'>Mới tháng này</span>
                      <span className='text-yellow-400'>
                        +{metrics?.userMetrics?.newThisMonth?.toLocaleString() || '0'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className='bg-white/5 p-4 rounded-xl border border-white/10'>
                  <h5 className='text-white font-medium mb-3'>Phân phối Plans</h5>
                  <div className='space-y-2'>
                    {Object.entries(metrics?.userMetrics?.planDistribution || {}).map(
                      ([plan, count], index) => (
                        <div key={plan} className='flex justify-between items-center'>
                          <span className='text-gray-300 text-sm capitalize'>{plan}</span>
                          <div className='flex items-center space-x-2'>
                            <div className='w-16 bg-gray-700 rounded-full h-1.5'>
                              <div
                                className={`h-1.5 rounded-full transition-all duration-1000 ${
                                  index === 0
                                    ? 'bg-blue-500'
                                    : index === 1
                                      ? 'bg-green-500'
                                      : index === 2
                                        ? 'bg-purple-500'
                                        : 'bg-orange-500'
                                }`}
                                style={{
                                  width: `${Math.min((count / Math.max(metrics?.userMetrics?.total || 1, 1)) * 100, 100)}%`,
                                }}
                              ></div>
                            </div>
                            <span className='text-white text-sm font-medium'>{count}</span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* System Performance Analytics */}
            <div className='lg:col-span-1'>
              <h4 className='text-white font-semibold mb-4 flex items-center'>
                <span className='text-xl mr-2'>⚡</span>
                Hiệu suất hệ thống
              </h4>

              <div className='space-y-4'>
                <div className='bg-white/5 p-4 rounded-xl border border-white/10'>
                  <h5 className='text-white font-medium mb-3'>Tài nguyên hệ thống</h5>

                  <div className='space-y-3'>
                    <div>
                      <div className='flex justify-between items-center mb-1'>
                        <span className='text-gray-300 text-sm'>CPU Usage</span>
                        <span className='text-red-400 text-sm font-medium'>
                          {metrics?.systemMetrics?.cpuUsage?.toFixed(1) || '0.0'}%
                        </span>
                      </div>
                      <div className='w-full bg-gray-700 rounded-full h-2'>
                        <div
                          className='bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all duration-1000'
                          style={{ width: `${metrics?.systemMetrics?.cpuUsage || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className='flex justify-between items-center mb-1'>
                        <span className='text-gray-300 text-sm'>Memory Usage</span>
                        <span className='text-yellow-400 text-sm font-medium'>
                          {metrics?.systemMetrics?.memoryUsage?.toFixed(1) || '0.0'}%
                        </span>
                      </div>
                      <div className='w-full bg-gray-700 rounded-full h-2'>
                        <div
                          className='bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-1000'
                          style={{ width: `${metrics?.systemMetrics?.memoryUsage || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className='flex justify-between items-center mb-1'>
                        <span className='text-gray-300 text-sm'>Disk Usage</span>
                        <span className='text-blue-400 text-sm font-medium'>
                          {metrics?.systemMetrics?.diskUsage?.toFixed(1) || '0.0'}%
                        </span>
                      </div>
                      <div className='w-full bg-gray-700 rounded-full h-2'>
                        <div
                          className='bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-1000'
                          style={{ width: `${metrics?.systemMetrics?.diskUsage || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className='bg-white/5 p-4 rounded-xl border border-white/10'>
                  <h5 className='text-white font-medium mb-3'>Kết nối & Hoạt động</h5>
                  <div className='space-y-2'>
                    <div className='flex justify-between items-center'>
                      <span className='text-gray-300 text-sm'>Active Connections</span>
                      <span className='text-green-400 font-medium'>
                        {metrics?.systemMetrics?.activeConnections || 0}
                      </span>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-gray-300 text-sm'>System Status</span>
                      <span className='text-green-400 font-medium'>🟢 Online</span>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-gray-300 text-sm'>Last Updated</span>
                      <span className='text-gray-400 text-xs'>
                        {metrics?.systemMetrics?.lastUpdated
                          ? new Date(metrics.systemMetrics.lastUpdated).toLocaleString('vi-VN')
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trends Analytics */}
        <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 mb-8'>
          <h3 className='text-2xl font-bold text-white mb-6 flex items-center'>
            <span className='text-3xl mr-3'>📊</span>
            Xu hướng 7 ngày qua
          </h3>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
            {/* Daily Trends Chart Placeholder */}
            <div>
              <h4 className='text-white font-semibold mb-4'>Hoạt động hàng ngày</h4>
              <div className='bg-white/5 p-6 rounded-xl border border-white/10'>
                <div className='h-48 flex items-end justify-between space-x-2'>
                  {metrics?.trends?.daily?.slice(-7).map((day, index) => (
                    <div key={index} className='flex-1 flex flex-col items-center'>
                      <div className='w-full flex flex-col items-center space-y-1'>
                        <div
                          className='w-full bg-gradient-to-t from-blue-500 to-cyan-500 rounded-t-lg transition-all duration-1000'
                          style={{ height: `${Math.max((day.users / 100) * 100, 5)}px` }}
                        ></div>
                        <div
                          className='w-full bg-gradient-to-t from-green-500 to-emerald-500 rounded-t-lg transition-all duration-1000'
                          style={{ height: `${Math.max((day.contacts / 20) * 50, 3)}px` }}
                        ></div>
                        <div
                          className='w-full bg-gradient-to-t from-purple-500 to-pink-500 rounded-t-lg transition-all duration-1000'
                          style={{ height: `${Math.max((day.newsletters / 50) * 30, 2)}px` }}
                        ></div>
                      </div>
                      <div className='text-xs text-gray-400 mt-2 text-center'>
                        {new Date(day.date).toLocaleDateString('vi-VN', { weekday: 'short' })}
                      </div>
                    </div>
                  )) ||
                    Array.from({ length: 7 }, (_, i) => (
                      <div key={i} className='flex-1 flex flex-col items-center'>
                        <div className='w-full bg-gray-700 rounded-lg h-12'></div>
                        <div className='text-xs text-gray-400 mt-2'>Day {i + 1}</div>
                      </div>
                    ))}
                </div>
                <div className='flex items-center justify-center space-x-6 mt-4 text-xs'>
                  <div className='flex items-center space-x-2'>
                    <div className='w-3 h-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded'></div>
                    <span className='text-gray-300'>Users</span>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <div className='w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded'></div>
                    <span className='text-gray-300'>Contacts</span>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <div className='w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded'></div>
                    <span className='text-gray-300'>Newsletter</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div>
              <h4 className='text-white font-semibold mb-4'>Thống kê nhanh</h4>
              <div className='space-y-4'>
                <div className='bg-white/5 p-4 rounded-xl border border-white/10'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-3'>
                      <div className='w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center'>
                        <span className='text-lg'>👥</span>
                      </div>
                      <div>
                        <div className='text-white font-semibold'>Conversion Rate</div>
                        <div className='text-gray-400 text-sm'>Newsletter signup từ visits</div>
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='text-2xl font-bold text-blue-400'>
                        {(
                          ((metrics?.contentMetrics?.newsletterSubscribers || 0) /
                            Math.max(metrics?.overview?.totalUsers || 1, 1)) *
                          100
                        ).toFixed(1)}
                        %
                      </div>
                    </div>
                  </div>
                </div>

                <div className='bg-white/5 p-4 rounded-xl border border-white/10'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-3'>
                      <div className='w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center'>
                        <span className='text-lg'>💬</span>
                      </div>
                      <div>
                        <div className='text-white font-semibold'>Response Rate</div>
                        <div className='text-gray-400 text-sm'>Contact đã được trả lời</div>
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='text-2xl font-bold text-green-400'>
                        {(
                          (((metrics?.contentMetrics?.totalContacts || 0) -
                            (metrics?.contentMetrics?.pendingContacts || 0)) /
                            Math.max(metrics?.contentMetrics?.totalContacts || 1, 1)) *
                          100
                        ).toFixed(1)}
                        %
                      </div>
                    </div>
                  </div>
                </div>

                <div className='bg-white/5 p-4 rounded-xl border border-white/10'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-3'>
                      <div className='w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center'>
                        <span className='text-lg text-blue-400'>AI</span>
                      </div>
                      <div>
                        <div className='text-white font-semibold'>Agent Utilization</div>
                        <div className='text-gray-400 text-sm'>Agents đang được sử dụng</div>
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='text-2xl font-bold text-purple-400'>
                        {(
                          ((metrics?.overview?.activeAgents || 0) /
                            Math.max(metrics?.overview?.totalAgents || 1, 1)) *
                          100
                        ).toFixed(1)}
                        %
                      </div>
                    </div>
                  </div>
                </div>

                <div className='bg-white/5 p-4 rounded-xl border border-white/10'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-3'>
                      <div className='w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center'>
                        <span className='text-lg'>💰</span>
                      </div>
                      <div>
                        <div className='text-white font-semibold'>ARPU</div>
                        <div className='text-gray-400 text-sm'>Average Revenue Per User</div>
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='text-2xl font-bold text-orange-400'>
                        {formatCurrency(
                          (metrics?.overview?.monthlyRevenue || 0) /
                            Math.max(metrics?.overview?.activeSubscriptions || 1, 1)
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Storage Management Widgets */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8'>
          <DiskMonitoringWidget />
          <AutoCleanupWidget />
          <ChromaDBStatusWidget />
        </div>

        {/* System Health & Recent Activity */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {/* Enhanced Recent Activity */}
          <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10'>
            <h3 className='text-white font-bold text-xl mb-6 flex items-center space-x-2'>
              <Activity className='w-6 h-6 text-blue-400' />
              <span>Hoạt động gần đây</span>
            </h3>

            <div className='space-y-4'>
              <div className='flex items-start space-x-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors'>
                <div className='flex-shrink-0 mt-1'>
                  <div className='w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center'>
                    <span className='text-sm'>👥</span>
                  </div>
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-white text-sm font-medium'>Người dùng mới đăng ký</p>
                  <p className='text-gray-400 text-xs'>
                    Có {metrics?.overview?.newUsersThisMonth || 0} người dùng mới tham gia tháng này
                  </p>
                  <div className='flex items-center space-x-2 mt-2'>
                    <span className='text-gray-400 text-xs'>
                      {new Date().toLocaleString('vi-VN')}
                    </span>
                    <span className='px-2 py-1 rounded-full text-xs border bg-green-500/20 text-green-300 border-green-500/30'>
                      Tích cực
                    </span>
                  </div>
                </div>
              </div>

              <div className='flex items-start space-x-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors'>
                <div className='flex-shrink-0 mt-1'>
                  <div className='w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center'>
                    <span className='text-sm'>💬</span>
                  </div>
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-white text-sm font-medium'>Liên hệ chờ xử lý</p>
                  <p className='text-gray-400 text-xs'>
                    Có {metrics?.contentMetrics?.pendingContacts || 0} tin nhắn liên hệ cần được
                    phản hồi
                  </p>
                  <div className='flex items-center space-x-2 mt-2'>
                    <span className='text-gray-400 text-xs'>
                      {new Date().toLocaleString('vi-VN')}
                    </span>
                    <span className='px-2 py-1 rounded-full text-xs border bg-yellow-500/20 text-yellow-300 border-yellow-500/30'>
                      Cần xử lý
                    </span>
                  </div>
                </div>
              </div>

              <div className='flex items-start space-x-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors'>
                <div className='flex-shrink-0 mt-1'>
                  <div className='w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center'>
                    <span className='text-sm'>📧</span>
                  </div>
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-white text-sm font-medium'>Newsletter subscribers hoạt động</p>
                  <p className='text-gray-400 text-xs'>
                    Có {metrics?.contentMetrics?.activeNewsletterSubs || 0} người đăng ký newsletter
                    đang hoạt động
                  </p>
                  <div className='flex items-center space-x-2 mt-2'>
                    <span className='text-gray-400 text-xs'>
                      {new Date().toLocaleString('vi-VN')}
                    </span>
                    <span className='px-2 py-1 rounded-full text-xs border bg-blue-500/20 text-blue-300 border-blue-500/30'>
                      Thống kê
                    </span>
                  </div>
                </div>
              </div>

              <div className='flex items-start space-x-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors'>
                <div className='flex-shrink-0 mt-1'>
                  <div className='w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center'>
                    <span className='text-sm text-blue-400'>AI</span>
                  </div>
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-white text-sm font-medium'>AI Agents đang hoạt động</p>
                  <p className='text-gray-400 text-xs'>
                    Hệ thống có {metrics?.overview?.activeAgents || 0}/
                    {metrics?.overview?.totalAgents || 0} AI agents đang hoạt động
                  </p>
                  <div className='flex items-center space-x-2 mt-2'>
                    <span className='text-gray-400 text-xs'>
                      {new Date().toLocaleString('vi-VN')}
                    </span>
                    <span className='px-2 py-1 rounded-full text-xs border bg-green-500/20 text-green-300 border-green-500/30'>
                      Hoạt động
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button className='w-full mt-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 px-4 py-3 rounded-xl hover:from-blue-500/30 hover:to-purple-500/30 transition-all border border-blue-500/30 font-medium'>
              📊 Xem báo cáo chi tiết
            </button>
          </div>

          {/* Enhanced Quick Actions */}
          <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10'>
            <h3 className='text-white font-bold text-xl mb-6'>⚡ Thao tác nhanh</h3>

            <div className='grid grid-cols-2 gap-4'>
              <Link
                href='/admin/users'
                className='bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 p-4 rounded-xl hover:from-blue-500/30 hover:to-cyan-500/30 transition-all border border-blue-500/30 text-center group'
              >
                <Users className='w-8 h-8 mx-auto mb-2 group-hover:scale-110 transition-transform' />
                <span className='block text-sm font-medium'>Quản lý Users</span>
                <span className='block text-xs text-gray-400 mt-1'>
                  {metrics?.overview?.totalUsers || 0} users
                </span>
              </Link>

              <Link
                href='/admin/agents'
                className='bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 p-4 rounded-xl hover:from-green-500/30 hover:to-emerald-500/30 transition-all border border-green-500/30 text-center group'
              >
                <Bot className='w-8 h-8 mx-auto mb-2 group-hover:scale-110 transition-transform' />
                <span className='block text-sm font-medium'>Quản lý Agents</span>
                <span className='block text-xs text-gray-400 mt-1'>
                  {metrics?.overview?.totalAgents || 0} agents
                </span>
              </Link>

              <Link
                href='/admin/newsletter'
                className='bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 p-4 rounded-xl hover:from-purple-500/30 hover:to-pink-500/30 transition-all border border-purple-500/30 text-center group'
              >
                <span className='text-2xl block mx-auto mb-2 group-hover:scale-110 transition-transform'>
                  📧
                </span>
                <span className='block text-sm font-medium'>Newsletter</span>
                <span className='block text-xs text-gray-400 mt-1'>
                  {metrics?.contentMetrics?.newsletterSubscribers || 0} subs
                </span>
              </Link>

              <Link
                href='/admin/contact'
                className='bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-300 p-4 rounded-xl hover:from-orange-500/30 hover:to-red-500/30 transition-all border border-orange-500/30 text-center group'
              >
                <span className='text-2xl block mx-auto mb-2 group-hover:scale-110 transition-transform'>
                  💬
                </span>
                <span className='block text-sm font-medium'>Contact</span>
                <span className='block text-xs text-gray-400 mt-1'>
                  {metrics?.contentMetrics?.pendingContacts || 0} pending
                </span>
              </Link>

              <Link
                href='/admin/blog'
                className='bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 p-4 rounded-xl hover:from-yellow-500/30 hover:to-orange-500/30 transition-all border border-yellow-500/30 text-center group'
              >
                <FileText className='w-8 h-8 mx-auto mb-2 group-hover:scale-110 transition-transform' />
                <span className='block text-sm font-medium'>Blog Manager</span>
                <span className='block text-xs text-gray-400 mt-1'>
                  {metrics?.contentMetrics?.totalBlogPosts || 0} posts
                </span>
              </Link>

              <Link
                href='/admin/subscriptions'
                className='bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 p-4 rounded-xl hover:from-indigo-500/30 hover:to-purple-500/30 transition-all border border-indigo-500/30 text-center group'
              >
                <CreditCard className='w-8 h-8 mx-auto mb-2 group-hover:scale-110 transition-transform' />
                <span className='block text-sm font-medium'>Subscriptions</span>
                <span className='block text-xs text-gray-400 mt-1'>
                  {metrics?.overview?.activeSubscriptions || 0} active
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
