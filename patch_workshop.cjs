const fs = require('fs');
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

// 1. Update Board type
const boardTypeIdx = lines.findIndex(l => l.includes("type Board = 'rfq' | 'job'"));
lines[boardTypeIdx] = "type Board = 'rfq' | 'job' | 'workshop'\r";
console.log('[1] Board type updated at ' + (boardTypeIdx + 1));

// 2. Add workshop_status to Job interface
const jobIfaceEnd = lines.findIndex(l => l.includes('client_rfq_number?: string | null'));
lines.splice(jobIfaceEnd + 1, 0, "  workshop_status?: string | null\r");
lines.splice(jobIfaceEnd + 2, 0, "  workshop_notes?: string | null\r");
lines.splice(jobIfaceEnd + 3, 0, "  time_started_at?: string | null\r");
lines.splice(jobIfaceEnd + 4, 0, "  time_total_minutes?: number | null\r");
console.log('[2] Workshop fields added to Job interface');

// 3. Add WORKSHOP_COLUMNS after RFQ_COLUMNS block
const rfqColIdx = lines.findIndex(l => l.includes("const RFQ_COLUMNS = ["));
const workshopCols = [
  "\r",
  "const WORKSHOP_COLUMNS = [\r",
  "  { key: 'NOT_STARTED', label: 'Not Started', color: 'bg-gray-500',   hover: 'hover:border-gray-300'   },\r",
  "  { key: 'IN_PROGRESS', label: 'In Progress', color: 'bg-orange-500', hover: 'hover:border-orange-300' },\r",
  "  { key: 'ON_HOLD',     label: 'On Hold',     color: 'bg-red-400',    hover: 'hover:border-red-300'    },\r",
  "  { key: 'QUALITY_CHECK', label: 'Quality Check', color: 'bg-purple-500', hover: 'hover:border-purple-300' },\r",
  "  { key: 'COMPLETE',    label: 'Complete',    color: 'bg-teal-500',   hover: 'hover:border-teal-300'   },\r",
  "  { key: 'DISPATCHED',  label: 'Dispatched',  color: 'bg-green-600',  hover: 'hover:border-green-300'  },\r",
  "]\r",
];
lines.splice(rfqColIdx, 0, ...workshopCols);
console.log('[3] WORKSHOP_COLUMNS added');

// 4. Add workshop state in App()
const activeBoardIdx = lines.findIndex(l => l.includes("activeBoard, setActiveBoard") && l.includes("useState<Board>"));
lines.splice(activeBoardIdx + 1, 0, "  const [workshopJobs, setWorkshopJobs] = useState<Job[]>([])\r");
lines.splice(activeBoardIdx + 2, 0, "  const [workshopLoading, setWorkshopLoading] = useState(false)\r");
console.log('[4] Workshop state added');

// 5. Add fetchWorkshopJobs after fetchJobs function
const fetchJobsEnd = lines.findIndex(l => l.includes('setJobsLoading(false)') && l.includes('jobs'));
lines.splice(fetchJobsEnd + 2, 0, "  const fetchWorkshopJobs = async () => {\r");
lines.splice(fetchJobsEnd + 3, 0, "    setWorkshopLoading(true)\r");
lines.splice(fetchJobsEnd + 4, 0, "    try {\r");
lines.splice(fetchJobsEnd + 5, 0, "      const { data } = await supabase.from('jobs').select('*').not('workshop_status', 'is', null).order('created_at', { ascending: false })\r");
lines.splice(fetchJobsEnd + 6, 0, "      setWorkshopJobs(data || [])\r");
lines.splice(fetchJobsEnd + 7, 0, "    } finally { setWorkshopLoading(false) }\r");
lines.splice(fetchJobsEnd + 8, 0, "  }\r");
console.log('[5] fetchWorkshopJobs added');

// 6. Add workshop nav item
const jobNavIdx = lines.findIndex(l => l.includes('Job Board') && l.includes('NavItem') && l.includes('Briefcase'));
lines.splice(jobNavIdx + 1, 0, "          <NavItem icon={<Factory size={18} />} label=\"Workshop Board\" description=\"Floor execution\" active={activeBoard === 'workshop'} accentColor=\"text-orange-400\" onClick={() => { setActiveBoard('workshop'); fetchWorkshopJobs() }} />\r");
console.log('[6] Workshop nav item added');

// 7. Update header title
const headerTitleIdx = lines.findIndex(l => l.includes("activeBoard === 'rfq' ? 'RFQ Board' : 'Job Board'") && l.includes('font-bold'));
lines[headerTitleIdx] = "            <h1 className=\"text-xl font-bold text-gray-900\">{activeBoard === 'rfq' ? 'RFQ Board' : activeBoard === 'job' ? 'Job Board' : 'Workshop Board'}</h1>\r";
console.log('[7] Header title updated');

// 8. Update header subtitle
const headerSubIdx = lines.findIndex(l => l.includes("RFQ to job creation - sales pipeline") && l.includes('activeBoard'));
lines[headerSubIdx] = "            <p className=\"text-sm text-gray-500 mt-0.5\">{activeBoard === 'rfq' ? 'RFQ to job creation - sales pipeline' : activeBoard === 'job' ? 'Job created to paid - project tracking' : 'Workshop floor execution tracking'}</p>\r";
console.log('[8] Header subtitle updated');

// 9. Add workshop button in header
const jobBtnIdx = lines.findIndex(l => l.includes('setShowCreateDirectJob') && l.includes('New Job'));
lines.splice(jobBtnIdx + 3, 0, "            {activeBoard === 'workshop' && (\r");
lines.splice(jobBtnIdx + 4, 0, "              <button onClick={() => { setActiveBoard('workshop'); fetchWorkshopJobs() }} className=\"flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors\">\r");
lines.splice(jobBtnIdx + 5, 0, "                <RefreshCw size={14} />Refresh\r");
lines.splice(jobBtnIdx + 6, 0, "              </button>\r");
lines.splice(jobBtnIdx + 7, 0, "            )}\r");
console.log('[9] Workshop header button added');

// 10. Update header badge
const badgeIdx = lines.findIndex(l => l.includes("activeBoard === 'rfq' ? 'bg-blue-100") && l.includes('inline-flex'));
lines[badgeIdx] = "            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${activeBoard === 'rfq' ? 'bg-blue-100 text-blue-700' : activeBoard === 'job' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>\r";
const badgeLabelIdx = lines.findIndex(l => l.includes("activeBoard === 'rfq' ? 'RFQ Board' : 'Job Board'") && l.includes('{'));
lines[badgeLabelIdx] = "              {activeBoard === 'rfq' ? 'RFQ Board' : activeBoard === 'job' ? 'Job Board' : 'Workshop Board'}\r";
console.log('[10] Header badge updated');

// 11. Update main board render
const boardRenderIdx = lines.findIndex(l => l.includes("activeBoard === 'rfq'") && l.includes('RFQBoard') && l.includes('JobBoard'));
lines[boardRenderIdx] = "            {activeBoard === 'rfq'\r";
lines.splice(boardRenderIdx + 1, 0, "              ? <RFQBoard rfqs={rfqs} loading={loading} error={error} onRefresh={fetchRFQs} onCardClick={setSelectedRFQ} selectedId={selectedRFQ?.id} />\r");
lines.splice(boardRenderIdx + 2, 0, "              : activeBoard === 'job'\r");
lines.splice(boardRenderIdx + 3, 0, "              ? <JobBoard jobs={jobs} loading={jobsLoading} onStatusChange={handleJobStatusChange} onPrintCard={handlePrintJobCard} onCardClick={setSelectedJob} selectedId={selectedJob?.id} />\r");
lines.splice(boardRenderIdx + 4, 0, "              : <WorkshopBoard jobs={workshopJobs} loading={workshopLoading} onRefresh={fetchWorkshopJobs} onStatusChange={handleWorkshopStatusChange} />}\r");
// Remove old render line that got shifted
const oldRenderIdx = lines.findIndex((l, i) => i > boardRenderIdx + 4 && l.includes('RFQBoard') && l.includes('JobBoard'));
if (oldRenderIdx > -1) lines.splice(oldRenderIdx, 1);
console.log('[11] Main board render updated');

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Workshop patch phase 1 complete');
