'use client';

import { useState } from 'react';

interface Agent {
  id: string;
  name: string;
  description?: string;
  status: string;
  model: string;
  userId: string;
  createdAt: string;
}

interface ZaloIntegrationTabProps {
  agents: Agent[];
}

export default function ZaloIntegrationTab({ agents }: ZaloIntegrationTabProps) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<any>(null);
  const [showCodeModal, setShowCodeModal] = useState(false);

  // Configuration state
  const [config, setConfig] = useState({
    oaId: '',
    accessToken: '',
    appId: '',
    secretKey: '',
    greeting: '',
    quickReplies: ['Tôi cần hỗ trợ', 'Thông tin sản phẩm', 'Liên hệ tư vấn'],
    webhookUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.com'}/webhook/zalo`,
    enableTemplateMessage: true,
    enableQuickReply: true,
    autoResponse: true,
    activeTab: 'config',
  });

  const handleGenerateCode = async (agent: Agent) => {
    setSelectedAgent(agent);
    setConfig(prev => ({
      ...prev,
      greeting: `Xin chào! Tôi là ${agent.name}, trợ lý AI của bạn. Tôi có thể giúp gì cho bạn?`,
    }));
    setShowConfigModal(true);
  };

  const processGeneration = async () => {
    if (!selectedAgent) return;

    try {
      setGenerating(true);

      const response = await fetch('/api/deployment/zalo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          config,
        }),
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      const result = await response.json();
      setGeneratedCode(result.integration);
      setShowConfigModal(false);
      setShowCodeModal(true);
    } catch (error) {
      console.error('Generation error:', error);
      alert('Generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Code copied to clipboard!');
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const addQuickReply = () => {
    setConfig(prev => ({
      ...prev,
      quickReplies: [...prev.quickReplies, ''],
    }));
  };

  const removeQuickReply = (index: number) => {
    setConfig(prev => ({
      ...prev,
      quickReplies: prev.quickReplies.filter((_, i) => i !== index),
    }));
  };

  const updateQuickReply = (index: number, value: string) => {
    setConfig(prev => ({
      ...prev,
      quickReplies: prev.quickReplies.map((item, i) => (i === index ? value : item)),
    }));
  };

  return (
    <div className='space-y-8'>
      <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10'>
        <h2 className='text-2xl font-bold text-white mb-6 flex items-center space-x-3'>
          <span className='text-3xl'>💬</span>
          <span>Zalo OA Integration</span>
        </h2>

        <div className='bg-purple-500/10 border border-purple-500/20 rounded-xl p-6 mb-6 text-center'>
          <div className='text-4xl mb-4'>✅</div>
          <h3 className='text-purple-300 font-semibold mb-2'>Zalo OA Integration Ready!</h3>
          <p className='text-purple-200 text-sm'>
            Generate Zalo Official Account bot với message automation và customer service
            integration.
          </p>
        </div>

        {/* Available Agents */}
        <div className='mb-8'>
          <h3 className='text-xl font-bold text-white mb-4'>
            Select Agent for Zalo Integration ({agents.length})
          </h3>

          {agents.length === 0 ? (
            <div className='bg-gray-500/10 border border-gray-500/20 rounded-xl p-8 text-center'>
              <div className='text-4xl mb-4 text-blue-400'>AI</div>
              <h3 className='text-gray-300 font-semibold mb-2'>No Agents Available</h3>
              <p className='text-gray-400 text-sm mb-4'>
                Create an agent first to use Zalo integration.
              </p>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {agents.map(agent => (
                <div
                  key={agent.id}
                  className='bg-white/5 border border-white/10 rounded-xl p-6 hover:border-purple-500/30 transition-colors'
                >
                  <div className='flex items-start justify-between mb-4'>
                    <div className='w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center'>
                      <span className='text-2xl'>💬</span>
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
                    Model: <span className='text-purple-300'>{agent.model}</span> • Created:{' '}
                    {new Date(agent.createdAt).toLocaleDateString()}
                  </div>

                  <button
                    onClick={() => handleGenerateCode(agent)}
                    className='w-full bg-purple-500/20 text-purple-300 px-4 py-2 rounded-lg hover:bg-purple-500/30 transition-colors border border-purple-500/30'
                  >
                    💬 Configure Zalo OA
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Zalo Features */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='bg-purple-500/10 border border-purple-500/20 rounded-xl p-4'>
            <h3 className='text-purple-300 font-semibold mb-2 flex items-center space-x-2'>
              <span className='text-blue-400'>AI</span>
              <span>Zalo OA Bot</span>
            </h3>
            <p className='text-purple-200 text-sm'>
              Official Account bot với automated responses và conversation management.
            </p>
          </div>

          <div className='bg-green-500/10 border border-green-500/20 rounded-xl p-4'>
            <h3 className='text-green-300 font-semibold mb-2 flex items-center space-x-2'>
              <span>📱</span>
              <span>Message Automation</span>
            </h3>
            <p className='text-green-200 text-sm'>
              Quick replies, template messages, và broadcast capabilities.
            </p>
          </div>

          <div className='bg-blue-500/10 border border-blue-500/20 rounded-xl p-4'>
            <h3 className='text-blue-300 font-semibold mb-2 flex items-center space-x-2'>
              <span>🛒</span>
              <span>Mini App Support</span>
            </h3>
            <p className='text-blue-200 text-sm'>
              Integration với Zalo Mini Apps và e-commerce features.
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Modal */}
      {showConfigModal && selectedAgent && (
        <div className='fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4'>
          <div className='bg-gray-900/90 backdrop-blur-xl rounded-2xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-white/20'>
            <div className='flex justify-between items-center mb-6'>
              <h3 className='text-xl font-bold text-white'>
                Configure Zalo OA: {selectedAgent.name}
              </h3>
              <button
                onClick={() => setShowConfigModal(false)}
                className='text-gray-400 hover:text-white text-2xl'
              >
                ✕
              </button>
            </div>

            <div className='space-y-6'>
              {/* Zalo OA Configuration */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-white font-medium mb-2'>OA ID</label>
                  <input
                    type='text'
                    value={config.oaId}
                    onChange={e => setConfig(prev => ({ ...prev, oaId: e.target.value }))}
                    className='w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white'
                    placeholder='Your Zalo OA ID'
                  />
                </div>

                <div>
                  <label className='block text-white font-medium mb-2'>App ID</label>
                  <input
                    type='text'
                    value={config.appId}
                    onChange={e => setConfig(prev => ({ ...prev, appId: e.target.value }))}
                    className='w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white'
                    placeholder='Your Zalo App ID'
                  />
                </div>
              </div>

              <div>
                <label className='block text-white font-medium mb-2'>Access Token</label>
                <input
                  type='password'
                  value={config.accessToken}
                  onChange={e => setConfig(prev => ({ ...prev, accessToken: e.target.value }))}
                  className='w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white'
                  placeholder='Your Zalo Access Token'
                />
              </div>

              <div>
                <label className='block text-white font-medium mb-2'>Secret Key</label>
                <input
                  type='password'
                  value={config.secretKey}
                  onChange={e => setConfig(prev => ({ ...prev, secretKey: e.target.value }))}
                  className='w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white'
                  placeholder='Your Zalo Secret Key'
                />
              </div>

              <div>
                <label className='block text-white font-medium mb-2'>Webhook URL</label>
                <input
                  type='text'
                  value={config.webhookUrl}
                  onChange={e => setConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
                  className='w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white'
                  placeholder={`${process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.com'}/webhook/zalo`}
                />
              </div>

              <div>
                <label className='block text-white font-medium mb-2'>Greeting Message</label>
                <textarea
                  value={config.greeting}
                  onChange={e => setConfig(prev => ({ ...prev, greeting: e.target.value }))}
                  className='w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white h-20'
                  placeholder='Xin chào! Tôi là trợ lý AI của bạn...'
                />
              </div>

              {/* Quick Replies */}
              <div>
                <div className='flex justify-between items-center mb-2'>
                  <label className='block text-white font-medium'>Quick Replies</label>
                  <button
                    onClick={addQuickReply}
                    className='bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm'
                  >
                    + Add
                  </button>
                </div>
                <div className='space-y-2'>
                  {config.quickReplies.map((reply, index) => (
                    <div key={index} className='flex space-x-2'>
                      <input
                        type='text'
                        value={reply}
                        onChange={e => updateQuickReply(index, e.target.value)}
                        className='flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white'
                        placeholder='Quick reply option...'
                      />
                      <button
                        onClick={() => removeQuickReply(index)}
                        className='bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded'
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feature Toggles */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <label className='flex items-center space-x-3'>
                  <input
                    type='checkbox'
                    checked={config.enableTemplateMessage}
                    onChange={e =>
                      setConfig(prev => ({ ...prev, enableTemplateMessage: e.target.checked }))
                    }
                    className='rounded border-gray-600 bg-gray-800 text-purple-500'
                  />
                  <span className='text-white'>Template Messages</span>
                </label>

                <label className='flex items-center space-x-3'>
                  <input
                    type='checkbox'
                    checked={config.enableQuickReply}
                    onChange={e =>
                      setConfig(prev => ({ ...prev, enableQuickReply: e.target.checked }))
                    }
                    className='rounded border-gray-600 bg-gray-800 text-purple-500'
                  />
                  <span className='text-white'>Quick Replies</span>
                </label>

                <label className='flex items-center space-x-3'>
                  <input
                    type='checkbox'
                    checked={config.autoResponse}
                    onChange={e => setConfig(prev => ({ ...prev, autoResponse: e.target.checked }))}
                    className='rounded border-gray-600 bg-gray-800 text-purple-500'
                  />
                  <span className='text-white'>Auto Response</span>
                </label>
              </div>

              <div className='flex space-x-4 mt-6'>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className='flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors'
                >
                  Cancel
                </button>
                <button
                  onClick={processGeneration}
                  disabled={generating}
                  className='flex-1 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white py-2 rounded-lg transition-colors'
                >
                  {generating ? 'Generating...' : 'Generate Zalo OA Code'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generated Code Modal */}
      {showCodeModal && generatedCode && (
        <div className='fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4'>
          <div className='bg-gray-900/90 backdrop-blur-xl rounded-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-white/20'>
            <div className='flex justify-between items-center mb-6'>
              <h3 className='text-xl font-bold text-white'>Generated Zalo OA Configuration</h3>
              <button
                onClick={() => setShowCodeModal(false)}
                className='text-gray-400 hover:text-white text-2xl'
              >
                ✕
              </button>
            </div>

            <div className='space-y-6'>
              {/* Tab Navigation */}
              <div className='flex space-x-2 mb-4'>
                <button
                  onClick={() => setConfig(prev => ({ ...prev, activeTab: 'config' }))}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    (config as any).activeTab !== 'setup' && (config as any).activeTab !== 'deploy'
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  💬 OA Configuration
                </button>
                <button
                  onClick={() => setConfig(prev => ({ ...prev, activeTab: 'setup' }))}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    (config as any).activeTab === 'setup'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  ⚙️ Setup Commands
                </button>
                <button
                  onClick={() => setConfig(prev => ({ ...prev, activeTab: 'deploy' }))}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    (config as any).activeTab === 'deploy'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  🚀 Deployment Guide
                </button>
              </div>

              {/* OA Configuration */}
              {(!(config as any).activeTab || (config as any).activeTab === 'config') && (
                <div>
                  <div className='flex justify-between items-center mb-3'>
                    <h4 className='text-white font-semibold'>Zalo OA Bot Code</h4>
                    <div className='flex space-x-2'>
                      <button
                        onClick={() => copyToClipboard(generatedCode.zaloConfig)}
                        className='bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm'
                      >
                        Copy
                      </button>
                      <button
                        onClick={() =>
                          downloadFile(
                            generatedCode.zaloConfig,
                            `${selectedAgent?.name}-zalo-oa.js`
                          )
                        }
                        className='bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm'
                      >
                        Download
                      </button>
                    </div>
                  </div>
                  <pre className='bg-black rounded-lg p-4 overflow-x-auto text-sm text-purple-300'>
                    <code>{generatedCode.zaloConfig}</code>
                  </pre>
                </div>
              )}

              {/* Setup Commands */}
              {(config as any).activeTab === 'setup' && (
                <div>
                  <div className='flex justify-between items-center mb-3'>
                    <h4 className='text-white font-semibold'>Zalo OA Setup</h4>
                    <div className='flex space-x-2'>
                      <button
                        onClick={() => copyToClipboard(generatedCode.setupCommands)}
                        className='bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm'
                      >
                        Copy
                      </button>
                      <button
                        onClick={() =>
                          downloadFile(
                            generatedCode.setupCommands,
                            `${selectedAgent?.name}-zalo-setup.sh`
                          )
                        }
                        className='bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm'
                      >
                        Download
                      </button>
                    </div>
                  </div>
                  <pre className='bg-black rounded-lg p-4 overflow-x-auto text-sm text-blue-300'>
                    <code>{generatedCode.setupCommands}</code>
                  </pre>
                </div>
              )}

              {/* Deployment Guide */}
              {(config as any).activeTab === 'deploy' && (
                <div>
                  <div className='flex justify-between items-center mb-3'>
                    <h4 className='text-white font-semibold'>Deployment Guide</h4>
                    <div className='flex space-x-2'>
                      <button
                        onClick={() => copyToClipboard(generatedCode.deploymentGuide)}
                        className='bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm'
                      >
                        Copy
                      </button>
                      <button
                        onClick={() =>
                          downloadFile(
                            generatedCode.deploymentGuide,
                            `${selectedAgent?.name}-zalo-deploy-guide.md`
                          )
                        }
                        className='bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm'
                      >
                        Download
                      </button>
                    </div>
                  </div>
                  <pre className='bg-black rounded-lg p-4 overflow-x-auto text-sm text-green-300'>
                    <code>{generatedCode.deploymentGuide}</code>
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
