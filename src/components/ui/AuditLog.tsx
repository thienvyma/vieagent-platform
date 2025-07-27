'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Shield,
  Eye,
  Edit,
  Trash2,
  Plus,
  User,
  Clock,
  Filter,
  Search,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  Activity,
  Database,
  FileText,
  Settings,
  Users,
  MessageSquare,
  Calendar,
} from 'lucide-react';
// ✅ FIXED in Phase 4D cleanup - Changed to default imports
import Table from './Table';
import DataExportSystem from './DataExportSystem';
import toast from 'react-hot-toast';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

// ✅ FIXED Phase 4D True Fix - Extend Record<string, unknown> for DataExportSystem compatibility
export interface AuditLogEntry extends Record<string, unknown> {
  id: string;
  timestamp: string;
  actor: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  action: string;
  resource: string;
  resourceId?: string;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'auth' | 'data' | 'system' | 'user' | 'security' | 'config';
  status: 'success' | 'failed' | 'pending' | 'cancelled';
  duration?: number;
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
}

export interface AuditLogFilters {
  actor?: string;
  action?: string;
  resource?: string;
  severity?: string;
  category?: string;
  status?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
}

export interface AuditLogProps {
  className?: string;
  showFilters?: boolean;
  showExport?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  pageSize?: number;
  onEntryClick?: (entry: AuditLogEntry) => void;
  apiEndpoint?: string;
}

// =============================================================================
// AUDIT LOG CATEGORIES & ACTIONS
// =============================================================================

const AUDIT_CATEGORIES = [
  {
    value: 'auth',
    label: 'Authentication',
    icon: <Shield className='w-4 h-4' />,
    color: 'text-blue-400',
  },
  {
    value: 'data',
    label: 'Data Operations',
    icon: <Database className='w-4 h-4' />,
    color: 'text-green-400',
  },
  {
    value: 'system',
    label: 'System Changes',
    icon: <Settings className='w-4 h-4' />,
    color: 'text-purple-400',
  },
  {
    value: 'user',
    label: 'User Management',
    icon: <Users className='w-4 h-4' />,
    color: 'text-orange-400',
  },
  {
    value: 'security',
    label: 'Security Events',
    icon: <AlertTriangle className='w-4 h-4' />,
    color: 'text-red-400',
  },
  {
    value: 'config',
    label: 'Configuration',
    icon: <FileText className='w-4 h-4' />,
    color: 'text-yellow-400',
  },
];

const AUDIT_ACTIONS = [
  'LOGIN',
  'LOGOUT',
  'FAILED_LOGIN',
  'PASSWORD_CHANGE',
  'PASSWORD_RESET',
  'CREATE',
  'UPDATE',
  'DELETE',
  'VIEW',
  'EXPORT',
  'IMPORT',
  'ROLE_CHANGE',
  'PERMISSION_GRANT',
  'PERMISSION_REVOKE',
  'SYSTEM_START',
  'SYSTEM_STOP',
  'BACKUP_CREATE',
  'BACKUP_RESTORE',
  'CONFIG_CHANGE',
  'SETTING_UPDATE',
  'API_KEY_CREATE',
  'API_KEY_REVOKE',
  'SECURITY_ALERT',
  'SUSPICIOUS_ACTIVITY',
  'ACCESS_DENIED',
];

const SEVERITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'text-gray-400', bg: 'bg-gray-500/20' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  { value: 'high', label: 'High', color: 'text-orange-400', bg: 'bg-orange-500/20' },
  { value: 'critical', label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/20' },
];

const STATUS_TYPES = [
  { value: 'success', label: 'Success', color: 'text-green-400', bg: 'bg-green-500/20' },
  { value: 'failed', label: 'Failed', color: 'text-red-400', bg: 'bg-red-500/20' },
  { value: 'pending', label: 'Pending', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  { value: 'cancelled', label: 'Cancelled', color: 'text-gray-400', bg: 'bg-gray-500/20' },
];

// =============================================================================
// AUDIT LOG SERVICE
// =============================================================================

class AuditLogService {
  private static instance: AuditLogService;
  // ✅ FIXED Phase 4D True Fix - Replace any with specific cache type
  private cache: Map<string, { timestamp: number; data: any }> = new Map();
  private cacheTimeout = 60000; // 1 minute

  static getInstance(): AuditLogService {
    if (!AuditLogService.instance) {
      AuditLogService.instance = new AuditLogService();
    }
    return AuditLogService.instance;
  }

  async fetchLogs(
    filters: AuditLogFilters = {},
    page = 1,
    limit = 20
  ): Promise<{
    logs: AuditLogEntry[];
    total: number;
    totalPages: number;
  }> {
    const cacheKey = `logs_${JSON.stringify(filters)}_${page}_${limit}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters.actor && { actor: filters.actor }),
        ...(filters.action && { action: filters.action }),
        ...(filters.resource && { resource: filters.resource }),
        ...(filters.severity && { severity: filters.severity }),
        ...(filters.category && { category: filters.category }),
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
        ...(filters.dateRange?.start && { startDate: filters.dateRange.start }),
        ...(filters.dateRange?.end && { endDate: filters.dateRange.end }),
      });

      const response = await fetch(`/api/audit/logs?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch audit logs');
      }

      const result = {
        logs: data.data.logs || [],
        total: data.data.total || 0,
        totalPages: data.data.totalPages || 1,
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      throw error;
    }
  }

  async createLogEntry(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<AuditLogEntry> {
    try {
      const response = await fetch('/api/audit/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create audit log entry');
      }

      // Clear cache to force refresh
      this.cache.clear();

      return data.data;
    } catch (error) {
      console.error('Failed to create audit log entry:', error);
      throw error;
    }
  }

  async getLogDetails(logId: string): Promise<AuditLogEntry> {
    try {
      const response = await fetch(`/api/audit/logs/${logId}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch log details');
      }

      return data.data;
    } catch (error) {
      console.error('Failed to fetch log details:', error);
      throw error;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function AuditLog({
  className = '',
  showFilters = true,
  showExport = true,
  autoRefresh = false,
  refreshInterval = 30000,
  pageSize = 20,
  onEntryClick,
  apiEndpoint = '/api/audit/logs',
}: AuditLogProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const auditService = AuditLogService.getInstance();

  // =============================================================================
  // EFFECTS
  // =============================================================================

  useEffect(() => {
    loadLogs();
  }, [filters, currentPage]);

  // ✅ FIXED Phase 4D True Fix - Fix useEffect return value
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadLogs, refreshInterval);
      return () => clearInterval(interval);
    }

    // Return undefined for other cases
    return undefined;
  }, [autoRefresh, refreshInterval, filters, currentPage]);

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await auditService.fetchLogs(filters, currentPage, pageSize);

      setLogs(result.logs);
      setTotalPages(result.totalPages);
      setTotalLogs(result.total);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load audit logs';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, pageSize, auditService]);

  const handleFilterChange = useCallback((key: keyof AuditLogFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setCurrentPage(1);
  }, []);

  const handleEntryClick = useCallback(
    async (entry: AuditLogEntry) => {
      if (onEntryClick) {
        onEntryClick(entry);
        return;
      }

      try {
        const details = await auditService.getLogDetails(entry.id);
        setSelectedEntry(details);
        setShowDetails(true);
      } catch (error) {
        toast.error('Failed to load entry details');
      }
    },
    [onEntryClick, auditService]
  );

  const handleRefresh = useCallback(() => {
    auditService.clearCache();
    loadLogs();
    toast.success('Audit logs refreshed');
  }, [auditService, loadLogs]);

  // =============================================================================
  // TABLE CONFIGURATION
  // =============================================================================

  // ✅ FIXED in Phase 4D cleanup - Fixed TableColumn interface compatibility
  const tableColumns = useMemo(
    () => [
      {
        id: 'timestamp',
        header: 'Time',
        accessor: 'timestamp' as keyof AuditLogEntry,
        sortable: true,
        cell: (row: AuditLogEntry, value: string) => (
          <div className='text-sm'>
            <div className='text-white'>{new Date(value).toLocaleDateString()}</div>
            <div className='text-gray-400'>{new Date(value).toLocaleTimeString()}</div>
          </div>
        ),
      },
      {
        id: 'actor',
        header: 'Actor',
        accessor: 'actor' as keyof AuditLogEntry,
        sortable: true,
        cell: (row: AuditLogEntry, value: AuditLogEntry['actor']) => (
          <div className='flex items-center space-x-2'>
            <User className='w-4 h-4 text-gray-400' />
            <div>
              <div className='text-white text-sm font-medium'>{value.name}</div>
              <div className='text-gray-400 text-xs'>{value.role}</div>
            </div>
          </div>
        ),
      },
      {
        id: 'action',
        header: 'Action',
        accessor: 'action' as keyof AuditLogEntry,
        sortable: true,
        cell: (row: AuditLogEntry, value: string) => (
          <span className='px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-sm font-medium'>
            {value}
          </span>
        ),
      },
      {
        id: 'resource',
        header: 'Resource',
        accessor: 'resource' as keyof AuditLogEntry,
        sortable: true,
        cell: (row: AuditLogEntry, value: string) => <span className='text-gray-300'>{value}</span>,
      },
      {
        id: 'category',
        header: 'Category',
        accessor: 'category' as keyof AuditLogEntry,
        sortable: true,
        cell: (row: AuditLogEntry, value: string) => {
          const cat = AUDIT_CATEGORIES.find(c => c.value === value);
          return (
            <div className='flex items-center space-x-1'>
              <span className={cat?.color || 'text-gray-400'}>
                {cat?.icon || <Activity className='w-4 h-4' />}
              </span>
              <span className='text-gray-300 text-sm'>{cat?.label || value}</span>
            </div>
          );
        },
      },
      {
        id: 'severity',
        header: 'Severity',
        accessor: 'severity' as keyof AuditLogEntry,
        sortable: true,
        cell: (row: AuditLogEntry, value: string) => {
          const sev = SEVERITY_LEVELS.find(s => s.value === value);
          return (
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${sev?.bg || 'bg-gray-500/20'} ${sev?.color || 'text-gray-400'}`}
            >
              {sev?.label || value}
            </span>
          );
        },
      },
      {
        id: 'status',
        header: 'Status',
        accessor: 'status' as keyof AuditLogEntry,
        sortable: true,
        cell: (row: AuditLogEntry, value: string) => {
          const stat = STATUS_TYPES.find(s => s.value === value);
          const Icon =
            value === 'success'
              ? CheckCircle
              : value === 'failed'
                ? XCircle
                : value === 'pending'
                  ? Clock
                  : Info;
          return (
            <div className='flex items-center space-x-1'>
              <Icon className={`w-4 h-4 ${stat?.color || 'text-gray-400'}`} />
              <span className={`text-sm ${stat?.color || 'text-gray-400'}`}>
                {stat?.label || value}
              </span>
            </div>
          );
        },
      },
      {
        id: 'description',
        header: 'Description',
        accessor: 'description' as keyof AuditLogEntry,
        cell: (row: AuditLogEntry, value: string) => (
          <span className='text-gray-300 text-sm'>{value}</span>
        ),
      },
    ],
    []
  );

  // ✅ FIXED in Phase 4D cleanup - Fixed exportColumns mapping for new TableColumn structure
  const exportColumns = useMemo(
    () =>
      tableColumns.map(col => ({
        key: col.id,
        label: col.header,
        type: 'text' as const,
        included: true,
      })),
    [tableColumns]
  );

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderFilters = () => (
    <div className='bg-gray-800 rounded-lg p-4 mb-6'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-white font-semibold flex items-center space-x-2'>
          <Filter className='w-4 h-4' />
          <span>Filters</span>
        </h3>
        <button
          onClick={handleClearFilters}
          className='text-gray-400 hover:text-white text-sm transition-colors'
        >
          Clear All
        </button>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {/* Search */}
        <div>
          <label className='block text-gray-300 text-sm mb-1'>Search</label>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
            <input
              type='text'
              value={filters.search || ''}
              onChange={e => handleFilterChange('search', e.target.value)}
              className='w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
              placeholder='Search logs...'
            />
          </div>
        </div>

        {/* Action */}
        <div>
          <label className='block text-gray-300 text-sm mb-1'>Action</label>
          <select
            value={filters.action || ''}
            onChange={e => handleFilterChange('action', e.target.value)}
            className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
          >
            <option value=''>All Actions</option>
            {AUDIT_ACTIONS.map(action => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <label className='block text-gray-300 text-sm mb-1'>Category</label>
          <select
            value={filters.category || ''}
            onChange={e => handleFilterChange('category', e.target.value)}
            className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
          >
            <option value=''>All Categories</option>
            {AUDIT_CATEGORIES.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        {/* Severity */}
        <div>
          <label className='block text-gray-300 text-sm mb-1'>Severity</label>
          <select
            value={filters.severity || ''}
            onChange={e => handleFilterChange('severity', e.target.value)}
            className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
          >
            <option value=''>All Severities</option>
            {SEVERITY_LEVELS.map(severity => (
              <option key={severity.value} value={severity.value}>
                {severity.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className='block text-gray-300 text-sm mb-1'>Status</label>
          <select
            value={filters.status || ''}
            onChange={e => handleFilterChange('status', e.target.value)}
            className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
          >
            <option value=''>All Statuses</option>
            {STATUS_TYPES.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div>
          <label className='block text-gray-300 text-sm mb-1'>Start Date</label>
          <input
            type='date'
            value={filters.dateRange?.start || ''}
            onChange={e =>
              handleFilterChange('dateRange', {
                ...filters.dateRange,
                start: e.target.value,
              })
            }
            className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
          />
        </div>

        <div>
          <label className='block text-gray-300 text-sm mb-1'>End Date</label>
          <input
            type='date'
            value={filters.dateRange?.end || ''}
            onChange={e =>
              handleFilterChange('dateRange', {
                ...filters.dateRange,
                end: e.target.value,
              })
            }
            className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
          />
        </div>
      </div>
    </div>
  );

  const renderHeader = () => (
    <div className='flex items-center justify-between mb-6'>
      <div>
        <h2 className='text-2xl font-bold text-white flex items-center space-x-2'>
          <Shield className='w-6 h-6 text-blue-400' />
          <span>Audit Trail</span>
        </h2>
        <p className='text-gray-400'>Track and monitor system activities</p>
      </div>

      <div className='flex items-center space-x-2'>
        <button
          onClick={handleRefresh}
          className='px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2'
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>

        {showExport && (
          <DataExportSystem
            data={logs}
            columns={exportColumns}
            defaultFormat='csv'
            className='ml-2'
          />
        )}
      </div>
    </div>
  );

  const renderStats = () => (
    <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
      <div className='bg-gray-800 rounded-lg p-4'>
        <div className='flex items-center space-x-2'>
          <Activity className='w-5 h-5 text-blue-400' />
          <span className='text-gray-300'>Total Logs</span>
        </div>
        <div className='text-2xl font-bold text-white mt-2'>{totalLogs.toLocaleString()}</div>
      </div>

      <div className='bg-gray-800 rounded-lg p-4'>
        <div className='flex items-center space-x-2'>
          <CheckCircle className='w-5 h-5 text-green-400' />
          <span className='text-gray-300'>Success Rate</span>
        </div>
        <div className='text-2xl font-bold text-white mt-2'>
          {totalLogs > 0
            ? Math.round((logs.filter(l => l.status === 'success').length / logs.length) * 100)
            : 0}
          %
        </div>
      </div>

      <div className='bg-gray-800 rounded-lg p-4'>
        <div className='flex items-center space-x-2'>
          <AlertTriangle className='w-5 h-5 text-red-400' />
          <span className='text-gray-300'>Critical Events</span>
        </div>
        <div className='text-2xl font-bold text-white mt-2'>
          {logs.filter(l => l.severity === 'critical').length}
        </div>
      </div>

      <div className='bg-gray-800 rounded-lg p-4'>
        <div className='flex items-center space-x-2'>
          <Users className='w-5 h-5 text-purple-400' />
          <span className='text-gray-300'>Active Users</span>
        </div>
        <div className='text-2xl font-bold text-white mt-2'>
          {new Set(logs.map(l => l.actor.id)).size}
        </div>
      </div>
    </div>
  );

  const renderDetailsModal = () =>
    selectedEntry &&
    showDetails && (
      <div className='fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
        <div className='bg-gray-900 rounded-xl border border-gray-800 max-w-4xl w-full max-h-[90vh] overflow-y-auto'>
          <div className='p-6 border-b border-gray-800 flex items-center justify-between'>
            <h3 className='text-xl font-bold text-white'>Audit Log Details</h3>
            <button
              onClick={() => setShowDetails(false)}
              className='text-gray-400 hover:text-white'
            >
              ✕
            </button>
          </div>

          <div className='p-6 space-y-6'>
            {/* Basic Info */}
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='text-gray-400 text-sm'>Timestamp</label>
                <div className='text-white'>
                  {new Date(selectedEntry.timestamp).toLocaleString()}
                </div>
              </div>
              <div>
                <label className='text-gray-400 text-sm'>Duration</label>
                <div className='text-white'>
                  {selectedEntry.duration ? `${selectedEntry.duration}ms` : 'N/A'}
                </div>
              </div>
              <div>
                <label className='text-gray-400 text-sm'>IP Address</label>
                <div className='text-white'>{selectedEntry.ipAddress || 'N/A'}</div>
              </div>
              <div>
                <label className='text-gray-400 text-sm'>Resource ID</label>
                <div className='text-white'>{selectedEntry.resourceId || 'N/A'}</div>
              </div>
            </div>

            {/* Metadata */}
            {selectedEntry.metadata && (
              <div>
                <label className='text-gray-400 text-sm'>Metadata</label>
                <pre className='bg-gray-800 rounded p-4 text-gray-300 text-sm overflow-x-auto'>
                  {JSON.stringify(selectedEntry.metadata, null, 2)}
                </pre>
              </div>
            )}

            {/* Changes */}
            {selectedEntry.changes && (
              <div>
                <label className='text-gray-400 text-sm'>Changes</label>
                <div className='grid grid-cols-2 gap-4'>
                  {selectedEntry.changes.before && (
                    <div>
                      <label className='text-gray-400 text-xs'>Before</label>
                      <pre className='bg-gray-800 rounded p-4 text-gray-300 text-sm overflow-x-auto'>
                        {JSON.stringify(selectedEntry.changes.before, null, 2)}
                      </pre>
                    </div>
                  )}
                  {selectedEntry.changes.after && (
                    <div>
                      <label className='text-gray-400 text-xs'>After</label>
                      <pre className='bg-gray-800 rounded p-4 text-gray-300 text-sm overflow-x-auto'>
                        {JSON.stringify(selectedEntry.changes.after, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* User Agent */}
            {selectedEntry.userAgent && (
              <div>
                <label className='text-gray-400 text-sm'>User Agent</label>
                <div className='text-white text-sm break-all'>{selectedEntry.userAgent}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  if (error) {
    return (
      <div className={`bg-gray-900 rounded-xl border border-gray-800 p-6 ${className}`}>
        <div className='text-center'>
          <AlertTriangle className='w-12 h-12 text-red-400 mx-auto mb-4' />
          <h3 className='text-white font-semibold mb-2'>Failed to Load Audit Logs</h3>
          <p className='text-gray-400 mb-4'>{error}</p>
          <button
            onClick={handleRefresh}
            className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 rounded-xl border border-gray-800 p-6 ${className}`}>
      {renderHeader()}
      {renderStats()}
      {showFilters && renderFilters()}

      {/* ✅ FIXED in Phase 4D cleanup - Fixed pagination structure to match TablePagination interface */}
      <Table
        data={logs}
        columns={tableColumns}
        loading={loading}
        pagination={{
          pageIndex: currentPage - 1,
          pageSize,
          total: totalLogs,
        }}
        onPaginationChange={pagination => setCurrentPage(pagination.pageIndex + 1)}
        className='mt-6'
      />

      {renderDetailsModal()}
    </div>
  );
}

// =============================================================================
// AUDIT LOG HOOK
// =============================================================================

export function useAuditLog() {
  const auditService = AuditLogService.getInstance();

  const logActivity = useCallback(
    async (
      action: string,
      resource: string,
      options: {
        resourceId?: string;
        description?: string;
        metadata?: Record<string, any>;
        severity?: AuditLogEntry['severity'];
        category?: AuditLogEntry['category'];
        changes?: AuditLogEntry['changes'];
      } = {}
    ) => {
      try {
        // Get current user info (would come from session/context in real app)
        const actor = {
          id: 'current-user-id',
          name: 'Current User',
          email: 'user@example.com',
          role: 'USER',
        };

        await auditService.createLogEntry({
          actor,
          action,
          resource,
          resourceId: options.resourceId,
          description: options.description || `${action} ${resource}`,
          metadata: options.metadata,
          severity: options.severity || 'low',
          category: options.category || 'data',
          status: 'success',
          changes: options.changes,
          ipAddress: 'client-ip', // Would be detected on server
          userAgent: navigator.userAgent,
        });
      } catch (error) {
        console.error('Failed to log audit activity:', error);
      }
    },
    [auditService]
  );

  return { logActivity };
}
