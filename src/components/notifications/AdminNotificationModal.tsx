'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Bell,
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { hasPermission, type UserRole } from '@/lib/permissions';
import toast from 'react-hot-toast';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  isActive: boolean;
  isGlobal: boolean;
  targetUsers: string;
  startDate: string | null;
  endDate: string | null;
  priority: number;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface AdminNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminNotificationModal({ isOpen, onClose }: AdminNotificationModalProps) {
  const { data: session } = useSession();
  const currentUserRole = session?.user?.role as UserRole;

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'INFO' as 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR',
    isActive: true,
    isGlobal: true,
    targetUsers: 'all',
    startDate: '',
    endDate: '',
    priority: 1,
  });

  const canViewAnnouncements = hasPermission(currentUserRole, 'view_announcements');
  const canCreateAnnouncements = hasPermission(currentUserRole, 'create_announcements');
  const canEditAnnouncements = hasPermission(currentUserRole, 'edit_announcements');
  const canDeleteAnnouncements = hasPermission(currentUserRole, 'delete_announcements');

  useEffect(() => {
    if (isOpen && canViewAnnouncements) {
      fetchAnnouncements();
    }
  }, [isOpen, canViewAnnouncements]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/announcements?limit=50');
      const data = await response.json();

      if (data.announcements) {
        setAnnouncements(data.announcements);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast.error('Không thể tải thông báo');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.content) {
      toast.error('Vui lòng nhập đầy đủ tiêu đề và nội dung');
      return;
    }

    try {
      const url = editingAnnouncement
        ? `/api/admin/announcements/${editingAnnouncement.id}`
        : '/api/admin/announcements';

      const method = editingAnnouncement ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(editingAnnouncement ? 'Đã cập nhật thông báo' : 'Đã tạo thông báo mới');
        fetchAnnouncements();
        resetForm();
      } else {
        toast.error(data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      toast.error('Lỗi kết nối mạng');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa thông báo này?')) return;

    try {
      const response = await fetch(`/api/admin/announcements/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Đã xóa thông báo');
        fetchAnnouncements();
      } else {
        toast.error('Không thể xóa thông báo');
      }
    } catch (error) {
      toast.error('Lỗi kết nối mạng');
    }
  };

  const handleToggleActive = async (announcement: Announcement) => {
    try {
      const response = await fetch(`/api/admin/announcements/${announcement.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...announcement,
          isActive: !announcement.isActive,
        }),
      });

      if (response.ok) {
        toast.success(`Đã ${!announcement.isActive ? 'kích hoạt' : 'tắt'} thông báo`);
        fetchAnnouncements();
      } else {
        toast.error('Không thể cập nhật trạng thái');
      }
    } catch (error) {
      toast.error('Lỗi kết nối mạng');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'INFO',
      isActive: true,
      isGlobal: true,
      targetUsers: 'all',
      startDate: '',
      endDate: '',
      priority: 1,
    });
    setShowCreateForm(false);
    setEditingAnnouncement(null);
  };

  const startEdit = (announcement: Announcement) => {
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      isActive: announcement.isActive,
      isGlobal: announcement.isGlobal,
      targetUsers: announcement.targetUsers,
      startDate: announcement.startDate ? announcement.startDate.split('T')[0] : '',
      endDate: announcement.endDate ? announcement.endDate.split('T')[0] : '',
      priority: announcement.priority,
    });
    setEditingAnnouncement(announcement);
    setShowCreateForm(true);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'INFO':
        return <Info className='w-4 h-4 text-blue-400' />;
      case 'WARNING':
        return <AlertTriangle className='w-4 h-4 text-yellow-400' />;
      case 'SUCCESS':
        return <CheckCircle className='w-4 h-4 text-green-400' />;
      case 'ERROR':
        return <AlertCircle className='w-4 h-4 text-red-400' />;
      default:
        return <Bell className='w-4 h-4 text-gray-400' />;
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

  if (!isOpen) return null;

  if (!canViewAnnouncements) {
    return (
      <div className='fixed inset-0 z-[45] flex items-center justify-center p-4'>
        <div className='absolute inset-0 bg-black/50 backdrop-blur-sm' onClick={onClose}></div>
        <div className='relative bg-gray-900 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-gray-700 max-w-md mx-4'>
          <div className='text-center'>
            <AlertCircle className='w-12 h-12 sm:w-16 sm:h-16 text-red-400 mx-auto mb-3 sm:mb-4' />
            <h3 className='text-lg sm:text-xl font-bold text-white mb-2'>Access Denied</h3>
            <p className='text-sm sm:text-base text-gray-400 mb-4'>
              Bạn không có quyền xem thông báo
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
    <div className='fixed inset-0 z-[45] flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto'>
      {/* Backdrop */}
      <div className='absolute inset-0 bg-black/50 backdrop-blur-sm' onClick={onClose}></div>

      {/* Modal */}
      <div className='relative bg-gray-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-700 w-full max-w-7xl max-h-[95vh] sm:max-h-[90vh] mx-4 overflow-hidden my-4 sm:my-0'>
        {/* Header */}
        <div className='flex items-center justify-between p-4 sm:p-6 border-b border-gray-700'>
          <div className='flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1'>
            <div className='w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0'>
              <Bell className='w-4 h-4 sm:w-5 sm:h-5 text-white' />
            </div>
            <div className='min-w-0'>
              <h2 className='text-lg sm:text-xl font-bold text-white truncate'>
                📢 Admin - Quản lý thông báo
              </h2>
              <p className='text-xs sm:text-sm text-gray-400 hidden sm:block'>
                Tạo và quản lý thông báo hệ thống
              </p>
            </div>
          </div>
          <div className='flex items-center space-x-2 sm:space-x-3 flex-shrink-0'>
            {canCreateAnnouncements && (
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className='px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg sm:rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base'
              >
                <Plus className='w-3 h-3 sm:w-4 sm:h-4' />
                <span className='hidden sm:inline'>Tạo mới</span>
                <span className='sm:hidden'>+</span>
              </button>
            )}
            <button
              onClick={onClose}
              className='p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg sm:rounded-xl transition-colors'
            >
              <X className='w-4 h-4 sm:w-5 sm:h-5' />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='flex h-[calc(90vh-100px)]'>
          {/* Announcement List */}
          <div className={`${showCreateForm ? 'flex-1' : 'w-full'} p-6 overflow-y-auto`}>
            {loading ? (
              <div className='flex items-center justify-center py-12'>
                <div className='w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
              </div>
            ) : announcements.length === 0 ? (
              <div className='text-center py-12'>
                <Bell className='w-16 h-16 text-gray-500 mx-auto mb-4' />
                <h3 className='text-lg font-semibold text-white mb-2'>Chưa có thông báo</h3>
                <p className='text-gray-400'>Tạo thông báo đầu tiên để bắt đầu</p>
              </div>
            ) : (
              <div className='space-y-4'>
                {announcements.map(announcement => (
                  <div
                    key={announcement.id}
                    className='bg-white/5 backdrop-blur-sm border border-gray-700 rounded-2xl p-4 hover:bg-white/10 transition-all group'
                  >
                    <div className='flex items-start justify-between mb-3'>
                      <div className='flex items-start space-x-3 flex-1'>
                        {getTypeIcon(announcement.type)}
                        <div className='flex-1'>
                          <h3 className='text-white font-semibold mb-1'>{announcement.title}</h3>
                          <div className='flex items-center space-x-2 mb-2'>
                            <span
                              className={`px-2 py-1 rounded-lg text-xs font-medium border ${getTypeBadge(announcement.type)}`}
                            >
                              {announcement.type}
                            </span>
                            <span
                              className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                announcement.isActive
                                  ? 'bg-green-500/20 text-green-300'
                                  : 'bg-gray-500/20 text-gray-300'
                              }`}
                            >
                              {announcement.isActive ? '🟢 Hoạt động' : '🔴 Tạm dừng'}
                            </span>
                            <span className='text-xs text-gray-400'>
                              📅 {new Date(announcement.createdAt).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                          <p className='text-gray-300 text-sm line-clamp-2'>
                            {announcement.content}
                          </p>
                        </div>
                      </div>

                      <div className='flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity'>
                        <button
                          onClick={() => handleToggleActive(announcement)}
                          className='p-2 text-gray-400 hover:text-yellow-400 transition-colors'
                          title={announcement.isActive ? 'Tắt thông báo' : 'Kích hoạt thông báo'}
                        >
                          {announcement.isActive ? '⏸️' : '▶️'}
                        </button>
                        {canEditAnnouncements && (
                          <button
                            onClick={() => startEdit(announcement)}
                            className='p-2 text-gray-400 hover:text-blue-400 transition-colors'
                            title='Chỉnh sửa'
                          >
                            <Edit className='w-4 h-4' />
                          </button>
                        )}
                        {canDeleteAnnouncements && (
                          <button
                            onClick={() => handleDelete(announcement.id)}
                            className='p-2 text-gray-400 hover:text-red-400 transition-colors'
                            title='Xóa'
                          >
                            <Trash2 className='w-4 h-4' />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create/Edit Form */}
          {showCreateForm && canCreateAnnouncements && (
            <div className='w-96 border-l border-gray-700 p-6 overflow-y-auto bg-gray-900/50'>
              <h3 className='text-lg font-bold text-white mb-4'>
                {editingAnnouncement ? '✏️ Chỉnh sửa thông báo' : '➕ Tạo thông báo mới'}
              </h3>

              <form onSubmit={handleSubmit} className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>Tiêu đề</label>
                  <input
                    type='text'
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                    placeholder='Tiêu đề thông báo...'
                    required
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>Nội dung</label>
                  <textarea
                    value={formData.content}
                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                    rows={4}
                    className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                    placeholder='Nội dung thông báo...'
                    required
                  />
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>Loại</label>
                    <select
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                      className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                    >
                      <option value='INFO'>Thông tin</option>
                      <option value='WARNING'>Cảnh báo</option>
                      <option value='SUCCESS'>Thành công</option>
                      <option value='ERROR'>Lỗi</option>
                    </select>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      Độ ưu tiên
                    </label>
                    <select
                      value={formData.priority}
                      onChange={e =>
                        setFormData({ ...formData, priority: parseInt(e.target.value) })
                      }
                      className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                    >
                      <option value={1}>Thấp</option>
                      <option value={2}>Trung bình</option>
                      <option value={3}>Cao</option>
                      <option value={4}>Khẩn cấp</option>
                    </select>
                  </div>
                </div>

                <div className='flex items-center space-x-4'>
                  <label className='flex items-center space-x-2'>
                    <input
                      type='checkbox'
                      checked={formData.isActive}
                      onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                      className='rounded bg-gray-800 border-gray-600 text-blue-500 focus:ring-blue-500'
                    />
                    <span className='text-sm text-gray-300'>Kích hoạt ngay</span>
                  </label>

                  <label className='flex items-center space-x-2'>
                    <input
                      type='checkbox'
                      checked={formData.isGlobal}
                      onChange={e => setFormData({ ...formData, isGlobal: e.target.checked })}
                      className='rounded bg-gray-800 border-gray-600 text-blue-500 focus:ring-blue-500'
                    />
                    <span className='text-sm text-gray-300'>Toàn hệ thống</span>
                  </label>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      Ngày bắt đầu
                    </label>
                    <input
                      type='date'
                      value={formData.startDate}
                      onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                      className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      Ngày kết thúc
                    </label>
                    <input
                      type='date'
                      value={formData.endDate}
                      onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                      className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>
                </div>

                <div className='flex items-center space-x-3 pt-4'>
                  <button
                    type='submit'
                    className='flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all'
                  >
                    {editingAnnouncement ? '💾 Cập nhật' : '✨ Tạo thông báo'}
                  </button>
                  <button
                    type='button'
                    onClick={resetForm}
                    className='px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors'
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
