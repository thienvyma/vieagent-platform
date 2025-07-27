'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, AlertCircle } from 'lucide-react';
import PageLayout from '@/components/ui/PageLayout';
import Section, { SectionHeader, GridSection } from '@/components/ui/Section';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface ContactFormData {
  name: string;
  email: string;
  company: string;
  subject: string;
  message: string;
  contactReason: string;
}

export default function ContactPage() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: '',
    contactReason: 'general',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus('success');
        setMessage('Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi trong vòng 24 giờ.');
        setFormData({
          name: '',
          email: '',
          company: '',
          subject: '',
          message: '',
          contactReason: 'general',
        });
      } else {
        setSubmitStatus('error');
        setMessage(data.error || 'Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } catch (error) {
      setSubmitStatus('error');
      setMessage('Lỗi kết nối. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactReasons = [
    { value: 'general', label: 'Tư vấn tổng quát' },
    { value: 'sales', label: 'Thông tin pricing & sales' },
    { value: 'technical', label: 'Hỗ trợ kỹ thuật' },
    { value: 'partnership', label: 'Đối tác kinh doanh' },
    { value: 'enterprise', label: 'Giải pháp Enterprise' },
    { value: 'media', label: 'Báo chí & truyền thông' },
  ];

  const contactInfo = [
    {
      icon: <Mail className='w-6 h-6' />,
      title: 'Email',
      details: ['support@aiagentplatform.com', 'sales@aiagentplatform.com'],
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: <Phone className='w-6 h-6' />,
      title: 'Điện thoại',
      details: ['+84 123 456 789', '+84 987 654 321'],
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      icon: <MapPin className='w-6 h-6' />,
      title: 'Địa chỉ',
      details: ['123 Nguyễn Huệ, Quận 1', 'TP. Hồ Chí Minh, Việt Nam'],
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: <Clock className='w-6 h-6' />,
      title: 'Giờ làm việc',
      details: ['Thứ 2 - Thứ 6: 8:00 - 18:00', 'Thứ 7: 9:00 - 12:00'],
      gradient: 'from-orange-500 to-red-500',
    },
  ];

  const faqs = [
    {
      question: 'Thời gian phản hồi trung bình là bao lâu?',
      answer:
        'Chúng tôi cam kết phản hồi tất cả yêu cầu trong vòng 24 giờ làm việc. Đối với các vấn đề urgent, chúng tôi sẽ phản hồi ngay trong vòng 2-4 giờ.',
    },
    {
      question: 'Tôi có thể đặt lịch demo trực tiếp không?',
      answer:
        "Tất nhiên! Chọn 'Tư vấn tổng quát' hoặc 'Thông tin pricing & sales' trong form và mention về việc muốn demo. Chúng tôi sẽ arrange một session phù hợp.",
    },
    {
      question: 'Có hỗ trợ tiếng Việt không?',
      answer:
        'Có, đội ngũ support của chúng tôi hỗ trợ đầy đủ tiếng Việt. Bạn có thể liên hệ bằng tiếng Việt hoặc tiếng Anh.',
    },
    {
      question: 'Enterprise contracts được xử lý như thế nào?',
      answer:
        'Với enterprise clients, chúng tôi có dedicated account managers để discuss requirements chi tiết và customize solutions phù hợp.',
    },
  ];

  return (
    <PageLayout
      title={
        <>
          Liên hệ với{' '}
          <span className='bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent'>
            đội ngũ experts
          </span>
        </>
      }
      description='Chúng tôi luôn sẵn sàng hỗ trợ và tư vấn giải pháp AI phù hợp nhất cho doanh nghiệp của bạn'
      badge={{
        text: '📞 Hỗ trợ 24/7',
        gradient: 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30',
      }}
    >
      {/* Contact Info */}
      <Section>
        <GridSection columns={{ default: 1, md: 2, lg: 4 }} gap='lg'>
          {contactInfo.map((info, index) => (
            <Card key={index} className='text-center'>
              <div
                className={`w-12 h-12 bg-gradient-to-r ${info.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4`}
              >
                {info.icon}
              </div>
              <h3 className='text-lg font-semibold text-white mb-3'>{info.title}</h3>
              <div className='space-y-1'>
                {info.details.map((detail, idx) => (
                  <p key={idx} className='text-gray-300 text-sm'>
                    {detail}
                  </p>
                ))}
              </div>
            </Card>
          ))}
        </GridSection>
      </Section>

      {/* Contact Form */}
      <Section>
        <div className='max-w-4xl mx-auto'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-12'>
            {/* Form */}
            <Card>
              <div className='mb-8'>
                <h2 className='text-2xl font-bold text-white mb-2'>Gửi tin nhắn</h2>
                <p className='text-gray-300'>
                  Điền thông tin bên dưới và chúng tôi sẽ liên hệ sớm nhất
                </p>
              </div>

              <form onSubmit={handleSubmit} className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>Họ tên *</label>
                    <input
                      type='text'
                      name='name'
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className='w-full px-4 py-3 bg-white/10 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
                      placeholder='Nguyễn Văn A'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>Email *</label>
                    <input
                      type='email'
                      name='email'
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className='w-full px-4 py-3 bg-white/10 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
                      placeholder='your-email@example.com'
                    />
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>Công ty</label>
                    <input
                      type='text'
                      name='company'
                      value={formData.company}
                      onChange={handleInputChange}
                      className='w-full px-4 py-3 bg-white/10 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
                      placeholder='Tên công ty'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      Lý do liên hệ
                    </label>
                    <select
                      name='contactReason'
                      value={formData.contactReason}
                      onChange={handleInputChange}
                      className='w-full px-4 py-3 bg-white/10 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                    >
                      {contactReasons.map(reason => (
                        <option key={reason.value} value={reason.value} className='bg-gray-800'>
                          {reason.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>Tiêu đề *</label>
                  <input
                    type='text'
                    name='subject'
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className='w-full px-4 py-3 bg-white/10 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    placeholder='Tiêu đề tin nhắn'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>Nội dung *</label>
                  <textarea
                    name='message'
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className='w-full px-4 py-3 bg-white/10 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
                    placeholder='Mô tả chi tiết yêu cầu của bạn...'
                  />
                </div>

                {/* Status Message */}
                {message && (
                  <div
                    className={`p-4 rounded-xl flex items-center space-x-3 ${
                      submitStatus === 'success'
                        ? 'bg-green-500/20 border border-green-500/30'
                        : 'bg-red-500/20 border border-red-500/30'
                    }`}
                  >
                    {submitStatus === 'success' ? (
                      <CheckCircle className='w-5 h-5 text-green-400' />
                    ) : (
                      <AlertCircle className='w-5 h-5 text-red-400' />
                    )}
                    <span
                      className={submitStatus === 'success' ? 'text-green-300' : 'text-red-300'}
                    >
                      {message}
                    </span>
                  </div>
                )}

                <Button
                  type='submit'
                  disabled={isSubmitting}
                  loading={isSubmitting}
                  fullWidth
                  size='lg'
                  icon={<Send className='w-5 h-5' />}
                  iconPosition='right'
                >
                  Gửi tin nhắn
                </Button>
              </form>
            </Card>

            {/* Additional Info */}
            <div className='space-y-8'>
              <Card>
                <h3 className='text-xl font-bold text-white mb-4'>💬 Response Time</h3>
                <div className='space-y-4'>
                  <div className='flex items-center space-x-3'>
                    <div className='w-3 h-3 bg-green-500 rounded-full'></div>
                    <div>
                      <p className='text-white font-medium'>General Inquiries</p>
                      <p className='text-gray-400 text-sm'>Trong vòng 24 giờ</p>
                    </div>
                  </div>
                  <div className='flex items-center space-x-3'>
                    <div className='w-3 h-3 bg-yellow-500 rounded-full'></div>
                    <div>
                      <p className='text-white font-medium'>Technical Support</p>
                      <p className='text-gray-400 text-sm'>Trong vòng 4 giờ</p>
                    </div>
                  </div>
                  <div className='flex items-center space-x-3'>
                    <div className='w-3 h-3 bg-red-500 rounded-full'></div>
                    <div>
                      <p className='text-white font-medium'>Emergency</p>
                      <p className='text-gray-400 text-sm'>Ngay lập tức</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className='text-xl font-bold text-white mb-4'>🎯 Sales Hotline</h3>
                <p className='text-gray-300 mb-4'>
                  Cần tư vấn nhanh về pricing và solutions? Gọi trực tiếp hotline sales:
                </p>
                <div className='space-y-2'>
                  <a
                    href='tel:+84123456789'
                    className='flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors'
                  >
                    <Phone className='w-4 h-4' />
                    <span className='font-medium'>+84 123 456 789</span>
                  </a>
                  <p className='text-gray-400 text-sm'>Thứ 2 - Chủ nhật: 8:00 - 22:00</p>
                </div>
              </Card>

              <Card>
                <h3 className='text-xl font-bold text-white mb-4'>🚀 Quick Demo</h3>
                <p className='text-gray-300 mb-4'>
                  Muốn xem demo nhanh? Book một 15-minute demo session:
                </p>
                <Button href='/dashboard' variant='outline' fullWidth>
                  Book Demo Session
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </Section>

      {/* FAQ Section */}
      <Section background='dark'>
        <SectionHeader
          title='❓ Câu hỏi thường gặp'
          description='Một số câu hỏi phổ biến về việc liên hệ và hỗ trợ'
        />

        <div className='max-w-4xl mx-auto'>
          <GridSection columns={{ default: 1, md: 2 }} gap='lg'>
            {faqs.map((faq, index) => (
              <Card key={index}>
                <h3 className='text-lg font-semibold text-white mb-3'>{faq.question}</h3>
                <p className='text-gray-300 leading-relaxed'>{faq.answer}</p>
              </Card>
            ))}
          </GridSection>
        </div>
      </Section>

      {/* Final CTA */}
      <Section background='gradient'>
        <Card rounded='3xl' border={false} backdrop={false} className='text-center p-12'>
          <h2 className='text-3xl md:text-4xl font-black bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-6'>
            SẴN SÀNG KHÁM PHÁ
            <br />
            <span className='bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent'>
              VIEAGENT?
            </span>
          </h2>

          <p className='text-xl text-gray-300 mb-8 leading-relaxed max-w-3xl mx-auto'>
            Đừng chờ đợi! Bắt đầu journey AI transformation ngay hôm nay với 7 ngày dùng thử miễn
            phí.
          </p>

          <div className='flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6'>
            <Button href='/register' size='xl' gradient='from-blue-600 via-purple-600 to-pink-600'>
              🚀 Dùng thử miễn phí
            </Button>

            <Button href='/dashboard' variant='outline' size='xl'>
              📊 Xem Demo
            </Button>
          </div>
        </Card>
      </Section>
    </PageLayout>
  );
}
