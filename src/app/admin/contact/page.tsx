'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { hasPermission, type UserRole } from '@/lib/permissions';
import toast from 'react-hot-toast';
import {
  MessageSquare,
  User,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Eye,
  MessageCircle,
  CheckCircle,
  XCircle,
  Calendar,
  Building,
  Mail,
  Phone,
  Globe,
  ArrowRight,
  Trash2,
  Edit,
  Send,
  X,
  RefreshCw,
  Archive,
  Star,
  Tag,
  UserCheck,
} from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  email: string;
  company?: string;
  subject: string;
  message: string;
  inquiryType: string;
  phone?: string;
  website?: string;
  status: string;
  priority: string;
  assignedTo?: string;
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  response?: string;
  respondedAt?: string;
  respondedBy?: string;
  source: string;
  createdAt: string;
}

interface ContactStats {
  total: number;
  new: number;
  inProgress: number;
  responded: number;
  closed: number;
  avgResponseTime: number;
}

export default function AdminContact() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [stats, setStats] = useState<ContactStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [responseText, setResponseText] = useState('');
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [bulkSelection, setBulkSelection] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const userRole = session?.user?.role as UserRole;
  const canViewContacts = hasPermission(userRole, 'view_contacts');
  const canRespondContacts = hasPermission(userRole, 'respond_contacts');
  const canDeleteContacts = hasPermission(userRole, 'delete_contacts');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      if (!canViewContacts) {
        router.push('/admin');
      } else {
        fetchContacts();
        fetchStats();
      }
    }
  }, [status, canViewContacts, router, currentPage, search, statusFilter, priorityFilter]);

  const fetchContacts = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search,
        status: statusFilter,
        priority: priorityFilter,
      });

      const response = await fetch(`/api/admin/contact?${params}`);
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Không thể tải danh sách liên hệ');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/contact/stats');
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
    await fetchContacts();
    await fetchStats();
    toast.success('Đã làm mới dữ liệu');
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/contact/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchContacts();
        fetchStats();
        toast.success(`Đã cập nhật trạng thái thành ${newStatus.replace('_', ' ')}`);
      }
    } catch (error) {
      console.error('Error updating contact:', error);
      toast.error('Không thể cập nhật trạng thái');
    }
  };

  const handleResponse = async () => {
    if (!selectedContact || !responseText.trim()) {
      toast.error('Vui lòng nhập nội dung phản hồi');
      return;
    }

    try {
      const response = await fetch(`/api/admin/contact/${selectedContact.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response: responseText,
          status: 'RESPONDED',
        }),
      });

      if (response.ok) {
        setShowResponseModal(false);
        setResponseText('');
        setSelectedContact(null);
        fetchContacts();
        fetchStats();
        toast.success('Đã gửi phản hồi thành công');
      }
    } catch (error) {
      console.error('Error sending response:', error);
      toast.error('Không thể gửi phản hồi');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa liên hệ này?')) return;

    try {
      const response = await fetch(`/api/admin/contact/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchContacts();
        fetchStats();
        toast.success('Đã xóa liên hệ');
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Không thể xóa liên hệ');
    }
  };

  const handleBulkAction = async (action: string) => {
    if (bulkSelection.length === 0) {
      toast.error('Vui lòng chọn ít nhất một liên hệ');
      return;
    }

    if (
      action === 'delete' &&
      !confirm(`Bạn có chắc chắn muốn xóa ${bulkSelection.length} liên hệ?`)
    ) {
      return;
    }

    try {
      const promises = bulkSelection.map(id => {
        if (action === 'delete') {
          return fetch(`/api/admin/contact/${id}`, { method: 'DELETE' });
        } else {
          return fetch(`/api/admin/contact/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: action }),
          });
        }
      });

      await Promise.all(promises);
      setBulkSelection([]);
      fetchContacts();
      fetchStats();
      toast.success(
        `Đã ${action === 'delete' ? 'xóa' : 'cập nhật'} ${bulkSelection.length} liên hệ`
      );
    } catch (error) {
      console.error('Error with bulk action:', error);
      toast.error('Có lỗi xảy ra khi thực hiện hành động');
    }
  };

  const exportContacts = () => {
    const csv = contacts
      .map(
        c =>
          `"${c.name}","${c.email}","${c.company || ''}","${c.subject}","${c.inquiryType}","${c.status}","${c.priority}","${new Date(c.createdAt).toLocaleDateString('vi-VN')}"`
      )
      .join('\n');

    const blob = new Blob(
      [`Name,Email,Company,Subject,Inquiry Type,Status,Priority,Created At\n${csv}`],
      { type: 'text/csv;charset=utf-8;' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contacts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Đã xuất file CSV');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'LOW':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'IN_PROGRESS':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'RESPONDED':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'CLOSED':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return '🔴';
      case 'HIGH':
        return '🟠';
      case 'MEDIUM':
        return '🟡';
      case 'LOW':
        return '🟢';
      default:
        return '⚪';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'NEW':
        return '🆕';
      case 'IN_PROGRESS':
        return '⏳';
      case 'RESPONDED':
        return '✅';
      case 'CLOSED':
        return '🔒';
      default:
        return '📝';
    }
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
        <div className='absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900'></div>
        <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse'></div>
        <div className='absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000'></div>
        <div className='absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]'></div>
      </div>

      {/* Header */}
      <header className='relative z-10 border-b border-gray-800/50 backdrop-blur-sm'>
        <div className='container mx-auto px-4 py-6'>
          <div className='flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0'>
            <div className='flex items-center space-x-4'>
              <div className='w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center'>
                <MessageSquare className='w-6 h-6 text-white' />
              </div>
              <div>
                <h1 className='text-2xl lg:text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent'>
                  📧 Quản lý Liên hệ
                </h1>
                <p className='text-gray-400 text-sm lg:text-base'>
                  Quản lý form liên hệ và yêu cầu tư vấn từ khách hàng
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
                onClick={exportContacts}
                className='px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-xl text-green-300 hover:bg-green-500/30 transition-all flex items-center space-x-2'
              >
                <Download className='w-4 h-4' />
                <span className='hidden sm:inline'>Xuất CSV</span>
              </button>

              {bulkSelection.length > 0 && (
                <div className='flex items-center space-x-2'>
                  <span className='text-sm text-gray-400'>{bulkSelection.length} đã chọn</span>
                  <button
                    onClick={() => handleBulkAction('IN_PROGRESS')}
                    className='px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-300 hover:bg-yellow-500/30 transition-all text-sm'
                  >
                    Xử lý
                  </button>
                  <button
                    onClick={() => handleBulkAction('RESPONDED')}
                    className='px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300 hover:bg-green-500/30 transition-all text-sm'
                  >
                    Đã phản hồi
                  </button>
                  {canDeleteContacts && (
                    <button
                      onClick={() => handleBulkAction('delete')}
                      className='px-3 py-1 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 hover:bg-red-500/30 transition-all text-sm'
                    >
                      Xóa
                    </button>
                  )}
                </div>
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
              <div className='w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl lg:rounded-2xl flex items-center justify-center'>
                <MessageSquare className='w-5 h-5 lg:w-6 lg:h-6 text-white' />
              </div>
              <div className='text-right'>
                <p className='text-lg lg:text-2xl font-black text-white'>{stats?.total || 0}</p>
                <p className='text-xs lg:text-sm text-gray-400'>Tổng liên hệ</p>
              </div>
            </div>
          </div>

          <div className='bg-white/5 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-4 lg:p-6 border border-white/10 hover:bg-white/10 transition-all'>
            <div className='flex items-center justify-between'>
              <div className='w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl lg:rounded-2xl flex items-center justify-center'>
                <Clock className='w-5 h-5 lg:w-6 lg:h-6 text-white' />
              </div>
              <div className='text-right'>
                <p className='text-lg lg:text-2xl font-black text-white'>{stats?.new || 0}</p>
                <p className='text-xs lg:text-sm text-gray-400'>Mới</p>
              </div>
            </div>
          </div>

          <div className='bg-white/5 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-4 lg:p-6 border border-white/10 hover:bg-white/10 transition-all'>
            <div className='flex items-center justify-between'>
              <div className='w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl lg:rounded-2xl flex items-center justify-center'>
                <AlertTriangle className='w-5 h-5 lg:w-6 lg:h-6 text-white' />
              </div>
              <div className='text-right'>
                <p className='text-lg lg:text-2xl font-black text-white'>
                  {stats?.inProgress || 0}
                </p>
                <p className='text-xs lg:text-sm text-gray-400'>Đang xử lý</p>
              </div>
            </div>
          </div>

          <div className='bg-white/5 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-4 lg:p-6 border border-white/10 hover:bg-white/10 transition-all'>
            <div className='flex items-center justify-between'>
              <div className='w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl lg:rounded-2xl flex items-center justify-center'>
                <CheckCircle className='w-5 h-5 lg:w-6 lg:h-6 text-white' />
              </div>
              <div className='text-right'>
                <p className='text-lg lg:text-2xl font-black text-white'>{stats?.responded || 0}</p>
                <p className='text-xs lg:text-sm text-gray-400'>Đã phản hồi</p>
              </div>
            </div>
          </div>

          <div className='bg-white/5 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-4 lg:p-6 border border-white/10 hover:bg-white/10 transition-all'>
            <div className='flex items-center justify-between'>
              <div className='w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-gray-500 to-slate-500 rounded-xl lg:rounded-2xl flex items-center justify-center'>
                <XCircle className='w-5 h-5 lg:w-6 lg:h-6 text-white' />
              </div>
              <div className='text-right'>
                <p className='text-lg lg:text-2xl font-black text-white'>{stats?.closed || 0}</p>
                <p className='text-xs lg:text-sm text-gray-400'>Đã đóng</p>
              </div>
            </div>
          </div>

          <div className='bg-white/5 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-4 lg:p-6 border border-white/10 hover:bg-white/10 transition-all'>
            <div className='flex items-center justify-between'>
              <div className='w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl lg:rounded-2xl flex items-center justify-center'>
                <Clock className='w-5 h-5 lg:w-6 lg:h-6 text-white' />
              </div>
              <div className='text-right'>
                <p className='text-lg lg:text-2xl font-black text-white'>
                  {stats?.avgResponseTime || 0}h
                </p>
                <p className='text-xs lg:text-sm text-gray-400'>Thời gian phản hồi</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className='bg-white/5 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-4 lg:p-6 border border-white/10 mb-6'>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
              <input
                type='text'
                placeholder='🔍 Tìm kiếm tên, email, chủ đề...'
                value={search}
                onChange={e => setSearch(e.target.value)}
                className='w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent'
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className='w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent'
            >
              <option value=''>Tất cả trạng thái</option>
              <option value='NEW'>🆕 Mới</option>
              <option value='IN_PROGRESS'>⏳ Đang xử lý</option>
              <option value='RESPONDED'>✅ Đã phản hồi</option>
              <option value='CLOSED'>🔒 Đã đóng</option>
            </select>

            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className='w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent'
            >
              <option value=''>Tất cả mức độ ưu tiên</option>
              <option value='URGENT'>🔴 Khẩn cấp</option>
              <option value='HIGH'>🟠 Cao</option>
              <option value='MEDIUM'>🟡 Trung bình</option>
              <option value='LOW'>🟢 Thấp</option>
            </select>

            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setPriorityFilter('');
                setCurrentPage(1);
              }}
              className='px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-600/50 transition-all'
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
                      checked={bulkSelection.length === contacts.length && contacts.length > 0}
                      onChange={e => {
                        if (e.target.checked) {
                          setBulkSelection(contacts.map(c => c.id));
                        } else {
                          setBulkSelection([]);
                        }
                      }}
                      className='rounded bg-gray-700 border-gray-600 text-orange-500 focus:ring-orange-500'
                    />
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
                    Thông tin liên hệ
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
                    Chủ đề & Loại
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
                    Trạng thái
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
                    Mức độ ưu tiên
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
                    <td colSpan={7} className='px-6 py-12 text-center text-gray-400'>
                      <div className='flex items-center justify-center space-x-2'>
                        <div className='w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin'></div>
                        <span>Đang tải...</span>
                      </div>
                    </td>
                  </tr>
                ) : contacts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className='px-6 py-12 text-center text-gray-400'>
                      <div className='flex flex-col items-center space-y-3'>
                        <MessageSquare className='w-12 h-12 text-gray-500' />
                        <span>Không tìm thấy liên hệ nào</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  contacts.map(contact => (
                    <tr key={contact.id} className='hover:bg-white/5 transition-colors'>
                      <td className='px-6 py-4'>
                        <input
                          type='checkbox'
                          checked={bulkSelection.includes(contact.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setBulkSelection([...bulkSelection, contact.id]);
                            } else {
                              setBulkSelection(bulkSelection.filter(id => id !== contact.id));
                            }
                          }}
                          className='rounded bg-gray-700 border-gray-600 text-orange-500 focus:ring-orange-500'
                        />
                      </td>
                      <td className='px-6 py-4'>
                        <div className='space-y-1'>
                          <div className='text-sm font-medium text-white'>{contact.name}</div>
                          <div className='text-sm text-gray-400 flex items-center'>
                            <Mail className='w-3 h-3 mr-1' />
                            {contact.email}
                          </div>
                          {contact.company && (
                            <div className='text-sm text-gray-400 flex items-center'>
                              <Building className='w-3 h-3 mr-1' />
                              {contact.company}
                            </div>
                          )}
                          {contact.phone && (
                            <div className='text-sm text-gray-400 flex items-center'>
                              <Phone className='w-3 h-3 mr-1' />
                              {contact.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='space-y-1'>
                          <div className='text-sm font-medium text-white'>{contact.subject}</div>
                          <div className='text-sm'>
                            <span className='inline-flex px-2 py-1 text-xs font-semibold rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30'>
                              {contact.inquiryType}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <span
                          className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-lg border ${getStatusColor(contact.status)}`}
                        >
                          {getStatusIcon(contact.status)} {contact.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className='px-6 py-4'>
                        <span
                          className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-lg border ${getPriorityColor(contact.priority)}`}
                        >
                          {getPriorityIcon(contact.priority)} {contact.priority}
                        </span>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='flex items-center text-sm text-gray-300'>
                          <Calendar className='w-4 h-4 text-gray-400 mr-2' />
                          {new Date(contact.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='flex items-center justify-end space-x-2'>
                          <button
                            onClick={() => {
                              setSelectedContact(contact);
                              setShowDetailsModal(true);
                            }}
                            className='p-2 rounded-lg hover:bg-blue-500/20 text-blue-400 transition-all'
                            title='Xem chi tiết'
                          >
                            <Eye className='w-4 h-4' />
                          </button>
                          {canRespondContacts && contact.status !== 'RESPONDED' && (
                            <button
                              onClick={() => {
                                setSelectedContact(contact);
                                setShowResponseModal(true);
                              }}
                              className='p-2 rounded-lg hover:bg-green-500/20 text-green-400 transition-all'
                              title='Phản hồi'
                            >
                              <MessageCircle className='w-4 h-4' />
                            </button>
                          )}
                          {contact.status === 'NEW' && (
                            <button
                              onClick={() => handleStatusChange(contact.id, 'IN_PROGRESS')}
                              className='p-2 rounded-lg hover:bg-yellow-500/20 text-yellow-400 transition-all'
                              title='Đánh dấu đang xử lý'
                            >
                              <ArrowRight className='w-4 h-4' />
                            </button>
                          )}
                          {canDeleteContacts && (
                            <button
                              onClick={() => handleDelete(contact.id)}
                              className='p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-all'
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

      {/* Enhanced Contact Details Modal */}
      {selectedContact && showDetailsModal && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-[55]'>
          <div className='relative top-4 mx-auto p-4 w-11/12 md:w-3/4 lg:w-1/2 xl:w-2/5'>
            <div className='bg-gray-900 border border-gray-700 rounded-2xl lg:rounded-3xl shadow-2xl'>
              {/* Modal Header */}
              <div className='flex justify-between items-center p-6 border-b border-gray-700'>
                <div className='flex items-center space-x-3'>
                  <div className='w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center'>
                    <Eye className='w-5 h-5 text-white' />
                  </div>
                  <div>
                    <h3 className='text-xl font-bold text-white'>Chi tiết liên hệ</h3>
                    <p className='text-sm text-gray-400'>Thông tin chi tiết từ khách hàng</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedContact(null);
                    setShowDetailsModal(false);
                  }}
                  className='p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all'
                >
                  <X className='w-5 h-5' />
                </button>
              </div>

              {/* Modal Content */}
              <div className='p-6 space-y-6 max-h-[70vh] overflow-y-auto'>
                {/* Contact Information */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='space-y-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-300 mb-2'>
                        👤 Tên khách hàng
                      </label>
                      <p className='text-white bg-gray-800/50 p-3 rounded-lg border border-gray-700'>
                        {selectedContact.name}
                      </p>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-300 mb-2'>
                        📧 Email
                      </label>
                      <p className='text-white bg-gray-800/50 p-3 rounded-lg border border-gray-700 break-all'>
                        {selectedContact.email}
                      </p>
                    </div>
                    {selectedContact.phone && (
                      <div>
                        <label className='block text-sm font-medium text-gray-300 mb-2'>
                          📞 Số điện thoại
                        </label>
                        <p className='text-white bg-gray-800/50 p-3 rounded-lg border border-gray-700'>
                          {selectedContact.phone}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className='space-y-4'>
                    {selectedContact.company && (
                      <div>
                        <label className='block text-sm font-medium text-gray-300 mb-2'>
                          🏢 Công ty
                        </label>
                        <p className='text-white bg-gray-800/50 p-3 rounded-lg border border-gray-700'>
                          {selectedContact.company}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className='block text-sm font-medium text-gray-300 mb-2'>
                        📅 Ngày tạo
                      </label>
                      <p className='text-white bg-gray-800/50 p-3 rounded-lg border border-gray-700'>
                        {new Date(selectedContact.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-300 mb-2'>
                        🏷️ Loại yêu cầu
                      </label>
                      <span className='inline-flex px-3 py-2 text-sm font-semibold rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30'>
                        {selectedContact.inquiryType}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status and Priority */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      📊 Trạng thái
                    </label>
                    <span
                      className={`inline-flex items-center px-3 py-2 text-sm font-semibold rounded-lg border ${getStatusColor(selectedContact.status)}`}
                    >
                      {getStatusIcon(selectedContact.status)}{' '}
                      {selectedContact.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      ⚡ Mức độ ưu tiên
                    </label>
                    <span
                      className={`inline-flex items-center px-3 py-2 text-sm font-semibold rounded-lg border ${getPriorityColor(selectedContact.priority)}`}
                    >
                      {getPriorityIcon(selectedContact.priority)} {selectedContact.priority}
                    </span>
                  </div>
                </div>

                {/* Subject and Message */}
                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>📝 Chủ đề</label>
                  <p className='text-white bg-gray-800/50 p-4 rounded-lg border border-gray-700'>
                    {selectedContact.subject}
                  </p>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>
                    💬 Nội dung tin nhắn
                  </label>
                  <div className='bg-gray-800/50 p-4 rounded-lg border border-gray-700 max-h-40 overflow-y-auto'>
                    <p className='text-white whitespace-pre-wrap leading-relaxed'>
                      {selectedContact.message}
                    </p>
                  </div>
                </div>

                {/* Response Section */}
                {selectedContact.response && (
                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      💌 Phản hồi đã gửi
                    </label>
                    <div className='bg-green-500/10 border border-green-500/30 p-4 rounded-lg'>
                      <p className='text-green-300 whitespace-pre-wrap leading-relaxed'>
                        {selectedContact.response}
                      </p>
                      <p className='text-sm text-green-400/70 mt-3 pt-3 border-t border-green-500/20'>
                        📅 Đã phản hồi lúc:{' '}
                        {new Date(selectedContact.respondedAt!).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className='flex items-center justify-between p-6 border-t border-gray-700'>
                <div className='flex items-center space-x-3'>
                  {canRespondContacts && selectedContact.status !== 'RESPONDED' && (
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        setShowResponseModal(true);
                      }}
                      className='px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all flex items-center space-x-2'
                    >
                      <MessageCircle className='w-4 h-4' />
                      <span>Phản hồi ngay</span>
                    </button>
                  )}

                  {selectedContact.status === 'NEW' && (
                    <button
                      onClick={() => {
                        handleStatusChange(selectedContact.id, 'IN_PROGRESS');
                        setShowDetailsModal(false);
                      }}
                      className='px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all flex items-center space-x-2'
                    >
                      <ArrowRight className='w-4 h-4' />
                      <span>Đánh dấu đang xử lý</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => {
                    setSelectedContact(null);
                    setShowDetailsModal(false);
                  }}
                  className='px-4 py-2 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 transition-all'
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Response Modal */}
      {showResponseModal && selectedContact && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-[55]'>
          <div className='relative top-4 mx-auto p-4 w-11/12 md:w-3/4 lg:w-1/2 xl:w-2/5'>
            <div className='bg-gray-900 border border-gray-700 rounded-2xl lg:rounded-3xl shadow-2xl'>
              {/* Modal Header */}
              <div className='flex justify-between items-center p-6 border-b border-gray-700'>
                <div className='flex items-center space-x-3'>
                  <div className='w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center'>
                    <Send className='w-5 h-5 text-white' />
                  </div>
                  <div>
                    <h3 className='text-xl font-bold text-white'>Gửi phản hồi</h3>
                    <p className='text-sm text-gray-400'>Trả lời yêu cầu từ khách hàng</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowResponseModal(false);
                    setResponseText('');
                  }}
                  className='p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all'
                >
                  <X className='w-5 h-5' />
                </button>
              </div>

              {/* Modal Content */}
              <div className='p-6 space-y-6'>
                {/* Recipient Info */}
                <div className='bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg'>
                  <div className='flex items-start space-x-3'>
                    <User className='w-5 h-5 text-blue-400 mt-0.5' />
                    <div>
                      <p className='text-blue-300 font-medium'>
                        📧 Gửi tới: {selectedContact.name}
                      </p>
                      <p className='text-blue-400/80 text-sm'>{selectedContact.email}</p>
                      <p className='text-blue-400/80 text-sm mt-1'>
                        📝 Về: {selectedContact.subject}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Original Message */}
                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>
                    💬 Tin nhắn gốc
                  </label>
                  <div className='bg-gray-800/50 border border-gray-700 p-4 rounded-lg max-h-32 overflow-y-auto'>
                    <p className='text-gray-300 text-sm whitespace-pre-wrap'>
                      {selectedContact.message}
                    </p>
                  </div>
                </div>

                {/* Response Input */}
                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>
                    ✍️ Nội dung phản hồi
                  </label>
                  <textarea
                    value={responseText}
                    onChange={e => setResponseText(e.target.value)}
                    rows={8}
                    className='w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none'
                    placeholder='Nhập nội dung phản hồi cho khách hàng...'
                  />
                  <div className='flex justify-between items-center mt-2'>
                    <p className='text-xs text-gray-400'>{responseText.length} ký tự</p>
                    <p className='text-xs text-gray-400'>Tối thiểu 10 ký tự để gửi</p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className='flex items-center justify-between p-6 border-t border-gray-700'>
                <button
                  onClick={() => {
                    setShowResponseModal(false);
                    setResponseText('');
                  }}
                  className='px-6 py-2 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 transition-all'
                >
                  Hủy
                </button>
                <button
                  onClick={handleResponse}
                  disabled={!responseText.trim() || responseText.trim().length < 10}
                  className='px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2'
                >
                  <Send className='w-4 h-4' />
                  <span>📤 Gửi phản hồi</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
