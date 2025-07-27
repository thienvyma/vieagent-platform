import React from 'react';

interface CustomSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export const CustomSwitch: React.FC<CustomSwitchProps> = ({
  checked,
  onCheckedChange,
  className = '',
  size = 'md',
  disabled = false
}) => {
  // Reduced size configurations
  const sizeConfig = {
    sm: { width: '36px', height: '20px', thumbSize: '16px', translate: checked ? '16px' : '2px' },
    md: { width: '44px', height: '24px', thumbSize: '20px', translate: checked ? '20px' : '2px' },
    lg: { width: '52px', height: '28px', thumbSize: '24px', translate: checked ? '24px' : '2px' }
  };

  const config = sizeConfig[size];

  const switchStyles = {
    position: 'relative' as const,
    width: config.width,
    height: config.height,
    borderRadius: '9999px',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s ease',
    background: checked 
      ? 'linear-gradient(90deg, #10b981, #059669, #047857)' 
      : 'linear-gradient(90deg, #64748b, #475569, #334155)',
    boxShadow: checked 
      ? '0 2px 8px rgba(16, 185, 129, 0.4), 0 0 0 1px rgba(16, 185, 129, 0.2)' 
      : '0 2px 8px rgba(100, 116, 139, 0.3), 0 0 0 1px rgba(100, 116, 139, 0.1)',
    opacity: disabled ? 0.5 : 1,
    outline: 'none'
  };

  const thumbStyles = {
    position: 'absolute' as const,
    top: '2px',
    left: '2px',
    width: config.thumbSize,
    height: config.thumbSize,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.3)',
    transition: 'all 0.3s ease',
    transform: `translateX(${config.translate})`,
    zIndex: 2
  };

  const backgroundOverlayStyles = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: '9999px',
    background: checked 
      ? 'radial-gradient(circle at 30% 30%, rgba(16, 185, 129, 0.2), transparent 50%), radial-gradient(circle at 70% 70%, rgba(34, 197, 94, 0.2), transparent 50%)'
      : 'radial-gradient(circle at 30% 30%, rgba(148, 163, 184, 0.2), transparent 50%), radial-gradient(circle at 70% 70%, rgba(107, 114, 128, 0.2), transparent 50%)',
    transition: 'all 0.5s ease',
    zIndex: 1
  };

  const indicatorStyles = {
    position: 'absolute' as const,
    top: '-2px',
    right: '-2px',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: 'linear-gradient(90deg, #10b981, #059669)',
    boxShadow: '0 0 4px rgba(16, 185, 129, 0.6)',
    animation: 'pulse 2s infinite',
    zIndex: 3
  };

  return (
    <button
      onClick={() => !disabled && onCheckedChange(!checked)}
      style={switchStyles}
      disabled={disabled}
      className={className}
    >
      {/* Background overlay */}
      <div style={backgroundOverlayStyles} />
      
      {/* Thumb */}
      <div style={thumbStyles}>
        {/* Inner highlight */}
        <div style={{
          position: 'absolute',
          top: '1px',
          left: '1px',
          right: '1px',
          bottom: '1px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8), transparent)',
          transition: 'all 0.3s ease'
        }} />
      </div>

      {/* Status indicator */}
      {checked && (
        <div style={indicatorStyles}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.5)',
            animation: 'ping 1s infinite'
          }} />
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        button:hover {
          transform: scale(1.05);
        }
        button:active {
          transform: scale(0.95);
        }
      `}</style>
    </button>
  );
}; 