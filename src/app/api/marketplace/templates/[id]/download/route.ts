import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/marketplace/templates/[id]/download
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templateId = params.id;

    // Check if template exists
    const template = await prisma.agentTemplate.findUnique({
      where: { id: templateId },
      select: {
        id: true,
        name: true,
        authorId: true,
        downloads: true,
        configuration: true,
        premium: true,
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Check if user has access to premium template
    if (template.premium) {
      // Add premium access check here
      // For now, we'll allow all authenticated users
    }

    // Record the download
    await prisma.templateDownload.create({
      data: {
        templateId,
        userId: session.user.id,
        downloadedAt: new Date(),
      },
    });

    // Update download count
    await prisma.agentTemplate.update({
      where: { id: templateId },
      data: {
        downloads: {
          increment: 1,
        },
      },
    });

    // Return template configuration
    return NextResponse.json({
      success: true,
      template: {
        id: template.id,
        name: template.name,
        configuration: template.configuration,
      },
    });
  } catch (error) {
    console.error('Error downloading template:', error);
    return NextResponse.json({ error: 'Failed to download template' }, { status: 500 });
  }
}

// GET /api/marketplace/templates/[id]/download - Get download info
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const templateId = params.id;

    // Get download statistics
    const [totalDownloads, recentDownloads, topCountries] = await Promise.all([
      prisma.templateDownload.count({
        where: { templateId },
      }),
      prisma.templateDownload.count({
        where: {
          templateId,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          },
        },
      }),
      prisma.templateDownload.groupBy({
        by: ['ipAddress'],
        where: { templateId },
        _count: {
          ipAddress: true,
        },
        orderBy: {
          _count: {
            ipAddress: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    // Get download history by day for the last 30 days
    const downloadHistory = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as downloads
      FROM template_downloads
      WHERE template_id = ${templateId}
        AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    return NextResponse.json({
      totalDownloads,
      recentDownloads,
      downloadHistory,
      topCountries: topCountries.map(country => ({
        country: country.ipAddress, // In real app, you'd resolve IP to country
        downloads: country._count.ipAddress,
      })),
    });
  } catch (error) {
    console.error('Error fetching download info:', error);
    return NextResponse.json({ error: 'Failed to fetch download info' }, { status: 500 });
  }
}
