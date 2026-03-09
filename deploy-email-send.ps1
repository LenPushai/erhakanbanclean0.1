# deploy-email-send.ps1
# Wires EmailModal to Resend API for real email sending
# Run from project root: powershell -ExecutionPolicy Bypass -File deploy-email-send.ps1

$appTsxPath = Join-Path $PSScriptRoot "src\App.tsx"

if (-not (Test-Path $appTsxPath)) {
    Write-Host "ERROR: App.tsx not found. Run from project root." -ForegroundColor Red
    exit 1
}

Write-Host "Reading App.tsx..." -ForegroundColor Cyan
$content = [System.IO.File]::ReadAllText($appTsxPath, [System.Text.Encoding]::UTF8)

# ── OLD handleSend (fake setTimeout version) ──────────────────────────────────
$oldSend = '  const handleSend = async () => {
    setSending(true)
    await new Promise(r => setTimeout(r, 1000))
    setSending(false); setSent(true)
    setTimeout(onClose, 1500)
  }'

# ── NEW handleSend (real Resend API call) ─────────────────────────────────────
$newSend = '  const handleSend = async () => {
    if (!to) { alert(''Please enter a recipient email address''); return }
    setSending(true)
    try {
      const apiKey = import.meta.env.VITE_RESEND_API_KEY
      if (!apiKey) throw new Error(''Resend API key not configured'')

      const res = await fetch(''https://api.resend.com/emails'', {
        method: ''POST'',
        headers: {
          ''Authorization'': `Bearer ${apiKey}`,
          ''Content-Type'': ''application/json'',
        },
        body: JSON.stringify({
          from: ''ERHA Operations <onboarding@resend.dev>'',
          to: [to],
          subject: subject,
          text: body,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:#1e3a5f;color:white;padding:20px 24px;border-radius:8px 8px 0 0;">
              <h2 style="margin:0;font-size:18px;">ERHA Fabrication &amp; Construction</h2>
              <p style="margin:4px 0 0;font-size:13px;opacity:0.8;">${enqNo}</p>
            </div>
            <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;white-space:pre-line;">${body.replace(/\n/g,''<br>'')}</div>
            <p style="font-size:11px;color:#9ca3af;margin-top:12px;text-align:center;">ERHA Operations System</p>
          </div>`,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || ''Send failed'')
      }

      setSent(true)
      setTimeout(onClose, 1500)
    } catch (err: any) {
      alert(''Failed to send email: '' + err.message)
    } finally {
      setSending(false)
    }
  }'

# ── APPLY REPLACEMENT ─────────────────────────────────────────────────────────
if ($content.IndexOf($oldSend) -lt 0) {
    Write-Host "ERROR: Could not find the old handleSend function." -ForegroundColor Red
    Write-Host "The EmailModal may have already been updated." -ForegroundColor Yellow
    exit 1
}

$newContent = $content.Replace($oldSend, $newSend)
[System.IO.File]::WriteAllText($appTsxPath, $newContent, [System.Text.Encoding]::ASCII)

Write-Host ""
Write-Host "Done! EmailModal now sends real emails via Resend." -ForegroundColor Green
Write-Host ""
Write-Host "What changed:" -ForegroundColor Cyan
Write-Host "  - Fake setTimeout replaced with real Resend API call" -ForegroundColor White
Write-Host "  - Sends from: ERHA Operations <onboarding@resend.dev>" -ForegroundColor White
Write-Host "  - Professional HTML email template with ERHA branding" -ForegroundColor White
Write-Host "  - Error handling - shows alert if send fails" -ForegroundColor White
Write-Host ""
Write-Host "Next: npm run dev  then test Send Email on a card" -ForegroundColor Yellow
Write-Host ""
Write-Host "NOTE: During dev, Resend only delivers to verified addresses." -ForegroundColor Magenta
Write-Host "      All test emails go to lenklopper03@gmail.com" -ForegroundColor Magenta
