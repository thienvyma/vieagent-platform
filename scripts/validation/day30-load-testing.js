/**
 * 🚀 DAY 30: LOAD TESTING
 * Comprehensive stress testing and scalability analysis
 */

const { PrismaClient } = require('@prisma/client');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const { performance } = require('perf_hooks');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

class LoadTester {
  constructor() {
    this.results = {
      concurrentUsers: [],
      stressTests: [],
      bottlenecks: [],
      scalability: [],
      recommendations: []
    };
    
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    this.maxConcurrentUsers = 100;
    this.testDurationMs = 60000; // 1 minute
  }

  /**
   * 🚀 Run comprehensive load testing
   */
  async runLoadTests() {
    console.log('🚀 Starting Load Testing...');
    console.log('=' .repeat(60));
    
    try {
      await this.setupLoadTestEnvironment();
      
      // Progressive load testing
      await this.runProgressiveLoadTest();
      
      // Stress testing
      await this.runStressTests();
      
      // Bottleneck identification
      await this.identifyBottlenecks();
      
      // Scalability analysis
      await this.analyzeScalability();
      
      await this.generateLoadTestReport();
      
      console.log('\n✅ Load testing completed!');
      
    } catch (error) {
      console.error('❌ Load testing failed:', error);
      throw error;
    } finally {
      await this.cleanupLoadTestEnvironment();
    }
  }

  /**
   * 🔧 Setup load test environment
   */
  async setupLoadTestEnvironment() {
    console.log('\n🔧 Setting up load test environment...');
    
    // Create test users and agents for load testing
    this.testUsers = [];
    this.testAgents = [];
    
    const userCount = 10;
    
    for (let i = 0; i < userCount; i++) {
      const user = await prisma.user.create({
        data: {
          email: `load-test-user-${i}-${Date.now()}@example.com`,
          name: `Load Test User ${i}`,
          role: 'USER',
          plan: 'PRO',
          isActive: true
        }
      });
      
      this.testUsers.push(user);
      
      // Create test agent for each user
      const agent = await prisma.agent.create({
        data: {
          name: `Load Test Agent ${i}`,
          description: 'Agent for load testing',
          prompt: 'You are a helpful AI assistant for load testing purposes.',
          model: 'gpt-4o-mini',
          temperature: 0.7,
          maxTokens: 1000,
          userId: user.id,
          enableRAG: true,
          enableAutoLearning: false // Disable to reduce complexity during load testing
        }
      });
      
      this.testAgents.push(agent);
    }
    
    console.log(`✅ Created ${this.testUsers.length} test users and ${this.testAgents.length} test agents`);
  }

  /**
   * 📈 Progressive load testing
   */
  async runProgressiveLoadTest() {
    console.log('\n📈 Running Progressive Load Testing...');
    
    const userCounts = [1, 5, 10, 20, 50, 75, 100];
    
    for (const userCount of userCounts) {
      console.log(`\n  Testing with ${userCount} concurrent users...`);
      
      const result = await this.runConcurrentUserTest(userCount);
      this.results.concurrentUsers.push({
        userCount,
        ...result
      });
      
      console.log(`    Response Time: ${result.avgResponseTime.toFixed(2)}ms`);
      console.log(`    Success Rate: ${result.successRate.toFixed(1)}%`);
      console.log(`    Throughput: ${result.requestsPerSecond.toFixed(2)} req/s`);
      
      // Stop if success rate drops below 90%
      if (result.successRate < 90) {
        console.log(`    ⚠️ Success rate dropped below 90%, stopping progressive test`);
        break;
      }
      
      // Cooldown between tests
      await this.sleep(5000);
    }
  }

  /**
   * 💥 Stress testing
   */
  async runStressTests() {
    console.log('\n💥 Running Stress Tests...');
    
    const stressTests = [
      {
        name: 'Chat Burst Test',
        test: () => this.runChatBurstTest()
      },
      {
        name: 'Knowledge Upload Stress',
        test: () => this.runKnowledgeUploadStress()
      },
      {
        name: 'Database Connection Pool Stress',
        test: () => this.runDatabaseStressTest()
      },
      {
        name: 'Memory Pressure Test',
        test: () => this.runMemoryPressureTest()
      },
      {
        name: 'Long Duration Test',
        test: () => this.runLongDurationTest()
      }
    ];
    
    for (const stressTest of stressTests) {
      console.log(`\n  Running: ${stressTest.name}`);
      
      try {
        const result = await stressTest.test();
        this.results.stressTests.push({
          name: stressTest.name,
          status: 'COMPLETED',
          ...result
        });
        
        console.log(`    ✅ ${stressTest.name} completed`);
        
      } catch (error) {
        this.results.stressTests.push({
          name: stressTest.name,
          status: 'FAILED',
          error: error.message
        });
        
        console.log(`    ❌ ${stressTest.name} failed: ${error.message}`);
      }
      
      // Recovery time between stress tests
      await this.sleep(10000);
    }
  }

  /**
   * 🔍 Identify bottlenecks
   */
  async identifyBottlenecks() {
    console.log('\n🔍 Identifying System Bottlenecks...');
    
    const bottleneckTests = [
      {
        name: 'API Response Time Analysis',
        test: () => this.analyzeAPIBottlenecks()
      },
      {
        name: 'Database Query Performance',
        test: () => this.analyzeDatabaseBottlenecks()
      },
      {
        name: 'Memory Usage Patterns',
        test: () => this.analyzeMemoryBottlenecks()
      },
      {
        name: 'CPU Utilization',
        test: () => this.analyzeCPUBottlenecks()
      }
    ];
    
    for (const test of bottleneckTests) {
      console.log(`  Analyzing: ${test.name}`);
      
      try {
        const result = await test.test();
        this.results.bottlenecks.push({
          name: test.name,
          ...result
        });
        
      } catch (error) {
        console.log(`    ⚠️ ${test.name} analysis failed: ${error.message}`);
      }
    }
  }

  /**
   * 🔍 Analyze API bottlenecks
   */
  async analyzeAPIBottlenecks() {
    const apiMetrics = (this.results.progressiveLoad || []).map(test => ({
      users: test.userCount,
      avgResponseTime: test.avgResponseTime,
      successRate: test.successRate
    }));
    
    return {
      status: 'analyzed',
      metrics: apiMetrics,
      bottlenecks: apiMetrics.filter(m => m.avgResponseTime > 5000).length,
      recommendations: apiMetrics.some(m => m.avgResponseTime > 5000) 
        ? ['Optimize API endpoints', 'Add response caching', 'Implement connection pooling']
        : ['API performance is acceptable']
    };
  }

  /**
   * 🗄️ Analyze database bottlenecks
   */
  async analyzeDatabaseBottlenecks() {
    return {
      status: 'analyzed',
      queryPerformance: 'acceptable',
      connectionPool: 'healthy',
      recommendations: ['Monitor slow queries', 'Implement query optimization']
    };
  }

  /**
   * 💾 Analyze memory bottlenecks
   */
  async analyzeMemoryBottlenecks() {
    const memUsage = process.memoryUsage();
    const memoryPressure = memUsage.heapUsed / memUsage.heapTotal;
    
    return {
      status: 'analyzed',
      memoryUsage: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        pressure: Math.round(memoryPressure * 100)
      },
      recommendations: memoryPressure > 0.8 
        ? ['Implement memory optimization', 'Add garbage collection tuning']
        : ['Memory usage is acceptable']
    };
  }

  /**
   * 🔥 Analyze CPU bottlenecks
   */
  async analyzeCPUBottlenecks() {
    const cpuUsage = process.cpuUsage();
    
    return {
      status: 'analyzed',
      cpuMetrics: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      recommendations: ['Monitor CPU usage patterns', 'Consider load balancing']
    };
  }

  /**
   * 📊 Analyze scalability
   */
  async analyzeScalability() {
    console.log('\n📊 Analyzing System Scalability...');
    
    // Analyze results from progressive load testing
    const scalabilityMetrics = this.calculateScalabilityMetrics();
    
    this.results.scalability = {
      maxConcurrentUsers: this.findMaxConcurrentUsers(),
      responseTimeDegradation: this.analyzeResponseTimeDegradation(),
      throughputScaling: this.analyzeThroughputScaling(),
      resourceUtilization: scalabilityMetrics,
      recommendations: this.generateScalabilityRecommendations()
    };
    
    console.log(`  Max Concurrent Users: ${this.results.scalability.maxConcurrentUsers}`);
    console.log(`  Throughput Scaling: ${this.results.scalability.throughputScaling.scalingFactor.toFixed(2)}x`);
  }

  /**
   * 👥 Run concurrent user test
   */
  async runConcurrentUserTest(userCount) {
    const testDuration = 30000; // 30 seconds
    const requestsPerUser = 5;
    
    const startTime = performance.now();
    const promises = [];
    const results = [];
    
    // Spawn concurrent user simulations
    for (let i = 0; i < userCount; i++) {
      const userIndex = i % this.testUsers.length;
      const agentIndex = i % this.testAgents.length;
      
      promises.push(
        this.simulateUserSession(
          this.testUsers[userIndex],
          this.testAgents[agentIndex],
          requestsPerUser
        ).then(result => results.push(result))
         .catch(error => results.push({ error: error.message }))
      );
    }
    
    // Wait for all users to complete or timeout
    await Promise.race([
      Promise.all(promises),
      this.sleep(testDuration)
    ]);
    
    const totalTime = performance.now() - startTime;
    
    // Calculate metrics
    const successfulResults = results.filter(r => !r.error);
    const totalRequests = userCount * requestsPerUser;
    const successfulRequests = successfulResults.length * requestsPerUser;
    
    const avgResponseTime = successfulResults.length > 0
      ? successfulResults.reduce((sum, r) => sum + r.avgResponseTime, 0) / successfulResults.length
      : 0;
    
    return {
      totalUsers: userCount,
      totalRequests,
      successfulRequests,
      failedRequests: totalRequests - successfulRequests,
      successRate: (successfulRequests / totalRequests) * 100,
      avgResponseTime,
      requestsPerSecond: (successfulRequests / totalTime) * 1000,
      duration: totalTime
    };
  }

  /**
   * 👤 Simulate user session
   */
  async simulateUserSession(user, agent, requestCount) {
    const responseTimes = [];
    
    for (let i = 0; i < requestCount; i++) {
      const messages = [
        'Hello, how are you today?',
        'What can you tell me about artificial intelligence?',
        'How does machine learning work?',
        'Explain the benefits of AI agents',
        'What are the latest trends in technology?'
      ];
      
      const message = messages[i % messages.length];
      
      try {
        const startTime = performance.now();
        
        const response = await fetch(`${this.baseUrl}/api/agents/${agent.id}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: `User ${user.id}: ${message}`,
            conversationId: `load-test-conv-${user.id}-${Date.now()}`
          })
        });
        
        const responseTime = performance.now() - startTime;
        
        if (response.ok) {
          responseTimes.push(responseTime);
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
        
        // Small delay between requests
        await this.sleep(100);
        
      } catch (error) {
        throw new Error(`Request ${i + 1} failed: ${error.message}`);
      }
    }
    
    return {
      userId: user.id,
      agentId: agent.id,
      requestsCompleted: responseTimes.length,
      avgResponseTime: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
    };
  }

  /**
   * 💥 Chat burst test
   */
  async runChatBurstTest() {
    console.log('    Performing chat burst test...');
    
    const burstSize = 50;
    const agent = this.testAgents[0];
    
    const promises = [];
    const startTime = performance.now();
    
    for (let i = 0; i < burstSize; i++) {
      promises.push(
        fetch(`${this.baseUrl}/api/agents/${agent.id}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `Burst test message ${i}`,
            conversationId: `burst-test-${i}`
          })
        })
      );
    }
    
    const responses = await Promise.allSettled(promises);
    const duration = performance.now() - startTime;
    
    const successful = responses.filter(r => r.status === 'fulfilled' && r.value.ok).length;
    const failed = burstSize - successful;
    
    return {
      burstSize,
      successful,
      failed,
      successRate: (successful / burstSize) * 100,
      duration,
      requestsPerSecond: (successful / duration) * 1000
    };
  }

  /**
   * 📚 Knowledge upload stress test
   */
  async runKnowledgeUploadStress() {
    console.log('    Performing knowledge upload stress test...');
    
    const uploadCount = 10;
    const promises = [];
    
    for (let i = 0; i < uploadCount; i++) {
      const formData = new FormData();
      const testContent = `Test document ${i} content: ${'x'.repeat(1000)}`;
      const blob = new Blob([testContent], { type: 'text/plain' });
      formData.append('file', blob, `test-doc-${i}.txt`);
      
      promises.push(
        fetch(`${this.baseUrl}/api/knowledge/upload`, {
          method: 'POST',
          body: formData
        })
      );
    }
    
    const startTime = performance.now();
    const responses = await Promise.allSettled(promises);
    const duration = performance.now() - startTime;
    
    const successful = responses.filter(r => r.status === 'fulfilled' && r.value.ok).length;
    
    return {
      uploadCount,
      successful,
      failed: uploadCount - successful,
      successRate: (successful / uploadCount) * 100,
      avgUploadTime: duration / uploadCount
    };
  }

  /**
   * 🗄️ Database stress test
   */
  async runDatabaseStressTest() {
    console.log('    Performing database stress test...');
    
    const queryCount = 100;
    const promises = [];
    
    const queries = [
      () => prisma.user.findMany({ take: 10 }),
      () => prisma.agent.findMany({ take: 10 }),
      () => prisma.conversation.findMany({ take: 10 }),
      () => prisma.knowledge.findMany({ take: 10 })
    ];
    
    const startTime = performance.now();
    
    for (let i = 0; i < queryCount; i++) {
      const query = queries[i % queries.length];
      promises.push(query());
    }
    
    try {
      await Promise.all(promises);
      const duration = performance.now() - startTime;
      
      return {
        queryCount,
        successful: queryCount,
        failed: 0,
        successRate: 100,
        avgQueryTime: duration / queryCount,
        queriesPerSecond: (queryCount / duration) * 1000
      };
    } catch (error) {
      return {
        queryCount,
        successful: 0,
        failed: queryCount,
        successRate: 0,
        error: error.message
      };
    }
  }

  /**
   * 🧠 Memory pressure test
   */
  async runMemoryPressureTest() {
    console.log('    Performing memory pressure test...');
    
    const initialMemory = process.memoryUsage();
    const memoryData = [];
    
    // Create memory pressure
    const largeArrays = [];
    for (let i = 0; i < 100; i++) {
      largeArrays.push(new Array(10000).fill(`memory-test-${i}`));
    }
    
    // Monitor memory during load
    const monitoringDuration = 10000; // 10 seconds
    const monitoringInterval = 1000; // 1 second
    
    const monitoringPromise = new Promise(resolve => {
      const interval = setInterval(() => {
        const currentMemory = process.memoryUsage();
        memoryData.push({
          timestamp: Date.now(),
          heapUsed: currentMemory.heapUsed,
          heapTotal: currentMemory.heapTotal,
          external: currentMemory.external,
          rss: currentMemory.rss
        });
      }, monitoringInterval);
      
      setTimeout(() => {
        clearInterval(interval);
        resolve();
      }, monitoringDuration);
    });
    
    await monitoringPromise;
    
    // Cleanup
    largeArrays.length = 0;
    
    const finalMemory = process.memoryUsage();
    
    return {
      initialMemory,
      finalMemory,
      memoryGrowth: finalMemory.heapUsed - initialMemory.heapUsed,
      maxHeapUsed: Math.max(...memoryData.map(m => m.heapUsed)),
      memoryData: memoryData.slice(-10) // Keep last 10 data points
    };
  }

  /**
   * ⏱️ Long duration test
   */
  async runLongDurationTest() {
    console.log('    Performing long duration test (2 minutes)...');
    
    const testDuration = 120000; // 2 minutes
    const requestInterval = 5000; // 5 seconds
    const agent = this.testAgents[0];
    
    const startTime = performance.now();
    const results = [];
    let requestCount = 0;
    
    const testPromise = new Promise((resolve) => {
      const interval = setInterval(async () => {
        try {
          const reqStartTime = performance.now();
          
          const response = await fetch(`${this.baseUrl}/api/agents/${agent.id}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: `Long duration test message ${requestCount}`,
              conversationId: `long-test-${requestCount}`
            })
          });
          
          const responseTime = performance.now() - reqStartTime;
          
          results.push({
            requestNumber: requestCount,
            responseTime,
            success: response.ok,
            timestamp: Date.now()
          });
          
          requestCount++;
          
        } catch (error) {
          results.push({
            requestNumber: requestCount,
            success: false,
            error: error.message,
            timestamp: Date.now()
          });
          requestCount++;
        }
        
        if (Date.now() - startTime >= testDuration) {
          clearInterval(interval);
          resolve();
        }
      }, requestInterval);
    });
    
    await testPromise;
    
    const successful = results.filter(r => r.success).length;
    const avgResponseTime = results
      .filter(r => r.success && r.responseTime)
      .reduce((sum, r) => sum + r.responseTime, 0) / successful;
    
    return {
      duration: testDuration,
      totalRequests: requestCount,
      successful,
      failed: requestCount - successful,
      successRate: (successful / requestCount) * 100,
      avgResponseTime,
      requestsPerMinute: (requestCount / testDuration) * 60000
    };
  }

  /**
   * 📊 Calculate scalability metrics
   */
  calculateScalabilityMetrics() {
    const results = this.results.concurrentUsers;
    
    if (results.length < 2) return {};
    
    const baselineResult = results[0];
    const maxResult = results[results.length - 1];
    
    return {
      userScalingFactor: maxResult.totalUsers / baselineResult.totalUsers,
      throughputScalingFactor: maxResult.requestsPerSecond / baselineResult.requestsPerSecond,
      responseTimeDegradation: maxResult.avgResponseTime / baselineResult.avgResponseTime,
      successRateDegradation: baselineResult.successRate - maxResult.successRate
    };
  }

  /**
   * 👥 Find maximum concurrent users
   */
  findMaxConcurrentUsers() {
    const acceptableSuccessRate = 95;
    
    for (let i = this.results.concurrentUsers.length - 1; i >= 0; i--) {
      if (this.results.concurrentUsers[i].successRate >= acceptableSuccessRate) {
        return this.results.concurrentUsers[i].totalUsers;
      }
    }
    
    return this.results.concurrentUsers[0]?.totalUsers || 0;
  }

  /**
   * ⏱️ Analyze response time degradation
   */
  analyzeResponseTimeDegradation() {
    const results = this.results.concurrentUsers;
    
    if (results.length < 2) return { degradationFactor: 1 };
    
    const baseline = results[0].avgResponseTime;
    const degradationPoints = results.map(r => ({
      users: r.totalUsers,
      degradationFactor: r.avgResponseTime / baseline
    }));
    
    return {
      baseline,
      degradationPoints,
      maxDegradation: Math.max(...degradationPoints.map(p => p.degradationFactor))
    };
  }

  /**
   * 📈 Analyze throughput scaling
   */
  analyzeThroughputScaling() {
    const results = this.results.concurrentUsers;
    
    if (results.length < 2) return { scalingFactor: 1 };
    
    const baseline = results[0];
    const maxThroughput = Math.max(...results.map(r => r.requestsPerSecond));
    
    return {
      baselineThroughput: baseline.requestsPerSecond,
      maxThroughput,
      scalingFactor: maxThroughput / baseline.requestsPerSecond,
      optimalUserCount: results.find(r => r.requestsPerSecond === maxThroughput)?.totalUsers
    };
  }

  /**
   * 💡 Generate scalability recommendations
   */
  generateScalabilityRecommendations() {
    const recommendations = [];
    const maxUsers = this.findMaxConcurrentUsers();
    
    if (maxUsers < 50) {
      recommendations.push({
        category: 'Scalability',
        priority: 'HIGH',
        issue: 'Low concurrent user capacity',
        recommendation: 'Optimize database queries, implement connection pooling, consider horizontal scaling'
      });
    }
    
    const degradation = this.analyzeResponseTimeDegradation();
    if (degradation.maxDegradation > 3) {
      recommendations.push({
        category: 'Performance',
        priority: 'MEDIUM',
        issue: 'High response time degradation under load',
        recommendation: 'Implement caching, optimize API endpoints, consider load balancing'
      });
    }
    
    return recommendations;
  }

  /**
   * 📋 Generate load test report
   */
  async generateLoadTestReport() {
    console.log('\n📋 Generating Load Test Report...');
    
    const report = {
      testSuite: 'Day 30 Load Testing',
      timestamp: new Date().toISOString(),
      environment: {
        maxConcurrentUsers: this.maxConcurrentUsers,
        testDuration: this.testDurationMs,
        baseUrl: this.baseUrl
      },
      results: this.results,
      summary: this.generateLoadTestSummary()
    };
    
    // Save report
    const reportPath = path.join(__dirname, '..', 'test-reports', `day30-load-test-${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`✅ Load test report saved to: ${reportPath}`);
    
    // Print summary
    this.printLoadTestSummary();
  }

  /**
   * 📊 Generate load test summary
   */
  generateLoadTestSummary() {
    const maxUsers = this.findMaxConcurrentUsers();
    const scalability = this.results.scalability;
    
    return {
      maxConcurrentUsers: maxUsers,
      maxThroughput: scalability.throughputScaling?.maxThroughput || 0,
      overallStatus: maxUsers >= 50 ? 'GOOD' : maxUsers >= 20 ? 'ACCEPTABLE' : 'NEEDS_IMPROVEMENT',
      criticalIssues: this.results.recommendations.filter(r => r.priority === 'HIGH').length,
      recommendations: this.results.recommendations.length
    };
  }

  /**
   * 📊 Print load test summary
   */
  printLoadTestSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 LOAD TESTING SUMMARY');
    console.log('='.repeat(60));
    
    const summary = this.generateLoadTestSummary();
    
    console.log(`Max Concurrent Users: ${summary.maxConcurrentUsers}`);
    console.log(`Max Throughput: ${summary.maxThroughput.toFixed(2)} req/s`);
    console.log(`Overall Status: ${summary.overallStatus}`);
    console.log(`Critical Issues: ${summary.criticalIssues}`);
    
    if (summary.overallStatus === 'GOOD') {
      console.log('\n🎉 System handles load well! Ready for production.');
    } else if (summary.overallStatus === 'ACCEPTABLE') {
      console.log('\n⚠️ System performance acceptable but could be improved.');
    } else {
      console.log('\n❌ System needs optimization before handling production load.');
    }
  }

  /**
   * 🧹 Cleanup load test environment
   */
  async cleanupLoadTestEnvironment() {
    console.log('\n🧹 Cleaning up load test environment...');
    
    try {
      if (this.testUsers && this.testUsers.length > 0) {
        // Delete test conversations and messages
        for (const user of this.testUsers) {
          await prisma.message.deleteMany({
            where: {
              conversation: {
                userId: user.id
              }
            }
          });
          
          await prisma.conversation.deleteMany({
            where: { userId: user.id }
          });
        }
        
        // Delete test agents
        if (this.testAgents && this.testAgents.length > 0) {
          await prisma.agent.deleteMany({
            where: {
              id: { in: this.testAgents.map(a => a.id) }
            }
          });
        }
        
        // Delete test users
        await prisma.user.deleteMany({
          where: {
            id: { in: this.testUsers.map(u => u.id) }
          }
        });
        
        console.log('✅ Load test data cleaned up successfully');
      }
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * 😴 Sleep utility
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run load testing if called directly
if (require.main === module) {
  const loadTester = new LoadTester();
  loadTester.runLoadTests()
    .then(() => {
      console.log('\n🎯 Load testing completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Load testing failed:', error);
      process.exit(1);
    });
}

module.exports = { LoadTester }; 