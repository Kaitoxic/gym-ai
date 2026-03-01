Set-Location 'C:\Users\cleme\Documents\AI-ClaudeOpus\projets\gym-coach-app'

# Step 1: Create api/ directory
New-Item -ItemType Directory -Path 'api' -Force | Out-Null
Write-Host "Created api/"

# Step 2: git mv all tracked backend files into api/
$filesToMove = @(
    'src',
    'supabase',
    'scripts',
    'package.json',
    'package-lock.json',
    'tsconfig.json',
    'Procfile',
    'railway.json',
    '.env.example'
)

foreach ($f in $filesToMove) {
    if (Test-Path $f) {
        git mv $f "api/$f"
        Write-Host "Moved $f -> api/$f"
    } else {
        Write-Host "SKIP (not found): $f"
    }
}

# Step 3: Move gitignored runtime dirs manually
if (Test-Path 'node_modules') {
    Move-Item -Path 'node_modules' -Destination 'api/node_modules' -Force
    Write-Host "Moved node_modules -> api/node_modules"
}
if (Test-Path 'dist') {
    Move-Item -Path 'dist' -Destination 'api/dist' -Force
    Write-Host "Moved dist -> api/dist"
}
if (Test-Path '.env') {
    Move-Item -Path '.env' -Destination 'api/.env' -Force
    Write-Host "Moved .env -> api/.env"
}

# Step 4: Update root .gitignore for monorepo
$rootGitignore = @"
# Dependencies
node_modules/
api/node_modules/
mobile/node_modules/

# Build outputs
dist/
api/dist/
mobile/.expo/
mobile/build/

# Env files
.env
api/.env
mobile/.env

# OS
.DS_Store

# Expo
*.jks
*.p8
*.p12
*.key
*.mobileprovision
*.orig.*
web-build/
"@
Set-Content -Path '.gitignore' -Value $rootGitignore -Encoding UTF8
Write-Host "Updated root .gitignore"

Write-Host ""
Write-Host "Done! git status:"
git status
