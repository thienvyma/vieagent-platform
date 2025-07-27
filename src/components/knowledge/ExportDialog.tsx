'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

interface ExportOptions {
  format: 'json' | 'csv' | 'pdf' | 'zip';
  includeMetadata: boolean;
  includeContent: boolean;
  includeChunks: boolean;
  includeVectors: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  compression?: 'none' | 'gzip' | 'zip';
}

interface ExportDialogProps {
  selectedItems: string[];
  onClose: () => void;
  onExport: (options: ExportOptions) => Promise<void>;
}

export default function ExportDialog({ selectedItems, onClose, onExport }: ExportDialogProps) {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<ExportOptions>({
    format: 'json',
    includeMetadata: true,
    includeContent: true,
    includeChunks: false,
    includeVectors: false,
    compression: 'none',
  });

  const handleExport = async () => {
    try {
      setLoading(true);
      await onExport(options);
      toast.success('Export completed successfully');
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed');
    } finally {
      setLoading(false);
    }
  };

  const getFormatDescription = (format: string) => {
    switch (format) {
      case 'json':
        return 'Structured data format suitable for developers and system integration';
      case 'csv':
        return 'Spreadsheet format for data analysis and reporting';
      case 'pdf':
        return 'Portable document format for sharing and archiving';
      case 'zip':
        return 'Compressed archive containing all data and files';
      default:
        return '';
    }
  };

  const getEstimatedSize = () => {
    // Rough estimation based on selected items and options
    const baseSize = selectedItems.length * 100; // 100KB per item
    let multiplier = 1;

    if (options.includeContent) multiplier += 2;
    if (options.includeChunks) multiplier += 1.5;
    if (options.includeVectors) multiplier += 3;

    const totalSize = baseSize * multiplier;

    if (totalSize > 1024 * 1024) {
      return `~${(totalSize / (1024 * 1024)).toFixed(1)} MB`;
    } else if (totalSize > 1024) {
      return `~${(totalSize / 1024).toFixed(1)} KB`;
    } else {
      return `~${totalSize.toFixed(0)} B`;
    }
  };

  return (
    <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
      <div className='bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-white/10'>
          <div>
            <h2 className='text-2xl font-bold text-white'>Export Knowledge Items</h2>
            <p className='text-gray-400'>Export {selectedItems.length} selected item(s)</p>
          </div>
          <button onClick={onClose} className='text-gray-400 hover:text-white transition-colors'>
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>

        <div className='p-6 overflow-y-auto max-h-[calc(90vh-140px)]'>
          {/* Export Format */}
          <div className='mb-6'>
            <label className='block text-sm font-medium text-gray-300 mb-3'>Export Format</label>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {[
                { value: 'json', label: 'JSON', icon: '📄' },
                { value: 'csv', label: 'CSV', icon: '📊' },
                { value: 'pdf', label: 'PDF', icon: '📑' },
                { value: 'zip', label: 'ZIP Archive', icon: '📦' },
              ].map(format => (
                <label key={format.value} className='cursor-pointer'>
                  <input
                    type='radio'
                    name='format'
                    value={format.value}
                    checked={options.format === format.value}
                    onChange={e => setOptions(prev => ({ ...prev, format: e.target.value as any }))}
                    className='sr-only'
                  />
                  <div
                    className={`p-4 rounded-xl border-2 transition-all ${
                      options.format === format.value
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                    }`}
                  >
                    <div className='flex items-center space-x-3'>
                      <span className='text-2xl'>{format.icon}</span>
                      <div>
                        <div className='font-medium text-white'>{format.label}</div>
                        <div className='text-sm text-gray-400'>
                          {getFormatDescription(format.value)}
                        </div>
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Export Options */}
          <div className='mb-6'>
            <label className='block text-sm font-medium text-gray-300 mb-3'>Export Options</label>
            <div className='space-y-3'>
              <label className='flex items-center space-x-3 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={options.includeMetadata}
                  onChange={e =>
                    setOptions(prev => ({ ...prev, includeMetadata: e.target.checked }))
                  }
                  className='w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500'
                />
                <div>
                  <div className='text-white'>Include Metadata</div>
                  <div className='text-sm text-gray-400'>
                    File information, tags, timestamps, etc.
                  </div>
                </div>
              </label>

              <label className='flex items-center space-x-3 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={options.includeContent}
                  onChange={e =>
                    setOptions(prev => ({ ...prev, includeContent: e.target.checked }))
                  }
                  className='w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500'
                />
                <div>
                  <div className='text-white'>Include Content</div>
                  <div className='text-sm text-gray-400'>Full document content and text</div>
                </div>
              </label>

              <label className='flex items-center space-x-3 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={options.includeChunks}
                  onChange={e => setOptions(prev => ({ ...prev, includeChunks: e.target.checked }))}
                  className='w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500'
                />
                <div>
                  <div className='text-white'>Include Chunks</div>
                  <div className='text-sm text-gray-400'>Processed text chunks and segments</div>
                </div>
              </label>

              <label className='flex items-center space-x-3 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={options.includeVectors}
                  onChange={e =>
                    setOptions(prev => ({ ...prev, includeVectors: e.target.checked }))
                  }
                  className='w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500'
                />
                <div>
                  <div className='text-white'>Include Vectors</div>
                  <div className='text-sm text-gray-400'>Vector embeddings and similarity data</div>
                </div>
              </label>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className='mb-6'>
            <label className='block text-sm font-medium text-gray-300 mb-3'>
              Date Range Filter (Optional)
            </label>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm text-gray-400 mb-1'>Start Date</label>
                <input
                  type='date'
                  value={options.dateRange?.start || ''}
                  onChange={e =>
                    setOptions(prev => ({
                      ...prev,
                      dateRange: {
                        ...prev.dateRange,
                        start: e.target.value,
                        end: prev.dateRange?.end || '',
                      },
                    }))
                  }
                  className='w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500'
                />
              </div>
              <div>
                <label className='block text-sm text-gray-400 mb-1'>End Date</label>
                <input
                  type='date'
                  value={options.dateRange?.end || ''}
                  onChange={e =>
                    setOptions(prev => ({
                      ...prev,
                      dateRange: {
                        ...prev.dateRange,
                        start: prev.dateRange?.start || '',
                        end: e.target.value,
                      },
                    }))
                  }
                  className='w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500'
                />
              </div>
            </div>
          </div>

          {/* Compression Options */}
          {options.format === 'zip' && (
            <div className='mb-6'>
              <label className='block text-sm font-medium text-gray-300 mb-3'>Compression</label>
              <div className='flex space-x-4'>
                {[
                  { value: 'none', label: 'No Compression' },
                  { value: 'gzip', label: 'GZIP' },
                  { value: 'zip', label: 'ZIP' },
                ].map(compression => (
                  <label
                    key={compression.value}
                    className='flex items-center space-x-2 cursor-pointer'
                  >
                    <input
                      type='radio'
                      name='compression'
                      value={compression.value}
                      checked={options.compression === compression.value}
                      onChange={e =>
                        setOptions(prev => ({ ...prev, compression: e.target.value as any }))
                      }
                      className='w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500'
                    />
                    <span className='text-white'>{compression.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Export Summary */}
          <div className='bg-white/5 rounded-xl p-4 border border-white/10 mb-6'>
            <h3 className='text-lg font-semibold text-white mb-3'>Export Summary</h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <div className='text-sm text-gray-400'>Items to Export</div>
                <div className='text-white font-medium'>{selectedItems.length}</div>
              </div>
              <div>
                <div className='text-sm text-gray-400'>Estimated Size</div>
                <div className='text-white font-medium'>{getEstimatedSize()}</div>
              </div>
              <div>
                <div className='text-sm text-gray-400'>Format</div>
                <div className='text-white font-medium'>{options.format.toUpperCase()}</div>
              </div>
              <div>
                <div className='text-sm text-gray-400'>Options</div>
                <div className='text-white font-medium'>
                  {[
                    options.includeMetadata && 'Metadata',
                    options.includeContent && 'Content',
                    options.includeChunks && 'Chunks',
                    options.includeVectors && 'Vectors',
                  ]
                    .filter(Boolean)
                    .join(', ') || 'None'}
                </div>
              </div>
            </div>
          </div>

          {/* Export Warnings */}
          <div className='bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6'>
            <div className='flex items-start space-x-3'>
              <div className='text-yellow-400 mt-1'>⚠️</div>
              <div>
                <div className='font-medium text-yellow-200'>Export Considerations</div>
                <ul className='text-sm text-yellow-300 mt-2 space-y-1'>
                  <li>• Large exports may take several minutes to complete</li>
                  <li>• Vector data significantly increases file size</li>
                  <li>• PDF exports are optimized for readability, not data preservation</li>
                  <li>• Sensitive data will be included in the export</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='flex items-center justify-between p-6 border-t border-white/10'>
          <button
            onClick={onClose}
            className='px-4 py-2 text-gray-400 hover:text-white transition-colors'
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={loading}
            className='bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2'
          >
            {loading ? (
              <>
                <div className='animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent'></div>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                  />
                </svg>
                <span>Export</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
