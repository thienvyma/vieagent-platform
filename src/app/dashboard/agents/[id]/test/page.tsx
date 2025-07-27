'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Agent {
  id: string;
  name: string;
  description?: string;
  prompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  status: string;
  knowledgeFiles: string[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  tokens?: number;
  cost?: number;
}

interface Conversation {
  id: string;
  title: string;
}

type RouteParams = {
  params: Promise<{ id: string }>;
};

export default function AgentTestPage({ params }: RouteParams) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [agentId, setAgentId] = useState<string>('');
  const [agent, setAgent] = useState<Agent | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      setAgentId(resolvedParams.id);
    };
    loadParams();
  }, [params]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && agentId) {
      loadAgent();
    }
  }, [status, router, agentId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadAgent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/agents/${agentId}`);

      if (response.ok) {
        const agentData = await response.json();
        setAgent(agentData);
      } else {
        alert('Không tìm thấy agent');
        router.push('/dashboard/agents');
      }
    } catch (error) {
      console.error('Error loading agent:', error);
      alert('Lỗi khi tải agent');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputMessage.trim() || sending) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setSending(true);

    // Add user message to UI immediately
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      const response = await fetch(`/api/agents/${agentId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversationId: conversation?.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Update conversation info
        if (data.conversation && !conversation) {
          setConversation(data.conversation);
        }

        // Replace temp message with real message and add assistant response
        setMessages(prev => [
          ...prev.filter(m => m.id !== tempUserMessage.id),
          {
            id: `user-${Date.now()}`,
            role: 'user',
            content: userMessage,
            createdAt: new Date().toISOString(),
          },
          {
            id: data.message.id,
            role: 'assistant',
            content: data.message.content,
            createdAt: data.message.createdAt,
            tokens: data.usage?.tokens,
            cost: data.usage?.cost,
          },
        ]);
      } else {
        const error = await response.json();
        alert(error.error || 'Lỗi khi gửi tin nhắn');

        // Remove temp message on error
        setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Lỗi khi gửi tin nhắn');

      // Remove temp message on error
      setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id));
    } finally {
      setSending(false);
    }
  };

  const clearConversation = () => {
    if (confirm('Bạn có chắc chắn muốn xóa cuộc trò chuyện này?')) {
      setMessages([]);
      setConversation(null);
    }
  };

  const formatCost = (cost?: number) => {
    if (!cost) return '$0.00';
    return `$${cost.toFixed(4)}`;
  };

  if (status === 'loading' || loading) {
    return (
      <div className='min-h-screen bg-black text-white'>
        <div className='fixed inset-0 z-0'>
          <div className='absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900'></div>
          <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse'></div>
          <div className='absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000'></div>
        </div>

        <div className='relative z-10 flex items-center justify-center min-h-screen'>
          <div className='text-center'>
            <div className='w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
            <p className='text-white'>Loading agent test...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className='min-h-screen bg-black text-white'>
        <div className='fixed inset-0 z-0'>
          <div className='absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900'></div>
        </div>

        <div className='relative z-10 flex items-center justify-center min-h-screen'>
          <div className='text-center'>
            <div className='w-20 h-20 bg-gradient-to-r from-red-500/20 to-rose-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-red-500/30'>
              <span className='text-3xl'>❌</span>
            </div>
            <h3 className='text-xl font-bold text-white mb-3'>Agent không tồn tại</h3>
            <p className='text-gray-400 mb-6'>
              Agent này có thể đã bị xóa hoặc bạn không có quyền truy cập
            </p>
            <button
              onClick={() => router.push('/dashboard/agents')}
              className='bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-cyan-700 transition-all font-semibold'
            >
              Quay lại danh sách Agents
            </button>
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
        <div className='absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000'></div>
        <div className='absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]'></div>
      </div>

      <div className='relative z-10 container mx-auto px-4 py-8'>
        {/* Header */}
        <div className='flex justify-between items-center mb-8'>
          <div>
            <div className='flex items-center space-x-4 mb-2'>
              <button
                onClick={() => router.push('/dashboard/agents')}
                className='w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all'
              >
                ←
              </button>
              <div className='w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center'>
                <span className='text-2xl'>🧪</span>
              </div>
              <div>
                <h1 className='text-3xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent'>
                  Test: {agent.name}
                </h1>
                <div className='flex items-center space-x-3 mt-1'>
                  <span
                    className={`px-3 py-1 text-sm rounded-xl border flex items-center space-x-1 ${
                      agent.status === 'ACTIVE'
                        ? 'bg-green-500/20 border-green-500/50 text-green-400'
                        : 'bg-gray-500/20 border-gray-500/50 text-gray-400'
                    }`}
                  >
                    <span>{agent.status === 'ACTIVE' ? '✅' : '⏸️'}</span>
                    <span>{agent.status}</span>
                  </span>
                  <span className='text-gray-400 text-sm'>Model: {agent.model}</span>
                </div>
              </div>
            </div>
            <p className='text-gray-400 ml-14'>Testing Panel - Live Chat với AI Agent</p>
          </div>

          <div className='flex space-x-3'>
            <button
              onClick={() => setShowConfig(!showConfig)}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                showConfig
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              ⚙️ Config
            </button>
            <button
              onClick={clearConversation}
              className='bg-gradient-to-r from-red-500 to-rose-600 text-white px-4 py-2 rounded-xl hover:from-red-600 hover:to-rose-700 transition-all font-medium'
            >
              🗑️ Clear
            </button>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
          {/* Chat Interface */}
          <div className='lg:col-span-3'>
            <div
              className='bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10'
              style={{ height: '700px' }}
            >
              {/* Chat Header */}
              <div className='border-b border-gray-700 p-6'>
                <div className='flex justify-between items-center'>
                  <div>
                    <h3 className='text-xl font-bold text-white flex items-center space-x-2'>
                      <span>🧪</span>
                      <span>Live Chat Test</span>
                    </h3>
                    {conversation && (
                      <p className='text-gray-400 text-sm mt-1'>{conversation.title}</p>
                    )}
                  </div>
                  <div className='text-sm text-gray-400 bg-gray-800/50 px-3 py-1 rounded-lg'>
                    Model: <span className='text-white font-medium'>{agent.model}</span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className='flex-1 overflow-y-auto p-6 space-y-6' style={{ height: '500px' }}>
                {messages.length === 0 ? (
                  <div className='text-center py-16'>
                    <div className='w-20 h-20 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-blue-500/30'>
                      <span className='text-3xl'>🧪</span>
                    </div>
                    <h3 className='text-xl font-bold text-white mb-3'>Bắt đầu test agent!</h3>
                    <p className='text-gray-400 mb-6'>
                      Gửi tin nhắn để kiểm tra khả năng phản hồi của AI agent
                    </p>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-3 max-w-md mx-auto'>
                      <button
                        onClick={() => setInputMessage('Xin chào, bạn có thể giúp gì cho tôi?')}
                        className='text-left p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-blue-500/30 transition-all text-sm text-gray-300'
                      >
                        💡 Test câu hỏi chào hỏi
                      </button>
                      <button
                        onClick={() => setInputMessage('Bạn có những tính năng gì?')}
                        className='text-left p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-blue-500/30 transition-all text-sm text-gray-300'
                      >
                        🚀 Test tính năng
                      </button>
                    </div>
                  </div>
                ) : (
                  messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`flex items-start space-x-3 max-w-xs lg:max-w-md ${
                          message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            message.role === 'user'
                              ? 'bg-gradient-to-r from-blue-500 to-cyan-600'
                              : 'bg-gradient-to-r from-green-500 to-emerald-600'
                          }`}
                        >
                          <span className='text-lg'>{message.role === 'user' ? '👤' : 'AI'}</span>
                        </div>
                        <div
                          className={`px-4 py-3 rounded-2xl ${
                            message.role === 'user'
                              ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white'
                              : 'bg-white/10 text-white border border-white/20'
                          }`}
                        >
                          <p className='whitespace-pre-wrap'>{message.content}</p>
                          <div
                            className={`flex justify-between items-center mt-2 text-xs ${
                              message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                            }`}
                          >
                            <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
                            {message.role === 'assistant' && message.tokens && (
                              <span className='bg-black/20 px-2 py-1 rounded-lg'>
                                {message.tokens} tokens • {formatCost(message.cost)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {sending && (
                  <div className='flex justify-start'>
                    <div className='flex items-start space-x-3'>
                      <div className='w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center'>
                        <span className='text-lg text-blue-400'>AI</span>
                      </div>
                      <div className='bg-white/10 border border-white/20 px-4 py-3 rounded-2xl'>
                        <div className='flex items-center space-x-2'>
                          <div className='flex space-x-1'>
                            <div className='w-2 h-2 bg-green-400 rounded-full animate-bounce'></div>
                            <div
                              className='w-2 h-2 bg-green-400 rounded-full animate-bounce'
                              style={{ animationDelay: '0.1s' }}
                            ></div>
                            <div
                              className='w-2 h-2 bg-green-400 rounded-full animate-bounce'
                              style={{ animationDelay: '0.2s' }}
                            ></div>
                          </div>
                          <span className='text-sm text-gray-300'>AI đang suy nghĩ...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className='border-t border-gray-700 p-6'>
                <form onSubmit={sendMessage} className='flex space-x-4'>
                  <div className='flex-1'>
                    <input
                      type='text'
                      value={inputMessage}
                      onChange={e => setInputMessage(e.target.value)}
                      placeholder='Nhập tin nhắn để test agent...'
                      className='w-full bg-gray-800/50 border border-gray-600 rounded-2xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      disabled={sending}
                    />
                    <div className='flex justify-between items-center mt-2'>
                      <p className='text-xs text-gray-500'>Press Enter để gửi tin nhắn test</p>
                      <div className='text-xs text-gray-500'>{inputMessage.length}/1000</div>
                    </div>
                  </div>
                  <button
                    type='submit'
                    disabled={sending || !inputMessage.trim()}
                    className='bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-6 py-3 rounded-2xl hover:from-blue-600 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:scale-105'
                  >
                    {sending ? (
                      <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                    ) : (
                      <span className='flex items-center space-x-2'>
                        <span>🧪</span>
                        <span>Test</span>
                      </span>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Configuration Panel */}
          <div className={`space-y-6 ${showConfig ? 'block' : 'hidden lg:block'}`}>
            {/* Agent Info */}
            <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10'>
              <h4 className='text-lg font-bold text-white mb-4 flex items-center space-x-2'>
                <span className='text-blue-400'>AI</span>
                <span>Agent Info</span>
              </h4>
              <div className='space-y-3'>
                <div className='bg-white/5 rounded-xl p-3'>
                  <div className='text-gray-400 text-sm mb-1'>Tên:</div>
                  <div className='text-white font-medium'>{agent.name}</div>
                </div>
                {agent.description && (
                  <div className='bg-white/5 rounded-xl p-3'>
                    <div className='text-gray-400 text-sm mb-1'>Mô tả:</div>
                    <div className='text-white font-medium'>{agent.description}</div>
                  </div>
                )}
                <div className='grid grid-cols-2 gap-3'>
                  <div className='bg-white/5 rounded-xl p-3'>
                    <div className='text-gray-400 text-sm mb-1'>Model:</div>
                    <div className='text-blue-400 font-medium'>{agent.model}</div>
                  </div>
                  <div className='bg-white/5 rounded-xl p-3'>
                    <div className='text-gray-400 text-sm mb-1'>Temperature:</div>
                    <div className='text-orange-400 font-medium'>{agent.temperature}</div>
                  </div>
                </div>
                <div className='grid grid-cols-2 gap-3'>
                  <div className='bg-white/5 rounded-xl p-3'>
                    <div className='text-gray-400 text-sm mb-1'>Max Tokens:</div>
                    <div className='text-purple-400 font-medium'>{agent.maxTokens}</div>
                  </div>
                  <div className='bg-white/5 rounded-xl p-3'>
                    <div className='text-gray-400 text-sm mb-1'>Knowledge:</div>
                    <div className='text-green-400 font-medium'>
                      {agent.knowledgeFiles.length} files
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* System Prompt */}
            <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10'>
              <h4 className='text-lg font-bold text-white mb-4 flex items-center space-x-2'>
                <span>🧠</span>
                <span>System Prompt</span>
              </h4>
              <div className='bg-gray-800/50 border border-gray-600 rounded-2xl p-4 text-sm text-gray-300 max-h-40 overflow-y-auto'>
                <pre className='whitespace-pre-wrap font-mono'>{agent.prompt}</pre>
              </div>
            </div>

            {/* Usage Stats */}
            {messages.length > 0 && (
              <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10'>
                <h4 className='text-lg font-bold text-white mb-4 flex items-center space-x-2'>
                  <span>📊</span>
                  <span>Session Stats</span>
                </h4>
                <div className='grid grid-cols-1 gap-3'>
                  <div className='bg-blue-500/10 rounded-xl p-4 border border-blue-500/20'>
                    <div className='flex justify-between items-center'>
                      <span className='text-blue-400 text-sm'>Tin nhắn:</span>
                      <span className='text-blue-300 font-bold text-lg'>{messages.length}</span>
                    </div>
                  </div>
                  <div className='bg-purple-500/10 rounded-xl p-4 border border-purple-500/20'>
                    <div className='flex justify-between items-center'>
                      <span className='text-purple-400 text-sm'>Tokens:</span>
                      <span className='text-purple-300 font-bold text-lg'>
                        {messages.reduce((sum, msg) => sum + (msg.tokens || 0), 0)}
                      </span>
                    </div>
                  </div>
                  <div className='bg-green-500/10 rounded-xl p-4 border border-green-500/20'>
                    <div className='flex justify-between items-center'>
                      <span className='text-green-400 text-sm'>Chi phí:</span>
                      <span className='text-green-300 font-bold text-lg'>
                        {formatCost(messages.reduce((sum, msg) => sum + (msg.cost || 0), 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Test Examples */}
            <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10'>
              <h4 className='text-lg font-bold text-white mb-4 flex items-center space-x-2'>
                <span>⚡</span>
                <span>Quick Tests</span>
              </h4>
              <div className='space-y-3'>
                {[
                  'Xin chào, bạn có thể giúp gì cho tôi?',
                  'Giải thích về sản phẩm/dịch vụ của công ty',
                  'Tôi có câu hỏi về pricing',
                  'Làm thế nào để liên hệ support?',
                ].map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setInputMessage(example)}
                    className='w-full text-left bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white px-4 py-3 rounded-xl text-sm transition-all border border-white/10 hover:border-blue-500/30'
                  >
                    <span className='mr-2'>💡</span>
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
