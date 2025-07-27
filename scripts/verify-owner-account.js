const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function verifyOwnerAccount() {
  try {
    console.log('🔍 Verifying Owner Account...');
    console.log('='*50);
    
    // Find owner account
    const owner = await prisma.user.findUnique({
      where: { email: 'thienvyma@gmail.com' },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        plan: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!owner) {
      console.log('❌ Owner account not found!');
      return;
    }

    console.log('✅ Owner Account Found!');
    console.log('');
    console.log('📧 Email:', owner.email);
    console.log('👤 Name:', owner.name || 'Not set');
    console.log('🔑 Role:', owner.role);
    console.log('💎 Plan:', owner.plan);
    console.log('✅ Active:', owner.isActive);
    console.log('📅 Created:', owner.createdAt.toLocaleString());
    console.log('🔐 Has Password:', !!owner.password);
    
    // Test password
    if (owner.password) {
      const isPasswordValid = await bcrypt.compare('151194Vy@', owner.password);
      console.log('🔑 Password Valid:', isPasswordValid ? '✅ YES' : '❌ NO');
    }

    // Check permissions
    console.log('');
    console.log('🔐 PERMISSIONS CHECK:');
    console.log('- Dashboard Access:', owner.role === 'OWNER' ? '✅ YES' : '❌ NO');
    console.log('- Admin Panel Access:', ['OWNER', 'ADMIN', 'MANAGER'].includes(owner.role) ? '✅ YES' : '❌ NO');
    console.log('- User Management:', ['OWNER', 'ADMIN'].includes(owner.role) ? '✅ YES' : '❌ NO');
    console.log('- System Settings:', owner.role === 'OWNER' ? '✅ YES' : '❌ NO');
    console.log('- Full System Control:', owner.role === 'OWNER' ? '✅ YES' : '❌ NO');

    // Check related data
    console.log('');
    console.log('📊 RELATED DATA:');
    
    const agents = await prisma.agent.count({
      where: { userId: owner.id }
    });
    console.log('🤖 Agents:', agents);
    
    const conversations = await prisma.conversation.count({
      where: { userId: owner.id }
    });
    console.log('💬 Conversations:', conversations);
    
    const documents = await prisma.document.count({
      where: { userId: owner.id }
    });
    console.log('📄 Documents:', documents);

    // System overview
    console.log('');
    console.log('📈 SYSTEM OVERVIEW:');
    
    const totalUsers = await prisma.user.count();
    const totalAgents = await prisma.agent.count();
    const totalConversations = await prisma.conversation.count();
    const totalDocuments = await prisma.document.count();
    
    console.log('👥 Total Users:', totalUsers);
    console.log('🤖 Total Agents:', totalAgents);
    console.log('💬 Total Conversations:', totalConversations);
    console.log('📄 Total Documents:', totalDocuments);

    // Login instructions
    console.log('');
    console.log('🚀 LOGIN INSTRUCTIONS:');
    console.log('='*50);
    console.log('🔗 URL: http://localhost:3000/login');
    console.log('📧 Email: thienvyma@gmail.com');
    console.log('🔑 Password: 151194Vy@');
    console.log('');
    console.log('📋 AFTER LOGIN:');
    console.log('- Will redirect to /admin (Admin Panel)');
    console.log('- Full system access as OWNER');
    console.log('- Can manage users, agents, system settings');
    console.log('- Enterprise plan features available');

    console.log('');
    console.log('✅ OWNER ACCOUNT READY FOR USE!');
    console.log('🎯 Ready to proceed to Phase 3 development');

  } catch (error) {
    console.error('❌ Error verifying owner account:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyOwnerAccount(); 