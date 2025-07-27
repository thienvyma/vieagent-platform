import React from 'react';
import Link from 'next/link';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  href?: string;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  gradient?: string;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  href,
  type = 'button',
  className = '',
  icon,
  iconPosition = 'left',
  gradient,
  fullWidth = false,
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500';

  const variantClasses = {
    primary: gradient
      ? `bg-gradient-to-r ${gradient} text-white hover:opacity-90 hover:scale-105 shadow-2xl hover:shadow-blue-500/30`
      : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:scale-105 shadow-2xl hover:shadow-blue-500/30',
    secondary:
      'bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:from-gray-700 hover:to-gray-800 hover:scale-105',
    outline:
      'border-2 border-gray-600 text-gray-300 hover:border-gray-400 hover:text-white hover:shadow-lg hover:shadow-gray-500/20',
    ghost: 'text-gray-300 hover:text-white hover:bg-white/10',
    danger:
      'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 hover:scale-105',
    success:
      'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 hover:scale-105',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-6 py-2 text-base rounded-xl',
    lg: 'px-8 py-3 text-lg rounded-xl',
    xl: 'px-12 py-4 text-xl rounded-2xl',
  };

  const disabledClasses = 'opacity-50 cursor-not-allowed hover:scale-100';
  const loadingClasses = 'cursor-wait';
  const fullWidthClasses = fullWidth ? 'w-full' : '';

  const buttonClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    disabled && disabledClasses,
    loading && loadingClasses,
    fullWidthClasses,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const iconSpacing = size === 'sm' ? 'space-x-1' : size === 'xl' ? 'space-x-3' : 'space-x-2';

  const buttonContent = (
    <span className={`flex items-center ${iconSpacing}`}>
      {loading ? (
        <>
          <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin'></div>
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <span>{children}</span>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </span>
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={buttonClasses}>
        {buttonContent}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} className={buttonClasses}>
      {buttonContent}
    </button>
  );
};

interface IconButtonProps {
  icon: React.ReactNode;
  tooltip?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

const IconButton: React.FC<IconButtonProps> = ({
  icon,
  tooltip,
  variant = 'ghost',
  size = 'md',
  disabled = false,
  onClick,
  className = '',
}) => {
  const baseClasses =
    'inline-flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500';

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
    ghost: 'text-gray-400 hover:text-white hover:bg-gray-800',
    danger: 'text-red-400 hover:text-white hover:bg-red-600',
  };

  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-12 h-12 rounded-xl',
  };

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

  const buttonClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    disabledClasses,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button onClick={onClick} disabled={disabled} className={buttonClasses} title={tooltip}>
      {icon}
    </button>
  );
};

interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'sm' | 'md' | 'lg';
}

const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  className = '',
  orientation = 'horizontal',
  spacing = 'md',
}) => {
  const spacingClasses = {
    sm: orientation === 'horizontal' ? 'space-x-2' : 'space-y-2',
    md: orientation === 'horizontal' ? 'space-x-4' : 'space-y-4',
    lg: orientation === 'horizontal' ? 'space-x-6' : 'space-y-6',
  };

  const orientationClasses = orientation === 'horizontal' ? 'flex' : 'flex flex-col';

  return (
    <div className={`${orientationClasses} ${spacingClasses[spacing]} ${className}`}>
      {children}
    </div>
  );
};

// ✅ fixed from TS Phase 2 - Add missing buttonVariants function
export const buttonVariants = (variant?: string, size?: string) => {
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
    outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700',
    ghost: 'hover:bg-gray-100 text-gray-700',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg',
  };

  return `inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${
    variantClasses[variant as keyof typeof variantClasses] || variantClasses.primary
  } ${sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.md}`;
};

export { Button, IconButton, ButtonGroup };
export default Button;
