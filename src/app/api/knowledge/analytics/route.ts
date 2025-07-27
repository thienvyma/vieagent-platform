/**
 * 📊 KNOWLEDGE ANALYTICS API
 * Phase 3, Day 10 - Analytics & Insights
 * Provides analytics and insights for knowledge management
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
// ✅ FIXED Phase 4D True Fix - Fix getServerSession import for next-auth v4
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// =============================================================================
// GET - KNOWLEDGE ANALYTICS
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';
    const period = searchParams.get('period') || '7d';
    const knowledgeId = searchParams.get('knowledgeId');

    // Calculate date range
    const now = new Date();
    const periods = {
      '1d': new Date(now.getTime() - 24 * 60 * 60 * 1000),
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
    };

    const startDate = periods[period as keyof typeof periods] || periods['7d'];

    if (type === 'overview') {
      // Overview analytics
      const totalKnowledge = await prisma.knowledge.count({
        where: { userId: user.id, isDeleted: false },
      });

      const byType = await prisma.knowledge.groupBy({
        by: ['type'],
        where: { userId: user.id, isDeleted: false },
        _count: { type: true },
      });

      const byStatus = await prisma.knowledge.groupBy({
        by: ['status'],
        where: { userId: user.id, isDeleted: false },
        _count: { status: true },
      });

      const bySource = await prisma.knowledge.groupBy({
        by: ['source'],
        where: {
          userId: user.id,
          isDeleted: false,
          source: { not: null },
        },
        _count: { source: true },
      });

      const totalSize = await prisma.knowledge.aggregate({
        where: { userId: user.id, isDeleted: false },
        _sum: { size: true },
      });

      const totalViews = await prisma.knowledge.aggregate({
        where: { userId: user.id, isDeleted: false },
        _sum: { viewCount: true },
      });

      const recentActivity = await prisma.knowledgeAnalytics.findMany({
        where: {
          knowledge: { userId: user.id },
          timestamp: { gte: startDate },
        },
        orderBy: { timestamp: 'desc' },
        take: 20,
        include: {
          knowledge: {
            select: { id: true, title: true, type: true },
          },
        },
      });

      const activityByType = await prisma.knowledgeAnalytics.groupBy({
        by: ['eventType'],
        where: {
          knowledge: { userId: user.id },
          timestamp: { gte: startDate },
        },
        _count: { eventType: true },
      });

      return NextResponse.json({
        success: true,
        data: {
          summary: {
            totalKnowledge,
            totalSize: totalSize._sum.size || 0,
            totalViews: totalViews._sum.viewCount || 0,
            period,
          },
          distribution: {
            byType: byType.map(item => ({
              type: item.type,
              count: item._count.type,
            })),
            byStatus: byStatus.map(item => ({
              status: item.status,
              count: item._count.status,
            })),
            bySource: bySource.map(item => ({
              source: item.source,
              count: item._count.source,
            })),
          },
          activity: {
            recent: recentActivity.map(activity => ({
              eventType: activity.eventType,
              eventData: activity.eventData ? JSON.parse(activity.eventData) : null,
              timestamp: activity.timestamp,
              knowledge: activity.knowledge,
            })),
            byType: activityByType.map(item => ({
              eventType: item.eventType,
              count: item._count.eventType,
            })),
          },
        },
      });
    } else if (type === 'performance') {
      // Performance analytics
      const processingTimes = await prisma.knowledgeProcessingHistory.findMany({
        where: {
          knowledge: { userId: user.id },
          timestamp: { gte: startDate },
          duration: { not: null },
        },
        select: {
          operation: true,
          duration: true,
          timestamp: true,
          knowledge: {
            select: { id: true, title: true, type: true, size: true },
          },
        },
      });

      const avgProcessingTime =
        processingTimes.reduce((sum, item) => sum + (item.duration || 0), 0) /
          processingTimes.length || 0;

      const processingByOperation = processingTimes.reduce(
        (acc, item) => {
          const op = item.operation;
          if (!acc[op]) acc[op] = [];
          acc[op].push(item.duration || 0);
          return acc;
        },
        {} as Record<string, number[]>
      );

      const processingSummary = Object.entries(processingByOperation).map(([operation, times]) => ({
        operation,
        count: times.length,
        avgDuration: times.reduce((sum, time) => sum + time, 0) / times.length,
        minDuration: Math.min(...times),
        maxDuration: Math.max(...times),
      }));

      const errorRate = await prisma.knowledge.count({
        where: {
          userId: user.id,
          status: 'FAILED',
          updatedAt: { gte: startDate },
        },
      });

      const successRate = await prisma.knowledge.count({
        where: {
          userId: user.id,
          status: 'COMPLETED',
          updatedAt: { gte: startDate },
        },
      });

      const total = errorRate + successRate;

      return NextResponse.json({
        success: true,
        data: {
          performance: {
            avgProcessingTime,
            processingByOperation: processingSummary,
            errorRate: total > 0 ? (errorRate / total) * 100 : 0,
            successRate: total > 0 ? (successRate / total) * 100 : 0,
            totalProcessed: total,
          },
          recentProcessing: processingTimes.slice(0, 10),
        },
      });
    } else if (type === 'usage') {
      // Usage analytics
      const viewsByDay = await prisma.knowledgeAnalytics.groupBy({
        by: ['timestamp'],
        where: {
          knowledge: { userId: user.id },
          eventType: 'view',
          timestamp: { gte: startDate },
        },
        _count: { timestamp: true },
      });

      const topViewed = await prisma.knowledge.findMany({
        where: { userId: user.id, isDeleted: false },
        orderBy: { viewCount: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          type: true,
          viewCount: true,
          lastViewed: true,
          createdAt: true,
        },
      });

      const mostActive = await prisma.knowledgeAnalytics.groupBy({
        by: ['knowledgeId'],
        where: {
          knowledge: { userId: user.id },
          timestamp: { gte: startDate },
        },
        _count: { knowledgeId: true },
        orderBy: { _count: { knowledgeId: 'desc' } },
        take: 10,
      });

      const mostActiveWithDetails = await Promise.all(
        mostActive.map(async item => {
          const knowledge = await prisma.knowledge.findUnique({
            where: { id: item.knowledgeId },
            select: { id: true, title: true, type: true, viewCount: true },
          });
          return {
            ...knowledge,
            activityCount: item._count.knowledgeId,
          };
        })
      );

      return NextResponse.json({
        success: true,
        data: {
          usage: {
            viewsByDay: viewsByDay.map(item => ({
              date: item.timestamp,
              views: item._count.timestamp,
            })),
            topViewed,
            mostActive: mostActiveWithDetails,
          },
        },
      });
    } else if (type === 'insights') {
      // AI Insights
      const insights = await prisma.knowledgeInsight.findMany({
        where: {
          knowledge: { userId: user.id },
          generatedAt: { gte: startDate },
        },
        orderBy: { generatedAt: 'desc' },
        take: 50,
        include: {
          knowledge: {
            select: { id: true, title: true, type: true },
          },
        },
      });

      const insightsByType = await prisma.knowledgeInsight.groupBy({
        by: ['insightType'],
        where: {
          knowledge: { userId: user.id },
          generatedAt: { gte: startDate },
        },
        _count: { insightType: true },
      });

      const sentimentAnalysis = insights
        .filter(i => i.insightType === 'sentiment')
        .map(i => ({
          knowledgeId: i.knowledgeId,
          knowledge: i.knowledge,
          sentiment: JSON.parse(i.insightData),
          confidence: i.confidence,
          generatedAt: i.generatedAt,
        }));

      const keywords = insights
        .filter(i => i.insightType === 'keywords')
        .map(i => ({
          knowledgeId: i.knowledgeId,
          knowledge: i.knowledge,
          keywords: JSON.parse(i.insightData),
          confidence: i.confidence,
          generatedAt: i.generatedAt,
        }));

      return NextResponse.json({
        success: true,
        data: {
          insights: {
            summary: insightsByType.map(item => ({
              type: item.insightType,
              count: item._count.insightType,
            })),
            sentimentAnalysis,
            keywords,
            recent: insights.slice(0, 10).map(insight => ({
              type: insight.insightType,
              data: JSON.parse(insight.insightData),
              confidence: insight.confidence,
              generatedAt: insight.generatedAt,
              knowledge: insight.knowledge,
            })),
          },
        },
      });
    } else if (knowledgeId) {
      // Individual knowledge analytics
      const knowledge = await prisma.knowledge.findFirst({
        where: { id: knowledgeId, userId: user.id },
      });

      if (!knowledge) {
        return NextResponse.json({ error: 'Knowledge not found' }, { status: 404 });
      }

      const analytics = await prisma.knowledgeAnalytics.findMany({
        where: {
          knowledgeId,
          timestamp: { gte: startDate },
        },
        orderBy: { timestamp: 'desc' },
      });

      const insights = await prisma.knowledgeInsight.findMany({
        where: { knowledgeId },
        orderBy: { generatedAt: 'desc' },
      });

      const processingHistory = await prisma.knowledgeProcessingHistory.findMany({
        where: { knowledgeId },
        orderBy: { timestamp: 'desc' },
      });

      return NextResponse.json({
        success: true,
        data: {
          knowledge: {
            id: knowledge.id,
            title: knowledge.title,
            type: knowledge.type,
            status: knowledge.status,
            viewCount: knowledge.viewCount,
            shareCount: knowledge.shareCount,
            createdAt: knowledge.createdAt,
            updatedAt: knowledge.updatedAt,
          },
          analytics: analytics.map(a => ({
            eventType: a.eventType,
            eventData: a.eventData ? JSON.parse(a.eventData) : null,
            timestamp: a.timestamp,
          })),
          insights: insights.map(i => ({
            type: i.insightType,
            data: JSON.parse(i.insightData),
            confidence: i.confidence,
            generatedAt: i.generatedAt,
          })),
          processingHistory: processingHistory.map(p => ({
            operation: p.operation,
            status: p.status,
            details: p.details ? JSON.parse(p.details) : null,
            duration: p.duration,
            timestamp: p.timestamp,
          })),
        },
      });
    }

    return NextResponse.json({ error: 'Invalid analytics type' }, { status: 400 });
  } catch (error) {
    console.error('Knowledge Analytics Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// =============================================================================
// POST - LOG ANALYTICS EVENT
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { knowledgeId, eventType, eventData, ipAddress, userAgent } = body;

    // Validate knowledge ownership
    const knowledge = await prisma.knowledge.findFirst({
      where: { id: knowledgeId, userId: user.id },
    });

    if (!knowledge) {
      return NextResponse.json({ error: 'Knowledge not found' }, { status: 404 });
    }

    // Log the event
    const analytics = await prisma.knowledgeAnalytics.create({
      data: {
        knowledgeId,
        eventType,
        eventData: eventData ? JSON.stringify(eventData) : null,
        ipAddress,
        userAgent,
      },
    });

    // Update knowledge counters based on event type
    if (eventType === 'view') {
      await prisma.knowledge.update({
        where: { id: knowledgeId },
        data: {
          viewCount: { increment: 1 },
          lastViewed: new Date(),
        },
      });
    } else if (eventType === 'download') {
      await prisma.knowledge.update({
        where: { id: knowledgeId },
        data: { downloadCount: { increment: 1 } },
      });
    } else if (eventType === 'share') {
      await prisma.knowledge.update({
        where: { id: knowledgeId },
        data: { shareCount: { increment: 1 } },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: analytics.id,
        eventType: analytics.eventType,
        timestamp: analytics.timestamp,
      },
    });
  } catch (error) {
    console.error('Analytics Logging Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
