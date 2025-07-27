'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'; // ✅ fixed from TS Phase 2
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Search,
  Download,
  Upload,
  Star,
  Heart,
  MessageCircle,
  Share2,
  Filter,
  TrendingUp,
  Crown,
  Verified,
  GitBranch,
  Calendar,
  User,
  Tag,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Copy,
  Edit,
  Trash2,
  Eye,
  Plus,
  RefreshCw,
  Award,
  Zap,
  Shield,
  Clock,
  Users,
  BarChart3,
  Settings,
  BookOpen,
  Code,
  Sparkles,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
} from 'lucide-react';

// Types
interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  author: {
    id: string;
    name: string;
    avatar?: string;
    verified: boolean;
    reputation: number;
  };
  stats: {
    downloads: number;
    rating: number;
    reviews: number;
    forks: number;
    stars: number;
  };
  version: string;
  lastUpdated: string;
  featured: boolean;
  premium: boolean;
  verified: boolean;
  configuration: {
    provider: string;
    model: string;
    temperature: number;
    maxTokens: number;
    systemPrompt: string;
    tools: string[];
    ragEnabled: boolean;
    autoLearning: boolean;
  };
  preview?: {
    examples: string[];
    useCases: string[];
  };
  versions: TemplateVersion[];
  reviews: Review[];
  status: 'draft' | 'published' | 'archived';
  visibility: 'public' | 'private' | 'community';
}

interface TemplateVersion {
  id: string;
  version: string;
  releaseDate: string;
  changelog: string;
  downloads: number;
  deprecated: boolean;
}

interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
  verified: boolean;
}

interface MarketplaceFilters {
  category: string;
  tags: string[];
  rating: number;
  sortBy: 'popular' | 'newest' | 'rating' | 'downloads';
  priceType: 'all' | 'free' | 'premium';
  verified: boolean;
}

const AgentMarketplace: React.FC = () => {
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<AgentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('browse');
  const [filters, setFilters] = useState<MarketplaceFilters>({
    category: 'all',
    tags: [],
    rating: 0,
    sortBy: 'popular',
    priceType: 'all',
    verified: false,
  });

  // Smart template loading with fallback
  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/marketplace/templates');
      const data = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        setTemplates(data.data);
        setFilteredTemplates(data.data);
      } else {
        // Fallback to sample templates if API returns empty or fails
        console.log('API returned empty data, using fallback templates');
        setTemplates(sampleTemplates);
        setFilteredTemplates(sampleTemplates);
      }
    } catch (error) {
      console.error('Error loading templates, using fallback:', error);
      // Use sample templates as fallback
      setTemplates(sampleTemplates);
      setFilteredTemplates(sampleTemplates);
    } finally {
      setLoading(false);
    }
  };

  // Fallback templates - will be replaced by API data
  const sampleTemplates: AgentTemplate[] = [
    {
      id: '1',
      name: 'Customer Support Assistant',
      description: 'Professional customer service agent with advanced problem-solving capabilities',
      category: 'Customer Service',
      tags: ['support', 'customer-service', 'problem-solving', 'professional'],
      author: {
        id: 'user1',
        name: 'Sarah Johnson',
        avatar: '/avatars/sarah.jpg',
        verified: true,
        reputation: 4.9,
      },
      stats: {
        downloads: 15420,
        rating: 4.8,
        reviews: 234,
        forks: 89,
        stars: 1205,
      },
      version: '2.1.0',
      lastUpdated: '2024-01-15',
      featured: true,
      premium: false,
      verified: true,
      configuration: {
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1000,
        systemPrompt: 'You are a professional customer support assistant...',
        tools: ['knowledge-base', 'ticket-system', 'escalation'],
        ragEnabled: true,
        autoLearning: true,
      },
      preview: {
        examples: [
          'How can I help you with your order today?',
          'Let me look up your account information...',
          "I understand your concern. Here's what we can do...",
        ],
        useCases: [
          'E-commerce support',
          'Technical troubleshooting',
          'Order management',
          'Complaint resolution',
        ],
      },
      versions: [
        {
          id: 'v1',
          version: '2.1.0',
          releaseDate: '2024-01-15',
          changelog: 'Added advanced escalation logic and improved response accuracy',
          downloads: 5420,
          deprecated: false,
        },
        {
          id: 'v2',
          version: '2.0.0',
          releaseDate: '2023-12-20',
          changelog: 'Major update with RAG integration and auto-learning',
          downloads: 8200,
          deprecated: false,
        },
      ],
      reviews: [
        {
          id: 'r1',
          userId: 'user2',
          userName: 'Mike Chen',
          userAvatar: '/avatars/mike.jpg',
          rating: 5,
          comment: 'Excellent template! Saved us weeks of development time.',
          date: '2024-01-10',
          helpful: 23,
          verified: true,
        },
      ],
      status: 'published',
      visibility: 'public',
    },
    {
      id: '2',
      name: 'Content Creator Assistant',
      description: 'AI-powered content creation with SEO optimization and multi-format support',
      category: 'Content Creation',
      tags: ['content', 'seo', 'writing', 'marketing'],
      author: {
        id: 'user3',
        name: 'Alex Rivera',
        verified: true,
        reputation: 4.7,
      },
      stats: {
        downloads: 8930,
        rating: 4.6,
        reviews: 156,
        forks: 45,
        stars: 678,
      },
      version: '1.8.2',
      lastUpdated: '2024-01-12',
      featured: false,
      premium: true,
      verified: true,
      configuration: {
        provider: 'anthropic',
        model: 'claude-3-sonnet',
        temperature: 0.8,
        maxTokens: 2000,
        systemPrompt: 'You are a creative content assistant...',
        tools: ['seo-analyzer', 'plagiarism-checker', 'tone-analyzer'],
        ragEnabled: true,
        autoLearning: false,
      },
      preview: {
        examples: [
          'Create a blog post about sustainable technology...',
          'Generate SEO-optimized meta descriptions...',
          'Write engaging social media captions...',
        ],
        useCases: ['Blog writing', 'Social media content', 'Email marketing', 'SEO optimization'],
      },
      versions: [],
      reviews: [],
      status: 'published',
      visibility: 'public',
    },
    {
      id: '3',
      name: 'Data Analysis Assistant',
      description: 'Advanced data analysis and visualization with Python code generation',
      category: 'Data Science',
      tags: ['data-analysis', 'python', 'visualization', 'statistics'],
      author: {
        id: 'user4',
        name: 'Dr. Emily Watson',
        verified: true,
        reputation: 4.9,
      },
      stats: {
        downloads: 12340,
        rating: 4.9,
        reviews: 89,
        forks: 67,
        stars: 890,
      },
      version: '3.0.1',
      lastUpdated: '2024-01-18',
      featured: true,
      premium: true,
      verified: true,
      configuration: {
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.3,
        maxTokens: 1500,
        systemPrompt: 'You are a data science expert...',
        tools: ['code-interpreter', 'data-visualizer', 'statistical-analyzer'],
        ragEnabled: true,
        autoLearning: true,
      },
      preview: {
        examples: [
          'Analyze this dataset for trends...',
          'Create a visualization showing...',
          'Generate Python code for statistical analysis...',
        ],
        useCases: [
          'Statistical analysis',
          'Data visualization',
          'Predictive modeling',
          'Report generation',
        ],
      },
      versions: [],
      reviews: [],
      status: 'published',
      visibility: 'public',
    },
  ];

  const categories = [
    'All Categories',
    'Customer Service',
    'Content Creation',
    'Data Science',
    'Education',
    'Healthcare',
    'Finance',
    'Marketing',
    'Development',
    'Legal',
    'HR',
    'Sales',
  ];

  const popularTags = [
    'customer-service',
    'content',
    'data-analysis',
    'education',
    'healthcare',
    'finance',
    'marketing',
    'development',
    'legal',
    'hr',
    'sales',
    'support',
    'writing',
    'seo',
    'python',
    'visualization',
    'ai',
    'automation',
  ];

  useEffect(() => {
    // Load templates from API
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [searchQuery, filters, templates]);

  const filterTemplates = () => {
    let filtered = [...templates];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        template =>
          template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(template => template.category === filters.category);
    }

    // Rating filter
    if (filters.rating > 0) {
      filtered = filtered.filter(template => template.stats.rating >= filters.rating);
    }

    // Price filter
    if (filters.priceType !== 'all') {
      filtered = filtered.filter(template =>
        filters.priceType === 'free' ? !template.premium : template.premium
      );
    }

    // Verified filter
    if (filters.verified) {
      filtered = filtered.filter(template => template.verified);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'popular':
          return b.stats.downloads - a.stats.downloads;
        case 'newest':
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        case 'rating':
          return b.stats.rating - a.stats.rating;
        case 'downloads':
          return b.stats.downloads - a.stats.downloads;
        default:
          return 0;
      }
    });

    setFilteredTemplates(filtered);
  };

  const handleDownloadTemplate = async (template: AgentTemplate) => {
    try {
      const response = await fetch(`/api/marketplace/templates/${template.id}/download`, {
        method: 'POST',
      });

      if (response.ok) {
        // Update download count
        setTemplates(prev =>
          prev.map(t =>
            t.id === template.id
              ? { ...t, stats: { ...t.stats, downloads: t.stats.downloads + 1 } }
              : t
          )
        );

        // Navigate to agent creation with template
        window.location.href = `/dashboard/agents/create?template=${template.id}`;
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleStarTemplate = async (template: AgentTemplate) => {
    try {
      const response = await fetch(`/api/marketplace/templates/${template.id}/star`, {
        method: 'POST',
      });

      if (response.ok) {
        setTemplates(prev =>
          prev.map(t =>
            t.id === template.id ? { ...t, stats: { ...t.stats, stars: t.stats.stars + 1 } } : t
          )
        );
      }
    } catch (error) {
      console.error('Star failed:', error);
    }
  };

  const TemplateCard = ({ template }: { template: AgentTemplate }) => (
    <Card className='h-full hover:shadow-lg transition-shadow cursor-pointer'>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            <div className='flex items-center gap-2 mb-2'>
              <CardTitle className='text-lg'>{template.name}</CardTitle>
              {template.verified && <Verified className='w-4 h-4 text-blue-500' />}
              {template.featured && <Crown className='w-4 h-4 text-yellow-500' />}
              {template.premium && <Sparkles className='w-4 h-4 text-purple-500' />}
            </div>
            <CardDescription className='text-sm'>{template.description}</CardDescription>
          </div>
        </div>

        <div className='flex items-center gap-2 text-sm text-gray-600'>
          <Avatar className='w-6 h-6'>
            <AvatarImage src={template.author.avatar} />
            <AvatarFallback>{template.author.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span>{template.author.name}</span>
          {template.author.verified && <Verified className='w-3 h-3 text-blue-500' />}
        </div>
      </CardHeader>

      <CardContent className='pt-0'>
        <div className='flex flex-wrap gap-1 mb-3'>
          {template.tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant='secondary' className='text-xs'>
              {tag}
            </Badge>
          ))}
          {template.tags.length > 3 && (
            <Badge variant='outline' className='text-xs'>
              +{template.tags.length - 3}
            </Badge>
          )}
        </div>

        <div className='flex items-center justify-between text-sm text-gray-600 mb-3'>
          <div className='flex items-center gap-3'>
            <div className='flex items-center gap-1'>
              <Star className='w-4 h-4 text-yellow-500 fill-current' />
              <span>{template.stats.rating}</span>
            </div>
            <div className='flex items-center gap-1'>
              <Download className='w-4 h-4' />
              <span>{template.stats.downloads.toLocaleString()}</span>
            </div>
          </div>
          <div className='text-xs text-gray-500'>v{template.version}</div>
        </div>

        <div className='flex gap-2'>
          <Button size='sm' className='flex-1' onClick={() => handleDownloadTemplate(template)}>
            <Download className='w-4 h-4 mr-1' />
            Use Template
          </Button>
          <Button size='sm' variant='outline' onClick={() => setSelectedTemplate(template)}>
            <Eye className='w-4 h-4' />
          </Button>
          <Button size='sm' variant='outline' onClick={() => handleStarTemplate(template)}>
            <Star className='w-4 h-4' />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const FilterSidebar = () => (
    <div className='w-64 space-y-6'>
      <div>
        <Label className='text-sm font-medium mb-2 block'>Category</Label>
        <Select
          value={filters.category}
          onValueChange={value => setFilters(prev => ({ ...prev, category: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category} value={category.toLowerCase().replace(' ', '-')}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className='text-sm font-medium mb-2 block'>Sort By</Label>
        <Select
          value={filters.sortBy}
          onValueChange={(value: any) => setFilters(prev => ({ ...prev, sortBy: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='popular'>Most Popular</SelectItem>
            <SelectItem value='newest'>Newest</SelectItem>
            <SelectItem value='rating'>Highest Rated</SelectItem>
            <SelectItem value='downloads'>Most Downloaded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className='text-sm font-medium mb-2 block'>Price</Label>
        <Select
          value={filters.priceType}
          onValueChange={(value: any) => setFilters(prev => ({ ...prev, priceType: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Templates</SelectItem>
            <SelectItem value='free'>Free Only</SelectItem>
            <SelectItem value='premium'>Premium Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className='text-sm font-medium mb-2 block'>Minimum Rating</Label>
        <div className='flex gap-1'>
          {[1, 2, 3, 4, 5].map(rating => (
            <Button
              key={rating}
              size='sm'
              variant={filters.rating >= rating ? 'primary' : 'outline'}
              onClick={() => setFilters(prev => ({ ...prev, rating }))}
            >
              {rating}★
            </Button>
          ))}
        </div>
      </div>

      <div className='flex items-center space-x-2'>
        <input
          type='checkbox'
          id='verified'
          checked={filters.verified}
          onChange={e => setFilters(prev => ({ ...prev, verified: e.target.checked }))}
        />
        <Label htmlFor='verified' className='text-sm'>
          Verified Only
        </Label>
      </div>

      <div>
        <Label className='text-sm font-medium mb-2 block'>Popular Tags</Label>
        <div className='flex flex-wrap gap-1'>
          {popularTags.slice(0, 8).map(tag => (
            <Badge
              key={tag}
              variant='outline'
              className='text-xs cursor-pointer hover:bg-gray-100'
              onClick={() => setSearchQuery(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );

  const TemplateDetailsDialog = () => (
    <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        {selectedTemplate && (
          <>
            <DialogHeader>
              <div className='flex items-center justify-between'>
                <div>
                  <DialogTitle className='flex items-center gap-2'>
                    {selectedTemplate.name}
                    {selectedTemplate.verified && <Verified className='w-5 h-5 text-blue-500' />}
                    {selectedTemplate.featured && <Crown className='w-5 h-5 text-yellow-500' />}
                    {selectedTemplate.premium && <Sparkles className='w-5 h-5 text-purple-500' />}
                  </DialogTitle>
                  <DialogDescription>{selectedTemplate.description}</DialogDescription>
                </div>
                <div className='flex gap-2'>
                  <Button onClick={() => handleDownloadTemplate(selectedTemplate)}>
                    <Download className='w-4 h-4 mr-2' />
                    Use Template
                  </Button>
                  <Button variant='outline'>
                    <Share2 className='w-4 h-4 mr-2' />
                    Share
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
              <div className='lg:col-span-2 space-y-6'>
                <div>
                  <h3 className='text-lg font-semibold mb-3'>Configuration</h3>
                  <div className='grid grid-cols-2 gap-4 text-sm'>
                    <div>
                      <Label>Provider</Label>
                      <p className='text-gray-600'>{selectedTemplate.configuration.provider}</p>
                    </div>
                    <div>
                      <Label>Model</Label>
                      <p className='text-gray-600'>{selectedTemplate.configuration.model}</p>
                    </div>
                    <div>
                      <Label>Temperature</Label>
                      <p className='text-gray-600'>{selectedTemplate.configuration.temperature}</p>
                    </div>
                    <div>
                      <Label>Max Tokens</Label>
                      <p className='text-gray-600'>{selectedTemplate.configuration.maxTokens}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className='text-lg font-semibold mb-3'>System Prompt</h3>
                  <div className='bg-gray-50 p-3 rounded text-sm'>
                    {selectedTemplate.configuration.systemPrompt}
                  </div>
                </div>

                {selectedTemplate.preview && (
                  <div>
                    <h3 className='text-lg font-semibold mb-3'>Examples</h3>
                    <div className='space-y-2'>
                      {selectedTemplate.preview.examples.map((example, index) => (
                        <div key={index} className='bg-blue-50 p-3 rounded text-sm'>
                          {example}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className='text-lg font-semibold mb-3'>Reviews</h3>
                  <div className='space-y-4'>
                    {selectedTemplate.reviews.map(review => (
                      <div key={review.id} className='border rounded p-4'>
                        <div className='flex items-center justify-between mb-2'>
                          <div className='flex items-center gap-2'>
                            <Avatar className='w-6 h-6'>
                              <AvatarImage src={review.userAvatar} />
                              <AvatarFallback>{review.userName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className='font-medium'>{review.userName}</span>
                            {review.verified && <Verified className='w-4 h-4 text-blue-500' />}
                          </div>
                          <div className='flex items-center gap-1'>
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className='text-sm text-gray-600 mb-2'>{review.comment}</p>
                        <div className='flex items-center justify-between text-xs text-gray-500'>
                          <span>{review.date}</span>
                          <div className='flex items-center gap-2'>
                            <span>{review.helpful} helpful</span>
                            <Button size='sm' variant='ghost'>
                              <ThumbsUp className='w-3 h-3' />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className='space-y-6'>
                <div>
                  <h3 className='text-lg font-semibold mb-3'>Stats</h3>
                  <div className='space-y-3'>
                    <div className='flex justify-between'>
                      <span className='text-sm text-gray-600'>Downloads</span>
                      <span className='font-medium'>
                        {selectedTemplate.stats.downloads.toLocaleString()}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-sm text-gray-600'>Rating</span>
                      <div className='flex items-center gap-1'>
                        <Star className='w-4 h-4 text-yellow-500 fill-current' />
                        <span className='font-medium'>{selectedTemplate.stats.rating}</span>
                        <span className='text-xs text-gray-500'>
                          ({selectedTemplate.stats.reviews})
                        </span>
                      </div>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-sm text-gray-600'>Stars</span>
                      <span className='font-medium'>{selectedTemplate.stats.stars}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-sm text-gray-600'>Forks</span>
                      <span className='font-medium'>{selectedTemplate.stats.forks}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className='text-lg font-semibold mb-3'>Author</h3>
                  <div className='flex items-center gap-3'>
                    <Avatar>
                      <AvatarImage src={selectedTemplate.author.avatar} />
                      <AvatarFallback>{selectedTemplate.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className='flex items-center gap-2'>
                        <span className='font-medium'>{selectedTemplate.author.name}</span>
                        {selectedTemplate.author.verified && (
                          <Verified className='w-4 h-4 text-blue-500' />
                        )}
                      </div>
                      <div className='flex items-center gap-1 text-sm text-gray-600'>
                        <Star className='w-3 h-3 text-yellow-500 fill-current' />
                        <span>{selectedTemplate.author.reputation}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className='text-lg font-semibold mb-3'>Tags</h3>
                  <div className='flex flex-wrap gap-1'>
                    {selectedTemplate.tags.map(tag => (
                      <Badge key={tag} variant='secondary' className='text-xs'>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className='text-lg font-semibold mb-3'>Version History</h3>
                  <div className='space-y-2'>
                    {selectedTemplate.versions.map(version => (
                      <div key={version.id} className='border rounded p-3'>
                        <div className='flex items-center justify-between mb-1'>
                          <span className='font-medium'>v{version.version}</span>
                          <span className='text-xs text-gray-500'>{version.releaseDate}</span>
                        </div>
                        <p className='text-sm text-gray-600 mb-2'>{version.changelog}</p>
                        <div className='flex items-center gap-2 text-xs text-gray-500'>
                          <Download className='w-3 h-3' />
                          <span>{version.downloads}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );

  const CreateTemplateDialog = () => (
    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Create New Template</DialogTitle>
          <DialogDescription>Share your agent configuration with the community</DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div>
            <Label htmlFor='template-name'>Template Name</Label>
            <Input id='template-name' placeholder='Enter template name' />
          </div>

          <div>
            <Label htmlFor='template-description'>Description</Label>
            <Textarea id='template-description' placeholder='Describe your template' />
          </div>

          <div>
            <Label htmlFor='template-category'>Category</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder='Select category' />
              </SelectTrigger>
              <SelectContent>
                {categories.slice(1).map(category => (
                  <SelectItem key={category} value={category.toLowerCase().replace(' ', '-')}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor='template-tags'>Tags</Label>
            <Input id='template-tags' placeholder='Enter tags separated by commas' />
          </div>

          <div>
            <Label htmlFor='template-visibility'>Visibility</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder='Select visibility' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='public'>Public</SelectItem>
                <SelectItem value='private'>Private</SelectItem>
                <SelectItem value='community'>Community Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='flex items-center space-x-2'>
            <input type='checkbox' id='premium' />
            <Label htmlFor='premium'>Premium Template</Label>
          </div>

          <div className='flex gap-2'>
            <Button className='flex-1'>Create Template</Button>
            <Button variant='outline' onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <RefreshCw className='w-8 h-8 animate-spin' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Agent Marketplace</h1>
          <p className='text-gray-600'>Discover and share AI agent templates</p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={() => setShowShareDialog(true)}>
            <Upload className='w-4 h-4 mr-2' />
            Share Template
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className='w-4 h-4 mr-2' />
            Create Template
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value='browse'>Browse Templates</TabsTrigger>
          <TabsTrigger value='my-templates'>My Templates</TabsTrigger>
          <TabsTrigger value='favorites'>Favorites</TabsTrigger>
          <TabsTrigger value='trending'>Trending</TabsTrigger>
        </TabsList>

        <TabsContent value='browse' className='space-y-6'>
          <div className='flex gap-4'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
              <Input
                placeholder='Search templates...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='pl-10'
              />
            </div>
            <Button variant='outline'>
              <Filter className='w-4 h-4 mr-2' />
              Filters
            </Button>
          </div>

          <div className='flex gap-6'>
            <FilterSidebar />

            <div className='flex-1'>
              <div className='flex items-center justify-between mb-4'>
                <p className='text-sm text-gray-600'>{filteredTemplates.length} templates found</p>
                <div className='flex items-center gap-2'>
                  <Button size='sm' variant='outline'>
                    <TrendingUp className='w-4 h-4 mr-1' />
                    Featured
                  </Button>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {filteredTemplates.map(template => (
                  <TemplateCard key={template.id} template={template} />
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value='my-templates'>
          <div className='text-center py-12'>
            <BookOpen className='w-12 h-12 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-semibold mb-2'>No Templates Yet</h3>
            <p className='text-gray-600 mb-4'>
              Create your first template to share with the community
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className='w-4 h-4 mr-2' />
              Create Template
            </Button>
          </div>
        </TabsContent>

        <TabsContent value='favorites'>
          <div className='text-center py-12'>
            <Heart className='w-12 h-12 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-semibold mb-2'>No Favorites Yet</h3>
            <p className='text-gray-600'>Star templates you like to see them here</p>
          </div>
        </TabsContent>

        <TabsContent value='trending'>
          <div className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {filteredTemplates
                .filter(t => t.featured)
                .map(template => (
                  <TemplateCard key={template.id} template={template} />
                ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <TemplateDetailsDialog />
      <CreateTemplateDialog />
    </div>
  );
};

export default AgentMarketplace;
