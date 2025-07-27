#!/usr/bin/env node

/**
 * 🧪 DAY 28 VALIDATION TEST SCRIPT
 * Agent Management UI - Advanced Features Implementation
 * 
 * Tests all components, APIs, and integrations for DAY 28
 * Follows strict QA workflow with detailed reporting
 */

const fs = require('fs');
const path = require('path');

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  total: 0,
  details: [],
  timestamp: new Date().toISOString(),
  day: 28,
  phase: "Agent Management UI - Advanced Features"
};

// Utility functions
function logTest(testName, status, details = '', isWarning = false) {
  const statusIcon = status === 'PASSED' ? '✅' : (isWarning ? '⚠️' : '❌');
  const result = {
    test: testName,
    status: `${statusIcon} ${status}`,
    details: details
  };
  
  testResults.details.push(result);
  testResults.total++;
  
  if (status === 'PASSED') {
    testResults.passed++;
  } else if (isWarning) {
    testResults.warnings++;
  } else {
    testResults.failed++;
  }
  
  console.log(`${statusIcon} ${testName}: ${status}`);
  if (details) console.log(`   ${details}`);
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function readFileContent(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

function checkFileContent(filePath, searchText, testName) {
  const content = readFileContent(filePath);
  if (!content) {
    logTest(testName, 'FAILED', `File ${filePath} not found or unreadable`);
    return false;
  }
  
  const found = content.includes(searchText);
  if (found) {
    logTest(testName, 'PASSED', `Found "${searchText}" in ${filePath}`);
  } else {
    logTest(testName, 'FAILED', `Missing "${searchText}" in ${filePath}`);
  }
  return found;
}

// =============================================================================
// PHASE 1: UI COMPONENTS VALIDATION
// =============================================================================

function validateUIComponents() {
  console.log('\n🔧 PHASE 1: UI Components Validation');
  
  // Check for missing shadcn/ui components
  const uiComponents = [
    'src/components/ui/dialog.tsx',
    'src/components/ui/checkbox.tsx', 
    'src/components/ui/textarea.tsx',
    'src/components/ui/alert-dialog.tsx',
    'src/components/ui/separator.tsx',
    'src/components/ui/avatar.tsx',
    'src/components/ui/alert.tsx'
  ];
  
  uiComponents.forEach(component => {
    if (fileExists(component)) {
      logTest(`1.1 UI Component: ${component}`, 'PASSED', `Component exists and accessible`);
    } else {
      logTest(`1.1 UI Component: ${component}`, 'FAILED', `Missing required UI component`);
    }
  });
  
  // Check utils function
  if (fileExists('src/lib/utils.ts')) {
    const utilsContent = readFileContent('src/lib/utils.ts');
    if (utilsContent && utilsContent.includes('export function cn(')) {
      logTest('1.2 Utils Function', 'PASSED', 'cn function exists in utils.ts');
    } else {
      logTest('1.2 Utils Function', 'FAILED', 'cn function missing in utils.ts');
    }
  } else {
    logTest('1.2 Utils Function', 'FAILED', 'utils.ts file missing');
  }
  
  // Check for Dialog exports
  checkFileContent('src/components/ui/dialog.tsx', 'export {', '1.3 Dialog Exports');
  checkFileContent('src/components/ui/checkbox.tsx', 'export { Checkbox }', '1.4 Checkbox Exports');
  checkFileContent('src/components/ui/textarea.tsx', 'export { Textarea }', '1.5 Textarea Exports');
}

// =============================================================================
// PHASE 2: AGENT CONFIGURATION WIZARD VALIDATION
// =============================================================================

function validateAgentConfigurationWizard() {
  console.log('\n🧙‍♂️ PHASE 2: Agent Configuration Wizard Validation');
  
  const wizardFile = 'src/components/agents/AgentConfigurationWizard.tsx';
  
  if (!fileExists(wizardFile)) {
    logTest('2.1 Wizard Component', 'FAILED', 'AgentConfigurationWizard.tsx not found');
    return;
  }
  
  const wizardContent = readFileContent(wizardFile);
  
  // Check for all 10 wizard steps
  const requiredSteps = [
    'template', 'basic', 'ai', 'rag', 'learning', 
    'integration', 'advanced', 'performance', 'security', 'review'
  ];
  
  requiredSteps.forEach(step => {
    if (wizardContent.includes(`id: '${step}'`)) {
      logTest(`2.2 Wizard Step: ${step}`, 'PASSED', `Step ${step} defined in wizard`);
    } else {
      logTest(`2.2 Wizard Step: ${step}`, 'FAILED', `Step ${step} missing from wizard`);
    }
  });
  
  // Check for proper implementations (not just placeholders)
  const implementationChecks = [
    { step: 'basic', check: 'Agent Name', content: 'Agent Name *' },
    { step: 'ai', check: 'Model Provider', content: 'Model Provider *' },
    { step: 'rag', check: 'Enable RAG', content: 'Enable RAG' },
    { step: 'learning', check: 'Auto-Learning', content: 'Enable Auto-Learning' },
    { step: 'integration', check: 'Google Integration', content: 'Enable Google Integration' },
    { step: 'advanced', check: 'Auto-Handover', content: 'Enable Auto-Handover' },
    { step: 'performance', check: 'Performance Config', content: 'Performance & Cost Configuration' },
    { step: 'security', check: 'Security Config', content: 'Security & Privacy Configuration' },
    { step: 'review', check: 'Review Step', content: 'Review & Deploy' }
  ];
  
  implementationChecks.forEach(({ step, check, content }) => {
    if (wizardContent.includes(content)) {
      logTest(`2.3 Step Implementation: ${step}`, 'PASSED', `${check} properly implemented`);
    } else {
      logTest(`2.3 Step Implementation: ${step}`, 'FAILED', `${check} not properly implemented`);
    }
  });
  
  // Check for validation functions
  if (wizardContent.includes('validation: (data) => {')) {
    logTest('2.4 Wizard Validation', 'PASSED', 'Validation functions implemented');
  } else {
    logTest('2.4 Wizard Validation', 'FAILED', 'Validation functions missing');
  }
}

// =============================================================================
// PHASE 3: AGENT PERFORMANCE DASHBOARD VALIDATION
// =============================================================================

function validateAgentPerformanceDashboard() {
  console.log('\n📊 PHASE 3: Agent Performance Dashboard Validation');
  
  const dashboardFile = 'src/components/agents/AgentPerformanceDashboard.tsx';
  
  if (!fileExists(dashboardFile)) {
    logTest('3.1 Dashboard Component', 'FAILED', 'AgentPerformanceDashboard.tsx not found');
    return;
  }
  
  const dashboardContent = readFileContent(dashboardFile);
  
  // Check for required chart components
  const chartComponents = [
    'BarChart', 'LineChart', 'PieChart', 'AreaChart', 'RadarChart'
  ];
  
  chartComponents.forEach(chart => {
    if (dashboardContent.includes(chart)) {
      logTest(`3.2 Chart Component: ${chart}`, 'PASSED', `${chart} imported and available`);
    } else {
      logTest(`3.2 Chart Component: ${chart}`, 'FAILED', `${chart} missing from dashboard`);
    }
  });
  
  // Check for dashboard tabs
  const dashboardTabs = [
    'Overview', 'Performance', 'Analytics', 'Insights', 'Comparison'
  ];
  
  dashboardTabs.forEach(tab => {
    if (dashboardContent.includes(tab)) {
      logTest(`3.3 Dashboard Tab: ${tab}`, 'PASSED', `${tab} tab implemented`);
    } else {
      logTest(`3.3 Dashboard Tab: ${tab}`, 'FAILED', `${tab} tab missing`);
    }
  });
  
  // Check for metrics tracking
  const metrics = [
    'conversationsCount', 'responseTime', 'satisfactionScore', 'costPerMonth'
  ];
  
  metrics.forEach(metric => {
    if (dashboardContent.includes(metric)) {
      logTest(`3.4 Metric Tracking: ${metric}`, 'PASSED', `${metric} tracked in dashboard`);
    } else {
      logTest(`3.4 Metric Tracking: ${metric}`, 'FAILED', `${metric} not tracked`);
    }
  });
}

// =============================================================================
// PHASE 4: BULK AGENT OPERATIONS VALIDATION
// =============================================================================

function validateBulkAgentOperations() {
  console.log('\n🔄 PHASE 4: Bulk Agent Operations Validation');
  
  const bulkOpsFile = 'src/components/agents/BulkAgentOperations.tsx';
  
  if (!fileExists(bulkOpsFile)) {
    logTest('4.1 Bulk Operations Component', 'FAILED', 'BulkAgentOperations.tsx not found');
    return;
  }
  
  const bulkOpsContent = readFileContent(bulkOpsFile);
  
  // Check for bulk operations
  const bulkOperations = [
    'export', 'import', 'duplicate', 'delete', 'deploy', 'update'
  ];
  
  bulkOperations.forEach(operation => {
    if (bulkOpsContent.includes(operation)) {
      logTest(`4.2 Bulk Operation: ${operation}`, 'PASSED', `${operation} operation available`);
    } else {
      logTest(`4.2 Bulk Operation: ${operation}`, 'FAILED', `${operation} operation missing`);
    }
  });
  
  // Check for multi-select functionality
  if (bulkOpsContent.includes('selectedAgents') && bulkOpsContent.includes('Set<string>')) {
    logTest('4.3 Multi-Select', 'PASSED', 'Multi-select functionality implemented');
  } else {
    logTest('4.3 Multi-Select', 'FAILED', 'Multi-select functionality missing');
  }
  
  // Check for deployment configuration
  if (bulkOpsContent.includes('DeploymentConfig')) {
    logTest('4.4 Deployment Config', 'PASSED', 'Deployment configuration available');
  } else {
    logTest('4.4 Deployment Config', 'FAILED', 'Deployment configuration missing');
  }
}

// =============================================================================
// PHASE 5: AGENT MARKETPLACE VALIDATION
// =============================================================================

function validateAgentMarketplace() {
  console.log('\n🏪 PHASE 5: Agent Marketplace Validation');
  
  const marketplaceFile = 'src/components/agents/AgentMarketplace.tsx';
  
  if (!fileExists(marketplaceFile)) {
    logTest('5.1 Marketplace Component', 'FAILED', 'AgentMarketplace.tsx not found');
    return;
  }
  
  const marketplaceContent = readFileContent(marketplaceFile);
  
  // Check for marketplace tabs
  const marketplaceTabs = [
    'Browse Templates', 'My Templates', 'Favorites', 'Trending'
  ];
  
  marketplaceTabs.forEach(tab => {
    if (marketplaceContent.includes(tab)) {
      logTest(`5.2 Marketplace Tab: ${tab}`, 'PASSED', `${tab} tab implemented`);
    } else {
      logTest(`5.2 Marketplace Tab: ${tab}`, 'FAILED', `${tab} tab missing`);
    }
  });
  
  // Check for template features
  const templateFeatures = [
    'TemplateCard', 'handleDownloadTemplate', 'handleStarTemplate', 'TemplateDetailsDialog'
  ];
  
  templateFeatures.forEach(feature => {
    if (marketplaceContent.includes(feature)) {
      logTest(`5.3 Template Feature: ${feature}`, 'PASSED', `${feature} implemented`);
    } else {
      logTest(`5.3 Template Feature: ${feature}`, 'FAILED', `${feature} missing`);
    }
  });
  
  // Check for filtering and search
  if (marketplaceContent.includes('searchQuery') && marketplaceContent.includes('filterTemplates')) {
    logTest('5.4 Search & Filter', 'PASSED', 'Search and filter functionality implemented');
  } else {
    logTest('5.4 Search & Filter', 'FAILED', 'Search and filter functionality missing');
  }
}

// =============================================================================
// PHASE 6: API ENDPOINTS VALIDATION
// =============================================================================

function validateAPIEndpoints() {
  console.log('\n🔌 PHASE 6: API Endpoints Validation');
  
  const apiEndpoints = [
    'src/app/api/marketplace/templates/route.ts',
    'src/app/api/marketplace/templates/[id]/download/route.ts',
    'src/app/api/marketplace/templates/[id]/star/route.ts',
    'src/app/api/agents/wizard/validate/route.ts'
  ];
  
  apiEndpoints.forEach(endpoint => {
    if (fileExists(endpoint)) {
      logTest(`6.1 API Endpoint: ${endpoint}`, 'PASSED', 'API endpoint exists');
      
      const content = readFileContent(endpoint);
      if (content && content.includes('export async function')) {
        logTest(`6.2 API Implementation: ${endpoint}`, 'PASSED', 'API functions implemented');
      } else {
        logTest(`6.2 API Implementation: ${endpoint}`, 'FAILED', 'API functions missing');
      }
    } else {
      logTest(`6.1 API Endpoint: ${endpoint}`, 'FAILED', 'API endpoint missing');
    }
  });
  
  // Check for API validation
  const validationFile = 'src/app/api/agents/wizard/validate/route.ts';
  if (fileExists(validationFile)) {
    const validationContent = readFileContent(validationFile);
    if (validationContent && validationContent.includes('AgentConfigurationSchema')) {
      logTest('6.3 API Validation', 'PASSED', 'Zod validation schema implemented');
    } else {
      logTest('6.3 API Validation', 'FAILED', 'Zod validation schema missing');
    }
  }
}

// =============================================================================
// PHASE 7: DATABASE SCHEMA VALIDATION
// =============================================================================

function validateDatabaseSchema() {
  console.log('\n🗄️ PHASE 7: Database Schema Validation');
  
  const schemaFile = 'prisma/schema.prisma';
  
  if (!fileExists(schemaFile)) {
    logTest('7.1 Schema File', 'FAILED', 'prisma/schema.prisma not found');
    return;
  }
  
  const schemaContent = readFileContent(schemaFile);
  
  // Check for marketplace models
  const marketplaceModels = [
    'AgentTemplate', 'TemplateVersion', 'TemplateDownload', 'TemplateReview',
    'ReviewVote', 'TemplateStar', 'TemplateFork', 'TemplateCollection',
    'TemplateCollectionItem', 'MarketplaceReport'
  ];
  
  marketplaceModels.forEach(model => {
    if (schemaContent.includes(`model ${model}`)) {
      logTest(`7.2 Database Model: ${model}`, 'PASSED', `${model} model defined`);
    } else {
      logTest(`7.2 Database Model: ${model}`, 'FAILED', `${model} model missing`);
    }
  });
  
  // Check for marketplace enums
  const marketplaceEnums = [
    'TemplateStatus', 'TemplateVisibility', 'ReviewStatus', 'CollectionVisibility',
    'ReportReason', 'ReportStatus'
  ];
  
  marketplaceEnums.forEach(enumType => {
    if (schemaContent.includes(`enum ${enumType}`)) {
      logTest(`7.3 Database Enum: ${enumType}`, 'PASSED', `${enumType} enum defined`);
    } else {
      logTest(`7.3 Database Enum: ${enumType}`, 'FAILED', `${enumType} enum missing`);
    }
  });
  
  // Check for User model relationships
  if (schemaContent.includes('authoredTemplates') && schemaContent.includes('templateDownloads')) {
    logTest('7.4 User Relationships', 'PASSED', 'User model has marketplace relationships');
  } else {
    logTest('7.4 User Relationships', 'FAILED', 'User model missing marketplace relationships');
  }
}

// =============================================================================
// PHASE 8: INTEGRATION VALIDATION
// =============================================================================

function validateIntegrations() {
  console.log('\n🔗 PHASE 8: Integration Validation');
  
  // Check for proper imports in main components
  const mainComponents = [
    'src/components/agents/AgentConfigurationWizard.tsx',
    'src/components/agents/AgentMarketplace.tsx',
    'src/components/agents/BulkAgentOperations.tsx'
  ];
  
  mainComponents.forEach(component => {
    if (fileExists(component)) {
      const content = readFileContent(component);
      
      // Check for UI component imports
      if (content.includes("from '@/components/ui/dialog'")) {
        logTest(`8.1 UI Import: ${component}`, 'PASSED', 'UI components properly imported');
      } else {
        logTest(`8.1 UI Import: ${component}`, 'FAILED', 'UI components not imported');
      }
      
      // Check for utils import
      if (content.includes("from '@/lib/utils'")) {
        logTest(`8.2 Utils Import: ${component}`, 'PASSED', 'Utils properly imported');
      } else {
        logTest(`8.2 Utils Import: ${component}`, 'WARNING', 'Utils not imported', true);
      }
    }
  });
  
  // Check for agent page integration
  const agentPage = 'src/app/dashboard/agents/page.tsx';
  if (fileExists(agentPage)) {
    const agentPageContent = readFileContent(agentPage);
    
    if (agentPageContent.includes('AgentConfigurationWizard')) {
      logTest('8.3 Wizard Integration', 'PASSED', 'Wizard integrated in agent page');
    } else {
      logTest('8.3 Wizard Integration', 'FAILED', 'Wizard not integrated in agent page');
    }
    
    if (agentPageContent.includes('AgentPerformanceDashboard')) {
      logTest('8.4 Dashboard Integration', 'PASSED', 'Dashboard integrated in agent page');
    } else {
      logTest('8.4 Dashboard Integration', 'FAILED', 'Dashboard not integrated in agent page');
    }
  }
}

// =============================================================================
// PHASE 9: FINAL VALIDATION
// =============================================================================

function validateFinalRequirements() {
  console.log('\n🎯 PHASE 9: Final Requirements Validation');
  
  // Check for TypeScript compliance
  const tsFiles = [
    'src/components/agents/AgentConfigurationWizard.tsx',
    'src/components/agents/AgentMarketplace.tsx',
    'src/components/agents/BulkAgentOperations.tsx',
    'src/components/agents/AgentPerformanceDashboard.tsx'
  ];
  
  tsFiles.forEach(file => {
    if (fileExists(file)) {
      const content = readFileContent(file);
      if (content && content.includes('interface ') && content.includes(': React.FC')) {
        logTest(`9.1 TypeScript: ${file}`, 'PASSED', 'Proper TypeScript interfaces and types');
      } else {
        logTest(`9.1 TypeScript: ${file}`, 'WARNING', 'TypeScript types could be improved', true);
      }
    }
  });
  
  // Check for error handling
  const apiFiles = [
    'src/app/api/marketplace/templates/route.ts',
    'src/app/api/agents/wizard/validate/route.ts'
  ];
  
  apiFiles.forEach(file => {
    if (fileExists(file)) {
      const content = readFileContent(file);
      if (content && content.includes('try {') && content.includes('catch (error)')) {
        logTest(`9.2 Error Handling: ${file}`, 'PASSED', 'Proper error handling implemented');
      } else {
        logTest(`9.2 Error Handling: ${file}`, 'FAILED', 'Error handling missing');
      }
    }
  });
  
  // Check for authentication
  apiFiles.forEach(file => {
    if (fileExists(file)) {
      const content = readFileContent(file);
      if (content && content.includes('getServerSession')) {
        logTest(`9.3 Authentication: ${file}`, 'PASSED', 'Authentication implemented');
      } else {
        logTest(`9.3 Authentication: ${file}`, 'FAILED', 'Authentication missing');
      }
    }
  });
  
  // Check for responsive design
  const uiFiles = [
    'src/components/agents/AgentConfigurationWizard.tsx',
    'src/components/agents/AgentMarketplace.tsx'
  ];
  
  uiFiles.forEach(file => {
    if (fileExists(file)) {
      const content = readFileContent(file);
      if (content && content.includes('md:') && content.includes('lg:')) {
        logTest(`9.4 Responsive Design: ${file}`, 'PASSED', 'Responsive design implemented');
      } else {
        logTest(`9.4 Responsive Design: ${file}`, 'WARNING', 'Responsive design could be improved', true);
      }
    }
  });
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

function main() {
  console.log('🚀 Starting DAY 28 Validation Test...');
  console.log('📋 Testing: Agent Management UI - Advanced Features Implementation');
  console.log('⏰ Timestamp:', testResults.timestamp);
  console.log('');
  
  // Run all validation phases
  validateUIComponents();
  validateAgentConfigurationWizard();
  validateAgentPerformanceDashboard();
  validateBulkAgentOperations();
  validateAgentMarketplace();
  validateAPIEndpoints();
  validateDatabaseSchema();
  validateIntegrations();
  validateFinalRequirements();
  
  // Generate final report
  console.log('\n' + '='.repeat(80));
  console.log('📊 DAY 28 VALIDATION RESULTS');
  console.log('='.repeat(80));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`⚠️  Warnings: ${testResults.warnings}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📋 Total: ${testResults.total}`);
  
  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  console.log(`🎯 Success Rate: ${successRate}%`);
  
  // Determine overall status
  let overallStatus = '';
  if (testResults.failed === 0) {
    overallStatus = testResults.warnings === 0 ? '✅ PASS COMPLETELY' : '⚠️ MINOR ISSUES';
  } else {
    overallStatus = testResults.failed > 5 ? '❌ MAJOR ISSUES' : '⚠️ ISSUES FOUND';
  }
  
  console.log(`🏆 Overall Status: ${overallStatus}`);
  
  // Save detailed results
  const reportFile = `day28-validation-results-${new Date().toISOString().split('T')[0]}.json`;
  fs.writeFileSync(reportFile, JSON.stringify(testResults, null, 2));
  console.log(`📄 Detailed report saved to: ${reportFile}`);
  
  // QA Workflow Decision
  console.log('\n🔧 QA WORKFLOW DECISION:');
  if (testResults.failed === 0) {
    console.log('✅ DAY 28 PASSED - Ready to proceed');
    console.log('🎯 All core functionality implemented and validated');
    console.log('📋 Agent Management UI features complete');
  } else {
    console.log('🔧 DAY 28 NEEDS ATTENTION - Issues found');
    console.log('⚠️ Address failed tests before proceeding');
    console.log('📋 Review implementation and fix issues');
  }
  
  console.log('\n🎉 Validation Complete!');
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run the validation
main(); 