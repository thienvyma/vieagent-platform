#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Day 12.3 Integration Points Validation
const TEST_CONFIG = {
  components: {
    knowledgeGrid: 'src/components/knowledge/KnowledgeGrid.tsx',
    knowledgePage: 'src/app/dashboard/knowledge/page.tsx',
    agentAssignments: 'src/components/knowledge/AgentAssignments.tsx',
    knowledgeAPI: 'src/app/api/knowledge/route.ts',
    agentChatAPI: 'src/app/api/agents/[id]/chat/route.ts',
    knowledgeSearchAPI: 'src/app/api/knowledge/search/route.ts',
    agentRAGService: 'src/lib/agent-rag-service.ts',
    vectorKnowledgeService: 'src/lib/vector-knowledge-service.ts'
  },
  requirements: [
    'RAG system integration with knowledge base',
    'Agent assignment to knowledge items',
    'Knowledge search and retrieval',
    'Analytics and usage tracking',
    'Vector database integration',
    'Real-time status updates',
    'Cross-component communication',
    'Error handling and fallbacks'
  ]
};

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  testName: 'Day 12.3: Integration Points Validation',
  description: 'Validate RAG system, agent assignments, and analytics integration',
  requirements: TEST_CONFIG.requirements,
  components: TEST_CONFIG.components,
  results: {
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      overallScore: 0,
      successRate: 0,
      componentAverage: 0,
      componentScores: {}
    },
    details: [],
    readyForFinalValidation: false,
    requirementsMet: false
  }
};

// Test runner utility
function runTest(testName, testFunction, category = 'general') {
  try {
    const result = testFunction();
    const status = result.passed ? 'PASSED' : 'FAILED';
    
    testResults.results.details.push({
      test: testName,
      status,
      category,
      details: result.details,
      error: result.error || null,
      timestamp: new Date().toISOString()
    });
    
    testResults.results.summary.total++;
    if (result.passed) {
      testResults.results.summary.passed++;
    } else {
      testResults.results.summary.failed++;
    }
    
    console.log(`${status === 'PASSED' ? '✅' : '❌'} ${testName}`);
    if (result.details) console.log(`   ${result.details}`);
    if (result.error) console.log(`   Error: ${result.error}`);
    
    return result;
  } catch (error) {
    console.error(`❌ ${testName} - Exception: ${error.message}`);
    testResults.results.details.push({
      test: testName,
      status: 'FAILED',
      category,
      details: 'Test execution failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    testResults.results.summary.total++;
    testResults.results.summary.failed++;
    
    return { passed: false, error: error.message };
  }
}

// =============================================================================
// RAG SYSTEM INTEGRATION TESTS
// =============================================================================

function testRAGSystemIntegration() {
  const chatAPIPath = path.join(process.cwd(), TEST_CONFIG.components.agentChatAPI);
  const ragServicePath = path.join(process.cwd(), TEST_CONFIG.components.agentRAGService);
  
  let chatExists = fs.existsSync(chatAPIPath);
  let ragExists = fs.existsSync(ragServicePath);
  
  if (!chatExists && !ragExists) {
    return {
      passed: false,
      error: 'RAG system components not found',
      details: 'Missing both chat API and RAG service'
    };
  }
  
  let ragScore = 0;
  let maxScore = 8;
  
  if (chatExists) {
    const chatContent = fs.readFileSync(chatAPIPath, 'utf8');
    
    // Check for RAG integration features
    const hasRAGService = chatContent.includes('agentRAGService') || chatContent.includes('RAG');
    const hasKnowledgeContext = chatContent.includes('knowledgeContext');
    const hasSmartStrategy = chatContent.includes('SmartKnowledgeStrategy');
    const hasVectorSearch = chatContent.includes('vector') || chatContent.includes('search');
    
    ragScore += [hasRAGService, hasKnowledgeContext, hasSmartStrategy, hasVectorSearch].filter(Boolean).length;
  }
  
  if (ragExists) {
    const ragContent = fs.readFileSync(ragServicePath, 'utf8');
    
    // Check for RAG service features
    const hasPerformRAG = ragContent.includes('performRAGOperation');
    const hasContextAssembly = ragContent.includes('contextAssembly');
    const hasRelevanceScoring = ragContent.includes('relevance');
    const hasErrorHandling = ragContent.includes('try') && ragContent.includes('catch');
    
    ragScore += [hasPerformRAG, hasContextAssembly, hasRelevanceScoring, hasErrorHandling].filter(Boolean).length;
  }
  
  return {
    passed: ragScore >= 6,
    error: ragScore < 6 ? 'RAG system integration incomplete' : null,
    details: `RAG features: ${ragScore}/${maxScore} (chat: ${chatExists}, service: ${ragExists})`
  };
}

function testKnowledgeSearchIntegration() {
  const searchAPIPath = path.join(process.cwd(), TEST_CONFIG.components.knowledgeSearchAPI);
  const vectorServicePath = path.join(process.cwd(), TEST_CONFIG.components.vectorKnowledgeService);
  
  let searchExists = fs.existsSync(searchAPIPath);
  let vectorExists = fs.existsSync(vectorServicePath);
  
  if (!searchExists && !vectorExists) {
    return {
      passed: false,
      error: 'Knowledge search components not found',
      details: 'Missing both search API and vector service'
    };
  }
  
  let searchScore = 0;
  let maxScore = 8;
  
  if (searchExists) {
    const searchContent = fs.readFileSync(searchAPIPath, 'utf8');
    
    // Check for search features
    const hasVectorSearch = searchContent.includes('vectorKnowledgeService');
    const hasSemanticSearch = searchContent.includes('semantic') || searchContent.includes('similarity');
    const hasFiltering = searchContent.includes('filters');
    const hasResultFormatting = searchContent.includes('formattedResults');
    
    searchScore += [hasVectorSearch, hasSemanticSearch, hasFiltering, hasResultFormatting].filter(Boolean).length;
  }
  
  if (vectorExists) {
    const vectorContent = fs.readFileSync(vectorServicePath, 'utf8');
    
    // Check for vector service features
    const hasSearchMethod = vectorContent.includes('searchKnowledge');
    const hasEmbeddings = vectorContent.includes('embedding');
    const hasChromaDB = vectorContent.includes('chroma') || vectorContent.includes('vector');
    const hasCollectionManagement = vectorContent.includes('collection');
    
    searchScore += [hasSearchMethod, hasEmbeddings, hasChromaDB, hasCollectionManagement].filter(Boolean).length;
  }
  
  return {
    passed: searchScore >= 6,
    error: searchScore < 6 ? 'Knowledge search integration incomplete' : null,
    details: `Search features: ${searchScore}/${maxScore} (search: ${searchExists}, vector: ${vectorExists})`
  };
}

// =============================================================================
// AGENT ASSIGNMENT TESTS
// =============================================================================

function testAgentAssignmentIntegration() {
  const assignmentPath = path.join(process.cwd(), TEST_CONFIG.components.agentAssignments);
  const knowledgeGridPath = path.join(process.cwd(), TEST_CONFIG.components.knowledgeGrid);
  
  let assignmentExists = fs.existsSync(assignmentPath);
  let gridExists = fs.existsSync(knowledgeGridPath);
  
  if (!assignmentExists && !gridExists) {
    return {
      passed: false,
      error: 'Agent assignment components not found',
      details: 'Missing both assignment component and grid integration'
    };
  }
  
  let assignmentScore = 0;
  let maxScore = 8;
  
  if (assignmentExists) {
    const assignmentContent = fs.readFileSync(assignmentPath, 'utf8');
    
    // Check for assignment features
    const hasAgentSelection = assignmentContent.includes('selectedAgent');
    const hasPermissions = assignmentContent.includes('permissions');
    const hasPriority = assignmentContent.includes('priority');
    const hasAssignmentAPI = assignmentContent.includes('/api/knowledge/') && assignmentContent.includes('assignments');
    
    assignmentScore += [hasAgentSelection, hasPermissions, hasPriority, hasAssignmentAPI].filter(Boolean).length;
  }
  
  if (gridExists) {
    const gridContent = fs.readFileSync(knowledgeGridPath, 'utf8');
    
    // Check for grid integration
    const hasAssignButton = gridContent.includes('onAssign') || gridContent.includes('🤖');
    const hasAssignHandler = gridContent.includes('handleAssign') || gridContent.includes('assign');
    const hasAgentDisplay = gridContent.includes('agent') || gridContent.includes('Agent');
    const hasAssignmentStatus = gridContent.includes('assignment') || gridContent.includes('assigned');
    
    assignmentScore += [hasAssignButton, hasAssignHandler, hasAgentDisplay, hasAssignmentStatus].filter(Boolean).length;
  }
  
  return {
    passed: assignmentScore >= 6,
    error: assignmentScore < 6 ? 'Agent assignment integration incomplete' : null,
    details: `Assignment features: ${assignmentScore}/${maxScore} (component: ${assignmentExists}, grid: ${gridExists})`
  };
}

// =============================================================================
// ANALYTICS INTEGRATION TESTS
// =============================================================================

function testAnalyticsIntegration() {
  const knowledgeAPIPath = path.join(process.cwd(), TEST_CONFIG.components.knowledgeAPI);
  const exists = fs.existsSync(knowledgeAPIPath);
  
  if (!exists) {
    return {
      passed: false,
      error: 'Knowledge API not found',
      details: 'Cannot test analytics without knowledge API'
    };
  }
  
  const content = fs.readFileSync(knowledgeAPIPath, 'utf8');
  
  // Check for analytics features
  const hasViewTracking = content.includes('viewCount') || content.includes('analytics');
  const hasUsageStats = content.includes('usage') || content.includes('stats');
  const hasEventLogging = content.includes('event') || content.includes('log');
  const hasMetrics = content.includes('metrics') || content.includes('tracking');
  const hasReporting = content.includes('report') || content.includes('analytics');
  const hasTimestamps = content.includes('timestamp') || content.includes('createdAt');
  const hasUserTracking = content.includes('userId') || content.includes('user');
  const hasPerformanceMetrics = content.includes('performance') || content.includes('duration');
  
  const analyticsScore = [
    hasViewTracking, hasUsageStats, hasEventLogging, hasMetrics,
    hasReporting, hasTimestamps, hasUserTracking, hasPerformanceMetrics
  ].filter(Boolean).length;
  
  return {
    passed: analyticsScore >= 6,
    error: analyticsScore < 6 ? 'Analytics integration incomplete' : null,
    details: `Analytics features: ${analyticsScore}/8 (view: ${hasViewTracking}, usage: ${hasUsageStats}, events: ${hasEventLogging}, metrics: ${hasMetrics}, reporting: ${hasReporting}, timestamps: ${hasTimestamps}, user: ${hasUserTracking}, performance: ${hasPerformanceMetrics})`
  };
}

// =============================================================================
// VECTOR DATABASE INTEGRATION TESTS
// =============================================================================

function testVectorDatabaseIntegration() {
  const vectorServicePath = path.join(process.cwd(), TEST_CONFIG.components.vectorKnowledgeService);
  const exists = fs.existsSync(vectorServicePath);
  
  if (!exists) {
    return {
      passed: false,
      error: 'Vector knowledge service not found',
      details: 'Cannot test vector database without service'
    };
  }
  
  const content = fs.readFileSync(vectorServicePath, 'utf8');
  
  // Check for vector database features
  const hasChromaDB = content.includes('chroma') || content.includes('ChromaDB');
  const hasEmbeddings = content.includes('embedding') || content.includes('vector');
  const hasCollections = content.includes('collection') || content.includes('Collection');
  const hasIndexing = content.includes('index') || content.includes('add');
  const hasSearching = content.includes('search') || content.includes('query');
  const hasMetadata = content.includes('metadata');
  const hasFiltering = content.includes('filter') || content.includes('where');
  const hasErrorHandling = content.includes('try') && content.includes('catch');
  
  const vectorScore = [
    hasChromaDB, hasEmbeddings, hasCollections, hasIndexing,
    hasSearching, hasMetadata, hasFiltering, hasErrorHandling
  ].filter(Boolean).length;
  
  return {
    passed: vectorScore >= 6,
    error: vectorScore < 6 ? 'Vector database integration incomplete' : null,
    details: `Vector features: ${vectorScore}/8 (chroma: ${hasChromaDB}, embeddings: ${hasEmbeddings}, collections: ${hasCollections}, indexing: ${hasIndexing}, searching: ${hasSearching}, metadata: ${hasMetadata}, filtering: ${hasFiltering}, errors: ${hasErrorHandling})`
  };
}

// =============================================================================
// REAL-TIME STATUS UPDATES TESTS
// =============================================================================

function testRealTimeStatusUpdates() {
  const knowledgePagePath = path.join(process.cwd(), TEST_CONFIG.components.knowledgePage);
  const exists = fs.existsSync(knowledgePagePath);
  
  if (!exists) {
    return {
      passed: false,
      error: 'Knowledge page not found',
      details: 'Cannot test real-time updates without knowledge page'
    };
  }
  
  const content = fs.readFileSync(knowledgePagePath, 'utf8');
  
  // Check for real-time features
  const hasStatusPolling = content.includes('useEffect') && content.includes('interval');
  const hasStatusUpdates = content.includes('loadKnowledgeItems') || content.includes('refresh');
  const hasProcessingStates = content.includes('isProcessing') || content.includes('processing');
  const hasLoadingStates = content.includes('loading') || content.includes('setLoading');
  const hasErrorStates = content.includes('error') || content.includes('setError');
  const hasToastNotifications = content.includes('toast') || content.includes('notification');
  const hasProgressTracking = content.includes('progress') || content.includes('percent');
  const hasStatusDisplay = content.includes('status') && content.includes('display');
  
  const statusScore = [
    hasStatusPolling, hasStatusUpdates, hasProcessingStates, hasLoadingStates,
    hasErrorStates, hasToastNotifications, hasProgressTracking, hasStatusDisplay
  ].filter(Boolean).length;
  
  return {
    passed: statusScore >= 6,
    error: statusScore < 6 ? 'Real-time status updates incomplete' : null,
    details: `Status features: ${statusScore}/8 (polling: ${hasStatusPolling}, updates: ${hasStatusUpdates}, processing: ${hasProcessingStates}, loading: ${hasLoadingStates}, errors: ${hasErrorStates}, notifications: ${hasToastNotifications}, progress: ${hasProgressTracking}, display: ${hasStatusDisplay})`
  };
}

// =============================================================================
// CROSS-COMPONENT COMMUNICATION TESTS
// =============================================================================

function testCrossComponentCommunication() {
  const knowledgePagePath = path.join(process.cwd(), TEST_CONFIG.components.knowledgePage);
  const knowledgeGridPath = path.join(process.cwd(), TEST_CONFIG.components.knowledgeGrid);
  
  let pageExists = fs.existsSync(knowledgePagePath);
  let gridExists = fs.existsSync(knowledgeGridPath);
  
  if (!pageExists || !gridExists) {
    return {
      passed: false,
      error: 'Required components not found',
      details: `Missing components: page=${pageExists}, grid=${gridExists}`
    };
  }
  
  const pageContent = fs.readFileSync(knowledgePagePath, 'utf8');
  const gridContent = fs.readFileSync(knowledgeGridPath, 'utf8');
  
  // Check for communication features
  const hasStateManagement = pageContent.includes('useState') && pageContent.includes('selectedItems');
  const hasEventHandlers = pageContent.includes('handleBulk') || pageContent.includes('onBulk');
  const hasPropsFlow = gridContent.includes('onSelectedItemsChange') || gridContent.includes('props');
  const hasCallbacks = gridContent.includes('callback') || gridContent.includes('onChange');
  const hasDataFlow = pageContent.includes('items') && gridContent.includes('items');
  const hasErrorPropagation = pageContent.includes('error') && gridContent.includes('error');
  const hasLoadingStates = pageContent.includes('loading') && gridContent.includes('loading');
  const hasRefreshMechanism = pageContent.includes('refresh') && gridContent.includes('refresh');
  
  const commScore = [
    hasStateManagement, hasEventHandlers, hasPropsFlow, hasCallbacks,
    hasDataFlow, hasErrorPropagation, hasLoadingStates, hasRefreshMechanism
  ].filter(Boolean).length;
  
  return {
    passed: commScore >= 6,
    error: commScore < 6 ? 'Cross-component communication incomplete' : null,
    details: `Communication features: ${commScore}/8 (state: ${hasStateManagement}, handlers: ${hasEventHandlers}, props: ${hasPropsFlow}, callbacks: ${hasCallbacks}, data: ${hasDataFlow}, errors: ${hasErrorPropagation}, loading: ${hasLoadingStates}, refresh: ${hasRefreshMechanism})`
  };
}

// =============================================================================
// ERROR HANDLING AND FALLBACKS TESTS
// =============================================================================

function testErrorHandlingAndFallbacks() {
  const components = [
    TEST_CONFIG.components.knowledgeAPI,
    TEST_CONFIG.components.agentChatAPI,
    TEST_CONFIG.components.knowledgeSearchAPI
  ];
  
  let totalScore = 0;
  let maxScore = 0;
  let existingComponents = 0;
  
  for (const componentPath of components) {
    const fullPath = path.join(process.cwd(), componentPath);
    if (fs.existsSync(fullPath)) {
      existingComponents++;
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check for error handling features
      const hasTryCatch = content.includes('try') && content.includes('catch');
      const hasErrorResponses = content.includes('error') && content.includes('status');
      const hasErrorLogging = content.includes('console.error') || content.includes('logger');
      const hasFallbackLogic = content.includes('fallback') || content.includes('backup');
      const hasValidation = content.includes('validate') || content.includes('validation');
      const hasTimeouts = content.includes('timeout') || content.includes('setTimeout');
      const hasRetryLogic = content.includes('retry') || content.includes('attempt');
      const hasGracefulDegradation = content.includes('graceful') || content.includes('degrade');
      
      const componentScore = [
        hasTryCatch, hasErrorResponses, hasErrorLogging, hasFallbackLogic,
        hasValidation, hasTimeouts, hasRetryLogic, hasGracefulDegradation
      ].filter(Boolean).length;
      
      totalScore += componentScore;
      maxScore += 8;
    }
  }
  
  if (existingComponents === 0) {
    return {
      passed: false,
      error: 'No API components found for error handling test',
      details: 'Cannot test error handling without API components'
    };
  }
  
  const averageScore = totalScore / maxScore;
  
  return {
    passed: averageScore >= 0.75,
    error: averageScore < 0.75 ? 'Error handling and fallbacks incomplete' : null,
    details: `Error handling: ${Math.round(averageScore * 100)}% (${totalScore}/${maxScore} across ${existingComponents} components)`
  };
}

// =============================================================================
// CALCULATE SCORES AND GENERATE REPORT
// =============================================================================

function calculateComponentScores() {
  const categories = {};
  
  testResults.results.details.forEach(result => {
    if (!categories[result.category]) {
      categories[result.category] = { passed: 0, total: 0 };
    }
    categories[result.category].total++;
    if (result.status === 'PASSED') {
      categories[result.category].passed++;
    }
  });
  
  Object.keys(categories).forEach(category => {
    const score = Math.round((categories[category].passed / categories[category].total) * 100);
    testResults.results.summary.componentScores[category] = score;
  });
  
  return categories;
}

function calculateOverallScore() {
  const { passed, total } = testResults.results.summary;
  testResults.results.summary.successRate = total > 0 ? Math.round((passed / total) * 100) : 0;
  testResults.results.summary.overallScore = testResults.results.summary.successRate;
  
  const componentScores = Object.values(testResults.results.summary.componentScores);
  testResults.results.summary.componentAverage = componentScores.length > 0 
    ? Math.round(componentScores.reduce((a, b) => a + b, 0) / componentScores.length)
    : 0;
  
  // Determine if ready for final validation
  testResults.results.readyForFinalValidation = testResults.results.summary.overallScore >= 95;
  testResults.results.requirementsMet = testResults.results.summary.overallScore >= 85;
}

// =============================================================================
// MAIN VALIDATION FUNCTION
// =============================================================================

async function runDay12_3Validation() {
  console.log('\n🔗 Starting Day 12.3: Integration Points Validation...\n');
  
  // RAG System Integration Tests
  runTest('RAG system integration', testRAGSystemIntegration, 'ragIntegration');
  runTest('Knowledge search integration', testKnowledgeSearchIntegration, 'ragIntegration');
  
  // Agent Assignment Tests
  runTest('Agent assignment integration', testAgentAssignmentIntegration, 'agentAssignment');
  
  // Analytics Integration Tests
  runTest('Analytics integration', testAnalyticsIntegration, 'analytics');
  
  // Vector Database Integration Tests
  runTest('Vector database integration', testVectorDatabaseIntegration, 'vectorDB');
  
  // Real-time Status Updates Tests
  runTest('Real-time status updates', testRealTimeStatusUpdates, 'realTimeUpdates');
  
  // Cross-component Communication Tests
  runTest('Cross-component communication', testCrossComponentCommunication, 'communication');
  
  // Error Handling and Fallbacks Tests
  runTest('Error handling and fallbacks', testErrorHandlingAndFallbacks, 'errorHandling');
  
  // Calculate scores
  calculateComponentScores();
  calculateOverallScore();
  
  // Generate report
  console.log('\n📊 Day 12.3 Integration Points Validation Results:');
  console.log('=' .repeat(60));
  console.log(`Overall Score: ${testResults.results.summary.overallScore}%`);
  console.log(`Success Rate: ${testResults.results.summary.successRate}%`);
  console.log(`Tests Passed: ${testResults.results.summary.passed}/${testResults.results.summary.total}`);
  console.log(`Component Average: ${testResults.results.summary.componentAverage}%`);
  
  console.log('\n📋 Component Scores:');
  Object.entries(testResults.results.summary.componentScores).forEach(([component, score]) => {
    const status = score >= 95 ? '✅' : score >= 85 ? '⚠️' : '❌';
    console.log(`  ${status} ${component}: ${score}%`);
  });
  
  console.log('\n🎯 Requirements Status:');
  console.log(`  ${testResults.results.requirementsMet ? '✅' : '❌'} Requirements Met (85%+): ${testResults.results.requirementsMet}`);
  console.log(`  ${testResults.results.readyForFinalValidation ? '✅' : '❌'} Ready for Final Validation (95%+): ${testResults.results.readyForFinalValidation}`);
  
  if (testResults.results.summary.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.results.details
      .filter(result => result.status === 'FAILED')
      .forEach(result => {
        console.log(`  • ${result.test}: ${result.error}`);
      });
  }
  
  // Save detailed report
  const reportPath = path.join(process.cwd(), 'test-reports', `day12-3-validation-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  return testResults;
}

// Run validation if called directly
if (require.main === module) {
  runDay12_3Validation()
    .then(results => {
      process.exit(results.results.summary.overallScore >= 95 ? 0 : 1);
    })
    .catch(error => {
      console.error('Validation failed:', error);
      process.exit(1);
    });
}

module.exports = { runDay12_3Validation }; 