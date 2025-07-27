import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { IntegrationAnalyticsService } from '@/lib/google/integration-analytics';

const analyticsService = new IntegrationAnalyticsService();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'generate_insights':
        return await handleGenerateInsights(session.user.id, data);
      case 'get_realtime':
        return await handleGetRealtime(session.user.id, data);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('❌ Error in integration analytics API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleGenerateInsights(userId: string, data: any) {
  try {
    const { period = 'weekly', startDate, endDate } = data;

    const insights = await analyticsService.generateIntegrationAnalytics(
      userId,
      period,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    return NextResponse.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    console.error('❌ Error generating insights:', error);
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 });
  }
}

async function handleGetRealtime(userId: string, data: any) {
  try {
    const realtimeData = await analyticsService.getRealTimeAnalytics(userId);

    return NextResponse.json({
      success: true,
      data: realtimeData,
    });
  } catch (error) {
    console.error('❌ Error getting realtime analytics:', error);
    return NextResponse.json({ error: 'Failed to get realtime analytics' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'insights':
        return await handleGenerateInsights(session.user.id, {
          period: url.searchParams.get('period') || 'weekly',
          startDate: url.searchParams.get('startDate'),
          endDate: url.searchParams.get('endDate'),
        });
      case 'realtime':
        return await handleGetRealtime(session.user.id, {});
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('❌ Error in integration analytics GET API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
