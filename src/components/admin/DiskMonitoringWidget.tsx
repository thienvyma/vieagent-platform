// src/components/admin/DiskMonitoringWidget.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertCircle, CheckCircle, HardDrive, RefreshCw } from 'lucide-react';

interface DiskInfo {
  currentUsage: number;
  totalCapacity: number;
  freeSpace: number;
  usagePercentage: number;
  platform: string;
}

interface AlertInfo {
  level: 'OK' | 'WARNING' | 'CRITICAL' | 'EMERGENCY' | 'DISK_FULL';
  color: string;
  message: string;
}

interface DiskMonitoringData {
  success: boolean;
  diskInfo: DiskInfo;
  alert: AlertInfo;
  timestamp: string;
  error?: string;
}

export default function DiskMonitoringWidget() {
  const [data, setData] = useState<DiskMonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDiskData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/disk-monitoring');
      const result = await response.json();

      if (result.success) {
        setData(result);
        setError(null);
        setLastUpdated(new Date());
      } else {
        setError(result.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch disk data');
    } finally {
      setLoading(false);
    }
  };

  const testAlertSystem = async () => {
    try {
      const response = await fetch('/api/admin/disk-monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test-alert' }),
      });

      const result = await response.json();
      if (result.success) {
        // Refresh data after testing
        fetchDiskData();
      }
    } catch (err) {
      console.error('Failed to test alert system:', err);
    }
  };

  useEffect(() => {
    fetchDiskData();

    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchDiskData, 60000);
    return () => clearInterval(interval);
  }, []);

  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'OK':
        return <CheckCircle className='h-5 w-5 text-green-500' />;
      case 'WARNING':
        return <AlertTriangle className='h-5 w-5 text-yellow-500' />;
      case 'CRITICAL':
      case 'EMERGENCY':
      case 'DISK_FULL':
        return <AlertCircle className='h-5 w-5 text-red-500' />;
      default:
        return <HardDrive className='h-5 w-5 text-gray-500' />;
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 95) return 'bg-red-500';
    if (percentage >= 90) return 'bg-orange-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <Card className='w-full'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <HardDrive className='h-5 w-5' />
            Disk Space Monitoring
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
            <AlertCircle className='h-5 w-5' />
            Disk Monitoring Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-red-600 mb-3'>{error}</p>
          <Button onClick={fetchDiskData} variant='outline' size='sm'>
            <RefreshCw className='h-4 w-4 mr-2' />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { diskInfo, alert } = data;

  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <HardDrive className='h-5 w-5' />
            Disk Space Monitoring
          </div>
          <div className='flex items-center gap-2'>
            <Badge
              variant={alert.level === 'OK' ? 'default' : 'destructive'}
              className={`${
                alert.level === 'OK'
                  ? 'bg-green-100 text-green-800 border-green-200'
                  : 'bg-red-100 text-red-800 border-red-200'
              }`}
            >
              {alert.level}
            </Badge>
            <Button onClick={fetchDiskData} variant='ghost' size='sm'>
              <RefreshCw className='h-4 w-4' />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Disk Usage Progress */}
        <div className='space-y-2'>
          <div className='flex justify-between text-sm'>
            <span>Disk Usage</span>
            <span className='font-medium'>{diskInfo.usagePercentage.toFixed(1)}%</span>
          </div>
          <div className='w-full bg-gray-200 rounded-full h-3'>
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                diskInfo.usagePercentage >= 95
                  ? 'bg-red-500'
                  : diskInfo.usagePercentage >= 90
                    ? 'bg-orange-500'
                    : diskInfo.usagePercentage >= 80
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(diskInfo.usagePercentage, 100)}%` }}
            />
          </div>
          <div className='flex justify-between text-xs text-gray-500'>
            <span>Used: {diskInfo.currentUsage.toFixed(1)} GB</span>
            <span>Free: {diskInfo.freeSpace.toFixed(1)} GB</span>
          </div>
        </div>

        {/* Alert Status */}
        <div className='flex items-center gap-2 p-3 rounded-lg bg-gray-50'>
          {getAlertIcon(alert.level)}
          <span className='text-sm font-medium'>{alert.message}</span>
        </div>

        {/* Disk Details */}
        <div className='grid grid-cols-2 gap-4 text-sm'>
          <div className='space-y-1'>
            <div className='text-gray-500'>Total Capacity</div>
            <div className='font-medium'>{diskInfo.totalCapacity.toFixed(1)} GB</div>
          </div>
          <div className='space-y-1'>
            <div className='text-gray-500'>Platform</div>
            <div className='font-medium'>{diskInfo.platform}</div>
          </div>
        </div>

        {/* Actions */}
        <div className='flex gap-2'>
          <Button onClick={testAlertSystem} variant='outline' size='sm' className='flex-1'>
            Test Alert System
          </Button>
          <Button onClick={fetchDiskData} variant='outline' size='sm' className='flex-1'>
            <RefreshCw className='h-4 w-4 mr-2' />
            Refresh
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
