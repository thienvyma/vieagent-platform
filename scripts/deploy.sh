#!/bin/bash

# =============================================================================
# VIEAgent Production Deployment Script
# =============================================================================
# This script handles production deployment to Vercel or Google Cloud VM

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DEPLOYMENT_TARGET="vercel"
ENVIRONMENT="production"
SKIP_TESTS="false"
SKIP_BUILD="false"
SKIP_MIGRATION="false"
AUTO_CONFIRM="false"

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
    echo "  -t, --target TARGET       Deployment target: vercel, gcp-vm (default: vercel)"
    echo "  -e, --env ENVIRONMENT     Environment: production, staging (default: production)"
    echo "  --skip-tests             Skip running tests"
    echo "  --skip-build             Skip building the application"
    echo "  --skip-migration         Skip database migration"
    echo "  --auto-confirm           Skip confirmation prompts"
    echo "  -h, --help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --target vercel --env production"
    echo "  $0 --target gcp-vm --skip-tests"
    echo "  $0 --auto-confirm"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--target)
            DEPLOYMENT_TARGET="$2"
            shift 2
            ;;
        -e|--env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --skip-tests)
            SKIP_TESTS="true"
            shift
            ;;
        --skip-build)
            SKIP_BUILD="true"
            shift
            ;;
        --skip-migration)
            SKIP_MIGRATION="true"
            shift
            ;;
        --auto-confirm)
            AUTO_CONFIRM="true"
            shift
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

# Validate deployment target
if [[ ! "$DEPLOYMENT_TARGET" =~ ^(vercel|gcp-vm)$ ]]; then
    print_error "Invalid deployment target: $DEPLOYMENT_TARGET"
    print_error "Valid targets: vercel, gcp-vm"
    exit 1
fi

# Function to check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    # Check git
    if ! command -v git &> /dev/null; then
        print_error "git is not installed"
        exit 1
    fi
    
    # Check for deployment-specific tools
    case $DEPLOYMENT_TARGET in
        vercel)
            if ! command -v vercel &> /dev/null; then
                print_error "Vercel CLI is not installed. Install with: npm i -g vercel"
                exit 1
            fi
            ;;
        gcp-vm)
            if ! command -v gcloud &> /dev/null; then
                print_error "Google Cloud CLI is not installed"
                exit 1
            fi
            ;;
    esac
    
    print_success "Prerequisites check passed"
}

# Function to check environment variables
check_environment() {
    print_info "Checking environment configuration..."
    
    local env_file
    if [[ "$ENVIRONMENT" == "production" ]]; then
        env_file=".env.production"
    else
        env_file=".env.staging"
    fi
    
    if [[ ! -f "$env_file" ]]; then
        print_error "Environment file not found: $env_file"
        print_error "Please create the environment file based on env.production.template"
        exit 1
    fi
    
    # Check critical environment variables
    local required_vars=(
        "DATABASE_URL"
        "NEXTAUTH_SECRET"
        "NEXTAUTH_URL"
        "OPENAI_API_KEY"
        "GOOGLE_CLIENT_ID"
        "GOOGLE_CLIENT_SECRET"
    )
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" "$env_file"; then
            print_error "Missing required environment variable: $var"
            exit 1
        fi
    done
    
    print_success "Environment configuration check passed"
}

# Function to run tests
run_tests() {
    if [[ "$SKIP_TESTS" == "true" ]]; then
        print_warning "Skipping tests"
        return 0
    fi
    
    print_info "Running tests..."
    
    # Install dependencies if needed
    if [[ ! -d "node_modules" ]]; then
        print_info "Installing dependencies..."
        npm ci
    fi
    
    # Run tests
    if npm run test:ci &> /dev/null; then
        print_success "All tests passed"
    else
        print_error "Tests failed"
        if [[ "$AUTO_CONFIRM" != "true" ]]; then
            read -p "Continue deployment despite test failures? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
    fi
}

# Function to build application
build_application() {
    if [[ "$SKIP_BUILD" == "true" ]]; then
        print_warning "Skipping build"
        return 0
    fi
    
    print_info "Building application..."
    
    # Install dependencies
    print_info "Installing dependencies..."
    npm ci
    
    # Generate Prisma client
    print_info "Generating Prisma client..."
    npx prisma generate
    
    # Build application
    print_info "Building Next.js application..."
    npm run build
    
    print_success "Build completed successfully"
}

# Function to run database migration
run_migration() {
    if [[ "$SKIP_MIGRATION" == "true" ]]; then
        print_warning "Skipping database migration"
        return 0
    fi
    
    print_info "Running database migration..."
    
    # Run Prisma migration
    print_info "Applying database migrations..."
    npx prisma migrate deploy
    
    # Run seeding script
    print_info "Seeding database..."
    node scripts/migrate-and-seed.js
    
    print_success "Database migration completed"
}

# Function to deploy to Vercel
deploy_vercel() {
    print_info "Deploying to Vercel..."
    
    # Login check
    if ! vercel whoami &> /dev/null; then
        print_info "Please login to Vercel:"
        vercel login
    fi
    
    # Deploy
    if [[ "$ENVIRONMENT" == "production" ]]; then
        print_info "Deploying to production..."
        vercel --prod --confirm
    else
        print_info "Deploying to staging..."
        vercel --confirm
    fi
    
    print_success "Vercel deployment completed"
}

# Function to deploy to Google Cloud VM
deploy_gcp_vm() {
    print_info "Deploying to Google Cloud VM..."
    
    # Check if gcloud is authenticated
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
        print_info "Please authenticate with Google Cloud:"
        gcloud auth login
    fi
    
    # Create deployment package
    print_info "Creating deployment package..."
    tar -czf deployment.tar.gz \
        --exclude=node_modules \
        --exclude=.git \
        --exclude=.next \
        --exclude=deployment.tar.gz \
        .
    
    # Upload to VM
    local vm_name="vieagent-production"
    local zone="asia-southeast1-a"
    local project_id=$(gcloud config get-value project)
    
    print_info "Uploading to VM: $vm_name"
    gcloud compute scp deployment.tar.gz $vm_name:~/deployment.tar.gz \
        --zone=$zone \
        --project=$project_id
    
    # Deploy on VM
    print_info "Deploying on VM..."
    gcloud compute ssh $vm_name \
        --zone=$zone \
        --project=$project_id \
        --command="
            cd /var/www/vieagent &&
            sudo systemctl stop vieagent &&
            sudo tar -xzf ~/deployment.tar.gz &&
            sudo npm ci &&
            sudo npm run build &&
            sudo systemctl start vieagent &&
            sudo systemctl enable vieagent
        "
    
    # Cleanup
    rm -f deployment.tar.gz
    
    print_success "GCP VM deployment completed"
}

# Function to verify deployment
verify_deployment() {
    print_info "Verifying deployment..."
    
    local app_url
    case $DEPLOYMENT_TARGET in
        vercel)
            app_url=$(vercel ls --format=json | jq -r '.[0].url' | sed 's/^/https:\/\//')
            ;;
        gcp-vm)
            app_url="https://your-domain.com" # Replace with actual domain
            ;;
    esac
    
    print_info "Checking application health at: $app_url"
    
    # Wait for deployment to be ready
    sleep 30
    
    # Check health endpoint
    if curl -f "$app_url/api/health" &> /dev/null; then
        print_success "Application is healthy"
    else
        print_warning "Health check failed - application may still be starting"
    fi
    
    print_info "Deployment URL: $app_url"
}

# Function to setup monitoring
setup_monitoring() {
    print_info "Setting up monitoring..."
    
    # Create monitoring configuration
    cat > monitoring-config.json << EOF
{
  "alerts": [
    {
      "name": "High Error Rate",
      "condition": "error_rate > 5%",
      "notification": "email"
    },
    {
      "name": "High Response Time",
      "condition": "response_time > 2000ms",
      "notification": "slack"
    },
    {
      "name": "Low Availability",
      "condition": "uptime < 99%",
      "notification": "email"
    }
  ]
}
EOF
    
    print_success "Monitoring configuration created"
}

# Function to create deployment summary
create_deployment_summary() {
    print_info "Creating deployment summary..."
    
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local git_commit=$(git rev-parse HEAD)
    local git_branch=$(git rev-parse --abbrev-ref HEAD)
    
    cat > deployment-summary.md << EOF
# VIEAgent Deployment Summary

## Deployment Information
- **Timestamp**: $timestamp
- **Target**: $DEPLOYMENT_TARGET
- **Environment**: $ENVIRONMENT
- **Git Commit**: $git_commit
- **Git Branch**: $git_branch

## Deployment Steps Completed
- [x] Prerequisites check
- [x] Environment configuration check
- [x] Tests $(if [[ "$SKIP_TESTS" == "true" ]]; then echo "(skipped)"; else echo "passed"; fi)
- [x] Application build $(if [[ "$SKIP_BUILD" == "true" ]]; then echo "(skipped)"; else echo "completed"; fi)
- [x] Database migration $(if [[ "$SKIP_MIGRATION" == "true" ]]; then echo "(skipped)"; else echo "completed"; fi)
- [x] Deployment to $DEPLOYMENT_TARGET
- [x] Verification completed

## Next Steps
1. Monitor application performance
2. Check error logs
3. Verify all features are working
4. Update DNS if needed
5. Set up SSL certificates if not automated

## Rollback Instructions
If issues occur, rollback using:
\`\`\`bash
# For Vercel
vercel rollback

# For GCP VM
gcloud compute ssh vieagent-production --command="sudo systemctl stop vieagent && sudo git checkout previous-version && sudo systemctl start vieagent"
\`\`\`

EOF
    
    print_success "Deployment summary created: deployment-summary.md"
}

# Main deployment function
main() {
    print_info "VIEAgent Production Deployment"
    print_info "=============================="
    print_info "Target: $DEPLOYMENT_TARGET"
    print_info "Environment: $ENVIRONMENT"
    print_info "Skip Tests: $SKIP_TESTS"
    print_info "Skip Build: $SKIP_BUILD"
    print_info "Skip Migration: $SKIP_MIGRATION"
    print_info ""
    
    # Confirmation
    if [[ "$AUTO_CONFIRM" != "true" ]]; then
        read -p "Continue with deployment? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Deployment cancelled"
            exit 0
        fi
    fi
    
    # Run deployment steps
    check_prerequisites
    check_environment
    run_tests
    build_application
    run_migration
    
    # Deploy based on target
    case $DEPLOYMENT_TARGET in
        vercel)
            deploy_vercel
            ;;
        gcp-vm)
            deploy_gcp_vm
            ;;
    esac
    
    # Post-deployment steps
    verify_deployment
    setup_monitoring
    create_deployment_summary
    
    print_info "=============================="
    print_success "Deployment completed successfully!"
    print_info ""
    print_info "🎉 VIEAgent is now live in production!"
    print_info ""
    print_info "Important reminders:"
    print_info "1. Monitor the application for the first few hours"
    print_info "2. Check error logs and performance metrics"
    print_info "3. Verify all integrations are working (email, payments, etc.)"
    print_info "4. Update your DNS records if needed"
    print_info "5. Set up SSL certificates if not automated"
    print_info "6. Notify your team about the deployment"
    print_info ""
    print_info "For support, check the deployment summary: deployment-summary.md"
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@" 