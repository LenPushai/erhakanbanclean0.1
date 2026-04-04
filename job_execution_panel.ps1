$file = "src\App.tsx"
$lines = Get-Content $file

# ── Find the {selectedJob && ( line inside WorkshopBoard (after line 2400) ──
$modalStart = -1
for ($i = 2400; $i -lt $lines.Length; $i++) {
  if ($lines[$i] -match "\{selectedJob && \(") {
    $modalStart = $i
    break
  }
}

# ── Find the closing )} of the modal block — look for export default App ──
$modalEnd = -1
for ($i = $modalStart; $i -lt $lines.Length; $i++) {
  if ($lines[$i] -match "^export default App") {
    # The modal ends a few lines before export default
    $modalEnd = $i - 1
    break
  }
}

Write-Host "Modal block: lines $($modalStart+1) to $($modalEnd+1)"

# ── New Job Execution Panel ──
$newPanel = @'
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

// ── JOB EXECUTION PANEL — E6 ─────────────────────────────────────────────────
function JobExecutionPanel({ job, onClose, onStatusChange, onRefresh }: {
  job: any; onClose: () => void; onStatusChange: (id: string, status: string) => void; onRefresh: () => void
}) {
  const [activeTab, setActiveTab] = React.useState<'workers'|'time'|'qc'|'materials'>('workers')
  const [workshopStatus, setWorkshopStatus] = React.useState(job.workshop_status || 'NOT_STARTED')
  const [notes, setNotes] = React.useState(job.workshop_notes || '')
  const [savingNotes, setSavingNotes] = React.useState(false)

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
    { key: 'workers',   label: '👷 Workers'   },
    { key: 'time',      label: '⏱ Time'       },
    { key: 'qc',        label: '✅ QC'         },
    { key: 'materials', label: '🔧 Materials'  },
  ]

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#f7f8fb' }}>

      {/* ── HEADER ── */}
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

      {/* ── TABS ── */}
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

      {/* ── TAB CONTENT ── */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '32px 32px' }}>

        {/* WORKERS TAB */}
        {activeTab === 'workers' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#1d3461' }}>Worker Assignment</div>
                <div style={{ fontSize: '12px', color: '#8896a8', marginTop: '2px' }}>Assign casual workers from Casuals_2025 to this job</div>
              </div>
              <button style={{ background: '#4db848', color: 'white', border: 'none', borderRadius: '6px', padding: '10px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                + Assign Worker
              </button>
            </div>
            <div style={{ background: 'white', border: '1px solid #dde3ec', borderRadius: '8px', padding: '48px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>👷</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#1d3461', marginBottom: '4px' }}>No workers assigned yet</div>
              <div style={{ fontSize: '12px', color: '#8896a8' }}>Click "Assign Worker" to add casual workers to this job</div>
            </div>
          </div>
        )}

        {/* TIME TAB */}
        {activeTab === 'time' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#1d3461' }}>Time Tracking</div>
              <div style={{ fontSize: '12px', color: '#8896a8', marginTop: '2px' }}>Clock in/out per worker per job</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
              {[{ l: 'Time Started', v: job.time_started_at ? new Date(job.time_started_at).toLocaleString('en-ZA') : '—' },
                { l: 'Total Workers', v: '0' },
                { l: 'Total Hours', v: '0h 0m' }].map((s,i) => (
                <div key={i} style={{ background: 'white', border: '1px solid #dde3ec', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#8896a8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>{s.l}</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#1d3461' }}>{s.v}</div>
                </div>
              ))}
            </div>
            <div style={{ background: 'white', border: '1px solid #dde3ec', borderRadius: '8px', padding: '48px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏱</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#1d3461', marginBottom: '4px' }}>No time records yet</div>
              <div style={{ fontSize: '12px', color: '#8896a8' }}>Assign workers first, then clock them in from the Workers tab</div>
            </div>
          </div>
        )}

        {/* QC TAB */}
        {activeTab === 'qc' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#1d3461' }}>QC Holding Points</div>
                <div style={{ fontSize: '12px', color: '#8896a8', marginTop: '2px' }}>9 checkpoints — digital replacement for paper signature</div>
              </div>
              <div style={{ background: '#e8ecf4', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: 700, color: '#1d3461' }}>
                0 of 9 complete
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[1,2,3,4,5,6,7,8,9].map(n => (
                <div key={n} style={{ background: 'white', border: '1px solid #dde3ec', borderRadius: '8px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e8ecf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#1d3461', flexShrink: 0 }}>{n}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1d3461' }}>Holding Point {n}</div>
                    <div style={{ fontSize: '11px', color: '#8896a8', marginTop: '2px' }}>Awaiting sign-off</div>
                  </div>
                  <button style={{ background: '#4db848', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 18px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                    Sign Off
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MATERIALS TAB */}
        {activeTab === 'materials' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#1d3461' }}>Materials Used</div>
                <div style={{ fontSize: '12px', color: '#8896a8', marginTop: '2px' }}>Log materials consumed against the quoted bill of materials</div>
              </div>
              <button style={{ background: '#4db848', color: 'white', border: 'none', borderRadius: '6px', padding: '10px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                + Log Material
              </button>
            </div>
            <div style={{ background: 'white', border: '1px solid #dde3ec', borderRadius: '8px', padding: '48px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔧</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#1d3461', marginBottom: '4px' }}>No materials logged yet</div>
              <div style={{ fontSize: '12px', color: '#8896a8' }}>Click "Log Material" to record materials consumed on this job</div>
            </div>
          </div>
        )}

        {/* WORKSHOP NOTES — always visible at bottom */}
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
'@

# Split into lines
$newPanelLines = $newPanel -split "`n"

# Replace modal block with new panel
$lines = $lines[0..($modalStart-1)] + $newPanelLines + $lines[$modalEnd..($lines.Length-1)]

$lines | Set-Content $file -Encoding UTF8
Write-Host "Job Execution Panel patched. Total lines: $($lines.Length)"
