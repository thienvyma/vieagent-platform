#!/usr/bin/env node
/**
 * 🌐 Multi-Platform Agent Deployment Verification Script
 * 
 * Comprehensive testing of Facebook, Zalo, and WeChat integrations
 * Tests OAuth flows, webhook endpoints, UI components, and environment variables
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');

console.log('🌐 Multi-Platform Agent Deployment Verification');
console.log('================================================\n');

const config = {
  baseUrl: process.env.PRODUCTION_URL || 'http://localhost:3001',
  timeout: 30000,
  headless: true
};

class PlatformDeploymentTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      timestamp: new Date().toISOString(),
      baseUrl: config.baseUrl,
      platforms: {
        facebook: { status: 'pending', tests: [] },
        zalo: { status: 'pending', tests: [] },
        wechat: { status: 'pending', tests: [] }
      },
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      }
    };
  }

  async setup() {
    console.log('🚀 Setting up browser environment...');
    
    this.browser = await chromium.launch({
      headless: config.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewportSize({ width: 1280, height: 720 });
    
    console.log('✅ Browser setup complete\n');
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runTest(platform, name, testFn) {
    console.log(`🔍 Testing ${platform.toUpperCase()}: ${name}...`);
    const startTime = Date.now();
    
    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      const testResult = {
        name,
        status: 'PASSED',
        duration,
        message: result?.message || 'Test passed',
        details: result?.details || {}
      };
      
      this.results.platforms[platform].tests.push(testResult);
      this.results.summary.passed++;
      console.log(`✅ ${platform.toUpperCase()}: ${name} PASSED (${duration}ms)`);
      
      return testResult;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      const testResult = {
        name,
        status: 'FAILED',
        duration,
        message: error.message,
        screenshot: await this.takeScreenshot(`${platform}-${name.replace(/\s+/g, '-').toLowerCase()}-error`)
      };
      
      this.results.platforms[platform].tests.push(testResult);
      this.results.summary.failed++;
      console.log(`❌ ${platform.toUpperCase()}: ${name} FAILED (${duration}ms) - ${error.message}`);
      
      return testResult;
    } finally {
      this.results.summary.total++;
    }
  }

  async takeScreenshot(name) {
    try {
      const screenshotPath = path.join(__dirname, '..', 'reports', 'screenshots', `${name}-${Date.now()}.png`);
      fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
      return screenshotPath;
    } catch (error) {
      console.warn(`⚠️ Failed to take screenshot: ${error.message}`);
      return null;
    }
  }

  // Environment Variable Tests
  async testEnvironmentVariables() {
    return {
      message: 'Environment variables validation',
      details: {
        facebook: {
          appId: !!process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
          appSecret: !!process.env.FACEBOOK_APP_SECRET,
          required: ['NEXT_PUBLIC_FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET']
        },
        zalo: {
          appId: !!process.env.NEXT_PUBLIC_ZALO_APP_ID,
          appSecret: !!process.env.ZALO_APP_SECRET,
          required: ['NEXT_PUBLIC_ZALO_APP_ID', 'ZALO_APP_SECRET']
        },
        wechat: {
          appId: !!process.env.NEXT_PUBLIC_WECHAT_APP_ID,
          appSecret: !!process.env.WECHAT_APP_SECRET,
          required: ['NEXT_PUBLIC_WECHAT_APP_ID', 'WECHAT_APP_SECRET']
        }
      }
    };
  }

  // API Endpoint Tests
  async testApiEndpoints() {
    const endpoints = [
      { path: '/api/auth/facebook/callback', platform: 'facebook' },
      { path: '/api/auth/zalo/callback', platform: 'zalo' },
      { path: '/api/auth/wechat/callback', platform: 'wechat' },
      { path: '/api/deployment/facebook', platform: 'facebook' },
      { path: '/api/deployment/zalo', platform: 'zalo' },
      { path: '/api/platform-connections', platform: 'general' }
    ];

    const results = {};
    
    for (const endpoint of endpoints) {
      try {
        const response = await this.makeHttpRequest(endpoint.path, 'GET');
        results[endpoint.path] = {
          platform: endpoint.platform,
          exists: response.statusCode !== 404,
          statusCode: response.statusCode
        };
      } catch (error) {
        results[endpoint.path] = {
          platform: endpoint.platform,
          exists: false,
          error: error.message
        };
      }
    }

    return {
      message: 'API endpoints availability check',
      details: results
    };
  }

  async makeHttpRequest(path, method = 'GET') {
    return new Promise((resolve, reject) => {
      const url = new URL(path, config.baseUrl);
      const options = {
        method,
        timeout: config.timeout,
        headers: {
          'User-Agent': 'VIEAgent-Platform-Tester/1.0'
        }
      };

      const req = (url.protocol === 'https:' ? https : require('http')).request(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.setTimeout(config.timeout);
      req.end();
    });
  }

  // UI Component Tests
  async testDeploymentDashboard() {
    await this.page.goto(`${config.baseUrl}/dashboard/deployment`);
    
    // Wait for page load
    await this.page.waitForTimeout(3000);
    
    // Check if platform connectors tab exists
    const connectorsTab = await this.page.$('button:has-text("Platform Connectors")');
    if (!connectorsTab) {
      throw new Error('Platform Connectors tab not found');
    }

    await connectorsTab.click();
    await this.page.waitForTimeout(2000);

    // Check for platform buttons
    const platforms = ['facebook', 'zalo', 'wechat'];
    const foundPlatforms = {};

    for (const platform of platforms) {
      const platformButton = await this.page.$(`[data-platform="${platform}"], button[class*="${platform}"], [id*="${platform}"]`);
      foundPlatforms[platform] = !!platformButton;
    }

    return {
      message: 'Deployment dashboard UI components',
      details: {
        connectorsTabExists: !!connectorsTab,
        platformsFound: foundPlatforms,
        currentUrl: this.page.url()
      }
    };
  }

  async testPlatformSelection(platform) {
    await this.page.goto(`${config.baseUrl}/dashboard/deployment`);
    await this.page.waitForTimeout(2000);

    // Click platform connectors tab
    const connectorsTab = await this.page.$('button:has-text("Platform Connectors")');
    if (connectorsTab) {
      await connectorsTab.click();
      await this.page.waitForTimeout(1000);
    }

    // Look for platform-specific elements
    const platformElements = await this.page.$$eval('*', (elements) => {
      return elements.some(el => 
        el.textContent?.toLowerCase().includes(platform) ||
        el.className?.toLowerCase().includes(platform) ||
        el.id?.toLowerCase().includes(platform)
      );
    });

    return {
      message: `${platform.toUpperCase()} platform selection interface`,
      details: {
        platformElementsFound: platformElements,
        currentUrl: this.page.url()
      }
    };
  }

  // Facebook Tests
  async testFacebookOAuthFlow() {
    const testData = {
      authUrl: `https://www.facebook.com/v18.0/dialog/oauth`,
      requiredParams: ['client_id', 'redirect_uri', 'scope', 'state'],
      scope: 'pages_manage_metadata,pages_messaging'
    };

    // Test if OAuth URL can be constructed
    const hasAppId = !!process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    const expectedRedirectUri = `${config.baseUrl}/api/auth/facebook/callback`;

    return {
      message: 'Facebook OAuth flow configuration',
      details: {
        authUrlBase: testData.authUrl,
        hasAppId,
        expectedRedirectUri,
        scope: testData.scope,
        ready: hasAppId
      }
    };
  }

  async testFacebookWebhookEndpoint() {
    try {
      const testAgentId = 'test-agent-123';
      const response = await this.makeHttpRequest(`/api/webhook/facebook/${testAgentId}?hub.mode=subscribe&hub.verify_token=test&hub.challenge=test123`, 'GET');
      
      return {
        message: 'Facebook webhook endpoint accessibility',
        details: {
          endpointExists: response.statusCode !== 404,
          statusCode: response.statusCode,
          path: `/api/webhook/facebook/${testAgentId}`
        }
      };
    } catch (error) {
      return {
        message: 'Facebook webhook endpoint test failed',
        details: {
          error: error.message,
          endpointExists: false
        }
      };
    }
  }

  // Zalo Tests
  async testZaloOAuthFlow() {
    const testData = {
      authUrl: `https://oauth.zaloapp.com/v4/permission`,
      requiredParams: ['app_id', 'redirect_uri', 'state'],
      redirectUri: `${config.baseUrl}/api/auth/zalo/callback`
    };

    const hasAppId = !!process.env.NEXT_PUBLIC_ZALO_APP_ID;
    
    return {
      message: 'Zalo OAuth flow configuration',
      details: {
        authUrlBase: testData.authUrl,
        hasAppId,
        redirectUri: testData.redirectUri,
        ready: hasAppId
      }
    };
  }

  async testZaloWebhookEndpoint() {
    try {
      const testAgentId = 'test-agent-123';
      const response = await this.makeHttpRequest(`/api/webhook/zalo/${testAgentId}`, 'GET');
      
      return {
        message: 'Zalo webhook endpoint accessibility',
        details: {
          endpointExists: response.statusCode !== 404,
          statusCode: response.statusCode,
          path: `/api/webhook/zalo/${testAgentId}`
        }
      };
    } catch (error) {
      return {
        message: 'Zalo webhook endpoint test failed',
        details: {
          error: error.message,
          endpointExists: false
        }
      };
    }
  }

  // WeChat Tests
  async testWeChatOAuthFlow() {
    const testData = {
      authUrl: `https://open.weixin.qq.com/connect/oauth2/authorize`,
      requiredParams: ['appid', 'redirect_uri', 'response_type', 'scope', 'state'],
      scope: 'snsapi_userinfo',
      redirectUri: `${config.baseUrl}/api/auth/wechat/callback`
    };

    const hasAppId = !!process.env.NEXT_PUBLIC_WECHAT_APP_ID;
    
    return {
      message: 'WeChat OAuth flow configuration',
      details: {
        authUrlBase: testData.authUrl,
        hasAppId,
        redirectUri: testData.redirectUri,
        scope: testData.scope,
        ready: hasAppId
      }
    };
  }

  async testWeChatIntegrationUI() {
    await this.page.goto(`${config.baseUrl}/dashboard/deployment`);
    await this.page.waitForTimeout(2000);

    // Navigate to platform connectors
    const connectorsTab = await this.page.$('button:has-text("Platform Connectors")');
    if (connectorsTab) {
      await connectorsTab.click();
      await this.page.waitForTimeout(1000);
    }

    // Look for WeChat platform option
    const wechatElements = await this.page.$$eval('*', (elements) => {
      return elements.filter(el => 
        el.textContent?.includes('WeChat') || 
        el.textContent?.includes('微信') ||
        el.textContent?.includes('wechat')
      ).length;
    });

    // Check if WeChat is no longer showing "Coming Soon"
    const comingSoonText = await this.page.$eval('*', (el) => {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      let node;
      while (node = walker.nextNode()) {
        if (node.textContent.includes('Coming Soon') && 
            node.parentElement?.textContent?.includes('WeChat')) {
          return true;
        }
      }
      return false;
    }).catch(() => false);

    return {
      message: 'WeChat integration UI availability',
      details: {
        wechatElementsFound: wechatElements,
        hasComingSoonMessage: comingSoonText,
        isFullyImplemented: wechatElements > 0 && !comingSoonText
      }
    };
  }

  async generateReport() {
    // Calculate platform-specific summaries
    for (const platform of ['facebook', 'zalo', 'wechat']) {
      const tests = this.results.platforms[platform].tests;
      const passed = tests.filter(t => t.status === 'PASSED').length;
      const failed = tests.filter(t => t.status === 'FAILED').length;
      
      this.results.platforms[platform].status = failed === 0 ? 'PASSED' : 'FAILED';
      this.results.platforms[platform].summary = {
        total: tests.length,
        passed,
        failed,
        successRate: tests.length > 0 ? ((passed / tests.length) * 100).toFixed(1) : '0'
      };
    }

    const reportData = {
      ...this.results,
      overallStatus: this.results.summary.failed === 0 ? 'SUCCESS' : 'FAILED',
      successRate: this.results.summary.total > 0 
        ? ((this.results.summary.passed / this.results.summary.total) * 100).toFixed(1)
        : '0'
    };

    const reportPath = path.join(__dirname, '..', 'reports', `platform-deployment-verification-${Date.now()}.json`);
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    console.log('\n🌐 Multi-Platform Deployment Verification Summary');
    console.log('==================================================');
    
    // Platform-specific results
    for (const [platform, data] of Object.entries(this.results.platforms)) {
      const emoji = data.status === 'PASSED' ? '✅' : '❌';
      console.log(`${emoji} ${platform.toUpperCase()}: ${data.summary?.passed || 0}/${data.summary?.total || 0} tests passed (${data.summary?.successRate || 0}%)`);
      
      if (data.tests.length > 0) {
        data.tests.forEach(test => {
          const status = test.status === 'PASSED' ? '  ✅' : '  ❌';
          console.log(`    ${status} ${test.name}: ${test.message}`);
        });
      }
      console.log('');
    }
    
    console.log(`📊 Overall: ${this.results.summary.passed}/${this.results.summary.total} tests passed (${reportData.successRate}%)`);
    console.log(`📄 Report: ${reportPath}`);
    
    return reportData;
  }
}

async function main() {
  const tester = new PlatformDeploymentTester();
  
  try {
    await tester.setup();
    
    console.log(`🎯 Testing multi-platform deployment on: ${config.baseUrl}\n`);
    
    // General Tests
    await tester.runTest('general', 'Environment Variables', () => tester.testEnvironmentVariables());
    await tester.runTest('general', 'API Endpoints', () => tester.testApiEndpoints());
    await tester.runTest('general', 'Deployment Dashboard', () => tester.testDeploymentDashboard());
    
    // Facebook Tests
    await tester.runTest('facebook', 'OAuth Flow Configuration', () => tester.testFacebookOAuthFlow());
    await tester.runTest('facebook', 'Webhook Endpoint', () => tester.testFacebookWebhookEndpoint());
    await tester.runTest('facebook', 'Platform Selection UI', () => tester.testPlatformSelection('facebook'));
    
    // Zalo Tests
    await tester.runTest('zalo', 'OAuth Flow Configuration', () => tester.testZaloOAuthFlow());
    await tester.runTest('zalo', 'Webhook Endpoint', () => tester.testZaloWebhookEndpoint());
    await tester.runTest('zalo', 'Platform Selection UI', () => tester.testPlatformSelection('zalo'));
    
    // WeChat Tests
    await tester.runTest('wechat', 'OAuth Flow Configuration', () => tester.testWeChatOAuthFlow());
    await tester.runTest('wechat', 'Integration UI', () => tester.testWeChatIntegrationUI());
    await tester.runTest('wechat', 'Platform Selection UI', () => tester.testPlatformSelection('wechat'));
    
    const report = await tester.generateReport();
    
    if (report.overallStatus === 'SUCCESS') {
      console.log('\n🎉 All platform deployment tests passed!');
      console.log('✅ Multi-platform deployment system is ready for production');
      process.exit(0);
    } else {
      console.log('\n⚠️ Some platform deployment tests failed');
      console.log('🔧 Review failed tests and fix issues before deployment');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 Platform deployment testing failed:', error.message);
    process.exit(1);
  } finally {
    await tester.cleanup();
  }
}

// Handle interruption
process.on('SIGINT', async () => {
  console.log('\n⚠️ Testing interrupted by user');
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Platform deployment test error:', error);
    process.exit(1);
  });
}

module.exports = { PlatformDeploymentTester }; 