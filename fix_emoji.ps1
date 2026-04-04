$file = "src\App.tsx"
$lines = Get-Content $file -Encoding UTF8

for ($i = 0; $i -lt $lines.Length; $i++) {
  if ($lines[$i] -match "key: 'workers'" -and $lines[$i] -match "label:") {
    $lines[$i] = "    { key: 'workers',   label: 'Workers'   },"
  }
  if ($lines[$i] -match "key: 'time'" -and $lines[$i] -match "label:") {
    $lines[$i] = "    { key: 'time',      label: 'Time'      },"
  }
  if ($lines[$i] -match "key: 'qc'" -and $lines[$i] -match "label:") {
    $lines[$i] = "    { key: 'qc',        label: 'QC'        },"
  }
  if ($lines[$i] -match "key: 'materials'" -and $lines[$i] -match "label:") {
    $lines[$i] = "    { key: 'materials', label: 'Materials' },"
  }
}

[System.IO.File]::WriteAllText($file, ($lines -join "`r`n"), [System.Text.Encoding]::UTF8)
Write-Host "Done. Lines: $($lines.Length)"
