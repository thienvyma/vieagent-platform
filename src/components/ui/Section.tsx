import React from 'react';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  containerSize?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: 'sm' | 'md' | 'lg' | 'xl' | 'none';
  background?: 'transparent' | 'dark' | 'card' | 'gradient';
  centered?: boolean;
}

const Section: React.FC<SectionProps> = ({
  children,
  className = '',
  containerSize = 'lg',
  padding = 'lg',
  background = 'transparent',
  centered = false,
}) => {
  const containerClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-7xl',
    xl: 'max-w-8xl',
    full: 'max-w-full',
  };

  const paddingClasses = {
    none: '',
    sm: 'py-8 px-4',
    md: 'py-12 px-4',
    lg: 'py-20 px-4',
    xl: 'py-32 px-4',
  };

  const backgroundClasses = {
    transparent: '',
    dark: 'bg-gray-900/30',
    card: 'bg-white/5 backdrop-blur-sm border border-gray-700 rounded-3xl',
    gradient: 'bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10',
  };

  const centerClasses = centered ? 'text-center' : '';

  return (
    <section
      className={`relative ${paddingClasses[padding]} ${backgroundClasses[background]} ${className}`}
    >
      <div className={`${containerClasses[containerSize]} mx-auto relative z-10 ${centerClasses}`}>
        {children}
      </div>
    </section>
  );
};

interface SectionHeaderProps {
  title: string;
  description?: string;
  badge?: {
    text: string;
    gradient?: string;
    icon?: string;
  };
  centered?: boolean;
  className?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  badge,
  centered = true,
  className = '',
}) => {
  const alignmentClasses = centered ? 'text-center' : '';
  const containerClasses = centered ? 'max-w-4xl mx-auto' : '';

  return (
    <div className={`${alignmentClasses} ${containerClasses} mb-16 ${className}`}>
      {badge && (
        <div className={`${centered ? '' : 'inline-block'} mb-8`}>
          <div
            className={`px-6 py-2 ${badge.gradient || 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30'} rounded-full backdrop-blur-sm ${centered ? 'inline-block' : ''}`}
          >
            <span className='text-blue-300 text-sm font-medium'>
              {badge.icon && <span className='mr-2'>{badge.icon}</span>}
              {badge.text}
            </span>
          </div>
        </div>
      )}

      <h2 className='text-4xl md:text-5xl font-black bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-6'>
        {title}
      </h2>

      {description && (
        <p className='text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed'>{description}</p>
      )}
    </div>
  );
};

interface GridSectionProps {
  children: React.ReactNode;
  columns?: {
    default: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const GridSection: React.FC<GridSectionProps> = ({
  children,
  columns = { default: 1, md: 2, lg: 3 },
  gap = 'lg',
  className = '',
}) => {
  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-12',
  };

  const getColumnClass = (breakpoint: keyof typeof columns, value: number) => {
    const prefix = breakpoint === 'default' ? '' : `${breakpoint}:`;
    return `${prefix}grid-cols-${value}`;
  };

  const gridClasses = [
    'grid',
    getColumnClass('default', columns.default),
    columns.md && getColumnClass('md', columns.md),
    columns.lg && getColumnClass('lg', columns.lg),
    columns.xl && getColumnClass('xl', columns.xl),
    gapClasses[gap],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={gridClasses}>{children}</div>;
};

interface FlexSectionProps {
  children: React.ReactNode;
  direction?: 'row' | 'col';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const FlexSection: React.FC<FlexSectionProps> = ({
  children,
  direction = 'row',
  align = 'start',
  justify = 'start',
  wrap = false,
  gap = 'md',
  className = '',
}) => {
  const directionClasses = {
    row: 'flex-row',
    col: 'flex-col',
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  };

  const gapClasses = {
    sm: direction === 'row' ? 'space-x-2' : 'space-y-2',
    md: direction === 'row' ? 'space-x-4' : 'space-y-4',
    lg: direction === 'row' ? 'space-x-6' : 'space-y-6',
    xl: direction === 'row' ? 'space-x-8' : 'space-y-8',
  };

  const flexClasses = [
    'flex',
    directionClasses[direction],
    alignClasses[align],
    justifyClasses[justify],
    wrap && 'flex-wrap',
    gapClasses[gap],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={flexClasses}>{children}</div>;
};

export default Section;
export { SectionHeader, GridSection, FlexSection };
