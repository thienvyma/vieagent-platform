#!/bin/bash

# =============================================================================
# VIEAgent Platform - Complete Backup Script
# =============================================================================
# Usage: ./scripts/backup.sh
# Tạo backup toàn diện trước khi deploy production

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="vieagent_backup_${TIMESTAMP}"
FULL_BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

# Create backup directory
echo -e "${BLUE}🔄 Creating backup directory...${NC}"
mkdir -p "${FULL_BACKUP_PATH}"

echo -e "${GREEN}📦 Starting VIEAgent Platform Backup${NC}"
echo -e "${BLUE}Backup Location: ${FULL_BACKUP_PATH}${NC}"
echo -e "${BLUE}Timestamp: ${TIMESTAMP}${NC}"
echo ""

# =============================================================================
# 1. CODEBASE BACKUP
# =============================================================================
echo -e "${YELLOW}📁 1. Backing up codebase...${NC}"

# Copy all source code excluding node_modules and temp files
rsync -av \
  --exclude="node_modules/" \
  --exclude=".next/" \
  --exclude="dist/" \
  --exclude="build/" \
  --exclude="coverage/" \
  --exclude=".env*" \
  --exclude="*.log" \
  --exclude=".DS_Store" \
  --exclude="Thumbs.db" \
  --exclude="chromadb_data/" \
  --exclude="uploads/" \
  --exclude="backups/" \
  . "${FULL_BACKUP_PATH}/codebase/"

echo -e "${GREEN}✅ Codebase backup completed${NC}"

# =============================================================================
# 2. DATABASE BACKUP
# =============================================================================
echo -e "${YELLOW}🗄️  2. Backing up database...${NC}"

# Check if database exists and backup
if [ -f "prisma/dev.db" ]; then
  echo "  📋 SQLite database found - copying..."
  cp "prisma/dev.db" "${FULL_BACKUP_PATH}/database_sqlite.db"
  echo -e "${GREEN}  ✅ SQLite database backed up${NC}"
fi

# Backup database schema
echo "  📋 Backing up Prisma schema..."
cp "prisma/schema.prisma" "${FULL_BACKUP_PATH}/schema.prisma"

# Export database schema SQL
if command -v npx &> /dev/null; then
  echo "  📋 Generating database schema SQL..."
  npx prisma db execute --schema=./prisma/schema.prisma --file=<(echo "-- Database Schema Export"; echo "-- Generated: $(date)") > "${FULL_BACKUP_PATH}/schema.sql" 2>/dev/null || true
fi

echo -e "${GREEN}✅ Database backup completed${NC}"

# =============================================================================
# 3. CONFIGURATION BACKUP
# =============================================================================
echo -e "${YELLOW}⚙️  3. Backing up configurations...${NC}"

# Backup all config files
CONFIG_FILES=(
  "package.json"
  "package-lock.json"
  "tsconfig.json"
  "next.config.js"
  ".eslintrc.json"
  "tailwind.config.js"
  "postcss.config.js"
  "jest.config.js"
  "jest.setup.js"
  "vercel.json"
)

for file in "${CONFIG_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  📄 Backing up $file..."
    cp "$file" "${FULL_BACKUP_PATH}/$file"
  fi
done

# Backup environment template
if [ -f "env.example" ]; then
  cp "env.example" "${FULL_BACKUP_PATH}/env.example"
  echo "  📄 Environment template backed up"
fi

echo -e "${GREEN}✅ Configuration backup completed${NC}"

# =============================================================================
# 4. GIT BACKUP
# =============================================================================
echo -e "${YELLOW}📝 4. Backing up Git information...${NC}"

# Save current Git status
echo "=== Git Status ===" > "${FULL_BACKUP_PATH}/git_info.txt"
git status >> "${FULL_BACKUP_PATH}/git_info.txt" 2>/dev/null || echo "No git repository" >> "${FULL_BACKUP_PATH}/git_info.txt"

echo "" >> "${FULL_BACKUP_PATH}/git_info.txt"
echo "=== Git Log (last 10 commits) ===" >> "${FULL_BACKUP_PATH}/git_info.txt"
git log --oneline -10 >> "${FULL_BACKUP_PATH}/git_info.txt" 2>/dev/null || echo "No git history" >> "${FULL_BACKUP_PATH}/git_info.txt"

echo "" >> "${FULL_BACKUP_PATH}/git_info.txt"
echo "=== Current Branch ===" >> "${FULL_BACKUP_PATH}/git_info.txt"
git branch --show-current >> "${FULL_BACKUP_PATH}/git_info.txt" 2>/dev/null || echo "No current branch" >> "${FULL_BACKUP_PATH}/git_info.txt"

echo "" >> "${FULL_BACKUP_PATH}/git_info.txt"
echo "=== Remote URLs ===" >> "${FULL_BACKUP_PATH}/git_info.txt"
git remote -v >> "${FULL_BACKUP_PATH}/git_info.txt" 2>/dev/null || echo "No remotes" >> "${FULL_BACKUP_PATH}/git_info.txt"

# Create git bundle backup
if git rev-parse --git-dir > /dev/null 2>&1; then
  echo "  📦 Creating Git bundle..."
  git bundle create "${FULL_BACKUP_PATH}/repository.bundle" --all 2>/dev/null || echo "  ⚠️  Could not create git bundle"
fi

echo -e "${GREEN}✅ Git backup completed${NC}"

# =============================================================================
# 5. DEPENDENCIES BACKUP
# =============================================================================
echo -e "${YELLOW}📚 5. Backing up dependencies info...${NC}"

# Save npm list
if command -v npm &> /dev/null; then
  echo "  📋 Saving npm dependencies..."
  npm list --depth=0 > "${FULL_BACKUP_PATH}/npm_list.txt" 2>/dev/null || true
  npm list --depth=0 --dev > "${FULL_BACKUP_PATH}/npm_list_dev.txt" 2>/dev/null || true
fi

# Save node/npm versions
echo "=== System Info ===" > "${FULL_BACKUP_PATH}/system_info.txt"
echo "Node Version: $(node --version)" >> "${FULL_BACKUP_PATH}/system_info.txt" 2>/dev/null || echo "Node: Not installed" >> "${FULL_BACKUP_PATH}/system_info.txt"
echo "NPM Version: $(npm --version)" >> "${FULL_BACKUP_PATH}/system_info.txt" 2>/dev/null || echo "NPM: Not installed" >> "${FULL_BACKUP_PATH}/system_info.txt"
echo "OS: $(uname -a)" >> "${FULL_BACKUP_PATH}/system_info.txt"
echo "Date: $(date)" >> "${FULL_BACKUP_PATH}/system_info.txt"

echo -e "${GREEN}✅ Dependencies backup completed${NC}"

# =============================================================================
# 6. CREATE RESTORE INSTRUCTIONS
# =============================================================================
echo -e "${YELLOW}📖 6. Creating restore instructions...${NC}"

cat > "${FULL_BACKUP_PATH}/RESTORE_INSTRUCTIONS.md" << EOF
# 🔄 VIEAgent Platform - Restore Instructions

## 📋 Backup Information
- **Created**: $(date)
- **Backup Name**: ${BACKUP_NAME}
- **Node Version**: $(node --version 2>/dev/null || echo "Unknown")
- **NPM Version**: $(npm --version 2>/dev/null || echo "Unknown")

## 🚨 How to Restore (if deployment fails)

### 1. Stop Current Application
\`\`\`bash
# If running locally
pkill -f "next"

# If deployed, rollback on Vercel dashboard
\`\`\`

### 2. Restore Codebase
\`\`\`bash
# Navigate to project directory
cd /path/to/your/project

# Backup current state (just in case)
mv ai-agent-platform ai-agent-platform-failed-\$(date +%Y%m%d_%H%M%S)

# Restore from backup
cp -r "${FULL_BACKUP_PATH}/codebase" ai-agent-platform
cd ai-agent-platform
\`\`\`

### 3. Restore Dependencies
\`\`\`bash
# Clean install dependencies
rm -rf node_modules package-lock.json
npm install

# Restore database
cp "${FULL_BACKUP_PATH}/database_sqlite.db" prisma/dev.db 2>/dev/null || true
\`\`\`

### 4. Restore Git Repository (if needed)
\`\`\`bash
# If git history is lost, restore from bundle
git clone "${FULL_BACKUP_PATH}/repository.bundle" . 2>/dev/null || true

# Or manually setup git
git init
git add .
git commit -m "Restored from backup ${TIMESTAMP}"
\`\`\`

### 5. Test Application
\`\`\`bash
# Generate Prisma client
npm run db:generate

# Test build
npm run build

# Start development
npm run dev
\`\`\`

### 6. Verify Everything Works
- [ ] Application starts without errors
- [ ] Database connections work  
- [ ] All pages load correctly
- [ ] Authentication works
- [ ] API endpoints respond

## 📞 Emergency Contacts
If restore fails, contact:
- Developer support
- Check troubleshooting in DEPLOYMENT_GUIDE.md

## 🔍 Backup Contents
- \`codebase/\` - Complete source code
- \`schema.prisma\` - Database schema
- \`database_sqlite.db\` - Local database (if exists)
- \`*.json\` - Configuration files
- \`git_info.txt\` - Git repository status
- \`repository.bundle\` - Git repository backup
- \`system_info.txt\` - System environment info
EOF

echo -e "${GREEN}✅ Restore instructions created${NC}"

# =============================================================================
# 7. CREATE BACKUP SUMMARY
# =============================================================================
echo -e "${YELLOW}📊 7. Creating backup summary...${NC}"

# Calculate backup size
BACKUP_SIZE=$(du -sh "${FULL_BACKUP_PATH}" | cut -f1)

# Count files
FILE_COUNT=$(find "${FULL_BACKUP_PATH}" -type f | wc -l)

# Create summary
cat > "${FULL_BACKUP_PATH}/BACKUP_SUMMARY.txt" << EOF
=== VIEAgent Platform Backup Summary ===

Backup Name: ${BACKUP_NAME}
Created: $(date)
Size: ${BACKUP_SIZE}
Files: ${FILE_COUNT}

Components Backed Up:
✅ Source Code (excluding node_modules, .next, etc.)
✅ Database Schema (prisma/schema.prisma)
$([ -f "prisma/dev.db" ] && echo "✅ SQLite Database (prisma/dev.db)" || echo "❌ No SQLite Database found")
✅ Configuration Files (package.json, next.config.js, etc.)
✅ Git Repository Information
$(git rev-parse --git-dir > /dev/null 2>&1 && echo "✅ Git Bundle" || echo "❌ No Git Repository")
✅ Dependencies Information
✅ System Environment Info
✅ Restore Instructions

Backup Location: ${FULL_BACKUP_PATH}

Next Steps:
1. Verify backup integrity
2. Test restore process (recommended)
3. Proceed with deployment
4. Keep this backup until deployment is confirmed stable

EOF

echo -e "${GREEN}✅ Backup summary created${NC}"

# =============================================================================
# FINAL REPORT
# =============================================================================
echo ""
echo -e "${GREEN}🎉 BACKUP COMPLETED SUCCESSFULLY!${NC}"
echo ""
echo -e "${BLUE}📊 Backup Summary:${NC}"
echo -e "  📁 Location: ${FULL_BACKUP_PATH}"
echo -e "  💾 Size: ${BACKUP_SIZE}"
echo -e "  📄 Files: ${FILE_COUNT}"
echo ""
echo -e "${YELLOW}📋 What's backed up:${NC}"
echo -e "  ✅ Complete source code"
echo -e "  ✅ Database schema & data"
echo -e "  ✅ Configuration files"
echo -e "  ✅ Git repository"
echo -e "  ✅ Dependencies info"
echo -e "  ✅ Restore instructions"
echo ""
echo -e "${BLUE}🔄 To restore if needed:${NC}"
echo -e "  📖 Read: ${FULL_BACKUP_PATH}/RESTORE_INSTRUCTIONS.md"
echo ""
echo -e "${GREEN}✨ Ready for deployment! Your code is safely backed up.${NC}"
echo ""

# Make backup read-only to prevent accidental modifications
chmod -R 444 "${FULL_BACKUP_PATH}"
chmod 755 "${FULL_BACKUP_PATH}" # Keep directory executable

exit 0 