const fs = require('fs');

const filePath = 'src/App.tsx';
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

// 1. Add compiled_by to handleSave at line 603 (after assignedSupervisor)
// Line 602: assigned_supervisor_name: assignedSupervisor || null,
const saveIdx = lines.findIndex(l => l.includes('assigned_supervisor_name: assignedSupervisor || null'));
if (saveIdx >= 0) {
  lines.splice(saveIdx + 1, 0, '        compiled_by: compiledBy || null,');
  console.log('PASS: compiled_by added to handleSave at line', saveIdx + 2);
} else {
  console.log('FAIL: assignedSupervisor save line not found');
}

// 2. Add Compiled By field after the employee/supervisor grid (line 671 </div>)
const gridEndIdx = lines.findIndex(l => l.includes('Supervisor') && l.includes('placeholder="Supervisor..."'));
// Find the closing </div></div> after this
let closingIdx = gridEndIdx;
for (let i = gridEndIdx + 1; i < lines.length; i++) {
  if (lines[i].trim() === '</div>') {
    closingIdx = i;
    // Check next non-empty line
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].trim() === '</div>') {
        closingIdx = j;
        break;
      }
      if (lines[j].trim() !== '') break;
    }
    break;
  }
}
console.log('Grid closing div at line:', closingIdx + 1);

const compiledByField = [
  '        <div>',
  '          <label className="block text-xs font-medium text-gray-500 mb-1">Compiled By</label>',
  '          <select value={compiledBy} onChange={e => setCompiledBy(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">',
  '            <option value="">Select...</option>',
  '            <option value="Cherise">Cherise</option>',
  '            <option value="Juanic">Juanic</option>',
  '          </select>',
  '        </div>',
];

lines.splice(closingIdx + 1, 0, ...compiledByField);
console.log('PASS: Compiled By field added to UI');

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Done - run: npx vite --force');
