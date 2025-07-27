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

interface FacebookIntegrationTabProps {
  agents: Agent[];
}

export default function FacebookIntegrationTab({ agents }: FacebookIntegrationTabProps) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<any>(null);
  const [showCodeModal, setShowCodeModal] = useState(false);

  // Configuration state
  const [config, setConfig] = useState({
    pageId: '',
    pageAccessToken: '',
    appSecret: '',
    verifyToken: '',
    greeting: '',
    persistentMenu: true,
    getStartedButton: true,
    iceBreakers: ['What can you help me with?', 'Show me your services', 'Contact information'],
    webhookUrl: 'https://your-domain.com/webhook/facebook',
    enableTypingIndicator: true,
    enableSeenReceipt: true,
    activeTab: 'config',
  });

  const handleGenerateCode = async (agent: Agent) => {
    setSelectedAgent(agent);
    setConfig(prev => ({
      ...prev,
      greeting: `Hi! I'm ${agent.name}, your AI assistant. How can I help you today?`,
    }));
    setShowConfigModal(true);
  };

  const processGeneration = async () => {
    if (!selectedAgent) return;

    try {
      setGenerating(true);

      const response = await fetch('/api/deployment/facebook', {
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

  const addIceBreaker = () => {
    setConfig(prev => ({
      ...prev,
      iceBreakers: [...prev.iceBreakers, ''],
    }));
  };

  const removeIceBreaker = (index: number) => {
    setConfig(prev => ({
      ...prev,
      iceBreakers: prev.iceBreakers.filter((_, i) => i !== index),
    }));
  };

  const updateIceBreaker = (index: number, value: string) => {
    setConfig(prev => ({
      ...prev,
      iceBreakers: prev.iceBreakers.map((item, i) => (i === index ? value : item)),
    }));
  };

  return (
    <div className='space-y-8'>
      <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10'>
        <h2 className='text-2xl font-bold text-white mb-6 flex items-center space-x-3'>
          <span className='text-3xl'>📘</span>
          <span>Facebook Messenger Integration</span>
        </h2>

        <div className='bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 mb-6 text-center'>
          <div className='text-4xl mb-4'>🚧</div>
          <h3 className='text-blue-300 font-semibold mb-2'>Facebook Integration in Development</h3>
          <p className='text-blue-200 text-sm'>
            Generate Facebook Messenger Bot configuration with webhook setup and interactive
            features.
          </p>
        </div>

        {/* Available Agents */}
        <div className='mb-8'>
          <h3 className='text-xl font-bold text-white mb-4'>
            Select Agent for Facebook Integration ({agents.length})
          </h3>

          {agents.length === 0 ? (
            <div className='bg-gray-500/10 border border-gray-500/20 rounded-xl p-8 text-center'>
              <div className='text-4xl mb-4 text-blue-400'>AI</div>
              <h3 className='text-gray-300 font-semibold mb-2'>No Agents Available</h3>
              <p className='text-gray-400 text-sm mb-4'>
                Create an agent first to use Facebook integration.
              </p>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {agents.map(agent => (
                <div
                  key={agent.id}
                  className='bg-white/5 border border-white/10 rounded-xl p-6 hover:border-blue-500/30 transition-colors'
                >
                  <div className='flex items-start justify-between mb-4'>
                    <div className='w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center'>
                      <span className='text-2xl'>📘</span>
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
                    Model: <span className='text-blue-300'>{agent.model}</span> • Created:{' '}
                    {new Date(agent.createdAt).toLocaleDateString()}
                  </div>

                  <button
                    onClick={() => handleGenerateCode(agent)}
                    className='w-full bg-blue-500/20 text-blue-300 px-4 py-2 rounded-lg hover:bg-blue-500/30 transition-colors border border-blue-500/30'
                  >
                    📘 Configure Facebook Bot
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Facebook Features */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='bg-blue-500/10 border border-blue-500/20 rounded-xl p-4'>
            <h3 className='text-blue-300 font-semibold mb-2 flex items-center space-x-2'>
              <span className='text-blue-400'>AI</span>
              <span>Messenger Bot</span>
            </h3>
            <p className='text-blue-200 text-sm'>
              Automated responses, webhook integration, and conversation flow management.
            </p>
          </div>

          <div className='bg-purple-500/10 border border-purple-500/20 rounded-xl p-4'>
            <h3 className='text-purple-300 font-semibold mb-2 flex items-center space-x-2'>
              <span>📄</span>
              <span>Page Management</span>
            </h3>
            <p className='text-purple-200 text-sm'>
              Comment moderation, lead generation forms, and customer service automation.
            </p>
          </div>

          <div className='bg-green-500/10 border border-green-500/20 rounded-xl p-4'>
            <h3 className='text-green-300 font-semibold mb-2 flex items-center space-x-2'>
              <span>📊</span>
              <span>Analytics</span>
            </h3>
            <p className='text-green-200 text-sm'>
              Message analytics, user engagement tracking, and performance insights.
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
                Configure Facebook Bot: {selectedAgent.name}
              </h3>
              <button
                onClick={() => setShowConfigModal(false)}
                className='text-gray-400 hover:text-white text-2xl'
              >
                ✕
              </button>
            </div>

            <div className='space-y-6'>
              {/* Facebook Page Configuration */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-white font-medium mb-2'>Page ID</label>
                  <input
                    type='text'
                    value={config.pageId}
                    onChange={e => setConfig(prev => ({ ...prev, pageId: e.target.value }))}
                    className='w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white'
                    placeholder='Your Facebook Page ID'
                  />
                </div>

                <div>
                  <label className='block text-white font-medium mb-2'>Verify Token</label>
                  <input
                    type='text'
                    value={config.verifyToken}
                    onChange={e => setConfig(prev => ({ ...prev, verifyToken: e.target.value }))}
                    className='w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white'
                    placeholder='Your webhook verify token'
                  />
                </div>
              </div>

              <div>
                <label className='block text-white font-medium mb-2'>Page Access Token</label>
                <input
                  type='password'
                  value={config.pageAccessToken}
                  onChange={e => setConfig(prev => ({ ...prev, pageAccessToken: e.target.value }))}
                  className='w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white'
                  placeholder='Your Page Access Token'
                />
              </div>

              <div>
                <label className='block text-white font-medium mb-2'>App Secret</label>
                <input
                  type='password'
                  value={config.appSecret}
                  onChange={e => setConfig(prev => ({ ...prev, appSecret: e.target.value }))}
                  className='w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white'
                  placeholder='Your Facebook App Secret'
                />
              </div>

              <div>
                <label className='block text-white font-medium mb-2'>Webhook URL</label>
                <input
                  type='text'
                  value={config.webhookUrl}
                  onChange={e => setConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
                  className='w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white'
                  placeholder='https://your-domain.com/webhook/facebook'
                />
              </div>

              <div>
                <label className='block text-white font-medium mb-2'>Greeting Message</label>
                <textarea
                  value={config.greeting}
                  onChange={e => setConfig(prev => ({ ...prev, greeting: e.target.value }))}
                  className='w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white h-20'
                  placeholder="Hi! I'm your AI assistant..."
                />
              </div>

              {/* Ice Breaker Questions */}
              <div>
                <div className='flex justify-between items-center mb-2'>
                  <label className='block text-white font-medium'>Ice Breaker Questions</label>
                  <button
                    onClick={addIceBreaker}
                    className='bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm'
                  >
                    + Add
                  </button>
                </div>
                <div className='space-y-2'>
                  {config.iceBreakers.map((question, index) => (
                    <div key={index} className='flex space-x-2'>
                      <input
                        type='text'
                        value={question}
                        onChange={e => updateIceBreaker(index, e.target.value)}
                        className='flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white'
                        placeholder='Ice breaker question...'
                      />
                      <button
                        onClick={() => removeIceBreaker(index)}
                        className='bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded'
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feature Toggles */}
              <div className='grid grid-cols-2 gap-4'>
                <label className='flex items-center space-x-3'>
                  <input
                    type='checkbox'
                    checked={config.persistentMenu}
                    onChange={e =>
                      setConfig(prev => ({ ...prev, persistentMenu: e.target.checked }))
                    }
                    className='rounded border-gray-600 bg-gray-800 text-blue-500'
                  />
                  <span className='text-white'>Persistent Menu</span>
                </label>

                <label className='flex items-center space-x-3'>
                  <input
                    type='checkbox'
                    checked={config.getStartedButton}
                    onChange={e =>
                      setConfig(prev => ({ ...prev, getStartedButton: e.target.checked }))
                    }
                    className='rounded border-gray-600 bg-gray-800 text-blue-500'
                  />
                  <span className='text-white'>Get Started Button</span>
                </label>

                <label className='flex items-center space-x-3'>
                  <input
                    type='checkbox'
                    checked={config.enableTypingIndicator}
                    onChange={e =>
                      setConfig(prev => ({ ...prev, enableTypingIndicator: e.target.checked }))
                    }
                    className='rounded border-gray-600 bg-gray-800 text-blue-500'
                  />
                  <span className='text-white'>Typing Indicator</span>
                </label>

                <label className='flex items-center space-x-3'>
                  <input
                    type='checkbox'
                    checked={config.enableSeenReceipt}
                    onChange={e =>
                      setConfig(prev => ({ ...prev, enableSeenReceipt: e.target.checked }))
                    }
                    className='rounded border-gray-600 bg-gray-800 text-blue-500'
                  />
                  <span className='text-white'>Seen Receipt</span>
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
                  className='flex-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white py-2 rounded-lg transition-colors'
                >
                  {generating ? 'Generating...' : 'Generate Bot Code'}
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
              <h3 className='text-xl font-bold text-white'>Generated Facebook Bot Configuration</h3>
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
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Bot Configuration
                </button>
                <button
                  onClick={() => setConfig(prev => ({ ...prev, activeTab: 'setup' }))}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    (config as any).activeTab === 'setup'
                      ? 'bg-purple-500 text-white'
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

              {/* Bot Configuration */}
              {(config as any).activeTab !== 'setup' && (config as any).activeTab !== 'deploy' && (
                <div>
                  <div className='flex justify-between items-center mb-3'>
                    <h4 className='text-white font-semibold'>Messenger Bot Code</h4>
                    <div className='flex space-x-2'>
                      <button
                        onClick={() => copyToClipboard(generatedCode.messengerConfig)}
                        className='bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm'
                      >
                        Copy
                      </button>
                      <button
                        onClick={() =>
                          downloadFile(
                            generatedCode.messengerConfig,
                            `${selectedAgent?.name}-facebook-bot.js`
                          )
                        }
                        className='bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm'
                      >
                        Download
                      </button>
                    </div>
                  </div>
                  <pre className='bg-black rounded-lg p-4 overflow-x-auto text-sm text-blue-300'>
                    <code>{generatedCode.messengerConfig}</code>
                  </pre>
                </div>
              )}

              {/* Setup Commands */}
              {(config as any).activeTab === 'setup' && (
                <div>
                  <div className='flex justify-between items-center mb-3'>
                    <h4 className='text-white font-semibold'>Facebook Platform Setup</h4>
                    <div className='flex space-x-2'>
                      <button
                        onClick={() => copyToClipboard(generatedCode.setupCommands)}
                        className='bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm'
                      >
                        Copy
                      </button>
                      <button
                        onClick={() =>
                          downloadFile(
                            generatedCode.setupCommands,
                            `${selectedAgent?.name}-facebook-setup.sh`
                          )
                        }
                        className='bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm'
                      >
                        Download
                      </button>
                    </div>
                  </div>
                  <pre className='bg-black rounded-lg p-4 overflow-x-auto text-sm text-purple-300'>
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
                            `${selectedAgent?.name}-facebook-deploy-guide.md`
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
