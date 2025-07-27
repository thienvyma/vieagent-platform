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

interface WebIntegrationTabProps {
  agents: Agent[];
}

export default function WebIntegrationTab({ agents }: WebIntegrationTabProps) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<any>(null);
  const [showCodeModal, setShowCodeModal] = useState(false);

  // Configuration state
  const [config, setConfig] = useState<{
    widgetPosition: string;
    widgetColor: string;
    widgetSize: string;
    greeting: string;
    placeholder: string;
    apiUrl: string;
    customCss: string;
    activeTab: string;
  }>({
    widgetPosition: 'bottom-right',
    widgetColor: '#3B82F6',
    widgetSize: 'medium',
    greeting: '',
    placeholder: 'Type your message...',
    apiUrl: 'https://your-domain.com/api/chat',
    customCss: '',
    activeTab: 'widget',
  });

  const handleGenerateCode = async (agent: Agent) => {
    setSelectedAgent(agent);
    setConfig(prev => ({
      ...prev,
      greeting: `Hello! I'm ${agent.name}, how can I help you?`,
    }));
    setShowConfigModal(true);
  };

  const processGeneration = async () => {
    if (!selectedAgent) return;

    try {
      setGenerating(true);

      const response = await fetch('/api/deployment/web', {
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

  return (
    <div className='space-y-8'>
      <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10'>
        <h2 className='text-2xl font-bold text-white mb-6 flex items-center space-x-3'>
          <span className='text-3xl'>🌐</span>
          <span>Web Integration</span>
        </h2>

        <div className='bg-green-500/10 border border-green-500/20 rounded-xl p-6 mb-6 text-center'>
          <div className='text-4xl mb-4'>✅</div>
          <h3 className='text-green-300 font-semibold mb-2'>Web Integration Ready!</h3>
          <p className='text-green-200 text-sm'>
            Generate website chat widgets, REST API documentation, and webhook configurations.
          </p>
        </div>

        {/* Available Agents */}
        <div className='mb-8'>
          <h3 className='text-xl font-bold text-white mb-4'>
            Select Agent for Web Integration ({agents.length})
          </h3>

          {agents.length === 0 ? (
            <div className='bg-gray-500/10 border border-gray-500/20 rounded-xl p-8 text-center'>
              <div className='text-4xl mb-4 text-blue-400'>AI</div>
              <h3 className='text-gray-300 font-semibold mb-2'>No Agents Available</h3>
              <p className='text-gray-400 text-sm mb-4'>
                Create an agent first to use web integration.
              </p>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {agents.map(agent => (
                <div
                  key={agent.id}
                  className='bg-white/5 border border-white/10 rounded-xl p-6 hover:border-green-500/30 transition-colors'
                >
                  <div className='flex items-start justify-between mb-4'>
                    <div className='w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center'>
                      <span className='text-2xl'>🌐</span>
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
                    Model: <span className='text-green-300'>{agent.model}</span> • Created:{' '}
                    {new Date(agent.createdAt).toLocaleDateString()}
                  </div>

                  <button
                    onClick={() => handleGenerateCode(agent)}
                    className='w-full bg-green-500/20 text-green-300 px-4 py-2 rounded-lg hover:bg-green-500/30 transition-colors border border-green-500/30'
                  >
                    🌐 Generate Web Code
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Integration Features */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='bg-blue-500/10 border border-blue-500/20 rounded-xl p-4'>
            <h3 className='text-blue-300 font-semibold mb-2 flex items-center space-x-2'>
              <span>💬</span>
              <span>Chat Widget</span>
            </h3>
            <p className='text-blue-200 text-sm'>
              Embeddable chat widget with customizable colors, position, and styling.
            </p>
          </div>

          <div className='bg-purple-500/10 border border-purple-500/20 rounded-xl p-4'>
            <h3 className='text-purple-300 font-semibold mb-2 flex items-center space-x-2'>
              <span>📚</span>
              <span>REST API</span>
            </h3>
            <p className='text-purple-200 text-sm'>
              Complete API documentation with examples in JavaScript, Python, and cURL.
            </p>
          </div>

          <div className='bg-orange-500/10 border border-orange-500/20 rounded-xl p-4'>
            <h3 className='text-orange-300 font-semibold mb-2 flex items-center space-x-2'>
              <span>🔗</span>
              <span>Webhooks</span>
            </h3>
            <p className='text-orange-200 text-sm'>
              Webhook configuration for real-time event notifications and integrations.
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Modal */}
      {showConfigModal && selectedAgent && (
        <div className='fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4'>
          <div className='bg-gray-900/90 backdrop-blur-xl rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/20'>
            <div className='flex justify-between items-center mb-6'>
              <h3 className='text-xl font-bold text-white'>
                Configure Web Integration: {selectedAgent.name}
              </h3>
              <button
                onClick={() => setShowConfigModal(false)}
                className='text-gray-400 hover:text-white text-2xl'
              >
                ✕
              </button>
            </div>

            <div className='space-y-6'>
              {/* Widget Position */}
              <div>
                <label className='block text-white font-medium mb-2'>Widget Position</label>
                <select
                  value={config.widgetPosition}
                  onChange={e => setConfig(prev => ({ ...prev, widgetPosition: e.target.value }))}
                  className='w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white'
                >
                  <option value='bottom-right'>Bottom Right</option>
                  <option value='bottom-left'>Bottom Left</option>
                  <option value='top-right'>Top Right</option>
                  <option value='top-left'>Top Left</option>
                </select>
              </div>

              {/* Widget Color */}
              <div>
                <label className='block text-white font-medium mb-2'>Widget Color</label>
                <div className='flex space-x-2'>
                  <input
                    type='color'
                    value={config.widgetColor}
                    onChange={e => setConfig(prev => ({ ...prev, widgetColor: e.target.value }))}
                    className='w-16 h-10 bg-gray-800 border border-gray-600 rounded-lg'
                  />
                  <input
                    type='text'
                    value={config.widgetColor}
                    onChange={e => setConfig(prev => ({ ...prev, widgetColor: e.target.value }))}
                    className='flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white'
                    placeholder='#3B82F6'
                  />
                </div>
              </div>

              {/* Greeting Message */}
              <div>
                <label className='block text-white font-medium mb-2'>Greeting Message</label>
                <input
                  type='text'
                  value={config.greeting}
                  onChange={e => setConfig(prev => ({ ...prev, greeting: e.target.value }))}
                  className='w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white'
                  placeholder='Hello! How can I help you?'
                />
              </div>

              {/* Placeholder Text */}
              <div>
                <label className='block text-white font-medium mb-2'>Input Placeholder</label>
                <input
                  type='text'
                  value={config.placeholder}
                  onChange={e => setConfig(prev => ({ ...prev, placeholder: e.target.value }))}
                  className='w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white'
                  placeholder='Type your message...'
                />
              </div>

              {/* API URL */}
              <div>
                <label className='block text-white font-medium mb-2'>API Base URL</label>
                <input
                  type='text'
                  value={config.apiUrl}
                  onChange={e => setConfig(prev => ({ ...prev, apiUrl: e.target.value }))}
                  className='w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white'
                  placeholder='https://your-domain.com'
                />
              </div>

              {/* Custom CSS */}
              <div>
                <label className='block text-white font-medium mb-2'>Custom CSS (Optional)</label>
                <textarea
                  value={config.customCss}
                  onChange={e => setConfig(prev => ({ ...prev, customCss: e.target.value }))}
                  className='w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white h-24'
                  placeholder='/* Custom CSS styles */'
                />
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
                  className='flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white py-2 rounded-lg transition-colors'
                >
                  {generating ? 'Generating...' : 'Generate Code'}
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
              <h3 className='text-xl font-bold text-white'>Generated Web Integration Code</h3>
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
                  onClick={() => setConfig(prev => ({ ...prev, activeTab: 'widget' }))}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    (config as any).activeTab !== 'api' && (config as any).activeTab !== 'webhook'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  💬 Widget Code
                </button>
                <button
                  onClick={() => setConfig(prev => ({ ...prev, activeTab: 'api' }))}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    (config as any).activeTab === 'api'
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  📚 API Docs
                </button>
                <button
                  onClick={() => setConfig(prev => ({ ...prev, activeTab: 'webhook' }))}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    (config as any).activeTab === 'webhook'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  🔗 Webhooks
                </button>
              </div>

              {/* Widget Code */}
              {((config as any).activeTab || (config as any).activeTab === 'widget') && (
                <div>
                  <div className='flex justify-between items-center mb-3'>
                    <h4 className='text-white font-semibold'>HTML Widget Code</h4>
                    <div className='flex space-x-2'>
                      <button
                        onClick={() => copyToClipboard(generatedCode.widgetHtml)}
                        className='bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm'
                      >
                        Copy
                      </button>
                      <button
                        onClick={() =>
                          downloadFile(
                            generatedCode.widgetHtml,
                            `${selectedAgent?.name}-widget.html`
                          )
                        }
                        className='bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm'
                      >
                        Download
                      </button>
                    </div>
                  </div>
                  <pre className='bg-black rounded-lg p-4 overflow-x-auto text-sm text-green-300'>
                    <code>{generatedCode.widgetHtml}</code>
                  </pre>
                </div>
              )}

              {/* API Documentation */}
              {(config as any).activeTab === 'api' && (
                <div>
                  <div className='flex justify-between items-center mb-3'>
                    <h4 className='text-white font-semibold'>REST API Documentation</h4>
                    <div className='flex space-x-2'>
                      <button
                        onClick={() => copyToClipboard(generatedCode.apiDocs)}
                        className='bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm'
                      >
                        Copy
                      </button>
                      <button
                        onClick={() =>
                          downloadFile(generatedCode.apiDocs, `${selectedAgent?.name}-api-docs.md`)
                        }
                        className='bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm'
                      >
                        Download
                      </button>
                    </div>
                  </div>
                  <pre className='bg-black rounded-lg p-4 overflow-x-auto text-sm text-purple-300'>
                    <code>{generatedCode.apiDocs}</code>
                  </pre>
                </div>
              )}

              {/* Webhook Configuration */}
              {(config as any).activeTab === 'webhook' && (
                <div>
                  <div className='flex justify-between items-center mb-3'>
                    <h4 className='text-white font-semibold'>Webhook Configuration</h4>
                    <div className='flex space-x-2'>
                      <button
                        onClick={() => copyToClipboard(generatedCode.webhookConfig)}
                        className='bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm'
                      >
                        Copy
                      </button>
                      <button
                        onClick={() =>
                          downloadFile(
                            generatedCode.webhookConfig,
                            `${selectedAgent?.name}-webhooks.md`
                          )
                        }
                        className='bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm'
                      >
                        Download
                      </button>
                    </div>
                  </div>
                  <pre className='bg-black rounded-lg p-4 overflow-x-auto text-sm text-orange-300'>
                    <code>{generatedCode.webhookConfig}</code>
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
