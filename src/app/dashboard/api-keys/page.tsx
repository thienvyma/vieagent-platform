'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/ui/DashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

interface ApiKey {
  id: string;
  name: string;
  provider: string;
  isActive: boolean;
  lastUsed?: string;
  usageCount: number;
  models?: string;
  rateLimit?: number;
  monthlyUsage: number;
  createdAt: string;
}

interface UserStats {
  usage: {
    percentage: number;
    plan: string;
  };
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    provider: 'openai',
    apiKey: '',
    models: [] as string[],
    rateLimit: 100,
  });
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');

  const providers = [
    { id: 'openai', name: 'OpenAI', models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'] },
    {
      id: 'anthropic',
      name: 'Anthropic',
      models: ['claude-3-haiku', 'claude-3-sonnet', 'claude-3-opus'],
    },
    { id: 'local', name: 'Local Model', models: ['llama2', 'mistral', 'custom'] },
    { id: 'custom', name: 'Custom Provider', models: ['custom-model'] },
  ];

  useEffect(() => {
    fetchApiKeys();
    loadUserStats();
  }, []);

  const fetchApiKeys = async () => {
    try {
      console.log('🔍 DEBUG API Keys Page: Fetching API keys...');
      setLoading(true);

      const response = await fetch('/api/user/api-keys');
      console.log('🔍 DEBUG API Keys Page: Response status:', response.status);

      const data = await response.json();
      console.log('🔍 DEBUG API Keys Page: Response data:', data);

      if (data.success) {
        console.log('✅ DEBUG API Keys Page: Setting', data.data.length, 'API keys');
        setApiKeys(data.data);
      } else {
        console.error('❌ DEBUG API Keys Page: API Error:', data.error);
        setMessage(data.error || 'Failed to fetch API keys');
      }
    } catch (error) {
      console.error('❌ DEBUG API Keys Page: Fetch error:', error);
      setMessage('Network error while fetching API keys');
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

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setMessage('');

    try {
      const response = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          models: formData.models.length > 0 ? formData.models : null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('API key added successfully!');
        setShowCreateForm(false);
        setFormData({ name: '', provider: 'openai', apiKey: '', models: [], rateLimit: 100 });
        fetchApiKeys();
      } else {
        setMessage('Failed to add API key: ' + data.error);
      }
    } catch (error) {
      setMessage('Error adding API key');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    try {
      const response = await fetch(`/api/user/api-keys/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage('API key deleted successfully!');
        fetchApiKeys();
      } else {
        setMessage('Failed to delete API key');
      }
    } catch (error) {
      setMessage('Error deleting API key');
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/user/api-keys/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        fetchApiKeys();
      }
    } catch (error) {
      console.error('Error updating API key:', error);
    }
  };

  const getProviderIcon = (provider: string) => {
    const icons = {
      openai: '🤖',
      anthropic: '🧠',
      local: '💻',
      custom: '⚙️',
    };
    return icons[provider as keyof typeof icons] || '🔑';
  };

  const selectedProvider = providers.find(p => p.id === formData.provider);

  // Custom right section with Add API Key button and header
  const renderCustomRightSection = () => (
    <div className='flex items-center space-x-2 sm:space-x-3 lg:space-x-4'>
      {/* Add API Key Button */}
      <button
        onClick={() => setShowCreateForm(true)}
        className='flex items-center space-x-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 hover:border-yellow-400/50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl transition-all duration-300 hover:from-yellow-500/30 hover:to-orange-500/30'
        title='Thêm API Key mới'
      >
        <span className='text-yellow-400 text-sm sm:text-base'>🔑</span>
        <span className='text-xs sm:text-sm text-yellow-300 font-medium hidden sm:inline'>
          Add Key
        </span>
      </button>

      {/* Dashboard Header */}
      <DashboardHeader stats={userStats} />
    </div>
  );

  return (
    <DashboardLayout
      title={`🔑 API Keys (${apiKeys.length})`}
      description='Quản lý API keys cho các AI models'
      rightSection={renderCustomRightSection()}
    >
      <div className='space-y-8'>
        {message && (
          <div
            className={`p-4 rounded-xl ${
              message.includes('success')
                ? 'bg-green-500/20 border border-green-500/30 text-green-300'
                : 'bg-red-500/20 border border-red-500/30 text-red-300'
            }`}
          >
            {message}
          </div>
        )}

        {/* Stats */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
          <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10'>
            <div className='flex items-center justify-between mb-4'>
              <div className='w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center'>
                <span className='text-2xl'>🔑</span>
              </div>
              <span className='text-2xl font-black text-white'>{apiKeys.length}</span>
            </div>
            <h3 className='text-white font-semibold mb-1'>Total Keys</h3>
            <p className='text-gray-400 text-sm'>API keys registered</p>
          </div>

          <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10'>
            <div className='flex items-center justify-between mb-4'>
              <div className='w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center'>
                <span className='text-2xl'>✅</span>
              </div>
              <span className='text-2xl font-black text-white'>
                {apiKeys.filter(k => k.isActive).length}
              </span>
            </div>
            <h3 className='text-white font-semibold mb-1'>Active Keys</h3>
            <p className='text-gray-400 text-sm'>Currently enabled</p>
          </div>

          <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10'>
            <div className='flex items-center justify-between mb-4'>
              <div className='w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center'>
                <span className='text-2xl'>📊</span>
              </div>
              <span className='text-2xl font-black text-white'>
                {apiKeys.reduce((total, key) => total + key.usageCount, 0)}
              </span>
            </div>
            <h3 className='text-white font-semibold mb-1'>Total Usage</h3>
            <p className='text-gray-400 text-sm'>API calls made</p>
          </div>

          <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10'>
            <div className='flex items-center justify-between mb-4'>
              <div className='w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center'>
                <span className='text-2xl'>💰</span>
              </div>
              <span className='text-2xl font-black text-white'>
                ${apiKeys.reduce((total, key) => total + key.monthlyUsage, 0).toFixed(2)}
              </span>
            </div>
            <h3 className='text-white font-semibold mb-1'>Monthly Cost</h3>
            <p className='text-gray-400 text-sm'>Estimated spend</p>
          </div>
        </div>

        {/* API Keys List */}
        <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10'>
          <h3 className='text-xl font-bold text-white mb-6'>🔑 Your API Keys</h3>

          {loading ? (
            <div className='text-center py-8'>
              <div className='w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
              <p className='text-gray-400'>Loading API keys...</p>
            </div>
          ) : apiKeys.length === 0 ? (
            <div className='text-center py-12'>
              <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <span className='text-2xl text-gray-400'>🔑</span>
              </div>
              <h3 className='text-lg font-semibold text-white mb-2'>No API keys yet</h3>
              <p className='text-gray-400 mb-4'>Add your first API key to start using AI models</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className='bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-6 py-2 rounded-xl hover:from-yellow-700 hover:to-orange-700 transition-all'
              >
                Add First API Key
              </button>
            </div>
          ) : (
            <div className='space-y-4'>
              {apiKeys.map(apiKey => (
                <div
                  key={apiKey.id}
                  className='flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/10'
                >
                  <div className='flex items-center space-x-4'>
                    <div className='w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center'>
                      <span className='text-2xl'>{getProviderIcon(apiKey.provider)}</span>
                    </div>
                    <div>
                      <h4 className='text-white font-semibold'>{apiKey.name}</h4>
                      <p className='text-gray-400 text-sm'>
                        {providers.find(p => p.id === apiKey.provider)?.name || apiKey.provider} •
                        Used {apiKey.usageCount} times • ${apiKey.monthlyUsage.toFixed(2)} this
                        month
                      </p>
                      {apiKey.lastUsed && (
                        <p className='text-gray-500 text-xs'>
                          Last used: {new Date(apiKey.lastUsed).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className='flex items-center space-x-3'>
                    <button
                      onClick={() => toggleActive(apiKey.id, apiKey.isActive)}
                      className={`px-3 py-1 rounded-lg text-sm ${
                        apiKey.isActive
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {apiKey.isActive ? '✅ Active' : '⏸️ Inactive'}
                    </button>
                    <button
                      onClick={() => handleDelete(apiKey.id)}
                      className='p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors'
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create API Key Modal */}
      {showCreateForm && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-gray-900 rounded-2xl p-8 w-full max-w-md border border-gray-700'>
            <h3 className='text-xl font-bold text-white mb-6'>➕ Add New API Key</h3>

            <form onSubmit={handleCreateSubmit} className='space-y-4'>
              <div>
                <label className='block text-gray-300 text-sm font-medium mb-2'>Name</label>
                <input
                  type='text'
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className='w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-500'
                  placeholder='My OpenAI Key'
                  required
                />
              </div>

              <div>
                <label className='block text-gray-300 text-sm font-medium mb-2'>Provider</label>
                <select
                  value={formData.provider}
                  onChange={e => setFormData({ ...formData, provider: e.target.value, models: [] })}
                  className='w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-500'
                >
                  {providers.map(provider => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='block text-gray-300 text-sm font-medium mb-2'>API Key</label>
                <input
                  type='password'
                  value={formData.apiKey}
                  onChange={e => setFormData({ ...formData, apiKey: e.target.value })}
                  className='w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-500'
                  placeholder='sk-...'
                  required
                />
              </div>

              {selectedProvider && (
                <div>
                  <label className='block text-gray-300 text-sm font-medium mb-2'>
                    Models (Optional)
                  </label>
                  <div className='space-y-2'>
                    {selectedProvider.models.map(model => (
                      <label key={model} className='flex items-center space-x-2'>
                        <input
                          type='checkbox'
                          checked={formData.models.includes(model)}
                          onChange={e => {
                            if (e.target.checked) {
                              setFormData({ ...formData, models: [...formData.models, model] });
                            } else {
                              setFormData({
                                ...formData,
                                models: formData.models.filter(m => m !== model),
                              });
                            }
                          }}
                          className='rounded'
                        />
                        <span className='text-gray-300 text-sm'>{model}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className='block text-gray-300 text-sm font-medium mb-2'>
                  Rate Limit (per hour)
                </label>
                <input
                  type='number'
                  value={formData.rateLimit}
                  onChange={e => setFormData({ ...formData, rateLimit: parseInt(e.target.value) })}
                  className='w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-500'
                  min='1'
                  max='10000'
                />
              </div>

              <div className='flex space-x-4 pt-4'>
                <button
                  type='button'
                  onClick={() => setShowCreateForm(false)}
                  className='flex-1 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={creating}
                  className='flex-1 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-xl hover:from-yellow-700 hover:to-orange-700 transition-all disabled:opacity-50'
                >
                  {creating ? 'Adding...' : 'Add Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
