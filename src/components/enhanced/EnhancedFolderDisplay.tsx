/**
 * 🚀 Enhanced Folder Display Component - Phase 2 Day 5 Step 5.5.4
 * Advanced UI features for folder structure visualization
 * Interactive tree view, statistics, và enhanced visual feedback
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  File,
  Eye,
  EyeOff,
  Search,
  Filter,
  BarChart3,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Info,
  Maximize2,
  Minimize2,
  Grid,
  List,
} from 'lucide-react';

// Enhanced file type icons
const FILE_TYPE_ICONS = {
  '.json': '📄',
  '.txt': '📝',
  '.csv': '📊',
  '.zip': '🗜️',
  '.pdf': '📕',
  '.docx': '📘',
  '.doc': '📘',
  '.xlsx': '📗',
  '.xls': '📗',
  '.html': '🌐',
  '.htm': '🌐',
  '.rtf': '📄',
} as const;

// Enhanced folder item interface
interface EnhancedFolderItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  size?: number;
  extension?: string;
  children?: EnhancedFolderItem[];
  depth: number;
  parentPath: string;
  metadata?: {
    lastModified?: number;
    isConversationData?: boolean;
    isEnhancedDocument?: boolean;
    fileType?: string;
    folderStats?: any;
  };
}

// Enhanced structure interface
interface EnhancedFolderStructure {
  rootItems: EnhancedFolderItem[];
  totalFiles: number;
  totalFolders: number;
  maxDepth: number;
  totalSize: number;
  filesByType: Record<string, number>;
  validFiles: File[];
  conversationFiles: File[];
  enhancedDocuments: File[];
  structure: string;
  processingMetadata?: {
    deepFolderProcessing: boolean;
    recursiveAnalysis: boolean;
    validationWarnings: string[];
    validationSuggestions: string[];
    maxSupportedDepth: number;
    processedAt: string;
  };
}

// Enhanced display options
interface DisplayOptions {
  showFileIcons: boolean;
  showFileSizes: boolean;
  showFileTypes: boolean;
  showDepthIndicators: boolean;
  showValidationBadges: boolean;
  showStatistics: boolean;
  showHiddenFiles: boolean;
  viewMode: 'tree' | 'grid' | 'list';
  expandAll: boolean;
  maxDisplayItems: number;
  sortBy: 'name' | 'size' | 'type' | 'depth';
  sortOrder: 'asc' | 'desc';
  filterText: string;
  filterType: 'all' | 'folders' | 'files' | 'conversation' | 'enhanced';
}

// Enhanced props interface
interface EnhancedFolderDisplayProps {
  structure: EnhancedFolderStructure;
  onItemSelect?: (item: EnhancedFolderItem) => void;
  onItemsSelect?: (items: EnhancedFolderItem[]) => void;
  maxDisplayDepth?: number;
  showStatistics?: boolean;
  showValidation?: boolean;
  allowMultiSelect?: boolean;
  allowBulkOperations?: boolean;
  className?: string;
}

export function EnhancedFolderDisplay({
  structure,
  onItemSelect,
  onItemsSelect,
  maxDisplayDepth = 6,
  showStatistics = true,
  showValidation = true,
  allowMultiSelect = false,
  allowBulkOperations = false,
  className = '',
}: EnhancedFolderDisplayProps) {
  // Enhanced state management
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [displayOptions, setDisplayOptions] = useState<DisplayOptions>({
    showFileIcons: true,
    showFileSizes: true,
    showFileTypes: true,
    showDepthIndicators: true,
    showValidationBadges: true,
    showStatistics: true,
    showHiddenFiles: false,
    viewMode: 'tree',
    expandAll: false,
    maxDisplayItems: 1000,
    sortBy: 'name',
    sortOrder: 'asc',
    filterText: '',
    filterType: 'all',
  });

  // Enhanced statistics calculation
  const enhancedStats = useMemo(() => {
    const getFileTypeDistribution = () => {
      const distribution: Record<string, { count: number; size: number; percentage: number }> = {};
      let totalSize = 0;

      Object.entries(structure.filesByType).forEach(([type, count]) => {
        const size = structure.validFiles
          .filter(file => file.name.toLowerCase().endsWith(type))
          .reduce((sum, file) => sum + file.size, 0);

        distribution[type] = { count, size, percentage: 0 };
        totalSize += size;
      });

      // Calculate percentages
      Object.values(distribution).forEach(item => {
        item.percentage = totalSize > 0 ? (item.size / totalSize) * 100 : 0;
      });

      return distribution;
    };

    const getDepthDistribution = () => {
      const depthCounts: Record<number, number> = {};

      const countByDepth = (items: EnhancedFolderItem[], currentDepth = 0) => {
        items.forEach(item => {
          depthCounts[currentDepth] = (depthCounts[currentDepth] || 0) + 1;
          if (item.children && item.children.length > 0) {
            countByDepth(item.children, currentDepth + 1);
          }
        });
      };

      countByDepth(structure.rootItems);
      return depthCounts;
    };

    const getLargestFolders = () => {
      const folders: Array<{ name: string; path: string; fileCount: number; totalSize: number }> =
        [];

      const analyzeFolders = (items: EnhancedFolderItem[]) => {
        items.forEach(item => {
          if (item.type === 'folder' && item.children) {
            const stats = calculateFolderSize(item.children);
            folders.push({
              name: item.name,
              path: item.path,
              fileCount: stats.fileCount,
              totalSize: stats.totalSize,
            });

            if (item.children.length > 0) {
              analyzeFolders(item.children);
            }
          }
        });
      };

      analyzeFolders(structure.rootItems);
      return folders.sort((a, b) => b.totalSize - a.totalSize).slice(0, 5);
    };

    const calculateFolderSize = (
      items: EnhancedFolderItem[]
    ): { fileCount: number; totalSize: number } => {
      let fileCount = 0;
      let totalSize = 0;

      items.forEach(item => {
        if (item.type === 'file') {
          fileCount++;
          totalSize += item.size || 0;
        } else if (item.children) {
          const childStats = calculateFolderSize(item.children);
          fileCount += childStats.fileCount;
          totalSize += childStats.totalSize;
        }
      });

      return { fileCount, totalSize };
    };

    return {
      fileTypeDistribution: getFileTypeDistribution(),
      depthDistribution: getDepthDistribution(),
      largestFolders: getLargestFolders(),
      averageFilesPerFolder:
        structure.totalFolders > 0 ? structure.totalFiles / structure.totalFolders : 0,
      averageFileSize: structure.totalFiles > 0 ? structure.totalSize / structure.totalFiles : 0,
      conversationDataPercentage:
        structure.totalFiles > 0
          ? (structure.conversationFiles.length / structure.totalFiles) * 100
          : 0,
      enhancedDocPercentage:
        structure.totalFiles > 0
          ? (structure.enhancedDocuments.length / structure.totalFiles) * 100
          : 0,
    };
  }, [structure]);

  // Enhanced filtering logic
  const filteredItems = useMemo(() => {
    const filterItems = (items: EnhancedFolderItem[]): EnhancedFolderItem[] => {
      return items
        .filter(item => {
          // Text filter
          if (
            displayOptions.filterText &&
            !item.name.toLowerCase().includes(displayOptions.filterText.toLowerCase())
          ) {
            return false;
          }

          // Type filter
          switch (displayOptions.filterType) {
            case 'folders':
              return item.type === 'folder';
            case 'files':
              return item.type === 'file';
            case 'conversation':
              return item.type === 'file' && item.metadata?.isConversationData;
            case 'enhanced':
              return item.type === 'file' && item.metadata?.isEnhancedDocument;
            default:
              return true;
          }
        })
        .map(item => ({
          ...item,
          children: item.children ? filterItems(item.children) : undefined,
        }));
    };

    return filterItems(structure.rootItems);
  }, [structure.rootItems, displayOptions.filterText, displayOptions.filterType]);

  // Enhanced sorting logic
  const sortedItems = useMemo(() => {
    const sortItems = (items: EnhancedFolderItem[]): EnhancedFolderItem[] => {
      const sorted = [...items].sort((a, b) => {
        let comparison = 0;

        switch (displayOptions.sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'size':
            comparison = (a.size || 0) - (b.size || 0);
            break;
          case 'type':
            if (a.type !== b.type) {
              comparison = a.type === 'folder' ? -1 : 1;
            } else {
              comparison = a.name.localeCompare(b.name);
            }
            break;
          case 'depth':
            comparison = a.depth - b.depth;
            break;
        }

        return displayOptions.sortOrder === 'asc' ? comparison : -comparison;
      });

      return sorted.map(item => ({
        ...item,
        children: item.children ? sortItems(item.children) : undefined,
      }));
    };

    return sortItems(filteredItems);
  }, [filteredItems, displayOptions.sortBy, displayOptions.sortOrder]);

  // Enhanced item toggling
  const toggleItem = useCallback((itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  // Enhanced item selection
  const selectItem = useCallback(
    (item: EnhancedFolderItem, isMultiSelect = false) => {
      if (allowMultiSelect && isMultiSelect) {
        setSelectedItems(prev => {
          const newSet = new Set(prev);
          if (newSet.has(item.id)) {
            newSet.delete(item.id);
          } else {
            newSet.add(item.id);
          }
          return newSet;
        });
      } else {
        setSelectedItems(new Set([item.id]));
        onItemSelect?.(item);
      }
    },
    [allowMultiSelect, onItemSelect]
  );

  // Enhanced expand/collapse all
  const toggleExpandAll = useCallback(() => {
    if (displayOptions.expandAll) {
      setExpandedItems(new Set());
    } else {
      const allIds = new Set<string>();
      const collectIds = (items: EnhancedFolderItem[]) => {
        items.forEach(item => {
          if (item.type === 'folder') {
            allIds.add(item.id);
          }
          if (item.children) {
            collectIds(item.children);
          }
        });
      };
      collectIds(structure.rootItems);
      setExpandedItems(allIds);
    }

    setDisplayOptions(prev => ({ ...prev, expandAll: !prev.expandAll }));
  }, [displayOptions.expandAll, structure.rootItems]);

  // Format file size helper
  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }, []);

  // Enhanced tree item renderer
  const renderTreeItem = useCallback(
    (item: EnhancedFolderItem, depth: number) => {
      if (depth > maxDisplayDepth) return null;

      const isExpanded = expandedItems.has(item.id);
      const isSelected = selectedItems.has(item.id);
      const hasChildren = item.children && item.children.length > 0;

      const indentStyle = { paddingLeft: `${depth * 24 + 12}px` };

      return (
        <div key={item.id} className='folder-item'>
          {/* Item Row */}
          <div
            className={`
            flex items-center px-3 py-2 cursor-pointer hover:bg-gray-800/50 transition-colors
            ${isSelected ? 'bg-blue-600/20 border-l-2 border-l-blue-500' : ''}
          `}
            style={indentStyle}
            onClick={e => {
              if (item.type === 'folder') {
                toggleItem(item.id);
              }
              selectItem(item, e.ctrlKey || e.metaKey);
            }}
          >
            {/* Expand/Collapse Icon */}
            {item.type === 'folder' && (
              <button
                className='flex-shrink-0 p-1 mr-2 rounded hover:bg-gray-700'
                onClick={e => {
                  e.stopPropagation();
                  toggleItem(item.id);
                }}
              >
                {hasChildren ? (
                  isExpanded ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )
                ) : (
                  <div className='w-4 h-4' />
                )}
              </button>
            )}

            {/* File/Folder Icon */}
            <div className='flex-shrink-0 mr-3'>
              {item.type === 'folder' ? (
                isExpanded ? (
                  <FolderOpen size={20} className='text-yellow-500' />
                ) : (
                  <Folder size={20} className='text-yellow-600' />
                )
              ) : (
                <div className='flex items-center'>
                  {displayOptions.showFileIcons &&
                    item.extension &&
                    FILE_TYPE_ICONS[item.extension as keyof typeof FILE_TYPE_ICONS] && (
                      <span className='text-lg mr-1'>
                        {FILE_TYPE_ICONS[item.extension as keyof typeof FILE_TYPE_ICONS]}
                      </span>
                    )}
                  <File size={16} className='text-gray-400' />
                </div>
              )}
            </div>

            {/* Item Name */}
            <span className='flex-1 text-sm text-gray-200 truncate'>{item.name}</span>

            {/* File Type Badge */}
            {displayOptions.showFileTypes && item.extension && (
              <span className='px-2 py-1 ml-2 text-xs bg-gray-700 rounded text-gray-300'>
                {item.extension.toUpperCase().replace('.', '')}
              </span>
            )}

            {/* File Size */}
            {displayOptions.showFileSizes && item.size && (
              <span className='ml-2 text-xs text-gray-400'>{formatFileSize(item.size)}</span>
            )}

            {/* Validation Badges */}
            {displayOptions.showValidationBadges && item.metadata && (
              <div className='flex ml-2 space-x-1'>
                {item.metadata.isConversationData && (
                  <span className='px-1.5 py-0.5 text-xs bg-blue-600/20 text-blue-300 rounded'>
                    CONV
                  </span>
                )}
                {item.metadata.isEnhancedDocument && (
                  <span className='px-1.5 py-0.5 text-xs bg-green-600/20 text-green-300 rounded'>
                    DOC
                  </span>
                )}
              </div>
            )}

            {/* Depth Indicator */}
            {displayOptions.showDepthIndicators && (
              <span className='ml-2 text-xs text-gray-500'>L{depth}</span>
            )}
          </div>

          {/* Children */}
          {item.type === 'folder' && hasChildren && isExpanded && (
            <div className='folder-children'>
              {item.children!.map(child => renderTreeItem(child, depth + 1))}
            </div>
          )}
        </div>
      );
    },
    [
      maxDisplayDepth,
      expandedItems,
      selectedItems,
      displayOptions,
      toggleItem,
      selectItem,
      formatFileSize,
    ]
  );

  return (
    <div
      className={`enhanced-folder-display bg-gray-900 rounded-lg border border-gray-800 ${className}`}
    >
      {/* Enhanced Toolbar */}
      <div className='px-4 py-3 border-b border-gray-800'>
        <div className='flex flex-wrap items-center justify-between gap-4'>
          {/* Search and Filter */}
          <div className='flex items-center space-x-3'>
            <div className='relative'>
              <Search
                size={16}
                className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
              />
              <input
                type='text'
                placeholder='Search files and folders...'
                className='pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-400 focus:outline-none focus:border-blue-500'
                value={displayOptions.filterText}
                onChange={e => setDisplayOptions(prev => ({ ...prev, filterText: e.target.value }))}
              />
            </div>

            <select
              className='px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-500'
              value={displayOptions.filterType}
              onChange={e =>
                setDisplayOptions(prev => ({ ...prev, filterType: e.target.value as any }))
              }
            >
              <option value='all'>All Items</option>
              <option value='folders'>Folders Only</option>
              <option value='files'>Files Only</option>
              <option value='conversation'>Conversation Data</option>
              <option value='enhanced'>Enhanced Documents</option>
            </select>
          </div>

          {/* View Options */}
          <div className='flex items-center space-x-2'>
            <button
              className={`p-2 rounded-lg transition-colors ${
                displayOptions.viewMode === 'tree'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
              onClick={() => setDisplayOptions(prev => ({ ...prev, viewMode: 'tree' }))}
              title='Tree View'
            >
              <Layers size={16} />
            </button>

            <button
              className={`p-2 rounded-lg transition-colors ${
                displayOptions.viewMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
              onClick={() => setDisplayOptions(prev => ({ ...prev, viewMode: 'grid' }))}
              title='Grid View'
            >
              <Grid size={16} />
            </button>

            <button
              className={`p-2 rounded-lg transition-colors ${
                displayOptions.viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
              onClick={() => setDisplayOptions(prev => ({ ...prev, viewMode: 'list' }))}
              title='List View'
            >
              <List size={16} />
            </button>

            <div className='w-px h-6 bg-gray-700' />

            <button
              className='p-2 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 transition-colors'
              onClick={toggleExpandAll}
              title={displayOptions.expandAll ? 'Collapse All' : 'Expand All'}
            >
              {displayOptions.expandAll ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </div>

        {/* Enhanced Statistics Bar */}
        {showStatistics && (
          <div className='mt-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4'>
            <div className='text-center'>
              <div className='text-lg font-semibold text-blue-400'>{structure.totalFiles}</div>
              <div className='text-xs text-gray-400'>Files</div>
            </div>
            <div className='text-center'>
              <div className='text-lg font-semibold text-yellow-400'>{structure.totalFolders}</div>
              <div className='text-xs text-gray-400'>Folders</div>
            </div>
            <div className='text-center'>
              <div className='text-lg font-semibold text-green-400'>
                {formatFileSize(structure.totalSize)}
              </div>
              <div className='text-xs text-gray-400'>Total Size</div>
            </div>
            <div className='text-center'>
              <div className='text-lg font-semibold text-purple-400'>{structure.maxDepth}</div>
              <div className='text-xs text-gray-400'>Max Depth</div>
            </div>
            <div className='text-center'>
              <div className='text-lg font-semibold text-cyan-400'>
                {enhancedStats.conversationDataPercentage.toFixed(1)}%
              </div>
              <div className='text-xs text-gray-400'>Conversation</div>
            </div>
            <div className='text-center'>
              <div className='text-lg font-semibold text-pink-400'>
                {enhancedStats.enhancedDocPercentage.toFixed(1)}%
              </div>
              <div className='text-xs text-gray-400'>Documents</div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Content Area */}
      <div className='folder-content max-h-96 overflow-y-auto'>
        {sortedItems.length > 0 ? (
          <div className='folder-tree'>{sortedItems.map(item => renderTreeItem(item, 0))}</div>
        ) : (
          <div className='flex flex-col items-center justify-center py-12 text-gray-400'>
            <Folder size={48} className='mb-4 opacity-50' />
            <p className='text-lg font-medium'>No items found</p>
            <p className='text-sm'>Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Enhanced Validation Panel */}
      {showValidation && structure.processingMetadata && (
        <div className='px-4 py-3 border-t border-gray-800'>
          <div className='space-y-3'>
            {/* Warnings */}
            {structure.processingMetadata.validationWarnings.length > 0 && (
              <div className='space-y-2'>
                <h4 className='flex items-center text-sm font-medium text-yellow-400'>
                  <AlertTriangle size={16} className='mr-2' />
                  Warnings ({structure.processingMetadata.validationWarnings.length})
                </h4>
                <div className='space-y-1'>
                  {structure.processingMetadata.validationWarnings.map((warning, index) => (
                    <div
                      key={index}
                      className='flex items-start p-2 bg-yellow-900/20 border border-yellow-800/30 rounded text-xs text-yellow-200'
                    >
                      <AlertTriangle
                        size={12}
                        className='mt-0.5 mr-2 flex-shrink-0 text-yellow-400'
                      />
                      <span>{warning}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {structure.processingMetadata.validationSuggestions.length > 0 && (
              <div className='space-y-2'>
                <h4 className='flex items-center text-sm font-medium text-blue-400'>
                  <Info size={16} className='mr-2' />
                  Suggestions ({structure.processingMetadata.validationSuggestions.length})
                </h4>
                <div className='space-y-1'>
                  {structure.processingMetadata.validationSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className='flex items-start p-2 bg-blue-900/20 border border-blue-800/30 rounded text-xs text-blue-200'
                    >
                      <CheckCircle2 size={12} className='mt-0.5 mr-2 flex-shrink-0 text-blue-400' />
                      <span>{suggestion}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default EnhancedFolderDisplay;
