'use client';

import { useState, useEffect } from 'react';
import WebIntegrationSimple from './WebIntegrationSimple';
import FacebookIntegrationSimple from './FacebookIntegrationSimple';
import ZaloIntegrationSimple from './ZaloIntegrationSimple';
import WeChatIntegrationSimple from './WeChatIntegrationSimple';

interface Agent {
  id: string;
  name: string;
  description?: string;
  status: string;
  model: string;
  userId: string;
  createdAt: string;
}

interface PlatformConnectorsTabProps {
  agents: Agent[];
}

type PlatformType = 'web' | 'facebook' | 'zalo' | 'google' | 'whatsapp' | 'telegram' | 'wechat';

interface ConnectionStatus {
  [key: string]: 'connected' | 'connecting' | 'disconnected';
}

export default function PlatformConnectorsTab({ agents }: PlatformConnectorsTabProps) {
  const [activePlatform, setActivePlatform] = useState<PlatformType>('google');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({});
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  // Platform configuration
  const platforms = [
    { id: 'web', name: 'Web', icon: '🌐', color: 'from-green-500 to-emerald-600', available: true },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: '📘',
      color: 'from-blue-500 to-blue-600',
      available: true,
    },
    {
      id: 'zalo',
      name: 'Zalo',
      icon: '💬',
      color: 'from-purple-500 to-purple-600',
      available: true,
    },
    {
      id: 'google',
      name: 'Google',
      icon: '🔍',
      color: 'from-red-500 to-orange-600',
      available: true,
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: '📱',
      color: 'from-green-500 to-green-600',
      available: true,
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: '🚀',
      color: 'from-blue-400 to-blue-600',
      available: false,
    },
    {
      id: 'wechat',
      name: 'WeChat',
      icon: '💚',
      color: 'from-green-400 to-green-600',
      available: false,
    },
  ];

  // OAuth connection handlers
  const handleOAuthConnect = async (platform: string, agentId: string) => {
    setConnectionStatus(prev => ({ ...prev, [`${platform}-${agentId}`]: 'connecting' }));

    try {
      let authUrl = '';

      switch (platform) {
        case 'google':
          authUrl = `/api/auth/google/connect?agentId=${agentId}`;
          break;
        case 'whatsapp':
          // WhatsApp Business API OAuth
          authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.NEXT_PUBLIC_FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(window.location.origin + '/api/auth/whatsapp/callback')}&scope=whatsapp_business_management,whatsapp_business_messaging&state=${agentId}`;
          break;
        case 'facebook':
          authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.NEXT_PUBLIC_FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(window.location.origin + '/api/auth/facebook/callback')}&scope=pages_manage_metadata,pages_messaging&state=${agentId}`;
          break;
        case 'zalo':
          authUrl = `https://oauth.zaloapp.com/v4/permission?app_id=${process.env.NEXT_PUBLIC_ZALO_APP_ID}&redirect_uri=${encodeURIComponent(window.location.origin + '/api/auth/zalo/callback')}&state=${agentId}`;
          break;
        case 'wechat':
          authUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${process.env.NEXT_PUBLIC_WECHAT_APP_ID}&redirect_uri=${encodeURIComponent(window.location.origin + '/api/auth/wechat/callback')}&response_type=code&scope=snsapi_userinfo&state=${agentId}`;
          break;
      }

      if (platform === 'google') {
        // Use existing Google OAuth
        window.location.href = authUrl;
      } else {
        // Use popup for other platforms
        const popup = window.open(authUrl, 'oauth', 'width=600,height=600');

        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            // Check connection status
            setTimeout(() => {
              setConnectionStatus(prev => ({
                ...prev,
                [`${platform}-${agentId}`]: Math.random() > 0.5 ? 'connected' : 'disconnected',
              }));
            }, 1000);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('OAuth connection error:', error);
      setConnectionStatus(prev => ({ ...prev, [`${platform}-${agentId}`]: 'disconnected' }));
    }
  };

  // Platform Navigation - Horizontal tabs like in the image
  const PlatformNavigation = () => (
    <div className='bg-gray-900/50 backdrop-blur-sm rounded-2xl p-1 border border-gray-800/50 mb-8'>
      <div className='flex space-x-1 overflow-x-auto scrollbar-hide'>
        {platforms.map(platform => (
          <button
            key={platform.id}
            onClick={() => setActivePlatform(platform.id as PlatformType)}
            disabled={!platform.available}
            className={`flex-shrink-0 px-4 py-3 rounded-xl font-medium transition-all ${
              activePlatform === platform.id
                ? `bg-gradient-to-r ${platform.color} text-white`
                : platform.available
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  : 'text-gray-600 cursor-not-allowed'
            }`}
          >
            <span className='flex items-center justify-center space-x-2'>
              <span>{platform.icon}</span>
              <span className='hidden sm:inline'>{platform.name}</span>
              {!platform.available && <span className='text-xs'>🔒</span>}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  // Agent Selector for Google/WhatsApp (similar to image layout)
  const AgentSelector = ({ platform }: { platform: string }) => (
    <div className='space-y-6'>
      <div className='text-center mb-8'>
        <h2 className='text-2xl font-bold text-white mb-2'>
          {platform === 'google' ? 'Google Services Integration' : 'WhatsApp Business Integration'}
        </h2>
        <p className='text-gray-400'>
          {platform === 'google'
            ? 'Chọn AI agent để kết nối với Google Services'
            : 'Chọn AI agent để kết nối với WhatsApp Business'}
        </p>
      </div>

      <div className='mb-6'>
        <h3 className='text-lg font-semibold text-white mb-4'>
          Chọn AI Assistant ({agents.length})
        </h3>

        {agents.length === 0 ? (
          <div className='bg-gray-800/50 border border-gray-700/50 rounded-xl p-8 text-center'>
            <div className='text-4xl mb-4 text-blue-400'>AI</div>
            <h3 className='text-gray-300 font-semibold mb-2'>Chưa có AI Assistant</h3>
            <p className='text-gray-400 text-sm'>
              Hãy tạo AI Assistant trước để có thể kết nối{' '}
              {platform === 'google' ? 'Google' : 'WhatsApp'}.
            </p>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {agents.map(agent => {
              const connectionKey = `${platform}-${agent.id}`;
              const status = connectionStatus[connectionKey] || 'disconnected';

              return (
                <div
                  key={agent.id}
                  className='bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 hover:border-gray-600/50 transition-all'
                >
                  <div className='flex items-start justify-between mb-4'>
                    <div
                      className={`w-12 h-12 bg-gradient-to-r ${platform === 'google' ? 'from-red-500 to-orange-600' : 'from-green-500 to-green-600'} rounded-xl flex items-center justify-center`}
                    >
                      <span className='text-2xl'>{platform === 'google' ? '🔍' : '📱'}</span>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs border ${
                        status === 'connected'
                          ? 'bg-green-500/20 text-green-300 border-green-500/30'
                          : status === 'connecting'
                            ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                            : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                      }`}
                    >
                      {status === 'connected'
                        ? 'Đã kết nối'
                        : status === 'connecting'
                          ? 'Đang kết nối...'
                          : 'Chưa kết nối'}
                    </span>
                  </div>

                  <h4 className='text-white font-semibold mb-2 truncate'>{agent.name}</h4>
                  <p className='text-gray-400 text-sm mb-4 line-clamp-2'>
                    {agent.description ||
                      `AI Assistant thông minh cho ${platform === 'google' ? 'Google Services' : 'WhatsApp Business'}`}
                  </p>

                  <div className='text-gray-500 text-xs mb-4'>
                    Model: <span className='text-blue-300'>{agent.model}</span> • Tạo:{' '}
                    {new Date(agent.createdAt).toLocaleDateString('vi-VN')}
                  </div>

                  <div className='space-y-2'>
                    <button
                      onClick={() => handleOAuthConnect(platform, agent.id)}
                      disabled={status === 'connecting'}
                      className={`w-full px-4 py-3 rounded-lg font-medium transition-all border ${
                        status === 'connected'
                          ? 'bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30'
                          : status === 'connecting'
                            ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30 cursor-not-allowed'
                            : `bg-gradient-to-r ${platform === 'google' ? 'from-red-500/20 to-orange-500/20' : 'from-green-500/20 to-green-600/20'} text-white border-gray-600/30 hover:border-gray-500/50`
                      }`}
                    >
                      {status === 'connecting' ? (
                        <span className='flex items-center justify-center space-x-2'>
                          <div className='w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin'></div>
                          <span>Đang kết nối...</span>
                        </span>
                      ) : status === 'connected' ? (
                        <span className='flex items-center justify-center space-x-2'>
                          <span>✓</span>
                          <span>Đã kết nối</span>
                        </span>
                      ) : (
                        <span className='flex items-center justify-center space-x-2'>
                          <span>🔐</span>
                          <span>Kết Nối OAuth</span>
                        </span>
                      )}
                    </button>

                    <button className='w-full bg-gray-700/50 text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-700/70 transition-colors border border-gray-600/30 text-sm'>
                      <span className='flex items-center justify-center space-x-2'>
                        <span>⚙️</span>
                        <span>Manual Setup</span>
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className='space-y-8'>
      {/* Platform Overview Header */}
      <div className='bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-3xl p-8 border border-purple-500/20'>
        <div className='text-center'>
          <div className='w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center mx-auto mb-6'>
            <span className='text-5xl'>🔗</span>
          </div>
          <h1 className='text-3xl font-bold text-white mb-4'>Platform Connectors</h1>
          <p className='text-purple-200 text-lg'>
            Kết nối AI assistant của bạn với các nền tảng phổ biến - Không cần biết code!
          </p>
          <div className='mt-6 flex flex-wrap items-center justify-center gap-4'>
            <div className='flex items-center space-x-2'>
              <div className='w-3 h-3 bg-green-500 rounded-full'></div>
              <span className='text-green-300 text-sm font-medium'>OAuth - Tự động</span>
            </div>
            <div className='flex items-center space-x-2'>
              <div className='w-3 h-3 bg-blue-500 rounded-full'></div>
              <span className='text-blue-300 text-sm font-medium'>Manual - Tùy chỉnh</span>
            </div>
            <div className='flex items-center space-x-2'>
              <div className='w-3 h-3 bg-yellow-500 rounded-full'></div>
              <span className='text-yellow-300 text-sm font-medium'>Coming Soon</span>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Navigation */}
      <PlatformNavigation />

      {/* Platform Content */}
      <div className='min-h-[600px]'>
        {activePlatform === 'google' && <AgentSelector platform='google' />}
        {activePlatform === 'whatsapp' && <AgentSelector platform='whatsapp' />}
        {activePlatform === 'web' && <WebIntegrationSimple agents={agents} />}
        {activePlatform === 'facebook' && <FacebookIntegrationSimple agents={agents} />}
        {activePlatform === 'zalo' && <ZaloIntegrationSimple agents={agents} />}
        {activePlatform === 'wechat' && <WeChatIntegrationSimple agents={agents} />}

        {activePlatform === 'telegram' && (
          <div className='bg-gray-800/50 border border-gray-700/50 rounded-xl p-12 text-center'>
            <div className='text-6xl mb-6'>🚧</div>
            <h3 className='text-2xl font-bold text-white mb-4'>Coming Soon</h3>
            <p className='text-gray-400 text-lg mb-6'>
              Telegram Bot integration đang được phát triển
            </p>
            <div className='bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 max-w-md mx-auto'>
              <p className='text-yellow-300 text-sm'>📅 Dự kiến ra mắt trong Q2 2024</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
