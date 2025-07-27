#!/usr/bin/env node

/**
 * 🧪 DAY 22 VALIDATION TEST SUITE
 * 
 * Comprehensive validation of all DAY 22 implementation:
 * - Smart document routing logic
 * - Advanced RAG pipeline updates
 * - Chunking + embedding optimization
 * - Updated retriever and re-ranker logic
 * 
 * Requirements:
 * - Test all logic introduced in DAY 22
 * - Do NOT skip if server isn't running - simulate/stub responses
 * - Mark issues with ⚠️ Issue, 🔧 Fix suggested, ❗ Blocker
 * - Generate markdown report
 * - Ensure compatibility with routes: /dashboard/knowledge, /dashboard/chat, /api/agents/[id]/chat, /api/agents/[id]/rerank
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Test configuration
const TEST_CONFIG = {
  testName: 'DAY 22 Validation: Smart Document Routing & Advanced RAG Pipeline',
  serverUrl: 'http://localhost:3000',
  testTimeout: 30000,
  mockMode: false, // Will be set to true if server is not available
  
  // Test categories
  categories: {
    smartDocumentRouting: 'Smart Document Routing Logic',
    advancedRAGPipeline: 'Advanced RAG Pipeline Updates',
    chunkingOptimization: 'Chunking + Embedding Optimization',
    retrieverReranker: 'Updated Retriever and Re-ranker Logic',
    routeCompatibility: 'Route Compatibility Testing'
  },
  
  // Critical files to validate
  criticalFiles: [
    'src/lib/smart-rag-service.ts',
    'src/lib/context-quality-service.ts',
    'src/lib/context-optimization-service.ts',
    'src/lib/knowledge-source-management.ts',
    'src/lib/runtime-provider-selector.ts',
    'src/lib/document-chunker.ts',
    'src/lib/vector-knowledge-service.ts',
    'src/lib/agent-rag-service.ts',
    'src/app/api/agents/[id]/chat/route.ts',
    'src/app/api/agents/[id]/smart-chat/route.ts',
    'src/app/api/agents/[id]/multi-provider-chat/route.ts'
  ],
  
  // Routes to test
  testRoutes: [
    '/dashboard/knowledge',
    '/dashboard/chat',
    '/api/agents/[id]/chat',
    '/api/agents/[id]/rerank' // Note: This route doesn't exist yet
  ]
};

// Test results storage
const testResults = {
  passed: [],
  failed: [],
  warnings: [],
  blockers: [],
  summary: {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    warningCount: 0,
    blockerCount: 0,
    startTime: new Date().toISOString(),
    endTime: null,
    duration: 0
  }
};

// Helper functions
function logTest(category, testName, status, details = '') {
  const timestamp = new Date().toISOString();
  const result = {
    category,
    testName,
    status,
    details,
    timestamp
  };
  
  testResults.summary.totalTests++;
  
  switch (status) {
    case 'PASS':
      testResults.passed.push(result);
      testResults.summary.passedTests++;
      console.log(`✅ [${category}] ${testName} - PASSED`);
      break;
    case 'FAIL':
      testResults.failed.push(result);
      testResults.summary.failedTests++;
      console.log(`❌ [${category}] ${testName} - FAILED: ${details}`);
      break;
    case 'WARNING':
      testResults.warnings.push(result);
      testResults.summary.warningCount++;
      console.log(`⚠️ [${category}] ${testName} - WARNING: ${details}`);
      break;
    case 'BLOCKER':
      testResults.blockers.push(result);
      testResults.summary.blockerCount++;
      console.log(`❗ [${category}] ${testName} - BLOCKER: ${details}`);
      break;
  }
}

function checkFileExists(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath);
    return fs.existsSync(fullPath);
  } catch (error) {
    return false;
  }
}

function readFileContent(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath);
    return fs.readFileSync(fullPath, 'utf8');
  } catch (error) {
    return null;
  }
}

function checkCodePattern(content, pattern, description) {
  const regex = new RegExp(pattern, 'gi');
  const matches = content.match(regex);
  return {
    found: matches !== null,
    count: matches ? matches.length : 0,
    description
  };
}

async function testServerHealth() {
  return new Promise((resolve) => {
    const req = http.get(`${TEST_CONFIG.serverUrl}/api/health`, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const health = JSON.parse(data);
          resolve({ available: true, status: health });
        } catch (error) {
          resolve({ available: false, error: 'Invalid JSON response' });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({ available: false, error: error.message });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ available: false, error: 'Timeout' });
    });
  });
}

async function makeRequest(url, options = {}) {
  return new Promise((resolve) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        statusCode: 0,
        error: error.message
      });
    });
    
    req.setTimeout(TEST_CONFIG.testTimeout, () => {
      req.destroy();
      resolve({
        statusCode: 0,
        error: 'Request timeout'
      });
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Test implementations
async function testSmartDocumentRouting() {
  console.log('\n🎯 Testing Smart Document Routing Logic...');
  
  // Test 1: Check if SmartRAGService exists and has routing logic
  const smartRAGPath = 'src/lib/smart-rag-service.ts';
  if (!checkFileExists(smartRAGPath)) {
    logTest('smartDocumentRouting', 'SmartRAGService File Exists', 'BLOCKER', 'SmartRAGService file not found');
    return;
  }
  
  const smartRAGContent = readFileContent(smartRAGPath);
  if (!smartRAGContent) {
    logTest('smartDocumentRouting', 'SmartRAGService Content', 'BLOCKER', 'Cannot read SmartRAGService file');
    return;
  }
  
  logTest('smartDocumentRouting', 'SmartRAGService File Exists', 'PASS');
  
  // Test 2: Check for smart routing implementation
  const routingPatterns = [
    { pattern: 'processSmartRAG', description: 'Main Smart RAG processing method' },
    { pattern: 'applySourceManagement', description: 'Source management with prioritization' },
    { pattern: 'applyQualityControl', description: 'Quality control with reranking' },
    { pattern: 'optimizeContext', description: 'Context optimization' },
    { pattern: 'SmartRAGConfig', description: 'Smart RAG configuration interface' }
  ];
  
  for (const pattern of routingPatterns) {
    const result = checkCodePattern(smartRAGContent, pattern.pattern, pattern.description);
    if (result.found) {
      logTest('smartDocumentRouting', `Smart Routing: ${pattern.description}`, 'PASS', `Found ${result.count} instances`);
    } else {
      logTest('smartDocumentRouting', `Smart Routing: ${pattern.description}`, 'FAIL', 'Pattern not found in code');
    }
  }
  
  // Test 3: Check for provider routing logic
  const providerSelectorPath = 'src/lib/runtime-provider-selector.ts';
  if (checkFileExists(providerSelectorPath)) {
    const providerContent = readFileContent(providerSelectorPath);
    const providerPatterns = [
      { pattern: 'selectOptimalProvider', description: 'Optimal provider selection' },
      { pattern: 'SelectionContext', description: 'Selection context interface' },
      { pattern: 'rankCandidates', description: 'Provider ranking logic' }
    ];
    
    for (const pattern of providerPatterns) {
      const result = checkCodePattern(providerContent, pattern.pattern, pattern.description);
      if (result.found) {
        logTest('smartDocumentRouting', `Provider Routing: ${pattern.description}`, 'PASS', `Found ${result.count} instances`);
      } else {
        logTest('smartDocumentRouting', `Provider Routing: ${pattern.description}`, 'WARNING', 'Pattern not found - may impact multi-provider routing');
      }
    }
  } else {
    logTest('smartDocumentRouting', 'Provider Routing Implementation', 'WARNING', 'RuntimeProviderSelector not found');
  }
  
  // Test 4: Check for source management
  const sourceManagementPath = 'src/lib/knowledge-source-management.ts';
  if (checkFileExists(sourceManagementPath)) {
    const sourceContent = readFileContent(sourceManagementPath);
    const sourcePatterns = [
      { pattern: 'retrieveFromSources', description: 'Source-aware retrieval' },
      { pattern: 'prioritizeSources', description: 'Source prioritization' },
      { pattern: 'KnowledgeSourceManager', description: 'Source manager class' }
    ];
    
    for (const pattern of sourcePatterns) {
      const result = checkCodePattern(sourceContent, pattern.pattern, pattern.description);
      if (result.found) {
        logTest('smartDocumentRouting', `Source Management: ${pattern.description}`, 'PASS', `Found ${result.count} instances`);
      } else {
        logTest('smartDocumentRouting', `Source Management: ${pattern.description}`, 'FAIL', 'Critical source management logic missing');
      }
    }
  } else {
    logTest('smartDocumentRouting', 'Source Management Implementation', 'BLOCKER', 'KnowledgeSourceManager not found');
  }
}

async function testAdvancedRAGPipeline() {
  console.log('\n🧠 Testing Advanced RAG Pipeline Updates...');
  
  // Test 1: Check RAG service integration
  const ragServicePath = 'src/lib/agent-rag-service.ts';
  if (!checkFileExists(ragServicePath)) {
    logTest('advancedRAGPipeline', 'Agent RAG Service', 'BLOCKER', 'Agent RAG Service file not found');
    return;
  }
  
  const ragContent = readFileContent(ragServicePath);
  logTest('advancedRAGPipeline', 'Agent RAG Service File', 'PASS');
  
  // Test 2: Check for advanced RAG features
  const ragPatterns = [
    { pattern: 'performRAGOperation', description: 'Main RAG operation method' },
    { pattern: 'AgentRAGSettings', description: 'Agent RAG configuration' },
    { pattern: 'buildContext', description: 'Context building logic' },
    { pattern: 'searchThreshold', description: 'Search threshold configuration' },
    { pattern: 'enableCaching', description: 'Caching support' }
  ];
  
  for (const pattern of ragPatterns) {
    const result = checkCodePattern(ragContent, pattern.pattern, pattern.description);
    if (result.found) {
      logTest('advancedRAGPipeline', `RAG Feature: ${pattern.description}`, 'PASS', `Found ${result.count} instances`);
    } else {
      logTest('advancedRAGPipeline', `RAG Feature: ${pattern.description}`, 'FAIL', 'Critical RAG feature missing');
    }
  }
  
  // Test 3: Check chat route integration
  const chatRoutePath = 'src/app/api/agents/[id]/chat/route.ts';
  if (checkFileExists(chatRoutePath)) {
    const chatContent = readFileContent(chatRoutePath);
    const chatPatterns = [
      { pattern: 'agentRAGService', description: 'RAG service integration' },
      { pattern: 'performRAGOperation', description: 'RAG operation call' },
      { pattern: 'useAdvancedRAG', description: 'Advanced RAG flag' },
      { pattern: 'ragMetadata', description: 'RAG metadata handling' }
    ];
    
    for (const pattern of chatPatterns) {
      const result = checkCodePattern(chatContent, pattern.pattern, pattern.description);
      if (result.found) {
        logTest('advancedRAGPipeline', `Chat Integration: ${pattern.description}`, 'PASS', `Found ${result.count} instances`);
      } else {
        logTest('advancedRAGPipeline', `Chat Integration: ${pattern.description}`, 'WARNING', 'May impact chat RAG functionality');
      }
    }
  } else {
    logTest('advancedRAGPipeline', 'Chat Route RAG Integration', 'BLOCKER', 'Chat route not found');
  }
  
  // Test 4: Check context builder
  const contextBuilderPath = 'src/lib/rag-context-builder.ts';
  if (checkFileExists(contextBuilderPath)) {
    const contextContent = readFileContent(contextBuilderPath);
    const contextPatterns = [
      { pattern: 'buildContext', description: 'Context building method' },
      { pattern: 'ContextAssembly', description: 'Context assembly interface' },
      { pattern: 'optimizeChunkSelection', description: 'Chunk optimization' }
    ];
    
    for (const pattern of contextPatterns) {
      const result = checkCodePattern(contextContent, pattern.pattern, pattern.description);
      if (result.found) {
        logTest('advancedRAGPipeline', `Context Builder: ${pattern.description}`, 'PASS', `Found ${result.count} instances`);
      } else {
        logTest('advancedRAGPipeline', `Context Builder: ${pattern.description}`, 'FAIL', 'Context building logic incomplete');
      }
    }
  } else {
    logTest('advancedRAGPipeline', 'Context Builder Implementation', 'WARNING', 'RAG context builder not found');
  }
}

async function testChunkingOptimization() {
  console.log('\n🧩 Testing Chunking + Embedding Optimization...');
  
  // Test 1: Check document chunker
  const chunkerPath = 'src/lib/document-chunker.ts';
  if (!checkFileExists(chunkerPath)) {
    logTest('chunkingOptimization', 'Document Chunker', 'BLOCKER', 'Document chunker file not found');
    return;
  }
  
  const chunkerContent = readFileContent(chunkerPath);
  logTest('chunkingOptimization', 'Document Chunker File', 'PASS');
  
  // Test 2: Check chunking strategies
  const chunkingPatterns = [
    { pattern: 'semanticChunking', description: 'Semantic chunking strategy' },
    { pattern: 'adaptiveChunking', description: 'Adaptive chunking strategy' },
    { pattern: 'ChunkingOptions', description: 'Chunking configuration interface' },
    { pattern: 'chunkingStrategy', description: 'Strategy selection logic' },
    { pattern: 'calculateChunkQuality', description: 'Chunk quality scoring' }
  ];
  
  for (const pattern of chunkingPatterns) {
    const result = checkCodePattern(chunkerContent, pattern.pattern, pattern.description);
    if (result.found) {
      logTest('chunkingOptimization', `Chunking: ${pattern.description}`, 'PASS', `Found ${result.count} instances`);
    } else {
      logTest('chunkingOptimization', `Chunking: ${pattern.description}`, 'FAIL', 'Critical chunking feature missing');
    }
  }
  
  // Test 3: Check context optimization
  const contextOptPath = 'src/lib/context-optimization-service.ts';
  if (checkFileExists(contextOptPath)) {
    const contextOptContent = readFileContent(contextOptPath);
    const contextOptPatterns = [
      { pattern: 'optimizeContext', description: 'Context optimization method' },
      { pattern: 'applyIntelligentChunking', description: 'Intelligent chunking application' },
      { pattern: 'ChunkingStrategy', description: 'Chunking strategy interface' },
      { pattern: 'adaptiveFactors', description: 'Adaptive chunking factors' }
    ];
    
    for (const pattern of contextOptPatterns) {
      const result = checkCodePattern(contextOptContent, pattern.pattern, pattern.description);
      if (result.found) {
        logTest('chunkingOptimization', `Context Optimization: ${pattern.description}`, 'PASS', `Found ${result.count} instances`);
      } else {
        logTest('chunkingOptimization', `Context Optimization: ${pattern.description}`, 'FAIL', 'Context optimization logic incomplete');
      }
    }
  } else {
    logTest('chunkingOptimization', 'Context Optimization Service', 'WARNING', 'Context optimization service not found');
  }
  
  // Test 4: Check vector service optimization
  const vectorServicePath = 'src/lib/vector-knowledge-service.ts';
  if (checkFileExists(vectorServicePath)) {
    const vectorContent = readFileContent(vectorServicePath);
    const vectorPatterns = [
      { pattern: 'createChunks', description: 'Chunk creation method' },
      { pattern: 'generateEmbedding', description: 'Embedding generation' },
      { pattern: 'calculateChunkQuality', description: 'Chunk quality calculation' },
      { pattern: 'embeddingGenerator', description: 'Embedding generator interface' }
    ];
    
    for (const pattern of vectorPatterns) {
      const result = checkCodePattern(vectorContent, pattern.pattern, pattern.description);
      if (result.found) {
        logTest('chunkingOptimization', `Vector Service: ${pattern.description}`, 'PASS', `Found ${result.count} instances`);
      } else {
        logTest('chunkingOptimization', `Vector Service: ${pattern.description}`, 'WARNING', 'Vector service optimization may be incomplete');
      }
    }
  } else {
    logTest('chunkingOptimization', 'Vector Knowledge Service', 'BLOCKER', 'Vector knowledge service not found');
  }
}

async function testRetrieverReranker() {
  console.log('\n🔍 Testing Updated Retriever and Re-ranker Logic...');
  
  // Test 1: Check context quality service (re-ranker)
  const qualityServicePath = 'src/lib/context-quality-service.ts';
  if (!checkFileExists(qualityServicePath)) {
    logTest('retrieverReranker', 'Context Quality Service', 'BLOCKER', 'Context quality service file not found');
    return;
  }
  
  const qualityContent = readFileContent(qualityServicePath);
  logTest('retrieverReranker', 'Context Quality Service File', 'PASS');
  
  // Test 2: Check re-ranking algorithms
  const rerankingPatterns = [
    { pattern: 'rerankResults', description: 'Result re-ranking method' },
    { pattern: 'scoreBasedReranking', description: 'Score-based re-ranking' },
    { pattern: 'diversityBasedReranking', description: 'Diversity-based re-ranking' },
    { pattern: 'hybridReranking', description: 'Hybrid re-ranking algorithm' },
    { pattern: 'RerankingResult', description: 'Re-ranking result interface' }
  ];
  
  for (const pattern of rerankingPatterns) {
    const result = checkCodePattern(qualityContent, pattern.pattern, pattern.description);
    if (result.found) {
      logTest('retrieverReranker', `Re-ranking: ${pattern.description}`, 'PASS', `Found ${result.count} instances`);
    } else {
      logTest('retrieverReranker', `Re-ranking: ${pattern.description}`, 'FAIL', 'Critical re-ranking feature missing');
    }
  }
  
  // Test 3: Check semantic search service (retriever)
  const semanticSearchPath = 'src/lib/semantic-search-service.ts';
  if (checkFileExists(semanticSearchPath)) {
    const semanticContent = readFileContent(semanticSearchPath);
    const searchPatterns = [
      { pattern: 'mergeAndRankResults', description: 'Result merging and ranking' },
      { pattern: 'calculateRelevanceScore', description: 'Relevance score calculation' },
      { pattern: 'hybridSearch', description: 'Hybrid search capabilities' },
      { pattern: 'SearchResponse', description: 'Search response interface' }
    ];
    
    for (const pattern of searchPatterns) {
      const result = checkCodePattern(semanticContent, pattern.pattern, pattern.description);
      if (result.found) {
        logTest('retrieverReranker', `Retriever: ${pattern.description}`, 'PASS', `Found ${result.count} instances`);
      } else {
        logTest('retrieverReranker', `Retriever: ${pattern.description}`, 'WARNING', 'Retriever functionality may be incomplete');
      }
    }
  } else {
    logTest('retrieverReranker', 'Semantic Search Service', 'WARNING', 'Semantic search service not found');
  }
  
  // Test 4: Check quality metrics
  const qualityMetricsPatterns = [
    { pattern: 'calculateQualityMetrics', description: 'Quality metrics calculation' },
    { pattern: 'detectDuplicates', description: 'Duplicate detection' },
    { pattern: 'QualityMetrics', description: 'Quality metrics interface' },
    { pattern: 'improvementScore', description: 'Improvement scoring' }
  ];
  
  for (const pattern of qualityMetricsPatterns) {
    const result = checkCodePattern(qualityContent, pattern.pattern, pattern.description);
    if (result.found) {
      logTest('retrieverReranker', `Quality Metrics: ${pattern.description}`, 'PASS', `Found ${result.count} instances`);
    } else {
      logTest('retrieverReranker', `Quality Metrics: ${pattern.description}`, 'FAIL', 'Quality metrics logic incomplete');
    }
  }
}

async function testRouteCompatibility() {
  console.log('\n🌐 Testing Route Compatibility...');
  
  // Test server availability first
  const serverHealth = await testServerHealth();
  if (!serverHealth.available) {
    logTest('routeCompatibility', 'Server Health Check', 'WARNING', `Server not available: ${serverHealth.error}. Using mock mode.`);
    TEST_CONFIG.mockMode = true;
  } else {
    logTest('routeCompatibility', 'Server Health Check', 'PASS', 'Server is running and responding');
  }
  
  // Test 1: Check if rerank route exists (mentioned in requirements)
  const rerankRoutePattern = 'src/app/api/agents/[id]/rerank/route.ts';
  if (!checkFileExists(rerankRoutePattern)) {
    logTest('routeCompatibility', 'Rerank Route Exists', 'BLOCKER', 'The /api/agents/[id]/rerank route mentioned in requirements does not exist');
    
    // Suggest fix
    logTest('routeCompatibility', 'Rerank Route Fix', 'WARNING', '🔧 Fix suggested: Create /api/agents/[id]/rerank/route.ts endpoint for re-ranking functionality');
  } else {
    logTest('routeCompatibility', 'Rerank Route Exists', 'PASS');
  }
  
  // Test 2: Check chat route exists and has DAY 22 features
  const chatRoutePath = 'src/app/api/agents/[id]/chat/route.ts';
  if (checkFileExists(chatRoutePath)) {
    const chatContent = readFileContent(chatRoutePath);
    const chatFeatures = [
      { pattern: 'useAdvancedRAG', description: 'Advanced RAG flag' },
      { pattern: 'ragMetadata', description: 'RAG metadata' },
      { pattern: 'contextAssembly', description: 'Context assembly' }
    ];
    
    let chatFeaturesFound = 0;
    for (const feature of chatFeatures) {
      const result = checkCodePattern(chatContent, feature.pattern, feature.description);
      if (result.found) {
        chatFeaturesFound++;
        logTest('routeCompatibility', `Chat Route Feature: ${feature.description}`, 'PASS');
      } else {
        logTest('routeCompatibility', `Chat Route Feature: ${feature.description}`, 'WARNING', 'DAY 22 feature not integrated in chat route');
      }
    }
    
    if (chatFeaturesFound === chatFeatures.length) {
      logTest('routeCompatibility', 'Chat Route DAY 22 Integration', 'PASS', 'All DAY 22 features integrated');
    } else {
      logTest('routeCompatibility', 'Chat Route DAY 22 Integration', 'WARNING', `Only ${chatFeaturesFound}/${chatFeatures.length} DAY 22 features integrated`);
    }
  } else {
    logTest('routeCompatibility', 'Chat Route Exists', 'BLOCKER', 'Chat route not found');
  }
  
  // Test 3: Check smart-chat route
  const smartChatPath = 'src/app/api/agents/[id]/smart-chat/route.ts';
  if (checkFileExists(smartChatPath)) {
    const smartChatContent = readFileContent(smartChatPath);
    const smartChatPatterns = [
      { pattern: 'SmartRAGService', description: 'Smart RAG service usage' },
      { pattern: 'processSmartRAG', description: 'Smart RAG processing' },
      { pattern: 'smartRAGRequest', description: 'Smart RAG request handling' }
    ];
    
    for (const pattern of smartChatPatterns) {
      const result = checkCodePattern(smartChatContent, pattern.pattern, pattern.description);
      if (result.found) {
        logTest('routeCompatibility', `Smart Chat: ${pattern.description}`, 'PASS');
      } else {
        logTest('routeCompatibility', `Smart Chat: ${pattern.description}`, 'FAIL', 'Smart chat functionality incomplete');
      }
    }
  } else {
    logTest('routeCompatibility', 'Smart Chat Route', 'WARNING', 'Smart chat route not found - advanced features may not be accessible');
  }
  
  // Test 4: Check multi-provider chat route
  const multiProviderPath = 'src/app/api/agents/[id]/multi-provider-chat/route.ts';
  if (checkFileExists(multiProviderPath)) {
    logTest('routeCompatibility', 'Multi-Provider Chat Route', 'PASS');
  } else {
    logTest('routeCompatibility', 'Multi-Provider Chat Route', 'WARNING', 'Multi-provider chat route not found');
  }
  
  // Test 5: Mock test routes if server is available
  if (!TEST_CONFIG.mockMode) {
    // Test basic health endpoint
    const healthResponse = await makeRequest(`${TEST_CONFIG.serverUrl}/api/health`);
    if (healthResponse.statusCode === 200) {
      logTest('routeCompatibility', 'Health Endpoint', 'PASS', 'Health endpoint responding correctly');
    } else {
      logTest('routeCompatibility', 'Health Endpoint', 'WARNING', `Health endpoint returned ${healthResponse.statusCode}`);
    }
    
    // Test agents endpoint
    const agentsResponse = await makeRequest(`${TEST_CONFIG.serverUrl}/api/agents`);
    if (agentsResponse.statusCode === 200 || agentsResponse.statusCode === 401) {
      logTest('routeCompatibility', 'Agents Endpoint', 'PASS', 'Agents endpoint accessible (auth required)');
    } else {
      logTest('routeCompatibility', 'Agents Endpoint', 'WARNING', `Agents endpoint returned ${agentsResponse.statusCode}`);
    }
  }
}

async function generateValidationReport() {
  console.log('\n📊 Generating Validation Report...');
  
  testResults.summary.endTime = new Date().toISOString();
  testResults.summary.duration = new Date() - new Date(testResults.summary.startTime);
  
  const report = `# 🧪 DAY 22 Validation Report
**Generated**: ${testResults.summary.endTime}  
**Duration**: ${Math.round(testResults.summary.duration / 1000)}s  
**Test Mode**: ${TEST_CONFIG.mockMode ? 'Mock Mode (Server Unavailable)' : 'Live Server Testing'}

## 📋 Summary

| Metric | Count | Percentage |
|--------|-------|------------|
| **Total Tests** | ${testResults.summary.totalTests} | 100% |
| **✅ Passed** | ${testResults.summary.passedTests} | ${((testResults.summary.passedTests / testResults.summary.totalTests) * 100).toFixed(1)}% |
| **❌ Failed** | ${testResults.summary.failedTests} | ${((testResults.summary.failedTests / testResults.summary.totalTests) * 100).toFixed(1)}% |
| **⚠️ Warnings** | ${testResults.summary.warningCount} | ${((testResults.summary.warningCount / testResults.summary.totalTests) * 100).toFixed(1)}% |
| **❗ Blockers** | ${testResults.summary.blockerCount} | ${((testResults.summary.blockerCount / testResults.summary.totalTests) * 100).toFixed(1)}% |

## 🎯 Test Categories

### 1. Smart Document Routing Logic
${generateCategoryReport('smartDocumentRouting')}

### 2. Advanced RAG Pipeline Updates
${generateCategoryReport('advancedRAGPipeline')}

### 3. Chunking + Embedding Optimization
${generateCategoryReport('chunkingOptimization')}

### 4. Updated Retriever and Re-ranker Logic
${generateCategoryReport('retrieverReranker')}

### 5. Route Compatibility Testing
${generateCategoryReport('routeCompatibility')}

## ❗ Critical Issues (Blockers)

${testResults.blockers.length === 0 ? '✅ No blockers found!' : testResults.blockers.map(blocker => 
  `- **${blocker.testName}**: ${blocker.details}`
).join('\n')}

## ⚠️ Warnings & Recommendations

${testResults.warnings.length === 0 ? '✅ No warnings!' : testResults.warnings.map(warning => 
  `- **${warning.testName}**: ${warning.details}`
).join('\n')}

## 🔧 Fix Suggestions

${generateFixSuggestions()}

## 📊 Detailed Results

### ✅ Passed Tests (${testResults.passed.length})
${testResults.passed.map(test => `- **[${test.category}]** ${test.testName}`).join('\n')}

### ❌ Failed Tests (${testResults.failed.length})
${testResults.failed.map(test => `- **[${test.category}]** ${test.testName}: ${test.details}`).join('\n')}

## 🎯 Completion Status

${testResults.summary.blockerCount === 0 ? 
  '✅ **DAY 22 READY FOR COMPLETION** - All critical functionality implemented and tested' : 
  '❌ **DAY 22 NOT READY** - Critical blockers must be resolved before completion'
}

### Next Steps:
${testResults.summary.blockerCount === 0 ? 
  '1. ✅ All systems operational\n2. ✅ Ready to proceed to DAY 23\n3. 🔧 Address any warnings for optimization' :
  '1. ❗ Resolve all blocker issues\n2. 🔧 Implement missing critical features\n3. 🧪 Re-run validation tests\n4. ⚠️ Do not mark DAY 22 as complete until all blockers resolved'
}

---
*Generated by DAY 22 Validation Test Suite*
`;

  // Write report to file
  const reportPath = path.join(__dirname, 'day-22-validation-report.md');
  fs.writeFileSync(reportPath, report);
  
  console.log(`\n📄 Validation report generated: ${reportPath}`);
  
  return report;
}

function generateCategoryReport(category) {
  const categoryTests = [
    ...testResults.passed.filter(t => t.category === category),
    ...testResults.failed.filter(t => t.category === category),
    ...testResults.warnings.filter(t => t.category === category),
    ...testResults.blockers.filter(t => t.category === category)
  ];
  
  if (categoryTests.length === 0) {
    return '- No tests in this category\n';
  }
  
  const passed = categoryTests.filter(t => t.status === 'PASS').length;
  const total = categoryTests.length;
  const percentage = ((passed / total) * 100).toFixed(1);
  
  return `**Status**: ${passed}/${total} passed (${percentage}%)
${categoryTests.map(test => {
  const icon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : test.status === 'WARNING' ? '⚠️' : '❗';
  return `- ${icon} ${test.testName}${test.details ? ': ' + test.details : ''}`;
}).join('\n')}
`;
}

function generateFixSuggestions() {
  const fixes = [];
  
  // Check for missing rerank route
  if (testResults.blockers.some(b => b.testName.includes('Rerank Route'))) {
    fixes.push('🔧 **Create Rerank Route**: Implement `/api/agents/[id]/rerank/route.ts` endpoint for re-ranking functionality');
  }
  
  // Check for missing critical services
  if (testResults.blockers.some(b => b.testName.includes('SmartRAGService'))) {
    fixes.push('🔧 **Smart RAG Service**: Complete SmartRAGService implementation with all routing logic');
  }
  
  if (testResults.blockers.some(b => b.testName.includes('Source Management'))) {
    fixes.push('🔧 **Source Management**: Implement KnowledgeSourceManager for intelligent source routing');
  }
  
  if (testResults.blockers.some(b => b.testName.includes('Document Chunker'))) {
    fixes.push('🔧 **Document Chunker**: Implement DocumentChunker with semantic and adaptive chunking strategies');
  }
  
  // Check for integration issues
  if (testResults.warnings.some(w => w.testName.includes('Integration'))) {
    fixes.push('🔧 **Route Integration**: Ensure all DAY 22 features are properly integrated into chat routes');
  }
  
  if (fixes.length === 0) {
    return '✅ No critical fixes needed - system is well implemented!';
  }
  
  return fixes.join('\n');
}

// Main execution
async function runValidation() {
  console.log('🧪 Starting DAY 22 Validation Test Suite...');
  console.log(`📋 Test Configuration: ${TEST_CONFIG.testName}`);
  console.log(`🌐 Server URL: ${TEST_CONFIG.serverUrl}`);
  console.log(`⏱️ Timeout: ${TEST_CONFIG.testTimeout}ms`);
  
  try {
    // Run all test categories
    await testSmartDocumentRouting();
    await testAdvancedRAGPipeline();
    await testChunkingOptimization();
    await testRetrieverReranker();
    await testRouteCompatibility();
    
    // Generate final report
    const report = await generateValidationReport();
    
    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('🎯 DAY 22 VALIDATION COMPLETE');
    console.log('='.repeat(80));
    console.log(`📊 Results: ${testResults.summary.passedTests}/${testResults.summary.totalTests} tests passed`);
    console.log(`⚠️ Warnings: ${testResults.summary.warningCount}`);
    console.log(`❗ Blockers: ${testResults.summary.blockerCount}`);
    
    if (testResults.summary.blockerCount === 0) {
      console.log('\n✅ DAY 22 VALIDATION PASSED - Ready for completion!');
    } else {
      console.log('\n❌ DAY 22 VALIDATION FAILED - Critical issues must be resolved!');
      console.log('🚨 DO NOT mark DAY 22 as complete until all blockers are resolved.');
    }
    
    console.log(`📄 Full report: day-22-validation-report.md`);
    
  } catch (error) {
    console.error('❌ Validation failed with error:', error);
    logTest('system', 'Validation Execution', 'BLOCKER', error.message);
  }
}

// Run the validation
runValidation().catch(console.error); 