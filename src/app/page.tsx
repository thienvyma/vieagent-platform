'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  ArrowRight,
  Star,
  CheckCircle,
  Play,
  Zap,
  Shield,
  Globe,
  Users,
  TrendingUp,
  Award,
  Menu,
  X,
  Brain,
  Rocket,
  Target,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Eye,
} from 'lucide-react';
import PageLayout from '@/components/ui/PageLayout';
import Section, { SectionHeader, GridSection } from '@/components/ui/Section';
import Card, { StatCard, FeatureCard } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface FeaturedContent {
  id: string;
  title: string;
  excerpt: string;
  url?: string;
  image?: string;
  author?: string;
  authorImage?: string;
  publishedAt?: string;
  viewCount?: number;
  category?: string;
  tags?: string[];
  company?: string;
  rating?: number;
  type?: string;
}

interface NewsletterFormData {
  email: string;
  name: string;
  interests: string[];
}

export default function HomePage() {
  const [featuredBlogs, setFeaturedBlogs] = useState<FeaturedContent[]>([]);
  const [testimonials, setTestimonials] = useState<FeaturedContent[]>([]);
  const [newsletterForm, setNewsletterForm] = useState<NewsletterFormData>({
    email: '',
    name: '',
    interests: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch featured content on component mount
  useEffect(() => {
    const fetchFeaturedContent = async () => {
      try {
        // Fetch featured blogs
        const blogsResponse = await fetch('/api/featured-content?type=blog_post&limit=3');
        const blogsData = await blogsResponse.json();
        setFeaturedBlogs(blogsData.content || []);

        // Fetch testimonials
        const testimonialsResponse = await fetch('/api/featured-content?type=testimonial&limit=3');
        const testimonialsData = await testimonialsResponse.json();
        setTestimonials(testimonialsData.content || []);
      } catch (error) {
        console.error('Error fetching featured content:', error);
      }
    };

    fetchFeaturedContent();
  }, []);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newsletterForm,
          source: 'landing',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('🎉 Đăng ký thành công! Kiểm tra email để xác nhận.');
        setNewsletterForm({ email: '', name: '', interests: [] });
      } else {
        setMessage(data.error || 'Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } catch (error) {
      setMessage('Lỗi kết nối. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    {
      icon: <Brain className='w-8 h-8' />,
      title: 'Intelligent VIEAgents',
      description: 'Tạo AI agents thông minh với khả năng học hỏi và tự động hóa complex workflows',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: <Zap className='w-8 h-8' />,
      title: 'Lightning Fast Processing',
      description: 'Xử lý hàng nghìn requests đồng thời với độ trễ < 100ms',
      gradient: 'from-yellow-500 to-orange-500',
    },
    {
      icon: <Shield className='w-8 h-8' />,
      title: 'Enterprise Security',
      description: 'Bảo mật cấp enterprise với encryption end-to-end và compliance standards',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      icon: <Globe className='w-8 h-8' />,
      title: 'Multi-platform Integration',
      description: 'Kết nối với 100+ platforms và services phổ biến',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: <TrendingUp className='w-8 h-8' />,
      title: 'Advanced Analytics',
      description: 'Dashboard analytics với real-time insights và predictive modeling',
      gradient: 'from-red-500 to-rose-500',
    },
    {
      icon: <Target className='w-8 h-8' />,
      title: 'Custom AI Models',
      description: 'Train và deploy custom AI models phù hợp với business domain',
      gradient: 'from-indigo-500 to-blue-500',
    },
  ];

  const stats = [
    { icon: '👥', value: '50K+', label: 'Active Users' },
    { icon: '⚡', value: '99.9%', label: 'Uptime SLA' },
    { icon: '📈', value: '300%', label: 'Efficiency Boost' },
    { icon: '🛟', value: '24/7', label: 'Support' },
  ];

  return (
    <PageLayout
      title={
        <>
          Tương lai của{' '}
          <span className='bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent'>
            AI Automation
          </span>
          <br />
          bắt đầu từ đây
        </>
      }
      description={
        <>
          Xây dựng và triển khai VIEAgents thông minh để{' '}
          <span className='font-semibold text-blue-400'>tự động hóa quy trình kinh doanh</span>,
          tăng hiệu suất 300% và mang lại trải nghiệm khách hàng tuyệt vời.
        </>
      }
      badge={{
        text: '⭐ Top 10 AI Platform 2024 - Trusted by 50,000+ businesses',
        gradient:
          'bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium border border-blue-500/30',
      }}
    >
      {/* CTA Buttons in Hero */}
      <Section padding='none'>
        <div className='flex flex-col sm:flex-row gap-4 justify-center mb-12'>
          <Button
            href='/register'
            size='lg'
            icon={<Rocket className='w-5 h-5' />}
            iconPosition='left'
          >
            Bắt đầu miễn phí ngay
            <ArrowRight className='w-5 h-5 ml-2' />
          </Button>

          <Button variant='outline' size='lg' icon={<Play className='w-5 h-5' />}>
            Xem Demo (2 phút)
          </Button>
        </div>

        {/* Social Proof */}
        <div className='flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-gray-400'>
          <div className='flex items-center space-x-2'>
            <div className='flex'>
              {[...Array(5)].map((_, i) => (
                <Star key={i} className='w-4 h-4 text-yellow-400 fill-current' />
              ))}
            </div>
            <span className='font-medium'>4.9/5 từ 2,500+ đánh giá</span>
          </div>
          <div className='flex items-center space-x-2'>
            <Users className='w-5 h-5 text-blue-400' />
            <span className='font-medium'>50,000+ doanh nghiệp tin tưởng</span>
          </div>
          <div className='flex items-center space-x-2'>
            <Award className='w-5 h-5 text-green-400' />
            <span className='font-medium'>99.9% uptime SLA</span>
          </div>
        </div>
      </Section>

      {/* Features Section */}
      <Section>
        <SectionHeader
          title='🚀 Tính năng vượt trội'
          description='Hệ sinh thái AI hoàn chỉnh để biến đổi cách doanh nghiệp vận hành'
        />

        <GridSection columns={{ default: 1, md: 2, lg: 3 }} gap='lg'>
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              gradient={feature.gradient}
            />
          ))}
        </GridSection>
      </Section>

      {/* Stats Section */}
      <Section background='dark'>
        <GridSection columns={{ default: 2, lg: 4 }} gap='lg'>
          {stats.map((stat, index) => (
            <StatCard key={index} icon={stat.icon} title={stat.label} value={stat.value} />
          ))}
        </GridSection>
      </Section>

      {/* Featured Blog Posts */}
      {featuredBlogs.length > 0 && (
        <Section>
          <SectionHeader
            title='📝 Blog nổi bật'
            description='Cập nhật xu hướng AI mới nhất và case studies thực tế'
          />

          <GridSection columns={{ default: 1, md: 2, lg: 3 }} gap='lg' className='mb-12'>
            {featuredBlogs.map(blog => (
              <Link key={blog.id} href={blog.url || `/blog/${blog.id}`} className='group'>
                <Card>
                  <div className='flex items-center justify-between mb-4'>
                    <span className='px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium border border-blue-500/30'>
                      {blog.category || 'AI'}
                    </span>
                    <div className='flex items-center text-gray-400 text-sm'>
                      <Eye className='w-4 h-4 mr-1' />
                      <span>{blog.viewCount?.toLocaleString()}</span>
                    </div>
                  </div>

                  <h3 className='text-xl font-semibold text-white mb-3 group-hover:text-blue-400 transition-colors line-clamp-2'>
                    {blog.title}
                  </h3>

                  <p className='text-gray-300 mb-4 line-clamp-3'>{blog.excerpt}</p>

                  <div className='flex items-center justify-between'>
                    <span className='text-gray-400 text-sm'>{blog.author}</span>
                    <span className='text-gray-500 text-sm'>{blog.publishedAt}</span>
                  </div>
                </Card>
              </Link>
            ))}
          </GridSection>

          <div className='text-center'>
            <Button href='/blog' icon={<ArrowRight className='w-4 h-4' />} iconPosition='right'>
              Xem tất cả bài viết
            </Button>
          </div>
        </Section>
      )}

      {/* Customer Testimonials */}
      {testimonials.length > 0 && (
        <Section background='dark'>
          <SectionHeader
            title='💬 Khách hàng nói gì về chúng tôi'
            description='Hàng nghìn doanh nghiệp đã tin tưởng và thành công với nền tảng AI của chúng tôi'
          />

          <GridSection columns={{ default: 1, md: 2, lg: 3 }} gap='lg'>
            {testimonials.map(testimonial => (
              <Card key={testimonial.id}>
                <div className='flex items-center mb-4'>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className='w-5 h-5 text-yellow-400 fill-current' />
                  ))}
                  <span className='ml-2 text-gray-300 font-medium'>
                    {testimonial.rating || 5}.0
                  </span>
                </div>

                <p className='text-gray-300 mb-6 leading-relaxed'>&quot;{testimonial.excerpt}&quot;</p>

                <div className='flex items-center'>
                  <div className='w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold mr-4'>
                    {testimonial.author?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <div className='font-semibold text-white'>{testimonial.author}</div>
                    <div className='text-gray-400 text-sm'>{testimonial.company}</div>
                  </div>
                </div>
              </Card>
            ))}
          </GridSection>
        </Section>
      )}

      {/* Newsletter CTA */}
      <Section>
        <div className='max-w-4xl mx-auto text-center'>
          <h2 className='text-3xl sm:text-4xl font-bold text-white mb-4'>
            📧 Cập nhật xu hướng AI hàng tuần
          </h2>
          <p className='text-gray-300 mb-8'>
            Nhận insights độc quyền, tutorials và AI trends từ đội ngũ experts
          </p>

          <Card className='max-w-md mx-auto'>
            <form onSubmit={handleNewsletterSubmit} className='space-y-4'>
              <input
                type='email'
                value={newsletterForm.email}
                onChange={e => setNewsletterForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder='your-email@example.com'
                className='w-full px-4 py-3 bg-white/10 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
                required
              />

              <Button type='submit' disabled={isSubmitting} loading={isSubmitting} fullWidth>
                Đăng ký nhận tin
              </Button>

              {message && (
                <p
                  className={`text-sm ${message.includes('thành công') ? 'text-green-400' : 'text-red-400'}`}
                >
                  {message}
                </p>
              )}
            </form>
          </Card>
        </div>
      </Section>

      {/* Final CTA */}
      <Section background='gradient'>
        <Card rounded='3xl' border={false} backdrop={false} className='text-center p-12'>
          <h2 className='text-4xl md:text-5xl font-black bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-6'>
            SẴN SÀNG BIẾN ĐỔI
            <br />
            <span className='bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent'>
              DOANH NGHIỆP CỦA BẠN?
            </span>
          </h2>

          <p className='text-xl text-gray-300 mb-8 leading-relaxed max-w-3xl mx-auto'>
            Tham gia cùng hàng nghìn doanh nghiệp đã tin tưởng VIEAgent để tự động hóa quy trình và
            tăng hiệu suất vượt trội.
          </p>

          <div className='flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6'>
            <Button
              href='/register'
              size='xl'
              gradient='from-blue-600 via-purple-600 to-pink-600'
              icon={<Rocket className='w-5 h-5' />}
              iconPosition='left'
            >
              🚀 Bắt đầu miễn phí
              <ArrowRight className='w-5 h-5 ml-2' />
            </Button>

            <Button href='/contact' variant='outline' size='xl'>
              💬 Liên hệ tư vấn
            </Button>
          </div>

          <div className='mt-8 text-gray-400'>
            <p className='text-sm'>
              🎯 Setup trong 5 phút • 🔄 7 ngày dùng thử miễn phí • 🛡️ Bảo mật enterprise
            </p>
          </div>
        </Card>
      </Section>
    </PageLayout>
  );
}
