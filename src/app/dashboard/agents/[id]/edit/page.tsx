'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

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
  createdAt: string;
}

interface Document {
  id: string;
  title: string;
  filename: string;
  type: string;
  status: string;
  createdAt: string;
}

interface ApiKey {
  id: string;
  name: string;
  provider: string;
  models: string[];
  isActive: boolean;
}

interface GoogleAccount {
  id: string;
  email: string;
  name: string;
  scopes: string[];
  createdAt: string;
}

interface AgentFormData {
  name: string;
  description: string;
  prompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  knowledgeFiles: string[];
  isPublic: boolean;
  // Message delay settings for Vietnamese patterns
  messageDelayMs: number;
  enableSmartDelay: boolean;
  maxDelayMs: number;
  minDelayMs: number;
  enableVietnameseMode: boolean;
  // Google Integration settings
  enableGoogleIntegration: boolean;
  googleServices: {
    calendar: boolean;
    gmail: boolean;
    sheets: boolean;
    drive: boolean;
    docs: boolean;
    forms: boolean;
  };
}

export default function EditAgentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const agentId = params.id as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [googleAccounts, setGoogleAccounts] = useState<GoogleAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<AgentFormData | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [connectingGoogle, setConnectingGoogle] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      loadData();
    }
  }, [status, router, agentId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load agent, documents, API keys, and Google accounts in parallel
      const [agentRes, documentsRes, apiKeysRes, googleAccountsRes] = await Promise.all([
        fetch(`/api/agents/${agentId}`),
        fetch('/api/user/documents'),
        fetch('/api/user/api-keys'),
        fetch('/api/google/accounts'),
      ]);

      if (agentRes.ok) {
        const agentData = await agentRes.json();
        setAgent(agentData);

        // Set form data with agent data
        setFormData({
          name: agentData.name,
          description: agentData.description || '',
          prompt: agentData.prompt,
          model: agentData.model,
          temperature: agentData.temperature,
          maxTokens: agentData.maxTokens,
          knowledgeFiles: agentData.knowledgeFiles || [],
          isPublic: agentData.isPublic,
          // Delay settings with defaults
          messageDelayMs: agentData.messageDelayMs || 2000,
          enableSmartDelay:
            agentData.enableSmartDelay !== undefined ? agentData.enableSmartDelay : true,
          maxDelayMs: agentData.maxDelayMs || 8000,
          minDelayMs: agentData.minDelayMs || 500,
          enableVietnameseMode:
            agentData.enableVietnameseMode !== undefined ? agentData.enableVietnameseMode : true,
          // Google Integration settings with defaults
          enableGoogleIntegration: agentData.enableGoogleIntegration || false,
          googleServices: agentData.googleServices || {
            calendar: false,
            gmail: false,
            sheets: false,
            drive: false,
            docs: false,
            forms: false,
          },
        });
      } else {
        router.push('/dashboard/agents');
        return;
      }

      if (documentsRes.ok) {
        const documentsData = await documentsRes.json();
        // Handle API response structure: { success: true, data: [...] }
        const documents = Array.isArray(documentsData) ? documentsData : documentsData.data || [];
        setDocuments(documents.filter((doc: Document) => doc.status === 'PROCESSED'));
      }

      if (apiKeysRes.ok) {
        const apiKeysData = await apiKeysRes.json();
        // Handle API response structure: { success: true, data: [...] }
        const apiKeys = Array.isArray(apiKeysData) ? apiKeysData : apiKeysData.data || [];
        setApiKeys(apiKeys.filter((key: ApiKey) => key.isActive));

        // Extract all available models
        const allModels: string[] = [];
        apiKeys
          .filter((key: ApiKey) => key.isActive)
          .forEach((key: ApiKey) => {
            if (key.models) {
              allModels.push(...key.models);
            }
          });

        setAvailableModels([...new Set(allModels)]);
      }

      // Load Google accounts
      if (googleAccountsRes.ok) {
        const googleAccountsData = await googleAccountsRes.json();
        console.log('🔗 Loaded Google accounts:', googleAccountsData);
        setGoogleAccounts(Array.isArray(googleAccountsData) ? googleAccountsData : []);
      } else {
        console.log('🔗 No Google accounts or error loading:', googleAccountsRes.status);
        setGoogleAccounts([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      setConnectingGoogle(true);
      console.log('🔗 Initiating Google connection...');

      const response = await fetch('/api/auth/google/connect');
      const data = await response.json();

      if (data.authUrl) {
        console.log('🔗 Redirecting to Google OAuth...');
        window.location.href = data.authUrl;
      } else {
        console.error('🔗 No auth URL received');
        alert('Lỗi khi kết nối Google. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('🔗 Error connecting to Google:', error);
      alert('Lỗi khi kết nối Google. Vui lòng thử lại.');
    } finally {
      setConnectingGoogle(false);
    }
  };

  const getAvailableGoogleServices = () => {
    if (googleAccounts.length === 0) return [];

    const allScopes = googleAccounts.flatMap(account => account.scopes || []);
    const services = [];

    if (allScopes.some(scope => scope.includes('calendar'))) {
      services.push({ key: 'calendar', name: 'Google Calendar', icon: '📅' });
    }
    if (allScopes.some(scope => scope.includes('gmail'))) {
      services.push({ key: 'gmail', name: 'Gmail', icon: '📧' });
    }
    if (allScopes.some(scope => scope.includes('spreadsheets'))) {
      services.push({ key: 'sheets', name: 'Google Sheets', icon: '📊' });
    }
    if (allScopes.some(scope => scope.includes('drive'))) {
      services.push({ key: 'drive', name: 'Google Drive', icon: '💾' });
    }
    if (allScopes.some(scope => scope.includes('documents'))) {
      services.push({ key: 'docs', name: 'Google Docs', icon: '📝' });
    }
    if (allScopes.some(scope => scope.includes('forms'))) {
      services.push({ key: 'forms', name: 'Google Forms', icon: '📋' });
    }

    return services;
  };

  const handleUpdateAgent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData || !formData.name || !formData.prompt || !formData.model) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    // Validate Google Integration
    if (formData.enableGoogleIntegration && googleAccounts.length === 0) {
      alert('Vui lòng kết nối Google account trước khi bật Google Integration');
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Agent đã được cập nhật thành công!');
        router.push('/dashboard/agents');
      } else {
        const error = await response.json();
        alert(error.error || 'Lỗi khi cập nhật agent');
      }
    } catch (error) {
      console.error('Error updating agent:', error);
      alert('Lỗi khi cập nhật agent');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading || !formData) {
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
            <p className='text-white'>Loading agent...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-black text-white'>
      {/* Background Effects */}
      <div className='fixed inset-0 z-0'>
        <div className='absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900'></div>
        <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse'></div>
        <div className='absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000'></div>
        <div className='absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]'></div>
      </div>

      <div className='relative z-10 container mx-auto px-4 py-8'>
        {/* Header */}
        <div className='flex justify-between items-center mb-8'>
          <div>
            <div className='flex items-center space-x-4 mb-2'>
              <button
                onClick={() => router.push('/dashboard/agents')}
                className='w-12 h-12 bg-gray-800/50 border border-gray-600 rounded-2xl flex items-center justify-center hover:bg-gray-700/50 transition-colors'
              >
                <span className='text-xl'>←</span>
              </button>
              <div className='w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center'>
                <span className='text-2xl'>✏️</span>
              </div>
              <h1 className='text-3xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent'>
                Chỉnh Sửa Agent
              </h1>
            </div>
            <p className='text-gray-400 ml-16'>Cập nhật thông tin và cài đặt cho agent của bạn</p>
          </div>
        </div>

        {/* Edit Form */}
        <div className='bg-gray-900/90 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl'>
          <form onSubmit={handleUpdateAgent} className='space-y-6'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
              {/* Basic Info */}
              <div className='space-y-6'>
                <div className='bg-white/5 rounded-2xl p-6 border border-white/10'>
                  <h3 className='text-lg font-semibold text-white mb-4 flex items-center space-x-2'>
                    <span>🔧</span>
                    <span>Thông Tin Cơ Bản</span>
                  </h3>

                  <div className='space-y-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-300 mb-2'>
                        Tên Agent *
                      </label>
                      <input
                        type='text'
                        value={formData.name}
                        onChange={e =>
                          setFormData(prev => (prev ? { ...prev, name: e.target.value } : null))
                        }
                        className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        placeholder='Ví dụ: Customer Support Assistant'
                        required
                      />
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-300 mb-2'>Mô tả</label>
                      <textarea
                        value={formData.description}
                        onChange={e =>
                          setFormData(prev =>
                            prev ? { ...prev, description: e.target.value } : null
                          )
                        }
                        className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24'
                        placeholder='Mô tả ngắn về chức năng của agent'
                      />
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-300 mb-2'>
                        AI Model *
                      </label>
                      <select
                        value={formData.model}
                        onChange={e =>
                          setFormData(prev => (prev ? { ...prev, model: e.target.value } : null))
                        }
                        className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        required
                      >
                        <option value=''>Chọn AI model</option>
                        {availableModels.map(model => (
                          <option key={model} value={model}>
                            {model}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <label className='block text-sm font-medium text-gray-300 mb-2'>
                          Temperature
                        </label>
                        <input
                          type='number'
                          min='0'
                          max='2'
                          step='0.1'
                          value={formData.temperature}
                          onChange={e =>
                            setFormData(prev =>
                              prev ? { ...prev, temperature: parseFloat(e.target.value) } : null
                            )
                          }
                          className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        />
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-300 mb-2'>
                          Max Tokens
                        </label>
                        <input
                          type='number'
                          min='100'
                          max='4000'
                          value={formData.maxTokens}
                          onChange={e =>
                            setFormData(prev =>
                              prev ? { ...prev, maxTokens: parseInt(e.target.value) } : null
                            )
                          }
                          className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Prompt & Knowledge */}
                <div className='bg-white/5 rounded-2xl p-6 border border-white/10'>
                  <h3 className='text-lg font-semibold text-white mb-4 flex items-center space-x-2'>
                    <span>🧠</span>
                    <span>Tư Duy & Kiến Thức</span>
                  </h3>

                  <div className='space-y-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-300 mb-2'>
                        System Prompt *
                      </label>
                      <textarea
                        value={formData.prompt}
                        onChange={e =>
                          setFormData(prev => (prev ? { ...prev, prompt: e.target.value } : null))
                        }
                        className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-40'
                        placeholder='Định nghĩa vai trò và hành vi của AI agent...'
                        required
                      />
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-300 mb-2'>
                        Knowledge Files ({documents.length} available)
                      </label>
                      <div className='max-h-48 overflow-y-auto bg-gray-800/30 border border-gray-600 rounded-xl p-4'>
                        {documents.length === 0 ? (
                          <p className='text-gray-400 text-sm text-center py-4'>
                            📄 Chưa có knowledge files
                          </p>
                        ) : (
                          <div className='space-y-3'>
                            {documents.map(doc => (
                              <label
                                key={doc.id}
                                className='flex items-center space-x-3 p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer'
                              >
                                <input
                                  type='checkbox'
                                  checked={formData.knowledgeFiles.includes(doc.id)}
                                  onChange={e => {
                                    if (e.target.checked) {
                                      setFormData(prev =>
                                        prev
                                          ? {
                                              ...prev,
                                              knowledgeFiles: [...prev.knowledgeFiles, doc.id],
                                            }
                                          : null
                                      );
                                    } else {
                                      setFormData(prev =>
                                        prev
                                          ? {
                                              ...prev,
                                              knowledgeFiles: prev.knowledgeFiles.filter(
                                                id => id !== doc.id
                                              ),
                                            }
                                          : null
                                      );
                                    }
                                  }}
                                  className='rounded text-blue-500 focus:ring-blue-500 focus:ring-2'
                                />
                                <div className='flex-1'>
                                  <span className='text-white text-sm font-medium'>
                                    {doc.title}
                                  </span>
                                  <div className='text-gray-400 text-xs'>
                                    {doc.type} • {new Date(doc.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className='bg-gray-800/30 rounded-xl p-4'>
                      <label className='flex items-center space-x-3 cursor-pointer'>
                        <input
                          type='checkbox'
                          checked={formData.isPublic}
                          onChange={e =>
                            setFormData(prev =>
                              prev ? { ...prev, isPublic: e.target.checked } : null
                            )
                          }
                          className='rounded text-blue-500 focus:ring-blue-500 focus:ring-2'
                        />
                        <div>
                          <span className='text-white font-medium'>🌐 Công khai Agent</span>
                          <p className='text-gray-400 text-sm'>
                            Cho phép người khác sử dụng agent này
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Google Integration */}
              <div className='bg-white/5 rounded-2xl p-6 border border-white/10'>
                <h3 className='text-lg font-semibold text-white mb-4 flex items-center space-x-2'>
                  <span>🔗</span>
                  <span>Google Integration</span>
                  {googleAccounts.length > 0 && (
                    <span className='bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full'>
                      {googleAccounts.length} tài khoản
                    </span>
                  )}
                </h3>

                {googleAccounts.length === 0 ? (
                  // No Google accounts connected
                  <div className='bg-gray-800/30 rounded-lg p-4'>
                    <div className='text-center py-6'>
                      <div className='w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4'>
                        <span className='text-2xl'>🔗</span>
                      </div>
                      <h4 className='text-white font-medium mb-2'>Chưa kết nối Google</h4>
                      <p className='text-gray-400 text-sm mb-4'>
                        Kết nối Google để agent có thể tương tác với Calendar, Gmail, Sheets...
                      </p>
                      <button
                        type='button'
                        onClick={handleConnectGoogle}
                        disabled={connectingGoogle}
                        className='bg-gradient-to-r from-blue-500 to-green-500 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-green-600 transition-all duration-300 font-medium shadow-lg disabled:opacity-50'
                      >
                        {connectingGoogle ? (
                          <span className='flex items-center space-x-2'>
                            <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                            <span>Đang kết nối...</span>
                          </span>
                        ) : (
                          <span className='flex items-center space-x-2'>
                            <span>🔗</span>
                            <span>Kết nối Google</span>
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  // Google accounts connected
                  <div className='space-y-4'>
                    {/* Connected accounts info */}
                    <div className='bg-green-500/10 border border-green-500/20 rounded-lg p-4'>
                      <div className='flex items-start space-x-3'>
                        <span className='text-green-400 text-lg'>✅</span>
                        <div className='flex-1'>
                          <p className='text-green-300 text-sm font-medium mb-1'>
                            Google đã kết nối thành công
                          </p>
                          <div className='space-y-1'>
                            {googleAccounts.map(account => (
                              <div key={account.id} className='flex items-center space-x-2 text-xs'>
                                <span className='text-green-400'>📧</span>
                                <span className='text-green-200'>{account.email}</span>
                                <span className='text-green-300'>•</span>
                                <span className='text-green-200'>
                                  {account.scopes?.length || 0} permissions
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Google Integration Toggle */}
                    <div className='bg-gray-800/30 rounded-lg p-4'>
                      <div className='flex items-center justify-between mb-4'>
                        <div>
                          <p className='text-white font-medium'>Bật Google Integration</p>
                          <p className='text-gray-400 text-sm'>
                            Cho phép agent sử dụng Google services
                          </p>
                        </div>
                        <label className='relative inline-flex items-center cursor-pointer'>
                          <input
                            type='checkbox'
                            checked={formData.enableGoogleIntegration}
                            onChange={e =>
                              setFormData(prev =>
                                prev ? { ...prev, enableGoogleIntegration: e.target.checked } : null
                              )
                            }
                            className='sr-only peer'
                          />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </div>

                      {formData.enableGoogleIntegration && (
                        <div className='space-y-3'>
                          <h4 className='text-white font-medium text-sm flex items-center space-x-2'>
                            <span>⚙️</span>
                            <span>Chọn Google Services</span>
                          </h4>

                          <div className='grid grid-cols-2 gap-3'>
                            {getAvailableGoogleServices().map(service => (
                              <label
                                key={service.key}
                                className='flex items-center space-x-3 cursor-pointer bg-gray-800/30 rounded-xl p-3 hover:bg-gray-800/50 transition-colors'
                              >
                                <input
                                  type='checkbox'
                                  checked={
                                    formData.googleServices[
                                      service.key as keyof typeof formData.googleServices
                                    ]
                                  }
                                  onChange={e =>
                                    setFormData(prev =>
                                      prev
                                        ? {
                                            ...prev,
                                            googleServices: {
                                              ...prev.googleServices,
                                              [service.key]: e.target.checked,
                                            },
                                          }
                                        : null
                                    )
                                  }
                                  className='rounded text-green-500 focus:ring-green-500 focus:ring-2'
                                />
                                <div className='flex-1'>
                                  <div className='flex items-center space-x-2'>
                                    <span>{service.icon}</span>
                                    <span className='text-white font-medium text-sm'>
                                      {service.name}
                                    </span>
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>

                          {Object.values(formData.googleServices).some(Boolean) && (
                            <div className='bg-blue-500/10 border border-blue-500/20 rounded-lg p-3'>
                              <div className='flex items-start space-x-3'>
                                <span className='text-blue-400 text-lg'>💡</span>
                                <div>
                                  <p className='text-blue-300 text-sm font-medium mb-1'>
                                    Services đã chọn sẽ được tích hợp
                                  </p>
                                  <p className='text-blue-200 text-xs'>
                                    Agent có thể đọc/ghi dữ liệu từ các services này theo
                                    permissions
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Message Delay Settings */}
              <div className='space-y-6'>
                <div className='bg-white/5 rounded-2xl p-6 border border-white/10'>
                  <h3 className='text-lg font-semibold text-white mb-4 flex items-center space-x-2'>
                    <span>⏱️</span>
                    <span>Cài Đặt Thời Gian Trả Lời</span>
                  </h3>

                  <div className='space-y-4'>
                    <div className='bg-blue-500/10 border border-blue-500/20 rounded-xl p-4'>
                      <div className='flex items-start space-x-3'>
                        <span className='text-blue-400 text-lg'>💡</span>
                        <div>
                          <p className='text-blue-300 text-sm font-medium mb-1'>
                            Tối ưu cho người Việt Nam
                          </p>
                          <p className='text-blue-200 text-xs'>
                            Thời gian delay giúp AI đọc và tổng hợp nhiều tin nhắn liên tiếp để hiểu
                            ngữ cảnh tốt hơn
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-300 mb-2'>
                        Thời gian chờ cơ bản (giây)
                      </label>
                      <div className='flex items-center space-x-4'>
                        <input
                          type='range'
                          min='0.5'
                          max='10'
                          step='0.5'
                          value={formData.messageDelayMs / 1000}
                          onChange={e =>
                            setFormData(prev =>
                              prev
                                ? { ...prev, messageDelayMs: parseFloat(e.target.value) * 1000 }
                                : null
                            )
                          }
                          className='flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer'
                        />
                        <div className='flex items-center space-x-2'>
                          <input
                            type='number'
                            min='0.5'
                            max='10'
                            step='0.5'
                            value={formData.messageDelayMs / 1000}
                            onChange={e =>
                              setFormData(prev =>
                                prev
                                  ? { ...prev, messageDelayMs: parseFloat(e.target.value) * 1000 }
                                  : null
                              )
                            }
                            className='w-20 bg-gray-800/50 border border-gray-600 rounded-lg px-2 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                          />
                          <span className='text-gray-400 text-sm'>giây</span>
                        </div>
                      </div>
                      <p className='text-gray-400 text-xs mt-1'>
                        Thời gian AI chờ trước khi trả lời (hiện tại:{' '}
                        {formData.messageDelayMs / 1000} giây)
                      </p>
                    </div>

                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <label className='block text-sm font-medium text-gray-300 mb-2'>
                          Thời gian chờ tối thiểu (giây)
                        </label>
                        <input
                          type='number'
                          min='0.1'
                          max='5'
                          step='0.1'
                          value={formData.minDelayMs / 1000}
                          onChange={e =>
                            setFormData(prev =>
                              prev
                                ? { ...prev, minDelayMs: parseFloat(e.target.value) * 1000 }
                                : null
                            )
                          }
                          className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        />
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-300 mb-2'>
                          Thời gian chờ tối đa (giây)
                        </label>
                        <input
                          type='number'
                          min='5'
                          max='30'
                          step='1'
                          value={formData.maxDelayMs / 1000}
                          onChange={e =>
                            setFormData(prev =>
                              prev
                                ? { ...prev, maxDelayMs: parseFloat(e.target.value) * 1000 }
                                : null
                            )
                          }
                          className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        />
                      </div>
                    </div>

                    <div className='space-y-3'>
                      <label className='flex items-center space-x-3 cursor-pointer bg-gray-800/30 rounded-xl p-4 hover:bg-gray-800/50 transition-colors'>
                        <input
                          type='checkbox'
                          checked={formData.enableSmartDelay}
                          onChange={e =>
                            setFormData(prev =>
                              prev ? { ...prev, enableSmartDelay: e.target.checked } : null
                            )
                          }
                          className='rounded text-blue-500 focus:ring-blue-500 focus:ring-2'
                        />
                        <div className='flex-1'>
                          <span className='text-white font-medium'>🧠 Phát hiện thông minh</span>
                          <p className='text-gray-400 text-sm'>
                            Tự động phát hiện khi người dùng gửi nhiều tin nhắn liên tiếp
                          </p>
                        </div>
                      </label>

                      <label className='flex items-center space-x-3 cursor-pointer bg-gray-800/30 rounded-xl p-4 hover:bg-gray-800/50 transition-colors'>
                        <input
                          type='checkbox'
                          checked={formData.enableVietnameseMode}
                          onChange={e =>
                            setFormData(prev =>
                              prev ? { ...prev, enableVietnameseMode: e.target.checked } : null
                            )
                          }
                          className='rounded text-blue-500 focus:ring-blue-500 focus:ring-2'
                        />
                        <div className='flex-1'>
                          <span className='text-white font-medium'>🇻🇳 Chế độ tiếng Việt</span>
                          <p className='text-gray-400 text-sm'>
                            Tối ưu cho thói quen nhắn tin chia nhỏ của người Việt Nam
                          </p>
                        </div>
                      </label>
                    </div>

                    {formData.enableVietnameseMode && (
                      <div className='bg-green-500/10 border border-green-500/20 rounded-xl p-4'>
                        <div className='flex items-start space-x-3'>
                          <span className='text-green-400 text-lg'>✅</span>
                          <div>
                            <p className='text-green-300 text-sm font-medium mb-1'>
                              Chế độ tiếng Việt đã bật
                            </p>
                            <p className='text-green-200 text-xs'>
                              AI sẽ nhận biết các pattern như &quot;Xin chào&quot;, &quot;Tôi muốn&quot;, &quot;và&quot;, &quot;còn&quot;,
                              &quot;nữa&quot;...
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className='flex justify-between items-center pt-6 border-t border-gray-700'>
              <button
                type='button'
                onClick={() => router.push('/dashboard/agents')}
                className='px-6 py-3 text-gray-400 hover:text-white transition-colors rounded-xl border border-gray-600 hover:border-gray-400'
              >
                Hủy
              </button>
              <button
                type='submit'
                disabled={saving}
                className='bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 font-semibold shadow-lg'
              >
                {saving ? (
                  <span className='flex items-center space-x-2'>
                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                    <span>Đang lưu...</span>
                  </span>
                ) : (
                  <span className='flex items-center space-x-2'>
                    <span>💾</span>
                    <span>Cập Nhật Agent</span>
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
