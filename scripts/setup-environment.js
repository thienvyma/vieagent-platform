#!/usr/bin/env node

/**
 * VIEAgent Environment Setup Script
 * Tự động thiết lập các biến môi trường cần thiết
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

// Colors for console output
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

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`)
};

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to ask questions
const askQuestion = (question, defaultValue = '') => {
  return new Promise((resolve) => {
    const prompt = defaultValue ? `${question} (${defaultValue}): ` : `${question}: `;
    rl.question(prompt, (answer) => {
      resolve(answer || defaultValue);
    });
  });
};

// Generate secure random string
const generateSecret = (length = 32) => {
  return crypto.randomBytes(length).toString('base64');
};

// Check if file exists
const fileExists = (filePath) => {
  return fs.existsSync(filePath);
};

// Read template file
const readTemplate = (templatePath) => {
  try {
    return fs.readFileSync(templatePath, 'utf8');
  } catch (error) {
    log.error(`Không thể đọc file template: ${templatePath}`);
    return null;
  }
};

// Write environment file
const writeEnvFile = (filePath, content) => {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    log.error(`Không thể ghi file: ${filePath}`);
    return false;
  }
};

// Validate OpenAI API key format
const validateOpenAIKey = (key) => {
  return key && key.startsWith('sk-') && key.length > 20;
};

// Validate URL format
const validateURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Main setup function
async function setupEnvironment() {
  log.title('🌍 VIEAgent Environment Setup');
  log.info('Script này sẽ giúp bạn thiết lập các biến môi trường cần thiết cho dự án VIEAgent.');

  // Check current directory
  const currentDir = process.cwd();
  const isProjectRoot = fileExists(path.join(currentDir, 'package.json')) && 
                       fileExists(path.join(currentDir, 'next.config.js'));

  if (!isProjectRoot) {
    log.error('Vui lòng chạy script này từ thư mục gốc của dự án VIEAgent.');
    process.exit(1);
  }

  // Check for existing .env files
  const envFiles = ['.env.local', '.env.production', '.env'];
  const existingFiles = envFiles.filter(file => fileExists(file));

  if (existingFiles.length > 0) {
    log.warning(`Tìm thấy file môi trường hiện có: ${existingFiles.join(', ')}`);
    const overwrite = await askQuestion('Bạn có muốn ghi đè không? (y/N)', 'N');
    if (overwrite.toLowerCase() !== 'y') {
      log.info('Hủy thiết lập.');
      rl.close();
      return;
    }
  }

  // Environment type selection
  log.title('📋 Chọn Loại Môi Trường');
  const envType = await askQuestion('Chọn môi trường (development/production)', 'development');

  // Read appropriate template
  let templatePath;
  let outputPath;
  
  if (envType.toLowerCase() === 'production') {
    templatePath = 'production.config.env';
    outputPath = '.env.production';
  } else {
    templatePath = 'env.example';
    outputPath = '.env.local';
  }

  if (!fileExists(templatePath)) {
    log.error(`Không tìm thấy file template: ${templatePath}`);
    rl.close();
    return;
  }

  let template = readTemplate(templatePath);
  if (!template) {
    rl.close();
    return;
  }

  // Collect environment variables
  log.title('🔧 Cấu Hình Biến Môi Trường');

  // NEXTAUTH_SECRET
  const generateSecretKey = await askQuestion('Tạo NEXTAUTH_SECRET tự động? (Y/n)', 'Y');
  let nextauthSecret;
  if (generateSecretKey.toLowerCase() !== 'n') {
    nextauthSecret = generateSecret();
    log.success(`Đã tạo NEXTAUTH_SECRET: ${nextauthSecret.substring(0, 20)}...`);
  } else {
    nextauthSecret = await askQuestion('Nhập NEXTAUTH_SECRET (ít nhất 32 ký tự)');
    if (nextauthSecret.length < 32) {
      log.warning('NEXTAUTH_SECRET quá ngắn. Khuyến nghị ít nhất 32 ký tự.');
    }
  }

  // NEXTAUTH_URL
  let nextauthUrl;
  if (envType.toLowerCase() === 'production') {
    nextauthUrl = await askQuestion('Nhập NEXTAUTH_URL cho production (https://your-domain.com)');
    if (!validateURL(nextauthUrl)) {
      log.warning('URL không hợp lệ. Vui lòng kiểm tra lại.');
    }
  } else {
    nextauthUrl = 'http://localhost:3000';
    log.info(`Sử dụng NEXTAUTH_URL mặc định: ${nextauthUrl}`);
  }

  // OPENAI_API_KEY
  const openaiKey = await askQuestion('Nhập OPENAI_API_KEY (sk-...)');
  if (!validateOpenAIKey(openaiKey)) {
    log.warning('OpenAI API key không đúng định dạng. Vui lòng kiểm tra lại.');
  }

  // DATABASE_URL
  let databaseUrl;
  if (envType.toLowerCase() === 'production') {
    databaseUrl = await askQuestion('Nhập DATABASE_URL cho production (postgresql://...)');
  } else {
    databaseUrl = 'file:./prisma/dev.db';
    log.info(`Sử dụng DATABASE_URL mặc định: ${databaseUrl}`);
  }

  // Optional configurations
  log.title('⚙️ Cấu Hình Tùy Chọn');

  // Google OAuth (optional)
  const useGoogleOAuth = await askQuestion('Cấu hình Google OAuth? (y/N)', 'N');
  let googleClientId = '', googleClientSecret = '';
  if (useGoogleOAuth.toLowerCase() === 'y') {
    googleClientId = await askQuestion('Nhập GOOGLE_CLIENT_ID');
    googleClientSecret = await askQuestion('Nhập GOOGLE_CLIENT_SECRET');
  }

  // ChromaDB (optional)
  const useChromaDB = await askQuestion('Cấu hình ChromaDB? (y/N)', 'N');
  let chromaHost = 'localhost', chromaPort = '8000';
  if (useChromaDB.toLowerCase() === 'y') {
    chromaHost = await askQuestion('Nhập CHROMA_SERVER_HOST', 'localhost');
    chromaPort = await askQuestion('Nhập CHROMA_SERVER_PORT', '8000');
  }

  // Replace placeholders in template
  const replacements = {
    'your-super-secret-jwt-secret-key-change-this-in-production': nextauthSecret,
    'http://localhost:3000': nextauthUrl,
    'sk-your-openai-api-key-here': openaiKey,
    'file:./prisma/dev.db': databaseUrl,
    'your-google-client-id.apps.googleusercontent.com': googleClientId,
    'your-google-client-secret': googleClientSecret,
    'localhost': chromaHost,
    '8000': chromaPort
  };

  Object.entries(replacements).forEach(([placeholder, value]) => {
    if (value) {
      template = template.replace(new RegExp(placeholder, 'g'), value);
    }
  });

  // Write the environment file
  log.title('💾 Lưu File Cấu Hình');
  
  if (writeEnvFile(outputPath, template)) {
    log.success(`Đã tạo file: ${outputPath}`);
    
    // Create .env.local for development if needed
    if (envType.toLowerCase() === 'development' && !fileExists('.env.local')) {
      writeEnvFile('.env.local', template);
      log.success('Đã tạo file: .env.local');
    }
  } else {
    log.error('Không thể tạo file cấu hình.');
    rl.close();
    return;
  }

  // Update .gitignore
  const gitignorePath = '.gitignore';
  const gitignoreContent = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : '';
  
  const envFilesToIgnore = ['.env.local', '.env.production', '.env'];
  let updatedGitignore = gitignoreContent;
  
  envFilesToIgnore.forEach(file => {
    if (!gitignoreContent.includes(file)) {
      updatedGitignore += `\n${file}`;
    }
  });

  if (updatedGitignore !== gitignoreContent) {
    fs.writeFileSync(gitignorePath, updatedGitignore);
    log.success('Đã cập nhật .gitignore');
  }

  // Final instructions
  log.title('🎉 Hoàn Thành Thiết Lập');
  log.success('Các biến môi trường đã được cấu hình thành công!');
  
  console.log(`\n${colors.cyan}📋 Các bước tiếp theo:${colors.reset}`);
  console.log('1. Kiểm tra file cấu hình đã tạo');
  console.log('2. Chạy: npm install (nếu chưa cài dependencies)');
  console.log('3. Chạy: npx prisma db push (để khởi tạo database)');
  console.log('4. Chạy: npm run dev (để khởi động development server)');
  
  if (envType.toLowerCase() === 'production') {
    console.log('\n🚀 Production Deployment:');
    console.log('- Cấu hình biến môi trường trên hosting platform');
    console.log('- Đảm bảo sử dụng HTTPS');
    console.log('- Kiểm tra bảo mật và performance');
  }

  console.log(`\n${colors.yellow}⚠️  Lưu ý:${colors.reset}`);
  console.log('- Không commit file .env vào git');
  console.log('- Bảo mật các API keys và secrets');
  console.log('- Kiểm tra logs nếu gặp lỗi');

  rl.close();
}

// Handle script execution
if (require.main === module) {
  setupEnvironment().catch((error) => {
    log.error(`Lỗi: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { setupEnvironment }; 