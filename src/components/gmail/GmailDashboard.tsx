'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import {
  Mail,
  Search,
  Filter,
  RefreshCw,
  MoreHorizontal,
  Send,
  Archive,
  Trash2,
  Star,
  Reply,
  Forward,
  Settings,
  Eye,
  Download,
  Clock,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Zap,
  Brain,
  Sparkles,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Loader2,
} from 'lucide-react';

// ✅ Phase 5 lazy load - Lazy load heavy components for better performance
const EmailAnalysisPanel = lazy(() => import('./EmailAnalysisPanel'));
const AutoResponsePanel = lazy(() => import('./AutoResponsePanel'));
const EmailStatsWidget = lazy(() => import('./EmailStatsWidget'));

interface EmailData {
  id: string;
  threadId: string;
  subject: string;
  from: {
    email: string;
    name?: string;
  };
  to: Array<{
    email: string;
    name?: string;
  }>;
  bodyText?: string;
  bodyHtml?: string;
  date: string;
  isRead: boolean;
  isStarred: boolean;
  importance: 'high' | 'normal' | 'low';
}

interface EmailAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  urgency: 'urgent' | 'normal' | 'low';
  category: string;
  keyTopics: string[];
  entities: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;
  meetingDetected?: {
    hasDateTime: boolean;
    suggestedEvent?: {
      title: string;
      startTime?: string;
      endTime?: string;
      location?: string;
      attendees: string[];
    };
  };
}

interface AutoResponse {
  type: 'acknowledgment' | 'information' | 'meeting_confirmation' | 'escalation';
  content: string;
  confidence: number;
  shouldSend: boolean;
  reasoning: string;
}

interface GmailStats {
  unreadCount: number;
  importantCount: number;
  todayCount: number;
  totalProcessed: number;
}

export default function GmailDashboard() {
  const { data: session } = useSession();

  // State management
  const [emails, setEmails] = useState<EmailData[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailData | null>(null);
  const [emailAnalysis, setEmailAnalysis] = useState<EmailAnalysis | null>(null);
  const [autoResponse, setAutoResponse] = useState<AutoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [stats, setStats] = useState<GmailStats | null>(null);
  const [error, setError] = useState<string>('');

  // Filter states
  const [selectedLabel, setSelectedLabel] = useState<string>('INBOX');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');

  // UI states
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(false);
  const [showResponsePanel, setShowResponsePanel] = useState(false);
  const [customReply, setCustomReply] = useState<string>('');

  // Load emails on component mount
  useEffect(() => {
    if (session?.user) {
      loadEmails();
      loadStats();
    }
  }, [session, selectedLabel, searchQuery]);

  const loadEmails = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('📧 Loading Gmail data...');

      // First check if user has connected Google account
      const accountsResponse = await fetch('/api/google/accounts');
      console.log('🔍 Checking Google accounts:', accountsResponse.status);

      if (accountsResponse.ok) {
        const accounts = await accountsResponse.json();
        console.log('📋 Found Google accounts:', accounts.length);

        if (accounts.length === 0) {
          console.log('ℹ️  No Google accounts found - showing connect UI');
          setError('No Gmail authentication found. Please reconnect your account.');
          setLoading(false);
          return;
        }
      } else {
        console.error('❌ Failed to check Google accounts');
        setError('Failed to check Google account status');
        setLoading(false);
        return;
      }

      // If we have accounts, proceed with Gmail API
      const params = new URLSearchParams({
        action: 'list',
        maxResults: '20',
      });

      if (selectedLabel !== 'all') {
        params.append('labelIds', selectedLabel);
      }

      if (searchQuery) {
        params.append('query', searchQuery);
      }

      const response = await fetch(`/api/google/gmail?${params}`);
      console.log('📡 Gmail API response status:', response.status);

      const result = await response.json();
      console.log('📊 Gmail API result:', result);

      if (result.success) {
        setEmails(result.data.emails || []);
        console.log('✅ Gmail data loaded successfully');
      } else {
        const errorMsg = result.error || 'Failed to load emails';
        console.error('❌ Gmail API error:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      const errorMsg =
        'Failed to connect to Gmail service: ' + (err instanceof Error ? err.message : String(err));
      console.error('❌ Gmail connection error:', err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/google/gmail?action=stats');
      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      }
    } catch (err) {
      console.error('Failed to load Gmail stats:', err);
    }
  };

  const analyzeEmail = async (email: EmailData) => {
    try {
      setAnalyzing(true);
      setSelectedEmail(email);
      setShowAnalysisPanel(true);

      const response = await fetch(`/api/google/gmail?action=analyze&messageId=${email.id}`);
      const result = await response.json();

      if (result.success) {
        setEmailAnalysis(result.data.analysis);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to analyze email');
    } finally {
      setAnalyzing(false);
    }
  };

  const generateAutoResponse = async (email: EmailData) => {
    try {
      setAnalyzing(true);

      const response = await fetch(`/api/google/gmail?action=auto-response&messageId=${email.id}`);
      const result = await response.json();

      if (result.success) {
        setEmailAnalysis(result.data.analysis);
        setAutoResponse(result.data.autoResponse);
        setCustomReply(result.data.autoResponse.content);
        setShowResponsePanel(true);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to generate response');
    } finally {
      setAnalyzing(false);
    }
  };

  const sendReply = async () => {
    if (!selectedEmail || !customReply.trim()) return;

    try {
      setAnalyzing(true);

      const response = await fetch('/api/google/gmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send-reply',
          originalEmailId: selectedEmail.id,
          replyContent: customReply,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setShowResponsePanel(false);
        setCustomReply('');
        setAutoResponse(null);
        alert('Reply sent successfully!');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to send reply');
    } finally {
      setAnalyzing(false);
    }
  };

  const batchAnalyzeEmails = async () => {
    const unreadEmails = emails.filter(email => !email.isRead).slice(0, 5);
    if (unreadEmails.length === 0) return;

    try {
      setAnalyzing(true);

      const response = await fetch('/api/google/gmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batch-analyze',
          messageIds: unreadEmails.map(email => email.id),
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`Analyzed ${result.data.length} emails successfully!`);
        loadEmails(); // Refresh the list
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to analyze emails');
    } finally {
      setAnalyzing(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high':
        return 'text-red-400 bg-red-500/20';
      case 'normal':
        return 'text-blue-400 bg-blue-500/20';
      case 'low':
        return 'text-gray-400 bg-gray-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-400 bg-green-500/20';
      case 'negative':
        return 'text-red-400 bg-red-500/20';
      case 'neutral':
        return 'text-gray-400 bg-gray-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return 'text-red-400 bg-red-500/20';
      case 'normal':
        return 'text-blue-400 bg-blue-500/20';
      case 'low':
        return 'text-green-400 bg-green-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-96'>
        <div className='text-center'>
          <div className='w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-white'>Loading emails...</p>
        </div>
      </div>
    );
  }

  if (error && !emails.length) {
    // Check if error is about authentication - show connect UI instead of error
    const isAuthError =
      error.includes('authentication') || error.includes('reconnect') || error.includes('No Gmail');

    if (isAuthError) {
      return (
        <div className='bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-2xl p-8 text-center'>
          <div className='w-20 h-20 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6'>
            <span className='text-3xl'>📧</span>
          </div>
          <h3 className='text-2xl font-bold text-white mb-3'>Kết nối Gmail</h3>
          <p className='text-gray-300 mb-6 max-w-md mx-auto'>
            Để sử dụng tính năng Gmail, bạn cần kết nối tài khoản Google của mình.
          </p>
          <button
            onClick={() => (window.location.href = '/api/auth/google/connect')}
            className='bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105'
          >
            🔗 Kết nối Gmail
          </button>
          <div className='mt-6 text-sm text-gray-400'>
            <p>Sau khi kết nối, bạn có thể:</p>
            <ul className='mt-2 space-y-1 text-left max-w-xs mx-auto'>
              <li>• Xem và quản lý email</li>
              <li>• Phân tích nội dung email</li>
              <li>• Tự động phản hồi thông minh</li>
              <li>• Phát hiện cuộc họp từ email</li>
            </ul>
          </div>
        </div>
      );
    }

    return (
      <div className='bg-red-500/20 border border-red-500/50 rounded-2xl p-6'>
        <div className='flex items-center space-x-3'>
          <span className='text-2xl'>⚠️</span>
          <div className='flex-1'>
            <h3 className='text-red-300 font-semibold'>Gmail Error</h3>
            <p className='text-red-200 mb-3'>{error}</p>
            <div className='bg-red-500/10 rounded-lg p-3 mb-3'>
              <h4 className='text-red-300 text-sm font-medium mb-2'>Debug Information:</h4>
              <div className='text-red-200 text-xs space-y-1'>
                <div>• API Endpoint: /api/google/gmail</div>
                <div>• Check browser console for detailed error logs</div>
                <div>• Verify Google account has Gmail permissions</div>
                <div>• Ensure OAuth scopes include gmail.readonly and gmail.send</div>
              </div>
            </div>
            <div className='flex space-x-2'>
              <button
                onClick={loadEmails}
                className='text-sm bg-red-500/30 text-red-200 px-3 py-1 rounded-lg hover:bg-red-500/50 transition-colors'
              >
                🔄 Retry
              </button>
              <button
                onClick={() => window.open('/api/google/gmail?action=list', '_blank')}
                className='text-sm bg-red-500/30 text-red-200 px-3 py-1 rounded-lg hover:bg-red-500/50 transition-colors'
              >
                🔍 Test API
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Gmail Stats */}
      {stats && (
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <div className='bg-blue-500/20 border border-blue-500/30 rounded-2xl p-4'>
            <div className='flex items-center space-x-3'>
              <span className='text-2xl'>📧</span>
              <div>
                <p className='text-blue-300 text-sm'>Unread</p>
                <p className='text-white text-xl font-bold'>{stats.unreadCount}</p>
              </div>
            </div>
          </div>

          <div className='bg-yellow-500/20 border border-yellow-500/30 rounded-2xl p-4'>
            <div className='flex items-center space-x-3'>
              <span className='text-2xl'>⭐</span>
              <div>
                <p className='text-yellow-300 text-sm'>Important</p>
                <p className='text-white text-xl font-bold'>{stats.importantCount}</p>
              </div>
            </div>
          </div>

          <div className='bg-green-500/20 border border-green-500/30 rounded-2xl p-4'>
            <div className='flex items-center space-x-3'>
              <span className='text-2xl'>📈</span>
              <div>
                <p className='text-green-300 text-sm'>Today</p>
                <p className='text-white text-xl font-bold'>{stats.todayCount}</p>
              </div>
            </div>
          </div>

          <div className='bg-purple-500/20 border border-purple-500/30 rounded-2xl p-4'>
            <div className='flex items-center space-x-3'>
              <span className='text-2xl text-blue-400'>AI</span>
              <div>
                <p className='text-purple-300 text-sm'>AI Processed</p>
                <p className='text-white text-xl font-bold'>{stats.totalProcessed}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold text-white'>📧 Gmail Management</h3>
          <div className='flex space-x-2'>
            <button
              onClick={batchAnalyzeEmails}
              disabled={analyzing || emails.filter(e => !e.isRead).length === 0}
              className='bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2 rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all disabled:opacity-50'
            >
              {analyzing ? 'Processing...' : '🧠 Analyze Unread'}
            </button>
            <button
              onClick={loadEmails}
              disabled={loading}
              className='bg-gradient-to-r from-green-500 to-blue-600 text-white px-4 py-2 rounded-xl hover:from-green-600 hover:to-blue-700 transition-all disabled:opacity-50'
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <div>
            <label className='block text-sm font-medium text-gray-300 mb-2'>Label</label>
            <select
              value={selectedLabel}
              onChange={e => setSelectedLabel(e.target.value)}
              className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500'
            >
              <option value='INBOX'>Inbox</option>
              <option value='SENT'>Sent</option>
              <option value='IMPORTANT'>Important</option>
              <option value='STARRED'>Starred</option>
              <option value='UNREAD'>Unread</option>
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-300 mb-2'>Search</label>
            <input
              type='text'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder='Search emails...'
              className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-300 mb-2'>Sentiment</label>
            <select
              value={sentimentFilter}
              onChange={e => setSentimentFilter(e.target.value)}
              className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500'
            >
              <option value='all'>All</option>
              <option value='positive'>Positive</option>
              <option value='negative'>Negative</option>
              <option value='neutral'>Neutral</option>
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-300 mb-2'>Urgency</label>
            <select
              value={urgencyFilter}
              onChange={e => setUrgencyFilter(e.target.value)}
              className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500'
            >
              <option value='all'>All</option>
              <option value='urgent'>Urgent</option>
              <option value='normal'>Normal</option>
              <option value='low'>Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Email List */}
      <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10'>
        <h3 className='text-lg font-semibold text-white mb-4'>📬 Email List</h3>

        {emails.length === 0 ? (
          <div className='text-center py-12'>
            <span className='text-6xl mb-4 block'>📧</span>
            <p className='text-gray-400'>No emails found</p>
            <p className='text-gray-500 text-sm'>Try adjusting your filters or refreshing</p>
          </div>
        ) : (
          <div className='space-y-3'>
            {emails.slice(0, 20).map(email => (
              <div
                key={email.id}
                className={`rounded-xl p-4 border transition-all hover:bg-white/10 ${
                  email.isRead ? 'bg-white/5 border-white/5' : 'bg-blue-500/10 border-blue-500/20'
                }`}
              >
                <div className='flex justify-between items-start'>
                  <div className='flex-1'>
                    <div className='flex items-center space-x-2 mb-2'>
                      <h4
                        className={`font-medium ${email.isRead ? 'text-gray-300' : 'text-white'}`}
                      >
                        {email.subject || '(No Subject)'}
                      </h4>
                      {email.isStarred && <span className='text-yellow-400'>⭐</span>}
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${getImportanceColor(email.importance)}`}
                      >
                        {email.importance.toUpperCase()}
                      </span>
                    </div>

                    <div className='flex items-center space-x-4 text-sm text-gray-400'>
                      <span>👤 {email.from.name || email.from.email}</span>
                      <span>🕐 {formatDateTime(email.date)}</span>
                      {!email.isRead && <span className='text-blue-400 font-medium'>UNREAD</span>}
                    </div>

                    {email.bodyText && (
                      <p className='text-gray-300 text-sm mt-2 line-clamp-2'>
                        {email.bodyText.substring(0, 150)}...
                      </p>
                    )}
                  </div>

                  <div className='flex items-center space-x-2 ml-4'>
                    <button
                      onClick={() => analyzeEmail(email)}
                      disabled={analyzing}
                      className='bg-purple-500/20 text-purple-300 px-3 py-1 rounded-lg hover:bg-purple-500/30 transition-colors disabled:opacity-50'
                    >
                      🧠 Analyze
                    </button>
                    <button
                      onClick={() => generateAutoResponse(email)}
                      disabled={analyzing}
                      className='bg-green-500/20 text-green-300 px-3 py-1 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50'
                    >
                      Auto Reply
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Analysis Panel */}
      {showAnalysisPanel && selectedEmail && emailAnalysis && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50'>
          <div className='bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto'>
            <h3 className='text-white font-semibold mb-4'>🧠 Email Analysis</h3>

            <div className='space-y-4'>
              <div>
                <h4 className='text-white font-medium mb-2'>Email Details</h4>
                <p className='text-gray-300'>
                  <strong>Subject:</strong> {selectedEmail.subject}
                </p>
                <p className='text-gray-300'>
                  <strong>From:</strong> {selectedEmail.from.name || selectedEmail.from.email}
                </p>
                <p className='text-gray-300'>
                  <strong>Date:</strong> {formatDateTime(selectedEmail.date)}
                </p>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div>
                  <h4 className='text-white font-medium mb-2'>Sentiment</h4>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${getSentimentColor(emailAnalysis.sentiment)}`}
                  >
                    {emailAnalysis.sentiment.toUpperCase()}
                  </span>
                </div>

                <div>
                  <h4 className='text-white font-medium mb-2'>Urgency</h4>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${getUrgencyColor(emailAnalysis.urgency)}`}
                  >
                    {emailAnalysis.urgency.toUpperCase()}
                  </span>
                </div>

                <div>
                  <h4 className='text-white font-medium mb-2'>Category</h4>
                  <span className='px-3 py-1 rounded-full text-sm bg-blue-500/20 text-blue-300'>
                    {emailAnalysis.category.toUpperCase()}
                  </span>
                </div>
              </div>

              {emailAnalysis.keyTopics.length > 0 && (
                <div>
                  <h4 className='text-white font-medium mb-2'>Key Topics</h4>
                  <div className='flex flex-wrap gap-2'>
                    {emailAnalysis.keyTopics.map((topic, index) => (
                      <span
                        key={index}
                        className='px-2 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-sm'
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {emailAnalysis.entities.length > 0 && (
                <div>
                  <h4 className='text-white font-medium mb-2'>Extracted Entities</h4>
                  <div className='space-y-2'>
                    {emailAnalysis.entities.map((entity, index) => (
                      <div
                        key={index}
                        className='flex justify-between items-center bg-white/5 rounded-lg p-2'
                      >
                        <span className='text-gray-300'>{entity.value}</span>
                        <span className='text-xs text-gray-400'>
                          {entity.type} ({Math.round(entity.confidence * 100)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {emailAnalysis.meetingDetected && (
                <div className='bg-green-500/10 border border-green-500/30 rounded-xl p-4'>
                  <h4 className='text-green-300 font-medium mb-2'>📅 Meeting Detected</h4>
                  {emailAnalysis.meetingDetected.suggestedEvent && (
                    <div className='space-y-1 text-sm text-green-200'>
                      <p>
                        <strong>Title:</strong> {emailAnalysis.meetingDetected.suggestedEvent.title}
                      </p>
                      {emailAnalysis.meetingDetected.suggestedEvent.startTime && (
                        <p>
                          <strong>Time:</strong>{' '}
                          {new Date(
                            emailAnalysis.meetingDetected.suggestedEvent.startTime
                          ).toLocaleString()}
                        </p>
                      )}
                      {emailAnalysis.meetingDetected.suggestedEvent.location && (
                        <p>
                          <strong>Location:</strong>{' '}
                          {emailAnalysis.meetingDetected.suggestedEvent.location}
                        </p>
                      )}
                      <p>
                        <strong>Attendees:</strong>{' '}
                        {emailAnalysis.meetingDetected.suggestedEvent.attendees.length} found
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className='flex justify-end pt-4'>
              <button
                onClick={() => setShowAnalysisPanel(false)}
                className='bg-gray-700 text-white px-6 py-2 rounded-xl hover:bg-gray-600 transition-colors'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto Response Panel */}
      {showResponsePanel && selectedEmail && autoResponse && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50'>
          <div className='bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto'>
            <h3 className='text-white font-semibold mb-4'>Auto Response Generator</h3>

            <div className='space-y-4'>
              <div>
                <h4 className='text-white font-medium mb-2'>Response Analysis</h4>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <p className='text-gray-400 text-sm'>Type</p>
                    <p className='text-white'>{autoResponse.type}</p>
                  </div>
                  <div>
                    <p className='text-gray-400 text-sm'>Confidence</p>
                    <p className='text-white'>{Math.round(autoResponse.confidence * 100)}%</p>
                  </div>
                </div>
                <div className='mt-2'>
                  <p className='text-gray-400 text-sm'>Reasoning</p>
                  <p className='text-gray-300'>{autoResponse.reasoning}</p>
                </div>
              </div>

              <div>
                <h4 className='text-white font-medium mb-2'>Generated Response</h4>
                <textarea
                  value={customReply}
                  onChange={e => setCustomReply(e.target.value)}
                  className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500'
                  rows={6}
                />
              </div>

              <div className='flex items-center space-x-2'>
                <input
                  type='checkbox'
                  checked={autoResponse.shouldSend}
                  readOnly
                  className='rounded border-gray-600 text-purple-500 focus:ring-purple-500'
                />
                <label className='text-sm text-gray-300'>
                  AI recommends {autoResponse.shouldSend ? 'sending' : 'reviewing'} this response
                </label>
              </div>
            </div>

            <div className='flex space-x-3 pt-4'>
              <button
                onClick={() => setShowResponsePanel(false)}
                className='flex-1 bg-gray-700 text-white py-2 rounded-xl hover:bg-gray-600 transition-colors'
              >
                Cancel
              </button>
              <button
                onClick={sendReply}
                disabled={analyzing || !customReply.trim()}
                className='flex-1 bg-gradient-to-r from-green-500 to-blue-600 text-white py-2 rounded-xl hover:from-green-600 hover:to-blue-700 transition-all disabled:opacity-50'
              >
                {analyzing ? 'Sending...' : 'Send Reply'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className='bg-red-500/20 border border-red-500/50 rounded-2xl p-4'>
          <div className='flex items-center space-x-2'>
            <span className='text-red-400'>⚠️</span>
            <span className='text-red-300'>{error}</span>
            <button
              onClick={() => setError('')}
              className='ml-auto text-red-400 hover:text-red-300'
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
