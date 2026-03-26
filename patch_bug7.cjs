const fs = require('fs');
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

// 1. Add drawingNumber state after hasDrawing state (line 1021)
const hasDrawingStateIdx = lines.findIndex(l => l.includes('hasDrawing, setHasDrawing') && l.includes('useState'));
lines.splice(hasDrawingStateIdx + 1, 0, "  const [drawingNumber, setDrawingNumber] = React.useState('')\r");
console.log('[1] drawingNumber state added at ' + (hasDrawingStateIdx + 2));

// 2. Add drawing_number to insert (after has_drawing line)
const hasDrawingInsertIdx = lines.findIndex(l => l.includes('has_drawing: hasDrawing'));
lines.splice(hasDrawingInsertIdx + 1, 0, "        drawing_number: drawingNumber.trim() || null,\r");
console.log('[2] drawing_number added to insert at ' + (hasDrawingInsertIdx + 2));

// 3. Add drawing number input after the checkbox UI
const checkboxIdx = lines.findIndex(l => l.includes('djDrawing') && l.includes('hasDrawing'));
const drawingInput = "          <div className=\"mt-2\"><label className=\"block text-xs font-medium text-gray-600 mb-1\">Drawing Number</label><input value={drawingNumber} onChange={e => setDrawingNumber(e.target.value)} placeholder=\"e.g. DWG-001\" className=\"w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500\" /></div>\r";
lines.splice(checkboxIdx + 1, 0, drawingInput);
console.log('[3] Drawing number input added at ' + (checkboxIdx + 2));

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Bug7 patch complete');
