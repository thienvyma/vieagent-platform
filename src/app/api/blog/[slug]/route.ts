import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    // Fetch the blog post with author information
    const post = await prisma.blog.findUnique({
      where: {
        slug,
        status: 'PUBLISHED',
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

    if (!post) {
      return NextResponse.json({ success: false, error: 'Blog post not found' }, { status: 404 });
    }

    // Fetch related posts (same category or similar tags)
    const relatedPosts = await prisma.blog.findMany({
      where: {
        status: 'PUBLISHED',
        id: { not: post.id },
        OR: [
          { categories: post.categories },
          // You could add more sophisticated related post logic here
        ],
      },
      include: {
        author: {
          select: {
            name: true,
          },
        },
      },
      take: 3,
      orderBy: {
        publishedAt: 'desc',
      },
    });

    // Transform related posts
    const transformedRelatedPosts = relatedPosts.map(relatedPost => ({
      id: relatedPost.id,
      title: relatedPost.title,
      slug: relatedPost.slug,
      excerpt: relatedPost.excerpt || '',
      publishedAt: relatedPost.publishedAt?.toISOString(),
      author: {
        name: relatedPost.author?.name || 'Anonymous',
      },
      viewCount: relatedPost.viewCount,
      readingTime: 5, // Default reading time, you can calculate this
    }));

    return NextResponse.json({
      success: true,
      post: {
        ...post,
        publishedAt: post.publishedAt?.toISOString(),
      },
      relatedPosts: transformedRelatedPosts,
    });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
