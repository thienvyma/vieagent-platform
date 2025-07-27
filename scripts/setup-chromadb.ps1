# 🔧 CHROMADB SETUP SCRIPT (Windows)
# Setup ChromaDB cho AI Agent Platform

Write-Host "🚀 Setting up ChromaDB..." -ForegroundColor Blue

# Check if Python is installed
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Python is not installed. Please install Python 3.8+ first." -ForegroundColor Red
    Write-Host "📥 Download from: https://www.python.org/downloads/" -ForegroundColor Yellow
    exit 1
}

# Check Python version
$pythonVersion = python --version
Write-Host "✅ Found Python: $pythonVersion" -ForegroundColor Green

# Install ChromaDB via pip
Write-Host "📦 Installing ChromaDB..." -ForegroundColor Blue
try {
    python -m pip install chromadb
    Write-Host "✅ ChromaDB installed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install ChromaDB" -ForegroundColor Red
    exit 1
}

# Create ChromaDB directory
if (-not (Test-Path "chromadb")) {
    New-Item -ItemType Directory -Path "chromadb" -Force
    Write-Host "📁 Created ChromaDB directory" -ForegroundColor Green
}

# Create ChromaDB startup script
@"
import chromadb
from chromadb.config import Settings
import os

# Create ChromaDB client
client = chromadb.PersistentClient(
    path="./chromadb/data",
    settings=Settings(
        chroma_server_host="localhost",
        chroma_server_http_port=8000,
        chroma_server_grpc_port=8001,
        allow_reset=True,
        is_persistent=True
    )
)

print("🚀 ChromaDB started successfully!")
print("📍 HTTP Server: http://localhost:8000")
print("📍 Data Path: ./chromadb/data")
print("📍 Collections:", len(client.list_collections()))

# Create default collection if not exists
try:
    collection = client.get_collection("ai-agent-documents")
    print(f"✅ Found existing collection: {collection.name}")
except:
    collection = client.create_collection("ai-agent-documents")
    print(f"✅ Created new collection: {collection.name}")

# Keep server running
print("🔄 ChromaDB server is running... Press Ctrl+C to stop")
try:
    import time
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("\n⏹️  ChromaDB server stopped")
"@ | Out-File -FilePath "chromadb/start_server.py" -Encoding utf8

# Create ChromaDB test script
@"
import chromadb
import requests
import json

def test_chromadb():
    print("🧪 Testing ChromaDB connection...")
    
    try:
        # Test HTTP endpoint
        response = requests.get("http://localhost:8000/api/v1/heartbeat")
        if response.status_code == 200:
            print("✅ ChromaDB HTTP server is running")
        else:
            print("❌ ChromaDB HTTP server not responding")
            return False
    except:
        print("❌ Cannot connect to ChromaDB HTTP server")
        return False
    
    try:
        # Test client connection
        client = chromadb.HttpClient(host="localhost", port=8000)
        
        # List collections
        collections = client.list_collections()
        print(f"📚 Found {len(collections)} collections")
        
        # Test collection operations
        collection_name = "test-collection"
        try:
            collection = client.get_collection(collection_name)
            print(f"✅ Found existing collection: {collection_name}")
        except:
            collection = client.create_collection(collection_name)
            print(f"✅ Created new collection: {collection_name}")
        
        # Test add document
        collection.add(
            documents=["This is a test document"],
            metadatas=[{"source": "test"}],
            ids=["test-doc-1"]
        )
        print("✅ Added test document")
        
        # Test query
        results = collection.query(
            query_texts=["test document"],
            n_results=1
        )
        print(f"✅ Query successful: {len(results['documents'][0])} results")
        
        # Cleanup
        client.delete_collection(collection_name)
        print("✅ Cleaned up test collection")
        
        print("🎉 ChromaDB is working correctly!")
        return True
        
    except Exception as e:
        print(f"❌ ChromaDB test failed: {e}")
        return False

if __name__ == "__main__":
    test_chromadb()
"@ | Out-File -FilePath "chromadb/test_chromadb.py" -Encoding utf8

# Create ChromaDB configuration for Next.js
@"
// ChromaDB Configuration for Next.js
const { ChromaApi, Configuration } = require('chromadb');

const chromaConfig = {
  // Local ChromaDB (for development)
  local: {
    host: 'localhost',
    port: 8000,
    protocol: 'http'
  },
  
  // Cloud ChromaDB (for production)
  cloud: {
    host: process.env.CHROMADB_HOST || 'your-chromadb-cloud-host',
    port: process.env.CHROMADB_PORT || 443,
    protocol: 'https',
    auth: {
      token: process.env.CHROMADB_AUTH_TOKEN
    }
  }
};

// Create ChromaDB client
function createChromaClient() {
  const isProduction = process.env.NODE_ENV === 'production';
  const config = isProduction ? chromaConfig.cloud : chromaConfig.local;
  
  return new ChromaApi(new Configuration({
    basePath: `${config.protocol}://${config.host}:${config.port}`,
    apiKey: config.auth?.token
  }));
}

module.exports = {
  chromaConfig,
  createChromaClient
};
"@ | Out-File -FilePath "lib/chromadb.js" -Encoding utf8

# Create startup scripts
@"
# Start ChromaDB Server
Write-Host "🚀 Starting ChromaDB server..." -ForegroundColor Blue
cd chromadb
python start_server.py
"@ | Out-File -FilePath "scripts/start-chromadb.ps1" -Encoding utf8

@"
# Test ChromaDB
Write-Host "🧪 Testing ChromaDB..." -ForegroundColor Blue
cd chromadb
python test_chromadb.py
"@ | Out-File -FilePath "scripts/test-chromadb.ps1" -Encoding utf8

# Update environment variables
$envContent = @"

# =============================================================================
# CHROMADB CONFIGURATION
# =============================================================================
# Local ChromaDB (Development)
CHROMADB_HOST=localhost
CHROMADB_PORT=8000
CHROMADB_PROTOCOL=http

# Cloud ChromaDB (Production - Optional)
# CHROMADB_CLOUD_HOST=your-chromadb-cloud-host
# CHROMADB_AUTH_TOKEN=your-auth-token

# ChromaDB Settings
CHROMADB_COLLECTION_NAME=ai-agent-documents
CHROMADB_PERSIST_DIRECTORY=./chromadb/data
"@

if (Test-Path ".env.local") {
    Add-Content -Path ".env.local" -Value $envContent
} else {
    $envContent | Out-File -FilePath ".env.local" -Encoding utf8
}

Write-Host ""
Write-Host "✅ ChromaDB setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 Next Steps:" -ForegroundColor Blue
Write-Host "1. Start ChromaDB server: .\scripts\start-chromadb.ps1" -ForegroundColor Gray
Write-Host "2. Test ChromaDB: .\scripts\test-chromadb.ps1" -ForegroundColor Gray
Write-Host "3. Update your .env.local with ChromaDB settings" -ForegroundColor Gray
Write-Host ""
Write-Host "📊 ChromaDB Dashboard: http://localhost:8000" -ForegroundColor Blue
Write-Host "📁 Data Directory: ./chromadb/data" -ForegroundColor Blue
Write-Host "🔧 Configuration: lib/chromadb.js" -ForegroundColor Blue
Write-Host ""
Write-Host "🚨 Important: Keep the ChromaDB server running for the application to work!" -ForegroundColor Yellow 