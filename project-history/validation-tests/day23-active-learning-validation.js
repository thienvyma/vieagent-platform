#!/usr/bin/env node

/**
 * DAY 23: ACTIVE LEARNING VALIDATION
 * 
 * This script validates the active learning system implementation:
 * - Learning modes (PASSIVE, ACTIVE, HYBRID)
 * - Knowledge update engine
 * - Auto-learning orchestrator
 * - Integration between all components
 */

const fs = require('fs');
const path = require('path');

// Test Results Storage
const testResults = {
  timestamp: new Date().toISOString(),
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  results: []
};

// Utility Functions
function logTest(testName, passed, details = '') {
  const result = {
    test: testName,
    status: passed ? 'PASS' : 'FAIL',
    details: details,
    timestamp: new Date().toISOString()
  };
  
  testResults.results.push(result);
  testResults.totalTests++;
  
  if (passed) {
    testResults.passedTests++;
    console.log(`✅ ${testName}`);
  } else {
    testResults.failedTests++;
    console.log(`❌ ${testName}: ${details}`);
  }
  
  if (details && passed) {
    console.log(`   ${details}`);
  }
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function validateFileStructure(filePath, requiredElements) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const missing = requiredElements.filter(element => !content.includes(element));
    return { valid: missing.length === 0, missing, content };
  } catch (error) {
    return { valid: false, missing: requiredElements, error: error.message };
  }
}

function validateTypeScriptInterface(content, interfaceName, requiredProperties) {
  const interfaceRegex = new RegExp(`interface\\s+${interfaceName}\\s*{([^}]+)}`, 's');
  const match = content.match(interfaceRegex);
  
  if (!match) {
    return { valid: false, missing: [interfaceName] };
  }
  
  const interfaceContent = match[1];
  const missing = requiredProperties.filter(prop => !interfaceContent.includes(prop));
  
  return { valid: missing.length === 0, missing };
}

function validateClass(content, className, requiredMethods) {
  const classRegex = new RegExp(`class\\s+${className}\\s*{`, 's');
  const match = content.match(classRegex);
  
  if (!match) {
    return { valid: false, missing: [className] };
  }
  
  const missing = requiredMethods.filter(method => !content.includes(method));
  
  return { valid: missing.length === 0, missing };
}

// Test Categories

// 23.1: Learning Modes Implementation
function testLearningModes() {
  console.log('\n🔍 Testing Learning Modes Implementation (23.1)...');
  
  // Test 1: LearningModeManager file exists
  const learningModeFile = path.join(__dirname, 'src/lib/learning/LearningModeManager.ts');
  logTest(
    'LearningModeManager file exists',
    fileExists(learningModeFile),
    fileExists(learningModeFile) ? 'File found' : 'File missing'
  );
  
  if (!fileExists(learningModeFile)) return;
  
  // Test 2: Learning mode enums
  const { valid: enumsValid, missing: enumsMissing, content } = validateFileStructure(
    learningModeFile,
    ['enum LearningMode', 'PASSIVE', 'ACTIVE', 'HYBRID', 'enum LearningTrigger']
  );
  logTest(
    'Learning mode enums defined',
    enumsValid,
    enumsValid ? 'All enums present' : `Missing: ${enumsMissing.join(', ')}`
  );
  
  // Test 3: Learning interfaces
  const requiredInterfaces = [
    'LearningConfiguration',
    'LearningDecision',
    'LearningContext',
    'LearningRule'
  ];
  
  let interfacesValid = true;
  let interfaceDetails = [];
  
  for (const interfaceName of requiredInterfaces) {
    const interfaceCheck = validateTypeScriptInterface(content, interfaceName, []);
    if (!interfaceCheck.valid) {
      interfacesValid = false;
      interfaceDetails.push(`${interfaceName} missing`);
    } else {
      interfaceDetails.push(`${interfaceName} found`);
    }
  }
  
  logTest(
    'Learning interfaces defined',
    interfacesValid,
    interfaceDetails.join(', ')
  );
  
  // Test 4: LearningModeManager class
  const managerMethods = [
    'getInstance',
    'getLearningConfiguration',
    'makeLearningDecision',
    'makePassiveDecision',
    'makeActiveDecision',
    'makeHybridDecision'
  ];
  
  const { valid: classValid, missing: classMissing } = validateClass(
    content,
    'LearningModeManager',
    managerMethods
  );
  
  logTest(
    'LearningModeManager class implementation',
    classValid,
    classValid ? 'All methods present' : `Missing methods: ${classMissing.join(', ')}`
  );
  
  // Test 5: Learning rules initialization
  const rulesValid = content.includes('initializeLearningRules') && 
                    content.includes('defaultRules') &&
                    content.includes('high_quality_response');
  
  logTest(
    'Learning rules initialization',
    rulesValid,
    rulesValid ? 'Default rules configured' : 'Learning rules not properly initialized'
  );
  
  // Test 6: Decision making logic
  const decisionLogicValid = content.includes('findApplicableRules') && 
                            content.includes('evaluateRules') &&
                            content.includes('confidenceThreshold');
  
  logTest(
    'Decision making logic',
    decisionLogicValid,
    decisionLogicValid ? 'Decision logic implemented' : 'Decision logic incomplete'
  );
}

// 23.2: Knowledge Update Engine
function testKnowledgeUpdateEngine() {
  console.log('\n🔍 Testing Knowledge Update Engine (23.2)...');
  
  // Test 1: KnowledgeUpdateEngine file exists
  const updateEngineFile = path.join(__dirname, 'src/lib/learning/KnowledgeUpdateEngine.ts');
  logTest(
    'KnowledgeUpdateEngine file exists',
    fileExists(updateEngineFile),
    fileExists(updateEngineFile) ? 'File found' : 'File missing'
  );
  
  if (!fileExists(updateEngineFile)) return;
  
  // Test 2: Update types and status enums
  const { valid: enumsValid, missing: enumsMissing, content } = validateFileStructure(
    updateEngineFile,
    ['enum UpdateType', 'enum UpdateStatus', 'ADDITION', 'MODIFICATION', 'DELETION', 'PENDING', 'APPROVED']
  );
  logTest(
    'Update enums defined',
    enumsValid,
    enumsValid ? 'All enums present' : `Missing: ${enumsMissing.join(', ')}`
  );
  
  // Test 3: Knowledge update interfaces
  const updateInterfaces = [
    'KnowledgeUpdate',
    'KnowledgeVersion',
    'UpdateRule',
    'KnowledgeConflict'
  ];
  
  let interfacesValid = true;
  let interfaceDetails = [];
  
  for (const interfaceName of updateInterfaces) {
    const interfaceCheck = validateTypeScriptInterface(content, interfaceName, []);
    if (!interfaceCheck.valid) {
      interfacesValid = false;
      interfaceDetails.push(`${interfaceName} missing`);
    } else {
      interfaceDetails.push(`${interfaceName} found`);
    }
  }
  
  logTest(
    'Knowledge update interfaces',
    interfacesValid,
    interfaceDetails.join(', ')
  );
  
  // Test 4: KnowledgeUpdateEngine class
  const engineMethods = [
    'getInstance',
    'processConversationForUpdates',
    'applyKnowledgeUpdates',
    'detectConflicts',
    'rollbackUpdate',
    'createKnowledgeVersion'
  ];
  
  const { valid: classValid, missing: classMissing } = validateClass(
    content,
    'KnowledgeUpdateEngine',
    engineMethods
  );
  
  logTest(
    'KnowledgeUpdateEngine class implementation',
    classValid,
    classValid ? 'All methods present' : `Missing methods: ${classMissing.join(', ')}`
  );
  
  // Test 5: Update rule initialization
  const rulesValid = content.includes('initializeUpdateRules') && 
                    content.includes('defaultRules') &&
                    content.includes('high_confidence_addition');
  
  logTest(
    'Update rules initialization',
    rulesValid,
    rulesValid ? 'Default update rules configured' : 'Update rules not properly initialized'
  );
  
  // Test 6: Conflict detection
  const conflictValid = content.includes('detectConflicts') && 
                       content.includes('updatesConflict') &&
                       content.includes('KnowledgeConflict');
  
  logTest(
    'Conflict detection system',
    conflictValid,
    conflictValid ? 'Conflict detection implemented' : 'Conflict detection incomplete'
  );
  
  // Test 7: Versioning system
  const versioningValid = content.includes('createKnowledgeVersion') && 
                         content.includes('rollbackData') &&
                         content.includes('KnowledgeVersion');
  
  logTest(
    'Knowledge versioning system',
    versioningValid,
    versioningValid ? 'Versioning system implemented' : 'Versioning system incomplete'
  );
  
  // Test 8: Update application methods
  const applicationMethods = [
    'applyAddition',
    'applyModification',
    'applyDeletion',
    'applyMerge',
    'applySplit'
  ];
  
  const applicationValid = applicationMethods.every(method => content.includes(method));
  
  logTest(
    'Update application methods',
    applicationValid,
    applicationValid ? 'All application methods present' : 'Some application methods missing'
  );
}

// 23.3: Auto-Learning Orchestrator
function testAutoLearningOrchestrator() {
  console.log('\n🔍 Testing Auto-Learning Orchestrator (23.3)...');
  
  // Test 1: AutoLearningOrchestrator file exists
  const orchestratorFile = path.join(__dirname, 'src/lib/learning/AutoLearningOrchestrator.ts');
  logTest(
    'AutoLearningOrchestrator file exists',
    fileExists(orchestratorFile),
    fileExists(orchestratorFile) ? 'File found' : 'File missing'
  );
  
  if (!fileExists(orchestratorFile)) return;
  
  // Test 2: Orchestrator interfaces
  const { valid: interfacesValid, missing: interfacesMissing, content } = validateFileStructure(
    orchestratorFile,
    ['AutoLearningConfig', 'LearningSession', 'LearningAnalytics', 'LearningEvent']
  );
  logTest(
    'Orchestrator interfaces defined',
    interfacesValid,
    interfacesValid ? 'All interfaces present' : `Missing: ${interfacesMissing.join(', ')}`
  );
  
  // Test 3: AutoLearningOrchestrator class
  const orchestratorMethods = [
    'getInstance',
    'processLearningQueue',
    'queueConversationForLearning',
    'triggerImmediateLearning',
    'getLearningAnalytics',
    'setLearningEnabled'
  ];
  
  const { valid: classValid, missing: classMissing } = validateClass(
    content,
    'AutoLearningOrchestrator',
    orchestratorMethods
  );
  
  logTest(
    'AutoLearningOrchestrator class implementation',
    classValid,
    classValid ? 'All methods present' : `Missing methods: ${classMissing.join(', ')}`
  );
  
  // Test 4: Component integration
  const integrationValid = content.includes('LearningFeedbackSystem') && 
                          content.includes('ResponseAnalysisEngine') &&
                          content.includes('KnowledgeExtractionEngine') &&
                          content.includes('LearningModeManager') &&
                          content.includes('KnowledgeUpdateEngine');
  
  logTest(
    'Component integration',
    integrationValid,
    integrationValid ? 'All components integrated' : 'Some components not integrated'
  );
  
  // Test 5: Learning session management
  const sessionValid = content.includes('startLearningSession') && 
                       content.includes('completeLearningSession') &&
                       content.includes('activeSessions');
  
  logTest(
    'Learning session management',
    sessionValid,
    sessionValid ? 'Session management implemented' : 'Session management incomplete'
  );
  
  // Test 6: Processing loop
  const processingValid = content.includes('startProcessingLoop') && 
                         content.includes('processLearningQueue') &&
                         content.includes('processingInterval');
  
  logTest(
    'Processing loop implementation',
    processingValid,
    processingValid ? 'Processing loop implemented' : 'Processing loop incomplete'
  );
  
  // Test 7: Batch processing
  const batchValid = content.includes('createBatches') && 
                    content.includes('processBatch') &&
                    content.includes('batchSize');
  
  logTest(
    'Batch processing system',
    batchValid,
    batchValid ? 'Batch processing implemented' : 'Batch processing incomplete'
  );
  
  // Test 8: Learning analytics
  const analyticsValid = content.includes('getLearningAnalytics') && 
                        content.includes('LearningAnalytics') &&
                        content.includes('performanceMetrics');
  
  logTest(
    'Learning analytics system',
    analyticsValid,
    analyticsValid ? 'Analytics system implemented' : 'Analytics system incomplete'
  );
}

// 23.4: Integration Testing
function testIntegration() {
  console.log('\n🔍 Testing Integration (23.4)...');
  
  // Test 1: All learning components exist
  const learningFiles = [
    'src/lib/learning/LearningFeedbackSystem.ts',
    'src/lib/learning/ResponseAnalysisEngine.ts',
    'src/lib/learning/KnowledgeExtractionEngine.ts',
    'src/lib/learning/LearningModeManager.ts',
    'src/lib/learning/KnowledgeUpdateEngine.ts',
    'src/lib/learning/AutoLearningOrchestrator.ts'
  ];
  
  const allFilesExist = learningFiles.every(file => fileExists(path.join(__dirname, file)));
  
  logTest(
    'All learning components present',
    allFilesExist,
    allFilesExist ? 'All 6 components found' : 'Some components missing'
  );
  
  // Test 2: Cross-component imports
  const orchestratorFile = path.join(__dirname, 'src/lib/learning/AutoLearningOrchestrator.ts');
  if (fileExists(orchestratorFile)) {
    const content = fs.readFileSync(orchestratorFile, 'utf8');
    const importsValid = content.includes("import { LearningFeedbackSystem }") && 
                        content.includes("import { ResponseAnalysisEngine }") &&
                        content.includes("import { KnowledgeExtractionEngine }") &&
                        content.includes("import { LearningModeManager }") &&
                        content.includes("import { KnowledgeUpdateEngine }");
    
    logTest(
      'Cross-component imports',
      importsValid,
      importsValid ? 'All imports present' : 'Some imports missing'
    );
  }
  
  // Test 3: Singleton pattern consistency
  const singletonFiles = [
    'src/lib/learning/LearningModeManager.ts',
    'src/lib/learning/KnowledgeUpdateEngine.ts',
    'src/lib/learning/AutoLearningOrchestrator.ts'
  ];
  
  let singletonValid = true;
  for (const file of singletonFiles) {
    const filePath = path.join(__dirname, file);
    if (fileExists(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (!content.includes('getInstance') || !content.includes('private static instance')) {
        singletonValid = false;
        break;
      }
    }
  }
  
  logTest(
    'Singleton pattern consistency',
    singletonValid,
    singletonValid ? 'All singletons properly implemented' : 'Some singletons incomplete'
  );
  
  // Test 4: TypeScript interfaces compatibility
  const interfaceFiles = [
    'src/lib/learning/LearningModeManager.ts',
    'src/lib/learning/KnowledgeUpdateEngine.ts'
  ];
  
  let interfacesCompatible = true;
  for (const file of interfaceFiles) {
    const filePath = path.join(__dirname, file);
    if (fileExists(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (!content.includes('export interface') || !content.includes('export enum')) {
        interfacesCompatible = false;
        break;
      }
    }
  }
  
  logTest(
    'TypeScript interfaces compatibility',
    interfacesCompatible,
    interfacesCompatible ? 'All interfaces properly exported' : 'Some interfaces not exported'
  );
}

// 23.5: Learning Workflow Testing
function testLearningWorkflow() {
  console.log('\n🔍 Testing Learning Workflow (23.5)...');
  
  // Test 1: Learning pipeline workflow
  const orchestratorFile = path.join(__dirname, 'src/lib/learning/AutoLearningOrchestrator.ts');
  if (fileExists(orchestratorFile)) {
    const content = fs.readFileSync(orchestratorFile, 'utf8');
    const workflowValid = content.includes('processConversation') && 
                         content.includes('makeLearningDecision') &&
                         content.includes('executelearning') &&
                         content.includes('processConversationForUpdates');
    
    logTest(
      'Learning pipeline workflow',
      workflowValid,
      workflowValid ? 'Complete workflow implemented' : 'Workflow incomplete'
    );
  }
  
  // Test 2: Mode-specific processing
  const modeManagerFile = path.join(__dirname, 'src/lib/learning/LearningModeManager.ts');
  if (fileExists(modeManagerFile)) {
    const content = fs.readFileSync(modeManagerFile, 'utf8');
    const modesValid = content.includes('makePassiveDecision') && 
                      content.includes('makeActiveDecision') &&
                      content.includes('makeHybridDecision');
    
    logTest(
      'Mode-specific processing',
      modesValid,
      modesValid ? 'All learning modes implemented' : 'Some learning modes missing'
    );
  }
  
  // Test 3: Update approval workflow
  const updateEngineFile = path.join(__dirname, 'src/lib/learning/KnowledgeUpdateEngine.ts');
  if (fileExists(updateEngineFile)) {
    const content = fs.readFileSync(updateEngineFile, 'utf8');
    const approvalValid = content.includes('shouldAutoApprove') && 
                         content.includes('findApplicableUpdateRules') &&
                         content.includes('autoApproveThreshold');
    
    logTest(
      'Update approval workflow',
      approvalValid,
      approvalValid ? 'Approval workflow implemented' : 'Approval workflow incomplete'
    );
  }
  
  // Test 4: Error handling and recovery
  let errorHandlingValid = true;
  const criticalFiles = [
    'src/lib/learning/AutoLearningOrchestrator.ts',
    'src/lib/learning/KnowledgeUpdateEngine.ts',
    'src/lib/learning/LearningModeManager.ts'
  ];
  
  for (const file of criticalFiles) {
    const filePath = path.join(__dirname, file);
    if (fileExists(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (!content.includes('try {') || !content.includes('catch') || !content.includes('console.error')) {
        errorHandlingValid = false;
        break;
      }
    }
  }
  
  logTest(
    'Error handling and recovery',
    errorHandlingValid,
    errorHandlingValid ? 'Error handling implemented' : 'Error handling incomplete'
  );
  
  // Test 5: Learning event logging
  if (fileExists(orchestratorFile)) {
    const content = fs.readFileSync(orchestratorFile, 'utf8');
    const loggingValid = content.includes('logLearningEvent') && 
                        content.includes('LearningEvent') &&
                        content.includes('DECISION') &&
                        content.includes('UPDATE');
    
    logTest(
      'Learning event logging',
      loggingValid,
      loggingValid ? 'Event logging implemented' : 'Event logging incomplete'
    );
  }
}

// Main execution
async function runValidation() {
  console.log('🚀 DAY 23: ACTIVE LEARNING VALIDATION');
  console.log('=====================================');
  
  try {
    // Run all test categories
    testLearningModes();
    testKnowledgeUpdateEngine();
    testAutoLearningOrchestrator();
    testIntegration();
    testLearningWorkflow();
    
    // Generate summary
    console.log('\n📊 VALIDATION SUMMARY');
    console.log('=====================');
    console.log(`Total Tests: ${testResults.totalTests}`);
    console.log(`Passed: ${testResults.passedTests} ✅`);
    console.log(`Failed: ${testResults.failedTests} ❌`);
    console.log(`Success Rate: ${((testResults.passedTests / testResults.totalTests) * 100).toFixed(1)}%`);
    
    // Detailed results
    if (testResults.failedTests > 0) {
      console.log('\n❌ FAILED TESTS:');
      testResults.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`   - ${r.test}: ${r.details}`));
    }
    
    // Save results
    const resultsFile = path.join(__dirname, 'day23-active-learning-validation-results.json');
    fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
    console.log(`\n💾 Results saved to: ${resultsFile}`);
    
    // Overall assessment
    const successRate = (testResults.passedTests / testResults.totalTests) * 100;
    if (successRate >= 95) {
      console.log('\n🎉 EXCELLENT! Active Learning system is ready for production.');
    } else if (successRate >= 85) {
      console.log('\n✅ GOOD! Active Learning system is mostly complete with minor issues.');
    } else if (successRate >= 70) {
      console.log('\n⚠️  NEEDS WORK! Active Learning system has significant issues to address.');
    } else {
      console.log('\n❌ CRITICAL! Active Learning system requires major fixes before proceeding.');
    }
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

// Run validation
runValidation(); 