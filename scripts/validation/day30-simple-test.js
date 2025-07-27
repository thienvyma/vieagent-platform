#!/usr/bin/env node

/**
 * 🧪 DAY 30: SIMPLE TEST SCRIPT
 * Quick validation of Day 30 fixes without requiring server
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

async function testDay30Fixes() {
  console.log('🧪 Testing Day 30 Fixes...');
  console.log('=' .repeat(50));
  
  let testResults = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    tests: []
  };
  
  // Test 1: Database Connection
  console.log('\n📊 Test 1: Database Connection');
  try {
    await prisma.user.count();
    testResults.tests.push({ name: 'Database Connection', status: 'PASSED' });
    testResults.passedTests++;
    console.log('✅ Database connection working');
  } catch (error) {
    testResults.tests.push({ name: 'Database Connection', status: 'FAILED', error: error.message });
    testResults.failedTests++;
    console.log('❌ Database connection failed:', error.message);
  }
  testResults.totalTests++;
  
  // Test 2: Knowledge Model Creation
  console.log('\n📋 Test 2: Knowledge Model Creation');
  try {
    const testUser = await prisma.user.create({
      data: {
        email: `test-day30-simple-${Date.now()}@example.com`,
        name: 'Test User',
        role: 'USER',
        plan: 'TRIAL',
        isActive: true
      }
    });
    
    const testKnowledge = await prisma.knowledge.create({
      data: {
        title: 'Test Knowledge',
        filename: 'test-knowledge.txt',
        type: 'document',
        subtype: 'txt',
        source: 'upload',
        contentType: 'text_knowledge',
        category: 'reference',
        status: 'COMPLETED',
        userId: testUser.id,
        size: 1024,
        mimeType: 'text/plain',
        encoding: 'utf-8',
        isPublic: false,
        isArchived: false,
        isDeleted: false,
        content: 'Test content',
        metadata: JSON.stringify({ test: true })
      }
    });
    
    // Cleanup
    await prisma.knowledge.delete({ where: { id: testKnowledge.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    
    testResults.tests.push({ name: 'Knowledge Model Creation', status: 'PASSED' });
    testResults.passedTests++;
    console.log('✅ Knowledge model creation working');
  } catch (error) {
    testResults.tests.push({ name: 'Knowledge Model Creation', status: 'FAILED', error: error.message });
    testResults.failedTests++;
    console.log('❌ Knowledge model creation failed:', error.message);
  }
  testResults.totalTests++;
  
  // Test 3: Node-fetch Import
  console.log('\n🌐 Test 3: Node-fetch Import');
  try {
    const fetch = require('node-fetch');
    if (typeof fetch === 'function') {
      testResults.tests.push({ name: 'Node-fetch Import', status: 'PASSED' });
      testResults.passedTests++;
      console.log('✅ Node-fetch import working');
    } else {
      throw new Error('fetch is not a function');
    }
  } catch (error) {
    testResults.tests.push({ name: 'Node-fetch Import', status: 'FAILED', error: error.message });
    testResults.failedTests++;
    console.log('❌ Node-fetch import failed:', error.message);
  }
  testResults.totalTests++;
  
  // Test 4: Test Scripts Structure
  console.log('\n📁 Test 4: Test Scripts Structure');
  try {
    const scriptsDir = path.join(__dirname);
    const requiredFiles = [
      'day30-integration-testing.js',
      'day30-performance-benchmarking.js',
      'day30-load-testing.js',
      'day30-security-auditing.js',
      'run-day30-tests.js'
    ];
    
    let allFilesExist = true;
    for (const file of requiredFiles) {
      const filePath = path.join(scriptsDir, file);
      try {
        await fs.access(filePath);
      } catch (error) {
        allFilesExist = false;
        console.log(`❌ Missing file: ${file}`);
      }
    }
    
    if (allFilesExist) {
      testResults.tests.push({ name: 'Test Scripts Structure', status: 'PASSED' });
      testResults.passedTests++;
      console.log('✅ All test scripts exist');
    } else {
      throw new Error('Some test scripts are missing');
    }
  } catch (error) {
    testResults.tests.push({ name: 'Test Scripts Structure', status: 'FAILED', error: error.message });
    testResults.failedTests++;
    console.log('❌ Test scripts structure failed:', error.message);
  }
  testResults.totalTests++;
  
  // Test 5: Reports Directory
  console.log('\n📊 Test 5: Reports Directory');
  try {
    const reportsDir = path.join(__dirname, '..', 'test-reports');
    try {
      await fs.access(reportsDir);
    } catch (error) {
      await fs.mkdir(reportsDir, { recursive: true });
    }
    
    testResults.tests.push({ name: 'Reports Directory', status: 'PASSED' });
    testResults.passedTests++;
    console.log('✅ Reports directory ready');
  } catch (error) {
    testResults.tests.push({ name: 'Reports Directory', status: 'FAILED', error: error.message });
    testResults.failedTests++;
    console.log('❌ Reports directory failed:', error.message);
  }
  testResults.totalTests++;
  
  // Print Summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 DAY 30 FIXES TEST SUMMARY');
  console.log('=' .repeat(50));
  console.log(`Total Tests: ${testResults.totalTests}`);
  console.log(`Passed: ${testResults.passedTests} ✅`);
  console.log(`Failed: ${testResults.failedTests} ❌`);
  console.log(`Success Rate: ${Math.round((testResults.passedTests / testResults.totalTests) * 100)}%`);
  
  console.log('\n📋 Detailed Results:');
  testResults.tests.forEach((test, index) => {
    console.log(`${index + 1}. ${test.name}: ${test.status === 'PASSED' ? '✅' : '❌'} ${test.status}`);
    if (test.error) {
      console.log(`   Error: ${test.error}`);
    }
  });
  
  if (testResults.failedTests === 0) {
    console.log('\n🎉 All Day 30 fixes are working correctly!');
    console.log('✅ Ready to run full Day 30 test suite');
  } else {
    console.log('\n⚠️ Some fixes need attention before running full tests');
  }
  
  await prisma.$disconnect();
  return testResults;
}

// Run if called directly
if (require.main === module) {
  testDay30Fixes().catch(console.error);
}

module.exports = { testDay30Fixes }; 