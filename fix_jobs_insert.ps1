# ERHA - Fix jobs insert - remove bad columns
# Run: powershell -ExecutionPolicy Bypass -File fix_jobs_insert.ps1

$file = "src\App.tsx"
$content = [System.IO.File]::ReadAllText($file)

Write-Host "Read $($content.Length) chars from $file"

$old = '      const { error: jobError } = await supabase.from(''jobs'').insert({
        rfq_id: rfq.id,
        rfq_no: rfq.rfq_no || rfq.enq_number,
        enq_number: rfq.enq_number,
        client_name: rfq.clients?.company_name || null,
        description: rfq.description,
        po_number: poNumber.trim(),
        status: ''PENDING'',
        priority: rfq.priority || ''NORMAL'',
      })'

$new = '      const { error: jobError } = await supabase.from(''jobs'').insert({
        rfq_id: rfq.id,
        client_name: rfq.clients?.company_name || null,
        description: rfq.description,
        po_number: poNumber.trim(),
        status: ''PENDING'',
        priority: rfq.priority || ''NORMAL'',
      })'

if ($content.Contains($old)) {
  $content = $content.Replace($old, $new)
  [System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::ASCII)
  Write-Host "FIX OK - bad columns removed from jobs insert"
  Write-Host "Lines: $($content.Split([char]10).Length)"
  Write-Host ""
  Write-Host "DONE - now:"
  Write-Host "  1. Run in Supabase SQL editor: NOTIFY pgrst, 'reload schema';"
  Write-Host "  2. Test Save Order on an RFQ"
  Write-Host "  3. Job should appear in Pending on Job Board"
} else {
  Write-Host "SKIP - already fixed or pattern not found"
}
