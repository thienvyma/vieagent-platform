'use client';

import { useState, useEffect, useRef } from 'react';
import NextImage from 'next/image';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Upload,
  Image,
  Star,
  Calendar,
  User,
  Tag,
  Search,
  Filter,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { hasPermission, type UserRole } from '@/lib/permissions';
import toast from 'react-hot-toast';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  type: string;
  category: string;
  isActive: boolean;
  isFeatured: boolean;
  position: number;
  tags: string | null;
  author: string | null;
  authorImage: string | null;
  url: string | null;
  image: string | null;
  thumbnail: string | null;
  viewCount: number;
  clickCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BlogStats {
  total: number;
  published: number;
  featured: number;
  totalViews: number;
  totalClicks: number;
  thisMonth: number;
}

export default function BlogManagementPage() {
  const { data: session } = useSession();
  const currentUserRole = session?.user?.role as UserRole;

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [stats, setStats] = useState<BlogStats>({
    total: 0,
    published: 0,
    featured: 0,
    totalViews: 0,
    totalClicks: 0,
    thisMonth: 0,
  });
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    type: 'blog_post',
    category: '',
    isActive: true,
    isFeatured: false,
    position: 1,
    tags: [] as string[],
    author: '',
    authorImage: '',
    url: '',
    image: '',
    thumbnail: '',
    publishedAt: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [authorImageFile, setAuthorImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newTag, setNewTag] = useState('');

  const imageInputRef = useRef<HTMLInputElement>(null);
  const authorImageInputRef = useRef<HTMLInputElement>(null);

  const canViewBlog = hasPermission(currentUserRole, 'view_blog');
  const canCreateBlog = hasPermission(currentUserRole, 'create_blog');
  const canEditBlog = hasPermission(currentUserRole, 'edit_blog');
  const canDeleteBlog = hasPermission(currentUserRole, 'delete_blog');

  useEffect(() => {
    if (canViewBlog) {
      fetchPosts();
      fetchStats();
    }
  }, [page, searchTerm, categoryFilter, statusFilter, featuredFilter, canViewBlog]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(statusFilter && { isActive: statusFilter }),
        ...(featuredFilter && { isFeatured: featuredFilter }),
      });

      const response = await fetch(`/api/admin/blog?${params}`);
      const data = await response.json();

      if (response.ok) {
        setPosts(data.posts || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        toast.error(data.error || 'Không thể tải danh sách bài viết');
      }
    } catch (error) {
      toast.error('Lỗi kết nối mạng');
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/blog/stats');
      const data = await response.json();

      if (response.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching blog stats:', error);
    }
  };

  const uploadImage = async (file: File, type: 'main' | 'author'): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Upload thất bại');
    }

    return data.url;
  };

  const handleImageUpload = async (file: File, type: 'main' | 'author') => {
    setUploading(true);
    try {
      const imageUrl = await uploadImage(file, type);

      if (type === 'main') {
        setFormData(prev => ({ ...prev, image: imageUrl, thumbnail: imageUrl }));
      } else {
        setFormData(prev => ({ ...prev, authorImage: imageUrl }));
      }

      toast.success('Upload ảnh thành công');
    } catch (error) {
      toast.error('Lỗi upload ảnh');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.content) {
      toast.error('Vui lòng nhập đầy đủ tiêu đề và nội dung');
      return;
    }

    try {
      const submitData = {
        ...formData,
        tags: JSON.stringify(formData.tags),
        publishedAt: formData.publishedAt ? new Date(formData.publishedAt).toISOString() : null,
      };

      const url = editingPost ? `/api/admin/blog/${editingPost.id}` : '/api/admin/blog';

      const method = editingPost ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(editingPost ? 'Đã cập nhật bài viết' : 'Đã tạo bài viết mới');
        fetchPosts();
        fetchStats();
        resetForm();
      } else {
        toast.error(data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      toast.error('Lỗi kết nối mạng');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa bài viết "${title}"?`)) return;

    try {
      const response = await fetch(`/api/admin/blog/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Đã xóa bài viết');
        fetchPosts();
        fetchStats();
      } else {
        toast.error('Không thể xóa bài viết');
      }
    } catch (error) {
      toast.error('Lỗi kết nối mạng');
    }
  };

  const handleToggleFeatured = async (post: BlogPost) => {
    try {
      const response = await fetch(`/api/admin/blog/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...post,
          isFeatured: !post.isFeatured,
          tags: typeof post.tags === 'string' ? post.tags : JSON.stringify(post.tags || []),
        }),
      });

      if (response.ok) {
        toast.success(
          `Đã ${!post.isFeatured ? 'đánh dấu nổi bật' : 'bỏ đánh dấu nổi bật'} bài viết`
        );
        fetchPosts();
        fetchStats();
      } else {
        toast.error('Không thể cập nhật trạng thái');
      }
    } catch (error) {
      toast.error('Lỗi kết nối mạng');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      excerpt: '',
      content: '',
      type: 'blog_post',
      category: '',
      isActive: true,
      isFeatured: false,
      position: 1,
      tags: [],
      author: '',
      authorImage: '',
      url: '',
      image: '',
      thumbnail: '',
      publishedAt: '',
    });
    setImageFile(null);
    setAuthorImageFile(null);
    setShowCreateModal(false);
    setEditingPost(null);
  };

  const startEdit = (post: BlogPost) => {
    setFormData({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      type: post.type,
      category: post.category,
      isActive: post.isActive,
      isFeatured: post.isFeatured,
      position: post.position,
      tags: parseTags(post.tags),
      author: post.author || '',
      authorImage: post.authorImage || '',
      url: post.url || '',
      image: post.image || '',
      thumbnail: post.thumbnail || '',
      publishedAt: post.publishedAt ? post.publishedAt.split('T')[0] : '',
    });
    setEditingPost(post);
    setShowCreateModal(true);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
  };

  const parseTags = (tags: string | null) => {
    try {
      return tags ? JSON.parse(tags) : [];
    } catch {
      return [];
    }
  };

  if (!canViewBlog) {
    return (
      <div className='min-h-screen bg-black flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-white mb-4'>Truy cập bị từ chối</h1>
          <p className='text-gray-400'>Bạn không có quyền truy cập trang này.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-black text-white'>
      {/* Background Effects */}
      <div className='fixed inset-0 z-0'>
        <div className='absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900'></div>
        <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse'></div>
        <div className='absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000'></div>
        <div className='absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]'></div>
      </div>

      <div className='relative z-10 p-6'>
        <div className='max-w-7xl mx-auto'>
          {/* Header */}
          <div className='mb-8 flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-white mb-2'>📝 Quản lý Blog</h1>
              <p className='text-gray-400'>Quản lý bài viết và nội dung nổi bật</p>
            </div>
            {canCreateBlog && (
              <button
                onClick={() => setShowCreateModal(true)}
                className='px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all flex items-center space-x-2'
              >
                <Plus className='w-5 h-5' />
                <span>Tạo bài viết mới</span>
              </button>
            )}
          </div>

          {/* Stats Cards */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8'>
            <div className='bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-gray-400 text-sm'>Tổng bài viết</p>
                  <p className='text-2xl font-bold text-white'>{stats.total}</p>
                </div>
                <Edit className='w-8 h-8 text-blue-400' />
              </div>
            </div>

            <div className='bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-gray-400 text-sm'>Đã xuất bản</p>
                  <p className='text-2xl font-bold text-green-400'>{stats.published}</p>
                </div>
                <Eye className='w-8 h-8 text-green-400' />
              </div>
            </div>

            <div className='bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-gray-400 text-sm'>Nổi bật</p>
                  <p className='text-2xl font-bold text-yellow-400'>{stats.featured}</p>
                </div>
                <Star className='w-8 h-8 text-yellow-400' />
              </div>
            </div>

            <div className='bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-gray-400 text-sm'>Tổng lượt xem</p>
                  <p className='text-2xl font-bold text-purple-400'>
                    {stats.totalViews.toLocaleString()}
                  </p>
                </div>
                <Eye className='w-8 h-8 text-purple-400' />
              </div>
            </div>

            <div className='bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-gray-400 text-sm'>Tổng lượt click</p>
                  <p className='text-2xl font-bold text-orange-400'>
                    {stats.totalClicks.toLocaleString()}
                  </p>
                </div>
                <Calendar className='w-8 h-8 text-orange-400' />
              </div>
            </div>

            <div className='bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-gray-400 text-sm'>Tháng này</p>
                  <p className='text-2xl font-bold text-red-400'>{stats.thisMonth}</p>
                </div>
                <Calendar className='w-8 h-8 text-red-400' />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className='bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 mb-8'>
            <div className='flex flex-wrap items-center gap-4'>
              <div className='flex-1 min-w-64'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                  <input
                    type='text'
                    placeholder='Tìm kiếm tiêu đề, nội dung...'
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className='w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
              </div>

              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className='px-4 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value=''>Tất cả danh mục</option>
                <option value='AI Trends'>AI Trends</option>
                <option value='Technology'>Technology</option>
                <option value='Case Study'>Case Study</option>
                <option value='Tutorial'>Tutorial</option>
                <option value='News'>News</option>
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className='px-4 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value=''>Tất cả trạng thái</option>
                <option value='true'>Đã xuất bản</option>
                <option value='false'>Bản nháp</option>
              </select>

              <select
                value={featuredFilter}
                onChange={e => setFeaturedFilter(e.target.value)}
                className='px-4 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value=''>Tất cả bài viết</option>
                <option value='true'>Chỉ nổi bật</option>
                <option value='false'>Không nổi bật</option>
              </select>
            </div>
          </div>

          {/* Posts List */}
          <div className='bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden'>
            {loading ? (
              <div className='flex items-center justify-center py-12'>
                <div className='w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
              </div>
            ) : posts.length === 0 ? (
              <div className='text-center py-12'>
                <Edit className='w-16 h-16 text-gray-500 mx-auto mb-4' />
                <h3 className='text-lg font-semibold text-white mb-2'>Chưa có bài viết</h3>
                <p className='text-gray-400'>Không có bài viết nào phù hợp với bộ lọc của bạn.</p>
              </div>
            ) : (
              <>
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead className='bg-white/5 border-b border-white/10'>
                      <tr>
                        <th className='px-6 py-4 text-left text-sm font-medium text-gray-300'>
                          Bài viết
                        </th>
                        <th className='px-6 py-4 text-left text-sm font-medium text-gray-300'>
                          Danh mục
                        </th>
                        <th className='px-6 py-4 text-left text-sm font-medium text-gray-300'>
                          Tác giả
                        </th>
                        <th className='px-6 py-4 text-left text-sm font-medium text-gray-300'>
                          Trạng thái
                        </th>
                        <th className='px-6 py-4 text-left text-sm font-medium text-gray-300'>
                          Thống kê
                        </th>
                        <th className='px-6 py-4 text-left text-sm font-medium text-gray-300'>
                          Xuất bản
                        </th>
                        <th className='px-6 py-4 text-left text-sm font-medium text-gray-300'>
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-white/5'>
                      {posts.map(post => (
                        <tr key={post.id} className='hover:bg-white/5 transition-colors'>
                          <td className='px-6 py-4'>
                            <div className='flex items-start space-x-4'>
                              <div className='w-16 h-16 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0'>
                                {post.thumbnail ? (
                                  <NextImage
                                    src={post.thumbnail}
                                    alt={post.title}
                                    width={64}
                                    height={64}
                                    className='w-full h-full object-cover'
                                  />
                                ) : (
                                  <div className='w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center'>
                                    <Image className='w-6 h-6 text-white' />
                                  </div>
                                )}
                              </div>
                              <div className='flex-1 min-w-0'>
                                <div className='font-medium text-white line-clamp-2'>
                                  {post.title}
                                </div>
                                <div className='text-sm text-gray-400 line-clamp-2 mt-1'>
                                  {post.excerpt}
                                </div>
                                <div className='flex flex-wrap gap-1 mt-2'>
                                  {parseTags(post.tags).map((tag: string, index: number) => (
                                    <span
                                      key={index}
                                      className='px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-lg border border-blue-500/30'
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className='px-6 py-4'>
                            <span className='px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-lg border border-purple-500/30'>
                              {post.category}
                            </span>
                          </td>
                          <td className='px-6 py-4'>
                            <div className='flex items-center space-x-2'>
                              {post.authorImage ? (
                                <NextImage
                                  src={post.authorImage}
                                  alt={post.author || 'Author'}
                                  width={32}
                                  height={32}
                                  className='w-8 h-8 rounded-full'
                                />
                              ) : (
                                <div className='w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center'>
                                  <User className='w-4 h-4 text-gray-300' />
                                </div>
                              )}
                              <span className='text-sm text-gray-300'>
                                {post.author || 'Ẩn danh'}
                              </span>
                            </div>
                          </td>
                          <td className='px-6 py-4'>
                            <div className='flex flex-col space-y-1'>
                              <span
                                className={`px-2 py-1 text-xs rounded-lg border ${
                                  post.isActive
                                    ? 'bg-green-500/20 text-green-300 border-green-500/30'
                                    : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                                }`}
                              >
                                {post.isActive ? '✅ Đã xuất bản' : '⏳ Bản nháp'}
                              </span>
                              {post.isFeatured && (
                                <span className='px-2 py-1 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-xs rounded-lg'>
                                  ⭐ Nổi bật
                                </span>
                              )}
                            </div>
                          </td>
                          <td className='px-6 py-4 text-sm text-gray-300'>
                            <div className='space-y-1'>
                              <div>👀 {post.viewCount.toLocaleString()} lượt xem</div>
                              <div>🖱️ {post.clickCount.toLocaleString()} lượt click</div>
                            </div>
                          </td>
                          <td className='px-6 py-4 text-sm text-gray-300'>
                            {post.publishedAt ? (
                              <div>📅 {new Date(post.publishedAt).toLocaleDateString('vi-VN')}</div>
                            ) : (
                              <span className='text-gray-500'>Chưa xuất bản</span>
                            )}
                          </td>
                          <td className='px-6 py-4'>
                            <div className='flex items-center space-x-2'>
                              <button
                                onClick={() => handleToggleFeatured(post)}
                                className={`p-2 rounded-lg transition-colors ${
                                  post.isFeatured
                                    ? 'text-yellow-400 hover:bg-yellow-500/20'
                                    : 'text-gray-400 hover:bg-gray-700 hover:text-yellow-400'
                                }`}
                                title={post.isFeatured ? 'Bỏ nổi bật' : 'Đánh dấu nổi bật'}
                              >
                                <Star className='w-4 h-4' />
                              </button>
                              {canEditBlog && (
                                <button
                                  onClick={() => startEdit(post)}
                                  className='p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors'
                                  title='Chỉnh sửa'
                                >
                                  <Edit className='w-4 h-4' />
                                </button>
                              )}
                              {canDeleteBlog && (
                                <button
                                  onClick={() => handleDelete(post.id, post.title)}
                                  className='p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors'
                                  title='Xóa'
                                >
                                  <Trash2 className='w-4 h-4' />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className='p-6 border-t border-white/10 flex items-center justify-between'>
                    <div className='text-sm text-gray-400'>
                      Trang {page} / {totalPages}
                    </div>
                    <div className='flex items-center space-x-2'>
                      <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className='px-3 py-1 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
                      >
                        Trước
                      </button>
                      <button
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                        className='px-3 py-1 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm'>
          <div className='bg-gray-900 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-700'>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-2xl font-bold text-white'>
                {editingPost ? '✏️ Chỉnh sửa bài viết' : '✨ Tạo bài viết mới'}
              </h2>
              <button
                onClick={resetForm}
                className='p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg'
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className='space-y-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>Tiêu đề *</label>
                  <input
                    type='text'
                    value={formData.title}
                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                    placeholder='Nhập tiêu đề bài viết...'
                    required
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>Danh mục</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                  >
                    <option value=''>Chọn danh mục</option>
                    <option value='AI Trends'>AI Trends</option>
                    <option value='Technology'>Technology</option>
                    <option value='Case Study'>Case Study</option>
                    <option value='Tutorial'>Tutorial</option>
                    <option value='News'>News</option>
                  </select>
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-300 mb-2'>Tóm tắt</label>
                <textarea
                  value={formData.excerpt}
                  onChange={e => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  rows={3}
                  className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='Nhập tóm tắt bài viết...'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-300 mb-2'>Nội dung *</label>
                <textarea
                  value={formData.content}
                  onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={10}
                  className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='Nhập nội dung bài viết...'
                  required
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>Tác giả</label>
                  <input
                    type='text'
                    value={formData.author}
                    onChange={e => setFormData(prev => ({ ...prev, author: e.target.value }))}
                    className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                    placeholder='Tên tác giả...'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>
                    URL bài viết
                  </label>
                  <input
                    type='text'
                    value={formData.url}
                    onChange={e => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                    placeholder='/blog/duong-dan-bai-viet'
                  />
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-300 mb-2'>Tags</label>
                <div className='flex flex-wrap gap-2 mb-3'>
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className='px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/30 flex items-center space-x-2'
                    >
                      <span>{tag}</span>
                      <button
                        type='button'
                        onClick={() => removeTag(tag)}
                        className='text-blue-300 hover:text-white'
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className='flex space-x-2'>
                  <input
                    type='text'
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className='flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                    placeholder='Thêm tag...'
                  />
                  <button
                    type='button'
                    onClick={addTag}
                    className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
                  >
                    Thêm
                  </button>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>
                    Ngày xuất bản
                  </label>
                  <input
                    type='date'
                    value={formData.publishedAt}
                    onChange={e => setFormData(prev => ({ ...prev, publishedAt: e.target.value }))}
                    className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>Vị trí</label>
                  <input
                    type='number'
                    value={formData.position}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, position: parseInt(e.target.value) || 1 }))
                    }
                    className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                    min='1'
                  />
                </div>

                <div className='flex items-center space-x-4 pt-8'>
                  <label className='flex items-center space-x-2'>
                    <input
                      type='checkbox'
                      checked={formData.isActive}
                      onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className='rounded bg-gray-800 border-gray-600 text-blue-500 focus:ring-blue-500'
                    />
                    <span className='text-gray-300'>Xuất bản</span>
                  </label>

                  <label className='flex items-center space-x-2'>
                    <input
                      type='checkbox'
                      checked={formData.isFeatured}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))
                      }
                      className='rounded bg-gray-800 border-gray-600 text-blue-500 focus:ring-blue-500'
                    />
                    <span className='text-gray-300'>Nổi bật</span>
                  </label>
                </div>
              </div>

              <div className='flex items-center justify-end space-x-4 pt-6 border-t border-gray-700'>
                <button
                  type='button'
                  onClick={resetForm}
                  className='px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors'
                >
                  Hủy
                </button>
                <button
                  type='submit'
                  className='px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all'
                >
                  {editingPost ? '💾 Cập nhật' : '✨ Tạo bài viết'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
