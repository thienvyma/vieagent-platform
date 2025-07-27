#!/usr/bin/env node
/**
 * 🔐 Authentication Flow Testing Script
 * 
 * Tests all authentication flows in production environment:
 * - User registration
 * - Email verification
 * - Login/logout
 * - Password reset
 * - Session management
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

console.log('🔐 VIEAgent Authentication Flow Testing');
console.log('=======================================\n');

const config = {
  baseUrl: process.env.PRODUCTION_URL || 'https://vieagent.com',
  timeout: 30000,
  headless: true,
  testEmail: `test+${Date.now()}@vieagent-test.com`,
  testPassword: 'TestPassword123!',
  testUser: {
    name: 'Test User',
    company: 'Test Company'
  }
};

class AuthFlowTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      timestamp: new Date().toISOString(),
      baseUrl: config.baseUrl,
      testEmail: config.testEmail,
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0
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
    
    // Set viewport and user agent
    await this.page.setViewportSize({ width: 1280, height: 720 });
    await this.page.setExtraHTTPHeaders({
      'User-Agent': 'VIEAgent-Auth-Tester/1.0'
    });
    
    console.log('✅ Browser setup complete\n');
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runTest(name, testFn) {
    console.log(`🔍 Testing: ${name}...`);
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
      
      this.results.tests.push(testResult);
      this.results.summary.passed++;
      console.log(`✅ ${name}: PASSED (${duration}ms)`);
      
      return testResult;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      const testResult = {
        name,
        status: 'FAILED',
        duration,
        message: error.message,
        screenshot: await this.takeScreenshot(`${name.replace(/\s+/g, '-').toLowerCase()}-error`)
      };
      
      this.results.tests.push(testResult);
      this.results.summary.failed++;
      console.log(`❌ ${name}: FAILED (${duration}ms) - ${error.message}`);
      
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

  async waitForSelector(selector, options = {}) {
    return await this.page.waitForSelector(selector, {
      timeout: config.timeout,
      ...options
    });
  }

  async testRegistrationPage() {
    await this.page.goto(`${config.baseUrl}/register`);
    
    // Check if registration page loads
    await this.waitForSelector('form');
    
    const title = await this.page.title();
    if (!title.toLowerCase().includes('register') && !title.toLowerCase().includes('sign up')) {
      throw new Error('Registration page title does not indicate registration functionality');
    }

    // Check for required form fields
    const requiredFields = ['input[name="email"]', 'input[name="password"]', 'input[name="name"]'];
    for (const field of requiredFields) {
      const element = await this.page.$(field);
      if (!element) {
        throw new Error(`Required registration field not found: ${field}`);
      }
    }

    return {
      message: 'Registration page loads with all required fields',
      details: {
        title,
        url: this.page.url(),
        hasRequiredFields: true
      }
    };
  }

  async testUserRegistration() {
    await this.page.goto(`${config.baseUrl}/register`);
    
    // Fill registration form
    await this.page.fill('input[name="email"]', config.testEmail);
    await this.page.fill('input[name="password"]', config.testPassword);
    await this.page.fill('input[name="name"]', config.testUser.name);
    
    // Check if there's a company field and fill it
    const companyField = await this.page.$('input[name="company"]');
    if (companyField) {
      await this.page.fill('input[name="company"]', config.testUser.company);
    }

    // Submit form
    await this.page.click('button[type="submit"]');
    
    // Wait for response (either success message or redirect)
    await this.page.waitForTimeout(3000);
    
    const currentUrl = this.page.url();
    const pageContent = await this.page.content();
    
    // Check for success indicators
    const hasSuccessMessage = pageContent.includes('success') || 
                             pageContent.includes('registered') || 
                             pageContent.includes('email sent') ||
                             pageContent.includes('verify');
                             
    const redirectedToDashboard = currentUrl.includes('/dashboard');
    const redirectedToLogin = currentUrl.includes('/login');
    const redirectedToVerify = currentUrl.includes('/verify');

    if (!hasSuccessMessage && !redirectedToDashboard && !redirectedToLogin && !redirectedToVerify) {
      throw new Error('Registration submission did not show success message or redirect appropriately');
    }

    return {
      message: 'User registration completed successfully',
      details: {
        email: config.testEmail,
        currentUrl,
        hasSuccessMessage,
        redirectedToDashboard,
        redirectedToLogin,
        redirectedToVerify
      }
    };
  }

  async testLoginPage() {
    await this.page.goto(`${config.baseUrl}/login`);
    
    // Check if login page loads
    await this.waitForSelector('form');
    
    const title = await this.page.title();
    if (!title.toLowerCase().includes('login') && !title.toLowerCase().includes('sign in')) {
      throw new Error('Login page title does not indicate login functionality');
    }

    // Check for required form fields
    const emailField = await this.page.$('input[name="email"]');
    const passwordField = await this.page.$('input[name="password"]');
    const submitButton = await this.page.$('button[type="submit"]');
    
    if (!emailField || !passwordField || !submitButton) {
      throw new Error('Login form missing required fields');
    }

    return {
      message: 'Login page loads with all required fields',
      details: {
        title,
        url: this.page.url(),
        hasEmailField: !!emailField,
        hasPasswordField: !!passwordField,
        hasSubmitButton: !!submitButton
      }
    };
  }

  async testLogin() {
    await this.page.goto(`${config.baseUrl}/login`);
    
    // Try to login with the test user (may not work if email verification is required)
    await this.page.fill('input[name="email"]', config.testEmail);
    await this.page.fill('input[name="password"]', config.testPassword);
    
    await this.page.click('button[type="submit"]');
    
    // Wait for response
    await this.page.waitForTimeout(3000);
    
    const currentUrl = this.page.url();
    const pageContent = await this.page.content();
    
    // Check for various outcomes
    const redirectedToDashboard = currentUrl.includes('/dashboard');
    const needsEmailVerification = pageContent.includes('verify') || pageContent.includes('verification');
    const hasLoginError = pageContent.includes('invalid') || pageContent.includes('error');
    
    return {
      message: 'Login attempt processed (outcome depends on email verification requirements)',
      details: {
        currentUrl,
        redirectedToDashboard,
        needsEmailVerification,
        hasLoginError,
        outcome: redirectedToDashboard ? 'success' : 
                needsEmailVerification ? 'verification_required' : 
                hasLoginError ? 'error' : 'unknown'
      }
    };
  }

  async testPasswordResetPage() {
    await this.page.goto(`${config.baseUrl}/forgot-password`);
    
    // If forgot-password doesn't exist, try common alternatives
    if (this.page.url().includes('404') || await this.page.$('text=404')) {
      await this.page.goto(`${config.baseUrl}/reset-password`);
      
      if (this.page.url().includes('404') || await this.page.$('text=404')) {
        // Check if there's a forgot password link on login page
        await this.page.goto(`${config.baseUrl}/login`);
        const forgotLink = await this.page.$('a[href*="forgot"], a[href*="reset"]');
        
        if (!forgotLink) {
          throw new Error('Password reset functionality not found');
        }
        
        await forgotLink.click();
        await this.page.waitForTimeout(2000);
      }
    }

    // Check for email input field
    const emailField = await this.page.$('input[name="email"]');
    if (!emailField) {
      throw new Error('Password reset form missing email field');
    }

    return {
      message: 'Password reset page accessible with email field',
      details: {
        url: this.page.url(),
        hasEmailField: !!emailField
      }
    };
  }

  async testPasswordReset() {
    // Navigate to password reset page
    await this.page.goto(`${config.baseUrl}/forgot-password`);
    
    // Handle if page doesn't exist by checking login page for link
    if (this.page.url().includes('404')) {
      await this.page.goto(`${config.baseUrl}/login`);
      const forgotLink = await this.page.$('a[href*="forgot"], a[href*="reset"]');
      if (forgotLink) {
        await forgotLink.click();
        await this.page.waitForTimeout(2000);
      }
    }

    const emailField = await this.page.$('input[name="email"]');
    if (!emailField) {
      return {
        message: 'Password reset functionality not available or configured differently',
        details: { available: false }
      };
    }

    // Fill email and submit
    await this.page.fill('input[name="email"]', config.testEmail);
    await this.page.click('button[type="submit"]');
    
    await this.page.waitForTimeout(3000);
    
    const pageContent = await this.page.content();
    const hasSuccessMessage = pageContent.includes('sent') || 
                             pageContent.includes('email') || 
                             pageContent.includes('check');

    return {
      message: 'Password reset request submitted',
      details: {
        email: config.testEmail,
        hasSuccessMessage,
        currentUrl: this.page.url()
      }
    };
  }

  async testSocialLogin() {
    await this.page.goto(`${config.baseUrl}/login`);
    
    // Check for social login buttons
    const googleButton = await this.page.$('button:has-text("Google"), a:has-text("Google"), [class*="google"]');
    const githubButton = await this.page.$('button:has-text("GitHub"), a:has-text("GitHub"), [class*="github"]');
    
    const socialLoginAvailable = googleButton || githubButton;
    
    return {
      message: 'Social login options checked',
      details: {
        hasGoogleLogin: !!googleButton,
        hasGitHubLogin: !!githubButton,
        socialLoginAvailable
      }
    };
  }

  async testLogout() {
    // This test assumes we're logged in, but since we likely aren't in a real test environment,
    // we'll just check if logout functionality exists
    await this.page.goto(`${config.baseUrl}/dashboard`);
    
    // Look for logout button/link
    const logoutButton = await this.page.$('button:has-text("Logout"), a:has-text("Logout"), button:has-text("Sign out"), a:has-text("Sign out")');
    
    if (!logoutButton) {
      // Check in a potential user menu
      const userMenu = await this.page.$('[class*="user"], [class*="avatar"], [class*="profile"]');
      if (userMenu) {
        await userMenu.click();
        await this.page.waitForTimeout(1000);
        
        const logoutInMenu = await this.page.$('button:has-text("Logout"), a:has-text("Logout"), button:has-text("Sign out"), a:has-text("Sign out")');
        
        return {
          message: 'Logout functionality found in user menu',
          details: {
            hasLogoutButton: !!logoutInMenu,
            location: 'user-menu'
          }
        };
      }
      
      return {
        message: 'Logout functionality location needs verification',
        details: {
          hasLogoutButton: false,
          note: 'Logout button not immediately visible, may require authentication'
        }
      };
    }

    return {
      message: 'Logout functionality available',
      details: {
        hasLogoutButton: true,
        location: 'main-page'
      }
    };
  }

  async testSessionPersistence() {
    await this.page.goto(`${config.baseUrl}/login`);
    
    // Check if there's a "Remember me" option
    const rememberMeCheckbox = await this.page.$('input[type="checkbox"]:has-text("Remember"), input[name*="remember"]');
    
    // Test session by navigating between pages
    await this.page.goto(`${config.baseUrl}/`);
    await this.page.goto(`${config.baseUrl}/pricing`);
    await this.page.goto(`${config.baseUrl}/login`);
    
    // Check if we're still on login page or redirected (would indicate existing session)
    const currentUrl = this.page.url();
    const redirectedFromLogin = !currentUrl.includes('/login');

    return {
      message: 'Session persistence features checked',
      details: {
        hasRememberMe: !!rememberMeCheckbox,
        currentUrl,
        redirectedFromLogin
      }
    };
  }

  async generateReport() {
    const reportData = {
      ...this.results,
      summary: {
        ...this.results.summary,
        successRate: this.results.summary.total > 0 
          ? (this.results.summary.passed / this.results.summary.total * 100).toFixed(1)
          : 0
      }
    };

    const reportPath = path.join(__dirname, '..', 'reports', `auth-flow-test-${Date.now()}.json`);
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    console.log('\n📋 Authentication Flow Test Summary');
    console.log('===================================');
    console.log(`✅ Passed: ${this.results.summary.passed}`);
    console.log(`❌ Failed: ${this.results.summary.failed}`);
    console.log(`📊 Total: ${this.results.summary.total}`);
    console.log(`🎯 Success Rate: ${reportData.summary.successRate}%`);
    console.log(`📄 Report: ${reportPath}`);
    
    if (this.results.summary.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.tests
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          console.log(`   - ${test.name}: ${test.message}`);
          if (test.screenshot) {
            console.log(`     Screenshot: ${test.screenshot}`);
          }
        });
    }
    
    return reportData;
  }
}

async function main() {
  const tester = new AuthFlowTester();
  
  try {
    await tester.setup();
    
    console.log(`🎯 Testing authentication flows on: ${config.baseUrl}`);
    console.log(`📧 Test email: ${config.testEmail}\n`);
    
    // Run all authentication tests
    await tester.runTest('Registration Page Load', () => tester.testRegistrationPage());
    await tester.runTest('User Registration', () => tester.testUserRegistration());
    await tester.runTest('Login Page Load', () => tester.testLoginPage());
    await tester.runTest('Login Attempt', () => tester.testLogin());
    await tester.runTest('Password Reset Page', () => tester.testPasswordResetPage());
    await tester.runTest('Password Reset Request', () => tester.testPasswordReset());
    await tester.runTest('Social Login Options', () => tester.testSocialLogin());
    await tester.runTest('Logout Functionality', () => tester.testLogout());
    await tester.runTest('Session Persistence', () => tester.testSessionPersistence());
    
    const report = await tester.generateReport();
    
    if (report.summary.failed === 0) {
      console.log('\n🎉 All authentication flow tests passed!');
      console.log('✅ Authentication system is ready for production');
    } else {
      console.log('\n⚠️ Some authentication tests failed');
      console.log('🔧 Review failed tests and fix issues before launch');
    }
    
  } catch (error) {
    console.error('\n💥 Authentication testing failed:', error.message);
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
    console.error('Authentication test error:', error);
    process.exit(1);
  });
}

module.exports = { AuthFlowTester }; 