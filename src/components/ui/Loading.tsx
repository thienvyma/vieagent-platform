import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'white' | 'blue' | 'gray' | 'green' | 'red';
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', color = 'white', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const colorClasses = {
    white: 'border-white border-t-transparent',
    blue: 'border-blue-500 border-t-transparent',
    gray: 'border-gray-400 border-t-transparent',
    green: 'border-green-500 border-t-transparent',
    red: 'border-red-500 border-t-transparent',
  };

  return (
    <div
      className={`
        ${sizeClasses[size]} 
        border-2 ${colorClasses[color]} 
        rounded-full animate-spin
        ${className}
      `}
    />
  );
};

interface LoadingProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  centered?: boolean;
  overlay?: boolean;
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({
  text = 'Loading...',
  size = 'md',
  centered = true,
  overlay = false,
  className = '',
}) => {
  const containerClasses = centered
    ? 'flex items-center justify-center space-x-3'
    : 'flex items-center space-x-3';

  const overlayClasses = overlay ? 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50' : '';

  const content = (
    <div className={`${containerClasses} ${className}`}>
      <Spinner size={size} />
      {text && <span className='text-gray-300 font-medium'>{text}</span>}
    </div>
  );

  if (overlay) {
    return (
      <div className={overlayClasses}>
        <div className='flex items-center justify-center min-h-screen'>{content}</div>
      </div>
    );
  }

  return content;
};

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  rounded?: boolean;
  count?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  className = '',
  rounded = false,
  count = 1,
}) => {
  const skeletonClass = `
    bg-gray-700 animate-pulse
    ${rounded ? 'rounded-full' : 'rounded'}
    ${className}
  `;

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  if (count === 1) {
    return <div className={skeletonClass} style={style} />;
  }

  return (
    <div className='space-y-2'>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={skeletonClass} style={style} />
      ))}
    </div>
  );
};

interface CardSkeletonProps {
  showAvatar?: boolean;
  lines?: number;
  className?: string;
}

const CardSkeleton: React.FC<CardSkeletonProps> = ({
  showAvatar = false,
  lines = 3,
  className = '',
}) => {
  return (
    <div className={`p-4 bg-gray-800/50 rounded-xl border border-gray-700 ${className}`}>
      <div className='flex items-start space-x-4'>
        {showAvatar && <Skeleton width={40} height={40} rounded className='flex-shrink-0' />}
        <div className='flex-1 space-y-2'>
          <Skeleton height='1.25rem' width='60%' />
          {Array.from({ length: lines - 1 }).map((_, index) => (
            <Skeleton key={index} height='1rem' width={index === lines - 2 ? '40%' : '100%'} />
          ))}
        </div>
      </div>
    </div>
  );
};

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 5, columns = 4, className = '' }) => {
  return (
    <div
      className={`bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className='grid grid-cols-4 gap-4 p-4 border-b border-gray-700'>
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} height='1.25rem' width='80%' />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className='grid grid-cols-4 gap-4 p-4 border-b border-gray-700/50 last:border-b-0'
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} height='1rem' width={colIndex === 0 ? '100%' : '60%'} />
          ))}
        </div>
      ))}
    </div>
  );
};

interface PageLoadingProps {
  title?: string;
  description?: string;
}

const PageLoading: React.FC<PageLoadingProps> = ({
  title = 'Loading...',
  description = 'Please wait while we load your content',
}) => {
  return (
    <div className='min-h-screen bg-gray-900 flex items-center justify-center p-4'>
      <div className='text-center space-y-6'>
        <div className='w-16 h-16 mx-auto'>
          <Spinner size='xl' color='blue' />
        </div>
        <div className='space-y-2'>
          <h2 className='text-2xl font-bold text-white'>{title}</h2>
          <p className='text-gray-400'>{description}</p>
        </div>
      </div>
    </div>
  );
};

interface ButtonLoadingProps {
  loading?: boolean;
  children: React.ReactNode;
  loadingText?: string;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
}

const ButtonLoading: React.FC<ButtonLoadingProps> = ({
  loading = false,
  children,
  loadingText = 'Loading...',
  disabled = false,
  className = '',
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center space-x-2
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {loading ? (
        <>
          <Spinner size='sm' />
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Loading;
export { Spinner, Skeleton, CardSkeleton, TableSkeleton, PageLoading, ButtonLoading };
