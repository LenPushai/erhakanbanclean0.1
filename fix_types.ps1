$file = "src\App.tsx"
$lines = [System.IO.File]::ReadAllLines($file)
$lines[789] = "const getActionSet=(str:string|null|undefined)=>new Set((str||'').toUpperCase().split(',').map((s:string)=>s.trim()));"
[System.IO.File]::WriteAllLines($file, $lines)
Write-Host "Done - line 790 typed"
