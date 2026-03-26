$file = "src\App.tsx"
$lines = [System.IO.File]::ReadAllLines($file)

# Step 1: Remove the misplaced "const actionSet=..." from line 1799 (0-indexed: 1798)
if ($lines[1798] -match "const actionSet=getActionSet") {
    $lines = $lines[0..1797] + $lines[1799..($lines.Length-1)]
    Write-Host "Step 1 done - removed misplaced actionSet from object literal"
} else {
    Write-Host "Step 1 WARNING - line 1799 was: $($lines[1798])"
}

# Step 2: Insert "const actionSet=..." before the supabase.from('jobs').insert line (was 1772, now 1771 after removal)
$insertIdx = -1
for ($i = 1760; $i -lt 1790; $i++) {
    if ($lines[$i] -match "supabase\.from\('jobs'\)\.insert") {
        $insertIdx = $i
        break
    }
}

if ($insertIdx -ge 0) {
    $before = $lines[0..($insertIdx-1)]
    $after  = $lines[$insertIdx..($lines.Length-1)]
    $lines  = $before + "      const actionSet=getActionSet(rfq.actions_required);" + $after
    Write-Host "Step 2 done - actionSet inserted before jobs.insert at line $($insertIdx+1)"
} else {
    Write-Host "Step 2 WARNING - could not find jobs insert line"
}

[System.IO.File]::WriteAllLines($file, $lines)
Write-Host "ALL DONE - App.tsx saved"
