import { NextRequest, NextResponse } from 'next/server';
// ✅ FIXED Phase 4D True Fix - Fix getServerSession import for next-auth v4
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

// GET /api/admin/bank-transfers - Get all bank transfers
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasPermission(session.user.role, 'manage_payments')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build where conditions
    const where: any = {};

    if (status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { bankName: { contains: search, mode: 'insensitive' } },
        { accountHolder: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get transfers with pagination
    const [transfers, total] = await Promise.all([
      prisma.bankTransfer.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              plan: true,
            },
          },
          plan: {
            select: {
              id: true,
              name: true,
              price: true,
              currency: true,
              interval: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.bankTransfer.count({ where }),
    ]);

    // Get status counts for statistics
    const statusCounts = await prisma.bankTransfer.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    const stats = {
      PENDING: 0,
      VERIFIED: 0,
      REJECTED: 0,
    };

    statusCounts.forEach(({ status, _count }) => {
      stats[status as keyof typeof stats] = _count.id;
    });

    return NextResponse.json({
      success: true,
      data: transfers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats,
    });
  } catch (error) {
    console.error('Bank transfers fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
