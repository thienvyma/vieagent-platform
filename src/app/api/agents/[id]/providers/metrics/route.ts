import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        message: 'Please login to access provider metrics'
      }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '24h';

    // Validate timeRange
    const validTimeRanges = ['1h', '24h', '7d', '30d'];
    if (!validTimeRanges.includes(timeRange)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid time range',
        message: 'Time range must be one of: 1h, 24h, 7d, 30d'
      }, { status: 400 });
    }

    // Verify agent exists and user has access
    const agent = await prisma.agent.findFirst({
      where: {
        id,
        user: { email: session.user.email },
      },
    });

    if (!agent) {
      return NextResponse.json({
        success: false,
        error: 'Agent not found',
        message: 'Agent not found or you do not have access to it'
      }, { status: 404 });
    }

    // Get provider metrics from database
    const providerMetrics = await prisma.agentMetric.findMany({
      where: {
        agentId: id,
        createdAt: {
          gte: getTimeRangeDate(timeRange),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform data for frontend
    const metrics = transformProviderMetrics(providerMetrics);
    const timeSeriesData = generateTimeSeriesData(providerMetrics, timeRange);

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        timeSeriesData,
        agentId: id,
        agentName: agent.name,
      },
      meta: {
        timeRange,
        generatedAt: new Date().toISOString(),
        recordCount: providerMetrics.length,
      },
    });

  } catch (error) {
    console.error('Error fetching provider metrics:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch provider metrics. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}

// Helper functions
function getTimeRangeDate(timeRange: string): Date {
  const now = new Date();
  switch (timeRange) {
    case '1h':
      return new Date(now.getTime() - 60 * 60 * 1000);
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }
}

function transformProviderMetrics(metrics: any[]): any[] {
  // Group metrics by provider and calculate averages
  const providerGroups = metrics.reduce((acc, metric) => {
    const provider = metric.provider || 'unknown';
    if (!acc[provider]) {
      acc[provider] = {
        provider,
        model: metric.model || 'unknown',
        averageResponseTime: 0,
        successRate: 0,
        averageCost: 0,
        totalRequests: 0,
        score: 0,
        status: 'active',
        lastUsed: metric.createdAt,
        metrics: [],
      };
    }
    acc[provider].metrics.push(metric);
    return acc;
  }, {} as Record<string, any>);

  // Calculate averages for each provider
  return Object.values(providerGroups).map((group: any) => {
    const metrics = group.metrics;
    const count = metrics.length;
    
    if (count === 0) return group;

    return {
      ...group,
      averageResponseTime: Math.round(
        metrics.reduce((sum: number, m: any) => sum + (m.responseTime || 0), 0) / count
      ),
      successRate: Math.round(
        (metrics.reduce((sum: number, m: any) => sum + (m.successRate || 0), 0) / count) * 100
      ) / 100,
      averageCost: Math.round(
        (metrics.reduce((sum: number, m: any) => sum + (m.cost || 0), 0) / count) * 1000
      ) / 1000,
      totalRequests: metrics.reduce((sum: number, m: any) => sum + (m.totalRequests || 0), 0),
      score: Math.round(
        metrics.reduce((sum: number, m: any) => sum + (m.score || 0), 0) / count
      ),
      metrics: undefined, // Remove raw metrics from response
    };
  });
}

function generateTimeSeriesData(metrics: any[], timeRange: string): any[] {
  // Generate time series data based on metrics
  const timeSlots = getTimeSlots(timeRange);
  
  return timeSlots.map(slot => {
    const slotMetrics = metrics.filter(m => 
      new Date(m.createdAt) >= slot.start && new Date(m.createdAt) < slot.end
    );
    
    const providerData = slotMetrics.reduce((acc, metric) => {
      const provider = metric.provider || 'unknown';
      if (!acc[provider]) {
        acc[provider] = [];
      }
      acc[provider].push(metric.responseTime || 0);
      return acc;
    }, {} as Record<string, number[]>);

    // Calculate averages for each provider
    const result: any = { timestamp: slot.label };
    Object.keys(providerData).forEach(provider => {
      const times = providerData[provider];
      result[provider] = times.length > 0 
        ? Math.round(times.reduce((sum, time) => sum + time, 0) / times.length)
        : 0;
    });

    return result;
  });
}

function getTimeSlots(timeRange: string): Array<{ start: Date; end: Date; label: string }> {
  const now = new Date();
  const slots: Array<{ start: Date; end: Date; label: string }> = [];
  
  switch (timeRange) {
    case '1h':
      for (let i = 5; i >= 0; i--) {
        const start = new Date(now.getTime() - (i + 1) * 10 * 60 * 1000);
        const end = new Date(now.getTime() - i * 10 * 60 * 1000);
        slots.push({
          start,
          end,
          label: start.toTimeString().slice(0, 5),
        });
      }
      break;
    case '24h':
      for (let i = 5; i >= 0; i--) {
        const start = new Date(now.getTime() - (i + 1) * 4 * 60 * 60 * 1000);
        const end = new Date(now.getTime() - i * 4 * 60 * 60 * 1000);
        slots.push({
          start,
          end,
          label: start.toTimeString().slice(0, 5),
        });
      }
      break;
    case '7d':
      for (let i = 6; i >= 0; i--) {
        const start = new Date(now.getTime() - (i + 1) * 24 * 60 * 60 * 1000);
        const end = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        slots.push({
          start,
          end,
          label: start.toLocaleDateString().slice(0, 5),
        });
      }
      break;
    case '30d':
      for (let i = 5; i >= 0; i--) {
        const start = new Date(now.getTime() - (i + 1) * 5 * 24 * 60 * 60 * 1000);
        const end = new Date(now.getTime() - i * 5 * 24 * 60 * 60 * 1000);
        slots.push({
          start,
          end,
          label: start.toLocaleDateString().slice(0, 5),
        });
      }
      break;
    default:
      // Default to 24h
      return getTimeSlots('24h');
  }
  
  return slots;
} 