const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src/App.tsx');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');
console.log('Lines:', lines.length);

// Find showMsg line (confirmed at 465, index 464)
const showMsgIdx = lines.findIndex(l => l.includes("const showMsg = (m: string)"));
console.log('showMsg at line:', showMsgIdx + 1);

// Find msg state line to add spawning state next to it
const msgStateIdx = lines.findIndex(l => l.includes("const [msg, setMsg] = React.useState('')"));
console.log('msg state at line:', msgStateIdx + 1);

// 1. Add spawning state after msg state
if (!lines.some(l => l.includes('spawning, setSpawning'))) {
  lines.splice(msgStateIdx + 1, 0, "  const [spawning, setSpawning] = React.useState<string | null>(null)");
  console.log('PASS: spawning state added');
} else {
  console.log('PASS: spawning already exists');
}

// 2. Find updated showMsg position and insert handleSpawnJob after it
const showMsgIdx2 = lines.findIndex(l => l.includes("const showMsg = (m: string)"));

const spawnFn = [
"",
"  const handleSpawnJob = async (lineItem: any) => {",
"    setSpawning(lineItem.id)",
"    try {",
"      const { data: childJob, error: jobError } = await supabase.from('jobs').insert({",
"        parent_job_id: job.id,",
"        is_child_job: true,",
"        is_parent: false,",
"        description: lineItem.description,",
"        client_name: job.client_name,",
"        site_req: job.site_req || null,",
"        due_date: job.due_date || null,",
"        priority: job.priority || 'NORMAL',",
"        entry_type: 'CHILD',",
"        status: 'PENDING',",
"        rfq_no: job.rfq_no || null,",
"        notes: 'Spawned from ' + (job.job_number || 'parent job') + ' - ' + lineItem.description,",
"        date_received: new Date().toISOString().split('T')[0],",
"      }).select().single()",
"      if (jobError) throw jobError",
"      const { error: liError } = await supabase.from('job_line_items').update({ child_job_id: childJob.id }).eq('id', lineItem.id)",
"      if (liError) throw liError",
"      await supabase.from('jobs').update({ is_parent: true }).eq('id', job.id)",
"      const { data: updatedItems } = await supabase",
"        .from('job_line_items')",
"        .select('*, child_job:jobs!child_job_id(job_number)')",
"        .eq('job_id', job.id)",
"        .order('sort_order')",
"      if (updatedItems) setLineItems(updatedItems.map((li: any) => ({ ...li, child_job_number: li.child_job?.job_number || null })))",
"      showMsg('Child job ' + (childJob.job_number || '') + ' created!')",
"      onUpdate({ ...job, is_parent: true })",
"    } catch (err: any) {",
"      showMsg('Error: ' + err.message)",
"    } finally { setSpawning(null) }",
"  }",
];

lines.splice(showMsgIdx2 + 1, 0, ...spawnFn);
console.log('PASS: handleSpawnJob inserted after showMsg');

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
const out = fs.readFileSync(filePath, 'utf8');
console.log('Total lines:', out.split('\n').length);
console.log(out.includes('handleSpawnJob') ? 'PASS: handleSpawnJob in file' : 'FAIL: not found');
console.log(out.includes('spawning, setSpawning') ? 'PASS: spawning state in file' : 'FAIL: spawning state missing');
console.log('Done - run: npx vite --force');
