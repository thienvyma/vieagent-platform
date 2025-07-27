#!/usr/bin/env python3
"""
Simple ChromaDB Server Startup Script
"""

import os
import sys
from pathlib import Path

def main():
    print("🚀 Starting ChromaDB Server...")
    print("=" * 40)
    
    # Create data directory
    data_dir = Path("./chromadb_data")
    data_dir.mkdir(exist_ok=True)
    
    # Set environment variables
    os.environ['CHROMA_SERVER_CORS_ALLOW_ORIGINS'] = '*'
    os.environ['ANONYMIZED_TELEMETRY'] = 'false'
    
    print(f"📁 Data directory: {data_dir.absolute()}")
    print("🌐 Server URL: http://localhost:8000")
    print("🔐 CORS enabled for all origins")
    print("📡 Telemetry disabled")
    print("\n🔄 Starting server... (Press Ctrl+C to stop)")
    print("=" * 40)
    
    try:
        # Import and run ChromaDB server
        import chromadb
        print(f"✅ ChromaDB version: {chromadb.__version__}")
        
        # Run the server
        os.system(f'python -m chromadb.cli.cli run --host localhost --port 8000 --path "{data_dir.absolute()}"')
        
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except ImportError:
        print("❌ ChromaDB not installed. Please run: pip install chromadb")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 