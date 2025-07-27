# 🚂 Railway ChromaDB Deployment Guide

## 📋 **Overview**

This guide walks you through deploying a production-ready ChromaDB instance on Railway for your VIEAgent platform's vector database needs.

**Why Railway for ChromaDB:**
- ✅ Persistent storage included
- ✅ Automatic scaling
- ✅ $5/month for 1GB RAM + 1GB storage
- ✅ Easy deployment from GitHub
- ✅ Built-in monitoring

---

## 🚀 **Step 1: Prepare ChromaDB Docker Configuration**

### **1.1 Create ChromaDB Dockerfile**
Create `chromadb.Dockerfile` in your project root:

```dockerfile
FROM chromadb/chroma:latest

# Set working directory
WORKDIR /chroma

# Create data directory
RUN mkdir -p /chroma/data

# Copy any custom configuration
COPY chromadb.config.yml /chroma/config.yml

# Expose port
EXPOSE 8000

# Set environment variables
ENV CHROMA_HOST=0.0.0.0
ENV CHROMA_PORT=8000
ENV CHROMA_DB_IMPL=clickhouse
ENV CHROMA_API_IMPL=chromadb.api.fastapi.FastAPI
ENV PERSIST_DIRECTORY=/chroma/data
ENV ANONYMIZED_TELEMETRY=false

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8000/api/v1/heartbeat || exit 1

# Start ChromaDB
CMD ["chroma", "run", "--host", "0.0.0.0", "--port", "8000", "--path", "/chroma/data"]
```

### **1.2 Create ChromaDB Configuration**
Create `chromadb.config.yml`:

```yaml
# ChromaDB Production Configuration
chroma:
  api_impl: "chromadb.api.fastapi.FastAPI"
  db_impl: "clickhouse"
  
# Persistence settings
persist_directory: "/chroma/data"

# API settings
server:
  host: "0.0.0.0"
  port: 8000
  cors_allow_origins: ["*"]
  
# Performance settings
embedding:
  default_model: "sentence-transformers/all-MiniLM-L6-v2"
  
# Security settings (Railway will handle HTTPS)
auth:
  enabled: false  # Railway provides network-level security
  
# Telemetry
telemetry:
  anonymized: false
  
# Logging
logging:
  level: "INFO"
  format: "json"
```

### **1.3 Create Railway Deployment Script**
Create `railway-chromadb-deploy.sh`:

```bash
#!/bin/bash

# Railway ChromaDB Deployment Script

echo "🚂 Deploying ChromaDB to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway (if not already)
echo "🔐 Logging into Railway..."
railway login

# Create new service
echo "📦 Creating new Railway service..."
railway new

# Set up environment variables
echo "🔧 Setting up environment variables..."
railway variables set CHROMA_HOST=0.0.0.0
railway variables set CHROMA_PORT=8000
railway variables set PERSIST_DIRECTORY=/app/data
railway variables set ANONYMIZED_TELEMETRY=false

# Deploy
echo "🚀 Deploying to Railway..."
railway up

echo "✅ ChromaDB deployment initiated!"
echo "📋 Next steps:"
echo "1. Go to Railway dashboard to monitor deployment"
echo "2. Note the public domain URL"
echo "3. Update your .env.production with the ChromaDB URL"
```

---

## 🔧 **Step 2: Deploy to Railway**

### **2.1 Sign up for Railway**
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Verify email if required

### **2.2 Create New Project**
1. Click "New Project"
2. Choose "Deploy from GitHub repo"
3. Connect your VIEAgent repository
4. Or choose "Empty Project" for manual setup

### **2.3 Configure Service**
1. **Service Name**: `vieagent-chromadb`
2. **Start Command**: `chroma run --host 0.0.0.0 --port 8000 --path /data`
3. **Port**: `8000`

### **2.4 Environment Variables**
Set these in Railway dashboard:
```bash
CHROMA_HOST=0.0.0.0
CHROMA_PORT=8000
CHROMA_DB_IMPL=clickhouse
PERSIST_DIRECTORY=/data
ANONYMIZED_TELEMETRY=false
```

### **2.5 Volume Configuration**
1. Go to **Settings** > **Volumes**
2. Add volume: `/data` (for persistent storage)
3. Size: Start with 1GB (expandable)

---

## 🔐 **Step 3: Alternative - Simple Docker Deployment**

If you prefer a simpler approach, use Railway's Docker deployment:

### **3.1 Create Simple Dockerfile**
Create `Dockerfile.chromadb`:

```dockerfile
FROM chromadb/chroma:latest

EXPOSE 8000

ENV CHROMA_HOST=0.0.0.0
ENV CHROMA_PORT=8000
ENV PERSIST_DIRECTORY=/chroma/data

VOLUME ["/chroma/data"]

CMD ["chroma", "run", "--host", "0.0.0.0", "--port", "8000", "--path", "/chroma/data"]
```

### **3.2 Deploy via Railway CLI**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create new project
railway new

# Deploy from current directory
railway up --dockerfile Dockerfile.chromadb
```

---

## ⚙️ **Step 4: Configure VIEAgent Connection**

### **4.1 Get Railway Service URL**
After deployment, Railway provides a public URL like:
```
https://vieagent-chromadb-production.up.railway.app
```

### **4.2 Update Environment Variables**
In your `.env.production`:
```bash
# Railway ChromaDB Configuration
CHROMA_SERVER_HOST="vieagent-chromadb-production.up.railway.app"
CHROMA_SERVER_PORT="443"
CHROMA_SERVER_SSL="true"
CHROMA_SERVER_URL="https://vieagent-chromadb-production.up.railway.app"

# Optional: Authentication (if you enable it later)
# CHROMA_AUTH_TOKEN="your-auth-token"
```

### **4.3 Update ChromaDB Client Configuration**
Modify `src/lib/chromadb-production.ts`:

```typescript
// Update the configuration for Railway deployment
export class ProductionChromaDBService {
  constructor(config: Partial<ProductionChromaConfig> = {}) {
    this.config = {
      host: process.env.CHROMA_SERVER_HOST || 'localhost',
      port: parseInt(process.env.CHROMA_SERVER_PORT || '8000'),
      persistPath: '/data', // Railway volume path
      enableAuth: false, // Start without auth
      maxRetries: 5,
      timeout: 10000,
      batchSize: 100,
      enableCompression: true,
      healthCheckInterval: 30000,
      ...config,
    };
  }

  // Use HTTPS URL for Railway
  private getBaseUrl(): string {
    const protocol = this.config.port === 443 ? 'https' : 'http';
    return `${protocol}://${this.config.host}:${this.config.port}`;
  }
}
```

---

## ✅ **Step 5: Test & Validate**

### **5.1 Health Check**
```bash
# Test ChromaDB health endpoint
curl https://your-railway-app.up.railway.app/api/v1/heartbeat

# Expected response: {"nanosecond heartbeat": <timestamp>}
```

### **5.2 Basic Operations Test**
```javascript
// Test script: test-chromadb-connection.js
const { ChromaClient } = require('chromadb');

async function testChromaDB() {
  try {
    const client = new ChromaClient({
      path: process.env.CHROMA_SERVER_URL
    });

    // Test connection
    await client.heartbeat();
    console.log('✅ ChromaDB connection successful!');

    // Test collection creation
    const collection = await client.createCollection({
      name: 'test-collection'
    });
    console.log('✅ Collection created:', collection.name);

    // Test document insertion
    await collection.add({
      ids: ['test-1'],
      documents: ['This is a test document'],
      metadatas: [{ source: 'test' }]
    });
    console.log('✅ Document added successfully');

    // Test query
    const results = await collection.query({
      queryTexts: ['test document'],
      nResults: 1
    });
    console.log('✅ Query successful:', results);

    // Cleanup
    await client.deleteCollection('test-collection');
    console.log('✅ Test collection cleaned up');

  } catch (error) {
    console.error('❌ ChromaDB test failed:', error);
  }
}

testChromaDB();
```

### **5.3 Load Test**
```javascript
// Simple load test
async function loadTest() {
  const client = new ChromaClient({
    path: process.env.CHROMA_SERVER_URL
  });

  const collection = await client.createCollection({
    name: 'load-test'
  });

  console.time('Load Test');
  
  // Insert 100 documents
  const ids = Array.from({length: 100}, (_, i) => `doc-${i}`);
  const documents = Array.from({length: 100}, (_, i) => `Test document ${i}`);
  const metadatas = Array.from({length: 100}, (_, i) => ({index: i}));

  await collection.add({
    ids,
    documents,
    metadatas
  });

  console.timeEnd('Load Test');
  console.log('✅ Load test completed');

  // Cleanup
  await client.deleteCollection('load-test');
}
```

---

## 📊 **Step 6: Monitoring & Optimization**

### **6.1 Railway Monitoring**
Railway provides built-in monitoring:
- **CPU Usage**: Monitor in Railway dashboard
- **Memory Usage**: Track RAM consumption
- **Network**: Monitor incoming/outgoing traffic
- **Logs**: View real-time application logs

### **6.2 Performance Optimization**
```yaml
# Optimize for production workload
resources:
  memory: 1GB    # Start with 1GB, scale as needed
  cpu: 1         # 1 vCPU
  
volume:
  size: 2GB      # 2GB for vector storage
  
# Scale triggers
auto_scaling:
  cpu_threshold: 80%
  memory_threshold: 85%
```

### **6.3 Backup Strategy**
```bash
# Create backup script
#!/bin/bash
# railway-chromadb-backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="chromadb-backups"

# Create backup directory
mkdir -p $BACKUP_DIR

# Export collections (via API)
curl -X GET "https://your-railway-app.up.railway.app/api/v1/collections" \
  -o "$BACKUP_DIR/collections_$DATE.json"

echo "✅ Backup completed: $BACKUP_DIR/collections_$DATE.json"
```

---

## 💰 **Cost Optimization**

### **Railway Pricing:**
- **Hobby Plan**: $5/month
  - 512MB RAM, 1GB storage
  - Good for development/small production
  
- **Pro Plan**: $20/month
  - 8GB RAM, 100GB storage
  - Better for production workloads

### **Tips to Minimize Costs:**
1. **Start small**: Begin with Hobby plan
2. **Monitor usage**: Use Railway's metrics
3. **Optimize queries**: Reduce compute time
4. **Clean up old data**: Implement retention policies
5. **Use compression**: Enable ChromaDB compression

---

## 🚨 **Troubleshooting**

### **Common Issues:**

**Deployment Fails:**
```bash
# Check Railway logs
railway logs

# Common issues:
# - Port configuration
# - Environment variables
# - Volume mount permissions
```

**Connection Timeout:**
```bash
# Check service URL
railway status

# Verify environment variables
railway variables

# Test from Railway shell
railway shell
curl localhost:8000/api/v1/heartbeat
```

**Data Persistence Issues:**
```bash
# Verify volume is mounted
railway volume list

# Check data directory
railway shell
ls -la /data
```

---

## 📋 **Deployment Checklist**

- [ ] ✅ Railway account created
- [ ] ✅ ChromaDB service deployed
- [ ] ✅ Environment variables configured
- [ ] ✅ Volume for persistence attached
- [ ] ✅ Service URL obtained
- [ ] ✅ Health check passes
- [ ] ✅ Basic operations tested
- [ ] ✅ VIEAgent connection configured
- [ ] ✅ Monitoring enabled
- [ ] ✅ Backup strategy implemented

---

## 🎯 **Next Steps**

After successful ChromaDB deployment:
1. ✅ Update deployment plan status
2. 🔄 Configure Upstash Redis for caching
3. 📧 Setup email service (Resend)
4. 🔑 Verify AI API keys
5. 🚀 Deploy to Vercel

---

**ChromaDB Production Deployment Complete!** 🎉
**Your vector database is now running on Railway with persistent storage.** 