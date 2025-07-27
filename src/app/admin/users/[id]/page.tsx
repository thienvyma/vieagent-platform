'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Users,
  Mail,
  Shield,
  Crown,
  UserCheck,
  Lock,
  Unlock,
  Edit,
  Trash2,
  Key,
  Bot,
  MessageSquare,
  TrendingUp,
  Activity,
  Save,
  RefreshCw,
  LogOut,
  AlertTriangle,
  CheckCircle,
  Calendar,
  CreditCard,
  FileText,
} from 'lucide-react';
import {
  hasPermission,
  canModifyUser,
  canDeleteUser,
  canChangeRole,
  getAvailableUserActions,
  getRoleDisplayName,
  getRoleColor,
  type UserRole,
} from '@/lib/permissions';

// Types
interface User {
  id: string;
  email: string;
  name: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'USER';
  plan: 'TRIAL' | 'BASIC' | 'PRO' | 'ENTERPRISE' | 'ULTIMATE';
  isActive: boolean;
  createdAt: string;
  agentsCount: number;
  conversationsCount: number;
  avatar?: string;
  statistics?: {
    agentsCount: number;
    conversationsCount: number;
    messagesCount: number;
  };
  subscription?: {
    plan: 'TRIAL' | 'BASIC' | 'PRO' | 'ENTERPRISE' | 'ULTIMATE';
    startDate?: string;
    endDate?: string;
    status?: string;
  };
}

interface Agent {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  conversationsCount: number;
}

interface Subscription {
  id: string;
  plan: string;
  status: string;
  startDate: string;
  endDate?: string;
  amount: number;
  paymentStatus: string;
}

interface AdminLog {
  id: string;
  action: string;
  resource: string;
  description?: string;
  createdAt: string;
}

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const userId = params?.id as string;

  // State
  const [user, setUser] = useState<User | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'agents' | 'subscriptions' | 'logs'>(
    'profile'
  );
  const [actionLoading, setActionLoading] = useState(false);
  const [tabLoading, setTabLoading] = useState(false);

  // Get available actions for current user
  const getAvailableActions = () => {
    if (!session?.user || !user) return [];
    return getAvailableUserActions(
      session.user.role as UserRole,
      session.user.id,
      user.role as UserRole,
      user.id
    );
  };

  const availableActions = getAvailableActions();

  // Fetch user profile from API
  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetch(`/api/admin/users/${userId}`)
      .then(res => res.json())
      .then(data => {
        setUser({
          ...data,
          agentsCount: data.statistics?.agentsCount || 0,
          conversationsCount: data.statistics?.conversationsCount || 0,
          statistics: data.statistics,
          subscription: data.subscription
            ? {
                plan: data.subscription.plan,
                startDate: data.subscription.startDate,
                endDate: data.subscription.endDate,
                status: data.subscription.status,
              }
            : undefined,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId]);

  // Fetch agents data when tab is active
  useEffect(() => {
    if (activeTab === 'agents' && userId) {
      setTabLoading(true);
      fetch(`/api/admin/users/${userId}/agents`)
        .then(res => res.json())
        .then(data => {
          setAgents(data.agents || []);
          setTabLoading(false);
        })
        .catch(() => setTabLoading(false));
    }
  }, [activeTab, userId]);

  // Fetch subscriptions data when tab is active
  useEffect(() => {
    if (activeTab === 'subscriptions' && userId) {
      setTabLoading(true);
      fetch(`/api/admin/users/${userId}/subscriptions`)
        .then(res => res.json())
        .then(data => {
          setSubscriptions(data.subscriptions || []);
          setTabLoading(false);
        })
        .catch(() => setTabLoading(false));
    }
  }, [activeTab, userId]);

  // Fetch logs data when tab is active
  useEffect(() => {
    if (activeTab === 'logs' && userId) {
      setTabLoading(true);
      fetch(`/api/admin/users/${userId}/logs`)
        .then(res => res.json())
        .then(data => {
          setLogs(data.logs || []);
          setTabLoading(false);
        })
        .catch(() => setTabLoading(false));
    }
  }, [activeTab, userId]);

  // Action handlers
  const handleChangeRole = async (role: User['role']) => {
    if (!user) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        setUser(prev => (prev ? { ...prev, role } : prev));
        alert('Đã cập nhật role thành công!');
      } else {
        const error = await res.json();
        alert(`Lỗi: ${error.error}`);
      }
    } catch (error) {
      alert('Có lỗi xảy ra khi cập nhật role!');
    }
    setActionLoading(false);
  };

  const handleToggleStatus = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      if (res.ok) {
        setUser(prev => (prev ? { ...prev, isActive: !prev.isActive } : prev));
        alert(`Đã ${user.isActive ? 'khoá' : 'mở khoá'} user thành công!`);
      } else {
        const error = await res.json();
        alert(`Lỗi: ${error.error}`);
      }
    } catch (error) {
      alert('Có lỗi xảy ra khi thay đổi trạng thái user!');
    }
    setActionLoading(false);
  };

  const handleResetPassword = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset-password' }),
      });
      if (res.ok) {
        alert('Đã reset mật khẩu và gửi email cho user!');
      } else {
        const error = await res.json();
        alert(`Lỗi: ${error.error}`);
      }
    } catch (error) {
      alert('Có lỗi xảy ra khi reset mật khẩu!');
    }
    setActionLoading(false);
  };

  const handleDeleteUser = async () => {
    if (!user) return;
    if (!confirm('Bạn có chắc chắn muốn xóa user này?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Đã xóa user thành công!');
        router.push('/admin/users');
      } else {
        const error = await res.json();
        alert(`Lỗi: ${error.error}`);
      }
    } catch (error) {
      alert('Có lỗi xảy ra khi xóa user!');
    }
    setActionLoading(false);
  };

  const handleChangePlan = async (plan: User['plan']) => {
    if (!user) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      if (res.ok) {
        setUser(prev => (prev ? { ...prev, plan } : prev));
        alert('Đã cập nhật plan thành công!');
      } else {
        const error = await res.json();
        alert(`Lỗi: ${error.error}`);
      }
    } catch (error) {
      alert('Có lỗi xảy ra khi cập nhật plan!');
    }
    setActionLoading(false);
  };

  if (loading || !user) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-center'>
          <div className='w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-white'>Đang tải dữ liệu user...</p>
        </div>
      </div>
    );
  }

  // UI helpers
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <Crown className='w-5 h-5 text-yellow-500' />;
      case 'ADMIN':
        return <Shield className='w-5 h-5 text-red-500' />;
      case 'MANAGER':
        return <UserCheck className='w-5 h-5 text-blue-500' />;
      default:
        return <Users className='w-5 h-5 text-gray-500' />;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'ENTERPRISE':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'PRO':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className='max-w-5xl mx-auto py-8 space-y-8'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-4'>
          <div className='w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-3xl font-bold text-white'>
            {user.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h1 className='text-2xl font-bold text-white flex items-center space-x-2'>
              <span>{user.name}</span>
              {getRoleIcon(user.role)}
            </h1>
            <p className='text-gray-400'>{user.email}</p>
            <span
              className={`px-2 py-1 rounded-full text-xs border ${getRoleColor(user.role)} mr-2`}
            >
              {getRoleDisplayName(user.role)}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs border ${getPlanColor(user.plan)}`}>
              {user.plan}
            </span>
          </div>
        </div>
        <div className='flex space-x-2'>
          {/* Role change buttons - only show if user can change roles */}
          {availableActions.includes('change_role') && (
            <>
              {user.role !== 'ADMIN' && (
                <button
                  onClick={() => handleChangeRole('ADMIN')}
                  disabled={actionLoading}
                  className='px-4 py-2 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 rounded-lg font-medium hover:bg-yellow-500/30 transition-colors'
                >
                  Đổi role Admin
                </button>
              )}
              {user.role !== 'MANAGER' && (
                <button
                  onClick={() => handleChangeRole('MANAGER')}
                  disabled={actionLoading}
                  className='px-4 py-2 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg font-medium hover:bg-blue-500/30 transition-colors'
                >
                  Đổi role Manager
                </button>
              )}
            </>
          )}

          {/* Plan change buttons - only show if user can change plans */}
          {availableActions.includes('change_plan') && (
            <>
              {user.plan !== 'PRO' && (
                <button
                  onClick={() => handleChangePlan('PRO')}
                  disabled={actionLoading}
                  className='px-4 py-2 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg font-medium hover:bg-blue-500/30 transition-colors'
                >
                  Đổi plan PRO
                </button>
              )}
              {user.plan !== 'ENTERPRISE' && (
                <button
                  onClick={() => handleChangePlan('ENTERPRISE')}
                  disabled={actionLoading}
                  className='px-4 py-2 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg font-medium hover:bg-purple-500/30 transition-colors'
                >
                  Đổi plan ENTERPRISE
                </button>
              )}
            </>
          )}

          {/* Status toggle - only show if user can edit */}
          {availableActions.includes('edit') && (
            <button
              onClick={handleToggleStatus}
              disabled={actionLoading}
              className={`px-4 py-2 ${user.isActive ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-green-500/20 text-green-300 border-green-500/30'} border rounded-lg font-medium hover:bg-opacity-80 transition-colors`}
            >
              {user.isActive ? 'Khoá user' : 'Mở khoá'}
            </button>
          )}

          {/* Reset password - only show if user has permission */}
          {availableActions.includes('reset_password') && (
            <button
              onClick={handleResetPassword}
              disabled={actionLoading}
              className='px-4 py-2 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg font-medium hover:bg-blue-500/30 transition-colors'
            >
              Reset mật khẩu
            </button>
          )}

          {/* Delete user - only show if user can delete */}
          {availableActions.includes('delete') && (
            <button
              onClick={handleDeleteUser}
              disabled={actionLoading}
              className='px-4 py-2 bg-red-700/20 text-red-400 border border-red-700/30 rounded-lg font-medium hover:bg-red-700/30 transition-colors'
            >
              Xóa user
            </button>
          )}
        </div>
      </div>

      {/* Permission Info */}
      {session?.user && (
        <div className='bg-blue-500/10 border border-blue-500/20 rounded-lg p-4'>
          <div className='flex items-center space-x-2 mb-2'>
            <Shield className='w-5 h-5 text-blue-400' />
            <span className='text-blue-300 font-medium'>Thông tin phân quyền</span>
          </div>
          <div className='text-sm text-gray-300 space-y-1'>
            <div>
              Bạn đang đăng nhập với role:{' '}
              <span className='text-white font-medium'>
                {getRoleDisplayName(session.user.role as UserRole)}
              </span>
            </div>
            <div>
              Các hành động có thể thực hiện:{' '}
              <span className='text-white font-medium'>{availableActions.join(', ')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className='flex space-x-2 border-b border-gray-800/50 mb-4'>
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-6 py-3 font-medium ${activeTab === 'profile' ? 'text-white border-b-2 border-red-500' : 'text-gray-400 hover:text-white'}`}
        >
          Thông tin
        </button>
        <button
          onClick={() => setActiveTab('agents')}
          className={`px-6 py-3 font-medium ${activeTab === 'agents' ? 'text-white border-b-2 border-red-500' : 'text-gray-400 hover:text-white'}`}
        >
          Agents
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-6 py-3 font-medium ${activeTab === 'subscriptions' ? 'text-white border-b-2 border-red-500' : 'text-gray-400 hover:text-white'}`}
        >
          Subscriptions
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-6 py-3 font-medium ${activeTab === 'logs' ? 'text-white border-b-2 border-red-500' : 'text-gray-400 hover:text-white'}`}
        >
          Logs
        </button>
      </div>

      {/* Tab Content */}
      <div className='bg-white/5 rounded-2xl p-6 border border-white/10'>
        {activeTab === 'profile' && (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            <div>
              <h3 className='text-white font-semibold mb-4 flex items-center space-x-2'>
                <Users className='w-5 h-5' />
                <span>Thông tin cơ bản</span>
              </h3>
              <div className='space-y-2 text-gray-300'>
                <div>
                  Email: <span className='text-white'>{user.email}</span>
                </div>
                <div>
                  Vai trò:{' '}
                  <span
                    className={`px-2 py-1 rounded-full text-xs border ${getRoleColor(user.role)}`}
                  >
                    {getRoleDisplayName(user.role)}
                  </span>
                </div>
                <div>
                  Gói dịch vụ:{' '}
                  <span
                    className={`px-2 py-1 rounded-full text-xs border ${getPlanColor(user.plan)}`}
                  >
                    {user.plan}
                  </span>
                </div>
                <div>
                  Trạng thái:{' '}
                  <span
                    className={`px-2 py-1 rounded-full text-xs border ${user.isActive ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}
                  >
                    {user.isActive ? 'Hoạt động' : 'Đã khoá'}
                  </span>
                </div>
                <div>
                  Ngày tạo:{' '}
                  <span className='text-white'>
                    {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>
              <div className='mt-6'>
                <h4 className='text-white font-semibold mb-2 flex items-center space-x-2'>
                  <TrendingUp className='w-5 h-5' />
                  <span>Thống kê</span>
                </h4>
                <div className='flex space-x-6'>
                  <div className='text-center'>
                    <Bot className='w-8 h-8 text-blue-400 mx-auto mb-1' />
                    <div className='text-white font-bold text-xl'>
                      {user.statistics?.agentsCount || 0}
                    </div>
                    <div className='text-gray-400 text-xs'>Agents</div>
                  </div>
                  <div className='text-center'>
                    <MessageSquare className='w-8 h-8 text-green-400 mx-auto mb-1' />
                    <div className='text-white font-bold text-xl'>
                      {user.statistics?.conversationsCount || 0}
                    </div>
                    <div className='text-gray-400 text-xs'>Conversations</div>
                  </div>
                  <div className='text-center'>
                    <Activity className='w-8 h-8 text-purple-400 mx-auto mb-1' />
                    <div className='text-white font-bold text-xl'>
                      {user.statistics?.messagesCount || 0}
                    </div>
                    <div className='text-gray-400 text-xs'>Messages</div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3 className='text-white font-semibold mb-4 flex items-center space-x-2'>
                <CreditCard className='w-5 h-5' />
                <span>Subscription hiện tại</span>
              </h3>
              {user.subscription ? (
                <div className='space-y-2 text-gray-300'>
                  <div>
                    Gói:{' '}
                    <span
                      className={`px-2 py-1 rounded-full text-xs border ${getPlanColor(user.subscription.plan)}`}
                    >
                      {user.subscription.plan}
                    </span>
                  </div>
                  <div>
                    Bắt đầu:{' '}
                    <span className='text-white'>
                      {user.subscription.startDate
                        ? new Date(user.subscription.startDate).toLocaleDateString('vi-VN')
                        : '---'}
                    </span>
                  </div>
                  <div>
                    Hết hạn:{' '}
                    <span className='text-white'>
                      {user.subscription.endDate
                        ? new Date(user.subscription.endDate).toLocaleDateString('vi-VN')
                        : '---'}
                    </span>
                  </div>
                  <div>
                    Trạng thái: <span className='text-white'>{user.subscription.status}</span>
                  </div>
                </div>
              ) : (
                <div className='text-gray-400'>Chưa có subscription</div>
              )}
            </div>
          </div>
        )}
        {activeTab === 'agents' && (
          <div>
            <h3 className='text-white font-semibold mb-4 flex items-center space-x-2'>
              <Bot className='w-5 h-5' />
              <span>Danh sách Agents</span>
            </h3>
            {tabLoading ? (
              <div className='flex items-center justify-center py-8'>
                <div className='w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin'></div>
                <span className='ml-2 text-gray-400'>Đang tải agents...</span>
              </div>
            ) : agents.length > 0 ? (
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead className='bg-gray-800/50'>
                    <tr>
                      <th className='px-4 py-2 text-left text-white'>Tên Agent</th>
                      <th className='px-4 py-2 text-left text-white'>Trạng thái</th>
                      <th className='px-4 py-2 text-left text-white'>Ngày tạo</th>
                      <th className='px-4 py-2 text-left text-white'>Số hội thoại</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-800/50'>
                    {agents.map(agent => (
                      <tr key={agent.id} className='hover:bg-white/5 transition-colors'>
                        <td className='px-4 py-2 text-white font-medium'>{agent.name}</td>
                        <td className='px-4 py-2'>
                          <span
                            className={`px-2 py-1 rounded-full text-xs border ${agent.status === 'ACTIVE' ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}
                          >
                            {agent.status}
                          </span>
                        </td>
                        <td className='px-4 py-2 text-gray-300'>
                          {new Date(agent.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className='px-4 py-2 text-gray-300'>{agent.conversationsCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className='text-center py-8 text-gray-400'>
                <Bot className='w-12 h-12 mx-auto mb-2 opacity-50' />
                <p>User này chưa có agents nào</p>
              </div>
            )}
          </div>
        )}
        {activeTab === 'subscriptions' && (
          <div>
            <h3 className='text-white font-semibold mb-4 flex items-center space-x-2'>
              <CreditCard className='w-5 h-5' />
              <span>Lịch sử Subscriptions</span>
            </h3>
            {tabLoading ? (
              <div className='flex items-center justify-center py-8'>
                <div className='w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin'></div>
                <span className='ml-2 text-gray-400'>Đang tải subscriptions...</span>
              </div>
            ) : subscriptions.length > 0 ? (
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead className='bg-gray-800/50'>
                    <tr>
                      <th className='px-4 py-2 text-left text-white'>Gói</th>
                      <th className='px-4 py-2 text-left text-white'>Trạng thái</th>
                      <th className='px-4 py-2 text-left text-white'>Bắt đầu</th>
                      <th className='px-4 py-2 text-left text-white'>Hết hạn</th>
                      <th className='px-4 py-2 text-left text-white'>Số tiền</th>
                      <th className='px-4 py-2 text-left text-white'>Thanh toán</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-800/50'>
                    {subscriptions.map(sub => (
                      <tr key={sub.id} className='hover:bg-white/5 transition-colors'>
                        <td className='px-4 py-2 text-white font-medium'>{sub.plan}</td>
                        <td className='px-4 py-2'>
                          <span
                            className={`px-2 py-1 rounded-full text-xs border ${sub.status === 'ACTIVE' ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-gray-500/20 text-gray-300 border-gray-500/30'}`}
                          >
                            {sub.status}
                          </span>
                        </td>
                        <td className='px-4 py-2 text-gray-300'>
                          {new Date(sub.startDate).toLocaleDateString('vi-VN')}
                        </td>
                        <td className='px-4 py-2 text-gray-300'>
                          {sub.endDate ? new Date(sub.endDate).toLocaleDateString('vi-VN') : '---'}
                        </td>
                        <td className='px-4 py-2 text-gray-300'>
                          {sub.amount.toLocaleString('vi-VN', {
                            style: 'currency',
                            currency: 'USD',
                          })}
                        </td>
                        <td className='px-4 py-2 text-gray-300'>{sub.paymentStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className='text-center py-8 text-gray-400'>
                <CreditCard className='w-12 h-12 mx-auto mb-2 opacity-50' />
                <p>Chưa có lịch sử subscriptions</p>
              </div>
            )}
          </div>
        )}
        {activeTab === 'logs' && (
          <div>
            <h3 className='text-white font-semibold mb-4 flex items-center space-x-2'>
              <FileText className='w-5 h-5' />
              <span>Lịch sử hoạt động</span>
            </h3>
            {tabLoading ? (
              <div className='flex items-center justify-center py-8'>
                <div className='w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin'></div>
                <span className='ml-2 text-gray-400'>Đang tải logs...</span>
              </div>
            ) : logs.length > 0 ? (
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead className='bg-gray-800/50'>
                    <tr>
                      <th className='px-4 py-2 text-left text-white'>Thời gian</th>
                      <th className='px-4 py-2 text-left text-white'>Hành động</th>
                      <th className='px-4 py-2 text-left text-white'>Tài nguyên</th>
                      <th className='px-4 py-2 text-left text-white'>Mô tả</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-800/50'>
                    {logs.map(log => (
                      <tr key={log.id} className='hover:bg-white/5 transition-colors'>
                        <td className='px-4 py-2 text-gray-300'>
                          {new Date(log.createdAt).toLocaleString('vi-VN')}
                        </td>
                        <td className='px-4 py-2 text-white font-medium'>{log.action}</td>
                        <td className='px-4 py-2 text-gray-300'>{log.resource}</td>
                        <td className='px-4 py-2 text-gray-300'>{log.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className='text-center py-8 text-gray-400'>
                <FileText className='w-12 h-12 mx-auto mb-2 opacity-50' />
                <p>Chưa có lịch sử hoạt động</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
