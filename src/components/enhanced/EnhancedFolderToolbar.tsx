/**
 * 🚀 Enhanced Folder Toolbar Component - Phase 2 Day 5 Step 5.5.4
 * Advanced toolbar with filtering, sorting, and view options
 * Enhanced user controls for folder structure visualization
 */

'use client';

import React, { useState, useCallback } from 'react';
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Layers,
  Eye,
  EyeOff,
  Settings,
  Download,
  Upload,
  RefreshCw,
  Maximize2,
  Minimize2,
  Info,
  CheckSquare,
  Square,
} from 'lucide-react';

// Enhanced toolbar options
interface ToolbarOptions {
  searchText: string;
  filterType: 'all' | 'files' | 'folders' | 'conversation' | 'enhanced' | 'large' | 'recent';
  sortBy: 'name' | 'size' | 'type' | 'date' | 'depth';
  sortOrder: 'asc' | 'desc';
  viewMode: 'tree' | 'grid' | 'list';
  showHidden: boolean;
  showFileIcons: boolean;
  showFileSizes: boolean;
  showDepthIndicators: boolean;
  showValidationBadges: boolean;
  expandAll: boolean;
  maxDisplayItems: number;
  selectedCount: number;
}

interface EnhancedFolderToolbarProps {
  options: ToolbarOptions;
  onOptionsChange: (options: Partial<ToolbarOptions>) => void;
  totalItems: number;
  selectedItems: number;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onExport?: () => void;
  onRefresh?: () => void;
  onBulkAction?: (action: string) => void;
  className?: string;
}

export function EnhancedFolderToolbar({
  options,
  onOptionsChange,
  totalItems,
  selectedItems,
  onSelectAll,
  onClearSelection,
  onExport,
  onRefresh,
  onBulkAction,
  className = '',
}: EnhancedFolderToolbarProps) {
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle search input
  const handleSearchChange = useCallback(
    (value: string) => {
      onOptionsChange({ searchText: value });
    },
    [onOptionsChange]
  );

  // Handle filter change
  const handleFilterChange = useCallback(
    (filterType: ToolbarOptions['filterType']) => {
      onOptionsChange({ filterType });
    },
    [onOptionsChange]
  );

  // Handle sort change
  const handleSortChange = useCallback(
    (sortBy: ToolbarOptions['sortBy']) => {
      const newOrder = options.sortBy === sortBy && options.sortOrder === 'asc' ? 'desc' : 'asc';
      onOptionsChange({ sortBy, sortOrder: newOrder });
    },
    [options.sortBy, options.sortOrder, onOptionsChange]
  );

  // Handle view mode change
  const handleViewModeChange = useCallback(
    (viewMode: ToolbarOptions['viewMode']) => {
      onOptionsChange({ viewMode });
    },
    [onOptionsChange]
  );

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefresh?.();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  // Toggle expand/collapse all
  const toggleExpandAll = useCallback(() => {
    onOptionsChange({ expandAll: !options.expandAll });
  }, [options.expandAll, onOptionsChange]);

  return (
    <div className={`enhanced-folder-toolbar bg-gray-900 border-b border-gray-800 ${className}`}>
      {/* Main Toolbar */}
      <div className='flex flex-wrap items-center justify-between gap-4 p-4'>
        {/* Left Section - Search and Filter */}
        <div className='flex items-center space-x-3'>
          {/* Search Input */}
          <div className='relative'>
            <Search
              size={16}
              className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
            />
            <input
              type='text'
              placeholder='Search files and folders...'
              value={options.searchText}
              onChange={e => handleSearchChange(e.target.value)}
              className='pl-10 pr-4 py-2 w-64 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
            />
            {options.searchText && (
              <button
                onClick={() => handleSearchChange('')}
                className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200'
              >
                ×
              </button>
            )}
          </div>

          {/* Filter Dropdown */}
          <div className='relative'>
            <select
              value={options.filterType}
              onChange={e => handleFilterChange(e.target.value as ToolbarOptions['filterType'])}
              className='pl-10 pr-8 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-500 appearance-none'
            >
              <option value='all'>All Items</option>
              <option value='files'>Files Only</option>
              <option value='folders'>Folders Only</option>
              <option value='conversation'>Conversation Data</option>
              <option value='enhanced'>Enhanced Documents</option>
              <option value='large'>Large Files (&gt;1MB)</option>
              <option value='recent'>Recently Modified</option>
            </select>
            <Filter
              size={16}
              className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
            />
          </div>

          {/* Sort Options */}
          <div className='flex items-center space-x-1'>
            <button
              onClick={() => handleSortChange('name')}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                options.sortBy === 'name'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Name
            </button>
            <button
              onClick={() => handleSortChange('size')}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                options.sortBy === 'size'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Size
            </button>
            <button
              onClick={() => handleSortChange('type')}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                options.sortBy === 'type'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Type
            </button>

            {/* Sort Order */}
            <button
              onClick={() =>
                onOptionsChange({ sortOrder: options.sortOrder === 'asc' ? 'desc' : 'asc' })
              }
              className='p-2 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 transition-colors'
              title={`Sort ${options.sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              {options.sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
            </button>
          </div>
        </div>

        {/* Right Section - View Controls */}
        <div className='flex items-center space-x-3'>
          {/* Selection Info */}
          {selectedItems > 0 && (
            <div className='flex items-center space-x-2 px-3 py-1 bg-blue-600/20 border border-blue-600/30 rounded-lg'>
              <span className='text-sm text-blue-300'>
                {selectedItems} of {totalItems} selected
              </span>
              <button
                onClick={onClearSelection}
                className='text-blue-300 hover:text-blue-200 transition-colors'
                title='Clear Selection'
              >
                ×
              </button>
            </div>
          )}

          {/* View Mode Toggles */}
          <div className='flex items-center space-x-1 bg-gray-800 rounded-lg p-1'>
            <button
              onClick={() => handleViewModeChange('tree')}
              className={`p-2 rounded transition-colors ${
                options.viewMode === 'tree'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              title='Tree View'
            >
              <Layers size={16} />
            </button>
            <button
              onClick={() => handleViewModeChange('grid')}
              className={`p-2 rounded transition-colors ${
                options.viewMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              title='Grid View'
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => handleViewModeChange('list')}
              className={`p-2 rounded transition-colors ${
                options.viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              title='List View'
            >
              <List size={16} />
            </button>
          </div>

          {/* Expand/Collapse All */}
          <button
            onClick={toggleExpandAll}
            className='p-2 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 transition-colors'
            title={options.expandAll ? 'Collapse All' : 'Expand All'}
          >
            {options.expandAll ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          {/* Bulk Actions */}
          {selectedItems > 0 && (
            <div className='flex items-center space-x-1'>
              <button
                onClick={() => onBulkAction?.('select-all')}
                className='p-2 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 transition-colors'
                title='Select All'
              >
                <CheckSquare size={16} />
              </button>
              <button
                onClick={() => onBulkAction?.('export')}
                className='p-2 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 transition-colors'
                title='Export Selected'
              >
                <Download size={16} />
              </button>
            </div>
          )}

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className='p-2 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50'
            title='Refresh'
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>

          {/* Advanced Options Toggle */}
          <button
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className={`p-2 rounded-lg transition-colors ${
              showAdvancedOptions
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
            title='Advanced Options'
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Advanced Options Panel */}
      {showAdvancedOptions && (
        <div className='px-4 py-3 border-t border-gray-800 bg-gray-800/50'>
          <div className='flex flex-wrap items-center justify-between gap-4'>
            {/* Display Options */}
            <div className='flex items-center space-x-4'>
              <span className='text-sm text-gray-300 font-medium'>Display Options:</span>

              <label className='flex items-center space-x-2 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={options.showFileIcons}
                  onChange={e => onOptionsChange({ showFileIcons: e.target.checked })}
                  className='w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500'
                />
                <span className='text-sm text-gray-300'>File Icons</span>
              </label>

              <label className='flex items-center space-x-2 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={options.showFileSizes}
                  onChange={e => onOptionsChange({ showFileSizes: e.target.checked })}
                  className='w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500'
                />
                <span className='text-sm text-gray-300'>File Sizes</span>
              </label>

              <label className='flex items-center space-x-2 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={options.showDepthIndicators}
                  onChange={e => onOptionsChange({ showDepthIndicators: e.target.checked })}
                  className='w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500'
                />
                <span className='text-sm text-gray-300'>Depth Indicators</span>
              </label>

              <label className='flex items-center space-x-2 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={options.showValidationBadges}
                  onChange={e => onOptionsChange({ showValidationBadges: e.target.checked })}
                  className='w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500'
                />
                <span className='text-sm text-gray-300'>Validation Badges</span>
              </label>

              <label className='flex items-center space-x-2 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={options.showHidden}
                  onChange={e => onOptionsChange({ showHidden: e.target.checked })}
                  className='w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500'
                />
                <span className='text-sm text-gray-300'>Hidden Files</span>
              </label>
            </div>

            {/* Performance Options */}
            <div className='flex items-center space-x-4'>
              <span className='text-sm text-gray-300 font-medium'>Performance:</span>

              <label className='flex items-center space-x-2'>
                <span className='text-sm text-gray-300'>Max Items:</span>
                <select
                  value={options.maxDisplayItems}
                  onChange={e => onOptionsChange({ maxDisplayItems: parseInt(e.target.value) })}
                  className='px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-gray-200 focus:outline-none focus:border-blue-500'
                >
                  <option value='100'>100</option>
                  <option value='500'>500</option>
                  <option value='1000'>1000</option>
                  <option value='5000'>5000</option>
                  <option value='10000'>All</option>
                </select>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className='px-4 py-2 border-t border-gray-800 bg-gray-800/30'>
        <div className='flex items-center justify-between text-xs text-gray-400'>
          <div className='flex items-center space-x-4'>
            <span>
              Showing {Math.min(options.maxDisplayItems, totalItems)} of {totalItems} items
            </span>
            {options.searchText && <span>Filtered by: "{options.searchText}"</span>}
            {options.filterType !== 'all' && <span>Filter: {options.filterType}</span>}
          </div>
          <div className='flex items-center space-x-4'>
            <span>
              Sort: {options.sortBy} ({options.sortOrder})
            </span>
            <span>View: {options.viewMode}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EnhancedFolderToolbar;
