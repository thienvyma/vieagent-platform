'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/ui/DashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import LiveManagementTab from '@/components/deployment/LiveManagementTab';

interface UserStats {
  usage: {
    percentage: number;
    plan: string;
  };
}

interface Agent {
  id: string;
  name: string;
  description?: string;
  status: string;
  model: string;
  userId: string;
  createdAt: string;
}

interface HandoverRequest {
  id: string;
  conversationId: string;
  agentName: string;
  customerName: string;
  reason: string;
  status: string;
  priority: string;
  createdAt: string;
  assignedTo?: string;
  resolvedAt?: string;
  notes?: string;
}

type TabType = 'overview' | 'live-management' | 'handover-requests' | 'analytics';

export default function HandoverSystemPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [handovers, setHandovers] = useState<HandoverRequest[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      loadData();
      loadUserStats();
    }
  }, [status, router]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load agents and handovers in parallel
      const [agentsRes, handoversRes] = await Promise.all([
        fetch('/api/agents'),
        fetch('/api/handover'),
      ]);

      if (agentsRes.ok) {
        const agentsData = await agentsRes.json();
        setAgents(agentsData);
      }

      if (handoversRes.ok) {
        const handoversData = await handoversRes.json();
        setHandovers(handoversData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout title='Handover System' description='Loading handover system...'>
        <div className='flex items-center justify-center min-h-[400px]'>
          <div className='text-center'>
            <div className='w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
            <p className='text-white'>Loading handover system...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Tab Navigation
  const TabNavigation = () => (
    <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-2 border border-white/10 mb-8'>
      <div className='flex space-x-2 overflow-x-auto scrollbar-hide'>
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-shrink-0 px-4 py-3 rounded-xl font-medium transition-all ${
            activeTab === 'overview'
              ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className='flex items-center justify-center space-x-2'>
            <span>🏠</span>
            <span>Overview</span>
          </span>
        </button>

        <button
          onClick={() => setActiveTab('live-management')}
          className={`flex-shrink-0 px-4 py-3 rounded-xl font-medium transition-all ${
            activeTab === 'live-management'
              ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className='flex items-center justify-center space-x-2'>
            <span>🔄</span>
            <span>Live Management</span>
          </span>
        </button>

        <button
          onClick={() => setActiveTab('handover-requests')}
          className={`flex-shrink-0 px-4 py-3 rounded-xl font-medium transition-all ${
            activeTab === 'handover-requests'
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className='flex items-center justify-center space-x-2'>
            <span>🤝</span>
            <span>Handover Requests</span>
          </span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-shrink-0 px-4 py-3 rounded-xl font-medium transition-all ${
            activeTab === 'analytics'
              ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className='flex items-center justify-center space-x-2'>
            <span>📊</span>
            <span>Analytics</span>
          </span>
        </button>
      </div>
    </div>
  );

  // Overview Content
  const OverviewContent = () => (
    <>
      {/* Header */}
      <div className='bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-3xl p-8 border border-orange-500/20 mb-8'>
        <div className='text-center'>
          <div className='w-24 h-24 bg-gradient-to-r from-orange-500 to-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6'>
            <span className='text-5xl'>🤝</span>
          </div>
          <h1 className='text-3xl font-bold text-white mb-4'>Handover System</h1>
          <p className='text-orange-200 text-lg'>
            AI to Human handover management và live session control
          </p>
          <div className='mt-4 flex items-center justify-center space-x-3'>
            <span className='bg-green-500/20 text-green-300 px-4 py-2 rounded-full text-sm font-medium border border-green-500/30'>
              ✅ Hoàn thành
            </span>
            <span className='text-gray-400 text-sm'>Auto handover enabled</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
        <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10'>
          <div className='flex items-center space-x-4'>
            <div className='w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center'>
              <span className='text-xl'>🔄</span>
            </div>
            <div>
              <h3 className='text-white font-semibold'>Live Sessions</h3>
              <p className='text-2xl font-bold text-blue-400'>0</p>
            </div>
          </div>
        </div>

        <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10'>
          <div className='flex items-center space-x-4'>
            <div className='w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center'>
              <span className='text-xl'>⏳</span>
            </div>
            <div>
              <h3 className='text-white font-semibold'>Pending Handovers</h3>
              <p className='text-2xl font-bold text-yellow-400'>
                {handovers.filter(h => h.status === 'PENDING').length}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10'>
          <div className='flex items-center space-x-4'>
            <div className='w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center'>
              <span className='text-xl'>✅</span>
            </div>
            <div>
              <h3 className='text-white font-semibold'>Resolved</h3>
              <p className='text-2xl font-bold text-green-400'>
                {handovers.filter(h => h.status === 'RESOLVED').length}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10'>
          <div className='flex items-center space-x-4'>
            <div className='w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center'>
              <span className='text-xl'>📊</span>
            </div>
            <div>
              <h3 className='text-white font-semibold'>Success Rate</h3>
              <p className='text-2xl font-bold text-purple-400'>
                {handovers.length > 0
                  ? Math.round(
                      (handovers.filter(h => h.status === 'RESOLVED').length / handovers.length) *
                        100
                    )
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Overview */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8'>
        {/* Live Management */}
        <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10'>
          <div className='text-center mb-6'>
            <div className='w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4'>
              <span className='text-3xl'>🔄</span>
            </div>
            <h2 className='text-2xl font-bold text-white mb-2'>Live Management</h2>
            <p className='text-blue-200'>Real-time session control và agent switching</p>
          </div>

          <div className='space-y-4'>
            <div className='bg-blue-500/10 border border-blue-500/20 rounded-xl p-4'>
              <h3 className='text-blue-300 font-semibold mb-2'>⚡ Real-time Control</h3>
              <ul className='text-blue-200 text-sm space-y-1'>
                <li>• Live session monitoring</li>
                <li>• Agent switching</li>
                <li>• Performance tracking</li>
              </ul>
            </div>

            <div className='bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4'>
              <h3 className='text-cyan-300 font-semibold mb-2'>Auto Handover</h3>
              <ul className='text-cyan-200 text-sm space-y-1'>
                <li>• Smart escalation triggers</li>
                <li>• Seamless handoff</li>
                <li>• Context preservation</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Handover Analytics */}
        <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10'>
          <div className='text-center mb-6'>
            <div className='w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4'>
              <span className='text-3xl'>📊</span>
            </div>
            <h2 className='text-2xl font-bold text-white mb-2'>Handover Analytics</h2>
            <p className='text-purple-200'>Performance insights và optimization</p>
          </div>

          <div className='space-y-4'>
            <div className='bg-purple-500/10 border border-purple-500/20 rounded-xl p-4'>
              <h3 className='text-purple-300 font-semibold mb-2'>📈 Performance Metrics</h3>
              <ul className='text-purple-200 text-sm space-y-1'>
                <li>• Response time analysis</li>
                <li>• Success rate tracking</li>
                <li>• Agent performance</li>
              </ul>
            </div>

            <div className='bg-pink-500/10 border border-pink-500/20 rounded-xl p-4'>
              <h3 className='text-pink-300 font-semibold mb-2'>🎯 Optimization</h3>
              <ul className='text-pink-200 text-sm space-y-1'>
                <li>• Trigger optimization</li>
                <li>• Workflow improvements</li>
                <li>• Resource allocation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10'>
        <h2 className='text-2xl font-bold text-white mb-6 flex items-center space-x-3'>
          <span className='text-3xl'>⚡</span>
          <span>Quick Actions</span>
        </h2>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <button
            onClick={() => setActiveTab('live-management')}
            className='group bg-gradient-to-r from-blue-500 to-cyan-600 text-white p-6 rounded-2xl hover:from-blue-600 hover:to-cyan-700 transition-all duration-300 hover:scale-105 shadow-xl border border-blue-500/30'
          >
            <div className='flex items-center space-x-4'>
              <div className='w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center'>
                <span className='text-2xl'>🔄</span>
              </div>
              <div className='text-left'>
                <h3 className='font-semibold'>Live Management</h3>
                <p className='text-sm opacity-80'>Monitor active sessions</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('handover-requests')}
            className='group bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 hover:scale-105 shadow-xl border border-green-500/30'
          >
            <div className='flex items-center space-x-4'>
              <div className='w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center'>
                <span className='text-2xl'>🤝</span>
              </div>
              <div className='text-left'>
                <h3 className='font-semibold'>Handover Requests</h3>
                <p className='text-sm opacity-80'>Manage handover queue</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className='group bg-gradient-to-r from-purple-500 to-pink-600 text-white p-6 rounded-2xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 hover:scale-105 shadow-xl border border-purple-500/30'
          >
            <div className='flex items-center space-x-4'>
              <div className='w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center'>
                <span className='text-2xl'>📊</span>
              </div>
              <div className='text-left'>
                <h3 className='font-semibold'>Analytics</h3>
                <p className='text-sm opacity-80'>View performance insights</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </>
  );

  // Handover Requests Content
  const HandoverRequestsContent = () => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'PENDING':
          return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
        case 'IN_PROGRESS':
          return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
        case 'RESOLVED':
          return 'text-green-400 bg-green-500/20 border-green-500/30';
        case 'ESCALATED':
          return 'text-red-400 bg-red-500/20 border-red-500/30';
        default:
          return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
      }
    };

    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'HIGH':
          return 'text-red-400 bg-red-500/20';
        case 'MEDIUM':
          return 'text-yellow-400 bg-yellow-500/20';
        case 'LOW':
          return 'text-green-400 bg-green-500/20';
        default:
          return 'text-gray-400 bg-gray-500/20';
      }
    };

    const filteredHandovers = handovers.filter(handover => {
      if (filter === 'all') return true;
      return handover.status === filter.toUpperCase();
    });

    return (
      <div className='space-y-8'>
        {/* Stats Overview */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
          <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10 hover:border-yellow-500/30 transition-all duration-300'>
            <div className='flex items-center justify-between mb-4'>
              <div className='w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center'>
                <span className='text-2xl'>⏳</span>
              </div>
              <span className='text-2xl font-black text-white'>
                {handovers.filter(h => h.status === 'PENDING').length}
              </span>
            </div>
            <h3 className='text-white font-semibold mb-1'>Pending</h3>
            <p className='text-gray-400 text-sm'>Awaiting assignment</p>
          </div>

          <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10 hover:border-blue-500/30 transition-all duration-300'>
            <div className='flex items-center justify-between mb-4'>
              <div className='w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center'>
                <span className='text-2xl'>⚡</span>
              </div>
              <span className='text-2xl font-black text-white'>
                {handovers.filter(h => h.status === 'IN_PROGRESS').length}
              </span>
            </div>
            <h3 className='text-white font-semibold mb-1'>In Progress</h3>
            <p className='text-gray-400 text-sm'>Being handled</p>
          </div>

          <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10 hover:border-green-500/30 transition-all duration-300'>
            <div className='flex items-center justify-between mb-4'>
              <div className='w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center'>
                <span className='text-2xl'>✅</span>
              </div>
              <span className='text-2xl font-black text-white'>
                {handovers.filter(h => h.status === 'RESOLVED').length}
              </span>
            </div>
            <h3 className='text-white font-semibold mb-1'>Resolved</h3>
            <p className='text-gray-400 text-sm'>Completed successfully</p>
          </div>

          <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10 hover:border-red-500/30 transition-all duration-300'>
            <div className='flex items-center justify-between mb-4'>
              <div className='w-12 h-12 bg-gradient-to-r from-red-500 to-rose-500 rounded-2xl flex items-center justify-center'>
                <span className='text-2xl'>🚨</span>
              </div>
              <span className='text-2xl font-black text-white'>
                {handovers.filter(h => h.status === 'ESCALATED').length}
              </span>
            </div>
            <h3 className='text-white font-semibold mb-1'>Escalated</h3>
            <p className='text-gray-400 text-sm'>Require urgent attention</p>
          </div>
        </div>

        {/* Handover Requests List */}
        <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10'>
          <div className='flex justify-between items-center mb-6'>
            <h3 className='text-xl font-bold text-white'>🔄 Handover Requests</h3>
            <div className='flex items-center space-x-4'>
              <select
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className='px-3 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500'
              >
                <option value='all'>All Status</option>
                <option value='pending'>Pending</option>
                <option value='in_progress'>In Progress</option>
                <option value='resolved'>Resolved</option>
                <option value='escalated'>Escalated</option>
              </select>
              <span className='text-gray-400 text-sm'>
                {filteredHandovers.length} of {handovers.length} requests
              </span>
            </div>
          </div>

          {filteredHandovers.length === 0 ? (
            <div className='text-center py-12'>
              <div className='w-24 h-24 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-orange-500/30'>
                <span className='text-4xl'>🔄</span>
              </div>
              <h3 className='text-xl font-bold text-white mb-2'>
                {filter === 'all' ? 'No handover requests' : `No ${filter} requests`}
              </h3>
              <p className='text-gray-400 mb-6'>
                {filter === 'all'
                  ? 'All AI interactions are running smoothly'
                  : 'Try changing the filter to see other requests'}
              </p>
            </div>
          ) : (
            <div className='space-y-4'>
              {filteredHandovers.map(handover => (
                <div
                  key={handover.id}
                  className='bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-orange-500/30 transition-all'
                >
                  <div className='flex justify-between items-start mb-4'>
                    <div className='flex items-center space-x-4'>
                      <div className='w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center'>
                        <span className='text-2xl'>🔄</span>
                      </div>
                      <div>
                        <h4 className='text-white font-semibold'>{handover.customerName}</h4>
                        <p className='text-gray-400 text-sm'>Agent: {handover.agentName}</p>
                      </div>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(handover.status)}`}
                      >
                        {handover.status}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(handover.priority)}`}
                      >
                        {handover.priority}
                      </span>
                    </div>
                  </div>

                  <div className='mb-4'>
                    <p className='text-white mb-2'>
                      <strong>Reason:</strong> {handover.reason}
                    </p>
                    {handover.notes && (
                      <p className='text-gray-400 text-sm'>
                        <strong>Notes:</strong> {handover.notes}
                      </p>
                    )}
                  </div>

                  <div className='flex justify-between items-center text-sm text-gray-400'>
                    <span>Created: {new Date(handover.createdAt).toLocaleString()}</span>
                    {handover.assignedTo && <span>Assigned to: {handover.assignedTo}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Analytics Content
  const AnalyticsContent = () => (
    <div className='space-y-8'>
      <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10'>
        <h2 className='text-2xl font-bold text-white mb-6 flex items-center space-x-3'>
          <span className='text-3xl'>📊</span>
          <span>Handover Analytics</span>
        </h2>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
          <div className='bg-blue-500/10 border border-blue-500/20 rounded-xl p-6'>
            <h3 className='text-blue-300 font-semibold mb-4'>📈 Performance Metrics</h3>
            <div className='space-y-3'>
              <div className='flex justify-between'>
                <span className='text-blue-200'>Success Rate</span>
                <span className='text-white font-bold'>
                  {handovers.length > 0
                    ? Math.round(
                        (handovers.filter(h => h.status === 'RESOLVED').length / handovers.length) *
                          100
                      )
                    : 0}
                  %
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-blue-200'>Avg Response Time</span>
                <span className='text-white font-bold'>2.3 min</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-blue-200'>Escalation Rate</span>
                <span className='text-white font-bold'>
                  {handovers.length > 0
                    ? Math.round(
                        (handovers.filter(h => h.status === 'ESCALATED').length /
                          handovers.length) *
                          100
                      )
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>

          <div className='bg-green-500/10 border border-green-500/20 rounded-xl p-6'>
            <h3 className='text-green-300 font-semibold mb-4'>🎯 Agent Performance</h3>
            <div className='space-y-3'>
              <div className='flex justify-between'>
                <span className='text-green-200'>Customer Support Bot</span>
                <span className='text-white font-bold'>95%</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-green-200'>Sales Assistant</span>
                <span className='text-white font-bold'>88%</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-green-200'>Technical Support</span>
                <span className='text-white font-bold'>92%</span>
              </div>
            </div>
          </div>

          <div className='bg-purple-500/10 border border-purple-500/20 rounded-xl p-6'>
            <h3 className='text-purple-300 font-semibold mb-4'>📅 Recent Activity</h3>
            <div className='space-y-3'>
              <div className='flex justify-between'>
                <span className='text-purple-200'>Today</span>
                <span className='text-white font-bold'>
                  {
                    handovers.filter(
                      h => new Date(h.createdAt).toDateString() === new Date().toDateString()
                    ).length
                  }
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-purple-200'>This Week</span>
                <span className='text-white font-bold'>
                  {
                    handovers.filter(h => {
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return new Date(h.createdAt) > weekAgo;
                    }).length
                  }
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-purple-200'>This Month</span>
                <span className='text-white font-bold'>
                  {
                    handovers.filter(h => {
                      const monthAgo = new Date();
                      monthAgo.setMonth(monthAgo.getMonth() - 1);
                      return new Date(h.createdAt) > monthAgo;
                    }).length
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className='bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl p-6 border border-indigo-500/20'>
          <h3 className='text-indigo-300 font-semibold mb-4'>🚀 Optimization Suggestions</h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4'>
              <h4 className='text-indigo-200 font-medium mb-2'>⚡ Response Time</h4>
              <p className='text-indigo-100 text-sm'>
                Consider reducing auto-handover threshold for faster escalation
              </p>
            </div>
            <div className='bg-purple-500/10 border border-purple-500/20 rounded-lg p-4'>
              <h4 className='text-purple-200 font-medium mb-2'>🎯 Success Rate</h4>
              <p className='text-purple-100 text-sm'>
                High success rate indicates good agent configuration
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Custom right section with handover controls and header
  const renderCustomRightSection = () => (
    <div className='flex items-center space-x-2 sm:space-x-3 lg:space-x-4'>
      {/* Handover Status Indicator */}
      {handovers.filter(h => h.status === 'PENDING').length > 0 && (
        <div className='flex items-center space-x-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl'>
          <span className='text-orange-400 text-sm sm:text-base'>🔄</span>
          <span className='text-xs sm:text-sm text-orange-300 font-medium hidden sm:inline'>
            {handovers.filter(h => h.status === 'PENDING').length} Pending
          </span>
        </div>
      )}

      {/* Dashboard Header */}
      <DashboardHeader stats={userStats} />
    </div>
  );

  return (
    <DashboardLayout
      title={`🤝 Handover System (${handovers.length} requests)`}
      description='AI to Human handover management và live session control'
      rightSection={renderCustomRightSection()}
    >
      <TabNavigation />

      {activeTab === 'overview' && <OverviewContent />}
      {activeTab === 'live-management' && <LiveManagementTab agents={agents} />}
      {activeTab === 'handover-requests' && <HandoverRequestsContent />}
      {activeTab === 'analytics' && <AnalyticsContent />}
    </DashboardLayout>
  );
}
