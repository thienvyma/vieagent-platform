import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch featured blogs from database
    const featuredBlogs = await prisma.blog.findMany({
      where: {
        status: 'PUBLISHED',
      },
      include: {
        author: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: 6, // Limit to 6 featured blogs
    });

    // Transform to match frontend interface
    const blogs = featuredBlogs.map(blog => ({
      id: blog.id,
      title: blog.title,
      excerpt: blog.excerpt || '',
      url: `/blog/${blog.slug}`,
      author: blog.author?.name || 'Admin',
      category: blog.categories || 'Uncategorized',
      publishedAt: blog.publishedAt?.toISOString(),
      viewCount: blog.viewCount || 0,
      tags: blog.tags ? JSON.parse(blog.tags) : [],
      type: 'blog_post',
    }));

    // Fetch featured testimonials from database
    const featuredTestimonials = await prisma.featuredContent.findMany({
      where: {
        type: 'testimonial',
        isActive: true,
      },
      orderBy: {
        position: 'desc',
      },
      take: 6,
    });

    // Transform testimonials - use company from excerpt or default
    const testimonials = featuredTestimonials.map((item: any) => ({
      id: item.id,
      author: item.author || 'Anonymous',
      company: item.content || 'Tech Company', // Use content field for company name
      excerpt: item.excerpt || '',
      rating: 5,
      type: 'testimonial',
    }));

    // Fetch featured announcements
    const featuredAnnouncements = await prisma.announcement.findMany({
      where: {
        isActive: true,
        isGlobal: true,
        OR: [{ startDate: null }, { startDate: { lte: new Date() } }],
        AND: [
          {
            OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
          },
        ],
      },
      include: {
        author: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        priority: 'desc',
      },
      take: 3,
    });

    // Transform announcements
    const announcements = featuredAnnouncements.map(item => ({
      id: item.id,
      title: item.title,
      excerpt: item.content.substring(0, 150) + (item.content.length > 150 ? '...' : ''),
      author: item.author?.name || 'Admin',
      publishedAt: item.createdAt.toISOString(),
      type: 'announcement',
      priority: item.priority,
      announcementType: item.type,
    }));

    return NextResponse.json({
      success: true,
      data: {
        blogs,
        testimonials,
        announcements,
        stats: {
          totalBlogs: blogs.length,
          totalTestimonials: testimonials.length,
          totalAnnouncements: announcements.length,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching featured content:', error);

    // Return empty data instead of fallback mock data
    return NextResponse.json({
      success: true,
      data: {
        blogs: [],
        testimonials: [],
        announcements: [],
      },
      note: 'Database error - returning empty data',
    });
  }
}
