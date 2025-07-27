/**
 * 📊 DAY 30: PERFORMANCE BENCHMARKING
 * Detailed performance analysis and optimization recommendations
 */

const { PrismaClient } = require('@prisma/client');
const { performance } = require('perf_hooks');
const os = require('os');
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

class PerformanceBenchmarker {
  constructor() {
    this.results = {
      system: {},
      database: {},
      api: {},
      ai: {},
      vector: {},
      recommendations: []
    };
    
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  }

  /**
   * 🚀 Run complete performance benchmark
   */
  async runBenchmark() {
    console.log('📊 Starting Performance Benchmarking...');
    console.log('=' .repeat(60));
    
    try {
      await this.benchmarkSystemResources();
      await this.benchmarkDatabasePerformance();
      await this.benchmarkAPIPerformance();
      await this.benchmarkAIPerformance();
      await this.benchmarkVectorOperations();
      
      await this.generatePerformanceReport();
      
      console.log('\n✅ Performance benchmarking completed!');
      
    } catch (error) {
      console.error('❌ Performance benchmarking failed:', error);
      throw error;
    }
  }

  /**
   * 💻 System resources benchmark
   */
  async benchmarkSystemResources() {
    console.log('\n💻 Benchmarking System Resources...');
    
    const startTime = performance.now();
    
    // CPU Information
    const cpuInfo = os.cpus();
    const cpuUsage = process.cpuUsage();
    
    // Memory Information
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = process.memoryUsage();
    
    // System Load
    const loadAverage = os.loadavg();
    
    // Disk I/O Test
    const diskIOResult = await this.testDiskIO();
    
    this.results.system = {
      cpu: {
        cores: cpuInfo.length,
        model: cpuInfo[0].model,
        speed: cpuInfo[0].speed,
        usage: cpuUsage
      },
      memory: {
        total: totalMemory,
        used: usedMemory,
        free: freeMemory,
        usagePercent: (usedMemory / totalMemory) * 100,
        process: memoryUsage
      },
      load: {
        average: loadAverage,
        current: loadAverage[0]
      },
      diskIO: diskIOResult,
      benchmarkTime: performance.now() - startTime
    };
    
    console.log(`  CPU: ${cpuInfo.length} cores, ${cpuInfo[0].model}`);
    console.log(`  Memory: ${(usedMemory / 1024 / 1024 / 1024).toFixed(2)}GB / ${(totalMemory / 1024 / 1024 / 1024).toFixed(2)}GB (${((usedMemory / totalMemory) * 100).toFixed(1)}%)`);
    console.log(`  Load Average: ${loadAverage[0].toFixed(2)}`);
  }

  /**
   * 🗄️ Database performance benchmark
   */
  async benchmarkDatabasePerformance() {
    console.log('\n🗄️ Benchmarking Database Performance...');
    
    const tests = [
      { name: 'Simple Select', query: () => prisma.user.findMany({ take: 10 }) },
      { name: 'Complex Join', query: () => prisma.agent.findMany({ 
        include: { 
          conversations: { 
            include: { messages: true } 
          } 
        }, 
        take: 5 
      }) },
      { name: 'Aggregation', query: () => prisma.user.count() },
      { name: 'Text Search', query: () => prisma.knowledge.findMany({
        where: {
          OR: [
            { title: { contains: 'test' } },
            { content: { contains: 'test' } }
          ]
        },
        take: 10
      }) }
    ];
    
    const results = [];
    
    for (const test of tests) {
      const iterations = 10;
      const times = [];
      
      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        try {
          await test.query();
          const duration = performance.now() - startTime;
          times.push(duration);
        } catch (error) {
          console.warn(`  ⚠️ ${test.name} failed: ${error.message}`);
        }
      }
      
      if (times.length > 0) {
        results.push({
          name: test.name,
          avgTime: times.reduce((a, b) => a + b, 0) / times.length,
          minTime: Math.min(...times),
          maxTime: Math.max(...times),
          iterations: times.length
        });
        
        console.log(`  ${test.name}: ${results[results.length - 1].avgTime.toFixed(2)}ms avg`);
      }
    }
    
    this.results.database = {
      tests: results,
      connectionPool: await this.testDatabaseConnectionPool()
    };
  }

  /**
   * 🌐 API performance benchmark
   */
  async benchmarkAPIPerformance() {
    console.log('\n🌐 Benchmarking API Performance...');
    
    const endpoints = [
      { method: 'GET', path: '/api/health', name: 'Health Check' },
      { method: 'GET', path: '/api/agents', name: 'List Agents' },
      { method: 'GET', path: '/api/knowledge', name: 'List Knowledge' },
      { method: 'GET', path: '/api/user/stats', name: 'User Stats' }
    ];
    
    const results = [];
    
    for (const endpoint of endpoints) {
      const iterations = 20;
      const times = [];
      const errors = [];
      
      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        try {
          const response = await fetch(`${this.baseUrl}${endpoint.path}`, {
            method: endpoint.method
          });
          
          const duration = performance.now() - startTime;
          
          if (response.ok) {
            times.push(duration);
          } else {
            errors.push(`HTTP ${response.status}`);
          }
        } catch (error) {
          errors.push(error.message);
        }
      }
      
      if (times.length > 0) {
        results.push({
          name: endpoint.name,
          path: endpoint.path,
          avgResponseTime: times.reduce((a, b) => a + b, 0) / times.length,
          minResponseTime: Math.min(...times),
          maxResponseTime: Math.max(...times),
          successRate: (times.length / iterations) * 100,
          errors: errors.length,
          p95: this.calculatePercentile(times, 95),
          p99: this.calculatePercentile(times, 99)
        });
        
        console.log(`  ${endpoint.name}: ${results[results.length - 1].avgResponseTime.toFixed(2)}ms avg (${results[results.length - 1].successRate.toFixed(1)}% success)`);
      }
    }
    
    this.results.api = {
      endpoints: results,
      throughput: await this.testAPIThroughput()
    };
  }

  /**
   * 🤖 AI performance benchmark
   */
  async benchmarkAIPerformance() {
    console.log('\n🤖 Benchmarking AI Performance...');
    
    // Create test user and agent for AI testing
    const testUser = await this.createTestUser();
    const testAgent = await this.createTestAgent(testUser.id);
    
    try {
      const aiTests = [
        {
          name: 'Simple Chat',
          test: () => this.testAIChat(testAgent.id, 'Hello, how are you?')
        },
        {
          name: 'Complex Query',
          test: () => this.testAIChat(testAgent.id, 'Explain the differences between machine learning and deep learning in detail.')
        },
        {
          name: 'RAG-Enhanced Chat',
          test: () => this.testRAGChat(testAgent.id, 'What information do you have in your knowledge base?')
        }
      ];
      
      const results = [];
      
      for (const test of aiTests) {
        const iterations = 5;
        const times = [];
        const tokenCounts = [];
        
        for (let i = 0; i < iterations; i++) {
          try {
            const result = await test.test();
            times.push(result.responseTime);
            if (result.tokens) {
              tokenCounts.push(result.tokens);
            }
          } catch (error) {
            console.warn(`  ⚠️ ${test.name} iteration ${i + 1} failed: ${error.message}`);
          }
        }
        
        if (times.length > 0) {
          results.push({
            name: test.name,
            avgResponseTime: times.reduce((a, b) => a + b, 0) / times.length,
            avgTokens: tokenCounts.length > 0 ? tokenCounts.reduce((a, b) => a + b, 0) / tokenCounts.length : 0,
            successRate: (times.length / iterations) * 100
          });
          
          console.log(`  ${test.name}: ${results[results.length - 1].avgResponseTime.toFixed(2)}ms avg`);
        }
      }
      
      this.results.ai = {
        tests: results,
        modelPerformance: await this.testModelPerformance(testAgent.id)
      };
      
    } finally {
      // Cleanup test data
      await this.cleanupTestData(testUser.id);
    }
  }

  /**
   * 🤖 Test model performance
   */
  async testModelPerformance(agentId) {
    console.log('\n🤖 Testing Model Performance...');
    
    const testCases = [
      { name: 'Simple Response', message: 'Hello, how are you?' },
      { name: 'Complex Analysis', message: 'Analyze the pros and cons of artificial intelligence in healthcare.' },
      { name: 'Code Generation', message: 'Write a Python function to calculate fibonacci numbers.' }
    ];
    
    const results = [];
    
    for (const testCase of testCases) {
      try {
        const startTime = Date.now();
        const response = await this.testAIChat(agentId, testCase.message);
        const endTime = Date.now();
        
        results.push({
          test: testCase.name,
          responseTime: endTime - startTime,
          success: response.success,
          tokenCount: response.data?.content?.length || 0
        });
        
        console.log(`  ${testCase.name}: ${endTime - startTime}ms`);
      } catch (error) {
        results.push({
          test: testCase.name,
          responseTime: 0,
          success: false,
          error: error.message
        });
        console.log(`  ⚠️ ${testCase.name} failed: ${error.message}`);
      }
    }
    
    return results;
  }

  /**
   * 🧪 Test embedding generation
   */
  async testEmbeddingGeneration() {
    try {
      const response = await fetch(`${this.baseUrl}/api/test/embedding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Test embedding generation' })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 🔍 Test similarity calculation
   */
  async testSimilarityCalculation() {
    try {
      const response = await fetch(`${this.baseUrl}/api/test/similarity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text1: 'This is a test document',
          text2: 'This is another test document'
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 🔍 Vector operations benchmark
   */
  async benchmarkVectorOperations() {
    console.log('\n🔍 Benchmarking Vector Operations...');
    
    const vectorTests = [
      {
        name: 'Vector Search',
        test: () => this.testVectorSearch('machine learning artificial intelligence')
      },
      {
        name: 'Embedding Generation',
        test: () => this.testEmbeddingGeneration('This is a test document for embedding generation.')
      },
      {
        name: 'Similarity Calculation',
        test: () => this.testSimilarityCalculation()
      }
    ];
    
    const results = [];
    
    for (const test of vectorTests) {
      const iterations = 10;
      const times = [];
      
      for (let i = 0; i < iterations; i++) {
        try {
          const startTime = performance.now();
          await test.test();
          const duration = performance.now() - startTime;
          times.push(duration);
        } catch (error) {
          console.warn(`  ⚠️ ${test.name} iteration ${i + 1} failed: ${error.message}`);
        }
      }
      
      if (times.length > 0) {
        results.push({
          name: test.name,
          avgTime: times.reduce((a, b) => a + b, 0) / times.length,
          minTime: Math.min(...times),
          maxTime: Math.max(...times),
          successRate: (times.length / iterations) * 100
        });
        
        console.log(`  ${test.name}: ${results[results.length - 1].avgTime.toFixed(2)}ms avg`);
      }
    }
    
    this.results.vector = {
      tests: results
    };
  }

  /**
   * 💾 Test disk I/O performance
   */
  async testDiskIO() {
    const testFile = path.join(__dirname, 'temp-io-test.txt');
    const testData = 'x'.repeat(1024 * 1024); // 1MB test data
    
    try {
      // Write test
      const writeStart = performance.now();
      await fs.writeFile(testFile, testData);
      const writeTime = performance.now() - writeStart;
      
      // Read test
      const readStart = performance.now();
      await fs.readFile(testFile);
      const readTime = performance.now() - readStart;
      
      // Cleanup
      await fs.unlink(testFile);
      
      return {
        writeTime,
        readTime,
        writeSpeed: (1024 / writeTime) * 1000, // KB/s
        readSpeed: (1024 / readTime) * 1000 // KB/s
      };
    } catch (error) {
      return {
        error: error.message
      };
    }
  }

  /**
   * 🔗 Test database connection pool
   */
  async testDatabaseConnectionPool() {
    const concurrentQueries = 20;
    const promises = [];
    
    const startTime = performance.now();
    
    for (let i = 0; i < concurrentQueries; i++) {
      promises.push(prisma.user.count());
    }
    
    try {
      await Promise.all(promises);
      const duration = performance.now() - startTime;
      
      return {
        concurrentQueries,
        totalTime: duration,
        avgTimePerQuery: duration / concurrentQueries,
        queriesPerSecond: (concurrentQueries / duration) * 1000
      };
    } catch (error) {
      return {
        error: error.message
      };
    }
  }

  /**
   * 📈 Test API throughput
   */
  async testAPIThroughput() {
    const concurrentRequests = 50;
    const endpoint = '/api/health';
    
    const promises = [];
    const startTime = performance.now();
    
    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(fetch(`${this.baseUrl}${endpoint}`));
    }
    
    try {
      const responses = await Promise.all(promises);
      const duration = performance.now() - startTime;
      const successful = responses.filter(r => r.ok).length;
      
      return {
        concurrentRequests,
        successful,
        failed: concurrentRequests - successful,
        totalTime: duration,
        requestsPerSecond: (successful / duration) * 1000,
        successRate: (successful / concurrentRequests) * 100
      };
    } catch (error) {
      return {
        error: error.message
      };
    }
  }

  /**
   * 💬 Test AI chat performance
   */
  async testAIChat(agentId, message) {
    const startTime = performance.now();
    
    const response = await fetch(`${this.baseUrl}/api/agents/${agentId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    
    const responseTime = performance.now() - startTime;
    
    if (!response.ok) {
      throw new Error(`Chat API failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      responseTime,
      tokens: data.usage?.tokens || 0,
      cost: data.usage?.cost || 0
    };
  }

  /**
   * 🧠 Test RAG chat performance
   */
  async testRAGChat(agentId, message) {
    const startTime = performance.now();
    
    const response = await fetch(`${this.baseUrl}/api/agents/${agentId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message,
        useAdvancedRAG: true
      })
    });
    
    const responseTime = performance.now() - startTime;
    
    if (!response.ok) {
      throw new Error(`RAG Chat API failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      responseTime,
      tokens: data.usage?.tokens || 0,
      ragEnabled: data.rag?.enabled || false,
      hasContext: data.rag?.hasContext || false,
      sources: data.rag?.sources || 0
    };
  }

  /**
   * 🔍 Test vector search performance
   */
  async testVectorSearch(query) {
    const response = await fetch(`${this.baseUrl}/api/knowledge/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit: 10 })
    });
    
    if (!response.ok) {
      throw new Error(`Vector search failed: ${response.status}`);
    }
    
    return await response.json();
  }

  /**
   * 🧮 Calculate percentile
   */
  calculatePercentile(values, percentile) {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  /**
   * 👤 Create test user
   */
  async createTestUser() {
    return await prisma.user.create({
      data: {
        email: `perf-test-${Date.now()}@example.com`,
        name: 'Performance Test User',
        role: 'USER',
        plan: 'PRO'
      }
    });
  }

  /**
   * 🤖 Create test agent
   */
  async createTestAgent(userId) {
    return await prisma.agent.create({
      data: {
        name: 'Performance Test Agent',
        description: 'Agent for performance testing',
        prompt: 'You are a helpful AI assistant for performance testing.',
        model: 'gpt-4o-mini',
        userId,
        enableRAG: true,
        enableAutoLearning: true
      }
    });
  }

  /**
   * 🧹 Cleanup test data
   */
  async cleanupTestData(userId) {
    await prisma.message.deleteMany({
      where: { conversation: { userId } }
    });
    
    await prisma.conversation.deleteMany({
      where: { userId }
    });
    
    await prisma.agent.deleteMany({
      where: { userId }
    });
    
    await prisma.user.delete({
      where: { id: userId }
    });
  }

  /**
   * 📋 Generate performance report
   */
  async generatePerformanceReport() {
    console.log('\n📋 Generating Performance Report...');
    
    // Generate recommendations
    this.generateRecommendations();
    
    const report = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      results: this.results
    };
    
    // Save report
    const reportPath = path.join(__dirname, '..', 'test-reports', `day30-performance-${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`✅ Performance report saved to: ${reportPath}`);
    
    // Print summary
    this.printPerformanceSummary();
  }

  /**
   * 💡 Generate performance recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    
    // Memory recommendations
    if (this.results.system?.memory?.usagePercent > 80) {
      recommendations.push({
        category: 'Memory',
        priority: 'HIGH',
        issue: 'High memory usage detected',
        recommendation: 'Consider increasing memory or optimizing memory usage'
      });
    }
    
    // API performance recommendations
    const apiResults = this.results.api?.endpoints || [];
    const slowEndpoints = apiResults.filter(e => e.avgResponseTime > 1000);
    
    if (slowEndpoints.length > 0) {
      recommendations.push({
        category: 'API Performance',
        priority: 'MEDIUM',
        issue: `${slowEndpoints.length} endpoints have slow response times`,
        recommendation: 'Optimize slow endpoints, implement caching, review database queries'
      });
    }
    
    // Database recommendations
    const dbResults = this.results.database?.tests || [];
    const slowQueries = dbResults.filter(q => q.avgTime > 500);
    
    if (slowQueries.length > 0) {
      recommendations.push({
        category: 'Database',
        priority: 'HIGH',
        issue: `${slowQueries.length} database queries are slow`,
        recommendation: 'Add database indexes, optimize queries, consider query caching'
      });
    }
    
    this.results.recommendations = recommendations;
  }

  /**
   * 📊 Print performance summary
   */
  printPerformanceSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 PERFORMANCE BENCHMARK SUMMARY');
    console.log('='.repeat(60));
    
    // System summary
    if (this.results.system) {
      console.log(`\n💻 System Resources:`);
      console.log(`  Memory Usage: ${this.results.system.memory.usagePercent.toFixed(1)}%`);
      console.log(`  Load Average: ${this.results.system.load.current.toFixed(2)}`);
    }
    
    // API summary
    if (this.results.api?.endpoints) {
      console.log(`\n🌐 API Performance:`);
      const avgResponseTime = this.results.api.endpoints
        .reduce((sum, e) => sum + e.avgResponseTime, 0) / this.results.api.endpoints.length;
      console.log(`  Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    }
    
    // Database summary
    if (this.results.database?.tests) {
      console.log(`\n🗄️ Database Performance:`);
      const avgQueryTime = this.results.database.tests
        .reduce((sum, t) => sum + t.avgTime, 0) / this.results.database.tests.length;
      console.log(`  Average Query Time: ${avgQueryTime.toFixed(2)}ms`);
    }
    
    // Recommendations
    if (this.results.recommendations?.length > 0) {
      console.log(`\n💡 Recommendations:`);
      this.results.recommendations.forEach(rec => {
        console.log(`  ${rec.priority}: ${rec.issue}`);
      });
    }
  }
}

// Run performance benchmark if called directly
if (require.main === module) {
  const benchmarker = new PerformanceBenchmarker();
  benchmarker.runBenchmark()
    .then(() => {
      console.log('\n🎯 Performance benchmarking completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Performance benchmarking failed:', error);
      process.exit(1);
    });
}

module.exports = { PerformanceBenchmarker }; 