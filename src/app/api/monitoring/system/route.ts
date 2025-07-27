import { NextRequest, NextResponse } from 'next/server';
import { systemMonitor } from '@/lib/monitoring/system-monitor';

/**
 * GET /api/monitoring/system
 * Returns current system metrics and performance data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '60'; // minutes
    const includeAlerts = searchParams.get('alerts') === 'true';

    // Get current system metrics
    const currentMetrics = await systemMonitor.getSystemMetrics();
    const currentPerformance = systemMonitor.getPerformanceMetrics();

    // Get historical data
    const historical = systemMonitor.getRecentMetrics(parseInt(timeframe));

    // Get monitoring status
    const status = systemMonitor.getStatus();

    const response = {
      success: true,
      data: {
        current: {
          system: currentMetrics,
          performance: currentPerformance,
          timestamp: new Date().toISOString(),
        },
        historical: {
          system: historical.system,
          performance: historical.performance,
          timeframe: `${timeframe} minutes`,
        },
        monitoring: {
          isActive: status.isMonitoring,
          metricsCount: status.metricsCount,
          lastUpdate: status.lastUpdate,
        },
        ...(includeAlerts && { alerts: status.alerts }),
      },
      meta: {
        endpoint: '/api/monitoring/system',
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
    console.error('System monitoring API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve system metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
        meta: {
          endpoint: '/api/monitoring/system',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/monitoring/system
 * Control monitoring system (start/stop/configure)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, config } = body;

    let result: any = {};

    switch (action) {
      case 'start':
        const interval = config?.interval || 60000;
        systemMonitor.startMonitoring(interval);
        result = { message: 'Monitoring started', interval };
        break;

      case 'stop':
        systemMonitor.stopMonitoring();
        result = { message: 'Monitoring stopped' };
        break;

      case 'status':
        result = systemMonitor.getStatus();
        break;

      case 'record_request':
        const { responseTime, success, error } = config;
        systemMonitor.recordApiRequest(responseTime, success, error);
        result = { message: 'Request recorded' };
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action',
            validActions: ['start', 'stop', 'status', 'record_request'],
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        endpoint: '/api/monitoring/system',
        action,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('System monitoring control error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to control monitoring system',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
