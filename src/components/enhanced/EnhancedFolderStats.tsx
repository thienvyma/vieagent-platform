/**
 * 🚀 Enhanced Folder Statistics Component - Phase 2 Day 5 Step 5.5.4
 * Advanced statistics display for folder structure analysis
 * Real-time analytics and performance metrics
 */

'use client';

import React, { useMemo } from 'react';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Layers,
  FileText,
  FolderOpen,
  HardDrive,
  Clock,
  Target,
  Award,
} from 'lucide-react';

// Enhanced statistics interface
interface FolderStatistics {
  totalFiles: number;
  totalFolders: number;
  totalSize: number;
  maxDepth: number;
  filesByType: Record<string, number>;
  conversationFiles: number;
  enhancedDocuments: number;
  averageFileSize: number;
  largestFiles: Array<{ name: string; size: number; type: string }>;
  deepestFolders: Array<{ path: string; depth: number; fileCount: number }>;
  processingTime: number;
  validationScore: number;
}

interface EnhancedFolderStatsProps {
  statistics: FolderStatistics;
  className?: string;
  showDetailedBreakdown?: boolean;
  showPerformanceMetrics?: boolean;
  showRecommendations?: boolean;
}

export function EnhancedFolderStats({
  statistics,
  className = '',
  showDetailedBreakdown = true,
  showPerformanceMetrics = true,
  showRecommendations = true,
}: EnhancedFolderStatsProps) {
  // Enhanced metrics calculation
  const enhancedMetrics = useMemo(() => {
    const fileTypeDistribution = Object.entries(statistics.filesByType)
      .map(([type, count]) => ({
        type,
        count,
        percentage: statistics.totalFiles > 0 ? (count / statistics.totalFiles) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const efficiency = {
      folderToFileRatio:
        statistics.totalFolders > 0 ? statistics.totalFiles / statistics.totalFolders : 0,
      averageDepth: statistics.maxDepth > 0 ? statistics.maxDepth / 2 : 0,
      sizeEfficiency:
        statistics.averageFileSize > 0
          ? statistics.totalSize / statistics.totalFiles / statistics.averageFileSize
          : 1,
      organizationScore: Math.min(
        100,
        Math.max(0, 100 - statistics.maxDepth * 10 + fileTypeDistribution.length * 5)
      ),
    };

    const recommendations = [];
    if (statistics.maxDepth > 6) {
      recommendations.push('Consider flattening deeply nested folders');
    }
    if (efficiency.folderToFileRatio < 2) {
      recommendations.push('Too many folders relative to files - consolidate where possible');
    }
    if (statistics.averageFileSize > 10 * 1024 * 1024) {
      recommendations.push('Large average file size detected - consider compression');
    }

    return {
      fileTypeDistribution,
      efficiency,
      recommendations,
      performanceGrade:
        efficiency.organizationScore > 80
          ? 'A'
          : efficiency.organizationScore > 60
            ? 'B'
            : efficiency.organizationScore > 40
              ? 'C'
              : 'D',
    };
  }, [statistics]);

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Format processing time
  const formatProcessingTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div
      className={`enhanced-folder-stats bg-gray-900 rounded-lg border border-gray-800 p-6 ${className}`}
    >
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <h3 className='text-lg font-semibold text-gray-200 flex items-center'>
          <BarChart3 size={20} className='mr-2 text-blue-400' />
          Folder Analysis
        </h3>
        <div className='flex items-center space-x-2'>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              enhancedMetrics.performanceGrade === 'A'
                ? 'bg-green-600/20 text-green-300'
                : enhancedMetrics.performanceGrade === 'B'
                  ? 'bg-blue-600/20 text-blue-300'
                  : enhancedMetrics.performanceGrade === 'C'
                    ? 'bg-yellow-600/20 text-yellow-300'
                    : 'bg-red-600/20 text-red-300'
            }`}
          >
            Grade: {enhancedMetrics.performanceGrade}
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6'>
        <div className='bg-gray-800/50 rounded-lg p-4 text-center'>
          <FileText size={24} className='mx-auto mb-2 text-blue-400' />
          <div className='text-2xl font-bold text-blue-400'>{statistics.totalFiles}</div>
          <div className='text-xs text-gray-400'>Total Files</div>
        </div>

        <div className='bg-gray-800/50 rounded-lg p-4 text-center'>
          <FolderOpen size={24} className='mx-auto mb-2 text-yellow-400' />
          <div className='text-2xl font-bold text-yellow-400'>{statistics.totalFolders}</div>
          <div className='text-xs text-gray-400'>Folders</div>
        </div>

        <div className='bg-gray-800/50 rounded-lg p-4 text-center'>
          <HardDrive size={24} className='mx-auto mb-2 text-green-400' />
          <div className='text-2xl font-bold text-green-400'>
            {formatFileSize(statistics.totalSize)}
          </div>
          <div className='text-xs text-gray-400'>Total Size</div>
        </div>

        <div className='bg-gray-800/50 rounded-lg p-4 text-center'>
          <Layers size={24} className='mx-auto mb-2 text-purple-400' />
          <div className='text-2xl font-bold text-purple-400'>{statistics.maxDepth}</div>
          <div className='text-xs text-gray-400'>Max Depth</div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      {showDetailedBreakdown && (
        <div className='mb-6'>
          <h4 className='text-md font-medium text-gray-200 mb-3 flex items-center'>
            <PieChart size={16} className='mr-2 text-cyan-400' />
            File Type Distribution
          </h4>
          <div className='space-y-2'>
            {enhancedMetrics.fileTypeDistribution.slice(0, 6).map((item, index) => (
              <div
                key={item.type}
                className='flex items-center justify-between p-2 bg-gray-800/30 rounded'
              >
                <div className='flex items-center'>
                  <div
                    className={`w-3 h-3 rounded mr-3 ${
                      index === 0
                        ? 'bg-blue-500'
                        : index === 1
                          ? 'bg-green-500'
                          : index === 2
                            ? 'bg-yellow-500'
                            : index === 3
                              ? 'bg-purple-500'
                              : index === 4
                                ? 'bg-pink-500'
                                : 'bg-cyan-500'
                    }`}
                  />
                  <span className='text-sm text-gray-300'>
                    {item.type.toUpperCase() || 'Other'}
                  </span>
                </div>
                <div className='flex items-center space-x-3'>
                  <span className='text-sm text-gray-400'>{item.count} files</span>
                  <span className='text-sm font-medium text-gray-200'>
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      {showPerformanceMetrics && (
        <div className='mb-6'>
          <h4 className='text-md font-medium text-gray-200 mb-3 flex items-center'>
            <TrendingUp size={16} className='mr-2 text-green-400' />
            Performance Metrics
          </h4>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div className='bg-gray-800/30 rounded-lg p-3'>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-sm text-gray-400'>Organization Score</span>
                <span className='text-sm font-medium text-gray-200'>
                  {enhancedMetrics.efficiency.organizationScore.toFixed(0)}/100
                </span>
              </div>
              <div className='w-full bg-gray-700 rounded-full h-2'>
                <div
                  className={`h-2 rounded-full ${
                    enhancedMetrics.efficiency.organizationScore > 80
                      ? 'bg-green-500'
                      : enhancedMetrics.efficiency.organizationScore > 60
                        ? 'bg-blue-500'
                        : enhancedMetrics.efficiency.organizationScore > 40
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                  }`}
                  style={{ width: `${enhancedMetrics.efficiency.organizationScore}%` }}
                />
              </div>
            </div>

            <div className='bg-gray-800/30 rounded-lg p-3'>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-sm text-gray-400'>Processing Time</span>
                <span className='text-sm font-medium text-gray-200'>
                  {formatProcessingTime(statistics.processingTime)}
                </span>
              </div>
              <div className='flex items-center'>
                <Clock size={16} className='mr-2 text-blue-400' />
                <span className='text-xs text-gray-400'>
                  {statistics.processingTime < 1000
                    ? 'Excellent'
                    : statistics.processingTime < 3000
                      ? 'Good'
                      : 'Slow'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Quality Indicators */}
      <div className='mb-6'>
        <h4 className='text-md font-medium text-gray-200 mb-3 flex items-center'>
          <Target size={16} className='mr-2 text-orange-400' />
          Data Quality
        </h4>
        <div className='grid grid-cols-2 gap-4'>
          <div className='text-center p-3 bg-gray-800/30 rounded-lg'>
            <div className='text-lg font-semibold text-cyan-400'>
              {statistics.conversationFiles}
            </div>
            <div className='text-xs text-gray-400'>Conversation Files</div>
            <div className='text-xs text-cyan-300'>
              {statistics.totalFiles > 0
                ? ((statistics.conversationFiles / statistics.totalFiles) * 100).toFixed(1)
                : 0}
              %
            </div>
          </div>

          <div className='text-center p-3 bg-gray-800/30 rounded-lg'>
            <div className='text-lg font-semibold text-pink-400'>
              {statistics.enhancedDocuments}
            </div>
            <div className='text-xs text-gray-400'>Enhanced Documents</div>
            <div className='text-xs text-pink-300'>
              {statistics.totalFiles > 0
                ? ((statistics.enhancedDocuments / statistics.totalFiles) * 100).toFixed(1)
                : 0}
              %
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {showRecommendations && enhancedMetrics.recommendations.length > 0 && (
        <div>
          <h4 className='text-md font-medium text-gray-200 mb-3 flex items-center'>
            <Award size={16} className='mr-2 text-yellow-400' />
            Recommendations
          </h4>
          <div className='space-y-2'>
            {enhancedMetrics.recommendations.map((recommendation, index) => (
              <div
                key={index}
                className='flex items-start p-3 bg-yellow-900/20 border border-yellow-800/30 rounded-lg'
              >
                <div className='flex-shrink-0 w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3' />
                <span className='text-sm text-yellow-200'>{recommendation}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default EnhancedFolderStats;
