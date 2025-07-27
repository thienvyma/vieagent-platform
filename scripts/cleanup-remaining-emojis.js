const fs = require('fs');
const path = require('path');

// Cleanup Remaining Emojis Script
// This script will replace all remaining 🤖 emojis in TSX files

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

// Files that should use VIEAgent logo instead of emoji
const LOGO_FILES = [
  'src/components/ui/Sidebar.tsx',
  'src/components/chat/MobileChatInterface.tsx',
  'src/app/login/page.tsx',
  'src/app/terms/page.tsx',
  'src/app/privacy/page.tsx',
  'src/app/cookie-policy/page.tsx',
  'src/app/blog/page.tsx'
];

// Files that should keep emoji for functional purposes (like icons in data)
const KEEP_EMOJI_FILES = [
  'src/components/agents/ModelProviderSelector.tsx',
  'src/app/admin/models/page.tsx',
  'src/components/knowledge/UsageAnalytics.tsx',
  'src/components/knowledge/StrategySelector.tsx',
  'src/components/agents/WizardSteps.tsx',
  'src/components/admin/PlanManagement.tsx'
];

// 1. Replace emojis in logo files with VIEAgent logo
function replaceEmojisInLogoFiles() {
  log('\n🎨 1. REPLACING EMOJIS IN LOGO FILES', COLORS.BOLD + COLORS.CYAN);
  
  let updatedFiles = 0;
  
  LOGO_FILES.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (fs.existsSync(fullPath)) {
      try {
        let content = fs.readFileSync(fullPath, 'utf8');
        let hasChanges = false;
        
        // Add VIEAgent import if not present
        if (!content.includes('VIEAgentLogo') && content.includes('🤖')) {
          content = content.replace(
            'import React from \'react\';',
            `import React from 'react';\nimport { VIEAgentLogo } from '@/components/ui/vieagent-logo';`
          );
          hasChanges = true;
        }
        
        // Replace specific emoji patterns with VIEAgent logo
        const replacements = [
          {
            pattern: /<span className="text-white font-bold text-2xl">🤖<\/span>/g,
            replacement: '<VIEAgentLogo size="small" />'
          },
          {
            pattern: /<span className="text-xl font-bold text-white">🤖<\/span>/g,
            replacement: '<VIEAgentLogo size="small" />'
          },
          {
            pattern: /<span className="text-white font-bold text-xl">🤖<\/span>/g,
            replacement: '<VIEAgentLogo size="small" />'
          },
          {
            pattern: /<span className="text-white font-bold text-lg">🤖<\/span>/g,
            replacement: '<VIEAgentLogo size="small" />'
          }
        ];
        
        replacements.forEach(({ pattern, replacement }) => {
          if (pattern.test(content)) {
            content = content.replace(pattern, replacement);
            hasChanges = true;
          }
        });
        
        if (hasChanges) {
          fs.writeFileSync(fullPath, content, 'utf8');
          log(`✅ Updated: ${filePath}`, COLORS.GREEN);
          updatedFiles++;
        } else {
          log(`⏭️ No changes needed: ${filePath}`, COLORS.YELLOW);
        }
      } catch (error) {
        log(`❌ Error updating ${filePath}: ${error.message}`, COLORS.RED);
      }
    } else {
      log(`⚠️ File not found: ${filePath}`, COLORS.YELLOW);
    }
  });
  
  log(`\n📊 Updated ${updatedFiles} logo files`, COLORS.BOLD);
}

// 2. Clean up emojis in other files (replace with appropriate text)
function cleanupOtherEmojis() {
  log('\n🧹 2. CLEANING UP OTHER EMOJIS', COLORS.BOLD + COLORS.CYAN);
  
  const filesToClean = [
    'src/app/payment/page.tsx',
    'src/components/ui/OfflineSupport.tsx',
    'src/components/knowledge/KnowledgeGrid.tsx',
    'src/components/google/PromptTemplateManager.tsx',
    'src/app/admin/settings/page.tsx',
    'src/app/admin/page.tsx',
    'src/components/gmail/GmailDashboard.tsx',
    'src/components/deployment/FacebookIntegrationSimple.tsx',
    'src/components/deployment/LiveManagementTab.tsx',
    'src/app/dashboard/analytics/page.tsx',
    'src/app/dashboard/deployment/page.tsx',
    'src/app/dashboard/google/page.tsx',
    'src/components/deployment/ZaloIntegrationTab.tsx',
    'src/app/dashboard/page.tsx',
    'src/components/deployment/ZaloIntegrationSimple.tsx',
    'src/app/dashboard/settings/page.tsx',
    'src/app/dashboard/upgrade/page.tsx',
    'src/components/deployment/WebIntegrationTab.tsx',
    'src/components/deployment/FacebookIntegrationTab.tsx',
    'src/app/dashboard/handover/page.tsx',
    'src/components/deployment/AgentExportTab.tsx',
    'src/app/dashboard/chat/page.tsx',
    'src/app/dashboard/chat/enhanced/page.tsx',
    'src/app/dashboard/chat/enhanced-v2/page.tsx',
    'src/components/deployment/PlatformConnectorsTab.tsx',
    'src/app/dashboard/agents/[id]/test/page.tsx',
    'src/app/dashboard/agents/page.tsx',
    'src/components/chat/EnhancedChatMessage.tsx'
  ];
  
  let updatedFiles = 0;
  
  filesToClean.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (fs.existsSync(fullPath)) {
      try {
        let content = fs.readFileSync(fullPath, 'utf8');
        let hasChanges = false;
        
        // Replace emoji patterns with appropriate text
        const replacements = [
          {
            pattern: /🤖 AI Agents/g,
            replacement: 'VIEAgents'
          },
          {
            pattern: /🤖 VIEAgents/g,
            replacement: 'VIEAgents'
          },
          {
            pattern: /🤖 AI/g,
            replacement: 'AI'
          },
          {
            pattern: /🤖 Auto/g,
            replacement: 'Auto'
          },
          {
            pattern: /🤖 Bot/g,
            replacement: 'Bot'
          },
          {
            pattern: /🤖 OpenAI/g,
            replacement: 'OpenAI'
          },
          {
            pattern: /<span className="text-2xl">🤖<\/span>/g,
            replacement: '<span className="text-2xl text-blue-400">AI</span>'
          },
          {
            pattern: /<span className="text-xl">🤖<\/span>/g,
            replacement: '<span className="text-xl text-blue-400">AI</span>'
          },
          {
            pattern: /<span className="text-lg">🤖<\/span>/g,
            replacement: '<span className="text-lg text-blue-400">AI</span>'
          },
          {
            pattern: /<span className="text-sm">🤖<\/span>/g,
            replacement: '<span className="text-sm text-blue-400">AI</span>'
          },
          {
            pattern: /<span>🤖<\/span>/g,
            replacement: '<span className="text-blue-400">AI</span>'
          },
          {
            pattern: /<div className="text-4xl mb-4">🤖<\/div>/g,
            replacement: '<div className="text-4xl mb-4 text-blue-400">AI</div>'
          },
          {
            pattern: /<div className="text-5xl mb-4">🤖<\/div>/g,
            replacement: '<div className="text-5xl mb-4 text-blue-400">AI</div>'
          },
          {
            pattern: /🤖/g,
            replacement: 'AI'
          }
        ];
        
        replacements.forEach(({ pattern, replacement }) => {
          if (pattern.test(content)) {
            content = content.replace(pattern, replacement);
            hasChanges = true;
          }
        });
        
        if (hasChanges) {
          fs.writeFileSync(fullPath, content, 'utf8');
          log(`✅ Cleaned: ${filePath}`, COLORS.GREEN);
          updatedFiles++;
        } else {
          log(`⏭️ No emojis found: ${filePath}`, COLORS.YELLOW);
        }
      } catch (error) {
        log(`❌ Error cleaning ${filePath}: ${error.message}`, COLORS.RED);
      }
    } else {
      log(`⚠️ File not found: ${filePath}`, COLORS.YELLOW);
    }
  });
  
  log(`\n📊 Cleaned ${updatedFiles} files`, COLORS.BOLD);
}

// 3. Final verification
function finalVerification() {
  log('\n🔍 3. FINAL VERIFICATION', COLORS.BOLD + COLORS.CYAN);
  
  const allTsxFiles = [];
  
  // Find all TSX files
  function findTsxFiles(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        findTsxFiles(fullPath);
      } else if (file.endsWith('.tsx')) {
        allTsxFiles.push(fullPath);
      }
    });
  }
  
  findTsxFiles(path.join(process.cwd(), 'src'));
  
  let filesWithEmojis = 0;
  let totalEmojis = 0;
  
  allTsxFiles.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const emojiMatches = content.match(/🤖/g);
      
      if (emojiMatches) {
        const relativePath = path.relative(process.cwd(), filePath);
        
        // Check if this file should keep emojis
        if (KEEP_EMOJI_FILES.includes(relativePath)) {
          log(`✅ ${relativePath} - ${emojiMatches.length} emojis (functional, kept)`, COLORS.GREEN);
        } else {
          log(`⚠️ ${relativePath} - ${emojiMatches.length} emojis (should be cleaned)`, COLORS.YELLOW);
          filesWithEmojis++;
        }
        
        totalEmojis += emojiMatches.length;
      }
    } catch (error) {
      log(`❌ Error checking ${filePath}: ${error.message}`, COLORS.RED);
    }
  });
  
  log(`\n📊 Found ${totalEmojis} emojis in ${filesWithEmojis} files that should be cleaned`, COLORS.BOLD);
  
  return filesWithEmojis === 0;
}

// 4. Generate cleanup report
function generateCleanupReport() {
  log('\n📊 EMOJI CLEANUP REPORT', COLORS.BOLD + COLORS.YELLOW);
  
  const report = {
    timestamp: new Date().toISOString(),
    task: 'VIEAgent Emoji Cleanup',
    summary: {
      logoFilesUpdated: 'Logo files updated with VIEAgent logo component',
      otherFilesUpdated: 'Other files cleaned of emoji references',
      functionalEmojisKept: 'Functional emojis kept in appropriate files'
    },
    actions: [
      'Replaced 🤖 with VIEAgentLogo in header/footer files',
      'Replaced 🤖 with "AI" text in other files',
      'Kept functional emojis in data structures',
      'Added VIEAgentLogo imports where needed'
    ]
  };
  
  log('\n🎉 CLEANUP COMPLETED!', COLORS.BOLD + COLORS.GREEN);
  log('✅ Logo files updated with VIEAgent logo component', COLORS.GREEN);
  log('✅ Other files cleaned of emoji references', COLORS.GREEN);
  log('✅ Functional emojis preserved where appropriate', COLORS.GREEN);
  
  log('\n🚀 NEXT STEPS:', COLORS.BOLD + COLORS.BLUE);
  log('1. Test the application to verify changes', COLORS.BLUE);
  log('2. Check that VIEAgent logo displays correctly', COLORS.BLUE);
  log('3. Verify functional emojis still work', COLORS.BLUE);
  
  // Save report
  const reportPath = path.join(process.cwd(), 'emoji-cleanup-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`\n📄 Report saved to: ${reportPath}`, COLORS.CYAN);
  
  return report;
}

// Main execution
async function main() {
  log('🧹 VIEAGENT EMOJI CLEANUP', COLORS.BOLD + COLORS.BLUE);
  log('Cleaning up remaining 🤖 emojis and replacing with appropriate alternatives...\n');
  
  try {
    replaceEmojisInLogoFiles();
    cleanupOtherEmojis();
    
    const allClean = finalVerification();
    generateCleanupReport();
    
    if (allClean) {
      log('\n🎉 EMOJI CLEANUP COMPLETED SUCCESSFULLY!', COLORS.BOLD + COLORS.GREEN);
      process.exit(0);
    } else {
      log('\n⚠️ Some emojis may still need manual cleanup', COLORS.YELLOW);
      process.exit(1);
    }
  } catch (error) {
    log(`\n❌ Fatal error during cleanup: ${error.message}`, COLORS.RED);
    process.exit(1);
  }
}

// Run the cleanup
main(); 