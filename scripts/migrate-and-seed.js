const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
};

// Sample data for seeding
const sampleData = {
  subscriptionPlans: [
    {
      id: 'plan_free',
      name: 'Free',
      nameVi: 'Miễn phí',
      description: 'Perfect for getting started',
      descriptionVi: 'Hoàn hảo để bắt đầu',
      price: 0,
      currency: 'VND',
      interval: 'MONTHLY',
      features: [
        'Up to 3 AI Agents',
        '100 messages per month',
        'Basic templates',
        'Email support'
      ],
      featuresVi: [
        'Tối đa 3 AI Agent',
        '100 tin nhắn mỗi tháng',
        'Mẫu cơ bản',
        'Hỗ trợ email'
      ],
      maxAgents: 3,
      maxMessages: 100,
      maxKnowledge: 10,
      isActive: true,
      isPopular: false,
    },
    {
      id: 'plan_premium',
      name: 'Premium',
      nameVi: 'Cao cấp',
      description: 'Best for growing businesses',
      descriptionVi: 'Tốt nhất cho doanh nghiệp đang phát triển',
      price: 299000,
      currency: 'VND',
      interval: 'MONTHLY',
      features: [
        'Up to 10 AI Agents',
        '1000 messages per month',
        'Advanced templates',
        'Priority support',
        'Custom integrations'
      ],
      featuresVi: [
        'Tối đa 10 AI Agent',
        '1000 tin nhắn mỗi tháng',
        'Mẫu nâng cao',
        'Hỗ trợ ưu tiên',
        'Tích hợp tùy chỉnh'
      ],
      maxAgents: 10,
      maxMessages: 1000,
      maxKnowledge: 100,
      isActive: true,
      isPopular: true,
    },
    {
      id: 'plan_enterprise',
      name: 'Enterprise',
      nameVi: 'Doanh nghiệp',
      description: 'For large organizations',
      descriptionVi: 'Dành cho tổ chức lớn',
      price: 999000,
      currency: 'VND',
      interval: 'MONTHLY',
      features: [
        'Unlimited AI Agents',
        'Unlimited messages',
        'All templates',
        '24/7 support',
        'Custom development',
        'On-premise deployment'
      ],
      featuresVi: [
        'AI Agent không giới hạn',
        'Tin nhắn không giới hạn',
        'Tất cả mẫu',
        'Hỗ trợ 24/7',
        'Phát triển tùy chỉnh',
        'Triển khai tại chỗ'
      ],
      maxAgents: -1, // Unlimited
      maxMessages: -1, // Unlimited
      maxKnowledge: -1, // Unlimited
      isActive: true,
      isPopular: false,
    }
  ],
  
  agentTemplates: [
    {
      id: 'template_customer_service',
      name: 'Customer Service Agent',
      nameVi: 'Agent Chăm Sóc Khách Hàng',
      description: 'AI agent for customer support and service',
      descriptionVi: 'AI agent cho hỗ trợ và chăm sóc khách hàng',
      category: 'CUSTOMER_SERVICE',
      tags: ['customer-service', 'support', 'help'],
      prompt: `You are a helpful customer service agent. Your role is to:
1. Assist customers with their inquiries
2. Provide accurate information about products/services
3. Resolve issues professionally and efficiently
4. Escalate complex problems when necessary
5. Maintain a friendly and professional tone

Always be polite, patient, and helpful in your responses.`,
      promptVi: `Bạn là một nhân viên chăm sóc khách hàng hữu ích. Vai trò của bạn là:
1. Hỗ trợ khách hàng với các câu hỏi của họ
2. Cung cấp thông tin chính xác về sản phẩm/dịch vụ
3. Giải quyết vấn đề một cách chuyên nghiệp và hiệu quả
4. Chuyển các vấn đề phức tạp khi cần thiết
5. Duy trì giọng điệu thân thiện và chuyên nghiệp

Luôn lịch sự, kiên nhẫn và hữu ích trong các phản hồi của bạn.`,
      isActive: true,
      isPublic: true,
      downloads: 0,
      rating: 4.8,
    },
    {
      id: 'template_sales_assistant',
      name: 'Sales Assistant',
      nameVi: 'Trợ Lý Bán Hàng',
      description: 'AI agent for sales support and lead generation',
      descriptionVi: 'AI agent cho hỗ trợ bán hàng và tạo khách hàng tiềm năng',
      category: 'SALES',
      tags: ['sales', 'lead-generation', 'conversion'],
      prompt: `You are a professional sales assistant. Your objectives are to:
1. Qualify leads and understand customer needs
2. Present products/services that match customer requirements
3. Handle objections professionally
4. Guide customers through the buying process
5. Build rapport and trust with potential customers

Focus on providing value and solving customer problems rather than just selling.`,
      promptVi: `Bạn là một trợ lý bán hàng chuyên nghiệp. Mục tiêu của bạn là:
1. Đánh giá khách hàng tiềm năng và hiểu nhu cầu khách hàng
2. Giới thiệu sản phẩm/dịch vụ phù hợp với yêu cầu khách hàng
3. Xử lý phản đối một cách chuyên nghiệp
4. Hướng dẫn khách hàng qua quy trình mua hàng
5. Xây dựng mối quan hệ và niềm tin với khách hàng tiềm năng

Tập trung vào việc cung cấp giá trị và giải quyết vấn đề của khách hàng thay vì chỉ bán hàng.`,
      isActive: true,
      isPublic: true,
      downloads: 0,
      rating: 4.6,
    }
  ],
  
  globalSettings: [
    {
      key: 'app_name',
      value: 'VIEAgent',
      description: 'Application name',
      category: 'GENERAL',
      isPublic: true,
    },
    {
      key: 'app_version',
      value: '1.0.0',
      description: 'Current application version',
      category: 'GENERAL',
      isPublic: true,
    },
    {
      key: 'maintenance_mode',
      value: 'false',
      description: 'Enable maintenance mode',
      category: 'SYSTEM',
      isPublic: false,
    },
    {
      key: 'max_file_size',
      value: '10485760',
      description: 'Maximum file upload size in bytes (10MB)',
      category: 'UPLOAD',
      isPublic: false,
    },
    {
      key: 'allowed_file_types',
      value: 'pdf,txt,doc,docx,json,csv',
      description: 'Allowed file types for upload',
      category: 'UPLOAD',
      isPublic: false,
    },
    {
      key: 'default_model',
      value: 'gpt-3.5-turbo',
      description: 'Default AI model for new agents',
      category: 'AI',
      isPublic: false,
    },
    {
      key: 'rate_limit_requests',
      value: '100',
      description: 'Rate limit requests per window',
      category: 'SECURITY',
      isPublic: false,
    },
    {
      key: 'rate_limit_window',
      value: '900000',
      description: 'Rate limit window in milliseconds (15 minutes)',
      category: 'SECURITY',
      isPublic: false,
    }
  ]
};

// Migration functions
async function createAdminUser() {
  log.info('Creating admin user...');
  
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@vieagent.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';
  
  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });
  
  if (existingAdmin) {
    log.warning('Admin user already exists');
    return existingAdmin;
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(adminPassword, 12);
  
  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: adminEmail,
      name: 'Administrator',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
      emailVerified: new Date(),
      profile: {
        create: {
          firstName: 'Admin',
          lastName: 'User',
          bio: 'System Administrator',
          language: 'vi',
          timezone: 'Asia/Ho_Chi_Minh',
        }
      },
      settings: {
        create: {
          theme: 'light',
          language: 'vi',
          emailNotifications: true,
          pushNotifications: true,
        }
      }
    }
  });
  
  log.success(`Admin user created: ${adminEmail}`);
  return adminUser;
}

async function seedSubscriptionPlans() {
  log.info('Seeding subscription plans...');
  
  for (const plan of sampleData.subscriptionPlans) {
    const existingPlan = await prisma.subscriptionPlan.findUnique({
      where: { id: plan.id }
    });
    
    if (!existingPlan) {
      await prisma.subscriptionPlan.create({
        data: {
          ...plan,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      });
      log.success(`Created subscription plan: ${plan.name}`);
    } else {
      log.warning(`Subscription plan already exists: ${plan.name}`);
    }
  }
}

async function seedAgentTemplates() {
  log.info('Seeding agent templates...');
  
  for (const template of sampleData.agentTemplates) {
    const existingTemplate = await prisma.agentTemplate.findUnique({
      where: { id: template.id }
    });
    
    if (!existingTemplate) {
      await prisma.agentTemplate.create({
        data: {
          ...template,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      });
      log.success(`Created agent template: ${template.name}`);
    } else {
      log.warning(`Agent template already exists: ${template.name}`);
    }
  }
}

async function seedGlobalSettings() {
  log.info('Seeding global settings...');
  
  for (const setting of sampleData.globalSettings) {
    const existingSetting = await prisma.globalSettings.findUnique({
      where: { key: setting.key }
    });
    
    if (!existingSetting) {
      await prisma.globalSettings.create({
        data: {
          ...setting,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      });
      log.success(`Created global setting: ${setting.key}`);
    } else {
      log.warning(`Global setting already exists: ${setting.key}`);
    }
  }
}

async function createSampleAgent(userId) {
  log.info('Creating sample agent...');
  
  const existingAgent = await prisma.agent.findFirst({
    where: { userId, name: 'Sample Customer Service Agent' }
  });
  
  if (existingAgent) {
    log.warning('Sample agent already exists');
    return existingAgent;
  }
  
  const agent = await prisma.agent.create({
    data: {
      userId,
      name: 'Sample Customer Service Agent',
      description: 'A sample customer service agent for demonstration',
      prompt: sampleData.agentTemplates[0].prompt,
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 1000,
      isActive: true,
      visibility: 'PRIVATE',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  });
  
  log.success(`Created sample agent: ${agent.name}`);
  return agent;
}

async function assignFreeSubscription(userId) {
  log.info('Assigning free subscription...');
  
  const existingSubscription = await prisma.subscription.findFirst({
    where: { userId, status: 'ACTIVE' }
  });
  
  if (existingSubscription) {
    log.warning('User already has an active subscription');
    return existingSubscription;
  }
  
  const freePlan = await prisma.subscriptionPlan.findUnique({
    where: { id: 'plan_free' }
  });
  
  if (!freePlan) {
    log.error('Free plan not found');
    return null;
  }
  
  const subscription = await prisma.subscription.create({
    data: {
      userId,
      planId: freePlan.id,
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      amount: 0,
      currency: 'VND',
      paymentStatus: 'COMPLETED',
      autoRenew: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  });
  
  log.success('Free subscription assigned');
  return subscription;
}

async function cleanupExistingData() {
  log.warning('Cleaning up existing data...');
  
  // Delete in reverse order of dependencies
  await prisma.message.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.knowledge.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.userSettings.deleteMany({});
  await prisma.userProfile.deleteMany({});
  await prisma.agent.deleteMany({});
  
  log.success('Existing data cleaned up');
}

// Main migration function
async function main() {
  try {
    log.info('Starting database migration and seeding...');
    log.info('======================================');
    
    // Check if we should clean existing data
    const shouldCleanup = process.argv.includes('--cleanup');
    if (shouldCleanup) {
      await cleanupExistingData();
    }
    
    // Seed global data
    await seedSubscriptionPlans();
    await seedAgentTemplates();
    await seedGlobalSettings();
    
    // Create admin user
    const adminUser = await createAdminUser();
    
    // Assign free subscription to admin
    await assignFreeSubscription(adminUser.id);
    
    // Create sample agent
    await createSampleAgent(adminUser.id);
    
    log.info('======================================');
    log.success('Database migration and seeding completed successfully!');
    log.info('');
    log.info('Admin credentials:');
    log.info(`Email: ${process.env.ADMIN_EMAIL || 'admin@vieagent.com'}`);
    log.info(`Password: ${process.env.ADMIN_PASSWORD || 'admin123456'}`);
    log.info('');
    log.info('Next steps:');
    log.info('1. Change the admin password after first login');
    log.info('2. Configure your environment variables');
    log.info('3. Set up your AI provider API keys');
    log.info('4. Configure ChromaDB connection');
    log.info('5. Set up email service (SMTP)');
    log.info('6. Configure Stripe for payments');
    
  } catch (error) {
    log.error('Migration failed:');
    log.error(error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  main,
  createAdminUser,
  seedSubscriptionPlans,
  seedAgentTemplates,
  seedGlobalSettings,
  createSampleAgent,
  assignFreeSubscription,
  cleanupExistingData,
}; 