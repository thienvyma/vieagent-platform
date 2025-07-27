'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import AdminNotificationModal from '@/components/notifications/AdminNotificationModal';
import AdminPasswordModal from '@/components/admin/AdminPasswordModal';
import {
  Users,
  Bot,
  CreditCard,
  Settings,
  FileText,
  Megaphone,
  Server,
  BarChart3,
  Shield,
  Crown,
  UserCheck,
  Settings2,
  Banknote,
  Cog,
  LogOut,
  Bell,
  Mail,
  MessageSquare,
  Key,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface AdminMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  description: string;
  requiredRole: 'OWNER' | 'ADMIN' | 'MANAGER' | 'USER';
  badge?: string;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // ✅ FIXED Phase 4D True Fix - Fix session user role access
  const sessionUser = session?.user as {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
    plan?: string;
  };

  const userRole = sessionUser?.role || 'USER';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Admin menu items with role-based access
  const adminMenuItems: AdminMenuItem[] = [
    {
      id: 'dashboard',
      label: 'Admin Dashboard',
      icon: <BarChart3 className='w-5 h-5' />,
      href: '/admin',
      description: 'Tổng quan hệ thống',
      requiredRole: 'MANAGER',
    },
    {
      id: 'users',
      label: 'User Management',
      icon: <Users className='w-5 h-5' />,
      href: '/admin/users',
      description: 'Quản lý người dùng',
      requiredRole: 'ADMIN',
    },
    {
      id: 'agents',
      label: 'Agent Oversight',
      icon: <Bot className='w-5 h-5' />,
      href: '/admin/agents',
      description: 'Giám sát AI agents',
      requiredRole: 'MANAGER',
    },
    {
      id: 'subscriptions',
      label: 'Subscription Management',
      icon: <CreditCard className='w-5 h-5' />,
      href: '/admin/subscriptions',
      description: 'Quản lý đăng ký',
      requiredRole: 'ADMIN',
    },
    {
      id: 'plans',
      label: 'Plans Configuration',
      icon: <Settings className='w-5 h-5' />,
      href: '/admin/plans',
      description: 'Cấu hình gói dịch vụ',
      requiredRole: 'OWNER',
    },
    {
      id: 'payments',
      label: 'Payment Management',
      icon: <Banknote className='w-5 h-5' />,
      href: '/admin/payments',
      description: 'Quản lý thanh toán & chuyển khoản',
      requiredRole: 'ADMIN',
      badge: 'NEW',
    },
    {
      id: 'blog',
      label: 'Blog Manager',
      icon: <FileText className='w-5 h-5' />,
      href: '/admin/blog',
      description: 'Quản lý bài viết',
      requiredRole: 'MANAGER',
    },
    {
      id: 'newsletter',
      label: 'Newsletter Management',
      icon: <Mail className='w-5 h-5' />,
      href: '/admin/newsletter',
      description: 'Quản lý newsletter & email marketing',
      requiredRole: 'MANAGER',
    },
    {
      id: 'contact',
      label: 'Contact Management',
      icon: <MessageSquare className='w-5 h-5' />,
      href: '/admin/contact',
      description: 'Quản lý liên hệ & phản hồi',
      requiredRole: 'MANAGER',
    },
    {
      id: 'announcements',
      label: 'Announcements',
      icon: <Megaphone className='w-5 h-5' />,
      href: '/admin/announcements',
      description: 'Hệ thống thông báo',
      requiredRole: 'MANAGER',
    },
    {
      id: 'vps',
      label: 'VPS Management',
      icon: <Server className='w-5 h-5' />,
      href: '/admin/vps',
      description: 'Quản lý VPS & Deploy',
      requiredRole: 'ADMIN',
    },
    {
      id: 'settings',
      label: 'System Settings',
      icon: <Cog className='w-5 h-5' />,
      href: '/admin/settings',
      description: 'Cấu hình hệ thống nâng cao',
      requiredRole: 'OWNER',
      badge: 'NEW',
    },
  ];

  // Role hierarchy: OWNER > ADMIN > MANAGER > USER
  const roleHierarchy = {
    OWNER: 4,
    ADMIN: 3,
    MANAGER: 2,
    USER: 1,
  };

  const userRoleLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 1;

  // Filter menu items based on user role
  const accessibleMenuItems = adminMenuItems.filter(item => {
    const itemRoleLevel = roleHierarchy[item.requiredRole];
    return userRoleLevel >= itemRoleLevel;
  });

  // ✅ FIXED Phase 4D True Fix - Fix useEffect return value
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    // Check if user has admin access
    if (status === 'authenticated' && userRoleLevel < 2) {
      router.push('/dashboard');
      return;
    }

    // Fetch notification count for admin
    if (status === 'authenticated') {
      fetchNotificationCount();

      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotificationCount, 30000);
      return () => clearInterval(interval);
    }

    // Return undefined for other cases
    return undefined;
  }, [status, userRole, router]);

  const fetchNotificationCount = async () => {
    try {
      const response = await fetch('/api/admin/announcements?limit=1');
      const data = await response.json();
      if (data.announcements) {
        // Count active announcements
        const activeCount = data.announcements.filter(
          (announcement: any) =>
            announcement.isActive &&
            (!announcement.startDate || new Date(announcement.startDate) <= new Date()) &&
            (!announcement.endDate || new Date(announcement.endDate) >= new Date())
        ).length;
        setUnreadCount(activeCount);
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };

  const handleNotificationClick = () => {
    setShowNotificationModal(true);
    // Reset unread count when modal opens
    setUnreadCount(0);
  };

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

  if (status === 'loading') {
    return (
      <div className='min-h-screen bg-black flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-white'>Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (userRoleLevel < 2) {
    return (
      <div className='min-h-screen bg-black flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-20 h-20 bg-red-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6'>
            <Shield className='w-10 h-10 text-red-500' />
          </div>
          <h3 className='text-red-300 font-bold text-xl mb-2'>Access Denied</h3>
          <p className='text-red-200 mb-4'>You don't have permission to access the admin panel.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className='bg-red-500 text-white px-6 py-2 rounded-xl hover:bg-red-600 transition-all'
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-black text-white'>
      {/* Background Effects */}
      <div className='fixed inset-0 z-0'>
        <div className='absolute inset-0 bg-gradient-to-br from-slate-900 via-red-900/20 to-slate-900'></div>
        <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse'></div>
        <div className='absolute bottom-1/4 right-1/4 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl animate-pulse delay-1000'></div>
        <div className='absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]'></div>
      </div>

      {/* Admin Sidebar */}
      <div
        className={`
        fixed top-0 left-0 h-full w-80 bg-gray-900/95 backdrop-blur-xl border-r border-gray-800/50 z-50 transform transition-transform duration-300 ease-in-out overflow-hidden flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}
      >
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-800/50 flex-shrink-0'>
          <div className='flex items-center space-x-3'>
            <div className='w-10 h-10 bg-gradient-to-r from-red-500 to-yellow-600 rounded-2xl flex items-center justify-center'>
              <Crown className='w-6 h-6 text-white' />
            </div>
            <div>
              <h1 className='text-white font-bold text-lg'>Admin Panel</h1>
              <p className='text-gray-400 text-xs'>v9.0 Advanced Features</p>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className='lg:hidden text-gray-400 hover:text-white transition-colors p-2'
          >
            ✕
          </button>
        </div>

        {/* User Info */}
        <div className='p-4 border-b border-gray-800/50 flex-shrink-0'>
          <div className='flex items-center space-x-3'>
            <div className='w-10 h-10 bg-gradient-to-r from-red-500 to-yellow-500 rounded-full flex items-center justify-center'>
              {getRoleIcon(userRole)}
            </div>
            <div className='flex-1 min-w-0'>
              <p className='text-white font-medium truncate'>
                {session?.user?.name || session?.user?.email}
              </p>
              <span className={`px-2 py-1 rounded-full text-xs border ${getRoleColor(userRole)}`}>
                {userRole}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className='flex-1 overflow-y-auto p-4 space-y-2'>
          {accessibleMenuItems.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <button
                key={item.id}
                onClick={() => {
                  router.push(item.href);
                  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                    setSidebarOpen(false);
                  }
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-red-500 to-yellow-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                title={item.description}
              >
                {item.icon}
                <span className='flex-1 text-left'>{item.label}</span>
                {item.badge && (
                  <span className='px-2 py-1 bg-red-500 text-white text-xs rounded-full'>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className='fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden'
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className='lg:ml-80 relative z-10'>
        {/* Top Header Bar */}
        <header className='bg-gray-900/50 backdrop-blur-sm border-b border-gray-800/50 sticky top-0 z-30'>
          <div className='flex items-center justify-between px-4 py-4'>
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className='lg:hidden text-gray-400 hover:text-white transition-colors p-2'
            >
              <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M4 6h16M4 12h16M4 18h16'
                />
              </svg>
            </button>

            {/* Page Title */}
            <div className='flex-1 lg:flex-none'>
              <h1 className='text-xl font-bold text-white'>Admin Panel</h1>
              <p className='text-gray-400 text-sm'>Role: {userRole}</p>
            </div>

            {/* Right Section - ENHANCED HEADER BUTTONS */}
            <div className='flex items-center space-x-3'>
              {/* Notifications Button */}
              <button
                onClick={handleNotificationClick}
                className='relative text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-xl'
                title='Quản lý thông báo'
              >
                <Bell className='w-6 h-6' />
                {unreadCount > 0 && (
                  <div className='absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center'>
                    <span className='text-xs font-bold text-white'>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  </div>
                )}
              </button>

              {/* Password Change Button */}
              <button
                onClick={() => setShowPasswordModal(true)}
                className='relative text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-xl'
                title='Đổi mật khẩu Admin'
              >
                <Key className='w-5 h-5' />
              </button>

              {/* Owner Access Indicator */}
              {userRole === 'OWNER' && (
                <div className='hidden sm:flex items-center space-x-2 bg-yellow-500/20 border border-yellow-500/30 px-3 py-2 rounded-xl'>
                  <Crown className='w-4 h-4 text-yellow-400' />
                  <span className='text-yellow-300 text-sm font-medium'>OWNER Access</span>
                </div>
              )}

              {/* Logout Button */}
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className='flex items-center space-x-2 bg-red-500/20 border border-red-500/30 text-red-300 hover:text-white hover:bg-red-500/30 px-3 py-2 rounded-xl transition-all duration-300'
                title='Đăng xuất'
              >
                <LogOut className='w-4 h-4' />
                <span className='hidden sm:inline text-sm font-medium'>Đăng xuất</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className='p-4 lg:p-8'>{children}</main>
      </div>

      {/* Admin Notification Modal */}
      <AdminNotificationModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
      />

      {/* Admin Password Change Modal */}
      <AdminPasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
    </div>
  );
}
