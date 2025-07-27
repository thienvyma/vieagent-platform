# 🚀 Vercel Production Deployment Guide

## 📋 **Overview**

This guide covers deploying VIEAgent to Vercel Pro with full CI/CD pipeline, custom domain, and production environment configuration.

**Deployment Strategy:**
- GitHub integration for automatic deployments
- Production environment variables
- Custom domain with SSL
- Build optimization and caching
- Performance monitoring

---

## 🔧 **Step 1: Vercel Account Setup**

### **1.1 Upgrade to Vercel Pro**
1. Go to [vercel.com](https://vercel.com)
2. Sign up/login with GitHub
3. Go to **Settings** → **Billing**
4. Upgrade to **Pro Plan** ($20/month)
   - Unlimited builds
   - Custom domains
   - Advanced analytics
   - Team collaboration

### **1.2 Install Vercel CLI**
```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to your account
vercel login

# Link your project
vercel link
```

---

## 📦 **Step 2: Project Configuration**

### **2.1 Optimize Vercel Configuration**
Update `vercel.json` for production:

```json
{
  "version": 2,
  "name": "vieagent-production",
  "alias": ["vieagent.com", "www.vieagent.com"],
  "regions": ["sin1", "hnd1"],
  "build": {
    "env": {
      "NODE_ENV": "production",
      "NEXT_TELEMETRY_DISABLED": "1"
    }
  },
  "env": {
    "NODE_ENV": "production"
  },
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm ci",
  "framework": "nextjs",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/docs",
      "destination": "/documentation",
      "permanent": true
    }
  ],
  "rewrites": [
    {
      "source": "/health",
      "destination": "/api/health"
    }
  ],
  "crons": [
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### **2.2 Environment Variables Configuration**
Create production environment variables in Vercel:

```bash
# Set environment variables via CLI
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add OPENAI_API_KEY production
vercel env add ANTHROPIC_API_KEY production
vercel env add GOOGLE_GEMINI_API_KEY production
vercel env add GOOGLE_CLIENT_ID production
vercel env add GOOGLE_CLIENT_SECRET production
vercel env add RESEND_API_KEY production
vercel env add SUPABASE_URL production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add CHROMA_SERVER_HOST production
vercel env add REDIS_URL production

# Or use Vercel Dashboard:
# 1. Go to Project Settings
# 2. Environment Variables
# 3. Add each variable for Production
```

---

## 🔗 **Step 3: GitHub Integration**

### **3.1 Connect GitHub Repository**
1. In Vercel Dashboard, go to your project
2. **Settings** → **Git**
3. **Connect Git Repository**
4. Select your VIEAgent repository
5. Configure branch settings:
   - **Production Branch**: `main`
   - **Preview Branches**: `develop`, `staging`

### **3.2 Automatic Deployment Configuration**
```yaml
# .github/workflows/vercel-production.yml
name: Vercel Production Deployment

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  Deploy-Production:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install Dependencies
        run: npm ci
        
      - name: Run Type Check
        run: npm run type-check
        
      - name: Run Linting
        run: npm run lint
        
      - name: Run Tests
        run: npm run test:ci
        
      - name: Install Vercel CLI
        run: npm install --global vercel@latest
        
      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
        
      - name: Build Project Artifacts
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
        
      - name: Deploy Project Artifacts to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}

  Deploy-Preview:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install Dependencies
        run: npm ci
        
      - name: Install Vercel CLI
        run: npm install --global vercel@latest
        
      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=preview --token=${{ secrets.VERCEL_TOKEN }}
        
      - name: Build Project Artifacts
        run: vercel build --token=${{ secrets.VERCEL_TOKEN }}
        
      - name: Deploy Project Artifacts to Vercel
        run: vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }}
```

### **3.3 Required GitHub Secrets**
Add these secrets in GitHub repository settings:
```
VERCEL_TOKEN: [Your Vercel API Token]
VERCEL_ORG_ID: [Your Vercel Organization ID]
VERCEL_PROJECT_ID: [Your Vercel Project ID]
```

---

## 🏗️ **Step 4: Build Optimization**

### **4.1 Next.js Production Build Configuration**
Update `next.config.js` for optimal production builds:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  
  // Performance optimizations
  experimental: {
    optimizeCss: true,
    optimizeServerReact: true,
  },
  
  // Image optimization
  images: {
    domains: ['yourdomain.com'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 86400,
  },
  
  // Bundle analyzer (production)
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    if (!dev && !isServer) {
      config.plugins.push(
        new webpack.DefinePlugin({
          'process.env.BUILD_ID': JSON.stringify(buildId),
        })
      );
    }
    
    // Optimize bundle size
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            reuseExistingChunk: true,
          },
        },
      },
    };
    
    return config;
  },
  
  // Environment variables
  env: {
    BUILD_TIME: new Date().toISOString(),
    BUILD_VERSION: process.env.npm_package_version,
  },
  
  // Redirects for production
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/dashboard/overview',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
```

### **4.2 Package.json Scripts Update**
Add production deployment scripts:

```json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "build:analyze": "ANALYZE=true npm run build",
    "build:production": "NODE_ENV=production npm run build",
    "deploy:production": "vercel --prod",
    "deploy:preview": "vercel",
    "vercel-build": "npm run build",
    "postbuild": "next-sitemap"
  }
}
```

---

## 🔐 **Step 5: Security Configuration**

### **5.1 Environment Security**
```javascript
// lib/env-validation.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  OPENAI_API_KEY: z.string().startsWith('sk-'),
  // ... other environment variables
});

export const env = envSchema.parse(process.env);
```

### **5.2 Security Headers Middleware**
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Rate limiting
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Implement rate limiting logic
  }
  
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    '/api/(.*)',
  ],
};
```

---

## 📊 **Step 6: Monitoring & Analytics**

### **6.1 Vercel Analytics Integration**
```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### **6.2 Health Check API**
```typescript
// app/api/health/route.ts
export async function GET() {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    env: process.env.NODE_ENV,
    version: process.env.BUILD_VERSION,
    buildId: process.env.BUILD_ID,
  };
  
  try {
    // Test database connection
    // Test external services
    
    return Response.json(healthcheck);
  } catch (error) {
    healthcheck.message = error.message;
    return Response.json(healthcheck, { status: 503 });
  }
}
```

---

## 🧪 **Step 7: Testing & Validation**

### **7.1 Pre-deployment Tests**
```bash
# Run all tests before deployment
npm run type-check
npm run lint
npm run test:ci
npm run build

# Test production build locally
npm run start
```

### **7.2 Deployment Validation Script**
```javascript
// scripts/validate-deployment.js
const https = require('https');

async function validateDeployment(url) {
  console.log(`🧪 Validating deployment: ${url}`);
  
  const tests = [
    { name: 'Health Check', path: '/api/health' },
    { name: 'Home Page', path: '/' },
    { name: 'Login Page', path: '/login' },
    { name: 'API Documentation', path: '/api/docs' }
  ];
  
  for (const test of tests) {
    try {
      const response = await fetch(`${url}${test.path}`);
      const status = response.ok ? '✅' : '❌';
      console.log(`${status} ${test.name}: ${response.status}`);
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
    }
  }
}

// Usage: node scripts/validate-deployment.js https://vieagent.com
if (process.argv[2]) {
  validateDeployment(process.argv[2]);
}
```

---

## 📋 **Deployment Checklist**

### **Pre-deployment**
- [ ] ✅ Vercel Pro account activated
- [ ] ✅ GitHub repository connected
- [ ] ✅ Environment variables configured
- [ ] ✅ vercel.json optimized
- [ ] ✅ Build scripts configured
- [ ] ✅ GitHub Actions workflow setup

### **Deployment**
- [ ] ✅ Initial deployment successful
- [ ] ✅ Custom domain configured
- [ ] ✅ SSL certificate active
- [ ] ✅ Analytics enabled
- [ ] ✅ Monitoring configured

### **Post-deployment**
- [ ] ✅ Health checks passing
- [ ] ✅ Performance metrics acceptable
- [ ] ✅ Security headers verified
- [ ] ✅ Error tracking active
- [ ] ✅ Backup procedures tested

---

## 🚨 **Troubleshooting**

### **Common Build Issues**
```bash
# Memory issues
echo "VERCEL_BUILD_MEMORY=8192" >> .env

# Timeout issues
echo "VERCEL_BUILD_TIMEOUT=600" >> .env

# Dependencies issues
rm -rf node_modules package-lock.json
npm install
```

### **Environment Variable Issues**
```bash
# Check environment variables
vercel env ls

# Pull latest environment
vercel env pull .env.local
```

---

## 🎯 **Performance Optimization**

### **Bundle Size Optimization**
```bash
# Analyze bundle size
npm run build:analyze

# Check for large dependencies
npx webpack-bundle-analyzer .next/static/chunks/*.js
```

### **Caching Strategy**
```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};
```

---

## 🚀 **Deployment Commands**

```bash
# Deploy to production
npm run deploy:production

# Deploy preview
npm run deploy:preview

# Check deployment status
vercel ls

# View deployment logs
vercel logs
```

---

**Vercel CI/CD Pipeline Setup Complete!** 🎉
**Your VIEAgent platform now has automated production deployments.** 