/**
 * 🛡️ PRE-MIGRATION BACKUP SCRIPT
 * Phase 3, Day 9 - Data Backup & Preparation
 * 
 * Creates comprehensive backup of all data before migration
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const { PrismaClient } = require('@prisma/client');

const execAsync = promisify(exec);
const prisma = new PrismaClient();

// Backup configuration
const BACKUP_CONFIG = {
  timestamp: new Date().toISOString().replace(/[:.]/g, '-'),
  backupDir: path.join(process.cwd(), 'backups'),
  databasePath: path.join(process.cwd(), 'data', 'database.db'),
  uploadsPath: path.join(process.cwd(), 'uploads'),
  schemaPath: path.join(process.cwd(), 'prisma', 'schema.prisma')
};

// Backup directories
const BACKUP_PATHS = {
  database: path.join(BACKUP_CONFIG.backupDir, `database-${BACKUP_CONFIG.timestamp}`),
  uploads: path.join(BACKUP_CONFIG.backupDir, `uploads-${BACKUP_CONFIG.timestamp}`),
  schema: path.join(BACKUP_CONFIG.backupDir, `schema-${BACKUP_CONFIG.timestamp}`),
  exports: path.join(BACKUP_CONFIG.backupDir, `exports-${BACKUP_CONFIG.timestamp}`),
  validation: path.join(BACKUP_CONFIG.backupDir, `validation-${BACKUP_CONFIG.timestamp}`)
};

class PreMigrationBackup {
  constructor() {
    this.startTime = Date.now();
    this.backupSummary = {
      timestamp: BACKUP_CONFIG.timestamp,
      status: 'in_progress',
      steps: {
        environment: { status: 'pending', duration: 0 },
        database: { status: 'pending', duration: 0, records: {} },
        files: { status: 'pending', duration: 0, fileCount: 0 },
        schema: { status: 'pending', duration: 0 },
        validation: { status: 'pending', duration: 0 },
        export: { status: 'pending', duration: 0 }
      },
      errors: [],
      warnings: []
    };
  }

  async runBackup() {
    try {
      console.log('🛡️ Starting Pre-Migration Backup...');
      console.log(`📅 Timestamp: ${BACKUP_CONFIG.timestamp}`);
      console.log(`📁 Backup Directory: ${BACKUP_CONFIG.backupDir}`);
      console.log('=' .repeat(60));

      // Create backup directories
      await this.createBackupDirectories();

      // Step 1: Environment backup
      await this.backupEnvironment();

      // Step 2: Database backup
      await this.backupDatabase();

      // Step 3: File system backup
      await this.backupFiles();

      // Step 4: Schema backup
      await this.backupSchema();

      // Step 5: Data validation
      await this.validateData();

      // Step 6: Export data
      await this.exportData();

      // Generate summary
      await this.generateSummary();

      console.log('🎉 Pre-Migration Backup Completed Successfully!');
      console.log(`⏱️ Total Duration: ${Date.now() - this.startTime}ms`);

    } catch (error) {
      console.error('❌ Backup failed:', error);
      this.backupSummary.status = 'failed';
      this.backupSummary.errors.push(error.message);
      throw error;
    }
  }

  async createBackupDirectories() {
    console.log('📁 Creating backup directories...');
    
    // Create main backup directory
    if (!fs.existsSync(BACKUP_CONFIG.backupDir)) {
      fs.mkdirSync(BACKUP_CONFIG.backupDir, { recursive: true });
    }

    // Create all backup subdirectories
    Object.values(BACKUP_PATHS).forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    console.log('✅ Backup directories created');
  }

  async backupEnvironment() {
    const stepStart = Date.now();
    console.log('🔧 Backing up environment...');
    
    try {
      // Backup environment files
      const envFiles = ['.env', '.env.local', '.env.production'];
      let backedUpFiles = 0;

      for (const envFile of envFiles) {
        const envPath = path.join(process.cwd(), envFile);
        if (fs.existsSync(envPath)) {
          const backupPath = path.join(BACKUP_PATHS.database, envFile);
          fs.copyFileSync(envPath, backupPath);
          backedUpFiles++;
        }
      }

      // Backup package.json and package-lock.json
      const packageFiles = ['package.json', 'package-lock.json'];
      for (const packageFile of packageFiles) {
        const packagePath = path.join(process.cwd(), packageFile);
        if (fs.existsSync(packagePath)) {
          const backupPath = path.join(BACKUP_PATHS.database, packageFile);
          fs.copyFileSync(packagePath, backupPath);
          backedUpFiles++;
        }
      }

      // Create environment info
      const envInfo = {
        nodeVersion: process.version,
        platform: process.platform,
        cwd: process.cwd(),
        timestamp: new Date().toISOString(),
        backupFiles: backedUpFiles
      };

      fs.writeFileSync(
        path.join(BACKUP_PATHS.database, 'environment-info.json'),
        JSON.stringify(envInfo, null, 2)
      );

      this.backupSummary.steps.environment = {
        status: 'completed',
        duration: Date.now() - stepStart,
        fileCount: backedUpFiles
      };

      console.log(`✅ Environment backup completed (${backedUpFiles} files)`);

    } catch (error) {
      this.backupSummary.steps.environment.status = 'failed';
      this.backupSummary.errors.push(`Environment backup failed: ${error.message}`);
      throw error;
    }
  }

  async backupDatabase() {
    const stepStart = Date.now();
    console.log('🗄️ Backing up database...');
    
    try {
      // Copy database file
      if (fs.existsSync(BACKUP_CONFIG.databasePath)) {
        const backupDbPath = path.join(BACKUP_PATHS.database, 'database.db');
        fs.copyFileSync(BACKUP_CONFIG.databasePath, backupDbPath);
        
        // Get database file size
        const dbStats = fs.statSync(backupDbPath);
        
        console.log(`📊 Database file backed up (${(dbStats.size / 1024 / 1024).toFixed(2)} MB)`);
      }

      // Count records in key tables
      const recordCounts = await this.countRecords();
      
      // Save record counts
      fs.writeFileSync(
        path.join(BACKUP_PATHS.validation, 'record-counts.json'),
        JSON.stringify(recordCounts, null, 2)
      );

      this.backupSummary.steps.database = {
        status: 'completed',
        duration: Date.now() - stepStart,
        records: recordCounts
      };

      console.log('✅ Database backup completed');
      console.log(`📊 Records: DataImports(${recordCounts.dataImports}), Documents(${recordCounts.documents}), Users(${recordCounts.users})`);

    } catch (error) {
      this.backupSummary.steps.database.status = 'failed';
      this.backupSummary.errors.push(`Database backup failed: ${error.message}`);
      throw error;
    }
  }

  async backupFiles() {
    const stepStart = Date.now();
    console.log('📄 Backing up files...');
    
    try {
      let fileCount = 0;
      
      // Backup uploads directory
      if (fs.existsSync(BACKUP_CONFIG.uploadsPath)) {
        await this.copyDirectory(BACKUP_CONFIG.uploadsPath, BACKUP_PATHS.uploads);
        fileCount = await this.countFiles(BACKUP_PATHS.uploads);
      }

      // Calculate total size
      const totalSize = await this.calculateDirectorySize(BACKUP_PATHS.uploads);

      this.backupSummary.steps.files = {
        status: 'completed',
        duration: Date.now() - stepStart,
        fileCount,
        totalSize
      };

      console.log(`✅ Files backup completed (${fileCount} files, ${(totalSize / 1024 / 1024).toFixed(2)} MB)`);

    } catch (error) {
      this.backupSummary.steps.files.status = 'failed';
      this.backupSummary.errors.push(`Files backup failed: ${error.message}`);
      throw error;
    }
  }

  async backupSchema() {
    const stepStart = Date.now();
    console.log('📋 Backing up schema...');
    
    try {
      // Copy schema file
      if (fs.existsSync(BACKUP_CONFIG.schemaPath)) {
        const backupSchemaPath = path.join(BACKUP_PATHS.schema, 'schema.prisma');
        fs.copyFileSync(BACKUP_CONFIG.schemaPath, backupSchemaPath);
      }

      // Generate schema introspection
      try {
        const { stdout } = await execAsync('npx prisma db pull --schema=prisma/schema-backup.prisma');
        
        // Copy generated schema
        const backupSchemaPath = path.join(BACKUP_PATHS.schema, 'schema-introspected.prisma');
        if (fs.existsSync('prisma/schema-backup.prisma')) {
          fs.copyFileSync('prisma/schema-backup.prisma', backupSchemaPath);
        }
        
        console.log('📊 Schema introspection completed');
      } catch (error) {
        console.warn('⚠️ Schema introspection failed:', error.message);
        this.backupSummary.warnings.push('Schema introspection failed');
      }

      this.backupSummary.steps.schema = {
        status: 'completed',
        duration: Date.now() - stepStart
      };

      console.log('✅ Schema backup completed');

    } catch (error) {
      this.backupSummary.steps.schema.status = 'failed';
      this.backupSummary.errors.push(`Schema backup failed: ${error.message}`);
      throw error;
    }
  }

  async validateData() {
    const stepStart = Date.now();
    console.log('🔍 Validating data integrity...');
    
    try {
      const validation = {
        timestamp: new Date().toISOString(),
        checks: {
          dataImports: await this.validateDataImports(),
          documents: await this.validateDocuments(),
          users: await this.validateUsers(),
          foreignKeys: await this.validateForeignKeys()
        }
      };

      // Save validation results
      fs.writeFileSync(
        path.join(BACKUP_PATHS.validation, 'validation-results.json'),
        JSON.stringify(validation, null, 2)
      );

      this.backupSummary.steps.validation = {
        status: 'completed',
        duration: Date.now() - stepStart,
        checks: validation.checks
      };

      console.log('✅ Data validation completed');

    } catch (error) {
      this.backupSummary.steps.validation.status = 'failed';
      this.backupSummary.errors.push(`Data validation failed: ${error.message}`);
      throw error;
    }
  }

  async exportData() {
    const stepStart = Date.now();
    console.log('📤 Exporting data...');
    
    try {
      // Export DataImports
      const dataImports = await prisma.dataImport.findMany({
        include: {
          analytics: true,
          conversations: true
        }
      });

      fs.writeFileSync(
        path.join(BACKUP_PATHS.exports, 'data-imports.json'),
        JSON.stringify(dataImports, null, 2)
      );

      // Export Documents
      const documents = await prisma.document.findMany();
      
      fs.writeFileSync(
        path.join(BACKUP_PATHS.exports, 'documents.json'),
        JSON.stringify(documents, null, 2)
      );

      // Export Users (without sensitive data)
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          plan: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      });

      fs.writeFileSync(
        path.join(BACKUP_PATHS.exports, 'users.json'),
        JSON.stringify(users, null, 2)
      );

      this.backupSummary.steps.export = {
        status: 'completed',
        duration: Date.now() - stepStart,
        exports: {
          dataImports: dataImports.length,
          documents: documents.length,
          users: users.length
        }
      };

      console.log(`✅ Data export completed (${dataImports.length} imports, ${documents.length} docs, ${users.length} users)`);

    } catch (error) {
      this.backupSummary.steps.export.status = 'failed';
      this.backupSummary.errors.push(`Data export failed: ${error.message}`);
      throw error;
    }
  }

  async generateSummary() {
    console.log('📊 Generating backup summary...');
    
    this.backupSummary.status = 'completed';
    this.backupSummary.totalDuration = Date.now() - this.startTime;
    
    // Save summary
    fs.writeFileSync(
      path.join(BACKUP_CONFIG.backupDir, `backup-summary-${BACKUP_CONFIG.timestamp}.json`),
      JSON.stringify(this.backupSummary, null, 2)
    );

    // Generate readable report
    const report = this.generateReadableReport();
    fs.writeFileSync(
      path.join(BACKUP_CONFIG.backupDir, `backup-report-${BACKUP_CONFIG.timestamp}.md`),
      report
    );

    console.log('✅ Backup summary generated');
  }

  generateReadableReport() {
    const { steps, errors, warnings } = this.backupSummary;
    
    return `# Pre-Migration Backup Report

**Timestamp:** ${BACKUP_CONFIG.timestamp}
**Status:** ${this.backupSummary.status}
**Duration:** ${this.backupSummary.totalDuration}ms

## Backup Steps

### Environment Backup
- **Status:** ${steps.environment.status}
- **Duration:** ${steps.environment.duration}ms
- **Files:** ${steps.environment.fileCount || 0}

### Database Backup
- **Status:** ${steps.database.status}
- **Duration:** ${steps.database.duration}ms
- **Records:** ${JSON.stringify(steps.database.records || {})}

### Files Backup
- **Status:** ${steps.files.status}
- **Duration:** ${steps.files.duration}ms
- **Files:** ${steps.files.fileCount || 0}
- **Size:** ${((steps.files.totalSize || 0) / 1024 / 1024).toFixed(2)} MB

### Schema Backup
- **Status:** ${steps.schema.status}
- **Duration:** ${steps.schema.duration}ms

### Data Validation
- **Status:** ${steps.validation.status}
- **Duration:** ${steps.validation.duration}ms

### Data Export
- **Status:** ${steps.export.status}
- **Duration:** ${steps.export.duration}ms
- **Exports:** ${JSON.stringify(steps.export.exports || {})}

## Issues

### Errors
${errors.length > 0 ? errors.map(e => `- ${e}`).join('\n') : 'None'}

### Warnings
${warnings.length > 0 ? warnings.map(w => `- ${w}`).join('\n') : 'None'}

## Backup Locations

- **Database:** ${BACKUP_PATHS.database}
- **Files:** ${BACKUP_PATHS.uploads}
- **Schema:** ${BACKUP_PATHS.schema}
- **Exports:** ${BACKUP_PATHS.exports}
- **Validation:** ${BACKUP_PATHS.validation}
`;
  }

  // Helper methods
  async countRecords() {
    const [dataImports, documents, users, agents, conversations] = await Promise.all([
      prisma.dataImport.count(),
      prisma.document.count(),
      prisma.user.count(),
      prisma.agent.count(),
      prisma.conversation.count()
    ]);

    return { dataImports, documents, users, agents, conversations };
  }

  async validateDataImports() {
    const total = await prisma.dataImport.count();
    const withFiles = await prisma.dataImport.count({
      where: { originalFile: { not: null } }
    });
    const completed = await prisma.dataImport.count({
      where: { status: 'COMPLETED' }
    });

    return { total, withFiles, completed, valid: total > 0 };
  }

  async validateDocuments() {
    const total = await prisma.document.count();
    const processed = await prisma.document.count({
      where: { status: 'PROCESSED' }
    });
    const withContent = await prisma.document.count({
      where: { content: { not: null } }
    });

    return { total, processed, withContent, valid: total > 0 };
  }

  async validateUsers() {
    const total = await prisma.user.count();
    const active = await prisma.user.count({
      where: { isActive: true }
    });
    const withEmails = await prisma.user.count({
      where: { email: { not: null } }
    });

    return { total, active, withEmails, valid: total > 0 };
  }

  async validateForeignKeys() {
    // Check for orphaned records
    const orphanedDataImports = await prisma.dataImport.count({
      where: { user: null }
    });
    const orphanedDocuments = await prisma.document.count({
      where: { user: null }
    });

    return { 
      orphanedDataImports, 
      orphanedDocuments, 
      valid: orphanedDataImports === 0 && orphanedDocuments === 0 
    };
  }

  async copyDirectory(src, dest) {
    try {
      await execAsync(`cp -r "${src}" "${dest}"`);
    } catch (error) {
      // Fallback for Windows
      await execAsync(`xcopy "${src}" "${dest}" /E /I /Y`);
    }
  }

  async countFiles(dir) {
    try {
      const { stdout } = await execAsync(`find "${dir}" -type f | wc -l`);
      return parseInt(stdout.trim());
    } catch (error) {
      // Fallback manual count
      let count = 0;
      const walk = (dir) => {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            walk(filePath);
          } else {
            count++;
          }
        });
      };
      walk(dir);
      return count;
    }
  }

  async calculateDirectorySize(dir) {
    try {
      const { stdout } = await execAsync(`du -sb "${dir}" | cut -f1`);
      return parseInt(stdout.trim());
    } catch (error) {
      return 0;
    }
  }
}

// Main execution
async function main() {
  try {
    const backup = new PreMigrationBackup();
    await backup.runBackup();
    
    console.log('\n🎯 BACKUP COMPLETE - READY FOR MIGRATION');
    console.log('=' .repeat(60));
    console.log(`📁 Backup Location: ${BACKUP_CONFIG.backupDir}`);
    console.log(`📊 Summary: backup-summary-${BACKUP_CONFIG.timestamp}.json`);
    console.log(`📋 Report: backup-report-${BACKUP_CONFIG.timestamp}.md`);
    console.log('=' .repeat(60));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { PreMigrationBackup, BACKUP_CONFIG, BACKUP_PATHS }; 