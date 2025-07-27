'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe';
import StripePaymentForm from '@/components/payments/StripePaymentForm';
import BankTransferForm from '@/components/payments/BankTransferForm';
import { CreditCard, Banknote, ArrowLeft, Shield, Clock, CheckCircle, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { Suspense } from 'react';

function PaymentContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const planParam = searchParams.get('plan');
  const [plan, setPlan] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'bank'>('stripe');
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && planParam) {
      fetchPlanAndCreatePaymentIntent();
    }
  }, [status, planParam]);

  const fetchPlanAndCreatePaymentIntent = async () => {
    try {
      // First get all plans and find the matching one
      const plansResponse = await fetch('/api/admin/plans');
      const plansResult = await plansResponse.json();

      if (!plansResult.success) {
        toast.error('Không thể tải thông tin gói dịch vụ');
        router.push('/pricing');
        return;
      }

      // Find plan by name (case insensitive)
      const foundPlan = plansResult.data.find(
        (p: any) => p.name.toLowerCase() === planParam?.toLowerCase()
      );

      if (!foundPlan) {
        toast.error('Không tìm thấy gói dịch vụ');
        router.push('/pricing');
        return;
      }

      setPlan(foundPlan);

      // Create payment intent for Stripe only if needed
      if (paymentMethod === 'stripe' && foundPlan.price > 0) {
        const paymentResponse = await fetch('/api/payments/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId: foundPlan.id, currency: 'usd' }),
        });

        const paymentResult = await paymentResponse.json();

        if (paymentResult.success) {
          setClientSecret(paymentResult.data.clientSecret);
        } else {
          toast.error('Không thể khởi tạo thanh toán');
        }
      }
    } catch (error) {
      toast.error('Lỗi tải thông tin thanh toán');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    toast.success('Thanh toán thành công!');
    router.push('/dashboard?payment=success');
  };

  const handlePaymentError = (error: string) => {
    toast.error(error);
  };

  const handleBankTransferSuccess = (transferId: string) => {
    toast.success('Thông tin chuyển khoản đã được gửi!');
    router.push(`/dashboard?transfer=${transferId}`);
  };

  if (status === 'loading' || loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-white'>Đang tải thông tin thanh toán...</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center'>
        <div className='text-center'>
          <p className='text-white text-xl mb-4'>Không tìm thấy gói dịch vụ</p>
          <button
            onClick={() => router.push('/pricing')}
            className='bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 transition-colors'
          >
            Quay lại trang giá
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900'>
      <div className='container mx-auto px-4 py-8'>
        {/* Header */}
        <div className='text-center mb-8'>
          <button
            onClick={() => router.back()}
            className='inline-flex items-center space-x-2 text-purple-300 hover:text-white mb-6 transition-colors'
          >
            <ArrowLeft className='w-5 h-5' />
            <span>Quay lại</span>
          </button>

          <h1 className='text-4xl font-bold text-white mb-4'>💳 Hoàn tất thanh toán</h1>
          <p className='text-xl text-gray-300'>
            Đăng ký gói <span className='text-purple-400 font-semibold'>{plan.name}</span> và khai
            phá sức mạnh AI
          </p>
        </div>

        <div className='max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {/* Plan Summary */}
          <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 h-fit'>
            <h3 className='text-2xl font-bold text-white mb-6 flex items-center space-x-2'>
              <Star className='w-6 h-6 text-yellow-400' />
              <span>Tóm tắt đơn hàng</span>
            </h3>

            <div className='space-y-6'>
              <div className='bg-white/5 rounded-2xl p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h4 className='text-xl font-semibold text-white'>{plan.name}</h4>
                  {plan.isPopular && (
                    <span className='bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-semibold'>
                      ⭐ Phổ biến
                    </span>
                  )}
                </div>

                <p className='text-gray-400 mb-6'>{plan.description}</p>

                <div className='space-y-3 mb-6'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-400'>VIEAgents tối đa:</span>
                    <span className='text-white font-medium'>
                      {plan.maxAgents === -1 ? 'Không giới hạn' : plan.maxAgents.toLocaleString()}
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-400'>💬 Cuộc trò chuyện:</span>
                    <span className='text-white font-medium'>
                      {plan.maxConversations === -1
                        ? 'Không giới hạn'
                        : plan.maxConversations.toLocaleString()}
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-400'>💾 Dung lượng:</span>
                    <span className='text-white font-medium'>
                      {plan.maxStorage === -1 ? 'Không giới hạn' : `${plan.maxStorage}GB`}
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-400'>🔗 API Calls:</span>
                    <span className='text-white font-medium'>
                      {plan.maxApiCalls === -1
                        ? 'Không giới hạn'
                        : plan.maxApiCalls.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className='border-t border-white/10 pt-4'>
                  <div className='flex justify-between items-center'>
                    <span className='text-lg text-gray-300'>Tổng cộng:</span>
                    <div className='text-right'>
                      <span className='text-3xl font-bold text-green-400'>${plan.price}</span>
                      <span className='text-gray-400 ml-2'>
                        / {plan.interval === 'month' ? 'tháng' : 'năm'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className='bg-white/5 rounded-2xl p-6'>
                <h5 className='font-semibold text-white mb-4'>✨ Tính năng bao gồm:</h5>
                <div className='space-y-3'>
                  {[
                    {
                      key: 'enableGoogleIntegration',
                      label: '🔗 Tích hợp Google',
                      enabled: plan.enableGoogleIntegration,
                    },
                    {
                      key: 'enableHandoverSystem',
                      label: '👥 Chuyển giao con người',
                      enabled: plan.enableHandoverSystem,
                    },
                    {
                      key: 'enableAnalytics',
                      label: '📊 Phân tích nâng cao',
                      enabled: plan.enableAnalytics,
                    },
                    {
                      key: 'enableCustomBranding',
                      label: '🎨 Tùy chỉnh thương hiệu',
                      enabled: plan.enableCustomBranding,
                    },
                    {
                      key: 'enablePrioritySupport',
                      label: '⚡ Hỗ trợ ưu tiên',
                      enabled: plan.enablePrioritySupport,
                    },
                  ].map(feature => (
                    <div key={feature.key} className='flex items-center space-x-3'>
                      {feature.enabled ? (
                        <CheckCircle className='w-5 h-5 text-green-400' />
                      ) : (
                        <div className='w-5 h-5 border border-gray-500 rounded-full' />
                      )}
                      <span className={`${feature.enabled ? 'text-green-400' : 'text-gray-500'}`}>
                        {feature.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security Badge */}
              <div className='bg-green-500/10 border border-green-500/30 rounded-2xl p-4'>
                <div className='flex items-center space-x-3 text-green-300'>
                  <Shield className='w-6 h-6' />
                  <div>
                    <p className='font-semibold'>🔒 Thanh toán bảo mật</p>
                    <p className='text-sm opacity-80'>Mã hóa SSL 256-bit và tuân thủ PCI DSS</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className='space-y-6'>
            {/* Payment Method Selection */}
            <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10'>
              <h3 className='text-2xl font-bold text-white mb-6'>🛒 Chọn phương thức thanh toán</h3>

              <div className='grid grid-cols-2 gap-4 mb-8'>
                <button
                  onClick={() => setPaymentMethod('stripe')}
                  className={`p-6 rounded-2xl border-2 transition-all ${
                    paymentMethod === 'stripe'
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-white/20 bg-white/5 hover:border-white/40'
                  }`}
                >
                  <CreditCard className='w-8 h-8 mx-auto mb-3 text-blue-400' />
                  <p className='text-white font-semibold mb-1'>💳 Thẻ tín dụng</p>
                  <p className='text-gray-400 text-sm'>Kích hoạt ngay lập tức</p>
                  <div className='mt-2'>
                    <span className='text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full'>
                      ⚡ Tức thì
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMethod('bank')}
                  className={`p-6 rounded-2xl border-2 transition-all ${
                    paymentMethod === 'bank'
                      ? 'border-green-500 bg-green-500/20'
                      : 'border-white/20 bg-white/5 hover:border-white/40'
                  }`}
                >
                  <Banknote className='w-8 h-8 mx-auto mb-3 text-green-400' />
                  <p className='text-white font-semibold mb-1'>🏦 Chuyển khoản</p>
                  <p className='text-gray-400 text-sm'>Kích hoạt trong 24h</p>
                  <div className='mt-2'>
                    <span className='text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full'>
                      🕐 24 giờ
                    </span>
                  </div>
                </button>
              </div>

              {/* Processing Time Info */}
              <div className='bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4'>
                <div className='flex items-center space-x-3 text-blue-300'>
                  <Clock className='w-5 h-5' />
                  <div>
                    <p className='font-semibold'>
                      {paymentMethod === 'stripe'
                        ? '⚡ Kích hoạt tức thì'
                        : '🕐 Xử lý trong 24 giờ'}
                    </p>
                    <p className='text-sm opacity-80'>
                      {paymentMethod === 'stripe'
                        ? 'Gói dịch vụ sẽ được kích hoạt ngay sau khi thanh toán thành công'
                        : 'Gói dịch vụ sẽ được kích hoạt trong vòng 24 giờ sau khi xác minh thanh toán'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Form */}
            {paymentMethod === 'stripe' && plan.price > 0 ? (
              clientSecret ? (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: 'night',
                      variables: {
                        colorPrimary: '#8b5cf6',
                        colorBackground: 'rgba(255, 255, 255, 0.05)',
                        colorText: '#ffffff',
                        borderRadius: '16px',
                      },
                    },
                  }}
                >
                  <StripePaymentForm
                    clientSecret={clientSecret}
                    amount={plan.price}
                    currency='USD'
                    planName={plan.name}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                </Elements>
              ) : (
                <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10'>
                  <div className='text-center'>
                    <div className='w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
                    <p className='text-white'>Đang khởi tạo thanh toán...</p>
                  </div>
                </div>
              )
            ) : paymentMethod === 'stripe' && plan.price === 0 ? (
              <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 text-center'>
                <div className='w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4'>
                  <CheckCircle className='w-8 h-8 text-white' />
                </div>
                <h3 className='text-2xl font-bold text-white mb-4'>🎉 Gói miễn phí!</h3>
                <p className='text-gray-400 mb-6'>
                  Gói này hoàn toàn miễn phí. Nhấn nút bên dưới để bắt đầu.
                </p>
                <button
                  onClick={() => router.push('/dashboard')}
                  className='bg-gradient-to-r from-green-500 to-blue-600 text-white font-semibold px-8 py-4 rounded-2xl hover:from-green-600 hover:to-blue-700 transition-all'
                >
                  🚀 Bắt đầu ngay
                </button>
              </div>
            ) : (
              <BankTransferForm
                planId={plan.id}
                planName={plan.name}
                amount={plan.price}
                currency='USD'
                onSuccess={handleBankTransferSuccess}
                onError={handlePaymentError}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen bg-black flex items-center justify-center'>
          <div className='text-center'>
            <div className='w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
            <p className='text-white'>Đang tải trang thanh toán...</p>
          </div>
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
