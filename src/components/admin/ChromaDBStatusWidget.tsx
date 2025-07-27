// src/components/admin/ChromaDBStatusWidget.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import {
  Database,
  AlertTriangle,
  CheckCircle,
  HardDrive,
  RefreshCw,
  Zap,
  FileText,
  Layers,
} from 'lucide-react';

interface StorageInfo {
  exists: boolean;
  dataPath: string;
  database: {
    exists: boolean;
    size: number;
    sizeFormatted: string;
  };
  vectors: {
    collections: number;
    files: number;
    size: number;
    sizeFormatted: string;
  };
  totalFiles: number;
  status: string;
}

interface Recommendation {
  type: 'success' | 'info' | 'warning' | 'critical';
  message: string;
}

interface ChromaDBData {
  success: boolean;
  status: string;
  mode: string;
  storage: StorageInfo;
  recommendations: Recommendation[];
  timestamp: string;
}

export default function ChromaDBStatusWidget() {
  const [data, setData] = useState<ChromaDBData | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchChromatDBData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/chromadb-status');
      const result = await response.json();

      if (result.success) {
        setData(result);
        setError(null);
        setLastUpdated(new Date());
      } else {
        setError(result.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch ChromaDB data');
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      setTesting(true);
      const response = await fetch('/api/admin/chromadb-status?action=test-connection');
      const result = await response.json();

      if (result.success && result.connectionTest?.success) {
        // Refresh data after successful test
        await fetchChromatDBData();
      } else {
        setError(result.connectionTest?.error || 'Connection test failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to test connection');
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    fetchChromatDBData();

    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchChromatDBData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string, exists: boolean) => {
    if (!exists) return <AlertTriangle className='h-5 w-5 text-red-500' />;
    if (status === 'operational') return <CheckCircle className='h-5 w-5 text-green-500' />;
    return <Database className='h-5 w-5 text-gray-500' />;
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className='h-4 w-4 text-green-500' />;
      case 'info':
        return <Database className='h-4 w-4 text-blue-500' />;
      case 'warning':
        return <AlertTriangle className='h-4 w-4 text-yellow-500' />;
      case 'critical':
        return <AlertTriangle className='h-4 w-4 text-red-500' />;
      default:
        return <Database className='h-4 w-4 text-gray-500' />;
    }
  };

  if (loading) {
    return (
      <Card className='w-full'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Database className='h-5 w-5' />
            ChromaDB Vector Database
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='animate-pulse'>
            <div className='h-4 bg-gray-300 rounded w-3/4 mb-2'></div>
            <div className='h-4 bg-gray-300 rounded w-1/2'></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className='w-full border-red-200 bg-red-50'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-red-700'>
            <AlertTriangle className='h-5 w-5' />
            ChromaDB Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-red-600 mb-3'>{error}</p>
          <Button onClick={fetchChromatDBData} variant='outline' size='sm'>
            <RefreshCw className='h-4 w-4 mr-2' />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { storage, recommendations, status, mode } = data;

  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Database className='h-5 w-5' />
            ChromaDB Vector Database
          </div>
          <div className='flex items-center gap-2'>
            <Badge
              variant='default'
              className={`${
                storage.exists
                  ? 'bg-green-100 text-green-800 border-green-200'
                  : 'bg-red-100 text-red-800 border-red-200'
              }`}
            >
              {mode} - {storage.status}
            </Badge>
            <Button onClick={fetchChromatDBData} variant='ghost' size='sm'>
              <RefreshCw className='h-4 w-4' />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Storage Overview */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
          <div className='space-y-2'>
            <div className='flex items-center gap-2 text-gray-600'>
              <HardDrive className='h-4 w-4' />
              <span className='font-medium'>Database</span>
            </div>
            <div className='text-xs text-gray-500'>
              Size: {storage.database?.sizeFormatted || '0 Bytes'}
            </div>
            <div className='text-xs text-gray-500'>
              Status: {storage.database?.exists ? 'Active' : 'Missing'}
            </div>
          </div>

          <div className='space-y-2'>
            <div className='flex items-center gap-2 text-gray-600'>
              <Layers className='h-4 w-4' />
              <span className='font-medium'>Collections</span>
            </div>
            <div className='text-xs text-gray-500'>Count: {storage.vectors?.collections || 0}</div>
            <div className='text-xs text-gray-500'>Files: {storage.vectors?.files || 0}</div>
          </div>

          <div className='space-y-2'>
            <div className='flex items-center gap-2 text-gray-600'>
              <FileText className='h-4 w-4' />
              <span className='font-medium'>Vector Storage</span>
            </div>
            <div className='text-xs text-gray-500'>
              Size: {storage.vectors?.sizeFormatted || '0 Bytes'}
            </div>
            <div className='text-xs text-gray-500'>Total Files: {storage.totalFiles || 0}</div>
          </div>
        </div>

        {/* Data Path */}
        <div className='p-3 rounded-lg bg-gray-50'>
          <div className='text-sm font-medium mb-1'>Data Path</div>
          <div className='text-xs text-gray-600 font-mono'>{storage.dataPath}</div>
        </div>

        {/* Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <div className='space-y-2'>
            <div className='text-sm font-medium'>Recommendations</div>
            {recommendations.map((rec, index) => (
              <div key={index} className='flex items-start gap-2 p-2 rounded-lg bg-gray-50'>
                {getRecommendationIcon(rec.type)}
                <span className='text-sm'>{rec.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Status Indicator */}
        <div className='flex items-center gap-2 p-3 rounded-lg bg-blue-50 text-blue-700'>
          {getStatusIcon(storage.status, storage.exists)}
          <span className='text-sm'>
            {storage.exists
              ? `Vector database operational in ${mode} mode`
              : 'Vector database not available'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className='flex gap-2'>
          <Button
            onClick={testConnection}
            disabled={testing}
            variant='outline'
            size='sm'
            className='flex-1'
          >
            {testing ? (
              <>
                <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
                Testing...
              </>
            ) : (
              <>
                <Zap className='h-4 w-4 mr-2' />
                Test Connection
              </>
            )}
          </Button>

          <Button onClick={fetchChromatDBData} variant='outline' size='sm' className='flex-1'>
            <RefreshCw className='h-4 w-4 mr-2' />
            Refresh Status
          </Button>
        </div>

        {/* Last Updated */}
        {lastUpdated && (
          <div className='text-xs text-gray-500 text-center pt-2 border-t'>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
