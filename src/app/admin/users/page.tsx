'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Shield,
  Crown,
  UserCheck,
  Lock,
  Unlock,
  Eye,
  Mail,
  Calendar,
  Activity,
  Plus,
  Download,
  Upload,
} from 'lucide-react';
import UserDetailModal from '@/components/admin/UserDetailModal';
import UserEditModal from '@/components/admin/UserEditModal';
import { Dialog } from '@headlessui/react';
import toast from 'react-hot-toast';

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
  statistics?: {
    agentsCount: number;
    conversationsCount: number;
    messagesCount: number;
  };
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Modal states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState('ADMIN');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/users');
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users);
          setFilteredUsers(data.users);
        } else {
          console.error('Failed to fetch users');
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filter users
  useEffect(() => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        user =>
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Plan filter
    if (planFilter !== 'all') {
      filtered = filtered.filter(user => user.plan === planFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(user => user.isActive);
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(user => !user.isActive);
      }
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [users, searchTerm, roleFilter, planFilter, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <Crown className='w-4 h-4 text-yellow-500' />;
      case 'ADMIN':
        return <Shield className='w-4 h-4 text-red-500' />;
      case 'MANAGER':
        return <UserCheck className='w-4 h-4 text-blue-500' />;
      default:
        return <Users className='w-4 h-4 text-gray-500' />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'ADMIN':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'MANAGER':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'TRIAL':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'BASIC':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'PRO':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'ENTERPRISE':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'ULTIMATE':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? 'bg-green-500/20 text-green-300 border-green-500/30'
      : 'bg-red-500/20 text-red-300 border-red-500/30';
  };

  // Action handlers
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleSaveUser = async (userIdOrData: string | Partial<User>, data?: Partial<User>) => {
    try {
      if (typeof userIdOrData === 'string') {
        // Edit mode - PUT request
        // Nếu không nhập password mới thì không gửi lên
        const payload = { ...data };
        if (payload && 'password' in payload && !payload.password) {
          delete payload.password;
        }
        const response = await fetch(`/api/admin/users/${userIdOrData}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const updatedUser = await response.json();
          setUsers(prev =>
            prev.map(user => (user.id === userIdOrData ? { ...user, ...updatedUser.user } : user))
          );
          setShowEditModal(false);
          toast.success('Cập nhật user thành công!');
        } else {
          const error = await response.json();
          toast.error(error.error || 'Lỗi khi cập nhật user');
          console.error('Failed to update user:', error);
        }
      } else {
        // Add mode - POST request
        const response = await fetch('/api/admin/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userIdOrData),
        });

        if (response.ok) {
          const newUserData = await response.json();
          const newUser: User = {
            id: newUserData.user.id,
            email: newUserData.user.email,
            name: newUserData.user.name,
            role: newUserData.user.role,
            plan: newUserData.user.plan,
            isActive: newUserData.user.isActive,
            createdAt: newUserData.user.createdAt,
            agentsCount: 0,
            conversationsCount: 0,
            statistics: { agentsCount: 0, conversationsCount: 0, messagesCount: 0 },
          };
          setUsers(prev => [newUser, ...prev]);
          setShowAddModal(false);
          toast.success('Tạo user mới thành công!');
        } else {
          const error = await response.json();
          toast.error(error.error || 'Lỗi khi tạo user');
          console.error('Failed to create user:', error);
        }
      }
    } catch (error) {
      toast.error('Lỗi kết nối server');
      console.error('Error saving user:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUsers(prev => prev.filter(user => user.id !== userId));
        setShowUserModal(false);
      } else {
        const error = await response.json();
        console.error('Failed to delete user:', error);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleResetPassword = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reset_password' }),
      });

      if (response.ok) {
        console.log('Password reset successfully');
      } else {
        const error = await response.json();
        console.error('Failed to reset password:', error);
      }
    } catch (error) {
      console.error('Error resetting password:', error);
    }
  };

  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });

      if (response.ok) {
        setUsers(prev => prev.map(user => (user.id === userId ? { ...user, isActive } : user)));
      } else {
        const error = await response.json();
        console.error('Failed to toggle user status:', error);
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  const handleExportUsers = () => {
    // TODO: Export users to CSV/Excel
    console.log('Exporting users...');
  };

  const handleImportUsers = () => {
    // TODO: Import users from CSV/Excel
    console.log('Importing users...');
  };

  const openDeleteModal = (user: User) => {
    setDeleteUser(user);
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  const handleDeleteUserConfirm = async () => {
    if (!deleteUser) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const response = await fetch(`/api/admin/users/${deleteUser.id}`, { method: 'DELETE' });
      if (response.ok) {
        setUsers(prev => prev.filter(user => user.id !== deleteUser.id));
        setShowDeleteModal(false);
        setDeleteUser(null);
        toast.success('Xóa user thành công!');
      } else {
        const error = await response.json();
        if (error.error && error.error.toLowerCase().includes('not found')) {
          setShowDeleteModal(false);
          setDeleteUser(null);
          toast.success('User không tồn tại hoặc đã bị xóa!');
          setUsers(prev => prev.filter(user => user.id !== deleteUser.id));
        } else {
          setDeleteError(error.error || 'Lỗi khi xóa user');
        }
      }
    } catch {
      setDeleteError('Lỗi khi xóa user');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-center'>
          <div className='w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-white'>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      {/* Header */}
      <div className='bg-gradient-to-r from-red-500/10 to-yellow-500/10 rounded-3xl p-8 border border-red-500/20'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-white mb-2 flex items-center space-x-3'>
              <Users className='w-8 h-8 text-red-400' />
              <span>User Management</span>
            </h1>
            <p className='text-red-200 text-lg'>Quản lý người dùng, vai trò và quyền hạn</p>
          </div>
          <div className='flex items-center space-x-4'>
            <div className='text-right'>
              <p className='text-red-300 text-sm'>Total Users</p>
              <p className='text-white text-2xl font-bold'>{users.length}</p>
            </div>
            <div className='flex space-x-2'>
              <button
                onClick={handleImportUsers}
                className='flex items-center space-x-2 px-4 py-2 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl transition-colors'
              >
                <Upload className='w-4 h-4' />
                <span>Import</span>
              </button>
              <button
                onClick={handleExportUsers}
                className='flex items-center space-x-2 px-4 py-2 bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-500/30 rounded-xl transition-colors'
              >
                <Download className='w-4 h-4' />
                <span>Export</span>
              </button>
              <button
                className='flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-yellow-600 text-white hover:from-red-600 hover:to-yellow-700 rounded-xl transition-all'
                onClick={() => setShowAddModal(true)}
              >
                <Plus className='w-4 h-4' />
                <span>Add User</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4'>
          {/* Search */}
          <div className='lg:col-span-2'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
              <input
                type='text'
                placeholder='Tìm kiếm user theo email hoặc tên...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-red-500'
              />
            </div>
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className='w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-red-500'
            >
              <option value='all'>Tất cả vai trò</option>
              <option value='OWNER'>Owner</option>
              <option value='ADMIN'>Admin</option>
              <option value='MANAGER'>Manager</option>
              <option value='USER'>User</option>
            </select>
          </div>

          {/* Plan Filter */}
          <div>
            <select
              value={planFilter}
              onChange={e => setPlanFilter(e.target.value)}
              className='w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-red-500'
            >
              <option value='all'>Tất cả gói</option>
              <option value='TRIAL'>Trial</option>
              <option value='BASIC'>Basic</option>
              <option value='PRO'>Pro</option>
              <option value='ENTERPRISE'>Enterprise</option>
              <option value='ULTIMATE'>Ultimate</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className='w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-red-500'
            >
              <option value='all'>Tất cả trạng thái</option>
              <option value='active'>Hoạt động</option>
              <option value='inactive'>Không hoạt động</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className='bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-gray-800/50'>
              <tr>
                <th className='px-6 py-4 text-left text-white font-semibold'>User</th>
                <th className='px-6 py-4 text-left text-white font-semibold'>Vai trò</th>
                <th className='px-6 py-4 text-left text-white font-semibold'>Gói</th>
                <th className='px-6 py-4 text-left text-white font-semibold'>Trạng thái</th>
                <th className='px-6 py-4 text-left text-white font-semibold'>Hoạt động</th>
                <th className='px-6 py-4 text-left text-white font-semibold'>Ngày tạo</th>
                <th className='px-6 py-4 text-left text-white font-semibold'>Thao tác</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-800/50'>
              {currentUsers.map(user => (
                <tr key={user.id} className='hover:bg-white/5 transition-colors'>
                  <td className='px-6 py-4'>
                    <div className='flex items-center space-x-3'>
                      <div className='w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center'>
                        <span className='text-white font-semibold'>
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className='text-white font-medium'>{user.name}</p>
                        <p className='text-gray-400 text-sm'>{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className='px-6 py-4'>
                    <div className='flex items-center space-x-2'>
                      {getRoleIcon(user.role)}
                      <span
                        className={`px-2 py-1 rounded-full text-xs border ${getRoleColor(user.role)}`}
                      >
                        {user.role}
                      </span>
                    </div>
                  </td>
                  <td className='px-4 py-4 whitespace-nowrap'>
                    {user.role === 'USER' ? (
                      <span
                        className={`px-3 py-1 rounded-full text-xs border ${getPlanColor(user.plan)}`}
                      >
                        {user.plan}
                      </span>
                    ) : (
                      <span className='text-gray-500 italic'>—</span>
                    )}
                  </td>
                  <td className='px-6 py-4'>
                    <div className='flex items-center space-x-2'>
                      {user.isActive ? (
                        <Unlock className='w-4 h-4 text-green-500' />
                      ) : (
                        <Lock className='w-4 h-4 text-red-500' />
                      )}
                      <span
                        className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(user.isActive)}`}
                      >
                        {user.isActive ? 'Hoạt động' : 'Không hoạt động'}
                      </span>
                    </div>
                  </td>
                  <td className='px-6 py-4'>
                    <div className='text-sm'>
                      <p className='text-white'>{user.agentsCount} agents</p>
                      <p className='text-gray-400'>{user.conversationsCount} conversations</p>
                    </div>
                  </td>
                  <td className='px-6 py-4'>
                    <div className='text-sm'>
                      <p className='text-white'>
                        {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </td>
                  <td className='px-6 py-4'>
                    <div className='flex items-center space-x-2'>
                      <button
                        onClick={() => handleViewUser(user)}
                        className='p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors'
                        title='Xem chi tiết'
                      >
                        <Eye className='w-4 h-4' />
                      </button>
                      <button
                        onClick={() => handleEditUser(user)}
                        className='p-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 rounded-lg transition-colors'
                        title='Chỉnh sửa'
                      >
                        <Edit className='w-4 h-4' />
                      </button>
                      <button
                        onClick={() => openDeleteModal(user)}
                        className='p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors'
                        title='Xóa user'
                      >
                        <Trash2 className='w-4 h-4' />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className='px-6 py-4 border-t border-gray-800/50'>
            <div className='flex items-center justify-between'>
              <p className='text-gray-400 text-sm'>
                Hiển thị {startIndex + 1} đến {Math.min(endIndex, filteredUsers.length)} trong tổng
                số {filteredUsers.length} users
              </p>
              <div className='flex items-center space-x-2'>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className='px-3 py-1 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700'
                >
                  Trước
                </button>
                <span className='text-white'>
                  Trang {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className='px-3 py-1 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700'
                >
                  Sau
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <UserDetailModal
        user={selectedUser}
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
        onResetPassword={handleResetPassword}
        onToggleStatus={handleToggleStatus}
      />

      <UserEditModal
        user={selectedUser}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveUser}
        currentUserRole={currentUserRole}
      />

      <UserEditModal
        user={null}
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setTimeout(() => setSelectedUser(null), 300);
        }}
        onSave={handleSaveUser}
        currentUserRole={currentUserRole}
        mode='add'
      />

      <Dialog
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteUser(null);
        }}
        className='fixed z-50 inset-0 overflow-y-auto'
      >
        <div className='flex items-center justify-center min-h-screen px-4'>
          <div className='fixed inset-0 bg-black/70' aria-hidden='true' />
          <div className='relative bg-gray-900 rounded-2xl p-8 w-full max-w-md mx-auto z-10 border border-white/10'>
            <Dialog.Title className='text-xl font-bold text-white mb-4'>
              Xác nhận xóa User
            </Dialog.Title>
            <div className='text-white mb-4'>
              Bạn có chắc chắn muốn xóa user{' '}
              <span className='font-semibold'>{deleteUser?.name}</span> ({deleteUser?.email}) không?
            </div>
            {deleteError && <div className='text-red-400 text-sm mb-2'>{deleteError}</div>}
            <div className='flex items-center justify-end space-x-4 mt-6'>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteUser(null);
                }}
                className='px-5 py-2 bg-gray-600 text-white rounded-xl'
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteUserConfirm}
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
