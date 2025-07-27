#!/bin/bash

# =============================================================================
# ChromaDB Production Setup Script
# =============================================================================
# This script sets up ChromaDB for production deployment
# Supports Docker, Cloud Run, and Local installation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
CHROMADB_VERSION="0.4.18"
CHROMADB_PORT="8000"
CHROMADB_HOST="0.0.0.0"
CHROMADB_DATA_DIR="/var/lib/chromadb"
CHROMADB_AUTH_TOKEN=""
DEPLOYMENT_TYPE="docker"

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -t, --type TYPE        Deployment type: docker, cloud-run, local (default: docker)"
    echo "  -p, --port PORT        Port to run ChromaDB (default: 8000)"
    echo "  -d, --data-dir DIR     Data directory (default: /var/lib/chromadb)"
    echo "  -a, --auth-token TOKEN Authentication token"
    echo "  -v, --version VERSION  ChromaDB version (default: 0.4.18)"
    echo "  -h, --help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --type docker --port 8000"
    echo "  $0 --type cloud-run --auth-token your-token"
    echo "  $0 --type local --data-dir /home/user/chromadb"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--type)
            DEPLOYMENT_TYPE="$2"
            shift 2
            ;;
        -p|--port)
            CHROMADB_PORT="$2"
            shift 2
            ;;
        -d|--data-dir)
            CHROMADB_DATA_DIR="$2"
            shift 2
            ;;
        -a|--auth-token)
            CHROMADB_AUTH_TOKEN="$2"
            shift 2
            ;;
        -v|--version)
            CHROMADB_VERSION="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate deployment type
if [[ ! "$DEPLOYMENT_TYPE" =~ ^(docker|cloud-run|local)$ ]]; then
    print_error "Invalid deployment type: $DEPLOYMENT_TYPE"
    print_error "Valid types: docker, cloud-run, local"
    exit 1
fi

print_info "Setting up ChromaDB for $DEPLOYMENT_TYPE deployment..."

# Function to setup Docker deployment
setup_docker() {
    print_info "Setting up ChromaDB with Docker..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Create data directory
    print_info "Creating data directory: $CHROMADB_DATA_DIR"
    sudo mkdir -p "$CHROMADB_DATA_DIR"
    sudo chmod 755 "$CHROMADB_DATA_DIR"
    
    # Create docker-compose.yml
    cat > docker-compose.chromadb.yml << EOF
version: '3.8'

services:
  chromadb:
    image: chromadb/chroma:${CHROMADB_VERSION}
    container_name: chromadb-production
    ports:
      - "${CHROMADB_PORT}:8000"
    volumes:
      - ${CHROMADB_DATA_DIR}:/chroma/chroma
    environment:
      - CHROMA_SERVER_HOST=${CHROMADB_HOST}
      - CHROMA_SERVER_HTTP_PORT=8000
      - CHROMA_SERVER_AUTH_PROVIDER=chromadb.auth.token.TokenAuthServerProvider
      - CHROMA_SERVER_AUTH_TOKEN_TRANSPORT_HEADER=X-Chroma-Token
      - CHROMA_SERVER_AUTH_CREDENTIALS=${CHROMADB_AUTH_TOKEN}
      - CHROMA_SERVER_AUTH_PROVIDER_CREDENTIALS=${CHROMADB_AUTH_TOKEN}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/v1/heartbeat"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Optional: Add nginx reverse proxy
  nginx:
    image: nginx:alpine
    container_name: chromadb-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - chromadb
    restart: unless-stopped
EOF
    
    # Create nginx configuration
    cat > nginx.conf << EOF
events {
    worker_connections 1024;
}

http {
    upstream chromadb {
        server chromadb:8000;
    }

    server {
        listen 80;
        server_name your-domain.com;
        
        location / {
            proxy_pass http://chromadb;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
    }
}
EOF
    
    # Start ChromaDB
    print_info "Starting ChromaDB container..."
    docker-compose -f docker-compose.chromadb.yml up -d
    
    # Wait for ChromaDB to be ready
    print_info "Waiting for ChromaDB to be ready..."
    sleep 10
    
    # Test connection
    if curl -f "http://localhost:${CHROMADB_PORT}/api/v1/heartbeat" > /dev/null 2>&1; then
        print_success "ChromaDB is running successfully!"
        print_info "ChromaDB URL: http://localhost:${CHROMADB_PORT}"
    else
        print_error "ChromaDB failed to start properly"
        exit 1
    fi
}

# Function to setup Cloud Run deployment
setup_cloud_run() {
    print_info "Setting up ChromaDB for Google Cloud Run..."
    
    # Check if gcloud is installed
    if ! command -v gcloud &> /dev/null; then
        print_error "gcloud CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Create Dockerfile for Cloud Run
    cat > Dockerfile.chromadb << EOF
FROM chromadb/chroma:${CHROMADB_VERSION}

# Set environment variables
ENV CHROMA_SERVER_HOST=0.0.0.0
ENV CHROMA_SERVER_HTTP_PORT=8000
ENV CHROMA_SERVER_AUTH_PROVIDER=chromadb.auth.token.TokenAuthServerProvider
ENV CHROMA_SERVER_AUTH_TOKEN_TRANSPORT_HEADER=X-Chroma-Token
ENV CHROMA_SERVER_AUTH_CREDENTIALS=${CHROMADB_AUTH_TOKEN}
ENV CHROMA_SERVER_AUTH_PROVIDER_CREDENTIALS=${CHROMADB_AUTH_TOKEN}

EXPOSE 8000

CMD ["chroma", "run", "--host", "0.0.0.0", "--port", "8000"]
EOF
    
    # Create cloudbuild.yaml
    cat > cloudbuild.yaml << EOF
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-f', 'Dockerfile.chromadb', '-t', 'gcr.io/\$PROJECT_ID/chromadb:latest', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/\$PROJECT_ID/chromadb:latest']
  - name: 'gcr.io/cloud-builders/gcloud'
    args: [
      'run', 'deploy', 'chromadb-production',
      '--image', 'gcr.io/\$PROJECT_ID/chromadb:latest',
      '--platform', 'managed',
      '--region', 'us-central1',
      '--port', '8000',
      '--memory', '2Gi',
      '--cpu', '2',
      '--min-instances', '1',
      '--max-instances', '10',
      '--allow-unauthenticated'
    ]
EOF
    
    print_info "Cloud Run setup files created."
    print_info "To deploy, run: gcloud builds submit --config cloudbuild.yaml"
    print_warning "Don't forget to set up persistent storage for production data!"
}

# Function to setup local deployment
setup_local() {
    print_info "Setting up ChromaDB locally..."
    
    # Check if Python is installed
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed. Please install Python 3 first."
        exit 1
    fi
    
    # Create virtual environment
    print_info "Creating virtual environment..."
    python3 -m venv chromadb-env
    source chromadb-env/bin/activate
    
    # Install ChromaDB
    print_info "Installing ChromaDB..."
    pip install chromadb==$CHROMADB_VERSION
    
    # Create data directory
    print_info "Creating data directory: $CHROMADB_DATA_DIR"
    mkdir -p "$CHROMADB_DATA_DIR"
    
    # Create startup script
    cat > start-chromadb.sh << EOF
#!/bin/bash
export CHROMA_SERVER_HOST=${CHROMADB_HOST}
export CHROMA_SERVER_HTTP_PORT=${CHROMADB_PORT}
export CHROMA_SERVER_AUTH_PROVIDER=chromadb.auth.token.TokenAuthServerProvider
export CHROMA_SERVER_AUTH_TOKEN_TRANSPORT_HEADER=X-Chroma-Token
export CHROMA_SERVER_AUTH_CREDENTIALS=${CHROMADB_AUTH_TOKEN}
export CHROMA_SERVER_AUTH_PROVIDER_CREDENTIALS=${CHROMADB_AUTH_TOKEN}

cd "$(dirname "\$0")"
source chromadb-env/bin/activate
chroma run --host ${CHROMADB_HOST} --port ${CHROMADB_PORT} --path ${CHROMADB_DATA_DIR}
EOF
    
    chmod +x start-chromadb.sh
    
    # Create systemd service file
    cat > chromadb.service << EOF
[Unit]
Description=ChromaDB Vector Database
After=network.target

[Service]
Type=simple
User=chromadb
Group=chromadb
WorkingDirectory=$(pwd)
ExecStart=$(pwd)/start-chromadb.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
    
    print_info "Local setup completed."
    print_info "To start ChromaDB, run: ./start-chromadb.sh"
    print_info "To install as system service, copy chromadb.service to /etc/systemd/system/"
}

# Function to create environment configuration
create_env_config() {
    print_info "Creating environment configuration..."
    
    cat > .env.chromadb << EOF
# ChromaDB Configuration
CHROMADB_HOST=localhost
CHROMADB_PORT=${CHROMADB_PORT}
CHROMADB_SERVER_SSL=false
CHROMADB_PERSIST_DIRECTORY=${CHROMADB_DATA_DIR}
CHROMADB_AUTH_TOKEN=${CHROMADB_AUTH_TOKEN}
CHROMADB_URL=http://localhost:${CHROMADB_PORT}
EOF
    
    print_success "Environment configuration created: .env.chromadb"
}

# Function to test ChromaDB connection
test_connection() {
    print_info "Testing ChromaDB connection..."
    
    # Create test script
    cat > test-chromadb.py << EOF
import chromadb
import sys
import os
from chromadb.config import Settings

try:
    # Configure client
    client = chromadb.HttpClient(
        host="localhost",
        port=${CHROMADB_PORT},
        settings=Settings(
            chroma_client_auth_provider="chromadb.auth.token.TokenAuthClientProvider",
            chroma_client_auth_credentials="${CHROMADB_AUTH_TOKEN}"
        ) if "${CHROMADB_AUTH_TOKEN}" else None
    )
    
    # Test connection
    heartbeat = client.heartbeat()
    print(f"✅ ChromaDB connection successful! Heartbeat: {heartbeat}")
    
    # Test collection creation
    collection = client.create_collection("test_collection")
    print("✅ Collection creation successful!")
    
    # Test data operations
    collection.add(
        documents=["This is a test document"],
        metadatas=[{"source": "test"}],
        ids=["test1"]
    )
    print("✅ Data insertion successful!")
    
    # Test query
    results = collection.query(
        query_texts=["test document"],
        n_results=1
    )
    print(f"✅ Query successful! Results: {len(results['documents'][0])}")
    
    # Cleanup
    client.delete_collection("test_collection")
    print("✅ Cleanup successful!")
    
    print("\n🎉 ChromaDB is working perfectly!")
    
except Exception as e:
    print(f"❌ ChromaDB connection failed: {e}")
    sys.exit(1)
EOF
    
    # Run test if Python is available
    if command -v python3 &> /dev/null; then
        python3 test-chromadb.py
    else
        print_warning "Python 3 not available. Test script created: test-chromadb.py"
    fi
}

# Main execution
main() {
    print_info "ChromaDB Production Setup"
    print_info "========================"
    print_info "Deployment type: $DEPLOYMENT_TYPE"
    print_info "Port: $CHROMADB_PORT"
    print_info "Data directory: $CHROMADB_DATA_DIR"
    print_info "Version: $CHROMADB_VERSION"
    
    if [[ -n "$CHROMADB_AUTH_TOKEN" ]]; then
        print_info "Authentication: Enabled"
    else
        print_warning "Authentication: Disabled (not recommended for production)"
    fi
    
    echo ""
    
    # Setup based on deployment type
    case $DEPLOYMENT_TYPE in
        docker)
            setup_docker
            ;;
        cloud-run)
            setup_cloud_run
            ;;
        local)
            setup_local
            ;;
    esac
    
    # Create environment configuration
    create_env_config
    
    # Test connection for docker and local
    if [[ "$DEPLOYMENT_TYPE" != "cloud-run" ]]; then
        sleep 5
        test_connection
    fi
    
    print_success "ChromaDB setup completed successfully!"
    print_info ""
    print_info "Next steps:"
    print_info "1. Update your application's environment variables"
    print_info "2. Configure your firewall/security groups"
    print_info "3. Set up SSL certificates for production"
    print_info "4. Configure backup and monitoring"
    print_info "5. Test your application's connection to ChromaDB"
}

# Run main function
main 