// src/components/admin/AutoCleanupWidget.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import {
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Zap,
  Files,
  Database,
} from 'lucide-react';

interface CleanupOperation {
  type: string;
  timestamp: string;
  duration: number;
  filesProcessed: number;
  spaceReclaimed: number;
  success: boolean;
}

interface CleanupConfig {
  targets: {
    tempFiles: {
      maxAge: string;
      locations: string[];
      patterns: string[];
    };
    logFiles: {
      maxAge: string;
      compressionEnabled: boolean;
      retentionDays: number;
    };
    cacheFiles: {
      maxAge: string;
      location: string;
    };
  };
  scheduling: {
    automaticCleanup: boolean;
    scheduledTimes: string[];
    emergencyCleanup: boolean;
    safetyChecks: boolean;
  };
}

interface CleanupData {
  success: boolean;
  status: string;
  config: CleanupConfig;
  recentOperations: CleanupOperation[];
  lastOperation: CleanupOperation | null;
}

export default function AutoCleanupWidget() {
  const [data, setData] = useState<CleanupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchCleanupData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/auto-cleanup');
      const result = await response.json();

      if (result.success) {
        setData(result);
        setError(null);
        setLastUpdated(new Date());
      } else {
        setError(result.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cleanup data');
    } finally {
      setLoading(false);
    }
  };

  const performCleanup = async (type: 'manual' | 'emergency' = 'manual') => {
    try {
      setCleaning(true);
      const response = await fetch('/api/admin/auto-cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: type === 'emergency' ? 'test-emergency' : 'cleanup',
          type: type,
        }),
      });

      const result = await response.json();
      if (result.success) {
        // Refresh data after cleanup
        await fetchCleanupData();
      } else {
        setError(result.error || 'Cleanup failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to perform cleanup');
    } finally {
      setCleaning(false);
    }
  };

  useEffect(() => {
    fetchCleanupData();

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchCleanupData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className='w-full'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Trash2 className='h-5 w-5' />
            Auto-Cleanup System
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
            Auto-Cleanup Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-red-600 mb-3'>{error}</p>
          <Button onClick={fetchCleanupData} variant='outline' size='sm'>
            <RefreshCw className='h-4 w-4 mr-2' />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { config, lastOperation, status } = data;

  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Trash2 className='h-5 w-5' />
            Auto-Cleanup System
          </div>
          <div className='flex items-center gap-2'>
            <Badge variant='default' className='bg-green-100 text-green-800 border-green-200'>
              {status}
            </Badge>
            <Button onClick={fetchCleanupData} variant='ghost' size='sm'>
              <RefreshCw className='h-4 w-4' />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Cleanup Configuration */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
          <div className='space-y-2'>
            <div className='flex items-center gap-2 text-gray-600'>
              <Files className='h-4 w-4' />
              <span className='font-medium'>Temp Files</span>
            </div>
            <div className='text-xs text-gray-500'>Max Age: {config.targets.tempFiles.maxAge}</div>
            <div className='text-xs text-gray-500'>
              Locations: {config.targets.tempFiles.locations.length} folders
            </div>
          </div>

          <div className='space-y-2'>
            <div className='flex items-center gap-2 text-gray-600'>
              <Database className='h-4 w-4' />
              <span className='font-medium'>Log Files</span>
            </div>
            <div className='text-xs text-gray-500'>Max Age: {config.targets.logFiles.maxAge}</div>
            <div className='text-xs text-gray-500'>
              Compression: {config.targets.logFiles.compressionEnabled ? 'Enabled' : 'Disabled'}
            </div>
          </div>

          <div className='space-y-2'>
            <div className='flex items-center gap-2 text-gray-600'>
              <Clock className='h-4 w-4' />
              <span className='font-medium'>Scheduling</span>
            </div>
            <div className='text-xs text-gray-500'>
              Auto: {config.scheduling.automaticCleanup ? 'Enabled' : 'Disabled'}
            </div>
            <div className='text-xs text-gray-500'>
              Times: {config.scheduling.scheduledTimes.join(', ')}
            </div>
          </div>
        </div>

        {/* Last Operation */}
        {lastOperation && (
          <div className='p-3 rounded-lg bg-gray-50 space-y-2'>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium'>Last Cleanup Operation</span>
              <Badge
                variant={lastOperation.success ? 'default' : 'destructive'}
                className={
                  lastOperation.success
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : 'bg-red-100 text-red-800 border-red-200'
                }
              >
                {lastOperation.success ? 'Success' : 'Failed'}
              </Badge>
            </div>

            <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-xs'>
              <div>
                <div className='text-gray-500'>Type</div>
                <div className='font-medium capitalize'>{lastOperation.type}</div>
              </div>
              <div>
                <div className='text-gray-500'>Files Processed</div>
                <div className='font-medium'>{lastOperation.filesProcessed}</div>
              </div>
              <div>
                <div className='text-gray-500'>Space Reclaimed</div>
                <div className='font-medium'>
                  {(lastOperation.spaceReclaimed / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
              <div>
                <div className='text-gray-500'>Duration</div>
                <div className='font-medium'>{lastOperation.duration}ms</div>
              </div>
            </div>

            <div className='text-xs text-gray-500'>
              {new Date(lastOperation.timestamp).toLocaleString()}
            </div>
          </div>
        )}

        {/* Safety Features */}
        <div className='flex items-center gap-2 p-2 rounded-lg bg-blue-50 text-blue-700 text-sm'>
          <CheckCircle className='h-4 w-4' />
          <span>Safety checks enabled - Files in use are protected</span>
        </div>

        {/* Action Buttons */}
        <div className='flex gap-2'>
          <Button
            onClick={() => performCleanup('manual')}
            disabled={cleaning}
            variant='outline'
            size='sm'
            className='flex-1'
          >
            {cleaning ? (
              <>
                <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
                Cleaning...
              </>
            ) : (
              <>
                <Trash2 className='h-4 w-4 mr-2' />
                Manual Cleanup
              </>
            )}
          </Button>

          <Button
            onClick={() => performCleanup('emergency')}
            disabled={cleaning}
            variant='outline'
            size='sm'
            className='flex-1 border-orange-200 text-orange-700 hover:bg-orange-50'
          >
            <Zap className='h-4 w-4 mr-2' />
            Emergency
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
