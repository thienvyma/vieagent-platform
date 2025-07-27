#!/usr/bin/env python3
"""
🧪 ChromaDB Simple Embedded Server
Test ChromaDB in embedded mode instead of server mode
"""

import sys
import os
from pathlib import Path

def test_chromadb_embedded():
    """Test ChromaDB in embedded mode"""
    print("🔍 Testing ChromaDB Embedded Mode")
    print("=" * 50)
    
    try:
        # Import ChromaDB
        import chromadb
        print(f"✅ ChromaDB version: {chromadb.__version__}")
        
        # Create persistent client
        persist_directory = Path("./chromadb_data").absolute()
        persist_directory.mkdir(exist_ok=True)
        
        print(f"📁 Data directory: {persist_directory}")
        
        # Initialize embedded client with persistence
        client = chromadb.PersistentClient(path=str(persist_directory))
        print("✅ ChromaDB embedded client created")
        
        # Test basic operations
        print("\n🧪 Testing basic operations...")
        
        # Create or get collection
        collection_name = "test_collection"
        collection = client.get_or_create_collection(name=collection_name)
        print(f"✅ Collection '{collection_name}' ready")
        
        # Add test documents
        test_docs = [
            "This is a test document about AI agents",
            "ChromaDB is a vector database for embeddings",
            "Python is a great programming language"
        ]
        
        collection.add(
            documents=test_docs,
            ids=[f"doc_{i}" for i in range(len(test_docs))],
            metadatas=[{"source": "test", "index": i} for i in range(len(test_docs))]
        )
        print(f"✅ Added {len(test_docs)} test documents")
        
        # Test query
        results = collection.query(
            query_texts=["AI and machine learning"],
            n_results=2
        )
        print(f"✅ Query returned {len(results['documents'][0])} results")
        print(f"   Top result: {results['documents'][0][0][:50]}...")
        
        # Get collection count
        count = collection.count()
        print(f"✅ Collection contains {count} documents")
        
        print("\n🎉 ChromaDB embedded mode working successfully!")
        print("📝 This can be used as fallback for server mode")
        
        return True
        
    except ImportError as e:
        print(f"❌ ChromaDB not installed: {e}")
        print("💡 Run: pip install chromadb")
        return False
    except Exception as e:
        print(f"❌ ChromaDB test failed: {e}")
        return False

def test_server_availability():
    """Test if ChromaDB server is available"""
    print("\n🌐 Testing ChromaDB Server Availability")
    print("=" * 50)
    
    try:
        import requests
        response = requests.get("http://localhost:8000/api/v1/heartbeat", timeout=3)
        if response.status_code == 200:
            print("✅ ChromaDB server is running")
            print(f"✅ Heartbeat: {response.json()}")
            return True
        else:
            print(f"⚠️ Server responded with status: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Server not available: {e}")
        print("💡 Server mode not working, embedded mode recommended")
        return False

def main():
    """Main function"""
    print("🚀 ChromaDB Simple Test")
    print("=" * 50)
    
    # Test server first
    server_available = test_server_availability()
    
    # Test embedded mode
    embedded_working = test_chromadb_embedded()
    
    print("\n📊 SUMMARY")
    print("=" * 50)
    print(f"Server Mode: {'✅ Available' if server_available else '❌ Not Available'}")
    print(f"Embedded Mode: {'✅ Working' if embedded_working else '❌ Not Working'}")
    
    if embedded_working:
        print("\n💡 RECOMMENDATION:")
        print("   Use embedded mode for development")
        print("   Server mode can be setup later for production")
        return True
    else:
        print("\n❌ ChromaDB not functional")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 