# deploy-email-modal-attachments.ps1
# Replaces EmailModal function with attachment-enabled version
# Run from project root: powershell -ExecutionPolicy Bypass -File deploy-email-modal-attachments.ps1

$f = Join-Path $PSScriptRoot "src\App.tsx"
if (-not (Test-Path $f)) { Write-Host "ERROR: App.tsx not found." -ForegroundColor Red; exit 1 }

$lines = [System.IO.File]::ReadAllLines($f)
$total = $lines.Count
Write-Host "Total lines: $total" -ForegroundColor Cyan

# Find EmailModal start and end
$startLine = -1
$endLine = -1
for ($i = 0; $i -lt $total; $i++) {
    if ($lines[$i] -match 'function EmailModal\(' -and $startLine -lt 0) { $startLine = $i }
    if ($startLine -gt 0 -and $lines[$i] -match '^function ' -and $i -gt $startLine) { $endLine = $i; break }
    if ($startLine -gt 0 -and $lines[$i] -match '^// ') { $endLine = $i; break }
}

Write-Host "EmailModal start: $startLine  End: $endLine" -ForegroundColor Green

if ($startLine -lt 0 -or $endLine -lt 0) {
    Write-Host "ERROR: Could not find EmailModal boundaries" -ForegroundColor Red
    exit 1
}

$newModal = @'
function EmailModal({ rfq, onClose }: { rfq: RFQ; onClose: () => void }) {
  const template = EMAIL_TEMPLATES[rfq.status] || EMAIL_TEMPLATES['NEW']
  const enqNo = rfq.enq_number || rfq.rfq_no || '-'
  const contactName = rfq.contact_person || 'Sir/Madam'
  const [to, setTo] = useState(rfq.contact_email || '')
  const [subject, setSubject] = useState(template.subject.replace('{enq}', enqNo))
  const [body, setBody] = useState(template.body.replace(/\{enq\}/g, enqNo).replace('{contact}', contactName))
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [rfqAttachments, setRfqAttachments] = useState<any[]>([])
  const [selectedAttachments, setSelectedAttachments] = useState<string[]>([])

  React.useEffect(() => {
    supabase.from('rfq_attachments')
      .select('id, file_name, file_path')
      .eq('rfq_id', rfq.id)
      .then(({ data }) => setRfqAttachments(data || []))
  }, [rfq.id])

  const toggleAttachment = (id: string) => {
    setSelectedAttachments(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleSend = async () => {
    if (!to) { alert('Please enter a recipient email address'); return }
    setSending(true)
    try {
      const apiKey = import.meta.env.VITE_RESEND_API_KEY
      if (!apiKey) throw new Error('Resend API key not configured')

      // Build attachments array - fetch each selected file and base64 encode
      const attachments: { filename: string; content: string }[] = []
      for (const att of rfqAttachments.filter(a => selectedAttachments.includes(a.id))) {
        const { data, error } = await supabase.storage
          .from('rfq-attachments')
          .download(att.file_path)
        if (!error && data) {
          const buffer = await data.arrayBuffer()
          const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
          attachments.push({ filename: att.file_name, content: base64 })
        }
      }

      const payload: any = {
        from: 'ERHA Operations <onboarding@resend.dev>',
        to: [to],
        subject: subject,
        text: body,
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#1e3a5f;color:white;padding:20px 24px;border-radius:8px 8px 0 0;">
            <h2 style="margin:0;font-size:18px;">ERHA Fabrication &amp; Construction</h2>
            <p style="margin:4px 0 0;font-size:13px;opacity:0.8;">${enqNo}</p>
          </div>
          <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;white-space:pre-line;">${body.replace(/\n/g,'<br>')}</div>
          <p style="font-size:11px;color:#9ca3af;margin-top:12px;text-align:center;">ERHA Operations System</p>
        </div>`,
      }

      if (attachments.length > 0) payload.attachments = attachments

      const res = await fetch('http://localhost:3001/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Send failed')
      }

      setSent(true)
      setTimeout(onClose, 1500)
    } catch (err: any) {
      alert('Failed to send email: ' + err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Send Email - {enqNo}</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">To</label>
            <input value={to} onChange={e => setTo(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              placeholder="client@email.com" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Subject</label>
            <input value={subject} onChange={e => setSubject(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Message</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={7}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none" />
          </div>
          {rfqAttachments.length > 0 && (
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-2">Attach Files</label>
              <div className="space-y-1.5">
                {rfqAttachments.map(att => (
                  <label key={att.id} className="flex items-center gap-3 px-3 py-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input type="checkbox"
                      checked={selectedAttachments.includes(att.id)}
                      onChange={() => toggleAttachment(att.id)}
                      className="accent-orange-500" />
                    <FileText size={13} className="text-gray-400 shrink-0" />
                    <span className="text-xs font-medium text-gray-700 truncate">{att.file_name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={handleSend} disabled={!to || sending || sent}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors">
            <Send size={14} />{sent ? 'Sent!' : sending ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      </div>
    </div>
  )
}

'@

$before = $lines[0..($startLine - 1)]
$after  = $lines[$endLine..($lines.Count - 1)]

$newLines = New-Object System.Collections.Generic.List[string]
foreach ($line in $before) { $newLines.Add($line) }
foreach ($line in $newModal -split "`n") { $newLines.Add($line.TrimEnd("`r")) }
foreach ($line in $after)  { $newLines.Add($line) }

Copy-Item $f "$f.bak" -Force
Write-Host "Backup: App.tsx.bak" -ForegroundColor Yellow
[System.IO.File]::WriteAllLines($f, $newLines.ToArray(), [System.Text.Encoding]::ASCII)

Write-Host "Done! EmailModal now supports attachments." -ForegroundColor Green
Write-Host "New line count: $($newLines.Count)" -ForegroundColor Cyan
