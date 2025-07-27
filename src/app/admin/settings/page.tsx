'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import {
  Settings,
  Mail,
  CreditCard,
  Key,
  Globe,
  Shield,
  Bell,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  AlertTriangle,
  Database,
  Server,
  Zap,
  MessageSquare,
  DollarSign,
  Lock,
  TestTube,
  FileText,
  Upload,
} from 'lucide-react';
import { hasPermission, type UserRole } from '@/lib/permissions';

interface SystemSettings {
  // Email Settings
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  smtpFromEmail: string;
  smtpFromName: string;

  // Payment Settings
  stripePublicKey: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  paypalClientId: string;
  paypalClientSecret: string;

  // API Settings
  openaiApiKey: string;
  anthropicApiKey: string;
  maxApiCallsPerUser: number;

  // System Settings
  siteName: string;
  siteDescription: string;
  logoUrl: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;

  // Notification Settings
  emailNotificationsEnabled: boolean;
  slackWebhookUrl: string;
  discordWebhookUrl: string;

  // Bank Transfer Template Settings
  bankTransferTemplateActive: boolean;
  bankName: string;
  accountName: string;
  accountNumber: string;
  bankBranch: string;
  qrCodeImageUrl: string;
}

export default function SystemSettingsPage() {
  const { data: session } = useSession();
  const currentUserRole = session?.user?.role as UserRole;

  const [settings, setSettings] = useState<SystemSettings>({
    // Email Settings
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    smtpFromEmail: '',
    smtpFromName: 'VIEAgent',

    // Payment Settings
    stripePublicKey: '',
    stripeSecretKey: '',
    stripeWebhookSecret: '',
    paypalClientId: '',
    paypalClientSecret: '',

    // API Settings
    openaiApiKey: '',
    anthropicApiKey: '',
    maxApiCallsPerUser: 10000,

    // System Settings
    siteName: 'VIEAgent',
    siteDescription: 'Nền tảng quản lý AI Agent tiên tiến',
    logoUrl: '',
    maintenanceMode: false,
    registrationEnabled: true,

    // Notification Settings
    emailNotificationsEnabled: true,
    slackWebhookUrl: '',
    discordWebhookUrl: '',

    // Bank Transfer Template Settings
    bankTransferTemplateActive: false,
    bankName: '',
    accountName: '',
    accountNumber: '',
    bankBranch: '',
    qrCodeImageUrl: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [uploadingQR, setUploadingQR] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<
    'email' | 'payment' | 'api' | 'system' | 'notifications' | 'templates'
  >('email');

  // Permissions
  const canManageSettings = hasPermission(currentUserRole, 'manage_system_settings');

  useEffect(() => {
    if (canManageSettings) {
      fetchSettings();
    }
  }, [canManageSettings]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      const result = await response.json();

      if (result.success && result.data) {
        // Ensure all values are not null/undefined to avoid React input errors
        const cleanedData = { ...result.data };
        Object.keys(cleanedData).forEach(key => {
          if (cleanedData[key] === null || cleanedData[key] === undefined) {
            // Set default values based on expected type
            if (typeof settings[key as keyof SystemSettings] === 'string') {
              cleanedData[key] = '';
            } else if (typeof settings[key as keyof SystemSettings] === 'number') {
              cleanedData[key] = 0;
            } else if (typeof settings[key as keyof SystemSettings] === 'boolean') {
              cleanedData[key] = false;
            }
          }
        });
        setSettings(cleanedData);
      }
    } catch (error) {
      toast.error('Không thể tải cài đặt hệ thống');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('✅ Cài đặt đã được lưu thành công!');
      } else {
        toast.error(result.error || 'Không thể lưu cài đặt');
      }
    } catch (error) {
      toast.error('Lỗi kết nối mạng');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (key: keyof SystemSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const testEmailSettings = async () => {
    setTesting(true);
    try {
      const response = await fetch('/api/admin/settings/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpHost: settings.smtpHost,
          smtpPort: settings.smtpPort,
          smtpUser: settings.smtpUser,
          smtpPassword: settings.smtpPassword,
          smtpFromEmail: settings.smtpFromEmail,
          smtpFromName: settings.smtpFromName,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('✅ Email test đã được gửi thành công!');
      } else {
        toast.error(result.error || 'Kiểm tra email thất bại');
      }
    } catch (error) {
      toast.error('Không thể kiểm tra cài đặt email');
    } finally {
      setTesting(false);
    }
  };

  const handleQRImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('❌ Chỉ được upload file hình ảnh');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('❌ File không được vượt quá 5MB');
      return;
    }

    setUploadingQR(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        handleInputChange('qrCodeImageUrl', result.fileUrl);
        toast.success('✅ QR Code đã được upload thành công!');
      } else {
        toast.error(result.error || 'Không thể upload QR Code');
      }
    } catch (error) {
      toast.error('Lỗi khi upload QR Code');
    } finally {
      setUploadingQR(false);
    }
  };

  if (!canManageSettings) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center'>
        <div className='text-center'>
          <Lock className='w-16 h-16 text-red-400 mx-auto mb-4' />
          <h1 className='text-2xl font-bold text-white mb-2'>🚫 Không có quyền truy cập</h1>
          <p className='text-gray-400'>Bạn không có quyền truy cập cài đặt hệ thống.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-white'>Đang tải cài đặt hệ thống...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900'>
      <div className='container mx-auto px-4 py-8'>
        {/* Header */}
        <div className='text-center mb-8'>
          <h1 className='text-4xl font-bold text-white mb-4 flex items-center justify-center space-x-3'>
            <Settings className='w-10 h-10' />
            <span>⚙️ Cài đặt hệ thống</span>
          </h1>
          <p className='text-xl text-gray-300'>Cấu hình nền tảng và tích hợp hệ thống</p>
        </div>

        {/* Tabs */}
        <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-2 mb-8 border border-white/10 max-w-4xl mx-auto'>
          <div className='flex space-x-2 overflow-x-auto'>
            {[
              { key: 'email', label: '📧 Email', icon: Mail },
              { key: 'payment', label: '💳 Thanh toán', icon: CreditCard },
              { key: 'api', label: '🔑 API Keys', icon: Key },
              { key: 'system', label: '🌐 Hệ thống', icon: Globe },
              { key: 'notifications', label: '🔔 Thông báo', icon: Bell },
              { key: 'templates', label: '🏦 Templates', icon: FileText },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-2xl transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <tab.icon className='w-5 h-5' />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className='max-w-4xl mx-auto'>
          {/* Email Settings */}
          {activeTab === 'email' && (
            <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10'>
              <div className='flex items-center justify-between mb-6'>
                <h3 className='text-2xl font-bold text-white flex items-center space-x-3'>
                  <Mail className='w-8 h-8' />
                  <span>📧 Cấu hình Email</span>
                </h3>
                <button
                  onClick={testEmailSettings}
                  disabled={testing}
                  className='bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2'
                >
                  <TestTube className={`w-4 h-4 ${testing ? 'animate-pulse' : ''}`} />
                  <span>{testing ? 'Đang test...' : '🧪 Test Email'}</span>
                </button>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>
                    🏢 SMTP Host
                  </label>
                  <input
                    type='text'
                    value={settings.smtpHost || ''}
                    onChange={e => handleInputChange('smtpHost', e.target.value)}
                    className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500'
                    placeholder='smtp.gmail.com'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>
                    🔌 SMTP Port
                  </label>
                  <input
                    type='number'
                    value={settings.smtpPort}
                    onChange={e => handleInputChange('smtpPort', parseInt(e.target.value))}
                    className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500'
                    placeholder='587'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>
                    👤 SMTP Username
                  </label>
                  <input
                    type='text'
                    value={settings.smtpUser || ''}
                    onChange={e => handleInputChange('smtpUser', e.target.value)}
                    className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500'
                    placeholder='your-email@gmail.com'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>
                    🔐 SMTP Password
                  </label>
                  <div className='relative'>
                    <input
                      type={showPasswords.smtpPassword ? 'text' : 'password'}
                      value={settings.smtpPassword || ''}
                      onChange={e => handleInputChange('smtpPassword', e.target.value)}
                      className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-purple-500'
                      placeholder='App password'
                    />
                    <button
                      type='button'
                      onClick={() => togglePasswordVisibility('smtpPassword')}
                      className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white'
                    >
                      {showPasswords.smtpPassword ? (
                        <EyeOff className='w-5 h-5' />
                      ) : (
                        <Eye className='w-5 h-5' />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>
                    📧 From Email
                  </label>
                  <input
                    type='email'
                    value={settings.smtpFromEmail || ''}
                    onChange={e => handleInputChange('smtpFromEmail', e.target.value)}
                    className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500'
                    placeholder='noreply@yourdomain.com'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>
                    🏷️ From Name
                  </label>
                  <input
                    type='text'
                    value={settings.smtpFromName || ''}
                    onChange={e => handleInputChange('smtpFromName', e.target.value)}
                    className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500'
                    placeholder='VIEAgent'
                  />
                </div>
              </div>

              <div className='mt-6 bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4'>
                <p className='text-blue-300 text-sm'>
                  💡 <strong>Lưu ý:</strong> Sử dụng App Password cho Gmail thay vì mật khẩu thường.
                  Đối với các dịch vụ email khác, cấu hình SMTP phù hợp.
                </p>
              </div>
            </div>
          )}

          {/* Payment Settings */}
          {activeTab === 'payment' && (
            <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10'>
              <h3 className='text-2xl font-bold text-white mb-6 flex items-center space-x-3'>
                <CreditCard className='w-8 h-8' />
                <span>💳 Cấu hình Payment Gateway</span>
              </h3>

              {/* Stripe Settings */}
              <div className='mb-8'>
                <h4 className='text-xl font-semibold text-white mb-4 flex items-center space-x-2'>
                  <div className='w-6 h-6 bg-blue-600 rounded flex items-center justify-center'>
                    <span className='text-white text-xs font-bold'>S</span>
                  </div>
                  <span>🔷 Stripe Configuration</span>
                </h4>

                <div className='grid grid-cols-1 gap-6'>
                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      🔑 Stripe Public Key
                    </label>
                    <input
                      type='text'
                      value={settings.stripePublicKey}
                      onChange={e => handleInputChange('stripePublicKey', e.target.value)}
                      className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500'
                      placeholder='pk_test_...'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      🔐 Stripe Secret Key
                    </label>
                    <div className='relative'>
                      <input
                        type={showPasswords.stripeSecret ? 'text' : 'password'}
                        value={settings.stripeSecretKey}
                        onChange={e => handleInputChange('stripeSecretKey', e.target.value)}
                        className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-purple-500'
                        placeholder='sk_test_...'
                      />
                      <button
                        type='button'
                        onClick={() => togglePasswordVisibility('stripeSecret')}
                        className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white'
                      >
                        {showPasswords.stripeSecret ? (
                          <EyeOff className='w-5 h-5' />
                        ) : (
                          <Eye className='w-5 h-5' />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      🪝 Stripe Webhook Secret
                    </label>
                    <div className='relative'>
                      <input
                        type={showPasswords.stripeWebhook ? 'text' : 'password'}
                        value={settings.stripeWebhookSecret}
                        onChange={e => handleInputChange('stripeWebhookSecret', e.target.value)}
                        className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-purple-500'
                        placeholder='whsec_...'
                      />
                      <button
                        type='button'
                        onClick={() => togglePasswordVisibility('stripeWebhook')}
                        className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white'
                      >
                        {showPasswords.stripeWebhook ? (
                          <EyeOff className='w-5 h-5' />
                        ) : (
                          <Eye className='w-5 h-5' />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* PayPal Settings */}
              <div>
                <h4 className='text-xl font-semibold text-white mb-4 flex items-center space-x-2'>
                  <div className='w-6 h-6 bg-yellow-500 rounded flex items-center justify-center'>
                    <span className='text-white text-xs font-bold'>P</span>
                  </div>
                  <span>💛 PayPal Configuration</span>
                </h4>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      🆔 PayPal Client ID
                    </label>
                    <input
                      type='text'
                      value={settings.paypalClientId}
                      onChange={e => handleInputChange('paypalClientId', e.target.value)}
                      className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500'
                      placeholder='PayPal Client ID'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      🔐 PayPal Client Secret
                    </label>
                    <div className='relative'>
                      <input
                        type={showPasswords.paypalSecret ? 'text' : 'password'}
                        value={settings.paypalClientSecret}
                        onChange={e => handleInputChange('paypalClientSecret', e.target.value)}
                        className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-purple-500'
                        placeholder='PayPal Client Secret'
                      />
                      <button
                        type='button'
                        onClick={() => togglePasswordVisibility('paypalSecret')}
                        className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white'
                      >
                        {showPasswords.paypalSecret ? (
                          <EyeOff className='w-5 h-5' />
                        ) : (
                          <Eye className='w-5 h-5' />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* API Settings */}
          {activeTab === 'api' && (
            <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10'>
              <h3 className='text-2xl font-bold text-white mb-6 flex items-center space-x-3'>
                <Key className='w-8 h-8' />
                <span>🔑 Cấu hình API</span>
              </h3>

              <div className='space-y-6'>
                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>
                    OpenAI API Key
                  </label>
                  <div className='relative'>
                    <input
                      type={showPasswords.openaiKey ? 'text' : 'password'}
                      value={settings.openaiApiKey}
                      onChange={e => handleInputChange('openaiApiKey', e.target.value)}
                      className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-purple-500'
                      placeholder='sk-...'
                    />
                    <button
                      type='button'
                      onClick={() => togglePasswordVisibility('openaiKey')}
                      className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white'
                    >
                      {showPasswords.openaiKey ? (
                        <EyeOff className='w-5 h-5' />
                      ) : (
                        <Eye className='w-5 h-5' />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>
                    🧠 Anthropic API Key
                  </label>
                  <div className='relative'>
                    <input
                      type={showPasswords.anthropicKey ? 'text' : 'password'}
                      value={settings.anthropicApiKey}
                      onChange={e => handleInputChange('anthropicApiKey', e.target.value)}
                      className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-purple-500'
                      placeholder='sk-ant-...'
                    />
                    <button
                      type='button'
                      onClick={() => togglePasswordVisibility('anthropicKey')}
                      className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white'
                    >
                      {showPasswords.anthropicKey ? (
                        <EyeOff className='w-5 h-5' />
                      ) : (
                        <Eye className='w-5 h-5' />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>
                    🔢 Max API Calls Per User
                  </label>
                  <input
                    type='number'
                    value={settings.maxApiCallsPerUser}
                    onChange={e =>
                      handleInputChange('maxApiCallsPerUser', parseInt(e.target.value))
                    }
                    className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500'
                    placeholder='10000'
                  />
                </div>
              </div>

              <div className='mt-6 bg-green-500/10 border border-green-500/30 rounded-2xl p-4'>
                <p className='text-green-300 text-sm'>
                  🔒 <strong>Bảo mật:</strong> API keys được mã hóa trước khi lưu trữ. Chỉ hiển thị
                  dấu ••• để bảo vệ thông tin nhạy cảm.
                </p>
              </div>
            </div>
          )}

          {/* System Settings */}
          {activeTab === 'system' && (
            <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10'>
              <h3 className='text-2xl font-bold text-white mb-6 flex items-center space-x-3'>
                <Globe className='w-8 h-8' />
                <span>🌐 Cấu hình hệ thống</span>
              </h3>

              <div className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      🏷️ Tên website
                    </label>
                    <input
                      type='text'
                      value={settings.siteName}
                      onChange={e => handleInputChange('siteName', e.target.value)}
                      className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500'
                      placeholder='VIEAgent'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      🖼️ Logo URL
                    </label>
                    <input
                      type='url'
                      value={settings.logoUrl}
                      onChange={e => handleInputChange('logoUrl', e.target.value)}
                      className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500'
                      placeholder='https://example.com/logo.png'
                    />
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>
                    📝 Mô tả website
                  </label>
                  <textarea
                    value={settings.siteDescription}
                    onChange={e => handleInputChange('siteDescription', e.target.value)}
                    rows={3}
                    className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500'
                    placeholder='Nền tảng quản lý AI Agent tiên tiến'
                  />
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='flex items-center justify-between p-4 bg-white/5 rounded-2xl'>
                    <div>
                      <h4 className='text-white font-semibold'>🚧 Chế độ bảo trì</h4>
                      <p className='text-gray-400 text-sm'>Đưa website vào chế độ bảo trì</p>
                    </div>
                    <label className='relative inline-flex items-center cursor-pointer'>
                      <input
                        type='checkbox'
                        checked={settings.maintenanceMode}
                        onChange={e => handleInputChange('maintenanceMode', e.target.checked)}
                        className='sr-only peer'
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>

                  <div className='flex items-center justify-between p-4 bg-white/5 rounded-2xl'>
                    <div>
                      <h4 className='text-white font-semibold'>👥 Đăng ký người dùng</h4>
                      <p className='text-gray-400 text-sm'>Cho phép đăng ký người dùng mới</p>
                    </div>
                    <label className='relative inline-flex items-center cursor-pointer'>
                      <input
                        type='checkbox'
                        checked={settings.registrationEnabled}
                        onChange={e => handleInputChange('registrationEnabled', e.target.checked)}
                        className='sr-only peer'
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                </div>

                {settings.maintenanceMode && (
                  <div className='bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4'>
                    <div className='flex items-center space-x-3 text-yellow-300'>
                      <AlertTriangle className='w-5 h-5' />
                      <div>
                        <p className='font-semibold'>⚠️ Chế độ bảo trì đang bật</p>
                        <p className='text-sm opacity-80'>
                          Website hiện đang ở chế độ bảo trì. Chỉ admin mới có thể truy cập.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10'>
              <h3 className='text-2xl font-bold text-white mb-6 flex items-center space-x-3'>
                <Bell className='w-8 h-8' />
                <span>🔔 Cấu hình thông báo</span>
              </h3>

              <div className='space-y-6'>
                <div className='flex items-center justify-between p-4 bg-white/5 rounded-2xl'>
                  <div>
                    <h4 className='text-white font-semibold'>📧 Email notifications</h4>
                    <p className='text-gray-400 text-sm'>
                      Bật thông báo email cho sự kiện hệ thống
                    </p>
                  </div>
                  <label className='relative inline-flex items-center cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={settings.emailNotificationsEnabled}
                      onChange={e =>
                        handleInputChange('emailNotificationsEnabled', e.target.checked)
                      }
                      className='sr-only peer'
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>
                    💬 Slack Webhook URL
                  </label>
                  <input
                    type='url'
                    value={settings.slackWebhookUrl}
                    onChange={e => handleInputChange('slackWebhookUrl', e.target.value)}
                    className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500'
                    placeholder='https://hooks.slack.com/services/...'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>
                    🎮 Discord Webhook URL
                  </label>
                  <input
                    type='url'
                    value={settings.discordWebhookUrl}
                    onChange={e => handleInputChange('discordWebhookUrl', e.target.value)}
                    className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500'
                    placeholder='https://discord.com/api/webhooks/...'
                  />
                </div>
              </div>

              <div className='mt-6 bg-purple-500/10 border border-purple-500/30 rounded-2xl p-4'>
                <p className='text-purple-300 text-sm'>
                  🔗 <strong>Webhooks:</strong> Sử dụng webhooks để nhận thông báo real-time về các
                  sự kiện quan trọng như thanh toán, đăng ký người dùng mới.
                </p>
              </div>
            </div>
          )}

          {/* Templates Settings */}
          {activeTab === 'templates' && (
            <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10'>
              <div className='flex items-center justify-between mb-6'>
                <h3 className='text-2xl font-bold text-white flex items-center space-x-3'>
                  <FileText className='w-8 h-8' />
                  <span>🏦 Bank Transfer Templates</span>
                </h3>

                {/* Active Toggle */}
                <div className='flex items-center space-x-3'>
                  <span
                    className={`text-sm font-medium ${settings.bankTransferTemplateActive ? 'text-green-300' : 'text-gray-400'}`}
                  >
                    {settings.bankTransferTemplateActive ? '🟢 Active' : '⚫ Inactive'}
                  </span>
                  <label className='relative inline-flex items-center cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={settings.bankTransferTemplateActive}
                      onChange={e =>
                        handleInputChange('bankTransferTemplateActive', e.target.checked)
                      }
                      className='sr-only peer'
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
              </div>

              {settings.bankTransferTemplateActive && (
                <div className='mb-6 bg-green-500/10 border border-green-500/30 rounded-2xl p-4'>
                  <div className='flex items-center space-x-3 text-green-300'>
                    <div className='w-3 h-3 bg-green-500 rounded-full animate-pulse'></div>
                    <div>
                      <p className='font-semibold'>✅ Bank Transfer Template đang hoạt động</p>
                      <p className='text-sm opacity-80'>
                        Template sẽ được sử dụng tự động khi Stripe/PayPal gặp lỗi
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className='space-y-6'>
                {/* Bank Information Form */}
                <div className='bg-white/5 rounded-2xl p-6'>
                  <h4 className='text-xl font-semibold text-white mb-4 flex items-center space-x-2'>
                    <div className='w-6 h-6 bg-green-600 rounded flex items-center justify-center'>
                      <span className='text-white text-xs font-bold'>B</span>
                    </div>
                    <span>🏦 Thông tin ngân hàng</span>
                  </h4>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div>
                      <label className='block text-sm font-medium text-gray-300 mb-2'>
                        🏢 Tên ngân hàng
                      </label>
                      <input
                        type='text'
                        value={settings.bankName}
                        onChange={e => handleInputChange('bankName', e.target.value)}
                        className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500'
                        placeholder='Ngân hàng TMCP Công Thương Việt Nam'
                      />
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-300 mb-2'>
                        🏷️ Tên tài khoản
                      </label>
                      <input
                        type='text'
                        value={settings.accountName}
                        onChange={e => handleInputChange('accountName', e.target.value)}
                        className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500'
                        placeholder='NGUYEN VAN A'
                      />
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-300 mb-2'>
                        🔢 Số tài khoản
                      </label>
                      <input
                        type='text'
                        value={settings.accountNumber}
                        onChange={e => handleInputChange('accountNumber', e.target.value)}
                        className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500'
                        placeholder='123456789012345'
                      />
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-300 mb-2'>
                        🏪 Chi nhánh
                      </label>
                      <input
                        type='text'
                        value={settings.bankBranch}
                        onChange={e => handleInputChange('bankBranch', e.target.value)}
                        className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500'
                        placeholder='Chi nhánh Hà Nội'
                      />
                    </div>
                  </div>
                </div>

                {/* Template Preview */}
                <div className='bg-white/5 rounded-2xl p-6'>
                  <h4 className='text-xl font-semibold text-white mb-4 flex items-center space-x-2'>
                    <div className='w-6 h-6 bg-blue-600 rounded flex items-center justify-center'>
                      <span className='text-white text-xs font-bold'>T</span>
                    </div>
                    <span>📋 Template Preview</span>
                  </h4>

                  <div className='bg-gray-800/50 rounded-xl p-4 border border-gray-600'>
                    <div className='text-gray-300 space-y-2 font-mono text-sm'>
                      <div>
                        <span className='text-yellow-400'>🏦 Ngân hàng:</span>{' '}
                        {settings.bankName || 'Chưa cấu hình'}
                      </div>
                      <div>
                        <span className='text-yellow-400'>👤 Tên TK:</span>{' '}
                        {settings.accountName || 'Chưa cấu hình'}
                      </div>
                      <div>
                        <span className='text-yellow-400'>🔢 Số TK:</span>{' '}
                        {settings.accountNumber || 'Chưa cấu hình'}
                      </div>
                      <div>
                        <span className='text-yellow-400'>🏪 Chi nhánh:</span>{' '}
                        {settings.bankBranch || 'Chưa cấu hình'}
                      </div>
                      <div>
                        <span className='text-yellow-400'>💰 Số tiền:</span> [AMOUNT] VND
                      </div>
                      <div>
                        <span className='text-yellow-400'>📝 Nội dung:</span> [CONTENT]
                      </div>
                    </div>
                  </div>
                </div>

                {/* QR Code Upload Section */}
                <div className='bg-white/5 rounded-2xl p-6'>
                  <h4 className='text-xl font-semibold text-white mb-4 flex items-center space-x-2'>
                    <div className='w-6 h-6 bg-purple-600 rounded flex items-center justify-center'>
                      <span className='text-white text-xs font-bold'>Q</span>
                    </div>
                    <span>📱 QR Code thanh toán</span>
                  </h4>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    {/* Upload Section */}
                    <div>
                      <label className='block text-sm font-medium text-gray-300 mb-2'>
                        📸 Upload QR Image
                      </label>
                      <div className='border-2 border-dashed border-gray-600 rounded-xl p-6 text-center hover:border-purple-500 transition-colors'>
                        <input
                          type='file'
                          accept='image/*'
                          onChange={handleQRImageUpload}
                          className='hidden'
                          id='qr-upload'
                        />
                        <label
                          htmlFor='qr-upload'
                          className='cursor-pointer flex flex-col items-center space-y-2'
                        >
                          <div className='w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center'>
                            <Upload className='w-6 h-6 text-white' />
                          </div>
                          <div className='text-white font-medium'>Upload QR Image</div>
                          <div className='text-gray-400 text-sm'>PNG, JPG, GIF (Max 5MB)</div>
                        </label>
                      </div>

                      {uploadingQR && (
                        <div className='mt-3 flex items-center space-x-2 text-yellow-300'>
                          <RefreshCw className='w-4 h-4 animate-spin' />
                          <span className='text-sm'>Đang upload QR code...</span>
                        </div>
                      )}
                    </div>

                    {/* Preview Section */}
                    <div>
                      <label className='block text-sm font-medium text-gray-300 mb-2'>
                        👁️ Preview
                      </label>
                      <div className='bg-gray-800/50 rounded-xl p-4 border border-gray-600 min-h-[200px] flex items-center justify-center'>
                        {settings.qrCodeImageUrl ? (
                          <div className='text-center space-y-3'>
                            {/* ✅ fixed from LINTING_MANUAL_FIXES_NEEDED.md */}
                            <Image
                              src={settings.qrCodeImageUrl}
                              alt='QR Code'
                              width={160}
                              height={160}
                              className='max-w-full max-h-40 mx-auto rounded-lg border border-gray-500'
                            />
                            <div className='text-green-300 text-sm'>✅ QR Code đã upload</div>
                            <button
                              onClick={() => handleInputChange('qrCodeImageUrl', '')}
                              className='text-red-400 hover:text-red-300 text-sm underline'
                            >
                              🗑️ Xóa QR Code
                            </button>
                          </div>
                        ) : (
                          <div className='text-center text-gray-400'>
                            <div className='w-16 h-16 bg-gray-700 rounded-lg mx-auto mb-3 flex items-center justify-center'>
                              <FileText className='w-8 h-8' />
                            </div>
                            <div className='text-sm'>Chưa có QR Code</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Template Actions */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className='bg-green-600 text-white px-4 py-3 rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50'
                  >
                    <Save className='w-5 h-5' />
                    <span>{saving ? 'Đang lưu...' : '💾 Lưu template'}</span>
                  </button>

                  <button className='bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2'>
                    <FileText className='w-5 h-5' />
                    <span>📄 Xuất template</span>
                  </button>
                </div>

                {/* Usage Instructions */}
                <div className='bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4'>
                  <h5 className='text-orange-300 font-semibold mb-2'>📚 Hướng dẫn sử dụng</h5>
                  <ul className='text-orange-200 text-sm space-y-1'>
                    <li>
                      • <strong>Bật template:</strong> Sử dụng toggle ở góc phải để kích hoạt/tắt
                      template
                    </li>
                    <li>
                      • <strong>Tự động fallback:</strong> Template sẽ được sử dụng khi
                      Stripe/PayPal gặp lỗi
                    </li>
                    <li>
                      • <strong>Variables:</strong> [AMOUNT] và [CONTENT] sẽ được thay thế tự động
                      theo đơn hàng
                    </li>
                    <li>
                      • <strong>Xác minh:</strong> Admin có thể xác minh thanh toán thủ công trong
                      trang Payments
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className='mt-8 text-center'>
            <button
              onClick={handleSave}
              disabled={saving}
              className='bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold px-8 py-4 rounded-2xl hover:from-purple-600 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 mx-auto'
            >
              {saving ? (
                <>
                  <RefreshCw className='w-5 h-5 animate-spin' />
                  <span>Đang lưu cài đặt...</span>
                </>
              ) : (
                <>
                  <Save className='w-5 h-5' />
                  <span>💾 Lưu cài đặt</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
