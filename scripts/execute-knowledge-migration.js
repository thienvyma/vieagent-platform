/**
 * 🔄 KNOWLEDGE MIGRATION EXECUTOR
 * Phase 3, Day 10 - Database Migration Execution
 * Migrates DataImport and Document records to unified Knowledge model
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

/**
 * 📊 Migration Statistics
 */
const migrationStats = {
  documents: { total: 0, success: 0, failed: 0 },
  dataImports: { total: 0, success: 0, failed: 0 },
  conversations: { total: 0, success: 0, failed: 0 },
  messages: { total: 0, success: 0, failed: 0 },
  analytics: { total: 0, success: 0, failed: 0 },
  startTime: new Date(),
  endTime: null
};

/**
 * 🛡️ PRE-MIGRATION BACKUP
 */
async function createPreMigrationBackup() {
  console.log('📦 Creating pre-migration backup...');
  
  const backupDir = path.join(__dirname, '..', 'backups', `migration-${Date.now()}`);
  await fs.mkdir(backupDir, { recursive: true });
  
  try {
    // Backup Documents
    const documents = await prisma.document.findMany({
      include: { user: true }
    });
    
    await fs.writeFile(
      path.join(backupDir, 'documents.json'),
      JSON.stringify(documents, null, 2)
    );
    
    // Backup DataImports
    const dataImports = await prisma.dataImport.findMany({
      include: {
        user: true,
        conversations: {
          include: {
            messages: true
          }
        },
        analytics: true
      }
    });
    
    await fs.writeFile(
      path.join(backupDir, 'dataImports.json'),
      JSON.stringify(dataImports, null, 2)
    );
    
    // Create backup manifest
    const manifest = {
      created: new Date(),
      documents: documents.length,
      dataImports: dataImports.length,
      conversations: dataImports.reduce((acc, di) => acc + di.conversations.length, 0),
      messages: dataImports.reduce((acc, di) => 
        acc + di.conversations.reduce((msgAcc, conv) => msgAcc + conv.messages.length, 0), 0
      ),
      analytics: dataImports.reduce((acc, di) => acc + di.analytics.length, 0)
    };
    
    await fs.writeFile(
      path.join(backupDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
    
    console.log(`✅ Backup created: ${backupDir}`);
    console.log(`📄 Documents: ${manifest.documents}`);
    console.log(`📦 DataImports: ${manifest.dataImports}`);
    console.log(`💬 Conversations: ${manifest.conversations}`);
    console.log(`📝 Messages: ${manifest.messages}`);
    console.log(`📊 Analytics: ${manifest.analytics}`);
    
    return backupDir;
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  }
}

/**
 * 🔄 MIGRATE DOCUMENTS TO KNOWLEDGE
 */
async function migrateDocuments() {
  console.log('\n📄 Migrating Documents to Knowledge...');
  
  try {
    const documents = await prisma.document.findMany({
      include: { user: true }
    });
    
    migrationStats.documents.total = documents.length;
    
    for (const doc of documents) {
      try {
        // Map Document fields to Knowledge model
        const knowledgeData = {
          title: doc.title,
          description: `Document: ${doc.filename}`,
          filename: doc.filename,
          type: 'document',
          subtype: doc.type,
          source: 'upload',
          contentType: 'text_knowledge',
          category: 'reference',
          size: doc.size,
          mimeType: doc.mimeType,
          encoding: doc.encoding,
          status: doc.status,
          processedAt: doc.processedAt,
          errorMessage: doc.errorMessage,
          content: doc.content,
          extractedText: doc.extractedText,
          rawContent: doc.content,
          viewCount: doc.viewCount,
          lastViewed: doc.lastViewed,
          userId: doc.userId,
          isPublic: false,
          isArchived: false,
          isDeleted: false,
          metadata: doc.metadata,
          legacyDocumentId: doc.id,
          migrationDate: new Date(),
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
          filePath: doc.filePath,
          s3Key: doc.s3Key
        };
        
        await prisma.knowledge.create({
          data: knowledgeData
        });
        
        migrationStats.documents.success++;
        console.log(`✅ Document migrated: ${doc.filename}`);
        
      } catch (error) {
        migrationStats.documents.failed++;
        console.error(`❌ Failed to migrate document ${doc.filename}:`, error.message);
      }
    }
    
    console.log(`📊 Document migration completed: ${migrationStats.documents.success}/${migrationStats.documents.total} successful`);
    
  } catch (error) {
    console.error('❌ Document migration failed:', error);
    throw error;
  }
}

/**
 * 🔄 MIGRATE DATA IMPORTS TO KNOWLEDGE
 */
async function migrateDataImports() {
  console.log('\n📦 Migrating DataImports to Knowledge...');
  
  try {
    const dataImports = await prisma.dataImport.findMany({
      include: {
        user: true,
        conversations: {
          include: {
            messages: true
          }
        },
        analytics: true
      }
    });
    
    migrationStats.dataImports.total = dataImports.length;
    
    for (const dataImport of dataImports) {
      try {
        // Map DataImport fields to Knowledge model
        const knowledgeData = {
          title: dataImport.name,
          description: dataImport.description,
          filename: dataImport.fileName || dataImport.name,
          type: 'folder',
          subtype: 'import',
          source: dataImport.source,
          contentType: 'conversation',
          category: 'training',
          size: dataImport.fileSize,
          fileHash: dataImport.fileHash,
          status: dataImport.status,
          processedAt: dataImport.completedAt,
          startedAt: dataImport.startedAt,
          completedAt: dataImport.completedAt,
          errorMessage: dataImport.errorMessage,
          totalRecords: dataImport.totalRecords,
          processedRecords: dataImport.processedRecords,
          successRecords: dataImport.successRecords,
          errorRecords: dataImport.errorRecords,
          progressPercent: dataImport.progressPercent,
          userId: dataImport.userId,
          isPublic: false,
          isArchived: false,
          isDeleted: false,
          metadata: dataImport.metadata,
          legacyDataImportId: dataImport.id,
          migrationDate: new Date(),
          createdAt: dataImport.createdAt,
          updatedAt: dataImport.updatedAt,
          originalFile: dataImport.originalFile
        };
        
        const knowledge = await prisma.knowledge.create({
          data: knowledgeData
        });
        
        // Migrate conversations as children
        await migrateConversationsForDataImport(dataImport, knowledge.id);
        
        migrationStats.dataImports.success++;
        console.log(`✅ DataImport migrated: ${dataImport.name}`);
        
      } catch (error) {
        migrationStats.dataImports.failed++;
        console.error(`❌ Failed to migrate DataImport ${dataImport.name}:`, error.message);
      }
    }
    
    console.log(`📊 DataImport migration completed: ${migrationStats.dataImports.success}/${migrationStats.dataImports.total} successful`);
    
  } catch (error) {
    console.error('❌ DataImport migration failed:', error);
    throw error;
  }
}

/**
 * 🔄 MIGRATE CONVERSATIONS FOR DATA IMPORT
 */
async function migrateConversationsForDataImport(dataImport, parentKnowledgeId) {
  try {
    for (const conversation of dataImport.conversations) {
      try {
        // Create Knowledge record for each conversation
        const conversationKnowledge = await prisma.knowledge.create({
          data: {
            title: conversation.title || `Conversation ${conversation.originalId}`,
            description: `${conversation.platform} conversation with ${conversation.participantCount} participants`,
            filename: `conversation_${conversation.originalId}.json`,
            type: 'conversation',
            subtype: conversation.platform,
            source: conversation.platform,
            contentType: 'conversation',
            category: 'training',
            status: conversation.isProcessed ? 'COMPLETED' : 'PENDING',
            userId: dataImport.userId,
            parentId: parentKnowledgeId,
            depth: 1,
            isPublic: false,
            isArchived: false,
            isDeleted: false,
            metadata: JSON.stringify({
              originalId: conversation.originalId,
              participantCount: conversation.participantCount,
              startTime: conversation.startTime,
              endTime: conversation.endTime,
              duration: conversation.duration,
              messageCount: conversation.messageCount,
              contextExtracted: conversation.contextExtracted,
              sentiment: conversation.sentiment,
              category: conversation.category,
              normalizedData: conversation.normalizedData
            }),
            legacyDataImportId: dataImport.id,
            migrationDate: new Date(),
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt
          }
        });
        
        // Migrate messages as content
        await migrateMessagesForConversation(conversation, conversationKnowledge.id);
        
        migrationStats.conversations.success++;
        
      } catch (error) {
        migrationStats.conversations.failed++;
        console.error(`❌ Failed to migrate conversation ${conversation.originalId}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Conversation migration failed:', error);
  }
}

/**
 * 🔄 MIGRATE MESSAGES FOR CONVERSATION
 */
async function migrateMessagesForConversation(conversation, conversationKnowledgeId) {
  try {
    // Combine all messages into single content
    const messagesContent = conversation.messages.map(msg => ({
      id: msg.originalId,
      senderId: msg.senderId,
      senderName: msg.senderName,
      senderType: msg.senderType,
      content: msg.content,
      messageType: msg.messageType,
      attachments: msg.attachments,
      timestamp: msg.timestamp,
      sentiment: msg.sentiment,
      intent: msg.intent,
      entities: msg.entities,
      normalizedContent: msg.normalizedContent
    }));
    
    // Update conversation knowledge with messages content
    await prisma.knowledge.update({
      where: { id: conversationKnowledgeId },
      data: {
        content: JSON.stringify(messagesContent),
        extractedText: messagesContent.map(msg => msg.content).join('\n'),
        totalRecords: conversation.messages.length,
        processedRecords: conversation.messages.filter(msg => msg.isProcessed).length,
        successRecords: conversation.messages.filter(msg => msg.isProcessed).length
      }
    });
    
    migrationStats.messages.success += conversation.messages.length;
    
  } catch (error) {
    migrationStats.messages.failed += conversation.messages.length;
    console.error('❌ Message migration failed:', error);
  }
}

/**
 * 🔄 MIGRATE ANALYTICS
 */
async function migrateAnalytics() {
  console.log('\n📊 Migrating Analytics...');
  
  try {
    const analytics = await prisma.importAnalytics.findMany({
      include: {
        import: true
      }
    });
    
    migrationStats.analytics.total = analytics.length;
    
    for (const analytic of analytics) {
      try {
        // Find corresponding Knowledge record
        const knowledge = await prisma.knowledge.findFirst({
          where: {
            legacyDataImportId: analytic.importId
          }
        });
        
        if (!knowledge) {
          console.warn(`⚠️ No Knowledge record found for import ${analytic.importId}`);
          continue;
        }
        
        // Create KnowledgeAnalytics record
        await prisma.knowledgeAnalytics.create({
          data: {
            knowledgeId: knowledge.id,
            eventType: 'import_analytics',
            eventData: JSON.stringify({
              date: analytic.date,
              hour: analytic.hour,
              conversationCount: analytic.conversationCount,
              messageCount: analytic.messageCount,
              avgConversationLength: analytic.avgConversationLength,
              avgResponseTime: analytic.avgResponseTime,
              positiveCount: analytic.positiveCount,
              negativeCount: analytic.negativeCount,
              neutralCount: analytic.neutralCount,
              resolutionRate: analytic.resolutionRate,
              customerSatisfaction: analytic.customerSatisfaction,
              topTopics: analytic.topTopics,
              topIntents: analytic.topIntents
            }),
            timestamp: analytic.date
          }
        });
        
        migrationStats.analytics.success++;
        
      } catch (error) {
        migrationStats.analytics.failed++;
        console.error(`❌ Failed to migrate analytics for import ${analytic.importId}:`, error.message);
      }
    }
    
    console.log(`📊 Analytics migration completed: ${migrationStats.analytics.success}/${migrationStats.analytics.total} successful`);
    
  } catch (error) {
    console.error('❌ Analytics migration failed:', error);
    throw error;
  }
}

/**
 * ✅ VERIFY MIGRATION SUCCESS
 */
async function verifyMigration() {
  console.log('\n🔍 Verifying migration success...');
  
  try {
    // Count migrated records
    const knowledgeCount = await prisma.knowledge.count();
    const documentMigrated = await prisma.knowledge.count({
      where: { legacyDocumentId: { not: null } }
    });
    const dataImportMigrated = await prisma.knowledge.count({
      where: { legacyDataImportId: { not: null } }
    });
    const analyticsCount = await prisma.knowledgeAnalytics.count();
    
    console.log('📊 Migration Results:');
    console.log(`📚 Total Knowledge records: ${knowledgeCount}`);
    console.log(`📄 Migrated Documents: ${documentMigrated}`);
    console.log(`📦 Migrated DataImports: ${dataImportMigrated}`);
    console.log(`📊 Migrated Analytics: ${analyticsCount}`);
    
    // Verify data integrity
    const orphanedRecords = await prisma.knowledge.count({
      where: {
        AND: [
          { legacyDocumentId: null },
          { legacyDataImportId: null }
        ]
      }
    });
    
    if (orphanedRecords > 0) {
      console.warn(`⚠️ ${orphanedRecords} orphaned records found`);
    }
    
    // Check for missing users
    const missingUsers = await prisma.knowledge.count({
      where: {
        user: null
      }
    });
    
    if (missingUsers > 0) {
      console.error(`❌ ${missingUsers} records with missing users`);
    }
    
    return {
      success: true,
      stats: {
        totalKnowledge: knowledgeCount,
        documentMigrated,
        dataImportMigrated,
        analyticsCount,
        orphanedRecords,
        missingUsers
      }
    };
    
  } catch (error) {
    console.error('❌ Migration verification failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 📋 GENERATE MIGRATION REPORT
 */
async function generateMigrationReport(backupDir, verificationResult) {
  console.log('\n📋 Generating migration report...');
  
  migrationStats.endTime = new Date();
  const duration = migrationStats.endTime - migrationStats.startTime;
  
  const report = {
    migration: {
      startTime: migrationStats.startTime,
      endTime: migrationStats.endTime,
      duration: `${Math.round(duration / 1000)}s`,
      backupLocation: backupDir
    },
    statistics: migrationStats,
    verification: verificationResult,
    recommendations: []
  };
  
  // Add recommendations based on results
  if (migrationStats.documents.failed > 0) {
    report.recommendations.push(`Review ${migrationStats.documents.failed} failed document migrations`);
  }
  
  if (migrationStats.dataImports.failed > 0) {
    report.recommendations.push(`Review ${migrationStats.dataImports.failed} failed DataImport migrations`);
  }
  
  if (verificationResult.stats?.orphanedRecords > 0) {
    report.recommendations.push(`Investigate ${verificationResult.stats.orphanedRecords} orphaned records`);
  }
  
  if (verificationResult.stats?.missingUsers > 0) {
    report.recommendations.push(`Fix ${verificationResult.stats.missingUsers} records with missing users`);
  }
  
  // Save report
  const reportPath = path.join(backupDir, 'migration-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`📄 Migration report saved: ${reportPath}`);
  return report;
}

/**
 * 🚀 MAIN MIGRATION EXECUTOR
 */
async function executeMigration() {
  console.log('🚀 Starting Knowledge Migration...');
  console.log('================================================');
  
  let backupDir;
  
  try {
    // Step 1: Create backup
    backupDir = await createPreMigrationBackup();
    
    // Step 2: Migrate Documents
    await migrateDocuments();
    
    // Step 3: Migrate DataImports
    await migrateDataImports();
    
    // Step 4: Migrate Analytics
    await migrateAnalytics();
    
    // Step 5: Verify migration
    const verificationResult = await verifyMigration();
    
    // Step 6: Generate report
    const report = await generateMigrationReport(backupDir, verificationResult);
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('================================================');
    console.log('Summary:');
    console.log(`📄 Documents: ${migrationStats.documents.success}/${migrationStats.documents.total}`);
    console.log(`📦 DataImports: ${migrationStats.dataImports.success}/${migrationStats.dataImports.total}`);
    console.log(`💬 Conversations: ${migrationStats.conversations.success}/${migrationStats.conversations.total}`);
    console.log(`📝 Messages: ${migrationStats.messages.success}/${migrationStats.messages.total}`);
    console.log(`📊 Analytics: ${migrationStats.analytics.success}/${migrationStats.analytics.total}`);
    console.log(`⏱️ Duration: ${Math.round((migrationStats.endTime - migrationStats.startTime) / 1000)}s`);
    console.log(`💾 Backup: ${backupDir}`);
    
    return report;
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('================================================');
    
    if (backupDir) {
      console.log(`💾 Backup location: ${backupDir}`);
      console.log('🔄 Use backup to restore if needed');
    }
    
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute migration if run directly
if (require.main === module) {
  executeMigration()
    .then(report => {
      console.log('\n✅ Migration execution completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Migration execution failed:', error);
      process.exit(1);
    });
}

module.exports = {
  executeMigration,
  migrationStats
}; 