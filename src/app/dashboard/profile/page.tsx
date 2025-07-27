'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image'; // ✅ fixed from LINTING_MANUAL_FIXES_NEEDED.md
import DashboardLayout from '@/components/ui/DashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import toast from 'react-hot-toast';

interface UserStats {
  usage: {
    percentage: number;
    plan: string;
  };
}

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role: string;
  createdAt: string;
  lastLogin?: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [saving, setSaving] = useState(false);

  // Modal states
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showEmailPreferencesModal, setShowEmailPreferencesModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  // Password form data
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Email preferences data
  const [emailPreferences, setEmailPreferences] = useState({
    marketing: true,
    notifications: true,
    security: true,
    updates: true,
  });
  const [savingPreferences, setSavingPreferences] = useState(false);

  // Delete account data
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      loadProfile();
      loadUserStats();
    }
  }, [status, router]);

  // Load email preferences when modal opens
  useEffect(() => {
    if (showEmailPreferencesModal) {
      loadEmailPreferences();
    }
  }, [showEmailPreferencesModal]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/profile');

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setFormData({
          name: data.name || '',
          email: data.email || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmailPreferences = async () => {
    try {
      const response = await fetch('/api/user/email-preferences');

      if (response.ok) {
        const data = await response.json();
        setEmailPreferences({
          marketing: data.marketing ?? true,
          notifications: data.notifications ?? true,
          security: data.security ?? true,
          updates: data.updates ?? true,
        });
      }
    } catch (error) {
      console.error('Error loading email preferences:', error);
    }
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        setEditing(false);
        toast.success('Cập nhật profile thành công!');
      } else {
        toast.error('Không thể cập nhật profile');
      }
    } catch (error) {
      toast.error('Lỗi kết nối mạng');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Mật khẩu mới không khớp');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Mật khẩu phải có ít nhất 8 ký tự');
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

      if (response.ok) {
        setShowChangePasswordModal(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        toast.success('Đổi mật khẩu thành công!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Không thể đổi mật khẩu');
      }
    } catch (error) {
      toast.error('Lỗi kết nối mạng');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSaveEmailPreferences = async () => {
    setSavingPreferences(true);

    try {
      const response = await fetch('/api/user/email-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPreferences),
      });

      if (response.ok) {
        setShowEmailPreferencesModal(false);
        toast.success('Cập nhật cài đặt email thành công!');
      } else {
        toast.error('Không thể cập nhật cài đặt email');
      }
    } catch (error) {
      toast.error('Lỗi kết nối mạng');
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE MY ACCOUNT') {
      toast.error("Vui lòng nhập 'DELETE MY ACCOUNT' để xác nhận");
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirmation: deleteConfirmation }),
      });

      if (response.ok) {
        toast.success('Tài khoản đã được xóa thành công');
        router.push('/login');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Không thể xóa tài khoản');
      }
    } catch (error) {
      toast.error('Lỗi kết nối mạng');
    } finally {
      setDeleting(false);
    }
  };

  // Custom right section with Edit Profile button and header
  const renderCustomRightSection = () => (
    <div className='flex items-center space-x-2 sm:space-x-3 lg:space-x-4'>
      {/* Edit Profile Button */}
      {!editing && (
        <button
          onClick={() => setEditing(true)}
          className='flex items-center space-x-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 hover:border-blue-400/50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl transition-all duration-300 hover:from-blue-500/30 hover:to-purple-500/30'
          title='Chỉnh sửa profile'
        >
          <span className='text-blue-400 text-sm sm:text-base'>✏️</span>
          <span className='text-xs sm:text-sm text-blue-300 font-medium hidden sm:inline'>
            Edit
          </span>
        </button>
      )}

      {/* Dashboard Header */}
      <DashboardHeader stats={userStats} />
    </div>
  );

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout
        title='👤 Profile Settings'
        description='Đang tải thông tin profile...'
        rightSection={renderCustomRightSection()}
      >
        <div className='flex items-center justify-center min-h-64'>
          <div className='text-center'>
            <div className='w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
            <p className='text-white'>Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout
        title='👤 Profile Settings'
        description='Không tìm thấy thông tin profile'
        rightSection={renderCustomRightSection()}
      >
        <div className='text-center py-12'>
          <p className='text-gray-400'>Unable to load profile</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <DashboardLayout
        title={`👤 ${profile?.name || 'User'} Profile`}
        description='Quản lý thông tin tài khoản và preferences'
        rightSection={renderCustomRightSection()}
      >
        <div className='space-y-8'>
          {/* Profile Info */}
          <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10'>
            <div className='flex items-center space-x-6 mb-8'>
              <div className='w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center'>
                {profile?.image ? (
                  <Image
                    src={profile.image}
                    alt='Profile'
                    width={96}
                    height={96}
                    className='w-24 h-24 rounded-full object-cover'
                  />
                ) : (
                  <span className='text-3xl text-white font-bold'>
                    {profile?.name?.[0] || profile?.email?.[0] || '?'}
                  </span>
                )}
              </div>
              <div>
                <h2 className='text-2xl font-bold text-white'>{profile?.name || 'Unnamed User'}</h2>
                <p className='text-gray-400'>{profile?.email}</p>
                <div className='flex items-center space-x-4 mt-2'>
                  <span className='bg-blue-500/20 text-blue-300 px-3 py-1 rounded-lg text-sm'>
                    {profile?.role || 'User'}
                  </span>
                  <span className='text-gray-500 text-sm'>
                    Joined{' '}
                    {profile?.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString()
                      : 'Unknown'}
                  </span>
                </div>
              </div>
            </div>

            {editing ? (
              <form onSubmit={handleSave} className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      Full Name
                    </label>
                    <input
                      type='text'
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      placeholder='Enter your full name'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      Email Address
                    </label>
                    <input
                      type='email'
                      value={formData.email}
                      onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      placeholder='Enter your email address'
                      disabled
                    />
                    <p className='text-gray-500 text-xs mt-1'>Email cannot be changed</p>
                  </div>
                </div>

                <div className='flex space-x-4 pt-6 border-t border-gray-700'>
                  <button
                    type='button'
                    onClick={() => {
                      setEditing(false);
                      setFormData({
                        name: profile?.name || '',
                        email: profile?.email || '',
                      });
                    }}
                    className='px-6 py-3 text-gray-400 hover:text-white transition-colors rounded-xl border border-gray-600 hover:border-gray-400'
                  >
                    Cancel
                  </button>
                  <button
                    type='submit'
                    disabled={saving}
                    className='bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 font-semibold shadow-lg'
                  >
                    {saving ? (
                      <span className='flex items-center space-x-2'>
                        <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                        <span>Saving...</span>
                      </span>
                    ) : (
                      <span className='flex items-center space-x-2'>
                        <span>💾</span>
                        <span>Save Changes</span>
                      </span>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='bg-white/5 rounded-2xl p-6'>
                  <h3 className='text-lg font-semibold text-white mb-4'>Account Information</h3>
                  <div className='space-y-3'>
                    <div>
                      <label className='text-gray-400 text-sm'>Full Name</label>
                      <p className='text-white font-medium'>{profile?.name || 'Not set'}</p>
                    </div>
                    <div>
                      <label className='text-gray-400 text-sm'>Email Address</label>
                      <p className='text-white font-medium'>{profile?.email}</p>
                    </div>
                    <div>
                      <label className='text-gray-400 text-sm'>Account Type</label>
                      <p className='text-white font-medium'>{profile?.role || 'User'}</p>
                    </div>
                  </div>
                </div>

                <div className='bg-white/5 rounded-2xl p-6'>
                  <h3 className='text-lg font-semibold text-white mb-4'>Activity</h3>
                  <div className='space-y-3'>
                    <div>
                      <label className='text-gray-400 text-sm'>Member Since</label>
                      <p className='text-white font-medium'>
                        {profile?.createdAt
                          ? new Date(profile.createdAt).toLocaleDateString()
                          : 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <label className='text-gray-400 text-sm'>Last Login</label>
                      <p className='text-white font-medium'>
                        {profile?.lastLogin
                          ? new Date(profile.lastLogin).toLocaleDateString()
                          : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Account Actions */}
          <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10'>
            <h3 className='text-xl font-bold text-white mb-6'>Account Actions</h3>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <button
                onClick={() => setShowChangePasswordModal(true)}
                className='bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all text-left'
              >
                <div className='flex items-center space-x-4'>
                  <div className='w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center'>
                    <span className='text-2xl'>🔐</span>
                  </div>
                  <div>
                    <h4 className='font-semibold'>Đổi mật khẩu</h4>
                    <p className='text-sm opacity-80'>Cập nhật mật khẩu của bạn</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setShowEmailPreferencesModal(true)}
                className='bg-gradient-to-r from-blue-500 to-cyan-600 text-white p-6 rounded-2xl hover:from-blue-600 hover:to-cyan-700 transition-all text-left'
              >
                <div className='flex items-center space-x-4'>
                  <div className='w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center'>
                    <span className='text-2xl'>📧</span>
                  </div>
                  <div>
                    <h4 className='font-semibold'>Cài đặt Email</h4>
                    <p className='text-sm opacity-80'>Quản lý thông báo email</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setShowDeleteAccountModal(true)}
                className='bg-gradient-to-r from-red-500 to-rose-600 text-white p-6 rounded-2xl hover:from-red-600 hover:to-rose-700 transition-all text-left'
              >
                <div className='flex items-center space-x-4'>
                  <div className='w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center'>
                    <span className='text-2xl'>🗑️</span>
                  </div>
                  <div>
                    <h4 className='font-semibold'>Xóa tài khoản</h4>
                    <p className='text-sm opacity-80'>Xóa vĩnh viễn tài khoản</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Change Password Modal */}
        {showChangePasswordModal && (
          <div className='fixed inset-0 z-[9999] flex items-center justify-center p-4'>
            <div
              className='absolute inset-0 bg-black/50 backdrop-blur-sm'
              onClick={() => setShowChangePasswordModal(false)}
            ></div>

            <div className='relative bg-gray-900 rounded-2xl p-6 border border-gray-700 max-w-md w-full mx-4'>
              <div className='flex items-center justify-between mb-6'>
                <h3 className='text-xl font-bold text-white'>🔐 Đổi mật khẩu</h3>
                <button
                  onClick={() => setShowChangePasswordModal(false)}
                  className='p-2 text-gray-400 hover:text-white transition-colors'
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleChangePassword} className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>
                    Mật khẩu hiện tại
                  </label>
                  <input
                    type='password'
                    value={passwordData.currentPassword}
                    onChange={e =>
                      setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))
                    }
                    className='w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                    placeholder='Nhập mật khẩu hiện tại'
                    required
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>
                    Mật khẩu mới
                  </label>
                  <input
                    type='password'
                    value={passwordData.newPassword}
                    onChange={e =>
                      setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))
                    }
                    className='w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                    placeholder='Nhập mật khẩu mới (tối thiểu 8 ký tự)'
                    required
                    minLength={8}
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>
                    Xác nhận mật khẩu mới
                  </label>
                  <input
                    type='password'
                    value={passwordData.confirmPassword}
                    onChange={e =>
                      setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))
                    }
                    className='w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                    placeholder='Nhập lại mật khẩu mới'
                    required
                  />
                </div>

                <div className='flex space-x-3 pt-4'>
                  <button
                    type='button'
                    onClick={() => setShowChangePasswordModal(false)}
                    className='flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors'
                  >
                    Hủy
                  </button>
                  <button
                    type='submit'
                    disabled={changingPassword}
                    className='flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50'
                  >
                    {changingPassword ? (
                      <span className='flex items-center justify-center space-x-2'>
                        <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                        <span>Đang cập nhật...</span>
                      </span>
                    ) : (
                      '💾 Cập nhật'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Email Preferences Modal */}
        {showEmailPreferencesModal && (
          <div className='fixed inset-0 z-[9999] flex items-center justify-center p-4'>
            <div
              className='absolute inset-0 bg-black/50 backdrop-blur-sm'
              onClick={() => setShowEmailPreferencesModal(false)}
            ></div>

            <div className='relative bg-gray-900 rounded-2xl p-6 border border-gray-700 max-w-md w-full mx-4'>
              <div className='flex items-center justify-between mb-6'>
                <h3 className='text-xl font-bold text-white'>Cài đặt Email</h3>
                <button
                  onClick={() => setShowEmailPreferencesModal(false)}
                  className='p-2 text-gray-400 hover:text-white transition-colors'
                >
                  ✕
                </button>
              </div>

              <div className='space-y-4'>
                <div className='flex items-center justify-between p-4 bg-white/5 rounded-lg'>
                  <div>
                    <h4 className='text-white font-medium'>Marketing</h4>
                    <p className='text-gray-400 text-sm'>Nhận email về sản phẩm và khuyến mãi</p>
                  </div>
                  <label className='relative inline-flex items-center cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={emailPreferences.marketing}
                      onChange={e =>
                        setEmailPreferences(prev => ({ ...prev, marketing: e.target.checked }))
                      }
                      className='sr-only peer'
                    />
                    <div className="relative w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>

                <div className='flex items-center justify-between p-4 bg-white/5 rounded-lg'>
                  <div>
                    <h4 className='text-white font-medium'>Thông báo</h4>
                    <p className='text-gray-400 text-sm'>Nhận thông báo về hoạt động agent</p>
                  </div>
                  <label className='relative inline-flex items-center cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={emailPreferences.notifications}
                      onChange={e =>
                        setEmailPreferences(prev => ({ ...prev, notifications: e.target.checked }))
                      }
                      className='sr-only peer'
                    />
                    <div className="relative w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>

                <div className='flex items-center justify-between p-4 bg-white/5 rounded-lg'>
                  <div>
                    <h4 className='text-white font-medium'>Bảo mật</h4>
                    <p className='text-gray-400 text-sm'>Nhận cảnh báo bảo mật</p>
                  </div>
                  <label className='relative inline-flex items-center cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={emailPreferences.security}
                      onChange={e =>
                        setEmailPreferences(prev => ({ ...prev, security: e.target.checked }))
                      }
                      className='sr-only peer'
                    />
                    <div className="relative w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>

                <div className='flex items-center justify-between p-4 bg-white/5 rounded-lg'>
                  <div>
                    <h4 className='text-white font-medium'>Cập nhật</h4>
                    <p className='text-gray-400 text-sm'>Nhận thông tin cập nhật hệ thống</p>
                  </div>
                  <label className='relative inline-flex items-center cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={emailPreferences.updates}
                      onChange={e =>
                        setEmailPreferences(prev => ({ ...prev, updates: e.target.checked }))
                      }
                      className='sr-only peer'
                    />
                    <div className="relative w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>
              </div>

              <div className='flex space-x-3 pt-6'>
                <button
                  onClick={() => setShowEmailPreferencesModal(false)}
                  className='flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors'
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveEmailPreferences}
                  disabled={savingPreferences}
                  className='flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all disabled:opacity-50'
                >
                  {savingPreferences ? (
                    <span className='flex items-center justify-center space-x-2'>
                      <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                      <span>Đang lưu...</span>
                    </span>
                  ) : (
                    '💾 Lưu cài đặt'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Account Modal */}
        {showDeleteAccountModal && (
          <div className='fixed inset-0 z-[9999] flex items-center justify-center p-4'>
            <div
              className='absolute inset-0 bg-black/50 backdrop-blur-sm'
              onClick={() => setShowDeleteAccountModal(false)}
            ></div>

            <div className='relative bg-gray-900 rounded-2xl p-6 border border-red-500/30 max-w-md w-full mx-4'>
              <div className='flex items-center justify-between mb-6'>
                <h3 className='text-xl font-bold text-red-400'>🗑️ Xóa tài khoản</h3>
                <button
                  onClick={() => setShowDeleteAccountModal(false)}
                  className='p-2 text-gray-400 hover:text-white transition-colors'
                >
                  ✕
                </button>
              </div>

              <div className='mb-6'>
                <div className='bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4'>
                  <div className='flex items-center space-x-2 mb-2'>
                    <span className='text-red-400'>⚠️</span>
                    <h4 className='text-red-400 font-semibold'>Cảnh báo nghiêm trọng</h4>
                  </div>
                  <p className='text-red-300 text-sm'>Hành động này không thể hoàn tác!</p>
                </div>

                <div className='text-gray-300 text-sm space-y-2'>
                  <p className='font-medium'>Dữ liệu sẽ bị xóa vĩnh viễn:</p>
                  <ul className='list-disc list-inside space-y-1 text-gray-400'>
                    <li>Tất cả agents và conversations</li>
                    <li>Dữ liệu training và knowledge base</li>
                    <li>API keys và integrations</li>
                    <li>Analytics và usage history</li>
                    <li>Tất cả cài đặt cá nhân</li>
                  </ul>
                </div>
              </div>

              <div className='mb-6'>
                <label className='block text-sm font-medium text-gray-300 mb-2'>
                  Nhập "<span className='text-red-400 font-bold'>DELETE MY ACCOUNT</span>" để xác
                  nhận:
                </label>
                <input
                  type='text'
                  value={deleteConfirmation}
                  onChange={e => setDeleteConfirmation(e.target.value)}
                  className='w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500'
                  placeholder='DELETE MY ACCOUNT'
                />
              </div>

              <div className='flex space-x-3'>
                <button
                  onClick={() => setShowDeleteAccountModal(false)}
                  className='flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors'
                >
                  Hủy
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting || deleteConfirmation !== 'DELETE MY ACCOUNT'}
                  className='flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg hover:from-red-600 hover:to-rose-700 transition-all disabled:opacity-50'
                >
                  {deleting ? (
                    <span className='flex items-center justify-center space-x-2'>
                      <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                      <span>Đang xóa...</span>
                    </span>
                  ) : (
                    '🗑️ Xóa tài khoản'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </>
  );
}
