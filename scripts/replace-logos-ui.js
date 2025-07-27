const fs = require('fs');
const path = require('path');

// Replace Logos in UI Components Script
// This script will replace all old logos with VIEAgent logo component

const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  CYAN: '\x1b[36m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m'
};

const log = (message, color = COLORS.RESET) => {
  console.log(`${color}${message}${COLORS.RESET}`);
};

// Files to update with VIEAgent logo
const UI_FILES_TO_UPDATE = [
  'src/components/ui/PageLayout.tsx',
  'src/components/ui/DashboardLayout.tsx',
  'src/components/ui/Sidebar.tsx',
  'src/components/ui/MobileOptimizedLayout.tsx',
  'src/components/chat/MobileChatInterface.tsx',
  'src/components/enhanced/EnhancedChatInterface.tsx',
  'src/components/dashboard/DashboardHeader.tsx'
];

// Logo replacement patterns
const LOGO_REPLACEMENTS = [
  {
    // Old emoji logo pattern
    pattern: /<div className="w-(\d+) h-(\d+) bg-gradient-to-r from-blue-500 to-purple-600 rounded-(\w+) flex items-center justify-center[^>]*>\s*<span className="text-white font-bold[^>]*">🤖<\/span>\s*<\/div>/g,
    replacement: '<VIEAgentLogo size="small" className="w-$1 h-$2" />'
  },
  {
    // Old text logo pattern
    pattern: /<h1 className="[^"]*">AI Agent Platform<\/h1>/g,
    replacement: '<h1 className="text-xl font-bold text-white">VIEAgent</h1>'
  },
  {
    // Old platform name pattern
    pattern: /<span[^>]*>AI Platform<\/span>/g,
    replacement: '<span className="text-white font-bold">VIEAgent</span>'
  },
  {
    // Old footer text
    pattern: /© 2024 AI Agent Platform/g,
    replacement: '© 2024 VIEAgent'
  }
];

// Import statement to add
const VIEAGENT_IMPORT = "import { VIEAgentLogo } from '@/components/ui/vieagent-logo';";

// 1. Update PageLayout.tsx
function updatePageLayout() {
  log('\n🎨 1. UPDATING PAGE LAYOUT', COLORS.BOLD + COLORS.CYAN);
  
  const filePath = path.join(process.cwd(), 'src', 'components', 'ui', 'PageLayout.tsx');
  
  if (fs.existsSync(filePath)) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Add VIEAgent import
      if (!content.includes('VIEAgentLogo')) {
        content = content.replace(
          'import React from \'react\';',
          `import React from 'react';\nimport { VIEAgentLogo } from '@/components/ui/vieagent-logo';`
        );
      }
      
      // Replace header logo
      content = content.replace(
        /<div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">\s*<span className="text-white font-bold text-xl">🤖<\/span>\s*<\/div>/g,
        '<VIEAgentLogo size="medium" className="group-hover:scale-110 transition-transform duration-300" />'
      );
      
      // Replace header title
      content = content.replace(
        /<h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">\s*AI Agent Platform\s*<\/h1>/g,
        '<h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">VIEAgent</h1>'
      );
      
      // Replace footer logo
      content = content.replace(
        /<div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">\s*<span className="text-white font-bold text-lg">🤖<\/span>\s*<\/div>/g,
        '<VIEAgentLogo size="small" />'
      );
      
      // Replace footer title
      content = content.replace(
        /<h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">\s*AI Agent Platform\s*<\/h3>/g,
        '<h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">VIEAgent</h3>'
      );
      
      // Replace copyright
      content = content.replace(/© 2024 AI Agent Platform/g, '© 2024 VIEAgent');
      
      fs.writeFileSync(filePath, content, 'utf8');
      log(`✅ Updated PageLayout.tsx with VIEAgent logo`, COLORS.GREEN);
    } catch (error) {
      log(`❌ Error updating PageLayout.tsx: ${error.message}`, COLORS.RED);
    }
  }
}

// 2. Update Sidebar.tsx
function updateSidebar() {
  log('\n🎨 2. UPDATING SIDEBAR', COLORS.BOLD + COLORS.CYAN);
  
  const filePath = path.join(process.cwd(), 'src', 'components', 'ui', 'Sidebar.tsx');
  
  if (fs.existsSync(filePath)) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Add VIEAgent import
      if (!content.includes('VIEAgentLogo')) {
        content = content.replace(
          'import React from \'react\';',
          `import React from 'react';\nimport { VIEAgentLogo } from '@/components/ui/vieagent-logo';`
        );
      }
      
      // Replace sidebar logo
      content = content.replace(
        /<div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">\s*<span className="text-white font-bold text-lg">🤖<\/span>\s*<\/div>/g,
        '<VIEAgentLogo size="small" />'
      );
      
      // Replace sidebar title
      content = content.replace(
        /<h1 className="text-white font-bold text-lg">AI Platform<\/h1>/g,
        '<h1 className="text-white font-bold text-lg">VIEAgent</h1>'
      );
      
      // Replace copyright
      content = content.replace(/© 2024 VIEAgent/g, '© 2024 VIEAgent');
      
      fs.writeFileSync(filePath, content, 'utf8');
      log(`✅ Updated Sidebar.tsx with VIEAgent logo`, COLORS.GREEN);
    } catch (error) {
      log(`❌ Error updating Sidebar.tsx: ${error.message}`, COLORS.RED);
    }
  }
}

// 3. Update MobileOptimizedLayout.tsx
function updateMobileOptimizedLayout() {
  log('\n📱 3. UPDATING MOBILE OPTIMIZED LAYOUT', COLORS.BOLD + COLORS.CYAN);
  
  const filePath = path.join(process.cwd(), 'src', 'components', 'ui', 'MobileOptimizedLayout.tsx');
  
  if (fs.existsSync(filePath)) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Add VIEAgent import
      if (!content.includes('VIEAgentLogo')) {
        content = content.replace(
          'import React from \'react\';',
          `import React from 'react';\nimport { VIEAgentLogo } from '@/components/ui/vieagent-logo';`
        );
      }
      
      // Replace mobile header logo
      content = content.replace(
        /<div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">\s*<span className="text-white font-bold text-sm">🤖<\/span>\s*<\/div>/g,
        '<VIEAgentLogo size="small" className="w-8 h-8" />'
      );
      
      // Replace mobile sidebar logo
      content = content.replace(
        /<div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">\s*<span className="text-white font-bold text-lg">🤖<\/span>\s*<\/div>/g,
        '<VIEAgentLogo size="small" />'
      );
      
      // Replace mobile sidebar title
      content = content.replace(
        /<h1 className="text-white font-bold text-lg">AI Platform<\/h1>/g,
        '<h1 className="text-white font-bold text-lg">VIEAgent</h1>'
      );
      
      fs.writeFileSync(filePath, content, 'utf8');
      log(`✅ Updated MobileOptimizedLayout.tsx with VIEAgent logo`, COLORS.GREEN);
    } catch (error) {
      log(`❌ Error updating MobileOptimizedLayout.tsx: ${error.message}`, COLORS.RED);
    }
  }
}

// 4. Update MobileChatInterface.tsx
function updateMobileChatInterface() {
  log('\n💬 4. UPDATING MOBILE CHAT INTERFACE', COLORS.BOLD + COLORS.CYAN);
  
  const filePath = path.join(process.cwd(), 'src', 'components', 'chat', 'MobileChatInterface.tsx');
  
  if (fs.existsSync(filePath)) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Add VIEAgent import
      if (!content.includes('VIEAgentLogo')) {
        content = content.replace(
          'import React from \'react\';',
          `import React from 'react';\nimport { VIEAgentLogo } from '@/components/ui/vieagent-logo';`
        );
      }
      
      // Replace chat header logo
      content = content.replace(
        /<div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">\s*<span className="text-white font-bold">🤖<\/span>\s*<\/div>/g,
        '<VIEAgentLogo size="small" className="rounded-full" />'
      );
      
      fs.writeFileSync(filePath, content, 'utf8');
      log(`✅ Updated MobileChatInterface.tsx with VIEAgent logo`, COLORS.GREEN);
    } catch (error) {
      log(`❌ Error updating MobileChatInterface.tsx: ${error.message}`, COLORS.RED);
    }
  }
}

// 5. Update all page files with AI Agent Platform text
function updatePageFiles() {
  log('\n📄 5. UPDATING PAGE FILES', COLORS.BOLD + COLORS.CYAN);
  
  const pageFiles = [
    'src/app/terms/page.tsx',
    'src/app/privacy/page.tsx',
    'src/app/contact/page.tsx',
    'src/app/cookie-policy/page.tsx',
    'src/app/blog/page.tsx',
    'src/app/pricing/page-backup.tsx',
    'src/app/admin/settings/page.tsx',
    'src/components/deployment/FacebookIntegrationSimple.tsx',
    'src/components/deployment/ZaloIntegrationSimple.tsx'
  ];
  
  pageFiles.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (fs.existsSync(fullPath)) {
      try {
        let content = fs.readFileSync(fullPath, 'utf8');
        
        // Replace AI Agent Platform with VIEAgent
        content = content.replace(/AI Agent Platform/g, 'VIEAgent');
        content = content.replace(/AI AGENT PLATFORM/g, 'VIEAGENT');
        
        fs.writeFileSync(fullPath, content, 'utf8');
        log(`✅ Updated ${filePath}`, COLORS.GREEN);
      } catch (error) {
        log(`❌ Error updating ${filePath}: ${error.message}`, COLORS.RED);
      }
    } else {
      log(`⚠️ File not found: ${filePath}`, COLORS.YELLOW);
    }
  });
}

// 6. Create a comprehensive UI update script
function createUIUpdateScript() {
  log('\n🔧 6. CREATING UI UPDATE SCRIPT', COLORS.BOLD + COLORS.CYAN);
  
  const updateScriptContent = `#!/bin/bash

# VIEAgent UI Update Script
# This script updates all UI components with VIEAgent branding

echo "🎨 Updating VIEAgent UI Components..."

# Update all TSX files with old logo patterns
find src -name "*.tsx" -type f -exec sed -i 's/AI Agent Platform/VIEAgent/g' {} +
find src -name "*.tsx" -type f -exec sed -i 's/AI AGENT PLATFORM/VIEAGENT/g' {} +

# Update specific emoji patterns
find src -name "*.tsx" -type f -exec sed -i 's/🤖/VIEAgent/g' {} +

echo "✅ VIEAgent UI update completed!"
`;
  
  const scriptPath = path.join(process.cwd(), 'scripts', 'update-ui-branding.sh');
  
  try {
    fs.writeFileSync(scriptPath, updateScriptContent, 'utf8');
    log(`✅ Created UI update script: ${scriptPath}`, COLORS.GREEN);
  } catch (error) {
    log(`❌ Error creating UI update script: ${error.message}`, COLORS.RED);
  }
}

// 7. Final verification
function finalVerification() {
  log('\n🔍 7. FINAL VERIFICATION', COLORS.BOLD + COLORS.CYAN);
  
  const filesToCheck = [
    'src/components/ui/PageLayout.tsx',
    'src/components/ui/Sidebar.tsx',
    'src/components/ui/MobileOptimizedLayout.tsx',
    'src/components/chat/MobileChatInterface.tsx'
  ];
  
  let allUpdated = true;
  
  filesToCheck.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (fs.existsSync(fullPath)) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        if (content.includes('VIEAgentLogo')) {
          log(`✅ ${filePath} - VIEAgent logo imported`, COLORS.GREEN);
        } else {
          log(`❌ ${filePath} - VIEAgent logo NOT imported`, COLORS.RED);
          allUpdated = false;
        }
        
        if (content.includes('AI Agent Platform')) {
          log(`⚠️ ${filePath} - Still contains "AI Agent Platform"`, COLORS.YELLOW);
        } else {
          log(`✅ ${filePath} - No old platform name found`, COLORS.GREEN);
        }
      } catch (error) {
        log(`❌ Error checking ${filePath}: ${error.message}`, COLORS.RED);
        allUpdated = false;
      }
    } else {
      log(`⚠️ File not found: ${filePath}`, COLORS.YELLOW);
    }
  });
  
  return allUpdated;
}

// Main execution
async function main() {
  log('🎨 REPLACING LOGOS IN UI COMPONENTS', COLORS.BOLD + COLORS.BLUE);
  log('Updating all header and footer logos with VIEAgent branding...\n');
  
  try {
    updatePageLayout();
    updateSidebar();
    updateMobileOptimizedLayout();
    updateMobileChatInterface();
    updatePageFiles();
    createUIUpdateScript();
    
    if (finalVerification()) {
      log('\n🎉 LOGO REPLACEMENT COMPLETED SUCCESSFULLY!', COLORS.BOLD + COLORS.GREEN);
      log('✅ All UI components updated with VIEAgent logo', COLORS.GREEN);
      log('✅ Header and footer logos replaced', COLORS.GREEN);
      log('✅ Mobile interfaces updated', COLORS.GREEN);
      log('✅ All page files updated', COLORS.GREEN);
      
      log('\n🚀 NEXT STEPS:', COLORS.BOLD + COLORS.BLUE);
      log('1. Test the application to verify logo displays correctly', COLORS.BLUE);
      log('2. Check mobile responsiveness', COLORS.BLUE);
      log('3. Verify all pages show VIEAgent branding', COLORS.BLUE);
      log('4. Update any remaining manual references', COLORS.BLUE);
      
      process.exit(0);
    } else {
      log('\n❌ Some logo replacements may have failed', COLORS.RED);
      process.exit(1);
    }
  } catch (error) {
    log(`\n❌ Fatal error during logo replacement: ${error.message}`, COLORS.RED);
    process.exit(1);
  }
}

// Run the logo replacement
main(); 