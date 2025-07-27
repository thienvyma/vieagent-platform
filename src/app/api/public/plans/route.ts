import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/public/plans - Lấy danh sách plans công khai
export async function GET() {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        currency: true,
        interval: true,
        isActive: true,
        maxAgents: true,
        maxConversations: true,
        maxStorage: true,
        maxApiCalls: true,
        enableGoogleIntegration: true,
        enableHandoverSystem: true,
        enableAnalytics: true,
        enableCustomBranding: true,
        enablePrioritySupport: true,
      },
      orderBy: { price: 'asc' },
    });

    // Generate features based on plan capabilities
    const plansWithFeatures = plans.map(plan => ({
      ...plan,
      features: generatePlanFeatures(plan),
      limits: {
        agents: plan.maxAgents,
        conversations: plan.maxConversations,
        messages: plan.maxApiCalls,
      },
      popular: plan.name === 'Pro', // Mark PRO as popular
    }));

    return NextResponse.json({
      success: true,
      data: plansWithFeatures,
    });
  } catch (error) {
    console.error('Error fetching public plans:', error);
    return NextResponse.json(
      { success: false, error: 'Không thể tải danh sách gói dịch vụ' },
      { status: 500 }
    );
  }
}

function generatePlanFeatures(plan: any): string[] {
  const features: string[] = [];

  // Basic features for all plans
  features.push(`${plan.maxAgents === -1 ? 'Unlimited' : plan.maxAgents} AI Agents`);
  features.push(
    `${plan.maxConversations === -1 ? 'Unlimited' : plan.maxConversations} Conversations`
  );
  features.push(
    `${plan.maxApiCalls === -1 ? 'Unlimited' : plan.maxApiCalls.toLocaleString()} API Calls/month`
  );

  // Advanced features based on plan type
  if (plan.enableGoogleIntegration) {
    features.push('Google Integration (Calendar, Gmail, Sheets)');
  }

  if (plan.enableHandoverSystem) {
    features.push('AI to Human Handover System');
  }

  if (plan.enableAnalytics) {
    features.push('Advanced Analytics & Reports');
  }

  if (plan.enableCustomBranding) {
    features.push('Custom Branding & White-label');
  }

  if (plan.enablePrioritySupport) {
    features.push('Priority Support');
  }

  // Add storage info
  if (plan.maxStorage > 0) {
    features.push(`${plan.maxStorage}GB Storage`);
  }

  // Plan-specific features based on name
  const planName = plan.name.toLowerCase();
  if (planName.includes('trial')) {
    features.push('7-day trial period');
    features.push('Basic support');
  } else if (planName.includes('basic')) {
    features.push('Email support');
    features.push('Basic templates');
  } else if (planName.includes('pro')) {
    features.push('Phone support');
    features.push('Advanced templates');
    features.push('Custom integrations');
  } else if (planName.includes('enterprise')) {
    features.push('Dedicated account manager');
    features.push('Custom development');
    features.push('SLA guarantee');
  } else if (planName.includes('ultimate')) {
    features.push('24/7 premium support');
    features.push('Unlimited everything');
    features.push('Enterprise security');
  }

  return features;
}
