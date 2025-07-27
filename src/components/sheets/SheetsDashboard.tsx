'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface SheetData {
  id?: string;
  googleSheetId: string;
  title: string;
  url: string;
  worksheets: Array<{
    id: number;
    title: string;
    index: number;
    rowCount: number;
    columnCount: number;
  }>;
  range?: string;
  headers?: string[];
  dataTypes?: Record<string, string>;
  purpose?: 'data_collection' | 'reporting' | 'analysis' | 'contact_management' | 'email_analytics';
}

interface SheetTemplate {
  name: string;
  description: string;
  headers: string[];
  dataTypes: Record<string, string>;
  purpose: string;
}

interface SheetsStats {
  totalSheets: number;
  emailAnalytics: number;
  reports: number;
  contacts: number;
  dataCollection: number;
}

export default function SheetsDashboard() {
  const { data: session } = useSession();

  // State management
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [templates, setTemplates] = useState<SheetTemplate[]>([]);
  const [stats, setStats] = useState<SheetsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string>('');

  // UI states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SheetTemplate | null>(null);

  // Form states
  const [newSheetTitle, setNewSheetTitle] = useState<string>('');
  const [selectedSheetData, setSelectedSheetData] = useState<any[][] | null>(null);
  const [showDataModal, setShowDataModal] = useState(false);

  // Load data on component mount
  useEffect(() => {
    if (session?.user) {
      loadSheetsData();
      loadTemplates();
      loadStats();
    }
  }, [session]);

  const loadSheetsData = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('📊 Loading Sheets data...');

      // First check if user has connected Google account
      const accountsResponse = await fetch('/api/google/accounts');
      console.log('🔍 Checking Google accounts:', accountsResponse.status);

      if (accountsResponse.ok) {
        const accounts = await accountsResponse.json();
        console.log('📋 Found Google accounts:', accounts.length);

        if (accounts.length === 0) {
          console.log('ℹ️  No Google accounts found - showing connect UI');
          setError('No Google Sheets authentication found. Please reconnect your account.');
          setLoading(false);
          return;
        }
      } else {
        console.error('❌ Failed to check Google accounts');
        setError('Failed to check Google account status');
        setLoading(false);
        return;
      }

      // If we have accounts, proceed with Sheets API
      const response = await fetch('/api/google/sheets?action=list');
      console.log('📡 Sheets API response status:', response.status);

      const result = await response.json();
      console.log('📊 Sheets API result:', result);

      if (result.success) {
        setSheets(result.data || []);
        console.log('✅ Sheets data loaded successfully');
      } else {
        const errorMsg = result.error || 'Failed to load spreadsheets';
        console.error('❌ Sheets API error:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      const errorMsg =
        'Failed to connect to Sheets service: ' +
        (err instanceof Error ? err.message : String(err));
      console.error('❌ Sheets connection error:', err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/google/sheets?action=templates');
      const result = await response.json();

      if (result.success) {
        setTemplates(result.data || []);
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/google/sheets?action=stats');
      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const createSpreadsheet = async (title: string, templateName?: string) => {
    try {
      setCreating(true);

      const response = await fetch('/api/google/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          title,
          templateName,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setShowCreateForm(false);
        setShowTemplateModal(false);
        setNewSheetTitle('');
        setSelectedTemplate(null);
        await loadSheetsData();
        await loadStats();
        alert('Spreadsheet created successfully!');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to create spreadsheet');
    } finally {
      setCreating(false);
    }
  };

  const generateEmailReport = async () => {
    try {
      setGenerating(true);

      const response = await fetch('/api/google/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-email-report',
        }),
      });

      const result = await response.json();

      if (result.success) {
        await loadSheetsData();
        await loadStats();
        alert('Email analytics report generated!');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to generate email report');
    } finally {
      setGenerating(false);
    }
  };

  const generateCalendarReport = async () => {
    try {
      setGenerating(true);

      const response = await fetch('/api/google/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-calendar-report',
        }),
      });

      const result = await response.json();

      if (result.success) {
        await loadSheetsData();
        await loadStats();
        alert('Calendar report generated!');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to generate calendar report');
    } finally {
      setGenerating(false);
    }
  };

  const generateContactList = async () => {
    try {
      setGenerating(true);

      const response = await fetch('/api/google/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-contact-list',
        }),
      });

      const result = await response.json();

      if (result.success) {
        await loadSheetsData();
        await loadStats();
        alert('Contact list generated!');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to generate contact list');
    } finally {
      setGenerating(false);
    }
  };

  const viewSheetData = async (sheet: SheetData) => {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/google/sheets?action=read&spreadsheetId=${sheet.googleSheetId}&range=Sheet1!A1:Z20`
      );
      const result = await response.json();

      if (result.success) {
        setSelectedSheetData(result.data.values);
        setShowDataModal(true);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to load sheet data');
    } finally {
      setLoading(false);
    }
  };

  const deleteSheet = async (sheet: SheetData) => {
    if (!confirm(`Are you sure you want to delete "${sheet.title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/google/sheets?sheetId=${sheet.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        await loadSheetsData();
        await loadStats();
        alert('Spreadsheet deleted successfully!');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to delete spreadsheet');
    }
  };

  const getPurposeColor = (purpose?: string) => {
    switch (purpose) {
      case 'email_analytics':
        return 'text-purple-400 bg-purple-500/20';
      case 'reporting':
        return 'text-blue-400 bg-blue-500/20';
      case 'contact_management':
        return 'text-green-400 bg-green-500/20';
      case 'data_collection':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'analysis':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getPurposeIcon = (purpose?: string) => {
    switch (purpose) {
      case 'email_analytics':
        return '📧';
      case 'reporting':
        return '📊';
      case 'contact_management':
        return '👥';
      case 'data_collection':
        return '📋';
      case 'analysis':
        return '🔍';
      default:
        return '📄';
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-96'>
        <div className='text-center'>
          <div className='w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-white'>Loading spreadsheets...</p>
        </div>
      </div>
    );
  }

  if (error && !sheets.length) {
    // Check if error is about authentication - show connect UI instead of error
    const isAuthError =
      error.includes('authentication') ||
      error.includes('reconnect') ||
      error.includes('No Google');

    if (isAuthError) {
      return (
        <div className='bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl p-8 text-center'>
          <div className='w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6'>
            <span className='text-3xl'>📊</span>
          </div>
          <h3 className='text-2xl font-bold text-white mb-3'>Kết nối Google Sheets</h3>
          <p className='text-gray-300 mb-6 max-w-md mx-auto'>
            Để sử dụng tính năng Sheets, bạn cần kết nối tài khoản Google của mình.
          </p>
          <button
            onClick={() => (window.location.href = '/api/auth/google/connect')}
            className='bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105'
          >
            🔗 Kết nối Google Sheets
          </button>
          <div className='mt-6 text-sm text-gray-400'>
            <p>Sau khi kết nối, bạn có thể:</p>
            <ul className='mt-2 space-y-1 text-left max-w-xs mx-auto'>
              <li>• Tạo và quản lý spreadsheet</li>
              <li>• Tự động tạo báo cáo email</li>
              <li>• Xuất dữ liệu lịch</li>
              <li>• Quản lý danh sách liên hệ</li>
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
            <h3 className='text-red-300 font-semibold'>Sheets Error</h3>
            <p className='text-red-200 mb-3'>{error}</p>
            <div className='bg-red-500/10 rounded-lg p-3 mb-3'>
              <h4 className='text-red-300 text-sm font-medium mb-2'>Debug Information:</h4>
              <div className='text-red-200 text-xs space-y-1'>
                <div>• API Endpoint: /api/google/sheets</div>
                <div>• Check browser console for detailed error logs</div>
                <div>• Verify Google account has Sheets permissions</div>
                <div>• Ensure OAuth scopes include spreadsheets access</div>
              </div>
            </div>
            <div className='flex space-x-2'>
              <button
                onClick={loadSheetsData}
                className='text-sm bg-red-500/30 text-red-200 px-3 py-1 rounded-lg hover:bg-red-500/50 transition-colors'
              >
                🔄 Retry
              </button>
              <button
                onClick={() => window.open('/api/google/sheets?action=list', '_blank')}
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
      {/* Sheets Stats */}
      {stats && (
        <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
          <div className='bg-blue-500/20 border border-blue-500/30 rounded-2xl p-4'>
            <div className='flex items-center space-x-3'>
              <span className='text-2xl'>📊</span>
              <div>
                <p className='text-blue-300 text-sm'>Total Sheets</p>
                <p className='text-white text-xl font-bold'>{stats.totalSheets}</p>
              </div>
            </div>
          </div>

          <div className='bg-purple-500/20 border border-purple-500/30 rounded-2xl p-4'>
            <div className='flex items-center space-x-3'>
              <span className='text-2xl'>📧</span>
              <div>
                <p className='text-purple-300 text-sm'>Email Analytics</p>
                <p className='text-white text-xl font-bold'>{stats.emailAnalytics}</p>
              </div>
            </div>
          </div>

          <div className='bg-green-500/20 border border-green-500/30 rounded-2xl p-4'>
            <div className='flex items-center space-x-3'>
              <span className='text-2xl'>👥</span>
              <div>
                <p className='text-green-300 text-sm'>Contacts</p>
                <p className='text-white text-xl font-bold'>{stats.contacts}</p>
              </div>
            </div>
          </div>

          <div className='bg-yellow-500/20 border border-yellow-500/30 rounded-2xl p-4'>
            <div className='flex items-center space-x-3'>
              <span className='text-2xl'>📋</span>
              <div>
                <p className='text-yellow-300 text-sm'>Data Collection</p>
                <p className='text-white text-xl font-bold'>{stats.dataCollection}</p>
              </div>
            </div>
          </div>

          <div className='bg-red-500/20 border border-red-500/30 rounded-2xl p-4'>
            <div className='flex items-center space-x-3'>
              <span className='text-2xl'>📈</span>
              <div>
                <p className='text-red-300 text-sm'>Reports</p>
                <p className='text-white text-xl font-bold'>{stats.reports}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold text-white'>📊 Sheets Management</h3>
          <div className='flex space-x-2'>
            <button
              onClick={() => setShowTemplateModal(true)}
              disabled={creating}
              className='bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50'
            >
              📝 Use Template
            </button>
            <button
              onClick={() => setShowCreateForm(true)}
              disabled={creating}
              className='bg-gradient-to-r from-green-500 to-blue-600 text-white px-4 py-2 rounded-xl hover:from-green-600 hover:to-blue-700 transition-all disabled:opacity-50'
            >
              ➕ New Sheet
            </button>
          </div>
        </div>

        {/* Quick Report Generation */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <button
            onClick={generateEmailReport}
            disabled={generating}
            className='bg-purple-500/20 border border-purple-500/30 text-purple-300 p-4 rounded-2xl hover:bg-purple-500/30 transition-all text-left disabled:opacity-50'
          >
            <div className='flex items-center space-x-3'>
              <span className='text-2xl'>📧</span>
              <div>
                <h4 className='font-semibold'>Email Analytics</h4>
                <p className='text-sm opacity-80'>Generate email performance report</p>
              </div>
            </div>
          </button>

          <button
            onClick={generateCalendarReport}
            disabled={generating}
            className='bg-blue-500/20 border border-blue-500/30 text-blue-300 p-4 rounded-2xl hover:bg-blue-500/30 transition-all text-left disabled:opacity-50'
          >
            <div className='flex items-center space-x-3'>
              <span className='text-2xl'>📅</span>
              <div>
                <h4 className='font-semibold'>Calendar Report</h4>
                <p className='text-sm opacity-80'>Analyze meeting patterns</p>
              </div>
            </div>
          </button>

          <button
            onClick={generateContactList}
            disabled={generating}
            className='bg-green-500/20 border border-green-500/30 text-green-300 p-4 rounded-2xl hover:bg-green-500/30 transition-all text-left disabled:opacity-50'
          >
            <div className='flex items-center space-x-3'>
              <span className='text-2xl'>👥</span>
              <div>
                <h4 className='font-semibold'>Contact List</h4>
                <p className='text-sm opacity-80'>Extract contacts from emails</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Spreadsheets List */}
      <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10'>
        <h3 className='text-lg font-semibold text-white mb-4'>📄 Your Spreadsheets</h3>

        {sheets.length === 0 ? (
          <div className='text-center py-12'>
            <span className='text-6xl mb-4 block'>📊</span>
            <p className='text-gray-400'>No spreadsheets found</p>
            <p className='text-gray-500 text-sm'>Create your first spreadsheet to get started</p>
          </div>
        ) : (
          <div className='space-y-3'>
            {sheets.map(sheet => (
              <div key={sheet.id} className='bg-white/5 rounded-xl p-4 border border-white/5'>
                <div className='flex justify-between items-start'>
                  <div className='flex-1'>
                    <div className='flex items-center space-x-2 mb-2'>
                      <span className='text-xl'>{getPurposeIcon(sheet.purpose)}</span>
                      <h4 className='text-white font-medium'>{sheet.title}</h4>
                      {sheet.purpose && (
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${getPurposeColor(sheet.purpose)}`}
                        >
                          {sheet.purpose.replace('_', ' ').toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className='flex items-center space-x-4 text-sm text-gray-400'>
                      <span>📋 {sheet.worksheets.length} worksheet(s)</span>
                      {sheet.headers && <span>📊 {sheet.headers.length} columns</span>}
                      <span>🔗 Google Sheets</span>
                    </div>
                  </div>

                  <div className='flex items-center space-x-2 ml-4'>
                    <button
                      onClick={() => viewSheetData(sheet)}
                      disabled={loading}
                      className='bg-blue-500/20 text-blue-300 px-3 py-1 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50'
                    >
                      👁️ View
                    </button>
                    <a
                      href={sheet.url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='bg-green-500/20 text-green-300 px-3 py-1 rounded-lg hover:bg-green-500/30 transition-colors'
                    >
                      🔗 Open
                    </a>
                    <button
                      onClick={() => deleteSheet(sheet)}
                      className='bg-red-500/20 text-red-300 px-3 py-1 rounded-lg hover:bg-red-500/30 transition-colors'
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Sheet Modal */}
      {showCreateForm && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50'>
          <div className='bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md mx-4'>
            <h3 className='text-white font-semibold mb-4'>Create New Spreadsheet</h3>

            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-300 mb-2'>Title</label>
                <input
                  type='text'
                  value={newSheetTitle}
                  onChange={e => setNewSheetTitle(e.target.value)}
                  placeholder='Enter spreadsheet title'
                  className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500'
                />
              </div>
            </div>

            <div className='flex space-x-3 pt-4'>
              <button
                onClick={() => setShowCreateForm(false)}
                className='flex-1 bg-gray-700 text-white py-2 rounded-xl hover:bg-gray-600 transition-colors'
              >
                Cancel
              </button>
              <button
                onClick={() => createSpreadsheet(newSheetTitle)}
                disabled={creating || !newSheetTitle.trim()}
                className='flex-1 bg-gradient-to-r from-green-500 to-blue-600 text-white py-2 rounded-xl hover:from-green-600 hover:to-blue-700 transition-all disabled:opacity-50'
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Selection Modal */}
      {showTemplateModal && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50'>
          <div className='bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto'>
            <h3 className='text-white font-semibold mb-4'>Choose Template</h3>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
              {templates.map(template => (
                <button
                  key={template.name}
                  onClick={() => setSelectedTemplate(template)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    selectedTemplate?.name === template.name
                      ? 'bg-purple-500/20 border-purple-500/50'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <h4 className='text-white font-medium mb-2'>{template.name}</h4>
                  <p className='text-gray-400 text-sm mb-2'>{template.description}</p>
                  <div className='flex flex-wrap gap-1'>
                    {template.headers.slice(0, 3).map(header => (
                      <span
                        key={header}
                        className='px-2 py-1 bg-gray-600/50 text-gray-300 text-xs rounded'
                      >
                        {header}
                      </span>
                    ))}
                    {template.headers.length > 3 && (
                      <span className='px-2 py-1 bg-gray-600/50 text-gray-300 text-xs rounded'>
                        +{template.headers.length - 3} more
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {selectedTemplate && (
              <div className='mb-4'>
                <label className='block text-sm font-medium text-gray-300 mb-2'>
                  Spreadsheet Title
                </label>
                <input
                  type='text'
                  value={newSheetTitle}
                  onChange={e => setNewSheetTitle(e.target.value)}
                  placeholder={`Enter title for ${selectedTemplate.name}`}
                  className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500'
                />
              </div>
            )}

            <div className='flex space-x-3'>
              <button
                onClick={() => {
                  setShowTemplateModal(false);
                  setSelectedTemplate(null);
                  setNewSheetTitle('');
                }}
                className='flex-1 bg-gray-700 text-white py-2 rounded-xl hover:bg-gray-600 transition-colors'
              >
                Cancel
              </button>
              <button
                onClick={() => createSpreadsheet(newSheetTitle, selectedTemplate?.name)}
                disabled={creating || !selectedTemplate || !newSheetTitle.trim()}
                className='flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white py-2 rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all disabled:opacity-50'
              >
                {creating ? 'Creating...' : 'Create from Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data Preview Modal */}
      {showDataModal && selectedSheetData && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50'>
          <div className='bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto'>
            <h3 className='text-white font-semibold mb-4'>📊 Sheet Data Preview</h3>

            <div className='bg-gray-800/50 rounded-xl p-4 overflow-x-auto'>
              <table className='w-full text-sm'>
                <tbody>
                  {selectedSheetData.slice(0, 10).map((row, index) => (
                    <tr key={index} className={index === 0 ? 'border-b border-gray-600' : ''}>
                      {row.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className={`px-3 py-2 ${
                            index === 0 ? 'text-white font-medium' : 'text-gray-300'
                          }`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {selectedSheetData.length > 10 && (
                <p className='text-gray-400 text-center mt-4'>
                  ... and {selectedSheetData.length - 10} more rows
                </p>
              )}
            </div>

            <div className='flex justify-end pt-4'>
              <button
                onClick={() => {
                  setShowDataModal(false);
                  setSelectedSheetData(null);
                }}
                className='bg-gray-700 text-white px-6 py-2 rounded-xl hover:bg-gray-600 transition-colors'
              >
                Close
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
