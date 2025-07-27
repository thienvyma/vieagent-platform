import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/marketplace/templates/[id]/star
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
      select: { id: true },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Check if user already starred this template
    const existingStar = await prisma.templateStar.findUnique({
      where: {
        userId_templateId: {
          userId: session.user.id,
          templateId,
        },
      },
    });

    if (existingStar) {
      // Unstar the template
      await prisma.templateStar.delete({
        where: {
          userId_templateId: {
            userId: session.user.id,
            templateId,
          },
        },
      });

      return NextResponse.json({ starred: false });
    } else {
      // Star the template
      await prisma.templateStar.create({
        data: {
          userId: session.user.id,
          templateId,
          starredAt: new Date(),
        },
      });

      return NextResponse.json({ starred: true });
    }
  } catch (error) {
    console.error('Error starring template:', error);
    return NextResponse.json({ error: 'Failed to star template' }, { status: 500 });
  }
}

// GET /api/marketplace/templates/[id]/star
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templateId = params.id;

    const star = await prisma.templateStar.findUnique({
      where: {
        userId_templateId: {
          userId: session.user.id,
          templateId,
        },
      },
    });

    return NextResponse.json({ starred: !!star });
  } catch (error) {
    console.error('Error checking star status:', error);
    return NextResponse.json({ error: 'Failed to check star status' }, { status: 500 });
  }
}
