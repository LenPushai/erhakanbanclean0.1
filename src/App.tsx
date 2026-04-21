import React from 'react';
import { useState, useEffect } from 'react'
import { ClipboardList, Briefcase, ChevronRight, ChevronDown, ChevronUp, Factory, Building2, Calendar, Hash, RefreshCw, ArrowDownToLine, ArrowUpFromLine, X, Mail, FileText, Paperclip, Send, Plus, Check, Printer, Upload, Package, Search, Filter, Edit3, XCircle, Trash2, Eye, CheckCircle, ShoppingCart, Download, Truck, DollarSign, AlertTriangle, Receipt, Users, Settings }  from 'lucide-react'
import { supabase } from './lib/supabase'
import { emailRFQCreated, emailQuoterAssigned, emailQuoteReady, emailOrderWon, emailJobInReview, emailJobReadyToPrint, emailJobPrinted, emailChildJobSpawned, emailJobStarted, emailJobQCCheck, emailJobComplete, emailJobDispatched } from './emailService'
import { format } from 'date-fns'
import { useEntity, type OperatingEntity } from './contexts/EntityContext'
import { EntitySwitcher } from './components/EntitySwitcher'

type Board = 'rfq' | 'job' | 'workshop' | 'procurement' | 'clients' | 'settings'

interface Client {
  id: string
  company_name: string
  is_active: boolean
  deactivation_reason?: string | null
  created_at?: string
}

interface ClientContact {
  id: string
  client_id: string
  contact_name: string
  contact_phone: string | null
  contact_email: string | null
  department: string | null
  is_primary: boolean
  created_at?: string
}

interface Supplier {
  id: string
  company_name: string
  contact_person: string | null
  phone: string | null
  email: string | null
  account_number: string | null
  payment_terms: string | null
  is_active: boolean
  deactivation_reason: string | null
  created_at: string
  updated_at: string
}

interface PurchaseRequest {
  id: string
  pr_number: string | null
  supplier_id: string | null
  job_id: string | null
  required_by_date: string | null
  status: string
  total_estimated_value: number | null
  raised_by: string | null
  approved_by: string | null
  approved_at: string | null
  rejection_reason: string | null
  operating_entity: string | null
  created_at: string
  updated_at: string
  suppliers?: { company_name: string } | null
  jobs?: { job_number: string; description: string | null } | null
}

interface PRLineItem {
  id: string
  purchase_request_id: string
  description: string
  quantity: number
  uom: string | null
  estimated_unit_price: number | null
  estimated_total: number | null
}

interface PurchaseOrder {
  id: string
  purchase_request_id: string | null
  supplier_id: string | null
  job_id: string | null
  po_number: string
  status: string
  total_value: number | null
  issued_by: string | null
  issued_at: string | null
  required_by_date: string | null
  operating_entity: string | null
  created_at: string
  updated_at: string
  suppliers?: { company_name: string; contact_person: string | null; phone: string | null; email: string | null; account_number: string | null } | null
  jobs?: { job_number: string; description: string | null } | null
  purchase_requests?: { pr_number: string | null } | null
}

interface POLineItem {
  id: string
  po_id: string
  description: string
  quantity_ordered: number
  quantity_received: number
  uom: string | null
  unit_price: number | null
  total_price: number | null
}

interface SupplierInvoice {
  id: string
  po_id: string
  supplier_id: string
  invoice_number: string
  invoice_date: string
  invoice_value: number
  payment_due_date: string | null
  pdf_url: string | null
  status: string
  match_result: any | null
  captured_by: string | null
  authorised_by: string | null
  authorised_at: string | null
  created_at: string
  updated_at: string
  suppliers?: { company_name: string } | null
  purchase_orders?: { po_number: string; total_value: number | null } | null
}

interface RFQ {
  id: string
  rfq_no: string
  enq_number: string
  client_rfq_number: string | null
  additional_reference: string | null
  rfq_direction: string | null
  description: string
  status: string
  priority: string
  request_date: string | null
  required_date: string | null
  contact_person: string | null
  contact_email: string | null
  contact_phone: string | null
  assigned_quoter_name: string | null
  drawing_number: string | null
  requested_by: string | null
  media_received: string | null
  department_cg: string | null
  actions_required: string | null
  operating_entity: string | null
  special_requirements: string | null
  notes: string | null
  remarks: string | null
  created_at: string
  entry_type: string | null
  assigned_employee_name: string | null
  assigned_supervisor_name: string | null
  is_contract_work: boolean | null
  site_req: string | null
  quote_number?: string | null
  quote_value_excl_vat?: number | null
  quote_value_incl_vat?: number | null
  valid_until?: string | null
  po_number?: string | null
  order_number?: string | null
  order_date?: string | null
  invoice_number?: string | null
  invoice_date?: string | null
  invoice_value?: number | null
  payment_status?: string | null
  job_number?: string | null
  clients?: { company_name: string } | null
}

interface Job {
  id: string
  job_number: string
  operating_entity: string | null
  rfq_id: string | null
  rfq_no: string | null
  enq_number: string | null
  client_name: string | null
  description: string | null
  status: string
  priority: string
  work_type: string | null
  po_number: string | null
  assigned_to: string | null
  supervisor: string | null
  is_emergency: boolean
  due_date: string | null
  notes: string | null
  created_at: string
  entry_type?: string | null
  is_parent?: boolean | null
  is_child_job?: boolean | null
  parent_job_id?: string | null
  is_contract_work?: boolean | null
  date_received?: string | null
  site_req?: string | null
  contact_person?: string | null
  contact_phone?: string | null
  contact_email?: string | null
  compiled_by?: string | null
  special_requirements?: string | null
  assigned_employee_name?: string | null
  assigned_supervisor_name?: string | null
  drawing_number?: string | null
  has_drawing?: boolean | null
  has_service_schedule?: boolean | null
  has_internal_order?: boolean | null
  has_qcp?: boolean | null
  has_info_for_quote?: boolean | null
  action_manufacture?: boolean | null
  action_sandblast?: boolean | null
  action_prepare_material?: boolean | null
  action_service?: boolean | null
  action_paint?: boolean | null
  action_repair?: boolean | null
  action_installation?: boolean | null
  action_cut?: boolean | null
  action_modify?: boolean | null
  action_other?: boolean | null
  client_rfq_number?: string | null
  workshop_status?: string | null
  workshop_notes?: string | null
  time_started_at?: string | null
  time_total_minutes?: number | null
}

interface LineItem {
  id: string
  line_number: number
  item_type: string | null
  description: string
  quantity: number | null
  unit_of_measure: string | null
}

const RFQ_COLUMNS = [
  { key: 'NEW',              label: 'New',              color: 'bg-blue-500',   hover: 'hover:border-blue-300'   },
  { key: 'PENDING',          label: 'Assigned',         color: 'bg-purple-500', hover: 'hover:border-purple-300' },
  { key: 'QUOTED',           label: 'Quoted',           color: 'bg-indigo-500', hover: 'hover:border-indigo-300' },
  { key: 'SENT_TO_CUSTOMER', label: 'Sent to Customer', color: 'bg-cyan-500',   hover: 'hover:border-cyan-300'   },
  { key: 'ACCEPTED',         label: 'Order Won',        color: 'bg-teal-500',   hover: 'hover:border-teal-300'   },
  { key: 'JOB_CREATED',      label: 'Complete',         color: 'bg-gray-500',   hover: 'hover:border-gray-300'   },
  { key: 'REJECTED',         label: 'Lost',             color: 'bg-red-400',    hover: 'hover:border-red-300'    },
]

const PRIORITY_BADGE: Record<string, string> = {
  URGENT: 'bg-red-100 text-red-700 border border-red-200',
  HIGH:   'bg-orange-100 text-orange-700 border border-orange-200',
  MEDIUM: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  NORMAL: 'bg-gray-100 text-gray-600 border border-gray-200',
  LOW:    'bg-blue-50 text-blue-600 border border-blue-200',
}

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700', PENDING: 'bg-purple-100 text-purple-700',
  QUOTED: 'bg-indigo-100 text-indigo-700', SENT_TO_CUSTOMER: 'bg-cyan-100 text-cyan-700',
  ACCEPTED: 'bg-teal-100 text-teal-700', JOB_CREATED: 'bg-gray-100 text-gray-700',
  REJECTED: 'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<string, string> = {
  NEW: 'New', PENDING: 'Assigned', QUOTED: 'Quoted',
  SENT_TO_CUSTOMER: 'Sent to Customer', ACCEPTED: 'Order Won',
  JOB_CREATED: 'Complete', REJECTED: 'Lost',
}

const QUOTERS = ['Hendrik', 'Dewald', 'Estimator', 'Jaco']
const DEPARTMENTS_CG_FALLBACK = ['MELTSHOP', 'MILLS', 'SHARON', 'OREN', 'STORES', 'GENERAL', 'MRSTO']
const ACTIONS_LIST_FALLBACK = ['Manufacture', 'Sandblast', 'Service', 'Paint', 'Repair', 'Installation', 'Cutting', 'Modification', 'Machining', 'Supply']

// Maps dynamic action labels to legacy action_* column names (for backward compat)
const ACTION_LABEL_TO_COLUMN: Record<string, string> = {
  'Manufacture': 'action_manufacture', 'Sandblast': 'action_sandblast',
  'Service': 'action_service', 'Paint': 'action_paint',
  'Repair': 'action_repair', 'Installation': 'action_installation',
  'Cutting': 'action_cut', 'Cut': 'action_cut',
  'Modification': 'action_modify', 'Modify': 'action_modify',
}
const ACTION_COLUMN_TO_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(ACTION_LABEL_TO_COLUMN).map(([k, v]) => [v, k])
)

// Build legacy action_* fields from a selected-labels set, plus actions_required_dynamic JSONB
function buildActionFields(selectedLabels: Set<string>) {
  const legacy: Record<string, boolean> = {
    action_manufacture: false, action_sandblast: false, action_service: false,
    action_paint: false, action_repair: false, action_installation: false,
    action_cut: false, action_modify: false, action_other: false, action_prepare_material: false,
  }
  const dynamicArr: string[] = []
  selectedLabels.forEach(label => {
    const col = ACTION_LABEL_TO_COLUMN[label]
    if (col) legacy[col] = true
    dynamicArr.push(label)
  })
  return { ...legacy, actions_required_dynamic: dynamicArr }
}

// Read legacy action_* columns into a Set of labels
function readActionLabels(job: any): Set<string> {
  const labels = new Set<string>()
  // Read from dynamic column first
  if (job.actions_required_dynamic && Array.isArray(job.actions_required_dynamic)) {
    job.actions_required_dynamic.forEach((l: string) => labels.add(l))
  }
  // Fallback: also read legacy columns
  Object.entries(ACTION_COLUMN_TO_LABEL).forEach(([col, label]) => {
    if (job[col]) labels.add(label)
  })
  return labels
}
const MEDIA_OPTIONS_FALLBACK = ['Email', 'WhatsApp', 'Phone', 'Walk-in']

function useDropdownOptions(dropdownType: string, fallback: string[]) {
  const [options, setOptions] = React.useState<string[]>(fallback)
  React.useEffect(() => {
    supabase.from('system_dropdowns').select('option_label').eq('dropdown_type', dropdownType).eq('is_active', true).order('sort_order')
      .then(({ data }) => { if (data && data.length > 0) setOptions(data.map(d => d.option_label)) })
  }, [dropdownType])
  return options
}
const UOM_OPTIONS = ['EA', 'M', 'KG', 'L', 'HR', 'TRIP', 'SET', 'M2', 'M3', 'TON']
const ITEM_TYPES = ['MATERIAL', 'LABOUR', 'TRANSPORT', 'EQUIPMENT', 'SUBCONTRACT', 'OTHER']

const ROLE_STORAGE_KEY = 'erha_current_role'
const VALID_ROLES = ['HENDRIK', 'JUANIC', 'SONJA', 'CHARLES', 'DEWALD', 'JACO', 'ELSJE', 'ALWYN', 'CHERISE', 'ZACH'] as const

function readStoredRole(): string | null {
  try {
    const raw = localStorage.getItem(ROLE_STORAGE_KEY)
    if (raw && (VALID_ROLES as readonly string[]).includes(raw)) return raw
  } catch {
    // localStorage unavailable (private mode, disabled storage) — fall through
  }
  return null
}

const EMAIL_TEMPLATES: Record<string, { subject: string; body: string }> = {
  NEW:              { subject: 'Enquiry Received - {enq}', body: 'Dear {contact},\n\nThank you for your enquiry {enq}. We have received your request and will be in touch shortly.\n\nKind regards\nERHA Fabrication & Construction' },
  PENDING:          { subject: 'Quotation In Progress - {enq}', body: 'Dear {contact},\n\nWe are currently preparing your quotation for enquiry {enq}. We will send it to you as soon as it is ready.\n\nKind regards\nERHA Fabrication & Construction' },
  QUOTED:           { subject: 'Quotation Ready - {enq}', body: 'Dear {contact},\n\nPlease find attached your quotation for enquiry {enq}. Kindly review and revert at your earliest convenience.\n\nKind regards\nERHA Fabrication & Construction' },
  SENT_TO_CUSTOMER: { subject: 'Follow Up - Quotation {enq}', body: 'Dear {contact},\n\nWe are following up on the quotation submitted for enquiry {enq}. Please do not hesitate to contact us if you have any questions.\n\nKind regards\nERHA Fabrication & Construction' },
  ACCEPTED:         { subject: 'Order Confirmation - {enq}', body: 'Dear {contact},\n\nThank you for accepting our quotation for enquiry {enq}. We confirm receipt of your order and will be in contact regarding next steps.\n\nKind regards\nERHA Fabrication & Construction' },
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-'
  try { return format(new Date(dateStr), 'dd MMM yyyy') } catch { return '-' }
}

// ROLE SELECTOR

function RoleSelector({ onSelect }: any) {
  return (
    <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="bg-orange-500 px-8 py-6 text-center">
          <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-orange-500 font-black text-xl">ERHA</span>
          </div>
          <h1 className="text-white font-bold text-xl">Operations Board</h1>
          <p className="text-orange-100 text-sm mt-1">Who are you?</p>
        </div>
        <div className="p-6 space-y-2 max-h-[60vh] overflow-y-auto">
          {([
            { key: 'HENDRIK', label: 'Managing Director', initials: 'MD', color: 'orange' },
            { key: 'JUANIC', label: 'Operations System Manager', initials: 'OS', color: 'blue' },
            { key: 'SONJA', label: 'Procurement and Buying', initials: 'PB', color: 'green' },
            { key: 'CHARLES', label: 'Store Manager', initials: 'SM', color: 'amber' },
            { key: 'DEWALD', label: 'General Manager', initials: 'GM', color: 'purple' },
            { key: 'JACO', label: 'Site Manager', initials: 'SI', color: 'teal' },
            { key: 'ELSJE', label: 'Site Admin', initials: 'SA', color: 'rose' },
            { key: 'ALWYN', label: 'Site Foreman', initials: 'SF', color: 'indigo' },
            { key: 'CHERISE', label: 'Reception', initials: 'RC', color: 'cyan' },
            { key: 'ZACH', label: 'Shop Foreman', initials: 'SH', color: 'lime' },
          ] as const).map(role => (
            <button key={role.key} onClick={() => onSelect(role.key)}
              className={`w-full flex items-center gap-4 px-5 py-3 border-2 border-gray-200 rounded-xl hover:border-${role.color}-400 hover:bg-${role.color}-50 transition-all group`}>
              <div className={`w-10 h-10 bg-${role.color}-100 rounded-full flex items-center justify-center shrink-0 group-hover:bg-${role.color}-200`}>
                <span className={`text-${role.color}-600 font-bold text-sm`}>{role.initials}</span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">{role.label}</p>
              </div>
            </button>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400 pb-4">PUSH AI Labs</p>
      </div>
    </div>
  )
}

// APP

function 

































































App() {
  const [currentRole, setCurrentRoleState] = useState<string | null>(readStoredRole)
  const setCurrentRole = (role: string | null) => {
    setCurrentRoleState(role)
    try {
      if (role === null) localStorage.removeItem(ROLE_STORAGE_KEY)
      else localStorage.setItem(ROLE_STORAGE_KEY, role)
    } catch {
      // state still updates in memory even if persistence fails
    }
  }
  const [activeBoard, setActiveBoard] = useState<Board>('rfq')
  const [workshopJobs, setWorkshopJobs] = useState<Job[]>([])
  const [workshopLoading, setWorkshopLoading] = useState(false)
  const [rfqs, setRfqs] = useState<RFQ[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRFQ, setSelectedRFQ] = useState<RFQ | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCreateDirectJob, setShowCreateDirectJob] = useState(false)
  const [directJobModalKey, setDirectJobModalKey] = useState(0)
  const [showJarisonImport, setShowJarisonImport] = useState(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [jobsLoading, setJobsLoading] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [suppliersLoading, setSuppliersLoading] = useState(false)
  const [clientsList, setClientsList] = useState<Client[]>([])
  const [clientsLoading, setClientsLoading] = useState(false)

  const { activeEntity } = useEntity()

  const fetchSuppliers = async () => {
    setSuppliersLoading(true)
    try {
      const { data, error } = await supabase.from('suppliers').select('*').order('company_name')
      if (error) throw error
      setSuppliers(data || [])
    } catch (e: any) { console.error('Failed to fetch suppliers:', e.message) }
    finally { setSuppliersLoading(false) }
  }

  const fetchClients = async () => {
    setClientsLoading(true)
    try {
      const { data, error } = await supabase.from('clients').select('*').order('company_name')
      if (error) throw error
      setClientsList(data || [])
    } catch (e: any) { console.error('Failed to fetch clients:', e.message) }
    finally { setClientsLoading(false) }
  }

  const fetchRFQs = async () => {
    setLoading(true); setError(null)
    try {
      const { data, error } = await supabase.from('rfqs').select('*, clients(company_name)').eq('operating_entity', activeEntity).order('created_at', { ascending: false })
      if (error) throw error
      setRfqs(data || [])
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handlePrintJobCard = async (job: Job) => {
    await supabase.from('jobs').update({ status: 'PRINTED', workshop_status: 'NOT_STARTED' }).eq('id', job.id)
    fetchJobs()
    const { data: rfqRecord } = job.rfq_id ? await supabase.from('rfqs').select('*').eq('id', job.rfq_id).single() : { data: null }
    const rfq = rfqRecord
    const { data: lineItems } = await supabase.from('job_line_items').select('*').eq('job_id', job.id).order('sort_order')
    const items = lineItems || []
    const { data: childJobsData } = job.is_parent
      ? await supabase.from('jobs').select('*').eq('parent_job_id', job.id).eq('operating_entity', activeEntity).order('job_number')
      : { data: null }
    const childJobs = (childJobsData || []) as Job[]
    const childrenHtml = childJobs.length > 0
      ? '<div style="margin-top:12px;page-break-inside:avoid"><div class="sec-hdr">Child Jobs</div><table class="tbl">' +
        '' +
        '<thead><tr><th>Job Number</th><th>Description</th><th style="width:80px">Status</th></tr></thead><tbody>' +
        childJobs.map((ch: any) => '<tr><td style="font-weight:700;color:#1d3461">' + (ch.job_number||'') + '</td><td style="border:1px solid #000;padding:2px 6px">' + (ch.description||'') + '</td><td style="border:1px solid #000;padding:2px 6px">' + ((ch.status||'').replace(/_/g,' ')) + '</td></tr>').join('') +
        '</tbody></table><div style="font-size:7.5pt;color:#94a3b8;font-style:italic;margin-top:4px">Child job cards print on separate pages.</div></div>'
      : ''
    const fmtDate = (d: string | null | undefined) => d ? new Date(d).toLocaleDateString('en-ZA') : ''
    const val = (v: any) => v || ''
    const chkBox = (checked: boolean) => checked
      ? '<td style="border:1px solid #000;width:14px;height:14px;text-align:center;font-weight:bold">&#10003;</td>'
      : '<td style="border:1px solid #000;width:14px;height:14px"></td>'

    const lineItemRows = items.length > 0
      ? items.map((item: any, i: number) => `<tr>
          <td style="border:1px solid #000;padding:3px 5px">${item.description||''}</td>
          <td style="border:1px solid #000;padding:3px 5px;text-align:center">${item.quantity||1}</td>
        </tr>`).join('')
      : '<tr><td style="border:1px solid #000;padding:3px 5px" colspan="2">—</td></tr>'

    const logoB64 = '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'
    const logoHtml = '<img src="data:image/png;base64,' + logoB64 + '" alt="ERHA" style="height:50px">'
      ? `<img src="data:image/png;base64,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" alt="ERHA" style="height:50px">`
      : '<div style="font-size:16pt;font-weight:900;color:#1e3a5f">ERHA</div>'

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Job Card - ${val(job.job_number)}</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Segoe UI',Arial,sans-serif; font-size:9pt; background:white; color:#1a1a2e; }
.page { width:210mm; min-height:297mm; margin:0 auto; padding:8mm 10mm; position:relative; }
.page2 { page-break-before:always; }
table { border-collapse:collapse; width:100%; }
.hdr { background:linear-gradient(135deg,#1d3461 0%,#243d6b 100%); color:white; padding:12px 16px; border-radius:6px; display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
.hdr-logo { font-size:18pt; font-weight:900; letter-spacing:1px; }
.hdr-logo span { color:#4db848; }
.hdr-dept { font-size:9pt; opacity:0.7; text-align:right; }
.hdr-dept strong { opacity:1; font-size:10pt; }
.job-hero { background:#f0fdf4; border:2px solid #4db848; border-radius:6px; padding:10px 16px; margin-bottom:8px; display:flex; align-items:center; justify-content:space-between; }
.job-hero .jn { font-size:20pt; font-weight:900; color:#1d3461; letter-spacing:1px; }
.job-hero .client { font-size:11pt; font-weight:600; color:#1d3461; text-align:right; }
.job-hero .due { font-size:9pt; color:#dc2626; font-weight:700; text-align:right; margin-top:2px; }
.info-grid { display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:0; border:1px solid #cbd5e1; border-radius:4px; margin-bottom:8px; overflow:hidden; }
.info-cell { padding:6px 10px; border-right:1px solid #cbd5e1; border-bottom:1px solid #cbd5e1; }
.info-cell:last-child { border-right:none; }
.info-label { font-size:7pt; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; }
.info-val { font-size:9pt; font-weight:600; color:#1d3461; margin-top:1px; }
.desc-box { background:#fffbeb; border:1px solid #fbbf24; border-left:4px solid #f59e0b; border-radius:0 4px 4px 0; padding:8px 12px; margin-bottom:8px; }
.desc-box .lbl { font-size:7pt; font-weight:700; color:#92400e; text-transform:uppercase; letter-spacing:0.5px; }
.desc-box .val { font-size:10pt; font-weight:600; color:#1a1a2e; margin-top:2px; }
.sec-hdr { font-size:8pt; font-weight:800; color:#1d3461; text-transform:uppercase; letter-spacing:1px; margin:8px 0 4px; padding-bottom:2px; border-bottom:2px solid #4db848; }
.actions-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:0; border:1px solid #cbd5e1; border-radius:4px; overflow:hidden; margin-bottom:8px; }
.action-cell { padding:5px 8px; border-right:1px solid #cbd5e1; border-bottom:1px solid #cbd5e1; font-size:8pt; font-weight:600; }
.action-cell.checked { background:#f0fdf4; color:#166534; }
.action-cell.unchecked { color:#94a3b8; }
.chk { color:#4db848; font-weight:900; margin-right:4px; }
.tbl { border:1px solid #cbd5e1; border-radius:4px; overflow:hidden; margin-bottom:8px; }
.tbl th { background:#f1f5f9; padding:5px 8px; font-size:7.5pt; font-weight:700; color:#64748b; text-transform:uppercase; text-align:left; border-bottom:1px solid #cbd5e1; }
.tbl td { padding:5px 8px; font-size:9pt; border-bottom:1px solid #e2e8f0; }
.tbl tr:last-child td { border-bottom:none; }
.doc-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:0; border:1px solid #cbd5e1; border-radius:4px; overflow:hidden; margin-bottom:8px; }
.doc-cell { padding:5px 10px; border-right:1px solid #cbd5e1; border-bottom:1px solid #cbd5e1; font-size:8pt; }
.sig-row { display:flex; gap:24px; margin:6px 0; }
.sig-line { flex:1; border-bottom:1px solid #1d3461; padding-bottom:4px; font-size:8pt; color:#64748b; min-height:24px; }
.plan-grid { display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:0; border:1px solid #cbd5e1; border-radius:4px; overflow:hidden; margin-bottom:8px; }
.plan-cell { padding:6px 10px; border-right:1px solid #cbd5e1; min-height:40px; }
.plan-cell .lbl { font-size:7pt; font-weight:700; color:#64748b; text-transform:uppercase; }
.plan-cell .val { font-size:9pt; font-weight:600; color:#1d3461; margin-top:2px; }
.notice { background:#fef3c7; border:1px solid #fbbf24; border-radius:4px; padding:6px 10px; font-size:8pt; font-style:italic; margin-bottom:8px; }
.ts th, .ts td { border:1px solid #cbd5e1; padding:3px 4px; text-align:center; font-size:7.5pt; }
.ts th { background:#1d3461; color:white; font-weight:700; }
.ts td { min-height:38px; height:38px; }
.footer { position:absolute; bottom:8mm; left:10mm; right:10mm; display:flex; justify-content:space-between; font-size:7pt; color:#94a3b8; border-top:1px solid #e2e8f0; padding-top:4px; }
.print-bar { background:#1d3461; color:white; padding:10px 20px; text-align:center; position:sticky; top:0; z-index:100; }
.print-btn { background:#4db848; color:white; border:none; padding:8px 24px; font-size:11pt; font-weight:bold; border-radius:6px; cursor:pointer; margin:0 6px; }
.close-btn { background:#dc2626; color:white; border:none; padding:8px 24px; font-size:11pt; font-weight:bold; border-radius:6px; cursor:pointer; margin:0 6px; }
@media print { .print-bar{display:none} @page{size:A4;margin:0} .page{margin:0;padding:8mm 10mm} .footer{position:fixed;bottom:8mm} }
</style></head><body>
<div class="print-bar">
  <button class="print-btn" onclick="window.print()">🖨️ Print Job Card</button>
  <button class="print-btn" style="background:#2563eb" onclick="window.print()">💾 Save as PDF</button>
  <button class="close-btn" onclick="window.close()">✕ Close & Return to Board</button>
</div>
<div class="page">
  <div class="hdr"><div class="hdr-logo">ERHA<span>.</span> FABRICATION</div><div class="hdr-dept"><strong>Quality Control Department</strong><br>Job Card / Work Order</div></div>
  <div class="job-hero"><div><div class="jn">${val(job.job_number)}</div><div style="font-size:8pt;color:#64748b;margin-top:2px">Entry: ${val(job.entry_type)} | Priority: <strong style="color:${job.priority==='URGENT'?'#dc2626':job.priority==='HIGH'?'#ea580c':'#1d3461'}">${val(job.priority)}</strong></div></div><div><div class="client">${val(job.client_name)}</div><div class="due">${job.due_date ? 'DUE: ' + fmtDate(job.due_date) : ''}</div><div style="font-size:8pt;color:#64748b;margin-top:2px">Received: ${fmtDate(job.date_received)}</div></div></div>
  <div class="info-grid"><div class="info-cell"><div class="info-label">Job Number</div><div class="info-val">${val(job.job_number)}</div></div><div class="info-cell"><div class="info-label">Client RFQ No</div><div class="info-val">${val(job.client_rfq_number)}</div></div><div class="info-cell"><div class="info-label">Order / PO Number</div><div class="info-val">${val(job.po_number || (job as any).order_number)}</div></div><div class="info-cell"><div class="info-label">Site Req</div><div class="info-val">${val(job.site_req)}</div></div></div>
  <div class="info-grid" style="grid-template-columns:1fr 1fr 1fr"><div class="info-cell"><div class="info-label">RFQ Reference</div><div class="info-val">${val(job.rfq_no)}</div></div><div class="info-cell"><div class="info-label">Drawing Number</div><div class="info-val">${val(job.drawing_number)}</div></div><div class="info-cell"><div class="info-label">Compiled By</div><div class="info-val">${val((job as any).compiled_by)}</div></div></div>
  <div class="desc-box"><div class="lbl">Job Description</div><div class="val">${val(job.description)}</div></div>
  <div class="info-grid" style="grid-template-columns:1fr 1fr"><div class="info-cell"><div class="info-label">Work Type</div><div class="info-val">${job.is_contract_work ? '☑ Contract Work' : '☑ Quoted Work'}</div></div><div class="info-cell"><div class="info-label">Emergency</div><div class="info-val">${job.is_emergency ? '⚠️ YES — EMERGENCY' : 'No'}</div></div></div>
  <div class="sec-hdr">Actions Required</div>
  <div class="actions-grid"><div class="action-cell ${job.action_manufacture?'checked':'unchecked'}">${job.action_manufacture?'<span class=chk>✓</span>':'☐'} Manufacture</div><div class="action-cell ${job.action_service?'checked':'unchecked'}">${job.action_service?'<span class=chk>✓</span>':'☐'} Service</div><div class="action-cell ${job.action_repair?'checked':'unchecked'}">${job.action_repair?'<span class=chk>✓</span>':'☐'} Repair</div><div class="action-cell ${job.action_modify?'checked':'unchecked'}">${job.action_modify?'<span class=chk>✓</span>':'☐'} Modify</div><div class="action-cell ${job.action_cut?'checked':'unchecked'}">${job.action_cut?'<span class=chk>✓</span>':'☐'} Cut</div><div class="action-cell ${job.action_sandblast?'checked':'unchecked'}">${job.action_sandblast?'<span class=chk>✓</span>':'☐'} Sandblast</div><div class="action-cell ${job.action_paint?'checked':'unchecked'}">${job.action_paint?'<span class=chk>✓</span>':'☐'} Paint</div><div class="action-cell ${job.action_installation?'checked':'unchecked'}">${job.action_installation?'<span class=chk>✓</span>':'☐'} Installation</div></div>
  <div class="sec-hdr">Line Items / Bill of Materials</div>
  <table class="tbl"><thead><tr><th style="width:70%">Description</th><th style="width:15%;text-align:center">Qty</th><th style="width:15%;text-align:center">UOM</th></tr></thead><tbody>${items.length > 0 ? items.map((item, i) => '<tr><td>' + (item.description||'') + '</td><td style="text-align:center;font-weight:700">' + (item.quantity||1) + '</td><td style="text-align:center">' + (item.uom||'EA') + '</td></tr>').join('') : '<tr><td colspan="3" style="text-align:center;color:#94a3b8;padding:12px">No line items</td></tr>'}</tbody></table>
  <div class="sec-hdr">Attached Documents</div>
  <div class="doc-grid"><div class="doc-cell">${job.has_service_schedule ? '☑' : '☐'} Service Schedule / QCP</div><div class="doc-cell">${job.has_info_for_quote ? '☑' : '☐'} Info for Quote</div><div class="doc-cell">${job.has_drawing || job.drawing_number ? '☑' : '☐'} Drawing / Sketches</div><div class="doc-cell">${job.has_qcp ? '☑' : '☐'} QCP</div><div class="doc-cell">${job.has_internal_order ? '☑' : '☐'} Internal Order</div><div class="doc-cell">☐ List as Quoted</div></div>
  <div class="notice"><strong>ARTISAN:</strong> Make sure you sign the Internal Transmittal to acknowledge receipt of your job card and attached documents. <strong>ALL WELDING FOOD MUST BE DRIED PRIOR TO WELDING.</strong></div>
  <div class="sec-hdr">Supervisor Job Planning Info</div>
  <div class="plan-grid"><div class="plan-cell"><div class="lbl">Date Received</div><div class="val">&nbsp;</div></div><div class="plan-cell"><div class="lbl">Material Ordered</div><div class="val">&nbsp;</div></div><div class="plan-cell"><div class="lbl">Completion Date</div><div class="val" style="font-size:7pt;color:#94a3b8">(2 days before delivery)</div></div><div class="plan-cell"><div class="lbl">Due Date</div><div class="val" style="color:#dc2626;font-weight:800">${fmtDate(job.due_date)}</div></div></div>
  <div style="font-size:7.5pt;color:#94a3b8;font-style:italic;margin-bottom:8px">(All above to be completed by the supervisor)</div>
  <div class="sec-hdr">Signatures</div>
  <div class="sig-row"><div class="sig-line">Supervisor Signature</div><div class="sig-line">Date</div></div>
  <div class="sig-row"><div class="sig-line">Employee Signature</div><div class="sig-line">Date</div></div>
  ${childrenHtml}
  <div class="footer"><span>ERHA Fabrication & Construction — Confidential</span><span>Printed: ${new Date().toLocaleString('en-ZA')}</span><span>PUSH AI</span></div>
</div>
<div class="page page2">
  <div class="hdr" style="margin-bottom:12px"><div class="hdr-logo">ERHA<span>.</span></div><div style="font-size:14pt;font-weight:800;color:white">${val(job.job_number)}</div><div class="hdr-dept"><strong>QC & Time Tracking</strong><br>${val(job.client_name)}</div></div>
  <div class="sec-hdr">QC Holding Points</div>
  <div style="font-size:7.5pt;color:#dc2626;font-weight:700;margin-bottom:4px">Take Note!! Final inspection must ALWAYS be at least 2 days before delivery date!!!! Please follow the below procedure. Under NO circumstances should work be continued to the next holding point if the previous holding point is not signed and work completed where applicable.</div>
  <table class="tbl" style="margin-bottom:12px"><thead><tr><th style="width:30px;text-align:center">No</th><th>Description</th><th style="width:80px;text-align:center">Pass / Fail</th><th style="width:80px;text-align:center">Applicable</th><th style="width:120px;text-align:center">QC / Supervisor Signature</th></tr></thead><tbody><tr><td style="text-align:center;font-weight:800">1</td><td>Mark out all material & check prior to cutting</td><td></td><td></td><td></td></tr><tr><td style="text-align:center;font-weight:800">2</td><td>Cut all material, deburr holes, dress and remove all sharp edges</td><td></td><td></td><td></td></tr><tr><td style="text-align:center;font-weight:800">3</td><td>Assy and inspect prior to welding (Water passes if applicable)</td><td></td><td></td><td></td></tr><tr><td style="text-align:center;font-weight:800">4</td><td>Do welding complete as per WPS?</td><td></td><td></td><td></td></tr><tr><td style="text-align:center;font-weight:800">5</td><td>Do a pressure test on water cooled unit if applicable?</td><td></td><td></td><td></td></tr><tr><td style="text-align:center;font-weight:800">6</td><td>Clean all spatter and ensure NO sharp edges on workpiece</td><td></td><td></td><td></td></tr><tr><td style="text-align:center;font-weight:800">7</td><td>Do 100% dimensional & visual inspection prior to painting</td><td></td><td></td><td></td></tr><tr><td style="text-align:center;font-weight:800">8</td><td>Stamp and paint as required</td><td></td><td></td><td></td></tr><tr><td style="text-align:center;font-weight:800;background:#f0fdf4">9</td><td style="background:#f0fdf4;font-weight:700">Final inspection — Sticker, Sign, Paperwork, Ready for delivery</td><td style="background:#f0fdf4"></td><td style="background:#f0fdf4"></td><td style="background:#f0fdf4"></td></tr></tbody></table>
  <div class="sec-hdr">Weekly Timesheet</div>
  <table class="ts" style="margin-bottom:8px"><thead><tr><th rowspan="2" style="width:60px">Date</th><th rowspan="2" style="width:100px">Description</th><th colspan="2">Mon</th><th colspan="2">Tue</th><th colspan="2">Wed</th><th colspan="2">Thu</th><th colspan="2">Fri</th><th>Sat</th><th>Sun</th><th colspan="2">Total</th></tr><tr><th>NT</th><th>OT</th><th>NT</th><th>OT</th><th>NT</th><th>OT</th><th>NT</th><th>OT</th><th>NT</th><th>OT</th><th>OT</th><th>OT</th><th>NT</th><th>OT</th></tr></thead><tbody>${[1,2,3,4,5,6,7,8,9,10].map(() => '<tr>' + '<td></td><td></td>' + '<td></td><td></td>'.repeat(5) + '<td></td><td></td>' + '<td></td><td></td>' + '</tr>').join('')}</tbody></table>
  <div class="sec-hdr">Workshop Notes</div>
  <div style="border:1px solid #cbd5e1;border-radius:4px;padding:8px 10px;min-height:60px;font-size:9pt;color:#64748b">${val(job.notes) || '&nbsp;'}</div>
  <div class="footer"><span>ERHA Fabrication & Construction — Confidential</span><span>Printed: ${new Date().toLocaleString('en-ZA')}</span><span>PUSH AI</span></div>
</div>
</body></html>`;
    const win = window.open('', '_blank')
    if (win) { win.document.write(html); win.document.close() }
    if (childJobs.length > 0) {
      childJobs.forEach((child: any, i: number) => {
        setTimeout(() => handlePrintJobCard(child as Job), (i + 1) * 900)
      })
    }
  }

  const handleJobStatusChange = async (jobId: string, newStatus: string) => {
    await supabase.from('jobs').update({ status: newStatus }).eq('id', jobId)
    const { data: job } = await supabase.from('jobs').select('*').eq('id', jobId).single()
    if (job) {
      if (newStatus === 'IN_REVIEW') emailJobInReview(job)
      if (newStatus === 'READY_TO_PRINT') emailJobReadyToPrint(job)
      if (newStatus === 'PRINTED') emailJobPrinted(job)
      if (newStatus === 'PRINTED') await supabase.from('jobs').update({ workshop_status: 'NOT_STARTED' }).eq('id', jobId)
    }
    fetchJobs()
  }

  const fetchJobs = async () => {
    setJobsLoading(true)
    try {
      const { data, error } = await supabase.from('jobs').select('*').eq('operating_entity', activeEntity).order('created_at', { ascending: false })
      if (error) throw error
      setJobs(data || [])
    } catch (e: any) { console.error('Jobs error:', e.message) }
    finally { setJobsLoading(false) }
  }
  const fetchWorkshopJobs = async () => {
    setWorkshopLoading(true)
    try {
      const { data } = await supabase.from('jobs').select('*').eq('operating_entity', activeEntity).order('created_at',{ascending:false})
      if (data && data.length > 0) {
        // Fetch line item dispatch stats for progress badges — scoped to the
        // entity-filtered jobs fetched above; avoids a cross-entity leak that
        // an unfiltered job_line_items read would cause.
        const { data: liStats } = await supabase.from('job_line_items').select('job_id, dispatched').in('job_id', data.map((j: any) => j.id))
        const statsMap: Record<string, { total: number; dispatched: number }> = {}
        if (liStats) {
          liStats.forEach((li: any) => {
            if (!statsMap[li.job_id]) statsMap[li.job_id] = { total: 0, dispatched: 0 }
            statsMap[li.job_id].total++
            if (li.dispatched) statsMap[li.job_id].dispatched++
          })
        }
        setWorkshopJobs(data.map((j: any) => ({ ...j, _liStats: statsMap[j.id] || null })))
      } else {
        setWorkshopJobs([])
      }
    } finally { setWorkshopLoading(false) }
  }

  useEffect(() => { fetchRFQs(); fetchJobs() }, [activeEntity])

  const handleRFQUpdate = (updated: RFQ) => {
    setRfqs(prev => prev.map(r => r.id === updated.id ? updated : r))
    setSelectedRFQ(updated)
  }

  const handleRFQCreated = () => {
    setShowCreateModal(false)
    fetchRFQs()
  }


  const handleWorkshopStatusChange = async (jobId: string, newStatus: string) => {
    try {
      // US-11: QC gate - block QUALITY_CHECK unless all 9 checkpoints signed
      if (newStatus === 'QUALITY_CHECK') {
        const { data: qcData } = await supabase.from('job_qc_checkpoints').select('signed_off').eq('job_id', jobId)
        const unsigned = qcData ? qcData.filter((c: any) => !c.signed_off).length : 9
        if (unsigned > 0) {
          alert('QC Gate: ' + unsigned + ' of 9 checkpoints not yet signed off. Complete all QC checkpoints before moving to Quality Check.')
          return
        }
      }
      const updates: any = { workshop_status: newStatus }
      if (newStatus === 'IN_PROGRESS') {
        updates.time_started_at = new Date().toISOString()
        // US-07: Auto clock-in all assigned workers
        const { data: workers } = await supabase.from('job_workers').select('id').eq('job_id', jobId).is('clocked_in_at', null)
        if (workers && workers.length > 0) {
          await supabase.from('job_workers').update({ clocked_in_at: new Date().toISOString() }).eq('job_id', jobId).is('clocked_in_at', null)
        }
      }
      await supabase.from('jobs').update(updates).eq('id', jobId)
      if (newStatus === 'DISPATCHED') {
        const job = workshopJobs.find((j:any) => j.id === jobId)
        if (job?.rfq_id) {
          await supabase.from('rfqs').update({ status: 'JOB_CREATED' }).eq('id', job.rfq_id)
          emailOrderWon({ id: job.rfq_id, description: job.description || '' } as any, job.job_number || '')
        }
      }
      // Activity log for status transitions
      const logJob = workshopJobs.find((j:any) => j.id === jobId)
      if (logJob) {
        const oldStatus = logJob.workshop_status || 'NOT_STARTED'
        const eventMap: Record<string,string> = { DELIVERED: 'job_delivered', COMPLETED: 'job_completed' }
        const eventType = eventMap[newStatus] || 'workshop_status_changed'
        await supabase.from('activity_log').insert({
          action_type: eventType, entity_type: 'job', entity_id: jobId,
          operating_entity: (logJob.operating_entity === 'ERHA_FC' || logJob.operating_entity === 'ERHA_SS') ? logJob.operating_entity : activeEntity,
          metadata: { job_number: logJob.job_number, old_status: oldStatus, new_status: newStatus, changed_by: 'user', changed_at: new Date().toISOString() },
        }).then(({ error: logErr }) => { if (logErr) console.error('Activity log error:', logErr.message) })
      }
      fetchWorkshopJobs()
      // Email triggers
      const updatedJob = workshopJobs.find((j:any) => j.id === jobId)
      if (updatedJob) {
        if (newStatus === 'IN_PROGRESS') emailJobStarted(updatedJob)
        if (newStatus === 'QUALITY_CHECK') emailJobQCCheck(updatedJob)
        if (newStatus === 'COMPLETE') emailJobComplete(updatedJob)
        if (newStatus === 'DISPATCHED') emailJobDispatched(updatedJob)
      }
    } catch (e: any) { alert('Error: ' + e.message) }
  }

  if (!currentRole) return <RoleSelector onSelect={setCurrentRole} />
  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-gray-900 flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center shrink-0">
              <Factory size={20} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-base leading-tight">ERHA</p>
              <p className="text-gray-400 text-xs leading-tight">Operations Boards</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest px-3 mb-3">Boards</p>
          <NavItem icon={<ClipboardList size={18} />} label="RFQ Board" description="RFQ pipeline" active={activeBoard === 'rfq'} accentColor="text-blue-400" onClick={() => setActiveBoard('rfq')} />
          <NavItem icon={<Briefcase size={18} />} label="Job Board" description="Project tracking" active={activeBoard === 'job'} accentColor="text-green-400" onClick={() => setActiveBoard('job')} />
          <NavItem icon={<Factory size={18} />} label="Workshop Board" description="Floor execution" active={activeBoard === 'workshop'} accentColor="text-orange-400" onClick={() => { setActiveBoard('workshop'); fetchWorkshopJobs() }} />
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest px-3 mb-3 mt-6">Management</p>
          <NavItem icon={<Package size={18} />} label="Procurement" description="Suppliers & purchasing" active={activeBoard === 'procurement'} accentColor="text-green-400" onClick={() => { setActiveBoard('procurement'); fetchSuppliers() }} />
          <NavItem icon={<Users size={18} />} label="Clients" description="Client management" active={activeBoard === 'clients'} accentColor="text-blue-400" onClick={() => { setActiveBoard('clients'); fetchClients() }} />
          <button className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left text-gray-500 cursor-not-allowed opacity-50">
            <Package size={18} />
            <div className="flex-1 min-w-0"><p className="text-sm font-semibold leading-tight">Internal Store</p><p className="text-xs text-gray-500 leading-tight mt-0.5">Stock management</p></div>
          </button>
          <NavItem icon={<Settings size={18} />} label="Settings" description="System configuration" active={activeBoard === 'settings'} accentColor="text-gray-400" onClick={() => setActiveBoard('settings')} />
        </nav>
        <div className="px-6 py-4 border-t border-gray-700">
          <p className="text-gray-500 text-xs">PUSH AI Labs</p>
          <p className="text-gray-600 text-xs">v0.1.0 - dev</p>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{activeBoard === 'rfq' ? 'RFQ Board' : activeBoard === 'job' ? 'Job Board' : activeBoard === 'procurement' ? 'Procurement' : activeBoard === 'clients' ? 'Client Management' : activeBoard === 'settings' ? 'Settings' : 'Workshop Board'}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{activeBoard === 'rfq' ? 'RFQ to job creation - sales pipeline' : activeBoard === 'job' ? 'Job created to paid - project tracking' : activeBoard === 'procurement' ? 'Supplier register & purchasing' : activeBoard === 'clients' ? 'Manage clients & contacts' : activeBoard === 'settings' ? 'System configuration & dropdown management' : 'Workshop floor execution tracking'}</p>
          </div>
          <div className="flex items-center gap-3">
            {activeBoard !== 'procurement' && activeBoard !== 'clients' && activeBoard !== 'settings' && (
              <button onClick={() => { fetchRFQs(); fetchJobs() }} className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <RefreshCw size={14} />Refresh
              </button>
            )}
            {activeBoard === 'rfq' && (
              <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
                <Plus size={15} />New RFQ
              </button>
            )}
            {activeBoard === 'job' && (<>
              <button onClick={() => setShowJarisonImport(true)} className="flex items-center gap-2 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors">
                <Upload size={15} />Import Jarison
              </button>
              <button onClick={() => { setDirectJobModalKey(k => k + 1); setShowCreateDirectJob(true) }} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors">
                <Plus size={15} />New Job
              </button>
            </>)}
            <div className="flex items-center gap-1.5 text-xs text-gray-500 pr-1 border-r border-gray-200">
              <span className="pr-2">Role: <span className="font-semibold text-gray-700">{currentRole}</span></span>
              <button onClick={() => setCurrentRole(null)} className="text-blue-600 hover:underline font-medium pr-1">Change</button>
            </div>
            <EntitySwitcher currentRole={currentRole} />
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${activeBoard === 'rfq' ? 'bg-blue-100 text-blue-700' : activeBoard === 'job' ? 'bg-green-100 text-green-700' : activeBoard === 'procurement' ? 'bg-green-100 text-green-700' : activeBoard === 'clients' ? 'bg-blue-100 text-blue-700' : activeBoard === 'settings' ? 'bg-gray-100 text-gray-700' : 'bg-orange-100 text-orange-700'}`}>
              {activeBoard === 'rfq' ? 'RFQ Board' : activeBoard === 'job' ? 'Job Board' : activeBoard === 'procurement' ? 'Procurement' : activeBoard === 'clients' ? 'Clients' : activeBoard === 'settings' ? 'Settings' : 'Workshop Board'}
            </span>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden min-w-0">
          <div className="flex-1 overflow-auto p-6 min-w-0">
            {activeBoard === 'rfq'
              ? <RFQBoard rfqs={rfqs} loading={loading} error={error} onRefresh={fetchRFQs} onCardClick={setSelectedRFQ} selectedId={selectedRFQ?.id} />
              : activeBoard === 'job'
              ? <JobBoard jobs={jobs} loading={jobsLoading} onStatusChange={handleJobStatusChange} onPrintCard={handlePrintJobCard} onCardClick={setSelectedJob} selectedId={selectedJob?.id} />
              : activeBoard === 'procurement'
              ? <SupplierManagement suppliers={suppliers} loading={suppliersLoading} onRefresh={fetchSuppliers} currentRole={currentRole} />
              : activeBoard === 'clients'
              ? <ClientManagement clients={clientsList} loading={clientsLoading} onRefresh={fetchClients} />
              : activeBoard === 'settings'
              ? <SettingsPage />
              : <WorkshopBoard jobs={workshopJobs} loading={workshopLoading} onRefresh={fetchWorkshopJobs} onStatusChange={handleWorkshopStatusChange} />}
          </div>
          {selectedRFQ && <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"><RFQDetailPanel rfq={selectedRFQ} onClose={() => setSelectedRFQ(null)} onUpdate={handleRFQUpdate} role={currentRole} activeEntity={activeEntity} onJobCreated={fetchJobs} onNavigateToJob={(jobNumber) => { setSelectedRFQ(null); setActiveBoard('job'); const job = jobs.find(j => j.job_number === jobNumber); if (job) setSelectedJob(job); }} /></div>}
        </div>
      </main>

      {showCreateModal && <CreateRFQModal activeEntity={activeEntity} onClose={() => setShowCreateModal(false)} onCreated={handleRFQCreated} />}
      {showCreateDirectJob && <CreateDirectJobModal key={directJobModalKey} activeEntity={activeEntity} onClose={() => setShowCreateDirectJob(false)} onCreated={fetchJobs} />}
      {showJarisonImport && <JarisonImportModal activeEntity={activeEntity} onClose={() => setShowJarisonImport(false)} onImported={fetchJobs} />}
      {selectedJob && <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"><JobDetailPanel key={selectedJob.id} job={selectedJob} parentJobNumber={jobs.find(j=>j.id===selectedJob?.parent_job_id)?.job_number} activeEntity={activeEntity} onClose={() => setSelectedJob(null)} onUpdate={(j) => { setSelectedJob(j); fetchJobs() }} /></div>}
    </div>
  )
}

// RFQ BOARD

function RFQBoard({ rfqs, loading, error, onRefresh, onCardClick, selectedId }: { rfqs: RFQ[]; loading: boolean; error: string | null; onRefresh: () => void; onCardClick: (rfq: RFQ) => void; selectedId?: string }) {
  if (loading) return <div className="flex items-center justify-center h-64 gap-3 text-gray-400"><div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" /><span>Loading RFQs...</span></div>
  if (error) return <div className="flex items-center justify-center h-64"><div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center"><p className="text-red-700 font-semibold mb-2">Failed to load</p><p className="text-red-500 text-sm mb-4">{error}</p><button onClick={onRefresh} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Try Again</button></div></div>
  return (
    <div className="flex gap-4 h-full" style={{ minWidth: 'max-content' }}>
      {RFQ_COLUMNS.map((col) => {
        const cards = rfqs.filter(r => r.status === col.key)
        return (
          <div key={col.key} className="w-64 flex flex-col shrink-0">
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-t-lg ${col.color}`}>
              <span className="text-white text-sm font-bold">{col.label}</span>
              <span className="ml-auto bg-white bg-opacity-25 text-white text-xs font-bold px-2 py-0.5 rounded-full">{cards.length}</span>
            </div>
            <div className="flex-1 bg-gray-200 rounded-b-lg p-2 min-h-96 space-y-2">
              {cards.length === 0 && <div className="flex items-center justify-center h-20"><p className="text-gray-400 text-xs">No RFQs</p></div>}
              {cards.map(rfq => <RFQCard key={rfq.id} rfq={rfq} hoverColor={col.hover} onClick={() => onCardClick(rfq)} isSelected={rfq.id === selectedId} />)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// RFQ CARD

function RFQCard({ rfq, hoverColor, onClick, isSelected }: { rfq: RFQ; hoverColor: string; onClick: () => void; isSelected: boolean }) {
  const priority = rfq.priority?.toUpperCase() || 'NORMAL'
  const direction = rfq.rfq_direction?.toUpperCase()
  const enqNo = rfq.client_rfq_number || rfq.enq_number || rfq.rfq_no || '-'
  return (
    <div onClick={onClick} className={`bg-white rounded-lg shadow-sm border-2 p-3 cursor-pointer hover:shadow-md ${hoverColor} transition-all ${isSelected ? 'border-blue-400 shadow-md' : 'border-transparent'}`}>
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <span className="text-xs font-bold text-blue-600 tracking-wide">{enqNo}</span>
        {rfq.quote_number && <span className="text-xs font-bold text-purple-600 tracking-wide ml-1">| Q: {rfq.quote_number}</span>}
        {rfq.job_number && <span className="text-xs font-bold text-green-600 tracking-wide ml-1">| {rfq.job_number}</span>}
        {direction && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded ${direction === 'OUTGOING' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
            {direction === 'OUTGOING' ? <ArrowUpFromLine size={10} /> : <ArrowDownToLine size={10} />}
            {direction === 'OUTGOING' ? 'OUT' : 'IN'}
          </span>
        )}
        {rfq.client_rfq_number && <span className="text-xs text-gray-400 flex items-center gap-0.5"><Hash size={9} />{rfq.client_rfq_number}</span>}
        <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_BADGE[priority] || PRIORITY_BADGE['NORMAL']}`}>{priority}</span>
      </div>
      <p className="text-sm font-medium text-gray-800 leading-snug mb-3 line-clamp-2">{rfq.description || 'No description'}</p>
      <div className="flex items-center gap-1.5 mb-1"><Building2 size={12} className="text-gray-400 shrink-0" /><span className="text-xs text-gray-500 truncate">{rfq.clients?.company_name || 'Unknown Client'}</span></div>
      {rfq.request_date && <div className="flex items-center gap-1.5"><Calendar size={12} className="text-gray-400 shrink-0" /><span className="text-xs text-gray-400">Received {formatDate(rfq.request_date)}</span></div>}
    </div>
  )
}

// JOB BOARD


function JarisonImportModal({ activeEntity, onClose, onImported }: { activeEntity: OperatingEntity; onClose: () => void; onImported: () => void }) {
  const [csvRows, setCsvRows] = React.useState<any[]>([])
  const [fileName, setFileName] = React.useState('')
  const [importing, setImporting] = React.useState(false)
  const [importResult, setImportResult] = React.useState<{ success: number; errors: number } | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)

  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n')
    if (lines.length < 2) return []
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
    return lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      const row: any = {}
      headers.forEach((h, i) => { row[h] = vals[i] || '' })
      return row
    }).filter(r => r.JobNumber || r.Description || r.ClientName)
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setImportResult(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const rows = parseCSV(text)
      setCsvRows(rows)
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (csvRows.length === 0) return
    setImporting(true)
    let success = 0, errors = 0
    const sb = (await import('./lib/supabase')).supabase

    for (const row of csvRows) {
      try {
        const { error } = await sb.from('jobs').insert({
          operating_entity: activeEntity,
          ...(row.JobNumber ? { job_number: row.JobNumber } : {}),
          description: row.Description || 'Imported from Jarison',
          client_name: row.ClientName || 'Unknown Client',
          due_date: row.DueDate || null,
          date_received: row.StartDate || new Date().toISOString().slice(0, 10),
          notes: `Imported from Jarison CSV (${fileName}) on ${new Date().toLocaleDateString('en-ZA')}`,
          entry_type: 'IMPORT',
          status: 'PENDING',
          priority: 'MEDIUM',
          workshop_status: 'NOT_STARTED',
          has_info_for_quote: false,
        })
        if (error) { errors++; console.error('Import row error:', error) }
        else { success++ }
      } catch (err) { errors++; console.error('Import exception:', err) }
    }

    // ML Event Log: log the import event for future analysis
    try {
      await sb.from('import_events').insert({
        source: 'jarison_csv',
        file_name: fileName,
        rows_attempted: csvRows.length,
        rows_imported: success,
        rows_failed: errors,
        imported_at: new Date().toISOString(),
        imported_by: 'system',
      })
    } catch (e) { console.log('ML event log skipped (table may not exist yet):', e) }

    setImportResult({ success, errors })
    setImporting(false)
    if (success > 0) onImported()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Import from Jarison</h2>
            <p className="text-sm text-gray-500 mt-0.5">Upload a Jarison CSV export to create jobs</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-4">
          {/* File picker */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-amber-400 transition-colors cursor-pointer" onClick={() => fileRef.current?.click()}>
            <Upload size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">{fileName || 'Click to select CSV file'}</p>
            <p className="text-xs text-gray-400 mt-1">Expected columns: JobNumber, Description, ClientName, StartDate, DueDate</p>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
          </div>

          {/* Preview table */}
          {csvRows.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <p className="text-sm font-semibold text-gray-700">{csvRows.length} rows found</p>
              </div>
              <div className="overflow-auto max-h-64">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">#</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Job Number</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Description</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Client</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvRows.map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-1.5 text-gray-400">{i + 1}</td>
                        <td className="px-3 py-1.5 font-mono text-xs">{row.JobNumber || '-'}</td>
                        <td className="px-3 py-1.5 truncate max-w-48">{row.Description || '-'}</td>
                        <td className="px-3 py-1.5">{row.ClientName || '-'}</td>
                        <td className="px-3 py-1.5 text-xs">{row.DueDate || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import result */}
          {importResult && (
            <div className={`rounded-lg p-4 ${importResult.errors > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
              <p className="text-sm font-semibold">{importResult.success} jobs imported successfully{importResult.errors > 0 ? `, ${importResult.errors} failed` : ''}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={handleImport} disabled={csvRows.length === 0 || importing || !!importResult}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white text-sm font-semibold rounded-lg transition-colors">
            {importing ? 'Importing...' : importResult ? 'Done' : `Import ${csvRows.length} Jobs`}
          </button>
        </div>
      </div>
    </div>
  )
}

function JobBoard({ jobs, loading, onCardClick, selectedId, onStatusChange, onPrintCard }: { jobs: Job[]; loading: boolean; onCardClick: (job: Job) => void; selectedId?: string; onStatusChange: (jobId: string, newStatus: string) => void; onPrintCard: (job: Job) => void }) {
  const [expandedParents, setExpandedParents] = React.useState<Set<string>>(new Set())
  const toggleParent = (id: string) => setExpandedParents(p => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s })
  const columns = [
    { key: 'PENDING',        label: 'Pending',        color: 'bg-gray-500'  },
    { key: 'IN_REVIEW',      label: 'In Review',      color: 'bg-blue-500'  },
    { key: 'READY_TO_PRINT', label: 'Ready to Print', color: 'bg-amber-500' },
    { key: 'PRINTED',        label: 'Printed',        color: 'bg-green-600' },
  ]
  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3 text-gray-400">
      <div className="w-5 h-5 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin" />
      <span>Loading jobs...</span>
    </div>
  )
  return (
    <div className="flex gap-4 h-full" style={{ minWidth: 'max-content' }}>
      {columns.map(col => {
        const cards = jobs.filter(j => j.status === col.key)
        return (
          <div key={col.key} className="w-64 flex flex-col shrink-0">
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-t-lg ${col.color}`}>
              <span className="text-white text-sm font-bold">{col.label}</span>
              <span className="ml-auto bg-white bg-opacity-25 text-white text-xs font-bold px-2 py-0.5 rounded-full">{cards.length}</span>
            </div>
            <div className="flex-1 bg-gray-200 rounded-b-lg p-2 min-h-96 space-y-2">
              {cards.length === 0 && (
                <div className="flex items-center justify-center h-20">
                  <p className="text-gray-400 text-xs">No jobs</p>
                </div>
              )}
              {cards.filter(j => !j.is_child_job).map(job => {
                const children = jobs.filter(jj => jj.parent_job_id === job.id)
                const isExpanded = expandedParents.has(job.id)
                const nextMap: Record<string, {label: string; next: string; color: string}[]> = {
                  PENDING:        [{ label: 'Review', next: 'IN_REVIEW',      color: 'bg-blue-500 hover:bg-blue-600' }],
                  IN_REVIEW:      [{ label: 'Ready',  next: 'READY_TO_PRINT', color: 'bg-amber-500 hover:bg-amber-600' }],
                  READY_TO_PRINT: [{ label: 'Back',   next: 'IN_REVIEW',      color: 'bg-gray-400 hover:bg-gray-500' }],
                  PRINTED:        [],
                }
                const nextActions = nextMap[job.status] || []
                const canPrint = job.status === 'READY_TO_PRINT' || job.status === 'PRINTED'
                return (
                  <React.Fragment key={job.id}><div onClick={() => onCardClick(job)}
                    className={`bg-white rounded-lg shadow-sm border-2 p-3 cursor-pointer hover:shadow-md transition-all ${job.id === selectedId ? 'border-green-400 shadow-md' : 'border-transparent hover:border-green-300'}`}>
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-green-600">{job.job_number || 'New'}</p>
                      <div className="flex items-center gap-1">
                        {job.entry_type === 'DIRECT' && <span className="text-xs font-bold px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded">DIRECT</span>}
                        {job.entry_type === 'IMPORT' && <span className="text-xs font-bold px-1.5 py-0.5 bg-teal-100 text-teal-600 rounded">IMPORT</span>}
                        {job.entry_type === 'FAST_TRACK' && <span className="text-xs font-bold px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded">⚡ FAST</span>}
                        {job.entry_type === 'CHILD' && <span className="text-xs font-bold px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded">↳</span>}
                        {job.is_parent && <span className="text-xs font-bold px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded">P</span>}
                        {job.is_emergency && <span className="text-xs font-bold px-1.5 py-0.5 bg-red-100 text-red-600 rounded">!</span>}
                        {job.status !== 'PRINTED' && <span className="text-xs font-bold px-1.5 py-0.5 bg-rose-50 text-rose-500 rounded border border-rose-200">No Card</span>}
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-800 mt-1 line-clamp-2">{job.description || job.client_name || 'No description'}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{job.client_name || '-'}</p>
                    {job.due_date && (
                      <p className="text-xs text-gray-400 mt-0.5">Due: {new Date(job.due_date).toLocaleDateString('en-ZA')}</p>
                    )}
                    {(nextActions.length > 0 || canPrint) && (
                      <div className="flex gap-1 mt-2" onClick={e => e.stopPropagation()}>
                        {nextActions.map(action => (
                          <button key={action.next} onClick={() => onStatusChange(job.id, action.next)}
                            className={`flex-1 py-1 text-xs font-semibold text-white rounded transition-colors ${action.color}`}>
                            {action.label}
                          </button>
                        ))}
                        {canPrint && (
                          <button onClick={() => onPrintCard(job)}
                            className="flex items-center justify-center gap-1 flex-1 py-1 text-xs font-semibold text-white rounded bg-green-600 hover:bg-green-700 transition-colors">
                            <Printer size={11} />Print
                          </button>
                        )}
                      </div>
                    )}
                    {job.is_parent && children.length > 0 && (
                      <button onClick={e => { e.stopPropagation(); toggleParent(job.id) }}
                        className="mt-2 w-full flex items-center justify-center gap-1 py-1 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded transition-colors">
                        {isExpanded ? "▲" : "▼"} {children.length} child{children.length > 1 ? " jobs" : " job"}
                      </button>
                    )}
                  </div>
                  {job.is_parent && isExpanded && children.map(child => {
                    const cNext = (({"PENDING":[{label:"Review",next:"IN_REVIEW",color:"bg-blue-500 hover:bg-blue-600"}],"IN_REVIEW":[{label:"Ready",next:"READY_TO_PRINT",color:"bg-amber-500 hover:bg-amber-600"}],"READY_TO_PRINT":[{label:"Back",next:"IN_REVIEW",color:"bg-gray-400 hover:bg-gray-500"}],"PRINTED":[]} as Record<string,{label:string;next:string;color:string}[]>)[child.status] || [])
                    const cPrint = child.status === "READY_TO_PRINT" || child.status === "PRINTED"
                    return (
                      <div key={child.id} className="ml-3 mt-1 border-l-2 border-purple-200 pl-2">
                        <div onClick={() => onCardClick(child)} className={`bg-white rounded-lg shadow-sm border-2 p-2 cursor-pointer transition-all ${child.id === selectedId ? "border-green-400" : "border-transparent hover:border-purple-300"}`}>
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-bold text-purple-600">{child.job_number}</p>
                            <div className="flex items-center gap-1">
                              {child.status !== 'PRINTED' && <span className="text-xs font-bold px-1.5 py-0.5 bg-rose-50 text-rose-500 rounded border border-rose-200">No Card</span>}
                              <span className="text-xs font-bold px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded">↳</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-700 mt-0.5 line-clamp-2">{child.description || ''}</p>
                          <span className={`text-xs px-1.5 py-0.5 rounded mt-1 inline-block font-medium ${child.status==="PENDING"?"bg-gray-100 text-gray-600":child.status==="IN_REVIEW"?"bg-blue-100 text-blue-600":child.status==="READY_TO_PRINT"?"bg-amber-100 text-amber-600":"bg-green-100 text-green-600"}`}>{child.status.replace(/_/g,' ')}</span>
                          {(cNext.length > 0 || cPrint) && (
                            <div className="flex gap-1 mt-1.5" onClick={e => e.stopPropagation()}>
                              {cNext.map(a => (<button key={a.next} onClick={() => onStatusChange(child.id, a.next)} className={`flex-1 py-0.5 text-xs font-semibold text-white rounded ${a.color}`}>{a.label}</button>))}
                              {cPrint && (<button onClick={() => onPrintCard(child)} className="flex items-center gap-1 flex-1 py-0.5 text-xs font-semibold text-white rounded bg-green-600 hover:bg-green-700 justify-center"><Printer size={10}/>Print</button>)}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  </React.Fragment>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}


// JOB DETAIL PANEL

function JobDetailPanel({ job, parentJobNumber, activeEntity, onClose, onUpdate }: { job: Job; parentJobNumber?: string; activeEntity: OperatingEntity; onClose: () => void; onUpdate: (j: Job) => void }) {
  const actionTypeOptions = useDropdownOptions('action_types', ACTIONS_LIST_FALLBACK)
  const [saving, setSaving] = React.useState(false)
  const [status, setStatus] = React.useState(job.status)
  const [priority, setPriority] = React.useState(job.priority || 'NORMAL')
  const [assignedEmployee, setAssignedEmployee] = React.useState(job.assigned_employee_name || '')
  const [assignedSupervisor, setAssignedSupervisor] = React.useState(job.assigned_supervisor_name || '')
  const [compiledBy, setCompiledBy] = React.useState((job as any).compiled_by || '')
  const [notes, setNotes] = React.useState(job.notes || '')
  const [msg, setMsg] = React.useState('')
  const [spawning, setSpawning] = React.useState<string | null>(null)
  const [spawnTarget, setSpawnTarget] = React.useState<any | null>(null)
  const [lineItems, setLineItems] = React.useState<any[]>([])
  const [attachments, setAttachments] = React.useState<any[]>([])
  const [newLineItems, setNewLineItems] = React.useState<{description:string;quantity:number;uom:string;item_type:string}[]>([])
  const [savingLines, setSavingLines] = React.useState(false)
  const addNewLine = () => setNewLineItems(p => [...p, {description:'',quantity:1,uom:'EA',item_type:'MATERIAL'}])
  const removeNewLine = (i:number) => setNewLineItems(p => p.filter((_,idx)=>idx!==i))
  const updateNewLine = (i:number,field:string,val:any) => setNewLineItems(p => p.map((x,idx)=>idx===i?{...x,[field]:val}:x))
  const saveNewLines = async () => {
    const valid = newLineItems.filter(l => l.description.trim())
    if (!valid.length) return
    setSavingLines(true)
    try {
      const { data: ex } = await supabase.from('job_line_items').select('sort_order').eq('job_id', job.id).order('sort_order',{ascending:false}).limit(1)
      const next = ((ex?.[0]?.sort_order)||0)+1
      await supabase.from('job_line_items').insert(valid.map((x,idx)=>({job_id:job.id,description:x.description.trim(),quantity:x.quantity,uom:x.uom,item_type:x.item_type,cost_price:0,sell_price:0,line_total:0,status:'PENDING',sort_order:next+idx,can_spawn_job:true})))
      // TODO(CR-2 RLS): PostgREST embeds don't inherit outer .eq() filters — cross-entity child_job numbers can leak here. Needs RLS.
      const {data:r} = await supabase.from('job_line_items').select('*, child_job:jobs!child_job_id(job_number)').eq('job_id',job.id).order('sort_order')
      if (r) setLineItems(r.map((li)=>({...li,child_job_number:li.child_job?.job_number||null})))
      setNewLineItems([])
      showMsg('Line items saved')
    } catch(err:any){ showMsg('Error: '+err.message) }
    finally{ setSavingLines(false) }
  }

  React.useEffect(() => {
    // TODO(CR-2 RLS): PostgREST embeds don't inherit outer .eq() filters — cross-entity child_job numbers can leak here. Needs RLS.
    supabase.from('job_line_items')
      .select('*, child_job:jobs!child_job_id(job_number)')
      .eq('job_id', job.id)
      .order('sort_order')
      .then(({ data }) => {
        if (data) setLineItems(data.map((li: any) => ({
          ...li,
          child_job_number: li.child_job?.job_number || null
        })))
      })
    supabase.from('job_attachments')
      .select('*')
      .eq('job_id', job.id)
      .order('created_at')
      .then(({ data }) => { if (data) setAttachments(data) })
  }, [job.id])

  const showMsg = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  const handleSpawnJob = async (lineItem: any) => {
    setSpawning(lineItem.id)
    try {
      // Count existing children to determine suffix (A, B, C...)
      const { data: existingChildren } = await supabase
        .from('jobs')
        .select('id')
        .eq('parent_job_id', job.id)
        .eq('operating_entity', activeEntity)
      const suffix = String.fromCharCode(65 + (existingChildren?.length || 0)) // A, B, C...
      const childJobNumber = (job.job_number || 'JOB') + '-' + suffix
      const { data: childJob, error: jobError } = await supabase.from('jobs').insert({
        operating_entity: activeEntity,
        parent_job_id: job.id,
        is_child_job: true,
        is_parent: false,
        job_number: childJobNumber,
        description: lineItem.description,
        client_name: job.client_name,
        site_req: job.site_req || null,
        due_date: job.due_date || null,
        priority: job.priority || 'NORMAL',
        entry_type: 'CHILD',
        status: 'PENDING',
        workshop_status: 'NOT_STARTED',
        rfq_no: job.rfq_no || null,
        client_rfq_number: job.client_rfq_number || null,
        po_number: job.po_number || null,
        order_number: (job as any).order_number || null,
        drawing_number: job.drawing_number || null,
        compiled_by: (job as any).compiled_by || null,
        notes: 'Spawned from ' + (job.job_number || 'parent job') + ' - ' + lineItem.description,
        date_received: new Date().toISOString().split('T')[0],
        ...buildActionFields(new Set()),
        has_info_for_quote: false,
      }).select().single()
      if (jobError) throw jobError
      // Create line item for child job so it prints on the card
      await supabase.from('job_line_items').insert({ job_id: childJob.id, description: lineItem.description, quantity: lineItem.quantity || 1, uom: lineItem.uom || 'EA', item_type: lineItem.item_type || 'MATERIAL', cost_price: 0, sell_price: 0, line_total: 0, status: 'PENDING', sort_order: 0, can_spawn_job: false })
      const { error: liError } = await supabase.from('job_line_items').update({ child_job_id: childJob.id }).eq('id', lineItem.id)
      if (liError) throw liError
      await supabase.from('jobs').update({ is_parent: true }).eq('id', job.id)
      // LOG: child_job_spawned ML event
      await supabase.from('import_events').insert({
        source: 'child_job_spawned',
        file_name: JSON.stringify({ parent_job_id: job.id, child_job_id: childJob.id, child_suffix: suffix, line_item_id: lineItem.id, spawned_at: new Date().toISOString() }),
        rows_attempted: 1,
        rows_imported: 1,
        rows_failed: 0,
        imported_at: new Date().toISOString(),
        imported_by: 'system',
      }).then(({ error: logErr }) => { if (logErr) console.error('Event log error:', logErr.message) })
      // LOG: no_card_job_created ML event (child job starts without a printed card)
      await supabase.from('import_events').insert({
        source: 'no_card_job_created',
        file_name: JSON.stringify({ job_id: childJob.id, job_type: 'CHILD', created_at: new Date().toISOString() }),
        rows_attempted: 1, rows_imported: 1, rows_failed: 0,
        imported_at: new Date().toISOString(), imported_by: 'system',
      }).then(({ error: logErr }) => { if (logErr) console.error('Event log error:', logErr.message) })
      const { data: updatedItems } = await supabase
        .from('job_line_items')
        .select('*, child_job:jobs!child_job_id(job_number)')
        .eq('job_id', job.id)
        .order('sort_order')
      if (updatedItems) setLineItems(updatedItems.map((li: any) => ({ ...li, child_job_number: li.child_job?.job_number || null })))
      if (childJob) emailChildJobSpawned(job, childJob)
      showMsg('Child job ' + (childJob.job_number || '') + ' created!')
      onUpdate({ ...job, is_parent: true })
    } catch (err: any) {
      showMsg('Error: ' + err.message)
    } finally { setSpawning(null) }
  }


  const handleSave = async () => {
    setSaving(true)
    try {
      const { data, error } = await supabase.from('jobs').update({
        status, priority,
        assigned_employee_name: assignedEmployee || null,
        assigned_supervisor_name: assignedSupervisor || null,
        compiled_by: compiledBy || null,
        notes: notes || null,
      }).eq('id', job.id).select().single()
      if (error) throw error
      onUpdate(data)
      showMsg('Saved successfully')
    } catch (err: any) {
      showMsg('Error: ' + err.message)
    } finally { setSaving(false) }
  }

  const statusOptions = ['PENDING','IN_REVIEW','READY_TO_PRINT','PRINTED']

  return (
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
      <div className="bg-green-600 text-white px-6 py-4 rounded-t-xl flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold">{job.job_number || 'New Job'}</h2>
            {job.entry_type === 'DIRECT' && <span className="text-xs font-bold px-2 py-0.5 bg-orange-400 text-white rounded">DIRECT</span>}
            {job.entry_type === 'CHILD' && <span className="text-xs font-bold px-2 py-0.5 bg-indigo-400 text-white rounded">CHILD JOB</span>}
            {job.entry_type === 'FAST_TRACK' && <span className="text-xs font-bold px-2 py-0.5 bg-amber-400 text-white rounded">⚡ FAST TRACK</span>}
            {job.is_parent && <span className="text-xs font-bold px-2 py-0.5 bg-purple-500 text-white rounded">PARENT</span>}
            {job.is_emergency && <span className="text-xs font-bold px-2 py-0.5 bg-red-500 text-white rounded">EMERGENCY</span>}
          </div>
          <p className="text-green-200 text-xs mt-0.5">{job.client_name || 'No client'}</p>
        </div>
        <button onClick={onClose} className="text-green-200 hover:text-white"><X size={20} /></button>
      </div>
      <div className="overflow-y-auto flex-1 p-6 space-y-5">
        {msg && <div className="px-4 py-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">{msg}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              {statusOptions.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
            <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {job.site_req && <div><span className="text-xs text-gray-500 block">Site Req / PO</span><span className="font-medium">{job.site_req}</span></div>}
          {job.entry_type !== 'DIRECT' && (job.client_rfq_number || job.rfq_no) && <div><span className="text-xs text-gray-500 block">Client RFQ No</span><span className="font-medium text-blue-600">{job.client_rfq_number || job.rfq_no}</span></div>}
          {job.due_date && <div><span className="text-xs text-gray-500 block">Due Date</span><span className="font-medium">{new Date(job.due_date).toLocaleDateString('en-ZA')}</span></div>}
          {job.created_at && <div><span className="text-xs text-gray-500 block">Created</span><span className="font-medium">{new Date(job.created_at).toLocaleDateString('en-ZA')}</span></div>}
          {job.parent_job_id && <div><span className="text-xs text-gray-500 block">Parent Job</span><span className="font-medium text-purple-600">{parentJobNumber || job.parent_job_id.slice(0,8)}</span></div>}
        </div>
        {job.description && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
            <p className="text-sm text-gray-800 bg-gray-50 rounded-lg px-3 py-2">{job.description}</p>
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Drawing Number</label>
          <input type="text" defaultValue={job.drawing_number || ''} onBlur={async (e) => { await supabase.from('jobs').update({ drawing_number: e.target.value || null }).eq('id', job.id) }} placeholder="DWG-001" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Compiled By</label>
          <select value={compiledBy} onChange={e => setCompiledBy(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="">Select...</option>
            <option value="Cherise">Cherise</option>
            <option value="Jeanic">Jeanic</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">Actions Required</label>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {actionTypeOptions.map(label => {
              const col = ACTION_LABEL_TO_COLUMN[label]
              const isChecked = col ? !!(job as any)[col] : ((job as any).actions_required_dynamic || []).includes(label)
              return (
                <label key={label} className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" defaultChecked={isChecked}
                    onChange={async (e) => {
                      const update: Record<string, any> = {}
                      if (col) update[col] = e.target.checked
                      // Also update dynamic column
                      const current: string[] = (job as any).actions_required_dynamic || []
                      update.actions_required_dynamic = e.target.checked
                        ? [...new Set([...current, label])]
                        : current.filter((l: string) => l !== label)
                      await supabase.from('jobs').update(update).eq('id', job.id)
                    }}
                    className="w-3.5 h-3.5 text-green-600 rounded" />
                  <span className="text-gray-700">{label}</span>
                </label>
              )
            })}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">Attached Documents</label>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {([
              ['has_info_for_quote','Info for Quote'],['has_service_schedule','Service Schedule / QCP'],['has_qcp','QCP'],
              ['has_internal_order','Internal Order'],
            ] as [string, string][]).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" defaultChecked={!!(job as any)[key]}
                  onChange={async (e) => {
                    await supabase.from('jobs').update({ [key]: e.target.checked }).eq('id', job.id)
                    if (key === 'has_info_for_quote' && e.target.checked) {
                      await supabase.from('import_events').insert({
                        source: 'info_for_quote_selected',
                        file_name: JSON.stringify({ job_id: job.id, selected_by: 'user', selected_at: new Date().toISOString() }),
                        rows_attempted: 1, rows_imported: 1, rows_failed: 0,
                        imported_at: new Date().toISOString(), imported_by: 'user',
                      }).then(({ error: logErr }) => { if (logErr) console.error('Event log error:', logErr.message) })
                    }
                  }}
                  className="w-3.5 h-3.5 text-green-600 rounded" />
                <span className="text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>
        <>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-gray-500">Line Items</label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Spawn creates a child job</span>
              <button onClick={addNewLine} className="text-xs font-semibold text-green-600 bg-green-50 hover:bg-green-100 px-2 py-0.5 rounded">+ Add Line</button>
            </div>
          </div>
          {lineItems.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50"><tr>
                  <th className="px-3 py-2 text-left text-gray-500 font-medium">#</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-medium">Description</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-medium w-14">Qty</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-medium w-16">UOM</th>
                  <th className="px-2 py-2 text-center text-gray-500 font-medium w-10">QC</th>
                  <th className="px-2 py-2 text-center text-gray-500 font-medium w-10">Ready</th>
                  <th className="px-2 py-2 text-center text-gray-500 font-medium w-10">Disp</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-medium w-24">Child Job</th>
                </tr></thead>
                <tbody>
                  {lineItems.map((item, i) => (
                    <tr key={item.id} className="border-t border-gray-100">
                      <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                      <td className="px-3 py-2 text-gray-800">{item.description}</td>
                      <td className="px-3 py-2">
                        <input type="number" min={1} defaultValue={item.quantity}
                          className="w-16 border border-gray-300 rounded-md px-2 py-1 text-xs text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-gray-400"
                          onBlur={async (e) => {
                            const newQty = parseFloat(e.target.value) || 1
                            if (newQty === item.quantity) return
                            const oldQty = item.quantity
                            await supabase.from('job_line_items').update({ quantity: newQty }).eq('id', item.id)
                            // If this is a child job, sync quantity back to parent line item
                            if (job.is_child_job && job.parent_job_id) {
                              const { data: parentItems } = await supabase.from('job_line_items').select('id, quantity').eq('child_job_id', job.id)
                              if (parentItems && parentItems.length > 0) {
                                await supabase.from('job_line_items').update({ quantity: newQty }).eq('id', parentItems[0].id)
                                await supabase.from('activity_log').insert({
                                  action_type: 'parent_job_quantity_synced', entity_type: 'job', entity_id: job.parent_job_id,
                                  operating_entity: (job.operating_entity === 'ERHA_FC' || job.operating_entity === 'ERHA_SS') ? job.operating_entity : activeEntity,
                                  metadata: { child_job_id: job.id, parent_job_id: job.parent_job_id, old_qty: oldQty, new_qty: newQty, synced_at: new Date().toISOString() },
                                }).then(({ error: logErr }) => { if (logErr) console.error('Activity log error:', logErr.message) })
                              }
                            }
                            setLineItems(prev => prev.map(li => li.id === item.id ? { ...li, quantity: newQty } : li))
                            showMsg('Quantity updated' + (job.is_child_job ? ' & synced to parent' : ''))
                          }} />
                      </td>
                      <td className="px-3 py-2 text-gray-600">{item.uom}</td>
                      <td className="px-2 py-2 text-center">{item.qc_done ? <span className="inline-block w-4 h-4 bg-green-500 rounded-full text-white text-xs leading-4">✓</span> : <span className="inline-block w-4 h-4 bg-gray-200 rounded-full" />}</td>
                      <td className="px-2 py-2 text-center">{item.ready_for_delivery ? <span className="inline-block w-4 h-4 bg-amber-500 rounded-full text-white text-xs leading-4">✓</span> : <span className="inline-block w-4 h-4 bg-gray-200 rounded-full" />}</td>
                      <td className="px-2 py-2 text-center">{item.dispatched ? <span className="inline-block w-4 h-4 bg-[#1d3461] rounded-full text-white text-xs leading-4">✓</span> : <span className="inline-block w-4 h-4 bg-gray-200 rounded-full" />}</td>
                      <td className="px-3 py-2">
                        {item.child_job_id ? (
                          <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                            {item.child_job_number || 'Spawned'}
                          </span>
                        ) : (
                          <button onClick={() => setSpawnTarget(item)} disabled={spawning === item.id} className="px-2 py-0.5 text-xs font-semibold text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 rounded transition-colors">
                            {spawning === item.id ? '...' : 'Spawn'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {newLineItems.length > 0 && (
            <div className="mt-3 border border-green-200 rounded-lg overflow-hidden">
              <div className="bg-green-50 px-3 py-1.5 flex items-center justify-between">
                <span className="text-xs font-medium text-green-700">New Line Items</span>
                <button onClick={saveNewLines} disabled={savingLines} className="text-xs font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 px-3 py-0.5 rounded">{savingLines ? 'Saving...' : 'Save Lines'}</button>
              </div>
              <table className="w-full text-xs">
                <thead className="bg-gray-50"><tr>
                  <th className="px-2 py-1.5 text-left text-gray-500 font-medium">Description</th>
                  <th className="px-2 py-1.5 text-left text-gray-500 font-medium w-12">Qty</th>
                  <th className="px-2 py-1.5 text-left text-gray-500 font-medium w-14">UOM</th>
                  <th className="w-6"></th>
                </tr></thead>
                <tbody>
                  {newLineItems.map((item,i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-2 py-1"><input value={item.description} onChange={e=>updateNewLine(i,'description',e.target.value)} placeholder="Description..." className="border border-gray-200 rounded px-1 py-0.5 text-xs w-full"/></td>
                      <td className="px-2 py-1"><input type="number" min={1} value={item.quantity} onChange={e=>updateNewLine(i,'quantity',Number(e.target.value))} className="border border-gray-200 rounded px-1 py-0.5 text-xs w-full"/></td>
                      <td className="px-2 py-1"><select value={item.uom} onChange={e=>updateNewLine(i,'uom',e.target.value)} className="border border-gray-200 rounded px-1 py-0.5 text-xs w-full">{['EA','M','KG','L','HR','SET','M2','M3','TON'].map(u=><option key={u}>{u}</option>)}</select></td>
                      <td className="px-2 py-1 text-center"><button onClick={()=>removeNewLine(i)} className="text-red-400 hover:text-red-600"><X size={12}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {lineItems.length === 0 && newLineItems.length === 0 && (
            <div className="text-center py-4 border border-dashed border-gray-200 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">No line items yet</p>
              <button onClick={addNewLine} className="text-xs font-semibold text-green-600 hover:underline">+ Add first line item</button>
            </div>
          )}
        </>
        {attachments.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Attachments</label>
            <div className="space-y-1">
              {attachments.map((att: any) => (
                <a key={att.id} href={supabase.storage.from('rfq-attachments').getPublicUrl(att.file_path).data.publicUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-xs text-blue-700 transition-colors">
                  <span>📎</span>
                  <span className="flex-1 truncate">{att.file_name}</span>
                  {att.file_size && <span className="text-gray-400">{(att.file_size/1024).toFixed(0)}KB</span>}
                </a>
              ))}
            </div>
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Notes..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">Close</button>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
          <Check size={14} />{saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
      {spawnTarget && (
        <SpawnJobModal
          lineItem={spawnTarget}
          parentJob={job}
          activeEntity={activeEntity}
          onClose={() => setSpawnTarget(null)}
          onSpawned={async (childJob) => {
            setSpawnTarget(null)
            // TODO(CR-2 RLS): PostgREST embeds don't inherit outer .eq() filters — cross-entity child_job numbers can leak here. Needs RLS.
            const { data: updatedItems } = await supabase
              .from('job_line_items')
              .select('*, child_job:jobs!child_job_id(job_number)')
              .eq('job_id', job.id)
              .order('sort_order')
            if (updatedItems) setLineItems(updatedItems.map((li: any) => ({ ...li, child_job_number: li.child_job?.job_number || null })))
            onUpdate({ ...job, is_parent: true })
            showMsg('Child job ' + childJob.job_number + ' created!')
          }}
        />
      )}
    </div>
  )
}

// CREATE DIRECT JOB MODAL

function CreateDirectJobModal({ activeEntity, onClose, onCreated }: { activeEntity: OperatingEntity; onClose: () => void; onCreated: () => void }) {
  const [saving, setSaving] = React.useState(false)
  const [clientName, setClientName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [siteReq, setSiteReq] = React.useState('')
  const [workType, setWorkType] = React.useState<'contract' | 'quoted'>('contract')
  const [priority, setPriority] = React.useState('NORMAL')
  const [compiledBy, setCompiledBy] = React.useState('')
  const [isEmergency, setIsEmergency] = React.useState(false)
  const [assignedEmployee, setAssignedEmployee] = React.useState('')
  const [assignedSupervisor, setAssignedSupervisor] = React.useState('')
  const [notes, setNotes] = React.useState('')
  const [dateReceived] = React.useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = React.useState('')
  const [hasDrawing, setHasDrawing] = React.useState(false)
  const [drawingNumber, setDrawingNumber] = React.useState('')
  const [directAttachments, setDirectAttachments] = React.useState<Array<{name:string;path:string;size:number}>>( [])
  const [uploadingDirect, setUploadingDirect] = React.useState(false)
  const actionTypeOptions = useDropdownOptions('action_types', ACTIONS_LIST_FALLBACK)
  const [selectedActions, setSelectedActions] = React.useState<Set<string>>(new Set())
  const [lineItems, setLineItems] = React.useState([{ description: '', quantity: 1, uom: 'Each', notes: '' }])

  // Reset all form state on mount to prevent state bleed between modal opens
  React.useEffect(() => {
    setSelectedActions(new Set())
  }, [])

  const toggleDirectAction = (label: string) => setSelectedActions(prev => {
    const next = new Set(prev)
    if (next.has(label)) next.delete(label); else next.add(label)
    return next
  })
  const addLineItem = () => setLineItems(li => [...li, { description: '', quantity: 1, uom: 'Each', notes: '' }])
  const removeLineItem = (i: number) => setLineItems(li => li.filter((_, idx) => idx !== i))
  const updateLineItem = (i: number, field: string, val: any) => setLineItems(li => li.map((item, idx) => idx === i ? { ...item, [field]: val } : item))

  const handleCreate = async () => {
    if (!clientName.trim()) { alert('Client name is required'); return }
    setSaving(true)
    try {
      const { data: job, error } = await supabase.from('jobs').insert({
        operating_entity: activeEntity,
        description: description.trim() || null,
        client_name: clientName.trim(), site_req: siteReq.trim() || null,
        is_contract_work: workType === 'contract', is_quoted_work: workType === 'quoted',
        priority, compiled_by: compiledBy.trim() || null, is_emergency: isEmergency,
        assigned_employee_name: assignedEmployee.trim() || null,
        assigned_supervisor_name: assignedSupervisor.trim() || null,
        notes: notes.trim() || null, date_received: dateReceived, due_date: dueDate || null,
        has_drawing: hasDrawing,
        drawing_number: drawingNumber.trim() || null,
        client_rfq_number: null,
        ...buildActionFields(selectedActions),
        entry_type: 'DIRECT', status: 'PENDING', workshop_status: 'NOT_STARTED',
        has_info_for_quote: false,
      }).select().single()
      if (error) throw error
      const validItems = lineItems.filter(l => l.description.trim())
      if (validItems.length > 0) {
        await supabase.from('job_line_items').insert(
          validItems.map((item, idx) => ({
            job_id: job.id, description: item.description.trim(),
            quantity: item.quantity, uom: item.uom,
            specification: item.notes.trim() || null, sort_order: idx,
            status: 'PENDING', cost_price: 0, sell_price: 0, line_total: 0, can_spawn_job: true,
          }))
        )
      }
      // LOG: no_card_job_created ML event (direct job starts without a printed card)
      await supabase.from('import_events').insert({
        source: 'no_card_job_created',
        file_name: JSON.stringify({ job_id: job.id, job_type: 'DIRECT', created_at: new Date().toISOString() }),
        rows_attempted: 1, rows_imported: 1, rows_failed: 0,
        imported_at: new Date().toISOString(), imported_by: 'system',
      }).then(({ error: logErr }) => { if (logErr) console.error('Event log error:', logErr.message) })
      onCreated()
      onClose()
    } catch (err: any) { alert('Error: ' + err.message) }
    finally { setSaving(false) }
  }

  const uomOptions = ['Each', 'Meter', 'kg', 'Liter', 'Hour', 'Set', 'm2', 'm3']
  // actionList is now dynamic from actionTypeOptions

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        <div className="bg-indigo-600 text-white px-6 py-4 rounded-t-xl flex items-center justify-between shrink-0">
          <div><h2 className="text-lg font-bold">Create New Job</h2><p className="text-indigo-200 text-xs mt-0.5">Direct Job (No RFQ)</p></div>
          <button onClick={onClose} className="text-indigo-200 hover:text-white"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Client *</label><input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Client name..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Site Req / PO</label><input value={siteReq} onChange={e => setSiteReq(e.target.value)} placeholder="e.g. PO-12345" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Due Date</label><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Job Description *</label><input value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of the work..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          <div className="grid grid-cols-4 gap-4 items-end">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Work Type</label>
              <div className="flex rounded-lg overflow-hidden border border-gray-300">
                <button onClick={() => setWorkType('contract')} className={'flex-1 py-2 text-xs font-semibold transition-colors ' + (workType === 'contract' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50')}>Contract</button>
                <button onClick={() => setWorkType('quoted')} className={'flex-1 py-2 text-xs font-semibold transition-colors ' + (workType === 'quoted' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50')}>Quoted</button>
              </div>
            </div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Priority</label><select value={priority} onChange={e => setPriority(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"><option value="LOW">Low</option><option value="NORMAL">Normal</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Compiled By</label><input value={compiledBy} onChange={e => setCompiledBy(e.target.value)} placeholder="Name..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            <div className="flex items-center gap-2 pb-2"><input type="checkbox" id="djEmergency" checked={isEmergency} onChange={e => setIsEmergency(e.target.checked)} className="w-4 h-4 text-red-600" /><label htmlFor="djEmergency" className="text-sm font-medium text-red-600">Emergency</label></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Assigned Employee</label><input value={assignedEmployee} onChange={e => setAssignedEmployee(e.target.value)} placeholder="Employee name..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Supervisor</label><input value={assignedSupervisor} onChange={e => setAssignedSupervisor(e.target.value)} placeholder="Supervisor name..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Actions Required</label>
            <div className="grid grid-cols-3 gap-2">
              {actionTypeOptions.map(label => (
                <label key={label} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={selectedActions.has(label)} onChange={() => toggleDirectAction(label)} className="w-4 h-4 text-indigo-600 rounded" />
                  <span className="text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600">Line Items</label>
              <button onClick={addLineItem} className="text-xs text-indigo-600 hover:underline font-medium">+ Add Item</button>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50"><tr><th className="px-2 py-2 text-left text-gray-500 font-medium">#</th><th className="px-2 py-2 text-left text-gray-500 font-medium">Description</th><th className="px-2 py-2 text-left text-gray-500 font-medium w-16">Qty</th><th className="px-2 py-2 text-left text-gray-500 font-medium w-20">UOM</th><th className="w-6"></th></tr></thead>
                <tbody>
                  {lineItems.map((item, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-2 py-1.5 text-gray-400">{i + 1}</td>
                      <td className="px-2 py-1.5"><input value={item.description} onChange={e => updateLineItem(i, 'description', e.target.value)} placeholder="Description" className="w-full border-0 focus:outline-none text-xs" /></td>
                      <td className="px-2 py-1.5"><input type="number" value={item.quantity} onChange={e => updateLineItem(i, 'quantity', Number(e.target.value))} min={1} className="w-full border border-gray-200 rounded px-1 py-0.5 text-xs" /></td>
                      <td className="px-2 py-1.5"><select value={item.uom} onChange={e => updateLineItem(i, 'uom', e.target.value)} className="w-full border border-gray-200 rounded px-1 py-0.5 text-xs">{uomOptions.map(u => <option key={u}>{u}</option>)}</select></td>
                      <td className="px-2 py-1.5 text-center">{lineItems.length > 1 && <button onClick={() => removeLineItem(i)} className="text-red-400 hover:text-red-600"><X size={12} /></button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex items-center gap-2"><input type="checkbox" id="djDrawing" checked={hasDrawing} onChange={e => setHasDrawing(e.target.checked)} className="w-4 h-4" /><label htmlFor="djDrawing" className="text-sm text-gray-700">Drawing / Sketches Attached</label></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Drawing Number</label><input value={drawingNumber} onChange={e => setDrawingNumber(e.target.value)} placeholder="DWG-001" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Attachments</label>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
              <input type="file" multiple id="directFileUpload" className="hidden" onChange={async (e) => {
                const files = Array.from(e.target.files || [])
                if (!files.length) return
                setUploadingDirect(true)
                const uploaded: Array<{name:string;path:string;size:number}> = []
                for (const file of files) {
                  const path = `direct/${Date.now()}_${file.name}`
                  const { error } = await supabase.storage.from('rfq-attachments').upload(path, file)
                  if (!error) uploaded.push({ name: file.name, path, size: file.size })
                }
                setDirectAttachments(a => [...a, ...uploaded])
                setUploadingDirect(false)
              }} />
              <label htmlFor="directFileUpload" className="cursor-pointer text-sm text-indigo-600 hover:underline">{uploadingDirect ? 'Uploading...' : '+ Add files'}</label>
            </div>
            {directAttachments.length > 0 && <div className="mt-2 space-y-1">{directAttachments.map((a,i) => <div key={i} className="flex items-center justify-between text-xs bg-gray-50 rounded px-2 py-1"><span>{a.name}</span><button onClick={() => setDirectAttachments(x => x.filter((_,idx)=>idx!==i))} className="text-red-400 hover:text-red-600 ml-2">x</button></div>)}</div>}
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Additional notes..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" /></div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleCreate} disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
            <Briefcase size={14} />{saving ? 'Creating...' : 'Create Job'}
          </button>
        </div>
      </div>
    </div>
  )
}

// CREATE RFQ MODAL

function CreateRFQModal({ activeEntity, onClose, onCreated }: { activeEntity: OperatingEntity; onClose: () => void; onCreated: () => void }) {
  const [saving, setSaving] = React.useState(false)
  const [uploadingFiles, setUploadingFiles] = React.useState(false)
  const [clients, setClients] = React.useState<any[]>([])
  const [showNewClient, setShowNewClient] = React.useState(false)
  const [newClientName, setNewClientName] = React.useState('')
  const [attachments, setAttachments] = React.useState<Array<{ name: string; path: string; size: number }>>([])
  const mediaOptions = useDropdownOptions('media_received', MEDIA_OPTIONS_FALLBACK)
  const actionTypeOptions = useDropdownOptions('action_types', ACTIONS_LIST_FALLBACK)
  const [form, setForm] = React.useState({
    rfq_direction: 'INCOMING',
    rfq_no: '',
    client_rfq_number: '',
    priority: 'MEDIUM',
    request_date: new Date().toISOString().split('T')[0],
    required_date: '',
    client_id: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    media_received: 'Email',
    department_cg: '',
    actions_required: [] as string[],
    drawing_number: '',
    description: '',
    special_requirements: '',
    notes: '',
  })
  const [lineItems, setLineItems] = React.useState([
    { item_type: 'MATERIAL', description: '', quantity: 1, unit_of_measure: 'EA' }
  ])

  React.useEffect(() => {
    supabase.from('clients').select('id, company_name').order('company_name').then(({ data }) => {
      if (data) setClients(data)
    })
  }, [])

  const set = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }))

  const toggleAction = (action: string) => {
    setForm(f => ({
      ...f,
      actions_required: f.actions_required.includes(action)
        ? f.actions_required.filter((a: string) => a !== action)
        : [...f.actions_required, action]
    }))
  }

  const addLineItem = () => setLineItems(li => [...li, { item_type: 'MATERIAL', description: '', quantity: 1, unit_of_measure: 'EA' }])
  const removeLineItem = (i: number) => setLineItems(li => li.filter((_, idx) => idx !== i))
  const updateLineItem = (i: number, field: string, value: any) =>
    setLineItems(li => li.map((item, idx) => idx === i ? { ...item, [field]: value } : item))

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploadingFiles(true)
    const uploaded: Array<{ name: string; path: string; size: number }> = []
    for (const file of Array.from(files)) {
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
      const path = `rfq-drafts/${Date.now()}-${safeName}`
      const { error } = await supabase.storage.from('rfq-attachments').upload(path, file)
      if (!error) uploaded.push({ name: file.name, path, size: file.size })
      else console.error('Upload error:', error.message)
    }
    setAttachments(prev => [...prev, ...uploaded])
    setUploadingFiles(false)
    e.target.value = ''
  }

  const removeAttachment = async (path: string) => {
    await supabase.storage.from('rfq-attachments').remove([path])
    setAttachments(prev => prev.filter(a => a.path !== path))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handleSave = async () => {
    if (!form.client_id && !showNewClient) { alert('Please select a client'); return }
    if (showNewClient && !newClientName.trim()) { alert('Please enter the new client name'); return }
    if (!form.description.trim()) { alert('Description is required'); return }
    setSaving(true)
    try {
      let clientId = form.client_id
      if (showNewClient && newClientName.trim()) {
        const { data: nc, error: ce } = await supabase
          .from('clients')
          .insert({ company_name: newClientName.trim() })
          .select('id')
          .single()
        if (ce) throw ce
        if (nc) clientId = nc.id
      }

      const { count } = await supabase.from('rfqs').select('*', { count: 'exact', head: true }).eq('operating_entity', activeEntity)
      const enqNumber = form.rfq_no

      const { data: rfq, error: rfqError } = await supabase.from('rfqs').insert({
        enq_number: enqNumber,
        rfq_no: enqNumber,
        rfq_direction: form.rfq_direction,
        operating_entity: activeEntity,
        client_rfq_number: form.client_rfq_number || null,
        priority: form.priority,
        request_date: form.request_date || null,
        required_date: form.required_date || null,
        client_id: clientId,
        contact_person: form.contact_person || null,
        contact_email: form.contact_email || null,
        contact_phone: form.contact_phone || null,
        media_received: form.media_received || null,
        department_cg: form.department_cg || null,
        actions_required: form.actions_required.length > 0 ? form.actions_required.join(',') : null,
        drawing_number: form.drawing_number || null,
        description: form.description.trim(),
        special_requirements: form.special_requirements || null,
        notes: form.notes || null,
        status: 'NEW',
      }).select('id').single()

      if (rfqError) throw rfqError

      const validItems = lineItems.filter(li => li.description.trim())
      if (validItems.length > 0) {
        const { error: liError } = await supabase.from('rfq_line_items').insert(
          validItems.map((li, i) => ({
            rfq_id: rfq.id,
            line_number: i + 1,
            item_type: li.item_type,
            description: li.description.trim(),
            quantity: li.quantity,
            unit_of_measure: li.unit_of_measure,
          }))
        )
        if (liError) console.error('Line items error:', liError.message)
      }

      for (const att of attachments) {
        const safeName = att.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
        const finalPath = `${rfq.id}/${safeName}`
        const { error: moveErr } = await supabase.storage
          .from('rfq-attachments')
          .move(att.path, finalPath)
        if (!moveErr) {
          await supabase.from('rfq_attachments').insert({
            rfq_id: rfq.id,
            file_name: att.name,
            file_path: finalPath,
            file_size: att.size,
          })
        }
      }

      emailRFQCreated({ ...rfq, client_name: newClientName.trim() || form.client_id, description: form.description, priority: form.priority, request_date: form.request_date, required_date: form.required_date, rfq_no: enqNumber, client_rfq_number: form.client_rfq_number })
      onCreated()
      onClose()
    } catch (err: any) {
      alert('Error creating RFQ: ' + (err.message || String(err)))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">New RFQ</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none"><X size={18} /></button>
        </div>

        <div className="px-6 py-5 space-y-6 max-h-[75vh] overflow-y-auto">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Direction & Reference</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {(['INCOMING', 'OUTGOING'] as const).map(dir => (
                <button key={dir} type="button" onClick={() => set('rfq_direction', dir)}
                  className={`py-3 rounded-lg border-2 text-sm font-semibold transition-all text-left px-4 ${form.rfq_direction === dir ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                  <div>{dir === 'INCOMING' ? 'INCOMING' : 'OUTGOING'}</div>
                  <div className="text-xs font-normal mt-0.5 opacity-70">{dir === 'INCOMING' ? 'Client requesting from ERHA' : 'ERHA requesting from supplier'}</div>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
                <select value={form.priority} onChange={e => set('priority', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Client RFQ / Reference No.</label>
                <input type="text" value={form.client_rfq_number} onChange={e => set('client_rfq_number', e.target.value)} placeholder="Client's reference number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Media Received</label>
                <select value={form.media_received} onChange={e => set('media_received', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {mediaOptions.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date Received</label>
                <input type="date" value={form.request_date} onChange={e => set('request_date', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Required By</label>
                <input type="date" value={form.required_date} onChange={e => set('required_date', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Client</p>
            {!showNewClient ? (
              <div className="flex gap-2 mb-3">
                <select value={form.client_id} onChange={e => set('client_id', e.target.value)} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select client...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
                <button type="button" onClick={() => setShowNewClient(true)} className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 whitespace-nowrap font-medium">+ New Client</button>
              </div>
            ) : (
              <div className="flex gap-2 mb-3 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">New Client Name *</label>
                  <input type="text" value={newClientName} onChange={e => setNewClientName(e.target.value)} placeholder="Company name" autoFocus className="w-full border border-blue-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <button type="button" onClick={() => { setShowNewClient(false); setNewClientName('') }} className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600">Cancel</button>
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Contact Person</label><input type="text" value={form.contact_person} onChange={e => set('contact_person', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Contact Email</label><input type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Contact Phone</label><input type="text" value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Job Detail</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Drawing Number</label>
                <input type="text" value={form.drawing_number} onChange={e => set('drawing_number', e.target.value)} placeholder="DWG-001" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-600 mb-2">Actions Required</label>
              <div className="flex flex-wrap gap-1.5">
                {actionTypeOptions.map(a => (
                  <button key={a} type="button" onClick={() => toggleAction(a)}
                    className={`px-2.5 py-1 rounded text-xs font-medium border transition-all ${form.actions_required.includes(a) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">Description *</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Describe the work required..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Special Requirements</label><textarea value={form.special_requirements} onChange={e => set('special_requirements', e.target.value)} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Notes</label><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" /></div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Line Items</p>
              <button type="button" onClick={addLineItem} className="text-xs text-blue-600 hover:text-blue-700 font-semibold">+ Add Item</button>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Description</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 w-20">Qty</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 w-20">UOM</th>
                    <th className="w-8 px-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lineItems.map((li, i) => (
                    <tr key={i}>
                      <td className="px-2 py-1.5"><input type="text" value={li.description} onChange={e => updateLineItem(i, 'description', e.target.value)} placeholder="Item description" className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" /></td>
                      <td className="px-2 py-1.5"><input type="number" min="0" step="0.01" value={li.quantity} onChange={e => updateLineItem(i, 'quantity', parseFloat(e.target.value) || 1)} className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" /></td>
                      <td className="px-2 py-1.5"><select value={li.unit_of_measure} onChange={e => updateLineItem(i, 'unit_of_measure', e.target.value)} className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">{UOM_OPTIONS.map(u => <option key={u}>{u}</option>)}</select></td>
                      <td className="px-2 py-1.5 text-center">{lineItems.length > 1 && <button type="button" onClick={() => removeLineItem(i)} className="text-red-400 hover:text-red-600"><X size={12} /></button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Attachments</p>
            <label className={`flex items-center gap-3 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${uploadingFiles ? 'border-blue-300 bg-blue-50 cursor-wait' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}`}>
              <Paperclip size={20} className="text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700">{uploadingFiles ? 'Uploading files...' : 'Click to attach files'}</p>
                <p className="text-xs text-gray-400">Any file type - Up to 50 MB each - Multiple allowed</p>
              </div>
              <input type="file" multiple onChange={handleFileChange} className="hidden" disabled={uploadingFiles} />
            </label>
            {attachments.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {attachments.map((att, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={14} className="text-gray-400 shrink-0" />
                      <span className="text-xs font-medium text-gray-700 truncate">{att.name}</span>
                      <span className="text-xs text-gray-400 shrink-0">{formatFileSize(att.size)}</span>
                    </div>
                    <button type="button" onClick={() => removeAttachment(att.path)} className="text-red-400 hover:text-red-600 ml-2"><X size={12} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium">Cancel</button>
          <button type="button" onClick={handleSave} disabled={saving || uploadingFiles} className="px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {saving ? 'Creating...' : 'Create RFQ'}
          </button>
        </div>
      </div>
    </div>
  )
}

// RFQ DETAIL PANEL

function RFQDetailPanel({ rfq, onClose, onUpdate, role, activeEntity, onJobCreated, onNavigateToJob }: { rfq: RFQ; onClose: () => void; onUpdate: (rfq: RFQ) => void; role: string | null; activeEntity: OperatingEntity; onJobCreated?: () => void; onNavigateToJob?: (jobNumber: string) => void }) {
  const mediaOptions = useDropdownOptions('media_received', MEDIA_OPTIONS_FALLBACK)
  const actionTypeOptions = useDropdownOptions('action_types', ACTIONS_LIST_FALLBACK)
  const [lineItems, setLineItems] = React.useState<LineItem[]>([])
  const [panelLineItems, setPanelLineItems] = React.useState<any[]>([])
  const [loadingItems, setLoadingItems] = React.useState(true)
  const [panelAttachments, setPanelAttachments] = React.useState<any[]>([])
  const [uploadingPanelFiles, setUploadingPanelFiles] = React.useState(false)
  const [selectedQuoter, setSelectedQuoter] = React.useState(rfq.assigned_quoter_name || '')
  const [assigning, setAssigning] = React.useState(false)
  const [showEmail, setShowEmail] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [actionMsg, setActionMsg] = React.useState<string | null>(null)

  const [editContactPerson, setEditContactPerson] = React.useState(rfq.contact_person || '')
  const [editContactEmail, setEditContactEmail] = React.useState(rfq.contact_email || '')
  const [editContactPhone, setEditContactPhone] = React.useState(rfq.contact_phone || '')
  const [editClientRfqNumber, setEditClientRfqNumber] = React.useState(rfq.client_rfq_number || '')
  const [editDrawingNumber, setEditDrawingNumber] = React.useState(rfq.drawing_number || '')
  const [editRequestedBy, setEditRequestedBy] = React.useState(rfq.requested_by || '')
  const [editMediaReceived, setEditMediaReceived] = React.useState(rfq.media_received || '')
  const [editDateReceived, setEditDateReceived] = React.useState(rfq.request_date || '')
  const [editRequiredBy, setEditRequiredBy] = React.useState(rfq.required_date || '')
  const [editPriority, setEditPriority] = React.useState(rfq.priority || 'MEDIUM')
  const [editDepartmentCG] = React.useState(rfq.department_cg || '')
  const [editActions, setEditActions] = React.useState<string[]>((rfq.actions_required || '').split(',').filter(Boolean))
  const [editDescription, setEditDescription] = React.useState(rfq.description || '')
  const [editSpecialReqs, setEditSpecialReqs] = React.useState(rfq.special_requirements || '')
  const [editNotes, setEditNotes] = React.useState(rfq.notes || '')

  const [quoteNumber, setQuoteNumber] = React.useState(rfq.quote_number || '')
  const [quoteValue, setQuoteValue] = React.useState(rfq.quote_value_excl_vat ? String(rfq.quote_value_excl_vat) : '')
  const [validUntil, setValidUntil] = React.useState(rfq.valid_until || '')
  const [poNumber, setPoNumber] = React.useState(rfq.po_number || '')

  const [orderDate, setOrderDate] = React.useState(rfq.order_date || '')
  const [invoiceNumber, setInvoiceNumber] = React.useState(rfq.invoice_number || '')
  const [invoiceDate, setInvoiceDate] = React.useState(rfq.invoice_date || '')
  const [invoiceValue, setInvoiceValue] = React.useState(rfq.invoice_value ? String(rfq.invoice_value) : '')
  const [paymentStatus, setPaymentStatus] = React.useState(rfq.payment_status || '')

  React.useEffect(() => {
    setLoadingItems(true)
    supabase.from('rfq_line_items').select('id, line_number, item_type, description, quantity, unit_of_measure').eq('rfq_id', rfq.id).order('line_number')
      .then(({ data }) => { setLineItems(data || []); setPanelLineItems(data || []); setLoadingItems(false) })
    supabase.from('rfq_attachments').select('id, file_name, file_path').eq('rfq_id', rfq.id)
      .then(({ data }) => setPanelAttachments(data || []))
  }, [rfq.id])

  const showMsg = (msg: string) => { setActionMsg(msg); setTimeout(() => setActionMsg(null), 3000) }

  const handleAssign = async () => {
    if (!selectedQuoter) return
    setAssigning(true)
    try {
      const { data, error } = await supabase.from('rfqs').update({ assigned_quoter_name: selectedQuoter, status: 'PENDING' }).eq('id', rfq.id).select('*, clients(company_name)').single()
      if (error) throw error
      emailQuoterAssigned(data, selectedQuoter)
      onUpdate(data)
    } catch (e: any) { showMsg('Error: ' + e.message) }
    finally { setAssigning(false) }
  }

  const addPanelLineItem = () => setPanelLineItems(prev => [...prev, { item_type: 'MATERIAL', description: '', quantity: '1', unit_of_measure: 'EA' }])
  const removePanelLineItem = (idx: number) => setPanelLineItems(prev => prev.filter((_, i) => i !== idx))
  const updatePanelLineItem = (idx: number, field: string, value: string) => setPanelLineItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))

  const handleSaveLineItems = async () => {
    setSaving(true)
    try {
      await supabase.from('rfq_line_items').delete().eq('rfq_id', rfq.id)
      const validItems = panelLineItems.filter(i => i.description?.trim())
      if (validItems.length > 0) {
        const rows = validItems.map((item, idx) => ({ rfq_id: rfq.id, line_number: idx + 1, item_type: item.item_type, description: item.description.trim(), quantity: parseFloat(item.quantity) || 1, unit_of_measure: item.unit_of_measure }))
        const { error } = await supabase.from('rfq_line_items').insert(rows)
        if (error) throw error
      }
      showMsg('Line items saved')
    } catch (e: any) { alert('Error: ' + e.message) }
    finally { setSaving(false) }
  }

  // Entity reclassification (moving an RFQ between ERHA_FC and ERHA_SS)
  // is deferred to a future admin tool. Do not reintroduce without
  // explicit Hendrik sign-off — it creates data-consistency risk with
  // downstream jobs, POs, and activity_log records.
  const handleSaveRFQDetails = async () => {
    setSaving(true)
    try {
      const { data, error } = await supabase.from('rfqs').update({
        contact_person: editContactPerson || null, contact_email: editContactEmail || null, contact_phone: editContactPhone || null,
        client_rfq_number: editClientRfqNumber || null, drawing_number: editDrawingNumber || null, requested_by: editRequestedBy || null,
        media_received: editMediaReceived || null, request_date: editDateReceived || null,
        required_date: editRequiredBy || null, priority: editPriority, department_cg: editDepartmentCG || null,
        actions_required: editActions.join(',') || null, description: editDescription.trim(), special_requirements: editSpecialReqs || null, notes: editNotes || null,
      }).eq('id', rfq.id).select('*, clients(company_name)').single()
      if (error) throw error
      onUpdate(data)
      showMsg('RFQ details saved')
    } catch (e: any) { alert('Error: ' + e.message) }
    finally { setSaving(false) }
  }

  const handleSaveQuote = async () => {
    if (!quoteNumber.trim()) { alert('Please enter the Pastel quote number'); return }
    if (!quoteValue.trim()) { alert('Please enter the quote value'); return }
    setSaving(true)
    try {
      const { data, error } = await supabase.from('rfqs').update({ quote_number: quoteNumber.trim(), quote_value_excl_vat: parseFloat(quoteValue), quote_value_incl_vat: parseFloat(quoteValue) * 1.15, valid_until: validUntil || null, status: 'QUOTED' }).eq('id', rfq.id).select('*, clients(company_name)').single()
      if (error) throw error
      onUpdate(data)
      emailQuoteReady(data)
      showMsg('Quote saved - card moved to Quoted')
    } catch (e: any) { alert('Error: ' + e.message) }
    finally { setSaving(false) }
  }

  const handleSaveOrder = async () => {
    if (!poNumber.trim()) { alert('Please enter the client PO number'); return }
    setSaving(true)
    try {
      // GUARD: Check if job_number already locked on this RFQ (Fast Track or prior Order Won)
      const { data: freshRfq } = await supabase.from('rfqs').select('job_number').eq('id', rfq.id).single()
      const jobAlreadyLocked = !!(freshRfq?.job_number || rfq.job_number)

      if (jobAlreadyLocked) {
        // Job already exists — just update PO/order fields on RFQ and the existing job, skip job creation
        const lockedJobNumber = freshRfq?.job_number || rfq.job_number
        const { data, error } = await supabase.from('rfqs').update({ po_number: poNumber.trim(), order_date: orderDate || null, status: 'ACCEPTED' }).eq('id', rfq.id).select('*, clients(company_name)').single()
        if (error) throw error
        onUpdate(data)
        // Update the existing job's PO fields too
        await supabase.from('jobs').update({ po_number: poNumber.trim(), order_number: poNumber.trim() }).eq('rfq_id', rfq.id).eq('operating_entity', activeEntity)
        showMsg('PO updated on existing job ' + lockedJobNumber + '. No new job created.')
        if (onJobCreated) onJobCreated()
      } else {
        // GUARD: Also check jobs table for any linked job (belt & suspenders)
        const { data: existingJobs } = await supabase.from('jobs').select('job_number').eq('rfq_id', rfq.id).eq('operating_entity', activeEntity)
        if (existingJobs && existingJobs.length > 0) {
          alert('⚠️ DUPLICATE DETECTED: A job (' + existingJobs[0].job_number + ') already exists for this RFQ. Updating PO on existing job instead.')
          const { data, error } = await supabase.from('rfqs').update({ po_number: poNumber.trim(), order_date: orderDate || null, job_number: existingJobs[0].job_number, status: 'ACCEPTED' }).eq('id', rfq.id).select('*, clients(company_name)').single()
          if (error) throw error
          onUpdate(data)
          await supabase.from('jobs').update({ po_number: poNumber.trim(), order_number: poNumber.trim() }).eq('rfq_id', rfq.id).eq('operating_entity', activeEntity)
          if (onJobCreated) onJobCreated()
          return
        }

        // 1. Update RFQ to ACCEPTED
        const { data, error } = await supabase.from('rfqs').update({ po_number: poNumber.trim(), order_date: orderDate || null, status: 'ACCEPTED' }).eq('id', rfq.id).select('*, clients(company_name)').single()
        if (error) throw error
        onUpdate(data)

        // 2. Create job record with all RFQ fields (job_number auto-set by DB trigger)
        const { data: jobData, error: jobError } = await supabase.from('jobs').insert({
          rfq_id: rfq.id,
          rfq_no: rfq.rfq_no || null,
          rfq_number: rfq.rfq_no || null,
          enq_number: rfq.enq_number || null,
          client_name: rfq.clients?.company_name || (rfq as any).client_name || 'Unknown Client',
          description: rfq.description,
          po_number: poNumber.trim(),
          order_number: poNumber.trim(),
          status: 'PENDING',
          workshop_status: 'NOT_STARTED',
          entry_type: 'RFQ',
          priority: rfq.priority || 'NORMAL',
          site_req: rfq.site_req || null,
          contact_person: rfq.contact_person || null,
          contact_email: rfq.contact_email || null,
          contact_phone: rfq.contact_phone || null,
          due_date: rfq.required_date || null,
          date_received: rfq.request_date || new Date().toISOString().split('T')[0],
          special_requirements: rfq.special_requirements || null,
          notes: rfq.notes || null,
          drawing_number: rfq.drawing_number || null,
          has_drawing: rfq.drawing_number ? true : false,
          is_contract_work: rfq.is_contract_work || false,
          operating_entity: (rfq.operating_entity === 'ERHA_FC' || rfq.operating_entity === 'ERHA_SS') ? rfq.operating_entity : activeEntity,
          client_rfq_number: rfq.client_rfq_number || null,
          is_parent: false,
          is_child_job: false,
          ...buildActionFields(new Set()),
          has_info_for_quote: false,
        }).select('id, job_number').single()

        if (jobError) {
          console.error('Job creation error:', jobError.message)
          showMsg('Order saved but job creation failed - check console')
        } else {
          const newJobNumber = jobData.job_number
          // LOCK: Store job_number on RFQ immediately (Order Won = ACCEPTED)
          await supabase.from('rfqs').update({ job_number: newJobNumber, status: 'ACCEPTED' }).eq('id', rfq.id)

          // 3. Copy line items from RFQ to job
          const { data: rfqItems } = await supabase
            .from('rfq_line_items')
            .select('line_number, item_type, description, quantity, unit_of_measure')
            .eq('rfq_id', rfq.id)
            .order('line_number')

          if (rfqItems && rfqItems.length > 0) {
            const jobLineItems = rfqItems.map((item, idx) => ({
              job_id: jobData.id,
              description: item.description,
              quantity: item.quantity || 1,
              uom: item.unit_of_measure || 'EA',
              item_type: item.item_type || 'MATERIAL',
              cost_price: 0,
              sell_price: 0,
              line_total: 0,
              status: 'PENDING',
              sort_order: idx + 1,
              can_spawn_job: true,
            }))
            const { error: liError } = await supabase.from('job_line_items').insert(jobLineItems)
            if (liError) console.error('Line items copy error:', liError.message)
            else console.log('Copied', jobLineItems.length, 'line items to job')
          }


          // 4. Copy attachments from RFQ to job
          const { data: rfqAttachments } = await supabase
            .from('rfq_attachments')
            .select('*')
            .eq('rfq_id', rfq.id)

          if (rfqAttachments && rfqAttachments.length > 0) {
            const jobAttachments = rfqAttachments.map((att: any) => ({
              job_id: jobData.id,
              rfq_attachment_id: att.id,
              file_name: att.file_name,
              file_path: att.file_path,
              file_size: att.file_size || null,
              file_type: att.file_type || null,
              uploaded_by: att.uploaded_by || null,
            }))
            const { error: attError } = await supabase.from('job_attachments').insert(jobAttachments)
            if (attError) console.error('Attachment copy error:', attError.message)
            else console.log('Copied', jobAttachments.length, 'attachments to job')
          }

          if (jobData) emailOrderWon(data, (jobData as any).job_number || '')
          showMsg('Order won! Job ' + newJobNumber + ' created & locked.')
          if (onJobCreated) onJobCreated()
        }
      }
    } catch (e: any) { alert('Error: ' + e.message) }
    finally { setSaving(false) }
  }

  const handleSaveInvoice = async () => {
    if (!invoiceNumber.trim()) { alert('Please enter the Pastel invoice number'); return }
    setSaving(true)
    try {
      const { data, error } = await supabase.from('rfqs').update({ invoice_number: invoiceNumber.trim(), invoice_date: invoiceDate || null, invoice_value: invoiceValue ? parseFloat(invoiceValue) : null, payment_status: paymentStatus || null, status: 'JOB_CREATED' }).eq('id', rfq.id).select('*, clients(company_name)').single()
      if (error) throw error
      onUpdate(data)
      // Auto-trigger: move linked job to INVOICED on Workshop Board
      const { data: linkedJobs } = await supabase.from('jobs').select('id, job_number, workshop_status').eq('rfq_id', rfq.id).eq('operating_entity', activeEntity)
      if (linkedJobs && linkedJobs.length > 0) {
        for (const lj of linkedJobs) {
          await supabase.from('jobs').update({ workshop_status: 'INVOICED' }).eq('id', lj.id)
          await supabase.from('activity_log').insert({
            action_type: 'job_auto_invoiced', entity_type: 'job', entity_id: lj.id,
            operating_entity: (rfq.operating_entity === 'ERHA_FC' || rfq.operating_entity === 'ERHA_SS') ? rfq.operating_entity : activeEntity,
            metadata: { rfq_id: rfq.id, job_number: lj.job_number, invoice_number: invoiceNumber.trim(), invoiced_at: new Date().toISOString() },
          }).then(({ error: logErr }) => { if (logErr) console.error('Activity log error:', logErr.message) })
        }
      }
      showMsg('Invoice saved - card moved to Complete')
    } catch (e: any) { alert('Error: ' + e.message) }
    finally { setSaving(false) }
  }

  const enqNo = rfq.client_rfq_number || rfq.enq_number || rfq.rfq_no || '-'
  const priority = rfq.priority?.toUpperCase() || 'NORMAL'
  const direction = rfq.rfq_direction?.toUpperCase()
  const status = rfq.status || 'NEW'

  return (
    <>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="text-base font-bold text-gray-900">{enqNo}</span>
              {direction && <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${direction === 'OUTGOING' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>{direction}</span>}
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_BADGE[priority] || PRIORITY_BADGE['NORMAL']}`}>{priority}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}>{STATUS_LABELS[status] || status}</span>
            </div>
            <p className="text-sm text-gray-500 truncate">{rfq.clients?.company_name || ''}</p>
          </div>
          <button onClick={onClose} className="ml-3 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {actionMsg && <div className="mx-5 mt-3 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{actionMsg}</div>}

          <div className="px-5 py-4 border-b border-gray-100 space-y-3">
            {role === 'HENDRIK' && (status === 'NEW' || status === 'PENDING') && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Assign Quoter</p>
                <div className="flex gap-2">
                  <select value={selectedQuoter} onChange={e => setSelectedQuoter(e.target.value)} className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                    <option value="">Select quoter...</option>
                    {QUOTERS.map(q => <option key={q} value={q}>{q}</option>)}
                  </select>
                  <button onClick={handleAssign} disabled={!selectedQuoter || assigning} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {assigning ? '...' : status === 'NEW' ? 'Assign' : 'Reassign'}
                  </button>
                </div>
              </div>
            )}
            <button onClick={() => setShowEmail(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors">
              <Mail size={15} /> Send Email to Client
            </button>
          </div>

          {(['PENDING', 'QUOTED', 'SENT_TO_CUSTOMER', 'ACCEPTED'].includes(status)) && (
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Quote Information (from Pastel)</p>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div><label className="text-xs font-medium text-gray-600 block mb-1">Quote Number *</label><input value={quoteNumber} onChange={e => setQuoteNumber(e.target.value)} placeholder="NE009123" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" /></div>
                <div><label className="text-xs font-medium text-gray-600 block mb-1">Value (excl VAT) *</label><input type="number" value={quoteValue} onChange={e => setQuoteValue(e.target.value)} placeholder="0.00" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" /></div>
                <div><label className="text-xs font-medium text-gray-600 block mb-1">Valid Until</label><input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" /></div>
              </div>
              {status === 'PENDING' && <button onClick={handleSaveQuote} disabled={saving} className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">{saving ? 'Saving...' : 'Save Quote - Move to Quoted'}</button>}
              {status === 'QUOTED' && quoteNumber && <div className="flex items-center gap-2 text-sm text-purple-700 bg-purple-50 px-3 py-2 rounded-lg"><FileText size={14} /> Quote {quoteNumber} - R {parseFloat(quoteValue || '0').toLocaleString('en-ZA', { minimumFractionDigits: 2 })} excl VAT</div>}
            </div>
          )}

          {(['NEW','PENDING','QUOTED','SENT_TO_CUSTOMER','ACCEPTED'].includes(status)) && (
            <div className="px-5 py-4 border-b border-gray-100">
{(['QUOTED','SENT_TO_CUSTOMER','ACCEPTED'].includes(status)) && <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Order Information (when won)</p>}
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div><label className="text-xs font-medium text-gray-600 block mb-1">Client PO Number *</label><input value={poNumber} onChange={e => setPoNumber(e.target.value)} placeholder="Client PO" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" /></div>

                <div><label className="text-xs font-medium text-gray-600 block mb-1">Order Date</label><input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" /></div>
              </div>
        {(['NEW','PENDING','QUOTED','SENT_TO_CUSTOMER'].includes(status)) && !rfq.job_number && (
          <button onClick={async () => {
            if (!confirm('FAST TRACK: This will create a Job Card immediately without waiting for a PO number. The PO can be added later. Continue?')) return
            setSaving(true)
            try {
              // GUARD: Re-check from DB that no job_number is already locked to this RFQ
              const { data: freshRfq } = await supabase.from('rfqs').select('job_number').eq('id', rfq.id).single()
              if (freshRfq?.job_number) {
                alert('⚠️ This RFQ already has a locked job number: ' + freshRfq.job_number + '. Cannot create a second job.')
                return
              }
              // GUARD: Check no existing job is linked to this RFQ
              const { data: existingJobs } = await supabase.from('jobs').select('job_number').eq('rfq_id', rfq.id).eq('operating_entity', activeEntity)
              if (existingJobs && existingJobs.length > 0) {
                alert('⚠️ DUPLICATE DETECTED: A job (' + existingJobs[0].job_number + ') already exists for this RFQ. Cannot create a second job.')
                return
              }

              const pendingPO = 'PENDING-' + new Date().toISOString().slice(0,10)
              const { data: jobData, error: jobError } = await supabase.from('jobs').insert({
                operating_entity: (rfq.operating_entity === 'ERHA_FC' || rfq.operating_entity === 'ERHA_SS') ? rfq.operating_entity : activeEntity,
                rfq_id: rfq.id,
                rfq_no: rfq.rfq_no || null,
                enq_number: rfq.enq_number || null,
                client_name: rfq.clients?.company_name || (rfq as any).client_name || 'Unknown Client',
                description: rfq.description,
                po_number: pendingPO,
                order_number: pendingPO,
                status: 'PENDING',
                workshop_status: 'NOT_STARTED',
                entry_type: 'FAST_TRACK',
                priority: rfq.priority || 'URGENT',
                site_req: rfq.site_req || null,
                contact_person: rfq.contact_person || null,
                contact_email: rfq.contact_email || null,
                contact_phone: rfq.contact_phone || null,
                due_date: rfq.required_date || null,
                date_received: rfq.request_date || new Date().toISOString().split('T')[0],
                special_requirements: rfq.special_requirements || null,
                notes: 'FAST TRACKED - PO pending. Created from ' + (rfq.rfq_no || 'RFQ') + ' on ' + new Date().toLocaleDateString('en-ZA'),
                drawing_number: rfq.drawing_number || null,
                has_drawing: rfq.drawing_number ? true : false,
                client_rfq_number: rfq.client_rfq_number || null,
                is_contract_work: rfq.is_contract_work || false,
                is_parent: false,
                is_child_job: false,
                ...buildActionFields(new Set()),
                has_info_for_quote: false,
              }).select('id, job_number').single()
              if (jobError) throw jobError
              const newJobNumber = jobData.job_number

              // LOCK: Store job_number on RFQ record immediately + move to Order Won (ACCEPTED)
              const { data: updatedRfq, error: lockError } = await supabase.from('rfqs').update({
                job_number: newJobNumber,
                status: 'ACCEPTED',
              }).eq('id', rfq.id).select('*, clients(company_name)').single()
              if (lockError) console.error('Failed to lock job_number on RFQ:', lockError.message)
              else onUpdate(updatedRfq)

              // LOG: fast_track_job_locked event
              await supabase.from('import_events').insert({
                source: 'fast_track_job_locked',
                file_name: newJobNumber,
                rows_attempted: 1,
                rows_imported: 1,
                rows_failed: 0,
                imported_at: new Date().toISOString(),
                imported_by: rfq.assigned_quoter_name || 'system',
              }).then(({ error: logErr }) => { if (logErr) console.error('Event log error:', logErr.message) })

              // LOG: no_card_job_created ML event (fast track job starts without a printed card)
              await supabase.from('import_events').insert({
                source: 'no_card_job_created',
                file_name: JSON.stringify({ job_id: jobData.id, job_type: 'FAST_TRACK', created_at: new Date().toISOString() }),
                rows_attempted: 1, rows_imported: 1, rows_failed: 0,
                imported_at: new Date().toISOString(), imported_by: 'system',
              }).then(({ error: logErr }) => { if (logErr) console.error('Event log error:', logErr.message) })

              // Copy line items
              const { data: rfqItems } = await supabase.from('rfq_line_items').select('*').eq('rfq_id', rfq.id).order('line_number')
              if (rfqItems && rfqItems.length > 0) {
                await supabase.from('job_line_items').insert(rfqItems.map((item, idx) => ({ job_id: jobData.id, description: item.description, quantity: item.quantity || 1, uom: item.unit_of_measure || 'EA', item_type: item.item_type || 'MATERIAL', cost_price: 0, sell_price: 0, line_total: 0, status: 'PENDING', sort_order: idx, can_spawn_job: true })))
              }
              if (onJobCreated) onJobCreated()
              showMsg('⚡ Fast Track: Job ' + newJobNumber + ' created & locked! PO pending.')
            } catch (err) { alert('Error: ' + (err as any).message) }
            finally { setSaving(false) }
          }} disabled={saving} className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50 mb-2">
            {saving ? 'Creating...' : '⚡ Fast Track → Create Job (No PO Required)'}
          </button>
        )}
        {rfq.job_number && (
          <button onClick={() => onNavigateToJob?.(rfq.job_number!)} className="w-full py-2 bg-green-50 border border-green-200 text-green-700 text-sm font-semibold rounded-lg text-center mb-2 hover:bg-green-100 hover:border-green-300 transition-colors cursor-pointer">
            🔒 Job: {rfq.job_number} → Open on Job Board
          </button>
        )}

        {status === 'QUOTED' && (
          <button onClick={async () => {
            setSaving(true)
            try {
              const { data, error } = await supabase.from('rfqs').update({ status: 'SENT_TO_CUSTOMER' }).eq('id', rfq.id).select('*, clients(company_name)').single()
              if (error) throw error
              onUpdate(data)
              import('./emailService').then(({ emailQuoteReady }) => emailQuoteReady(data))
            } catch (err: any) { console.error(err) }
            finally { setSaving(false) }
          }} disabled={saving} className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
            {saving ? 'Saving...' : 'Send Quote to Customer - Move to Sent'}
          </button>
        )}
        {status === 'SENT_TO_CUSTOMER' && (
          <button onClick={handleSaveOrder} disabled={saving} className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Order - Move to Order Won'}
          </button>
        )}
              {status === 'ACCEPTED' && (
                <button onClick={async () => {
                  setSaving(true)
                  try {
                    const fieldsUpdated: string[] = []
                    const rfqUpdate: Record<string, any> = {}
                    const jobUpdate: Record<string, any> = {}
                    if (poNumber.trim()) { rfqUpdate.po_number = poNumber.trim(); jobUpdate.po_number = poNumber.trim(); jobUpdate.order_number = poNumber.trim(); fieldsUpdated.push('po_number') }
                    if (orderDate) { rfqUpdate.order_date = orderDate; jobUpdate.order_date = orderDate; fieldsUpdated.push('order_date') }
                    if (quoteNumber.trim()) { rfqUpdate.quote_number = quoteNumber.trim(); fieldsUpdated.push('quote_number') }
                    if (quoteValue) { rfqUpdate.quote_value_excl_vat = parseFloat(quoteValue); rfqUpdate.quote_value_incl_vat = parseFloat(quoteValue) * 1.15; fieldsUpdated.push('quote_value') }
                    if (validUntil) { rfqUpdate.valid_until = validUntil; fieldsUpdated.push('valid_until') }
                    if (Object.keys(rfqUpdate).length === 0) { showMsg('No changes to save'); setSaving(false); return }
                    const { data, error } = await supabase.from('rfqs').update(rfqUpdate).eq('id', rfq.id).select('*, clients(company_name)').single()
                    if (error) throw error
                    onUpdate(data)
                    if (Object.keys(jobUpdate).length > 0) {
                      await supabase.from('jobs').update(jobUpdate).eq('rfq_id', rfq.id).eq('operating_entity', activeEntity)
                    }
                    await supabase.from('activity_log').insert({
                      action_type: 'rfq_updated_post_fasttrack',
                      entity_type: 'rfq',
                      entity_id: rfq.id,
                      operating_entity: (rfq.operating_entity === 'ERHA_FC' || rfq.operating_entity === 'ERHA_SS') ? rfq.operating_entity : activeEntity,
                      metadata: { fields_updated: fieldsUpdated, updated_by: rfq.assigned_quoter_name || 'user', updated_at: new Date().toISOString(), job_number: rfq.job_number },
                    }).then(({ error: logErr }) => { if (logErr) console.error('Activity log error:', logErr.message) })
                    showMsg('Order details updated on RFQ & linked job.')
                    if (onJobCreated) onJobCreated()
                  } catch (err: any) { alert('Error: ' + err.message) }
                  finally { setSaving(false) }
                }} disabled={saving} className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Order Details'}
                </button>
              )}
            </div>
          )}

          {(status === 'ACCEPTED' || status === 'JOB_CREATED') && (
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Invoice Information (from Pastel)</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div><label className="text-xs font-medium text-gray-600 block mb-1">Invoice Number *</label><input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="From Pastel" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" /></div>
                <div><label className="text-xs font-medium text-gray-600 block mb-1">Invoice Date</label><input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" /></div>
                <div><label className="text-xs font-medium text-gray-600 block mb-1">Invoice Value</label><input type="number" value={invoiceValue} onChange={e => setInvoiceValue(e.target.value)} placeholder="0.00" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" /></div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Payment Status</label>
                  <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                    <option value="">Select...</option>
                    <option value="UNPAID">Unpaid</option>
                    <option value="PARTIAL">Partial</option>
                    <option value="PAID">Paid</option>
                  </select>
                </div>
              </div>
              {status === 'ACCEPTED' && <button onClick={handleSaveInvoice} disabled={saving} className="w-full py-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold rounded-lg disabled:opacity-50">{saving ? 'Saving...' : 'Save Invoice - Move to Complete'}</button>}
            </div>
          )}

          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">RFQ Details</p>
              <button onClick={handleSaveRFQDetails} disabled={saving} className="px-3 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
            <p className="text-xs font-medium text-gray-500 mb-2">Client Information</p>
            <div className="grid grid-cols-2 gap-2 mb-4 pb-4 border-b border-gray-100">
              <div><label className="text-xs text-gray-500 block mb-1">Company</label><p className="text-xs text-gray-700 px-2 py-1.5 bg-gray-50 rounded border border-gray-100">{rfq.clients?.company_name || '-'}</p></div>
              <div><label className="text-xs text-gray-500 block mb-1">Client RFQ Number</label><input value={editClientRfqNumber} onChange={e => setEditClientRfqNumber(e.target.value)} className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400" /></div>
              <div><label className="text-xs text-gray-500 block mb-1">Contact Person</label><input value={editContactPerson} onChange={e => setEditContactPerson(e.target.value)} className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400" /></div>
              <div><label className="text-xs text-gray-500 block mb-1">Contact Email</label><input type="email" value={editContactEmail} onChange={e => setEditContactEmail(e.target.value)} className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400" /></div>
              <div><label className="text-xs text-gray-500 block mb-1">Contact Phone</label><input value={editContactPhone} onChange={e => setEditContactPhone(e.target.value)} className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400" /></div>
            </div>
            <p className="text-xs font-medium text-gray-500 mb-2">ENQ Report</p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div><label className="text-xs text-gray-500 block mb-1">Drawing Number</label><input value={editDrawingNumber} onChange={e => setEditDrawingNumber(e.target.value)} className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400" /></div>
              <div><label className="text-xs text-gray-500 block mb-1">Requested / Received By</label><input value={editRequestedBy} onChange={e => setEditRequestedBy(e.target.value)} className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400" /></div>
              <div><label className="text-xs text-gray-500 block mb-1">Media Received</label><select value={editMediaReceived} onChange={e => setEditMediaReceived(e.target.value)} className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400 bg-white"><option value="">Select...</option>{mediaOptions.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
              <div><label className="text-xs text-gray-500 block mb-1">Date Received</label><input type="date" value={editDateReceived} onChange={e => setEditDateReceived(e.target.value)} className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400" /></div>
              <div><label className="text-xs text-gray-500 block mb-1">Required By</label><input type="date" value={editRequiredBy} onChange={e => setEditRequiredBy(e.target.value)} className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400" /></div>
              <div><label className="text-xs text-gray-500 block mb-1">Priority</label><select value={editPriority} onChange={e => setEditPriority(e.target.value)} className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400 bg-white">{['LOW','MEDIUM','HIGH','URGENT'].map(p => <option key={p} value={p}>{p}</option>)}</select></div>
            </div>
            <div className="mb-3">
              <label className="text-xs text-gray-500 block mb-1">Actions Required</label>
              <div className="flex flex-wrap gap-1.5">
                {actionTypeOptions.map(a => (
                  <button key={a} onClick={() => setEditActions(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])}
                    className={`px-2 py-0.5 rounded text-xs font-medium border transition-all ${editActions.includes(a) ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-300 hover:border-orange-300'}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div><label className="text-xs text-gray-500 block mb-1">Description *</label><textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={2} className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400 resize-none" /></div>
              <div><label className="text-xs text-gray-500 block mb-1">Special Requirements</label><textarea value={editSpecialReqs} onChange={e => setEditSpecialReqs(e.target.value)} rows={2} className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400 resize-none" /></div>
              <div><label className="text-xs text-gray-500 block mb-1">Internal Notes</label><textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={2} className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400 resize-none" /></div>
            </div>
          </div>

          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Line Items</p>
              <button onClick={addPanelLineItem} className="text-xs font-semibold text-orange-600 hover:text-orange-700">+ Add Item</button>
            </div>
            {loadingItems ? <p className="text-xs text-gray-400">Loading...</p> : (
              <>
                {panelLineItems.length === 0
                  ? <p className="text-xs text-gray-400 text-center py-3 border border-dashed border-gray-200 rounded-lg">No line items</p>
                  : (
                    <div className="space-y-1.5 mb-3">
                      <div className="grid grid-cols-12 gap-1.5 text-xs font-medium text-gray-400 px-1 mb-1">
                        <div className="col-span-7">Description</div><div className="col-span-2">Qty</div><div className="col-span-2">UOM</div><div className="col-span-1"></div>
                      </div>
                      {panelLineItems.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-1.5 items-center">
                          <div className="col-span-7"><input value={item.description} onChange={e => updatePanelLineItem(idx, 'description', e.target.value)} placeholder="Description" className="w-full border border-gray-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-blue-400" /></div>
                          <div className="col-span-2"><input type="number" value={item.quantity} onChange={e => updatePanelLineItem(idx, 'quantity', e.target.value)} className="w-full border border-gray-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-blue-400" /></div>
                          <div className="col-span-2"><select value={item.unit_of_measure} onChange={e => updatePanelLineItem(idx, 'unit_of_measure', e.target.value)} className="w-full border border-gray-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-blue-400 bg-white">{['EA','M','KG','L','SET','LOT','HR','DAY'].map(u => <option key={u} value={u}>{u}</option>)}</select></div>
                          <div className="col-span-1 flex justify-center"><button onClick={() => removePanelLineItem(idx)} className="text-red-400 hover:text-red-600"><X size={12} /></button></div>
                        </div>
                      ))}
                    </div>
                  )
                }
                <button onClick={handleSaveLineItems} disabled={saving} className="w-full py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50">{saving ? 'Saving...' : 'Save Line Items'}</button>
              </>
            )}
          </div>

          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Attachments</p>
            <label className={`flex items-center gap-3 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors mb-3 ${uploadingPanelFiles ? 'border-blue-300 bg-blue-50 cursor-wait' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}`}>
              <Paperclip size={16} className="text-gray-400 shrink-0" />
              <div>
                <p className="text-xs font-medium text-gray-700">{uploadingPanelFiles ? 'Uploading...' : 'Click to attach files'}</p>
                <p className="text-xs text-gray-400">Any file type - multiple allowed</p>
              </div>
              <input type="file" multiple className="hidden" disabled={uploadingPanelFiles} onChange={async (e) => {
                const files = e.target.files
                if (!files || files.length === 0) return
                setUploadingPanelFiles(true)
                for (const file of Array.from(files)) {
                  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
                  const filePath = `${rfq.id}/${Date.now()}-${safeName}`
                  const { error: upErr } = await supabase.storage.from('rfq-attachments').upload(filePath, file)
                  if (!upErr) {
                    await supabase.from('rfq_attachments').insert({ rfq_id: rfq.id, file_name: file.name, file_path: filePath, file_size: file.size })
                  }
                }
                const { data } = await supabase.from('rfq_attachments').select('id, file_name, file_path').eq('rfq_id', rfq.id)
                setPanelAttachments(data || [])
                setUploadingPanelFiles(false)
                e.target.value = ''
              }} />
            </label>
            {panelAttachments.length === 0 && !uploadingPanelFiles && (
              <p className="text-xs text-gray-400 text-center py-2">No attachments yet</p>
            )}
            {panelAttachments.length > 0 && (
              <div className="space-y-1.5">
                {panelAttachments.map(att => {
                  const url = supabase.storage.from('rfq-attachments').getPublicUrl(att.file_path).data.publicUrl
                  return (
                    <div key={att.id} className="flex items-center justify-between px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
                      <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 min-w-0 hover:underline">
                        <FileText size={13} className="text-blue-500 shrink-0" />
                        <span className="text-xs font-medium text-blue-700 truncate">{att.file_name}</span>
                      </a>
                      <button onClick={async () => {
                        await supabase.storage.from('rfq-attachments').remove([att.file_path])
                        await supabase.from('rfq_attachments').delete().eq('id', att.id)
                        setPanelAttachments(prev => prev.filter(a => a.id !== att.id))
                      }} className="ml-2 text-red-400 hover:text-red-600 shrink-0">
                        <X size={12} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {rfq.assigned_quoter_name && (
            <div className="px-5 py-3">
              <p className="text-xs text-gray-400">Assigned to <span className="font-semibold text-gray-700">{rfq.assigned_quoter_name}</span></p>
            </div>
          )}
        </div>
      </div>
      {showEmail && <EmailModal rfq={rfq} onClose={() => setShowEmail(false)} />}
    </>
  )
}

// EMAIL MODAL

function EmailModal({ rfq, onClose }: { rfq: RFQ; onClose: () => void }) {
  const template = EMAIL_TEMPLATES[rfq.status] || EMAIL_TEMPLATES['NEW']
  const enqNo = rfq.client_rfq_number || rfq.enq_number || rfq.rfq_no || '-'
  const contactName = rfq.contact_person || 'Sir/Madam'
  const [to, setTo] = useState(rfq.contact_email || '')
  const [subject, setSubject] = useState(template.subject.replace('{enq}', enqNo))
  const [body, setBody] = useState(template.body.replace(/\{enq\}/g, enqNo).replace('{contact}', contactName))
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSend = async () => {
    if (!to) { alert('Please enter a recipient email address'); return }
    setSending(true)
    try {
      const apiKey = import.meta.env.VITE_RESEND_API_KEY
      if (!apiKey) throw new Error('Resend API key not configured')
      const res = await fetch('http://localhost:3001/send', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'ERHA Operations <onboarding@resend.dev>',
          to: [to],
          subject: subject,
          text: body,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><div style="background:#1e3a5f;color:white;padding:20px 24px;border-radius:8px 8px 0 0;"><h2 style="margin:0;font-size:18px;">ERHA Fabrication &amp; Construction</h2><p style="margin:4px 0 0;font-size:13px;opacity:0.8;">${enqNo}</p></div><div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;white-space:pre-line;">${body.replace(/\n/g,'<br>')}</div><p style="font-size:11px;color:#9ca3af;margin-top:12px;text-align:center;">ERHA Operations System</p></div>`,
        }),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Send failed') }
      setSent(true)
      setTimeout(onClose, 1500)
    } catch (err: any) { alert('Failed to send email: ' + err.message) }
    finally { setSending(false) }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Send Email - {enqNo}</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div><label className="text-xs font-medium text-gray-600 block mb-1">To</label><input value={to} onChange={e => setTo(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" placeholder="client@email.com" /></div>
          <div><label className="text-xs font-medium text-gray-600 block mb-1">Subject</label><input value={subject} onChange={e => setSubject(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" /></div>
          <div><label className="text-xs font-medium text-gray-600 block mb-1">Message</label><textarea value={body} onChange={e => setBody(e.target.value)} rows={7} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none" /></div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={handleSend} disabled={!to || sending || sent} className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors">
            <Send size={14} />{sent ? 'Sent!' : sending ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      </div>
    </div>
  )
}

// HELPERS

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="px-5 py-4 border-b border-gray-100">
      <div className="flex items-center gap-1.5 mb-3"><span className="text-gray-400">{icon}</span><p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{title}</p></div>
      {children}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2 mb-2">
      <p className="text-xs text-gray-400 w-28 shrink-0 pt-0.5">{label}</p>
      <p className="text-sm text-gray-700 flex-1">{value}</p>
    </div>
  )
}

interface NavItemProps { icon: React.ReactNode; label: string; description: string; active: boolean; accentColor: string; onClick: () => void }
function NavItem({ icon, label, description, active, accentColor, onClick }: NavItemProps) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${active ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
      <span className={active ? accentColor : ''}>{icon}</span>
      <div className="flex-1 min-w-0"><p className="text-sm font-semibold leading-tight">{label}</p><p className="text-xs text-gray-500 leading-tight mt-0.5">{description}</p></div>
      {active && <ChevronRight size={14} className={accentColor} />}
    </button>
  )
}

// SPAWN JOB MODAL
function SpawnJobModal({ lineItem, parentJob, activeEntity, onClose, onSpawned }: {
  lineItem: any; parentJob: Job; activeEntity: OperatingEntity; onClose: () => void; onSpawned: (child: any) => void
}) {
  const [saving, setSaving] = React.useState(false)
  const [description, setDescription] = React.useState(lineItem.description || '')
  const [drawingNumber, setDrawingNumber] = React.useState(parentJob.drawing_number || '')
  const [priority, setPriority] = React.useState(parentJob.priority || 'NORMAL')
  const [dueDate, setDueDate] = React.useState(parentJob.due_date || '')
  const [notes, setNotes] = React.useState('')
  const [quantity, setQuantity] = React.useState(lineItem.quantity || 1)
  const actionTypeOptions = useDropdownOptions('action_types', ACTIONS_LIST_FALLBACK)
  const [selectedActions, setSelectedActions] = React.useState<Set<string>>(new Set())
  const toggleSpawnAction = (label: string) => setSelectedActions(prev => {
    const next = new Set(prev)
    if (next.has(label)) next.delete(label); else next.add(label)
    return next
  })
  const [docs, setDocs] = React.useState({
    has_info_for_quote: false, has_service_schedule: false, has_qcp: false, has_internal_order: false
  })
  const toggleDoc = (key: keyof typeof docs) => setDocs(d => ({ ...d, [key]: !d[key] }))

  const handleCreate = async () => {
    if (!description.trim()) { alert('Description is required'); return }
    setSaving(true)
    try {
      const { data: existingChildren } = await supabase.from('jobs').select('id').eq('parent_job_id', parentJob.id).eq('operating_entity', activeEntity)
      const suffix = String.fromCharCode(65 + (existingChildren?.length || 0))
      const childJobNumber = (parentJob.job_number || 'JOB') + '-' + suffix
      const { data: childJob, error } = await supabase.from('jobs').insert({
        operating_entity:         activeEntity,
        parent_job_id:            parentJob.id,
        is_child_job:             true,
        is_parent:                false,
        job_number:               childJobNumber,
        description:              description.trim(),
        client_name:              parentJob.client_name,
        site_req:                 parentJob.site_req || null,
        rfq_no:                   parentJob.rfq_no || null,
        client_rfq_number:        parentJob.client_rfq_number || null,
        po_number:                parentJob.po_number || null,
        order_number:             (parentJob as any).order_number || null,
        compiled_by:              (parentJob as any).compiled_by || null,
        due_date:                 dueDate || null,
        priority:                 priority,
        entry_type:               'CHILD',
        status:                   'PENDING',
        workshop_status:          'NOT_STARTED',
        assigned_employee_name:   null,
        assigned_supervisor_name: null,
        drawing_number:           drawingNumber || null,
        date_received:            new Date().toISOString().split('T')[0],
        is_contract_work:         parentJob.is_contract_work || false,
        ...buildActionFields(selectedActions),
        has_info_for_quote:       docs.has_info_for_quote,
        has_service_schedule:     docs.has_service_schedule,
        has_qcp:                  docs.has_qcp,
        has_internal_order:       docs.has_internal_order,
      }).select().single()
      if (error) throw error
      // Create line item for child job so it prints on the card
      await supabase.from('job_line_items').insert({ job_id: childJob.id, description: lineItem.description || description.trim(), quantity: quantity, uom: lineItem.uom || 'EA', item_type: lineItem.item_type || 'MATERIAL', cost_price: 0, sell_price: 0, line_total: 0, status: 'PENDING', sort_order: 0, can_spawn_job: false })
      await supabase.from('job_line_items').update({ child_job_id: childJob.id, quantity: quantity }).eq('id', lineItem.id)
      await supabase.from('jobs').update({ is_parent: true }).eq('id', parentJob.id)
      // Sync quantity to parent line item + log
      if (quantity !== (lineItem.quantity || 1)) {
        await supabase.from('activity_log').insert({
          action_type: 'parent_job_quantity_synced', entity_type: 'job', entity_id: parentJob.id,
          operating_entity: (parentJob.operating_entity === 'ERHA_FC' || parentJob.operating_entity === 'ERHA_SS') ? parentJob.operating_entity : activeEntity,
          metadata: { child_job_id: childJob.id, parent_job_id: parentJob.id, old_qty: lineItem.quantity || 1, new_qty: quantity, synced_at: new Date().toISOString() },
        }).then(({ error: logErr }) => { if (logErr) console.error('Activity log error:', logErr.message) })
      }
      // LOG: child_job_spawned ML event
      await supabase.from('import_events').insert({
        source: 'child_job_spawned',
        file_name: JSON.stringify({ parent_job_id: parentJob.id, child_job_id: childJob.id, child_suffix: suffix, line_item_id: lineItem.id, spawned_at: new Date().toISOString() }),
        rows_attempted: 1,
        rows_imported: 1,
        rows_failed: 0,
        imported_at: new Date().toISOString(),
        imported_by: 'system',
      }).then(({ error: logErr }) => { if (logErr) console.error('Event log error:', logErr.message) })
      // LOG: no_card_job_created ML event (child job starts without a printed card)
      await supabase.from('import_events').insert({
        source: 'no_card_job_created',
        file_name: JSON.stringify({ job_id: childJob.id, job_type: 'CHILD', created_at: new Date().toISOString() }),
        rows_attempted: 1, rows_imported: 1, rows_failed: 0,
        imported_at: new Date().toISOString(), imported_by: 'system',
      }).then(({ error: logErr }) => { if (logErr) console.error('Event log error:', logErr.message) })
      emailChildJobSpawned(parentJob, childJob)
      onSpawned(childJob)
    } catch (err: any) { alert('Error: ' + err.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="bg-indigo-600 text-white px-6 py-4 rounded-t-xl flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold">Spawn Child Job</h2>
            <p className="text-indigo-200 text-xs mt-0.5">From: {parentJob.job_number} — {lineItem.description}</p>
          </div>
          <button onClick={onClose} className="text-indigo-200 hover:text-white"><X size={18}/></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2 text-xs text-indigo-700">
            Child job number will be: <strong>{(parentJob.job_number||'JOB') + '-A/B/C...'}</strong>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Description *</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Drawing Number</label>
              <input value={drawingNumber} onChange={e => setDrawingNumber(e.target.value)}
                placeholder="DWG-001" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
            </div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
              <input type="number" min={1} value={quantity} onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
            </div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {['LOW','NORMAL','HIGH','URGENT'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
            </div>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-2">Actions Required</label>
            <div className="grid grid-cols-3 gap-2">
              {actionTypeOptions.map(label => (
                <label key={label} className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={selectedActions.has(label)} onChange={() => toggleSpawnAction(label)}
                    className="w-3.5 h-3.5 text-indigo-600 rounded"/>
                  <span className="text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-2">Attached Documents</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                ['has_info_for_quote','Info for Quote'],['has_service_schedule','Service Schedule / QCP'],
                ['has_qcp','QCP'],['has_internal_order','Internal Order'],
              ] as [keyof typeof docs, string][]).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={docs[key]} onChange={() => toggleDoc(key)}
                    className="w-3.5 h-3.5 text-indigo-600 rounded"/>
                  <span className="text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Additional notes for this child job..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"/>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={handleCreate} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
            <Plus size={14}/>{saving ? 'Creating...' : 'Create Child Job'}
          </button>
        </div>
      </div>
    </div>
  )
}



// WORKSHOP BOARD
function WorkshopBoard({ jobs, loading, onRefresh, onStatusChange }: {
  jobs: Job[]; loading: boolean; onRefresh: () => void; onStatusChange: (jobId: string, status: string) => void
}) {
  const [selectedJob, setSelectedJob] = React.useState<Job | null>(null)
  const [notes, setNotes] = React.useState<Record<string,string>>({})
  const COLS = [
    { key: 'NOT_STARTED',   label: 'Not Started',   color: 'bg-gray-500'   },
    { key: 'IN_PROGRESS',   label: 'In Progress',   color: 'bg-orange-500' },
    { key: 'ON_HOLD',       label: 'On Hold',       color: 'bg-red-400'    },
    { key: 'QUALITY_CHECK', label: 'Quality Check', color: 'bg-purple-500' },
    { key: 'COMPLETE',      label: 'Complete',      color: 'bg-teal-500'   },
    { key: 'DISPATCHED',    label: 'Dispatched',    color: 'bg-green-600'  },
    { key: 'DELIVERED',     label: 'Delivered',     color: 'bg-cyan-600'   },
    { key: 'INVOICED',      label: 'Invoiced',      color: 'bg-violet-600' },
    { key: 'COMPLETED',     label: 'Completed',     color: 'bg-green-700'  },
  ]
  const nextStatus: Record<string,string> = {
    NOT_STARTED:'IN_PROGRESS', IN_PROGRESS:'QUALITY_CHECK',
    ON_HOLD:'IN_PROGRESS', QUALITY_CHECK:'COMPLETE', COMPLETE:'DISPATCHED',
    DISPATCHED:'DELIVERED', INVOICED:'COMPLETED',
  }
  const nextLabel: Record<string,string> = {
    NOT_STARTED:'Start', IN_PROGRESS:'QC Check',
    ON_HOLD:'Resume', QUALITY_CHECK:'Complete', COMPLETE:'Dispatch',
    DISPATCHED:'Mark Delivered', INVOICED:'Mark Completed',
  }
  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-gray-400">Loading workshop jobs...</p></div>
  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-4">
      {COLS.map(col => {
        const allCards = jobs.filter(j => (j.workshop_status || 'NOT_STARTED') === col.key)
        const cards = allCards.filter(j => !j.is_child_job)
        const childMap: Record<string, Job[]> = {}
        jobs.filter(j => j.is_child_job && j.parent_job_id).forEach(child => {
          if (!childMap[child.parent_job_id!]) childMap[child.parent_job_id!] = []
          childMap[child.parent_job_id!].push(child)
        })
        return (
          <div key={col.key} className="flex flex-col min-w-64 w-64 shrink-0">
            <div className={`${col.color} rounded-t-lg px-3 py-2 flex items-center justify-between`}>
              <span className="text-white text-sm font-bold">{col.label}</span>
              <span className="bg-white bg-opacity-25 text-white text-xs font-bold px-2 py-0.5 rounded-full">{cards.length}</span>
            </div>
            <div className="flex-1 bg-gray-200 rounded-b-lg p-2 min-h-96 space-y-2">
              {cards.length === 0 && <div className="flex items-center justify-center h-20"><p className="text-gray-400 text-xs">No jobs</p></div>}
              {cards.map(job => {
                const children = childMap[job.id] || []
                const [expanded, setExpanded] = [notes[job.id+'_exp'] === '1', (v: boolean) => setNotes(n => ({...n, [job.id+'_exp']: v?'1':'0'}))]
                return (
                  <div key={job.id}>
                    <div onClick={() => setSelectedJob(job)}
                      className="bg-white rounded-lg shadow-sm border-2 border-transparent hover:border-orange-300 p-3 cursor-pointer hover:shadow-md transition-all">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <p className="text-xs font-bold text-orange-600">{job.job_number}</p>
                        <div className="flex items-center gap-1">
                          {job.is_parent && <span className="text-xs font-bold px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded">P</span>}
                          {job.status !== 'PRINTED' && <span className="text-xs font-bold px-1.5 py-0.5 bg-rose-50 text-rose-500 rounded border border-rose-200">No Card</span>}
                          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${job.priority==='URGENT'?'bg-red-100 text-red-700':job.priority==='HIGH'?'bg-orange-100 text-orange-700':'bg-gray-100 text-gray-600'}`}>{job.priority}</span>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-gray-800 line-clamp-2 mb-1">{job.description||'No description'}</p>
                      <p className="text-xs text-gray-500 truncate mb-2">{job.client_name||'-'}</p>
                      {job.due_date && <p className="text-xs text-red-500 mb-2">Due: {new Date(job.due_date).toLocaleDateString('en-ZA')}</p>}
                      {(job as any)._liStats && (job as any)._liStats.total > 0 && (
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                            <div className="bg-[#1d3461] h-1.5 rounded-full transition-all" style={{ width: `${((job as any)._liStats.dispatched / (job as any)._liStats.total) * 100}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-[#1d3461]">{(job as any)._liStats.dispatched}/{(job as any)._liStats.total}</span>
                        </div>
                      )}
                      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                        {nextStatus[col.key] && (
                          <button onClick={() => onStatusChange(job.id, nextStatus[col.key])}
                            className={`flex-1 py-1 text-xs font-semibold text-white rounded transition-colors ${col.key === 'DISPATCHED' ? 'bg-cyan-600 hover:bg-cyan-700' : col.key === 'INVOICED' ? 'bg-green-700 hover:bg-green-800' : 'bg-orange-500 hover:bg-orange-600'}`}>
                            {nextLabel[col.key]}
                          </button>
                        )}
                        {col.key === 'IN_PROGRESS' && (
                          <button onClick={() => onStatusChange(job.id, 'ON_HOLD')}
                            className="px-2 py-1 text-xs font-semibold text-white rounded bg-red-400 hover:bg-red-500 transition-colors">
                            Hold
                          </button>
                        )}
                      </div>
                      {children.length > 0 && (
                        <button onClick={e => { e.stopPropagation(); setExpanded(!expanded) }}
                          className="mt-2 w-full flex items-center justify-center gap-1 py-1 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded transition-colors">
                          {expanded ? '▲' : '▼'} {children.length} child{children.length > 1 ? ' jobs' : ' job'}
                        </button>
                      )}
                    </div>
                    {expanded && children.map(child => (
                      <div key={child.id} className="ml-3 mt-1 border-l-2 border-purple-200 pl-2">
                        <div onClick={() => setSelectedJob(child)} className="bg-white rounded-lg shadow-sm border border-purple-100 p-2 cursor-pointer hover:border-purple-300 transition-all">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-bold text-purple-600">{child.job_number}</p>
                            <div className="flex items-center gap-1">
                              {child.status !== 'PRINTED' && <span className="text-xs font-bold px-1.5 py-0.5 bg-rose-50 text-rose-500 rounded border border-rose-200">No Card</span>}
                              <span className="text-xs px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded">↳</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-700 mt-0.5 line-clamp-1">{child.description||''}</p>
                          <div className="flex gap-1 mt-1" onClick={e => e.stopPropagation()}>
                            {nextStatus[(child.workshop_status || 'NOT_STARTED')] && (
                              <button onClick={() => onStatusChange(child.id, nextStatus[(child.workshop_status || 'NOT_STARTED')])}
                                className="flex-1 py-0.5 text-xs font-semibold text-white rounded bg-orange-500 hover:bg-orange-600">
                                {nextLabel[(child.workshop_status || 'NOT_STARTED')]}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
      {selectedJob && (
        <JobExecutionPanel
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onStatusChange={onStatusChange}
          onRefresh={onRefresh}
        />
      )}
    </div>
  )
}

// â”€â”€ JOB EXECUTION PANEL â€” E6 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function JobExecutionPanel({ job, onClose, onStatusChange, onRefresh }: {
  job: any; onClose: () => void; onStatusChange: (id: string, status: string) => void; onRefresh: () => void
}) {
  const { activeEntity } = useEntity()
  const [activeTab, setActiveTab] = React.useState<'workers'|'time'|'qc'|'materials'|'reconcile'|'line_items'>('workers')
  const [workshopStatus, setWorkshopStatus] = React.useState(job.workshop_status || 'NOT_STARTED')
  const [notes, setNotes] = React.useState(job.workshop_notes || '')
  const [savingNotes, setSavingNotes] = React.useState(false)
  const [showAssignModal, setShowAssignModal] = React.useState(false)
  const [jobWorkers, setJobWorkers] = React.useState<any[]>([])
  const [loadingWorkers, setLoadingWorkers] = React.useState(false)
  const [wSearch, setWSearch] = React.useState('')
  const [wForm, setWForm] = React.useState({ workerName: '', clockNumber: '', payMethod: 'EFT', paymentAmount: '', payDate: '' })
  const [savingWorker, setSavingWorker] = React.useState(false)
  const [qcCheckpoints, setQcCheckpoints] = React.useState<any[]>([])
  const [loadingQC, setLoadingQC] = React.useState(false)
  const [showSignModal, setShowSignModal] = React.useState<number|null>(null)
  const [signerName, setSignerName] = React.useState('')
  const [savingSign, setSavingSign] = React.useState(false)
  const [jobMaterials, setJobMaterials] = React.useState<any[]>([])
  const [loadingMaterials, setLoadingMaterials] = React.useState(false)
  const [reconcileData, setReconcileData] = React.useState<any[]>([])
  const [reconcileFileName, setReconcileFileName] = React.useState('')
  const [reconciling, setReconciling] = React.useState(false)
  const reconcileFileRef = React.useRef<HTMLInputElement>(null)
  const [showMatModal, setShowMatModal] = React.useState(false)
  const [matForm, setMatForm] = React.useState({ description: '', quantity: '', unit: 'EA', logged_by: '' })
  const [savingMat, setSavingMat] = React.useState(false)
  const [execLineItems, setExecLineItems] = React.useState<any[]>([])
  const [loadingExecLines, setLoadingExecLines] = React.useState(false)

  const loadExecLineItems = React.useCallback(async () => {
    setLoadingExecLines(true)
    const { data } = await supabase.from('job_line_items').select('*').eq('job_id', job.id).order('sort_order')
    setExecLineItems(data || [])
    setLoadingExecLines(false)
  }, [job.id])

  const handleLineItemToggle = async (li: any, field: 'qc_done' | 'ready_for_delivery' | 'dispatched', value: boolean) => {
    const update: Record<string, any> = { [field]: value }
    const now = new Date().toISOString()
    if (field === 'qc_done') {
      update.qc_done_at = value ? now : null
      update.qc_done_by = value ? 'user' : null
      if (!value) { update.ready_for_delivery = false; update.ready_for_delivery_at = null; update.dispatched = false; update.dispatched_at = null }
    }
    if (field === 'ready_for_delivery') {
      update.ready_for_delivery_at = value ? now : null
      update.ready_for_delivery_by = value ? 'user' : null
      if (!value) { update.dispatched = false; update.dispatched_at = null }
    }
    if (field === 'dispatched') {
      update.dispatched_at = value ? now : null
      update.dispatched_by = value ? 'user' : null
    }
    await supabase.from('job_line_items').update(update).eq('id', li.id)
    // Activity log
    const eventMap: Record<string, string> = { qc_done: 'line_item_qc_done', ready_for_delivery: 'line_item_ready_for_delivery', dispatched: 'line_item_dispatched' }
    if (value) {
      await supabase.from('activity_log').insert({
        action_type: eventMap[field], entity_type: 'job_line_item', entity_id: li.id,
        operating_entity: (job.operating_entity === 'ERHA_FC' || job.operating_entity === 'ERHA_SS') ? job.operating_entity : activeEntity,
        metadata: { job_id: job.id, line_item_description: li.description, [`${field}_by`]: 'user', [`${field}_at`]: now },
      }).then(({ error: logErr }) => { if (logErr) console.error('Activity log error:', logErr.message) })
    }
    // Reload and check cross-board updates
    const { data: freshItems } = await supabase.from('job_line_items').select('*').eq('job_id', job.id).order('sort_order')
    if (freshItems) {
      setExecLineItems(freshItems)
      const allQC = freshItems.length > 0 && freshItems.every((i: any) => i.qc_done)
      const allDispatched = freshItems.length > 0 && freshItems.every((i: any) => i.dispatched)
      if (allQC && (job.workshop_status === 'IN_PROGRESS' || job.workshop_status === 'ON_HOLD')) {
        await supabase.from('jobs').update({ workshop_status: 'QUALITY_CHECK' }).eq('id', job.id)
        onRefresh()
      }
      if (allDispatched && job.workshop_status !== 'DISPATCHED' && job.workshop_status !== 'DELIVERED' && job.workshop_status !== 'INVOICED' && job.workshop_status !== 'COMPLETED') {
        await supabase.from('jobs').update({ workshop_status: 'DISPATCHED' }).eq('id', job.id)
        onRefresh()
      }
    }
  }

  const handleDeliveryField = async (li: any, field: 'delivery_number' | 'delivery_date', value: string) => {
    await supabase.from('job_line_items').update({ [field]: value || null }).eq('id', li.id)
    setExecLineItems(prev => prev.map(x => x.id === li.id ? { ...x, [field]: value || null } : x))
  }

  const MAT_UNITS = ['EA', 'M', 'KG', 'L', 'M2', 'M3', 'SET', 'HR', 'PCS']

  const loadMaterials = React.useCallback(async () => {
    setLoadingMaterials(true)
    const sb = (await import('./lib/supabase')).supabase
    const { data } = await sb.from('job_materials').select('*').eq('job_id', job.id).order('created_at', { ascending: false })
    if (data) setJobMaterials(data)
    setLoadingMaterials(false)
  }, [job.id])

  const handleLogMaterial = async () => {
    if (!matForm.description.trim() || !matForm.quantity) return
    setSavingMat(true)
    const sb = (await import('./lib/supabase')).supabase
    const { data } = await sb.from('job_materials').insert({
      job_id: job.id,
      description: matForm.description.trim(),
      quantity: parseFloat(matForm.quantity),
      unit: matForm.unit,
      notes: matForm.logged_by.trim() || null,
    }).select().single()
    if (data) setJobMaterials(prev => [data, ...prev])
    setSavingMat(false)
    setShowMatModal(false)
    setMatForm({ description: '', quantity: '', unit: 'EA', logged_by: '' })
  }

  const handleDeleteMaterial = async (id: string) => {
    const sb = (await import('./lib/supabase')).supabase
    await sb.from('job_materials').delete().eq('id', id)
    setJobMaterials(prev => prev.filter((m: any) => m.id !== id))
  }


  const QC_DESCRIPTIONS = [
    'Mark out all material and check prior to cutting',
    'Cut all material, deburr holes, dress and remove all sharp edges',
    'Assy and inspect prior to welding (water passes if applicable)',
    'Do welding complete as per WPS?',
    'Do a pressure test on water cooled unit if applicable?',
    'Clean all spatter and ensure NO sharp edges on workpiece',
    'Do 100% dimensional and visual inspection prior to painting',
    'Stamp and paint as required',
    'Final inspection - Sticker, Sign, Paperwork, Ready for delivery',
  ]

  const loadQCCheckpoints = React.useCallback(async () => {
    setLoadingQC(true)
    const sb = (await import('./lib/supabase')).supabase
    const { data } = await sb.from('job_qc_checkpoints').select('*').eq('job_id', job.id).order('checkpoint_number')
    if (data && data.length > 0) {
      setQcCheckpoints(data)
    } else {
      const inserts = QC_DESCRIPTIONS.map((desc, i) => ({
        job_id: job.id,
        checkpoint_number: i + 1,
        description: desc,
        signed_off: false,
      }))
      const { data: created } = await sb.from('job_qc_checkpoints').insert(inserts).select()
      if (created) setQcCheckpoints(created)
    }
    setLoadingQC(false)
  }, [job.id])

  const handleSignOff = async (checkpointId: string) => {
    if (!signerName.trim()) return
    setSavingSign(true)
    const sb = (await import('./lib/supabase')).supabase
    const { data } = await sb.from('job_qc_checkpoints').update({
      signed_off: true,
      signed_off_by: signerName.trim(),
      signed_off_at: new Date().toISOString(),
    }).eq('id', checkpointId).select().single()
    if (data) {
      setQcCheckpoints(prev => prev.map(c => c.id === checkpointId ? data : c))
    }
    setSavingSign(false)
    setShowSignModal(null)
    setSignerName('')
  }

  const CASUAL_WORKERS = [
    { name: 'MM MODISE', clock: 'C001' },
    { name: 'LC MATHANG', clock: 'C002' },
    { name: 'K NYIDE', clock: 'C003' },
    { name: 'TI NTSHALA', clock: 'C004' },
    { name: 'LE MOLEFE', clock: 'C005' },
    { name: 'TIMOTHY SMITH', clock: 'C006' },
    { name: 'GEORGE HUMAN', clock: 'C007' },
    { name: 'TN TLALI', clock: 'C008' },
    { name: 'KE RAMPONE', clock: 'C009' },
    { name: 'MW RAMONYALUOE', clock: 'C010' },
  ]

  const loadWorkers = async () => {
    setLoadingWorkers(true)
    const { supabase: sb } = await import('./lib/supabase')
    const { data } = await sb.from('job_workers').select('*').eq('job_id', job.id).order('created_at')
    setJobWorkers(data || [])
    setLoadingWorkers(false)
  }

  const handleAssignWorker = async () => {
    if (!wForm.workerName) return
    setSavingWorker(true)
    const { supabase: sb } = await import('./lib/supabase')
    await sb.from('job_workers').insert({
      job_id: job.id,
      worker_name: wForm.workerName,
      clock_number: wForm.clockNumber,
      pay_method: wForm.payMethod,
      payment_amount: wForm.paymentAmount ? parseFloat(wForm.paymentAmount) : null,
      pay_date: wForm.payDate || null
    })
    setWForm({ workerName: '', clockNumber: '', payMethod: 'EFT', paymentAmount: '', payDate: '' })
    setWSearch('')
    setShowAssignModal(false)
    setSavingWorker(false)
    await loadWorkers()
  }

  const handleClockIn = async (workerId: string) => {
    const { supabase: sb } = await import('./lib/supabase')
    await sb.from('job_workers').update({ clocked_in_at: new Date().toISOString() }).eq('id', workerId)
    await loadWorkers()
  }

  const handleClockOut = async (worker: any) => {
    const now = new Date()
    const mins = Math.round((now.getTime() - new Date(worker.clocked_in_at).getTime()) / 60000)
    const { supabase: sb } = await import('./lib/supabase')
    await sb.from('job_workers').update({ clocked_out_at: now.toISOString(), total_minutes: mins }).eq('id', worker.id)
    await loadWorkers()
  }

  React.useEffect(() => { loadWorkers() }, [job.id])
  React.useEffect(() => { if (activeTab === 'qc') loadQCCheckpoints() }, [activeTab, loadQCCheckpoints])
  React.useEffect(() => { if (activeTab === 'materials') loadMaterials() }, [activeTab, loadMaterials])
  React.useEffect(() => { if (activeTab === 'line_items') loadExecLineItems() }, [activeTab, loadExecLineItems])

  const STATUSES = [
    { key: 'NOT_STARTED',   label: 'Not Started'   },
    { key: 'IN_PROGRESS',   label: 'In Progress'   },
    { key: 'ON_HOLD',       label: 'On Hold'       },
    { key: 'QUALITY_CHECK', label: 'Quality Check' },
    { key: 'COMPLETE',      label: 'Complete'      },
    { key: 'DISPATCHED',    label: 'Dispatched'    },
  ]

  const handleStatusChange = async (newStatus: string) => {
    setWorkshopStatus(newStatus)
    await onStatusChange(job.id, newStatus)
  }

  const handleSaveNotes = async () => {
    setSavingNotes(true)
    const { supabase: sb } = await import('./lib/supabase')
    await sb.from('jobs').update({ workshop_notes: notes }).eq('id', job.id)
    setSavingNotes(false)
    onRefresh()
  }

  const tabs = [
    { key: 'workers',    label: 'Workers'    },
    { key: 'time',       label: 'Time'       },
    { key: 'qc',         label: 'QC'         },
    { key: 'materials',  label: 'Materials'  },
    { key: 'line_items', label: 'Line Items' },
    { key: 'reconcile',  label: 'Reconcile'  },
  ]

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#f7f8fb' }}>

      {/* â”€â”€ HEADER â”€â”€ */}
      <div style={{ background: '#1d3461', padding: '0 24px' }} className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4 py-4">
          <button onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '6px', padding: '6px 14px', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
            ← Back
          </button>
          <div>
            <div style={{ color: '#4db848', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Job Execution Panel</div>
            <div style={{ color: 'white', fontSize: '18px', fontWeight: 700, lineHeight: 1.2 }}>{job.job_number}</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginTop: '2px' }}>{job.client_name} · {job.description}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 py-4">
          <div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Workshop Status</div>
            <select
              value={workshopStatus}
              onChange={e => handleStatusChange(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '6px', color: 'white', padding: '7px 12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', outline: 'none' }}>
              {STATUSES.map(s => <option key={s.key} value={s.key} style={{ background: '#1d3461', color: 'white' }}>{s.label}</option>)}
            </select>
          </div>
          {job.priority && (
            <div style={{ background: job.priority === 'URGENT' ? '#e05c5c' : job.priority === 'HIGH' ? '#e8a020' : 'rgba(255,255,255,0.12)', borderRadius: '6px', padding: '6px 14px', color: 'white', fontSize: '12px', fontWeight: 700 }}>
              {job.priority}
            </div>
          )}
        </div>
      </div>

      {/* â”€â”€ TABS â”€â”€ */}
      <div style={{ background: '#162850', padding: '0 24px', display: 'flex', gap: '4px', borderBottom: '2px solid #4db848' }} className="shrink-0">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              padding: '14px 28px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
              background: activeTab === tab.key ? '#4db848' : 'transparent',
              color: activeTab === tab.key ? 'white' : 'rgba(255,255,255,0.5)',
              borderRadius: '6px 6px 0 0', transition: 'all .15s'
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* â”€â”€ TAB CONTENT â”€â”€ */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '32px 32px' }}>

        {/* WORKERS TAB */}
            {/* WORKERS TAB */}
            {activeTab === 'workers' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#1d3461' }}>Worker Assignment</div>
                    <div style={{ fontSize: '12px', color: '#8896a8', marginTop: '2px' }}>Assign casual workers from Casuals_2025 to this job</div>
                  </div>
                  <button onClick={() => setShowAssignModal(true)} style={{ background: '#4db848', color: 'white', border: 'none', borderRadius: '6px', padding: '10px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                    + Assign Worker
                  </button>
                </div>
                {loadingWorkers ? (
                  <div style={{ textAlign: 'center', padding: '48px', color: '#8896a8' }}>Loading workers...</div>
                ) : jobWorkers.length === 0 ? (
                  <div style={{ background: 'white', border: '1px solid #dde3ec', borderRadius: '8px', padding: '48px', textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#1d3461', marginBottom: '4px' }}>No workers assigned yet</div>
                    <div style={{ fontSize: '12px', color: '#8896a8' }}>Click '+ Assign Worker' to add casual workers to this job</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {jobWorkers.map(w => (
                      <div key={w.id} style={{ background: 'white', border: '1px solid #dde3ec', borderRadius: '8px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#1d3461' }}>{w.worker_name}</div>
                          <div style={{ fontSize: '11px', color: '#8896a8', marginTop: '2px' }}>Clock: {w.clock_number || 'N/A'} | {w.pay_method || 'EFT'} | R{w.payment_amount || '0'}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {!w.clocked_in_at && <span style={{ fontSize: '11px', color: '#8896a8', background: '#f0f2f7', padding: '4px 10px', borderRadius: '12px' }}>Not Started</span>}
                          {w.clocked_in_at && !w.clocked_out_at && <span style={{ fontSize: '11px', color: '#4db848', background: '#edf9ea', padding: '4px 10px', borderRadius: '12px' }}>Clocked In</span>}
                          {w.clocked_out_at && <span style={{ fontSize: '11px', color: '#1d3461', background: '#e8ecf4', padding: '4px 10px', borderRadius: '12px' }}>{Math.floor(w.total_minutes/60)}h {w.total_minutes%60}m</span>}
                          {!w.clocked_in_at && <button onClick={() => handleClockIn(w.id)} style={{ background: '#4db848', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Clock In</button>}
                          {w.clocked_in_at && !w.clocked_out_at && <button onClick={() => handleClockOut(w)} style={{ background: '#e53e3e', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Clock Out</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {showAssignModal && (
                  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', borderRadius: '12px', padding: '32px', width: '480px', maxWidth: '90vw' }}>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#1d3461', marginBottom: '20px' }}>Assign Worker</div>
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#1d3461', marginBottom: '6px' }}>Worker Name</div>
                        <input list="worker-list" value={wSearch} onChange={e => { setWSearch(e.target.value); const match = CASUAL_WORKERS.find(w => w.name === e.target.value); if (match) setWForm(f => ({ ...f, workerName: match.name, clockNumber: match.clock })) }} style={{ width: '100%', border: '1px solid #dde3ec', borderRadius: '6px', padding: '10px 12px', fontSize: '13px', boxSizing: 'border-box' as const }} placeholder="Search worker name..." />
                        <datalist id="worker-list">{CASUAL_WORKERS.filter(w => w.name.toLowerCase().includes(wSearch.toLowerCase())).map(w => <option key={w.name} value={w.name} />)}</datalist>
                      </div>
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#1d3461', marginBottom: '6px' }}>Clock Number</div>
                        <input value={wForm.clockNumber} onChange={e => setWForm(f => ({ ...f, clockNumber: e.target.value }))} style={{ width: '100%', border: '1px solid #dde3ec', borderRadius: '6px', padding: '10px 12px', fontSize: '13px', boxSizing: 'border-box' as const }} placeholder="Auto-fills from worker list" />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: '#1d3461', marginBottom: '6px' }}>Pay Method</div>
                          <select value={wForm.payMethod} onChange={e => setWForm(f => ({ ...f, payMethod: e.target.value }))} style={{ width: '100%', border: '1px solid #dde3ec', borderRadius: '6px', padding: '10px 12px', fontSize: '13px' }}>
                            <option value="EFT">EFT</option>
                            <option value="Cash">Cash</option>
                          </select>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: '#1d3461', marginBottom: '6px' }}>Payment Amount (R)</div>
                          <input type="number" value={wForm.paymentAmount} onChange={e => setWForm(f => ({ ...f, paymentAmount: e.target.value }))} style={{ width: '100%', border: '1px solid #dde3ec', borderRadius: '6px', padding: '10px 12px', fontSize: '13px', boxSizing: 'border-box' as const }} placeholder="0.00" />
                        </div>
                      </div>
                      <div style={{ marginBottom: '24px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#1d3461', marginBottom: '6px' }}>Pay Date</div>
                        <input type="date" value={wForm.payDate} onChange={e => setWForm(f => ({ ...f, payDate: e.target.value }))} style={{ width: '100%', border: '1px solid #dde3ec', borderRadius: '6px', padding: '10px 12px', fontSize: '13px', boxSizing: 'border-box' as const }} />
                      </div>
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button onClick={() => { setShowAssignModal(false); setWSearch('') }} style={{ border: '1px solid #dde3ec', background: 'white', borderRadius: '6px', padding: '10px 20px', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                        <button onClick={handleAssignWorker} disabled={savingWorker || !wForm.workerName} style={{ background: (savingWorker || !wForm.workerName) ? '#ccc' : '#4db848', color: 'white', border: 'none', borderRadius: '6px', padding: '10px 20px', fontSize: '13px', fontWeight: 700, cursor: (savingWorker || !wForm.workerName) ? 'not-allowed' : 'pointer' }}>{savingWorker ? 'Saving...' : 'Assign Worker'}</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

        {/* TIME TAB */}
        {activeTab === 'time' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#1d3461' }}>Time Tracking</div>
              <div style={{ fontSize: '12px', color: '#8896a8', marginTop: '2px' }}>Actual hours per worker per job</div>
            </div>
            {(() => {
              const totalMinutes = jobWorkers.reduce((sum, w) => sum + (w.total_minutes || 0), 0)
              const clockedIn = jobWorkers.filter(w => w.clocked_in_at && !w.clocked_out_at)
              const totalH = Math.floor(totalMinutes / 60)
              const totalM = totalMinutes % 60
              return (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                    {[
                      { l: 'Total Workers', v: jobWorkers.length.toString() },
                      { l: 'Currently Clocked In', v: clockedIn.length.toString() },
                      { l: 'Total Hours', v: totalMinutes > 0 ? totalH + 'h ' + totalM + 'm' : '0h 0m' }
                    ].map((s, i) => (
                      <div key={i} style={{ background: 'white', border: '1px solid #dde3ec', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>{s.l}</div>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: '#1d3461' }}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                  {jobWorkers.length === 0 ? (
                    <div style={{ background: 'white', border: '1px solid #dde3ec', borderRadius: '8px', padding: '48px', textAlign: 'center' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#1d3461', marginBottom: '4px' }}>No workers assigned yet</div>
                      <div style={{ fontSize: '12px', color: '#8896a8' }}>Assign workers from the Workers tab to start tracking time</div>
                    </div>
                  ) : (
                    <div style={{ background: 'white', border: '1px solid #dde3ec', borderRadius: '8px', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead><tr style={{ background: '#f8fafc' }}>
                          <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase' }}>Worker</th>
                          <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase' }}>Clock No</th>
                          <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase' }}>Clocked In</th>
                          <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase' }}>Clocked Out</th>
                          <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase' }}>Hours</th>
                          <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase' }}>Amount</th>
                          <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase' }}>Status</th>
                        </tr></thead>
                        <tbody>
                          {jobWorkers.map((w, i) => {
                            const mins = w.total_minutes || 0
                            const h = Math.floor(mins / 60)
                            const m = mins % 60
                            const isIn = w.clocked_in_at && !w.clocked_out_at
                            return (
                              <tr key={w.id} style={{ borderTop: i > 0 ? '1px solid #f1f5f9' : 'none' }}>
                                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1d3461' }}>{w.worker_name}</td>
                                <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '12px' }}>{w.clock_number || '-'}</td>
                                <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '12px' }}>{w.clocked_in_at ? new Date(w.clocked_in_at).toLocaleString('en-ZA', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</td>
                                <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '12px' }}>{w.clocked_out_at ? new Date(w.clocked_out_at).toLocaleString('en-ZA', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</td>
                                <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600, color: '#1d3461' }}>{mins > 0 ? h + 'h ' + m + 'm' : '-'}</td>
                                <td style={{ padding: '12px 14px', textAlign: 'right', color: '#64748b', fontSize: '12px' }}>{w.payment_amount ? 'R ' + parseFloat(w.payment_amount).toLocaleString('en-ZA', { minimumFractionDigits: 2 }) : '-'}</td>
                                <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                  <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, background: isIn ? '#dcfce7' : '#f1f5f9', color: isIn ? '#16a34a' : '#64748b' }}>
                                    {isIn ? 'CLOCKED IN' : w.clocked_out_at ? 'COMPLETE' : 'ASSIGNED'}
                                  </span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                        <tfoot><tr style={{ borderTop: '2px solid #e2e8f0', background: '#f8fafc' }}>
                          <td colSpan={4} style={{ padding: '10px 14px', fontWeight: 700, color: '#1d3461', fontSize: '12px' }}>TOTALS</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#1d3461' }}>{totalH}h {totalM}m</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#1d3461' }}>R {jobWorkers.reduce((s, w) => s + (parseFloat(w.payment_amount) || 0), 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                          <td></td>
                        </tr></tfoot>
                      </table>
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        )}

        {/* QC TAB */}
        {activeTab === 'qc' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#1d3461' }}>QC Holding Points</div>
                <div style={{ fontSize: '12px', color: '#8896a8', marginTop: '2px' }}>9 checkpoints - digital replacement for paper signature</div>
              </div>
              <div style={{ background: qcCheckpoints.filter(c=>c.signed_off).length === 9 ? '#dcfce7' : '#e8ecf4', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: 700, color: qcCheckpoints.filter(c=>c.signed_off).length === 9 ? '#16a34a' : '#1d3461' }}>
                {qcCheckpoints.filter(c=>c.signed_off).length} of 9 complete
              </div>
            </div>
            {loadingQC ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#8896a8', fontSize: '13px' }}>Loading checkpoints...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(qcCheckpoints.length > 0 ? qcCheckpoints : QC_DESCRIPTIONS.map((d,i)=>({ id: String(i), checkpoint_number: i+1, description: d, signed_off: false }))).map((cp: any) => (
                  <div key={cp.id} style={{ background: 'white', border: cp.signed_off ? '1px solid #4db848' : '1px solid #dde3ec', borderRadius: '8px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: cp.signed_off ? '#4db848' : '#e8ecf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: cp.signed_off ? 'white' : '#1d3461', flexShrink: 0 }}>{cp.checkpoint_number}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#1d3461', lineHeight: 1.4 }}>{cp.description}</div>
                      {cp.signed_off ? (
                        <div style={{ fontSize: '11px', color: '#4db848', marginTop: '4px', fontWeight: 600 }}>
                          Signed by {cp.signed_off_by} &bull; {cp.signed_off_at ? new Date(cp.signed_off_at).toLocaleString('en-ZA', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                        </div>
                      ) : (
                        <div style={{ fontSize: '11px', color: '#8896a8', marginTop: '3px' }}>Awaiting sign-off</div>
                      )}
                    </div>
                    {!cp.signed_off && (
                      <button onClick={() => setShowSignModal(cp.id)} style={{ background: '#4db848', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>Sign Off</button>
                    )}
                    {cp.signed_off && (
                      <div style={{ background: '#dcfce7', borderRadius: '6px', padding: '6px 12px', fontSize: '11px', fontWeight: 700, color: '#16a34a', flexShrink: 0 }}>Signed</div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {showSignModal !== null && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, borderRadius: '12px' }}>
                <div style={{ background: 'white', borderRadius: '10px', padding: '28px', width: '320px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#1d3461', marginBottom: '6px' }}>Sign Off Checkpoint</div>
                  <div style={{ fontSize: '12px', color: '#8896a8', marginBottom: '18px' }}>Enter your full name to confirm this checkpoint is complete.</div>
                  <input
                    type='text'
                    value={signerName}
                    onChange={e => setSignerName(e.target.value)}
                    placeholder='Your full name...'
                    style={{ width: '100%', border: '1px solid #dde3ec', borderRadius: '6px', padding: '10px 12px', fontSize: '13px', marginBottom: '16px', boxSizing: 'border-box' }}
                    autoFocus
                  />
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button onClick={() => { setShowSignModal(null); setSignerName('') }} style={{ border: '1px solid #dde3ec', background: 'white', borderRadius: '6px', padding: '9px 18px', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={() => handleSignOff(showSignModal as unknown as string)} disabled={savingSign || !signerName.trim()} style={{ background: savingSign || !signerName.trim() ? '#ccc' : '#4db848', color: 'white', border: 'none', borderRadius: '6px', padding: '9px 18px', fontSize: '13px', fontWeight: 700, cursor: savingSign || !signerName.trim() ? 'not-allowed' : 'pointer' }}>{savingSign ? 'Saving...' : 'Confirm Sign-Off'}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MATERIALS TAB */}
        {activeTab === 'materials' && (
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div><div style={{ fontSize: '16px', fontWeight: 700, color: '#1d3461' }}>Materials Used</div><div style={{ fontSize: '12px', color: '#8896a8', marginTop: '2px' }}>Log materials consumed against this job</div></div>
              <button onClick={() => setShowMatModal(true)} style={{ background: '#1d3461', color: 'white', border: 'none', borderRadius: '6px', padding: '10px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>+ Log Material</button>
            </div>
            {loadingMaterials ? (<div style={{ textAlign: 'center', padding: '40px', color: '#8896a8', fontSize: '13px' }}>Loading...</div>) : jobMaterials.length === 0 ? (
              <div style={{ background: 'white', border: '1px solid #dde3ec', borderRadius: '8px', padding: '48px', textAlign: 'center' }}><div style={{ fontSize: '14px', fontWeight: 600, color: '#1d3461', marginBottom: '4px' }}>No materials logged yet</div><div style={{ fontSize: '12px', color: '#8896a8' }}>Click Log Material to record materials consumed on this job</div></div>
            ) : (
              <div style={{ background: 'white', border: '1px solid #dde3ec', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead><tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase' }}>Description</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase' }}>Qty</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase' }}>Unit</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase' }}>Logged by</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase' }}>Date</th>
                    <th style={{ padding: '10px 14px', width: '40px' }}></th>
                  </tr></thead>
                  <tbody>{jobMaterials.map((m, i) => (
                    <tr key={m.id} style={{ borderTop: i > 0 ? '1px solid #f1f5f9' : 'none' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1d3461' }}>{m.description}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700, color: '#1d3461' }}>{m.quantity}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>{m.unit}</td>
                      <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '12px' }}>{m.notes || '-'}</td>
                      <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '12px' }}>{m.created_at ? new Date(m.created_at).toLocaleString('en-ZA', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}><button onClick={() => handleDeleteMaterial(m.id)} style={{ background: 'none', border: 'none', color: '#e24b4a', cursor: 'pointer', fontSize: '14px', fontWeight: 700 }}>x</button></td>
                    </tr>
                  ))}</tbody>
                  <tfoot><tr style={{ borderTop: '2px solid #e2e8f0', background: '#f8fafc' }}><td colSpan={5} style={{ padding: '10px 14px', fontWeight: 700, color: '#1d3461', fontSize: '12px' }}>Total items: {jobMaterials.length}</td><td></td></tr></tfoot>
                </table>
              </div>
            )}
            {showMatModal && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, borderRadius: '12px' }}>
                <div style={{ background: 'white', borderRadius: '10px', padding: '28px', width: '360px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#1d3461', marginBottom: '18px' }}>Log Material</div>
                  <div style={{ marginBottom: '12px' }}><label style={{ fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>Description *</label><input type='text' value={matForm.description} onChange={e => setMatForm(f => ({...f, description: e.target.value}))} placeholder='e.g. 50x50x3 SHS Steel' style={{ width: '100%', border: '1px solid #dde3ec', borderRadius: '6px', padding: '9px 12px', fontSize: '13px', boxSizing: 'border-box' }} autoFocus /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    <div><label style={{ fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>Quantity *</label><input type='number' value={matForm.quantity} onChange={e => setMatForm(f => ({...f, quantity: e.target.value}))} placeholder='0' min='0' step='0.01' style={{ width: '100%', border: '1px solid #dde3ec', borderRadius: '6px', padding: '9px 12px', fontSize: '13px', boxSizing: 'border-box' }} /></div>
                    <div><label style={{ fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>Unit</label><select value={matForm.unit} onChange={e => setMatForm(f => ({...f, unit: e.target.value}))} style={{ width: '100%', border: '1px solid #dde3ec', borderRadius: '6px', padding: '9px 12px', fontSize: '13px', boxSizing: 'border-box' }}>{MAT_UNITS.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
                  </div>
                  <div style={{ marginBottom: '20px' }}><label style={{ fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>Logged by</label><input type='text' value={matForm.logged_by} onChange={e => setMatForm(f => ({...f, logged_by: e.target.value}))} placeholder='Your name...' style={{ width: '100%', border: '1px solid #dde3ec', borderRadius: '6px', padding: '9px 12px', fontSize: '13px', boxSizing: 'border-box' }} /></div>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button onClick={() => { setShowMatModal(false); setMatForm({ description: '', quantity: '', unit: 'EA', logged_by: '' }) }} style={{ border: '1px solid #dde3ec', background: 'white', borderRadius: '6px', padding: '9px 18px', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={handleLogMaterial} disabled={savingMat || !matForm.description.trim() || !matForm.quantity} style={{ background: savingMat || !matForm.description.trim() || !matForm.quantity ? '#ccc' : '#1d3461', color: 'white', border: 'none', borderRadius: '6px', padding: '9px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>{savingMat ? 'Saving...' : 'Log Material'}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        
        {/* RECONCILE TAB */}
        {activeTab === 'line_items' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#1d3461' }}>Line Item Tracking</div>
                <div style={{ fontSize: '12px', color: '#8896a8', marginTop: '2px' }}>Track QC, delivery readiness, and dispatch per line item</div>
              </div>
              <button onClick={loadExecLineItems} style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 16px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                Refresh
              </button>
            </div>
            {loadingExecLines ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#8896a8' }}>Loading line items...</div>
            ) : execLineItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8896a8', fontSize: '13px' }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>📋</div>
                <div style={{ fontWeight: 600 }}>No line items on this job</div>
              </div>
            ) : (
              <div style={{ background: 'white', border: '1px solid #dde3ec', borderRadius: '8px', overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '700px' }}>
                  <thead><tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase' }}>Line</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase' }}>Description</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase' }}>Qty</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#4db848', textTransform: 'uppercase' }}>QC Done</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#d97706', textTransform: 'uppercase' }}>Ready for Delivery</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#1d3461', textTransform: 'uppercase' }}>Dispatched (Delivery No)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase' }}>Delivery Date</th>
                  </tr></thead>
                  <tbody>{execLineItems.map((li, idx) => (
                    <tr key={li.id} style={{ borderTop: idx > 0 ? '1px solid #f1f5f9' : 'none' }}>
                      <td style={{ padding: '10px 12px', color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
                      <td style={{ padding: '10px 12px', color: '#1d3461', fontWeight: 500 }}>{li.description}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b' }}>{li.quantity}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <input type="checkbox" checked={!!li.qc_done}
                          onChange={e => handleLineItemToggle(li, 'qc_done', e.target.checked)}
                          style={{ width: '18px', height: '18px', accentColor: '#4db848', cursor: 'pointer' }} />
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <input type="checkbox" checked={!!li.ready_for_delivery}
                          disabled={!li.qc_done}
                          onChange={e => handleLineItemToggle(li, 'ready_for_delivery', e.target.checked)}
                          style={{ width: '18px', height: '18px', accentColor: '#d97706', cursor: li.qc_done ? 'pointer' : 'not-allowed', opacity: li.qc_done ? 1 : 0.35 }} />
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <input type="checkbox" checked={!!li.dispatched}
                            disabled={!li.ready_for_delivery}
                            onChange={e => handleLineItemToggle(li, 'dispatched', e.target.checked)}
                            style={{ width: '18px', height: '18px', accentColor: '#1d3461', cursor: li.ready_for_delivery ? 'pointer' : 'not-allowed', opacity: li.ready_for_delivery ? 1 : 0.35 }} />
                          {li.dispatched && (
                            <input type="text" placeholder="DEL-001" defaultValue={li.delivery_number || ''}
                              onBlur={e => handleDeliveryField(li, 'delivery_number', e.target.value)}
                              style={{ width: '90px', border: '1px solid #dde3ec', borderRadius: '4px', padding: '3px 6px', fontSize: '11px', color: '#1d3461' }} />
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        {li.dispatched ? (
                          <input type="date" defaultValue={li.delivery_date || ''}
                            onBlur={e => handleDeliveryField(li, 'delivery_date', e.target.value)}
                            style={{ border: '1px solid #dde3ec', borderRadius: '4px', padding: '3px 6px', fontSize: '11px', color: '#1d3461' }} />
                        ) : (
                          <span style={{ color: '#cbd5e1', fontSize: '11px' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
                <div style={{ padding: '12px 16px', background: '#f8fafc', borderTop: '1px solid #dde3ec', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
                  <span>QC: <strong style={{ color: '#4db848' }}>{execLineItems.filter((i: any) => i.qc_done).length}/{execLineItems.length}</strong></span>
                  <span>Ready: <strong style={{ color: '#d97706' }}>{execLineItems.filter((i: any) => i.ready_for_delivery).length}/{execLineItems.length}</strong></span>
                  <span>Dispatched: <strong style={{ color: '#1d3461' }}>{execLineItems.filter((i: any) => i.dispatched).length}/{execLineItems.length}</strong></span>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reconcile' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#1d3461' }}>Quote Reconciliation</div>
                <div style={{ fontSize: '12px', color: '#8896a8', marginTop: '2px' }}>Compare Pastel quoted values against actual execution</div>
              </div>
              <button onClick={() => reconcileFileRef.current?.click()}
                style={{ padding: '10px 20px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                Upload Pastel Export
              </button>
              <input ref={reconcileFileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setReconcileFileName(file.name)
                  const reader = new FileReader()
                  reader.onload = (ev) => {
                    const text = ev.target?.result as string
                    const lines = text.trim().split('\n')
                    if (lines.length < 2) return
                    const headers = lines[0].split(',').map((h: string) => h.trim().replace(/^"|"$/g, ''))
                    const rows = lines.slice(1).map((line: string) => {
                      const vals = line.split(',').map((v: string) => v.trim().replace(/^"|"$/g, ''))
                      const row: any = {}
                      headers.forEach((h: string, i: number) => { row[h] = vals[i] || '' })
                      return row
                    }).filter((r: any) => r.LineItem || r.Description)
                    setReconcileData(rows)
                  }
                  reader.readAsText(file)
                }} />
            </div>

            {reconcileFileName && (
              <div style={{ padding: '10px 16px', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', color: '#7c3aed' }}>
                Loaded: <strong>{reconcileFileName}</strong> — {reconcileData.length} line items
              </div>
            )}

            {reconcileData.length > 0 ? (
              <div style={{ background: 'white', border: '1px solid #dde3ec', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead><tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase' }}>Line Item</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase' }}>Quoted Qty</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase' }}>Quoted Price</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase' }}>Quoted Total</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase' }}>Actual Qty</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '11px', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase' }}>Variance</th>
                  </tr></thead>
                  <tbody>{reconcileData.map((row: any, i: number) => {
                    const quotedQty = parseFloat(row.Quantity || row.Qty || '0')
                    const quotedPrice = parseFloat(row.UnitPrice || row.Price || '0')
                    const quotedTotal = quotedQty * quotedPrice
                    // Match against actual materials logged in E4
                    const actualMat = jobMaterials.find((m: any) => m.description?.toLowerCase().includes((row.Description || row.LineItem || '').toLowerCase().slice(0, 10)))
                    const actualQty = actualMat ? actualMat.quantity : 0
                    const actualTotal = actualQty * quotedPrice
                    const variance = actualTotal - quotedTotal
                    const varianceColor = variance > 0 ? '#dc2626' : variance < 0 ? '#16a34a' : '#64748b'
                    return (
                      <tr key={i} style={{ borderTop: i > 0 ? '1px solid #f1f5f9' : 'none' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1d3461' }}>{row.Description || row.LineItem || '-'}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', color: '#64748b' }}>{quotedQty}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', color: '#64748b' }}>R {quotedPrice.toFixed(2)}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600, color: '#1d3461' }}>R {quotedTotal.toFixed(2)}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700, color: actualMat ? '#1d3461' : '#cbd5e1' }}>{actualMat ? actualQty : '—'}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: varianceColor }}>
                          {actualMat ? (variance > 0 ? '+' : '') + 'R ' + variance.toFixed(2) : '—'}
                        </td>
                      </tr>
                    )
                  })}</tbody>
                </table>
                <div style={{ padding: '14px', background: '#f8fafc', borderTop: '1px solid #dde3ec', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#8896a8' }}>
                    Quoted Total: <strong style={{ color: '#1d3461' }}>R {reconcileData.reduce((s: number, r: any) => s + (parseFloat(r.Quantity || r.Qty || '0') * parseFloat(r.UnitPrice || r.Price || '0')), 0).toFixed(2)}</strong>
                  </span>
                  <span style={{ fontSize: '11px', color: '#8896a8' }}>Variance = Actual - Quoted (Red = overrun, Green = saving)</span>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8896a8', fontSize: '13px' }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>📊</div>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>No Pastel data loaded</div>
                <div>Upload a Pastel quote export CSV to compare against actual materials logged on this job</div>
                <div style={{ marginTop: '12px', fontSize: '11px', color: '#b0b8c8' }}>Expected columns: Description, Quantity, UnitPrice</div>
              </div>
            )}
          </div>
        )}


        {/* WORKSHOP NOTES â€” always visible at bottom */}
        <div style={{ marginTop: '32px', background: 'white', border: '1px solid #dde3ec', borderRadius: '8px', padding: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#1d3461', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Workshop Notes</div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            style={{ width: '100%', border: '1px solid #dde3ec', borderRadius: '6px', padding: '10px 12px', fontSize: '13px', color: '#1d3461', resize: 'none', outline: 'none', fontFamily: 'sans-serif', boxSizing: 'border-box' }}
            placeholder="Add workshop notes..." />
          <button
            onClick={handleSaveNotes}
            disabled={savingNotes}
            style={{ marginTop: '10px', background: savingNotes ? '#8ec88b' : '#4db848', color: 'white', border: 'none', borderRadius: '6px', padding: '10px 24px', fontSize: '13px', fontWeight: 700, cursor: savingNotes ? 'not-allowed' : 'pointer' }}>
            {savingNotes ? 'Saving...' : 'Save Notes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// PROCUREMENT PAGE (TABBED)

const PR_STATUS_BADGE: Record<string, string> = {
  PENDING_APPROVAL: 'bg-amber-100 text-amber-700 border border-amber-200',
  APPROVED: 'bg-green-100 text-green-700 border border-green-200',
  REJECTED: 'bg-red-100 text-red-700 border border-red-200',
  PO_ISSUED: 'bg-[#1d3461] text-white border border-[#1d3461]',
}

function SupplierManagement({ suppliers, loading, onRefresh, currentRole }: { suppliers: Supplier[]; loading: boolean; onRefresh: () => void; currentRole: string | null }) {
  const { activeEntity } = useEntity()
  const [procurementTab, setProcurementTab] = React.useState<'suppliers' | 'purchase_requests' | 'purchase_orders' | 'invoices'>('suppliers')
  const [purchaseRequests, setPurchaseRequests] = React.useState<PurchaseRequest[]>([])
  const [prsLoading, setPrsLoading] = React.useState(false)
  const [purchaseOrders, setPurchaseOrders] = React.useState<PurchaseOrder[]>([])
  const [posLoading, setPosLoading] = React.useState(false)
  const [invoices, setInvoices] = React.useState<SupplierInvoice[]>([])
  const [invoicesLoading, setInvoicesLoading] = React.useState(false)

  const fetchPRs = React.useCallback(async () => {
    setPrsLoading(true)
    try {
      const { data, error } = await supabase
        .from('purchase_requests')
        .select('*, suppliers(company_name), jobs(job_number, description)')
        .eq('operating_entity', activeEntity)
        .order('created_at', { ascending: false })
      if (error) throw error
      setPurchaseRequests(data || [])
    } catch (e: any) { console.error('Failed to fetch PRs:', e.message) }
    finally { setPrsLoading(false) }
  }, [activeEntity])

  const fetchPOs = React.useCallback(async () => {
    setPosLoading(true)
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*, suppliers(company_name, contact_person, phone, email, account_number), jobs(job_number, description), purchase_requests(pr_number)')
        .eq('operating_entity', activeEntity)
        .order('created_at', { ascending: false })
      if (error) throw error
      setPurchaseOrders(data || [])
    } catch (e: any) { console.error('Failed to fetch POs:', e.message) }
    finally { setPosLoading(false) }
  }, [activeEntity])

  const fetchInvoices = React.useCallback(async () => {
    setInvoicesLoading(true)
    try {
      const { data, error } = await supabase
        .from('supplier_invoices')
        .select('*, suppliers(company_name), purchase_orders(po_number, total_value)')
        .eq('operating_entity', activeEntity)
        .order('created_at', { ascending: false })
      if (error) throw error
      setInvoices(data || [])
    } catch (e: any) { console.error('Failed to fetch invoices:', e.message) }
    finally { setInvoicesLoading(false) }
  }, [activeEntity])

  React.useEffect(() => { if (procurementTab === 'purchase_requests') fetchPRs() }, [procurementTab, fetchPRs])
  React.useEffect(() => { if (procurementTab === 'purchase_orders') fetchPOs() }, [procurementTab, fetchPOs])
  React.useEffect(() => { if (procurementTab === 'invoices') fetchInvoices() }, [procurementTab, fetchInvoices])

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-1 mb-4 border-b border-gray-200">
        <button onClick={() => setProcurementTab('suppliers')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${procurementTab === 'suppliers' ? 'border-green-500 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          Supplier Register
        </button>
        <button onClick={() => setProcurementTab('purchase_requests')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${procurementTab === 'purchase_requests' ? 'border-green-500 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          Purchase Requests
        </button>
        <button onClick={() => setProcurementTab('purchase_orders')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${procurementTab === 'purchase_orders' ? 'border-green-500 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          Purchase Orders
        </button>
        <button onClick={() => setProcurementTab('invoices')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${procurementTab === 'invoices' ? 'border-green-500 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          Invoices
        </button>
      </div>

      {procurementTab === 'suppliers'
        ? <SupplierRegisterTab suppliers={suppliers} loading={loading} onRefresh={onRefresh} currentRole={currentRole} />
        : procurementTab === 'purchase_requests'
        ? <PurchaseRequestsTab purchaseRequests={purchaseRequests} loading={prsLoading} onRefresh={fetchPRs} currentRole={currentRole} suppliers={suppliers} activeEntity={activeEntity} />
        : procurementTab === 'purchase_orders'
        ? <PurchaseOrdersTab purchaseOrders={purchaseOrders} loading={posLoading} onRefresh={fetchPOs} currentRole={currentRole} activeEntity={activeEntity} />
        : <InvoicesTab invoices={invoices} loading={invoicesLoading} onRefresh={fetchInvoices} currentRole={currentRole} />}
    </div>
  )
}

// SUPPLIER REGISTER TAB

function SupplierRegisterTab({ suppliers, loading, onRefresh, currentRole }: { suppliers: Supplier[]; loading: boolean; onRefresh: () => void; currentRole: string | null }) {
  const [searchTerm, setSearchTerm] = React.useState('')
  const [activeOnly, setActiveOnly] = React.useState(true)
  const [showAddModal, setShowAddModal] = React.useState(false)
  const [editingSupplier, setEditingSupplier] = React.useState<Supplier | null>(null)
  const [deactivatingSupplier, setDeactivatingSupplier] = React.useState<Supplier | null>(null)

  const filtered = suppliers.filter(s => {
    if (activeOnly && !s.is_active) return false
    if (!searchTerm.trim()) return true
    const term = searchTerm.toLowerCase()
    return (s.company_name?.toLowerCase().includes(term) ||
      s.contact_person?.toLowerCase().includes(term) ||
      s.email?.toLowerCase().includes(term) ||
      s.account_number?.toLowerCase().includes(term))
  })

  const activeCount = suppliers.filter(s => s.is_active).length

  if (loading) return <div className="flex items-center justify-center h-64 gap-3 text-gray-400"><div className="w-5 h-5 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin" /><span>Loading suppliers...</span></div>

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-lg font-bold text-gray-900">Supplier Register</h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">{activeCount} active</span>
        </div>
        <p className="text-sm text-gray-500">Manage approved suppliers for procurement</p>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search suppliers..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500" />
        </div>
        <button onClick={() => setActiveOnly(!activeOnly)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${activeOnly ? 'bg-green-50 border-green-300 text-green-700' : 'bg-gray-50 border-gray-300 text-gray-600'}`}>
          <Filter size={14} />{activeOnly ? 'Active Only' : 'Show All'}
        </button>
        <button onClick={onRefresh} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300">
          <RefreshCw size={14} />Refresh
        </button>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors ml-auto">
          <Plus size={15} />Add Supplier
        </button>
      </div>

      <div className="flex-1 overflow-auto bg-white rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Company Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact Person</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Account No.</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment Terms</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                {searchTerm ? 'No suppliers match your search' : 'No suppliers found. Add your first supplier to get started.'}
              </td></tr>
            ) : filtered.map(supplier => (
              <tr key={supplier.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{supplier.company_name}</td>
                <td className="px-4 py-3 text-gray-600">{supplier.contact_person || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{supplier.phone || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{supplier.email || '-'}</td>
                <td className="px-4 py-3 text-gray-600 font-mono text-xs">{supplier.account_number || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{supplier.payment_terms || '-'}</td>
                <td className="px-4 py-3">
                  {supplier.is_active
                    ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">ACTIVE</span>
                    : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">INACTIVE</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setEditingSupplier(supplier)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit">
                      <Edit3 size={14} />
                    </button>
                    {supplier.is_active && (
                      <button onClick={() => setDeactivatingSupplier(supplier)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Deactivate">
                        <XCircle size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && <AddSupplierModal onClose={() => setShowAddModal(false)} onCreated={onRefresh} currentRole={currentRole} />}
      {editingSupplier && <EditSupplierModal supplier={editingSupplier} onClose={() => setEditingSupplier(null)} onUpdated={onRefresh} currentRole={currentRole} />}
      {deactivatingSupplier && <DeactivateSupplierModal supplier={deactivatingSupplier} onClose={() => setDeactivatingSupplier(null)} onDeactivated={onRefresh} currentRole={currentRole} />}
    </div>
  )
}

// PURCHASE REQUESTS TAB

function PurchaseRequestsTab({ purchaseRequests, loading, onRefresh, currentRole, suppliers, activeEntity }: { purchaseRequests: PurchaseRequest[]; loading: boolean; onRefresh: () => void; currentRole: string | null; suppliers: Supplier[]; activeEntity: OperatingEntity }) {
  const [searchTerm, setSearchTerm] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL')
  const [showCreateModal, setShowCreateModal] = React.useState(false)
  const [selectedPR, setSelectedPR] = React.useState<PurchaseRequest | null>(null)

  const filtered = React.useMemo(() => {
    let result = [...purchaseRequests]
    if (statusFilter !== 'ALL') result = result.filter(pr => pr.status === statusFilter)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      result = result.filter(pr =>
        pr.pr_number?.toLowerCase().includes(term) ||
        pr.suppliers?.company_name?.toLowerCase().includes(term) ||
        pr.jobs?.job_number?.toLowerCase().includes(term))
    }
    // Sort PENDING_APPROVAL first
    result.sort((a, b) => {
      if (a.status === 'PENDING_APPROVAL' && b.status !== 'PENDING_APPROVAL') return -1
      if (b.status === 'PENDING_APPROVAL' && a.status !== 'PENDING_APPROVAL') return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    return result
  }, [purchaseRequests, statusFilter, searchTerm])

  const pendingCount = purchaseRequests.filter(pr => pr.status === 'PENDING_APPROVAL').length

  if (loading) return <div className="flex items-center justify-center h-64 gap-3 text-gray-400"><div className="w-5 h-5 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin" /><span>Loading purchase requests...</span></div>

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-lg font-bold text-gray-900">Purchase Requests</h2>
          {pendingCount > 0 && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">{pendingCount} pending</span>}
        </div>
        <p className="text-sm text-gray-500">Raise and manage purchase requests</p>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by PR number, supplier or job..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="ALL">All Statuses</option>
          <option value="PENDING_APPROVAL">Pending Approval</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="PO_ISSUED">PO Issued</option>
        </select>
        <button onClick={onRefresh} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300">
          <RefreshCw size={14} />Refresh
        </button>
        <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors ml-auto">
          <Plus size={15} />New Purchase Request
        </button>
      </div>

      <div className="flex-1 overflow-auto bg-white rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">PR Number</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Supplier</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Job Ref</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Required By</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Est. Value</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Raised By</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Raised</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                {searchTerm || statusFilter !== 'ALL' ? 'No purchase requests match your filter' : 'No purchase requests yet.'}
              </td></tr>
            ) : filtered.map(pr => (
              <tr key={pr.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedPR(pr)}>
                <td className="px-4 py-3 font-medium text-gray-900 font-mono text-xs">{pr.pr_number || '-'}</td>
                <td className="px-4 py-3 text-gray-700">{pr.suppliers?.company_name || '-'}</td>
                <td className="px-4 py-3 text-gray-600 font-mono text-xs">{pr.jobs?.job_number || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{formatDate(pr.required_by_date)}</td>
                <td className="px-4 py-3 text-right text-gray-700 font-medium">R {(pr.total_estimated_value || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${PR_STATUS_BADGE[pr.status] || 'bg-gray-100 text-gray-500'}`}>
                    {pr.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{pr.raised_by || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{formatDate(pr.created_at)}</td>
                <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setSelectedPR(pr)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="View Details">
                    <Eye size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreateModal && <CreatePurchaseRequestModal suppliers={suppliers} onClose={() => setShowCreateModal(false)} onCreated={onRefresh} currentRole={currentRole} />}
      {selectedPR && <PurchaseRequestDetailModal pr={selectedPR} onClose={() => setSelectedPR(null)} onUpdated={() => { setSelectedPR(null); onRefresh() }} currentRole={currentRole} activeEntity={activeEntity} />}
    </div>
  )
}

// CREATE PURCHASE REQUEST MODAL

function CreatePurchaseRequestModal({ suppliers, onClose, onCreated, currentRole }: { suppliers: Supplier[]; onClose: () => void; onCreated: () => void; currentRole: string | null }) {
  const { activeEntity } = useEntity()
  const [saving, setSaving] = React.useState(false)
  const [activeJobs, setActiveJobs] = React.useState<{ id: string; job_number: string; description: string | null }[]>([])
  const [form, setForm] = React.useState({
    supplier_id: '',
    job_id: '',
    required_by_date: '',
  })
  const [lineItems, setLineItems] = React.useState([
    { description: '', quantity: 1, uom: 'EA', estimated_unit_price: 0 }
  ])

  React.useEffect(() => {
    supabase.from('jobs').select('id, job_number, description').eq('operating_entity', activeEntity).order('job_number', { ascending: false }).then(({ data }) => {
      if (data) setActiveJobs(data)
    })
  }, [activeEntity])

  const activeSuppliers = suppliers.filter(s => s.is_active)

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }))

  const addLineItem = () => setLineItems(li => [...li, { description: '', quantity: 1, uom: 'EA', estimated_unit_price: 0 }])
  const removeLineItem = (i: number) => { if (lineItems.length > 1) setLineItems(li => li.filter((_, idx) => idx !== i)) }
  const updateLineItem = (i: number, field: string, value: any) =>
    setLineItems(li => li.map((item, idx) => idx === i ? { ...item, [field]: value } : item))

  const totalEstimated = lineItems.reduce((sum, li) => sum + (li.quantity * li.estimated_unit_price), 0)

  const handleSave = async () => {
    if (!form.supplier_id) { alert('Please select a supplier'); return }
    if (!form.job_id) { alert('Please select a job'); return }
    const validItems = lineItems.filter(li => li.description.trim())
    if (validItems.length === 0) { alert('Please add at least one line item with a description'); return }

    setSaving(true)
    try {
      const { data: pr, error: prError } = await supabase.from('purchase_requests').insert({
        operating_entity: activeEntity,
        supplier_id: form.supplier_id,
        job_id: form.job_id,
        required_by_date: form.required_by_date || null,
        status: 'PENDING_APPROVAL',
        total_estimated_value: totalEstimated,
        raised_by: currentRole,
      }).select('id, pr_number').single()
      if (prError) throw prError

      const { error: liError } = await supabase.from('purchase_request_line_items').insert(
        validItems.map(li => ({
          purchase_request_id: pr.id,
          description: li.description.trim(),
          quantity: li.quantity,
          uom: li.uom,
          estimated_unit_price: li.estimated_unit_price,
          estimated_total: li.quantity * li.estimated_unit_price,
        }))
      )
      if (liError) console.error('Line items error:', liError.message)

      const selectedSupplier = activeSuppliers.find(s => s.id === form.supplier_id)
      const selectedJob = activeJobs.find(j => j.id === form.job_id)

      await supabase.from('activity_log').insert({
        action_type: 'purchase_request_raised',
        entity_type: 'purchase_request',
        entity_id: pr.id,
        operating_entity: activeEntity,
        metadata: {
          pr_number: pr.pr_number,
          supplier_name: selectedSupplier?.company_name || null,
          job_reference: selectedJob?.job_number || null,
          total_estimated_value: totalEstimated,
          line_item_count: validItems.length,
          raised_by: currentRole,
        },
        user_id: currentRole,
      }).then(({ error: logErr }) => { if (logErr) console.error('Activity log error:', logErr.message) })

      onCreated()
      onClose()
    } catch (e: any) { alert('Error: ' + e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">New Purchase Request</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-5 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Supplier <span className="text-red-500">*</span></label>
              <select value={form.supplier_id} onChange={e => set('supplier_id', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Select supplier...</option>
                {activeSuppliers.map(s => <option key={s.id} value={s.id}>{s.company_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Job <span className="text-red-500">*</span></label>
              <select value={form.job_id} onChange={e => set('job_id', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Select job...</option>
                {activeJobs.map(j => <option key={j.id} value={j.id}>{j.job_number} — {j.description || 'No description'}</option>)}
              </select>
            </div>
          </div>
          <div className="max-w-xs">
            <label className="block text-xs font-medium text-gray-600 mb-1">Required By Date</label>
            <input type="date" value={form.required_by_date} onChange={e => set('required_by_date', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Line Items</p>
              <button onClick={addLineItem} className="flex items-center gap-1 text-xs font-semibold text-green-600 hover:text-green-700">
                <Plus size={13} />Add Line Item
              </button>
            </div>
            <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 w-2/5">Description</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 w-16">Qty</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 w-20">UOM</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 w-28">Unit Price</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 w-28">Total</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {lineItems.map((li, i) => (
                    <tr key={i}>
                      <td className="px-2 py-1.5">
                        <input type="text" value={li.description} onChange={e => updateLineItem(i, 'description', e.target.value)} placeholder="Item description"
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" value={li.quantity} onChange={e => updateLineItem(i, 'quantity', parseFloat(e.target.value) || 0)} min="0" step="0.01"
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-green-500" />
                      </td>
                      <td className="px-2 py-1.5">
                        <select value={li.uom} onChange={e => updateLineItem(i, 'uom', e.target.value)}
                          className="w-full border border-gray-300 rounded px-1 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-green-500">
                          {UOM_OPTIONS.map(u => <option key={u}>{u}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" value={li.estimated_unit_price} onChange={e => updateLineItem(i, 'estimated_unit_price', parseFloat(e.target.value) || 0)} min="0" step="0.01"
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-green-500" />
                      </td>
                      <td className="px-3 py-1.5 text-right text-sm font-medium text-gray-700">
                        R {(li.quantity * li.estimated_unit_price).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-1 py-1.5">
                        {lineItems.length > 1 && (
                          <button onClick={() => removeLineItem(i)} className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-end px-4 py-3 bg-white border-t border-gray-200">
                <div className="text-sm font-bold text-gray-900">
                  Total Estimated: <span className="text-green-700">R {totalEstimated.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
            {saving ? 'Creating...' : 'Submit Purchase Request'}
          </button>
        </div>
      </div>
    </div>
  )
}

// PURCHASE REQUEST DETAIL MODAL

function PurchaseRequestDetailModal({ pr, onClose, onUpdated, currentRole, activeEntity }: { pr: PurchaseRequest; onClose: () => void; onUpdated: () => void; currentRole: string | null; activeEntity: OperatingEntity }) {
  const [lineItems, setLineItems] = React.useState<PRLineItem[]>([])
  const [loadingLines, setLoadingLines] = React.useState(true)
  const [showApproveConfirm, setShowApproveConfirm] = React.useState(false)
  const [showRejectModal, setShowRejectModal] = React.useState(false)
  const [processing, setProcessing] = React.useState(false)
  const [rejectReason, setRejectReason] = React.useState('')

  React.useEffect(() => {
    setLoadingLines(true)
    supabase.from('purchase_request_line_items').select('*').eq('purchase_request_id', pr.id).then(({ data }) => {
      setLineItems(data || [])
      setLoadingLines(false)
    })
  }, [pr.id])

  const handleApprove = async () => {
    setProcessing(true)
    try {
      // 1. Set PR to APPROVED
      const { error: approveErr } = await supabase.from('purchase_requests').update({
        status: 'APPROVED',
        approved_by: currentRole,
        approved_at: new Date().toISOString(),
      }).eq('id', pr.id)
      if (approveErr) throw approveErr

      // 2. Create PO (po_number auto-generated by trigger)
      const { data: po, error: poErr } = await supabase.from('purchase_orders').insert({
        operating_entity: (pr.operating_entity === 'ERHA_FC' || pr.operating_entity === 'ERHA_SS') ? pr.operating_entity : activeEntity,
        purchase_request_id: pr.id,
        supplier_id: pr.supplier_id,
        job_id: pr.job_id,
        status: 'ISSUED',
        total_value: pr.total_estimated_value || 0,
        issued_by: currentRole,
        issued_at: new Date().toISOString(),
        required_by_date: pr.required_by_date || null,
      }).select('id, po_number').single()
      if (poErr) throw poErr

      // 3. Copy line items to po_line_items
      if (lineItems.length > 0) {
        const { error: poLiErr } = await supabase.from('po_line_items').insert(
          lineItems.map(li => ({
            po_id: po.id,
            description: li.description,
            quantity_ordered: li.quantity,
            quantity_received: 0,
            uom: li.uom,
            unit_price: li.estimated_unit_price || 0,
            total_price: li.estimated_total || 0,
          }))
        )
        if (poLiErr) console.error('PO line items error:', poLiErr.message)
      }

      // 4. Set PR status to PO_ISSUED
      await supabase.from('purchase_requests').update({ status: 'PO_ISSUED' }).eq('id', pr.id)

      // 5. ML activity log
      await supabase.from('activity_log').insert({
        action_type: 'purchase_request_approved',
        entity_type: 'purchase_request',
        entity_id: pr.id,
        operating_entity: (pr.operating_entity === 'ERHA_FC' || pr.operating_entity === 'ERHA_SS') ? pr.operating_entity : activeEntity,
        metadata: {
          pr_number: pr.pr_number,
          supplier_name: pr.suppliers?.company_name || null,
          job_reference: pr.jobs?.job_number || null,
          po_number: po.po_number,
          approved_by: currentRole,
        },
        user_id: currentRole,
      }).then(({ error: logErr }) => { if (logErr) console.error('Activity log error:', logErr.message) })

      onUpdated()
    } catch (e: any) { alert('Error: ' + e.message); setProcessing(false) }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) { alert('Please provide a rejection reason'); return }
    setProcessing(true)
    try {
      const { error } = await supabase.from('purchase_requests').update({
        status: 'REJECTED',
        rejection_reason: rejectReason.trim(),
      }).eq('id', pr.id)
      if (error) throw error

      await supabase.from('activity_log').insert({
        action_type: 'purchase_request_rejected',
        entity_type: 'purchase_request',
        entity_id: pr.id,
        operating_entity: (pr.operating_entity === 'ERHA_FC' || pr.operating_entity === 'ERHA_SS') ? pr.operating_entity : activeEntity,
        metadata: {
          pr_number: pr.pr_number,
          supplier_name: pr.suppliers?.company_name || null,
          rejection_reason: rejectReason.trim(),
          rejected_by: currentRole,
        },
        user_id: currentRole,
      }).then(({ error: logErr }) => { if (logErr) console.error('Activity log error:', logErr.message) })

      onUpdated()
    } catch (e: any) { alert('Error: ' + e.message); setProcessing(false) }
  }

  const canApproveReject = currentRole === 'HENDRIK' && pr.status === 'PENDING_APPROVAL'

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <ShoppingCart size={20} className="text-gray-400" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">{pr.pr_number || 'Purchase Request'}</h2>
              <p className="text-xs text-gray-500">Raised {formatDate(pr.created_at)} by {pr.raised_by || 'Unknown'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${PR_STATUS_BADGE[pr.status] || 'bg-gray-100 text-gray-500'}`}>
              {pr.status.replace(/_/g, ' ')}
            </span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* PR details */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Supplier</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{pr.suppliers?.company_name || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Job Reference</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{pr.jobs?.job_number || '-'}{pr.jobs?.description ? ` — ${pr.jobs.description}` : ''}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Required By</p>
              <p className="text-sm text-gray-700 mt-0.5">{formatDate(pr.required_by_date)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Estimated Value</p>
              <p className="text-sm font-bold text-green-700 mt-0.5">R {(pr.total_estimated_value || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</p>
            </div>
            {pr.approved_by && (
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Approved By</p>
                <p className="text-sm text-gray-700 mt-0.5">{pr.approved_by} on {formatDate(pr.approved_at)}</p>
              </div>
            )}
            {pr.rejection_reason && (
              <div className="col-span-2">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Rejection Reason</p>
                <p className="text-sm text-red-700 mt-0.5 bg-red-50 rounded-lg p-2">{pr.rejection_reason}</p>
              </div>
            )}
          </div>

          {/* Line items */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Line Items</p>
            {loadingLines ? (
              <div className="text-center py-6 text-gray-400 text-sm">Loading line items...</div>
            ) : (
              <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">#</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Description</th>
                      <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">Qty</th>
                      <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">UOM</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">Unit Price</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {lineItems.map((li, i) => (
                      <tr key={li.id}>
                        <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                        <td className="px-3 py-2 text-gray-900">{li.description}</td>
                        <td className="px-3 py-2 text-center text-gray-700">{li.quantity}</td>
                        <td className="px-3 py-2 text-center text-gray-500">{li.uom || '-'}</td>
                        <td className="px-3 py-2 text-right text-gray-700">R {(li.estimated_unit_price || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900">R {(li.estimated_total || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-end px-4 py-3 bg-white border-t border-gray-200">
                  <div className="text-sm font-bold text-gray-900">
                    Total: <span className="text-green-700">R {(pr.total_estimated_value || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium">Close</button>
          {canApproveReject && !showApproveConfirm && !showRejectModal && (
            <>
              <button onClick={() => setShowRejectModal(true)} className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2">
                <XCircle size={14} />Reject
              </button>
              <button onClick={() => setShowApproveConfirm(true)} className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                <CheckCircle size={14} />Approve
              </button>
            </>
          )}
        </div>

        {/* Approve confirmation inline */}
        {showApproveConfirm && (
          <div className="px-6 py-4 border-t border-green-200 bg-green-50 rounded-b-xl">
            <p className="text-sm text-green-800 font-medium mb-3">Approve this purchase request? This will automatically generate a Purchase Order.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowApproveConfirm(false)} disabled={processing} className="px-4 py-2 text-sm text-gray-600 font-medium">Cancel</button>
              <button onClick={handleApprove} disabled={processing} className="px-6 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
                {processing ? 'Processing...' : 'Confirm Approve & Generate PO'}
              </button>
            </div>
          </div>
        )}

        {/* Reject reason inline */}
        {showRejectModal && (
          <div className="px-6 py-4 border-t border-red-200 bg-red-50 rounded-b-xl">
            <p className="text-sm text-red-800 font-medium mb-2">Rejection Reason <span className="text-red-500">*</span></p>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={2} placeholder="Provide a reason for rejecting this purchase request..."
              className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none mb-3" />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowRejectModal(false); setRejectReason('') }} disabled={processing} className="px-4 py-2 text-sm text-gray-600 font-medium">Cancel</button>
              <button onClick={handleReject} disabled={processing || !rejectReason.trim()} className="px-6 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
                {processing ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// PURCHASE ORDERS TAB

const PO_STATUS_BADGE: Record<string, string> = {
  ISSUED: 'bg-blue-100 text-blue-700 border border-blue-200',
  PARTIALLY_RECEIVED: 'bg-amber-100 text-amber-700 border border-amber-200',
  FULLY_RECEIVED: 'bg-green-100 text-green-700 border border-green-200',
  INVOICED: 'bg-purple-100 text-purple-700 border border-purple-200',
  CLOSED: 'bg-gray-100 text-gray-500 border border-gray-200',
}

function PurchaseOrdersTab({ purchaseOrders, loading, onRefresh, currentRole, activeEntity }: { purchaseOrders: PurchaseOrder[]; loading: boolean; onRefresh: () => void; currentRole: string | null; activeEntity: OperatingEntity }) {
  const [searchTerm, setSearchTerm] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('ACTIVE')
  const [selectedPO, setSelectedPO] = React.useState<PurchaseOrder | null>(null)
  const [deliveryPO, setDeliveryPO] = React.useState<PurchaseOrder | null>(null)
  const canLogDelivery = currentRole === 'CHARLES' || currentRole === 'HENDRIK'

  const filtered = React.useMemo(() => {
    let result = [...purchaseOrders]
    if (statusFilter === 'ACTIVE') result = result.filter(po => po.status !== 'CLOSED')
    else if (statusFilter !== 'ALL') result = result.filter(po => po.status === statusFilter)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      result = result.filter(po =>
        po.po_number?.toLowerCase().includes(term) ||
        po.suppliers?.company_name?.toLowerCase().includes(term) ||
        po.jobs?.job_number?.toLowerCase().includes(term))
    }
    return result
  }, [purchaseOrders, statusFilter, searchTerm])

  const today = new Date().toISOString().split('T')[0]
  const isOverdue = (po: PurchaseOrder) =>
    po.required_by_date && po.required_by_date < today && po.status !== 'FULLY_RECEIVED' && po.status !== 'CLOSED'

  const activeCount = purchaseOrders.filter(po => po.status !== 'CLOSED').length

  if (loading) return <div className="flex items-center justify-center h-64 gap-3 text-gray-400"><div className="w-5 h-5 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin" /><span>Loading purchase orders...</span></div>

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-lg font-bold text-gray-900">Purchase Orders</h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">{activeCount} active</span>
        </div>
        <p className="text-sm text-gray-500">Auto-generated from approved purchase requests</p>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by PO number, supplier or job..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="ACTIVE">Active (not Closed)</option>
          <option value="ALL">All Statuses</option>
          <option value="ISSUED">Issued</option>
          <option value="PARTIALLY_RECEIVED">Partially Received</option>
          <option value="FULLY_RECEIVED">Fully Received</option>
          <option value="INVOICED">Invoiced</option>
          <option value="CLOSED">Closed</option>
        </select>
        <button onClick={onRefresh} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300">
          <RefreshCw size={14} />Refresh
        </button>
      </div>

      <div className="flex-1 overflow-auto bg-white rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">PO Number</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Supplier</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Job Ref</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Required By</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Value</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Issued By</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Issued</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                {searchTerm || statusFilter !== 'ACTIVE' ? 'No purchase orders match your filter' : 'No active purchase orders.'}
              </td></tr>
            ) : filtered.map(po => (
              <tr key={po.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedPO(po)}>
                <td className="px-4 py-3 font-medium text-gray-900 font-mono text-xs">{po.po_number}</td>
                <td className="px-4 py-3 text-gray-700">{po.suppliers?.company_name || '-'}</td>
                <td className="px-4 py-3 text-gray-600 font-mono text-xs">{po.jobs?.job_number || '-'}</td>
                <td className={`px-4 py-3 ${isOverdue(po) ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>{formatDate(po.required_by_date)}{isOverdue(po) ? ' OVERDUE' : ''}</td>
                <td className="px-4 py-3 text-right text-gray-700 font-medium">R {(po.total_value || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${PO_STATUS_BADGE[po.status] || 'bg-gray-100 text-gray-500'}`}>
                    {po.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{po.issued_by || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{formatDate(po.issued_at)}</td>
                <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    {canLogDelivery && (po.status === 'ISSUED' || po.status === 'PARTIALLY_RECEIVED') && (
                      <button onClick={() => setDeliveryPO(po)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors" title="Log Delivery">
                        <Truck size={14} />
                      </button>
                    )}
                    <button onClick={() => setSelectedPO(po)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="View Details">
                      <Eye size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedPO && <PODetailModal po={selectedPO} onClose={() => setSelectedPO(null)} onUpdated={() => { setSelectedPO(null); onRefresh() }} currentRole={currentRole} activeEntity={activeEntity} />}
      {deliveryPO && <LogDeliveryModal po={deliveryPO} onClose={() => setDeliveryPO(null)} onSaved={() => { setDeliveryPO(null); onRefresh() }} currentRole={currentRole} activeEntity={activeEntity} />}
    </div>
  )
}

// PO DETAIL MODAL

function PODetailModal({ po, onClose, onUpdated, currentRole, activeEntity }: { po: PurchaseOrder; onClose: () => void; onUpdated: () => void; currentRole: string | null; activeEntity: OperatingEntity }) {
  const [lineItems, setLineItems] = React.useState<POLineItem[]>([])
  const [loadingLines, setLoadingLines] = React.useState(true)
  const [showCloseModal, setShowCloseModal] = React.useState(false)
  const [closeReason, setCloseReason] = React.useState('')
  const [processing, setProcessing] = React.useState(false)
  const [showDeliveryModal, setShowDeliveryModal] = React.useState(false)
  const [grvHistory, setGrvHistory] = React.useState<any[]>([])
  const [grvExpanded, setGrvExpanded] = React.useState(false)
  const [refreshKey, setRefreshKey] = React.useState(0)

  const loadData = React.useCallback(async () => {
    setLoadingLines(true)
    const [liRes, grvRes] = await Promise.all([
      supabase.from('po_line_items').select('*').eq('po_id', po.id),
      supabase.from('goods_received_vouchers').select('*, grv_line_items(*, po_line_items(description))').eq('po_id', po.id).eq('operating_entity', activeEntity).order('received_at', { ascending: false }),
    ])
    setLineItems(liRes.data || [])
    setGrvHistory(grvRes.data || [])
    setLoadingLines(false)
  }, [po.id])

  React.useEffect(() => {
    loadData()
    // Log view event
    supabase.from('activity_log').insert({
      action_type: 'po_viewed',
      entity_type: 'purchase_order',
      entity_id: po.id,
      operating_entity: (po.operating_entity === 'ERHA_FC' || po.operating_entity === 'ERHA_SS') ? po.operating_entity : activeEntity,
      metadata: { po_number: po.po_number, supplier_name: po.suppliers?.company_name || null, viewed_by: currentRole },
      user_id: currentRole,
    }).then(({ error: logErr }) => { if (logErr) console.error('Activity log error:', logErr.message) })
  }, [po.id, po.po_number, po.suppliers?.company_name, currentRole, loadData, refreshKey])

  const totalOrdered = lineItems.reduce((sum, li) => sum + li.quantity_ordered, 0)
  const totalReceived = lineItems.reduce((sum, li) => sum + li.quantity_received, 0)
  const deliveryPct = totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0

  const today = new Date().toISOString().split('T')[0]
  const isOverdue = po.required_by_date && po.required_by_date < today && po.status !== 'FULLY_RECEIVED' && po.status !== 'CLOSED'

  const canLogDelivery = (currentRole === 'CHARLES' || currentRole === 'HENDRIK') && (po.status === 'ISSUED' || po.status === 'PARTIALLY_RECEIVED')

  const handleDownloadPDF = () => {
    const fmtDate = (d: string | null | undefined) => d ? new Date(d).toLocaleDateString('en-ZA') : '-'
    const liRows = lineItems.map((li, i) =>
      `<tr>
        <td style="border:1px solid #cbd5e1;padding:6px 10px;font-size:9pt">${i + 1}</td>
        <td style="border:1px solid #cbd5e1;padding:6px 10px;font-size:9pt">${li.description}</td>
        <td style="border:1px solid #cbd5e1;padding:6px 10px;font-size:9pt;text-align:center">${li.quantity_ordered}</td>
        <td style="border:1px solid #cbd5e1;padding:6px 10px;font-size:9pt;text-align:center">${li.quantity_received}</td>
        <td style="border:1px solid #cbd5e1;padding:6px 10px;font-size:9pt;text-align:center">${li.uom || '-'}</td>
        <td style="border:1px solid #cbd5e1;padding:6px 10px;font-size:9pt;text-align:right">R ${(li.unit_price || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
        <td style="border:1px solid #cbd5e1;padding:6px 10px;font-size:9pt;text-align:right;font-weight:600">R ${(li.total_price || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
      </tr>`
    ).join('')

    const html = `<!DOCTYPE html><html><head><title>${po.po_number}</title>
<style>
  @page { size:A4; margin:15mm; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1e293b; margin: 0; padding: 20mm; }
  .hdr { display:flex; justify-content:space-between; align-items:center; border-bottom:3px solid #1d3461; padding-bottom:12px; margin-bottom:20px; }
  .hdr-logo { font-size:24pt; font-weight:900; color:#1d3461; letter-spacing:-0.5px; }
  .hdr-logo span { color:#4db848; }
  .hdr-right { text-align:right; }
  .po-title { font-size:14pt; font-weight:700; color:#1d3461; }
  .po-num { font-size:18pt; font-weight:900; color:#4db848; margin-top:2px; }
  .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px; }
  .info-box { background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:10px 14px; }
  .info-label { font-size:8pt; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.05em; }
  .info-val { font-size:10pt; font-weight:600; color:#1d3461; margin-top:3px; }
  table { border-collapse:collapse; width:100%; margin-top:16px; }
  th { background:#1d3461; color:white; padding:8px 10px; font-size:8pt; font-weight:700; text-transform:uppercase; text-align:left; }
  .total-row { background:#f0fdf4; }
  .total-row td { font-weight:700; font-size:10pt; }
  .footer { margin-top:30px; border-top:1px solid #e2e8f0; padding-top:10px; font-size:8pt; color:#94a3b8; display:flex; justify-content:space-between; }
  .print-bar { background:#1d3461; color:white; padding:10px 20px; text-align:center; position:sticky; top:0; z-index:100; }
  .print-btn { background:#4db848; color:white; border:none; padding:8px 24px; font-size:11pt; font-weight:bold; border-radius:6px; cursor:pointer; margin:0 6px; }
  .close-btn { background:#dc2626; color:white; border:none; padding:8px 24px; font-size:11pt; font-weight:bold; border-radius:6px; cursor:pointer; margin:0 6px; }
  @media print { .print-bar{display:none} body{padding:0} }
</style></head><body>
<div class="print-bar">
  <button class="print-btn" onclick="window.print()">💾 Save as PDF</button>
  <button class="print-btn" style="background:#2563eb" onclick="window.print()">🖨️ Print</button>
  <button class="close-btn" onclick="window.close()">✕ Close</button>
</div>
<div class="hdr">
  <div>
    <div class="hdr-logo">ERHA<span>.</span> FABRICATION</div>
    <div style="font-size:8pt;color:#64748b;margin-top:2px">ERHA Fabrication & Construction (Pty) Ltd</div>
  </div>
  <div class="hdr-right">
    <div class="po-title">PURCHASE ORDER</div>
    <div class="po-num">${po.po_number}</div>
    <div style="font-size:9pt;color:#64748b;margin-top:4px">Date: ${fmtDate(po.issued_at)}</div>
  </div>
</div>
<div class="info-grid">
  <div class="info-box">
    <div class="info-label">Supplier</div>
    <div class="info-val">${po.suppliers?.company_name || '-'}</div>
    ${po.suppliers?.contact_person ? `<div style="font-size:9pt;color:#475569;margin-top:3px">Contact: ${po.suppliers.contact_person}</div>` : ''}
    ${po.suppliers?.phone ? `<div style="font-size:9pt;color:#475569">Tel: ${po.suppliers.phone}</div>` : ''}
    ${po.suppliers?.email ? `<div style="font-size:9pt;color:#475569">Email: ${po.suppliers.email}</div>` : ''}
    ${po.suppliers?.account_number ? `<div style="font-size:9pt;color:#475569">Account: ${po.suppliers.account_number}</div>` : ''}
  </div>
  <div class="info-box">
    <div class="info-label">Job Reference</div>
    <div class="info-val">${po.jobs?.job_number || '-'}</div>
    ${po.jobs?.description ? `<div style="font-size:9pt;color:#475569;margin-top:3px">${po.jobs.description}</div>` : ''}
    <div style="margin-top:8px"><div class="info-label">Required By</div><div class="info-val" ${isOverdue ? 'style="color:#ef4444"' : ''}>${fmtDate(po.required_by_date)}${isOverdue ? ' — OVERDUE' : ''}</div></div>
    ${po.purchase_requests?.pr_number ? `<div style="margin-top:8px"><div class="info-label">Linked PR</div><div class="info-val">${po.purchase_requests.pr_number}</div></div>` : ''}
  </div>
</div>
<div style="font-size:9pt;font-weight:700;color:#1d3461;margin-bottom:4px">ORDER ITEMS</div>
<table>
  <thead><tr>
    <th style="width:30px">#</th><th>Description</th><th style="text-align:center;width:70px">Qty</th><th style="text-align:center;width:70px">Received</th><th style="text-align:center;width:60px">UOM</th><th style="text-align:right;width:90px">Unit Price</th><th style="text-align:right;width:100px">Total</th>
  </tr></thead>
  <tbody>
    ${liRows}
    <tr class="total-row">
      <td colspan="6" style="border:1px solid #cbd5e1;padding:8px 10px;text-align:right">TOTAL VALUE</td>
      <td style="border:1px solid #cbd5e1;padding:8px 10px;text-align:right;color:#1d3461">R ${(po.total_value || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
    </tr>
  </tbody>
</table>
<div style="margin-top:24px;display:grid;grid-template-columns:1fr 1fr;gap:20px">
  <div><div style="border-bottom:1px solid #1d3461;padding-bottom:30px;font-size:8pt;color:#64748b">Authorised Signature</div></div>
  <div><div style="border-bottom:1px solid #1d3461;padding-bottom:30px;font-size:8pt;color:#64748b">Date</div></div>
</div>
<div class="footer">
  <div>Issued by: ${po.issued_by || '-'} | Status: ${po.status.replace(/_/g, ' ')}</div>
  <div>ERHA Fabrication & Construction (Pty) Ltd — Confidential</div>
</div>
</body></html>`

    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close() }

    // Log download event
    supabase.from('activity_log').insert({
      action_type: 'po_downloaded',
      entity_type: 'purchase_order',
      entity_id: po.id,
      operating_entity: (po.operating_entity === 'ERHA_FC' || po.operating_entity === 'ERHA_SS') ? po.operating_entity : activeEntity,
      metadata: { po_number: po.po_number, downloaded_by: currentRole },
      user_id: currentRole,
    }).then(({ error: logErr }) => { if (logErr) console.error('Activity log error:', logErr.message) })
  }

  const handleClosePO = async () => {
    if (!closeReason.trim()) { alert('Please provide a reason for closing this PO'); return }
    setProcessing(true)
    try {
      const { error } = await supabase.from('purchase_orders').update({ status: 'CLOSED' }).eq('id', po.id)
      if (error) throw error

      await supabase.from('activity_log').insert({
        action_type: 'po_closed',
        entity_type: 'purchase_order',
        entity_id: po.id,
        operating_entity: (po.operating_entity === 'ERHA_FC' || po.operating_entity === 'ERHA_SS') ? po.operating_entity : activeEntity,
        metadata: { po_number: po.po_number, reason: closeReason.trim(), closed_by: currentRole },
        user_id: currentRole,
      }).then(({ error: logErr }) => { if (logErr) console.error('Activity log error:', logErr.message) })

      onUpdated()
    } catch (e: any) { alert('Error: ' + e.message); setProcessing(false) }
  }

  const qtyColor = (ordered: number, received: number) => {
    if (received >= ordered) return 'text-green-700 font-semibold'
    if (received > 0) return 'text-amber-600 font-semibold'
    return 'text-gray-400'
  }

  const canClose = currentRole === 'HENDRIK' && po.status !== 'CLOSED'

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <ShoppingCart size={20} className="text-gray-400" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">{po.po_number}</h2>
              <p className="text-xs text-gray-500">Issued {formatDate(po.issued_at)} by {po.issued_by || 'System'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${PO_STATUS_BADGE[po.status] || 'bg-gray-100 text-gray-500'}`}>
              {po.status.replace(/_/g, ' ')}
            </span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* PO details */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Supplier</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{po.suppliers?.company_name || '-'}</p>
              {po.suppliers?.contact_person && <p className="text-xs text-gray-500">{po.suppliers.contact_person}{po.suppliers.phone ? ` · ${po.suppliers.phone}` : ''}</p>}
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Job Reference</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{po.jobs?.job_number || '-'}{po.jobs?.description ? ` — ${po.jobs.description}` : ''}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Required By</p>
              <p className={`text-sm mt-0.5 ${isOverdue ? 'text-red-600 font-bold' : 'text-gray-700'}`}>{formatDate(po.required_by_date)}{isOverdue ? ' — OVERDUE' : ''}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Value</p>
              <p className="text-sm font-bold text-green-700 mt-0.5">R {(po.total_value || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</p>
            </div>
            {po.purchase_requests?.pr_number && (
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Linked Purchase Request</p>
                <p className="text-sm font-medium text-blue-600 mt-0.5">{po.purchase_requests.pr_number}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Last Status Change</p>
              <p className="text-sm text-gray-700 mt-0.5">{formatDate(po.updated_at)}</p>
            </div>
          </div>

          {/* Delivery progress */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Delivery Progress</p>
              <p className="text-xs font-bold text-gray-700">{deliveryPct}%</p>
            </div>
            <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: '#1d3461' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${deliveryPct}%`, background: '#4db848' }} />
            </div>
            <p className="text-xs text-gray-500 mt-1">{totalReceived} of {totalOrdered} items received</p>
          </div>

          {/* Line items */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Order Line Items</p>
            {loadingLines ? (
              <div className="text-center py-6 text-gray-400 text-sm">Loading line items...</div>
            ) : (
              <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">#</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Description</th>
                      <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">Ordered</th>
                      <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">Received</th>
                      <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">UOM</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">Unit Price</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {lineItems.map((li, i) => (
                      <tr key={li.id}>
                        <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                        <td className="px-3 py-2 text-gray-900">{li.description}</td>
                        <td className="px-3 py-2 text-center text-gray-700">{li.quantity_ordered}</td>
                        <td className={`px-3 py-2 text-center ${qtyColor(li.quantity_ordered, li.quantity_received)}`}>{li.quantity_received}</td>
                        <td className="px-3 py-2 text-center text-gray-500">{li.uom || '-'}</td>
                        <td className="px-3 py-2 text-right text-gray-700">R {(li.unit_price || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900">R {(li.total_price || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-end px-4 py-3 bg-white border-t border-gray-200">
                  <div className="text-sm font-bold text-gray-900">
                    Total: <span className="text-green-700">R {(po.total_value || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* GRV Delivery History */}
          <div>
            <button onClick={() => setGrvExpanded(!grvExpanded)} className="flex items-center gap-2 w-full text-left">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Delivery History ({grvHistory.length})</p>
              {grvExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
            </button>
            {grvExpanded && (
              <div className="mt-2 space-y-2">
                {grvHistory.length === 0 ? (
                  <p className="text-sm text-gray-400 py-3 text-center">No deliveries recorded yet</p>
                ) : grvHistory.map((grv: any) => (
                  <div key={grv.id} className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Truck size={14} className="text-green-600" />
                        <span className="text-sm font-semibold text-gray-900">{formatDate(grv.received_at)}</span>
                        <span className="text-xs text-gray-500">by {grv.received_by || 'Unknown'}</span>
                      </div>
                    </div>
                    {grv.notes && <p className="text-xs text-gray-600 mb-2 italic">{grv.notes}</p>}
                    <div className="space-y-1">
                      {(grv.grv_line_items || []).map((gli: any) => (
                        <div key={gli.id} className="flex items-center gap-3 text-xs">
                          <span className="text-gray-700 flex-1">{gli.po_line_items?.description || 'Item'}</span>
                          <span className="font-medium text-gray-900">Qty: {gli.quantity_received}</span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold ${
                            gli.condition === 'GOOD' ? 'bg-green-100 text-green-700' :
                            gli.condition === 'DAMAGED' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>{gli.condition}</span>
                          {gli.notes && <span className="text-gray-400 italic">{gli.notes}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div className="flex items-center gap-2">
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 bg-[#1d3461] text-white text-sm font-semibold rounded-lg hover:bg-[#162850] transition-colors">
              <Download size={14} />Download PDF
            </button>
            {canLogDelivery && (
              <button onClick={() => setShowDeliveryModal(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors">
                <Truck size={14} />Log Delivery
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium">Close</button>
            {canClose && !showCloseModal && (
              <button onClick={() => setShowCloseModal(true)} className="px-4 py-2 bg-gray-600 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 transition-colors">
                Close PO
              </button>
            )}
          </div>
        </div>

        {/* Close PO confirmation */}
        {showCloseModal && (
          <div className="px-6 py-4 border-t border-gray-300 bg-gray-100 rounded-b-xl">
            <p className="text-sm text-gray-800 font-medium mb-2">Reason for closing PO <span className="text-red-500">*</span></p>
            <textarea value={closeReason} onChange={e => setCloseReason(e.target.value)} rows={2} placeholder="Provide a reason for closing this purchase order..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 resize-none mb-3" />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowCloseModal(false); setCloseReason('') }} disabled={processing} className="px-4 py-2 text-sm text-gray-600 font-medium">Cancel</button>
              <button onClick={handleClosePO} disabled={processing || !closeReason.trim()} className="px-6 py-2 bg-gray-700 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors">
                {processing ? 'Closing...' : 'Confirm Close PO'}
              </button>
            </div>
          </div>
        )}
      </div>

      {showDeliveryModal && <LogDeliveryModal po={po} onClose={() => setShowDeliveryModal(false)} onSaved={() => { setShowDeliveryModal(false); setRefreshKey(k => k + 1) }} currentRole={currentRole} activeEntity={activeEntity} />}
    </div>
  )
}

// LOG DELIVERY (GRV) MODAL

const CONDITION_BADGE: Record<string, string> = {
  GOOD: 'bg-green-100 text-green-700',
  DAMAGED: 'bg-red-100 text-red-700',
  SHORT: 'bg-amber-100 text-amber-700',
}

function LogDeliveryModal({ po, onClose, onSaved, currentRole, activeEntity }: { po: PurchaseOrder; onClose: () => void; onSaved: () => void; currentRole: string | null; activeEntity: OperatingEntity }) {
  const [poLineItems, setPoLineItems] = React.useState<POLineItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [deliveryNotes, setDeliveryNotes] = React.useState('')
  const [receiptLines, setReceiptLines] = React.useState<Array<{
    po_line_item_id: string
    description: string
    qty_ordered: number
    qty_previously_received: number
    qty_remaining: number
    qty_now: number
    condition: string
    notes: string
  }>>([])
  const [successMsg, setSuccessMsg] = React.useState('')

  React.useEffect(() => {
    setLoading(true)
    supabase.from('po_line_items').select('*').eq('po_id', po.id).then(({ data }) => {
      const items = data || []
      setPoLineItems(items)
      setReceiptLines(items.map(li => ({
        po_line_item_id: li.id,
        description: li.description,
        qty_ordered: li.quantity_ordered,
        qty_previously_received: li.quantity_received,
        qty_remaining: Math.max(0, li.quantity_ordered - li.quantity_received),
        qty_now: Math.max(0, li.quantity_ordered - li.quantity_received),
        condition: 'GOOD',
        notes: '',
      })))
      setLoading(false)
    })
  }, [po.id])

  const updateLine = (i: number, field: string, value: any) =>
    setReceiptLines(lines => lines.map((l, idx) => idx === i ? { ...l, [field]: value } : l))

  const totalReceivingNow = receiptLines.reduce((sum, l) => sum + l.qty_now, 0)

  const handleSave = async () => {
    if (totalReceivingNow <= 0) { alert('Nothing to receive — enter quantities for at least one line item'); return }
    setSaving(true)
    try {
      // 1. Insert GRV
      const { data: grv, error: grvErr } = await supabase.from('goods_received_vouchers').insert({
        operating_entity: (po.operating_entity === 'ERHA_FC' || po.operating_entity === 'ERHA_SS') ? po.operating_entity : activeEntity,
        po_id: po.id,
        received_by: currentRole,
        received_at: new Date().toISOString(),
        notes: deliveryNotes.trim() || null,
      }).select('id').single()
      if (grvErr) throw grvErr

      // 2. Insert GRV line items
      const grvLines = receiptLines.filter(l => l.qty_now > 0)
      if (grvLines.length > 0) {
        const { error: gliErr } = await supabase.from('grv_line_items').insert(
          grvLines.map(l => ({
            grv_id: grv.id,
            po_line_item_id: l.po_line_item_id,
            quantity_received: l.qty_now,
            condition: l.condition,
            notes: l.notes.trim() || null,
          }))
        )
        if (gliErr) console.error('GRV line items error:', gliErr.message)
      }

      // 3. Update po_line_items.quantity_received
      for (const l of grvLines) {
        const newQtyReceived = l.qty_previously_received + l.qty_now
        await supabase.from('po_line_items').update({ quantity_received: newQtyReceived }).eq('id', l.po_line_item_id)
      }

      // 4. Determine new PO status
      const updatedLines = receiptLines.map(l => ({
        ordered: l.qty_ordered,
        received: l.qty_previously_received + l.qty_now,
      }))
      const allFullyReceived = updatedLines.every(l => l.received >= l.ordered)
      const someReceived = updatedLines.some(l => l.received > 0)
      const newStatus = allFullyReceived ? 'FULLY_RECEIVED' : someReceived ? 'PARTIALLY_RECEIVED' : po.status
      if (newStatus !== po.status) {
        await supabase.from('purchase_orders').update({ status: newStatus }).eq('id', po.id)
      }

      // 5. Stock matching — fuzzy match on item_name
      const { data: stockItems } = await supabase.from('stock_items').select('id, item_name, current_quantity').eq('is_active', true).eq('operating_entity', activeEntity)
      const allStock = stockItems || []
      for (const l of grvLines) {
        const descLower = l.description.toLowerCase().trim()
        const match = allStock.find(s => s.item_name.toLowerCase().trim() === descLower)
        if (match) {
          const newQty = (match.current_quantity || 0) + l.qty_now
          await supabase.from('stock_items').update({ current_quantity: newQty }).eq('id', match.id)
          await supabase.from('stock_transactions').insert({
            operating_entity: (po.operating_entity === 'ERHA_FC' || po.operating_entity === 'ERHA_SS') ? po.operating_entity : activeEntity,
            stock_item_id: match.id,
            transaction_type: 'RECEIPT_PO',
            reference_id: po.id,
            reference_type: 'purchase_order',
            quantity_change: l.qty_now,
            quantity_before: match.current_quantity || 0,
            quantity_after: newQty,
            unit_price: poLineItems.find(p => p.id === l.po_line_item_id)?.unit_price || 0,
            job_id: po.job_id,
            grv_id: grv.id,
            transacted_by: currentRole,
            notes: `PO ${po.po_number} delivery receipt`,
          })
        }
      }

      // 6. ML activity log — GRV logged
      await supabase.from('activity_log').insert({
        action_type: 'grv_logged',
        entity_type: 'goods_received_voucher',
        entity_id: grv.id,
        operating_entity: (po.operating_entity === 'ERHA_FC' || po.operating_entity === 'ERHA_SS') ? po.operating_entity : activeEntity,
        metadata: {
          po_number: po.po_number,
          supplier_name: po.suppliers?.company_name || null,
          line_items_received: grvLines.length,
          total_qty_received: totalReceivingNow,
          received_by: currentRole,
          new_po_status: newStatus,
        },
        user_id: currentRole,
      }).then(({ error: logErr }) => { if (logErr) console.error('Activity log error:', logErr.message) })

      // 7. ML activity log — discrepancy events
      for (const l of grvLines) {
        if (l.condition === 'DAMAGED' || l.condition === 'SHORT') {
          await supabase.from('activity_log').insert({
            action_type: 'delivery_discrepancy_flagged',
            entity_type: 'goods_received_voucher',
            entity_id: grv.id,
            operating_entity: (po.operating_entity === 'ERHA_FC' || po.operating_entity === 'ERHA_SS') ? po.operating_entity : activeEntity,
            metadata: {
              po_number: po.po_number,
              po_line_item_id: l.po_line_item_id,
              description: l.description,
              condition: l.condition,
              qty_received: l.qty_now,
              qty_ordered: l.qty_ordered,
              flagged_by: currentRole,
            },
            user_id: currentRole,
          }).then(({ error: logErr }) => { if (logErr) console.error('Activity log error:', logErr.message) })
        }
      }

      setSuccessMsg('Delivery logged successfully — GRV recorded')
      setTimeout(() => onSaved(), 1200)
    } catch (e: any) { alert('Error: ' + e.message); setSaving(false) }
  }

  if (loading) return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center">
      <div className="bg-white rounded-xl p-8 text-center">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading PO line items...</p>
      </div>
    </div>
  )

  if (successMsg) return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center">
      <div className="bg-white rounded-xl p-8 text-center shadow-2xl">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle size={24} className="text-green-600" />
        </div>
        <p className="text-sm font-semibold text-green-700">{successMsg}</p>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-start justify-center overflow-y-auto py-8">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Truck size={20} className="text-green-600" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">Log Goods Received — {po.po_number}</h2>
              <p className="text-xs text-gray-500">{po.suppliers?.company_name || 'Supplier'} · {po.jobs?.job_number || 'Job'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Description</th>
                  <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 w-16">Ordered</th>
                  <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 w-20">Prev Rcvd</th>
                  <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 w-20">Remaining</th>
                  <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 w-24">Qty Now</th>
                  <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 w-28">Condition</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 w-36">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {receiptLines.map((line, i) => (
                  <tr key={line.po_line_item_id} className={line.qty_remaining <= 0 ? 'opacity-50' : ''}>
                    <td className="px-3 py-2 text-gray-900">{line.description}</td>
                    <td className="px-3 py-2 text-center text-gray-700">{line.qty_ordered}</td>
                    <td className="px-3 py-2 text-center text-gray-500">{line.qty_previously_received}</td>
                    <td className="px-3 py-2 text-center font-medium text-gray-700">{line.qty_remaining}</td>
                    <td className="px-2 py-1.5">
                      <input type="number" value={line.qty_now} min={0} max={line.qty_remaining} step="0.01"
                        onChange={e => updateLine(i, 'qty_now', Math.min(parseFloat(e.target.value) || 0, line.qty_remaining))}
                        disabled={line.qty_remaining <= 0}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-100" />
                    </td>
                    <td className="px-2 py-1.5">
                      <select value={line.condition} onChange={e => updateLine(i, 'condition', e.target.value)}
                        disabled={line.qty_remaining <= 0}
                        className="w-full border border-gray-300 rounded px-1 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-100">
                        <option value="GOOD">GOOD</option>
                        <option value="DAMAGED">DAMAGED</option>
                        <option value="SHORT">SHORT</option>
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="text" value={line.notes} onChange={e => updateLine(i, 'notes', e.target.value)}
                        placeholder="Optional" disabled={line.qty_remaining <= 0}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-100" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Delivery Notes (overall)</label>
            <textarea value={deliveryNotes} onChange={e => setDeliveryNotes(e.target.value)} rows={2} placeholder="General notes about this delivery..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
          </div>

          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <span className="text-sm text-green-800 font-medium">Total receiving this delivery:</span>
            <span className="text-sm font-bold text-green-700">{totalReceivingNow} items</span>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium">Cancel</button>
          <button onClick={handleSave} disabled={saving || totalReceivingNow <= 0}
            className="px-6 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2">
            <Truck size={14} />{saving ? 'Logging...' : 'Log Receipt'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ADD SUPPLIER MODAL

function AddSupplierModal({ onClose, onCreated, currentRole }: { onClose: () => void; onCreated: () => void; currentRole: string | null }) {
  const { activeEntity } = useEntity()
  const [saving, setSaving] = React.useState(false)
  const [form, setForm] = React.useState({
    company_name: '',
    contact_person: '',
    phone: '',
    email: '',
    account_number: '',
    payment_terms: '',
  })

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }))

  const handleSave = async () => {
    if (!form.company_name.trim()) { alert('Company Name is required'); return }
    setSaving(true)
    try {
      const { data, error } = await supabase.from('suppliers').insert({
        company_name: form.company_name.trim(),
        contact_person: form.contact_person.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        account_number: form.account_number.trim() || null,
        payment_terms: form.payment_terms.trim() || null,
        is_active: true,
      }).select('id').single()
      if (error) throw error

      await supabase.from('activity_log').insert({
        action_type: 'supplier_added',
        entity_type: 'supplier',
        entity_id: data.id,
        operating_entity: activeEntity,
        metadata: {
          company_name: form.company_name.trim(),
          account_number: form.account_number.trim() || null,
          added_by: currentRole,
        },
        user_id: currentRole,
      }).then(({ error: logErr }) => { if (logErr) console.error('Activity log error:', logErr.message) })

      onCreated()
      onClose()
    } catch (e: any) { alert('Error: ' + e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Add Supplier</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Company Name <span className="text-red-500">*</span></label>
            <input type="text" value={form.company_name} onChange={e => set('company_name', e.target.value)} placeholder="Enter company name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Contact Person</label>
              <input type="text" value={form.contact_person} onChange={e => set('contact_person', e.target.value)} placeholder="Name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              <input type="text" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="Phone number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@company.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Account Number</label>
              <input type="text" value={form.account_number} onChange={e => set('account_number', e.target.value)} placeholder="Supplier account no."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Payment Terms</label>
              <input type="text" value={form.payment_terms} onChange={e => set('payment_terms', e.target.value)} placeholder="e.g. 30 days"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
            {saving ? 'Saving...' : 'Add Supplier'}
          </button>
        </div>
      </div>
    </div>
  )
}

// EDIT SUPPLIER MODAL

function EditSupplierModal({ supplier, onClose, onUpdated, currentRole }: { supplier: Supplier; onClose: () => void; onUpdated: () => void; currentRole: string | null }) {
  const { activeEntity } = useEntity()
  const [saving, setSaving] = React.useState(false)
  const [form, setForm] = React.useState({
    company_name: supplier.company_name || '',
    contact_person: supplier.contact_person || '',
    phone: supplier.phone || '',
    email: supplier.email || '',
    account_number: supplier.account_number || '',
    payment_terms: supplier.payment_terms || '',
  })

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }))

  const handleSave = async () => {
    if (!form.company_name.trim()) { alert('Company Name is required'); return }
    setSaving(true)
    try {
      const changes: { field: string; old_value: string | null; new_value: string | null }[] = []
      const original: Record<string, string | null> = {
        company_name: supplier.company_name,
        contact_person: supplier.contact_person,
        phone: supplier.phone,
        email: supplier.email,
        account_number: supplier.account_number,
        payment_terms: supplier.payment_terms,
      }
      for (const key of Object.keys(form)) {
        const oldVal = original[key] || ''
        const newVal = (form as any)[key]?.trim() || ''
        if (oldVal !== newVal) {
          changes.push({ field: key, old_value: original[key], new_value: newVal || null })
        }
      }

      if (changes.length === 0) { onClose(); return }

      const { error } = await supabase.from('suppliers').update({
        company_name: form.company_name.trim(),
        contact_person: form.contact_person.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        account_number: form.account_number.trim() || null,
        payment_terms: form.payment_terms.trim() || null,
      }).eq('id', supplier.id)
      if (error) throw error

      await supabase.from('activity_log').insert({
        action_type: 'supplier_updated',
        entity_type: 'supplier',
        entity_id: supplier.id,
        operating_entity: activeEntity,
        metadata: {
          changes,
          updated_by: currentRole,
        },
        user_id: currentRole,
      }).then(({ error: logErr }) => { if (logErr) console.error('Activity log error:', logErr.message) })

      onUpdated()
      onClose()
    } catch (e: any) { alert('Error: ' + e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Edit Supplier</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Company Name <span className="text-red-500">*</span></label>
            <input type="text" value={form.company_name} onChange={e => set('company_name', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Contact Person</label>
              <input type="text" value={form.contact_person} onChange={e => set('contact_person', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              <input type="text" value={form.phone} onChange={e => set('phone', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Account Number</label>
              <input type="text" value={form.account_number} onChange={e => set('account_number', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Payment Terms</label>
              <input type="text" value={form.payment_terms} onChange={e => set('payment_terms', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// DEACTIVATE SUPPLIER MODAL

function DeactivateSupplierModal({ supplier, onClose, onDeactivated, currentRole }: { supplier: Supplier; onClose: () => void; onDeactivated: () => void; currentRole: string | null }) {
  const { activeEntity } = useEntity()
  const [saving, setSaving] = React.useState(false)
  const [reason, setReason] = React.useState('')

  const handleDeactivate = async () => {
    if (!reason.trim()) { alert('Please provide a reason for deactivation'); return }
    setSaving(true)
    try {
      const { error } = await supabase.from('suppliers').update({
        is_active: false,
        deactivation_reason: reason.trim(),
      }).eq('id', supplier.id)
      if (error) throw error

      await supabase.from('activity_log').insert({
        action_type: 'supplier_deactivated',
        entity_type: 'supplier',
        entity_id: supplier.id,
        operating_entity: activeEntity,
        metadata: {
          company_name: supplier.company_name,
          reason: reason.trim(),
          deactivated_by: currentRole,
        },
        user_id: currentRole,
      }).then(({ error: logErr }) => { if (logErr) console.error('Activity log error:', logErr.message) })

      onDeactivated()
      onClose()
    } catch (e: any) { alert('Error: ' + e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center py-8">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Deactivate Supplier</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700 font-medium">You are about to deactivate:</p>
            <p className="text-sm text-red-900 font-bold mt-1">{supplier.company_name}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Reason for Deactivation <span className="text-red-500">*</span></label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Provide a reason for deactivating this supplier..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium">Cancel</button>
          <button onClick={handleDeactivate} disabled={saving || !reason.trim()} className="px-6 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
            {saving ? 'Deactivating...' : 'Deactivate Supplier'}
          </button>
        </div>
      </div>
    </div>
  )
}

// INVOICES TAB

const INVOICE_STATUS_BADGE: Record<string, string> = {
  CAPTURED: 'bg-yellow-100 text-yellow-700',
  MATCHED: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-green-100 text-green-700',
  PAID: 'bg-emerald-100 text-emerald-700',
  DISPUTED: 'bg-red-100 text-red-700',
}

function InvoicesTab({ invoices, loading, onRefresh, currentRole }: { invoices: SupplierInvoice[]; loading: boolean; onRefresh: () => void; currentRole: string | null }) {
  const [searchTerm, setSearchTerm] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL')

  const filtered = React.useMemo(() => {
    let result = [...invoices]
    if (statusFilter !== 'ALL') result = result.filter(inv => inv.status === statusFilter)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      result = result.filter(inv =>
        inv.invoice_number?.toLowerCase().includes(term) ||
        inv.suppliers?.company_name?.toLowerCase().includes(term) ||
        inv.purchase_orders?.po_number?.toLowerCase().includes(term))
    }
    return result
  }, [invoices, statusFilter, searchTerm])

  if (loading) return <div className="flex items-center justify-center h-64 gap-3 text-gray-400"><div className="w-5 h-5 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin" /><span>Loading invoices...</span></div>

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-lg font-bold text-gray-900">Supplier Invoices</h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">{invoices.length} total</span>
        </div>
        <p className="text-sm text-gray-500">Invoices received from suppliers against purchase orders</p>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by invoice number, supplier or PO..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="ALL">All Statuses</option>
          <option value="CAPTURED">Captured</option>
          <option value="MATCHED">Matched</option>
          <option value="APPROVED">Approved</option>
          <option value="PAID">Paid</option>
          <option value="DISPUTED">Disputed</option>
        </select>
        <button onClick={onRefresh} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300">
          <RefreshCw size={14} />Refresh
        </button>
      </div>

      <div className="flex-1 overflow-auto bg-white rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice #</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Supplier</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">PO Ref</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice Date</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Value</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment Due</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Captured By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                {searchTerm || statusFilter !== 'ALL' ? 'No invoices match your filter' : 'No invoices captured yet.'}
              </td></tr>
            ) : filtered.map(inv => (
              <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900 font-mono text-xs">{inv.invoice_number}</td>
                <td className="px-4 py-3 text-gray-700">{inv.suppliers?.company_name || '-'}</td>
                <td className="px-4 py-3 text-gray-600 font-mono text-xs">{inv.purchase_orders?.po_number || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{formatDate(inv.invoice_date)}</td>
                <td className="px-4 py-3 text-right text-gray-700 font-medium">R {(inv.invoice_value || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-3 text-gray-600">{formatDate(inv.payment_due_date)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${INVOICE_STATUS_BADGE[inv.status] || 'bg-gray-100 text-gray-500'}`}>
                    {inv.status?.replace(/_/g, ' ') || '-'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{inv.captured_by || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// SETTINGS PAGE
// ═══════════════════════════════════════════════════════════════

interface SystemDropdown {
  id: string
  dropdown_type: string
  option_value: string
  option_label: string
  sort_order: number
  is_active: boolean
}

const DROPDOWN_TYPES: { key: string; label: string }[] = [
  { key: 'media_received', label: 'Media Received' },
  { key: 'departments', label: 'Departments' },
  { key: 'action_types', label: 'Action Types' },
]

function SettingsPage() {
  const [settingsTab, setSettingsTab] = React.useState<'dropdowns'>('dropdowns')

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-1 mb-4 border-b border-gray-200">
        <button onClick={() => setSettingsTab('dropdowns')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${settingsTab === 'dropdowns' ? 'border-green-500 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          Dropdown Management
        </button>
      </div>
      {settingsTab === 'dropdowns' && <DropdownManagementTab />}
    </div>
  )
}

function DropdownManagementTab() {
  const { activeEntity } = useEntity()
  const [selectedType, setSelectedType] = React.useState(DROPDOWN_TYPES[0].key)
  const [options, setOptions] = React.useState<SystemDropdown[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showAddModal, setShowAddModal] = React.useState(false)
  const [editingOption, setEditingOption] = React.useState<SystemDropdown | null>(null)

  const fetchOptions = React.useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('system_dropdowns').select('*').eq('dropdown_type', selectedType).order('sort_order')
      if (error) throw error
      setOptions(data || [])
    } catch (e: any) { console.error('Failed to fetch dropdown options:', e.message) }
    finally { setLoading(false) }
  }, [selectedType])

  React.useEffect(() => { fetchOptions() }, [fetchOptions])

  const handleMoveUp = async (opt: SystemDropdown, idx: number) => {
    if (idx === 0) return
    const prev = options[idx - 1]
    await supabase.from('system_dropdowns').update({ sort_order: prev.sort_order }).eq('id', opt.id)
    await supabase.from('system_dropdowns').update({ sort_order: opt.sort_order }).eq('id', prev.id)
    fetchOptions()
  }

  const handleMoveDown = async (opt: SystemDropdown, idx: number) => {
    if (idx >= options.length - 1) return
    const next = options[idx + 1]
    await supabase.from('system_dropdowns').update({ sort_order: next.sort_order }).eq('id', opt.id)
    await supabase.from('system_dropdowns').update({ sort_order: opt.sort_order }).eq('id', next.id)
    fetchOptions()
  }

  const handleDeactivate = async (opt: SystemDropdown) => {
    if (!confirm('Deactivate "' + opt.option_label + '"? It will no longer appear in dropdowns across the app.')) return
    try {
      const { error } = await supabase.from('system_dropdowns').update({ is_active: false }).eq('id', opt.id)
      if (error) throw error
      await supabase.from('activity_log').insert({
        action_type: 'dropdown_option_deactivated', entity_type: 'system_dropdown', entity_id: opt.id,
        operating_entity: activeEntity,
        metadata: { dropdown_type: opt.dropdown_type, option_label: opt.option_label, deactivated_by: 'user', deactivated_at: new Date().toISOString() },
      }).then(({ error: logErr }) => { if (logErr) console.error('Activity log error:', logErr.message) })
      fetchOptions()
    } catch (err: any) { alert('Error: ' + err.message) }
  }

  const handleReactivate = async (opt: SystemDropdown) => {
    try {
      const { error } = await supabase.from('system_dropdowns').update({ is_active: true }).eq('id', opt.id)
      if (error) throw error
      fetchOptions()
    } catch (err: any) { alert('Error: ' + err.message) }
  }

  const selectedLabel = DROPDOWN_TYPES.find(t => t.key === selectedType)?.label || selectedType

  return (
    <div className="flex-1 flex gap-6 min-h-0">
      <div className="w-56 shrink-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Dropdown Types</p>
        <div className="space-y-1">
          {DROPDOWN_TYPES.map(t => (
            <button key={t.key} onClick={() => setSelectedType(t.key)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${selectedType === t.key ? 'bg-[#1d3461] text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{selectedLabel}</h2>
            <p className="text-sm text-gray-500">Manage options for the {selectedLabel} dropdown</p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#4db848] hover:bg-[#3fa63b] text-white text-sm font-semibold rounded-lg transition-colors">
            <Plus size={15} />Add Option
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 gap-3 text-gray-400"><div className="w-5 h-5 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin" /><span>Loading...</span></div>
        ) : (
          <div className="flex-1 overflow-auto bg-white rounded-xl border border-gray-200 shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Label</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Value</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {options.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">No options configured. Add your first option.</td></tr>
                ) : options.map((opt, idx) => (
                  <tr key={opt.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{opt.option_label}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{opt.option_value}</td>
                    <td className="px-4 py-3 text-gray-500">{opt.sort_order}</td>
                    <td className="px-4 py-3">
                      {opt.is_active
                        ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">ACTIVE</span>
                        : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">INACTIVE</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleMoveUp(opt, idx)} disabled={idx === 0} className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 rounded transition-colors" title="Move up">
                          <ChevronUp size={14} />
                        </button>
                        <button onClick={() => handleMoveDown(opt, idx)} disabled={idx >= options.length - 1} className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 rounded transition-colors" title="Move down">
                          <ChevronDown size={14} />
                        </button>
                        <button onClick={() => setEditingOption(opt)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit">
                          <Edit3 size={14} />
                        </button>
                        {opt.is_active ? (
                          <button onClick={() => handleDeactivate(opt)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Deactivate">
                            <XCircle size={14} />
                          </button>
                        ) : (
                          <button onClick={() => handleReactivate(opt)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors" title="Reactivate">
                            <CheckCircle size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && <AddDropdownOptionModal dropdownType={selectedType} dropdownLabel={selectedLabel} existingCount={options.length} onClose={() => setShowAddModal(false)} onAdded={() => { setShowAddModal(false); fetchOptions() }} />}
      {editingOption && <EditDropdownOptionModal option={editingOption} onClose={() => setEditingOption(null)} onUpdated={() => { setEditingOption(null); fetchOptions() }} />}
    </div>
  )
}

function AddDropdownOptionModal({ dropdownType, dropdownLabel, existingCount, onClose, onAdded }: { dropdownType: string; dropdownLabel: string; existingCount: number; onClose: () => void; onAdded: () => void }) {
  const { activeEntity } = useEntity()
  const [saving, setSaving] = React.useState(false)
  const [label, setLabel] = React.useState('')
  const [value, setValue] = React.useState('')
  const [sortOrder, setSortOrder] = React.useState(existingCount + 1)
  const [autoValue, setAutoValue] = React.useState(true)

  const handleLabelChange = (v: string) => {
    setLabel(v)
    if (autoValue) setValue(v.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''))
  }

  const handleSave = async () => {
    if (!label.trim()) { alert('Label is required'); return }
    if (!value.trim()) { alert('Value is required'); return }
    setSaving(true)
    try {
      const { data, error } = await supabase.from('system_dropdowns').insert({
        dropdown_type: dropdownType, option_value: value.trim(), option_label: label.trim(), sort_order: sortOrder, is_active: true,
      }).select().single()
      if (error) throw error
      await supabase.from('activity_log').insert({
        action_type: 'dropdown_option_added', entity_type: 'system_dropdown', entity_id: data.id,
        operating_entity: activeEntity,
        metadata: { dropdown_type: dropdownType, option_label: label.trim(), option_value: value.trim(), added_by: 'user', added_at: new Date().toISOString() },
      }).then(({ error: logErr }) => { if (logErr) console.error('Activity log error:', logErr.message) })
      onAdded()
    } catch (err: any) { alert('Error: ' + err.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="bg-[#1d3461] text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
          <h2 className="text-base font-bold">Add Option — {dropdownLabel}</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-white"><X size={18}/></button>
        </div>
        <div className="p-5 space-y-4">
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Label *</label>
            <input value={label} onChange={e => handleLabelChange(e.target.value)} placeholder="Display label"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d3461]"/>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Value {autoValue && <span className="text-gray-400">(auto-generated)</span>}</label>
            <input value={value} onChange={e => { setValue(e.target.value); setAutoValue(false) }} placeholder="Internal value"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1d3461] bg-gray-50"/>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Sort Order</label>
            <input type="number" value={sortOrder} onChange={e => setSortOrder(parseInt(e.target.value) || 0)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d3461]"/>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 bg-[#4db848] hover:bg-[#3fa63b] disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
            {saving ? 'Saving...' : 'Add Option'}
          </button>
        </div>
      </div>
    </div>
  )
}

function EditDropdownOptionModal({ option, onClose, onUpdated }: { option: SystemDropdown; onClose: () => void; onUpdated: () => void }) {
  const { activeEntity } = useEntity()
  const [saving, setSaving] = React.useState(false)
  const [label, setLabel] = React.useState(option.option_label)
  const [sortOrder, setSortOrder] = React.useState(option.sort_order)

  const handleSave = async () => {
    if (!label.trim()) { alert('Label is required'); return }
    setSaving(true)
    try {
      const changes: string[] = []
      const update: Record<string, any> = {}
      if (label.trim() !== option.option_label) { update.option_label = label.trim(); changes.push('option_label') }
      if (sortOrder !== option.sort_order) { update.sort_order = sortOrder; changes.push('sort_order') }
      if (Object.keys(update).length > 0) {
        const { error } = await supabase.from('system_dropdowns').update(update).eq('id', option.id)
        if (error) throw error
        await supabase.from('activity_log').insert({
          action_type: 'dropdown_option_updated', entity_type: 'system_dropdown', entity_id: option.id,
          operating_entity: activeEntity,
          metadata: { dropdown_type: option.dropdown_type, field_changed: changes, updated_by: 'user', updated_at: new Date().toISOString() },
        }).then(({ error: logErr }) => { if (logErr) console.error('Activity log error:', logErr.message) })
      }
      onUpdated()
    } catch (err: any) { alert('Error: ' + err.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="bg-[#1d3461] text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
          <h2 className="text-base font-bold">Edit Option</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-white"><X size={18}/></button>
        </div>
        <div className="p-5 space-y-4">
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Label *</label>
            <input value={label} onChange={e => setLabel(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d3461]"/>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Value <span className="text-gray-400">(read-only)</span></label>
            <input value={option.option_value} disabled
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono bg-gray-100 text-gray-500"/>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Sort Order</label>
            <input type="number" value={sortOrder} onChange={e => setSortOrder(parseInt(e.target.value) || 0)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d3461]"/>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 bg-[#4db848] hover:bg-[#3fa63b] disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// CLIENT MANAGEMENT
// ═══════════════════════════════════════════════════════════════

function ClientManagement({ clients, loading, onRefresh }: { clients: Client[]; loading: boolean; onRefresh: () => void }) {
  const [tab, setTab] = React.useState<'register' | 'contacts'>('register')
  const [contactClient, setContactClient] = React.useState<Client | null>(null)

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-1 mb-4 border-b border-gray-200">
        <button onClick={() => { setTab('register'); setContactClient(null) }}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${tab === 'register' ? 'border-green-500 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          Client Register
        </button>
        {contactClient && (
          <button onClick={() => setTab('contacts')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${tab === 'contacts' ? 'border-green-500 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            Contacts — {contactClient.company_name}
          </button>
        )}
      </div>
      {tab === 'register'
        ? <ClientRegisterTab clients={clients} loading={loading} onRefresh={onRefresh} onViewContacts={(c) => { setContactClient(c); setTab('contacts') }} />
        : contactClient
        ? <ClientContactsTab client={contactClient} onBack={() => setTab('register')} />
        : null}
    </div>
  )
}

// CLIENT REGISTER TAB

function ClientRegisterTab({ clients, loading, onRefresh, onViewContacts }: { clients: Client[]; loading: boolean; onRefresh: () => void; onViewContacts: (c: Client) => void }) {
  const [searchTerm, setSearchTerm] = React.useState('')
  const [activeOnly, setActiveOnly] = React.useState(true)
  const [showAddModal, setShowAddModal] = React.useState(false)
  const [editingClient, setEditingClient] = React.useState<Client | null>(null)
  const [deactivatingClient, setDeactivatingClient] = React.useState<Client | null>(null)
  const [primaryContacts, setPrimaryContacts] = React.useState<Record<string, ClientContact>>({})

  React.useEffect(() => {
    const fetchPrimaries = async () => {
      const { data } = await supabase.from('client_contacts').select('*').eq('is_primary', true)
      if (data) {
        const map: Record<string, ClientContact> = {}
        data.forEach((c: ClientContact) => { map[c.client_id] = c })
        setPrimaryContacts(map)
      }
    }
    fetchPrimaries()
  }, [clients])

  const filtered = clients.filter(c => {
    if (activeOnly && !c.is_active) return false
    if (!searchTerm.trim()) return true
    const term = searchTerm.toLowerCase()
    const primary = primaryContacts[c.id]
    return (c.company_name?.toLowerCase().includes(term) ||
      primary?.contact_name?.toLowerCase().includes(term))
  })

  const activeCount = clients.filter(c => c.is_active).length

  if (loading) return <div className="flex items-center justify-center h-64 gap-3 text-gray-400"><div className="w-5 h-5 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin" /><span>Loading clients...</span></div>

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-lg font-bold text-gray-900">Client Register</h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">{activeCount} active</span>
        </div>
        <p className="text-sm text-gray-500">Manage clients and their contact details</p>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by company or contact name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500" />
        </div>
        <button onClick={() => setActiveOnly(!activeOnly)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${activeOnly ? 'bg-green-50 border-green-300 text-green-700' : 'bg-gray-50 border-gray-300 text-gray-600'}`}>
          <Filter size={14} />{activeOnly ? 'Active Only' : 'Show All'}
        </button>
        <button onClick={onRefresh} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300">
          <RefreshCw size={14} />Refresh
        </button>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors ml-auto">
          <Plus size={15} />Add Client
        </button>
      </div>

      <div className="flex-1 overflow-auto bg-white rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Company Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Primary Contact</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                {searchTerm ? 'No clients match your search' : 'No clients found. Add your first client to get started.'}
              </td></tr>
            ) : filtered.map(client => {
              const primary = primaryContacts[client.id]
              return (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{client.company_name}</td>
                  <td className="px-4 py-3 text-gray-600">{primary?.contact_name || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{primary?.contact_phone || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{primary?.contact_email || '-'}</td>
                  <td className="px-4 py-3">
                    {client.is_active
                      ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">ACTIVE</span>
                      : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">INACTIVE</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setEditingClient(client)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => onViewContacts(client)} className="p-1.5 text-gray-400 hover:text-[#1d3461] hover:bg-blue-50 rounded transition-colors" title="Contacts">
                        <Users size={14} />
                      </button>
                      {client.is_active && (
                        <button onClick={() => setDeactivatingClient(client)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Deactivate">
                          <XCircle size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showAddModal && <AddClientModal onClose={() => setShowAddModal(false)} onAdded={() => { setShowAddModal(false); onRefresh() }} />}
      {editingClient && <EditClientModal client={editingClient} primaryContact={primaryContacts[editingClient.id] || null} onClose={() => setEditingClient(null)} onUpdated={() => { setEditingClient(null); onRefresh() }} />}
      {deactivatingClient && <DeactivateClientModal client={deactivatingClient} onClose={() => setDeactivatingClient(null)} onDeactivated={() => { setDeactivatingClient(null); onRefresh() }} />}
    </div>
  )
}

// ADD CLIENT MODAL

function AddClientModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const { activeEntity } = useEntity()
  const [saving, setSaving] = React.useState(false)
  const [companyName, setCompanyName] = React.useState('')
  const [contactName, setContactName] = React.useState('')
  const [contactPhone, setContactPhone] = React.useState('')
  const [contactEmail, setContactEmail] = React.useState('')
  const [contactDept, setContactDept] = React.useState('')

  const handleSave = async () => {
    if (!companyName.trim()) { alert('Company name is required'); return }
    setSaving(true)
    try {
      const { data: client, error } = await supabase.from('clients').insert({ company_name: companyName.trim(), is_active: true }).select().single()
      if (error) throw error
      if (contactName.trim()) {
        await supabase.from('client_contacts').insert({
          client_id: client.id, contact_name: contactName.trim(),
          contact_phone: contactPhone.trim() || null, contact_email: contactEmail.trim() || null,
          department: contactDept.trim() || null, is_primary: true,
        })
      }
      await supabase.from('activity_log').insert({
        action_type: 'client_added', entity_type: 'client', entity_id: client.id,
        operating_entity: activeEntity,
        metadata: { company_name: companyName.trim(), added_by: 'user', added_at: new Date().toISOString() },
      }).then(({ error: logErr }) => { if (logErr) console.error('Activity log error:', logErr.message) })
      onAdded()
    } catch (err: any) { alert('Error: ' + err.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="bg-[#1d3461] text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
          <h2 className="text-base font-bold">Add Client</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-white"><X size={18}/></button>
        </div>
        <div className="p-5 space-y-4">
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Company Name *</label>
            <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Company name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d3461]"/>
          </div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Primary Contact</p>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
              <input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Contact name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d3461]"/>
            </div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
              <input value={contactDept} onChange={e => setContactDept(e.target.value)} placeholder="e.g. Procurement"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d3461]"/>
            </div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              <input value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="Phone number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d3461]"/>
            </div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="Email address"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d3461]"/>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 bg-[#4db848] hover:bg-[#3fa63b] disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
            {saving ? 'Saving...' : 'Add Client'}
          </button>
        </div>
      </div>
    </div>
  )
}

// EDIT CLIENT MODAL

function EditClientModal({ client, primaryContact, onClose, onUpdated }: { client: Client; primaryContact: ClientContact | null; onClose: () => void; onUpdated: () => void }) {
  const { activeEntity } = useEntity()
  const [saving, setSaving] = React.useState(false)
  const [companyName, setCompanyName] = React.useState(client.company_name)
  const [contactName, setContactName] = React.useState(primaryContact?.contact_name || '')
  const [contactPhone, setContactPhone] = React.useState(primaryContact?.contact_phone || '')
  const [contactEmail, setContactEmail] = React.useState(primaryContact?.contact_email || '')
  const [contactDept, setContactDept] = React.useState(primaryContact?.department || '')

  const handleSave = async () => {
    if (!companyName.trim()) { alert('Company name is required'); return }
    setSaving(true)
    try {
      const changes: string[] = []
      if (companyName.trim() !== client.company_name) {
        await supabase.from('clients').update({ company_name: companyName.trim() }).eq('id', client.id)
        changes.push('company_name')
      }
      if (primaryContact) {
        const contactUpdate: Record<string, any> = {}
        if (contactName.trim() !== (primaryContact.contact_name || '')) { contactUpdate.contact_name = contactName.trim(); changes.push('contact_name') }
        if (contactPhone.trim() !== (primaryContact.contact_phone || '')) { contactUpdate.contact_phone = contactPhone.trim() || null; changes.push('contact_phone') }
        if (contactEmail.trim() !== (primaryContact.contact_email || '')) { contactUpdate.contact_email = contactEmail.trim() || null; changes.push('contact_email') }
        if (contactDept.trim() !== (primaryContact.department || '')) { contactUpdate.department = contactDept.trim() || null; changes.push('department') }
        if (Object.keys(contactUpdate).length > 0) {
          await supabase.from('client_contacts').update(contactUpdate).eq('id', primaryContact.id)
        }
      } else if (contactName.trim()) {
        await supabase.from('client_contacts').insert({
          client_id: client.id, contact_name: contactName.trim(),
          contact_phone: contactPhone.trim() || null, contact_email: contactEmail.trim() || null,
          department: contactDept.trim() || null, is_primary: true,
        })
        changes.push('primary_contact_added')
      }
      if (changes.length > 0) {
        await supabase.from('activity_log').insert({
          action_type: 'client_updated', entity_type: 'client', entity_id: client.id,
          operating_entity: activeEntity,
          metadata: { field_changed: changes, updated_by: 'user', updated_at: new Date().toISOString() },
        }).then(({ error: logErr }) => { if (logErr) console.error('Activity log error:', logErr.message) })
      }
      onUpdated()
    } catch (err: any) { alert('Error: ' + err.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="bg-[#1d3461] text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
          <h2 className="text-base font-bold">Edit Client</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-white"><X size={18}/></button>
        </div>
        <div className="p-5 space-y-4">
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Company Name *</label>
            <input value={companyName} onChange={e => setCompanyName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d3461]"/>
          </div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Primary Contact</p>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
              <input value={contactName} onChange={e => setContactName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d3461]"/>
            </div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
              <input value={contactDept} onChange={e => setContactDept(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d3461]"/>
            </div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              <input value={contactPhone} onChange={e => setContactPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d3461]"/>
            </div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d3461]"/>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 bg-[#4db848] hover:bg-[#3fa63b] disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// DEACTIVATE CLIENT MODAL

function DeactivateClientModal({ client, onClose, onDeactivated }: { client: Client; onClose: () => void; onDeactivated: () => void }) {
  const { activeEntity } = useEntity()
  const [saving, setSaving] = React.useState(false)
  const [reason, setReason] = React.useState('')

  const handleDeactivate = async () => {
    if (!reason.trim()) { alert('Please provide a reason for deactivation'); return }
    setSaving(true)
    try {
      const { error } = await supabase.from('clients').update({ is_active: false, deactivation_reason: reason.trim() }).eq('id', client.id)
      if (error) throw error
      await supabase.from('activity_log').insert({
        action_type: 'client_deactivated', entity_type: 'client', entity_id: client.id,
        operating_entity: activeEntity,
        metadata: { company_name: client.company_name, reason: reason.trim(), deactivated_by: 'user', deactivated_at: new Date().toISOString() },
      }).then(({ error: logErr }) => { if (logErr) console.error('Activity log error:', logErr.message) })
      onDeactivated()
    } catch (err: any) { alert('Error: ' + err.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="bg-red-600 text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
          <h2 className="text-base font-bold">Deactivate Client</h2>
          <button onClick={onClose} className="text-red-200 hover:text-white"><X size={18}/></button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-700">Are you sure you want to deactivate <strong>{client.company_name}</strong>? This client will no longer appear in active lists.</p>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Reason for deactivation *</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Enter reason..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"/>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={handleDeactivate} disabled={saving}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
            {saving ? 'Deactivating...' : 'Deactivate Client'}
          </button>
        </div>
      </div>
    </div>
  )
}

// CLIENT CONTACTS TAB

function ClientContactsTab({ client, onBack }: { client: Client; onBack: () => void }) {
  const { activeEntity } = useEntity()
  const [contacts, setContacts] = React.useState<ClientContact[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showAddModal, setShowAddModal] = React.useState(false)
  const [editingContact, setEditingContact] = React.useState<ClientContact | null>(null)

  const fetchContacts = React.useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('client_contacts').select('*').eq('client_id', client.id).order('is_primary', { ascending: false }).order('contact_name')
      if (error) throw error
      setContacts(data || [])
    } catch (e: any) { console.error('Failed to fetch contacts:', e.message) }
    finally { setLoading(false) }
  }, [client.id])

  React.useEffect(() => { fetchContacts() }, [fetchContacts])

  const handleRemove = async (contact: ClientContact) => {
    if (contacts.length <= 1) { alert('Cannot remove the only contact. Add another contact first.'); return }
    if (contact.is_primary) { alert('Cannot remove the primary contact. Set another contact as primary first.'); return }
    if (!confirm('Remove contact "' + contact.contact_name + '"?')) return
    try {
      const { error } = await supabase.from('client_contacts').delete().eq('id', contact.id)
      if (error) throw error
      await supabase.from('activity_log').insert({
        action_type: 'client_contact_removed', entity_type: 'client_contact', entity_id: contact.id,
        operating_entity: activeEntity,
        metadata: { client_id: client.id, contact_name: contact.contact_name, removed_by: 'user', removed_at: new Date().toISOString() },
      }).then(({ error: logErr }) => { if (logErr) console.error('Activity log error:', logErr.message) })
      fetchContacts()
    } catch (err: any) { alert('Error: ' + err.message) }
  }

  const handleSetPrimary = async (contact: ClientContact) => {
    try {
      await supabase.from('client_contacts').update({ is_primary: false }).eq('client_id', client.id)
      await supabase.from('client_contacts').update({ is_primary: true }).eq('id', contact.id)
      fetchContacts()
    } catch (err: any) { alert('Error: ' + err.message) }
  }

  if (loading) return <div className="flex items-center justify-center h-64 gap-3 text-gray-400"><div className="w-5 h-5 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin" /><span>Loading contacts...</span></div>

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={onBack} className="text-gray-400 hover:text-gray-700 mr-1"><ChevronRight size={16} className="rotate-180" /></button>
          <h2 className="text-lg font-bold text-gray-900">Contacts for {client.company_name}</h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">{contacts.length} contact{contacts.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#1d3461] hover:bg-[#162b50] text-white text-sm font-semibold rounded-lg transition-colors ml-auto">
          <Plus size={15} />Add Contact
        </button>
      </div>

      <div className="flex-1 overflow-auto bg-white rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {contacts.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No contacts yet. Add the first contact for this client.</td></tr>
            ) : contacts.map(contact => (
              <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{contact.contact_name}</td>
                <td className="px-4 py-3 text-gray-600">{contact.contact_phone || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{contact.contact_email || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{contact.department || '-'}</td>
                <td className="px-4 py-3">
                  {contact.is_primary
                    ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#1d3461] text-white">PRIMARY</span>
                    : <button onClick={() => handleSetPrimary(contact)} className="text-xs text-gray-400 hover:text-[#1d3461] hover:underline">Set as primary</button>}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setEditingContact(contact)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => handleRemove(contact)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Remove">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && <AddContactModal clientId={client.id} onClose={() => setShowAddModal(false)} onAdded={() => { setShowAddModal(false); fetchContacts() }} />}
      {editingContact && <EditContactModal contact={editingContact} onClose={() => setEditingContact(null)} onUpdated={() => { setEditingContact(null); fetchContacts() }} />}
    </div>
  )
}

// ADD CONTACT MODAL

function AddContactModal({ clientId, onClose, onAdded }: { clientId: string; onClose: () => void; onAdded: () => void }) {
  const { activeEntity } = useEntity()
  const [saving, setSaving] = React.useState(false)
  const [name, setName] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [dept, setDept] = React.useState('')
  const [isPrimary, setIsPrimary] = React.useState(false)

  const handleSave = async () => {
    if (!name.trim()) { alert('Contact name is required'); return }
    setSaving(true)
    try {
      if (isPrimary) {
        await supabase.from('client_contacts').update({ is_primary: false }).eq('client_id', clientId)
      }
      const { data: contact, error } = await supabase.from('client_contacts').insert({
        client_id: clientId, contact_name: name.trim(),
        contact_phone: phone.trim() || null, contact_email: email.trim() || null,
        department: dept.trim() || null, is_primary: isPrimary,
      }).select().single()
      if (error) throw error
      await supabase.from('activity_log').insert({
        action_type: 'client_contact_added', entity_type: 'client_contact', entity_id: contact.id,
        operating_entity: activeEntity,
        metadata: { client_id: clientId, contact_name: name.trim(), added_by: 'user', added_at: new Date().toISOString() },
      }).then(({ error: logErr }) => { if (logErr) console.error('Activity log error:', logErr.message) })
      onAdded()
    } catch (err: any) { alert('Error: ' + err.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="bg-[#1d3461] text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
          <h2 className="text-base font-bold">Add Contact</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-white"><X size={18}/></button>
        </div>
        <div className="p-5 space-y-4">
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Contact Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d3461]"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d3461]"/>
            </div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d3461]"/>
            </div>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
            <input value={dept} onChange={e => setDept(e.target.value)} placeholder="e.g. Procurement, Engineering"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d3461]"/>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isPrimary} onChange={e => setIsPrimary(e.target.checked)} className="w-4 h-4 text-[#1d3461] rounded"/>
            <span className="text-sm text-gray-700">Set as primary contact</span>
          </label>
        </div>
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 bg-[#4db848] hover:bg-[#3fa63b] disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
            {saving ? 'Saving...' : 'Add Contact'}
          </button>
        </div>
      </div>
    </div>
  )
}

// EDIT CONTACT MODAL

function EditContactModal({ contact, onClose, onUpdated }: { contact: ClientContact; onClose: () => void; onUpdated: () => void }) {
  const { activeEntity } = useEntity()
  const [saving, setSaving] = React.useState(false)
  const [name, setName] = React.useState(contact.contact_name)
  const [phone, setPhone] = React.useState(contact.contact_phone || '')
  const [email, setEmail] = React.useState(contact.contact_email || '')
  const [dept, setDept] = React.useState(contact.department || '')

  const handleSave = async () => {
    if (!name.trim()) { alert('Contact name is required'); return }
    setSaving(true)
    try {
      const changes: string[] = []
      const update: Record<string, any> = {}
      if (name.trim() !== contact.contact_name) { update.contact_name = name.trim(); changes.push('contact_name') }
      if (phone.trim() !== (contact.contact_phone || '')) { update.contact_phone = phone.trim() || null; changes.push('contact_phone') }
      if (email.trim() !== (contact.contact_email || '')) { update.contact_email = email.trim() || null; changes.push('contact_email') }
      if (dept.trim() !== (contact.department || '')) { update.department = dept.trim() || null; changes.push('department') }
      if (Object.keys(update).length > 0) {
        const { error } = await supabase.from('client_contacts').update(update).eq('id', contact.id)
        if (error) throw error
        await supabase.from('activity_log').insert({
          action_type: 'client_contact_updated', entity_type: 'client_contact', entity_id: contact.id,
          operating_entity: activeEntity,
          metadata: { client_id: contact.client_id, field_changed: changes, updated_by: 'user', updated_at: new Date().toISOString() },
        }).then(({ error: logErr }) => { if (logErr) console.error('Activity log error:', logErr.message) })
      }
      onUpdated()
    } catch (err: any) { alert('Error: ' + err.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="bg-[#1d3461] text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
          <h2 className="text-base font-bold">Edit Contact</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-white"><X size={18}/></button>
        </div>
        <div className="p-5 space-y-4">
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Contact Name *</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d3461]"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              <input value={phone} onChange={e => setPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d3461]"/>
            </div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d3461]"/>
            </div>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
            <input value={dept} onChange={e => setDept(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d3461]"/>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 bg-[#4db848] hover:bg-[#3fa63b] disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
