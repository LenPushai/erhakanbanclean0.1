$content = @'
const fs = require('fs');
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

// 1. Add drawingNumber state after notes state in SpawnJobModal
const notesIdx = lines.findIndex(l => l.includes("setNotes] = React.useState('')") && l.includes('notes'));
lines.splice(notesIdx + 1, 0, "  const [drawingNumber, setDrawingNumber] = React.useState(parentJob.drawing_number || '')\r");
console.log('[1] drawingNumber state added at ' + (notesIdx + 2));

// 2. Add drawing_number to child job insert
const childInsertIdx = lines.findIndex(l => l.includes('action_other:') && l.includes('actions.other'));
lines.splice(childInsertIdx + 1, 0, "        drawing_number:            drawingNumber.trim() || null,\r");
console.log('[2] drawing_number added to child job insert at ' + (childInsertIdx + 2));

// 3. Add drawing number input in SpawnJobModal UI (after notes input)
const notesInputIdx = lines.findIndex(l => l.includes('SpawnJobModal') || (l.includes('Notes') && l.includes('setNotes')));
const spawnNotesIdx = lines.findIndex((l, i) => i > 2130 && l.includes('notes') && l.includes('onChange') && l.includes('setNotes'));
const drawingInput = "              <div><label className=\"block text-xs font-medium text-gray-600 mb-1\">Drawing Number</label><input value={drawingNumber} onChange={e => setDrawingNumber(e.target.value)} placeholder=\"e.g. DWG-001\" className=\"w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500\" /></div>\r";
lines.splice(spawnNotesIdx + 1, 0, drawingInput);
console.log('[3] Drawing number input added to SpawnJobModal at ' + (spawnNotesIdx + 2));

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Bug8 patch complete');
'@

Set-Content -Path "patch_bug8.cjs" -Value $content -Encoding ASCII
Write-Host "patch_bug8.cjs written - running now..."
node patch_bug8.cjs