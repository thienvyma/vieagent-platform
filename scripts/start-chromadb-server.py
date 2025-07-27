#!/usr/bin/env python3
"""
🚀 ChromaDB Server Startup Script
Start ChromaDB server for AI Agent Platform
"""

import subprocess
import sys
import os
import time
import requests
from pathlib import Path

# Configuration
CHROMADB_HOST = "localhost"
CHROMADB_PORT = 8000
CHROMADB_DATA_PATH = "./chromadb_data"
CHROMADB_LOG_PATH = "./chromadb_data/server.log"

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print("❌ ChromaDB requires Python 3.8 or higher")
        print(f"   Current version: {sys.version}")
        return False
    print(f"✅ Python version OK: {sys.version.split()[0]}")
    return True

def check_chromadb_installed():
    """Check if ChromaDB is installed"""
    try:
        import chromadb
        print(f"✅ ChromaDB installed: {chromadb.__version__}")
        return True
    except ImportError:
        print("❌ ChromaDB not installed")
        print("   Run: pip install chromadb")
        return False

def create_data_directory():
    """Create ChromaDB data directory if not exists"""
    data_path = Path(CHROMADB_DATA_PATH)
    if not data_path.exists():
        data_path.mkdir(parents=True, exist_ok=True)
        print(f"✅ Created data directory: {CHROMADB_DATA_PATH}")
    else:
        print(f"✅ Data directory exists: {CHROMADB_DATA_PATH}")
    return True

def check_port_available():
    """Check if port is available"""
    try:
        response = requests.get(f"http://{CHROMADB_HOST}:{CHROMADB_PORT}/api/v1/heartbeat", timeout=3)
        if response.status_code == 200:
            print(f"⚠️ ChromaDB server already running on {CHROMADB_HOST}:{CHROMADB_PORT}")
            return False
    except requests.exceptions.RequestException:
        print(f"✅ Port {CHROMADB_PORT} is available")
        return True
    return True

def start_chromadb_server():
    """Start ChromaDB server"""
    print(f"🚀 Starting ChromaDB server...")
    print(f"   Host: {CHROMADB_HOST}")
    print(f"   Port: {CHROMADB_PORT}")
    print(f"   Data: {CHROMADB_DATA_PATH}")
    print(f"   Log:  {CHROMADB_LOG_PATH}")
    
    # Prepare environment
    env = os.environ.copy()
    env["CHROMA_SERVER_HOST"] = CHROMADB_HOST
    env["CHROMA_SERVER_HTTP_PORT"] = str(CHROMADB_PORT)
    env["CHROMA_SERVER_CORS_ALLOW_ORIGINS"] = "http://localhost:3000,http://127.0.0.1:3000"
    
    # Start server command
    cmd = [
        sys.executable, "-m", "chromadb.cli.cli",
        "run",
        "--host", CHROMADB_HOST,
        "--port", str(CHROMADB_PORT),
        "--path", CHROMADB_DATA_PATH,
        "--log-config-path", None
    ]
    
    # Remove None values
    cmd = [x for x in cmd if x is not None]
    
    try:
        print(f"📋 Command: {' '.join(cmd)}")
        
        # Open log file
        with open(CHROMADB_LOG_PATH, "w") as log_file:
            log_file.write(f"ChromaDB Server Log - {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
            log_file.write(f"Command: {' '.join(cmd)}\n")
            log_file.write("=" * 50 + "\n")
            log_file.flush()
            
            # Start process
            process = subprocess.Popen(
                cmd,
                stdout=log_file,
                stderr=subprocess.STDOUT,
                env=env,
                cwd=os.getcwd()
            )
            
            print(f"✅ ChromaDB server started with PID: {process.pid}")
            print(f"📁 Server logs: {CHROMADB_LOG_PATH}")
            
            # Wait a bit and check if server started successfully
            time.sleep(3)
            
            if process.poll() is None:
                print("✅ Server process is running")
                
                # Test connection
                for attempt in range(5):
                    try:
                        response = requests.get(f"http://{CHROMADB_HOST}:{CHROMADB_PORT}/api/v1/heartbeat", timeout=2)
                        if response.status_code == 200:
                            print(f"✅ Server is responding on http://{CHROMADB_HOST}:{CHROMADB_PORT}")
                            print(f"✅ Heartbeat: {response.json()}")
                            return True
                    except requests.exceptions.RequestException as e:
                        print(f"⏳ Waiting for server to start... (attempt {attempt + 1}/5)")
                        time.sleep(2)
                
                print("⚠️ Server started but not responding to heartbeat")
                return False
            else:
                print(f"❌ Server process terminated with code: {process.returncode}")
                return False
                
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        return False

def show_connection_info():
    """Show connection information"""
    print("\n" + "=" * 60)
    print("🎉 CHROMADB SERVER READY!")
    print("=" * 60)
    print(f"🌐 Server URL: http://{CHROMADB_HOST}:{CHROMADB_PORT}")
    print(f"📁 Data Path: {CHROMADB_DATA_PATH}")
    print(f"📋 Log File: {CHROMADB_LOG_PATH}")
    print("")
    print("🔧 Connection Settings for .env:")
    print(f"CHROMADB_HOST={CHROMADB_HOST}")
    print(f"CHROMADB_PORT={CHROMADB_PORT}")
    print("")
    print("🧪 Test Connection:")
    print(f"curl http://{CHROMADB_HOST}:{CHROMADB_PORT}/api/v1/heartbeat")
    print("")
    print("🛑 To stop server: Ctrl+C or close this terminal")
    print("=" * 60)

def main():
    """Main function"""
    print("🔍 ChromaDB Server Startup Check")
    print("=" * 50)
    
    # Pre-flight checks
    if not check_python_version():
        return False
    
    if not check_chromadb_installed():
        return False
    
    if not create_data_directory():
        return False
    
    if not check_port_available():
        print("💡 Server may already be running. Check manually or use different port.")
        return False
    
    # Start server
    if start_chromadb_server():
        show_connection_info()
        
        try:
            print("\n⏳ Server is running... Press Ctrl+C to stop")
            # Keep the script running
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n🛑 Stopping ChromaDB server...")
            return True
    else:
        print("❌ Failed to start ChromaDB server")
        print(f"📁 Check logs: {CHROMADB_LOG_PATH}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 