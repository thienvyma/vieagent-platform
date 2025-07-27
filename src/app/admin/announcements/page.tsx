'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { hasPermission, type UserRole } from '@/lib/permissions';

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

interface AnnouncementStats {
  total: number;
  active: number;
  scheduled: number;
  highPriority: number;
}

export default function AnnouncementsManagementPage() {
  const { data: session } = useSession();
  const currentUserRole = session?.user?.role as UserRole;

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [stats, setStats] = useState<AnnouncementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const canViewAnnouncements = hasPermission(currentUserRole, 'view_announcements');
  const canCreateAnnouncements = hasPermission(currentUserRole, 'create_announcements');

  useEffect(() => {
    if (canViewAnnouncements) {
      fetchAnnouncements();
    }
  }, [canViewAnnouncements, typeFilter, statusFilter, searchTerm]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.append('type', typeFilter.toUpperCase());
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/admin/announcements?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.announcements);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    const badges = {
      INFO: 'bg-blue-500/20 text-blue-300',
      WARNING: 'bg-yellow-500/20 text-yellow-300',
      SUCCESS: 'bg-green-500/20 text-green-300',
      ERROR: 'bg-red-500/20 text-red-300',
    };
    return badges[type as keyof typeof badges] || badges.INFO;
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      INFO: 'ℹ️',
      WARNING: '⚠️',
      SUCCESS: '✅',
      ERROR: '❌',
    };
    return icons[type as keyof typeof icons] || '📢';
  };

  const getPriorityBadge = (priority: number) => {
    if (priority >= 4) return 'bg-red-500/20 text-red-300';
    if (priority >= 3) return 'bg-orange-500/20 text-orange-300';
    if (priority >= 2) return 'bg-yellow-500/20 text-yellow-300';
    return 'bg-gray-500/20 text-gray-300';
  };

  const getPriorityText = (priority: number) => {
    if (priority >= 4) return 'Khẩn cấp';
    if (priority >= 3) return 'Cao';
    if (priority >= 2) return 'Trung bình';
    return 'Thấp';
  };

  const isAnnouncementActive = (announcement: Announcement) => {
    if (!announcement.isActive) return false;

    const now = new Date();
    const startDate = announcement.startDate ? new Date(announcement.startDate) : null;
    const endDate = announcement.endDate ? new Date(announcement.endDate) : null;

    if (startDate && startDate > now) return false;
    if (endDate && endDate < now) return false;

    return true;
  };

  if (!canViewAnnouncements) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-black text-white'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold mb-4'>Access Denied</h1>
          <p className='text-gray-400'>You don&apos;t have permission to view announcements.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-black text-white p-6'>
      {/* Background Effects */}
      <div className='fixed inset-0 z-0'>
        <div className='absolute inset-0 bg-gradient-to-br from-slate-900 via-orange-900/20 to-slate-900'></div>
        <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl animate-pulse'></div>
        <div className='absolute bottom-1/4 right-1/4 w-80 h-80 bg-red-500/5 rounded-full blur-3xl animate-pulse delay-1000'></div>
      </div>

      <div className='relative z-10 max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-4xl font-black bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent mb-2'>
                📢 ANNOUNCEMENTS MANAGEMENT
              </h1>
              <p className='text-gray-400 text-lg'>Quản lý thông báo và tin tức hệ thống</p>
            </div>
            {canCreateAnnouncements && (
              <button className='px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-2xl hover:from-orange-700 hover:to-red-700 transition-all duration-300 shadow-2xl hover:scale-105'>
                📢 Tạo thông báo mới
              </button>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
            <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-gray-400 text-sm'>Tổng thông báo</p>
                  <p className='text-3xl font-bold text-white'>{stats.total}</p>
                </div>
                <div className='w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center'>
                  <span className='text-2xl'>📢</span>
                </div>
              </div>
            </div>

            <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-gray-400 text-sm'>Đang hoạt động</p>
                  <p className='text-3xl font-bold text-green-400'>{stats.active}</p>
                </div>
                <div className='w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center'>
                  <span className='text-2xl'>✅</span>
                </div>
              </div>
            </div>

            <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-gray-400 text-sm'>Đã lên lịch</p>
                  <p className='text-3xl font-bold text-blue-400'>{stats.scheduled}</p>
                </div>
                <div className='w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center'>
                  <span className='text-2xl'>⏰</span>
                </div>
              </div>
            </div>

            <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-gray-400 text-sm'>Ưu tiên cao</p>
                  <p className='text-3xl font-bold text-red-400'>{stats.highPriority}</p>
                </div>
                <div className='w-12 h-12 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl flex items-center justify-center'>
                  <span className='text-2xl'>🔥</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-8'>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
            <div>
              <label className='block text-gray-300 text-sm font-medium mb-2'>Tìm kiếm</label>
              <input
                type='text'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder='Tìm theo tiêu đề, nội dung...'
                className='w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent'
              />
            </div>

            <div>
              <label className='block text-gray-300 text-sm font-medium mb-2'>Loại thông báo</label>
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className='w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent'
              >
                <option value='all'>Tất cả loại</option>
                <option value='info'>Thông tin</option>
                <option value='warning'>Cảnh báo</option>
                <option value='success'>Thành công</option>
                <option value='error'>Lỗi</option>
              </select>
            </div>

            <div>
              <label className='block text-gray-300 text-sm font-medium mb-2'>Trạng thái</label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className='w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent'
              >
                <option value='all'>Tất cả trạng thái</option>
                <option value='active'>Đang hoạt động</option>
                <option value='inactive'>Không hoạt động</option>
                <option value='scheduled'>Đã lên lịch</option>
                <option value='expired'>Đã hết hạn</option>
              </select>
            </div>
          </div>
        </div>

        {/* Announcements Table */}
        <div className='bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-white/10'>
                  <th className='px-6 py-4 text-left text-gray-300 font-medium'>Thông báo</th>
                  <th className='px-6 py-4 text-left text-gray-300 font-medium'>Loại</th>
                  <th className='px-6 py-4 text-left text-gray-300 font-medium'>Ưu tiên</th>
                  <th className='px-6 py-4 text-left text-gray-300 font-medium'>Trạng thái</th>
                  <th className='px-6 py-4 text-left text-gray-300 font-medium'>Phạm vi</th>
                  <th className='px-6 py-4 text-left text-gray-300 font-medium'>Thời gian</th>
                  <th className='px-6 py-4 text-left text-gray-300 font-medium'>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className='border-b border-white/5'>
                      <td className='py-4 px-6'>
                        <div className='animate-pulse bg-white/10 h-4 w-48 rounded'></div>
                      </td>
                      <td className='py-4 px-6'>
                        <div className='animate-pulse bg-white/10 h-6 w-20 rounded-full'></div>
                      </td>
                      <td className='py-4 px-6'>
                        <div className='animate-pulse bg-white/10 h-6 w-16 rounded-full'></div>
                      </td>
                      <td className='py-4 px-6'>
                        <div className='animate-pulse bg-white/10 h-6 w-24 rounded-full'></div>
                      </td>
                      <td className='py-4 px-6'>
                        <div className='animate-pulse bg-white/10 h-4 w-20 rounded'></div>
                      </td>
                      <td className='py-4 px-6'>
                        <div className='animate-pulse bg-white/10 h-4 w-28 rounded'></div>
                      </td>
                      <td className='py-4 px-6'>
                        <div className='animate-pulse bg-white/10 h-8 w-24 rounded'></div>
                      </td>
                    </tr>
                  ))
                ) : announcements.length > 0 ? (
                  announcements.map(announcement => (
                    <tr
                      key={announcement.id}
                      className='border-b border-white/5 hover:bg-white/5 transition-colors'
                    >
                      <td className='py-4 px-6'>
                        <div>
                          <div className='flex items-center space-x-2 mb-1'>
                            <span className='text-lg'>{getTypeIcon(announcement.type)}</span>
                            <h3 className='font-medium text-white'>{announcement.title}</h3>
                          </div>
                          <p className='text-sm text-gray-400 line-clamp-2'>
                            {announcement.content}
                          </p>
                        </div>
                      </td>
                      <td className='py-4 px-6'>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeBadge(announcement.type)}`}
                        >
                          {announcement.type}
                        </span>
                      </td>
                      <td className='py-4 px-6'>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityBadge(announcement.priority)}`}
                        >
                          {getPriorityText(announcement.priority)}
                        </span>
                      </td>
                      <td className='py-4 px-6'>
                        <div className='flex items-center space-x-2'>
                          <div
                            className={`w-3 h-3 rounded-full ${isAnnouncementActive(announcement) ? 'bg-green-400' : 'bg-gray-400'}`}
                          ></div>
                          <span className='text-sm'>
                            {isAnnouncementActive(announcement) ? 'Hoạt động' : 'Không hoạt động'}
                          </span>
                        </div>
                      </td>
                      <td className='py-4 px-6'>
                        <span className='text-sm text-gray-400'>
                          {announcement.isGlobal ? 'Toàn hệ thống' : 'Mục tiêu cụ thể'}
                        </span>
                      </td>
                      <td className='py-4 px-6'>
                        <div className='text-sm text-gray-400'>
                          <p>Tạo: {new Date(announcement.createdAt).toLocaleDateString('vi-VN')}</p>
                          {announcement.startDate && (
                            <p>
                              Bắt đầu:{' '}
                              {new Date(announcement.startDate).toLocaleDateString('vi-VN')}
                            </p>
                          )}
                          {announcement.endDate && (
                            <p>
                              Kết thúc: {new Date(announcement.endDate).toLocaleDateString('vi-VN')}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className='py-4 px-6'>
                        <div className='flex items-center space-x-2'>
                          <button
                            className='p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-all'
                            title='Chỉnh sửa'
                          >
                            ✏️
                          </button>
                          <button
                            className='p-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20 rounded-lg transition-all'
                            title='Kích hoạt/Tắt'
                          >
                            {announcement.isActive ? '⏸️' : '▶️'}
                          </button>
                          <button
                            className='p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all'
                            title='Xóa'
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className='py-12 text-center'>
                      <div className='text-6xl mb-4'>📢</div>
                      <p className='text-xl text-gray-400 mb-2'>Chưa có thông báo nào</p>
                      <p className='text-gray-500'>Tạo thông báo đầu tiên để bắt đầu</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
