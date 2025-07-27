import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/marketplace/categories - Get all categories with statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('includeStats') === 'true';
    const includeTrending = searchParams.get('includeTrending') === 'true';

    // Base categories
    const categories = [
      {
        id: 'customer-service',
        name: 'Customer Service',
        description: 'Support agents for customer inquiries and problem resolution',
        icon: 'headphones',
        color: 'blue',
      },
      {
        id: 'content-creation',
        name: 'Content Creation',
        description: 'AI assistants for writing, editing, and content generation',
        icon: 'pen-tool',
        color: 'purple',
      },
      {
        id: 'data-science',
        name: 'Data Science',
        description: 'Analytics and data processing agents',
        icon: 'bar-chart',
        color: 'green',
      },
      {
        id: 'education',
        name: 'Education',
        description: 'Teaching and learning assistance agents',
        icon: 'graduation-cap',
        color: 'orange',
      },
      {
        id: 'healthcare',
        name: 'Healthcare',
        description: 'Medical information and healthcare support',
        icon: 'heart',
        color: 'red',
      },
      {
        id: 'finance',
        name: 'Finance',
        description: 'Financial analysis and advisory agents',
        icon: 'dollar-sign',
        color: 'yellow',
      },
      {
        id: 'marketing',
        name: 'Marketing',
        description: 'Marketing campaign and strategy assistants',
        icon: 'megaphone',
        color: 'pink',
      },
      {
        id: 'development',
        name: 'Development',
        description: 'Code generation and development assistance',
        icon: 'code',
        color: 'indigo',
      },
      {
        id: 'legal',
        name: 'Legal',
        description: 'Legal research and document assistance',
        icon: 'scale',
        color: 'gray',
      },
      {
        id: 'hr',
        name: 'Human Resources',
        description: 'HR processes and employee assistance',
        icon: 'users',
        color: 'teal',
      },
      {
        id: 'sales',
        name: 'Sales',
        description: 'Sales support and lead generation agents',
        icon: 'trending-up',
        color: 'cyan',
      },
      {
        id: 'productivity',
        name: 'Productivity',
        description: 'Task management and productivity enhancement',
        icon: 'check-circle',
        color: 'lime',
      },
    ];

    if (!includeStats && !includeTrending) {
      return NextResponse.json({ categories });
    }

    // Get statistics for each category
    const categoryStats = await Promise.all(
      categories.map(async category => {
        const stats = await prisma.agentTemplate.groupBy({
          by: ['category'],
          where: {
            category: category.name,
            status: 'PUBLISHED',
          },
          _count: {
            id: true,
          },
          _sum: {
            downloads: true,
            stars: true,
          },
          _avg: {
            averageRating: true,
          },
        });

        const categoryData = stats.find(s => s.category === category.name);

        return {
          ...category,
          stats: {
            templateCount: categoryData?._count.id || 0,
            totalDownloads: categoryData?._sum.downloads || 0,
            totalStars: categoryData?._sum.stars || 0,
            averageRating: categoryData?._avg.averageRating || 0,
          },
        };
      })
    );

    let result = { categories: categoryStats };

    if (includeTrending) {
      // Get trending categories (most downloads in last 30 days)
      const trendingData = await prisma.$queryRaw`
        SELECT 
          t.category,
          COUNT(d.id) as recent_downloads,
          COUNT(DISTINCT t.id) as template_count
        FROM agent_templates t
        LEFT JOIN template_downloads d ON t.id = d.template_id 
          AND d.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        WHERE t.status = 'published'
        GROUP BY t.category
        ORDER BY recent_downloads DESC
        LIMIT 5
      `;

      result = {
        ...result,
        trending: trendingData,
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

// POST /api/marketplace/categories - Create new category (Admin only)
export async function POST(request: NextRequest) {
  try {
    // This would require admin authentication
    // For now, return method not allowed
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
