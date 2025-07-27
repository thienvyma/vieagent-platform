'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/ui/DashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import CalendarDashboard from '@/components/calendar/CalendarDashboard';
import GmailDashboard from '@/components/gmail/GmailDashboard';
import SheetsDashboard from '@/components/sheets/SheetsDashboard';
import PromptTemplateManager from '@/components/google/PromptTemplateManager';

interface UserStats {
  usage: {
    percentage: number;
    plan: string;
  };
}

interface GoogleAccount {
  id: string;
  googleId: string;
  email: string;
  name?: string;
  picture?: string;
  scopes: string[];
  lastSync: string;
  createdAt: string;
}

interface GoogleService {
  name: string;
  icon: string;
  description: string;
  scope: string;
  available: boolean;
}

type TabType =
  | 'overview'
  | 'calendar'
  | 'gmail'
  | 'sheets'
  | 'drive'
  | 'docs'
  | 'forms'
  | 'analytics'
  | 'templates';

// Component con chứa logic useSearchParams
function GoogleIntegrationsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [accounts, setAccounts] = useState<GoogleAccount[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Google services available
  const googleServices: GoogleService[] = [
    {
      name: 'Calendar',
      icon: '📅',
      description: 'Manage events, schedule meetings, detect conflicts',
      scope: 'https://www.googleapis.com/auth/calendar',
      available: true,
    },
    {
      name: 'Gmail',
      icon: '📧',
      description: 'Read emails, send automated responses',
      scope: 'https://www.googleapis.com/auth/gmail.readonly',
      available: true,
    },
    {
      name: 'Sheets',
      icon: '📊',
      description: 'Create spreadsheets, manage data, generate reports',
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      available: true,
    },
    {
      name: 'Drive',
      icon: '📁',
      description: 'File management, AI categorization, smart organization',
      scope: 'https://www.googleapis.com/auth/drive',
      available: true,
    },
    {
      name: 'Docs',
      icon: '📝',
      description: 'Document automation, template generation, content analysis',
      scope: 'https://www.googleapis.com/auth/documents',
      available: true,
    },
    {
      name: 'Forms',
      icon: '📋',
      description: 'Form creation, response analysis, data automation',
      scope: 'https://www.googleapis.com/auth/forms',
      available: true,
    },
  ];

  // Phase information for tabs
  const phases = {
    calendar: { number: '6.2', status: 'completed' as const, title: 'Calendar Integration' },
    gmail: { number: '6.3', status: 'completed' as const, title: 'Gmail Integration' },
    sheets: { number: '6.4', status: 'completed' as const, title: 'Sheets Integration' },
    drive: { number: '6.5a', status: 'upcoming' as const, title: 'Drive Management' },
    docs: { number: '6.5b', status: 'upcoming' as const, title: 'Docs Automation' },
    forms: { number: '6.5c', status: 'upcoming' as const, title: 'Forms Integration' },
    analytics: { number: '6.5d', status: 'upcoming' as const, title: 'AI Analytics' },
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      loadGoogleAccounts();
      handleCallbackMessages();
    }
  }, [status, router]);

  // Monitor accounts state changes
  useEffect(() => {
    console.log('🔄 Accounts state changed:', accounts.length, 'accounts');
    if (accounts.length > 0) {
      console.log(
        '📋 Current accounts:',
        accounts.map(acc => ({ email: acc.email, name: acc.name }))
      );
    }
  }, [accounts]);

  const handleCallbackMessages = () => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const connected = searchParams.get('connected');

    console.log('🔍 Checking callback parameters:', { success, error, connected });

    if (success === 'connected' || connected === 'true') {
      console.log('🎉 Google connection successful!');

      // Clean URL first
      router.replace('/dashboard/google');

      // Force reload accounts after a short delay to ensure URL is clean
      setTimeout(() => {
        console.log('🔄 Reloading Google accounts after successful connection...');
        loadGoogleAccounts();
        alert('🎉 Kết nối Google thành công! Bạn có thể sử dụng các tích hợp Google.');
      }, 500);
    } else if (error) {
      let errorMessage = 'Không thể kết nối tài khoản Google';

      switch (error) {
        case 'oauth_error':
        case 'auth_failed':
          errorMessage = 'Xác thực OAuth bị từ chối hoặc thất bại';
          break;
        case 'missing_params':
          errorMessage = 'Thiếu tham số bắt buộc từ Google';
          break;
        case 'invalid_user':
          errorMessage = 'Phiên đăng nhập không hợp lệ';
          break;
        case 'token_exchange_failed':
          errorMessage = 'Không thể trao đổi mã xác thực';
          break;
        case 'internal_error':
          errorMessage = 'Lỗi server nội bộ';
          break;
        case 'access_denied':
          errorMessage = 'Bạn đã từ chối quyền truy cập Google services';
          break;
      }

      console.error(`❌ Google Auth Error: ${error} - ${errorMessage}`);
      alert(`❌ ${errorMessage}`);
      router.replace('/dashboard/google');
    }
  };

  const loadGoogleAccounts = async () => {
    try {
      console.log('📡 Loading Google accounts...');
      setLoading(true);

      const response = await fetch('/api/google/accounts');
      console.log('📡 API Response status:', response.status);

      if (response.ok) {
        const accountsData = await response.json();
        console.log('📡 Accounts data received:', accountsData);
        console.log('📡 Number of accounts:', accountsData.length);

        setAccounts(accountsData);

        if (accountsData.length > 0) {
          console.log('✅ Google accounts loaded successfully:', accountsData.length, 'accounts');
        } else {
          console.log('ℹ️  No Google accounts found');
        }
      } else {
        const errorData = await response.text();
        console.error('❌ Failed to load Google accounts:', response.status, errorData);
      }
    } catch (error) {
      console.error('❌ Error loading Google accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  // TODO @final-check: Monitor OAuth success rates in production
  // - Track token refresh failures
  // - Monitor API quota usage across all Google services
  // - Set up alerts for OAuth errors > 5%
  const handleConnectGoogle = async () => {
    try {
      setConnecting(true);

      console.log('🔗 Initiating Google OAuth connection...');
      const response = await fetch('/api/auth/google/connect');
      const data = await response.json();

      if (response.ok && data.authUrl) {
        console.log('✅ Authorization URL generated, redirecting...');
        console.log('🌐 Redirect URL:', data.authUrl);
        window.location.href = data.authUrl;
      } else {
        console.error('❌ Failed to get authorization URL:', data);
        alert('Không thể kết nối với Google. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('❌ Error connecting to Google:', error);
      alert('Lỗi kết nối Google. Vui lòng kiểm tra kết nối mạng và thử lại.');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to disconnect this Google account?')) {
      return;
    }

    try {
      const response = await fetch('/api/google/accounts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      });

      if (response.ok) {
        await loadGoogleAccounts();
        alert('Google account disconnected successfully');
      } else {
        alert('Failed to disconnect Google account');
      }
    } catch (error) {
      console.error('Error disconnecting Google account:', error);
      alert('Error disconnecting Google account');
    }
  };

  const getAvailableServices = (account: GoogleAccount): GoogleService[] => {
    return googleServices.filter(service => account.scopes.includes(service.scope));
  };

  const getPhaseStatusColor = (status: 'completed' | 'current' | 'upcoming') => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'current':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'upcoming':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPhaseStatusIcon = (status: 'completed' | 'current' | 'upcoming') => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'current':
        return '🚧';
      case 'upcoming':
        return '⏳';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout title='Google Integrations' description='Đang tải Google services...'>
        <div className='flex items-center justify-center min-h-[400px]'>
          <div className='text-center'>
            <div className='w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
            <p className='text-white'>Loading Google integrations...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Tab Navigation Component
  const TabNavigation = () => (
    <div className='bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl p-2 sm:p-3 border border-white/10 mb-6 sm:mb-8'>
      <div className='flex space-x-1 sm:space-x-2 overflow-x-auto scrollbar-hide pb-1'>
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all text-sm sm:text-base ${
            activeTab === 'overview'
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className='flex items-center justify-center space-x-1 sm:space-x-2'>
            <span className='text-sm sm:text-base'>🏠</span>
            <span className='hidden sm:inline'>Overview</span>
            <span className='sm:hidden'>Home</span>
          </span>
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all text-sm sm:text-base ${
            activeTab === 'calendar'
              ? 'bg-gradient-to-r from-green-500 to-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className='flex items-center justify-center space-x-1 sm:space-x-2'>
            <span className='text-sm sm:text-base'>📅</span>
            <span className='hidden sm:inline'>Calendar</span>
            <span className='sm:hidden'>Cal</span>
            <span
              className={`px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs border hidden lg:inline ${getPhaseStatusColor(phases.calendar.status)}`}
            >
              {getPhaseStatusIcon(phases.calendar.status)} {phases.calendar.number}
            </span>
          </span>
        </button>

        <button
          onClick={() => setActiveTab('gmail')}
          className={`flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all text-sm sm:text-base ${
            activeTab === 'gmail'
              ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className='flex items-center justify-center space-x-1 sm:space-x-2'>
            <span className='text-sm sm:text-base'>📧</span>
            <span className='hidden sm:inline'>Gmail</span>
            <span className='sm:hidden'>Mail</span>
            <span
              className={`px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs border hidden lg:inline ${getPhaseStatusColor(phases.gmail.status)}`}
            >
              {getPhaseStatusIcon(phases.gmail.status)} {phases.gmail.number}
            </span>
          </span>
        </button>

        <button
          onClick={() => setActiveTab('sheets')}
          className={`flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all text-sm sm:text-base ${
            activeTab === 'sheets'
              ? 'bg-gradient-to-r from-yellow-500 to-red-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className='flex items-center justify-center space-x-1 sm:space-x-2'>
            <span className='text-sm sm:text-base'>📊</span>
            <span className='hidden sm:inline'>Sheets</span>
            <span className='sm:hidden'>Data</span>
            <span
              className={`px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs border hidden lg:inline ${getPhaseStatusColor(phases.sheets.status)}`}
            >
              {getPhaseStatusIcon(phases.sheets.status)} {phases.sheets.number}
            </span>
          </span>
        </button>

        <button
          onClick={() => setActiveTab('drive')}
          className={`flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all text-sm sm:text-base ${
            activeTab === 'drive'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className='flex items-center justify-center space-x-1 sm:space-x-2'>
            <span className='text-sm sm:text-base'>📁</span>
            <span className='hidden sm:inline'>Drive</span>
            <span className='sm:hidden'>Files</span>
            <span
              className={`px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs border hidden lg:inline ${getPhaseStatusColor(phases.drive.status)}`}
            >
              {getPhaseStatusIcon(phases.drive.status)} {phases.drive.number}
            </span>
          </span>
        </button>

        <button
          onClick={() => setActiveTab('docs')}
          className={`flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all text-sm sm:text-base ${
            activeTab === 'docs'
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className='flex items-center justify-center space-x-1 sm:space-x-2'>
            <span className='text-sm sm:text-base'>📝</span>
            <span className='hidden sm:inline'>Docs</span>
            <span className='sm:hidden'>Doc</span>
            <span
              className={`px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs border hidden lg:inline ${getPhaseStatusColor(phases.docs.status)}`}
            >
              {getPhaseStatusIcon(phases.docs.status)} {phases.docs.number}
            </span>
          </span>
        </button>

        <button
          onClick={() => setActiveTab('forms')}
          className={`flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all text-sm sm:text-base ${
            activeTab === 'forms'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className='flex items-center justify-center space-x-1 sm:space-x-2'>
            <span className='text-sm sm:text-base'>📋</span>
            <span className='hidden sm:inline'>Forms</span>
            <span className='sm:hidden'>Form</span>
            <span
              className={`px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs border hidden lg:inline ${getPhaseStatusColor(phases.forms.status)}`}
            >
              {getPhaseStatusIcon(phases.forms.status)} {phases.forms.number}
            </span>
          </span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all text-sm sm:text-base ${
            activeTab === 'analytics'
              ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className='flex items-center justify-center space-x-1 sm:space-x-2'>
            <span className='text-sm sm:text-base'>AI</span>
            <span className='hidden sm:inline'>Analytics</span>
            <span className='sm:hidden'>AI</span>
            <span
              className={`px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs border hidden lg:inline ${getPhaseStatusColor(phases.analytics.status)}`}
            >
              {getPhaseStatusIcon(phases.analytics.status)} {phases.analytics.number}
            </span>
          </span>
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all text-sm sm:text-base ${
            activeTab === 'templates'
              ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className='flex items-center justify-center space-x-1 sm:space-x-2'>
            <span className='text-sm sm:text-base'>🎯</span>
            <span className='hidden sm:inline'>Templates</span>
            <span className='sm:hidden'>Tmpl</span>
          </span>
        </button>
      </div>
    </div>
  );

  // Overview Tab Content
  const OverviewContent = () => (
    <>
      {/* Connection Status */}
      {accounts.length > 0 ? (
        <div className='bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 border border-green-500/20 mb-6 sm:mb-8'>
          <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0'>
            <div className='flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1'>
              <div className='w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0'>
                <span className='text-lg sm:text-2xl'>✅</span>
              </div>
              <div className='min-w-0'>
                <h3 className='text-green-300 font-bold text-base sm:text-lg truncate'>
                  {accounts.length} Google Account{accounts.length > 1 ? 's' : ''} Connected
                </h3>
                <p className='text-green-200 text-xs sm:text-sm'>
                  Your AI agents can now access all Google services
                </p>
              </div>
            </div>
            <button
              onClick={handleConnectGoogle}
              disabled={connecting}
              className='bg-gradient-to-r from-red-500 to-yellow-600 text-white px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl hover:from-red-600 hover:to-yellow-700 transition-all duration-300 text-xs sm:text-sm font-medium disabled:opacity-50 flex-shrink-0'
            >
              {connecting ? 'Connecting...' : 'Connect Another'}
            </button>
          </div>
        </div>
      ) : (
        <div className='bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl sm:rounded-2xl lg:rounded-3xl p-6 sm:p-8 border border-blue-500/20 mb-6 sm:mb-8 text-center'>
          <div className='w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6'>
            <span className='text-2xl sm:text-4xl'>🔗</span>
          </div>
          <h3 className='text-blue-300 font-bold text-lg sm:text-xl mb-3 sm:mb-4'>
            Kết nối tài khoản Google
          </h3>
          <p className='text-blue-200 mb-4 sm:mb-6 max-w-md mx-auto text-sm sm:text-base'>
            Kết nối tài khoản Google để kích hoạt tích hợp AI với Calendar, Gmail, Sheets và nhiều
            dịch vụ khác.
          </p>

          {/* Debug Info */}
          <div className='bg-gray-900/50 rounded-lg p-3 mb-4 text-left text-xs'>
            <div className='text-gray-400 mb-2'>🔧 OAuth Configuration Status:</div>
            <div className='space-y-1'>
              <div className='text-green-400'>✅ Client ID: Configured</div>
              <div className='text-green-400'>
                ✅ Redirect URI: http://localhost:3000/api/auth/google/callback
              </div>
              <div className='text-blue-400'>
                ℹ️ Scopes: Calendar, Gmail, Drive, Sheets, Docs, Forms
              </div>
            </div>
          </div>

          <button
            onClick={handleConnectGoogle}
            disabled={connecting}
            className='bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 font-medium disabled:opacity-50 text-sm sm:text-base relative z-10'
          >
            {connecting ? 'Đang kết nối...' : 'Kết nối tài khoản Google'}
          </button>

          <div className='mt-4 text-xs text-gray-400'>
            💡 Sau khi nhấn nút, bạn sẽ được chuyển đến Google để xác thực
          </div>
        </div>
      )}

      {/* Connected Accounts */}
      {accounts.length > 0 && (
        <div className='bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/10 mb-6 sm:mb-8'>
          <h3 className='text-white font-bold text-base sm:text-lg mb-3 sm:mb-4'>
            Connected Accounts
          </h3>
          <div className='space-y-3 sm:space-y-4'>
            {accounts.map(account => (
              <div
                key={account.id}
                className='bg-white/5 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/10'
              >
                <div className='flex items-center justify-between mb-3'>
                  <div className='flex items-center space-x-3 min-w-0 flex-1'>
                    {account.picture ? (
                      <img
                        src={account.picture}
                        alt={account.name || account.email}
                        className='w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0'
                      />
                    ) : (
                      <div className='w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0'>
                        <span className='text-white font-semibold text-xs sm:text-sm'>
                          {account.name?.charAt(0) || account.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className='min-w-0'>
                      <h4 className='text-white font-semibold text-sm sm:text-base truncate'>
                        {account.name || 'Unknown'}
                      </h4>
                      <p className='text-gray-400 text-xs sm:text-sm truncate'>{account.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDisconnectAccount(account.id)}
                    className='text-red-400 hover:text-red-300 p-1.5 sm:p-2 rounded-lg hover:bg-red-500/10 transition-colors flex-shrink-0'
                    title='Disconnect Account'
                  >
                    <span className='text-sm sm:text-base'>🗑️</span>
                  </button>
                </div>

                {/* Available Services */}
                <div className='space-y-2 sm:space-y-3'>
                  <h4 className='text-xs sm:text-sm font-medium text-gray-300'>
                    Available Services:
                  </h4>
                  <div className='flex flex-wrap gap-1.5 sm:gap-2'>
                    {getAvailableServices(account).map(service => (
                      <div
                        key={service.name}
                        className='bg-green-500/20 text-green-300 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm flex items-center space-x-1'
                      >
                        <span className='text-xs sm:text-sm'>{service.icon}</span>
                        <span className='hidden sm:inline'>{service.name}</span>
                        <span className='sm:hidden'>
                          {service.name === 'Calendar'
                            ? 'Cal'
                            : service.name === 'Gmail'
                              ? 'Mail'
                              : service.name === 'Sheets'
                                ? 'Data'
                                : service.name === 'Drive'
                                  ? 'Files'
                                  : service.name === 'Docs'
                                    ? 'Doc'
                                    : service.name === 'Forms'
                                      ? 'Form'
                                      : service.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Setup Instructions */}
      {accounts.length === 0 && (
        <div className='bg-blue-500/10 border border-blue-500/20 rounded-xl sm:rounded-2xl lg:rounded-3xl p-6 sm:p-8'>
          <div className='flex flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-4'>
            <span className='text-blue-400 text-xl sm:text-2xl flex-shrink-0'>💡</span>
            <div className='min-w-0'>
              <h3 className='text-blue-300 text-base sm:text-lg font-semibold mb-2'>
                Getting Started with Google Integrations
              </h3>
              <div className='text-blue-200 space-y-2 text-sm sm:text-base'>
                <p>To use Google integrations, you need to:</p>
                <ol className='list-decimal list-inside space-y-1 ml-4'>
                  <li>Click &quot;Connect Google&quot; to authorize access</li>
                  <li>Select the Google services you want to integrate</li>
                  <li>Your AI agents will be able to access these services</li>
                  <li>Manage permissions anytime from this dashboard</li>
                </ol>
                <p className='mt-4 text-xs sm:text-sm'>
                  <strong>Note:</strong> Your data is secure and we only access what you explicitly
                  authorize.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // Google Service Wrapper Component
  const GoogleServiceWrapper = ({
    serviceName,
    accounts,
    children,
  }: {
    serviceName: string;
    accounts: GoogleAccount[];
    children: React.ReactNode;
  }) => {
    const [serviceError, setServiceError] = useState<string>('');
    const [retryCount, setRetryCount] = useState(0);

    const handleRetry = () => {
      setServiceError('');
      setRetryCount(prev => prev + 1);
      // Force re-render of child component
      window.location.reload();
    };

    // Check if accounts have required scopes for this service
    const hasRequiredScopes = (serviceName: string) => {
      const requiredScopes: { [key: string]: string[] } = {
        Calendar: ['https://www.googleapis.com/auth/calendar'],
        Gmail: [
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.send',
        ],
        Sheets: ['https://www.googleapis.com/auth/spreadsheets'],
        Templates: ['https://www.googleapis.com/auth/userinfo.email'],
      };

      const required = requiredScopes[serviceName] || [];
      return accounts.some(account => required.every(scope => account.scopes.includes(scope)));
    };

    if (!hasRequiredScopes(serviceName)) {
      return (
        <div className='bg-yellow-500/10 border border-yellow-500/20 rounded-xl sm:rounded-2xl p-6 sm:p-8'>
          <div className='text-center'>
            <span className='text-2xl sm:text-4xl mb-3 sm:mb-4 block'>⚠️</span>
            <h3 className='text-yellow-300 font-bold text-base sm:text-lg mb-2'>
              Thiếu quyền truy cập {serviceName}
            </h3>
            <p className='text-yellow-200 mb-3 sm:mb-4 text-sm sm:text-base'>
              Tài khoản Google của bạn cần được cấp quyền truy cập {serviceName} để sử dụng tính
              năng này.
            </p>
            <button
              onClick={handleConnectGoogle}
              className='bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-4 sm:px-6 py-2 rounded-lg sm:rounded-xl hover:from-yellow-600 hover:to-orange-700 transition-all text-sm sm:text-base'
            >
              Kết nối lại với quyền đầy đủ
            </button>
          </div>
        </div>
      );
    }

    if (serviceError) {
      return (
        <div className='bg-red-500/10 border border-red-500/20 rounded-xl sm:rounded-2xl p-6 sm:p-8'>
          <div className='text-center'>
            <span className='text-2xl sm:text-4xl mb-3 sm:mb-4 block'>❌</span>
            <h3 className='text-red-300 font-bold text-base sm:text-lg mb-2'>
              {serviceName} Error
            </h3>
            <p className='text-red-200 mb-3 sm:mb-4 text-sm sm:text-base'>{serviceError}</p>
            <div className='space-x-3'>
              <button
                onClick={handleRetry}
                className='bg-gradient-to-r from-red-500 to-pink-600 text-white px-4 sm:px-6 py-2 rounded-lg sm:rounded-xl hover:from-red-600 hover:to-pink-700 transition-all text-sm sm:text-base'
              >
                Retry
              </button>
              <button
                onClick={() => setActiveTab('overview')}
                className='bg-gray-600 text-white px-4 sm:px-6 py-2 rounded-lg sm:rounded-xl hover:bg-gray-700 transition-all text-sm sm:text-base'
              >
                Back to Overview
              </button>
            </div>
            {retryCount > 0 && (
              <p className='text-gray-400 text-xs mt-3'>Retry attempts: {retryCount}</p>
            )}
          </div>
        </div>
      );
    }

    // Wrap children with error boundary
    try {
      return <>{children}</>;
    } catch (error) {
      setServiceError(error instanceof Error ? error.message : 'Unknown error occurred');
      return null;
    }
  };

  // Phase 6.5 Placeholder Components
  const PhasePlaceholder = ({
    service,
    icon,
    description,
  }: {
    service: string;
    icon: string;
    description: string;
  }) => (
    <div className='bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-white/10'>
      <div className='text-center'>
        <div className='w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6'>
          <span className='text-2xl sm:text-4xl'>{icon}</span>
        </div>
        <h2 className='text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4'>Google {service}</h2>
        <p className='text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base'>{description}</p>

        <div className='bg-gray-500/10 border border-gray-500/20 rounded-lg sm:rounded-xl p-4 sm:p-6'>
          <div className='flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-3 mb-3 sm:mb-4'>
            <span className='text-xl sm:text-2xl'>⏳</span>
            <span className='text-gray-300 font-semibold text-sm sm:text-base'>
              Sẽ phát triển sau - Phase 6.5
            </span>
          </div>
          <p className='text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4'>
            Tính năng này thuộc Phase 6.5: Advanced Google Integrations và sẽ được phát triển sau.
          </p>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 text-left'>
            <div>
              <h4 className='text-white font-medium mb-2 text-sm sm:text-base'>
                Planned Features:
              </h4>
              <ul className='text-gray-300 text-xs sm:text-sm space-y-1'>
                {service === 'Drive' && (
                  <>
                    <li>• AI file categorization</li>
                    <li>• Smart folder organization</li>
                    <li>• Automated file tagging</li>
                    <li>• Content analysis</li>
                  </>
                )}
                {service === 'Docs' && (
                  <>
                    <li>• Template automation</li>
                    <li>• Meeting notes generation</li>
                    <li>• Content analysis</li>
                    <li>• Report generation</li>
                  </>
                )}
                {service === 'Forms' && (
                  <>
                    <li>• Dynamic form creation</li>
                    <li>• Response automation</li>
                    <li>• Data analytics</li>
                    <li>• Workflow integration</li>
                  </>
                )}
                {service === 'Analytics' && (
                  <>
                    <li>• Cross-service insights</li>
                    <li>• Predictive analytics</li>
                    <li>• Pattern recognition</li>
                    <li>• Smart recommendations</li>
                  </>
                )}
              </ul>
            </div>

            <div>
              <h4 className='text-white font-medium mb-2 text-sm sm:text-base'>
                Integration Benefits:
              </h4>
              <ul className='text-gray-300 text-xs sm:text-sm space-y-1'>
                <li>• Automated workflows</li>
                <li>• AI-powered insights</li>
                <li>• Time-saving automation</li>
                <li>• Enhanced productivity</li>
              </ul>
            </div>
          </div>
        </div>

        <div className='mt-4 sm:mt-6 text-gray-400 text-xs sm:text-sm'>
          <p>⏳ Sẽ triển khai trong tương lai...</p>
        </div>
      </div>
    </div>
  );

  // Custom right section with Connect Google button and header
  const renderCustomRightSection = () => (
    <div className='flex items-center space-x-2 sm:space-x-3 lg:space-x-4'>
      {/* Connect Google Button */}
      {accounts.length === 0 && (
        <button
          onClick={handleConnectGoogle}
          disabled={connecting}
          className='flex items-center space-x-2 bg-gradient-to-r from-blue-500/20 to-green-500/20 border border-blue-500/30 hover:border-blue-400/50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl transition-all duration-300 hover:from-blue-500/30 hover:to-green-500/30 disabled:opacity-50'
          title='Kết nối tài khoản Google'
        >
          <span className='text-blue-400 text-sm sm:text-base'>🔗</span>
          <span className='text-xs sm:text-sm text-blue-300 font-medium hidden sm:inline'>
            {connecting ? 'Connecting...' : 'Connect'}
          </span>
        </button>
      )}

      {/* Dashboard Header */}
      <DashboardHeader stats={userStats} />
    </div>
  );

  return (
    <DashboardLayout
      title={`🔗 Google Integrations (${accounts.length} accounts)`}
      description='Complete Google Workspace integration with AI features'
      rightSection={renderCustomRightSection()}
    >
      <TabNavigation />

      {activeTab === 'overview' && <OverviewContent />}
      {activeTab === 'calendar' && accounts.length > 0 && (
        <GoogleServiceWrapper serviceName='Calendar' accounts={accounts}>
          <CalendarDashboard />
        </GoogleServiceWrapper>
      )}
      {activeTab === 'gmail' && accounts.length > 0 && (
        <GoogleServiceWrapper serviceName='Gmail' accounts={accounts}>
          <GmailDashboard />
        </GoogleServiceWrapper>
      )}
      {activeTab === 'sheets' && accounts.length > 0 && (
        <GoogleServiceWrapper serviceName='Sheets' accounts={accounts}>
          <SheetsDashboard />
        </GoogleServiceWrapper>
      )}
      {activeTab === 'templates' && accounts.length > 0 && (
        <GoogleServiceWrapper serviceName='Templates' accounts={accounts}>
          <PromptTemplateManager accountId={accounts[0].id} />
        </GoogleServiceWrapper>
      )}

      {/* Phase 6.5 Services */}
      {activeTab === 'drive' && accounts.length > 0 && (
        <PhasePlaceholder
          service='Drive'
          icon='📁'
          description='Intelligent file management with AI categorization and smart organization'
        />
      )}
      {activeTab === 'docs' && accounts.length > 0 && (
        <PhasePlaceholder
          service='Docs'
          icon='📝'
          description='Document automation with AI-powered template generation and content analysis'
        />
      )}
      {activeTab === 'forms' && accounts.length > 0 && (
        <PhasePlaceholder
          service='Forms'
          icon='📋'
          description='Form creation and response automation with intelligent data processing'
        />
      )}
      {activeTab === 'analytics' && accounts.length > 0 && (
        <PhasePlaceholder
          service='Analytics'
          icon='AI'
          description='Advanced AI analytics across all Google services with predictive insights'
        />
      )}

      {/* No connection message for service tabs */}
      {activeTab !== 'overview' && accounts.length === 0 && (
        <div className='bg-yellow-500/10 border border-yellow-500/20 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center'>
          <span className='text-2xl sm:text-4xl mb-3 sm:mb-4 block'>🔗</span>
          <h3 className='text-yellow-300 font-bold text-base sm:text-lg mb-2'>
            Google Account Required
          </h3>
          <p className='text-yellow-200 mb-3 sm:mb-4 text-sm sm:text-base'>
            You need to connect your Google account to access{' '}
            {activeTab === 'calendar'
              ? 'Calendar'
              : activeTab === 'gmail'
                ? 'Gmail'
                : activeTab === 'sheets'
                  ? 'Sheets'
                  : activeTab === 'drive'
                    ? 'Drive'
                    : activeTab === 'docs'
                      ? 'Docs'
                      : activeTab === 'forms'
                        ? 'Forms'
                        : activeTab === 'analytics'
                          ? 'Analytics'
                          : ''}{' '}
            features.
          </p>
          <button
            onClick={() => setActiveTab('overview')}
            className='bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-4 sm:px-6 py-2 rounded-lg sm:rounded-xl hover:from-yellow-600 hover:to-orange-700 transition-all text-sm sm:text-base'
          >
            Go to Overview & Connect
          </button>
        </div>
      )}
    </DashboardLayout>
  );
}

// Component chính bọc Suspense
export default function GoogleIntegrationsPage() {
  return (
    <Suspense
      fallback={
        <div className='flex items-center justify-center min-h-screen'>
          <div className='text-center'>
            <div className='w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
            <p className='text-white'>Đang tải Google integrations...</p>
          </div>
        </div>
      }
    >
      <GoogleIntegrationsContent />
    </Suspense>
  );
}
