const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSampleGoogleAccount() {
  try {
    console.log('🔗 Creating sample Google account...');
    
    // Find admin user
    const user = await prisma.user.findUnique({
      where: { email: 'admin@test.com' }
    });

    if (!user) {
      console.log('❌ Admin user not found. Run quick-test-data.js first.');
      return;
    }

    console.log('✅ Found user:', user.email);

    // Check if Google account already exists
    const existingAccount = await prisma.googleAccount.findFirst({
      where: { userId: user.id }
    });

    if (existingAccount) {
      console.log('✅ Google account already exists:', existingAccount.email);
      console.log('🔄 Updating to active status...');
      
      await prisma.googleAccount.update({
        where: { id: existingAccount.id },
        data: {
          isActive: true,
          lastSync: new Date(),
          tokenExpiry: new Date(Date.now() + 3600000) // 1 hour from now
        }
      });
      
      console.log('✅ Google account updated and activated!');
      return;
    }

    // Create sample Google account
    const googleAccount = await prisma.googleAccount.create({
      data: {
        userId: user.id,
        googleId: 'sample_google_id_123456',
        email: 'admin.test@gmail.com',
        name: 'Admin Test User',
        picture: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
        accessToken: 'sample_access_token_' + Date.now(),
        refreshToken: 'sample_refresh_token_' + Date.now(),
        tokenExpiry: new Date(Date.now() + 3600000), // 1 hour from now
        scopes: JSON.stringify([
          'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive',
          'https://www.googleapis.com/auth/documents',
          'https://www.googleapis.com/auth/forms'
        ]),
        isActive: true,
        lastSync: new Date()
      }
    });

    console.log('✅ Created sample Google account:', googleAccount.email);
    console.log('🎉 Google Integrations page is now ready to test!');
    console.log('');
    console.log('🌐 Navigation:');
    console.log('   👉 Go to: http://localhost:3000/dashboard/google');
    console.log('   📅 Calendar Tab: Available');
    console.log('   📧 Gmail Tab: Available');
    console.log('   📊 Sheets Tab: Available');
    console.log('   📁 Drive Tab: Phase 6.5 Placeholder');
    console.log('   📝 Docs Tab: Phase 6.5 Placeholder');
    console.log('   📋 Forms Tab: Phase 6.5 Placeholder');
    console.log('');
    console.log('🔧 Connected Services:');
    console.log('   ✅ Calendar Integration (Phase 6.2)');
    console.log('   ✅ Gmail Integration (Phase 6.3)');
    console.log('   ✅ Sheets Integration (Phase 6.4)');
    console.log('   ⏳ Drive, Docs, Forms (Phase 6.5)');

  } catch (error) {
    console.error('❌ Error creating sample Google account:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleGoogleAccount(); 