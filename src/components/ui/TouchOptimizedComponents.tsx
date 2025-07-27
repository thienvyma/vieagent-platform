'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { useSwipeable } from 'react-swipeable';

// Touch-optimized Button Component
interface TouchButtonProps {
  children: ReactNode;
  onClick?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  hapticFeedback?: boolean;
}

export function TouchButton({
  children,
  onClick,
  onLongPress,
  disabled = false,
  variant = 'primary',
  size = 'md',
  className = '',
  hapticFeedback = true,
}: TouchButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [isLongPressed, setIsLongPressed] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const baseClasses = 'relative overflow-hidden transition-all duration-150 ease-out select-none';

  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg active:shadow-xl',
    secondary: 'bg-gray-800/80 text-white border border-gray-700/50 active:bg-gray-700/80',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg active:shadow-xl',
    ghost: 'bg-transparent text-gray-400 hover:text-white hover:bg-white/10 active:bg-white/20',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm rounded-xl min-h-[44px]',
    md: 'px-6 py-3 text-base rounded-2xl min-h-[48px]',
    lg: 'px-8 py-4 text-lg rounded-3xl min-h-[52px]',
  };

  const disabledClasses = 'opacity-50 cursor-not-allowed';

  const handleTouchStart = () => {
    if (disabled) return;

    setIsPressed(true);

    // Haptic feedback
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }

    // Long press detection
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        setIsLongPressed(true);
        onLongPress();
        if (hapticFeedback && 'vibrate' in navigator) {
          navigator.vibrate([20, 10, 20]);
        }
      }, 500);
    }
  };

  const handleTouchEnd = () => {
    if (disabled) return;

    setIsPressed(false);

    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (!isLongPressed && onClick) {
      onClick();
    }

    setIsLongPressed(false);
  };

  const handleTouchCancel = () => {
    setIsPressed(false);
    setIsLongPressed(false);

    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled ? disabledClasses : ''}
        ${isPressed ? 'scale-95 brightness-110' : 'scale-100'}
        ${className}
      `}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchCancel}
      disabled={disabled}
    >
      {children}

      {/* Ripple effect */}
      <div className='absolute inset-0 overflow-hidden rounded-inherit'>
        <div
          className={`
          absolute inset-0 bg-white/20 transform transition-transform duration-300 ease-out
          ${isPressed ? 'scale-100' : 'scale-0'}
        `}
        />
      </div>
    </button>
  );
}

// Swipeable Card Component
interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  className?: string;
  swipeThreshold?: number;
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  leftAction,
  rightAction,
  className = '',
  swipeThreshold = 100,
}: SwipeableCardProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwipingLeft, setIsSwipingLeft] = useState(false);
  const [isSwipingRight, setIsSwipingRight] = useState(false);

  const handlers = useSwipeable({
    onSwiping: eventData => {
      const offset = eventData.deltaX;
      setSwipeOffset(offset);
      setIsSwipingLeft(offset < -50);
      setIsSwipingRight(offset > 50);
    },
    onSwipedLeft: () => {
      if (Math.abs(swipeOffset) > swipeThreshold) {
        onSwipeLeft?.();
      }
      resetSwipe();
    },
    onSwipedRight: () => {
      if (Math.abs(swipeOffset) > swipeThreshold) {
        onSwipeRight?.();
      }
      resetSwipe();
    },
    onSwipedUp: () => {
      onSwipeUp?.();
      resetSwipe();
    },
    onSwipedDown: () => {
      onSwipeDown?.();
      resetSwipe();
    },
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  const resetSwipe = () => {
    setSwipeOffset(0);
    setIsSwipingLeft(false);
    setIsSwipingRight(false);
  };

  return (
    <div className={`relative overflow-hidden ${className}`} {...handlers}>
      {/* Left Action */}
      {leftAction && (
        <div
          className={`
          absolute left-0 top-0 bottom-0 flex items-center justify-center bg-green-500/20 backdrop-blur-sm
          transition-all duration-200 ease-out
          ${isSwipingRight ? 'w-20 opacity-100' : 'w-0 opacity-0'}
        `}
        >
          {leftAction}
        </div>
      )}

      {/* Right Action */}
      {rightAction && (
        <div
          className={`
          absolute right-0 top-0 bottom-0 flex items-center justify-center bg-red-500/20 backdrop-blur-sm
          transition-all duration-200 ease-out
          ${isSwipingLeft ? 'w-20 opacity-100' : 'w-0 opacity-0'}
        `}
        >
          {rightAction}
        </div>
      )}

      {/* Main Content */}
      <div
        className='transition-transform duration-200 ease-out'
        style={{
          transform: `translateX(${Math.max(-100, Math.min(100, swipeOffset * 0.5))}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Touch-optimized Slider Component
interface TouchSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  className?: string;
  hapticFeedback?: boolean;
}

export function TouchSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  className = '',
  hapticFeedback = true,
}: TouchSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const handleStart = (clientX: number) => {
    setIsDragging(true);
    updateValue(clientX);

    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(5);
    }
  };

  const handleMove = (clientX: number) => {
    if (!isDragging) return;
    updateValue(clientX);
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  const updateValue = (clientX: number) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newValue = min + (max - min) * percentage;
    const steppedValue = Math.round(newValue / step) * step;

    onChange(steppedValue);
  };

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className='flex justify-between items-center'>
          <span className='text-sm font-medium text-gray-300'>{label}</span>
          <span className='text-sm text-gray-400'>{value}</span>
        </div>
      )}

      <div
        ref={sliderRef}
        className='relative h-12 bg-gray-800/80 rounded-2xl cursor-pointer select-none'
        onMouseDown={e => handleStart(e.clientX)}
        onMouseMove={e => handleMove(e.clientX)}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={e => handleStart(e.touches[0].clientX)}
        onTouchMove={e => handleMove(e.touches[0].clientX)}
        onTouchEnd={handleEnd}
      >
        {/* Track */}
        <div
          className='absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl transition-all duration-150'
          style={{ width: `${percentage}%` }}
        />

        {/* Thumb */}
        <div
          className={`
            absolute top-1/2 w-8 h-8 bg-white rounded-full shadow-lg transform -translate-y-1/2 transition-all duration-150
            ${isDragging ? 'scale-125 shadow-xl' : 'scale-100'}
          `}
          style={{ left: `calc(${percentage}% - 16px)` }}
        >
          <div className='absolute inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full' />
        </div>
      </div>
    </div>
  );
}

// Pull-to-refresh Component
interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
  refreshThreshold?: number;
}

export function PullToRefresh({
  children,
  onRefresh,
  className = '',
  refreshThreshold = 80,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canRefresh, setCanRefresh] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY.current);

    if (distance > 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance * 0.5, 120));
      setCanRefresh(distance > refreshThreshold);
    }
  };

  const handleTouchEnd = async () => {
    if (canRefresh && !isRefreshing) {
      setIsRefreshing(true);

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
        setCanRefresh(false);
      }
    } else {
      setPullDistance(0);
      setCanRefresh(false);
    }
  };

  const refreshProgress = Math.min(pullDistance / refreshThreshold, 1);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      <div
        className='absolute top-0 left-0 right-0 flex items-center justify-center bg-gradient-to-b from-blue-500/20 to-transparent backdrop-blur-sm transition-all duration-300'
        style={{
          height: `${pullDistance}px`,
          transform: `translateY(${pullDistance - 80}px)`,
        }}
      >
        <div className='flex items-center space-x-2 text-white'>
          <div
            className={`w-6 h-6 border-2 border-white rounded-full transition-all duration-300 ${
              isRefreshing ? 'animate-spin border-t-transparent' : ''
            }`}
            style={{
              transform: `rotate(${refreshProgress * 360}deg)`,
              opacity: pullDistance > 20 ? 1 : 0,
            }}
          />
          <span className='text-sm font-medium'>
            {isRefreshing ? 'Refreshing...' : canRefresh ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div
        className='transition-transform duration-300 ease-out'
        style={{
          transform: `translateY(${isRefreshing ? 60 : pullDistance}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Touch-optimized Tab Component
interface TouchTabsProps {
  tabs: Array<{
    id: string;
    label: string;
    icon?: ReactNode;
    badge?: string;
  }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function TouchTabs({ tabs, activeTab, onTabChange, className = '' }: TouchTabsProps) {
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateIndicator = () => {
      if (!tabsRef.current) return;

      const activeTabElement = tabsRef.current.querySelector(
        `[data-tab="${activeTab}"]`
      ) as HTMLElement;
      if (activeTabElement) {
        setIndicatorStyle({
          left: activeTabElement.offsetLeft,
          width: activeTabElement.offsetWidth,
        });
      }
    };

    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [activeTab]);

  return (
    <div className={`relative ${className}`}>
      <div
        ref={tabsRef}
        className='flex bg-gray-800/80 rounded-2xl p-1 relative overflow-x-auto scrollbar-hide'
      >
        {/* Active indicator */}
        <div
          className='absolute top-1 bottom-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl transition-all duration-300 ease-out'
          style={{
            left: `${indicatorStyle.left}px`,
            width: `${indicatorStyle.width}px`,
          }}
        />

        {tabs.map(tab => (
          <button
            key={tab.id}
            data-tab={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              relative flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 min-h-[48px] whitespace-nowrap
              ${activeTab === tab.id ? 'text-white' : 'text-gray-400 hover:text-white'}
            `}
          >
            {tab.icon && <div className='w-5 h-5 flex items-center justify-center'>{tab.icon}</div>}
            <span>{tab.label}</span>
            {tab.badge && (
              <span className='px-2 py-1 bg-red-500 text-white text-xs rounded-full'>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
