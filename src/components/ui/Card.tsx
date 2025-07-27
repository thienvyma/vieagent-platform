import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  gradient?: string;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'lg' | 'xl' | '2xl' | '3xl';
  border?: boolean;
  backdrop?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  gradient,
  hover = true,
  padding = 'lg',
  rounded = '3xl',
  border = true,
  backdrop = true,
  onClick,
}) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-12',
  };

  const roundedClasses = {
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl',
  };

  const baseClasses = [
    'bg-white/5',
    backdrop && 'backdrop-blur-sm',
    border && 'border border-white/10',
    hover && 'hover:border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl',
    paddingClasses[padding],
    roundedClasses[rounded],
    gradient && `bg-gradient-to-r ${gradient}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={baseClasses} onClick={onClick}>{children}</div>;
};

// ✅ ADDED: Missing shadcn/ui compatible components
const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>;

const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`}>{children}</h3>
);

const CardDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>;

const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <div className={`p-6 pt-0 ${className}`}>{children}</div>;

const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <div className={`flex items-center p-6 pt-0 ${className}`}>{children}</div>;

interface StatCardProps {
  icon: React.ReactNode | string;
  title: string;
  value: string | number;
  description?: string;
  gradient?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  title,
  value,
  description,
  gradient = 'from-blue-500 to-purple-600',
  trend,
}) => {
  return (
    <Card className='text-center group'>
      <div
        className={`w-12 h-12 bg-gradient-to-r ${gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}
      >
        {typeof icon === 'string' ? <span className='text-2xl'>{icon}</span> : icon}
      </div>

      <div className='text-3xl font-black text-white mb-2'>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>

      <h3 className='text-white font-semibold mb-1'>{title}</h3>

      {description && <p className='text-gray-400 text-sm'>{description}</p>}

      {trend && (
        <div className={`mt-2 text-xs ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
          <span>{trend.isPositive ? '↗️' : '↘️'}</span>
          <span className='ml-1'>{Math.abs(trend.value).toFixed(1)}%</span>
        </div>
      )}
    </Card>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode | string;
  title: string;
  description: string;
  gradient?: string;
  link?: string;
  onClick?: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  gradient = 'from-blue-500 to-purple-600',
  link,
  onClick,
}) => {
  const CardWrapper = link ? 'a' : 'div';
  const extraProps = link
    ? { href: link }
    : onClick
      ? { onClick, role: 'button', tabIndex: 0 }
      : {};

  return (
    <CardWrapper {...extraProps} className={onClick ? 'cursor-pointer' : ''}>
      <Card className='h-full group'>
        <div
          className={`w-16 h-16 bg-gradient-to-r ${gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
        >
          {typeof icon === 'string' ? <span className='text-3xl'>{icon}</span> : icon}
        </div>

        <h3 className='text-xl font-bold text-white mb-4 group-hover:text-blue-300 transition-colors'>
          {title}
        </h3>

        <p className='text-gray-300 leading-relaxed'>{description}</p>
      </Card>
    </CardWrapper>
  );
};

interface ActionCardProps {
  icon: React.ReactNode | string;
  title: string;
  description: string;
  buttonText: string;
  gradient?: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
}

const ActionCard: React.FC<ActionCardProps> = ({
  icon,
  title,
  description,
  buttonText,
  gradient = 'from-blue-500 to-purple-600',
  onClick,
  href,
  disabled = false,
}) => {
  const ButtonComponent = href ? 'a' : 'button';
  const buttonProps = href ? { href } : { onClick, disabled };

  return (
    <Card className='h-full'>
      <div
        className={`w-12 h-12 bg-gradient-to-r ${gradient} rounded-2xl flex items-center justify-center mb-4`}
      >
        {typeof icon === 'string' ? <span className='text-2xl'>{icon}</span> : icon}
      </div>

      <h3 className='text-lg font-bold text-white mb-2'>{title}</h3>
      <p className='text-gray-300 text-sm mb-6'>{description}</p>

      <ButtonComponent
        {...buttonProps}
        className={`w-full py-2 px-4 bg-gradient-to-r ${gradient} text-white rounded-xl hover:opacity-90 transition-all font-medium ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
        }`}
      >
        {buttonText}
      </ButtonComponent>
    </Card>
  );
};

// ✅ FIXED: Export all components including shadcn/ui compatible ones
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  StatCard,
  FeatureCard,
  ActionCard,
};
export default Card;
