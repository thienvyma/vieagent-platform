const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestData() {
  try {
    console.log('🚀 Creating test data for Platform Connectors...');

    // 1. Ensure admin user exists
    const adminEmail = 'admin@test.com';
    let adminUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (!adminUser) {
      console.log('👤 Creating admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      adminUser = await prisma.user.create({
        data: {
          email: adminEmail,
          name: 'Admin User',
          role: 'ADMIN',
          isActive: true,
          password: hashedPassword
        }
      });
      console.log('✅ Admin user created:', adminUser.email);
    } else {
      console.log('✅ Admin user already exists:', adminUser.email);
    }

    // 2. Create sample agents for testing
    const agentsData = [
      {
        name: 'Customer Support Bot',
        description: 'AI assistant chuyên hỗ trợ khách hàng 24/7 với khả năng trả lời các câu hỏi phổ biến và escalate khi cần thiết.',
        prompt: 'Bạn là một trợ lý AI chuyên nghiệp chuyên hỗ trợ khách hàng. Hãy luôn thân thiện, hữu ích và cung cấp thông tin chính xác. Nếu không biết câu trả lời, hãy thành thật nói và đề xuất liên hệ với nhân viên hỗ trợ.',
        model: 'gpt-4o-mini',
        maxTokens: 2000,
        temperature: 0.7,
        enableVietnameseMode: true,
        enableSmartDelay: true,
        messageDelayMs: 1500,
        status: 'ACTIVE'
      },
      {
        name: 'Sales Assistant',
        description: 'Bot bán hàng thông minh có thể tư vấn sản phẩm, báo giá và hướng dẫn khách hàng qua quy trình mua hàng.',
        prompt: 'Bạn là chuyên gia bán hàng AI. Nhiệm vụ của bạn là tư vấn sản phẩm, giải đáp thắc mắc và hỗ trợ khách hàng đưa ra quyết định mua hàng tốt nhất. Hãy luôn tích cực, chuyên nghiệp và tập trung vào nhu cầu của khách hàng.',
        model: 'gpt-4o-mini',
        maxTokens: 2500,
        temperature: 0.8,
        enableVietnameseMode: true,
        enableSmartDelay: true,
        messageDelayMs: 2000,
        status: 'ACTIVE'
      },
      {
        name: 'E-commerce Assistant',
        description: 'Trợ lý thương mại điện tử chuyên về product recommendations, order tracking và customer journey optimization.',
        prompt: 'Bạn là chuyên gia thương mại điện tử AI. Nhiệm vụ của bạn là tối ưu hóa trải nghiệm mua sắm, đề xuất sản phẩm phù hợp và hỗ trợ khách hàng trong toàn bộ customer journey.',
        model: 'gpt-4o-mini',
        maxTokens: 2200,
        temperature: 0.7,
        enableVietnameseMode: true,
        enableSmartDelay: true,
        messageDelayMs: 1600,
        status: 'ACTIVE'
      },
      {
        name: 'Technical Support',
        description: 'Trợ lý kỹ thuật AI giúp giải quyết các vấn đề technical, hướng dẫn sử dụng sản phẩm và troubleshooting.',
        prompt: 'Bạn là chuyên gia kỹ thuật AI. Hãy giúp người dùng giải quyết các vấn đề kỹ thuật một cách chi tiết và dễ hiểu. Luôn cung cấp hướng dẫn từng bước và đề xuất các giải pháp thay thế nếu có.',
        model: 'gpt-4o-mini',
        maxTokens: 3000,
        temperature: 0.3,
        enableVietnameseMode: true,
        enableSmartDelay: false,
        messageDelayMs: 1000,
        status: 'ACTIVE'
      }
    ];

    // Delete existing test agents to avoid duplicates
    await prisma.agent.deleteMany({
      where: {
        userId: adminUser.id,
        name: {
          in: agentsData.map(agent => agent.name)
        }
      }
    });

    console.log('🤖 Creating sample agents...');
    const createdAgents = [];

    for (const agentData of agentsData) {
      const agent = await prisma.agent.create({
        data: {
          ...agentData,
          userId: adminUser.id
        }
      });
      createdAgents.push(agent);
      console.log(`✅ Created agent: ${agent.name}`);
    }

    console.log('\n🎉 TEST DATA CREATION COMPLETE!');
    console.log('==================================');
    console.log('👤 Admin User:', adminUser.email);
    console.log('🔐 Password:', 'admin123');
    console.log('🤖 Agents Created:', createdAgents.length);

    console.log('\n🌐 Ready for Platform Connector Testing!');
    console.log('Navigate to: http://localhost:3000/dashboard/deployment');
    console.log('Tab: Platform Connectors');

    console.log('\n📋 Test Scenarios:');
    console.log('1. 🌐 Web Integration: Customer Support Bot');
    console.log('2. 📘 Facebook Integration: Sales Assistant');  
    console.log('3. 💬 Zalo Integration: E-commerce Assistant');
    console.log('4. 🤖 Technical Support: Multi-platform deployment');

    console.log('\n🔗 Available Agents for Testing:');
    createdAgents.forEach((agent, index) => {
      console.log(`${index + 1}. ${agent.name} (${agent.status})`);
    });

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData(); 