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

interface FacebookIntegrationSimpleProps {
  agents: Agent[];
}

type SetupMethod = 'oauth' | 'manual';

export default function FacebookIntegrationSimple({ agents }: FacebookIntegrationSimpleProps) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [setupMethod, setSetupMethod] = useState<SetupMethod>('oauth');
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [connectionInfo, setConnectionInfo] = useState<any>(null);
  const [oauthStatus, setOAuthStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>(
    'idle'
  );

  const [config, setConfig] = useState({
    pageName: '',
    contactPhone: '',
    businessAddress: '',
    greeting: '',
    quickReplies: ['Tôi cần hỗ trợ', 'Thông tin sản phẩm', 'Liên hệ tư vấn'],
    businessHours: 'Thứ 2 - Thứ 6: 8:00 - 18:00',
    autoReply: true,
  });

  const handleOAuthConnect = async (agent: Agent) => {
    setSelectedAgent(agent);
    setOAuthStatus('connecting');

    try {
      const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.NEXT_PUBLIC_FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(window.location.origin + '/api/auth/facebook/callback')}&scope=pages_manage_metadata,pages_messaging&state=${agent.id}`;

      const popup = window.open(authUrl, 'facebook-oauth', 'width=600,height=600');

      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          // Simulate connection status check
          setTimeout(() => {
            setOAuthStatus(Math.random() > 0.3 ? 'connected' : 'error');
          }, 1000);
        }
      }, 1000);
    } catch (error) {
      console.error('Facebook OAuth error:', error);
      setOAuthStatus('error');
    }
  };

  const handleStartManualSetup = (agent: Agent) => {
    setSelectedAgent(agent);
    setSetupMethod('manual');
    setConfig(prev => ({
      ...prev,
      greeting: `Xin chào! Tôi là ${agent.name} của ${prev.pageName || 'chúng tôi'}. Cảm ơn bạn đã liên hệ!`,
    }));
    setShowSetupWizard(true);
    setCurrentStep(1);
  };

  const generateConnectionInfo = () => {
    if (!selectedAgent) return;

    const connectionData = {
      agentName: selectedAgent.name,
              webhookUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhook/facebook/${selectedAgent.id}`,
      verifyToken: `verify_${Math.random().toString(36).substr(2, 16)}`,
    };

    setConnectionInfo(connectionData);
    setCurrentStep(4);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} đã được copy!`);
  };

  const downloadSetupGuide = () => {
    if (!connectionInfo) return;

    const guide = `# HƯỚNG DẪN KẾT NỐI FACEBOOK MESSENGER BOT

## THÔNG TIN CHATBOT
- Agent: ${selectedAgent?.name}
- Facebook Page: ${config.pageName}
- Điện thoại: ${config.contactPhone}

## CÁC BƯỚC THIẾT LẬP

### BƯỚC 1: TẠO FACEBOOK APP
1. Truy cập: https://developers.facebook.com
2. Tạo App mới → Chọn "Business"
3. Note lại App ID

### BƯỚC 2: THÊM MESSENGER PLATFORM
1. Thêm Product → Messenger → Set up
2. Generate Page Access Token

### BƯỚC 3: CẤU HÌNH WEBHOOK
Webhook URL: ${connectionInfo.webhookUrl}
Verify Token: ${connectionInfo.verifyToken}

---
Tạo bởi VIEAgent
`;

    const blob = new Blob([guide], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Facebook-Setup-${selectedAgent?.name}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className='space-y-8'>
      {/* Header */}
      <div className='text-center mb-8'>
        <h2 className='text-2xl font-bold text-white mb-2'>Facebook Messenger Integration</h2>
        <p className='text-gray-400'>
          Kết nối AI agent với Facebook Page để tự động trả lời tin nhắn khách hàng 24/7
        </p>
      </div>

      {/* Setup Method Selection */}
      <div className='bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 mb-8'>
        <h3 className='text-lg font-semibold text-white mb-4'>Chọn phương thức kết nối</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              setupMethod === 'oauth'
                ? 'border-blue-500/50 bg-blue-500/10'
                : 'border-gray-600/30 bg-gray-700/30 hover:border-gray-500/50'
            }`}
            onClick={() => setSetupMethod('oauth')}
          >
            <div className='flex items-center space-x-3 mb-3'>
              <div className='w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center'>
                <span className='text-xl'>🔐</span>
              </div>
              <div>
                <h4 className='text-white font-semibold'>OAuth Login</h4>
                <p className='text-blue-300 text-sm'>Tự động - Không cần code</p>
              </div>
            </div>
            <p className='text-gray-400 text-sm'>
              Đăng nhập Facebook và tự động kết nối Page với AI agent. Phù hợp cho người dùng thông
              thường.
            </p>
          </div>

          <div
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              setupMethod === 'manual'
                ? 'border-purple-500/50 bg-purple-500/10'
                : 'border-gray-600/30 bg-gray-700/30 hover:border-gray-500/50'
            }`}
            onClick={() => setSetupMethod('manual')}
          >
            <div className='flex items-center space-x-3 mb-3'>
              <div className='w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center'>
                <span className='text-xl'>⚙️</span>
              </div>
              <div>
                <h4 className='text-white font-semibold'>Manual Setup</h4>
                <p className='text-purple-300 text-sm'>Tùy chỉnh - Cho developer</p>
              </div>
            </div>
            <p className='text-gray-400 text-sm'>
              Thiết lập thủ công với Facebook Developer Console. Phù hợp cho developer và tùy chỉnh
              nâng cao.
            </p>
          </div>
        </div>
      </div>

      {/* Available Agents */}
      <div className='mb-8'>
        <h3 className='text-lg font-semibold text-white mb-4'>
          Chọn AI Assistant ({agents.length})
        </h3>

        {agents.length === 0 ? (
          <div className='bg-gray-800/50 border border-gray-700/50 rounded-xl p-8 text-center'>
            <div className='text-4xl mb-4 text-blue-400'>AI</div>
            <h3 className='text-gray-300 font-semibold mb-2'>Chưa có AI Assistant</h3>
            <p className='text-gray-400 text-sm mb-4'>
              Hãy tạo AI Assistant trước để có thể kết nối Facebook.
            </p>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {agents.map(agent => {
              const isConnected = selectedAgent?.id === agent.id && oauthStatus === 'connected';
              const isConnecting = selectedAgent?.id === agent.id && oauthStatus === 'connecting';

              return (
                <div
                  key={agent.id}
                  className='bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 hover:border-gray-600/50 transition-all relative z-10'
                >
                  <div className='flex items-start justify-between mb-4'>
                    <div className='w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center'>
                      <span className='text-2xl'>📘</span>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs border ${
                        isConnected
                          ? 'bg-green-500/20 text-green-300 border-green-500/30'
                          : isConnecting
                            ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                            : agent.status === 'ACTIVE'
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                              : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                      }`}
                    >
                      {isConnected
                        ? 'Đã kết nối'
                        : isConnecting
                          ? 'Đang kết nối...'
                          : agent.status === 'ACTIVE'
                            ? 'Sẵn sàng'
                            : 'Chưa sẵn sàng'}
                    </span>
                  </div>

                  <h4 className='text-white font-semibold mb-2 truncate'>{agent.name}</h4>
                  <p className='text-gray-400 text-sm mb-4 line-clamp-2'>
                    {agent.description || 'AI Assistant thông minh cho Facebook Messenger'}
                  </p>

                  <div className='text-gray-500 text-xs mb-4'>
                    Model: <span className='text-blue-300'>{agent.model}</span> • Tạo:{' '}
                    {new Date(agent.createdAt).toLocaleDateString('vi-VN')}
                  </div>

                  <div className='space-y-2 relative z-20'>
                    {setupMethod === 'oauth' ? (
                      <button
                        onClick={() => handleOAuthConnect(agent)}
                        disabled={isConnecting}
                        className={`w-full px-4 py-3 rounded-lg font-medium transition-all border relative z-30 ${
                          isConnected
                            ? 'bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30'
                            : isConnecting
                              ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30 cursor-not-allowed'
                              : 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-white border-gray-600/30 hover:border-gray-500/50'
                        }`}
                      >
                        {isConnecting ? (
                          <span className='flex items-center justify-center space-x-2'>
                            <div className='w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin'></div>
                            <span>Đang kết nối...</span>
                          </span>
                        ) : isConnected ? (
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
                    ) : (
                      <button
                        onClick={() => handleStartManualSetup(agent)}
                        className='w-full bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-white px-4 py-3 rounded-lg hover:from-purple-500/30 hover:to-purple-600/30 transition-all border border-gray-600/30 hover:border-gray-500/50 relative z-30'
                      >
                        <span className='flex items-center justify-center space-x-2'>
                          <span>⚙️</span>
                          <span>Manual Setup</span>
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Features Overview */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 relative z-5'>
        <div className='bg-blue-500/10 border border-blue-500/20 rounded-xl p-4'>
          <h3 className='text-blue-300 font-semibold mb-2 flex items-center space-x-2'>
            <span className='text-blue-400'>AI</span>
            <span>Tự Động 24/7</span>
          </h3>
          <p className='text-blue-200 text-sm'>
            Bot sẽ tự động trả lời tin nhắn Facebook ngay cả khi bạn offline.
          </p>
        </div>

        <div className='bg-purple-500/10 border border-purple-500/20 rounded-xl p-4'>
          <h3 className='text-purple-300 font-semibold mb-2 flex items-center space-x-2'>
            <span>⚡</span>
            <span>Trả Lời Nhanh</span>
          </h3>
          <p className='text-purple-200 text-sm'>
            Thiết lập câu trả lời nhanh cho các câu hỏi thường gặp.
          </p>
        </div>

        <div className='bg-green-500/10 border border-green-500/20 rounded-xl p-4'>
          <h3 className='text-green-300 font-semibold mb-2 flex items-center space-x-2'>
            <span>📊</span>
            <span>Quản Lý Dễ</span>
          </h3>
          <p className='text-green-200 text-sm'>
            Theo dõi và quản lý tất cả cuộc hội thoại từ dashboard.
          </p>
        </div>
      </div>

      {/* Setup Wizard Modal */}
      {showSetupWizard && selectedAgent && (
        <div className='fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4'>
          <div className='bg-gray-900/90 backdrop-blur-xl rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/20'>
            <div className='flex justify-between items-center mb-6'>
              <h3 className='text-xl font-bold text-white'>
                Thiết Lập Facebook Bot: {selectedAgent.name}
              </h3>
              <button
                onClick={() => setShowSetupWizard(false)}
                className='text-gray-400 hover:text-white text-2xl'
              >
                ✕
              </button>
            </div>

            {/* Step 1: Page Info */}
            {currentStep === 1 && (
              <div className='space-y-6'>
                <div className='text-center mb-6'>
                  <h4 className='text-xl font-bold text-white mb-2'>📘 Thông Tin Facebook Page</h4>
                  <p className='text-gray-400'>Cho chúng tôi biết về trang Facebook của bạn</p>
                </div>

                <div>
                  <label className='block text-white font-medium mb-2'>Tên Facebook Page</label>
                  <input
                    type='text'
                    value={config.pageName}
                    onChange={e => setConfig(prev => ({ ...prev, pageName: e.target.value }))}
                    className='w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white'
                    placeholder='VD: Shop ABC, Công ty XYZ...'
                  />
                </div>

                <div>
                  <label className='block text-white font-medium mb-2'>Số Điện Thoại Liên Hệ</label>
                  <input
                    type='tel'
                    value={config.contactPhone}
                    onChange={e => setConfig(prev => ({ ...prev, contactPhone: e.target.value }))}
                    className='w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white'
                    placeholder='0901234567'
                  />
                </div>

                <div>
                  <label className='block text-white font-medium mb-2'>Tin Nhắn Chào</label>
                  <textarea
                    value={config.greeting}
                    onChange={e => setConfig(prev => ({ ...prev, greeting: e.target.value }))}
                    className='w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white h-20'
                    placeholder='Xin chào! Cảm ơn bạn đã liên hệ...'
                  />
                </div>

                <button
                  onClick={generateConnectionInfo}
                  disabled={!config.pageName || !config.contactPhone}
                  className='w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white py-3 rounded-lg transition-colors font-medium'
                >
                  Tạo Hướng Dẫn Kết Nối →
                </button>
              </div>
            )}

            {/* Step 4: Connection Guide */}
            {currentStep === 4 && connectionInfo && (
              <div className='space-y-6'>
                <div className='text-center mb-6'>
                  <h4 className='text-xl font-bold text-white mb-2'>🎯 Hướng Dẫn Kết Nối</h4>
                  <p className='text-gray-400'>Thông tin cần thiết để kết nối Facebook</p>
                </div>

                {/* Important URLs */}
                <div className='bg-blue-500/10 border border-blue-500/20 rounded-xl p-6'>
                  <h5 className='text-blue-300 font-semibold mb-4'>📋 Thông Tin Quan Trọng</h5>

                  <div className='space-y-4'>
                    <div>
                      <label className='block text-blue-200 text-sm mb-1'>Webhook URL:</label>
                      <div className='flex space-x-2'>
                        <input
                          type='text'
                          value={connectionInfo.webhookUrl}
                          readOnly
                          className='flex-1 bg-blue-900/30 border border-blue-500/30 rounded px-3 py-2 text-blue-100 text-sm'
                        />
                        <button
                          onClick={() => copyToClipboard(connectionInfo.webhookUrl, 'Webhook URL')}
                          className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm'
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className='block text-blue-200 text-sm mb-1'>Verify Token:</label>
                      <div className='flex space-x-2'>
                        <input
                          type='text'
                          value={connectionInfo.verifyToken}
                          readOnly
                          className='flex-1 bg-blue-900/30 border border-blue-500/30 rounded px-3 py-2 text-blue-100 text-sm'
                        />
                        <button
                          onClick={() =>
                            copyToClipboard(connectionInfo.verifyToken, 'Verify Token')
                          }
                          className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm'
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className='flex space-x-4'>
                  <button
                    onClick={downloadSetupGuide}
                    className='flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg transition-colors font-medium'
                  >
                    📥 Tải Hướng Dẫn Chi Tiết
                  </button>
                  <button
                    onClick={() => {
                      setShowSetupWizard(false);
                      setCurrentStep(1);
                    }}
                    className='flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg transition-colors'
                  >
                    🎉 Hoàn Thành
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
