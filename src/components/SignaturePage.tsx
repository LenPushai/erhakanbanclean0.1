// E-sign /sign/:token landing page. Bypasses the main app shell (no
// RoleSelector, no kanban) since signers arrive via emailed link without an
// app session. Stage 1 ('manager') renders the full sign-off interface.
// Stage 2 ('client') is checkpoint-pending — renders a placeholder so a
// Stage 2 token clicked during smoke testing surfaces gracefully without
// exposing a half-built customer flow.

import { useState, useEffect, useRef } from 'react'
import type React from 'react'
import { supabase } from '../lib/supabase'
import { EMAIL_TO_NAME } from '../emailRecipients'

interface TokenRecord {
  rfq_id: string
  signature_stage: string
}

interface RFQRecord {
  id: string
  rfq_no: string | null
  enq_number?: string | null
  quote_number: string | null
  description: string | null
  quote_value_excl_vat: number | null
  quote_value_incl_vat: number | null
  operating_entity: string | null
  contact_person: string | null
  clients?: { company_name: string } | null
}

export function SignaturePage() {
  const token = (typeof window !== 'undefined'
    ? window.location.pathname.replace(/^\/sign\//, '').split(/[/?#]/)[0]
    : '')
  const [loading, setLoading] = useState(true)
  const [tokenRecord, setTokenRecord] = useState<TokenRecord | null>(null)
  const [rfq, setRfq] = useState<RFQRecord | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [signerName, setSignerName] = useState('')
  const [signerTitle, setSignerTitle] = useState('')
  // Stage 2 only — customer types their own company. Stage 1 derives from the
  // RFQ's operating_entity server-side and ignores this field.
  const [signerCompany, setSignerCompany] = useState('')
  const [signatureType, setSignatureType] = useState<'click' | 'drawn'>('click')
  const [signatureData, setSignatureData] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)

  useEffect(() => {
    void (async () => {
      try {
        if (!token || token.length < 10) { setErrorMsg('Invalid sign link.'); return }
        const res = await fetch('/api/sign-validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          setErrorMsg(err.error || 'Could not validate sign link.')
          return
        }
        const tk = await res.json()
        setTokenRecord({ rfq_id: tk.rfq_id, signature_stage: tk.signature_stage })
        const { data: rfqRow, error: rerr } = await supabase
          .from('rfqs').select('*, clients(company_name)').eq('id', tk.rfq_id).maybeSingle()
        if (rerr) throw rerr
        setRfq(rfqRow as RFQRecord)
        // Stage 1 (manager) pre-fills from the known internal-user lookup so
        // Hendrik doesn't have to retype his name. Stage 2 (customer) leaves
        // the field blank — the customer types their own name from scratch.
        if (tk.signature_stage === 'manager') {
          setSignerName(EMAIL_TO_NAME[tk.client_email] || tk.client_name || '')
        } else {
          setSignerName('')
        }
      } catch (e: any) {
        setErrorMsg('Could not load sign page: ' + e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [token])

  const pointFromEvent = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const point = 'touches' in e ? e.touches[0] : e
    return { x: point.clientX - rect.left, y: point.clientY - rect.top }
  }
  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    drawingRef.current = true; setSignatureType('drawn')
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    const { x, y } = pointFromEvent(e, canvas); ctx.beginPath(); ctx.moveTo(x, y)
  }
  const moveDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawingRef.current) return
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    const { x, y } = pointFromEvent(e, canvas)
    ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = '#1f2937'
    ctx.lineTo(x, y); ctx.stroke()
  }
  const endDraw = () => {
    drawingRef.current = false
    const canvas = canvasRef.current
    if (canvas) setSignatureData(canvas.toDataURL('image/png'))
  }
  const clearCanvas = () => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setSignatureData(''); setSignatureType('click')
  }

  const handleSubmit = async () => {
    if (!signerName.trim()) { alert('Please enter your name.'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/sign-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          signer_name: signerName.trim(),
          signer_title: signerTitle.trim() || null,
          signer_company: tokenRecord?.signature_stage === 'client' ? (signerCompany.trim() || null) : null,
          signature_type: signatureType,
          signature_data: signatureData || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submission failed')
      setDone(true)
    } catch (e: any) { alert('Could not submit signature: ' + e.message) }
    finally { setSubmitting(false) }
  }

  if (loading) return <Centered><span className="text-gray-500">Loading sign link...</span></Centered>
  if (errorMsg) return <ErrorState msg={errorMsg} />
  if (done) return <SuccessState stage={tokenRecord?.signature_stage} />
  if (!tokenRecord || !rfq) return <ErrorState msg="Sign link payload missing." />

  const isManager = tokenRecord.signature_stage === 'manager'
  const enq = rfq.rfq_no || rfq.enq_number || '-'
  const valueLine = rfq.quote_value_excl_vat
    ? `R ${Number(rfq.quote_value_excl_vat).toLocaleString('en-ZA')} excl VAT`
    : '-'
  const headerTitle = isManager ? 'Internal Quote Sign-off' : 'Quote Acceptance'
  const submitLabel = isManager
    ? (signatureType === 'drawn' && signatureData ? 'Submit Signed Approval' : 'I Approve')
    : (signatureType === 'drawn' && signatureData ? 'Submit Signed Acceptance' : 'I Accept')
  const disclaimerText = isManager
    ? "By signing or clicking 'I Approve', you acknowledge that this signature is legally binding under the Electronic Communications and Transactions Act 25 of 2002."
    : "By signing or clicking 'I Accept', you acknowledge that this signature is legally binding under the Electronic Communications and Transactions Act 25 of 2002."
  const canvasHelp = isManager
    ? 'Draw your signature, or use the I Approve button below.'
    : 'Draw your signature, or use the I Accept button below.'

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white px-6 py-5">
          <h1 className="text-xl font-bold">{headerTitle}</h1>
          <p className="text-sm opacity-80 mt-1">{enq}{rfq.quote_number ? ` · ${rfq.quote_number}` : ''}</p>
        </div>
        <div className="p-6 space-y-5">
          <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
            <p><strong>Client:</strong> {rfq.clients?.company_name || '-'}</p>
            <p><strong>Description:</strong> {rfq.description || '-'}</p>
            <p><strong>Quote value (excl VAT):</strong> {valueLine}</p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Your name</label>
              <input value={signerName} onChange={e => setSignerName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Full name" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Title (optional)</label>
              <input value={signerTitle} onChange={e => setSignerTitle(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Director" />
            </div>
            {!isManager && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Company (optional)</label>
                <input value={signerCompany} onChange={e => setSignerCompany(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. ACME Industries" />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Signature</label>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <canvas ref={canvasRef} width={560} height={160} className="w-full bg-white touch-none"
                  onMouseDown={startDraw} onMouseMove={moveDraw} onMouseUp={endDraw} onMouseLeave={endDraw}
                  onTouchStart={startDraw} onTouchMove={moveDraw} onTouchEnd={endDraw} />
              </div>
              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="text-gray-500">{canvasHelp}</span>
                <button onClick={clearCanvas} className="text-blue-600 hover:underline">Clear</button>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900">
              {disclaimerText}
            </div>
            <button disabled={submitting} onClick={handleSubmit}
              className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-semibold py-3 rounded-lg">
              {submitting ? 'Submitting...' : submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">{children}</div>
}
function ErrorState({ msg }: { msg: string }) {
  return (<Centered>
    <div className="max-w-md bg-white rounded-xl shadow p-6 text-center">
      <div className="text-red-600 text-4xl mb-3">!</div>
      <h1 className="text-lg font-bold text-gray-900 mb-1">Sign link cannot be used</h1>
      <p className="text-sm text-gray-600">{msg}</p>
    </div>
  </Centered>)
}
function SuccessState({ stage }: { stage?: string }) {
  const title = stage === 'manager' ? 'Quote approved'
    : stage === 'client' ? 'Quote accepted - thank you'
    : 'Signature recorded'
  const body = stage === 'manager' ? 'The RFQ has moved to "Quote Approved" and is ready for PO capture and Order Won.'
    : stage === 'client' ? 'ERHA will be in touch shortly to confirm next steps.'
    : 'Thank you.'
  return (<Centered>
    <div className="max-w-md bg-white rounded-xl shadow p-6 text-center">
      <div className="text-green-600 text-4xl mb-3">✓</div>
      <h1 className="text-lg font-bold text-gray-900 mb-1">{title}</h1>
      <p className="text-sm text-gray-600">{body}</p>
    </div>
  </Centered>)
}
