'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Star,
  TrendingUp,
  Users,
  DollarSign,
  CheckCircle,
  XCircle,
  Eye,
  Copy,
  Settings,
  Crown,
  Zap,
  Shield,
  BarChart3,
} from 'lucide-react';
import { hasPermission, type UserRole } from '@/lib/permissions';
import { Dialog } from '@headlessui/react';

// Types
interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  interval: string;
  maxAgents: number;
  maxConversations: number;
  maxStorage: number;
  maxApiCalls: number;
  enableGoogleIntegration: boolean;
  enableHandoverSystem: boolean;
  enableAnalytics: boolean;
  enableCustomBranding: boolean;
  enablePrioritySupport: boolean;
  isActive: boolean;
  isPopular: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  stats?: {
    activeSubscriptions: number;
    totalRevenue: number;
  };
}

interface PlanFormData {
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: string;
  maxAgents: number;
  maxConversations: number;
  maxStorage: number;
  maxApiCalls: number;
  enableGoogleIntegration: boolean;
  enableHandoverSystem: boolean;
  enableAnalytics: boolean;
  enableCustomBranding: boolean;
  enablePrioritySupport: boolean;
  isActive: boolean;
  isPopular: boolean;
  sortOrder: number;
}

export default function PlansPage() {
  const { data: session } = useSession();
  const currentUserRole = session?.user?.role as UserRole;

  // States
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  // Form states
  const [formData, setFormData] = useState<PlanFormData>({
    name: '',
    description: '',
    price: 0,
    currency: 'USD',
    interval: 'month',
    maxAgents: 1,
    maxConversations: 1000,
    maxStorage: 1,
    maxApiCalls: 10000,
    enableGoogleIntegration: false,
    enableHandoverSystem: false,
    enableAnalytics: false,
    enableCustomBranding: false,
    enablePrioritySupport: false,
    isActive: true,
    isPopular: false,
    sortOrder: 0,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Permissions
  const canManagePlans = hasPermission(currentUserRole, 'manage_plans');
  const canCreatePlans = hasPermission(currentUserRole, 'create_plans');
  const canEditPlans = hasPermission(currentUserRole, 'edit_plans');
  const canDeletePlans = hasPermission(currentUserRole, 'delete_plans');

  useEffect(() => {
    fetchPlans();
  }, [showInactive]);

  const fetchPlans = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        includeInactive: showInactive.toString(),
      });

      const response = await fetch(`/api/admin/plans?${params}`);

      const data = await response.json();

      if (data.success) {
        setPlans(data.data);
      } else {
        console.error('❌ Plans API Error:', data.error);
        toast.error(data.error || 'Không thể tải danh sách plans');
      }
    } catch (error) {
      console.error('❌ DEBUG Plans: Fetch error:', error);
      toast.error('Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      currency: 'USD',
      interval: 'month',
      maxAgents: 1,
      maxConversations: 1000,
      maxStorage: 1,
      maxApiCalls: 10000,
      enableGoogleIntegration: false,
      enableHandoverSystem: false,
      enableAnalytics: false,
      enableCustomBranding: false,
      enablePrioritySupport: false,
      isActive: true,
      isPopular: false,
      sortOrder: 0,
    });
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Tên plan là bắt buộc';
    }

    if (formData.price < 0) {
      errors.price = 'Giá phải lớn hơn hoặc bằng 0';
    }

    if (formData.maxAgents < 1) {
      errors.maxAgents = 'Số agent tối thiểu là 1';
    }

    if (formData.maxConversations < 1) {
      errors.maxConversations = 'Số conversation tối thiểu là 1';
    }

    if (formData.maxStorage < 1) {
      errors.maxStorage = 'Dung lượng storage tối thiểu là 1GB';
    }

    if (formData.maxApiCalls < 1) {
      errors.maxApiCalls = 'Số API calls tối thiểu là 1';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreatePlan = async () => {
    if (!validateForm()) return;

    try {
      setSaveLoading(true);
      const response = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Tạo plan thành công!');
        setShowCreateModal(false);
        resetForm();
        fetchPlans();
      } else {
        toast.error(data.error || 'Không thể tạo plan');
      }
    } catch (error) {
      console.error('Create plan error:', error);
      toast.error('Lỗi khi tạo plan');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEditPlan = async () => {
    if (!selectedPlan || !validateForm()) return;

    try {
      setSaveLoading(true);
      const response = await fetch(`/api/admin/plans/${selectedPlan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Cập nhật plan thành công!');
        setShowEditModal(false);
        setSelectedPlan(null);
        resetForm();
        fetchPlans();
      } else {
        toast.error(data.error || 'Không thể cập nhật plan');
      }
    } catch (error) {
      console.error('Update plan error:', error);
      toast.error('Lỗi khi cập nhật plan');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!selectedPlan) return;

    try {
      setDeleteLoading(true);
      const response = await fetch(`/api/admin/plans/${selectedPlan.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Xóa plan thành công!');
        setShowDeleteModal(false);
        setSelectedPlan(null);
        fetchPlans();
      } else {
        toast.error(data.error || 'Không thể xóa plan');
      }
    } catch (error) {
      console.error('Delete plan error:', error);
      toast.error('Lỗi khi xóa plan');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openEditModal = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price: plan.price,
      currency: plan.currency,
      interval: plan.interval,
      maxAgents: plan.maxAgents,
      maxConversations: plan.maxConversations,
      maxStorage: plan.maxStorage,
      maxApiCalls: plan.maxApiCalls,
      enableGoogleIntegration: plan.enableGoogleIntegration,
      enableHandoverSystem: plan.enableHandoverSystem,
      enableAnalytics: plan.enableAnalytics,
      enableCustomBranding: plan.enableCustomBranding,
      enablePrioritySupport: plan.enablePrioritySupport,
      isActive: plan.isActive,
      isPopular: plan.isPopular,
      sortOrder: plan.sortOrder,
    });
    setShowEditModal(true);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency === 'USD' ? 'USD' : 'VND',
    }).format(amount);
  };

  const filteredPlans = plans.filter(
    plan =>
      plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (plan.description && plan.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!hasPermission(currentUserRole, 'view_plans')) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-center'>
          <Package className='w-16 h-16 text-red-400 mx-auto mb-4' />
          <h2 className='text-xl font-semibold text-white mb-2'>Không có quyền truy cập</h2>
          <p className='text-gray-400'>Bạn không có quyền xem trang này.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-white mb-2'>Quản lý Plans</h1>
          <p className='text-gray-400'>Cấu hình và quản lý các gói subscription</p>
        </div>
        <div className='flex items-center space-x-4'>
          {canCreatePlans && (
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className='px-4 py-2 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors flex items-center space-x-2'
            >
              <Plus className='w-4 h-4' />
              <span>Tạo Plan mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10'>
        <div className='flex items-center justify-between'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
            <input
              type='text'
              placeholder='Tìm kiếm plans...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500'
            />
          </div>
          <label className='flex items-center space-x-2'>
            <input
              type='checkbox'
              checked={showInactive}
              onChange={e => setShowInactive(e.target.checked)}
              className='rounded'
            />
            <span className='text-white text-sm'>Hiển thị plans không hoạt động</span>
          </label>
        </div>
      </div>

      {/* Plans Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className='bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10'
            >
              <div className='animate-pulse space-y-4'>
                <div className='h-6 bg-white/10 rounded w-3/4'></div>
                <div className='h-4 bg-white/10 rounded w-full'></div>
                <div className='h-8 bg-white/10 rounded w-1/2'></div>
                <div className='space-y-2'>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className='h-3 bg-white/10 rounded w-full'></div>
                  ))}
                </div>
              </div>
            </div>
          ))
        ) : filteredPlans.length > 0 ? (
          filteredPlans.map(plan => (
            <div
              key={plan.id}
              className={`relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 border transition-all duration-200 hover:bg-white/10 ${
                plan.isPopular
                  ? 'border-yellow-500/50 shadow-lg shadow-yellow-500/20'
                  : plan.isActive
                    ? 'border-white/10'
                    : 'border-red-500/30 opacity-75'
              }`}
            >
              {/* Popular badge */}
              {plan.isPopular && (
                <div className='absolute -top-3 -right-3'>
                  <div className='bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1'>
                    <Star className='w-3 h-3 fill-current' />
                    <span>PHỔ BIẾN</span>
                  </div>
                </div>
              )}

              {/* Plan header */}
              <div className='flex items-start justify-between mb-4'>
                <div>
                  <h3 className='text-xl font-bold text-white mb-1'>{plan.name}</h3>
                  {plan.description && <p className='text-gray-400 text-sm'>{plan.description}</p>}
                </div>
                <div className='flex items-center space-x-2'>
                  {plan.isActive ? (
                    <CheckCircle className='w-5 h-5 text-green-400' />
                  ) : (
                    <XCircle className='w-5 h-5 text-red-400' />
                  )}
                </div>
              </div>

              {/* Pricing */}
              <div className='mb-6'>
                <div className='flex items-baseline space-x-2'>
                  <span className='text-3xl font-bold text-white'>
                    {formatCurrency(plan.price, plan.currency)}
                  </span>
                  <span className='text-gray-400 text-sm'>/ {plan.interval}</span>
                </div>
              </div>

              {/* Features */}
              <div className='space-y-3 mb-6'>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-gray-400'>Agents</span>
                  <span className='text-white font-medium'>{plan.maxAgents.toLocaleString()}</span>
                </div>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-gray-400'>Conversations</span>
                  <span className='text-white font-medium'>
                    {plan.maxConversations.toLocaleString()}
                  </span>
                </div>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-gray-400'>Storage</span>
                  <span className='text-white font-medium'>{plan.maxStorage}GB</span>
                </div>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-gray-400'>API Calls</span>
                  <span className='text-white font-medium'>
                    {plan.maxApiCalls.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Advanced Features */}
              <div className='space-y-2 mb-6'>
                {[
                  { key: 'enableGoogleIntegration', label: 'Google Integration', icon: '🔗' },
                  { key: 'enableHandoverSystem', label: 'Handover System', icon: '👥' },
                  { key: 'enableAnalytics', label: 'Analytics', icon: '📊' },
                  { key: 'enableCustomBranding', label: 'Custom Branding', icon: '🎨' },
                  { key: 'enablePrioritySupport', label: 'Priority Support', icon: '⚡' },
                ].map(feature => (
                  <div key={feature.key} className='flex items-center space-x-2 text-sm'>
                    <span>{feature.icon}</span>
                    <span
                      className={`${plan[feature.key as keyof SubscriptionPlan] ? 'text-green-400' : 'text-gray-500'}`}
                    >
                      {feature.label}
                    </span>
                    {plan[feature.key as keyof SubscriptionPlan] ? (
                      <CheckCircle className='w-4 h-4 text-green-400' />
                    ) : (
                      <XCircle className='w-4 h-4 text-gray-500' />
                    )}
                  </div>
                ))}
              </div>

              {/* Stats */}
              {plan.stats && (
                <div className='bg-white/5 rounded-lg p-3 mb-4'>
                  <div className='grid grid-cols-2 gap-3 text-sm'>
                    <div>
                      <p className='text-gray-400'>Subscribers</p>
                      <p className='text-white font-medium'>{plan.stats.activeSubscriptions}</p>
                    </div>
                    <div>
                      <p className='text-gray-400'>Revenue</p>
                      <p className='text-white font-medium'>
                        {formatCurrency(plan.stats.totalRevenue, plan.currency)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className='flex items-center space-x-2'>
                {canEditPlans && (
                  <button
                    onClick={() => openEditModal(plan)}
                    className='flex-1 px-3 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center justify-center space-x-1'
                  >
                    <Edit className='w-4 h-4' />
                    <span>Sửa</span>
                  </button>
                )}
                {canDeletePlans && (
                  <button
                    onClick={() => {
                      setSelectedPlan(plan);
                      setShowDeleteModal(true);
                    }}
                    className='flex-1 px-3 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors flex items-center justify-center space-x-1'
                  >
                    <Trash2 className='w-4 h-4' />
                    <span>Xóa</span>
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className='col-span-full flex items-center justify-center py-12'>
            <div className='text-center'>
              <Package className='w-16 h-16 text-gray-400 mx-auto mb-4' />
              <h3 className='text-xl font-semibold text-white mb-2'>Không có plan nào</h3>
              <p className='text-gray-400 mb-4'>
                Chưa có plan nào được tạo hoặc không tìm thấy kết quả phù hợp.
              </p>
              {canCreatePlans && (
                <button
                  onClick={() => {
                    resetForm();
                    setShowCreateModal(true);
                  }}
                  className='px-4 py-2 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors'
                >
                  Tạo Plan đầu tiên
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog
        open={showCreateModal || showEditModal}
        onClose={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          setSelectedPlan(null);
          resetForm();
        }}
        className='fixed z-50 inset-0 overflow-y-auto'
      >
        <div className='flex items-center justify-center min-h-screen px-4'>
          <div className='fixed inset-0 bg-black/70' aria-hidden='true' />
          <div className='relative bg-gray-900 rounded-2xl p-8 w-full max-w-4xl mx-auto z-10 border border-white/10 max-h-[90vh] overflow-y-auto'>
            <Dialog.Title className='text-xl font-bold text-white mb-6'>
              {showCreateModal ? 'Tạo Plan mới' : 'Chỉnh sửa Plan'}
            </Dialog.Title>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* Basic Info */}
              <div className='space-y-4'>
                <h3 className='text-white font-semibold'>Thông tin cơ bản</h3>

                <div>
                  <label className='block text-gray-300 text-sm mb-1'>
                    Tên Plan <span className='text-red-400'>*</span>
                  </label>
                  <input
                    type='text'
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className='w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-blue-500'
                    placeholder='VD: Pro Plan'
                  />
                  {formErrors.name && (
                    <p className='text-red-400 text-sm mt-1'>{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className='block text-gray-300 text-sm mb-1'>Mô tả</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className='w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-blue-500'
                    placeholder='Mô tả plan...'
                    rows={3}
                  />
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-gray-300 text-sm mb-1'>
                      Giá <span className='text-red-400'>*</span>
                    </label>
                    <input
                      type='number'
                      min='0'
                      step='0.01'
                      value={formData.price}
                      onChange={e =>
                        setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                      }
                      className='w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-blue-500'
                    />
                    {formErrors.price && (
                      <p className='text-red-400 text-sm mt-1'>{formErrors.price}</p>
                    )}
                  </div>
                  <div>
                    <label className='block text-gray-300 text-sm mb-1'>Tiền tệ</label>
                    <select
                      value={formData.currency}
                      onChange={e => setFormData({ ...formData, currency: e.target.value })}
                      className='w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-blue-500'
                    >
                      <option value='USD'>USD</option>
                      <option value='VND'>VND</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className='block text-gray-300 text-sm mb-1'>Chu kỳ thanh toán</label>
                  <select
                    value={formData.interval}
                    onChange={e => setFormData({ ...formData, interval: e.target.value })}
                    className='w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-blue-500'
                  >
                    <option value='month'>Hàng tháng</option>
                    <option value='year'>Hàng năm</option>
                  </select>
                </div>
              </div>

              {/* Limits */}
              <div className='space-y-4'>
                <h3 className='text-white font-semibold'>Giới hạn sử dụng</h3>

                <div>
                  <label className='block text-gray-300 text-sm mb-1'>
                    Số Agent tối đa <span className='text-red-400'>*</span>
                  </label>
                  <input
                    type='number'
                    min='1'
                    value={formData.maxAgents}
                    onChange={e =>
                      setFormData({ ...formData, maxAgents: parseInt(e.target.value) || 1 })
                    }
                    className='w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-blue-500'
                  />
                  {formErrors.maxAgents && (
                    <p className='text-red-400 text-sm mt-1'>{formErrors.maxAgents}</p>
                  )}
                </div>

                <div>
                  <label className='block text-gray-300 text-sm mb-1'>
                    Conversations tối đa <span className='text-red-400'>*</span>
                  </label>
                  <input
                    type='number'
                    min='1'
                    value={formData.maxConversations}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        maxConversations: parseInt(e.target.value) || 1000,
                      })
                    }
                    className='w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-blue-500'
                  />
                  {formErrors.maxConversations && (
                    <p className='text-red-400 text-sm mt-1'>{formErrors.maxConversations}</p>
                  )}
                </div>

                <div>
                  <label className='block text-gray-300 text-sm mb-1'>
                    Storage tối đa (GB) <span className='text-red-400'>*</span>
                  </label>
                  <input
                    type='number'
                    min='1'
                    value={formData.maxStorage}
                    onChange={e =>
                      setFormData({ ...formData, maxStorage: parseInt(e.target.value) || 1 })
                    }
                    className='w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-blue-500'
                  />
                  {formErrors.maxStorage && (
                    <p className='text-red-400 text-sm mt-1'>{formErrors.maxStorage}</p>
                  )}
                </div>

                <div>
                  <label className='block text-gray-300 text-sm mb-1'>
                    API Calls tối đa <span className='text-red-400'>*</span>
                  </label>
                  <input
                    type='number'
                    min='1'
                    value={formData.maxApiCalls}
                    onChange={e =>
                      setFormData({ ...formData, maxApiCalls: parseInt(e.target.value) || 10000 })
                    }
                    className='w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-blue-500'
                  />
                  {formErrors.maxApiCalls && (
                    <p className='text-red-400 text-sm mt-1'>{formErrors.maxApiCalls}</p>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className='space-y-4'>
                <h3 className='text-white font-semibold'>Tính năng nâng cao</h3>

                {[
                  { key: 'enableGoogleIntegration', label: 'Google Integration', icon: '🔗' },
                  { key: 'enableHandoverSystem', label: 'Handover System', icon: '👥' },
                  { key: 'enableAnalytics', label: 'Analytics', icon: '📊' },
                  { key: 'enableCustomBranding', label: 'Custom Branding', icon: '🎨' },
                  { key: 'enablePrioritySupport', label: 'Priority Support', icon: '⚡' },
                ].map(feature => (
                  <label key={feature.key} className='flex items-center space-x-3'>
                    <input
                      type='checkbox'
                      checked={formData[feature.key as keyof PlanFormData] as boolean}
                      onChange={e => setFormData({ ...formData, [feature.key]: e.target.checked })}
                      className='rounded'
                    />
                    <span className='text-gray-300 flex items-center space-x-2'>
                      <span>{feature.icon}</span>
                      <span>{feature.label}</span>
                    </span>
                  </label>
                ))}
              </div>

              {/* Settings */}
              <div className='space-y-4'>
                <h3 className='text-white font-semibold'>Cài đặt</h3>

                <div>
                  <label className='block text-gray-300 text-sm mb-1'>Thứ tự sắp xếp</label>
                  <input
                    type='number'
                    min='0'
                    value={formData.sortOrder}
                    onChange={e =>
                      setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })
                    }
                    className='w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-blue-500'
                  />
                </div>

                <label className='flex items-center space-x-3'>
                  <input
                    type='checkbox'
                    checked={formData.isActive}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                    className='rounded'
                  />
                  <span className='text-gray-300'>Plan hoạt động</span>
                </label>

                <label className='flex items-center space-x-3'>
                  <input
                    type='checkbox'
                    checked={formData.isPopular}
                    onChange={e => setFormData({ ...formData, isPopular: e.target.checked })}
                    className='rounded'
                  />
                  <span className='text-gray-300 flex items-center space-x-2'>
                    <Star className='w-4 h-4' />
                    <span>Đánh dấu phổ biến</span>
                  </span>
                </label>
              </div>
            </div>

            <div className='flex items-center justify-end space-x-4 mt-8'>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setSelectedPlan(null);
                  resetForm();
                }}
                className='px-6 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors'
              >
                Hủy
              </button>
              <button
                onClick={showCreateModal ? handleCreatePlan : handleEditPlan}
                disabled={saveLoading}
                className='px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2'
              >
                {saveLoading && (
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                )}
                <span>
                  {saveLoading ? 'Đang lưu...' : showCreateModal ? 'Tạo Plan' : 'Cập nhật'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedPlan(null);
        }}
        className='fixed z-50 inset-0 overflow-y-auto'
      >
        <div className='flex items-center justify-center min-h-screen px-4'>
          <div className='fixed inset-0 bg-black/70' aria-hidden='true' />
          <div className='relative bg-gray-900 rounded-2xl p-8 w-full max-w-md mx-auto z-10 border border-white/10'>
            <Dialog.Title className='text-xl font-bold text-white mb-4 flex items-center space-x-2'>
              <Trash2 className='w-6 h-6 text-red-400' />
              <span>Xác nhận xóa Plan</span>
            </Dialog.Title>

            <div className='text-white mb-6'>
              Bạn có chắc chắn muốn xóa plan{' '}
              <span className='font-semibold text-red-400'>{selectedPlan?.name}</span> không?
              <br />
              <br />
              <div className='bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-300 text-sm'>
                ⚠️ Hành động này không thể hoàn tác và sẽ xóa plan vĩnh viễn. Plan chỉ có thể xóa
                khi không có subscription nào đang sử dụng.
              </div>
            </div>

            <div className='flex items-center justify-end space-x-4'>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedPlan(null);
                }}
                className='px-5 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors'
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDeletePlan}
                disabled={deleteLoading}
                className='px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2'
              >
                {deleteLoading && (
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                )}
                <span>{deleteLoading ? 'Đang xóa...' : 'Xóa Plan'}</span>
              </button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
