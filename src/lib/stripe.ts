import { loadStripe } from '@stripe/stripe-js';

// Client-side Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

// Helper function to format price for Stripe (in cents)
export const formatAmountForStripe = (amount: number, currency: string = 'usd'): number => {
  return Math.round(amount * 100); // Convert to cents
};

// Helper function to format amount from Stripe (cents to dollars)
export const formatAmountFromStripe = (amount: number, currency: string = 'usd'): number => {
  return amount / 100; // Convert from cents
};

// Server-side Stripe initialization
export const getStripe = () => {
  if (typeof window === 'undefined') {
    // Server-side
    const Stripe = require('stripe');
    return new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    });
  }
  return null;
};

export { stripePromise };
export default getStripe;
