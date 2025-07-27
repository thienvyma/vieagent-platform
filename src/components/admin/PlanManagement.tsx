'use client';

import { useState, useEffect } from 'react';
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
  isContactPricing: boolean;
  contactInfo: string;
  servicesList: {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    icon: string;
  }[];
}

interface PlanManagementProps {
  currentUserRole: UserRole;
}

export default function PlanManagement({ currentUserRole }: PlanManagementProps) {
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
    isContactPricing: false,
    contactInfo: 'Liên hệ để được tư vấn giá',
    servicesList: [
      {
        id: '1',
        name: 'AI Chat Support',
        description: 'Hỗ trợ chat 24/7 với AI',
        enabled: true,
        icon: '🤖',
      },
      {
        id: '2',
        name: 'Multi-language Support',
        description: 'Hỗ trợ đa ngôn ngữ',
        enabled: false,
        icon: '🌍',
      },
      {
        id: '3',
        name: 'Voice Integration',
        description: 'Tích hợp giọng nói',
        enabled: false,
        icon: '🎤',
      },
      {
        id: '4',
        name: 'API Access',
        description: 'Truy cập API đầy đủ',
        enabled: false,
        icon: '🔌',
      },
      {
        id: '5',
        name: 'Custom Webhooks',
        description: 'Webhook tùy chỉnh',
        enabled: false,
        icon: '🔗',
      },
      {
        id: '6',
        name: 'Advanced Analytics',
        description: 'Phân tích nâng cao',
        enabled: false,
        icon: '📊',
      },
      {
        id: '7',
        name: 'White-label Solution',
        description: 'Giải pháp white-label',
        enabled: false,
        icon: '🏷️',
      },
      {
        id: '8',
        name: 'Priority Support',
        description: 'Hỗ trợ ưu tiên',
        enabled: false,
        icon: '⚡',
      },
    ],
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
        toast.error(data.error || 'Không thể tải danh sách plans');
      }
    } catch (error) {
      console.error('Fetch plans error:', error);
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
      isContactPricing: false,
      contactInfo: 'Liên hệ để được tư vấn giá',
      servicesList: [
        {
          id: '1',
          name: 'AI Chat Support',
          description: 'Hỗ trợ chat 24/7 với AI',
          enabled: true,
          icon: '🤖',
        },
        {
          id: '2',
          name: 'Multi-language Support',
          description: 'Hỗ trợ đa ngôn ngữ',
          enabled: false,
          icon: '🌍',
        },
        {
          id: '3',
          name: 'Voice Integration',
          description: 'Tích hợp giọng nói',
          enabled: false,
          icon: '🎤',
        },
        {
          id: '4',
          name: 'API Access',
          description: 'Truy cập API đầy đủ',
          enabled: false,
          icon: '🔌',
        },
        {
          id: '5',
          name: 'Custom Webhooks',
          description: 'Webhook tùy chỉnh',
          enabled: false,
          icon: '🔗',
        },
        {
          id: '6',
          name: 'Advanced Analytics',
          description: 'Phân tích nâng cao',
          enabled: false,
          icon: '📊',
        },
        {
          id: '7',
          name: 'White-label Solution',
          description: 'Giải pháp white-label',
          enabled: false,
          icon: '🏷️',
        },
        {
          id: '8',
          name: 'Priority Support',
          description: 'Hỗ trợ ưu tiên',
          enabled: false,
          icon: '⚡',
        },
      ],
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
    if (formData.maxAgents < 1 && formData.maxAgents !== -1) {
      errors.maxAgents = 'Số agent tối thiểu là 1 (hoặc -1 cho unlimited)';
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
      isContactPricing: plan.price === -1,
      contactInfo: plan.price === -1 ? 'Liên hệ để được tư vấn giá' : 'Liên hệ để được tư vấn giá',
      servicesList: [
        {
          id: '1',
          name: 'AI Chat Support',
          description: 'Hỗ trợ chat 24/7 với AI',
          enabled: true,
          icon: '🤖',
        },
        {
          id: '2',
          name: 'Multi-language Support',
          description: 'Hỗ trợ đa ngôn ngữ',
          enabled: plan.enableAnalytics,
          icon: '🌍',
        },
        {
          id: '3',
          name: 'Voice Integration',
          description: 'Tích hợp giọng nói',
          enabled: plan.enableCustomBranding,
          icon: '🎤',
        },
        {
          id: '4',
          name: 'API Access',
          description: 'Truy cập API đầy đủ',
          enabled: plan.maxApiCalls > 10000,
          icon: '🔌',
        },
        {
          id: '5',
          name: 'Custom Webhooks',
          description: 'Webhook tùy chỉnh',
          enabled: plan.enableHandoverSystem,
          icon: '🔗',
        },
        {
          id: '6',
          name: 'Advanced Analytics',
          description: 'Phân tích nâng cao',
          enabled: plan.enableAnalytics,
          icon: '📊',
        },
        {
          id: '7',
          name: 'White-label Solution',
          description: 'Giải pháp white-label',
          enabled: plan.enableCustomBranding,
          icon: '🏷️',
        },
        {
          id: '8',
          name: 'Priority Support',
          description: 'Hỗ trợ ưu tiên',
          enabled: plan.enablePrioritySupport,
          icon: '⚡',
        },
      ],
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
          <p className='text-gray-400'>Bạn không có quyền quản lý plans.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold text-white mb-2'>Quản lý Subscription Plans</h2>
          <p className='text-gray-400'>Tùy chỉnh và cấu hình các gói dịch vụ</p>
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
      <div className='bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10'>
        <div className='flex items-center justify-between'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
            <input
              type='text'
              placeholder='Tìm kiếm plans...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500'
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
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className='bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10'
            >
              <div className='animate-pulse space-y-3'>
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
              className={`relative bg-white/5 backdrop-blur-sm rounded-xl p-4 border transition-all duration-200 hover:bg-white/10 ${
                plan.isPopular
                  ? 'border-yellow-500/50 shadow-lg shadow-yellow-500/20'
                  : plan.isActive
                    ? 'border-white/10'
                    : 'border-red-500/30 opacity-75'
              }`}
            >
              {/* Popular badge */}
              {plan.isPopular && (
                <div className='absolute -top-2 -right-2'>
                  <div className='bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1'>
                    <Star className='w-3 h-3 fill-current' />
                    <span>PHỔ BIẾN</span>
                  </div>
                </div>
              )}

              {/* Plan header */}
              <div className='flex items-start justify-between mb-3'>
                <div>
                  <h3 className='text-lg font-bold text-white mb-1'>{plan.name}</h3>
                  {plan.description && <p className='text-gray-400 text-sm'>{plan.description}</p>}
                </div>
                <div className='flex items-center space-x-2'>
                  {plan.isActive ? (
                    <CheckCircle className='w-4 h-4 text-green-400' />
                  ) : (
                    <XCircle className='w-4 h-4 text-red-400' />
                  )}
                </div>
              </div>

              {/* Pricing */}
              <div className='mb-4'>
                {plan.price === -1 ? (
                  <div className='bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-3 border border-blue-500/30'>
                    <div className='text-sm text-blue-300 mb-1'>Giá tùy chỉnh</div>
                    <button className='w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-sm transition-colors'>
                      Liên hệ tư vấn
                    </button>
                  </div>
                ) : (
                  <div className='flex items-baseline space-x-2'>
                    <span className='text-2xl font-bold text-white'>
                      {formatCurrency(plan.price, plan.currency)}
                    </span>
                    <span className='text-gray-400 text-sm'>/ {plan.interval}</span>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className='grid grid-cols-2 gap-2 mb-4 text-xs'>
                <div className='bg-white/5 rounded p-2'>
                  <div className='text-gray-400'>Agents</div>
                  <div className='text-white font-medium'>
                    {plan.maxAgents === -1 ? '∞' : plan.maxAgents}
                  </div>
                </div>
                <div className='bg-white/5 rounded p-2'>
                  <div className='text-gray-400'>Messages</div>
                  <div className='text-white font-medium'>
                    {plan.maxConversations === -1 ? '∞' : plan.maxConversations.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className='space-y-1 mb-4 text-xs'>
                {[
                  { key: 'enableGoogleIntegration', label: 'Google Integration' },
                  { key: 'enableHandoverSystem', label: 'Handover System' },
                  { key: 'enableAnalytics', label: 'Analytics' },
                  { key: 'enableCustomBranding', label: 'Custom Branding' },
                ].map(feature => (
                  <div key={feature.key} className='flex items-center space-x-2'>
                    {plan[feature.key as keyof SubscriptionPlan] ? (
                      <CheckCircle className='w-3 h-3 text-green-400' />
                    ) : (
                      <XCircle className='w-3 h-3 text-gray-500' />
                    )}
                    <span
                      className={`${plan[feature.key as keyof SubscriptionPlan] ? 'text-green-400' : 'text-gray-500'}`}
                    >
                      {feature.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Stats */}
              {plan.stats && (
                <div className='bg-white/5 rounded p-2 mb-4 text-xs'>
                  <div className='grid grid-cols-2 gap-2'>
                    <div>
                      <div className='text-gray-400'>Subscribers</div>
                      <div className='text-white font-medium'>{plan.stats.activeSubscriptions}</div>
                    </div>
                    <div>
                      <div className='text-gray-400'>Revenue</div>
                      <div className='text-white font-medium'>
                        {formatCurrency(plan.stats.totalRevenue, plan.currency)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className='flex items-center space-x-2'>
                {canEditPlans && (
                  <button
                    onClick={() => openEditModal(plan)}
                    className='flex-1 px-2 py-1 bg-blue-500/20 text-blue-300 rounded hover:bg-blue-500/30 transition-colors flex items-center justify-center space-x-1 text-sm'
                  >
                    <Edit className='w-3 h-3' />
                    <span>Sửa</span>
                  </button>
                )}
                {canDeletePlans && (
                  <button
                    onClick={() => {
                      setSelectedPlan(plan);
                      setShowDeleteModal(true);
                    }}
                    className='px-2 py-1 bg-red-500/20 text-red-300 rounded hover:bg-red-500/30 transition-colors'
                  >
                    <Trash2 className='w-3 h-3' />
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className='col-span-full text-center py-12'>
            <Package className='w-12 h-12 mx-auto mb-4 text-gray-400 opacity-50' />
            <p className='text-gray-400'>Không có plans nào</p>
          </div>
        )}
      </div>

      {/* Create Plan Modal */}
      <Dialog
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        className='fixed z-50 inset-0 overflow-y-auto'
      >
        <div className='flex items-center justify-center min-h-screen px-4'>
          <div className='fixed inset-0 bg-black/70' aria-hidden='true' />
          <div className='relative bg-gray-900 rounded-2xl p-6 w-full max-w-2xl mx-auto z-10 border border-white/10'>
            <Dialog.Title className='text-xl font-bold text-white mb-4'>Tạo Plan mới</Dialog.Title>

            <div className='space-y-4 max-h-96 overflow-y-auto'>
              {/* Basic Info */}
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-gray-300 text-sm font-medium mb-2'>Tên Plan *</label>
                  <input
                    type='text'
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
                    placeholder='Trial, Basic, Pro...'
                  />
                  {formErrors.name && (
                    <p className='text-red-400 text-xs mt-1'>{formErrors.name}</p>
                  )}
                </div>
                <div>
                  <label className='block text-gray-300 text-sm font-medium mb-2'>Giá</label>
                  <input
                    type='number'
                    value={formData.price}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))
                    }
                    className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
                  />
                </div>
              </div>

              <div>
                <label className='block text-gray-300 text-sm font-medium mb-2'>Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
                  rows={2}
                />
              </div>

              {/* Limits */}
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-gray-300 text-sm font-medium mb-2'>Max Agents</label>
                  <input
                    type='number'
                    value={formData.maxAgents}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, maxAgents: parseInt(e.target.value) || 1 }))
                    }
                    className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
                  />
                  <p className='text-xs text-gray-400 mt-1'>Nhập -1 cho unlimited</p>
                </div>
                <div>
                  <label className='block text-gray-300 text-sm font-medium mb-2'>
                    Max Conversations
                  </label>
                  <input
                    type='number'
                    value={formData.maxConversations}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        maxConversations: parseInt(e.target.value) || 1000,
                      }))
                    }
                    className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
                  />
                </div>
              </div>

              {/* Features */}
              <div className='space-y-3'>
                <h4 className='text-white font-medium'>Tính năng</h4>
                <div className='grid grid-cols-2 gap-3'>
                  {[
                    { key: 'enableGoogleIntegration', label: 'Google Integration' },
                    { key: 'enableHandoverSystem', label: 'Handover System' },
                    { key: 'enableAnalytics', label: 'Analytics' },
                    { key: 'enableCustomBranding', label: 'Custom Branding' },
                    { key: 'enablePrioritySupport', label: 'Priority Support' },
                    { key: 'isPopular', label: 'Đánh dấu phổ biến' },
                  ].map(feature => (
                    <label key={feature.key} className='flex items-center space-x-2'>
                      <input
                        type='checkbox'
                        checked={formData[feature.key as keyof PlanFormData] as boolean}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            [feature.key]: e.target.checked,
                          }))
                        }
                        className='rounded'
                      />
                      <span className='text-gray-300 text-sm'>{feature.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className='flex items-center justify-end space-x-4 mt-6 pt-4 border-t border-gray-800'>
              <button
                onClick={() => setShowCreateModal(false)}
                className='px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700'
              >
                Hủy
              </button>
              <button
                onClick={handleCreatePlan}
                disabled={saveLoading}
                className='px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded disabled:opacity-50'
              >
                {saveLoading ? 'Đang tạo...' : 'Tạo Plan'}
              </button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Edit Plan Modal */}
      <Dialog
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        className='fixed z-50 inset-0 overflow-y-auto'
      >
        <div className='flex items-center justify-center min-h-screen px-4'>
          <div className='fixed inset-0 bg-black/70' aria-hidden='true' />
          <div className='relative bg-gray-900 rounded-2xl p-6 w-full max-w-4xl mx-auto z-10 border border-white/10'>
            <Dialog.Title className='text-xl font-bold text-white mb-4'>
              Chỉnh sửa Plan: {selectedPlan?.name}
            </Dialog.Title>

            <div className='space-y-6 max-h-[600px] overflow-y-auto'>
              {/* Basic Info */}
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-gray-300 text-sm font-medium mb-2'>Tên Plan *</label>
                  <input
                    type='text'
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
                  />
                  {formErrors.name && (
                    <p className='text-red-400 text-xs mt-1'>{formErrors.name}</p>
                  )}
                </div>
                <div>
                  <label className='block text-gray-300 text-sm font-medium mb-2'>Loại giá</label>
                  <select
                    value={formData.isContactPricing ? 'contact' : 'fixed'}
                    onChange={e => {
                      const isContact = e.target.value === 'contact';
                      setFormData(prev => ({
                        ...prev,
                        isContactPricing: isContact,
                        price: isContact ? -1 : 0,
                      }));
                    }}
                    className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
                  >
                    <option value='fixed'>Giá cố định</option>
                    <option value='contact'>Liên hệ tư vấn</option>
                  </select>
                </div>
              </div>

              {/* Pricing Section */}
              {formData.isContactPricing ? (
                <div>
                  <label className='block text-gray-300 text-sm font-medium mb-2'>
                    Thông tin liên hệ
                  </label>
                  <input
                    type='text'
                    value={formData.contactInfo}
                    onChange={e => setFormData(prev => ({ ...prev, contactInfo: e.target.value }))}
                    className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
                    placeholder='Liên hệ để được tư vấn giá...'
                  />
                </div>
              ) : (
                <div className='grid grid-cols-3 gap-4'>
                  <div>
                    <label className='block text-gray-300 text-sm font-medium mb-2'>Giá</label>
                    <input
                      type='number'
                      value={formData.price}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))
                      }
                      className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
                    />
                  </div>
                  <div>
                    <label className='block text-gray-300 text-sm font-medium mb-2'>Tiền tệ</label>
                    <select
                      value={formData.currency}
                      onChange={e => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                      className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
                    >
                      <option value='USD'>USD</option>
                      <option value='VND'>VND</option>
                    </select>
                  </div>
                  <div>
                    <label className='block text-gray-300 text-sm font-medium mb-2'>Chu kỳ</label>
                    <select
                      value={formData.interval}
                      onChange={e => setFormData(prev => ({ ...prev, interval: e.target.value }))}
                      className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
                    >
                      <option value='month'>Tháng</option>
                      <option value='year'>Năm</option>
                      <option value='week'>Tuần</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className='block text-gray-300 text-sm font-medium mb-2'>Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
                  rows={3}
                  placeholder='Mô tả chi tiết về plan...'
                />
              </div>

              {/* Limits */}
              <div>
                <h4 className='text-white font-medium mb-3'>Giới hạn sử dụng</h4>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-gray-300 text-sm font-medium mb-2'>
                      Max Agents
                    </label>
                    <input
                      type='number'
                      value={formData.maxAgents}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, maxAgents: parseInt(e.target.value) || 1 }))
                      }
                      className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
                    />
                    <p className='text-xs text-gray-400 mt-1'>Nhập -1 cho unlimited</p>
                  </div>
                  <div>
                    <label className='block text-gray-300 text-sm font-medium mb-2'>
                      Max Conversations
                    </label>
                    <input
                      type='number'
                      value={formData.maxConversations}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          maxConversations: parseInt(e.target.value) || 1000,
                        }))
                      }
                      className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
                    />
                  </div>
                  <div>
                    <label className='block text-gray-300 text-sm font-medium mb-2'>
                      Storage (GB)
                    </label>
                    <input
                      type='number'
                      value={formData.maxStorage}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          maxStorage: parseInt(e.target.value) || 1,
                        }))
                      }
                      className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
                    />
                  </div>
                  <div>
                    <label className='block text-gray-300 text-sm font-medium mb-2'>
                      API Calls
                    </label>
                    <input
                      type='number'
                      value={formData.maxApiCalls}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          maxApiCalls: parseInt(e.target.value) || 10000,
                        }))
                      }
                      className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
                    />
                  </div>
                </div>
              </div>

              {/* Core Features */}
              <div>
                <h4 className='text-white font-medium mb-3'>Tính năng cốt lõi</h4>
                <div className='grid grid-cols-2 gap-3'>
                  {[
                    { key: 'enableGoogleIntegration', label: 'Google Integration', icon: '🔗' },
                    { key: 'enableHandoverSystem', label: 'Handover System', icon: '👥' },
                    { key: 'enableAnalytics', label: 'Analytics', icon: '📊' },
                    { key: 'enableCustomBranding', label: 'Custom Branding', icon: '🎨' },
                    { key: 'enablePrioritySupport', label: 'Priority Support', icon: '⚡' },
                    { key: 'isPopular', label: 'Đánh dấu phổ biến', icon: '⭐' },
                  ].map(feature => (
                    <label
                      key={feature.key}
                      className='flex items-center space-x-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer'
                    >
                      <input
                        type='checkbox'
                        checked={formData[feature.key as keyof PlanFormData] as boolean}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            [feature.key]: e.target.checked,
                          }))
                        }
                        className='rounded text-blue-500 focus:ring-blue-500'
                      />
                      <span className='text-lg'>{feature.icon}</span>
                      <span className='text-gray-300 text-sm'>{feature.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Custom Services */}
              <div>
                <h4 className='text-white font-medium mb-3'>Dịch vụ tùy chỉnh</h4>
                <div className='grid grid-cols-1 gap-2 max-h-48 overflow-y-auto'>
                  {formData.servicesList.map((service, index) => (
                    <div
                      key={service.id}
                      className='flex items-center justify-between p-3 bg-white/5 rounded-lg'
                    >
                      <div className='flex items-center space-x-3'>
                        <span className='text-lg'>{service.icon}</span>
                        <div>
                          <div className='text-white text-sm font-medium'>{service.name}</div>
                          <div className='text-gray-400 text-xs'>{service.description}</div>
                        </div>
                      </div>
                      <div className='flex items-center space-x-3'>
                        <label className='flex items-center space-x-2'>
                          <input
                            type='checkbox'
                            checked={service.enabled}
                            onChange={e => {
                              const newServicesList = [...formData.servicesList];
                              newServicesList[index].enabled = e.target.checked;
                              setFormData(prev => ({ ...prev, servicesList: newServicesList }));
                            }}
                            className='rounded text-blue-500 focus:ring-blue-500'
                          />
                          <span className='text-sm text-gray-300'>Bật</span>
                        </label>
                        <button
                          type='button'
                          onClick={() => {
                            const newName = prompt('Tên dịch vụ:', service.name);
                            const newDesc = prompt('Mô tả:', service.description);
                            if (newName && newDesc) {
                              const newServicesList = [...formData.servicesList];
                              newServicesList[index] = {
                                ...service,
                                name: newName,
                                description: newDesc,
                              };
                              setFormData(prev => ({ ...prev, servicesList: newServicesList }));
                            }
                          }}
                          className='text-blue-400 hover:text-blue-300 text-xs'
                        >
                          Sửa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type='button'
                  onClick={() => {
                    const newService = {
                      id: Date.now().toString(),
                      name: 'Dịch vụ mới',
                      description: 'Mô tả dịch vụ',
                      enabled: false,
                      icon: '🔧',
                    };
                    setFormData(prev => ({
                      ...prev,
                      servicesList: [...prev.servicesList, newService],
                    }));
                  }}
                  className='mt-3 w-full py-2 border border-dashed border-gray-600 rounded-lg text-gray-400 hover:text-white hover:border-gray-500 transition-colors text-sm'
                >
                  + Thêm dịch vụ tùy chỉnh
                </button>
              </div>

              {/* Status Settings */}
              <div>
                <h4 className='text-white font-medium mb-3'>Cài đặt trạng thái</h4>
                <div className='grid grid-cols-2 gap-4'>
                  <label className='flex items-center space-x-3 p-3 bg-white/5 rounded-lg'>
                    <input
                      type='checkbox'
                      checked={formData.isActive}
                      onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className='rounded text-green-500 focus:ring-green-500'
                    />
                    <span className='text-gray-300'>Plan hoạt động</span>
                  </label>
                  <div>
                    <label className='block text-gray-300 text-sm font-medium mb-2'>
                      Thứ tự sắp xếp
                    </label>
                    <input
                      type='number'
                      value={formData.sortOrder}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))
                      }
                      className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
                      placeholder='0'
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className='flex items-center justify-end space-x-4 mt-6 pt-4 border-t border-gray-800'>
              <button
                onClick={() => setShowEditModal(false)}
                className='px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors'
              >
                Hủy
              </button>
              <button
                onClick={handleEditPlan}
                disabled={saveLoading}
                className='px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50 transition-colors'
              >
                {saveLoading ? 'Đang cập nhật...' : 'Cập nhật Plan'}
              </button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Delete Plan Modal */}
      <Dialog
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        className='fixed z-50 inset-0 overflow-y-auto'
      >
        <div className='flex items-center justify-center min-h-screen px-4'>
          <div className='fixed inset-0 bg-black/70' aria-hidden='true' />
          <div className='relative bg-gray-900 rounded-2xl p-6 w-full max-w-md mx-auto z-10 border border-white/10'>
            <Dialog.Title className='text-xl font-bold text-white mb-4'>
              Xác nhận xóa Plan
            </Dialog.Title>
            <div className='text-white mb-4'>
              Bạn có chắc chắn muốn xóa plan{' '}
              <span className='font-semibold text-red-400'>{selectedPlan?.name}</span>?
              <br />
              <span className='text-sm text-gray-400 mt-2 block'>
                Hành động này không thể hoàn tác và sẽ ảnh hưởng đến các subscription đang sử dụng
                plan này.
              </span>
            </div>
            <div className='flex items-center justify-end space-x-4'>
              <button
                onClick={() => setShowDeleteModal(false)}
                className='px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700'
              >
                Hủy
              </button>
              <button
                onClick={handleDeletePlan}
                disabled={deleteLoading}
                className='px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded disabled:opacity-50'
              >
                {deleteLoading ? 'Đang xóa...' : 'Xóa Plan'}
              </button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
