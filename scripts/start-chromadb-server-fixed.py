#!/usr/bin/env python3
"""
🔧 ChromaDB Server Startup Script - FIXED Version
==================================================
Fixes CORS configuration issues with environment variables
"""

import os
import sys
import subprocess
import time
import signal
import platform
from pathlib import Path

def check_python_version():
    """Check if Python version is compatible"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 3.8+ required")
        return False
    print(f"✅ Python version OK: {version.major}.{version.minor}.{version.micro}")
    return True

def check_chromadb_installation():
    """Check if ChromaDB is installed"""
    try:
        import chromadb
        print(f"✅ ChromaDB installed: {chromadb.__version__}")
        return True
    except ImportError:
        print("❌ ChromaDB not installed. Run: pip install chromadb")
        return False

def check_data_directory():
    """Check if data directory exists"""
    data_dir = Path("./chromadb_data")
    if data_dir.exists():
        print(f"✅ Data directory exists: {data_dir}")
        return True
    else:
        print(f"📁 Creating data directory: {data_dir}")
        data_dir.mkdir(parents=True, exist_ok=True)
        return True

def check_port_availability(port=8000):
    """Check if port is available"""
    import socket
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        result = sock.connect_ex(('localhost', port))
        sock.close()
        if result == 0:
            print(f"⚠️ Port {port} is in use")
            return False
        else:
            print(f"✅ Port {port} is available")
            return True
    except Exception as e:
        print(f"❌ Port check failed: {e}")
        return False

def setup_environment():
    """Setup proper environment variables for ChromaDB"""
    # Fix CORS configuration - use proper JSON array format
    os.environ['CHROMA_SERVER_CORS_ALLOW_ORIGINS'] = '["*"]'
    os.environ['CHROMA_SERVER_HOST'] = 'localhost'
    os.environ['CHROMA_SERVER_HTTP_PORT'] = '8000'
    os.environ['CHROMA_SERVER_GRPC_PORT'] = '8001'
    os.environ['CHROMA_SERVER_AUTHN_CREDENTIALS_FILE'] = ''
    os.environ['CHROMA_SERVER_AUTHN_PROVIDER'] = ''
    
    print("✅ Environment variables configured:")
    print(f"   CORS Origins: {os.environ.get('CHROMA_SERVER_CORS_ALLOW_ORIGINS')}")
    print(f"   Host: {os.environ.get('CHROMA_SERVER_HOST')}")
    print(f"   HTTP Port: {os.environ.get('CHROMA_SERVER_HTTP_PORT')}")

def start_chromadb_server():
    """Start ChromaDB server with proper configuration"""
    print("\n🚀 Starting ChromaDB server...")
    print("   Host: localhost")
    print("   Port: 8000")
    print("   Data: ./chromadb_data")
    print("   Log:  ./chromadb_data/server.log")
    
    # Ensure log directory exists
    log_dir = Path("./chromadb_data")
    log_dir.mkdir(parents=True, exist_ok=True)
    
    # Command to start ChromaDB
    cmd = [
        sys.executable, '-m', 'chromadb.cli.cli', 'run',
        '--host', 'localhost',
        '--port', '8000',
        '--path', './chromadb_data'
    ]
    
    print(f"📋 Command: {' '.join(cmd)}")
    
    try:
        # Start process with proper error handling
        with open('./chromadb_data/server.log', 'w') as log_file:
            process = subprocess.Popen(
                cmd,
                stdout=log_file,
                stderr=subprocess.STDOUT,
                env=os.environ.copy()
            )
        
        print(f"✅ ChromaDB server started with PID: {process.pid}")
        print(f"📁 Server logs: ./chromadb_data/server.log")
        
        # Wait a moment to check if process starts successfully
        time.sleep(3)
        
        if process.poll() is None:
            print("✅ Server is running successfully!")
            print("\n🌐 Access ChromaDB at: http://localhost:8000")
            print("📊 Health check: http://localhost:8000/api/v1/heartbeat")
            print("\n⏹️ Press Ctrl+C to stop the server")
            
            # Keep process running and handle graceful shutdown
            try:
                process.wait()
            except KeyboardInterrupt:
                print("\n🛑 Stopping ChromaDB server...")
                process.terminate()
                process.wait()
                print("✅ Server stopped gracefully")
                
        else:
            return_code = process.poll()
            print(f"❌ Server process terminated with code: {return_code}")
            print(f"📁 Check logs: ./chromadb_data/server.log")
            return False
            
    except Exception as e:
        print(f"❌ Failed to start ChromaDB server: {e}")
        return False
    
    return True

def main():
    """Main function"""
    print("🔍 ChromaDB Server Startup Check - FIXED VERSION")
    print("=" * 50)
    
    # Pre-flight checks
    if not check_python_version():
        sys.exit(1)
    
    if not check_chromadb_installation():
        sys.exit(1)
    
    if not check_data_directory():
        sys.exit(1)
    
    if not check_port_availability():
        print("⚠️ Port 8000 is in use. Stop existing ChromaDB or change port.")
        sys.exit(1)
    
    # Setup environment
    setup_environment()
    
    # Start server
    if not start_chromadb_server():
        print("❌ Failed to start ChromaDB server")
        sys.exit(1)

if __name__ == "__main__":
    main() 