const fs = require('fs');

const filePath = 'src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add compiledBy state after assignedSupervisor state
const oldState = "  const [assignedSupervisor, setAssignedSupervisor] = React.useState(job.assigned_supervisor_name || '')";
const newState = "  const [assignedSupervisor, setAssignedSupervisor] = React.useState(job.assigned_supervisor_name || '')\n  const [compiledBy, setCompiledBy] = React.useState((job as any).compiled_by || '')";

if (content.includes(oldState)) {
  content = content.replace(oldState, newState);
  console.log('PASS: compiledBy state added');
} else {
  console.log('FAIL: assignedSupervisor state not found');
}

// 2. Add compiled_by to handleSave
const oldSave = "        assigned_employee_name: assignedEmployee || null,\n        assigned_supervisor_name: assignedSupervisor || null,\n        notes: notes || null,";
const newSave = "        assigned_employee_name: assignedEmployee || null,\n        assigned_supervisor_name: assignedSupervisor || null,\n        compiled_by: compiledBy || null,\n        notes: notes || null,";

if (content.includes(oldSave)) {
  content = content.replace(oldSave, newSave);
  console.log('PASS: compiled_by added to handleSave');
} else {
  console.log('FAIL: handleSave fields not found');
}

// 3. Add Compiled By input field to UI — after the employee/supervisor grid
const oldGrid = `        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Assigned Employee</label>
            <input value={assignedEmployee} onChange={e => setAssignedEmployee(e.target.value)} placeholder="Employee name..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Supervisor</label>
            <input value={assignedSupervisor} onChange={e => setAssignedSupervisor(e.target.value)} placeholder="Supervisor..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
        </div>`;

const newGrid = `        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Assigned Employee</label>
            <input value={assignedEmployee} onChange={e => setAssignedEmployee(e.target.value)} placeholder="Employee name..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Supervisor</label>
            <input value={assignedSupervisor} onChange={e => setAssignedSupervisor(e.target.value)} placeholder="Supervisor..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Compiled By</label>
          <select value={compiledBy} onChange={e => setCompiledBy(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="">Select...</option>
            <option value="Cherise">Cherise</option>
            <option value="Juanic">Juanic</option>
          </select>
        </div>`;

if (content.includes(oldGrid)) {
  content = content.replace(oldGrid, newGrid);
  console.log('PASS: Compiled By field added to UI');
} else {
  console.log('FAIL: grid not found');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done - run: npx vite --force');
