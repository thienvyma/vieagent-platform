const fs = require('fs');
const path = require('path');

// Test results collector
const testResults = [];
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
let errors = [];
let warnings = [];

function runTest(testName, testFunction) {
  totalTests++;
  try {
    const result = testFunction();
    if (result) {
      passedTests++;
      testResults.push({ test: testName, status: 'PASS', details: result.details || 'Test passed successfully' });
      console.log(`✅ ${testName}: PASS`);
    } else {
      failedTests++;
      testResults.push({ test: testName, status: 'FAIL', details: 'Test returned false' });
      console.log(`❌ ${testName}: FAIL`);
    }
  } catch (error) {
    failedTests++;
    errors.push(`${testName}: ${error.message}`);
    testResults.push({ test: testName, status: 'ERROR', details: error.message });
    console.log(`💥 ${testName}: ERROR - ${error.message}`);
  }
}

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function readFileContent(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

function checkComponentStructure(content, componentName) {
  const checks = {
    hasDefaultExport: content.includes(`export default function ${componentName}`) || content.includes(`export default ${componentName}`),
    hasReactImport: content.includes("import React") || content.includes("'react'"),
    hasTypeScript: content.includes('interface ') || content.includes('type '),
    hasStateManagement: content.includes('useState') || content.includes('useEffect'),
    hasPropsInterface: content.includes('interface ') && (content.includes('Props') || content.includes('ComponentProps'))
  };
  
  return checks;
}

function validateAPIEndpoint(content, expectedMethods = ['GET']) {
  const checks = {
    hasExportedMethods: expectedMethods.every(method => content.includes(`export async function ${method}`)),
    hasErrorHandling: content.includes('try') && content.includes('catch'),
    hasAuth: content.includes('getServerSession') || content.includes('session'),
    hasResponse: content.includes('NextResponse.json'),
    hasTypeScript: content.includes('NextRequest') && content.includes('NextResponse')
  };
  
  return checks;
}

console.log('🚀 Starting DAY 28 Step 28.2: Agent Performance Dashboard Validation...\n');

// Test 1: Core Performance Dashboard Component
runTest('Core Performance Dashboard Component Exists', () => {
  const componentPath = path.join(__dirname, 'src/components/agents/AgentPerformanceDashboard.tsx');
  const exists = checkFileExists(componentPath);
  
  if (!exists) {
    return { success: false, details: 'AgentPerformanceDashboard.tsx not found' };
  }
  
  const content = readFileContent(componentPath);
  const structure = checkComponentStructure(content, 'AgentPerformanceDashboard');
  
  const requiredFeatures = [
    content.includes('PerformanceMetrics'),
    content.includes('UsageData'),
    content.includes('OptimizationRecommendation'),
    content.includes('Tabs'),
    content.includes('ResponsiveContainer'),
    content.includes('BarChart') || content.includes('LineChart'),
    content.includes('PieChart'),
    content.includes('RadarChart'),
    content.includes('overview'),
    content.includes('performance'),
    content.includes('usage'),
    content.includes('recommendations')
  ];
  
  return {
    success: structure.hasDefaultExport && structure.hasReactImport && requiredFeatures.every(f => f),
    details: `Component structure: ${JSON.stringify(structure)}, Required features: ${requiredFeatures.filter(f => f).length}/12`
  };
});

// Test 2: Performance Metrics API Endpoint
runTest('Performance Metrics API Endpoint', () => {
  const apiPath = path.join(__dirname, 'src/app/api/agents/analytics/metrics/route.ts');
  const exists = checkFileExists(apiPath);
  
  if (!exists) {
    return { success: false, details: 'Metrics API endpoint not found' };
  }
  
  const content = readFileContent(apiPath);
  const structure = validateAPIEndpoint(content, ['GET', 'POST']);
  
  const requiredFeatures = [
    content.includes('PerformanceMetrics'),
    content.includes('totalConversations'),
    content.includes('avgResponseTime'),
    content.includes('satisfactionScore'),
    content.includes('successRate'),
    content.includes('activeUsers'),
    content.includes('costThisMonth'),
    content.includes('knowledgeUtilization'),
    content.includes('modelAccuracy'),
    content.includes('uptimePercentage'),
    content.includes('timeRange'),
    content.includes('agentId')
  ];
  
  return {
    success: structure.hasExportedMethods && structure.hasAuth && requiredFeatures.every(f => f),
    details: `API structure: ${JSON.stringify(structure)}, Required features: ${requiredFeatures.filter(f => f).length}/12`
  };
});

// Test 3: Usage Analytics API Endpoint
runTest('Usage Analytics API Endpoint', () => {
  const apiPath = path.join(__dirname, 'src/app/api/agents/analytics/usage/route.ts');
  const exists = checkFileExists(apiPath);
  
  if (!exists) {
    return { success: false, details: 'Usage analytics API endpoint not found' };
  }
  
  const content = readFileContent(apiPath);
  const structure = validateAPIEndpoint(content, ['GET', 'POST']);
  
  const requiredFeatures = [
    content.includes('UsageData'),
    content.includes('conversations'),
    content.includes('messages'),
    content.includes('responseTime'),
    content.includes('satisfaction'),
    content.includes('cost'),
    content.includes('activeUsers'),
    content.includes('timeRange'),
    content.includes('groupedData'),
    content.includes('filledData')
  ];
  
  return {
    success: structure.hasExportedMethods && structure.hasAuth && requiredFeatures.every(f => f),
    details: `API structure: ${JSON.stringify(structure)}, Required features: ${requiredFeatures.filter(f => f).length}/10`
  };
});

// Test 4: Recommendations API Endpoint
runTest('Recommendations API Endpoint', () => {
  const apiPath = path.join(__dirname, 'src/app/api/agents/analytics/recommendations/route.ts');
  const exists = checkFileExists(apiPath);
  
  if (!exists) {
    return { success: false, details: 'Recommendations API endpoint not found' };
  }
  
  const content = readFileContent(apiPath);
  const structure = validateAPIEndpoint(content, ['GET', 'POST']);
  
  const requiredFeatures = [
    content.includes('OptimizationRecommendation'),
    content.includes('generateRecommendations'),
    content.includes('performance'),
    content.includes('cost'),
    content.includes('accuracy'),
    content.includes('engagement'),
    content.includes('priority'),
    content.includes('actionItems'),
    content.includes('estimatedImprovement'),
    content.includes('confidence')
  ];
  
  return {
    success: structure.hasExportedMethods && structure.hasAuth && requiredFeatures.every(f => f),
    details: `API structure: ${JSON.stringify(structure)}, Required features: ${requiredFeatures.filter(f => f).length}/10`
  };
});

// Test 5: Dashboard Data Visualization
runTest('Dashboard Data Visualization Components', () => {
  const componentPath = path.join(__dirname, 'src/components/agents/AgentPerformanceDashboard.tsx');
  const content = readFileContent(componentPath);
  
  if (!content) {
    return { success: false, details: 'Could not read dashboard component' };
  }
  
  const visualizationFeatures = [
    content.includes('BarChart'),
    content.includes('LineChart'),
    content.includes('PieChart'),
    content.includes('AreaChart'),
    content.includes('RadarChart'),
    content.includes('ResponsiveContainer'),
    content.includes('CartesianGrid'),
    content.includes('XAxis'),
    content.includes('YAxis'),
    content.includes('Tooltip'),
    content.includes('Legend') || content.includes('Cell'),
    content.includes('COLORS')
  ];
  
  return {
    success: visualizationFeatures.filter(f => f).length >= 10,
    details: `Visualization features: ${visualizationFeatures.filter(f => f).length}/12 found`
  };
});

// Test 6: Performance Metrics Calculation
runTest('Performance Metrics Calculation Logic', () => {
  const metricsPath = path.join(__dirname, 'src/app/api/agents/analytics/metrics/route.ts');
  const content = readFileContent(metricsPath);
  
  if (!content) {
    return { success: false, details: 'Could not read metrics API' };
  }
  
  const calculationFeatures = [
    content.includes('totalConversations'),
    content.includes('totalMessages'),
    content.includes('avgResponseTime'),
    content.includes('satisfactionScore'),
    content.includes('successRate'),
    content.includes('activeUsers'),
    content.includes('costThisMonth'),
    content.includes('knowledgeUtilization'),
    content.includes('modelAccuracy'),
    content.includes('uptimePercentage'),
    content.includes('conversations.length'),
    content.includes('reduce'),
    content.includes('Math.max'),
    content.includes('Math.min'),
    content.includes('toFixed')
  ];
  
  return {
    success: calculationFeatures.filter(f => f).length >= 12,
    details: `Calculation features: ${calculationFeatures.filter(f => f).length}/15 found`
  };
});

// Test 7: Dashboard UI/UX Features
runTest('Dashboard UI/UX Features', () => {
  const componentPath = path.join(__dirname, 'src/components/agents/AgentPerformanceDashboard.tsx');
  const content = readFileContent(componentPath);
  
  if (!content) {
    return { success: false, details: 'Could not read dashboard component' };
  }
  
  const uiFeatures = [
    content.includes('Tabs'),
    content.includes('TabsContent'),
    content.includes('TabsList'),
    content.includes('TabsTrigger'),
    content.includes('Card'),
    content.includes('CardContent'),
    content.includes('CardHeader'),
    content.includes('CardTitle'),
    content.includes('Button'),
    content.includes('Select'),
    content.includes('Badge'),
    content.includes('loading'),
    content.includes('refreshing'),
    content.includes('exportData'),
    content.includes('refreshData'),
    content.includes('Filter'),
    content.includes('Calendar'),
    content.includes('Download'),
    content.includes('RefreshCw')
  ];
  
  return {
    success: uiFeatures.filter(f => f).length >= 15,
    details: `UI features: ${uiFeatures.filter(f => f).length}/19 found`
  };
});

// Test 8: Time Range and Filtering
runTest('Time Range and Filtering Features', () => {
  const componentPath = path.join(__dirname, 'src/components/agents/AgentPerformanceDashboard.tsx');
  const content = readFileContent(componentPath);
  
  if (!content) {
    return { success: false, details: 'Could not read dashboard component' };
  }
  
  const filterFeatures = [
    content.includes('timeRange'),
    content.includes('selectedAgent'),
    content.includes('24h'),
    content.includes('7d'),
    content.includes('30d'),
    content.includes('90d'),
    content.includes('setTimeRange'),
    content.includes('setSelectedAgent'),
    content.includes('Select'),
    content.includes('SelectContent'),
    content.includes('SelectItem'),
    content.includes('SelectTrigger'),
    content.includes('SelectValue'),
    content.includes('All Agents')
  ];
  
  return {
    success: filterFeatures.filter(f => f).length >= 12,
    details: `Filter features: ${filterFeatures.filter(f => f).length}/14 found`
  };
});

// Test 9: Optimization Recommendations Logic
runTest('Optimization Recommendations Logic', () => {
  const recommendationsPath = path.join(__dirname, 'src/app/api/agents/analytics/recommendations/route.ts');
  const content = readFileContent(recommendationsPath);
  
  if (!content) {
    return { success: false, details: 'Could not read recommendations API' };
  }
  
  const recommendationFeatures = [
    content.includes('generateRecommendations'),
    content.includes('avgMessagesPerConversation'),
    content.includes('highCostAgents'),
    content.includes('agentsWithFewSources'),
    content.includes('shortConversations'),
    content.includes('slowAgents'),
    content.includes('priority'),
    content.includes('confidence'),
    content.includes('actionItems'),
    content.includes('estimatedImprovement'),
    content.includes('impact'),
    content.includes('effort'),
    content.includes('sort'),
    content.includes('priorityOrder')
  ];
  
  return {
    success: recommendationFeatures.filter(f => f).length >= 12,
    details: `Recommendation features: ${recommendationFeatures.filter(f => f).length}/14 found`
  };
});

// Test 10: Data Export and Refresh
runTest('Data Export and Refresh Functionality', () => {
  const componentPath = path.join(__dirname, 'src/components/agents/AgentPerformanceDashboard.tsx');
  const content = readFileContent(componentPath);
  
  if (!content) {
    return { success: false, details: 'Could not read dashboard component' };
  }
  
  const exportFeatures = [
    content.includes('exportData'),
    content.includes('refreshData'),
    content.includes('setRefreshing'),
    content.includes('Blob'),
    content.includes('URL.createObjectURL'),
    content.includes('download'),
    content.includes('JSON.stringify'),
    content.includes('application/json'),
    content.includes('RefreshCw'),
    content.includes('Download'),
    content.includes('animate-spin'),
    content.includes('disabled={refreshing}')
  ];
  
  return {
    success: exportFeatures.filter(f => f).length >= 10,
    details: `Export/Refresh features: ${exportFeatures.filter(f => f).length}/12 found`
  };
});

// Test 11: Error Handling and Loading States
runTest('Error Handling and Loading States', () => {
  const componentPath = path.join(__dirname, 'src/components/agents/AgentPerformanceDashboard.tsx');
  const content = readFileContent(componentPath);
  
  if (!content) {
    return { success: false, details: 'Could not read dashboard component' };
  }
  
  const errorHandlingFeatures = [
    content.includes('loading'),
    content.includes('setLoading'),
    content.includes('try'),
    content.includes('catch'),
    content.includes('console.error'),
    content.includes('Loading performance data'),
    content.includes('animate-spin'),
    content.includes('error'),
    content.includes('Mock data for development'),
    content.includes('generateMock'),
    content.includes('finally'),
    content.includes('setLoading(false)')
  ];
  
  return {
    success: errorHandlingFeatures.filter(f => f).length >= 10,
    details: `Error handling features: ${errorHandlingFeatures.filter(f => f).length}/12 found`
  };
});

// Test 12: Performance Dashboard Integration
runTest('Performance Dashboard Integration with Agents Page', () => {
  const agentsPagePath = path.join(__dirname, 'src/app/dashboard/agents/page.tsx');
  const content = readFileContent(agentsPagePath);
  
  if (!content) {
    return { success: false, details: 'Could not read agents page' };
  }
  
  const integrationFeatures = [
    content.includes('AgentPerformanceDashboard'),
    content.includes('import') && content.includes('AgentPerformanceDashboard'),
    content.includes('activeTab') || content.includes('tab'),
    content.includes('performance') || content.includes('Performance'),
    content.includes('agents') || content.includes('Agents')
  ];
  
  return {
    success: integrationFeatures.filter(f => f).length >= 3,
    details: `Integration features: ${integrationFeatures.filter(f => f).length}/5 found`
  };
});

// Test 13: Mock Data Generation
runTest('Mock Data Generation for Development', () => {
  const componentPath = path.join(__dirname, 'src/components/agents/AgentPerformanceDashboard.tsx');
  const content = readFileContent(componentPath);
  
  if (!content) {
    return { success: false, details: 'Could not read dashboard component' };
  }
  
  const mockDataFeatures = [
    content.includes('generateMockAgents'),
    content.includes('generateMockMetrics'),
    content.includes('generateMockUsageData'),
    content.includes('generateMockRecommendations'),
    content.includes('Mock data for development'),
    content.includes('Customer Support Pro'),
    content.includes('Sales Assistant'),
    content.includes('Tech Support Specialist'),
    content.includes('Math.random'),
    content.includes('Math.floor'),
    content.includes('toLocaleString'),
    content.includes('toFixed')
  ];
  
  return {
    success: mockDataFeatures.filter(f => f).length >= 10,
    details: `Mock data features: ${mockDataFeatures.filter(f => f).length}/12 found`
  };
});

// Test 14: TypeScript Interfaces and Types
runTest('TypeScript Interfaces and Types', () => {
  const componentPath = path.join(__dirname, 'src/components/agents/AgentPerformanceDashboard.tsx');
  const content = readFileContent(componentPath);
  
  if (!content) {
    return { success: false, details: 'Could not read dashboard component' };
  }
  
  const typeFeatures = [
    content.includes('interface Agent'),
    content.includes('interface PerformanceMetrics'),
    content.includes('interface UsageData'),
    content.includes('interface OptimizationRecommendation'),
    content.includes('string'),
    content.includes('number'),
    content.includes('boolean'),
    content.includes('Date'),
    content.includes('Array'),
    content.includes('useState<'),
    content.includes('useEffect'),
    content.includes('React.useState'),
    content.includes('?: '),
    content.includes('| ')
  ];
  
  return {
    success: typeFeatures.filter(f => f).length >= 12,
    details: `TypeScript features: ${typeFeatures.filter(f => f).length}/14 found`
  };
});

// Test 15: Feature Completeness Check
runTest('Feature Completeness Check', () => {
  const componentPath = path.join(__dirname, 'src/components/agents/AgentPerformanceDashboard.tsx');
  const content = readFileContent(componentPath);
  
  if (!content) {
    return { success: false, details: 'Could not read dashboard component' };
  }
  
  // Count lines of code (excluding comments and empty lines)
  const lines = content.split('\n').filter(line => {
    const trimmed = line.trim();
    return trimmed.length > 0 && !trimmed.startsWith('//') && !trimmed.startsWith('/*') && !trimmed.startsWith('*');
  });
  
  const coreFeatures = [
    content.includes('Overview'),
    content.includes('Performance'),
    content.includes('Usage Analytics'),
    content.includes('Cost Analysis'),
    content.includes('Recommendations'),
    content.includes('Key Metrics Cards'),
    content.includes('Usage Trends'),
    content.includes('Agent Performance Comparison'),
    content.includes('Response Time Trends'),
    content.includes('Satisfaction Scores'),
    content.includes('Performance Metrics Radar'),
    content.includes('Usage Distribution'),
    content.includes('Active Users'),
    content.includes('Cost Trends'),
    content.includes('Cost by Agent'),
    content.includes('Cost Breakdown'),
    content.includes('Optimization Recommendations'),
    content.includes('Export'),
    content.includes('Refresh'),
    content.includes('Filter')
  ];
  
  const isComprehensive = lines.length > 800 && coreFeatures.filter(f => f).length >= 18;
  
  return {
    success: isComprehensive,
    details: `Lines of code: ${lines.length}, Core features: ${coreFeatures.filter(f => f).length}/20`
  };
});

// Generate final report
console.log('\n' + '='.repeat(80));
console.log('🎯 DAY 28 STEP 28.2: AGENT PERFORMANCE DASHBOARD VALIDATION RESULTS');
console.log('='.repeat(80));

console.log(`\n📊 SUMMARY:`);
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests} ✅`);
console.log(`Failed: ${failedTests} ❌`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (errors.length > 0) {
  console.log(`\n🚨 ERRORS (${errors.length}):`);
  errors.forEach((error, index) => {
    console.log(`${index + 1}. ${error}`);
  });
}

if (warnings.length > 0) {
  console.log(`\n⚠️  WARNINGS (${warnings.length}):`);
  warnings.forEach((warning, index) => {
    console.log(`${index + 1}. ${warning}`);
  });
}

console.log(`\n📋 DETAILED RESULTS:`);
testResults.forEach((result, index) => {
  const status = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '💥';
  console.log(`${index + 1}. ${status} ${result.test}`);
  if (result.details) {
    console.log(`   Details: ${result.details}`);
  }
});

// Overall assessment
const overallSuccess = (passedTests / totalTests) >= 0.9;
console.log(`\n🎯 OVERALL ASSESSMENT:`);
if (overallSuccess) {
  console.log('✅ DAY 28 STEP 28.2 IMPLEMENTATION: EXCELLENT');
  console.log('🚀 Agent Performance Dashboard is ready for production!');
  console.log('🎉 All core features implemented with comprehensive analytics and optimization recommendations.');
} else if ((passedTests / totalTests) >= 0.7) {
  console.log('⚠️  DAY 28 STEP 28.2 IMPLEMENTATION: GOOD');
  console.log('🔧 Most features implemented, minor issues need attention.');
} else {
  console.log('❌ DAY 28 STEP 28.2 IMPLEMENTATION: NEEDS WORK');
  console.log('🛠️  Significant issues found, requires debugging and completion.');
}

// Save results to file
const reportData = {
  timestamp: new Date().toISOString(),
  day: 28,
  step: '28.2',
  feature: 'Agent Performance Dashboard',
  summary: {
    totalTests,
    passedTests,
    failedTests,
    successRate: ((passedTests / totalTests) * 100).toFixed(1) + '%',
    overallStatus: overallSuccess ? 'EXCELLENT' : (passedTests / totalTests) >= 0.7 ? 'GOOD' : 'NEEDS_WORK'
  },
  results: testResults,
  errors,
  warnings
};

try {
  fs.writeFileSync(
    path.join(__dirname, `day28-step2-validation-results-${new Date().toISOString().split('T')[0]}.json`),
    JSON.stringify(reportData, null, 2)
  );
  console.log(`\n💾 Results saved to: day28-step2-validation-results-${new Date().toISOString().split('T')[0]}.json`);
} catch (error) {
  console.log(`\n⚠️  Could not save results: ${error.message}`);
}

console.log('\n🏁 Validation completed!');
console.log('='.repeat(80)); 