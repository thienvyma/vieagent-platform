#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Enhanced validation for Day 12.1 improvements
function validateDay12_1Improvements() {
  const results = {
    timestamp: new Date().toISOString(),
    testName: "Day 12.1 Enhanced Validation",
    components: {},
    overallScore: 0,
    issues: [],
    recommendations: []
  };

  // Check BulkOperationsToolbar component
  const toolbarPath = path.join(process.cwd(), 'src/components/knowledge/BulkOperationsToolbar.tsx');
  if (fs.existsSync(toolbarPath)) {
    const toolbarContent = fs.readFileSync(toolbarPath, 'utf8');
    
    results.components.bulkOperationsToolbar = {
      exists: true,
      features: {
        confirmationDialogs: toolbarContent.includes('ConfirmationDialog'),
        statusUpdate: toolbarContent.includes('statusOptions'),
        progressIndicators: toolbarContent.includes('loading') || toolbarContent.includes('animate-spin'),
        errorHandling: toolbarContent.includes('try') && toolbarContent.includes('catch'),
        userFeedback: toolbarContent.includes('toast'),
        bulkDelete: toolbarContent.includes('Delete'),
        bulkReprocess: toolbarContent.includes('Reprocess'),
        bulkStatusUpdate: toolbarContent.includes('Update Status')
      }
    };
  } else {
    results.components.bulkOperationsToolbar = {
      exists: false,
      error: 'BulkOperationsToolbar component not found'
    };
    results.issues.push('Missing BulkOperationsToolbar component');
  }

  // Check ConfirmationDialog component
  const dialogPath = path.join(process.cwd(), 'src/components/ui/ConfirmationDialog.tsx');
  if (fs.existsSync(dialogPath)) {
    const dialogContent = fs.readFileSync(dialogPath, 'utf8');
    
    results.components.confirmationDialog = {
      exists: true,
      features: {
        loadingState: dialogContent.includes('loading'),
        typeSupport: dialogContent.includes('danger') && dialogContent.includes('warning'),
        cancelButton: dialogContent.includes('cancelText'),
        confirmButton: dialogContent.includes('confirmText'),
        modalOverlay: dialogContent.includes('fixed inset-0'),
        accessibility: dialogContent.includes('focus:')
      }
    };
  } else {
    results.components.confirmationDialog = {
      exists: false,
      error: 'ConfirmationDialog component not found'
    };
    results.issues.push('Missing ConfirmationDialog component');
  }

  // Check KnowledgeGrid integration
  const gridPath = path.join(process.cwd(), 'src/components/knowledge/KnowledgeGrid.tsx');
  if (fs.existsSync(gridPath)) {
    const gridContent = fs.readFileSync(gridPath, 'utf8');
    
    results.components.knowledgeGrid = {
      exists: true,
      integration: {
        importsBulkToolbar: gridContent.includes('import BulkOperationsToolbar'),
        usesBulkToolbar: gridContent.includes('<BulkOperationsToolbar'),
        hasErrorHandling: gridContent.includes('try') && gridContent.includes('catch'),
        hasProgressStates: gridContent.includes('bulkOperationLoading'),
        hasRecoveryMessages: gridContent.includes('retry') || gridContent.includes('refresh'),
        hasConfirmationFlows: gridContent.includes('Confirmation')
      }
    };
  } else {
    results.components.knowledgeGrid = {
      exists: false,
      error: 'KnowledgeGrid component not found'
    };
    results.issues.push('Missing KnowledgeGrid component');
  }

  // Check knowledge page handlers
  const pagePath = path.join(process.cwd(), 'src/app/dashboard/knowledge/page.tsx');
  if (fs.existsSync(pagePath)) {
    const pageContent = fs.readFileSync(pagePath, 'utf8');
    
    results.components.knowledgePage = {
      exists: true,
      handlers: {
        bulkDelete: pageContent.includes('handleBulkDelete'),
        bulkReprocess: pageContent.includes('handleBulkReprocess'),
        bulkStatusUpdate: pageContent.includes('handleBulkStatusUpdate'),
        errorHandling: pageContent.includes('throw error'),
        asyncHandling: pageContent.includes('async') && pageContent.includes('await'),
        errorRecovery: pageContent.includes('error.message')
      }
    };
  } else {
    results.components.knowledgePage = {
      exists: false,
      error: 'Knowledge page not found'
    };
    results.issues.push('Missing knowledge page');
  }

  // Calculate overall score
  let totalScore = 0;
  let maxScore = 0;

  Object.values(results.components).forEach(component => {
    if (component.exists) {
      if (component.features) {
        const featureScore = Object.values(component.features).filter(Boolean).length;
        const maxFeatureScore = Object.keys(component.features).length;
        totalScore += featureScore;
        maxScore += maxFeatureScore;
      }
      if (component.integration) {
        const integrationScore = Object.values(component.integration).filter(Boolean).length;
        const maxIntegrationScore = Object.keys(component.integration).length;
        totalScore += integrationScore;
        maxScore += maxIntegrationScore;
      }
      if (component.handlers) {
        const handlerScore = Object.values(component.handlers).filter(Boolean).length;
        const maxHandlerScore = Object.keys(component.handlers).length;
        totalScore += handlerScore;
        maxScore += maxHandlerScore;
      }
    }
  });

  results.overallScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  // Add recommendations
  if (results.overallScore >= 95) {
    results.recommendations.push('✅ Excellent implementation - ready for Day 12.2');
  } else if (results.overallScore >= 85) {
    results.recommendations.push('⚠️ Good implementation - minor improvements needed');
  } else {
    results.recommendations.push('❌ Significant improvements needed before Day 12.2');
  }

  return results;
}

// Run validation
const results = validateDay12_1Improvements();

// Output results
console.log('\n=== Day 12.1 Enhanced Validation Results ===');
console.log(`Timestamp: ${results.timestamp}`);
console.log(`Overall Score: ${results.overallScore}%`);

console.log('\n=== Component Analysis ===');
Object.entries(results.components).forEach(([name, component]) => {
  console.log(`\n${name}:`);
  console.log(`  Exists: ${component.exists ? '✅' : '❌'}`);
  
  if (component.features) {
    console.log('  Features:');
    Object.entries(component.features).forEach(([feature, status]) => {
      console.log(`    ${feature}: ${status ? '✅' : '❌'}`);
    });
  }
  
  if (component.integration) {
    console.log('  Integration:');
    Object.entries(component.integration).forEach(([integration, status]) => {
      console.log(`    ${integration}: ${status ? '✅' : '❌'}`);
    });
  }
  
  if (component.handlers) {
    console.log('  Handlers:');
    Object.entries(component.handlers).forEach(([handler, status]) => {
      console.log(`    ${handler}: ${status ? '✅' : '❌'}`);
    });
  }
  
  if (component.error) {
    console.log(`  Error: ${component.error}`);
  }
});

if (results.issues.length > 0) {
  console.log('\n=== Issues Found ===');
  results.issues.forEach(issue => console.log(`❌ ${issue}`));
}

console.log('\n=== Recommendations ===');
results.recommendations.forEach(rec => console.log(rec));

// Save results
const reportPath = path.join(process.cwd(), 'test-reports', `day12-1-enhanced-validation-${Date.now()}.json`);
fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
console.log(`\nDetailed report saved to: ${reportPath}`);

// Exit with appropriate code
process.exit(results.overallScore >= 95 ? 0 : 1); 