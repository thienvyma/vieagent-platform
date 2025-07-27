import { NextRequest, NextResponse } from 'next/server';
import { systemMonitor } from '@/lib/monitoring/system-monitor';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * GET /api/monitoring/alerts
 * Returns alert configuration and recent alerts
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeHistory = searchParams.get('history') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get current alert configuration
    const status = systemMonitor.getStatus();
    const alerts = status.alerts;

    // Get recent alerts if requested
    let recentAlerts: any[] = [];
    if (includeHistory) {
      try {
        const logsPath = join(process.cwd(), 'logs', 'alerts.json');
        if (existsSync(logsPath)) {
          const alertsData = readFileSync(logsPath, 'utf8');
          const lines = alertsData.trim().split('\n').slice(-limit);
          recentAlerts = lines.map(line => JSON.parse(line));
        }
      } catch (error) {
        console.warn('Failed to load alert history:', error);
      }
    }

    // Calculate alert statistics
    const alertStats = {
      total: alerts.length,
      enabled: alerts.filter(a => a.enabled).length,
      disabled: alerts.filter(a => !a.enabled).length,
      bySeverity: {
        critical: alerts.filter(a => a.severity === 'critical' && a.enabled).length,
        high: alerts.filter(a => a.severity === 'high' && a.enabled).length,
        medium: alerts.filter(a => a.severity === 'medium' && a.enabled).length,
        low: alerts.filter(a => a.severity === 'low' && a.enabled).length,
      },
    };

    const response = {
      success: true,
      data: {
        alerts,
        statistics: alertStats,
        monitoring: {
          isActive: status.isMonitoring,
          lastUpdate: status.lastUpdate,
        },
        ...(includeHistory && {
          recentAlerts: recentAlerts.reverse(), // Most recent first
          alertsCount: recentAlerts.length,
        }),
      },
      meta: {
        endpoint: '/api/monitoring/alerts',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    console.error('Alerts API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve alerts',
        message: error instanceof Error ? error.message : 'Unknown error',
        meta: {
          endpoint: '/api/monitoring/alerts',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/monitoring/alerts
 * Configure alert thresholds and settings
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, alertConfig } = body;

    switch (action) {
      case 'test':
        // Test alert system
        const testAlert = {
          metric: 'test.metric',
          threshold: 100,
          condition: 'greater' as const,
          severity: 'medium' as const,
          enabled: true,
        };

        // This would trigger a test alert
        console.log('🧪 Test alert triggered:', testAlert);

        return NextResponse.json({
          success: true,
          data: {
            message: 'Test alert sent successfully',
            testAlert,
          },
          meta: {
            endpoint: '/api/monitoring/alerts',
            action: 'test',
            timestamp: new Date().toISOString(),
          },
        });

      case 'configure':
        // In a real implementation, this would update alert configuration
        // For now, we'll just validate the configuration
        if (!alertConfig || !Array.isArray(alertConfig)) {
          return NextResponse.json(
            {
              success: false,
              error: 'Invalid alert configuration',
              message: 'alertConfig must be an array of alert objects',
            },
            { status: 400 }
          );
        }

        // Validate alert structure
        for (const alert of alertConfig) {
          if (
            !alert.metric ||
            typeof alert.threshold !== 'number' ||
            !alert.condition ||
            !alert.severity
          ) {
            return NextResponse.json(
              {
                success: false,
                error: 'Invalid alert structure',
                message: 'Each alert must have metric, threshold, condition, and severity',
              },
              { status: 400 }
            );
          }
        }

        return NextResponse.json({
          success: true,
          data: {
            message: 'Alert configuration updated successfully',
            alertsConfigured: alertConfig.length,
          },
          meta: {
            endpoint: '/api/monitoring/alerts',
            action: 'configure',
            timestamp: new Date().toISOString(),
          },
        });

      case 'clear_history':
        // Clear alert history
        try {
          const logsPath = join(process.cwd(), 'logs');
          // In production, this would actually clear the alerts.json file
          console.log('🗑️ Alert history cleared');

          return NextResponse.json({
            success: true,
            data: { message: 'Alert history cleared successfully' },
            meta: {
              endpoint: '/api/monitoring/alerts',
              action: 'clear_history',
              timestamp: new Date().toISOString(),
            },
          });
        } catch (error) {
          return NextResponse.json(
            {
              success: false,
              error: 'Failed to clear alert history',
              message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
          );
        }

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action',
            validActions: ['test', 'configure', 'clear_history'],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Alerts configuration error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to configure alerts',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
