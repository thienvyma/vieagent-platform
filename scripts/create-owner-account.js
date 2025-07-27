const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createOwnerAccount() {
  try {
    console.log('🔐 Creating owner account...');
    
    // Hash password
    const hashedPassword = await bcrypt.hash('151194Vy@', 10);
    
    // Create owner user
    const owner = await prisma.user.upsert({
      where: { email: 'thienvyma@gmail.com' },
      update: {
        password: hashedPassword,
        role: 'OWNER',
        name: 'Thien Vy Ma',
        emailVerified: new Date(),
      },
      create: {
        email: 'thienvyma@gmail.com',
        password: hashedPassword,
        name: 'Thien Vy Ma',
        role: 'OWNER',
        emailVerified: new Date(),
      },
    });

    console.log('✅ Owner account created successfully!');
    console.log('📧 Email:', owner.email);
    console.log('👤 Name:', owner.name);
    console.log('🔑 Role:', owner.role);
    console.log('🔐 Password: 151194Vy@');
    
  } catch (error) {
    console.error('❌ Error creating owner account:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createOwnerAccount(); 