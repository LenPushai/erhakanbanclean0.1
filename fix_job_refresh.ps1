# ERHA - Fix Job Board refresh after Order Won
# Run from project root: powershell -ExecutionPolicy Bypass -File fix_job_refresh.ps1

$file = "src\App.tsx"
$content = [System.IO.File]::ReadAllText($file)
$fixes = 0

Write-Host "Read $($content.Length) chars from $file"
Write-Host ""

# ============================================================
# FIX 1: Pass onJobCreated prop to RFQDetailPanel in JSX
# ============================================================
$old1 = '{selectedRFQ && <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"><RFQDetailPanel rfq={selectedRFQ} onClose={() => setSelectedRFQ(null)} onUpdate={handleRFQUpdate} role={currentRole} /></div>}'
$new1 = '{selectedRFQ && <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"><RFQDetailPanel rfq={selectedRFQ} onClose={() => setSelectedRFQ(null)} onUpdate={handleRFQUpdate} role={currentRole} onJobCreated={fetchJobs} /></div>}'

if ($content.Contains($old1)) {
  $content = $content.Replace($old1, $new1)
  Write-Host "FIX 1 OK - onJobCreated prop added to RFQDetailPanel JSX"
  $fixes++
} else {
  Write-Host "FIX 1 SKIP - already applied or not found"
}

# ============================================================
# FIX 2: Add onJobCreated to RFQDetailPanel function signature
# ============================================================
$old2 = 'function RFQDetailPanel({ rfq, onClose, onUpdate, role }: { rfq: RFQ; onClose: () => void; onUpdate: (rfq: RFQ) => void; role: string | null }) {'
$new2 = 'function RFQDetailPanel({ rfq, onClose, onUpdate, role, onJobCreated }: { rfq: RFQ; onClose: () => void; onUpdate: (rfq: RFQ) => void; role: string | null; onJobCreated?: () => void }) {'

if ($content.Contains($old2)) {
  $content = $content.Replace($old2, $new2)
  Write-Host "FIX 2 OK - onJobCreated added to RFQDetailPanel signature"
  $fixes++
} else {
  Write-Host "FIX 2 SKIP - already applied or not found"
}

# ============================================================
# FIX 3: Call onJobCreated after successful job insert
# ============================================================
$old3 = '      } else {
        showMsg(''Order won - Job created on Job Board!'')
      }'
$new3 = '      } else {
        showMsg(''Order won - Job created on Job Board!'')
        if (onJobCreated) onJobCreated()
      }'

if ($content.Contains($old3)) {
  $content = $content.Replace($old3, $new3)
  Write-Host "FIX 3 OK - onJobCreated() called after job insert"
  $fixes++
} else {
  Write-Host "FIX 3 SKIP - already applied or not found"
}

# ============================================================
# WRITE FILE
# ============================================================
Write-Host ""
if ($fixes -gt 0) {
  [System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::ASCII)
  Write-Host "DONE - $fixes fix(es) applied and saved as ASCII"
  Write-Host "Lines: $($content.Split([char]10).Length)"
  Write-Host ""
  Write-Host "Next steps:"
  Write-Host "  1. Check browser - open RFQ in Quoted/Sent status"
  Write-Host "  2. Enter PO number - click Save Order"
  Write-Host "  3. Toast should say: Order won - Job created on Job Board!"
  Write-Host "  4. Click Job Board - job appears in Pending column"
  Write-Host "  5. npm run build - drag dist to Netlify"
} else {
  Write-Host "NO CHANGES MADE - all fixes already applied"
}
