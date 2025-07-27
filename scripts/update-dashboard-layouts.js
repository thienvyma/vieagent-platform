const fs = require('fs');
const path = require('path');

const dashboardPages = [
  'chat/page.tsx',
  'analytics/page.tsx', 
  'data-import/page.tsx',
  'knowledge/page.tsx',
  'handover/page.tsx',
  'api-keys/page.tsx',
  'profile/page.tsx',
  'settings/page.tsx'
];

const updatePageWithLayout = (pagePath, title, description, icon = "🏠") => {
  const fullPath = path.join(__dirname, '../src/app/dashboard', pagePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ File not found: ${pagePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Check if already has DashboardLayout
  if (content.includes('DashboardLayout')) {
    console.log(`✅ ${pagePath} already has DashboardLayout`);
    return;
  }

  // Add import
  if (!content.includes('import DashboardLayout')) {
    content = content.replace(
      /import { useRouter } from "next\/navigation";/,
      `import { useRouter } from "next/navigation";\nimport DashboardLayout from "@/components/ui/DashboardLayout";`
    );
  }

  // Wrap return statement
  const returnRegex = /return\s*\(\s*<div className="min-h-screen bg-black text-white">/;
  if (returnRegex.test(content)) {
    content = content.replace(
      returnRegex,
      `return (\n    <DashboardLayout title="${title}" description="${description}">\n      <div className="space-y-8">`
    );
    
    // Add closing tag
    const lastReturnIdx = content.lastIndexOf('  );');
    if (lastReturnIdx !== -1) {
      content = content.substring(0, lastReturnIdx) + 
                '      </div>\n    </DashboardLayout>\n  );' + 
                content.substring(lastReturnIdx + 4);
    }
  }

  // Write updated content
  fs.writeFileSync(fullPath, content);
  console.log(`✅ Updated ${pagePath} with DashboardLayout`);
};

// Update all pages
console.log('🚀 Starting dashboard layout updates...\n');

updatePageWithLayout('chat/page.tsx', 'AI Chat', 'Trò chuyện với AI agents', '💬');
updatePageWithLayout('analytics/page.tsx', 'Analytics', 'Phân tích hiệu suất hệ thống', '📊');
updatePageWithLayout('data-import/page.tsx', 'Data Import', 'Nhập dữ liệu và tài liệu', '📤');
updatePageWithLayout('knowledge/page.tsx', 'Knowledge Base', 'Quản lý tài liệu và kiến thức', '📚');
updatePageWithLayout('handover/page.tsx', 'Handover System', 'Chuyển giao hội thoại', '🔄');
updatePageWithLayout('api-keys/page.tsx', 'API Keys', 'Quản lý khóa API', '🔑');
updatePageWithLayout('profile/page.tsx', 'Profile', 'Thông tin cá nhân', '👤');
updatePageWithLayout('settings/page.tsx', 'Settings', 'Cài đặt hệ thống', '⚙️');

console.log('\n🎉 All dashboard pages updated successfully!'); 