'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import EnhancedChatInterface from '@/components/enhanced/EnhancedChatInterface';
import { Brain, ArrowLeft, Settings, BarChart3, Zap, Target } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  model: string;
  createdAt: string;
}

export default function EnhancedAgentTestPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const agentId = params.id as string;

  useEffect(() => {
    if (session && agentId) {
      fetchAgent();
    }
  }, [session, agentId]);

  const fetchAgent = async () => {
    try {
      const response = await fetch(`/api/agents/${agentId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch agent');
      }
      const data = await response.json();
      setAgent(data);
    } catch (error) {
      console.error('Error fetching agent:', error);
      setError('Failed to load agent');
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center'>
        <div className='text-center'>
          <Brain className='w-12 h-12 text-purple-400 mx-auto mb-4' />
          <p className='text-white'>Please sign in to access enhanced agent testing.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center'>
        <div className='text-center'>
          <div className='p-4 bg-purple-500/10 rounded-2xl inline-block mb-4'>
            <Brain className='w-12 h-12 text-purple-400 animate-pulse' />
          </div>
          <p className='text-white'>Loading enhanced agent...</p>
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center'>
        <div className='text-center'>
          <div className='p-4 bg-red-500/10 rounded-2xl inline-block mb-4'>
            <Brain className='w-12 h-12 text-red-400' />
          </div>
          <p className='text-white mb-4'>{error || 'Agent not found'}</p>
          <button
            onClick={() => router.push('/dashboard/agents')}
            className='px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors'
          >
            Back to Agents
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900'>
      {/* Header */}
      <div className='bg-black/20 backdrop-blur-sm border-b border-purple-500/20'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between h-16'>
            <div className='flex items-center space-x-4'>
              <button
                onClick={() => router.push('/dashboard/agents')}
                className='p-2 text-purple-300 hover:text-white transition-colors'
              >
                <ArrowLeft className='w-5 h-5' />
              </button>

              <div className='flex items-center space-x-3'>
                <div className='p-2 bg-purple-500/20 rounded-xl'>
                  <Brain className='w-6 h-6 text-purple-400' />
                </div>
                <div>
                  <h1 className='text-xl font-bold text-white'>Enhanced Agent Testing</h1>
                  <p className='text-purple-300 text-sm'>
                    AI-powered context analysis & predictions
                  </p>
                </div>
              </div>
            </div>

            <div className='flex items-center space-x-3'>
              <div className='flex items-center space-x-2 px-3 py-1 bg-green-500/20 rounded-lg'>
                <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse'></div>
                <span className='text-green-300 text-sm'>Enhanced Mode Active</span>
              </div>

              <button
                onClick={() => router.push(`/dashboard/agents/${agentId}`)}
                className='p-2 text-purple-300 hover:text-white transition-colors'
                title='Agent Settings'
              >
                <Settings className='w-5 h-5' />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Features Banner */}
      <div className='bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-b border-purple-500/20'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            <div className='flex items-center space-x-3 text-center md:text-left'>
              <div className='p-2 bg-purple-500/20 rounded-lg'>
                <Brain className='w-5 h-5 text-purple-400' />
              </div>
              <div>
                <div className='text-white font-medium text-sm'>AI Context Analysis</div>
                <div className='text-purple-300 text-xs'>Multi-layer processing</div>
              </div>
            </div>

            <div className='flex items-center space-x-3 text-center md:text-left'>
              <div className='p-2 bg-blue-500/20 rounded-lg'>
                <BarChart3 className='w-5 h-5 text-blue-400' />
              </div>
              <div>
                <div className='text-white font-medium text-sm'>Sentiment Detection</div>
                <div className='text-blue-300 text-xs'>Real-time analysis</div>
              </div>
            </div>

            <div className='flex items-center space-x-3 text-center md:text-left'>
              <div className='p-2 bg-green-500/20 rounded-lg'>
                <Target className='w-5 h-5 text-green-400' />
              </div>
              <div>
                <div className='text-white font-medium text-sm'>Intent Recognition</div>
                <div className='text-green-300 text-xs'>Smart predictions</div>
              </div>
            </div>

            <div className='flex items-center space-x-3 text-center md:text-left'>
              <div className='p-2 bg-yellow-500/20 rounded-lg'>
                <Zap className='w-5 h-5 text-yellow-400' />
              </div>
              <div>
                <div className='text-white font-medium text-sm'>Predictive Insights</div>
                <div className='text-yellow-300 text-xs'>Future actions</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Info Panel */}
      <div className='bg-black/20 backdrop-blur-sm border-b border-purple-500/20'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
            <div className='bg-black/40 rounded-xl p-4'>
              <h3 className='text-white font-medium mb-2'>Agent Information</h3>
              <div className='space-y-2 text-sm'>
                <div className='flex justify-between'>
                  <span className='text-gray-400'>Name:</span>
                  <span className='text-purple-300'>{agent.name}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-400'>Model:</span>
                  <span className='text-blue-300'>{agent.model}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-400'>Created:</span>
                  <span className='text-green-300'>
                    {new Date(agent.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className='bg-black/40 rounded-xl p-4'>
              <h3 className='text-white font-medium mb-2'>Enhanced Features</h3>
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-gray-400 text-sm'>Context Builder:</span>
                  <div className='flex items-center space-x-1'>
                    <div className='w-2 h-2 bg-green-400 rounded-full'></div>
                    <span className='text-green-300 text-xs'>Active</span>
                  </div>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-gray-400 text-sm'>AI Analysis:</span>
                  <div className='flex items-center space-x-1'>
                    <div className='w-2 h-2 bg-green-400 rounded-full'></div>
                    <span className='text-green-300 text-xs'>Enabled</span>
                  </div>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-gray-400 text-sm'>Personalization:</span>
                  <div className='flex items-center space-x-1'>
                    <div className='w-2 h-2 bg-green-400 rounded-full'></div>
                    <span className='text-green-300 text-xs'>Learning</span>
                  </div>
                </div>
              </div>
            </div>

            <div className='bg-black/40 rounded-xl p-4'>
              <h3 className='text-white font-medium mb-2'>Test Instructions</h3>
              <div className='text-xs text-gray-300 space-y-1'>
                <p>• Try different conversation styles</p>
                <p>• Ask complex questions</p>
                <p>• Express various emotions</p>
                <p>• Watch context analysis panel</p>
                <p>• Observe predictive insights</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Chat Interface */}
      <div className='h-[calc(100vh-280px)]'>
        <EnhancedChatInterface agentId={agent.id} agentName={agent.name} />
      </div>

      {/* Quick Test Examples */}
      <div className='bg-black/20 backdrop-blur-sm border-t border-purple-500/20'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3'>
          <div className='flex items-center justify-center space-x-4'>
            <span className='text-purple-300 text-sm'>Quick Tests:</span>
            <div className='flex space-x-2 text-xs'>
              <button className='px-3 py-1 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-colors'>
                😊 Positive sentiment
              </button>
              <button className='px-3 py-1 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors'>
                😔 Negative sentiment
              </button>
              <button className='px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors'>
                ❓ Complex question
              </button>
              <button className='px-3 py-1 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors'>
                🔧 Technical issue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
