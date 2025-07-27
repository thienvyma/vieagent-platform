import React from 'react';
import { CustomSwitch } from './custom-switch';

interface EnableSwitchContainerProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  borderColor: string;
  shadowColor: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export const EnableSwitchContainer: React.FC<EnableSwitchContainerProps> = ({
  checked,
  onCheckedChange,
  title,
  description,
  icon,
  iconBgColor,
  iconColor,
  borderColor,
  shadowColor,
  size = 'lg',
  disabled = false,
  className = ''
}) => {
  // Color mappings
  const colorMap = {
    green: { bg: '#10b981', border: '#059669', shadow: '#047857' },
    blue: { bg: '#3b82f6', border: '#2563eb', shadow: '#1d4ed8' },
    purple: { bg: '#8b5cf6', border: '#7c3aed', shadow: '#6d28d9' },
    yellow: { bg: '#eab308', border: '#ca8a04', shadow: '#a16207' },
    orange: { bg: '#f97316', border: '#ea580c', shadow: '#c2410c' },
    red: { bg: '#ef4444', border: '#dc2626', shadow: '#b91c1c' }
  };

  const colors = colorMap[iconColor as keyof typeof colorMap] || colorMap.green;

  const containerStyles = {
    position: 'relative' as const,
    padding: '16px',
    background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.6), rgba(17, 24, 39, 0.6), rgba(31, 41, 55, 0.6))',
    borderRadius: '10px',
    border: `1px solid ${checked ? `${colors.border}40` : 'rgba(75, 85, 99, 0.5)'}`,
    backdropFilter: 'blur(8px)',
    transition: 'all 0.5s ease',
    cursor: 'pointer',
    overflow: 'hidden'
  };

  const backgroundOverlayStyles = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: '10px',
    background: checked 
      ? `linear-gradient(135deg, ${colors.bg}08, ${colors.bg}05, transparent)` 
      : 'linear-gradient(135deg, rgba(107, 114, 128, 0.05), rgba(75, 85, 99, 0.03), transparent)',
    transition: 'all 0.7s ease',
    zIndex: 1
  };

  const particlesStyles = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: '10px',
    background: checked 
      ? `radial-gradient(circle at 20% 20%, ${colors.bg}20, transparent 40%), radial-gradient(circle at 80% 80%, ${colors.border}20, transparent 40%)` 
      : 'radial-gradient(circle at 20% 20%, rgba(148, 163, 184, 0.1), transparent 40%), radial-gradient(circle at 80% 80%, rgba(107, 114, 128, 0.1), transparent 40%)',
    transition: 'all 1s ease',
    zIndex: 2
  };

  const iconContainerStyles = {
    position: 'relative' as const,
    padding: '8px',
    background: `linear-gradient(135deg, ${colors.bg}20, ${colors.bg}10)`,
    borderRadius: '8px',
    border: `1px solid ${colors.border}30`,
    transition: 'all 0.5s ease',
    transform: checked ? 'scale(1.05)' : 'scale(1)',
    zIndex: 3
  };

  const iconGlowStyles = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: '8px',
    background: checked 
      ? `linear-gradient(135deg, ${colors.bg}20, transparent)` 
      : `linear-gradient(135deg, ${colors.bg}10, transparent)`,
    transition: 'all 0.5s ease'
  };

  const titleStyles = {
    color: checked ? colors.bg : '#ffffff',
    fontWeight: 600,
    fontSize: '16px',
    transition: 'all 0.3s ease',
    margin: 0
  };

  const descriptionStyles = {
    color: checked ? '#d1d5db' : '#9ca3af',
    fontSize: '13px',
    margin: '2px 0 0 0',
    transition: 'all 0.3s ease'
  };

  const rippleStyles = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: '10px',
    background: checked 
      ? `linear-gradient(90deg, ${colors.bg}10, ${colors.border}10)` 
      : 'linear-gradient(90deg, rgba(107, 114, 128, 0.05), rgba(75, 85, 99, 0.05))',
    opacity: 0,
    transition: 'all 0.3s ease',
    zIndex: 4
  };

  return (
    <div 
      style={containerStyles}
      className={className}
      onMouseEnter={(e) => {
        const ripple = e.currentTarget.querySelector('[data-ripple]') as HTMLElement;
        if (ripple) ripple.style.opacity = '1';
      }}
      onMouseLeave={(e) => {
        const ripple = e.currentTarget.querySelector('[data-ripple]') as HTMLElement;
        if (ripple) ripple.style.opacity = '0';
      }}
    >
      {/* Background overlays */}
      <div style={backgroundOverlayStyles} />
      <div style={particlesStyles} />

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Icon container */}
          <div style={iconContainerStyles}>
            <div style={iconGlowStyles} />
            <div style={{ 
              position: 'relative', 
              color: colors.bg, 
              transition: 'all 0.3s ease',
              zIndex: 1
            }}>
              {icon}
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1 }}>
            <h3 style={titleStyles}>{title}</h3>
            <p style={descriptionStyles}>{description}</p>
          </div>
        </div>

        {/* Switch container */}
        <div style={{ position: 'relative' }}>
          <CustomSwitch
            checked={checked}
            onCheckedChange={onCheckedChange}
            size={size}
            disabled={disabled}
          />
          
          {/* Status indicator */}
          {checked && (
            <div style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: `linear-gradient(90deg, ${colors.bg}, ${colors.border})`,
              boxShadow: `0 0 6px ${colors.shadow}80`,
              animation: 'pulse 2s infinite',
              zIndex: 6
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: '50%',
                background: `${colors.bg}80`,
                animation: 'ping 1s infinite'
              }} />
            </div>
          )}
        </div>
      </div>

      {/* Ripple effect */}
      <div style={rippleStyles} data-ripple />

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
        div:hover {
          transform: scale(1.01);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </div>
  );
}; 