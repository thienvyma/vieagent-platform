import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !hasPermission(session.user.role, 'manage_system_settings')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get system settings
    const settings = await prisma.systemSettings.findFirst();

    return NextResponse.json({
      success: true,
      data: settings || {
        siteName: 'AI Agent Platform',
        siteDescription: 'Advanced AI Agent Management Platform',
        maintenanceMode: false,
        registrationEnabled: true,
        emailNotificationsEnabled: true,
        maxApiCallsPerUser: 10000,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('System settings error:', error);
    return NextResponse.json({ error: 'Failed to fetch system settings' }, { status: 500 });
  }
}
