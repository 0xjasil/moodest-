# F:\Moodest\backend\scripts\setup-test-db.ps1
# Moodest -- Test Database Setup and Migration Script (Interactive and Safe)
# Usage: Run from F:\Moodest\backend in PowerShell:
#   powershell -ExecutionPolicy Bypass -File .\scripts\setup-test-db.ps1

$ErrorActionPreference = "Stop"

$q34 = [char]34
$q39 = [char]39

# Helper: Normalise host by stripping -pooler, port, trimming and lowercasing
function Normalize-Host([string]$h) {
    if (-not $h) { return "" }
    $clean = $h.Split(':')[0].Trim()
    return $clean.Replace("-pooler", "").ToLowerInvariant()
}

# Helper: Extract host from postgresql:// URL using pure string handling
function Get-PostgresHost([string]$url) {
    if (-not $url) { return $null }
    $clean = $url.Trim().Trim($q34).Trim($q39).Trim()
    if ($clean.StartsWith('url"')) { $clean = $clean.Substring(3).Trim($q34).Trim() }
    if ($clean.StartsWith("url'")) { $clean = $clean.Substring(3).Trim($q39).Trim() }
    if (-not $clean.StartsWith("postgresql://") -and -not $clean.StartsWith("postgres://")) {
        return $null
    }
    $atPos = $clean.IndexOf("@")
    if ($atPos -lt 0) { return $null }
    $afterAt = $clean.Substring($atPos + 1)
    $slashPos = $afterAt.IndexOf("/")
    $hostPort = if ($slashPos -ge 0) { $afterAt.Substring(0, $slashPos) } else { $afterAt }
    $cleanHost = $hostPort.Split(':')[0].Trim()
    return $cleanHost
}

# Helper: Convert SecureString to plain string in memory
function Convert-SecureStringToString([System.Security.SecureString]$secureStr) {
    if (-not $secureStr) { return "" }
    $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureStr)
    try {
        return [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
    } finally {
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    }
}

# 1. Resolve absolute path of F:\Moodest\backend\.env
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Resolve-Path (Join-Path $ScriptDir "..")
$EnvFile = Join-Path $BackendDir ".env"

if (-not (Test-Path -LiteralPath $EnvFile)) {
    Write-Error "ERROR: .env file not found at $EnvFile"
    exit 1
}

# 2. Read MAIN host from DATABASE_URL in .env (host only, never print secrets)
$mainHost = $null
$envLines = Get-Content -LiteralPath $EnvFile
foreach ($line in $envLines) {
    $trimmed = $line.Trim()
    if ($trimmed.StartsWith("DATABASE_URL")) {
        $eqIndex = $trimmed.IndexOf("=")
        if ($eqIndex -ge 0) {
            $val = $trimmed.Substring($eqIndex + 1).Trim().Trim($q34).Trim($q39)
            $mainHost = Get-PostgresHost $val
            break
        }
    }
}

if (-not $mainHost) {
    Write-Error "ERROR: Could not parse DATABASE_URL host from $EnvFile"
    exit 1
}

$mainHostNorm = Normalize-Host $mainHost

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "MOODEST -- Test Database Provisioning and Migration" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Main database host (production)   : $mainHost" -ForegroundColor Yellow
Write-Host "Main database host (normalised)   : $mainHostNorm" -ForegroundColor Yellow

# 3. Prompt for TEST pooled and direct URLs (masked input, with Ctrl+V and Right-Click support)
Write-Host "`nEnter TEST Pooled URL (contains -pooler; paste via Right-Click or Ctrl+V):" -ForegroundColor Cyan
$pooledSecure = Read-Host -AsSecureString
$pooledUrl = (Convert-SecureStringToString $pooledSecure).Trim()

# Handle Ctrl+V (char 22) in Windows PowerShell 5.1 console
if ($pooledUrl -eq [string][char]22 -or $pooledUrl.Contains([char]22) -or [string]::IsNullOrWhiteSpace($pooledUrl)) {
    try {
        $clip = (Get-Clipboard -ErrorAction SilentlyContinue)
        if ($clip) {
            $pooledUrl = $clip.Trim()
        }
    } catch {}
}
$pooledUrl = $pooledUrl.Trim().Trim($q34).Trim($q39).Trim()
if ($pooledUrl.StartsWith('url"')) { $pooledUrl = $pooledUrl.Substring(3).Trim($q34).Trim() }

Write-Host "Enter TEST Direct URL (no -pooler; or press Enter to auto-derive from pooled):" -ForegroundColor Cyan
$directSecure = Read-Host -AsSecureString
$directUrl = (Convert-SecureStringToString $directSecure).Trim()

if ($directUrl -eq [string][char]22 -or $directUrl.Contains([char]22) -or [string]::IsNullOrWhiteSpace($directUrl)) {
    try {
        $clip = (Get-Clipboard -ErrorAction SilentlyContinue)
        if ($clip -and -not $clip.Contains("-pooler")) {
            $directUrl = $clip.Trim()
        }
    } catch {}
    if ([string]::IsNullOrWhiteSpace($directUrl) -and $pooledUrl.Contains("-pooler")) {
        $directUrl = $pooledUrl.Replace("-pooler.", ".")
        Write-Host "  (Auto-derived TEST Direct URL by removing '-pooler')" -ForegroundColor DarkGray
    }
}
$directUrl = $directUrl.Trim().Trim($q34).Trim($q39).Trim()
if ($directUrl.StartsWith('url"')) { $directUrl = $directUrl.Substring(3).Trim($q34).Trim() }

# 4. Extract and validate hosts
$pooledHost = Get-PostgresHost $pooledUrl
$directHost = Get-PostgresHost $directUrl

if (-not $pooledHost) {
    Write-Error "VALIDATION FAILED: TEST Pooled URL is invalid or empty. Must start with postgresql:// and contain host."
    exit 1
}
if (-not $directHost) {
    Write-Error "VALIDATION FAILED: TEST Direct URL is invalid or empty. Must start with postgresql:// and contain host."
    exit 1
}

$pooledHostNorm = Normalize-Host $pooledHost
$directHostNorm = Normalize-Host $directHost

# Validate normalisation against MAIN host
if ($pooledHostNorm -eq $mainHostNorm -or $directHostNorm -eq $mainHostNorm) {
    Write-Error "SAFETY ABORT: Normalised test host matches the MAIN database host ($mainHostNorm)! Aborting."
    exit 1
}

if (-not $pooledHost.Contains("-pooler")) {
    Write-Error "VALIDATION FAILED: Pooled host ($pooledHost) must contain '-pooler'."
    exit 1
}

if ($directHost.Contains("-pooler")) {
    Write-Error "VALIDATION FAILED: Direct host ($directHost) must NOT contain '-pooler'."
    exit 1
}

if ($pooledHostNorm -ne $directHostNorm) {
    Write-Error "VALIDATION FAILED: Normalised host mismatch: '$pooledHostNorm' != '$directHostNorm'."
    exit 1
}

# 5. Print only hosts and lengths (never passwords)
Write-Host "`nValidation Successful:" -ForegroundColor Green
Write-Host "  TEST Pooled Host : $pooledHost  (length: $($pooledUrl.Length))"
Write-Host "  TEST Direct Host : $directHost  (length: $($directUrl.Length))"
Write-Host "  Normalised Host  : $directHostNorm"
Write-Host "  Host Isolation   : VERIFIED (differs from main host $mainHostNorm)"

# 6. Set process environment variables for this session only
$env:DATABASE_URL = $pooledUrl
$env:DIRECT_DATABASE_URL = $directUrl

# 7. Run prisma migrate status safely (native commands with continue)
Write-Host "`nChecking migration status against TEST database..." -ForegroundColor Cyan

$prevEAP = $ErrorActionPreference
$ErrorActionPreference = "Continue"
$statusRaw = npx prisma migrate status 2>&1
$statusExit = $LASTEXITCODE
$ErrorActionPreference = $prevEAP

$statusText = $statusRaw | Out-String
Write-Host $statusText

# Status exit 1 is normal when migrations are pending. Only fatal error codes (> 1) fail immediately.
if ($statusExit -ne 0 -and $statusExit -ne 1) {
    Write-Error "ERROR: prisma migrate status failed with fatal error code $statusExit"
    exit $statusExit
}

# 8. Extract host from line containing Datasource and ' at '
$extractedHost = $null
foreach ($rawLine in ($statusText -split "`n")) {
    $sLine = $rawLine.Trim()
    if ($sLine -like "*Datasource*" -and $sLine -like "* at *") {
        $atIndex = $sLine.IndexOf(" at ")
        if ($atIndex -ge 0) {
            $afterAt = $sLine.Substring($atIndex + 4).Trim()
            $afterAt = $afterAt.Trim($q34).Trim($q39)
            $extractedHost = $afterAt.Split(':')[0].Trim()
            break
        }
    }
}

if (-not $extractedHost) {
    Write-Error "SAFETY ABORT: Could not extract database host from Prisma migrate status output."
    exit 1
}

$prismaHostNorm = Normalize-Host $extractedHost

if ($prismaHostNorm -eq $mainHostNorm) {
    Write-Error "SAFETY ABORT: Prisma reported the MAIN database host ($mainHostNorm)! Aborting immediately."
    exit 1
}

if ($prismaHostNorm -ne $directHostNorm) {
    Write-Error "SAFETY ABORT: Prisma host '$prismaHostNorm' does NOT match expected test host '$directHostNorm'! Aborting."
    exit 1
}

Write-Host "TARGET CONFIRMED: $prismaHostNorm" -ForegroundColor Green

# 9. Print migration names listed as pending / applied (names only)
Write-Host "`nDetected Migration Names in Status Output:" -ForegroundColor Cyan
foreach ($mLine in ($statusText -split "`n")) {
    $trimmedM = $mLine.Trim()
    if ($trimmedM -match '^[0-9]{14}_[a-zA-Z0-9_]+') {
        Write-Host "  - $trimmedM" -ForegroundColor White
    }
}

# 10. User confirmation gate
$confirm = Read-Host "`nType YES to run 'npx prisma migrate deploy' on the TEST database"
if ($confirm -ne "YES") {
    Write-Host "Migration deploy aborted by user." -ForegroundColor Yellow
    exit 0
}

# 11. Run prisma migrate deploy
Write-Host "`nApplying migrations to TEST database via 'npx prisma migrate deploy'..." -ForegroundColor Cyan

$prevEAP = $ErrorActionPreference
$ErrorActionPreference = "Continue"
$deployRaw = npx prisma migrate deploy 2>&1
$deployExit = $LASTEXITCODE
$ErrorActionPreference = $prevEAP

$deployText = $deployRaw | Out-String
Write-Host $deployText

if ($deployExit -ne 0) {
    Write-Error "ERROR: prisma migrate deploy failed with exit code $deployExit"
    exit $deployExit
}

# 12. Verify post-deploy migration status
Write-Host "`nVerifying final migration status on TEST database..." -ForegroundColor Cyan

$prevEAP = $ErrorActionPreference
$ErrorActionPreference = "Continue"
$postStatusRaw = npx prisma migrate status 2>&1
$postStatusExit = $LASTEXITCODE
$ErrorActionPreference = $prevEAP

$postStatusText = $postStatusRaw | Out-String
Write-Host $postStatusText

if ($postStatusExit -ne 0) {
    Write-Error "ERROR: prisma migrate status reported unapplied migrations or error (exit code $postStatusExit)"
    exit $postStatusExit
}

# 13. Append TEST_DATABASE_URL to .env using absolute path
$hasTestDb = $false
foreach ($line in (Get-Content -LiteralPath $EnvFile)) {
    if ($line.Trim().StartsWith("TEST_DATABASE_URL=")) {
        $hasTestDb = $true
        break
    }
}

if (-not $hasTestDb) {
    $line = "`nTEST_DATABASE_URL=" + $q34 + $pooledUrl + $q34 + "`n"
    [System.IO.File]::AppendAllText($EnvFile, $line, [System.Text.Encoding]::ASCII)
    Write-Host "`n[SUCCESS] Appended TEST_DATABASE_URL to $EnvFile" -ForegroundColor Green
} else {
    Write-Host "`n[INFO] TEST_DATABASE_URL is already present in $EnvFile" -ForegroundColor Yellow
}

$updatedItem = Get-Item -LiteralPath $EnvFile
$presentNow = $false
foreach ($line in (Get-Content -LiteralPath $EnvFile)) {
    if ($line.Trim().StartsWith("TEST_DATABASE_URL=")) {
        $presentNow = $true
        break
    }
}

Write-Host ".env LastWriteTime       : $($updatedItem.LastWriteTime)"
Write-Host "TEST_DATABASE_URL present: $presentNow"
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "TEST DATABASE SETUP COMPLETE" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
