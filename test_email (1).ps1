$body = '{"to":["lenklopper03@gmail.com"],"subject":"ERHA Test Email","html":"<h2>ERHA Email Working!</h2><p>Test from edge function.</p>"}'
$headers = @{ 'Content-Type' = 'application/json' }
try {
    $response = Invoke-RestMethod -Uri 'https://lvaqqqyjqtguozmdjmfn.supabase.co/functions/v1/send-email' -Method POST -Headers $headers -Body $body
    Write-Host "SUCCESS:" -ForegroundColor Green
    $response | ConvertTo-Json
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    $_.Exception.Response | ConvertTo-Json
}
