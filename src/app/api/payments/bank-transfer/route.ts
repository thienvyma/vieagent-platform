import { NextRequest, NextResponse } from 'next/server';
// ✅ FIXED Phase 4D True Fix - Fix getServerSession import for next-auth v4
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      planId,
      amount,
      currency,
      bankName,
      accountNumber,
      accountHolder,
      transferDate,
      transferReference,
      notes,
    } = await request.json();

    // Validate required fields
    if (!planId || !amount || !bankName || !accountNumber || !accountHolder || !transferDate) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    // Get plan details
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Create bank transfer record
    const bankTransfer = await prisma.bankTransfer.create({
      data: {
        userId: (session.user as any).id,
        planId,
        amount: parseFloat(amount),
        currency: currency || 'USD',
        bankName,
        accountNumber,
        accountHolder,
        transferDate: new Date(transferDate),
        transferReference,
        notes,
        status: 'PENDING', // Will be verified manually by admin
      },
    });

    // Create pending subscription
    await prisma.subscription.create({
      data: {
        userId: (session.user as any).id,
        planId,
        amount: parseFloat(amount),
        currency: currency || 'USD',
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentMethod: 'bank_transfer',
        transactionId: bankTransfer.id,
        limits: {
          maxAgents: plan.maxAgents,
          maxConversations: plan.maxConversations,
          maxStorage: plan.maxStorage,
          maxApiCalls: plan.maxApiCalls,
        },
        currentUsage: {
          agents: 0,
          conversations: 0,
          storage: 0,
          apiCalls: 0,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        transferId: bankTransfer.id,
        message: 'Bank transfer submitted successfully. Please wait for admin verification.',
        bankInfo: {
          bankName: 'Techcombank',
          accountNumber: '19036843068014',
          accountHolder: 'NGUYEN THIEN VY',
          transferReference: bankTransfer.id,
          amount: parseFloat(amount),
          currency: currency || 'USD',
        },
      },
    });
  } catch (error) {
    console.error('Bank transfer creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET endpoint to retrieve bank transfer details
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transfers = await prisma.bankTransfer.findMany({
      where: {
        userId: (session.user as any).id,
      },
      include: {
        plan: {
          select: {
            name: true,
            price: true,
            currency: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: transfers,
    });
  } catch (error) {
    console.error('Bank transfer fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
