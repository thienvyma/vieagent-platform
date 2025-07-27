'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/ui/DashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import AgentExportTab from '@/components/deployment/AgentExportTab';
import PlatformConnectorsTab from '@/components/deployment/PlatformConnectorsTab';
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

interface DeploymentConfig {
  platform: 'facebook' | 'zalo' | 'web' | 'api';
  agentId: string;
  settings: Record<string, any>;
}

type TabType = 'overview' | 'export' | 'connectors';
type PlatformType = 'web' | 'facebook' | 'zalo';

export default function DeploymentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [activePlatform, setActivePlatform] = useState<PlatformType>('web');
  const [deployments, setDeployments] = useState<DeploymentConfig[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      loadAgents();
      loadUserStats();
    }
  }, [status, router]);

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

  const loadAgents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/agents');
      if (response.ok) {
        const agentsData = await response.json();
        setAgents(agentsData);
      }
    } catch (error) {
      console.error('Error loading agents:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout title='Deployment & Integration' description='Đang tải deployment system...'>
        <div className='flex items-center justify-center min-h-[400px]'>
          <div className='text-center'>
            <div className='w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
            <p className='text-white'>Loading deployment system...</p>
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
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className='flex items-center justify-center space-x-2'>
            <span>🏠</span>
            <span>Overview</span>
          </span>
        </button>

        <button
          onClick={() => setActiveTab('export')}
          className={`flex-shrink-0 px-4 py-3 rounded-xl font-medium transition-all ${
            activeTab === 'export'
              ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className='flex items-center justify-center space-x-2'>
            <span>📦</span>
            <span>Agent Export</span>
          </span>
        </button>

        <button
          onClick={() => setActiveTab('connectors')}
          className={`flex-shrink-0 px-4 py-3 rounded-xl font-medium transition-all ${
            activeTab === 'connectors'
              ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className='flex items-center justify-center space-x-2'>
            <span>🌐</span>
            <span>Platform Connectors</span>
          </span>
        </button>
      </div>
    </div>
  );

  // Overview Content
  const OverviewContent = () => (
    <>
      {/* Header */}
      <div className='bg-gradient-to-r from-teal-500/10 to-emerald-500/10 rounded-3xl p-8 border border-teal-500/20 mb-8'>
        <div className='text-center'>
          <div className='w-24 h-24 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6'>
            <span className='text-5xl'>🚀</span>
          </div>
          <h1 className='text-3xl font-bold text-white mb-4'>Phase 7: Deployment & Integration</h1>
          <p className='text-teal-200 text-lg'>
            Hệ thống deployment hoàn chỉnh với platform connectors và live management
          </p>
          <div className='mt-4 flex items-center justify-center space-x-3'>
            <span className='bg-blue-500/20 text-blue-300 px-4 py-2 rounded-full text-sm font-medium border border-blue-500/30'>
              🚧 Đang phát triển
            </span>
            <span className='text-gray-400 text-sm'>Ước tính: 2-3 tuần</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
        <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10'>
          <div className='flex items-center space-x-4'>
            <div className='w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center'>
              <span className='text-xl text-blue-400'>AI</span>
            </div>
            <div>
              <h3 className='text-white font-semibold'>Active Agents</h3>
              <p className='text-2xl font-bold text-blue-400'>{agents.length}</p>
            </div>
          </div>
        </div>

        <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10'>
          <div className='flex items-center space-x-4'>
            <div className='w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center'>
              <span className='text-xl'>🌐</span>
            </div>
            <div>
              <h3 className='text-white font-semibold'>Platform Connectors</h3>
              <p className='text-2xl font-bold text-green-400'>3</p>
            </div>
          </div>
        </div>

        <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10'>
          <div className='flex items-center space-x-4'>
            <div className='w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center'>
              <span className='text-xl'>🔄</span>
            </div>
            <div>
              <h3 className='text-white font-semibold'>Live Sessions</h3>
              <p className='text-2xl font-bold text-orange-400'>0</p>
            </div>
          </div>
        </div>

        <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10'>
          <div className='flex items-center space-x-4'>
            <div className='w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center'>
              <span className='text-xl'>📦</span>
            </div>
            <div>
              <h3 className='text-white font-semibold'>Exported Packages</h3>
              <p className='text-2xl font-bold text-purple-400'>0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Overview */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8'>
        {/* Deployment System */}
        <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10'>
          <div className='text-center mb-6'>
            <div className='w-16 h-16 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4'>
              <span className='text-3xl'>🚀</span>
            </div>
            <h2 className='text-2xl font-bold text-white mb-2'>Deployment System</h2>
            <p className='text-teal-200'>
              Agent export functionality và integration code generation
            </p>
          </div>

          <div className='space-y-4'>
            <div className='bg-teal-500/10 border border-teal-500/20 rounded-xl p-4'>
              <h3 className='text-teal-300 font-semibold mb-2'>📦 Agent Export</h3>
              <ul className='text-teal-200 text-sm space-y-1'>
                <li>• Export trained AI agents as packages</li>
                <li>• Multiple formats (API, SDK, Docker)</li>
                <li>• Include configurations & knowledge</li>
              </ul>
            </div>

            <div className='bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4'>
              <h3 className='text-cyan-300 font-semibold mb-2'>⚙️ Code Generation</h3>
              <ul className='text-cyan-200 text-sm space-y-1'>
                <li>• Auto-generate integration code</li>
                <li>• REST API, GraphQL, WebSocket</li>
                <li>• Environment configurations</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Platform Connectors */}
        <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10'>
          <div className='text-center mb-6'>
            <div className='w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4'>
              <span className='text-3xl'>🌐</span>
            </div>
            <h2 className='text-2xl font-bold text-white mb-2'>Platform Connectors</h2>
            <p className='text-purple-200'>Easy integration với các platform phổ biến</p>
          </div>

          <div className='space-y-4'>
            <div className='bg-purple-500/10 border border-purple-500/20 rounded-xl p-4'>
              <h3 className='text-purple-300 font-semibold mb-2'>📘 Facebook Integration</h3>
              <ul className='text-purple-200 text-sm space-y-1'>
                <li>• Messenger Bot setup</li>
                <li>• Page management</li>
                <li>• Lead generation</li>
              </ul>
            </div>

            <div className='bg-pink-500/10 border border-pink-500/20 rounded-xl p-4'>
              <h3 className='text-pink-300 font-semibold mb-2'>💬 Zalo Integration</h3>
              <ul className='text-pink-200 text-sm space-y-1'>
                <li>• Zalo OA bot</li>
                <li>• Message automation</li>
                <li>• Mini App support</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Development Roadmap */}
      <div className='bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl p-8 border border-indigo-500/20'>
        <h2 className='text-2xl font-bold text-white mb-6 flex items-center space-x-3'>
          <span className='text-3xl'>📋</span>
          <span>Development Roadmap - Phase 7</span>
        </h2>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4'>
            <h3 className='text-indigo-300 font-semibold mb-3'>📅 Tuần 1: Core System</h3>
            <ul className='text-indigo-200 text-sm space-y-1'>
              <li>• Agent export functionality</li>
              <li>• Code generation engine</li>
              <li>• Basic API endpoints</li>
              <li>• Database integration</li>
            </ul>
          </div>

          <div className='bg-purple-500/10 border border-purple-500/20 rounded-xl p-4'>
            <h3 className='text-purple-300 font-semibold mb-3'>🔄 Tuần 2: Live Management</h3>
            <ul className='text-purple-200 text-sm space-y-1'>
              <li>• Real-time switching</li>
              <li>• Human takeover system</li>
              <li>• Session management</li>
              <li>• Performance monitoring</li>
            </ul>
          </div>

          <div className='bg-teal-500/10 border border-teal-500/20 rounded-xl p-4'>
            <h3 className='text-teal-300 font-semibold mb-3'>🚀 Tuần 3: Platform Integration</h3>
            <ul className='text-teal-200 text-sm space-y-1'>
              <li>• Facebook connector</li>
              <li>• Zalo integration</li>
              <li>• Web deployment</li>
              <li>• Testing & optimization</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );

  // Agent Export Content
  const AgentExportContent = () => {
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [exportFormat, setExportFormat] = useState<string>('json');
    const [includeKnowledgeBase, setIncludeKnowledgeBase] = useState(true);
    const [includeConversations, setIncludeConversations] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);

    const handleExport = async (agent: Agent, format: string) => {
      setSelectedAgent(agent);
      setExportFormat(format);
      setShowExportModal(true);
    };

    const processExport = async () => {
      if (!selectedAgent) return;

      try {
        setExporting(true);

        const exportConfig = {
          type: exportFormat,
          includeKnowledgeBase,
          includeConversations,
          compression: false,
        };

        const response = await fetch('/api/deployment/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId: selectedAgent.id,
            format: exportConfig,
          }),
        });

        if (!response.ok) {
          throw new Error('Export failed');
        }

        const result = await response.json();

        // Download the exported file
        const blob = new Blob([result.export.content], {
          type: result.export.mimeType,
        });

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.export.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setShowExportModal(false);
        alert(`Agent "${selectedAgent.name}" exported successfully!`);
      } catch (error) {
        console.error('Export error:', error);
        alert('Export failed. Please try again.');
      } finally {
        setExporting(false);
      }
    };

    return (
      <div className='space-y-8'>
        <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10'>
          <h2 className='text-2xl font-bold text-white mb-6 flex items-center space-x-3'>
            <span className='text-3xl'>📦</span>
            <span>Agent Export System</span>
          </h2>

          <div className='bg-green-500/10 border border-green-500/20 rounded-xl p-6 mb-6 text-center'>
            <div className='text-4xl mb-4'>✅</div>
            <h3 className='text-green-300 font-semibold mb-2'>Export System Ready!</h3>
            <p className='text-green-200 text-sm'>
              Export your AI agents in multiple formats: JSON, API Config, Docker, and SDK.
            </p>
          </div>

          {/* Available Agents */}
          <div className='mb-8'>
            <h3 className='text-xl font-bold text-white mb-4'>
              Available Agents ({agents.length})
            </h3>

            {agents.length === 0 ? (
              <div className='bg-gray-500/10 border border-gray-500/20 rounded-xl p-8 text-center'>
                <div className='text-4xl mb-4 text-blue-400'>AI</div>
                <h3 className='text-gray-300 font-semibold mb-2'>No Agents Available</h3>
                <p className='text-gray-400 text-sm mb-4'>
                  Create an agent first to use the export functionality.
                </p>
                <button
                  onClick={() => router.push('/dashboard/agents')}
                  className='bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors'
                >
                  Create Agent
                </button>
              </div>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {agents.map(agent => (
                  <div
                    key={agent.id}
                    className='bg-white/5 border border-white/10 rounded-xl p-6 hover:border-teal-500/30 transition-colors'
                  >
                    <div className='flex items-start justify-between mb-4'>
                      <div className='w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center'>
                        <span className='text-2xl text-blue-400'>AI</span>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          agent.status === 'ACTIVE'
                            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        }`}
                      >
                        {agent.status}
                      </span>
                    </div>

                    <h4 className='text-white font-semibold mb-2'>{agent.name}</h4>
                    <p className='text-gray-400 text-sm mb-4 line-clamp-2'>
                      {agent.description || 'No description available'}
                    </p>

                    <div className='text-gray-400 text-xs mb-4'>
                      Model: <span className='text-teal-300'>{agent.model}</span> • Created:{' '}
                      {new Date(agent.createdAt).toLocaleDateString()}
                    </div>

                    {/* Export Buttons */}
                    <div className='grid grid-cols-2 gap-2'>
                      <button
                        onClick={() => handleExport(agent, 'json')}
                        className='bg-blue-500/20 text-blue-300 px-3 py-2 rounded-lg text-sm hover:bg-blue-500/30 transition-colors border border-blue-500/30'
                        title='Export as JSON'
                      >
                        📄 JSON
                      </button>
                      <button
                        onClick={() => handleExport(agent, 'api')}
                        className='bg-green-500/20 text-green-300 px-3 py-2 rounded-lg text-sm hover:bg-green-500/30 transition-colors border border-green-500/30'
                        title='Export API Config'
                      >
                        ⚙️ API
                      </button>
                      <button
                        onClick={() => handleExport(agent, 'docker')}
                        className='bg-purple-500/20 text-purple-300 px-3 py-2 rounded-lg text-sm hover:bg-purple-500/30 transition-colors border border-purple-500/30'
                        title='Export Docker Config'
                      >
                        🐳 Docker
                      </button>
                      <button
                        onClick={() => handleExport(agent, 'sdk')}
                        className='bg-orange-500/20 text-orange-300 px-3 py-2 rounded-lg text-sm hover:bg-orange-500/30 transition-colors border border-orange-500/30'
                        title='Export SDK Code'
                      >
                        🔧 SDK
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Export Formats Info */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <div className='bg-blue-500/10 border border-blue-500/20 rounded-xl p-4'>
              <h3 className='text-blue-300 font-semibold mb-2 flex items-center space-x-2'>
                <span>📄</span>
                <span>JSON Export</span>
              </h3>
              <p className='text-blue-200 text-sm'>
                Complete agent configuration with metadata, knowledge base, and sample
                conversations.
              </p>
            </div>

            <div className='bg-green-500/10 border border-green-500/20 rounded-xl p-4'>
              <h3 className='text-green-300 font-semibold mb-2 flex items-center space-x-2'>
                <span>⚙️</span>
                <span>API Config</span>
              </h3>
              <p className='text-green-200 text-sm'>
                Kubernetes-style deployment configuration for API endpoints and services.
              </p>
            </div>

            <div className='bg-purple-500/10 border border-purple-500/20 rounded-xl p-4'>
              <h3 className='text-purple-300 font-semibold mb-2 flex items-center space-x-2'>
                <span>🐳</span>
                <span>Docker Config</span>
              </h3>
              <p className='text-purple-200 text-sm'>
                Dockerfile and container configuration for easy deployment and scaling.
              </p>
            </div>

            <div className='bg-orange-500/10 border border-orange-500/20 rounded-xl p-4'>
              <h3 className='text-orange-300 font-semibold mb-2 flex items-center space-x-2'>
                <span>🔧</span>
                <span>SDK Code</span>
              </h3>
              <p className='text-orange-200 text-sm'>
                JavaScript client library for easy integration into web applications.
              </p>
            </div>
          </div>
        </div>

        {/* Export Modal */}
        {showExportModal && selectedAgent && (
          <div className='fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4'>
            <div className='bg-gray-900/90 backdrop-blur-xl rounded-2xl p-8 w-full max-w-lg border border-white/20'>
              <div className='flex justify-between items-center mb-6'>
                <h3 className='text-xl font-bold text-white'>Export Agent: {selectedAgent.name}</h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className='text-gray-400 hover:text-white text-2xl'
                >
                  ✕
                </button>
              </div>

              <div className='space-y-4'>
                <div>
                  <label className='block text-white font-medium mb-2'>Export Format</label>
                  <select
                    value={exportFormat}
                    onChange={e => setExportFormat(e.target.value)}
                    className='w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white'
                  >
                    <option value='json'>📄 JSON - Complete Configuration</option>
                    <option value='api'>⚙️ API - Deployment Config</option>
                    <option value='docker'>🐳 Docker - Container Config</option>
                    <option value='sdk'>🔧 SDK - JavaScript Client</option>
                  </select>
                </div>

                <div className='space-y-3'>
                  <label className='flex items-center space-x-3'>
                    <input
                      type='checkbox'
                      checked={includeKnowledgeBase}
                      onChange={e => setIncludeKnowledgeBase(e.target.checked)}
                      className='rounded border-gray-600 bg-gray-800 text-teal-500'
                    />
                    <span className='text-white'>Include Knowledge Base</span>
                  </label>

                  <label className='flex items-center space-x-3'>
                    <input
                      type='checkbox'
                      checked={includeConversations}
                      onChange={e => setIncludeConversations(e.target.checked)}
                      className='rounded border-gray-600 bg-gray-800 text-teal-500'
                    />
                    <span className='text-white'>Include Sample Conversations</span>
                  </label>
                </div>

                <div className='flex space-x-4 mt-6'>
                  <button
                    onClick={() => setShowExportModal(false)}
                    className='flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors'
                  >
                    Cancel
                  </button>
                  <button
                    onClick={processExport}
                    disabled={exporting}
                    className='flex-1 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white py-2 rounded-lg transition-colors'
                  >
                    {exporting ? 'Exporting...' : 'Export'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Platform Connectors Content - đã được thay thế bởi PlatformConnectorsTab component

  // Analytics Content
  const AnalyticsContent = () => (
    <div className='space-y-8'>
      <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10'>
        <h2 className='text-2xl font-bold text-white mb-6 flex items-center space-x-3'>
          <span className='text-3xl'>📊</span>
          <span>Deployment Analytics</span>
        </h2>

        <div className='bg-green-500/10 border border-green-500/20 rounded-xl p-6 mb-6 text-center'>
          <div className='text-4xl mb-4'>🚧</div>
          <h3 className='text-green-300 font-semibold mb-2'>Đang phát triển</h3>
          <p className='text-green-200 text-sm'>
            Analytics dashboard cho deployment performance và platform insights.
          </p>
        </div>
      </div>
    </div>
  );

  // Custom right section with deployment actions and header
  const renderCustomRightSection = () => (
    <div className='flex items-center space-x-2 sm:space-x-3 lg:space-x-4'>
      {/* Quick Export Button */}
      {agents.length > 0 && (
        <button
          onClick={() => setActiveTab('export')}
          className='flex items-center space-x-2 bg-gradient-to-r from-teal-500/20 to-emerald-500/20 border border-teal-500/30 hover:border-teal-400/50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl transition-all duration-300 hover:from-teal-500/30 hover:to-emerald-500/30'
          title='Export agents'
        >
          <span className='text-teal-400 text-sm sm:text-base'>📦</span>
          <span className='text-xs sm:text-sm text-teal-300 font-medium hidden sm:inline'>
            Export
          </span>
        </button>
      )}

      {/* Dashboard Header */}
      <DashboardHeader stats={userStats} />
    </div>
  );

  return (
    <DashboardLayout
      title={`🚀 Deployment & Integration (${agents.length} agents)`}
      description='Phase 7: Complete deployment system with platform connectors'
      rightSection={renderCustomRightSection()}
    >
      <TabNavigation />

      {activeTab === 'overview' && <OverviewContent />}
      {activeTab === 'export' && <AgentExportContent />}
      {activeTab === 'connectors' && <PlatformConnectorsTab agents={agents} />}
    </DashboardLayout>
  );
}
