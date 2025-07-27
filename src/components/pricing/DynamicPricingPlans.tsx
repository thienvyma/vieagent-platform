'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Star, Zap, Shield, Users, BarChart3 } from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  interval: string;
  maxAgents: number;
  maxConversations: number;
  maxStorage: number;
  maxApiCalls: number;
  enableGoogleIntegration: boolean;
  enableHandoverSystem: boolean;
  enableAnalytics: boolean;
  enableCustomBranding: boolean;
  enablePrioritySupport: boolean;
  isActive: boolean;
  isPopular: boolean;
  sortOrder: number;
}

export default function DynamicPricingPlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAnnual, setIsAnnual] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      // Use public endpoint for pricing page (no auth required)
      const response = await fetch('/api/public/plans');

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPlans(data.data.filter((plan: SubscriptionPlan) => plan.isActive));
        }
      } else {
        // Fallback to static plans if API fails
        console.warn('API failed, using fallback plans');
        setPlans(getFallbackPlans());
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      setPlans(getFallbackPlans());
    } finally {
      setLoading(false);
    }
  };

  const getFallbackPlans = (): SubscriptionPlan[] => [
    {
      id: 'trial',
      name: 'Trial',
      description: 'Dùng thử miễn phí',
      price: 0,
      currency: 'USD',
      interval: 'month',
      maxAgents: 1,
      maxConversations: 100,
      maxStorage: 1,
      maxApiCalls: 1000,
      enableGoogleIntegration: false,
      enableHandoverSystem: false,
      enableAnalytics: false,
      enableCustomBranding: false,
      enablePrioritySupport: false,
      isActive: true,
      isPopular: false,
      sortOrder: 1,
    },
    {
      id: 'basic',
      name: 'Basic',
      description: 'Cho cá nhân và freelancer',
      price: 29,
      currency: 'USD',
      interval: 'month',
      maxAgents: 3,
      maxConversations: 1000,
      maxStorage: 5,
      maxApiCalls: 10000,
      enableGoogleIntegration: true,
      enableHandoverSystem: false,
      enableAnalytics: true,
      enableCustomBranding: false,
      enablePrioritySupport: false,
      isActive: true,
      isPopular: true,
      sortOrder: 2,
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'Cho doanh nghiệp nhỏ',
      price: 99,
      currency: 'USD',
      interval: 'month',
      maxAgents: 10,
      maxConversations: 5000,
      maxStorage: 25,
      maxApiCalls: 50000,
      enableGoogleIntegration: true,
      enableHandoverSystem: true,
      enableAnalytics: true,
      enableCustomBranding: true,
      enablePrioritySupport: false,
      isActive: true,
      isPopular: false,
      sortOrder: 3,
    },
  ];

  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return 'MIỄN PHÍ';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getAnnualPrice = (monthlyPrice: number) => {
    return monthlyPrice * 10; // 17% discount
  };

  const getPlanFeatures = (plan: SubscriptionPlan) => {
    const features = [];

    // Basic features
    features.push(
      `${plan.maxAgents === -1 ? 'Unlimited' : plan.maxAgents} AI Agent${plan.maxAgents !== 1 ? 's' : ''}`
    );
    features.push(
      `${plan.maxConversations === -1 ? 'Unlimited' : plan.maxConversations.toLocaleString()} tin nhắn/tháng`
    );
    features.push(`${plan.maxStorage === -1 ? 'Unlimited' : plan.maxStorage}GB lưu trữ`);
    features.push(
      `${plan.maxApiCalls === -1 ? 'Unlimited' : plan.maxApiCalls.toLocaleString()} API calls`
    );

    // Advanced features
    if (plan.enableGoogleIntegration) features.push('🔗 Google Integration');
    if (plan.enableHandoverSystem) features.push('👥 Handover System');
    if (plan.enableAnalytics) features.push('📊 Analytics nâng cao');
    if (plan.enableCustomBranding) features.push('🎨 White-label branding');
    if (plan.enablePrioritySupport) features.push('⚡ Hỗ trợ ưu tiên');

    return features;
  };

  const getPlanGradient = (plan: SubscriptionPlan) => {
    if (plan.price === 0) return 'from-gray-600 to-gray-700';
    if (plan.isPopular) return 'from-blue-600 to-purple-600';
    if (plan.price >= 999) return 'from-yellow-500 to-orange-500';
    if (plan.price >= 299) return 'from-orange-600 to-red-600';
    if (plan.price >= 99) return 'from-purple-600 to-pink-600';
    return 'from-green-600 to-blue-600';
  };

  const getPlanEmoji = (plan: SubscriptionPlan) => {
    if (plan.price === 0) return '🎯';
    if (plan.isPopular) return '💡';
    if (plan.price >= 999) return '👑';
    if (plan.price >= 299) return '🏢';
    if (plan.price >= 99) return '🚀';
    return '⭐';
  };

  if (loading) {
    return (
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8'>
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className='bg-white/5 rounded-3xl p-8 border border-white/10'>
            <div className='animate-pulse space-y-4'>
              <div className='h-6 bg-white/10 rounded w-3/4 mx-auto'></div>
              <div className='h-4 bg-white/10 rounded w-full'></div>
              <div className='h-8 bg-white/10 rounded w-1/2 mx-auto'></div>
              <div className='space-y-2'>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className='h-3 bg-white/10 rounded w-full'></div>
                ))}
              </div>
              <div className='h-12 bg-white/10 rounded'></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Billing Toggle */}
      <div className='flex items-center justify-center space-x-4 mb-16'>
        <span className={`text-lg font-medium ${!isAnnual ? 'text-white' : 'text-gray-400'}`}>
          Hàng tháng
        </span>
        <button
          onClick={() => setIsAnnual(!isAnnual)}
          className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${
            isAnnual ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-600'
          }`}
        >
          <div
            className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 ${
              isAnnual ? 'translate-x-7' : 'translate-x-1'
            }`}
          ></div>
        </button>
        <span className={`text-lg font-medium ${isAnnual ? 'text-white' : 'text-gray-400'}`}>
          Hàng năm
        </span>
        <div className='px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full'>
          <span className='text-green-300 text-sm font-medium'>Tiết kiệm 17%</span>
        </div>
      </div>

      {/* Plans Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8'>
        {plans.map(plan => {
          const features = getPlanFeatures(plan);
          const gradient = getPlanGradient(plan);
          const emoji = getPlanEmoji(plan);
          const displayPrice =
            isAnnual && plan.price > 0 ? getAnnualPrice(plan.price) / 12 : plan.price;
          const annualSavings =
            isAnnual && plan.price > 0 ? plan.price * 12 - getAnnualPrice(plan.price) : 0;

          return (
            <div
              key={plan.id}
              className={`relative group p-8 rounded-3xl border backdrop-blur-sm transition-all duration-500 hover:scale-105 ${
                plan.isPopular
                  ? 'border-purple-500/50 bg-gradient-to-br from-purple-500/10 to-pink-500/10 ring-2 ring-purple-500/20 scale-105'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              {plan.isPopular && (
                <div className='absolute -top-4 left-1/2 transform -translate-x-1/2'>
                  <div className='px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full'>
                    <span className='text-white text-sm font-bold flex items-center space-x-1'>
                      <Star className='w-4 h-4 fill-current' />
                      <span>PHỔ BIẾN NHẤT</span>
                    </span>
                  </div>
                </div>
              )}

              <div className='text-center mb-8'>
                <div className='text-2xl mb-2'>
                  {emoji} {plan.name}
                </div>
                {plan.description && (
                  <p className='text-gray-400 text-sm mb-6'>{plan.description}</p>
                )}

                <div className='mb-6'>
                  {plan.price === 0 ? (
                    <div>
                      <span className='text-4xl font-black bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent'>
                        MIỄN PHÍ
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className='text-4xl font-black text-white'>
                        {formatPrice(displayPrice, plan.currency)}
                      </span>
                      <span className='text-gray-400 text-lg'>/tháng</span>
                      {isAnnual && annualSavings > 0 && (
                        <div className='text-sm text-green-400'>
                          Tiết kiệm {formatPrice(annualSavings, plan.currency)}/năm
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <ul className='space-y-4 mb-8'>
                {features.map((feature, featureIndex) => (
                  <li key={featureIndex} className='flex items-start space-x-3'>
                    <div className='w-5 h-5 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5'>
                      <CheckCircle className='w-3 h-3 text-white' />
                    </div>
                    <span className='text-gray-300 text-sm leading-relaxed'>{feature}</span>
                  </li>
                ))}
              </ul>

              <a
                href={plan.price === 0 ? '/dashboard' : `/payment?plan=${plan.name.toLowerCase()}`}
                className={`block w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl text-center bg-gradient-to-r ${gradient} text-white hover:shadow-lg`}
              >
                {plan.price === 0 ? 'Dùng thử ngay' : 'Chọn gói này'}
              </a>
            </div>
          );
        })}
      </div>
    </>
  );
}
