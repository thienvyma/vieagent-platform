#!/usr/bin/env node

/**
 * 🧪 DAY 30: OFFLINE VALIDATION SCRIPT
 * Tests Day 30 components without requiring server to be running
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

class Day30OfflineValidator {
  constructor() {
    this.results = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      tests: []
    };
  }

  async runTest(testName, testFunction) {
    this.results.totalTests++;
    console.log(`\n🧪 Testing: ${testName}`);
    
    try {
      const result = await testFunction();
      if (result) {
        this.results.passedTests++;
        this.results.tests.push({ name: testName, status: 'PASSED', details: result });
        console.log(`✅ ${testName}: PASSED`);
      } else {
        this.results.failedTests++;
        this.results.tests.push({ name: testName, status: 'FAILED', details: 'Test returned false' });
        console.log(`❌ ${testName}: FAILED`);
      }
    } catch (error) {
      this.results.failedTests++;
      this.results.tests.push({ name: testName, status: 'ERROR', details: error.message });
      console.log(`❌ ${testName}: ERROR - ${error.message}`);
    }
  }

  async validateDatabase() {
    return await this.runTest('Database Connection', async () => {
      const userCount = await prisma.user.count();
      return userCount >= 0;
    });
  }

  async validateKnowledgeSchema() {
    return await this.runTest('Knowledge Schema', async () => {
      const knowledgeCount = await prisma.knowledge.count();
      return knowledgeCount >= 0;
    });
  }

  async validateAgentSchema() {
    return await this.runTest('Agent Schema', async () => {
      const agentCount = await prisma.agent.count();
      return agentCount >= 0;
    });
  }

  async validateFileStructure() {
    return await this.runTest('File Structure', async () => {
      const requiredFiles = [
        'package.json',
        'prisma/schema.prisma',
        'src/app/api/health/route.ts',
        'src/app/api/agents/[id]/chat/route.ts',
        'src/app/api/knowledge/route.ts'
      ];

      for (const file of requiredFiles) {
        const exists = await fs.access(file).then(() => true).catch(() => false);
        if (!exists) {
          throw new Error(`Required file missing: ${file}`);
        }
      }
      return true;
    });
  }

  async validateEnvironmentConfig() {
    return await this.runTest('Environment Configuration', async () => {
      const envExists = await fs.access('.env.local').then(() => true).catch(() => false);
      if (!envExists) {
        throw new Error('.env.local file not found');
      }
      
      const envContent = await fs.readFile('.env.local', 'utf8');
      const requiredVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'OPENAI_API_KEY'];
      
      for (const envVar of requiredVars) {
        if (!envContent.includes(envVar)) {
          throw new Error(`Required environment variable missing: ${envVar}`);
        }
      }
      return true;
    });
  }

  async validateDependencies() {
    return await this.runTest('Dependencies', async () => {
      const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
      const requiredDeps = ['@prisma/client', 'next', 'react', 'node-fetch'];
      
      for (const dep of requiredDeps) {
        if (!packageJson.dependencies[dep] && !packageJson.devDependencies[dep]) {
          throw new Error(`Required dependency missing: ${dep}`);
        }
      }
      return true;
    });
  }

  async validateTestScripts() {
    return await this.runTest('Test Scripts Exist', async () => {
      const testScripts = [
        'scripts/day30-integration-testing.js',
        'scripts/day30-performance-benchmarking.js',
        'scripts/day30-load-testing.js',
        'scripts/day30-security-auditing.js',
        'scripts/run-day30-tests.js'
      ];

      for (const script of testScripts) {
        const exists = await fs.access(script).then(() => true).catch(() => false);
        if (!exists) {
          throw new Error(`Test script missing: ${script}`);
        }
      }
      return true;
    });
  }

  async validatePrismaClient() {
    return await this.runTest('Prisma Client Generation', async () => {
      // Check if Prisma client is generated
      const clientExists = await fs.access('node_modules/.prisma/client/index.js')
        .then(() => true).catch(() => false);
      
      if (!clientExists) {
        throw new Error('Prisma client not generated. Run: npx prisma generate');
      }
      return true;
    });
  }

  async validateReportGeneration() {
    return await this.runTest('Report Generation', async () => {
      const reportsDir = 'test-reports';
      const dirExists = await fs.access(reportsDir).then(() => true).catch(() => false);
      
      if (!dirExists) {
        await fs.mkdir(reportsDir, { recursive: true });
      }
      
      // Test report generation
      const testReport = {
        timestamp: new Date().toISOString(),
        test: 'offline-validation',
        status: 'success'
      };
      
      const reportPath = path.join(reportsDir, 'day30-offline-validation.json');
      await fs.writeFile(reportPath, JSON.stringify(testReport, null, 2));
      
      return true;
    });
  }

  async generateSummaryReport() {
    const successRate = (this.results.passedTests / this.results.totalTests) * 100;
    
    const report = {
      timestamp: new Date().toISOString(),
      testType: 'Day 30 Offline Validation',
      summary: {
        totalTests: this.results.totalTests,
        passedTests: this.results.passedTests,
        failedTests: this.results.failedTests,
        successRate: `${successRate.toFixed(1)}%`
      },
      status: successRate >= 95 ? 'READY' : 'NEEDS_IMPROVEMENT',
      tests: this.results.tests,
      recommendations: successRate < 95 ? [
        'Fix failed tests before proceeding',
        'Ensure all dependencies are installed',
        'Verify database connection',
        'Check environment configuration'
      ] : [
        'All offline validations passed',
        'System ready for server-based testing',
        'Proceed with server startup and API testing'
      ]
    };

    await fs.writeFile('test-reports/day30-offline-validation-summary.json', JSON.stringify(report, null, 2));
    return report;
  }

  async run() {
    console.log('🧪 DAY 30: OFFLINE VALIDATION');
    console.log('=' .repeat(50));
    
    // Run all offline tests
    await this.validateDatabase();
    await this.validateKnowledgeSchema();
    await this.validateAgentSchema();
    await this.validateFileStructure();
    await this.validateEnvironmentConfig();
    await this.validateDependencies();
    await this.validateTestScripts();
    await this.validatePrismaClient();
    await this.validateReportGeneration();

    // Generate summary
    const report = await this.generateSummaryReport();
    
    console.log('\n' + '=' .repeat(50));
    console.log('📊 OFFLINE VALIDATION SUMMARY');
    console.log('=' .repeat(50));
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Passed: ${report.summary.passedTests}`);
    console.log(`Failed: ${report.summary.failedTests}`);
    console.log(`Success Rate: ${report.summary.successRate}`);
    console.log(`Status: ${report.status}`);
    
    if (report.status === 'READY') {
      console.log('\n✅ All offline validations passed!');
      console.log('🚀 System ready for server-based testing');
    } else {
      console.log('\n❌ Some validations failed');
      console.log('🔧 Fix issues before proceeding');
    }

    await prisma.$disconnect();
    return report;
  }
}

// Run if called directly
if (require.main === module) {
  const validator = new Day30OfflineValidator();
  validator.run().catch(console.error);
}

module.exports = Day30OfflineValidator; 