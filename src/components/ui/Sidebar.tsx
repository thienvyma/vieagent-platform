'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useTranslation } from '@/contexts/TranslationContext';
import { VIEAgentLogo } from '@/components/ui/vieagent-logo';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface MenuItem {
  id: string;
  labelKey: string; // Translation key instead of hardcoded label
  icon: string;
  href: string;
  descriptionKey: string; // Translation key instead of hardcoded description
  category: 'main' | 'tools' | 'settings';
  badge?: string;
  isNew?: boolean;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t } = useTranslation();

  const menuItems: MenuItem[] = [
    // Main Features
    {
      id: 'dashboard',
      labelKey: 'navigation.dashboard',
      icon: '🏠',
      href: '/dashboard',
      descriptionKey: 'navigation.dashboard',
      category: 'main',
    },
    {
      id: 'agents',
      labelKey: 'navigation.agents',
      icon: 'AI',
      href: '/dashboard/agents',
      descriptionKey: 'agent.configuration',
      category: 'main',
    },
    {
      id: 'chat',
      labelKey: 'navigation.chat',
      icon: '💬',
      href: '/dashboard/chat',
      descriptionKey: 'chat.messageHistory',
      category: 'main',
    },
    {
      id: 'google',
      labelKey: 'Google Integrations',
      icon: '🔗',
      href: '/dashboard/google',
      descriptionKey: 'Calendar, Gmail & Sheets',
      category: 'main',
      isNew: true,
    },
    {
      id: 'deployment',
      labelKey: 'navigation.deployment',
      icon: '🚀',
      href: '/dashboard/deployment',
      descriptionKey: 'Platform connectors & export',
      category: 'main',
      isNew: true,
    },

    // Tools & Data
    {
      id: 'analytics',
      labelKey: 'navigation.analytics',
      icon: '📊',
      href: '/dashboard/analytics',
      descriptionKey: 'Usage & performance',
      category: 'tools',
    },
    {
      id: 'knowledge',
      labelKey: 'navigation.knowledge',
      icon: '📚',
      href: '/dashboard/knowledge',
      descriptionKey: 'Unified data & document management',
      category: 'tools',
      isNew: true,
    },
    {
      id: 'handover',
      labelKey: 'Handover System',
      icon: '🔄',
      href: '/dashboard/handover',
      descriptionKey: 'AI to human handover',
      category: 'tools',
    },

    // Settings & Account
    {
      id: 'api-keys',
      labelKey: 'settings.apiKeys',
      icon: '🔑',
      href: '/dashboard/api-keys',
      descriptionKey: 'Manage AI model keys',
      category: 'settings',
    },
    {
      id: 'profile',
      labelKey: 'settings.profile',
      icon: '👤',
      href: '/dashboard/profile',
      descriptionKey: 'Personal information',
      category: 'settings',
    },
    {
      id: 'settings',
      labelKey: 'navigation.settings',
      icon: '⚙️',
      href: '/dashboard/settings',
      descriptionKey: 'Preferences & config',
      category: 'settings',
    },
  ];

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  const handleNavigation = (href: string) => {
    router.push(href);
    // Close sidebar on mobile after navigation
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onToggle();
    }
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const getCategoryItems = (category: string) => {
    return menuItems.filter(item => item.category === category);
  };

  // Helper function to get translated text with fallback
  const getTranslatedText = (key: string, fallback?: string) => {
    const translated = t(key);
    return translated === key ? (fallback || key) : translated;
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className='fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden'
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed top-0 left-0 h-full w-80 bg-gray-900/95 backdrop-blur-xl border-r border-gray-800/50 z-40 transform transition-transform duration-300 ease-in-out overflow-hidden flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}
      >
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-800/50 flex-shrink-0'>
          <div className='flex items-center space-x-3'>
            <VIEAgentLogo size='small' />
            <div>
              <h1 className='text-white font-bold text-lg'>VIEAgent</h1>
              <p className='text-gray-400 text-xs'>v6.1 Enhanced</p>
            </div>
          </div>

          <button
            onClick={onToggle}
            className='lg:hidden text-gray-400 hover:text-white transition-colors p-2'
          >
            ✕
          </button>
        </div>

        {/* User Info */}
        <div className='p-4 border-b border-gray-800/50 flex-shrink-0'>
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

        {/* Navigation - Scrollable */}
        <div className='flex-1 overflow-y-auto overflow-x-hidden py-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800'>
          {/* Main Features */}
          <div className='px-4 mb-6'>
            <h3 className='text-gray-400 text-xs uppercase font-semibold mb-3 px-2'>
              Main Features
            </h3>
            <div className='space-y-1'>
              {getCategoryItems('main').map(item => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.href)}
                  className={`
                    w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-left transition-all duration-200 group
                    ${
                      isActive(item.href)
                        ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-white shadow-lg'
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  <span className='text-xl flex-shrink-0'>{item.icon}</span>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center space-x-2'>
                      <p className='font-medium truncate'>
                        {getTranslatedText(item.labelKey, item.labelKey)}
                      </p>
                      {item.isNew && (
                        <span className='bg-green-500 text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0'>
                          NEW
                        </span>
                      )}
                    </div>
                    <p className='text-xs text-gray-400 truncate'>
                      {getTranslatedText(item.descriptionKey, item.descriptionKey)}
                    </p>
                  </div>
                  {isActive(item.href) && (
                    <div className='w-2 h-2 bg-blue-500 rounded-full flex-shrink-0'></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tools & Data */}
          <div className='px-4 mb-6'>
            <h3 className='text-gray-400 text-xs uppercase font-semibold mb-3 px-2'>
              Tools & Data
            </h3>
            <div className='space-y-1'>
              {getCategoryItems('tools').map(item => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.href)}
                  className={`
                    w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-left transition-all duration-200
                    ${
                      isActive(item.href)
                        ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  <span className='text-xl flex-shrink-0'>{item.icon}</span>
                  <div className='flex-1 min-w-0'>
                    <p className='font-medium truncate'>
                      {getTranslatedText(item.labelKey, item.labelKey)}
                    </p>
                    <p className='text-xs text-gray-400 truncate'>
                      {getTranslatedText(item.descriptionKey, item.descriptionKey)}
                    </p>
                  </div>
                  {isActive(item.href) && (
                    <div className='w-2 h-2 bg-purple-500 rounded-full flex-shrink-0'></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Settings & Account */}
          <div className='px-4 mb-6'>
            <h3 className='text-gray-400 text-xs uppercase font-semibold mb-3 px-2'>
              Settings & Account
            </h3>
            <div className='space-y-1'>
              {getCategoryItems('settings').map(item => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.href)}
                  className={`
                    w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-left transition-all duration-200
                    ${
                      isActive(item.href)
                        ? 'bg-gradient-to-r from-gray-500/20 to-slate-500/20 border border-gray-500/30 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  <span className='text-xl flex-shrink-0'>{item.icon}</span>
                  <div className='flex-1 min-w-0'>
                    <p className='font-medium truncate'>
                      {getTranslatedText(item.labelKey, item.labelKey)}
                    </p>
                    <p className='text-xs text-gray-400 truncate'>
                      {getTranslatedText(item.descriptionKey, item.descriptionKey)}
                    </p>
                  </div>
                  {isActive(item.href) && (
                    <div className='w-2 h-2 bg-gray-500 rounded-full flex-shrink-0'></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Extra padding for scroll */}
          <div className='h-4'></div>
        </div>

        {/* Footer - Fixed at bottom */}
        <div className='p-4 border-t border-gray-800/50 flex-shrink-0'>
          <button
            onClick={handleSignOut}
            className='w-full flex items-center space-x-3 px-3 py-3 text-gray-300 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200'
          >
            <span className='text-xl'>🚪</span>
            <span className='font-medium'>{t('auth.logout')}</span>
          </button>

          <div className='mt-3 px-3'>
            <p className='text-gray-500 text-xs text-center'>© 2024 VIEAgent</p>
          </div>
        </div>
      </div>
    </>
  );
}
