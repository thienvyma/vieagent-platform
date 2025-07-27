'use client';

import { useState } from 'react';
import {
  X,
  Edit,
  Trash2,
  Lock,
  Unlock,
  Mail,
  Calendar,
  Activity,
  Bot,
  MessageSquare,
  Key,
  Crown,
  Shield,
  UserCheck,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'USER';
  plan: 'TRIAL' | 'BASIC' | 'PRO' | 'ENTERPRISE' | 'ULTIMATE';
  isActive: boolean;
  createdAt: string;
  agentsCount: number;
  conversationsCount: number;
  statistics?: {
    agentsCount: number;
    conversationsCount: number;
    messagesCount: number;
  };
  subscription?: {
    plan: 'TRIAL' | 'BASIC' | 'PRO' | 'ENTERPRISE' | 'ULTIMATE';
    startDate?: string;
    endDate?: string;
    status?: string;
  };
}

interface UserDetailModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
  onResetPassword: (userId: string) => void;
  onToggleStatus: (userId: string, isActive: boolean) => void;
}

export default function UserDetailModal({
  user,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onResetPassword,
  onToggleStatus,
}: UserDetailModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'settings'>('overview');

  if (!user || !isOpen) return null;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <Crown className='w-5 h-5 text-yellow-500' />;
      case 'ADMIN':
        return <Shield className='w-5 h-5 text-red-500' />;
      case 'MANAGER':
        return <UserCheck className='w-5 h-5 text-blue-500' />;
      default:
        return <Users className='w-5 h-5 text-gray-500' />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'ADMIN':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'MANAGER':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'TRIAL':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'BASIC':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'PRO':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'ENTERPRISE':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'ULTIMATE':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const handleAction = async (action: string) => {
    setIsLoading(true);
    try {
      switch (action) {
        case 'edit':
          onEdit(user);
          break;
        case 'delete':
          if (confirm('Bạn có chắc chắn muốn xóa user này?')) {
            onDelete(user.id);
          }
          break;
        case 'reset-password':
          if (confirm('Bạn có chắc chắn muốn reset password cho user này?')) {
            onResetPassword(user.id);
          }
          break;
        case 'toggle-status':
          onToggleStatus(user.id, !user.isActive);
          break;
      }
    } catch (error) {
      console.error('Error performing action:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4'>
      <div className='bg-gray-900/90 backdrop-blur-xl rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-white/20'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-800/50'>
          <div className='flex items-center space-x-4'>
            <div className='w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center'>
              <span className='text-white font-semibold text-lg'>
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <h3 className='text-white font-bold text-xl'>{user.name || 'Unknown User'}</h3>
              <p className='text-gray-400'>{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-white transition-colors p-2'
          >
            <X className='w-6 h-6' />
          </button>
        </div>

        {/* Tabs */}
        <div className='flex border-b border-gray-800/50'>
          {[
            { id: 'overview', label: 'Tổng quan', icon: Activity },
            { id: 'activity', label: 'Hoạt động', icon: TrendingUp },
            { id: 'settings', label: 'Cài đặt', icon: Shield },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-white border-b-2 border-red-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon className='w-4 h-4' />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className='p-6 overflow-y-auto max-h-[60vh]'>
          {activeTab === 'overview' && (
            <div className='space-y-6'>
              {/* Basic Info */}
              <div className='bg-white/5 rounded-xl p-6'>
                <h4 className='text-white font-semibold mb-4 flex items-center space-x-2'>
                  <Users className='w-5 h-5' />
                  <span>Thông tin cơ bản</span>
                </h4>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <p className='text-gray-400 text-sm'>Email</p>
                    <p className='text-white'>{user.email}</p>
                  </div>
                  <div>
                    <p className='text-gray-400 text-sm'>Tên</p>
                    <p className='text-white'>{user.name || 'Chưa cập nhật'}</p>
                  </div>
                  <div>
                    <p className='text-gray-400 text-sm'>Vai trò</p>
                    <div className='flex items-center space-x-2'>
                      {getRoleIcon(user.role)}
                      <span
                        className={`px-2 py-1 rounded-full text-xs border ${getRoleColor(user.role)}`}
                      >
                        {user.role}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className='text-gray-400 text-sm'>Gói dịch vụ</p>
                    {user.role === 'USER' ? (
                      <span
                        className={`px-2 py-1 rounded-full text-xs border ${getPlanColor(user.plan)}`}
                      >
                        {user.plan}
                      </span>
                    ) : (
                      <span className='text-gray-500 italic'>—</span>
                    )}
                  </div>
                  <div>
                    <p className='text-gray-400 text-sm'>Trạng thái</p>
                    <div className='flex items-center space-x-2'>
                      {user.isActive ? (
                        <CheckCircle className='w-4 h-4 text-green-500' />
                      ) : (
                        <AlertTriangle className='w-4 h-4 text-red-500' />
                      )}
                      <span
                        className={`px-2 py-1 rounded-full text-xs border ${
                          user.isActive
                            ? 'bg-green-500/20 text-green-300 border-green-500/30'
                            : 'bg-red-500/20 text-red-300 border-red-500/30'
                        }`}
                      >
                        {user.isActive ? 'Hoạt động' : 'Không hoạt động'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className='text-gray-400 text-sm'>Ngày tạo</p>
                    <p className='text-white'>
                      {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              {user.statistics && (
                <div className='bg-white/5 rounded-xl p-6'>
                  <h4 className='text-white font-semibold mb-4 flex items-center space-x-2'>
                    <TrendingUp className='w-5 h-5' />
                    <span>Thống kê hoạt động</span>
                  </h4>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <div className='text-center p-4 bg-white/5 rounded-xl'>
                      <Bot className='w-8 h-8 text-blue-400 mx-auto mb-2' />
                      <p className='text-2xl font-bold text-white'>{user.statistics.agentsCount}</p>
                      <p className='text-gray-400 text-sm'>AI Agents</p>
                    </div>
                    <div className='text-center p-4 bg-white/5 rounded-xl'>
                      <MessageSquare className='w-8 h-8 text-green-400 mx-auto mb-2' />
                      <p className='text-2xl font-bold text-white'>
                        {user.statistics.conversationsCount}
                      </p>
                      <p className='text-gray-400 text-sm'>Cuộc hội thoại</p>
                    </div>
                    <div className='text-center p-4 bg-white/5 rounded-xl'>
                      <Activity className='w-8 h-8 text-purple-400 mx-auto mb-2' />
                      <p className='text-2xl font-bold text-white'>
                        {user.statistics.messagesCount}
                      </p>
                      <p className='text-gray-400 text-sm'>Tin nhắn</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className='space-y-6'>
              <div className='bg-white/5 rounded-xl p-6'>
                <h4 className='text-white font-semibold mb-4'>Hoạt động gần đây</h4>
                <div className='space-y-4'>
                  <div className='flex items-center space-x-3 p-3 bg-white/5 rounded-lg'>
                    <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                    <div className='flex-1'>
                      <p className='text-white text-sm'>User đăng nhập lần cuối</p>
                      <p className='text-gray-400 text-xs'>2 giờ trước</p>
                    </div>
                  </div>
                  <div className='flex items-center space-x-3 p-3 bg-white/5 rounded-lg'>
                    <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                    <div className='flex-1'>
                      <p className='text-white text-sm'>Tạo AI Agent mới</p>
                      <p className='text-gray-400 text-xs'>1 ngày trước</p>
                    </div>
                  </div>
                  <div className='flex items-center space-x-3 p-3 bg-white/5 rounded-lg'>
                    <div className='w-2 h-2 bg-purple-500 rounded-full'></div>
                    <div className='flex-1'>
                      <p className='text-white text-sm'>Nâng cấp lên gói PRO</p>
                      <p className='text-gray-400 text-xs'>3 ngày trước</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className='space-y-6'>
              <div className='bg-white/5 rounded-xl p-6'>
                <h4 className='text-white font-semibold mb-4'>Quản lý tài khoản</h4>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between p-4 bg-white/5 rounded-lg'>
                    <div>
                      <p className='text-white font-medium'>Trạng thái tài khoản</p>
                      <p className='text-gray-400 text-sm'>
                        {user.isActive ? 'Tài khoản đang hoạt động' : 'Tài khoản đã bị khóa'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAction('toggle-status')}
                      disabled={isLoading}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        user.isActive
                          ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30'
                          : 'bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-500/30'
                      }`}
                    >
                      {user.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                    </button>
                  </div>

                  <div className='flex items-center justify-between p-4 bg-white/5 rounded-lg'>
                    <div>
                      <p className='text-white font-medium'>Reset mật khẩu</p>
                      <p className='text-gray-400 text-sm'>Gửi mật khẩu mới qua email</p>
                    </div>
                    <button
                      onClick={() => handleAction('reset-password')}
                      disabled={isLoading}
                      className='px-4 py-2 bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 border border-yellow-500/30 rounded-lg font-medium transition-colors'
                    >
                      Reset Password
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className='flex items-center justify-between p-6 border-t border-gray-800/50'>
          <div className='flex space-x-4'>
            <button
              onClick={() => handleAction('edit')}
              disabled={isLoading}
              className='flex items-center space-x-2 px-4 py-2 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg font-medium transition-colors'
            >
              <Edit className='w-4 h-4' />
              <span>Chỉnh sửa</span>
            </button>
            <button
              onClick={() => handleAction('delete')}
              disabled={isLoading}
              className='flex items-center space-x-2 px-4 py-2 bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30 rounded-lg font-medium transition-colors'
            >
              <Trash2 className='w-4 h-4' />
              <span>Xóa user</span>
            </button>
          </div>
          <button
            onClick={onClose}
            className='px-4 py-2 bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 border border-gray-500/30 rounded-lg font-medium transition-colors'
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
