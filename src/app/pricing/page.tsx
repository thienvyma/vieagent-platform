'use client';

import { useState, useEffect } from 'react';
import PageLayout from '@/components/ui/PageLayout';
import Section, { SectionHeader, GridSection } from '@/components/ui/Section';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch plans from API
  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/public/plans');
      const data = await response.json();

      if (data.success) {
        const formattedPlans = data.data.map((plan: any) => ({
          name: plan.name,
          description:
            plan.description || `Gói ${plan.name.toLowerCase()} phù hợp cho nhu cầu của bạn`,
          price: {
            monthly: plan.price === -1 ? 0 : plan.price,
            annual: plan.price === -1 ? 0 : Math.round(plan.price * 12 * 0.8), // 20% discount for annual
          },
          badge: getBadgeForPlan(plan.name),
          features: plan.features,
          gradient: getGradientForPlan(plan.name),
          buttonStyle: plan.price === -1 ? 'outline' : 'primary',
          popular: plan.popular || plan.name === 'Basic',
          isContactPricing: plan.price === -1,
          originalPlan: plan,
        }));
        setPlans(formattedPlans);
      } else {
        // Fallback to hardcoded plans
        setPlans(getFallbackPlans());
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
      // Fallback to hardcoded plans
      setPlans(getFallbackPlans());
    } finally {
      setLoading(false);
    }
  };

  const getBadgeForPlan = (planName: string) => {
    const badges: { [key: string]: string } = {
      Trial: '🎯 Bắt đầu',
      Basic: '💡 Phổ biến',
      Pro: '🚀 Tốt nhất',
      Enterprise: '🏢 Doanh nghiệp',
      Ultimate: '👑 Unlimited',
    };
    return badges[planName] || '✨ Đặc biệt';
  };

  const getGradientForPlan = (planName: string) => {
    const gradients: { [key: string]: string } = {
      Trial: 'from-gray-600 to-gray-700',
      Basic: 'from-blue-600 to-purple-600',
      Pro: 'from-purple-600 to-pink-600',
      Enterprise: 'from-orange-600 to-red-600',
      Ultimate: 'from-yellow-500 to-orange-500',
    };
    return gradients[planName] || 'from-blue-600 to-purple-600';
  };

  const getFallbackPlans = () => [
    {
      name: 'Trial',
      description: 'Dùng thử miễn phí',
      price: { monthly: 0, annual: 0 },
      badge: '🎯 Bắt đầu',
      features: [
        '1 VIEAgent',
        '100 tin nhắn/tháng',
        'Mô hình GPT-3.5 Turbo',
        'Chat interface cơ bản',
        'Hỗ trợ email',
        '7 ngày dùng thử',
      ],
      gradient: 'from-gray-600 to-gray-700',
      buttonStyle: 'outline',
      popular: false,
    },
    {
      name: 'Basic',
      description: 'Cho cá nhân và freelancer',
      price: { monthly: 29, annual: 290 },
      badge: '💡 Phổ biến',
      features: [
        '3 VIEAgents',
        '1,000 tin nhắn/tháng',
        'GPT-3.5 + Claude Haiku',
        'Giao diện chat nâng cao',
        'Tích hợp API cơ bản',
        'Hỗ trợ 24/7',
        'Tùy chỉnh personality',
      ],
      gradient: 'from-blue-600 to-purple-600',
      buttonStyle: 'primary',
      popular: true,
    },
    {
      name: 'Pro',
      description: 'Cho doanh nghiệp nhỏ',
      price: { monthly: 99, annual: 990 },
      badge: '🚀 Tốt nhất',
      features: [
        '10 VIEAgents',
        '10,000 tin nhắn/tháng',
        'Tất cả mô hình AI',
        'Deployment VPS',
        'Phân tích nâng cao',
        'API không giới hạn',
        'White-label branding',
        'Hỗ trợ ưu tiên',
      ],
      gradient: 'from-purple-600 to-pink-600',
      buttonStyle: 'primary',
      popular: false,
    },
    {
      name: 'Enterprise',
      description: 'Cho doanh nghiệp lớn',
      price: { monthly: 299, annual: 2990 },
      badge: '🏢 Doanh nghiệp',
      features: [
        '50 VIEAgents',
        '100,000 tin nhắn/tháng',
        'Mô hình AI tùy chỉnh',
        'Multi-cloud deployment',
        'SSO & Security nâng cao',
        'Dedicated support',
        'Custom integrations',
        'SLA 99.9%',
        'Training & onboarding',
      ],
      gradient: 'from-orange-600 to-red-600',
      buttonStyle: 'primary',
      popular: false,
    },
    {
      name: 'Ultimate',
      description: 'Cho tập đoàn & startup unicorn',
      price: { monthly: 999, annual: 9990 },
      badge: '👑 Unlimited',
      features: [
        'Unlimited VIEAgents',
        'Unlimited tin nhắn',
        'Private AI model hosting',
        'Global edge deployment',
        'AI model fine-tuning',
        '24/7 dedicated team',
        'Custom AI development',
        'Enterprise security audit',
        'Compliance support',
        'Custom contract terms',
      ],
      gradient: 'from-yellow-500 to-orange-500',
      buttonStyle: 'primary',
      popular: false,
    },
  ];

  // Feature comparison data
  const featureComparison = [
    {
      name: 'VIEAgents',
      trial: '1',
      basic: '3',
      pro: '10',
      enterprise: '50',
      ultimate: 'Unlimited',
    },
    {
      name: 'Tin nhắn/tháng',
      trial: '100',
      basic: '1,000',
      pro: '10,000',
      enterprise: '100,000',
      ultimate: 'Unlimited',
    },
    {
      name: 'AI Models',
      trial: 'GPT-3.5',
      basic: 'GPT-3.5 + Claude',
      pro: 'All Models',
      enterprise: 'Custom Models',
      ultimate: 'Private Hosting',
    },
    {
      name: 'API Calls',
      trial: '❌',
      basic: 'Limited',
      pro: 'Unlimited',
      enterprise: 'Unlimited',
      ultimate: 'Unlimited',
    },
    {
      name: 'VPS Deployment',
      trial: '❌',
      basic: '❌',
      pro: '✅',
      enterprise: '✅',
      ultimate: '✅',
    },
    {
      name: 'Analytics',
      trial: 'Basic',
      basic: 'Standard',
      pro: 'Advanced',
      enterprise: 'Enterprise',
      ultimate: 'Custom',
    },
    {
      name: 'Support',
      trial: 'Email',
      basic: '24/7 Chat',
      pro: 'Priority',
      enterprise: 'Dedicated',
      ultimate: 'Personal Team',
    },
    { name: 'White-label', trial: '❌', basic: '❌', pro: '✅', enterprise: '✅', ultimate: '✅' },
    {
      name: 'Custom Integration',
      trial: '❌',
      basic: '❌',
      pro: 'Limited',
      enterprise: '✅',
      ultimate: '✅',
    },
    {
      name: 'SLA',
      trial: '❌',
      basic: '99%',
      pro: '99.5%',
      enterprise: '99.9%',
      ultimate: '99.99%',
    },
  ];

  // FAQ data
  const faqs = [
    {
      question: 'Tôi có thể hủy subscription bất cứ lúc nào không?',
      answer:
        'Có, bạn có thể hủy subscription bất cứ lúc nào mà không cần lý do. Không có phí hủy và bạn vẫn có thể sử dụng dịch vụ đến hết chu kỳ thanh toán hiện tại.',
    },
    {
      question: 'Tôi có thể thay đổi gói dịch vụ sau khi đăng ký không?',
      answer:
        'Tất nhiên! Bạn có thể nâng cấp hoặc hạ cấp gói dịch vụ bất cứ lúc nào từ dashboard. Việc thay đổi sẽ có hiệu lực ngay lập tức và phí sẽ được tính theo tỷ lệ.',
    },
    {
      question: 'AI models nào được hỗ trợ?',
      answer:
        'Chúng tôi hỗ trợ GPT-4, GPT-3.5, Claude 3, Gemini Pro, Llama 2, và nhiều models khác. Gói Enterprise và Ultimate có thể sử dụng custom models hoặc fine-tuned models riêng.',
    },
    {
      question: 'Dữ liệu của tôi có an toàn không?',
      answer:
        'Bảo mật là ưu tiên hàng đầu. Chúng tôi sử dụng encryption end-to-end, tuân thủ GDPR, SOC 2, và có đội ngũ security chuyên nghiệp giám sát 24/7.',
    },
    {
      question: 'Có hỗ trợ tiếng Việt không?',
      answer:
        'Có! Platform của chúng tôi hỗ trợ đầy đủ tiếng Việt, bao gồm giao diện, AI responses, và customer support. Team support Việt Nam luôn sẵn sàng hỗ trợ bạn.',
    },
    {
      question: 'Enterprise plan có những gì đặc biệt?',
      answer:
        'Enterprise plan bao gồm: dedicated infrastructure, custom AI models, advanced security, compliance support, dedicated success manager, và SLA 99.9%. Liên hệ sales để được tư vấn chi tiết.',
    },
  ];

  if (loading) {
    return (
      <PageLayout
        title='CHỌN GÓI DỊCH VỤ PHÙ HỢP VỚI BẠN'
        description='Đang tải danh sách gói dịch vụ...'
        badge={{
          text: '💎 Pricing Plans',
          gradient: 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30',
        }}
      >
        <Section centered>
          <div className='flex items-center justify-center space-x-3 py-12'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500'></div>
            <span className='text-gray-300'>Đang tải gói dịch vụ...</span>
          </div>
        </Section>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title='CHỌN GÓI DỊCH VỤ PHÙ HỢP VỚI BẠN'
      description={
        <>
          Từ startup đến enterprise, chúng tôi có gói dịch vụ hoàn hảo cho hành trình AI của bạn
          <br />
          <span className='text-purple-400'>Bắt đầu miễn phí, scale không giới hạn</span>
        </>
      }
      badge={{
        text: '💎 Pricing Plans',
        gradient: 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30',
      }}
    >
      {/* Pricing Toggle */}
      <Section padding='sm' centered>
        <div className='flex items-center justify-center space-x-4 mb-12'>
          <span className={`text-lg font-medium ${!isAnnual ? 'text-white' : 'text-gray-400'}`}>
            Monthly
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none ${
              isAnnual ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                isAnnual ? 'translate-x-9' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-lg font-medium ${isAnnual ? 'text-white' : 'text-gray-400'}`}>
            Annual
          </span>
          {isAnnual && (
            <span className='px-3 py-1 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-full text-green-300 text-sm font-medium'>
              Save 20%
            </span>
          )}
        </div>
      </Section>

      {/* Pricing Cards */}
      <Section>
        <GridSection
          columns={{ default: 1, md: 2, lg: 3, xl: 5 }}
          gap='lg'
          className='max-w-7xl mx-auto'
        >
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative group ${plan.popular ? 'lg:scale-105 lg:-mt-4' : ''}`}
            >
              {plan.popular && (
                <div className='absolute -top-4 left-1/2 transform -translate-x-1/2 z-10'>
                  <div className='px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white text-sm font-bold'>
                    🔥 Most Popular
                  </div>
                </div>
              )}

              <Card className='h-full text-center'>
                <div
                  className={`w-16 h-16 bg-gradient-to-r ${plan.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <span className='text-3xl'>💎</span>
                </div>

                <div className='px-3 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-full text-blue-300 text-sm font-medium mb-4 inline-block'>
                  {plan.badge}
                </div>

                <h3 className='text-2xl font-black text-white mb-2'>{plan.name}</h3>
                <p className='text-gray-400 text-sm mb-4'>{plan.description}</p>

                <div className='mb-8'>
                  <span className='text-4xl lg:text-5xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent'>
                    ${isAnnual ? Math.round(plan.price.annual / 12) : plan.price.monthly}
                  </span>
                  <span className='text-gray-400 text-lg'>/tháng</span>
                  {isAnnual && plan.price.annual > 0 && (
                    <div className='text-sm text-gray-500 mt-1'>
                      Billed annually: ${plan.price.annual}
                    </div>
                  )}
                </div>

                <ul className='space-y-3 mb-8 text-left'>
                  {plan.features.map((feature: string, idx: number) => (
                    <li key={idx} className='flex items-center space-x-3'>
                      <div className='w-5 h-5 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center flex-shrink-0'>
                        <svg
                          className='w-3 h-3 text-white'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M5 13l4 4L19 7'
                          />
                        </svg>
                      </div>
                      <span className='text-gray-300 text-sm'>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  href={
                    plan.isContactPricing
                      ? '/contact'
                      : plan.price.monthly === 0
                        ? '/register'
                        : `/payment?plan=${plan.name.toLowerCase()}`
                  }
                  variant={plan.buttonStyle as any}
                  gradient={plan.gradient}
                  fullWidth
                  icon={
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M13 7l5 5m0 0l-5 5m5-5H6'
                      />
                    </svg>
                  }
                  iconPosition='right'
                >
                  {plan.isContactPricing
                    ? 'Liên hệ'
                    : plan.price.monthly === 0
                      ? 'Bắt đầu miễn phí'
                      : `Chọn ${plan.name}`}
                </Button>
              </Card>
            </div>
          ))}
        </GridSection>
      </Section>

      {/* Feature Comparison */}
      <Section>
        <SectionHeader
          title='SO SÁNH CHI TIẾT'
          description='Tìm hiểu chi tiết về tính năng và giới hạn của từng gói dịch vụ'
        />

        <Card padding='lg'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-gray-700'>
                  <th className='text-left py-4 px-4 text-white font-bold'>Features</th>
                  <th className='text-center py-4 px-4 text-white font-bold'>Trial</th>
                  <th className='text-center py-4 px-4 text-white font-bold'>Basic</th>
                  <th className='text-center py-4 px-4 text-white font-bold bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg'>
                    Pro <span className='text-pink-400'>★</span>
                  </th>
                  <th className='text-center py-4 px-4 text-white font-bold'>Enterprise</th>
                  <th className='text-center py-4 px-4 text-white font-bold'>Ultimate</th>
                </tr>
              </thead>
              <tbody>
                {featureComparison.map((feature: any, index: number) => (
                  <tr
                    key={index}
                    className='border-b border-gray-800/50 hover:bg-white/5 transition-colors'
                  >
                    <td className='py-4 px-4 text-gray-300 font-medium'>{feature.name}</td>
                    <td className='py-4 px-4 text-center text-gray-400'>{feature.trial}</td>
                    <td className='py-4 px-4 text-center text-gray-300'>{feature.basic}</td>
                    <td className='py-4 px-4 text-center text-purple-300 font-semibold'>
                      {feature.pro}
                    </td>
                    <td className='py-4 px-4 text-center text-orange-300'>{feature.enterprise}</td>
                    <td className='py-4 px-4 text-center text-yellow-300 font-semibold'>
                      {feature.ultimate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Section>

      {/* FAQ Section */}
      <Section>
        <SectionHeader
          title='CÂU HỎI THƯỜNG GẶP'
          description='Tìm hiểu thêm về dịch vụ và gói cước của chúng tôi'
          badge={{
            text: '❓ FAQ',
            gradient:
              'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30',
          }}
        />

        <div className='max-w-4xl mx-auto space-y-6'>
          {faqs.map((faq, index) => (
            <Card key={index}>
              <h3 className='text-xl font-bold text-white mb-4 flex items-center space-x-3'>
                <span className='text-2xl'>💡</span>
                <span>{faq.question}</span>
              </h3>
              <p className='text-gray-300 leading-relaxed'>{faq.answer}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* Enterprise CTA */}
      <Section background='gradient'>
        <Card rounded='3xl' border={false} backdrop={false} className='text-center p-12'>
          <h2 className='text-4xl md:text-5xl font-black bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-6'>
            CẦN GIẢI PHÁP
            <br />
            <span className='bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent'>
              ENTERPRISE?
            </span>
          </h2>

          <p className='text-xl text-gray-300 mb-8 leading-relaxed'>
            Doanh nghiệp lớn cần giải pháp AI tùy chỉnh? Chúng tôi có đội ngũ experts sẵn sàng tư
            vấn
            <br />
            <span className='text-purple-400'>
              solution phù hợp với quy mô và ngành nghề của bạn
            </span>
          </p>

          <div className='flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6'>
            <Button
              href='/contact'
              size='lg'
              icon={
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M13 7l5 5m0 0l-5 5m5-5H6'
                  />
                </svg>
              }
              iconPosition='right'
            >
              💬 Tư vấn miễn phí
            </Button>

            <Button href='mailto:enterprise@aiagentplatform.com' variant='outline' size='lg'>
              📧 Email Enterprise
            </Button>
          </div>

          <div className='mt-8 text-gray-400'>
            <p className='text-sm'>
              🏢 Trusted by 500+ enterprises • ⚡ Setup trong 24h • 🛡️ Enterprise security
            </p>
          </div>
        </Card>
      </Section>

      {/* Final CTA */}
      <Section>
        <div className='text-center'>
          <h2 className='text-4xl md:text-5xl font-black bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-6'>
            SẴN SÀNG BẮT ĐẦU
            <br />
            <span className='bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent'>
              HÀNH TRÌNH AI?
            </span>
          </h2>

          <p className='text-xl text-gray-300 mb-8 leading-relaxed'>
            Tham gia cùng hàng nghìn doanh nghiệp đã tin tưởng VIEAgent
            <br />
            <span className='text-purple-400'>Bắt đầu miễn phí ngay hôm nay!</span>
          </p>

          <div className='flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6'>
            <Button
              href='/dashboard'
              size='xl'
              gradient='from-blue-600 via-purple-600 to-pink-600'
              icon={
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M13 7l5 5m0 0l-5 5m5-5H6'
                  />
                </svg>
              }
              iconPosition='right'
            >
              🚀 Dùng thử miễn phí
            </Button>

            <Button href='/contact' variant='outline' size='xl'>
              💬 Liên hệ tư vấn
            </Button>
          </div>
        </div>
      </Section>
    </PageLayout>
  );
}
