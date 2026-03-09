# deploy-panel-edit.ps1
# Replaces RFQDetailPanel with full editable version
# Sections: Quote (Pastel) -> Order (PO) -> Invoice (Pastel)
# Each save advances the card to the next column
# Run from project root: powershell -ExecutionPolicy Bypass -File deploy-panel-edit.ps1

$appTsxPath = Join-Path $PSScriptRoot "src\App.tsx"
if (-not (Test-Path $appTsxPath)) { Write-Host "ERROR: App.tsx not found." -ForegroundColor Red; exit 1 }

Write-Host "Reading App.tsx..." -ForegroundColor Cyan
$content = [System.IO.File]::ReadAllText($appTsxPath, [System.Text.Encoding]::UTF8)

# ── FIND BOUNDARIES ───────────────────────────────────────────────────────────
$startMarker = 'function RFQDetailPanel('
$endMarker   = 'function EmailModal('

$startIdx = $content.IndexOf($startMarker)
$endIdx   = $content.IndexOf($endMarker)

if ($startIdx -lt 0) { Write-Host "ERROR: Cannot find RFQDetailPanel" -ForegroundColor Red; exit 1 }
if ($endIdx -lt 0)   { Write-Host "ERROR: Cannot find EmailModal boundary" -ForegroundColor Red; exit 1 }

Write-Host "Found panel: $startIdx to $endIdx" -ForegroundColor Green

# ── NEW PANEL ─────────────────────────────────────────────────────────────────
$newPanel = @'
function RFQDetailPanel({ rfq, onClose, onUpdate, role }: { rfq: RFQ; onClose: () => void; onUpdate: (rfq: RFQ) => void; role: string | null }) {
  const [lineItems, setLineItems] = React.useState<LineItem[]>([])
  const [loadingItems, setLoadingItems] = React.useState(true)
  const [selectedQuoter, setSelectedQuoter] = React.useState(rfq.assigned_quoter_name || '')
  const [assigning, setAssigning] = React.useState(false)
  const [showEmail, setShowEmail] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [actionMsg, setActionMsg] = React.useState<string | null>(null)

  // Quote fields
  const [quoteNumber, setQuoteNumber] = React.useState(rfq.quote_number || '')
  const [quoteValue, setQuoteValue] = React.useState(rfq.quote_value_excl_vat ? String(rfq.quote_value_excl_vat) : '')
  const [validUntil, setValidUntil] = React.useState(rfq.valid_until || '')

  // Order fields
  const [poNumber, setPoNumber] = React.useState(rfq.po_number || '')
  const [orderNumber, setOrderNumber] = React.useState(rfq.order_number || '')
  const [orderDate, setOrderDate] = React.useState(rfq.order_date || '')

  // Invoice fields
  const [invoiceNumber, setInvoiceNumber] = React.useState(rfq.invoice_number || '')
  const [invoiceDate, setInvoiceDate] = React.useState(rfq.invoice_date || '')
  const [invoiceValue, setInvoiceValue] = React.useState(rfq.invoice_value ? String(rfq.invoice_value) : '')
  const [paymentStatus, setPaymentStatus] = React.useState(rfq.payment_status || '')

  React.useEffect(() => {
    setLoadingItems(true)
    supabase.from('rfq_line_items')
      .select('id, line_number, item_type, description, quantity, unit_of_measure')
      .eq('rfq_id', rfq.id).order('line_number')
      .then(({ data }) => setLineItems(data || []))
      .finally(() => setLoadingItems(false))
  }, [rfq.id])

  const showMsg = (msg: string) => { setActionMsg(msg); setTimeout(() => setActionMsg(null), 3000) }

  const handleAssign = async () => {
    if (!selectedQuoter) return
    setAssigning(true)
    try {
      const { data, error } = await supabase.from('rfqs')
        .update({ assigned_quoter_name: selectedQuoter, status: 'PENDING' })
        .eq('id', rfq.id).select('*, clients(company_name)').single()
      if (error) throw error
      onUpdate(data)
    } catch (e: any) { showMsg('Error: ' + e.message) }
    finally { setAssigning(false) }
  }

  const handleSaveQuote = async () => {
    if (!quoteNumber.trim()) { alert('Please enter the Pastel quote number'); return }
    if (!quoteValue.trim()) { alert('Please enter the quote value'); return }
    setSaving(true)
    try {
      const { data, error } = await supabase.from('rfqs').update({
        quote_number: quoteNumber.trim(),
        quote_value_excl_vat: parseFloat(quoteValue),
        quote_value_incl_vat: parseFloat(quoteValue) * 1.15,
        valid_until: validUntil || null,
        status: 'QUOTED',
      }).eq('id', rfq.id).select('*, clients(company_name)').single()
      if (error) throw error
      onUpdate(data)
      showMsg('Quote saved - card moved to Quoted')
    } catch (e: any) { alert('Error: ' + (e as any).message) }
    finally { setSaving(false) }
  }

  const handleSaveOrder = async () => {
    if (!poNumber.trim()) { alert('Please enter the client PO number'); return }
    setSaving(true)
    try {
      const { data, error } = await supabase.from('rfqs').update({
        po_number: poNumber.trim(),
        order_number: orderNumber || null,
        order_date: orderDate || null,
        status: 'ORDER_RECEIVED',
      }).eq('id', rfq.id).select('*, clients(company_name)').single()
      if (error) throw error
      onUpdate(data)
      showMsg('Order saved - card moved to Order Won')
    } catch (e: any) { alert('Error: ' + (e as any).message) }
    finally { setSaving(false) }
  }

  const handleSaveInvoice = async () => {
    if (!invoiceNumber.trim()) { alert('Please enter the Pastel invoice number'); return }
    setSaving(true)
    try {
      const { data, error } = await supabase.from('rfqs').update({
        invoice_number: invoiceNumber.trim(),
        invoice_date: invoiceDate || null,
        invoice_value: invoiceValue ? parseFloat(invoiceValue) : null,
        payment_status: paymentStatus || null,
        status: 'COMPLETE',
      }).eq('id', rfq.id).select('*, clients(company_name)').single()
      if (error) throw error
      onUpdate(data)
      showMsg('Invoice saved - card moved to Complete')
    } catch (e: any) { alert('Error: ' + (e as any).message) }
    finally { setSaving(false) }
  }

  const enqNo    = rfq.enq_number || rfq.rfq_no || '?'
  const priority = rfq.priority?.toUpperCase() || 'NORMAL'
  const direction = rfq.rfq_direction?.toUpperCase()
  const status   = rfq.status || 'NEW'

  return (
    <>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="text-base font-bold text-gray-900">{enqNo}</span>
              {direction && (
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${direction === 'OUTGOING' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                  {direction}
                </span>
              )}
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_BADGE[priority] || PRIORITY_BADGE['NORMAL']}`}>{priority}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}>{STATUS_LABELS[status] || status}</span>
            </div>
            <p className="text-sm text-gray-500 truncate">{rfq.clients?.company_name || ''}</p>
          </div>
          <button onClick={onClose} className="ml-3 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {actionMsg && <div className="mx-5 mt-3 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{actionMsg}</div>}

          {/* ── ACTIONS ── */}
          <div className="px-5 py-4 border-b border-gray-100 space-y-3">

            {/* Assign Quoter - Hendrik only */}
            {role === 'HENDRIK' && (status === 'NEW' || status === 'PENDING') && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Assign Quoter</p>
                <div className="flex gap-2">
                  <select value={selectedQuoter} onChange={e => setSelectedQuoter(e.target.value)}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                    <option value="">Select quoter...</option>
                    {QUOTERS.map(q => <option key={q} value={q}>{q}</option>)}
                  </select>
                  <button onClick={handleAssign} disabled={!selectedQuoter || assigning}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {assigning ? '...' : status === 'NEW' ? 'Assign' : 'Reassign'}
                  </button>
                </div>
              </div>
            )}

            {/* Send Email button - always visible */}
            <button onClick={() => setShowEmail(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors">
              <Mail size={15} /> Send Email to Client
            </button>
          </div>

          {/* ── QUOTE SECTION (visible when PENDING or QUOTED) ── */}
          {(status === 'PENDING' || status === 'QUOTED') && (
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Quote Information (from Pastel)</p>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Quote Number *</label>
                  <input value={quoteNumber} onChange={e => setQuoteNumber(e.target.value)}
                    placeholder="NE009123"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Value (excl VAT) *</label>
                  <input type="number" value={quoteValue} onChange={e => setQuoteValue(e.target.value)}
                    placeholder="0.00"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Valid Until</label>
                  <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                </div>
              </div>
              {status === 'PENDING' && (
                <button onClick={handleSaveQuote} disabled={saving}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors">
                  {saving ? 'Saving...' : 'Save Quote - Move to Quoted'}
                </button>
              )}
              {status === 'QUOTED' && quoteNumber && (
                <div className="flex items-center gap-2 text-sm text-purple-700 bg-purple-50 px-3 py-2 rounded-lg">
                  <FileText size={14} /> Quote {quoteNumber} - R {parseFloat(quoteValue || '0').toLocaleString('en-ZA', {minimumFractionDigits: 2})} excl VAT
                </div>
              )}
            </div>
          )}

          {/* ── ORDER SECTION (visible when QUOTED or ORDER_RECEIVED) ── */}
          {(status === 'QUOTED' || status === 'SENT_TO_CUSTOMER' || status === 'ORDER_RECEIVED') && (
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Order Information (when won)</p>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Client PO Number *</label>
                  <input value={poNumber} onChange={e => setPoNumber(e.target.value)}
                    placeholder="Client PO"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Order Number</label>
                  <input value={orderNumber} onChange={e => setOrderNumber(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Order Date</label>
                  <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                </div>
              </div>
              {(status === 'QUOTED' || status === 'SENT_TO_CUSTOMER') && (
                <button onClick={handleSaveOrder} disabled={saving}
                  className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors">
                  {saving ? 'Saving...' : 'Save Order - Move to Order Won'}
                </button>
              )}
              {status === 'ORDER_RECEIVED' && poNumber && (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                  <FileText size={14} /> PO: {poNumber} {orderNumber ? '| Order: ' + orderNumber : ''}
                </div>
              )}
            </div>
          )}

          {/* ── INVOICE SECTION (visible when ORDER_RECEIVED or COMPLETE) ── */}
          {(status === 'ORDER_RECEIVED' || status === 'COMPLETE') && (
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Invoice Information (from Pastel)</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Invoice Number *</label>
                  <input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)}
                    placeholder="From Pastel"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Invoice Date</label>
                  <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Invoice Value</label>
                  <input type="number" value={invoiceValue} onChange={e => setInvoiceValue(e.target.value)}
                    placeholder="0.00"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Payment Status</label>
                  <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                    <option value="">Select...</option>
                    <option value="UNPAID">Unpaid</option>
                    <option value="PARTIAL">Partial</option>
                    <option value="PAID">Paid</option>
                  </select>
                </div>
              </div>
              {status === 'ORDER_RECEIVED' && (
                <button onClick={handleSaveInvoice} disabled={saving}
                  className="w-full py-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors">
                  {saving ? 'Saving...' : 'Save Invoice - Move to Complete'}
                </button>
              )}
              {status === 'COMPLETE' && invoiceNumber && (
                <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                  <FileText size={14} /> Invoice {invoiceNumber} {paymentStatus ? '| ' + paymentStatus : ''}
                </div>
              )}
            </div>
          )}

          {/* ── CLIENT INFO ── */}
          <Section title="Client Information" icon={<Building2 size={14} />}>
            <InfoRow label="Company"      value={rfq.clients?.company_name} />
            <InfoRow label="Contact"      value={rfq.contact_person} />
            <InfoRow label="Email"        value={rfq.contact_email} />
            <InfoRow label="Phone"        value={rfq.contact_phone} />
            <InfoRow label="Client RFQ"   value={rfq.client_rfq_number} />
          </Section>

          {/* ── ENQ REPORT ── */}
          <Section title="ENQ Report" icon={<FileText size={14} />}>
            <InfoRow label="Drawing No"       value={rfq.drawing_number} />
            <InfoRow label="Media Received"   value={rfq.media_received} />
            <InfoRow label="Department"       value={rfq.department_cg} />
            <InfoRow label="Actions Required" value={rfq.actions_required} />
            <InfoRow label="Operating Entity" value={rfq.operating_entity} />
            <InfoRow label="Date Received"    value={formatDate(rfq.request_date)} />
            <InfoRow label="Required By"      value={formatDate(rfq.required_date)} />
            {rfq.description && <div className="mb-2"><p className="text-xs text-gray-400 mb-1">Description</p><p className="text-sm text-gray-700">{rfq.description}</p></div>}
            {rfq.special_requirements && <div className="mb-2"><p className="text-xs text-gray-400 mb-1">Special Requirements</p><p className="text-sm text-gray-700">{rfq.special_requirements}</p></div>}
            {rfq.notes && <div className="mb-2"><p className="text-xs text-gray-400 mb-1">Notes</p><p className="text-sm text-gray-700">{rfq.notes}</p></div>}
          </Section>

          {/* ── LINE ITEMS ── */}
          <Section title="Line Items" icon={<Paperclip size={14} />}>
            {loadingItems ? <p className="text-xs text-gray-400">Loading...</p>
              : lineItems.length === 0 ? <p className="text-xs text-gray-400">No line items</p>
              : (
                <table className="w-full text-xs">
                  <thead><tr className="text-gray-400 border-b border-gray-100">
                    <th className="text-left pb-1.5 font-medium">#</th>
                    <th className="text-left pb-1.5 font-medium">Type</th>
                    <th className="text-left pb-1.5 font-medium">Description</th>
                    <th className="text-right pb-1.5 font-medium">Qty</th>
                    <th className="text-left pb-1.5 font-medium pl-1">UOM</th>
                  </tr></thead>
                  <tbody>
                    {lineItems.map(item => (
                      <tr key={item.id} className="border-b border-gray-50">
                        <td className="py-1.5 text-gray-400">{item.line_number}</td>
                        <td className="py-1.5 text-gray-500 pr-2">{item.item_type}</td>
                        <td className="py-1.5 text-gray-700 pr-2">{item.description}</td>
                        <td className="py-1.5 text-right text-gray-700">{item.quantity}</td>
                        <td className="py-1.5 text-gray-500 pl-1">{item.unit_of_measure}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
          </Section>

          {rfq.assigned_quoter_name && (
            <Section title="Assignment" icon={<User size={14} />}>
              <InfoRow label="Assigned To" value={rfq.assigned_quoter_name} />
            </Section>
          )}
        </div>
      </div>
      {showEmail && <EmailModal rfq={rfq} onClose={() => setShowEmail(false)} />}
    </>
  )
}

'@

# ── REPLACE ───────────────────────────────────────────────────────────────────
$before  = $content.Substring(0, $startIdx)
$after   = $content.Substring($endIdx)
$newContent = $before + $newPanel + $after

[System.IO.File]::WriteAllText($appTsxPath, $newContent, [System.Text.Encoding]::ASCII)
Write-Host ""
Write-Host "Done! Editable panel deployed." -ForegroundColor Green
Write-Host ""
Write-Host "What changed:" -ForegroundColor Cyan
Write-Host "  - Quote section: quote number, value, valid until -> moves to Quoted" -ForegroundColor White
Write-Host "  - Order section: PO number, order number, date -> moves to Order Won" -ForegroundColor White
Write-Host "  - Invoice section: invoice number, date, value, payment status -> moves to Complete" -ForegroundColor White
Write-Host "  - Sections appear/hide based on current card status" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANT: Run this SQL in Supabase before testing:" -ForegroundColor Yellow
Write-Host "  ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS quote_number TEXT;" -ForegroundColor White
Write-Host "  ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS quote_value_excl_vat NUMERIC;" -ForegroundColor White
Write-Host "  ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS quote_value_incl_vat NUMERIC;" -ForegroundColor White
Write-Host "  ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS valid_until DATE;" -ForegroundColor White
Write-Host "  ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS po_number TEXT;" -ForegroundColor White
Write-Host "  ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS order_number TEXT;" -ForegroundColor White
Write-Host "  ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS order_date DATE;" -ForegroundColor White
Write-Host "  ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS invoice_number TEXT;" -ForegroundColor White
Write-Host "  ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS invoice_date DATE;" -ForegroundColor White
Write-Host "  ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS invoice_value NUMERIC;" -ForegroundColor White
Write-Host "  ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS payment_status TEXT;" -ForegroundColor White
Write-Host ""
Write-Host "Next: npm run dev" -ForegroundColor Yellow
