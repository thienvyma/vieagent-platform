'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/ui/DashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

interface UserStats {
  usage: {
    percentage: number;
    plan: string;
  };
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Agent {
  id: string;
  name: string;
  description?: string;
  model: string;
}

export default function ChatPage() {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [agentsLoading, setAgentsLoading] = useState(true);

  useEffect(() => {
    fetchAgents();
    loadUserStats();
  }, []);

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

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents');

      if (response.ok) {
        const agents = await response.json();

        if (agents.length > 0) {
          setAgents(agents);
          setSelectedAgent(agents[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setAgentsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !selectedAgent) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Xin chào! Tôi là ${selectedAgent.name}. Tôi đã nhận được tin nhắn của bạn: "${userMessage.content}". Đây là phản hồi demo từ ${selectedAgent.model}.`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setLoading(false);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  // Custom right section with View Agents button and header
  const renderCustomRightSection = () => (
    <div className='flex items-center space-x-2 sm:space-x-3 lg:space-x-4'>
      {/* View Agents Button */}
      <a
        href='/dashboard/agents'
        className='flex items-center space-x-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 hover:border-green-400/50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl transition-all duration-300 hover:from-green-500/30 hover:to-emerald-500/30'
        title='Xem danh sách agents'
      >
        <span className='text-green-400 text-sm sm:text-base'>AI</span>
        <span className='text-xs sm:text-sm text-green-300 font-medium hidden sm:inline'>
          Agents
        </span>
      </a>

      {/* Dashboard Header */}
      <DashboardHeader stats={userStats} />
    </div>
  );

  if (agentsLoading) {
    return (
      <DashboardLayout
        title='💬 AI Chat Interface'
        description='Đang tải chat...'
        rightSection={renderCustomRightSection()}
      >
        <div className='flex items-center justify-center min-h-64'>
          <div className='text-center'>
            <div className='w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
            <p className='text-white'>Loading chat...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={`💬 Chat với ${selectedAgent?.name || 'AI Agent'}`}
      description={
        selectedAgent
          ? `Đang trò chuyện với ${selectedAgent.name} (${selectedAgent.model})`
          : 'Chọn AI agent để bắt đầu chat'
      }
      rightSection={renderCustomRightSection()}
    >
      <div className='space-y-6'>
        <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
          {/* Agent Sidebar */}
          <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10'>
            <h3 className='text-lg font-bold text-white mb-6 flex items-center space-x-2'>
              <span className='text-blue-400'>AI</span>
              <span>Available Agents</span>
              <span className='text-sm text-gray-400 bg-gray-800/50 px-2 py-1 rounded-lg'>
                {agents.length}
              </span>
            </h3>
            <div className='space-y-3'>
              {agents.map(agent => (
                <button
                  key={agent.id}
                  onClick={() => {
                    setSelectedAgent(agent);
                    setMessages([]);
                  }}
                  className={`w-full text-left p-4 rounded-2xl transition-all duration-300 border ${
                    selectedAgent?.id === agent.id
                      ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/50 shadow-lg'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-green-500/30'
                  }`}
                >
                  <div className='flex items-start space-x-3'>
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        selectedAgent?.id === agent.id
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                          : 'bg-gray-700'
                      }`}
                    >
                      <span className='text-lg text-blue-400'>AI</span>
                    </div>
                    <div className='flex-1'>
                      <div className='font-medium text-white'>{agent.name}</div>
                      <div className='text-sm text-gray-400'>{agent.model}</div>
                      {agent.description && (
                        <div className='text-xs text-gray-500 mt-1 line-clamp-2'>
                          {agent.description}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div
            className='lg:col-span-3 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 flex flex-col'
            style={{ height: '700px' }}
          >
            {/* Chat Header */}
            {selectedAgent && (
              <div className='border-b border-gray-700 p-6'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-4'>
                    <div className='w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center'>
                      <span className='text-2xl text-blue-400'>AI</span>
                    </div>
                    <div>
                      <h3 className='font-bold text-white text-lg'>{selectedAgent.name}</h3>
                      <p className='text-sm text-gray-400'>Model: {selectedAgent.model} • Online</p>
                    </div>
                  </div>
                  {messages.length > 0 && (
                    <button
                      onClick={clearChat}
                      className='text-gray-400 hover:text-red-400 transition-colors px-3 py-2 hover:bg-red-500/10 rounded-lg'
                      title='Clear Chat'
                    >
                      🗑️ Clear
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className='flex-1 overflow-y-auto p-6 space-y-6'>
              {messages.length === 0 && selectedAgent && (
                <div className='text-center py-16'>
                  <div className='w-20 h-20 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-green-500/30'>
                    <span className='text-3xl'>💬</span>
                  </div>
                  <h3 className='text-xl font-bold text-white mb-3'>
                    Bắt đầu cuộc trò chuyện với {selectedAgent.name}!
                  </h3>
                  <p className='text-gray-400 mb-6'>
                    Đặt câu hỏi, yêu cầu trợ giúp, hoặc chỉ cần chat.
                  </p>
                </div>
              )}

              {messages.map(message => (
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
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600'
                          : 'bg-gradient-to-r from-green-500 to-emerald-600'
                      }`}
                    >
                      <span className='text-lg'>{message.role === 'user' ? '👤' : 'AI'}</span>
                    </div>
                    <div
                      className={`px-4 py-3 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                          : 'bg-white/10 text-white border border-white/20'
                      }`}
                    >
                      <p className='whitespace-pre-wrap'>{message.content}</p>
                      <p
                        className={`text-xs mt-2 ${
                          message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
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
            </div>

            {/* Input Area */}
            {selectedAgent && (
              <div className='border-t border-gray-700 p-6'>
                <div className='flex space-x-4'>
                  <div className='flex-1'>
                    <textarea
                      value={inputMessage}
                      onChange={e => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder='Nhập tin nhắn của bạn...'
                      className='w-full resize-none bg-gray-800/50 border border-gray-600 rounded-2xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent'
                      rows={3}
                      disabled={loading}
                    />
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={loading || !inputMessage.trim()}
                    className='bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:scale-105'
                  >
                    {loading ? (
                      <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                    ) : (
                      <span className='flex items-center space-x-2'>
                        <span>🚀</span>
                        <span>Send</span>
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* No Agents Available */}
        {agents.length === 0 && !agentsLoading && (
          <div className='text-center py-16'>
            <div className='w-24 h-24 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-green-500/30'>
              <span className='text-4xl'>AI</span>
            </div>
            <h3 className='text-2xl font-bold text-white mb-4'>Không có AI agents nào</h3>
            <p className='text-gray-400 mb-8 max-w-md mx-auto'>
              Hiện tại không có AI agents nào để trò chuyện. Hãy tạo agent đầu tiên.
            </p>
            <a
              href='/dashboard/agents'
              className='bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all hover:scale-105 font-semibold shadow-2xl inline-block'
            >
              <span className='flex items-center space-x-2'>
                <span className='text-xl text-blue-400'>AI</span>
                <span>Tạo AI Agent</span>
              </span>
            </a>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
