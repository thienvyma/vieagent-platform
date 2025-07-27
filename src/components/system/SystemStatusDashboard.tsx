'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface SystemStatus {
  integrations: Record<
    string,
    {
      name: string;
      status: 'online' | 'offline' | 'degraded';
      lastCheck: string;
      responseTime: number;
      errorRate: number;
      uptime: number;
    }
  >;
  webhooks: Record<
    string,
    {
      name: string;
      status: 'active' | 'inactive' | 'error';
      lastEvent: string;
      eventsToday: number;
      successRate: number;
      lastError?: string;
    }
  >;
  system: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
    uptime: number;
    activeUsers: number;
    totalRequests: number;
    errorRate: number;
  };
  database: {
    status: 'connected' | 'disconnected' | 'slow';
    responseTime: number;
    activeConnections: number;
    totalQueries: number;
    slowQueries: number;
  };
}

export default function SystemStatusDashboard() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedTab, setSelectedTab] = useState<
    'overview' | 'integrations' | 'webhooks' | 'system'
  >('overview');

  // ✅ FIXED Phase 4D True Fix - Fix useEffect return value
  useEffect(() => {
    fetchSystemStatus();

    if (autoRefresh) {
      const interval = setInterval(fetchSystemStatus, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }

    // Return undefined for other cases
    return undefined;
  }, [autoRefresh]);

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/system/status');
      if (!response.ok) {
        throw new Error('Failed to fetch system status');
      }

      const data = await response.json();
      setStatus(data);
      setLastUpdate(new Date().toLocaleString());
    } catch (error) {
      console.error('Error fetching system status:', error);
      toast.error('Failed to fetch system status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'active':
      case 'connected':
        return 'text-green-400 bg-green-400/20';
      case 'degraded':
      case 'slow':
        return 'text-yellow-400 bg-yellow-400/20';
      case 'offline':
      case 'inactive':
      case 'error':
      case 'disconnected':
        return 'text-red-400 bg-red-400/20';
      default:
        return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
      case 'active':
      case 'connected':
        return '✅';
      case 'degraded':
      case 'slow':
        return '⚠️';
      case 'offline':
      case 'inactive':
      case 'error':
      case 'disconnected':
        return '❌';
      default:
        return '❓';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) {
      return `${ms}ms`;
    } else {
      return `${(ms / 1000).toFixed(1)}s`;
    }
  };

  const renderOverviewTab = () => (
    <div className='space-y-6'>
      {/* System Health Overview */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <div className='bg-white/5 rounded-xl p-6 border border-white/10'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-400'>System Status</p>
              <p className='text-2xl font-bold text-green-400'>Healthy</p>
            </div>
            <div className='text-3xl'>🟢</div>
          </div>
        </div>

        <div className='bg-white/5 rounded-xl p-6 border border-white/10'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-400'>Uptime</p>
              <p className='text-2xl font-bold text-white'>
                {status?.system ? formatUptime(status.system.uptime) : 'N/A'}
              </p>
            </div>
            <div className='text-3xl'>⏱️</div>
          </div>
        </div>

        <div className='bg-white/5 rounded-xl p-6 border border-white/10'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-400'>Active Users</p>
              <p className='text-2xl font-bold text-blue-400'>{status?.system?.activeUsers || 0}</p>
            </div>
            <div className='text-3xl'>👥</div>
          </div>
        </div>

        <div className='bg-white/5 rounded-xl p-6 border border-white/10'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-400'>Error Rate</p>
              <p className='text-2xl font-bold text-red-400'>
                {status?.system ? formatPercentage(status.system.errorRate) : 'N/A'}
              </p>
            </div>
            <div className='text-3xl'>📊</div>
          </div>
        </div>
      </div>

      {/* Resource Usage */}
      <div className='bg-white/5 rounded-xl p-6 border border-white/10'>
        <h3 className='text-lg font-semibold text-white mb-4'>Resource Usage</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          <div className='text-center'>
            <div className='text-sm text-gray-400 mb-2'>CPU Usage</div>
            <div className='relative w-16 h-16 mx-auto'>
              <div className='absolute inset-0 rounded-full border-4 border-gray-700'></div>
              <div
                className='absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent'
                style={{ transform: `rotate(${(status?.system?.cpu || 0) * 3.6}deg)` }}
              ></div>
              <div className='absolute inset-0 flex items-center justify-center'>
                <span className='text-white font-bold'>{status?.system?.cpu || 0}%</span>
              </div>
            </div>
          </div>

          <div className='text-center'>
            <div className='text-sm text-gray-400 mb-2'>Memory Usage</div>
            <div className='relative w-16 h-16 mx-auto'>
              <div className='absolute inset-0 rounded-full border-4 border-gray-700'></div>
              <div
                className='absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent'
                style={{ transform: `rotate(${(status?.system?.memory || 0) * 3.6}deg)` }}
              ></div>
              <div className='absolute inset-0 flex items-center justify-center'>
                <span className='text-white font-bold'>{status?.system?.memory || 0}%</span>
              </div>
            </div>
          </div>

          <div className='text-center'>
            <div className='text-sm text-gray-400 mb-2'>Disk Usage</div>
            <div className='relative w-16 h-16 mx-auto'>
              <div className='absolute inset-0 rounded-full border-4 border-gray-700'></div>
              <div
                className='absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent'
                style={{ transform: `rotate(${(status?.system?.disk || 0) * 3.6}deg)` }}
              ></div>
              <div className='absolute inset-0 flex items-center justify-center'>
                <span className='text-white font-bold'>{status?.system?.disk || 0}%</span>
              </div>
            </div>
          </div>

          <div className='text-center'>
            <div className='text-sm text-gray-400 mb-2'>Network Usage</div>
            <div className='relative w-16 h-16 mx-auto'>
              <div className='absolute inset-0 rounded-full border-4 border-gray-700'></div>
              <div
                className='absolute inset-0 rounded-full border-4 border-green-500 border-t-transparent'
                style={{ transform: `rotate(${(status?.system?.network || 0) * 3.6}deg)` }}
              ></div>
              <div className='absolute inset-0 flex items-center justify-center'>
                <span className='text-white font-bold'>{status?.system?.network || 0}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Issues */}
      <div className='bg-white/5 rounded-xl p-6 border border-white/10'>
        <h3 className='text-lg font-semibold text-white mb-4'>Recent Issues</h3>
        <div className='space-y-3'>
          <div className='flex items-center space-x-3 text-sm'>
            <div className='w-2 h-2 bg-yellow-400 rounded-full'></div>
            <span className='text-gray-400'>2 minutes ago</span>
            <span className='text-white'>OpenAI API experiencing slow response times</span>
          </div>
          <div className='flex items-center space-x-3 text-sm'>
            <div className='w-2 h-2 bg-green-400 rounded-full'></div>
            <span className='text-gray-400'>5 minutes ago</span>
            <span className='text-white'>Database connection restored</span>
          </div>
          <div className='flex items-center space-x-3 text-sm'>
            <div className='w-2 h-2 bg-red-400 rounded-full'></div>
            <span className='text-gray-400'>15 minutes ago</span>
            <span className='text-white'>GitHub webhook temporary failure</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderIntegrationsTab = () => (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {status?.integrations &&
          Object.entries(status.integrations).map(([key, integration]) => (
            <div key={key} className='bg-white/5 rounded-xl p-6 border border-white/10'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-semibold text-white'>{integration.name}</h3>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(integration.status)}`}
                >
                  {getStatusIcon(integration.status)} {integration.status}
                </span>
              </div>

              <div className='space-y-3'>
                <div className='flex justify-between'>
                  <span className='text-sm text-gray-400'>Response Time</span>
                  <span className='text-sm text-white'>
                    {formatResponseTime(integration.responseTime)}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-sm text-gray-400'>Error Rate</span>
                  <span className='text-sm text-white'>
                    {formatPercentage(integration.errorRate)}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-sm text-gray-400'>Uptime</span>
                  <span className='text-sm text-white'>{formatPercentage(integration.uptime)}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-sm text-gray-400'>Last Check</span>
                  <span className='text-sm text-white'>
                    {new Date(integration.lastCheck).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );

  const renderWebhooksTab = () => (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {status?.webhooks &&
          Object.entries(status.webhooks).map(([key, webhook]) => (
            <div key={key} className='bg-white/5 rounded-xl p-6 border border-white/10'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-semibold text-white'>{webhook.name}</h3>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(webhook.status)}`}
                >
                  {getStatusIcon(webhook.status)} {webhook.status}
                </span>
              </div>

              <div className='space-y-3'>
                <div className='flex justify-between'>
                  <span className='text-sm text-gray-400'>Events Today</span>
                  <span className='text-sm text-white'>{webhook.eventsToday}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-sm text-gray-400'>Success Rate</span>
                  <span className='text-sm text-white'>
                    {formatPercentage(webhook.successRate)}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-sm text-gray-400'>Last Event</span>
                  <span className='text-sm text-white'>
                    {new Date(webhook.lastEvent).toLocaleTimeString()}
                  </span>
                </div>
                {webhook.lastError && (
                  <div className='mt-3 p-2 bg-red-400/10 rounded border border-red-400/20'>
                    <p className='text-xs text-red-400'>{webhook.lastError}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );

  const renderSystemTab = () => (
    <div className='space-y-6'>
      {/* Database Status */}
      <div className='bg-white/5 rounded-xl p-6 border border-white/10'>
        <h3 className='text-lg font-semibold text-white mb-4'>Database Status</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-white mb-2'>
              {status?.database ? getStatusIcon(status.database.status) : '❓'}
            </div>
            <div className='text-sm text-gray-400'>Status</div>
            <div className='text-white'>{status?.database?.status || 'Unknown'}</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-blue-400 mb-2'>
              {status?.database ? formatResponseTime(status.database.responseTime) : 'N/A'}
            </div>
            <div className='text-sm text-gray-400'>Response Time</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-green-400 mb-2'>
              {status?.database?.activeConnections || 0}
            </div>
            <div className='text-sm text-gray-400'>Active Connections</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-yellow-400 mb-2'>
              {status?.database?.slowQueries || 0}
            </div>
            <div className='text-sm text-gray-400'>Slow Queries</div>
          </div>
        </div>
      </div>

      {/* System Metrics */}
      <div className='bg-white/5 rounded-xl p-6 border border-white/10'>
        <h3 className='text-lg font-semibold text-white mb-4'>System Metrics</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-blue-400 mb-2'>
              {status?.system?.totalRequests || 0}
            </div>
            <div className='text-sm text-gray-400'>Total Requests</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-green-400 mb-2'>
              {status?.system?.activeUsers || 0}
            </div>
            <div className='text-sm text-gray-400'>Active Users</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-red-400 mb-2'>
              {status?.system ? formatPercentage(status.system.errorRate) : 'N/A'}
            </div>
            <div className='text-sm text-gray-400'>Error Rate</div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-900 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-2 border-orange-500 border-t-transparent mx-auto mb-4'></div>
          <p className='text-gray-400'>Loading system status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-900 p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='flex items-center justify-between mb-8'>
          <div>
            <h1 className='text-3xl font-bold text-white'>System Status</h1>
            <p className='text-gray-400 mt-2'>Monitor integrations, webhooks, and system health</p>
          </div>
          <div className='flex items-center space-x-4'>
            <div className='text-sm text-gray-400'>Last updated: {lastUpdate}</div>
            <label className='flex items-center space-x-2'>
              <input
                type='checkbox'
                checked={autoRefresh}
                onChange={e => setAutoRefresh(e.target.checked)}
                className='w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500'
              />
              <span className='text-sm text-gray-400'>Auto-refresh</span>
            </label>
            <button
              onClick={fetchSystemStatus}
              className='bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors'
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className='flex border-b border-white/10 mb-8'>
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'integrations', label: 'Integrations', icon: '🔌' },
            { id: 'webhooks', label: 'Webhooks', icon: '🪝' },
            { id: 'system', label: 'System', icon: '⚙️' },
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
        <div>
          {selectedTab === 'overview' && renderOverviewTab()}
          {selectedTab === 'integrations' && renderIntegrationsTab()}
          {selectedTab === 'webhooks' && renderWebhooksTab()}
          {selectedTab === 'system' && renderSystemTab()}
        </div>
      </div>
    </div>
  );
}
