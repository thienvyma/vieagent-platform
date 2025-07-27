/**
 * Performance Chart Component for VIEAgent Monitoring Dashboard
 * Real-time performance visualization with CPU, Memory, Response Times
 */

import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, Activity, Zap } from 'lucide-react';

interface MetricDataPoint {
  timestamp: string;
  value: number;
}

interface PerformanceChartProps {
  title: string;
  data: MetricDataPoint[];
  unit?: string;
  type: 'line' | 'bar' | 'area';
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  threshold?: number;
  height?: number;
  showTrend?: boolean;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({
  title,
  data,
  unit = '%',
  type = 'line',
  color = 'blue',
  threshold,
  height = 200,
  showTrend = true,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<MetricDataPoint | null>(null);

  // Calculate chart dimensions
  const chartWidth = 400;
  const chartHeight = height;
  const padding = 20;
  const drawWidth = chartWidth - padding * 2;
  const drawHeight = chartHeight - padding * 2;

  // Process data
  const sortedData = useMemo(() => {
    return data
      .slice(-20)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [data]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (sortedData.length === 0) return { current: 0, min: 0, max: 0, avg: 0, trend: 0 };

    const values = sortedData.map(d => d.value);
    const current = values[values.length - 1];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;

    // Calculate trend (simple slope)
    const trend = values.length > 1 ? values[values.length - 1] - values[values.length - 2] : 0;

    return { current, min, max, avg, trend };
  }, [sortedData]);

  // Create SVG path
  const createPath = useMemo(() => {
    if (sortedData.length < 2) return '';

    const xStep = drawWidth / (sortedData.length - 1);
    const yRange = stats.max - stats.min || 1;

    return sortedData
      .map((point, index) => {
        const x = padding + index * xStep;
        const y = padding + drawHeight - ((point.value - stats.min) / yRange) * drawHeight;
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }, [sortedData, stats, drawWidth, drawHeight, padding]);

  // Color mappings
  const colorClasses = {
    blue: {
      bg: 'from-blue-500/20 to-cyan-500/20',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      stroke: 'stroke-blue-400',
      fill: 'fill-blue-400/20',
    },
    green: {
      bg: 'from-green-500/20 to-emerald-500/20',
      border: 'border-green-500/30',
      text: 'text-green-400',
      stroke: 'stroke-green-400',
      fill: 'fill-green-400/20',
    },
    red: {
      bg: 'from-red-500/20 to-pink-500/20',
      border: 'border-red-500/30',
      text: 'text-red-400',
      stroke: 'stroke-red-400',
      fill: 'fill-red-400/20',
    },
    yellow: {
      bg: 'from-yellow-500/20 to-orange-500/20',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
      stroke: 'stroke-yellow-400',
      fill: 'fill-yellow-400/20',
    },
    purple: {
      bg: 'from-purple-500/20 to-indigo-500/20',
      border: 'border-purple-500/30',
      text: 'text-purple-400',
      stroke: 'stroke-purple-400',
      fill: 'fill-purple-400/20',
    },
  };

  const colorClass = colorClasses[color];

  // Format value for display
  const formatValue = (value: number) => {
    if (unit === 'ms') return `${value.toFixed(0)}ms`;
    if (unit === 'MB') return `${(value / 1024 / 1024).toFixed(1)}MB`;
    if (unit === 'GB') return `${(value / 1024 / 1024 / 1024).toFixed(2)}GB`;
    return `${value.toFixed(1)}${unit}`;
  };

  // Get trend indicator
  const getTrendIndicator = () => {
    if (!showTrend) return null;

    const isPositive = stats.trend > 0;
    const isNegative = stats.trend < 0;

    if (Math.abs(stats.trend) < 0.1) {
      return <span className='text-gray-400 text-sm'>→ Stable</span>;
    }

    return (
      <span
        className={`text-sm flex items-center space-x-1 ${isPositive ? 'text-red-400' : 'text-green-400'}`}
      >
        {isPositive ? <TrendingUp className='h-3 w-3' /> : <TrendingDown className='h-3 w-3' />}
        <span>
          {Math.abs(stats.trend).toFixed(1)}
          {unit}
        </span>
      </span>
    );
  };

  return (
    <div
      className={`bg-gradient-to-br ${colorClass.bg} border ${colorClass.border} rounded-2xl p-4 hover:border-opacity-50 transition-all duration-300`}
    >
      {/* Header */}
      <div className='flex items-center justify-between mb-4'>
        <div>
          <h3 className='text-white font-semibold text-sm'>{title}</h3>
          <div className='flex items-center space-x-2 mt-1'>
            <span className={`text-2xl font-bold ${colorClass.text}`}>
              {formatValue(stats.current)}
            </span>
            {getTrendIndicator()}
          </div>
        </div>
        <div className='text-right text-xs text-gray-400'>
          <div>Min: {formatValue(stats.min)}</div>
          <div>Max: {formatValue(stats.max)}</div>
          <div>Avg: {formatValue(stats.avg)}</div>
        </div>
      </div>

      {/* Chart */}
      <div className='relative'>
        <svg width={chartWidth} height={chartHeight} className='overflow-visible'>
          {/* Background grid */}
          <defs>
            <pattern id={`grid-${color}`} width='40' height='20' patternUnits='userSpaceOnUse'>
              <path
                d='M 40 0 L 0 0 0 20'
                fill='none'
                stroke='rgba(255,255,255,0.1)'
                strokeWidth='1'
              />
            </pattern>
          </defs>
          <rect width={chartWidth} height={chartHeight} fill={`url(#grid-${color})`} />

          {/* Threshold line */}
          {threshold && (
            <line
              x1={padding}
              y1={
                padding +
                drawHeight -
                ((threshold - stats.min) / (stats.max - stats.min || 1)) * drawHeight
              }
              x2={padding + drawWidth}
              y2={
                padding +
                drawHeight -
                ((threshold - stats.min) / (stats.max - stats.min || 1)) * drawHeight
              }
              stroke='red'
              strokeWidth='2'
              strokeDasharray='5,5'
              opacity='0.7'
            />
          )}

          {/* Chart path */}
          {sortedData.length > 1 && (
            <>
              {/* Area fill for area type */}
              {type === 'area' && (
                <path
                  d={`${createPath} L ${padding + drawWidth} ${padding + drawHeight} L ${padding} ${padding + drawHeight} Z`}
                  className={colorClass.fill}
                  stroke='none'
                />
              )}

              {/* Main line */}
              <path
                d={createPath}
                fill='none'
                className={colorClass.stroke}
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />

              {/* Data points */}
              {sortedData.map((point, index) => {
                const x = padding + index * (drawWidth / (sortedData.length - 1));
                const y =
                  padding +
                  drawHeight -
                  ((point.value - stats.min) / (stats.max - stats.min || 1)) * drawHeight;

                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r='3'
                    className={`${colorClass.fill} ${colorClass.stroke}`}
                    strokeWidth='2'
                    onMouseEnter={() => setHoveredPoint(point)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    style={{ cursor: 'pointer' }}
                  />
                );
              })}
            </>
          )}
        </svg>

        {/* Tooltip */}
        {hoveredPoint && (
          <div className='absolute top-0 left-1/2 transform -translate-x-1/2 bg-gray-900 border border-gray-700 rounded-lg p-2 text-xs text-white shadow-lg z-10'>
            <div>{formatValue(hoveredPoint.value)}</div>
            <div className='text-gray-400'>
              {new Date(hoveredPoint.timestamp).toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>

      {/* Status indicator */}
      <div className='flex items-center justify-between mt-3 pt-3 border-t border-white/10'>
        <div className='flex items-center space-x-2'>
          <div
            className={`w-2 h-2 rounded-full ${stats.current > (threshold || 80) ? 'bg-red-400 animate-pulse' : 'bg-green-400'}`}
          ></div>
          <span className='text-xs text-gray-400'>
            {stats.current > (threshold || 80) ? 'High Usage' : 'Normal'}
          </span>
        </div>
        <div className='text-xs text-gray-400'>{sortedData.length} data points</div>
      </div>
    </div>
  );
};

export default PerformanceChart;
