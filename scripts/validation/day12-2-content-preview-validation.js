#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Day 12.2 Content Preview Validation
const TEST_CONFIG = {
  components: {
    documentPreview: 'src/components/knowledge/DocumentPreview.tsx',
    knowledgeGrid: 'src/components/knowledge/KnowledgeGrid.tsx',
    knowledgePage: 'src/app/dashboard/knowledge/page.tsx',
    previewAPI: 'src/app/api/knowledge/[id]/preview/route.ts'
  },
  requirements: [
    'Document preview modal with content display',
    'Processing statistics and metrics',
    'Chunk information and analysis',
    'Vector status and indexing details',
    'Tabbed interface for different views',
    'Real-time status updates',
    'Error handling and loading states'
  ]
};

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  testName: 'Day 12.2: Content Preview Validation',
  description: 'Validate document preview, processing stats, and chunk information',
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
    readyForDay12_3: false,
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
// DOCUMENT PREVIEW COMPONENT TESTS
// =============================================================================

function testDocumentPreviewComponent() {
  const filePath = path.join(process.cwd(), TEST_CONFIG.components.documentPreview);
  const exists = fs.existsSync(filePath);
  
  if (!exists) {
    return {
      passed: false,
      error: 'DocumentPreview component does not exist',
      details: `Expected: ${filePath}`
    };
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for essential features
  const hasModal = content.includes('fixed inset-0') && content.includes('backdrop-blur');
  const hasTabInterface = content.includes('activeTab') && content.includes('setActiveTab');
  const hasContentTab = content.includes('content') && content.includes('renderContentTab');
  const hasStatsTab = content.includes('stats') && content.includes('renderStatsTab');
  const hasChunksTab = content.includes('chunks') && content.includes('renderChunksTab');
  const hasVectorsTab = content.includes('vectors') && content.includes('renderVectorsTab');
  const hasLoadingStates = content.includes('loading') && content.includes('Loading');
  const hasErrorHandling = content.includes('error') && content.includes('Error');
  
  const featureScore = [
    hasModal, hasTabInterface, hasContentTab, hasStatsTab, 
    hasChunksTab, hasVectorsTab, hasLoadingStates, hasErrorHandling
  ].filter(Boolean).length;
  
  return {
    passed: featureScore >= 6,
    error: featureScore < 6 ? 'DocumentPreview component incomplete' : null,
    details: `Preview features: ${featureScore}/8 (modal: ${hasModal}, tabs: ${hasTabInterface}, content: ${hasContentTab}, stats: ${hasStatsTab}, chunks: ${hasChunksTab}, vectors: ${hasVectorsTab}, loading: ${hasLoadingStates}, errors: ${hasErrorHandling})`
  };
}

function testPreviewAPI() {
  const filePath = path.join(process.cwd(), TEST_CONFIG.components.previewAPI);
  const exists = fs.existsSync(filePath);
  
  if (!exists) {
    return {
      passed: false,
      error: 'Preview API endpoint does not exist',
      details: `Expected: ${filePath}`
    };
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for API features
  const hasGETMethod = content.includes('export async function GET');
  const hasAuthentication = content.includes('getServerSession') || content.includes('session');
  const hasDocumentFetch = content.includes('prisma.document.findFirst');
  const hasDataImportFetch = content.includes('prisma.dataImport.findFirst');
  const hasProcessingStats = content.includes('processingStats');
  const hasVectorStatus = content.includes('vectorStatus');
  const hasErrorHandling = content.includes('try') && content.includes('catch');
  const hasDataTransformation = content.includes('formattedData');
  
  const apiScore = [
    hasGETMethod, hasAuthentication, hasDocumentFetch, hasDataImportFetch,
    hasProcessingStats, hasVectorStatus, hasErrorHandling, hasDataTransformation
  ].filter(Boolean).length;
  
  return {
    passed: apiScore >= 6,
    error: apiScore < 6 ? 'Preview API incomplete' : null,
    details: `API features: ${apiScore}/8 (GET: ${hasGETMethod}, auth: ${hasAuthentication}, docs: ${hasDocumentFetch}, imports: ${hasDataImportFetch}, stats: ${hasProcessingStats}, vectors: ${hasVectorStatus}, errors: ${hasErrorHandling}, transform: ${hasDataTransformation})`
  };
}

// =============================================================================
// PROCESSING STATISTICS TESTS
// =============================================================================

function testProcessingStatsDisplay() {
  const filePath = path.join(process.cwd(), TEST_CONFIG.components.documentPreview);
  const exists = fs.existsSync(filePath);
  
  if (!exists) {
    return {
      passed: false,
      error: 'DocumentPreview component does not exist',
      details: 'Cannot test processing stats without DocumentPreview'
    };
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for processing statistics features
  const hasProcessingDuration = content.includes('processingDuration');
  const hasTotalChunks = content.includes('totalChunks');
  const hasSuccessfulChunks = content.includes('successfulChunks');
  const hasFailedChunks = content.includes('failedChunks');
  const hasVectorizationTime = content.includes('vectorizationTime');
  const hasIndexingTime = content.includes('indexingTime');
  const hasTimeline = content.includes('timeline') || content.includes('Timeline');
  const hasFormatDuration = content.includes('formatDuration');
  
  const statsScore = [
    hasProcessingDuration, hasTotalChunks, hasSuccessfulChunks, hasFailedChunks,
    hasVectorizationTime, hasIndexingTime, hasTimeline, hasFormatDuration
  ].filter(Boolean).length;
  
  return {
    passed: statsScore >= 6,
    error: statsScore < 6 ? 'Processing statistics display incomplete' : null,
    details: `Stats features: ${statsScore}/8 (duration: ${hasProcessingDuration}, chunks: ${hasTotalChunks}, success: ${hasSuccessfulChunks}, failed: ${hasFailedChunks}, vectorization: ${hasVectorizationTime}, indexing: ${hasIndexingTime}, timeline: ${hasTimeline}, format: ${hasFormatDuration})`
  };
}

// =============================================================================
// CHUNK INFORMATION TESTS
// =============================================================================

function testChunkInformationDisplay() {
  const filePath = path.join(process.cwd(), TEST_CONFIG.components.documentPreview);
  const exists = fs.existsSync(filePath);
  
  if (!exists) {
    return {
      passed: false,
      error: 'DocumentPreview component does not exist',
      details: 'Cannot test chunk information without DocumentPreview'
    };
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for chunk information features
  const hasChunksList = content.includes('chunks?.map');
  const hasChunkContent = content.includes('chunk.content');
  const hasChunkStatus = content.includes('vector_status');
  const hasTokenCount = content.includes('token_count');
  const hasChunkExpansion = content.includes('expandedChunk');
  const hasChunkOverview = content.includes('Chunks Overview');
  const hasIndexedChunks = content.includes('indexed');
  const hasTotalTokens = content.includes('Total Tokens');
  
  const chunkScore = [
    hasChunksList, hasChunkContent, hasChunkStatus, hasTokenCount,
    hasChunkExpansion, hasChunkOverview, hasIndexedChunks, hasTotalTokens
  ].filter(Boolean).length;
  
  return {
    passed: chunkScore >= 6,
    error: chunkScore < 6 ? 'Chunk information display incomplete' : null,
    details: `Chunk features: ${chunkScore}/8 (list: ${hasChunksList}, content: ${hasChunkContent}, status: ${hasChunkStatus}, tokens: ${hasTokenCount}, expansion: ${hasChunkExpansion}, overview: ${hasChunkOverview}, indexed: ${hasIndexedChunks}, total: ${hasTotalTokens})`
  };
}

// =============================================================================
// VECTOR STATUS TESTS
// =============================================================================

function testVectorStatusDisplay() {
  const filePath = path.join(process.cwd(), TEST_CONFIG.components.documentPreview);
  const exists = fs.existsSync(filePath);
  
  if (!exists) {
    return {
      passed: false,
      error: 'DocumentPreview component does not exist',
      details: 'Cannot test vector status without DocumentPreview'
    };
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for vector status features
  const hasVectorStatus = content.includes('vectorStatus');
  const hasIndexedStatus = content.includes('indexed');
  const hasVectorCount = content.includes('vectorCount');
  const hasDimensions = content.includes('dimensions');
  const hasEmbeddingModel = content.includes('embeddingModel');
  const hasCollection = content.includes('collection');
  const hasLastIndexed = content.includes('lastIndexed');
  const hasVectorDetails = content.includes('Vector Details');
  
  const vectorScore = [
    hasVectorStatus, hasIndexedStatus, hasVectorCount, hasDimensions,
    hasEmbeddingModel, hasCollection, hasLastIndexed, hasVectorDetails
  ].filter(Boolean).length;
  
  return {
    passed: vectorScore >= 6,
    error: vectorScore < 6 ? 'Vector status display incomplete' : null,
    details: `Vector features: ${vectorScore}/8 (status: ${hasVectorStatus}, indexed: ${hasIndexedStatus}, count: ${hasVectorCount}, dimensions: ${hasDimensions}, model: ${hasEmbeddingModel}, collection: ${hasCollection}, lastIndexed: ${hasLastIndexed}, details: ${hasVectorDetails})`
  };
}

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

function testKnowledgeGridIntegration() {
  const filePath = path.join(process.cwd(), TEST_CONFIG.components.knowledgeGrid);
  const exists = fs.existsSync(filePath);
  
  if (!exists) {
    return {
      passed: false,
      error: 'KnowledgeGrid component does not exist',
      details: 'Cannot test integration without KnowledgeGrid'
    };
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for integration features
  const importsDocumentPreview = content.includes('import DocumentPreview');
  const hasPreviewState = content.includes('showPreview');
  const hasPreviewHandler = content.includes('onPreview');
  const hasPreviewButton = content.includes('Preview') || content.includes('👁️');
  const hasPreviewModal = content.includes('<DocumentPreview');
  const hasPreviewClose = content.includes('onClose');
  
  const integrationScore = [
    importsDocumentPreview, hasPreviewState, hasPreviewHandler,
    hasPreviewButton, hasPreviewModal, hasPreviewClose
  ].filter(Boolean).length;
  
  return {
    passed: integrationScore >= 5,
    error: integrationScore < 5 ? 'KnowledgeGrid integration incomplete' : null,
    details: `Integration features: ${integrationScore}/6 (import: ${importsDocumentPreview}, state: ${hasPreviewState}, handler: ${hasPreviewHandler}, button: ${hasPreviewButton}, modal: ${hasPreviewModal}, close: ${hasPreviewClose})`
  };
}

function testKnowledgePageIntegration() {
  const filePath = path.join(process.cwd(), TEST_CONFIG.components.knowledgePage);
  const exists = fs.existsSync(filePath);
  
  if (!exists) {
    return {
      passed: false,
      error: 'Knowledge page does not exist',
      details: 'Cannot test integration without knowledge page'
    };
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for page integration features
  const hasPreviewState = content.includes('previewItemId') || content.includes('showPreview');
  const hasPreviewHandler = content.includes('handlePreview');
  const hasPreviewProps = content.includes('onPreview');
  const hasLazyLoading = content.includes('lazy') && content.includes('Suspense');
  
  const pageScore = [
    hasPreviewState, hasPreviewHandler, hasPreviewProps, hasLazyLoading
  ].filter(Boolean).length;
  
  return {
    passed: pageScore >= 3,
    error: pageScore < 3 ? 'Knowledge page integration incomplete' : null,
    details: `Page features: ${pageScore}/4 (state: ${hasPreviewState}, handler: ${hasPreviewHandler}, props: ${hasPreviewProps}, lazy: ${hasLazyLoading})`
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
  
  // Determine if ready for Day 12.3
  testResults.results.readyForDay12_3 = testResults.results.summary.overallScore >= 95;
  testResults.results.requirementsMet = testResults.results.summary.overallScore >= 85;
}

// =============================================================================
// MAIN VALIDATION FUNCTION
// =============================================================================

async function runDay12_2Validation() {
  console.log('\n🔍 Starting Day 12.2: Content Preview Validation...\n');
  
  // Document Preview Component Tests
  runTest('Document preview component', testDocumentPreviewComponent, 'documentPreview');
  runTest('Preview API endpoint', testPreviewAPI, 'documentPreview');
  
  // Processing Statistics Tests
  runTest('Processing statistics display', testProcessingStatsDisplay, 'processingStats');
  
  // Chunk Information Tests
  runTest('Chunk information display', testChunkInformationDisplay, 'chunkInfo');
  
  // Vector Status Tests
  runTest('Vector status display', testVectorStatusDisplay, 'vectorStatus');
  
  // Integration Tests
  runTest('Knowledge grid integration', testKnowledgeGridIntegration, 'integration');
  runTest('Knowledge page integration', testKnowledgePageIntegration, 'integration');
  
  // Calculate scores
  calculateComponentScores();
  calculateOverallScore();
  
  // Generate report
  console.log('\n📊 Day 12.2 Content Preview Validation Results:');
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
  console.log(`  ${testResults.results.readyForDay12_3 ? '✅' : '❌'} Ready for Day 12.3 (95%+): ${testResults.results.readyForDay12_3}`);
  
  if (testResults.results.summary.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.results.details
      .filter(result => result.status === 'FAILED')
      .forEach(result => {
        console.log(`  • ${result.test}: ${result.error}`);
      });
  }
  
  // Save detailed report
  const reportPath = path.join(process.cwd(), 'test-reports', `day12-2-validation-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  return testResults;
}

// Run validation if called directly
if (require.main === module) {
  runDay12_2Validation()
    .then(results => {
      process.exit(results.results.summary.overallScore >= 95 ? 0 : 1);
    })
    .catch(error => {
      console.error('Validation failed:', error);
      process.exit(1);
    });
}

module.exports = { runDay12_2Validation }; 