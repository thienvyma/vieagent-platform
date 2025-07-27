import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !hasPermission(session.user.role, 'export_data')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    // Get users data
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        plan: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (format === 'csv') {
      // Generate CSV format
      const csvHeader = 'ID,Email,Name,Role,Plan,Active,Created,Updated\n';
      const csvData = users
        .map(
          user =>
            `${user.id},"${user.email}","${user.name || ''}",${user.role},${user.plan},${user.isActive},${user.createdAt.toISOString()},${user.updatedAt.toISOString()}`
        )
        .join('\n');

      return new NextResponse(csvHeader + csvData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="users_export.csv"',
        },
      });
    }

    // Default JSON format
    return NextResponse.json({
      success: true,
      data: users,
      count: users.length,
      exportedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('User export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
