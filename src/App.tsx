import React from 'react';
import { useState, useEffect } from 'react'
import { ClipboardList, Briefcase, ChevronRight, Factory, Building2, Calendar, Hash, RefreshCw, ArrowDownToLine, ArrowUpFromLine, X, Mail, FileText, Paperclip, Send, Plus, Search } from 'lucide-react'
import { supabase } from './lib/supabase'
import { format } from 'date-fns'

type Board = 'rfq' | 'job'

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
  clients?: { company_name: string } | null
}

interface Job {
  id: string
  job_number: string
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
const DEPARTMENTS_CG = ['MELTSHOP', 'MILLS', 'SHARON', 'OREN', 'STORES', 'GENERAL', 'MRSTO']
const ACTIONS_LIST = ['QUOTE', 'CUT', 'SERVICE', 'REPAIR', 'PAINT', 'MANUFACTURE', 'MODIFY', 'MACHINING', 'SANDBLAST', 'BREAKDOWN', 'SUPPLY', 'CHANGE', 'INSTALLATION', 'OTHER']
const MEDIA_OPTIONS = ['Email', 'WhatsApp', 'Phone', 'Walk-in', 'Fax']
const UOM_OPTIONS = ['EA', 'M', 'KG', 'L', 'HR', 'TRIP', 'SET', 'M2', 'M3', 'TON']
const ITEM_TYPES = ['MATERIAL', 'LABOUR', 'TRANSPORT', 'EQUIPMENT', 'SUBCONTRACT', 'OTHER']
const OPERATING_ENTITIES = ['ERHA FC', 'ERHA CC']

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
        <div className="p-6 space-y-3">
          <button onClick={() => onSelect('HENDRIK')}
            className="w-full flex items-center gap-4 px-5 py-4 border-2 border-gray-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all group">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center shrink-0 group-hover:bg-orange-200">
              <span className="text-orange-600 font-bold text-sm">HK</span>
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Hendrik</p>
              <p className="text-xs text-gray-400">CEO - Full access</p>
            </div>
          </button>
          <button onClick={() => onSelect('JUANIC')}
            className="w-full flex items-center gap-4 px-5 py-4 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all group">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0 group-hover:bg-blue-200">
              <span className="text-blue-600 font-bold text-sm">JU</span>
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Juanic</p>
              <p className="text-xs text-gray-400">Admin - RFQ management</p>
            </div>
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 pb-4">PUSH AI Foundation</p>
      </div>
    </div>
  )
}

// APP

function App() {
  const [currentRole, setCurrentRole] = useState<string | null>(null)
  const [activeBoard, setActiveBoard] = useState<Board>('rfq')
  const [rfqs, setRfqs] = useState<RFQ[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRFQ, setSelectedRFQ] = useState<RFQ | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [jobs, setJobs] = useState<Job[]>([])
  const [jobsLoading, setJobsLoading] = useState(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)

  const fetchRFQs = async () => {
    setLoading(true); setError(null)
    try {
      const { data, error } = await supabase.from('rfqs').select('*, clients(company_name)').order('created_at', { ascending: false })
      if (error) throw error
      setRfqs(data || [])
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const fetchJobs = async () => {
    setJobsLoading(true)
    try {
      const { data, error } = await supabase.from('jobs').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setJobs(data || [])
    } catch (e: any) { console.error('Jobs error:', e.message) }
    finally { setJobsLoading(false) }
  }

  useEffect(() => { fetchRFQs(); fetchJobs() }, [])

  const handleRFQUpdate = (updated: RFQ) => {
    setRfqs(prev => prev.map(r => r.id === updated.id ? updated : r))
    setSelectedRFQ(updated)
  }

  const handleRFQCreated = () => {
    setShowCreateModal(false)
    fetchRFQs()
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
          <NavItem icon={<ClipboardList size={18} />} label="Work Order Board" description="Work Order pipeline" active={activeBoard === 'rfq'} accentColor="text-blue-400" onClick={() => setActiveBoard('rfq')} />
          <NavItem icon={<Briefcase size={18} />} label="Job Board" description="Project tracking" active={activeBoard === 'job'} accentColor="text-green-400" onClick={() => setActiveBoard('job')} />
        </nav>
        <div className="px-6 py-4 border-t border-gray-700">
          <p className="text-gray-500 text-xs">PUSH AI Foundation</p>
          <p className="text-gray-600 text-xs">v0.1.0 - dev</p>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{activeBoard === 'rfq' ? 'Work Order Board' : 'Job Board'}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{activeBoard === 'rfq' ? 'Work Order to job creation - sales pipeline' : 'Job created to paid - project tracking'}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { fetchRFQs(); fetchJobs() }} className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <RefreshCw size={14} />Refresh
            </button>
            {activeBoard === 'rfq' && (
              <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
                <Plus size={15} />New Work Order
              </button>
            )}
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${activeBoard === 'rfq' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
              {activeBoard === 'rfq' ? 'Work Order Board' : 'Job Board'}
            </span>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden min-w-0">
          <div className="flex-1 overflow-auto p-6 min-w-0">
            {activeBoard === 'rfq'
              ? <RFQBoard rfqs={rfqs} loading={loading} error={error} onRefresh={fetchRFQs} onCardClick={setSelectedRFQ} selectedId={selectedRFQ?.id} />
              : <JobBoard jobs={jobs} loading={jobsLoading} onCardClick={setSelectedJob} selectedId={selectedJob?.id} />}
          </div>
          {selectedRFQ && <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"><RFQDetailPanel rfq={selectedRFQ} onClose={() => setSelectedRFQ(null)} onUpdate={handleRFQUpdate} role={currentRole} onJobCreated={fetchJobs} /></div>}
        </div>
      </main>

      {showCreateModal && <CreateRFQModal onClose={() => setShowCreateModal(false)} onCreated={handleRFQCreated} />}
    </div>
  )
}

// RFQ BOARD

function RFQBoard({ rfqs, loading, error, onRefresh, onCardClick, selectedId }: { rfqs: RFQ[]; loading: boolean; error: string | null; onRefresh: () => void; onCardClick: (rfq: RFQ) => void; selectedId?: string }) {
  const [woSearch, setWoSearch] = React.useState('')
  if (loading) return <div className="flex items-center justify-center h-64 gap-3 text-gray-400"><div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" /><span>Loading RFQs...</span></div>
  if (error) return <div className="flex items-center justify-center h-64"><div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center"><p className="text-red-700 font-semibold mb-2">Failed to load</p><p className="text-red-500 text-sm mb-4">{error}</p><button onClick={onRefresh} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Try Again</button></div></div>
  const woQ = woSearch.toLowerCase().trim()
  const woFiltered = woQ ? rfqs.filter(r =>
    (r.enq_number || '').toLowerCase().includes(woQ) ||
    (r.clients?.company_name || '').toLowerCase().includes(woQ) ||
    (r.description || '').toLowerCase().includes(woQ) ||
    (r.assigned_quoter_name || '').toLowerCase().includes(woQ)
  ) : rfqs
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 pb-3 shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input value={woSearch} onChange={e => setWoSearch(e.target.value)} placeholder="Search WO number, client, description..." className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white w-80" />
        </div>
        {woQ && <span className="text-xs text-gray-500">{woFiltered.length} result{woFiltered.length !== 1 ? 's' : ''}</span>}
        {woQ && <button onClick={() => setWoSearch('')} className="text-xs text-blue-500 hover:underline">Clear</button>}
      </div>
      <div className="flex gap-4 overflow-x-auto flex-1" style={{ minWidth: 'max-content' }}>
        {RFQ_COLUMNS.map((col) => {
          const cards = woFiltered.filter(r => r.status === col.key)
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
    </div>
  )
}

// RFQ CARD

function RFQCard({ rfq, hoverColor, onClick, isSelected }: { rfq: RFQ; hoverColor: string; onClick: () => void; isSelected: boolean }) {
  const priority = rfq.priority?.toUpperCase() || 'NORMAL'
  const direction = rfq.rfq_direction?.toUpperCase()
  const enqNo = rfq.enq_number || rfq.rfq_no || '-'
  return (
    <div onClick={onClick} className={`bg-white rounded-lg shadow-sm border-2 p-3 cursor-pointer hover:shadow-md ${hoverColor} transition-all ${isSelected ? 'border-blue-400 shadow-md' : 'border-transparent'}`}>
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <span className="text-xs font-bold text-blue-600 tracking-wide">{enqNo}</span>
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

function JobBoard({ jobs, loading, onCardClick, selectedId }: { jobs: Job[]; loading: boolean; onCardClick: (job: Job) => void; selectedId?: string }) {
  const [jobSearch, setJobSearch] = React.useState('')
  const columns = [
    { key: 'PENDING',       label: 'Pending',       color: 'bg-gray-500'   },
    { key: 'SCHEDULED',     label: 'Scheduled',     color: 'bg-blue-500'   },
    { key: 'IN_PROGRESS',   label: 'In Progress',   color: 'bg-orange-500' },
    { key: 'ON_HOLD',       label: 'On Hold',       color: 'bg-red-400'    },
    { key: 'QUALITY_CHECK', label: 'Quality Check', color: 'bg-purple-500' },
    { key: 'COMPLETE',      label: 'Complete',      color: 'bg-green-500'  },
  ]
  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3 text-gray-400">
      <div className="w-5 h-5 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin" />
      <span>Loading jobs...</span>
    </div>
  )
  const jobQ = jobSearch.toLowerCase().trim()
  const jobFiltered = jobQ ? jobs.filter(j =>
    (j.job_number || '').toLowerCase().includes(jobQ) ||
    (j.client_name || '').toLowerCase().includes(jobQ) ||
    (j.description || '').toLowerCase().includes(jobQ) ||
    (j.po_number || '').toLowerCase().includes(jobQ)
  ) : jobs
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 pb-3 shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input value={jobSearch} onChange={e => setJobSearch(e.target.value)} placeholder="Search job number, client, description..." className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white w-80" />
        </div>
        {jobQ && <span className="text-xs text-gray-500">{jobFiltered.length} result{jobFiltered.length !== 1 ? 's' : ''}</span>}
        {jobQ && <button onClick={() => setJobSearch('')} className="text-xs text-blue-500 hover:underline">Clear</button>}
      </div>
      <div className="flex gap-4 overflow-x-auto flex-1" style={{ minWidth: 'max-content' }}>
        {columns.map(col => {
          const cards = jobFiltered.filter(j => j.status === col.key)
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
              {cards.map(job => (
                <div key={job.id} onClick={() => onCardClick(job)}
                  className={`bg-white rounded-lg shadow-sm border-2 p-3 cursor-pointer hover:shadow-md transition-all ${job.id === selectedId ? 'border-green-400 shadow-md' : 'border-transparent hover:border-green-300'}`}>
                  <p className="text-xs font-bold text-green-600">{job.job_number || 'Pending'}</p>
                  <p className="text-sm font-medium text-gray-800 mt-1 line-clamp-2">{job.description || 'No description'}</p>
                  <p className="text-xs text-gray-500 mt-1 truncate">{job.client_name || '-'}</p>
                  {job.due_date && (
                    <p className="text-xs text-gray-400 mt-1">Due: {new Date(job.due_date).toLocaleDateString('en-ZA')}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
      </div>
    </div>
  )
}

// CREATE RFQ MODAL

function CreateRFQModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [saving, setSaving] = React.useState(false)
  const [uploadingFiles, setUploadingFiles] = React.useState(false)
  const [clients, setClients] = React.useState<any[]>([])
  const [showNewClient, setShowNewClient] = React.useState(false)
  const [newClientName, setNewClientName] = React.useState('')
  const [attachments, setAttachments] = React.useState<Array<{ name: string; path: string; size: number }>>([])
  const [form, setForm] = React.useState({
    rfq_direction: 'INCOMING',
    operating_entity: 'ERHA FC',
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

      const { count } = await supabase.from('rfqs').select('*', { count: 'exact', head: true })
      const enqNumber = `WO-26-${String((count || 0) + 1).padStart(4, '0')}`

      const { data: rfq, error: rfqError } = await supabase.from('rfqs').insert({
        enq_number: enqNumber,
        rfq_no: enqNumber,
        rfq_direction: form.rfq_direction,
        operating_entity: form.operating_entity,
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
          <h2 className="text-lg font-bold text-gray-900">New Work Order</h2>
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
                <label className="block text-xs font-medium text-gray-600 mb-1">Operating Entity</label>
                <select value={form.operating_entity} onChange={e => set('operating_entity', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {OPERATING_ENTITIES.map(e => <option key={e}>{e}</option>)}
                </select>
              </div>
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
                  {MEDIA_OPTIONS.map(m => <option key={m}>{m}</option>)}
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
                <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
                <select value={form.department_cg} onChange={e => set('department_cg', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select department...</option>
                  {DEPARTMENTS_CG.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Drawing Number</label>
                <input type="text" value={form.drawing_number} onChange={e => set('drawing_number', e.target.value)} placeholder="DWG-001" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-600 mb-2">Actions Required</label>
              <div className="flex flex-wrap gap-1.5">
                {ACTIONS_LIST.map(a => (
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
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 w-36">Type</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Description</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 w-20">Qty</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 w-20">UOM</th>
                    <th className="w-8 px-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lineItems.map((li, i) => (
                    <tr key={i}>
                      <td className="px-2 py-1.5"><select value={li.item_type} onChange={e => updateLineItem(i, 'item_type', e.target.value)} className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">{ITEM_TYPES.map(t => <option key={t}>{t}</option>)}</select></td>
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
            {saving ? 'Creating...' : 'Create Work Order'}
          </button>
        </div>
      </div>
    </div>
  )
}

// RFQ DETAIL PANEL

function RFQDetailPanel({ rfq, onClose, onUpdate, role, onJobCreated }: { rfq: RFQ; onClose: () => void; onUpdate: (rfq: RFQ) => void; role: string | null; onJobCreated?: () => void }) {
  const [lineItems, setLineItems] = React.useState<LineItem[]>([])
  const [panelLineItems, setPanelLineItems] = React.useState<any[]>([])
  const [loadingItems, setLoadingItems] = React.useState(true)
  const [panelAttachments, setPanelAttachments] = React.useState<any[]>([])
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
  const [editOperatingEntity, setEditOperatingEntity] = React.useState(rfq.operating_entity || 'ERHA FC')
  const [editDateReceived, setEditDateReceived] = React.useState(rfq.request_date || '')
  const [editRequiredBy, setEditRequiredBy] = React.useState(rfq.required_date || '')
  const [editPriority, setEditPriority] = React.useState(rfq.priority || 'MEDIUM')
  const [editDepartmentCG, setEditDepartmentCG] = React.useState(rfq.department_cg || '')
  const [editActions, setEditActions] = React.useState<string[]>((rfq.actions_required || '').split(',').filter(Boolean))
  const [editDescription, setEditDescription] = React.useState(rfq.description || '')
  const [editSpecialReqs, setEditSpecialReqs] = React.useState(rfq.special_requirements || '')
  const [editNotes, setEditNotes] = React.useState(rfq.notes || '')

  const [quoteNumber, setQuoteNumber] = React.useState(rfq.quote_number || '')
  const [quoteValue, setQuoteValue] = React.useState(rfq.quote_value_excl_vat ? String(rfq.quote_value_excl_vat) : '')
  const [validUntil, setValidUntil] = React.useState(rfq.valid_until || '')
  const [poNumber, setPoNumber] = React.useState(rfq.po_number || '')
  const [orderNumber, setOrderNumber] = React.useState(rfq.order_number || '')
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

  const handleSaveRFQDetails = async () => {
    setSaving(true)
    try {
      const { data, error } = await supabase.from('rfqs').update({
        contact_person: editContactPerson || null, contact_email: editContactEmail || null, contact_phone: editContactPhone || null,
        client_rfq_number: editClientRfqNumber || null, drawing_number: editDrawingNumber || null, requested_by: editRequestedBy || null,
        media_received: editMediaReceived || null, operating_entity: editOperatingEntity, request_date: editDateReceived || null,
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
      showMsg('Quote saved - card moved to Quoted')
    } catch (e: any) { alert('Error: ' + e.message) }
    finally { setSaving(false) }
  }

  const handleSaveOrder = async () => {
    if (!poNumber.trim()) { alert('Please enter the client PO number'); return }
    setSaving(true)
    try {
      // 1. Update RFQ to ACCEPTED
      const { data, error } = await supabase.from('rfqs').update({ po_number: poNumber.trim(), order_number: orderNumber || null, order_date: orderDate || null, status: 'ACCEPTED' }).eq('id', rfq.id).select('*, clients(company_name)').single()
      if (error) throw error
      onUpdate(data)

      // 2. Create job record
      const { data: jobData, error: jobError } = await supabase.from('jobs').insert({
        rfq_id: rfq.id,
        client_name: rfq.clients?.company_name || null,
        description: rfq.description,
        po_number: poNumber.trim(),
        status: 'PENDING',
        priority: rfq.priority || 'NORMAL',
      }).select('id').single()

      if (jobError) {
        console.error('Job creation error:', jobError.message)
        showMsg('Order saved but job creation failed - check console')
      } else {
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

        showMsg('Order won - Job created with line items!')
        if (onJobCreated) onJobCreated()
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
      showMsg('Invoice saved - card moved to Complete')
    } catch (e: any) { alert('Error: ' + e.message) }
    finally { setSaving(false) }
  }

  const enqNo = rfq.enq_number || rfq.rfq_no || '-'
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

          {(status === 'PENDING' || status === 'QUOTED') && (
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

          {(status === 'QUOTED' || status === 'SENT_TO_CUSTOMER' || status === 'ACCEPTED') && (
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Order Information (when won)</p>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div><label className="text-xs font-medium text-gray-600 block mb-1">Client PO Number *</label><input value={poNumber} onChange={e => setPoNumber(e.target.value)} placeholder="Client PO" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" /></div>
                <div><label className="text-xs font-medium text-gray-600 block mb-1">Order Number</label><input value={orderNumber} onChange={e => setOrderNumber(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" /></div>
                <div><label className="text-xs font-medium text-gray-600 block mb-1">Order Date</label><input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" /></div>
              </div>
              {(status === 'QUOTED' || status === 'SENT_TO_CUSTOMER') && <button onClick={handleSaveOrder} disabled={saving} className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">{saving ? 'Saving...' : 'Save Order - Move to Order Won'}</button>}
              {status === 'ACCEPTED' && poNumber && <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg"><FileText size={14} /> PO: {poNumber} {orderNumber ? '| Order: ' + orderNumber : ''}</div>}
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
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Work Order Details</p>
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
              <div><label className="text-xs text-gray-500 block mb-1">Media Received</label><select value={editMediaReceived} onChange={e => setEditMediaReceived(e.target.value)} className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400 bg-white"><option value="">Select...</option>{['Email','WhatsApp','Phone','Walk-in','Fax'].map(m => <option key={m} value={m}>{m}</option>)}</select></div>
              <div><label className="text-xs text-gray-500 block mb-1">Operating Entity</label><select value={editOperatingEntity} onChange={e => setEditOperatingEntity(e.target.value)} className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400 bg-white">{OPERATING_ENTITIES.map(e => <option key={e} value={e}>{e}</option>)}</select></div>
              <div><label className="text-xs text-gray-500 block mb-1">Date Received</label><input type="date" value={editDateReceived} onChange={e => setEditDateReceived(e.target.value)} className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400" /></div>
              <div><label className="text-xs text-gray-500 block mb-1">Required By</label><input type="date" value={editRequiredBy} onChange={e => setEditRequiredBy(e.target.value)} className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400" /></div>
              <div><label className="text-xs text-gray-500 block mb-1">Priority</label><select value={editPriority} onChange={e => setEditPriority(e.target.value)} className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400 bg-white">{['LOW','MEDIUM','HIGH','URGENT'].map(p => <option key={p} value={p}>{p}</option>)}</select></div>
            </div>
            <div className="mb-3">
              <label className="text-xs text-gray-500 block mb-1">Department CG</label>
              <div className="flex flex-wrap gap-3">
                {['MELTSHOP','MILLS','SHARON','OREN','STORES','GENERAL','MRSTO'].map(d => (
                  <label key={d} className="flex items-center gap-1 cursor-pointer">
                    <input type="radio" name="editDeptCG" value={d} checked={editDepartmentCG === d} onChange={() => setEditDepartmentCG(d)} className="accent-orange-500" />
                    <span className="text-xs text-gray-700">{d}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="mb-3">
              <label className="text-xs text-gray-500 block mb-1">Actions Required</label>
              <div className="flex flex-wrap gap-1.5">
                {ACTIONS_LIST.map(a => (
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
                        <div className="col-span-2">Type</div><div className="col-span-5">Description</div><div className="col-span-2">Qty</div><div className="col-span-2">UOM</div><div className="col-span-1"></div>
                      </div>
                      {panelLineItems.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-1.5 items-center">
                          <div className="col-span-2"><select value={item.item_type} onChange={e => updatePanelLineItem(idx, 'item_type', e.target.value)} className="w-full border border-gray-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-blue-400 bg-white">{['MATERIAL','LABOUR','SUBCONTRACT','EQUIPMENT','OTHER'].map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                          <div className="col-span-5"><input value={item.description} onChange={e => updatePanelLineItem(idx, 'description', e.target.value)} placeholder="Description" className="w-full border border-gray-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-blue-400" /></div>
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

          {panelAttachments.length > 0 && (
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Attachments</p>
              <div className="space-y-1.5">
                {panelAttachments.map(att => {
                  const url = supabase.storage.from('rfq-attachments').getPublicUrl(att.file_path).data.publicUrl
                  return (
                    <a key={att.id} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-100 transition-colors">
                      <FileText size={13} className="text-blue-500 shrink-0" />
                      <span className="text-xs font-medium text-blue-700 truncate">{att.file_name}</span>
                    </a>
                  )
                })}
              </div>
            </div>
          )}

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
  const enqNo = rfq.enq_number || rfq.rfq_no || '-'
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

export default App
