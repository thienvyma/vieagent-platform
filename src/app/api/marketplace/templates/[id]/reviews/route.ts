import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CreateReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(1).max(1000),
  anonymous: z.boolean().default(false),
});

const UpdateReviewSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  comment: z.string().min(1).max(1000).optional(),
  anonymous: z.boolean().optional(),
});

// GET /api/marketplace/templates/[id]/reviews - Get template reviews
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'newest';
    const rating = searchParams.get('rating');

    const skip = (page - 1) * limit;
    const templateId = params.id;

    // Build where clause
    const where: any = {
      templateId,
      status: 'PUBLISHED',
    };

    if (rating) {
      where.rating = parseInt(rating);
    }

    // Build orderBy clause
    let orderBy: any = { createdAt: 'desc' };
    switch (sortBy) {
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'highest':
        orderBy = { rating: 'desc' };
        break;
      case 'lowest':
        orderBy = { rating: 'asc' };
        break;
      case 'helpful':
        orderBy = { helpfulVotes: 'desc' };
        break;
    }

    const [reviews, total, ratingDistribution] = await Promise.all([
      prisma.templateReview.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              verified: true,
            },
          },
          helpfulVotes: {
            select: {
              userId: true,
              helpful: true,
            },
          },
        },
      }),
      prisma.templateReview.count({ where }),
      prisma.templateReview.groupBy({
        by: ['rating'],
        where: { templateId, status: 'PUBLISHED' },
        _count: {
          rating: true,
        },
      }),
    ]);

    // Transform reviews for response
    const transformedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt.toISOString(),
      user: review.anonymous
        ? null
        : {
            id: review.user.id,
            name: review.user.name,
            avatar: review.user.image,
            verified: review.user.verified,
          },
      helpfulVotes: review.helpfulVotes.filter(v => v.helpful).length,
      unhelpfulVotes: review.helpfulVotes.filter(v => !v.helpful).length,
      anonymous: review.anonymous,
      verified: review.verified,
    }));

    // Calculate rating distribution
    const ratingDist = [1, 2, 3, 4, 5].map(rating => {
      const found = ratingDistribution.find(r => r.rating === rating);
      return {
        rating,
        count: found?._count.rating || 0,
      };
    });

    return NextResponse.json({
      reviews: transformedReviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      ratingDistribution: ratingDist,
      averageRating:
        reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

// POST /api/marketplace/templates/[id]/reviews - Create review
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const templateId = params.id;
    const body = await request.json();
    const validatedData = CreateReviewSchema.parse(body);

    // Check if template exists
    const template = await prisma.agentTemplate.findUnique({
      where: { id: templateId },
      select: { id: true, authorId: true },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Check if user is trying to review their own template
    if (template.authorId === session.user.id) {
      return NextResponse.json({ error: 'Cannot review your own template' }, { status: 403 });
    }

    // Check if user already reviewed this template
    const existingReview = await prisma.templateReview.findUnique({
      where: {
        userId_templateId: {
          userId: session.user.id,
          templateId,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this template' },
        { status: 409 }
      );
    }

    // Check if user has downloaded the template (optional requirement)
    const hasDownloaded = await prisma.templateDownload.findFirst({
      where: {
        templateId,
        userId: session.user.id,
      },
    });

    // Create review
    const review = await prisma.templateReview.create({
      data: {
        ...validatedData,
        templateId,
        userId: session.user.id,
        verified: !!hasDownloaded, // Mark as verified if user downloaded
        status: 'PUBLISHED',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            verified: true,
          },
        },
      },
    });

    // Update template average rating
    const allReviews = await prisma.templateReview.findMany({
      where: { templateId, status: 'PUBLISHED' },
      select: { rating: true },
    });

    const averageRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await prisma.agentTemplate.update({
      where: { id: templateId },
      data: {
        averageRating,
        reviewCount: allReviews.length,
      },
    });

    // Update author reputation based on rating
    const reputationChange = (validatedData.rating - 3) * 0.1; // -0.2 to +0.2
    await prisma.user.update({
      where: { id: template.authorId },
      data: {
        reputation: {
          increment: reputationChange,
        },
      },
    });

    return NextResponse.json({
      id: review.id,
      message: 'Review created successfully',
      review: {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt.toISOString(),
        user: review.anonymous
          ? null
          : {
              id: review.user.id,
              name: review.user.name,
              avatar: review.user.image,
              verified: review.user.verified,
            },
        verified: review.verified,
        anonymous: review.anonymous,
      },
    });
  } catch (error) {
    console.error('Error creating review:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}

// PUT /api/marketplace/templates/[id]/reviews - Update review
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const templateId = params.id;
    const body = await request.json();
    const { reviewId, ...updateData } = body;
    const validatedData = UpdateReviewSchema.parse(updateData);

    // Check if review exists and user owns it
    const review = await prisma.templateReview.findUnique({
      where: { id: reviewId },
      select: { userId: true, templateId: true },
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (review.userId !== session.user.id) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    if (review.templateId !== templateId) {
      return NextResponse.json(
        { error: 'Review does not belong to this template' },
        { status: 400 }
      );
    }

    // Update review
    const updatedReview = await prisma.templateReview.update({
      where: { id: reviewId },
      data: validatedData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            verified: true,
          },
        },
      },
    });

    // Recalculate template average rating if rating changed
    if (validatedData.rating !== undefined) {
      const allReviews = await prisma.templateReview.findMany({
        where: { templateId, status: 'PUBLISHED' },
        select: { rating: true },
      });

      const averageRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

      await prisma.agentTemplate.update({
        where: { id: templateId },
        data: { averageRating },
      });
    }

    return NextResponse.json({
      id: updatedReview.id,
      message: 'Review updated successfully',
    });
  } catch (error) {
    console.error('Error updating review:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}

// DELETE /api/marketplace/templates/[id]/reviews - Delete review
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('reviewId');

    if (!reviewId) {
      return NextResponse.json({ error: 'Review ID required' }, { status: 400 });
    }

    // Check if review exists and user owns it
    const review = await prisma.templateReview.findUnique({
      where: { id: reviewId },
      select: { userId: true, templateId: true },
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (review.userId !== session.user.id && user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Delete review
    await prisma.templateReview.delete({
      where: { id: reviewId },
    });

    // Recalculate template average rating
    const allReviews = await prisma.templateReview.findMany({
      where: { templateId: review.templateId, status: 'PUBLISHED' },
      select: { rating: true },
    });

    const averageRating =
      allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
        : 0;

    await prisma.agentTemplate.update({
      where: { id: review.templateId },
      data: {
        averageRating,
        reviewCount: allReviews.length,
      },
    });

    return NextResponse.json({
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
