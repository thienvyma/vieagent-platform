const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function completeOwnerSetup() {
  try {
    console.log('🔧 Completing owner account setup...');
    
    // Find the owner
    const owner = await prisma.user.findUnique({
      where: { email: 'thienvyma@gmail.com' },
      include: {
        profile: true,
        settings: true
      }
    });

    if (!owner) {
      console.log('❌ Owner account not found!');
      return;
    }

    console.log('👤 Owner found:', owner.email);

    // Create profile if not exists
    if (!owner.profile) {
      console.log('📝 Creating user profile...');
      await prisma.userProfile.create({
        data: {
          userId: owner.id,
          firstName: 'Thien',
          lastName: 'Vy',
          company: 'AI Agent Platform',
          jobTitle: 'System Owner',
          bio: 'Platform Owner & Administrator',
          location: 'Vietnam',
          timezone: 'Asia/Ho_Chi_Minh'
        }
      });
      console.log('✅ User profile created!');
    } else {
      console.log('✅ User profile already exists');
    }

    // Create settings if not exists
    if (!owner.settings) {
      console.log('⚙️ Creating user settings...');
      await prisma.userSettings.create({
        data: {
          userId: owner.id,
          theme: 'dark',
          language: 'vi',
          timezone: 'Asia/Ho_Chi_Minh',
          emailNotifications: true,
          browserNotifications: true,
          weeklyReport: true,
          defaultModel: 'gpt-4',
          defaultTemperature: 0.7,
          defaultMaxTokens: 2000,
          profileVisible: true,
          dataSharing: false,
          analyticsOptIn: true
        }
      });
      console.log('✅ User settings created!');
    } else {
      console.log('✅ User settings already exist');
    }

    // Create email preferences if not exists
    const emailPrefs = await prisma.emailPreferences.findUnique({
      where: { userId: owner.id }
    });

    if (!emailPrefs) {
      console.log('📧 Creating email preferences...');
      await prisma.emailPreferences.create({
        data: {
          userId: owner.id,
          marketing: true,
          notifications: true,
          security: true,
          updates: true
        }
      });
      console.log('✅ Email preferences created!');
    } else {
      console.log('✅ Email preferences already exist');
    }

    console.log('\n🎉 Owner account setup complete!');
    console.log('📧 Email: thienvyma@gmail.com');
    console.log('🔑 Password: 151194Vy@');
    console.log('👑 Role: OWNER');
    console.log('💎 Plan: ENTERPRISE');
    console.log('🔗 Login URL: http://localhost:3000/login');
    console.log('🏠 Dashboard: http://localhost:3000/dashboard');
    console.log('⚡ Admin Panel: http://localhost:3000/admin');

  } catch (error) {
    console.error('❌ Error during setup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

completeOwnerSetup(); 