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

    if (!hasPermission(session.user.role as UserRole, 'view_blog')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Filters
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get posts with pagination
    const [posts, total] = await Promise.all([
      prisma.blog.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.blog.count({ where }),
    ]);

    // Get statistics
    const stats = await prisma.blog.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const statusCounts = {
      total: total,
      draft: stats.find(s => s.status === 'DRAFT')?._count.status || 0,
      published: stats.find(s => s.status === 'PUBLISHED')?._count.status || 0,
      scheduled: stats.find(s => s.status === 'SCHEDULED')?._count.status || 0,
      archived: stats.find(s => s.status === 'ARCHIVED')?._count.status || 0,
    };

    const response = {
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: statusCounts,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Blog posts fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role as UserRole, 'create_blog')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      slug,
      content,
      excerpt,
      featuredImage,
      status = 'DRAFT',
      categories,
      tags,
      metaTitle,
      metaDescription,
      keywords,
      publishedAt,
      isFeatured = false,
    } = body;

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    // Generate slug if not provided
    const finalSlug =
      slug ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    // Check if slug is unique
    const existingPost = await prisma.blog.findUnique({
      where: { slug: finalSlug },
    });

    if (existingPost) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }

    // Create blog post
    const post = await prisma.blog.create({
      data: {
        title,
        slug: finalSlug,
        content,
        excerpt,
        featuredImage,
        status,
        categories,
        tags,
        metaTitle,
        metaDescription,
        keywords,
        publishedAt:
          status === 'PUBLISHED' ? (publishedAt ? new Date(publishedAt) : new Date()) : null,
        isFeatured,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('Blog post creation error:', error);
    return NextResponse.json({ error: 'Failed to create blog post' }, { status: 500 });
  }
}
