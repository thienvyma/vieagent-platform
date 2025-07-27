import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    // Find the blog post by slug first
    const post = await prisma.blog.findUnique({
      where: { slug },
    });

    if (!post) {
      return NextResponse.json({ success: false, error: 'Blog post not found' }, { status: 404 });
    }

    // Increment like count
    const updatedPost = await prisma.blog.update({
      where: { id: post.id },
      data: {
        likeCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      likeCount: updatedPost.likeCount,
      message: 'Post liked successfully',
    });
  } catch (error) {
    console.error('Error liking blog post:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
