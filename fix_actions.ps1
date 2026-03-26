$file = "src\App.tsx"
$t = [System.IO.File]::ReadAllText($file)

# 1. Add getActionSet helper before JobDetailPanel
$t = $t.Replace(
    "function JobDetailPanel",
    "const getActionSet=(str)=>new Set((str||'').toUpperCase().split(',').map(s=>s.trim()));`n`nfunction JobDetailPanel"
)
Write-Host "Step 1 done - getActionSet injected"

# 2. Replace includes() mapping with actionSet.has() + add machining
$old = "        action_manufacture: (rfq.actions_required || '').toUpperCase().includes('MANUFACTURE'),`r`n        action_service:      (rfq.actions_required || '').toUpperCase().includes('SERVICE'),`r`n        action_repair:       (rfq.actions_required || '').toUpperCase().includes('REPAIR'),`r`n        action_sandblast:    (rfq.actions_required || '').toUpperCase().includes('SANDBLAST'),`r`n        action_paint:        (rfq.actions_required || '').toUpperCase().includes('PAINT'),`r`n        action_installation: (rfq.actions_required || '').toUpperCase().includes('INSTALLATION'),`r`n        action_cut:          (rfq.actions_required || '').toUpperCase().includes('CUT'),`r`n        action_modify:       (rfq.actions_required || '').toUpperCase().includes('MODIFY'),`r`n        action_other:        (rfq.actions_required || '').toUpperCase().includes('OTHER'),"

$new = "        const actionSet=getActionSet(rfq.actions_required);`r`n        action_manufacture:  actionSet.has('MANUFACTURE'),`r`n        action_service:      actionSet.has('SERVICE'),`r`n        action_repair:       actionSet.has('REPAIR'),`r`n        action_sandblast:    actionSet.has('SANDBLAST'),`r`n        action_paint:        actionSet.has('PAINT'),`r`n        action_installation: actionSet.has('INSTALLATION'),`r`n        action_cut:          actionSet.has('CUT'),`r`n        action_modify:       actionSet.has('MODIFY'),`r`n        action_machining:    actionSet.has('MACHINING'),`r`n        action_other:        actionSet.has('OTHER')||actionSet.has('QUOTE')||actionSet.has('CHANGE')||actionSet.has('BREAKDOWN')||actionSet.has('SUPPLY'),"

if ($t.Contains($old)) {
    $t = $t.Replace($old, $new)
    Write-Host "Step 2 done - mapping replaced OK"
} else {
    Write-Host "Step 2 WARNING - mapping not found, dumping context:"
    $idx = $t.IndexOf("action_manufacture:")
    if ($idx -ge 0) { Write-Host $t.Substring($idx, 500) }
}

# 3. Fix actions useState - swap to useEffect so it re-syncs when job changes
$oldState = "  const [actions, setActions] = React.useState<Record<string,boolean>>({`r`n    action_manufacture: !!(job as any).action_manufacture,`r`n    action_service:     !!(job as any).action_service,`r`n    action_repair:      !!(job as any).action_repair,`r`n    action_sandblast:   !!(job as any).action_sandblast,`r`n    action_paint:       !!(job as any).action_paint,`r`n    action_installation:!!(job as any).action_installation,`r`n    action_cut:         !!(job as any).action_cut,`r`n    action_modify:      !!(job as any).action_modify,`r`n    action_other:       !!(job as any).action_other,`r`n  })"

$newState = "  const [actions, setActions] = React.useState<Record<string,boolean>>({});`r`n  React.useEffect(()=>{`r`n    if(!job) return;`r`n    setActions({`r`n      action_manufacture:  !!(job as any).action_manufacture,`r`n      action_service:      !!(job as any).action_service,`r`n      action_repair:       !!(job as any).action_repair,`r`n      action_sandblast:    !!(job as any).action_sandblast,`r`n      action_paint:        !!(job as any).action_paint,`r`n      action_installation: !!(job as any).action_installation,`r`n      action_cut:          !!(job as any).action_cut,`r`n      action_modify:       !!(job as any).action_modify,`r`n      action_machining:    !!(job as any).action_machining,`r`n      action_other:        !!(job as any).action_other,`r`n    });`r`n  },[job])"

if ($t.Contains($oldState)) {
    $t = $t.Replace($oldState, $newState)
    Write-Host "Step 3 done - useState+useEffect patched OK"
} else {
    Write-Host "Step 3 WARNING - actions useState not found"
}

# 4. Add Machining to checkbox render array
$oldCB = "              ['action_manufacture','Manufacture'],['action_service','Service'],['action_repair','Repair'],`r`n              ['action_sandblast','Sandblast'],['action_paint','Paint'],['action_installation','Installation'],`r`n              ['action_cut','Cut'],['action_modify','Modify'],['action_other','Other'],"

$newCB = "              ['action_manufacture','Manufacture'],['action_service','Service'],['action_repair','Repair'],`r`n              ['action_sandblast','Sandblast'],['action_paint','Paint'],['action_installation','Installation'],`r`n              ['action_cut','Cut'],['action_modify','Modify'],['action_machining','Machining'],['action_other','Other'],"

if ($t.Contains($oldCB)) {
    $t = $t.Replace($oldCB, $newCB)
    Write-Host "Step 4 done - Machining checkbox added OK"
} else {
    Write-Host "Step 4 WARNING - checkbox array not found"
}

[System.IO.File]::WriteAllText($file, $t)
Write-Host "ALL DONE - App.tsx saved"
