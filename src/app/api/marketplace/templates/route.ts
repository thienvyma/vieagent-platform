import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const CreateTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.enum([
    'business',
    'customer_service',
    'education',
    'healthcare',
    'technology',
    'creative',
    'research',
    'personal',
  ]),
  tags: z.array(z.string()),
  configuration: z.object({
    provider: z.string(),
    model: z.string(),
    temperature: z.number(),
    maxTokens: z.number(),
    systemPrompt: z.string(),
    tools: z.array(z.string()),
    ragEnabled: z.boolean(),
    autoLearning: z.boolean(),
  }),
  preview: z
    .object({
      examples: z.array(z.string()),
      useCases: z.array(z.string()),
    })
    .optional(),
  visibility: z.enum(['public', 'private', 'community']).default('public'),
  premium: z.boolean().default(false),
});

const UpdateTemplateSchema = CreateTemplateSchema.partial();

// GET /api/marketplace/templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const rating = searchParams.get('rating') ? parseFloat(searchParams.get('rating')!) : undefined;
    const sortBy = searchParams.get('sortBy') || 'popular';
    const priceType = searchParams.get('priceType') || 'all';
    const verified = searchParams.get('verified') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {
      status: 'PUBLISHED', // ✅ FIXED: Use uppercase enum value
      visibility: { in: ['public', 'community'] },
    };

    if (category && category !== 'all') {
      where.category = category;
    }

    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    if (rating) {
      where.rating = { gte: rating };
    }

    if (priceType !== 'all') {
      where.premium = priceType === 'premium';
    }

    if (verified) {
      where.verified = true;
    }

    // Build orderBy clause
    let orderBy: any = {};
    switch (sortBy) {
      case 'popular':
        orderBy = { downloads: 'desc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'rating':
        orderBy = { rating: 'desc' };
        break;
      case 'downloads':
        orderBy = { downloads: 'desc' };
        break;
      default:
        orderBy = { downloads: 'desc' };
    }

    const templates = await prisma.agentTemplate.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            verified: true,
          },
        },
        _count: {
          select: {
            downloads: true,
            reviews: true,
            stars: true,
          },
        },
      },
    });

    const total = await prisma.agentTemplate.count({ where });

    return NextResponse.json({
      templates,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

// POST /api/marketplace/templates
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = CreateTemplateSchema.parse(body);

    const template = await prisma.agentTemplate.create({
      data: {
        ...validatedData,
        authorId: session.user.id,
        version: '1.0.0',
        status: 'PUBLISHED',
        verified: false,
        featured: false,
        downloads: 0,
        rating: 0,
        configuration: validatedData.configuration as any,
        preview: validatedData.preview as any,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            verified: true,
          },
        },
        _count: {
          select: {
            downloads: true,
            reviews: true,
            stars: true,
          },
        },
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating template:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}

// PUT /api/marketplace/templates
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    const validatedData = UpdateTemplateSchema.parse(updateData);

    // Check if user owns the template
    const existingTemplate = await prisma.agentTemplate.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    if (existingTemplate.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const template = await prisma.agentTemplate.update({
      where: { id },
      data: {
        ...validatedData,
        configuration: validatedData.configuration as any,
        preview: validatedData.preview as any,
        updatedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            verified: true,
          },
        },
        _count: {
          select: {
            downloads: true,
            reviews: true,
            stars: true,
          },
        },
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating template:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

// DELETE /api/marketplace/templates
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    // Check if user owns the template
    const existingTemplate = await prisma.agentTemplate.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    if (existingTemplate.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.agentTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
