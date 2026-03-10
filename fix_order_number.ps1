# ERHA - Remove Order Number field - exact match fix
# Run: powershell -ExecutionPolicy Bypass -File fix_order_number.ps1

$file = "src\App.tsx"
$content = [System.IO.File]::ReadAllText($file)
$fixes = 0

Write-Host "Read $($content.Length) chars"
Write-Host ""

# FIX 1 - Remove orderNumber state (line 771)
$old1 = "  const [orderNumber, setOrderNumber] = React.useState(rfq.order_number || '')"
$new1 = ""
if ($content.Contains($old1)) {
  $content = $content.Replace($old1, $new1)
  Write-Host "FIX 1 OK - orderNumber state removed"
  $fixes++
} else { Write-Host "FIX 1 SKIP" }

# FIX 2 - Remove orderNumber from Supabase update (line 853)
$old2 = "po_number: poNumber.trim(), order_number: orderNumber || null, order_date:"
$new2 = "po_number: poNumber.trim(), order_date:"
if ($content.Contains($old2)) {
  $content = $content.Replace($old2, $new2)
  Write-Host "FIX 2 OK - orderNumber removed from update call"
  $fixes++
} else { Write-Host "FIX 2 SKIP" }

# FIX 3 - Remove Order Number input field from UI (line 978)
$old3 = "                <div><label className=""text-xs font-medium text-gray-600 block mb-1"">Order Number</label><input value={orderNumber} onChange={e => setOrderNumber(e.target.value)} className=""w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"" /></div>"
$new3 = ""
if ($content.Contains($old3)) {
  $content = $content.Replace($old3, $new3)
  Write-Host "FIX 3 OK - Order Number input field removed"
  $fixes++
} else { Write-Host "FIX 3 SKIP" }

# FIX 4 - Remove orderNumber from PO confirmation display (line 982)
$old4 = "PO: {poNumber} {orderNumber ? '| Order: ' + orderNumber : ''}</div>}"
$new4 = "PO: {poNumber}</div>}"
if ($content.Contains($old4)) {
  $content = $content.Replace($old4, $new4)
  Write-Host "FIX 4 OK - orderNumber removed from PO display"
  $fixes++
} else { Write-Host "FIX 4 SKIP" }

Write-Host ""
if ($fixes -gt 0) {
  [System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::ASCII)
  Write-Host "DONE - $fixes fix(es) saved"
  Write-Host "Lines: $($content.Split([char]10).Length)"
} else {
  Write-Host "NO CHANGES MADE"
}
