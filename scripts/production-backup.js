#!/usr/bin/env node

/**
 * 🗄️ Production Backup Script
 * Automated backup system for production database
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

async function createBackup() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = './backups/production';
    
    // Ensure backup directory exists
    await fs.mkdir(backupDir, { recursive: true });
    
    // Create database backup
    const dbBackupPath = path.join(backupDir, `database-backup-${timestamp}.db`);
    execSync(`cp prisma/dev.db "${dbBackupPath}"`);
    
    // Create configuration backup
    const configBackupPath = path.join(backupDir, `config-backup-${timestamp}.json`);
    const configData = {
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing',
      nextAuthSecret: process.env.NEXTAUTH_SECRET ? 'configured' : 'missing',
      openaiApiKey: process.env.OPENAI_API_KEY ? 'configured' : 'missing'
    };
    
    await fs.writeFile(configBackupPath, JSON.stringify(configData, null, 2));
    
    console.log(`✅ Backup created successfully:`);
    console.log(`📁 Database: ${dbBackupPath}`);
    console.log(`📁 Config: ${configBackupPath}`);
    
    return { success: true, timestamp };
    
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Run backup if called directly
if (require.main === module) {
  createBackup().then(result => {
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = { createBackup };
