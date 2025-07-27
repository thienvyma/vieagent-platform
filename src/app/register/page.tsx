'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, User, Mail, Lock, ArrowRight, CheckCircle } from 'lucide-react';
import { VIEAgentLogo } from '@/components/ui/vieagent-logo';

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
  subscribeNewsletter: boolean;
}

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<RegisterFormData>>({});
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    subscribeNewsletter: true,
  });

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterFormData> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Họ tên không được để trống';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Họ tên phải có ít nhất 2 ký tự';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email không được để trống';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Mật khẩu không được để trống';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường và 1 số';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Xác nhận mật khẩu không được để trống';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    // Terms validation
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'Bạn phải đồng ý với điều khoản sử dụng';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          subscribeNewsletter: formData.subscribeNewsletter,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Registration successful
        router.push('/login?message=registration_success');
      } else {
        // Handle server errors
        if (data.error === 'USER_EXISTS') {
          setErrors({ email: 'Email này đã được sử dụng' });
        } else {
          setErrors({ email: data.message || 'Đã xảy ra lỗi. Vui lòng thử lại.' });
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ email: 'Đã xảy ra lỗi kết nối. Vui lòng thử lại.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof RegisterFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4'>
      <div className='max-w-md w-full space-y-8'>
        {/* Header */}
        <div className='text-center'>
          <div className='flex justify-center mb-6'>
            <VIEAgentLogo size='large' />
          </div>
          <h2 className='text-3xl font-bold text-white'>Tạo tài khoản VIEAgent</h2>
          <p className='mt-2 text-sm text-gray-300'>
            Gia nhập cộng đồng 50,000+ doanh nghiệp đã tin tưởng VIEAgent
          </p>
        </div>

        {/* Registration Form */}
        <form className='mt-8 space-y-6' onSubmit={handleSubmit}>
          <div className='bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20'>
            <div className='space-y-6'>
              {/* Name Field */}
              <div>
                <label htmlFor='name' className='block text-sm font-medium text-white mb-2'>
                  Họ và tên
                </label>
                <div className='relative'>
                  <User className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                  <input
                    id='name'
                    name='name'
                    type='text'
                    required
                    value={formData.name}
                    onChange={e => handleInputChange('name', e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 bg-white/5 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.name ? 'border-red-500' : 'border-white/20'
                    }`}
                    placeholder='Nhập họ và tên của bạn'
                  />
                </div>
                {errors.name && <p className='mt-1 text-sm text-red-400'>{errors.name}</p>}
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor='email' className='block text-sm font-medium text-white mb-2'>
                  Email
                </label>
                <div className='relative'>
                  <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                  <input
                    id='email'
                    name='email'
                    type='email'
                    required
                    value={formData.email}
                    onChange={e => handleInputChange('email', e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 bg-white/5 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.email ? 'border-red-500' : 'border-white/20'
                    }`}
                    placeholder='example@company.com'
                  />
                </div>
                {errors.email && <p className='mt-1 text-sm text-red-400'>{errors.email}</p>}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor='password' className='block text-sm font-medium text-white mb-2'>
                  Mật khẩu
                </label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                  <input
                    id='password'
                    name='password'
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={e => handleInputChange('password', e.target.value)}
                    className={`w-full pl-10 pr-12 py-3 bg-white/5 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.password ? 'border-red-500' : 'border-white/20'
                    }`}
                    placeholder='Tối thiểu 8 ký tự'
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white'
                  >
                    {showPassword ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
                  </button>
                </div>
                {errors.password && <p className='mt-1 text-sm text-red-400'>{errors.password}</p>}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label
                  htmlFor='confirmPassword'
                  className='block text-sm font-medium text-white mb-2'
                >
                  Xác nhận mật khẩu
                </label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                  <input
                    id='confirmPassword'
                    name='confirmPassword'
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={e => handleInputChange('confirmPassword', e.target.value)}
                    className={`w-full pl-10 pr-12 py-3 bg-white/5 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.confirmPassword ? 'border-red-500' : 'border-white/20'
                    }`}
                    placeholder='Nhập lại mật khẩu'
                  />
                  <button
                    type='button'
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white'
                  >
                    {showConfirmPassword ? (
                      <EyeOff className='w-5 h-5' />
                    ) : (
                      <Eye className='w-5 h-5' />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className='mt-1 text-sm text-red-400'>{errors.confirmPassword}</p>
                )}
              </div>

              {/* Terms Checkbox */}
              <div className='flex items-start space-x-3'>
                <input
                  id='agreeToTerms'
                  name='agreeToTerms'
                  type='checkbox'
                  checked={formData.agreeToTerms}
                  onChange={e => handleInputChange('agreeToTerms', e.target.checked)}
                  className='w-4 h-4 text-blue-600 bg-white/10 border-gray-300 rounded focus:ring-blue-500 focus:ring-2'
                />
                <label htmlFor='agreeToTerms' className='text-sm text-gray-300'>
                  Tôi đồng ý với{' '}
                  <Link href='/terms' className='text-blue-400 hover:text-blue-300 underline'>
                    Điều khoản sử dụng
                  </Link>{' '}
                  và{' '}
                  <Link href='/privacy' className='text-blue-400 hover:text-blue-300 underline'>
                    Chính sách bảo mật
                  </Link>
                </label>
              </div>
              {errors.agreeToTerms && <p className='text-sm text-red-400'>{errors.agreeToTerms}</p>}

              {/* Newsletter Checkbox */}
              <div className='flex items-start space-x-3'>
                <input
                  id='subscribeNewsletter'
                  name='subscribeNewsletter'
                  type='checkbox'
                  checked={formData.subscribeNewsletter}
                  onChange={e => handleInputChange('subscribeNewsletter', e.target.checked)}
                  className='w-4 h-4 text-blue-600 bg-white/10 border-gray-300 rounded focus:ring-blue-500 focus:ring-2'
                />
                <label htmlFor='subscribeNewsletter' className='text-sm text-gray-300'>
                  Nhận newsletter với tips & updates mới nhất về AI
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className='mt-8'>
              <button
                type='submit'
                disabled={isLoading}
                className='group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200'
              >
                {isLoading ? (
                  <div className='flex items-center'>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                    Đang tạo tài khoản...
                  </div>
                ) : (
                  <div className='flex items-center'>
                    <CheckCircle className='w-5 h-5 mr-2' />
                    Tạo tài khoản miễn phí
                    <ArrowRight className='w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform' />
                  </div>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Login Link */}
        <div className='text-center'>
          <p className='text-sm text-gray-300'>
            Đã có tài khoản?{' '}
            <Link
              href='/login'
              className='font-medium text-blue-400 hover:text-blue-300 transition-colors'
            >
              Đăng nhập ngay
            </Link>
          </p>
        </div>

        {/* Features Preview */}
        <div className='bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10'>
          <h3 className='text-lg font-semibold text-white mb-4'>Điều gì đang chờ bạn?</h3>
          <div className='space-y-3'>
            <div className='flex items-center text-sm text-gray-300'>
              <CheckCircle className='w-4 h-4 text-green-400 mr-3 flex-shrink-0' />
              Tạo và quản lý AI agents không giới hạn
            </div>
            <div className='flex items-center text-sm text-gray-300'>
              <CheckCircle className='w-4 h-4 text-green-400 mr-3 flex-shrink-0' />
              Tích hợp với Google Workspace, Facebook, Zalo
            </div>
            <div className='flex items-center text-sm text-gray-300'>
              <CheckCircle className='w-4 h-4 text-green-400 mr-3 flex-shrink-0' />
              Hỗ trợ đa ngôn ngữ và tối ưu cho thị trường Việt Nam
            </div>
            <div className='flex items-center text-sm text-gray-300'>
              <CheckCircle className='w-4 h-4 text-green-400 mr-3 flex-shrink-0' />
              Dashboard analytics và báo cáo chi tiết
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
