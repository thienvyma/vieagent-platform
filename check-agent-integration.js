const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAgentIntegration() {
  try {
    console.log('🔍 Kiểm tra tích hợp Google Calendar trong agents...\n');

    // Lấy tất cả agents
    const agents = await prisma.agent.findMany({
      select: {
        id: true,
        name: true,
        googleServices: true,
        userId: true,
        user: {
          select: {
            id: true,
            email: true,
            googleAccounts: {
              select: {
                id: true,
                isActive: true,
                scopes: true
              }
            }
          }
        }
      }
    });

    console.log(`📊 Tìm thấy ${agents.length} agents:\n`);

    for (const agent of agents) {
      console.log(`🤖 Agent: ${agent.name} (ID: ${agent.id})`);
      console.log(`👤 User: ${agent.user.email}`);
      
      // Parse Google services
      let googleServices = {};
      try {
        googleServices = agent.googleServices ? JSON.parse(agent.googleServices) : {};
      } catch (e) {
        console.log('⚠️  Lỗi parse googleServices:', e.message);
      }

      console.log('📋 Google Services:', googleServices);
      console.log('📅 Calendar enabled:', googleServices.calendar ? '✅' : '❌');

      // Kiểm tra Google account
      const googleAccounts = agent.user.googleAccounts;
      console.log(`🔗 Google Accounts: ${googleAccounts.length}`);
      
      for (const account of googleAccounts) {
        console.log(`  - Account ID: ${account.id}`);
        console.log(`  - Active: ${account.isActive ? '✅' : '❌'}`);
        console.log(`  - Scopes: ${account.scopes || 'None'}`);
        
        // Kiểm tra calendar scope
        const hasCalendarScope = account.scopes && account.scopes.includes('calendar');
        console.log(`  - Calendar scope: ${hasCalendarScope ? '✅' : '❌'}`);
      }

      console.log('─'.repeat(50));
    }

    // Kiểm tra Google Calendar events
    const calendarEvents = await prisma.googleCalendarEvent.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        summary: true,
        startTime: true,
        agentId: true,
        aiGenerated: true
      }
    });

    console.log(`\n📅 Recent Calendar Events: ${calendarEvents.length}`);
    for (const event of calendarEvents) {
      console.log(`  - ${event.summary} (${event.startTime})`);
      console.log(`    Agent ID: ${event.agentId || 'None'}`);
      console.log(`    AI Generated: ${event.aiGenerated ? '✅' : '❌'}`);
    }

  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAgentIntegration(); 