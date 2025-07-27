// ✅ Phase 5 lazy load - Email Stats Widget Component
'use client';

import { BarChart3, TrendingUp, Mail, Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface GmailStats {
  unreadCount: number;
  importantCount: number;
  todayCount: number;
  totalProcessed: number;
}

interface EmailStatsWidgetProps {
  stats: GmailStats;
  loading?: boolean;
}

export default function EmailStatsWidget({ stats, loading }: EmailStatsWidgetProps) {
  if (loading) {
    return (
      <div className='bg-gray-800 rounded-lg p-6 space-y-4'>
        <div className='flex items-center space-x-2'>
          <BarChart3 className='w-5 h-5 text-blue-400 animate-spin' />
          <span className='text-white font-medium'>Loading stats...</span>
        </div>
        <div className='grid grid-cols-2 gap-4'>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className='space-y-2'>
              <div className='h-4 bg-gray-700 rounded animate-pulse'></div>
              <div className='h-8 bg-gray-700 rounded animate-pulse'></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Unread Emails',
      value: stats.unreadCount,
      icon: Mail,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/20',
    },
    {
      label: 'Important',
      value: stats.importantCount,
      icon: AlertCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-400/20',
    },
    {
      label: 'Today',
      value: stats.todayCount,
      icon: Clock,
      color: 'text-green-400',
      bgColor: 'bg-green-400/20',
    },
    {
      label: 'Total Processed',
      value: stats.totalProcessed,
      icon: CheckCircle,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/20',
    },
  ];

  return (
    <div className='bg-gray-800 rounded-lg p-6 space-y-6'>
      <div className='flex items-center space-x-2'>
        <BarChart3 className='w-5 h-5 text-blue-400' />
        <h3 className='text-white font-semibold'>Email Statistics</h3>
      </div>

      <div className='grid grid-cols-2 gap-4'>
        {statCards.map((stat, index) => (
          <div key={index} className='space-y-2'>
            <div className='flex items-center space-x-2'>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <span className='text-gray-400 text-sm'>{stat.label}</span>
            </div>
            <div className='text-2xl font-bold text-white'>{stat.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Quick insights */}
      <div className='border-t border-gray-700 pt-4'>
        <div className='flex items-center space-x-2 mb-2'>
          <TrendingUp className='w-4 h-4 text-green-400' />
          <span className='text-gray-400 text-sm'>Quick Insights</span>
        </div>
        <div className='space-y-1 text-sm'>
          <div className='text-gray-300'>
            •{' '}
            {stats.unreadCount > 0
              ? `${stats.unreadCount} emails need attention`
              : 'Inbox is clean!'}
          </div>
          <div className='text-gray-300'>
            •{' '}
            {stats.importantCount > 0
              ? `${stats.importantCount} important emails`
              : 'No urgent emails'}
          </div>
          <div className='text-gray-300'>• {stats.todayCount} emails received today</div>
        </div>
      </div>
    </div>
  );
}
