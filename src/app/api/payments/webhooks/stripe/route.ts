import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('Processing Stripe webhook event:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.created':
        await handleCustomerCreated(event.data.object as Stripe.Customer);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// Handler functions
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id);
  
  try {
    // Find the user by customer ID or email
    const customerId = paymentIntent.customer as string;
    const user = await findUserByCustomerId(customerId);
    
    if (!user) {
      console.error('User not found for payment intent:', paymentIntent.id);
      return;
    }

    // Update subscription status if this is a subscription payment
    if (paymentIntent.metadata?.subscriptionId) {
      await prisma.subscription.update({
        where: { id: paymentIntent.metadata.subscriptionId },
        data: {
          paymentStatus: 'COMPLETED',
          updatedAt: new Date(),
        },
      });
    }

    // Create payment record
    await prisma.bankTransfer.create({
      data: {
        userId: user.id,
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency.toUpperCase(),
        status: 'COMPLETED',
        paymentMethod: 'STRIPE',
        transactionId: paymentIntent.id,
        description: `Payment for ${paymentIntent.metadata?.planName || 'subscription'}`,
        createdAt: new Date(),
      },
    });

    console.log('Payment processed successfully for user:', user.id);
  } catch (error) {
    console.error('Error processing payment success:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment failed:', paymentIntent.id);
  
  try {
    const customerId = paymentIntent.customer as string;
    const user = await findUserByCustomerId(customerId);
    
    if (!user) {
      console.error('User not found for failed payment:', paymentIntent.id);
      return;
    }

    // Update subscription status if this is a subscription payment
    if (paymentIntent.metadata?.subscriptionId) {
      await prisma.subscription.update({
        where: { id: paymentIntent.metadata.subscriptionId },
        data: {
          paymentStatus: 'FAILED',
          updatedAt: new Date(),
        },
      });
    }

    // Create failed payment record
    await prisma.bankTransfer.create({
      data: {
        userId: user.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        status: 'FAILED',
        paymentMethod: 'STRIPE',
        transactionId: paymentIntent.id,
        description: `Failed payment for ${paymentIntent.metadata?.planName || 'subscription'}`,
        createdAt: new Date(),
      },
    });

    // TODO: Send notification email to user about failed payment
    console.log('Failed payment recorded for user:', user.id);
  } catch (error) {
    console.error('Error processing payment failure:', error);
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Subscription created:', subscription.id);
  
  try {
    const customerId = subscription.customer as string;
    const user = await findUserByCustomerId(customerId);
    
    if (!user) {
      console.error('User not found for subscription:', subscription.id);
      return;
    }

    // Find the subscription plan
    const priceId = subscription.items.data[0]?.price.id;
    const plan = await prisma.subscriptionPlan.findFirst({
      where: { 
        // Assuming you store Stripe price ID in a metadata field
        name: subscription.metadata?.planName || 'Unknown',
      },
    });

    if (!plan) {
      console.error('Plan not found for subscription:', subscription.id);
      return;
    }

    // Create subscription record
    await prisma.subscription.create({
      data: {
        userId: user.id,
        planId: plan.id,
        status: 'ACTIVE',
        startDate: new Date(subscription.current_period_start * 1000),
        endDate: new Date(subscription.current_period_end * 1000),
        amount: subscription.items.data[0]?.price.unit_amount! / 100,
        currency: subscription.currency.toUpperCase(),
        paymentStatus: 'COMPLETED',
        autoRenew: !subscription.cancel_at_period_end,
        transactionId: subscription.id,
        createdAt: new Date(),
      },
    });

    console.log('Subscription created for user:', user.id);
  } catch (error) {
    console.error('Error creating subscription:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Subscription updated:', subscription.id);
  
  try {
    // Update subscription in database
    await prisma.subscription.updateMany({
      where: { transactionId: subscription.id },
      data: {
        status: subscription.status === 'active' ? 'ACTIVE' : 'CANCELLED',
        endDate: new Date(subscription.current_period_end * 1000),
        autoRenew: !subscription.cancel_at_period_end,
        updatedAt: new Date(),
      },
    });

    console.log('Subscription updated:', subscription.id);
  } catch (error) {
    console.error('Error updating subscription:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id);
  
  try {
    // Cancel subscription in database
    await prisma.subscription.updateMany({
      where: { transactionId: subscription.id },
      data: {
        status: 'CANCELLED',
        endDate: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('Subscription cancelled:', subscription.id);
  } catch (error) {
    console.error('Error cancelling subscription:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Invoice payment succeeded:', invoice.id);
  
  try {
    const customerId = invoice.customer as string;
    const user = await findUserByCustomerId(customerId);
    
    if (!user) {
      console.error('User not found for invoice:', invoice.id);
      return;
    }

    // Create payment record for invoice
    await prisma.bankTransfer.create({
      data: {
        userId: user.id,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency.toUpperCase(),
        status: 'COMPLETED',
        paymentMethod: 'STRIPE',
        transactionId: invoice.id,
        description: `Invoice payment: ${invoice.description || 'Subscription'}`,
        createdAt: new Date(),
      },
    });

    console.log('Invoice payment processed for user:', user.id);
  } catch (error) {
    console.error('Error processing invoice payment:', error);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Invoice payment failed:', invoice.id);
  
  try {
    const customerId = invoice.customer as string;
    const user = await findUserByCustomerId(customerId);
    
    if (!user) {
      console.error('User not found for failed invoice:', invoice.id);
      return;
    }

    // TODO: Send notification email about failed payment
    // TODO: Implement retry logic or downgrade plan
    
    console.log('Invoice payment failed for user:', user.id);
  } catch (error) {
    console.error('Error processing invoice payment failure:', error);
  }
}

async function handleCustomerCreated(customer: Stripe.Customer) {
  console.log('Customer created:', customer.id);
  
  try {
    // Find user by email and update with Stripe customer ID
    if (customer.email) {
      await prisma.user.updateMany({
        where: { email: customer.email },
        data: {
          // TODO: Add stripeCustomerId field to User model
          updatedAt: new Date(),
        },
      });
    }

    console.log('Customer linked to user:', customer.email);
  } catch (error) {
    console.error('Error linking customer:', error);
  }
}

// Helper function to find user by Stripe customer ID
async function findUserByCustomerId(customerId: string) {
  // TODO: Add stripeCustomerId field to User model
  // For now, we'll need to find by email from Stripe
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) {
      return null;
    }
    
    const email = (customer as Stripe.Customer).email;
    if (!email) {
      return null;
    }

    return await prisma.user.findUnique({
      where: { email },
    });
  } catch (error) {
    console.error('Error finding user by customer ID:', error);
    return null;
  }
} 