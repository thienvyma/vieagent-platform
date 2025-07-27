'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import {
  Banknote,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  AlertTriangle,
  FileText,
  User,
  Building,
  Hash,
  CreditCard,
  RefreshCw,
  Check,
  X,
} from 'lucide-react';
import { hasPermission, type UserRole } from '@/lib/permissions';
import { Dialog } from '@headlessui/react';

interface BankTransfer {
  id: string;
  amount: number;
  currency: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  transferDate: string;
  transferReference?: string;
  notes?: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rejectionReason?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    plan: string;
  };
  plan: {
    id: string;
    name: string;
    price: number;
    currency: string;
    interval: string;
  };
}

export default function PaymentsPage() {
  const { data: session } = useSession();
  const currentUserRole = session?.user?.role as UserRole;

  const [transfers, setTransfers] = useState<BankTransfer[]>([]);
  const [stats, setStats] = useState({
    PENDING: 0,
    VERIFIED: 0,
    REJECTED: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<BankTransfer | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [verificationNote, setVerificationNote] = useState('');

  // Action loading states
  const [actionLoading, setActionLoading] = useState(false);

  // Permissions
  const canManagePayments = hasPermission(currentUserRole, 'manage_payments');
  const canVerifyPayments = hasPermission(currentUserRole, 'verify_payments');

  useEffect(() => {
    if (canManagePayments) {
      fetchTransfers();
    }
  }, [page, statusFilter, searchTerm, canManagePayments]);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        status: statusFilter,
        search: searchTerm,
      });

      const response = await fetch(`/api/admin/bank-transfers?${params}`);
      const result = await response.json();

      if (result.success) {
        setTransfers(result.data);
        setStats(result.stats);
        setTotalPages(result.pagination.pages);
      }
    } catch (error) {
      toast.error('Không thể tải danh sách chuyển khoản');
    } finally {
      setLoading(false);
    }
  };

  const handleManualVerify = async () => {
    if (!selectedTransfer) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/bank-transfers/${selectedTransfer.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationNote: verificationNote.trim() || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('✅ Xác minh chuyển khoản thành công!');
        fetchTransfers();
        setShowVerifyModal(false);
        setShowDetailModal(false);
        setVerificationNote('');
      } else {
        toast.error(result.error || 'Không thể xác minh chuyển khoản');
      }
    } catch (error) {
      toast.error('Lỗi khi xác minh chuyển khoản');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectTransfer = async () => {
    if (!selectedTransfer || !rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/bank-transfers/${selectedTransfer.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('❌ Từ chối chuyển khoản thành công!');
        fetchTransfers();
        setShowRejectModal(false);
        setShowDetailModal(false);
        setRejectReason('');
      } else {
        toast.error(result.error || 'Không thể từ chối chuyển khoản');
      }
    } catch (error) {
      toast.error('Lỗi khi từ chối chuyển khoản');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'border-yellow-500 bg-yellow-500/20 text-yellow-300';
      case 'VERIFIED':
        return 'border-green-500 bg-green-500/20 text-green-300';
      case 'REJECTED':
        return 'border-red-500 bg-red-500/20 text-red-300';
      default:
        return 'border-gray-500 bg-gray-500/20 text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Chờ xử lý';
      case 'VERIFIED':
        return 'Đã xác minh';
      case 'REJECTED':
        return 'Đã từ chối';
      default:
        return status;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!canManagePayments) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center'>
        <div className='text-center'>
          <AlertTriangle className='w-16 h-16 text-red-400 mx-auto mb-4' />
          <h1 className='text-2xl font-bold text-white mb-2'>🚫 Không có quyền truy cập</h1>
          <p className='text-gray-400'>Bạn không có quyền quản lý thanh toán.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900'>
      <div className='container mx-auto px-4 py-8'>
        {/* Header */}
        <div className='text-center mb-8'>
          <h1 className='text-4xl font-bold text-white mb-4 flex items-center justify-center space-x-3'>
            <Banknote className='w-10 h-10' />
            <span>🏦 Quản lý thanh toán</span>
          </h1>
          <p className='text-xl text-gray-300'>
            Quản lý chuyển khoản ngân hàng và xác minh thanh toán thủ công
          </p>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
          <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-gray-400 text-sm'>🕐 Chờ xử lý</p>
                <p className='text-2xl font-bold text-yellow-400'>{stats.PENDING}</p>
              </div>
              <Clock className='w-8 h-8 text-yellow-400' />
            </div>
          </div>

          <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-gray-400 text-sm'>✅ Đã xác minh</p>
                <p className='text-2xl font-bold text-green-400'>{stats.VERIFIED}</p>
              </div>
              <CheckCircle className='w-8 h-8 text-green-400' />
            </div>
          </div>

          <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-gray-400 text-sm'>❌ Đã từ chối</p>
                <p className='text-2xl font-bold text-red-400'>{stats.REJECTED}</p>
              </div>
              <XCircle className='w-8 h-8 text-red-400' />
            </div>
          </div>

          <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-gray-400 text-sm'>📊 Tổng cộng</p>
                <p className='text-2xl font-bold text-purple-400'>
                  {stats.PENDING + stats.VERIFIED + stats.REJECTED}
                </p>
              </div>
              <TrendingUp className='w-8 h-8 text-purple-400' />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-6 mb-8 border border-white/10'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {/* Search */}
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
              <input
                type='text'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder='Tìm kiếm chuyển khoản...'
                className='w-full bg-gray-800/50 border border-gray-600 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent'
              />
            </div>

            {/* Status Filter */}
            <div className='relative'>
              <Filter className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className='w-full bg-gray-800/50 border border-gray-600 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none'
              >
                <option value='all'>Tất cả trạng thái</option>
                <option value='PENDING'>Chờ xử lý</option>
                <option value='VERIFIED'>Đã xác minh</option>
                <option value='REJECTED'>Đã từ chối</option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchTransfers}
              disabled={loading}
              className='bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2'
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Đang tải...' : 'Làm mới'}</span>
            </button>
          </div>
        </div>

        {/* Transfers Table */}
        <div className='bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-white/5 border-b border-white/10'>
                <tr>
                  <th className='text-left py-4 px-6 text-gray-300 font-semibold'>👤 Khách hàng</th>
                  <th className='text-left py-4 px-6 text-gray-300 font-semibold'>
                    📦 Gói dịch vụ
                  </th>
                  <th className='text-left py-4 px-6 text-gray-300 font-semibold'>💰 Số tiền</th>
                  <th className='text-left py-4 px-6 text-gray-300 font-semibold'>🏦 Ngân hàng</th>
                  <th className='text-left py-4 px-6 text-gray-300 font-semibold'>📊 Trạng thái</th>
                  <th className='text-left py-4 px-6 text-gray-300 font-semibold'>📅 Ngày tạo</th>
                  <th className='text-left py-4 px-6 text-gray-300 font-semibold'>⚙️ Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className='text-center py-12'>
                      <div className='flex items-center justify-center space-x-2'>
                        <div className='w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin'></div>
                        <span className='text-gray-400'>Đang tải chuyển khoản...</span>
                      </div>
                    </td>
                  </tr>
                ) : transfers.length > 0 ? (
                  transfers.map(transfer => (
                    <tr
                      key={transfer.id}
                      className='border-b border-white/5 hover:bg-white/5 transition-colors'
                    >
                      <td className='py-4 px-6'>
                        <div>
                          <div className='text-white font-medium'>{transfer.user.name}</div>
                          <div className='text-gray-400 text-sm'>{transfer.user.email}</div>
                        </div>
                      </td>
                      <td className='py-4 px-6'>
                        <div className='text-white font-medium'>{transfer.plan.name}</div>
                        <div className='text-gray-400 text-sm'>
                          {transfer.plan.interval === 'month' ? 'Hàng tháng' : 'Hàng năm'}
                        </div>
                      </td>
                      <td className='py-4 px-6'>
                        <div className='text-white font-medium'>
                          {formatCurrency(transfer.amount, transfer.currency)}
                        </div>
                      </td>
                      <td className='py-4 px-6'>
                        <div className='text-white font-medium'>{transfer.bankName}</div>
                        <div className='text-gray-400 text-sm'>{transfer.accountHolder}</div>
                      </td>
                      <td className='py-4 px-6'>
                        <span
                          className={`px-3 py-1 rounded-full text-xs border ${getStatusColor(transfer.status)}`}
                        >
                          {getStatusText(transfer.status)}
                        </span>
                      </td>
                      <td className='py-4 px-6 text-gray-300 text-sm'>
                        {formatDate(transfer.createdAt)}
                      </td>
                      <td className='py-4 px-6'>
                        <div className='flex items-center space-x-2'>
                          <button
                            onClick={() => {
                              setSelectedTransfer(transfer);
                              setShowDetailModal(true);
                            }}
                            className='text-blue-400 hover:text-blue-300 transition-colors p-2 rounded-lg hover:bg-blue-500/20'
                            title='Xem chi tiết'
                          >
                            <Eye className='w-4 h-4' />
                          </button>

                          {/* Quick Verify Button - chỉ hiển thị cho PENDING */}
                          {canVerifyPayments && transfer.status === 'PENDING' && (
                            <button
                              onClick={() => {
                                setSelectedTransfer(transfer);
                                setShowVerifyModal(true);
                              }}
                              className='text-green-400 hover:text-green-300 transition-colors p-2 rounded-lg hover:bg-green-500/20'
                              title='Xác minh thanh toán'
                            >
                              <Check className='w-4 h-4' />
                            </button>
                          )}

                          {/* Quick Reject Button - chỉ hiển thị cho PENDING */}
                          {canVerifyPayments && transfer.status === 'PENDING' && (
                            <button
                              onClick={() => {
                                setSelectedTransfer(transfer);
                                setShowRejectModal(true);
                              }}
                              className='text-red-400 hover:text-red-300 transition-colors p-2 rounded-lg hover:bg-red-500/20'
                              title='Từ chối thanh toán'
                            >
                              <X className='w-4 h-4' />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className='text-center py-12'>
                      <div className='text-gray-400'>
                        <Banknote className='w-12 h-12 mx-auto mb-4 opacity-50' />
                        <p>Không có chuyển khoản nào</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className='bg-white/5 border-t border-white/10 px-6 py-4'>
              <div className='flex items-center justify-between'>
                <div className='text-gray-400 text-sm'>
                  Trang {page} / {totalPages}
                </div>
                <div className='flex space-x-2'>
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className='px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    ← Trước
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className='px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    Sau →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Manual Verification Modal */}
        <Dialog
          open={showVerifyModal}
          onClose={() => {
            setShowVerifyModal(false);
            setVerificationNote('');
          }}
          className='relative z-50'
        >
          <div className='fixed inset-0 bg-black/50 backdrop-blur-sm' />
          <div className='fixed inset-0 overflow-y-auto'>
            <div className='flex min-h-full items-center justify-center p-4'>
              <Dialog.Panel className='bg-gray-900 rounded-3xl p-8 border border-white/10 max-w-md w-full'>
                <Dialog.Title className='text-2xl font-bold text-white mb-6 flex items-center space-x-3'>
                  <Check className='w-8 h-8 text-green-400' />
                  <span>Xác minh thanh toán thủ công</span>
                </Dialog.Title>

                {selectedTransfer && (
                  <div className='space-y-6'>
                    <div className='bg-white/5 rounded-2xl p-4'>
                      <h4 className='text-white font-semibold mb-3'>Thông tin chuyển khoản</h4>
                      <div className='space-y-2 text-sm'>
                        <div>
                          <span className='text-gray-400'>Khách hàng:</span>{' '}
                          <span className='text-white font-medium'>
                            {selectedTransfer.user.name}
                          </span>
                        </div>
                        <div>
                          <span className='text-gray-400'>Email:</span>{' '}
                          <span className='text-white'>{selectedTransfer.user.email}</span>
                        </div>
                        <div>
                          <span className='text-gray-400'>Gói:</span>{' '}
                          <span className='text-white font-medium'>
                            {selectedTransfer.plan.name}
                          </span>
                        </div>
                        <div>
                          <span className='text-gray-400'>Số tiền:</span>{' '}
                          <span className='text-green-400 font-semibold'>
                            {formatCurrency(selectedTransfer.amount, selectedTransfer.currency)}
                          </span>
                        </div>
                        <div>
                          <span className='text-gray-400'>Ngân hàng:</span>{' '}
                          <span className='text-white'>{selectedTransfer.bankName}</span>
                        </div>
                        <div>
                          <span className='text-gray-400'>Chủ TK:</span>{' '}
                          <span className='text-white'>{selectedTransfer.accountHolder}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-300 mb-2'>
                        Ghi chú xác minh (tùy chọn)
                      </label>
                      <textarea
                        value={verificationNote}
                        onChange={e => setVerificationNote(e.target.value)}
                        rows={3}
                        className='w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-500'
                        placeholder='Nhập ghi chú về việc xác minh thanh toán...'
                      />
                    </div>

                    <div className='bg-green-500/10 border border-green-500/30 rounded-xl p-4'>
                      <p className='text-green-300 text-sm'>
                        ✅ <strong>Xác nhận:</strong> Sau khi xác minh, subscription sẽ được kích
                        hoạt và user sẽ được nâng cấp lên gói đã thanh toán.
                      </p>
                    </div>

                    <div className='flex items-center justify-end space-x-4'>
                      <button
                        onClick={() => {
                          setShowVerifyModal(false);
                          setVerificationNote('');
                        }}
                        className='px-6 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors'
                      >
                        Hủy bỏ
                      </button>
                      <button
                        onClick={handleManualVerify}
                        disabled={actionLoading}
                        className='px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2'
                      >
                        <Check className='w-4 h-4' />
                        <span>{actionLoading ? 'Đang xác minh...' : 'Xác minh thanh toán'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>

        {/* Reject Modal */}
        <Dialog
          open={showRejectModal}
          onClose={() => {
            setShowRejectModal(false);
            setRejectReason('');
          }}
          className='relative z-50'
        >
          <div className='fixed inset-0 bg-black/50 backdrop-blur-sm' />
          <div className='fixed inset-0 overflow-y-auto'>
            <div className='flex min-h-full items-center justify-center p-4'>
              <Dialog.Panel className='bg-gray-900 rounded-3xl p-8 border border-white/10 max-w-md w-full'>
                <Dialog.Title className='text-2xl font-bold text-white mb-6 flex items-center space-x-3'>
                  <X className='w-8 h-8 text-red-400' />
                  <span>Từ chối thanh toán</span>
                </Dialog.Title>

                {selectedTransfer && (
                  <div className='space-y-6'>
                    <div className='bg-white/5 rounded-2xl p-4'>
                      <h4 className='text-white font-semibold mb-3'>Thông tin chuyển khoản</h4>
                      <div className='space-y-2 text-sm'>
                        <div>
                          <span className='text-gray-400'>Khách hàng:</span>{' '}
                          <span className='text-white font-medium'>
                            {selectedTransfer.user.name}
                          </span>
                        </div>
                        <div>
                          <span className='text-gray-400'>Email:</span>{' '}
                          <span className='text-white'>{selectedTransfer.user.email}</span>
                        </div>
                        <div>
                          <span className='text-gray-400'>Số tiền:</span>{' '}
                          <span className='text-red-400 font-semibold'>
                            {formatCurrency(selectedTransfer.amount, selectedTransfer.currency)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-300 mb-2'>
                        Lý do từ chối *
                      </label>
                      <textarea
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        rows={3}
                        className='w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-red-500'
                        placeholder='Nhập lý do từ chối thanh toán...'
                        required
                      />
                    </div>

                    <div className='bg-red-500/10 border border-red-500/30 rounded-xl p-4'>
                      <p className='text-red-300 text-sm'>
                        ❌ <strong>Lưu ý:</strong> Sau khi từ chối, khách hàng sẽ được thông báo và
                        có thể thực hiện thanh toán lại.
                      </p>
                    </div>

                    <div className='flex items-center justify-end space-x-4'>
                      <button
                        onClick={() => {
                          setShowRejectModal(false);
                          setRejectReason('');
                        }}
                        className='px-6 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors'
                      >
                        Hủy bỏ
                      </button>
                      <button
                        onClick={handleRejectTransfer}
                        disabled={actionLoading || !rejectReason.trim()}
                        className='px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2'
                      >
                        <X className='w-4 h-4' />
                        <span>{actionLoading ? 'Đang từ chối...' : 'Từ chối thanh toán'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>

        {/* Transfer Detail Modal */}
        <Dialog
          open={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          className='relative z-50'
        >
          <div className='fixed inset-0 bg-black/50 backdrop-blur-sm' />
          <div className='fixed inset-0 overflow-y-auto'>
            <div className='flex min-h-full items-center justify-center p-4'>
              <Dialog.Panel className='bg-gray-900 rounded-3xl p-8 border border-white/10 max-w-2xl w-full'>
                {selectedTransfer && (
                  <>
                    <Dialog.Title className='text-2xl font-bold text-white mb-6 flex items-center space-x-3'>
                      <Banknote className='w-8 h-8' />
                      <span>Chi tiết chuyển khoản</span>
                    </Dialog.Title>

                    <div className='space-y-6'>
                      {/* User Info */}
                      <div className='bg-white/5 rounded-2xl p-6'>
                        <h4 className='text-lg font-semibold text-white mb-4 flex items-center space-x-2'>
                          <User className='w-5 h-5' />
                          <span>👤 Thông tin khách hàng</span>
                        </h4>
                        <div className='grid grid-cols-2 gap-4'>
                          <div>
                            <label className='text-gray-400 text-sm'>Tên</label>
                            <div className='text-white font-medium'>
                              {selectedTransfer.user.name}
                            </div>
                          </div>
                          <div>
                            <label className='text-gray-400 text-sm'>Email</label>
                            <div className='text-white font-medium'>
                              {selectedTransfer.user.email}
                            </div>
                          </div>
                          <div>
                            <label className='text-gray-400 text-sm'>Gói đăng ký</label>
                            <div className='text-white font-medium'>
                              {selectedTransfer.plan.name}
                            </div>
                          </div>
                          <div>
                            <label className='text-gray-400 text-sm'>Gói hiện tại</label>
                            <div className='text-white font-medium'>
                              {selectedTransfer.user.plan}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Transfer Info */}
                      <div className='bg-white/5 rounded-2xl p-6'>
                        <h4 className='text-lg font-semibold text-white mb-4 flex items-center space-x-2'>
                          <CreditCard className='w-5 h-5' />
                          <span>💳 Thông tin chuyển khoản</span>
                        </h4>
                        <div className='grid grid-cols-2 gap-4'>
                          <div>
                            <label className='text-gray-400 text-sm'>Số tiền</label>
                            <div className='text-white font-medium'>
                              {formatCurrency(selectedTransfer.amount, selectedTransfer.currency)}
                            </div>
                          </div>
                          <div>
                            <label className='text-gray-400 text-sm'>Ngày chuyển khoản</label>
                            <div className='text-white font-medium'>
                              {formatDate(selectedTransfer.transferDate)}
                            </div>
                          </div>
                          <div>
                            <label className='text-gray-400 text-sm'>Ngân hàng</label>
                            <div className='text-white font-medium'>
                              {selectedTransfer.bankName}
                            </div>
                          </div>
                          <div>
                            <label className='text-gray-400 text-sm'>Số tài khoản</label>
                            <div className='text-white font-medium font-mono'>
                              {selectedTransfer.accountNumber}
                            </div>
                          </div>
                          <div>
                            <label className='text-gray-400 text-sm'>Chủ tài khoản</label>
                            <div className='text-white font-medium'>
                              {selectedTransfer.accountHolder}
                            </div>
                          </div>
                          <div>
                            <label className='text-gray-400 text-sm'>Trạng thái</label>
                            <span
                              className={`px-3 py-1 rounded-full text-xs border ${getStatusColor(selectedTransfer.status)}`}
                            >
                              {getStatusText(selectedTransfer.status)}
                            </span>
                          </div>
                          {selectedTransfer.transferReference && (
                            <div className='col-span-2'>
                              <label className='text-gray-400 text-sm'>Mã tham chiếu</label>
                              <div className='text-white font-mono'>
                                {selectedTransfer.transferReference}
                              </div>
                            </div>
                          )}
                          {selectedTransfer.notes && (
                            <div className='col-span-2'>
                              <label className='text-gray-400 text-sm'>Ghi chú</label>
                              <div className='text-white'>{selectedTransfer.notes}</div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status Info */}
                      {(selectedTransfer.verifiedAt || selectedTransfer.rejectionReason) && (
                        <div className='bg-white/5 rounded-2xl p-6'>
                          <h4 className='text-lg font-semibold text-white mb-4'>
                            📋 Thông tin xử lý
                          </h4>
                          {selectedTransfer.verifiedAt && (
                            <div className='space-y-2'>
                              <div>
                                <span className='text-gray-400'>Xác minh lúc:</span>{' '}
                                <span className='text-green-400'>
                                  {formatDate(selectedTransfer.verifiedAt)}
                                </span>
                              </div>
                              {selectedTransfer.verifiedBy && (
                                <div>
                                  <span className='text-gray-400'>Xác minh bởi:</span>{' '}
                                  <span className='text-white'>{selectedTransfer.verifiedBy}</span>
                                </div>
                              )}
                            </div>
                          )}
                          {selectedTransfer.rejectionReason && (
                            <div>
                              <span className='text-gray-400'>Lý do từ chối:</span>
                              <div className='text-red-400 mt-1'>
                                {selectedTransfer.rejectionReason}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      {canVerifyPayments && selectedTransfer.status === 'PENDING' && (
                        <div className='flex items-center justify-center space-x-4 pt-4 border-t border-white/10'>
                          <button
                            onClick={() => {
                              setShowDetailModal(false);
                              setShowVerifyModal(true);
                            }}
                            className='px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors flex items-center space-x-2'
                          >
                            <Check className='w-5 h-5' />
                            <span>Xác minh thanh toán</span>
                          </button>
                          <button
                            onClick={() => {
                              setShowDetailModal(false);
                              setShowRejectModal(true);
                            }}
                            className='px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors flex items-center space-x-2'
                          >
                            <X className='w-5 h-5' />
                            <span>Từ chối thanh toán</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className='flex justify-end mt-6'>
                      <button
                        onClick={() => setShowDetailModal(false)}
                        className='px-6 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors'
                      >
                        Đóng
                      </button>
                    </div>
                  </>
                )}
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>
      </div>
    </div>
  );
}
