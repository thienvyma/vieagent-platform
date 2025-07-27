'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/ui/DashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import toast from 'react-hot-toast';

// Smart Upload Zone Component
import SmartUploadZone from '@/components/knowledge/SmartUploadZone';
import KnowledgeGrid from '@/components/knowledge/KnowledgeGrid';
import KnowledgeStatusTracker from '@/components/knowledge/KnowledgeStatusTracker';
import OrphanCleanupPanel from '@/components/knowledge/OrphanCleanupPanel';

interface KnowledgeItem {
  id: string;
  title: string;
  description?: string;
  filename: string;
  type: string; // 'document', 'conversation', 'folder'
  subtype?: string; // 'pdf', 'json', 'facebook', 'whatsapp', etc.
  source?: string;
  contentType?: string;
  category?: string;
  status: string;
  size?: number;
  mimeType?: string;
  progressPercent?: number;
  totalRecords?: number;
  processedRecords?: number;
  successRecords?: number;
  errorRecords?: number;
  viewCount: number;
  downloadCount: number;
  shareCount: number;
  isPublic: boolean;
  isArchived: boolean;
  tags: string[];
  metadata: any;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  // Legacy compatibility
  name?: string;
  fileName?: string;
  fileSize?: number;
}

interface UserStats {
  usage: {
    percentage: number;
    plan: string;
  };
}

export default function KnowledgeCenterPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // State management
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'knowledge' | 'maintenance'>('knowledge');

  // Grid view settings
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'title' | 'size' | 'status'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Authentication check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      loadKnowledgeItems();
      loadUserStats();
    }
  }, [status]);

  // Reload when filters change
  useEffect(() => {
    if (status === 'authenticated') {
      loadWithFilters();
    }
  }, [filterType, filterStatus, searchQuery, status]);

  const loadKnowledgeItems = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: '1',
        limit: '50',
      });
  
      // 🚀 OPTIMIZED: Reduce logging in production
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Knowledge Page: Fetching data from API...');
      }
      const response = await fetch(`/api/knowledge?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        if (process.env.NODE_ENV === 'development') {
          console.log('📊 Knowledge Page: API Response', data);
        }
  
        // ✅ FIXED: Handle both API response formats
        if (data.success && data.data) {
          let items = [];
          if (Array.isArray(data.data)) {
            // Direct array format
            items = data.data;
          } else if (data.data.items && Array.isArray(data.data.items)) {
            // Nested items format
            items = data.data.items;
          }
          
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Knowledge Page: Processed items', { count: items.length });
          }
          setKnowledgeItems(items);
        } else {
          console.warn('Invalid knowledge data format:', data);
          setKnowledgeItems([]); // fallback an toàn
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Knowledge Page: API Error', { status: response.status, error: errorText });
        toast.error('Không thể tải danh sách knowledge items');
      }
    } catch (error) {
      console.error('Error loading knowledge items:', error);
      toast.error('Error loading knowledge items');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUserStats = useCallback(async () => {
    try {
      const response = await fetch('/api/user/stats');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setUserStats({
            usage: {
              percentage: data.data.usage.percentage,
              plan: data.data.usage.plan,
            },
          });
        }
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  }, []);

  // Load with current filters
  const loadWithFilters = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: '1',
        limit: '50',
        ...(filterType !== 'all' && { type: filterType }),
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(searchQuery && { search: searchQuery }),
      });
  
      const response = await fetch(`/api/knowledge?${params}`);
      if (response.ok) {
        const data = await response.json();
  
        // ✅ FIXED: Handle both API response formats
        if (data.success && data.data) {
          let items = [];
          if (Array.isArray(data.data)) {
            // Direct array format
            items = data.data;
          } else if (data.data.items && Array.isArray(data.data.items)) {
            // Nested items format
            items = data.data.items;
          }
          setKnowledgeItems(items);
        } else {
          console.warn('Invalid knowledge data format:', data);
          setKnowledgeItems([]); // fallback an toàn
        }
      } else {
        toast.error('Failed to load knowledge items');
      }
    } catch (error) {
      console.error('Error loading knowledge items:', error);
      toast.error('Error loading knowledge items');
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus, searchQuery]);

  // Handle successful upload
  const handleUploadSuccess = useCallback((result: any) => {
    // Handle both UploadResult and KnowledgeItem formats
    if (result.id) {
      // If it's a KnowledgeItem format, add to list
      setKnowledgeItems(prev => [result, ...prev]);
      toast.success('Upload successful!');
    } else if (result.batchId) {
      // If it's a batch upload result
      toast.success(result.message || 'Batch upload completed!');
    } else {
      // Generic success
      toast.success('Upload successful!');
    }
    setShowUploadForm(false);
  }, []);

  // Handle upload error
  const handleUploadError = useCallback((error: string) => {
    toast.error(error || 'Upload failed');
  }, []);

  // Handle refresh request
  const handleRefresh = useCallback(async () => {
    await loadKnowledgeItems();
  }, []);

  // Handle status update request
  const handleStatusUpdate = useCallback(async () => {
    await loadKnowledgeItems();
  }, []);

  // Filter and sort knowledge items
  const filteredAndSortedItems = useMemo(() => {
    return (knowledgeItems || [])
      .filter(item => {
        if (filterType !== 'all' && item.type !== filterType) return false;
        if (filterStatus !== 'all' && item.status !== filterStatus) return false;
        if (
          searchQuery &&
          !item.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !item.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
          return false;
        return true;
      })
      .sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        const multiplier = sortOrder === 'desc' ? -1 : 1;

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return aVal.localeCompare(bVal) * multiplier;
        }
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return (aVal - bVal) * multiplier;
        }
        return 0;
      });
  }, [knowledgeItems, filterType, filterStatus, searchQuery, sortBy, sortOrder]);

  // Stats calculation
  const stats = useMemo(() => ({
    total: knowledgeItems?.length || 0,
    completed: knowledgeItems?.filter(item => item.status === 'COMPLETED').length || 0,
    processing: knowledgeItems?.filter(
      item => item.status === 'PROCESSING' || item.status === 'PENDING'
    ).length || 0,
    failed: knowledgeItems?.filter(item => item.status === 'FAILED' || item.status === 'ERROR')
      .length || 0,
    documents: knowledgeItems?.filter(item => item.type === 'document').length || 0,
    conversations: knowledgeItems?.filter(item => item.type === 'conversation').length || 0,
    folders: knowledgeItems?.filter(item => item.type === 'folder').length || 0,
  }), [knowledgeItems]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className='flex items-center justify-center min-h-screen'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500'></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Knowledge Center"
      description="Unified knowledge management system"
      rightSection={
        <button
          onClick={() => setShowUploadForm(true)}
          className='bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-2 rounded-xl hover:from-orange-600 hover:to-red-700 transition-all duration-200 flex items-center space-x-2'
        >
          <span>📤</span>
          <span>Upload</span>
        </button>
      }
    >
      <div className='space-y-8 min-h-[calc(100vh-200px)]'>
        {/* Tab Navigation */}
        <div className='flex space-x-1 bg-white/5 rounded-xl border border-white/10 p-1'>
          <button
            onClick={() => setActiveTab('knowledge')}
            className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === 'knowledge'
                ? 'bg-orange-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            📚 Knowledge Base
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === 'maintenance'
                ? 'bg-orange-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            🧹 Maintenance
          </button>
        </div>

        {/* Knowledge Tab Content */}
        {activeTab === 'knowledge' && (
          <>
            {/* Stats Overview */}
            <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6'>
              <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-orange-500/30 transition-all duration-300'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center'>
                    <span className='text-2xl'>📚</span>
                  </div>
                  <span className='text-2xl font-black text-white'>{stats.total}</span>
                </div>
                <h3 className='text-white font-semibold mb-1'>Total Knowledge</h3>
                <p className='text-gray-400 text-sm'>All knowledge items</p>
              </div>

              <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-green-500/30 transition-all duration-300'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center'>
                    <span className='text-2xl'>✅</span>
                  </div>
                  <span className='text-2xl font-black text-white'>{stats.completed}</span>
                </div>
                <h3 className='text-white font-semibold mb-1'>Completed</h3>
                <p className='text-gray-400 text-sm'>Ready for use</p>
              </div>

              <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-blue-500/30 transition-all duration-300'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center'>
                    <span className='text-2xl'>⏳</span>
                  </div>
                  <span className='text-2xl font-black text-white'>{stats.processing}</span>
                </div>
                <h3 className='text-white font-semibold mb-1'>Processing</h3>
                <p className='text-gray-400 text-sm'>In progress</p>
              </div>

              <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-purple-500/30 transition-all duration-300'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center'>
                    <span className='text-2xl'>📊</span>
                  </div>
                  <span className='text-2xl font-black text-white'>{stats.documents}</span>
                </div>
                <h3 className='text-white font-semibold mb-1'>Documents</h3>
                <p className='text-gray-400 text-sm'>Files & documents</p>
              </div>
            </div>

            {/* Filters and Controls */}
            <div className='flex flex-col lg:flex-row gap-4 lg:gap-6'>
              {/* Search */}
              <div className='flex-1'>
                <input
                  type='text'
                  placeholder='Search knowledge items...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className='w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500/50'
                />
              </div>

              {/* Filters */}
              <div className='flex gap-4'>
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className='bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50'
                >
                  <option value='all'>All Types</option>
                  <option value='document'>Documents</option>
                  <option value='conversation'>Conversations</option>
                  <option value='folder'>Folders</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className='bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50'
                >
                  <option value='all'>All Status</option>
                  <option value='COMPLETED'>Completed</option>
                  <option value='PROCESSING'>Processing</option>
                  <option value='PENDING'>Pending</option>
                  <option value='FAILED'>Failed</option>
                </select>

                {/* View Mode Toggle */}
                <div className='flex bg-white/5 border border-white/10 rounded-xl overflow-hidden'>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-4 py-3 text-sm ${viewMode === 'grid' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-4 py-3 text-sm ${viewMode === 'list' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    List
                  </button>
                </div>
              </div>
            </div>

            {/* Debug Panel - Development Only */}
            {process.env.NODE_ENV === 'development' && (
              <div className='bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4 mb-6'>
                <div className='flex items-center justify-between mb-3'>
                  <h4 className='text-yellow-400 font-semibold'>🐛 Debug Panel</h4>
                  <div className='flex gap-2'>
                    <button
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/knowledge/debug');
                          const data = await response.json();
                          console.log('🐛 Debug Data:', data);
                          toast.success('Debug data logged to console');
                        } catch (error) {
                          console.error('Debug error:', error);
                          toast.error('Debug failed');
                        }
                      }}
                      className='bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-1 rounded text-sm font-medium'
                    >
                      Check Data
                    </button>

                    <button
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/knowledge/test-data', {
                            method: 'POST',
                          });
                          const data = await response.json();
                          if (data.success) {
                            toast.success(`Created ${data.data.totalItems} test items`);
                            await loadKnowledgeItems(); // Refresh the list
                          } else {
                            toast.error(data.error || 'Test data creation failed');
                          }
                        } catch (error) {
                          console.error('Test data error:', error);
                          toast.error('Test data creation failed');
                        }
                      }}
                      className='bg-blue-500 hover:bg-blue-600 text-black px-3 py-1 rounded text-sm font-medium'
                    >
                      Test Data
                    </button>
                  </div>
                </div>
                <div className='text-sm text-yellow-300'>
                  <p>Items loaded: {knowledgeItems.length}</p>
                  <p>Filtered items: {filteredAndSortedItems.length}</p>
                  <p>Session status: {status}</p>
                  <p>User ID: {session?.user?.id || 'Not logged in'}</p>
                  <p>Loading state: {loading ? 'Loading...' : 'Ready'}</p>
                </div>
              </div>
            )}

            {/* Knowledge Grid */}
            <KnowledgeGrid
              items={filteredAndSortedItems}
              viewMode={viewMode}
              onRefresh={handleRefresh}
            />

            {/* Upload Modal */}
            {showUploadForm && (
              <div className='fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4'>
                <div className='bg-gray-900/95 backdrop-blur-xl rounded-3xl p-8 w-full max-w-4xl border border-white/20 shadow-2xl max-h-[90vh] overflow-y-auto'>
                  <div className='flex justify-between items-center mb-6'>
                    <div className='flex items-center space-x-4'>
                      <div className='w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center'>
                        <span className='text-2xl'>📤</span>
                      </div>
                      <div>
                        <h2 className='text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent'>
                          Upload Knowledge
                        </h2>
                        <p className='text-sm text-gray-400'>
                          Upload files, folders, or documents to your knowledge base
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowUploadForm(false)}
                      className='text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg'
                    >
                      <span className='text-xl'>✕</span>
                    </button>
                  </div>

                  <SmartUploadZone
                    onUploadSuccess={handleUploadSuccess}
                    onUploadError={handleUploadError}
                    onCancel={() => setShowUploadForm(false)}
                  />
                </div>
              </div>
            )}

            {/* Status Tracker */}
            <KnowledgeStatusTracker items={knowledgeItems} onStatusUpdate={handleStatusUpdate} />
          </>
        )}

        {/* Maintenance Tab Content - Day 2.4 Orphan Cleanup */}
        {activeTab === 'maintenance' && (
          <div className='space-y-6'>
            <OrphanCleanupPanel />
          </div>
        )}

        {/* ✅ FIXED: Fallback Content for unexpected activeTab */}
        {activeTab !== 'knowledge' && activeTab !== 'maintenance' && (
          <>
            <div className='text-center py-8'>
              <div className='text-6xl mb-4'>⚠️</div>
              <h3 className='text-xl font-semibold text-white mb-2'>Unexpected Tab State</h3>
              <p className='text-gray-400 mb-4'>
                activeTab value: <code className='bg-gray-700 px-2 py-1 rounded'>{activeTab}</code>
              </p>
              <button
                onClick={() => setActiveTab('knowledge')}
                className='bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors'
              >
                Switch to Knowledge Tab
              </button>
            </div>
            
            {/* Show knowledge content as fallback */}
            <div className='space-y-6'>
              {/* Stats Overview */}
              <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6'>
                <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-orange-500/30 transition-all duration-300'>
                  <div className='flex items-center justify-between mb-4'>
                    <div className='w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center'>
                      <span className='text-2xl'>📚</span>
                    </div>
                    <span className='text-2xl font-black text-white'>{stats.total}</span>
                  </div>
                  <h3 className='text-white font-semibold mb-1'>Total Knowledge</h3>
                  <p className='text-gray-400 text-sm'>All knowledge items</p>
                </div>

                <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-green-500/30 transition-all duration-300'>
                  <div className='flex items-center justify-between mb-4'>
                    <div className='w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center'>
                      <span className='text-2xl'>✅</span>
                    </div>
                    <span className='text-2xl font-black text-white'>{stats.completed}</span>
                  </div>
                  <h3 className='text-white font-semibold mb-1'>Completed</h3>
                  <p className='text-gray-400 text-sm'>Ready for use</p>
                </div>

                <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-blue-500/30 transition-all duration-300'>
                  <div className='flex items-center justify-between mb-4'>
                    <div className='w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center'>
                      <span className='text-2xl'>⏳</span>
                    </div>
                    <span className='text-2xl font-black text-white'>{stats.processing}</span>
                  </div>
                  <h3 className='text-white font-semibold mb-1'>Processing</h3>
                  <p className='text-gray-400 text-sm'>In progress</p>
                </div>

                <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-purple-500/30 transition-all duration-300'>
                  <div className='flex items-center justify-between mb-4'>
                    <div className='w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center'>
                      <span className='text-2xl'>📊</span>
                    </div>
                    <span className='text-2xl font-black text-white'>{stats.documents}</span>
                  </div>
                  <h3 className='text-white font-semibold mb-1'>Documents</h3>
                  <p className='text-gray-400 text-sm'>Files & documents</p>
                </div>
              </div>

              {/* Knowledge Grid */}
              <KnowledgeGrid
                items={filteredAndSortedItems}
                viewMode={viewMode}
                onRefresh={handleRefresh}
              />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
