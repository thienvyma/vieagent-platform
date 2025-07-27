'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import {
  Eye,
  User,
  MessageSquare,
  Settings,
  Trash2,
  RefreshCw,
  ArrowLeft,
  Server,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { hasPermission, getRoleDisplayName, getRoleColor, type UserRole } from '@/lib/permissions';
import { Dialog } from '@headlessui/react';

interface AgentDetail {
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
    createdAt: string;
  };
  statistics: {
    conversationsCount: number;
    deploymentsCount: number;
  };
  recentConversations: Array<{
    id: string;
    title?: string;
    createdAt: string;
    updatedAt: string;
    messagesCount: number;
  }>;
  deployments: Array<{
    id: string;
    name: string;
    description?: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
  role: string;
  plan: string;
}

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const agentId = params?.id as string;

  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('info');
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [newOwnerId, setNewOwnerId] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Fetch agent detail
  const fetchAgent = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/agents/${agentId}`);
      const data = await res.json();
      if (data.success) {
        setAgent(data.agent);
      } else {
        setError(data.error || 'Không thể tải dữ liệu agent');
      }
    } catch (err) {
      setError('Lỗi khi tải dữ liệu agent');
    } finally {
      setLoading(false);
    }
  };

  // Fetch users for transfer ownership
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  useEffect(() => {
    if (agentId) {
      fetchAgent();
      fetchUsers();
    }
  }, [agentId]);

  // Check permissions
  const canEditAgents =
    session?.user && hasPermission(session.user.role as UserRole, 'edit_agents');
  const canManageAgents =
    session?.user && hasPermission(session.user.role as UserRole, 'edit_agents');
  const canDeleteAgents =
    session?.user && hasPermission(session.user.role as UserRole, 'delete_agents');

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

  // Action handlers
  const handleUpdateStatus = async () => {
    if (!newStatus) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/agents/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Cập nhật trạng thái thành công!');
        setShowStatusModal(false);
        fetchAgent(); // Refresh data
      } else {
        toast.error(data.error || 'Lỗi khi cập nhật trạng thái');
      }
    } catch (err) {
      toast.error('Lỗi khi cập nhật trạng thái');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransferOwnership = async () => {
    if (!newOwnerId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/agents/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'transfer_ownership', newOwnerId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Chuyển ownership thành công!');
        setShowTransferModal(false);
        fetchAgent(); // Refresh data
      } else {
        toast.error(data.error || 'Lỗi khi chuyển ownership');
      }
    } catch (err) {
      toast.error('Lỗi khi chuyển ownership');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/agents/${agentId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Đã xóa agent thành công!');
        setTimeout(() => router.push('/admin/agents'), 1500);
      } else {
        toast.error(data.error || 'Lỗi khi xóa agent');
      }
    } catch (err) {
      toast.error('Lỗi khi xóa agent');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = () => {
    if (!agent) return;
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
    setEditError(null);
    setShowEditModal(true);
  };

  const handleEditChange = (field: string, value: any) => {
    setEditForm((prev: any) => ({ ...prev, [field]: value }));
    if (editError) setEditError(null);
  };

  const handleEditSave = async () => {
    if (!editForm.name?.trim()) {
      setEditError('Tên agent không được để trống');
      return;
    }
    setEditLoading(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/admin/agents/${agentId}`, {
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
        fetchAgent();
      } else {
        setEditError(data.error || 'Lỗi khi cập nhật agent');
      }
    } catch (err) {
      setEditError('Lỗi khi cập nhật agent');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className='max-w-5xl mx-auto py-8 space-y-6'>
      <button
        onClick={() => router.back()}
        className='flex items-center text-gray-400 hover:text-white mb-4'
      >
        <ArrowLeft className='w-4 h-4 mr-2' /> Quay lại danh sách agents
      </button>

      <h1 className='text-3xl font-bold text-white flex items-center space-x-3 mb-2'>
        <Eye className='w-8 h-8 text-blue-400' />
        <span>Chi tiết Agent</span>
      </h1>

      {loading ? (
        <div className='flex items-center justify-center py-12'>
          <div className='text-center'>
            <div className='w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
            <p className='text-gray-400'>Đang tải dữ liệu agent...</p>
          </div>
        </div>
      ) : error ? (
        <div className='text-red-400 text-center py-8'>{error}</div>
      ) : (
        agent && (
          <div className='bg-white/5 rounded-2xl border border-white/10 p-6'>
            {/* Tab Navigation */}
            <div className='flex space-x-1 mb-6 bg-white/5 rounded-lg p-1'>
              {[
                { id: 'info', label: 'Thông tin', icon: Eye },
                { id: 'owner', label: 'Chủ sở hữu', icon: User },
                { id: 'conversations', label: 'Hội thoại', icon: MessageSquare },
                { id: 'deployments', label: 'Deployments', icon: Server },
                { id: 'actions', label: 'Quản trị', icon: Settings },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                    tab === id
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className='w-4 h-4' />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Tab content */}
            {tab === 'info' && (
              <div className='space-y-4'>
                <div className='text-xl font-semibold text-white'>{agent.name}</div>
                <div className='text-gray-400'>{agent.description}</div>
                <div className='flex items-center space-x-4 mt-2'>
                  <span
                    className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(agent.status)}`}
                  >
                    {getStatusDisplayName(agent.status)}
                  </span>
                  <span className='px-3 py-1 rounded-full text-xs border bg-blue-500/20 text-blue-300 border-blue-500/30'>
                    {getModelDisplayName(agent.model)}
                  </span>
                  <span className='px-3 py-1 rounded-full text-xs border bg-gray-500/20 text-gray-300 border-gray-500/30'>
                    Temp: {agent.temperature}
                  </span>
                  <span className='px-3 py-1 rounded-full text-xs border bg-gray-500/20 text-gray-300 border-gray-500/30'>
                    Tokens: {agent.maxTokens}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs border ${
                      agent.isPublic
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                    }`}
                  >
                    {agent.isPublic ? 'Public' : 'Private'}
                  </span>
                </div>
                <div className='text-gray-400 text-sm mt-2'>
                  Tạo lúc: {new Date(agent.createdAt).toLocaleString('vi-VN')}
                </div>
                <div className='text-gray-400 text-sm'>
                  Cập nhật: {new Date(agent.updatedAt).toLocaleString('vi-VN')}
                </div>
              </div>
            )}

            {tab === 'owner' && (
              <div className='space-y-4'>
                <div className='flex items-center space-x-3'>
                  <div className='w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-lg font-bold text-white'>
                    {agent.owner.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className='text-white font-medium text-lg'>{agent.owner.name}</div>
                    <div className='text-gray-400 text-sm'>{agent.owner.email}</div>
                    <div className='flex items-center space-x-2 mt-1'>
                      <span
                        className={`px-2 py-1 rounded-full text-xs border ${getRoleColor(agent.owner.role as UserRole)}`}
                      >
                        {getRoleDisplayName(agent.owner.role as UserRole)}
                      </span>
                      <span className='text-gray-400 text-xs'>{agent.owner.plan}</span>
                    </div>
                    <div className='text-gray-400 text-xs mt-1'>
                      Tạo tài khoản: {new Date(agent.owner.createdAt).toLocaleString('vi-VN')}
                    </div>
                  </div>
                </div>
                <div className='mt-4 text-gray-400 text-sm'>
                  Trạng thái:{' '}
                  {agent.owner.isActive ? (
                    <span className='text-green-400'>Đang hoạt động</span>
                  ) : (
                    <span className='text-red-400'>Đã khóa</span>
                  )}
                </div>
              </div>
            )}

            {tab === 'conversations' && (
              <div>
                {agent.recentConversations.length === 0 ? (
                  <div className='text-gray-400'>Chưa có hội thoại nào.</div>
                ) : (
                  <ul className='divide-y divide-gray-800/50'>
                    {agent.recentConversations.map(conv => (
                      <li key={conv.id} className='py-3'>
                        <div className='flex items-center justify-between'>
                          <div>
                            <div className='text-white font-medium'>
                              {conv.title || 'Không tiêu đề'}
                            </div>
                            <div className='text-gray-400 text-xs'>
                              Tạo: {new Date(conv.createdAt).toLocaleString('vi-VN')}
                            </div>
                            <div className='text-gray-400 text-xs'>
                              Cập nhật: {new Date(conv.updatedAt).toLocaleString('vi-VN')}
                            </div>
                          </div>
                          <div className='text-gray-400 text-xs'>{conv.messagesCount} tin nhắn</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {tab === 'deployments' && (
              <div>
                {agent.deployments.length === 0 ? (
                  <div className='text-gray-400'>Chưa có deployment nào.</div>
                ) : (
                  <ul className='divide-y divide-gray-800/50'>
                    {agent.deployments.map(dep => (
                      <li key={dep.id} className='py-3'>
                        <div className='flex items-center justify-between'>
                          <div>
                            <div className='text-white font-medium'>{dep.name}</div>
                            <div className='text-gray-400 text-xs'>{dep.description}</div>
                            <div className='flex items-center space-x-2 mt-1'>
                              <span
                                className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(dep.status)}`}
                              >
                                {getStatusDisplayName(dep.status)}
                              </span>
                            </div>
                          </div>
                          <div className='text-gray-400 text-xs text-right'>
                            <div>Tạo: {new Date(dep.createdAt).toLocaleString('vi-VN')}</div>
                            <div>Cập nhật: {new Date(dep.updatedAt).toLocaleString('vi-VN')}</div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {tab === 'actions' && (
              <div className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {/* Refresh Data */}
                  <button
                    onClick={fetchAgent}
                    disabled={actionLoading}
                    className='p-4 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center space-x-2'
                  >
                    <RefreshCw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} />
                    <span>Làm mới dữ liệu</span>
                  </button>

                  {/* Update Status */}
                  {canEditAgents && (
                    <button
                      onClick={() => setShowStatusModal(true)}
                      disabled={actionLoading}
                      className='p-4 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/30 transition-colors flex items-center space-x-2'
                    >
                      <Settings className='w-4 h-4' />
                      <span>Cập nhật trạng thái</span>
                    </button>
                  )}

                  {/* Transfer Ownership */}
                  {canManageAgents && (
                    <button
                      onClick={() => setShowTransferModal(true)}
                      disabled={actionLoading}
                      className='p-4 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition-colors flex items-center space-x-2'
                    >
                      <User className='w-4 h-4' />
                      <span>Chuyển ownership</span>
                    </button>
                  )}

                  {/* Delete Agent */}
                  {canDeleteAgents && (
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      disabled={actionLoading}
                      className='p-4 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors flex items-center space-x-2'
                    >
                      <Trash2 className='w-4 h-4' />
                      <span>Xóa agent</span>
                    </button>
                  )}

                  {/* Edit Agent */}
                  {canEditAgents && (
                    <button
                      onClick={openEditModal}
                      className='px-4 py-2 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors ml-2'
                    >
                      Chỉnh sửa
                    </button>
                  )}
                </div>

                {/* Permission Info */}
                <div className='mt-6 p-4 bg-gray-500/10 rounded-lg'>
                  <h3 className='text-white font-medium mb-2'>Phân quyền hiện tại:</h3>
                  <ul className='text-gray-400 text-sm space-y-1'>
                    <li>
                      • Cập nhật trạng thái: {canEditAgents ? '✅ Có quyền' : '❌ Không có quyền'}
                    </li>
                    <li>
                      • Chuyển ownership: {canManageAgents ? '✅ Có quyền' : '❌ Không có quyền'}
                    </li>
                    <li>• Xóa agent: {canDeleteAgents ? '✅ Có quyền' : '❌ Không có quyền'}</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
          <div className='bg-gray-800 rounded-lg p-6 w-full max-w-md'>
            <h3 className='text-white font-semibold mb-4'>Cập nhật trạng thái agent</h3>
            <select
              value={newStatus}
              onChange={e => setNewStatus(e.target.value)}
              className='w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white mb-4'
            >
              <option value=''>Chọn trạng thái mới</option>
              <option value='ACTIVE'>Hoạt động</option>
              <option value='INACTIVE'>Không hoạt động</option>
            </select>
            <div className='flex space-x-3'>
              <button
                onClick={() => setShowStatusModal(false)}
                className='flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700'
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={!newStatus || actionLoading}
                className='flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50'
              >
                {actionLoading ? 'Đang cập nhật...' : 'Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Ownership Modal */}
      {showTransferModal && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
          <div className='bg-gray-800 rounded-lg p-6 w-full max-w-md'>
            <h3 className='text-white font-semibold mb-4'>Chuyển ownership</h3>
            <select
              value={newOwnerId}
              onChange={e => setNewOwnerId(e.target.value)}
              className='w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white mb-4'
            >
              <option value=''>Chọn user mới</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email}) - {getRoleDisplayName(user.role as UserRole)}
                </option>
              ))}
            </select>
            <div className='flex space-x-3'>
              <button
                onClick={() => setShowTransferModal(false)}
                className='flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700'
              >
                Hủy
              </button>
              <button
                onClick={handleTransferOwnership}
                disabled={!newOwnerId || actionLoading}
                className='flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50'
              >
                {actionLoading ? 'Đang chuyển...' : 'Chuyển ownership'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
          <div className='bg-gray-800 rounded-lg p-6 w-full max-w-md'>
            <div className='flex items-center space-x-3 mb-4'>
              <AlertTriangle className='w-6 h-6 text-red-400' />
              <h3 className='text-white font-semibold'>Xác nhận xóa agent</h3>
            </div>
            <p className='text-gray-300 mb-4'>
              Bạn có chắc chắn muốn xóa agent <strong>&quot;{agent?.name}&quot;</strong>? Hành động này không
              thể hoàn tác và sẽ xóa tất cả dữ liệu liên quan.
            </p>
            <div className='flex space-x-3'>
              <button
                onClick={() => setShowDeleteModal(false)}
                className='flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700'
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className='flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50'
              >
                {actionLoading ? 'Đang xóa...' : 'Xóa agent'}
              </button>
            </div>
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
    </div>
  );
}
