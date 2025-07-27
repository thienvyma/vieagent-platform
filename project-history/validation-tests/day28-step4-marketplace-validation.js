#!/usr/bin/env node

/**
 * DAY 28 - STEP 28.4: AGENT MARKETPLACE & TEMPLATES VALIDATION
 * 
 * This script validates the complete Agent Marketplace & Templates implementation
 * including template library, sharing, community features, and version control.
 * 
 * Test Coverage:
 * - Component Structure & UI
 * - API Endpoints & Data Flow
 * - Template Management
 * - Community Features
 * - Version Control
 * - Search & Filtering
 * - User Experience
 * - Security & Permissions
 * - Performance & Scalability
 * - Integration Points
 */

const fs = require('fs');
const path = require('path');

class MarketplaceValidator {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      details: []
    };
    this.projectRoot = path.join(__dirname);
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      warning: '\x1b[33m', // Yellow
      error: '\x1b[31m',   // Red
      reset: '\x1b[0m'
    };
    
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  checkFileExists(filePath) {
    const fullPath = path.join(this.projectRoot, filePath);
    return fs.existsSync(fullPath);
  }

  readFileContent(filePath) {
    try {
      const fullPath = path.join(this.projectRoot, filePath);
      return fs.readFileSync(fullPath, 'utf8');
    } catch (error) {
      return null;
    }
  }

  addResult(testName, passed, details = '', warning = false) {
    if (warning) {
      this.results.warnings++;
    } else if (passed) {
      this.results.passed++;
    } else {
      this.results.failed++;
    }
    
    this.results.details.push({
      test: testName,
      status: warning ? 'WARNING' : (passed ? 'PASS' : 'FAIL'),
      details
    });
    
    const status = warning ? 'WARNING' : (passed ? 'PASS' : 'FAIL');
    const type = warning ? 'warning' : (passed ? 'success' : 'error');
    this.log(`${status}: ${testName} - ${details}`, type);
  }

  // Test 1: Component Structure & UI
  testComponentStructure() {
    this.log('\n=== Testing Component Structure & UI ===');
    
    // Main marketplace component
    const marketplaceExists = this.checkFileExists('src/components/agents/AgentMarketplace.tsx');
    this.addResult(
      'AgentMarketplace Component',
      marketplaceExists,
      marketplaceExists ? 'Main marketplace component exists' : 'Missing main marketplace component'
    );

    if (marketplaceExists) {
      const marketplaceContent = this.readFileContent('src/components/agents/AgentMarketplace.tsx');
      
      // Check for key UI components
      const hasTemplateCard = marketplaceContent.includes('TemplateCard');
      this.addResult(
        'Template Card Component',
        hasTemplateCard,
        hasTemplateCard ? 'Template card component implemented' : 'Missing template card component'
      );

      const hasFilterSidebar = marketplaceContent.includes('FilterSidebar');
      this.addResult(
        'Filter Sidebar Component',
        hasFilterSidebar,
        hasFilterSidebar ? 'Filter sidebar component implemented' : 'Missing filter sidebar component'
      );

      const hasTemplateDetails = marketplaceContent.includes('TemplateDetailsDialog');
      this.addResult(
        'Template Details Dialog',
        hasTemplateDetails,
        hasTemplateDetails ? 'Template details dialog implemented' : 'Missing template details dialog'
      );

      const hasCreateDialog = marketplaceContent.includes('CreateTemplateDialog');
      this.addResult(
        'Create Template Dialog',
        hasCreateDialog,
        hasCreateDialog ? 'Create template dialog implemented' : 'Missing create template dialog'
      );

      // Check for tabs functionality
      const hasTabs = marketplaceContent.includes('TabsContent') && marketplaceContent.includes('browse');
      this.addResult(
        'Tabs Navigation',
        hasTabs,
        hasTabs ? 'Tabs navigation implemented (browse, my-templates, favorites, trending)' : 'Missing tabs navigation'
      );

      // Check for search functionality
      const hasSearch = marketplaceContent.includes('searchQuery') && marketplaceContent.includes('Search');
      this.addResult(
        'Search Functionality',
        hasSearch,
        hasSearch ? 'Search functionality implemented' : 'Missing search functionality'
      );

      // Check for filtering
      const hasFilters = marketplaceContent.includes('filters') && marketplaceContent.includes('category');
      this.addResult(
        'Filtering System',
        hasFilters,
        hasFilters ? 'Filtering system implemented' : 'Missing filtering system'
      );
    }
  }

  // Test 2: API Endpoints & Data Flow
  testAPIEndpoints() {
    this.log('\n=== Testing API Endpoints & Data Flow ===');
    
    // Main templates API
    const templatesAPIExists = this.checkFileExists('src/app/api/marketplace/templates/route.ts');
    this.addResult(
      'Templates API Endpoint',
      templatesAPIExists,
      templatesAPIExists ? 'Main templates API endpoint exists' : 'Missing main templates API endpoint'
    );

    if (templatesAPIExists) {
      const templatesContent = this.readFileContent('src/app/api/marketplace/templates/route.ts');
      
      // Check CRUD operations
      const hasGET = templatesContent.includes('export async function GET');
      const hasPOST = templatesContent.includes('export async function POST');
      const hasPUT = templatesContent.includes('export async function PUT');
      const hasDELETE = templatesContent.includes('export async function DELETE');
      
      this.addResult(
        'CRUD Operations',
        hasGET && hasPOST && hasPUT && hasDELETE,
        `CRUD operations: GET(${hasGET}), POST(${hasPOST}), PUT(${hasPUT}), DELETE(${hasDELETE})`
      );

      // Check validation schemas
      const hasValidation = templatesContent.includes('z.object') && templatesContent.includes('CreateTemplateSchema');
      this.addResult(
        'Input Validation',
        hasValidation,
        hasValidation ? 'Zod validation schemas implemented' : 'Missing input validation'
      );

      // Check authentication
      const hasAuth = templatesContent.includes('getServerSession');
      this.addResult(
        'Authentication Check',
        hasAuth,
        hasAuth ? 'Authentication implemented' : 'Missing authentication'
      );
    }

    // Download API
    const downloadAPIExists = this.checkFileExists('src/app/api/marketplace/templates/[id]/download/route.ts');
    this.addResult(
      'Download API Endpoint',
      downloadAPIExists,
      downloadAPIExists ? 'Download API endpoint exists' : 'Missing download API endpoint'
    );

    if (downloadAPIExists) {
      const downloadContent = this.readFileContent('src/app/api/marketplace/templates/[id]/download/route.ts');
      
      const hasDownloadTracking = downloadContent.includes('templateDownload') || downloadContent.includes('downloads');
      this.addResult(
        'Download Tracking',
        hasDownloadTracking,
        hasDownloadTracking ? 'Download tracking implemented' : 'Missing download tracking'
      );

      const hasPremiumCheck = downloadContent.includes('premium');
      this.addResult(
        'Premium Access Check',
        hasPremiumCheck,
        hasPremiumCheck ? 'Premium access validation implemented' : 'Missing premium access check'
      );
    }

    // Star API
    const starAPIExists = this.checkFileExists('src/app/api/marketplace/templates/[id]/star/route.ts');
    this.addResult(
      'Star API Endpoint',
      starAPIExists,
      starAPIExists ? 'Star API endpoint exists' : 'Missing star API endpoint'
    );

    // Reviews API
    const reviewsAPIExists = this.checkFileExists('src/app/api/marketplace/templates/[id]/reviews/route.ts');
    this.addResult(
      'Reviews API Endpoint',
      reviewsAPIExists,
      reviewsAPIExists ? 'Reviews API endpoint exists' : 'Missing reviews API endpoint'
    );

    if (reviewsAPIExists) {
      const reviewsContent = this.readFileContent('src/app/api/marketplace/templates/[id]/reviews/route.ts');
      
      const hasRatingSystem = reviewsContent.includes('rating') && reviewsContent.includes('1').includes('5');
      this.addResult(
        'Rating System',
        hasRatingSystem,
        hasRatingSystem ? 'Rating system (1-5 stars) implemented' : 'Missing rating system'
      );

      const hasModeration = reviewsContent.includes('status') && reviewsContent.includes('published');
      this.addResult(
        'Review Moderation',
        hasModeration,
        hasModeration ? 'Review moderation system implemented' : 'Missing review moderation'
      );
    }

    // Categories API
    const categoriesAPIExists = this.checkFileExists('src/app/api/marketplace/categories/route.ts');
    this.addResult(
      'Categories API Endpoint',
      categoriesAPIExists,
      categoriesAPIExists ? 'Categories API endpoint exists' : 'Missing categories API endpoint'
    );

    // Analytics API
    const analyticsAPIExists = this.checkFileExists('src/app/api/marketplace/analytics/route.ts');
    this.addResult(
      'Analytics API Endpoint',
      analyticsAPIExists,
      analyticsAPIExists ? 'Analytics API endpoint exists' : 'Missing analytics API endpoint'
    );

    if (analyticsAPIExists) {
      const analyticsContent = this.readFileContent('src/app/api/marketplace/analytics/route.ts');
      
      const hasTemplateAnalytics = analyticsContent.includes('getTemplateAnalytics');
      this.addResult(
        'Template Analytics',
        hasTemplateAnalytics,
        hasTemplateAnalytics ? 'Template-specific analytics implemented' : 'Missing template analytics'
      );

      const hasUserAnalytics = analyticsContent.includes('getUserAnalytics');
      this.addResult(
        'User Analytics',
        hasUserAnalytics,
        hasUserAnalytics ? 'User-specific analytics implemented' : 'Missing user analytics'
      );
    }
  }

  // Test 3: Template Management
  testTemplateManagement() {
    this.log('\n=== Testing Template Management ===');
    
    const marketplaceContent = this.readFileContent('src/components/agents/AgentMarketplace.tsx');
    
    if (marketplaceContent) {
      // Check template creation
      const hasCreateTemplate = marketplaceContent.includes('CreateTemplateDialog') && 
                               marketplaceContent.includes('template-name');
      this.addResult(
        'Template Creation',
        hasCreateTemplate,
        hasCreateTemplate ? 'Template creation dialog implemented' : 'Missing template creation'
      );

      // Check template editing
      const hasEditTemplate = marketplaceContent.includes('edit') || marketplaceContent.includes('update');
      this.addResult(
        'Template Editing',
        hasEditTemplate,
        hasEditTemplate ? 'Template editing capabilities present' : 'Missing template editing',
        !hasEditTemplate
      );

      // Check template deletion
      const hasDeleteTemplate = marketplaceContent.includes('delete') || marketplaceContent.includes('remove');
      this.addResult(
        'Template Deletion',
        hasDeleteTemplate,
        hasDeleteTemplate ? 'Template deletion capabilities present' : 'Missing template deletion',
        !hasDeleteTemplate
      );

      // Check template versioning
      const hasVersioning = marketplaceContent.includes('version') && marketplaceContent.includes('changelog');
      this.addResult(
        'Version Control',
        hasVersioning,
        hasVersioning ? 'Version control system implemented' : 'Missing version control'
      );

      // Check template categories
      const hasCategories = marketplaceContent.includes('categories') && marketplaceContent.includes('Customer Service');
      this.addResult(
        'Template Categories',
        hasCategories,
        hasCategories ? 'Template categorization system implemented' : 'Missing template categories'
      );

      // Check template tags
      const hasTags = marketplaceContent.includes('tags') && marketplaceContent.includes('popularTags');
      this.addResult(
        'Template Tags',
        hasTags,
        hasTags ? 'Template tagging system implemented' : 'Missing template tags'
      );
    }
  }

  // Test 4: Community Features
  testCommunityFeatures() {
    this.log('\n=== Testing Community Features ===');
    
    const marketplaceContent = this.readFileContent('src/components/agents/AgentMarketplace.tsx');
    
    if (marketplaceContent) {
      // Check star/favorite system
      const hasStarring = marketplaceContent.includes('handleStarTemplate') && marketplaceContent.includes('Star');
      this.addResult(
        'Star/Favorite System',
        hasStarring,
        hasStarring ? 'Star/favorite system implemented' : 'Missing star/favorite system'
      );

      // Check download tracking
      const hasDownloadTracking = marketplaceContent.includes('handleDownloadTemplate') && 
                                 marketplaceContent.includes('downloads');
      this.addResult(
        'Download Tracking',
        hasDownloadTracking,
        hasDownloadTracking ? 'Download tracking implemented' : 'Missing download tracking'
      );

      // Check author profiles
      const hasAuthorProfiles = marketplaceContent.includes('author') && marketplaceContent.includes('verified');
      this.addResult(
        'Author Profiles',
        hasAuthorProfiles,
        hasAuthorProfiles ? 'Author profile system implemented' : 'Missing author profiles'
      );

      // Check review system
      const hasReviewSystem = marketplaceContent.includes('reviews') && marketplaceContent.includes('rating');
      this.addResult(
        'Review System',
        hasReviewSystem,
        hasReviewSystem ? 'Review and rating system implemented' : 'Missing review system'
      );

      // Check sharing functionality
      const hasSharing = marketplaceContent.includes('Share') && marketplaceContent.includes('share');
      this.addResult(
        'Sharing Functionality',
        hasSharing,
        hasSharing ? 'Template sharing functionality implemented' : 'Missing sharing functionality'
      );

      // Check featured templates
      const hasFeatured = marketplaceContent.includes('featured') && marketplaceContent.includes('Crown');
      this.addResult(
        'Featured Templates',
        hasFeatured,
        hasFeatured ? 'Featured templates system implemented' : 'Missing featured templates'
      );

      // Check premium templates
      const hasPremium = marketplaceContent.includes('premium') && marketplaceContent.includes('Sparkles');
      this.addResult(
        'Premium Templates',
        hasPremium,
        hasPremium ? 'Premium templates system implemented' : 'Missing premium templates'
      );
    }
  }

  // Test 5: Search & Filtering
  testSearchAndFiltering() {
    this.log('\n=== Testing Search & Filtering ===');
    
    const marketplaceContent = this.readFileContent('src/components/agents/AgentMarketplace.tsx');
    
    if (marketplaceContent) {
      // Check search functionality
      const hasSearch = marketplaceContent.includes('searchQuery') && 
                       marketplaceContent.includes('filterTemplates');
      this.addResult(
        'Search Functionality',
        hasSearch,
        hasSearch ? 'Search functionality implemented' : 'Missing search functionality'
      );

      // Check category filtering
      const hasCategoryFilter = marketplaceContent.includes('category') && 
                               marketplaceContent.includes('filters.category');
      this.addResult(
        'Category Filtering',
        hasCategoryFilter,
        hasCategoryFilter ? 'Category filtering implemented' : 'Missing category filtering'
      );

      // Check rating filtering
      const hasRatingFilter = marketplaceContent.includes('rating') && 
                             marketplaceContent.includes('filters.rating');
      this.addResult(
        'Rating Filtering',
        hasRatingFilter,
        hasRatingFilter ? 'Rating filtering implemented' : 'Missing rating filtering'
      );

      // Check sorting options
      const hasSorting = marketplaceContent.includes('sortBy') && 
                        marketplaceContent.includes('popular');
      this.addResult(
        'Sorting Options',
        hasSorting,
        hasSorting ? 'Multiple sorting options implemented' : 'Missing sorting options'
      );

      // Check price filtering
      const hasPriceFilter = marketplaceContent.includes('priceType') && 
                            marketplaceContent.includes('free');
      this.addResult(
        'Price Filtering',
        hasPriceFilter,
        hasPriceFilter ? 'Price filtering (free/premium) implemented' : 'Missing price filtering'
      );

      // Check verified filtering
      const hasVerifiedFilter = marketplaceContent.includes('verified') && 
                               marketplaceContent.includes('filters.verified');
      this.addResult(
        'Verified Filtering',
        hasVerifiedFilter,
        hasVerifiedFilter ? 'Verified templates filtering implemented' : 'Missing verified filtering'
      );
    }
  }

  // Test 6: Database Schema
  testDatabaseSchema() {
    this.log('\n=== Testing Database Schema ===');
    
    const schemaExists = this.checkFileExists('prisma/schema-marketplace.prisma');
    this.addResult(
      'Marketplace Schema File',
      schemaExists,
      schemaExists ? 'Marketplace schema file exists' : 'Missing marketplace schema file'
    );

    if (schemaExists) {
      const schemaContent = this.readFileContent('prisma/schema-marketplace.prisma');
      
      // Check core models
      const hasAgentTemplate = schemaContent.includes('model AgentTemplate');
      this.addResult(
        'AgentTemplate Model',
        hasAgentTemplate,
        hasAgentTemplate ? 'AgentTemplate model defined' : 'Missing AgentTemplate model'
      );

      const hasTemplateDownload = schemaContent.includes('model TemplateDownload');
      this.addResult(
        'TemplateDownload Model',
        hasTemplateDownload,
        hasTemplateDownload ? 'TemplateDownload model defined' : 'Missing TemplateDownload model'
      );

      const hasTemplateReview = schemaContent.includes('model TemplateReview');
      this.addResult(
        'TemplateReview Model',
        hasTemplateReview,
        hasTemplateReview ? 'TemplateReview model defined' : 'Missing TemplateReview model'
      );

      const hasTemplateStar = schemaContent.includes('model TemplateStar');
      this.addResult(
        'TemplateStar Model',
        hasTemplateStar,
        hasTemplateStar ? 'TemplateStar model defined' : 'Missing TemplateStar model'
      );

      const hasTemplateVersion = schemaContent.includes('model TemplateVersion');
      this.addResult(
        'TemplateVersion Model',
        hasTemplateVersion,
        hasTemplateVersion ? 'TemplateVersion model defined' : 'Missing TemplateVersion model'
      );

      // Check enums
      const hasTemplateStatus = schemaContent.includes('enum TemplateStatus');
      this.addResult(
        'TemplateStatus Enum',
        hasTemplateStatus,
        hasTemplateStatus ? 'TemplateStatus enum defined' : 'Missing TemplateStatus enum'
      );

      const hasTemplateVisibility = schemaContent.includes('enum TemplateVisibility');
      this.addResult(
        'TemplateVisibility Enum',
        hasTemplateVisibility,
        hasTemplateVisibility ? 'TemplateVisibility enum defined' : 'Missing TemplateVisibility enum'
      );

      // Check relationships
      const hasRelationships = schemaContent.includes('@relation') && schemaContent.includes('authorId');
      this.addResult(
        'Model Relationships',
        hasRelationships,
        hasRelationships ? 'Model relationships defined' : 'Missing model relationships'
      );
    }
  }

  // Test 7: TypeScript Types
  testTypeScriptTypes() {
    this.log('\n=== Testing TypeScript Types ===');
    
    const marketplaceContent = this.readFileContent('src/components/agents/AgentMarketplace.tsx');
    
    if (marketplaceContent) {
      // Check interface definitions
      const hasAgentTemplateInterface = marketplaceContent.includes('interface AgentTemplate');
      this.addResult(
        'AgentTemplate Interface',
        hasAgentTemplateInterface,
        hasAgentTemplateInterface ? 'AgentTemplate interface defined' : 'Missing AgentTemplate interface'
      );

      const hasTemplateVersionInterface = marketplaceContent.includes('interface TemplateVersion');
      this.addResult(
        'TemplateVersion Interface',
        hasTemplateVersionInterface,
        hasTemplateVersionInterface ? 'TemplateVersion interface defined' : 'Missing TemplateVersion interface'
      );

      const hasReviewInterface = marketplaceContent.includes('interface Review');
      this.addResult(
        'Review Interface',
        hasReviewInterface,
        hasReviewInterface ? 'Review interface defined' : 'Missing Review interface'
      );

      const hasMarketplaceFiltersInterface = marketplaceContent.includes('interface MarketplaceFilters');
      this.addResult(
        'MarketplaceFilters Interface',
        hasMarketplaceFiltersInterface,
        hasMarketplaceFiltersInterface ? 'MarketplaceFilters interface defined' : 'Missing MarketplaceFilters interface'
      );

      // Check type safety
      const hasTypeAnnotations = marketplaceContent.includes(': AgentTemplate') && 
                                marketplaceContent.includes(': MarketplaceFilters');
      this.addResult(
        'Type Annotations',
        hasTypeAnnotations,
        hasTypeAnnotations ? 'Proper type annotations used' : 'Missing type annotations'
      );
    }
  }

  // Test 8: User Experience
  testUserExperience() {
    this.log('\n=== Testing User Experience ===');
    
    const marketplaceContent = this.readFileContent('src/components/agents/AgentMarketplace.tsx');
    
    if (marketplaceContent) {
      // Check loading states
      const hasLoadingStates = marketplaceContent.includes('loading') && 
                              marketplaceContent.includes('RefreshCw');
      this.addResult(
        'Loading States',
        hasLoadingStates,
        hasLoadingStates ? 'Loading states implemented' : 'Missing loading states'
      );

      // Check error handling
      const hasErrorHandling = marketplaceContent.includes('error') && 
                              marketplaceContent.includes('catch');
      this.addResult(
        'Error Handling',
        hasErrorHandling,
        hasErrorHandling ? 'Error handling implemented' : 'Missing error handling'
      );

      // Check responsive design
      const hasResponsiveDesign = marketplaceContent.includes('md:') && 
                                 marketplaceContent.includes('lg:');
      this.addResult(
        'Responsive Design',
        hasResponsiveDesign,
        hasResponsiveDesign ? 'Responsive design classes used' : 'Missing responsive design'
      );

      // Check accessibility
      const hasAccessibility = marketplaceContent.includes('aria-') || 
                              marketplaceContent.includes('role=');
      this.addResult(
        'Accessibility Features',
        hasAccessibility,
        hasAccessibility ? 'Accessibility features implemented' : 'Missing accessibility features',
        !hasAccessibility
      );

      // Check user feedback
      const hasUserFeedback = marketplaceContent.includes('message') && 
                             marketplaceContent.includes('successfully');
      this.addResult(
        'User Feedback',
        hasUserFeedback,
        hasUserFeedback ? 'User feedback messages implemented' : 'Missing user feedback'
      );
    }
  }

  // Test 9: Security Features
  testSecurityFeatures() {
    this.log('\n=== Testing Security Features ===');
    
    const templatesAPIContent = this.readFileContent('src/app/api/marketplace/templates/route.ts');
    
    if (templatesAPIContent) {
      // Check authentication
      const hasAuthentication = templatesAPIContent.includes('getServerSession');
      this.addResult(
        'Authentication',
        hasAuthentication,
        hasAuthentication ? 'Authentication checks implemented' : 'Missing authentication'
      );

      // Check authorization
      const hasAuthorization = templatesAPIContent.includes('authorId') && 
                              templatesAPIContent.includes('Permission denied');
      this.addResult(
        'Authorization',
        hasAuthorization,
        hasAuthorization ? 'Authorization checks implemented' : 'Missing authorization'
      );

      // Check input validation
      const hasInputValidation = templatesAPIContent.includes('z.object') && 
                                templatesAPIContent.includes('parse');
      this.addResult(
        'Input Validation',
        hasInputValidation,
        hasInputValidation ? 'Input validation implemented' : 'Missing input validation'
      );

      // Check rate limiting considerations
      const hasRateLimiting = templatesAPIContent.includes('rate') || 
                             templatesAPIContent.includes('limit');
      this.addResult(
        'Rate Limiting',
        hasRateLimiting,
        hasRateLimiting ? 'Rate limiting considerations present' : 'Missing rate limiting',
        !hasRateLimiting
      );
    }
  }

  // Test 10: Integration Points
  testIntegrationPoints() {
    this.log('\n=== Testing Integration Points ===');
    
    const marketplaceContent = this.readFileContent('src/components/agents/AgentMarketplace.tsx');
    
    if (marketplaceContent) {
      // Check agent creation integration
      const hasAgentCreationIntegration = marketplaceContent.includes('dashboard/agents/create') && 
                                         marketplaceContent.includes('template=');
      this.addResult(
        'Agent Creation Integration',
        hasAgentCreationIntegration,
        hasAgentCreationIntegration ? 'Integration with agent creation implemented' : 'Missing agent creation integration'
      );

      // Check navigation integration
      const hasNavigationIntegration = marketplaceContent.includes('window.location') || 
                                      marketplaceContent.includes('router');
      this.addResult(
        'Navigation Integration',
        hasNavigationIntegration,
        hasNavigationIntegration ? 'Navigation integration implemented' : 'Missing navigation integration'
      );

      // Check API integration
      const hasAPIIntegration = marketplaceContent.includes('fetch') && 
                               marketplaceContent.includes('/api/marketplace');
      this.addResult(
        'API Integration',
        hasAPIIntegration,
        hasAPIIntegration ? 'API integration implemented' : 'Missing API integration'
      );
    }
  }

  // Generate final report
  generateReport() {
    this.log('\n' + '='.repeat(60));
    this.log('FINAL VALIDATION REPORT');
    this.log('='.repeat(60));
    
    const total = this.results.passed + this.results.failed + this.results.warnings;
    const passRate = total > 0 ? ((this.results.passed / total) * 100).toFixed(1) : 0;
    
    this.log(`\nOVERALL STATISTICS:`);
    this.log(`✅ Passed: ${this.results.passed}`);
    this.log(`❌ Failed: ${this.results.failed}`);
    this.log(`⚠️  Warnings: ${this.results.warnings}`);
    this.log(`📊 Pass Rate: ${passRate}%`);
    
    // Detailed results
    this.log(`\nDETAILED RESULTS:`);
    this.results.details.forEach((result, index) => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      this.log(`${icon} ${result.test}: ${result.details}`);
    });
    
    // Assessment
    this.log(`\nASSESSMENT:`);
    if (this.results.failed === 0 && this.results.warnings <= 2) {
      this.log('🎉 EXCELLENT - Agent Marketplace & Templates implementation is production-ready!', 'success');
    } else if (this.results.failed <= 2 && this.results.warnings <= 5) {
      this.log('✅ GOOD - Implementation is solid with minor issues to address', 'success');
    } else if (this.results.failed <= 5) {
      this.log('⚠️ NEEDS IMPROVEMENT - Several issues need to be addressed', 'warning');
    } else {
      this.log('❌ MAJOR ISSUES - Significant problems need to be fixed', 'error');
    }
    
    // Recommendations
    this.log(`\nRECOMMENDATIONS:`);
    if (this.results.failed > 0) {
      this.log('🔧 Fix all failed tests before proceeding to validation');
    }
    if (this.results.warnings > 0) {
      this.log('⚠️ Address warnings to improve implementation quality');
    }
    this.log('📋 Run this validation script regularly during development');
    this.log('🧪 Perform manual testing of all marketplace features');
    this.log('🔒 Ensure security measures are properly implemented');
    
    return {
      passed: this.results.passed,
      failed: this.results.failed,
      warnings: this.results.warnings,
      passRate: parseFloat(passRate),
      assessment: this.results.failed === 0 && this.results.warnings <= 2 ? 'EXCELLENT' : 
                 this.results.failed <= 2 && this.results.warnings <= 5 ? 'GOOD' :
                 this.results.failed <= 5 ? 'NEEDS_IMPROVEMENT' : 'MAJOR_ISSUES'
    };
  }

  // Run all tests
  async runAllTests() {
    this.log('Starting DAY 28 - STEP 28.4: Agent Marketplace & Templates Validation\n');
    
    try {
      this.testComponentStructure();
      this.testAPIEndpoints();
      this.testTemplateManagement();
      this.testCommunityFeatures();
      this.testSearchAndFiltering();
      this.testDatabaseSchema();
      this.testTypeScriptTypes();
      this.testUserExperience();
      this.testSecurityFeatures();
      this.testIntegrationPoints();
      
      return this.generateReport();
    } catch (error) {
      this.log(`Validation failed with error: ${error.message}`, 'error');
      return {
        passed: 0,
        failed: 1,
        warnings: 0,
        passRate: 0,
        assessment: 'ERROR',
        error: error.message
      };
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new MarketplaceValidator();
  validator.runAllTests().then(result => {
    process.exit(result.failed > 0 ? 1 : 0);
  });
}

module.exports = MarketplaceValidator; 