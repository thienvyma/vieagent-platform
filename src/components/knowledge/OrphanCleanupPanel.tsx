'use client';

/**
 * 🧹 Orphan Cleanup Panel - Day 2.4 UI Component
 * ===============================================
 * Maintenance dashboard panel for orphan data analysis and cleanup
 * Integrates with OrphanCleanupService và API endpoints
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, Clock, Database, HardDrive, Trash2, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

interface OrphanAnalysis {
  orphanedAssignments: number;
  staleProcessingHistory: number;
  oldAnalytics: number;
  recommendedActions: string[];
  estimatedStorageSavingsMB: number;
}

interface CleanupResult {
  assignmentsDeleted: number;
  historyRecordsDeleted: number;
  analyticsDeleted: number;
  storageReclaimedMB: number;
  executionTimeMs: number;
  success: boolean;
  message: string;
}

interface OrphanCleanupPanelProps {
  className?: string;
}

export default function OrphanCleanupPanel({ className }: OrphanCleanupPanelProps) {
  // State management
  const [analysis, setAnalysis] = useState<OrphanAnalysis | null>(null);
  const [lastCleanup, setLastCleanup] = useState<CleanupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [dryRun, setDryRun] = useState(true);

  // Cleanup options
  const [maxAgeProcessing, setMaxAgeProcessing] = useState(90);
  const [maxAgeAnalytics, setMaxAgeAnalytics] = useState(180);

  /**
   * 🔍 Run orphan analysis
   */
  const analyzeOrphans = async () => {
    setAnalyzing(true);
    try {
      const response = await fetch('/api/knowledge/orphan-cleanup?action=analyze');
      const result = await response.json();

      if (result.success) {
        setAnalysis(result.data.analysis);
        toast.success('Orphan analysis completed');
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      toast.error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAnalyzing(false);
    }
  };

  /**
   * 🧹 Execute orphan cleanup
   */
  const executeCleanup = async () => {
    setCleaning(true);
    try {
      const response = await fetch('/api/knowledge/orphan-cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cleanup',
          options: {
            maxAgeProcessingDays: maxAgeProcessing,
            maxAgeAnalyticsDays: maxAgeAnalytics,
            dryRun: dryRun,
            batchSize: 100,
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        setLastCleanup(result.data.result);
        if (dryRun) {
          toast.success('Dry run completed - no changes made');
        } else {
          toast.success(`Cleanup completed: ${result.data.result.storageReclaimedMB}MB reclaimed`);
        }
        // Refresh analysis after cleanup
        await analyzeOrphans();
      } else {
        throw new Error(result.error || 'Cleanup failed');
      }
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      toast.error(`Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCleaning(false);
    }
  };

  /**
   * 📊 Optimize storage
   */
  const optimizeStorage = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/knowledge/orphan-cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'optimize-storage',
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Storage optimized: ${result.data.result.savingsMB}MB reclaimed`);
        // Refresh analysis
        await analyzeOrphans();
      } else {
        throw new Error(result.error || 'Storage optimization failed');
      }
    } catch (error) {
      console.error('❌ Storage optimization failed:', error);
      toast.error(
        `Storage optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🚨 Emergency cleanup
   */
  const emergencyCleanup = async () => {
    if (!confirm('⚠️ Emergency cleanup will aggressively remove old data. Continue?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/knowledge/orphan-cleanup?emergency=true', {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Emergency cleanup completed');
        setLastCleanup(result.data.cleanup);
        await analyzeOrphans();
      } else {
        throw new Error(result.error || 'Emergency cleanup failed');
      }
    } catch (error) {
      console.error('❌ Emergency cleanup failed:', error);
      toast.error(
        `Emergency cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  };

  // Auto-analyze on component mount
  useEffect(() => {
    analyzeOrphans();
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Card */}
      <Card className='bg-gray-800/50 border-gray-700'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <HardDrive className='h-5 w-5 text-blue-400' />
            🧹 Orphan Cleanup & Maintenance
            <Badge variant='outline' className='ml-auto'>
              Day 2.4
            </Badge>
          </CardTitle>
          <CardDescription>
            Detect and clean up orphaned data to optimize storage and system performance
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Analysis Results */}
      <Card className='bg-gray-800/50 border-gray-700'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <AlertCircle className='h-5 w-5 text-yellow-400' />
            Orphan Data Analysis
            <Button
              onClick={analyzeOrphans}
              disabled={analyzing}
              size='sm'
              variant='outline'
              className='ml-auto'
            >
              {analyzing ? (
                <>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2'></div>
                  Analyzing...
                </>
              ) : (
                'Refresh Analysis'
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analysis ? (
            <div className='space-y-4'>
              {/* Statistics Grid */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='bg-gray-700/50 rounded-lg p-4'>
                  <div className='flex items-center gap-2 mb-2'>
                    <Database className='h-4 w-4 text-red-400' />
                    <span className='text-sm text-gray-300'>Orphaned Assignments</span>
                  </div>
                  <div className='text-2xl font-bold text-red-400'>
                    {analysis.orphanedAssignments}
                  </div>
                </div>

                <div className='bg-gray-700/50 rounded-lg p-4'>
                  <div className='flex items-center gap-2 mb-2'>
                    <Clock className='h-4 w-4 text-orange-400' />
                    <span className='text-sm text-gray-300'>Stale History</span>
                  </div>
                  <div className='text-2xl font-bold text-orange-400'>
                    {analysis.staleProcessingHistory}
                  </div>
                </div>

                <div className='bg-gray-700/50 rounded-lg p-4'>
                  <div className='flex items-center gap-2 mb-2'>
                    <HardDrive className='h-4 w-4 text-blue-400' />
                    <span className='text-sm text-gray-300'>Potential Savings</span>
                  </div>
                  <div className='text-2xl font-bold text-blue-400'>
                    {analysis.estimatedStorageSavingsMB}MB
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              {analysis.recommendedActions.length > 0 && (
                <div>
                  <h4 className='text-sm font-medium text-gray-300 mb-2'>Recommended Actions:</h4>
                  <ul className='space-y-1'>
                    {analysis.recommendedActions.map((action, index) => (
                      <li key={index} className='text-sm text-gray-400 flex items-center gap-2'>
                        <CheckCircle className='h-3 w-3 text-green-400' />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className='flex items-center justify-center py-8'>
              <div className='text-gray-400 text-center'>
                {analyzing ? (
                  <>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-2'></div>
                    Running analysis...
                  </>
                ) : (
                  'Click "Refresh Analysis" to scan for orphaned data'
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cleanup Configuration */}
      <Card className='bg-gray-800/50 border-gray-700'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Trash2 className='h-5 w-5 text-red-400' />
            Cleanup Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Dry Run Toggle */}
          <div className='flex items-center justify-between'>
            <Label htmlFor='dry-run' className='text-sm font-medium'>
              Dry Run Mode
              <span className='text-xs text-gray-400 block'>Preview changes without executing</span>
            </Label>
            <Switch id='dry-run' checked={dryRun} onCheckedChange={setDryRun} />
          </div>

          {/* Age Configuration */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <Label className='text-sm font-medium'>Processing History Age (days)</Label>
              <select
                value={maxAgeProcessing}
                onChange={e => setMaxAgeProcessing(Number(e.target.value))}
                className='w-full mt-1 bg-gray-700 border-gray-600 rounded-md px-3 py-2 text-sm'
              >
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days (recommended)</option>
                <option value={180}>180 days</option>
              </select>
            </div>

            <div>
              <Label className='text-sm font-medium'>Analytics Age (days)</Label>
              <select
                value={maxAgeAnalytics}
                onChange={e => setMaxAgeAnalytics(Number(e.target.value))}
                className='w-full mt-1 bg-gray-700 border-gray-600 rounded-md px-3 py-2 text-sm'
              >
                <option value={90}>90 days</option>
                <option value={180}>180 days (recommended)</option>
                <option value={365}>365 days</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card className='bg-gray-800/50 border-gray-700'>
        <CardContent className='pt-6'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <Button
              onClick={executeCleanup}
              disabled={cleaning || !analysis}
              className='bg-blue-600 hover:bg-blue-700'
            >
              {cleaning ? (
                <>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                  {dryRun ? 'Analyzing...' : 'Cleaning...'}
                </>
              ) : (
                <>
                  <Trash2 className='h-4 w-4 mr-2' />
                  {dryRun ? 'Preview Cleanup' : 'Execute Cleanup'}
                </>
              )}
            </Button>

            <Button onClick={optimizeStorage} disabled={loading} variant='outline'>
              {loading ? (
                <>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2'></div>
                  Optimizing...
                </>
              ) : (
                <>
                  <Database className='h-4 w-4 mr-2' />
                  Optimize Storage
                </>
              )}
            </Button>

            <Button onClick={emergencyCleanup} disabled={loading} variant='danger'>
              <Zap className='h-4 w-4 mr-2' />
              Emergency Cleanup
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Last Cleanup Results */}
      {lastCleanup && (
        <Card className='bg-gray-800/50 border-gray-700'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <CheckCircle className='h-5 w-5 text-green-400' />
              Last Cleanup Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
              <div>
                <span className='text-gray-400'>Assignments Deleted:</span>
                <div className='font-bold text-green-400'>{lastCleanup.assignmentsDeleted}</div>
              </div>
              <div>
                <span className='text-gray-400'>History Records:</span>
                <div className='font-bold text-green-400'>{lastCleanup.historyRecordsDeleted}</div>
              </div>
              <div>
                <span className='text-gray-400'>Storage Reclaimed:</span>
                <div className='font-bold text-green-400'>{lastCleanup.storageReclaimedMB}MB</div>
              </div>
              <div>
                <span className='text-gray-400'>Execution Time:</span>
                <div className='font-bold text-blue-400'>{lastCleanup.executionTimeMs}ms</div>
              </div>
            </div>

            {lastCleanup.message && (
              <div className='mt-4 p-3 bg-gray-700/50 rounded-lg'>
                <span className='text-sm text-gray-300'>{lastCleanup.message}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
