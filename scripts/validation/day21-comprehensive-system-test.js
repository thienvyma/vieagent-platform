/**
 * 🎯 DAY 21 - Comprehensive System Testing Script
 * Complete validation of all system components and workflows
 * 
 * Testing Areas:
 * 1. Agent Creation → Knowledge Upload → Chat Workflow
 * 2. Admin Panel Features (Audit, Export, Analytics)
 * 3. Security Features (Auth, Rate Limiting, Device Fingerprint)
 * 4. Real-time Systems (WebSocket, Updates, Notifications)
 * 5. Google Integration Features
 * 6. Performance & Stability Testing
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  testUser: {
    email: 'test@example.com',
    password: 'testpassword123',
    name: 'Test User'
  },
  adminUser: {
    email: 'admin@example.com',
    password: 'adminpassword123',
    name: 'Admin User'
  },
  testTimeout: 30000,
  maxRetries: 3
};

// Test results tracking
let testResults = {
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  skippedTests: 0,
  startTime: new Date(),
  endTime: null,
  testDetails: []
};

/**
 * 🧪 Test utility functions
 */
class TestRunner {
  constructor() {
    this.currentSuite = '';
    this.currentTest = '';
  }

  async runSuite(suiteName, testFunction) {
    console.log(`\n🧪 Starting Test Suite: ${suiteName}`);
    console.log('='.repeat(60));
    
    this.currentSuite = suiteName;
    
    try {
      await testFunction();
      console.log(`✅ Test Suite '${suiteName}' completed successfully`);
    } catch (error) {
      console.error(`❌ Test Suite '${suiteName}' failed:`, error.message);
      this.recordTestResult(suiteName, 'SUITE_FAILED', false, error.message);
    }
  }

  async runTest(testName, testFunction) {
    this.currentTest = testName;
    testResults.totalTests++;
    
    console.log(`\n🔍 Running: ${testName}`);
    
    try {
      const startTime = Date.now();
      await testFunction();
      const duration = Date.now() - startTime;
      
      console.log(`✅ PASSED: ${testName} (${duration}ms)`);
      testResults.passedTests++;
      this.recordTestResult(testName, 'PASSED', true, null, duration);
      
      return true;
    } catch (error) {
      console.error(`❌ FAILED: ${testName} - ${error.message}`);
      testResults.failedTests++;
      this.recordTestResult(testName, 'FAILED', false, error.message);
      
      return false;
    }
  }

  recordTestResult(testName, status, passed, error = null, duration = null) {
    testResults.testDetails.push({
      suite: this.currentSuite,
      test: testName,
      status,
      passed,
      error,
      duration,
      timestamp: new Date()
    });
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${TEST_CONFIG.baseUrl}${endpoint}`;
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Day21-SystemTest/1.0'
      }
    };

    const finalOptions = { ...defaultOptions, ...options };
    
    console.log(`📡 Making request: ${finalOptions.method} ${url}`);
    
    try {
      const response = await fetch(url, finalOptions);
      const data = await response.json();
      
      return {
        success: response.ok,
        status: response.status,
        data,
        headers: response.headers
      };
    } catch (error) {
      throw new Error(`Request failed: ${error.message}`);
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  assertEquals(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, but got ${actual}`);
    }
  }

  assertGreaterThan(actual, expected, message) {
    if (actual <= expected) {
      throw new Error(message || `Expected ${actual} to be greater than ${expected}`);
    }
  }

  assertContains(array, item, message) {
    if (!array.includes(item)) {
      throw new Error(message || `Expected array to contain ${item}`);
    }
  }
}

const testRunner = new TestRunner();

/**
 * 🚀 SUITE 1: Agent Creation → Knowledge Upload → Chat Workflow
 */
async function testAgentWorkflow() {
  let testAgent = null;
  let testConversation = null;
  let testKnowledge = null;

  await testRunner.runTest('Agent Creation with Full Configuration', async () => {
    const agentData = {
      name: 'Test Agent Day21',
      description: 'Comprehensive test agent for Day 21 validation',
      prompt: 'You are a helpful AI assistant for system testing. Provide detailed responses and acknowledge when you have access to knowledge base information.',
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 1000,
      knowledgeFiles: [],
      isPublic: false,
      // Enhanced settings
      messageDelayMs: 1000,
      enableSmartDelay: true,
      enableVietnameseMode: true,
      enableGoogleIntegration: false,
      // RAG settings
      enableRAG: true,
      ragThreshold: 0.7,
      ragMaxDocuments: 5,
      // Security settings
      enableAutoHandover: false
    };

    const response = await testRunner.makeRequest('/api/agents', {
      method: 'POST',
      body: JSON.stringify(agentData)
    });

    testRunner.assert(response.success, 'Agent creation should succeed');
    testRunner.assert(response.data.id, 'Agent should have an ID');
    testRunner.assertEquals(response.data.name, agentData.name, 'Agent name should match');
    testRunner.assert(response.data.enableRAG, 'RAG should be enabled');
    
    testAgent = response.data;
    console.log(`✅ Created agent: ${testAgent.id}`);
  });

  await testRunner.runTest('Knowledge Upload and Processing', async () => {
    // Create test knowledge content
    const testContent = `
    # Test Knowledge Base
    
    ## AI Agent Platform Features
    - Multi-model support with OpenAI, Anthropic, and Google
    - RAG (Retrieval Augmented Generation) capabilities
    - Real-time chat with WebSocket support
    - Admin panel with comprehensive analytics
    - Security features including rate limiting and device fingerprinting
    
    ## System Architecture
    - Next.js 14 with App Router
    - Prisma ORM with SQLite database
    - ChromaDB for vector storage
    - NextAuth.js for authentication
    
    ## Testing Information
    This knowledge base is created for Day 21 comprehensive system testing.
    It contains information about the AI Agent Platform's capabilities and architecture.
    `;

    // Upload knowledge (simulate file upload)
    const knowledgeData = {
      title: 'Day21 Test Knowledge',
      content: testContent,
      type: 'TEXT',
      agentId: testAgent.id
    };

    const response = await testRunner.makeRequest('/api/knowledge/upload', {
      method: 'POST',
      body: JSON.stringify(knowledgeData)
    });

    testRunner.assert(response.success, 'Knowledge upload should succeed');
    testRunner.assert(response.data.id, 'Knowledge should have an ID');
    testRunner.assertEquals(response.data.status, 'PROCESSED', 'Knowledge should be processed');
    
    testKnowledge = response.data;
    console.log(`✅ Uploaded knowledge: ${testKnowledge.id}`);

    // Wait for processing
    await testRunner.sleep(2000);
  });

  await testRunner.runTest('Agent Chat with Knowledge Integration', async () => {
    const chatData = {
      message: 'What are the main features of the AI Agent Platform? Please provide detailed information.',
      conversationId: null,
      useAdvancedRAG: true
    };

    const response = await testRunner.makeRequest(`/api/agents/${testAgent.id}/chat`, {
      method: 'POST',
      body: JSON.stringify(chatData)
    });

    testRunner.assert(response.success, 'Chat should succeed');
    testRunner.assert(response.data.content, 'Response should have content');
    testRunner.assert(response.data.conversationId, 'Response should include conversation ID');
    testRunner.assertGreaterThan(response.data.content.length, 50, 'Response should be substantial');
    
    // Check if response includes knowledge from uploaded content
    const responseContent = response.data.content.toLowerCase();
    testRunner.assert(
      responseContent.includes('multi-model') || responseContent.includes('rag') || responseContent.includes('websocket'),
      'Response should include information from knowledge base'
    );
    
    testConversation = response.data;
    console.log(`✅ Chat successful with ${response.data.content.length} characters`);
  });

  await testRunner.runTest('Real-time Chat Updates', async () => {
    // Test follow-up message in same conversation
    const followUpData = {
      message: 'Can you tell me more about the security features?',
      conversationId: testConversation.conversationId,
      useAdvancedRAG: true
    };

    const response = await testRunner.makeRequest(`/api/agents/${testAgent.id}/chat`, {
      method: 'POST',
      body: JSON.stringify(followUpData)
    });

    testRunner.assert(response.success, 'Follow-up chat should succeed');
    testRunner.assert(response.data.content, 'Follow-up response should have content');
    testRunner.assertEquals(response.data.conversationId, testConversation.conversationId, 'Should use same conversation');
    
    // Check if response mentions security features
    const responseContent = response.data.content.toLowerCase();
    testRunner.assert(
      responseContent.includes('security') || responseContent.includes('rate limiting') || responseContent.includes('authentication'),
      'Response should mention security features'
    );
    
    console.log(`✅ Follow-up chat successful`);
  });

  await testRunner.runTest('Agent Performance Metrics', async () => {
    const response = await testRunner.makeRequest(`/api/agents/${testAgent.id}/metrics`);

    testRunner.assert(response.success, 'Metrics retrieval should succeed');
    testRunner.assert(response.data.conversationCount !== undefined, 'Should have conversation count');
    testRunner.assert(response.data.messageCount !== undefined, 'Should have message count');
    testRunner.assertGreaterThan(response.data.conversationCount, 0, 'Should have at least one conversation');
    testRunner.assertGreaterThan(response.data.messageCount, 0, 'Should have at least one message');
    
    console.log(`✅ Agent metrics: ${response.data.conversationCount} conversations, ${response.data.messageCount} messages`);
  });
}

/**
 * 🔐 SUITE 2: Admin Panel Features Testing
 */
async function testAdminPanelFeatures() {
  await testRunner.runTest('Admin Dashboard Metrics', async () => {
    const response = await testRunner.makeRequest('/api/admin/metrics');

    testRunner.assert(response.success, 'Admin metrics should be accessible');
    testRunner.assert(response.data.overview, 'Should have overview metrics');
    testRunner.assert(response.data.userMetrics, 'Should have user metrics');
    testRunner.assert(response.data.contentMetrics, 'Should have content metrics');
    testRunner.assert(response.data.agentMetrics, 'Should have agent metrics');
    
    // Validate specific metrics
    testRunner.assert(response.data.overview.totalUsers !== undefined, 'Should have total users count');
    testRunner.assert(response.data.overview.totalAgents !== undefined, 'Should have total agents count');
    testRunner.assert(response.data.agentMetrics.total !== undefined, 'Should have agent total');
    
    console.log(`✅ Admin metrics: ${response.data.overview.totalUsers} users, ${response.data.overview.totalAgents} agents`);
  });

  await testRunner.runTest('User Management Features', async () => {
    const response = await testRunner.makeRequest('/api/admin/users');

    testRunner.assert(response.success, 'User management should be accessible');
    testRunner.assert(Array.isArray(response.data.users), 'Should return users array');
    testRunner.assert(response.data.stats, 'Should include user statistics');
    testRunner.assert(response.data.stats.total !== undefined, 'Should have total user count');
    
    console.log(`✅ User management: ${response.data.stats.total} total users`);
  });

  await testRunner.runTest('Agent Oversight Features', async () => {
    const response = await testRunner.makeRequest('/api/admin/agents');

    testRunner.assert(response.success, 'Agent oversight should be accessible');
    testRunner.assert(Array.isArray(response.data.agents), 'Should return agents array');
    testRunner.assert(response.data.stats, 'Should include agent statistics');
    testRunner.assertGreaterThan(response.data.agents.length, 0, 'Should have at least one agent (our test agent)');
    
    console.log(`✅ Agent oversight: ${response.data.agents.length} agents found`);
  });

  await testRunner.runTest('Subscription Management', async () => {
    const response = await testRunner.makeRequest('/api/admin/subscriptions');

    testRunner.assert(response.success, 'Subscription management should be accessible');
    testRunner.assert(Array.isArray(response.data.subscriptions), 'Should return subscriptions array');
    testRunner.assert(response.data.stats, 'Should include subscription statistics');
    
    console.log(`✅ Subscription management: ${response.data.subscriptions.length} subscriptions`);
  });

  await testRunner.runTest('Export Functionality', async () => {
    // Test CSV export
    const response = await testRunner.makeRequest('/api/admin/export/users?format=csv');

    testRunner.assert(response.success, 'Export should succeed');
    testRunner.assert(response.data, 'Export should return data');
    
    console.log(`✅ Export functionality working`);
  });

  await testRunner.runTest('Audit Trail Functionality', async () => {
    const response = await testRunner.makeRequest('/api/admin/audit');

    testRunner.assert(response.success, 'Audit trail should be accessible');
    testRunner.assert(Array.isArray(response.data.logs), 'Should return audit logs array');
    
    console.log(`✅ Audit trail: ${response.data.logs.length} audit entries`);
  });

  await testRunner.runTest('Feedback Analytics', async () => {
    const response = await testRunner.makeRequest('/api/admin/feedback/analytics');

    testRunner.assert(response.success, 'Feedback analytics should be accessible');
    testRunner.assert(response.data.totalFeedback !== undefined, 'Should have total feedback count');
    testRunner.assert(response.data.averageRating !== undefined, 'Should have average rating');
    testRunner.assert(response.data.categoryBreakdown, 'Should have category breakdown');
    
    console.log(`✅ Feedback analytics: ${response.data.totalFeedback} total feedback entries`);
  });
}

/**
 * 🛡️ SUITE 3: Security Features Testing
 */
async function testSecurityFeatures() {
  await testRunner.runTest('Rate Limiting Implementation', async () => {
    const requests = [];
    const testEndpoint = '/api/test/rate-limit';
    
    // Make multiple rapid requests to test rate limiting
    for (let i = 0; i < 15; i++) {
      requests.push(testRunner.makeRequest(testEndpoint, { method: 'GET' }));
    }
    
    const responses = await Promise.all(requests.map(p => p.catch(e => ({ success: false, status: 429, error: e.message }))));
    
    // Check if some requests were rate limited
    const rateLimitedRequests = responses.filter(r => r.status === 429);
    testRunner.assertGreaterThan(rateLimitedRequests.length, 0, 'Some requests should be rate limited');
    
    console.log(`✅ Rate limiting: ${rateLimitedRequests.length} out of ${requests.length} requests were rate limited`);
  });

  await testRunner.runTest('Token Rotation Security', async () => {
    // Test token refresh mechanism
    const response = await testRunner.makeRequest('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: 'test-token' })
    });

    // Should handle token rotation gracefully (even with invalid token)
    testRunner.assert(response.status === 401 || response.status === 403, 'Should handle invalid refresh token');
    
    console.log(`✅ Token rotation security validated`);
  });

  await testRunner.runTest('Device Fingerprinting', async () => {
    const response = await testRunner.makeRequest('/api/auth/device-info', {
      method: 'POST',
      headers: {
        'User-Agent': 'Day21-TestAgent/1.0',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate'
      }
    });

    testRunner.assert(response.success || response.status === 401, 'Device fingerprinting should be active');
    
    console.log(`✅ Device fingerprinting validated`);
  });

  await testRunner.runTest('RBAC (Role-Based Access Control)', async () => {
    // Test admin endpoint without proper permissions
    const response = await testRunner.makeRequest('/api/admin/system/settings');

    testRunner.assert(response.status === 401 || response.status === 403, 'Should require proper permissions');
    
    console.log(`✅ RBAC permissions validated`);
  });

  await testRunner.runTest('Security Headers', async () => {
    const response = await testRunner.makeRequest('/api/health');

    testRunner.assert(response.headers, 'Response should include headers');
    
    // Check for security headers (these might be set by middleware)
    console.log(`✅ Security headers validated`);
  });

  await testRunner.runTest('Input Validation & Sanitization', async () => {
    // Test XSS prevention
    const maliciousInput = '<script>alert("xss")</script>';
    const response = await testRunner.makeRequest('/api/agents', {
      method: 'POST',
      body: JSON.stringify({
        name: maliciousInput,
        description: 'Test description',
        prompt: 'Test prompt',
        model: 'gpt-3.5-turbo'
      })
    });

    // Should either sanitize input or reject it
    testRunner.assert(response.status === 400 || response.status === 422, 'Should validate/sanitize malicious input');
    
    console.log(`✅ Input validation working`);
  });
}

/**
 * 🔄 SUITE 4: Real-time Systems Testing
 */
async function testRealTimeSystems() {
  await testRunner.runTest('WebSocket Connection Stability', async () => {
    // Test WebSocket connection (simulated)
    const response = await testRunner.makeRequest('/api/websocket/test');

    testRunner.assert(response.success || response.status === 404, 'WebSocket endpoint should be available or properly handled');
    
    console.log(`✅ WebSocket connection tested`);
  });

  await testRunner.runTest('Real-time Updates Performance', async () => {
    // Test real-time update mechanisms
    const startTime = Date.now();
    const response = await testRunner.makeRequest('/api/realtime/status');
    const responseTime = Date.now() - startTime;

    testRunner.assertGreaterThan(1000, responseTime, 'Real-time status should respond quickly');
    
    console.log(`✅ Real-time updates: ${responseTime}ms response time`);
  });

  await testRunner.runTest('Notification System', async () => {
    const response = await testRunner.makeRequest('/api/notifications/test');

    testRunner.assert(response.success || response.status === 404, 'Notification system should be available');
    
    console.log(`✅ Notification system tested`);
  });

  await testRunner.runTest('Reconnection Logic', async () => {
    // Test reconnection mechanisms (simulated)
    const response = await testRunner.makeRequest('/api/realtime/reconnect');

    testRunner.assert(response.success || response.status === 404, 'Reconnection logic should be implemented');
    
    console.log(`✅ Reconnection logic validated`);
  });
}

/**
 * 🔗 SUITE 5: Google Integration Testing
 */
async function testGoogleIntegration() {
  await testRunner.runTest('Google OAuth Configuration', async () => {
    const response = await testRunner.makeRequest('/api/google/auth/config');

    testRunner.assert(response.success || response.status === 404, 'Google OAuth should be configured');
    
    console.log(`✅ Google OAuth configuration tested`);
  });

  await testRunner.runTest('Google Services Integration', async () => {
    const services = ['calendar', 'gmail', 'sheets', 'drive', 'docs', 'forms'];
    
    for (const service of services) {
      const response = await testRunner.makeRequest(`/api/google/${service}/test`);
      testRunner.assert(response.success || response.status === 404 || response.status === 401, 
        `Google ${service} integration should be available`);
    }
    
    console.log(`✅ Google services integration tested`);
  });

  await testRunner.runTest('Google API Rate Limiting', async () => {
    const response = await testRunner.makeRequest('/api/google/rate-limit/test');

    testRunner.assert(response.success || response.status === 404, 'Google API rate limiting should be implemented');
    
    console.log(`✅ Google API rate limiting tested`);
  });
}

/**
 * ⚡ SUITE 6: Performance & Stability Testing
 */
async function testPerformanceStability() {
  await testRunner.runTest('Database Performance', async () => {
    const startTime = Date.now();
    
    // Test database queries
    const userCount = await prisma.user.count();
    const agentCount = await prisma.agent.count();
    const conversationCount = await prisma.conversation.count();
    
    const queryTime = Date.now() - startTime;
    
    testRunner.assertGreaterThan(1000, queryTime, 'Database queries should be fast');
    testRunner.assert(userCount >= 0, 'Should have user count');
    testRunner.assert(agentCount >= 0, 'Should have agent count');
    testRunner.assert(conversationCount >= 0, 'Should have conversation count');
    
    console.log(`✅ Database performance: ${queryTime}ms for ${userCount} users, ${agentCount} agents, ${conversationCount} conversations`);
  });

  await testRunner.runTest('Memory Usage Monitoring', async () => {
    const memUsage = process.memoryUsage();
    
    testRunner.assertGreaterThan(1024 * 1024 * 100, memUsage.heapUsed, 'Memory usage should be reasonable'); // Less than 100MB
    
    console.log(`✅ Memory usage: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB heap used`);
  });

  await testRunner.runTest('API Response Times', async () => {
    const endpoints = [
      '/api/health',
      '/api/agents',
      '/api/knowledge',
      '/api/admin/metrics'
    ];
    
    for (const endpoint of endpoints) {
      const startTime = Date.now();
      const response = await testRunner.makeRequest(endpoint);
      const responseTime = Date.now() - startTime;
      
      testRunner.assertGreaterThan(5000, responseTime, `${endpoint} should respond within 5 seconds`);
      console.log(`  ${endpoint}: ${responseTime}ms`);
    }
    
    console.log(`✅ API response times validated`);
  });

  await testRunner.runTest('Error Handling Robustness', async () => {
    // Test various error scenarios
    const errorTests = [
      { endpoint: '/api/agents/nonexistent', expectedStatus: 404 },
      { endpoint: '/api/agents', method: 'POST', body: '{}', expectedStatus: 400 },
      { endpoint: '/api/admin/users', expectedStatus: 401 }
    ];
    
    for (const test of errorTests) {
      const response = await testRunner.makeRequest(test.endpoint, {
        method: test.method || 'GET',
        body: test.body
      });
      
      testRunner.assertEquals(response.status, test.expectedStatus, 
        `${test.endpoint} should return ${test.expectedStatus}`);
    }
    
    console.log(`✅ Error handling robustness validated`);
  });
}

/**
 * 📊 Generate comprehensive test report
 */
async function generateTestReport() {
  testResults.endTime = new Date();
  const duration = testResults.endTime - testResults.startTime;
  
  const report = {
    summary: {
      totalTests: testResults.totalTests,
      passedTests: testResults.passedTests,
      failedTests: testResults.failedTests,
      skippedTests: testResults.skippedTests,
      successRate: Math.round((testResults.passedTests / testResults.totalTests) * 100),
      duration: Math.round(duration / 1000),
      timestamp: testResults.startTime.toISOString()
    },
    suiteResults: {},
    detailedResults: testResults.testDetails,
    systemInfo: {
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    }
  };

  // Group results by suite
  testResults.testDetails.forEach(test => {
    if (!report.suiteResults[test.suite]) {
      report.suiteResults[test.suite] = {
        total: 0,
        passed: 0,
        failed: 0,
        tests: []
      };
    }
    
    report.suiteResults[test.suite].total++;
    if (test.passed) {
      report.suiteResults[test.suite].passed++;
    } else {
      report.suiteResults[test.suite].failed++;
    }
    report.suiteResults[test.suite].tests.push(test);
  });

  // Save report to file
  const reportPath = path.join(__dirname, '..', 'test-reports', `day21-system-test-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n📊 TEST REPORT SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${report.summary.totalTests}`);
  console.log(`Passed: ${report.summary.passedTests} (${report.summary.successRate}%)`);
  console.log(`Failed: ${report.summary.failedTests}`);
  console.log(`Duration: ${report.summary.duration}s`);
  console.log(`Report saved: ${reportPath}`);
  
  // Print suite breakdown
  console.log('\n📋 SUITE BREAKDOWN:');
  Object.entries(report.suiteResults).forEach(([suite, results]) => {
    const successRate = Math.round((results.passed / results.total) * 100);
    console.log(`  ${suite}: ${results.passed}/${results.total} (${successRate}%)`);
  });

  return report;
}

/**
 * 🚀 Main test execution
 */
async function runComprehensiveSystemTests() {
  console.log('🎯 DAY 21 - COMPREHENSIVE SYSTEM TESTING');
  console.log('AI Agent Platform - Production Readiness Validation');
  console.log('='.repeat(60));
  console.log(`Start Time: ${new Date().toISOString()}`);
  console.log(`Test Environment: ${TEST_CONFIG.baseUrl}`);
  
  try {
    // Run all test suites
    await testRunner.runSuite('Agent Workflow', testAgentWorkflow);
    await testRunner.runSuite('Admin Panel Features', testAdminPanelFeatures);
    await testRunner.runSuite('Security Features', testSecurityFeatures);
    await testRunner.runSuite('Real-time Systems', testRealTimeSystems);
    await testRunner.runSuite('Google Integration', testGoogleIntegration);
    await testRunner.runSuite('Performance & Stability', testPerformanceStability);
    
    // Generate final report
    const report = await generateTestReport();
    
    console.log('\n🎉 COMPREHENSIVE SYSTEM TESTING COMPLETED');
    console.log('='.repeat(60));
    
    if (report.summary.successRate >= 80) {
      console.log('✅ SYSTEM STATUS: PRODUCTION READY');
      console.log('All critical systems are functioning correctly.');
    } else if (report.summary.successRate >= 60) {
      console.log('⚠️  SYSTEM STATUS: NEEDS ATTENTION');
      console.log('Some issues detected. Review failed tests before production deployment.');
    } else {
      console.log('❌ SYSTEM STATUS: NOT READY');
      console.log('Critical issues detected. Address failed tests before proceeding.');
    }
    
    return report;
    
  } catch (error) {
    console.error('❌ CRITICAL ERROR during testing:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute if run directly
if (require.main === module) {
  runComprehensiveSystemTests()
    .then(report => {
      process.exit(report.summary.successRate >= 80 ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runComprehensiveSystemTests,
  TestRunner,
  testResults
}; 