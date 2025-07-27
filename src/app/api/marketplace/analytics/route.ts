import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/marketplace/analytics - Get marketplace analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '30d';
    const templateId = searchParams.get('templateId');
    const userId = searchParams.get('userId');

    // Calculate date range
    const now = new Date();
    const startDate = new Date();

    switch (timeframe) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // If requesting specific template analytics
    if (templateId) {
      return await getTemplateAnalytics(templateId, startDate, session);
    }

    // If requesting user analytics
    if (userId) {
      return await getUserAnalytics(userId, startDate, session);
    }

    // General marketplace analytics
    const [
      totalStats,
      categoryStats,
      trendingTemplates,
      topAuthors,
      downloadHistory,
      ratingDistribution,
      tagStats,
    ] = await Promise.all([
      // Total statistics
      prisma.agentTemplate.aggregate({
        _count: { id: true },
        _sum: { downloads: true, stars: true },
        _avg: { averageRating: true },
        where: { status: 'PUBLISHED' },
      }),

      // Category statistics
      prisma.agentTemplate.groupBy({
        by: ['category'],
        where: { status: 'PUBLISHED' },
        _count: { id: true },
        _sum: { downloads: true },
        _avg: { averageRating: true },
        orderBy: { _sum: { downloads: 'desc' } },
      }),

      // Trending templates (most downloads in timeframe)
      prisma.agentTemplate.findMany({
        where: {
          status: 'PUBLISHED',
          downloads: {
            gte: 1,
          },
        },
        orderBy: { downloads: 'desc' },
        take: 10,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
              verified: true,
            },
          },
        },
      }),

      // Top authors
      prisma.user.findMany({
        where: {
          authoredTemplates: {
            some: {
              status: 'PUBLISHED',
            },
          },
        },
        orderBy: { reputation: 'desc' },
        take: 10,
        include: {
          _count: {
            select: {
              authoredTemplates: {
                where: { status: 'PUBLISHED' },
              },
            },
          },
          authoredTemplates: {
            where: { status: 'PUBLISHED' },
            select: {
              downloads: true,
              stars: true,
              averageRating: true,
            },
          },
        },
      }),

      // Download history
      prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as downloads
        FROM template_downloads
        WHERE created_at >= ${startDate}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,

      // Rating distribution
      prisma.templateReview.groupBy({
        by: ['rating'],
        where: {
          status: 'PUBLISHED',
          createdAt: { gte: startDate },
        },
        _count: { rating: true },
      }),

      // Tag statistics
      prisma.$queryRaw`
        SELECT 
          tag,
          COUNT(*) as usage_count,
          SUM(downloads) as total_downloads
        FROM (
          SELECT 
            JSON_UNQUOTE(JSON_EXTRACT(tags, CONCAT('$[', numbers.n, ']'))) as tag,
            downloads
          FROM agent_templates
          CROSS JOIN (
            SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 
            UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
          ) numbers
          WHERE 
            status = 'PUBLISHED'
            AND JSON_EXTRACT(tags, CONCAT('$[', numbers.n, ']')) IS NOT NULL
        ) tag_data
        WHERE tag IS NOT NULL
        GROUP BY tag
        ORDER BY usage_count DESC
        LIMIT 20
      `,
    ]);

    // Transform top authors data
    const transformedTopAuthors = topAuthors.map(author => ({
      id: author.id,
      name: author.name,
      image: author.image,
      verified: author.verified,
      reputation: author.reputation,
      templateCount: author._count.authoredTemplates,
      totalDownloads: author.authoredTemplates.reduce((sum, t) => sum + t.downloads, 0),
      totalStars: author.authoredTemplates.reduce((sum, t) => sum + t.stars, 0),
      averageRating:
        author.authoredTemplates.length > 0
          ? author.authoredTemplates.reduce((sum, t) => sum + t.averageRating, 0) /
            author.authoredTemplates.length
          : 0,
    }));

    // Transform trending templates
    const transformedTrendingTemplates = trendingTemplates.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      downloads: template.downloads,
      rating: template.averageRating,
      stars: template.stars,
      author: {
        name: template.author.name,
        verified: template.author.verified,
        image: template.author.image,
      },
    }));

    return NextResponse.json({
      overview: {
        totalTemplates: totalStats._count.id,
        totalDownloads: totalStats._sum.downloads || 0,
        totalStars: totalStats._sum.stars || 0,
        averageRating: totalStats._avg.averageRating || 0,
      },
      categories: categoryStats.map(cat => ({
        name: cat.category,
        templateCount: cat._count.id,
        totalDownloads: cat._sum.downloads || 0,
        averageRating: cat._avg.averageRating || 0,
      })),
      trendingTemplates: transformedTrendingTemplates,
      topAuthors: transformedTopAuthors,
      downloadHistory,
      ratingDistribution: [1, 2, 3, 4, 5].map(rating => ({
        rating,
        count: ratingDistribution.find(r => r.rating === rating)?._count.rating || 0,
      })),
      topTags: tagStats,
      timeframe,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching marketplace analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

async function getTemplateAnalytics(templateId: string, startDate: Date, session: any) {
  try {
    // Check if user has access to this template's analytics
    const template = await prisma.agentTemplate.findUnique({
      where: { id: templateId },
      select: { authorId: true, name: true },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Only template author or admin can view detailed analytics
    if (session?.user?.id !== template.authorId) {
      const user = await prisma.user.findUnique({
        where: { id: session?.user?.id },
        select: { role: true },
      });

      if (user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    const [downloadStats, reviewStats, downloadHistory, userDemographics, conversionMetrics] =
      await Promise.all([
        // Download statistics
        prisma.templateDownload.aggregate({
          where: {
            templateId,
            createdAt: { gte: startDate },
          },
          _count: { id: true },
        }),

        // Review statistics
        prisma.templateReview.aggregate({
          where: {
            templateId,
            createdAt: { gte: startDate },
          },
          _count: { id: true },
          _avg: { rating: true },
        }),

        // Download history
        prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as downloads
        FROM template_downloads
        WHERE template_id = ${templateId}
          AND created_at >= ${startDate}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,

        // User demographics (simplified)
        prisma.templateDownload.groupBy({
          by: ['userId'],
          where: {
            templateId,
            createdAt: { gte: startDate },
          },
          _count: { userId: true },
        }),

        // Conversion metrics (downloads to reviews)
        prisma.templateDownload.count({
          where: {
            templateId,
            createdAt: { gte: startDate },
            user: {
              templateReviews: {
                some: {
                  templateId,
                },
              },
            },
          },
        }),
      ]);

    return NextResponse.json({
      templateId,
      templateName: template.name,
      analytics: {
        downloads: {
          total: downloadStats._count.id,
          history: downloadHistory,
        },
        reviews: {
          total: reviewStats._count.id,
          averageRating: reviewStats._avg.rating || 0,
        },
        users: {
          uniqueDownloaders: userDemographics.length,
        },
        conversion: {
          downloadToReview:
            downloadStats._count.id > 0 ? (conversionMetrics / downloadStats._count.id) * 100 : 0,
        },
      },
      timeframe: startDate.toISOString(),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching template analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch template analytics' }, { status: 500 });
  }
}

async function getUserAnalytics(userId: string, startDate: Date, session: any) {
  try {
    // Check if user has access to these analytics
    if (session?.user?.id !== userId) {
      const user = await prisma.user.findUnique({
        where: { id: session?.user?.id },
        select: { role: true },
      });

      if (user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    const [userTemplates, totalDownloads, totalReviews, reputationHistory] = await Promise.all([
      // User's templates
      prisma.agentTemplate.findMany({
        where: {
          authorId: userId,
          status: 'PUBLISHED',
        },
        select: {
          id: true,
          name: true,
          downloads: true,
          stars: true,
          averageRating: true,
          createdAt: true,
        },
      }),

      // Total downloads across all templates
      prisma.templateDownload.count({
        where: {
          template: {
            authorId: userId,
          },
          createdAt: { gte: startDate },
        },
      }),

      // Reviews received
      prisma.templateReview.count({
        where: {
          template: {
            authorId: userId,
          },
          createdAt: { gte: startDate },
        },
      }),

      // Reputation history (simplified)
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          reputation: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      userId,
      analytics: {
        templates: {
          total: userTemplates.length,
          totalDownloads: userTemplates.reduce((sum, t) => sum + t.downloads, 0),
          totalStars: userTemplates.reduce((sum, t) => sum + t.stars, 0),
          averageRating:
            userTemplates.length > 0
              ? userTemplates.reduce((sum, t) => sum + t.averageRating, 0) / userTemplates.length
              : 0,
        },
        engagement: {
          recentDownloads: totalDownloads,
          recentReviews: totalReviews,
        },
        reputation: reputationHistory?.reputation || 0,
        templates: userTemplates,
      },
      timeframe: startDate.toISOString(),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch user analytics' }, { status: 500 });
  }
}
