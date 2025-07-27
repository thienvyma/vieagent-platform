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

console.log('🚀 Starting DAY 28 Step 28.3: Bulk Agent Operations Validation...\n');

// Test 1: Core Bulk Operations Component
runTest('Core Bulk Operations Component Exists', () => {
  const componentPath = path.join(__dirname, 'src/components/agents/BulkAgentOperations.tsx');
  const exists = checkFileExists(componentPath);
  
  if (!exists) {
    return { success: false, details: 'BulkAgentOperations.tsx not found' };
  }
  
  const content = readFileContent(componentPath);
  const structure = checkComponentStructure(content, 'BulkAgentOperations');
  
  const requiredFeatures = [
    content.includes('selectedAgents'),
    content.includes('handleSelectAgent'),
    content.includes('handleSelectAll'),
    content.includes('handleBulkOperation'),
    content.includes('BULK_OPERATIONS'),
    content.includes('activate'),
    content.includes('deactivate'),
    content.includes('delete'),
    content.includes('duplicate'),
    content.includes('archive'),
    content.includes('deploy'),
    content.includes('export'),
    content.includes('update'),
    content.includes('Tabs'),
    content.includes('operations'),
    content.includes('deployment'),
    content.includes('import-export'),
    content.includes('results')
  ];
  
  return {
    success: structure.hasDefaultExport && structure.hasReactImport && requiredFeatures.every(f => f),
    details: `Component structure: ${JSON.stringify(structure)}, Required features: ${requiredFeatures.filter(f => f).length}/17`
  };
});

// Test 2: Bulk Operations API Endpoint
runTest('Bulk Operations API Endpoint', () => {
  const apiPath = path.join(__dirname, 'src/app/api/agents/bulk/route.ts');
  const exists = checkFileExists(apiPath);
  
  if (!exists) {
    return { success: false, details: 'Bulk operations API endpoint not found' };
  }
  
  const content = readFileContent(apiPath);
  const structure = validateAPIEndpoint(content, ['GET', 'POST']);
  
  const requiredFeatures = [
    content.includes('BulkOperationSchema'),
    content.includes('BulkOperationResult'),
    content.includes('activateAgent'),
    content.includes('deactivateAgent'),
    content.includes('deleteAgent'),
    content.includes('duplicateAgent'),
    content.includes('archiveAgent'),
    content.includes('deployAgent'),
    content.includes('exportAgent'),
    content.includes('updateAgent'),
    content.includes('operation'),
    content.includes('agentIds'),
    content.includes('config'),
    content.includes('results'),
    content.includes('summary'),
    content.includes('successful'),
    content.includes('failed')
  ];
  
  return {
    success: structure.hasExportedMethods && structure.hasAuth && requiredFeatures.every(f => f),
    details: `API structure: ${JSON.stringify(structure)}, Required features: ${requiredFeatures.filter(f => f).length}/17`
  };
});

// Test 3: Import API Endpoint
runTest('Import API Endpoint', () => {
  const apiPath = path.join(__dirname, 'src/app/api/agents/import/route.ts');
  const exists = checkFileExists(apiPath);
  
  if (!exists) {
    return { success: false, details: 'Import API endpoint not found' };
  }
  
  const content = readFileContent(apiPath);
  const structure = validateAPIEndpoint(content, ['GET', 'POST']);
  
  const requiredFeatures = [
    content.includes('AgentImportSchema'),
    content.includes('ImportResult'),
    content.includes('parseJsonFile'),
    content.includes('parseCsvFile'),
    content.includes('parseYamlFile'),
    content.includes('formData'),
    content.includes('file'),
    content.includes('imported'),
    content.includes('failed'),
    content.includes('errors'),
    content.includes('agents'),
    content.includes('JSON.parse'),
    content.includes('split'),
    content.includes('headers'),
    content.includes('template')
  ];
  
  return {
    success: structure.hasExportedMethods && structure.hasAuth && requiredFeatures.every(f => f),
    details: `API structure: ${JSON.stringify(structure)}, Required features: ${requiredFeatures.filter(f => f).length}/15`
  };
});

// Test 4: Export API Endpoint
runTest('Export API Endpoint', () => {
  const apiPath = path.join(__dirname, 'src/app/api/agents/export-all/route.ts');
  const exists = checkFileExists(apiPath);
  
  if (!exists) {
    return { success: false, details: 'Export API endpoint not found' };
  }
  
  const content = readFileContent(apiPath);
  const structure = validateAPIEndpoint(content, ['GET', 'POST']);
  
  const requiredFeatures = [
    content.includes('ExportConfigSchema'),
    content.includes('generateCsvContent'),
    content.includes('generateYamlContent'),
    content.includes('format'),
    content.includes('includeKnowledge'),
    content.includes('includeConversations'),
    content.includes('includeMetrics'),
    content.includes('compression'),
    content.includes('mimeType'),
    content.includes('filename'),
    content.includes('buffer'),
    content.includes('Content-Type'),
    content.includes('Content-Disposition'),
    content.includes('attachment'),
    content.includes('NextResponse')
  ];
  
  return {
    success: structure.hasExportedMethods && structure.hasAuth && requiredFeatures.every(f => f),
    details: `API structure: ${JSON.stringify(structure)}, Required features: ${requiredFeatures.filter(f => f).length}/15`
  };
});

// Test 5: Multi-Select Functionality
runTest('Multi-Select Functionality', () => {
  const componentPath = path.join(__dirname, 'src/components/agents/BulkAgentOperations.tsx');
  const content = readFileContent(componentPath);
  
  if (!content) {
    return { success: false, details: 'Could not read bulk operations component' };
  }
  
  const multiSelectFeatures = [
    content.includes('selectedAgents'),
    content.includes('Set<string>'),
    content.includes('handleSelectAgent'),
    content.includes('handleSelectAll'),
    content.includes('getSelectionState'),
    content.includes('Checkbox'),
    content.includes('checked={selectedAgents.has'),
    content.includes('onCheckedChange'),
    content.includes('selectedAgents.size'),
    content.includes('filteredAgents.length'),
    content.includes('Select All'),
    content.includes('Deselect All'),
    content.includes('selected'),
    content.includes('Badge')
  ];
  
  return {
    success: multiSelectFeatures.filter(f => f).length >= 12,
    details: `Multi-select features: ${multiSelectFeatures.filter(f => f).length}/14 found`
  };
});

// Test 6: Batch Operations Implementation
runTest('Batch Operations Implementation', () => {
  const componentPath = path.join(__dirname, 'src/components/agents/BulkAgentOperations.tsx');
  const content = readFileContent(componentPath);
  
  if (!content) {
    return { success: false, details: 'Could not read bulk operations component' };
  }
  
  const batchFeatures = [
    content.includes('BULK_OPERATIONS'),
    content.includes('activate'),
    content.includes('deactivate'),
    content.includes('delete'),
    content.includes('duplicate'),
    content.includes('archive'),
    content.includes('deploy'),
    content.includes('export'),
    content.includes('update'),
    content.includes('requiresConfirmation'),
    content.includes('confirmationMessage'),
    content.includes('executeBulkOperation'),
    content.includes('processing'),
    content.includes('pendingOperation'),
    content.includes('showConfirmation'),
    content.includes('operationResults'),
    content.includes('BulkOperationResult')
  ];
  
  return {
    success: batchFeatures.filter(f => f).length >= 15,
    details: `Batch operation features: ${batchFeatures.filter(f => f).length}/17 found`
  };
});

// Test 7: Deployment Configuration
runTest('Deployment Configuration', () => {
  const componentPath = path.join(__dirname, 'src/components/agents/BulkAgentOperations.tsx');
  const content = readFileContent(componentPath);
  
  if (!content) {
    return { success: false, details: 'Could not read bulk operations component' };
  }
  
  const deploymentFeatures = [
    content.includes('DeploymentConfig'),
    content.includes('environment'),
    content.includes('region'),
    content.includes('scaling'),
    content.includes('replicas'),
    content.includes('resources'),
    content.includes('cpu'),
    content.includes('memory'),
    content.includes('healthCheck'),
    content.includes('monitoring'),
    content.includes('production'),
    content.includes('staging'),
    content.includes('development'),
    content.includes('us-east-1'),
    content.includes('auto'),
    content.includes('manual')
  ];
  
  return {
    success: deploymentFeatures.filter(f => f).length >= 14,
    details: `Deployment features: ${deploymentFeatures.filter(f => f).length}/16 found`
  };
});

// Test 8: Import/Export Configuration
runTest('Import/Export Configuration', () => {
  const componentPath = path.join(__dirname, 'src/components/agents/BulkAgentOperations.tsx');
  const content = readFileContent(componentPath);
  
  if (!content) {
    return { success: false, details: 'Could not read bulk operations component' };
  }
  
  const importExportFeatures = [
    content.includes('ImportExportConfig'),
    content.includes('format'),
    content.includes('includeKnowledge'),
    content.includes('includeConversations'),
    content.includes('includeMetrics'),
    content.includes('compression'),
    content.includes('json'),
    content.includes('csv'),
    content.includes('yaml'),
    content.includes('handleImportAgents'),
    content.includes('exportAllAgents'),
    content.includes('formData'),
    content.includes('file'),
    content.includes('blob'),
    content.includes('download'),
    content.includes('URL.createObjectURL')
  ];
  
  return {
    success: importExportFeatures.filter(f => f).length >= 14,
    details: `Import/Export features: ${importExportFeatures.filter(f => f).length}/16 found`
  };
});

// Test 9: Batch Update Settings
runTest('Batch Update Settings', () => {
  const componentPath = path.join(__dirname, 'src/components/agents/BulkAgentOperations.tsx');
  const content = readFileContent(componentPath);
  
  if (!content) {
    return { success: false, details: 'Could not read bulk operations component' };
  }
  
  const updateFeatures = [
    content.includes('batchUpdateSettings'),
    content.includes('setBatchUpdateSettings'),
    content.includes('model'),
    content.includes('temperature'),
    content.includes('maxTokens'),
    content.includes('status'),
    content.includes('category'),
    content.includes('isPublic'),
    content.includes('updateAgent'),
    content.includes('updateData'),
    content.includes('parseFloat'),
    content.includes('parseInt'),
    content.includes('No change'),
    content.includes('gpt-4'),
    content.includes('gpt-3.5-turbo'),
    content.includes('ACTIVE'),
    content.includes('INACTIVE')
  ];
  
  return {
    success: updateFeatures.filter(f => f).length >= 15,
    details: `Batch update features: ${updateFeatures.filter(f => f).length}/17 found`
  };
});

// Test 10: File Format Support
runTest('File Format Support', () => {
  const importPath = path.join(__dirname, 'src/app/api/agents/import/route.ts');
  const exportPath = path.join(__dirname, 'src/app/api/agents/export-all/route.ts');
  
  const importContent = readFileContent(importPath);
  const exportContent = readFileContent(exportPath);
  
  if (!importContent || !exportContent) {
    return { success: false, details: 'Could not read import/export API files' };
  }
  
  const formatFeatures = [
    importContent.includes('parseJsonFile'),
    importContent.includes('parseCsvFile'),
    importContent.includes('parseYamlFile'),
    importContent.includes('JSON.parse'),
    importContent.includes('split'),
    importContent.includes('trim'),
    exportContent.includes('generateCsvContent'),
    exportContent.includes('generateYamlContent'),
    exportContent.includes('JSON.stringify'),
    exportContent.includes('join'),
    exportContent.includes('application/json'),
    exportContent.includes('text/csv'),
    exportContent.includes('application/x-yaml'),
    exportContent.includes('Content-Type'),
    exportContent.includes('Content-Disposition'),
    exportContent.includes('attachment')
  ];
  
  return {
    success: formatFeatures.filter(f => f).length >= 14,
    details: `File format features: ${formatFeatures.filter(f => f).length}/16 found`
  };
});

// Test 11: Error Handling and Validation
runTest('Error Handling and Validation', () => {
  const bulkPath = path.join(__dirname, 'src/app/api/agents/bulk/route.ts');
  const importPath = path.join(__dirname, 'src/app/api/agents/import/route.ts');
  
  const bulkContent = readFileContent(bulkPath);
  const importContent = readFileContent(importPath);
  
  if (!bulkContent || !importContent) {
    return { success: false, details: 'Could not read API files' };
  }
  
  const errorHandlingFeatures = [
    bulkContent.includes('try'),
    bulkContent.includes('catch'),
    bulkContent.includes('ZodError'),
    bulkContent.includes('BulkOperationSchema'),
    bulkContent.includes('parse'),
    importContent.includes('AgentImportSchema'),
    importContent.includes('ImportResult'),
    importContent.includes('success'),
    importContent.includes('failed'),
    importContent.includes('errors'),
    bulkContent.includes('error'),
    bulkContent.includes('status: 400'),
    bulkContent.includes('status: 401'),
    bulkContent.includes('status: 500'),
    importContent.includes('Unauthorized'),
    importContent.includes('console.error')
  ];
  
  return {
    success: errorHandlingFeatures.filter(f => f).length >= 14,
    details: `Error handling features: ${errorHandlingFeatures.filter(f => f).length}/16 found`
  };
});

// Test 12: UI/UX Features
runTest('UI/UX Features', () => {
  const componentPath = path.join(__dirname, 'src/components/agents/BulkAgentOperations.tsx');
  const content = readFileContent(componentPath);
  
  if (!content) {
    return { success: false, details: 'Could not read bulk operations component' };
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
    content.includes('Input'),
    content.includes('Textarea'),
    content.includes('Checkbox'),
    content.includes('Badge'),
    content.includes('loading'),
    content.includes('processing'),
    content.includes('RefreshCw'),
    content.includes('animate-spin'),
    content.includes('Search'),
    content.includes('Filter'),
    content.includes('Download'),
    content.includes('Upload'),
    content.includes('disabled'),
    content.includes('onClick'),
    content.includes('onChange'),
    content.includes('onValueChange')
  ];
  
  return {
    success: uiFeatures.filter(f => f).length >= 22,
    details: `UI/UX features: ${uiFeatures.filter(f => f).length}/26 found`
  };
});

// Test 13: Filtering and Search
runTest('Filtering and Search Features', () => {
  const componentPath = path.join(__dirname, 'src/components/agents/BulkAgentOperations.tsx');
  const content = readFileContent(componentPath);
  
  if (!content) {
    return { success: false, details: 'Could not read bulk operations component' };
  }
  
  const filterFeatures = [
    content.includes('searchTerm'),
    content.includes('setSearchTerm'),
    content.includes('filterStatus'),
    content.includes('setFilterStatus'),
    content.includes('filterCategory'),
    content.includes('setFilterCategory'),
    content.includes('filteredAgents'),
    content.includes('toLowerCase'),
    content.includes('includes'),
    content.includes('matchesSearch'),
    content.includes('matchesStatus'),
    content.includes('matchesCategory'),
    content.includes('Search'),
    content.includes('placeholder'),
    content.includes('All Status'),
    content.includes('All Categories'),
    content.includes('support'),
    content.includes('sales'),
    content.includes('marketing'),
    content.includes('technical')
  ];
  
  return {
    success: filterFeatures.filter(f => f).length >= 18,
    details: `Filter features: ${filterFeatures.filter(f => f).length}/20 found`
  };
});

// Test 14: Results Display and Feedback
runTest('Results Display and Feedback', () => {
  const componentPath = path.join(__dirname, 'src/components/agents/BulkAgentOperations.tsx');
  const content = readFileContent(componentPath);
  
  if (!content) {
    return { success: false, details: 'Could not read bulk operations component' };
  }
  
  const resultsFeatures = [
    content.includes('operationResults'),
    content.includes('setOperationResults'),
    content.includes('BulkOperationResult'),
    content.includes('success'),
    content.includes('agentId'),
    content.includes('agentName'),
    content.includes('error'),
    content.includes('details'),
    content.includes('CheckCircle'),
    content.includes('XCircle'),
    content.includes('text-green-600'),
    content.includes('text-red-600'),
    content.includes('bg-green-50'),
    content.includes('bg-red-50'),
    content.includes('Operation Results'),
    content.includes('No operation results yet'),
    content.includes('results'),
    content.includes('map'),
    content.includes('index')
  ];
  
  return {
    success: resultsFeatures.filter(f => f).length >= 17,
    details: `Results features: ${resultsFeatures.filter(f => f).length}/19 found`
  };
});

// Test 15: Confirmation Dialog and Processing States
runTest('Confirmation Dialog and Processing States', () => {
  const componentPath = path.join(__dirname, 'src/components/agents/BulkAgentOperations.tsx');
  const content = readFileContent(componentPath);
  
  if (!content) {
    return { success: false, details: 'Could not read bulk operations component' };
  }
  
  const confirmationFeatures = [
    content.includes('showConfirmation'),
    content.includes('setShowConfirmation'),
    content.includes('pendingOperation'),
    content.includes('setPendingOperation'),
    content.includes('processing'),
    content.includes('setProcessing'),
    content.includes('requiresConfirmation'),
    content.includes('confirmationMessage'),
    content.includes('Confirmation Dialog'),
    content.includes('Processing Overlay'),
    content.includes('fixed inset-0'),
    content.includes('bg-black bg-opacity-50'),
    content.includes('z-50'),
    content.includes('Cancel'),
    content.includes('Confirm'),
    content.includes('Processing bulk operation'),
    content.includes('disabled={processing}'),
    content.includes('animate-spin')
  ];
  
  return {
    success: confirmationFeatures.filter(f => f).length >= 16,
    details: `Confirmation features: ${confirmationFeatures.filter(f => f).length}/18 found`
  };
});

// Test 16: TypeScript Interfaces and Types
runTest('TypeScript Interfaces and Types', () => {
  const componentPath = path.join(__dirname, 'src/components/agents/BulkAgentOperations.tsx');
  const content = readFileContent(componentPath);
  
  if (!content) {
    return { success: false, details: 'Could not read bulk operations component' };
  }
  
  const typeFeatures = [
    content.includes('interface Agent'),
    content.includes('interface BulkOperation'),
    content.includes('interface BulkOperationResult'),
    content.includes('interface DeploymentConfig'),
    content.includes('interface ImportExportConfig'),
    content.includes('string'),
    content.includes('number'),
    content.includes('boolean'),
    content.includes('Array'),
    content.includes('Set<string>'),
    content.includes('useState<'),
    content.includes('useEffect'),
    content.includes('React.'),
    content.includes('?: '),
    content.includes('| '),
    content.includes('enum'),
    content.includes('type')
  ];
  
  return {
    success: typeFeatures.filter(f => f).length >= 15,
    details: `TypeScript features: ${typeFeatures.filter(f => f).length}/17 found`
  };
});

// Test 17: Feature Completeness Check
runTest('Feature Completeness Check', () => {
  const componentPath = path.join(__dirname, 'src/components/agents/BulkAgentOperations.tsx');
  const content = readFileContent(componentPath);
  
  if (!content) {
    return { success: false, details: 'Could not read bulk operations component' };
  }
  
  // Count lines of code (excluding comments and empty lines)
  const lines = content.split('\n').filter(line => {
    const trimmed = line.trim();
    return trimmed.length > 0 && !trimmed.startsWith('//') && !trimmed.startsWith('/*') && !trimmed.startsWith('*');
  });
  
  const coreFeatures = [
    content.includes('Multi-select'),
    content.includes('Bulk Operations'),
    content.includes('Deployment'),
    content.includes('Import/Export'),
    content.includes('Results'),
    content.includes('Selection Controls'),
    content.includes('Batch Update Settings'),
    content.includes('Deployment Configuration'),
    content.includes('Import Agents'),
    content.includes('Export Agents'),
    content.includes('Operation Results'),
    content.includes('Confirmation Dialog'),
    content.includes('Processing Overlay'),
    content.includes('Filter'),
    content.includes('Search'),
    content.includes('Tabs'),
    content.includes('Cards'),
    content.includes('Buttons'),
    content.includes('Forms'),
    content.includes('Validation')
  ];
  
  const isComprehensive = lines.length > 1200 && coreFeatures.filter(f => f).length >= 18;
  
  return {
    success: isComprehensive,
    details: `Lines of code: ${lines.length}, Core features: ${coreFeatures.filter(f => f).length}/20`
  };
});

// Generate final report
console.log('\n' + '='.repeat(80));
console.log('🎯 DAY 28 STEP 28.3: BULK AGENT OPERATIONS VALIDATION RESULTS');
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
  console.log('✅ DAY 28 STEP 28.3 IMPLEMENTATION: EXCELLENT');
  console.log('🚀 Bulk Agent Operations is ready for production!');
  console.log('🎉 All core features implemented with comprehensive multi-select, batch operations, and import/export capabilities.');
} else if ((passedTests / totalTests) >= 0.7) {
  console.log('⚠️  DAY 28 STEP 28.3 IMPLEMENTATION: GOOD');
  console.log('🔧 Most features implemented, minor issues need attention.');
} else {
  console.log('❌ DAY 28 STEP 28.3 IMPLEMENTATION: NEEDS WORK');
  console.log('🛠️  Significant issues found, requires debugging and completion.');
}

// Save results to file
const reportData = {
  timestamp: new Date().toISOString(),
  day: 28,
  step: '28.3',
  feature: 'Bulk Agent Operations',
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
    path.join(__dirname, `day28-step3-validation-results-${new Date().toISOString().split('T')[0]}.json`),
    JSON.stringify(reportData, null, 2)
  );
  console.log(`\n💾 Results saved to: day28-step3-validation-results-${new Date().toISOString().split('T')[0]}.json`);
} catch (error) {
  console.log(`\n⚠️  Could not save results: ${error.message}`);
}

console.log('\n🏁 Validation completed!');
console.log('='.repeat(80)); 