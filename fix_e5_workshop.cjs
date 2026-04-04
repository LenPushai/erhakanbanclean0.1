const fs = require('fs');
let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');
const R = '\r';

// Find the cards filter line and the end of the cards.map block
let startLine = -1, endLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("const cards = jobs.filter(j => j.workshop_status === col.key)")) {
    startLine = i; 
  }
  if (startLine > -1 && lines[i].includes("))}" ) && i > startLine + 20 && i < startLine + 60) {
    endLine = i;
    break;
  }
}
console.log('Start:', startLine + 1, 'End:', endLine + 1);

if (startLine === -1 || endLine === -1) { console.log('ERROR: bounds not found'); process.exit(1); }

const newBlock = [
"        const allCards = jobs.filter(j => j.workshop_status === col.key)" + R,
"        const cards = allCards.filter(j => !j.is_child_job)" + R,
"        const childMap: Record<string, Job[]> = {}" + R,
"        jobs.filter(j => j.is_child_job && j.parent_job_id).forEach(child => {" + R,
"          if (!childMap[child.parent_job_id!]) childMap[child.parent_job_id!] = []" + R,
"          childMap[child.parent_job_id!].push(child)" + R,
"        })" + R,
"        return (" + R,
"          <div key={col.key} className=\"flex flex-col min-w-64 w-64 shrink-0\">" + R,
"            <div className={`${col.color} rounded-t-lg px-3 py-2 flex items-center justify-between`}>" + R,
"              <span className=\"text-white text-sm font-bold\">{col.label}</span>" + R,
"              <span className=\"bg-white bg-opacity-25 text-white text-xs font-bold px-2 py-0.5 rounded-full\">{cards.length}</span>" + R,
"            </div>" + R,
"            <div className=\"flex-1 bg-gray-200 rounded-b-lg p-2 min-h-96 space-y-2\">" + R,
"              {cards.length === 0 && <div className=\"flex items-center justify-center h-20\"><p className=\"text-gray-400 text-xs\">No jobs</p></div>}" + R,
"              {cards.map(job => {" + R,
"                const children = childMap[job.id] || []" + R,
"                const [expanded, setExpanded] = [notes[job.id+'_exp'] === '1', (v: boolean) => setNotes(n => ({...n, [job.id+'_exp']: v?'1':'0'}))]" + R,
"                return (" + R,
"                  <div key={job.id}>" + R,
"                    <div onClick={() => setSelectedJob(job)}" + R,
"                      className=\"bg-white rounded-lg shadow-sm border-2 border-transparent hover:border-orange-300 p-3 cursor-pointer hover:shadow-md transition-all\">" + R,
"                      <div className=\"flex items-center justify-between gap-1 mb-1\">" + R,
"                        <p className=\"text-xs font-bold text-orange-600\">{job.job_number}</p>" + R,
"                        <div className=\"flex items-center gap-1\">" + R,
"                          {job.is_parent && <span className=\"text-xs font-bold px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded\">P</span>}" + R,
"                          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${job.priority==='URGENT'?'bg-red-100 text-red-700':job.priority==='HIGH'?'bg-orange-100 text-orange-700':'bg-gray-100 text-gray-600'}`}>{job.priority}</span>" + R,
"                        </div>" + R,
"                      </div>" + R,
"                      <p className=\"text-sm font-medium text-gray-800 line-clamp-2 mb-1\">{job.description||'No description'}</p>" + R,
"                      <p className=\"text-xs text-gray-500 truncate mb-2\">{job.client_name||'-'}</p>" + R,
"                      {job.due_date && <p className=\"text-xs text-red-500 mb-2\">Due: {new Date(job.due_date).toLocaleDateString('en-ZA')}</p>}" + R,
"                      <div className=\"flex gap-1\" onClick={e => e.stopPropagation()}>" + R,
"                        {nextStatus[col.key] && (" + R,
"                          <button onClick={() => onStatusChange(job.id, nextStatus[col.key])}" + R,
"                            className=\"flex-1 py-1 text-xs font-semibold text-white rounded bg-orange-500 hover:bg-orange-600 transition-colors\">" + R,
"                            {nextLabel[col.key]}" + R,
"                          </button>" + R,
"                        )}" + R,
"                        {col.key === 'IN_PROGRESS' && (" + R,
"                          <button onClick={() => onStatusChange(job.id, 'ON_HOLD')}" + R,
"                            className=\"px-2 py-1 text-xs font-semibold text-white rounded bg-red-400 hover:bg-red-500 transition-colors\">" + R,
"                            Hold" + R,
"                          </button>" + R,
"                        )}" + R,
"                      </div>" + R,
"                      {children.length > 0 && (" + R,
"                        <button onClick={e => { e.stopPropagation(); setExpanded(!expanded) }}" + R,
"                          className=\"mt-2 w-full flex items-center justify-center gap-1 py-1 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded transition-colors\">" + R,
"                          {expanded ? '\u25b2' : '\u25bc'} {children.length} child{children.length > 1 ? ' jobs' : ' job'}" + R,
"                        </button>" + R,
"                      )}" + R,
"                    </div>" + R,
"                    {expanded && children.map(child => (" + R,
"                      <div key={child.id} className=\"ml-3 mt-1 border-l-2 border-purple-200 pl-2\">" + R,
"                        <div onClick={() => setSelectedJob(child)} className=\"bg-white rounded-lg shadow-sm border border-purple-100 p-2 cursor-pointer hover:border-purple-300 transition-all\">" + R,
"                          <div className=\"flex items-center justify-between gap-1\">" + R,
"                            <p className=\"text-xs font-bold text-purple-600\">{child.job_number}</p>" + R,
"                            <span className=\"text-xs px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded\">\u21b3</span>" + R,
"                          </div>" + R,
"                          <p className=\"text-xs text-gray-700 mt-0.5 line-clamp-1\">{child.description||''}</p>" + R,
"                          <div className=\"flex gap-1 mt-1\" onClick={e => e.stopPropagation()}>" + R,
"                            {nextStatus[child.workshop_status||''] && (" + R,
"                              <button onClick={() => onStatusChange(child.id, nextStatus[child.workshop_status||''])}" + R,
"                                className=\"flex-1 py-0.5 text-xs font-semibold text-white rounded bg-orange-500 hover:bg-orange-600\">" + R,
"                                {nextLabel[child.workshop_status||'']}" + R,
"                              </button>" + R,
"                            )}" + R,
"                          </div>" + R,
"                        </div>" + R,
"                      </div>" + R,
"                    ))}" + R,
"                  </div>" + R,
"                )" + R,
"              })}" + R,
"            </div>" + R,
"          </div>" + R,
"        )" + R,
];

lines.splice(startLine, endLine - startLine + 1, ...newBlock);
fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Workshop Board grouping fixed ? new line count:', lines.length);
