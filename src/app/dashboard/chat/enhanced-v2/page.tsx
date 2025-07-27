/**
 * 💬 Enhanced Chat V2 - Phase 8 Day 27 Complete Implementation
 * Integrates all advanced chat features: file upload, voice recording, real-time indicators, message reactions
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import DashboardLayout from '@/components/ui/DashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import AdvancedChatInput, { type FileUpload } from '@/components/chat/AdvancedChatInput';
import RealTimeIndicators, {
  type TypingUser,
  type OnlineUser,
  type MessageStatus,
} from '@/components/chat/RealTimeIndicators';
import MessageReactions, {
  type Reaction,
  type MessageThread,
} from '@/components/chat/MessageReactions';
import EnhancedChatMessage, {
  type ChatMessage,
  type RAGSource,
} from '@/components/chat/EnhancedChatMessage';
import toast from 'react-hot-toast';

// Types
interface Agent {
  id: string;
  name: string;
  description?: string;
  model: string;
  status: string;
}

interface UserStats {
  usage: {
    percentage: number;
    plan: string;
  };
}

interface ExtendedChatMessage extends ChatMessage {
  reactions?: Reaction[];
  thread?: MessageThread;
  files?: FileUpload[];
  voiceNote?: {
    url: string;
    duration: number;
  };
  status?: MessageStatus['status'];
}

export default function EnhancedChatV2Page() {
  // State management
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Real-time state
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<
    'connected' | 'connecting' | 'disconnected'
  >('connected');
  const [latency, setLatency] = useState(0);

  // Settings
  const [useAdvancedRAG, setUseAdvancedRAG] = useState(true);
  const [showRAGDetails, setShowRAGDetails] = useState(true);
  const [enableVoiceRecording, setEnableVoiceRecording] = useState(true);
  const [enableFileUpload, setEnableFileUpload] = useState(true);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Initialize
  useEffect(() => {
    fetchAgents();
    loadUserStats();
    initializeRealTimeFeatures();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load data
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

  // Initialize real-time features
  const initializeRealTimeFeatures = () => {
    // Mock online users
    setOnlineUsers([
      {
        id: 'user1',
        name: 'John Doe',
        status: 'online',
      },
      {
        id: 'user2',
        name: 'Jane Smith',
        status: 'away',
        lastSeen: new Date(Date.now() - 5 * 60 * 1000),
      },
      {
        id: 'user3',
        name: 'Bob Wilson',
        status: 'online',
      },
    ]);

    // Mock latency
    setLatency(Math.floor(Math.random() * 200) + 50);
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle advanced send with files and voice
  const handleAdvancedSend = useCallback(
    async (message: string, files?: FileUpload[], voiceNote?: Blob) => {
      if (!selectedAgent) return;

      // Create user message
      const userMessage: ExtendedChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: new Date(),
        files: files || [],
        voiceNote: voiceNote
          ? {
              url: URL.createObjectURL(voiceNote),
              duration: 0, // Would be calculated from actual audio
            }
          : undefined,
        status: 'sending',
      };

      setMessages(prev => [...prev, userMessage]);
      setInputMessage('');
      setLoading(true);

      try {
        // Prepare form data for file uploads
        const formData = new FormData();
        formData.append('message', message);
        formData.append('conversationId', conversationId || '');
        formData.append('useAdvancedRAG', useAdvancedRAG.toString());

        // Add files
        if (files && files.length > 0) {
          files.forEach((file, index) => {
            formData.append(`file_${index}`, file.file);
          });
        }

        // Add voice note
        if (voiceNote) {
          formData.append('voiceNote', voiceNote, 'voice_note.wav');
        }

        const response = await fetch(`/api/agents/${selectedAgent.id}/chat`, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();

          // Update conversation ID
          if (data.conversation?.id) {
            setConversationId(data.conversation.id);
          }

          // Update user message status
          setMessages(prev =>
            prev.map(msg =>
              msg.id === userMessage.id ? { ...msg, status: 'delivered' as const } : msg
            )
          );

          // Create AI response
          const aiMessage: ExtendedChatMessage = {
            id: data.message.id,
            role: 'assistant',
            content: data.message.content,
            timestamp: new Date(data.message.createdAt),

            // RAG metadata
            rag: data.rag,
            confidenceScore: data.rag?.averageRelevance || 0.5,
            processingTime: (data.rag?.searchTime || 0) + (data.rag?.contextBuildTime || 0),

            // Sources
            sources:
              data.debug?.ragSources?.map((source: any, index: number) => ({
                id: `source-${index}`,
                title: source.source,
                type: 'document',
                relevance: source.relevance,
                preview: source.preview,
                createdAt: new Date().toISOString(),
              })) || [],

            // Mock reactions and thread
            reactions: [],
            thread: undefined,
            status: 'delivered',
          };

          setMessages(prev => [...prev, aiMessage]);

          // Mark as read after a delay
          setTimeout(() => {
            setMessages(prev =>
              prev.map(msg => (msg.id === aiMessage.id ? { ...msg, status: 'read' as const } : msg))
            );
          }, 1000);
        } else {
          throw new Error('Failed to send message');
        }
      } catch (error) {
        console.error('Error sending message:', error);

        // Update user message status to failed
        setMessages(prev =>
          prev.map(msg => (msg.id === userMessage.id ? { ...msg, status: 'failed' as const } : msg))
        );

        toast.error('Failed to send message. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [selectedAgent, conversationId, useAdvancedRAG]
  );

  // Handle reactions
  const handleReaction = useCallback((messageId: string, emoji: string) => {
    setMessages(prev =>
      prev.map(msg => {
        if (msg.id === messageId) {
          const existingReaction = msg.reactions?.find(r => r.emoji === emoji);

          if (existingReaction) {
            // Toggle existing reaction
            return {
              ...msg,
              reactions: msg.reactions
                ?.map(r =>
                  r.emoji === emoji
                    ? {
                        ...r,
                        count: r.hasReacted ? r.count - 1 : r.count + 1,
                        hasReacted: !r.hasReacted,
                      }
                    : r
                )
                .filter(r => r.count > 0),
            };
          } else {
            // Add new reaction
            const newReaction: Reaction = {
              id: `reaction-${Date.now()}`,
              emoji,
              count: 1,
              users: [{ id: 'current-user', name: 'You' }],
              hasReacted: true,
            };

            return {
              ...msg,
              reactions: [...(msg.reactions || []), newReaction],
            };
          }
        }
        return msg;
      })
    );
  }, []);

  // Handle thread toggle
  const handleThreadToggle = useCallback((messageId: string) => {
    setMessages(prev =>
      prev.map(msg => {
        if (msg.id === messageId) {
          if (!msg.thread) {
            // Create new thread
            const newThread: MessageThread = {
              id: `thread-${messageId}`,
              parentMessageId: messageId,
              messages: [],
              isOpen: true,
              unreadCount: 0,
            };
            return { ...msg, thread: newThread };
          } else {
            // Toggle existing thread
            return {
              ...msg,
              thread: { ...msg.thread, isOpen: !msg.thread.isOpen },
            };
          }
        }
        return msg;
      })
    );
  }, []);

  // Handle typing events
  const handleTypingStart = useCallback(
    (userId: string) => {
      // Mock typing indicator
      setTypingUsers(prev => {
        const existing = prev.find(u => u.id === userId);
        if (existing) return prev;

        return [
          ...prev,
          {
            id: userId,
            name: selectedAgent?.name || 'AI Assistant',
            timestamp: Date.now(),
          },
        ];
      });
    },
    [selectedAgent]
  );

  const handleTypingStop = useCallback((userId: string) => {
    setTypingUsers(prev => prev.filter(u => u.id !== userId));
  }, []);

  // Clear chat
  const clearChat = () => {
    setMessages([]);
    setConversationId(null);
  };

  // Export chat
  const exportChat = () => {
    const chatData = {
      agent: selectedAgent?.name,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        reactions: msg.reactions?.length || 0,
        hasFiles: (msg.files?.length || 0) > 0,
        hasVoiceNote: !!msg.voiceNote,
      })),
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${selectedAgent?.name}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Chat exported successfully!');
  };

  // Custom right section
  const renderCustomRightSection = () => (
    <div className='flex items-center space-x-2 sm:space-x-3 lg:space-x-4'>
      {/* Settings toggles */}
      <div className='flex items-center space-x-2'>
        <button
          onClick={() => setUseAdvancedRAG(!useAdvancedRAG)}
          className={`px-3 py-1.5 rounded-lg border transition-colors text-xs font-medium ${
            useAdvancedRAG
              ? 'bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30'
              : 'bg-gray-500/20 border-gray-500/30 text-gray-400 hover:bg-gray-500/30'
          }`}
          title='Toggle Advanced RAG'
        >
          🧠 RAG
        </button>

        <button
          onClick={() => setEnableVoiceRecording(!enableVoiceRecording)}
          className={`px-3 py-1.5 rounded-lg border transition-colors text-xs font-medium ${
            enableVoiceRecording
              ? 'bg-blue-500/20 border-blue-500/30 text-blue-400 hover:bg-blue-500/30'
              : 'bg-gray-500/20 border-gray-500/30 text-gray-400 hover:bg-gray-500/30'
          }`}
          title='Toggle Voice Recording'
        >
          🎤 Voice
        </button>

        <button
          onClick={() => setEnableFileUpload(!enableFileUpload)}
          className={`px-3 py-1.5 rounded-lg border transition-colors text-xs font-medium ${
            enableFileUpload
              ? 'bg-purple-500/20 border-purple-500/30 text-purple-400 hover:bg-purple-500/30'
              : 'bg-gray-500/20 border-gray-500/30 text-gray-400 hover:bg-gray-500/30'
          }`}
          title='Toggle File Upload'
        >
          📎 Files
        </button>
      </div>

      <DashboardHeader stats={userStats} />
    </div>
  );

  if (agentsLoading) {
    return (
      <DashboardLayout
        title='💬 Enhanced Chat V2'
        description='Loading advanced chat features...'
        rightSection={renderCustomRightSection()}
      >
        <div className='flex items-center justify-center min-h-64'>
          <div className='text-center'>
            <div className='w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
            <p className='text-white'>Loading enhanced chat...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={`💬 Enhanced Chat V2 với ${selectedAgent?.name || 'AI Agent'}`}
      description='Advanced chat with file upload, voice messages, reactions, and real-time features'
      rightSection={renderCustomRightSection()}
    >
      <div className='space-y-6'>
        <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
          {/* Agent Sidebar */}
          <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10'>
            <h3 className='text-lg font-bold text-white mb-6 flex items-center space-x-2'>
              <span className='text-blue-400'>AI</span>
              <span>Agents</span>
              <span className='text-sm text-gray-400 bg-gray-800/50 px-2 py-1 rounded-lg'>
                {agents.length}
              </span>
            </h3>

            {/* Real-time indicators */}
            <div className='mb-6'>
              <RealTimeIndicators
                typingUsers={typingUsers}
                onlineUsers={onlineUsers}
                connectionStatus={connectionStatus}
                latency={latency}
                onTypingStart={handleTypingStart}
                onTypingStop={handleTypingStop}
                showOnlineCount={true}
              />
            </div>

            {/* Agent list */}
            <div className='space-y-3'>
              {agents.map(agent => (
                <button
                  key={agent.id}
                  onClick={() => {
                    setSelectedAgent(agent);
                    setMessages([]);
                    setConversationId(null);
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
                      <div className='flex items-center space-x-2 mt-2'>
                        <div className='w-2 h-2 bg-green-400 rounded-full'></div>
                        <span className='text-xs text-green-400'>Enhanced V2</span>
                      </div>
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
                      <p className='text-sm text-gray-400'>
                        Enhanced V2 • {selectedAgent.model} •{enableVoiceRecording && ' Voice'}
                        {enableFileUpload && ' Files'}
                        {useAdvancedRAG && ' RAG'}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center space-x-3'>
                    {messages.length > 0 && (
                      <div className='text-xs text-gray-400'>{messages.length} messages</div>
                    )}
                    <button
                      onClick={exportChat}
                      className='text-gray-400 hover:text-blue-400 transition-colors px-3 py-2 hover:bg-blue-500/10 rounded-lg'
                      title='Export Chat'
                    >
                      📤 Export
                    </button>
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
              </div>
            )}

            {/* Messages */}
            <div ref={chatContainerRef} className='flex-1 overflow-y-auto p-6 space-y-6'>
              {messages.length === 0 && selectedAgent && (
                <div className='text-center py-16'>
                  <div className='w-20 h-20 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-green-500/30'>
                    <span className='text-3xl'>🚀</span>
                  </div>
                  <h3 className='text-xl font-bold text-white mb-3'>
                    Enhanced Chat V2 với {selectedAgent.name}!
                  </h3>
                  <p className='text-gray-400 mb-6'>
                    Upload files, record voice messages, react to messages, và nhiều tính năng khác!
                  </p>
                  <div className='flex items-center justify-center space-x-6 text-sm text-gray-400'>
                    <div className='flex items-center space-x-2'>
                      <span>📎</span>
                      <span>File Upload</span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <span>🎤</span>
                      <span>Voice Messages</span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <span>😊</span>
                      <span>Reactions</span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <span>🧵</span>
                      <span>Threading</span>
                    </div>
                  </div>
                </div>
              )}

              {messages.map(message => (
                <div key={message.id} className='space-y-3'>
                  {/* Enhanced message component */}
                  <EnhancedChatMessage
                    message={message}
                    showRAGDetails={showRAGDetails}
                    onSuggestedQuestionClick={question => setInputMessage(question)}
                    onSourceClick={source => console.log('Source clicked:', source)}
                  />

                  {/* Message reactions and actions */}
                  <MessageReactions
                    messageId={message.id}
                    reactions={message.reactions}
                    thread={message.thread}
                    canReact={true}
                    canReply={true}
                    onReaction={handleReaction}
                    onThreadToggle={handleThreadToggle}
                    className='ml-12'
                  />
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
                        <span className='text-sm text-gray-300'>AI đang xử lý...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Advanced Input Area */}
            {selectedAgent && (
              <div className='border-t border-gray-700 p-6'>
                <AdvancedChatInput
                  value={inputMessage}
                  onChange={setInputMessage}
                  onSend={handleAdvancedSend}
                  placeholder={`Message ${selectedAgent.name}...`}
                  disabled={loading}
                  loading={loading}
                  enableVoiceRecording={enableVoiceRecording}
                  enableFileUpload={enableFileUpload}
                  enableFormatting={true}
                  maxFiles={5}
                  maxFileSize={10}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
