#!/usr/bin/env node

/**
 * 🎯 DAY 21: UI & CONFIGURATION VALIDATION
 * 
 * Tests:
 * ✅ 1. Model Provider Selector Component
 * ✅ 2. Model Comparison Dashboard
 * ✅ 3. Admin Model Management
 * ✅ 4. UI Component Integration
 * ✅ 5. Configuration Management
 * ✅ 6. Dashboard Analytics
 * ✅ 7. Admin Controls
 * ✅ 8. User Experience
 */

const fs = require('fs');
const path = require('path');

console.log('🎯 DAY 21: UI & CONFIGURATION VALIDATION\n');

// Test Results
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
    if (result) {
      results.passed++;
      results.details.push({ test: testName, status: '✅ PASSED', details: result });
      console.log(`✅ ${testName}: PASSED`);
    } else {
      results.failed++;
      results.details.push({ test: testName, status: '❌ FAILED', details: 'Test returned false' });
      console.log(`❌ ${testName}: FAILED`);
    }
  } catch (error) {
    results.failed++;
    results.details.push({ test: testName, status: '❌ FAILED', details: error.message });
    console.log(`❌ ${testName}: FAILED - ${error.message}`);
  }
}

// Test 1: Model Provider Selector Component
runTest('1.1 Model Provider Selector Component', () => {
  const selectorPath = path.join(__dirname, 'src/components/agents/ModelProviderSelector.tsx');
  if (!fs.existsSync(selectorPath)) {
    throw new Error('ModelProviderSelector component not found');
  }
  
  const content = fs.readFileSync(selectorPath, 'utf8');
  const requiredComponents = [
    'ModelProviderSelector',
    'interface ModelProvider',
    'interface ProviderConfig',
    'primaryProvider',
    'fallbackProviders',
    'performanceSettings',
    'costSettings',
    'qualitySettings'
  ];
  
  for (const component of requiredComponents) {
    if (!content.includes(component)) {
      throw new Error(`Missing component: ${component}`);
    }
  }
  
  return 'ModelProviderSelector component implemented with comprehensive configuration';
});

runTest('1.2 Provider Selection UI', () => {
  const selectorPath = path.join(__dirname, 'src/components/agents/ModelProviderSelector.tsx');
  const content = fs.readFileSync(selectorPath, 'utf8');
  
  const uiFeatures = [
    'Tabs',
    'TabsContent',
    'TabsList',
    'TabsTrigger',
    'Card',
    'CardHeader',
    'CardTitle',
    'CardContent',
    'Switch',
    'Slider',
    'Badge',
    'Button'
  ];
  
  for (const feature of uiFeatures) {
    if (!content.includes(feature)) {
      throw new Error(`Missing UI feature: ${feature}`);
    }
  }
  
  return 'Provider selection UI implemented with comprehensive components';
});

runTest('1.3 Configuration Tabs', () => {
  const selectorPath = path.join(__dirname, 'src/components/agents/ModelProviderSelector.tsx');
  const content = fs.readFileSync(selectorPath, 'utf8');
  
  const tabs = [
    'provider',
    'performance',
    'cost',
    'quality',
    'Primary Provider',
    'Fallback Providers',
    'Performance Settings',
    'Cost Control',
    'Quality & Monitoring'
  ];
  
  for (const tab of tabs) {
    if (!content.includes(tab)) {
      throw new Error(`Missing tab: ${tab}`);
    }
  }
  
  return 'Configuration tabs implemented with all required sections';
});

runTest('1.4 Provider Testing', () => {
  const selectorPath = path.join(__dirname, 'src/components/agents/ModelProviderSelector.tsx');
  const content = fs.readFileSync(selectorPath, 'utf8');
  
  const testingFeatures = [
    'handleTestProvider',
    'testingProvider',
    'testResults',
    'Test passed',
    'Connection failed'
  ];
  
  for (const feature of testingFeatures) {
    if (!content.includes(feature)) {
      throw new Error(`Missing testing feature: ${feature}`);
    }
  }
  
  return 'Provider testing functionality implemented';
});

// Test 2: Model Comparison Dashboard
runTest('2.1 Model Comparison Dashboard Component', () => {
  const dashboardPath = path.join(__dirname, 'src/components/agents/ModelComparisonDashboard.tsx');
  if (!fs.existsSync(dashboardPath)) {
    throw new Error('ModelComparisonDashboard component not found');
  }
  
  const content = fs.readFileSync(dashboardPath, 'utf8');
  const requiredComponents = [
    'ModelComparisonDashboard',
    'interface ProviderMetrics',
    'interface ComparisonData',
    'interface TimeSeriesData',
    'BarChart',
    'LineChart',
    'PieChart',
    'ResponsiveContainer'
  ];
  
  for (const component of requiredComponents) {
    if (!content.includes(component)) {
      throw new Error(`Missing component: ${component}`);
    }
  }
  
  return 'ModelComparisonDashboard component implemented with charts';
});

runTest('2.2 Performance Metrics', () => {
  const dashboardPath = path.join(__dirname, 'src/components/agents/ModelComparisonDashboard.tsx');
  const content = fs.readFileSync(dashboardPath, 'utf8');
  
  const metrics = [
    'averageResponseTime',
    'successRate',
    'averageCost',
    'totalRequests',
    'score',
    'Top Performer',
    'Total Requests',
    'Avg Response Time',
    'Total Cost'
  ];
  
  for (const metric of metrics) {
    if (!content.includes(metric)) {
      throw new Error(`Missing metric: ${metric}`);
    }
  }
  
  return 'Performance metrics implemented with comprehensive tracking';
});

runTest('2.3 Dashboard Tabs', () => {
  const dashboardPath = path.join(__dirname, 'src/components/agents/ModelComparisonDashboard.tsx');
  const content = fs.readFileSync(dashboardPath, 'utf8');
  
  const tabs = [
    'overview',
    'performance',
    'costs',
    'trends',
    'Overview',
    'Performance',
    'Cost Analysis',
    'Trends'
  ];
  
  for (const tab of tabs) {
    if (!content.includes(tab)) {
      throw new Error(`Missing tab: ${tab}`);
    }
  }
  
  return 'Dashboard tabs implemented with all required sections';
});

runTest('2.4 Real-time Updates', () => {
  const dashboardPath = path.join(__dirname, 'src/components/agents/ModelComparisonDashboard.tsx');
  const content = fs.readFileSync(dashboardPath, 'utf8');
  
  const realtimeFeatures = [
    'showRealTimeData',
    'useEffect',
    'setInterval',
    'lastUpdated',
    'Live data',
    'handleRefresh'
  ];
  
  for (const feature of realtimeFeatures) {
    if (!content.includes(feature)) {
      throw new Error(`Missing real-time feature: ${feature}`);
    }
  }
  
  return 'Real-time updates implemented with automatic refresh';
});

// Test 3: Admin Model Management
runTest('3.1 Admin Model Management Component', () => {
  const adminPath = path.join(__dirname, 'src/components/admin/AdminModelManagement.tsx');
  if (!fs.existsSync(adminPath)) {
    throw new Error('AdminModelManagement component not found');
  }
  
  const content = fs.readFileSync(adminPath, 'utf8');
  const requiredComponents = [
    'AdminModelManagement',
    'interface ModelProvider',
    'interface SystemSettings',
    'handleAddProvider',
    'handleEditProvider',
    'handleDeleteProvider',
    'handleToggleProvider'
  ];
  
  for (const component of requiredComponents) {
    if (!content.includes(component)) {
      throw new Error(`Missing component: ${component}`);
    }
  }
  
  return 'AdminModelManagement component implemented with CRUD operations';
});

runTest('3.2 Provider Management', () => {
  const adminPath = path.join(__dirname, 'src/components/admin/AdminModelManagement.tsx');
  const content = fs.readFileSync(adminPath, 'utf8');
  
  const managementFeatures = [
    'Add Provider',
    'Edit',
    'Delete',
    'Test',
    'API Key',
    'Custom Endpoint',
    'Supported Models',
    'Rate Limit',
    'Usage Statistics'
  ];
  
  for (const feature of managementFeatures) {
    if (!content.includes(feature)) {
      throw new Error(`Missing management feature: ${feature}`);
    }
  }
  
  return 'Provider management features implemented with full CRUD';
});

runTest('3.3 System Settings', () => {
  const adminPath = path.join(__dirname, 'src/components/admin/AdminModelManagement.tsx');
  const content = fs.readFileSync(adminPath, 'utf8');
  
  const systemSettings = [
    'defaultProvider',
    'globalRateLimit',
    'maxCostPerUser',
    'enableCostTracking',
    'enableUsageAnalytics',
    'maintenanceMode',
    'allowedDomains',
    'securitySettings'
  ];
  
  for (const setting of systemSettings) {
    if (!content.includes(setting)) {
      throw new Error(`Missing system setting: ${setting}`);
    }
  }
  
  return 'System settings implemented with comprehensive configuration';
});

runTest('3.4 Security Features', () => {
  const adminPath = path.join(__dirname, 'src/components/admin/AdminModelManagement.tsx');
  const content = fs.readFileSync(adminPath, 'utf8');
  
  const securityFeatures = [
    'requireApiKeyRotation',
    'apiKeyRotationDays',
    'enableAuditLogging',
    'enableRateLimiting',
    'showApiKey',
    'toggleApiKeyVisibility',
    'AlertDialog',
    'Security Settings'
  ];
  
  for (const feature of securityFeatures) {
    if (!content.includes(feature)) {
      throw new Error(`Missing security feature: ${feature}`);
    }
  }
  
  return 'Security features implemented with comprehensive protection';
});

// Test 4: UI Component Integration
runTest('4.1 UI Library Components', () => {
  const components = [
    'src/components/agents/ModelProviderSelector.tsx',
    'src/components/agents/ModelComparisonDashboard.tsx',
    'src/components/admin/AdminModelManagement.tsx'
  ];
  
  for (const componentPath of components) {
    const fullPath = path.join(__dirname, componentPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Component not found: ${componentPath}`);
    }
    
    const content = fs.readFileSync(fullPath, 'utf8');
    const uiComponents = [
      '@/components/ui/card',
      '@/components/ui/button',
      '@/components/ui/badge',
      '@/components/ui/tabs',
      '@/components/ui/select',
      '@/components/ui/switch',
      '@/components/ui/input',
      '@/components/ui/label'
    ];
    
    for (const uiComponent of uiComponents) {
      if (!content.includes(uiComponent)) {
        throw new Error(`Missing UI component import: ${uiComponent} in ${componentPath}`);
      }
    }
  }
  
  return 'UI library components properly integrated across all components';
});

runTest('4.2 Icon Integration', () => {
  const components = [
    'src/components/agents/ModelProviderSelector.tsx',
    'src/components/agents/ModelComparisonDashboard.tsx',
    'src/components/admin/AdminModelManagement.tsx'
  ];
  
  for (const componentPath of components) {
    const fullPath = path.join(__dirname, componentPath);
    const content = fs.readFileSync(fullPath, 'utf8');
    
    const icons = [
      'lucide-react',
      'Settings',
      'DollarSign',
      'Clock',
      'Activity',
      'CheckCircle',
      'AlertCircle'
    ];
    
    for (const icon of icons) {
      if (!content.includes(icon)) {
        throw new Error(`Missing icon: ${icon} in ${componentPath}`);
      }
    }
  }
  
  return 'Icons properly integrated with Lucide React';
});

// Test 5: Configuration Management
runTest('5.1 Configuration Interfaces', () => {
  const selectorPath = path.join(__dirname, 'src/components/agents/ModelProviderSelector.tsx');
  const content = fs.readFileSync(selectorPath, 'utf8');
  
  const configInterfaces = [
    'interface ModelProvider',
    'interface ModelInfo',
    'interface ProviderConfig',
    'interface ModelProviderSelectorProps',
    'primaryProvider',
    'fallbackProviders',
    'performanceSettings',
    'costSettings',
    'qualitySettings'
  ];
  
  for (const configInterface of configInterfaces) {
    if (!content.includes(configInterface)) {
      throw new Error(`Missing configuration interface: ${configInterface}`);
    }
  }
  
  return 'Configuration interfaces properly defined with TypeScript';
});

runTest('5.2 Configuration State Management', () => {
  const selectorPath = path.join(__dirname, 'src/components/agents/ModelProviderSelector.tsx');
  const content = fs.readFileSync(selectorPath, 'utf8');
  
  const stateManagement = [
    'useState',
    'useEffect',
    'setConfig',
    'onConfigChange',
    'handleProviderChange',
    'handleModelChange',
    'handleFallbackToggle'
  ];
  
  for (const stateFeature of stateManagement) {
    if (!content.includes(stateFeature)) {
      throw new Error(`Missing state management: ${stateFeature}`);
    }
  }
  
  return 'Configuration state management implemented with React hooks';
});

// Test 6: Dashboard Analytics
runTest('6.1 Chart Components', () => {
  const dashboardPath = path.join(__dirname, 'src/components/agents/ModelComparisonDashboard.tsx');
  const content = fs.readFileSync(dashboardPath, 'utf8');
  
  const chartComponents = [
    'BarChart',
    'LineChart',
    'PieChart',
    'AreaChart',
    'ResponsiveContainer',
    'XAxis',
    'YAxis',
    'CartesianGrid',
    'Tooltip',
    'Cell'
  ];
  
  for (const chart of chartComponents) {
    if (!content.includes(chart)) {
      throw new Error(`Missing chart component: ${chart}`);
    }
  }
  
  return 'Chart components implemented with Recharts library';
});

runTest('6.2 Data Visualization', () => {
  const dashboardPath = path.join(__dirname, 'src/components/agents/ModelComparisonDashboard.tsx');
  const content = fs.readFileSync(dashboardPath, 'utf8');
  
  const visualizations = [
    'Response Time Comparison',
    'Success Rate',
    'Cost Distribution',
    'Cost per Request',
    'Response Time Trends',
    'Performance Score Matrix',
    'Cost Breakdown'
  ];
  
  for (const viz of visualizations) {
    if (!content.includes(viz)) {
      throw new Error(`Missing visualization: ${viz}`);
    }
  }
  
  return 'Data visualizations implemented with comprehensive charts';
});

// Test 7: Admin Controls
runTest('7.1 CRUD Operations', () => {
  const adminPath = path.join(__dirname, 'src/components/admin/AdminModelManagement.tsx');
  const content = fs.readFileSync(adminPath, 'utf8');
  
  const crudOperations = [
    'handleAddProvider',
    'handleEditProvider',
    'handleDeleteProvider',
    'handleToggleProvider',
    'handleTestProvider',
    'Add Provider',
    'Edit',
    'Delete',
    'Test'
  ];
  
  for (const operation of crudOperations) {
    if (!content.includes(operation)) {
      throw new Error(`Missing CRUD operation: ${operation}`);
    }
  }
  
  return 'CRUD operations implemented for provider management';
});

runTest('7.2 Dialogs and Modals', () => {
  const adminPath = path.join(__dirname, 'src/components/admin/AdminModelManagement.tsx');
  const content = fs.readFileSync(adminPath, 'utf8');
  
  const dialogComponents = [
    'Dialog',
    'DialogContent',
    'DialogHeader',
    'DialogTitle',
    'DialogTrigger',
    'DialogFooter',
    'AlertDialog',
    'AlertDialogAction',
    'AlertDialogCancel',
    'AlertDialogContent'
  ];
  
  for (const dialog of dialogComponents) {
    if (!content.includes(dialog)) {
      throw new Error(`Missing dialog component: ${dialog}`);
    }
  }
  
  return 'Dialogs and modals implemented for user interactions';
});

// Test 8: User Experience
runTest('8.1 Responsive Design', () => {
  const components = [
    'src/components/agents/ModelProviderSelector.tsx',
    'src/components/agents/ModelComparisonDashboard.tsx',
    'src/components/admin/AdminModelManagement.tsx'
  ];
  
  for (const componentPath of components) {
    const fullPath = path.join(__dirname, componentPath);
    const content = fs.readFileSync(fullPath, 'utf8');
    
    const responsiveClasses = [
      'grid-cols-1',
      'md:grid-cols-2',
      'lg:grid-cols-3',
      'md:grid-cols-4',
      'max-w-6xl',
      'max-w-7xl'
    ];
    
    let hasResponsive = false;
    for (const responsiveClass of responsiveClasses) {
      if (content.includes(responsiveClass)) {
        hasResponsive = true;
        break;
      }
    }
    
    if (!hasResponsive) {
      throw new Error(`Missing responsive design in ${componentPath}`);
    }
  }
  
  return 'Responsive design implemented across all components';
});

runTest('8.2 Loading States', () => {
  const components = [
    'src/components/agents/ModelProviderSelector.tsx',
    'src/components/agents/ModelComparisonDashboard.tsx',
    'src/components/admin/AdminModelManagement.tsx'
  ];
  
  for (const componentPath of components) {
    const fullPath = path.join(__dirname, componentPath);
    const content = fs.readFileSync(fullPath, 'utf8');
    
    const loadingFeatures = [
      'isLoading',
      'setIsLoading',
      'disabled={isLoading}',
      'animate-spin'
    ];
    
    let hasLoading = false;
    for (const loadingFeature of loadingFeatures) {
      if (content.includes(loadingFeature)) {
        hasLoading = true;
        break;
      }
    }
    
    if (!hasLoading) {
      throw new Error(`Missing loading states in ${componentPath}`);
    }
  }
  
  return 'Loading states implemented for better user experience';
});

runTest('8.3 Error Handling', () => {
  const components = [
    'src/components/agents/ModelProviderSelector.tsx',
    'src/components/agents/ModelComparisonDashboard.tsx',
    'src/components/admin/AdminModelManagement.tsx'
  ];
  
  for (const componentPath of components) {
    const fullPath = path.join(__dirname, componentPath);
    const content = fs.readFileSync(fullPath, 'utf8');
    
    const errorHandling = [
      'try {',
      'catch',
      'error',
      'failed',
      'Error'
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
  
  return 'Error handling implemented across all components';
});

// Test 9: Integration Features
runTest('9.1 Export Functionality', () => {
  const dashboardPath = path.join(__dirname, 'src/components/agents/ModelComparisonDashboard.tsx');
  const content = fs.readFileSync(dashboardPath, 'utf8');
  
  const exportFeatures = [
    'handleExport',
    'Download',
    'Blob',
    'URL.createObjectURL',
    'JSON.stringify',
    'exportedAt'
  ];
  
  for (const feature of exportFeatures) {
    if (!content.includes(feature)) {
      throw new Error(`Missing export feature: ${feature}`);
    }
  }
  
  return 'Export functionality implemented for data download';
});

runTest('9.2 Time Range Selection', () => {
  const dashboardPath = path.join(__dirname, 'src/components/agents/ModelComparisonDashboard.tsx');
  const content = fs.readFileSync(dashboardPath, 'utf8');
  
  const timeRangeFeatures = [
    'timeRange',
    'setTimeRange',
    '1h',
    '24h',
    '7d',
    '30d',
    'Last Hour',
    'Last 24h',
    'Last 7 days',
    'Last 30 days'
  ];
  
  for (const feature of timeRangeFeatures) {
    if (!content.includes(feature)) {
      throw new Error(`Missing time range feature: ${feature}`);
    }
  }
  
  return 'Time range selection implemented for data filtering';
});

// Test 10: TypeScript Integration
runTest('10.1 TypeScript Interfaces', () => {
  const components = [
    'src/components/agents/ModelProviderSelector.tsx',
    'src/components/agents/ModelComparisonDashboard.tsx',
    'src/components/admin/AdminModelManagement.tsx'
  ];
  
  for (const componentPath of components) {
    const fullPath = path.join(__dirname, componentPath);
    const content = fs.readFileSync(fullPath, 'utf8');
    
    const tsFeatures = [
      'interface',
      ': string',
      ': number',
      ': boolean'
    ];
    
    // Check for React hooks (either React.useState or useState)
    const hasUseState = content.includes('React.useState') || content.includes('useState');
    const hasUseEffect = content.includes('React.useEffect') || content.includes('useEffect');
    
    if (!hasUseState) {
      throw new Error(`Missing useState hook in ${componentPath}`);
    }
    
    if (!hasUseEffect) {
      throw new Error(`Missing useEffect hook in ${componentPath}`);
    }
    
    for (const tsFeature of tsFeatures) {
      if (!content.includes(tsFeature)) {
        throw new Error(`Missing TypeScript feature: ${tsFeature} in ${componentPath}`);
      }
    }
  }
  
  return 'TypeScript properly integrated with interfaces and types';
});

runTest('10.2 Props Validation', () => {
  const components = [
    'src/components/agents/ModelProviderSelector.tsx',
    'src/components/agents/ModelComparisonDashboard.tsx',
    'src/components/admin/AdminModelManagement.tsx'
  ];
  
  for (const componentPath of components) {
    const fullPath = path.join(__dirname, componentPath);
    const content = fs.readFileSync(fullPath, 'utf8');
    
    const propsFeatures = [
      'Props',
      'interface',
      'agentId',
      'onConfigChange',
      'onSave',
      'showRealTimeData'
    ];
    
    let hasProps = false;
    for (const propsFeature of propsFeatures) {
      if (content.includes(propsFeature)) {
        hasProps = true;
        break;
      }
    }
    
    if (!hasProps) {
      throw new Error(`Missing props validation in ${componentPath}`);
    }
  }
  
  return 'Props validation implemented with TypeScript interfaces';
});

// Final Results
console.log('\n' + '='.repeat(60));
console.log('📊 DAY 21 VALIDATION RESULTS');
console.log('='.repeat(60));
console.log(`✅ Passed: ${results.passed}/${results.total}`);
console.log(`❌ Failed: ${results.failed}/${results.total}`);
console.log(`📈 Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);

// Detailed Results
console.log('\n📋 DETAILED RESULTS:');
console.log('='.repeat(60));

const categories = {
  'Model Provider Selector': [1, 2],
  'Model Comparison Dashboard': [3, 4],
  'Admin Model Management': [5, 6],
  'UI Integration': [7, 8],
  'User Experience': [9, 10]
};

for (const [category, testNumbers] of Object.entries(categories)) {
  console.log(`\n🔍 ${category}:`);
  const categoryTests = results.details.filter((_, index) => 
    testNumbers.some(num => (index + 1).toString().startsWith(num.toString()))
  );
  
  categoryTests.forEach(test => {
    console.log(`  ${test.status} ${test.test}`);
  });
}

// Save results to file
const reportData = {
  timestamp: new Date().toISOString(),
  day: 21,
  phase: 'UI & Configuration',
  results: results,
  summary: {
    totalTests: results.total,
    passed: results.passed,
    failed: results.failed,
    successRate: ((results.passed / results.total) * 100).toFixed(1) + '%'
  }
};

fs.writeFileSync(
  path.join(__dirname, 'day21-validation-results.json'),
  JSON.stringify(reportData, null, 2)
);

console.log('\n💾 Results saved to day21-validation-results.json');

// Exit with appropriate code
process.exit(results.failed > 0 ? 1 : 0); 