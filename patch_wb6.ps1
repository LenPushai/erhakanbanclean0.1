$cjs = @'
const fs = require('fs');
const src = fs.readFileSync('src/App.tsx', 'utf8');
const lines = src.split('\n');

// 1. Board type
const b = lines.findIndex(l => l.includes("type Board = 'rfq' | 'job'") && !l.includes('workshop'));
if (b > -1) { lines[b] = "type Board = 'rfq' | 'job' | 'workshop'\r"; console.log('[1] Board type at '+(b+1)); }

// 2. Workshop state
const ab = lines.findIndex(l => l.includes('activeBoard, setActiveBoard') && l.includes('useState<Board>'));
if (ab > -1) {
  lines.splice(ab+1, 0,
    "  const [workshopJobs, setWorkshopJobs] = useState<Job[]>([])\r",
    "  const [workshopLoading, setWorkshopLoading] = useState(false)\r"
  );
  console.log('[2] Workshop state at '+(ab+2));
}

// 3. fetchWorkshopJobs
const fj = lines.findIndex(l => l.includes('setJobsLoading(false)'));
if (fj > -1) {
  lines.splice(fj+2, 0,
    "  const fetchWorkshopJobs = async () => {\r",
    "    setWorkshopLoading(true)\r",
    "    try {\r",
    "      const { data } = await supabase.from('jobs').select('*').not('workshop_status','is',null).order('created_at',{ascending:false})\r",
    "      setWorkshopJobs(data || [])\r",
    "    } finally { setWorkshopLoading(false) }\r",
    "  }\r"
  );
  console.log('[3] fetchWorkshopJobs at '+(fj+3));
}

// 4. handleWorkshopStatusChange before App return
const ar = lines.findIndex((l,i) => i > 400 && i < 620 && l.trim() === 'return (');
if (ar > -1) {
  lines.splice(ar, 0,
    "  const handleWorkshopStatusChange = async (jobId: string, newStatus: string) => {\r",
    "    try {\r",
    "      const updates: any = { workshop_status: newStatus }\r",
    "      if (newStatus === 'IN_PROGRESS') updates.time_started_at = new Date().toISOString()\r",
    "      await supabase.from('jobs').update(updates).eq('id', jobId)\r",
    "      if (newStatus === 'DISPATCHED') {\r",
    "        const job = workshopJobs.find((j:any) => j.id === jobId)\r",
    "        if (job?.rfq_id) {\r",
    "          await supabase.from('rfqs').update({ status: 'JOB_CREATED' }).eq('id', job.rfq_id)\r",
    "          emailOrderWon({ id: job.rfq_id, description: job.description || '' } as any, job.job_number || '')\r",
    "        }\r",
    "      }\r",
    "      fetchWorkshopJobs()\r",
    "    } catch (e: any) { alert('Error: ' + e.message) }\r",
    "  }\r",
    "\r"
  );
  console.log('[4] handleWorkshopStatusChange at '+(ar+1));
}

// 5. Workshop nav item after Job Board nav item
const jn = lines.findIndex(l => l.includes("'Job Board'") && l.includes('NavItem') && l.includes('Briefcase'));
if (jn > -1) {
  lines.splice(jn+1, 0,
    "          <NavItem icon={<Factory size={18} />} label=\"Workshop Board\" description=\"Floor execution\" active={activeBoard === 'workshop'} accentColor=\"text-orange-400\" onClick={() => { setActiveBoard('workshop'); fetchWorkshopJobs() }} />\r"
  );
  console.log('[5] Workshop nav at '+(jn+2));
}

// 6. Replace 2-way board render with 3-way
const rr = lines.findIndex(l => l.includes('RFQBoard') && l.includes('JobBoard') && l.includes('rfqs={rfqs}'));
if (rr > -1) {
  const prevLine = lines[rr-1];
  lines.splice(rr-1, 2,
    prevLine,
    "              ? <RFQBoard rfqs={rfqs} loading={loading} error={error} onRefresh={fetchRFQs} onCardClick={setSelectedRFQ} selectedId={selectedRFQ?.id} />\r",
    "              : activeBoard === 'job'\r",
    "              ? <JobBoard jobs={jobs} loading={jobsLoading} onStatusChange={handleJobStatusChange} onPrintCard={handlePrintJobCard} onCardClick={setSelectedJob} selectedId={selectedJob?.id} />\r",
    "              : <WorkshopBoard jobs={workshopJobs} loading={workshopLoading} onRefresh={fetchWorkshopJobs} onStatusChange={handleWorkshopStatusChange} />}\r"
  );
  console.log('[6] Board render 3-way at '+(rr));
} else {
  // fallback - find rfq-only render
  const rr2 = lines.findIndex(l => l.includes("activeBoard === 'rfq'") && l.includes('\r') && !l.includes('NavItem') && !l.includes('title') && !l.includes('label'));
  if (rr2 > -1) { console.log('[6] MANUAL - render line at '+(rr2+1)+': '+lines[rr2].trim()); }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('patch_wb6 complete');
'@

Set-Content -Path "patch_wb6.cjs" -Value $cjs -Encoding ASCII
Write-Host "Running patch_wb6.cjs..."
node patch_wb6.cjs