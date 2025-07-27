'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import {
  Menu,
  X,
  Bell,
  Plus,
  ChevronDown,
  Search,
  Home,
  MessageSquare,
  Settings,
  User,
  Bot,
  BarChart3,
  FileText,
  Zap,
  Calendar,
  Database,
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import NotificationModal from '@/components/notifications/NotificationModal';
import UpgradeButton from '@/components/dashboard/UpgradeButton';
import { VIEAgentLogo } from '@/components/ui/vieagent-logo';

interface MobileOptimizedLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  rightSection?: React.ReactNode;
  showSearch?: boolean;
  showBottomNav?: boolean;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  description: string;
  category: 'main' | 'tools' | 'settings';
  badge?: string;
  isNew?: boolean;
}

export default function MobileOptimizedLayout({
  children,
  title,
  description,
  rightSection,
  showSearch = true,
  showBottomNav = true,
}: MobileOptimizedLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Home className='w-5 h-5' />,
      href: '/dashboard',
      description: 'Overview & statistics',
      category: 'main',
    },
    {
      id: 'agents',
      label: 'AI Agents',
      icon: <Bot className='w-5 h-5' />,
      href: '/dashboard/agents',
      description: 'Manage AI agents',
      category: 'main',
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: <MessageSquare className='w-5 h-5' />,
      href: '/dashboard/chat',
      description: 'Talk to your agents',
      category: 'main',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className='w-5 h-5' />,
      href: '/dashboard/analytics',
      description: 'Usage & performance',
      category: 'tools',
    },
    {
      id: 'knowledge',
      label: 'Knowledge',
      icon: <FileText className='w-5 h-5' />,
      href: '/dashboard/knowledge',
      description: 'Document management',
      category: 'tools',
    },
    {
      id: 'google',
      label: 'Google',
      icon: <Calendar className='w-5 h-5' />,
      href: '/dashboard/google',
      description: 'Google integrations',
      category: 'tools',
      isNew: true,
    },
    {
      id: 'deployment',
      label: 'Deploy',
      icon: <Zap className='w-5 h-5' />,
      href: '/dashboard/deployment',
      description: 'Platform connectors',
      category: 'tools',
      isNew: true,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: <User className='w-5 h-5' />,
      href: '/dashboard/profile',
      description: 'Personal information',
      category: 'settings',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className='w-5 h-5' />,
      href: '/dashboard/settings',
      description: 'Preferences & config',
      category: 'settings',
    },
  ];

  const bottomNavItems = [
    { id: 'dashboard', label: 'Home', icon: <Home className='w-5 h-5' />, href: '/dashboard' },
    {
      id: 'chat',
      label: 'Chat',
      icon: <MessageSquare className='w-5 h-5' />,
      href: '/dashboard/chat',
    },
    { id: 'agents', label: 'Agents', icon: <Bot className='w-5 h-5' />, href: '/dashboard/agents' },
    {
      id: 'knowledge',
      label: 'Files',
      icon: <Database className='w-5 h-5' />,
      href: '/dashboard/knowledge',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className='w-5 h-5' />,
      href: '/dashboard/settings',
    },
  ];

  useEffect(() => {
    fetchNotificationCount();
    const interval = setInterval(fetchNotificationCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

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

  const handleNavigation = (href: string) => {
    router.push(href);
    setSidebarOpen(false);
    setSearchOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const filteredMenuItems = searchQuery
    ? menuItems.filter(
        item =>
          item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : menuItems;

  return (
    <div className='min-h-screen bg-black text-white'>
      {/* Background Effects */}
      <div className='fixed inset-0 z-0'>
        <div className='absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900'></div>
        <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse'></div>
        <div className='absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000'></div>
        <div className='absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]'></div>
      </div>

      {/* Mobile Header */}
      <header
        className={`
        fixed top-0 left-0 right-0 z-50 transition-all duration-300
        ${isScrolled ? 'bg-gray-900/95 backdrop-blur-xl border-b border-gray-800/50' : 'bg-gray-900/50 backdrop-blur-sm'}
      `}
      >
        <div className='flex items-center justify-between px-4 py-3'>
          {/* Left Section */}
          <div className='flex items-center space-x-3'>
            <button
              onClick={() => setSidebarOpen(true)}
              className='p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors lg:hidden'
            >
              <Menu className='w-5 h-5' />
            </button>

            <div className='flex items-center space-x-2'>
              <VIEAgentLogo size='small' className='w-8 h-8' />
              {title && (
                <div className='hidden sm:block'>
                  <h1 className='text-lg font-bold text-white truncate'>{title}</h1>
                  {description && <p className='text-gray-400 text-xs truncate'>{description}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Right Section */}
          <div className='flex items-center space-x-2'>
            {rightSection ? (
              rightSection
            ) : (
              <>
                {/* Search Button */}
                {showSearch && (
                  <button
                    onClick={() => setSearchOpen(true)}
                    className='p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors'
                  >
                    <Search className='w-5 h-5' />
                  </button>
                )}

                {/* Notifications */}
                <div className='relative'>
                  <button
                    onClick={() => setShowNotificationModal(true)}
                    className='p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors'
                  >
                    <Bell className='w-5 h-5' />
                  </button>
                  {unreadCount > 0 && (
                    <div className='absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center'>
                      <span className='text-xs font-bold text-white'>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    </div>
                  )}
                </div>

                {/* User Avatar */}
                <div className='w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center'>
                  <span className='text-white font-bold text-sm'>
                    {session?.user?.name?.[0] || session?.user?.email?.[0] || '?'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Search Overlay */}
      {searchOpen && (
        <div className='fixed inset-0 z-60 bg-black/80 backdrop-blur-sm'>
          <div className='p-4 pt-20'>
            <div className='bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-800/50'>
              <form onSubmit={handleSearch} className='p-4 border-b border-gray-800/50'>
                <div className='flex items-center space-x-3'>
                  <Search className='w-5 h-5 text-gray-400' />
                  <input
                    ref={searchInputRef}
                    type='text'
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder='Search features, pages, or content...'
                    className='flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none'
                  />
                  <button
                    type='button'
                    onClick={() => setSearchOpen(false)}
                    className='p-1 text-gray-400 hover:text-white'
                  >
                    <X className='w-5 h-5' />
                  </button>
                </div>
              </form>

              {/* Search Results */}
              <div className='max-h-96 overflow-y-auto'>
                {filteredMenuItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.href)}
                    className='w-full flex items-center space-x-3 p-4 hover:bg-white/5 transition-colors text-left'
                  >
                    <div className='w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center'>
                      {item.icon}
                    </div>
                    <div className='flex-1'>
                      <div className='font-medium text-white'>{item.label}</div>
                      <div className='text-sm text-gray-400'>{item.description}</div>
                    </div>
                    {item.isNew && (
                      <span className='px-2 py-1 bg-green-500 text-white text-xs rounded-full'>
                        New
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className='fixed inset-0 bg-black/50 backdrop-blur-sm z-40'
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`
        fixed top-0 left-0 h-full w-80 bg-gray-900/95 backdrop-blur-xl border-r border-gray-800/50 z-50 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      >
        {/* Sidebar Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-800/50'>
          <div className='flex items-center space-x-3'>
            <VIEAgentLogo size='small' />
            <div>
              <h1 className='text-white font-bold text-lg'>VIEAgent</h1>
              <p className='text-gray-400 text-xs'>Mobile Optimized</p>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className='text-gray-400 hover:text-white transition-colors p-2'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* User Info */}
        <div className='p-4 border-b border-gray-800/50'>
          <div className='flex items-center space-x-3'>
            <div className='w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center'>
              <span className='text-white font-bold'>
                {session?.user?.name?.[0] || session?.user?.email?.[0] || '?'}
              </span>
            </div>
            <div className='flex-1 min-w-0'>
              <p className='text-white font-medium text-sm truncate'>
                {session?.user?.name || 'User'}
              </p>
              <p className='text-gray-400 text-xs truncate'>{session?.user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className='flex-1 overflow-y-auto p-4'>
          <div className='space-y-6'>
            {/* Main Features */}
            <div>
              <h3 className='text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3'>
                Main Features
              </h3>
              <div className='space-y-2'>
                {menuItems
                  .filter(item => item.category === 'main')
                  .map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleNavigation(item.href)}
                      className={`w-full flex items-center space-x-3 p-3 rounded-xl font-medium transition-all ${
                        isActive(item.href)
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className='w-8 h-8 flex items-center justify-center'>{item.icon}</div>
                      <span className='flex-1 text-left'>{item.label}</span>
                      {item.isNew && (
                        <span className='px-2 py-1 bg-green-500 text-white text-xs rounded-full'>
                          New
                        </span>
                      )}
                    </button>
                  ))}
              </div>
            </div>

            {/* Tools */}
            <div>
              <h3 className='text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3'>
                Tools & Data
              </h3>
              <div className='space-y-2'>
                {menuItems
                  .filter(item => item.category === 'tools')
                  .map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleNavigation(item.href)}
                      className={`w-full flex items-center space-x-3 p-3 rounded-xl font-medium transition-all ${
                        isActive(item.href)
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className='w-8 h-8 flex items-center justify-center'>{item.icon}</div>
                      <span className='flex-1 text-left'>{item.label}</span>
                      {item.isNew && (
                        <span className='px-2 py-1 bg-green-500 text-white text-xs rounded-full'>
                          New
                        </span>
                      )}
                    </button>
                  ))}
              </div>
            </div>

            {/* Settings */}
            <div>
              <h3 className='text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3'>
                Settings
              </h3>
              <div className='space-y-2'>
                {menuItems
                  .filter(item => item.category === 'settings')
                  .map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleNavigation(item.href)}
                      className={`w-full flex items-center space-x-3 p-3 rounded-xl font-medium transition-all ${
                        isActive(item.href)
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className='w-8 h-8 flex items-center justify-center'>{item.icon}</div>
                      <span className='flex-1 text-left'>{item.label}</span>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </nav>

        {/* Upgrade Section */}
        <div className='p-4 border-t border-gray-800/50'>
          <UpgradeButton variant='sidebar' />
        </div>
      </div>

      {/* Main Content */}
      <main
        className={`
        pt-16 transition-all duration-300
        ${showBottomNav ? 'pb-20' : 'pb-4'}
      `}
      >
        <div className='p-4 sm:p-6 lg:p-8'>{children}</div>
      </main>

      {/* Bottom Navigation */}
      {showBottomNav && (
        <div className='fixed bottom-0 left-0 right-0 z-40 bg-gray-900/95 backdrop-blur-xl border-t border-gray-800/50'>
          <div className='flex items-center justify-around py-2'>
            {bottomNavItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.href)}
                className={`flex flex-col items-center space-y-1 p-2 rounded-xl transition-all ${
                  isActive(item.href)
                    ? 'text-blue-400 bg-blue-500/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className='w-6 h-6 flex items-center justify-center'>{item.icon}</div>
                <span className='text-xs font-medium'>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Notification Modal */}
      <NotificationModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        userId={session?.user?.id}
      />
    </div>
  );
}
