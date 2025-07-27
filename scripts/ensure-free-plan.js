const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function ensureFreePlan() {
  try {
    // Check if FREE plan exists
    const freePlan = await prisma.subscriptionPlan.findFirst({
      where: { name: 'FREE' }
    });

    if (!freePlan) {
      console.log('🔄 Creating FREE plan...');
      
      const newFreePlan = await prisma.subscriptionPlan.create({
        data: {
          name: 'FREE',
          description: 'Gói miễn phí với tính năng cơ bản',
          price: 0,
          currency: 'USD',
          interval: 'month',
          maxAgents: 1,
          maxConversations: 100,
          maxStorage: 1, // 1GB
          maxApiCalls: 1000,
          enableGoogleIntegration: false,
          enableHandoverSystem: false,
          enableAnalytics: false,
          enableCustomBranding: false,
          enablePrioritySupport: false,
          isActive: true,
          isPopular: false,
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      });

      console.log('✅ FREE plan created successfully:', newFreePlan.id);
    } else {
      console.log('✅ FREE plan already exists:', freePlan.id);
    }

    // Also check other basic plans
    const basicPlans = [
      {
        name: 'BASIC',
        description: 'Gói cơ bản cho cá nhân',
        price: 9.99,
        maxAgents: 3,
        maxConversations: 1000,
        maxStorage: 5,
        maxApiCalls: 10000,
        enableGoogleIntegration: true,
        sortOrder: 1,
      },
      {
        name: 'PRO',
        description: 'Gói chuyên nghiệp cho doanh nghiệp nhỏ',
        price: 29.99,
        maxAgents: 10,
        maxConversations: 5000,
        maxStorage: 20,
        maxApiCalls: 50000,
        enableGoogleIntegration: true,
        enableHandoverSystem: true,
        enableAnalytics: true,
        isPopular: true,
        sortOrder: 2,
      },
      {
        name: 'ENTERPRISE',
        description: 'Gói doanh nghiệp với tính năng đầy đủ',
        price: 99.99,
        maxAgents: -1, // Unlimited
        maxConversations: -1,
        maxStorage: 100,
        maxApiCalls: -1,
        enableGoogleIntegration: true,
        enableHandoverSystem: true,
        enableAnalytics: true,
        enableCustomBranding: true,
        enablePrioritySupport: true,
        sortOrder: 3,
      }
    ];

    for (const planData of basicPlans) {
      const existingPlan = await prisma.subscriptionPlan.findFirst({
        where: { name: planData.name }
      });

      if (!existingPlan) {
        console.log(`🔄 Creating ${planData.name} plan...`);
        
        const newPlan = await prisma.subscriptionPlan.create({
          data: {
            ...planData,
            currency: 'USD',
            interval: 'month',
            enableGoogleIntegration: planData.enableGoogleIntegration || false,
            enableHandoverSystem: planData.enableHandoverSystem || false,
            enableAnalytics: planData.enableAnalytics || false,
            enableCustomBranding: planData.enableCustomBranding || false,
            enablePrioritySupport: planData.enablePrioritySupport || false,
            isActive: true,
            isPopular: planData.isPopular || false,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        });

        console.log(`✅ ${planData.name} plan created successfully:`, newPlan.id);
      } else {
        console.log(`✅ ${planData.name} plan already exists:`, existingPlan.id);
      }
    }

  } catch (error) {
    console.error('❌ Error ensuring plans:', error);
  } finally {
    await prisma.$disconnect();
  }
}

ensureFreePlan(); 