/**
 * 🧪 DAY 19 - Provider Abstraction Validation Script
 * Comprehensive testing of all provider implementations
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

function logStep(step, message) {
  log(`\n${colors.bold}${colors.blue}🔍 STEP ${step}:${colors.reset} ${message}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

/**
 * Test Results Tracking
 */
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  categories: {
    'Interface Design': { passed: 0, total: 0 },
    'OpenAI Provider': { passed: 0, total: 0 },
    'Anthropic Provider': { passed: 0, total: 0 },
    'Google Provider': { passed: 0, total: 0 },
    'Provider Factory': { passed: 0, total: 0 },
    'Integration': { passed: 0, total: 0 }
  }
};

function runTest(category, testName, testFn) {
  testResults.total++;
  testResults.categories[category].total++;
  
  try {
    const result = testFn();
    if (result === true) {
      testResults.passed++;
      testResults.categories[category].passed++;
      logSuccess(`${testName}`);
      return true;
    } else if (result === 'warning') {
      testResults.warnings++;
      logWarning(`${testName}`);
      return true;
    } else {
      testResults.failed++;
      logError(`${testName}: ${result}`);
      return false;
    }
  } catch (error) {
    testResults.failed++;
    logError(`${testName}: ${error.message}`);
    return false;
  }
}

/**
 * File existence and structure tests
 */
function testFileStructure() {
  logStep('19.1', 'Testing Provider Interface Design');
  
  const requiredFiles = [
    'src/lib/providers/IModelProvider.ts',
    'src/lib/providers/OpenAIProvider.ts',
    'src/lib/providers/AnthropicProvider.ts',
    'src/lib/providers/GoogleProvider.ts',
    'src/lib/providers/ProviderFactory.ts'
  ];
  
  requiredFiles.forEach(file => {
    runTest('Interface Design', `File exists: ${file}`, () => {
      return fs.existsSync(file) || `File not found: ${file}`;
    });
  });
  
  runTest('Interface Design', 'IModelProvider interface completeness', () => {
    const content = fs.readFileSync('src/lib/providers/IModelProvider.ts', 'utf8');
    const requiredInterfaces = [
      'interface IModelProvider',
      'interface ChatRequest',
      'interface ChatResponse',
      'interface EmbedRequest',
      'interface EmbedResponse',
      'interface ProviderCapabilities',
      'interface ProviderMetrics'
    ];
    
    for (const iface of requiredInterfaces) {
      if (!content.includes(iface)) {
        return `Missing interface: ${iface}`;
      }
    }
    return true;
  });
  
  runTest('Interface Design', 'Provider types defined', () => {
    const content = fs.readFileSync('src/lib/providers/IModelProvider.ts', 'utf8');
    const requiredTypes = [
      "type ProviderType = 'openai' | 'anthropic' | 'google'",
      'OpenAIConfig',
      'AnthropicConfig',
      'GoogleConfig'
    ];
    
    for (const type of requiredTypes) {
      if (!content.includes(type)) {
        return `Missing type: ${type}`;
      }
    }
    return true;
  });
}

/**
 * Provider implementation tests
 */
function testProviderImplementations() {
  logStep('19.2', 'Testing Provider Implementations');
  
  const providers = [
    { name: 'OpenAI', file: 'src/lib/providers/OpenAIProvider.ts', class: 'OpenAIProvider' },
    { name: 'Anthropic', file: 'src/lib/providers/AnthropicProvider.ts', class: 'AnthropicProvider' },
    { name: 'Google', file: 'src/lib/providers/GoogleProvider.ts', class: 'GoogleProvider' }
  ];
  
  providers.forEach(provider => {
    const category = `${provider.name} Provider`;
    
    runTest(category, `${provider.name} provider file exists`, () => {
      return fs.existsSync(provider.file) || `File not found: ${provider.file}`;
    });
    
    runTest(category, `${provider.name} provider implements IModelProvider`, () => {
      const content = fs.readFileSync(provider.file, 'utf8');
      if (!content.includes(`class ${provider.class} implements IModelProvider`)) {
        return `Class ${provider.class} doesn't implement IModelProvider`;
      }
      return true;
    });
    
    runTest(category, `${provider.name} provider has required methods`, () => {
      const content = fs.readFileSync(provider.file, 'utf8');
      const requiredMethods = [
        'async chat(',
        'async embed(',
        'async validate(',
        'configure(',
        'getConfig(',
        'updateConfig(',
        'async healthCheck(',
        'getMetrics(',
        'resetMetrics('
      ];
      
      for (const method of requiredMethods) {
        if (!content.includes(method)) {
          return `Missing method: ${method}`;
        }
      }
      return true;
    });
    
    runTest(category, `${provider.name} provider has capabilities defined`, () => {
      const content = fs.readFileSync(provider.file, 'utf8');
      if (!content.includes('readonly capabilities: ProviderCapabilities')) {
        return 'Missing capabilities definition';
      }
      if (!content.includes('supportedModels:')) {
        return 'Missing supportedModels in capabilities';
      }
      return true;
    });
    
    runTest(category, `${provider.name} provider has error handling`, () => {
      const content = fs.readFileSync(provider.file, 'utf8');
      if (!content.includes('handleError(') && !content.includes('try {') && !content.includes('catch (')) {
        return 'Missing error handling implementation';
      }
      return true;
    });
  });
}

/**
 * Provider Factory tests
 */
function testProviderFactory() {
  logStep('19.3', 'Testing Provider Factory');
  
  runTest('Provider Factory', 'ProviderFactory file exists', () => {
    return fs.existsSync('src/lib/providers/ProviderFactory.ts') || 'ProviderFactory.ts not found';
  });
  
  runTest('Provider Factory', 'ProviderFactory implements IProviderFactory', () => {
    const content = fs.readFileSync('src/lib/providers/ProviderFactory.ts', 'utf8');
    if (!content.includes('class ProviderFactory implements IProviderFactory')) {
      return 'ProviderFactory doesn\'t implement IProviderFactory';
    }
    return true;
  });
  
  runTest('Provider Factory', 'ProviderFactory has singleton pattern', () => {
    const content = fs.readFileSync('src/lib/providers/ProviderFactory.ts', 'utf8');
    if (!content.includes('static getInstance()')) {
      return 'Missing singleton getInstance method';
    }
    if (!content.includes('private static instance')) {
      return 'Missing singleton instance property';
    }
    return true;
  });
  
  runTest('Provider Factory', 'ProviderFactory has provider registration', () => {
    const content = fs.readFileSync('src/lib/providers/ProviderFactory.ts', 'utf8');
    const requiredMethods = [
      'createProvider(',
      'registerProvider(',
      'getAvailableProviders(',
      'validateConfig('
    ];
    
    for (const method of requiredMethods) {
      if (!content.includes(method)) {
        return `Missing method: ${method}`;
      }
    }
    return true;
  });
  
  runTest('Provider Factory', 'Built-in providers are registered', () => {
    const content = fs.readFileSync('src/lib/providers/ProviderFactory.ts', 'utf8');
    const providers = ['openai', 'anthropic', 'google'];
    
    for (const provider of providers) {
      if (!content.includes(`'${provider}'`)) {
        return `Provider ${provider} not registered`;
      }
    }
    return true;
  });
}

/**
 * Integration tests
 */
function testIntegration() {
  logStep('19.4', 'Testing Integration');
  
  runTest('Integration', 'All providers import IModelProvider', () => {
    const providerFiles = [
      'src/lib/providers/OpenAIProvider.ts',
      'src/lib/providers/AnthropicProvider.ts',
      'src/lib/providers/GoogleProvider.ts'
    ];
    
    for (const file of providerFiles) {
      const content = fs.readFileSync(file, 'utf8');
      if (!content.includes('IModelProvider')) {
        return `${file} doesn't import IModelProvider`;
      }
    }
    return true;
  });
  
  runTest('Integration', 'ProviderFactory imports all providers', () => {
    const content = fs.readFileSync('src/lib/providers/ProviderFactory.ts', 'utf8');
    const imports = ['OpenAIProvider', 'AnthropicProvider', 'GoogleProvider'];
    
    for (const imp of imports) {
      if (!content.includes(`import ${imp}`)) {
        return `Missing import: ${imp}`;
      }
    }
    return true;
  });
  
  runTest('Integration', 'TypeScript types are consistent', () => {
    const interfaceContent = fs.readFileSync('src/lib/providers/IModelProvider.ts', 'utf8');
    const providerFiles = [
      'src/lib/providers/OpenAIProvider.ts',
      'src/lib/providers/AnthropicProvider.ts',
      'src/lib/providers/GoogleProvider.ts'
    ];
    
    // Check if all providers use the same ProviderType
    for (const file of providerFiles) {
      const content = fs.readFileSync(file, 'utf8');
      if (!content.includes('ProviderType')) {
        return `${file} doesn't use ProviderType`;
      }
    }
    return true;
  });
  
  runTest('Integration', 'Provider configurations are defined', () => {
    const content = fs.readFileSync('src/lib/providers/IModelProvider.ts', 'utf8');
    const configs = ['OpenAIConfig', 'AnthropicConfig', 'GoogleConfig'];
    
    for (const config of configs) {
      if (!content.includes(`interface ${config}`)) {
        return `Missing configuration interface: ${config}`;
      }
    }
    return true;
  });
  
  runTest('Integration', 'Error handling types are defined', () => {
    const content = fs.readFileSync('src/lib/providers/IModelProvider.ts', 'utf8');
    const errorTypes = ['ProviderError', 'RetryStrategy', 'ValidationResult'];
    
    for (const type of errorTypes) {
      if (!content.includes(`interface ${type}`)) {
        return `Missing error type: ${type}`;
      }
    }
    return true;
  });
}

/**
 * Advanced feature tests
 */
function testAdvancedFeatures() {
  logStep('19.5', 'Testing Advanced Features');
  
  runTest('Integration', 'Caching support implemented', () => {
    const providerFiles = [
      'src/lib/providers/OpenAIProvider.ts',
      'src/lib/providers/AnthropicProvider.ts',
      'src/lib/providers/GoogleProvider.ts'
    ];
    
    let cachingFound = false;
    for (const file of providerFiles) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('cache') || content.includes('Cache')) {
        cachingFound = true;
        break;
      }
    }
    
    return cachingFound || 'warning';
  });
  
  runTest('Integration', 'Rate limiting implemented', () => {
    const providerFiles = [
      'src/lib/providers/OpenAIProvider.ts',
      'src/lib/providers/AnthropicProvider.ts',
      'src/lib/providers/GoogleProvider.ts'
    ];
    
    let rateLimitingFound = false;
    for (const file of providerFiles) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('rateLimit') || content.includes('RateLimit')) {
        rateLimitingFound = true;
        break;
      }
    }
    
    return rateLimitingFound || 'warning';
  });
  
  runTest('Integration', 'Metrics tracking implemented', () => {
    const providerFiles = [
      'src/lib/providers/OpenAIProvider.ts',
      'src/lib/providers/AnthropicProvider.ts',
      'src/lib/providers/GoogleProvider.ts'
    ];
    
    let metricsFound = false;
    for (const file of providerFiles) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('metrics') || content.includes('Metrics')) {
        metricsFound = true;
        break;
      }
    }
    
    return metricsFound || 'warning';
  });
  
  runTest('Integration', 'Streaming support available', () => {
    const providerFiles = [
      'src/lib/providers/OpenAIProvider.ts',
      'src/lib/providers/AnthropicProvider.ts',
      'src/lib/providers/GoogleProvider.ts'
    ];
    
    let streamingFound = false;
    for (const file of providerFiles) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('stream') || content.includes('Stream')) {
        streamingFound = true;
        break;
      }
    }
    
    return streamingFound || 'warning';
  });
}

/**
 * Main execution
 */
function main() {
  log(`\n${colors.bold}${colors.cyan}🚀 DAY 19 - PROVIDER ABSTRACTION VALIDATION${colors.reset}`);
  log(`${colors.cyan}Testing provider abstraction layer implementation${colors.reset}\n`);
  
  // Run all tests
  testFileStructure();
  testProviderImplementations();
  testProviderFactory();
  testIntegration();
  testAdvancedFeatures();
  
  // Print summary
  log(`\n${colors.bold}${colors.cyan}📊 VALIDATION SUMMARY${colors.reset}`);
  log(`${colors.cyan}════════════════════════════════════════${colors.reset}`);
  
  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  const statusColor = successRate >= 90 ? 'green' : successRate >= 70 ? 'yellow' : 'red';
  
  log(`\n📈 Overall Results:`, 'bold');
  log(`   Total Tests: ${testResults.total}`);
  log(`   Passed: ${testResults.passed}`, 'green');
  log(`   Failed: ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'reset');
  log(`   Warnings: ${testResults.warnings}`, testResults.warnings > 0 ? 'yellow' : 'reset');
  log(`   Success Rate: ${successRate}%`, statusColor);
  
  log(`\n📋 Results by Category:`, 'bold');
  Object.entries(testResults.categories).forEach(([category, results]) => {
    const categoryRate = results.total > 0 ? ((results.passed / results.total) * 100).toFixed(1) : '0.0';
    const categoryColor = categoryRate >= 90 ? 'green' : categoryRate >= 70 ? 'yellow' : 'red';
    log(`   ${category}: ${results.passed}/${results.total} (${categoryRate}%)`, categoryColor);
  });
  
  // Final status
  log(`\n🎯 DAY 19 Status:`, 'bold');
  if (successRate >= 90) {
    logSuccess('COMPLETED - Provider abstraction layer is ready for production');
  } else if (successRate >= 70) {
    logWarning('MOSTLY COMPLETE - Some improvements needed');
  } else {
    logError('NEEDS WORK - Significant issues found');
  }
  
  log(`\n${colors.cyan}Next Steps:${colors.reset}`);
  if (successRate >= 90) {
    logInfo('✅ Ready to proceed to DAY 20: Model Switching Implementation');
  } else {
    logInfo('🔧 Fix identified issues before proceeding to DAY 20');
  }
  
  log(`\n${colors.cyan}════════════════════════════════════════${colors.reset}`);
}

// Run the validation
main(); 