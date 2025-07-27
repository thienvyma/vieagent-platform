#!/usr/bin/env node

/**
 * 🎯 DAY 30: MASTER TEST RUNNER
 * Executes all integration tests and generates comprehensive final report
 */

const { Day30IntegrationTester } = require('./day30-integration-testing');
const { PerformanceBenchmarker } = require('./day30-performance-benchmarking');
const { LoadTester } = require('./day30-load-testing');
const { SecurityAuditor } = require('./day30-security-auditing');
const fs = require('fs').promises;
const path = require('path');

class Day30MasterTestRunner {
  constructor() {
    this.results = {
      integration: null,
      performance: null,
      load: null,
      security: null,
      overall: {
        startTime: new Date(),
        endTime: null,
        duration: 0,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        criticalIssues: 0,
        recommendations: []
      }
    };
    
    this.testSuites = [
      {
        name: 'Integration Testing',
        runner: Day30IntegrationTester,
        enabled: true,
        weight: 0.3
      },
      {
        name: 'Performance Benchmarking',
        runner: PerformanceBenchmarker,
        enabled: true,
        weight: 0.25
      },
      {
        name: 'Load Testing',
        runner: LoadTester,
        enabled: true,
        weight: 0.25
      },
      {
        name: 'Security Auditing',
        runner: SecurityAuditor,
        enabled: true,
        weight: 0.2
      }
    ];
  }

  /**
   * 🚀 Run all test suites
   */
  async runAllTests() {
    console.log('🎯 DAY 30: COMPREHENSIVE SYSTEM TESTING');
    console.log('=' .repeat(80));
    console.log('🚀 Starting comprehensive system testing...');
    console.log(`📅 Started at: ${this.results.overall.startTime.toISOString()}`);
    console.log('=' .repeat(80));

    try {
      // Ensure test reports directory exists
      await this.ensureReportsDirectory();

      // Run each test suite
      for (const suite of this.testSuites) {
        if (suite.enabled) {
          await this.runTestSuite(suite);
        }
      }

      // Generate final comprehensive report
      await this.generateFinalReport();

      // Print final summary
      this.printFinalSummary();

      console.log('\n🎉 All Day 30 tests completed successfully!');
      return this.results;

    } catch (error) {
      console.error('\n💥 Day 30 testing failed:', error);
      throw error;
    } finally {
      this.results.overall.endTime = new Date();
      this.results.overall.duration = this.results.overall.endTime - this.results.overall.startTime;
    }
  }

  /**
   * 🧪 Run individual test suite
   */
  async runTestSuite(suite) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 Running ${suite.name}...`);
    console.log(`${'='.repeat(60)}`);

    const startTime = Date.now();
    
    try {
      const runner = new suite.runner();
      let result;

      // Execute the appropriate method based on the runner type
      if (suite.name === 'Integration Testing') {
        result = await runner.runComprehensiveTests();
      } else if (suite.name === 'Performance Benchmarking') {
        result = await runner.runBenchmark();
      } else if (suite.name === 'Load Testing') {
        result = await runner.runLoadTests();
      } else if (suite.name === 'Security Auditing') {
        result = await runner.runSecurityAudit();
      }

      const duration = Date.now() - startTime;

      // Store results
      const suiteName = suite.name.toLowerCase().replace(/\s+/g, '');
      this.results[suiteName] = {
        status: 'COMPLETED',
        duration,
        result: result || runner.results || {},
        summary: this.extractSuiteSummary(runner, suite.name)
      };

      console.log(`✅ ${suite.name} completed in ${(duration / 1000).toFixed(2)}s`);

    } catch (error) {
      const duration = Date.now() - startTime;
      
      const suiteName = suite.name.toLowerCase().replace(/\s+/g, '');
      this.results[suiteName] = {
        status: 'FAILED',
        duration,
        error: error.message,
        summary: { failed: true, error: error.message }
      };

      console.error(`❌ ${suite.name} failed: ${error.message}`);
    }
  }

  /**
   * 📊 Extract summary from test suite runner
   */
  extractSuiteSummary(runner, suiteName) {
    try {
      switch (suiteName) {
        case 'Integration Testing':
          return {
            totalTests: runner.testResults?.summary?.totalTests || 0,
            passed: runner.testResults?.summary?.passed || 0,
            failed: runner.testResults?.summary?.failed || 0,
            warnings: runner.testResults?.summary?.warnings || 0,
            successRate: runner.testResults?.summary?.totalTests > 0 
              ? ((runner.testResults.summary.passed / runner.testResults.summary.totalTests) * 100).toFixed(1)
              : 0
          };

        case 'Performance Benchmarking':
          return {
            systemPerformance: this.extractPerformanceMetrics(runner.results),
            recommendations: runner.results?.recommendations?.length || 0
          };

        case 'Load Testing':
          return {
            maxConcurrentUsers: this.extractMaxConcurrentUsers(runner.results),
            throughput: this.extractMaxThroughput(runner.results),
            status: this.getLoadTestStatus(runner.results)
          };

        case 'Security Auditing':
          return {
            securityScore: this.extractSecurityScore(runner.results),
            criticalIssues: this.extractCriticalSecurityIssues(runner.results),
            overallStatus: this.getSecurityStatus(runner.results)
          };

        default:
          return { status: 'completed' };
      }
    } catch (error) {
      return { error: 'Failed to extract summary', details: error.message };
    }
  }

  /**
   * 📈 Extract performance metrics
   */
  extractPerformanceMetrics(results) {
    try {
      const apiResults = results?.api?.endpoints || [];
      const avgResponseTime = apiResults.length > 0
        ? apiResults.reduce((sum, e) => sum + (e.avgResponseTime || 0), 0) / apiResults.length
        : 0;

      return {
        avgAPIResponseTime: avgResponseTime.toFixed(2),
        memoryUsage: results?.system?.memory?.usagePercent?.toFixed(1) || 'N/A',
        status: avgResponseTime < 1000 ? 'GOOD' : avgResponseTime < 2000 ? 'ACCEPTABLE' : 'POOR'
      };
    } catch (error) {
      return { error: 'Failed to extract performance metrics' };
    }
  }

  /**
   * 👥 Extract max concurrent users
   */
  extractMaxConcurrentUsers(results) {
    try {
      const concurrentResults = results?.concurrentUsers || [];
      return concurrentResults.length > 0 
        ? Math.max(...concurrentResults.map(r => r.totalUsers || 0))
        : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 🚀 Extract max throughput
   */
  extractMaxThroughput(results) {
    try {
      const concurrentResults = results?.concurrentUsers || [];
      return concurrentResults.length > 0
        ? Math.max(...concurrentResults.map(r => r.requestsPerSecond || 0)).toFixed(2)
        : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 📊 Get load test status
   */
  getLoadTestStatus(results) {
    const maxUsers = this.extractMaxConcurrentUsers(results);
    return maxUsers >= 50 ? 'EXCELLENT' : maxUsers >= 20 ? 'GOOD' : 'NEEDS_IMPROVEMENT';
  }

  /**
   * 🔒 Extract security score
   */
  extractSecurityScore(results) {
    try {
      // Calculate security score from all test categories
      const allTests = [
        ...(results?.authentication || []),
        ...(results?.authorization || []),
        ...(results?.dataProtection || []),
        ...(results?.apiSecurity || []),
        ...(results?.inputValidation || []),
        ...(results?.vulnerabilities || [])
      ];

      const passedTests = allTests.filter(t => t.status === 'PASSED').length;
      const totalTests = allTests.length;

      return totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 🚨 Extract critical security issues
   */
  extractCriticalSecurityIssues(results) {
    try {
      const allTests = [
        ...(results?.authentication || []),
        ...(results?.authorization || []),
        ...(results?.dataProtection || []),
        ...(results?.apiSecurity || []),
        ...(results?.inputValidation || []),
        ...(results?.vulnerabilities || [])
      ];

      return allTests.filter(t => t.status === 'FAILED' && t.severity === 'CRITICAL').length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 🛡️ Get security status
   */
  getSecurityStatus(results) {
    const score = this.extractSecurityScore(results);
    const criticalIssues = this.extractCriticalSecurityIssues(results);

    if (criticalIssues > 0) return 'VULNERABLE';
    if (score >= 90) return 'SECURE';
    if (score >= 80) return 'ACCEPTABLE';
    return 'NEEDS_IMPROVEMENT';
  }

  /**
   * 📁 Ensure reports directory exists
   */
  async ensureReportsDirectory() {
    const reportsDir = path.join(__dirname, '..', 'test-reports');
    try {
      await fs.access(reportsDir);
    } catch (error) {
      await fs.mkdir(reportsDir, { recursive: true });
      console.log('📁 Created test-reports directory');
    }
  }

  /**
   * 📋 Generate final comprehensive report
   */
  async generateFinalReport() {
    console.log('\n📋 Generating Final Comprehensive Report...');

    // Calculate overall metrics
    this.calculateOverallMetrics();

    // Generate production readiness assessment
    const productionReadiness = this.assessProductionReadiness();

    // Generate final recommendations
    const finalRecommendations = this.generateFinalRecommendations();

    const finalReport = {
      testSuite: 'Day 30 Comprehensive System Testing',
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        testDuration: this.results.overall.duration
      },
      results: this.results,
      productionReadiness,
      finalRecommendations,
      deploymentDecision: this.makeDeploymentDecision(productionReadiness)
    };

    // Save final report
    const reportPath = path.join(__dirname, '..', 'test-reports', `day30-final-report-${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify(finalReport, null, 2));

    console.log(`✅ Final report saved to: ${reportPath}`);

    // Generate executive summary
    await this.generateExecutiveSummary(finalReport);

    return finalReport;
  }

  /**
   * 📊 Calculate overall metrics
   */
  calculateOverallMetrics() {
    const overall = this.results.overall;

    // Integration test metrics
    const integration = this.results.integration?.summary;
    if (integration) {
      overall.totalTests += integration.totalTests || 0;
      overall.passedTests += integration.passed || 0;
      overall.failedTests += integration.failed || 0;
    }

    // Security critical issues
    const security = this.results.security?.summary;
    if (security) {
      overall.criticalIssues += security.criticalIssues || 0;
    }

    // Calculate overall success rate
    overall.successRate = overall.totalTests > 0 
      ? ((overall.passedTests / overall.totalTests) * 100).toFixed(1)
      : 0;
  }

  /**
   * 🎯 Assess production readiness
   */
  assessProductionReadiness() {
    const assessment = {
      overall: 'READY',
      score: 0,
      categories: {},
      blockers: [],
      warnings: []
    };

    let totalScore = 0;
    let categoryCount = 0;

    // Integration Testing Assessment
    const integration = this.results.integration?.summary;
    if (integration) {
      const integrationScore = parseFloat(integration.successRate) || 0;
      assessment.categories.integration = {
        score: integrationScore,
        status: integrationScore >= 95 ? 'EXCELLENT' : integrationScore >= 90 ? 'GOOD' : 'NEEDS_WORK'
      };

      if (integrationScore < 90) {
        assessment.blockers.push('Integration tests have low success rate');
      }

      totalScore += integrationScore;
      categoryCount++;
    }

    // Performance Assessment
    const performance = this.results.performance?.summary;
    if (performance && performance.systemPerformance) {
      const perfStatus = performance.systemPerformance.status;
      const perfScore = perfStatus === 'GOOD' ? 90 : perfStatus === 'ACCEPTABLE' ? 75 : 50;
      
      assessment.categories.performance = {
        score: perfScore,
        status: perfStatus,
        avgResponseTime: performance.systemPerformance.avgAPIResponseTime
      };

      if (perfStatus === 'POOR') {
        assessment.blockers.push('API performance is poor');
      } else if (perfStatus === 'ACCEPTABLE') {
        assessment.warnings.push('API performance could be improved');
      }

      totalScore += perfScore;
      categoryCount++;
    }

    // Load Testing Assessment
    const load = this.results.load?.summary;
    if (load) {
      const loadScore = load.status === 'EXCELLENT' ? 95 : load.status === 'GOOD' ? 85 : 60;
      
      assessment.categories.load = {
        score: loadScore,
        status: load.status,
        maxConcurrentUsers: load.maxConcurrentUsers,
        maxThroughput: load.throughput
      };

      if (load.status === 'NEEDS_IMPROVEMENT') {
        assessment.warnings.push('System scalability needs improvement');
      }

      totalScore += loadScore;
      categoryCount++;
    }

    // Security Assessment
    const security = this.results.security?.summary;
    if (security) {
      const securityScore = security.securityScore || 0;
      
      assessment.categories.security = {
        score: securityScore,
        status: security.overallStatus,
        criticalIssues: security.criticalIssues
      };

      if (security.criticalIssues > 0) {
        assessment.blockers.push(`${security.criticalIssues} critical security issues found`);
      } else if (security.overallStatus === 'NEEDS_IMPROVEMENT') {
        assessment.warnings.push('Security improvements recommended');
      }

      totalScore += securityScore;
      categoryCount++;
    }

    // Calculate overall score
    assessment.score = categoryCount > 0 ? Math.round(totalScore / categoryCount) : 0;

    // Determine overall status
    if (assessment.blockers.length > 0) {
      assessment.overall = 'NOT_READY';
    } else if (assessment.score >= 90 && assessment.warnings.length === 0) {
      assessment.overall = 'READY';
    } else if (assessment.score >= 85) {
      assessment.overall = 'READY_WITH_WARNINGS';
    } else {
      assessment.overall = 'NEEDS_IMPROVEMENT';
    }

    return assessment;
  }

  /**
   * 💡 Generate final recommendations
   */
  generateFinalRecommendations() {
    const recommendations = [];

    // Collect recommendations from all test suites
    Object.values(this.results).forEach(result => {
      if (result && result.result && result.result.recommendations) {
        recommendations.push(...result.result.recommendations);
      }
    });

    // Add overall recommendations
    const productionReadiness = this.assessProductionReadiness();
    
    if (productionReadiness.overall === 'NOT_READY') {
      recommendations.unshift({
        category: 'Deployment',
        priority: 'CRITICAL',
        issue: 'System not ready for production deployment',
        recommendation: 'Address all blocking issues before deploying to production'
      });
    }

    // Prioritize recommendations
    return recommendations.sort((a, b) => {
      const priorityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * 🚀 Make deployment decision
   */
  makeDeploymentDecision(productionReadiness) {
    const decision = {
      canDeploy: false,
      recommendation: '',
      conditions: [],
      nextSteps: []
    };

    switch (productionReadiness.overall) {
      case 'READY':
        decision.canDeploy = true;
        decision.recommendation = 'APPROVED FOR PRODUCTION DEPLOYMENT';
        decision.nextSteps = [
          'Proceed with production deployment',
          'Monitor system performance post-deployment',
          'Set up alerting and monitoring'
        ];
        break;

      case 'READY_WITH_WARNINGS':
        decision.canDeploy = true;
        decision.recommendation = 'APPROVED WITH CONDITIONS';
        decision.conditions = productionReadiness.warnings;
        decision.nextSteps = [
          'Deploy to production with enhanced monitoring',
          'Address warnings in next iteration',
          'Plan performance optimization'
        ];
        break;

      case 'NEEDS_IMPROVEMENT':
        decision.canDeploy = false;
        decision.recommendation = 'DEPLOYMENT NOT RECOMMENDED';
        decision.nextSteps = [
          'Address performance and scalability issues',
          'Re-run tests after improvements',
          'Consider staged deployment approach'
        ];
        break;

      case 'NOT_READY':
        decision.canDeploy = false;
        decision.recommendation = 'DEPLOYMENT BLOCKED';
        decision.conditions = productionReadiness.blockers;
        decision.nextSteps = [
          'Fix all critical issues immediately',
          'Re-run complete test suite',
          'Security review required'
        ];
        break;
    }

    return decision;
  }

  /**
   * 📄 Generate executive summary
   */
  async generateExecutiveSummary(finalReport) {
    const summary = `
# 🎯 DAY 30 TESTING - EXECUTIVE SUMMARY

## 📊 Overall Results
- **Test Duration**: ${(this.results.overall.duration / 1000 / 60).toFixed(1)} minutes
- **Total Tests**: ${this.results.overall.totalTests}
- **Success Rate**: ${this.results.overall.successRate}%
- **Critical Issues**: ${this.results.overall.criticalIssues}

## 🚀 Production Readiness: ${finalReport.productionReadiness.overall}
**Overall Score**: ${finalReport.productionReadiness.score}/100

### 📈 Category Breakdown:
${Object.entries(finalReport.productionReadiness.categories).map(([category, data]) => 
  `- **${category.toUpperCase()}**: ${data.score}/100 (${data.status})`
).join('\n')}

## 🎯 Deployment Decision: ${finalReport.deploymentDecision.recommendation}

${finalReport.deploymentDecision.canDeploy ? '✅' : '❌'} **Can Deploy**: ${finalReport.deploymentDecision.canDeploy ? 'YES' : 'NO'}

### 📋 Next Steps:
${finalReport.deploymentDecision.nextSteps.map(step => `- ${step}`).join('\n')}

## 💡 Top Recommendations:
${finalReport.finalRecommendations.slice(0, 5).map((rec, index) => 
  `${index + 1}. **${rec.priority}**: ${rec.issue} - ${rec.recommendation}`
).join('\n')}

---
*Generated on ${new Date().toISOString()}*
*AI Agent Platform - Phase 9 Day 30 Testing*
`;

    const summaryPath = path.join(__dirname, '..', 'test-reports', `day30-executive-summary-${Date.now()}.md`);
    await fs.writeFile(summaryPath, summary);

    console.log(`📄 Executive summary saved to: ${summaryPath}`);
  }

  /**
   * 📊 Print final summary
   */
  printFinalSummary() {
    console.log('\n' + '='.repeat(80));
    console.log('🎯 DAY 30 COMPREHENSIVE TESTING - FINAL SUMMARY');
    console.log('='.repeat(80));

    const productionReadiness = this.assessProductionReadiness();
    const deploymentDecision = this.makeDeploymentDecision(productionReadiness);

    console.log(`\n📊 Overall Results:`);
    console.log(`   Duration: ${(this.results.overall.duration / 1000 / 60).toFixed(1)} minutes`);
    console.log(`   Total Tests: ${this.results.overall.totalTests}`);
    console.log(`   Success Rate: ${this.results.overall.successRate}%`);
    console.log(`   Critical Issues: ${this.results.overall.criticalIssues}`);

    console.log(`\n🚀 Production Readiness: ${productionReadiness.overall}`);
    console.log(`   Overall Score: ${productionReadiness.score}/100`);

    console.log(`\n🎯 Deployment Decision: ${deploymentDecision.recommendation}`);
    console.log(`   ${deploymentDecision.canDeploy ? '✅' : '❌'} Can Deploy: ${deploymentDecision.canDeploy ? 'YES' : 'NO'}`);

    if (deploymentDecision.canDeploy) {
      console.log('\n🎉 CONGRATULATIONS! System is ready for production deployment!');
    } else {
      console.log('\n⚠️ System needs improvements before production deployment.');
    }

    console.log('\n' + '='.repeat(80));
  }
}

// Run all tests if called directly
if (require.main === module) {
  const masterRunner = new Day30MasterTestRunner();
  
  masterRunner.runAllTests()
    .then((results) => {
      const deploymentDecision = masterRunner.makeDeploymentDecision(
        masterRunner.assessProductionReadiness()
      );
      
      console.log('\n🎯 Day 30 comprehensive testing completed!');
      
      if (deploymentDecision.canDeploy) {
        console.log('🚀 System approved for production deployment!');
        process.exit(0);
      } else {
        console.log('⚠️ System needs improvements before deployment.');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n💥 Day 30 testing failed:', error);
      process.exit(1);
    });
}

module.exports = { Day30MasterTestRunner }; 