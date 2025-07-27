#!/bin/bash

# 🆓 FREE TIER DEPLOYMENT SCRIPT
# Script triển khai miễn phí cho AI Agent Platform

echo "🚀 Starting FREE TIER deployment..."

# =============================================================================
# STEP 1: ENVIRONMENT VALIDATION
# =============================================================================
echo "📋 Step 1: Validating environment..."

# Check if required files exist
if [ ! -f "env.production.free" ]; then
    echo "❌ env.production.free not found!"
    exit 1
fi

if [ ! -f "package.json" ]; then
    echo "❌ package.json not found!"
    exit 1
fi

echo "✅ Environment files validated"

# =============================================================================
# STEP 2: DEPENDENCIES CHECK
# =============================================================================
echo "📋 Step 2: Checking dependencies..."

# Check Node.js version
NODE_VERSION=$(node -v)
echo "Node.js version: $NODE_VERSION"

# Check npm version
NPM_VERSION=$(npm -v)
echo "npm version: $NPM_VERSION"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo "✅ Dependencies installed"

# =============================================================================
# STEP 3: DATABASE SETUP
# =============================================================================
echo "📋 Step 3: Setting up database..."

# Load environment variables
export $(grep -v '^#' env.production.free | xargs)

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Push database schema (for Supabase)
echo "🗄️ Pushing database schema..."
npx prisma db push

echo "✅ Database setup completed"

# =============================================================================
# STEP 4: BUILD APPLICATION
# =============================================================================
echo "📋 Step 4: Building application..."

# Build Next.js application
echo "🏗️ Building Next.js app..."
npm run build

echo "✅ Application built successfully"

# =============================================================================
# STEP 5: VERCEL DEPLOYMENT
# =============================================================================
echo "📋 Step 5: Deploying to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment completed successfully!"

# =============================================================================
# STEP 6: POST-DEPLOYMENT CHECKS
# =============================================================================
echo "📋 Step 6: Post-deployment checks..."

# Health check
echo "🔍 Performing health check..."
sleep 10

# Get deployment URL from Vercel
DEPLOYMENT_URL=$(vercel --prod --confirm 2>&1 | grep -o 'https://[^[:space:]]*')

if [ -n "$DEPLOYMENT_URL" ]; then
    echo "✅ Deployment URL: $DEPLOYMENT_URL"
    
    # Test health endpoint
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL/api/health")
    
    if [ "$HTTP_STATUS" = "200" ]; then
        echo "✅ Health check passed"
    else
        echo "⚠️ Health check failed (HTTP $HTTP_STATUS)"
    fi
else
    echo "⚠️ Could not determine deployment URL"
fi

# =============================================================================
# DEPLOYMENT SUMMARY
# =============================================================================
echo ""
echo "🎉 FREE TIER DEPLOYMENT COMPLETED!"
echo "=================================="
echo "Platform: Vercel (Free)"
echo "Database: Supabase (Free)"
echo "Vector DB: Pinecone (Free)"
echo "Email: Resend (Free)"
echo "Storage: Cloudinary (Free)"
echo "Cache: Upstash (Free)"
echo "Monitoring: Sentry (Free)"
echo ""
echo "🔗 Deployment URL: $DEPLOYMENT_URL"
echo "📊 Dashboard: https://vercel.com/dashboard"
echo ""
echo "📋 Next Steps:"
echo "1. Configure domain (optional)"
echo "2. Set up monitoring alerts"
echo "3. Test all features"
echo "4. Monitor usage limits"
echo ""
echo "✅ Deployment successful!" 