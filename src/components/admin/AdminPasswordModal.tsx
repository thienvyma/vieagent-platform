'use client';

import { useState } from 'react';
import { X, Lock, Shield, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

interface AdminPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminPasswordModal({ isOpen, onClose }: AdminPasswordModalProps) {
  const { data: session } = useSession();

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const userRole = session?.user?.role;
  const isAdmin = ['ADMIN', 'MANAGER', 'OWNER'].includes(userRole || '');

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
      return 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt (@$!%*?&)';
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
      const response = await fetch('/api/admin/password', {
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
        toast.success('🔐 Đổi mật khẩu admin thành công!', {
          duration: 4000,
          position: 'top-center',
        });
        closeModal();

        // Show security notice
        setTimeout(() => {
          toast('🔒 Bạn sẽ cần đăng nhập lại sau 5 giây...', {
            duration: 5000,
            icon: '⚠️',
          });

          // Auto logout after 5 seconds for security
          setTimeout(() => {
            window.location.href = '/login';
          }, 5000);
        }, 1000);
      } else {
        if (result.error === 'Invalid current password') {
          setPasswordErrors({
            ...errors,
            currentPassword: 'Mật khẩu hiện tại không đúng',
          });
        } else {
          toast.error(result.error || 'Không thể đổi mật khẩu admin');
        }
      }
    } catch (error) {
      toast.error('🔌 Lỗi kết nối mạng');
    } finally {
      setChangingPassword(false);
    }
  };

  const closeModal = () => {
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
    setShowPasswords({
      current: false,
      new: false,
      confirm: false,
    });
    onClose();
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  if (!isOpen) return null;

  if (!isAdmin) {
    return (
      <div className='fixed inset-0 z-[55] flex items-center justify-center p-4'>
        <div className='absolute inset-0 bg-black/50 backdrop-blur-sm' onClick={onClose}></div>
        <div className='relative bg-gray-900 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-red-500/30 max-w-md mx-4'>
          <div className='text-center'>
            <AlertTriangle className='w-12 h-12 sm:w-16 sm:h-16 text-red-400 mx-auto mb-3 sm:mb-4' />
            <h3 className='text-lg sm:text-xl font-bold text-white mb-2'>
              Không có quyền truy cập
            </h3>
            <p className='text-sm sm:text-base text-gray-400 mb-4'>
              Bạn không có quyền đổi mật khẩu admin
            </p>
            <button
              onClick={onClose}
              className='px-4 py-2 bg-gray-700 text-white rounded-lg sm:rounded-xl text-sm sm:text-base'
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='fixed inset-0 z-[55] flex items-center justify-center p-4'>
      <div className='absolute inset-0 bg-black/50 backdrop-blur-sm' onClick={closeModal}></div>

      <div className='relative bg-gray-900 rounded-2xl p-6 border border-orange-500/30 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto'>
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center space-x-3'>
            <div className='w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center'>
              <Shield className='w-5 h-5 text-white' />
            </div>
            <div>
              <h3 className='text-xl font-bold text-orange-400'>🔐 Đổi mật khẩu Admin</h3>
              <p className='text-sm text-gray-400'>Bảo mật tài khoản quản trị</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className='p-2 text-gray-400 hover:text-white transition-colors'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        <form
          onSubmit={e => {
            e.preventDefault();
            handlePasswordChange();
          }}
          className='space-y-5'
        >
          {/* Current Password */}
          <div>
            <label className='block text-sm font-medium text-gray-300 mb-2'>
              Mật khẩu hiện tại
            </label>
            <div className='relative'>
              <input
                type={showPasswords.current ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={e =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
                className={`w-full px-4 py-3 pr-12 bg-gray-800/50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  passwordErrors.currentPassword ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder='Nhập mật khẩu hiện tại'
              />
              <button
                type='button'
                onClick={() => togglePasswordVisibility('current')}
                className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white'
              >
                {showPasswords.current ? (
                  <EyeOff className='w-5 h-5' />
                ) : (
                  <Eye className='w-5 h-5' />
                )}
              </button>
            </div>
            {passwordErrors.currentPassword && (
              <p className='text-red-400 text-xs mt-1'>{passwordErrors.currentPassword}</p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className='block text-sm font-medium text-gray-300 mb-2'>Mật khẩu mới</label>
            <div className='relative'>
              <input
                type={showPasswords.new ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className={`w-full px-4 py-3 pr-12 bg-gray-800/50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  passwordErrors.newPassword ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder='Nhập mật khẩu mới'
              />
              <button
                type='button'
                onClick={() => togglePasswordVisibility('new')}
                className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white'
              >
                {showPasswords.new ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
              </button>
            </div>
            {passwordErrors.newPassword && (
              <p className='text-red-400 text-xs mt-1'>{passwordErrors.newPassword}</p>
            )}
            <div className='mt-2 text-xs text-gray-400'>
              <p className='mb-1'>Mật khẩu mạnh phải có:</p>
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
                    /(?=.*\d)/.test(passwordData.newPassword) ? 'text-green-400' : 'text-gray-400'
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

          {/* Confirm Password */}
          <div>
            <label className='block text-sm font-medium text-gray-300 mb-2'>
              Xác nhận mật khẩu mới
            </label>
            <div className='relative'>
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={e =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
                className={`w-full px-4 py-3 pr-12 bg-gray-800/50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder='Xác nhận mật khẩu mới'
              />
              <button
                type='button'
                onClick={() => togglePasswordVisibility('confirm')}
                className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white'
              >
                {showPasswords.confirm ? (
                  <EyeOff className='w-5 h-5' />
                ) : (
                  <Eye className='w-5 h-5' />
                )}
              </button>
            </div>
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

          {/* Security Warning */}
          <div className='bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4'>
            <div className='flex items-center space-x-2 mb-2'>
              <AlertTriangle className='w-5 h-5 text-yellow-400' />
              <h4 className='text-yellow-400 font-semibold text-sm'>Cảnh báo bảo mật</h4>
            </div>
            <div className='text-yellow-300 text-xs space-y-1'>
              <p>• Sau khi đổi mật khẩu, bạn sẽ được tự động đăng xuất</p>
              <p>• Cần đăng nhập lại trên tất cả thiết bị khác</p>
              <p>• Session admin hiện tại sẽ bị hủy ngay lập tức</p>
            </div>
          </div>

          {/* Admin Role Info */}
          <div className='bg-orange-500/10 border border-orange-500/30 rounded-lg p-3'>
            <div className='flex items-center space-x-2'>
              <Shield className='w-4 h-4 text-orange-400' />
              <span className='text-orange-300 text-sm font-medium'>
                Đổi mật khẩu với quyền {userRole}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex space-x-3 pt-4'>
            <button
              type='button'
              onClick={closeModal}
              className='flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors'
            >
              Hủy
            </button>
            <button
              type='submit'
              disabled={changingPassword}
              className='flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all disabled:opacity-50 font-medium'
            >
              {changingPassword ? (
                <span className='flex items-center justify-center space-x-2'>
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                  <span>Đang đổi...</span>
                </span>
              ) : (
                <span className='flex items-center justify-center space-x-2'>
                  <Lock className='w-4 h-4' />
                  <span>Đổi mật khẩu Admin</span>
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
