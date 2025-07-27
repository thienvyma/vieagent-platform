'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // ✅ fixed from LINTING_MANUAL_FIXES_NEEDED.md
import { useParams } from 'next/navigation';
import {
  Calendar,
  Clock,
  Eye,
  User,
  ArrowLeft,
  ArrowRight,
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  Copy,
  Heart,
  MessageCircle,
  BookOpen,
  Tag,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
  status: string;
  publishedAt: string;
  authorId: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  categories?: string;
  tags?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  readingTime?: number;
}

interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string;
  author: {
    name: string;
  };
  viewCount: number;
  readingTime?: number;
}

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchBlogPost();
    }
  }, [slug]);

  const fetchBlogPost = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/blog/${slug}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError('Bài viết không tồn tại');
        } else {
          setError('Không thể tải bài viết');
        }
        return;
      }

      const data = await response.json();
      setPost(data.post);
      setRelatedPosts(data.relatedPosts || []);

      // Increment view count
      if (data.post) {
        incrementViewCount(data.post.id);
      }
    } catch (err) {
      setError('Lỗi kết nối mạng');
    } finally {
      setLoading(false);
    }
  };

  const incrementViewCount = async (postId: string) => {
    try {
      await fetch(`/api/blog/${postId}/view`, {
        method: 'POST',
      });
    } catch (err) {
      // Silent fail for view count
    }
  };

  const handleLike = async () => {
    if (!post) return;

    try {
      const response = await fetch(`/api/blog/${post.id}/like`, {
        method: 'POST',
      });

      if (response.ok) {
        setLiked(true);
        setPost({
          ...post,
          likeCount: post.likeCount + 1,
        });
        toast.success('Đã thích bài viết!');
      }
    } catch (err) {
      toast.error('Không thể thích bài viết');
    }
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = post?.title || '';

    let shareUrl = '';

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        toast.success('Đã copy link!');
        setShowShareMenu(false);
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
      setShowShareMenu(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const parseCategories = (categories?: string) => {
    if (!categories) return [];
    try {
      return JSON.parse(categories);
    } catch {
      return categories.split(',').map(c => c.trim());
    }
  };

  const parseTags = (tags?: string) => {
    if (!tags) return [];
    try {
      return JSON.parse(tags);
    } catch {
      return tags.split(',').map(t => t.trim());
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50'>
        {/* Header Skeleton */}
        <div className='bg-white shadow-sm border-b'>
          <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
            <div className='h-6 bg-gray-200 rounded w-32 animate-pulse'></div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <div className='space-y-6'>
            <div className='h-8 bg-gray-200 rounded animate-pulse'></div>
            <div className='h-4 bg-gray-200 rounded w-3/4 animate-pulse'></div>
            <div className='space-y-3'>
              {[...Array(10)].map((_, i) => (
                <div key={i} className='h-4 bg-gray-200 rounded animate-pulse'></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center px-4'>
          <div className='text-6xl mb-4'>📝</div>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>
            {error || 'Bài viết không tồn tại'}
          </h1>
          <p className='text-gray-600 mb-6'>
            Bài viết bạn tìm kiếm có thể đã bị xóa hoặc không còn khả dụng.
          </p>
          <Link
            href='/blog'
            className='inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
          >
            <ArrowLeft className='w-4 h-4 mr-2' />
            Quay lại Blog
          </Link>
        </div>
      </div>
    );
  }

  const categories = parseCategories(post.categories);
  const tags = parseTags(post.tags);

  return (
    <>
      {/* SEO Meta Tags */}
      <head>
        <title>{post.metaTitle || post.title}</title>
        <meta name='description' content={post.metaDescription || post.excerpt} />
        <meta name='keywords' content={post.keywords || tags.join(', ')} />
        <meta property='og:title' content={post.title} />
        <meta property='og:description' content={post.excerpt} />
        <meta property='og:type' content='article' />
        <meta property='og:url' content={`${window.location.origin}/blog/${post.slug}`} />
        {post.featuredImage && <meta property='og:image' content={post.featuredImage} />}
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content={post.title} />
        <meta name='twitter:description' content={post.excerpt} />
        {post.featuredImage && <meta name='twitter:image' content={post.featuredImage} />}
      </head>

      <div className='min-h-screen bg-gray-50'>
        {/* Navigation Header */}
        <header className='bg-white shadow-sm border-b sticky top-0 z-40'>
          <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='flex items-center justify-between py-4'>
              <Link
                href='/blog'
                className='inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors'
              >
                <ArrowLeft className='w-4 h-4 mr-2' />
                <span className='font-medium'>Quay lại Blog</span>
              </Link>

              <div className='flex items-center space-x-4'>
                {/* Share Button */}
                <div className='relative'>
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className='inline-flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors'
                  >
                    <Share2 className='w-4 h-4 mr-2' />
                    <span className='hidden sm:inline'>Chia sẻ</span>
                  </button>

                  {showShareMenu && (
                    <div className='absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border z-50'>
                      <div className='py-2'>
                        <button
                          onClick={() => handleShare('facebook')}
                          className='w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center'
                        >
                          <Facebook className='w-4 h-4 mr-3 text-blue-600' />
                          Facebook
                        </button>
                        <button
                          onClick={() => handleShare('twitter')}
                          className='w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center'
                        >
                          <Twitter className='w-4 h-4 mr-3 text-blue-400' />
                          Twitter
                        </button>
                        <button
                          onClick={() => handleShare('linkedin')}
                          className='w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center'
                        >
                          <Linkedin className='w-4 h-4 mr-3 text-blue-700' />
                          LinkedIn
                        </button>
                        <button
                          onClick={() => handleShare('copy')}
                          className='w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center'
                        >
                          <Copy className='w-4 h-4 mr-3 text-gray-500' />
                          Copy Link
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Breadcrumb */}
        <div className='bg-white border-b'>
          <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3'>
            <nav className='flex items-center space-x-2 text-sm text-gray-500'>
              <Link href='/' className='hover:text-gray-700'>
                Trang chủ
              </Link>
              <ChevronRight className='w-4 h-4' />
              <Link href='/blog' className='hover:text-gray-700'>
                Blog
              </Link>
              <ChevronRight className='w-4 h-4' />
              <span className='text-gray-900 truncate'>{post.title}</span>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <main className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <article className='bg-white rounded-2xl shadow-sm border p-8 lg:p-12'>
            {/* Article Header */}
            <header className='mb-8'>
              {/* Categories */}
              {categories.length > 0 && (
                <div className='flex flex-wrap gap-2 mb-4'>
                  {categories.map((category: string, index: number) => (
                    <span
                      key={index}
                      className='px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium'
                    >
                      {category}
                    </span>
                  ))}
                </div>
              )}

              {/* Title */}
              <h1 className='text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight'>
                {post.title}
              </h1>

              {/* Excerpt */}
              {post.excerpt && (
                <p className='text-xl text-gray-600 mb-6 leading-relaxed'>{post.excerpt}</p>
              )}

              {/* Meta Information */}
              <div className='flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-6'>
                <div className='flex items-center'>
                  <User className='w-4 h-4 mr-2' />
                  <span className='font-medium text-gray-700'>{post.author.name}</span>
                </div>
                <div className='flex items-center'>
                  <Calendar className='w-4 h-4 mr-2' />
                  <span>{formatDate(post.publishedAt)}</span>
                </div>
                {post.readingTime && (
                  <div className='flex items-center'>
                    <Clock className='w-4 h-4 mr-2' />
                    <span>{post.readingTime} phút đọc</span>
                  </div>
                )}
                <div className='flex items-center'>
                  <Eye className='w-4 h-4 mr-2' />
                  <span>{post.viewCount.toLocaleString()} lượt xem</span>
                </div>
              </div>

              {/* Featured Image */}
              {post.featuredImage && (
                <div className='mb-8'>
                  {/* ✅ fixed from LINTING_MANUAL_FIXES_NEEDED.md */}
                  <Image
                    src={post.featuredImage}
                    alt={post.title}
                    width={800}
                    height={400}
                    className='w-full h-64 lg:h-96 object-cover rounded-xl'
                  />
                </div>
              )}
            </header>

            {/* Article Content */}
            <div
              className='prose prose-lg max-w-none mb-8'
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Tags */}
            {tags.length > 0 && (
              <div className='border-t pt-6 mb-6'>
                <div className='flex items-center mb-3'>
                  <Tag className='w-4 h-4 mr-2 text-gray-500' />
                  <span className='text-sm font-medium text-gray-700'>Tags:</span>
                </div>
                <div className='flex flex-wrap gap-2'>
                  {tags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className='px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors cursor-pointer'
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className='border-t pt-6'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-4'>
                  <button
                    onClick={handleLike}
                    disabled={liked}
                    className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
                      liked
                        ? 'bg-red-100 text-red-700 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600'
                    }`}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${liked ? 'fill-current' : ''}`} />
                    <span>{post.likeCount} lượt thích</span>
                  </button>

                  <div className='inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg'>
                    <MessageCircle className='w-4 h-4 mr-2' />
                    <span>{post.commentCount} bình luận</span>
                  </div>
                </div>

                <div className='flex items-center text-sm text-gray-500'>
                  <BookOpen className='w-4 h-4 mr-2' />
                  <span>Bài viết này hữu ích không?</span>
                </div>
              </div>
            </div>
          </article>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <section className='mt-12'>
              <h2 className='text-2xl font-bold text-gray-900 mb-8'>Bài viết liên quan</h2>

              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {relatedPosts.map(relatedPost => (
                  <Link
                    key={relatedPost.id}
                    href={`/blog/${relatedPost.slug}`}
                    className='group bg-white rounded-xl shadow-sm border hover:shadow-lg transition-all overflow-hidden'
                  >
                    <div className='p-6'>
                      <h3 className='text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2'>
                        {relatedPost.title}
                      </h3>

                      <p className='text-gray-600 text-sm mb-4 line-clamp-3'>
                        {relatedPost.excerpt}
                      </p>

                      <div className='flex items-center justify-between text-xs text-gray-500'>
                        <span>{relatedPost.author.name}</span>
                        <div className='flex items-center space-x-4'>
                          <span>{formatDate(relatedPost.publishedAt)}</span>
                          <span>{relatedPost.viewCount} views</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Newsletter CTA */}
          <section className='mt-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-center text-white'>
            <h2 className='text-2xl font-bold mb-4'>📬 Đăng ký nhận bài viết mới</h2>
            <p className='text-blue-100 mb-6 max-w-2xl mx-auto'>
              Nhận thông báo ngay khi có bài viết mới về AI, Technology và Business insights
            </p>
            <div className='flex flex-col sm:flex-row gap-4 max-w-md mx-auto'>
              <input
                type='email'
                placeholder='your-email@example.com'
                className='flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white/50'
              />
              <button className='px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors'>
                Đăng ký
              </button>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
