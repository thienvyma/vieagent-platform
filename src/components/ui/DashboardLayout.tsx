'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Package, Bell, Menu, Plus } from 'lucide-react';
import Sidebar from './Sidebar';
import NotificationModal from '@/components/notifications/NotificationModal';
import UpgradeButton from '@/components/dashboard/UpgradeButton';
import ErrorBoundary from './ErrorBoundary';
// ✅ PHASE 4B - Import standardized UI components
import Button, { IconButton } from './Button';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  rightSection?: React.ReactNode;
}

export default function DashboardLayout({
  children,
  title,
  description,
  rightSection,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { data: session } = useSession();

  useEffect(() => {
    // Fetch notification count
    fetchNotificationCount();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotificationCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotificationCount = async () => {
    try {
      const response = await fetch('/api/user/notifications?limit=1');
      const data = await response.json();
      if (data.success) {
        setUnreadCount(data.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleNotificationClick = () => {
    setShowNotificationModal(true);
    // Reset unread count when modal opens
    setUnreadCount(0);
  };

  return (
    <ErrorBoundary
      context='Dashboard Layout'
      onError={(error, errorInfo) => {
        console.error('Dashboard layout error:', error, errorInfo);
        // You can send to error tracking service here
      }}
    >
      <div className='min-h-screen bg-black text-white'>
        {/* Background Effects */}
        <div className='fixed inset-0 z-0'>
          <div className='absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900'></div>
          <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse'></div>
          <div className='absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000'></div>
          <div className='absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]'></div>
        </div>

        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

        {/* Main Content */}
        <div className='lg:ml-80 relative z-10'>
          {/* Top Header Bar */}
          <header className='bg-gray-900/50 backdrop-blur-sm border-b border-gray-800/50 sticky top-0 z-50'>
            <div className='flex items-center justify-between px-3 sm:px-4 py-3 sm:py-4'>
              {/* ✅ PHASE 4B - Use standardized IconButton component */}
              <IconButton
                onClick={toggleSidebar}
                icon={<Menu className='w-5 h-5' />}
                variant='ghost'
                size='md'
                className='lg:hidden'
                tooltip='Toggle Menu'
              />

              {/* Page Title */}
              <div className='flex-1 lg:flex-none min-w-0 mx-2 sm:mx-4'>
                {title && (
                  <div className='text-center lg:text-left'>
                    <h1 className='text-lg sm:text-xl font-bold text-white truncate'>{title}</h1>
                    {description && (
                      <p className='text-gray-400 text-xs sm:text-sm truncate hidden sm:block'>
                        {description}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Right Section (Custom Actions) or Default Actions */}
              <div className='flex items-center space-x-1 sm:space-x-2 lg:space-x-3'>
                {rightSection ? (
                  rightSection
                ) : (
                  <>
                    {/* Upgrade Button */}
                    <UpgradeButton variant='header' />

                    {/* ✅ PHASE 4B - Use standardized IconButton with notification badge */}
                    <div className='relative'>
                      <IconButton
                        onClick={handleNotificationClick}
                        icon={<Bell className='w-5 h-5' />}
                        variant='ghost'
                        size='md'
                        tooltip='Xem thông báo'
                      />
                      {unreadCount > 0 && (
                        <div className='absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center'>
                          <span className='text-xs font-bold text-white'>
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* ✅ PHASE 4B - Use standardized Button component */}
                    <Button
                      variant='primary'
                      size='sm'
                      icon={<Plus className='w-4 h-4' />}
                      className='text-xs sm:text-sm font-medium'
                    >
                      <span className='hidden md:inline'>Quick Create</span>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Page Content - wrapped in additional error boundary for page content */}
          <main className='p-3 sm:p-4 lg:p-6 xl:p-8 min-h-[calc(100vh-120px)] relative z-20'>
            <ErrorBoundary
              context='Dashboard Page Content'
              onError={(error, errorInfo) => {
                console.error('Dashboard page content error:', error, errorInfo);
              }}
            >
              {children}
            </ErrorBoundary>
          </main>
        </div>

        {/* Notification Modal */}
        <NotificationModal
          isOpen={showNotificationModal}
          onClose={() => setShowNotificationModal(false)}
          userId={session?.user?.id}
        />
      </div>
    </ErrorBoundary>
  );
}
