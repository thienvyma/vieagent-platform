'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import {
  Bot,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Eye,
  Edit,
  Trash2,
  User,
  Calendar,
  MessageSquare,
  Settings,
  RefreshCw,
  Plus,
  MoreHorizontal,
} from 'lucide-react';
import { hasPermission, getRoleDisplayName, getRoleColor, type UserRole } from '@/lib/permissions';
import { Dialog } from '@headlessui/react';

// Types
interface Agent {
  id: string;
  name: string;
  description?: string;
  status: string;
  model: string;
  temperature: number;
  maxTokens: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
    role: string;
    plan: string;
    isActive: boolean;
  };
  statistics: {
    conversationsCount: number;
    deploymentsCount: number;
  };
}

interface Filters {
  status: string;
  ownerId: string;
  plan: string;
  model: string;
  search: string;
  startDate: string;
  endDate: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface FilterOptions {
  statuses: string[];
  models: string[];
  plans: string[];
  owners: Array<{
    id: string;
    name: string;
    email: string;
  }>;
}

export default function AgentsPage() {
  const { data: session } = useSession();

  // State
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    status: '',
    ownerId: '',
    plan: '',
    model: '',
    search: '',
    startDate: '',
    endDate: '',
  });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    statuses: [],
    models: [],
    plans: [],
    owners: [],
  });
  const [showFilters, setShowFilters] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editAgentId, setEditAgentId] = useState<string | null>(null);
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewAgent, setViewAgent] = useState<Agent | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteAgent, setDeleteAgent] = useState<Agent | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Fetch agents data
  const fetchAgents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      // Add pagination params
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      // Add filter params
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });

      const response = await fetch(`/api/admin/agents?${params}`);
      const data = await response.json();

      if (data.success) {
        setAgents(data.agents);
        setPagination(data.pagination);
        setFilterOptions(data.filters);
      } else {
        console.error('Error fetching agents:', data.error);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAgents();
  }, [pagination.page, filters]);

  // Handle filter changes
  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Handle search
  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      status: '',
      ownerId: '',
      plan: '',
      model: '',
      search: '',
      startDate: '',
      endDate: '',
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Get available actions for current user
  const getAvailableActions = (agent: Agent) => {
    if (!session?.user) return [];

    const actions: string[] = ['view'];

    if (hasPermission(session.user.role as UserRole, 'edit_agents')) {
      actions.push('edit');
    }

    if (hasPermission(session.user.role as UserRole, 'delete_agents')) {
      actions.push('delete');
    }

    return actions;
  };

  // UI helpers
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'INACTIVE':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'PUBLIC':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'PRIVATE':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Hoạt động';
      case 'INACTIVE':
        return 'Không hoạt động';
      case 'PUBLIC':
        return 'Công khai';
      case 'PRIVATE':
        return 'Riêng tư';
      default:
        return status;
    }
  };

  const getModelDisplayName = (model: string) => {
    switch (model) {
      case 'gpt-3.5-turbo':
        return 'GPT-3.5 Turbo';
      case 'gpt-4':
        return 'GPT-4';
      case 'gpt-4-turbo':
        return 'GPT-4 Turbo';
      default:
        return model;
    }
  };

  const openEditModal = (agent: Agent) => {
    setEditForm({
      name: agent.name,
      description: agent.description || '',
      model: agent.model,
      temperature: agent.temperature,
      maxTokens: agent.maxTokens,
      status: agent.status,
      isPublic: agent.isPublic,
      ownerId: agent.owner.id,
    });
    setEditAgentId(agent.id);
    setEditError(null);
    setShowEditModal(true);
  };

  const handleEditChange = (field: string, value: any) => {
    setEditForm((prev: any) => ({ ...prev, [field]: value }));
    if (editError) setEditError(null);
  };

  // Fetch users cho owner
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/admin/users');
        const data = await res.json();
        if (data.users) setUsers(data.users);
      } catch {}
    };
    if (showEditModal) fetchUsers();
  }, [showEditModal]);

  // Reset form khi đóng modal
  useEffect(() => {
    if (!showEditModal) {
      setEditForm(null);
      setEditAgentId(null);
      setEditError(null);
    }
  }, [showEditModal]);

  const handleEditSave = async () => {
    if (!editForm.name?.trim()) {
      setEditError('Tên agent không được để trống');
      return;
    }
    if (editForm.temperature < 0 || editForm.temperature > 2) {
      setEditError('Temperature phải từ 0 đến 2');
      return;
    }
    if (editForm.maxTokens < 1 || editForm.maxTokens > 4096) {
      setEditError('Max Tokens phải từ 1 đến 4096');
      return;
    }
    setEditLoading(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/admin/agents/${editAgentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_agent',
          ...editForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowEditModal(false);
        toast.success('Cập nhật agent thành công!');
        fetchAgents();
      } else {
        setEditError(data.error || 'Lỗi khi cập nhật agent');
      }
    } catch (err) {
      setEditError('Lỗi khi cập nhật agent');
    } finally {
      setEditLoading(false);
    }
  };

  const openViewModal = (agent: Agent) => {
    setViewAgent(agent);
    setShowViewModal(true);
  };

  const openDeleteModal = (agent: Agent) => {
    setDeleteAgent(agent);
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  const handleDeleteAgent = async () => {
    if (!deleteAgent) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/admin/agents/${deleteAgent.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setShowDeleteModal(false);
        setDeleteAgent(null);
        toast.success('Xóa agent thành công!');
        fetchAgents();
      } else {
        if (data.error && data.error.toLowerCase().includes('not found')) {
          setShowDeleteModal(false);
          setDeleteAgent(null);
          toast.success('Agent không tồn tại hoặc đã bị xóa!');
          fetchAgents();
        } else {
          setDeleteError(data.error || 'Lỗi khi xóa agent');
        }
      }
    } catch {
      setDeleteError('Lỗi kết nối server');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className='max-w-7xl mx-auto py-8 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-white flex items-center space-x-3'>
            <Bot className='w-8 h-8 text-blue-400' />
            <span>Quản lý Agents</span>
          </h1>
          <p className='text-gray-400 mt-2'>Quản lý và giám sát tất cả agents trong hệ thống</p>
        </div>
        <div className='flex items-center space-x-3'>
          <button
            onClick={() => fetchAgents()}
            disabled={loading}
            className='px-4 py-2 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg font-medium hover:bg-blue-500/30 transition-colors flex items-center space-x-2'
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className='bg-white/5 rounded-2xl p-6 border border-white/10'>
        {/* Search Bar */}
        <div className='flex items-center space-x-4 mb-6'>
          <div className='flex-1 relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
            <input
              type='text'
              placeholder='Tìm kiếm theo tên agent, email owner...'
              value={filters.search}
              onChange={e => handleSearch(e.target.value)}
              className='w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500'
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className='px-4 py-3 bg-gray-500/20 text-gray-300 border border-gray-500/30 rounded-lg font-medium hover:bg-gray-500/30 transition-colors flex items-center space-x-2'
          >
            <Filter className='w-4 h-4' />
            <span>Bộ lọc</span>
            {showFilters ? <ChevronUp className='w-4 h-4' /> : <ChevronDown className='w-4 h-4' />}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
            {/* Status Filter */}
            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>Trạng thái</label>
              <select
                value={filters.status}
                onChange={e => handleFilterChange('status', e.target.value)}
                className='w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500'
              >
                <option value=''>Tất cả trạng thái</option>
                {filterOptions.statuses.map(status => (
                  <option key={status} value={status}>
                    {getStatusDisplayName(status)}
                  </option>
                ))}
              </select>
            </div>

            {/* Owner Filter */}
            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>Owner</label>
              <select
                value={filters.ownerId}
                onChange={e => handleFilterChange('ownerId', e.target.value)}
                className='w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500'
              >
                <option value=''>Tất cả owners</option>
                {filterOptions.owners.map(owner => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name} ({owner.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Plan Filter */}
            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>Plan</label>
              <select
                value={filters.plan}
                onChange={e => handleFilterChange('plan', e.target.value)}
                className='w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500'
              >
                <option value=''>Tất cả plans</option>
                {filterOptions.plans.map(plan => (
                  <option key={plan} value={plan}>
                    {plan}
                  </option>
                ))}
              </select>
            </div>

            {/* Model Filter */}
            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>Model</label>
              <select
                value={filters.model}
                onChange={e => handleFilterChange('model', e.target.value)}
                className='w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500'
              >
                <option value=''>Tất cả models</option>
                {filterOptions.models.map(model => (
                  <option key={model} value={model}>
                    {getModelDisplayName(model)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Clear Filters */}
        {(filters.status || filters.ownerId || filters.plan || filters.model || filters.search) && (
          <div className='flex justify-end mb-4'>
            <button
              onClick={clearFilters}
              className='px-4 py-2 text-gray-400 hover:text-white transition-colors'
            >
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Agents Table */}
      <div className='bg-white/5 rounded-2xl border border-white/10 overflow-hidden'>
        {loading ? (
          <div className='flex items-center justify-center py-12'>
            <div className='text-center'>
              <div className='w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
              <p className='text-gray-400'>Đang tải danh sách agents...</p>
            </div>
          </div>
        ) : (
          <>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='bg-gray-800/50'>
                  <tr>
                    <th className='px-6 py-4 text-left text-white font-semibold'>Agent</th>
                    <th className='px-6 py-4 text-left text-white font-semibold'>Owner</th>
                    <th className='px-6 py-4 text-left text-white font-semibold'>Trạng thái</th>
                    <th className='px-6 py-4 text-left text-white font-semibold'>Model</th>
                    <th className='px-6 py-4 text-left text-white font-semibold'>Thống kê</th>
                    <th className='px-6 py-4 text-left text-white font-semibold'>Ngày tạo</th>
                    <th className='px-6 py-4 text-left text-white font-semibold'>Thao tác</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-800/50'>
                  {agents.map(agent => {
                    const availableActions = getAvailableActions(agent);

                    return (
                      <tr key={agent.id} className='hover:bg-white/5 transition-colors'>
                        {/* Agent Info */}
                        <td
                          className='px-6 py-4 max-w-[200px] whitespace-nowrap overflow-hidden text-ellipsis'
                          title={agent.name}
                        >
                          {agent.name}
                        </td>

                        {/* Owner Info */}
                        <td
                          className='px-6 py-4 max-w-[160px] whitespace-nowrap overflow-hidden text-ellipsis'
                          title={agent.owner.name + ' - ' + agent.owner.email}
                        >
                          <div className='flex items-center gap-2'>
                            <span className='font-semibold'>{agent.owner.name}</span>
                            <span className='text-xs text-gray-400'>{agent.owner.email}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className='px-6 py-4'>
                          <span
                            className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(agent.status)}`}
                          >
                            {getStatusDisplayName(agent.status)}
                          </span>
                        </td>

                        {/* Model */}
                        <td
                          className='px-6 py-4 max-w-[120px] whitespace-nowrap overflow-hidden text-ellipsis'
                          title={agent.model}
                        >
                          {agent.model}
                        </td>

                        {/* Statistics */}
                        <td className='px-6 py-4'>
                          <div className='space-y-1'>
                            <div className='flex items-center space-x-2 text-sm'>
                              <MessageSquare className='w-4 h-4 text-blue-400' />
                              <span className='text-white'>
                                {agent.statistics.conversationsCount} hội thoại
                              </span>
                            </div>
                            <div className='flex items-center space-x-2 text-sm'>
                              <Settings className='w-4 h-4 text-green-400' />
                              <span className='text-white'>
                                {agent.statistics.deploymentsCount} deployments
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Created Date */}
                        <td className='px-6 py-4'>
                          <div className='text-gray-300 text-sm'>
                            {new Date(agent.createdAt).toLocaleDateString('vi-VN')}
                          </div>
                          <div className='text-gray-500 text-xs'>
                            {new Date(agent.createdAt).toLocaleTimeString('vi-VN')}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className='px-6 py-4'>
                          <div className='flex items-center space-x-2'>
                            {availableActions.includes('view') && (
                              <button
                                onClick={() => openViewModal(agent)}
                                className='text-blue-400 hover:text-blue-500'
                              >
                                <Eye className='w-5 h-5' />
                              </button>
                            )}
                            {availableActions.includes('edit') && (
                              <button
                                onClick={() => openEditModal(agent)}
                                className='text-yellow-400 hover:text-yellow-500'
                              >
                                <Edit className='w-5 h-5' />
                              </button>
                            )}
                            {availableActions.includes('delete') && (
                              <button
                                onClick={() => openDeleteModal(agent)}
                                className='text-red-400 hover:text-red-500'
                              >
                                <Trash2 className='w-5 h-5' />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {agents.length === 0 && (
              <div className='text-center py-12'>
                <Bot className='w-16 h-16 text-gray-400 mx-auto mb-4' />
                <h3 className='text-lg font-medium text-gray-300 mb-2'>Không tìm thấy agents</h3>
                <p className='text-gray-500'>Thử thay đổi bộ lọc hoặc tìm kiếm khác</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className='flex items-center justify-between'>
          <div className='text-gray-400'>
            Hiển thị {(pagination.page - 1) * pagination.limit + 1} -{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} trong tổng số{' '}
            {pagination.total} agents
          </div>
          <div className='flex items-center space-x-2'>
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className='px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors'
            >
              Trước
            </button>

            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    page === pagination.page
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                  }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className='px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors'
            >
              Sau
            </button>
          </div>
        </div>
      )}

      {/* Modal chỉnh sửa agent */}
      <Dialog
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        className='fixed z-50 inset-0 overflow-y-auto'
      >
        <div className='flex items-center justify-center min-h-screen px-4'>
          <div className='fixed inset-0 bg-black/70' aria-hidden='true' />
          <div className='relative bg-gray-900 rounded-2xl p-8 w-full max-w-lg mx-auto z-10 border border-white/10'>
            <Dialog.Title className='text-xl font-bold text-white mb-4'>
              Chỉnh sửa Agent
            </Dialog.Title>
            <div className='space-y-4'>
              <div>
                <label className='block text-gray-300 text-sm mb-1'>
                  Tên Agent <span className='text-red-400'>*</span>
                </label>
                <input
                  type='text'
                  value={editForm?.name || ''}
                  onChange={e => handleEditChange('name', e.target.value)}
                  className='w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white'
                />
              </div>
              <div>
                <label className='block text-gray-300 text-sm mb-1'>Mô tả</label>
                <textarea
                  value={editForm?.description || ''}
                  onChange={e => handleEditChange('description', e.target.value)}
                  className='w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white'
                  rows={2}
                />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-gray-300 text-sm mb-1'>Model</label>
                  <input
                    type='text'
                    value={editForm?.model || ''}
                    onChange={e => handleEditChange('model', e.target.value)}
                    className='w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white'
                  />
                </div>
                <div>
                  <label className='block text-gray-300 text-sm mb-1'>Trạng thái</label>
                  <select
                    value={editForm?.status || ''}
                    onChange={e => handleEditChange('status', e.target.value)}
                    className='w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white'
                  >
                    <option value='ACTIVE'>Hoạt động</option>
                    <option value='INACTIVE'>Không hoạt động</option>
                  </select>
                </div>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-gray-300 text-sm mb-1'>Temperature</label>
                  <input
                    type='number'
                    step='0.01'
                    min='0'
                    max='2'
                    value={editForm?.temperature || 0}
                    onChange={e => handleEditChange('temperature', parseFloat(e.target.value))}
                    className='w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white'
                  />
                </div>
                <div>
                  <label className='block text-gray-300 text-sm mb-1'>Max Tokens</label>
                  <input
                    type='number'
                    min='1'
                    max='4096'
                    value={editForm?.maxTokens || 0}
                    onChange={e => handleEditChange('maxTokens', parseInt(e.target.value))}
                    className='w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white'
                  />
                </div>
              </div>
              <div>
                <label className='block text-gray-300 text-sm mb-1'>Quyền truy cập</label>
                <select
                  value={editForm?.isPublic ? 'PUBLIC' : 'PRIVATE'}
                  onChange={e => handleEditChange('isPublic', e.target.value === 'PUBLIC')}
                  className='w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white'
                >
                  <option value='PUBLIC'>Công khai</option>
                  <option value='PRIVATE'>Riêng tư</option>
                </select>
              </div>
              <div>
                <label className='block text-gray-300 text-sm mb-1'>Owner</label>
                <select
                  value={editForm?.ownerId || ''}
                  onChange={e => handleEditChange('ownerId', e.target.value)}
                  className='w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white'
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
              {editError && <div className='text-red-400 text-sm mt-2'>{editError}</div>}
            </div>
            <div className='flex items-center justify-end space-x-4 mt-6'>
              <button
                onClick={() => setShowEditModal(false)}
                className='px-5 py-2 bg-gray-600 text-white rounded-xl'
              >
                Hủy
              </button>
              <button
                onClick={handleEditSave}
                disabled={editLoading}
                className='px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {editLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Modal xem chi tiết agent */}
      <Dialog
        open={showViewModal}
        onClose={() => setShowViewModal(false)}
        className='fixed z-50 inset-0 overflow-y-auto'
      >
        <div className='flex items-center justify-center min-h-screen px-4'>
          <div className='fixed inset-0 bg-black/70' aria-hidden='true' />
          <div className='relative bg-gray-900 rounded-2xl p-8 w-full max-w-xl mx-auto z-10 border border-white/10'>
            <Dialog.Title className='text-xl font-bold text-white mb-4'>
              Thông tin Agent
            </Dialog.Title>
            {viewAgent && (
              <div className='space-y-3'>
                <div className='text-lg font-semibold text-white'>{viewAgent.name}</div>
                <div className='text-gray-400 text-sm'>{viewAgent.description}</div>
                <div className='flex flex-wrap gap-2 mt-2'>
                  <span className='px-2 py-1 rounded-full text-xs border bg-blue-500/20 text-blue-300 border-blue-500/30'>
                    {viewAgent.model}
                  </span>
                  <span className='px-2 py-1 rounded-full text-xs border bg-gray-500/20 text-gray-300 border-gray-500/30'>
                    Temp: {viewAgent.temperature}
                  </span>
                  <span className='px-2 py-1 rounded-full text-xs border bg-gray-500/20 text-gray-300 border-gray-500/30'>
                    Tokens: {viewAgent.maxTokens}
                  </span>
                  <span className='px-2 py-1 rounded-full text-xs border bg-green-500/20 text-green-300 border-green-500/30'>
                    {viewAgent.status}
                  </span>
                  <span className='px-2 py-1 rounded-full text-xs border bg-gray-500/20 text-gray-300 border-gray-500/30'>
                    {viewAgent.isPublic ? 'Công khai' : 'Riêng tư'}
                  </span>
                </div>
                <div className='mt-2 text-sm text-gray-300'>
                  Owner: <span className='font-semibold'>{viewAgent.owner.name}</span> (
                  {viewAgent.owner.email})
                </div>
                <div className='flex gap-6 mt-2'>
                  <div className='text-xs text-gray-400'>
                    Hội thoại:{' '}
                    <span className='text-white font-bold'>
                      {viewAgent.statistics.conversationsCount}
                    </span>
                  </div>
                  <div className='text-xs text-gray-400'>
                    Deployments:{' '}
                    <span className='text-white font-bold'>
                      {viewAgent.statistics.deploymentsCount}
                    </span>
                  </div>
                </div>
                <div className='text-xs text-gray-500 mt-2'>
                  Tạo lúc: {new Date(viewAgent.createdAt).toLocaleString('vi-VN')}
                </div>
              </div>
            )}
            <div className='flex items-center justify-end space-x-4 mt-6'>
              <button
                onClick={() => setShowViewModal(false)}
                className='px-5 py-2 bg-gray-600 text-white rounded-xl'
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Modal xác nhận xóa agent */}
      <Dialog
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteAgent(null);
        }}
        className='fixed z-50 inset-0 overflow-y-auto'
      >
        <div className='flex items-center justify-center min-h-screen px-4'>
          <div className='fixed inset-0 bg-black/70' aria-hidden='true' />
          <div className='relative bg-gray-900 rounded-2xl p-8 w-full max-w-md mx-auto z-10 border border-white/10'>
            <Dialog.Title className='text-xl font-bold text-white mb-4'>
              Xác nhận xóa Agent
            </Dialog.Title>
            <div className='text-white mb-4'>
              Bạn có chắc chắn muốn xóa agent{' '}
              <span className='font-semibold'>{deleteAgent?.name}</span> không?
            </div>
            {deleteError && <div className='text-red-400 text-sm mb-2'>{deleteError}</div>}
            <div className='flex items-center justify-end space-x-4 mt-6'>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteAgent(null);
                }}
                className='px-5 py-2 bg-gray-600 text-white rounded-xl'
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteAgent}
                disabled={deleteLoading}
                className='px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {deleteLoading ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
