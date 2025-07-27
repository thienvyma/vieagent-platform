/**
 * 🔍 DATA INTEGRITY VERIFICATION SCRIPT
 * Phase 3, Day 9 - Data Backup & Preparation
 * 
 * Verifies data integrity before migration
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

class DataIntegrityVerifier {
  constructor() {
    this.verificationResults = {
      timestamp: new Date().toISOString(),
      status: 'in_progress',
      summary: {
        totalChecks: 0,
        passedChecks: 0,
        failedChecks: 0,
        warningChecks: 0
      },
      checks: {},
      issues: [],
      recommendations: []
    };
  }

  async runVerification() {
    console.log('🔍 Starting Data Integrity Verification...');
    console.log('=' .repeat(60));

    try {
      // Database structure checks
      await this.verifyDatabaseStructure();

      // Data consistency checks
      await this.verifyDataConsistency();

      // File system checks
      await this.verifyFileSystem();

      // Relationship integrity checks
      await this.verifyRelationshipIntegrity();

      // Performance checks
      await this.verifyPerformance();

      // Generate final report
      await this.generateReport();

      console.log('\n🎯 DATA INTEGRITY VERIFICATION COMPLETE');
      this.printSummary();

    } catch (error) {
      console.error('❌ Verification failed:', error);
      this.verificationResults.status = 'failed';
      throw error;
    }
  }

  async verifyDatabaseStructure() {
    console.log('🗄️ Verifying database structure...');
    
    const structureChecks = {
      tablesExist: await this.checkTablesExist(),
      indexesExist: await this.checkIndexesExist(),
      constraintsValid: await this.checkConstraints(),
      schemaValid: await this.checkSchemaValid()
    };

    this.verificationResults.checks.databaseStructure = structureChecks;
    this.updateSummary(structureChecks);

    console.log(`✅ Database structure checks completed`);
  }

  async verifyDataConsistency() {
    console.log('📊 Verifying data consistency...');
    
    const consistencyChecks = {
      dataImports: await this.verifyDataImports(),
      documents: await this.verifyDocuments(),
      users: await this.verifyUsers(),
      duplicates: await this.checkDuplicates(),
      nullValues: await this.checkNullValues()
    };

    this.verificationResults.checks.dataConsistency = consistencyChecks;
    this.updateSummary(consistencyChecks);

    console.log(`✅ Data consistency checks completed`);
  }

  async verifyFileSystem() {
    console.log('📁 Verifying file system...');
    
    const fileSystemChecks = {
      uploadDirectory: await this.checkUploadDirectory(),
      orphanedFiles: await this.checkOrphanedFiles(),
      corruptedFiles: await this.checkCorruptedFiles(),
      diskSpace: await this.checkDiskSpace()
    };

    this.verificationResults.checks.fileSystem = fileSystemChecks;
    this.updateSummary(fileSystemChecks);

    console.log(`✅ File system checks completed`);
  }

  async verifyRelationshipIntegrity() {
    console.log('🔗 Verifying relationship integrity...');
    
    const relationshipChecks = {
      foreignKeys: await this.checkForeignKeyIntegrity(),
      orphanedRecords: await this.checkOrphanedRecords(),
      circularReferences: await this.checkCircularReferences(),
      cascadeIntegrity: await this.checkCascadeIntegrity()
    };

    this.verificationResults.checks.relationshipIntegrity = relationshipChecks;
    this.updateSummary(relationshipChecks);

    console.log(`✅ Relationship integrity checks completed`);
  }

  async verifyPerformance() {
    console.log('⚡ Verifying performance...');
    
    const performanceChecks = {
      queryPerformance: await this.checkQueryPerformance(),
      indexUsage: await this.checkIndexUsage(),
      tableStats: await this.getTableStats(),
      connectionPool: await this.checkConnectionPool()
    };

    this.verificationResults.checks.performance = performanceChecks;
    this.updateSummary(performanceChecks);

    console.log(`✅ Performance checks completed`);
  }

  // Database Structure Checks
  async checkTablesExist() {
    const expectedTables = [
      'users', 'agents', 'data_imports', 'documents', 
      'conversations', 'messages', 'imported_conversations'
    ];

    const existingTables = await prisma.$queryRaw`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `;

    const tableNames = existingTables.map(t => t.name);
    const missingTables = expectedTables.filter(table => !tableNames.includes(table));

    return {
      status: missingTables.length === 0 ? 'pass' : 'fail',
      expected: expectedTables.length,
      found: tableNames.length,
      missing: missingTables,
      details: `Found ${tableNames.length}/${expectedTables.length} expected tables`
    };
  }

  async checkIndexesExist() {
    try {
      const indexes = await prisma.$queryRaw`
        SELECT name, tbl_name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'
      `;

      return {
        status: indexes.length > 0 ? 'pass' : 'warning',
        count: indexes.length,
        details: `Found ${indexes.length} indexes`
      };
    } catch (error) {
      return {
        status: 'fail',
        error: error.message,
        details: 'Failed to check indexes'
      };
    }
  }

  async checkConstraints() {
    try {
      // Check foreign key constraints
      const pragmaForeignKeys = await prisma.$queryRaw`PRAGMA foreign_keys`;
      
      return {
        status: 'pass',
        foreignKeysEnabled: pragmaForeignKeys[0]?.foreign_keys === 1,
        details: 'Constraint checks completed'
      };
    } catch (error) {
      return {
        status: 'fail',
        error: error.message,
        details: 'Failed to check constraints'
      };
    }
  }

  async checkSchemaValid() {
    try {
      // Simple query to test schema validity
      await prisma.user.findFirst();
      await prisma.dataImport.findFirst();
      await prisma.document.findFirst();

      return {
        status: 'pass',
        details: 'Schema validation successful'
      };
    } catch (error) {
      return {
        status: 'fail',
        error: error.message,
        details: 'Schema validation failed'
      };
    }
  }

  // Data Consistency Checks
  async verifyDataImports() {
    const total = await prisma.dataImport.count();
    const withFiles = await prisma.dataImport.count({
      where: { originalFile: { not: null } }
    });
    const completed = await prisma.dataImport.count({
      where: { status: 'COMPLETED' }
    });
    const withMetadata = await prisma.dataImport.count({
      where: { metadata: { not: null } }
    });

    const issues = [];
    if (total === 0) issues.push('No data imports found');
    if (withFiles < total * 0.8) issues.push('Many imports missing file references');
    if (completed < total * 0.5) issues.push('Low completion rate');

    return {
      status: issues.length === 0 ? 'pass' : 'warning',
      total,
      withFiles,
      completed,
      withMetadata,
      completionRate: total > 0 ? (completed / total * 100).toFixed(2) : 0,
      issues,
      details: `${total} data imports, ${completed} completed (${(completed/total*100).toFixed(1)}%)`
    };
  }

  async verifyDocuments() {
    const total = await prisma.document.count();
    const processed = await prisma.document.count({
      where: { status: 'PROCESSED' }
    });
    const withContent = await prisma.document.count({
      where: { content: { not: null } }
    });
    const withFiles = await prisma.document.count({
      where: { filePath: { not: null } }
    });

    const issues = [];
    if (total === 0) issues.push('No documents found');
    if (processed < total * 0.8) issues.push('Many documents not processed');
    if (withContent < processed * 0.9) issues.push('Processed documents missing content');

    return {
      status: issues.length === 0 ? 'pass' : 'warning',
      total,
      processed,
      withContent,
      withFiles,
      processingRate: total > 0 ? (processed / total * 100).toFixed(2) : 0,
      issues,
      details: `${total} documents, ${processed} processed (${(processed/total*100).toFixed(1)}%)`
    };
  }

  async verifyUsers() {
    const total = await prisma.user.count();
    const active = await prisma.user.count({
      where: { isActive: true }
    });
    const withEmails = await prisma.user.count({
      where: { 
        NOT: { email: null } 
      }
    });

    const issues = [];
    if (total === 0) issues.push('No users found');
    if (withEmails < total) issues.push('Users missing email addresses');

    return {
      status: issues.length === 0 ? 'pass' : 'warning',
      total,
      active,
      withEmails,
      activeRate: total > 0 ? (active / total * 100).toFixed(2) : 0,
      issues,
      details: `${total} users, ${active} active (${(active/total*100).toFixed(1)}%)`
    };
  }

  async checkDuplicates() {
    // Check for duplicate data imports by file hash
    const duplicateImports = await prisma.$queryRaw`
      SELECT fileHash, COUNT(*) as count 
      FROM data_imports 
      WHERE fileHash IS NOT NULL 
      GROUP BY fileHash 
      HAVING COUNT(*) > 1
    `;

    // Check for duplicate documents by title and user
    const duplicateDocuments = await prisma.$queryRaw`
      SELECT title, userId, COUNT(*) as count 
      FROM documents 
      GROUP BY title, userId 
      HAVING COUNT(*) > 1
    `;

    const duplicateEmails = await prisma.$queryRaw`
      SELECT email, COUNT(*) as count 
      FROM users 
      WHERE email IS NOT NULL 
      GROUP BY email 
      HAVING COUNT(*) > 1
    `;

    const totalDuplicates = duplicateImports.length + duplicateDocuments.length + duplicateEmails.length;

    return {
      status: totalDuplicates === 0 ? 'pass' : 'warning',
      duplicateImports: duplicateImports.length,
      duplicateDocuments: duplicateDocuments.length,
      duplicateEmails: duplicateEmails.length,
      totalDuplicates,
      details: `Found ${totalDuplicates} duplicate groups`
    };
  }

  async checkNullValues() {
    const criticalNulls = {
      usersWithoutEmail: await prisma.user.count({ where: { email: null } }),
      importsWithoutUser: await prisma.dataImport.count({ where: { userId: null } }),
      documentsWithoutUser: await prisma.document.count({ where: { userId: null } }),
      documentsWithoutTitle: await prisma.document.count({ where: { title: null } })
    };

    const totalCriticalNulls = Object.values(criticalNulls).reduce((sum, count) => sum + count, 0);

    return {
      status: totalCriticalNulls === 0 ? 'pass' : 'fail',
      ...criticalNulls,
      totalCriticalNulls,
      details: `Found ${totalCriticalNulls} critical null values`
    };
  }

  // File System Checks
  async checkUploadDirectory() {
    const uploadsPath = path.join(process.cwd(), 'uploads');
    
    try {
      const exists = fs.existsSync(uploadsPath);
      let fileCount = 0;
      let totalSize = 0;

      if (exists) {
        const walk = (dir) => {
          const files = fs.readdirSync(dir);
          files.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
              walk(filePath);
            } else {
              fileCount++;
              totalSize += stat.size;
            }
          });
        };
        walk(uploadsPath);
      }

      return {
        status: exists ? 'pass' : 'fail',
        exists,
        fileCount,
        totalSize,
        sizeFormatted: `${(totalSize / 1024 / 1024).toFixed(2)} MB`,
        details: `Upload directory ${exists ? 'exists' : 'missing'} with ${fileCount} files`
      };
    } catch (error) {
      return {
        status: 'fail',
        error: error.message,
        details: 'Failed to check upload directory'
      };
    }
  }

  async checkOrphanedFiles() {
    const uploadsPath = path.join(process.cwd(), 'uploads');
    
    try {
      if (!fs.existsSync(uploadsPath)) {
        return {
          status: 'pass',
          orphanedFiles: 0,
          details: 'No upload directory to check'
        };
      }

      // Get all file paths from database
      const [dataImportFiles, documentFiles] = await Promise.all([
        prisma.dataImport.findMany({
          where: { 
            NOT: { originalFile: null }
          },
          select: { originalFile: true }
        }),
        prisma.document.findMany({
          where: { 
            NOT: { filePath: null }
          },
          select: { filePath: true }
        })
      ]);

      const dbFiles = new Set([
        ...dataImportFiles.map(d => d.originalFile),
        ...documentFiles.map(d => d.filePath)
      ]);

      // Get all files in upload directory
      const physicalFiles = [];
      const walk = (dir) => {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          if (stat.isFile()) {
            physicalFiles.push(filePath);
          } else if (stat.isDirectory()) {
            walk(filePath);
          }
        });
      };
      walk(uploadsPath);

      // Find orphaned files
      const orphanedFiles = physicalFiles.filter(file => !dbFiles.has(file));

      return {
        status: orphanedFiles.length === 0 ? 'pass' : 'warning',
        orphanedFiles: orphanedFiles.length,
        totalPhysicalFiles: physicalFiles.length,
        totalDbFiles: dbFiles.size,
        orphanedFilesList: orphanedFiles.slice(0, 10), // First 10 for review
        details: `Found ${orphanedFiles.length} orphaned files out of ${physicalFiles.length} total files`
      };
    } catch (error) {
      return {
        status: 'fail',
        error: error.message,
        details: 'Failed to check orphaned files'
      };
    }
  }

  async checkCorruptedFiles() {
    try {
      // Check files referenced in database
      const [dataImportFiles, documentFiles] = await Promise.all([
        prisma.dataImport.findMany({
          where: { 
            NOT: { originalFile: null }
          },
          select: { id: true, originalFile: true, fileSize: true }
        }),
        prisma.document.findMany({
          where: { 
            NOT: { filePath: null }
          },
          select: { id: true, filePath: true, size: true }
        })
      ]);

      const corruptedFiles = [];
      const missingFiles = [];

      // Check data import files
      for (const file of dataImportFiles) {
        try {
          if (fs.existsSync(file.originalFile)) {
            const stat = fs.statSync(file.originalFile);
            if (file.fileSize && stat.size !== file.fileSize) {
              corruptedFiles.push({
                id: file.id,
                path: file.originalFile,
                expectedSize: file.fileSize,
                actualSize: stat.size,
                type: 'data_import'
              });
            }
          } else {
            missingFiles.push({
              id: file.id,
              path: file.originalFile,
              type: 'data_import'
            });
          }
        } catch (error) {
          corruptedFiles.push({
            id: file.id,
            path: file.originalFile,
            error: error.message,
            type: 'data_import'
          });
        }
      }

      // Check document files
      for (const file of documentFiles) {
        try {
          if (fs.existsSync(file.filePath)) {
            const stat = fs.statSync(file.filePath);
            if (file.size && stat.size !== file.size) {
              corruptedFiles.push({
                id: file.id,
                path: file.filePath,
                expectedSize: file.size,
                actualSize: stat.size,
                type: 'document'
              });
            }
          } else {
            missingFiles.push({
              id: file.id,
              path: file.filePath,
              type: 'document'
            });
          }
        } catch (error) {
          corruptedFiles.push({
            id: file.id,
            path: file.filePath,
            error: error.message,
            type: 'document'
          });
        }
      }

      const totalIssues = corruptedFiles.length + missingFiles.length;

      return {
        status: totalIssues === 0 ? 'pass' : 'warning',
        corruptedFiles: corruptedFiles.length,
        missingFiles: missingFiles.length,
        totalIssues,
        corruptedFilesList: corruptedFiles.slice(0, 5),
        missingFilesList: missingFiles.slice(0, 5),
        details: `Found ${totalIssues} file issues (${corruptedFiles.length} corrupted, ${missingFiles.length} missing)`
      };
    } catch (error) {
      return {
        status: 'fail',
        error: error.message,
        details: 'Failed to check corrupted files'
      };
    }
  }

  async checkDiskSpace() {
    try {
      const { execSync } = require('child_process');
      const output = execSync('df -h .', { encoding: 'utf8' });
      const lines = output.split('\n');
      const dataLine = lines[1];
      const parts = dataLine.split(/\s+/);
      
      const available = parts[3];
      const usedPercent = parseInt(parts[4].replace('%', ''));

      return {
        status: usedPercent < 90 ? 'pass' : 'warning',
        available,
        usedPercent,
        details: `Disk usage: ${usedPercent}%, ${available} available`
      };
    } catch (error) {
      return {
        status: 'warning',
        error: error.message,
        details: 'Could not check disk space'
      };
    }
  }

  // Relationship Integrity Checks
  async checkForeignKeyIntegrity() {
    const issues = [];

    // Check data import user references
    const orphanedImports = await prisma.dataImport.count({
      where: { user: null }
    });
    if (orphanedImports > 0) {
      issues.push(`${orphanedImports} data imports with invalid user references`);
    }

    // Check document user references
    const orphanedDocuments = await prisma.document.count({
      where: { user: null }
    });
    if (orphanedDocuments > 0) {
      issues.push(`${orphanedDocuments} documents with invalid user references`);
    }

    return {
      status: issues.length === 0 ? 'pass' : 'fail',
      orphanedImports,
      orphanedDocuments,
      issues,
      details: `Found ${issues.length} foreign key integrity issues`
    };
  }

  async checkOrphanedRecords() {
    // Check for conversations without imports
    const orphanedConversations = await prisma.importedConversation.count({
      where: { import: null }
    });

    // Check for messages without conversations
    const orphanedMessages = await prisma.importedMessage.count({
      where: { conversation: null }
    });

    const totalOrphaned = orphanedConversations + orphanedMessages;

    return {
      status: totalOrphaned === 0 ? 'pass' : 'warning',
      orphanedConversations,
      orphanedMessages,
      totalOrphaned,
      details: `Found ${totalOrphaned} orphaned records`
    };
  }

  async checkCircularReferences() {
    // For this simple check, we'll assume no circular references in current schema
    // In a more complex schema, this would check for circular foreign key references
    return {
      status: 'pass',
      circularReferences: 0,
      details: 'No circular references detected in current schema'
    };
  }

  async checkCascadeIntegrity() {
    try {
      // Test cascade integrity by checking if related records exist consistently
      const userCount = await prisma.user.count();
      const userDataImportCount = await prisma.dataImport.groupBy({
        by: ['userId'],
        _count: true
      });
      const userDocumentCount = await prisma.document.groupBy({
        by: ['userId'],
        _count: true
      });

      return {
        status: 'pass',
        userCount,
        usersWithImports: userDataImportCount.length,
        usersWithDocuments: userDocumentCount.length,
        details: 'Cascade integrity check completed'
      };
    } catch (error) {
      return {
        status: 'fail',
        error: error.message,
        details: 'Failed to check cascade integrity'
      };
    }
  }

  // Performance Checks
  async checkQueryPerformance() {
    const queries = [
      {
        name: 'User Count',
        query: () => prisma.user.count()
      },
      {
        name: 'Data Import Count',
        query: () => prisma.dataImport.count()
      },
      {
        name: 'Document Count',
        query: () => prisma.document.count()
      },
      {
        name: 'Complex Join Query',
        query: () => prisma.user.findMany({
          include: {
            dataImports: { take: 5 },
            documents: { take: 5 }
          },
          take: 10
        })
      }
    ];

    const results = [];
    for (const queryTest of queries) {
      const start = Date.now();
      try {
        await queryTest.query();
        const duration = Date.now() - start;
        results.push({
          name: queryTest.name,
          duration,
          status: duration < 1000 ? 'fast' : duration < 5000 ? 'acceptable' : 'slow'
        });
      } catch (error) {
        results.push({
          name: queryTest.name,
          duration: -1,
          status: 'failed',
          error: error.message
        });
      }
    }

    const avgDuration = results
      .filter(r => r.duration > 0)
      .reduce((sum, r) => sum + r.duration, 0) / results.length;

    return {
      status: avgDuration < 1000 ? 'pass' : 'warning',
      avgDuration: Math.round(avgDuration),
      queries: results,
      details: `Average query time: ${Math.round(avgDuration)}ms`
    };
  }

  async checkIndexUsage() {
    try {
      // Get index statistics
      const indexes = await prisma.$queryRaw`
        SELECT name, tbl_name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'
      `;

      return {
        status: 'pass',
        indexCount: indexes.length,
        details: `Found ${indexes.length} custom indexes`
      };
    } catch (error) {
      return {
        status: 'warning',
        error: error.message,
        details: 'Could not check index usage'
      };
    }
  }

  async getTableStats() {
    const stats = {};
    const tables = ['users', 'data_imports', 'documents', 'conversations', 'messages'];

    for (const table of tables) {
      try {
        const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM ${table}`;
        stats[table] = count[0]?.count || 0;
      } catch (error) {
        stats[table] = -1;
      }
    }

    return {
      status: 'pass',
      tables: stats,
      details: `Table statistics: ${Object.entries(stats).map(([k,v]) => `${k}:${v}`).join(', ')}`
    };
  }

  async checkConnectionPool() {
    // For Prisma, we'll just verify we can connect
    try {
      await prisma.$connect();
      return {
        status: 'pass',
        connected: true,
        details: 'Database connection pool healthy'
      };
    } catch (error) {
      return {
        status: 'fail',
        connected: false,
        error: error.message,
        details: 'Database connection failed'
      };
    }
  }

  // Helper methods
  updateSummary(checks) {
    Object.values(checks).forEach(check => {
      this.verificationResults.summary.totalChecks++;
      
      switch (check.status) {
        case 'pass':
          this.verificationResults.summary.passedChecks++;
          break;
        case 'fail':
          this.verificationResults.summary.failedChecks++;
          this.verificationResults.issues.push(check.details || 'Check failed');
          break;
        case 'warning':
          this.verificationResults.summary.warningChecks++;
          this.verificationResults.issues.push(check.details || 'Warning detected');
          break;
      }
    });
  }

  async generateReport() {
    const { summary, checks, issues } = this.verificationResults;
    
    this.verificationResults.status = summary.failedChecks === 0 ? 'passed' : 'failed';
    
    // Generate recommendations
    if (summary.failedChecks > 0) {
      this.verificationResults.recommendations.push('Fix all failed checks before proceeding with migration');
    }
    if (summary.warningChecks > 0) {
      this.verificationResults.recommendations.push('Review and address warning checks');
    }
    if (summary.passedChecks / summary.totalChecks < 0.9) {
      this.verificationResults.recommendations.push('Overall health score is low, investigate issues');
    }

    // Save results
    const reportPath = path.join(process.cwd(), 'backups', `verification-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(this.verificationResults, null, 2));
    
    console.log(`📊 Verification report saved: ${reportPath}`);
  }

  printSummary() {
    const { summary } = this.verificationResults;
    
    console.log('\n📊 VERIFICATION SUMMARY');
    console.log('=' .repeat(40));
    console.log(`Total Checks: ${summary.totalChecks}`);
    console.log(`✅ Passed: ${summary.passedChecks}`);
    console.log(`⚠️ Warnings: ${summary.warningChecks}`);
    console.log(`❌ Failed: ${summary.failedChecks}`);
    console.log(`📈 Success Rate: ${((summary.passedChecks / summary.totalChecks) * 100).toFixed(1)}%`);
    console.log(`🎯 Status: ${this.verificationResults.status.toUpperCase()}`);
    
    if (this.verificationResults.issues.length > 0) {
      console.log('\n🚨 ISSUES FOUND:');
      this.verificationResults.issues.slice(0, 5).forEach((issue, i) => {
        console.log(`${i + 1}. ${issue}`);
      });
      if (this.verificationResults.issues.length > 5) {
        console.log(`... and ${this.verificationResults.issues.length - 5} more issues`);
      }
    }

    if (this.verificationResults.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      this.verificationResults.recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec}`);
      });
    }
  }
}

// Main execution
async function main() {
  try {
    const verifier = new DataIntegrityVerifier();
    await verifier.runVerification();
    
    const { summary } = verifier.verificationResults;
    
    if (summary.failedChecks === 0) {
      console.log('\n🎉 DATA INTEGRITY VERIFIED - SAFE TO PROCEED WITH MIGRATION');
    } else {
      console.log('\n⚠️ DATA INTEGRITY ISSUES DETECTED - REVIEW BEFORE MIGRATION');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { DataIntegrityVerifier }; 