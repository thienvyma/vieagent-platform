import React, { useState, useMemo, useCallback } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  MoreHorizontal,
  Check,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Skeleton } from './Loading';

// ===== TYPES =====
interface TableColumn<T = any> {
  id: string;
  header: string;
  accessor?: keyof T | ((row: T) => any);
  cell?: (row: T, value: any) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

interface TableFilter {
  id: string;
  value: any;
  operator?: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'gte' | 'lte';
}

interface TableSort {
  id: string;
  desc: boolean;
}

interface TablePagination {
  pageIndex: number;
  pageSize: number;
  total?: number;
}

interface TableAction<T = any> {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  variant?: 'default' | 'danger' | 'success' | 'warning';
  disabled?: (row: T) => boolean;
  hidden?: (row: T) => boolean;
}

interface TableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: TablePagination;
  onPaginationChange?: (pagination: TablePagination) => void;
  sorting?: TableSort[];
  onSortingChange?: (sorting: TableSort[]) => void;
  filtering?: TableFilter[];
  onFilteringChange?: (filtering: TableFilter[]) => void;
  rowSelection?: Record<string, boolean>;
  onRowSelectionChange?: (selection: Record<string, boolean>) => void;
  getRowId?: (row: T) => string;
  actions?: TableAction<T>[];
  emptyState?: React.ReactNode;
  className?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  bulkActions?: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    onClick: (selectedRows: T[]) => void;
    variant?: 'default' | 'danger' | 'success' | 'warning';
  }>;
}

// ===== UTILITY FUNCTIONS =====
const getCellValue = <T,>(row: T, column: TableColumn<T>) => {
  if (column.accessor) {
    if (typeof column.accessor === 'function') {
      return column.accessor(row);
    }
    return row[column.accessor];
  }
  return '';
};

const sortData = <T,>(data: T[], columns: TableColumn<T>[], sorting: TableSort[]): T[] => {
  if (sorting.length === 0) return data;

  return [...data].sort((a, b) => {
    for (const sort of sorting) {
      const column = columns.find(col => col.id === sort.id);
      if (!column) continue;

      const aVal = getCellValue(a, column);
      const bVal = getCellValue(b, column);

      let comparison = 0;
      if (aVal < bVal) comparison = -1;
      if (aVal > bVal) comparison = 1;

      if (comparison !== 0) {
        return sort.desc ? -comparison : comparison;
      }
    }
    return 0;
  });
};

const filterData = <T,>(data: T[], columns: TableColumn<T>[], filtering: TableFilter[]): T[] => {
  if (filtering.length === 0) return data;

  return data.filter(row => {
    return filtering.every(filter => {
      const column = columns.find(col => col.id === filter.id);
      if (!column) return true;

      const value = getCellValue(row, column);
      const filterValue = filter.value;

      if (filterValue === '' || filterValue === null || filterValue === undefined) {
        return true;
      }

      const stringValue = String(value).toLowerCase();
      const stringFilter = String(filterValue).toLowerCase();

      switch (filter.operator || 'contains') {
        case 'equals':
          return stringValue === stringFilter;
        case 'contains':
          return stringValue.includes(stringFilter);
        case 'startsWith':
          return stringValue.startsWith(stringFilter);
        case 'endsWith':
          return stringValue.endsWith(stringFilter);
        case 'gt':
          return Number(value) > Number(filterValue);
        case 'lt':
          return Number(value) < Number(filterValue);
        case 'gte':
          return Number(value) >= Number(filterValue);
        case 'lte':
          return Number(value) <= Number(filterValue);
        default:
          return true;
      }
    });
  });
};

// ===== COMPONENTS =====
const TableHeader: React.FC<{
  columns: TableColumn[];
  sorting: TableSort[];
  onSortingChange: (sorting: TableSort[]) => void;
  rowSelection?: Record<string, boolean>;
  onSelectAll?: () => void;
  hasActions?: boolean;
}> = ({ columns, sorting, onSortingChange, rowSelection, onSelectAll, hasActions }) => {
  const handleSort = (columnId: string) => {
    const existingSort = sorting.find(s => s.id === columnId);
    let newSorting: TableSort[];

    if (existingSort) {
      if (existingSort.desc) {
        // Remove sort
        newSorting = sorting.filter(s => s.id !== columnId);
      } else {
        // Change to desc
        newSorting = sorting.map(s => (s.id === columnId ? { ...s, desc: true } : s));
      }
    } else {
      // Add new sort (asc)
      newSorting = [...sorting, { id: columnId, desc: false }];
    }

    onSortingChange(newSorting);
  };

  const getSortIcon = (columnId: string) => {
    const sort = sorting.find(s => s.id === columnId);
    if (!sort) return null;
    return sort.desc ? <ChevronDown className='w-4 h-4' /> : <ChevronUp className='w-4 h-4' />;
  };

  const isAllSelected =
    rowSelection &&
    Object.keys(rowSelection).length > 0 &&
    Object.values(rowSelection).every(Boolean);
  const isIndeterminate =
    rowSelection &&
    Object.keys(rowSelection).length > 0 &&
    Object.values(rowSelection).some(Boolean) &&
    !isAllSelected;

  return (
    <thead className='bg-gray-800/50'>
      <tr>
        {/* Selection Column */}
        {rowSelection !== undefined && (
          <th className='px-4 py-3 text-left w-12'>
            <input
              type='checkbox'
              checked={isAllSelected}
              ref={input => {
                if (input) input.indeterminate = isIndeterminate || false;
              }}
              onChange={onSelectAll}
              className='w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500'
            />
          </th>
        )}

        {/* Data Columns */}
        {columns.map(column => (
          <th
            key={column.id}
            className={`px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider ${
              column.sortable ? 'cursor-pointer hover:bg-gray-700/50' : ''
            } ${column.className || ''}`}
            style={{ width: column.width }}
            onClick={() => column.sortable && handleSort(column.id)}
          >
            <div
              className={`flex items-center space-x-1 ${
                column.align === 'center'
                  ? 'justify-center'
                  : column.align === 'right'
                    ? 'justify-end'
                    : 'justify-start'
              }`}
            >
              <span>{column.header}</span>
              {column.sortable && getSortIcon(column.id)}
            </div>
          </th>
        ))}

        {/* Actions Column */}
        {hasActions && (
          <th className='px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider w-20'>
            Actions
          </th>
        )}
      </tr>
    </thead>
  );
};

const TableRow: React.FC<{
  row: any;
  columns: TableColumn[];
  isSelected?: boolean;
  onSelect?: () => void;
  actions?: TableAction[];
  rowId: string;
}> = ({ row, columns, isSelected, onSelect, actions, rowId }) => {
  const [showActions, setShowActions] = useState(false);

  const visibleActions = actions?.filter(action => !action.hidden?.(row)) || [];

  return (
    <tr className='hover:bg-gray-800/30 transition-colors border-b border-gray-700/50'>
      {/* Selection Column */}
      {onSelect && (
        <td className='px-4 py-4 w-12'>
          <input
            type='checkbox'
            checked={isSelected}
            onChange={onSelect}
            className='w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500'
          />
        </td>
      )}

      {/* Data Columns */}
      {columns.map(column => {
        const value = getCellValue(row, column);
        const cellContent = column.cell ? column.cell(row, value) : value;

        return (
          <td
            key={column.id}
            className={`px-4 py-4 text-sm text-gray-300 ${column.className || ''}`}
            style={{ width: column.width }}
          >
            <div
              className={
                column.align === 'center'
                  ? 'text-center'
                  : column.align === 'right'
                    ? 'text-right'
                    : 'text-left'
              }
            >
              {cellContent}
            </div>
          </td>
        );
      })}

      {/* Actions Column */}
      {visibleActions.length > 0 && (
        <td className='px-4 py-4 text-right text-sm font-medium w-20'>
          <div className='relative'>
            <button
              onClick={() => setShowActions(!showActions)}
              className='text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-700'
            >
              <MoreHorizontal className='w-4 h-4' />
            </button>

            {showActions && (
              <div className='absolute right-0 top-8 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 min-w-32'>
                {visibleActions.map(action => (
                  <button
                    key={action.id}
                    onClick={() => {
                      action.onClick(row);
                      setShowActions(false);
                    }}
                    disabled={action.disabled?.(row)}
                    className={`
                      w-full px-3 py-2 text-left text-sm hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg
                      flex items-center space-x-2 transition-colors
                      ${
                        action.variant === 'danger'
                          ? 'text-red-400 hover:text-red-300'
                          : action.variant === 'success'
                            ? 'text-green-400 hover:text-green-300'
                            : action.variant === 'warning'
                              ? 'text-yellow-400 hover:text-yellow-300'
                              : 'text-gray-300 hover:text-white'
                      }
                      ${action.disabled?.(row) ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {action.icon}
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </td>
      )}
    </tr>
  );
};

const TablePaginationComponent: React.FC<{
  pagination: TablePagination;
  onPaginationChange: (pagination: TablePagination) => void;
}> = ({ pagination, onPaginationChange }) => {
  const { pageIndex, pageSize, total = 0 } = pagination;
  const totalPages = Math.ceil(total / pageSize);
  const startItem = pageIndex * pageSize + 1;
  const endItem = Math.min((pageIndex + 1) * pageSize, total);

  const canPreviousPage = pageIndex > 0;
  const canNextPage = pageIndex < totalPages - 1;

  const goToPage = (page: number) => {
    onPaginationChange({ ...pagination, pageIndex: page });
  };

  const changePageSize = (newPageSize: number) => {
    onPaginationChange({ ...pagination, pageSize: newPageSize, pageIndex: 0 });
  };

  return (
    <div className='flex items-center justify-between px-4 py-3 bg-gray-800/30 border-t border-gray-700'>
      <div className='flex items-center space-x-4'>
        <span className='text-sm text-gray-400'>
          Showing {startItem} to {endItem} of {total} results
        </span>

        <select
          value={pageSize}
          onChange={e => changePageSize(Number(e.target.value))}
          className='px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500'
        >
          {[10, 20, 50, 100].map(size => (
            <option key={size} value={size}>
              {size} per page
            </option>
          ))}
        </select>
      </div>

      <div className='flex items-center space-x-2'>
        <button
          onClick={() => goToPage(pageIndex - 1)}
          disabled={!canPreviousPage}
          className='p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed'
        >
          <ChevronLeft className='w-4 h-4' />
        </button>

        <div className='flex items-center space-x-1'>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i;
            } else if (pageIndex < 3) {
              pageNum = i;
            } else if (pageIndex > totalPages - 4) {
              pageNum = totalPages - 5 + i;
            } else {
              pageNum = pageIndex - 2 + i;
            }

            return (
              <button
                key={pageNum}
                onClick={() => goToPage(pageNum)}
                className={`
                  px-3 py-1 text-sm rounded transition-colors
                  ${
                    pageNum === pageIndex
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }
                `}
              >
                {pageNum + 1}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => goToPage(pageIndex + 1)}
          disabled={!canNextPage}
          className='p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed'
        >
          <ChevronRight className='w-4 h-4' />
        </button>
      </div>
    </div>
  );
};

// ===== MAIN TABLE COMPONENT =====
const Table: React.FC<TableProps> = ({
  data,
  columns,
  loading = false,
  pagination,
  onPaginationChange,
  sorting = [],
  onSortingChange,
  filtering = [],
  onFilteringChange,
  rowSelection,
  onRowSelectionChange,
  getRowId = (row: any, index?: number) => (index ?? 0).toString(),
  actions = [],
  emptyState,
  className = '',
  searchable = false,
  searchPlaceholder = 'Search...',
  onSearch,
  bulkActions = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Process data
  const processedData = useMemo(() => {
    let result = data;

    // Apply sorting if no external sorting handler
    if (!onSortingChange && sorting.length > 0) {
      result = sortData(result, columns, sorting);
    }

    // Apply filtering if no external filtering handler
    if (!onFilteringChange && filtering.length > 0) {
      result = filterData(result, columns, filtering);
    }

    return result;
  }, [data, columns, sorting, filtering, onSortingChange, onFilteringChange]);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    } else {
      // Local search implementation
      // This would need to be implemented based on searchable columns
    }
  }, [onSearch]); // ✅ Optimization: useCallback applied to handleSearch

  // Handle selection
  const handleSelectAll = useCallback(() => {
    if (!onRowSelectionChange) return;

    const allSelected = processedData.every(row => {
      const id = getRowId(row, processedData.indexOf(row));
      return rowSelection?.[id];
    });

    const newSelection: Record<string, boolean> = {};
    if (!allSelected) {
      processedData.forEach(row => {
        const id = getRowId(row, processedData.indexOf(row));
        newSelection[id] = true;
      });
    }

    onRowSelectionChange(newSelection);
  }, [processedData, rowSelection, getRowId, onRowSelectionChange]); // ✅ Optimization: useCallback applied to handleSelectAll

  const handleRowSelect = useCallback((row: any) => {
    if (!onRowSelectionChange) return;

    const id = getRowId(row, processedData.indexOf(row));
    const newSelection = { ...rowSelection };

    if (newSelection[id]) {
      delete newSelection[id];
    } else {
      newSelection[id] = true;
    }

    onRowSelectionChange(newSelection);
  }, [processedData, rowSelection, getRowId, onRowSelectionChange]); // ✅ Optimization: useCallback applied to handleRowSelect

  // Get selected rows
  const selectedRows = useMemo(() => {
    if (!rowSelection) return [];
    return processedData.filter(row => {
      const id = getRowId(row, processedData.indexOf(row));
      return rowSelection[id];
    });
  }, [processedData, rowSelection, getRowId]);

  const hasSelection = selectedRows.length > 0;

  if (loading) {
    return (
      <div
        className={`bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden ${className}`}
      >
        <div className='p-6'>
          <div className='space-y-4'>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} height='3rem' />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden ${className}`}
    >
      {/* Header with Search and Bulk Actions */}
      {(searchable || bulkActions.length > 0 || hasSelection) && (
        <div className='p-4 border-b border-gray-700 space-y-4'>
          <div className='flex items-center justify-between'>
            {/* Search */}
            {searchable && (
              <div className='relative max-w-md'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                <input
                  type='text'
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={e => handleSearch(e.target.value)}
                  className='w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500'
                />
              </div>
            )}

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className='flex items-center space-x-2 px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors'
            >
              <Filter className='w-4 h-4' />
              <span>Filters</span>
            </button>
          </div>

          {/* Bulk Actions */}
          {hasSelection && bulkActions.length > 0 && (
            <div className='flex items-center space-x-2'>
              <span className='text-sm text-gray-400'>{selectedRows.length} selected</span>
              {bulkActions.map(action => (
                <button
                  key={action.id}
                  onClick={() => action.onClick(selectedRows)}
                  className={`
                    flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${
                      action.variant === 'danger'
                        ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                        : action.variant === 'success'
                          ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                          : action.variant === 'warning'
                            ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'
                            : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                    }
                  `}
                >
                  {action.icon}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className='overflow-x-auto'>
        {processedData.length === 0 ? (
          <div className='p-12 text-center'>
            {emptyState || (
              <div className='space-y-3'>
                <AlertCircle className='w-12 h-12 text-gray-500 mx-auto' />
                <h3 className='text-lg font-medium text-gray-300'>No data available</h3>
                <p className='text-gray-500'>There are no items to display.</p>
              </div>
            )}
          </div>
        ) : (
          <table className='min-w-full'>
            <TableHeader
              columns={columns}
              sorting={sorting}
              onSortingChange={onSortingChange || (() => {})}
              rowSelection={rowSelection}
              onSelectAll={rowSelection ? handleSelectAll : undefined}
              hasActions={actions.length > 0}
            />
            <tbody className='divide-y divide-gray-700/50'>
              {processedData.map((row, index) => {
                const rowId = getRowId(row, index);
                return (
                  <TableRow
                    key={rowId}
                    row={row}
                    columns={columns}
                    isSelected={rowSelection?.[rowId]}
                    onSelect={rowSelection ? () => handleRowSelect(row) : undefined}
                    actions={actions}
                    rowId={rowId}
                  />
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination && onPaginationChange && (
        <TablePaginationComponent pagination={pagination} onPaginationChange={onPaginationChange} />
      )}
    </div>
  );
};

// ===== UTILITY COMPONENTS =====
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4,
}) => (
  <div className='bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden'>
    <div className='p-4 border-b border-gray-700'>
      <Skeleton height='2.5rem' width='50%' />
    </div>
    <div className='p-4 space-y-4'>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className='grid gap-4'
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} height='2rem' />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export default Table;
export {
  type TableColumn,
  type TableFilter,
  type TableSort,
  type TablePagination,
  type TableAction,
};
