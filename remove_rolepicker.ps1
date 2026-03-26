$file = "src\App.tsx"
$lines = Get-Content $file

# Remove line 564 (index 563) — the old role picker gate
$lines = $lines[0..562] + $lines[564..($lines.Length-1)]

# Also set currentRole to a default value so role prop still works downstream
# Find the currentRole useState and set default to 'admin'
for ($i = 0; $i -lt $lines.Length; $i++) {
  if ($lines[$i] -match "const \[currentRole, setCurrentRole\] = useState<string \| null>\(null\)") {
    $lines[$i] = "  const [currentRole, setCurrentRole] = useState<string | null>('admin')"
    break
  }
}

$lines | Set-Content $file -Encoding UTF8
Write-Host "Role picker removed. Lines: $($lines.Length)"
