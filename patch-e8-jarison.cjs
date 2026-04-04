const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add Upload icon to lucide imports
c = c.replace(
  "Check, Printer }",
  "Check, Printer, Upload } "
);

// 2. Add showJarisonImport state after showCreateDirectJob
c = c.replace(
  "const [showCreateDirectJob, setShowCreateDirectJob] = useState(false)",
  "const [showCreateDirectJob, setShowCreateDirectJob] = useState(false)\n  const [showJarisonImport, setShowJarisonImport] = useState(false)"
);

// 3. Add "Import from Jarison" button next to "New Job" button
c = c.replace(
  `{activeBoard === 'job' && (
              <button onClick={() => setShowCreateDirectJob(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors">
                <Plus size={15} />New Job
              </button>
            )}`,
  `{activeBoard === 'job' && (<>
              <button onClick={() => setShowJarisonImport(true)} className="flex items-center gap-2 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors">
                <Upload size={15} />Import Jarison
              </button>
              <button onClick={() => setShowCreateDirectJob(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors">
                <Plus size={15} />New Job
              </button>
            </>)}`
);

// 4. Add modal render after CreateDirectJobModal
c = c.replace(
  "{showCreateDirectJob && <CreateDirectJobModal onClose={() => setShowCreateDirectJob(false)} onCreated={fetchJobs} />}",
  `{showCreateDirectJob && <CreateDirectJobModal onClose={() => setShowCreateDirectJob(false)} onCreated={fetchJobs} />}
      {showJarisonImport && <JarisonImportModal onClose={() => setShowJarisonImport(false)} onImported={fetchJobs} />}`
);

// 5. Add JarisonImportModal component before the JobBoard function
const jarisonModal = `
function JarisonImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const [csvRows, setCsvRows] = React.useState<any[]>([])
  const [fileName, setFileName] = React.useState('')
  const [importing, setImporting] = React.useState(false)
  const [importResult, setImportResult] = React.useState<{ success: number; errors: number } | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)

  const parseCSV = (text: string) => {
    const lines = text.trim().split('\\n')
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
    const yr = new Date().getFullYear().toString().slice(-2)
    const { default: { createClient } } = await import('@supabase/supabase-js') as any
    const sb = (await import('./lib/supabase')).supabase

    // Get current job count for numbering
    const { count: jc } = await sb.from('jobs').select('*', { count: 'exact', head: true })
    let seq = (jc || 0) + 1

    for (const row of csvRows) {
      try {
        const jobNumber = row.JobNumber || \`JOB-\${yr}-\${String(seq).padStart(3, '0')}\`
        const { error } = await sb.from('jobs').insert({
          job_number: jobNumber,
          description: row.Description || 'Imported from Jarison',
          client_name: row.ClientName || 'Unknown Client',
          due_date: row.DueDate || null,
          date_received: row.StartDate || new Date().toISOString().slice(0, 10),
          notes: \`Imported from Jarison CSV (\${fileName}) on \${new Date().toLocaleDateString('en-ZA')}\`,
          entry_type: 'DIRECT',
          status: 'PENDING',
          priority: 'MEDIUM',
        })
        if (error) { errors++; console.error('Import row error:', error) }
        else { success++; seq++ }
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
            <div className={\`rounded-lg p-4 \${importResult.errors > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}\`}>
              <p className="text-sm font-semibold">{importResult.success} jobs imported successfully{importResult.errors > 0 ? \`, \${importResult.errors} failed\` : ''}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={handleImport} disabled={csvRows.length === 0 || importing || !!importResult}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white text-sm font-semibold rounded-lg transition-colors">
            {importing ? 'Importing...' : importResult ? 'Done' : \`Import \${csvRows.length} Jobs\`}
          </button>
        </div>
      </div>
    </div>
  )
}

`;

c = c.replace(
  'function JobBoard({ jobs, loading, onCardClick, selectedId, onStatusChange, onPrintCard }',
  jarisonModal + 'function JobBoard({ jobs, loading, onCardClick, selectedId, onStatusChange, onPrintCard }'
);

fs.writeFileSync('src/App.tsx', c, 'utf8');
console.log('E8 Jarison Import patched! Lines:', c.split('\n').length);