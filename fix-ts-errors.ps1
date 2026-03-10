# fix-ts-errors.ps1
# Fixes unused TypeScript imports for Vercel build
# Run from project root: powershell -ExecutionPolicy Bypass -File fix-ts-errors.ps1

$f = Join-Path $PSScriptRoot "src\App.tsx"
if (-not (Test-Path $f)) { Write-Host "ERROR: App.tsx not found." -ForegroundColor Red; exit 1 }

$lines = [System.IO.File]::ReadAllLines($f)
$out = New-Object System.Collections.Generic.List[string]

$i = 0
while ($i -lt $lines.Count) {
    $line = $lines[$i]

    # Fix import line - remove ChevronDown, User, AlertCircle
    if ($line -match "^import.*lucide-react") {
        $line = $line -replace ', ChevronDown', ''
        $line = $line -replace ', User', ''
        $line = $line -replace ', AlertCircle', ''
        $out.Add($line)
        $i++
        continue
    }

    # Skip Client interface block
    if ($line -match "^interface Client \{") {
        while ($i -lt $lines.Count -and $lines[$i] -notmatch "^\}") { $i++ }
        $i++ # skip closing brace
        continue
    }

    # Skip today() function line
    if ($line -match "^function today\(\)") {
        $i++
        continue
    }

    $out.Add($line)
    $i++
}

[System.IO.File]::WriteAllLines($f, $out.ToArray(), [System.Text.Encoding]::ASCII)

# Verify
$check = [System.IO.File]::ReadAllText($f)
$ok = $true
if ($check -match 'ChevronDown') { Write-Host "FAIL: ChevronDown still present" -ForegroundColor Red; $ok = $false }
if ($check -match 'AlertCircle') { Write-Host "FAIL: AlertCircle still present" -ForegroundColor Red; $ok = $false }
if ($check -match 'interface Client \{') { Write-Host "FAIL: Client interface still present" -ForegroundColor Red; $ok = $false }
if ($check -match 'function today\(\)') { Write-Host "FAIL: today() still present" -ForegroundColor Red; $ok = $false }
if ($ok) { Write-Host "All clean - ready to push!" -ForegroundColor Green }

Write-Host "Lines: $($out.Count)" -ForegroundColor Cyan
