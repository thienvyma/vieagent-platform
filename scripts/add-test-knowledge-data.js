const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addTestKnowledgeData() {
  try {
    console.log('🔄 Adding test knowledge data...');

    // Get first user (or create one if needed)
    let user = await prisma.user.findFirst();
    if (!user) {
      console.log('⚠️ No user found, creating test user...');
      user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          emailVerified: new Date(),
        },
      });
    }

    console.log(`✅ Using user: ${user.email}`);

    // Add test documents
    const testDocuments = [
      {
        title: 'Sample PDF Document',
        filename: 'sample-document.pdf',
        content: 'This is a sample PDF document content for testing.',
        type: 'document',
        size: 1024000,
        mimeType: 'application/pdf',
        status: 'COMPLETED',
        viewCount: 5,
        userId: user.id,
      },
      {
        title: 'Project Guidelines',
        filename: 'project-guidelines.docx',
        content: 'Project guidelines and best practices document.',
        type: 'document',
        size: 512000,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        status: 'COMPLETED',
        viewCount: 12,
        userId: user.id,
      },
      {
        title: 'Data Analysis Report',
        filename: 'data-analysis.xlsx',
        content: 'Comprehensive data analysis and insights.',
        type: 'document',
        size: 2048000,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        status: 'PROCESSING',
        viewCount: 3,
        userId: user.id,
      },
      {
        title: 'Meeting Notes',
        filename: 'meeting-notes.txt',
        content: 'Important meeting notes and action items.',
        type: 'document',
        size: 256000,
        mimeType: 'text/plain',
        status: 'PENDING',
        viewCount: 0,
        userId: user.id,
      },
    ];

    // Add test data imports
    const testDataImports = [
      {
        name: 'Customer Support Chat',
        description: 'Customer support conversations from last month',
        source: 'whatsapp',
        status: 'COMPLETED',
        totalRecords: 150,
        processedRecords: 150,
        successRecords: 145,
        errorRecords: 5,
        progressPercent: 100,
        userId: user.id,
      },
      {
        name: 'Sales Conversations',
        description: 'Sales team conversations and leads',
        source: 'facebook',
        status: 'PROCESSING',
        totalRecords: 75,
        processedRecords: 45,
        successRecords: 42,
        errorRecords: 3,
        progressPercent: 60,
        userId: user.id,
      },
      {
        name: 'Technical Support Logs',
        description: 'Technical support tickets and resolutions',
        source: 'json',
        status: 'PENDING',
        totalRecords: 200,
        processedRecords: 0,
        successRecords: 0,
        errorRecords: 0,
        progressPercent: 0,
        userId: user.id,
      },
    ];

    // Insert documents
    console.log('📄 Adding test documents...');
    for (const doc of testDocuments) {
      await prisma.document.create({
        data: doc,
      });
    }

    // Insert data imports
    console.log('📊 Adding test data imports...');
    for (const imp of testDataImports) {
      await prisma.dataImport.create({
        data: imp,
      });
    }

    console.log('✅ Test knowledge data added successfully!');
    console.log(`📄 Added ${testDocuments.length} documents`);
    console.log(`📊 Added ${testDataImports.length} data imports`);

    // Verify data
    const docCount = await prisma.document.count({ where: { userId: user.id } });
    const importCount = await prisma.dataImport.count({ where: { userId: user.id } });
    
    console.log(`\n📊 Database Summary:`);
    console.log(`- Documents: ${docCount}`);
    console.log(`- Data Imports: ${importCount}`);
    console.log(`- Total Knowledge Items: ${docCount + importCount}`);

  } catch (error) {
    console.error('❌ Error adding test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addTestKnowledgeData(); 