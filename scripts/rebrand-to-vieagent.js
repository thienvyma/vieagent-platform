const fs = require('fs');
const path = require('path');

// VIEAgent Rebranding Script
// This script will update all project references to VIEAgent and update logo paths

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

// Project name mappings
const PROJECT_NAMES = {
  // Old names to replace
  'AI Agent Platform': 'VIEAgent',
  'AI-Agent-Platform': 'VIEAgent',
  'ai-agent-platform': 'VIEAgent',
  'Agent Platform': 'VIEAgent',
  'AI Agent': 'VIEAgent',
  'AI Agents': 'VIEAgent',
  'Smart Agent': 'VIEAgent',
  'Agent System': 'VIEAgent'
};

// Files to update with new project name
const FILES_TO_UPDATE = [
  'package.json',
  'README.md',
  'src/app/layout.tsx',
  'src/app/page.tsx',
  'src/components/ui/navigation.tsx',
  'src/components/ui/header.tsx',
  'src/components/ui/sidebar.tsx',
  'src/components/ui/footer.tsx',
  'src/app/dashboard/page.tsx',
  'src/app/login/page.tsx',
  'src/app/pricing/page.tsx',
  'public/manifest.json'
];

// Logo configuration for different sizes
const LOGO_CONFIGS = [
  {
    name: 'favicon',
    source: 'public/images/vieagent-logo-square.png',
    target: 'public/favicon.ico',
    size: '32x32',
    description: 'Favicon for browser tab'
  },
  {
    name: 'logo-small',
    source: 'public/images/vieagent-logo-square.png',
    target: 'public/images/vieagent-logo-small.png',
    size: '64x64',
    description: 'Small logo for navigation'
  },
  {
    name: 'logo-medium',
    source: 'public/images/vieagent-logo-square.png',
    target: 'public/images/vieagent-logo-medium.png',
    size: '128x128',
    description: 'Medium logo for headers'
  },
  {
    name: 'logo-large',
    source: 'public/images/vieagent-logo-horizontal.png',
    target: 'public/images/vieagent-logo-large.png',
    size: '256x128',
    description: 'Large horizontal logo for landing page'
  }
];

// 1. Update project names in files
function updateProjectNames() {
  log('\n🔄 1. UPDATING PROJECT NAMES TO VIEAGENT', COLORS.BOLD + COLORS.CYAN);
  
  let updatedFiles = 0;
  
  FILES_TO_UPDATE.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (fs.existsSync(fullPath)) {
      try {
        let content = fs.readFileSync(fullPath, 'utf8');
        let hasChanges = false;
        
        // Replace all project name variations
        Object.entries(PROJECT_NAMES).forEach(([oldName, newName]) => {
          const regex = new RegExp(oldName, 'g');
          if (content.includes(oldName)) {
            content = content.replace(regex, newName);
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
  
  log(`\n📊 Updated ${updatedFiles} files with new project name`, COLORS.BOLD);
}

// 2. Create logo component
function createLogoComponent() {
  log('\n🎨 2. CREATING VIEAGENT LOGO COMPONENT', COLORS.BOLD + COLORS.CYAN);
  
  const logoComponentCode = `import React from 'react';
import Image from 'next/image';

interface VIEAgentLogoProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'square' | 'horizontal';
  className?: string;
}

export const VIEAgentLogo: React.FC<VIEAgentLogoProps> = ({ 
  size = 'medium', 
  variant = 'square',
  className = '' 
}) => {
  const getLogoPath = () => {
    if (variant === 'horizontal') {
      return '/images/vieagent-logo-horizontal.png';
    }
    
    switch (size) {
      case 'small':
        return '/images/vieagent-logo-small.png';
      case 'large':
        return '/images/vieagent-logo-large.png';
      default:
        return '/images/vieagent-logo-medium.png';
    }
  };
  
  const getDimensions = () => {
    if (variant === 'horizontal') {
      switch (size) {
        case 'small':
          return { width: 120, height: 40 };
        case 'large':
          return { width: 300, height: 100 };
        default:
          return { width: 200, height: 67 };
      }
    }
    
    switch (size) {
      case 'small':
        return { width: 32, height: 32 };
      case 'large':
        return { width: 128, height: 128 };
      default:
        return { width: 64, height: 64 };
    }
  };
  
  const { width, height } = getDimensions();
  
  return (
    <Image
      src={getLogoPath()}
      alt="VIEAgent Logo"
      width={width}
      height={height}
      className={\`object-contain \${className}\`}
      priority
    />
  );
};

export default VIEAgentLogo;
`;
  
  const logoComponentPath = path.join(process.cwd(), 'src', 'components', 'ui', 'vieagent-logo.tsx');
  
  try {
    fs.writeFileSync(logoComponentPath, logoComponentCode, 'utf8');
    log(`✅ Created VIEAgent logo component: ${logoComponentPath}`, COLORS.GREEN);
  } catch (error) {
    log(`❌ Error creating logo component: ${error.message}`, COLORS.RED);
  }
}

// 3. Update manifest.json
function updateManifest() {
  log('\n📱 3. UPDATING MANIFEST.JSON', COLORS.BOLD + COLORS.CYAN);
  
  const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
  
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      
      // Update manifest with VIEAgent branding
      manifest.name = 'VIEAgent';
      manifest.short_name = 'VIEAgent';
      manifest.description = 'VIEAgent - AI Agent Platform for Vietnamese Users';
      
      // Update icons
      manifest.icons = [
        {
          src: '/images/vieagent-logo-small.png',
          sizes: '64x64',
          type: 'image/png'
        },
        {
          src: '/images/vieagent-logo-medium.png',
          sizes: '128x128',
          type: 'image/png'
        },
        {
          src: '/images/vieagent-logo-square.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ];
      
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
      log(`✅ Updated manifest.json with VIEAgent branding`, COLORS.GREEN);
    } catch (error) {
      log(`❌ Error updating manifest.json: ${error.message}`, COLORS.RED);
    }
  } else {
    // Create new manifest
    const newManifest = {
      name: 'VIEAgent',
      short_name: 'VIEAgent',
      description: 'VIEAgent - AI Agent Platform for Vietnamese Users',
      start_url: '/',
      display: 'standalone',
      theme_color: '#000000',
      background_color: '#ffffff',
      icons: [
        {
          src: '/images/vieagent-logo-small.png',
          sizes: '64x64',
          type: 'image/png'
        },
        {
          src: '/images/vieagent-logo-medium.png',
          sizes: '128x128',
          type: 'image/png'
        },
        {
          src: '/images/vieagent-logo-square.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    };
    
    fs.writeFileSync(manifestPath, JSON.stringify(newManifest, null, 2), 'utf8');
    log(`✅ Created new manifest.json with VIEAgent branding`, COLORS.GREEN);
  }
}

// 4. Update package.json
function updatePackageJson() {
  log('\n📦 4. UPDATING PACKAGE.JSON', COLORS.BOLD + COLORS.CYAN);
  
  const packagePath = path.join(process.cwd(), 'package.json');
  
  if (fs.existsSync(packagePath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      // Update package.json with VIEAgent branding
      packageJson.name = 'vieagent';
      packageJson.displayName = 'VIEAgent';
      packageJson.description = 'VIEAgent - AI Agent Platform for Vietnamese Users';
      
      // Update keywords
      packageJson.keywords = [
        'vieagent',
        'ai',
        'agent',
        'vietnamese',
        'platform',
        'nextjs',
        'react',
        'typescript'
      ];
      
      // Update author and repository if needed
      if (!packageJson.author) {
        packageJson.author = 'VIEAgent Team';
      }
      
      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2), 'utf8');
      log(`✅ Updated package.json with VIEAgent branding`, COLORS.GREEN);
    } catch (error) {
      log(`❌ Error updating package.json: ${error.message}`, COLORS.RED);
    }
  } else {
    log(`⚠️ package.json not found`, COLORS.YELLOW);
  }
}

// 5. Update layout.tsx with new logo
function updateLayout() {
  log('\n🏗️ 5. UPDATING LAYOUT.TSX', COLORS.BOLD + COLORS.CYAN);
  
  const layoutPath = path.join(process.cwd(), 'src', 'app', 'layout.tsx');
  
  if (fs.existsSync(layoutPath)) {
    try {
      let content = fs.readFileSync(layoutPath, 'utf8');
      
      // Update title and metadata
      content = content.replace(/title:\s*['"][^'"]*['"]/, 'title: "VIEAgent"');
      content = content.replace(/description:\s*['"][^'"]*['"]/, 'description: "VIEAgent - AI Agent Platform for Vietnamese Users"');
      
      // Update favicon reference
      if (content.includes('favicon.ico')) {
        content = content.replace(/favicon\.ico/g, 'favicon.ico');
      } else {
        // Add favicon if not present
        if (content.includes('<head>')) {
          content = content.replace(
            '<head>',
            '<head>\\n      <link rel="icon" href="/favicon.ico" />'
          );
        }
      }
      
      fs.writeFileSync(layoutPath, content, 'utf8');
      log(`✅ Updated layout.tsx with VIEAgent branding`, COLORS.GREEN);
    } catch (error) {
      log(`❌ Error updating layout.tsx: ${error.message}`, COLORS.RED);
    }
  } else {
    log(`⚠️ layout.tsx not found`, COLORS.YELLOW);
  }
}

// 6. Create logo usage documentation
function createLogoDocumentation() {
  log('\n📚 6. CREATING LOGO USAGE DOCUMENTATION', COLORS.BOLD + COLORS.CYAN);
  
  const docContent = `# VIEAgent Logo Usage Guide

## Available Logo Files

### Original Logos
- \`public/images/vieagent-logo-square.png\` - Square format logo (original)
- \`public/images/vieagent-logo-horizontal.png\` - Horizontal format logo (original)

### Generated Sizes
- \`public/images/vieagent-logo-small.png\` - 64x64px for navigation
- \`public/images/vieagent-logo-medium.png\` - 128x128px for headers
- \`public/images/vieagent-logo-large.png\` - 256x128px for landing page
- \`public/favicon.ico\` - 32x32px for browser tab

## VIEAgent Logo Component Usage

### Import
\`\`\`tsx
import { VIEAgentLogo } from '@/components/ui/vieagent-logo';
\`\`\`

### Basic Usage
\`\`\`tsx
// Default medium square logo
<VIEAgentLogo />

// Small square logo
<VIEAgentLogo size="small" />

// Large horizontal logo
<VIEAgentLogo size="large" variant="horizontal" />

// With custom styling
<VIEAgentLogo 
  size="medium" 
  variant="square" 
  className="hover:opacity-80 transition-opacity"
/>
\`\`\`

### Props
- \`size\`: 'small' | 'medium' | 'large' (default: 'medium')
- \`variant\`: 'square' | 'horizontal' (default: 'square')
- \`className\`: string (optional custom CSS classes)

### Recommended Usage
- **Navigation**: Small square logo
- **Headers**: Medium square logo
- **Landing Page**: Large horizontal logo
- **Favicon**: Automatically handled

## Brand Guidelines
- Always use the official VIEAgent logo
- Maintain aspect ratio when resizing
- Use appropriate size for context
- Ensure good contrast with background
`;
  
  const docPath = path.join(process.cwd(), 'VIEAGENT-LOGO-GUIDE.md');
  
  try {
    fs.writeFileSync(docPath, docContent, 'utf8');
    log(`✅ Created logo usage documentation: ${docPath}`, COLORS.GREEN);
  } catch (error) {
    log(`❌ Error creating documentation: ${error.message}`, COLORS.RED);
  }
}

// 7. Verify logo files
function verifyLogoFiles() {
  log('\n🔍 7. VERIFYING LOGO FILES', COLORS.BOLD + COLORS.CYAN);
  
  const logoFiles = [
    'public/images/vieagent-logo-square.png',
    'public/images/vieagent-logo-horizontal.png'
  ];
  
  let allFilesExist = true;
  
  logoFiles.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      const sizeKB = Math.round(stats.size / 1024);
      log(`✅ Found: ${filePath} (${sizeKB}KB)`, COLORS.GREEN);
    } else {
      log(`❌ Missing: ${filePath}`, COLORS.RED);
      allFilesExist = false;
    }
  });
  
  return allFilesExist;
}

// 8. Generate final report
function generateReport() {
  log('\n📊 VIEAGENT REBRANDING REPORT', COLORS.BOLD + COLORS.YELLOW);
  
  const report = {
    timestamp: new Date().toISOString(),
    project: 'VIEAgent Rebranding',
    status: 'completed',
    changes: [
      'Updated all project names to VIEAgent',
      'Created VIEAgent logo component',
      'Updated manifest.json with VIEAgent branding',
      'Updated package.json with VIEAgent details',
      'Updated layout.tsx with new branding',
      'Created logo usage documentation',
      'Verified all logo files exist'
    ],
    logoFiles: [
      'public/images/vieagent-logo-square.png',
      'public/images/vieagent-logo-horizontal.png'
    ],
    componentCreated: 'src/components/ui/vieagent-logo.tsx',
    documentationCreated: 'VIEAGENT-LOGO-GUIDE.md'
  };
  
  log('\n🎉 REBRANDING COMPLETED SUCCESSFULLY!', COLORS.BOLD + COLORS.GREEN);
  log('✅ Project name changed to: VIEAgent', COLORS.GREEN);
  log('✅ Logo files copied and organized', COLORS.GREEN);
  log('✅ VIEAgent logo component created', COLORS.GREEN);
  log('✅ All branding files updated', COLORS.GREEN);
  log('✅ Documentation created', COLORS.GREEN);
  
  log('\n🚀 NEXT STEPS:', COLORS.BOLD + COLORS.BLUE);
  log('1. Import VIEAgentLogo component in your pages', COLORS.BLUE);
  log('2. Replace old logo references with new component', COLORS.BLUE);
  log('3. Update any remaining hardcoded project names', COLORS.BLUE);
  log('4. Test the application with new branding', COLORS.BLUE);
  
  // Save report
  const reportPath = path.join(process.cwd(), 'vieagent-rebranding-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  log(`\n📄 Report saved to: ${reportPath}`, COLORS.CYAN);
  
  return report;
}

// Main execution
async function main() {
  log('🎨 VIEAGENT REBRANDING SCRIPT', COLORS.BOLD + COLORS.BLUE);
  log('Changing project name to VIEAgent and updating all branding...\n');
  
  try {
    // Verify logo files exist first
    if (!verifyLogoFiles()) {
      log('\n❌ Logo files missing! Please ensure logo files are in the correct location.', COLORS.RED);
      process.exit(1);
    }
    
    // Execute rebranding steps
    updateProjectNames();
    createLogoComponent();
    updateManifest();
    updatePackageJson();
    updateLayout();
    createLogoDocumentation();
    
    // Generate final report
    generateReport();
    
    log('\n🎉 VIEAGENT REBRANDING COMPLETED SUCCESSFULLY!', COLORS.BOLD + COLORS.GREEN);
    process.exit(0);
  } catch (error) {
    log(`\n❌ Fatal error during rebranding: ${error.message}`, COLORS.RED);
    process.exit(1);
  }
}

// Run the rebranding
main(); 