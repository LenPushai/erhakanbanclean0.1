$file = "src\App.tsx"
$lines = [System.IO.File]::ReadAllLines($file)

# FIX 1: Replace lines 1799-1808 (0-indexed: 1798-1807) with actionSet mapping
# Remove 10 old lines, insert 11 new ones
$newMapping = @(
    "        const actionSet=getActionSet(rfq.actions_required);",
    "        action_manufacture:  actionSet.has('MANUFACTURE'),",
    "        action_sandblast:    actionSet.has('SANDBLAST'),",
    "        action_prepare_material: actionSet.has('PREPARE'),",
    "        action_service:      actionSet.has('SERVICE'),",
    "        action_paint:        actionSet.has('PAINT'),",
    "        action_repair:       actionSet.has('REPAIR'),",
    "        action_installation: actionSet.has('INSTALLATION'),",
    "        action_cut:          actionSet.has('CUT'),",
    "        action_modify:       actionSet.has('MODIFY'),",
    "        action_machining:    actionSet.has('MACHINING'),",
    "        action_other:        actionSet.has('OTHER')||actionSet.has('QUOTE')||actionSet.has('CHANGE')||actionSet.has('BREAKDOWN')||actionSet.has('SUPPLY'),"
)

$before = $lines[0..1797]
$after  = $lines[1808..($lines.Length-1)]
$lines  = $before + $newMapping + $after
Write-Host "Fix 1 done - mapping replaced at lines 1799-1808"

# FIX 2: Add Machining to checkbox array (line 1000 shifted by +2 due to inserted lines)
# Find the line with action_manufacture and Manufacture label
$cbIdx = -1
for ($i = 0; $i -lt $lines.Length; $i++) {
    if ($lines[$i] -match "action_manufacture.*Manufacture.*action_service") {
        $cbIdx = $i
        break
    }
}

if ($cbIdx -ge 0) {
    $lines[$cbIdx] = "              ['action_manufacture','Manufacture'],['action_service','Service'],['action_repair','Repair'],"
    # Find next line with action_sandblast
    $cb2Idx = $cbIdx + 1
    if ($lines[$cb2Idx] -match "action_sandblast") {
        $lines[$cb2Idx] = "              ['action_sandblast','Sandblast'],['action_paint','Paint'],['action_installation','Installation'],"
    }
    # Find next line with action_cut
    $cb3Idx = $cbIdx + 2
    if ($lines[$cb3Idx] -match "action_cut") {
        $lines[$cb3Idx] = "              ['action_cut','Cut'],['action_modify','Modify'],['action_machining','Machining'],['action_other','Other'],"
    }
    Write-Host "Fix 2 done - Machining added to checkbox array at line $($cbIdx+1)"
} else {
    Write-Host "Fix 2 WARNING - checkbox array line not found"
}

[System.IO.File]::WriteAllLines($file, $lines)
Write-Host "ALL DONE - App.tsx saved"
