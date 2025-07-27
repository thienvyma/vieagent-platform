'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Agent {
  id: string;
  name: string;
  description?: string;
  status: string;
  model: string;
  userId: string;
  createdAt: string;
}

interface AgentExportTabProps {
  agents: Agent[];
}

export default function AgentExportTab({ agents }: AgentExportTabProps) {
  const router = useRouter();
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
          <h3 className='text-xl font-bold text-white mb-4'>Available Agents ({agents.length})</h3>

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
              Complete agent configuration with metadata, knowledge base, and sample conversations.
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
}
