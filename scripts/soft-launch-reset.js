#!/usr/bin/env node

/**
 * Soft Launch Reset Script
 * 
 * This script prepares the AI Agent Platform for production deployment by:
 * 1. Cleaning dev-only files and test data
 * 2. Resetting database state to production-ready
 * 3. Removing test agents, users, and mock vectors
 * 4. Generating deployment summary
 * 
 * Usage: node scripts/soft-launch-reset.js [--confirm] [--dry-run]
 */

const fs = require('fs').promises;
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Script configuration
const config = {
  dryRun: process.argv.includes('--dry-run'),
  confirm: process.argv.includes('--confirm'),
  verbose: process.argv.includes('--verbose'),
  backupDir: './deployment-backups',
  deployStatusFile: './DEPLOY_STATUS.md'
};

// Reset operation results
const resetResults = {
  startTime: new Date(),
  endTime: null,
  duration: null,
  operations: [],
  errors: [],
  warnings: [],
  summary: {
    filesDeleted: 0,
    usersRemoved: 0,
    agentsRemoved: 0,
    documentsRemoved: 0,
    vectorCollectionsRemoved: 0,
    totalSizeCleaned: 0
  },
  productionReadiness: {
    score: 0,
    blockers: [],
    warnings: [],
    recommendations: []
  }
};

async function main() {
  console.log('🚀 AI Agent Platform - Soft Launch Reset Script');
  console.log('================================================\n');

  if (config.dryRun) {
    console.log('📋 DRY RUN MODE - No actual changes will be made\n');
  }

  if (!config.confirm && !config.dryRun) {
    console.log('❌ This script will permanently delete test data!');
    console.log('   Use --confirm flag to proceed or --dry-run to preview changes');
    process.exit(1);
  }

  try {
    // Step 1: Create backup directory
    await createBackupDirectory();

    // Step 2: Analyze current system state
    await analyzeSystemState();

    // Step 3: Clean dev-only files
    await cleanDevOnlyFiles();

    // Step 4: Reset database state
    await resetDatabaseState();

    // Step 5: Clean vector database
    await cleanVectorDatabase();

    // Step 6: Verify production readiness
    await verifyProductionReadiness();

    // Step 7: Generate deployment status
    await generateDeploymentStatus();

    // Step 8: Create final backup
    await createFinalBackup();

    resetResults.endTime = new Date();
    resetResults.duration = resetResults.endTime.getTime() - resetResults.startTime.getTime();

    console.log('\n✅ Soft launch reset completed successfully!');
    console.log(`📊 Duration: ${Math.round(resetResults.duration / 1000)}s`);
    console.log(`📄 Deployment summary: ${config.deployStatusFile}`);

  } catch (error) {
    console.error('\n❌ Soft launch reset failed:', error.message);
    resetResults.errors.push({
      operation: 'main',
      error: error.message,
      timestamp: new Date()
    });
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function createBackupDirectory() {
  addOperation('Creating backup directory');
  
  try {
    await fs.mkdir(config.backupDir, { recursive: true });
    console.log(`📁 Backup directory created: ${config.backupDir}`);
  } catch (error) {
    throw new Error(`Failed to create backup directory: ${error.message}`);
  }
}

async function analyzeSystemState() {
  addOperation('Analyzing current system state');
  
  try {
    // Count current data
    const [users, agents, documents, conversations] = await Promise.all([
      prisma.user.count(),
      prisma.agent.count({ where: { deleted: false } }),
      prisma.userDocument.count({ where: { deleted: false } }),
      prisma.conversation.count()
    ]);

    console.log('📊 Current System State:');
    console.log(`   👥 Users: ${users}`);
    console.log(`   🤖 Agents: ${agents}`);
    console.log(`   📄 Documents: ${documents}`);
    console.log(`   💬 Conversations: ${conversations}`);

    // Identify test/dev data
    const testUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: 'test' } },
          { email: { contains: 'dev' } },
          { email: { contains: 'demo' } },
          { name: { contains: 'Test' } },
          { name: { contains: 'Demo' } }
        ]
      },
      select: { id: true, email: true, name: true }
    });

    const testAgents = await prisma.agent.findMany({
      where: {
        OR: [
          { name: { contains: 'test' } },
          { name: { contains: 'Test' } },
          { name: { contains: 'demo' } },
          { name: { contains: 'Demo' } },
          { description: { contains: 'test' } }
        ],
        deleted: false
      },
      select: { id: true, name: true, userId: true }
    });

    console.log(`\n🔍 Test/Dev Data Identified:`);
    console.log(`   👥 Test Users: ${testUsers.length}`);
    console.log(`   🤖 Test Agents: ${testAgents.length}`);

    if (config.verbose) {
      console.log('\n📝 Test Users:');
      testUsers.forEach(user => console.log(`   - ${user.email} (${user.name})`));
      
      console.log('\n📝 Test Agents:');
      testAgents.forEach(agent => console.log(`   - ${agent.name}`));
    }

  } catch (error) {
    throw new Error(`Failed to analyze system state: ${error.message}`);
  }
}

async function cleanDevOnlyFiles() {
  addOperation('Cleaning dev-only files');
  
  const devFilesToRemove = [
    // Development logs
    'logs/development.log',
    'logs/debug.log',
    'logs/test.log',
    
    // Backup files
    'src/middleware.ts.backup',
    'src/middleware-new.ts',
    'prisma/schema.prisma.backup',
    'prisma/schema.prisma.backup-2.3',
    'prisma/schema.prisma.backup-3.0',
    'prisma/schema.prisma.day3',
    
    // Development notes
    'agents-complete-fix.txt',
    'agents-fix.txt',
    'folder-after-simplify.txt',
    
    // Test directories
    'test-hybrid-cache/',
    'test-persist-cache/',
    'perf-test-file/',
    'perf-test-hybrid/',
    
    // Development artifacts
    'src/components/ui/examples/',
    'src/app/api/data-imports/route.ts.backup-optimized',
    
    // Environment files (keep template)
    '.env.local.example',
    '.env.test',
    '.env.development'
  ];

  let filesRemoved = 0;
  let totalSize = 0;

  for (const filePath of devFilesToRemove) {
    try {
      const fullPath = path.resolve(filePath);
      
      try {
        const stats = await fs.stat(fullPath);
        totalSize += stats.size;
        
        if (!config.dryRun) {
          if (stats.isDirectory()) {
            await fs.rmdir(fullPath, { recursive: true });
          } else {
            await fs.unlink(fullPath);
          }
        }
        
        filesRemoved++;
        console.log(`   🗑️  ${config.dryRun ? '[DRY RUN] ' : ''}Removed: ${filePath}`);
        
      } catch (statError) {
        if (statError.code !== 'ENOENT') {
          console.log(`   ⚠️  Warning: Could not remove ${filePath}: ${statError.message}`);
          resetResults.warnings.push(`File removal warning: ${filePath}`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Error removing ${filePath}: ${error.message}`);
      resetResults.errors.push({
        operation: 'file_cleanup',
        file: filePath,
        error: error.message
      });
    }
  }

  resetResults.summary.filesDeleted = filesRemoved;
  resetResults.summary.totalSizeCleaned += totalSize;
  
  console.log(`📊 Files cleaned: ${filesRemoved} (${Math.round(totalSize / 1024)}KB)`);
}

async function resetDatabaseState() {
  addOperation('Resetting database state');
  
  if (config.dryRun) {
    console.log('📋 [DRY RUN] Database reset operations:');
  }

  try {
    // Remove test users and all their data
    const testUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: 'test' } },
          { email: { contains: 'dev' } },
          { email: { contains: 'demo' } },
          { name: { contains: 'Test' } },
          { name: { contains: 'Demo' } }
        ]
      },
      include: {
        agents: true,
        userDocuments: true,
        conversations: true
      }
    });

    for (const user of testUsers) {
      console.log(`   🗑️  ${config.dryRun ? '[DRY RUN] ' : ''}Removing test user: ${user.email}`);
      
      if (!config.dryRun) {
        // Soft delete agents
        await prisma.agent.updateMany({
          where: { userId: user.id },
          data: { deleted: true, deletedAt: new Date() }
        });

        // Soft delete documents
        await prisma.userDocument.updateMany({
          where: { userId: user.id },
          data: { deleted: true, deletedAt: new Date() }
        });

        // Delete conversations
        await prisma.conversation.deleteMany({
          where: { userId: user.id }
        });

        // Delete user
        await prisma.user.delete({
          where: { id: user.id }
        });
      }

      resetResults.summary.usersRemoved++;
      resetResults.summary.agentsRemoved += user.agents.length;
      resetResults.summary.documentsRemoved += user.userDocuments.length;
    }

    // Remove standalone test agents
    const standaloneTestAgents = await prisma.agent.findMany({
      where: {
        OR: [
          { name: { contains: 'test' } },
          { name: { contains: 'Test' } },
          { name: { contains: 'demo' } },
          { name: { contains: 'Demo' } }
        ],
        deleted: false
      }
    });

    for (const agent of standaloneTestAgents) {
      console.log(`   🗑️  ${config.dryRun ? '[DRY RUN] ' : ''}Removing test agent: ${agent.name}`);
      
      if (!config.dryRun) {
        await prisma.agent.update({
          where: { id: agent.id },
          data: { deleted: true, deletedAt: new Date() }
        });
      }
      
      resetResults.summary.agentsRemoved++;
    }

    // Clean up orphaned data
    if (!config.dryRun) {
      // Remove orphaned conversations
      await prisma.conversation.deleteMany({
        where: {
          userId: { notIn: await prisma.user.findMany().then(users => users.map(u => u.id)) }
        }
      });

      // Remove orphaned chat messages
      await prisma.chatMessage.deleteMany({
        where: {
          conversationId: { 
            notIn: await prisma.conversation.findMany().then(convs => convs.map(c => c.id)) 
          }
        }
      });
    }

    console.log(`📊 Database cleanup: ${resetResults.summary.usersRemoved} users, ${resetResults.summary.agentsRemoved} agents`);

  } catch (error) {
    throw new Error(`Database reset failed: ${error.message}`);
  }
}

async function cleanVectorDatabase() {
  addOperation('Cleaning vector database');
  
  try {
    // Get list of all vector collections
    const chromaResponse = await fetch(`${process.env.CHROMADB_URL}/api/v1/collections`);
    
    if (!chromaResponse.ok) {
      console.log('⚠️  ChromaDB not accessible - skipping vector cleanup');
      resetResults.warnings.push('ChromaDB not accessible for vector cleanup');
      return;
    }

    const collections = await chromaResponse.json();
    let vectorCollectionsRemoved = 0;

    for (const collection of collections) {
      const collectionName = collection.name;
      
      // Identify test/dev collections
      const isTestCollection = 
        collectionName.includes('test') ||
        collectionName.includes('demo') ||
        collectionName.includes('dev') ||
        collectionName.startsWith('temp_');

      if (isTestCollection) {
        console.log(`   🗑️  ${config.dryRun ? '[DRY RUN] ' : ''}Removing test vector collection: ${collectionName}`);
        
        if (!config.dryRun) {
          const deleteResponse = await fetch(`${process.env.CHROMADB_URL}/api/v1/collections/${collectionName}`, {
            method: 'DELETE'
          });

          if (!deleteResponse.ok) {
            console.log(`   ⚠️  Failed to delete collection ${collectionName}: ${deleteResponse.status}`);
            resetResults.warnings.push(`Failed to delete vector collection: ${collectionName}`);
          } else {
            vectorCollectionsRemoved++;
          }
        } else {
          vectorCollectionsRemoved++;
        }
      }
    }

    resetResults.summary.vectorCollectionsRemoved = vectorCollectionsRemoved;
    console.log(`📊 Vector collections cleaned: ${vectorCollectionsRemoved}`);

  } catch (error) {
    console.log(`⚠️  Vector database cleanup warning: ${error.message}`);
    resetResults.warnings.push(`Vector cleanup warning: ${error.message}`);
  }
}

async function verifyProductionReadiness() {
  addOperation('Verifying production readiness');
  
  const readiness = resetResults.productionReadiness;
  let score = 0;
  const maxScore = 100;

  // Check 1: Environment configuration (20 points)
  try {
    const requiredEnvVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL',
      'CHROMADB_URL'
    ];

    let envScore = 0;
    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        envScore += 5;
      } else {
        readiness.blockers.push(`Missing environment variable: ${envVar}`);
      }
    }
    score += envScore;
    console.log(`   ✅ Environment Config: ${envScore}/20`);
  } catch (error) {
    readiness.blockers.push('Environment configuration check failed');
  }

  // Check 2: Database connectivity (20 points)
  try {
    await prisma.$queryRaw`SELECT 1`;
    score += 20;
    console.log('   ✅ Database Connectivity: 20/20');
  } catch (error) {
    readiness.blockers.push('Database connection failed');
    console.log('   ❌ Database Connectivity: 0/20');
  }

  // Check 3: Vector database connectivity (20 points)
  try {
    const chromaResponse = await fetch(`${process.env.CHROMADB_URL}/api/v1/heartbeat`);
    if (chromaResponse.ok) {
      score += 20;
      console.log('   ✅ Vector DB Connectivity: 20/20');
    } else {
      readiness.warnings.push('ChromaDB connectivity issues');
      score += 10;
      console.log('   ⚠️  Vector DB Connectivity: 10/20');
    }
  } catch (error) {
    readiness.warnings.push('ChromaDB not accessible');
    console.log('   ⚠️  Vector DB Connectivity: 0/20');
  }

  // Check 4: Core functionality (20 points)
  try {
    // Check if core tables exist and have expected structure
    const [userCount, agentCount] = await Promise.all([
      prisma.user.count(),
      prisma.agent.count()
    ]);

    if (userCount >= 0 && agentCount >= 0) {
      score += 20;
      console.log('   ✅ Core Functionality: 20/20');
    }
  } catch (error) {
    readiness.blockers.push('Core functionality check failed');
    console.log('   ❌ Core Functionality: 0/20');
  }

  // Check 5: Security configuration (20 points)
  let securityScore = 0;
  
  if (process.env.NODE_ENV === 'production') securityScore += 5;
  if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length >= 32) securityScore += 5;
  if (process.env.NEXTAUTH_URL && process.env.NEXTAUTH_URL.startsWith('https')) securityScore += 5;
  if (!fs.existsSync('.env.local.example')) securityScore += 5; // Dev files cleaned
  
  score += securityScore;
  console.log(`   ${securityScore === 20 ? '✅' : '⚠️ '} Security Config: ${securityScore}/20`);

  readiness.score = score;

  // Generate recommendations
  if (score >= 90) {
    readiness.recommendations.push('System is production-ready for deployment');
  } else if (score >= 70) {
    readiness.recommendations.push('System is mostly ready - address warnings before deployment');
  } else {
    readiness.recommendations.push('System requires attention before production deployment');
  }

  if (readiness.blockers.length === 0) {
    readiness.recommendations.push('No critical blockers found');
  }

  if (readiness.warnings.length > 0) {
    readiness.recommendations.push(`Address ${readiness.warnings.length} warnings for optimal performance`);
  }

  console.log(`📊 Production Readiness Score: ${score}/${maxScore} (${Math.round(score/maxScore*100)}%)`);
}

async function generateDeploymentStatus() {
  addOperation('Generating deployment status');
  
  const deployStatus = `# 🚀 DEPLOYMENT STATUS REPORT

## 📊 **Reset Summary**
- **Execution Time**: ${new Date().toISOString()}
- **Duration**: ${Math.round(resetResults.duration / 1000)}s
- **Mode**: ${config.dryRun ? 'DRY RUN' : 'PRODUCTION RESET'}

## 🧹 **Cleanup Results**

### Files & Directories
- **Files Deleted**: ${resetResults.summary.filesDeleted}
- **Space Cleaned**: ${Math.round(resetResults.summary.totalSizeCleaned / 1024)}KB

### Database Cleanup  
- **Test Users Removed**: ${resetResults.summary.usersRemoved}
- **Test Agents Removed**: ${resetResults.summary.agentsRemoved}
- **Test Documents Removed**: ${resetResults.summary.documentsRemoved}

### Vector Database
- **Collections Removed**: ${resetResults.summary.vectorCollectionsRemoved}

## 🎯 **Production Readiness**

### Overall Score: ${resetResults.productionReadiness.score}/100 (${Math.round(resetResults.productionReadiness.score)}%)

${resetResults.productionReadiness.score >= 90 ? '✅ **READY FOR DEPLOYMENT**' : 
  resetResults.productionReadiness.score >= 70 ? '⚠️ **DEPLOYMENT WITH CAUTION**' : 
  '❌ **NOT READY FOR DEPLOYMENT**'}

### 🚨 **Critical Blockers**
${resetResults.productionReadiness.blockers.length === 0 ? 
  '- None found ✅' : 
  resetResults.productionReadiness.blockers.map(b => `- ${b}`).join('\n')}

### ⚠️ **Warnings**
${resetResults.productionReadiness.warnings.length === 0 ? 
  '- None found ✅' : 
  resetResults.productionReadiness.warnings.map(w => `- ${w}`).join('\n')}

### 💡 **Recommendations**
${resetResults.productionReadiness.recommendations.map(r => `- ${r}`).join('\n')}

## 🔧 **Operations Performed**

${resetResults.operations.map(op => `- ${op.name} (${op.status})`).join('\n')}

## ❌ **Errors**
${resetResults.errors.length === 0 ? 
  '- No errors occurred ✅' : 
  resetResults.errors.map(e => `- ${e.operation}: ${e.error}`).join('\n')}

## 📋 **Next Steps**

### Immediate Actions Required
${resetResults.productionReadiness.blockers.length > 0 ? 
  '1. **CRITICAL**: Resolve all blockers before deployment\n2. Re-run this script to verify fixes' :
  '1. ✅ No immediate actions required'}

### Pre-Deployment Checklist
- [ ] Verify all environment variables are set for production
- [ ] Test core user flows (registration, agent creation, chat)
- [ ] Verify SSL certificates and domain configuration
- [ ] Set up monitoring and error tracking
- [ ] Configure backup procedures
- [ ] Prepare rollback plan

### Post-Deployment Monitoring
- [ ] Monitor system performance and error rates
- [ ] Verify vector database operations
- [ ] Check user authentication flows
- [ ] Monitor API response times
- [ ] Validate email delivery (if configured)

---

**Generated**: ${new Date().toISOString()}  
**Script Version**: 1.0.0  
**Platform**: AI Agent Platform - Soft Launch Reset  
`;

  try {
    if (!config.dryRun) {
      await fs.writeFile(config.deployStatusFile, deployStatus, 'utf8');
    }
    console.log(`📄 Deployment status written to: ${config.deployStatusFile}`);
  } catch (error) {
    resetResults.errors.push({
      operation: 'deployment_status',
      error: error.message
    });
    console.log(`❌ Failed to write deployment status: ${error.message}`);
  }
}

async function createFinalBackup() {
  addOperation('Creating final backup');
  
  try {
    const backupFile = path.join(config.backupDir, `reset-backup-${Date.now()}.json`);
    const backupData = {
      timestamp: new Date().toISOString(),
      resetResults,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasChromaDB: !!process.env.CHROMADB_URL,
        hasDatabaseUrl: !!process.env.DATABASE_URL
      }
    };

    if (!config.dryRun) {
      await fs.writeFile(backupFile, JSON.stringify(backupData, null, 2), 'utf8');
    }
    
    console.log(`💾 Final backup created: ${backupFile}`);
  } catch (error) {
    resetResults.warnings.push(`Backup creation failed: ${error.message}`);
  }
}

// Helper functions
function addOperation(name) {
  const operation = {
    name,
    status: 'started',
    timestamp: new Date()
  };
  
  resetResults.operations.push(operation);
  console.log(`\n🔄 ${name}...`);
  
  return operation;
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { main, config, resetResults }; 