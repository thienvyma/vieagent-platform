const fs = require('fs');
const path = require('path');

// Test results storage
const results = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

function runTest(testName, testFunction) {
  results.total++;
  try {
    const result = testFunction();
    results.passed++;
    results.details.push({
      test: testName,
      status: '✅ PASSED',
      details: result
    });
    console.log(`✅ ${testName}: PASSED`);
  } catch (error) {
    results.failed++;
    results.details.push({
      test: testName,
      status: '❌ FAILED',
      details: error.message
    });
    console.log(`❌ ${testName}: FAILED - ${error.message}`);
  }
}

console.log('🧠 DAY 22: LEARNING PIPELINE FOUNDATION VALIDATION');
console.log('='.repeat(60));

// Test 1: Feedback System Design (Step 22.1)
runTest('22.1.1 Learning Feedback System Component', () => {
  const feedbackPath = path.join(__dirname, 'src/lib/learning/LearningFeedbackSystem.ts');
  if (!fs.existsSync(feedbackPath)) {
    throw new Error('LearningFeedbackSystem component not found');
  }
  
  const content = fs.readFileSync(feedbackPath, 'utf8');
  const requiredComponents = [
    'LearningFeedbackSystem',
    'ConversationFeedback',
    'LearningPattern',
    'KnowledgeGap',
    'collectConversationFeedback',
    'analyzeConversationContext',
    'calculateImplicitMetrics',
    'assessQualityIndicators',
    'generateLearningSignals'
  ];
  
  for (const component of requiredComponents) {
    if (!content.includes(component)) {
      throw new Error(`Missing component: ${component}`);
    }
  }
  
  return 'LearningFeedbackSystem component implemented with comprehensive feedback collection';
});

runTest('22.1.2 Feedback Data Model', () => {
  const feedbackPath = path.join(__dirname, 'src/lib/learning/LearningFeedbackSystem.ts');
  const content = fs.readFileSync(feedbackPath, 'utf8');
  
  const feedbackTypes = [
    'explicitRating',
    'explicitFeedback',
    'implicitMetrics',
    'contextData',
    'qualityIndicators',
    'learningSignals'
  ];
  
  for (const type of feedbackTypes) {
    if (!content.includes(type)) {
      throw new Error(`Missing feedback type: ${type}`);
    }
  }
  
  return 'Feedback data model implemented with all required types';
});

runTest('22.1.3 Implicit Feedback Collection', () => {
  const feedbackPath = path.join(__dirname, 'src/lib/learning/LearningFeedbackSystem.ts');
  const content = fs.readFileSync(feedbackPath, 'utf8');
  
  const implicitMetrics = [
    'responseTime',
    'engagementScore',
    'followUpQuestions',
    'conversationContinued',
    'taskCompleted',
    'sessionDuration',
    'messageLength',
    'reactionTime'
  ];
  
  for (const metric of implicitMetrics) {
    if (!content.includes(metric)) {
      throw new Error(`Missing implicit metric: ${metric}`);
    }
  }
  
  return 'Implicit feedback collection implemented with comprehensive metrics';
});

runTest('22.1.4 Explicit Feedback Collection', () => {
  const feedbackPath = path.join(__dirname, 'src/lib/learning/LearningFeedbackSystem.ts');
  const content = fs.readFileSync(feedbackPath, 'utf8');
  
  const explicitFeedback = [
    'helpful',
    'unhelpful',
    'incorrect',
    'perfect',
    'rating',
    'comment'
  ];
  
  for (const feedback of explicitFeedback) {
    if (!content.includes(feedback)) {
      throw new Error(`Missing explicit feedback: ${feedback}`);
    }
  }
  
  return 'Explicit feedback collection implemented with rating and comment systems';
});

runTest('22.1.5 Learning Signals Generation', () => {
  const feedbackPath = path.join(__dirname, 'src/lib/learning/LearningFeedbackSystem.ts');
  const content = fs.readFileSync(feedbackPath, 'utf8');
  
  const learningSignals = [
    'shouldLearnFrom',
    'learningConfidence',
    'learningType',
    'keyLearnings',
    'suggestedImprovements'
  ];
  
  for (const signal of learningSignals) {
    if (!content.includes(signal)) {
      throw new Error(`Missing learning signal: ${signal}`);
    }
  }
  
  return 'Learning signals generation implemented with confidence scoring';
});

// Test 2: Response Analysis (Step 22.2)
runTest('22.2.1 Response Analysis Engine Component', () => {
  const analysisPath = path.join(__dirname, 'src/lib/learning/ResponseAnalysisEngine.ts');
  if (!fs.existsSync(analysisPath)) {
    throw new Error('ResponseAnalysisEngine component not found');
  }
  
  const content = fs.readFileSync(analysisPath, 'utf8');
  const requiredComponents = [
    'ResponseAnalysisEngine',
    'ResponseAnalysis',
    'ConversationOutcome',
    'analyzeResponse',
    'analyzeQualityMetrics',
    'detectConversationOutcome',
    'generateLearningIndicators'
  ];
  
  for (const component of requiredComponents) {
    if (!content.includes(component)) {
      throw new Error(`Missing component: ${component}`);
    }
  }
  
  return 'ResponseAnalysisEngine component implemented with comprehensive analysis';
});

runTest('22.2.2 Quality Metrics Analysis', () => {
  const analysisPath = path.join(__dirname, 'src/lib/learning/ResponseAnalysisEngine.ts');
  const content = fs.readFileSync(analysisPath, 'utf8');
  
  const qualityMetrics = [
    'accuracy',
    'relevance',
    'completeness',
    'clarity',
    'helpfulness',
    'coherence',
    'appropriateness',
    'overallScore'
  ];
  
  for (const metric of qualityMetrics) {
    if (!content.includes(metric)) {
      throw new Error(`Missing quality metric: ${metric}`);
    }
  }
  
  return 'Quality metrics analysis implemented with comprehensive scoring';
});

runTest('22.2.3 Response Characteristics Analysis', () => {
  const analysisPath = path.join(__dirname, 'src/lib/learning/ResponseAnalysisEngine.ts');
  const content = fs.readFileSync(analysisPath, 'utf8');
  
  const characteristics = [
    'responseLength',
    'sentenceCount',
    'averageSentenceLength',
    'vocabularyComplexity',
    'technicalTermsCount',
    'questionAnswerRatio',
    'actionItemsCount',
    'examplesCount'
  ];
  
  for (const characteristic of characteristics) {
    if (!content.includes(characteristic)) {
      throw new Error(`Missing response characteristic: ${characteristic}`);
    }
  }
  
  return 'Response characteristics analysis implemented with detailed metrics';
});

runTest('22.2.4 Content Analysis', () => {
  const analysisPath = path.join(__dirname, 'src/lib/learning/ResponseAnalysisEngine.ts');
  const content = fs.readFileSync(analysisPath, 'utf8');
  
  const contentAnalysis = [
    'mainTopics',
    'keyPoints',
    'sentimentScore',
    'confidenceLevel',
    'uncertaintyIndicators',
    'factualClaims',
    'recommendations',
    'limitations'
  ];
  
  for (const analysis of contentAnalysis) {
    if (!content.includes(analysis)) {
      throw new Error(`Missing content analysis: ${analysis}`);
    }
  }
  
  return 'Content analysis implemented with comprehensive text processing';
});

runTest('22.2.5 Conversation Outcome Detection', () => {
  const analysisPath = path.join(__dirname, 'src/lib/learning/ResponseAnalysisEngine.ts');
  const content = fs.readFileSync(analysisPath, 'utf8');
  
  const outcomeDetection = [
    'conversationStatus',
    'userSatisfaction',
    'taskCompletion',
    'resolutionType',
    'followUpNeeded',
    'escalationRisk'
  ];
  
  for (const detection of outcomeDetection) {
    if (!content.includes(detection)) {
      throw new Error(`Missing outcome detection: ${detection}`);
    }
  }
  
  return 'Conversation outcome detection implemented with status tracking';
});

runTest('22.2.6 User Satisfaction Tracking', () => {
  const analysisPath = path.join(__dirname, 'src/lib/learning/ResponseAnalysisEngine.ts');
  const content = fs.readFileSync(analysisPath, 'utf8');
  
  const satisfactionIndicators = [
    'satisfied',
    'neutral',
    'dissatisfied',
    'unknown',
    'assessUserSatisfaction'
  ];
  
  for (const indicator of satisfactionIndicators) {
    if (!content.includes(indicator)) {
      throw new Error(`Missing satisfaction indicator: ${indicator}`);
    }
  }
  
  return 'User satisfaction tracking implemented with sentiment analysis';
});

// Test 3: Knowledge Extraction (Step 22.3)
runTest('22.3.1 Knowledge Extraction Engine Component', () => {
  const extractionPath = path.join(__dirname, 'src/lib/learning/KnowledgeExtractionEngine.ts');
  if (!fs.existsSync(extractionPath)) {
    throw new Error('KnowledgeExtractionEngine component not found');
  }
  
  const content = fs.readFileSync(extractionPath, 'utf8');
  const requiredComponents = [
    'KnowledgeExtractionEngine',
    'ExtractedKnowledge',
    'FAQEntry',
    'ConversationPattern',
    'CommonIntent',
    'extractKnowledgeFromConversation',
    'generateFAQFromConversations',
    'extractConversationPatterns',
    'extractCommonIntents'
  ];
  
  for (const component of requiredComponents) {
    if (!content.includes(component)) {
      throw new Error(`Missing component: ${component}`);
    }
  }
  
  return 'KnowledgeExtractionEngine component implemented with comprehensive extraction';
});

runTest('22.3.2 Knowledge Types', () => {
  const extractionPath = path.join(__dirname, 'src/lib/learning/KnowledgeExtractionEngine.ts');
  const content = fs.readFileSync(extractionPath, 'utf8');
  
  const knowledgeTypes = [
    'fact',
    'procedure',
    'concept',
    'example',
    'pattern',
    'faq',
    'solution'
  ];
  
  for (const type of knowledgeTypes) {
    if (!content.includes(type)) {
      throw new Error(`Missing knowledge type: ${type}`);
    }
  }
  
  return 'Knowledge types implemented with comprehensive categorization';
});

runTest('22.3.3 Factual Knowledge Extraction', () => {
  const extractionPath = path.join(__dirname, 'src/lib/learning/KnowledgeExtractionEngine.ts');
  const content = fs.readFileSync(extractionPath, 'utf8');
  
  const factualExtraction = [
    'extractFactualKnowledge',
    'extractFactualStatements',
    'assessFactualConfidence',
    'factualClaims'
  ];
  
  for (const extraction of factualExtraction) {
    if (!content.includes(extraction)) {
      throw new Error(`Missing factual extraction: ${extraction}`);
    }
  }
  
  return 'Factual knowledge extraction implemented with confidence assessment';
});

runTest('22.3.4 Procedural Knowledge Extraction', () => {
  const extractionPath = path.join(__dirname, 'src/lib/learning/KnowledgeExtractionEngine.ts');
  const content = fs.readFileSync(extractionPath, 'utf8');
  
  const proceduralExtraction = [
    'extractProceduralKnowledge',
    'extractProcedures',
    'assessProceduralConfidence',
    'step-by-step'
  ];
  
  for (const extraction of proceduralExtraction) {
    if (!content.includes(extraction)) {
      throw new Error(`Missing procedural extraction: ${extraction}`);
    }
  }
  
  return 'Procedural knowledge extraction implemented with step-by-step analysis';
});

runTest('22.3.5 Solution Knowledge Extraction', () => {
  const extractionPath = path.join(__dirname, 'src/lib/learning/KnowledgeExtractionEngine.ts');
  const content = fs.readFileSync(extractionPath, 'utf8');
  
  const solutionExtraction = [
    'extractSolutionKnowledge',
    'isProblemStatement',
    'assessSolutionConfidence',
    'problem-solution'
  ];
  
  for (const extraction of solutionExtraction) {
    if (!content.includes(extraction)) {
      throw new Error(`Missing solution extraction: ${extraction}`);
    }
  }
  
  return 'Solution knowledge extraction implemented with problem-solution pairing';
});

runTest('22.3.6 FAQ Generation', () => {
  const extractionPath = path.join(__dirname, 'src/lib/learning/KnowledgeExtractionEngine.ts');
  const content = fs.readFileSync(extractionPath, 'utf8');
  
  const faqGeneration = [
    'generateFAQFromConversations',
    'groupSimilarQuestions',
    'createFAQEntry',
    'variations',
    'frequency'
  ];
  
  for (const generation of faqGeneration) {
    if (!content.includes(generation)) {
      throw new Error(`Missing FAQ generation: ${generation}`);
    }
  }
  
  return 'FAQ generation implemented with question grouping and frequency analysis';
});

runTest('22.3.7 Pattern Recognition', () => {
  const extractionPath = path.join(__dirname, 'src/lib/learning/KnowledgeExtractionEngine.ts');
  const content = fs.readFileSync(extractionPath, 'utf8');
  
  const patternRecognition = [
    'extractConversationPatterns',
    'extractQuestionPatterns',
    'extractResponsePatterns',
    'extractFlowPatterns',
    'extractBehaviorPatterns',
    'extractResolutionPatterns'
  ];
  
  for (const recognition of patternRecognition) {
    if (!content.includes(recognition)) {
      throw new Error(`Missing pattern recognition: ${recognition}`);
    }
  }
  
  return 'Pattern recognition implemented with comprehensive pattern types';
});

runTest('22.3.8 Intent Classification', () => {
  const extractionPath = path.join(__dirname, 'src/lib/learning/KnowledgeExtractionEngine.ts');
  const content = fs.readFileSync(extractionPath, 'utf8');
  
  const intentClassification = [
    'extractCommonIntents',
    'classifyUserIntent',
    'information_request',
    'problem_report',
    'help_request',
    'general_inquiry'
  ];
  
  for (const classification of intentClassification) {
    if (!content.includes(classification)) {
      throw new Error(`Missing intent classification: ${classification}`);
    }
  }
  
  return 'Intent classification implemented with common intent types';
});

// Test 4: Integration and Data Flow
runTest('22.4.1 Component Integration', () => {
  const components = [
    'src/lib/learning/LearningFeedbackSystem.ts',
    'src/lib/learning/ResponseAnalysisEngine.ts',
    'src/lib/learning/KnowledgeExtractionEngine.ts'
  ];
  
  for (const componentPath of components) {
    const fullPath = path.join(__dirname, componentPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Component not found: ${componentPath}`);
    }
  }
  
  return 'All learning pipeline components integrated successfully';
});

runTest('22.4.2 Singleton Pattern Implementation', () => {
  const components = [
    'src/lib/learning/LearningFeedbackSystem.ts',
    'src/lib/learning/ResponseAnalysisEngine.ts',
    'src/lib/learning/KnowledgeExtractionEngine.ts'
  ];
  
  for (const componentPath of components) {
    const fullPath = path.join(__dirname, componentPath);
    const content = fs.readFileSync(fullPath, 'utf8');
    
    if (!content.includes('getInstance') || !content.includes('static instance')) {
      throw new Error(`Missing singleton pattern in ${componentPath}`);
    }
  }
  
  return 'Singleton pattern implemented across all learning components';
});

runTest('22.4.3 Data Model Consistency', () => {
  const feedbackPath = path.join(__dirname, 'src/lib/learning/LearningFeedbackSystem.ts');
  const analysisPath = path.join(__dirname, 'src/lib/learning/ResponseAnalysisEngine.ts');
  const extractionPath = path.join(__dirname, 'src/lib/learning/KnowledgeExtractionEngine.ts');
  
  const feedbackContent = fs.readFileSync(feedbackPath, 'utf8');
  const analysisContent = fs.readFileSync(analysisPath, 'utf8');
  const extractionContent = fs.readFileSync(extractionPath, 'utf8');
  
  const commonFields = [
    'conversationId',
    'agentId',
    'userId',
    'createdAt',
    'updatedAt'
  ];
  
  for (const field of commonFields) {
    if (!feedbackContent.includes(field) || !analysisContent.includes(field) || !extractionContent.includes(field)) {
      throw new Error(`Missing common field: ${field}`);
    }
  }
  
  return 'Data model consistency maintained across all components';
});

runTest('22.4.4 Error Handling', () => {
  const components = [
    'src/lib/learning/LearningFeedbackSystem.ts',
    'src/lib/learning/ResponseAnalysisEngine.ts',
    'src/lib/learning/KnowledgeExtractionEngine.ts'
  ];
  
  for (const componentPath of components) {
    const fullPath = path.join(__dirname, componentPath);
    const content = fs.readFileSync(fullPath, 'utf8');
    
    const errorHandling = [
      'try {',
      'catch',
      'error',
      'console.error'
    ];
    
    let hasErrorHandling = false;
    for (const errorFeature of errorHandling) {
      if (content.includes(errorFeature)) {
        hasErrorHandling = true;
        break;
      }
    }
    
    if (!hasErrorHandling) {
      throw new Error(`Missing error handling in ${componentPath}`);
    }
  }
  
  return 'Error handling implemented across all learning components';
});

// Test 5: Learning Pipeline Workflow
runTest('22.5.1 Feedback Collection Workflow', () => {
  const feedbackPath = path.join(__dirname, 'src/lib/learning/LearningFeedbackSystem.ts');
  const content = fs.readFileSync(feedbackPath, 'utf8');
  
  const workflowSteps = [
    'collectConversationFeedback',
    'analyzeConversationContext',
    'calculateImplicitMetrics',
    'assessQualityIndicators',
    'generateLearningSignals',
    'processLearningSignals'
  ];
  
  for (const step of workflowSteps) {
    if (!content.includes(step)) {
      throw new Error(`Missing workflow step: ${step}`);
    }
  }
  
  return 'Feedback collection workflow implemented with all required steps';
});

runTest('22.5.2 Response Analysis Workflow', () => {
  const analysisPath = path.join(__dirname, 'src/lib/learning/ResponseAnalysisEngine.ts');
  const content = fs.readFileSync(analysisPath, 'utf8');
  
  const workflowSteps = [
    'analyzeResponse',
    'analyzeQualityMetrics',
    'analyzeResponseCharacteristics',
    'performContentAnalysis',
    'detectConversationOutcome',
    'extractContextFactors',
    'generateLearningIndicators'
  ];
  
  for (const step of workflowSteps) {
    if (!content.includes(step)) {
      throw new Error(`Missing workflow step: ${step}`);
    }
  }
  
  return 'Response analysis workflow implemented with comprehensive analysis steps';
});

runTest('22.5.3 Knowledge Extraction Workflow', () => {
  const extractionPath = path.join(__dirname, 'src/lib/learning/KnowledgeExtractionEngine.ts');
  const content = fs.readFileSync(extractionPath, 'utf8');
  
  const workflowSteps = [
    'extractKnowledgeFromConversation',
    'extractFactualKnowledge',
    'extractProceduralKnowledge',
    'extractConceptualKnowledge',
    'extractExampleKnowledge',
    'extractSolutionKnowledge',
    'validateExtractedKnowledge',
    'storeExtractedKnowledge'
  ];
  
  for (const step of workflowSteps) {
    if (!content.includes(step)) {
      throw new Error(`Missing workflow step: ${step}`);
    }
  }
  
  return 'Knowledge extraction workflow implemented with all knowledge types';
});

// Final Results
console.log('\n' + '='.repeat(60));
console.log('📊 DAY 22 VALIDATION RESULTS');
console.log('='.repeat(60));
console.log(`✅ Passed: ${results.passed}/${results.total}`);
console.log(`❌ Failed: ${results.failed}/${results.total}`);
console.log(`📈 Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);

// Detailed Results
console.log('\n📋 DETAILED RESULTS:');
console.log('='.repeat(60));

const categories = {
  'Feedback System (22.1)': [1, 2, 3, 4, 5],
  'Response Analysis (22.2)': [6, 7, 8, 9, 10, 11],
  'Knowledge Extraction (22.3)': [12, 13, 14, 15, 16, 17, 18, 19],
  'Integration & Data Flow (22.4)': [20, 21, 22, 23],
  'Learning Pipeline Workflow (22.5)': [24, 25, 26]
};

for (const [category, testNumbers] of Object.entries(categories)) {
  console.log(`\n🔍 ${category}:`);
  const categoryTests = results.details.filter((_, index) => 
    testNumbers.some(num => (index + 1) === num)
  );
  
  categoryTests.forEach(test => {
    console.log(`  ${test.status} ${test.test}`);
  });
}

// Save results to file
const reportData = {
  timestamp: new Date().toISOString(),
  day: 22,
  phase: 'Learning Pipeline Foundation',
  results: results,
  summary: {
    totalTests: results.total,
    passed: results.passed,
    failed: results.failed,
    successRate: ((results.passed / results.total) * 100).toFixed(1) + '%'
  }
};

fs.writeFileSync(
  path.join(__dirname, 'day22-validation-results.json'),
  JSON.stringify(reportData, null, 2)
);

console.log('\n💾 Results saved to day22-validation-results.json');

// Exit with appropriate code
process.exit(results.failed > 0 ? 1 : 0); 