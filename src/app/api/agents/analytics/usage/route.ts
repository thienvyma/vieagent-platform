import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent');
    const timeRange = searchParams.get('timeRange') || '7d';

    // Calculate date range
    const now = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case '24h':
        startDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Build where clause
    const whereClause: any = {
      userId: session.user.id,
      createdAt: {
        gte: startDate,
        lte: now,
      },
    };

    if (agentId && agentId !== 'all') {
      whereClause.agentId = agentId;
    }

    // Get conversations grouped by date
    const conversations = await prisma.conversation.findMany({
      where: whereClause,
      include: {
        messages: true,
        agent: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group data by date
    const groupedData = new Map<
      string,
      {
        conversations: number;
        messages: number;
        responseTime: number[];
        satisfaction: number[];
        cost: number;
        activeUsers: Set<string>;
      }
    >();

    conversations.forEach(conv => {
      const date = conv.createdAt.toISOString().split('T')[0];

      if (!groupedData.has(date)) {
        groupedData.set(date, {
          conversations: 0,
          messages: 0,
          responseTime: [],
          satisfaction: [],
          cost: 0,
          activeUsers: new Set(),
        });
      }

      const dayData = groupedData.get(date)!;
      dayData.conversations += 1;
      dayData.messages += conv.messages.length;
      dayData.activeUsers.add(conv.userId);

      // Mock response time calculation
      const mockResponseTime = Math.max(
        0.5,
        Math.min(5, conv.messages.length * 0.3 + Math.random() * 1.5)
      );
      dayData.responseTime.push(mockResponseTime);

      // Mock satisfaction calculation
      const mockSatisfaction = Math.min(5, Math.max(1, 4.2 + (Math.random() - 0.5) * 1.5));
      dayData.satisfaction.push(mockSatisfaction);

      // Mock cost calculation
      dayData.cost += conv.messages.length * 0.002 + 0.15;
    });

    // Convert to array format
    const usageData = Array.from(groupedData.entries()).map(([date, data]) => ({
      date,
      conversations: data.conversations,
      messages: data.messages,
      responseTime:
        data.responseTime.length > 0
          ? Number(
              (data.responseTime.reduce((a, b) => a + b, 0) / data.responseTime.length).toFixed(1)
            )
          : 0,
      satisfaction:
        data.satisfaction.length > 0
          ? Number(
              (data.satisfaction.reduce((a, b) => a + b, 0) / data.satisfaction.length).toFixed(1)
            )
          : 0,
      cost: Number(data.cost.toFixed(2)),
      activeUsers: data.activeUsers.size,
    }));

    // Fill in missing dates with zero values
    const filledData = [];
    const currentDate = new Date(startDate);

    while (currentDate <= now) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const existingData = usageData.find(d => d.date === dateStr);

      if (existingData) {
        filledData.push(existingData);
      } else {
        filledData.push({
          date: dateStr,
          conversations: 0,
          messages: 0,
          responseTime: 0,
          satisfaction: 0,
          cost: 0,
          activeUsers: 0,
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return NextResponse.json({
      success: true,
      data: filledData,
      timeRange,
      agentId: agentId || 'all',
    });
  } catch (error) {
    console.error('Error fetching usage analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch usage analytics' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { agentId, eventType, metadata } = body;

    // Log usage event for analytics
    const usageEvent = await prisma.agentUsageEvent.create({
      data: {
        agentId,
        userId: session.user.id,
        eventType,
        metadata: metadata || {},
        timestamp: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      event: usageEvent,
    });
  } catch (error) {
    console.error('Error logging usage event:', error);
    return NextResponse.json({ error: 'Failed to log usage event' }, { status: 500 });
  }
}
