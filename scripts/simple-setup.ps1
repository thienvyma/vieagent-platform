# Simple VIEAgent Environment Setup
# Simple script to setup environment variables

Write-Host "VIEAgent Environment Setup" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

# Check if we're in the right directory
if (-not (Test-Path "package.json") -or -not (Test-Path "next.config.js")) {
    Write-Host "ERROR: Please run this script from the VIEAgent project root directory." -ForegroundColor Red
    exit 1
}

# Check for existing .env files
$envFiles = @(".env.local", ".env.production", ".env")
$existingFiles = $envFiles | Where-Object { Test-Path $_ }

if ($existingFiles) {
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
$envChoice = Read-Host "Enter choice (1 or 2)" "1"

if ($envChoice -eq "2") {
    $templatePath = "production.config.env"
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

# Get environment variables
Write-Host "`nEnter environment variables:" -ForegroundColor Green

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
if ($envChoice -eq "2") {
    $nextauthUrl = Read-Host "Enter NEXTAUTH_URL for production (https://your-domain.com)"
} else {
    $nextauthUrl = "http://localhost:3000"
    Write-Host "Using default NEXTAUTH_URL: $nextauthUrl" -ForegroundColor Blue
}

# Get OPENAI_API_KEY
$openaiKey = Read-Host "Enter OPENAI_API_KEY (sk-...)"

# Get DATABASE_URL
if ($envChoice -eq "2") {
    $databaseUrl = Read-Host "Enter DATABASE_URL for production (postgresql://...)"
} else {
    $databaseUrl = "file:./prisma/dev.db"
    Write-Host "Using default DATABASE_URL: $databaseUrl" -ForegroundColor Blue
}

# Replace placeholders
$template = $template -replace "your-super-secret-jwt-secret-key-change-this-in-production", $nextauthSecret
$template = $template -replace "http://localhost:3000", $nextauthUrl
$template = $template -replace "sk-your-openai-api-key-here", $openaiKey
$template = $template -replace "file:./prisma/dev.db", $databaseUrl

# Save file
try {
    $template | Out-File -FilePath $outputPath -Encoding UTF8
    Write-Host "`nSUCCESS: Created $outputPath" -ForegroundColor Green
    
    # Also create .env.local for development
    if ($envChoice -ne "2" -and -not (Test-Path ".env.local")) {
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

# Final instructions
Write-Host "`nSetup Complete!" -ForegroundColor Green
Write-Host "==============" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Check the created configuration file"
Write-Host "2. Run: npm install"
Write-Host "3. Run: npx prisma db push"
Write-Host "4. Run: npm run dev"
Write-Host "`nImportant:" -ForegroundColor Yellow
Write-Host "- Do not commit .env files to git"
Write-Host "- Secure your API keys"
Write-Host "- Check logs if errors occur" 