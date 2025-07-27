'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import MobileOptimizedLayout from '@/components/ui/MobileOptimizedLayout';
import MobileChatInterface from '@/components/chat/MobileChatInterface';
import { OfflineStatus, OfflineStorage } from '@/components/ui/OfflineSupport';
import { TouchButton, TouchTabs } from '@/components/ui/TouchOptimizedComponents';
import { Bot, Settings, Zap, MessageSquare, Users, Mic, Camera, Paperclip } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  description?: string;
  model: string;
  status: string;
  ragEnabled?: boolean;
  autoLearning?: boolean;
  multiModel?: boolean;
}

interface MobileChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: any[];
  reactions?: any[];
}

interface UserStats {
  usage: {
    percentage: number;
    plan: string;
  };
}

export default function MobileChatPage() {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [messages, setMessages] = useState<MobileChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [isOnline, setIsOnline] = useState(true);
  const [enableVoiceRecording, setEnableVoiceRecording] = useState(true);
  const [enableFileUpload, setEnableFileUpload] = useState(true);
  const [enableSwipeActions, setEnableSwipeActions] = useState(true);
  const { data: session } = useSession();

  const tabs = [
    { id: 'chat', label: 'Chat', icon: <MessageSquare className='w-4 h-4' /> },
    { id: 'agents', label: 'Agents', icon: <Bot className='w-4 h-4' /> },
    { id: 'settings', label: 'Settings', icon: <Settings className='w-4 h-4' /> },
  ];

  useEffect(() => {
    fetchAgents();
    loadUserStats();
    checkOnlineStatus();

    // Register service worker for offline support
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered:', registration);
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkOnlineStatus = () => {
    setIsOnline(navigator.onLine);
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

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents');

      if (response.ok) {
        const agents = await response.json();

        if (agents.length > 0) {
          setAgents(agents);
          setSelectedAgent(agents[0]);

          // Load chat history for the first agent
          loadChatHistory(agents[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching agents:', error);

      // Try to load from offline storage
      if (!isOnline) {
        try {
          const offlineData = await OfflineStorage.getOfflineData();
          if (offlineData.agents.length > 0) {
            setAgents(offlineData.agents);
            setSelectedAgent(offlineData.agents[0]);
          }
        } catch (offlineError) {
          console.error('Error loading offline agents:', offlineError);
        }
      }
    } finally {
      setAgentsLoading(false);
    }
  };

  const loadChatHistory = async (agentId: string) => {
    try {
      const response = await fetch(`/api/agents/${agentId}/chat/history`);
      if (response.ok) {
        const history = await response.json();
        setMessages(history.messages || []);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const handleSendMessage = async (content: string, attachments?: any[]) => {
    if (!selectedAgent) return;

    const userMessage: MobileChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
      attachments,
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await fetch(`/api/agents/${selectedAgent.id}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          attachments,
          conversationId: `mobile-chat-${selectedAgent.id}`,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        const aiMessage: MobileChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content:
            data.response ||
            `Hello! I'm ${selectedAgent.name}. This is a mobile-optimized response.`,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);

      // Handle offline mode
      if (!isOnline) {
        // Save message to offline storage
        await OfflineStorage.saveMessage({
          id: userMessage.id,
          content: userMessage.content,
          timestamp: userMessage.timestamp,
          role: userMessage.role,
          synced: false,
          attachments: userMessage.attachments,
        });

        // Add offline response
        const offlineMessage: MobileChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content:
            "You're offline. Your message has been saved and will be sent when you're back online.",
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, offlineMessage]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    setMessages(prev =>
      prev.map(msg => (msg.id === messageId ? { ...msg, content: newContent } : msg))
    );
  };

  const handleDeleteMessage = async (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  const handleReactToMessage = async (messageId: string, emoji: string) => {
    setMessages(prev =>
      prev.map(msg => {
        if (msg.id === messageId) {
          const reactions = msg.reactions || [];
          const existingReaction = reactions.find(r => r.emoji === emoji);

          if (existingReaction) {
            existingReaction.count++;
            if (!existingReaction.users.includes(session?.user?.id || 'user')) {
              existingReaction.users.push(session?.user?.id || 'user');
            }
          } else {
            reactions.push({
              emoji,
              count: 1,
              users: [session?.user?.id || 'user'],
            });
          }

          return { ...msg, reactions };
        }
        return msg;
      })
    );
  };

  const handleAgentChange = (agent: Agent) => {
    setSelectedAgent(agent);
    setMessages([]);
    loadChatHistory(agent.id);
  };

  const renderChatTab = () => (
    <div className='h-full flex flex-col'>
      <MobileChatInterface
        messages={messages}
        onSendMessage={handleSendMessage}
        onEditMessage={handleEditMessage}
        onDeleteMessage={handleDeleteMessage}
        onReactToMessage={handleReactToMessage}
        loading={loading}
        placeholder={`Message ${selectedAgent?.name || 'AI Assistant'}...`}
        enableVoiceRecording={enableVoiceRecording}
        enableFileUpload={enableFileUpload}
        enableSwipeActions={enableSwipeActions}
        agentName={selectedAgent?.name || 'AI Assistant'}
      />
    </div>
  );

  const renderAgentsTab = () => (
    <div className='p-4 space-y-4'>
      <h3 className='text-lg font-bold text-white mb-4'>Available Agents</h3>

      {agents.map(agent => (
        <div
          key={agent.id}
          className={`p-4 rounded-2xl border transition-all ${
            selectedAgent?.id === agent.id
              ? 'border-blue-500/50 bg-blue-500/10'
              : 'border-gray-800/50 bg-gray-900/50'
          }`}
        >
          <div className='flex items-center space-x-3'>
            <div className='w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center'>
              <Bot className='w-6 h-6 text-white' />
            </div>

            <div className='flex-1'>
              <h4 className='font-bold text-white'>{agent.name}</h4>
              <p className='text-sm text-gray-400'>{agent.model}</p>
              {agent.description && (
                <p className='text-xs text-gray-500 mt-1'>{agent.description}</p>
              )}
            </div>

            <div className='space-y-1'>
              {agent.ragEnabled && (
                <span className='inline-block px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full'>
                  RAG
                </span>
              )}
              {agent.autoLearning && (
                <span className='inline-block px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full'>
                  Learning
                </span>
              )}
              {agent.multiModel && (
                <span className='inline-block px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full'>
                  Multi-Model
                </span>
              )}
            </div>
          </div>

          <div className='mt-3 flex space-x-2'>
            <TouchButton
              onClick={() => handleAgentChange(agent)}
              variant={selectedAgent?.id === agent.id ? 'primary' : 'secondary'}
              size='sm'
              className='flex-1'
            >
              {selectedAgent?.id === agent.id ? 'Selected' : 'Select'}
            </TouchButton>

            <TouchButton
              onClick={() => {
                // Navigate to agent settings
                window.location.href = `/dashboard/agents/${agent.id}`;
              }}
              variant='ghost'
              size='sm'
            >
              <Settings className='w-4 h-4' />
            </TouchButton>
          </div>
        </div>
      ))}
    </div>
  );

  const renderSettingsTab = () => (
    <div className='p-4 space-y-6'>
      <h3 className='text-lg font-bold text-white mb-4'>Mobile Settings</h3>

      {/* Voice Recording */}
      <div className='space-y-3'>
        <h4 className='font-medium text-white'>Voice Recording</h4>
        <div className='flex items-center justify-between p-3 bg-gray-900/50 rounded-xl'>
          <div className='flex items-center space-x-3'>
            <Mic className='w-5 h-5 text-gray-400' />
            <span className='text-white'>Enable Voice Messages</span>
          </div>
          <TouchButton
            onClick={() => setEnableVoiceRecording(!enableVoiceRecording)}
            variant={enableVoiceRecording ? 'primary' : 'secondary'}
            size='sm'
          >
            {enableVoiceRecording ? 'On' : 'Off'}
          </TouchButton>
        </div>
      </div>

      {/* File Upload */}
      <div className='space-y-3'>
        <h4 className='font-medium text-white'>File Upload</h4>
        <div className='flex items-center justify-between p-3 bg-gray-900/50 rounded-xl'>
          <div className='flex items-center space-x-3'>
            <Paperclip className='w-5 h-5 text-gray-400' />
            <span className='text-white'>Enable File Attachments</span>
          </div>
          <TouchButton
            onClick={() => setEnableFileUpload(!enableFileUpload)}
            variant={enableFileUpload ? 'primary' : 'secondary'}
            size='sm'
          >
            {enableFileUpload ? 'On' : 'Off'}
          </TouchButton>
        </div>
      </div>

      {/* Swipe Actions */}
      <div className='space-y-3'>
        <h4 className='font-medium text-white'>Swipe Actions</h4>
        <div className='flex items-center justify-between p-3 bg-gray-900/50 rounded-xl'>
          <div className='flex items-center space-x-3'>
            <Zap className='w-5 h-5 text-gray-400' />
            <span className='text-white'>Enable Swipe Gestures</span>
          </div>
          <TouchButton
            onClick={() => setEnableSwipeActions(!enableSwipeActions)}
            variant={enableSwipeActions ? 'primary' : 'secondary'}
            size='sm'
          >
            {enableSwipeActions ? 'On' : 'Off'}
          </TouchButton>
        </div>
      </div>

      {/* Connection Status */}
      <div className='space-y-3'>
        <h4 className='font-medium text-white'>Connection</h4>
        <div className='p-3 bg-gray-900/50 rounded-xl'>
          <div className='flex items-center space-x-3'>
            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className='text-white'>{isOnline ? 'Online' : 'Offline'}</span>
          </div>
          <p className='text-sm text-gray-400 mt-1'>
            {isOnline
              ? 'All features available'
              : 'Messages will be saved and synced when back online'}
          </p>
        </div>
      </div>

      {/* Usage Stats */}
      {userStats && (
        <div className='space-y-3'>
          <h4 className='font-medium text-white'>Usage</h4>
          <div className='p-3 bg-gray-900/50 rounded-xl'>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-white'>Plan: {userStats.usage.plan}</span>
              <span className='text-gray-400'>{userStats.usage.percentage}%</span>
            </div>
            <div className='w-full bg-gray-800 rounded-full h-2'>
              <div
                className='bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all'
                style={{ width: `${userStats.usage.percentage}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (agentsLoading) {
    return (
      <MobileOptimizedLayout title='Mobile Chat' description='Loading...' showBottomNav={false}>
        <div className='flex items-center justify-center min-h-64'>
          <div className='text-center'>
            <div className='w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
            <p className='text-white'>Loading mobile chat...</p>
          </div>
        </div>
      </MobileOptimizedLayout>
    );
  }

  return (
    <MobileOptimizedLayout
      title='Mobile Chat'
      description={`Chat with ${selectedAgent?.name || 'AI Assistant'}`}
      showBottomNav={false}
    >
      <OfflineStatus />

      <div className='flex flex-col h-[calc(100vh-8rem)]'>
        {/* Tabs */}
        <div className='flex-shrink-0 p-4 pb-0'>
          <TouchTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Tab Content */}
        <div className='flex-1 overflow-hidden'>
          {activeTab === 'chat' && renderChatTab()}
          {activeTab === 'agents' && renderAgentsTab()}
          {activeTab === 'settings' && renderSettingsTab()}
        </div>
      </div>
    </MobileOptimizedLayout>
  );
}
