const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/App.tsx');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');
console.log('Lines:', lines.length);

// Find the misplaced block: starts at "// CREATE DIRECT JOB MODAL"
const startIdx = lines.findIndex(l => l.trim() === '// CREATE DIRECT JOB MODAL');
if (startIdx === -1) { console.log('FAIL: block not found'); process.exit(1); }
console.log('Found CreateDirectJobModal block at line:', startIdx + 1);

// Find end of block: look for closing "}" that ends the function
// The function ends with a lone "}" line after the JSX return
let endIdx = startIdx;
let depth = 0;
let inFunction = false;
for (let i = startIdx; i < lines.length; i++) {
  const l = lines[i];
  if (l.includes('function CreateDirectJobModal')) inFunction = true;
  if (inFunction) {
    for (const ch of l) {
      if (ch === '{') depth++;
      if (ch === '}') depth--;
    }
    if (inFunction && depth === 0 && i > startIdx + 5) {
      endIdx = i;
      break;
    }
  }
}
console.log('Block ends at line:', endIdx + 1);

// Extract the block
const block = lines.splice(startIdx, endIdx - startIdx + 1);
// Remove the blank line before the block if it exists
if (lines[startIdx - 1] && lines[startIdx - 1].trim() === '') {
  lines.splice(startIdx - 1, 1);
}
console.log('Extracted', block.length, 'lines');

// Find "// CREATE RFQ MODAL" in the (now shorter) file
const insertIdx = lines.findIndex(l => l.trim() === '// CREATE RFQ MODAL');
if (insertIdx === -1) { console.log('FAIL: insert point not found'); process.exit(1); }
console.log('Inserting before line:', insertIdx + 1);

// Insert block + blank line before the RFQ modal comment
lines.splice(insertIdx, 0, ...block, '');

// Write
fs.writeFileSync(filePath, lines.join('\n'), 'utf8');

// Verify
const out = fs.readFileSync(filePath, 'utf8');
const outLines = out.split('\n');
const djLine = outLines.findIndex(l => l.includes('function CreateDirectJobModal')) + 1;
const rqLine = outLines.findIndex(l => l.trim() === '// CREATE RFQ MODAL') + 1;
console.log('CreateDirectJobModal at line:', djLine);
console.log('// CREATE RFQ MODAL at line:  ', rqLine);
console.log(djLine < rqLine ? 'PASS: correct order' : 'FAIL: wrong order');
console.log('Total lines:', outLines.length);
console.log('Done - run: npx vite --force');
