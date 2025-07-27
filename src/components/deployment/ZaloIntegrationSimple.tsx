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

interface ZaloIntegrationSimpleProps {
  agents: Agent[];
}

type SetupMethod = 'oauth' | 'manual';

export default function ZaloIntegrationSimple({ agents }: ZaloIntegrationSimpleProps) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [setupMethod, setSetupMethod] = useState<SetupMethod>('oauth');
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [connectionInfo, setConnectionInfo] = useState<any>(null);
  const [oauthStatus, setOAuthStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>(
    'idle'
  );

  const [config, setConfig] = useState({
    businessName: '',
    businessCategory: 'retail',
    contactPhone: '',
    businessAddress: '',
    greeting: '',
    quickReplies: ['Tôi cần hỗ trợ', 'Thông tin sản phẩm', 'Liên hệ tư vấn', 'Giờ mở cửa'],
    businessHours: 'Thứ 2 - Thứ 6: 8:00 - 18:00',
    autoReply: true,
    enableTemplates: true,
  });

  const businessCategories = [
    { value: 'retail', label: 'Bán lẻ' },
    { value: 'restaurant', label: 'Nhà hàng' },
    { value: 'beauty', label: 'Làm đẹp' },
    { value: 'education', label: 'Giáo dục' },
    { value: 'healthcare', label: 'Y tế' },
    { value: 'technology', label: 'Công nghệ' },
    { value: 'service', label: 'Dịch vụ' },
    { value: 'other', label: 'Khác' },
  ];

  const handleOAuthConnect = async (agent: Agent) => {
    setSelectedAgent(agent);
    setOAuthStatus('connecting');

    try {
      const authUrl = `https://oauth.zaloapp.com/v4/permission?app_id=${process.env.NEXT_PUBLIC_ZALO_APP_ID}&redirect_uri=${encodeURIComponent(window.location.origin + '/api/auth/zalo/callback')}&state=${agent.id}`;

      const popup = window.open(authUrl, 'zalo-oauth', 'width=600,height=600');

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
      console.error('Zalo OAuth error:', error);
      setOAuthStatus('error');
    }
  };

  const handleStartManualSetup = (agent: Agent) => {
    setSelectedAgent(agent);
    setSetupMethod('manual');
    setConfig(prev => ({
      ...prev,
      greeting: `Xin chào! Tôi là ${agent.name} của ${prev.businessName || 'chúng tôi'}. Rất vui được hỗ trợ bạn!`,
    }));
    setShowSetupWizard(true);
    setCurrentStep(1);
  };

  const generateConnectionInfo = () => {
    if (!selectedAgent) return;

    const connectionData = {
      agentName: selectedAgent.name,
      setupSteps: [
        {
          title: 'Đăng ký Zalo Official Account (OA)',
          description: 'Tạo tài khoản doanh nghiệp trên Zalo',
          action: 'Truy cập oa.zalo.me → Đăng ký OA → Chọn loại hình kinh doanh phù hợp',
          details: [
            'Chuẩn bị giấy phép kinh doanh',
            'Upload logo và thông tin doanh nghiệp',
            'Chờ Zalo xác minh (1-3 ngày làm việc)',
          ],
        },
        {
          title: 'Xác minh tài khoản OA',
          description: 'Hoàn tất quá trình xác minh để sử dụng API',
          action: 'Submit hồ sơ xác minh → Chờ phê duyệt → Nhận OA ID',
          details: [
            'Cung cấp thông tin kinh doanh đầy đủ',
            'Upload các giấy tờ pháp lý',
            'Xác minh số điện thoại và email',
          ],
        },
        {
          title: 'Tạo Zalo Mini App (Tùy chọn)',
          description: 'Tạo app để tích hợp chatbot nâng cao',
          action: 'Developers.zalo.me → Tạo App → Kết nối với OA',
          details: [
            'Đăng ký tài khoản developer',
            "Tạo app mới với loại 'Official Account'",
            'Lấy App ID và Secret Key',
          ],
        },
        {
          title: 'Cấu hình Webhook',
          description: 'Thiết lập kết nối nhận tin nhắn tự động',
          action: 'Trong OA Settings → Webhook → Nhập URL và Secret',
          details: [
            'Webhook URL sẽ được cung cấp',
            'Secret key để xác thực',
            'Test kết nối webhook',
          ],
        },
        {
          title: 'Kết nối AI Agent',
          description: 'Hoàn tất kết nối và test chatbot',
          action: 'Copy thông tin cấu hình → Paste vào AI Platform → Test',
          details: ['Nhập OA ID và Access Token', 'Cấu hình webhook URL', 'Test tin nhắn đầu tiên'],
        },
      ],
      settings: {
        businessName: config.businessName,
        businessCategory: config.businessCategory,
        greeting: config.greeting,
        quickReplies: config.quickReplies,
        businessHours: config.businessHours,
        autoReply: config.autoReply,
        enableTemplates: config.enableTemplates,
        contactPhone: config.contactPhone,
        businessAddress: config.businessAddress,
      },
      webhookUrl: `${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/api/webhook/zalo/${selectedAgent.id}`,
      secretKey: `zalo_${Math.random().toString(36).substr(2, 32)}`,
      templateMessages: [
        {
          name: 'welcome_message',
          content: config.greeting,
          type: 'text',
        },
        {
          name: 'business_hours',
          content: `Giờ làm việc của chúng tôi: ${config.businessHours}. Ngoài giờ làm việc, bạn có thể để lại tin nhắn và chúng tôi sẽ phản hồi sớm nhất có thể.`,
          type: 'text',
        },
        {
          name: 'contact_info',
          content: `📞 Liên hệ: ${config.contactPhone}\n📍 Địa chỉ: ${config.businessAddress}\n🕐 Giờ làm việc: ${config.businessHours}`,
          type: 'text',
        },
      ],
    };

    setConnectionInfo(connectionData);
    setCurrentStep(5);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} đã được copy!`);
  };

  const downloadSetupGuide = () => {
    if (!connectionInfo) return;

    const guide = `
# HƯỚNG DẪN KẾT NỐI ZALO OFFICIAL ACCOUNT BOT

## ℹ️ THÔNG TIN DOANH NGHIỆP
- Tên doanh nghiệp: ${config.businessName}
- Lĩnh vực: ${businessCategories.find(c => c.value === config.businessCategory)?.label}
- Điện thoại: ${config.contactPhone}
- Địa chỉ: ${config.businessAddress}
- AI Agent: ${selectedAgent?.name}

## 📋 CÁC BƯỚC THIẾT LẬP CHI TIẾT

### BƯỚC 1: ĐĂNG KÝ ZALO OFFICIAL ACCOUNT
1. Truy cập: https://oa.zalo.me
2. Click "Đăng ký OA" → Chọn "Doanh nghiệp"
3. Điền thông tin:
   - Tên OA: ${config.businessName}
   - Lĩnh vực: ${businessCategories.find(c => c.value === config.businessCategory)?.label}
   - Số điện thoại: ${config.contactPhone}
   - Địa chỉ: ${config.businessAddress}

4. Upload tài liệu:
   - Giấy phép kinh doanh
   - CMND/CCCD người đại diện
   - Logo doanh nghiệp (PNG, 500x500px)

5. Chờ Zalo xác minh (1-3 ngày làm việc)

### BƯỚC 2: XÁC MINH VÀ KÍCH HOẠT
1. Sau khi được phê duyệt, đăng nhập OA Dashboard
2. Vào "Cài đặt" → "Thông tin cơ bản"
3. Note lại OA ID (dạng: 1234567890123456789)
4. Kích hoạt tính năng "Tin nhắn tự động"

### BƯỚC 3: TẠO ZALO MINI APP (TÙY CHỌN)
1. Truy cập: https://developers.zalo.me
2. Đăng nhập bằng tài khoản OA
3. "Tạo ứng dụng mới" → Chọn "Official Account"
4. Điền thông tin:
   - Tên app: ${config.businessName} Bot
   - Mô tả: Chatbot tự động cho ${config.businessName}
5. Sau khi tạo, note lại:
   - App ID: [Sẽ được hiển thị]
   - Secret Key: [Sẽ được hiển thị]

### BƯỚC 4: CẤU HÌNH WEBHOOK
1. Trong OA Dashboard → "Cài đặt" → "Webhook"
2. Nhập thông tin:
   - Webhook URL: ${connectionInfo.webhookUrl}
   - Secret Key: ${connectionInfo.secretKey}
3. Click "Lưu" và "Test Webhook"

### BƯỚC 5: KẾT NỐI AI AGENT
1. Trở lại AI Platform Dashboard
2. Vào "Platform Connectors" → "Zalo"
3. Nhập thông tin:
   - OA ID: [Từ bước 2]
   - Access Token: [Từ OA Dashboard]
   - App ID: [Từ bước 3, nếu có]
   - Secret Key: [Từ bước 3, nếu có]
4. Click "Kết nối" và test tin nhắn đầu tiên

## 🎯 TEMPLATE MESSAGES
${connectionInfo.templateMessages.map((t: any) => `- ${t.name}: ${t.content}`).join('\n')}

## 📞 HỖ TRỢ
Nếu gặp khó khăn, liên hệ support@aiplatform.com

---
Tạo bởi VIEAgent
`;

    const blob = new Blob([guide], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Zalo-Setup-${selectedAgent?.name}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const StepIndicator = () => (
    <div className='flex items-center justify-center mb-8'>
      {[1, 2, 3, 4, 5].map(step => (
        <div key={step} className='flex items-center'>
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              currentStep >= step ? 'bg-purple-500 text-white' : 'bg-gray-600 text-gray-400'
            }`}
          >
            {currentStep > step ? '✓' : step}
          </div>
          {step < 5 && (
            <div className={`w-16 h-1 ${currentStep > step ? 'bg-purple-500' : 'bg-gray-600'}`} />
          )}
        </div>
      ))}
    </div>
  );

  const addQuickReply = () => {
    setConfig(prev => ({
      ...prev,
      quickReplies: [...prev.quickReplies, ''],
    }));
  };

  const removeQuickReply = (index: number) => {
    setConfig(prev => ({
      ...prev,
      quickReplies: prev.quickReplies.filter((_, i) => i !== index),
    }));
  };

  const updateQuickReply = (index: number, value: string) => {
    setConfig(prev => ({
      ...prev,
      quickReplies: prev.quickReplies.map((item, i) => (i === index ? value : item)),
    }));
  };

  return (
    <div className='space-y-8'>
      <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10'>
        <h2 className='text-2xl font-bold text-white mb-6 flex items-center space-x-3'>
          <span className='text-3xl'>💬</span>
          <span>Kết Nối Zalo OA</span>
        </h2>

        <div className='bg-purple-500/10 border border-purple-500/20 rounded-xl p-6 mb-6 text-center'>
          <div className='text-4xl mb-4'>🇻🇳</div>
          <h3 className='text-purple-300 font-semibold mb-2'>Zalo Official Account Bot!</h3>
          <p className='text-purple-200 text-sm'>
            Kết nối AI vào Zalo OA để tự động tương tác với khách hàng Việt Nam 24/7.
          </p>
        </div>

        {/* Setup Method Selection */}
        <div className='bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 mb-8'>
          <h3 className='text-lg font-semibold text-white mb-4'>Chọn phương thức kết nối</h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                setupMethod === 'oauth'
                  ? 'border-purple-500/50 bg-purple-500/10'
                  : 'border-gray-600/30 bg-gray-700/30 hover:border-gray-500/50'
              }`}
              onClick={() => setSetupMethod('oauth')}
            >
              <div className='flex items-center space-x-3 mb-3'>
                <div className='w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center'>
                  <span className='text-xl'>🔐</span>
                </div>
                <div>
                  <h4 className='text-white font-semibold'>Zalo Login</h4>
                  <p className='text-purple-300 text-sm'>Tự động - Không cần code</p>
                </div>
              </div>
              <p className='text-gray-400 text-sm'>
                Đăng nhập Zalo và tự động kết nối OA với AI agent. Phù hợp cho người dùng thông
                thường.
              </p>
            </div>

            <div
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                setupMethod === 'manual'
                  ? 'border-orange-500/50 bg-orange-500/10'
                  : 'border-gray-600/30 bg-gray-700/30 hover:border-gray-500/50'
              }`}
              onClick={() => setSetupMethod('manual')}
            >
              <div className='flex items-center space-x-3 mb-3'>
                <div className='w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center'>
                  <span className='text-xl'>⚙️</span>
                </div>
                <div>
                  <h4 className='text-white font-semibold'>Manual Setup</h4>
                  <p className='text-orange-300 text-sm'>Tùy chỉnh - Cho developer</p>
                </div>
              </div>
              <p className='text-gray-400 text-sm'>
                Thiết lập thủ công với Zalo Developer Console. Phù hợp cho developer và tùy chỉnh
                nâng cao.
              </p>
            </div>
          </div>
        </div>

        {/* Available Agents */}
        <div className='mb-8'>
          <h3 className='text-xl font-bold text-white mb-4'>
            Chọn AI Assistant cho Zalo OA ({agents.length})
          </h3>

          {agents.length === 0 ? (
            <div className='bg-gray-500/10 border border-gray-500/20 rounded-xl p-8 text-center'>
              <div className='text-4xl mb-4 text-blue-400'>AI</div>
              <h3 className='text-gray-300 font-semibold mb-2'>Chưa có AI Assistant</h3>
              <p className='text-gray-400 text-sm mb-4'>
                Hãy tạo AI Assistant trước để có thể kết nối Zalo OA.
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
                      <div className='w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center'>
                        <span className='text-2xl'>💬</span>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs border ${
                          isConnected
                            ? 'bg-green-500/20 text-green-300 border-green-500/30'
                            : isConnecting
                              ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                              : agent.status === 'ACTIVE'
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
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
                      {agent.description || 'AI Assistant thông minh cho Zalo Official Account'}
                    </p>

                    <div className='text-gray-500 text-xs mb-4'>
                      Model: <span className='text-purple-300'>{agent.model}</span> • Tạo:{' '}
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
                                : 'bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-white border-gray-600/30 hover:border-gray-500/50'
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
                          className='w-full bg-gradient-to-r from-orange-500/20 to-orange-600/20 text-white px-4 py-3 rounded-lg hover:from-orange-500/30 hover:to-orange-600/30 transition-all border border-gray-600/30 hover:border-gray-500/50 relative z-30'
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
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='bg-purple-500/10 border border-purple-500/20 rounded-xl p-4'>
            <h3 className='text-purple-300 font-semibold mb-2 flex items-center space-x-2'>
              <span>🇻🇳</span>
              <span>Tối Ưu Việt Nam</span>
            </h3>
            <p className='text-purple-200 text-sm'>
              Được thiết kế đặc biệt cho thị trường Việt Nam với Zalo OA platform.
            </p>
          </div>

          <div className='bg-blue-500/10 border border-blue-500/20 rounded-xl p-4'>
            <h3 className='text-blue-300 font-semibold mb-2 flex items-center space-x-2'>
              <span>📱</span>
              <span>Mobile First</span>
            </h3>
            <p className='text-blue-200 text-sm'>
              Hoạt động hoàn hảo trên điện thoại, phù hợp với thói quen người Việt.
            </p>
          </div>

          <div className='bg-green-500/10 border border-green-500/20 rounded-xl p-4'>
            <h3 className='text-green-300 font-semibold mb-2 flex items-center space-x-2'>
              <span>💼</span>
              <span>Doanh Nghiệp</span>
            </h3>
            <p className='text-green-200 text-sm'>
              Hỗ trợ đầy đủ tính năng doanh nghiệp: templates, broadcasting, analytics.
            </p>
          </div>
        </div>
      </div>

      {/* Setup Wizard Modal */}
      {showSetupWizard && selectedAgent && (
        <div className='fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4'>
          <div className='bg-gray-900/90 backdrop-blur-xl rounded-2xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-white/20'>
            <div className='flex justify-between items-center mb-6'>
              <h3 className='text-xl font-bold text-white'>
                Thiết Lập Zalo OA Bot: {selectedAgent.name}
              </h3>
              <button
                onClick={() => setShowSetupWizard(false)}
                className='text-gray-400 hover:text-white text-2xl'
              >
                ✕
              </button>
            </div>

            <StepIndicator />

            {/* Step 1: Business Info */}
            {currentStep === 1 && (
              <div className='space-y-6'>
                <div className='text-center mb-6'>
                  <h4 className='text-xl font-bold text-white mb-2'>🏢 Thông Tin Doanh Nghiệp</h4>
                  <p className='text-gray-400'>Thông tin này sẽ được sử dụng để đăng ký Zalo OA</p>
                </div>

                <div>
                  <label className='block text-white font-medium mb-2'>
                    Tên Doanh Nghiệp/Cửa Hàng
                  </label>
                  <input
                    type='text'
                    value={config.businessName}
                    onChange={e => setConfig(prev => ({ ...prev, businessName: e.target.value }))}
                    className='w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white'
                    placeholder='VD: Cửa hàng ABC, Công ty XYZ...'
                  />
                </div>

                <div>
                  <label className='block text-white font-medium mb-2'>Lĩnh Vực Kinh Doanh</label>
                  <select
                    value={config.businessCategory}
                    onChange={e =>
                      setConfig(prev => ({ ...prev, businessCategory: e.target.value }))
                    }
                    className='w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white'
                  >
                    {businessCategories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className='block text-white font-medium mb-2'>
                    Số Điện Thoại Kinh Doanh
                  </label>
                  <input
                    type='tel'
                    value={config.contactPhone}
                    onChange={e => setConfig(prev => ({ ...prev, contactPhone: e.target.value }))}
                    className='w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white'
                    placeholder='0901234567'
                  />
                </div>

                <div>
                  <label className='block text-white font-medium mb-2'>Địa Chỉ Kinh Doanh</label>
                  <input
                    type='text'
                    value={config.businessAddress}
                    onChange={e =>
                      setConfig(prev => ({ ...prev, businessAddress: e.target.value }))
                    }
                    className='w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white'
                    placeholder='123 Đường ABC, Phường XYZ, Quận 1, TP.HCM'
                  />
                </div>

                <div>
                  <label className='block text-white font-medium mb-2'>Giờ Hoạt Động</label>
                  <input
                    type='text'
                    value={config.businessHours}
                    onChange={e => setConfig(prev => ({ ...prev, businessHours: e.target.value }))}
                    className='w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white'
                    placeholder='Thứ 2 - Thứ 6: 8:00 - 18:00'
                  />
                </div>

                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={!config.businessName || !config.contactPhone || !config.businessAddress}
                  className='w-full bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white py-3 rounded-lg transition-colors font-medium'
                >
                  Tiếp Theo: Cài Đặt Bot →
                </button>
              </div>
            )}

            {/* Step 2: Bot Configuration */}
            {currentStep === 2 && (
              <div className='space-y-6'>
                <div className='text-center mb-6'>
                  <h4 className='text-xl font-bold text-white mb-2'>AI Cài Đặt Zalo Bot</h4>
                  <p className='text-gray-400'>
                    Tùy chỉnh cách bot tương tác với khách hàng trên Zalo
                  </p>
                </div>

                <div>
                  <label className='block text-white font-medium mb-2'>Tin Nhắn Chào</label>
                  <textarea
                    value={config.greeting}
                    onChange={e => setConfig(prev => ({ ...prev, greeting: e.target.value }))}
                    className='w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white h-20'
                    placeholder='Xin chào! Rất vui được hỗ trợ bạn...'
                  />
                </div>

                <div>
                  <div className='flex justify-between items-center mb-2'>
                    <label className='block text-white font-medium'>Câu Trả Lời Nhanh</label>
                    <button
                      onClick={addQuickReply}
                      className='bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm'
                    >
                      + Thêm
                    </button>
                  </div>
                  <div className='space-y-2'>
                    {config.quickReplies.map((reply, index) => (
                      <div key={index} className='flex space-x-2'>
                        <input
                          type='text'
                          value={reply}
                          onChange={e => updateQuickReply(index, e.target.value)}
                          className='flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white'
                          placeholder='Câu trả lời nhanh...'
                        />
                        <button
                          onClick={() => removeQuickReply(index)}
                          className='bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded'
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <label className='flex items-center space-x-3'>
                    <input
                      type='checkbox'
                      checked={config.autoReply}
                      onChange={e => setConfig(prev => ({ ...prev, autoReply: e.target.checked }))}
                      className='rounded border-gray-600 bg-gray-800 text-purple-500'
                    />
                    <span className='text-white'>Tự động trả lời tin nhắn</span>
                  </label>

                  <label className='flex items-center space-x-3'>
                    <input
                      type='checkbox'
                      checked={config.enableTemplates}
                      onChange={e =>
                        setConfig(prev => ({ ...prev, enableTemplates: e.target.checked }))
                      }
                      className='rounded border-gray-600 bg-gray-800 text-purple-500'
                    />
                    <span className='text-white'>Sử dụng template messages</span>
                  </label>
                </div>

                <div className='flex space-x-4'>
                  <button
                    onClick={() => setCurrentStep(1)}
                    className='flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg transition-colors'
                  >
                    ← Quay Lại
                  </button>
                  <button
                    onClick={() => setCurrentStep(3)}
                    className='flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg transition-colors font-medium'
                  >
                    Xem Trước →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Preview */}
            {currentStep === 3 && (
              <div className='space-y-6'>
                <div className='text-center mb-6'>
                  <h4 className='text-xl font-bold text-white mb-2'>👀 Xem Trước Zalo OA Bot</h4>
                  <p className='text-gray-400'>Kiểm tra bot trước khi thiết lập</p>
                </div>

                <div className='bg-gray-800 rounded-xl p-6 border-2 border-dashed border-gray-600'>
                  <h5 className='text-white font-medium mb-4'>
                    Bot sẽ hoạt động như thế này trên Zalo OA:
                  </h5>

                  <div className='bg-blue-50 rounded-lg p-4 text-black'>
                    <div className='flex items-center space-x-2 mb-4 pb-2 border-b border-gray-200'>
                      <div className='w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold'>
                        {config.businessName.charAt(0) || 'B'}
                      </div>
                      <div>
                        <div className='font-semibold text-sm'>
                          {config.businessName || 'Your Business'}
                        </div>
                        <div className='text-xs text-gray-500'>
                          Official Account • Đang hoạt động
                        </div>
                      </div>
                      <div className='ml-auto'>
                        <span className='bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full'>
                          {businessCategories.find(c => c.value === config.businessCategory)?.label}
                        </span>
                      </div>
                    </div>

                    <div className='space-y-3'>
                      <div className='bg-purple-500 text-white p-3 rounded-lg max-w-xs'>
                        {config.greeting}
                      </div>

                      <div className='text-xs text-gray-500 mb-2'>Hành động gợi ý:</div>
                      <div className='flex flex-wrap gap-2'>
                        {config.quickReplies
                          .filter(reply => reply.trim())
                          .map((reply, index) => (
                            <button
                              key={index}
                              className='bg-white border border-purple-300 text-purple-600 px-3 py-1 rounded-full text-sm hover:bg-purple-50'
                            >
                              {reply}
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='bg-gray-800 rounded-xl p-4'>
                    <h5 className='text-white font-medium mb-2'>🏢 Thông Tin OA</h5>
                    <div className='space-y-2 text-sm'>
                      <div>
                        <span className='text-gray-400'>Tên:</span>{' '}
                        <span className='text-white'>{config.businessName}</span>
                      </div>
                      <div>
                        <span className='text-gray-400'>Lĩnh vực:</span>{' '}
                        <span className='text-white'>
                          {businessCategories.find(c => c.value === config.businessCategory)?.label}
                        </span>
                      </div>
                      <div>
                        <span className='text-gray-400'>Điện thoại:</span>{' '}
                        <span className='text-white'>{config.contactPhone}</span>
                      </div>
                      <div>
                        <span className='text-gray-400'>Địa chỉ:</span>{' '}
                        <span className='text-white'>{config.businessAddress}</span>
                      </div>
                    </div>
                  </div>

                  <div className='bg-gray-800 rounded-xl p-4'>
                    <h5 className='text-white font-medium mb-2'>AI Cài Đặt Bot</h5>
                    <div className='space-y-2 text-sm'>
                      <div>
                        <span className='text-gray-400'>Tự động trả lời:</span>{' '}
                        <span className='text-white'>{config.autoReply ? 'Bật' : 'Tắt'}</span>
                      </div>
                      <div>
                        <span className='text-gray-400'>Template messages:</span>{' '}
                        <span className='text-white'>{config.enableTemplates ? 'Bật' : 'Tắt'}</span>
                      </div>
                      <div>
                        <span className='text-gray-400'>Giờ hoạt động:</span>{' '}
                        <span className='text-white'>{config.businessHours}</span>
                      </div>
                      <div>
                        <span className='text-gray-400'>Quick replies:</span>{' '}
                        <span className='text-white'>
                          {config.quickReplies.filter(r => r.trim()).length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className='flex space-x-4'>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className='flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg transition-colors'
                  >
                    ← Chỉnh Sửa
                  </button>
                  <button
                    onClick={generateConnectionInfo}
                    className='flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg transition-colors font-medium'
                  >
                    Tạo Hướng Dẫn Kết Nối →
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Connection Guide */}
            {currentStep === 4 && connectionInfo && (
              <div className='space-y-6'>
                <div className='text-center mb-6'>
                  <h4 className='text-xl font-bold text-white mb-2'>
                    📋 Hướng Dẫn Kết Nối Zalo OA
                  </h4>
                  <p className='text-gray-400'>
                    Làm theo các bước sau để kết nối Zalo Official Account
                  </p>
                </div>

                <div className='space-y-4'>
                  {connectionInfo.setupSteps.map((step: any, index: number) => (
                    <div
                      key={index}
                      className='bg-gray-800 rounded-xl p-4 border-l-4 border-purple-500'
                    >
                      <div className='flex items-start space-x-3'>
                        <div className='w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0'>
                          {index + 1}
                        </div>
                        <div className='flex-1'>
                          <h5 className='text-white font-medium mb-1'>{step.title}</h5>
                          <p className='text-gray-400 text-sm mb-2'>{step.description}</p>
                          <div className='bg-gray-900 rounded p-2 text-gray-300 text-sm mb-2'>
                            <strong>Hành động:</strong> {step.action}
                          </div>
                          {step.details && (
                            <div className='bg-purple-500/10 rounded p-2'>
                              <div className='text-purple-300 text-xs font-medium mb-1'>
                                Chi tiết:
                              </div>
                              <ul className='text-purple-200 text-xs space-y-1'>
                                {step.details.map((detail: string, i: number) => (
                                  <li key={i}>• {detail}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='bg-green-500/10 border border-green-500/20 rounded-xl p-4'>
                    <h5 className='text-green-300 font-semibold mb-3'>🔗 Thông Tin Kết Nối</h5>
                    <div className='space-y-2 text-sm'>
                      <div className='flex justify-between'>
                        <span className='text-gray-400'>Webhook URL:</span>
                        <button
                          onClick={() => copyToClipboard(connectionInfo.webhookUrl, 'Webhook URL')}
                          className='text-green-300 hover:text-green-200'
                        >
                          📋 Copy
                        </button>
                      </div>
                      <div className='bg-black rounded p-2 text-green-300 text-xs break-all'>
                        {connectionInfo.webhookUrl}
                      </div>

                      <div className='flex justify-between'>
                        <span className='text-gray-400'>Secret Key:</span>
                        <button
                          onClick={() => copyToClipboard(connectionInfo.secretKey, 'Secret Key')}
                          className='text-green-300 hover:text-green-200'
                        >
                          📋 Copy
                        </button>
                      </div>
                      <div className='bg-black rounded p-2 text-green-300 text-xs break-all'>
                        {connectionInfo.secretKey}
                      </div>
                    </div>
                  </div>

                  <div className='bg-purple-500/10 border border-purple-500/20 rounded-xl p-4'>
                    <h5 className='text-purple-300 font-semibold mb-3'>⚠️ Lưu Ý Quan Trọng</h5>
                    <ul className='text-purple-200 text-sm space-y-1'>
                      <li>• Cần giấy phép kinh doanh hợp lệ</li>
                      <li>• Quá trình xác minh OA mất 1-3 ngày</li>
                      <li>• Bảo mật Secret Key và App credentials</li>
                      <li>• Tuân thủ chính sách Zalo OA</li>
                      <li>• Test kỹ trước khi đưa vào sử dụng</li>
                    </ul>
                  </div>
                </div>

                <div className='bg-blue-500/10 border border-blue-500/20 rounded-xl p-4'>
                  <h5 className='text-blue-300 font-medium mb-2'>🎯 Template Messages Được Tạo</h5>
                  <div className='space-y-2'>
                    {connectionInfo.templateMessages.map((template: any, index: number) => (
                      <div key={index} className='bg-gray-800 rounded p-2 text-sm'>
                        <div className='text-blue-300 font-medium'>{template.name}:</div>
                        <div className='text-gray-300 italic'>"{template.content}"</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className='flex space-x-4'>
                  <button
                    onClick={downloadSetupGuide}
                    className='flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg transition-colors font-medium'
                  >
                    📄 Tải Hướng Dẫn Chi Tiết
                  </button>
                  <button
                    onClick={() => {
                      setShowSetupWizard(false);
                      setCurrentStep(1);
                      setConnectionInfo(null);
                    }}
                    className='flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg transition-colors font-medium'
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
