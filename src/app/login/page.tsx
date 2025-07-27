'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { VIEAgentLogo } from '@/components/ui/vieagent-logo';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorParam = searchParams.get('error');
    const messageParam = searchParams.get('message');

    if (errorParam === 'unauthorized') {
      setError('Bạn không có quyền truy cập trang này');
    } else if (errorParam === 'CredentialsSignin') {
      setError('Email hoặc mật khẩu không đúng');
    } else if (messageParam === 'registration_success') {
      setError(''); // Clear any errors
      setSuccessMessage('🎉 Tài khoản đã được tạo thành công! Vui lòng đăng nhập.');
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Email hoặc mật khẩu không đúng');
      } else {
        // Get session to check role and redirect accordingly
        const session = await getSession();
        if (session?.user) {
          const userRole = (session.user as any)?.role;

          // Redirect based on role
          if (['OWNER', 'ADMIN', 'MANAGER'].includes(userRole)) {
            router.push('/admin'); // Admin roles go to admin panel
          } else {
            router.push('/dashboard'); // Regular users go to dashboard
          }
        } else {
          router.push('/dashboard');
        }
      }
    } catch (error) {
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-black text-white relative overflow-hidden'>
      {/* Background Effects */}
      <div className='fixed inset-0 z-0'>
        <div className='absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900'></div>
        <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse'></div>
        <div className='absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000'></div>
        <div className='absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]'></div>
      </div>

      <div className='relative z-10 flex items-center justify-center min-h-screen p-4'>
        <div className='bg-white/5 backdrop-blur-sm rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/10'>
          {/* Header */}
          <div className='text-center mb-8'>
            <div className='w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4'>
              <VIEAgentLogo size='small' />
            </div>
            <h1 className='text-3xl font-black bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2'>
              Đăng nhập
            </h1>
            <p className='text-gray-400'>Chào mừng trở lại VIEAgent</p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className='mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-2xl'>
              <p className='text-green-300 text-center text-sm'>{successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className='mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-2xl'>
              <p className='text-red-300 text-center text-sm'>{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className='space-y-6'>
            <div>
              <label className='block text-white font-medium mb-2'>Email</label>
              <input
                type='email'
                value={email}
                onChange={e => setEmail(e.target.value)}
                className='w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm'
                placeholder='your-email@example.com'
                required
              />
            </div>

            <div>
              <label className='block text-white font-medium mb-2'>Mật khẩu</label>
              <input
                type='password'
                value={password}
                onChange={e => setPassword(e.target.value)}
                className='w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm'
                placeholder='••••••••'
                required
              />
            </div>

            <button
              type='submit'
              disabled={loading}
              className='w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 shadow-2xl'
            >
              {loading ? (
                <span className='flex items-center justify-center space-x-2'>
                  <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                  <span>Đang đăng nhập...</span>
                </span>
              ) : (
                '🚀 Đăng nhập'
              )}
            </button>
          </form>

          {/* Register Section */}
          <div className='mt-8 space-y-4'>
            <div className='flex items-center'>
              <div className='flex-1 border-t border-gray-700'></div>
              <span className='px-4 text-gray-400 text-sm'>hoặc</span>
              <div className='flex-1 border-t border-gray-700'></div>
            </div>

            <Link
              href='/register'
              className='group w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-3 px-6 rounded-2xl font-medium transition-all duration-300 shadow-2xl hover:shadow-green-500/30 hover:scale-105 flex items-center justify-center space-x-2'
            >
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z'
                />
              </svg>
              <span>Tạo tài khoản miễn phí</span>
              <svg
                className='w-4 h-4 group-hover:translate-x-1 transition-transform'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M13 7l5 5m0 0l-5 5m5-5H6'
                />
              </svg>
            </Link>

            <p className='text-xs text-gray-400 text-center'>
              Tham gia 50,000+ doanh nghiệp đã tin tưởng VIEAgent
            </p>
          </div>

          {/* Navigation */}
          <div className='mt-6 text-center'>
            <Link
              href='/'
              className='text-gray-400 hover:text-white transition-colors text-sm font-medium inline-flex items-center space-x-2'
            >
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M10 19l-7-7m0 0l7-7m-7 7h18'
                />
              </svg>
              <span>Về trang chủ</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen bg-black flex items-center justify-center'>
          <div className='text-center'>
            <div className='w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
            <p className='text-white'>Loading...</p>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
