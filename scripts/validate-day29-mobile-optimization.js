#!/usr/bin/env node

/**
 * Day 29 Mobile Optimization Validation Script
 * Tests all mobile-specific features and optimizations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Day 29: Mobile Optimization Validation');
console.log('==========================================\n');

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

function logResult(test, status, message, details = null) {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} ${test}: ${message}`);
  
  if (details) {
    console.log(`   ${details}`);
  }
  
  results.details.push({ test, status, message, details });
  
  if (status === 'PASS') results.passed++;
  else if (status === 'FAIL') results.failed++;
  else results.warnings++;
}

function checkFileExists(filePath, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  const exists = fs.existsSync(fullPath);
  
  logResult(
    description,
    exists ? 'PASS' : 'FAIL',
    exists ? 'File exists' : 'File missing',
    exists ? null : `Expected: ${fullPath}`
  );
  
  return exists;
}

function checkFileContent(filePath, pattern, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    logResult(description, 'FAIL', 'File not found');
    return false;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  const hasPattern = pattern.test(content);
  
  logResult(
    description,
    hasPattern ? 'PASS' : 'FAIL',
    hasPattern ? 'Pattern found' : 'Pattern missing',
    hasPattern ? null : `Looking for: ${pattern.toString()}`
  );
  
  return hasPattern;
}

function validatePackageJson() {
  console.log('\n📦 Package Dependencies Validation');
  console.log('----------------------------------');
  
  const packagePath = path.join(__dirname, '..', 'package.json');
  if (!fs.existsSync(packagePath)) {
    logResult('Package.json', 'FAIL', 'package.json not found');
    return;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  // Check for mobile-specific dependencies
  const requiredDeps = [
    'react-swipeable',
    'next',
    'react',
    'tailwindcss'
  ];
  
  requiredDeps.forEach(dep => {
    const hasDepency = dependencies[dep];
    logResult(
      `Dependency: ${dep}`,
      hasDepency ? 'PASS' : 'FAIL',
      hasDepency ? `Version: ${dependencies[dep]}` : 'Missing dependency'
    );
  });
}

function validateMobileComponents() {
  console.log('\n📱 Mobile Component Validation');
  console.log('-----------------------------');
  
  // Check for mobile-optimized components
  const components = [
    'src/components/ui/MobileOptimizedLayout.tsx',
    'src/components/chat/MobileChatInterface.tsx',
    'src/components/ui/TouchOptimizedComponents.tsx',
    'src/components/ui/OfflineSupport.tsx'
  ];
  
  components.forEach(component => {
    checkFileExists(component, `Mobile Component: ${path.basename(component)}`);
  });
  
  // Check for specific mobile features in components
  checkFileContent(
    'src/components/ui/TouchOptimizedComponents.tsx',
    /TouchButton|SwipeableCard|TouchSlider/,
    'Touch-optimized components'
  );
  
  checkFileContent(
    'src/components/chat/MobileChatInterface.tsx',
    /useSwipeable|voice.*recording|file.*upload/i,
    'Mobile chat features'
  );
  
  checkFileContent(
    'src/components/ui/OfflineSupport.tsx',
    /IndexedDB|serviceWorker|offline/i,
    'Offline support features'
  );
}

function validateMobilePages() {
  console.log('\n📄 Mobile Page Validation');
  console.log('------------------------');
  
  // Check for mobile-specific pages
  const pages = [
    'src/app/dashboard/chat/mobile/page.tsx'
  ];
  
  pages.forEach(page => {
    checkFileExists(page, `Mobile Page: ${path.basename(page)}`);
  });
  
  // Check for mobile-specific features in pages
  checkFileContent(
    'src/app/dashboard/chat/mobile/page.tsx',
    /MobileOptimizedLayout|MobileChatInterface|TouchButton/,
    'Mobile page components integration'
  );
}

function validateServiceWorker() {
  console.log('\n🔧 Service Worker Validation');
  console.log('---------------------------');
  
  checkFileExists('public/sw.js', 'Service Worker file');
  
  checkFileContent(
    'public/sw.js',
    /cache|offline|background.*sync/i,
    'Service Worker caching features'
  );
  
  checkFileContent(
    'public/sw.js',
    /push.*notification|notification.*click/i,
    'Service Worker notification features'
  );
}

function validatePWAManifest() {
  console.log('\n🎯 PWA Manifest Validation');
  console.log('-------------------------');
  
  checkFileExists('public/manifest.json', 'PWA Manifest file');
  
  if (fs.existsSync(path.join(__dirname, '..', 'public/manifest.json'))) {
    const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'public/manifest.json'), 'utf8'));
    
    const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons', 'theme_color', 'background_color'];
    requiredFields.forEach(field => {
      const hasField = manifest[field];
      logResult(
        `Manifest field: ${field}`,
        hasField ? 'PASS' : 'FAIL',
        hasField ? 'Field present' : 'Field missing'
      );
    });
    
    // Check for mobile-specific features
    const mobileFeatures = ['shortcuts', 'share_target', 'file_handlers'];
    mobileFeatures.forEach(feature => {
      const hasFeature = manifest[feature];
      logResult(
        `Mobile feature: ${feature}`,
        hasFeature ? 'PASS' : 'WARN',
        hasFeature ? 'Feature configured' : 'Feature not configured'
      );
    });
  }
}

function validateMobileCSS() {
  console.log('\n🎨 Mobile CSS Validation');
  console.log('-----------------------');
  
  checkFileContent(
    'src/app/globals.css',
    /@media.*max-width.*768px/,
    'Mobile media queries'
  );
  
  checkFileContent(
    'src/app/globals.css',
    /touch.*target|tap.*highlight|webkit.*tap/i,
    'Touch optimization styles'
  );
  
  checkFileContent(
    'src/app/globals.css',
    /scroll.*behavior|overflow.*scrolling/i,
    'Scroll optimization styles'
  );
  
  checkFileContent(
    'src/app/globals.css',
    /haptic|vibrat|gesture/i,
    'Haptic feedback styles'
  );
}

function validateResponsiveDesign() {
  console.log('\n📐 Responsive Design Validation');
  console.log('------------------------------');
  
  // Check for responsive utilities in main layout
  checkFileContent(
    'src/components/ui/DashboardLayout.tsx',
    /sm:|md:|lg:|xl:|2xl:/,
    'Responsive breakpoints in layout'
  );
  
  checkFileContent(
    'src/components/ui/MobileOptimizedLayout.tsx',
    /fixed.*top|bottom.*nav|mobile.*header/i,
    'Mobile layout structure'
  );
  
  // Check for mobile-first approach
  checkFileContent(
    'src/app/globals.css',
    /@media.*orientation.*landscape/,
    'Landscape orientation handling'
  );
}

function validateTouchOptimization() {
  console.log('\n👆 Touch Optimization Validation');
  console.log('-------------------------------');
  
  checkFileContent(
    'src/components/ui/TouchOptimizedComponents.tsx',
    /min.*height.*44px|min.*width.*44px/,
    'Touch target size optimization'
  );
  
  checkFileContent(
    'src/components/ui/TouchOptimizedComponents.tsx',
    /onTouchStart|onTouchEnd|onTouchMove/,
    'Touch event handling'
  );
  
  checkFileContent(
    'src/components/ui/TouchOptimizedComponents.tsx',
    /haptic.*feedback|vibrate/i,
    'Haptic feedback implementation'
  );
}

function validateOfflineCapabilities() {
  console.log('\n🔌 Offline Capabilities Validation');
  console.log('---------------------------------');
  
  checkFileContent(
    'src/components/ui/OfflineSupport.tsx',
    /IndexedDB|localStorage|sessionStorage/,
    'Local storage implementation'
  );
  
  checkFileContent(
    'src/components/ui/OfflineSupport.tsx',
    /navigator\.onLine|online.*event|offline.*event/,
    'Online/offline detection'
  );
  
  checkFileContent(
    'public/sw.js',
    /background.*sync|sync.*register/i,
    'Background sync capability'
  );
}

function validateMobilePerformance() {
  console.log('\n⚡ Mobile Performance Validation');
  console.log('------------------------------');
  
  checkFileContent(
    'src/app/globals.css',
    /transform.*scale|transition.*duration/,
    'CSS animations optimization'
  );
  
  checkFileContent(
    'src/components/ui/TouchOptimizedComponents.tsx',
    /useCallback|useMemo|React\.memo/,
    'React performance optimizations'
  );
  
  checkFileContent(
    'public/sw.js',
    /cache.*first|network.*first/i,
    'Caching strategies'
  );
}

function validateAccessibility() {
  console.log('\n♿ Accessibility Validation');
  console.log('-------------------------');
  
  checkFileContent(
    'src/app/globals.css',
    /prefers.*reduced.*motion|focus.*visible/,
    'Accessibility CSS features'
  );
  
  checkFileContent(
    'src/components/ui/TouchOptimizedComponents.tsx',
    /aria.*label|role=|title=/,
    'ARIA attributes'
  );
  
  checkFileContent(
    'src/components/ui/MobileOptimizedLayout.tsx',
    /alt=|aria.*|role=/,
    'Accessibility attributes in layout'
  );
}

function checkNextJSConfiguration() {
  console.log('\n⚙️ Next.js Configuration Validation');
  console.log('----------------------------------');
  
  const nextConfigPath = path.join(__dirname, '..', 'next.config.js');
  if (fs.existsSync(nextConfigPath)) {
    checkFileContent(
      'next.config.js',
      /pwa|workbox|manifest/i,
      'PWA configuration'
    );
  } else {
    logResult('Next.js Config', 'WARN', 'next.config.js not found - PWA features may not work');
  }
}

function validateTypeScriptSupport() {
  console.log('\n🔷 TypeScript Support Validation');
  console.log('-------------------------------');
  
  // Check for proper TypeScript interfaces
  checkFileContent(
    'src/components/ui/TouchOptimizedComponents.tsx',
    /interface.*Props|type.*=.*{/,
    'TypeScript interfaces'
  );
  
  checkFileContent(
    'src/components/chat/MobileChatInterface.tsx',
    /interface.*Message|interface.*Props/,
    'Chat interface types'
  );
}

function runValidationTests() {
  console.log('Starting Day 29 Mobile Optimization validation...\n');
  
  try {
    validatePackageJson();
    validateMobileComponents();
    validateMobilePages();
    validateServiceWorker();
    validatePWAManifest();
    validateMobileCSS();
    validateResponsiveDesign();
    validateTouchOptimization();
    validateOfflineCapabilities();
    validateMobilePerformance();
    validateAccessibility();
    checkNextJSConfiguration();
    validateTypeScriptSupport();
    
  } catch (error) {
    console.error('❌ Validation failed with error:', error.message);
    results.failed++;
  }
}

function generateReport() {
  console.log('\n📊 Validation Report');
  console.log('===================');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️  Warnings: ${results.warnings}`);
  console.log(`📋 Total Tests: ${results.passed + results.failed + results.warnings}`);
  
  const successRate = ((results.passed / (results.passed + results.failed + results.warnings)) * 100).toFixed(1);
  console.log(`📈 Success Rate: ${successRate}%`);
  
  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.details
      .filter(r => r.status === 'FAIL')
      .forEach(r => console.log(`   - ${r.test}: ${r.message}`));
  }
  
  if (results.warnings > 0) {
    console.log('\n⚠️  Warnings:');
    results.details
      .filter(r => r.status === 'WARN')
      .forEach(r => console.log(`   - ${r.test}: ${r.message}`));
  }
  
  // Save detailed report
  const reportPath = path.join(__dirname, '..', 'test-reports', 'day29-mobile-optimization-results.json');
  const reportDir = path.dirname(reportPath);
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const report = {
    timestamp: new Date().toISOString(),
    day: 29,
    feature: 'Mobile Optimization',
    summary: {
      passed: results.passed,
      failed: results.failed,
      warnings: results.warnings,
      successRate: parseFloat(successRate)
    },
    details: results.details,
    recommendations: [
      'Ensure all touch targets are at least 44px in size',
      'Test on real mobile devices for optimal performance',
      'Verify offline functionality works correctly',
      'Check PWA installation process on mobile browsers',
      'Validate haptic feedback on supported devices',
      'Test swipe gestures across different screen sizes',
      'Verify service worker caching strategies',
      'Check accessibility with screen readers'
    ]
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  return results.failed === 0;
}

// Run validation
runValidationTests();
const success = generateReport();

console.log('\n🎯 Day 29 Mobile Optimization Status:');
if (success) {
  console.log('✅ ALL MOBILE OPTIMIZATION FEATURES VALIDATED SUCCESSFULLY!');
  console.log('🚀 Ready for mobile deployment and testing');
} else {
  console.log('❌ Some mobile optimization features need attention');
  console.log('🔧 Please fix the failed tests before proceeding');
}

console.log('\n📱 Next Steps:');
console.log('1. Test on real mobile devices');
console.log('2. Verify PWA installation works');
console.log('3. Test offline functionality');
console.log('4. Check performance on low-end devices');
console.log('5. Validate accessibility features');
console.log('6. Test touch gestures and haptic feedback');

process.exit(success ? 0 : 1); 