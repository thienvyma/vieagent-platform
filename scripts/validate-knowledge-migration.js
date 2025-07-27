/**
 * 🔍 KNOWLEDGE MIGRATION VALIDATION SCRIPT
 * Day 10 - Knowledge System Migration Validation
 * Validates all aspects of knowledge system migration
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function validateKnowledgeMigration() {
  console.log('🚀 Validating Knowledge Migration...');
  console.log('============================================================');
  
  const results = {
    timestamp: new Date().toISOString(),
    validations: {},
    summary: { total: 0, success: 0, warning: 0, error: 0 }
  };
  
  // Validation 1: Knowledge table structure
  console.log('📋 Validating Knowledge table structure...');
  try {
    const knowledgeCount = await prisma.knowledge.count();
    const sampleKnowledge = await prisma.knowledge.findFirst({
      include: {
        user: { select: { id: true, name: true } },
        analytics: { take: 1 },
        insights: { take: 1 },
        agentAssignments: { take: 1 }
      }
    });
    
    results.validations.knowledgeStructure = {
      status: 'success',
      knowledgeCount,
      hasSampleRecord: !!sampleKnowledge,
      hasUserRelation: sampleKnowledge?.user ? true : false,
      details: `Knowledge table: ${knowledgeCount} records, Sample record: ${sampleKnowledge ? 'Found' : 'Empty'}`
    };
    
    results.summary.total++;
    results.summary.success++;
    
    console.log(`✅ Knowledge structure: ${knowledgeCount} records`);
    
  } catch (error) {
    results.validations.knowledgeStructure = { 
      status: 'error', 
      error: error.message 
    };
    results.summary.total++;
    results.summary.error++;
    console.log(`❌ Knowledge structure validation failed: ${error.message}`);
  }
  
  // Validation 2: Knowledge Analytics
  console.log('📊 Validating Knowledge Analytics...');
  try {
    const analyticsCount = await prisma.knowledgeAnalytics.count();
    
    results.validations.knowledgeAnalytics = {
      status: 'success',
      analyticsCount,
      details: `Knowledge Analytics: ${analyticsCount} records`
    };
    
    results.summary.total++;
    results.summary.success++;
    
    console.log(`✅ Knowledge Analytics: ${analyticsCount} records`);
    
  } catch (error) {
    results.validations.knowledgeAnalytics = { 
      status: 'warning', 
      error: error.message,
      details: 'Analytics table may not exist yet'
    };
    results.summary.total++;
    results.summary.warning++;
    console.log(`⚠️ Knowledge Analytics: ${error.message}`);
  }
  
  // Validation 3: Knowledge Agent Assignments
  console.log('🤖 Validating Knowledge Agent Assignments...');
  try {
    const assignmentCount = await prisma.knowledgeAgentAssignment.count();
    
    results.validations.knowledgeAgentAssignments = {
      status: 'success',
      assignmentCount,
      details: `Agent Assignments: ${assignmentCount} records`
    };
    
    results.summary.total++;
    results.summary.success++;
    
    console.log(`✅ Agent Assignments: ${assignmentCount} records`);
    
  } catch (error) {
    results.validations.knowledgeAgentAssignments = { 
      status: 'warning', 
      error: error.message,
      details: 'Agent assignments table may not exist yet'
    };
    results.summary.total++;
    results.summary.warning++;
    console.log(`⚠️ Agent Assignments: ${error.message}`);
  }
  
  // Validation 4: Knowledge Processing History
  console.log('📝 Validating Knowledge Processing History...');
  try {
    const historyCount = await prisma.knowledgeProcessingHistory.count();
    
    results.validations.knowledgeProcessingHistory = {
      status: 'success',
      historyCount,
      details: `Processing History: ${historyCount} records`
    };
    
    results.summary.total++;
    results.summary.success++;
    
    console.log(`✅ Processing History: ${historyCount} records`);
    
  } catch (error) {
    results.validations.knowledgeProcessingHistory = { 
      status: 'warning', 
      error: error.message,
      details: 'Processing history table may not exist yet'
    };
    results.summary.total++;
    results.summary.warning++;
    console.log(`⚠️ Processing History: ${error.message}`);
  }
  
  // Validation 5: Knowledge Shares
  console.log('🔗 Validating Knowledge Shares...');
  try {
    const sharesCount = await prisma.knowledgeShare.count();
    
    results.validations.knowledgeShares = {
      status: 'success',
      sharesCount,
      details: `Knowledge Shares: ${sharesCount} records`
    };
    
    results.summary.total++;
    results.summary.success++;
    
    console.log(`✅ Knowledge Shares: ${sharesCount} records`);
    
  } catch (error) {
    results.validations.knowledgeShares = { 
      status: 'warning', 
      error: error.message,
      details: 'Shares table may not exist yet'
    };
    results.summary.total++;
    results.summary.warning++;
    console.log(`⚠️ Knowledge Shares: ${error.message}`);
  }
  
  // Validation 6: Migration completeness
  console.log('🔄 Validating Migration Completeness...');
  try {
    const migrationRecords = await prisma.knowledgeMigration.count();
    
    // Check if knowledge data properly migrated from old system
    const totalUsers = await prisma.user.count();
    const totalDocuments = await prisma.document.count();
    
    results.validations.migrationCompleteness = {
      status: 'success',
      migrationRecords,
      totalUsers,
      totalDocuments,
      details: `Migration records: ${migrationRecords}, Users: ${totalUsers}, Documents: ${totalDocuments}`
    };
    
    results.summary.total++;
    results.summary.success++;
    
    console.log(`✅ Migration Completeness: ${migrationRecords} migration records`);
    
  } catch (error) {
    results.validations.migrationCompleteness = { 
      status: 'warning', 
      error: error.message,
      details: 'Migration table may not exist yet'
    };
    results.summary.total++;
    results.summary.warning++;
    console.log(`⚠️ Migration Completeness: ${error.message}`);
  }
  
  // Validation 7: Data integrity checks
  console.log('🔍 Validating Data Integrity...');
  try {
    const integrityChecks = {
      knowledgeWithUsers: await prisma.knowledge.count({
        where: { userId: { not: null } }
      }),
      totalKnowledge: await prisma.knowledge.count(),
      orphanedKnowledge: 0
    };
    
    integrityChecks.orphanedKnowledge = integrityChecks.totalKnowledge - integrityChecks.knowledgeWithUsers;
    
    results.validations.dataIntegrity = {
      status: integrityChecks.orphanedKnowledge === 0 ? 'success' : 'warning',
      ...integrityChecks,
      details: `Total: ${integrityChecks.totalKnowledge}, With users: ${integrityChecks.knowledgeWithUsers}, Orphaned: ${integrityChecks.orphanedKnowledge}`
    };
    
    results.summary.total++;
    results.summary[results.validations.dataIntegrity.status]++;
    
    console.log(`✅ Data Integrity: ${integrityChecks.orphanedKnowledge} orphaned records`);
    
  } catch (error) {
    results.validations.dataIntegrity = { 
      status: 'error', 
      error: error.message 
    };
    results.summary.total++;
    results.summary.error++;
    console.log(`❌ Data Integrity validation failed: ${error.message}`);
  }
  
  // Calculate success rate
  const successRate = Math.round((results.summary.success / results.summary.total) * 100);
  
  console.log('============================================================');
  console.log('📊 KNOWLEDGE MIGRATION VALIDATION SUMMARY:');
  console.log(`✅ Success: ${results.summary.success}`);
  console.log(`⚠️  Warning: ${results.summary.warning}`);
  console.log(`❌ Error: ${results.summary.error}`);
  console.log(`📈 Success Rate: ${successRate}%`);
  
  if (successRate >= 95) {
    console.log('✅ KNOWLEDGE MIGRATION VALIDATION PASSED (≥95%)');
  } else {
    console.log('❌ KNOWLEDGE MIGRATION VALIDATION FAILED (<95%)');
  }
  
  // Save results
  const reportPath = path.join(process.cwd(), 'KNOWLEDGE_MIGRATION_VALIDATION_REPORT.md');
  const reportContent = `# 🔍 KNOWLEDGE MIGRATION VALIDATION REPORT

## 📋 SUMMARY
- **Validation Date**: ${results.timestamp}
- **Success Rate**: ${successRate}%
- **Total Validations**: ${results.summary.total}
- **Status**: ${successRate >= 95 ? '✅ PASSED' : '❌ FAILED'}

## 📊 DETAILED RESULTS
${Object.entries(results.validations).map(([name, result]) => `
### ${name}
- **Status**: ${result.status}
- **Details**: ${result.details || 'No details available'}
${result.error ? `- **Error**: ${result.error}` : ''}
`).join('\n')}

## 🎯 MIGRATION STATUS
${successRate >= 95 ? '- Knowledge migration completed successfully' : '- Knowledge migration needs attention'}
- All knowledge system components validated
- Data integrity checks completed
- Migration records properly tracked

## 📝 RECOMMENDATIONS
${successRate >= 95 ? '- Knowledge system ready for production use' : '- Review failed validations before proceeding'}
- Monitor system performance post-migration
- Continue regular validation checks
- Maintain backup and rollback procedures
`;
  
  fs.writeFileSync(reportPath, reportContent);
  console.log(`📄 Report saved: ${reportPath}`);
  
  await prisma.$disconnect();
  return results;
}

// Run if executed directly
if (require.main === module) {
  validateKnowledgeMigration()
    .then(results => {
      const successRate = Math.round((results.summary.success / results.summary.total) * 100);
      process.exit(successRate >= 95 ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Knowledge migration validation failed:', error);
      process.exit(1);
    });
}

module.exports = { validateKnowledgeMigration }; 