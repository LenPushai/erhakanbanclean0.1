const fs = require('fs');

const filePath = 'src/App.tsx';
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

const spawnIdx = lines.findIndex(l => l.includes('const handleSpawnJob = async'));
console.log('handleSpawnJob at line:', spawnIdx + 1);

// Find the insert block start and end
const insertStart = lines.findIndex((l, i) => i > spawnIdx && l.includes('supabase.from(\'jobs\').insert({'));
const insertEnd = lines.findIndex((l, i) => i > insertStart && l.includes('}).select().single()'));
console.log('Insert block:', insertStart + 1, '-', insertEnd + 1);

// Replace the insert block with one that includes child job number logic
const newInsertLines = [
  '      // Count existing children to determine suffix (A, B, C...)',
  '      const { data: existingChildren } = await supabase',
  '        .from(\'jobs\')',
  '        .select(\'id\')',
  '        .eq(\'parent_job_id\', job.id)',
  '      const suffix = String.fromCharCode(65 + (existingChildren?.length || 0)) // A, B, C...',
  '      const childJobNumber = (job.job_number || \'JOB\') + \'-\' + suffix',
  '      const { data: childJob, error: jobError } = await supabase.from(\'jobs\').insert({',
  '        parent_job_id: job.id,',
  '        is_child_job: true,',
  '        is_parent: false,',
  '        job_number: childJobNumber,',
  '        description: lineItem.description,',
  '        client_name: job.client_name,',
  '        site_req: job.site_req || null,',
  '        due_date: job.due_date || null,',
  '        priority: job.priority || \'NORMAL\',',
  '        entry_type: \'CHILD\',',
  '        status: \'PENDING\',',
  '        rfq_no: job.rfq_no || null,',
  '        notes: \'Spawned from \' + (job.job_number || \'parent job\') + \' - \' + lineItem.description,',
  '        date_received: new Date().toISOString().split(\'T\')[0],',
  '      }).select().single()',
];

lines.splice(insertStart, insertEnd - insertStart + 1, ...newInsertLines);
console.log('PASS: child job number logic added');

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Done - run: npx vite --force');
