'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Save,
  User,
  Mail,
  Shield,
  Crown,
  UserCheck,
  Users,
  CreditCard,
  AlertTriangle,
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  password?: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'USER';
  plan: 'TRIAL' | 'BASIC' | 'PRO' | 'ENTERPRISE' | 'ULTIMATE';
  isActive: boolean;
  createdAt: string;
  agentsCount: number;
  conversationsCount: number;
  subscription?: {
    plan: 'TRIAL' | 'BASIC' | 'PRO' | 'ENTERPRISE' | 'ULTIMATE';
    startDate?: string;
    endDate?: string;
    status?: string;
  };
}

interface UserEditModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userIdOrData: string | Partial<User>, data?: Partial<User>) => void;
  currentUserRole: string;
  mode?: 'edit' | 'add';
}

export default function UserEditModal({
  user,
  isOpen,
  onClose,
  onSave,
  currentUserRole,
  mode = 'edit',
}: UserEditModalProps) {
  const [formData, setFormData] = useState<Partial<User>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Role hierarchy: OWNER > ADMIN > MANAGER > USER
  const roleHierarchy = {
    OWNER: 4,
    ADMIN: 3,
    MANAGER: 2,
    USER: 1,
  };

  const currentUserLevel = roleHierarchy[currentUserRole as keyof typeof roleHierarchy] || 1;

  useEffect(() => {
    if (mode === 'add') {
      setFormData({
        email: '',
        name: '',
        password: '',
        role: 'USER',
        plan: 'TRIAL',
        isActive: true,
      });
    } else if (user) {
      setFormData({
        email: user.email,
        name: user.name,
        role: user.role,
        plan: user.plan,
        isActive: user.isActive,
        subscription: user.subscription,
      });
    }
    setErrors({});
  }, [user, mode]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Tên không được để trống';
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'Email không được để trống';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (mode === 'add') {
      if (!formData.password?.trim()) {
        newErrors.password = 'Mật khẩu không được để trống';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
      }
    }

    if (formData.role && !hasPermissionToAssignRole(formData.role)) {
      newErrors.role = 'Bạn không có quyền gán vai trò này';
    }

    if (mode === 'edit' && formData.password) {
      if (formData.password.length < 6) {
        newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const hasPermissionToAssignRole = (role: string) => {
    const roleLevel = roleHierarchy[role as keyof typeof roleHierarchy] || 1;
    return currentUserLevel >= roleLevel;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (mode === 'add') {
      onSave(formData);
    } else if (user) {
      onSave(user.id, formData);
    }
  };

  const handleInputChange = (field: keyof User, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4'>
      <div className='bg-gray-900/90 backdrop-blur-xl rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-white/20'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-800/50'>
          <div className='flex items-center space-x-3'>
            <div className='w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center'>
              <User className='w-5 h-5 text-white' />
            </div>
            <div>
              <h3 className='text-white font-bold text-xl'>
                {mode === 'add' ? 'Thêm user mới' : 'Chỉnh sửa user'}
              </h3>
              <p className='text-gray-400 text-sm'>{user?.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-white transition-colors p-2'
          >
            <X className='w-6 h-6' />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='p-6 space-y-6'>
          {/* Basic Information */}
          <div className='space-y-4'>
            <h4 className='text-white font-semibold flex items-center space-x-2'>
              <User className='w-5 h-5' />
              <span>Thông tin cơ bản</span>
            </h4>

            <div>
              <label className='block text-gray-300 text-sm font-medium mb-2'>
                Tên <span className='text-red-400'>*</span>
              </label>
              <input
                type='text'
                value={formData.name || ''}
                onChange={e => handleInputChange('name', e.target.value)}
                className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                  errors.name
                    ? 'border-red-500 focus:ring-red-500/20'
                    : 'border-gray-600 focus:border-blue-500 focus:ring-blue-500/20'
                }`}
                placeholder='Nhập tên user'
              />
              {errors.name && <p className='text-red-400 text-sm mt-1'>{errors.name}</p>}
            </div>

            <div>
              <label className='block text-gray-300 text-sm font-medium mb-2'>
                Email <span className='text-red-400'>*</span>
              </label>
              <input
                type='email'
                value={formData.email || ''}
                onChange={e => handleInputChange('email', e.target.value)}
                className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                  errors.email
                    ? 'border-red-500 focus:ring-red-500/20'
                    : 'border-gray-600 focus:border-blue-500 focus:ring-blue-500/20'
                }`}
                placeholder='user@example.com'
              />
              {errors.email && <p className='text-red-400 text-sm mt-1'>{errors.email}</p>}
            </div>

            {/* Password field chỉ hiển thị khi add user */}
            {mode === 'add' && (
              <div>
                <label className='block text-gray-300 text-sm font-medium mb-2'>
                  Mật khẩu <span className='text-red-400'>*</span>
                </label>
                <input
                  type='password'
                  value={formData.password || ''}
                  onChange={e => handleInputChange('password', e.target.value)}
                  className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                    errors.password
                      ? 'border-red-500 focus:ring-red-500/20'
                      : 'border-gray-600 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                  placeholder='Nhập mật khẩu (tối thiểu 6 ký tự)'
                />
                {errors.password && <p className='text-red-400 text-sm mt-1'>{errors.password}</p>}
              </div>
            )}
          </div>

          {/* Role & Plan */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-gray-300 text-sm font-medium mb-2'>Vai trò</label>
              <select
                value={formData.role || 'USER'}
                onChange={e => handleInputChange('role', e.target.value)}
                className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-white focus:outline-none focus:ring-2 transition-all ${
                  errors.role
                    ? 'border-red-500 focus:ring-red-500/20'
                    : 'border-gray-600 focus:border-blue-500 focus:ring-blue-500/20'
                }`}
              >
                <option value='USER' disabled={!hasPermissionToAssignRole('USER')}>
                  User
                </option>
                <option value='MANAGER' disabled={!hasPermissionToAssignRole('MANAGER')}>
                  Manager
                </option>
                <option value='ADMIN' disabled={!hasPermissionToAssignRole('ADMIN')}>
                  Admin
                </option>
                <option value='OWNER' disabled={!hasPermissionToAssignRole('OWNER')}>
                  Owner
                </option>
              </select>
              {errors.role && <p className='text-red-400 text-sm mt-1'>{errors.role}</p>}
            </div>

            <div>
              <label className='block text-gray-300 text-sm font-medium mb-2'>
                Gói dịch vụ (Subscription)
              </label>
              <select
                value={formData.plan || 'TRIAL'}
                onChange={e => handleInputChange('plan', e.target.value)}
                className='w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all'
                disabled={['OWNER', 'ADMIN', 'MANAGER'].includes(formData.role as string)}
              >
                <option value='TRIAL'>Trial</option>
                <option value='BASIC'>Basic</option>
                <option value='PRO'>Pro</option>
                <option value='ENTERPRISE'>Enterprise</option>
                <option value='ULTIMATE'>Ultimate</option>
              </select>
              {['OWNER', 'ADMIN', 'MANAGER'].includes(formData.role as string) && (
                <div className='mt-2 text-xs text-gray-400 italic'>
                  Chỉ user mới có thể chọn gói dịch vụ
                </div>
              )}
              {/* Hiển thị ngày bắt đầu/hết hạn nếu có */}
              {user?.subscription && (
                <div className='mt-2 text-xs text-gray-400'>
                  <div>
                    Bắt đầu:{' '}
                    {user.subscription.startDate
                      ? new Date(user.subscription.startDate).toLocaleDateString('vi-VN')
                      : '---'}
                  </div>
                  <div>
                    Hết hạn:{' '}
                    {user.subscription.endDate
                      ? new Date(user.subscription.endDate).toLocaleDateString('vi-VN')
                      : '---'}
                  </div>
                  <div>Trạng thái: {user.subscription.status || '---'}</div>
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className='flex items-center space-x-3 cursor-pointer'>
              <input
                type='checkbox'
                checked={formData.isActive ?? true}
                onChange={e => handleInputChange('isActive', e.target.checked)}
                className='w-5 h-5 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2'
              />
              <span className='text-white font-medium'>Tài khoản hoạt động</span>
            </label>
            <p className='text-gray-400 text-sm mt-1'>Tắt tùy chọn này để khóa tài khoản user</p>
          </div>

          {/* Edit Password */}
          {mode === 'edit' && (
            <div>
              <label className='block text-gray-300 text-sm font-medium mb-2'>
                Đổi mật khẩu mới
              </label>
              <input
                type='password'
                value={formData.password || ''}
                onChange={e => handleInputChange('password', e.target.value)}
                className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                  errors.password
                    ? 'border-red-500 focus:ring-red-500/20'
                    : 'border-gray-600 focus:border-blue-500 focus:ring-blue-500/20'
                }`}
                placeholder='Nhập mật khẩu mới (bỏ trống nếu không đổi)'
              />
              {errors.password && <p className='text-red-400 text-sm mt-1'>{errors.password}</p>}
            </div>
          )}

          {/* Submit Error */}
          {errors.submit && (
            <div className='flex items-center space-x-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg'>
              <AlertTriangle className='w-5 h-5 text-red-400' />
              <p className='text-red-400 text-sm'>{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className='flex items-center justify-end space-x-4 pt-4 border-t border-gray-800/50'>
            <button
              type='button'
              onClick={onClose}
              className='px-6 py-2 bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 border border-gray-500/30 rounded-xl font-medium transition-colors'
            >
              Hủy
            </button>
            <button
              type='submit'
              disabled={isLoading}
              className='flex items-center space-x-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              <Save className='w-4 h-4' />
              <span>
                {isLoading ? 'Đang lưu...' : mode === 'add' ? 'Tạo user' : 'Lưu thay đổi'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
