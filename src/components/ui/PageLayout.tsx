import React from 'react';
import { VIEAgentLogo } from '@/components/ui/vieagent-logo';
import Link from 'next/link';

interface PageLayoutProps {
  children: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  badge?: {
    text: string;
    gradient?: string;
  };
  showNavigation?: boolean;
  className?: string;
}

interface HeaderProps {
  showNavigation?: boolean;
  currentPage?: string;
}

const PageHeader: React.FC<HeaderProps> = ({ showNavigation = true, currentPage }) => {
  return (
    <header className='relative z-10 backdrop-blur-sm border-b border-gray-800/50'>
      <div className='container mx-auto px-4 py-6'>
        <nav className='flex justify-between items-center'>
          <div className='flex items-center space-x-3'>
            <Link href='/' className='flex items-center space-x-3 group'>
              <VIEAgentLogo
                size='medium'
                className='group-hover:scale-110 transition-transform duration-300'
              />
              <div>
                <h1 className='text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent'>
                  VIEAgent
                </h1>
                <p className='text-xs text-gray-400'>Next-Gen Intelligence</p>
              </div>
            </Link>
          </div>

          {/* Navigation Menu */}
          {showNavigation && (
            <div className='hidden md:flex space-x-8'>
              <Link
                href='/'
                className={`transition-colors hover:text-blue-400 ${
                  currentPage === 'home'
                    ? 'text-white font-semibold'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Trang chủ
              </Link>
              <Link
                href='/pricing'
                className={`transition-colors hover:text-blue-400 ${
                  currentPage === 'pricing'
                    ? 'text-white font-semibold'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Pricing
              </Link>
              <Link
                href='/blog'
                className={`transition-colors hover:text-blue-400 ${
                  currentPage === 'blog'
                    ? 'text-white font-semibold'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Blog
              </Link>
              <Link
                href='/contact'
                className={`transition-colors hover:text-blue-400 ${
                  currentPage === 'contact'
                    ? 'text-white font-semibold'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Liên hệ
              </Link>
            </div>
          )}

          {/* Action Buttons */}
          <div className='flex items-center space-x-3'>
            <Link
              href='/login'
              className='group px-4 py-2 text-gray-300 hover:text-white transition-all duration-300 border border-gray-600 rounded-xl hover:border-gray-400 hover:shadow-lg hover:shadow-gray-500/20'
            >
              <span className='group-hover:scale-105 inline-block transition-transform'>
                Đăng nhập
              </span>
            </Link>
            <Link
              href='/register'
              className='group px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-2xl hover:shadow-blue-500/30 hover:scale-105 font-medium'
            >
              <span className='flex items-center space-x-2'>
                <span>Đăng ký miễn phí</span>
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
              </span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className='md:hidden'>
            <button className='text-gray-300 hover:text-white'>
              <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M4 6h16M4 12h16M4 18h16'
                />
              </svg>
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
};

const PageBackground: React.FC = () => {
  return (
    <div className='fixed inset-0 z-0'>
      <div className='absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900'></div>
      <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse'></div>
      <div className='absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000'></div>
      <div className='absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]'></div>
    </div>
  );
};

interface HeroSectionProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  badge?: {
    text: string;
    gradient?: string;
  };
  children?: React.ReactNode;
}

const HeroSection: React.FC<HeroSectionProps> = ({ title, description, badge, children }) => {
  return (
    <section className='relative py-20 px-4'>
      <div className='container mx-auto text-center relative z-10'>
        <div className='max-w-4xl mx-auto'>
          {badge && (
            <div className='inline-block mb-8'>
              <div
                className={`px-6 py-2 ${badge.gradient || 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30'} rounded-full backdrop-blur-sm`}
              >
                <span className='text-blue-300 text-sm font-medium'>{badge.text}</span>
              </div>
            </div>
          )}

          <h1 className='text-5xl md:text-6xl font-black mb-8 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent leading-tight'>
            {title}
          </h1>

          {description && (
            <div className='text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed'>
              {description}
            </div>
          )}

          {children}
        </div>
      </div>
    </section>
  );
};

const PageFooter: React.FC = () => {
  return (
    <footer className='relative z-10 bg-gray-900/50 backdrop-blur-sm border-t border-gray-800/50 mt-20'>
      <div className='container mx-auto px-4 py-12'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-8'>
          {/* Company Info */}
          <div className='col-span-1 md:col-span-2'>
            <div className='flex items-center space-x-3 mb-4'>
              <VIEAgentLogo size='small' />
              <div>
                <h3 className='text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent'>
                  VIEAgent
                </h3>
                <p className='text-xs text-gray-400'>Next-Gen Intelligence</p>
              </div>
            </div>
            <p className='text-gray-300 mb-4 max-w-md'>
              Nền tảng AI hàng đầu giúp doanh nghiệp tự động hóa quy trình và tăng hiệu suất vượt
              trội với công nghệ AI tiên tiến.
            </p>
            <div className='flex space-x-4'>
              <a href='#' className='text-gray-400 hover:text-blue-400 transition-colors'>
                <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'>
                  <path d='M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z' />
                </svg>
              </a>
              <a href='#' className='text-gray-400 hover:text-blue-400 transition-colors'>
                <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'>
                  <path d='M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z' />
                </svg>
              </a>
              <a href='#' className='text-gray-400 hover:text-blue-400 transition-colors'>
                <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'>
                  <path d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className='text-white font-semibold mb-4'>Sản phẩm</h4>
            <ul className='space-y-2'>
              <li>
                <Link href='/pricing' className='text-gray-400 hover:text-white transition-colors'>
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href='/dashboard'
                  className='text-gray-400 hover:text-white transition-colors'
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href='/blog' className='text-gray-400 hover:text-white transition-colors'>
                  Blog
                </Link>
              </li>
              <li>
                <Link href='/contact' className='text-gray-400 hover:text-white transition-colors'>
                  Liên hệ
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className='text-white font-semibold mb-4'>Pháp lý</h4>
            <ul className='space-y-2'>
              <li>
                <Link href='/privacy' className='text-gray-400 hover:text-white transition-colors'>
                  Chính sách Quyền riêng tư
                </Link>
              </li>
              <li>
                <Link href='/terms' className='text-gray-400 hover:text-white transition-colors'>
                  Điều khoản Dịch vụ
                </Link>
              </li>
              <li>
                <Link
                  href='/cookie-policy'
                  className='text-gray-400 hover:text-white transition-colors'
                >
                  Chính sách Cookie
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className='border-t border-gray-800/50 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center'>
          <p className='text-gray-400 text-sm'>© 2024 VIEAgent. Tất cả quyền được bảo lưu.</p>
          <div className='flex space-x-6 mt-4 md:mt-0'>
            <Link
              href='/privacy'
              className='text-gray-400 hover:text-white text-sm transition-colors'
            >
              Quyền riêng tư
            </Link>
            <Link
              href='/terms'
              className='text-gray-400 hover:text-white text-sm transition-colors'
            >
              Điều khoản
            </Link>
            <Link
              href='/cookie-policy'
              className='text-gray-400 hover:text-white text-sm transition-colors'
            >
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  title,
  description,
  badge,
  showNavigation = true,
  className = '',
}) => {
  return (
    <div className={`min-h-screen bg-black text-white ${className}`}>
      <PageBackground />
      <PageHeader showNavigation={showNavigation} />
      <HeroSection title={title} description={description} badge={badge} />

      {/* Main Content */}
      <div className='relative z-10'>{children}</div>

      {/* Footer */}
      <PageFooter />
    </div>
  );
};

export default PageLayout;
export { PageHeader, PageBackground, HeroSection };
