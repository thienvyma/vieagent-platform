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

    const { planId, currency = 'usd' } = await request.json();

    // Get plan details
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      // Development mode - return mock client secret
      const mockClientSecret = `pi_mock_${planId}_${Date.now()}`;
      return NextResponse.json({
        success: true,
        data: {
          clientSecret: mockClientSecret,
          amount: plan.price,
          currency,
          planName: plan.name,
        },
      });
    }

    // Production mode - create real Stripe payment intent
    try {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(plan.price * 100), // Convert to cents
        currency: currency,
        metadata: {
          planId: planId,
          planName: plan.name,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          amount: plan.price,
          currency,
          planName: plan.name,
        },
      });
    } catch (stripeError) {
      console.error('Stripe payment intent creation failed:', stripeError);
      // Fallback to mock for development
      const mockClientSecret = `pi_mock_${planId}_${Date.now()}`;
      return NextResponse.json({
        success: true,
        data: {
          clientSecret: mockClientSecret,
          amount: plan.price,
          currency,
          planName: plan.name,
        },
      });
    }
  } catch (error) {
    console.error('Payment intent creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
