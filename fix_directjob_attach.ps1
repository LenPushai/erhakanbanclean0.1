$file = "src\App.tsx"
$lines = [System.IO.File]::ReadAllLines($file)

# Step 1: Add pendingFiles state after lineItems state
$lineItemsIdx = -1
for ($i = 1018; $i -lt 1030; $i++) {
    if ($lines[$i] -match "setLineItems.*useState") {
        $lineItemsIdx = $i
        break
    }
}
if ($lineItemsIdx -ge 0) {
    $newState = "  const [pendingFiles, setPendingFiles] = React.useState<File[]>([])"
    $before = $lines[0..$lineItemsIdx]
    $after  = $lines[($lineItemsIdx+1)..($lines.Length-1)]
    $lines  = $before + $newState + $after
    Write-Host "Step 1 done - pendingFiles state added after line $($lineItemsIdx+1)"
} else {
    Write-Host "Step 1 WARNING - lineItems state not found"
}

# Step 2: After job insert succeeds and validItems inserted, upload attachments
# Find "onCreated()" line inside handleCreate
$onCreatedIdx = -1
for ($i = 1060; $i -lt 1080; $i++) {
    if ($lines[$i] -match "onCreated\(\)") {
        $onCreatedIdx = $i
        break
    }
}
if ($onCreatedIdx -ge 0) {
    $uploadBlock = @(
        "      if (pendingFiles.length > 0) {",
        "        for (const file of pendingFiles) {",
        "          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')",
        "          const filePath = `${job.id}/${Date.now()}-${safeName}`",
        "          const { error: upErr } = await supabase.storage.from('rfq-attachments').upload(filePath, file)",
        "          if (!upErr) {",
        "            await supabase.from('job_attachments').insert({ job_id: job.id, file_name: file.name, file_path: filePath, file_size: file.size })",
        "          }",
        "        }",
        "      }"
    )
    $before = $lines[0..($onCreatedIdx-1)]
    $after  = $lines[$onCreatedIdx..($lines.Length-1)]
    $lines  = $before + $uploadBlock + $after
    Write-Host "Step 2 done - attachment upload block added before onCreated()"
} else {
    Write-Host "Step 2 WARNING - onCreated() not found in handleCreate"
}

# Step 3: Add attachment UI before Notes section
# Find Notes label in the modal
$notesIdx = -1
for ($i = 1130; $i -lt 1200; $i++) {
    if ($lines[$i] -match "Additional notes") {
        $notesIdx = $i
        break
    }
}
# Go back to find the opening <div> of the Notes section
if ($notesIdx -ge 0) {
    $notesDivIdx = $notesIdx - 1
    for ($j = $notesIdx; $j -gt $notesIdx - 5; $j--) {
        if ($lines[$j] -match "^\s+<div>") {
            $notesDivIdx = $j
            break
        }
    }
    $attachUI = @(
        "          <div>",
        "            <label className=""block text-xs font-medium text-gray-600 mb-1"">Attachments</label>",
        "            <label className={`flex items-center gap-3 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors border-gray-300 hover:border-blue-400 hover:bg-blue-50`}>",
        "              <Paperclip size={16} className=""text-gray-400"" />",
        "              <div>",
        "                <p className=""text-sm font-medium text-gray-700"">Click to attach files</p>",
        "                <p className=""text-xs text-gray-400"">Any file type — multiple allowed</p>",
        "              </div>",
        "              <input type=""file"" multiple className=""hidden"" onChange={(e) => {",
        "                if (e.target.files) setPendingFiles(prev => [...prev, ...Array.from(e.target.files!)])",
        "                e.target.value = ''",
        "              }} />",
        "            </label>",
        "            {pendingFiles.length > 0 && (",
        "              <div className=""space-y-1 mt-2"">",
        "                {pendingFiles.map((f, i) => (",
        "                  <div key={i} className=""flex items-center justify-between px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-100"">",
        "                    <span className=""text-xs font-medium text-blue-700 truncate"">{f.name}</span>",
        "                    <button type=""button"" onClick={() => setPendingFiles(prev => prev.filter((_, idx) => idx !== i))} className=""ml-2 text-red-400 hover:text-red-600""><X size={12} /></button>",
        "                  </div>",
        "                ))}",
        "              </div>",
        "            )}",
        "          </div>"
    )
    $before = $lines[0..($notesDivIdx-1)]
    $after  = $lines[$notesDivIdx..($lines.Length-1)]
    $lines  = $before + $attachUI + $after
    Write-Host "Step 3 done - attachment UI added before Notes at line $($notesDivIdx+1)"
} else {
    Write-Host "Step 3 WARNING - Notes textarea not found"
}

[System.IO.File]::WriteAllLines($file, $lines)
Write-Host "ALL DONE - App.tsx saved"
