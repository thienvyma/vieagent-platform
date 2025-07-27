import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    // For now, just log the webhook
    console.log('Webhook received:', { body, signature });

    // In production, you would:
    // 1. Verify webhook signature
    // 2. Handle different event types
    // 3. Update database accordingly

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
