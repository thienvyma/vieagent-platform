#!/bin/bash

# VIEAgent UI Update Script
# This script updates all UI components with VIEAgent branding

echo "🎨 Updating VIEAgent UI Components..."

# Update all TSX files with old logo patterns
find src -name "*.tsx" -type f -exec sed -i 's/AI Agent Platform/VIEAgent/g' {} +
find src -name "*.tsx" -type f -exec sed -i 's/AI AGENT PLATFORM/VIEAGENT/g' {} +

# Update specific emoji patterns
find src -name "*.tsx" -type f -exec sed -i 's/🤖/VIEAgent/g' {} +

echo "✅ VIEAgent UI update completed!"
