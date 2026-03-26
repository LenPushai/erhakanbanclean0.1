$file = "src\App.tsx"
$lines = [System.IO.File]::ReadAllLines($file)

# Step 1: Add rfqNo and orderNumber state after line 1017 (dueDate state, 0-indexed 1016)
$stateIdx = -1
for ($i = 1010; $i -lt 1025; $i++) {
    if ($lines[$i] -match "setDueDate") {
        $stateIdx = $i
        break
    }
}
if ($stateIdx -ge 0) {
    $newStates = @(
        "  const [rfqNo, setRfqNo] = React.useState('')",
        "  const [orderNumber, setOrderNumber] = React.useState('')"
    )
    $before = $lines[0..$stateIdx]
    $after  = $lines[($stateIdx+1)..($lines.Length-1)]
    $lines  = $before + $newStates + $after
    Write-Host "Step 1 done - rfqNo + orderNumber state added after line $($stateIdx+1)"
} else {
    Write-Host "Step 1 WARNING - dueDate state line not found"
}

# Step 2: Add rfq_no and order_number to the insert (find entry_type: 'DIRECT')
$insertIdx = -1
for ($i = 1045; $i -lt 1065; $i++) {
    if ($lines[$i] -match "entry_type.*DIRECT") {
        $insertIdx = $i
        break
    }
}
if ($insertIdx -ge 0) {
    $lines[$insertIdx] = "        rfq_no: rfqNo.trim() || null, order_number: orderNumber.trim() || null,"
    $lines = $lines[0..$insertIdx] + "        entry_type: 'DIRECT', status: 'PENDING'," + $lines[($insertIdx+1)..($lines.Length-1)]
    Write-Host "Step 2 done - rfq_no + order_number added to insert"
} else {
    Write-Host "Step 2 WARNING - entry_type DIRECT line not found"
}

# Step 3: Add RFQ No + Order No input fields in the form grid (after Due Date input)
$gridIdx = -1
for ($i = 1080; $i -lt 1110; $i++) {
    if ($lines[$i] -match "Due Date \*") {
        $gridIdx = $i
        break
    }
}
if ($gridIdx -ge 0) {
    $newFields = '            <div><label className="block text-xs font-medium text-gray-600 mb-1">RFQ Number</label><input value={rfqNo} onChange={e => setRfqNo(e.target.value)} placeholder="e.g. RFQ-001" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>'
    $newFields2 = '            <div><label className="block text-xs font-medium text-gray-600 mb-1">Order Number</label><input value={orderNumber} onChange={e => setOrderNumber(e.target.value)} placeholder="e.g. PO-2026-001" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>'
    # Find the closing </div> of the due date field to insert after
    $closeIdx = $gridIdx
    for ($j = $gridIdx; $j -lt $gridIdx + 5; $j++) {
        if ($lines[$j] -match "</div></div>$" -or ($lines[$j] -match "^\s+</div>\s*$" -and $j -gt $gridIdx)) {
            $closeIdx = $j
            break
        }
    }
    # Change grid from cols-3 to cols-5 to fit new fields
    $lines[$gridIdx - 1] = $lines[$gridIdx - 1] -replace "grid-cols-3", "grid-cols-5"
    $before = $lines[0..$closeIdx]
    $after  = $lines[($closeIdx+1)..($lines.Length-1)]
    $lines  = $before + $newFields + $newFields2 + $after
    Write-Host "Step 3 done - RFQ + Order input fields added, grid expanded to cols-5"
} else {
    Write-Host "Step 3 WARNING - Due Date field not found"
}

[System.IO.File]::WriteAllLines($file, $lines)
Write-Host "ALL DONE - App.tsx saved"
