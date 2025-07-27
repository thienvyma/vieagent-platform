# 🚀 VIEAgent Platform - UPDATED Production Deployment Guide

## 🏗️ **NEW ARCHITECTURE: Multi-Service Deployment**

### 📋 **Services Overview**
1. **Vercel** - Next.js application, APIs, authentication 
2. **Supabase** - PostgreSQL database, user data
3. **Railway** - ChromaDB vector database (NEW!)
4. **MatBao** - Custom domain

### 💰 **Cost Breakdown**
- **Vercel Pro**: $20/month (hosting, unlimited bandwidth)
- **Supabase**: Free tier (up to 500MB database)  
- **Railway**: $5/month (1GB RAM, 1GB storage for ChromaDB)
- **Total**: ~$25/month for production-ready AI platform

---

# 🎯 STAGE 1: Setup Railway ChromaDB (NEW STEP)

## 1.1. Create Railway Project

### Bước 1: Setup Railway Account
1. Đi tới [Railway.app](https://railway.app/)
2. Sign up với GitHub account (same as Vercel)
3. Verify account → Get $5 free credit

### Bước 2: Deploy ChromaDB
1. Railway Dashboard → **"New Project"**
2. **"Deploy from GitHub repo"**
3. Connect `thienvyma/vieagent-platform`
4. Root Directory: `./ai-agent-platform`

### Bước 3: Configure ChromaDB Service
```bash
# Railway Environment Variables
PORT=8000
CHROMA_DB_IMPL=duckdb+parquet
PERSIST_DIRECTORY=/app/chromadb_data
CHROMA_HOST=0.0.0.0
CHROMA_PORT=8000
ANONYMIZED_TELEMETRY=false
```

### Bước 4: Create Railway Dockerfile
Railway sẽ tự động detect `Dockerfile.railway`:

```dockerfile
# Use ChromaDB official image
FROM chromadb/chroma:latest

# Create app directory
WORKDIR /app

# Create data directory with proper permissions
RUN mkdir -p /app/chromadb_data && chmod 777 /app/chromadb_data

# Set environment variables
ENV CHROMA_DB_IMPL=duckdb+parquet
ENV PERSIST_DIRECTORY=/app/chromadb_data
ENV CHROMA_HOST=0.0.0.0
ENV CHROMA_PORT=8000
ENV ANONYMIZED_TELEMETRY=false

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8000/api/v1/heartbeat || exit 1

# Start ChromaDB
CMD ["chroma", "run", "--host", "0.0.0.0", "--port", "8000", "--path", "/app/chromadb_data"]
```

### Bước 5: Get Railway URL
Sau khi deploy thành công:
```
Railway URL: https://vieagent-chromadb-production-xxxx.up.railway.app
```

## 1.2. Test ChromaDB Connection

```bash
# Test health endpoint
curl https://vieagent-chromadb-production-xxxx.up.railway.app/api/v1/heartbeat

# Should return: OK
```

---

# 🎯 STAGE 2: Setup Supabase Database (Same as before)

## 2.1. Create Supabase Project
*(Same steps as original guide)*

1. Supabase Dashboard → New Project
2. Name: `vieagent-production`
3. Region: Singapore
4. Password: `151194Vy@`

## 2.2. Deploy Schema
```bash
# From your credentials
DATABASE_URL="postgresql://postgres:151194Vy%40@db.gdhgmboqpvvhjnzycnnh.supabase.co:5432/postgres"

npx prisma db push
```

---

# 🎯 STAGE 3: Update Next.js Code for External ChromaDB

## 3.1. Update ChromaDB Configuration

### Edit `src/lib/chromadb-integration.ts`:
```typescript
// Update DEFAULT_OPTIONS for Railway connection
const DEFAULT_OPTIONS: ChromaDBOptions = {
  host: process.env.CHROMADB_HOST || 'vieagent-chromadb-production-xxxx.up.railway.app',
  port: process.env.CHROMADB_PORT ? parseInt(process.env.CHROMADB_PORT) : 443,
  path: '/api/v1',
  ssl: true, // Railway provides HTTPS
  embeddingFunction: 'openai',
  defaultCollection: 'documents',
  batchSize: 50, // Smaller batches for remote connection
  maxRetries: 5, // More retries for network
  retryDelayMs: 2000,
  timeoutMs: 60000, // Longer timeout for remote
  enableCompression: true,
  // ... rest of config
};
```

## 3.2. Update Environment Variables

### New Environment Variables for Vercel:
```bash
# ChromaDB Railway Connection
CHROMADB_HOST=vieagent-chromadb-production-xxxx.up.railway.app
CHROMADB_PORT=443
CHROMADB_SSL=true
CHROMADB_API_BASE=https://vieagent-chromadb-production-xxxx.up.railway.app

# Connection pool settings for remote ChromaDB
CHROMADB_MAX_CONNECTIONS=10
CHROMADB_CONNECTION_TIMEOUT=30000
CHROMADB_RETRY_ATTEMPTS=3
```

## 3.3. Add Network Error Handling

### Create `src/lib/chromadb-network-handler.ts`:
```typescript
export class ChromaDBNetworkHandler {
  private baseUrl: string;
  private maxRetries: number;
  private retryDelayMs: number;

  constructor(baseUrl: string, maxRetries = 3, retryDelayMs = 1000) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.maxRetries = maxRetries;
    this.retryDelayMs = retryDelayMs;
  }

  async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          timeout: 30000, // 30 second timeout
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response;
      } catch (error) {
        console.error(`ChromaDB request attempt ${attempt} failed:`, error);
        
        if (attempt === this.maxRetries) {
          throw new Error(`ChromaDB connection failed after ${this.maxRetries} attempts: ${error}`);
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, this.retryDelayMs * Math.pow(2, attempt - 1)));
      }
    }

    throw new Error('Unexpected error in ChromaDB request');
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/api/v1/heartbeat');
      return response.ok;
    } catch {
      return false;
    }
  }
}
```

---

# 🎯 STAGE 4: Deploy to Vercel (Updated)

## 4.1. Updated Environment Variables for Vercel

### 🔴 CRITICAL - Database & ChromaDB:
```bash
# PostgreSQL Database
DATABASE_URL=postgresql://postgres.gdhgmboqpvvhjnzycnnh:151194Vy%40@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
DIRECT_DATABASE_URL=postgresql://postgres:151194Vy%40@db.gdhgmboqpvvhjnzycnnh.supabase.co:5432/postgres

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://gdhgmboqpvvhjnzycnnh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkaGdtYm9xcHZ2aGpuenljbm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTA2NDUsImV4cCI6MjA2ODY2NjY0NX0.XUeVBNtEXeUXAmG3XHPca5fJwG97YW6qFmsaGhjK8hs

# ChromaDB Railway (NEW)
CHROMADB_HOST=vieagent-chromadb-production-xxxx.up.railway.app
CHROMADB_PORT=443
CHROMADB_SSL=true
CHROMADB_API_BASE=https://vieagent-chromadb-production-xxxx.up.railway.app

# Authentication 
NEXTAUTH_SECRET=e80bbdaeda787aafdc65471726898465
NEXTAUTH_URL=https://vieagent.com
ENCRYPTION_KEY=2c88f0582d7c9ed21beabfb2763a5a2b

# Basic Config
NEXT_PUBLIC_BASE_URL=https://vieagent.com
NODE_ENV=production

# Google OAuth (Replace with your actual credentials)
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET_HERE

# Email
FROM_EMAIL=noreply@vieagent.com
```

---

# 🎯 STAGE 5: Custom Domain & DNS (Same as before)

## 5.1. MatBao DNS Configuration
*(Same steps as original guide)*

---

# 🎯 STAGE 6: Testing Multi-Service Architecture

## 6.1. Health Check All Services

### Test Vercel App:
```bash
curl https://vieagent.com/api/health
```

### Test Railway ChromaDB:
```bash
curl https://vieagent-chromadb-production-xxxx.up.railway.app/api/v1/heartbeat
```

### Test Supabase Connection:
```bash
curl https://vieagent.com/api/auth/csrf
```

## 6.2. Test Vector Operations

### Create test collection:
```bash
POST https://vieagent.com/api/knowledge/collections
{
  "name": "test",
  "description": "Test collection"
}
```

### Add documents:
```bash
POST https://vieagent.com/api/knowledge/documents
{
  "collectionName": "test",
  "documents": [
    {
      "id": "test-1",
      "content": "This is a test document",
      "metadata": {"source": "test"}
    }
  ]
}
```

### Search vectors:
```bash
POST https://vieagent.com/api/knowledge/search
{
  "collectionName": "test", 
  "query": "test document",
  "limit": 5
}
```

---

# 🚨 **Migration Notes**

## Remove Local ChromaDB
```bash
# After successful Railway deployment, remove local ChromaDB
rm -rf chromadb_data/
rm -rf chromadb_data.backup*

# Update .gitignore to exclude ChromaDB data
echo "chromadb_data/" >> .gitignore
```

## Performance Expectations
- **Latency**: +50-100ms (network overhead)
- **Throughput**: Same (Railway has good performance)
- **Reliability**: Better (persistent storage, auto-restart)
- **Scalability**: Much better (Railway auto-scales)

---

# 📊 **Cost Analysis**

### Before (Impossible on Vercel):
- ❌ ChromaDB would crash Vercel functions
- ❌ Data loss on every deployment
- ❌ Memory limit exceeded

### After (Railway Architecture):
- ✅ **Vercel Pro**: $20/month (app hosting)
- ✅ **Railway**: $5/month (ChromaDB hosting)  
- ✅ **Supabase**: Free (PostgreSQL)
- ✅ **Total**: $25/month for scalable AI platform

---

# 🎯 **Deployment Order**

1. **Railway ChromaDB** (15-20 min) → Get external URL
2. **Update code** (5 min) → Fix ChromaDB connection
3. **Deploy Vercel** (10 min) → With Railway URL in env vars
4. **Test integration** (5 min) → Verify all services work
5. **Custom domain** (30-60 min) → DNS setup
6. **Production testing** (10 min) → End-to-end tests

**Total**: 75-110 minutes (vs 45-90 with broken architecture)

---

**🎉 This architecture is production-ready, scalable, and cost-effective!**

*ChromaDB on Railway = Best practice for vector databases* 