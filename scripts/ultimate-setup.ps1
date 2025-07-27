# Ultimate VIEAgent Environment Setup
# Complete script covering ALL environment variables from ALL .env files in the project

param(
    [string]$Environment = "development",
    [switch]$Force,
    [switch]$SkipOptional,
    [switch]$FreeTier
)

Write-Host "VIEAgent Ultimate Environment Setup" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan

# Check if we're in the right directory
if (-not (Test-Path "package.json") -or -not (Test-Path "next.config.js")) {
    Write-Host "ERROR: Please run this script from the VIEAgent project root directory." -ForegroundColor Red
    exit 1
}

# Check for existing .env files
$envFiles = @(".env.local", ".env.production", ".env")
$existingFiles = $envFiles | Where-Object { Test-Path $_ }

if ($existingFiles -and -not $Force) {
    Write-Host "WARNING: Found existing environment files: $($existingFiles -join ', ')" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "Setup cancelled." -ForegroundColor Blue
        exit 0
    }
}

# Choose environment
Write-Host "`nSelect environment:" -ForegroundColor Green
Write-Host "1. Development (default)"
Write-Host "2. Production"
Write-Host "3. Free Tier Production"
$envChoice = Read-Host "Enter choice (1, 2, or 3)" "1"

if ($envChoice -eq "3") {
    $templatePath = "env.production.free"
    $outputPath = ".env.production"
    Write-Host "Selected: Free Tier Production" -ForegroundColor Green
} elseif ($envChoice -eq "2") {
    $templatePath = "env.production.example"
    $outputPath = ".env.production"
    Write-Host "Selected: Production" -ForegroundColor Green
} else {
    $templatePath = "env.example"
    $outputPath = ".env.local"
    Write-Host "Selected: Development" -ForegroundColor Green
}

# Check if template exists
if (-not (Test-Path $templatePath)) {
    Write-Host "ERROR: Template file not found: $templatePath" -ForegroundColor Red
    exit 1
}

# Read template
$template = Get-Content $templatePath -Raw

# =============================================================================
# CORE ENVIRONMENT VARIABLES (REQUIRED)
# =============================================================================
Write-Host "`n=== CORE ENVIRONMENT VARIABLES ===" -ForegroundColor Yellow

# Generate NEXTAUTH_SECRET
$generateSecret = Read-Host "Generate NEXTAUTH_SECRET automatically? (Y/n)" "Y"
if ($generateSecret -ne "n" -and $generateSecret -ne "N") {
    $bytes = New-Object Byte[] 32
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    $rng.Dispose()
    $nextauthSecret = [Convert]::ToBase64String($bytes)
    Write-Host "Generated NEXTAUTH_SECRET: $($nextauthSecret.Substring(0, 20))..." -ForegroundColor Green
} else {
    $nextauthSecret = Read-Host "Enter NEXTAUTH_SECRET (minimum 32 characters)"
}

# Get NEXTAUTH_URL
if ($envChoice -eq "2" -or $envChoice -eq "3") {
    $nextauthUrl = Read-Host "Enter NEXTAUTH_URL for production (https://your-domain.com)"
} else {
    $nextauthUrl = "http://localhost:3000"
    Write-Host "Using default NEXTAUTH_URL: $nextauthUrl" -ForegroundColor Blue
}

# Get OPENAI_API_KEY
$openaiKey = Read-Host "Enter OPENAI_API_KEY (sk-...)"
if (-not $openaiKey.StartsWith("sk-")) {
    Write-Host "WARNING: OpenAI API key should start with 'sk-'" -ForegroundColor Yellow
}

# Get DATABASE_URL
if ($envChoice -eq "2") {
    $databaseUrl = Read-Host "Enter DATABASE_URL for production (postgresql://...)"
} elseif ($envChoice -eq "3") {
    $databaseUrl = Read-Host "Enter DATABASE_URL for Supabase (postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres)"
} else {
    $databaseUrl = "file:./prisma/dev.db"
    Write-Host "Using default DATABASE_URL: $databaseUrl" -ForegroundColor Blue
}

# =============================================================================
# AI MODEL PROVIDERS
# =============================================================================
Write-Host "`n=== AI MODEL PROVIDERS ===" -ForegroundColor Yellow

# Anthropic Claude
$useAnthropic = Read-Host "Configure Anthropic Claude API? (y/N)" "N"
$anthropicKey = ""
if ($useAnthropic -eq "y" -or $useAnthropic -eq "Y") {
    $anthropicKey = Read-Host "Enter ANTHROPIC_API_KEY (sk-ant-...)"
}

# Google Gemini
$useGemini = Read-Host "Configure Google Gemini API? (y/N)" "N"
$geminiKey = ""
if ($useGemini -eq "y" -or $useGemini -eq "Y") {
    $geminiKey = Read-Host "Enter GOOGLE_GEMINI_API_KEY"
}

# =============================================================================
# GOOGLE INTEGRATION
# =============================================================================
Write-Host "`n=== GOOGLE INTEGRATION ===" -ForegroundColor Yellow

$useGoogleOAuth = Read-Host "Configure Google OAuth? (y/N)" "N"
$googleClientId = ""
$googleClientSecret = ""
$googleApiKey = ""
if ($useGoogleOAuth -eq "y" -or $useGoogleOAuth -eq "Y") {
    $googleClientId = Read-Host "Enter GOOGLE_CLIENT_ID"
    $googleClientSecret = Read-Host "Enter GOOGLE_CLIENT_SECRET"
    $googleApiKey = Read-Host "Enter GOOGLE_API_KEY (for additional services)"
}

# =============================================================================
# VECTOR DATABASE CONFIGURATION
# =============================================================================
Write-Host "`n=== VECTOR DATABASE CONFIGURATION ===" -ForegroundColor Yellow

$useVectorDB = Read-Host "Configure Vector Database? (y/N)" "N"
$vectorDBType = ""
$chromaHost = "localhost"
$chromaPort = "8000"
$chromaUrl = ""
$chromaPersistPath = "./chromadb_data"
$pineconeApiKey = ""
$pineconeEnvironment = ""
$pineconeIndexName = ""

if ($useVectorDB -eq "y" -or $useVectorDB -eq "Y") {
    Write-Host "Choose Vector Database:" -ForegroundColor Cyan
    Write-Host "1. ChromaDB (Self-hosted)"
    Write-Host "2. Pinecone (Cloud)"
    $vectorDBChoice = Read-Host "Enter choice (1 or 2)" "1"
    
    if ($vectorDBChoice -eq "2") {
        $vectorDBType = "pinecone"
        $pineconeApiKey = Read-Host "Enter PINECONE_API_KEY"
        $pineconeEnvironment = Read-Host "Enter PINECONE_ENVIRONMENT" "gcp-starter"
        $pineconeIndexName = Read-Host "Enter PINECONE_INDEX_NAME" "ai-agent-knowledge"
    } else {
        $vectorDBType = "chromadb"
        $chromaHost = Read-Host "Enter CHROMADB_HOST" "localhost"
        $chromaPort = Read-Host "Enter CHROMADB_PORT" "8000"
        $chromaUrl = Read-Host "Enter CHROMADB_URL (http://host:port)" "http://localhost:8000"
        $chromaPersistPath = Read-Host "Enter CHROMA_PERSIST_DIRECTORY" "./chromadb_data"
    }
}

# =============================================================================
# EMAIL CONFIGURATION
# =============================================================================
Write-Host "`n=== EMAIL CONFIGURATION ===" -ForegroundColor Yellow

$useEmail = Read-Host "Configure Email Service? (y/N)" "N"
$emailType = ""
$smtpHost = "smtp.gmail.com"
$smtpPort = "587"
$smtpUser = ""
$smtpPass = ""
$smtpFrom = ""
$resendApiKey = ""

if ($useEmail -eq "y" -or $useEmail -eq "Y") {
    Write-Host "Choose Email Service:" -ForegroundColor Cyan
    Write-Host "1. SMTP (Gmail, etc.)"
    Write-Host "2. Resend (Free tier)"
    $emailChoice = Read-Host "Enter choice (1 or 2)" "1"
    
    if ($emailChoice -eq "2") {
        $emailType = "resend"
        $resendApiKey = Read-Host "Enter RESEND_API_KEY (re_...)"
        $smtpFrom = Read-Host "Enter FROM_EMAIL (noreply@your-domain.com)"
    } else {
        $emailType = "smtp"
        $smtpHost = Read-Host "Enter SMTP_HOST" "smtp.gmail.com"
        $smtpPort = Read-Host "Enter SMTP_PORT" "587"
        $smtpUser = Read-Host "Enter SMTP_USER (your-email@gmail.com)"
        $smtpPass = Read-Host "Enter SMTP_PASS (app password)" -AsSecureString
        $smtpFrom = Read-Host "Enter SMTP_FROM (VIEAgent <noreply@your-domain.com>)"
    }
}

# =============================================================================
# PAYMENT PROCESSING
# =============================================================================
Write-Host "`n=== PAYMENT PROCESSING ===" -ForegroundColor Yellow

$useStripe = Read-Host "Configure Stripe Payments? (y/N)" "N"
$stripePublicKey = ""
$stripeSecretKey = ""
$stripeWebhookSecret = ""
if ($useStripe -eq "y" -or $useStripe -eq "Y") {
    $stripePublicKey = Read-Host "Enter STRIPE_PUBLIC_KEY (pk_test_... or pk_live_...)"
    $stripeSecretKey = Read-Host "Enter STRIPE_SECRET_KEY (sk_test_... or sk_live_...)"
    $stripeWebhookSecret = Read-Host "Enter STRIPE_WEBHOOK_SECRET (whsec_...)"
}

# =============================================================================
# SOCIAL MEDIA INTEGRATION
# =============================================================================
Write-Host "`n=== SOCIAL MEDIA INTEGRATION ===" -ForegroundColor Yellow

$useFacebook = Read-Host "Configure Facebook Integration? (y/N)" "N"
$facebookAppId = ""
if ($useFacebook -eq "y" -or $useFacebook -eq "Y") {
    $facebookAppId = Read-Host "Enter FACEBOOK_APP_ID"
}

$useZalo = Read-Host "Configure Zalo Integration? (y/N)" "N"
$zaloAppId = ""
if ($useZalo -eq "y" -or $useZalo -eq "Y") {
    $zaloAppId = Read-Host "Enter ZALO_APP_ID"
}

# =============================================================================
# CLOUD STORAGE
# =============================================================================
Write-Host "`n=== CLOUD STORAGE ===" -ForegroundColor Yellow

$useCloudinary = Read-Host "Configure Cloudinary? (y/N)" "N"
$cloudinaryCloudName = ""
$cloudinaryApiKey = ""
$cloudinaryApiSecret = ""
if ($useCloudinary -eq "y" -or $useCloudinary -eq "Y") {
    $cloudinaryCloudName = Read-Host "Enter CLOUDINARY_CLOUD_NAME"
    $cloudinaryApiKey = Read-Host "Enter CLOUDINARY_API_KEY"
    $cloudinaryApiSecret = Read-Host "Enter CLOUDINARY_API_SECRET"
}

# =============================================================================
# MONITORING & ADMIN
# =============================================================================
Write-Host "`n=== MONITORING & ADMIN ===" -ForegroundColor Yellow

$useMonitoring = Read-Host "Configure Monitoring? (y/N)" "N"
$adminEmail = ""
$slackWebhook = ""
$sentryDsn = ""
$googleAnalyticsId = ""
if ($useMonitoring -eq "y" -or $useMonitoring -eq "Y") {
    $adminEmail = Read-Host "Enter ADMIN_EMAIL (for notifications)"
    $slackWebhook = Read-Host "Enter SLACK_WEBHOOK (optional)"
    $sentryDsn = Read-Host "Enter SENTRY_DSN (for error tracking)"
    $googleAnalyticsId = Read-Host "Enter GOOGLE_ANALYTICS_ID (G-...)"
}

# =============================================================================
# CACHING & PERFORMANCE
# =============================================================================
Write-Host "`n=== CACHING & PERFORMANCE ===" -ForegroundColor Yellow

$useRedis = Read-Host "Configure Redis Cache? (y/N)" "N"
$redisUrl = ""
$upstashRedisUrl = ""
$upstashRedisToken = ""
if ($useRedis -eq "y" -or $useRedis -eq "Y") {
    Write-Host "Choose Redis Service:" -ForegroundColor Cyan
    Write-Host "1. Self-hosted Redis"
    Write-Host "2. Upstash Redis (Free tier)"
    $redisChoice = Read-Host "Enter choice (1 or 2)" "2"
    
    if ($redisChoice -eq "2") {
        $upstashRedisUrl = Read-Host "Enter UPSTASH_REDIS_REST_URL (https://region.upstash.io)"
        $upstashRedisToken = Read-Host "Enter UPSTASH_REDIS_REST_TOKEN"
    } else {
        $redisUrl = Read-Host "Enter REDIS_URL (redis://localhost:6379)"
    }
}

# =============================================================================
# FREE TIER SPECIFIC CONFIGURATIONS
# =============================================================================
if ($envChoice -eq "3") {
    Write-Host "`n=== FREE TIER CONFIGURATIONS ===" -ForegroundColor Yellow
    
    $supabaseUrl = Read-Host "Enter SUPABASE_URL (https://[project-ref].supabase.co)"
    $supabaseAnonKey = Read-Host "Enter SUPABASE_ANON_KEY"
    $supabaseServiceRoleKey = Read-Host "Enter SUPABASE_SERVICE_ROLE_KEY"
    
    $directUrl = $databaseUrl
}

# =============================================================================
# REPLACE PLACEHOLDERS IN TEMPLATE
# =============================================================================
Write-Host "`n=== UPDATING TEMPLATE ===" -ForegroundColor Yellow

# Core replacements
$replacements = @{
    "your-super-secret-jwt-secret-key-change-this-in-production" = $nextauthSecret
    "your-super-secure-production-secret-key-32-chars-min" = $nextauthSecret
    "your-super-secure-production-secret-key-min-32-characters-long" = $nextauthSecret
    "http://localhost:3000" = $nextauthUrl
    "sk-your-openai-api-key-here" = $openaiKey
    "sk-your-openai-production-key" = $openaiKey
    "sk-your-production-openai-api-key-here" = $openaiKey
    "file:./prisma/dev.db" = $databaseUrl
}

# AI Model Providers
if ($anthropicKey) {
    $replacements["sk-ant-your-anthropic-api-key-here"] = $anthropicKey
    $replacements["sk-ant-your-anthropic-production-key"] = $anthropicKey
    $replacements["sk-ant-your-production-anthropic-api-key-here"] = $anthropicKey
}
if ($geminiKey) {
    $replacements["your-google-gemini-api-key-here"] = $geminiKey
    $replacements["your-google-gemini-production-key"] = $geminiKey
    $replacements["your-production-google-gemini-api-key-here"] = $geminiKey
}

# Google Integration
if ($googleClientId) {
    $replacements["your-google-client-id.apps.googleusercontent.com"] = $googleClientId
    $replacements["your-google-client-secret"] = $googleClientSecret
    $replacements["your-google-api-key-for-services"] = $googleApiKey
}

# Apply replacements
foreach ($placeholder in $replacements.Keys) {
    $value = $replacements[$placeholder]
    if ($value) {
        $template = $template -replace [regex]::Escape($placeholder), $value
    }
}

# Add additional variables that might not be in template
$additionalVars = @()

# Vector Database
if ($vectorDBType -eq "chromadb") {
    $additionalVars += "CHROMADB_URL=`"$chromaUrl`""
    $additionalVars += "CHROMADB_HOST=`"$chromaHost`""
    $additionalVars += "CHROMADB_PORT=`"$chromaPort`""
    $additionalVars += "CHROMA_PERSIST_DIRECTORY=`"$chromaPersistPath`""
} elseif ($vectorDBType -eq "pinecone") {
    $additionalVars += "PINECONE_API_KEY=`"$pineconeApiKey`""
    $additionalVars += "PINECONE_ENVIRONMENT=`"$pineconeEnvironment`""
    $additionalVars += "PINECONE_INDEX_NAME=`"$pineconeIndexName`""
}

# Email configuration
if ($emailType -eq "smtp" -and $smtpUser) {
    $additionalVars += "SMTP_HOST=`"$smtpHost`""
    $additionalVars += "SMTP_PORT=`"$smtpPort`""
    $additionalVars += "SMTP_USER=`"$smtpUser`""
    $additionalVars += "SMTP_PASS=`"$smtpPass`""
    if ($smtpFrom) {
        $additionalVars += "SMTP_FROM=`"$smtpFrom`""
    }
} elseif ($emailType -eq "resend" -and $resendApiKey) {
    $additionalVars += "RESEND_API_KEY=`"$resendApiKey`""
    if ($smtpFrom) {
        $additionalVars += "FROM_EMAIL=`"$smtpFrom`""
    }
}

# Stripe
if ($stripePublicKey) {
    $additionalVars += "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=`"$stripePublicKey`""
    $additionalVars += "STRIPE_SECRET_KEY=`"$stripeSecretKey`""
    if ($stripeWebhookSecret) {
        $additionalVars += "STRIPE_WEBHOOK_SECRET=`"$stripeWebhookSecret`""
    }
}

# Social Media
if ($facebookAppId) {
    $additionalVars += "FACEBOOK_APP_ID=`"$facebookAppId`""
    $additionalVars += "NEXT_PUBLIC_FACEBOOK_APP_ID=`"$facebookAppId`""
}
if ($zaloAppId) {
    $additionalVars += "ZALO_APP_ID=`"$zaloAppId`""
    $additionalVars += "NEXT_PUBLIC_ZALO_APP_ID=`"$zaloAppId`""
}

# Monitoring
if ($adminEmail) {
    $additionalVars += "ADMIN_EMAIL=`"$adminEmail`""
}
if ($slackWebhook) {
    $additionalVars += "SLACK_WEBHOOK=`"$slackWebhook`""
}
if ($sentryDsn) {
    $additionalVars += "SENTRY_DSN=`"$sentryDsn`""
}
if ($googleAnalyticsId) {
    $additionalVars += "GOOGLE_ANALYTICS_ID=`"$googleAnalyticsId`""
}

# Cloudinary
if ($cloudinaryCloudName) {
    $additionalVars += "CLOUDINARY_CLOUD_NAME=`"$cloudinaryCloudName`""
    $additionalVars += "CLOUDINARY_API_KEY=`"$cloudinaryApiKey`""
    $additionalVars += "CLOUDINARY_API_SECRET=`"$cloudinaryApiSecret`""
}

# Redis
if ($redisUrl) {
    $additionalVars += "REDIS_URL=`"$redisUrl`""
} elseif ($upstashRedisUrl) {
    $additionalVars += "UPSTASH_REDIS_REST_URL=`"$upstashRedisUrl`""
    $additionalVars += "UPSTASH_REDIS_REST_TOKEN=`"$upstashRedisToken`""
}

# Free Tier Specific
if ($envChoice -eq "3") {
    $additionalVars += "SUPABASE_URL=`"$supabaseUrl`""
    $additionalVars += "SUPABASE_ANON_KEY=`"$supabaseAnonKey`""
    $additionalVars += "SUPABASE_SERVICE_ROLE_KEY=`"$supabaseServiceRoleKey`""
    $additionalVars += "DIRECT_URL=`"$directUrl`""
}

# Add additional variables to template
if ($additionalVars.Count -gt 0) {
    $template += "`n`n# =============================================================================`n"
    $template += "# ADDITIONAL CONFIGURATIONS`n"
    $template += "# =============================================================================`n"
    $template += $additionalVars -join "`n"
}

# =============================================================================
# SAVE CONFIGURATION FILE
# =============================================================================
Write-Host "`n=== SAVING CONFIGURATION ===" -ForegroundColor Yellow

try {
    $template | Out-File -FilePath $outputPath -Encoding UTF8
    Write-Host "SUCCESS: Created $outputPath" -ForegroundColor Green
    
    # Also create .env.local for development
    if ($envChoice -eq "1" -and -not (Test-Path ".env.local")) {
        $template | Out-File -FilePath ".env.local" -Encoding UTF8
        Write-Host "SUCCESS: Created .env.local" -ForegroundColor Green
    }
}
catch {
    Write-Host "ERROR: Cannot create configuration file: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Update .gitignore
$gitignorePath = ".gitignore"
if (Test-Path $gitignorePath) {
    $gitignoreContent = Get-Content $gitignorePath -Raw
    $envFilesToIgnore = @(".env.local", ".env.production", ".env")
    
    foreach ($file in $envFilesToIgnore) {
        if ($gitignoreContent -notmatch [regex]::Escape($file)) {
            $gitignoreContent += "`n$file"
        }
    }
    
    $gitignoreContent | Out-File -FilePath $gitignorePath -Encoding UTF8
    Write-Host "SUCCESS: Updated .gitignore" -ForegroundColor Green
}

# =============================================================================
# FINAL INSTRUCTIONS
# =============================================================================
Write-Host "`n=== SETUP COMPLETE ===" -ForegroundColor Green
Write-Host "=====================" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Check the created configuration file"
Write-Host "2. Run: npm install"
Write-Host "3. Run: npx prisma db push"
Write-Host "4. Run: npm run dev"

if ($envChoice -eq "2" -or $envChoice -eq "3") {
    Write-Host "`nProduction Deployment:" -ForegroundColor Cyan
    Write-Host "- Configure environment variables on hosting platform"
    Write-Host "- Ensure HTTPS is used"
    Write-Host "- Check security and performance"
}

Write-Host "`nImportant:" -ForegroundColor Yellow
Write-Host "- Do not commit .env files to git"
Write-Host "- Secure your API keys"
Write-Host "- Check logs if errors occur"

# Show summary of configured services
Write-Host "`nConfigured Services:" -ForegroundColor Magenta
Write-Host "- Database: $databaseUrl" -ForegroundColor White
Write-Host "- Authentication: NextAuth.js" -ForegroundColor White
Write-Host "- AI Models: OpenAI" -ForegroundColor White
if ($anthropicKey) { Write-Host "- AI Models: Anthropic Claude" -ForegroundColor White }
if ($geminiKey) { Write-Host "- AI Models: Google Gemini" -ForegroundColor White }
if ($vectorDBType -eq "chromadb") { Write-Host "- Vector Database: ChromaDB" -ForegroundColor White }
if ($vectorDBType -eq "pinecone") { Write-Host "- Vector Database: Pinecone" -ForegroundColor White }
if ($emailType -eq "smtp") { Write-Host "- Email: SMTP" -ForegroundColor White }
if ($emailType -eq "resend") { Write-Host "- Email: Resend" -ForegroundColor White }
if ($useStripe -eq "y" -or $useStripe -eq "Y") { Write-Host "- Payments: Stripe" -ForegroundColor White }
if ($useFacebook -eq "y" -or $useFacebook -eq "Y") { Write-Host "- Social: Facebook" -ForegroundColor White }
if ($useZalo -eq "y" -or $useZalo -eq "Y") { Write-Host "- Social: Zalo" -ForegroundColor White }
if ($useMonitoring -eq "y" -or $useMonitoring -eq "Y") { Write-Host "- Monitoring: Enabled" -ForegroundColor White }
if ($useCloudinary -eq "y" -or $useCloudinary -eq "Y") { Write-Host "- Storage: Cloudinary" -ForegroundColor White }
if ($useRedis -eq "y" -or $useRedis -eq "Y") { Write-Host "- Cache: Redis" -ForegroundColor White }
if ($envChoice -eq "3") { Write-Host "- Free Tier: Supabase + Upstash + Resend" -ForegroundColor White } 