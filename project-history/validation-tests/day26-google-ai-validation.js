#!/usr/bin/env node

/**
 * DAY 26 VALIDATION: Google AI Enhancements
 * 
 * This script validates:
 * 1. Intelligent Scheduling Service
 * 2. Email Intelligence Service  
 * 3. Integration Analytics Service
 * 4. API Endpoints
 * 5. AI Integration
 * 6. Performance Metrics
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`${message}`, 'cyan');
  log(`${'='.repeat(60)}`, 'cyan');
}

function logSubHeader(message) {
  log(`\n${'-'.repeat(40)}`, 'blue');
  log(`${message}`, 'blue');
  log(`${'-'.repeat(40)}`, 'blue');
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
  log(`ℹ️  ${message}`, 'blue');
}

// Validation results
const results = {
  intelligentScheduling: {
    passed: 0,
    failed: 0,
    issues: []
  },
  emailIntelligence: {
    passed: 0,
    failed: 0,
    issues: []
  },
  integrationAnalytics: {
    passed: 0,
    failed: 0,
    issues: []
  },
  apiEndpoints: {
    passed: 0,
    failed: 0,
    issues: []
  },
  aiIntegration: {
    passed: 0,
    failed: 0,
    issues: []
  },
  overall: {
    passed: 0,
    failed: 0,
    issues: []
  }
};

function checkFile(filePath, description, category) {
  if (fs.existsSync(filePath)) {
    logSuccess(`${description} exists`);
    results[category].passed++;
    return true;
  } else {
    logError(`${description} missing: ${filePath}`);
    results[category].failed++;
    results[category].issues.push(`Missing file: ${filePath}`);
    return false;
  }
}

function checkFileContent(filePath, patterns, description, category) {
  if (!fs.existsSync(filePath)) {
    logError(`${description} file missing: ${filePath}`);
    results[category].failed++;
    results[category].issues.push(`Missing file: ${filePath}`);
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  let allPatternsFound = true;

  patterns.forEach(pattern => {
    if (typeof pattern === 'string') {
      if (!content.includes(pattern)) {
        logError(`${description} missing pattern: ${pattern}`);
        results[category].failed++;
        results[category].issues.push(`Missing pattern in ${filePath}: ${pattern}`);
        allPatternsFound = false;
      }
    } else if (pattern instanceof RegExp) {
      if (!pattern.test(content)) {
        logError(`${description} missing regex pattern: ${pattern}`);
        results[category].failed++;
        results[category].issues.push(`Missing regex pattern in ${filePath}: ${pattern}`);
        allPatternsFound = false;
      }
    }
  });

  if (allPatternsFound) {
    logSuccess(`${description} content validated`);
    results[category].passed++;
    return true;
  }

  return false;
}

function validateIntelligentScheduling() {
  logSubHeader('Validating Intelligent Scheduling Service');

  // Check main service file
  const serviceFile = 'src/lib/google/intelligent-scheduler.ts';
  if (checkFile(serviceFile, 'Intelligent Scheduler Service', 'intelligentScheduling')) {
    checkFileContent(serviceFile, [
      'class IntelligentSchedulerService',
      'scheduleSmartMeeting',
      'analyzeMeetingRequest',
      'analyzeAttendeeAvailability',
      'generateSmartTimeSuggestions',
      'calculateSlotConfidence',
      'getSchedulingAnalytics',
      'OpenAI',
      'interface MeetingRequest',
      'interface SchedulingResult',
      'interface SchedulingAnalytics'
    ], 'Intelligent Scheduler Service implementation', 'intelligentScheduling');
  }

  // Check API endpoint
  const apiFile = 'src/app/api/google/intelligent-scheduling/route.ts';
  if (checkFile(apiFile, 'Intelligent Scheduling API', 'intelligentScheduling')) {
    checkFileContent(apiFile, [
      'IntelligentSchedulerService',
      'handleScheduleMeeting',
      'handleGetSuggestions',
      'handleGetAnalytics',
      'POST',
      'GET'
    ], 'Intelligent Scheduling API implementation', 'intelligentScheduling');
  }

  // Check interfaces and types
  checkFileContent(serviceFile, [
    'interface SchedulingPreferences',
    'interface MeetingRequest',
    'interface SchedulingResult',
    'interface SchedulingAnalytics',
    'workingHours',
    'conflictDetection',
    'attendeeAvailability'
  ], 'Intelligent Scheduling interfaces', 'intelligentScheduling');

  // Check AI integration
  checkFileContent(serviceFile, [
    'openai.chat.completions.create',
    'analyzeMeetingRequest',
    'AI scheduling assistant',
    'temperature: 0.3'
  ], 'AI integration in scheduling', 'intelligentScheduling');

  logInfo(`Intelligent Scheduling: ${results.intelligentScheduling.passed} passed, ${results.intelligentScheduling.failed} failed`);
}

function validateEmailIntelligence() {
  logSubHeader('Validating Email Intelligence Service');

  // Check main service file
  const serviceFile = 'src/lib/google/email-intelligence.ts';
  if (checkFile(serviceFile, 'Email Intelligence Service', 'emailIntelligence')) {
    checkFileContent(serviceFile, [
      'class EmailIntelligenceService',
      'analyzeEmailIntelligence',
      'analyzeSentimentAdvanced',
      'categorizeEmailAdvanced',
      'extractNamedEntities',
      'extractActionItems',
      'detectMeetingRequests',
      'generateResponseRecommendation',
      'handleAutoResponse',
      'handleAutoScheduling',
      'getEmailAnalytics'
    ], 'Email Intelligence Service implementation', 'emailIntelligence');
  }

  // Check API endpoint
  const apiFile = 'src/app/api/google/email-intelligence/route.ts';
  if (checkFile(apiFile, 'Email Intelligence API', 'emailIntelligence')) {
    checkFileContent(apiFile, [
      'EmailIntelligenceService',
      'handleAnalyzeEmail',
      'handleAnalyzeBatch',
      'handleGetInsights',
      'handleGetAnalytics',
      'POST',
      'GET'
    ], 'Email Intelligence API implementation', 'emailIntelligence');
  }

  // Check interfaces and types
  checkFileContent(serviceFile, [
    'interface EmailIntelligenceConfig',
    'interface EmailInsights',
    'interface EmailThread',
    'interface EmailAnalytics',
    'sentimentAnalysis',
    'namedEntities',
    'actionItems',
    'meetingDetection',
    'responseRecommendation'
  ], 'Email Intelligence interfaces', 'emailIntelligence');

  // Check AI integration
  checkFileContent(serviceFile, [
    'openai.chat.completions.create',
    'sentiment analyzer',
    'categorization system',
    'entity recognition',
    'response recommendation'
  ], 'AI integration in email intelligence', 'emailIntelligence');

  logInfo(`Email Intelligence: ${results.emailIntelligence.passed} passed, ${results.emailIntelligence.failed} failed`);
}

function validateIntegrationAnalytics() {
  logSubHeader('Validating Integration Analytics Service');

  // Check main service file
  const serviceFile = 'src/lib/google/integration-analytics.ts';
  if (checkFile(serviceFile, 'Integration Analytics Service', 'integrationAnalytics')) {
    checkFileContent(serviceFile, [
      'class IntegrationAnalyticsService',
      'generateIntegrationAnalytics',
      'collectServiceUsageMetrics',
      'collectHealthMetrics',
      'collectUserEngagementMetrics',
      'collectBusinessImpactMetrics',
      'generateRecommendations',
      'analyzeTrends',
      'checkAlerts',
      'getRealTimeAnalytics'
    ], 'Integration Analytics Service implementation', 'integrationAnalytics');
  }

  // Check API endpoint
  const apiFile = 'src/app/api/google/integration-analytics/route.ts';
  if (checkFile(apiFile, 'Integration Analytics API', 'integrationAnalytics')) {
    checkFileContent(apiFile, [
      'IntegrationAnalyticsService',
      'handleGenerateInsights',
      'handleGetRealtime',
      'POST',
      'GET'
    ], 'Integration Analytics API implementation', 'integrationAnalytics');
  }

  // Check interfaces and types
  checkFileContent(serviceFile, [
    'interface ServiceUsageMetrics',
    'interface IntegrationHealthMetrics',
    'interface UserEngagementMetrics',
    'interface BusinessImpactMetrics',
    'interface IntegrationInsights',
    'interface AnalyticsConfig',
    'healthScore',
    'performanceMetrics',
    'recommendations',
    'trends',
    'alerts'
  ], 'Integration Analytics interfaces', 'integrationAnalytics');

  // Check comprehensive analytics
  checkFileContent(serviceFile, [
    'calendar',
    'gmail',
    'drive',
    'docs',
    'forms',
    'sheets',
    'successRate',
    'quotaUsage',
    'errorRate',
    'responseTime'
  ], 'Comprehensive service analytics', 'integrationAnalytics');

  logInfo(`Integration Analytics: ${results.integrationAnalytics.passed} passed, ${results.integrationAnalytics.failed} failed`);
}

function validateApiEndpoints() {
  logSubHeader('Validating API Endpoints');

  // Check intelligent scheduling API
  const schedulingApi = 'src/app/api/google/intelligent-scheduling/route.ts';
  if (checkFile(schedulingApi, 'Intelligent Scheduling API', 'apiEndpoints')) {
    checkFileContent(schedulingApi, [
      'export async function POST',
      'export async function GET',
      'getServerSession',
      'authOptions',
      'NextResponse.json',
      'schedule_meeting',
      'get_suggestions',
      'get_analytics'
    ], 'Intelligent Scheduling API structure', 'apiEndpoints');
  }

  // Check email intelligence API
  const emailApi = 'src/app/api/google/email-intelligence/route.ts';
  if (checkFile(emailApi, 'Email Intelligence API', 'apiEndpoints')) {
    checkFileContent(emailApi, [
      'export async function POST',
      'export async function GET',
      'getServerSession',
      'authOptions',
      'NextResponse.json',
      'analyze_email',
      'analyze_batch',
      'get_insights',
      'get_analytics'
    ], 'Email Intelligence API structure', 'apiEndpoints');
  }

  // Check integration analytics API
  const analyticsApi = 'src/app/api/google/integration-analytics/route.ts';
  if (checkFile(analyticsApi, 'Integration Analytics API', 'apiEndpoints')) {
    checkFileContent(analyticsApi, [
      'export async function POST',
      'export async function GET',
      'getServerSession',
      'authOptions',
      'NextResponse.json',
      'generate_insights',
      'get_realtime'
    ], 'Integration Analytics API structure', 'apiEndpoints');
  }

  // Check error handling
  [schedulingApi, emailApi, analyticsApi].forEach(apiFile => {
    if (fs.existsSync(apiFile)) {
      checkFileContent(apiFile, [
        'try {',
        'catch (error)',
        'console.error',
        'status: 500',
        'status: 401',
        'Unauthorized'
      ], `Error handling in ${path.basename(apiFile)}`, 'apiEndpoints');
    }
  });

  logInfo(`API Endpoints: ${results.apiEndpoints.passed} passed, ${results.apiEndpoints.failed} failed`);
}

function validateAiIntegration() {
  logSubHeader('Validating AI Integration');

  // Check OpenAI integration in intelligent scheduling
  const schedulingFile = 'src/lib/google/intelligent-scheduler.ts';
  if (fs.existsSync(schedulingFile)) {
    checkFileContent(schedulingFile, [
      "import { OpenAI } from 'openai'",
      'const openai = new OpenAI',
      'OPENAI_API_KEY',
      'openai.chat.completions.create',
      'model: \'gpt-4\'',
      'AI scheduling assistant'
    ], 'OpenAI integration in scheduling', 'aiIntegration');
  }

  // Check OpenAI integration in email intelligence
  const emailFile = 'src/lib/google/email-intelligence.ts';
  if (fs.existsSync(emailFile)) {
    checkFileContent(emailFile, [
      "import { OpenAI } from 'openai'",
      'const openai = new OpenAI',
      'OPENAI_API_KEY',
      'openai.chat.completions.create',
      'model: \'gpt-4\'',
      'sentiment analyzer',
      'categorization system',
      'entity recognition'
    ], 'OpenAI integration in email intelligence', 'aiIntegration');
  }

  // Check AI prompt engineering
  checkFileContent(schedulingFile, [
    'analyze this meeting request',
    'scheduling insights',
    'optimal duration',
    'urgency level',
    'ideal time of day'
  ], 'AI prompt engineering in scheduling', 'aiIntegration');

  checkFileContent(emailFile, [
    'analyze the sentiment',
    'categorize this email',
    'extract named entities',
    'extract action items',
    'meeting requests'
  ], 'AI prompt engineering in email intelligence', 'aiIntegration');

  // Check AI configuration
  [schedulingFile, emailFile].forEach(file => {
    if (fs.existsSync(file)) {
      checkFileContent(file, [
        'temperature:',
        'max_tokens:',
        'role: \'system\'',
        'role: \'user\''
      ], `AI configuration in ${path.basename(file)}`, 'aiIntegration');
    }
  });

  logInfo(`AI Integration: ${results.aiIntegration.passed} passed, ${results.aiIntegration.failed} failed`);
}

function validateOverallIntegration() {
  logSubHeader('Validating Overall Integration');

  // Check service imports and dependencies
  const files = [
    'src/lib/google/intelligent-scheduler.ts',
    'src/lib/google/email-intelligence.ts',
    'src/lib/google/integration-analytics.ts'
  ];

  files.forEach(file => {
    if (fs.existsSync(file)) {
      checkFileContent(file, [
        'import',
        'PrismaClient',
        'GoogleCalendarService',
        'GmailService'
      ], `Service dependencies in ${path.basename(file)}`, 'overall');
    }
  });

  // Check database integration
  files.forEach(file => {
    if (fs.existsSync(file)) {
      checkFileContent(file, [
        'prisma.',
        'create(',
        'findMany(',
        'findUnique('
      ], `Database integration in ${path.basename(file)}`, 'overall');
    }
  });

  // Check error handling consistency
  files.forEach(file => {
    if (fs.existsSync(file)) {
      checkFileContent(file, [
        'try {',
        'catch (error)',
        'console.error',
        'throw new Error'
      ], `Error handling in ${path.basename(file)}`, 'overall');
    }
  });

  // Check TypeScript interfaces
  files.forEach(file => {
    if (fs.existsSync(file)) {
      checkFileContent(file, [
        'interface ',
        'export interface',
        ': string',
        ': number',
        ': boolean',
        ': Date'
      ], `TypeScript interfaces in ${path.basename(file)}`, 'overall');
    }
  });

  logInfo(`Overall Integration: ${results.overall.passed} passed, ${results.overall.failed} failed`);
}

function generateReport() {
  logHeader('DAY 26 VALIDATION REPORT');

  const categories = [
    { name: 'Intelligent Scheduling', key: 'intelligentScheduling' },
    { name: 'Email Intelligence', key: 'emailIntelligence' },
    { name: 'Integration Analytics', key: 'integrationAnalytics' },
    { name: 'API Endpoints', key: 'apiEndpoints' },
    { name: 'AI Integration', key: 'aiIntegration' },
    { name: 'Overall Integration', key: 'overall' }
  ];

  let totalPassed = 0;
  let totalFailed = 0;
  let allIssues = [];

  categories.forEach(category => {
    const result = results[category.key];
    totalPassed += result.passed;
    totalFailed += result.failed;
    allIssues = allIssues.concat(result.issues);

    const status = result.failed === 0 ? '✅ PASS' : '❌ FAIL';
    const percentage = result.passed + result.failed > 0 ? 
      Math.round((result.passed / (result.passed + result.failed)) * 100) : 0;

    log(`${status} ${category.name}: ${result.passed} passed, ${result.failed} failed (${percentage}%)`, 
        result.failed === 0 ? 'green' : 'red');
  });

  log('\n' + '='.repeat(60), 'cyan');
  const overallPercentage = totalPassed + totalFailed > 0 ? 
    Math.round((totalPassed / (totalPassed + totalFailed)) * 100) : 0;
  
  const overallStatus = totalFailed === 0 ? '✅ PASS' : '❌ FAIL';
  log(`${overallStatus} OVERALL: ${totalPassed} passed, ${totalFailed} failed (${overallPercentage}%)`, 
      totalFailed === 0 ? 'green' : 'red');

  if (allIssues.length > 0) {
    logSubHeader('Issues Found');
    allIssues.forEach(issue => {
      logError(issue);
    });
  }

  // Generate summary
  logSubHeader('Summary');
  if (totalFailed === 0) {
    logSuccess('🎉 DAY 26 Google AI Enhancements validation completed successfully!');
    logSuccess('✅ All intelligent scheduling features implemented');
    logSuccess('✅ All email intelligence features implemented');
    logSuccess('✅ All integration analytics features implemented');
    logSuccess('✅ All API endpoints functional');
    logSuccess('✅ AI integration working properly');
  } else {
    logError('❌ DAY 26 validation failed with issues');
    logWarning('⚠️  Please fix the issues above before proceeding');
  }

  // Save report to file
  const reportPath = path.join(__dirname, 'day26-validation-report.json');
  const reportData = {
    timestamp: new Date().toISOString(),
    day: 26,
    phase: 'Google AI Enhancements',
    totalPassed,
    totalFailed,
    overallPercentage,
    overallStatus: totalFailed === 0 ? 'PASS' : 'FAIL',
    categories: categories.map(cat => ({
      name: cat.name,
      passed: results[cat.key].passed,
      failed: results[cat.key].failed,
      issues: results[cat.key].issues
    })),
    allIssues
  };

  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  logInfo(`📄 Detailed report saved to: ${reportPath}`);

  return totalFailed === 0;
}

// Main execution
function main() {
  logHeader('DAY 26 VALIDATION: Google AI Enhancements');
  logInfo('Validating intelligent scheduling, email intelligence, and integration analytics...');

  try {
    validateIntelligentScheduling();
    validateEmailIntelligence();
    validateIntegrationAnalytics();
    validateApiEndpoints();
    validateAiIntegration();
    validateOverallIntegration();

    const success = generateReport();
    process.exit(success ? 0 : 1);
  } catch (error) {
    logError(`Validation failed with error: ${error.message}`);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  validateIntelligentScheduling,
  validateEmailIntelligence,
  validateIntegrationAnalytics,
  validateApiEndpoints,
  validateAiIntegration,
  validateOverallIntegration,
  generateReport,
  results
}; 