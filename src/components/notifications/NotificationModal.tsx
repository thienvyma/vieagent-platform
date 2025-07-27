'use client';

import { useState, useEffect } from 'react';
import { X, Bell, AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  priority: number;
  createdAt: string;
  author?: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

export default function NotificationModal({ isOpen, onClose, userId }: NotificationModalProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/notifications?limit=20');
      const data = await response.json();

      if (data.success) {
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unreadCount);
      } else {
        toast.error('Không thể tải thông báo');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Lỗi kết nối mạng');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/user/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          announcementId: notificationId,
          action: 'mark_read',
        }),
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const dismissNotification = async (notificationId: string) => {
    try {
      await fetch('/api/user/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          announcementId: notificationId,
          action: 'dismiss',
        }),
      });

      // Remove from local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success('Đã ẩn thông báo');
    } catch (error) {
      console.error('Error dismissing notification:', error);
      toast.error('Không thể ẩn thông báo');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'INFO':
        return <Info className='w-5 h-5 text-blue-400' />;
      case 'WARNING':
        return <AlertTriangle className='w-5 h-5 text-yellow-400' />;
      case 'SUCCESS':
        return <CheckCircle className='w-5 h-5 text-green-400' />;
      case 'ERROR':
        return <AlertCircle className='w-5 h-5 text-red-400' />;
      default:
        return <Bell className='w-5 h-5 text-gray-400' />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'INFO':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'WARNING':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'SUCCESS':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'ERROR':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getPriorityBadge = (priority: number) => {
    if (priority >= 4)
      return { bg: 'bg-red-500/20', text: 'text-red-300', label: 'Khẩn cấp', emoji: '🔥' };
    if (priority >= 3)
      return { bg: 'bg-orange-500/20', text: 'text-orange-300', label: 'Cao', emoji: '⚡' };
    if (priority >= 2)
      return { bg: 'bg-yellow-500/20', text: 'text-yellow-300', label: 'Trung bình', emoji: '⭐' };
    return { bg: 'bg-gray-500/20', text: 'text-gray-300', label: 'Thấp', emoji: '📌' };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'Vừa xong';
    } else if (diffInHours < 24) {
      return `${diffInHours} giờ trước`;
    } else if (diffInHours < 48) {
      return 'Hôm qua';
    } else {
      return date.toLocaleDateString('vi-VN');
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-[45] flex items-center justify-center'>
      {/* Backdrop */}
      <div className='absolute inset-0 bg-black/50 backdrop-blur-sm' onClick={onClose}></div>

      {/* Modal */}
      <div className='relative bg-gray-900 rounded-3xl shadow-2xl border border-gray-700 w-full max-w-2xl max-h-[80vh] mx-4'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-700'>
          <div className='flex items-center space-x-3'>
            <div className='w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center'>
              <Bell className='w-5 h-5 text-white' />
            </div>
            <div>
              <h2 className='text-xl font-bold text-white'>📢 Thông báo</h2>
              {unreadCount > 0 && (
                <p className='text-sm text-gray-400'>{unreadCount} thông báo chưa đọc</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className='p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* Content */}
        <div className='p-6 overflow-y-auto max-h-[60vh]'>
          {loading ? (
            <div className='flex items-center justify-center py-12'>
              <div className='text-center'>
                <div className='w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
                <p className='text-gray-400'>Đang tải thông báo...</p>
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className='text-center py-12'>
              <div className='w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4'>
                <Bell className='w-8 h-8 text-gray-500' />
              </div>
              <h3 className='text-lg font-semibold text-white mb-2'>Không có thông báo</h3>
              <p className='text-gray-400'>Bạn đã xem hết tất cả thông báo</p>
            </div>
          ) : (
            <div className='space-y-4'>
              {notifications.map(notification => {
                const priorityBadge = getPriorityBadge(notification.priority);

                return (
                  <div
                    key={notification.id}
                    className='bg-white/5 backdrop-blur-sm border border-gray-700 rounded-2xl p-5 hover:bg-white/10 transition-all duration-300 group'
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className='flex items-start justify-between mb-3'>
                      <div className='flex items-center space-x-3'>
                        {getTypeIcon(notification.type)}
                        <div className='flex-1'>
                          <h3 className='text-white font-semibold mb-1'>{notification.title}</h3>
                          <div className='flex items-center space-x-2 mb-2'>
                            <span
                              className={`px-2 py-1 rounded-lg text-xs font-medium border ${getTypeBadge(notification.type)}`}
                            >
                              {notification.type}
                            </span>
                            <span
                              className={`px-2 py-1 rounded-lg text-xs font-medium ${priorityBadge.bg} ${priorityBadge.text}`}
                            >
                              {priorityBadge.emoji} {priorityBadge.label}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          dismissNotification(notification.id);
                        }}
                        className='p-1 text-gray-500 hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity'
                        title='Ẩn thông báo'
                      >
                        <X className='w-4 h-4' />
                      </button>
                    </div>

                    <p className='text-gray-300 text-sm mb-3 leading-relaxed'>
                      {notification.content}
                    </p>

                    <div className='flex items-center justify-between text-xs'>
                      <div className='flex items-center space-x-4 text-gray-500'>
                        <span>📅 {formatDate(notification.createdAt)}</span>
                        {notification.author && (
                          <span>👤 {notification.author.name || notification.author.email}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='p-6 border-t border-gray-700'>
          <div className='flex items-center justify-between'>
            <button
              onClick={fetchNotifications}
              className='text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors'
            >
              🔄 Làm mới
            </button>
            <button
              onClick={onClose}
              className='px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium'
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
