import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  AlertCircle,
} from 'lucide-react';

// ===== TYPES =====
interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  metadata?: Record<string, any>;
}

interface ChartProps {
  data: ChartDataPoint[];
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area';
  title?: string;
  subtitle?: string;
  width?: number | string;
  height?: number | string;
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  className?: string;
  loading?: boolean;
  error?: string;
  formatValue?: (value: number) => string;
  formatLabel?: (label: string) => string;
}

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
    period?: string;
  };
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
  className?: string;
  loading?: boolean;
}

interface StatGridProps {
  stats: Array<{
    id: string;
    title: string;
    value: number | string;
    subtitle?: string;
    trend?: {
      value: number;
      direction: 'up' | 'down';
      period?: string;
    };
    icon?: React.ReactNode;
    color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
  }>;
  columns?: 2 | 3 | 4;
  loading?: boolean;
  className?: string;
}

// ===== DEFAULT COLORS =====
const DEFAULT_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // yellow
  '#EF4444', // red
  '#8B5CF6', // purple
  '#06B6D4', // cyan
  '#F97316', // orange
  '#84CC16', // lime
];

// ===== UTILITY FUNCTIONS =====
const formatDefaultValue = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

const getColorByIndex = (index: number, colors?: string[]): string => {
  const colorArray = colors || DEFAULT_COLORS;
  return colorArray[index % colorArray.length];
};

// ===== CHART COMPONENTS =====

// Simple Bar Chart Implementation (without external library)
const SimpleBarChart: React.FC<{
  data: ChartDataPoint[];
  height: number;
  colors?: string[];
  formatValue?: (value: number) => string;
}> = ({ data, height, colors, formatValue = formatDefaultValue }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const chartHeight = height - 60; // Leave space for labels

  return (
    <div className='w-full' style={{ height }}>
      <div className='flex items-end justify-between h-full px-4 pb-12'>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * chartHeight;
          const color = item.color || getColorByIndex(index, colors);

          return (
            <div key={item.label} className='flex flex-col items-center space-y-2 flex-1 mx-1'>
              <div className='text-xs text-gray-400 font-medium'>{formatValue(item.value)}</div>
              <div
                className='w-full rounded-t transition-all duration-300 hover:opacity-80'
                style={{
                  height: barHeight,
                  backgroundColor: color,
                  minHeight: '4px',
                }}
              />
              <div className='text-xs text-gray-500 text-center max-w-full truncate'>
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Simple Line Chart Implementation
const SimpleLineChart: React.FC<{
  data: ChartDataPoint[];
  height: number;
  colors?: string[];
  formatValue?: (value: number) => string;
}> = ({ data, height, colors, formatValue = formatDefaultValue }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue;
  const chartHeight = height - 60;
  const chartWidth = 300; // Fixed width for simplicity

  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * chartWidth;
    const y = chartHeight - ((item.value - minValue) / range) * chartHeight;
    return { x, y, ...item };
  });

  const pathData = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  const color = colors?.[0] || DEFAULT_COLORS[0];

  return (
    <div className='w-full' style={{ height }}>
      <div className='relative'>
        <svg width='100%' height={chartHeight + 40} className='overflow-visible'>
          {/* Grid lines */}
          <defs>
            <pattern id='grid' width='20' height='20' patternUnits='userSpaceOnUse'>
              <path
                d='M 20 0 L 0 0 0 20'
                fill='none'
                stroke='#374151'
                strokeWidth='0.5'
                opacity='0.3'
              />
            </pattern>
          </defs>
          <rect width='100%' height={chartHeight} fill='url(#grid)' />

          {/* Line */}
          <path
            d={pathData}
            fill='none'
            stroke={color}
            strokeWidth='2'
            className='drop-shadow-sm'
          />

          {/* Points */}
          {points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r='4'
              fill={color}
              className='hover:r-6 transition-all cursor-pointer'
            />
          ))}
        </svg>

        {/* Labels */}
        <div className='flex justify-between mt-2 px-2'>
          {data.map((item, index) => (
            <div key={index} className='text-xs text-gray-500 text-center'>
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Simple Pie Chart Implementation
const SimplePieChart: React.FC<{
  data: ChartDataPoint[];
  height: number;
  colors?: string[];
  formatValue?: (value: number) => string;
}> = ({ data, height, colors, formatValue = formatDefaultValue }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = Math.min(height, 200) / 2 - 20;
  const centerX = radius + 20;
  const centerY = radius + 20;

  let currentAngle = 0;
  const slices = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    const x1 = centerX + radius * Math.cos(startAngle);
    const y1 = centerY + radius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);

    const largeArcFlag = angle > Math.PI ? 1 : 0;

    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z',
    ].join(' ');

    currentAngle += angle;

    return {
      pathData,
      color: item.color || getColorByIndex(index, colors),
      item,
      percentage,
    };
  });

  return (
    <div className='flex items-center space-x-6'>
      <svg width={radius * 2 + 40} height={radius * 2 + 40}>
        {slices.map((slice, index) => (
          <path
            key={index}
            d={slice.pathData}
            fill={slice.color}
            className='hover:opacity-80 transition-opacity cursor-pointer'
          />
        ))}
      </svg>

      <div className='space-y-2'>
        {slices.map((slice, index) => (
          <div key={index} className='flex items-center space-x-2 text-sm'>
            <div className='w-3 h-3 rounded-full' style={{ backgroundColor: slice.color }} />
            <span className='text-gray-300'>{slice.item.label}</span>
            <span className='text-gray-500'>
              {formatValue(slice.item.value)} ({slice.percentage.toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ===== MAIN CHART COMPONENT =====
const Chart: React.FC<ChartProps> = ({
  data,
  type,
  title,
  subtitle,
  width = '100%',
  height = 300,
  colors,
  showLegend = true,
  showGrid = true,
  showTooltip = true,
  className = '',
  loading = false,
  error,
  formatValue = formatDefaultValue,
  formatLabel = label => label,
}) => {
  if (loading) {
    return (
      <div className={`bg-gray-800/50 rounded-xl border border-gray-700 p-6 ${className}`}>
        <div className='animate-pulse space-y-4'>
          {title && <div className='h-6 bg-gray-700 rounded w-1/3' />}
          <div className='h-48 bg-gray-700 rounded' />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-gray-800/50 rounded-xl border border-gray-700 p-6 ${className}`}>
        <div className='text-center space-y-3'>
          <AlertCircle className='w-12 h-12 text-red-400 mx-auto' />
          <h3 className='text-lg font-medium text-red-300'>Chart Error</h3>
          <p className='text-gray-400'>{error}</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={`bg-gray-800/50 rounded-xl border border-gray-700 p-6 ${className}`}>
        <div className='text-center space-y-3'>
          <BarChart3 className='w-12 h-12 text-gray-500 mx-auto' />
          <h3 className='text-lg font-medium text-gray-300'>No Data</h3>
          <p className='text-gray-500'>There is no data to display in this chart.</p>
        </div>
      </div>
    );
  }

  const processedData = data.map(item => ({
    ...item,
    label: formatLabel(item.label),
  }));

  const renderChart = () => {
    const chartHeight = typeof height === 'number' ? height : 300;

    switch (type) {
      case 'bar':
        return (
          <SimpleBarChart
            data={processedData}
            height={chartHeight}
            colors={colors}
            formatValue={formatValue}
          />
        );
      case 'line':
      case 'area':
        return (
          <SimpleLineChart
            data={processedData}
            height={chartHeight}
            colors={colors}
            formatValue={formatValue}
          />
        );
      case 'pie':
      case 'doughnut':
        return (
          <SimplePieChart
            data={processedData}
            height={chartHeight}
            colors={colors}
            formatValue={formatValue}
          />
        );
      default:
        return (
          <div className='text-center py-12'>
            <p className='text-gray-400'>Chart type "{type}" not implemented yet.</p>
            <p className='text-gray-500 text-sm mt-2'>
              This component is ready for integration with chart libraries like Chart.js or
              Recharts.
            </p>
          </div>
        );
    }
  };

  return (
    <div
      className={`bg-gray-800/50 rounded-xl border border-gray-700 p-6 ${className}`}
      style={{ width }}
    >
      {/* Header */}
      {(title || subtitle) && (
        <div className='mb-6'>
          {title && <h3 className='text-lg font-semibold text-white'>{title}</h3>}
          {subtitle && <p className='text-gray-400 text-sm mt-1'>{subtitle}</p>}
        </div>
      )}

      {/* Chart */}
      <div className='w-full'>{renderChart()}</div>
    </div>
  );
};

// ===== METRIC CARD COMPONENT =====
const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = 'blue',
  className = '',
  loading = false,
}) => {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    green: 'bg-green-500/20 text-green-300 border-green-500/30',
    red: 'bg-red-500/20 text-red-300 border-red-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    gray: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  };

  if (loading) {
    return (
      <div className={`bg-gray-800/50 rounded-xl border border-gray-700 p-6 ${className}`}>
        <div className='animate-pulse space-y-3'>
          <div className='h-4 bg-gray-700 rounded w-2/3' />
          <div className='h-8 bg-gray-700 rounded w-1/2' />
          <div className='h-3 bg-gray-700 rounded w-1/3' />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800/50 rounded-xl border border-gray-700 p-6 ${className}`}>
      <div className='flex items-start justify-between'>
        <div className='flex-1'>
          <p className='text-gray-400 text-sm font-medium'>{title}</p>
          <p className='text-2xl font-bold text-white mt-2'>{value}</p>
          {subtitle && <p className='text-gray-500 text-sm mt-1'>{subtitle}</p>}

          {trend && (
            <div className='flex items-center space-x-1 mt-3'>
              {trend.direction === 'up' ? (
                <TrendingUp className='w-4 h-4 text-green-400' />
              ) : (
                <TrendingDown className='w-4 h-4 text-red-400' />
              )}
              <span
                className={`text-sm font-medium ${
                  trend.direction === 'up' ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {trend.value}%
              </span>
              {trend.period && <span className='text-gray-500 text-sm'>{trend.period}</span>}
            </div>
          )}
        </div>

        {icon && <div className={`p-3 rounded-xl border ${colorClasses[color]}`}>{icon}</div>}
      </div>
    </div>
  );
};

// ===== STAT GRID COMPONENT =====
const StatGrid: React.FC<StatGridProps> = ({
  stats,
  columns = 3,
  loading = false,
  className = '',
}) => {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid gap-6 ${gridCols[columns]} ${className}`}>
      {stats.map(stat => (
        <MetricCard
          key={stat.id}
          title={stat.title}
          value={stat.value}
          subtitle={stat.subtitle}
          trend={stat.trend}
          icon={stat.icon}
          color={stat.color}
          loading={loading}
        />
      ))}
    </div>
  );
};

// ===== CHART PLACEHOLDER FOR EXTERNAL LIBRARIES =====
const ChartPlaceholder: React.FC<{
  type: string;
  title?: string;
  description?: string;
}> = ({ type, title, description }) => (
  <div className='bg-gray-800/50 rounded-xl border border-gray-700 p-8 text-center'>
    <div className='space-y-4'>
      <div className='w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center mx-auto'>
        <BarChart3 className='w-8 h-8 text-gray-400' />
      </div>
      <div>
        <h3 className='text-lg font-medium text-white'>{title || `${type} Chart`}</h3>
        <p className='text-gray-400 mt-2'>
          {description ||
            `This ${type} chart is ready for integration with your preferred chart library.`}
        </p>
      </div>
      <div className='text-sm text-gray-500'>
        <p>Recommended libraries:</p>
        <p>• Chart.js + react-chartjs-2</p>
        <p>• Recharts</p>
        <p>• Victory</p>
      </div>
    </div>
  </div>
);

export default Chart;
export { MetricCard, StatGrid, ChartPlaceholder };
export type { ChartProps, MetricCardProps, StatGridProps, ChartDataPoint };
