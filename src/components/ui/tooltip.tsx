'use client';

import { useState, ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function Tooltip({ content, children, position = 'top', className = '' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`absolute z-50 ${positionClasses[position]}`}>
          <div className='bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg border border-gray-700 max-w-xs'>
            {content}
            <div
              className={`absolute w-2 h-2 bg-gray-900 border-gray-700 transform rotate-45 ${
                position === 'top'
                  ? 'top-full left-1/2 -translate-x-1/2 -mt-1 border-b border-r'
                  : position === 'bottom'
                    ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1 border-t border-l'
                    : position === 'left'
                      ? 'left-full top-1/2 -translate-y-1/2 -ml-1 border-t border-r'
                      : 'right-full top-1/2 -translate-y-1/2 -mr-1 border-b border-l'
              }`}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}
