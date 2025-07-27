'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link'; // ✅ fixed from LINTING_MANUAL_FIXES_NEEDED.md
import { VIEAgentLogo } from '@/components/ui/vieagent-logo';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  categories: string[];
  tags: string[];
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  author: {
    name: string | null;
    email: string;
  };
}

interface BlogCategory {
  id: string;
  name: string;
  count: number;
}

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);

  // Sample featured posts for demo
  const featuredPosts = [
    {
      id: '1',
      title: 'GPT-4 vs Claude vs Gemini: So sánh hiệu suất AI models 2024',
      excerpt:
        'Phân tích chi tiết performance, cost và use cases của 3 AI models hàng đầu hiện tại. Kết quả sẽ khiến bạn bất ngờ!',
      author: 'AI Research Team',
      publishedAt: '2024-01-15',
      readTime: '12 phút đọc',
      views: 15420,
      category: 'AI Comparison',
      image: '🧠',
      featured: true,
    },
    {
      id: '2',
      title: 'Xây dựng AI Customer Service: Từ Concept đến Production',
      excerpt:
        'Step-by-step guide để build chatbot AI có thể handle 80% customer queries. Bao gồm code examples và best practices.',
      author: 'Development Team',
      publishedAt: '2024-01-10',
      readTime: '18 phút đọc',
      views: 8930,
      category: 'Tutorial',
      image: '🛠️',
      featured: true,
    },
    {
      id: '3',
      title: 'AI ROI Case Study: Startup tăng revenue 300% với AI Agents',
      excerpt:
        'Câu chuyện thực tế về một startup e-commerce đã scale từ $10K đến $100K/tháng chỉ với AI automation.',
      author: 'Business Team',
      publishedAt: '2024-01-05',
      readTime: '8 phút đọc',
      views: 12150,
      category: 'Case Study',
      image: '📈',
      featured: true,
    },
  ];

  // Sample blog posts for demo
  const samplePosts = [
    {
      id: '4',
      title: 'Fine-tuning Open Source Models: Complete Guide',
      excerpt:
        'Học cách fine-tune Llama 2, Mistral cho use case riêng. Tiết kiệm 90% cost so với OpenAI API.',
      author: 'Tech Team',
      publishedAt: '2024-01-20',
      readTime: '15 phút',
      views: 5240,
      category: 'Technical',
      image: '⚙️',
    },
    {
      id: '5',
      title: 'AI Ethics: Responsible AI Development Best Practices',
      excerpt:
        'Guidelines để develop AI systems một cách ethical và responsible. Compliance với EU AI Act.',
      author: 'Ethics Committee',
      publishedAt: '2024-01-18',
      readTime: '10 phút',
      views: 3890,
      category: 'Ethics',
      image: '🛡️',
    },
    {
      id: '6',
      title: 'Vector Databases: RAG Implementation Deep Dive',
      excerpt:
        'So sánh Pinecone, Weaviate, Chroma cho RAG systems. Performance benchmarks và cost analysis.',
      author: 'Data Team',
      publishedAt: '2024-01-12',
      readTime: '14 phút',
      views: 7600,
      category: 'Technical',
      image: '��️',
    },
  ];

  // Fetch blog data
  useEffect(() => {
    const fetchBlogData = async () => {
      try {
        setLoading(true);

        // Fetch real blog data from API
        const response = await fetch('/api/featured-content?type=blog_post&limit=20');
        const data = await response.json();

        if (data.content) {
          setPosts(data.content);
        } else {
          setPosts([]);
        }

        setCategories([
          { id: 'all', name: 'Tất cả', count: data.pagination?.total || 0 },
          { id: 'ai-trends', name: 'AI Trends', count: 0 },
          { id: 'tutorial', name: 'Tutorial', count: 0 },
          { id: 'case-study', name: 'Case Study', count: 0 },
          { id: 'technical', name: 'Technical', count: 0 },
          { id: 'ethics', name: 'Ethics', count: 0 },
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Error fetching blog data:', err);

        // Fallback to sample data on error
        setPosts([]);
        setCategories([
          { id: 'all', name: 'Tất cả', count: 0 },
          { id: 'ai-trends', name: 'AI Trends', count: 0 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogData();
  }, [selectedCategory]);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      // Handle newsletter subscription
      setNewsletterSubmitted(true);
      setTimeout(() => setNewsletterSubmitted(false), 3000);
      setNewsletterEmail('');
    }
  };

  const getReadTime = (content: string = '') => {
    const wordsPerMinute = 200;
    const words = content.split(' ').length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} phút đọc`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getCategoryIcon = (categoryName: string) => {
    const icons: Record<string, string> = {
      'AI Trends': '🧠',
      Tutorial: '📚',
      'Case Study': '📊',
      Technical: '⚙️',
      Ethics: '🛡️',
      'AI Comparison': '⚖️',
    };
    return icons[categoryName] || '📝';
  };

  return (
    <div className='min-h-screen bg-black text-white'>
      {/* Background Effects */}
      <div className='fixed inset-0 z-0'>
        <div className='absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900'></div>
        <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse'></div>
        <div className='absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000'></div>
        <div className='absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]'></div>
      </div>

      {/* Header */}
      <header className='relative z-10 backdrop-blur-sm border-b border-gray-800/50'>
        <div className='container mx-auto px-4 py-6'>
          <nav className='flex justify-between items-center'>
            <div className='flex items-center space-x-3'>
              {/* ✅ fixed from LINTING_MANUAL_FIXES_NEEDED.md */}
              <Link href='/' className='flex items-center space-x-3 group'>
                <div className='w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300'>
                  <VIEAgentLogo size='small' />
                </div>
                <div>
                  <h1 className='text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent'>
                    VIEAgent
                  </h1>
                  <p className='text-xs text-gray-400'>Next-Gen Intelligence</p>
                </div>
              </Link>
            </div>

            {/* Navigation Menu */}
            <div className='hidden md:flex space-x-8'>
              <Link href='/' className='text-gray-300 hover:text-white transition-colors'>
                Trang chủ
              </Link>
              <Link href='/pricing' className='text-gray-300 hover:text-white transition-colors'>
                Pricing
              </Link>
              <Link
                href='/blog'
                className='text-white font-semibold transition-colors hover:text-blue-400'
              >
                Blog
              </Link>
              <Link href='/contact' className='text-gray-300 hover:text-white transition-colors'>
                Liên hệ
              </Link>
            </div>

            {/* Action Buttons */}
            <div className='flex space-x-4'>
              <a
                href='/login'
                className='group px-6 py-2 text-gray-300 hover:text-white transition-all duration-300 border border-gray-600 rounded-xl hover:border-gray-400 hover:shadow-lg hover:shadow-gray-500/20'
              >
                <span className='group-hover:scale-105 inline-block transition-transform'>
                  Login
                </span>
              </a>
              <a
                href='/dashboard'
                className='group px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-2xl hover:shadow-blue-500/30 hover:scale-105'
              >
                <span className='flex items-center space-x-2'>
                  <span>Get Started</span>
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
              </a>
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

      {/* Hero Section */}
      <section className='relative py-20 px-4'>
        <div className='container mx-auto text-center relative z-10'>
          <div className='max-w-4xl mx-auto'>
            <div className='inline-block mb-8'>
              <div className='px-6 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-full backdrop-blur-sm'>
                <span className='text-blue-300 text-sm font-medium'>📝 AI Blog</span>
              </div>
            </div>

            <h1 className='text-5xl md:text-6xl font-black mb-8 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent leading-tight'>
              KNOWLEDGE HUB
              <br />
              <span className='bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent'>
                AI & AUTOMATION
              </span>
            </h1>

            <p className='text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed'>
              Khám phá insights, tutorials và trends mới nhất về AI, automation
              <br />
              <span className='text-purple-400'>từ đội ngũ experts và community</span>
            </p>

            {/* Newsletter Signup */}
            <div className='max-w-md mx-auto'>
              <form onSubmit={handleNewsletterSubmit} className='flex space-x-4'>
                <input
                  type='email'
                  value={newsletterEmail}
                  onChange={e => setNewsletterEmail(e.target.value)}
                  placeholder='your-email@example.com'
                  className='flex-1 px-4 py-3 bg-white/10 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  required
                />
                <button
                  type='submit'
                  className='px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold'
                >
                  Subscribe
                </button>
              </form>
              {newsletterSubmitted && (
                <p className='text-green-400 text-sm mt-2'>✅ Đã đăng ký newsletter thành công!</p>
              )}
              <p className='text-gray-400 text-sm mt-2'>
                📧 Nhận weekly insights về AI trends & tutorials
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      <section className='relative py-20 px-4'>
        <div className='container mx-auto relative z-10'>
          <div className='text-center mb-16'>
            <div className='inline-block mb-8'>
              <div className='px-6 py-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-full backdrop-blur-sm'>
                <span className='text-orange-300 text-sm font-medium'>🔥 Featured</span>
              </div>
            </div>
            <h2 className='text-4xl md:text-5xl font-black bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-6'>
              BÀI VIẾT NỔI BẬT
            </h2>
            <p className='text-xl text-gray-300 max-w-3xl mx-auto'>
              Những insights và tutorials được đọc nhiều nhất tuần này
            </p>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto'>
            {/* Main Featured Post */}
            <div className='lg:col-span-2'>
              <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl h-full group'>
                <div className='text-6xl mb-6 group-hover:scale-110 transition-transform duration-300'>
                  {featuredPosts[0].image}
                </div>
                <div className='flex items-center space-x-4 mb-4'>
                  <span className='px-3 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-full text-blue-300 text-sm font-medium'>
                    {featuredPosts[0].category}
                  </span>
                  <span className='text-gray-400 text-sm'>{featuredPosts[0].readTime}</span>
                  <span className='text-gray-400 text-sm'>
                    👁️ {featuredPosts[0].views.toLocaleString()}
                  </span>
                </div>
                <h3 className='text-3xl font-bold text-white mb-4 group-hover:text-blue-300 transition-colors leading-tight'>
                  {featuredPosts[0].title}
                </h3>
                <p className='text-gray-300 leading-relaxed mb-6 text-lg'>
                  {featuredPosts[0].excerpt}
                </p>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-3'>
                    <div className='w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center'>
                      <span className='text-white text-sm font-bold'>A</span>
                    </div>
                    <div>
                      <span className='text-white font-medium'>{featuredPosts[0].author}</span>
                      <p className='text-gray-400 text-sm'>
                        {formatDate(featuredPosts[0].publishedAt)}
                      </p>
                    </div>
                  </div>
                  <a
                    href='#'
                    className='text-blue-400 hover:text-blue-300 transition-colors font-semibold flex items-center space-x-1'
                  >
                    <span>Read More</span>
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
                  </a>
                </div>
              </div>
            </div>

            {/* Side Featured Posts */}
            <div className='space-y-8'>
              {featuredPosts.slice(1).map((post, index) => (
                <div key={index} className='group'>
                  <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl h-full'>
                    <div className='text-4xl mb-4 group-hover:scale-110 transition-transform duration-300'>
                      {post.image}
                    </div>
                    <div className='flex items-center space-x-3 mb-3'>
                      <span className='px-2 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-full text-blue-300 text-xs font-medium'>
                        {post.category}
                      </span>
                      <span className='text-gray-400 text-xs'>{post.readTime}</span>
                    </div>
                    <h3 className='text-lg font-bold text-white mb-3 group-hover:text-blue-300 transition-colors leading-tight'>
                      {post.title}
                    </h3>
                    <p className='text-gray-300 text-sm leading-relaxed mb-4'>
                      {post.excerpt.substring(0, 120)}...
                    </p>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-gray-400'>by {post.author}</span>
                      <span className='text-gray-400'>👁️ {post.views.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories Filter */}
      {!loading && categories.length > 0 && (
        <section className='relative py-8 px-4'>
          <div className='container mx-auto relative z-10'>
            <div className='flex flex-wrap justify-center gap-4 mb-12'>
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-6 py-3 rounded-2xl font-medium transition-all duration-300 hover:scale-105 ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white border border-gray-600 hover:border-gray-400'
                  }`}
                >
                  {getCategoryIcon(category.name)} {category.name} ({category.count})
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Blog Posts Grid */}
      <section className='relative py-12 px-4'>
        <div className='container mx-auto relative z-10'>
          <div className='text-center mb-16'>
            <h2 className='text-3xl md:text-4xl font-black bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-6'>
              TẤT CẢ BÀI VIẾT
            </h2>
          </div>

          {loading ? (
            <div className='flex items-center justify-center py-20'>
              <div className='w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
            </div>
          ) : error ? (
            <div className='text-center py-20'>
              <div className='text-6xl mb-4'>❌</div>
              <h3 className='text-2xl font-bold text-white mb-4'>Có lỗi xảy ra</h3>
              <p className='text-gray-400'>{error}</p>
            </div>
          ) : posts.length === 0 ? (
            <div className='text-center py-20'>
              <div className='text-6xl mb-4'>📝</div>
              <h3 className='text-2xl font-bold text-white mb-4'>Chưa có bài viết</h3>
              <p className='text-gray-400'>Hãy quay lại sau để đọc những insights mới nhất</p>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto'>
              {posts.map(post => (
                <div key={post.id} className='group'>
                  <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl h-full'>
                    <div className='text-5xl mb-6 group-hover:scale-110 transition-transform duration-300'>
                      {(post as any).image}
                    </div>
                    <div className='flex items-center space-x-4 mb-4'>
                      <span className='px-3 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-full text-blue-300 text-sm font-medium'>
                        {(post as any).category}
                      </span>
                      <span className='text-gray-400 text-sm'>{(post as any).readTime}</span>
                    </div>
                    <h3 className='text-xl font-bold text-white mb-4 group-hover:text-blue-300 transition-colors leading-tight'>
                      {post.title}
                    </h3>
                    <p className='text-gray-300 leading-relaxed mb-6'>{post.excerpt}</p>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-3'>
                        <div className='w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center'>
                          <span className='text-white text-xs font-bold'>A</span>
                        </div>
                        <span className='text-gray-400 text-sm'>by {(post as any).author}</span>
                      </div>
                      <div className='flex items-center space-x-3 text-sm text-gray-400'>
                        <span>👁️ {(post as any).views}</span>
                        <a
                          href='#'
                          className='text-blue-400 hover:text-blue-300 transition-colors font-semibold'
                        >
                          Read →
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className='relative py-20 px-4'>
        <div className='container mx-auto relative z-10'>
          <div className='bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl p-12 border border-blue-500/20 text-center'>
            <div className='max-w-4xl mx-auto'>
              <h2 className='text-4xl md:text-5xl font-black bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-6'>
                ĐỪNG BỎ LỠ
                <br />
                <span className='bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent'>
                  AI INSIGHTS
                </span>
              </h2>

              <p className='text-xl text-gray-300 mb-8 leading-relaxed'>
                Nhận weekly newsletter với latest AI trends, tutorials và case studies
                <br />
                <span className='text-purple-400'>Được trusted bởi 10,000+ AI enthusiasts</span>
              </p>

              <div className='max-w-md mx-auto'>
                <form onSubmit={handleNewsletterSubmit} className='flex space-x-4'>
                  <input
                    type='email'
                    value={newsletterEmail}
                    onChange={e => setNewsletterEmail(e.target.value)}
                    placeholder='your-email@example.com'
                    className='flex-1 px-6 py-4 bg-white/10 border border-gray-600 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg'
                    required
                  />
                  <button
                    type='submit'
                    className='px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-bold text-lg flex items-center space-x-2'
                  >
                    <span>Subscribe</span>
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M13 7l5 5m0 0l-5 5m5-5H6'
                      />
                    </svg>
                  </button>
                </form>
                <p className='text-gray-400 text-sm mt-4'>
                  📧 1 email/tuần • 🚫 No spam • ✅ Unsubscribe anytime
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='relative py-20 px-4'>
        <div className='container mx-auto text-center relative z-10'>
          <div className='max-w-4xl mx-auto'>
            <h2 className='text-4xl md:text-5xl font-black bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-6'>
              SẴN SÀNG XÂY DỰNG
              <br />
              <span className='bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent'>
                AI AGENTS?
              </span>
            </h2>

            <p className='text-xl text-gray-300 mb-8 leading-relaxed'>
              Áp dụng ngay những kiến thức từ blog vào thực tế
              <br />
              <span className='text-purple-400'>Bắt đầu journey với VIEAgent</span>
            </p>

            <div className='flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6'>
              <a
                href='/dashboard'
                className='px-12 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white text-xl font-bold rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105 shadow-2xl flex items-center space-x-2'
              >
                <span>🚀 Start Building</span>
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M13 7l5 5m0 0l-5 5m5-5H6'
                  />
                </svg>
              </a>

              <a
                href='/pricing'
                className='px-12 py-4 border-2 border-gray-600 text-gray-300 text-xl font-bold rounded-2xl hover:border-gray-300 hover:text-white transition-all duration-300 hover:scale-105'
              >
                <span>💎 View Pricing</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='relative py-12 px-4 border-t border-gray-800/50'>
        <div className='container mx-auto'>
          <div className='text-center'>
            <div className='flex items-center justify-center space-x-3 mb-6'>
              <div className='w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center'>
                <VIEAgentLogo size='small' />
              </div>
              <div>
                <h1 className='text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent'>
                  VIEAgent
                </h1>
                <p className='text-xs text-gray-400'>Next-Gen Intelligence</p>
              </div>
            </div>
            <p className='text-gray-400'>
              © 2024 VIEAgent. All rights reserved. Built with ❤️ for the future.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
