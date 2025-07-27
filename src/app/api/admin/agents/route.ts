import { NextRequest, NextResponse } from 'next/server';
// ✅ FIXED Phase 4D True Fix - Fix getServerSession import for next-auth v4
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission, type UserRole } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view agents
    if (!hasPermission(session.user.role as UserRole, 'view_agents')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Filters
    const status = searchParams.get('status');
    const ownerId = searchParams.get('ownerId');
    const plan = searchParams.get('plan');
    const model = searchParams.get('model');
    const search = searchParams.get('search');

    // Date filters
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (ownerId) {
      where.userId = ownerId;
    }

    if (plan) {
      where.user = {
        plan: plan,
      };
    }

    if (model) {
      where.model = model;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Get agents with user info and statistics
    const [agents, totalCount] = await Promise.all([
      prisma.agent.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          model: true,
          temperature: true,
          maxTokens: true,
          isPublic: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              plan: true,
              isActive: true,
            },
          },
          _count: {
            select: {
              conversations: true,
              deployments: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.agent.count({ where }),
    ]);

    // Format data for frontend
    const formattedAgents = agents.map(agent => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      status: agent.status,
      model: agent.model,
      temperature: agent.temperature,
      maxTokens: agent.maxTokens,
      isPublic: agent.isPublic,
      createdAt: agent.createdAt.toISOString(),
      updatedAt: agent.updatedAt.toISOString(),
      owner: {
        id: agent.user.id,
        name: agent.user.name,
        email: agent.user.email,
        role: agent.user.role,
        plan: agent.user.plan,
        isActive: agent.user.isActive,
      },
      statistics: {
        conversationsCount: agent._count.conversations,
        deploymentsCount: agent._count.deployments,
      },
    }));

    // Get available filters
    const [statuses, models, plans, owners] = await Promise.all([
      prisma.agent.findMany({
        select: { status: true },
        distinct: ['status'],
      }),
      prisma.agent.findMany({
        select: { model: true },
        distinct: ['model'],
      }),
      prisma.user.findMany({
        select: { plan: true },
        distinct: ['plan'],
      }),
      prisma.user.findMany({
        where: {
          agents: {
            some: {},
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
        orderBy: {
          name: 'asc',
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      agents: formattedAgents,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      filters: {
        statuses: statuses.map(s => s.status),
        models: models.map(m => m.model),
        plans: plans.map(p => p.plan),
        owners: owners,
      },
    });
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
