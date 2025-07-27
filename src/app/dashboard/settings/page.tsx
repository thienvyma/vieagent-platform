'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/ui/DashboardLayout';
import toast from 'react-hot-toast';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

interface UserSettings {
  theme: string;
  language: string;
  timezone: string;
  emailNotifications: boolean;
  browserNotifications: boolean;
  weeklyReport: boolean;
  defaultModel: string;
  defaultTemperature: number;
  defaultMaxTokens: number;
  profileVisible: boolean;
  dataSharing: boolean;
  analyticsOptIn: boolean;
}

interface UserStats {
  usage: {
    percentage: number;
    plan: string;
  };
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'dark',
    language: 'vi',
    timezone: 'Asia/Ho_Chi_Minh',
    emailNotifications: true,
    browserNotifications: true,
    weeklyReport: false,
    defaultModel: 'gpt-3.5-turbo',
    defaultTemperature: 0.7,
    defaultMaxTokens: 1000,
    profileVisible: true,
    dataSharing: false,
    analyticsOptIn: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      loadSettings();
      loadUserStats();
    }
  }, [status, router]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/settings');

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setSettings(result.data);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Không thể tải cài đặt');
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      const response = await fetch('/api/user/stats');
      if (response.ok) {
        const result = await response.json();
        // API returns { success: true, data: stats }, extract the data
        if (result.success && result.data) {
          setUserStats(result.data);
        }
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);

    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('✅ Cài đặt đã được lưu thành công!');
      } else {
        toast.error('❌ Không thể lưu cài đặt');
      }
    } catch (error) {
      toast.error('🔌 Lỗi kết nối mạng');
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = async () => {
    setResetting(true);

    try {
      const defaultSettings = {
        theme: 'dark',
        language: 'vi',
        timezone: 'Asia/Ho_Chi_Minh',
        emailNotifications: true,
        browserNotifications: false,
        weeklyReport: true,
        defaultModel: 'gpt-3.5-turbo',
        defaultTemperature: 0.7,
        defaultMaxTokens: 1000,
        profileVisible: false,
        dataSharing: false,
        analyticsOptIn: true,
      };

      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(defaultSettings),
      });

      const result = await response.json();

      if (result.success) {
        setSettings(defaultSettings);
        setShowResetModal(false);
        toast.success('🔄 Cài đặt đã được khôi phục về mặc định!');
      } else {
        toast.error('❌ Không thể khôi phục cài đặt');
      }
    } catch (error) {
      toast.error('🔌 Lỗi kết nối mạng');
    } finally {
      setResetting(false);
    }
  };

  const updateSetting = (key: keyof UserSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const navigateToProfile = () => {
    router.push('/dashboard/profile');
  };

  const validatePassword = (password: string): string => {
    if (password.length < 8) {
      return 'Mật khẩu phải có ít nhất 8 ký tự';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Mật khẩu phải có ít nhất 1 chữ thường';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Mật khẩu phải có ít nhất 1 chữ hoa';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Mật khẩu phải có ít nhất 1 số';
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      return 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt';
    }
    return '';
  };

  const handlePasswordChange = async () => {
    // Reset errors
    setPasswordErrors({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });

    // Validate fields
    let hasErrors = false;
    const errors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
      hasErrors = true;
    }

    if (!passwordData.newPassword) {
      errors.newPassword = 'Vui lòng nhập mật khẩu mới';
      hasErrors = true;
    } else {
      const passwordError = validatePassword(passwordData.newPassword);
      if (passwordError) {
        errors.newPassword = passwordError;
        hasErrors = true;
      }
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới';
      hasErrors = true;
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
      hasErrors = true;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      errors.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại';
      hasErrors = true;
    }

    if (hasErrors) {
      setPasswordErrors(errors);
      return;
    }

    setChangingPassword(true);

    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('🔐 Đổi mật khẩu thành công!');
        setShowPasswordModal(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        if (result.error === 'Invalid current password') {
          setPasswordErrors({
            ...errors,
            currentPassword: 'Mật khẩu hiện tại không đúng',
          });
        } else {
          toast.error(result.error || 'Không thể đổi mật khẩu');
        }
      }
    } catch (error) {
      toast.error('🔌 Lỗi kết nối mạng');
    } finally {
      setChangingPassword(false);
    }
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setPasswordErrors({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const renderCustomRightSection = () => (
    <div className='flex items-center space-x-2 sm:space-x-3 lg:space-x-4'>
      <button
        onClick={saveSettings}
        disabled={saving}
        className='bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-white px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-xl sm:rounded-xl lg:rounded-2xl hover:from-purple-600/20 hover:to-pink-600/20 transition-all duration-300 hover:scale-105 shadow-lg text-sm sm:text-base relative z-10 disabled:opacity-50'
      >
        {saving ? (
          <span className='flex items-center space-x-1 sm:space-x-2'>
            <div className='w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
            <span className='hidden sm:inline'>Đang lưu...</span>
            <span className='sm:hidden'>Lưu...</span>
          </span>
        ) : (
          <span className='flex items-center space-x-1 sm:space-x-2'>
            <span className='text-purple-400 text-base sm:text-lg lg:text-xl'>💾</span>
            <span className='font-semibold'>
              <span className='hidden sm:inline'>Lưu cài đặt</span>
              <span className='sm:hidden'>Lưu</span>
            </span>
          </span>
        )}
      </button>

      <DashboardHeader stats={userStats} />
    </div>
  );

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout title='Settings' description='Loading...'>
        <div className='flex items-center justify-center min-h-64'>
          <div className='text-center'>
            <div className='w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
            <p className='text-white'>Loading settings...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title='⚙️ Cài đặt hệ thống'
      description='Tùy chỉnh trải nghiệm và preferences của bạn'
      rightSection={renderCustomRightSection()}
    >
      <div className='space-y-8'>
        {/* Theme & Language Settings */}
        <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10'>
          <h3 className='text-xl font-bold text-white mb-6 flex items-center space-x-2'>
            <span>🎨</span>
            <span>Giao diện & Ngôn ngữ</span>
          </h3>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>Theme</label>
              <select
                value={settings.theme}
                onChange={e => updateSetting('theme', e.target.value)}
                className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent'
              >
                <option value='dark'>🌙 Dark Mode</option>
                <option value='light'>☀️ Light Mode</option>
                <option value='auto'>🔄 Auto</option>
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>Language</label>
              <select
                value={settings.language}
                onChange={e => updateSetting('language', e.target.value)}
                className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent'
              >
                <option value='vi'>🇻🇳 Tiếng Việt</option>
                <option value='en'>🇺🇸 English</option>
                <option value='ja'>🇯🇵 日本語</option>
                <option value='ko'>🇰🇷 한국어</option>
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>Timezone</label>
              <select
                value={settings.timezone}
                onChange={e => updateSetting('timezone', e.target.value)}
                className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent'
              >
                <option value='Asia/Ho_Chi_Minh'>🇻🇳 Vietnam (UTC+7)</option>
                <option value='UTC'>🌍 UTC (UTC+0)</option>
                <option value='America/New_York'>🇺🇸 New York (UTC-5)</option>
                <option value='Europe/London'>🇬🇧 London (UTC+0)</option>
                <option value='Asia/Tokyo'>🇯🇵 Tokyo (UTC+9)</option>
                <option value='Australia/Sydney'>🇦🇺 Sydney (UTC+11)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications Settings */}
        <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10'>
          <h3 className='text-xl font-bold text-white mb-6 flex items-center space-x-2'>
            <span>🔔</span>
            <span>Thông báo</span>
          </h3>

          <div className='space-y-4'>
            <div className='flex items-center justify-between p-4 bg-white/5 rounded-2xl'>
              <div>
                <h4 className='text-white font-semibold'>Email Notifications</h4>
                <p className='text-gray-400 text-sm'>Nhận thông báo qua email</p>
              </div>
              <label className='relative inline-flex items-center cursor-pointer'>
                <input
                  type='checkbox'
                  checked={settings.emailNotifications}
                  onChange={e => updateSetting('emailNotifications', e.target.checked)}
                  className='sr-only peer'
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className='flex items-center justify-between p-4 bg-white/5 rounded-2xl'>
              <div>
                <h4 className='text-white font-semibold'>Browser Notifications</h4>
                <p className='text-gray-400 text-sm'>Nhận thông báo push trong trình duyệt</p>
              </div>
              <label className='relative inline-flex items-center cursor-pointer'>
                <input
                  type='checkbox'
                  checked={settings.browserNotifications}
                  onChange={e => updateSetting('browserNotifications', e.target.checked)}
                  className='sr-only peer'
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className='flex items-center justify-between p-4 bg-white/5 rounded-2xl'>
              <div>
                <h4 className='text-white font-semibold'>Weekly Reports</h4>
                <p className='text-gray-400 text-sm'>Nhận báo cáo sử dụng hàng tuần</p>
              </div>
              <label className='relative inline-flex items-center cursor-pointer'>
                <input
                  type='checkbox'
                  checked={settings.weeklyReport}
                  onChange={e => updateSetting('weeklyReport', e.target.checked)}
                  className='sr-only peer'
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* AI Model Settings */}
        <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10'>
          <h3 className='text-xl font-bold text-white mb-6 flex items-center space-x-2'>
            <span className='text-blue-400'>AI</span>
            <span>Cài đặt AI Model</span>
          </h3>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>Default Model</label>
              <select
                value={settings.defaultModel}
                onChange={e => updateSetting('defaultModel', e.target.value)}
                className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent'
              >
                <option value='gpt-3.5-turbo'>🚀 GPT-3.5 Turbo</option>
                <option value='gpt-4'>⭐ GPT-4</option>
                <option value='gpt-4-turbo'>🔥 GPT-4 Turbo</option>
                <option value='claude-3-sonnet'>🎭 Claude 3 Sonnet</option>
                <option value='claude-3-opus'>💎 Claude 3 Opus</option>
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>
                Temperature ({settings.defaultTemperature})
              </label>
              <input
                type='range'
                min='0'
                max='2'
                step='0.1'
                value={settings.defaultTemperature}
                onChange={e => updateSetting('defaultTemperature', parseFloat(e.target.value))}
                className='w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider'
              />
              <div className='flex justify-between text-xs text-gray-400 mt-1'>
                <span>🎯 Focused</span>
                <span>🎨 Creative</span>
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>Max Tokens</label>
              <input
                type='number'
                min='100'
                max='4000'
                step='100'
                value={settings.defaultMaxTokens}
                onChange={e => updateSetting('defaultMaxTokens', parseInt(e.target.value))}
                className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent'
              />
            </div>
          </div>
        </div>

        {/* Security & Password Settings */}
        <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10'>
          <h3 className='text-xl font-bold text-white mb-6 flex items-center space-x-2'>
            <span>🔐</span>
            <span>Bảo mật & Mật khẩu</span>
          </h3>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-2xl p-6 border border-red-500/20'>
              <div className='flex items-center space-x-3 mb-4'>
                <div className='w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl flex items-center justify-center'>
                  <span className='text-white text-lg'>🔐</span>
                </div>
                <div>
                  <h4 className='text-white font-semibold'>Đổi mật khẩu</h4>
                  <p className='text-gray-400 text-sm'>Cập nhật mật khẩu để bảo vệ tài khoản</p>
                </div>
              </div>
              <button
                onClick={() => setShowPasswordModal(true)}
                className='w-full bg-gradient-to-r from-red-500 to-orange-600 text-white px-4 py-3 rounded-xl hover:from-red-600 hover:to-orange-700 transition-all flex items-center justify-center space-x-2'
              >
                <span>🔑</span>
                <span>Đổi mật khẩu</span>
              </button>
            </div>

            <div className='bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-2xl p-6 border border-green-500/20'>
              <div className='flex items-center space-x-3 mb-4'>
                <div className='w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center'>
                  <span className='text-white text-lg'>🛡️</span>
                </div>
                <div>
                  <h4 className='text-white font-semibold'>Bảo mật nâng cao</h4>
                  <p className='text-gray-400 text-sm'>Xác thực 2 yếu tố và bảo mật</p>
                </div>
              </div>
              <button
                disabled
                className='w-full bg-gray-600 text-gray-400 px-4 py-3 rounded-xl cursor-not-allowed flex items-center justify-center space-x-2'
              >
                <span>🚧</span>
                <span>Sắp có (Coming Soon)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10'>
          <h3 className='text-xl font-bold text-white mb-6 flex items-center space-x-2'>
            <span>🔒</span>
            <span>Quyền riêng tư & Dữ liệu</span>
          </h3>

          <div className='space-y-4'>
            <div className='flex items-center justify-between p-4 bg-white/5 rounded-2xl'>
              <div>
                <h4 className='text-white font-semibold'>Profile Visibility</h4>
                <p className='text-gray-400 text-sm'>Cho phép người khác xem profile của bạn</p>
              </div>
              <label className='relative inline-flex items-center cursor-pointer'>
                <input
                  type='checkbox'
                  checked={settings.profileVisible}
                  onChange={e => updateSetting('profileVisible', e.target.checked)}
                  className='sr-only peer'
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            <div className='flex items-center justify-between p-4 bg-white/5 rounded-2xl'>
              <div>
                <h4 className='text-white font-semibold'>Data Sharing</h4>
                <p className='text-gray-400 text-sm'>
                  Chia sẻ dữ liệu ẩn danh để cải thiện dịch vụ
                </p>
              </div>
              <label className='relative inline-flex items-center cursor-pointer'>
                <input
                  type='checkbox'
                  checked={settings.dataSharing}
                  onChange={e => updateSetting('dataSharing', e.target.checked)}
                  className='sr-only peer'
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            <div className='flex items-center justify-between p-4 bg-white/5 rounded-2xl'>
              <div>
                <h4 className='text-white font-semibold'>Analytics Tracking</h4>
                <p className='text-gray-400 text-sm'>Cho phép theo dõi patterns sử dụng</p>
              </div>
              <label className='relative inline-flex items-center cursor-pointer'>
                <input
                  type='checkbox'
                  checked={settings.analyticsOptIn}
                  onChange={e => updateSetting('analyticsOptIn', e.target.checked)}
                  className='sr-only peer'
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Account Management - Link to Profile */}
        <div className='bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-3xl p-8 border border-blue-500/20'>
          <h3 className='text-xl font-bold text-white mb-6 flex items-center space-x-2'>
            <span>👤</span>
            <span>Quản lý tài khoản</span>
          </h3>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='bg-white/5 rounded-2xl p-6'>
              <h4 className='text-white font-semibold mb-2'>Profile & Security</h4>
              <p className='text-gray-400 text-sm mb-4'>
                Quản lý thông tin cá nhân, đổi mật khẩu và cài đặt bảo mật
              </p>
              <button
                onClick={navigateToProfile}
                className='bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all flex items-center space-x-2'
              >
                <span>👤</span>
                <span>Mở trang Profile</span>
              </button>
            </div>

            <div className='bg-white/5 rounded-2xl p-6'>
              <h4 className='text-white font-semibold mb-2'>Reset Settings</h4>
              <p className='text-gray-400 text-sm mb-4'>
                Khôi phục tất cả cài đặt về giá trị mặc định
              </p>
              <button
                onClick={() => setShowResetModal(true)}
                className='bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-6 py-3 rounded-xl hover:from-yellow-600 hover:to-orange-700 transition-all flex items-center space-x-2'
              >
                <span>🔄</span>
                <span>Reset Settings</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10'>
          <h3 className='text-xl font-bold text-white mb-6 flex items-center space-x-2'>
            <span>⚡</span>
            <span>Quick Actions</span>
          </h3>

          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <button
              onClick={saveSettings}
              disabled={saving}
              className='bg-green-500/20 border border-green-500/30 text-green-300 p-4 rounded-xl hover:bg-green-500/30 transition-all flex flex-col items-center space-y-2'
            >
              <span className='text-2xl'>💾</span>
              <span className='text-sm font-medium'>Lưu</span>
            </button>

            <button
              onClick={loadSettings}
              className='bg-blue-500/20 border border-blue-500/30 text-blue-300 p-4 rounded-xl hover:bg-blue-500/30 transition-all flex flex-col items-center space-y-2'
            >
              <span className='text-2xl'>🔄</span>
              <span className='text-sm font-medium'>Reload</span>
            </button>

            <button
              onClick={() => setShowPasswordModal(true)}
              className='bg-red-500/20 border border-red-500/30 text-red-300 p-4 rounded-xl hover:bg-red-500/30 transition-all flex flex-col items-center space-y-2'
            >
              <span className='text-2xl'>🔐</span>
              <span className='text-sm font-medium'>Đổi MK</span>
            </button>

            <button
              onClick={() => setShowResetModal(true)}
              className='bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 p-4 rounded-xl hover:bg-yellow-500/30 transition-all flex flex-col items-center space-y-2'
            >
              <span className='text-2xl'>🔄</span>
              <span className='text-sm font-medium'>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className='fixed inset-0 z-[9999] flex items-center justify-center p-4'>
          <div
            className='absolute inset-0 bg-black/50 backdrop-blur-sm'
            onClick={closePasswordModal}
          ></div>

          <div className='relative bg-gray-900 rounded-2xl p-6 border border-red-500/30 max-w-md w-full mx-4'>
            <div className='flex items-center justify-between mb-6'>
              <h3 className='text-xl font-bold text-red-400 flex items-center space-x-2'>
                <span>🔐</span>
                <span>Đổi mật khẩu</span>
              </h3>
              <button
                onClick={closePasswordModal}
                className='p-2 text-gray-400 hover:text-white transition-colors'
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                handlePasswordChange();
              }}
              className='space-y-4'
            >
              <div>
                <label className='block text-sm font-medium text-gray-300 mb-2'>
                  Mật khẩu hiện tại
                </label>
                <input
                  type='password'
                  value={passwordData.currentPassword}
                  onChange={e =>
                    setPasswordData({ ...passwordData, currentPassword: e.target.value })
                  }
                  className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    passwordErrors.currentPassword ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder='Nhập mật khẩu hiện tại'
                />
                {passwordErrors.currentPassword && (
                  <p className='text-red-400 text-xs mt-1'>{passwordErrors.currentPassword}</p>
                )}
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-300 mb-2'>Mật khẩu mới</label>
                <input
                  type='password'
                  value={passwordData.newPassword}
                  onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    passwordErrors.newPassword ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder='Nhập mật khẩu mới'
                />
                {passwordErrors.newPassword && (
                  <p className='text-red-400 text-xs mt-1'>{passwordErrors.newPassword}</p>
                )}
                <div className='mt-2 text-xs text-gray-400'>
                  <p className='mb-1'>Mật khẩu phải có:</p>
                  <ul className='list-disc list-inside space-y-0.5 ml-2'>
                    <li
                      className={
                        passwordData.newPassword.length >= 8 ? 'text-green-400' : 'text-gray-400'
                      }
                    >
                      Ít nhất 8 ký tự
                    </li>
                    <li
                      className={
                        /(?=.*[a-z])/.test(passwordData.newPassword)
                          ? 'text-green-400'
                          : 'text-gray-400'
                      }
                    >
                      1 chữ thường
                    </li>
                    <li
                      className={
                        /(?=.*[A-Z])/.test(passwordData.newPassword)
                          ? 'text-green-400'
                          : 'text-gray-400'
                      }
                    >
                      1 chữ hoa
                    </li>
                    <li
                      className={
                        /(?=.*\d)/.test(passwordData.newPassword)
                          ? 'text-green-400'
                          : 'text-gray-400'
                      }
                    >
                      1 số
                    </li>
                    <li
                      className={
                        /(?=.*[@$!%*?&])/.test(passwordData.newPassword)
                          ? 'text-green-400'
                          : 'text-gray-400'
                      }
                    >
                      1 ký tự đặc biệt (@$!%*?&)
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-300 mb-2'>
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type='password'
                  value={passwordData.confirmPassword}
                  onChange={e =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                  className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder='Xác nhận mật khẩu mới'
                />
                {passwordErrors.confirmPassword && (
                  <p className='text-red-400 text-xs mt-1'>{passwordErrors.confirmPassword}</p>
                )}
                {passwordData.confirmPassword &&
                  passwordData.newPassword === passwordData.confirmPassword && (
                    <p className='text-green-400 text-xs mt-1 flex items-center space-x-1'>
                      <span>✅</span>
                      <span>Mật khẩu khớp</span>
                    </p>
                  )}
              </div>

              <div className='bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mt-4'>
                <div className='flex items-center space-x-2 mb-1'>
                  <span className='text-yellow-400'>⚠️</span>
                  <h4 className='text-yellow-400 font-semibold text-sm'>Lưu ý bảo mật</h4>
                </div>
                <p className='text-yellow-300 text-xs'>
                  Sau khi đổi mật khẩu, bạn sẽ cần đăng nhập lại trên tất cả thiết bị khác.
                </p>
              </div>

              <div className='flex space-x-3 pt-4'>
                <button
                  type='button'
                  onClick={closePasswordModal}
                  className='flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors'
                >
                  Hủy
                </button>
                <button
                  type='submit'
                  disabled={changingPassword}
                  className='flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-lg hover:from-red-600 hover:to-orange-700 transition-all disabled:opacity-50'
                >
                  {changingPassword ? (
                    <span className='flex items-center justify-center space-x-2'>
                      <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                      <span>Đang đổi...</span>
                    </span>
                  ) : (
                    <span className='flex items-center justify-center space-x-1'>
                      <span>🔐</span>
                      <span>Đổi mật khẩu</span>
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Settings Modal */}
      {showResetModal && (
        <div className='fixed inset-0 z-[9999] flex items-center justify-center p-4'>
          <div
            className='absolute inset-0 bg-black/50 backdrop-blur-sm'
            onClick={() => setShowResetModal(false)}
          ></div>

          <div className='relative bg-gray-900 rounded-2xl p-6 border border-yellow-500/30 max-w-md w-full mx-4'>
            <div className='flex items-center justify-between mb-6'>
              <h3 className='text-xl font-bold text-yellow-400'>🔄 Reset Settings</h3>
              <button
                onClick={() => setShowResetModal(false)}
                className='p-2 text-gray-400 hover:text-white transition-colors'
              >
                ✕
              </button>
            </div>

            <div className='mb-6'>
              <div className='bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4'>
                <div className='flex items-center space-x-2 mb-2'>
                  <span className='text-yellow-400'>⚠️</span>
                  <h4 className='text-yellow-400 font-semibold'>Xác nhận Reset</h4>
                </div>
                <p className='text-yellow-300 text-sm'>
                  Hành động này sẽ khôi phục tất cả cài đặt về giá trị mặc định!
                </p>
              </div>

              <div className='text-gray-300 text-sm space-y-2'>
                <p className='font-medium'>Các cài đặt sẽ được khôi phục:</p>
                <ul className='list-disc list-inside space-y-1 text-gray-400'>
                  <li>Theme: Dark Mode</li>
                  <li>Language: Tiếng Việt</li>
                  <li>Timezone: Vietnam (UTC+7)</li>
                  <li>AI Model: GPT-3.5 Turbo</li>
                  <li>Tất cả notification settings</li>
                  <li>Privacy & security preferences</li>
                </ul>
              </div>
            </div>

            <div className='flex space-x-3'>
              <button
                onClick={() => setShowResetModal(false)}
                className='flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors'
              >
                Hủy
              </button>
              <button
                onClick={resetSettings}
                disabled={resetting}
                className='flex-1 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-lg hover:from-yellow-600 hover:to-orange-700 transition-all disabled:opacity-50'
              >
                {resetting ? (
                  <span className='flex items-center justify-center space-x-2'>
                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                    <span>Đang reset...</span>
                  </span>
                ) : (
                  '🔄 Reset Settings'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
