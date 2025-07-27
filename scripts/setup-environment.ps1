# VIEAgent Environment Setup Script for Windows
# Auto-setup environment variables

param(
    [string]$Environment = "development",
    [switch]$Force
)

# Colors for console output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    
    $colors = @{
        "Red" = "Red"
        "Green" = "Green" 
        "Yellow" = "Yellow"
        "Blue" = "Blue"
        "Cyan" = "Cyan"
        "Magenta" = "Magenta"
        "White" = "White"
    }
    
    Write-Host $Message -ForegroundColor $colors[$Color]
}

function Write-Info { param([string]$Message) Write-ColorOutput "INFO: $Message" "Blue" }
function Write-Success { param([string]$Message) Write-ColorOutput "SUCCESS: $Message" "Green" }
function Write-Warning { param([string]$Message) Write-ColorOutput "WARNING: $Message" "Yellow" }
function Write-Error { param([string]$Message) Write-ColorOutput "ERROR: $Message" "Red" }
function Write-Title { param([string]$Message) Write-ColorOutput "`n$Message" "Cyan" }

# Generate secure random string
function Generate-Secret {
    param([int]$Length = 32)
    
    $bytes = New-Object Byte[] $Length
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    $rng.Dispose()
    
    return [Convert]::ToBase64String($bytes)
}

# Validate OpenAI API key format
function Test-OpenAIKey {
    param([string]$Key)
    
    return $Key -and $Key.StartsWith("sk-") -and $Key.Length -gt 20
}

# Validate URL format
function Test-URL {
    param([string]$URL)
    
    try {
        [System.Uri]$URL | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Main setup function
function Setup-Environment {
    Write-Title "VIEAgent Environment Setup"
    Write-Info "This script will help you set up environment variables for VIEAgent project."
    
    # Check current directory
    $currentDir = Get-Location
    $packageJsonPath = Join-Path $currentDir "package.json"
    $nextConfigPath = Join-Path $currentDir "next.config.js"
    
    if (-not (Test-Path $packageJsonPath) -or -not (Test-Path $nextConfigPath)) {
        Write-Error "Please run this script from the VIEAgent project root directory."
        exit 1
    }
    
    # Check for existing .env files
    $envFiles = @(".env.local", ".env.production", ".env")
    $existingFiles = $envFiles | Where-Object { Test-Path $_ }
    
    if ($existingFiles -and -not $Force) {
        Write-Warning "Found existing environment files: $($existingFiles -join ', ')"
        $overwrite = Read-Host "Do you want to overwrite? (y/N)"
        if ($overwrite -ne "y" -and $overwrite -ne "Y") {
            Write-Info "Setup cancelled."
            return
        }
    }
    
    # Environment type selection
    Write-Title "Select Environment Type"
    if (-not $Environment) {
        $Environment = Read-Host "Choose environment (development/production)" "development"
    }
    
    # Read appropriate template
    $templatePath = ""
    $outputPath = ""
    
    if ($Environment -eq "production") {
        $templatePath = "production.config.env"
        $outputPath = ".env.production"
    } else {
        $templatePath = "env.example"
        $outputPath = ".env.local"
    }
    
    if (-not (Test-Path $templatePath)) {
        Write-Error "Template file not found: $templatePath"
        return
    }
    
    $template = Get-Content $templatePath -Raw
    if (-not $template) {
        Write-Error "Cannot read template file: $templatePath"
        return
    }
    
    # Collect environment variables
    Write-Title "Configure Environment Variables"
    
    # NEXTAUTH_SECRET
    $generateSecretKey = Read-Host "Generate NEXTAUTH_SECRET automatically? (Y/n)" "Y"
    $nextauthSecret = ""
    if ($generateSecretKey -ne "n" -and $generateSecretKey -ne "N") {
        $nextauthSecret = Generate-Secret
        Write-Success "Generated NEXTAUTH_SECRET: $($nextauthSecret.Substring(0, 20))..."
    } else {
        $nextauthSecret = Read-Host "Enter NEXTAUTH_SECRET (minimum 32 characters)"
        if ($nextauthSecret.Length -lt 32) {
            Write-Warning "NEXTAUTH_SECRET too short. Recommended minimum 32 characters."
        }
    }
    
    # NEXTAUTH_URL
    $nextauthUrl = ""
    if ($Environment -eq "production") {
        $nextauthUrl = Read-Host "Enter NEXTAUTH_URL for production (https://your-domain.com)"
        if (-not (Test-URL $nextauthUrl)) {
            Write-Warning "Invalid URL. Please check again."
        }
    } else {
        $nextauthUrl = "http://localhost:3000"
        Write-Info "Using default NEXTAUTH_URL: $nextauthUrl"
    }
    
    # OPENAI_API_KEY
    $openaiKey = Read-Host "Enter OPENAI_API_KEY (sk-...)"
    if (-not (Test-OpenAIKey $openaiKey)) {
        Write-Warning "OpenAI API key format is incorrect. Please check again."
    }
    
    # DATABASE_URL
    $databaseUrl = ""
    if ($Environment -eq "production") {
        $databaseUrl = Read-Host "Enter DATABASE_URL for production (postgresql://...)"
    } else {
        $databaseUrl = "file:./prisma/dev.db"
        Write-Info "Using default DATABASE_URL: $databaseUrl"
    }
    
    # Optional configurations
    Write-Title "Optional Configuration"
    
    # Google OAuth (optional)
    $useGoogleOAuth = Read-Host "Configure Google OAuth? (y/N)" "N"
    $googleClientId = ""
    $googleClientSecret = ""
    if ($useGoogleOAuth -eq "y" -or $useGoogleOAuth -eq "Y") {
        $googleClientId = Read-Host "Enter GOOGLE_CLIENT_ID"
        $googleClientSecret = Read-Host "Enter GOOGLE_CLIENT_SECRET"
    }
    
    # ChromaDB (optional)
    $useChromaDB = Read-Host "Configure ChromaDB? (y/N)" "N"
    $chromaHost = "localhost"
    $chromaPort = "8000"
    if ($useChromaDB -eq "y" -or $useChromaDB -eq "Y") {
        $chromaHost = Read-Host "Enter CHROMA_SERVER_HOST" "localhost"
        $chromaPort = Read-Host "Enter CHROMA_SERVER_PORT" "8000"
    }
    
    # Replace placeholders in template
    $replacements = @{
        "your-super-secret-jwt-secret-key-change-this-in-production" = $nextauthSecret
        "http://localhost:3000" = $nextauthUrl
        "sk-your-openai-api-key-here" = $openaiKey
        "file:./prisma/dev.db" = $databaseUrl
        "your-google-client-id.apps.googleusercontent.com" = $googleClientId
        "your-google-client-secret" = $googleClientSecret
        "localhost" = $chromaHost
        "8000" = $chromaPort
    }
    
    foreach ($placeholder in $replacements.Keys) {
        $value = $replacements[$placeholder]
        if ($value) {
            $template = $template -replace [regex]::Escape($placeholder), $value
        }
    }
    
    # Write the environment file
    Write-Title "Save Configuration File"
    
    try {
        $template | Out-File -FilePath $outputPath -Encoding UTF8
        Write-Success "Created file: $outputPath"
        
        # Create .env.local for development if needed
        if ($Environment -eq "development" -and -not (Test-Path ".env.local")) {
            $template | Out-File -FilePath ".env.local" -Encoding UTF8
            Write-Success "Created file: .env.local"
        }
    }
    catch {
        Write-Error "Cannot create configuration file: $($_.Exception.Message)"
        return
    }
    
    # Update .gitignore
    $gitignorePath = ".gitignore"
    $gitignoreContent = ""
    if (Test-Path $gitignorePath) {
        $gitignoreContent = Get-Content $gitignorePath -Raw
    }
    
    $envFilesToIgnore = @(".env.local", ".env.production", ".env")
    $updatedGitignore = $gitignoreContent
    
    foreach ($file in $envFilesToIgnore) {
        if ($gitignoreContent -notmatch [regex]::Escape($file)) {
            $updatedGitignore += "`n$file"
        }
    }
    
    if ($updatedGitignore -ne $gitignoreContent) {
        $updatedGitignore | Out-File -FilePath $gitignorePath -Encoding UTF8
        Write-Success "Updated .gitignore"
    }
    
    # Final instructions
    Write-Title "Setup Complete"
    Write-Success "Environment variables configured successfully!"
    
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "1. Check the created configuration file"
    Write-Host "2. Run: npm install (if dependencies not installed)"
    Write-Host "3. Run: npx prisma db push (to initialize database)"
    Write-Host "4. Run: npm run dev (to start development server)"
    
    if ($Environment -eq "production") {
        Write-Host "`nProduction Deployment:" -ForegroundColor Cyan
        Write-Host "- Configure environment variables on hosting platform"
        Write-Host "- Ensure HTTPS is used"
        Write-Host "- Check security and performance"
    }
    
    Write-Host "`nImportant Notes:" -ForegroundColor Yellow
    Write-Host "- Do not commit .env files to git"
    Write-Host "- Secure API keys and secrets"
    Write-Host "- Check logs if errors occur"
}

# Run the setup
try {
    Setup-Environment
}
catch {
    Write-Error "Error: $($_.Exception.Message)"
    exit 1
} 