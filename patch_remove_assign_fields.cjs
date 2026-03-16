const fs = require('fs');

const filePath = 'src/App.tsx';
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

// Find the grid that contains Assigned Employee and Supervisor
const startIdx = lines.findIndex(l => l.includes('Assigned Employee') && l.includes('block text-xs'));
// Go back to find the opening <div className="grid
let gridStart = startIdx;
for (let i = startIdx; i >= 0; i--) {
  if (lines[i].includes('grid grid-cols-2 gap-4')) { gridStart = i; break; }
}
// Find the closing </div> of this grid
let gridEnd = gridStart;
let depth = 0;
for (let i = gridStart; i < lines.length; i++) {
  const t = lines[i].trim();
  if (t.startsWith('<div')) depth++;
  if (t === '</div>') { depth--; if (depth === 0) { gridEnd = i; break; } }
}

console.log('Assigned Employee grid: lines', gridStart+1, '-', gridEnd+1);
lines.splice(gridStart, gridEnd - gridStart + 1);
console.log('PASS: Assigned Employee + Supervisor fields removed');

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Done - run: npx vite --force');
