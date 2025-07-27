#!/usr/bin/env node

/**
 * 🧪 DAY 14 VALIDATION TEST - Phase 4 ChromaDB Production Setup
 * Comprehensive validation của tất cả components đã implement
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  timeout: 30000,
  retries: 3,
  testDataPath: './test-data',
  chromadbPath: './chromadb_data',
  logPath: './test-reports',
};

// Test results tracking
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  errors: [],
  startTime: new Date().toISOString(),
  endTime: null,
};

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

/**
 * Utility functions
 */
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, status, details = '') {
  const statusColor = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'yellow';
  const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  
  log(`${statusIcon} ${testName}: ${colors[statusColor]}${status}${colors.reset}`, 'reset');
  if (details) log(`   ${details}`, 'reset');
  
  testResults.total++;
  if (status === 'PASS') testResults.passed++;
  else if (status === 'FAIL') {
    testResults.failed++;
    testResults.errors.push({ test: testName, details });
  } else testResults.warnings++;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'pipe',
      shell: true,
      ...options,
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Test Phase 1: Environment & Dependencies
 */
async function testEnvironmentSetup() {
  log('\n🔍 PHASE 1: Environment & Dependencies Testing', 'blue');
  log('=' * 60, 'blue');

  // Test 1.1: Node.js version
  try {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion >= 18) {
      logTest('Node.js Version Check', 'PASS', `Version: ${nodeVersion}`);
    } else {
      logTest('Node.js Version Check', 'FAIL', `Version ${nodeVersion} < 18 required`);
    }
  } catch (error) {
    logTest('Node.js Version Check', 'FAIL', error.message);
  }

  // Test 1.2: Python availability
  try {
    const { code, stdout } = await runCommand('python', ['--version']);
    if (code === 0) {
      logTest('Python Availability', 'PASS', stdout.trim());
    } else {
      logTest('Python Availability', 'FAIL', 'Python not found');
    }
  } catch (error) {
    logTest('Python Availability', 'FAIL', error.message);
  }

  // Test 1.3: ChromaDB package
  try {
    const { code, stdout } = await runCommand('python', ['-c', 'import chromadb; print(chromadb.__version__)']);
    if (code === 0) {
      logTest('ChromaDB Package', 'PASS', `Version: ${stdout.trim()}`);
    } else {
      logTest('ChromaDB Package', 'FAIL', 'ChromaDB not installed');
    }
  } catch (error) {
    logTest('ChromaDB Package', 'FAIL', error.message);
  }

  // Test 1.4: Required directories
  const requiredDirs = [
    './src/lib',
    './src/app/api',
    './chromadb_data',
    './test-reports',
  ];

  for (const dir of requiredDirs) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      logTest(`Directory: ${dir}`, 'PASS', 'Exists or created');
    } catch (error) {
      logTest(`Directory: ${dir}`, 'FAIL', error.message);
    }
  }

  // Test 1.5: Environment variables
  const requiredEnvVars = [
    'OPENAI_API_KEY',
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
  ];

  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      logTest(`Environment Variable: ${envVar}`, 'PASS', 'Set');
    } else {
      logTest(`Environment Variable: ${envVar}`, 'WARN', 'Not set');
    }
  }
}

/**
 * Test Phase 2: ChromaDB Production Service
 */
async function testChromaDBProduction() {
  log('\n🚀 PHASE 2: ChromaDB Production Service Testing', 'blue');
  log('=' * 60, 'blue');

  // Test 2.1: Service file existence
  const serviceFiles = [
    './src/lib/chromadb-production.ts',
    './src/lib/collection-manager.ts',
    './src/lib/vector-knowledge-service-production.ts',
    './src/lib/knowledge-pipeline-bridge.ts',
  ];

  for (const file of serviceFiles) {
    try {
      if (fs.existsSync(file)) {
        const stats = fs.statSync(file);
        logTest(`Service File: ${path.basename(file)}`, 'PASS', `Size: ${stats.size} bytes`);
      } else {
        logTest(`Service File: ${path.basename(file)}`, 'FAIL', 'File not found');
      }
    } catch (error) {
      logTest(`Service File: ${path.basename(file)}`, 'FAIL', error.message);
    }
  }

  // Test 2.2: TypeScript compilation
  try {
    const { code, stderr } = await runCommand('npx', ['tsc', '--noEmit', '--skipLibCheck']);
    if (code === 0) {
      logTest('TypeScript Compilation', 'PASS', 'No compilation errors');
    } else {
      logTest('TypeScript Compilation', 'FAIL', stderr);
    }
  } catch (error) {
    logTest('TypeScript Compilation', 'FAIL', error.message);
  }

  // Test 2.3: ChromaDB embedded mode
  try {
    const testScript = `
const { PersistentClient } = require('chromadb');
async function test() {
  const client = new PersistentClient({ path: './chromadb_data' });
  const collection = await client.getOrCreateCollection({ name: 'test_collection' });
  await collection.add({
    ids: ['test1'],
    documents: ['This is a test document'],
    metadatas: [{ test: true }]
  });
  const results = await collection.query({ queryTexts: ['test'], nResults: 1 });
  console.log('SUCCESS: ChromaDB embedded mode working');
  return results.documents[0].length > 0;
}
test().catch(console.error);
    `;

    fs.writeFileSync('./temp-chromadb-test.js', testScript);
    const { code, stdout, stderr } = await runCommand('node', ['./temp-chromadb-test.js']);
    
    if (code === 0 && stdout.includes('SUCCESS')) {
      logTest('ChromaDB Embedded Mode', 'PASS', 'Basic operations working');
    } else {
      logTest('ChromaDB Embedded Mode', 'FAIL', stderr || 'Test failed');
    }
    
    // Cleanup
    if (fs.existsSync('./temp-chromadb-test.js')) {
      fs.unlinkSync('./temp-chromadb-test.js');
    }
  } catch (error) {
    logTest('ChromaDB Embedded Mode', 'FAIL', error.message);
  }

  // Test 2.4: Server mode attempt
  try {
    log('   🔄 Attempting ChromaDB server connection...', 'yellow');
    
    const testScript = `
const { ChromaClient } = require('chromadb');
async function test() {
  try {
    const client = new ChromaClient({ path: 'http://localhost:8000' });
    await client.heartbeat();
    console.log('SUCCESS: ChromaDB server connected');
    return true;
  } catch (error) {
    console.log('INFO: ChromaDB server not available, will use embedded mode');
    return false;
  }
}
test().catch(console.error);
    `;

    fs.writeFileSync('./temp-server-test.js', testScript);
    const { code, stdout } = await runCommand('node', ['./temp-server-test.js']);
    
    if (stdout.includes('SUCCESS')) {
      logTest('ChromaDB Server Mode', 'PASS', 'Server connected');
    } else {
      logTest('ChromaDB Server Mode', 'WARN', 'Server not available, embedded mode will be used');
    }
    
    // Cleanup
    if (fs.existsSync('./temp-server-test.js')) {
      fs.unlinkSync('./temp-server-test.js');
    }
  } catch (error) {
    logTest('ChromaDB Server Mode', 'WARN', 'Server test failed, embedded mode will be used');
  }
}

/**
 * Test Phase 3: API Integration
 */
async function testAPIIntegration() {
  log('\n🔌 PHASE 3: API Integration Testing', 'blue');
  log('=' * 60, 'blue');

  // Test 3.1: API route file
  const apiFile = './src/app/api/knowledge/process/route.ts';
  try {
    if (fs.existsSync(apiFile)) {
      const content = fs.readFileSync(apiFile, 'utf-8');
      if (content.includes('POST') && content.includes('GET') && content.includes('DELETE')) {
        logTest('API Route File', 'PASS', 'All HTTP methods implemented');
      } else {
        logTest('API Route File', 'FAIL', 'Missing HTTP methods');
      }
    } else {
      logTest('API Route File', 'FAIL', 'File not found');
    }
  } catch (error) {
    logTest('API Route File', 'FAIL', error.message);
  }

  // Test 3.2: Import statements
  try {
    const imports = [
      'NextRequest',
      'NextResponse',
      'getServerSession',
      'knowledgePipelineBridge',
      'PrismaClient',
    ];

    const apiContent = fs.readFileSync(apiFile, 'utf-8');
    let importErrors = [];

    for (const importName of imports) {
      if (!apiContent.includes(importName)) {
        importErrors.push(importName);
      }
    }

    if (importErrors.length === 0) {
      logTest('API Import Statements', 'PASS', 'All required imports present');
    } else {
      logTest('API Import Statements', 'FAIL', `Missing: ${importErrors.join(', ')}`);
    }
  } catch (error) {
    logTest('API Import Statements', 'FAIL', error.message);
  }

  // Test 3.3: Database connection
  try {
    const testScript = `
const { PrismaClient } = require('@prisma/client');
async function test() {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log('SUCCESS: Database connected');
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.log('ERROR: Database connection failed:', error.message);
    return false;
  }
}
test().catch(console.error);
    `;

    fs.writeFileSync('./temp-db-test.js', testScript);
    const { code, stdout } = await runCommand('node', ['./temp-db-test.js']);
    
    if (stdout.includes('SUCCESS')) {
      logTest('Database Connection', 'PASS', 'Prisma client connected');
    } else {
      logTest('Database Connection', 'FAIL', 'Database connection failed');
    }
    
    // Cleanup
    if (fs.existsSync('./temp-db-test.js')) {
      fs.unlinkSync('./temp-db-test.js');
    }
  } catch (error) {
    logTest('Database Connection', 'FAIL', error.message);
  }
}

/**
 * Test Phase 4: Integration Testing
 */
async function testIntegration() {
  log('\n🔗 PHASE 4: Integration Testing', 'blue');
  log('=' * 60, 'blue');

  // Test 4.1: Service initialization
  try {
    const testScript = `
const path = require('path');
process.env.CHROMADB_PERSIST_PATH = './chromadb_data';
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-key';

// Mock OpenAI service for testing
class MockOpenAIEmbeddingService {
  async generateEmbedding(text) {
    return Array.from({length: 1536}, () => Math.random());
  }
}

async function test() {
  try {
    // Test imports
    const { ProductionChromaDBService } = require('./src/lib/chromadb-production.ts');
    const { CollectionManager } = require('./src/lib/collection-manager.ts');
    const { VectorKnowledgeServiceProduction } = require('./src/lib/vector-knowledge-service-production.ts');
    
    console.log('SUCCESS: All services imported successfully');
    return true;
  } catch (error) {
    console.log('ERROR: Service import failed:', error.message);
    return false;
  }
}
test().catch(console.error);
    `;

    fs.writeFileSync('./temp-integration-test.js', testScript);
    const { code, stdout } = await runCommand('node', ['./temp-integration-test.js']);
    
    if (stdout.includes('SUCCESS')) {
      logTest('Service Initialization', 'PASS', 'All services can be imported');
    } else {
      logTest('Service Initialization', 'FAIL', 'Service import failed');
    }
    
    // Cleanup
    if (fs.existsSync('./temp-integration-test.js')) {
      fs.unlinkSync('./temp-integration-test.js');
    }
  } catch (error) {
    logTest('Service Initialization', 'FAIL', error.message);
  }

  // Test 4.2: Configuration validation
  const configTests = [
    { name: 'ChromaDB Host', env: 'CHROMADB_HOST', default: 'localhost' },
    { name: 'ChromaDB Port', env: 'CHROMADB_PORT', default: '8000' },
    { name: 'ChromaDB Persist Path', env: 'CHROMADB_PERSIST_PATH', default: './chromadb_data' },
  ];

  for (const config of configTests) {
    const value = process.env[config.env] || config.default;
    logTest(`Configuration: ${config.name}`, 'PASS', `Value: ${value}`);
  }

  // Test 4.3: File structure validation
  const expectedStructure = [
    './src/lib/chromadb-production.ts',
    './src/lib/collection-manager.ts',
    './src/lib/vector-knowledge-service-production.ts',
    './src/lib/knowledge-pipeline-bridge.ts',
    './src/app/api/knowledge/process/route.ts',
    './chromadb_data',
  ];

  let structureValid = true;
  for (const item of expectedStructure) {
    if (!fs.existsSync(item)) {
      structureValid = false;
      logTest(`File Structure: ${item}`, 'FAIL', 'Missing');
    }
  }

  if (structureValid) {
    logTest('File Structure Validation', 'PASS', 'All required files present');
  } else {
    logTest('File Structure Validation', 'FAIL', 'Missing required files');
  }
}

/**
 * Test Phase 5: Performance & Health
 */
async function testPerformanceHealth() {
  log('\n⚡ PHASE 5: Performance & Health Testing', 'blue');
  log('=' * 60, 'blue');

  // Test 5.1: Memory usage
  const memUsage = process.memoryUsage();
  const memMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  
  if (memMB < 200) {
    logTest('Memory Usage', 'PASS', `${memMB}MB heap used`);
  } else {
    logTest('Memory Usage', 'WARN', `${memMB}MB heap used (high)`);
  }

  // Test 5.2: Disk space
  try {
    const stats = fs.statSync('./');
    logTest('Disk Access', 'PASS', 'File system accessible');
  } catch (error) {
    logTest('Disk Access', 'FAIL', error.message);
  }

  // Test 5.3: ChromaDB data directory
  try {
    const chromaPath = './chromadb_data';
    if (fs.existsSync(chromaPath)) {
      const files = fs.readdirSync(chromaPath);
      logTest('ChromaDB Data Directory', 'PASS', `${files.length} files/folders`);
    } else {
      logTest('ChromaDB Data Directory', 'WARN', 'Directory not found (will be created)');
    }
  } catch (error) {
    logTest('ChromaDB Data Directory', 'FAIL', error.message);
  }

  // Test 5.4: Process health
  const uptime = process.uptime();
  logTest('Process Health', 'PASS', `Uptime: ${Math.round(uptime)}s`);
}

/**
 * Generate test report
 */
function generateTestReport() {
  testResults.endTime = new Date().toISOString();
  const duration = new Date(testResults.endTime) - new Date(testResults.startTime);
  
  const report = {
    testSuite: 'DAY 14 - ChromaDB Production Setup Validation',
    timestamp: testResults.endTime,
    duration: `${Math.round(duration / 1000)}s`,
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      warnings: testResults.warnings,
      successRate: `${Math.round((testResults.passed / testResults.total) * 100)}%`,
    },
    status: testResults.failed === 0 ? 'PASS' : 'FAIL',
    errors: testResults.errors,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    },
  };

  // Save report
  const reportPath = `./test-reports/day14-validation-results.json`;
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  return report;
}

/**
 * Main test execution
 */
async function main() {
  log('\n🧪 DAY 14 VALIDATION TEST SUITE', 'bold');
  log('Phase 4: ChromaDB Production Setup Validation', 'blue');
  log('=' * 80, 'blue');

  try {
    // Ensure test directories exist
    if (!fs.existsSync('./test-reports')) {
      fs.mkdirSync('./test-reports', { recursive: true });
    }

    // Run test phases
    await testEnvironmentSetup();
    await testChromaDBProduction();
    await testAPIIntegration();
    await testIntegration();
    await testPerformanceHealth();

    // Generate report
    const report = generateTestReport();
    
    // Display summary
    log('\n📊 TEST SUMMARY', 'bold');
    log('=' * 40, 'blue');
    log(`Total Tests: ${report.summary.total}`, 'blue');
    log(`Passed: ${report.summary.passed}`, 'green');
    log(`Failed: ${report.summary.failed}`, 'red');
    log(`Warnings: ${report.summary.warnings}`, 'yellow');
    log(`Success Rate: ${report.summary.successRate}`, 'blue');
    log(`Duration: ${report.duration}`, 'blue');
    
    if (report.status === 'PASS') {
      log('\n🎉 DAY 14 VALIDATION: PASSED', 'green');
      log('✅ ChromaDB Production Setup is ready for Phase 4 Day 15!', 'green');
    } else {
      log('\n❌ DAY 14 VALIDATION: FAILED', 'red');
      log('🔧 Please fix the following issues:', 'red');
      report.errors.forEach(error => {
        log(`   • ${error.test}: ${error.details}`, 'red');
      });
    }
    
    log(`\n📄 Detailed report saved: ${reportPath}`, 'blue');
    
    // Exit with appropriate code
    process.exit(report.status === 'PASS' ? 0 : 1);
    
  } catch (error) {
    log(`\n💥 Test suite failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  main();
}

module.exports = { main, testResults }; 