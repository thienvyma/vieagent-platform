'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { User } from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

interface UserStats {
  usage: {
    percentage: number;
    plan: string;
  };
}

interface DashboardHeaderProps {
  stats?: UserStats | null;
  customRightSection?: React.ReactNode;
}

export default function DashboardHeader({ stats, customRightSection }: DashboardHeaderProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { t } = useTranslation();

  const getPlanBadge = (plan: string) => {
    const badges = {
      TRIAL: {
        bg: 'bg-gray-500/20',
        border: 'border-gray-500/30',
        text: 'text-gray-300',
        emoji: '🎯',
      },
      BASIC: {
        bg: 'bg-blue-500/20',
        border: 'border-blue-500/30',
        text: 'text-blue-300',
        emoji: '💡',
      },
      PRO: {
        bg: 'bg-purple-500/20',
        border: 'border-purple-500/30',
        text: 'text-purple-300',
        emoji: '🚀',
      },
      ENTERPRISE: {
        bg: 'bg-orange-500/20',
        border: 'border-orange-500/30',
        text: 'text-orange-300',
        emoji: '🏢',
      },
      ULTIMATE: {
        bg: 'bg-yellow-500/20',
        border: 'border-yellow-500/30',
        text: 'text-yellow-300',
        emoji: '👑',
      },
    };
    const badge = badges[plan as keyof typeof badges] || badges.TRIAL;
    return badge;
  };

  // If custom right section is provided, use it
  if (customRightSection) {
    return customRightSection;
  }

  // Default header for dashboard pages
  if (!stats || !session) {
    return (
      <div className='flex items-center space-x-2 sm:space-x-3 lg:space-x-4'>
        {/* Language Switcher */}
        <LanguageSwitcher />
        
        {/* User Avatar Only */}
        <div className='flex items-center space-x-2 bg-gray-800/50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl'>
          <div className='w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center'>
            <User className='w-3 h-3 sm:w-4 sm:h-4 text-white' />
          </div>
          <span className='text-xs sm:text-sm text-white font-medium hidden lg:inline truncate max-w-[120px]'>
            {session?.user?.name || session?.user?.email?.split('@')[0] || 'User'}
          </span>
        </div>
      </div>
    );
  }

  const planBadge = getPlanBadge(stats?.usage?.plan || 'TRIAL');

  return (
    <div className='flex items-center space-x-2 sm:space-x-3 lg:space-x-4'>
      {/* Language Switcher */}
      <LanguageSwitcher />
      
      {/* User Plan Badge */}
      <div
        className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border ${planBadge.bg} ${planBadge.border} ${planBadge.text} hidden sm:flex items-center space-x-1 sm:space-x-2`}
      >
        <span className='text-sm sm:text-base'>{planBadge.emoji}</span>
        <span className='font-semibold text-xs sm:text-sm'>{stats?.usage?.plan || 'TRIAL'}</span>
      </div>

      {/* Update Plans Button */}
      <button
        onClick={() => router.push('/dashboard/upgrade')}
        className='hidden md:flex items-center space-x-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 hover:border-purple-400/50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl transition-all duration-300 hover:from-purple-500/30 hover:to-pink-500/30'
        title={t('settings.billing')}
      >
        <span className='text-purple-400 text-sm sm:text-base'>💎</span>
        <span className='text-xs sm:text-sm text-purple-300 font-medium'>Update Plans</span>
      </button>

      {/* User Avatar */}
      <div className='flex items-center space-x-2 bg-gray-800/50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl'>
        <div className='w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center'>
          <User className='w-3 h-3 sm:w-4 sm:h-4 text-white' />
        </div>
        <span className='text-xs sm:text-sm text-white font-medium hidden lg:inline truncate max-w-[120px]'>
          {session?.user?.name || session?.user?.email?.split('@')[0] || 'User'}
        </span>
      </div>
    </div>
  );
}
