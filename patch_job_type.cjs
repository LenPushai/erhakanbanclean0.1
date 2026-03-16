const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/App.tsx');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

// Find the Job interface
const jobInterfaceStart = lines.findIndex(l => l.includes('interface Job {') || l.includes('type Job = {'));
console.log('Job interface at line:', jobInterfaceStart + 1);

// Find the closing brace of the Job interface
let jobInterfaceEnd = jobInterfaceStart;
for (let i = jobInterfaceStart + 1; i < lines.length; i++) {
  if (lines[i].trim() === '}') { jobInterfaceEnd = i; break; }
}
console.log('Job interface ends at line:', jobInterfaceEnd + 1);

// Print current interface
console.log('Current Job interface:');
for (let i = jobInterfaceStart; i <= jobInterfaceEnd; i++) {
  console.log(i+1 + ': ' + lines[i]);
}

// Insert missing fields before closing brace
const missingFields = [
  '  entry_type?: string | null',
  '  is_parent?: boolean | null',
  '  is_child_job?: boolean | null',
  '  parent_job_id?: string | null',
  '  is_emergency?: boolean | null',
  '  is_contract_work?: boolean | null',
  '  date_received?: string | null',
  '  site_req?: string | null',
  '  contact_person?: string | null',
  '  contact_phone?: string | null',
  '  contact_email?: string | null',
  '  compiled_by?: string | null',
  '  special_requirements?: string | null',
  '  assigned_employee_name?: string | null',
  '  assigned_supervisor_name?: string | null',
  '  drawing_number?: string | null',
  '  has_drawing?: boolean | null',
  '  has_service_schedule?: boolean | null',
  '  has_internal_order?: boolean | null',
  '  has_qcp?: boolean | null',
  '  action_manufacture?: boolean | null',
  '  action_sandblast?: boolean | null',
  '  action_prepare_material?: boolean | null',
  '  action_service?: boolean | null',
  '  action_paint?: boolean | null',
  '  action_repair?: boolean | null',
  '  action_installation?: boolean | null',
  '  action_cut?: boolean | null',
  '  action_modify?: boolean | null',
  '  action_other?: boolean | null',
];

// Check which fields already exist
const existingInterface = lines.slice(jobInterfaceStart, jobInterfaceEnd).join('\n');
const fieldsToAdd = missingFields.filter(f => {
  const fieldName = f.trim().split('?')[0].split(':')[0];
  return !existingInterface.includes(fieldName);
});

console.log('\nAdding', fieldsToAdd.length, 'missing fields');

// Insert before closing brace
lines.splice(jobInterfaceEnd, 0, ...fieldsToAdd);

// Also fix the jobData.job_number error at line ~1415
// Find the emailOrderWon line and cast jobData
const orderWonEmailIdx = lines.findIndex(l => l.includes('if (jobData) emailOrderWon'));
if (orderWonEmailIdx >= 0) {
  lines[orderWonEmailIdx] = lines[orderWonEmailIdx].replace(
    'if (jobData) emailOrderWon(data, jobData.job_number || \'\')',
    'if (jobData) emailOrderWon(data, (jobData as any).job_number || \'\')'
  );
  console.log('PASS: fixed jobData.job_number cast at line', orderWonEmailIdx + 1);
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Done - run: npm run build');
