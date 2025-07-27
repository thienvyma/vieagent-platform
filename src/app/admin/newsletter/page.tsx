'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { hasPermission, type UserRole } from '@/lib/permissions';
import {
  Mail,
  Users,
  TrendingUp,
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Building,
  UserCheck,
  UserX,
  RefreshCw,
  Send,
  X,
  Star,
  Archive,
  Settings,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Newsletter {
  id: string;
  email: string;
  name?: string;
  company?: string;
  source: string;
  isActive: boolean;
  confirmedAt?: string;
  unsubscribedAt?: string;
  openCount: number;
  clickCount: number;
  lastOpened?: string;
  createdAt: string;
}

interface NewsletterStats {
  total: number;
  active: number;
  unsubscribed: number;
  thisMonth: number;
  openRate: number;
  clickRate: number;
}

export default function AdminNewsletter() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [stats, setStats] = useState<NewsletterStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [bulkSelection, setBulkSelection] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkEmailModal, setShowBulkEmailModal] = useState(false);
  const [newSubscriber, setNewSubscriber] = useState({
    email: '',
    name: '',
    company: '',
    source: 'admin',
  });

  const userRole = session?.user?.role as UserRole;
  const canViewNewsletter = hasPermission(userRole, 'view_newsletter');
  const canCreateNewsletter = hasPermission(userRole, 'create_newsletter');
  const canEditNewsletter = hasPermission(userRole, 'edit_newsletter');
  const canDeleteNewsletter = hasPermission(userRole, 'delete_newsletter');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      if (!canViewNewsletter) {
        router.push('/admin');
      } else {
        fetchNewsletters();
        fetchStats();
      }
    }
  }, [status, canViewNewsletter, router, currentPage, search, statusFilter, sourceFilter]);

  const fetchNewsletters = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search,
        status: statusFilter,
        source: sourceFilter,
      });

      const response = await fetch(`/api/admin/newsletter?${params}`);
      if (response.ok) {
        const data = await response.json();
        setNewsletters(data.newsletters);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching newsletters:', error);
      toast.error('Không thể tải danh sách newsletter');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/newsletter/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNewsletters();
    await fetchStats();
    toast.success('Đã làm mới dữ liệu');
  };

  const handleStatusChange = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/newsletter/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });

      if (response.ok) {
        fetchNewsletters();
        fetchStats();
        toast.success(isActive ? 'Đã kích hoạt người đăng ký' : 'Đã hủy đăng ký');
      }
    } catch (error) {
      console.error('Error updating newsletter:', error);
      toast.error('Không thể cập nhật trạng thái');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa người đăng ký này?')) return;

    try {
      const response = await fetch(`/api/admin/newsletter/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchNewsletters();
        fetchStats();
        toast.success('Đã xóa người đăng ký');
      }
    } catch (error) {
      console.error('Error deleting newsletter:', error);
      toast.error('Không thể xóa người đăng ký');
    }
  };

  const handleBulkAction = async (action: string) => {
    if (bulkSelection.length === 0) {
      toast.error('Vui lòng chọn ít nhất một người đăng ký');
      return;
    }

    if (
      action === 'delete' &&
      !confirm(`Bạn có chắc chắn muốn xóa ${bulkSelection.length} người đăng ký?`)
    ) {
      return;
    }

    try {
      const promises = bulkSelection.map(id => {
        if (action === 'delete') {
          return fetch(`/api/admin/newsletter/${id}`, { method: 'DELETE' });
        } else {
          return fetch(`/api/admin/newsletter/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: action === 'activate' }),
          });
        }
      });

      await Promise.all(promises);
      setBulkSelection([]);
      fetchNewsletters();
      fetchStats();
      toast.success(
        `Đã ${action === 'delete' ? 'xóa' : 'cập nhật'} ${bulkSelection.length} người đăng ký`
      );
    } catch (error) {
      console.error('Error with bulk action:', error);
      toast.error('Có lỗi xảy ra khi thực hiện hành động');
    }
  };

  const handleAddSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newSubscriber.email.trim()) {
      toast.error('Vui lòng nhập địa chỉ email');
      return;
    }

    try {
      const response = await fetch('/api/admin/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSubscriber),
      });

      if (response.ok) {
        setShowAddModal(false);
        setNewSubscriber({ email: '', name: '', company: '', source: 'admin' });
        fetchNewsletters();
        fetchStats();
        toast.success('Đã thêm người đăng ký mới');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Không thể thêm người đăng ký');
      }
    } catch (error) {
      console.error('Error adding subscriber:', error);
      toast.error('Lỗi kết nối mạng');
    }
  };

  const exportNewsletters = () => {
    const csv = newsletters
      .map(
        n =>
          `"${n.email}","${n.name || ''}","${n.company || ''}","${n.source}","${n.isActive ? 'Đã đăng ký' : 'Đã hủy'}","${new Date(n.createdAt).toLocaleDateString('vi-VN')}"`
      )
      .join('\n');

    const blob = new Blob([`Email,Tên,Công ty,Nguồn,Trạng thái,Ngày tạo\n${csv}`], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Đã xuất file CSV thành công');
  };

  if (status === 'loading') {
    return (
      <div className='min-h-screen bg-black flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-gray-400'>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-black text-white'>
      {/* Background Effects */}
      <div className='fixed inset-0 z-0'>
        <div className='absolute inset-0 bg-gradient-to-br from-slate-900 via-orange-900/20 to-slate-900'></div>
        <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse'></div>
        <div className='absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000'></div>
        <div className='absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]'></div>
      </div>

      {/* Enhanced Header */}
      <header className='relative z-10 border-b border-gray-800/50 backdrop-blur-sm'>
        <div className='container mx-auto px-4 py-6'>
          <div className='flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0'>
            <div className='flex items-center space-x-4'>
              <div className='w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center'>
                <Mail className='w-6 h-6 text-white' />
              </div>
              <div>
                <h1 className='text-2xl lg:text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent'>
                  📧 Quản lý Newsletter
                </h1>
                <p className='text-gray-400 text-sm lg:text-base'>
                  Quản lý đăng ký newsletter và email marketing
                </p>
              </div>
            </div>

            <div className='flex flex-wrap items-center gap-3'>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className='px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-xl text-gray-300 hover:bg-gray-600/50 transition-all flex items-center space-x-2'
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className='hidden sm:inline'>Làm mới</span>
              </button>

              <button
                onClick={exportNewsletters}
                className='px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-xl text-green-300 hover:bg-green-500/30 transition-all flex items-center space-x-2'
              >
                <Download className='w-4 h-4' />
                <span className='hidden sm:inline'>Xuất CSV</span>
              </button>

              {bulkSelection.length > 0 && (
                <div className='flex items-center space-x-2'>
                  <span className='text-sm text-gray-400'>{bulkSelection.length} đã chọn</span>
                  <button
                    onClick={() => setShowBulkEmailModal(true)}
                    className='px-3 py-1 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-300 hover:bg-blue-500/30 transition-all text-sm'
                  >
                    Gửi email
                  </button>
                  <button
                    onClick={() => handleBulkAction('activate')}
                    className='px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300 hover:bg-green-500/30 transition-all text-sm'
                  >
                    Kích hoạt
                  </button>
                  <button
                    onClick={() => handleBulkAction('deactivate')}
                    className='px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-300 hover:bg-yellow-500/30 transition-all text-sm'
                  >
                    Hủy đăng ký
                  </button>
                  {canDeleteNewsletter && (
                    <button
                      onClick={() => handleBulkAction('delete')}
                      className='px-3 py-1 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 hover:bg-red-500/30 transition-all text-sm'
                    >
                      Xóa
                    </button>
                  )}
                </div>
              )}

              {canCreateNewsletter && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className='px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:from-orange-600 hover:to-red-700 transition-all flex items-center space-x-2'
                >
                  <Plus className='w-4 h-4' />
                  <span className='hidden sm:inline'>Thêm người đăng ký</span>
                  <span className='sm:hidden'>+</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className='relative z-10 container mx-auto px-4 py-8'>
        {/* Enhanced Stats Cards */}
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6 mb-8'>
          <div className='bg-white/5 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-4 lg:p-6 border border-white/10 hover:bg-white/10 transition-all'>
            <div className='flex items-center justify-between'>
              <div className='w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl lg:rounded-2xl flex items-center justify-center'>
                <Mail className='w-5 h-5 lg:w-6 lg:h-6 text-white' />
              </div>
              <div className='text-right'>
                <p className='text-lg lg:text-2xl font-black text-white'>{stats?.total || 0}</p>
                <p className='text-xs lg:text-sm text-gray-400'>Tổng người đăng ký</p>
              </div>
            </div>
          </div>

          <div className='bg-white/5 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-4 lg:p-6 border border-white/10 hover:bg-white/10 transition-all'>
            <div className='flex items-center justify-between'>
              <div className='w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl lg:rounded-2xl flex items-center justify-center'>
                <UserCheck className='w-5 h-5 lg:w-6 lg:h-6 text-white' />
              </div>
              <div className='text-right'>
                <p className='text-lg lg:text-2xl font-black text-white'>{stats?.active || 0}</p>
                <p className='text-xs lg:text-sm text-gray-400'>Đang hoạt động</p>
              </div>
            </div>
          </div>

          <div className='bg-white/5 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-4 lg:p-6 border border-white/10 hover:bg-white/10 transition-all'>
            <div className='flex items-center justify-between'>
              <div className='w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl lg:rounded-2xl flex items-center justify-center'>
                <UserX className='w-5 h-5 lg:w-6 lg:h-6 text-white' />
              </div>
              <div className='text-right'>
                <p className='text-lg lg:text-2xl font-black text-white'>
                  {stats?.unsubscribed || 0}
                </p>
                <p className='text-xs lg:text-sm text-gray-400'>Đã hủy đăng ký</p>
              </div>
            </div>
          </div>

          <div className='bg-white/5 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-4 lg:p-6 border border-white/10 hover:bg-white/10 transition-all'>
            <div className='flex items-center justify-between'>
              <div className='w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-purple-500 to-violet-500 rounded-xl lg:rounded-2xl flex items-center justify-center'>
                <TrendingUp className='w-5 h-5 lg:w-6 lg:h-6 text-white' />
              </div>
              <div className='text-right'>
                <p className='text-lg lg:text-2xl font-black text-white'>{stats?.thisMonth || 0}</p>
                <p className='text-xs lg:text-sm text-gray-400'>Tháng này</p>
              </div>
            </div>
          </div>

          <div className='bg-white/5 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-4 lg:p-6 border border-white/10 hover:bg-white/10 transition-all'>
            <div className='flex items-center justify-between'>
              <div className='w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl lg:rounded-2xl flex items-center justify-center'>
                <Eye className='w-5 h-5 lg:w-6 lg:h-6 text-white' />
              </div>
              <div className='text-right'>
                <p className='text-lg lg:text-2xl font-black text-white'>{stats?.openRate || 0}%</p>
                <p className='text-xs lg:text-sm text-gray-400'>Tỷ lệ mở email</p>
              </div>
            </div>
          </div>

          <div className='bg-white/5 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-4 lg:p-6 border border-white/10 hover:bg-white/10 transition-all'>
            <div className='flex items-center justify-between'>
              <div className='w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl lg:rounded-2xl flex items-center justify-center'>
                <TrendingUp className='w-5 h-5 lg:w-6 lg:h-6 text-white' />
              </div>
              <div className='text-right'>
                <p className='text-lg lg:text-2xl font-black text-white'>
                  {stats?.clickRate || 0}%
                </p>
                <p className='text-xs lg:text-sm text-gray-400'>Tỷ lệ click</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className='bg-white/5 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-4 lg:p-6 border border-white/10 mb-8'>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
              <input
                type='text'
                placeholder='🔍 Tìm email, tên...'
                value={search}
                onChange={e => setSearch(e.target.value)}
                className='w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent'
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className='w-full px-3 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent'
            >
              <option value=''>Tất cả trạng thái</option>
              <option value='subscribed'>✅ Đang hoạt động</option>
              <option value='unsubscribed'>❌ Đã hủy đăng ký</option>
            </select>

            <select
              value={sourceFilter}
              onChange={e => setSourceFilter(e.target.value)}
              className='w-full px-3 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent'
            >
              <option value=''>Tất cả nguồn</option>
              <option value='landing'>🏠 Trang chủ</option>
              <option value='blog'>📝 Blog</option>
              <option value='contact'>📞 Form liên hệ</option>
              <option value='admin'>⚙️ Admin</option>
            </select>

            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setSourceFilter('');
                setCurrentPage(1);
              }}
              className='px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-600/50 transition-all'
            >
              🗑️ Xóa bộ lọc
            </button>
          </div>
        </div>

        {/* Enhanced Table */}
        <div className='bg-white/5 backdrop-blur-sm rounded-2xl lg:rounded-3xl border border-white/10 overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='min-w-full'>
              <thead className='bg-gray-800/50'>
                <tr>
                  <th className='px-6 py-4 text-left'>
                    <input
                      type='checkbox'
                      checked={
                        bulkSelection.length === newsletters.length && newsletters.length > 0
                      }
                      onChange={e => {
                        if (e.target.checked) {
                          setBulkSelection(newsletters.map(n => n.id));
                        } else {
                          setBulkSelection([]);
                        }
                      }}
                      className='rounded bg-gray-700 border-gray-600 text-orange-500 focus:ring-orange-500'
                    />
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
                    Người đăng ký
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
                    Công ty
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
                    Nguồn
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
                    Trạng thái
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
                    Tương tác
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
                    Ngày tạo
                  </th>
                  <th className='px-6 py-4 text-right text-xs font-medium text-gray-300 uppercase tracking-wider'>
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-700/50'>
                {loading ? (
                  <tr>
                    <td colSpan={8} className='px-6 py-12 text-center text-gray-400'>
                      <div className='flex items-center justify-center space-x-2'>
                        <div className='w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin'></div>
                        <span>Đang tải...</span>
                      </div>
                    </td>
                  </tr>
                ) : newsletters.length === 0 ? (
                  <tr>
                    <td colSpan={8} className='px-6 py-12 text-center text-gray-400'>
                      <div className='flex flex-col items-center space-y-3'>
                        <Mail className='w-12 h-12 text-gray-500' />
                        <span>Không tìm thấy người đăng ký nào</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  newsletters.map(newsletter => (
                    <tr key={newsletter.id} className='hover:bg-white/5 transition-colors'>
                      <td className='px-6 py-4'>
                        <input
                          type='checkbox'
                          checked={bulkSelection.includes(newsletter.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setBulkSelection([...bulkSelection, newsletter.id]);
                            } else {
                              setBulkSelection(bulkSelection.filter(id => id !== newsletter.id));
                            }
                          }}
                          className='rounded bg-gray-700 border-gray-600 text-orange-500 focus:ring-orange-500'
                        />
                      </td>
                      <td className='px-6 py-4'>
                        <div className='space-y-1'>
                          <div className='text-sm font-medium text-white'>
                            {newsletter.name || 'Chưa có tên'}
                          </div>
                          <div className='text-sm text-gray-400'>{newsletter.email}</div>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='flex items-center'>
                          <Building className='w-4 h-4 text-gray-400 mr-2' />
                          <span className='text-sm text-gray-300'>
                            {newsletter.company || 'Chưa có'}
                          </span>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <span className='inline-flex px-3 py-1 text-xs font-semibold rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30'>
                          {newsletter.source === 'landing' && '🏠'}
                          {newsletter.source === 'blog' && '📝'}
                          {newsletter.source === 'contact' && '📞'}
                          {newsletter.source === 'admin' && '⚙️'}
                          {newsletter.source}
                        </span>
                      </td>
                      <td className='px-6 py-4'>
                        <span
                          className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-lg border ${
                            newsletter.isActive
                              ? 'bg-green-500/20 text-green-300 border-green-500/30'
                              : 'bg-red-500/20 text-red-300 border-red-500/30'
                          }`}
                        >
                          {newsletter.isActive ? '✅ Đang hoạt động' : '❌ Đã hủy đăng ký'}
                        </span>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='text-xs space-y-1'>
                          <div className='flex items-center text-gray-300'>
                            <Eye className='w-3 h-3 mr-1' />
                            {newsletter.openCount} lần mở
                          </div>
                          <div className='flex items-center text-gray-300'>
                            <TrendingUp className='w-3 h-3 mr-1' />
                            {newsletter.clickCount} lần click
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='flex items-center text-sm text-gray-300'>
                          <Calendar className='w-4 h-4 text-gray-400 mr-2' />
                          {new Date(newsletter.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='flex items-center justify-end space-x-2'>
                          {canEditNewsletter && (
                            <button
                              onClick={() =>
                                handleStatusChange(newsletter.id, !newsletter.isActive)
                              }
                              className={`p-2 rounded-lg transition-all ${
                                newsletter.isActive
                                  ? 'text-red-400 hover:bg-red-500/20'
                                  : 'text-green-400 hover:bg-green-500/20'
                              }`}
                              title={newsletter.isActive ? 'Hủy đăng ký' : 'Kích hoạt lại'}
                            >
                              {newsletter.isActive ? (
                                <UserX className='w-4 h-4' />
                              ) : (
                                <UserCheck className='w-4 h-4' />
                              )}
                            </button>
                          )}
                          {canDeleteNewsletter && (
                            <button
                              onClick={() => handleDelete(newsletter.id)}
                              className='p-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-all'
                              title='Xóa'
                            >
                              <Trash2 className='w-4 h-4' />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Enhanced Pagination */}
          {totalPages > 1 && (
            <div className='bg-gray-800/30 px-6 py-4 flex items-center justify-between border-t border-gray-700/50'>
              <div className='flex items-center space-x-2'>
                <span className='text-sm text-gray-400'>
                  Trang {currentPage} trong tổng số {totalPages}
                </span>
              </div>
              <div className='flex items-center space-x-2'>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className='px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all'
                >
                  Trước
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className='px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all'
                >
                  Tiếp
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Subscriber Modal */}
      {showAddModal && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-[55]'>
          <div className='relative top-4 mx-auto p-4 w-11/12 md:w-3/4 lg:w-1/2 xl:w-2/5'>
            <div className='bg-gray-900 border border-gray-700 rounded-2xl lg:rounded-3xl shadow-2xl'>
              {/* Modal Header */}
              <div className='flex justify-between items-center p-6 border-b border-gray-700'>
                <div className='flex items-center space-x-3'>
                  <div className='w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center'>
                    <Plus className='w-5 h-5 text-white' />
                  </div>
                  <div>
                    <h3 className='text-xl font-bold text-white'>Thêm người đăng ký mới</h3>
                    <p className='text-sm text-gray-400'>
                      Thêm người đăng ký newsletter mới vào hệ thống
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewSubscriber({ email: '', name: '', company: '', source: 'admin' });
                  }}
                  className='p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all'
                >
                  <X className='w-5 h-5' />
                </button>
              </div>

              {/* Modal Content */}
              <form onSubmit={handleAddSubscriber} className='p-6 space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      📧 Email *
                    </label>
                    <input
                      type='email'
                      required
                      value={newSubscriber.email}
                      onChange={e => setNewSubscriber({ ...newSubscriber, email: e.target.value })}
                      className='w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent'
                      placeholder='Nhập địa chỉ email'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      👤 Tên người đăng ký
                    </label>
                    <input
                      type='text'
                      value={newSubscriber.name}
                      onChange={e => setNewSubscriber({ ...newSubscriber, name: e.target.value })}
                      className='w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent'
                      placeholder='Tên (tùy chọn)'
                    />
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      🏢 Công ty
                    </label>
                    <input
                      type='text'
                      value={newSubscriber.company}
                      onChange={e =>
                        setNewSubscriber({ ...newSubscriber, company: e.target.value })
                      }
                      className='w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent'
                      placeholder='Tên công ty (tùy chọn)'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      📍 Nguồn đăng ký
                    </label>
                    <select
                      value={newSubscriber.source}
                      onChange={e => setNewSubscriber({ ...newSubscriber, source: e.target.value })}
                      className='w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent'
                    >
                      <option value='admin'>⚙️ Admin</option>
                      <option value='landing'>🏠 Trang chủ</option>
                      <option value='blog'>📝 Blog</option>
                      <option value='contact'>📞 Form liên hệ</option>
                    </select>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className='flex items-center justify-between pt-6 border-t border-gray-700'>
                  <button
                    type='button'
                    onClick={() => {
                      setShowAddModal(false);
                      setNewSubscriber({ email: '', name: '', company: '', source: 'admin' });
                    }}
                    className='px-6 py-2 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 transition-all'
                  >
                    Hủy
                  </button>
                  <button
                    type='submit'
                    className='px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:from-orange-600 hover:to-red-700 transition-all flex items-center space-x-2'
                  >
                    <Plus className='w-4 h-4' />
                    <span>Thêm người đăng ký</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Email Modal */}
      {showBulkEmailModal && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-[55]'>
          <div className='relative top-4 mx-auto p-4 w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2'>
            <div className='bg-gray-900 border border-gray-700 rounded-2xl lg:rounded-3xl shadow-2xl'>
              {/* Modal Header */}
              <div className='flex justify-between items-center p-6 border-b border-gray-700'>
                <div className='flex items-center space-x-3'>
                  <div className='w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center'>
                    <Send className='w-5 h-5 text-white' />
                  </div>
                  <div>
                    <h3 className='text-xl font-bold text-white'>Gửi email hàng loạt</h3>
                    <p className='text-sm text-gray-400'>
                      Gửi email tới {bulkSelection.length} người đăng ký đã chọn
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBulkEmailModal(false)}
                  className='p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all'
                >
                  <X className='w-5 h-5' />
                </button>
              </div>

              {/* Modal Content */}
              <div className='p-6 space-y-6'>
                {/* Recipients Info */}
                <div className='bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg'>
                  <div className='flex items-start space-x-3'>
                    <Users className='w-5 h-5 text-blue-400 mt-0.5' />
                    <div>
                      <p className='text-blue-300 font-medium'>
                        📧 Người nhận: {bulkSelection.length} subscribers
                      </p>
                      <p className='text-blue-400/80 text-sm mt-1'>
                        Emails sẽ được gửi tới tất cả người đăng ký đã được chọn
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>
                    📝 Chủ đề email
                  </label>
                  <input
                    type='text'
                    className='w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    placeholder='Nhập chủ đề email...'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>
                    ✍️ Nội dung email
                  </label>
                  <textarea
                    rows={8}
                    className='w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none'
                    placeholder='Nhập nội dung email của bạn...'
                  />
                  <p className='text-xs text-gray-400 mt-2'>
                    💡 Bạn có thể sử dụng các biến: {'{name}'}, {'{email}'}, {'{company}'}
                  </p>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      ⏰ Lên lịch gửi
                    </label>
                    <select className='w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'>
                      <option value='now'>Gửi ngay</option>
                      <option value='schedule'>Lên lịch gửi</option>
                    </select>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      📊 Loại email
                    </label>
                    <select className='w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'>
                      <option value='newsletter'>📧 Newsletter</option>
                      <option value='announcement'>📢 Thông báo</option>
                      <option value='promotion'>🎁 Khuyến mãi</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className='flex items-center justify-between p-6 border-t border-gray-700'>
                <button
                  onClick={() => setShowBulkEmailModal(false)}
                  className='px-6 py-2 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 transition-all'
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    // Handle bulk email send
                    toast.success(`Đã gửi email tới ${bulkSelection.length} người đăng ký`);
                    setShowBulkEmailModal(false);
                  }}
                  className='px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all flex items-center space-x-2'
                >
                  <Send className='w-4 h-4' />
                  <span>📤 Gửi email</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
