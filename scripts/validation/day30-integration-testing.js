/**
 * 🧪 DAY 30: COMPREHENSIVE INTEGRATION TESTING
 * Phase 9 - Final testing before production deployment
 * 
 * Tests:
 * 1. End-to-end workflow testing
 * 2. Performance benchmarking
 * 3. Load testing
 * 4. Security auditing
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

// Import fetch for Node.js
let fetch;
try {
  fetch = require('node-fetch');
} catch (error) {
  // Fallback to global fetch if available
  fetch = global.fetch || (() => {
    throw new Error('fetch is not available. Please install node-fetch: npm install node-fetch');
  });
}

const prisma = new PrismaClient();

class Day30IntegrationTester {
  constructor() {
    this.testResults = {
      workflow: [],
      performance: [],
      load: [],
      security: [],
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        startTime: new Date(),
        endTime: null,
        duration: 0
      }
    };
    
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    this.testUser = null;
    this.testAgent = null;
    this.testConversation = null;
  }

  /**
   * 🚀 Main testing entry point
   */
  async runComprehensiveTests() {
    console.log('🧪 Starting Day 30 Integration Testing...');
    console.log('=' .repeat(80));
    
    try {
      // Setup test environment
      await this.setupTestEnvironment();
      
      // Run test suites
      await this.runWorkflowTests();
      await this.runPerformanceTests();
      await this.runLoadTests();
      await this.runSecurityTests();
      
      // Generate comprehensive report
      await this.generateTestReport();
      
      console.log('\n✅ Integration testing completed successfully!');
      
    } catch (error) {
      console.error('❌ Integration testing failed:', error);
      this.testResults.summary.failed++;
    } finally {
      this.testResults.summary.endTime = new Date();
      this.testResults.summary.duration = 
        this.testResults.summary.endTime - this.testResults.summary.startTime;
      
      await this.cleanup();
    }
  }

  /**
   * 🔧 Setup test environment
   */
  async setupTestEnvironment() {
    console.log('\n🔧 Setting up test environment...');
    
    try {
      // Create test user
      this.testUser = await prisma.user.create({
        data: {
          email: `test-day30-${Date.now()}@example.com`,
          name: 'Day 30 Test User',
          role: 'USER',
          plan: 'PRO',
          isActive: true
        }
      });
      
      console.log(`✅ Created test user: ${this.testUser.email}`);
      
      // Create test knowledge document
      const testDocument = await prisma.knowledge.create({
        data: {
          title: 'Day 30 Test Document',
          description: 'Test document for integration testing',
          filename: 'day30-test-document.txt',
          content: 'This is a test document containing information about AI agents, machine learning, and natural language processing. It includes details about RAG systems, vector databases, and multi-model architectures.',
          type: 'document',
          subtype: 'txt',
          source: 'upload',
          contentType: 'text_knowledge',
          category: 'reference',
          status: 'COMPLETED',
          userId: this.testUser.id,
          size: 1024,
          mimeType: 'text/plain',
          encoding: 'utf-8',
          isPublic: false,
          isArchived: false,
          isDeleted: false,
          metadata: JSON.stringify({ testDocument: true })
        }
      });
      
      // Create test agent with full configuration
      this.testAgent = await prisma.agent.create({
        data: {
          name: 'Day 30 Test Agent',
          description: 'Comprehensive test agent for integration testing',
          prompt: 'You are a helpful AI assistant for testing purposes. Use the provided knowledge base to answer questions accurately.',
          model: 'gpt-4o-mini',
          temperature: 0.7,
          maxTokens: 2000,
          userId: this.testUser.id,
          knowledgeFiles: JSON.stringify([testDocument.id]),
          
          // RAG Configuration
          enableRAG: true,
          ragThreshold: 0.7,
          ragMaxDocuments: 5,
          ragSearchType: 'SEMANTIC',
          
          // Multi-Model Support
          modelProvider: 'openai',
          multiModelSupport: true,
          fallbackModel: 'gpt-3.5-turbo',
          
          // Auto-Learning
          enableAutoLearning: true,
          learningMode: 'ACTIVE',
          learningThreshold: 0.8,
          
          // Performance Settings
          responseTimeoutMs: 30000,
          enableResponseCaching: true,
          cacheTTL: 3600
        }
      });
      
      console.log(`✅ Created test agent: ${this.testAgent.name}`);
      
      // Verify API health
      const healthCheck = await this.makeRequest('GET', '/api/health');
      if (!healthCheck.ok) {
        throw new Error('API health check failed');
      }
      
      console.log('✅ Test environment setup completed');
      
    } catch (error) {
      console.error('❌ Failed to setup test environment:', error);
      throw error;
    }
  }

  /**
   * 🔄 End-to-end workflow testing
   */
  async runWorkflowTests() {
    console.log('\n🔄 Running End-to-End Workflow Tests...');
    
    const workflowTests = [
      {
        name: 'User Authentication Flow',
        test: () => this.testUserAuthentication()
      },
      {
        name: 'Agent Creation & Configuration',
        test: () => this.testAgentCreation()
      },
      {
        name: 'Knowledge Upload & Processing',
        test: () => this.testKnowledgeWorkflow()
      },
      {
        name: 'RAG-Enhanced Chat Flow',
        test: () => this.testRAGChatFlow()
      },
      {
        name: 'Multi-Model Chat Flow',
        test: () => this.testMultiModelFlow()
      },
      {
        name: 'Smart Knowledge Strategy',
        test: () => this.testSmartKnowledgeStrategy()
      },
      {
        name: 'Auto-Learning Pipeline',
        test: () => this.testAutoLearningPipeline()
      },
      {
        name: 'Google Integration Flow',
        test: () => this.testGoogleIntegration()
      }
    ];
    
    for (const workflowTest of workflowTests) {
      try {
        console.log(`  Testing: ${workflowTest.name}`);
        const startTime = Date.now();
        
        const result = await workflowTest.test();
        const duration = Date.now() - startTime;
        
        this.testResults.workflow.push({
          name: workflowTest.name,
          status: 'PASSED',
          duration,
          result
        });
        
        this.testResults.summary.passed++;
        console.log(`  ✅ ${workflowTest.name} - ${duration}ms`);
        
      } catch (error) {
        this.testResults.workflow.push({
          name: workflowTest.name,
          status: 'FAILED',
          error: error.message
        });
        
        this.testResults.summary.failed++;
        console.log(`  ❌ ${workflowTest.name} - ${error.message}`);
      }
      
      this.testResults.summary.totalTests++;
    }
  }

  /**
   * 📊 Performance benchmarking
   */
  async runPerformanceTests() {
    console.log('\n📊 Running Performance Benchmarking...');
    
    const performanceTests = [
      {
        name: 'API Response Times',
        test: () => this.benchmarkAPIResponseTimes()
      },
      {
        name: 'RAG Search Performance',
        test: () => this.benchmarkRAGPerformance()
      },
      {
        name: 'Database Query Performance',
        test: () => this.benchmarkDatabasePerformance()
      },
      {
        name: 'Vector Search Performance',
        test: () => this.benchmarkVectorSearch()
      },
      {
        name: 'Memory Usage Analysis',
        test: () => this.analyzeMemoryUsage()
      }
    ];
    
    for (const perfTest of performanceTests) {
      try {
        console.log(`  Benchmarking: ${perfTest.name}`);
        const result = await perfTest.test();
        
        this.testResults.performance.push({
          name: perfTest.name,
          status: 'COMPLETED',
          metrics: result
        });
        
        console.log(`  ✅ ${perfTest.name} completed`);
        
      } catch (error) {
        this.testResults.performance.push({
          name: perfTest.name,
          status: 'FAILED',
          error: error.message
        });
        
        console.log(`  ❌ ${perfTest.name} failed: ${error.message}`);
      }
    }
  }

  /**
   * 🚀 Load testing
   */
  async runLoadTests() {
    console.log('\n🚀 Running Load Testing...');
    
    const loadTests = [
      {
        name: 'Concurrent Chat Sessions',
        test: () => this.testConcurrentChatSessions()
      },
      {
        name: 'High Volume Knowledge Processing',
        test: () => this.testHighVolumeProcessing()
      },
      {
        name: 'Database Connection Pool',
        test: () => this.testDatabaseConnectionPool()
      },
      {
        name: 'API Rate Limiting',
        test: () => this.testAPIRateLimiting()
      }
    ];
    
    for (const loadTest of loadTests) {
      try {
        console.log(`  Load Testing: ${loadTest.name}`);
        const result = await loadTest.test();
        
        this.testResults.load.push({
          name: loadTest.name,
          status: 'COMPLETED',
          metrics: result
        });
        
        console.log(`  ✅ ${loadTest.name} completed`);
        
      } catch (error) {
        this.testResults.load.push({
          name: loadTest.name,
          status: 'FAILED',
          error: error.message
        });
        
        console.log(`  ❌ ${loadTest.name} failed: ${error.message}`);
      }
    }
  }

  /**
   * 🔒 Security auditing
   */
  async runSecurityTests() {
    console.log('\n🔒 Running Security Auditing...');
    
    const securityTests = [
      {
        name: 'Authentication Security',
        test: () => this.testAuthenticationSecurity()
      },
      {
        name: 'Authorization Checks',
        test: () => this.testAuthorizationChecks()
      },
      {
        name: 'Data Protection',
        test: () => this.testDataProtection()
      },
      {
        name: 'API Security Headers',
        test: () => this.testAPISecurityHeaders()
      },
      {
        name: 'Input Validation',
        test: () => this.testInputValidation()
      },
      {
        name: 'SQL Injection Prevention',
        test: () => this.testSQLInjectionPrevention()
      }
    ];
    
    for (const securityTest of securityTests) {
      try {
        console.log(`  Security Testing: ${securityTest.name}`);
        const result = await securityTest.test();
        
        this.testResults.security.push({
          name: securityTest.name,
          status: 'PASSED',
          findings: result
        });
        
        console.log(`  ✅ ${securityTest.name} passed`);
        
      } catch (error) {
        this.testResults.security.push({
          name: securityTest.name,
          status: 'FAILED',
          vulnerabilities: [error.message]
        });
        
        console.log(`  ❌ ${securityTest.name} failed: ${error.message}`);
      }
    }
  }

  /**
   * 🧪 Test RAG-Enhanced Chat Flow
   */
  async testRAGChatFlow() {
    console.log('    Testing RAG-enhanced chat...');
    
    // Create conversation
    const conversation = await prisma.conversation.create({
      data: {
        title: 'Day 30 RAG Test',
        agentId: this.testAgent.id,
        userId: this.testUser.id
      }
    });
    
    this.testConversation = conversation;
    
    // Test chat with knowledge context
    const chatResponse = await this.makeRequest('POST', `/api/agents/${this.testAgent.id}/chat`, {
      message: 'What do you know about AI agents and machine learning?',
      conversationId: conversation.id,
      useAdvancedRAG: true
    });
    
    if (!chatResponse.ok) {
      throw new Error(`Chat API failed: ${chatResponse.status}`);
    }
    
    const chatData = await chatResponse.json();
    
    // Verify RAG context was used
    if (!chatData.rag || !chatData.rag.hasContext) {
      throw new Error('RAG context was not properly utilized');
    }
    
    // Verify response quality
    if (!chatData.message || !chatData.message.content || chatData.message.content.length < 50) {
      throw new Error('Chat response quality insufficient');
    }
    
    return {
      conversationId: conversation.id,
      ragEnabled: chatData.rag.enabled,
      hasContext: chatData.rag.hasContext,
      responseLength: chatData.message.content.length,
      sources: chatData.rag.sources || 0
    };
  }

  /**
   * 🤖 Test Multi-Model Flow
   */
  async testMultiModelFlow() {
    console.log('    Testing multi-model chat flow...');
    
    if (!this.testConversation) {
      throw new Error('No test conversation available');
    }
    
    // Test with different providers
    const providers = ['openai', 'anthropic', 'google'];
    const results = [];
    
    for (const provider of providers) {
      try {
        const response = await this.makeRequest('POST', `/api/agents/${this.testAgent.id}/multi-provider-chat-v2`, {
          message: 'Explain the benefits of multi-model AI architectures',
          conversationId: this.testConversation.id,
          preferredProvider: provider,
          includeKnowledgeBase: true
        });
        
        if (response.ok) {
          const data = await response.json();
          results.push({
            provider,
            success: true,
            responseTime: data.processingTime || 0,
            model: data.usedModel
          });
        } else {
          results.push({
            provider,
            success: false,
            error: `HTTP ${response.status}`
          });
        }
      } catch (error) {
        results.push({
          provider,
          success: false,
          error: error.message
        });
      }
    }
    
    return {
      testedProviders: providers.length,
      successfulProviders: results.filter(r => r.success).length,
      results
    };
  }

  /**
   * 📊 Benchmark API Response Times
   */
  async benchmarkAPIResponseTimes() {
    const endpoints = [
      { method: 'GET', path: '/api/agents', name: 'List Agents' },
      { method: 'GET', path: '/api/knowledge', name: 'List Knowledge' },
      { method: 'GET', path: '/api/user/stats', name: 'User Stats' },
      { method: 'GET', path: `/api/agents/${this.testAgent.id}`, name: 'Get Agent' }
    ];
    
    const results = [];
    const iterations = 5;
    
    for (const endpoint of endpoints) {
      const times = [];
      
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        const response = await this.makeRequest(endpoint.method, endpoint.path);
        const duration = Date.now() - startTime;
        
        if (response.ok) {
          times.push(duration);
        }
      }
      
      if (times.length > 0) {
        results.push({
          endpoint: endpoint.name,
          avgResponseTime: times.reduce((a, b) => a + b, 0) / times.length,
          minResponseTime: Math.min(...times),
          maxResponseTime: Math.max(...times),
          successRate: (times.length / iterations) * 100
        });
      }
    }
    
    return results;
  }

  /**
   * 🚀 Test Concurrent Chat Sessions
   */
  async testConcurrentChatSessions() {
    const concurrentUsers = 10;
    const messagesPerUser = 3;
    
    console.log(`    Testing ${concurrentUsers} concurrent chat sessions...`);
    
    const promises = [];
    
    for (let i = 0; i < concurrentUsers; i++) {
      promises.push(this.simulateUserChatSession(i, messagesPerUser));
    }
    
    const startTime = Date.now();
    const results = await Promise.allSettled(promises);
    const duration = Date.now() - startTime;
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    return {
      concurrentUsers,
      messagesPerUser,
      totalMessages: concurrentUsers * messagesPerUser,
      successful,
      failed,
      duration,
      messagesPerSecond: (successful * messagesPerUser) / (duration / 1000)
    };
  }

  /**
   * 🔒 Test Authentication Security
   */
  async testAuthenticationSecurity() {
    const tests = [
      {
        name: 'Unauthenticated API Access',
        test: async () => {
          const response = await fetch(`${this.baseUrl}/api/agents`, {
            method: 'GET'
          });
          return response.status === 401;
        }
      },
      {
        name: 'Invalid Token Rejection',
        test: async () => {
          const response = await fetch(`${this.baseUrl}/api/agents`, {
            method: 'GET',
            headers: {
              'Authorization': 'Bearer invalid-token-12345'
            }
          });
          return response.status === 401;
        }
      }
    ];
    
    const results = [];
    
    for (const test of tests) {
      try {
        const passed = await test.test();
        results.push({
          name: test.name,
          status: passed ? 'PASSED' : 'FAILED'
        });
      } catch (error) {
        results.push({
          name: test.name,
          status: 'ERROR',
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * 🛠️ Helper method to make API requests
   */
  async makeRequest(method, path, body = null) {
    const url = `${this.baseUrl}${path}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        // Add authentication headers if needed
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    return fetch(url, options);
  }

  /**
   * 👤 Simulate user chat session
   */
  async simulateUserChatSession(userId, messageCount) {
    const messages = [
      'Hello, how are you?',
      'What can you tell me about AI?',
      'How does machine learning work?',
      'Explain natural language processing',
      'What are the benefits of AI agents?'
    ];
    
    for (let i = 0; i < messageCount; i++) {
      const message = messages[i % messages.length];
      
      const response = await this.makeRequest('POST', `/api/agents/${this.testAgent.id}/chat`, {
        message: `User ${userId}: ${message}`,
        conversationId: `test-conv-${userId}`
      });
      
      if (!response.ok) {
        throw new Error(`Chat failed for user ${userId}, message ${i + 1}`);
      }
      
      // Small delay between messages
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return { userId, messagesProcessed: messageCount };
  }

  /**
   * 📋 Generate comprehensive test report
   */
  async generateTestReport() {
    console.log('\n📋 Generating comprehensive test report...');
    
    const report = {
      testSuite: 'Day 30 Integration Testing',
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        baseUrl: this.baseUrl
      },
      summary: this.testResults.summary,
      results: {
        workflow: this.testResults.workflow,
        performance: this.testResults.performance,
        load: this.testResults.load,
        security: this.testResults.security
      },
      recommendations: this.generateRecommendations()
    };
    
    // Save report to file
    const reportPath = path.join(__dirname, '..', 'test-reports', `day30-integration-test-${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`✅ Test report saved to: ${reportPath}`);
    
    // Print summary
    this.printTestSummary();
    
    return report;
  }

  /**
   * 💡 Generate recommendations based on test results
   */
  generateRecommendations() {
    const recommendations = [];
    
    // Performance recommendations
    const avgResponseTime = this.testResults.performance
      .find(p => p.name === 'API Response Times')?.metrics
      ?.reduce((sum, metric) => sum + metric.avgResponseTime, 0) / 
      this.testResults.performance.find(p => p.name === 'API Response Times')?.metrics?.length || 0;
    
    if (avgResponseTime > 2000) {
      recommendations.push({
        category: 'Performance',
        priority: 'HIGH',
        issue: 'API response times exceed 2 seconds',
        recommendation: 'Implement caching, optimize database queries, consider CDN'
      });
    }
    
    // Security recommendations
    const securityFailures = this.testResults.security.filter(s => s.status === 'FAILED');
    if (securityFailures.length > 0) {
      recommendations.push({
        category: 'Security',
        priority: 'CRITICAL',
        issue: `${securityFailures.length} security tests failed`,
        recommendation: 'Address security vulnerabilities before production deployment'
      });
    }
    
    // Load testing recommendations
    const loadResults = this.testResults.load.find(l => l.name === 'Concurrent Chat Sessions');
    if (loadResults?.metrics?.messagesPerSecond < 10) {
      recommendations.push({
        category: 'Scalability',
        priority: 'MEDIUM',
        issue: 'Low throughput under concurrent load',
        recommendation: 'Optimize concurrent processing, consider horizontal scaling'
      });
    }
    
    return recommendations;
  }

  /**
   * 📊 Print test summary
   */
  printTestSummary() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 DAY 30 INTEGRATION TESTING SUMMARY');
    console.log('='.repeat(80));
    
    const { summary } = this.testResults;
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`Passed: ${summary.passed} ✅`);
    console.log(`Failed: ${summary.failed} ❌`);
    console.log(`Warnings: ${summary.warnings} ⚠️`);
    console.log(`Duration: ${summary.duration}ms`);
    console.log(`Success Rate: ${((summary.passed / summary.totalTests) * 100).toFixed(1)}%`);
    
    if (summary.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! System ready for production deployment.');
    } else {
      console.log('\n⚠️ Some tests failed. Please review and fix issues before deployment.');
    }
  }

  /**
   * 🧹 Cleanup test environment
   */
  async cleanup() {
    console.log('\n🧹 Cleaning up test environment...');
    
    try {
      if (this.testUser) {
        // Delete test conversations and messages
        await prisma.message.deleteMany({
          where: {
            conversation: {
              userId: this.testUser.id
            }
          }
        });
        
        await prisma.conversation.deleteMany({
          where: { userId: this.testUser.id }
        });
        
        // Delete test agents
        await prisma.agent.deleteMany({
          where: { userId: this.testUser.id }
        });
        
        // Delete test knowledge
        await prisma.knowledge.deleteMany({
          where: { userId: this.testUser.id }
        });
        
        // Delete test user
        await prisma.user.delete({
          where: { id: this.testUser.id }
        });
        
        console.log('✅ Test data cleaned up successfully');
      }
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    } finally {
      await prisma.$disconnect();
    }
  }
}

// Run integration testing if called directly
if (require.main === module) {
  const tester = new Day30IntegrationTester();
  tester.runComprehensiveTests()
    .then(() => {
      console.log('\n🎯 Day 30 Integration Testing completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Integration testing failed:', error);
      process.exit(1);
    });
}

module.exports = { Day30IntegrationTester }; 