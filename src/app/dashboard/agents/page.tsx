'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/ui/DashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StrategySelector, { StrategyConfig } from '@/components/knowledge/StrategySelector';
import AgentConfigurationWizard from '@/components/agents/AgentConfigurationWizard';
import AgentPerformanceDashboard from '@/components/agents/AgentPerformanceDashboard';
import BulkAgentOperations from '@/components/agents/BulkAgentOperations';
import { X, FileText, Lightbulb, Database, Globe, Settings, Plus } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  description?: string;
  prompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  status: string;
  isPublic: boolean;
  knowledgeFiles: string[];
  // Message delay settings
  messageDelayMs?: number;
  enableSmartDelay?: boolean;
  maxDelayMs?: number;
  minDelayMs?: number;
  enableVietnameseMode?: boolean;
  // Auto handover settings
  enableAutoHandover?: boolean;
  handoverTriggers?: {
    negativeSentiment: boolean;
    highPriority: boolean;
    longConversation: boolean;
    technicalIssue: boolean;
    customerRequestsHuman: boolean;
  };
  handoverThresholds?: {
    sentimentThreshold: number;
    messageCountThreshold: number;
    conversationDurationThreshold: number;
  };
  handoverTimeoutMinutes?: number;
  // Google Integration settings
  enableGoogleIntegration?: boolean;
  googleServices?: {
    calendar: boolean;
    gmail: boolean;
    sheets: boolean;
    drive: boolean;
    docs: boolean;
    forms: boolean;
  };
  // Smart Scheduling Assistant settings
  smartSchedulingDuration?: number; // Default duration in minutes
  createdAt: string;
  _count: {
    conversations: number;
  };
  // RAG settings
  enableRAG?: boolean;
  ragSearchType?: 'SEMANTIC' | 'KEYWORD';
  ragThreshold?: number;
  ragMaxDocuments?: number;
  knowledgeStrategy?: 'AUTO' | 'MANUAL';
}

interface Document {
  id: string;
  filename: string;
  size: number;
  type: string;
  uploadedAt: string;
}

interface ApiKey {
  id: string;
  name: string;
  models: string[];
  createdAt: string;
}

interface GoogleAccount {
  id: string;
  email: string;
  name: string;
  picture: string;
  accessToken?: string;
  refreshToken?: string;
  connectedAt: string;
}

interface UserStats {
  usage: {
    percentage: number;
    plan: string;
  };
}

interface AgentFormData {
  name: string;
  description: string;
  prompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  isPublic: boolean;
  knowledgeFiles: string[];
  messageDelayMs: number;
  enableSmartDelay: boolean;
  maxDelayMs: number;
  minDelayMs: number;
  enableVietnameseMode: boolean;
  enableAutoHandover: boolean;
  handoverTriggers: {
    negativeSentiment: boolean;
    highPriority: boolean;
    longConversation: boolean;
    technicalIssue: boolean;
    customerRequestsHuman: boolean;
  };
  handoverThresholds: {
    sentimentThreshold: number;
    messageCountThreshold: number;
    conversationDurationThreshold: number;
  };
  handoverTimeoutMinutes: number;
  enableGoogleIntegration: boolean;
  googleServices: {
    calendar: boolean;
    gmail: boolean;
    sheets: boolean;
    drive: boolean;
    docs: boolean;
    forms: boolean;
  };
  smartSchedulingDuration: number;
}

const defaultFormData: AgentFormData = {
  name: '',
  description: '',
  prompt: '',
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 1000,
  isPublic: false,
  knowledgeFiles: [],
  messageDelayMs: 1000,
  enableSmartDelay: true,
  maxDelayMs: 3000,
  minDelayMs: 500,
  enableVietnameseMode: false,
  enableAutoHandover: false,
  handoverTriggers: {
    negativeSentiment: true,
    highPriority: false,
    longConversation: true,
    technicalIssue: false,
    customerRequestsHuman: true,
  },
  handoverThresholds: {
    sentimentThreshold: 0.3,
    messageCountThreshold: 20,
    conversationDurationThreshold: 30,
  },
  handoverTimeoutMinutes: 5,
  enableGoogleIntegration: false,
  googleServices: {
    calendar: false,
    gmail: false,
    sheets: false,
    drive: false,
    docs: false,
    forms: false,
  },
  smartSchedulingDuration: 30,
};

export default function AgentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [googleAccounts, setGoogleAccounts] = useState<GoogleAccount[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<AgentFormData>(defaultFormData);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [showPromptSuggestion, setShowPromptSuggestion] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [activeTab, setActiveTab] = useState<'agents' | 'performance' | 'bulk'>('agents');
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      loadData();
    }
  }, [status, router]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load agents, documents, api keys, google accounts
      const [agentsRes, docsRes, keysRes, googleRes, statsRes] = await Promise.all([
        fetch('/api/agents'),
        fetch('/api/user/documents'),
        fetch('/api/user/api-keys'),
        fetch('/api/google/accounts'),
        fetch('/api/user/stats'),
      ]);

      if (agentsRes.ok) {
        const agentsData = await agentsRes.json();
        setAgents(agentsData.data || []);
      }

      if (docsRes.ok) {
        const docsData = await docsRes.json();
        setDocuments(docsData.data || []);
      }

      if (keysRes.ok) {
        const keysData = await keysRes.json();
        setApiKeys(keysData.data || []);

        // Extract available models from API keys
        const models = keysData.data?.flatMap((key: ApiKey) => key.models) || [];
        setAvailableModels([...new Set(models)] as string[]);
      }

      if (googleRes.ok) {
        const googleData = await googleRes.json();
        setGoogleAccounts(googleData.data || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success && statsData.data) {
          setUserStats({
            usage: {
              percentage: statsData.data.usage.percentage,
              plan: statsData.data.usage.plan,
            },
          });
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newAgent = await response.json();
        setAgents(prev => [...prev, newAgent]);
        setFormData(defaultFormData);
        setShowCreateForm(false);
        alert('Agent created successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Error creating agent');
      }
    } catch (error) {
      console.error('Error creating agent:', error);
      alert('Error creating agent');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateAgentWizard = async (wizardData: any) => {
    try {
      setCreating(true);

      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wizardData),
      });

      if (response.ok) {
        const newAgent = await response.json();
        setAgents(prev => [...prev, newAgent]);
        setShowWizard(false);
        alert('🎉 Agent created successfully via Wizard!');

        // Optionally redirect to test the new agent
        router.push(`/dashboard/agents/${newAgent.id}/test`);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Error creating agent via wizard');
      }
    } catch (error) {
      console.error('Error creating agent via wizard:', error);
      alert('Error creating agent via wizard');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa agent này?')) return;

    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAgents(prev => prev.filter(agent => agent.id !== agentId));
        alert('Agent đã được xóa thành công!');
      } else {
        alert('Lỗi khi xóa agent');
      }
    } catch (error) {
      console.error('Error deleting agent:', error);
      alert('Lỗi khi xóa agent');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-400';
      case 'INACTIVE':
        return 'text-gray-400';
      case 'TRAINING':
        return 'text-yellow-400';
      case 'ERROR':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return '✅';
      case 'INACTIVE':
        return '⏸️';
      case 'TRAINING':
        return '🔄';
      case 'ERROR':
        return '❌';
      default:
        return '❓';
    }
  };

  const renderCustomRightSection = () => (
    <div className='flex items-center space-x-2 sm:space-x-3 lg:space-x-4'>
      <button
        onClick={() => setShowCreateForm(true)}
        className='flex items-center space-x-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 hover:border-blue-400/50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl transition-all duration-300 hover:from-blue-500/30 hover:to-purple-500/30 relative z-10'
        title='Tạo Agent mới'
      >
        <span className='text-blue-400 text-sm sm:text-base'>🤖</span>
        <span className='text-xs sm:text-sm text-blue-300 font-medium hidden sm:inline'>
          Create Agent
        </span>
      </button>

      <DashboardHeader stats={userStats} />
    </div>
  );

  if (status === 'loading' || loading) {
    return (
      <div className='min-h-screen bg-black text-white'>
        <div className='fixed inset-0 z-0'>
          <div className='absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900'></div>
          <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse'></div>
          <div className='absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000'></div>
        </div>

        <div className='relative z-10 flex items-center justify-center min-h-screen'>
          <div className='text-center'>
            <div className='w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
            <p className='text-white'>Loading agents...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <DashboardLayout
        title={`🤖 AI Agents (${agents.length})`}
        description='Tạo và quản lý các AI agents thông minh của bạn'
        rightSection={renderCustomRightSection()}
      >
        {/* Tab Navigation */}
        <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 mb-8'>
          <div className='flex flex-wrap gap-2'>
            <button
              onClick={() => setActiveTab('agents')}
              className={`px-4 py-2 rounded-xl transition-all duration-300 font-medium ${
                activeTab === 'agents'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className='flex items-center space-x-2'>
                <span>🤖</span>
                <span>Agents</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`px-4 py-2 rounded-xl transition-all duration-300 font-medium ${
                activeTab === 'performance'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className='flex items-center space-x-2'>
                <span>📊</span>
                <span>Performance</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('bulk')}
              className={`px-4 py-2 rounded-xl transition-all duration-300 font-medium ${
                activeTab === 'bulk'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className='flex items-center space-x-2'>
                <span>🔄</span>
                <span>Bulk Operations</span>
              </span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'agents' && (
          <div className='space-y-8'>
            {/* Stats Overview */}
            <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6'>
              <div className='bg-white/5 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/10 hover:border-blue-500/30 transition-all duration-300'>
                <div className='flex items-center justify-between mb-3 sm:mb-4'>
                  <div className='w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl sm:rounded-2xl flex items-center justify-center'>
                    <span className='text-lg sm:text-2xl'>🤖</span>
                  </div>
                  <span className='text-xl sm:text-2xl font-black text-white'>{agents.length}</span>
                </div>
                <h3 className='text-white font-semibold mb-1 text-sm sm:text-base'>Total Agents</h3>
                <p className='text-gray-400 text-xs sm:text-sm'>Active AI assistants</p>
              </div>

              <div className='bg-white/5 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/10 hover:border-green-500/30 transition-all duration-300'>
                <div className='flex items-center justify-between mb-3 sm:mb-4'>
                  <div className='w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl sm:rounded-2xl flex items-center justify-center'>
                    <span className='text-lg sm:text-2xl'>📄</span>
                  </div>
                  <span className='text-xl sm:text-2xl font-black text-white'>
                    {documents.length}
                  </span>
                </div>
                <h3 className='text-white font-semibold mb-1 text-sm sm:text-base'>
                  Knowledge Docs
                </h3>
                <p className='text-gray-400 text-xs sm:text-sm'>Training documents</p>
              </div>

              <div className='bg-white/5 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/10 hover:border-purple-500/30 transition-all duration-300'>
                <div className='flex items-center justify-between mb-3 sm:mb-4'>
                  <div className='w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl sm:rounded-2xl flex items-center justify-center'>
                    <span className='text-lg sm:text-2xl'>🔑</span>
                  </div>
                  <span className='text-xl sm:text-2xl font-black text-white'>
                    {apiKeys.length}
                  </span>
                </div>
                <h3 className='text-white font-semibold mb-1 text-sm sm:text-base'>API Keys</h3>
                <p className='text-gray-400 text-xs sm:text-sm'>Model providers</p>
              </div>

              <div className='bg-white/5 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/10 hover:border-yellow-500/30 transition-all duration-300'>
                <div className='flex items-center justify-between mb-3 sm:mb-4'>
                  <div className='w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl sm:rounded-2xl flex items-center justify-center'>
                    <span className='text-lg sm:text-2xl'>🔗</span>
                  </div>
                  <span className='text-xl sm:text-2xl font-black text-white'>
                    {googleAccounts.length}
                  </span>
                </div>
                <h3 className='text-white font-semibold mb-1 text-sm sm:text-base'>
                  Google Accounts
                </h3>
                <p className='text-gray-400 text-xs sm:text-sm'>Connected services</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10'>
              <div className='flex justify-between items-center mb-6'>
                <h2 className='text-xl font-bold text-white'>Quick Actions</h2>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'>
                <button
                  onClick={() => setShowWizard(true)}
                  className='group bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover:scale-105 shadow-xl border border-blue-500/30'
                >
                  <div className='flex items-center space-x-3 sm:space-x-4'>
                    <div className='w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0'>
                      <span className='text-lg sm:text-2xl'>🧙‍♂️</span>
                    </div>
                    <div className='text-left min-w-0'>
                      <h3 className='font-semibold text-sm sm:text-base'>Wizard Agent</h3>
                      <p className='text-xs sm:text-sm opacity-80 truncate'>
                        Hướng dẫn 10 bước chi tiết
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setShowCreateForm(true)}
                  className='group bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 hover:scale-105 shadow-xl border border-green-500/30'
                >
                  <div className='flex items-center space-x-3 sm:space-x-4'>
                    <div className='w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0'>
                      <span className='text-lg sm:text-2xl'>⚡</span>
                    </div>
                    <div className='text-left min-w-0'>
                      <h3 className='font-semibold text-sm sm:text-base'>Quick Create</h3>
                      <p className='text-xs sm:text-sm opacity-80 truncate'>Tạo nhanh agent</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => router.push('/dashboard/knowledge')}
                  className='group bg-gradient-to-r from-orange-500 to-red-600 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl hover:from-orange-600 hover:to-red-700 transition-all duration-300 hover:scale-105 shadow-xl border border-orange-500/30'
                >
                  <div className='flex items-center space-x-3 sm:space-x-4'>
                    <div className='w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0'>
                      <span className='text-lg sm:text-2xl'>🧠</span>
                    </div>
                    <div className='text-left min-w-0'>
                      <h3 className='font-semibold text-sm sm:text-base'>Knowledge Base</h3>
                      <p className='text-xs sm:text-sm opacity-80 truncate'>Quản lý tài liệu</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => router.push('/dashboard/chat')}
                  className='group bg-gradient-to-r from-purple-500 to-pink-600 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 hover:scale-105 shadow-xl border border-purple-500/30'
                >
                  <div className='flex items-center space-x-3 sm:space-x-4'>
                    <div className='w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0'>
                      <span className='text-lg sm:text-2xl'>💬</span>
                    </div>
                    <div className='text-left min-w-0'>
                      <h3 className='font-semibold text-sm sm:text-base'>Test Chat</h3>
                      <p className='text-xs sm:text-sm opacity-80 truncate'>Chat với agents</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Agents List */}
            <div className='space-y-4'>
              <h2 className='text-2xl font-bold text-white'>Your AI Agents</h2>

              {agents.length === 0 ? (
                <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-12 border border-white/10 text-center'>
                  <div className='w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6'>
                    <span className='text-4xl'>🤖</span>
                  </div>
                  <h3 className='text-xl font-bold text-white mb-2'>Chưa có AI agents</h3>
                  <p className='text-gray-400 mb-6'>Tạo agent đầu tiên để bắt đầu!</p>
                  <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                    <button
                      onClick={() => setShowWizard(true)}
                      className='bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover:scale-105 shadow-xl'
                    >
                      🧙‍♂️ Tạo với Wizard
                    </button>
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className='bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-3 rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 hover:scale-105 shadow-xl'
                    >
                      ⚡ Tạo nhanh
                    </button>
                  </div>
                </div>
              ) : (
                <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6'>
                  {agents.map(agent => (
                    <div
                      key={agent.id}
                      className='bg-white/5 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/10 hover:border-blue-500/30 transition-all duration-300 group'
                    >
                      <div className='flex justify-between items-start mb-3 sm:mb-4'>
                        <div className='flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1'>
                          <div className='w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0'>
                            <span className='text-lg sm:text-2xl'>🤖</span>
                          </div>
                          <div className='min-w-0 flex-1'>
                            <h3 className='text-white font-bold text-base sm:text-lg truncate'>
                              {agent.name}
                            </h3>
                            <div className='flex items-center space-x-1 sm:space-x-2 flex-wrap'>
                              <span
                                className={`text-xs sm:text-sm ${getStatusColor(agent.status)}`}
                              >
                                {getStatusEmoji(agent.status)} {agent.status}
                              </span>
                              {agent.isPublic && (
                                <span className='bg-green-500/20 text-green-400 text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full'>
                                  Public
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className='flex space-x-1 sm:space-x-2 flex-shrink-0'>
                          <button
                            onClick={() => router.push(`/dashboard/agents/${agent.id}/test`)}
                            className='p-1.5 sm:p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg sm:rounded-xl transition-all'
                            title='Test Agent'
                          >
                            <span className='text-sm sm:text-base'>🧪</span>
                          </button>
                          <button
                            onClick={() =>
                              router.push(`/dashboard/agents/${agent.id}/enhanced-test`)
                            }
                            className='p-1.5 sm:p-2 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg sm:rounded-xl transition-all'
                            title='Enhanced Test'
                          >
                            <span className='text-sm sm:text-base'>⚡</span>
                          </button>
                          <button
                            onClick={() => router.push(`/dashboard/agents/${agent.id}/edit`)}
                            className='p-1.5 sm:p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg sm:rounded-xl transition-all'
                            title='Edit'
                          >
                            <span className='text-sm sm:text-base'>✏️</span>
                          </button>
                          <button
                            onClick={() => handleDeleteAgent(agent.id)}
                            className='p-1.5 sm:p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg sm:rounded-xl transition-all'
                            title='Delete'
                          >
                            <span className='text-sm sm:text-base'>🗑️</span>
                          </button>
                        </div>
                      </div>

                      <p className='text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2'>
                        {agent.description || 'No description provided'}
                      </p>

                      <div className='space-y-2 mb-3 sm:mb-4'>
                        <div className='flex items-center justify-between text-xs sm:text-sm'>
                          <span className='text-gray-400'>Model:</span>
                          <span className='text-blue-400 font-medium'>{agent.model}</span>
                        </div>
                        <div className='flex items-center justify-between text-xs sm:text-sm'>
                          <span className='text-gray-400'>Temperature:</span>
                          <span className='text-purple-400 font-medium'>{agent.temperature}</span>
                        </div>
                        <div className='flex items-center justify-between text-xs sm:text-sm'>
                          <span className='text-gray-400'>Max Tokens:</span>
                          <span className='text-green-400 font-medium'>{agent.maxTokens}</span>
                        </div>
                        <div className='flex items-center justify-between text-xs sm:text-sm'>
                          <span className='text-gray-400'>Conversations:</span>
                          <span className='text-yellow-400 font-medium'>
                            {agent._count?.conversations || 0}
                          </span>
                        </div>
                      </div>

                      <div className='flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4'>
                        {agent.knowledgeFiles?.length > 0 && (
                          <div className='flex items-center space-x-1 sm:space-x-2'>
                            <span className='text-xs sm:text-sm'>📚</span>
                            <span className='text-cyan-400 text-xs sm:text-sm'>
                              {agent.knowledgeFiles.length} docs
                            </span>
                          </div>
                        )}

                        {/* RAG Status Badge */}
                        {agent.enableRAG && (
                          <div className='flex items-center space-x-1 sm:space-x-2'>
                            <span className='text-xs sm:text-sm'>🧠</span>
                            <span className='text-green-400 text-xs sm:text-sm'>RAG</span>
                            <span className='text-gray-400 text-xs'>
                              {agent.ragSearchType || 'SEMANTIC'}
                            </span>
                          </div>
                        )}

                        {agent.enableAutoHandover && (
                          <div className='flex items-center space-x-2'>
                            <span className='text-sm'>🤝</span>
                            <span className='text-purple-400 text-sm'>Auto Handover</span>
                          </div>
                        )}

                        {agent.enableGoogleIntegration && (
                          <div className='flex items-center space-x-2'>
                            <span className='text-sm'>🔗</span>
                            <span className='text-blue-400 text-sm'>Google Integration</span>
                          </div>
                        )}
                      </div>

                      {/* RAG Configuration Details */}
                      {agent.enableRAG && (
                        <div className='bg-gray-800/30 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4'>
                          <div className='flex items-center justify-between mb-2'>
                            <span className='text-gray-300 text-xs font-medium'>
                              RAG Configuration
                            </span>
                            <span className='bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full'>
                              Active
                            </span>
                          </div>
                          <div className='grid grid-cols-2 gap-2 text-xs'>
                            <div>
                              <span className='text-gray-400'>Search Type:</span>
                              <span className='text-white ml-1'>
                                {agent.ragSearchType || 'SEMANTIC'}
                              </span>
                            </div>
                            <div>
                              <span className='text-gray-400'>Threshold:</span>
                              <span className='text-white ml-1'>{agent.ragThreshold || 0.7}</span>
                            </div>
                            <div>
                              <span className='text-gray-400'>Max Docs:</span>
                              <span className='text-white ml-1'>{agent.ragMaxDocuments || 5}</span>
                            </div>
                            <div>
                              <span className='text-gray-400'>Strategy:</span>
                              <span className='text-white ml-1'>
                                {agent.knowledgeStrategy || 'AUTO'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className='mt-4 pt-4 border-t border-white/10'>
                        <div className='flex justify-between items-center'>
                          <span className='text-gray-400 text-xs'>
                            Created {new Date(agent.createdAt).toLocaleDateString()}
                          </span>
                          <button
                            onClick={() => router.push(`/dashboard/agents/${agent.id}/test`)}
                            className='bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 text-sm font-medium'
                          >
                            Test Now
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className='mt-8'>
            <AgentPerformanceDashboard />
          </div>
        )}

        {/* Bulk Operations Tab */}
        {activeTab === 'bulk' && (
          <div className='mt-8'>
            <BulkAgentOperations />
          </div>
        )}
      </DashboardLayout>

      {/* Create Agent Form Modal - Outside DashboardLayout */}
      {showCreateForm && (
        <div className='fixed inset-0 bg-black/80 backdrop-blur-md flex items-start justify-center z-[9999] p-2 sm:p-4 overflow-y-auto'>
          <div className='bg-gray-900/95 backdrop-blur-xl rounded-xl p-4 sm:p-6 w-full max-w-4xl my-4 max-h-[90vh] overflow-y-auto'>
            <form onSubmit={handleCreateAgent} className='space-y-6'>
              {/* Header */}
              <div className='flex items-center justify-between mb-6'>
                <div>
                  <h2 className='text-2xl font-bold text-white'>Create New Agent</h2>
                  <p className='text-gray-400 mt-1'>
                    Set up your AI agent with custom configuration
                  </p>
                </div>
                <button
                  type='button'
                  onClick={() => setShowCreateForm(false)}
                  className='text-gray-400 hover:text-white transition-colors'
                >
                  <X className='w-6 h-6' />
                </button>
              </div>

              {/* Form content would go here - truncated for brevity */}
              <div className='text-center py-8'>
                <p className='text-gray-400'>Quick create form implementation would go here...</p>
                <button
                  type='button'
                  onClick={() => {
                    setShowCreateForm(false);
                    setShowWizard(true);
                  }}
                  className='mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors'
                >
                  Use Wizard Instead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Wizard Modal */}
      <AgentConfigurationWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onSave={handleCreateAgentWizard}
        availableDocuments={documents}
        availableModels={availableModels}
        userPlan={(userStats?.usage?.plan as 'TRIAL' | 'BASIC' | 'PRO' | 'ENTERPRISE') || 'TRIAL'}
      />
    </>
  );
}
