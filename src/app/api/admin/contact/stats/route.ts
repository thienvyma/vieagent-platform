import { NextRequest, NextResponse } from 'next/server';
// ✅ FIXED Phase 4D True Fix - Fix getServerSession import for next-auth v4
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

// GET /api/admin/contact/stats - Get contact statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !hasPermission(session.user.role, 'view_contacts')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [total, newContacts, inProgress, responded, closed, avgResponseTimeData] =
      await Promise.all([
        // Total contacts
        prisma.contactSubmission.count(),

        // New contacts
        prisma.contactSubmission.count({
          where: { status: 'NEW' },
        }),

        // In progress
        prisma.contactSubmission.count({
          where: { status: 'IN_PROGRESS' },
        }),

        // Responded
        prisma.contactSubmission.count({
          where: { status: 'RESPONDED' },
        }),

        // Closed
        prisma.contactSubmission.count({
          where: { status: 'CLOSED' },
        }),

        // Average response time (in hours)
        prisma.contactSubmission.findMany({
          where: {
            status: 'RESPONDED',
            respondedAt: { not: null },
          },
          select: {
            createdAt: true,
            respondedAt: true,
          },
        }),
      ]);

    // Calculate average response time
    let avgResponseTime = 0;
    if (avgResponseTimeData.length > 0) {
      const totalResponseTime = avgResponseTimeData.reduce((sum, contact) => {
        if (contact.respondedAt) {
          const diff =
            new Date(contact.respondedAt).getTime() - new Date(contact.createdAt).getTime();
          return sum + diff / (1000 * 60 * 60); // Convert to hours
        }
        return sum;
      }, 0);

      avgResponseTime = Math.round(totalResponseTime / avgResponseTimeData.length);
    }

    return NextResponse.json({
      total,
      new: newContacts,
      inProgress,
      responded,
      closed,
      avgResponseTime,
    });
  } catch (error) {
    console.error('Error fetching contact stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
