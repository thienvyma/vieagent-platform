'use client';

import React, { useState, useCallback, useRef } from 'react';
import {
  Download,
  FileText,
  Table as TableIcon,
  File,
  Filter,
  Settings,
  Calendar,
  Users,
  CheckSquare,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface ExportColumn {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'currency' | 'custom';
  format?: string;
  width?: number;
  included: boolean;
}

export interface ExportFormat {
  id: 'csv' | 'excel' | 'pdf' | 'json';
  name: string;
  description: string;
  icon: React.ReactNode;
  mimeType: string;
  extension: string;
  supportedFeatures: {
    formatting: boolean;
    multipleSheets: boolean;
    images: boolean;
    charts: boolean;
    styling: boolean;
  };
}

export interface ExportFilters {
  dateRange?: {
    start: string;
    end: string;
    field: string;
  };
  search?: {
    query: string;
    fields: string[];
  };
  status?: string[];
  category?: string[];
  customFilters?: Record<string, any>;
}

export interface ExportOptions {
  format: ExportFormat['id'];
  columns: ExportColumn[];
  filters: ExportFilters;
  settings: {
    includeHeaders: boolean;
    includeMetadata: boolean;
    includeImages: boolean;
    pageSize: 'A4' | 'Letter' | 'Legal';
    orientation: 'portrait' | 'landscape';
    compression: boolean;
    password?: string;
  };
  filename: string;
  title?: string;
  description?: string;
}

// ✅ FIXED Phase 4D True Fix - Replace any[] with Record type
export interface DataExportSystemProps {
  data: Record<string, unknown>[];
  columns: ExportColumn[];
  onExport?: (options: ExportOptions) => Promise<void>;
  className?: string;
  defaultFormat?: ExportFormat['id'];
  showFilters?: boolean;
  showSettings?: boolean;
  customFormats?: ExportFormat[];
}

// =============================================================================
// EXPORT FORMATS
// =============================================================================

const DEFAULT_EXPORT_FORMATS: ExportFormat[] = [
  {
    id: 'csv',
    name: 'CSV',
    description: 'Comma-separated values for spreadsheet applications',
    icon: <FileText className='w-4 h-4' />,
    mimeType: 'text/csv',
    extension: '.csv',
    supportedFeatures: {
      formatting: false,
      multipleSheets: false,
      images: false,
      charts: false,
      styling: false,
    },
  },
  {
    id: 'excel',
    name: 'Excel',
    description: 'Microsoft Excel spreadsheet with formatting',
    icon: <TableIcon className='w-4 h-4' />,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extension: '.xlsx',
    supportedFeatures: {
      formatting: true,
      multipleSheets: true,
      images: true,
      charts: true,
      styling: true,
    },
  },
  {
    id: 'pdf',
    name: 'PDF',
    description: 'Portable Document Format for sharing and printing',
    icon: <File className='w-4 h-4' />,
    mimeType: 'application/pdf',
    extension: '.pdf',
    supportedFeatures: {
      formatting: true,
      multipleSheets: false,
      images: true,
      charts: false,
      styling: true,
    },
  },
  {
    id: 'json',
    name: 'JSON',
    description: 'JavaScript Object Notation for developers',
    icon: <FileText className='w-4 h-4' />,
    mimeType: 'application/json',
    extension: '.json',
    supportedFeatures: {
      formatting: false,
      multipleSheets: false,
      images: false,
      charts: false,
      styling: false,
    },
  },
];

// =============================================================================
// EXPORT UTILITIES
// =============================================================================

class DataExportUtils {
  // ✅ FIXED Phase 4D True Fix - Replace any[] with Record type
  static generateCSV(
    data: Record<string, unknown>[],
    columns: ExportColumn[],
    options: ExportOptions
  ): string {
    const selectedColumns = columns.filter(col => col.included);

    let csv = '';

    // Add headers
    if (options.settings.includeHeaders) {
      csv += selectedColumns.map(col => `"${col.label}"`).join(',') + '\n';
    }

    // Add data rows
    data.forEach(row => {
      const values = selectedColumns.map(col => {
        const value = row[col.key];
        return `"${this.formatValue(value, col)}"`;
      });
      csv += values.join(',') + '\n';
    });

    return csv;
  }

  // ✅ FIXED Phase 4D True Fix - Replace any[] with Record type
  static async generateExcel(
    data: Record<string, unknown>[],
    columns: ExportColumn[],
    options: ExportOptions
  ): Promise<Blob> {
    // Mock Excel generation - in production, use libraries like xlsx or exceljs
    const csv = this.generateCSV(data, columns, options);
    return new Blob([csv], { type: 'text/csv' });
  }

  // ✅ FIXED Phase 4D True Fix - Replace any[] with Record type
  static async generatePDF(
    data: Record<string, unknown>[],
    columns: ExportColumn[],
    options: ExportOptions
  ): Promise<Blob> {
    // Mock PDF generation - in production, use libraries like jsPDF or puppeteer
    const content = `
      <html>
        <head>
          <title>${options.title || 'Export'}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .metadata { margin-bottom: 20px; color: #666; }
          </style>
        </head>
        <body>
          ${
            options.settings.includeMetadata
              ? `
            <div class="metadata">
              <h1>${options.title || 'Data Export'}</h1>
              <p>Generated on: ${new Date().toLocaleString()}</p>
              <p>Total records: ${data.length}</p>
            </div>
          `
              : ''
          }
          <table>
            <thead>
              <tr>
                ${columns
                  .filter(col => col.included)
                  .map(col => `<th>${col.label}</th>`)
                  .join('')}
              </tr>
            </thead>
            <tbody>
              ${data
                .map(
                  row => `
                <tr>
                  ${columns
                    .filter(col => col.included)
                    .map(
                      col => `
                    <td>${this.formatValue(row[col.key], col)}</td>
                  `
                    )
                    .join('')}
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    return new Blob([content], { type: 'text/html' });
  }

  // ✅ FIXED Phase 4D True Fix - Replace any[] with Record type
  static generateJSON(
    data: Record<string, unknown>[],
    columns: ExportColumn[],
    options: ExportOptions
  ): string {
    const selectedColumns = columns.filter(col => col.included);

    const exportData = {
      ...(options.settings.includeMetadata && {
        metadata: {
          title: options.title,
          description: options.description,
          exportedAt: new Date().toISOString(),
          totalRecords: data.length,
          columns: selectedColumns.map(col => ({
            key: col.key,
            label: col.label,
            type: col.type,
          })),
        },
      }),
      data: data.map(row => {
        const filteredRow: any = {};
        selectedColumns.forEach(col => {
          filteredRow[col.key] = this.formatValue(row[col.key], col);
        });
        return filteredRow;
      }),
    };

    return JSON.stringify(exportData, null, 2);
  }

  static formatValue(value: any, column: ExportColumn): string {
    if (value === null || value === undefined) return '';

    switch (column.type) {
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(value);
      case 'boolean':
        return value ? 'Yes' : 'No';
      case 'number':
        return typeof value === 'number' ? value.toString() : value;
      default:
        return String(value);
    }
  }

  static applyFilters(data: any[], filters: ExportFilters): any[] {
    let filteredData = [...data];

    // Date range filter
    if (filters.dateRange) {
      const { start, end, field } = filters.dateRange;
      filteredData = filteredData.filter(item => {
        const itemDate = new Date(item[field]);
        return itemDate >= new Date(start) && itemDate <= new Date(end);
      });
    }

    // Search filter
    if (filters.search && filters.search.query) {
      const { query, fields } = filters.search;
      filteredData = filteredData.filter(item =>
        fields.some(field => String(item[field]).toLowerCase().includes(query.toLowerCase()))
      );
    }

    // Status filter
    if (filters.status && filters.status.length > 0) {
      filteredData = filteredData.filter(item => filters.status!.includes(item.status));
    }

    // Category filter
    if (filters.category && filters.category.length > 0) {
      filteredData = filteredData.filter(item => filters.category!.includes(item.category));
    }

    return filteredData;
  }

  static downloadFile(content: string | Blob, filename: string, mimeType: string) {
    const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function DataExportSystem({
  data,
  columns: initialColumns,
  onExport,
  className = '',
  defaultFormat = 'csv',
  showFilters = true,
  showSettings = true,
  customFormats = [],
}: DataExportSystemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const [selectedFormat, setSelectedFormat] = useState<ExportFormat['id']>(defaultFormat);
  const [columns, setColumns] = useState<ExportColumn[]>(initialColumns);
  const [filters, setFilters] = useState<ExportFilters>({});
  const [settings, setSettings] = useState({
    includeHeaders: true,
    includeMetadata: true,
    includeImages: false,
    pageSize: 'A4' as const,
    orientation: 'portrait' as const,
    compression: false,
    password: '',
  });
  const [filename, setFilename] = useState('export');
  const [title, setTitle] = useState('Data Export');
  const [description, setDescription] = useState('');

  const exportFormats = [...DEFAULT_EXPORT_FORMATS, ...customFormats];
  const currentFormat = exportFormats.find(f => f.id === selectedFormat)!;

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleColumnToggle = useCallback((columnKey: string) => {
    setColumns(prev =>
      prev.map(col => (col.key === columnKey ? { ...col, included: !col.included } : col))
    );
  }, []);

  const handleSelectAllColumns = useCallback((selected: boolean) => {
    setColumns(prev => prev.map(col => ({ ...col, included: selected })));
  }, []);

  const handleFilterChange = useCallback((filterType: keyof ExportFilters, value: any) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  }, []);

  const handleExport = useCallback(async () => {
    if (columns.filter(col => col.included).length === 0) {
      toast.error('Please select at least one column to export');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      // Apply filters
      const filteredData = DataExportUtils.applyFilters(data, filters);

      if (filteredData.length === 0) {
        toast.error('No data to export with current filters');
        return;
      }

      setExportProgress(25);

      const exportOptions: ExportOptions = {
        format: selectedFormat,
        columns,
        filters,
        settings,
        filename: `${filename}${currentFormat.extension}`,
        title,
        description,
      };

      setExportProgress(50);

      // Generate export content
      let content: string | Blob;

      switch (selectedFormat) {
        case 'csv':
          content = DataExportUtils.generateCSV(filteredData, columns, exportOptions);
          break;
        case 'excel':
          content = await DataExportUtils.generateExcel(filteredData, columns, exportOptions);
          break;
        case 'pdf':
          content = await DataExportUtils.generatePDF(filteredData, columns, exportOptions);
          break;
        case 'json':
          content = DataExportUtils.generateJSON(filteredData, columns, exportOptions);
          break;
        default:
          throw new Error(`Unsupported format: ${selectedFormat}`);
      }

      setExportProgress(75);

      // Call custom export handler if provided
      if (onExport) {
        await onExport(exportOptions);
      } else {
        // Default download
        DataExportUtils.downloadFile(content, exportOptions.filename, currentFormat.mimeType);
      }

      setExportProgress(100);
      toast.success(`Export completed successfully! (${filteredData.length} records)`);
      setIsOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  }, [
    data,
    columns,
    filters,
    settings,
    selectedFormat,
    filename,
    title,
    description,
    currentFormat,
    onExport,
  ]);

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderFormatSelection = () => (
    <div className='space-y-3'>
      <h3 className='text-white font-semibold'>Export Format</h3>
      <div className='grid grid-cols-2 gap-2'>
        {exportFormats.map(format => (
          <button
            key={format.id}
            onClick={() => setSelectedFormat(format.id)}
            className={`p-3 rounded-lg border-2 transition-all text-left ${
              selectedFormat === format.id
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            <div className='flex items-center space-x-2 mb-1'>
              {format.icon}
              <span className='text-white font-medium'>{format.name}</span>
            </div>
            <p className='text-gray-400 text-xs'>{format.description}</p>
          </button>
        ))}
      </div>
    </div>
  );

  const renderColumnSelection = () => (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <h3 className='text-white font-semibold'>Columns</h3>
        <div className='flex items-center space-x-2'>
          <button
            onClick={() => handleSelectAllColumns(true)}
            className='text-xs text-blue-400 hover:text-blue-300'
          >
            Select All
          </button>
          <span className='text-gray-500'>|</span>
          <button
            onClick={() => handleSelectAllColumns(false)}
            className='text-xs text-blue-400 hover:text-blue-300'
          >
            Select None
          </button>
        </div>
      </div>

      <div className='max-h-48 overflow-y-auto space-y-2'>
        {columns.map(column => (
          <label key={column.key} className='flex items-center space-x-2 cursor-pointer'>
            <input
              type='checkbox'
              checked={column.included}
              onChange={() => handleColumnToggle(column.key)}
              className='text-blue-500'
            />
            <span className='text-gray-300'>{column.label}</span>
            <span className='text-gray-500 text-xs'>({column.type})</span>
          </label>
        ))}
      </div>

      <div className='text-sm text-gray-400'>
        {columns.filter(col => col.included).length} of {columns.length} columns selected
      </div>
    </div>
  );

  const renderFilters = () => (
    <div className='space-y-4'>
      <h3 className='text-white font-semibold'>Filters</h3>

      {/* Date Range Filter */}
      <div>
        <label className='block text-gray-300 text-sm mb-2'>Date Range</label>
        <div className='grid grid-cols-2 gap-2'>
          <input
            type='date'
            value={filters.dateRange?.start || ''}
            onChange={e =>
              handleFilterChange('dateRange', {
                ...filters.dateRange,
                start: e.target.value,
                field: filters.dateRange?.field || 'createdAt',
              })
            }
            className='px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
          />
          <input
            type='date'
            value={filters.dateRange?.end || ''}
            onChange={e =>
              handleFilterChange('dateRange', {
                ...filters.dateRange,
                end: e.target.value,
                field: filters.dateRange?.field || 'createdAt',
              })
            }
            className='px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
          />
        </div>
      </div>

      {/* Search Filter */}
      <div>
        <label className='block text-gray-300 text-sm mb-2'>Search</label>
        <input
          type='text'
          value={filters.search?.query || ''}
          onChange={e =>
            handleFilterChange('search', {
              query: e.target.value,
              fields: columns.map(col => col.key),
            })
          }
          placeholder='Search in all fields...'
          className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
        />
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className='space-y-4'>
      <h3 className='text-white font-semibold'>Settings</h3>

      <div className='space-y-3'>
        <label className='flex items-center space-x-2'>
          <input
            type='checkbox'
            checked={settings.includeHeaders}
            onChange={e => setSettings(prev => ({ ...prev, includeHeaders: e.target.checked }))}
            className='text-blue-500'
          />
          <span className='text-gray-300'>Include column headers</span>
        </label>

        <label className='flex items-center space-x-2'>
          <input
            type='checkbox'
            checked={settings.includeMetadata}
            onChange={e => setSettings(prev => ({ ...prev, includeMetadata: e.target.checked }))}
            className='text-blue-500'
          />
          <span className='text-gray-300'>Include metadata</span>
        </label>

        {currentFormat.supportedFeatures.images && (
          <label className='flex items-center space-x-2'>
            <input
              type='checkbox'
              checked={settings.includeImages}
              onChange={e => setSettings(prev => ({ ...prev, includeImages: e.target.checked }))}
              className='text-blue-500'
            />
            <span className='text-gray-300'>Include images</span>
          </label>
        )}

        {currentFormat.id === 'pdf' && (
          <>
            <div>
              <label className='block text-gray-300 text-sm mb-1'>Page Size</label>
              <select
                value={settings.pageSize}
                onChange={e => setSettings(prev => ({ ...prev, pageSize: e.target.value as any }))}
                className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
              >
                <option value='A4'>A4</option>
                <option value='Letter'>Letter</option>
                <option value='Legal'>Legal</option>
              </select>
            </div>

            <div>
              <label className='block text-gray-300 text-sm mb-1'>Orientation</label>
              <select
                value={settings.orientation}
                onChange={e =>
                  setSettings(prev => ({ ...prev, orientation: e.target.value as any }))
                }
                className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
              >
                <option value='portrait'>Portrait</option>
                <option value='landscape'>Landscape</option>
              </select>
            </div>
          </>
        )}

        <label className='flex items-center space-x-2'>
          <input
            type='checkbox'
            checked={settings.compression}
            onChange={e => setSettings(prev => ({ ...prev, compression: e.target.checked }))}
            className='text-blue-500'
          />
          <span className='text-gray-300'>Enable compression</span>
        </label>
      </div>
    </div>
  );

  const renderFileSettings = () => (
    <div className='space-y-4'>
      <h3 className='text-white font-semibold'>File Settings</h3>

      <div>
        <label className='block text-gray-300 text-sm mb-1'>Filename</label>
        <input
          type='text'
          value={filename}
          onChange={e => setFilename(e.target.value)}
          className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
          placeholder='export'
        />
        <p className='text-gray-400 text-xs mt-1'>
          File will be saved as: {filename}
          {currentFormat.extension}
        </p>
      </div>

      <div>
        <label className='block text-gray-300 text-sm mb-1'>Title</label>
        <input
          type='text'
          value={title}
          onChange={e => setTitle(e.target.value)}
          className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
          placeholder='Data Export'
        />
      </div>

      <div>
        <label className='block text-gray-300 text-sm mb-1'>Description</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
          rows={3}
          placeholder='Optional description...'
        />
      </div>
    </div>
  );

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <>
      {/* Export Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 ${className}`}
        disabled={isExporting}
      >
        {isExporting ? (
          <>
            <Loader2 className='w-4 h-4 animate-spin' />
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <Download className='w-4 h-4' />
            <span>Export</span>
          </>
        )}
      </button>

      {/* Export Modal */}
      {isOpen && (
        <div className='fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
          <div className='bg-gray-900 rounded-xl border border-gray-800 max-w-4xl w-full max-h-[90vh] overflow-hidden'>
            {/* Header */}
            <div className='p-6 border-b border-gray-800 flex items-center justify-between'>
              <div>
                <h2 className='text-xl font-bold text-white'>Export Data</h2>
                <p className='text-gray-400'>Configure export settings and download your data</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className='text-gray-400 hover:text-white'
                disabled={isExporting}
              >
                <X className='w-5 h-5' />
              </button>
            </div>

            {/* Content */}
            <div className='flex max-h-[70vh]'>
              {/* Left Panel */}
              <div className='w-1/2 p-6 border-r border-gray-800 overflow-y-auto space-y-6'>
                {renderFormatSelection()}
                {renderColumnSelection()}
                {showFilters && renderFilters()}
              </div>

              {/* Right Panel */}
              <div className='w-1/2 p-6 overflow-y-auto space-y-6'>
                {showSettings && renderSettings()}
                {renderFileSettings()}
              </div>
            </div>

            {/* Progress Bar */}
            {isExporting && (
              <div className='px-6 py-3 border-t border-gray-800'>
                <div className='flex items-center space-x-3'>
                  <div className='flex-1 bg-gray-700 rounded-full h-2'>
                    <div
                      className='bg-blue-500 h-2 rounded-full transition-all duration-300'
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>
                  <span className='text-gray-400 text-sm'>{exportProgress}%</span>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className='p-6 border-t border-gray-800 flex items-center justify-between'>
              <div className='text-sm text-gray-400'>
                {data.length} total records • {columns.filter(col => col.included).length} columns
                selected
              </div>
              <div className='flex items-center space-x-3'>
                <button
                  onClick={() => setIsOpen(false)}
                  className='px-4 py-2 text-gray-400 hover:text-white transition-colors'
                  disabled={isExporting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2'
                  disabled={isExporting || columns.filter(col => col.included).length === 0}
                >
                  {isExporting ? (
                    <>
                      <Loader2 className='w-4 h-4 animate-spin' />
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <Download className='w-4 h-4' />
                      <span>Export {currentFormat.name}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// =============================================================================
// EXPORT UTILITIES FOR TABLE INTEGRATION
// =============================================================================

export function addExportToTable(
  tableData: any[],
  tableColumns: any[]
): {
  exportColumns: ExportColumn[];
  exportButton: React.ReactNode;
} {
  const exportColumns: ExportColumn[] = tableColumns.map(col => ({
    key: col.key,
    label: col.label,
    type: col.type || 'text',
    format: col.format,
    width: col.width,
    included: true,
  }));

  const exportButton = (
    <DataExportSystem data={tableData} columns={exportColumns} className='ml-2' />
  );

  return { exportColumns, exportButton };
}
